// Bộ điều phối giọng đọc - dùng Vbee API.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { synthesizeVbee } from "./vbee.js";
import { FFPROBE, FFMPEG } from "./bin.js";

const execFileAsync = promisify(execFile);

// voiceSpec = { ref: voiceCode }
// outBase: đường dẫn KHÔNG kèm đuôi. Trả về đường dẫn file thật.
export async function synthesize(text, voiceSpec, outBase) {
  const clean = String(text || "").trim();
  if (!clean) throw new Error("Văn bản rỗng.");
  const out = `${outBase}.mp3`;
  await synthesizeVbee(clean, voiceSpec?.ref, out);
  return out;
}

// Như synthesize nhưng trả thêm URL audio công khai (Vbee) để HeyGen dùng.
// Trả { path, url }.
export async function synthesizeWithUrl(text, voiceSpec, outBase) {
  const clean = String(text || "").trim();
  if (!clean) throw new Error("Văn bản rỗng.");
  const out = `${outBase}.mp3`;
  const { audioUrl } = await synthesizeVbee(clean, voiceSpec?.ref, out);
  return { path: out, url: audioUrl };
}

export async function audioDuration(filePath) {
  // Ưu tiên ffprobe (chính xác, gọn). Nếu không có ffprobe -> fallback đo bằng ffmpeg.
  try {
    const { stdout } = await execFileAsync(FFPROBE, [
      "-v",
      "error",
      "-show_entries",
      "format=duration",
      "-of",
      "default=noprint_wrappers=1:nokey=1",
      filePath,
    ]);
    const d = parseFloat(stdout.trim());
    if (Number.isFinite(d) && d > 0) return d;
  } catch {
    /* rơi xuống fallback ffmpeg */
  }
  // Fallback: ffmpeg in "Duration: HH:MM:SS.xx" ra stderr.
  try {
    await execFileAsync(FFMPEG, ["-hide_banner", "-i", filePath]);
  } catch (e) {
    const m = String(e?.stderr || "").match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (m) return Number(m[1]) * 3600 + Number(m[2]) * 60 + parseFloat(m[3]);
  }
  return 0;
}
