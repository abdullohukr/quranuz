#!/bin/bash
# Khatt al-Quran installer for macOS: all fonts (incl. QPC V1/V2/V4 page fonts) and the Word add-in.
# Run in Terminal:  curl -fsSL https://quran.abdulloh.org/mac.sh | bash
# Fonts are copied straight into ~/Library/Fonts, like Font Book does (16.93 did not use fonts of a
# subfolder, ~/Library/Fonts/MyQuran in 2.0-2.0.2). Word for Mac lists at most about 2200 font faces when it
# builds its own font list, so the login agent uz.myquran.fonts completes that list (word-fonts.js below).
# The installed file names are kept in ~/Library/Application Support/MyQuran/fonts.txt.
# Every run is a clean reinstall: the fonts of the previous run are removed and other copies of
# the same fonts in the home folder are moved to ~/MyQuran-old-fonts (duplicate fonts make Word
# show "We weren't able to load all of your fonts").
# Uninstall:        curl -fsSL https://quran.abdulloh.org/mac-uninstall.sh | bash
# Options for the setup program (tools/installers/app); without them the script works as before:
#   KHATT_SRC=<dir>        offline: MyQuran-fonts.zip, MyQuran-QPC-V1/V2/V4-fonts.zip and manifest.xml from this folder
#   KHATT_ONLY=fonts,word  install only these parts (default: all)
#   KHATT_UI=1             no colours; progress lines for the program: "@@step <n> <total> <id>",
#                          "@@pct <0-100> <text>", "@@ok <text>", "@@warn <text>", "@@error <text>", "@@done"
set -e
SRC="${KHATT_SRC:-}" UI="" ONLY=",${KHATT_ONLY:-fonts,word},"
if [ "${KHATT_UI:-}" = 1 ]; then UI=1; fi
want() { case "$ONLY" in *",$1,"*) return 0 ;; esac; return 1; }
SITE="https://quran.abdulloh.org"
MIRROR="https://abdullohukr.github.io/quranuz"   # the same site on GitHub Pages
REL="https://github.com/abdullohukr/quranuz/releases/download/fonts"   # QPC packages (GitHub Releases: no traffic limit); our site is the fallback
FONTS="$HOME/Library/Fonts"
LEGACY="$HOME/Library/Fonts/MyQuran"   # 2.0-2.0.2 font folder (Word did not see it)
OLD="$HOME/MyQuran-old-fonts"          # older copies of our fonts are moved here, not deleted
WEF="$HOME/Library/Containers/com.microsoft.Word/Data/Documents/wef"
APP="$HOME/Library/Application Support/MyQuran"
LIST="$APP/fonts.txt"                  # file names of the fonts this installer put into ~/Library/Fonts
STATE="$APP/packages.txt"              # size and ETag of each package installed: unchanged QPC packages are not downloaded again
AGENT="$HOME/Library/LaunchAgents/uz.myquran.fonts.plist"
TMP="$(mktemp -d)"
ERR=""   # an @@error line was printed
trap 'rc=$?; rm -rf "$TMP"; if [ -n "$UI" ] && [ $rc -ne 0 ] && [ -z "$ERR" ]; then echo "@@error exit code $rc"; fi' EXIT

# Output: every step is a coloured heading with its number and the time since the start, then one line per
# language (English, Uzbek, Russian, Arabic); results in green, warnings in yellow.
B=$'\033[1m' DIM=$'\033[2m' CY=$'\033[36m' GR=$'\033[32m' YE=$'\033[33m' RE=$'\033[31m' N=$'\033[0m'
if [ -n "$UI" ]; then B="" DIM="" CY="" GR="" YE="" RE="" N=""; fi
STEP=0 STEPS=0
if want fonts; then STEPS=$((STEPS + 5)); fi
if want word; then STEPS=$((STEPS + 1)); fi
clock() { printf '%02d:%02d' $((SECONDS / 60)) $((SECONDS % 60)); }
step() {   # id, English, Uzbek, Russian, Arabic
  STEP=$((STEP + 1))
  if [ -n "$UI" ]; then echo "@@step $STEP $STEPS $1"; fi
  printf '\n%s%s━━━ %s/%s ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ %s%s\n' "$CY" "$B" "$STEP" "$STEPS" "$(clock)" "$N"
  printf '  %s%s%s\n  %s\n  %s\n  %s\n' "$B" "$2" "$N" "$3" "$4" "$5"
}
ok() { if [ -n "$UI" ]; then echo "@@ok $1"; else printf '  %s✓ %s%s\n' "$GR" "$1" "$N"; fi; }
warn() { if [ -n "$UI" ]; then echo "@@warn $1"; else printf '  %s! %s%s\n' "$YE" "$1" "$N"; fi; }

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

