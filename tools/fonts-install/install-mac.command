#!/bin/bash
# MyQuran: install all fonts for the current user (macOS).
# Double-click this file. If macOS blocks it: right-click -> Open -> Open.
cd "$(dirname "$0")"
mkdir -p "$HOME/Library/Fonts"
cp -f fonts/*.ttf fonts/*.otf "$HOME/Library/Fonts/" 2>/dev/null
echo "Fonts installed. Restart Word. / Шрифтлар ўрнатилди. Word'ни қайта ишга туширинг."
read -n 1 -s -r -p "Press any key..."
