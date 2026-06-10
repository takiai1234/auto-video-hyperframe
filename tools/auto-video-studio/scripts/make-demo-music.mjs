// Tạo vài bản nhạc nền ambient (tổng hợp, không bản quyền) cho demo.
// Người dùng có thể thay bằng nhạc của mình trong folder music/ hoặc kết nối Google Drive.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const musicDir = path.resolve(__dirname, "..", "music");
fs.mkdirSync(musicDir, { recursive: true });

// Mỗi track là một hợp âm 3 nốt + tremolo + lowpass + echo nhẹ → pad êm dịu.
const tracks = [
  { name: "ambient-calm", freqs: [220.0, 277.18, 329.63], trem: 0.18 }, // A minor-ish
  { name: "warm-keys", freqs: [261.63, 329.63, 392.0], trem: 0.22 }, // C major
  { name: "focus-flow", freqs: [196.0, 246.94, 293.66], trem: 0.15 }, // G
  { name: "soft-night", freqs: [174.61, 220.0, 261.63], trem: 0.12 }, // F
];

const DURATION = 75;

async function build(track) {
  const out = path.join(musicDir, `${track.name}.mp3`);
  const inputs = [];
  track.freqs.forEach((f) => {
    inputs.push("-f", "lavfi", "-i", `sine=frequency=${f}:duration=${DURATION}`);
  });
  const mixLabels = track.freqs.map((_, i) => `[${i}]`).join("");
  const filter =
    `${mixLabels}amix=inputs=${track.freqs.length}:normalize=0,` +
    `tremolo=f=${track.trem}:d=0.4,lowpass=f=950,aecho=0.8:0.7:55:0.35,volume=0.55,` +
    `afade=t=in:st=0:d=2,afade=t=out:st=${DURATION - 2}:d=2[a]`;
  const args = [
    "-y",
    ...inputs,
    "-filter_complex",
    filter,
    "-map",
    "[a]",
    "-ar",
    "44100",
    "-ac",
    "2",
    "-c:a",
    "libmp3lame",
    "-q:a",
    "5",
    out,
  ];
  await execFileAsync("ffmpeg", args);
  console.log("✓", path.basename(out));
}

for (const t of tracks) {
  // eslint-disable-next-line no-await-in-loop
  await build(t);
}
console.log(`\nĐã tạo ${tracks.length} bản nhạc nền demo trong ${musicDir}`);
