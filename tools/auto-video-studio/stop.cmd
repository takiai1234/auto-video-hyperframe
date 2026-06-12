@echo off
rem Tat AutoVideo Hyperframe (giong nut "Tat tool" tren giao dien).
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "try { Invoke-RestMethod -Method Post -Uri 'http://localhost:5174/api/shutdown' -TimeoutSec 3 | Out-Null; Write-Host 'Da gui lenh tat tool.'; }" ^
  "catch { $c = Get-NetTCPConnection -LocalPort 5174 -State Listen -ErrorAction SilentlyContinue; if ($c) { $c | Select-Object -ExpandProperty OwningProcess -Unique | ForEach-Object { Stop-Process -Id $_ -Force }; Write-Host 'Da tat tool.'; } else { Write-Host 'Tool khong chay.'; } }"
