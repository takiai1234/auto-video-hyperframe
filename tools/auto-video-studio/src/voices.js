// Bộ điều phối giọng đọc - chọn nhà cung cấp theo voiceSpec.provider (Vbee | Minimax).
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { synthesizeVbee } from "./vbee.js";
import { synthesizeMinimax } from "./minimax.js";
import { FFPROBE, FFMPEG } from "./bin.js";

const execFileAsync = promisify(execFile);

// voiceSpec = { ref: voiceCode|voice_id, provider: "vbee"|"minimax" }
// outBase: đường dẫn KHÔNG kèm đuôi. Trả về đường dẫn file thật (.mp3 cho cả 2 provider).
export async function synthesize(text, voiceSpec, outBase) {
  const clean = String(text || "").trim();
  if (!clean) throw new Error("Văn bản rỗng.");
  const out = `${outBase}.mp3`;
  if ((voiceSpec?.provider || "vbee") === "minimax") {
    await synthesizeMinimax(clean, voiceSpec?.ref, out);
  } else {
    await synthesizeVbee(clean, voiceSpec?.ref, out);
  }
  return out;
}

// Như synthesize nhưng trả thêm URL audio công khai để HeyGen dùng. Trả { path, url }.
export async function synthesizeWithUrl(text, voiceSpec, outBase) {
  const clean = String(text || "").trim();
  if (!clean) throw new Error("Văn bản rỗng.");
  const out = `${outBase}.mp3`;
  const fn = (voiceSpec?.provider || "vbee") === "minimax" ? synthesizeMinimax : synthesizeVbee;
  const { audioUrl } = await fn(clean, voiceSpec?.ref, out);
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
