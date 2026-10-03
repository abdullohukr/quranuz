# Changelog / Ўзгаришлар

## 2.0.2

- macOS: Word for Mac (16.111) did not use fonts that were only copied to `~/Library/Fonts` (Arabic text
  fell back to Sakkal Majalla / Geeza Pro). The installer now also registers every MyQuran font with
  CoreText, at once and at every login (LaunchAgent `uz.myquran.fonts`), and clears Word's font lookup
  cache; the uninstaller removes the agent and unregisters the fonts.
- QPC V1 / V4: the space between words is in the ordinary Arabic font, not in the page font (the space
  glyph of these page fonts is very wide on some pages and empty on others, e.g. the basmalah on page 1).

## 2.0.1

- Tafsir is inserted like a translation: «bold text (plain explanations)» *(Surah: 1).*, one paragraph
  per entry, no title paragraph; several translations/tafsirs are separated only by paragraphs.
- Isti'adhah and the `[الفاتحة ١]` reference use Scheherazade New, not the mushaf font; the basmalah is
  taken from the selected mushaf and separated from the isti'adhah by ". ".
- Installers (macOS, Windows): every run is a clean reinstall of all fonts; other copies of the same fonts
  in the user's font folders are moved to `~/MyQuran-old-fonts` (Windows: `%LOCALAPPDATA%\MyQuran\OldFonts`);
  Word is closed first; no "restart the Mac" note.
- The tafsir.one text is not encoded for KFGQPC (in KFGQPC `ی` shows dots and `۝١` a double circle): choosing
  the KFGQPC font now switches to the Quran Library — Hafs mushaf, made for that font. The font field
  follows the mushaf (reset when the mushaf changes).

## 2.0 — MyQuran

- Name **MyQuran**; interface in 22 languages (Uzbek by default); all settings are remembered.
- **QUL import** (qul.tarteel.ai): ~200 translations in 90+ languages, ~100 tafsirs in 30+ languages,
  mushafs Hafs, Uthmani, Imlaei, Indopak, Nastaleeq, Digital Khatt, Tajweed (colour); everything in one
  library folder by language and translator (branch `qul-data`). Languages missing in QUL's metadata are
  detected from the text. QUL's Uzbek and © resources are skipped.
- **QPC V1 / V2 / V4** page mushafs in Word: every word in the font of its Mushaf page.
- Settings: translation and tafsir on/off + several at once (alphabetical by language, with search),
  mushaf choice, isti'adhah, basmalah, `[يونس ١]` reference.
- Search in any selected translation and by surah names in other languages.
- ⓘ surah information.
- **Installer** for macOS and Windows: all fonts in a separate `MyQuran` folder + the Word add-in, uninstall command.

## 1.x — Қуръон оятлари

- Arabic text from read.tafsir.one (668 pages, unchanged) with all marks; ﷽ and ﴿ ﴾ kept separately.
- Website + Word add-in: search by number, surah name, Arabic with/without diacritics, Uzbek translation.
- Uzbek format: «…» (Сура: 1-2). Arabic bold, translation bold, explanations in ( ) regular, reference italic.
- Word: Arabic RTL paragraph + translation LTR paragraph; word selection by mouse drag.
- Font Scheherazade New (KFGQPC fonts expect another encoding).
