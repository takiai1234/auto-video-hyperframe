<h1 align="center">🎬 AutoVideo Hyperframe</h1>

<p align="center"><b>Nhập chủ đề → ra video hoàn chỉnh.</b><br/>
Tự động sinh kịch bản bằng AI, lồng tiếng Việt, ghép nhạc nền và render thành MP4 - tất cả qua một giao diện web.</p>

---

**AutoVideo Hyperframe** là công cụ tự động hoá sản xuất video dạng explainer/short:

```
INPUT:  Chủ đề (hoặc nội dung có sẵn)  →  OUTPUT: 1 file video .mp4 hoàn chỉnh
                                          (hình động + giọng đọc + nhạc nền)
```

Công cụ được xây trên nền **HyperFrames** - engine mã nguồn mở biến HTML thành video bằng headless Chrome + FFmpeg. Mã gốc lấy từ [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) và phát triển thêm tầng ứng dụng ở `tools/auto-video-studio/`.

---

## 🤖 Setup cho AI agent (đọc & làm theo)

> Phần này là HỢP ĐỒNG SETUP cho trợ lý AI khi clone dự án sang máy mới. Làm tuần tự.

**Bước 0 - Nhận diện hệ điều hành**, rồi chạy đúng script tự động dưới đây. Script là *idempotent* (chạy lại nhiều lần vẫn an toàn): nó kiểm tra & cài Node 22+, FFmpeg, `npm install`, tạo nhạc demo.

```bash
# === Linux (Ubuntu/Debian/Fedora/Arch) hoặc macOS ===
cd tools/auto-video-studio
bash setup.sh            # cài đầy đủ
bash setup.sh --run      # cài xong chạy server luôn (http://localhost:5174)
bash setup.sh --check    # chỉ kiểm tra môi trường, không cài
```

```powershell
# === Windows (PowerShell) ===
cd tools\auto-video-studio
powershell -ExecutionPolicy Bypass -File setup.ps1          # cài đầy đủ
powershell -ExecutionPolicy Bypass -File setup.ps1 -Run     # cài xong chạy luôn
powershell -ExecutionPolicy Bypass -File setup.ps1 -CheckOnly
```

