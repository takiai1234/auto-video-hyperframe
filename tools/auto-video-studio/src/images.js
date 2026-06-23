// Tìm & tải ẢNH THẬT trên mạng theo chủ đề/ý của cảnh, để video trực quan hơn.
// Nguồn MIỄN PHÍ, KHÔNG cần API key:
//   1) Openverse  - ảnh Creative Commons (ưu tiên)
//   2) Wikimedia Commons - fallback
// Mọi lỗi mạng/parse đều trả null -> pipeline tự bỏ ảnh, không làm hỏng video.
import fs from "node:fs";
import path from "node:path";

const UA = "AutoVideoStudio/1.0 (hyperframes; educational use)";
const TIMEOUT = 12000;

function withTimeout() {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), TIMEOUT);
  return { signal: ctrl.signal, done: () => clearTimeout(id) };
}

async function getJson(url) {
  const t = withTimeout();
  try {
    const r = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: t.signal,
    });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  } finally {
    t.done();
  }
}

// Openverse: ảnh CC, không key.
async function searchOpenverse(query) {
  const u = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=6&mature=false`;
  const j = await getJson(u);
  for (const it of j?.results || []) {
    const url = it.url || it.thumbnail;
    if (url)
      return {
        url,
        thumb: it.thumbnail || url,
        source: "Openverse",
        author: it.creator || "",
        license: String(it.license || "").toUpperCase(),
        title: it.title || "",
      };
  }
  return null;
}

// Wikimedia Commons: fallback (tìm trong namespace File).
async function searchWikimedia(query) {
  const u =
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search` +
    `&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=5` +
    `&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1280&format=json&origin=*`;
  const j = await getJson(u);
  const pages = j?.query?.pages ? Object.values(j.query.pages) : [];
  for (const p of pages) {
    const ii = p.imageinfo?.[0];
    const url = ii?.thumburl || ii?.url;
    if (url && /\.(jpe?g|png|webp)(\?|$)/i.test(url))
      return { url, thumb: url, source: "Wikimedia", author: "", license: "", title: p.title || "" };
  }
  return null;
}

// Tìm 1 ảnh phù hợp (thử Openverse rồi Wikimedia).
export async function searchImage(query) {
  const q = String(query || "").trim();
  if (!q) return null;
  return (await searchOpenverse(q)) || (await searchWikimedia(q)) || null;
}

async function download(url, destNoExt) {
  const t = withTimeout();
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal: t.signal });
    if (!r.ok) return null;
    const ct = r.headers.get("content-type") || "";
    if (!/image\//.test(ct)) return null;
    const ext = ct.includes("png")
      ? "png"
      : ct.includes("webp")
        ? "webp"
        : ct.includes("gif")
          ? "gif"
          : "jpg";
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 1200 || buf.length > 12 * 1024 * 1024) return null; // bỏ ảnh hỏng/quá nặng
    const dest = `${destNoExt}.${ext}`;
    fs.writeFileSync(dest, buf);
    return dest;
  } catch {
    return null;
  } finally {
    t.done();
  }
}

/**
 * Tìm + tải ảnh về thư mục. Trả {file, name, source, author, license, title} hoặc null.
 * @param {string} query  từ khoá (nên TIẾNG ANH để khớp ảnh tốt hơn)
 * @param {string} destDir thư mục lưu
 * @param {string} basename tên file (không đuôi)
 */
export async function fetchImage(query, destDir, basename) {
  const meta = await searchImage(query);
  if (!meta) return null;
  fs.mkdirSync(destDir, { recursive: true });
  const file =
    (await download(meta.url, path.join(destDir, basename))) ||
    (meta.thumb && meta.thumb !== meta.url
      ? await download(meta.thumb, path.join(destDir, basename))
      : null);
  if (!file) return null;
  return {
    file,
    name: path.basename(file),
    source: meta.source,
    author: meta.author,
    license: meta.license,
    title: meta.title,
  };
}

// Dòng ghi nguồn ngắn gọn cho góc khung (tôn trọng giấy phép CC).
export function creditLine(meta) {
  if (!meta) return "";
  const bits = [];
  if (meta.author) bits.push(meta.author);
  bits.push(meta.source);
  if (meta.license) bits.push(meta.license);
  return bits.filter(Boolean).join(" · ");
}
