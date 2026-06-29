// Sinh composition HyperFrames từ một "kịch bản phân cảnh" đa layout.
// Mỗi scene có `layout` (title|statement|bullets|cards|formula|flow|compare|stat|steps|outro)
// và dữ liệu riêng. Giọng đọc liền mạch; frame chỉ minh hoạ, chuyển cảnh crossfade.
import { themeCss, DEFAULT_THEME_ID, themeStyle, themeFontLink, randomFormat, fontById } from "./themes.js";

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/[‒–—―−]/g, "-") // TUYỆT ĐỐI không em-dash/en-dash trong video
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function arr(x) {
  return Array.isArray(x) ? x : [];
}
function clean(s) {
  return String(s == null ? "" : s)
    .replace(/\s+/g, " ")
    .trim();
}
const ACCENTS = ["teal", "amber", "violet"];

function initials(s) {
  const w = String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!w.length) return "▶";
  if (w.length === 1) return w[0].slice(0, 3).toUpperCase();
  return w
    .slice(0, 3)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
}

// Dựng badge LOGO từ object đã giải ở pre-pass (Module A / assets.js).
// lg = { html, color, mono }. html là MARK bên trong (svg path / <img> / chữ cái) -
// nội dung do chính ta sinh ra ở assets.js nên nhúng thẳng (đã thoát ở nguồn).
// Quầng sáng + nền theo brand-color qua biến --c. lg rỗng -> trả "".
function logoBadge(lg, cls = "") {
  if (!lg || !lg.html) return "";
  const c = lg.color || "#7c8bdc";
  return `<div class="logo-badge ${lg.mono ? "mono" : ""} ${cls}" style="--c:${esc(c)}">${lg.html}</div>`;
}

// =====================================================================
// CSS RIÊNG CHO TỪNG "DESIGN STYLE" (viral MXH).
// Mỗi style được composition gắn class .design-<style> lên #stage; khối CSS dưới
// đây được nối SAU CSS gốc nên ghi đè được nền/font/viền/tiêu đề/lớp trang trí.
// 10 theme MÀU gốc không có style -> designCss("") trả "" -> render Y HỆT như cũ.
// =====================================================================

// Nhóm selector "thẻ/khối" dùng chung (để đổi viền/nền/bo góc đồng loạt).
// LƯU Ý: KHÔNG đưa .promptbox/.codebox vào đây. Chúng là "cửa sổ terminal" nền tối,
// chữ sáng cố định; nếu để design nền sáng đổi sang khung trắng thì chữ sáng sẽ mất hút
// (lỗi "mờ chữ"). Giữ nền tối -> luôn tương phản tốt trên MỌI mẫu.
const CARD_SEL = [
  ".vcard", ".bitem", ".fbox", ".step", ".stat", ".cmp-col",
  ".chip", ".pill", ".popup-card", ".quote-card",
];
// Prefix 1 danh sách selector con bằng .design-<d> rồi gắn rule.
function on(d, sels, rule) {
  return sels.map((s) => `.design-${d} ${s}`).join(",") + `{${rule}}`;
}
// Ẩn lớp trang trí điện ảnh mặc định (bokeh/glow/vignette/grain) cho design có nền riêng.
function hideDecor(d, { grain = true, vignette = true } = {}) {
  const sel = [".bokeh", "#bg-glow"];
  if (vignette) sel.push("#vignette");
  if (grain) sel.push("#film-grain");
  return on(d, sel, "display:none!important;");
}

function designCss(style) {
  switch (style) {
    // 1) NEO BRUTAL - nền vàng điện, viền đen 4px, bóng cứng lệch, không bo góc.
    case "neo-brutal":
      return [
        hideDecor("neo-brutal"),
        `#stage.design-neo-brutal{background:var(--bg);}`,
        on("neo-brutal", [".kicker"],
          "color:#fff;background:var(--red);display:inline-block;padding:10px 22px;border:4px solid #0a0a0a;border-radius:0;letter-spacing:3px;box-shadow:7px 7px 0 #0a0a0a;margin-bottom:30px;"),
        on("neo-brutal", [".heading", ".title-h", ".section-h", ".outro-h", ".statement-text"],
          "font-weight:900;letter-spacing:-1px;text-shadow:5px 5px 0 var(--a3);"),
        on("neo-brutal", CARD_SEL,
          "background:#fff;border:4px solid #0a0a0a;border-radius:0;box-shadow:8px 8px 0 #0a0a0a;backdrop-filter:none;"),
        on("neo-brutal", [".badge"], "border:4px solid #0a0a0a;border-radius:0;box-shadow:8px 8px 0 #0a0a0a;background:var(--a2);color:#fff;"),
        on("neo-brutal", [".statement .bar"], "background:#0a0a0a;width:14px;"),
        on("neo-brutal", [".cmp-vs"], "border:4px solid #0a0a0a;border-radius:0;box-shadow:6px 6px 0 #0a0a0a;background:var(--red);color:#fff;"),
        on("neo-brutal", [".cap"], "background:#0a0a0a;color:#fff;padding:10px 22px;border-radius:0;box-shadow:7px 7px 0 var(--red);text-shadow:none;"),
      ].join("\n");

    // 2) VAPORWAVE - hoàng hôn tím/hồng + lưới phối cảnh + mặt trời, không grain.
    case "vaporwave":
      return [
        hideDecor("vaporwave"),
        `#stage.design-vaporwave{background:linear-gradient(180deg,#2a0b4d 0%,#7a1f8c 46%,#ff5fa2 74%,#ffb86b 100%);}`,
        `#stage.design-vaporwave::before{content:"";position:absolute;left:50%;top:14%;width:440px;height:440px;transform:translateX(-50%);border-radius:50%;background:linear-gradient(#fff3a0,#ff5fa2);opacity:0.85;z-index:0;box-shadow:0 0 120px rgba(255,95,162,0.6);}`,
        `#stage.design-vaporwave::after{content:"";position:absolute;left:-50%;right:-50%;bottom:0;height:48%;z-index:0;background-image:linear-gradient(rgba(35,224,255,0.55) 2px,transparent 2px),linear-gradient(90deg,rgba(35,224,255,0.55) 2px,transparent 2px);background-size:88px 88px;transform:perspective(420px) rotateX(72deg);transform-origin:bottom center;}`,
        on("vaporwave", [".title-h", ".heading", ".section-h", ".outro-h", ".kicker"],
          'font-family:"Orbitron",sans-serif;'),
        on("vaporwave", [".title-h", ".heading", ".section-h", ".outro-h"],
          "text-shadow:0 0 2px #fff,3px 3px 0 #23e0ff,6px 6px 0 #ff4fd8;"),
        on("vaporwave", CARD_SEL,
          "background:rgba(42,15,77,0.6);border:1px solid #ff4fd8;border-radius:14px;box-shadow:0 0 22px rgba(255,79,216,0.4);backdrop-filter:blur(6px);"),
        on("vaporwave", [".kicker"], "text-shadow:0 0 12px var(--teal);"),
      ].join("\n");

    // 3) Y2K AERO - aqua bóng kính 2000s, thẻ gloss trắng bo tròn.
    case "y2k-aero":
      return [
        hideDecor("y2k-aero"),
        `#stage.design-y2k-aero{background:radial-gradient(120% 95% at 50% 0%,#f0faff,#cfeaff 55%,#a9d8ff);}`,
        `#stage.design-y2k-aero::before{content:"";position:absolute;left:-10%;top:-15%;width:60%;height:55%;border-radius:50%;background:radial-gradient(circle at 40% 40%,rgba(255,255,255,0.9),transparent 60%);z-index:0;}`,
        on("y2k-aero", CARD_SEL,
          "background:linear-gradient(180deg,#ffffff,#e9f5ff);border:1px solid #bfe0ff;border-radius:24px;box-shadow:0 12px 34px rgba(10,120,200,0.18),inset 0 2px 0 #fff;backdrop-filter:none;"),
        on("y2k-aero", [".kicker"],
          "color:#0aa3ff;background:linear-gradient(180deg,#fff,#dff1ff);border:1px solid #9fd0f5;border-radius:999px;padding:8px 20px;display:inline-block;box-shadow:inset 0 2px 0 #fff,0 4px 12px rgba(10,120,200,0.18);margin-bottom:26px;"),
        on("y2k-aero", [".badge"], "background:linear-gradient(160deg,#7fd0ff,#0aa3ff);border:1px solid #fff;color:#fff;box-shadow:inset 0 3px 0 rgba(255,255,255,0.6),0 14px 30px rgba(10,120,200,0.3);"),
        on("y2k-aero", [".cmp-vs"], "background:linear-gradient(160deg,#fff,#cfeaff);color:#0aa3ff;border:1px solid #9fd0f5;"),
      ].join("\n");

    // 4) EDITORIAL - tạp chí giấy kem, serif Playfair, kẻ chỉ mảnh.
    case "editorial":
      return [
        hideDecor("editorial"),
        `#stage.design-editorial{background:var(--bg);}`,
        on("editorial", [".heading", ".title-h", ".section-h", ".outro-h", ".quote-text", ".statement-text"],
          'font-family:"Playfair Display",Georgia,serif;font-weight:700;letter-spacing:0;'),
        on("editorial", [".kicker"],
          'font-family:"Inter",sans-serif;font-weight:600;letter-spacing:5px;color:var(--a2);border-top:2px solid var(--a2);border-bottom:2px solid var(--a2);padding:8px 0;display:inline-block;'),
        on("editorial", CARD_SEL,
          "background:#fffdf8;border:1px solid #d8cdb8;border-radius:4px;box-shadow:0 8px 26px rgba(70,50,15,0.07);backdrop-filter:none;"),
        on("editorial", [".badge"], "background:#fffdf8;border:1px solid #d8cdb8;border-radius:6px;color:var(--a2);box-shadow:0 8px 26px rgba(70,50,15,0.08);"),
        on("editorial", [".quote-card"], "background:#fffdf8;border:1px solid #d8cdb8;"),
        on("editorial", [".qmark"], "color:rgba(154,106,44,0.4);"),
        on("editorial", [".cmp-vs"], "background:#fffdf8;border:1px solid #d8cdb8;color:var(--a2);"),
      ].join("\n");

    // 5) AURORA MESH - nền cực quang nhiều màu mờ, thẻ kính SaaS.
    case "aurora-mesh":
      return [
        hideDecor("aurora-mesh", { vignette: false }),
        `#stage.design-aurora-mesh{background:radial-gradient(45% 55% at 14% 18%,rgba(124,139,255,0.6),transparent 70%),radial-gradient(48% 58% at 86% 22%,rgba(255,122,198,0.52),transparent 70%),radial-gradient(55% 62% at 72% 86%,rgba(33,212,197,0.5),transparent 70%),radial-gradient(45% 52% at 22% 82%,rgba(255,159,107,0.42),transparent 70%),#070a18;}`,
        on("aurora-mesh", CARD_SEL,
          "background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.18);border-radius:22px;box-shadow:0 18px 50px rgba(0,0,0,0.35),inset 0 1px 0 rgba(255,255,255,0.2);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);"),
        on("aurora-mesh", [".badge"], "background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.25);backdrop-filter:blur(12px);"),
      ].join("\n");

    // 6) POP COMIC - pop-art halftone, chữ Bangers viền đen, bóng cứng.
    case "pop-comic":
      return [
        hideDecor("pop-comic"),
        `#stage.design-pop-comic{background:var(--bg);}`,
        `#stage.design-pop-comic::before{content:"";position:absolute;inset:0;z-index:0;opacity:0.22;background-image:radial-gradient(#e8261c 28%,transparent 30%);background-size:38px 38px;}`,
        on("pop-comic", [".heading", ".title-h", ".section-h", ".outro-h"],
          'font-family:"Bangers",cursive;letter-spacing:2px;-webkit-text-stroke:3px #0a0a0a;text-shadow:6px 6px 0 #0a0a0a;'),
        on("pop-comic", [".kicker"],
          "color:#0a0a0a;background:var(--a3);border:3px solid #0a0a0a;border-radius:8px;padding:8px 18px;display:inline-block;box-shadow:5px 5px 0 #0a0a0a;margin-bottom:28px;"),
        on("pop-comic", CARD_SEL,
          "background:#fff;border:4px solid #0a0a0a;border-radius:16px;box-shadow:7px 7px 0 #0a0a0a;backdrop-filter:none;"),
        on("pop-comic", [".badge"], "background:var(--a1);color:#fff;border:4px solid #0a0a0a;border-radius:18px;box-shadow:7px 7px 0 #0a0a0a;"),
        on("pop-comic", [".cmp-vs"], "background:var(--a3);color:#0a0a0a;border:4px solid #0a0a0a;box-shadow:5px 5px 0 #0a0a0a;"),
        on("pop-comic", [".cap"], '-webkit-text-stroke:2px #0a0a0a;color:#fff;text-shadow:3px 3px 0 #0a0a0a;font-weight:800;'),
      ].join("\n");

    // 7) NEON GLOW - cyberpunk nền đen, chữ phát sáng, lưới neon mờ dần.
    case "neon-glow":
      return [
        hideDecor("neon-glow", { grain: false }),
        `#stage.design-neon-glow{background:#03040a;}`,
        `#stage.design-neon-glow::before{content:"";position:absolute;inset:0;z-index:0;opacity:0.4;background-image:linear-gradient(rgba(29,233,255,0.22) 1px,transparent 1px),linear-gradient(90deg,rgba(29,233,255,0.22) 1px,transparent 1px);background-size:56px 56px;-webkit-mask:radial-gradient(circle at 50% 45%,#000,transparent 78%);mask:radial-gradient(circle at 50% 45%,#000,transparent 78%);}`,
        on("neon-glow", [".title-h", ".heading", ".section-h", ".outro-h", ".kicker"],
          'font-family:"Orbitron",sans-serif;'),
        on("neon-glow", [".title-h"],
          "background:none;-webkit-text-fill-color:var(--teal);color:var(--teal);text-shadow:0 0 8px var(--teal),0 0 26px var(--teal),0 0 52px rgba(29,233,255,0.6);"),
        on("neon-glow", [".heading", ".section-h", ".outro-h", ".statement-text", ".quote-text"],
          "text-shadow:0 0 8px var(--teal),0 0 22px rgba(29,233,255,0.55);"),
        on("neon-glow", [".kicker"], "text-shadow:0 0 10px currentColor,0 0 22px currentColor;"),
        on("neon-glow", CARD_SEL,
          "background:rgba(10,15,30,0.65);border:1px solid var(--teal);border-radius:14px;box-shadow:0 0 16px rgba(29,233,255,0.35),inset 0 0 16px rgba(29,233,255,0.08);backdrop-filter:blur(4px);"),
        on("neon-glow", [".badge"], "background:rgba(10,15,30,0.8);border:1px solid var(--violet);box-shadow:0 0 22px rgba(189,0,255,0.5);"),
      ].join("\n");

    // 8) SWISS MONO - tối giản Thuỵ Sĩ: trắng/đen, accent đỏ, viền vuông.
    case "swiss-mono":
      return [
        hideDecor("swiss-mono"),
        `#stage.design-swiss-mono{background:var(--bg);}`,
        on("swiss-mono", [".kicker"],
          "color:#fff;background:var(--red);border-radius:0;padding:7px 16px;letter-spacing:4px;display:inline-block;margin-bottom:28px;"),
        on("swiss-mono", [".heading", ".title-h", ".section-h", ".outro-h", ".statement-text"],
          "font-weight:800;letter-spacing:-2px;"),
        on("swiss-mono", CARD_SEL,
          "background:#fff;border:1px solid #111;border-radius:0;box-shadow:none;backdrop-filter:none;"),
        on("swiss-mono", [".badge"], "background:#111;color:#fff;border-radius:0;box-shadow:none;"),
        on("swiss-mono", [".statement .bar"], "background:var(--red);"),
        on("swiss-mono", [".cmp-vs"], "background:var(--red);color:#fff;border:none;"),
      ].join("\n");

    // 9) FROST GLASS - glassmorphism: blob màu rực mờ + thẻ kính dày.
    case "frost-glass":
      return [
        hideDecor("frost-glass", { vignette: false }),
        `#stage.design-frost-glass{background:#0c1430;}`,
        `#stage.design-frost-glass::before{content:"";position:absolute;inset:-12%;z-index:0;filter:blur(70px);background:radial-gradient(circle at 20% 28%,#5ad1ff,transparent 46%),radial-gradient(circle at 82% 24%,#b07bff,transparent 46%),radial-gradient(circle at 62% 82%,#ff8fd0,transparent 46%),radial-gradient(circle at 30% 80%,#ffd86b,transparent 42%);}`,
        on("frost-glass", CARD_SEL,
          "background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.3);border-radius:24px;box-shadow:0 10px 44px rgba(0,0,0,0.28),inset 0 1px 0 rgba(255,255,255,0.45);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);"),
        on("frost-glass", [".badge"], "background:rgba(255,255,255,0.16);border:1px solid rgba(255,255,255,0.4);backdrop-filter:blur(20px);"),
      ].join("\n");

    // 10) BLUEPRINT - bản vẽ kỹ thuật: lưới cyan kép, font mono, viền nét đứt.
    case "blueprint":
      return [
        hideDecor("blueprint"),
        `#stage.design-blueprint{background:#0a1b2e;}`,
        `#stage.design-blueprint::before{content:"";position:absolute;inset:0;z-index:0;opacity:0.6;background-image:linear-gradient(rgba(92,200,255,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(92,200,255,0.12) 1px,transparent 1px),linear-gradient(rgba(92,200,255,0.22) 1px,transparent 1px),linear-gradient(90deg,rgba(92,200,255,0.22) 1px,transparent 1px);background-size:32px 32px,32px 32px,160px 160px,160px 160px;}`,
        on("blueprint", CARD_SEL,
          "background:rgba(120,200,255,0.05);border:1px dashed var(--line);border-radius:6px;box-shadow:none;backdrop-filter:none;"),
        on("blueprint", [".kicker"],
          "border:1px solid var(--teal);border-radius:4px;padding:6px 14px;display:inline-block;margin-bottom:24px;"),
        on("blueprint", [".badge"], "background:rgba(120,200,255,0.06);border:1px dashed var(--teal);border-radius:6px;color:var(--teal);box-shadow:none;"),
        on("blueprint", [".cmp-vs"], "background:rgba(120,200,255,0.06);border:1px dashed var(--teal);color:var(--teal);"),
      ].join("\n");

    default:
      return "";
  }
}

// =====================================================================
// FORMAT CHUYỂN CẢNH (motion) - mỗi design một "format" khác nhau, không chỉ skin.
// Mỗi design ánh xạ tới 1 kiểu transition; hàm transition() trong trang sẽ được
// thay thân theo format. 10 theme màu gốc -> "crossfade" (như cũ, không hồi quy).
// =====================================================================
// transition + caption + entrance là RANDOM mỗi video (randomFormat() trong themes.js),
// không fix cứng theo mẫu. Chỉ MÀU/skin cố định theo mẫu.

