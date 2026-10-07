#!/bin/bash
# Khatt al-Quran: remove its fonts and the Word add-in (macOS).
APP="$HOME/Library/Application Support/MyQuran"
launchctl bootout "gui/$(id -u)/uz.myquran.fonts" >/dev/null 2>&1 || true
rm -f "$HOME/Library/LaunchAgents/uz.myquran.fonts.plist"
# fonts in ~/Library/Fonts listed by the installer: unregister (login session, 3.0-3.4), then delete
osascript -l JavaScript >/dev/null 2>&1 <<'JS' || true
ObjC.import('CoreText'); ObjC.import('Foundation');
var home = $.NSHomeDirectory().js, urls = $.NSMutableArray.array;
var s = $.NSString.stringWithContentsOfFileEncodingError(home + '/Library/Application Support/MyQuran/fonts.txt', $.NSUTF8StringEncoding, null);
(s.isNil() ? '' : s.js).split('\n').forEach(function (f) { if (f) urls.addObject($.NSURL.fileURLWithPath(home + '/Library/Fonts/' + f)); });
$.CTFontManagerUnregisterFontsForURLs(urls, 3, null);
JS
if [ -f "$APP/fonts.txt" ]; then
  while IFS= read -r f; do [ -n "$f" ] && rm -f "$HOME/Library/Fonts/$f"; done < "$APP/fonts.txt"
fi
# 2.0-2.0.2: font folder ~/Library/Fonts/MyQuran registered with CoreText by a login agent
launchctl bootout "gui/$(id -u)/uz.myquran.fonts" >/dev/null 2>&1 || true
rm -f "$HOME/Library/LaunchAgents/uz.myquran.fonts.plist"
osascript -l JavaScript >/dev/null 2>&1 <<'JS' || true
ObjC.import('CoreText'); ObjC.import('Foundation');
var dir = $.NSHomeDirectory().js + '/Library/Fonts/MyQuran', list = $.NSFileManager.defaultManager.contentsOfDirectoryAtPathError(dir, null);
var urls = $.NSMutableArray.array;
(list.isNil() ? [] : list.js).forEach(function (f) { urls.addObject($.NSURL.fileURLWithPath(dir + '/' + f.js)); });
$.CTFontManagerUnregisterFontsForURLs(urls, 3, null);
JS
rm -rf "$HOME/Library/Fonts/MyQuran" "$APP"
rm -f "$HOME/Library/Containers/com.microsoft.Word/Data/Documents/wef/MyQuran.xml"
# forget registrations of the deleted font files (otherwise Word: "We weren't able to load all of your fonts")
osascript -l JavaScript >/dev/null 2>&1 <<'JS' || true
ObjC.import('CoreText'); ObjC.import('Foundation');
var fm = $.NSFileManager.defaultManager, home = $.NSHomeDirectory().js + '/Library/Fonts/', gone = $.NSMutableArray.array;
ObjC.castRefToObject($.CTFontManagerCopyAvailableFontURLs()).js.forEach(function (u) {
  if (u.path.js.indexOf(home) === 0 && !fm.fileExistsAtPath(u.path.js)) gone.addObject(u);
});
$.CTFontManagerUnregisterFontsForURLs(gone, 2, null); $.CTFontManagerUnregisterFontsForURLs(gone, 3, null);
JS
# Word's font list completed and protected by the installer: Word builds its own again on the next start
WFJ="$HOME/Library/Containers/com.microsoft.Word/Data/Library/Application Support/Microsoft/FontCache/systemfontmetadata.json"
[ -f "$WFJ" ] && { chflags nouchg "$WFJ" 2>/dev/null; rm -f "$WFJ"; }
echo "Khatt al-Quran removed. Restart Word."
