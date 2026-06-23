# =============================================================================
# AutoVideo Hyperframe - Tự động cài tài nguyên & chạy (Windows / PowerShell)
# Dùng được cho cả người và AI agent. Idempotent: chạy lại nhiều lần vẫn an toàn.
#
#   powershell -ExecutionPolicy Bypass -File setup.ps1            # cài đầy đủ
#   powershell -ExecutionPolicy Bypass -File setup.ps1 -Run       # cài xong chạy luôn
#   powershell -ExecutionPolicy Bypass -File setup.ps1 -CheckOnly # chỉ kiểm tra
# =============================================================================
param([switch]$Run, [switch]$CheckOnly)
$ErrorActionPreference = "Stop"
Set-Location -Path $PSScriptRoot

function Say  ($m) { Write-Host "▶ $m" -ForegroundColor Cyan }
function Ok   ($m) { Write-Host "✓ $m" -ForegroundColor Green }
function Warn ($m) { Write-Host "⚠ $m" -ForegroundColor Yellow }
function Err  ($m) { Write-Host "✗ $m" -ForegroundColor Red }

# Trình cài gói sẵn có (ưu tiên winget, sau đó choco).
$installer = $null
if (Get-Command winget -ErrorAction SilentlyContinue) { $installer = "winget" }
elseif (Get-Command choco -ErrorAction SilentlyContinue) { $installer = "choco" }
Say "Windows | Trình cài gói: $(if($installer){$installer}else{'không có (winget/choco)'})"

function Install-Pkg($wingetId, $chocoId) {
  if ($installer -eq "winget") { winget install --id $wingetId -e --accept-source-agreements --accept-package-agreements }
  elseif ($installer -eq "choco") { choco install $chocoId -y }
  else { Err "Không có winget/choco - cài thủ công."; return $false }
  return $true
}

# ---- 1) Node.js (>= 20, khuyến nghị 22+) ------------------------------------
$nodeOk = $false
if (Get-Command node -ErrorAction SilentlyContinue) {
  $major = [int](node -p "process.versions.node.split('.')[0]")
  if ($major -ge 20) { Ok "Node $(node -v)"; $nodeOk = $true } else { Warn "Node $(node -v) quá cũ (cần >= 20, nên 22+)." }
} else { Warn "Chưa có Node.js." }
if (-not $nodeOk -and -not $CheckOnly) {
  Say "Cài Node.js LTS..."
  if (Install-Pkg "OpenJS.NodeJS.LTS" "nodejs-lts") {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    if (Get-Command node -ErrorAction SilentlyContinue) { Ok "Node $(node -v)" } else { Warn "Mở lại PowerShell rồi chạy lại để nhận Node." }
  } else { Err "Cài Node thủ công: https://nodejs.org (>=22)." }
}

# ---- 2) FFmpeg (KHUYẾN NGHỊ) ------------------------------------------------
# App tự dùng ffmpeg/ffprobe đóng gói qua npm (bước 3) -> không còn "spawn ffprobe ENOENT"
# dù chưa cài ffmpeg hệ thống. Vẫn nên cài cho engine render (npx hyperframes).
if (Get-Command ffmpeg -ErrorAction SilentlyContinue) { Ok "ffmpeg hệ thống đã có" }
elseif ($CheckOnly) { Warn "Chưa có ffmpeg hệ thống (app vẫn chạy nhờ bản npm; nên cài cho engine render)." }
else {
  Say "Cài ffmpeg (khuyến nghị)..."
  if (Install-Pkg "Gyan.FFmpeg" "ffmpeg") {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    if (Get-Command ffmpeg -ErrorAction SilentlyContinue) { Ok "ffmpeg đã cài" } else { Warn "Mở lại PowerShell để nhận ffmpeg trong PATH." }
  } else { Warn "Không cài được ffmpeg hệ thống - app vẫn dùng bản npm; cài thủ công nếu engine render lỗi: https://ffmpeg.org/download.html" }
}

# ---- 3) Phụ thuộc Node của app ---------------------------------------------
if (-not $CheckOnly) {
  Say "Cài phụ thuộc npm (tools/auto-video-studio)..."
  if (Test-Path package-lock.json) { try { npm ci } catch { npm install } } else { npm install }
  Ok "Đã cài node_modules"
  # ---- 4) Nhạc demo (tuỳ chọn) ----------------------------------------------
  if (-not (Test-Path music) -or -not (Get-ChildItem music -ErrorAction SilentlyContinue)) {
    Say "Tạo vài bản nhạc nền demo..."
    try { node scripts/make-demo-music.mjs } catch { Warn "Bỏ qua nhạc demo (không bắt buộc)." }
  }
}

Write-Host ""
Ok "Hoàn tất kiểm tra/cài đặt."
Write-Host "Bước tiếp theo:" -ForegroundColor Cyan
Write-Host "  1) npm start                # mở http://localhost:5174  (hoặc double-click start.cmd)"
Write-Host "  2) Nhập API key trên giao diện: OpenRouter + Vbee (HeyGen/Drive tuỳ chọn)."
Write-Host "  3) Nhập chủ đề -> bấm tạo video."

if ($Run -and -not $CheckOnly) { Say "Khởi động server..."; npm start }
