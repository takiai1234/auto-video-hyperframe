# 🎬 AutoVideo Hyperframe

Tự động biến **chủ đề / nội dung** thành **video hoàn chỉnh** = hình động (engine HyperFrames) + **giọng đọc tiếng Việt** + **nhạc nền** - qua một giao diện web, có hàng đợi và nhập Excel.

```
INPUT:  Chủ đề hoặc toàn bộ nội dung  (gõ tay hoặc tải Excel/Sheet)
OUTPUT: 1 file .mp4  (video + voice + nhạc, đồng bộ)
```

## Chạy

```bash
cd tools/auto-video-studio
npm install                 # lần đầu
node scripts/make-demo-music.mjs   # tạo vài bản nhạc demo (tuỳ chọn)
npm start                   # → http://localhost:5174
```

Yêu cầu: **Node 22+** và **FFmpeg**. Lệnh render gọi `npx hyperframes` (tự tải lần đầu).

## Tính năng

- **Tự sinh nội dung từ chủ đề (OpenRouter / ChatGPT)**: bật “🤖 Tự sinh nội dung”, chỉ nhập **chủ đề** → AI viết kịch bản 2–3 phút. Nhập API key + model OpenRouter trên giao diện (mặc định `openai/gpt-4o-mini`). Code: `src/openrouter.js`. Tắt AI thì dùng nội dung bạn dán.
- **Sửa prompt AI ngay trên giao diện**: mở “✏️ Sửa prompt AI” để chỉnh **SYSTEM prompt** (vai trò đạo diễn + luật + schema layout) và **template lời nhắc** (dùng `{{topic}}`, `{{guidance}}`), có nút **Khôi phục mặc định**. Lưu trong `data/settings.json`. Mặc định gốc nằm ở `src/prompts.js`.
- **Hai chế độ đầu ra (2 nút)**:
  - **➕ Hyperframe**: chỉ slide hình động + giọng + nhạc (như trước).
  - **➕ Hyperframe + HeyGen**: ghép thêm **avatar HeyGen nói** đồng bộ với slide, chia đôi khung (9:16: trên slide / dưới avatar · 16:9: trái avatar / phải slide). Giọng vẫn dùng **Vbee** (gửi URL audio công khai sang HeyGen). Nhập `HeyGen API key` + `avatar_id` (nhiều cái → chọn ngẫu nhiên) trên giao diện. Code: `src/heygen.js`.
- **Giọng đọc liền mạch - không ngắt nghỉ**: các đoạn audio nối tiếp nhau theo độ dài, **không chèn khoảng lặng**; mỗi đoạn còn được **cắt im lặng** (đầu/đuôi + rút khoảng nghỉ trong còn ~0.25s). Các frame chỉ minh hoạ, chuyển cảnh **crossfade** mượt trên nền tiếng nói liên tục.
- **Nhập linh hoạt**: gõ tay từng task, hoặc **tải Excel/CSV** 3 cột `Chủ đề · Nội dung · Duyệt`. Chỉ dòng có Duyệt = `đã duyệt` mới chạy được. (Tải file mẫu trong UI.)
- **Giọng đọc tiếng Việt - Vbee (API)** (một video dùng 1 giọng để **đồng nhất**): chất lượng cao, nhiều giọng. Nhập `app_id` + `access token` trong UI (hoặc env `VBEE_APP_ID`/`VBEE_TOKEN`), thêm các `voice_code` của gói bạn, bấm **Test**. Endpoint chỉnh được ở Base URL (mặc định `https://vbee.vn/api/v1`). Code: `src/vbee.js` + `src/settings.js`.
- **Nhạc nền**: chọn bản cụ thể hoặc **🎲 Ngẫu nhiên**. Nhạc được **lặp cho khớp độ dài** và **tự né giọng đọc** (sidechain ducking).
  - Nguồn: folder `music/` (bỏ file của bạn vào là xong) **hoặc** đồng bộ từ **Google Drive** (dán link folder công khai + API key).
