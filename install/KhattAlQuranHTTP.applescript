-- Khatt al-Quran for Word on the Mac: the helper of the ribbon tab (KhattAlQuran.dotm, word-tab/KhattAlQuran.bas).
-- VBA in the sandboxed Word cannot download anything; it calls these handlers with AppleScriptTask. web/mac.sh compiles
-- this file (osacompile) into ~/Library/Application Scripts/com.microsoft.Word/KhattAlQuranHTTP.scpt.
-- Only our site: the address is fixed here, the macro chooses one of the allowed files and a .json file in Word's
-- own container to write it to. Nothing is sent: plain GET requests of public files.

-- arg: "<api path>" & tab & "<destination>", e.g. "v1/sura/2.json" + tab + ".../Containers/com.microsoft.Word/Data/tmp/khatt-al-quran-sura-2.json"
-- Returns the HTTP status ("200"; "000": no connection or time out; "400": refused here).
on khattGet(arg)
	set oldDelims to AppleScript's text item delimiters
	set AppleScript's text item delimiters to tab
	set parts to text items of arg
	set AppleScript's text item delimiters to oldDelims
	if (count of parts) is not 2 then return "400"
	set apiPath to item 1 of parts
	set dest to item 2 of parts
	if not my okPath(apiPath) then return "400"
	if dest does not end with ".json" or dest does not contain "/Containers/com.microsoft.Word/" or dest contains ".." or dest does not start with "/" then return "400"
	set theURL to "https://quran.abdulloh.org/api/" & apiPath
	set partFile to dest & ".part"
	set cmd to "c=$(/usr/bin/curl -sS -L --proto =https --proto-redir =https --max-time 30 --connect-timeout 10 --max-filesize 4000000 -o " & quoted form of partFile & " -w '%{http_code}' " & quoted form of theURL & " 2>/dev/null); r=$?; [ $r = 0 ] && [ \"$c\" = 200 ] && /bin/mv -f " & quoted form of partFile & " " & quoted form of dest & " || /bin/rm -f " & quoted form of partFile & "; [ $r = 0 ] || [ \"$c\" != 200 ] || c=000; printf '%s' \"${c:-000}\""
	try
		return do shell script cmd
	on error
		return "000"
	end try
end khattGet

-- page: one page of the site, opened in the default browser. Returns "ok" or "400".
on khattOpen(page)
	if page is not in {"index.html", "help.html", "releases.html", "install.html"} then return "400"
	open location "https://quran.abdulloh.org/" & page
	return "ok"
end khattOpen

-- "v1/word-tab.json" or "v1/sura/<1..114>.json"
on okPath(p)
	if p is "v1/word-tab.json" then return true
	try
		if p does not start with "v1/sura/" or p does not end with ".json" then return false
		set n to text 9 thru -6 of p
		if (count of n) < 1 or (count of n) > 3 then return false
		repeat with c in (characters of n)
			if (contents of c) is not in {"0", "1", "2", "3", "4", "5", "6", "7", "8", "9"} then return false
		end repeat
		set k to n as integer
		return k ≥ 1 and k ≤ 114
	on error
		return false
	end try
end okPath