# PostScript names and paths of every installed font (system_profiler takes about a minute: it runs
# while the fonts are downloaded)
scan_fonts() {
  system_profiler SPFontsDataType -json > "$TMP/fonts.json" 2>/dev/null || echo '{}' > "$TMP/fonts.json"
  osascript -l JavaScript > "$TMP/installed.txt" <<EOF 2>/dev/null || : > "$TMP/installed.txt"
ObjC.import('Foundation');
var s = \$.NSString.stringWithContentsOfFileEncodingError('$TMP/fonts.json', \$.NSUTF8StringEncoding, null).js;
var d = JSON.parse(s || '{}'), out = [];
(d.SPFontsDataType || []).forEach(function (f) {
  (f.typefaces || []).forEach(function (t) { if (t._name) out.push(t._name + '\t' + (f.path || '')); });
});
out.join('\n');
EOF
}

# Everything is downloaded and checked BEFORE the installed fonts are touched: when a download failed
# (or a server answered with a web page instead of the zip), the old script had already removed the
# previous fonts and stopped, leaving Word without Scheherazade New.
fetch_zip() {   # $1 file name in $TMP, then URLs to try in order
  local out="$TMP/$1"; shift
  for u in "$@"; do
    if curl -fsSL --retry 4 --retry-delay 2 --retry-all-errors "$u" -o "$out" && unzip -tq "$out" >/dev/null 2>&1; then return 0; fi
    warn "could not get a valid zip from $u"
  done
  rm -f "$out"; return 1
}
# The servers give about 1 MB/s per connection: every package is fetched in 16 MB pieces, 8 at a time,
# while macOS lists the installed fonts (0/4 below). A package whose pieces do not make a valid zip is
# downloaded again in one piece (from the mirror too).
fetch_all() {   # name url, name url...
  : > "$TMP/parts"
  while [ $# -gt 0 ]; do
    local name="$1" url="$2" size etag head i=0 from=0; shift 2
    head="$(curl -fsIL "$url" 2>/dev/null | tr -d '\r')"
    size="$(echo "$head" | awk 'tolower($1)=="content-length:" {n=$2} END {print n+0}')"
    etag="$(echo "$head" | awk 'tolower($1)=="etag:" {e=$2} END {print e}')"
    echo "$name $size $etag" >> "$TMP/heads"
    # a QPC package that has not changed since the last installation, with all its 604 fonts in place: kept
    case "$name" in qpc-*)
      local v="${name#qpc-}"; v="${v%.zip}"
      if [ "$size" -gt 0 ] && grep -qxF "$name $size $etag" "$STATE" 2>/dev/null &&
         [ "$(ls "$FONTS"/QPC-"$v"-p*.ttf 2>/dev/null | wc -l | tr -d ' ')" = 604 ]; then
        echo "$v" >> "$TMP/unchanged"; continue
      fi ;;
    esac
    if [ "$size" -gt 0 ]; then
      while [ $from -lt "$size" ]; do
        echo "$url $TMP/$name.$(printf %03d $i) $from-$((from + 16777215))" >> "$TMP/parts"
        from=$((from + 16777216)); i=$((i + 1))
      done
    fi
    echo "$name $size" >> "$TMP/sizes"
  done
  xargs -P 8 -L 1 sh -c 'curl -fsSL --retry 4 --retry-delay 2 --retry-all-errors -r "$3" "$1" -o "$2" || rm -f "$2"' _ < "$TMP/parts" || true
  while read -r name size; do
    [ -f "$TMP/unchanged" ] && grep -qxF "$(basename "$name" .zip | sed 's/^qpc-//')" "$TMP/unchanged" && continue
    [ "$size" -gt 0 ] && cat "$TMP/$name".[0-9][0-9][0-9] > "$TMP/$name" 2>/dev/null && rm -f "$TMP/$name".[0-9][0-9][0-9]
    if [ "$(wc -c < "$TMP/$name" 2>/dev/null | tr -d ' ')" != "$size" ] || ! unzip -tq "$TMP/$name" >/dev/null 2>&1; then rm -f "$TMP/$name"; fi
  done < "$TMP/sizes"
}
# offline (KHATT_SRC): a package of the folder that is a valid zip is used in place (linked, not copied)
take_zip() {   # $1 name in $TMP, $2 file name in $SRC
  if [ -f "$SRC/$2" ] && unzip -tq "$SRC/$2" >/dev/null 2>&1; then
    ln -sf "$SRC/$2" "$TMP/$1"; echo "$1 $(wc -c < "$SRC/$2" | tr -d ' ') local" >> "$TMP/heads"; return 0
  fi
  warn "no valid $2 in $SRC"; return 1
}
unchanged() { grep -qxF "$1" "$TMP/unchanged" 2>/dev/null; }

