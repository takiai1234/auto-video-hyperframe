// Dựng lại các trang xem trước (KHÔNG dùng trong pipeline render thật):
//   public/live-preview/<id>-<wide|tall>.html  - mỗi MẪU một bộ cảnh theo "tính cách"
//     (image/diagram/stat/text/mixed) -> preview minh hoạ ĐÚNG bố cục riêng của mẫu.
//   public/live-preview/index.html              - trang chọn mẫu
//   public/design-gallery.html                  - gallery 20 mẫu tĩnh
// TUYỆT ĐỐI không dùng em-dash (chỉ dùng "-").
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildComposition } from "../src/composition.js";
import { publicThemes, randomFormat } from "../src/themes.js";
import { searchImage } from "../src/images.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LP = path.join(ROOT, "public", "live-preview");
fs.mkdirSync(LP, { recursive: true });

const AUTOPLAY = `<script>window.addEventListener("load",function(){setTimeout(function(){var tl=(window.__timelines||{})["vid"];if(tl){tl.repeat(-1);tl.repeatDelay(0.7);tl.play();}},350);});</script>`;
const write = (file, html) =>
  fs.writeFileSync(path.join(LP, file), html.replace("</body>", AUTOPLAY + "</body>"));

function startsFor(scenes, step = 3.0) {
  const starts = [];
  let c = 0;
  for (let i = 0; i < scenes.length; i++) {
    starts[i] = c;
    c += step;
  }
  return { starts, total: c + 0.8 };
}

// Lấy 1 pool ảnh thật (Openverse) dùng chung cho mọi mẫu thiên ảnh.
async function fetchPool() {
  const queries = [
    "technology abstract",
    "data visualization",
    "city skyline night",
    "team meeting office",
    "nature landscape",
    "robot artificial intelligence",
    "solar energy panel",
    "financial growth chart",
    "smartphone app",
    "laboratory science",
  ];
  const out = [];
  for (const q of queries) {
    // eslint-disable-next-line no-await-in-loop
    const r = await searchImage(q);
    if (r) out.push(r.url);
  }
  return out.length ? out : [""];
}
const POOL = await fetchPool();
const pic = (i) => POOL[((i % POOL.length) + POOL.length) % POOL.length];

