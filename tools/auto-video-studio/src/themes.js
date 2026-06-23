// Bộ "mẫu" (theme) cho composition Hyperframe.
// Mỗi theme chỉ định bảng màu + nền + accent; composition.js bơm các biến này vào :root.
// Giữ đúng tên biến CSS đang dùng (--teal/--amber/--violet/--red) để khỏi sửa nhiều CSS:
//   a1 -> --teal (accent chính)   a2 -> --amber (accent phụ)
//   a3 -> --violet (accent 3)     hl -> --red  (màu nhấn phụ đề / số thứ tự)
// glowHex/stageHex = tông sáng của vầng sáng nền + radial sân khấu.

const DEFAULT_FONT = '"Inter","Segoe UI",system-ui,sans-serif';

// hex (#rrggbb) -> "r,g,b"
function rgb(hex) {
  const h = String(hex).replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/(.)/g, "$1$1") : h, 16);
  return `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
}
const rgba = (hex, a) => `rgba(${rgb(hex)},${a})`;

// 10 mẫu đa dạng (đều nền tối để phụ đề/đọc luôn rõ).
export const THEMES = [
  {
    id: "midnight",
    name: "Midnight",
    desc: "Xanh navy · teal/vàng (mặc định)",
    bg: "#03070f", panel: "#0d1b2a", panel2: "#122236", line: "#2a3f5a",
    muted: "#aebfd2", text: "#eef3f9",
    a1: "#2ec4b6", a2: "#ffc300", a3: "#9b8cff", hl: "#ff5a6a",
    glowHex: "#2ec4b6", stageHex: "#143c6e",
  },
  {
    id: "noir-amber",
    name: "Noir Amber",
    desc: "Đen · cam hổ phách ấm",
    bg: "#0a0806", panel: "#1a1410", panel2: "#241a12", line: "#4a3826",
    muted: "#cdb8a0", text: "#fbf4ea",
    a1: "#ff8a3d", a2: "#ffc46a", a3: "#ffd9a0", hl: "#ff9d4d",
    glowHex: "#ff8a3d", stageHex: "#7a4614",
  },
  {
    id: "royal-gold",
    name: "Royal Gold",
    desc: "Sang trọng · vàng kim",
    bg: "#07080d", panel: "#12141f", panel2: "#1b1d2b", line: "#3a3550",
    muted: "#c8c2d8", text: "#fdfaf0",
    a1: "#e9c46a", a2: "#f4d77a", a3: "#d4af6a", hl: "#f0c860",
    glowHex: "#e9c46a", stageHex: "#5f4a1e",
  },
  {
    id: "emerald",
    name: "Emerald",
    desc: "Xanh lục ngọc · lime",
    bg: "#04100c", panel: "#0c2018", panel2: "#123028", line: "#265a44",
    muted: "#a6cdb8", text: "#eafaf2",
    a1: "#2ee6a0", a2: "#b8ff5a", a3: "#5af0c0", hl: "#ff6a8a",
    glowHex: "#2ee6a0", stageHex: "#146e46",
  },
  {
    id: "crimson",
    name: "Crimson",
    desc: "Than chì · đỏ rượu",
    bg: "#0d0608", panel: "#1f0d12", panel2: "#2b1118", line: "#5a2630",
    muted: "#d2a6b0", text: "#fceef0",
    a1: "#ff5a6a", a2: "#ffae5a", a3: "#ff8a9a", hl: "#ffae5a",
    glowHex: "#ff5a6a", stageHex: "#781428",
  },
  {
    id: "cyber-violet",
    name: "Cyber Violet",
    desc: "Tím/hồng neon",
    bg: "#08060f", panel: "#150d24", panel2: "#1d1230", line: "#3f2a5a",
    muted: "#c2b0e0", text: "#f3eefb",
    a1: "#c05aff", a2: "#ff5ad0", a3: "#7a5aff", hl: "#ff5ad0",
    glowHex: "#a05aff", stageHex: "#50148c",
  },
  {
    id: "deep-ocean",
    name: "Deep Ocean",
    desc: "Xanh biển sâu · cyan",
    bg: "#04080f", panel: "#0a1828", panel2: "#102236", line: "#214a6a",
    muted: "#a0c2dc", text: "#eaf4fc",
    a1: "#38c6ff", a2: "#5ad0ff", a3: "#6aa8ff", hl: "#ff7a6a",
    glowHex: "#38c6ff", stageHex: "#14508c",
  },
  {
    id: "sunset",
    name: "Sunset",
    desc: "Hoàng hôn · cam/hồng",
    bg: "#0f0608", panel: "#24100f", panel2: "#301512", line: "#5a2e26",
    muted: "#e0b8a8", text: "#fdf0ea",
    a1: "#ff8a3d", a2: "#ffd05a", a3: "#ff5a8a", hl: "#ffd05a",
    glowHex: "#ff8a3d", stageHex: "#82321e",
  },
  {
    id: "slate-pro",
    name: "Slate Pro",
    desc: "Tối giản công sở · xanh dương",
    bg: "#0b0e12", panel: "#161b22", panel2: "#1e252e", line: "#364150",
    muted: "#aebac8", text: "#f0f4f8",
    a1: "#5aa8ff", a2: "#5ad0c0", a3: "#9ab0c8", hl: "#ff6a7a",
    glowHex: "#5aa8ff", stageHex: "#324664",
  },
  {
    id: "mocha",
    name: "Mocha",
    desc: "Nâu ấm · caramel/kem",
    bg: "#0c0805", panel: "#1d130c", panel2: "#281a10", line: "#4a3322",
    muted: "#d2bca0", text: "#fbf2e6",
    a1: "#d2a06a", a2: "#f0c890", a3: "#c08a5a", hl: "#f0c890",
    glowHex: "#d2a06a", stageHex: "#6e4b28",
  },

  // ===================================================================
  // 10 "DESIGN STYLE" sáng tạo (viral MXH) - không chỉ đổi màu mà còn đổi
  // NỀN, FONT, viền/bo góc, kiểu tiêu đề & lớp trang trí. Mỗi mục có:
  //   style    -> id phong cách (composition.js bơm class .design-<style> + CSS riêng)
  //   font     -> --font (đôi khi kèm fontLink để nạp Google Fonts khi render)
  //   light    -> true nếu nền sáng (chữ tối)  -> dùng cho preview/UI
  //   strongFg -> màu chữ "đậm" (tiêu đề lớn, số liệu)  -> nền sáng cần màu tối
  //   capFg    -> màu phụ đề karaoke dưới cùng
  //   titleFill-> nền clip-text của .title-h (gradient)
  // Các trường còn lại (bg/panel/line/a1..hl/glowHex/stageHex) như theme thường.
  // ===================================================================
  {
    id: "neo-brutal",
    name: "Neo Brutal",
    desc: "Brutalism · vàng điện + viền đen dày",
    style: "neo-brutal", light: true,
    font: '"Archivo","Arial Black","Inter",system-ui,sans-serif',
    fontLink: "https://fonts.googleapis.com/css2?family=Archivo:wght@600;800;900&display=swap",
    bg: "#ffe600", panel: "#ffffff", panel2: "#fff6b0", line: "#0a0a0a",
    muted: "#3a3a2a", text: "#0a0a0a", strongFg: "#0a0a0a", capFg: "#0a0a0a",
    titleFill: "linear-gradient(90deg,#0a0a0a,#0a0a0a)",
    a1: "#0a0a0a", a2: "#ff2d55", a3: "#1463ff", hl: "#ff2d55",
    glowHex: "#ff2d55", stageHex: "#ffd400",
  },
  {
    id: "vaporwave",
    name: "Vaporwave",
    desc: "Retro 80s · lưới hoàng hôn neon",
    style: "vaporwave",
    font: '"Inter","Segoe UI",system-ui,sans-serif',
    fontLink: "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Inter:wght@400;600;800&display=swap",
    bg: "#1a0833", panel: "#2a0f4d", panel2: "#3a1566", line: "#ff4fd8",
    muted: "#d9b8ff", text: "#fdf0ff", strongFg: "#ffffff", capFg: "#ffffff",
    titleFill: "linear-gradient(120deg,#ff6ec7,#5af0ff,#ffd86b)",
    a1: "#ff4fd8", a2: "#23e0ff", a3: "#ffd86b", hl: "#ff4fd8",
    glowHex: "#ff2fb0", stageHex: "#5a1e8c",
  },
  {
    id: "y2k-aero",
    name: "Y2K Aero",
    desc: "Glossy 2000s · aqua bóng kính",
    style: "y2k-aero", light: true,
    font: '"Rubik","Inter",system-ui,sans-serif',
    fontLink: "https://fonts.googleapis.com/css2?family=Rubik:wght@500;700;900&display=swap",
    bg: "#dff1ff", panel: "#ffffff", panel2: "#eef9ff", line: "#9fd0f5",
    muted: "#3a5a72", text: "#0b2236", strongFg: "#0b2236", capFg: "#0b2236",
    titleFill: "linear-gradient(120deg,#0aa3ff,#33d6c0)",
    a1: "#0aa3ff", a2: "#33d6c0", a3: "#7c5cff", hl: "#ff5aa0",
    glowHex: "#6cc6ff", stageHex: "#bfe6ff",
  },
  {
    id: "editorial",
    name: "Editorial",
    desc: "Tạp chí cao cấp · serif giấy kem",
    style: "editorial", light: true,
    font: '"Playfair Display","Georgia",serif',
    fontLink: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700;900&family=Inter:wght@400;500;600&display=swap",
    bg: "#f4efe6", panel: "#fffdf8", panel2: "#efe7d8", line: "#d8cdb8",
    muted: "#6b6253", text: "#1c1814", strongFg: "#1c1814", capFg: "#1c1814",
    titleFill: "linear-gradient(90deg,#1c1814,#5a4a36)",
    a1: "#9a6a2c", a2: "#b8472f", a3: "#3a5a4a", hl: "#b8472f",
    glowHex: "#caa86a", stageHex: "#e6dcc8",
  },
  {
    id: "aurora-mesh",
    name: "Aurora Mesh",
    desc: "Gradient mesh SaaS · cực quang",
    style: "aurora-mesh",
    font: '"Inter","Segoe UI",system-ui,sans-serif',
    bg: "#070a18", panel: "rgba(255,255,255,0.06)", panel2: "rgba(255,255,255,0.1)", line: "rgba(255,255,255,0.18)",
    muted: "#c4cae8", text: "#f4f6ff", strongFg: "#ffffff", capFg: "#ffffff",
    titleFill: "linear-gradient(120deg,#fff,#b9c6ff)",
    a1: "#7c8bff", a2: "#21d4c5", a3: "#ff7ac6", hl: "#ff9f6b",
    glowHex: "#7c8bff", stageHex: "#2a2f6e",
  },
  {
    id: "pop-comic",
    name: "Pop Comic",
    desc: "Comic pop-art · halftone & outline",
    style: "pop-comic", light: true,
    font: '"Inter","Segoe UI",system-ui,sans-serif',
    fontLink: "https://fonts.googleapis.com/css2?family=Bangers&family=Inter:wght@600;800;900&display=swap",
    bg: "#fff2cc", panel: "#ffffff", panel2: "#fff9e6", line: "#0a0a0a",
    muted: "#4a4030", text: "#0a0a0a", strongFg: "#0a0a0a", capFg: "#ffffff",
    titleFill: "linear-gradient(90deg,#e8261c,#ffcb00)",
    a1: "#e8261c", a2: "#0a6cff", a3: "#ffcb00", hl: "#e8261c",
    glowHex: "#ffcb00", stageHex: "#ffe08a",
  },
  {
    id: "neon-glow",
    name: "Neon Glow",
    desc: "Cyberpunk · chữ phát sáng trên đen",
    style: "neon-glow",
    font: '"Inter","Segoe UI",system-ui,sans-serif',
    fontLink: "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Inter:wght@400;600;800&display=swap",
    bg: "#03040a", panel: "#0a0f1e", panel2: "#0e1530", line: "#1de9ff",
    muted: "#7fd8e8", text: "#eafdff", strongFg: "#ffffff", capFg: "#eafdff",
    titleFill: "linear-gradient(120deg,#1de9ff,#bd00ff)",
    a1: "#1de9ff", a2: "#bd00ff", a3: "#39ff88", hl: "#ff2bd6",
    glowHex: "#1de9ff", stageHex: "#0a1f3a",
  },
  {
    id: "swiss-mono",
    name: "Swiss Mono",
    desc: "Tối giản Thuỵ Sĩ · đen trắng + đỏ",
    style: "swiss-mono", light: true,
    font: '"Inter","Helvetica Neue",Arial,sans-serif',
    bg: "#fafafa", panel: "#ffffff", panel2: "#f0f0f0", line: "#111111",
    muted: "#555555", text: "#111111", strongFg: "#111111", capFg: "#111111",
    titleFill: "linear-gradient(90deg,#111,#111)",
    a1: "#ff2d2d", a2: "#111111", a3: "#777777", hl: "#ff2d2d",
    glowHex: "#ffffff", stageHex: "#eaeaea",
  },
  {
    id: "frost-glass",
    name: "Frost Glass",
    desc: "Glassmorphism · kính mờ trên blob màu",
    style: "frost-glass",
    font: '"Inter","Segoe UI",system-ui,sans-serif',
    bg: "#0c1430", panel: "rgba(255,255,255,0.1)", panel2: "rgba(255,255,255,0.16)", line: "rgba(255,255,255,0.28)",
    muted: "#d2dcff", text: "#ffffff", strongFg: "#ffffff", capFg: "#ffffff",
    titleFill: "linear-gradient(120deg,#fff,#cde0ff)",
    a1: "#5ad1ff", a2: "#b07bff", a3: "#ff8fd0", hl: "#ffd86b",
    glowHex: "#6aa0ff", stageHex: "#2a3a8c",
  },
  {
    id: "blueprint",
    name: "Blueprint",
    desc: "Bản vẽ kỹ thuật · lưới cyan + mono",
    style: "blueprint",
    font: '"IBM Plex Mono","DejaVu Sans Mono",ui-monospace,monospace',
    fontLink: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600;700&display=swap",
    bg: "#0a1b2e", panel: "rgba(120,200,255,0.06)", panel2: "rgba(120,200,255,0.1)", line: "#2f6f9e",
    muted: "#8fb8d8", text: "#dceefb", strongFg: "#ffffff", capFg: "#dceefb",
    titleFill: "linear-gradient(90deg,#bfe6ff,#7fc6ff)",
    a1: "#5cc8ff", a2: "#7fffd4", a3: "#ffd86b", hl: "#ff7a6a",
    glowHex: "#5cc8ff", stageHex: "#123a5c",
  },
];

const BY_ID = new Map(THEMES.map((t) => [t.id, t]));
export const DEFAULT_THEME_ID = "midnight";

export function getTheme(id) {
  return BY_ID.get(id) || BY_ID.get(DEFAULT_THEME_ID);
}

// Trả về bản đồ biến CSS (chuỗi "--k:v;") cho composition.js bơm vào :root.
export function getThemeVars(id) {
  const t = getTheme(id);
  return {
    "--bg": t.bg,
    "--panel": t.panel,
    "--panel2": t.panel2,
    "--line": t.line,
    "--muted": t.muted,
    "--text": t.text,
    "--teal": t.a1,
    "--amber": t.a2,
    "--violet": t.a3,
    "--red": t.hl,
    "--font": t.font || DEFAULT_FONT,
    "--stage-a": rgba(t.stageHex, 0.35),
    "--grid": t.light ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.06)",
    "--glow": rgba(t.glowHex, 0.16),
    "--bok1": rgba(t.a1, 0.25),
    "--bok2": rgba(t.a2, 0.18),
    "--bok3": rgba(t.a3, 0.18),
    "--cap-hl": t.hl,
    // Màu chữ "đậm" + phụ đề + nền clip-text tiêu đề (mặc định tông tối/trắng cũ
    // để 10 theme gốc render Y HỆT như trước; chỉ design mới ghi đè).
    "--strong-fg": t.strongFg || "#fff",
    "--cap-fg": t.capFg || "#fff",
    "--cap-shadow": t.light ? "0 2px 10px rgba(0,0,0,0.18)" : "0 4px 24px rgba(0,0,0,0.8)",
    "--title-fill": t.titleFill || "linear-gradient(120deg,#fff,#aebfd2)",
  };
}

export function themeCss(id) {
  const vars = getThemeVars(id);
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v};`)
    .join("");
}

