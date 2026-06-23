// Pipeline tạo 1 video hoàn chỉnh từ (chủ đề + nội dung + voice + nhạc).
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateScenes, scenesFromPlan } from "./scriptgen.js";
import { buildComposition } from "./composition.js";
import { themeBg, DEFAULT_THEME_ID, themeStyle, randomFormat } from "./themes.js";
import { synthesize, synthesizeWithUrl, audioDuration } from "./voices.js";
import { resolveMusic } from "./music.js";
import { getVbeeConfig } from "./settings.js";
import { generateScript } from "./openrouter.js";
import { generateHeygenVideo } from "./heygen.js";
import { fetchImage, creditLine } from "./images.js";
import { FFMPEG, FFMPEG_DIR, FFPROBE_DIR } from "./bin.js";

// Nhồi vào ĐẦU PATH:
//  1) Thư mục Node ĐANG chạy server (process.execPath) -> tiến trình con `npx`/`node`
//     (engine hyperframes dùng `#!/usr/bin/env node`) sẽ dùng ĐÚNG Node này, KHÔNG rơi về
//     Node 18 hệ thống ở /usr/bin (nguyên nhân lỗi "npx exit 1 ... Node.js v18 / styleText").
//  2) Thư mục ffmpeg/ffprobe (bundled) -> engine tìm thấy mà không cần cài hệ thống.
// Tự dò Chrome để engine khỏi tải Chromium.
(() => {
  const nodeDir = path.dirname(process.execPath); // vd ~/.nvm/versions/node/v22.x/bin
  const extra = [nodeDir, FFMPEG_DIR, FFPROBE_DIR].filter(Boolean).join(path.delimiter);
  if (extra) process.env.PATH = extra + path.delimiter + (process.env.PATH || "");
  if (!process.env.PUPPETEER_EXECUTABLE_PATH) {
    const chromes = [
      "/usr/bin/google-chrome",
      "/usr/bin/google-chrome-stable",
      "/usr/bin/chromium",
      "/usr/bin/chromium-browser",
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
    ];
    const found = chromes.find((p) => fs.existsSync(p));
    if (found) process.env.PUPPETEER_EXECUTABLE_PATH = found;
  }
})();

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

// ----- Chất lượng video khi ghép HeyGen (chống mờ) -----
// Render HeyGen ở độ phân giải CAO hơn nửa khung rồi thu nhỏ bằng lanczos -> nét hơn,
// giảm nhiễu nén. Giữ đúng tỷ lệ panel để khỏi crop-phóng-to (nguyên nhân chính gây mờ).
const HEYGEN_SS = Number(process.env.HEYGEN_SUPERSAMPLE || 2); // bội số render (1 = tắt)
const HEYGEN_MAX_DIM = Number(process.env.HEYGEN_MAX_DIM || 1920); // trần mỗi chiều (giới hạn HeyGen)
const HEYGEN_PRESET = process.env.HEYGEN_PRESET || "slow"; // x264 preset (chất lượng > tốc độ)
const HEYGEN_CRF = process.env.HEYGEN_CRF || "18"; // crf thấp = nét hơn

const evenN = (n) => {
  const v = Math.round(Number(n) || 0);
  return v % 2 === 0 ? v : v + 1;
};

