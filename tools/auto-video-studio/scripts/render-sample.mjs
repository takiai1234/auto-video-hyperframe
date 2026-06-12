// Render 1 video mẫu (Hyperframe, 9:16) để kiểm chứng output cinematic mới.
// Dùng prompt + giọng Vbee đang lưu trong data/settings.json.
import { produceVideo } from "../src/pipeline.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLES = path.resolve(__dirname, "../../../samples");

const task = {
  id: "sample-cinematic",
  topic: process.env.SAMPLE_TOPIC || "Cách dùng AI để tạo bài thuyết trình chuyên nghiệp",
  content: "",
  autogen: true,
  voiceRef: process.env.SAMPLE_VOICE || "n_hanoi_male_cloneanhkiem_zero_shot_education_vc",
  music: "random",
  aspectRatio: process.env.SAMPLE_ASPECT || "9:16",
  mode: "hyperframe",
};

let last = "";
const progress = (p) => {
  const line = `[${p.percent}%] ${p.phase}${p.detail ? " - " + p.detail : ""}`;
  if (line !== last) {
    console.log(line);
    last = line;
  }
};

console.log("Bắt đầu render mẫu:", task.topic, "|", task.aspectRatio);
const r = await produceVideo(task, progress);
fs.mkdirSync(SAMPLES, { recursive: true });
const dest = path.join(SAMPLES, "auto-video-cinematic-sample.mp4");
fs.copyFileSync(r.videoPath, dest);
console.log("\nXONG:", dest);
console.log(`  ${r.duration}s · ${r.scenes} cảnh · ${r.voice} · ${r.music}`);
