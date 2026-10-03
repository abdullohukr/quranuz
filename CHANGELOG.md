# Changelog / Ўзгаришлар

## 2.1.1

- Word for Mac kept showing the old task pane after an update: it serves the pane from its WebKit cache
  (`Caches/WebKit/NetworkCache`) without asking the server. The pane now reads `version.json` past the
  cache and, when the site is newer, reloads itself at `index.html?v=N` (once). The macOS installer clears
  that cache; the help gives the right command.

## 2.1

- **Help** (? button): a separate page in all 22 interface languages — about, installation, how to use,
  questions and answers (common problems), uninstall, author. In Word it opens in the browser.
- The main window shows the ayahs once (the second preview below the buttons is gone); the selection tip and
  the font notes are removed, as are the text source, the font help and the "empty = automatic" note in Settings.
- Settings: interface language; "Arabic reference" `[يونس ١]` and "Translation reference" *(Юнус: 1)* are
  separate options; the first mushaf is called "Universal font".
- Translation and tafsir lists: search works (results at once, with their language headings); languages are
  named in the interface language with the native name, e.g. "Турк тили (Türkçe)" (`web/data/langnames.json`,
  made by `tools/lang_names.js` from the macOS CLDR data).
- "Ayah" label capitalised; author and contact at the bottom: Abdulloh Hamidulloh (abdulloh.ukr@gmail.com).

## 2.0.4

- Settings: the "Add translation" / "Add tafsir" switch follows its list: picking a translation or tafsir
  turns it on, unpicking all turns it off (picked translations were not inserted while the switch was off);
  the list is dimmed while the switch is off. Several translations and tafsirs are all inserted.

## 2.0.3

- Settings were not always saved (the dialog's `close` event does not fire in some WebViews), so the
  default Alovuddin Mansur translation stayed on; settings are now applied on every change and on Save.
- Tafsir is inserted like a translation: one paragraph per tafsir, `1. … 2. …` (a commentary on a group:
  `1-3. …`) and *(Surah: 1-3).* at the end.
- Surah names in references follow the text: Uzbek → Uzbek names, Russian and other Cyrillic texts →
  Russian names (Аль-Бакара), Arabic script → Arabic, everything else → Latin (Al-Baqarah).
- Arabic text is regular by default (option "Ayahs in bold"); the `[البقرة ١]` reference is smaller;
  isti'adhah, basmalah and the reference have their own font and size settings.
- QPC V1 / V2 / V4: search results are shown in the page fonts; the "install 604 fonts" note is hidden
  when the fonts are installed and can be dismissed.

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
