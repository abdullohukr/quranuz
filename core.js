/* Shared logic for the website and the Word add-in: search + formatting. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QuranCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
  /* ayah end mark: the last token without letters: "۝١٢" (tafsir.one), "١٢" (QPC
     fonts draw the circle themselves), font-specific marker glyphs (Nastaleeq) */
  
  var MARKS = /[ؐ-ًؚ-ٟۖ-ۭ࣓-ࣿـ​-‏⁠۝۞۩]/g;
  var AUZA = 'أَعُوذُ بِٱللَّهِ مِنَ ٱلشَّیۡطَـٰنِ ٱلرَّجِیمِ';
  var BASMALA = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ';

  /* Tajweed colours (classes of QUL text_uthmani_tajweed) */
  var TAJWEED = {
    ham_wasl: '9A9A9A', slnt: '9A9A9A', laam_shamsiyah: '9A9A9A',
    madda_normal: '537FFF', madda_permissible: '4050FF', madda_necessary: '000EBC', madda_obligatory: '2144C1',
    qalaqah: 'DD0008', ikhafa_shafawi: 'D500B7', ikhafa: '9400A8', idgham_shafawi: '58B800', iqlab: '26BFFD',
    idgham_ghunnah: '169777', idgham_wo_ghunnah: '169200', idgham_mutajanisayn: 'A1A1A1',
    idgham_mutaqaribayn: 'A1A1A1', ghunnah: 'FF7E1E', qalqalah: 'DD0008', ikhfa: '9400A8',
    ikhfa_shafawi: 'D500B7', tafkheem: '0D47A1', idgham_mutajanisain: 'A1A1A1', idgham_mutaqaribain: 'A1A1A1'
  };

  function arNum(n) {
    return String(n).replace(/[0-9]/g, function (d) { return AR_DIGITS[+d]; });
  }
  function toLatinDigits(s) {
    return s.replace(/[٠-٩]/g, function (d) { return AR_DIGITS.indexOf(d); })
            .replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); });
  }

  /* Arabic normalisation for search. Four levels, from strict to loose:
     0: diacritics removed (dagger alef dropped)      الرحمن  العلمين
     1: dagger alef -> alef (imla'i spelling)          الرحمان العالمين
     2: skeleton: no alef / hamza, no doubled letters  لرحمن   لعلمين
     3: consonants only (no و / ي either), compared as whole words with a space allowed between any
        two letters (see search): الصلوة / الصلاة, فسويهن / فسواهن, بعدما / بعد ما.
     The Uthmani text and the usual (imla'i) spelling differ in long vowels, hamza seats and word joins:
     الصلوٰة / الصلاة, شیـٔا / شيئا, ٱلَّیۡل / الليل, إبرٰهـۧم / إبراهيم, یـٰۤأیها / يا أيها. */
  function normArabic(s, level) {
    if (level === 3) return normArabic(s, 2).replace(/[وي]/g, '').replace(/(.)\1+/g, '$1').replace(/\s+/g, ' ').trim();
    s = toLatinDigits(s).replace(/\s+(?=ٰ)/g, '').replace(/[ ⁠]/g, '')
      .replace(/۝[0-9]+/g, ' ').replace(/[0-9]/g, ' ')
      .replace(/ص([^ء-ي\s]*)ۜ/g, 'س$1')    // یبصۜط, بصۜطة: read and usually written with س
      .replace(/وٰ/g, 'ا')                            // الصلوٰة, الحیوٰة: الصلاة, الحياة
      .replace(/ىٰ(?=[^ء-ي\s]*[ء-ي])/g, 'ا')   // فبهدىٰهم, افترىٰه: inside a word ى is read ا
      .replace(/ى([^ء-ي\s]*)[ٕٔ]/g, '$1')            // أولـٰۤىِٕك: ى is only the seat of the hamza
      .replace(/(ه[^ء-ي\s]*)[ۥۦ]/g, '$1')           // بهۦ, لهۥ: not written
      .replace(/[ۦۧ]/g, 'ي').replace(/ۥ/g, 'و');          // إبرٰهـۧم, یحیۦ, داوۥد
    if (level === 1) s = s.replace(/ٰ/g, 'ا');
    else s = s.replace(/ٰ/g, '');
    s = s.replace(MARKS, '')
      .replace(/[ٱأإآ]/g, 'ا')
      .replace(/[ىیي]/g, 'ي')
      .replace(/[ئؤء]/g, '')                               // hamza and its seats: شيئا / شیـٔا, رؤوف / رءوف
      .replace(/ة/g, 'ه').replace(/ۀ/g, 'ه').replace(/ک/g, 'ك')
      .replace(/[^ء-ي\s]/g, ' ')
      .replace(/(^|\s)(يا|ها)\s+(?=\S)/g, '$1$2');       // يا أيها, ها أنتم: one word in the Uthmani text
    if (level === 2) s = s.replace(/ا/g, '').replace(/(.)\1+/g, '$1');   // الليل / ٱلَّیۡل
    return s.replace(/ا+/g, 'ا').replace(/\s+/g, ' ').trim();
  }

  /* Any language: lower case, no accents / punctuation. */
  var reMarks, reNonWord;
  try { reMarks = new RegExp('\\p{M}', 'gu'); reNonWord = new RegExp('[^\\p{L}\\p{N}\\s]', 'gu'); }
  catch (e) { reMarks = /[̀-ͯ]/g; reNonWord = /[!-\/:-@\[-`{-~«»“”„‘’…—–]/g; }
  function normText(s) {
    s = String(s || '').toLowerCase().replace(/[ʻʼ'`’‘]/g, '');
    if (s.normalize) s = s.normalize('NFD');
    return s.replace(reMarks, '').replace(reNonWord, ' ').replace(/\s+/g, ' ').trim();
  }

  function isArabic(s) { return /[؀-ۿݐ-ݿࢠ-ࣿ]/.test(s); }

  /* ---------- Search text in any language and script ----------
     ONE normalisation for the index builder (node) and for the query (browser, Worker), see
     docs/search-index-format.md. Code point by code point (a memo per code point keeps the builder fast):
       NFKD + lower case; combining marks dropped after Latin, Greek, Cyrillic, Arabic, Hebrew letters and kept
       elsewhere (Indic vowel signs are letters of their block, never dropped); ZWJ / ZWNJ / tatweel dropped;
       Latin ı→i ß→ss ø→o æ→ae œ→oe ł→l đ ð→d þ→th ə→e, apostrophes joined (oʻzi → ozi; French l' d' qu' split);
       Cyrillic ё→е й→и and the loose level қ→к ғ→г ҳ→х ў→у ң→н ө→о ү ұ→у ә→а і→и һ→х ҷ→ч ҙ→з ҫ→с;
       Arabic script ٱ أ إ آ→ا, ى ی ے ې→ي, ة ہ ۀ ھ ە→ه, ک→ك, ؤ→و, ء dropped, Arabic and Persian digits → 0-9.
     Tokens: words of space-separated scripts; Chinese / Japanese, Korean, Thai, Lao, Khmer, Burmese runs are
     cut into pairs of neighbouring characters (a run of one character is one token).                        */
  var SCRIPTS = [   // [first, last, script] of letters, sorted; anything else >= 0x80 is 'Zzzz' (a letter of no known script)
    [0xC0, 0x24F, 'Latn'], [0x250, 0x2AF, 'Latn'], [0x370, 0x3FF, 'Grek'], [0x400, 0x52F, 'Cyrl'], [0x530, 0x58F, 'Armn'],
    [0x590, 0x5FF, 'Hebr'], [0x600, 0x6FF, 'Arab'], [0x700, 0x74F, 'Syrc'], [0x750, 0x77F, 'Arab'], [0x780, 0x7BF, 'Thaa'],
    [0x7C0, 0x7FF, 'Nkoo'], [0x870, 0x8FF, 'Arab'], [0x900, 0x97F, 'Deva'], [0x980, 0x9FF, 'Beng'], [0xA00, 0xA7F, 'Guru'],
    [0xA80, 0xAFF, 'Gujr'], [0xB00, 0xB7F, 'Orya'], [0xB80, 0xBFF, 'Taml'], [0xC00, 0xC7F, 'Telu'], [0xC80, 0xCFF, 'Knda'],
    [0xD00, 0xD7F, 'Mlym'], [0xD80, 0xDFF, 'Sinh'], [0xE00, 0xE7F, 'Thai'], [0xE80, 0xEFF, 'Laoo'], [0xF00, 0xFFF, 'Tibt'],
    [0x1000, 0x109F, 'Mymr'], [0x10A0, 0x10FF, 'Geor'], [0x1100, 0x11FF, 'Hang'], [0x1200, 0x139F, 'Ethi'],
    [0x13A0, 0x13FF, 'Cher'], [0x1780, 0x17FF, 'Khmr'], [0x1C80, 0x1C8F, 'Cyrl'], [0x1C90, 0x1CBF, 'Geor'],
    [0x1E00, 0x1EFF, 'Latn'], [0x1F00, 0x1FFF, 'Grek'], [0x2C60, 0x2C7F, 'Latn'], [0x2D00, 0x2D2F, 'Geor'],
    [0x2D30, 0x2D7F, 'Tfng'], [0x2DE0, 0x2DFF, 'Cyrl'], [0x2E80, 0x2FDF, 'Hani'], [0x3005, 0x3007, 'Hani'],
    [0x3021, 0x3029, 'Hani'], [0x3031, 0x3035, 'Hani'], [0x3038, 0x303C, 'Hani'], [0x3041, 0x30FA, 'Hani'],
    [0x30FC, 0x30FF, 'Hani'], [0x3105, 0x312F, 'Hani'], [0x3131, 0x318F, 'Hang'], [0x31A0, 0x31BF, 'Hani'],
    [0x31F0, 0x31FF, 'Hani'], [0x3400, 0x4DBF, 'Hani'], [0x4E00, 0x9FFF, 'Hani'], [0xA640, 0xA69F, 'Cyrl'],
    [0xA720, 0xA7FF, 'Latn'], [0xA960, 0xA97F, 'Hang'], [0xAB30, 0xAB6F, 'Latn'], [0xAC00, 0xD7FF, 'Hang'],
    [0xF900, 0xFAFF, 'Hani'], [0xFB1D, 0xFB4F, 'Hebr'], [0xFB50, 0xFDFF, 'Arab'], [0xFE70, 0xFEFF, 'Arab'],
    [0x20000, 0x3FFFF, 'Hani']
  ];
  var PAIRS = { Hani: 1, Hang: 1, Thai: 1, Laoo: 1, Khmr: 1, Mymr: 1 };        // no spaces between words: pairs of letters
  var DROP_MARKS = { Latn: 1, Grek: 1, Cyrl: 1, Arab: 1, Hebr: 1, Armn: 1, Geor: 1, Zyyy: 1 };
  var MARK = [0x300, 0x36F, 0x483, 0x489, 0x591, 0x5BD, 0x5BF, 0x5BF, 0x5C1, 0x5C2, 0x5C4, 0x5C5, 0x5C7, 0x5C7,
    0x610, 0x61A, 0x64B, 0x65F, 0x670, 0x670, 0x6D6, 0x6DC, 0x6DF, 0x6E4, 0x6E7, 0x6E8, 0x6EA, 0x6ED, 0x8D3, 0x8E1,
    0x8E3, 0x8FF, 0x1AB0, 0x1AFF, 0x1DC0, 0x1DFF, 0x20D0, 0x20FF, 0xFE20, 0xFE2F];
  var SEPS = [0x80, 0xBF, 0xD7, 0xD7, 0xF7, 0xF7, 0x37E, 0x37E, 0x387, 0x387, 0x55A, 0x55F, 0x589, 0x58A,
    0x5BE, 0x5BE, 0x5C0, 0x5C0, 0x5C3, 0x5C3, 0x5C6, 0x5C6, 0x5F3, 0x5F4, 0x600, 0x60F, 0x61B, 0x61F, 0x66A, 0x66D,
    0x6D4, 0x6D4, 0x6DD, 0x6DE, 0x6E9, 0x6E9, 0x6FD, 0x6FE, 0x964, 0x965, 0x970, 0x970, 0xE2F, 0xE2F, 0xE4F, 0xE4F,
    0xE5A, 0xE5B, 0xF04, 0xF14, 0x104A, 0x104F, 0x10FB, 0x10FB, 0x1360, 0x1368, 0x166D, 0x166E, 0x17D4, 0x17DA,
    0x2000, 0x200A, 0x2010, 0x205F, 0x2070, 0x2BFF, 0x2E00, 0x2E7F, 0x3000, 0x3004, 0x3008, 0x3020, 0x3030, 0x3030,
    0x303D, 0x303F, 0x30FB, 0x30FB, 0xD800, 0xF8FF, 0xFD3E, 0xFD3F, 0xFE10, 0xFE1F, 0xFE30, 0xFE6F, 0xFF00, 0xFF0F,
    0xFF1A, 0xFF20, 0xFF3B, 0xFF40, 0xFF5B, 0xFF65, 0xFFF0, 0xFFFF, 0x1F000, 0x1FFFF, 0xE0000, 0x10FFFF];
  // dropped without breaking the word: joiners, soft hyphen, direction marks, tatweel, hamza, small waw / yeh
  var SKIP = { 0xAD: 1, 0x640: 1, 0x6E5: 1, 0x6E6: 1, 0x200B: 1, 0x200C: 1, 0x200D: 1, 0x200E: 1, 0x200F: 1, 0x2060: 1,
               0xFEFF: 1, 0x621: 1, 0x674: 1, 0x34F: 1 };
  var APOS = { 0x27: 1, 0x60: 1, 0xB4: 1, 0x2BB: 1, 0x2BC: 1, 0x2BE: 1, 0x2BF: 1, 0x2018: 1, 0x2019: 1, 0x2032: 1 };
  var ELISION = { l: 1, d: 1, j: 1, m: 1, n: 1, s: 1, t: 1, c: 1, qu: 1 };   // French / Italian l'homme, qu'il: two words
  var FOLD = {
    'ı': 'i', 'ß': 'ss', 'ø': 'o', 'æ': 'ae', 'œ': 'oe', 'ł': 'l', 'đ': 'd', 'ð': 'd', 'þ': 'th', 'ħ': 'h', 'ŧ': 't',
    'ĸ': 'k', 'ə': 'e', 'ɛ': 'e', 'ɔ': 'o', 'ŋ': 'n', 'ƴ': 'y', 'ɓ': 'b', 'ɗ': 'd', 'ƙ': 'k', 'ς': 'σ',
    'қ': 'к', 'ғ': 'г', 'ҳ': 'х', 'ң': 'н', 'ө': 'о', 'ү': 'у', 'ұ': 'у', 'ә': 'а', 'і': 'и', 'һ': 'х', 'ҷ': 'ч',
    'ҙ': 'з', 'ҫ': 'с', 'є': 'е', 'ґ': 'г', 'ҕ': 'г', 'ҝ': 'к', 'ҡ': 'к', 'ҭ': 'т', 'ӈ': 'н', 'ҥ': 'н', 'ӄ': 'к',
    'ӆ': 'л', 'ӊ': 'н', 'ӎ': 'м', 'ӌ': 'ч', 'ҹ': 'ч', 'ҵ': 'ц', 'ѣ': 'е', 'ѳ': 'ф', 'ѵ': 'и', 'ӏ': '',
    'ٱ': 'ا', 'ى': 'ي', 'ی': 'ي', 'ے': 'ي', 'ې': 'ي', 'ۍ': 'ي', 'ێ': 'ي', 'ة': 'ه', 'ہ': 'ه', 'ۀ': 'ه', 'ھ': 'ه',
    'ە': 'ه', 'ۃ': 'ه', 'ک': 'ك', 'ڪ': 'ك', 'ؤ': 'و', 'ۅ': 'و', 'ۆ': 'و', 'ۇ': 'و', 'ۈ': 'و', 'ۉ': 'و', 'ۋ': 'و', 'ں': 'ن'
  };
  (function () { for (var d = 0; d < 10; d++) { FOLD[AR_DIGITS[d]] = String(d); FOLD['۰۱۲۳۴۵۶۷۸۹'[d]] = String(d); } })();

  function inRanges(r, c) {
    for (var i = 0; i < r.length; i += 2) { if (c < r[i]) return false; if (c <= r[i + 1]) return true; }
    return false;
  }
  function scriptOf(c) {
    if (c < 0x80) return c >= 0x30 && c <= 0x39 ? 'Zyyy' : ((c | 0x20) >= 0x61 && (c | 0x20) <= 0x7A ? 'Latn' : '');
    if (inRanges(SEPS, c)) return '';
    var lo = 0, hi = SCRIPTS.length - 1;
    while (lo <= hi) {
      var m = (lo + hi) >> 1, r = SCRIPTS[m];
      if (c < r[0]) hi = m - 1; else if (c > r[1]) lo = m + 1; else return r[2];
    }
    return 'Zzzz';
  }
  function fromCp(c) {
    if (c < 0x10000) return String.fromCharCode(c);
    c -= 0x10000; return String.fromCharCode(0xD800 + (c >> 10), 0xDC00 + (c & 0x3FF));
  }
  var hasNormalize = typeof ''.normalize === 'function';
  /* per code point: [text, kind, script]; kind: 's' separator, 'x' skipped, 'a' apostrophe, 'm' mark, 'w' word, 'p' pairs */
  var cpMemo = {};
  function cpInfo(c) {
    var e = cpMemo[c];
    if (e) return e;
    if (SKIP[c]) e = ['', 'x', ''];
    else if (APOS[c]) e = ['', 'a', ''];
    else if (inRanges(MARK, c)) e = [fromCp(c), 'm', ''];
    else {
      var ch = fromCp(c), d = ch;
      if (hasNormalize && c >= 0x80 && !(c >= 0xAC00 && c <= 0xD7A3)) d = ch.normalize('NFKD');
      d = d.toLowerCase();
      var out = '', sc = '', drop = true;
      for (var i = 0; i < d.length; i++) {
        var u = d.charCodeAt(i);
        if (u >= 0xD800 && u < 0xDC00 && i + 1 < d.length) { out += d.substr(i, 2); i++; if (!sc) sc = 'Hani'; continue; }
        if (inRanges(MARK, u)) { if (!drop) out += d[i]; continue; }
        if (APOS[u] || SKIP[u]) continue;
        var s2 = scriptOf(u);
        if (!s2) continue;
        if (!sc) { sc = s2; drop = !!DROP_MARKS[sc]; }
        var f = FOLD[d[i]];
        out += f != null ? f : d[i];
      }
      if (!sc) e = ['', 's', ''];                                    // punctuation, symbols, spaces
      else if (!out) e = ['', 'x', ''];
      else e = [out, PAIRS[sc] ? 'p' : 'w', sc];
    }
    cpMemo[c] = e;
    return e;
  }

  /* s -> tokens [{t, pairs, a: [orig start per char], b: [orig end per char]}] (a, b only with pos) */
  function tokenize(s, pos) {
    s = String(s == null ? '' : s);
    var toks = [], tok = '', kind = '', sc = '', a = null, b = null, i = 0, n = 1;
    function end() {
      if (tok) toks.push(pos ? { t: tok, pairs: kind === 'p', a: a, b: b } : { t: tok, pairs: kind === 'p' });
      tok = ''; kind = ''; sc = ''; if (pos) { a = []; b = []; }
    }
    function add(t) {
      tok += t;
      if (pos) for (var j = 0; j < t.length; j++) { a.push(i); b.push(i + n); }
    }
    if (pos) { a = []; b = []; }
    while (i < s.length) {
      var c = s.charCodeAt(i);
      n = 1;
      if (c >= 0xD800 && c < 0xDC00 && i + 1 < s.length) {
        var lo = s.charCodeAt(i + 1);
        if (lo >= 0xDC00 && lo < 0xE000) { c = 0x10000 + ((c - 0xD800) << 10) + (lo - 0xDC00); n = 2; }
      }
      var e = cpMemo[c] || cpInfo(c), k = e[1];
      if (k === 's') end();
      else if (k === 'a') { if (ELISION[tok] || tok.length > 2 && tok.slice(-2) === 'qu') end(); }
      else if (k === 'm') { if (tok && !DROP_MARKS[sc]) add(e[0]); }
      else if (k !== 'x') {
        if (tok && (k !== kind || k === 'p' && e[2] !== sc)) end();
        kind = k; sc = e[2];
        add(e[0]);
      }
      i += n;
    }
    end();
    return toks;
  }

  function cps(t) { return t.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\s\S]/g) || []; }
  function pairsOf(t) {
    var c = cps(t), out = [];
    if (c.length === 1) return c;
    for (var i = 0; i + 1 < c.length; i++) out.push(c[i] + c[i + 1]);
    return out;
  }

  /* Arabic word without the attached و ف, ب ك ل, ال (the variant used for Arabic-language sources), then
     without alef and doubled letters (level 2 of normArabic): والرحمن, الرحمان, رحمن -> رحمن */
  function arStem(w) {
    var r = w;
    if ((r[0] === 'و' || r[0] === 'ف') && r.length >= 4) r = r.slice(1);
    if (r.length >= 5 && (r.slice(0, 3) === 'بال' || r.slice(0, 3) === 'كال')) r = r.slice(3);
    else if (r.length >= 4 && (r.slice(0, 2) === 'ال' || r.slice(0, 2) === 'لل')) r = r.slice(2);
    else if (r.length >= 5 && (r[0] === 'ب' || r[0] === 'ل' || r[0] === 'ك')) r = r.slice(1);
    var s = r.replace(/ا/g, '').replace(/(.)\1+/g, '$1');
    return s || w.replace(/(.)\1+/g, '$1');
  }
  function isArabTok(t) { var c = t.charCodeAt(0); return c >= 0x620 && c <= 0x6FF || c >= 0x750 && c <= 0x77F || c >= 0x8A0 && c <= 0x8FF; }

  /* The script of a text: the one with the most letters (Hani covers Chinese and Japanese kana). */
  function detectScript(s) {
    s = String(s || '');
    var count = {}, best = '', n = 0;
    for (var i = 0; i < s.length && i < 400; i++) {
      var sc = scriptOf(s.charCodeAt(i));
      if (!sc || sc === 'Zyyy' || inRanges(MARK, s.charCodeAt(i))) continue;
      count[sc] = (count[sc] || 0) + 1;
      if (count[sc] > n) { n = count[sc]; best = sc; }
    }
    return best;
  }
  /* Normalised text: tokens separated by single spaces (pair-script runs stay whole). */
  function norm(script, s) {
    if (s === undefined) { s = script; }
    return tokenize(s).map(function (t) { return t.t; }).join(' ');
  }
  /* Index terms of a text, in order. opts.stem: the Arabic-language variant of Arabic-script words (arStem). */
  function terms(s, opts) {
    var stem = opts && opts.stem, out = [];
    tokenize(s).forEach(function (t) {
      if (t.pairs) out.push.apply(out, pairsOf(t.t));
      else out.push(stem && isArabTok(t.t) ? arStem(t.t) : t.t);
    });
    return out;
  }
  /* Query words: [{t, stem, pairs: [..] | null}] (t: the term in other sources, stem: in Arabic-language ones) */
  function queryTerms(s) {
    return tokenize(s).map(function (t) {
      if (t.pairs) return { t: t.t, stem: t.t, pairs: pairsOf(t.t) };
      return { t: t.t, stem: isArabTok(t.t) ? arStem(t.t) : t.t, pairs: null };
    });
  }

  /* Latin <-> Cyrillic (Uzbek, Kazakh, Tajik, Serbian ... are written in both): an extra variant of the query */
  var L2C = [['shch', 'щ'], ["yo'", 'йў'], ['yoʻ', 'йў'], ['yo‘', 'йў'], ['yo’', 'йў'], ["o'", 'ў'], ['oʻ', 'ў'], ['o‘', 'ў'], ['o’', 'ў'], ["g'", 'ғ'], ['gʻ', 'ғ'], ['g‘', 'ғ'], ['g’', 'ғ'],
    ['sh', 'ш'], ['ch', 'ч'], ['zh', 'ж'], ['kh', 'х'], ['ya', 'я'], ['yo', 'ё'], ['yu', 'ю'], ['ye', 'е'], ['ts', 'ц'],
    ['ş', 'ш'], ['ç', 'ч'], ['ğ', 'ғ'], ['ı', 'ы'], ['ö', 'ө'], ['ü', 'ү'], ['ä', 'ә'], ['ñ', 'ң'], ['ū', 'ұ'], ['š', 'ш'],
    ['č', 'ч'], ['ž', 'ж'], ['ć', 'ч'], ['đ', 'ђ'],
    ['a', 'а'], ['b', 'б'], ['c', 'с'], ['d', 'д'], ['e', 'е'], ['f', 'ф'], ['g', 'г'], ['h', 'ҳ'], ['i', 'и'], ['j', 'ж'],
    ['k', 'к'], ['l', 'л'], ['m', 'м'], ['n', 'н'], ['o', 'о'], ['p', 'п'], ['q', 'қ'], ['r', 'р'], ['s', 'с'], ['t', 'т'],
    ['u', 'у'], ['v', 'в'], ['w', 'в'], ['x', 'х'], ['y', 'й'], ['z', 'з']];
  var C2L = { 'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'j', 'з': 'z', 'и': 'i', 'й': 'y',
    'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'x',
    'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sh', 'ъ': "'", 'ы': 'i', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya', 'ў': "o'",
    'қ': 'q', 'ғ': "g'", 'ҳ': 'h', 'ң': 'ng', 'ө': 'o', 'ү': 'u', 'ұ': 'u', 'ә': 'a', 'і': 'i', 'һ': 'h', 'ҷ': 'j',
    'ӣ': 'i', 'ӯ': 'u', 'ј': 'j', 'љ': 'lj', 'њ': 'nj', 'ћ': 'c', 'ђ': 'dj', 'џ': 'dz', 'є': 'ye', 'ї': 'yi', 'ґ': 'g' };
  function latToCyr(s) {
    s = String(s || '').toLowerCase();
    var out = '';
    for (var i = 0; i < s.length;) {
      var hit = null;
      for (var k = 0; k < L2C.length; k++) if (s.substr(i, L2C[k][0].length) === L2C[k][0]) { hit = L2C[k]; break; }
      if (hit) { out += hit[1]; i += hit[0].length; } else { out += s[i]; i++; }
    }
    return out;
  }
  function cyrToLat(s) {
    s = String(s || '').toLowerCase();
    var out = '';
    for (var i = 0; i < s.length; i++) {
      var c = s[i], l = C2L[c];
      if (c === 'е' && (i === 0 || /[\s\-аеёиоуўэюяы]/.test(s[i - 1]))) l = 'ye';
      out += l != null ? l : c;
    }
    return out;
  }

  /* Levenshtein distance, max+1 as soon as it is over max */
  function levenshtein(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var prev = [], cur = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      cur[0] = i; var low = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (cur[j] < low) low = cur[j];
      }
      if (low > max) return max + 1;
      var t = prev; prev = cur; cur = t;
    }
    return prev[b.length];
  }

  /* Transliteration of the Arabic (bismillah, alhamdu lillahi rabbil alamin, ar-rahman, qul huwa): the consonant
     skeleton of the query against the consonants of the ayah. Every Latin consonant stands for a set of Arabic
     letters; vowels, w, y, ' are left out on both sides (the ayah side: level 3 without ع). */
  var TR_LAT = [['sh', 'ش'], ['th', 'ثذتظ'], ['dh', 'ذضظد'], ['kh', 'خح'], ['gh', 'غ'], ['zh', 'ظذز'], ['ch', 'شج'],
    ['ph', 'ف'], ['b', 'ب'], ['t', 'تطثه'], ['d', 'دضذ'], ['z', 'زظذض'], ['s', 'سصث'], ['h', 'هحخ'], ['k', 'كق'],
    ['q', 'قك'], ['c', 'كقس'], ['g', 'غجق'], ['j', 'ج'], ['f', 'ف'], ['p', 'فب'], ['l', 'ل'], ['m', 'م'], ['n', 'ن'],
    ['r', 'ر'], ['x', 'خح']];
  function translitSkeleton(q) {
    q = String(q || '');
    if (/[Ѐ-ӿ]/.test(q)) q = cyrToLat(q);
    q = q.toLowerCase().replace(/[şš]/g, 'sh').replace(/[çč]/g, 'ch');
    if (hasNormalize) q = q.normalize('NFKD');
    q = q.replace(/[̀-ͯ]/g, '').replace(/[ʻʼʿʾ'`’‘´]/g, '');
    if (/[^a-z\s\-.,;:!?()]/.test(q)) return null;            // other letters or digits: not a transliteration
    q = q.replace(/(^|[^a-z])[aeiu]l-/g, '$1')                    // al-, el-, ul-
         .replace(/(^|[^a-z])a(sh|th|dh|zh|[tdrszn])-?\2/g, '$1$2')   // ar-rahman, arrahman, ash-shams
         .replace(/-/g, ' ');
    var out = [], last = '', gap = false;
    out.dbl = [];                       // the same letter at the end of a word and the start of the next one
    for (var i = 0; i < q.length;) {
      var hit = null;
      for (var k = 0; k < TR_LAT.length; k++) if (q.substr(i, TR_LAT[k][0].length) === TR_LAT[k][0]) { hit = TR_LAT[k]; break; }
      if (hit) {
        if (hit[1] !== last) { out.push(hit[1]); out.dbl.push(false); }
        else if (gap) out.dbl[out.length - 1] = true;
        last = hit[1]; gap = false; i += hit[0].length;
      } else { if (q[i] === ' ') gap = true; i++; }                   // vowels, w, y, v, spaces
    }
    return out;
  }

  /* "<tajweed class=x>..</tajweed>" -> {text, colors[]} (colour per character) */
  function parseTajweed(raw) {
    var text = '', colors = [], re = /<(tajweed|rule|r|span)\s+class=["']?([\w-]+)["']?[^>]*>([\s\S]*?)<\/\1>|<[^>]+>|([^<]+)/g, m;
    while ((m = re.exec(raw))) {
      var t = m[3] != null ? m[3].replace(/<[^>]+>/g, '') : (m[4] || '');
      var c = m[3] != null ? (TAJWEED[m[2]] || null) : null;
      t = t.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
      for (var i = 0; i < t.length; i++) { text += t[i]; colors.push(c); }
    }
    return { text: text, colors: colors };
  }

  /* searchData: web/data/quran.search.json (tools/build_quran_search.js): the words of the Unicode text, already
     normalised, so that a server (Cloudflare Workers: little CPU) does not normalise the whole Quran itself.
     Without it the same structure is built from the text on the first search. */
  function Quran(data, searchData) {
    this._sd = searchData && searchData.v === 1 && searchData.ayahs && searchData.ayahs.length === data.ayahs.length ? searchData : null;
    this.meta = data.meta;
    this.suras = data.suras;             // [[nameAr, nameUz, ayahCount]]
    this.offsets = [];
    var o = 0;
    for (var i = 0; i < this.suras.length; i++) { this.offsets.push(o); o += this.suras[i][2]; }
    this.extraNames = [];                // other languages, for finding a sura by name
    this.baseAyahs = data.ayahs;         // Unicode text: search always works on it
    this.setScript(data.ayahs);
  }

  /* ayahs: 6236 texts; tajweed: texts contain <tajweed class=...> markup */
  Quran.prototype.setScript = function (ayahs, opts) {
    opts = opts || {};
    this.tajweed = !!opts.tajweed;
    this.colors = null;
    this.pages = null;
    if (opts.glyph) {
      /* QPC page mushafs: ayah = [[page, glyph], ...]. Glyphs are Private Use characters
         (bidi class L): RLM around every word keeps the words right-to-left in Word and
         in the browser while the characters of a word stay in order. The space between
         words has no page (ordinary font): the space glyph of the V1/V4 page fonts is
         very wide on some pages and almost empty on others. */
      this.ayahs = []; this.pages = [];
      for (var g = 0; g < ayahs.length; g++) {
        var txt = '', pg = [];
        ayahs[g].forEach(function (w, k) {
          if (k) { txt += ' '; pg.push(null); }
          var piece = '\u200F' + w[1] + '\u200F';
          txt += piece;
          for (var c = 0; c < piece.length; c++) pg.push(w[0]);
        });
        this.ayahs.push(txt); this.pages.push(pg);
      }
    } else if (this.tajweed) {
      this.ayahs = []; this.colors = [];
      for (var i = 0; i < ayahs.length; i++) {
        var p = parseTajweed(ayahs[i]);
        this.ayahs.push(p.text); this.colors.push(p.colors);
      }
    } else this.ayahs = ayahs;
    this._idx = null;
  };

  Quran.prototype.index = function (s, a) { return this.offsets[s - 1] + a - 1; };
  Quran.prototype.text = function (s, a) { return this.ayahs[this.index(s, a)]; };
  Quran.prototype.count = function (s) { return this.suras[s - 1][2]; };
  Quran.prototype.locate = function (i) {
    var s = 0; while (s + 1 < this.offsets.length && this.offsets[s + 1] <= i) s++;
    return { sura: s + 1, aya: i - this.offsets[s] + 1 };
  };
  Quran.prototype.addSuraNames = function (names) { if (names && names.length === 114) this.extraNames.push(names); };

  Quran.prototype._buildIndex = function () {
    if (this._idx) return this._idx;
    if (this._sd) return (this._idx = this._words().levels());
    var idx = [[], [], [], []];
    for (var i = 0; i < this.baseAyahs.length; i++)
      for (var l = 0; l < 3; l++) idx[l].push(' ' + normArabic(this.baseAyahs[i], l) + ' ');
    for (var j = 0; j < this.baseAyahs.length; j++) idx[3].push(' ' + normArabic(this.baseAyahs[j], 3) + ' ');
    this._idx = idx;
    return idx;
  };

  Quran.prototype.findSura = function (name) {
    var q = normText(name), qa = normArabic(name, 0), self = this;
    if (!q && !qa) return 0;
    function names(i) {
      var list = [normText(self.suras[i][1])];
      self.extraNames.forEach(function (n) { list.push(normText(n[i])); list.push(normText(n[i]).replace(/^(al|an|as|at|ad|ar|az|ash|adh) /, '')); });
      return list;
    }
    for (var pass = 0; pass < 2; pass++) {
      for (var i = 0; i < this.suras.length; i++) {
        var ar = normArabic(this.suras[i][0], 0), list = names(i);
        if (pass === 0 && (q && list.indexOf(q) >= 0 || qa && (ar === qa || ar.replace(/^ال/, '') === qa.replace(/^ال/, ''))))
          return i + 1;
        if (pass === 1 && (q && q.length >= 2 && list.some(function (n) { return n && n.indexOf(q) === 0; }) ||
                           qa && qa.length >= 2 && ar.indexOf(qa) >= 0)) return i + 1;
      }
    }
    return 0;
  };

  /* "2:255", "2 255", "2:1-5", "Бақара 30-37", "Al-Baqarah 5", "البقرة ٢٥٥", "2" */
  Quran.prototype.parseRef = function (q) {
    q = toLatinDigits(q.trim()).replace(/\s+/g, ' ');
    if (q.length > 80) return null;                     // a reference is short; long text is a text search (also keeps the regexes below fast)
    var m = q.match(/^(\d{1,3})(?:\s*[:.,\s]\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?)?$/);
    var sura, from, to;
    if (m) { sura = +m[1]; from = m[2] ? +m[2] : 1; to = m[3] ? +m[3] : from; }
    else {
      m = q.match(/^(.+?)\s*[:\s]\s*(\d{1,3})(?:\s*[-–—]\s*(\d{1,3}))?$/);
      if (m) { sura = this.findSura(m[1]); from = +m[2]; to = m[3] ? +m[3] : from; }
      else { sura = this.findSura(q); from = 1; to = 1; }
    }
    if (!sura || sura > 114) return null;
    var c = this.count(sura);
    if (from < 1 || from > c) return null;
    to = Math.min(Math.max(to, from), c);
    return { sura: sura, from: from, to: to };
  };

  /* arr.map(fn), kept in cache (a WeakMap); built in parts when `until` (a time) is given: null while not complete,
     the next call goes on from there (warmSearch); without `until` it is completed at once */
  function partMap(cache, parts, arr, fn, until) {
    var v = cache && cache.get(arr);
    if (v) return v;
    var p = parts && parts.get(arr) || { v: new Array(arr.length), i: 0 };
    for (; p.i < arr.length; p.i++) {
      if (until && (p.i & 31) === 0 && p.i && Date.now() > until) { if (parts) parts.set(arr, p); return null; }
      p.v[p.i] = fn(arr[p.i]);
    }
    if (parts) parts['delete'](arr);
    if (cache) cache.set(arr, p.v);
    return p.v;
  }
  var normCache = typeof WeakMap !== 'undefined' ? new WeakMap() : null, normParts = normCache && new WeakMap();
  function normOne(t) { return ' ' + normText(stripHtml(t)) + ' '; }
  function normalized(arr, until) { return partMap(normCache, normParts, arr, normOne, until); }

  /* Search: reference, Arabic text (with or without diacritics), or the text of
     any of the given translations (arrays of 6236 strings, any language). */
  Quran.prototype.search = function (q, translations, limit) {
    limit = limit || 100;
    q = (q || '').trim();
    if (!q) return [];
    var ref = this.parseRef(q), out = [], seen = {}, self = this;
    function add(i) {
      if (seen[i] || out.length >= limit) return;
      seen[i] = 1; out.push(self.locate(i));
    }
    if (ref) for (var a = ref.from; a <= ref.to; a++) add(this.index(ref.sura, a));
    if (isArabic(q)) {
      var idx = this._buildIndex();
      for (var l = 0; l < 4 && out.length < limit; l++) {
        if (l >= 2 && out.length) break;             // the loose levels only when the stricter ones found nothing
        var nq = normArabic(q, l);
        if (!nq || l === 3 && nq.length < 3) continue;
        if (l === 3) {                                 // whole words, a space allowed between any two letters
          var re = new RegExp(' ' + nq.replace(/ /g, '').split('').join(' ?') + ' ');
          for (var k = 0; k < idx[3].length; k++) if (re.test(idx[3][k])) add(k);
          continue;
        }
        for (var i = 0; i < idx[l].length; i++) if (idx[l][i].indexOf(nq) >= 0) add(i);
      }
    }
    if (!/^[\d\s:.,\-–—]+$/.test(q)) {
      var lq = normText(q);
      if (lq.length >= 2)
        (translations || []).forEach(function (tr) {
          if (!tr) return;
          var n = normalized(tr);
          for (var j = 0; j < n.length && out.length < limit; j++) if (n[j].indexOf(lq) >= 0) add(j);
        });
    }
    return out;
  };

  /* ---------- Words of the Quran for the stronger search ----------
     dict: [form] or [[level0, level1]] (level 1 when it differs), id 0 = '' (end mark, pause sign alone);
     ayahs: per ayah the dict id of every space-separated piece of the Unicode text (the same pieces as spans()).
     fix: {ayah: [l0, l1, l2, l3]} where joining the words differs from normArabic of the whole ayah. */
  function wl2(f) { return f.replace(/ا/g, '').replace(/(.)\1+/g, '$1').replace(/\s+/g, ' ').trim(); }
  function wl3(f) { return wl2(f).replace(/[وي]/g, '').replace(/(.)\1+/g, '$1').replace(/\s+/g, ' ').trim(); }

  function buildWords(ayahs, check) {
    var dict = [''], key = { '\t': 0 }, raw = {}, out = [], fix = {};
    for (var i = 0; i < ayahs.length; i++) {
      var ws = ayahs[i].split(/[  ]+/).filter(Boolean), ids = [];
      for (var k = 0; k < ws.length; k++) {
        var id = raw['~' + ws[k]];
        if (id === undefined) {
          var f0 = normArabic(ws[k], 0), f1 = normArabic(ws[k], 1), kk = f0 + '\t' + f1;
          id = key[kk];
          if (id === undefined) { id = key[kk] = dict.length; dict.push(f0 === f1 ? f0 : [f0, f1]); }
          raw['~' + ws[k]] = id;
        }
        ids.push(id);
      }
      out.push(ids);
    }
    var sd = { v: 1, dict: dict, ayahs: out, fix: fix };
    if (!check) return sd;
    var w = new Words(sd), lv = w.levels(true);
    for (var j = 0; j < ayahs.length; j++) {
      var want = [0, 1, 2, 3].map(function (l) { return ' ' + normArabic(ayahs[j], l) + ' '; });
      if (want.some(function (x, l) { return x !== lv[l][j]; })) fix[j] = want.map(function (x) { return x.slice(1, -1); });
    }
    return sd;
  }

  function Words(sd) {
    this.sd = sd;
    var d = sd.dict, n = d.length;
    this.f0 = new Array(n); this.f1 = new Array(n);
    for (var i = 0; i < n; i++) {
      var e = d[i];
      if (typeof e === 'string') { this.f0[i] = e; this.f1[i] = e; } else { this.f0[i] = e[0]; this.f1[i] = e[1]; }
    }
  }
  Words.prototype.levels23 = function () {        // lazily: level 2 and 3 of every form
    if (this.f2) return;
    var n = this.f0.length, f2 = new Array(n), f3 = new Array(n);
    for (var i = 0; i < n; i++) {
      f2[i] = wl2(this.f0[i]);
      f3[i] = f2[i].replace(/[وي]/g, '').replace(/(.)\1+/g, '$1').replace(/\s+/g, ' ').trim();
    }
    this.f2 = f2; this.f3 = f3;
  };
  Words.prototype.forms = function () {           // + stem, stem level 3, transliteration skeleton
    this.levels23();
    if (this.st) return;
    var n = this.f0.length, st = new Array(n), st3 = new Array(n), sk = new Array(n);
    for (var i = 0; i < n; i++) {
      var f = this.f0[i];
      st[i] = f && f.indexOf(' ') < 0 ? arStem(f) : this.f2[i];
      st3[i] = st[i].replace(/[وي]/g, '').replace(/(.)\1+/g, '$1');
      sk[i] = this.f3[i].replace(/ع/g, '').replace(/(.)\1+/g, '$1').trim();
    }
    this.st = st; this.st3 = st3; this.sk = sk;
  };
  /* the four normalised ayah strings of _buildIndex (' ' + text + ' ') */
  Words.prototype.levels = function (noFix) {
    this.levels23();
    var A = this.sd.ayahs, fix = noFix ? {} : this.sd.fix || {}, idx = [[], [], [], []];
    var F = [this.f0, this.f1, this.f2, this.f3];
    for (var i = 0; i < A.length; i++) {
      var fx = fix[i];
      for (var l = 0; l < 4; l++) {
        if (fx) { idx[l].push(' ' + fx[l] + ' '); continue; }
        var parts = [], ids = A[i], fl = F[l];
        for (var k = 0; k < ids.length; k++) if (fl[ids[k]]) parts.push(fl[ids[k]]);
        idx[l].push(' ' + parts.join(' ') + ' ');
      }
    }
    return idx;
  };
  /* posting lists and lookup tables (built on the first smart search) */
  Words.prototype.tables = function () {
    if (this.occ) return;
    this.forms();
    var A = this.sd.ayahs, n = this.f0.length, occ = new Array(n), len = new Array(A.length);
    for (var i = 0; i < A.length; i++) {
      var ids = A[i], o = 0;
      for (var k = 0; k < ids.length; k++) {
        var id = ids[k];
        if (!id || !this.f2[id]) continue;
        (occ[id] || (occ[id] = [])).push(i * 256 + o);
        o++;
      }
      len[i] = o;
    }
    function map(arr) {
      var m = {};
      for (var j = 1; j < arr.length; j++) { var f = arr[j]; if (f) (m.hasOwnProperty(f) ? m[f] : (m[f] = [])).push(j); }
      return m;
    }
    this.occ = occ; this.len = len;
    this.by2 = map(this.f2); this.bySt = map(this.st); this.by3 = map(this.f3); this.bySt3 = map(this.st3);
    this.keys2 = Object.keys(this.by2); this.keysSt = Object.keys(this.bySt);
  };
  /* ordinal of a counted word (see tables) -> index of the piece in spans() */
  Words.prototype.orig = function (i, ord) {
    var ids = this.sd.ayahs[i], o = 0;
    for (var k = 0; k < ids.length; k++) {
      if (!ids[k] || !this.f2[ids[k]]) continue;
      if (o === ord) return k;
      o++;
    }
    return ids.length - 1;
  };
  /* word ordinal (counted words) of the word that contains character `pos` of a level string */
  Words.prototype.ordAt = function (i, l, pos) {
    var ids = this.sd.ayahs[i], fl = [this.f0, this.f1, this.f2, this.f3, this.sk][l], c = 1, o = 0;
    for (var k = 0; k < ids.length; k++) {
      var f = fl[ids[k]];
      if (!ids[k] || !this.f2[ids[k]]) { if (f) c += f.length + 1; continue; }
      if (!f) { o++; continue; }
      if (pos < c + f.length + 1) return o;
      c += f.length + 1; o++;
    }
    return Math.max(0, o - 1);
  };
  Words.prototype.skelText = function () {
    if (this.skel) return this.skel;
    this.forms();
    var A = this.sd.ayahs, out = [];
    for (var i = 0; i < A.length; i++) {
      var parts = [], ids = A[i];
      for (var k = 0; k < ids.length; k++) if (this.sk[ids[k]]) parts.push(this.sk[ids[k]]);
      out.push(' ' + parts.join(' ') + ' ');
    }
    return (this.skel = out);
  };

  Quran.prototype._words = function () {
    if (!this._w) this._w = new Words(this._sd || buildWords(this.baseAyahs, false));
    return this._w;
  };
  /* the data of web/data/quran.search.json (checked against normArabic of every ayah: `fix`) */
  Quran.prototype.searchData = function () { return buildWords(this.baseAyahs, true); };

  /* The tables the first search builds (the words of the Quran, the normalised texts of the translations), made
     ahead in small parts so that the first query does not block the page: call it again until it returns true.
     translations: arrays of 6236 texts; ms: the time of one part. */
  Quran.prototype.warmSearch = function (translations, ms) {
    var until = Date.now() + (ms || 12), W = this._words(), self = this;
    var steps = [function () { return W.f2; }, function () { W.levels23(); }, function () { return W.st; }, function () { W.forms(); },
                 function () { return W.occ; }, function () { W.tables(); }, function () { return W.skel; }, function () { W.skelText(); },
                 function () { return self._idx; }, function () { self._buildIndex(); }];
    for (var k = 0; k < steps.length; k += 2) {
      if (steps[k]()) continue;
      steps[k + 1]();
      if (Date.now() > until) return false;
    }
    var trs = translations || [];
    for (var j = 0; j < trs.length; j++) {
      if (!trs[j] || !trs[j].length) continue;
      if (!normalized(trs[j], until) || !partMap(trCache, trParts, trs[j], trOne, until)) return false;
    }
    return true;
  };

  /* Score tiers of searchSmart, from exact to loose (a bonus of 0..19 inside a tier: how much of the ayah the
     match covers, +4 when it starts the ayah). */
  var TIER = { ref: 1000, phrase0: 900, phrase1: 880, phrase2: 860, phrase3: 840, seq: 800, near: 760, any: 720,
               typoSeq: 680, typoNear: 650, typoAny: 620, most: 560, part: 520, tr: 400, trAll: 350, translit: 300 };
  var MAX_QUERY = 300, MAX_WORDS = 12;

  /* Stronger search over the local data (no network): a reference, Arabic in any spelling (Uthmani / imla'i, with or
     without diacritics, joined or split words, other word order, a typo, part of a word), a Latin or Cyrillic
     transliteration of the Arabic, and the given translations (arrays of 6236 texts or {id, data}).
     The synchronous search() is not changed. Returns [{sura, aya, score, match, hits: [{src, kind, match,
     wordFrom?, wordTo?}]}], best first.                                                                      */
  Quran.prototype.searchSmart = function (q, opts) {
    opts = opts || {};
    var limit = opts.limit || 50, self = this, res = {};
    q = String(q == null ? '' : q).replace(/\s+/g, ' ').trim();
    if (q.length > MAX_QUERY) q = q.slice(0, MAX_QUERY);
    if (!q) return [];
    function put(i, tier, bonus, hit) {
      var s = TIER[tier] + Math.max(0, Math.min(19, bonus || 0)), r = res[i];
      hit.match = tier;
      if (!r) res[i] = r = { i: i, score: s, match: tier, hits: [] };
      else if (s > r.score) { r.score = s; r.match = tier; }
      for (var k = 0; k < r.hits.length; k++) {
        var h = r.hits[k];
        if (h.src === hit.src) { if (TIER[tier] > TIER[h.match]) r.hits[k] = hit; return; }
      }
      r.hits.push(hit);
    }
    var ref = this.parseRef(q);
    if (ref) for (var a = ref.from; a <= ref.to; a++) put(this.index(ref.sura, a), 'ref', 19 - Math.min(19, a - ref.from), { src: 'quran', kind: 'ref' });
    if (isArabic(q)) this._smartArabic(q, put);
    else if (/[A-Za-zÀ-ɏЀ-ӿ]/.test(q)) this._smartTranslit(q, put);
    (opts.translations || []).forEach(function (tr, n) {
      var data = tr && (tr.data || tr), id = tr && tr.id || 'tr' + n;
      if (data && data.length) self._smartText(q, data, id, put);
    });
    var list = Object.keys(res).map(function (k) { return res[k]; });
    list.sort(function (x, y) { return y.score - x.score || x.i - y.i; });
    var W = this._words();
    return list.slice(0, limit).map(function (r) {
      var loc = self.locate(r.i);
      r.hits.forEach(function (h) {
        if (h._o0 != null) { h.wordFrom = W.orig(r.i, h._o0); h.wordTo = W.orig(r.i, h._o1); }
        delete h._o0; delete h._o1;
      });
      return { sura: loc.sura, aya: loc.aya, score: r.score, match: r.match, hits: r.hits };
    });
  };

  function bonusOf(cov, start) { return Math.round((Math.min(1, cov) * 15 + (start ? 4 : 0)) * 10) / 10; }

  Quran.prototype._smartArabic = function (q, put) {
    var idx = this._buildIndex(), W = this._words();
    W.tables();
    var n = idx[0].length, l, i;
    // 1. the phrase on levels 0..2 (substring), level 3 (whole words, a space allowed between any two letters)
    for (l = 0; l < 3; l++) {
      var nq = normArabic(q, l);
      if (!nq) continue;
      for (i = 0; i < n; i++) {
        var p = idx[l][i].indexOf(nq);
        if (p < 0) continue;
        var o0 = W.ordAt(i, l, p), o1 = W.ordAt(i, l, p + nq.length - 1);
        put(i, 'phrase' + l, bonusOf(nq.length / (idx[l][i].length - 2), p === 1), { src: 'quran', kind: 'ar', _o0: o0, _o1: o1 });
      }
    }
    var n3 = normArabic(q, 3).replace(/ /g, '');
    if (n3.length >= 3 && n3.length <= 120) {
      var re = new RegExp(' ' + n3.split('').join(' ?') + ' ');
      for (i = 0; i < n; i++) {
        var m = re.exec(idx[3][i]);
        if (!m) continue;
        put(i, 'phrase3', bonusOf(n3.length / idx[3][i].length, m.index === 0),
            { src: 'quran', kind: 'ar', _o0: W.ordAt(i, 3, m.index + 1), _o1: W.ordAt(i, 3, m.index + m[0].length - 2) });
      }
    }
    // 2. word by word
    var qws = normArabic(q, 0).split(' ').filter(Boolean).slice(0, MAX_WORDS);
    if (!qws.length) return;
    var words = qws.map(function (w) {
      var k2 = wl2(w), st = arStem(w), k3 = wl3(w), st3 = st.replace(/[وي]/g, '').replace(/(.)\1+/g, '$1');
      var strict = {}, loose = {};
      [W.by2[k2], W.bySt[st]].forEach(function (ids) { (ids || []).forEach(function (id) { strict[id] = 1; }); });
      if (k3.length >= 2) [W.by3[k3], W.bySt3[st3]].forEach(function (ids) { (ids || []).forEach(function (id) { if (!strict[id]) loose[id] = 1; }); });
      return { k2: k2, st: st, strict: strict, loose: loose };
    });
    function hasAny(o) { for (var k in o) return true; return false; }
    var found = this._combine(W, words, put, '');
    // typos and parts of words: for the words that are not in the Quran (all of them when nothing was found)
    var fuzzy = false, part = false;
    words.forEach(function (w) {
      var missing = !hasAny(w.strict) && !hasAny(w.loose);
      if (!missing && found) return;
      var k = w.k2.length >= 7 ? 2 : w.k2.length >= 4 ? 1 : 0;
      w.fz = {}; w.pt = {};
      if (k) {
        [[W.keys2, W.by2, w.k2], [W.keysSt, W.bySt, w.st]].forEach(function (t) {
          for (var j = 0; j < t[0].length; j++) {
            var key = t[0][j];
            if (key !== t[2] && levenshtein(t[2], key, k) <= k) t[1][key].forEach(function (id) { w.fz[id] = 1; fuzzy = true; });
          }
        });
      }
      if (missing && w.k2.length >= 3) {
        for (var j = 0; j < W.keys2.length; j++) {
          if (W.keys2[j].indexOf(w.k2) >= 0 && W.keys2[j] !== w.k2) W.by2[W.keys2[j]].forEach(function (id) { w.pt[id] = 1; part = true; });
        }
      }
    });
    if (fuzzy) this._combine(W, words, put, 'typo');
    if (part) this._combine(W, words, put, 'part');
    if (words.length >= 3) this._combine(W, words, put, 'most');
  };

  /* candidates that have every query word (mode 'most': all but one); tiers by the arrangement */
  Quran.prototype._combine = function (W, words, put, mode) {
    var per = {}, nW = words.length, found = 0;
    words.forEach(function (w, j) {
      var sets = [w.strict, w.loose];
      if (mode === 'typo') sets.push(w.fz || {});
      if (mode === 'part') sets.push(w.pt || {});
      sets.forEach(function (set, kind) {
        for (var id in set) {
          var oc = W.occ[id];
          if (!oc) continue;
          for (var k = 0; k < oc.length; k++) {
            var i = oc[k] >> 8, pos = oc[k] & 255, e = per[i] || (per[i] = { pos: [], cnt: 0, loose: 0, seen: 0 });
            if (!e.pos[j]) { e.pos[j] = []; e.cnt++; }
            e.pos[j].push(pos);
            if (kind) e.loose |= 1 << j;
          }
        }
      });
    });
    for (var key in per) {
      var e = per[key], i = +key;
      if (mode === 'most') { if (e.cnt !== nW - 1) continue; }
      else if (e.cnt !== nW) continue;
      var have = [];
      for (var j = 0; j < nW; j++) if (e.pos[j]) have.push(e.pos[j].sort(function (a, b) { return a - b; }));
      // consecutive in the query order
      var seq = -1;
      if (mode !== 'most') {
        for (var s = 0; s < have[0].length && seq < 0; s++) {
          var p0 = have[0][s], ok = true;
          for (var t = 1; t < have.length && ok; t++) ok = have[t].indexOf(p0 + t) >= 0;
          if (ok) seq = p0;
        }
      }
      // the shortest window with all the words
      var all = [];
      have.forEach(function (ps, t) { ps.forEach(function (p) { all.push([p, t]); }); });
      all.sort(function (a, b) { return a[0] - b[0]; });
      var cnt = {}, inW = 0, lo = 0, best = [0, 1e9];
      for (var hi = 0; hi < all.length; hi++) {
        if (!cnt[all[hi][1]]) inW++;
        cnt[all[hi][1]] = (cnt[all[hi][1]] || 0) + 1;
        while (inW === have.length) {
          if (all[hi][0] - all[lo][0] < best[1] - best[0]) best = [all[lo][0], all[hi][0]];
          if (--cnt[all[lo][1]] === 0) inW--;
          lo++;
        }
      }
      if (seq >= 0) best = [seq, seq + have.length - 1];
      var span = best[1] - best[0] + 1;
      var tier = mode === 'most' ? 'most' : mode === 'part' ? 'part' :
                 (mode === 'typo' ? 'typo' : '') + (seq >= 0 ? 'Seq' : span <= Math.max(8, nW) ? 'Near' : 'Any');
      if (!mode) tier = tier.charAt(0).toLowerCase() + tier.slice(1);
      var looseN = 0; for (var b = e.loose; b; b >>= 1) looseN += b & 1;
      var bonus = bonusOf(nW / Math.max(1, W.len[i]), best[0] === 0) + 4 * (have.length / span) - 2 * looseN;
      put(i, tier, bonus, { src: 'quran', kind: 'ar', _o0: best[0], _o1: best[1] });
      found++;
    }
    return found;
  };

  Quran.prototype._smartTranslit = function (q, put) {
    var sk = translitSkeleton(q);
    if (!sk || sk.length < 3 || sk.length > 40) return;
    var W = this._words(), text = W.skelText();
    W.tables();
    var re = new RegExp('(?:^| )ل?' + sk.map(function (c, k) {
      var one = c.length > 1 ? '[' + c + ']' : c;
      return sk.dbl[k] ? one + '(?:(?: ل?)?' + one + ')?' : one;
    }).join('(?: ل?)?') + '(?= )');
    for (var i = 0; i < text.length; i++) {
      var m = re.exec(text[i]);
      if (!m) continue;
      var st = m.index + (m[0][0] === ' ' ? 1 : 0), letters = text[i].replace(/ /g, '').length;
      put(i, 'translit', bonusOf(sk.length / Math.max(1, letters), st === 1),
          { src: 'quran', kind: 'translit', _o0: W.ordAt(i, 4, st), _o1: W.ordAt(i, 4, m.index + m[0].length - 1) });
    }
  };

  var trCache = typeof WeakMap !== 'undefined' ? new WeakMap() : null, trParts = trCache && new WeakMap();
  function trOne(t) { return ' ' + norm(stripHtml(t)) + ' '; }
  Quran.prototype._smartText = function (q, data, id, put) {
    var nt = partMap(trCache, trParts, data, trOne);
    var toks = tokenize(q).slice(0, MAX_WORDS * 2);
    if (!toks.length) return;
    var nq = toks.map(function (t) { return t.t; }).join(' ');
    if (nq.length < 2) return;
    for (var i = 0; i < nt.length; i++) {
      var s = nt[i], p = s.indexOf(' ' + nq);
      if (p < 0 && toks[0].pairs) p = s.indexOf(nq);
      if (p >= 0) { put(i, 'tr', bonusOf(nq.length / s.length, p === 0), { src: id, kind: 'tr' }); continue; }
      if (toks.length < 2) continue;
      var ok = true;
      for (var k = 0; k < toks.length && ok; k++) ok = s.indexOf(toks[k].pairs ? toks[k].t : ' ' + toks[k].t) >= 0;
      if (ok) put(i, 'trAll', bonusOf(nq.length / s.length, false), { src: id, kind: 'tr' });
    }
  };

  /* Word spans of an ayah (end mark excluded). Ordinary spaces only: U+200A inside
     words like وَرِضۡوَ ٰ⁠نࣰا is not a word break. */
  var LETTER = /[\u0621-\u064A\u066E-\u06D3\u06EE-\u06FF\u0750-\u077F\u08A0-\u08C9]/;
  Quran.prototype.spans = function (s, a) {
    var t = this.text(s, a), out = [], re = /[^ \u00a0]+/g, w;
    while ((w = re.exec(t))) out.push({ start: w.index, end: w.index + w[0].length, text: w[0] });
    var mark = '';
    if (out.length > 1 && !LETTER.test(out[out.length - 1].text)) mark = out.pop().text;   // ۝١ / ١ / font marker
    return { words: out, mark: mark };
  };
  Quran.prototype.words = function (s, a) { return this.spans(s, a).words.map(function (w) { return w.text; }); };

  function stripTrNumber(t) { return t.trim().replace(/^\d+\s*\.\s*/, ''); }
  function stripHtml(t) {
    return String(t || '').replace(/<sup[^>]*>[\s\S]*?<\/sup>/g, '').replace(/<a[^>]*>[\s\S]*?<\/a>/g, '')
      .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  }

  /* Runs of one piece of an ayah [start, end) with tajweed colours. */
  Quran.prototype._runs = function (s, a, start, end) {
    var i0 = this.index(s, a), t = this.text(s, a), runs = [];
    var cols = this.colors && this.colors[i0], pgs = this.pages && this.pages[i0];
    for (var i = start; i < end; i++) {
      var c = cols ? cols[i] : null, p = pgs ? pgs[i] : null, last = runs[runs.length - 1];
      if (last && last.color === c && last.page === p) last.t += t[i];
      else runs.push({ t: t[i], color: c, page: p });
    }
    return runs;
  };

  /* sel  = {sura, from, to, wordFrom?, wordTo?}  (0-based word indexes; wordFrom
            applies to the first ayah, wordTo to the last one)
     opts = {brackets, auza, basmala, ref, trRef, bold, basmalaText?,
             ayahNums, hizb, sajda, waqf (false: leave out ayah numbers, ۞, ۩, the pause marks ۖ ۗ ۚ ۛ ۘ ۙ),
             translations: [{data, dir, quotes:[open, close], suraName}],
             tafsirs: [{name, dir, quotes, suraName, get(sura, aya) -> {from, to, text} | null}]}
     Returns {arabic: {dir, runs}, paras: [{dir, runs}], text}:
       runs = [{t, bold, italic, color, page, plain, role}]; role: 'auza' | 'basmala' | 'ref' | 'sep'
       (the caller chooses font and size per role)                                                  */
  Quran.prototype.format = function (sel, opts) {
    opts = opts || {};
    var self = this, br = this.meta.brackets, ar = [], bold = !!opts.bold;
    function push(t, extra) { var r = { t: t, bold: bold }; for (var k in extra) r[k] = extra[k]; ar.push(r); }

    // A'udhu and the reference are not Quran text: plain Arabic font (r.plain), not the Mushaf one
    if (opts.auza) push(AUZA, { plain: true, role: 'auza' });
    if (opts.basmala && !(sel.sura === 1 && sel.from === 1)) {
      if (opts.auza) push('. ', { plain: true, role: 'auza' });
      if (opts.basmalaText) push(opts.basmalaText, { plain: true, role: 'basmala' });   // a font chosen for it
      else {
        var bw = this.spans(1, 1).words;               // the basmala in the chosen Mushaf (1:1 without its number)
        this._runs(1, 1, bw[0].start, bw[bw.length - 1].end).forEach(function (r) {
          var x = { role: 'basmala' }; if (r.color) x.color = r.color; if (r.page) x.page = r.page;
          push(r.t, x);
        });
      }
    }
    if (ar.length) push(' ', { plain: true, role: 'sep' });
    if (opts.brackets !== false) push(br.open);
    // signs the user left out; not in the page-font mushafs (QPC V1/V2/V4), where they are parts of word glyphs
    var cut = [];
    if (opts.hizb === false) cut.push('\u06DE[ \u00a0]?');
    if (opts.sajda === false) cut.push('[ \u00a0]?\u06E9');
    if (opts.waqf === false) cut.push('[\u06D6-\u06DB]');
    cut = cut.length ? new RegExp(cut.join('|'), 'g') : null;
    for (var a = sel.from; a <= sel.to; a++) {
      var sp = this.spans(sel.sura, a), w = sp.words, t = this.text(sel.sura, a);
      var b = a === sel.from && sel.wordFrom > 0 ? Math.min(sel.wordFrom, w.length - 1) : 0;
      var e = a === sel.to && sel.wordTo != null ? Math.min(sel.wordTo, w.length - 1) : w.length - 1;
      if (a > sel.from) push(' ');
      var endChar = e === w.length - 1 && opts.ayahNums !== false ? t.length : w[e].end;
      var pr = this._runs(sel.sura, a, w[b].start, endChar);
      if (cut) pr = pr.map(function (r) { if (!r.page) r.t = r.t.replace(cut, ''); return r; }).filter(function (r) { return r.t; });
      if (pr.length) { pr[0].t = pr[0].t.replace(/^[ \u00a0]+/, ''); pr[pr.length - 1].t = pr[pr.length - 1].t.replace(/[ \u00a0]+$/, ''); }
      pr.forEach(function (r) {
        var x = {}; if (r.color) x.color = r.color; if (r.page) x.page = r.page;
        push(r.t, x);
      });
    }
    if (opts.brackets !== false) push(br.close);
    if (opts.ref) {
      var rng = sel.to > sel.from ? arNum(sel.from) + '-' + arNum(sel.to) : arNum(sel.from);
      push(' ', { plain: true, role: 'sep', bold: false });
      // non-breaking space: the reference never breaks between the sura name and the numbers
      push('[' + this.suras[sel.sura - 1][0] + '\u00a0' + rng + ']', { plain: true, role: 'ref', bold: false });
    }
    ar = mergeRuns(ar);

    var paras = [];
    /* «meaning (explanation) …» (Sura: 1-2).  -- the same layout for translations and tafsirs:
       one ayah: no number inside; several: "1. … 2. …" (a commentary on a group: "1-3. …"),
       the sura name and the range at the end */
    function quoted(items, q, suraName) {
      var multi = items.length > 1 || items[0].from !== items[0].to;
      var from = items[0].from, to = items[items.length - 1].to;
      var parts = [], bounds = [], pos = q[0].length;
      items.forEach(function (it) {
        var num = it.from === it.to ? String(it.from) : it.from + '-' + it.to;
        parts.push(multi ? num + '. ' + it.text : it.text);
        bounds.push(pos); pos += parts[parts.length - 1].length + 1;
      });
      var quote = q[0] + parts.join(' ').replace(/[\s.,;:،]+$/, '') + q[1];
      var rng = from === to ? String(from) : from + '-' + to;
      var runs = splitParens(quote, bounds, q[0].length);
      return opts.trRef === false ? runs : runs.concat([{ t: ' (' + suraName + ': ' + rng + ').', bold: false, italic: true, role: 'trref' }]);
    }
    (opts.translations || []).forEach(function (tr) {
      var items = [];
      for (var a2 = sel.from; a2 <= sel.to; a2++) {
        var x = stripTrNumber(stripHtml(tr.data[self.index(sel.sura, a2)]).replace(/\s+/g, ' '));
        if (x) items.push({ from: a2, to: a2, text: x });     // partial translations: ayah missing
      }
      if (items.length) paras.push({ dir: tr.dir || 'ltr', kind: 'tr', runs: quoted(items, tr.quotes || ['«', '»'], tr.suraName) });
    });

    // a commentary entry may explain a group of ayahs: each entry once, all in one paragraph
    (opts.tafsirs || []).forEach(function (tf) {
      var seen = {}, items = [];
      for (var a3 = sel.from; a3 <= sel.to; a3++) {
        var en = tf.get(sel.sura, a3);
        if (!en || !en.text) continue;
        var key = en.from + '-' + en.to;
        if (seen[key]) continue;
        seen[key] = 1;
        var text = tafsirParagraphs(en.text).join(' ');
        if (text) items.push({ from: en.from, to: en.to, text: text });
      }
      if (!items.length) return;
      var all = items.map(function (it) { return it.text; }).join(' ');
      paras.push({ dir: textDir(all, tf.dir || 'ltr'), kind: 'tf', runs: quoted(items, tf.quotes || ['«', '»'], tf.suraName || tf.name) });
    });

    var text = ar.map(function (r) { return r.t; }).join('');
    paras.forEach(function (p) { text += '\n' + p.runs.map(function (r) { return r.t; }).join(''); });
    return { arabic: { dir: 'rtl', runs: ar }, paras: paras, text: text };
  };

  function mergeRuns(runs) {
    var out = [];
    runs.forEach(function (r) {
      if (!r.t) return;
      var l = out[out.length - 1];
      if (l && l.bold === r.bold && (l.color || null) === (r.color || null) && (l.page || null) === (r.page || null) &&
          !l.plain === !r.plain && (l.role || null) === (r.role || null) && !l.italic && !r.italic) l.t += r.t;
      else out.push(r);
    });
    return out;
  }

  /* Arabic quotations inside a tafsir in another language get their own direction */
  function textDir(p, def) {
    var ar = (p.match(/[\u0600-\u06FF\u08A0-\u08FF]/g) || []).length, lat = (p.match(/[A-Za-z\u0400-\u04FF]/g) || []).length;
    return ar > lat * 2 ? 'rtl' : lat > ar * 2 ? 'ltr' : def;
  }

  /* Tafsir HTML -> plain paragraphs ([[..]] = editor notes, dropped like on tafsir.one) */
  function tafsirParagraphs(html) {
    var t = String(html || '').replace(/\r/g, '')
      .replace(/<\s*br\s*\/?>/gi, '\n').replace(/<\/(p|div|h\d|li|blockquote|tr)>/gi, '\n');
    t = stripHtml(t).replace(/ ?\[\[[\s\S]*?\]\]/g, '');
    return t.split(/\n+/).map(function (p) { return p.replace(/[ \t]+/g, ' ').trim(); }).filter(Boolean);
  }

  /* Translation formatting: the ayah meaning is bold, explanations in (…) and […]
     are not. Brackets are matched in pairs inside each ayah (bounds = start offsets
     of ayahs); unmatched ones (there are some in the sources) are ignored, so they
     cannot un-bold the rest of the text.                                            */
  function splitParens(text, bounds, first) {
    var plain = new Array(text.length), stack = [], b = 1, pairs = { ')': '(', ']': '[' };
    bounds = bounds || [first || 0];
    for (var i = 0; i < text.length; i++) {
      if (b < bounds.length && i === bounds[b]) { stack = []; b++; }
      var ch = text[i];
      if (ch === '(' || ch === '[') stack.push(i);
      else if (pairs[ch]) {
        for (var k = stack.length - 1; k >= 0; k--) {
          if (text[stack[k]] === pairs[ch]) {
            for (var x = stack[k]; x <= i; x++) plain[x] = true;
            stack.length = k;
            break;
          }
        }
      }
    }
    var out = [];
    for (var j = 0; j < text.length; j++) {
      var bold = !plain[j], last = out[out.length - 1];
      if (last && last.bold === bold) last.t += text[j];
      else out.push({ t: text[j], bold: bold, italic: false });
    }
    return out;
  }

  /* What each place the panel (or the text itself) goes to can do. One rule for all of them: insert as TEXT
     whenever the host can show it correctly, and as a PICTURE (transparent, see ayahPicture) only when it cannot.
       text      the host has editable text with fonts and right-to-left
       qpcText   the QPC page fonts (one font per mushaf page, private-use glyphs) work as text there
       picture   the host can take a picture
     `online` hosts (Word on the web / iPad) have no locally installed fonts, so qpcText is false there. */
  var HOSTS = {
    word:       { text: true,  qpcText: true,  picture: true },
    wordOnline: { text: true,  qpcText: false, picture: true },
    gdocs:      { text: true,  qpcText: false, picture: false },
    wp:         { text: true,  qpcText: true,  picture: false },
    ext:        { text: true,  qpcText: true,  picture: false },   // insert.js adds the page fonts' @font-face; plain fields get Unicode
    indesign:   { text: true,  qpcText: true,  picture: true },
    incopy:     { text: true,  qpcText: true,  picture: true },
    photoshop:  { text: true,  qpcText: false, picture: true },
    illustrator:{ text: true,  qpcText: false, picture: true },
    aftereffects:{ text: true, qpcText: false, picture: true },
    premiere:   { text: false, qpcText: false, picture: true },
    telegram:   { text: true,  qpcText: false, picture: true },
    mcp:        { text: true,  qpcText: false, picture: false }
  };
  /* 'text' | 'picture' | 'plain' (QPC is not possible there: use the ordinary Unicode mushaf in that host) */
  function renderMode(host, isQpcScript) {
    var h = HOSTS[host];
    if (!h) return 'text';
    if (!isQpcScript) return h.text ? 'text' : (h.picture ? 'picture' : 'plain');
    if (h.text && h.qpcText) return 'text';
    return h.picture ? 'picture' : 'plain';
  }

  return { Quran: Quran, HOSTS: HOSTS, renderMode: renderMode, normArabic: normArabic, normText: normText, arNum: arNum,
           tafsirParagraphs: tafsirParagraphs, stripHtml: stripHtml, AUZA: AUZA, BASMALA: BASMALA,
           // search in any language (shared by web/search.js and the index builder)
           text: { norm: norm, terms: terms, queryTerms: queryTerms, tokenize: tokenize, detectScript: detectScript,
                   scriptOf: scriptOf, arStem: arStem, latToCyr: latToCyr, cyrToLat: cyrToLat, levenshtein: levenshtein,
                   translitSkeleton: translitSkeleton, isArabic: isArabic, PAIRS: PAIRS },
           SEARCH_TIERS: TIER };
});
