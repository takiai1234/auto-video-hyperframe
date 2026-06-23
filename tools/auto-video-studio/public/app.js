let META = {
  vbee: { voices: [], configured: false },
  openrouter: { configured: false },
  prompts: { system: "", userTemplate: "", isDefault: true },
  heygen: { configured: false, avatarId: "" },
  music: [],
  themes: [],
  fonts: [],
};
let TASKS = [];
let selectedTheme = "midnight"; // mẫu đang chọn ở ô "Thêm task"
let selectedFont = "auto"; // phông chữ đang chọn ở ô "Thêm task" (auto = theo mẫu)

const $ = (id) => document.getElementById(id);

function toast(msg, isErr = false) {
  const t = $("toast");
  t.textContent = msg;
  t.className = "show" + (isErr ? " err" : "");
  setTimeout(() => (t.className = ""), 3600);
}

async function api(method, url, body, isForm = false) {
  const opt = { method };
  if (body && !isForm) {
    opt.headers = { "Content-Type": "application/json" };
    opt.body = JSON.stringify(body);
  } else if (isForm) opt.body = body;
  const res = await fetch(url, opt);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Lỗi ${res.status}`);
  return data;
}

function esc(s) {
  return String(s || "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );
}

// ---------- Option builders ----------
function refOptions(selected) {
  const list = META.vbee.voices.map((v) => ({ value: v.code, label: v.label || v.code }));
  if (!list.length) {
    return `<option value="">(thêm giọng Vbee)</option>`;
  }
  return list
    .map(
      (o) =>
        `<option value="${esc(o.value)}" ${o.value === selected ? "selected" : ""}>${esc(o.label)}</option>`,
    )
    .join("");
}
function musicOptions(selected) {
  const sel = selected || "random";
  let html = `<option value="random" ${sel === "random" ? "selected" : ""}>🎲 Ngẫu nhiên</option>`;
  html += META.music
    .map((m) => `<option value="${m.id}" ${m.id === sel ? "selected" : ""}>${esc(m.name)}</option>`)
    .join("");
  return html;
}

// ---------- Mẫu giao diện (theme) ----------
function themeById(id) {
  return (META.themes || []).find((t) => t.id === id) || (META.themes || [])[0];
}
// Nền preview mô phỏng đúng "khí chất" của từng design style.
function previewBg(t) {
  switch (t.style) {
    case "vaporwave":
      return "linear-gradient(180deg,#2a0b4d,#7a1f8c 50%,#ff5fa2 78%,#ffb86b)";
    case "aurora-mesh":
      return "radial-gradient(55% 60% at 15% 20%,rgba(124,139,255,.75),transparent 70%),radial-gradient(55% 60% at 85% 25%,rgba(255,122,198,.65),transparent 70%),radial-gradient(60% 65% at 70% 88%,rgba(33,212,197,.6),transparent 70%),#070a18";
    case "frost-glass":
      return "radial-gradient(circle at 20% 28%,#5ad1ff,transparent 52%),radial-gradient(circle at 82% 24%,#b07bff,transparent 52%),radial-gradient(circle at 60% 84%,#ff8fd0,transparent 52%),#0c1430";
    case "y2k-aero":
      return "radial-gradient(120% 95% at 50% 0%,#f0faff,#cfeaff 55%,#a9d8ff)";
    case "neon-glow":
      return "#03040a";
    case "blueprint":
      return "#0a1b2e";
    default:
      return `radial-gradient(120% 80% at 50% 28%, ${t.glow}, transparent 60%), ${t.bg}`;
  }
}
// Ảnh preview mini (mô phỏng đúng 1 slide) dựng bằng CSS từ bảng màu + phong cách của design.
function themeSwatch(t) {
  const cls = t.style ? `s-${t.style}` : "";
  const vars =
    `--p-bg:${t.bg};--p-panel:${t.panel};--p-panel2:${t.panel2 || t.panel};--p-line:${t.line};` +
    `--p-text:${t.text};--p-muted:${t.muted};--p-a1:${t.a1};--p-a2:${t.a2};--p-a3:${t.a3};--p-hl:${t.hl};`;
  // .th-screen = ảnh tĩnh (poster + fallback). .th-live = iframe composition THẬT,
  // tự chạy lặp, nạp lười theo viewport -> thấy được transition + chữ + nhịp của mẫu.
  return `<div class="th-screen ${cls}" style="${vars}background:${previewBg(t)}; font-family:${t.font};">
      <div class="th-pill" style="background:${t.panel}; border:1px solid ${t.line}; color:${t.a1};">● Chủ đề</div>
      <div class="th-title" style="color:${t.text};">Tiêu đề <span class="th-hl" style="color:${t.hl};">nổi bật</span></div>
      <div class="th-bar" style="background:linear-gradient(90deg, ${t.a2}, ${t.a1});"></div>
      <div class="th-sub" style="color:${t.muted};">phụ đề minh hoạ</div>
      <div class="th-live" data-live="/live-preview/${encodeURIComponent(t.id)}-wide.html"></div>
    </div>`;
}
function renderThemeGrid() {
  const grid = $("theme-grid");
  if (!grid) return;
  const themes = META.themes || [];
  if (themes.length && !themes.some((t) => t.id === selectedTheme)) selectedTheme = themes[0].id;
  grid.innerHTML = themes
    .map(
      (t) =>
        `<button type="button" class="th-card ${t.id === selectedTheme ? "sel" : ""}" data-theme="${esc(t.id)}" title="${esc(t.desc || t.name)}">
          ${themeSwatch(t)}
          <div class="th-meta"><span class="th-name">${esc(t.name)}${t.style ? ` <span class="th-tag">DESIGN</span>` : ""}</span>
            <span class="th-dots"><i style="background:${t.a1}"></i><i style="background:${t.a2}"></i><i style="background:${t.a3}"></i></span>
          </div>
        </button>`,
    )
    .join("");
  setupLivePreviews();
}
// ----- Preview ĐỘNG trong từng ô gallery (nhúng trang composition thật, tự loop) -----
// Nạp lười theo viewport để 20 ô không giật; tôn trọng prefers-reduced-motion.
let liveObserver = null;
function scaleLive(card) {
  const screen = card.querySelector(".th-screen");
  const f = card.querySelector(".th-live iframe");
  if (!screen || !f) return;
  const W = 1920;
  const H = 1080;
  const s = screen.clientWidth / W;
  f.style.width = W + "px";
  f.style.height = H + "px";
  f.style.transformOrigin = "top left";
  f.style.transform = "scale(" + s + ")";
  f.style.left = "0px";
  f.style.top = (screen.clientHeight - H * s) / 2 + "px";
}
function mountLive(card) {
  const live = card.querySelector(".th-live");
  if (!live || live.dataset.mounted || !live.dataset.live) return;
  live.dataset.mounted = "1";
  const f = document.createElement("iframe");
  f.setAttribute("scrolling", "no");
  f.loading = "lazy";
  f.tabIndex = -1;
  f.onload = () => {
    scaleLive(card);
    live.classList.add("on");
  };
  f.src = live.dataset.live;
  live.appendChild(f);
}
function unmountLive(card) {
  const live = card.querySelector(".th-live");
  if (!live || !live.dataset.mounted) return;
  delete live.dataset.mounted;
  live.classList.remove("on");
  live.innerHTML = "";
}
function setupLivePreviews() {
  // Người dùng tắt chuyển động -> giữ ảnh tĩnh, không nhúng iframe.
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (liveObserver) liveObserver.disconnect();
  liveObserver = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (en.isIntersecting) mountLive(en.target);
        else unmountLive(en.target);
      }
    },
    { rootMargin: "140px" },
  );
  document.querySelectorAll("#theme-grid .th-card").forEach((c) => liveObserver.observe(c));
}
function themeOptions(selected) {
  const sel = selected || "midnight";
  const opts = (META.themes || [])
    .map((t) => `<option value="${esc(t.id)}" ${t.id === sel ? "selected" : ""}>${esc(t.name)}</option>`)
    .join("");
  return opts || `<option value="midnight">Midnight</option>`;
}

// ----- Phông chữ -----
function fontOptions(selected) {
  const sel = selected || "auto";
  const list = META.fonts && META.fonts.length ? META.fonts : [{ id: "auto", name: "Theo mẫu" }];
  return list
    .map((f) => `<option value="${esc(f.id)}" ${f.id === sel ? "selected" : ""}>${esc(f.name)}</option>`)
    .join("");
}
function fontById(id) {
  return (META.fonts || []).find((f) => f.id === id) || null;
}
// Nạp Google Font (1 lần / family) để preview hiển thị đúng nét chữ.
const loadedFontLinks = new Set();
function ensureFontLink(id) {
  const f = fontById(id);
  if (!f || id === "auto") return;
  // Suy ra link Google Fonts từ tên family đầu tiên.
  const fam = (f.family || "").split(",")[0].replace(/"/g, "").trim();
  if (!fam || loadedFontLinks.has(fam)) return;
  loadedFontLinks.add(fam);
  const l = document.createElement("link");
  l.rel = "stylesheet";
  l.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fam).replace(/%20/g, "+")}:wght@400;600;700;800;900&display=swap`;
  document.head.appendChild(l);
}
// Cập nhật ô xem trước phông chữ theo lựa chọn hiện tại.
function updateFontPreview(id) {
  const box = $("font-preview");
  if (!box) return;
  ensureFontLink(id);
  const f = fontById(id);
  // auto: dùng font của mẫu đang chọn (lấy từ theme), ngược lại dùng font đã chọn.
  const themeFam = (themeById(selectedTheme) || {}).font || "Inter, sans-serif";
  box.style.fontFamily = id === "auto" || !f || !f.family ? themeFam : f.family;
}