// Màu nền (để khớp canvas ghép HeyGen + nền avatar với theme).
// LƯU Ý: vài design dùng nền gradient/blob; ở đây trả về MÀU NỀN ĐẶC để ghép HeyGen
// (canvas + viền letterbox) - giữ nguyên hành vi cũ, KHÔNG ảnh hưởng chất lượng avatar.
export function themeBg(id) {
  return getTheme(id).bg;
}

// ===================================================================
// FORMAT LINH HOẠT (RANDOM) - KHÔNG fix cứng theo mẫu.
// Mỗi lần render, chọn NGẪU NHIÊN: transition + caption + entrance + media.
// Chỉ MÀU/skin là cố định theo mẫu (ở THEMES trên). -> cùng 1 mẫu, mỗi video một format khác.
// media: "image" (nhiều ảnh thật) | "diagram" (nhiều sơ đồ) | "stat" | "text" | "mixed".
// ===================================================================
export const TRANSITIONS = [
  "crossfade", "crossfade-slow", "slide", "push-up", "zoom",
  "dissolve", "wipe", "iris", "flash", "glitch", "flip",
];
export const CAPTIONS = ["default", "slam", "pill", "neon", "weight", "typewriter", "glitch"];
export const ENTRANCES = [
  "default", "snappy", "dreamy", "bouncy", "gentle",
  "smooth", "techno", "precise", "soft", "mechanical",
];
export const MEDIA = ["mixed", "image", "diagram", "stat", "text"];