// ----- Độ phân giải đầu ra: TỐI THIỂU 2K -----
// Thiết kế gốc 1920x1080 (16:9) / 1080x1920 (9:16). Scale 4/3 -> 2560x1440 / 1440x2560 = 2K (QHD).
// Đặt OUTPUT_SCALE=2 để ra 4K (3840x2160). Engine render đúng cỡ khung -> nét (không upscale bitmap).
const OUTPUT_SCALE = Math.max(1, Number(process.env.OUTPUT_SCALE || 4 / 3));
// ----- Phóng to chữ cho dễ đọc -----
// Chữ thường hơi nhỏ so với khung -> phóng nhẹ. HeyGen chỉ chiếm NỬA khung (chữ bị thu
// thêm ~0.75x) -> phóng mạnh hơn nhiều để to, rõ. Tinh chỉnh qua env nếu cần.
const TEXT_SCALE = Math.max(0.6, Number(process.env.TEXT_SCALE || 1.12));
const HEYGEN_TEXT_SCALE = Math.max(0.6, Number(process.env.HEYGEN_TEXT_SCALE || 1.5));
// Scale toàn bộ hình học chia khung HeyGen để khung cuối cũng đạt 2K.
function scaleGeo(g, s) {
  const e = (n) => evenN(n * s);
  const sc = (o) => ({ x: e(o.x), y: e(o.y), w: e(o.w), h: e(o.h) });
  return {
    final: { w: evenN(g.final.w * s), h: evenN(g.final.h * s) },
    hf: { ...sc(g.hf), design: g.hf.design },
    hg: sc(g.hg),
  };
}

// Kích thước yêu cầu HeyGen render: panel * bội số, cùng tỷ lệ, không vượt trần mỗi chiều.
function heygenRequestDims(panelW, panelH) {
  let f = Math.max(1, HEYGEN_SS);
  f = Math.min(f, HEYGEN_MAX_DIM / panelW, HEYGEN_MAX_DIM / panelH);
  return { w: evenN(panelW * f), h: evenN(panelH * f) };
}

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

const ffmpeg = (args, opts) => run(FFMPEG, ["-y", ...args], opts);

// Color grade NHẸ theo design (chất phim riêng từng mẫu). CHỈ áp ở chế độ chỉ-slide;
// KHÔNG áp ở chế độ HeyGen để giữ nguyên chất lượng/độ trung thực của avatar.
// Tắt toàn cục bằng env DISABLE_GRADE=1.
const GRADE = {
  "neo-brutal": "eq=contrast=1.06:saturation=1.12",
  "vaporwave": "eq=saturation=1.22:contrast=1.04,colorbalance=rs=0.04:bs=0.06:gm=-0.02",
  "y2k-aero": "eq=brightness=0.02:saturation=1.08",
  "editorial": "eq=saturation=0.93:gamma=1.03,colorbalance=rs=0.05:gs=0.01:bs=-0.04",
  "aurora-mesh": "eq=saturation=1.12:contrast=1.04",
  "pop-comic": "eq=saturation=1.24:contrast=1.08",
  "neon-glow": "eq=contrast=1.12:saturation=1.18,colorbalance=bs=0.04",
  "swiss-mono": "eq=contrast=1.05",
  "frost-glass": "eq=saturation=1.06,colorbalance=bs=0.05:rs=-0.02",
  "blueprint": "colorbalance=rs=-0.05:bs=0.07,eq=saturation=0.95:contrast=1.05",
};
function gradeFor(themeId) {
  if (process.env.DISABLE_GRADE === "1") return "";
  return GRADE[themeStyle(themeId)] || "";
}

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
// Engine render (npx hyperframes) dùng API styleText của Node -> CẦN Node >= 20.12 (khuyến nghị 22).
// Kiểm tra SỚM để báo lỗi rõ ràng thay vì "npx exit 1 ... handleMainPromise" khó hiểu.
export function ensureRenderNode() {
  const [maj, min] = process.versions.node.split(".").map(Number);
  if (maj < 20 || (maj === 20 && min < 12)) {
    throw new Error(
      `Bước render cần Node >= 20.12 (khuyến nghị 22), đang chạy v${process.versions.node}. ` +
        `Chạy tool bằng Node 22: "nvm install 22 && nvm use 22 && npm start" hoặc chạy "bash setup.sh".`,
    );
  }
}