const STATUS_LABEL = {
  idle: "Sẵn sàng",
  queued: "Trong hàng đợi",
  running: "Đang chạy",
  done: "Hoàn tất",
  error: "Lỗi",
};

function renderTasks() {
  const tb = $("rows");
  if (!TASKS.length) {
    tb.innerHTML = `<tr><td colspan="11" style="text-align:center; color: var(--muted); padding: 30px;">Chưa có task nào.</td></tr>`;
    return;
  }
  tb.innerHTML = TASKS.map((t, i) => {
    const busy = t.status === "running" || t.status === "queued";
    const canRun = t.approved && !busy;
    const phase = t.status === "error" ? t.error : t.phase || STATUS_LABEL[t.status];
    const detail = t.detail ? `<span class="detail">${esc(t.detail)}</span>` : "";
    const heygen = t.mode === "heygen";
    const resultInfo =
      t.status === "done" && t.result
        ? `<div class="hint" style="margin-top:4px;">⏱ ${t.result.duration}s · ${t.result.scenes} cảnh · ${esc(t.result.voice)} · ${esc(t.result.music)}${t.result.avatar ? ` · 🧑 ${esc(String(t.result.avatar).slice(0, 8))}…` : ""}</div>`
        : "";
    return `<tr class="st-${t.status}" data-id="${t.id}">
      <td class="idx">${i + 1}</td>
      <td class="topic">${esc(t.topic) || "<i style='color:var(--muted)'>(không tên)</i>"}</td>
      <td>
        <span class="pill ${t.autogen ? "ai" : "no-ai"}" data-act="autogen" title="Bấm để đổi" style="margin-bottom:6px; display:inline-block;">${t.autogen ? "AI tự viết" : "Nội dung sẵn"}</span>
        <div class="content-cell">${esc(t.content) || (t.autogen ? "<i>AI sẽ viết từ chủ đề</i>" : "<i>-</i>")}</div>
      </td>
      <td><span class="pill ${t.approved ? "ok" : "no"}" data-act="toggle" title="Bấm để đổi">${t.approved ? "đã duyệt" : "chưa duyệt"}</span></td>
      <td><select data-act="mode" ${busy ? "disabled" : ""}>
        <option value="hyperframe" ${!heygen ? "selected" : ""}>Hyperframe</option>
        <option value="heygen" ${heygen ? "selected" : ""}>+ HeyGen</option>
      </select></td>
      <td><select data-act="vref" ${busy ? "disabled" : ""}>${refOptions(t.voiceRef)}</select></td>
      <td><select data-act="aspect" ${busy ? "disabled" : ""}>
        <option value="16:9" ${t.aspectRatio !== "9:16" ? "selected" : ""}>16:9</option>
        <option value="9:16" ${t.aspectRatio === "9:16" ? "selected" : ""}>9:16</option>
      </select></td>
      <td><select data-act="theme" ${busy ? "disabled" : ""}>${themeOptions(t.theme)}</select></td>
      <td><select data-act="font" ${busy ? "disabled" : ""}>${fontOptions(t.font)}</select></td>
      <td><select data-act="music" ${busy ? "disabled" : ""}>${musicOptions(t.music)}</select></td>
      <td class="status">
        <div class="phase"><span>${esc(phase)}</span>${detail}</div>
        <div class="bar"><div style="width:${t.percent || 0}%"></div></div>
        ${resultInfo}
      </td>
      <td><div class="actions">
        <button class="sm primary" data-act="run" ${canRun ? "" : "disabled"}>▶ Chạy</button>
        ${t.status === "done" ? `<button class="sm" data-act="view">Xem</button><button class="sm ghost" data-act="download">⬇</button>` : ""}
        <button class="sm ghost danger" data-act="del" ${busy ? "disabled" : ""}>✕</button>
      </div></td>
    </tr>`;
  }).join("");
}

