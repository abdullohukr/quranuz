#!/bin/bash
# MyQuran installer for macOS: all fonts (incl. QPC V1/V2/V4 page fonts) and the Word add-in.
# Run in Terminal:  curl -fsSL https://abdullohukr.github.io/quranuz/mac.sh | bash
# Fonts go to their own folder ~/Library/Fonts/MyQuran (macOS also reads sub-folders).
# Every run is a clean reinstall: the MyQuran folder is recreated and other copies of the
# same fonts in the home folder are moved to ~/MyQuran-old-fonts (duplicate fonts make Word
# show "We weren't able to load all of your fonts").
# Uninstall:        curl -fsSL https://abdullohukr.github.io/quranuz/mac-uninstall.sh | bash
set -e
SITE="https://abdullohukr.github.io/quranuz"
REL="https://github.com/abdullohukr/quranuz/releases/download/fonts"
FONTS="$HOME/Library/Fonts/MyQuran"
OLD="$HOME/MyQuran-old-fonts"          # older copies of our fonts are moved here, not deleted
WEF="$HOME/Library/Containers/com.microsoft.Word/Data/Documents/wef"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

say() { printf '\n\033[1m%s\033[0m\n' "$1"; }

pgrep -x "Microsoft Word" >/dev/null && { echo "Quit Word first (Cmd+Q) / Avval Word'ni yoping / Сначала закройте Word"; osascript -e 'quit app "Microsoft Word"' >/dev/null 2>&1 || true; sleep 2; }

say "0/4  Checking installed fonts (about a minute) / Ўрнатилган шрифтлар текширилмоқда"
# PostScript names of every font installed OUTSIDE ~/Library/Fonts/MyQuran
system_profiler SPFontsDataType -json > "$TMP/fonts.json" 2>/dev/null || echo '{}' > "$TMP/fonts.json"
osascript -l JavaScript > "$TMP/installed.txt" <<EOF || true
ObjC.import('Foundation');
var s = $.NSString.stringWithContentsOfFileEncodingError('$TMP/fonts.json', $.NSUTF8StringEncoding, null).js;
var d = JSON.parse(s || '{}'), out = [];
(d.SPFontsDataType || []).forEach(function (f) {
  if ((f.path || '').indexOf('/Library/Fonts/MyQuran/') >= 0) return;
  (f.typefaces || []).forEach(function (t) { if (t._name) out.push(t._name + '\t' + (f.path || '')); });
});
out.join('\n');
EOF
echo "  $(wc -l < "$TMP/installed.txt" | tr -d ' ') fonts found"

install_zip() {   # $1 url
  if ! curl -fL --progress-bar "$1" -o "$TMP/f.zip"; then echo "  ! not available: $1"; return 0; fi
  rm -rf "$TMP/x" && mkdir -p "$TMP/x" && unzip -q -o "$TMP/f.zip" -d "$TMP/x"
  local idx="$TMP/x/fonts-index.txt" copied=0 skipped=0
  for f in "$TMP/x/fonts/"*.ttf "$TMP/x/fonts/"*.otf; do
    [ -e "$f" ] || continue
    local name ps
    name="$(basename "$f")"
    ps="$( [ -f "$idx" ] && awk -F'\t' -v n="$name" '$1==n {print $2}' "$idx" )"
    # every other copy of this font in the home folder (Scheherazade installed by hand, older
    # MyQuran installations...) is moved out of the font folders, so Word sees exactly one copy
    local system=""
    while IFS= read -r other; do
      [ -f "$other" ] || continue
      if [ "${other#$HOME/}" != "$other" ]; then
        mkdir -p "$OLD" && mv -f "$other" "$OLD/" && echo "  moved old copy: $other"
      else
        system="$other"                         # /Library/Fonts: needs an administrator
      fi
    done < <(awk -F'\t' -v p="$ps" 'p != "" && $1==p {print $2}' "$TMP/installed.txt" | sort -u)
    if [ -n "$system" ]; then
      echo "  ! $name: already installed for all users ($system), using that copy"
      skipped=$((skipped + 1))
    else
      cp -f "$f" "$FONTS/"
      copied=$((copied + 1))
    fi
  done
  echo "  installed: $copied$( [ $skipped -gt 0 ] && echo ", system copies kept: $skipped" )"
}

say "1/4  MyQuran fonts -> ~/Library/Fonts/MyQuran (clean reinstall)"
rm -rf "$FONTS" && mkdir -p "$FONTS"
install_zip "$SITE/fonts/MyQuran-fonts.zip"

say "2/4  QPC page fonts: Quran Library V1, V2, V4 (3 x 604)"
for v in V1 V2 V4; do echo "QPC $v"; install_zip "$REL/MyQuran-QPC-$v-fonts.zip"; done

say "3/4  Word add-in MyQuran"
mkdir -p "$WEF"
curl -fsSL "$SITE/manifest.xml" -o "$WEF/MyQuran.xml"

say "4/4  Refreshing the font cache"
atsutil databases -removeUser >/dev/null 2>&1 || true
atsutil server -shutdown >/dev/null 2>&1 || true
atsutil server -ping >/dev/null 2>&1 || true

echo; echo "$(ls "$FONTS" | wc -l | tr -d ' ') fonts in $FONTS"
say "Done. Quit Word (Cmd+Q) and open it again. Home -> MyQuran.
Тайёр. Word'ни ёпиб (Cmd+Q) қайта очинг.
Готово. Закройте Word (Cmd+Q) и откройте снова."
[ -d "$OLD" ] && echo "Old font copies: $OLD"
