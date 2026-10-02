@echo off
rem MyQuran: install all fonts for the current user (Windows 10/11, no admin rights needed).
rem Double-click this file.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$dst = Join-Path $env:LOCALAPPDATA 'Microsoft\Windows\Fonts'; New-Item -ItemType Directory -Force -Path $dst | Out-Null;" ^
  "$reg = 'HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Fonts';" ^
  "Get-ChildItem -Path 'fonts' -Include *.ttf,*.otf -Recurse | ForEach-Object {" ^
  "  Copy-Item $_.FullName -Destination $dst -Force;" ^
  "  $kind = if ($_.Extension -eq '.otf') { ' (OpenType)' } else { ' (TrueType)' };" ^
  "  New-ItemProperty -Path $reg -Name ($_.BaseName + $kind) -Value (Join-Path $dst $_.Name) -PropertyType String -Force | Out-Null }"
echo Fonts installed. Restart Word.
pause
