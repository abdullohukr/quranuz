/* Interface languages. Missing keys fall back to English, then Uzbek. */
(function (root) {
  'use strict';
  var L = {};

  L.uz = { arBold: 'Оятлар қалин (bold)', extraFonts: 'Аъузу, басмала ва ҳавола шрифти', mushafFont: 'мусҳаф шрифти', _name: 'Ўзбекча', title: 'MyQuran',
    search: '2:255 · Бақара 30-37 · الرحمن الرحيم · таржима матни', ayah: 'Оят', results: '{n} та натижа',
    notFound: 'Топилмади', loading: 'Юкланмоқда…',
    fullAyah: 'Тўлиқ оят', insert: 'Қўйиш', copy: 'Нусха олиш', copied: 'Нусха олинди', copiedPaste: 'Нусха олинди — исталган жойга қўйинг (Ctrl+V)',
    inserted: 'Қўйилди', error: 'Хато', settings: 'Созламалар', uiLang: 'Интерфейс тили', mushaf: 'Мусҳаф (араб матни)',
    translation: 'Таржима', withTranslation: 'Таржимани қўшиш', tafsir: 'Тафсир', withTafsir: 'Тафсирни қўшиш',
    filter: 'Тил ёки муаллиф бўйича излаш', insertOptions: 'Қўшимча', brackets: '﴿ ﴾ қавслар', auza: 'Аъузу',
    basmala: 'Басмала', ref: 'Арабча ҳавола', newPara: 'Автоматик янги абзац (Word)',
    arabicText: 'Араб матни', translationText: 'Таржима ва тафсир матни', font: 'Шрифт', size: 'Ўлчам', docFont: '(ҳужжатдагидек)', save: 'Сақлаш', surahInfo: 'Сура ҳақида', close: 'Ёпиш',
    ayahByAyah: 'Бу мусҳаф оятма-оят шаклда: оят ичидан сўз танлаш тахминий бўлиши мумкин.',
    noInfo: 'Бу тилда маълумот йўқ, инглизчаси кўрсатилмоқда.', ayahs: 'оят', meccan: 'Маккий', medinan: 'Маданий',
    'script.default': 'Универсал шрифт', 'script.quranLibrary': 'Quran Library', 'script.tajweed': 'Тажвид',
    'script.simple': 'Оддий (имлоий)', refTr: 'Таржима ҳаволаси', help: 'Ёрдам' };

  L.uz_latn = { arBold: 'Oyatlar qalin (bold)', extraFonts: 'Aʼuzu, basmala va havola shrifti', mushafFont: 'mushaf shrifti', _name: 'Oʻzbekcha (lotin)', title: 'MyQuran',
    search: '2:255 · Baqara 30-37 · الرحمن الرحيم · tarjima matni', ayah: 'Oyat', results: '{n} ta natija',
    notFound: 'Topilmadi', loading: 'Yuklanmoqda…',
    fullAyah: 'Toʻliq oyat', insert: 'Qoʻyish', copy: 'Nusxa olish', copied: 'Nusxa olindi', copiedPaste: 'Nusxa olindi — istalgan joyga qoʻying (Ctrl+V)',
    inserted: 'Qoʻyildi', error: 'Xato', settings: 'Sozlamalar', uiLang: 'Interfeys tili', mushaf: 'Mushaf (arab matni)',
    translation: 'Tarjima', withTranslation: 'Tarjimani qoʻshish', tafsir: 'Tafsir', withTafsir: 'Tafsirni qoʻshish',
    filter: 'Til yoki muallif boʻyicha izlash', insertOptions: 'Qoʻshimcha', brackets: '﴿ ﴾ qavslar', auza: 'Aʼuzu',
    basmala: 'Basmala', ref: 'Arabcha havola', newPara: 'Avtomatik yangi abzats (Word)',
    arabicText: 'Arab matni', translationText: 'Tarjima va tafsir matni', font: 'Shrift', size: 'Oʻlcham', docFont: '(hujjatdagidek)', save: 'Saqlash', surahInfo: 'Sura haqida', close: 'Yopish',
    ayahByAyah: 'Bu mushaf oyatma-oyat shaklda: oyat ichidan soʻz tanlash taxminiy boʻlishi mumkin.',
    noInfo: 'Bu tilda maʼlumot yoʻq, inglizchasi koʻrsatilmoqda.', ayahs: 'oyat', meccan: 'Makkiy', medinan: 'Madaniy',
    'script.default': 'Universal shrift', 'script.tajweed': 'Tajvid',
    'script.simple': 'Oddiy (imloiy)', refTr: 'Tarjima havolasi', help: 'Yordam' };

  L.en = { arBold: 'Ayahs in bold', extraFonts: 'Font of isti‘adhah, basmalah and reference', mushafFont: 'mushaf font', _name: 'English', search: '2:255 · Baqarah 30-37 · الرحمن الرحيم · translation text', ayah: 'Ayah',
    results: '{n} results', notFound: 'Nothing found', loading: 'Loading…',
    fullAyah: 'Whole ayah', insert: 'Insert', copy: 'Copy', copied: 'Copied', copiedPaste: 'Copied — paste anywhere (Ctrl+V)',
    inserted: 'Inserted', error: 'Error', settings: 'Settings', uiLang: 'Interface language', mushaf: 'Mushaf (Arabic text)',
    translation: 'Translation', withTranslation: 'Add translation', tafsir: 'Tafsir', withTafsir: 'Add tafsir',
    filter: 'Filter by language or author', insertOptions: 'Extras', brackets: '﴿ ﴾ brackets', auza: 'Isti‘adhah (A‘udhu)',
    basmala: 'Basmalah', ref: 'Arabic reference', newPara: 'Insert as new paragraph (Word)',
    arabicText: 'Arabic text', translationText: 'Translation and tafsir text', font: 'Font', size: 'Size', docFont: '(as in document)', save: 'Save', surahInfo: 'About the surah', close: 'Close',
    ayahByAyah: 'This mushaf is ayah-by-ayah only: selecting words inside an ayah may be approximate.',
    noInfo: 'Not available in this language, showing English.', ayahs: 'ayahs', meccan: 'Meccan', medinan: 'Medinan',
    'script.default': 'Universal font', 'script.quranLibrary': 'Quran Library', 'script.tajweed': 'Tajweed',
    'script.simple': 'Simple (Imlaei)', refTr: 'Translation reference', help: 'Help' };

  L.ar = { _name: 'العربية', _dir: 'rtl', search: '2:255 · البقرة 30-37 · الرحمن الرحيم · نص الترجمة', ayah: 'آية',
    results: '{n} نتيجة', notFound: 'لا توجد نتائج', loading: 'جارٍ التحميل…',
    fullAyah: 'الآية كاملة', insert: 'إدراج', copy: 'نسخ', copied: 'تم النسخ', copiedPaste: 'تم النسخ — الصق في أي مكان (Ctrl+V)',
    inserted: 'تم الإدراج', error: 'خطأ', settings: 'الإعدادات', uiLang: 'لغة الواجهة', mushaf: 'المصحف (النص العربي)',
    translation: 'الترجمة', withTranslation: 'إضافة الترجمة', tafsir: 'التفسير', withTafsir: 'إضافة التفسير',
    filter: 'بحث باللغة أو المؤلف', insertOptions: 'إضافات', brackets: 'الأقواس ﴿ ﴾', auza: 'الاستعاذة',
    basmala: 'البسملة', ref: 'المرجع العربي', newPara: 'إدراج في فقرة جديدة (Word)',
    arabicText: 'النص العربي', translationText: 'نص الترجمة والتفسير', font: 'الخط', size: 'الحجم', docFont: '(كما في المستند)', save: 'حفظ', surahInfo: 'عن السورة', close: 'إغلاق',
    ayahByAyah: 'هذا المصحف متوفر آيةً آية فقط: قد يكون تحديد الكلمات داخل الآية تقريبيًا.',
    noInfo: 'غير متوفر بهذه اللغة، يُعرض بالإنجليزية.', ayahs: 'آيات', meccan: 'مكية', medinan: 'مدنية',
    'script.default': 'الخط العام', 'script.quranLibrary': 'مكتبة القرآن', 'script.tajweed': 'التجويد',
    'script.simple': 'إملائي', refTr: 'مرجع الترجمة', help: 'مساعدة' };

  L.ru = { arBold: 'Аяты жирным', extraFonts: 'Шрифт аузу, басмалы и ссылки', mushafFont: 'шрифт мусхафа', _name: 'Русский', search: '2:255 · Бакара 30-37 · الرحمن الرحيم · текст перевода', ayah: 'Аят',
    results: 'Найдено: {n}', notFound: 'Ничего не найдено', loading: 'Загрузка…',
    fullAyah: 'Весь аят', insert: 'Вставить', copy: 'Копировать', copied: 'Скопировано', copiedPaste: 'Скопировано — вставьте куда нужно (Ctrl+V)',
    inserted: 'Вставлено', error: 'Ошибка', settings: 'Настройки', uiLang: 'Язык интерфейса', mushaf: 'Мусхаф (арабский текст)',
    translation: 'Перевод', withTranslation: 'Добавлять перевод', tafsir: 'Тафсир', withTafsir: 'Добавлять тафсир',
    filter: 'Поиск по языку или автору', insertOptions: 'Дополнительно', brackets: 'Скобки ﴿ ﴾', auza: 'Истиаза (Аузу)',
    basmala: 'Басмала', ref: 'Арабская ссылка', newPara: 'Вставлять новым абзацем (Word)',
    arabicText: 'Арабский текст', translationText: 'Текст перевода и тафсира', font: 'Шрифт', size: 'Размер', docFont: '(как в документе)', save: 'Сохранить', surahInfo: 'О суре', close: 'Закрыть',
    ayahByAyah: 'Этот мусхаф доступен только по аятам: выбор слов внутри аята может быть приблизительным.',
    noInfo: 'На этом языке нет, показан английский.', ayahs: 'аятов', meccan: 'Мекканская', medinan: 'Мединская',
    'script.default': 'Универсальный шрифт', 'script.quranLibrary': 'Коранская библиотека', 'script.tajweed': 'Таджвид',
    'script.simple': 'Простой (имляи)', refTr: 'Ссылка перевода', help: 'Справка' };

  L.tr = { _name: 'Türkçe', search: '2:255 · Bakara 30-37 · الرحمن الرحيم · meal metni', ayah: 'Ayet',
    results: '{n} sonuç', notFound: 'Bulunamadı', loading: 'Yükleniyor…',
    fullAyah: 'Ayetin tamamı', insert: 'Ekle', copy: 'Kopyala', copied: 'Kopyalandı', copiedPaste: 'Kopyalandı — istediğiniz yere yapıştırın (Ctrl+V)',
    inserted: 'Eklendi', error: 'Hata', settings: 'Ayarlar', uiLang: 'Arayüz dili', mushaf: 'Mushaf (Arapça metin)',
    translation: 'Meal', withTranslation: 'Meal ekle', tafsir: 'Tefsir', withTafsir: 'Tefsir ekle',
    filter: 'Dil veya yazara göre ara', insertOptions: 'Ekler', brackets: '﴿ ﴾ parantezler', auza: 'Euzü',
    basmala: 'Besmele', ref: 'Arapça kaynak', newPara: 'Yeni paragraf olarak ekle (Word)',
    arabicText: 'Arapça metin', translationText: 'Meal ve tefsir metni', font: 'Yazı tipi', size: 'Boyut', docFont: '(belgedeki gibi)', save: 'Kaydet', surahInfo: 'Sure hakkında', close: 'Kapat',
    ayahByAyah: 'Bu mushaf yalnızca ayet ayet mevcuttur: ayet içinde kelime seçimi yaklaşık olabilir.',
    noInfo: 'Bu dilde mevcut değil, İngilizcesi gösteriliyor.', ayahs: 'ayet', meccan: 'Mekki', medinan: 'Medeni',
    'script.default': 'Evrensel yazı tipi', 'script.quranLibrary': 'Kur’an Kütüphanesi', 'script.tajweed': 'Tecvid',
    'script.simple': 'Basit (imlâî)', refTr: 'Meal kaynağı', help: 'Yardım' };

  L.fr = { _name: 'Français', search: '2:255 · Baqara 30-37 · الرحمن الرحيم · texte de la traduction', ayah: 'Verset',
    results: '{n} résultats', notFound: 'Aucun résultat', loading: 'Chargement…',
    fullAyah: 'Verset entier', insert: 'Insérer', copy: 'Copier', copied: 'Copié', copiedPaste: 'Copié — collez où vous voulez (Ctrl+V)',
    inserted: 'Inséré', error: 'Erreur', settings: 'Paramètres', uiLang: 'Langue de l’interface', mushaf: 'Mushaf (texte arabe)',
    translation: 'Traduction', withTranslation: 'Ajouter la traduction', tafsir: 'Tafsir', withTafsir: 'Ajouter le tafsir',
    filter: 'Filtrer par langue ou auteur', insertOptions: 'Options', brackets: 'Parenthèses ﴿ ﴾', auza: 'Isti‘adha',
    basmala: 'Basmala', ref: 'Référence arabe', newPara: 'Insérer comme nouveau paragraphe (Word)',
    arabicText: 'Texte arabe', translationText: 'Texte de la traduction et du tafsir', font: 'Police', size: 'Taille', docFont: '(comme le document)', save: 'Enregistrer', surahInfo: 'À propos de la sourate', close: 'Fermer',
    ayahByAyah: 'Ce mushaf n’existe que verset par verset : la sélection de mots peut être approximative.',
    noInfo: 'Indisponible dans cette langue, affichage en anglais.', ayahs: 'versets', meccan: 'Mecquoise', medinan: 'Médinoise',
    'script.default': 'Police universelle', 'script.quranLibrary': 'Bibliothèque coranique', 'script.tajweed': 'Tajwid',
    'script.simple': 'Simple (imla’i)', refTr: 'Référence de la traduction', help: 'Aide' };

  L.de = { _name: 'Deutsch', search: '2:255 · Baqara 30-37 · الرحمن الرحيم · Übersetzungstext', ayah: 'Vers',
    results: '{n} Ergebnisse', notFound: 'Nichts gefunden', loading: 'Wird geladen…',
    fullAyah: 'Ganzer Vers', insert: 'Einfügen', copy: 'Kopieren', copied: 'Kopiert', copiedPaste: 'Kopiert — beliebig einfügen (Strg+V)',
    inserted: 'Eingefügt', error: 'Fehler', settings: 'Einstellungen', uiLang: 'Sprache der Oberfläche', mushaf: 'Mushaf (arabischer Text)',
    translation: 'Übersetzung', withTranslation: 'Übersetzung hinzufügen', tafsir: 'Tafsir', withTafsir: 'Tafsir hinzufügen',
    filter: 'Nach Sprache oder Autor filtern', insertOptions: 'Extras', brackets: 'Klammern ﴿ ﴾', auza: 'Isti‘adha',
    basmala: 'Basmala', ref: 'Arabische Angabe', newPara: 'Als neuen Absatz einfügen (Word)',
    arabicText: 'Arabischer Text', translationText: 'Übersetzungs- und Tafsirtext', font: 'Schrift', size: 'Größe', docFont: '(wie im Dokument)', save: 'Speichern', surahInfo: 'Über die Sure', close: 'Schließen',
    ayahByAyah: 'Dieser Mushaf liegt nur versweise vor: die Wortauswahl im Vers kann ungenau sein.',
    noInfo: 'In dieser Sprache nicht verfügbar, Englisch wird angezeigt.', ayahs: 'Verse', meccan: 'Mekkanisch', medinan: 'Medinensisch',
    'script.default': 'Universalschrift', 'script.quranLibrary': 'Koran-Bibliothek', 'script.tajweed': 'Tadschwid',
    'script.simple': 'Einfach (Imla’i)', refTr: 'Angabe der Übersetzung', help: 'Hilfe' };

  L.kk = { _name: 'Қазақша', search: '2:255 · Бақара 30-37 · الرحمن الرحيم · аударма мәтіні', ayah: 'Аят',
    results: '{n} нәтиже', notFound: 'Табылмады', loading: 'Жүктелуде…',
    fullAyah: 'Толық аят', insert: 'Қою', copy: 'Көшіру', copied: 'Көшірілді', copiedPaste: 'Көшірілді — кез келген жерге қойыңыз (Ctrl+V)',
    inserted: 'Қойылды', error: 'Қате', settings: 'Баптаулар', uiLang: 'Интерфейс тілі', mushaf: 'Мұсхаф (араб мәтіні)',
    translation: 'Аударма', withTranslation: 'Аударманы қосу', tafsir: 'Тәпсір', withTafsir: 'Тәпсірді қосу',
    filter: 'Тіл немесе автор бойынша іздеу', insertOptions: 'Қосымша', brackets: '﴿ ﴾ жақшалар', auza: 'Ағузу',
    basmala: 'Бисмилла', ref: 'Арабша сілтеме', newPara: 'Жаңа абзац ретінде қою (Word)',
    arabicText: 'Араб мәтіні', translationText: 'Аударма мен тәпсір мәтіні', font: 'Қаріп', size: 'Өлшем', docFont: '(құжаттағыдай)', save: 'Сақтау', surahInfo: 'Сүре туралы', close: 'Жабу',
    ayahByAyah: 'Бұл мұсхаф тек аят бойынша: аят ішіндегі сөз таңдау шамамен болуы мүмкін.',
    noInfo: 'Бұл тілде жоқ, ағылшынша көрсетілуде.', ayahs: 'аят', meccan: 'Меккелік', medinan: 'Мәдиналық',
    'script.default': 'Әмбебап қаріп', 'script.quranLibrary': 'Құран кітапханасы', 'script.tajweed': 'Тәжуид',
    'script.simple': 'Қарапайым (имлаи)', refTr: 'Аударма сілтемесі', help: 'Анықтама' };

  L.ky = { _name: 'Кыргызча', search: '2:255 · Бакара 30-37 · الرحمن الرحيم · котормо тексти', ayah: 'Аят',
    results: '{n} натыйжа', notFound: 'Табылган жок', loading: 'Жүктөлүүдө…',
    fullAyah: 'Толук аят', insert: 'Коюу', copy: 'Көчүрүү', copied: 'Көчүрүлдү', copiedPaste: 'Көчүрүлдү — каалаган жерге коюңуз (Ctrl+V)',
    inserted: 'Коюлду', error: 'Ката', settings: 'Жөндөөлөр', uiLang: 'Интерфейс тили', mushaf: 'Мусхаф (араб тексти)',
    translation: 'Котормо', withTranslation: 'Котормону кошуу', tafsir: 'Тафсир', withTafsir: 'Тафсирди кошуу',
    filter: 'Тил же автор боюнча издөө', insertOptions: 'Кошумча', brackets: '﴿ ﴾ кашаалар', auza: 'Аузу',
    basmala: 'Бисмилла', ref: 'Арабча шилтеме', newPara: 'Жаңы абзац катары коюу (Word)',
    arabicText: 'Араб тексти', translationText: 'Котормо жана тафсир тексти', font: 'Арип', size: 'Өлчөм', docFont: '(документтегидей)', save: 'Сактоо', surahInfo: 'Сүрө жөнүндө', close: 'Жабуу',
    ayahByAyah: 'Бул мусхаф аят боюнча гана: аяттын ичинен сөз тандоо болжолдуу болушу мүмкүн.',
    noInfo: 'Бул тилде жок, англисчеси көрсөтүлүүдө.', ayahs: 'аят', meccan: 'Меккелик', medinan: 'Мединалык',
    'script.default': 'Универсал арип', 'script.quranLibrary': 'Куран китепканасы', 'script.tajweed': 'Тажвид',
    'script.simple': 'Жөнөкөй (имлаи)', refTr: 'Котормо шилтемеси', help: 'Жардам' };

  L.tg = { _name: 'Тоҷикӣ', search: '2:255 · Бақара 30-37 · الرحمن الرحيم · матни тарҷума', ayah: 'Оят',
    results: '{n} натиҷа', notFound: 'Ёфт нашуд', loading: 'Боргирӣ…',
    fullAyah: 'Ояти пурра', insert: 'Гузоштан', copy: 'Нусха', copied: 'Нусха гирифта шуд', copiedPaste: 'Нусха гирифта шуд — ба ҳар ҷо гузоред (Ctrl+V)',
    inserted: 'Гузошта шуд', error: 'Хато', settings: 'Танзимот', uiLang: 'Забони интерфейс', mushaf: 'Мусҳаф (матни арабӣ)',
    translation: 'Тарҷума', withTranslation: 'Илова кардани тарҷума', tafsir: 'Тафсир', withTafsir: 'Илова кардани тафсир',
    filter: 'Ҷустуҷӯ аз рӯи забон ё муаллиф', insertOptions: 'Иловагӣ', brackets: 'Қавсҳои ﴿ ﴾', auza: 'Аъузу',
    basmala: 'Басмала', ref: 'Истиноди арабӣ', newPara: 'Ҳамчун сархати нав (Word)',
    arabicText: 'Матни арабӣ', translationText: 'Матни тарҷума ва тафсир', font: 'Ҳуруф', size: 'Андоза', docFont: '(мисли ҳуҷҷат)', save: 'Нигоҳ доштан', surahInfo: 'Дар бораи сура', close: 'Пӯшидан',
    ayahByAyah: 'Ин мусҳаф танҳо оят ба оят аст: интихоби калима дар дохили оят тахминӣ буда метавонад.',
    noInfo: 'Бо ин забон нест, англисӣ нишон дода мешавад.', ayahs: 'оят', meccan: 'Маккӣ', medinan: 'Мадинагӣ',
    'script.default': 'Ҳуруфи универсалӣ', 'script.quranLibrary': 'Китобхонаи Қуръон', 'script.tajweed': 'Таҷвид',
    'script.simple': 'Оддӣ (имлоӣ)', refTr: 'Истиноди тарҷума', help: 'Ёрӣ' };

  L.az = { _name: 'Azərbaycanca', search: '2:255 · Bəqərə 30-37 · الرحمن الرحيم · tərcümə mətni', ayah: 'Ayə',
    results: '{n} nəticə', notFound: 'Tapılmadı', loading: 'Yüklənir…',
    fullAyah: 'Tam ayə', insert: 'Əlavə et', copy: 'Kopyala', copied: 'Kopyalandı', copiedPaste: 'Kopyalandı — istənilən yerə yapışdırın (Ctrl+V)',
    inserted: 'Əlavə edildi', error: 'Xəta', settings: 'Ayarlar', uiLang: 'İnterfeys dili', mushaf: 'Mushaf (ərəb mətni)',
    translation: 'Tərcümə', withTranslation: 'Tərcüməni əlavə et', tafsir: 'Təfsir', withTafsir: 'Təfsiri əlavə et',
    filter: 'Dil və ya müəllifə görə axtar', insertOptions: 'Əlavələr', brackets: '﴿ ﴾ mötərizələr', auza: 'Əuzu',
    basmala: 'Bəsmələ', ref: 'Ərəbcə istinad', newPara: 'Yeni abzas kimi (Word)',
    arabicText: 'Ərəb mətni', translationText: 'Tərcümə və təfsir mətni', font: 'Şrift', size: 'Ölçü', docFont: '(sənəddəki kimi)', save: 'Yadda saxla', surahInfo: 'Surə haqqında', close: 'Bağla',
    ayahByAyah: 'Bu mushaf yalnız ayə-ayə mövcuddur: ayə daxilində söz seçimi təxmini ola bilər.',
    noInfo: 'Bu dildə yoxdur, ingiliscəsi göstərilir.', ayahs: 'ayə', meccan: 'Məkki', medinan: 'Mədəni',
    'script.default': 'Universal şrift', 'script.quranLibrary': 'Quran Kitabxanası', 'script.tajweed': 'Təcvid',
    'script.simple': 'Sadə (imlai)', refTr: 'Tərcümə istinadı', help: 'Kömək' };

  L.fa = { _name: 'فارسی', _dir: 'rtl', search: '2:255 · بقره 30-37 · الرحمن الرحيم · متن ترجمه', ayah: 'آیه',
    results: '{n} نتیجه', notFound: 'چیزی یافت نشد', loading: 'در حال بارگذاری…',
    fullAyah: 'آیه کامل', insert: 'درج', copy: 'رونوشت', copied: 'رونوشت شد', copiedPaste: 'رونوشت شد — هر جا خواستید بچسبانید (Ctrl+V)',
    inserted: 'درج شد', error: 'خطا', settings: 'تنظیمات', uiLang: 'زبان رابط', mushaf: 'مصحف (متن عربی)',
    translation: 'ترجمه', withTranslation: 'افزودن ترجمه', tafsir: 'تفسیر', withTafsir: 'افزودن تفسیر',
    filter: 'جستجو بر اساس زبان یا مؤلف', insertOptions: 'افزوده‌ها', brackets: 'پرانتزهای ﴿ ﴾', auza: 'استعاذه',
    basmala: 'بسمله', ref: 'ارجاع عربی', newPara: 'درج در بند جدید (Word)',
    arabicText: 'متن عربی', translationText: 'متن ترجمه و تفسیر', font: 'قلم', size: 'اندازه', docFont: '(مانند سند)', save: 'ذخیره', surahInfo: 'درباره سوره', close: 'بستن',
    ayahByAyah: 'این مصحف فقط آیه به آیه است: انتخاب کلمه در آیه ممکن است تقریبی باشد.',
    noInfo: 'به این زبان موجود نیست، انگلیسی نمایش داده می‌شود.', ayahs: 'آیه', meccan: 'مکی', medinan: 'مدنی',
    'script.default': 'قلم عمومی', 'script.quranLibrary': 'کتابخانه قرآن', 'script.tajweed': 'تجوید',
    'script.simple': 'ساده (املایی)', refTr: 'ارجاع ترجمه', help: 'راهنما' };

  L.ur = { _name: 'اردو', _dir: 'rtl', search: '2:255 · البقرۃ 30-37 · الرحمن الرحيم · ترجمے کا متن', ayah: 'آیت',
    results: '{n} نتائج', notFound: 'کچھ نہیں ملا', loading: 'لوڈ ہو رہا ہے…',
    fullAyah: 'پوری آیت', insert: 'داخل کریں', copy: 'کاپی', copied: 'کاپی ہو گیا', copiedPaste: 'کاپی ہو گیا — کہیں بھی چسپاں کریں (Ctrl+V)',
    inserted: 'داخل ہو گیا', error: 'خرابی', settings: 'ترتیبات', uiLang: 'انٹرفیس کی زبان', mushaf: 'مصحف (عربی متن)',
    translation: 'ترجمہ', withTranslation: 'ترجمہ شامل کریں', tafsir: 'تفسیر', withTafsir: 'تفسیر شامل کریں',
    filter: 'زبان یا مصنف سے تلاش', insertOptions: 'اضافی', brackets: '﴿ ﴾ قوسین', auza: 'تعوذ',
    basmala: 'بسم اللہ', ref: 'عربی حوالہ', newPara: 'نئے پیراگراف میں (Word)',
    arabicText: 'عربی متن', translationText: 'ترجمہ اور تفسیر کا متن', font: 'فونٹ', size: 'سائز', docFont: '(دستاویز کی طرح)', save: 'محفوظ کریں', surahInfo: 'سورت کے بارے میں', close: 'بند کریں',
    ayahByAyah: 'یہ مصحف صرف آیت بہ آیت ہے: آیت کے اندر الفاظ کا انتخاب تقریبی ہو سکتا ہے۔',
    noInfo: 'اس زبان میں دستیاب نہیں، انگریزی دکھائی جا رہی ہے۔', ayahs: 'آیات', meccan: 'مکی', medinan: 'مدنی',
    'script.default': 'عمومی فونٹ', 'script.quranLibrary': 'قرآن لائبریری', 'script.tajweed': 'تجوید',
    'script.simple': 'سادہ (املائی)', refTr: 'ترجمے کا حوالہ', help: 'مدد' };

  L.id = { _name: 'Bahasa Indonesia', search: '2:255 · Al-Baqarah 30-37 · الرحمن الرحيم · teks terjemahan', ayah: 'Ayat',
    results: '{n} hasil', notFound: 'Tidak ditemukan', loading: 'Memuat…',
    fullAyah: 'Ayat lengkap', insert: 'Sisipkan', copy: 'Salin', copied: 'Tersalin', copiedPaste: 'Tersalin — tempel di mana saja (Ctrl+V)',
    inserted: 'Disisipkan', error: 'Kesalahan', settings: 'Pengaturan', uiLang: 'Bahasa antarmuka', mushaf: 'Mushaf (teks Arab)',
    translation: 'Terjemahan', withTranslation: 'Tambahkan terjemahan', tafsir: 'Tafsir', withTafsir: 'Tambahkan tafsir',
    filter: 'Cari menurut bahasa atau penulis', insertOptions: 'Tambahan', brackets: 'Kurung ﴿ ﴾', auza: 'Ta‘awwudz',
    basmala: 'Basmalah', ref: 'Rujukan Arab', newPara: 'Sisipkan sebagai paragraf baru (Word)',
    arabicText: 'Teks Arab', translationText: 'Teks terjemahan dan tafsir', font: 'Fon', size: 'Ukuran', docFont: '(seperti dokumen)', save: 'Simpan', surahInfo: 'Tentang surah', close: 'Tutup',
    ayahByAyah: 'Mushaf ini hanya per ayat: pemilihan kata di dalam ayat bisa tidak tepat.',
    noInfo: 'Tidak tersedia dalam bahasa ini, ditampilkan bahasa Inggris.', ayahs: 'ayat', meccan: 'Makkiyah', medinan: 'Madaniyah',
    'script.default': 'Fon universal', 'script.quranLibrary': 'Perpustakaan Al-Qur’an', 'script.tajweed': 'Tajwid',
    'script.simple': 'Sederhana (imla’i)', refTr: 'Rujukan terjemahan', help: 'Bantuan' };

  L.ms = { _name: 'Bahasa Melayu', search: '2:255 · Al-Baqarah 30-37 · الرحمن الرحيم · teks terjemahan', ayah: 'Ayat',
    results: '{n} hasil', notFound: 'Tiada hasil', loading: 'Memuatkan…',
    fullAyah: 'Ayat penuh', insert: 'Masukkan', copy: 'Salin', copied: 'Disalin', copiedPaste: 'Disalin — tampal di mana-mana (Ctrl+V)',
    inserted: 'Dimasukkan', error: 'Ralat', settings: 'Tetapan', uiLang: 'Bahasa antara muka', mushaf: 'Mushaf (teks Arab)',
    translation: 'Terjemahan', withTranslation: 'Tambah terjemahan', tafsir: 'Tafsir', withTafsir: 'Tambah tafsir',
    filter: 'Cari mengikut bahasa atau penulis', insertOptions: 'Tambahan', brackets: 'Kurungan ﴿ ﴾', auza: 'Ta‘awwuz',
    basmala: 'Basmalah', ref: 'Rujukan Arab', newPara: 'Masukkan sebagai perenggan baharu (Word)',
    arabicText: 'Teks Arab', translationText: 'Teks terjemahan dan tafsir', font: 'Fon', size: 'Saiz', docFont: '(seperti dokumen)', save: 'Simpan', surahInfo: 'Tentang surah', close: 'Tutup',
    ayahByAyah: 'Mushaf ini hanya ayat demi ayat: pemilihan perkataan dalam ayat mungkin tidak tepat.',
    noInfo: 'Tiada dalam bahasa ini, dipaparkan bahasa Inggeris.', ayahs: 'ayat', meccan: 'Makkiyah', medinan: 'Madaniyah',
    'script.default': 'Fon universal', 'script.quranLibrary': 'Perpustakaan Al-Quran', 'script.tajweed': 'Tajwid',
    'script.simple': 'Ringkas (imla’i)', refTr: 'Rujukan terjemahan', help: 'Bantuan' };

  L.bn = { _name: 'বাংলা', search: '2:255 · আল-বাকারা 30-37 · الرحمن الرحيم · অনুবাদের লেখা', ayah: 'আয়াত',
    results: '{n}টি ফলাফল', notFound: 'কিছু পাওয়া যায়নি', loading: 'লোড হচ্ছে…',
    fullAyah: 'পুরো আয়াত', insert: 'যোগ করুন', copy: 'কপি', copied: 'কপি হয়েছে', copiedPaste: 'কপি হয়েছে — যেকোনো জায়গায় পেস্ট করুন (Ctrl+V)',
    inserted: 'যোগ হয়েছে', error: 'ত্রুটি', settings: 'সেটিংস', uiLang: 'ইন্টারফেসের ভাষা', mushaf: 'মুসহাফ (আরবি লেখা)',
    translation: 'অনুবাদ', withTranslation: 'অনুবাদ যোগ করুন', tafsir: 'তাফসীর', withTafsir: 'তাফসীর যোগ করুন',
    filter: 'ভাষা বা লেখক দিয়ে খুঁজুন', insertOptions: 'অতিরিক্ত', brackets: '﴿ ﴾ বন্ধনী', auza: 'আউযুবিল্লাহ',
    basmala: 'বিসমিল্লাহ', ref: 'আরবি সূত্র', newPara: 'নতুন অনুচ্ছেদে যোগ (Word)',
    arabicText: 'আরবি লেখা', translationText: 'অনুবাদ ও তাফসীরের লেখা', font: 'ফন্ট', size: 'আকার', docFont: '(নথির মতো)', save: 'সংরক্ষণ', surahInfo: 'সূরা সম্পর্কে', close: 'বন্ধ',
    ayahByAyah: 'এই মুসহাফ শুধু আয়াত-ভিত্তিক: আয়াতের ভেতরে শব্দ নির্বাচন আনুমানিক হতে পারে।',
    noInfo: 'এই ভাষায় নেই, ইংরেজি দেখানো হচ্ছে।', ayahs: 'আয়াত', meccan: 'মাক্কী', medinan: 'মাদানী',
    'script.default': 'সর্বজনীন ফন্ট', 'script.quranLibrary': 'কুরআন লাইব্রেরি', 'script.tajweed': 'তাজবীদ',
    'script.simple': 'সরল (ইমলায়ী)', refTr: 'অনুবাদের সূত্র', help: 'সহায়তা' };

  L.hi = { _name: 'हिन्दी', search: '2:255 · अल-बक़रा 30-37 · الرحمن الرحيم · अनुवाद का पाठ', ayah: 'आयत',
    results: '{n} परिणाम', notFound: 'कुछ नहीं मिला', loading: 'लोड हो रहा है…',
    fullAyah: 'पूरी आयत', insert: 'डालें', copy: 'कॉपी', copied: 'कॉपी हुआ', copiedPaste: 'कॉपी हुआ — कहीं भी पेस्ट करें (Ctrl+V)',
    inserted: 'डाला गया', error: 'त्रुटि', settings: 'सेटिंग्स', uiLang: 'इंटरफ़ेस की भाषा', mushaf: 'मुसहफ़ (अरबी पाठ)',
    translation: 'अनुवाद', withTranslation: 'अनुवाद जोड़ें', tafsir: 'तफ़सीर', withTafsir: 'तफ़सीर जोड़ें',
    filter: 'भाषा या लेखक से खोजें', insertOptions: 'अतिरिक्त', brackets: '﴿ ﴾ कोष्ठक', auza: 'तअव्वुज़',
    basmala: 'बिस्मिल्लाह', ref: 'अरबी संदर्भ', newPara: 'नए अनुच्छेद में (Word)',
    arabicText: 'अरबी पाठ', translationText: 'अनुवाद और तफ़सीर का पाठ', font: 'फ़ॉन्ट', size: 'आकार', docFont: '(दस्तावेज़ जैसा)', save: 'सहेजें', surahInfo: 'सूरह के बारे में', close: 'बंद करें',
    ayahByAyah: 'यह मुसहफ़ केवल आयत-दर-आयत है: आयत के भीतर शब्द चयन अनुमानित हो सकता है।',
    noInfo: 'इस भाषा में उपलब्ध नहीं, अंग्रेज़ी दिखाई जा रही है।', ayahs: 'आयतें', meccan: 'मक्की', medinan: 'मदनी',
    'script.default': 'सार्वभौमिक फ़ॉन्ट', 'script.quranLibrary': 'क़ुरआन लाइब्रेरी', 'script.tajweed': 'तजवीद',
    'script.simple': 'सरल (इमलाई)', refTr: 'अनुवाद संदर्भ', help: 'सहायता' };

  L.es = { _name: 'Español', search: '2:255 · Al-Baqara 30-37 · الرحمن الرحيم · texto de la traducción', ayah: 'Aleya',
    results: '{n} resultados', notFound: 'Sin resultados', loading: 'Cargando…',
    fullAyah: 'Aleya completa', insert: 'Insertar', copy: 'Copiar', copied: 'Copiado', copiedPaste: 'Copiado — pegue donde quiera (Ctrl+V)',
    inserted: 'Insertado', error: 'Error', settings: 'Ajustes', uiLang: 'Idioma de la interfaz', mushaf: 'Mushaf (texto árabe)',
    translation: 'Traducción', withTranslation: 'Añadir traducción', tafsir: 'Tafsir', withTafsir: 'Añadir tafsir',
    filter: 'Buscar por idioma o autor', insertOptions: 'Extras', brackets: 'Paréntesis ﴿ ﴾', auza: 'Isti‘adha',
    basmala: 'Basmala', ref: 'Referencia árabe', newPara: 'Insertar como párrafo nuevo (Word)',
    arabicText: 'Texto árabe', translationText: 'Texto de traducción y tafsir', font: 'Fuente', size: 'Tamaño', docFont: '(como el documento)', save: 'Guardar', surahInfo: 'Sobre la sura', close: 'Cerrar',
    ayahByAyah: 'Este mushaf solo existe aleya por aleya: la selección de palabras puede ser aproximada.',
    noInfo: 'No disponible en este idioma, se muestra en inglés.', ayahs: 'aleyas', meccan: 'Mequí', medinan: 'Medinense',
    'script.default': 'Fuente universal', 'script.quranLibrary': 'Biblioteca coránica', 'script.tajweed': 'Tajwid',
    'script.simple': 'Simple (imla’i)', refTr: 'Referencia de la traducción', help: 'Ayuda' };

  L.zh = { _name: '中文', search: '2:255 · 黄牛 30-37 · الرحمن الرحيم · 译文', ayah: '节',
    results: '{n} 个结果', notFound: '未找到', loading: '加载中…',
    fullAyah: '整节', insert: '插入', copy: '复制', copied: '已复制', copiedPaste: '已复制 — 可粘贴到任意位置 (Ctrl+V)',
    inserted: '已插入', error: '错误', settings: '设置', uiLang: '界面语言', mushaf: '经本（阿拉伯文）',
    translation: '译文', withTranslation: '添加译文', tafsir: '经注', withTafsir: '添加经注',
    filter: '按语言或作者筛选', insertOptions: '附加', brackets: '﴿ ﴾ 括号', auza: '求护词',
    basmala: '泰斯米', ref: '阿拉伯文出处', newPara: '作为新段落插入 (Word)',
    arabicText: '阿拉伯文', translationText: '译文和经注', font: '字体', size: '字号', docFont: '（与文档相同）', save: '保存', surahInfo: '章节简介', close: '关闭',
    ayahByAyah: '此经本仅按节提供：节内选词可能不精确。',
    noInfo: '无此语言版本，显示英文。', ayahs: '节', meccan: '麦加章', medinan: '麦地那章',
    'script.default': '通用字体', 'script.quranLibrary': '古兰经图书馆', 'script.tajweed': '泰吉威德',
    'script.simple': '简易拼写', refTr: '译文出处', help: '帮助' };

  L.ko = { _name: '한국어', search: '2:255 · 알바까라 30-37 · الرحمن الرحيم · 번역문', ayah: '절',
    results: '결과 {n}개', notFound: '결과 없음', loading: '불러오는 중…',
    fullAyah: '절 전체', insert: '삽입', copy: '복사', copied: '복사됨', copiedPaste: '복사됨 — 원하는 곳에 붙여넣기 (Ctrl+V)',
    inserted: '삽입됨', error: '오류', settings: '설정', uiLang: '인터페이스 언어', mushaf: '무스하프 (아랍어 원문)',
    translation: '번역', withTranslation: '번역 추가', tafsir: '타프시르', withTafsir: '타프시르 추가',
    filter: '언어 또는 저자로 검색', insertOptions: '추가 항목', brackets: '﴿ ﴾ 괄호', auza: '이스티아자',
    basmala: '바스말라', ref: '아랍어 출처', newPara: '새 단락으로 삽입 (Word)',
    arabicText: '아랍어 원문', translationText: '번역 및 타프시르', font: '글꼴', size: '크기', docFont: '(문서와 동일)', save: '저장', surahInfo: '장 정보', close: '닫기',
    ayahByAyah: '이 무스하프는 절 단위만 제공됩니다: 절 안의 단어 선택은 근사치일 수 있습니다.',
    noInfo: '이 언어로는 없어 영어로 표시합니다.', ayahs: '절', meccan: '메카 계시', medinan: '메디나 계시',
    'script.default': '범용 글꼴', 'script.quranLibrary': '꾸란 라이브러리', 'script.tajweed': '타즈위드',
    'script.simple': '간이 표기', refTr: '번역 출처', help: '도움말' };

  L.ja = { _name: '日本語', search: '2:255 · 雌牛章 30-37 · الرحمن الرحيم · 訳文', ayah: '節',
    results: '{n} 件', notFound: '見つかりません', loading: '読み込み中…',
    fullAyah: '節全体', insert: '挿入', copy: 'コピー', copied: 'コピーしました', copiedPaste: 'コピーしました — 任意の場所に貼り付け (Ctrl+V)',
    inserted: '挿入しました', error: 'エラー', settings: '設定', uiLang: '表示言語', mushaf: 'ムスハフ（アラビア語本文）',
    translation: '翻訳', withTranslation: '翻訳を追加', tafsir: 'タフスィール', withTafsir: 'タフスィールを追加',
    filter: '言語・著者で検索', insertOptions: '追加', brackets: '﴿ ﴾ 括弧', auza: 'イスティアーザ',
    basmala: 'バスマラ', ref: 'アラビア語の出典', newPara: '新しい段落として挿入 (Word)',
    arabicText: 'アラビア語本文', translationText: '翻訳・タフスィール', font: 'フォント', size: 'サイズ', docFont: '（文書と同じ）', save: '保存', surahInfo: '章について', close: '閉じる',
    ayahByAyah: 'このムスハフは節単位のみです：節内の語の選択は近似になる場合があります。',
    noInfo: 'この言語ではないため英語で表示します。', ayahs: '節', meccan: 'マッカ啓示', medinan: 'マディーナ啓示',
    'script.default': '汎用フォント', 'script.quranLibrary': 'クルアーン・ライブラリー', 'script.tajweed': 'タジュウィード',
    'script.simple': '簡易表記', refTr: '翻訳の出典', help: 'ヘルプ' };

  var ORDER = ['uz', 'uz_latn', 'ar', 'en', 'ru', 'tr', 'fr', 'de', 'es', 'kk', 'ky', 'tg', 'az',
               'fa', 'ur', 'id', 'ms', 'bn', 'hi', 'zh', 'ko', 'ja'];

  function I18n(lang) { this.set(lang); }
  I18n.prototype.set = function (lang) { this.lang = L[lang] ? lang : 'uz'; };
  I18n.prototype.t = function (key, vars) {
    var s = (L[this.lang] || {})[key];
    if (s == null) s = L.en[key];
    if (s == null) s = L.uz[key];
    if (s == null) s = key;
    if (vars) s = s.replace(/\{(\w+)\}/g, function (_, k) { return vars[k] != null ? vars[k] : ''; });
    return s;
  };
  I18n.prototype.dir = function () { return (L[this.lang] && L[this.lang]._dir) || 'ltr'; };
  I18n.languages = ORDER.map(function (k) { return { id: k, name: L[k]._name }; });
  /* Language tag used for surah info / surah names, e.g. uz_latn -> uz */
  I18n.prototype.code = function () { return this.lang.split('_')[0]; };

  root.I18n = I18n;
})(typeof self !== 'undefined' ? self : this);
