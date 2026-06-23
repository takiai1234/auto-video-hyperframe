// Định vị binary ffmpeg & ffprobe theo thứ tự ưu tiên:
//   1) Biến môi trường FFMPEG_PATH / FFPROBE_PATH (nếu trỏ tới file tồn tại)
//   2) Gói npm tĩnh (ffmpeg-static / ffprobe-static) - có sẵn sau khi `npm install`
//   3) "ffmpeg" / "ffprobe" trong PATH hệ thống
// -> Clone repo + `npm install` là chạy được, KHÔNG còn "spawn ffprobe ENOENT".
import fs from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function tryRequire(name, pick) {
  try {
    const m = require(name);
    const p = pick(m);
    return typeof p === "string" && p ? p : null;
  } catch {
    return null;
  }
}

const ffmpegStatic = tryRequire("ffmpeg-static", (m) => m?.default || m);
const ffprobeStatic = tryRequire("ffprobe-static", (m) => m?.path || m?.default?.path);

function resolve(envName, staticPath, fallback) {
  const env = process.env[envName];
  if (env && fs.existsSync(env)) return env;
  if (staticPath && fs.existsSync(staticPath)) return staticPath;
  return fallback; // dựa vào PATH hệ thống
}

export const FFMPEG = resolve("FFMPEG_PATH", ffmpegStatic, "ffmpeg");
export const FFPROBE = resolve("FFPROBE_PATH", ffprobeStatic, "ffprobe");

// Có dùng được binary đóng gói qua npm không (để báo trạng thái).
export const FFMPEG_BUNDLED = FFMPEG === ffmpegStatic;
export const FFPROBE_BUNDLED = FFPROBE === ffprobeStatic;

// Thư mục chứa binary (để nhồi vào PATH cho tiến trình con `npx hyperframes` cũng tìm thấy ffmpeg/ffprobe).
import path from "node:path";
export const FFMPEG_DIR = FFMPEG.includes(path.sep) ? path.dirname(FFMPEG) : null;
export const FFPROBE_DIR = FFPROBE.includes(path.sep) ? path.dirname(FFPROBE) : null;
