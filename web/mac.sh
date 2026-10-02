#!/bin/bash
# MyQuran installer for macOS: all fonts (incl. QPC V1/V2/V4 page fonts) and the Word add-in.
# Run in Terminal:  curl -fsSL https://abdullohukr.github.io/quranuz/mac.sh | bash
# Fonts go to their own folder ~/Library/Fonts/MyQuran (macOS also reads sub-folders).
# Uninstall:        curl -fsSL https://abdullohukr.github.io/quranuz/mac-uninstall.sh | bash
set -e
SITE="https://abdullohukr.github.io/quranuz"
REL="https://github.com/abdullohukr/quranuz/releases/download/fonts"
FONTS="$HOME/Library/Fonts/MyQuran"
WEF="$HOME/Library/Containers/com.microsoft.Word/Data/Documents/wef"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$FONTS"

say() { printf '\n\033[1m%s\033[0m\n' "$1"; }
install_zip() {   # $1 url
  if ! curl -fL --progress-bar "$1" -o "$TMP/f.zip"; then echo "  ! not available: $1"; return 0; fi
  rm -rf "$TMP/x" && mkdir -p "$TMP/x" && unzip -q -o "$TMP/f.zip" -d "$TMP/x"
  find "$TMP/x" \( -iname '*.ttf' -o -iname '*.otf' \) -exec cp -f {} "$FONTS/" \;
}

say "1/3  MyQuran fonts -> ~/Library/Fonts/MyQuran"
install_zip "$SITE/fonts/MyQuran-fonts.zip"

say "2/3  QPC page fonts: Quran Library V1, V2, V4 (3 x 604)"
for v in V1 V2 V4; do echo "QPC $v"; install_zip "$REL/MyQuran-QPC-$v-fonts.zip"; done

say "3/3  Word add-in MyQuran"
mkdir -p "$WEF"
curl -fsSL "$SITE/manifest.xml" -o "$WEF/MyQuran.xml"

echo; echo "$(ls "$FONTS" | wc -l | tr -d ' ') fonts in $FONTS"
say "Done. Restart Word (Cmd+Q), then Home -> MyQuran.
Тайёр. Word'ни қайта ишга туширинг (Cmd+Q), сўнг Home -> MyQuran.
Готово. Перезапустите Word (Cmd+Q), затем Главная -> MyQuran."
