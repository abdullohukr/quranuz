<div align="center">

<img src="web/assets/icon-128.png" width="96" alt="MyQuran">

# MyQuran

**Надстройка Корана для Microsoft Word и веб**

Поиск аятов и их точная вставка в документ: арабский текст (разные мусхафы),
переводы на 80+ языков, тафсиры, истиаза, басмала и ссылка на источник.

[Ўзбекча](README.md) · **Русский** · [English](README.en.md)

[🌐 Сайт](https://abdullohukr.github.io/quranuz/) · [⬇️ Установка](https://abdullohukr.github.io/quranuz/install.html) · [📝 Изменения](CHANGELOG.md)

</div>

---

## Возможности

| | |
|---|---|
| 🔎 **Поиск** | номер суры и аята (`2:255`, `2 30-37`), название суры (`Бакара 30`, `Al-Baqarah 255`, `البقرة ٥`), арабский текст с огласовками или без (`قل اعوذ برب الناس`, `ٱلرَّحۡمَـٰنِ`), текст любого выбранного перевода на любом языке |
| 🖱️ **Выбор слов** | выделение слов мышью или клик по первому и последнему слову; Shift+клик расширяет диапазон |
| 📖 **Мусхафы** | Мединский мусхаф (tafsir.one), Quran Library — Hafs, Uthmani, Imlaei, Indopak, Indopak Nastaleeq, Nastaleeq, Digital Khatt, **Таджвид (цветной)**, **Quran Library V1 / V2 / V4** (страничные шрифты — для академических работ) |
| 🌍 **Переводы** | Аловуддин Мансур и Мухаммад Содик Мухаммад Юсуф (узбекские) + **~200 переводов на 80+ языков** из QUL; несколько переводов одновременно |
| 📚 **Тафсиры** | Муяссар, Мухтасар (узбекские) + **~100 тафсиров на 30+ языках** из QUL; несколько тафсиров, один комментарий на группу аятов |
| ✍️ **Дополнительно** | скобки ﴿ ﴾, истиаза, басмала, ссылка вида `[يونس ١]`, автоматический новый абзац |
| 🎨 **Оформление** | арабский текст жирный; перевод жирный, пояснения в `( )` и `[ ]` обычным, ссылка курсивом; у каждого языка свои кавычки и направление письма |
| ⓘ **О суре** | информация о каждой суре (пока на английском) |
| 🗣️ **Интерфейс** | 22 языка (узбекский по умолчанию) |
| 💾 **Настройки** | все параметры сохраняются |
| 🔤 **Шрифты** | установка одной командой (Mac / Windows) в отдельную папку `MyQuran` |

Пример вставки:

> ﴿یَـٰۤأَیُّهَا ٱلَّذِینَ ءَامَنُوا۟ … إِنَّ ٱللَّهَ شَدِیدُ ٱلۡعِقَابِ ۝٢﴾ \
> **«Эй мўминлар, … ҳайвонларни** (ўлдиришни) **ва … қаттиқдир»** *(Моида: 2).*

## Установка

Установщик ставит **все шрифты** (мусхафы и страничные шрифты QPC V1/V2/V4, в отдельную папку `MyQuran`)
и **надстройку MyQuran для Word**. Права администратора не нужны.

**Windows 10 / 11** — откройте PowerShell и вставьте:

```powershell
irm https://abdullohukr.github.io/quranuz/win.txt | iex
```

**macOS** — откройте Терминал и вставьте:

```bash
curl -fsSL https://abdullohukr.github.io/quranuz/mac.sh | bash
```

Затем перезапустите Word: **Главная → MyQuran** (Mac: Вставка → Надстройки → Мои надстройки → MyQuran).

<details>
<summary>Ручная установка, удаление, Word Online</summary>

- Файлы: [MyQuran-Install-Windows.bat](https://abdullohukr.github.io/quranuz/install/MyQuran-Install-Windows.bat),
  [MyQuran-Install-Mac.command](https://abdullohukr.github.io/quranuz/install/MyQuran-Install-Mac.command) (правая кнопка → Открыть).
- Только шрифты: [MyQuran-fonts.zip](https://abdullohukr.github.io/quranuz/fonts/MyQuran-fonts.zip),
  [QPC V1](https://github.com/abdullohukr/quranuz/releases/download/fonts/MyQuran-QPC-V1-fonts.zip),
  [QPC V2](https://github.com/abdullohukr/quranuz/releases/download/fonts/MyQuran-QPC-V2-fonts.zip),
  [QPC V4](https://github.com/abdullohukr/quranuz/releases/download/fonts/MyQuran-QPC-V4-fonts.zip).
- Word Online: Вставка → Надстройки → Загрузить мою надстройку → [manifest.xml](https://abdullohukr.github.io/quranuz/manifest.xml).
- Удаление: Windows — `irm https://abdullohukr.github.io/quranuz/win-uninstall.txt | iex`;
  macOS — `curl -fsSL https://abdullohukr.github.io/quranuz/mac-uninstall.sh | bash`.
- Где шрифты: macOS — `~/Library/Fonts/MyQuran`, Windows — `%LOCALAPPDATA%\MyQuran\Fonts`.

</details>

## Использование

1. **Найдите** аят: номер, название суры, арабский текст или слово из перевода.
2. **Выберите**: клик по результату, при необходимости диапазон аятов или отдельные слова.
3. **⚙ Настройки**: мусхаф, переводы и тафсиры (поиск по языку и автору), истиаза, басмала, ссылка, шрифты.
4. **Вставить**: в Word — в место курсора (или новым абзацем); на сайте — копирование, затем Ctrl+V.

## Данные

- **Арабский текст (основной)** — [read.tafsir.one](https://read.tafsir.one/almuyassar), 668 страниц, без изменений:
  все знаки (۞, ۩, ۜ, знаки остановки и мада), номера аятов `۝N`.
- **Мусхафы QUL**: Hafs, Uthmani, Imlaei, Indopak, Nastaleeq, Digital Khatt, Таджвид, QPC V1/V2/V4 (по 604 шрифта).
- **Переводы и тафсиры**: узбекские — из `Quran.csv`; остальные — из [QUL](https://qul.tarteel.ai)
  (узбекские ресурсы QUL и ресурсы с © не берутся).
- Всё в одной папке по языкам и переводчикам: ветка
  [`qul-data` → `library/`](https://github.com/abdullohukr/quranuz/tree/qul-data/library), список — `library/index.json`.

## Структура проекта

| Путь | Что это |
|---|---|
| `web/` | сайт и панель Word |
| `web/install.html`, `web/mac.sh`, `web/win.txt` | страница и скрипты установки |
| `addin/manifest.xml` | манифест надстройки Word |
| `Quran.csv`, `data/` | узбекские переводы/тафсиры, текст tafsir.one, каталог QUL |
| `tools/` | скрипты сбора данных (tafsir.one, QUL) и проверки |
| `.github/workflows/` | публикация сайта, импорт tafsir.one и QUL |
| ветка `qul-data`, релиз `fonts` | библиотека данных QUL, архивы шрифтов QPC |

## Для разработчиков

```bash
cd web && python3 -m http.server                       # локальный запуск
python3 tools/scrape_tafsir_one.py && python3 tools/build_db.py && python3 tools/verify.py
python3 tools/scrape_qul.py && python3 tools/build_qul.py # импорт QUL (обычно в GitHub Actions)
```

## Источники и лицензии

- Арабский текст: [read.tafsir.one](https://read.tafsir.one).
- Переводы, тафсиры, мусхафы, шрифты: [QUL — Quranic Universal Library](https://qul.tarteel.ai) (Tarteel, MIT);
  каждый ресурс принадлежит своему автору и издателю.
- Шрифты QPC основаны на шрифтах Комплекса имени короля Фахда.
- [Scheherazade New](https://software.sil.org/scheherazade/) — SIL Open Font License.
