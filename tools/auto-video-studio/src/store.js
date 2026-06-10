// Kho task trong bộ nhớ + hàng đợi chạy song song (mặc định 2 task / lúc).
import { EventEmitter } from "node:events";
import { produceVideo } from "./pipeline.js";

export const events = new EventEmitter();
events.setMaxListeners(100);

const tasks = new Map();
let seq = 0;

export const CONCURRENCY = Number(process.env.CONCURRENCY || 2);
let running = 0;
const waiting = []; // id đang chờ chạy

function emit() {
  events.emit("update", listTasks());
}

export function listTasks() {
  return Array.from(tasks.values()).map((t) => ({ ...t }));
}

export function getTask(id) {
  return tasks.get(id);
}

export function addTask({
  topic,
  content,
  approved,
  voiceRef,
  music,
  autogen,
  aspectRatio,
}) {
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
  while (running < CONCURRENCY && waiting.length > 0) {
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
      },
      (p) => updateTask(t.id, { phase: p.phase, percent: p.percent, detail: p.detail || "" }),
    );
    updateTask(t.id, { status: "done", phase: "Hoàn tất", percent: 100, detail: "", result });
  } catch (err) {
    updateTask(t.id, { status: "error", phase: "Lỗi", error: String(err?.message || err) });
  }
}

export function queueStats() {
  return { running, waiting: waiting.length, concurrency: CONCURRENCY };
}
