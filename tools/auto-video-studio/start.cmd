@echo off
rem Khoi dong AutoVideo Hyperframe CHAY NGAM (tach khoi IDE/terminal).
rem Dong cua so nay hoac tat Antigravity, tool VAN chay. Chi dung khi bam "Tat tool" tren giao dien.
setlocal
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$busy = Get-NetTCPConnection -LocalPort 5174 -State Listen -ErrorAction SilentlyContinue;" ^
  "if ($busy) { Write-Host 'Tool da chay san tai http://localhost:5174'; }" ^
  "else { Start-Process -FilePath node -ArgumentList 'server.js' -WorkingDirectory '%~dp0' -WindowStyle Hidden; Write-Host 'Da khoi dong AutoVideo Hyperframe (chay ngam) tai http://localhost:5174'; }"
endlocal
