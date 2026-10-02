<div align="center">

<img src="web/assets/icon-128.png" width="96" alt="MyQuran">

# MyQuran

**Quran add-in for Microsoft Word and the web**

Find ayahs and insert them into your document without mistakes: Arabic text (several mushafs),
translations in 80+ languages, tafsirs, isti'adhah, basmalah and a source reference.

[Ўзбекча](README.md) · [Русский](README.ru.md) · **English**

[🌐 Website](https://abdullohukr.github.io/quranuz/) · [⬇️ Install](https://abdullohukr.github.io/quranuz/install.html) · [📝 Changelog](CHANGELOG.md)

</div>

---

## Features

| | |
|---|---|
| 🔎 **Search** | surah and ayah number (`2:255`, `2 30-37`), surah name (`Al-Baqarah 255`, `Бақара 30`, `البقرة ٥`), Arabic text with or without diacritics (`قل اعوذ برب الناس`, `ٱلرَّحۡمَـٰنِ`), the text of any selected translation in any language |
| 🖱️ **Word selection** | drag over words with the mouse, or click the first and the last word; Shift+click extends the range |
| 📖 **Mushafs** | Madinah Mushaf (tafsir.one), Quran Library — Hafs, Uthmani, Imlaei, Indopak, Indopak Nastaleeq, Nastaleeq, Digital Khatt, **Tajweed (colour)**, **Quran Library V1 / V2 / V4** (page fonts — for academic work) |
| 🌍 **Translations** | Alovuddin Mansur and Muhammad Sodiq Muhammad Yusuf (Uzbek) + **~200 translations in 80+ languages** from QUL; several at once |
| 📚 **Tafsirs** | Muyassar, Mukhtasar (Uzbek) + **~100 tafsirs in 30+ languages** from QUL; several at once, one commentary for a group of ayahs |
| ✍️ **Extras** | ﴿ ﴾ brackets, isti'adhah, basmalah, reference like `[يونس ١]`, insert as new paragraph |
| 🎨 **Formatting** | Arabic in bold; translation in bold, explanations in `( )` and `[ ]` regular, reference in italics; per-language quotes and text direction |
| ⓘ **About the surah** | information about every surah (English for now) |
| 🗣️ **Interface** | 22 languages (Uzbek by default) |
| 💾 **Settings** | everything is remembered |
| 🔤 **Fonts** | one-command install (Mac / Windows) into a separate `MyQuran` folder |

## Install

The installer adds **all fonts** (mushaf fonts and QPC V1/V2/V4 page fonts, into a separate `MyQuran` folder)
and the **MyQuran add-in for Word**. No administrator rights needed.

**Windows 10 / 11** — open PowerShell and paste:

```powershell
irm https://abdullohukr.github.io/quranuz/win.txt | iex
```

**macOS** — open Terminal and paste:

```bash
curl -fsSL https://abdullohukr.github.io/quranuz/mac.sh | bash
```

Then restart Word: **Home → MyQuran** (Mac: Insert → Add-ins → My Add-ins → MyQuran).

<details>
<summary>Manual install, uninstall, Word Online</summary>

- Files: [MyQuran-Install-Windows.bat](https://abdullohukr.github.io/quranuz/install/MyQuran-Install-Windows.bat),
  [MyQuran-Install-Mac.command](https://abdullohukr.github.io/quranuz/install/MyQuran-Install-Mac.command) (right-click → Open).
- Fonts only: [MyQuran-fonts.zip](https://abdullohukr.github.io/quranuz/fonts/MyQuran-fonts.zip),
  [QPC V1](https://github.com/abdullohukr/quranuz/releases/download/fonts/MyQuran-QPC-V1-fonts.zip),
  [QPC V2](https://github.com/abdullohukr/quranuz/releases/download/fonts/MyQuran-QPC-V2-fonts.zip),
  [QPC V4](https://github.com/abdullohukr/quranuz/releases/download/fonts/MyQuran-QPC-V4-fonts.zip).
- Word Online: Insert → Add-ins → Upload My Add-in → [manifest.xml](https://abdullohukr.github.io/quranuz/manifest.xml).
- Uninstall: Windows — `irm https://abdullohukr.github.io/quranuz/win-uninstall.txt | iex`;
  macOS — `curl -fsSL https://abdullohukr.github.io/quranuz/mac-uninstall.sh | bash`.
- Font folders: macOS — `~/Library/Fonts/MyQuran`, Windows — `%LOCALAPPDATA%\MyQuran\Fonts`.

</details>

## Usage

1. **Search**: a number, a surah name, Arabic text or a word from a translation.
2. **Select**: click a result; change the ayah range or select words with the mouse.
3. **⚙ Settings**: mushaf, translations and tafsirs (filter by language or author), extras, fonts.
4. **Insert**: in Word at the cursor (or as a new paragraph); on the website the text is copied — paste with Ctrl+V.

## Data

- **Main Arabic text** — [read.tafsir.one](https://read.tafsir.one/almuyassar), 668 pages, unchanged:
  all marks (۞, ۩, ۜ, waqf and madd signs), ayah numbers `۝N`.
- **QUL mushafs**: Hafs, Uthmani, Imlaei, Indopak, Nastaleeq, Digital Khatt, Tajweed, QPC V1/V2/V4 (604 fonts each).
- **Translations and tafsirs**: Uzbek ones from `Quran.csv`; all others from [QUL](https://qul.tarteel.ai)
  (QUL's Uzbek resources and © resources are not taken).
- Everything in one folder by language and translator: branch
  [`qul-data` → `library/`](https://github.com/abdullohukr/quranuz/tree/qul-data/library), list in `library/index.json`.

## Project layout

| Path | What |
|---|---|
| `web/` | website and Word task pane |
| `web/install.html`, `web/mac.sh`, `web/win.txt` | install page and scripts |
| `addin/manifest.xml` | Word add-in manifest |
| `Quran.csv`, `data/` | Uzbek translations/tafsirs, tafsir.one text, QUL catalogue |
| `tools/` | data import (tafsir.one, QUL) and checks |
| `.github/workflows/` | site deployment, tafsir.one and QUL import |
| branch `qul-data`, release `fonts` | QUL data library, QPC font archives |

## Development

```bash
cd web && python3 -m http.server                       # run locally
python3 tools/scrape_tafsir_one.py && python3 tools/build_db.py && python3 tools/verify.py
python3 tools/scrape_qul.py && python3 tools/build_qul.py # QUL import (normally in GitHub Actions)
```

## Sources and licences

- Arabic text: [read.tafsir.one](https://read.tafsir.one).
- Translations, tafsirs, mushafs, fonts: [QUL — Quranic Universal Library](https://qul.tarteel.ai) (Tarteel, MIT);
  every resource belongs to its author and publisher.
- QPC fonts are based on the fonts of the King Fahd Complex for the Printing of the Holy Quran.
- [Scheherazade New](https://software.sil.org/scheherazade/) — SIL Open Font License.
