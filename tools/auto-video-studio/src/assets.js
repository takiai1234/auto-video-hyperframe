// MODULE A - Lấy LOGO / BRAND / SCREENSHOT tự động cho các layout "khoe app/brand".
// Chạy ở PRE-PASS (gọi từ pipeline.js, cạnh resolveSceneImages) - KHÔNG fetch lúc render.
// Mọi asset được tải về workdir/task-*/assets/ và tham chiếu local; lỗi mạng -> degrade
// về monogram/skeleton, KHÔNG làm hỏng render.
//
//   A1. Logo thương hiệu phổ biến  -> npm "simple-icons" (inline SVG, offline, xác định)
//   A2. Logo công ty theo domain    -> clearbit / google favicon / duckduckgo (tải file)
//   A3. Fallback monogram           -> badge tròn chữ cái đầu (luôn chạy, kể cả offline)
//   A4. Screenshot app/web          -> puppeteer (best-effort; thiếu puppeteer -> bỏ qua)
//   A5. resolveSceneAssets()        -> quét scenes, gắn _brandLogo/_logos/_shotFile...
import fs from "node:fs";
import path from "node:path";

const UA = "AutoVideoStudio/1.0 (hyperframes; educational use)";
const TIMEOUT = 12000;
const MAX_LOGOS = Number(process.env.MAX_LOGOS || 6);

function esc(s) {
  return String(s == null ? "" : s).replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );
}

function withTimeout(ms = TIMEOUT) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(id) };
}

// ============================ A1 - Simple Icons (inline SVG) ============================
// Nạp 1 lần, lười (lazy). Thiếu package -> null -> tự rơi xuống A2/A3.
let _si = null;
let _siTried = false;
async function loadSimpleIcons() {
  if (_siTried) return _si;
  _siTried = true;
  try {
    _si = await import("simple-icons");
  } catch {
    _si = null;
  }
  return _si;
}

// slug "googlechrome" -> tên export "siGooglechrome".
function exportName(slug) {
  const s = String(slug || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!s) return "";
  return "si" + s.charAt(0).toUpperCase() + s.slice(1);
}

// Trả {title, hex, path} của 1 brand trong Simple Icons, hoặc null.
export async function simpleIcon(slug) {
  const si = await loadSimpleIcons();
  if (!si || !slug) return null;
  const icon = si[exportName(slug)];
  if (!icon || !icon.path) return null;
  return { title: icon.title, hex: "#" + icon.hex, path: icon.path };
}

// SVG inline; fill = currentColor để khung bọc tự đặt màu.
function iconSvgMarkup(icon) {
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor" role="img" aria-label="${esc(icon.title)}"><path d="${icon.path}"/></svg>`;
}

// ============================ A3 - Màu brand xác định theo tên ============================
// Hash tên -> HSL ổn định (cùng tên luôn ra cùng màu) cho monogram khi không có brand color.
function colorFromName(name) {
  const s = String(name || "?");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return `hsl(${h} 70% 55%)`;
}

// Badge monogram: chữ cái đầu trên nền brand-color. KHÔNG tải gì - luôn chạy offline.
function monogramInner(name) {
  const ch = (String(name || "?").trim()[0] || "?").toUpperCase();
  return esc(ch);
}

// ============================ A2 - Logo theo domain (tải file) ============================
function candidates(domain) {
  const d = String(domain || "").trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return [
    `https://logo.clearbit.com/${d}`,
    `https://www.google.com/s2/favicons?domain=${d}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${d}.ico`,
  ];
}

function extFromType(ct) {
  if (/png/.test(ct)) return "png";
  if (/svg/.test(ct)) return "svg";
  if (/webp/.test(ct)) return "webp";
  if (/x-icon|vnd\.microsoft\.icon|\.ico/.test(ct)) return "ico";
  if (/gif/.test(ct)) return "gif";
  return "png";
}

// Tải 1 URL ảnh về destNoExt.<ext> nếu là ảnh hợp lệ. Trả đường dẫn file hoặc null.
async function downloadImage(url, destNoExt) {
  const t = withTimeout();
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal: t.signal });
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "";
    if (!/image\//.test(ct)) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 70 || buf.length > 6 * 1024 * 1024) return null;
    const dest = `${destNoExt}.${extFromType(ct)}`;
    fs.writeFileSync(dest, buf);
    return dest;
  } catch {
    return null;
  } finally {
    t.done();
  }
}

