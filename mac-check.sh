#!/bin/bash
# Khatt al-Quran: what the Mac knows about the fonts (changes nothing). Send the output to quran@abdulloh.org.
# Run in Terminal:  curl -fsSL https://quran.abdulloh.org/mac-check.sh | bash
FONTS="$HOME/Library/Fonts"
LIST="$HOME/Library/Application Support/MyQuran/fonts.txt"
h() { printf '\n== %s\n' "$1"; }

h "System"
sw_vers -productVersion 2>/dev/null | sed 's/^/macOS /'
defaults read "/Applications/Microsoft Word.app/Contents/Info" CFBundleShortVersionString 2>/dev/null | sed 's/^/Word /' || echo "Word: not in /Applications"

h "Scheherazade New files"
ls -la "$FONTS"/Scheherazade* /Library/Fonts/Scheherazade* 2>/dev/null; true
mdfind "kMDItemFSName == 'ScheherazadeNew*'c" 2>/dev/null | sed 's/^/found: /' | head -20

h "Installer list"
if [ -f "$LIST" ]; then echo "$(wc -l < "$LIST" | tr -d ' ') fonts listed; Scheherazade: $(grep -c -i scheherazade "$LIST")"; else echo "no fonts.txt (installer not run or removed)"; fi
[ -d "$HOME/MyQuran-old-fonts" ] && echo "old copies folder: $(ls "$HOME/MyQuran-old-fonts" | wc -l | tr -d ' ') files"

h "CoreText (what Word asks macOS)"
osascript -l JavaScript 2>&1 <<'JS'
ObjC.import('AppKit'); ObjC.import('CoreText'); ObjC.import('Foundation');
var out = [], fm = $.NSFileManager.defaultManager, home = $.NSHomeDirectory().js;
['ScheherazadeNew-Regular', 'ScheherazadeNew-Bold'].forEach(function (ps) {
  var f = $.NSFont.fontWithNameSize(ps, 12);
  out.push(ps + ': ' + (f.isNil() ? 'NOT AVAILABLE (Word uses a fallback font)' : 'available as ' + f.fontName.js));
});
// registration scope of each Scheherazade file: 0 none, 1 process, 2 persistent (user), 3 session
var files = [home + '/Library/Fonts/ScheherazadeNew-Regular.ttf', home + '/Library/Fonts/ScheherazadeNew-Bold.ttf'];
files.forEach(function (p) {
  if (!fm.fileExistsAtPath(p)) { out.push(p + ': no file'); return; }
  out.push(p + ': scope ' + $.CTFontManagerGetScopeForURL($.NSURL.fileURLWithPath(p)));
});
var n = 0, gone = 0;
ObjC.castRefToObject($.CTFontManagerCopyAvailableFontURLs()).js.forEach(function (u) {
  var p = u.path.js;
  if (/scheherazade/i.test(p)) { n++; if (!fm.fileExistsAtPath(p)) gone++; out.push('registered: ' + p + (fm.fileExistsAtPath(p) ? '' : '  (FILE MISSING)')); }
});
out.push(n + ' registered Scheherazade files, ' + gone + ' of them missing');
out.join('\n');
JS
ls -l@ "$HOME/Library/Fonts/ScheherazadeNew-Regular.ttf" 2>/dev/null | head -3

h "Word's own font list (Word lists only ~2200 faces unless the installer completed it)"
WFJ="$HOME/Library/Containers/com.microsoft.Word/Data/Library/Application Support/Microsoft/FontCache/systemfontmetadata.json"
if [ -f "$WFJ" ]; then
  ls -lO "$WFJ" | awk '{print "flags: " $5}'
  osascript -l JavaScript 2>&1 <<JS
ObjC.import('Foundation');
var d = JSON.parse(\$.NSString.stringWithContentsOfFileEncodingError('$WFJ', \$.NSUTF8StringEncoding, null).js);
var sch = d.fl.filter(function (x) { return /scheherazade/i.test(x.p); }).length;
d.fc + ' faces, ' + d.fl.length + ' files; Scheherazade New files in the list: ' + sch;
JS
else echo "no font list yet (Word not started since the install)"; fi

h "Login agent"
launchctl print "gui/$(id -u)/uz.myquran.fonts" 2>/dev/null | grep -E "state|last exit|runs" || echo "agent uz.myquran.fonts not loaded"

h "Downloads"
for u in https://quran.abdulloh.org/fonts/MyQuran-fonts.zip https://abdullohukr.github.io/quranuz/fonts/MyQuran-fonts.zip https://quran.abdulloh.org/manifest.xml; do
  printf '%s  ' "$u"; curl -sSL -o /dev/null -w '%{http_code} %{content_type} %{size_download} bytes\n' "$u" 2>&1
done
