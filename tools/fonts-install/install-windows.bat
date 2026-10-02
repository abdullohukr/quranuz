@echo off
rem MyQuran: install the fonts of this archive into %LOCALAPPDATA%\MyQuran\Fonts for the
rem current user (no administrator rights needed). Double-click this file.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$dst = Join-Path $env:LOCALAPPDATA 'MyQuran\Fonts'; New-Item -ItemType Directory -Force -Path $dst | Out-Null;" ^
  "$reg = 'HKCU:\Software\Microsoft\Windows NT\CurrentVersion\Fonts';" ^
  "Add-Type -Namespace MQ -Name G -MemberDefinition '[DllImport(\"gdi32.dll\", CharSet = CharSet.Unicode)] public static extern int AddFontResourceW(string f);';" ^
  "Get-ChildItem -Path 'fonts' -Include *.ttf,*.otf -Recurse | ForEach-Object {" ^
  "  $f = Join-Path $dst $_.Name; Copy-Item $_.FullName -Destination $f -Force;" ^
  "  $kind = if ($_.Extension -eq '.otf') { ' (OpenType)' } else { ' (TrueType)' };" ^
  "  New-ItemProperty -Path $reg -Name ('MyQuran ' + $_.BaseName + $kind) -Value $f -PropertyType String -Force | Out-Null;" ^
  "  [void][MQ.G]::AddFontResourceW($f) }"
echo Fonts installed. Restart Word.
pause
