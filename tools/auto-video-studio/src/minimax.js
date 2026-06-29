// Client gọi Minimax T2A v2 (text-to-audio) - khớp request đã chạy thật trên n8n.
// Endpoint: POST https://api.minimax.io/v1/t2a_v2?GroupId=<group_id>
// Auth: Authorization: Bearer <api_key>. Body JSON (model + text + voice_setting +
//       audio_setting + language_boost + output_format:"url"). Trả data.audio = URL -> tải file.
import fs from "node:fs";
import { getMinimaxConfig } from "./settings.js";

function num(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
}

export async function synthesizeMinimax(text, voiceId, outPath, cfgOverride) {
  const cfg = { ...getMinimaxConfig(), ...(cfgOverride || {}) };
  if (!cfg.apiKey) throw new Error("Chưa nhập API Key của Minimax.");
  if (!cfg.groupId) throw new Error("Chưa nhập Group ID của Minimax.");
  if (!voiceId) throw new Error("Chưa chọn voice_id của Minimax.");

  const base = (cfg.baseUrl || "https://api.minimax.io/v1/t2a_v2").trim().replace(/\?.*$/, "");
  const url = `${base}?GroupId=${encodeURIComponent(cfg.groupId)}`;

  const voiceSetting = {
    voice_id: voiceId,
    speed: num(cfg.speed, 1.0),
    vol: num(cfg.vol, 5),
    pitch: num(cfg.pitch, 0),
  };
  // emotion là tuỳ chọn (happy/sad/angry/fearful/disgusted/surprised/neutral). Rỗng -> bỏ.
  if (cfg.emotion) voiceSetting.emotion = String(cfg.emotion);

  const body = {
    model: cfg.model || "speech-2.6-hd",
    text,
    stream: false,
    voice_setting: voiceSetting,
    audio_setting: {
      sample_rate: num(cfg.sampleRate, 44100),
      bitrate: num(cfg.bitrate, 128000),
      format: cfg.format || "mp3",
      channel: 1,
    },
    output_format: "url",
  };
  if (cfg.languageBoost) body.language_boost = String(cfg.languageBoost);

  // 1) Gọi API tạo audio
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify(body),
  });
  const data = await safeJson(res);
  if (!res.ok) throw new Error(`Minimax HTTP ${res.status}: ${brief(data)}`);
  // base_resp.status_code: 0 = success.
  const code = data?.base_resp?.status_code;
  if (code !== undefined && code !== 0 && code !== "0") {
    throw new Error(`Minimax lỗi ${code}: ${data?.base_resp?.status_msg || brief(data)}`);
  }
  const audioUrl = data?.data?.audio;
  if (!audioUrl) throw new Error(`Minimax không trả audio url: ${brief(data)}`);

  // 2) Tải file audio về
  const ar = await fetch(audioUrl);
  if (!ar.ok) throw new Error(`Tải audio Minimax lỗi ${ar.status}`);
  fs.writeFileSync(outPath, Buffer.from(await ar.arrayBuffer()));
  if (fs.statSync(outPath).size < 200) throw new Error("File audio Minimax rỗng.");
  // Trả cả đường dẫn file lẫn URL công khai (HeyGen cần URL audio công khai).
  return { outPath, audioUrl };
}

// Thử cấu hình bằng 1 câu ngắn.
export async function testMinimax(voiceId) {
  const cfg = getMinimaxConfig();
  const vid = voiceId || cfg.voiceId || cfg.voices?.[0]?.code;
  const tmp = `${process.env.TEMP || "/tmp"}/minimax-test-${Date.now()}.mp3`;
  const t0 = Date.now();
  await synthesizeMinimax("Xin chào, đây là bài kiểm tra giọng Minimax.", vid, tmp);
  const size = fs.statSync(tmp).size;
  try {
    fs.rmSync(tmp, { force: true });
  } catch {}
  return { ok: true, ms: Date.now() - t0, size };
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
