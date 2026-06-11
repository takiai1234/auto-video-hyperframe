// Sinh "kịch bản phân cảnh đa layout" (90-180s) từ chủ đề/nội dung, qua OpenRouter (ChatGPT).
// SYSTEM prompt + template lời nhắc người dùng sửa được trên giao diện (xem src/prompts.js + settings.js).
import { getOpenrouterConfig, getPromptsConfig } from "./settings.js";
import { renderUserPrompt } from "./prompts.js";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export async function generateScript(topic, { apiKey, model, guidance } = {}) {
  const cfg = getOpenrouterConfig();
  const { system, userTemplate } = getPromptsConfig();
  const key = apiKey || cfg.apiKey;
  const mdl = model || cfg.model || "openai/gpt-4o-mini";
  if (!key) throw new Error("Chưa cấu hình OpenRouter API key.");
  if (!topic && !guidance) throw new Error("Cần chủ đề hoặc nội dung để sinh kịch bản.");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost",
      "X-Title": "Auto Video Studio",
    },
    body: JSON.stringify({
      model: mdl,
      messages: [
        { role: "system", content: system },
        { role: "user", content: renderUserPrompt(userTemplate, topic, guidance) },
      ],
      temperature: 0.8,
      max_tokens: 3800,
      response_format: { type: "json_object" },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(`OpenRouter lỗi ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
  const content = data?.choices?.[0]?.message?.content;
  if (!content)
    throw new Error(`OpenRouter không trả nội dung: ${JSON.stringify(data).slice(0, 200)}`);

  const parsed = extractJson(content);
  const scenes = arr(parsed.scenes)
    .map(normalizeScene)
    .filter((s) => s && s.narration);
  if (scenes.length < 4) throw new Error("Kịch bản trả về quá ngắn / sai định dạng.");
  return { title: clean(parsed.title) || topic, scenes };
}

export async function testOpenrouter(apiKey, model) {
  const t0 = Date.now();
  const r = await generateScript("Trí tuệ nhân tạo là gì", { apiKey, model });
  const layouts = [...new Set(r.scenes.map((s) => s.layout))];
  return {
    ok: true,
    ms: Date.now() - t0,
    scenes: r.scenes.length,
    layouts: layouts.length,
    title: r.title,
  };
}

// Chuẩn hoá 1 scene từ AI (giữ field hợp lệ theo layout).
function normalizeScene(s) {
  if (!s || typeof s !== "object") return null;
  const layout = String(s.layout || "").trim() || "statement";
  const out = { layout, narration: clean(s.narration) };
  for (const k of ["kicker", "heading", "title", "subtitle", "text"])
    if (s[k]) out[k] = clean(s[k]);
  if (Array.isArray(s.items)) out.items = s.items;
  if (Array.isArray(s.steps)) out.steps = s.steps;
  if (Array.isArray(s.terms)) out.terms = s.terms;
  if (Array.isArray(s.stats)) out.stats = s.stats;
  if (Array.isArray(s.chips)) out.chips = s.chips;
  if (s.left) out.left = s.left;
  if (s.right) out.right = s.right;
  return out;
}

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch {}
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      return JSON.parse(m[0]);
    } catch {}
  }
  throw new Error("Không phân tích được JSON từ OpenRouter.");
}
function arr(x) {
  return Array.isArray(x) ? x : [];
}
function clean(s) {
  return String(s == null ? "" : s)
    .replace(/\s+/g, " ")
    .trim();
}