// ---------- Table events ----------
$("rows").addEventListener("click", async (e) => {
  const tr = e.target.closest("tr[data-id]");
  if (!tr) return;
  const id = tr.dataset.id;
  const act = e.target.dataset.act;
  const task = TASKS.find((x) => x.id === id);
  try {
    if (act === "toggle") await api("PATCH", `/api/tasks/${id}`, { approved: !task.approved });
    else if (act === "autogen") await api("PATCH", `/api/tasks/${id}`, { autogen: !task.autogen });
    else if (act === "run") {
      await api("POST", `/api/tasks/${id}/run`);
      toast("Đã đưa vào hàng đợi");
    } else if (act === "del") await api("DELETE", `/api/tasks/${id}`);
    else if (act === "view") openVideo(id, task.topic);
    else if (act === "download") {
      const a = document.createElement("a");
      a.href = `/api/video/${id}`;
      a.download = `${(task.topic || "video").replace(/[^\wÀ-ɏ]+/g, "-")}.mp4`;
      a.click();
    }
  } catch (err) {
    toast(err.message, true);
  }
});

$("rows").addEventListener("change", async (e) => {
  const tr = e.target.closest("tr[data-id]");
  if (!tr) return;
  const id = tr.dataset.id;
  const act = e.target.dataset.act;
  try {
    if (act === "vref") await api("PATCH", `/api/tasks/${id}`, { voiceRef: e.target.value });
    else if (act === "aspect")
      await api("PATCH", `/api/tasks/${id}`, { aspectRatio: e.target.value });
    else if (act === "music") await api("PATCH", `/api/tasks/${id}`, { music: e.target.value });
    else if (act === "mode") await api("PATCH", `/api/tasks/${id}`, { mode: e.target.value });
    else if (act === "theme") await api("PATCH", `/api/tasks/${id}`, { theme: e.target.value });
    else if (act === "font") await api("PATCH", `/api/tasks/${id}`, { font: e.target.value });
  } catch (err) {
    toast(err.message, true);
  }
});