const MEDIA_PREFER = {
  // "image" giờ ƯU TIÊN dẫn chứng dựng bằng HTML (code/browser) hơn ảnh stock.
  image: ["code", "browser", "split", "photo", "cards", "icongrid"],
  diagram: ["flow", "loop", "steps", "bars", "timeline", "roadmap", "compare", "pros", "formula", "gauge"],
  stat: ["stat", "bignum", "kpi", "bars", "gauge", "cards"],
  text: ["statement", "quote", "definition", "checklist", "browser", "cards", "section"],
  mixed: ["cards", "icongrid", "code", "stat", "flow", "browser", "checklist", "quote"],
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Chọn ngẫu nhiên 1 bộ format cho 1 video. Có thể ép vài trường qua "force".
export function randomFormat(force = {}) {
  return {
    transition: force.transition || pick(TRANSITIONS),
    caption: force.caption || pick(CAPTIONS),
    entrance: force.entrance || pick(ENTRANCES),
    media: force.media || pick(MEDIA),
  };
}

// Danh sách layout ưu tiên theo media (đẩy vào prompt AI).
export function preferForMedia(media) {
  return (MEDIA_PREFER[media] || MEDIA_PREFER.mixed).slice();
}

// Id phong cách design (để composition.js gắn class .design-<style>). "" nếu là theme màu thường.
export function themeStyle(id) {
  return getTheme(id).style || "";
}

// Link Google Fonts cần nạp khi render (nếu design dùng font đặc biệt). "" nếu không cần.
export function themeFontLink(id) {
  return getTheme(id).fontLink || "";
}

// ===================================================================
// FONT chữ tuỳ chọn (override font của mẫu). TẤT CẢ đều là Google Fonts
// có subset "vietnamese" -> hiển thị đầy đủ dấu tiếng Việt, dễ đọc.
// id "auto" = giữ font theo mẫu (không override).
// ===================================================================
export const FONTS = [
  { id: "auto", name: "Theo mẫu (mặc định)", family: "", link: "" },
  {
    id: "be-vietnam-pro",
    name: "Be Vietnam Pro (Việt hoá chuẩn)",
    family: '"Be Vietnam Pro","Inter",system-ui,sans-serif',
    link: "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap",
  },
  {
    id: "inter",
    name: "Inter (gọn, hiện đại)",
    family: '"Inter","Segoe UI",system-ui,sans-serif',
    link: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
  },
  {
    id: "montserrat",
    name: "Montserrat (đậm, tiêu đề đẹp)",
    family: '"Montserrat","Inter",system-ui,sans-serif',
    link: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap",
  },
  {
    id: "nunito",
    name: "Nunito (bo tròn, thân thiện)",
    family: '"Nunito","Inter",system-ui,sans-serif',
    link: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap",
  },
  {
    id: "roboto",
    name: "Roboto (trung tính, dễ đọc)",
    family: '"Roboto","Inter",system-ui,sans-serif',
    link: "https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700;900&display=swap",
  },
  {
    id: "lexend",
    name: "Lexend (tối ưu dễ đọc)",
    family: '"Lexend","Inter",system-ui,sans-serif',
    link: "https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800;900&display=swap",
  },
  {
    id: "lora",
    name: "Lora (serif thanh lịch)",
    family: '"Lora","Georgia",serif',
    link: "https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&display=swap",
  },
  {
    id: "merriweather",
    name: "Merriweather (serif chắc chắn)",
    family: '"Merriweather","Georgia",serif',
    link: "https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700;900&display=swap",
  },
];

export function fontById(id) {
  return FONTS.find((f) => f.id === id) || FONTS[0];
}
// "" nếu auto (không override) -> composition giữ font theo mẫu.
export function fontFamilyOf(id) {
  return fontById(id).family;
}
export function fontLinkOf(id) {
  return fontById(id).link;
}
export function publicFonts() {
  return FONTS.map((f) => ({ id: f.id, name: f.name, family: f.family }));
}

// Danh sách rút gọn cho UI dựng preview mockup.
export function publicThemes() {
  return THEMES.map((t) => ({
    id: t.id,
    name: t.name,
    desc: t.desc,
    style: t.style || "",
    light: !!t.light,
    bg: t.bg,
    panel: t.panel,
    panel2: t.panel2,
    line: t.line,
    text: t.text,
    muted: t.muted,
    a1: t.a1,
    a2: t.a2,
    a3: t.a3,
    hl: t.hl,
    glow: rgba(t.glowHex, 0.5),
    titleFill: t.titleFill || "linear-gradient(120deg,#fff,#aebfd2)",
    font: t.font || DEFAULT_FONT,
  }));
}