// Thử lần lượt clearbit -> favicon -> duckduckgo. Cái nào ra ảnh thì lấy.
async function fetchDomainLogo(domain, destDir, basename) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const url of candidates(domain)) {
    // eslint-disable-next-line no-await-in-loop
    const file = await downloadImage(url, path.join(destDir, basename));
    if (file) return file;
  }
  return null;
}

// Tải 1 ảnh từ URL bất kỳ (avatar/banner/ảnh sản phẩm người dùng cấp). Trả file hoặc null.
export async function fetchRemoteImage(url, destDir, basename) {
  if (!/^https?:\/\//.test(String(url || ""))) return null;
  fs.mkdirSync(destDir, { recursive: true });
  return downloadImage(url, path.join(destDir, basename));
}

// ============================ A4 - Screenshot app/web (puppeteer) ============================
// Best-effort: thiếu puppeteer / lỗi -> null -> khung device dựng skeleton.
let _pptr = null;
let _pptrTried = false;
async function loadPuppeteer() {
  if (_pptrTried) return _pptr;
  _pptrTried = true;
  try {
    _pptr = (await import("puppeteer")).default;
  } catch {
    try {
      _pptr = (await import("puppeteer-core")).default;
    } catch {
      _pptr = null;
    }
  }
  return _pptr;
}

export async function screenshot(url, destDir, basename, { w = 390, h = 844, scale = 2 } = {}) {
  if (process.env.DISABLE_SCREENSHOTS === "1") return null;
  if (!/^https?:\/\//.test(String(url || ""))) return null;
  const pptr = await loadPuppeteer();
  if (!pptr) return null;
  let browser = null;
  try {
    fs.mkdirSync(destDir, { recursive: true });
    browser = await pptr.launch({ headless: "new", args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: scale });
    await page.goto(url, { waitUntil: "networkidle2", timeout: TIMEOUT });
    const dest = path.join(destDir, `${basename}.png`);
    await page.screenshot({ path: dest });
    return dest;
  } catch {
    return null;
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        /* ignore */
      }
    }
  }
}

// ============================ resolveLogo - bộ giải 1 logo ============================
// spec: { brand?, domain?, name?, accent? }
// Trả { html, color, mono } - html là MARK bên trong (svg/img/chữ), khung .logo-badge bọc ngoài.
// destDir/basename chỉ dùng khi cần tải file (A2). relPrefix = tiền tố đường dẫn local cho <img>.
export async function resolveLogo(spec, ctx) {
  const { destDir, basename, relPrefix = "assets", cache } = ctx;
  const accent = spec.accent || null;
  const key = (spec.brand || spec.domain || spec.name || "").toLowerCase();

  if (cache && key && cache.has(key)) {
    const c = cache.get(key);
    return accent ? { ...c, color: accent } : c;
  }

  let out = null;

  // 1) Simple Icons (ưu tiên: inline, offline, xác định 100%)
  if (!out && spec.brand && process.env.DISABLE_BRAND_LOGOS !== "1") {
    const icon = await simpleIcon(spec.brand);
    if (icon) out = { html: iconSvgMarkup(icon), color: accent || icon.hex, mono: false, title: icon.title };
  }

  // 2) Logo theo domain (tải file: clearbit/favicon/duckduckgo)
  if (!out && spec.domain && process.env.DISABLE_BRAND_LOGOS !== "1") {
    const file = await fetchDomainLogo(spec.domain, destDir, basename);
    if (file) {
      const rel = `${relPrefix}/${path.basename(file)}`;
      out = { html: `<img src="${esc(rel)}" alt="" />`, color: accent || colorFromName(spec.domain), mono: false, title: spec.domain };
    }
  }

  // 3) Monogram (luôn chạy)
  if (!out) {
    const nm = spec.name || spec.brand || spec.domain || "?";
    out = { html: monogramInner(nm), color: accent || colorFromName(nm), mono: true, title: nm };
  }

  if (cache && key) cache.set(key, out);
  return out;
}