- **Hàng đợi**: nút **“▶ Chạy tất cả đã duyệt”** xếp mọi task đã duyệt và chạy **song song 2 video / lúc** (đổi qua biến môi trường `CONCURRENCY`).
- **Theo task**: mỗi dòng chọn **giọng + nhạc riêng**; hoặc **áp dụng cho tất cả** bằng thanh công cụ.
- **Tiến trình realtime** (SSE): xem từng pha - Tạo giọng → Dựng composition → Render → Trộn giọng → Ghép nhạc. Xong thì **Xem** / **Tải** ngay trong UI.

## Quy trình mỗi video (pipeline)

1. **Soạn kịch bản**: tách nội dung thành các cảnh (tiêu đề → các phần → kết).
2. **TTS từng cảnh** rồi đo thời lượng → **tính mốc thời gian** để hình khớp tiếng.
3. **Dựng composition** HyperFrames (HTML + GSAP, có transition giữa cảnh).
4. **Render** ra video im lặng (Chrome headless + FFmpeg).
5. **Trộn giọng đọc** thành 1 track đúng vị trí từng cảnh.
6. **Ghép nhạc nền** (ducking) → **MP4 cuối** trong `output/`.

## Cấu trúc

```
server.js            API + SSE + upload Excel + serve video
src/
  vbee.js            client TTS Vbee (trả file + URL audio công khai)
  voices.js          bộ điều phối giọng đọc (Vbee)
  heygen.js          client HeyGen (tạo avatar nói + poll + tải mp4)
  prompts.js         prompt mặc định (SYSTEM + template lời nhắc)
  openrouter.js      sinh kịch bản phân cảnh (dùng prompt sửa được)
  settings.js        lưu cấu hình Vbee / OpenRouter / prompt / HeyGen
  music.js           kho nhạc local + sync Google Drive
  scriptgen.js       nội dung → danh sách cảnh
  composition.js     cảnh → HTML HyperFrames + timeline (hỗ trợ render nửa khung)
  pipeline.js        toàn bộ pipeline 1 video (2 chế độ: Hyperframe / + HeyGen)
  store.js           kho task + hàng đợi song song
public/              giao diện dashboard
music/  output/  workdir/   nhạc · video kết quả · thư mục dựng tạm
```

## Mở rộng (tuỳ chọn)

- **Thêm giọng cao cấp** (FPT.AI, Google Cloud, Azure, ElevenLabs): thêm provider trong `src/voices.js` (lớp đã tách sẵn để cắm thêm). Giúp có nhiều giọng nam trầm tự nhiên hơn nữa.
- **Sinh nội dung từ chỉ-chủ-đề bằng LLM**: hiện topic-only tạo kịch bản tối giản. Cắm Anthropic/OpenAI vào `src/scriptgen.js` để tự viết kịch bản đầy đủ từ một cái tên chủ đề.
- **Google Drive**: cần folder để “Anyone with the link” + một Google Drive API key (Cloud Console → Drive API → API key). Dán vào UI, bấm “Đồng bộ nhạc”.

## Biến môi trường

| Biến | Ý nghĩa |
|------|---------|
| `PORT` | cổng (mặc định 5174) |
| `CONCURRENCY` | số video chạy song song (mặc định 2) |
| `HF_WORKERS` | số worker Chrome mỗi lần render (mặc định 2) |
| `GOOGLE_DRIVE_API_KEY` | API key Drive mặc định |
| `OPENROUTER_API_KEY` | API key OpenRouter (sinh nội dung) |
| `OPENROUTER_MODEL` | model OpenRouter (mặc định `openai/gpt-4o-mini`) |
| `VBEE_APP_ID` / `VBEE_TOKEN` | credentials Vbee mặc định |
| `HEYGEN_API_KEY` / `HEYGEN_AVATAR_ID` | credentials HeyGen mặc định (chế độ ghép avatar) |
