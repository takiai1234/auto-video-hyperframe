// Bộ điều phối giọng đọc - dùng Vbee API.
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { synthesizeVbee } from "./vbee.js";

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

export async function audioDuration(filePath) {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", filePath,
  ]);
  const d = parseFloat(stdout.trim());
  return Number.isFinite(d) ? d : 0;
}
