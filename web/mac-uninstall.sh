#!/bin/bash
# MyQuran: remove its fonts and the Word add-in (macOS).
rm -rf "$HOME/Library/Fonts/MyQuran"
rm -f "$HOME/Library/Containers/com.microsoft.Word/Data/Documents/wef/MyQuran.xml"
echo "MyQuran removed. Restart Word."
