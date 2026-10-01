/* Shared logic for the website and the Word add-in: search + formatting. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QuranCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
  var END_MARK = / *۝[٠-٩]+ *$/;
  var MARKS = /[ؐ-ًؚ-ٟۖ-ۭ࣓-ࣿـ​-‏⁠۝۞۩]/g;

  function arNum(n) {
    return String(n).replace(/[0-9]/g, function (d) { return AR_DIGITS[+d]; });
  }
  function toLatinDigits(s) {
    return s.replace(/[٠-٩]/g, function (d) { return AR_DIGITS.indexOf(d); })
            .replace(/[۰-۹]/g, function (d) { return '۰۱۲۳۴۵۶۷۸۹'.indexOf(d); });
  }

  /* Arabic normalisation for search. Three levels, from strict to loose:
     0: diacritics removed (dagger alef dropped)      الرحمن  العلمين
     1: dagger alef -> alef (imla'i spelling)          الرحمان العالمين
     2: skeleton: no alef / hamza at all               لرحمن   لعلمين            */
  function normArabic(s, level) {
    s = toLatinDigits(s).replace(/\s+(?=\u0670)/g, '').replace(/[\u200A\u2060]/g, '').replace(/۝[0-9]+/g, ' ').replace(/[0-9]/g, ' ');
    if (level === 1) s = s.replace(/ٰ/g, 'ا');
    else s = s.replace(/ٰ/g, '');
    s = s.replace(MARKS, '')
      .replace(/[ٱأإآ]/g, 'ا')
      .replace(/[ىیي]/g, 'ي').replace(/ئ/g, 'ي')
      .replace(/ؤ/g, 'و').replace(/ء/g, '')
      .replace(/ة/g, 'ه').replace(/ۀ/g, 'ه').replace(/ک/g, 'ك')
      .replace(/[^ء-ي\s]/g, ' ');
    if (level === 2) s = s.replace(/ا/g, '');
    return s.replace(/\s+/g, ' ').trim();
  }

  function normLatin(s) {
    return s.toLowerCase()
      .replace(/[ʻʼ'`’‘]/g, '')
      .replace(/[^0-9a-zа-яёўқғҳЀ-ӿ\s:-]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  function isArabic(s) { return /[؀-ۿݐ-ݿࢠ-ࣿ]/.test(s); }

  function Quran(data) {
    this.meta = data.meta;
    this.suras = data.suras;             // [[nameAr, nameUz, ayahCount]]
    this.ayahs = data.ayahs;             // flat list, 6236 texts with " ۝N"
    this.offsets = [];
    var o = 0;
    for (var i = 0; i < this.suras.length; i++) { this.offsets.push(o); o += this.suras[i][2]; }
    this._idx = null;
  }

  Quran.prototype.index = function (s, a) { return this.offsets[s - 1] + a - 1; };
  Quran.prototype.text = function (s, a) { return this.ayahs[this.index(s, a)]; };
  Quran.prototype.count = function (s) { return this.suras[s - 1][2]; };

  Quran.prototype._buildIndex = function () {
    if (this._idx) return this._idx;
    var idx = [[], [], []];
    for (var i = 0; i < this.ayahs.length; i++)
      for (var l = 0; l < 3; l++) idx[l].push(' ' + normArabic(this.ayahs[i], l) + ' ');
    this._idx = idx;
    return idx;
  };

  Quran.prototype.findSura = function (name) {
    var q = normLatin(name), qa = normArabic(name, 0);
    if (!q && !qa) return 0;
    for (var pass = 0; pass < 2; pass++) {
      for (var i = 0; i < this.suras.length; i++) {
        var uz = normLatin(this.suras[i][1]), ar = normArabic(this.suras[i][0], 0);
        var arNoAl = ar.replace(/^ال/, '');
        if (pass === 0 && (q && uz === q || qa && (ar === qa || arNoAl === qa.replace(/^ال/, '')))) return i + 1;
        if (pass === 1 && (q && q.length >= 2 && uz.indexOf(q) === 0 || qa && qa.length >= 2 && ar.indexOf(qa) >= 0)) return i + 1;
      }
    }
    return 0;
  };

  /* Parses references: "2:255", "2 255", "2:1-5", "2.30-37", "Бақара 30-37",
     "البقرة ٢٥٥", "2" (whole sura start). Returns {sura, from, to} or null. */
  Quran.prototype.parseRef = function (q) {
    q = toLatinDigits(q.trim());
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

  /* Full search. Returns list of {sura, aya} (max `limit`). */
  Quran.prototype.search = function (q, translation, limit) {
    limit = limit || 100;
    q = (q || '').trim();
    if (!q) return [];
    var ref = this.parseRef(q), out = [], seen = {};
    function add(i, self) {
      if (seen[i] || out.length >= limit) return;
      seen[i] = 1;
      var s = 0; while (s + 1 < self.offsets.length && self.offsets[s + 1] <= i) s++;
      out.push({ sura: s + 1, aya: i - self.offsets[s] + 1 });
    }
    if (ref) for (var a = ref.from; a <= ref.to; a++) add(this.index(ref.sura, a), this);
    if (isArabic(q)) {
      var idx = this._buildIndex();
      for (var l = 0; l < 3 && out.length < limit; l++) {
        var nq = normArabic(q, l);
        if (!nq) continue;
        for (var i = 0; i < idx[l].length; i++) if (idx[l][i].indexOf(nq) >= 0) add(i, this);
      }
    } else if (translation && !/^[\d\s:.,\-–—]+$/.test(q)) {
      var lq = normLatin(q);
      if (lq.length >= 3)
        for (var j = 0; j < translation.length && out.length < limit; j++)
          if (normLatin(translation[j]).indexOf(lq) >= 0) add(j, this);
    }
    return out;
  };

  /* Words of an ayah, without the end mark "۝N". */
  Quran.prototype.words = function (s, a) {
    // split on ordinary spaces only: U+200A inside words like وَرِضۡوَ ٰ⁠نࣰا is not a word break
    return this.text(s, a).replace(END_MARK, '').split(/ +/).filter(Boolean);
  };

  function stripTrNumber(t) { return t.trim().replace(/^\d+\s*\.\s*/, ''); }

  /* sel = {sura, from, to, wordFrom?, wordTo?}  (word indexes are 0-based,
     wordFrom applies to the first ayah, wordTo to the last one).
     opts = {brackets: true, translation: [...] | null}                       */
  Quran.prototype.format = function (sel, opts) {
    opts = opts || {};
    var br = this.meta.brackets, parts = [];
    for (var a = sel.from; a <= sel.to; a++) {
      var full = this.text(sel.sura, a);
      var partial = (a === sel.from && sel.wordFrom > 0) ||
                    (a === sel.to && sel.wordTo != null && sel.wordTo < this.words(sel.sura, a).length - 1);
      if (!partial) { parts.push(full); continue; }
      var w = this.words(sel.sura, a);
      var b = a === sel.from && sel.wordFrom > 0 ? sel.wordFrom : 0;
      var e = a === sel.to && sel.wordTo != null ? sel.wordTo : w.length - 1;
      var piece = w.slice(b, e + 1).join(' ');
      if (e === w.length - 1) piece += ' ' + full.match(END_MARK)[0].trim();
      parts.push(piece);
    }
    var arabic = parts.join(' ');
    if (opts.brackets !== false) arabic = br.open + arabic + br.close;

    var uz = null, trParts = null;
    if (opts.translation) {
      var multi = sel.to > sel.from, tr = [], bounds = [], pos = 1;   // 1 = after «
      for (var b2 = sel.from; b2 <= sel.to; b2++) {
        var t = stripTrNumber(opts.translation[this.index(sel.sura, b2)]);
        tr.push(multi ? b2 + '. ' + t : t);
        bounds.push(pos); pos += tr[tr.length - 1].length + 1;
      }
      var body = tr.join(' ').replace(/[\s.,;:]+$/, '');
      var range = multi ? sel.from + '-' + sel.to : String(sel.from);
      var quote = '«' + body + '»', ref = ' (' + this.suras[sel.sura - 1][1] + ': ' + range + ').';
      uz = quote + ref;
      trParts = splitParens(quote, bounds).concat([{ text: ref, bold: false, italic: true }]);
    }
    return { arabic: arabic, translation: uz, translationParts: trParts };
  };

  /* Translation formatting: the ayah meaning is bold, explanations in (…) are not.
     Parentheses are matched in pairs inside each ayah (bounds = start offsets of
     ayahs); an unmatched "(" or ")" (there are some in the source) is ignored, so it
     cannot un-bold the rest of the text. Returns [{text, bold, italic}].            */
  function splitParens(text, bounds) {
    var plainMask = new Array(text.length), stack = [], b = 1;
    bounds = bounds || [0];
    for (var i = 0; i < text.length; i++) {
      if (b < bounds.length && i === bounds[b]) { stack = []; b++; }
      if (text[i] === '(') stack.push(i);
      else if (text[i] === ')' && stack.length) {
        for (var k = stack.pop(); k <= i; k++) plainMask[k] = true;
      }
    }
    var out = [];
    for (var j = 0; j < text.length; j++) {
      var bold = !plainMask[j], last = out[out.length - 1];
      if (last && last.bold === bold) last.text += text[j];
      else out.push({ text: text[j], bold: bold, italic: false });
    }
    return out;
  }

  return { Quran: Quran, normArabic: normArabic, arNum: arNum };
});
