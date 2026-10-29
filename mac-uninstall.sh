#!/bin/bash
# Khatt al-Quran: remove its fonts and the Word add-in (macOS).
#   curl -fsSL https://quran.abdulloh.org/mac-uninstall.sh | bash
#   KHATT_ONLY=word-tab: only the "Khatt al-Quran" ribbon tab (KhattAlQuran.dotm and its helper script go to the Trash);
#   nothing else is touched (tests run it with HOME=<a test folder>)
APP="$HOME/Library/Application Support/MyQuran"
to_trash() {   # $1 file: into ~/.Trash under a free name
  [ -e "$1" ] || return 0
  local t="$HOME/.Trash/$(basename "$1")"
  [ -e "$t" ] && t="$HOME/.Trash/$(basename "$1") $(date +%Y%m%d-%H%M%S)"
  mkdir -p "$HOME/.Trash" && mv -f "$1" "$t" 2>/dev/null || true
}
# the ribbon tab: the Startup template in every spelling of Word's Startup folder, and the helper of its macro
remove_word_tab() {
  local uc st f n=0
  for uc in "User Content.localized" "User Content"; do
    for st in "Startup.localized" "Startup"; do
      f="$HOME/Library/Group Containers/UBF8T346G9.Office/$uc/$st/Word/KhattAlQuran.dotm"
      [ -e "$f" ] && { to_trash "$f"; n=$((n + 1)); }
    done
  done
  to_trash "$HOME/Library/Application Scripts/com.microsoft.Word/KhattAlQuranHTTP.scpt"
  [ $n -gt 0 ] && echo "The Khatt al-Quran ribbon tab is in the Trash. Restart Word."
  return 0
}
if [ "${KHATT_ONLY:-}" = word-tab ]; then remove_word_tab; exit 0; fi
remove_word_tab
# the agent that kept the add-in manifest up to date: stopped, its files go to the Trash (not deleted)
launchctl bootout "gui/$(id -u)/org.abdulloh.khatt-manifest" >/dev/null 2>&1 || true
to_trash "$HOME/Library/LaunchAgents/org.abdulloh.khatt-manifest.plist"
to_trash "$APP/khatt-manifest.sh"
to_trash "$HOME/Library/Containers/com.microsoft.Word/Data/Documents/wef/MyQuran.xml.bak"
to_trash "$HOME/Library/Logs/khatt-manifest.log"
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
# Adobe panels (installations with KHATT_ADOBE=1): only what the installer put there, listed in adobe.txt
if [ -f "$APP/adobe.txt" ]; then
  UPIA="/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS/UnifiedPluginInstallerAgent"
  if grep -q '^uxp ' "$APP/adobe.txt" && [ -x "$UPIA" ]; then "$UPIA" --remove "Khatt al-Quran" >/dev/null 2>&1 || true; fi
  CEP="$HOME/Library/Application Support/Adobe/CEP/extensions/com.abdulloh.khatt-al-quran.cep"
  if grep -q '^cep user ' "$APP/adobe.txt" && [ -d "$CEP" ] && [ ! -L "$CEP" ] &&
     grep -q 'ExtensionBundleId="com.abdulloh.khatt-al-quran.cep"' "$CEP/CSXS/manifest.xml" 2>/dev/null; then rm -rf "$CEP"; fi
fi
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