// ---------- Xem trước ĐỘNG mẫu (iframe /live-preview) ----------
let previewRatio = "wide";
let previewId = "midnight";
function fitPreview() {
  const wrap = $("tp-wrap");
  const f = $("tp-frame");
  if (!wrap || !f) return;
  const tall = previewRatio === "tall";
  const W = tall ? 1080 : 1920;
  const H = tall ? 1920 : 1080;
  f.style.width = W + "px";
  f.style.height = H + "px";
  const s = Math.min(wrap.clientWidth / W, wrap.clientHeight / H);
  f.style.transform = "scale(" + s + ")";
  f.style.left = (wrap.clientWidth - W * s) / 2 + "px";
}
function showThemePreview(id) {
  const t = themeById(id);
  if (!t || !$("tp-frame")) return;
  previewId = t.id;
  $("tp-name").textContent = t.name + (t.style ? " · format riêng" : "");
  const f = $("tp-frame");
  f.onload = fitPreview;
  f.src = `/live-preview/${encodeURIComponent(t.id)}-${previewRatio}.html`;
  requestAnimationFrame(fitPreview);
}

// Chọn mẫu giao diện ở ô "Thêm task" -> chọn + xem trước động
$("theme-grid").addEventListener("click", (e) => {
  const card = e.target.closest(".th-card");
  if (!card) return;
  selectedTheme = card.dataset.theme;
  // Chỉ đổi class .sel, KHÔNG dựng lại grid -> các preview động đang chạy không bị nạp lại.
  document.querySelectorAll("#theme-grid .th-card.sel").forEach((c) => c.classList.remove("sel"));
  card.classList.add("sel");
  showThemePreview(selectedTheme);
  updateFontPreview(selectedFont); // nếu font = auto, preview đổi theo font của mẫu mới
});

// Chọn phông chữ ở ô "Thêm task" -> cập nhật preview
$("font-pick").addEventListener("change", (e) => {
  selectedFont = e.target.value || "auto";
  updateFontPreview(selectedFont);
});

// Đổi tỷ lệ xem trước (16:9 / 9:16)
$("tp-ratio").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-ratio]");
  if (!b) return;
  previewRatio = b.dataset.ratio;
  $("tp-wrap").className = "tp-wrap " + previewRatio;
  [...$("tp-ratio").children].forEach((x) =>
    x.classList.toggle("ghost", x.dataset.ratio !== previewRatio),
  );
  showThemePreview(previewId);
});

