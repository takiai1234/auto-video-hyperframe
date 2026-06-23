// Client HeyGen: tạo video avatar nói từ một URL audio công khai (Vbee), rồi tải mp4.
// Bám theo luồng đã chạy thật trên n8n: v2/video/generate -> poll v1/video_status.get -> tải video_url.
// Khác n8n ở chỗ giọng dùng Vbee (audio_url) thay vì MiniMax, và nền avatar đặt = màu nền slide.
import fs from "node:fs";
import { getHeygenConfig } from "./settings.js";

const GENERATE_URL = "https://api.heygen.com/v2/video/generate";
const STATUS_URL = "https://api.heygen.com/v1/video_status.get";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Tách danh sách avatar_id (phẩy hoặc xuống dòng) rồi chọn ngẫu nhiên một cái.
export function pickAvatar(raw) {
  const list = String(raw || "")
    .split(/[\n,]+/)
    .map((v) => v.trim())
    .filter(Boolean);
  if (!list.length) return null;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Tạo 1 video HeyGen avatar nói.
 * @param {object} opts { audioUrl, width, height, outPath, onProgress }
 * @returns {Promise<{videoPath:string, avatarId:string, videoId:string}>}
 */
export async function generateHeygenVideo({
  audioUrl,
  width,
  height,
  background,
  outPath,
  onProgress = () => {},
}) {
  const cfg = getHeygenConfig();
  if (!cfg.apiKey) throw new Error("Chưa nhập HeyGen API key.");
  const avatarId = pickAvatar(cfg.avatarId);
  if (!avatarId) throw new Error("Chưa nhập HeyGen avatar_id.");
  if (!audioUrl) throw new Error("Thiếu URL audio cho HeyGen.");

  const body = {
    video_inputs: [
      {
        character: { type: "avatar", avatar_id: avatarId, avatar_style: "normal" },
        voice: { type: "audio", audio_url: audioUrl },
        // Nền avatar đặt = màu nền theme của slide để hai nửa hoà liền mạch.
        background: { type: "color", value: background || cfg.background || "#03070f" },
      },
    ],
    dimension: { width: even(width), height: even(height) },
  };

  onProgress({ detail: "Gửi yêu cầu HeyGen" });
  const res = await fetch(GENERATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Api-Key": cfg.apiKey },
    body: JSON.stringify(body),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(`HeyGen generate lỗi HTTP ${res.status}: ${brief(data)}`);
  const videoId = data?.data?.video_id || data?.video_id;
  if (videoId == null) throw new Error(`HeyGen không trả video_id: ${brief(data)}`);
  if (data?.error) throw new Error(`HeyGen lỗi: ${brief(data.error)}`);

  // Poll trạng thái tới khi completed / failed.
  const videoUrl = await pollHeygen(cfg.apiKey, videoId, onProgress);

  // Tải video.
  onProgress({ detail: "Tải video HeyGen" });
  const vr = await fetch(videoUrl);
  if (!vr.ok) throw new Error(`Tải video HeyGen lỗi ${vr.status}`);
  fs.writeFileSync(outPath, Buffer.from(await vr.arrayBuffer()));
  if (fs.statSync(outPath).size < 1000) throw new Error("File video HeyGen rỗng.");
  return { videoPath: outPath, avatarId, videoId: String(videoId) };
}

async function pollHeygen(apiKey, videoId, onProgress, { tries = 150, interval = 4000 } = {}) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(`${STATUS_URL}?video_id=${encodeURIComponent(videoId)}`, {
      headers: { "X-Api-Key": apiKey },
    });
    const d = await safeJson(r);
    const status = String(d?.data?.status || d?.status || "").toLowerCase();
    if (status === "completed") {
      const url = d?.data?.video_url || d?.video_url;
      if (!url) throw new Error(`HeyGen completed nhưng thiếu video_url: ${brief(d)}`);
      return url;
    }
    if (status === "failed") {
      const msg = d?.data?.error?.message || d?.data?.error || brief(d);
      throw new Error(`HeyGen render thất bại: ${typeof msg === "string" ? msg : brief(msg)}`);
    }
    onProgress({ detail: `HeyGen đang dựng (${status || "pending"})` });
    await sleep(interval);
  }
  throw new Error("HeyGen timeout (quá lâu chưa completed).");
}

// Kiểm tra nhanh cấu hình HeyGen (chỉ xác thực key bằng một lần liệt kê avatar).
export async function testHeygen() {
  const cfg = getHeygenConfig();
  if (!cfg.apiKey) throw new Error("Chưa nhập HeyGen API key.");
  const t0 = Date.now();
  const r = await fetch("https://api.heygen.com/v2/avatars", {
    headers: { "X-Api-Key": cfg.apiKey },
  });
  const d = await safeJson(r);
  if (!r.ok) throw new Error(`HeyGen key lỗi HTTP ${r.status}: ${brief(d)}`);
  const avatar = pickAvatar(cfg.avatarId);
  return { ok: true, ms: Date.now() - t0, avatar: avatar || "(chưa nhập avatar_id)" };
}

function even(n) {
  const v = Math.round(Number(n) || 0);
  return v % 2 === 0 ? v : v + 1;
}
async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return { raw: await res.text().catch(() => "") };
  }
}
function brief(d) {
  return JSON.stringify(d).slice(0, 240);
}
