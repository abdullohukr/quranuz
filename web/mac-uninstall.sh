#!/bin/bash
# MyQuran: remove its fonts and the Word add-in (macOS).
launchctl bootout "gui/$(id -u)/uz.myquran.fonts" >/dev/null 2>&1 || true
rm -f "$HOME/Library/LaunchAgents/uz.myquran.fonts.plist"
# unregister the fonts of this login session (3 = kCTFontManagerScopeSession)
osascript -l JavaScript >/dev/null 2>&1 <<'JS' || true
ObjC.import('CoreText'); ObjC.import('Foundation');
var dir = $.NSHomeDirectory().js + '/Library/Fonts/MyQuran', list = $.NSFileManager.defaultManager.contentsOfDirectoryAtPathError(dir, null);
var urls = $.NSMutableArray.array;
(list.isNil() ? [] : list.js).forEach(function (f) { urls.addObject($.NSURL.fileURLWithPath(dir + '/' + f.js)); });
$.CTFontManagerUnregisterFontsForURLs(urls, 3, null);
JS
rm -rf "$HOME/Library/Fonts/MyQuran" "$HOME/Library/Application Support/MyQuran"
rm -f "$HOME/Library/Containers/com.microsoft.Word/Data/Documents/wef/MyQuran.xml"
echo "MyQuran removed. Restart Word."