// "Áp dụng cho tất cả": chọn mẫu trong dropdown -> cũng xem trước được
$("bulk-theme").addEventListener("change", (e) => {
  if (e.target.value) showThemePreview(e.target.value);
});
$("btn-bulk-preview").addEventListener("click", () => {
  showThemePreview($("bulk-theme").value || selectedTheme);
  $("theme-preview")?.scrollIntoView({ behavior: "smooth", block: "center" });
});
window.addEventListener("resize", () => {
  fitPreview();
  document
    .querySelectorAll("#theme-grid .th-card .th-live.on")
    .forEach((l) => scaleLive(l.closest(".th-card")));
});

// ---------- Add / upload / bulk ----------
async function addTaskFromForm(mode) {
  const topic = $("f-topic").value.trim();
  const content = $("f-content").value.trim();
  if (!topic && !content) return toast("Nhập chủ đề hoặc nội dung", true);
  if (mode === "heygen" && !META.heygen?.configured) {
    return toast("Cấu hình HeyGen (API key + avatar_id) trước khi tạo task HeyGen", true);
  }
  try {
    await api("POST", "/api/tasks", {
      topic,
      content,
      approved: $("f-approved").checked,
      autogen: $("f-autogen").checked,
      voiceRef: $("f-vref").value,
      music: $("f-music").value,
      aspectRatio: $("f-aspect").value,
      mode,
      theme: selectedTheme,
      font: selectedFont,
    });
    $("f-topic").value = "";
    $("f-content").value = "";
    toast(mode === "heygen" ? "Đã thêm task Hyperframe + HeyGen" : "Đã thêm task Hyperframe");
  } catch (err) {
    toast(err.message, true);
  }
}
$("btn-add").addEventListener("click", () => addTaskFromForm("hyperframe"));
$("btn-add-heygen").addEventListener("click", () => addTaskFromForm("heygen"));

$("btn-upload").addEventListener("click", async () => {
  const f = $("f-file").files[0];
  if (!f) return toast("Chọn file Excel/CSV", true);
  const fd = new FormData();
  fd.append("file", f);
  fd.append("voiceRef", $("f-vref").value);
  fd.append("music", $("f-music").value);
  fd.append("aspectRatio", $("f-aspect").value);
  fd.append("theme", selectedTheme);
  fd.append("font", selectedFont);
  try {
    const r = await api("POST", "/api/upload", fd, true);
    toast(`Đã nhập ${r.created} dòng`);
    $("f-file").value = "";
  } catch (err) {
    toast(err.message, true);
  }
});

$("btn-drive").addEventListener("click", async () => {
  const url = $("d-url").value.trim();
  const apiKey = $("d-key").value.trim();
  if (!url) return toast("Dán link folder Drive", true);
  if (!apiKey) return toast("Nhập Google Drive API key", true);
  try {
    toast("Đang đồng bộ nhạc từ Drive…");
    const r = await api("POST", "/api/drive/sync", { url, apiKey });
    await refreshMeta();
    toast(
      `Đồng bộ xong: tải mới ${r.downloaded} file (tổng ${r.total} bản nhạc)${r.failed ? `, lỗi ${r.failed}` : ""}`,
    );
  } catch (err) {
    toast(err.message, true);
  }
});

$("btn-bulk").addEventListener("click", async () => {
  const voiceRef = $("bulk-vref").value;
  const aspectRatio = $("bulk-aspect").value;
  const music = $("bulk-music").value;
  const mode = $("bulk-mode").value;
  const theme = $("bulk-theme").value;
  const font = $("bulk-font").value;
  if (!voiceRef && !aspectRatio && !music && !mode && !theme && !font)
    return toast("Chọn giọng/tỷ lệ/chế độ/mẫu/font/nhạc để áp dụng", true);
  if (mode === "heygen" && !META.heygen?.configured)
    return toast("Cấu hình HeyGen trước khi áp dụng chế độ HeyGen", true);
  try {
    const r = await api("POST", "/api/bulk", {
      voiceRef,
      aspectRatio,
      music,
      mode,
      theme,
      font,
      onlyApproved: $("bulk-approved-only").checked,
    });
    toast(`Đã cập nhật ${r.updated} task`);
  } catch (err) {
    toast(err.message, true);
  }
});

