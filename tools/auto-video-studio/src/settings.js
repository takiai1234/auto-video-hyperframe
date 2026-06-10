// Lưu cấu hình (Vbee + danh sách giọng Vbee gợi ý) vào data/settings.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "..", "data");
const FILE = path.join(DATA_DIR, "settings.json");
fs.mkdirSync(DATA_DIR, { recursive: true });

// Một vài voice_code Vbee gợi ý (BẠN CẦN thay bằng mã đúng theo gói Vbee của mình
// - xem trong dashboard Vbee). Có thể thêm/bớt trong giao diện.
const DEFAULT_VBEE_VOICES = [
  { code: "hn_male_manhtung_news_48k-fhg", label: "Mạnh Tùng (Nam, Bắc, tin tức)" },
  { code: "hn_male_phuthang_stor80dt_48k-fhg", label: "Phú Thắng (Nam, Bắc, kể chuyện)" },
  { code: "sg_male_minhhoang_full_48k-fhg", label: "Minh Hoàng (Nam, Nam Bộ)" },
  { code: "hn_female_ngochuyen_full_48k-fhg", label: "Ngọc Huyền (Nữ, Bắc)" },
  { code: "sg_female_thaotrinh_full_48k-fhg", label: "Thảo Trinh (Nữ, Nam Bộ)" },
];

const defaults = {
  vbee: {
    appId: process.env.VBEE_APP_ID || "",
    token: process.env.VBEE_TOKEN || "",
    baseUrl: process.env.VBEE_BASE_URL || "https://vbee.vn/api/v1",
    bitrate: Number(process.env.VBEE_BITRATE || 128),
    speedRate: process.env.VBEE_SPEED_RATE || "1.0",
    responseType: process.env.VBEE_RESPONSE_TYPE || "indirect",
    callbackUrl: process.env.VBEE_CALLBACK_URL || "https://localhost/callback",
    voices: DEFAULT_VBEE_VOICES,
  },
  openrouter: {
    apiKey: process.env.OPENROUTER_API_KEY || "",
    model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
  },
};

let state = load();

function load() {
  try {
    const disk = JSON.parse(fs.readFileSync(FILE, "utf8"));
    return {
      vbee: { ...defaults.vbee, ...(disk.vbee || {}), voices: disk.vbee?.voices || defaults.vbee.voices },
      openrouter: { ...defaults.openrouter, ...(disk.openrouter || {}) },
    };
  } catch {
    return structuredClone(defaults);
  }
}

function persist() {
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2), "utf8");
}

export function getVbeeConfig() {
  return state.vbee;
}

export function isVbeeConfigured() {
  return Boolean(state.vbee.appId && state.vbee.token);
}

export function setVbeeConfig(patch) {
  state.vbee = { ...state.vbee, ...patch };
  persist();
  return state.vbee;
}

export function setVbeeVoices(voices) {
  state.vbee.voices = voices;
  persist();
  return state.vbee.voices;
}

// ---- OpenRouter (sinh nội dung từ chủ đề) ----
export function getOpenrouterConfig() {
  return state.openrouter;
}
export function isOpenrouterConfigured() {
  return Boolean(state.openrouter.apiKey);
}
export function setOpenrouterConfig(patch) {
  state.openrouter = { ...state.openrouter, ...patch };
  persist();
  return state.openrouter;
}
export function publicOpenrouter() {
  return {
    model: state.openrouter.model,
    hasKey: Boolean(state.openrouter.apiKey),
    configured: isOpenrouterConfigured(),
  };
}

// Bản công khai cho UI (ẩn token).
export function publicVbee() {
  const v = state.vbee;
  return {
    appId: v.appId,
    hasToken: Boolean(v.token),
    tokenLen: (v.token || "").length,
    baseUrl: v.baseUrl,
    bitrate: v.bitrate,
    speedRate: v.speedRate,
    voices: v.voices,
    configured: isVbeeConfigured(),
  };
}
