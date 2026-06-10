let META = { vbee: { voices: [], configured: false }, openrouter: { configured: false }, music: [] };
let TASKS = [];

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
  return String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

// ---------- Option builders ----------
function refOptions(selected) {
  const list = META.vbee.voices.map((v) => ({ value: v.code, label: v.label || v.code }));
  if (!list.length) {
    return `<option value="">(thêm giọng Vbee)</option>`;
  }
  return list.map((o) => `<option value="${esc(o.value)}" ${o.value === selected ? "selected" : ""}>${esc(o.label)}</option>`).join("");
}
function firstRef() {
  const list = META.vbee.voices;
  return list.length ? list[0].code : "";
}
function musicOptions(selected) {
  const sel = selected || "random";
  let html = `<option value="random" ${sel === "random" ? "selected" : ""}>🎲 Ngẫu nhiên</option>`;
  html += META.music.map((m) => `<option value="${m.id}" ${m.id === sel ? "selected" : ""}>${esc(m.name)}</option>`).join("");
  return html;
}

const STATUS_LABEL = { idle: "Sẵn sàng", queued: "Trong hàng đợi", running: "Đang chạy", done: "Hoàn tất", error: "Lỗi" };

function renderTasks() {
  const tb = $("rows");
  if (!TASKS.length) {
    tb.innerHTML = `<tr><td colspan="9" style="text-align:center; color: var(--muted); padding: 30px;">Chưa có task nào.</td></tr>`;
    return;
  }
  tb.innerHTML = TASKS.map((t, i) => {
    const busy = t.status === "running" || t.status === "queued";
    const canRun = t.approved && !busy;
    const phase = t.status === "error" ? t.error : t.phase || STATUS_LABEL[t.status];
    const detail = t.detail ? `<span class="detail">${esc(t.detail)}</span>` : "";
    const resultInfo =
      t.status === "done" && t.result
        ? `<div class="hint" style="margin-top:4px;">⏱ ${t.result.duration}s · ${t.result.scenes} cảnh · ${esc(t.result.voice)} · ${esc(t.result.music)}</div>`
        : "";
    const aspectLabel = t.aspectRatio === "9:16" ? "9:16" : "16:9";
    return `<tr class="st-${t.status}" data-id="${t.id}">
      <td class="idx">${i + 1}</td>
      <td class="topic">${esc(t.topic) || "<i style='color:var(--muted)'>(không tên)</i>"}</td>
      <td>
        <span class="pill ${t.autogen ? "ai" : "no-ai"}" data-act="autogen" title="Bấm để đổi" style="margin-bottom:6px; display:inline-block;">${t.autogen ? "AI tự viết" : "Nội dung sẵn"}</span>
        <div class="content-cell">${esc(t.content) || (t.autogen ? "<i>AI sẽ viết từ chủ đề</i>" : "<i>-</i>")}</div>
      </td>
      <td><span class="pill ${t.approved ? "ok" : "no"}" data-act="toggle" title="Bấm để đổi">${t.approved ? "đã duyệt" : "chưa duyệt"}</span></td>
      <td><select data-act="vref" ${busy ? "disabled" : ""}>${refOptions(t.voiceRef)}</select></td>
      <td><select data-act="aspect" ${busy ? "disabled" : ""}>
        <option value="16:9" ${t.aspectRatio !== "9:16" ? "selected" : ""}>16:9</option>
        <option value="9:16" ${t.aspectRatio === "9:16" ? "selected" : ""}>9:16</option>
      </select></td>
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
    else if (act === "run") { await api("POST", `/api/tasks/${id}/run`); toast("Đã đưa vào hàng đợi"); }
    else if (act === "del") await api("DELETE", `/api/tasks/${id}`);
    else if (act === "view") openVideo(id, task.topic);
    else if (act === "download") {
      const a = document.createElement("a");
      a.href = `/api/video/${id}`;
      a.download = `${(task.topic || "video").replace(/[^\wÀ-ɏ]+/g, "-")}.mp4`;
      a.click();
    }
  } catch (err) { toast(err.message, true); }
});

$("rows").addEventListener("change", async (e) => {
  const tr = e.target.closest("tr[data-id]");
  if (!tr) return;
  const id = tr.dataset.id;
  const act = e.target.dataset.act;
  try {
    if (act === "vref") await api("PATCH", `/api/tasks/${id}`, { voiceRef: e.target.value });
    else if (act === "aspect") await api("PATCH", `/api/tasks/${id}`, { aspectRatio: e.target.value });
    else if (act === "music") await api("PATCH", `/api/tasks/${id}`, { music: e.target.value });
  } catch (err) { toast(err.message, true); }
});

// ---------- Add / upload / bulk ----------
$("btn-add").addEventListener("click", async () => {
  const topic = $("f-topic").value.trim();
  const content = $("f-content").value.trim();
  if (!topic && !content) return toast("Nhập chủ đề hoặc nội dung", true);
  try {
    await api("POST", "/api/tasks", {
      topic, content, approved: $("f-approved").checked, autogen: $("f-autogen").checked,
      voiceRef: $("f-vref").value, music: $("f-music").value, aspectRatio: $("f-aspect").value,
    });
    $("f-topic").value = ""; $("f-content").value = "";
    toast("Đã thêm task");
  } catch (err) { toast(err.message, true); }
});

$("btn-upload").addEventListener("click", async () => {
  const f = $("f-file").files[0];
  if (!f) return toast("Chọn file Excel/CSV", true);
  const fd = new FormData();
  fd.append("file", f);
  fd.append("voiceRef", $("f-vref").value);
  fd.append("music", $("f-music").value);
  fd.append("aspectRatio", $("f-aspect").value);
  try {
    const r = await api("POST", "/api/upload", fd, true);
    toast(`Đã nhập ${r.created} dòng`);
    $("f-file").value = "";
  } catch (err) { toast(err.message, true); }
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
    toast(`Đồng bộ xong: tải mới ${r.downloaded} file (tổng ${r.total} bản nhạc)${r.failed ? `, lỗi ${r.failed}` : ""}`);
  } catch (err) { toast(err.message, true); }
});

$("btn-bulk").addEventListener("click", async () => {
  const voiceRef = $("bulk-vref").value;
  const aspectRatio = $("bulk-aspect").value;
  const music = $("bulk-music").value;
  if (!voiceRef && !aspectRatio && !music) return toast("Chọn giọng/tỷ lệ/nhạc để áp dụng", true);
  try {
    const r = await api("POST", "/api/bulk", { voiceRef, aspectRatio, music, onlyApproved: $("bulk-approved-only").checked });
    toast(`Đã cập nhật ${r.updated} task`);
  } catch (err) { toast(err.message, true); }
});

$("btn-runall").addEventListener("click", async () => {
  try {
    const r = await api("POST", "/api/run-all");
    toast(r.enqueued ? `Đã xếp ${r.enqueued} task vào hàng đợi` : "Không có task đã duyệt nào để chạy", !r.enqueued);
  } catch (err) { toast(err.message, true); }
});

$("btn-clear").addEventListener("click", async () => {
  if (!confirm("Xoá tất cả task?")) return;
  try { const r = await api("POST", "/api/clear"); if (!r.ok) toast(r.error, true); } catch (err) { toast(err.message, true); }
});

// ---------- OpenRouter config ----------
$("btn-or-save").addEventListener("click", async () => {
  try {
    await api("POST", "/api/settings/openrouter", { apiKey: $("or-key").value, model: $("or-model").value });
    $("or-key").value = "";
    await refreshMeta();
    toast("Đã lưu cấu hình OpenRouter");
  } catch (err) { toast(err.message, true); }
});
$("btn-or-test").addEventListener("click", async () => {
  try {
    toast("Đang test OpenRouter… (gọi AI, chờ vài giây)");
    const r = await api("POST", "/api/openrouter/test", { model: $("or-model").value || undefined });
    toast(`✓ OpenRouter OK (${r.ms}ms · ${r.segments} đoạn · "${r.title}")`);
  } catch (err) { toast("OpenRouter lỗi: " + err.message, true); }
});

// ---------- Vbee config ----------
$("btn-vb-save").addEventListener("click", async () => {
  try {
    await api("POST", "/api/settings/vbee", {
      appId: $("vb-app").value, token: $("vb-token").value, baseUrl: $("vb-base").value,
    });
    $("vb-token").value = "";
    await refreshMeta();
    toast("Đã lưu cấu hình Vbee");
  } catch (err) { toast(err.message, true); }
});

$("btn-vb-addvoice").addEventListener("click", async () => {
  const code = $("vb-new-code").value.trim();
  const label = $("vb-new-label").value.trim() || code;
  if (!code) return toast("Nhập voice_code", true);
  const voices = [...META.vbee.voices, { code, label }];
  try {
    await api("POST", "/api/settings/vbee/voices", { voices });
    $("vb-new-code").value = ""; $("vb-new-label").value = "";
    await refreshMeta();
    toast("Đã thêm giọng Vbee");
  } catch (err) { toast(err.message, true); }
});

$("btn-vb-test").addEventListener("click", async () => {
  const voiceCode = $("vb-test-voice").value;
  if (!voiceCode) return toast("Chọn giọng để test", true);
  try {
    toast("Đang test Vbee… (gọi API)");
    const r = await api("POST", "/api/vbee/test", { voiceCode });
    toast(`✓ Vbee OK (${r.ms}ms, ${r.size} bytes)`);
  } catch (err) { toast("Vbee lỗi: " + err.message, true); }
});

$("vb-voices").addEventListener("click", async (e) => {
  if (e.target.dataset.del === undefined) return;
  const code = e.target.dataset.del;
  const voices = META.vbee.voices.filter((v) => v.code !== code);
  try { await api("POST", "/api/settings/vbee/voices", { voices }); await refreshMeta(); } catch (err) { toast(err.message, true); }
});

// ---------- Modal ----------
function openVideo(id, title) {
  $("modal-title").textContent = "Xem: " + (title || "video");
  const v = $("modal-video");
  v.src = `/api/video/${id}?t=${Date.now()}`;
  $("modal").classList.add("show");
  v.play().catch(() => {});
}
$("modal-close").addEventListener("click", () => { $("modal").classList.remove("show"); $("modal-video").pause(); });
$("modal").addEventListener("click", (e) => { if (e.target.id === "modal") $("modal-close").click(); });

// ---------- Render config ----------
function renderConfig() {
  // OpenRouter
  $("or-model").value = META.openrouter?.model || "openai/gpt-4o-mini";
  $("or-status").innerHTML = META.openrouter?.configured
    ? '<span style="color:var(--green)">● đã cấu hình</span>'
    : '<span style="color:var(--red)">● chưa cấu hình</span>';
  // Vbee
  $("vb-app").value = META.vbee.appId || "";
  $("vb-base").value = META.vbee.baseUrl || "";
  $("vb-status").innerHTML = META.vbee.configured
    ? '<span style="color:var(--green)">● đã cấu hình</span>'
    : '<span style="color:var(--red)">● chưa cấu hình</span>';
  $("vb-voices").innerHTML = META.vbee.voices
    .map((v) => `<div class="tagitem"><div><b>${esc(v.label || v.code)}</b><br><span class="code">${esc(v.code)}</span></div><button class="ghost danger" data-del="${esc(v.code)}">✕</button></div>`)
    .join("");
  $("vb-test-voice").innerHTML = META.vbee.voices.length
    ? META.vbee.voices.map((v) => `<option value="${esc(v.code)}">${esc(v.label || v.code)}</option>`).join("")
    : `<option value="">(chưa có giọng)</option>`;
  // Danh sách nhạc (xoá được)
  $("music-list").innerHTML = (META.music || [])
    .map((m) => `<div class="tagitem"><div><b>${esc(m.name)}</b></div><button class="ghost danger" data-del="${esc(m.id)}">✕</button></div>`)
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
  $("bulk-vref").innerHTML = `<option value="">- Giọng -</option>` + META.vbee.voices.map((v) => `<option value="${esc(v.code)}">${esc(v.label || v.code)}</option>`).join("");
  $("bulk-music").innerHTML = `<option value="">- Nhạc -</option>` + musicOptions("__none__").replace('value="random"', 'value="random"');
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
    $("q-conc").textContent = META.queue?.concurrency ?? 2;
    renderConfig();
    fillFormSelects();
  } catch (err) { toast("Không tải được cấu hình: " + err.message, true); }

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
