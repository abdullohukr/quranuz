<div align="center">

<img src="web/assets/icon-128.png" width="96" alt="MyQuran">

# MyQuran

**Microsoft Word ва веб учун Қуръони Карим қўшимчаси**

Оятларни топиш ва ҳужжатга хатосиз жойлаштириш: араб матни (турли мусҳафлар),
80 дан ортиқ тилдаги таржималар, тафсирлар, аъузу, басмала ва манба.

**Ўзбекча** · [Русский](README.ru.md) · [English](README.en.md)

[🌐 Сайт](https://abdullohukr.github.io/quranuz/) · [⬇️ Ўрнатиш](https://abdullohukr.github.io/quranuz/install.html) · [📝 Ўзгаришлар](CHANGELOG.md)

</div>

---

## Мундарижа

- [Имкониятлар](#имкониятлар)
- [Ўрнатиш](#ўрнатиш)
- [Фойдаланиш](#фойдаланиш)
- [Маълумотлар: мусҳафлар, таржималар, тафсирлар, шрифтлар](#маълумотлар)
- [Лойиҳа тузилиши](#лойиҳа-тузилиши)
- [Ишлаб чиқувчилар учун](#ишлаб-чиқувчилар-учун)
- [Манбалар ва лицензиялар](#манбалар-ва-лицензиялар)

## Имкониятлар

| | |
|---|---|
| 🔎 **Қидирув** | сура ва оят рақами (`2:255`, `2 30-37`), сура номи (`Бақара 30`, `Al-Baqarah 255`, `البقرة ٥`), араб матни — ҳаракатли ёки ҳаракатсиз (`قل اعوذ برب الناس`, `ٱلرَّحۡمَـٰنِ`), исталган танланган таржима матни (ҳар қандай тилда) |
| 🖱️ **Сўз танлаш** | оятлар ичидан сўзларни сичқонча билан белгилаш ёки 1-сўз ва охирги сўзни босиш; Shift+босиш — оралиқни кенгайтириш |
| 📖 **Мусҳафлар** | Мадина мусҳафи (tafsir.one), Quran Library — Hafs, Uthmani, Imlaei, Indopak, Indopak Nastaleeq, Nastaleeq, Digital Khatt, **Тажвид (рангли)**, **Quran Library V1 / V2 / V4** (саҳифа шрифтлари — академик ишлар учун) |
| 🌍 **Таржималар** | Алоуддин Мансур ва Муҳаммад Содиқ Муҳаммад Юсуф (ўзбекча) + QUL дан **~200 таржима, 80+ тил**; бир вақтда бир нечта таржима |
| 📚 **Тафсирлар** | Муяссар, Мухтасар (ўзбекча) + QUL дан **~100 тафсир, 30+ тил**; бир нечта тафсир, оятлар гуруҳи учун битта тафсир |
| ✍️ **Қўшимчалар** | ﴿ ﴾ қавслар, аъузу, басмала, `[يونس ١]` кўринишидаги манба, автоматик янги абзац |
| 🎨 **Форматлаш** | араб матни қалин; таржима қалин, `( )` ва `[ ]` ичидаги изоҳлар оддий, манба курсив; ҳар бир тилнинг ўз қўштирноғи ва ёзув йўналиши (араб, форс, урду — ўнгдан чапга) |
| ⓘ **Сура ҳақида** | ҳар бир сура ҳақида маълумот (ҳозирча инглизча) |
| 🗣️ **Интерфейс** | 22 тил: ўзбек (кирилл/лотин), араб, инглиз, рус, турк, француз, немис, испан, қозоқ, қирғиз, тожик, озарбайжон, форс, урду, индонез, малай, бенгал, ҳинд, хитой, корейс, япон |
| 💾 **Созламалар** | барча танловлар сақланади — ҳар сафар қайта созлаш шарт эмас |
| 🔤 **Шрифтлар** | битта буйруқ билан ўрнатиш (Mac / Windows), алоҳида `MyQuran` папкасига |

**Жойлаштириш намунаси** (битта оят):

> ﴿یَـٰۤأَیُّهَا ٱلَّذِینَ ءَامَنُوا۟ لَا تُحِلُّوا۟ شَعَـٰۤىِٕرَ ٱللَّهِ … إِنَّ ٱللَّهَ شَدِیدُ ٱلۡعِقَابِ ۝٢﴾ \
> **«Эй мўминлар, Аллоҳ буюрган удумларни бузишни, … ҳайвонларни** (ўлдиришни) **ва … Аллоҳнинг азоби қаттиқдир»** *(Моида: 2).*

Бир нечта оятда таржима ичида оят рақамлари кўрсатилади: «1. … 2. …» *(Моида: 1-2).*

## Ўрнатиш

Ўрнатувчи **барча шрифтларни** (мусҳафлар ва QPC V1/V2/V4 саҳифа шрифтлари, алоҳида `MyQuran`
папкасига) ва **Word учун MyQuran қўшимчасини** ўрнатади. Администратор ҳуқуқи керак эмас.

**Windows 10 / 11** — PowerShell'ни очинг ва қўйинг:

```powershell
irm https://abdullohukr.github.io/quranuz/win.txt | iex
```

**macOS** — Terminal'ни очинг ва қўйинг:

```bash
curl -fsSL https://abdullohukr.github.io/quranuz/mac.sh | bash
```

Сўнг Word'ни қайта ишга туширинг: **Home → MyQuran** (Mac: Insert → Add-ins → My Add-ins → MyQuran).

<details>
<summary>Қўлда ўрнатиш, ўчириш, Word Online</summary>

- Файл орқали: [MyQuran-Install-Windows.bat](https://abdullohukr.github.io/quranuz/install/MyQuran-Install-Windows.bat),
  [MyQuran-Install-Mac.command](https://abdullohukr.github.io/quranuz/install/MyQuran-Install-Mac.command) (ўнг тугма → Open).
- Фақат шрифтлар: [MyQuran-fonts.zip](https://abdullohukr.github.io/quranuz/fonts/MyQuran-fonts.zip),
  [QPC V1](https://github.com/abdullohukr/quranuz/releases/download/fonts/MyQuran-QPC-V1-fonts.zip),
  [QPC V2](https://github.com/abdullohukr/quranuz/releases/download/fonts/MyQuran-QPC-V2-fonts.zip),
  [QPC V4](https://github.com/abdullohukr/quranuz/releases/download/fonts/MyQuran-QPC-V4-fonts.zip).
- Word Online (office.com): Insert → Add-ins → Upload My Add-in →
  [manifest.xml](https://abdullohukr.github.io/quranuz/manifest.xml).
- Ўчириш:
  Windows — `irm https://abdullohukr.github.io/quranuz/win-uninstall.txt | iex`;
  macOS — `curl -fsSL https://abdullohukr.github.io/quranuz/mac-uninstall.sh | bash`.
- Шрифтлар жойи: macOS — `~/Library/Fonts/MyQuran`, Windows — `%LOCALAPPDATA%\MyQuran\Fonts`.

</details>

## Фойдаланиш

1. **Қидиринг**: рақам, сура номи, араб матни ёки таржимадан сўз ёзинг.
2. **Танланг**: натижани босинг; сура/оят оралиғини ўзгартиринг; керак бўлса, сўзларни сичқонча билан белгиланг.
3. **⚙ Созламалар**: мусҳаф, таржималар ва тафсирлар (тил ёки муаллиф бўйича қидирув билан), аъузу, басмала, манба, шрифт ва ўлчам.
4. **Қўйиш**: Word'да — курсор турган жойга (ёки янги абзац сифатида); сайтда — нусха олинади, исталган жойга Ctrl+V.

## Маълумотлар

### Мусҳафлар (араб матни)

| Номи | Манба | Word учун шрифт |
|---|---|---|
| Мадина мусҳафи (асосий) | [read.tafsir.one](https://read.tafsir.one/almuyassar) — 668 саҳифа, ҳеч қандай ўзгаришсиз | Scheherazade New |
| Quran Library — Hafs | QUL | QPC Hafs (Uthmanic Hafs) |
| Uthmani, Uthmani (оддий), Imlaei, Imlaei (оддий) | QUL | Me Quran / Scheherazade New |
| Indopak, Indopak Nastaleeq | QUL | Indopak Nastaleeq |
| Quran Library — Nastaleeq, Nastaleeq Hafs | QUL | QPC Nastaleeq |
| Digital Khatt, Digital Khatt V1, Digital Khatt Indopak | QUL | Digital Khatt |
| Тажвид, Quran Library — Hafs Тажвид | QUL | рангли (тажвид қоидалари) |
| **Quran Library — V1 (1405), V2 (1421), V4 Тажвид** | QUL | **604 саҳифа шрифти** ҳар бири учун |

Асосий матнда барча белгилар сақланган: ۞ ҳизб, ۩ сажда, ۜ сакта, вақф ва мад белгилари, оят рақамлари `۝N`.
﷽ ва ﴿ ﴾ алоҳида сақланган (`data/000_basmala.txt`, `data/quran_brackets.json`).

### Таржималар ва тафсирлар

- **Ўзбекча** (лойиҳанинг ўз маълумотлари, `Quran.csv`): Алоуддин Мансур, Муҳаммад Содиқ Муҳаммад Юсуф таржималари; Муяссар ва Мухтасар тафсирлари.
- **Бошқа тиллар** — [QUL](https://qul.tarteel.ai) дан: ~200 таржима (80+ тил) ва ~100 тафсир (30+ тил).
  QUL даги ўзбекча ресурслар ва © белгили ресурслар олинмайди.
- Ҳаммаси битта папкада, тил ва таржимон номи билан:
  [`qul-data` бўлими → `library/`](https://github.com/abdullohukr/quranuz/tree/qul-data/library)
  (`library/<Тил>/translation - <Таржимон> (id).json`, `library/<Тил>/tafsir - <Муаллиф> (id)/<сура>.json`,
  рўйхат — `library/index.json`).

### Шрифтлар

Scheherazade New (SIL), QPC Hafs, QPC Nastaleeq, Indopak Nastaleeq, Me Quran, Digital Khatt (V1, V2, Indopak),
QPC V1 / V2 / V4 — 3 × 604 саҳифа шрифти. Ўрнатувчи ҳаммасини ўрнатади.

## Лойиҳа тузилиши

| Йўл | Нима |
|---|---|
| `web/` | сайт ва Word панели (`index.html`, `app.js`, `core.js`, `i18n.js`, `style.css`) |
| `web/install.html`, `web/mac.sh`, `web/win.txt` | ўрнатиш саҳифаси ва ўрнатувчилар |
| `addin/manifest.xml` | Word қўшимчаси манифести |
| `Quran.csv` | ўзбекча таржима ва тафсирлар жадвали |
| `data/` | tafsir.one матни, `Quran_tafsirone.csv`, басмала, қавслар, QUL каталоги |
| `tools/` | маълумотларни йиғиш скриптлари (tafsir.one, QUL), текширув |
| `.github/workflows/` | сайтни чиқариш (Pages), tafsir.one ва QUL импорти |
| бўлим `qul-data` | QUL маълумотлари кутубхонаси |
| релиз `fonts` | QPC V1/V2/V4 шрифт архивлари |

## Ишлаб чиқувчилар учун

```bash
# сайтни маҳаллий ишга тушириш
cd web && python3 -m http.server     # http://localhost:8000

# tafsir.one матнини қайта йиғиш
python3 tools/scrape_tafsir_one.py && python3 tools/build_db.py && python3 tools/verify.py

# QUL импорти (GitHub Actions: tools/qul_run.json ўзгарса ишга тушади)
python3 tools/scrape_qul.py --only meta,translation,tafsir,script,font,glyph,pagefonts
python3 tools/build_qul.py
```

## Манбалар ва лицензиялар

- Араб матни (асосий): [read.tafsir.one](https://read.tafsir.one) («Тафсири муяссар» нашри).
- Таржималар, тафсирлар, мусҳафлар, шрифтлар: [QUL — Quranic Universal Library](https://qul.tarteel.ai)
  ([Tarteel](https://tarteel.ai), очиқ код, MIT) — ҳар бир ресурс ўз муаллифи ва ноширига тегишли.
- QPC шрифтлари — Шоҳ Фаҳд Қуръон мажмуаси (King Fahd Complex) шрифтлари асосида.
- [Scheherazade New](https://software.sil.org/scheherazade/) — SIL Open Font License.
- Ўзбекча таржималар ва тафсирлар — `Quran.csv` (лойиҳа муаллифи томонидан тайёрланган).

Аллоҳ таоло ушбу ишни Ўз розилиги учун холис қилиб, умматга манфаатли айласин.