**Bước 1 - Nếu KHÔNG có script** (hoặc cài thủ công), làm theo bảng phụ thuộc + lệnh theo OS ở mục [📦 Cài thủ công](#-cài-thủ-công-theo-hệ-điều-hành).

**Bước 2 - Cấu hình API key**: app KHÔNG đọc key từ file môi trường bắt buộc - người dùng nhập trên giao diện và lưu vào `tools/auto-video-studio/data/settings.json`. Có thể đặt sẵn qua biến môi trường (xem [🔑 Cấu hình](#-cấu-hình--api-key)). Tối thiểu cần **OpenRouter** (sinh nội dung) + **Vbee** (giọng đọc).

**Bước 3 - Chạy & kiểm tra**:

```bash
cd tools/auto-video-studio && npm start     # → http://localhost:5174
```

Kiểm tra nhanh không cần API key / ffmpeg:
- `http://localhost:5174/live-preview/` - xem động 10 mẫu design (đúng khung engine chụp thành video).
- `http://localhost:5174/design-gallery.html` - gallery tĩnh 20 mẫu.
- `http://localhost:5174/api/meta` - phải trả JSON có `themes` (20 mục).

**Điều kiện coi là chạy được**: server trả HTTP 200 ở `/`, `/api/meta` có 20 theme. **Render MP4 thật** cần thêm FFmpeg + Node 22+ + API key.

---

## 📦 Cài thủ công (theo hệ điều hành)

### Phụ thuộc

| Thành phần | Bắt buộc | Ghi chú |
| ---------- | -------- | ------- |
| **Node.js ≥ 20.12 (khuyến nghị 22)** | ✅ | **BẮT BUỘC cho render**: engine `hyperframes` dùng `styleText` (có từ Node 20.12). Node 18 → render lỗi `npx exit 1`. Không có Node 22? Cài nhanh không cần sudo: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh \| bash` rồi `nvm install 22 && nvm use 22`. |
| **FFmpeg / FFprobe** | ⚙ tự có | App tự dùng `ffmpeg-static`/`ffprobe-static` (tải khi `npm install`) → KHÔNG còn lỗi `spawn ffprobe ENOENT`. Cài ffmpeg hệ thống là *khuyến nghị* cho engine render. |
| **npm** | ✅ | Đi kèm Node |
| **Internet** (lần đầu) | ✅ | Tự tải HyperFrames CLI qua `npx`, GSAP CDN, Google Fonts cho vài mẫu design |
| **OpenRouter API key** | ✅* | Sinh kịch bản (bật "Tự sinh nội dung"). *Tắt AI thì dùng nội dung dán tay |
| **Vbee API (app_id + token)** | ✅* | Giọng đọc tiếng Việt. *Bắt buộc nếu muốn có tiếng |
| **HeyGen API key + avatar_id** | ⛔ tuỳ chọn | Chế độ ghép avatar nói chia đôi khung |
| **Google Drive API key** | ⛔ tuỳ chọn | Đồng bộ nhạc nền từ folder công khai |

### Ubuntu / Debian

```bash
# Node 22 (NodeSource) + FFmpeg
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs ffmpeg
# App
cd tools/auto-video-studio && npm ci && npm start
```

### Fedora / Arch

```bash
# Fedora
sudo dnf install -y nodejs ffmpeg
# Arch
sudo pacman -Sy --noconfirm nodejs npm ffmpeg
cd tools/auto-video-studio && npm install && npm start
```

### Windows

```powershell
# Bằng winget (Windows 10/11)
winget install OpenJS.NodeJS.LTS -e
winget install Gyan.FFmpeg -e
# Mở LẠI PowerShell để PATH nhận node/ffmpeg, rồi:
cd tools\auto-video-studio
npm ci
npm start          # hoặc double-click start.cmd để chạy NGẦM (đóng IDE vẫn chạy)
```

> Chạy ngầm trên Windows: `start.cmd` (chạy nền, không phụ thuộc IDE). Dừng bằng nút **⏻ Tắt tool** trên giao diện hoặc `stop.cmd`.

### macOS

```bash
brew install node ffmpeg
cd tools/auto-video-studio && npm install && npm start
```

---

## 🔑 Cấu hình & API key

API key/token lưu cục bộ ở `tools/auto-video-studio/data/settings.json` (**đã `.gitignore` - không bao giờ commit**). Hai cách đặt:

1. **Trên giao diện** (khuyến nghị): mở `http://localhost:5174`, nhập key trong các ô cấu hình, bấm **Test** rồi **Lưu**.
2. **Biến môi trường** (đặt sẵn trước khi `npm start`):

| Biến | Ý nghĩa | Mặc định |
| ---- | ------- | -------- |
| `PORT` | Cổng server | `5174` |
| `CONCURRENCY` | Số video chạy song song | `2` (chỉnh 1-5 trên UI) |
| `HF_WORKERS` | Số worker Chrome mỗi lần render | `2` |
| `OUTPUT_SCALE` | Bội số độ phân giải: `1`=1080p, `1.333`=**2K (2560×1440)**, `2`=4K | `1.333` (2K) |
| `OPENROUTER_API_KEY` | Key OpenRouter (sinh nội dung) | - |
| `OPENROUTER_MODEL` | Model OpenRouter | `openai/gpt-4.1-mini` |
| `VBEE_APP_ID` / `VBEE_TOKEN` | Credentials Vbee (TTS) | - |
| `HEYGEN_API_KEY` / `HEYGEN_AVATAR_ID` | Credentials HeyGen (tuỳ chọn) | - |
| `GOOGLE_DRIVE_API_KEY` | Key Drive đồng bộ nhạc (tuỳ chọn) | - |

Xem cấu trúc mẫu: [tools/auto-video-studio/settings.example.json](tools/auto-video-studio/settings.example.json).

---

## ✨ Tính năng

- **Sinh nội dung bằng AI (OpenRouter)** - chỉ cần nhập chủ đề, AI viết kịch bản phân cảnh 90-180 giây. **Prompt sửa được ngay trên giao diện** (SYSTEM + template, có khôi phục mặc định).
- **20 mẫu "design"** - 10 theme màu + **10 phong cách sáng tạo viral** (Neo Brutal, Vaporwave, Y2K Aero, Editorial, Aurora Mesh, Pop Comic, Neon Glow, Swiss Mono, Frost Glass, Blueprint). Chi tiết: [DESIGN.md](DESIGN.md).
- **10+ kiểu layout cảnh** (title, thẻ, công thức, sơ đồ luồng, so sánh, số liệu, các bước, prompt mẫu, popup, trích dẫn, tóm tắt…), chuyển cảnh crossfade mượt.
- **Hai chế độ** - chỉ slide Hyperframe, hoặc **ghép thêm avatar HeyGen nói** chia đôi khung (9:16 trên/dưới · 16:9 trái/phải); giọng vẫn dùng Vbee.
- **Giọng đọc tiếng Việt liền mạch** qua **Vbee API** (không ngắt nghỉ; tự cắt im lặng).
- **Nhạc nền tự động** - chọn ngẫu nhiên từ kho local hoặc đồng bộ từ **Google Drive**; tự né giọng đọc (sidechain ducking).
- **Khung 16:9 hoặc 9:16** (dọc cho TikTok/Reels/Shorts).
- **Hàng đợi & xử lý hàng loạt** - tải Excel/Google Sheet (3 cột: Chủ đề · Nội dung · Duyệt), chạy song song nhiều video.
- **Theo dõi tiến trình realtime** (SSE), xem & tải video ngay trong trình duyệt.

---

## 🧩 Kiến trúc & pipeline

```
tools/auto-video-studio/   ← Ứng dụng AutoVideo (giao diện + pipeline)  [npm]
packages/                  ← Engine HyperFrames (core, engine, producer, cli…) [bun, upstream]
```

> Hai tầng dùng trình quản lý gói khác nhau: **app dùng `npm`** (có `package-lock.json`), **engine gốc dùng `bun`**. Để chạy AutoVideo chỉ cần `npm` trong `tools/auto-video-studio/`; engine được gọi qua `npx hyperframes` (tự tải lần đầu), KHÔNG cần build monorepo.

Pipeline mỗi video:

```
chủ đề → AI sinh kịch bản → TTS từng cảnh → đo & tính mốc thời gian
       → dựng composition HTML (áp design đã chọn) → render im lặng (Chrome+FFmpeg)
       → trộn giọng đúng vị trí → ghép nhạc nền (ducking) → MP4 trong output/
```

Cấu trúc thư mục app:

```
server.js            API + SSE + upload Excel + serve video/preview
src/
  prompts.js         prompt mặc định (SYSTEM + template) - sửa được trên UI
  openrouter.js      sinh kịch bản phân cảnh (JSON theo schema)
  scriptgen.js       nội dung dán tay → danh sách cảnh (không AI)
  composition.js     cảnh → HTML HyperFrames + timeline + designCss(style)
  themes.js          20 mẫu (10 theme màu + 10 design style)
  vbee.js / voices.js client TTS Vbee
  heygen.js          client HeyGen (avatar nói) - chế độ ghép
  music.js           kho nhạc local + sync Google Drive
  pipeline.js        toàn bộ pipeline 1 video (2 chế độ)
  store.js           kho task + hàng đợi song song
public/              giao diện dashboard + live-preview/ + design-gallery.html
setup.sh / setup.ps1 script tự cài (Linux-macOS / Windows)
```

---

## 🩹 Khắc phục sự cố

| Triệu chứng | Nguyên nhân & cách xử lý |
| ----------- | ------------------------ |
| `EADDRINUSE :::5174` | Đã có server chạy ở cổng đó. Dừng tiến trình cũ (`lsof -ti tcp:5174 \| xargs kill`) hoặc đổi `PORT`. |
| `npx exit 1` khi render / `Node.js v18.x` / `does not provide an export named 'styleText'` (cả chế độ Hyperframe lẫn **HeyGen**) | Engine `hyperframes` cần Node ≥ 20.12 (dùng API `styleText`). **2 trường hợp:** **(a)** *server* chạy Node < 20.12 → app báo lỗi rõ ràng kèm hướng dẫn; chạy lại bằng Node 22: `nvm install 22 && nvm use 22 && npm start` (hoặc `bash setup.sh`). **(b)** *server* chạy Node 22 nhưng tiến trình con `npx` lại lấy nhầm Node 18 ở `/usr/bin` (qua `#!/usr/bin/env node`) → **đã sửa sẵn**: app tự nhồi thư mục Node đang chạy (`process.execPath`) vào đầu `PATH` nên `npx`/engine luôn dùng đúng Node của server. Chỉ cần **khởi động server bằng Node ≥ 20.12** là không còn lỗi. |
| `spawn ffprobe ENOENT` / `spawn ffmpeg ENOENT` | Chưa chạy `npm install` (thiếu `ffmpeg-static`/`ffprobe-static`). Chạy `npm install` trong `tools/auto-video-studio`. Có thể trỏ binary riêng qua env `FFMPEG_PATH` / `FFPROBE_PATH`. |
| Render báo lỗi / không ra MP4 | Node < 22, hoặc engine cần ffmpeg hệ thống. Cài theo mục trên (`node -v`, `ffmpeg -version`). App tự có ffmpeg/ffprobe qua npm cho phần audio. |
| Preview/Video sai font, kém "chất" | Máy **offline** → Google Fonts của vài mẫu design không tải được, font tự fallback (vẫn chạy). Cho máy nối mạng lần đầu. |
| `/api/meta` chỉ có 10 theme | Đang chạy server **bản cũ**. Khởi động lại `npm start`. |
| Không có tiếng | Chưa cấu hình **Vbee** (app_id + token). Nhập trên UI, bấm **Test**. |
| AI báo "kịch bản quá ngắn" | Model bị cắt token hoặc key sai. Đổi `OPENROUTER_MODEL` hoặc rút gọn prompt. |

---

## 🔐 Bảo mật

- API key/token lưu cục bộ ở `data/settings.json` (**đã `.gitignore`**).
- Nhạc trong `music/` không commit (tránh bản quyền / dữ liệu cá nhân).

## 📄 Giấy phép

Dựa trên HyperFrames (Apache 2.0). Xem [LICENSE](LICENSE).
