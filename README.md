<h1 align="center">🎬 AutoVideo Hyperframe</h1>

<p align="center"><b>Nhập chủ đề → ra video hoàn chỉnh.</b><br/>
Tự động sinh kịch bản bằng AI, lồng tiếng Việt, ghép nhạc nền và render thành MP4 - tất cả qua một giao diện web.</p>

---

**AutoVideo Hyperframe** là công cụ tự động hoá sản xuất video dạng explainer/short:

```
INPUT:  Chủ đề (hoặc nội dung có sẵn)  →  OUTPUT: 1 file video .mp4 hoàn chỉnh
                                          (hình động + giọng đọc + nhạc nền)
```

Công cụ được xây trên nền **HyperFrames** - engine mã nguồn mở biến HTML thành video bằng headless Chrome + FFmpeg.

## ✨ Tính năng

- **Sinh nội dung bằng AI (OpenRouter / ChatGPT)** - chỉ cần nhập chủ đề, AI viết kịch bản phân cảnh 90–180 giây. **Prompt sửa được ngay trên giao diện** (SYSTEM + template, có khôi phục mặc định).
- **Hình ảnh đa dạng** - 10 kiểu layout (title, thẻ, công thức, sơ đồ luồng, so sánh, số liệu, các bước, tóm tắt…), chuyển cảnh mượt.
- **Hai chế độ** - chỉ slide Hyperframe, hoặc **ghép thêm avatar HeyGen nói** chia đôi khung (9:16 trên/dưới · 16:9 trái/phải), giọng vẫn dùng Vbee.
- **Giọng đọc tiếng Việt liền mạch** qua **Vbee API** (không ngắt nghỉ; cắt im lặng tự động).
- **Nhạc nền tự động** - chọn ngẫu nhiên từ kho local hoặc đồng bộ từ **Google Drive**.
- **Khung hình 16:9 hoặc 9:16** (dọc cho TikTok/Reels/Shorts).
- **Hàng đợi & xử lý hàng loạt** - tải Excel/Google Sheet (3 cột: Chủ đề · Nội dung · Duyệt), chạy song song nhiều video.
- **Theo dõi tiến trình realtime**, xem & tải video ngay trong trình duyệt.

## 🚀 Bắt đầu nhanh

```bash
cd tools/auto-video-studio
npm install
node scripts/make-demo-music.mjs   # tạo vài bản nhạc demo (tuỳ chọn)
npm start                          # → http://localhost:5174
```

Yêu cầu: **Node 22+** và **FFmpeg**. Lần đầu render sẽ tự tải HyperFrames CLI qua `npx`.

Mở **http://localhost:5174**, nhập API key (OpenRouter + Vbee) trong giao diện, rồi tạo video.

👉 Hướng dẫn chi tiết: [tools/auto-video-studio/README.md](tools/auto-video-studio/README.md)

## 🔐 Bảo mật

- API key / token được lưu cục bộ ở `tools/auto-video-studio/data/settings.json` (**đã `.gitignore`, không bao giờ commit**).
- Xem cấu trúc cấu hình mẫu: [tools/auto-video-studio/settings.example.json](tools/auto-video-studio/settings.example.json).
- Nhạc trong `music/` không được commit (tránh bản quyền / dữ liệu cá nhân).

## 🧩 Kiến trúc

```
tools/auto-video-studio/   ← Ứng dụng AutoVideo Hyperframe (giao diện + pipeline)
packages/                  ← Engine HyperFrames (core, engine, producer, cli…)
```

Pipeline mỗi video: **chủ đề → AI sinh kịch bản → TTS → đồng bộ thời gian → dựng composition HTML → render → ghép giọng + nhạc → MP4**.

## 📄 Giấy phép

Dựa trên HyperFrames (Apache 2.0). Xem [LICENSE](LICENSE).
