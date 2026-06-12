// Sinh "kịch bản phân cảnh đa layout" (90-180s) từ chủ đề/nội dung, qua OpenRouter (ChatGPT).
// SYSTEM prompt + template lời nhắc người dùng sửa được trên giao diện (xem src/prompts.js + settings.js).
import { getOpenrouterConfig, getPromptsConfig } from "./settings.js";
import { renderUserPrompt, OUTPUT_CONTRACT } from "./prompts.js";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

export async function generateScript(topic, { apiKey, model, guidance } = {}) {
  const cfg = getOpenrouterConfig();
  const { system, userTemplate } = getPromptsConfig();
  const key = apiKey || cfg.apiKey;
  const mdl = model || cfg.model || "openai/gpt-4o-mini";
  if (!key) throw new Error("Chưa cấu hình OpenRouter API key.");
  if (!topic && !guidance) throw new Error("Cần chủ đề hoặc nội dung để sinh kịch bản.");

  // Prompt người dùng (phong cách/nội dung tuỳ ý) + HỢP ĐỒNG ĐỊNH DẠNG ĐẦU RA luôn được nhồi
  // sau cùng -> dù người dùng viết prompt thế nào, đầu ra vẫn đúng schema bộ dựng hiểu được.
  // OUTPUT_CONTRACT có chữ "json" nên cũng thoả điều kiện response_format json_object (tránh lỗi 400).
  const messages = [
    { role: "system", content: system },
    { role: "user", content: renderUserPrompt(userTemplate, topic, guidance) },
    { role: "system", content: OUTPUT_CONTRACT },
  ];

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
      messages,
      temperature: 0.8,
      max_tokens: 8000, // đủ cho 9-14 cảnh, tránh JSON bị cắt cụt
      response_format: { type: "json_object" },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(`OpenRouter lỗi ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
  const content = data?.choices?.[0]?.message?.content;
  const finishReason = data?.choices?.[0]?.finish_reason;
  if (!content)
    throw new Error(`OpenRouter không trả nội dung: ${JSON.stringify(data).slice(0, 200)}`);

  const parsed = extractJson(content);
  const scenes = findScenes(parsed)
    .map(normalizeScene)
    .filter((s) => s && s.narration);
  if (scenes.length < 4) {
    const cut =
      finishReason === "length"
        ? " (model bị CẮT vì hết token - thử model khác hoặc rút gọn yêu cầu trong prompt)"
        : "";
    console.warn(
      "[openrouter] kịch bản ngắn:",
      scenes.length,
      "cảnh. Raw:",
      String(content).slice(0, 400),
    );
    throw new Error(
      `Kịch bản trả về quá ngắn (${scenes.length} cảnh)${cut}. AI trả: ${String(content).slice(0, 220)}`,
    );
  }
  const title = clean(parsed.title || parsed?.data?.title) || topic;
  return { title, scenes };
}

// Tìm mảng "scenes" dù model trả về nhiều dạng khác nhau.
function findScenes(parsed) {
  if (Array.isArray(parsed)) return parsed;
  const direct =
    parsed?.scenes ||
    parsed?.data?.scenes ||
    parsed?.script?.scenes ||
    parsed?.["cảnh"] ||
    parsed?.canh;
  if (Array.isArray(direct)) return direct;
  // Quét mọi thuộc tính, lấy mảng object trông giống danh sách cảnh.
  for (const v of Object.values(parsed || {})) {
    if (
      Array.isArray(v) &&
      v.some((x) => x && typeof x === "object" && (x.layout || x.narration || x.text))
    ) {
      return v;
    }
  }
  return [];
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
  // narration là bắt buộc; nếu thiếu thì lấy tạm từ field văn bản khác để không mất cảnh.
  const narration = clean(s.narration || s.voiceover || s.text || s.body || s.subtitle);
  const out = { layout, narration };
  for (const k of ["kicker", "heading", "title", "subtitle"]) if (s[k]) out[k] = clean(s[k]);
  // text giữ NGUYÊN xuống dòng (layout "prompt" hiển thị mẫu prompt nhiều dòng).
  if (s.text) out.text = cleanMultiline(s.text);
  if (s.num != null && s.num !== "") out.num = clean(s.num);
  if (s.caption)
    out.caption = String(s.caption)
      .replace(/[ \t]+/g, " ")
      .trim(); // giữ ** ** để nhấn
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
  const raw = String(text || "").trim();
  // 1) parse thẳng
  try {
    return JSON.parse(raw);
  } catch {}
  // 2) bỏ rào markdown ```json ... ``` rồi parse object lớn nhất
  const fenced = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const m = fenced.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      return JSON.parse(m[0]);
    } catch {}
  }
  // 3) cứu JSON bị cắt cụt: quét cân bằng ngoặc, đóng nốt mảng/đối tượng còn mở.
  const salv = salvageTruncatedJson(fenced);
  if (salv) {
    try {
      return JSON.parse(salv);
    } catch {}
  }
  throw new Error("Không phân tích được JSON từ OpenRouter.");
}

// Vá JSON bị cắt giữa chừng (do hết token): cắt tới phần tử hoàn chỉnh cuối,
// rồi đóng nốt các ngoặc đang mở để JSON.parse được.
function salvageTruncatedJson(text) {
  const start = text.indexOf("{");
  if (start < 0) return null;
  const stack = [];
  let inStr = false;
  let esc = false;
  let lastSafe = -1; // vị trí sau một phần tử/đối tượng vừa đóng ở mức sâu
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === "{" || ch === "[") stack.push(ch);
    else if (ch === "}" || ch === "]") {
      stack.pop();
      if (stack.length >= 1) lastSafe = i; // vừa đóng 1 cảnh bên trong mảng/đối tượng
    }
  }
  if (lastSafe < 0) return null;
  // Đóng nốt các ngoặc còn mở tính tới vị trí an toàn cuối cùng.
  let head = text.slice(start, lastSafe + 1);
  const open = [];
  let s2 = false;
  let e2 = false;
  for (let i = 0; i < head.length; i++) {
    const ch = head[i];
    if (s2) {
      if (e2) e2 = false;
      else if (ch === "\\") e2 = true;
      else if (ch === '"') s2 = false;
      continue;
    }
    if (ch === '"') s2 = true;
    else if (ch === "{" || ch === "[") open.push(ch);
    else if (ch === "}" || ch === "]") open.pop();
  }
  while (open.length) head += open.pop() === "{" ? "}" : "]";
  return head;
}
function clean(s) {
  return String(s == null ? "" : s)
    .replace(/\s+/g, " ")
    .trim();
}
// Như clean nhưng GIỮ ký tự xuống dòng (gộp khoảng trắng/tab thừa, tối đa 1 dòng trống).
function cleanMultiline(s) {
  return String(s == null ? "" : s)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .trim();
}