// ----- Bộ cảnh theo "tính cách" (media) -----
function setImage(o) {
  // "Dan chung truc quan": uu tien code/browser dung bang HTML, chi 1 anh that.
  return [
    { layout: "cover", kicker: "Dan chung thuc te", title: "Code, web, **anh that**", subtitle: "Dung bang HTML, sat noi dung", chips: ["Code", "Browser", "Anh"], narration: " ", caption: "**Dan chung**" },
    { layout: "code", kicker: "ralph.sh", heading: "Vi du ma nguon", code: "while true; do\n  cat PROMPT.md | agent   // moi vong\n  git commit -am 'loop'  # luu trang thai\ndone", narration: " ", caption: "**Code** that" },
    { layout: "browser", kicker: "Bang chung", url: "github.com/anthropics/claude-code", heading: "Trang/bai bao that dung bang HTML", text: "Mockup trang web giup dan chung sat noi dung ma khong can tai anh ngoai.", tag: "nguon chinh thuc", narration: " ", caption: "**Browser** mockup" },
    { layout: "photo", kicker: "Minh hoa", heading: "Anh that khi can", subtitle: "Chi dung khi co vat the that", image: pic(o), _credit: "Openverse, CC", narration: " ", caption: "**Photo** (han che)" },
    { layout: "stat", kicker: "So lieu", heading: "Con so", stats: [{ value: "82%", label: "hieu qua" }, { value: "3x", label: "nhanh hon" }], narration: " ", caption: "**So lieu**" },
    { layout: "outro", heading: "Truc quan, sat noi dung", chips: ["✅ Code", "✅ Web"], subtitle: "AutoVideo", narration: " ", caption: "Xong" },
  ];
}
function setDiagram() {
  return [
    { layout: "cover", kicker: "Truc quan hoa", title: "Manh ve **so do**", subtitle: "Flow, loop, bars, timeline", chips: ["Flow", "Loop", "Bars"], narration: " ", caption: "**So do**" },
    { layout: "flow", kicker: "Co che", heading: "Quy trinh 4 buoc", steps: [{ icon: "💡", title: "Y tuong", hot: true }, { icon: "🤖", title: "Xu ly" }, { icon: "🎬", title: "Dung" }, { icon: "📤", title: "Phat" }], narration: " ", caption: "Quy trinh **4 buoc**" },
    { layout: "loop", kicker: "Vong lap", heading: "Co che lap", center: "while (chua xong)", steps: [{ title: "Doc boi canh" }, { title: "Hanh dong" }, { title: "Nhin ket qua" }, { title: "Lap lai" }], narration: " ", caption: "**Loop** tron" },
    { layout: "roadmap", kicker: "Lo trinh", heading: "Cac giai doan", items: [{ time: "Q1", title: "Khoi tao", body: "Len ke hoach." }, { time: "Q2", title: "Phat trien", body: "Xay tinh nang." }, { time: "Q3", title: "Ra mat", body: "Phat hanh." }, { time: "Q4", title: "Mo rong", body: "Tang quy mo." }], narration: " ", caption: "**Roadmap** ngang" },
    { layout: "bars", kicker: "So lieu", heading: "Ty le", items: [{ label: "AI", value: "82%" }, { label: "Cloud", value: "64%" }, { label: "IoT", value: "45%" }, { label: "AR/VR", value: "28%" }], narration: " ", caption: "Bieu do **cot**" },
    { layout: "gauge", kicker: "Tien do", heading: "Hoan thanh", stats: [{ value: "82%", label: "Muc tieu nam" }, { value: "45%", label: "Ngan sach" }, { value: "67%", label: "Nhan luc" }], narration: " ", caption: "Vong tron **%**" },
    { layout: "pros", kicker: "Danh gia", heading: "Uu va nhuoc", left: { title: "Uu diem", points: ["Nhanh hon", "Tu dong"] }, right: { title: "Nhuoc diem", points: ["Chi phi dau tu", "Can hoc"] }, narration: " ", caption: "**Uu / nhuoc**" },
    { layout: "outro", heading: "Truc quan bang so do", chips: ["✅ So do"], subtitle: "AutoVideo", narration: " ", caption: "Xong" },
  ];
}
function setStat() {
  return [
    { layout: "cover", kicker: "Du lieu", title: "Nhan manh **con so**", subtitle: "Bignum, KPI, gauge, bars", chips: ["Bignum", "KPI", "Gauge"], narration: " ", caption: "**Con so**" },
    { layout: "bignum", kicker: "Hook", value: "1M+", heading: "nguoi dung moi", subtitle: "chi trong 6 thang", narration: " ", caption: "**Con so** lon" },
    { layout: "stat", kicker: "Noi bat", heading: "3 con so", stats: [{ value: "10M", label: "nguoi dung" }, { value: "+65%", label: "tang truong" }, { value: "3s", label: "giu chan" }], narration: " ", caption: "**Stat**" },
    { layout: "kpi", kicker: "Chi so", heading: "Theo doi", stats: [{ value: "10M", label: "MAU", delta: "+12%" }, { value: "3.2s", label: "Tai trang", delta: "-8%" }, { value: "99.9%", label: "Uptime" }], narration: " ", caption: "**KPI**" },
    { layout: "bars", kicker: "Ty le", heading: "Thi phan", items: [{ label: "A", value: "48%" }, { label: "B", value: "32%" }, { label: "C", value: "20%" }], narration: " ", caption: "Bieu do **cot**" },
    { layout: "outro", heading: "Manh ve so lieu", chips: ["✅ Con so"], subtitle: "AutoVideo", narration: " ", caption: "Xong" },
  ];
}
function setText() {
  return [
    { layout: "cover", kicker: "Co dong", title: "Manh ve **chu**", subtitle: "Statement, quote, definition", chips: ["Quote", "Definition"], narration: " ", caption: "**Chu** sac" },
    { layout: "definition", kicker: "Khai niem", term: "RAG", text: "Ky thuat cho mo hinh tra loi bang du lieu that thay vi bia.", narration: " ", caption: "**Dinh nghia**" },
    { layout: "statement", kicker: "Luan diem", text: "Mot cau chot manh dang gia ngan gon.", narration: " ", caption: "Cau **chot**" },
    { layout: "checklist", kicker: "Ghi nho", heading: "Can lam", items: [{ text: "Bat dau bang dan y" }, { text: "Vi du that, so lieu that" }, { text: "Ket bang loi keu goi" }], narration: " ", caption: "**Checklist**" },
    { layout: "quote", kicker: "Trich dan", text: "Don gian la dinh cao cua tinh te.", subtitle: "AutoVideo", narration: " ", caption: "**Trich dan**" },
    { layout: "outro", heading: "Manh ve chu", chips: ["✅ Co dong"], subtitle: "AutoVideo", narration: " ", caption: "Xong" },
  ];
}
function setMixed(o) {
  return [
    { layout: "cover", kicker: "Da dang", title: "Bo cuc **can bang**", subtitle: "Chu, so do va anh that", chips: ["Cards", "Flow", "Photo"], narration: " ", caption: "**Can bang**" },
    { layout: "icongrid", kicker: "Tinh nang", heading: "6 tinh nang", items: [{ icon: "🎨", title: "Mau" }, { icon: "🎞️", title: "Format" }, { icon: "🧩", title: "Layout" }, { icon: "🖼️", title: "Anh that" }, { icon: "📊", title: "So do" }, { icon: "🔤", title: "Font" }], narration: " ", caption: "**Icon grid**" },
    { layout: "flow", kicker: "Co che", heading: "Quy trinh", steps: [{ icon: "💡", title: "Chu de", hot: true }, { icon: "🤖", title: "AI" }, { icon: "🎬", title: "Render" }], narration: " ", caption: "Quy trinh" },
    { layout: "stat", kicker: "So lieu", heading: "Con so", stats: [{ value: "20", label: "mau" }, { value: "2", label: "ti le" }], narration: " ", caption: "**Stat**" },
    { layout: "photo", kicker: "Minh hoa", heading: "Anh that", image: pic(o), _credit: "Openverse, CC", narration: " ", caption: "**Photo**" },
    { layout: "outro", heading: "Da dang layout", chips: ["✅ Can bang"], subtitle: "AutoVideo", narration: " ", caption: "Xong" },
  ];
}
function scenesForMedia(media, offset) {
  if (media === "image") return setImage(offset);
  if (media === "diagram") return setDiagram();
  if (media === "stat") return setStat();
  if (media === "text") return setText();
  return setMixed(offset);
}

