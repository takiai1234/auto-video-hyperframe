// Lưu cấu hình (Vbee + danh sách giọng Vbee gợi ý + prompt AI + HeyGen) vào data/settings.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_SYSTEM, DEFAULT_USER_TEMPLATE } from "./prompts.js";

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
  // Prompt cho AI sinh kịch bản - sửa được trên giao diện, khôi phục được mặc định.
  prompts: {
    system: DEFAULT_SYSTEM,
    userTemplate: DEFAULT_USER_TEMPLATE,
  },
  // HeyGen (chế độ ghép avatar nói cùng slide Hyperframe).
  heygen: {
    apiKey: process.env.HEYGEN_API_KEY || "",
    // Nhiều avatar_id cách nhau bằng dấu phẩy hoặc xuống dòng -> chọn ngẫu nhiên.
    avatarId: process.env.HEYGEN_AVATAR_ID || "",
    // Màu nền avatar (đặt = nền tối của slide để hoà liền mạch).
    background: process.env.HEYGEN_BG || "#03070f",
  },
  // Số video chạy song song (1-5).
  concurrency: clampConcurrency(process.env.CONCURRENCY || 2),
};

export function clampConcurrency(v) {
  const n = Math.round(Number(v) || 2);
  return Math.max(1, Math.min(5, n));
}

let state = load();

function load() {
  try {
    const disk = JSON.parse(fs.readFileSync(FILE, "utf8"));
    return {
      vbee: {
        ...defaults.vbee,
        ...(disk.vbee || {}),
        voices: disk.vbee?.voices || defaults.vbee.voices,
      },
      openrouter: { ...defaults.openrouter, ...(disk.openrouter || {}) },
      prompts: { ...defaults.prompts, ...(disk.prompts || {}) },
      heygen: { ...defaults.heygen, ...(disk.heygen || {}) },
      concurrency: clampConcurrency(disk.concurrency ?? defaults.concurrency),
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

// ---- Prompt AI (sinh kịch bản) ----
export function getPromptsConfig() {
  return {
    system: state.prompts?.system || DEFAULT_SYSTEM,
    userTemplate: state.prompts?.userTemplate || DEFAULT_USER_TEMPLATE,
  };
}
export function setPromptsConfig(patch) {
  const next = { ...state.prompts };
  if (typeof patch?.system === "string") next.system = patch.system;
  if (typeof patch?.userTemplate === "string") next.userTemplate = patch.userTemplate;
  state.prompts = next;
  persist();
  return getPromptsConfig();
}
export function resetPromptsConfig() {
  state.prompts = { system: DEFAULT_SYSTEM, userTemplate: DEFAULT_USER_TEMPLATE };
  persist();
  return getPromptsConfig();
}
export function publicPrompts() {
  const p = getPromptsConfig();
  return {
    system: p.system,
    userTemplate: p.userTemplate,
    defaults: { system: DEFAULT_SYSTEM, userTemplate: DEFAULT_USER_TEMPLATE },
    isDefault: p.system === DEFAULT_SYSTEM && p.userTemplate === DEFAULT_USER_TEMPLATE,
  };
}

// ---- Số luồng chạy song song (1-5) ----
export function getConcurrency() {
  return clampConcurrency(state.concurrency);
}
export function setConcurrency(v) {
  state.concurrency = clampConcurrency(v);
  persist();
  return state.concurrency;
}

// ---- HeyGen (chế độ ghép avatar) ----
export function getHeygenConfig() {
  return state.heygen;
}
export function isHeygenConfigured() {
  return Boolean(state.heygen.apiKey && state.heygen.avatarId);
}
export function setHeygenConfig(patch) {
  state.heygen = { ...state.heygen, ...patch };
  persist();
  return state.heygen;
}
export function publicHeygen() {
  const h = state.heygen;
  return {
    hasKey: Boolean(h.apiKey),
    avatarId: h.avatarId,
    background: h.background,
    configured: isHeygenConfigured(),
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
