// Client gọi Vbee AIVoice TTS API (khớp với request đã chạy thật trên n8n).
// Body: app_id + response_type "indirect" + callback_url + input_text + voice_code
//       + audio_type "mp3" + bitrate 128 + speed_rate (chuỗi).
// Auth: Authorization: Bearer <JWT token>. Lấy request_id -> poll -> url_voice -> tải file.
import fs from "node:fs";
import { getVbeeConfig } from "./settings.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function synthesizeVbee(text, voiceCode, outPath, cfgOverride) {
  const cfg = { ...getVbeeConfig(), ...(cfgOverride || {}) };
  if (!cfg.appId) throw new Error("Chưa nhập App ID (ID ứng dụng) của Vbee.");
  if (!cfg.token) throw new Error("Chưa nhập Token (JWT) của Vbee.");
  if (!voiceCode) throw new Error("Chưa chọn voice_code của Vbee.");
  const base = (cfg.baseUrl || "https://vbee.vn/api/v1")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/tts$/i, "");

  const body = {
    app_id: cfg.appId,
    response_type: cfg.responseType || "indirect",
    callback_url: cfg.callbackUrl || "https://localhost/callback",
    input_text: text,
    voice_code: voiceCode,
    audio_type: "mp3",
    bitrate: normalizeBitrate(cfg.bitrate),
    speed_rate: String(cfg.speedRate || "1.0"),
  };

  // 1) Tạo yêu cầu
  const res = await fetch(`${base}/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.token}` },
    body: JSON.stringify(body),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(`Vbee /tts lỗi HTTP ${res.status}: ${brief(data)}`);
  vbeeThrowIfError(data);

  // Có thể trả thẳng link (direct) - nếu có thì dùng luôn
  let audioUrl = extractAudioUrl(data);
  if (!audioUrl) {
    const requestId =
      data?.result?.request_id ||
      data?.result?.requestId ||
      data?.request_id ||
      data?.data?.request_id ||
      (typeof data?.result === "string" ? data.result : null);
    if (!requestId) throw new Error(`Vbee không trả request_id/url_voice: ${brief(data)}`);
    // 2) Poll lấy url_voice
    audioUrl = await pollAudio(base, cfg.token, requestId);
  }

  // 3) Tải file
  const ar = await fetch(audioUrl);
  if (!ar.ok) throw new Error(`Tải audio Vbee lỗi ${ar.status}`);
  fs.writeFileSync(outPath, Buffer.from(await ar.arrayBuffer()));
  if (fs.statSync(outPath).size < 200) throw new Error("File audio Vbee rỗng.");
  // Trả cả đường dẫn file lẫn URL công khai (HeyGen cần URL audio công khai).
  return { outPath, audioUrl };
}

// Lấy link audio từ response (nhiều biến thể field).
function extractAudioUrl(d) {
  const r = d?.result || d?.data || {};
  return (
    r.url_voice ||
    r.audio_link ||
    r.audioLink ||
    r.audio_url ||
    r.url ||
    d?.url_voice ||
    d?.audio_link ||
    null
  );
}

async function pollAudio(base, token, requestId, { tries = 90, interval = 2000 } = {}) {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(`${base}/tts/${requestId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const d = await safeJson(r);
    const link = extractAudioUrl(d);
    const status = String(d?.result?.status || d?.status || "").toUpperCase();
    if (link) return link;
    if (["FAILURE", "FAILED", "ERROR", "-1"].includes(status)) {
      throw new Error(`Vbee xử lý thất bại: ${brief(d)}`);
    }
    await sleep(interval);
  }
  throw new Error("Vbee timeout (quá lâu không có url_voice).");
}

// Thử cấu hình bằng 1 câu ngắn.
export async function testVbee(voiceCode) {
  const tmp = `${process.env.TEMP || "/tmp"}/vbee-test-${Date.now()}.mp3`;
  const t0 = Date.now();
  await synthesizeVbee("Xin chào, đây là bài kiểm tra giọng Vbee.", voiceCode, tmp);
  const size = fs.statSync(tmp).size;
  try {
    fs.rmSync(tmp, { force: true });
  } catch {}
  return { ok: true, ms: Date.now() - t0, size };
}

function vbeeThrowIfError(data) {
  const code = data?.error_code ?? data?.errorCode;
  const msg = data?.error_message || data?.errorMessage || data?.message;
  if (code || (data?.status === 0 && msg)) {
    const hints = {
      2001: "App ID sai/không tồn tại - kiểm tra lại ID ứng dụng trong dashboard Vbee.",
    };
    const hint = hints[code] ? " → " + hints[code] : "";
    throw new Error(`Vbee lỗi ${code ?? ""}: ${msg || brief(data)}${hint}`);
  }
}

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return { raw: await res.text().catch(() => "") };
  }
}
function brief(d) {
  return JSON.stringify(d).slice(0, 220);
}

// Vbee dùng bitrate kbps (64/128/256/320). Giá trị cũ kiểu 128000 → quy về 128.
function normalizeBitrate(b) {
  const n = Number(b);
  if (!Number.isFinite(n) || n <= 0) return 128;
  return n > 320 ? 128 : n;
}
