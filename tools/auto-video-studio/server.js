import express from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { listMusic, syncFromDrive, parseDriveFolderId, removeMusic } from "./src/music.js";
import {
  publicVbee,
  setVbeeConfig,
  setVbeeVoices,
  publicOpenrouter,
  setOpenrouterConfig,
  publicPrompts,
  setPromptsConfig,
  resetPromptsConfig,
  publicHeygen,
  setHeygenConfig,
} from "./src/settings.js";
import { testVbee } from "./src/vbee.js";
import { testOpenrouter } from "./src/openrouter.js";
import { testHeygen } from "./src/heygen.js";
import {
  events,
  listTasks,
  getTask,
  addTask,
  updateTask,
  removeTask,
  clearTasks,
  enqueue,
  enqueueAllApproved,
  queueStats,
} from "./src/store.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });
app.use(express.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 5174;

// ---- Tham chiếu ----
app.get("/api/meta", (req, res) => {
  res.json({
    vbee: publicVbee(),
    openrouter: publicOpenrouter(),
    prompts: publicPrompts(),
    heygen: publicHeygen(),
    music: listMusic(),
    queue: queueStats(),
  });
});

app.get("/api/tasks", (req, res) => res.json({ tasks: listTasks(), queue: queueStats() }));

// ---- SSE realtime ----
app.get("/api/events", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  res.flushHeaders?.();
  const send = (tasks) => res.write(`data: ${JSON.stringify({ tasks, queue: queueStats() })}\n\n`);
  send(listTasks());
  const onUpdate = (tasks) => send(tasks);
  events.on("update", onUpdate);
  const ping = setInterval(() => res.write(": ping\n\n"), 20000);
  req.on("close", () => {
    clearInterval(ping);
    events.off("update", onUpdate);
  });
});

// ---- Tạo / sửa / xoá task ----
app.post("/api/tasks", (req, res) => {
  const { topic, content, approved, voiceRef, music, autogen, aspectRatio, mode } = req.body || {};
  if (!topic && !content) return res.status(400).json({ error: "Cần chủ đề hoặc nội dung." });
  const t = addTask({ topic, content, approved, voiceRef, music, autogen, aspectRatio, mode });
  res.json({ task: t });
});

app.patch("/api/tasks/:id", (req, res) => {
  const t = getTask(req.params.id);
  if (!t) return res.status(404).json({ error: "Không tìm thấy task." });
  const allowed = {};
  for (const k of ["topic", "content", "voiceRef", "music", "aspectRatio", "mode"]) {
    if (k in (req.body || {})) allowed[k] = req.body[k];
  }
  if ("approved" in (req.body || {})) allowed.approved = req.body.approved === true;
  if ("autogen" in (req.body || {})) allowed.autogen = req.body.autogen === true;
  updateTask(t.id, allowed);
  res.json({ task: getTask(t.id) });
});

app.delete("/api/tasks/:id", (req, res) => {
  removeTask(req.params.id);
  res.json({ ok: true });
});

app.post("/api/clear", (req, res) => {
  const ok = clearTasks();
  res.json({ ok, error: ok ? "" : "Có task đang chạy, không thể xoá tất cả." });
});

// ---- Áp dụng voice/nhạc hàng loạt ----
app.post("/api/bulk", (req, res) => {
  const { voiceRef, aspectRatio, music, onlyApproved } = req.body || {};
  let n = 0;
  for (const t of listTasks()) {
    if (onlyApproved && t.approved !== true) continue;
    const patch = {};
    if (voiceRef !== undefined && voiceRef !== "") patch.voiceRef = voiceRef;
    if (aspectRatio) patch.aspectRatio = aspectRatio;
    if (music) patch.music = music;
    if (Object.keys(patch).length) {
      updateTask(t.id, patch);
      n++;
    }
  }
  res.json({ updated: n });
});

// ---- Chạy ----
app.post("/api/tasks/:id/run", (req, res) => {
  const r = enqueue(req.params.id);
  if (!r.ok) return res.status(400).json({ error: r.reason });
  res.json({ ok: true });
});

app.post("/api/run-all", (req, res) => {
  const n = enqueueAllApproved();
  res.json({ enqueued: n });
});

// ---- Cấu hình Vbee ----
app.post("/api/settings/vbee", (req, res) => {
  const { appId, token, baseUrl, bitrate, speedRate } = req.body || {};
  const patch = {};
  if (appId !== undefined) patch.appId = appId.trim();
  if (token !== undefined && token !== "") patch.token = token.trim(); // không ghi đè bằng rỗng
  if (baseUrl) patch.baseUrl = baseUrl.trim();
  if (bitrate) patch.bitrate = Number(bitrate);
  if (speedRate) patch.speedRate = String(speedRate);
  setVbeeConfig(patch);
  res.json({ vbee: publicVbee() });
});

app.post("/api/settings/vbee/voices", (req, res) => {
  const voices = Array.isArray(req.body?.voices) ? req.body.voices.filter((v) => v.code) : [];
  setVbeeVoices(voices);
  res.json({ vbee: publicVbee() });
});

