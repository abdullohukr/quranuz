/* Interface languages. Missing keys fall back to English, then Uzbek. */
(function (root) {
  'use strict';
  var L = {};

  L.uz = { bold: 'Қалин', italic: 'Курсив', underline: 'Таги чизилган', color: 'Ранг', alignment: 'Текислаш', lineSpacing: 'Қатор оралиғи', auto: 'Авто', arAsText: 'Араб матнини расм эмас, матн сифатида қўйиш (Word Online / iPad)', tabGeneral: 'Асосий', tabInsert: 'Қўйиш', tabFonts: 'Формат', theme: 'Мавзу', themeAuto: 'Тизимдагидек', themeLight: 'Ёруғ', themeDark: 'Қоронғи', themeSepia: 'Сепия', themeOcean: 'Океан', themeForest: 'Ўрмон', themeMidnight: 'Ярим тун', themeRose: 'Атиргул', themeLavender: 'Лаванда', themeDesert: 'Саҳро', themeGraphite: 'Графит', themeNord: 'Норд', themeContrast: 'Контраст', mushafFont: 'мусҳаф шрифти', _name: 'Ўзбекча',
    search: '2:255 · Бақара 30-37 · الرحمن الرحيم · таржима матни', ayah: 'Оят', results: '{n} та натижа',
    notFound: 'Топилмади', loading: 'Юкланмоқда…',
    fullAyah: 'Тўлиқ оят', insert: 'Қўйиш', copy: 'Нусха олиш', copied: 'Нусха олинди', copiedPaste: 'Нусха олинди — исталган жойга қўйинг (Ctrl+V)',
    inserted: 'Қўйилди', error: 'Хато', settings: 'Созламалар', uiLang: 'Интерфейс тили', mushaf: 'Мусҳаф (араб матни)',
    translation: 'Таржима', withTranslation: 'Таржимани қўшиш', tafsir: 'Тафсир', withTafsir: 'Тафсирни қўшиш',
    filter: 'Тил ёки муаллиф бўйича излаш', insertOptions: 'Қўшимча', brackets: 'Қавслар', auza: 'Аъузу',
    basmala: 'Басмала', ref: 'Арабча ҳавола', newPara: 'Автоматик янги абзац (Word)',
    arabicText: 'Араб матни', translationText: 'Таржима ва тафсир матни', font: 'Шрифт', size: 'Ўлчам', docFont: '(ҳужжатдагидек)', save: 'Сақлаш', surahInfo: 'Сура ҳақида', close: 'Ёпиш',
    ayahByAyah: 'Бу мусҳаф оятма-оят шаклда: оят ичидан сўз танлаш тахминий бўлиши мумкин.',
    noInfo: 'Бу тилда маълумот йўқ, инглизчаси кўрсатилмоқда.', ayahs: 'оят', meccan: 'Маккий', medinan: 'Маданий',
    'script.default': 'Универсал Қуръоний шрифт', 'script.quranLibrary': 'Quran Library', 'script.tajweed': 'Тажвид',
    'script.simple': 'Оддий (имлоий)', refTr: 'Таржима ҳаволаси', help: 'Ёрдам' };

  L.uz_latn = { bold: 'Qalin', italic: 'Kursiv', underline: 'Tagi chizilgan', color: 'Rang', alignment: 'Tekislash', lineSpacing: 'Qator oraligʻi', auto: 'Avto', arAsText: 'Arab matnini rasm emas, matn sifatida qoʻyish (Word Online / iPad)', tabGeneral: 'Asosiy', tabInsert: 'Qoʻyish', tabFonts: 'Format', theme: 'Mavzu', themeAuto: 'Tizimdagidek', themeLight: 'Yorugʻ', themeDark: 'Qorongʻi', themeSepia: 'Sepiya', themeOcean: 'Okean', themeForest: 'Oʻrmon', themeMidnight: 'Yarim tun', themeRose: 'Atirgul', themeLavender: 'Lavanda', themeDesert: 'Sahro', themeGraphite: 'Grafit', themeNord: 'Nord', themeContrast: 'Kontrast', mushafFont: 'mushaf shrifti', _name: 'Oʻzbekcha (lotin)',
    search: '2:255 · Baqara 30-37 · الرحمن الرحيم · tarjima matni', ayah: 'Oyat', results: '{n} ta natija',
    notFound: 'Topilmadi', loading: 'Yuklanmoqda…',
    fullAyah: 'Toʻliq oyat', insert: 'Qoʻyish', copy: 'Nusxa olish', copied: 'Nusxa olindi', copiedPaste: 'Nusxa olindi — istalgan joyga qoʻying (Ctrl+V)',
    inserted: 'Qoʻyildi', error: 'Xato', settings: 'Sozlamalar', uiLang: 'Interfeys tili', mushaf: 'Mushaf (arab matni)',
    translation: 'Tarjima', withTranslation: 'Tarjimani qoʻshish', tafsir: 'Tafsir', withTafsir: 'Tafsirni qoʻshish',
    filter: 'Til yoki muallif boʻyicha izlash', insertOptions: 'Qoʻshimcha', brackets: 'Qavslar', auza: 'Aʼuzu',
    basmala: 'Basmala', ref: 'Arabcha havola', newPara: 'Avtomatik yangi abzats (Word)',
    arabicText: 'Arab matni', translationText: 'Tarjima va tafsir matni', font: 'Shrift', size: 'Oʻlcham', docFont: '(hujjatdagidek)', save: 'Saqlash', surahInfo: 'Sura haqida', close: 'Yopish',
    ayahByAyah: 'Bu mushaf oyatma-oyat shaklda: oyat ichidan soʻz tanlash taxminiy boʻlishi mumkin.',
    noInfo: 'Bu tilda maʼlumot yoʻq, inglizchasi koʻrsatilmoqda.', ayahs: 'oyat', meccan: 'Makkiy', medinan: 'Madaniy',
    'script.default': 'Universal Qurʼoniy shrift', 'script.tajweed': 'Tajvid',
    'script.simple': 'Oddiy (imloiy)', refTr: 'Tarjima havolasi', help: 'Yordam' };

  L.en = { bold: 'Bold', italic: 'Italic', underline: 'Underline', color: 'Colour', alignment: 'Alignment', lineSpacing: 'Line spacing', auto: 'Auto', arAsText: 'Insert the Arabic as text, not a picture (Word Online / iPad)', tabGeneral: 'General', tabInsert: 'Insert', tabFonts: 'Format', theme: 'Theme', themeAuto: 'System', themeLight: 'Light', themeDark: 'Dark', themeSepia: 'Sepia', themeOcean: 'Ocean', themeForest: 'Forest', themeMidnight: 'Midnight', themeRose: 'Rose', themeLavender: 'Lavender', themeDesert: 'Desert', themeGraphite: 'Graphite', themeNord: 'Nord', themeContrast: 'High contrast', mushafFont: 'mushaf font', _name: 'English', search: '2:255 · Baqarah 30-37 · الرحمن الرحيم · translation text', ayah: 'Ayah',
    results: '{n} results', notFound: 'Nothing found', loading: 'Loading…',
    fullAyah: 'Whole ayah', insert: 'Insert', copy: 'Copy', copied: 'Copied', copiedPaste: 'Copied — paste anywhere (Ctrl+V)',
    inserted: 'Inserted', error: 'Error', settings: 'Settings', uiLang: 'Interface language', mushaf: 'Mushaf (Arabic text)',
    translation: 'Translation', withTranslation: 'Add translation', tafsir: 'Tafsir', withTafsir: 'Add tafsir',
    filter: 'Filter by language or author', insertOptions: 'Extras', brackets: 'Brackets', auza: 'Isti‘adhah (A‘udhu)',
    basmala: 'Basmalah', ref: 'Arabic reference', newPara: 'Insert as new paragraph (Word)',
    arabicText: 'Arabic text', translationText: 'Translation and tafsir text', font: 'Font', size: 'Size', docFont: '(as in document)', save: 'Save', surahInfo: 'About the surah', close: 'Close',
    ayahByAyah: 'This mushaf is ayah-by-ayah only: selecting words inside an ayah may be approximate.',
    noInfo: 'Not available in this language, showing English.', ayahs: 'ayahs', meccan: 'Meccan', medinan: 'Medinan',
    'script.default': 'Universal Quranic font', 'script.quranLibrary': 'Quran Library', 'script.tajweed': 'Tajweed',
    'script.simple': 'Simple (Imlaei)', refTr: 'Translation reference', help: 'Help' };

  L.ar = { bold: 'عريض', italic: 'مائل', underline: 'تسطير', color: 'اللون', alignment: 'المحاذاة', lineSpacing: 'تباعد الأسطر', auto: 'تلقائي', arAsText: 'إدراج النص العربي نصًا لا صورة (Word Online / iPad)', tabGeneral: 'عام', tabInsert: 'الإدراج', tabFonts: 'التنسيق', theme: 'السمة', themeAuto: 'حسب النظام', themeLight: 'فاتح', themeDark: 'داكن', themeSepia: 'بني فاتح', themeOcean: 'المحيط', themeForest: 'الغابة', themeMidnight: 'منتصف الليل', themeRose: 'وردي', themeLavender: 'خزامى', themeDesert: 'الصحراء', themeGraphite: 'رمادي داكن', themeNord: 'نورد', themeContrast: 'تباين عالٍ', _name: 'العربية', _dir: 'rtl', search: '2:255 · البقرة 30-37 · الرحمن الرحيم · نص الترجمة', ayah: 'آية',
    results: '{n} نتيجة', notFound: 'لا توجد نتائج', loading: 'جارٍ التحميل…',
    fullAyah: 'الآية كاملة', insert: 'إدراج', copy: 'نسخ', copied: 'تم النسخ', copiedPaste: 'تم النسخ — الصق في أي مكان (Ctrl+V)',
    inserted: 'تم الإدراج', error: 'خطأ', settings: 'الإعدادات', uiLang: 'لغة الواجهة', mushaf: 'المصحف (النص العربي)',
    translation: 'الترجمة', withTranslation: 'إضافة الترجمة', tafsir: 'التفسير', withTafsir: 'إضافة التفسير',
    filter: 'بحث باللغة أو المؤلف', insertOptions: 'إضافات', brackets: 'الأقواس', auza: 'الاستعاذة',
    basmala: 'البسملة', ref: 'المرجع العربي', newPara: 'إدراج في فقرة جديدة (Word)',
    arabicText: 'النص العربي', translationText: 'نص الترجمة والتفسير', font: 'الخط', size: 'الحجم', docFont: '(كما في المستند)', save: 'حفظ', surahInfo: 'عن السورة', close: 'إغلاق',
    ayahByAyah: 'هذا المصحف متوفر آيةً آية فقط: قد يكون تحديد الكلمات داخل الآية تقريبيًا.',
    noInfo: 'غير متوفر بهذه اللغة، يُعرض بالإنجليزية.', ayahs: 'آيات', meccan: 'مكية', medinan: 'مدنية',
    'script.default': 'الخط القرآني العام', 'script.quranLibrary': 'مكتبة القرآن', 'script.tajweed': 'التجويد',
    'script.simple': 'إملائي', refTr: 'مرجع الترجمة', help: 'مساعدة' };

  L.ru = { bold: 'Жирный', italic: 'Курсив', underline: 'Подчёркнутый', color: 'Цвет', alignment: 'Выравнивание', lineSpacing: 'Межстрочный', auto: 'Авто', arAsText: 'Вставлять арабский текстом, а не картинкой (Word Online / iPad)', tabGeneral: 'Основные', tabInsert: 'Вставка', tabFonts: 'Формат', theme: 'Тема', themeAuto: 'Как в системе', themeLight: 'Светлая', themeDark: 'Тёмная', themeSepia: 'Сепия', themeOcean: 'Океан', themeForest: 'Лес', themeMidnight: 'Полночь', themeRose: 'Роза', themeLavender: 'Лаванда', themeDesert: 'Пустыня', themeGraphite: 'Графит', themeNord: 'Норд', themeContrast: 'Контраст', mushafFont: 'шрифт мусхафа', _name: 'Русский', search: '2:255 · Бакара 30-37 · الرحمن الرحيم · текст перевода', ayah: 'Аят',
    results: 'Найдено: {n}', notFound: 'Ничего не найдено', loading: 'Загрузка…',
    fullAyah: 'Весь аят', insert: 'Вставить', copy: 'Копировать', copied: 'Скопировано', copiedPaste: 'Скопировано — вставьте куда нужно (Ctrl+V)',
    inserted: 'Вставлено', error: 'Ошибка', settings: 'Настройки', uiLang: 'Язык интерфейса', mushaf: 'Мусхаф (арабский текст)',
    translation: 'Перевод', withTranslation: 'Добавлять перевод', tafsir: 'Тафсир', withTafsir: 'Добавлять тафсир',
    filter: 'Поиск по языку или автору', insertOptions: 'Дополнительно', brackets: 'Скобки', auza: 'Истиаза (Аузу)',
    basmala: 'Басмала', ref: 'Арабская ссылка', newPara: 'Вставлять новым абзацем (Word)',
    arabicText: 'Арабский текст', translationText: 'Текст перевода и тафсира', font: 'Шрифт', size: 'Размер', docFont: '(как в документе)', save: 'Сохранить', surahInfo: 'О суре', close: 'Закрыть',
    ayahByAyah: 'Этот мусхаф доступен только по аятам: выбор слов внутри аята может быть приблизительным.',
    noInfo: 'На этом языке нет, показан английский.', ayahs: 'аятов', meccan: 'Мекканская', medinan: 'Мединская',
    'script.default': 'Универсальный Коранический шрифт', 'script.quranLibrary': 'Коранская библиотека', 'script.tajweed': 'Таджвид',
    'script.simple': 'Простой (имляи)', refTr: 'Ссылка перевода', help: 'Справка' };

  L.tr = { bold: 'Kalın', italic: 'İtalik', underline: 'Altı çizili', color: 'Renk', alignment: 'Hizalama', lineSpacing: 'Satır aralığı', auto: 'Otomatik', arAsText: 'Arapçayı resim değil metin olarak ekle (Word Online / iPad)', tabGeneral: 'Genel', tabInsert: 'Ekleme', tabFonts: 'Biçim', theme: 'Tema', themeAuto: 'Sistem', themeLight: 'Açık', themeDark: 'Koyu', themeSepia: 'Sepya', themeOcean: 'Okyanus', themeForest: 'Orman', themeMidnight: 'Gece yarısı', themeRose: 'Gül', themeLavender: 'Lavanta', themeDesert: 'Çöl', themeGraphite: 'Grafit', themeNord: 'Nord', themeContrast: 'Yüksek kontrast', _name: 'Türkçe', search: '2:255 · Bakara 30-37 · الرحمن الرحيم · meal metni', ayah: 'Ayet',
    results: '{n} sonuç', notFound: 'Bulunamadı', loading: 'Yükleniyor…',
    fullAyah: 'Ayetin tamamı', insert: 'Ekle', copy: 'Kopyala', copied: 'Kopyalandı', copiedPaste: 'Kopyalandı — istediğiniz yere yapıştırın (Ctrl+V)',
    inserted: 'Eklendi', error: 'Hata', settings: 'Ayarlar', uiLang: 'Arayüz dili', mushaf: 'Mushaf (Arapça metin)',
    translation: 'Meal', withTranslation: 'Meal ekle', tafsir: 'Tefsir', withTafsir: 'Tefsir ekle',
    filter: 'Dil veya yazara göre ara', insertOptions: 'Ekler', brackets: 'Parantezler', auza: 'Euzü',
    basmala: 'Besmele', ref: 'Arapça kaynak', newPara: 'Yeni paragraf olarak ekle (Word)',
    arabicText: 'Arapça metin', translationText: 'Meal ve tefsir metni', font: 'Yazı tipi', size: 'Boyut', docFont: '(belgedeki gibi)', save: 'Kaydet', surahInfo: 'Sure hakkında', close: 'Kapat',
    ayahByAyah: 'Bu mushaf yalnızca ayet ayet mevcuttur: ayet içinde kelime seçimi yaklaşık olabilir.',
    noInfo: 'Bu dilde mevcut değil, İngilizcesi gösteriliyor.', ayahs: 'ayet', meccan: 'Mekki', medinan: 'Medeni',
    'script.default': 'Evrensel Kur’an yazı tipi', 'script.quranLibrary': 'Kur’an Kütüphanesi', 'script.tajweed': 'Tecvid',
    'script.simple': 'Basit (imlâî)', refTr: 'Meal kaynağı', help: 'Yardım' };

  L.fr = { bold: 'Gras', italic: 'Italique', underline: 'Souligné', color: 'Couleur', alignment: 'Alignement', lineSpacing: 'Interligne', auto: 'Auto', arAsText: 'Insérer l’arabe en texte, pas en image (Word Online / iPad)', tabGeneral: 'Général', tabInsert: 'Insertion', tabFonts: 'Format', theme: 'Thème', themeAuto: 'Système', themeLight: 'Clair', themeDark: 'Sombre', themeSepia: 'Sépia', themeOcean: 'Océan', themeForest: 'Forêt', themeMidnight: 'Minuit', themeRose: 'Rose', themeLavender: 'Lavande', themeDesert: 'Désert', themeGraphite: 'Graphite', themeNord: 'Nord', themeContrast: 'Contraste élevé', _name: 'Français', search: '2:255 · Baqara 30-37 · الرحمن الرحيم · texte de la traduction', ayah: 'Verset',
    results: '{n} résultats', notFound: 'Aucun résultat', loading: 'Chargement…',
    fullAyah: 'Verset entier', insert: 'Insérer', copy: 'Copier', copied: 'Copié', copiedPaste: 'Copié — collez où vous voulez (Ctrl+V)',
    inserted: 'Inséré', error: 'Erreur', settings: 'Paramètres', uiLang: 'Langue de l’interface', mushaf: 'Mushaf (texte arabe)',
    translation: 'Traduction', withTranslation: 'Ajouter la traduction', tafsir: 'Tafsir', withTafsir: 'Ajouter le tafsir',
    filter: 'Filtrer par langue ou auteur', insertOptions: 'Options', brackets: 'Parenthèses', auza: 'Isti‘adha',
    basmala: 'Basmala', ref: 'Référence arabe', newPara: 'Insérer comme nouveau paragraphe (Word)',
    arabicText: 'Texte arabe', translationText: 'Texte de la traduction et du tafsir', font: 'Police', size: 'Taille', docFont: '(comme le document)', save: 'Enregistrer', surahInfo: 'À propos de la sourate', close: 'Fermer',
    ayahByAyah: 'Ce mushaf n’existe que verset par verset : la sélection de mots peut être approximative.',
    noInfo: 'Indisponible dans cette langue, affichage en anglais.', ayahs: 'versets', meccan: 'Mecquoise', medinan: 'Médinoise',
    'script.default': 'Police coranique universelle', 'script.quranLibrary': 'Bibliothèque coranique', 'script.tajweed': 'Tajwid',
    'script.simple': 'Simple (imla’i)', refTr: 'Référence de la traduction', help: 'Aide' };

  L.de = { bold: 'Fett', italic: 'Kursiv', underline: 'Unterstrichen', color: 'Farbe', alignment: 'Ausrichtung', lineSpacing: 'Zeilenabstand', auto: 'Auto', arAsText: 'Arabisch als Text statt als Bild einfügen (Word Online / iPad)', tabGeneral: 'Allgemein', tabInsert: 'Einfügen', tabFonts: 'Format', theme: 'Design', themeAuto: 'System', themeLight: 'Hell', themeDark: 'Dunkel', themeSepia: 'Sepia', themeOcean: 'Ozean', themeForest: 'Wald', themeMidnight: 'Mitternacht', themeRose: 'Rose', themeLavender: 'Lavendel', themeDesert: 'Wüste', themeGraphite: 'Graphit', themeNord: 'Nord', themeContrast: 'Hoher Kontrast', _name: 'Deutsch', search: '2:255 · Baqara 30-37 · الرحمن الرحيم · Übersetzungstext', ayah: 'Vers',
    results: '{n} Ergebnisse', notFound: 'Nichts gefunden', loading: 'Wird geladen…',
    fullAyah: 'Ganzer Vers', insert: 'Einfügen', copy: 'Kopieren', copied: 'Kopiert', copiedPaste: 'Kopiert — beliebig einfügen (Strg+V)',
    inserted: 'Eingefügt', error: 'Fehler', settings: 'Einstellungen', uiLang: 'Sprache der Oberfläche', mushaf: 'Mushaf (arabischer Text)',
    translation: 'Übersetzung', withTranslation: 'Übersetzung hinzufügen', tafsir: 'Tafsir', withTafsir: 'Tafsir hinzufügen',
    filter: 'Nach Sprache oder Autor filtern', insertOptions: 'Extras', brackets: 'Klammern', auza: 'Isti‘adha',
    basmala: 'Basmala', ref: 'Arabische Angabe', newPara: 'Als neuen Absatz einfügen (Word)',
    arabicText: 'Arabischer Text', translationText: 'Übersetzungs- und Tafsirtext', font: 'Schrift', size: 'Größe', docFont: '(wie im Dokument)', save: 'Speichern', surahInfo: 'Über die Sure', close: 'Schließen',
    ayahByAyah: 'Dieser Mushaf liegt nur versweise vor: die Wortauswahl im Vers kann ungenau sein.',
    noInfo: 'In dieser Sprache nicht verfügbar, Englisch wird angezeigt.', ayahs: 'Verse', meccan: 'Mekkanisch', medinan: 'Medinensisch',
    'script.default': 'Universelle Koranschrift', 'script.quranLibrary': 'Koran-Bibliothek', 'script.tajweed': 'Tadschwid',
    'script.simple': 'Einfach (Imla’i)', refTr: 'Angabe der Übersetzung', help: 'Hilfe' };

  L.kk = { bold: 'Қалың', italic: 'Көлбеу', underline: 'Асты сызылған', color: 'Түс', alignment: 'Туралау', lineSpacing: 'Жол аралығы', auto: 'Авто', arAsText: 'Арабшаны сурет емес, мәтін ретінде қою (Word Online / iPad)', tabGeneral: 'Негізгі', tabInsert: 'Қою', tabFonts: 'Пішім', theme: 'Тақырып', themeAuto: 'Жүйедегідей', themeLight: 'Ашық', themeDark: 'Күңгірт', themeSepia: 'Сепия', themeOcean: 'Мұхит', themeForest: 'Орман', themeMidnight: 'Түн ортасы', themeRose: 'Раушан', themeLavender: 'Лаванда', themeDesert: 'Шөл', themeGraphite: 'Графит', themeNord: 'Норд', themeContrast: 'Контраст', _name: 'Қазақша', search: '2:255 · Бақара 30-37 · الرحمن الرحيم · аударма мәтіні', ayah: 'Аят',
    results: '{n} нәтиже', notFound: 'Табылмады', loading: 'Жүктелуде…',
    fullAyah: 'Толық аят', insert: 'Қою', copy: 'Көшіру', copied: 'Көшірілді', copiedPaste: 'Көшірілді — кез келген жерге қойыңыз (Ctrl+V)',
    inserted: 'Қойылды', error: 'Қате', settings: 'Баптаулар', uiLang: 'Интерфейс тілі', mushaf: 'Мұсхаф (араб мәтіні)',
    translation: 'Аударма', withTranslation: 'Аударманы қосу', tafsir: 'Тәпсір', withTafsir: 'Тәпсірді қосу',
    filter: 'Тіл немесе автор бойынша іздеу', insertOptions: 'Қосымша', brackets: 'Жақшалар', auza: 'Ағузу',
    basmala: 'Бисмилла', ref: 'Арабша сілтеме', newPara: 'Жаңа абзац ретінде қою (Word)',
    arabicText: 'Араб мәтіні', translationText: 'Аударма мен тәпсір мәтіні', font: 'Қаріп', size: 'Өлшем', docFont: '(құжаттағыдай)', save: 'Сақтау', surahInfo: 'Сүре туралы', close: 'Жабу',
    ayahByAyah: 'Бұл мұсхаф тек аят бойынша: аят ішіндегі сөз таңдау шамамен болуы мүмкін.',
    noInfo: 'Бұл тілде жоқ, ағылшынша көрсетілуде.', ayahs: 'аят', meccan: 'Меккелік', medinan: 'Мәдиналық',
    'script.default': 'Әмбебап Құран қаріпі', 'script.quranLibrary': 'Құран кітапханасы', 'script.tajweed': 'Тәжуид',
    'script.simple': 'Қарапайым (имлаи)', refTr: 'Аударма сілтемесі', help: 'Анықтама' };

  L.ky = { bold: 'Калың', italic: 'Кыйшык', underline: 'Асты сызылган', color: 'Түс', alignment: 'Тегиздөө', lineSpacing: 'Сап аралыгы', auto: 'Авто', arAsText: 'Арабчаны сүрөт эмес, текст катары коюу (Word Online / iPad)', tabGeneral: 'Негизги', tabInsert: 'Коюу', tabFonts: 'Формат', theme: 'Тема', themeAuto: 'Системадагыдай', themeLight: 'Ачык', themeDark: 'Караңгы', themeSepia: 'Сепия', themeOcean: 'Океан', themeForest: 'Токой', themeMidnight: 'Түн ортосу', themeRose: 'Роза', themeLavender: 'Лаванда', themeDesert: 'Чөл', themeGraphite: 'Графит', themeNord: 'Норд', themeContrast: 'Контраст', _name: 'Кыргызча', search: '2:255 · Бакара 30-37 · الرحمن الرحيم · котормо тексти', ayah: 'Аят',
    results: '{n} натыйжа', notFound: 'Табылган жок', loading: 'Жүктөлүүдө…',
    fullAyah: 'Толук аят', insert: 'Коюу', copy: 'Көчүрүү', copied: 'Көчүрүлдү', copiedPaste: 'Көчүрүлдү — каалаган жерге коюңуз (Ctrl+V)',
    inserted: 'Коюлду', error: 'Ката', settings: 'Жөндөөлөр', uiLang: 'Интерфейс тили', mushaf: 'Мусхаф (араб тексти)',
    translation: 'Котормо', withTranslation: 'Котормону кошуу', tafsir: 'Тафсир', withTafsir: 'Тафсирди кошуу',
    filter: 'Тил же автор боюнча издөө', insertOptions: 'Кошумча', brackets: 'Кашаалар', auza: 'Аузу',
    basmala: 'Бисмилла', ref: 'Арабча шилтеме', newPara: 'Жаңы абзац катары коюу (Word)',
    arabicText: 'Араб тексти', translationText: 'Котормо жана тафсир тексти', font: 'Арип', size: 'Өлчөм', docFont: '(документтегидей)', save: 'Сактоо', surahInfo: 'Сүрө жөнүндө', close: 'Жабуу',
    ayahByAyah: 'Бул мусхаф аят боюнча гана: аяттын ичинен сөз тандоо болжолдуу болушу мүмкүн.',
    noInfo: 'Бул тилде жок, англисчеси көрсөтүлүүдө.', ayahs: 'аят', meccan: 'Меккелик', medinan: 'Мединалык',
    'script.default': 'Универсалдуу Куран ариби', 'script.quranLibrary': 'Куран китепканасы', 'script.tajweed': 'Тажвид',
    'script.simple': 'Жөнөкөй (имлаи)', refTr: 'Котормо шилтемеси', help: 'Жардам' };

  L.tg = { bold: 'Ғафс', italic: 'Курсив', underline: 'Хатдор', color: 'Ранг', alignment: 'Баробаркунӣ', lineSpacing: 'Фосилаи сатр', auto: 'Худкор', arAsText: 'Матни арабиро ҳамчун матн гузоштан, на расм (Word Online / iPad)', tabGeneral: 'Асосӣ', tabInsert: 'Гузоштан', tabFonts: 'Формат', theme: 'Мавзӯъ', themeAuto: 'Мисли система', themeLight: 'Равшан', themeDark: 'Торик', themeSepia: 'Сепия', themeOcean: 'Уқёнус', themeForest: 'Ҷангал', themeMidnight: 'Нисфи шаб', themeRose: 'Гулоб', themeLavender: 'Лаванда', themeDesert: 'Биёбон', themeGraphite: 'Графит', themeNord: 'Норд', themeContrast: 'Контраст', _name: 'Тоҷикӣ', search: '2:255 · Бақара 30-37 · الرحمن الرحيم · матни тарҷума', ayah: 'Оят',
    results: '{n} натиҷа', notFound: 'Ёфт нашуд', loading: 'Боргирӣ…',
    fullAyah: 'Ояти пурра', insert: 'Гузоштан', copy: 'Нусха', copied: 'Нусха гирифта шуд', copiedPaste: 'Нусха гирифта шуд — ба ҳар ҷо гузоред (Ctrl+V)',
    inserted: 'Гузошта шуд', error: 'Хато', settings: 'Танзимот', uiLang: 'Забони интерфейс', mushaf: 'Мусҳаф (матни арабӣ)',
    translation: 'Тарҷума', withTranslation: 'Илова кардани тарҷума', tafsir: 'Тафсир', withTafsir: 'Илова кардани тафсир',
    filter: 'Ҷустуҷӯ аз рӯи забон ё муаллиф', insertOptions: 'Иловагӣ', brackets: 'Қавсҳо', auza: 'Аъузу',
    basmala: 'Басмала', ref: 'Истиноди арабӣ', newPara: 'Ҳамчун сархати нав (Word)',
    arabicText: 'Матни арабӣ', translationText: 'Матни тарҷума ва тафсир', font: 'Ҳуруф', size: 'Андоза', docFont: '(мисли ҳуҷҷат)', save: 'Нигоҳ доштан', surahInfo: 'Дар бораи сура', close: 'Пӯшидан',
    ayahByAyah: 'Ин мусҳаф танҳо оят ба оят аст: интихоби калима дар дохили оят тахминӣ буда метавонад.',
    noInfo: 'Бо ин забон нест, англисӣ нишон дода мешавад.', ayahs: 'оят', meccan: 'Маккӣ', medinan: 'Мадинагӣ',
    'script.default': 'Ҳуруфи универсалии Қуръонӣ', 'script.quranLibrary': 'Китобхонаи Қуръон', 'script.tajweed': 'Таҷвид',
    'script.simple': 'Оддӣ (имлоӣ)', refTr: 'Истиноди тарҷума', help: 'Ёрӣ' };

  L.az = { bold: 'Qalın', italic: 'Kursiv', underline: 'Altından xətt', color: 'Rəng', alignment: 'Düzləndirmə', lineSpacing: 'Sətir aralığı', auto: 'Avto', arAsText: 'Ərəbcəni şəkil yox, mətn kimi əlavə et (Word Online / iPad)', tabGeneral: 'Əsas', tabInsert: 'Əlavə etmə', tabFonts: 'Format', theme: 'Mövzu', themeAuto: 'Sistem', themeLight: 'Açıq', themeDark: 'Tünd', themeSepia: 'Sepiya', themeOcean: 'Okean', themeForest: 'Meşə', themeMidnight: 'Gecə yarısı', themeRose: 'Qızılgül', themeLavender: 'Lavanda', themeDesert: 'Səhra', themeGraphite: 'Qrafit', themeNord: 'Nord', themeContrast: 'Yüksək kontrast', _name: 'Azərbaycanca', search: '2:255 · Bəqərə 30-37 · الرحمن الرحيم · tərcümə mətni', ayah: 'Ayə',
    results: '{n} nəticə', notFound: 'Tapılmadı', loading: 'Yüklənir…',
    fullAyah: 'Tam ayə', insert: 'Əlavə et', copy: 'Kopyala', copied: 'Kopyalandı', copiedPaste: 'Kopyalandı — istənilən yerə yapışdırın (Ctrl+V)',
    inserted: 'Əlavə edildi', error: 'Xəta', settings: 'Ayarlar', uiLang: 'İnterfeys dili', mushaf: 'Mushaf (ərəb mətni)',
    translation: 'Tərcümə', withTranslation: 'Tərcüməni əlavə et', tafsir: 'Təfsir', withTafsir: 'Təfsiri əlavə et',
    filter: 'Dil və ya müəllifə görə axtar', insertOptions: 'Əlavələr', brackets: 'Mötərizələr', auza: 'Əuzu',
    basmala: 'Bəsmələ', ref: 'Ərəbcə istinad', newPara: 'Yeni abzas kimi (Word)',
    arabicText: 'Ərəb mətni', translationText: 'Tərcümə və təfsir mətni', font: 'Şrift', size: 'Ölçü', docFont: '(sənəddəki kimi)', save: 'Yadda saxla', surahInfo: 'Surə haqqında', close: 'Bağla',
    ayahByAyah: 'Bu mushaf yalnız ayə-ayə mövcuddur: ayə daxilində söz seçimi təxmini ola bilər.',
    noInfo: 'Bu dildə yoxdur, ingiliscəsi göstərilir.', ayahs: 'ayə', meccan: 'Məkki', medinan: 'Mədəni',
    'script.default': 'Universal Quran şrifti', 'script.quranLibrary': 'Quran Kitabxanası', 'script.tajweed': 'Təcvid',
    'script.simple': 'Sadə (imlai)', refTr: 'Tərcümə istinadı', help: 'Kömək' };

  L.fa = { bold: 'پررنگ', italic: 'کج', underline: 'زیرخط', color: 'رنگ', alignment: 'تراز', lineSpacing: 'فاصله خطوط', auto: 'خودکار', arAsText: 'درج متن عربی به‌صورت متن، نه تصویر (Word Online / iPad)', tabGeneral: 'عمومی', tabInsert: 'درج', tabFonts: 'قالب', theme: 'پوسته', themeAuto: 'مانند سیستم', themeLight: 'روشن', themeDark: 'تیره', themeSepia: 'قهوه‌ای روشن', themeOcean: 'اقیانوس', themeForest: 'جنگل', themeMidnight: 'نیمه‌شب', themeRose: 'رز', themeLavender: 'اسطوخودوس', themeDesert: 'بیابان', themeGraphite: 'گرافیت', themeNord: 'نورد', themeContrast: 'کنتراست بالا', _name: 'فارسی', _dir: 'rtl', search: '2:255 · بقره 30-37 · الرحمن الرحيم · متن ترجمه', ayah: 'آیه',
    results: '{n} نتیجه', notFound: 'چیزی یافت نشد', loading: 'در حال بارگذاری…',
    fullAyah: 'آیه کامل', insert: 'درج', copy: 'رونوشت', copied: 'رونوشت شد', copiedPaste: 'رونوشت شد — هر جا خواستید بچسبانید (Ctrl+V)',
    inserted: 'درج شد', error: 'خطا', settings: 'تنظیمات', uiLang: 'زبان رابط', mushaf: 'مصحف (متن عربی)',
    translation: 'ترجمه', withTranslation: 'افزودن ترجمه', tafsir: 'تفسیر', withTafsir: 'افزودن تفسیر',
    filter: 'جستجو بر اساس زبان یا مؤلف', insertOptions: 'افزوده‌ها', brackets: 'پرانتزها', auza: 'استعاذه',
    basmala: 'بسمله', ref: 'ارجاع عربی', newPara: 'درج در بند جدید (Word)',
    arabicText: 'متن عربی', translationText: 'متن ترجمه و تفسیر', font: 'قلم', size: 'اندازه', docFont: '(مانند سند)', save: 'ذخیره', surahInfo: 'درباره سوره', close: 'بستن',
    ayahByAyah: 'این مصحف فقط آیه به آیه است: انتخاب کلمه در آیه ممکن است تقریبی باشد.',
    noInfo: 'به این زبان موجود نیست، انگلیسی نمایش داده می‌شود.', ayahs: 'آیه', meccan: 'مکی', medinan: 'مدنی',
    'script.default': 'قلم قرآنی عمومی', 'script.quranLibrary': 'کتابخانه قرآن', 'script.tajweed': 'تجوید',
    'script.simple': 'ساده (املایی)', refTr: 'ارجاع ترجمه', help: 'راهنما' };

  L.ur = { bold: 'جلی', italic: 'ترچھا', underline: 'خط کشیدہ', color: 'رنگ', alignment: 'ترتیب', lineSpacing: 'سطری فاصلہ', auto: 'خودکار', arAsText: 'عربی کو تصویر کے بجائے متن کے طور پر داخل کریں (Word Online / iPad)', tabGeneral: 'عمومی', tabInsert: 'داخل کرنا', tabFonts: 'فارمیٹ', theme: 'تھیم', themeAuto: 'سسٹم کے مطابق', themeLight: 'روشن', themeDark: 'تاریک', themeSepia: 'سیپیا', themeOcean: 'سمندر', themeForest: 'جنگل', themeMidnight: 'آدھی رات', themeRose: 'گلاب', themeLavender: 'لیونڈر', themeDesert: 'صحرا', themeGraphite: 'گریفائٹ', themeNord: 'نورڈ', themeContrast: 'زیادہ کنٹراسٹ', _name: 'اردو', _dir: 'rtl', search: '2:255 · البقرۃ 30-37 · الرحمن الرحيم · ترجمے کا متن', ayah: 'آیت',
    results: '{n} نتائج', notFound: 'کچھ نہیں ملا', loading: 'لوڈ ہو رہا ہے…',
    fullAyah: 'پوری آیت', insert: 'داخل کریں', copy: 'کاپی', copied: 'کاپی ہو گیا', copiedPaste: 'کاپی ہو گیا — کہیں بھی چسپاں کریں (Ctrl+V)',
    inserted: 'داخل ہو گیا', error: 'خرابی', settings: 'ترتیبات', uiLang: 'انٹرفیس کی زبان', mushaf: 'مصحف (عربی متن)',
    translation: 'ترجمہ', withTranslation: 'ترجمہ شامل کریں', tafsir: 'تفسیر', withTafsir: 'تفسیر شامل کریں',
    filter: 'زبان یا مصنف سے تلاش', insertOptions: 'اضافی', brackets: 'قوسین', auza: 'تعوذ',
    basmala: 'بسم اللہ', ref: 'عربی حوالہ', newPara: 'نئے پیراگراف میں (Word)',
    arabicText: 'عربی متن', translationText: 'ترجمہ اور تفسیر کا متن', font: 'فونٹ', size: 'سائز', docFont: '(دستاویز کی طرح)', save: 'محفوظ کریں', surahInfo: 'سورت کے بارے میں', close: 'بند کریں',
    ayahByAyah: 'یہ مصحف صرف آیت بہ آیت ہے: آیت کے اندر الفاظ کا انتخاب تقریبی ہو سکتا ہے۔',
    noInfo: 'اس زبان میں دستیاب نہیں، انگریزی دکھائی جا رہی ہے۔', ayahs: 'آیات', meccan: 'مکی', medinan: 'مدنی',
    'script.default': 'عمومی قرآنی فونٹ', 'script.quranLibrary': 'قرآن لائبریری', 'script.tajweed': 'تجوید',
    'script.simple': 'سادہ (املائی)', refTr: 'ترجمے کا حوالہ', help: 'مدد' };

  L.id = { bold: 'Tebal', italic: 'Miring', underline: 'Garis bawah', color: 'Warna', alignment: 'Perataan', lineSpacing: 'Spasi baris', auto: 'Otomatis', arAsText: 'Sisipkan teks Arab sebagai teks, bukan gambar (Word Online / iPad)', tabGeneral: 'Umum', tabInsert: 'Sisipkan', tabFonts: 'Format', theme: 'Tema', themeAuto: 'Sistem', themeLight: 'Terang', themeDark: 'Gelap', themeSepia: 'Sepia', themeOcean: 'Samudra', themeForest: 'Hutan', themeMidnight: 'Tengah malam', themeRose: 'Mawar', themeLavender: 'Lavender', themeDesert: 'Gurun', themeGraphite: 'Grafit', themeNord: 'Nord', themeContrast: 'Kontras tinggi', _name: 'Bahasa Indonesia', search: '2:255 · Al-Baqarah 30-37 · الرحمن الرحيم · teks terjemahan', ayah: 'Ayat',
    results: '{n} hasil', notFound: 'Tidak ditemukan', loading: 'Memuat…',
    fullAyah: 'Ayat lengkap', insert: 'Sisipkan', copy: 'Salin', copied: 'Tersalin', copiedPaste: 'Tersalin — tempel di mana saja (Ctrl+V)',
    inserted: 'Disisipkan', error: 'Kesalahan', settings: 'Pengaturan', uiLang: 'Bahasa antarmuka', mushaf: 'Mushaf (teks Arab)',
    translation: 'Terjemahan', withTranslation: 'Tambahkan terjemahan', tafsir: 'Tafsir', withTafsir: 'Tambahkan tafsir',
    filter: 'Cari menurut bahasa atau penulis', insertOptions: 'Tambahan', brackets: 'Kurung', auza: 'Ta‘awwudz',
    basmala: 'Basmalah', ref: 'Rujukan Arab', newPara: 'Sisipkan sebagai paragraf baru (Word)',
    arabicText: 'Teks Arab', translationText: 'Teks terjemahan dan tafsir', font: 'Fon', size: 'Ukuran', docFont: '(seperti dokumen)', save: 'Simpan', surahInfo: 'Tentang surah', close: 'Tutup',
    ayahByAyah: 'Mushaf ini hanya per ayat: pemilihan kata di dalam ayat bisa tidak tepat.',
    noInfo: 'Tidak tersedia dalam bahasa ini, ditampilkan bahasa Inggris.', ayahs: 'ayat', meccan: 'Makkiyah', medinan: 'Madaniyah',
    'script.default': 'Fon Al-Qur’an universal', 'script.quranLibrary': 'Perpustakaan Al-Qur’an', 'script.tajweed': 'Tajwid',
    'script.simple': 'Sederhana (imla’i)', refTr: 'Rujukan terjemahan', help: 'Bantuan' };

  L.ms = { bold: 'Tebal', italic: 'Condong', underline: 'Garis bawah', color: 'Warna', alignment: 'Penjajaran', lineSpacing: 'Jarak baris', auto: 'Auto', arAsText: 'Masukkan teks Arab sebagai teks, bukan gambar (Word Online / iPad)', tabGeneral: 'Umum', tabInsert: 'Masukkan', tabFonts: 'Format', theme: 'Tema', themeAuto: 'Sistem', themeLight: 'Cerah', themeDark: 'Gelap', themeSepia: 'Sepia', themeOcean: 'Lautan', themeForest: 'Hutan', themeMidnight: 'Tengah malam', themeRose: 'Mawar', themeLavender: 'Lavender', themeDesert: 'Gurun', themeGraphite: 'Grafit', themeNord: 'Nord', themeContrast: 'Kontras tinggi', _name: 'Bahasa Melayu', search: '2:255 · Al-Baqarah 30-37 · الرحمن الرحيم · teks terjemahan', ayah: 'Ayat',
    results: '{n} hasil', notFound: 'Tiada hasil', loading: 'Memuatkan…',
    fullAyah: 'Ayat penuh', insert: 'Masukkan', copy: 'Salin', copied: 'Disalin', copiedPaste: 'Disalin — tampal di mana-mana (Ctrl+V)',
    inserted: 'Dimasukkan', error: 'Ralat', settings: 'Tetapan', uiLang: 'Bahasa antara muka', mushaf: 'Mushaf (teks Arab)',
    translation: 'Terjemahan', withTranslation: 'Tambah terjemahan', tafsir: 'Tafsir', withTafsir: 'Tambah tafsir',
    filter: 'Cari mengikut bahasa atau penulis', insertOptions: 'Tambahan', brackets: 'Kurungan', auza: 'Ta‘awwuz',
    basmala: 'Basmalah', ref: 'Rujukan Arab', newPara: 'Masukkan sebagai perenggan baharu (Word)',
    arabicText: 'Teks Arab', translationText: 'Teks terjemahan dan tafsir', font: 'Fon', size: 'Saiz', docFont: '(seperti dokumen)', save: 'Simpan', surahInfo: 'Tentang surah', close: 'Tutup',
    ayahByAyah: 'Mushaf ini hanya ayat demi ayat: pemilihan perkataan dalam ayat mungkin tidak tepat.',
    noInfo: 'Tiada dalam bahasa ini, dipaparkan bahasa Inggeris.', ayahs: 'ayat', meccan: 'Makkiyah', medinan: 'Madaniyah',
    'script.default': 'Fon al-Quran universal', 'script.quranLibrary': 'Perpustakaan Al-Quran', 'script.tajweed': 'Tajwid',
    'script.simple': 'Ringkas (imla’i)', refTr: 'Rujukan terjemahan', help: 'Bantuan' };

  L.bn = { bold: 'গাঢ়', italic: 'তির্যক', underline: 'নিম্নরেখা', color: 'রং', alignment: 'সারিবদ্ধকরণ', lineSpacing: 'লাইনের ব্যবধান', auto: 'স্বয়ংক্রিয়', arAsText: 'আরবি ছবি নয়, লেখা হিসেবে যুক্ত করুন (Word Online / iPad)', tabGeneral: 'সাধারণ', tabInsert: 'যুক্ত করা', tabFonts: 'ফরম্যাট', theme: 'থিম', themeAuto: 'সিস্টেম অনুযায়ী', themeLight: 'হালকা', themeDark: 'গাঢ়', themeSepia: 'সেপিয়া', themeOcean: 'সমুদ্র', themeForest: 'অরণ্য', themeMidnight: 'মধ্যরাত', themeRose: 'গোলাপ', themeLavender: 'ল্যাভেন্ডার', themeDesert: 'মরুভূমি', themeGraphite: 'গ্রাফাইট', themeNord: 'নর্ড', themeContrast: 'উচ্চ কনট্রাস্ট', _name: 'বাংলা', search: '2:255 · আল-বাকারা 30-37 · الرحمن الرحيم · অনুবাদের লেখা', ayah: 'আয়াত',
    results: '{n}টি ফলাফল', notFound: 'কিছু পাওয়া যায়নি', loading: 'লোড হচ্ছে…',
    fullAyah: 'পুরো আয়াত', insert: 'যোগ করুন', copy: 'কপি', copied: 'কপি হয়েছে', copiedPaste: 'কপি হয়েছে — যেকোনো জায়গায় পেস্ট করুন (Ctrl+V)',
    inserted: 'যোগ হয়েছে', error: 'ত্রুটি', settings: 'সেটিংস', uiLang: 'ইন্টারফেসের ভাষা', mushaf: 'মুসহাফ (আরবি লেখা)',
    translation: 'অনুবাদ', withTranslation: 'অনুবাদ যোগ করুন', tafsir: 'তাফসীর', withTafsir: 'তাফসীর যোগ করুন',
    filter: 'ভাষা বা লেখক দিয়ে খুঁজুন', insertOptions: 'অতিরিক্ত', brackets: 'বন্ধনী', auza: 'আউযুবিল্লাহ',
    basmala: 'বিসমিল্লাহ', ref: 'আরবি সূত্র', newPara: 'নতুন অনুচ্ছেদে যোগ (Word)',
    arabicText: 'আরবি লেখা', translationText: 'অনুবাদ ও তাফসীরের লেখা', font: 'ফন্ট', size: 'আকার', docFont: '(নথির মতো)', save: 'সংরক্ষণ', surahInfo: 'সূরা সম্পর্কে', close: 'বন্ধ',
    ayahByAyah: 'এই মুসহাফ শুধু আয়াত-ভিত্তিক: আয়াতের ভেতরে শব্দ নির্বাচন আনুমানিক হতে পারে।',
    noInfo: 'এই ভাষায় নেই, ইংরেজি দেখানো হচ্ছে।', ayahs: 'আয়াত', meccan: 'মাক্কী', medinan: 'মাদানী',
    'script.default': 'সর্বজনীন কুরআনিক ফন্ট', 'script.quranLibrary': 'কুরআন লাইব্রেরি', 'script.tajweed': 'তাজবীদ',
    'script.simple': 'সরল (ইমলায়ী)', refTr: 'অনুবাদের সূত্র', help: 'সহায়তা' };

  L.hi = { bold: 'बोल्ड', italic: 'तिरछा', underline: 'रेखांकित', color: 'रंग', alignment: 'संरेखण', lineSpacing: 'पंक्ति अंतर', auto: 'स्वचालित', arAsText: 'अरबी को चित्र नहीं, पाठ के रूप में डालें (Word Online / iPad)', tabGeneral: 'सामान्य', tabInsert: 'डालना', tabFonts: 'फ़ॉर्मेट', theme: 'थीम', themeAuto: 'सिस्टम जैसा', themeLight: 'हल्का', themeDark: 'गहरा', themeSepia: 'सीपिया', themeOcean: 'सागर', themeForest: 'वन', themeMidnight: 'आधी रात', themeRose: 'गुलाब', themeLavender: 'लैवेंडर', themeDesert: 'रेगिस्तान', themeGraphite: 'ग्रेफ़ाइट', themeNord: 'नॉर्ड', themeContrast: 'उच्च कंट्रास्ट', _name: 'हिन्दी', search: '2:255 · अल-बक़रा 30-37 · الرحمن الرحيم · अनुवाद का पाठ', ayah: 'आयत',
    results: '{n} परिणाम', notFound: 'कुछ नहीं मिला', loading: 'लोड हो रहा है…',
    fullAyah: 'पूरी आयत', insert: 'डालें', copy: 'कॉपी', copied: 'कॉपी हुआ', copiedPaste: 'कॉपी हुआ — कहीं भी पेस्ट करें (Ctrl+V)',
    inserted: 'डाला गया', error: 'त्रुटि', settings: 'सेटिंग्स', uiLang: 'इंटरफ़ेस की भाषा', mushaf: 'मुसहफ़ (अरबी पाठ)',
    translation: 'अनुवाद', withTranslation: 'अनुवाद जोड़ें', tafsir: 'तफ़सीर', withTafsir: 'तफ़सीर जोड़ें',
    filter: 'भाषा या लेखक से खोजें', insertOptions: 'अतिरिक्त', brackets: 'कोष्ठक', auza: 'तअव्वुज़',
    basmala: 'बिस्मिल्लाह', ref: 'अरबी संदर्भ', newPara: 'नए अनुच्छेद में (Word)',
    arabicText: 'अरबी पाठ', translationText: 'अनुवाद और तफ़सीर का पाठ', font: 'फ़ॉन्ट', size: 'आकार', docFont: '(दस्तावेज़ जैसा)', save: 'सहेजें', surahInfo: 'सूरह के बारे में', close: 'बंद करें',
    ayahByAyah: 'यह मुसहफ़ केवल आयत-दर-आयत है: आयत के भीतर शब्द चयन अनुमानित हो सकता है।',
    noInfo: 'इस भाषा में उपलब्ध नहीं, अंग्रेज़ी दिखाई जा रही है।', ayahs: 'आयतें', meccan: 'मक्की', medinan: 'मदनी',
    'script.default': 'सार्वभौमिक क़ुरआनी फ़ॉन्ट', 'script.quranLibrary': 'क़ुरआन लाइब्रेरी', 'script.tajweed': 'तजवीद',
    'script.simple': 'सरल (इमलाई)', refTr: 'अनुवाद संदर्भ', help: 'सहायता' };

  L.es = { bold: 'Negrita', italic: 'Cursiva', underline: 'Subrayado', color: 'Color', alignment: 'Alineación', lineSpacing: 'Interlineado', auto: 'Auto', arAsText: 'Insertar el árabe como texto, no como imagen (Word Online / iPad)', tabGeneral: 'General', tabInsert: 'Inserción', tabFonts: 'Formato', theme: 'Tema', themeAuto: 'Sistema', themeLight: 'Claro', themeDark: 'Oscuro', themeSepia: 'Sepia', themeOcean: 'Océano', themeForest: 'Bosque', themeMidnight: 'Medianoche', themeRose: 'Rosa', themeLavender: 'Lavanda', themeDesert: 'Desierto', themeGraphite: 'Grafito', themeNord: 'Nord', themeContrast: 'Alto contraste', _name: 'Español', search: '2:255 · Al-Baqara 30-37 · الرحمن الرحيم · texto de la traducción', ayah: 'Aleya',
    results: '{n} resultados', notFound: 'Sin resultados', loading: 'Cargando…',
    fullAyah: 'Aleya completa', insert: 'Insertar', copy: 'Copiar', copied: 'Copiado', copiedPaste: 'Copiado — pegue donde quiera (Ctrl+V)',
    inserted: 'Insertado', error: 'Error', settings: 'Ajustes', uiLang: 'Idioma de la interfaz', mushaf: 'Mushaf (texto árabe)',
    translation: 'Traducción', withTranslation: 'Añadir traducción', tafsir: 'Tafsir', withTafsir: 'Añadir tafsir',
    filter: 'Buscar por idioma o autor', insertOptions: 'Extras', brackets: 'Paréntesis', auza: 'Isti‘adha',
    basmala: 'Basmala', ref: 'Referencia árabe', newPara: 'Insertar como párrafo nuevo (Word)',
    arabicText: 'Texto árabe', translationText: 'Texto de traducción y tafsir', font: 'Fuente', size: 'Tamaño', docFont: '(como el documento)', save: 'Guardar', surahInfo: 'Sobre la sura', close: 'Cerrar',
    ayahByAyah: 'Este mushaf solo existe aleya por aleya: la selección de palabras puede ser aproximada.',
    noInfo: 'No disponible en este idioma, se muestra en inglés.', ayahs: 'aleyas', meccan: 'Mequí', medinan: 'Medinense',
    'script.default': 'Fuente coránica universal', 'script.quranLibrary': 'Biblioteca coránica', 'script.tajweed': 'Tajwid',
    'script.simple': 'Simple (imla’i)', refTr: 'Referencia de la traducción', help: 'Ayuda' };

  L.zh = { bold: '加粗', italic: '斜体', underline: '下划线', color: '颜色', alignment: '对齐', lineSpacing: '行距', auto: '自动', arAsText: '以文本而非图片插入阿拉伯文 (Word Online / iPad)', tabGeneral: '常规', tabInsert: '插入', tabFonts: '格式', theme: '主题', themeAuto: '跟随系统', themeLight: '浅色', themeDark: '深色', themeSepia: '复古', themeOcean: '海洋', themeForest: '森林', themeMidnight: '午夜', themeRose: '玫瑰', themeLavender: '薰衣草', themeDesert: '沙漠', themeGraphite: '石墨', themeNord: '北欧', themeContrast: '高对比度', _name: '中文', search: '2:255 · 黄牛 30-37 · الرحمن الرحيم · 译文', ayah: '节',
    results: '{n} 个结果', notFound: '未找到', loading: '加载中…',
    fullAyah: '整节', insert: '插入', copy: '复制', copied: '已复制', copiedPaste: '已复制 — 可粘贴到任意位置 (Ctrl+V)',
    inserted: '已插入', error: '错误', settings: '设置', uiLang: '界面语言', mushaf: '经本（阿拉伯文）',
    translation: '译文', withTranslation: '添加译文', tafsir: '经注', withTafsir: '添加经注',
    filter: '按语言或作者筛选', insertOptions: '附加', brackets: '括号', auza: '求护词',
    basmala: '泰斯米', ref: '阿拉伯文出处', newPara: '作为新段落插入 (Word)',
    arabicText: '阿拉伯文', translationText: '译文和经注', font: '字体', size: '字号', docFont: '（与文档相同）', save: '保存', surahInfo: '章节简介', close: '关闭',
    ayahByAyah: '此经本仅按节提供：节内选词可能不精确。',
    noInfo: '无此语言版本，显示英文。', ayahs: '节', meccan: '麦加章', medinan: '麦地那章',
    'script.default': '通用古兰经字体', 'script.quranLibrary': '古兰经图书馆', 'script.tajweed': '泰吉威德',
    'script.simple': '简易拼写', refTr: '译文出处', help: '帮助' };

  L.ko = { bold: '굵게', italic: '기울임꼴', underline: '밑줄', color: '색', alignment: '맞춤', lineSpacing: '줄 간격', auto: '자동', arAsText: '아랍어를 그림이 아닌 텍스트로 삽입 (Word Online / iPad)', tabGeneral: '일반', tabInsert: '삽입', tabFonts: '서식', theme: '테마', themeAuto: '시스템 설정', themeLight: '라이트', themeDark: '다크', themeSepia: '세피아', themeOcean: '오션', themeForest: '포레스트', themeMidnight: '미드나잇', themeRose: '로즈', themeLavender: '라벤더', themeDesert: '사막', themeGraphite: '그래파이트', themeNord: '노드', themeContrast: '고대비', _name: '한국어', search: '2:255 · 알바까라 30-37 · الرحمن الرحيم · 번역문', ayah: '절',
    results: '결과 {n}개', notFound: '결과 없음', loading: '불러오는 중…',
    fullAyah: '절 전체', insert: '삽입', copy: '복사', copied: '복사됨', copiedPaste: '복사됨 — 원하는 곳에 붙여넣기 (Ctrl+V)',
    inserted: '삽입됨', error: '오류', settings: '설정', uiLang: '인터페이스 언어', mushaf: '무스하프 (아랍어 원문)',
    translation: '번역', withTranslation: '번역 추가', tafsir: '타프시르', withTafsir: '타프시르 추가',
    filter: '언어 또는 저자로 검색', insertOptions: '추가 항목', brackets: '괄호', auza: '이스티아자',
    basmala: '바스말라', ref: '아랍어 출처', newPara: '새 단락으로 삽입 (Word)',
    arabicText: '아랍어 원문', translationText: '번역 및 타프시르', font: '글꼴', size: '크기', docFont: '(문서와 동일)', save: '저장', surahInfo: '장 정보', close: '닫기',
    ayahByAyah: '이 무스하프는 절 단위만 제공됩니다: 절 안의 단어 선택은 근사치일 수 있습니다.',
    noInfo: '이 언어로는 없어 영어로 표시합니다.', ayahs: '절', meccan: '메카 계시', medinan: '메디나 계시',
    'script.default': '범용 꾸란 글꼴', 'script.quranLibrary': '꾸란 라이브러리', 'script.tajweed': '타즈위드',
    'script.simple': '간이 표기', refTr: '번역 출처', help: '도움말' };

  L.ja = { bold: '太字', italic: '斜体', underline: '下線', color: '色', alignment: '配置', lineSpacing: '行間', auto: '自動', arAsText: 'アラビア語を画像ではなくテキストで挿入 (Word Online / iPad)', tabGeneral: '一般', tabInsert: '挿入', tabFonts: '書式', theme: 'テーマ', themeAuto: 'システムに合わせる', themeLight: 'ライト', themeDark: 'ダーク', themeSepia: 'セピア', themeOcean: 'オーシャン', themeForest: 'フォレスト', themeMidnight: 'ミッドナイト', themeRose: 'ローズ', themeLavender: 'ラベンダー', themeDesert: 'デザート', themeGraphite: 'グラファイト', themeNord: 'ノルド', themeContrast: 'ハイコントラスト', _name: '日本語', search: '2:255 · 雌牛章 30-37 · الرحمن الرحيم · 訳文', ayah: '節',
    results: '{n} 件', notFound: '見つかりません', loading: '読み込み中…',
    fullAyah: '節全体', insert: '挿入', copy: 'コピー', copied: 'コピーしました', copiedPaste: 'コピーしました — 任意の場所に貼り付け (Ctrl+V)',
    inserted: '挿入しました', error: 'エラー', settings: '設定', uiLang: '表示言語', mushaf: 'ムスハフ（アラビア語本文）',
    translation: '翻訳', withTranslation: '翻訳を追加', tafsir: 'タフスィール', withTafsir: 'タフスィールを追加',
    filter: '言語・著者で検索', insertOptions: '追加', brackets: '括弧', auza: 'イスティアーザ',
    basmala: 'バスマラ', ref: 'アラビア語の出典', newPara: '新しい段落として挿入 (Word)',
    arabicText: 'アラビア語本文', translationText: '翻訳・タフスィール', font: 'フォント', size: 'サイズ', docFont: '（文書と同じ）', save: '保存', surahInfo: '章について', close: '閉じる',
    ayahByAyah: 'このムスハフは節単位のみです：節内の語の選択は近似になる場合があります。',
    noInfo: 'この言語ではないため英語で表示します。', ayahs: '節', meccan: 'マッカ啓示', medinan: 'マディーナ啓示',
    'script.default': '汎用クルアーンフォント', 'script.quranLibrary': 'クルアーン・ライブラリー', 'script.tajweed': 'タジュウィード',
    'script.simple': '簡易表記', refTr: '翻訳の出典', help: 'ヘルプ' };

  /* Insert tab: mushaf signs */
  var MORE = {
    uz: { privacy: 'Махфийлик', terms: 'Шартлар', whatsNew: 'Янгиликлар', author: 'Абдуллоҳ Ҳамидуллоҳ ал-Мадийний', browser: 'Браузер', grpMarks: 'Мусҳаф белгилари', ayahNums: 'Оят рақамлари', hizb: 'Ҳизб белгиси', sajda: 'Сажда белгиси', waqf: 'Вақф белгилари', marksNote: 'Бу мусҳафда белгилар сўз билан бирга ёзилган, уларни олиб бўлмайди.' },
    uz_latn: { privacy: 'Maxfiylik', terms: 'Shartlar', whatsNew: 'Yangiliklar', browser: 'Brauzer', grpMarks: 'Mushaf belgilari', ayahNums: 'Oyat raqamlari', hizb: 'Hizb belgisi', sajda: 'Sajda belgisi', waqf: 'Vaqf belgilari', marksNote: 'Bu mushafda belgilar soʻz bilan birga yozilgan, ularni olib boʻlmaydi.' },
    ar: { author: 'عبد الله حميد الله المديني', privacy: 'الخصوصية', terms: 'الشروط', whatsNew: 'ما الجديد', browser: 'المتصفح', grpMarks: 'علامات المصحف', ayahNums: 'أرقام الآيات', hizb: 'علامة الحزب', sajda: 'علامة السجدة', waqf: 'علامات الوقف', marksNote: 'العلامات في هذا المصحف جزء من رسم الكلمات، فلا يمكن حذفها.' },
    en: { privacy: 'Privacy', terms: 'Terms', whatsNew: 'What\'s new', author: 'Abdulloh Hamidulloh al-Madiyniy', browser: 'Browser', grpMarks: 'Mushaf signs', ayahNums: 'Ayah numbers', hizb: 'Hizb sign', sajda: 'Sajdah sign', waqf: 'Pause (waqf) marks', marksNote: 'In this mushaf the signs are part of the words and cannot be removed.' },
    ru: { author: 'Абдуллах Хамидуллах ал-Мадийний', privacy: 'Конфиденциальность', terms: 'Условия', whatsNew: 'Что нового', browser: 'Браузер', grpMarks: 'Знаки мусхафа', ayahNums: 'Номера аятов', hizb: 'Знак хизба', sajda: 'Знак саджды', waqf: 'Знаки вакфа (паузы)', marksNote: 'В этом мусхафе знаки — часть слов, убрать их нельзя.' },
    tr: { privacy: 'Gizlilik', terms: 'Koşullar', whatsNew: 'Yenilikler', browser: 'Tarayıcı', grpMarks: 'Mushaf işaretleri', ayahNums: 'Ayet numaraları', hizb: 'Hizb işareti', sajda: 'Secde işareti', waqf: 'Vakıf işaretleri', marksNote: 'Bu mushafta işaretler kelimelerin parçasıdır, kaldırılamaz.' },
    fr: { privacy: 'Confidentialité', terms: 'Conditions', whatsNew: 'Nouveautés', browser: 'Navigateur', grpMarks: 'Signes du mushaf', ayahNums: 'Numéros des versets', hizb: 'Signe de hizb', sajda: 'Signe de prosternation', waqf: 'Signes de pause (waqf)', marksNote: 'Dans ce mushaf, les signes font partie des mots et ne peuvent pas être retirés.' },
    de: { privacy: 'Datenschutz', terms: 'Nutzungsbedingungen', whatsNew: 'Neuigkeiten', browser: 'Browser', grpMarks: 'Zeichen des Mushaf', ayahNums: 'Versnummern', hizb: 'Hizb-Zeichen', sajda: 'Sadschda-Zeichen', waqf: 'Pausenzeichen (Waqf)', marksNote: 'In diesem Mushaf sind die Zeichen Teil der Wörter und lassen sich nicht entfernen.' },
    es: { privacy: 'Privacidad', terms: 'Condiciones', whatsNew: 'Novedades', browser: 'Navegador', grpMarks: 'Signos del mushaf', ayahNums: 'Números de aleyas', hizb: 'Signo de hizb', sajda: 'Signo de postración', waqf: 'Signos de pausa (waqf)', marksNote: 'En este mushaf los signos forman parte de las palabras y no se pueden quitar.' },
    kk: { author: 'Абдуллах Хамидуллах ал-Мадийний', privacy: 'Құпиялылық', terms: 'Шарттар', whatsNew: 'Жаңалықтар', browser: 'Браузер', grpMarks: 'Мұсхаф белгілері', ayahNums: 'Аят нөмірлері', hizb: 'Хизб белгісі', sajda: 'Сәжде белгісі', waqf: 'Уақф белгілері', marksNote: 'Бұл мұсхафта белгілер сөздің бөлігі, оларды алып тастауға болмайды.' },
    ky: { author: 'Абдуллах Хамидуллах ал-Мадийний', privacy: 'Купуялуулук', terms: 'Шарттар', whatsNew: 'Жаңылыктар', browser: 'Браузер', grpMarks: 'Мусхаф белгилери', ayahNums: 'Аят номерлери', hizb: 'Хизб белгиси', sajda: 'Сажда белгиси', waqf: 'Вакф белгилери', marksNote: 'Бул мусхафта белгилер сөздүн бөлүгү, аларды алып салууга болбойт.' },
    tg: { author: 'Абдуллоҳ Ҳамидуллоҳ ал-Мадийний', privacy: 'Махфият', terms: 'Шартҳо', whatsNew: 'Навигариҳо', browser: 'Браузер', grpMarks: 'Аломатҳои мусҳаф', ayahNums: 'Рақамҳои оятҳо', hizb: 'Аломати ҳизб', sajda: 'Аломати саҷда', waqf: 'Аломатҳои вақф', marksNote: 'Дар ин мусҳаф аломатҳо қисми калимаҳоянд, онҳоро хориҷ кардан мумкин нест.' },
    az: { privacy: 'Məxfilik', terms: 'Şərtlər', whatsNew: 'Yeniliklər', browser: 'Brauzer', grpMarks: 'Mushaf işarələri', ayahNums: 'Ayə nömrələri', hizb: 'Hizb işarəsi', sajda: 'Səcdə işarəsi', waqf: 'Vəqf işarələri', marksNote: 'Bu mushafda işarələr sözlərin hissəsidir, onları silmək olmur.' },
    fa: { author: 'عبد الله حميد الله المديني', privacy: 'حریم خصوصی', terms: 'شرایط', whatsNew: 'تازه‌ها', browser: 'مرورگر', grpMarks: 'نشانه‌های مصحف', ayahNums: 'شماره آیات', hizb: 'نشانه حزب', sajda: 'نشانه سجده', waqf: 'نشانه‌های وقف', marksNote: 'در این مصحف نشانه‌ها بخشی از کلمات‌اند و حذف نمی‌شوند.' },
    ur: { author: 'عبد الله حميد الله المديني', privacy: 'رازداری', terms: 'شرائط', whatsNew: 'نیا کیا ہے', browser: 'براؤزر', grpMarks: 'مصحف کی علامات', ayahNums: 'آیات کے نمبر', hizb: 'حزب کی علامت', sajda: 'سجدے کی علامت', waqf: 'وقف کی علامات', marksNote: 'اس مصحف میں علامات الفاظ کا حصہ ہیں، انہیں ہٹایا نہیں جا سکتا۔' },
    id: { privacy: 'Privasi', terms: 'Ketentuan', whatsNew: 'Yang baru', browser: 'Browser', grpMarks: 'Tanda mushaf', ayahNums: 'Nomor ayat', hizb: 'Tanda hizb', sajda: 'Tanda sajdah', waqf: 'Tanda waqaf', marksNote: 'Di mushaf ini tanda-tanda menyatu dengan kata dan tidak bisa dihapus.' },
    ms: { privacy: 'Privasi', terms: 'Terma', whatsNew: 'Apa yang baharu', browser: 'Pelayar', grpMarks: 'Tanda mushaf', ayahNums: 'Nombor ayat', hizb: 'Tanda hizb', sajda: 'Tanda sajdah', waqf: 'Tanda wakaf', marksNote: 'Dalam mushaf ini tanda-tanda bercantum dengan perkataan dan tidak boleh dibuang.' },
    bn: { privacy: 'গোপনীয়তা', terms: 'শর্তাবলি', whatsNew: 'নতুন কী', browser: 'ব্রাউজার', grpMarks: 'মুসহাফের চিহ্ন', ayahNums: 'আয়াত নম্বর', hizb: 'হিযবের চিহ্ন', sajda: 'সিজদার চিহ্ন', waqf: 'ওয়াকফের চিহ্ন', marksNote: 'এই মুসহাফে চিহ্নগুলো শব্দের অংশ, এগুলো সরানো যায় না।' },
    hi: { privacy: 'गोपनीयता', terms: 'शर्तें', whatsNew: 'नया क्या है', browser: 'ब्राउज़र', grpMarks: 'मुसहफ़ के चिह्न', ayahNums: 'आयत संख्या', hizb: 'हिज़्ब चिह्न', sajda: 'सजदा चिह्न', waqf: 'वक़्फ़ चिह्न', marksNote: 'इस मुसहफ़ में चिह्न शब्दों का हिस्सा हैं, इन्हें हटाया नहीं जा सकता।' },
    zh: { privacy: '隐私', terms: '条款', whatsNew: '新功能', browser: '浏览器', grpMarks: '经文符号', ayahNums: '节号', hizb: '希兹布符号', sajda: '叩头符号', waqf: '停顿符号', marksNote: '此版本中符号是字形的一部分，无法删除。' },
    ko: { privacy: '개인정보', terms: '이용약관', whatsNew: '새로운 기능', browser: '브라우저', grpMarks: '무스하프 기호', ayahNums: '아야 번호', hizb: '히즈브 기호', sajda: '사즈다 기호', waqf: '와끄프(멈춤) 기호', marksNote: '이 무스하프에서는 기호가 단어의 일부라 제거할 수 없습니다.' },
    ja: { privacy: 'プライバシー', terms: '利用規約', whatsNew: '新機能', browser: 'ブラウザー', grpMarks: 'ムスハフの記号', ayahNums: '節番号', hizb: 'ヒズブ記号', sajda: 'サジダ記号', waqf: 'ワクフ（休止）記号', marksNote: 'このムスハフでは記号が語の一部のため、削除できません。' }
  };
  Object.keys(MORE).forEach(function (l) { for (var k in MORE[l]) L[l][k] = MORE[l][k]; });
  /* 3.5: strings every language must have (a missing one showed English or Uzbek) */
  var ALL = {
    mushafFont: { ar: 'خط المصحف', tr: 'mushaf yazı tipi', fr: 'police du mushaf', de: 'Mushaf-Schrift', es: 'fuente del mushaf',
      kk: 'мұсхаф қаріпі', ky: 'мусхаф арибі', tg: 'ҳуруфи мусҳаф', az: 'mushaf şrifti', fa: 'قلم مصحف', ur: 'مصحف کا فونٹ',
      id: 'fon mushaf', ms: 'fon mushaf', bn: 'মুসহাফের ফন্ট', hi: 'मुसहफ़ फ़ॉन्ट', zh: '经文字体', ko: '무스하프 글꼴', ja: 'ムスハフのフォント' },
    off: { uz: 'ўчирилган', uz_latn: 'oʻchirilgan', ar: 'متوقّف', en: 'off', ru: 'выключено', tr: 'kapalı', fr: 'désactivé', de: 'aus',
      es: 'desactivado', kk: 'өшірулі', ky: 'өчүрүлгөн', tg: 'хомӯш', az: 'söndürülüb', fa: 'خاموش', ur: 'بند', id: 'nonaktif',
      ms: 'dimatikan', bn: 'বন্ধ', hi: 'बंद', zh: '已关闭', ko: '꺼짐', ja: 'オフ' },
    'script.quranLibrary': { uz_latn: 'Quran Library' }
  };
  Object.keys(ALL).forEach(function (k) { for (var l in ALL[k]) if (L[l][k] == null) L[l][k] = ALL[k][l]; });
  /* 3.7: the Updates window */
  var UPD = {
    uz: { updates: 'Янгиланишлар', updChecking: 'Янги нусха текширилмоқда…', updLatest: 'Сизда энг сўнгги нусха ({v}).', updNew: 'Янги нусха чиқди: {v}', updNow: 'Ҳозир янгилаш',
      updOffline: 'Текшириб бўлмади: интернет йўқ.', updComputer: 'Шу компьютердаги шрифтлар ва Word қўшимчаси',
      updComputerNote: 'Панел ўзи янгиланади. Шрифтлар ва қўшимчани янгилаш учун ўрнатувчини яна ишга туширинг: ўзгармаган файллар қайта юкланмайди.',
      updDownload: 'Ўрнатувчини юклаб олиш', updAllWays: 'Бошқа усуллар', updAll: 'Барча нашрлар' },
    uz_latn: { updates: 'Yangilanishlar', updChecking: 'Yangi nusxa tekshirilmoqda…', updLatest: 'Sizda eng soʻnggi nusxa ({v}).', updNew: 'Yangi nusxa chiqdi: {v}', updNow: 'Hozir yangilash',
      updOffline: 'Tekshirib boʻlmadi: internet yoʻq.', updComputer: 'Shu kompyuterdagi shriftlar va Word qoʻshimchasi',
      updComputerNote: 'Panel oʻzi yangilanadi. Shriftlar va qoʻshimchani yangilash uchun oʻrnatuvchini yana ishga tushiring: oʻzgarmagan fayllar qayta yuklanmaydi.',
      updDownload: 'Oʻrnatuvchini yuklab olish', updAllWays: 'Boshqa usullar', updAll: 'Barcha nashrlar' },
    en: { updates: 'Updates', updChecking: 'Checking for a new version…', updLatest: 'You have the latest version ({v}).', updNew: 'A new version is out: {v}', updNow: 'Update now',
      updOffline: 'Could not check: no internet connection.', updComputer: 'Fonts and the Word add-in on this computer',
      updComputerNote: 'The panel updates itself. To update the fonts and the add-in, run the installer again: files that have not changed are not downloaded again.',
      updDownload: 'Download the installer', updAllWays: 'Other ways', updAll: 'All versions' },
    ar: { updates: 'التحديثات', updChecking: 'جارٍ البحث عن إصدار جديد…', updLatest: 'لديك أحدث إصدار ({v}).', updNew: 'صدر إصدار جديد: {v}', updNow: 'حدِّث الآن',
      updOffline: 'تعذّر التحقق: لا يوجد اتصال بالإنترنت.', updComputer: 'الخطوط وإضافة Word على هذا الحاسوب',
      updComputerNote: 'اللوحة تتحدّث تلقائيًا. لتحديث الخطوط والإضافة شغّل المثبّت مرة أخرى؛ الملفات التي لم تتغيّر لا تُنزَّل من جديد.',
      updDownload: 'تنزيل المثبّت', updAllWays: 'طرق أخرى', updAll: 'جميع الإصدارات' },
    ru: { updates: 'Обновления', updChecking: 'Проверяем новую версию…', updLatest: 'У вас последняя версия ({v}).', updNew: 'Вышла новая версия: {v}', updNow: 'Обновить сейчас',
      updOffline: 'Не удалось проверить: нет интернета.', updComputer: 'Шрифты и надстройка Word на этом компьютере',
      updComputerNote: 'Панель обновляется сама. Чтобы обновить шрифты и надстройку, запустите установщик ещё раз: неизменившиеся файлы заново не скачиваются.',
      updDownload: 'Скачать установщик', updAllWays: 'Другие способы', updAll: 'Все версии' },
    tr: { updates: 'Güncellemeler', updChecking: 'Yeni sürüm denetleniyor…', updLatest: 'En son sürüm sizde ({v}).', updNew: 'Yeni sürüm çıktı: {v}', updNow: 'Şimdi güncelle',
      updOffline: 'Denetlenemedi: internet bağlantısı yok.', updComputer: 'Bu bilgisayardaki yazı tipleri ve Word eklentisi',
      updComputerNote: 'Panel kendini günceller. Yazı tiplerini ve eklentiyi güncellemek için yükleyiciyi yeniden çalıştırın: değişmeyen dosyalar yeniden indirilmez.',
      updDownload: 'Yükleyiciyi indir', updAllWays: 'Diğer yollar', updAll: 'Tüm sürümler' },
    fr: { updates: 'Mises à jour', updChecking: 'Recherche d’une nouvelle version…', updLatest: 'Vous avez la dernière version ({v}).', updNew: 'Une nouvelle version est sortie : {v}', updNow: 'Mettre à jour',
      updOffline: 'Vérification impossible : pas de connexion Internet.', updComputer: 'Polices et complément Word sur cet ordinateur',
      updComputerNote: 'Le panneau se met à jour tout seul. Pour mettre à jour les polices et le complément, relancez l’installateur : les fichiers inchangés ne sont pas retéléchargés.',
      updDownload: 'Télécharger l’installateur', updAllWays: 'Autres méthodes', updAll: 'Toutes les versions' },
    de: { updates: 'Updates', updChecking: 'Suche nach neuer Version…', updLatest: 'Sie haben die neueste Version ({v}).', updNew: 'Neue Version erschienen: {v}', updNow: 'Jetzt aktualisieren',
      updOffline: 'Prüfung nicht möglich: keine Internetverbindung.', updComputer: 'Schriften und Word-Add-in auf diesem Computer',
      updComputerNote: 'Das Panel aktualisiert sich selbst. Um Schriften und Add-in zu aktualisieren, starten Sie das Installationsprogramm erneut: unveränderte Dateien werden nicht erneut geladen.',
      updDownload: 'Installationsprogramm laden', updAllWays: 'Andere Wege', updAll: 'Alle Versionen' },
    kk: { updates: 'Жаңартулар', updChecking: 'Жаңа нұсқа тексерілуде…', updLatest: 'Сізде ең соңғы нұсқа ({v}).', updNew: 'Жаңа нұсқа шықты: {v}', updNow: 'Қазір жаңарту',
      updOffline: 'Тексеру мүмкін болмады: интернет жоқ.', updComputer: 'Осы компьютердегі қаріптер мен Word қондырмасы',
      updComputerNote: 'Панель өзі жаңарады. Қаріптер мен қондырманы жаңарту үшін орнатқышты қайта іске қосыңыз: өзгермеген файлдар қайта жүктелмейді.',
      updDownload: 'Орнатқышты жүктеу', updAllWays: 'Басқа жолдар', updAll: 'Барлық нұсқалар' },
    ky: { updates: 'Жаңыртуулар', updChecking: 'Жаңы версия текшерилүүдө…', updLatest: 'Сизде эң акыркы версия ({v}).', updNew: 'Жаңы версия чыкты: {v}', updNow: 'Азыр жаңыртуу',
      updOffline: 'Текшерүү мүмкүн болгон жок: интернет жок.', updComputer: 'Бул компьютердеги арип жана Word кошумчасы',
      updComputerNote: 'Панель өзү жаңырат. Арип жана кошумчаны жаңыртуу үчүн орноткучту кайра иштетиңиз: өзгөрбөгөн файлдар кайра жүктөлбөйт.',
      updDownload: 'Орноткучту жүктөө', updAllWays: 'Башка жолдор', updAll: 'Бардык версиялар' },
    tg: { updates: 'Навсозиҳо', updChecking: 'Версияи нав санҷида мешавад…', updLatest: 'Шумо версияи охиринро доред ({v}).', updNew: 'Версияи нав баромад: {v}', updNow: 'Ҳозир навсозӣ',
      updOffline: 'Санҷидан нашуд: интернет нест.', updComputer: 'Ҳуруф ва иловаи Word дар ин компютер',
      updComputerNote: 'Панел худаш нав мешавад. Барои навсозии ҳуруф ва илова насбкунандаро боз оғоз кунед: файлҳои тағйирнаёфта дубора боргирӣ намешаванд.',
      updDownload: 'Боргирии насбкунанда', updAllWays: 'Роҳҳои дигар', updAll: 'Ҳамаи версияҳо' },
    az: { updates: 'Yeniləmələr', updChecking: 'Yeni versiya yoxlanılır…', updLatest: 'Sizdə ən son versiya var ({v}).', updNew: 'Yeni versiya çıxdı: {v}', updNow: 'İndi yenilə',
      updOffline: 'Yoxlamaq olmadı: internet yoxdur.', updComputer: 'Bu kompüterdəki şriftlər və Word əlavəsi',
      updComputerNote: 'Panel özü yenilənir. Şriftləri və əlavəni yeniləmək üçün quraşdırıcını yenidən işə salın: dəyişməmiş fayllar yenidən yüklənmir.',
      updDownload: 'Quraşdırıcını yüklə', updAllWays: 'Digər yollar', updAll: 'Bütün versiyalar' },
    fa: { updates: 'به‌روزرسانی‌ها', updChecking: 'در حال بررسی نسخهٔ جدید…', updLatest: 'شما آخرین نسخه را دارید ({v}).', updNew: 'نسخهٔ جدید منتشر شد: {v}', updNow: 'اکنون به‌روزرسانی شود',
      updOffline: 'بررسی ممکن نشد: اینترنت وصل نیست.', updComputer: 'قلم‌ها و افزونهٔ Word در این رایانه',
      updComputerNote: 'پنل خودش به‌روز می‌شود. برای به‌روزرسانی قلم‌ها و افزونه، نصب‌کننده را دوباره اجرا کنید؛ پرونده‌های تغییرنکرده دوباره بارگیری نمی‌شوند.',
      updDownload: 'بارگیری نصب‌کننده', updAllWays: 'راه‌های دیگر', updAll: 'همهٔ نسخه‌ها' },
    ur: { updates: 'اپ ڈیٹس', updChecking: 'نیا ورژن دیکھا جا رہا ہے…', updLatest: 'آپ کے پاس تازہ ترین ورژن ہے ({v})۔', updNew: 'نیا ورژن آ گیا: {v}', updNow: 'ابھی اپ ڈیٹ کریں',
      updOffline: 'جانچ نہیں ہو سکی: انٹرنیٹ نہیں ہے۔', updComputer: 'اس کمپیوٹر پر فونٹ اور Word ایڈ اِن',
      updComputerNote: 'پینل خود اپ ڈیٹ ہوتا ہے۔ فونٹ اور ایڈ اِن اپ ڈیٹ کرنے کے لیے انسٹالر دوبارہ چلائیں؛ جو فائلیں نہیں بدلیں وہ دوبارہ ڈاؤن لوڈ نہیں ہوتیں۔',
      updDownload: 'انسٹالر ڈاؤن لوڈ کریں', updAllWays: 'دوسرے طریقے', updAll: 'تمام ورژن' },
    id: { updates: 'Pembaruan', updChecking: 'Memeriksa versi baru…', updLatest: 'Anda memakai versi terbaru ({v}).', updNew: 'Versi baru tersedia: {v}', updNow: 'Perbarui sekarang',
      updOffline: 'Tidak dapat memeriksa: tidak ada internet.', updComputer: 'Fon dan add-in Word di komputer ini',
      updComputerNote: 'Panel memperbarui dirinya sendiri. Untuk memperbarui fon dan add-in, jalankan lagi penginstal: berkas yang tidak berubah tidak diunduh ulang.',
      updDownload: 'Unduh penginstal', updAllWays: 'Cara lain', updAll: 'Semua versi' },
    ms: { updates: 'Kemas kini', updChecking: 'Menyemak versi baharu…', updLatest: 'Anda menggunakan versi terkini ({v}).', updNew: 'Versi baharu telah keluar: {v}', updNow: 'Kemas kini sekarang',
      updOffline: 'Tidak dapat menyemak: tiada internet.', updComputer: 'Fon dan tambahan Word pada komputer ini',
      updComputerNote: 'Panel mengemas kini dirinya sendiri. Untuk mengemas kini fon dan tambahan, jalankan pemasang sekali lagi: fail yang tidak berubah tidak dimuat turun semula.',
      updDownload: 'Muat turun pemasang', updAllWays: 'Cara lain', updAll: 'Semua versi' },
    bn: { updates: 'হালনাগাদ', updChecking: 'নতুন সংস্করণ খোঁজা হচ্ছে…', updLatest: 'আপনার কাছে সর্বশেষ সংস্করণ আছে ({v})।', updNew: 'নতুন সংস্করণ এসেছে: {v}', updNow: 'এখনই হালনাগাদ করুন',
      updOffline: 'যাচাই করা যায়নি: ইন্টারনেট নেই।', updComputer: 'এই কম্পিউটারের ফন্ট ও Word অ্যাড-ইন',
      updComputerNote: 'প্যানেল নিজেই হালনাগাদ হয়। ফন্ট ও অ্যাড-ইন হালনাগাদ করতে ইনস্টলারটি আবার চালান: অপরিবর্তিত ফাইল আবার ডাউনলোড হয় না।',
      updDownload: 'ইনস্টলার ডাউনলোড করুন', updAllWays: 'অন্য উপায়', updAll: 'সব সংস্করণ' },
    hi: { updates: 'अपडेट', updChecking: 'नया संस्करण देखा जा रहा है…', updLatest: 'आपके पास नवीनतम संस्करण है ({v})।', updNew: 'नया संस्करण आया है: {v}', updNow: 'अभी अपडेट करें',
      updOffline: 'जाँच नहीं हो सकी: इंटरनेट नहीं है।', updComputer: 'इस कंप्यूटर पर फ़ॉन्ट और Word ऐड-इन',
      updComputerNote: 'पैनल अपने आप अपडेट होता है। फ़ॉन्ट और ऐड-इन अपडेट करने के लिए इंस्टॉलर फिर से चलाएँ: न बदली फ़ाइलें दोबारा डाउनलोड नहीं होतीं।',
      updDownload: 'इंस्टॉलर डाउनलोड करें', updAllWays: 'अन्य तरीके', updAll: 'सभी संस्करण' },
    es: { updates: 'Actualizaciones', updChecking: 'Buscando una versión nueva…', updLatest: 'Tiene la versión más reciente ({v}).', updNew: 'Hay una versión nueva: {v}', updNow: 'Actualizar ahora',
      updOffline: 'No se pudo comprobar: no hay conexión a Internet.', updComputer: 'Fuentes y complemento de Word en este equipo',
      updComputerNote: 'El panel se actualiza solo. Para actualizar las fuentes y el complemento, vuelva a ejecutar el instalador: los archivos sin cambios no se descargan de nuevo.',
      updDownload: 'Descargar el instalador', updAllWays: 'Otras formas', updAll: 'Todas las versiones' },
    zh: { updates: '更新', updChecking: '正在检查新版本…', updLatest: '您使用的是最新版本（{v}）。', updNew: '新版本已发布：{v}', updNow: '立即更新',
      updOffline: '无法检查：没有网络连接。', updComputer: '本机上的字体和 Word 加载项',
      updComputerNote: '面板会自动更新。要更新字体和加载项，请再次运行安装程序：未更改的文件不会重新下载。',
      updDownload: '下载安装程序', updAllWays: '其他方式', updAll: '所有版本' },
    ko: { updates: '업데이트', updChecking: '새 버전 확인 중…', updLatest: '최신 버전을 사용 중입니다 ({v}).', updNew: '새 버전이 나왔습니다: {v}', updNow: '지금 업데이트',
      updOffline: '확인할 수 없습니다: 인터넷 연결이 없습니다.', updComputer: '이 컴퓨터의 글꼴과 Word 추가 기능',
      updComputerNote: '패널은 자동으로 업데이트됩니다. 글꼴과 추가 기능을 업데이트하려면 설치 프로그램을 다시 실행하세요. 바뀌지 않은 파일은 다시 내려받지 않습니다.',
      updDownload: '설치 프로그램 내려받기', updAllWays: '다른 방법', updAll: '모든 버전' },
    ja: { updates: '更新', updChecking: '新しいバージョンを確認しています…', updLatest: '最新バージョンです（{v}）。', updNew: '新しいバージョンが出ました：{v}', updNow: '今すぐ更新',
      updOffline: '確認できません：インターネットに接続されていません。', updComputer: 'このコンピューターのフォントと Word アドイン',
      updComputerNote: 'パネルは自動で更新されます。フォントとアドインを更新するには、インストーラーをもう一度実行してください。変更のないファイルは再ダウンロードされません。',
      updDownload: 'インストーラーをダウンロード', updAllWays: 'その他の方法', updAll: 'すべてのバージョン' }
  };
  Object.keys(UPD).forEach(function (l) { for (var k in UPD[l]) L[l][k] = UPD[l][k]; });

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

  /* Footers of all pages: elements with data-i18n inside root get the text in the given language */
  I18n.localize = function (root, lang) {
    var i = new I18n(lang);
    if (root) [].forEach.call(root.querySelectorAll('[data-i18n]'), function (el) { el.textContent = i.t(el.dataset.i18n); });
    if (root) [].forEach.call(root.querySelectorAll('a[href$=".html"], a[data-page]'), function (a) {   // the next page in the same language
      var page = a.dataset.page || (a.dataset.page = a.getAttribute('href'));
      a.setAttribute('href', page + '?lang=' + lang);
    });
  };
  root.I18n = I18n;
})(typeof self !== 'undefined' ? self : this);