// 1) Trang mỗi MẪU. Format LINH HOẠT: random transition/caption/entrance/media mỗi trang
//    (minh hoạ tính ngẫu nhiên; màu vẫn cố định theo mẫu). Mỗi lần chạy lại sẽ khác.
const all = publicThemes();
all.forEach((t, idx) => {
  const fmt = randomFormat();
  const scenes = scenesForMedia(fmt.media, idx * 2);
  const { starts, total } = startsFor(scenes, 3.0);
  for (const [ar, name] of [["16:9", "wide"], ["9:16", "tall"]]) {
    write(`${t.id}-${name}.html`, buildComposition({ id: "vid", scenes, starts, total, aspectRatio: ar, theme: t.id, format: fmt, textScale: 1.12 }));
  }
});

// 2) Demo tong hop tat ca layout (anh + so do).
const demo = [...setImage(0).slice(0, 4), ...setDiagram().slice(1, 4), setText()[5]];
{
  const { starts, total } = startsFor(demo, 3.2);
  for (const [ar, name] of [["16:9", "wide"], ["9:16", "tall"]]) {
    write(`_media-demo-${name}.html`, buildComposition({ id: "vid", scenes: demo, starts, total, aspectRatio: ar, theme: "aurora-mesh", textScale: 1.12 }));
  }
}

// 3) Trang index.
const opts =
  `<option value="_media-demo">★ Demo TONG HOP (anh + so do)</option>` +
  all.map((t) => `<option value="${t.id}">${t.name} - ${t.desc}</option>`).join("");
fs.writeFileSync(
  path.join(LP, "index.html"),
  `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>AutoVideo - Live preview</title>
<style>
 body{margin:0;font-family:Inter,system-ui,sans-serif;background:#0b1220;color:#e8eefc;padding:18px;}
 h1{font-size:18px;margin:0 0 12px;} .bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:14px;}
 select{font-size:14px;padding:8px 12px;border-radius:8px;border:1px solid #2a3a55;background:#16243a;color:#e8eefc;max-width:620px;}
 small{opacity:.65;}
 .stage{display:flex;justify-content:center;background:#05080f;border:1px solid #233;border-radius:12px;padding:16px;}
 .frame-wrap{position:relative;overflow:hidden;background:#000;border-radius:8px;}
 .frame-wrap.wide{width:min(1100px,90vw);aspect-ratio:16/9;}
 .frame-wrap.tall{height:min(70vh,720px);aspect-ratio:9/16;}
 iframe{border:0;position:absolute;top:0;left:0;transform-origin:top left;}
</style></head>
<body><h1>🎬 Live preview - moi mau co LAYOUT + format rieng (timeline tu chay, lap)</h1>
<div class="bar"><label>Mau: <select id="m">${opts}</select></label>
<label>Ti le: <select id="r"><option value="wide">16:9</option><option value="tall">9:16</option></select></label>
<small>Moi mau dung bo canh theo tinh cach: image / diagram / stat / text / mixed.</small></div>
<div class="stage"><div class="frame-wrap wide" id="wrap"><iframe id="f" src="_media-demo-wide.html"></iframe></div></div>
<script>
 var m=document.getElementById("m"),r=document.getElementById("r"),f=document.getElementById("f"),wrap=document.getElementById("wrap");
 function fit(){var tall=r.value==="tall";var W=tall?1080:1920,H=tall?1920:1080;f.style.width=W+"px";f.style.height=H+"px";
   var s=Math.min(wrap.clientWidth/W,wrap.clientHeight/H);f.style.transform="scale("+s+")";
   f.style.left=((wrap.clientWidth-W*s)/2)+"px";f.style.top=((wrap.clientHeight-H*s)/2)+"px";}
 function upd(){wrap.className="frame-wrap "+r.value;f.src=m.value+"-"+r.value+".html";requestAnimationFrame(fit);}
 m.onchange=upd;r.onchange=upd;window.onresize=fit;f.onload=fit;requestAnimationFrame(fit);
</script></body></html>`,
);