// ============================ A5 - resolveSceneAssets (pre-pass) ============================
// Quét MỌI scene; với layout/field cần logo/screenshot -> tải về assets/ và gắn vào scene.
// Best-effort theo từng scene; lỗi -> bỏ qua, layout tự degrade ở composition.
export async function resolveSceneAssets(scenes, dir, progress = () => {}) {
  if (!Array.isArray(scenes) || !scenes.length) return;
  const destDir = path.join(dir, "assets");
  const cache = new Map();
  let count = 0;
  const ctxBase = { destDir, relPrefix: "assets", cache };

  // Chỉ tốn "ngân sách logo" cho brand/domain THẬT (slug/tên miền). "name" đơn thuần
  // KHÔNG kích hoạt tải logo - tránh sinh monogram tràn lan, để dành budget cho logo thật.
  const wantLogo = (sp) => sp && (sp.brand || sp.domain);

  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    if (!s || typeof s !== "object") continue;
    try {
      progress({ phase: "Lấy logo/brand", percent: 5, detail: `Cảnh ${i + 1}/${scenes.length}` });

      // (a) logo brand chính của cảnh: scene.brand / scene.domain
      if (wantLogo(s) && count < MAX_LOGOS) {
        // eslint-disable-next-line no-await-in-loop
        s._brandLogo = await resolveLogo(s, { ...ctxBase, basename: `s${i}_brand` });
        count++;
      }

      // (b) danh sách logo: scene.logos[]
      if (Array.isArray(s.logos) && s.logos.length) {
        const list = [];
        for (let k = 0; k < s.logos.length && count < MAX_LOGOS; k++) {
          const spec = s.logos[k] || {};
          // eslint-disable-next-line no-await-in-loop
          list.push(await resolveLogo(spec, { ...ctxBase, basename: `s${i}_logo${k}` }));
          count++;
        }
        s._logos = list;
      }

      // (c) brand-stat: từng item có brand/domain -> item._logo
      if (s.layout === "brand-stat" && Array.isArray(s.items)) {
        for (let k = 0; k < s.items.length; k++) {
          const it = s.items[k];
          if (wantLogo(it) && count < MAX_LOGOS) {
            // eslint-disable-next-line no-await-in-loop
            it._logo = await resolveLogo(it, { ...ctxBase, basename: `s${i}_stat${k}` });
            count++;
          }
        }
      }

      // (d) app-hero / icon-row: item/scene brand icon (tuỳ chọn)
      if ((s.layout === "icon-row" || s.layout === "segment-compare") && Array.isArray(s.items)) {
        for (let k = 0; k < s.items.length; k++) {
          const it = s.items[k];
          if (wantLogo(it) && count < MAX_LOGOS) {
            // eslint-disable-next-line no-await-in-loop
            it._logo = await resolveLogo(it, { ...ctxBase, basename: `s${i}_it${k}` });
            count++;
          }
        }
      }

      // (e) social-card: tải avatar/banner nếu là URL
      if (s.layout === "social-card" && s.social && typeof s.social === "object") {
        const soc = s.social;
        if (/^https?:\/\//.test(String(soc.avatar || ""))) {
          // eslint-disable-next-line no-await-in-loop
          const f = await fetchRemoteImage(soc.avatar, destDir, `s${i}_av`);
          if (f) soc._avatarFile = `assets/${path.basename(f)}`;
        }
        if (/^https?:\/\//.test(String(soc.banner || ""))) {
          // eslint-disable-next-line no-await-in-loop
          const f = await fetchRemoteImage(soc.banner, destDir, `s${i}_bn`);
          if (f) soc._bannerFile = `assets/${path.basename(f)}`;
        }
      }

      // (f) device: chụp screenshot URL (best-effort) hoặc tải ảnh shot người dùng cấp
      if (s.layout === "device" && s.device && typeof s.device === "object") {
        const dev = s.device;
        const shotUrl = dev.shotUrl || dev.shot;
        if (/^https?:\/\//.test(String(shotUrl || ""))) {
          // eslint-disable-next-line no-await-in-loop
          let f = await fetchRemoteImage(shotUrl, destDir, `s${i}_shot`);
          if (!f) {
            // eslint-disable-next-line no-await-in-loop
            f = await screenshot(shotUrl, destDir, `s${i}_shot`);
          }
          if (f) dev._shotFile = `assets/${path.basename(f)}`;
        }
      }
    } catch {
      // bỏ qua scene lỗi - composition tự dựng monogram/skeleton
    }
  }
}
