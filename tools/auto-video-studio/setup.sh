#!/usr/bin/env bash
# =============================================================================
# AutoVideo Hyperframe - Tự động cài tài nguyên & chạy (Linux / macOS)
# Dùng được cho cả người và AI agent. Idempotent: chạy lại nhiều lần vẫn an toàn.
#
#   bash setup.sh           # cài đặt đầy đủ (deps + ffmpeg + nhạc demo)
#   bash setup.sh --run     # cài đặt xong rồi chạy server luôn
#   bash setup.sh --check    # chỉ kiểm tra môi trường, không cài
# =============================================================================
set -euo pipefail
cd "$(dirname "$0")"

BLUE='\033[1;34m'; GREEN='\033[1;32m'; YELLOW='\033[1;33m'; RED='\033[1;31m'; NC='\033[0m'
say()  { echo -e "${BLUE}▶ $*${NC}"; }
ok()   { echo -e "${GREEN}✓ $*${NC}"; }
warn() { echo -e "${YELLOW}⚠ $*${NC}"; }
err()  { echo -e "${RED}✗ $*${NC}"; }

RUN=0; CHECK_ONLY=0
for a in "$@"; do
  [ "$a" = "--run" ] && RUN=1
  [ "$a" = "--check" ] && CHECK_ONLY=1
done

# ---- 1) Nhận diện hệ điều hành / trình quản lý gói --------------------------
OS="$(uname -s)"; PKG=""
if [ "$OS" = "Darwin" ]; then
  PKG="brew"
elif command -v apt-get >/dev/null 2>&1; then PKG="apt"
elif command -v dnf     >/dev/null 2>&1; then PKG="dnf"
elif command -v pacman  >/dev/null 2>&1; then PKG="pacman"
elif command -v zypper  >/dev/null 2>&1; then PKG="zypper"
fi
say "Hệ điều hành: $OS | Trình quản lý gói: ${PKG:-không rõ}"

SUDO=""; [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null 2>&1 && SUDO="sudo"

pkg_install() { # $@ = tên gói
  case "$PKG" in
    apt)    $SUDO apt-get update -y && $SUDO apt-get install -y "$@" ;;
    dnf)    $SUDO dnf install -y "$@" ;;
    pacman) $SUDO pacman -Sy --noconfirm "$@" ;;
    zypper) $SUDO zypper install -y "$@" ;;
    brew)   brew install "$@" ;;
    *) err "Không tự cài được '$*' - hãy cài thủ công."; return 1 ;;
  esac
}

# ---- 2) Node.js (>= 20, khuyến nghị 22+) ------------------------------------
NODE_OK=0
if command -v node >/dev/null 2>&1; then
  NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
  if [ "$NODE_MAJOR" -ge 20 ]; then ok "Node $(node -v)"; NODE_OK=1
  else warn "Node $(node -v) quá cũ (cần >= 20, khuyến nghị 22+)."; fi
else
  warn "Chưa có Node.js."
fi
if [ "$NODE_OK" -eq 0 ] && [ "$CHECK_ONLY" -eq 0 ]; then
  say "Cài Node.js LTS..."
  if [ "$PKG" = "brew" ]; then pkg_install node || true
  elif [ "$PKG" = "apt" ]; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | $SUDO -E bash - && pkg_install nodejs || true
  else pkg_install nodejs npm || true; fi
  command -v node >/dev/null 2>&1 && ok "Node $(node -v)" || err "Cài Node thất bại - cài thủ công: https://nodejs.org (>=22)."
fi

# ---- 3) FFmpeg (KHUYẾN NGHỊ) ------------------------------------------------
# App tự dùng ffmpeg/ffprobe đóng gói qua npm (ffmpeg-static/ffprobe-static) ở bước (4),
# nên KHÔNG còn lỗi "spawn ffprobe ENOENT" dù máy chưa cài ffmpeg hệ thống.
# Vẫn nên cài ffmpeg hệ thống để engine render (npx hyperframes) hoạt động tối ưu.
if command -v ffmpeg >/dev/null 2>&1; then ok "ffmpeg hệ thống $(ffmpeg -version | head -1 | awk '{print $3}')"
elif [ "$CHECK_ONLY" -eq 1 ]; then warn "Chưa có ffmpeg hệ thống (app vẫn chạy nhờ bản đóng gói npm; nên cài cho engine render)."
else say "Cài ffmpeg (khuyến nghị)..."; pkg_install ffmpeg && ok "ffmpeg đã cài" || warn "Không cài được ffmpeg hệ thống - app vẫn dùng bản npm; engine render có thể cần ffmpeg, cài thủ công nếu lỗi."; fi

# ---- 4) Phụ thuộc Node của app ----------------------------------------------
if [ "$CHECK_ONLY" -eq 0 ]; then
  say "Cài phụ thuộc npm (tools/auto-video-studio)..."
  if [ -f package-lock.json ]; then npm ci || npm install; else npm install; fi
  ok "Đã cài node_modules"
  # ---- 5) Nhạc demo (tuỳ chọn) ----------------------------------------------
  if [ ! -d music ] || [ -z "$(ls -A music 2>/dev/null || true)" ]; then
    say "Tạo vài bản nhạc nền demo..."
    node scripts/make-demo-music.mjs || warn "Bỏ qua nhạc demo (không bắt buộc)."
  fi
fi

# ---- 6) Tổng kết ------------------------------------------------------------
echo ""
ok "Hoàn tất kiểm tra/cài đặt."
echo -e "${BLUE}Bước tiếp theo:${NC}"
echo "  1) npm start                # mở http://localhost:5174"
echo "  2) Nhập API key trên giao diện: OpenRouter (sinh nội dung) + Vbee (giọng đọc)."
echo "     (HeyGen / Google Drive là tuỳ chọn.)"
echo "  3) Nhập chủ đề -> bấm tạo video."

if [ "$RUN" -eq 1 ] && [ "$CHECK_ONLY" -eq 0 ]; then
  say "Khởi động server..."
  exec npm start
fi
