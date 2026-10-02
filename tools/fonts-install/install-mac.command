#!/bin/bash
# MyQuran: install the fonts of this archive into their own folder ~/Library/Fonts/MyQuran.
# Double-click this file. If macOS blocks it: right-click -> Open -> Open.
cd "$(dirname "$0")"
mkdir -p "$HOME/Library/Fonts/MyQuran"
find fonts \( -iname '*.ttf' -o -iname '*.otf' \) -exec cp -f {} "$HOME/Library/Fonts/MyQuran/" \;
echo "Fonts installed. Restart Word. / Шрифтлар ўрнатилди. Word'ни қайта ишга туширинг."
read -n 1 -s -r -p "Press any key..."