if want fonts; then   # ---- fonts: steps 1-4 ----
if [ -n "$SRC" ]; then
step download "Checking the font packages" "Шрифт пакетлари текширилмоқда" "Проверка пакетов шрифтов" "فحص حزم الخطوط"
scan_fonts &
SCAN=$!
take_zip main.zip MyQuran-fonts.zip & J0=$!
take_zip qpc-V1.zip MyQuran-QPC-V1-fonts.zip & J1=$!
take_zip qpc-V2.zip MyQuran-QPC-V2-fonts.zip & J2=$!
take_zip qpc-V4.zip MyQuran-QPC-V4-fonts.zip & J4=$!
else
step download "Downloading the fonts (8 connections)" "Шрифтлар юклаб олинмоқда" "Скачивание шрифтов" "تنزيل الخطوط"
scan_fonts &
SCAN=$!
: > "$TMP/sizes"
fetch_all main.zip "$SITE/fonts/MyQuran-fonts.zip" qpc-V1.zip "$REL/MyQuran-QPC-V1-fonts.zip" \
  qpc-V2.zip "$REL/MyQuran-QPC-V2-fonts.zip" qpc-V4.zip "$REL/MyQuran-QPC-V4-fonts.zip" &
FA=$!
progress() {   # MB downloaded of the total, and the time
  local done total
  done="$(find "$TMP" -maxdepth 1 -type f -name '*.zip*' -exec stat -f %z {} + 2>/dev/null | awk '{s += $1} END {printf "%d", s / 1048576}')"; total="$(awk '{t += $2} END {printf "%d", t / 1048576}' "$TMP/sizes" 2>/dev/null)"
  local left=''
  if [ "${done:-0}" -gt 0 ] && [ "${total:-0}" -gt "$done" ]; then
    left=$(( (SECONDS - DL0) * (total - done) / done ))
    left="$(printf '· left ~%d:%02d' $((left / 60)) $((left % 60)))"
  fi
  if [ -n "$UI" ]; then
    if [ "${total:-0}" -gt 0 ]; then echo "@@pct $((done * 100 / total)) $done / $total MB $left"; fi
  else
    printf '\r  %s%s / %s MB%s   %s %s     ' "$B" "$done" "${total:-?}" "$N" "$(clock)" "$left"
  fi
}
DL0=$SECONDS
while kill -0 $FA 2>/dev/null; do progress; sleep 1; done
progress; echo
[ -f "$TMP/main.zip" ] || fetch_zip main.zip "$SITE/fonts/MyQuran-fonts.zip" "$MIRROR/fonts/MyQuran-fonts.zip" & J0=$!
[ -f "$TMP/qpc-V1.zip" ] || unchanged V1 || fetch_zip qpc-V1.zip "$REL/MyQuran-QPC-V1-fonts.zip" "$SITE/fonts/MyQuran-QPC-V1-fonts.zip" & J1=$!
[ -f "$TMP/qpc-V2.zip" ] || unchanged V2 || fetch_zip qpc-V2.zip "$REL/MyQuran-QPC-V2-fonts.zip" "$SITE/fonts/MyQuran-QPC-V2-fonts.zip" & J2=$!
[ -f "$TMP/qpc-V4.zip" ] || unchanged V4 || fetch_zip qpc-V4.zip "$REL/MyQuran-QPC-V4-fonts.zip" "$SITE/fonts/MyQuran-QPC-V4-fonts.zip" & J4=$!
fi
if ! wait $J0; then
  if [ -n "$UI" ]; then
    ERR=1; if [ -n "$SRC" ]; then echo "@@error No valid MyQuran-fonts.zip in $SRC. Nothing was changed."
    else echo "@@error The fonts could not be downloaded. Nothing was changed."; fi
  fi
  printf '\n  %s%s%s\n  %s\n  %s\n  %s\n' "$RE" "The fonts could not be downloaded. Nothing was changed. Check the internet connection and run the command again." "$N" \
    "Шрифтлар юклаб олинмади, ҳеч нарса ўзгартирилмади. Интернетни текшириб, буйруқни қайта ишга туширинг." \
    "Шрифты не скачались, ничего не изменено. Проверьте интернет и запустите команду ещё раз." \
    "تعذّر تنزيل الخطوط ولم يتغيّر شيء. تحقّق من الاتصال بالإنترنت وأعد تشغيل الأمر."
  exit 1