export async function produceVideo(task, progress = () => {}) {
  ensureRenderNode();
  const id = task.id;
  const dir = path.join(WORKDIR, `task-${id}`);
  const audioDir = path.join(dir, "audio");
  const rendersDir = path.join(dir, "renders");
  fs.rmSync(dir, { recursive: true, force: true });
  fs.mkdirSync(audioDir, { recursive: true });
  fs.mkdirSync(rendersDir, { recursive: true });

  const voiceSpec = { ref: task.voiceRef };
  const voiceLabel = resolveVoiceLabel(task.voiceRef);

  // 0) FORMAT LINH HOẠT: random 1 bộ format cho video này (màu vẫn cố định theo mẫu).
  //    media -> đẩy vào AI để chọn bố cục; transition/caption/entrance -> truyền vào composition.
  const fmt = randomFormat();
  task._fmt = fmt;

  // 1) Sinh kịch bản - AI (OpenRouter) hoặc từ nội dung có sẵn (theo media random)
  const scenes = await buildScenes(task, progress, fmt.media);

  // 1a) Quét sạch em-dash/en-dash khỏi MỌI text cảnh (TTS + hiển thị) - yêu cầu cứng của dự án.
  sanitizeScenes(scenes);

  // 1b) Tìm & tải ẢNH THẬT cho các cảnh ảnh (photo/split/gallery hoặc cảnh có "query").
  //     Áp dụng cho CẢ hai chế độ (đặt trước nhánh HeyGen). Best-effort: lỗi -> bỏ ảnh.
  await resolveSceneImages(scenes, path.join(dir, "img"), progress);

  // Chế độ ghép HeyGen (avatar nói cùng slide) đi nhánh riêng.
  if (task.mode === "heygen") {
    return await produceHeygenComposite({
      task,
      dir,
      audioDir,
      rendersDir,
      scenes,
      voiceSpec,
      voiceLabel,
      progress,
      format: fmt,
    });
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
    theme: task.theme || DEFAULT_THEME_ID,
    font: task.font || "auto", // font người dùng chọn (override font của mẫu)
    textScale: TEXT_SCALE, // phóng chữ cho dễ đọc
    format: task._fmt, // format random đã chọn cho video này
    renderScale: OUTPUT_SCALE, // render TỐI THIỂU 2K
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
    videoFilter: gradeFor(task.theme), // color grade nhẹ theo design (chỉ chế độ slide)
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

// Tìm & tải ảnh thật cho các cảnh cần hình. Sửa scenes tại chỗ:
//  - photo/split: set scene.image = "img/sN.ext" (+ _credit); fail -> degrade layout.
//  - gallery: set scene.images = [rel...]; fail -> section.
//  - cảnh khác có "query": cũng gắn ảnh (dùng cho mọi layout muốn minh hoạ).
// Best-effort, tuần tự (nhẹ cho API), giới hạn số ảnh/clip để khỏi chậm.
/* eslint-disable no-await-in-loop */
async function resolveSceneImages(scenes, imgDir, progress = () => {}) {
  if (process.env.DISABLE_AUTO_IMAGES === "1") return;
  let count = 0;
  const MAX = Number(process.env.MAX_AUTO_IMAGES || 4); // hạn chế ảnh ngoài (ưu tiên code/browser dựng HTML)
  for (let i = 0; i < scenes.length; i++) {
    if (count >= MAX) break;
    const s = scenes[i];
    const wantImg = s.layout === "photo" || s.layout === "split" || s.layout === "gallery";
    if (!wantImg && !s.query) continue;
    progress({ phase: "Tìm ảnh minh hoạ", percent: 5, detail: `Cảnh ${i + 1}/${scenes.length}` });
    try {
      if (s.layout === "gallery") {
        const qs = (Array.isArray(s.images) ? s.images : [])
          .map((x) => (typeof x === "string" ? x : x && (x.query || x.src)))
          .filter(Boolean);
        const list = qs.length ? qs : [s.query || s.heading].filter(Boolean);
        const rels = [];
        let cred = "";
        for (let k = 0; k < Math.min(3, list.length) && count < MAX; k++) {
          const r = await fetchImage(list[k], imgDir, `s${i}_${k}`);
          count++;
          if (r) {
            rels.push(`img/${r.name}`);
            cred = cred || creditLine(r);
          }
        }
        if (rels.length) {
          s.images = rels;
          if (cred) s._credit = cred;
        } else {
          s.layout = "section"; // không có ảnh -> mở phần bằng tiêu đề
        }
      } else {
        const q = s.query || s.heading || s.title;
        const r = q ? await fetchImage(q, imgDir, `s${i}`) : null;
        count++;
        if (r) {
          s.image = `img/${r.name}`;
          s._credit = creditLine(r);
        } else if (s.layout === "photo") {
          s.layout = "section";
        } else if (s.layout === "split") {
          s.layout = "point"; // vẫn còn heading + body
        }
      }
    } catch {
      // bỏ qua: cảnh không có ảnh, layout tự degrade ở trên nếu cần
    }
  }
}
/* eslint-enable no-await-in-loop */

// Bỏ em-dash/en-dash (và các biến thể) khỏi chuỗi -> thay bằng gạch nối thường.
// Dự án TUYỆT ĐỐI không dùng em-dash trong video.
const NO_DASH_RE = /[‒–—―−]/g;
function noEmDash(v) {
  return typeof v === "string" ? v.replace(NO_DASH_RE, "-") : v;
}
// Quét đệ quy toàn bộ string trong mảng scenes (narration, heading, items, steps, stats...).
function sanitizeScenes(scenes) {
  const walk = (v) => {
    if (typeof v === "string") return noEmDash(v);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      for (const k of Object.keys(v)) v[k] = walk(v[k]);
      return v;
    }
    return v;
  };
  if (Array.isArray(scenes)) scenes.forEach((s) => walk(s));
  return scenes;
}

// Sinh danh sách scene từ task (AI hoặc nội dung có sẵn) - dùng chung 2 chế độ.
async function buildScenes(task, progress, media) {
  const autogen = typeof task.autogen === "boolean" ? task.autogen : !task.content;
  if (autogen) {
    progress({ phase: "Sinh nội dung (AI)", percent: 3 });
    const script = await generateScript(task.topic, { guidance: task.content, media });
    return scenesFromPlan({ topic: task.topic, title: script.title, scenes: script.scenes });
  }
  progress({ phase: "Soạn kịch bản", percent: 4 });
  return generateScenes({ topic: task.topic, content: task.content });
}

// Hình học chia đôi khung cho chế độ HeyGen.
//  - 9:16 (1080x1920): trên = Hyperframe, dưới = HeyGen.
//  - 16:9 (1920x1080): trái = HeyGen, phải = Hyperframe.
function splitLayout(aspectRatio) {
  if (aspectRatio === "9:16") {
    return {
      final: { w: 1080, h: 1920 },
      hf: { x: 0, y: 0, w: 1080, h: 960, design: "16:9" }, // nửa trên (ngang)
      hg: { x: 0, y: 960, w: 1080, h: 960 }, // nửa dưới
    };
  }
  return {
    final: { w: 1920, h: 1080 },
    hg: { x: 0, y: 0, w: 960, h: 1080 }, // trái
    hf: { x: 960, y: 0, w: 960, h: 1080, design: "9:16" }, // phải (dọc)
  };
}

// Chế độ HeyGen: Vbee đọc TOÀN BỘ narration 1 lần -> URL công khai cho HeyGen + audio cuối.
// Hyperframe render vào đúng nửa khung; HeyGen dựng song song; ffmpeg ghép lại.
async function produceHeygenComposite({
  task,
  dir,
  audioDir,
  rendersDir,
  scenes,
  voiceSpec,
  voiceLabel,
  progress,
  format,
}) {
  const id = task.id;
  const aspectRatio = task.aspectRatio === "9:16" ? "9:16" : "16:9";
  const geo = scaleGeo(splitLayout(aspectRatio), OUTPUT_SCALE); // khung HeyGen cũng đạt 2K
  const bg = themeBg(task.theme || DEFAULT_THEME_ID); // nền avatar + canvas khớp theme

  // 2) Vbee đọc cả bài (1 lần) -> file + URL công khai.
  progress({ phase: "Tạo giọng đọc (cả bài)", percent: 10 });
  const fullText = scenes
    .map((s) => s.narration)
    .filter(Boolean)
    .join(" ");
  const fullBase = path.join(audioDir, "full");
  const { path: fullAudio, url: audioUrl } = await synthesizeWithUrl(fullText, voiceSpec, fullBase);
  if (!audioUrl) throw new Error("Vbee không trả URL audio công khai (HeyGen cần URL này).");
  const total = await audioDuration(fullAudio);
  if (!(total > 0)) throw new Error("Không đo được thời lượng audio.");

  // 3) Mốc thời gian cho slide: chia theo tỷ lệ độ dài chữ từng cảnh (frame minh hoạ).
  const weights = scenes.map((s) => Math.max(1, String(s.narration || "").length));
  const sum = weights.reduce((a, b) => a + b, 0);
  const starts = [];
  let acc = 0;
  for (let i = 0; i < scenes.length; i++) {
    starts[i] = (acc / sum) * total;
    acc += weights[i];
  }

  // 4) Dựng composition Hyperframe cho NỬA khung + ghi index.html.
  progress({ phase: "Dựng composition", percent: 30 });
  const html = buildComposition({
    id: `vid${id}`,
    scenes,
    starts,
    total,
    aspectRatio: geo.hf.design,
    captureWidth: geo.hf.w,
    captureHeight: geo.hf.h,
    theme: task.theme || DEFAULT_THEME_ID,
    font: task.font || "auto", // font người dùng chọn (override font của mẫu)
    textScale: HEYGEN_TEXT_SCALE, // HeyGen: chữ TO hơn vì panel chỉ chiếm nửa khung
    format, // format random đã chọn cho video này
  });
  fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");

  // 5) Chạy SONG SONG: render slide (im lặng) + HeyGen dựng avatar nói.
  const silentMp4 = path.join(rendersDir, "silent.mp4");
  const heygenMp4 = path.join(rendersDir, "heygen.mp4");
  const workers = process.env.HF_WORKERS || "2";

  const renderHF = run(
    HF_BIN,
    [...HF_ARGS_PREFIX, "render", ".", "--output", "renders/silent.mp4", "--workers", workers],
    {
      cwd: dir,
      shell: process.platform === "win32",
      onLine: (l) => {
        const m = l.match(/Capturing frame (\d+)\/(\d+)/);
        if (m) {
          const frac = Number(m[1]) / Number(m[2]);
          progress({
            phase: "Render slide",
            percent: 35 + Math.round(frac * 30),
            detail: `${m[1]}/${m[2]} frame`,
          });
        }
      },
    },
  );

  // HeyGen render ở độ phân giải cao hơn nửa khung (supersample) -> thu nhỏ lúc ghép cho nét.
  const hgReq = heygenRequestDims(geo.hg.w, geo.hg.h);
  const renderHeygen = generateHeygenVideo({
    audioUrl,
    width: hgReq.w,
    height: hgReq.h,
    background: bg,
    outPath: heygenMp4,
    onProgress: (p) =>
      progress({ phase: "Dựng avatar HeyGen", percent: 50, detail: p.detail || "" }),
  });

  const [, heygenInfo] = await Promise.all([renderHF, renderHeygen]);
  if (!fs.existsSync(silentMp4)) throw new Error("Render slide không tạo ra file video.");
  if (!fs.existsSync(heygenMp4)) throw new Error("HeyGen không tạo ra file video.");

  // 6) Ghép 2 nửa + giọng + nhạc nền (duck).
  progress({ phase: "Ghép khung + nhạc", percent: 88 });
  const musicTrack = resolveMusic(task.music);
  const finalPath = path.join(OUTPUT, `task-${id}.mp4`);
  await compositeHeygen({
    silentMp4,
    heygenMp4,
    narrationAudio: fullAudio,
    musicPath: musicTrack?.path,
    total,
    geo,
    bg,
    outPath: finalPath,
  });

  progress({ phase: "Hoàn tất", percent: 100 });
  return {
    videoPath: finalPath,
    duration: Number(total.toFixed(2)),
    scenes: scenes.length,
    voice: voiceLabel,
    music: musicTrack ? musicTrack.name : "(không có nhạc)",
    mode: "heygen",
    avatar: heygenInfo?.avatarId || "",
  };
}

// Ghép: nền tối + slide (nửa này) + avatar HeyGen (nửa kia, scale-cover) + audio (giọng + nhạc duck).
async function compositeHeygen({
  silentMp4,
  heygenMp4,
  narrationAudio,
  musicPath,
  total,
  geo,
  bg,
  outPath,
}) {
  const T = total.toFixed(3);
  const { final: F, hf, hg } = geo;
  const hasMusic = musicPath && fs.existsSync(musicPath);
  const canvas = `0x${String(bg || "#03070f").replace("#", "")}`; // nền canvas khớp theme

  // Video: dựng canvas nền (màu theme) -> overlay slide (đúng cỡ) -> overlay avatar (cover + crop).
  // scale lanczos (sắc nét hơn bilinear) cho cả nửa slide lẫn nửa avatar.
  // HeyGen đã render lớn hơn panel -> đây là thu nhỏ (downscale) nên rất nét.
  const vparts = [
    `color=c=${canvas}:s=${F.w}x${F.h}:r=30:d=${T}[bg]`,
    `[0:v]fps=30,scale=${hf.w}:${hf.h}:flags=lanczos,setsar=1[hf]`,
    `[1:v]fps=30,scale=${hg.w}:${hg.h}:force_original_aspect_ratio=increase:flags=lanczos,crop=${hg.w}:${hg.h},setsar=1[hg]`,
    `[bg][hf]overlay=${hf.x}:${hf.y}:eof_action=pass[t1]`,
    `[t1][hg]overlay=${hg.x}:${hg.y}:eof_action=pass,format=yuv420p[v]`,
  ];

  // Audio: giọng (input 2) + nhạc nền (input 3) sidechain ducking.
  let aparts;
  if (hasMusic) {
    aparts = [
      `[2:a]aresample=44100,apad,atrim=0:${T},asetpts=PTS-STARTPTS,asplit=2[voiceA][voiceB]`,
      `[3:a]aresample=44100,volume=0.18,apad,atrim=0:${T},asetpts=PTS-STARTPTS[bgm]`,
      `[bgm][voiceB]sidechaincompress=threshold=0.025:ratio=7:attack=15:release=350[bgduck]`,
      `[voiceA][bgduck]amix=inputs=2:normalize=0:dropout_transition=0[a]`,
    ];
  } else {
    aparts = [`[2:a]aresample=44100,apad,atrim=0:${T},asetpts=PTS-STARTPTS[a]`];
  }

  const inputs = ["-i", silentMp4, "-i", heygenMp4, "-i", narrationAudio];
  if (hasMusic) inputs.push("-stream_loop", "-1", "-i", musicPath);

  await ffmpeg([
    ...inputs,
    "-filter_complex",
    [...vparts, ...aparts].join(";"),
    "-map",
    "[v]",
    "-map",
    "[a]",
    "-c:v",
    "libx264",
    "-preset",
    HEYGEN_PRESET,
    "-crf",
    HEYGEN_CRF,
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    "-t",
    T,
    outPath,
  ]);
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

async function muxFinal({ silentMp4, narrationWav, musicPath, total, outPath, videoFilter }) {
  const T = total.toFixed(3);
  // Nếu có color grade -> re-encode video kèm -vf; nếu không -> copy nguyên (nhanh, không đổi pixel).
  const vArgs = videoFilter
    ? ["-vf", videoFilter, "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p"]
    : ["-c:v", "copy"];
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
      ...vArgs,
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
      ...vArgs,
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-shortest",
      outPath,
    ]);
  }
}
