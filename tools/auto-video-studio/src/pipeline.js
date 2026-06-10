// Pipeline tạo 1 video hoàn chỉnh từ (chủ đề + nội dung + voice + nhạc).
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateScenes, scenesFromPlan } from "./scriptgen.js";
import { buildComposition } from "./composition.js";
import { synthesize, audioDuration } from "./voices.js";
import { resolveMusic } from "./music.js";
import { getVbeeConfig } from "./settings.js";
import { generateScript } from "./openrouter.js";

function resolveVoiceLabel(ref) {
  const v = getVbeeConfig().voices.find((x) => x.code === ref);
  return `Vbee: ${v?.label || ref || "?"}`;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WORKDIR = path.join(ROOT, "workdir");
const OUTPUT = path.join(ROOT, "output");
fs.mkdirSync(WORKDIR, { recursive: true });
fs.mkdirSync(OUTPUT, { recursive: true });

// Mốc thời gian - giọng đọc LIỀN MẠCH (các cảnh nối tiếp nhau theo độ dài audio,
// KHÔNG chèn khoảng lặng). Frame chỉ minh hoạ, chuyển cảnh diễn ra trên nền tiếng nói.
const LEAD = 0.4; // beat nhỏ đầu video trước khi bắt đầu nói
const END_PAD = 0.8; // đệm cuối

const HF_BIN = process.env.HYPERFRAMES_BIN || "npx";
const HF_ARGS_PREFIX = process.env.HYPERFRAMES_BIN ? [] : ["--yes", "hyperframes@latest"];

function run(cmd, args, { cwd, onLine, shell = false } = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { cwd, shell });
    let out = "";
    let err = "";
    const handle = (buf, isErr) => {
      const s = buf.toString();
      if (isErr) err += s;
      else out += s;
      if (onLine) s.split(/\r?\n|\r/).forEach((l) => l.trim() && onLine(l.trim()));
    };
    p.stdout.on("data", (d) => handle(d, false));
    p.stderr.on("data", (d) => handle(d, true));
    p.on("error", reject);
    p.on("close", (code) => {
      if (code === 0) resolve({ out, err });
      else
        reject(
          new Error(
            `${cmd} exit ${code}: ${(err || out).split("\n").slice(-4).join(" | ").slice(0, 400)}`,
          ),
        );
    });
  });
}

const ffmpeg = (args, opts) => run("ffmpeg", ["-y", ...args], opts);

// Cắt im lặng đầu/đuôi và rút ngắn khoảng nghỉ trong câu (giữ tối đa 0.25s)
// → giọng đọc liền mạch, không ngắt nghỉ; đồng thời chống lỗi TTS sinh dư im lặng.
async function trimSilence(p) {
  const tmp = p.replace(/(\.[^.]+)$/, ".trim$1");
  const f =
    "silenceremove=start_periods=1:start_silence=0:start_threshold=-45dB:" +
    "stop_periods=-1:stop_silence=0.25:stop_threshold=-45dB";
  try {
    await ffmpeg(["-i", p, "-af", f, tmp]);
    if (fs.existsSync(tmp) && fs.statSync(tmp).size > 400) {
      fs.rmSync(p, { force: true });
      fs.renameSync(tmp, p);
    } else {
      fs.rmSync(tmp, { force: true });
    }
  } catch {
    try {
      fs.rmSync(tmp, { force: true });
    } catch {}
  }
}

/**
 * @param {object} task { id, topic, content, voice, music }
 * @param {(p:{phase:string,percent:number,detail?:string})=>void} progress
 * @returns {Promise<{videoPath:string, duration:number, scenes:number, voice:string, music:string}>}
 */