// 4) Gallery tinh 20 mau (mockup mau, khong phai layout).
function previewBg(t) {
  switch (t.style) {
    case "vaporwave": return "linear-gradient(180deg,#2a0b4d,#7a1f8c 50%,#ff5fa2 78%,#ffb86b)";
    case "aurora-mesh": return "radial-gradient(55% 60% at 15% 20%,rgba(124,139,255,.75),transparent 70%),radial-gradient(55% 60% at 85% 25%,rgba(255,122,198,.65),transparent 70%),radial-gradient(60% 65% at 70% 88%,rgba(33,212,197,.6),transparent 70%),#070a18";
    case "frost-glass": return "radial-gradient(circle at 20% 28%,#5ad1ff,transparent 52%),radial-gradient(circle at 82% 24%,#b07bff,transparent 52%),radial-gradient(circle at 60% 84%,#ff8fd0,transparent 52%),#0c1430";
    case "y2k-aero": return "radial-gradient(120% 95% at 50% 0%,#f0faff,#cfeaff 55%,#a9d8ff)";
    case "neon-glow": return "#03040a";
    case "blueprint": return "#0a1b2e";
    default: return `radial-gradient(120% 80% at 50% 28%, ${t.glow}, transparent 60%), ${t.bg}`;
  }
}
function swatch(t) {
  const cls = t.style ? `s-${t.style}` : "";
  const vars = `--p-bg:${t.bg};--p-panel:${t.panel};--p-panel2:${t.panel2 || t.panel};--p-line:${t.line};--p-text:${t.text};--p-muted:${t.muted};--p-a1:${t.a1};--p-a2:${t.a2};--p-a3:${t.a3};--p-hl:${t.hl};`;
  return `<button class="th-card"><div class="th-screen ${cls}" style="${vars}background:${previewBg(t)};font-family:${t.font};">
 <div class="th-pill" style="background:${t.panel};border:1px solid ${t.line};color:${t.a1};">● Chu de</div>
 <div class="th-title" style="color:${t.text};">Tieu de <span class="th-hl" style="color:${t.hl};">noi bat</span></div>
 <div class="th-bar" style="background:linear-gradient(90deg,${t.a2},${t.a1});"></div>
 <div class="th-sub" style="color:${t.muted};">phu de minh hoa</div></div>
 <div class="th-meta"><span class="th-name">${t.name}${t.style ? ` <span class="th-tag">DESIGN</span>` : ""}</span>
 <span class="th-dots"><i style="background:${t.a1}"></i><i style="background:${t.a2}"></i><i style="background:${t.a3}"></i></span></div></button>`;
}
const color = all.filter((t) => !t.style);
const styled = all.filter((t) => t.style);
fs.writeFileSync(
  path.join(ROOT, "public", "design-gallery.html"),
  `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>AutoVideo - Gallery mau</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@800;900&amp;family=Orbitron:wght@500;700;900&amp;family=Rubik:wght@500;700;900&amp;family=Playfair+Display:wght@500;700;900&amp;family=Bangers&amp;family=IBM+Plex+Mono:wght@400;600&amp;family=Inter:wght@400;600;800&amp;display=swap">
<link rel="stylesheet" href="style.css"></head>
<body style="padding:28px;max-width:1200px;margin:0 auto;">
<h1 style="font-size:22px;">🎬 AutoVideo - Gallery mau <span style="opacity:.6;font-size:14px;">(nhan = thien huong layout)</span></h1>
<h2 style="font-size:15px;margin-top:22px;opacity:.85;">✨ 10 Design Style</h2>
<div class="theme-grid">${styled.map(swatch).join("")}</div>
<h2 style="font-size:15px;margin-top:26px;opacity:.85;">🎨 10 Theme mau</h2>
<div class="theme-grid">${color.map(swatch).join("")}</div>
</body></html>`,
);

console.log(`Da dung lai: ${all.length * 2} trang mau + 2 demo + index + gallery. Pool anh: ${POOL.length}.`);
