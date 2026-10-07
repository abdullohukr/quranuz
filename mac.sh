#!/bin/bash
# Khatt al-Quran installer for macOS: all fonts (incl. QPC V1/V2/V4 page fonts) and the Word add-in.
# Run in Terminal:  curl -fsSL https://quran.abdulloh.org/mac.sh | bash
# Fonts are copied straight into ~/Library/Fonts, like Font Book does, AND registered with CoreText
# now and at every login (LaunchAgent uz.myquran.fonts). Word for Mac needs either one depending on
# its version: 16.93 did not use fonts of a subfolder (~/Library/Fonts/MyQuran, 2.0-2.0.2) even when
# registered; 16.111 did not use fonts that were only copied, until they were registered.
# The installed file names are kept in ~/Library/Application Support/MyQuran/fonts.txt.
# Every run is a clean reinstall: the fonts of the previous run are removed and other copies of
# the same fonts in the home folder are moved to ~/MyQuran-old-fonts (duplicate fonts make Word
# show "We weren't able to load all of your fonts").
# Uninstall:        curl -fsSL https://quran.abdulloh.org/mac-uninstall.sh | bash
set -e
SITE="https://quran.abdulloh.org"
REL="https://github.com/abdullohukr/quranuz/releases/download/fonts"
FONTS="$HOME/Library/Fonts"
LEGACY="$HOME/Library/Fonts/MyQuran"   # 2.0-2.0.2 font folder (Word did not see it)
OLD="$HOME/MyQuran-old-fonts"          # older copies of our fonts are moved here, not deleted
WEF="$HOME/Library/Containers/com.microsoft.Word/Data/Documents/wef"
APP="$HOME/Library/Application Support/MyQuran"
LIST="$APP/fonts.txt"                  # file names of the fonts this installer put into ~/Library/Fonts
AGENT="$HOME/Library/LaunchAgents/uz.myquran.fonts.plist"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

say() { printf '\n\033[1m%s\033[0m\n' "$1"; }

# Fonts that are still registered but whose files are gone (an older MyQuran folder, fonts deleted by
# hand) make Word say "We weren't able to load all of your fonts": unregister every font of
# ~/Library/Fonts whose file no longer exists (2 = persistent/user scope, 3 = login session).
forget_missing() {
  osascript -l JavaScript 2>/dev/null <<'JS' || true
ObjC.import('CoreText'); ObjC.import('Foundation');
var fm = $.NSFileManager.defaultManager, home = $.NSHomeDirectory().js + '/Library/Fonts/', gone = $.NSMutableArray.array, n = 0;
ObjC.castRefToObject($.CTFontManagerCopyAvailableFontURLs()).js.forEach(function (u) {
  var p = u.path.js;
  if (p.indexOf(home) === 0 && !fm.fileExistsAtPath(p)) { gone.addObject(u); n++; }
});
if (n) { $.CTFontManagerUnregisterFontsForURLs(gone, 2, null); $.CTFontManagerUnregisterFontsForURLs(gone, 3, null); }
n ? '  removed ' + n + ' registrations of missing font files' : '';
JS
}

pgrep -x "Microsoft Word" >/dev/null && { echo "Quit Word first (Cmd+Q) / Avval Word'ni yoping / Сначала закройте Word"; osascript -e 'quit app "Microsoft Word"' >/dev/null 2>&1 || true; sleep 2; }

# remove the previous installation: the 2.0.x folder + its CoreText login agent, and the fonts of the last run
launchctl bootout "gui/$(id -u)/uz.myquran.fonts" >/dev/null 2>&1 || true
rm -f "$HOME/Library/LaunchAgents/uz.myquran.fonts.plist" "$APP/register-fonts.js"
if [ -d "$LEGACY" ]; then
  osascript -l JavaScript >/dev/null 2>&1 <<'JS' || true
ObjC.import('CoreText'); ObjC.import('Foundation');
var dir = $.NSHomeDirectory().js + '/Library/Fonts/MyQuran', list = $.NSFileManager.defaultManager.contentsOfDirectoryAtPathError(dir, null);
var urls = $.NSMutableArray.array;
(list.isNil() ? [] : list.js).forEach(function (f) { urls.addObject($.NSURL.fileURLWithPath(dir + '/' + f.js)); });
$.CTFontManagerUnregisterFontsForURLs(urls, 3, null);
JS
  rm -rf "$LEGACY"