$("btn-runall").addEventListener("click", async () => {
  try {
    const r = await api("POST", "/api/run-all");
    toast(
      r.enqueued ? `Đã xếp ${r.enqueued} task vào hàng đợi` : "Không có task đã duyệt nào để chạy",
      !r.enqueued,
    );
  } catch (err) {
    toast(err.message, true);
  }
});

$("btn-clear").addEventListener("click", async () => {
  if (!confirm("Xoá tất cả task?")) return;
  try {
    const r = await api("POST", "/api/clear");
    if (!r.ok) toast(r.error, true);
  } catch (err) {
    toast(err.message, true);
  }
});

// Số luồng chạy song song (1-5)
$("sel-conc").addEventListener("change", async () => {
  try {
    const r = await api("POST", "/api/settings/concurrency", {
      value: Number($("sel-conc").value),
    });
    $("q-conc").textContent = r.concurrency;
    toast(`Chạy song song: ${r.concurrency} luồng`);
  } catch (err) {
    toast(err.message, true);
  }
});

// Tải tất cả video đã hoàn tất
$("btn-download-all").addEventListener("click", async () => {
  const done = TASKS.filter((t) => t.status === "done" && t.result);
  if (!done.length) return toast("Chưa có video hoàn tất nào để tải", true);
  toast(`Đang tải ${done.length} video...`);
  for (let i = 0; i < done.length; i++) {
    const t = done[i];
    const name = `${String(i + 1).padStart(2, "0")}-${(t.topic || "video").replace(/[^\wÀ-ɏ]+/g, "-")}.mp4`;
    const a = document.createElement("a");
    a.href = `/api/video/${t.id}`;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // chờ giữa các lần tải để trình duyệt không chặn tải hàng loạt
    await new Promise((r) => setTimeout(r, 700));
  }
});

$("btn-shutdown").addEventListener("click", async () => {
  if (!confirm("Tắt tool? Tool đang chạy ngầm sẽ dừng hẳn (lịch sử task vẫn được lưu).")) return;
  try {
    await api("POST", "/api/shutdown");
  } catch {}
  toast("Đã gửi lệnh tắt tool. Trang này sẽ ngừng cập nhật.");
  document.body.style.opacity = "0.5";
});

// ---------- OpenRouter config ----------
$("btn-or-save").addEventListener("click", async () => {
  try {
    await api("POST", "/api/settings/openrouter", {
      apiKey: $("or-key").value,
      model: $("or-model").value,
    });
    $("or-key").value = "";
    await refreshMeta();
    toast("Đã lưu cấu hình OpenRouter");
  } catch (err) {
    toast(err.message, true);
  }
});
$("btn-or-test").addEventListener("click", async () => {
  try {
    toast("Đang test OpenRouter… (gọi AI, chờ vài giây)");
    const r = await api("POST", "/api/openrouter/test", {
      model: $("or-model").value || undefined,
    });
    toast(`✓ OpenRouter OK (${r.ms}ms · ${r.scenes} cảnh · ${r.layouts} layout · "${r.title}")`);
  } catch (err) {
    toast("OpenRouter lỗi: " + err.message, true);
  }
});

// ---------- Prompt AI (sửa được) ----------
$("btn-pr-save").addEventListener("click", async () => {
  try {
    await api("POST", "/api/settings/prompts", {
      system: $("pr-system").value,
      userTemplate: $("pr-user").value,
    });
    await refreshMeta();
    toast("Đã lưu prompt AI");
  } catch (err) {
    toast(err.message, true);
  }
});
$("btn-pr-reset").addEventListener("click", async () => {
  if (!confirm("Khôi phục prompt về mặc định?")) return;
  try {
    await api("POST", "/api/settings/prompts/reset");
    await refreshMeta();
    toast("Đã khôi phục prompt mặc định");
  } catch (err) {
    toast(err.message, true);
  }
});

// ---------- HeyGen config ----------
$("btn-hg-save").addEventListener("click", async () => {
  try {
    await api("POST", "/api/settings/heygen", {
      apiKey: $("hg-key").value,
      avatarId: $("hg-avatar").value,
    });
    $("hg-key").value = "";
    await refreshMeta();
    toast("Đã lưu cấu hình HeyGen");
  } catch (err) {
    toast(err.message, true);
  }
});
$("btn-hg-test").addEventListener("click", async () => {
  try {
    toast("Đang test HeyGen…");
    const r = await api("POST", "/api/heygen/test");
    toast(`✓ HeyGen OK (${r.ms}ms · avatar: ${r.avatar})`);
  } catch (err) {
    toast("HeyGen lỗi: " + err.message, true);
  }
});

