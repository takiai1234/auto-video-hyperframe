// Kho task + hàng đợi chạy song song (mặc định 2 task / lúc).
// Lịch sử task được LƯU XUỐNG ĐĨA (data/tasks.json) -> còn nguyên khi tắt/mở lại tool.
// Tự động xoá task cũ hơn 7 ngày.
import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { produceVideo } from "./pipeline.js";
import { getConcurrency, setConcurrency as persistConcurrency } from "./settings.js";

export const events = new EventEmitter();
events.setMaxListeners(100);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "..", "data");
const TASKS_FILE = path.join(DATA_DIR, "tasks.json");
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày
fs.mkdirSync(DATA_DIR, { recursive: true });

const tasks = new Map();
let seq = 0;

let concurrency = getConcurrency(); // số luồng song song (1-5), đổi được lúc chạy
let running = 0;
const waiting = []; // id đang chờ chạy

export function setConcurrency(v) {
  concurrency = persistConcurrency(v); // clamp 1-5 + lưu xuống đĩa
  emit();
  pump(); // tăng luồng -> chạy thêm task đang chờ ngay
  return concurrency;
}

// ---- Lưu / nạp lịch sử ----
function purgeOld() {
  const cutoff = Date.now() - RETENTION_MS;
  let removed = 0;
  for (const [id, t] of tasks) {
    if ((t.createdAt || 0) < cutoff) {
      tasks.delete(id);
      removed++;
    }
  }
  return removed;
}

function loadTasks() {
  try {
    const arr = JSON.parse(fs.readFileSync(TASKS_FILE, "utf8"));
    if (!Array.isArray(arr)) return;
    for (const t of arr) {
      if (!t || !t.id) continue;
      // Task đang chạy/chờ lúc tool tắt -> coi như gián đoạn, đưa về idle để chạy lại.
      if (t.status === "running" || t.status === "queued") {
        t.status = "idle";
        t.phase = "";
        t.percent = 0;
        t.detail = "";
      }
      tasks.set(String(t.id), t);
      const n = Number(t.id);
      if (Number.isFinite(n) && n > seq) seq = n;
    }
    purgeOld();
  } catch {
    // chưa có file -> bỏ qua
  }
}

let persistTimer = null;
function writeTasksSync() {
  persistTimer = null;
  try {
    fs.writeFileSync(TASKS_FILE, JSON.stringify(Array.from(tasks.values()), null, 2), "utf8");
  } catch {}
}
function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(writeTasksSync, 1200);
}
// Ghi ngay (dùng khi tắt tool).
export function flushTasks() {
  if (persistTimer) clearTimeout(persistTimer);
  writeTasksSync();
}

loadTasks();
// Dọn lịch sử quá 7 ngày định kỳ (mỗi 6 giờ).
setInterval(
  () => {
    if (purgeOld() > 0) emit();
  },
  6 * 60 * 60 * 1000,
).unref();

function emit() {
  events.emit("update", listTasks());
  schedulePersist();
}

export function listTasks() {
  return Array.from(tasks.values()).map((t) => ({ ...t }));
}

export function getTask(id) {
  return tasks.get(id);
}

export function addTask({ topic, content, approved, voiceRef, music, autogen, aspectRatio, mode }) {
  const id = String(++seq);
  const c = (content || "").trim();
  const t = {
    id,
    topic: (topic || "").trim(),
    content: c,
    approved: normalizeApproved(approved),
    autogen: typeof autogen === "boolean" ? autogen : !c, // chỉ có chủ đề -> tự sinh nội dung AI
    voiceRef: voiceRef || "",
    music: music || "random",
    aspectRatio: aspectRatio || "16:9",
    mode: mode === "heygen" ? "heygen" : "hyperframe", // hyperframe | heygen (ghép avatar)
    status: "idle", // idle | queued | running | done | error
    phase: "",
    percent: 0,
    detail: "",
    error: "",
    result: null,
    createdAt: Date.now(),
  };
  tasks.set(id, t);
  emit();
  return t;
}

export function updateTask(id, patch) {
  const t = tasks.get(id);
  if (!t) return null;
  Object.assign(t, patch);
  emit();
  return t;
}

export function removeTask(id) {
  tasks.delete(id);
  emit();
}

export function clearTasks() {
  for (const t of tasks.values()) {
    if (t.status === "running" || t.status === "queued") return false; // không xoá khi đang chạy
  }
  tasks.clear();
  seq = 0;
  emit();
  flushTasks();
  return true;
}

function normalizeApproved(v) {
  if (v === true) return true;
  const s = String(v ?? "")
    .normalize("NFC")
    .trim()
    .toLowerCase();
  return ["đã duyệt", "da duyet", "duyệt", "duyet", "approved", "yes", "x", "1", "true"].includes(
    s,
  );
}

export function isApproved(t) {
  return t.approved === true;
}

// ---- Hàng đợi ----
export function enqueue(id) {
  const t = tasks.get(id);
  if (!t) return { ok: false, reason: "Không tìm thấy task" };
  if (!isApproved(t)) return { ok: false, reason: "Task chưa được duyệt" };
  if (t.status === "running" || t.status === "queued")
    return { ok: false, reason: "Đang trong hàng đợi" };
  t.status = "queued";
  t.error = "";
  t.percent = 0;
  t.phase = "Chờ trong hàng đợi";
  waiting.push(id);
  emit();
  pump();
  return { ok: true };
}

export function enqueueAllApproved() {
  let n = 0;
  for (const t of tasks.values()) {
    if (isApproved(t) && t.status !== "running" && t.status !== "queued" && t.status !== "done") {
      const r = enqueue(t.id);
      if (r.ok) n++;
    }
  }
  return n;
}

function pump() {
  while (running < concurrency && waiting.length > 0) {
    const id = waiting.shift();
    const t = tasks.get(id);
    if (!t) continue;
    running++;
    runTask(t).finally(() => {
      running--;
      pump();
    });
  }
}

async function runTask(t) {
  updateTask(t.id, { status: "running", phase: "Bắt đầu", percent: 1, detail: "" });
  try {
    const result = await produceVideo(
      {
        id: t.id,
        topic: t.topic,
        content: t.content,
        autogen: t.autogen,
        voiceRef: t.voiceRef,
        music: t.music,
        aspectRatio: t.aspectRatio,
        mode: t.mode,
      },
      (p) => updateTask(t.id, { phase: p.phase, percent: p.percent, detail: p.detail || "" }),
    );
    updateTask(t.id, { status: "done", phase: "Hoàn tất", percent: 100, detail: "", result });
  } catch (err) {
    updateTask(t.id, { status: "error", phase: "Lỗi", error: String(err?.message || err) });
  }
}

export function queueStats() {
  return { running, waiting: waiting.length, concurrency };
}