// Sinh thân hàm transition(t, prevSel, nextSel) theo format. tl & gsap có sẵn trong scope.
function transitionJs(key) {
  const wrap = (body) => `
          function transition(t, prevSel, nextSel) {\n${body}\n          }`;
  switch (key) {
    case "crossfade-slow":
      return wrap(
        `            tl.to(nextSel, { opacity: 1, duration: 0.95, ease: "sine.inOut" }, t);
            if (prevSel) tl.to(prevSel, { opacity: 0, duration: 0.95, ease: "sine.inOut" }, t);`,
      );
    case "slide":
      return wrap(
        `            tl.set(nextSel, { opacity: 1, xPercent: 100 }, t);
            tl.to(nextSel, { xPercent: 0, duration: 0.7, ease: "power3.inOut" }, t);
            if (prevSel) { tl.to(prevSel, { xPercent: -100, duration: 0.7, ease: "power3.inOut" }, t);
              tl.set(prevSel, { opacity: 0, xPercent: 0 }, t + 0.72); }`,
      );
    case "zoom":
      return wrap(
        `            tl.set(nextSel, { opacity: 0, scale: 1.14 }, t);
            tl.to(nextSel, { opacity: 1, scale: 1, duration: 0.85, ease: "power2.out" }, t);
            if (prevSel) { tl.to(prevSel, { opacity: 0, scale: 0.9, duration: 0.7, ease: "power2.in" }, t);
              tl.set(prevSel, { scale: 1 }, t + 0.86); }`,
      );
    case "dissolve":
      return wrap(
        `            tl.set(nextSel, { opacity: 0, filter: "blur(16px)" }, t);
            tl.to(nextSel, { opacity: 1, filter: "blur(0px)", duration: 0.85, ease: "power2.out" }, t);
            if (prevSel) { tl.to(prevSel, { opacity: 0, filter: "blur(16px)", duration: 0.7, ease: "power2.in" }, t);
              tl.set(prevSel, { filter: "blur(0px)" }, t + 0.86); }`,
      );
    case "wipe":
      return wrap(
        `            tl.set(nextSel, { opacity: 1, clipPath: "inset(0 100% 0 0)", webkitClipPath: "inset(0 100% 0 0)" }, t);
            tl.to(nextSel, { clipPath: "inset(0 0% 0 0)", webkitClipPath: "inset(0 0% 0 0)", duration: 0.7, ease: "power3.inOut" }, t);
            if (prevSel) tl.set(prevSel, { opacity: 0 }, t + 0.66);`,
      );
    case "iris": // mở ống kính tròn từ giữa
      return wrap(
        `            tl.set(nextSel, { opacity: 1, clipPath: "circle(0% at 50% 50%)", webkitClipPath: "circle(0% at 50% 50%)" }, t);
            tl.to(nextSel, { clipPath: "circle(75% at 50% 50%)", webkitClipPath: "circle(75% at 50% 50%)", duration: 0.75, ease: "power2.inOut" }, t);
            if (prevSel) tl.set(prevSel, { opacity: 0 }, t + 0.7);`,
      );
    case "push-up": // cảnh sau đẩy dọc từ dưới lên, cảnh trước trôi lên
      return wrap(
        `            tl.set(nextSel, { opacity: 1, yPercent: 100 }, t);
            tl.to(nextSel, { yPercent: 0, duration: 0.7, ease: "power3.inOut" }, t);
            if (prevSel) { tl.to(prevSel, { yPercent: -100, duration: 0.7, ease: "power3.inOut" }, t);
              tl.set(prevSel, { opacity: 0, yPercent: 0 }, t + 0.72); }`,
      );
    case "flip": // lật 3D quanh trục dọc
      return wrap(
        `            tl.set(nextSel, { opacity: 0, rotationY: -100, transformPerspective: 1400, transformOrigin: "center center" }, t);
            tl.to(nextSel, { opacity: 1, rotationY: 0, duration: 0.8, ease: "power3.out" }, t + 0.18);
            if (prevSel) { tl.to(prevSel, { opacity: 0, rotationY: 100, transformPerspective: 1400, duration: 0.55, ease: "power2.in" }, t);
              tl.set(prevSel, { rotationY: 0 }, t + 0.74); }`,
      );
    case "flash":
      return wrap(
        `            tl.set("#flash", { backgroundColor: "#ffffff", opacity: 0 }, t);
            tl.set(nextSel, { opacity: 0 }, t);
            tl.to("#flash", { opacity: 0.92, duration: 0.12, ease: "power2.in" }, t);
            tl.set(nextSel, { opacity: 1 }, t + 0.13);
            if (prevSel) tl.set(prevSel, { opacity: 0 }, t + 0.13);
            tl.to("#flash", { opacity: 0, duration: 0.26, ease: "power2.out" }, t + 0.13);`,
      );
    case "glitch":
      return wrap(
        `            tl.set("#flash", { backgroundColor: "#1de9ff", opacity: 0 }, t);
            tl.set(nextSel, { opacity: 0 }, t);
            tl.to("#flash", { opacity: 0.55, duration: 0.07 }, t);
            tl.to(nextSel, { x: 10, duration: 0.04, yoyo: true, repeat: 3 }, t + 0.02);
            tl.set(nextSel, { opacity: 1 }, t + 0.12);
            if (prevSel) tl.set(prevSel, { opacity: 0 }, t + 0.12);
            tl.to("#flash", { opacity: 0, duration: 0.22, ease: "power2.out" }, t + 0.12);
            tl.set(nextSel, { x: 0 }, t + 0.24);`,
      );
    default: // crossfade (mặc định - giữ hành vi cũ)
      return wrap(
        `            tl.to(nextSel, { opacity: 1, duration: 0.6, ease: "power1.inOut" }, t);
            if (prevSel) tl.to(prevSel, { opacity: 0, duration: 0.6, ease: "power1.inOut" }, t);`,
      );
  }
}

// Tô màu cú pháp ĐƠN GIẢN & AN TOÀN (escape trước; tách comment cuối dòng để khỏi lồng thẻ hỏng).
const CODE_KW =
  /\b(while|for|if|else|elif|do|done|then|fi|return|function|const|let|var|import|export|from|class|def|async|await|true|false|null|None|print|echo|cat|git|npm|npx|sudo|cd|pip|run|yield|in|of)\b/g;