fi
if [ -f "$LIST" ]; then
  while IFS= read -r f; do [ -n "$f" ] && rm -f "$FONTS/$f"; done < "$LIST"
fi
mkdir -p "$APP" "$FONTS" && : > "$LIST"
forget_missing

say "0/4  Checking installed fonts (about a minute) / Ўрнатилган шрифтлар текширилмоқда"
# PostScript names and paths of every installed font
system_profiler SPFontsDataType -json > "$TMP/fonts.json" 2>/dev/null || echo '{}' > "$TMP/fonts.json"
osascript -l JavaScript > "$TMP/installed.txt" <<EOF || true
ObjC.import('Foundation');
var s = $.NSString.stringWithContentsOfFileEncodingError('$TMP/fonts.json', $.NSUTF8StringEncoding, null).js;
var d = JSON.parse(s || '{}'), out = [];
(d.SPFontsDataType || []).forEach(function (f) {
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
      cp -f "$f" "$FONTS/" && echo "$name" >> "$LIST"
      copied=$((copied + 1))
    fi
  done
  echo "  installed: $copied$( [ $skipped -gt 0 ] && echo ", system copies kept: $skipped" )"
}

say "1/4  Khatt al-Quran fonts -> ~/Library/Fonts (clean reinstall)"
install_zip "$SITE/fonts/MyQuran-fonts.zip"

say "2/4  QPC page fonts: Quran Library V1, V2, V4 (3 x 604)"
for v in V1 V2 V4; do echo "QPC $v"; install_zip "$REL/MyQuran-QPC-$v-fonts.zip"; done

say "3/4  Word add-in Khatt al-Quran"
mkdir -p "$WEF"
curl -fsSL "$SITE/manifest.xml" -o "$WEF/MyQuran.xml"

say "4/4  Registering the fonts for Word / Шрифтлар Word учун рўйхатдан ўтказилмоқда"
mkdir -p "$HOME/Library/LaunchAgents"
# JXA: register the fonts listed in fonts.txt for the login session (3 = kCTFontManagerScopeSession)
cat > "$APP/register-fonts.js" <<'EOF'
ObjC.import('CoreText'); ObjC.import('Foundation');
var home = $.NSHomeDirectory().js, n = 0, urls = $.NSMutableArray.array;
var s = $.NSString.stringWithContentsOfFileEncodingError(home + '/Library/Application Support/MyQuran/fonts.txt', $.NSUTF8StringEncoding, null);
(s.isNil() ? '' : s.js).split('\n').forEach(function (f) {
  if (f) { urls.addObject($.NSURL.fileURLWithPath(home + '/Library/Fonts/' + f)); n++; }
});
$.CTFontManagerUnregisterFontsForURLs(urls, 3, null);
$.CTFontManagerRegisterFontsForURLs(urls, 3, null);
n + ' fonts registered';
EOF
cat > "$AGENT" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>uz.myquran.fonts</string>
  <key>ProgramArguments</key><array>
    <string>/usr/bin/osascript</string><string>-l</string><string>JavaScript</string>
    <string>$APP/register-fonts.js</string>
  </array>
  <key>RunAtLoad</key><true/>
</dict></plist>
EOF
launchctl bootstrap "gui/$(id -u)" "$AGENT" >/dev/null 2>&1 || true
echo "  $(osascript -l JavaScript "$APP/register-fonts.js")"
forget_missing
# Word remembers fonts it could not find; the cache is rebuilt on the next start
rm -f "$HOME/Library/Containers/com.microsoft.Word/Data/Library/Caches/Microsoft/fontLookupCache"*.plist
# Word shows the task pane from its WebKit cache; clear it so the current version is loaded
rm -rf "$HOME/Library/Containers/com.microsoft.Word/Data/Library/Caches/WebKit/NetworkCache"

echo; echo "$(wc -l < "$LIST" | tr -d ' ') fonts in $FONTS"
say "Done. Quit Word (Cmd+Q) and open it again. Home -> Khatt al-Quran.
If the Arabic text is still in a plain font, quit and open Word once more (macOS is still activating the fonts).
Тайёр. Word'ни ёпиб (Cmd+Q) қайта очинг. Араб матни ҳали оддий шрифтда бўлса, Word'ни яна бир марта ёпиб очинг.
Готово. Закройте Word (Cmd+Q) и откройте снова. Если арабский текст всё ещё обычным шрифтом — закройте и откройте Word ещё раз."
[ -d "$OLD" ] && echo "Old font copies: $OLD"
