// Kho nhạc nền: đọc file local trong folder music/, chọn ngẫu nhiên,
// và (tuỳ chọn) đồng bộ từ một folder Google Drive công khai.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const MUSIC_DIR = path.resolve(__dirname, "..", "music");
const AUDIO_EXT = new Set([".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"]);

fs.mkdirSync(MUSIC_DIR, { recursive: true });

export function listMusic() {
  return fs
    .readdirSync(MUSIC_DIR)
    .filter((f) => AUDIO_EXT.has(path.extname(f).toLowerCase()))
    .map((f) => ({
      id: f,
      name: prettyName(f),
      path: path.join(MUSIC_DIR, f),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function prettyName(file) {
  return path
    .basename(file, path.extname(file))
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Xoá 1 bản nhạc khỏi folder music/ (chống path traversal bằng basename).
export function removeMusic(id) {
  if (!id) return false;
  const safe = path.basename(String(id));
  const p = path.join(MUSIC_DIR, safe);
  if (fs.existsSync(p) && fs.statSync(p).isFile()) {
    fs.rmSync(p, { force: true });
    return true;
  }
  return false;
}

export function resolveMusic(id) {
  const all = listMusic();
  if (!id || id === "random") return pickRandom();
  return all.find((m) => m.id === id) || pickRandom();
}

export function pickRandom() {
  const all = listMusic();
  if (all.length === 0) return null;
  return all[Math.floor(Math.random() * all.length)];
}

// ---- Google Drive sync (folder công khai "Anyone with the link") ----
// Cần: folderId + Google Drive API key. Tải các file audio về folder music/.
export async function syncFromDrive({ folderId, apiKey }) {
  if (!folderId || !apiKey) {
    throw new Error("Cần folderId và apiKey của Google Drive.");
  }
  const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
  const listUrl = `https://www.googleapis.com/drive/v3/files?q=${q}&key=${apiKey}&fields=files(id,name,mimeType)&pageSize=200`;
  const res = await fetch(listUrl);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error?.message || JSON.stringify(data).slice(0, 160);
    let hint = "";
    if (res.status === 403) {
      hint =
        " → Kiểm tra: (1) đã BẬT 'Google Drive API' trong project Google Cloud chưa; (2) folder đã chia sẻ 'Anyone with the link' chưa; (3) API key KHÔNG nên giới hạn HTTP referrer (chọn None hoặc chỉ hạn chế theo Drive API).";
    } else if (res.status === 400) {
      hint = " → API key có thể sai/không hợp lệ.";
    } else if (res.status === 404) {
      hint = " → Không tìm thấy folder (ID sai hoặc chưa chia sẻ công khai).";
    }
    throw new Error(`Google Drive lỗi ${res.status}: ${msg}${hint}`);
  }
  const all = data.files || [];
  const files = all.filter(
    (f) => f.mimeType?.startsWith("audio/") || AUDIO_EXT.has(path.extname(f.name).toLowerCase()),
  );
  if (all.length === 0) {
    throw new Error("Folder trống hoặc không truy cập được. Hãy chắc chắn folder đã chia sẻ 'Anyone with the link'.");
  }
  if (files.length === 0) {
    throw new Error(`Folder có ${all.length} file nhưng không có file nhạc (mp3/wav/m4a/aac/ogg/flac).`);
  }
  let downloaded = 0,
    failed = 0;
  for (const f of files) {
    const dest = path.join(MUSIC_DIR, f.name);
    if (fs.existsSync(dest)) continue;
    const dlUrl = `https://www.googleapis.com/drive/v3/files/${f.id}?alt=media&key=${apiKey}`;
    // eslint-disable-next-line no-await-in-loop
    const fr = await fetch(dlUrl);
    if (!fr.ok) {
      failed++;
      continue;
    }
    // eslint-disable-next-line no-await-in-loop
    const buf = Buffer.from(await fr.arrayBuffer());
    fs.writeFileSync(dest, buf);
    downloaded++;
  }
  return { found: files.length, downloaded, failed, total: listMusic().length };
}

// Lấy folderId từ một URL Google Drive bất kỳ.
export function parseDriveFolderId(input) {
  if (!input) return null;
  const s = String(input).trim();
  const m = s.match(/\/folders\/([a-zA-Z0-9_-]+)/) || s.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{20,}$/.test(s)) return s; // đã là id
  return null;
}