fi
KEEP=""   # QPC packages whose installed fonts stay: unchanged since the last installation, or not downloaded now
for v in V1 V2 V4; do
  eval "j=\$J${v#V}"
  wait $j || { KEEP="$KEEP $v"; warn "QPC $v not downloaded now; the fonts installed before are kept"; }
  unchanged $v && { KEEP="$KEEP $v"; ok "QPC $v unchanged, already installed: not downloaded again"; }
done
kept() { case " $KEEP " in *" $1 "*) return 0 ;; esac; return 1; }
# unpack all packages at once (each into its own folder)
for z in main qpc-V1 qpc-V2 qpc-V4; do
  [ -f "$TMP/$z.zip" ] && { mkdir -p "$TMP/x-$z" && unzip -q -o "$TMP/$z.zip" -d "$TMP/x-$z" & }
done
wait $SCAN 2>/dev/null || true
wait

if [ -n "$SRC" ]; then ok "ready"; else ok "downloaded"; fi
pgrep -x "Microsoft Word" >/dev/null && { { warn "Word is closed for the installation"; printf '    Word ёпилади\n    Word будет закрыт\n    سيُغلق Word أثناء التثبيت\n'; }; osascript -e 'quit app "Microsoft Word"' >/dev/null 2>&1 || true; sleep 2; }

# remove the previous installation: the 2.0.x folder + its CoreText login agent, and the fonts of the last run
launchctl bootout "gui/$(id -u)/uz.myquran.fonts" >/dev/null 2>&1 || true
rm -f "$HOME/Library/LaunchAgents/uz.myquran.fonts.plist" "$APP/register-fonts.js"
# 3.0-3.4 registered the fonts for the login session too (not needed: fonts in ~/Library/Fonts are on)
[ -f "$LIST" ] && osascript -l JavaScript >/dev/null 2>&1 <<'JS' || true
ObjC.import('CoreText'); ObjC.import('Foundation');
var home = $.NSHomeDirectory().js, urls = $.NSMutableArray.array;
var s = $.NSString.stringWithContentsOfFileEncodingError(home + '/Library/Application Support/MyQuran/fonts.txt', $.NSUTF8StringEncoding, null);
(s.isNil() ? '' : s.js).split('\n').forEach(function (f) { if (f) urls.addObject($.NSURL.fileURLWithPath(home + '/Library/Fonts/' + f)); });
$.CTFontManagerUnregisterFontsForURLs(urls, 3, null);
JS
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
  # clean reinstall only when every package is here; otherwise the new files overwrite the old ones
  # and the fonts of the missing package stay (their names stay in the list)
  # clean reinstall, except the fonts of the kept packages (their names stay in the list)
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    case "$f" in QPC-V[124]-*) v="${f#QPC-}"; kept "${v%%-*}" && { echo "$f" >> "$TMP/list-kept"; continue; } ;; esac
    rm -f "$FONTS/$f"
  done < "$LIST"
fi
mkdir -p "$APP" "$FONTS" && touch "$LIST"
cat "$TMP/list-kept" > "$LIST" 2>/dev/null || : > "$LIST"
# (forget_missing runs only at the end: here the fonts just removed are about to come back at the same
# paths, and unregistering them now made macOS keep them switched off after they were copied back)

step scan "Fonts already on this Mac" "Компьютердаги шрифтлар текширилди" "Проверены шрифты на компьютере" "فحص الخطوط الموجودة على الجهاز"
ok "$(wc -l < "$TMP/installed.txt" | tr -d ' ') fonts found"