app.post("/api/vbee/test", async (req, res) => {
  try {
    const r = await testVbee(req.body?.voiceCode);
    res.json(r);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

// ---- Cấu hình OpenRouter (sinh nội dung) ----
app.post("/api/settings/openrouter", (req, res) => {
  const { apiKey, model } = req.body || {};
  const patch = {};
  if (apiKey !== undefined && apiKey !== "") patch.apiKey = apiKey.trim();
  if (model) patch.model = model.trim();
  setOpenrouterConfig(patch);
  res.json({ openrouter: publicOpenrouter() });
});

app.post("/api/openrouter/test", async (req, res) => {
  try {
    const r = await testOpenrouter(undefined, req.body?.model);
    res.json(r);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

// ---- Prompt AI (sửa được, khôi phục được) ----
app.get("/api/settings/prompts", (req, res) => res.json({ prompts: publicPrompts() }));

app.post("/api/settings/prompts", (req, res) => {
  const { system, userTemplate } = req.body || {};
  setPromptsConfig({ system, userTemplate });
  res.json({ prompts: publicPrompts() });
});

app.post("/api/settings/prompts/reset", (req, res) => {
  resetPromptsConfig();
  res.json({ prompts: publicPrompts() });
});

// ---- Cấu hình HeyGen (chế độ ghép avatar) ----
app.post("/api/settings/heygen", (req, res) => {
  const { apiKey, avatarId, background } = req.body || {};
  const patch = {};
  if (apiKey !== undefined && apiKey !== "") patch.apiKey = apiKey.trim();
  if (avatarId !== undefined) patch.avatarId = String(avatarId).trim();
  if (background) patch.background = String(background).trim();
  setHeygenConfig(patch);
  res.json({ heygen: publicHeygen() });
});

app.post("/api/heygen/test", async (req, res) => {
  try {
    const r = await testHeygen();
    res.json(r);
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

// ---- Upload Excel/CSV ----
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Chưa có file." });
  try {
    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    const created = [];
    for (const row of rows) {
      const { topic, content, approved } = mapRow(row);
      if (!topic && !content) continue;
      created.push(
        addTask({
          topic,
          content,
          approved,
          voiceRef: req.body.voiceRef || "",
          music: req.body.music || "random",
          aspectRatio: req.body.aspectRatio || "16:9",
          mode: req.body.mode || "hyperframe",
        }),
      );
    }
    res.json({ created: created.length, tasks: listTasks() });
  } catch (err) {
    res.status(400).json({ error: "Đọc file lỗi: " + (err?.message || err) });
  }
});

function mapRow(row) {
  const norm = {};
  for (const [k, v] of Object.entries(row)) norm[String(k).trim().toLowerCase()] = v;
  const find = (cands) => {
    for (const key of Object.keys(norm)) if (cands.some((c) => key.includes(c))) return norm[key];
    return "";
  };
  return {
    topic: find(["chủ đề", "chu de", "topic", "tên", "ten", "tiêu đề", "tieu de"]),
    content: find(["nội dung", "noi dung", "content", "kịch bản", "kich ban", "script"]),
    approved: find(["duyệt", "duyet", "approve", "status", "trạng thái", "trang thai"]),
  };
}

// ---- Google Drive sync ----
app.post("/api/drive/sync", async (req, res) => {
  try {
    const folderId = parseDriveFolderId(req.body?.url || req.body?.folderId);
    const apiKey = req.body?.apiKey || process.env.GOOGLE_DRIVE_API_KEY;
    if (!folderId) return res.status(400).json({ error: "URL/ID folder không hợp lệ." });
    if (!apiKey) return res.status(400).json({ error: "Thiếu Google Drive API key." });
    const r = await syncFromDrive({ folderId, apiKey });
    res.json({ ...r, music: listMusic() });
  } catch (err) {
    res.status(400).json({ error: String(err?.message || err) });
  }
});

// ---- Xoá 1 bản nhạc ----
app.delete("/api/music/:id", (req, res) => {
  const ok = removeMusic(req.params.id);
  res.json({ ok, music: listMusic() });
});

// ---- Serve video kết quả ----
app.get("/api/video/:id", (req, res) => {
  const t = getTask(req.params.id);
  if (!t?.result?.videoPath || !fs.existsSync(t.result.videoPath)) {
    return res.status(404).send("Chưa có video.");
  }
  res.sendFile(t.result.videoPath);
});

// ---- Tải file Excel mẫu ----
app.get("/api/sample-xlsx", (req, res) => {
  const data = [
    {
      "Chủ đề": "RAG là gì",
      "Nội dung":
        "RAG giúp LLM trả lời bằng dữ liệu thật.\n\nGồm 2 giai đoạn: Indexing và Retrieval.\n\nLợi ích: chính xác, có dẫn nguồn.",
      Duyệt: "đã duyệt",
    },
    {
      "Chủ đề": "Vector Database",
      "Nội dung": "Lưu dữ liệu dưới dạng vector.\n\nTìm kiếm theo độ tương đồng ngữ nghĩa.",
      Duyệt: "chưa duyệt",
    },
  ];
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Tasks");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.set("Content-Disposition", "attachment; filename=mau-tasks.xlsx");
  res.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.send(buf);
});

app.listen(PORT, () => {
  console.log(`\n  AutoVideo Hyperframe đang chạy tại  http://localhost:${PORT}`);
  console.log("  Giọng đọc: Vbee (API).\n");
});
