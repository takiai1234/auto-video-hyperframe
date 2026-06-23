// Biến (chủ đề + nội dung) thành danh sách "scene" cho video.
// - Nếu có nội dung: tách thành các phần (heading + nội dung + lời đọc).
// - Nếu chỉ có chủ đề: tạo kịch bản tối giản (hoặc dùng LLM nếu có ANTHROPIC_API_KEY).

const MAX_SECTIONS = 16; // cho phép video dài (mặc định hướng 2-3 phút)
const MAX_BODY_CHARS = 240;
const SPLIT_OVER_CHARS = 300; // đoạn dài hơn mức này được tách thành nhiều cảnh để pacing tốt hơn

function clean(s) {
  return String(s || "").replace(/\r/g, "").trim();
}

function deriveHeading(text) {
  const t = clean(text).replace(/\s+/g, " ");
  // Lấy mệnh đề đầu (trước dấu . , : ; -) hoặc ~7 từ đầu
  const firstClause = t.split(/[.:;-]/)[0].trim();
  const words = firstClause.split(" ");
  let h = words.slice(0, 8).join(" ");
  if (h.length > 64) h = h.slice(0, 61).trimEnd() + "…";
  // Viết hoa chữ cái đầu
  return h.charAt(0).toUpperCase() + h.slice(1);
}

function trimBody(text) {
  const t = clean(text).replace(/\s+/g, " ");
  if (t.length <= MAX_BODY_CHARS) return t;
  return t.slice(0, MAX_BODY_CHARS - 1).trimEnd() + "…";
}

// Tách 1 section có lời đọc quá dài thành nhiều cảnh (theo câu, ~240 ký tự/cảnh).
function splitLongSection(section) {
  const narr = clean(section.narration);
  if (narr.length <= SPLIT_OVER_CHARS) return [section];
  const sentences = narr.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  const chunks = [];
  let cur = "";
  for (const s of sentences) {
    if (cur && (cur.length + s.length + 1) > MAX_BODY_CHARS) {
      chunks.push(cur);
      cur = s;
    } else {
      cur = cur ? `${cur} ${s}` : s;
    }
  }
  if (cur) chunks.push(cur);
  return chunks.map((c, i) => ({
    heading: i === 0 ? section.heading : deriveHeading(c),
    body: trimBody(c),
    narration: c,
  }));
}

// Tách nội dung thành các block. Hỗ trợ markdown heading, "Heading: body", bullets, đoạn văn.
function splitSections(content) {
  const text = clean(content);
  if (!text) return [];

  // Ưu tiên tách theo dòng trống (đoạn văn)
  let blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  // Nếu chỉ 1 block lớn → tách theo dòng có dạng heading hoặc bullet, hoặc theo câu
  if (blocks.length <= 1) {
    const lines = text.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length > 1) {
      blocks = lines;
    } else {
      // 1 dòng duy nhất → tách theo câu, gộp 2 câu / scene
      const sentences = text.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
      blocks = [];
      for (let i = 0; i < sentences.length; i += 2) {
        blocks.push(sentences.slice(i, i + 2).join(" "));
      }
    }
  }

  let sections = blocks.map((block) => {
    // markdown "## Heading"
    let m = block.match(/^#{1,6}\s+(.+?)(?:\n([\s\S]*))?$/);
    if (m) {
      const heading = clean(m[1]);
      const body = clean(m[2] || "");
      return { heading, body: body || heading, narration: body || heading };
    }
    // "Heading: body" hoặc "Heading - body"
    m = block.match(/^(.{3,70}?)\s*[:-]\s+([\s\S]+)$/);
    if (m && m[1].split(" ").length <= 9) {
      return { heading: clean(m[1]), body: clean(m[2]), narration: clean(m[2]) };
    }
    // bullet
    const b = block.replace(/^[-*•]\s+/, "").trim();
    return { heading: deriveHeading(b), body: trimBody(b), narration: b };
  });

  // Tách đoạn quá dài thành nhiều cảnh (pacing tốt hơn cho video dài)
  sections = sections.flatMap(splitLongSection);

  // Giới hạn số scene: gộp phần dư vào scene cuối
  if (sections.length > MAX_SECTIONS) {
    const head = sections.slice(0, MAX_SECTIONS - 1);
    const restNarr = sections.slice(MAX_SECTIONS - 1).map((s) => s.narration).join(" ");
    head.push({
      heading: deriveHeading(restNarr),
      body: trimBody(restNarr),
      narration: restNarr,
    });
    return head;
  }
  return sections;
}

// Tạo scenes (đa layout) từ topic + content có sẵn (không dùng AI).
export function generateScenes({ topic, content }) {
  const t = clean(topic) || "Video";
  const sections = splitSections(content);

  const scenes = [{
    layout: "title",
    title: t,
    subtitle: sections.length ? "Cùng tìm hiểu trong vài phút" : "",
    narration: `Hôm nay chúng ta cùng tìm hiểu về ${t}.`,
    initials: initials(t),
  }];

  if (sections.length === 0) {
    scenes.push({
      layout: "statement",
      kicker: "Giới thiệu",
      text: t,
      narration: `Đây là video giới thiệu về ${t}. Hãy bổ sung nội dung để video đầy đủ hơn.`,
    });
  } else {
    // Luân phiên vài layout để bớt đơn điệu (path thủ công không có AI điều phối).
    sections.forEach((s, i) => {
      const short = clean(s.narration).length < 95;
      if (short) {
        scenes.push({ layout: "statement", kicker: `Phần ${i + 1}`, text: s.heading, narration: s.narration });
      } else if (i % 3 === 1) {
        scenes.push({ layout: "cards", kicker: `Phần ${i + 1}`, heading: s.heading, items: [{ icon: "▹", title: s.heading, body: s.body }], narration: s.narration });
      } else {
        scenes.push({ layout: "point", kicker: `Phần ${i + 1}`, heading: s.heading, body: s.body, narration: s.narration });
      }
    });
  }

  scenes.push({
    layout: "outro",
    kicker: "Kết",
    heading: "Cảm ơn bạn đã theo dõi",
    subtitle: t,
    narration: sections.length
      ? `Đó là những điểm chính về ${t}. Cảm ơn bạn đã theo dõi.`
      : `Cảm ơn bạn đã theo dõi.`,
  });

  return scenes;
}

// Chuẩn hoá kịch bản phân cảnh do AI (OpenRouter) sinh ra.
// Đảm bảo cảnh đầu là title, cảnh cuối là outro.
export function scenesFromPlan({ topic, title, scenes }) {
  const t = clean(title) || clean(topic) || "Video";
  const out = (scenes || []).map((s) => ({ ...s }));

  // Cảnh mở đầu chấp nhận "title" (badge) HOẶC "cover" (bìa tạp chí). Thiếu thì thêm cover.
  if (!out.length || (out[0].layout !== "title" && out[0].layout !== "cover")) {
    out.unshift({ layout: "cover", kicker: "Chủ đề", title: t, subtitle: "", narration: `Hôm nay chúng ta cùng tìm hiểu về ${t}.` });
  }
  out[0].title = out[0].title || out[0].heading || t;
  if (out[0].layout === "title") out[0].initials = initials(out[0].title);

  const last = out[out.length - 1];
  if (last.layout !== "outro") {
    out.push({ layout: "outro", kicker: "Kết", heading: "Cảm ơn bạn đã theo dõi", subtitle: t, narration: `Đó là những điểm chính về ${t}. Cảm ơn bạn đã theo dõi.` });
  } else {
    last.subtitle = last.subtitle || t;
  }
  return out;
}

function initials(s) {
  const words = clean(s).split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