install_dir() {   # $1 a package unpacked into $TMP/x-*
  [ -d "$1/fonts" ] || return 0
  local idx="$1/fonts-index.txt" copied=0 skipped=0 name other system
  # every other copy of these fonts in the home folder (Scheherazade installed by hand, older MyQuran
  # installations...) is moved out of the font folders, so Word sees exactly one copy; a copy in
  # /Library/Fonts needs an administrator, so that one is used instead of ours
  : > "$TMP/skip"
  if [ -f "$idx" ]; then
    awk -F'\t' 'NR==FNR {ps[$2]=$1; next} ($1 in ps) {print ps[$1] "\t" $2}' "$idx" "$TMP/installed.txt" | sort -u |
    while IFS=$'\t' read -r name other; do
      [ -f "$other" ] || continue
      [ "$other" = "$FONTS/$name" ] && continue      # our own previous copy, overwritten below
      if [ "${other#$HOME/}" != "$other" ]; then
        mkdir -p "$OLD" && mv -f "$other" "$OLD/" && warn "old copy moved to ~/MyQuran-old-fonts: $other"
      else
        warn "$name: already installed for all users ($other), using that copy"; echo "$name" >> "$TMP/skip"
      fi
    done
  fi
  while IFS= read -r name; do rm -f "$1/fonts/$name"; skipped=$((skipped + 1)); done < "$TMP/skip"
  for f in "$1/fonts/"*.ttf "$1/fonts/"*.otf; do
    [ -e "$f" ] && echo "${f##*/}" >> "$LIST" && copied=$((copied + 1))
  done
  [ $copied -gt 0 ] && cp -f "$1/fonts/"*.[to]tf "$FONTS/"
  ok "$copied installed$( [ $skipped -gt 0 ] && echo ", $skipped system copies kept" )"
}

step fonts "Khatt al-Quran fonts" "Khatt al-Quran шрифтлари" "Шрифты Khatt al-Quran" "خطوط خط القرآن"
install_dir "$TMP/x-main"

step qpc "Mushaf page fonts QPC V1, V2, V4 (3 × 604)" "QPC саҳифа шрифтлари" "Постраничные шрифты QPC" "خطوط صفحات المصحف QPC"
for v in V1 V2 V4; do
  printf '  QPC %s\n' "$v"
  if [ -d "$TMP/x-qpc-$v" ]; then install_dir "$TMP/x-qpc-$v"; else ok "$(grep -c "^QPC-$v-" "$LIST") kept from the last installation"; fi
done
chmod 644 "$FONTS/"*.ttf "$FONTS/"*.otf 2>/dev/null || true
fi   # ---- fonts ----

