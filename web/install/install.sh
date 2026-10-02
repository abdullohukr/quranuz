#!/bin/bash
# MyQuran installer for macOS: fonts (+ optional QPC page fonts) and the Word add-in.
# Run in Terminal:  curl -fsSL https://abdullohukr.github.io/quranuz/install/install.sh | bash
set -e
SITE="https://abdullohukr.github.io/quranuz"
REL="https://github.com/abdullohukr/quranuz/releases/download/fonts"
FONTS="$HOME/Library/Fonts"
WEF="$HOME/Library/Containers/com.microsoft.Word/Data/Documents/wef"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$FONTS"

say() { printf '\n\033[1m%s\033[0m\n' "$1"; }
install_zip() {   # $1 url
  curl -fL --progress-bar "$1" -o "$TMP/f.zip"
  rm -rf "$TMP/x" && mkdir -p "$TMP/x" && unzip -q -o "$TMP/f.zip" -d "$TMP/x"
  find "$TMP/x" \( -iname '*.ttf' -o -iname '*.otf' \) -exec cp -f {} "$FONTS/" \;
}
ask() {   # works also when piped from curl
  local a; printf '%s [Y/n] ' "$1"; read -r a < /dev/tty || a=y; [ -z "$a" ] || [[ "$a" =~ ^[YyДдHh] ]]
}

say "1/3  MyQuran fonts / шрифтлар / шрифты"
install_zip "$SITE/fonts/MyQuran-fonts.zip"

say "2/3  QPC page fonts (Quran Library V1, V2, V4: 3 x 604 fonts)"
for v in V1 V2 V4; do
  if ask "Install QPC $v? / Ўрнатилсинми? / Установить?"; then install_zip "$REL/MyQuran-QPC-$v-fonts.zip"; fi
done

say "3/3  Word add-in MyQuran"
mkdir -p "$WEF"
curl -fsSL "$SITE/manifest.xml" -o "$WEF/MyQuran.xml"

say "Done. Restart Word (Cmd+Q), then Home -> MyQuran.
Тайёр. Word'ни қайта ишга туширинг (Cmd+Q), сўнг Home -> MyQuran.
Готово. Перезапустите Word (Cmd+Q), затем Главная -> MyQuran."
