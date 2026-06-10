// Sinh "kịch bản phân cảnh đa layout" (90-180s) từ chủ đề/nội dung, qua OpenRouter (ChatGPT).
import { getOpenrouterConfig } from "./settings.js";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM = `Bạn là ĐẠO DIỄN kiêm biên kịch video giải thích (explainer) tiếng Việt, phong cách kênh kiến thức hiện đại.
Nhiệm vụ: từ chủ đề/nội dung, tạo KỊCH BẢN PHÂN CẢNH cho 1 video dọc thông tin, GIỌNG ĐỌC LIỀN MẠCH, hình ảnh ĐA DẠNG.

== NGUYÊN TẮC ==
1. Trả về JSON THUẦN (không markdown, không giải thích).
2. 9-14 cảnh (scene). Cảnh đầu layout "title", cảnh cuối layout "outro".
3. Tổng "narration" của tất cả cảnh khoảng 330-430 từ tiếng Việt (đủ đọc ~100-170 giây). Mỗi cảnh narration 1-3 câu.
4. narration phải nối tiếp tự nhiên, LIỀN MẠCH như một bài nói liên tục - KHÔNG chào hỏi giữa chừng, KHÔNG "tiếp theo/phần này".
5. Hình ảnh ĐA DẠNG: dùng ÍT NHẤT 5 layout KHÁC nhau, KHÔNG lặp 1 layout quá 2 lần liên tiếp. Chọn layout HỢP với nội dung từng cảnh.
6. Chữ HIỂN THỊ trên frame phải NGẮN (từ khoá, nhãn) - phần giải thích nằm ở narration. Dùng emoji icon phù hợp.

== CÁC LAYOUT & TRƯỜNG DỮ LIỆU ==
- title:     {"layout":"title","title":"<tên ngắn>","subtitle":"<1 câu hook ngắn>","narration":"..."}
- statement: {"layout":"statement","kicker":"<nhãn>","text":"<câu chốt mạnh ≤14 từ>","narration":"..."}
- bullets:   {"layout":"bullets","kicker":"...","heading":"<tiêu đề>","items":[{"icon":"✅","text":"<≤10 từ>"}],"narration":"..."}  // 2-4 items
- cards:     {"layout":"cards","kicker":"...","heading":"...","items":[{"icon":"⚠️","title":"<ngắn>","body":"<1 câu>"}],"narration":"..."}  // 2-3 cards
- formula:   {"layout":"formula","kicker":"...","heading":"...","terms":[{"label":"🔎 A","kind":"r"},{"op":"+"},{"label":"✍️ B","kind":"g"},{"op":"="},{"label":"C","kind":"result"}],"narration":"..."}
- flow:      {"layout":"flow","kicker":"...","heading":"...","steps":[{"icon":"📄","title":"<ngắn>","desc":"<≤4 từ, tuỳ chọn>"}],"narration":"..."}  // 3-5 steps, có thể thêm "hot":true để nhấn 1 ô
- compare:   {"layout":"compare","kicker":"...","heading":"...","left":{"title":"A","points":["<ngắn>"]},"right":{"title":"B","points":["<ngắn>"]},"narration":"..."}
- stat:      {"layout":"stat","kicker":"...","heading":"...","stats":[{"value":"90%","label":"<ngắn>"}],"narration":"..."}  // 1-3 số liệu nổi bật
- steps:     {"layout":"steps","kicker":"...","heading":"...","items":[{"title":"<bước>","body":"<1 câu>"}],"narration":"..."}  // 2-5 bước đánh số
- outro:     {"layout":"outro","kicker":"Kết","heading":"<câu chốt>","chips":["✅ ...","✅ ..."],"subtitle":"<tên chủ đề>","narration":"..."}

== GỢI Ý CHỌN LAYOUT ==
- Mở bài → title. Nêu vấn đề/hệ quả → cards hoặc statement. Định nghĩa/quan hệ → formula. Quy trình/cơ chế → flow hoặc steps. So sánh A/B → compare. Con số ấn tượng → stat. Liệt kê ý → bullets. Tóm tắt → outro.

== VÍ DỤ (rút gọn 3 cảnh) ==
{"title":"RAG","scenes":[
 {"layout":"title","title":"RAG","subtitle":"Cho AI trả lời bằng dữ liệu thật","narration":"Hôm nay ta nói về RAG, kỹ thuật giúp mô hình ngôn ngữ trả lời chính xác bằng dữ liệu thật."},
 {"layout":"cards","kicker":"Vấn đề","heading":"Vì sao cần RAG","items":[{"icon":"⚠️","title":"Ảo giác","body":"Mô hình bịa thông tin nghe hợp lý."},{"icon":"🧊","title":"Kiến thức cũ","body":"Không biết dữ liệu mới hay nội bộ."}],"narration":"Mô hình thuần có hai điểm yếu: nó hay bịa, và kiến thức thì đóng băng tại thời điểm huấn luyện."},
 {"layout":"flow","kicker":"Cơ chế","heading":"RAG hoạt động sao","steps":[{"icon":"❓","title":"Câu hỏi","hot":true},{"icon":"🔎","title":"Tìm tài liệu"},{"icon":"🤖","title":"Trả lời"}],"narration":"Khi bạn hỏi, hệ thống tìm các đoạn tài liệu liên quan rồi đưa cho mô hình để tạo câu trả lời có căn cứ."}
]}`;

function userPrompt(topic, guidance) {
  return `Chủ đề: "${topic}".
${guidance ? `Bám theo nội dung/dàn ý sau (phân tích & dựng lại thành các cảnh đa dạng):\n"""${guidance}"""\n` : ""}Hãy tạo kịch bản phân cảnh theo đúng schema và nguyên tắc trên. Nhớ: 9-14 cảnh, ≥5 layout khác nhau, narration liền mạch ~330-430 từ. Chỉ trả về JSON.`;
}

export async function generateScript(topic, { apiKey, model, guidance } = {}) {
  const cfg = getOpenrouterConfig();
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
        { role: "system", content: SYSTEM },
        { role: "user", content: userPrompt(topic, guidance) },
      ],
      temperature: 0.8,
      max_tokens: 3800,
      response_format: { type: "json_object" },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`OpenRouter lỗi ${res.status}: ${JSON.stringify(data).slice(0, 200)}`);
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error(`OpenRouter không trả nội dung: ${JSON.stringify(data).slice(0, 200)}`);

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
  return { ok: true, ms: Date.now() - t0, scenes: r.scenes.length, layouts: layouts.length, title: r.title };
}

// Chuẩn hoá 1 scene từ AI (giữ field hợp lệ theo layout).
function normalizeScene(s) {
  if (!s || typeof s !== "object") return null;
  const layout = String(s.layout || "").trim() || "statement";
  const out = { layout, narration: clean(s.narration) };
  for (const k of ["kicker", "heading", "title", "subtitle", "text"]) if (s[k]) out[k] = clean(s[k]);
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
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  throw new Error("Không phân tích được JSON từ OpenRouter.");
}
function arr(x) {
  return Array.isArray(x) ? x : [];
}
function clean(s) {
  return String(s == null ? "" : s).replace(/\s+/g, " ").trim();
}