// ---------- Vbee config ----------
$("btn-vb-save").addEventListener("click", async () => {
  try {
    await api("POST", "/api/settings/vbee", {
      appId: $("vb-app").value,
      token: $("vb-token").value,
      baseUrl: $("vb-base").value,
    });
    $("vb-token").value = "";
    await refreshMeta();
    toast("Đã lưu cấu hình Vbee");
  } catch (err) {
    toast(err.message, true);
  }
});

$("btn-vb-addvoice").addEventListener("click", async () => {
  const code = $("vb-new-code").value.trim();
  const label = $("vb-new-label").value.trim() || code;
  if (!code) return toast("Nhập voice_code", true);
  const voices = [...META.vbee.voices, { code, label }];
  try {
    await api("POST", "/api/settings/vbee/voices", { voices });
    $("vb-new-code").value = "";
    $("vb-new-label").value = "";
    await refreshMeta();
    toast("Đã thêm giọng Vbee");
  } catch (err) {
    toast(err.message, true);
  }
});

$("btn-vb-test").addEventListener("click", async () => {
  const voiceCode = $("vb-test-voice").value;
  if (!voiceCode) return toast("Chọn giọng để test", true);
  try {
    toast("Đang test Vbee… (gọi API)");
    const r = await api("POST", "/api/vbee/test", { voiceCode });
    toast(`✓ Vbee OK (${r.ms}ms, ${r.size} bytes)`);
  } catch (err) {
    toast("Vbee lỗi: " + err.message, true);
  }
});

$("vb-voices").addEventListener("click", async (e) => {
  if (e.target.dataset.del === undefined) return;
  const code = e.target.dataset.del;
  const voices = META.vbee.voices.filter((v) => v.code !== code);
  try {
    await api("POST", "/api/settings/vbee/voices", { voices });
    await refreshMeta();
  } catch (err) {
    toast(err.message, true);
  }
});

// ---------- Modal ----------
function openVideo(id, title) {
  $("modal-title").textContent = "Xem: " + (title || "video");
  const v = $("modal-video");
  v.src = `/api/video/${id}?t=${Date.now()}`;
  $("modal").classList.add("show");
  v.play().catch(() => {});
}
$("modal-close").addEventListener("click", () => {
  $("modal").classList.remove("show");
  $("modal-video").pause();
});
$("modal").addEventListener("click", (e) => {
  if (e.target.id === "modal") $("modal-close").click();
});

// ---------- Popup Cấu hình (gộp tất cả mục) ----------
function openCfg() {
  $("cfg-modal").classList.add("show");
  setTimeout(() => $("cfg-search").focus(), 30);
}
function closeCfg() {
  $("cfg-modal").classList.remove("show");
}
$("btn-cfg").addEventListener("click", openCfg);
$("cfg-close").addEventListener("click", closeCfg);
$("cfg-modal").addEventListener("click", (e) => {
  if (e.target.id === "cfg-modal") closeCfg();
});
$("cfg-search").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  document.querySelectorAll("#cfg-modal .cfg-section").forEach((sec) => {
    const hay = ((sec.dataset.keys || "") + " " + sec.textContent).toLowerCase();
    sec.style.display = !q || hay.includes(q) ? "" : "none";
  });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeCfg();
});