export async function produceVideo(task, progress = () => {}) {
  const id = task.id;
  const dir = path.join(WORKDIR, `task-${id}`);
  const audioDir = path.join(dir, "audio");
  const rendersDir = path.join(dir, "renders");
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(audioDir, { recursive: true });
  fs.mkdirSync(rendersDir, { recursive: true });

  const voiceSpec = { ref: task.voiceRef };
  const voiceLabel = resolveVoiceLabel(task.voiceRef);

  // 1) Sinh kịch bản - AI (OpenRouter) hoặc từ nội dung có sẵn
  const autogen = typeof task.autogen === "boolean" ? task.autogen : !task.content;
  let scenes;
  if (autogen) {
    progress({ phase: "Sinh nội dung (AI)", percent: 3 });
    const script = await generateScript(task.topic, { guidance: task.content });
    scenes = scenesFromPlan({ topic: task.topic, title: script.title, scenes: script.scenes });
  } else {
    progress({ phase: "Soạn kịch bản", percent: 4 });
    scenes = generateScenes({ topic: task.topic, content: task.content });
  }

  // 2) TTS từng scene + đo thời lượng
  const durations = [];
  const scenePaths = [];
  for (let i = 0; i < scenes.length; i++) {
    progress({
      phase: "Tạo giọng đọc",
      percent: 6 + Math.round((i / scenes.length) * 26),
      detail: `Câu ${i + 1}/${scenes.length}`,
    });
    const base = path.join(audioDir, `s${i}`);
    // eslint-disable-next-line no-await-in-loop
    const p = await synthesize(scenes[i].narration, voiceSpec, base);
    // eslint-disable-next-line no-await-in-loop
    await trimSilence(p);
    scenePaths.push(p);
    // eslint-disable-next-line no-await-in-loop
    durations.push(await audioDuration(p));
  }

  // 3) Mốc thời gian LIỀN MẠCH: cảnh i hiện đúng lúc đoạn audio i bắt đầu,
  //    đoạn sau nối ngay đoạn trước (không khoảng lặng) → giọng đọc liên tục.
  const starts = [];
  const narrStarts = [];
  let cursor = LEAD;
  for (let i = 0; i < scenes.length; i++) {
    starts[i] = cursor;
    narrStarts[i] = cursor;
    cursor += durations[i];
  }
  const total = cursor + END_PAD;

  // 4) Dựng composition + ghi index.html
  progress({ phase: "Dựng composition", percent: 34 });
  const html = buildComposition({
    id: `vid${id}`,
    scenes,
    starts,
    total,
    aspectRatio: task.aspectRatio || "16:9",
  });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");

  // 5) Render video (im lặng)
  progress({ phase: "Render video", percent: 38 });
  const silentMp4 = path.join(rendersDir, "silent.mp4");
  const workers = process.env.HF_WORKERS || "2";
  await run(
    HF_BIN,
    [...HF_ARGS_PREFIX, "render", ".", "--output", "renders/silent.mp4", "--workers", workers],
    {
      cwd: dir,
      shell: process.platform === "win32", // npx là npx.cmd trên Windows
      onLine: (l) => {
        const m = l.match(/Capturing frame (\d+)\/(\d+)/);
        if (m) {
          const frac = Number(m[1]) / Number(m[2]);
          progress({
            phase: "Render video",
            percent: 38 + Math.round(frac * 42),
            detail: `${m[1]}/${m[2]} frame`,
          });
        } else if (/Encoding video|Assembling/.test(l)) {
          progress({ phase: "Render video", percent: 82, detail: "Mã hoá" });
        }
      },
    },
  );
  if (!fs.existsSync(silentMp4)) throw new Error("Render không tạo ra file video.");

  // 6) Trộn các đoạn giọng đọc thành 1 track khớp thời gian
  progress({ phase: "Trộn giọng đọc", percent: 85 });
  const narrationWav = path.join(audioDir, "narration.wav");
  await buildNarration(scenePaths, narrStarts, total, narrationWav);

  // 7) Ghép giọng + nhạc nền (duck) vào video
  progress({ phase: "Ghép nhạc nền", percent: 92 });
  const musicTrack = resolveMusic(task.music);
  const finalPath = path.join(OUTPUT, `task-${id}.mp4`);
  await muxFinal({
    silentMp4,
    narrationWav,
    musicPath: musicTrack?.path,
    total,
    outPath: finalPath,
  });

  progress({ phase: "Hoàn tất", percent: 100 });
  return {
    videoPath: finalPath,
    duration: Number(total.toFixed(2)),
    scenes: scenes.length,
    voice: voiceLabel,
    music: musicTrack ? musicTrack.name : "(không có nhạc)",
  };
}

async function buildNarration(scenePaths, narrStarts, total, outPath) {
  const inputs = [];
  const filters = [];
  const mixLabels = [];
  scenePaths.forEach((p, i) => {
    inputs.push("-i", p);
    const delayMs = Math.round(narrStarts[i] * 1000);
    filters.push(`[${i}:a]aresample=44100,adelay=${delayMs}:all=1[d${i}]`);
    mixLabels.push(`[d${i}]`);
  });
  const n = scenePaths.length;
  const filter =
    filters.join(";") +
    `;${mixLabels.join("")}amix=inputs=${n}:normalize=0:dropout_transition=0[mix];` +
    `[mix]apad,atrim=0:${total.toFixed(3)},aresample=44100[out]`;
  await ffmpeg([
    ...inputs,
    "-filter_complex",
    filter,
    "-map",
    "[out]",
    "-ac",
    "2",
    "-ar",
    "44100",
    outPath,
  ]);
}

async function muxFinal({ silentMp4, narrationWav, musicPath, total, outPath }) {
  const T = total.toFixed(3);
  if (musicPath && fs.existsSync(musicPath)) {
    // asplit: dùng giọng đọc 2 nơi (1 để mix, 1 làm sidechain ducking nhạc nền)
    const filter =
      `[1:a]aresample=44100,apad,atrim=0:${T},asetpts=PTS-STARTPTS,asplit=2[voiceA][voiceB];` +
      `[2:a]aresample=44100,volume=0.18,apad,atrim=0:${T},asetpts=PTS-STARTPTS[bg];` +
      `[bg][voiceB]sidechaincompress=threshold=0.025:ratio=7:attack=15:release=350[bgduck];` +
      `[voiceA][bgduck]amix=inputs=2:normalize=0:dropout_transition=0[a]`;
    await ffmpeg([
      "-i",
      silentMp4,
      "-i",
      narrationWav,
      "-stream_loop",
      "-1",
      "-i",
      musicPath,
      "-filter_complex",
      filter,
      "-map",
      "0:v",
      "-map",
      "[a]",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-shortest",
      outPath,
    ]);
  } else {
    await ffmpeg([
      "-i",
      silentMp4,
      "-i",
      narrationWav,
      "-map",
      "0:v",
      "-map",
      "1:a",
      "-c:v",
      "copy",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-shortest",
      outPath,
    ]);
  }
}