function highlightCode(raw) {
  const e = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return String(raw == null ? "" : raw)
    .replace(/[‒–—―−]/g, "-")
    .replace(/\t/g, "  ")
    .split("\n")
    .map((line) => {
      let code = line,
        comment = "";
      const cm = line.match(/(^|\s)(#|\/\/)/); // bỏ qua "https://" (không có space trước //)
      if (cm) {
        const idx = cm.index + cm[1].length;
        code = line.slice(0, idx);
        comment = line.slice(idx);
      }
      // Tô TỪ KHOÁ trước (trên text đã escape, CHƯA có markup) -> rồi mới bọc chuỗi,
      // tránh regex từ khoá ăn vào chính thẻ <span class="..."> vừa chèn.
      let h = e(code)
        .replace(CODE_KW, '<span class="ck">$&</span>')
        .replace(/('[^']*')/g, '<span class="cs">$1</span>');
      if (comment) h += `<span class="cc">${e(comment)}</span>`;
      return `<span class="cl">${h || "&nbsp;"}</span>`;
    })
    .join("");
}

// Lọc HTML do AI sinh (layout "custom"): bỏ script/iframe/handler nguy hiểm. Phần còn lại đặt
// trong khung overflow:hidden -> dù AI dựng quá tay cũng KHÔNG tràn ra ngoài khung.
function sanitizeCustomHtml(html) {
  return String(html == null ? "" : html)
    .replace(/[‒–—―−]/g, "-")
    .replace(/<\s*(script|iframe|object|embed|link|meta|base)\b[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*(script|iframe|object|embed|link|meta|base)\b[^>]*>/gi, "")
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/(href|src)\s*=\s*("javascript:[^"]*"|'javascript:[^']*')/gi, '$1="#"');
}

// ---------- HTML cho từng layout ----------
function sceneHtml(s, i) {
  const acc = ACCENTS[i % ACCENTS.length];
  const p = `s${i}`;
  const kicker = s.kicker ? `<div class="kicker" id="${p}_k">${esc(s.kicker)}</div>` : "";
  const heading = s.heading ? `<h2 class="heading" id="${p}_h">${esc(s.heading)}</h2>` : "";
  let inner = "";

  switch (s.layout) {
    case "title":
      inner = `<div class="badge" id="${p}_badge">${esc(s.initials || initials(s.title || s.heading))}</div>
        <h1 class="title-h" id="${p}_h">${esc(s.title || s.heading)}</h1>
        ${s.subtitle ? `<div class="title-sub" id="${p}_sub">${esc(s.subtitle)}</div>` : ""}`;
      break;

    case "statement":
      inner = `${kicker}<div class="statement" id="${p}_st"><span class="bar"></span><div class="statement-text">${esc(s.text || s.heading)}</div></div>`;
      break;

    case "bullets":
      inner =
        `${kicker}${heading}<div class="blist">` +
        arr(s.items)
          .slice(0, 5)
          .map(
            (it, j) =>
              `<div class="bitem" id="${p}_i${j}"><span class="bic">${esc(it.icon || "▹")}</span><span class="btext">${esc(it.text || it.title || it)}</span></div>`,
          )
          .join("") +
        `</div>`;
      break;

    case "cards":
      inner =
        `${kicker}${heading}<div class="card-row">` +
        arr(s.items)
          .slice(0, 3)
          .map(
            (it, j) =>
              `<div class="vcard" id="${p}_i${j}"><div class="ic">${esc(it.icon || "◆")}</div><h3>${esc(it.title || "")}</h3><p>${esc(it.body || "")}</p></div>`,
          )
          .join("") +
        `</div>`;
      break;

    case "formula":
      inner =
        `${kicker}${heading}<div class="formula">` +
        arr(s.terms)
          .map((t, j) => {
            if (t.op) return `<div class="op" id="${p}_i${j}">${esc(t.op)}</div>`;
            return `<div class="pill ${esc(t.kind || "")}" id="${p}_i${j}">${esc(t.label)}</div>`;
          })
          .join("") +
        `</div>`;
      break;

    case "flow": {
      const steps = arr(s.steps).slice(0, 5);
      inner =
        `${kicker}${heading}<div class="flow">` +
        steps
          .map((st, j) => {
            const box = `<div class="fbox ${st.hot ? "hot" : ""}" id="${p}_i${j}"><div class="ic">${esc(st.icon || "■")}</div><div class="t">${esc(st.title || "")}</div>${st.desc ? `<div class="d">${esc(st.desc)}</div>` : ""}</div>`;
            const arrow = j < steps.length - 1 ? `<div class="arrow" id="${p}_a${j}">→</div>` : "";
            return box + arrow;
          })
          .join("") +
        `</div>`;
      break;
    }

    case "compare": {
      const L = s.left || {},
        R = s.right || {};
      const col = (c, side) =>
        `<div class="cmp-col ${side}"><div class="cmp-title">${esc(c.title || "")}</div>` +
        arr(c.points)
          .slice(0, 4)
          .map((pt) => `<div class="cmp-pt">${esc(pt)}</div>`)
          .join("") +
        `</div>`;
      inner = `${kicker}${heading}<div class="cmp"><div class="cmp-wrap" id="${p}_L">${col(L, "l")}</div><div class="cmp-vs" id="${p}_vs">VS</div><div class="cmp-wrap" id="${p}_R">${col(R, "r")}</div></div>`;
      break;
    }

    case "stat":
      inner =
        `${kicker}${heading}<div class="stat-row">` +
        arr(s.stats)
          .slice(0, 4)
          .map(
            (st, j) =>
              `<div class="stat" id="${p}_i${j}"><div class="stat-val">${esc(st.value)}</div><div class="stat-label">${esc(st.label || "")}</div></div>`,
          )
          .join("") +
        `</div>`;
      break;

    case "steps":
      inner =
        `${kicker}${heading}<div class="steps">` +
        arr(s.items)
          .slice(0, 5)
          .map(
            (it, j) =>
              `<div class="step" id="${p}_i${j}"><div class="step-num">${j + 1}</div><div class="step-body"><div class="step-title">${esc(it.title || "")}</div>${it.body ? `<div class="step-desc">${esc(it.body)}</div>` : ""}</div></div>`,
          )
          .join("") +
        `</div>`;
      break;

    case "outro":
      inner =
        `${kicker}<h2 class="outro-h" id="${p}_h">${esc(s.heading || "Cảm ơn bạn đã theo dõi")}</h2>` +
        (arr(s.chips).length
          ? `<div class="chips">` +
            arr(s.chips)
              .slice(0, 4)
              .map((c, j) => `<div class="chip" id="${p}_i${j}">${esc(c)}</div>`)
              .join("") +
            `</div>`
          : "") +
        (s.subtitle ? `<div class="outro-sub" id="${p}_sub">${esc(s.subtitle)} 🎬</div>` : "");
      break;

    case "section": {
      // Số thứ tự ĐỎ lớn + tiêu đề bold nhiều dòng (như mở đầu một phần).
      const num =
        s.num != null && s.num !== "" ? `<span class="secnum">${esc(s.num)}.</span> ` : "";
      inner =
        `${kicker}<h1 class="section-h" id="${p}_h">${num}${esc(s.heading || s.title)}</h1>` +
        (s.subtitle ? `<div class="section-sub" id="${p}_sub">${esc(s.subtitle)}</div>` : "");
      break;
    }

    case "quote": {
      // Thẻ trích dẫn kính mờ (glassmorphism) + dấu ngoặc kép trang trí + badge nhỏ.
      const badge = esc(s.kicker || "TRÍCH DẪN");
      inner = `<div class="quote-card" id="${p}_qc">
        <div class="quote-badge">${badge}</div>
        <div class="qmark qmark-top">“</div>
        <div class="quote-text" id="${p}_qt">${esc(s.text || s.heading)}</div>
        <div class="qmark qmark-bot">”</div>
        ${s.subtitle ? `<div class="quote-by" id="${p}_qby">${esc(s.subtitle)}</div>` : ""}
      </div>`;
      break;
    }

    case "prompt": {
      // Khung MẪU PROMPT/ví dụ hiển thị NGUYÊN VĂN trên màn hình (giữ xuống dòng).
      const tag = esc(s.kicker || "PROMPT MẪU");
      inner =
        `${s.heading ? `<h2 class="heading" id="${p}_h">${esc(s.heading)}</h2>` : ""}` +
        `<div class="promptbox" id="${p}_pb">
        <div class="pb-bar"><span class="pb-dot r"></span><span class="pb-dot y"></span><span class="pb-dot g"></span><span class="pb-tag">${tag}</span><span class="pb-copy">⧉ Sao chép</span></div>
        <div class="pb-body" id="${p}_pt">${esc(s.text || s.body || "")}</div>
      </div>` +
        `${s.subtitle ? `<div class="pb-note" id="${p}_sub">${esc(s.subtitle)}</div>` : ""}`;
      break;
    }

    case "popup": {
      // Các thẻ ví dụ/nguồn "bật lên" kiểu thông báo (pop-up).
      const items = arr(s.items).slice(0, 4);
      inner =
        `${kicker}${heading}<div class="popups">` +
        items
          .map(
            (it, j) =>
              `<div class="popup-card" id="${p}_i${j}"><div class="pc-ic">${esc(it.icon || "💬")}</div><div class="pc-body"><div class="pc-title">${esc(it.title || it.label || "")}</div>${it.body || it.text ? `<div class="pc-text">${esc(it.body || it.text)}</div>` : ""}</div>${it.tag ? `<div class="pc-tag">${esc(it.tag)}</div>` : ""}</div>`,
          )
          .join("") +
        `</div>`;
      break;
    }

    case "photo": {
      // Ảnh THẬT full-bleed + lớp tối + chữ dưới (Ken Burns chạy nền).
      const credit = s._credit ? `<div class="img-credit">${esc(s._credit)}</div>` : "";
      const cap =
        `${kicker}${s.heading ? `<h2 class="photo-h" id="${p}_h">${esc(s.heading)}</h2>` : ""}` +
        (s.subtitle ? `<div class="photo-sub" id="${p}_sub">${esc(s.subtitle)}</div>` : "");
      inner = s.image
        ? `<div class="photo-wrap"><img class="photo-img" id="${p}_img" src="${esc(s.image)}" alt="" /><div class="photo-scrim"></div></div>
           <div class="photo-cap" id="${p}_pc">${cap}</div>${credit}`
        : `${kicker}${heading}`; // không có ảnh -> degrade về tiêu đề
      break;
    }

    case "split": {
      // Nửa ảnh thật + nửa chữ.
      const credit = s._credit ? `<div class="img-credit">${esc(s._credit)}</div>` : "";
      const media = s.image
        ? `<div class="split-media"><img id="${p}_img" src="${esc(s.image)}" alt="" /></div>`
        : "";
      inner = `<div class="split ${s.image ? "" : "nomedia"}">${media}<div class="split-text" id="${p}_tx">${kicker}${s.heading ? `<h2 class="heading" id="${p}_h">${esc(s.heading)}</h2>` : ""}${s.body ? `<div class="split-body">${esc(s.body)}</div>` : ""}</div></div>${credit}`;
      break;
    }

    case "gallery": {
      // 2-3 ảnh thật dạng lưới.
      const imgs = arr(s.images)
        .map((x) => (typeof x === "string" ? x : x && x.src))
        .filter(Boolean)
        .slice(0, 3);
      const credit = s._credit ? `<div class="img-credit">${esc(s._credit)}</div>` : "";
      inner = imgs.length
        ? `${kicker}${heading}<div class="gallery g${imgs.length}">` +
          imgs.map((src, j) => `<div class="gphoto" id="${p}_i${j}"><img src="${esc(src)}" alt="" /></div>`).join("") +
          `</div>${credit}`
        : `${kicker}${heading}`;
      break;
    }

    case "bars": {
      // Biểu đồ cột động (sơ đồ số liệu). items/stats: [{label,value}] value 0-100 hoặc "75%".
      const data = (arr(s.items).length ? arr(s.items) : arr(s.stats)).slice(0, 6);
      const pct = (v) => {
        const n = parseFloat(String(v ?? "").replace(/[^\d.]/g, ""));
        return Math.max(2, Math.min(100, isFinite(n) ? n : 0));
      };
      inner =
        `${kicker}${heading}<div class="bars">` +
        data
          .map((it, j) => {
            const w = pct(it.value ?? it.val ?? it.percent);
            const lab = esc(it.label || it.title || "");
            const val = esc(it.value != null ? it.value : `${w}%`);
            return `<div class="bar-row" id="${p}_i${j}"><div class="bar-label">${lab}</div><div class="bar-track"><div class="bar-fill" style="width:${w}%"><span class="bar-val">${val}</span></div></div></div>`;
          })
          .join("") +
        `</div>`;
      break;
    }

    case "timeline": {
      // Dòng thời gian dọc (sơ đồ tiến trình). items/steps: [{time?,title,body}].
      const data = (arr(s.items).length ? arr(s.items) : arr(s.steps)).slice(0, 6);
      inner =
        `${kicker}${heading}<div class="timeline">` +
        data
          .map((it, j) => {
            const time = it.time || it.num || it.date;
            return `<div class="tl-item" id="${p}_i${j}"><div class="tl-dot"></div><div class="tl-card">${time ? `<div class="tl-time">${esc(time)}</div>` : ""}<div class="tl-title">${esc(it.title || "")}</div>${it.body || it.desc ? `<div class="tl-body">${esc(it.body || it.desc)}</div>` : ""}</div></div>`;
          })
          .join("") +
        `</div>`;
      break;
    }

    case "bignum": {
      // 1 con số/từ khoá KHỔNG LỒ (hook). value bắt buộc, heading = nhãn, subtitle = chú thích.
      inner =
        `${kicker}<div class="bignum" id="${p}_bn">` +
        `<div class="bignum-val">${esc(s.value || s.heading || s.title || "")}</div>` +
        (s.heading && s.value ? `<div class="bignum-cap">${esc(s.heading)}</div>` : "") +
        (s.subtitle ? `<div class="bignum-sub">${esc(s.subtitle)}</div>` : "") +
        `</div>`;
      break;
    }

    case "checklist": {
      inner =
        `${kicker}${heading}<div class="checklist">` +
        arr(s.items)
          .slice(0, 6)
          .map(
            (it, j) =>
              `<div class="check-item" id="${p}_i${j}"><span class="check-ic">✓</span><span class="check-tx">${esc(it.text || it.title || it)}</span></div>`,
          )
          .join("") +
        `</div>`;
      break;
    }

    case "icongrid": {
      const items = arr(s.items).slice(0, 6);
      inner =
        `${kicker}${heading}<div class="icongrid n${items.length}">` +
        items
          .map(
            (it, j) =>
              `<div class="ig-cell" id="${p}_i${j}"><div class="ig-ic">${esc(it.icon || "◆")}</div><div class="ig-t">${esc(it.title || it.text || "")}</div></div>`,
          )
          .join("") +
        `</div>`;
      break;
    }

    case "pros": {
      // Ưu / Nhược (pros & cons). left/right: {title, points:[]}.
      const L = s.left || {},
        R = s.right || {};
      const col = (c, kind) =>
        `<div class="pros-col ${kind}"><div class="pros-h">${kind === "pro" ? "✓ " : "✗ "}${esc(c.title || (kind === "pro" ? "Ưu điểm" : "Nhược điểm"))}</div>` +
        arr(c.points)
          .slice(0, 4)
          .map((pt) => `<div class="pros-pt">${esc(pt)}</div>`)
          .join("") +
        `</div>`;
      inner = `${kicker}${heading}<div class="pros" id="${p}_pr">${col(L, "pro")}${col(R, "con")}</div>`;
      break;
    }

    case "gauge": {
      // Vòng tròn % (donut). stats/items: [{value,label}] 1-3.
      const data = (arr(s.stats).length ? arr(s.stats) : arr(s.items)).slice(0, 3);
      const C = 2 * Math.PI * 52;
      inner =
        `${kicker}${heading}<div class="gauges">` +
        data
          .map((it, j) => {
            const pct = Math.max(0, Math.min(100, parseFloat(String(it.value ?? it.val ?? "").replace(/[^\d.]/g, "")) || 0));
            const off = (C * (1 - pct / 100)).toFixed(1);
            const label = esc(it.label || it.title || "");
            const val = esc(it.value != null ? it.value : `${Math.round(pct)}%`);
            return `<div class="gauge" id="${p}_i${j}"><svg viewBox="0 0 120 120" class="gauge-svg"><circle class="gauge-bg" cx="60" cy="60" r="52"></circle><circle class="gauge-fg" cx="60" cy="60" r="52" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${off}"></circle></svg><div class="gauge-val">${val}</div><div class="gauge-label">${label}</div></div>`;
          })
          .join("") +
        `</div>`;
      break;
    }

    case "definition": {
      inner =
        `${kicker}<div class="defn" id="${p}_df">` +
        `<div class="defn-term">${esc(s.term || s.heading || s.title || "")}</div>` +
        `<div class="defn-line"></div>` +
        `<div class="defn-body">${esc(s.text || s.body || "")}</div>` +
        `</div>`;
      break;
    }

    case "roadmap": {
      // Dòng thời gian NGANG. items/steps: [{time,title,body}] 3-5.
      const list = (arr(s.items).length ? arr(s.items) : arr(s.steps)).slice(0, 5);
      inner =
        `${kicker}${heading}<div class="roadmap" id="${p}_rm">` +
        list
          .map(
            (it, j) =>
              `<div class="rm-item" id="${p}_i${j}"><div class="rm-dot"></div>${it.time || it.num ? `<div class="rm-time">${esc(it.time || it.num)}</div>` : ""}<div class="rm-title">${esc(it.title || "")}</div>${it.body || it.desc ? `<div class="rm-body">${esc(it.body || it.desc)}</div>` : ""}</div>`,
          )
          .join("") +
        `</div>`;
      break;
    }

    case "kpi": {
      const list = (arr(s.stats).length ? arr(s.stats) : arr(s.items)).slice(0, 4);
      inner =
        `${kicker}${heading}<div class="kpis">` +
        list
          .map((it, j) => {
            const delta = String(it.delta || "");
            const tr = String(it.trend || "").toLowerCase();
            const up = tr === "up" || /^\+/.test(delta);
            const down = tr === "down" || /^-/.test(delta);
            const arrow = up ? "▲" : down ? "▼" : "";
            const cls = up ? "up" : down ? "down" : "";
            return `<div class="kpi-card ${cls}" id="${p}_i${j}"><div class="kpi-val">${esc(it.value || "")}</div><div class="kpi-label">${esc(it.label || it.title || "")}</div>${delta ? `<div class="kpi-delta">${arrow} ${esc(delta)}</div>` : ""}</div>`;
          })
          .join("") +
        `</div>`;
      break;
    }

    case "code": {
      // Khung CODE có tô màu cú pháp + số dòng (kiểu ảnh "ralph.sh").
      const name = esc(s.kicker || s.name || "code");
      inner =
        `${s.heading ? `<h2 class="heading" id="${p}_h">${esc(s.heading)}</h2>` : ""}` +
        `<div class="codebox" id="${p}_cb"><div class="cb-bar"><span class="cb-dot r"></span><span class="cb-dot y"></span><span class="cb-dot g"></span><span class="cb-name">${name}</span></div>` +
        `<div class="cb-body">${highlightCode(s.code || s.text || s.body || "")}</div></div>` +
        (s.subtitle ? `<div class="pb-note" id="${p}_sub">${esc(s.subtitle)}</div>` : "");
      break;
    }

    case "browser": {
      // Mockup TRANG WEB/BÁO (ảnh chụp giả) + thanh URL + callout. Thay cho việc tải ảnh ngoài.
      const url = esc(s.url || "vi.wikipedia.org");
      inner =
        `${kicker}<div class="browserbox" id="${p}_bw">` +
        `<div class="bw-bar"><span class="bw-dot r"></span><span class="bw-dot y"></span><span class="bw-dot g"></span><div class="bw-url">${url}</div></div>` +
        `<div class="bw-page"><div class="bw-title">${esc(s.heading || s.title || "")}</div>` +
        (s.text || s.body ? `<div class="bw-text">${esc(s.text || s.body)}</div>` : "") +
        (s.tag ? `<div class="bw-tag">${esc(s.tag)}</div>` : "") +
        `</div></div>` +
        (s.subtitle ? `<div class="pb-note" id="${p}_sub">${esc(s.subtitle)}</div>` : "");
      break;
    }

    case "loop": {
      // Sơ đồ VÒNG LẶP tròn: các bước quanh vòng + nhãn giữa (kiểu ảnh "while (chưa xong)").
      const list = (arr(s.steps).length ? arr(s.steps) : arr(s.items)).slice(0, 6);
      const n = Math.max(1, list.length);
      const R = 240,
        CC = 340;
      const nodes = list
        .map((st, j) => {
          const ang = ((-90 + (j * 360) / n) * Math.PI) / 180;
          const x = Math.round(CC + R * Math.cos(ang));
          const y = Math.round(CC + R * Math.sin(ang));
          return `<div class="loop-node" id="${p}_i${j}" style="left:${x}px;top:${y}px;"><div class="ln-num">${j + 1}</div><div class="ln-t">${esc(st.title || st.text || "")}</div></div>`;
        })
        .join("");
      const center = s.center || s.text || "";
      inner =
        `${kicker}${heading}<div class="loop" id="${p}_lp"><div class="loop-ring"></div>` +
        (center ? `<div class="loop-center"><div class="lc-while">${esc(center)}</div></div>` : "") +
        nodes +
        `</div>`;
      break;
    }

    case "custom": {
      // HTML do AI/Claude sinh (sáng tạo tự do) - đã lọc an toàn + khung overflow:hidden chống tràn.
      inner = `${kicker}${heading}<div class="custombox" id="${p}_cx">${sanitizeCustomHtml(s.html || s.text || "")}</div>`;
      break;
    }

    case "cover": {
      // Mở đầu kiểu BÌA tạp chí: eyebrow + tiêu đề lớn (nhấn từ khoá **..**) + gạch accent + phụ đề + chip.
      const rawT = s.title || s.heading || "";
      const titleHtml = /\*\*[^*]+\*\*/.test(rawT)
        ? esc(rawT).replace(/\*\*([^*]+)\*\*/g, '<span class="cv-hl">$1</span>')
        : esc(rawT);
      const eyebrow = s.kicker
        ? `<div class="cv-eyebrow" id="${p}_k"><span class="cv-line"></span><span>${esc(s.kicker)}</span><span class="cv-line"></span></div>`
        : "";
      const chips = arr(s.chips).length
        ? `<div class="cv-chips">` +
          arr(s.chips)
            .slice(0, 4)
            .map((c, j) => `<span class="cv-chip" id="${p}_i${j}">${esc(c)}</span>`)
            .join("") +
          `</div>`
        : "";
      inner =
        `<div class="cover" id="${p}_cv">${eyebrow}` +
        `<h1 class="cv-title" id="${p}_h">${titleHtml}</h1>` +
        `<div class="cv-bar" id="${p}_bar"></div>` +
        (s.subtitle ? `<div class="cv-sub" id="${p}_sub">${esc(s.subtitle)}</div>` : "") +
        chips +
        `</div>`;
      break;
    }

    // ============ MODULE B - 12 LAYOUT MỚI (concept pack: app/brand/social) ============
    case "device": {
      // Khoe app/web qua KHUNG MÁY (iphone/ipad/browser) + screenshot/skeleton.
      const dev = s.device || {};
      const frame = (dev.frame || s.frame || "iphone").toLowerCase();
      const accent = dev.accent || s.accent || (s._brandLogo && s._brandLogo.color) || "";
      const localShot =
        dev._shotFile ||
        s.shotFile ||
        (typeof dev.shot === "string" && !/^https?:/.test(dev.shot) ? dev.shot : "") ||
        s.image ||
        "";
      const screen = localShot
        ? `<img class="dv-shot" id="${p}_shot" src="${esc(localShot)}" alt="" />`
        : `<div class="dv-skeleton"><div class="sk-bar"></div><div class="sk-line w70"></div><div class="sk-line w90"></div><div class="sk-card"></div><div class="sk-line w80"></div><div class="sk-line w55"></div></div>`;
      const idx = dev.sideIndex || s.sideIndex;
      const lab = dev.sideLabel || s.sideLabel;
      const side = idx
        ? `<div class="side-index"><span class="n">${esc(idx)}</span>${lab ? `<span>${esc(lab)}</span>` : ""}</div>`
        : "";
      const dvc =
        frame === "browser"
          ? `<div class="dvc browser" id="${p}_dv"><div class="dvb-chrome"><span class="dvb-dot r"></span><span class="dvb-dot y"></span><span class="dvb-dot g"></span><div class="dvb-url">${esc(dev.url || s.url || "app.local")}</div></div><div class="dv-screen">${screen}</div></div>`
          : `<div class="dvc ${frame === "ipad" ? "ipad" : "iphone"}" id="${p}_dv"><div class="dv-screen">${screen}</div></div>`;
      inner = `${kicker}${heading}<div class="device-wrap"${accent ? ` style="--accent:${esc(accent)}"` : ""}>${side}${dvc}</div>`;
      break;
    }

    case "social-card": {
      // Dựng lại profile/post MXH (x/linkedin/youtube).
      const soc = s.social || {};
      const plat = (soc.platform || "x").toLowerCase();
      const avatar = soc._avatarFile || (typeof soc.avatar === "string" && !/^https?:/.test(soc.avatar) ? soc.avatar : "");
      const banner = soc._bannerFile || (typeof soc.banner === "string" && !/^https?:/.test(soc.banner) ? soc.banner : "");
      const verified = soc.verified
        ? `<span class="sc-verified"><svg viewBox="0 0 24 24" fill="#fff"><path d="M9.6 16.2 5.4 12l-1.4 1.4L9.6 19 20 8.6 18.6 7.2z"/></svg></span>`
        : "";
      const av = avatar
        ? `<img class="sc-av" src="${esc(avatar)}" alt="" />`
        : `<div class="sc-av sc-av-mono">${esc((String(soc.name || "?").trim()[0] || "?").toUpperCase())}</div>`;
      const cta = soc.cta ? `<div class="sc-cta">${esc(soc.cta)}</div>` : "";
      inner =
        `${kicker}<div class="social-card plat-${esc(plat)}" id="${p}_sc">` +
        `<div class="sc-banner">${banner ? `<img src="${esc(banner)}" alt="" />` : ""}</div>` +
        av +
        `<div class="sc-body"><div class="sc-name">${esc(soc.name || "")}${verified}</div>` +
        `<div class="sc-handle">${esc(soc.handle || "")}</div>` +
        (soc.bio ? `<div class="sc-bio">${esc(soc.bio)}</div>` : "") +
        cta +
        `</div></div>`;
      break;
    }

    case "brand-stat": {
      // So sánh số liệu CÓ LOGO brand, số phát sáng theo màu thương hiệu.
      const items = arr(s.items).slice(0, 4);
      const hdr = s.title
        ? `<div class="bstat-hd">${s.headerIcon ? `<span class="bs-hicon">${esc(s.headerIcon)}</span>` : ""}<span>${esc(s.title)}</span></div>`
        : "";
      inner =
        `${kicker}${heading}${hdr}<div class="bstat n${items.length}">` +
        items
          .map((it, j) => {
            const accv = it.accent || (it._logo && it._logo.color) || "";
            const badge = logoBadge(it._logo, "bs-badge");
            const big = it.big != null ? it.big : it.value != null ? it.value : "";
            return `<div class="cell" id="${p}_i${j}"${accv ? ` style="--accent:${esc(accv)}"` : ""}>${badge}<div class="big">${esc(big)}${it.unit ? `<span class="unit">${esc(it.unit)}</span>` : ""}</div>${it.sub ? `<div class="pill">${esc(it.sub)}</div>` : ""}</div>`;
          })
          .join("") +
        `</div>`;
      break;
    }

    case "product-grid": {
      // 2-3 sản phẩm/model.
      const items = arr(s.items).slice(0, 3);
      inner =
        `${kicker}${heading}<div class="prod-grid n${items.length}">` +
        items
          .map((it, j) => {
            const img = it._img || (typeof it.img === "string" && !/^https?:/.test(it.img) ? it.img : "");
            const media = img ? `<div class="pg-media"><img src="${esc(img)}" alt="" /></div>` : `<div class="pg-media pg-sk"></div>`;
            const price = it.price
              ? `<div class="pg-price">${it.price.in ? `<span>${esc(it.price.in)}</span>` : ""}${it.price.out ? `<span class="pg-out">${esc(it.price.out)}</span>` : ""}</div>`
              : "";
            return `<div class="pg-card" id="${p}_i${j}">${media}<div class="pg-name">${esc(it.name || "")}</div>${it.desc ? `<div class="pg-desc">${esc(it.desc)}</div>` : ""}${price}</div>`;
          })
          .join("") +
        `</div>`;
      break;
    }

    case "app-hero": {
      // Mở màn 1 sản phẩm: icon squircle + tiêu đề gradient + pills.
      const icon = s._brandLogo
        ? logoBadge(s._brandLogo, "ah-badge")
        : s.icon
          ? `<div class="ah-squircle">${esc(s.icon)}</div>`
          : "";
      const pills = arr(s.pills)
        .map(
          (pl, j) =>
            `<div class="ah-pill ${esc(pl.tone || "")}" id="${p}_i${j}"><span>${esc(pl.l || "")}</span>${pl.arrow ? `<span class="ah-arrow">${esc(pl.arrow)}</span>` : ""}${pl.r ? `<span>${esc(pl.r)}</span>` : ""}</div>`,
        )
        .join("");
      inner = `${kicker}<div class="app-hero" id="${p}_ah">${icon}<h1 class="ah-title" id="${p}_h">${esc(s.title || s.heading || "")}</h1>${pills ? `<div class="ah-pills">${pills}</div>` : ""}</div>`;
      break;
    }

    case "myth-bust": {
      // Phá niềm tin sai: ✗ wrong (gạch ngang) -> right.
      const m = s.myth || {};
      const wrong = m.wrong || s.wrong || "";
      const right = m.right || s.right || "";
      const ic = m.icon || s.icon || "";
      inner = `${kicker}${heading}<div class="myth" id="${p}_my">${ic ? `<span class="my-ic">${esc(ic)}</span>` : ""}<span class="x">✗</span> <span class="wrong">${esc(wrong)}</span> <span class="arrow">→</span> <span class="right">${esc(right)}</span></div>`;
      break;
    }

    case "claim-card": {
      // Trích dẫn/chưa kiểm chứng.
      const unv = !!s.unverified;
      inner =
        `${kicker}<div class="claim-card ${unv ? "unverified" : ""}" id="${p}_cl">` +
        (s.tag ? `<div class="cl-tag">${esc(s.tag)}</div>` : "") +
        `<div class="cl-quote">${esc(s.claim || s.text || "")}</div>` +
        (s.source ? `<div class="cl-source">${esc(s.source)}</div>` : "") +
        (unv ? `<div class="cl-badge">⚠ Chưa kiểm chứng</div>` : "") +
        `</div>`;
      break;
    }

    case "roadmap-glow": {
      // Quy trình node đánh số phát sáng + connector chạy.
      const steps = (arr(s.steps).length ? arr(s.steps) : arr(s.items)).slice(0, 6);
      inner =
        `${kicker}${heading}<div class="rmg" id="${p}_rg">` +
        steps
          .map(
            (st, j) =>
              `<div class="rmg-node" id="${p}_i${j}"><div class="rmg-n">${esc(st.n != null ? st.n : j + 1)}</div><div class="rmg-ic">${esc(st.icon || "◆")}</div><div class="rmg-t">${esc(st.title || "")}</div>${st.sub ? `<div class="rmg-s">${esc(st.sub)}</div>` : ""}</div>`,
          )
          .join(`<div class="rmg-link"></div>`) +
        `</div>`;
      break;
    }

    case "segment-compare": {
      // So phân khúc khách: tên + ghi chú + thanh điểm 0-100.
      const items = arr(s.items).slice(0, 4);
      const sc = (v) => Math.max(0, Math.min(100, parseFloat(String(v ?? "").replace(/[^\d.]/g, "")) || 0));
      inner =
        `${kicker}${heading}<div class="segc" id="${p}_sg">` +
        items
          .map((it, j) => {
            const v = sc(it.score);
            const badge = it._logo ? logoBadge(it._logo, "sg-badge") : it.icon ? `<div class="sg-ic">${esc(it.icon)}</div>` : "";
            return `<div class="segc-row" id="${p}_i${j}">${badge}<div class="sg-main"><div class="sg-name">${esc(it.name || "")}</div>${it.note ? `<div class="sg-note">${esc(it.note)}</div>` : ""}<div class="sg-track"><div class="sg-fill" style="width:${v}%"></div></div></div><div class="sg-score">${esc(it.score != null ? it.score : v)}</div></div>`;
          })
          .join("") +
        (s.verdict ? `<div class="sg-verdict">${esc(s.verdict)}</div>` : "") +
        `</div>`;
      break;
    }

    case "flow-broken": {
      // Giả định gãy: A --✕--> B (mũi tên gạch chéo).
      const a = s.a || {},
        b = s.b || {};
      const broken = s.broken !== false;
      inner = `${kicker}${heading}<div class="flowbk ${broken ? "broken" : ""}" id="${p}_fb"><div class="fb-node" id="${p}_i0"><div class="fb-ic">${esc(a.icon || "■")}</div><div class="fb-l">${esc(a.label || "")}</div></div><div class="fb-arrow"><span class="fb-line"></span>${broken ? `<span class="fb-slash">✕</span>` : ""}</div><div class="fb-node" id="${p}_i1"><div class="fb-ic">${esc(b.icon || "■")}</div><div class="fb-l">${esc(b.label || "")}</div></div></div>`;
      break;
    }

    case "icon-row": {
      // Tóm tắt 3-4 ý (có thể kèm logo brand).
      const items = arr(s.items).slice(0, 4);
      inner =
        `${kicker}${heading}<div class="icon-row n${items.length}">` +
        items
          .map((it, j) => {
            const badge = it._logo ? logoBadge(it._logo, "ir-badge") : `<div class="ir-ic">${esc(it.icon || "◆")}</div>`;
            return `<div class="ir-cell" id="${p}_i${j}">${badge}<div class="ir-l">${esc(it.label || it.title || "")}</div></div>`;
          })
          .join("") +
        `</div>`;
      break;
    }

    case "pricing-row": {
      // Bảng giá in/out.
      const cols = arr(s.cols);
      const rows = arr(s.rows).slice(0, 6);
      const head = cols.length
        ? `<div class="pr-row pr-head"><div class="pr-name"></div>${cols.map((c) => `<div class="pr-cell">${esc(c)}</div>`).join("")}</div>`
        : "";
      inner =
        `${kicker}${heading}<div class="pricing" id="${p}_pr">${head}` +
        rows
          .map(
            (r, j) =>
              `<div class="pr-row" id="${p}_i${j}"><div class="pr-name">${esc(r.name || "")}</div>${arr(r.vals).map((v) => `<div class="pr-cell">${esc(v)}</div>`).join("")}</div>`,
          )
          .join("") +
        `</div>`;
      break;
    }

    default: // fallback = statement
      inner = `${kicker}${heading}${s.body ? `<div class="point-body" id="${p}_b">${esc(s.body)}</div>` : ""}`;
  }

  // MODULE C1 - Section-chip: nhãn "tên chương" hiện góc trên (khi scene có "chapter").
  const chip = s.chapter
    ? `<div class="section-chip" id="${p}_chip"><span class="sc-dot"></span>${esc(s.chapter)}</div>`
    : "";
  // MODULE C2 - Brand glow: lấy --accent của scene từ brand-color (nếu có) -> quầng sáng đồng bộ.
  const sAccent = s.accent || (s._brandLogo && s._brandLogo.color) || (s._logos && s._logos[0] && s._logos[0].color) || "";
  const styleAttr = sAccent ? ` style="--accent:${esc(sAccent)}"` : "";

  return `      <section class="scene acc-${acc} layout-${esc(s.layout || "point")}" id="scene-${i}"${styleAttr}>\n        ${chip}${inner}\n      </section>`;
}

// Profile tiết tấu (pacing) entrance theo design - đổi ease/độ dài/giãn cách của
// kicker + heading + các phần tử stagger -> cảm giác chuyển động khác nhau rõ rệt.
// Các profile tiết tấu (đặt tên), được chọn ngẫu nhiên qua randomFormat().entrance.
const ENTRANCE_PROFILE = {
  snappy: { headEase: "back.out(2.2)", headDur: 0.4, kEase: "back.out(2)", stEase: "back.out(2.4)", stDur: 0.4, stepMul: 0.65 },
  dreamy: { headEase: "expo.out", headDur: 0.7, kEase: "power2.out", stEase: "power2.out", stDur: 0.6, stepMul: 1.25 },
  bouncy: { headEase: "back.out(1.7)", headDur: 0.55, kEase: "back.out(1.6)", stEase: "back.out(1.9)", stDur: 0.5, stepMul: 0.9 },
  gentle: { headEase: "power2.out", headDur: 0.85, kEase: "power1.out", stEase: "power2.out", stDur: 0.75, stepMul: 1.6 },
  smooth: { headEase: "power3.out", headDur: 0.65, kEase: "power2.out", stEase: "power3.out", stDur: 0.6, stepMul: 1.15 },
  techno: { headEase: "power4.out", headDur: 0.5, kEase: "power3.out", stEase: "power3.out", stDur: 0.45, stepMul: 0.9 },
  precise: { headEase: "power3.inOut", headDur: 0.5, kEase: "power3.out", stEase: "power3.out", stDur: 0.45, stepMul: 1 },
  soft: { headEase: "power2.out", headDur: 0.65, kEase: "power2.out", stEase: "power2.out", stDur: 0.6, stepMul: 1.1 },
  mechanical: { headEase: "steps(8)", headDur: 0.55, kEase: "steps(6)", stEase: "power1.out", stDur: 0.45, stepMul: 1 },
};
const DEFAULT_ENTRANCE = { headEase: "expo.out", headDur: 0.55, kEase: "power2.out", stEase: "back.out(1.4)", stDur: 0.5, stepMul: 1 };

// ---------- Entrance animations cho từng layout ----------
function sceneEntrances(s, i, start, prof, dur) {
  const P = prof || DEFAULT_ENTRANCE;
  const p = `s${i}`;
  const t = (x) => (start + x).toFixed(3);
  const HOLD = Math.max(2.5, Number(dur) || 6); // thời lượng cảnh (cho Ken Burns)
  const L = [];
  const headIn = () => {
    if (s.kicker)
      L.push(
        `tl.from("#${p}_k", { y: -22, opacity: 0, duration: 0.5, ease: "${P.kEase}" }, ${t(0.05)});`,
      );
    if (s.heading && s.layout !== "title")
      L.push(
        `tl.from("#scene-${i} .heading", { y: 38, opacity: 0, duration: ${P.headDur}, ease: "${P.headEase}" }, ${t(0.25)});`,
      );
  };
  const stagger = (sel, from, base = 0.5, step = 0.12) =>
    L.push(
      `tl.from("${sel}", { ${from}, duration: ${P.stDur}, ease: "${P.stEase}", stagger: ${(step * P.stepMul).toFixed(3)} }, ${t(base)});`,
    );

  switch (s.layout) {
    case "title":
      L.push(
        `tl.from("#${p}_badge", { scale: 0, rotation: -18, opacity: 0, duration: 0.7, ease: "back.out(1.7)" }, ${t(0.1)});`,
      );
      L.push(
        `tl.from("#${p}_h", { y: 70, opacity: 0, duration: 0.8, ease: "expo.out" }, ${t(0.55)});`,
      );
      if (s.subtitle)
        L.push(
          `tl.from("#${p}_sub", { y: 28, opacity: 0, duration: 0.6, ease: "power3.out" }, ${t(1.05)});`,
        );
      break;
    case "statement":
      if (s.kicker)
        L.push(
          `tl.from("#${p}_k", { y: -22, opacity: 0, duration: 0.5, ease: "power2.out" }, ${t(0.05)});`,
        );
      L.push(
        `tl.from("#${p}_st .bar", { scaleY: 0, opacity: 0, duration: 0.5, ease: "power3.out", transformOrigin: "top center" }, ${t(0.2)});`,
      );
      L.push(
        `tl.from("#${p}_st .statement-text", { y: 30, opacity: 0, duration: 0.7, ease: "power3.out" }, ${t(0.4)});`,
      );
      break;
    case "bullets":
      headIn();
      stagger(`#scene-${i} .bitem`, "x: -40, opacity: 0", 0.7, 0.13);
      break;
    case "cards":
      headIn();
      stagger(`#scene-${i} .vcard`, "y: 55, opacity: 0", 0.7, 0.15);
      break;
    case "formula":
      headIn();
      stagger(`#scene-${i} .formula > *`, "scale: 0.5, opacity: 0", 0.7, 0.12);
      break;
    case "flow":
      headIn();
      stagger(`#scene-${i} .fbox`, "y: 45, opacity: 0", 0.7, 0.18);
      L.push(
        `tl.from("#scene-${i} .arrow", { opacity: 0, scale: 0, duration: 0.3, ease: "power2.out", stagger: 0.18 }, ${t(0.95)});`,
      );
      break;
    case "compare":
      headIn();
      L.push(
        `tl.from("#${p}_L", { x: -50, opacity: 0, duration: 0.6, ease: "power3.out" }, ${t(0.7)});`,
      );
      L.push(
        `tl.from("#${p}_R", { x: 50, opacity: 0, duration: 0.6, ease: "power3.out" }, ${t(0.9)});`,
      );
      L.push(
        `tl.from("#${p}_vs", { scale: 0, opacity: 0, duration: 0.5, ease: "back.out(2)" }, ${t(1.2)});`,
      );
      break;
    case "stat":
      headIn();
      stagger(`#scene-${i} .stat`, "scale: 0.6, opacity: 0", 0.7, 0.16);
      break;
    case "steps":
      headIn();
      stagger(`#scene-${i} .step`, "x: -45, opacity: 0", 0.7, 0.14);
      break;
    case "outro":
      if (s.kicker)
        L.push(
          `tl.from("#${p}_k", { y: -22, opacity: 0, duration: 0.5, ease: "power2.out" }, ${t(0.05)});`,
        );
      L.push(
        `tl.from("#${p}_h", { scale: 0.82, opacity: 0, duration: 0.7, ease: "back.out(1.6)" }, ${t(0.3)});`,
      );
      if (arr(s.chips).length) stagger(`#scene-${i} .chip`, "y: 30, opacity: 0", 0.9, 0.12);
      if (s.subtitle)
        L.push(
          `tl.from("#${p}_sub", { y: 20, opacity: 0, duration: 0.6, ease: "power2.out" }, ${t(1.3)});`,
        );
      break;
    case "section":
      if (s.kicker)
        L.push(
          `tl.from("#${p}_k", { y: -22, opacity: 0, duration: 0.5, ease: "power2.out" }, ${t(0.05)});`,
        );
      L.push(
        `tl.from("#scene-${i} .secnum", { scale: 0, opacity: 0, duration: 0.6, ease: "back.out(2)", transformOrigin: "left center" }, ${t(0.1)});`,
      );
      L.push(
        `tl.from("#${p}_h", { y: 60, opacity: 0, duration: 0.85, ease: "expo.out" }, ${t(0.3)});`,
      );
      if (s.subtitle)
        L.push(
          `tl.from("#${p}_sub", { y: 26, opacity: 0, duration: 0.6, ease: "power3.out" }, ${t(0.85)});`,
        );
      break;
    case "quote":
      L.push(
        `tl.from("#${p}_qc", { scale: 0.9, y: 40, opacity: 0, duration: 0.7, ease: "power3.out" }, ${t(0.15)});`,
      );
      L.push(
        `tl.from("#scene-${i} .quote-badge", { y: -16, opacity: 0, duration: 0.5, ease: "power2.out" }, ${t(0.45)});`,
      );
      L.push(
        `tl.from("#scene-${i} .qmark-top", { scale: 0, opacity: 0, duration: 0.5, ease: "back.out(2)" }, ${t(0.55)});`,
      );
      L.push(
        `tl.from("#${p}_qt", { y: 26, opacity: 0, duration: 0.7, ease: "power3.out" }, ${t(0.6)});`,
      );
      if (s.subtitle)
        L.push(
          `tl.from("#${p}_qby", { opacity: 0, duration: 0.5, ease: "power2.out" }, ${t(1.1)});`,
        );
      break;
    case "prompt":
      if (s.heading)
        L.push(
          `tl.from("#scene-${i} .heading", { y: 34, opacity: 0, duration: 0.55, ease: "expo.out" }, ${t(0.1)});`,
        );
      L.push(
        `tl.from("#${p}_pb", { scale: 0.92, y: 36, opacity: 0, duration: 0.7, ease: "power3.out" }, ${t(0.35)});`,
      );
      L.push(
        `tl.from("#scene-${i} .pb-bar > *", { y: -10, opacity: 0, duration: 0.4, ease: "power2.out", stagger: 0.06 }, ${t(0.6)});`,
      );
      L.push(`tl.from("#${p}_pt", { opacity: 0, duration: 0.6, ease: "power2.out" }, ${t(0.75)});`);
      if (s.subtitle)
        L.push(
          `tl.from("#${p}_sub", { y: 16, opacity: 0, duration: 0.5, ease: "power2.out" }, ${t(1.2)});`,
        );
      break;
    case "popup":
      headIn();
      L.push(
        `tl.from("#scene-${i} .popup-card", { y: 50, scale: 0.85, opacity: 0, duration: 0.55, ease: "back.out(1.7)", stagger: 0.22 }, ${t(0.7)});`,
      );
      break;
    case "photo":
      if (s.image)
        L.push(
          `tl.fromTo("#${p}_img", { scale: 1.06, xPercent: -1.5, yPercent: -1 }, { scale: 1.2, xPercent: 1.5, yPercent: 1, duration: ${HOLD.toFixed(2)}, ease: "none" }, ${t(0)});`,
        );
      L.push(
        `tl.from("#${p}_pc", { y: 50, opacity: 0, duration: 0.7, ease: "power3.out" }, ${t(0.35)});`,
      );
      break;
    case "split":
      headIn();
      if (s.image)
        L.push(
          `tl.from("#${p}_img", { scale: 1.12, opacity: 0, duration: 0.9, ease: "power2.out" }, ${t(0.15)});`,
        );
      L.push(
        `tl.from("#${p}_tx > *", { x: 36, opacity: 0, duration: 0.55, ease: "power3.out", stagger: 0.12 }, ${t(0.45)});`,
      );
      break;
    case "gallery":
      headIn();
      stagger(`#scene-${i} .gphoto`, "scale: 0.8, opacity: 0", 0.7, 0.14);
      break;
    case "bars":
      headIn();
      L.push(
        `tl.from("#scene-${i} .bar-fill", { scaleX: 0, transformOrigin: "left center", duration: 0.7, ease: "power3.out", stagger: 0.14 }, ${t(0.7)});`,
      );
      L.push(
        `tl.from("#scene-${i} .bar-label", { x: -24, opacity: 0, duration: 0.5, ease: "power2.out", stagger: 0.14 }, ${t(0.7)});`,
      );
      break;
    case "timeline":
      headIn();
      L.push(
        `tl.from("#scene-${i} .tl-item", { x: -40, opacity: 0, duration: 0.55, ease: "power3.out", stagger: 0.16 }, ${t(0.7)});`,
      );
      L.push(
        `tl.from("#scene-${i} .tl-dot", { scale: 0, duration: 0.4, ease: "back.out(2)", stagger: 0.16 }, ${t(0.85)});`,
      );
      break;
    case "bignum":
      if (s.kicker)
        L.push(`tl.from("#${p}_k", { y: -22, opacity: 0, duration: 0.5, ease: "${P.kEase}" }, ${t(0.05)});`);
      L.push(
        `tl.from("#${p}_bn .bignum-val", { scale: 0.55, opacity: 0, duration: 0.8, ease: "back.out(1.7)" }, ${t(0.2)});`,
      );
      L.push(`tl.from("#${p}_bn .bignum-cap", { y: 26, opacity: 0, duration: 0.6, ease: "power3.out" }, ${t(0.7)});`);
      L.push(`tl.from("#${p}_bn .bignum-sub", { y: 18, opacity: 0, duration: 0.5, ease: "power2.out" }, ${t(0.95)});`);
      break;
    case "checklist":
      headIn();
      stagger(`#scene-${i} .check-item`, "x: -40, opacity: 0", 0.7, 0.13);
      L.push(
        `tl.from("#scene-${i} .check-ic", { scale: 0, duration: 0.4, ease: "back.out(2)", stagger: ${(0.13 * P.stepMul).toFixed(3)} }, ${t(0.85)});`,
      );
      break;
    case "icongrid":
      headIn();
      stagger(`#scene-${i} .ig-cell`, "y: 40, scale: 0.85, opacity: 0", 0.7, 0.12);
      break;
    case "pros":
      headIn();
      L.push(`tl.from("#scene-${i} .pros-col.pro", { x: -44, opacity: 0, duration: 0.6, ease: "power3.out" }, ${t(0.7)});`);
      L.push(`tl.from("#scene-${i} .pros-col.con", { x: 44, opacity: 0, duration: 0.6, ease: "power3.out" }, ${t(0.85)});`);
      break;
    case "gauge":
      headIn();
      stagger(`#scene-${i} .gauge`, "scale: 0.6, opacity: 0", 0.7, 0.16);
      break;
    case "definition":
      if (s.kicker)
        L.push(`tl.from("#${p}_k", { y: -22, opacity: 0, duration: 0.5, ease: "${P.kEase}" }, ${t(0.05)});`);
      L.push(`tl.from("#${p}_df .defn-term", { y: 40, opacity: 0, duration: 0.75, ease: "expo.out" }, ${t(0.2)});`);
      L.push(
        `tl.from("#${p}_df .defn-line", { scaleX: 0, opacity: 0, duration: 0.5, ease: "power3.out", transformOrigin: "center center" }, ${t(0.65)});`,
      );
      L.push(`tl.from("#${p}_df .defn-body", { y: 24, opacity: 0, duration: 0.6, ease: "power2.out" }, ${t(0.85)});`);
      break;
    case "roadmap":
      headIn();
      stagger(`#scene-${i} .rm-item`, "y: 40, opacity: 0", 0.7, 0.15);
      L.push(
        `tl.from("#scene-${i} .rm-dot", { scale: 0, duration: 0.4, ease: "back.out(2)", stagger: ${(0.15 * P.stepMul).toFixed(3)} }, ${t(0.85)});`,
      );
      break;
    case "kpi":
      headIn();
      stagger(`#scene-${i} .kpi-card`, "y: 45, opacity: 0", 0.7, 0.14);
      break;
    case "code":
      if (s.heading)
        L.push(`tl.from("#scene-${i} .heading", { y: 30, opacity: 0, duration: 0.5, ease: "expo.out" }, ${t(0.1)});`);
      L.push(`tl.from("#${p}_cb", { scale: 0.94, y: 32, opacity: 0, duration: 0.7, ease: "power3.out" }, ${t(0.3)});`);
      L.push(`tl.from("#scene-${i} .cb-bar > *", { y: -10, opacity: 0, duration: 0.4, ease: "power2.out", stagger: 0.06 }, ${t(0.55)});`);
      L.push(`tl.from("#${p}_cb .cb-body", { opacity: 0, duration: 0.6, ease: "power2.out" }, ${t(0.7)});`);
      break;
    case "browser":
      headIn();
      L.push(`tl.from("#${p}_bw", { y: 44, scale: 0.95, opacity: 0, duration: 0.7, ease: "power3.out" }, ${t(0.3)});`);
      L.push(`tl.from("#${p}_bw .bw-title", { y: 20, opacity: 0, duration: 0.5, ease: "power2.out" }, ${t(0.6)});`);
      L.push(`tl.from("#${p}_bw .bw-text", { y: 16, opacity: 0, duration: 0.5, ease: "power2.out" }, ${t(0.78)});`);
      L.push(`tl.from("#${p}_bw .bw-tag", { scale: 0, opacity: 0, duration: 0.5, ease: "back.out(2)" }, ${t(0.95)});`);
      break;
    case "loop":
      headIn();
      L.push(`tl.from("#${p}_lp .loop-ring", { scale: 0.6, opacity: 0, duration: 0.7, ease: "power3.out", transformOrigin: "center center" }, ${t(0.5)});`);
      L.push(`tl.from("#scene-${i} .loop-node", { scale: 0, opacity: 0, duration: 0.5, ease: "back.out(1.7)", stagger: 0.12 }, ${t(0.7)});`);
      L.push(`tl.from("#scene-${i} .loop-center", { opacity: 0, scale: 0.7, duration: 0.5, ease: "power2.out" }, ${t(1.1)});`);
      break;
    case "custom":
      headIn();
      L.push(`tl.from("#${p}_cx", { y: 36, opacity: 0, duration: 0.7, ease: "power3.out" }, ${t(0.4)});`);
      break;
    case "cover":
      if (s.kicker)
        L.push(`tl.from("#${p}_k", { y: -20, opacity: 0, duration: 0.6, ease: "power2.out" }, ${t(0.1)});`);
      L.push(`tl.from("#${p}_h", { y: 60, opacity: 0, duration: 0.85, ease: "expo.out" }, ${t(0.35)});`);
      L.push(`tl.from("#${p}_bar", { scaleX: 0, opacity: 0, duration: 0.6, ease: "power3.out", transformOrigin: "center center" }, ${t(0.85)});`);
      if (s.subtitle)
        L.push(`tl.from("#${p}_sub", { y: 24, opacity: 0, duration: 0.6, ease: "power3.out" }, ${t(1.05)});`);
      if (arr(s.chips).length) stagger(`#scene-${i} .cv-chip`, "y: 20, opacity: 0", 1.25, 0.1);
      break;
    // ============ MODULE B/C - entrance cho 12 layout mới ============
    case "device":
      headIn();
      L.push(`tl.from("#${p}_dv", { y: 60, scale: 0.92, opacity: 0, duration: 0.8, ease: "power3.out" }, ${t(0.3)});`);
      L.push(`tl.from("#scene-${i} .side-index", { x: -16, opacity: 0, duration: 0.6, ease: "power2.out" }, ${t(0.7)});`);
      break;
    case "social-card":
      headIn();
      L.push(`tl.from("#${p}_sc", { y: 50, scale: 0.94, opacity: 0, duration: 0.75, ease: "power3.out" }, ${t(0.3)});`);
      L.push(`tl.from("#${p}_sc .sc-av", { scale: 0, opacity: 0, duration: 0.55, ease: "back.out(1.7)" }, ${t(0.7)});`);
      break;
    case "brand-stat":
      headIn();
      stagger(`#scene-${i} .bstat .cell`, "y: 44, opacity: 0", 0.7, 0.15);
      L.push(`tl.from("#scene-${i} .bstat .big", { scale: 0.7, opacity: 0, duration: 0.6, ease: "back.out(1.6)", stagger: 0.15 }, ${t(0.9)});`);
      break;
    case "product-grid":
      headIn();
      stagger(`#scene-${i} .pg-card`, "y: 50, opacity: 0", 0.7, 0.15);
      break;
    case "app-hero":
      L.push(`tl.from("#${p}_ah .ah-badge, #${p}_ah .ah-squircle", { scale: 0, rotation: -12, opacity: 0, duration: 0.7, ease: "back.out(1.7)" }, ${t(0.1)});`);
      L.push(`tl.from("#${p}_h", { y: 44, opacity: 0, duration: 0.7, ease: "expo.out" }, ${t(0.5)});`);
      stagger(`#scene-${i} .ah-pill`, "y: 24, opacity: 0", 0.95, 0.12);
      break;
    case "myth-bust":
      headIn();
      L.push(`tl.from("#${p}_my .wrong", { opacity: 0, duration: 0.5, ease: "power1.out" }, ${t(0.5)});`);
      L.push(`tl.from("#${p}_my .x", { scale: 0, opacity: 0, duration: 0.4, ease: "back.out(2)" }, ${t(0.7)});`);
      L.push(`tl.from("#${p}_my .arrow", { x: -18, opacity: 0, duration: 0.4, ease: "power2.out" }, ${t(0.95)});`);
      L.push(`tl.from("#${p}_my .right", { x: 18, opacity: 0, duration: 0.5, ease: "back.out(1.6)" }, ${t(1.1)});`);
      break;
    case "claim-card":
      if (s.kicker)
        L.push(`tl.from("#${p}_k", { y: -22, opacity: 0, duration: 0.5, ease: "power2.out" }, ${t(0.05)});`);
      L.push(`tl.from("#${p}_cl", { y: 40, scale: 0.95, opacity: 0, duration: 0.7, ease: "power3.out" }, ${t(0.2)});`);
      break;
    case "roadmap-glow":
      headIn();
      L.push(`tl.from("#scene-${i} .rmg-node", { y: 40, scale: 0.82, opacity: 0, duration: 0.5, ease: "back.out(1.6)", stagger: 0.16 }, ${t(0.6)});`);
      L.push(`tl.from("#scene-${i} .rmg-link", { scaleX: 0, opacity: 0, duration: 0.4, ease: "power2.out", stagger: 0.16, transformOrigin: "left center" }, ${t(0.8)});`);
      break;
    case "segment-compare":
      headIn();
      stagger(`#scene-${i} .segc-row`, "x: -40, opacity: 0", 0.7, 0.14);
      L.push(`tl.from("#scene-${i} .sg-fill", { scaleX: 0, duration: 0.7, ease: "power3.out", stagger: 0.14, transformOrigin: "left center" }, ${t(0.95)});`);
      if (s.verdict)
        L.push(`tl.from("#scene-${i} .sg-verdict", { y: 18, opacity: 0, duration: 0.5, ease: "power2.out" }, ${t(1.3)});`);
      break;
    case "flow-broken":
      headIn();
      L.push(`tl.from("#${p}_i0", { x: -40, opacity: 0, duration: 0.6, ease: "power3.out" }, ${t(0.5)});`);
      L.push(`tl.from("#${p}_i1", { x: 40, opacity: 0, duration: 0.6, ease: "power3.out" }, ${t(0.7)});`);
      L.push(`tl.from("#${p}_fb .fb-slash", { scale: 0, rotate: -40, opacity: 0, duration: 0.5, ease: "back.out(2)" }, ${t(1.0)});`);
      break;
    case "icon-row":
      headIn();
      stagger(`#scene-${i} .ir-cell`, "y: 36, opacity: 0", 0.7, 0.12);
      break;
    case "pricing-row":
      headIn();
      stagger(`#scene-${i} .pricing .pr-row`, "y: 22, opacity: 0", 0.6, 0.1);
      break;

    default:
      headIn();
      if (s.body)
        L.push(
          `tl.from("#${p}_b", { y: 30, opacity: 0, duration: 0.6, ease: "power2.out" }, ${t(0.7)});`,
        );
  }
  return L;
}

// Phụ đề karaoke dưới cùng: hiển thị "caption" của từng cảnh, nhấn 1 cụm bằng **..**.
// Tween hiện phụ đề theo CAPTION FORMAT của design (mỗi mẫu một kiểu chữ chạy). id = selector đầy đủ.
function captionInTween(fmt, id, at) {
  switch (fmt) {
    case "slam": // đập vào (scale lớn -> 1), kiểu kinetic
      return `tl.fromTo("${id}", { opacity: 0, scale: 1.6 }, { opacity: 1, scale: 1, duration: 0.42, ease: "back.out(2)" }, ${at});`;
    case "pill": // nảy nhẹ trong viên nang
      return `tl.fromTo("${id}", { opacity: 0, y: 18, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "back.out(1.6)" }, ${at});`;
    case "weight": // hiện rồi chuyển từ mảnh -> đậm
      return `tl.fromTo("${id}", { opacity: 0, fontWeight: 300 }, { opacity: 1, fontWeight: 800, duration: 0.6, ease: "power2.out" }, ${at});`;
    case "typewriter": // gõ máy (clip trái -> phải theo bước)
      return `tl.fromTo("${id}", { clipPath: "inset(0 100% 0 0)", webkitClipPath: "inset(0 100% 0 0)", opacity: 1 }, { clipPath: "inset(0 0% 0 0)", webkitClipPath: "inset(0 0% 0 0)", duration: 0.75, ease: "steps(16)" }, ${at});`;
    case "neon": // hiện mềm (glow bằng CSS .cap-fmt-neon)
    case "glitch": // hiện nhanh (RGB jitter bằng CSS animation)
      return `tl.fromTo("${id}", { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, ${at});`;
    default: // trượt lên mượt
      return `tl.fromTo("${id}", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, ${at});`;
  }
}

// Tách narration thành các DÒNG PHỤ ĐỀ dễ đọc bằng cách GÓI TỪ (greedy): mỗi dòng đầy tới ~70
// ký tự, ưu tiên xuống dòng sau dấu kết câu khi dòng đã đủ dài. Ghép lại = đúng narration
// -> sub khớp TỪNG CHỮ với giọng đọc, không có dòng vụn, không vượt giới hạn.
const SUB_MAX = 70;
function splitSub(text) {
  const t = clean(text);
  if (!t) return [];
  const out = [];
  let cur = "";
  for (const w of t.split(/\s+/)) {
    const cand = cur ? cur + " " + w : w;
    if (cand.length > SUB_MAX && cur) {
      out.push(cur);
      cur = w;
    } else {
      cur = cand;
    }
    // kết câu + dòng đã kha khá -> chốt dòng (tránh dính câu sau)
    if (/[.!?…:]$/.test(w) && cur.length >= SUB_MAX * 0.45) {
      out.push(cur);
      cur = "";
    }
  }
  if (cur) out.push(cur);
  return out;
}

// BURN SUB CHUẨN XÁC: phụ đề = đúng narration (text đưa vào TTS), tách dòng, đồng bộ trong
// cửa sổ audio CỦA TỪNG CẢNH [starts[i], starts[i+1]] (slide mode = đo thật; HeyGen = theo tỉ lệ chữ).
// Mỗi dòng chia thời lượng theo độ dài ký tự -> bám sát nhịp đọc. Fallback "caption" nếu cảnh không có narration.
function buildSubtitles(scenes, starts, total, captionFmt = "default") {
  const html = [];
  const tweens = [];
  let gi = 0;
  scenes.forEach((s, i) => {
    const hasNarr = !!clean(s.narration);
    const chunks = hasNarr ? splitSub(s.narration) : clean(s.caption) ? [clean(s.caption)] : [];
    if (!chunks.length) return;
    const winStart = starts[i] + 0.1;
    const winEnd = (i + 1 < scenes.length ? starts[i + 1] : total) - 0.12;
    const dur = Math.max(0.6, winEnd - winStart);
    const totalChars = chunks.reduce((a, c) => a + Math.max(6, c.length), 0);
    let acc = 0;
    for (const c of chunks) {
      const cStart = winStart + (dur * acc) / totalChars;
      acc += Math.max(6, c.length);
      const cEnd = winStart + (dur * acc) / totalChars;
      const id = `cap-${gi++}`;
      // narration -> hiển thị NGUYÊN VĂN (khớp lời đọc); caption fallback -> cho phép **nhấn**.
      const inner = !hasNarr && /\*\*[^*]+\*\*/.test(c) ? captionHtml(c) : esc(c);
      html.push(`<div class="cap cap-fmt-${captionFmt}" id="${id}">${inner}</div>`);
      tweens.push(captionInTween(captionFmt, `#${id}`, cStart.toFixed(3)));
      tweens.push(
        `tl.to("#${id}", { opacity: 0, y: -10, duration: 0.3, ease: "power2.in" }, ${cEnd.toFixed(3)});`,
      );
    }
  });
  return { html: html.join("\n"), tweens };
}

// "abc **def** ghi" -> nhấn cụm trong ** ** bằng màu đỏ. Nếu không có ** **, nhấn từ đầu.
function captionHtml(cap) {
  if (/\*\*[^*]+\*\*/.test(cap)) {
    return esc(cap).replace(/\*\*([^*]+)\*\*/g, '<span class="cap-hl">$1</span>');
  }
  const m = cap.match(/^(\S+)([\s\S]*)$/);
  if (m) return `<span class="cap-hl">${esc(m[1])}</span>${esc(m[2])}`;
  return esc(cap);
}

export function buildComposition({
  id,
  scenes,
  starts,
  total,
  aspectRatio = "16:9",
  captureWidth,
  captureHeight,
  theme = DEFAULT_THEME_ID,
  format,
  font, // id font người dùng chọn (override font của mẫu). "auto"/rỗng = giữ theo mẫu.
  textScale = 1, // hệ số phóng to TOÀN BỘ chữ (mọi font-size nhân với hệ số này qua var(--ts)).
  renderScale = 1, // bội số render: 1 = 1080p, 4/3 ≈ 2K (2560x1440), 2 = 4K. Thiết kế giữ 1920, scale stage.
}) {
  const TS = Math.max(0.5, Number(textScale) || 1); // chặn dưới để khỏi mất chữ
  const TOTAL = Number(total.toFixed(3));
  const dStyle = themeStyle(theme);
  // Format LINH HOẠT: nếu pipeline truyền sẵn thì dùng, không thì random ngay tại đây.
  const fmt = format || randomFormat();
  const sectionsHtml = scenes.map((s, i) => sceneHtml(s, i)).join("\n");
  const caps = buildSubtitles(scenes, starts, TOTAL, fmt.caption);

  const tweens = [];
  tweens.push(
    `tl.to("#bg-glow", { opacity: 0.5, scale: 1.12, duration: 2, ease: "sine.inOut", yoyo: true, repeat: Math.max(0, Math.floor(${TOTAL} / 4) - 1), transformOrigin: "center center" }, 0);`,
  );
  tweens.push(`tl.set("#scene-0", { opacity: 1 }, 0);`);

  scenes.forEach((s, i) => {
    if (i > 0) {
      const tt = Math.max(0, starts[i] - 0.35).toFixed(3);
      tweens.push(`transition(${tt}, "#scene-${i - 1}", "#scene-${i}");`);
    }
    const dur = (i + 1 < scenes.length ? starts[i + 1] : TOTAL) - starts[i];
    tweens.push(...sceneEntrances(s, i, starts[i], ENTRANCE_PROFILE[fmt.entrance] || DEFAULT_ENTRANCE, dur));
  });

  const lastIdx = scenes.length - 1;
  const fadeAt = Math.max(0, TOTAL - 1.0).toFixed(3);
  tweens.push(
    `tl.to("#scene-${lastIdx}", { opacity: 0, duration: 0.9, ease: "power2.in" }, ${fadeAt});`,
  );
  // Phụ đề karaoke dưới cùng (lớp riêng, không bị ảnh hưởng bởi opacity của scene).
  tweens.push(...caps.tweens);

  const isPortrait = aspectRatio === "9:16";
  // Kích thước "canvas thiết kế" (mọi px trong CSS được tinh chỉnh theo cỡ này).
  const width = isPortrait ? 1080 : 1920;
  const height = isPortrait ? 1920 : 1080;
  // Kích thước khung CHỤP thật. Mặc định = canvas thiết kế (không đổi gì so với trước).
  // Khi ghép HeyGen, Hyperframe chỉ chiếm một nửa khung -> truyền captureWidth/Height của nửa đó,
  // canvas thiết kế được thu nhỏ kiểu "contain" (giữ trọn nội dung, viền tối hoà với nền).
  // Khung CHỤP thật. Mặc định = thiết kế × scale (nâng độ phân giải mà KHÔNG đổi layout:
  // mọi px CSS giữ theo thiết kế 1920, #stage được scale để lấp đầy khung lớn hơn -> nét).
  const capW = Math.round(captureWidth || width * renderScale);
  const capH = Math.round(captureHeight || height * renderScale);
  const scale = Math.min(capW / width, capH / height);
  const glowLeft = isPortrait ? "-10px" : "410px";
  const glowTop = isPortrait ? "410px" : "-120px";
  const bgSize = isPortrait ? "600px 900px" : "900px 600px";

  // Design style (phong cách sáng tạo) - class + CSS riêng + font (nếu cần).
  const designStyle = dStyle;
  // Font người dùng chọn (override). "auto"/rỗng -> userFont rỗng -> giữ font theo mẫu.
  const userFont = font && font !== "auto" ? fontById(font) : null;
  const fontOverrideCss = userFont && userFont.family ? `--font:${userFont.family};` : "";
  // Nạp CẢ link font của mẫu (cho element mang chữ ký riêng) lẫn link font người chọn.
  const fontLinks = [themeFontLink(theme), userFont ? userFont.link : ""].filter(Boolean);
  const fontLinkTag = fontLinks.length
    ? `<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />` +
      fontLinks.map((l) => `<link rel="stylesheet" href="${esc(l)}" />`).join("")
    : "";
  const stageClasses = `${isPortrait ? "portrait " : ""}${designStyle ? "design-" + designStyle : ""}`.trim();

  const __html = `<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <title>${esc(id)}</title>
    ${fontLinkTag}
    <style>
      :root {
        /* Giá trị mặc định (theme Midnight) - bị theme đang chọn ghi đè ngay bên dưới. */
        --bg:#03070f; --panel:#0d1b2a; --panel2:#122236; --line:#2a3f5a; --muted:#aebfd2;
        --text:#eef3f9; --amber:#ffc300; --teal:#2ec4b6; --violet:#9b8cff; --red:#ff5a6a;
        --font:"Inter","Segoe UI",system-ui,sans-serif;
        --stage-a:rgba(20,60,110,0.35); --grid:rgba(255,255,255,0.06); --glow:rgba(46,196,182,0.16);
        --bok1:rgba(46,196,182,0.25); --bok2:rgba(255,195,0,0.18); --bok3:rgba(155,140,255,0.18);
        --cap-hl:var(--red);
        --strong-fg:#fff; --cap-fg:#fff; --cap-shadow:0 4px 24px rgba(0,0,0,0.8);
        --title-fill:linear-gradient(120deg,#fff,#aebfd2);
        /* ===== Theme đang chọn ===== */
        ${themeCss(theme)}
        /* ===== Font người dùng chọn (override font của mẫu, nếu có) ===== */
        ${fontOverrideCss}
        /* ===== Hệ số phóng chữ (mọi font-size đều nhân với biến này) ===== */
        --ts:${TS};
      }
      html,body{margin:0;padding:0;width:${capW}px;height:${capH}px;background:var(--bg);overflow:hidden;
        font-family:var(--font);color:var(--text);}
      /* Khung chụp thật (nền tối để viền letterbox hoà liền khi thu nhỏ canvas). */
      #frame{position:relative;width:${capW}px;height:${capH}px;overflow:hidden;background:var(--bg);}
      #stage{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(${scale.toFixed(5)});
        transform-origin:center center;width:${width}px;height:${height}px;overflow:hidden;
        background:radial-gradient(${bgSize} at 50% 36%,var(--stage-a),transparent 70%),
          radial-gradient(circle at center,var(--grid) 1px,transparent 1px) 0 0/46px 46px,var(--bg);}
      #bg-glow{position:absolute;width:1100px;height:1100px;left:${glowLeft};top:${glowTop};border-radius:50%;
        background:radial-gradient(circle,var(--glow),transparent 65%);filter:blur(20px);z-index:0;}
      .scene{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;
        box-sizing:border-box;padding:110px 150px;opacity:0;z-index:5;text-align:center;gap:0;}
      .kicker{font-size:26px;font-weight:700;letter-spacing:6px;text-transform:uppercase;color:var(--teal);margin-bottom:26px;}
      .acc-amber .kicker{color:var(--amber);} .acc-violet .kicker{color:var(--violet);}
      .heading{font-size:62px;font-weight:800;letter-spacing:-1px;margin:0;max-width:1500px;line-height:1.1;}

      /* title */
      .badge{width:168px;height:168px;border-radius:30px;background:linear-gradient(150deg,var(--panel2),var(--bg));
        border:1px solid var(--line);box-shadow:0 30px 80px rgba(46,196,182,0.25);display:flex;align-items:center;
        justify-content:center;font-size:58px;font-weight:900;color:var(--amber);margin-bottom:40px;letter-spacing:-1px;}
      .title-h{font-size:112px;font-weight:900;letter-spacing:-3px;margin:0;max-width:1500px;line-height:1.04;
        background:var(--title-fill);-webkit-background-clip:text;background-clip:text;color:transparent;}
      .title-sub{font-size:38px;font-weight:600;color:var(--teal);margin-top:22px;}

      /* statement */
      .statement{display:flex;align-items:stretch;gap:34px;max-width:1480px;text-align:left;}
      .statement .bar{width:8px;border-radius:6px;background:linear-gradient(180deg,var(--teal),var(--amber));flex:none;}
      .statement-text{font-size:60px;font-weight:800;line-height:1.18;letter-spacing:-0.5px;}

      /* bullets */
      .blist{display:flex;flex-direction:column;gap:22px;margin-top:42px;max-width:1300px;width:100%;text-align:left;}
      .bitem{display:flex;align-items:center;gap:22px;background:var(--panel);border:1px solid var(--line);
        border-radius:18px;padding:24px 30px;}
      .bitem .bic{font-size:40px;flex:none;width:56px;text-align:center;}
      .bitem .btext{font-size:32px;line-height:1.35;color:var(--text);}

      /* cards */
      .card-row{display:flex;gap:38px;margin-top:48px;justify-content:center;}
      .vcard{width:560px;background:var(--panel);border:1px solid var(--line);border-radius:24px;padding:40px 40px 44px;box-sizing:border-box;text-align:left;}
      .vcard .ic{font-size:54px;}
      .vcard h3{font-size:38px;margin:18px 0 12px;font-weight:700;}
      .vcard p{font-size:27px;line-height:1.45;color:var(--muted);margin:0;}

      /* formula */
      .formula{display:flex;align-items:center;gap:28px;margin-top:54px;flex-wrap:wrap;justify-content:center;}
      .pill{font-size:38px;font-weight:700;padding:26px 40px;border-radius:20px;background:var(--panel);border:1px solid var(--line);}
      .pill.r{color:var(--teal);border-color:rgba(46,196,182,0.55);} .pill.g{color:var(--amber);border-color:rgba(255,195,0,0.5);}
      .pill.result{font-size:46px;font-weight:900;color:var(--strong-fg);background:linear-gradient(120deg,var(--panel2),var(--bg));}
      .op{font-size:58px;font-weight:300;color:var(--muted);}

      /* flow */
      .flow{display:flex;align-items:center;gap:18px;margin-top:54px;flex-wrap:nowrap;justify-content:center;}
      .fbox{width:248px;min-height:182px;background:var(--panel);border:1px solid var(--line);border-radius:22px;
        padding:24px 16px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}
      .fbox.hot{border-color:rgba(255,195,0,0.6);box-shadow:0 0 0 1px rgba(255,195,0,0.2);}
      .fbox .ic{font-size:52px;line-height:1;} .fbox .t{font-size:26px;font-weight:700;margin-top:14px;}
      .fbox .d{font-size:19px;color:var(--muted);margin-top:7px;line-height:1.3;}
      .arrow{font-size:44px;color:var(--amber);font-weight:300;}

      /* compare */
      .cmp{display:flex;align-items:stretch;gap:30px;margin-top:48px;justify-content:center;}
      .cmp-wrap{flex:1;max-width:620px;}
      .cmp-col{background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:34px 34px 38px;text-align:left;height:100%;box-sizing:border-box;}
      .cmp-col.l{border-color:rgba(155,140,255,0.5);} .cmp-col.r{border-color:rgba(46,196,182,0.55);}
      .cmp-title{font-size:36px;font-weight:800;margin-bottom:20px;}
      .cmp-col.l .cmp-title{color:var(--violet);} .cmp-col.r .cmp-title{color:var(--teal);}
      .cmp-pt{font-size:27px;line-height:1.4;color:var(--muted);padding:10px 0 10px 28px;position:relative;}
      .cmp-pt::before{content:"›";position:absolute;left:6px;color:var(--amber);font-weight:700;}
      .cmp-vs{align-self:center;font-size:34px;font-weight:900;color:var(--strong-fg);background:var(--panel2);border:1px solid var(--line);
        border-radius:50%;width:84px;height:84px;display:flex;align-items:center;justify-content:center;flex:none;}

      /* stat */
      .stat-row{display:flex;gap:50px;margin-top:48px;justify-content:center;flex-wrap:wrap;}
      .stat{background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:36px 44px;min-width:260px;}
      .stat-val{font-size:88px;font-weight:900;letter-spacing:-2px;
        background:linear-gradient(120deg,var(--amber),var(--teal));-webkit-background-clip:text;background-clip:text;color:transparent;
        font-variant-numeric:tabular-nums;}
      .stat-label{font-size:26px;color:var(--muted);margin-top:10px;}

      /* steps */
      .steps{display:flex;flex-direction:column;gap:20px;margin-top:42px;max-width:1300px;width:100%;text-align:left;}
      .step{display:flex;align-items:flex-start;gap:24px;background:var(--panel);border:1px solid var(--line);border-radius:18px;padding:24px 30px;}
      .step-num{flex:none;width:58px;height:58px;border-radius:50%;background:linear-gradient(150deg,var(--panel2),var(--bg));
        border:1px solid var(--line);color:var(--amber);font-size:30px;font-weight:900;display:flex;align-items:center;justify-content:center;}
      .step-title{font-size:32px;font-weight:700;} .step-desc{font-size:25px;color:var(--muted);margin-top:6px;line-height:1.4;}

      /* outro */
      .outro-h{font-size:82px;font-weight:900;letter-spacing:-1px;margin:0;max-width:1500px;line-height:1.08;}
      .chips{display:flex;gap:24px;margin-top:46px;flex-wrap:wrap;justify-content:center;}
      .chip{font-size:30px;font-weight:600;padding:20px 32px;border-radius:16px;background:var(--panel);border:1px solid rgba(46,196,182,0.4);}
      .outro-sub{font-size:32px;color:var(--muted);margin-top:22px;}

      /* point fallback */
      .point-body{font-size:33px;line-height:1.5;color:var(--muted);margin-top:30px;max-width:1280px;
        background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:36px 44px;}

      /* ===== Cinematic background: bokeh + vignette + grain ===== */
      .bokeh{position:absolute;border-radius:50%;z-index:1;filter:blur(2px);opacity:0.5;
        background:radial-gradient(circle at 35% 35%,rgba(255,255,255,0.9),var(--bok1) 40%,transparent 70%);
        animation:floaty 14s ease-in-out infinite;}
      .bokeh.b1{width:26px;height:26px;left:12%;top:24%;animation-delay:0s;}
      .bokeh.b2{width:14px;height:14px;left:78%;top:18%;animation-delay:-3s;opacity:0.35;}
      .bokeh.b3{width:40px;height:40px;left:84%;top:62%;animation-delay:-6s;background:radial-gradient(circle at 35% 35%,var(--amber),var(--bok2) 45%,transparent 70%);}
      .bokeh.b4{width:18px;height:18px;left:20%;top:74%;animation-delay:-9s;opacity:0.4;}
      .bokeh.b5{width:10px;height:10px;left:50%;top:12%;animation-delay:-5s;opacity:0.3;}
      .bokeh.b6{width:30px;height:30px;left:8%;top:54%;animation-delay:-11s;background:radial-gradient(circle at 35% 35%,var(--violet),var(--bok3) 45%,transparent 70%);}
      @keyframes floaty{0%,100%{transform:translateY(0) translateX(0);}50%{transform:translateY(-46px) translateX(18px);}}
      #vignette{position:absolute;inset:0;z-index:6;pointer-events:none;
        background:radial-gradient(120% 90% at 50% 42%,transparent 52%,rgba(0,0,0,0.55) 100%);}
      #film-grain{position:absolute;inset:0;z-index:7;pointer-events:none;opacity:0.05;mix-blend-mode:overlay;
        background-image:radial-gradient(rgba(255,255,255,0.7) 0.5px,transparent 0.5px);background-size:3px 3px;}
      /* Lớp chớp sáng cho format flash/glitch (mặc định ẩn). */
      #flash{position:absolute;inset:0;z-index:9;pointer-events:none;opacity:0;background:#fff;}

      /* ===== section (số thứ tự đỏ lớn + tiêu đề bold) ===== */
      .section-h{font-size:104px;font-weight:900;letter-spacing:-2.5px;line-height:1.06;margin:0;max-width:1500px;
        color:var(--strong-fg);text-shadow:0 8px 40px rgba(0,0,0,0.45);}
      .secnum{color:var(--red);text-shadow:0 6px 30px rgba(255,90,106,0.45);}
      .section-sub{font-size:36px;font-weight:600;color:var(--muted);margin-top:32px;max-width:1200px;line-height:1.4;}

      /* ===== quote (thẻ kính mờ + ngoặc kép trang trí) ===== */
      .quote-card{position:relative;max-width:1180px;padding:80px 92px;border-radius:34px;text-align:center;
        background:linear-gradient(160deg,rgba(30,52,82,0.55),rgba(10,22,38,0.5));
        border:1px solid rgba(255,255,255,0.12);box-shadow:0 40px 120px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.08);
        backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);}
      .quote-badge{display:inline-block;font-size:18px;font-weight:800;letter-spacing:5px;text-transform:uppercase;
        color:var(--muted);background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.12);
        border-radius:999px;padding:9px 22px;margin-bottom:30px;}
      .quote-text{font-size:54px;font-weight:800;line-height:1.32;letter-spacing:-0.5px;color:var(--strong-fg);}
      .quote-by{font-size:30px;font-weight:600;color:var(--teal);margin-top:30px;}
      .qmark{position:absolute;font-family:Georgia,serif;font-size:170px;line-height:1;color:rgba(46,196,182,0.35);}
      .qmark-top{top:14px;left:34px;}
      .qmark-bot{bottom:-44px;right:40px;color:rgba(255,195,0,0.32);}

      /* ===== prompt (khung mẫu prompt hiển thị nguyên văn) ===== */
      .promptbox{width:100%;max-width:1200px;margin-top:30px;border-radius:24px;overflow:hidden;text-align:left;
        background:linear-gradient(180deg,rgba(13,27,42,0.92),rgba(8,16,28,0.92));
        border:1px solid rgba(255,255,255,0.12);box-shadow:0 36px 110px rgba(0,0,0,0.55),inset 0 1px 0 rgba(255,255,255,0.06);}
      .pb-bar{display:flex;align-items:center;gap:12px;padding:18px 26px;border-bottom:1px solid rgba(255,255,255,0.08);
        background:rgba(255,255,255,0.03);}
      .pb-dot{width:15px;height:15px;border-radius:50%;flex:none;}
      .pb-dot.r{background:#ff5f57;} .pb-dot.y{background:#febc2e;} .pb-dot.g{background:#28c840;}
      .pb-tag{margin-left:10px;font-size:18px;font-weight:800;letter-spacing:3px;text-transform:uppercase;color:var(--teal);}
      .pb-copy{margin-left:auto;font-size:18px;font-weight:600;color:var(--muted);background:rgba(255,255,255,0.06);
        border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:7px 16px;}
      .pb-body{padding:34px 40px;font-size:34px;line-height:1.55;color:#eaf2ff;white-space:pre-wrap;word-break:break-word;
        font-family:"DejaVu Sans Mono","Consolas",ui-monospace,monospace;}
      .pb-note{font-size:26px;color:var(--muted);margin-top:22px;max-width:1100px;line-height:1.4;}

      /* ===== popup (thẻ ví dụ/nguồn bật lên) ===== */
      .popups{display:flex;flex-direction:column;gap:22px;margin-top:44px;max-width:1280px;width:100%;text-align:left;}
      .popup-card{display:flex;align-items:flex-start;gap:22px;position:relative;
        background:linear-gradient(150deg,rgba(30,52,82,0.6),rgba(12,24,40,0.55));
        border:1px solid rgba(255,255,255,0.12);border-radius:20px;padding:26px 30px;
        box-shadow:0 26px 70px rgba(0,0,0,0.45),inset 0 1px 0 rgba(255,255,255,0.07);backdrop-filter:blur(10px);}
      .popup-card .pc-ic{font-size:42px;flex:none;width:60px;height:60px;border-radius:14px;display:flex;align-items:center;
        justify-content:center;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);}
      .pc-body{flex:1;}
      .pc-title{font-size:32px;font-weight:800;color:var(--strong-fg);line-height:1.25;}
      .pc-text{font-size:26px;color:var(--muted);margin-top:8px;line-height:1.45;}
      .pc-tag{flex:none;align-self:center;font-size:19px;font-weight:700;color:var(--teal);
        background:rgba(46,196,182,0.12);border:1px solid rgba(46,196,182,0.4);border-radius:999px;padding:7px 16px;}

      /* ===== photo (ảnh thật full-bleed + Ken Burns) ===== */
      .layout-photo{padding:0!important;}
      .photo-wrap{position:absolute;inset:0;overflow:hidden;z-index:1;}
      .photo-img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;will-change:transform;}
      .photo-scrim{position:absolute;inset:0;background:linear-gradient(0deg,rgba(0,0,0,0.82) 0%,rgba(0,0,0,0.25) 42%,rgba(0,0,0,0.1) 100%);}
      .photo-cap{position:absolute;left:0;right:0;bottom:120px;z-index:3;padding:0 130px;text-align:left;}
      .photo-h{font-size:84px;font-weight:900;letter-spacing:-1.5px;line-height:1.05;margin:0;color:#fff;text-shadow:0 6px 30px rgba(0,0,0,0.6);max-width:1500px;}
      .photo-sub{font-size:36px;font-weight:600;color:#e8eef6;margin-top:18px;text-shadow:0 4px 18px rgba(0,0,0,0.6);}
      .layout-photo .kicker{color:#fff;}
      .img-credit{position:absolute;right:22px;bottom:22px;z-index:4;font-size:17px;color:rgba(255,255,255,0.7);
        background:rgba(0,0,0,0.4);border-radius:8px;padding:5px 12px;letter-spacing:0.5px;}

      /* ===== split (ảnh | chữ) ===== */
      .split{display:flex;align-items:center;gap:64px;width:100%;max-width:1620px;}
      .split.nomedia{justify-content:center;}
      .split-media{flex:1;max-width:760px;height:760px;border-radius:28px;overflow:hidden;border:1px solid var(--line);
        box-shadow:0 40px 110px rgba(0,0,0,0.5);}
      .split-media img{width:100%;height:100%;object-fit:cover;display:block;}
      .split-text{flex:1;text-align:left;}
      .split-text .heading{font-size:58px;line-height:1.1;margin:14px 0 0;}
      .split-body{font-size:34px;line-height:1.5;color:var(--muted);margin-top:26px;}

      /* ===== gallery (2-3 ảnh) ===== */
      .gallery{display:flex;gap:26px;margin-top:46px;justify-content:center;width:100%;}
      .gphoto{flex:1;max-width:560px;height:660px;border-radius:22px;overflow:hidden;border:1px solid var(--line);
        box-shadow:0 30px 80px rgba(0,0,0,0.45);}
      .gphoto img{width:100%;height:100%;object-fit:cover;display:block;}

      /* ===== bars (biểu đồ cột - sơ đồ số liệu) ===== */
      .bars{display:flex;flex-direction:column;gap:26px;margin-top:48px;max-width:1360px;width:100%;}
      .bar-row{display:flex;align-items:center;gap:28px;}
      .bar-label{flex:none;width:360px;text-align:right;font-size:30px;font-weight:700;color:var(--text);}
      .bar-track{flex:1;height:58px;background:var(--panel);border:1px solid var(--line);border-radius:14px;overflow:hidden;}
      .bar-fill{height:100%;border-radius:13px;background:linear-gradient(90deg,var(--teal),var(--amber));
        display:flex;align-items:center;justify-content:flex-end;padding-right:22px;box-sizing:border-box;}
      .bar-val{font-size:28px;font-weight:900;color:#06121f;font-variant-numeric:tabular-nums;}

      /* ===== timeline (dòng thời gian - sơ đồ tiến trình) ===== */
      .timeline{position:relative;margin-top:42px;max-width:1320px;width:100%;text-align:left;padding-left:54px;}
      .timeline::before{content:"";position:absolute;left:18px;top:8px;bottom:8px;width:4px;border-radius:3px;
        background:linear-gradient(180deg,var(--teal),var(--violet));}
      .tl-item{position:relative;padding:0 0 30px 40px;}
      .tl-dot{position:absolute;left:-46px;top:6px;width:26px;height:26px;border-radius:50%;background:var(--amber);
        border:4px solid var(--bg);box-shadow:0 0 0 3px var(--teal);}
      .tl-time{font-size:24px;font-weight:800;color:var(--teal);letter-spacing:1px;}
      .tl-title{font-size:34px;font-weight:800;line-height:1.2;margin-top:4px;}
      .tl-body{font-size:26px;color:var(--muted);margin-top:8px;line-height:1.4;}

      /* ===== bignum (con số khổng lồ) ===== */
      .bignum{display:flex;flex-direction:column;align-items:center;text-align:center;max-width:1620px;width:100%;}
      .bignum-val{font-size:230px;font-weight:900;line-height:0.95;letter-spacing:-5px;max-width:100%;overflow-wrap:break-word;
        background:linear-gradient(120deg,var(--amber),var(--teal));-webkit-background-clip:text;background-clip:text;color:transparent;
        font-variant-numeric:tabular-nums;}
      .bignum-cap{font-size:52px;font-weight:800;margin-top:14px;max-width:1300px;line-height:1.12;overflow-wrap:break-word;}
      .bignum-sub{font-size:31px;color:var(--muted);margin-top:18px;max-width:1100px;line-height:1.4;overflow-wrap:break-word;}

      /* ===== checklist (tick) ===== */
      .checklist{display:flex;flex-direction:column;gap:20px;margin-top:40px;max-width:1320px;width:100%;text-align:left;}
      .check-item{display:flex;align-items:flex-start;gap:22px;background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:22px 28px;box-sizing:border-box;}
      .check-ic{flex:none;width:46px;height:46px;border-radius:50%;background:rgba(46,196,182,0.15);border:1px solid var(--teal);
        color:var(--teal);font-size:25px;font-weight:900;display:flex;align-items:center;justify-content:center;}
      .check-tx{font-size:31px;line-height:1.35;min-width:0;overflow-wrap:break-word;}

      /* ===== icongrid (lưới icon) ===== */
      .icongrid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:46px;max-width:1500px;width:100%;}
      .icongrid.n1,.icongrid.n2,.icongrid.n4{grid-template-columns:repeat(2,1fr);max-width:1120px;}
      .ig-cell{background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:38px 26px;text-align:center;
        display:flex;flex-direction:column;align-items:center;gap:14px;box-sizing:border-box;min-width:0;}
      .ig-ic{font-size:62px;line-height:1;}
      .ig-t{font-size:29px;font-weight:700;line-height:1.25;overflow-wrap:break-word;min-width:0;}

      /* ===== pros (ưu/nhược) ===== */
      .pros{display:flex;gap:32px;margin-top:44px;justify-content:center;max-width:1540px;width:100%;}
      .pros-col{flex:1;min-width:0;max-width:700px;background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:34px 36px;text-align:left;box-sizing:border-box;}
      .pros-col.pro{border-color:rgba(46,230,160,0.55);} .pros-col.con{border-color:rgba(255,90,106,0.55);}
      .pros-h{font-size:34px;font-weight:800;margin-bottom:18px;overflow-wrap:break-word;}
      .pros-col.pro .pros-h{color:#2ee6a0;} .pros-col.con .pros-h{color:var(--red);}
      .pros-pt{font-size:27px;line-height:1.4;color:var(--muted);padding:9px 0 9px 26px;position:relative;overflow-wrap:break-word;}
      .pros-pt::before{content:"›";position:absolute;left:6px;color:var(--muted);}

      /* ===== gauge (vòng tròn %) ===== */
      .gauges{display:flex;gap:56px;margin-top:48px;justify-content:center;flex-wrap:wrap;max-width:1620px;}
      .gauge{position:relative;width:300px;display:flex;flex-direction:column;align-items:center;}
      .gauge-svg{width:260px;height:260px;transform:rotate(-90deg);}
      .gauge-bg{fill:none;stroke:var(--line);stroke-width:9;}
      .gauge-fg{fill:none;stroke:var(--teal);stroke-width:13;stroke-linecap:round;}
      .gauge-val{position:absolute;top:0;left:0;width:300px;height:260px;display:flex;align-items:center;justify-content:center;
        font-size:60px;font-weight:900;color:var(--text);font-variant-numeric:tabular-nums;}
      .gauge-label{font-size:28px;color:var(--muted);margin-top:14px;text-align:center;max-width:300px;overflow-wrap:break-word;}

      /* ===== definition (thuật ngữ + định nghĩa) ===== */
      .defn{max-width:1440px;text-align:center;display:flex;flex-direction:column;align-items:center;}
      .defn-term{font-size:92px;font-weight:900;letter-spacing:-2px;line-height:1.05;overflow-wrap:break-word;max-width:100%;
        background:var(--title-fill);-webkit-background-clip:text;background-clip:text;color:transparent;}
      .defn-line{width:120px;height:6px;border-radius:4px;background:linear-gradient(90deg,var(--teal),var(--amber));margin:30px 0;flex:none;}
      .defn-body{font-size:40px;line-height:1.5;color:var(--muted);max-width:1200px;overflow-wrap:break-word;}

      /* ===== roadmap (timeline ngang) ===== */
      .roadmap{display:flex;margin-top:62px;max-width:1620px;width:100%;justify-content:space-between;position:relative;}
      .roadmap::before{content:"";position:absolute;left:7%;right:7%;top:12px;height:4px;border-radius:3px;
        background:linear-gradient(90deg,var(--teal),var(--violet));z-index:0;}
      .rm-item{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;text-align:center;padding:0 14px;box-sizing:border-box;position:relative;z-index:1;}
      .rm-dot{width:28px;height:28px;border-radius:50%;background:var(--amber);border:4px solid var(--bg);box-shadow:0 0 0 3px var(--teal);margin-bottom:22px;}
      .rm-time{font-size:26px;font-weight:800;color:var(--teal);}
      .rm-title{font-size:28px;font-weight:700;margin-top:6px;line-height:1.2;overflow-wrap:break-word;min-width:0;}
      .rm-body{font-size:21px;color:var(--muted);margin-top:8px;line-height:1.35;overflow-wrap:break-word;min-width:0;}

      /* ===== kpi (thẻ chỉ số + xu hướng) ===== */
      .kpis{display:flex;gap:30px;margin-top:46px;justify-content:center;flex-wrap:wrap;max-width:1600px;}
      .kpi-card{flex:1;min-width:300px;max-width:380px;background:var(--panel);border:1px solid var(--line);border-radius:22px;padding:36px 34px;text-align:left;box-sizing:border-box;}
      .kpi-val{font-size:70px;font-weight:900;letter-spacing:-2px;line-height:1;font-variant-numeric:tabular-nums;overflow-wrap:break-word;}
      .kpi-label{font-size:26px;color:var(--muted);margin-top:12px;line-height:1.3;overflow-wrap:break-word;}
      .kpi-delta{font-size:28px;font-weight:800;margin-top:14px;}
      .kpi-card.up .kpi-delta{color:#2ee6a0;} .kpi-card.down .kpi-delta{color:var(--red);}

      /* ===== cover (mở đầu kiểu bìa tạp chí) ===== */
      .cover{display:flex;flex-direction:column;align-items:center;text-align:center;max-width:1560px;width:100%;}
      .cv-eyebrow{display:flex;align-items:center;gap:22px;font-size:27px;font-weight:800;letter-spacing:7px;
        text-transform:uppercase;color:var(--teal);margin-bottom:36px;max-width:100%;overflow-wrap:break-word;}
      .cv-line{display:inline-block;width:70px;height:2px;flex:none;background:linear-gradient(90deg,transparent,var(--teal));}
      .cv-eyebrow .cv-line:last-child{background:linear-gradient(90deg,var(--teal),transparent);}
      .cv-title{font-size:122px;font-weight:900;letter-spacing:-3px;line-height:1.02;margin:0;max-width:1560px;overflow-wrap:break-word;
        background:var(--title-fill);-webkit-background-clip:text;background-clip:text;color:transparent;}
      .cv-title .cv-hl{-webkit-text-fill-color:initial;background:linear-gradient(120deg,var(--amber),var(--teal));
        -webkit-background-clip:text;background-clip:text;color:transparent;}
      .cv-bar{width:150px;height:8px;border-radius:5px;background:linear-gradient(90deg,var(--teal),var(--amber));margin-top:40px;flex:none;}
      .cv-sub{font-size:40px;font-weight:600;color:var(--muted);margin-top:32px;max-width:1240px;line-height:1.4;overflow-wrap:break-word;}
      .cv-chips{display:flex;gap:18px;margin-top:36px;flex-wrap:wrap;justify-content:center;}
      .cv-chip{font-size:26px;font-weight:700;color:var(--text);background:var(--panel);border:1px solid var(--line);border-radius:999px;padding:12px 28px;}

      /* ===== code (khung code tô màu cú pháp + số dòng) ===== */
      .codebox{width:100%;max-width:1320px;margin-top:26px;border-radius:18px;overflow:hidden;text-align:left;
        background:#0b1020;border:1px solid rgba(255,255,255,0.14);box-shadow:0 30px 90px rgba(0,0,0,0.55);}
      .cb-bar{display:flex;align-items:center;gap:11px;padding:16px 24px;border-bottom:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);}
      .cb-dot{width:14px;height:14px;border-radius:50%;flex:none;} .cb-dot.r{background:#ff5f57;} .cb-dot.y{background:#febc2e;} .cb-dot.g{background:#28c840;}
      .cb-name{margin-left:10px;font-size:21px;font-weight:700;color:#8fb8d8;font-family:"DejaVu Sans Mono","Consolas",ui-monospace,monospace;}
      .cb-body{padding:26px 32px;font-family:"DejaVu Sans Mono","Consolas",ui-monospace,monospace;font-size:30px;line-height:1.5;
        color:#dbe6f2;white-space:pre-wrap;overflow-wrap:anywhere;counter-reset:ln;}
      .cb-body .cl{display:block;}
      .cb-body .cl::before{counter-increment:ln;content:counter(ln);display:inline-block;width:2ch;margin-right:20px;color:rgba(255,255,255,0.28);text-align:right;}
      .cb-body .ck{color:#5ad0ff;font-weight:700;} .cb-body .cs{color:#b8ff5a;} .cb-body .cc{color:#7a8aa0;font-style:italic;}

      /* ===== browser (mockup trang web/báo - "ảnh chụp" dựng bằng HTML) ===== */
      .browserbox{width:100%;max-width:1280px;margin-top:24px;border-radius:16px;overflow:hidden;text-align:left;
        background:#ffffff;box-shadow:0 34px 100px rgba(0,0,0,0.55);border:1px solid rgba(0,0,0,0.1);}
      .bw-bar{display:flex;align-items:center;gap:12px;padding:16px 22px;background:#e9edf2;border-bottom:1px solid #d0d7e0;}
      .bw-dot{width:13px;height:13px;border-radius:50%;flex:none;} .bw-dot.r{background:#ff5f57;} .bw-dot.y{background:#febc2e;} .bw-dot.g{background:#28c840;}
      .bw-url{flex:1;min-width:0;background:#fff;border:1px solid #d0d7e0;border-radius:999px;padding:9px 20px;font-size:21px;
        color:#5a6675;font-family:"DejaVu Sans Mono",ui-monospace,monospace;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .bw-page{padding:36px 44px;background:#fff;color:#1a1f29;}
      .bw-title{font-size:46px;font-weight:900;line-height:1.15;color:#10141c;overflow-wrap:break-word;}
      .bw-text{font-size:28px;line-height:1.55;color:#3a4453;margin-top:18px;overflow-wrap:break-word;}
      .bw-tag{display:inline-block;margin-top:22px;background:#ffe27a;color:#5a3d00;border:1px solid #e0b84a;
        border-radius:9px;padding:9px 18px;font-weight:800;font-size:23px;overflow-wrap:break-word;max-width:100%;box-sizing:border-box;}

      /* ===== loop (sơ đồ vòng lặp tròn) ===== */
      .loop{position:relative;width:680px;height:680px;margin-top:18px;}
      .loop-ring{position:absolute;left:100px;top:100px;width:480px;height:480px;border-radius:50%;border:2px solid var(--line);}
      .loop-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);text-align:center;max-width:280px;}
      .lc-while{font-size:34px;font-weight:800;color:var(--violet);line-height:1.2;overflow-wrap:break-word;}
      .loop-node{position:absolute;transform:translate(-50%,-50%);width:200px;box-sizing:border-box;background:var(--panel);
        border:1px solid var(--teal);border-radius:16px;padding:16px 16px;text-align:center;}
      .loop-node .ln-num{font-size:20px;font-weight:900;color:var(--amber);} .loop-node .ln-t{font-size:25px;font-weight:700;line-height:1.2;margin-top:4px;overflow-wrap:break-word;}

      /* ===== custom (HTML do AI sinh - khung an toàn, chống tràn) ===== */
      .custombox{width:100%;max-width:1500px;max-height:760px;overflow:hidden;margin-top:28px;color:var(--text);
        font-size:32px;line-height:1.4;text-align:left;}
      .custombox *{max-width:100%;box-sizing:border-box;overflow-wrap:break-word;}
      .custombox img{max-width:100%;height:auto;}

      /* ===== Phụ đề karaoke dưới cùng ===== */
      #caption-layer{position:absolute;left:0;right:0;bottom:96px;z-index:8;display:flex;justify-content:center;pointer-events:none;}
      .cap{position:absolute;opacity:0;max-width:1360px;text-align:center;font-size:40px;font-weight:800;line-height:1.3;
        color:var(--cap-fg);text-shadow:var(--cap-shadow);padding:0 60px;}
      .cap-hl{color:var(--cap-hl);}
      /* ===== Caption FORMAT (mỗi design một kiểu phụ đề) ===== */
      .cap-fmt-pill{background:var(--panel);border:1px solid var(--line);border-radius:999px;
        padding:14px 34px;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);box-shadow:0 10px 30px rgba(0,0,0,0.3);}
      .cap-fmt-neon{text-shadow:0 0 10px var(--teal),0 0 24px var(--teal),0 0 46px rgba(29,233,255,0.5);}
      .cap-fmt-neon .cap-hl{text-shadow:0 0 10px var(--cap-hl),0 0 24px var(--cap-hl);}
      .cap-fmt-typewriter{white-space:nowrap;overflow:hidden;font-family:"IBM Plex Mono",ui-monospace,monospace;}
      .cap-fmt-typewriter::after{content:"▌";color:var(--cap-hl);margin-left:2px;animation:capCaret 0.7s steps(1) infinite;}
      @keyframes capCaret{50%{opacity:0;}}
      .cap-fmt-glitch{animation:capGlitch 0.85s steps(2,end) infinite;}
      @keyframes capGlitch{
        0%,100%{text-shadow:var(--cap-shadow);}
        40%{text-shadow:-3px 0 var(--teal),3px 0 var(--red),var(--cap-shadow);}
        45%{text-shadow:3px 0 var(--teal),-3px 0 var(--red),var(--cap-shadow);}
        50%{text-shadow:-2px 0 var(--amber),2px 0 var(--violet),var(--cap-shadow);}
      }

      /* Portrait overrides (9:16) */
      .portrait .section-h{font-size:78px;max-width:920px;}
      .portrait .section-sub{font-size:30px;}
      .portrait .quote-card{max-width:920px;padding:56px 56px;border-radius:28px;}
      .portrait .quote-text{font-size:44px;}
      .portrait .quote-by{font-size:26px;}
      .portrait .qmark{font-size:120px;}
      .portrait #caption-layer{bottom:150px;}
      .portrait .cap{font-size:38px;max-width:920px;}
      .portrait .promptbox{max-width:940px;}
      .portrait .pb-body{font-size:30px;padding:28px 32px;}
      .portrait .pb-tag,.portrait .pb-copy{font-size:16px;}
      .portrait .popups{max-width:940px;gap:18px;}
      .portrait .popup-card{padding:20px 24px;gap:18px;}
      .portrait .pc-ic{font-size:34px;width:52px;height:52px;}
      .portrait .pc-title{font-size:28px;}
      .portrait .pc-text{font-size:23px;}
      .portrait .pc-tag{font-size:17px;}

      /* Portrait overrides (9:16) */
      .portrait .scene { padding: 120px 80px; }
      .portrait .heading { font-size: 52px; max-width: 920px; }
      .portrait .title-h { font-size: 80px; max-width: 920px; }
      .portrait .title-sub { font-size: 32px; }
      .portrait .statement-text { font-size: 44px; }
      .portrait .point-body { font-size: 26px; padding: 28px 36px; max-width: 900px; }
      .portrait .badge { width: 140px; height: 140px; font-size: 48px; margin-bottom: 30px; }
      .portrait .kicker { font-size: 22px; margin-bottom: 20px; }
      .portrait .card-row { flex-direction: column; gap: 24px; align-items: center; margin-top: 30px; }
      .portrait .vcard { width: 900px; padding: 24px 30px; }
      .portrait .vcard h3 { font-size: 30px; margin: 10px 0 6px; }
      .portrait .vcard p { font-size: 22px; }
      .portrait .vcard .ic { font-size: 40px; }
      .portrait .pill { font-size: 30px; padding: 18px 28px; border-radius: 16px; }
      .portrait .op { font-size: 44px; }
      .portrait .flow { flex-direction: column; gap: 14px; }
      .portrait .fbox { width: 800px; min-height: auto; padding: 16px 24px; flex-direction: row; justify-content: flex-start; text-align: left; gap: 20px; }
      .portrait .fbox .ic { font-size: 38px; }
      .portrait .fbox .t { font-size: 24px; margin-top: 0; }
      .portrait .fbox .d { font-size: 18px; margin-top: 4px; }
      .portrait .arrow { transform: rotate(90deg); font-size: 32px; margin: 0; }
      .portrait .cmp { flex-direction: column; gap: 24px; align-items: center; width: 100%; }
      .portrait .cmp-wrap { width: 900px; max-width: 900px; }
      .portrait .cmp-vs { display: none; }
      .portrait .stat-row { gap: 24px; }
      .portrait .stat { padding: 24px 30px; min-width: 420px; }
      .portrait .stat-val { font-size: 72px; }
      .portrait .steps { max-width: 900px; gap: 16px; }
      .portrait .step { padding: 18px 24px; gap: 18px; }
      .portrait .step-num { width: 48px; height: 48px; font-size: 24px; }
      .portrait .step-title { font-size: 26px; }
      .portrait .step-desc { font-size: 20px; }
      .portrait .outro-h { font-size: 64px; }
      .portrait .chips { gap: 16px; margin-top: 30px; }
      .portrait .chip { font-size: 24px; padding: 14px 24px; }
      .portrait .outro-sub { font-size: 26px; }
      /* layout ảnh/sơ đồ ở dạng dọc */
      .portrait .photo-cap { bottom: 180px; padding: 0 80px; }
      .portrait .photo-h { font-size: 64px; }
      .portrait .photo-sub { font-size: 30px; }
      .portrait .split { flex-direction: column; gap: 30px; }
      .portrait .split-media { width: 900px; max-width: 900px; height: 620px; }
      .portrait .split-text { width: 900px; }
      .portrait .split-text .heading { font-size: 46px; }
      .portrait .split-body { font-size: 28px; }
      .portrait .gallery { flex-direction: column; align-items: center; gap: 18px; }
      .portrait .gphoto { width: 880px; max-width: 880px; height: 420px; }
      .portrait .bars { max-width: 920px; gap: 18px; }
      .portrait .bar-label { width: 280px; font-size: 24px; }
      .portrait .bar-track { height: 48px; }
      .portrait .bar-val { font-size: 22px; }
      .portrait .timeline { max-width: 900px; }
      .portrait .tl-title { font-size: 28px; }
      .portrait .tl-body { font-size: 22px; }
      /* layout sáng tạo mới - dạng dọc */
      .portrait .bignum-val { font-size: 150px; }
      .portrait .bignum-cap { font-size: 42px; }
      .portrait .bignum-sub { font-size: 26px; }
      .portrait .checklist { max-width: 920px; }
      .portrait .check-tx { font-size: 27px; }
      .portrait .icongrid, .portrait .icongrid.n1, .portrait .icongrid.n2, .portrait .icongrid.n4 { grid-template-columns: repeat(2, 1fr); max-width: 920px; gap: 18px; }
      .portrait .ig-cell { padding: 28px 18px; }
      .portrait .ig-ic { font-size: 50px; }
      .portrait .ig-t { font-size: 25px; }
      .portrait .pros { flex-direction: column; gap: 20px; align-items: center; }
      .portrait .pros-col { width: 920px; max-width: 920px; }
      .portrait .gauges { gap: 30px; }
      .portrait .gauge, .portrait .gauge-val { width: 240px; }
      .portrait .gauge-svg { width: 210px; height: 210px; }
      .portrait .gauge-val { height: 210px; font-size: 50px; }
      .portrait .defn-term { font-size: 64px; }
      .portrait .defn-body { font-size: 32px; max-width: 900px; }
      .portrait .roadmap { flex-direction: column; gap: 18px; max-width: 920px; }
      .portrait .roadmap::before { left: 13px; right: auto; top: 8px; bottom: 8px; width: 4px; height: auto; }
      .portrait .rm-item { display: block; text-align: left; padding: 0 0 0 50px; position: relative; }
      .portrait .rm-dot { position: absolute; left: 0; top: 4px; margin: 0; }
      .portrait .rm-title { margin-top: 2px; }
      .portrait .kpis { gap: 18px; }
      .portrait .kpi-card { min-width: 420px; max-width: 920px; }
      .portrait .kpi-val { font-size: 60px; }
      .portrait .cover { max-width: 940px; }
      .portrait .cv-title { font-size: 84px; }
      .portrait .cv-sub { font-size: 34px; max-width: 900px; }
      .portrait .cv-eyebrow { font-size: 23px; letter-spacing: 5px; }
      .portrait .codebox { max-width: 940px; }
      .portrait .cb-body { font-size: 26px; padding: 22px 24px; }
      .portrait .browserbox { max-width: 940px; }
      .portrait .bw-title { font-size: 40px; }
      .portrait .bw-text { font-size: 26px; }
      /* loop: GIỮ NGUYÊN geometry 680 (toạ độ node là px cố định); chỉ chỉnh chữ */
      .portrait .loop-node { width: 188px; }
      .portrait .loop-node .ln-t { font-size: 22px; }
      .portrait .lc-while { font-size: 30px; }
      .portrait .custombox { max-height: 1100px; }

      /* =================================================================== */
      /* ===== MODULE B/C - CSS 12 LAYOUT MỚI (concept pack) ============== */
      /* =================================================================== */

      /* C1 - Section-chip (tên chương, góc trên trái) */
      .section-chip{position:absolute;top:60px;left:80px;display:inline-flex;align-items:center;gap:12px;
        font-size:24px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--muted);
        background:rgba(255,255,255,0.05);border:1px solid var(--line);border-radius:999px;padding:10px 22px;
        backdrop-filter:blur(8px);z-index:6;}
      .section-chip .sc-dot{width:12px;height:12px;border-radius:50%;background:var(--accent,var(--teal));
        box-shadow:0 0 14px var(--accent,var(--teal));}

      /* Badge logo dùng chung (Module A: icon SVG / img / monogram) */
      .logo-badge{width:88px;height:88px;border-radius:50%;display:grid;place-items:center;flex:0 0 auto;
        color:#fff;background:radial-gradient(120% 120% at 30% 25%,color-mix(in srgb,var(--c) 80%,#fff),var(--c));
        box-shadow:0 0 40px -8px var(--c),inset 0 1px 0 rgba(255,255,255,0.4);overflow:hidden;}
      .logo-badge svg{width:54%;height:54%;fill:currentColor;}
      .logo-badge img{width:72%;height:72%;object-fit:contain;}
      .logo-badge.mono{font:800 40px/1 var(--font);}

      /* B1 - device: khung iphone / ipad / browser */
      .device-wrap{position:relative;display:flex;align-items:center;justify-content:center;}
      .dvc{position:relative;}
      .dvc.iphone{width:392px;height:790px;border-radius:58px;padding:13px;
        background:linear-gradient(160deg,#2a2d34,#0e0f12);
        box-shadow:0 40px 100px rgba(0,0,0,0.6),inset 0 0 0 2px #3a3d44,0 0 90px -20px var(--accent,#7c8bdc);}
      .dvc.iphone::before{content:"";position:absolute;top:26px;left:50%;translate:-50% 0;width:120px;height:34px;
        border-radius:20px;background:#000;z-index:3;}
      .dvc.iphone .dv-screen{width:100%;height:100%;border-radius:46px;}
      .dvc.ipad{width:620px;height:800px;border-radius:40px;padding:20px;
        background:linear-gradient(160deg,#2a2d34,#0e0f12);
        box-shadow:0 40px 100px rgba(0,0,0,0.6),inset 0 0 0 2px #3a3d44,0 0 90px -20px var(--accent,#7c8bdc);}
      .dvc.ipad .dv-screen{width:100%;height:100%;border-radius:22px;}
      .dvc.browser{width:880px;height:560px;border-radius:18px;overflow:hidden;
        background:#0e0f12;border:1px solid #2a3142;
        box-shadow:0 40px 100px rgba(0,0,0,0.55),0 0 90px -20px var(--accent,#7c8bdc);}
      .dvb-chrome{display:flex;align-items:center;gap:10px;padding:14px 20px;background:#15181f;border-bottom:1px solid #262c38;}
      .dvb-dot{width:14px;height:14px;border-radius:50%;}
      .dvb-dot.r{background:#ff5f57;} .dvb-dot.y{background:#febc2e;} .dvb-dot.g{background:#28c840;}
      .dvb-url{flex:1;margin-left:14px;font-size:22px;color:#aab4c4;background:#0b0d12;border-radius:10px;
        padding:8px 18px;text-align:left;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;}
      .dv-screen{overflow:hidden;background:#0b0d12;position:relative;}
      .dv-shot{width:100%;height:100%;object-fit:cover;object-position:top center;display:block;}
      .dv-skeleton{width:100%;height:100%;padding:34px 26px;display:flex;flex-direction:column;gap:18px;
        background:linear-gradient(180deg,#11151c,#0b0d12);}
      .dv-skeleton .sk-bar{height:46px;border-radius:14px;background:rgba(255,255,255,0.1);width:60%;}
      .dv-skeleton .sk-line{height:22px;border-radius:8px;background:rgba(255,255,255,0.07);}
      .dv-skeleton .sk-line.w90{width:90%;} .dv-skeleton .sk-line.w80{width:80%;}
      .dv-skeleton .sk-line.w70{width:70%;} .dv-skeleton .sk-line.w55{width:55%;}
      .dv-skeleton .sk-card{height:150px;border-radius:18px;background:rgba(124,139,220,0.18);
        border:1px solid rgba(124,139,220,0.3);margin:8px 0;}

      /* B2 - nhãn index dọc bên hông */
      .side-index{position:absolute;left:-26px;top:50%;translate:0 -50%;writing-mode:vertical-rl;rotate:180deg;
        font:800 24px/1 var(--font);letter-spacing:4px;color:var(--muted);display:flex;align-items:center;gap:18px;}
      .side-index .n{color:var(--accent,#fff);font-size:34px;}

      /* B3 - social-card */
      .social-card{width:600px;border-radius:26px;overflow:hidden;background:rgba(255,255,255,0.05);
        border:1px solid var(--line);backdrop-filter:blur(14px);box-shadow:0 30px 90px rgba(0,0,0,0.5);text-align:left;}
      .social-card .sc-banner{height:170px;background:linear-gradient(120deg,var(--accent,#3a4a6a),#1a2236);}
      .social-card .sc-banner img{width:100%;height:100%;object-fit:cover;display:block;}
      .social-card .sc-av{width:128px;height:128px;border-radius:50%;border:6px solid #0b0d12;margin:-66px 0 0 28px;
        object-fit:cover;position:relative;z-index:2;display:grid;place-items:center;background:#1a2236;}
      .social-card .sc-av-mono{font:800 56px/1 var(--font);color:#fff;}
      .social-card .sc-body{padding:14px 30px 32px;}
      .social-card .sc-name{font:800 40px/1.1 var(--font);display:flex;align-items:center;gap:12px;color:var(--text);}
      .sc-verified{width:34px;height:34px;border-radius:50%;background:#1d9bf0;display:inline-grid;place-items:center;flex:0 0 auto;}
      .sc-verified svg{width:22px;height:22px;}
      .social-card .sc-handle{color:var(--muted);font-size:28px;margin:6px 0 16px;}
      .social-card .sc-bio{font-size:28px;line-height:1.45;color:var(--text);}
      .social-card .sc-cta{display:inline-block;margin-top:22px;background:var(--accent,#1d9bf0);color:#fff;font-weight:800;
        font-size:26px;padding:14px 32px;border-radius:999px;}
      .plat-linkedin .sc-banner{background:linear-gradient(120deg,#0a66c2,#063e78);}
      .plat-linkedin .sc-cta{background:#0a66c2;}
      .plat-youtube .sc-banner{background:linear-gradient(120deg,#3a0d0d,#1a0808);}
      .plat-youtube .sc-cta{background:#f00;}

      /* B4 - brand-stat (số phát sáng neon) */
      .bstat-hd{display:inline-flex;align-items:center;gap:14px;font-size:30px;font-weight:700;color:var(--muted);
        margin-bottom:36px;padding-bottom:14px;border-bottom:2px solid;border-image:linear-gradient(90deg,transparent,var(--teal),transparent) 1;}
      .bstat-hd .bs-hicon{font-size:38px;}
      .bstat{display:grid;gap:48px;width:100%;max-width:1500px;}
      .bstat.n1{grid-template-columns:1fr;max-width:760px;} .bstat.n2{grid-template-columns:1fr 1fr;}
      .bstat.n3{grid-template-columns:repeat(3,1fr);} .bstat.n4{grid-template-columns:repeat(2,1fr);}
      .bstat .cell{text-align:center;display:flex;flex-direction:column;align-items:center;}
      .bstat .bs-badge{width:84px;height:84px;margin:0 auto 22px;box-shadow:0 0 50px -10px var(--accent,var(--c));}
      .bstat .big{font:900 96px/1 var(--font);color:#fff;text-shadow:0 0 50px var(--accent,var(--teal));}
      .bstat .big .unit{font-size:42px;font-weight:800;margin-left:8px;color:var(--muted);text-shadow:none;}
      .bstat .pill{display:inline-block;margin-top:16px;padding:14px 28px;border-radius:18px;font-size:28px;
        background:color-mix(in srgb,var(--accent,var(--teal)) 20%,transparent);
        border:1px solid color-mix(in srgb,var(--accent,var(--teal)) 55%,transparent);
        box-shadow:0 0 60px -16px var(--accent,var(--teal));}

      /* B - product-grid */
      .prod-grid{display:grid;gap:34px;width:100%;max-width:1500px;}
      .prod-grid.n1{grid-template-columns:1fr;max-width:640px;} .prod-grid.n2{grid-template-columns:1fr 1fr;}
      .prod-grid.n3{grid-template-columns:repeat(3,1fr);}
      .pg-card{background:rgba(255,255,255,0.05);border:1px solid var(--line);border-radius:22px;padding:26px;
        backdrop-filter:blur(10px);box-shadow:0 18px 50px rgba(0,0,0,0.35);}
      .pg-media{height:240px;border-radius:16px;overflow:hidden;margin-bottom:20px;background:rgba(255,255,255,0.04);}
      .pg-media img{width:100%;height:100%;object-fit:cover;}
      .pg-media.pg-sk{background:linear-gradient(135deg,rgba(124,139,220,0.18),rgba(46,196,182,0.12));
        border:1px solid rgba(255,255,255,0.08);}
      .pg-name{font-size:34px;font-weight:800;color:var(--text);}
      .pg-desc{font-size:25px;color:var(--muted);margin-top:8px;line-height:1.4;}
      .pg-price{margin-top:16px;font-size:30px;font-weight:800;color:var(--teal);display:flex;gap:14px;align-items:baseline;}
      .pg-price .pg-out{color:var(--amber);}

      /* B5 - app-hero */
      .app-hero{display:flex;flex-direction:column;align-items:center;gap:30px;}
      .ah-squircle{width:150px;height:150px;border-radius:38px;display:grid;place-items:center;font-size:72px;
        background:linear-gradient(150deg,var(--panel2),var(--bg));border:1px solid var(--line);
        box-shadow:0 30px 80px rgba(124,139,220,0.3);}
      .app-hero .ah-badge{width:150px;height:150px;border-radius:38px;}
      .app-hero .ah-badge svg{width:50%;height:50%;}
      .ah-title{font:900 96px/1.04 var(--font);letter-spacing:-2px;margin:0;max-width:1400px;
        background:var(--title-fill);-webkit-background-clip:text;background-clip:text;color:transparent;}
      .ah-pills{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;margin-top:8px;}
      .ah-pill{display:inline-flex;align-items:center;gap:12px;font-size:28px;font-weight:700;color:var(--text);
        background:rgba(255,255,255,0.06);border:1px solid var(--line);border-radius:999px;padding:14px 28px;}
      .ah-pill .ah-arrow{color:var(--teal);font-weight:900;}
      .ah-pill.good{border-color:color-mix(in srgb,#39d98a 55%,transparent);color:#7ef0b6;}
      .ah-pill.bad{border-color:color-mix(in srgb,var(--red) 55%,transparent);color:#ff9aa6;}

      /* B5 - myth-bust */
      .myth{font:800 56px/1.4 var(--font);text-align:center;max-width:1500px;}
      .myth .my-ic{margin-right:14px;}
      .myth .x{color:var(--red);}
      .myth .wrong{text-decoration:line-through;text-decoration-color:var(--red);text-decoration-thickness:6px;
        color:var(--muted);opacity:0.75;}
      .myth .arrow{color:var(--amber);margin:0 10px;}
      .myth .right{color:#39d98a;}

      /* B - claim-card */
      .claim-card{position:relative;max-width:1280px;background:rgba(255,255,255,0.05);border:1px solid var(--line);
        border-radius:24px;padding:46px 56px;backdrop-filter:blur(12px);box-shadow:0 30px 90px rgba(0,0,0,0.45);text-align:left;}
      .claim-card.unverified{border-color:color-mix(in srgb,var(--amber) 55%,transparent);}
      .cl-tag{display:inline-block;font-size:24px;font-weight:700;letter-spacing:2px;text-transform:uppercase;
        color:var(--teal);background:rgba(46,196,182,0.12);border:1px solid color-mix(in srgb,var(--teal) 45%,transparent);
        border-radius:999px;padding:8px 20px;margin-bottom:24px;}
      .cl-quote{font:700 48px/1.35 var(--font);color:var(--text);}
      .cl-source{margin-top:24px;font-size:26px;color:var(--muted);}
      .cl-badge{position:absolute;top:30px;right:34px;font-size:24px;font-weight:800;color:#1a1205;
        background:var(--amber);border-radius:999px;padding:8px 20px;}

      /* B8 - roadmap-glow */
      .rmg{display:flex;align-items:stretch;justify-content:center;gap:0;flex-wrap:nowrap;max-width:1640px;}
      .rmg-node{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;text-align:center;
        padding:0 18px;position:relative;}
      .rmg-n{width:74px;height:74px;border-radius:50%;display:grid;place-items:center;font:900 34px/1 var(--font);color:#fff;
        background:radial-gradient(120% 120% at 30% 25%,color-mix(in srgb,var(--accent,var(--teal)) 80%,#fff),var(--accent,var(--teal)));
        box-shadow:0 0 44px -6px var(--accent,var(--teal));margin-bottom:18px;}
      .rmg-ic{font-size:42px;margin-bottom:10px;}
      .rmg-t{font-size:30px;font-weight:800;color:var(--text);line-height:1.15;}
      .rmg-s{font-size:24px;color:var(--muted);margin-top:8px;line-height:1.3;}
      .rmg-link{flex:0 0 60px;align-self:flex-start;height:6px;margin-top:34px;border-radius:3px;
        background:linear-gradient(90deg,var(--accent,var(--teal)),color-mix(in srgb,var(--accent,var(--teal)) 20%,transparent));
        box-shadow:0 0 20px -4px var(--accent,var(--teal));}

      /* B9 - segment-compare */
      .segc{display:flex;flex-direction:column;gap:22px;width:100%;max-width:1400px;}
      .segc-row{display:flex;align-items:center;gap:24px;background:rgba(255,255,255,0.04);border:1px solid var(--line);
        border-radius:18px;padding:22px 28px;text-align:left;}
      .segc-row .sg-badge{width:72px;height:72px;}
      .sg-ic{width:72px;height:72px;border-radius:18px;display:grid;place-items:center;font-size:40px;flex:0 0 auto;
        background:rgba(255,255,255,0.06);border:1px solid var(--line);}
      .sg-main{flex:1;min-width:0;}
      .sg-name{font-size:32px;font-weight:800;color:var(--text);}
      .sg-note{font-size:24px;color:var(--muted);margin:2px 0 12px;}
      .sg-track{height:16px;border-radius:8px;background:rgba(255,255,255,0.08);overflow:hidden;}
      .sg-fill{height:100%;border-radius:8px;background:linear-gradient(90deg,var(--teal),var(--accent,var(--violet)));
        box-shadow:0 0 20px -2px var(--teal);}
      .sg-score{font:900 48px/1 var(--font);color:#fff;flex:0 0 auto;min-width:110px;text-align:right;
        text-shadow:0 0 30px var(--teal);}
      .sg-verdict{margin-top:14px;font-size:30px;font-weight:700;color:var(--amber);text-align:center;}

      /* B10 - flow-broken */
      .flowbk{display:flex;align-items:center;justify-content:center;gap:0;}
      .fb-node{display:flex;flex-direction:column;align-items:center;gap:16px;}
      .fb-ic{width:150px;height:150px;border-radius:30px;display:grid;place-items:center;font-size:70px;
        background:rgba(255,255,255,0.05);border:1px solid var(--line);box-shadow:0 18px 50px rgba(0,0,0,0.35);}
      .fb-l{font-size:32px;font-weight:800;color:var(--text);}
      .fb-arrow{position:relative;width:240px;height:60px;display:grid;place-items:center;}
      .fb-line{width:100%;height:6px;border-radius:3px;background:var(--muted);opacity:0.5;}
      .flowbk.broken .fb-line{background:repeating-linear-gradient(90deg,var(--red) 0 18px,transparent 18px 30px);opacity:0.85;}
      .fb-slash{position:absolute;font-size:54px;font-weight:900;color:var(--red);rotate:12deg;
        text-shadow:0 0 24px rgba(255,90,106,0.6);}

      /* B11 - icon-row */
      .icon-row{display:flex;justify-content:center;gap:34px;flex-wrap:wrap;max-width:1600px;}
      .ir-cell{display:flex;flex-direction:column;align-items:center;gap:18px;flex:1 1 0;min-width:200px;max-width:340px;
        background:rgba(255,255,255,0.04);border:1px solid var(--line);border-radius:22px;padding:36px 24px;text-align:center;}
      .ir-cell .ir-badge{width:96px;height:96px;}
      .ir-ic{width:96px;height:96px;border-radius:24px;display:grid;place-items:center;font-size:52px;
        background:rgba(255,255,255,0.06);border:1px solid var(--line);}
      .ir-l{font-size:30px;font-weight:700;color:var(--text);line-height:1.2;}

      /* B12 - pricing-row */
      .pricing{display:flex;flex-direction:column;gap:0;width:100%;max-width:1400px;border:1px solid var(--line);
        border-radius:20px;overflow:hidden;}
      .pr-row{display:flex;align-items:center;border-bottom:1px solid var(--line);}
      .pr-row:last-child{border-bottom:none;}
      .pr-row.pr-head{background:rgba(255,255,255,0.06);font-weight:800;color:var(--teal);text-transform:uppercase;letter-spacing:1px;}
      .pr-name{flex:1.4;text-align:left;padding:22px 30px;font-size:30px;font-weight:700;color:var(--text);}
      .pr-cell{flex:1;text-align:center;padding:22px 18px;font-size:30px;color:var(--text);
        border-left:1px solid var(--line);}
      .pr-head .pr-cell,.pr-head .pr-name{font-size:26px;}

      /* ===== Portrait (9:16) cho layout mới ===== */
      .portrait .dvc.browser{width:840px;height:540px;}
      .portrait .dvc.ipad{width:560px;height:740px;}
      .portrait .social-card{width:860px;}
      .portrait .bstat{gap:34px;max-width:940px;}
      .portrait .bstat.n3,.portrait .bstat.n4{grid-template-columns:1fr 1fr;}
      .portrait .bstat .big{font-size:78px;}
      .portrait .prod-grid{max-width:940px;}
      .portrait .prod-grid.n3{grid-template-columns:1fr;}
      .portrait .ah-title{font-size:78px;}
      .portrait .myth{font-size:48px;max-width:940px;}
      .portrait .claim-card{max-width:940px;padding:38px 40px;}
      .portrait .cl-quote{font-size:40px;}
      .portrait .rmg{flex-wrap:wrap;gap:20px 0;max-width:940px;}
      .portrait .rmg-node{flex:1 1 33%;}
      .portrait .rmg-link{display:none;}
      .portrait .segc{max-width:940px;}
      .portrait .icon-row{max-width:940px;}
      .portrait .pricing{max-width:940px;}
      .portrait .flowbk{flex-direction:column;gap:0;}
      .portrait .fb-arrow{width:60px;height:200px;}
      .portrait .fb-line{width:6px;height:100%;}
      .portrait .flowbk.broken .fb-line{background:repeating-linear-gradient(180deg,var(--red) 0 18px,transparent 18px 30px);}
      .portrait .section-chip{top:40px;left:50px;font-size:21px;}

      /* ===== CSS RIÊNG THEO DESIGN STYLE (ghi đè nền/font/viền/trang trí) ===== */
      ${designStyle ? designCss(designStyle) : ""}
    </style>
  </head>
  <body>
    <div id="frame" data-composition-id="${esc(id)}" data-width="${capW}" data-height="${capH}" data-start="0" data-duration="${TOTAL}">
    <div id="stage" class="${stageClasses}">
      <div id="bg-glow"></div>
      <div class="bokeh b1"></div><div class="bokeh b2"></div><div class="bokeh b3"></div>
      <div class="bokeh b4"></div><div class="bokeh b5"></div><div class="bokeh b6"></div>
${sectionsHtml}
      <div id="caption-layer">${caps.html}</div>
      <div id="vignette"></div>
      <div id="film-grain"></div>
      <div id="flash"></div>

      <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
      <script>
        (function () {
          const tl = gsap.timeline({ paused: true });

          // Chuyển cảnh theo FORMAT của mẫu (giọng đọc liền mạch bên dưới).
          ${transitionJs(fmt.transition)}

          ${tweens.join("\n          ")}

          window.__timelines = window.__timelines || {};
          window.__timelines["${esc(id)}"] = tl;
        })();
      </script>
    </div>
    </div>
  </body>
</html>
`;
  // Nhân MỌI font-size (px) trong các khối <style> với var(--ts) -> phóng to/thu nhỏ
  // toàn bộ chữ đồng đều. Chỉ tác động trong <style> (không đụng nội dung code hiển thị).
  return __html.replace(
    /(<style>)([\s\S]*?)(<\/style>)/g,
    (_m, open, css, close) =>
      open +
      css.replace(/font-size:\s*([\d.]+)px/g, (_mm, n) => `font-size:calc(${n}px * var(--ts))`) +
      close,
  );
}