if want word; then
step word "Word add-in" "Word қўшимчаси" "Надстройка для Word" "الوظيفة الإضافية لبرنامج Word"
mkdir -p "$WEF"
if [ -n "$SRC" ]; then cp -f "$SRC/manifest.xml" "$TMP/manifest.xml" 2>/dev/null || true
else curl -fsSL "$SITE/manifest.xml" -o "$TMP/manifest.xml" || curl -fsSL "$MIRROR/manifest.xml" -o "$TMP/manifest.xml" || true; fi
# older copies of our manifest under another file name (same add-in Id, e.g. manifest.xml 1.0.0.0): Word then
# had two add-ins with one Id and could show the old one; they are moved to ~/MyQuran-old-fonts
for m in "$WEF"/*.xml; do
  [ -f "$m" ] && [ "$m" != "$WEF/MyQuran.xml" ] && grep -q '<Id>5392de1f-c12d-4292-8fb5-64c79333149e</Id>' "$m" &&
    mkdir -p "$OLD" && mv -f "$m" "$OLD/old-addin-$(basename "$m")" && warn "old copy of the add-in moved: $(basename "$m")"
done
if grep -q "<OfficeApp" "$TMP/manifest.xml" 2>/dev/null; then cp -f "$TMP/manifest.xml" "$WEF/MyQuran.xml"; else warn "manifest not downloaded, the add-in keeps its previous version"; fi
[ -f "$WEF/MyQuran.xml" ] && ok "Home -> Khatt al-Quran"
# Word shows the task pane from its WebKit cache; clear it so the current version is loaded
rm -rf "$HOME/Library/Containers/com.microsoft.Word/Data/Library/Caches/WebKit/NetworkCache"
fi

if want fonts; then   # ---- fonts: step 6 ----
sort -u -o "$LIST" "$LIST"
# remember the packages installed now (and the unchanged ones) for the next run
while read -r name size etag; do
  v="${name#qpc-}"; v="${v%.zip}"
  if [ -f "$TMP/$name" ] || unchanged "$v"; then echo "$name $size $etag"; fi
done < "$TMP/heads" > "$TMP/state" 2>/dev/null && mv -f "$TMP/state" "$STATE"
step wordfonts "Word's font list" "Word шрифтлар рўйхати" "Список шрифтов Word" "قائمة الخطوط في Word"
# The fonts are switched on like Font Book does it (persistent user scope). Installers up to 3.4 unregistered
# them at this scope while they were being replaced, and macOS then kept them off at the same paths;
# registering them again switches them back on ("already registered" errors are expected and ignored).
osascript -l JavaScript >/dev/null 2>&1 <<'JS' || true
ObjC.import('CoreText'); ObjC.import('Foundation');
var home = $.NSHomeDirectory().js, urls = $.NSMutableArray.array;
var s = $.NSString.stringWithContentsOfFileEncodingError(home + '/Library/Application Support/MyQuran/fonts.txt', $.NSUTF8StringEncoding, null);
(s.isNil() ? '' : s.js).split('\n').forEach(function (f) { if (f) urls.addObject($.NSURL.fileURLWithPath(home + '/Library/Fonts/' + f)); });
$.CTFontManagerRegisterFontsForURLs(urls, 2, null);
JS
forget_missing
# Word for Mac keeps its own list of the installed fonts and, when it builds that list, stops at about 2200
# font faces (system fonts first, then the user's fonts alphabetically): with the 1812 QPC page fonts,
# Scheherazade New, me_quran and the user's own fonts after "QCF_P3xx" were missing from Word although macOS
# had them ("We weren't able to load all of your fonts"). word-fonts.js completes Word's list and protects it;
# the login agent runs it again when fonts are added or removed and when Word writes a new list.
cat > "$APP/word-fonts.js" <<'WORDFONTS'
// Khatt al-Quran: complete Word for Mac's font list.
// Word 16.1xx keeps its list of installed fonts in systemfontmetadata.json and, when it rebuilds that file,
// stops at about 2200 font faces: system fonts first, then the user's fonts in alphabetical order. With the
// 1812 QPC page fonts, everything after "QCF_P3xx" (Scheherazade New, me_quran, the user's own fonts...) was
// left out. Word reads a complete file without that limit, so this script adds every font file of
// ~/Library/Fonts and /Library/Fonts that is missing, drops entries of deleted files, and protects the file
// (uchg) so that Word's next rebuild does not cut it again. When Word or macOS is updated, the file is removed
// instead: Word builds a fresh one on its next start, and the login agent completes it as soon as it is written.
ObjC.import('Foundation');
var fm = $.NSFileManager.defaultManager, home = $.NSHomeDirectory().js;
var DIR = home + '/Library/Containers/com.microsoft.Word/Data/Library/Application Support/Microsoft/FontCache';
var JSONF = DIR + '/systemfontmetadata.json', STAMP = home + '/Library/Application Support/MyQuran/word-fonts.stamp';
var argv = $.NSProcessInfo.processInfo.arguments.js.map(function (a) { return a.js; });
var mode = argv[argv.length - 1];   // "remove" (uninstaller), otherwise merge

function sh(cmd) {
  var t = $.NSTask.alloc.init, pipe = $.NSPipe.pipe;
  t.launchPath = '/bin/sh'; t.arguments = ['-c', cmd]; t.standardOutput = pipe; t.standardError = $.NSPipe.pipe;
  t.launch; t.waitUntilExit;
  return $.NSString.alloc.initWithDataEncoding(pipe.fileHandleForReading.readDataToEndOfFile, $.NSUTF8StringEncoding).js.trim();
}
function q(p) { return "'" + p.replace(/'/g, "'\\''") + "'"; }
function exists(p) { return fm.fileExistsAtPath(p); }
function readText(p) { var s = $.NSString.stringWithContentsOfFileEncodingError(p, $.NSUTF8StringEncoding, null); return s.isNil() ? null : s.js; }
function writeText(p, s) { $.NSString.alloc.initWithUTF8String(s).writeToFileAtomicallyEncodingError(p, true, $.NSUTF8StringEncoding, null); }
function unlock() { if (exists(JSONF)) sh('chflags nouchg ' + q(JSONF)); }

// ---- the parts of a font file Word's list needs: name table, OS/2, head (TTF, OTF, TTC) ----
function bytes(p) {
  var d = $.NSData.dataWithContentsOfFile(p);
  if (d.isNil()) return null;
  var s = d.base64EncodedStringWithOptions(0).js, A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/', v = {};
  for (var i = 0; i < 64; i++) v[A.charAt(i)] = i;
  var b = new Uint8Array(d.length), o = 0;
  for (var j = 0; j < s.length; j += 4) {
    var n = (v[s.charAt(j)] << 18) | (v[s.charAt(j + 1)] << 12) | ((v[s.charAt(j + 2)] || 0) << 6) | (v[s.charAt(j + 3)] || 0);
    b[o++] = n >> 16 & 255; if (o < b.length) b[o++] = n >> 8 & 255; if (o < b.length) b[o++] = n & 255;
  }
  return b;
}
function u16(b, o) { return (b[o] << 8) | b[o + 1]; }
function u32(b, o) { return ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3]; }
function tag(b, o) { return String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]); }
function face(b, off) {
  var n = u16(b, off + 4), t = {};
  for (var i = 0; i < n; i++) { var r = off + 12 + i * 16; t[tag(b, r)] = u32(b, r + 8); }
  if (t.name === undefined) return null;
  var o = t.name, cnt = u16(b, o + 2), so = o + u16(b, o + 4), win = {}, mac = {};
  for (var j = 0; j < cnt; j++) {
    var r2 = o + 6 + j * 12, pid = u16(b, r2), eid = u16(b, r2 + 2), lid = u16(b, r2 + 4), id = u16(b, r2 + 6), len = u16(b, r2 + 8), at = so + u16(b, r2 + 10), s = '';
    if (pid === 3 && (eid === 1 || eid === 0 || eid === 10) && (lid === 0x409 || win[id] === undefined)) {
      for (var k = 0; k + 1 < len; k += 2) s += String.fromCharCode(u16(b, at + k));
      win[id] = s;
    } else if (pid === 1 && eid === 0 && lid === 0 && mac[id] === undefined) {
      for (var m = 0; m < len; m++) s += String.fromCharCode(b[at + m]);
      mac[id] = s;
    }
  }
  var nm = function (id) { return win[id] !== undefined ? win[id] : mac[id]; };
  var fam = nm(1) || nm(16) || nm(4), sub = nm(2) || 'Regular', w = 400, st = 5, it = false;
  if (t['OS/2'] !== undefined) { w = u16(b, t['OS/2'] + 4); st = u16(b, t['OS/2'] + 6); it = (u16(b, t['OS/2'] + 62) & 1) === 1; }
  if (t.head !== undefined && (u16(b, t.head + 44) & 2)) it = true;
  if (!fam) return null;
  var e = function (v) { return ['en-US', v]; };
  return { fa: e(fam), pf: e(nm(16) || fam), f: e(sub), pa: e(nm(17) || sub), fu: e(nm(4) || fam + ' ' + sub),
           g: e(fam), ps: e(nm(6) || ''), t: e(nm(17) || sub), w: w || 400, st: st || 5, sy: it ? 2 : 0 };
}
function entry(p, ts) {
  var b = bytes(p);
  if (!b || b.length < 12) return null;
  var faces = [], offs = tag(b, 0) === 'ttcf' ? [] : [0];
  if (!offs.length) for (var i = 0, n = u32(b, 8); i < n; i++) offs.push(u32(b, 12 + i * 4));
  offs.forEach(function (o, i) { try { var f = face(b, o); if (f) { f.fi = i; faces.push(f); } } catch (e) {} });
  if (!faces.length) return null;
  faces = faces.map(function (f) { return { fi: f.fi, fa: f.fa, pf: f.pf, f: f.f, pa: f.pa, fu: f.fu, g: f.g, ps: f.ps, t: f.t, w: f.w, st: f.st, sy: f.sy }; });
  return { i: p.split('/').pop(), p: p, s: b.length, ts: ts, l: 1, ft: faces };
}

// ---- main ----
var out = 'nothing to do';
(function () {
  if (mode === 'remove') { unlock(); fm.removeItemAtPathError(JSONF, null); fm.removeItemAtPathError(STAMP, null); out = 'Word font list reset'; return; }
  if (!exists(DIR)) { out = 'Word has not been started yet'; return; }
  // Word or macOS updated: let Word build a fresh list (the agent completes it right after)
  var stamp = sh("defaults read '/Applications/Microsoft Word.app/Contents/Info' CFBundleVersion 2>/dev/null; sw_vers -buildVersion");
  var old = readText(STAMP);
  if (old !== stamp) {
    writeText(STAMP, stamp);
    if (old !== null) {
      unlock(); fm.removeItemAtPathError(JSONF, null);
      out = 'Word or macOS changed: Word rebuilds its font list on the next start'; return;
    }
  }
  if (!exists(JSONF)) { out = 'Word has not written its font list yet'; return; }
  var d; try { d = JSON.parse(readText(JSONF)); } catch (e) { out = 'unreadable font list, left alone'; return; }
  if (d.vm !== 1 || !d.fl) { out = 'unknown font list format ' + d.vm + '.' + d.vi + ', left alone'; return; }
  var have = {}, keep = [], dropped = 0, added = 0, ts = 0;
  d.fl.forEach(function (x) {
    if (exists(x.p)) { keep.push(x); have[x.p] = 1; if (x.ts > ts) ts = x.ts; } else dropped++;
  });
  [home + '/Library/Fonts', '/Library/Fonts'].forEach(function (dir) {
    var list = fm.contentsOfDirectoryAtPathError(dir, null);
    (list.isNil() ? [] : list.js.map(function (f) { return f.js; })).sort().forEach(function (f) {
      var p = dir + '/' + f;
      if (have[p] || !/\.(ttf|otf|ttc|otc)$/i.test(f)) return;
      var x = entry(p, ts);
      if (x) { keep.push(x); have[p] = 1; added++; }
    });
  });
  var locked = sh('ls -lO ' + q(JSONF)).indexOf('uchg') >= 0;
  if (!added && !dropped && locked) return;   // complete and protected: do not touch (no write, no new event)
  d.fl = keep;
  d.fc = keep.reduce(function (n, x) { return n + x.ft.length; }, 0);
  unlock(); writeText(JSONF, JSON.stringify(d)); sh('chflags uchg ' + q(JSONF));
  out = 'Word font list: ' + d.fc + ' faces (' + added + ' added, ' + dropped + ' removed)';
})();
out;
WORDFONTS
WFJ="$HOME/Library/Containers/com.microsoft.Word/Data/Library/Application Support/Microsoft/FontCache/systemfontmetadata.json"
cat > "$AGENT" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>uz.myquran.fonts</string>
  <key>ProgramArguments</key><array>
    <string>/usr/bin/osascript</string><string>-l</string><string>JavaScript</string>
    <string>$APP/word-fonts.js</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>WatchPaths</key><array>
    <string>$WFJ</string>
    <string>$FONTS</string>
    <string>/Library/Fonts</string>
  </array>
</dict></plist>
EOF
ok "$(osascript -l JavaScript "$APP/word-fonts.js" 2>&1)"
mkdir -p "$HOME/Library/LaunchAgents"
launchctl bootstrap "gui/$(id -u)" "$AGENT" >/dev/null 2>&1 || true

ok="$(osascript -l JavaScript 2>/dev/null <<'JS' || true
ObjC.import('AppKit'); ObjC.import('CoreText');
var f = $.NSFont.fontWithNameSize('ScheherazadeNew-Regular', 12);
var scope = $.CTFontManagerGetScopeForURL($.NSURL.fileURLWithPath($.NSHomeDirectory().js + '/Library/Fonts/ScheherazadeNew-Regular.ttf'));
(!f.isNil() && f.fontName.js === 'ScheherazadeNew-Regular' ? 'yes' : 'no') + ' ' + scope;
JS
)"
case "$ok" in
  yes*) ok "$(wc -l < "$LIST" | tr -d ' ') fonts in ~/Library/Fonts, Scheherazade New works" ;;
  *) warn "Scheherazade New is not active yet ($ok). Restart the Mac and open Word again; if it stays, send the output of:"
     echo "    curl -fsSL $SITE/mac-check.sh | bash" ;;
esac
fi   # ---- fonts ----
printf '\n%s%s━━━ Done in %d min %02d s ━━━━━━━━━━━━━━━━━━━━━━━━━━━%s\n' "$GR" "$B" $((SECONDS / 60)) $((SECONDS % 60)) "$N"
printf '  %sOpen Word: Home → Khatt al-Quran.%s If the Arabic text is in a plain font, quit Word (Cmd+Q) and open it again.\n' "$B" "$N"
printf '  Тайёр. Word\x27ни очинг: Главная → Khatt al-Quran. Араб матни оддий шрифтда бўлса, Word\x27ни ёпиб (Cmd+Q) қайта очинг.\n'
printf '  Готово. Откройте Word: Главная → Khatt al-Quran. Если арабский текст обычным шрифтом — закройте Word (Cmd+Q) и откройте снова.\n'
printf '  تمّ التثبيت. افتح Word: الصفحة الرئيسية ← Khatt al-Quran. إذا ظهر النص العربي بخط عادي فأغلق Word (Cmd+Q) وافتحه من جديد.\n'
[ -d "$OLD" ] && printf '  %sOld font copies: %s%s\n' "$DIM" "$OLD" "$N"
if [ -n "$UI" ]; then echo "@@done"; fi
true