// ---------- Render config ----------
function renderConfig() {
  // OpenRouter: chọn model trong dropdown. Nếu giá trị đã lưu nằm ngoài 3 lựa chọn
  // (vd model khác bạn từng nhập), thêm 1 option để không bị mất.
  const orSel = $("or-model");
  const mdl = META.openrouter?.model || "anthropic/claude-sonnet-4.6";
  if (orSel && orSel.tagName === "SELECT" && ![...orSel.options].some((o) => o.value === mdl)) {
    const o = document.createElement("option");
    o.value = mdl;
    o.textContent = mdl + " (tuỳ chỉnh)";
    orSel.appendChild(o);
  }
  orSel.value = mdl;
  $("or-status").innerHTML = META.openrouter?.configured
    ? '<span style="color:var(--green)">● đã cấu hình</span>'
    : '<span style="color:var(--red)">● chưa cấu hình</span>';
  // Prompt AI
  if (META.prompts) {
    $("pr-system").value = META.prompts.system || "";
    $("pr-user").value = META.prompts.userTemplate || "";
    $("pr-status").innerHTML = META.prompts.isDefault
      ? '<span style="color:var(--muted)">(mặc định)</span>'
      : '<span style="color:var(--amber)">(đã sửa)</span>';
  }
  // HeyGen
  $("hg-avatar").value = META.heygen?.avatarId || "";
  $("hg-status").innerHTML = META.heygen?.configured
    ? '<span style="color:var(--green)">● đã cấu hình</span>'
    : '<span style="color:var(--red)">● chưa cấu hình</span>';
  // Vbee
  $("vb-app").value = META.vbee.appId || "";
  $("vb-base").value = META.vbee.baseUrl || "";
  $("vb-status").innerHTML = META.vbee.configured
    ? '<span style="color:var(--green)">● đã cấu hình</span>'
    : '<span style="color:var(--red)">● chưa cấu hình</span>';
  $("vb-voices").innerHTML = META.vbee.voices
    .map(
      (v) =>
        `<div class="tagitem"><div><b>${esc(v.label || v.code)}</b><br><span class="code">${esc(v.code)}</span></div><button class="ghost danger" data-del="${esc(v.code)}">✕</button></div>`,
    )
    .join("");
  $("vb-test-voice").innerHTML = META.vbee.voices.length
    ? META.vbee.voices
        .map((v) => `<option value="${esc(v.code)}">${esc(v.label || v.code)}</option>`)
        .join("")
    : `<option value="">(chưa có giọng)</option>`;
  // Danh sách nhạc (xoá được)
  $("music-list").innerHTML = (META.music || [])
    .map(
      (m) =>
        `<div class="tagitem"><div><b>${esc(m.name)}</b></div><button class="ghost danger" data-del="${esc(m.id)}">✕</button></div>`,
    )
    .join("");
  // Warn
  const noVoice = !META.vbee.configured;
  $("voice-warn").style.display = noVoice ? "block" : "none";
}

// Xoá 1 bản nhạc
$("music-list").addEventListener("click", async (e) => {
  if (e.target.dataset.del === undefined) return;
  if (!confirm("Xoá bản nhạc này?")) return;
  try {
    await api("DELETE", `/api/music/${encodeURIComponent(e.target.dataset.del)}`);
    await refreshMeta();
    toast("Đã xoá nhạc");
  } catch (err) {
    toast(err.message, true);
  }
});

function fillFormSelects() {
  $("f-vref").innerHTML = refOptions($("f-vref").value);
  $("f-music").innerHTML = musicOptions($("f-music").value);
  $("bulk-vref").innerHTML =
    `<option value="">- Giọng -</option>` +
    META.vbee.voices
      .map((v) => `<option value="${esc(v.code)}">${esc(v.label || v.code)}</option>`)
      .join("");
  $("bulk-music").innerHTML =
    `<option value="">- Nhạc -</option>` +
    musicOptions("__none__").replace('value="random"', 'value="random"');
  $("bulk-theme").innerHTML =
    `<option value="">- Mẫu -</option>` +
    (META.themes || [])
      .map((t) => `<option value="${esc(t.id)}">${esc(t.name)}</option>`)
      .join("");
  // Phông chữ: ô "Thêm task" + ô bulk.
  if (!(META.fonts || []).some((f) => f.id === selectedFont)) selectedFont = "auto";
  $("font-pick").innerHTML = fontOptions(selectedFont);
  $("bulk-font").innerHTML =
    `<option value="">- Font -</option>` +
    (META.fonts || [])
      .map((f) => `<option value="${esc(f.id)}">${esc(f.name)}</option>`)
      .join("");
  renderThemeGrid();
  showThemePreview(selectedTheme);
  updateFontPreview(selectedFont);
}

async function refreshMeta() {
  META = await api("GET", "/api/meta");
  renderConfig();
  fillFormSelects();
  renderTasks();
}

// ---------- Boot ----------
async function boot() {
  try {
    META = await api("GET", "/api/meta");
    const conc = META.queue?.concurrency ?? 2;
    $("q-conc").textContent = conc;
    $("sel-conc").value = String(conc);
    renderConfig();
    fillFormSelects();
  } catch (err) {
    toast("Không tải được cấu hình: " + err.message, true);
  }

  const es = new EventSource("/api/events");
  es.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      TASKS = data.tasks || [];
      if (data.queue) {
        $("q-running").textContent = data.queue.running;
        $("q-waiting").textContent = data.queue.waiting;
        $("q-conc").textContent = data.queue.concurrency;
      }
      renderTasks();
    } catch {}
  };
}
boot();
