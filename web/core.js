/* Shared logic for the website and the Word add-in: search + formatting. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QuranCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
  /* ayah end: "۝١٢" (tafsir.one), "١٢" (QPC fonts draw the circle themselves) */
  var END_MARK = / *(?:۝ ?)?[٠-٩۰-۹]+ *$/;
  var MARKS = /[ؐ-ًؚ-ٟۖ-ۭ࣓-ࣿـ​-‏⁠۝۞۩]/g;
  var AUZA = 'أَعُوذُ بِٱللَّهِ مِنَ ٱلشَّیۡطَـٰنِ ٱلرَّجِیمِ';
  var BASMALA = 'بِسۡمِ ٱللَّهِ ٱلرَّحۡمَـٰنِ ٱلرَّحِیمِ';

  /* Tajweed colours (classes of QUL text_uthmani_tajweed) */
  var TAJWEED = {
    ham_wasl: '9A9A9A', slnt: '9A9A9A', laam_shamsiyah: '9A9A9A',
    madda_normal: '537FFF', madda_permissible: '4050FF', madda_necessary: '000EBC', madda_obligatory: '2144C1',
    qalaqah: 'DD0008', ikhafa_shafawi: 'D500B7', ikhafa: '9400A8', idgham_shafawi: '58B800', iqlab: '26BFFD',
    idgham_ghunnah: '169777', idgham_wo_ghunnah: '169200', idgham_mutajanisayn: 'A1A1A1',
    idgham_mutaqaribayn: 'A1A1A1', ghunnah: 'FF7E1E'
  };

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
    s = toLatinDigits(s).replace(/\s+(?=ٰ)/g, '').replace(/[ ⁠]/g, '')
      .replace(/۝[0-9]+/g, ' ').replace(/[0-9]/g, ' ');
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

  /* "<tajweed class=x>..</tajweed>" -> {text, colors[]} (colour per character) */
  function parseTajweed(raw) {
    var text = '', colors = [], re = /<(tajweed|span)\s+class=["']?([\w-]+)["']?[^>]*>([\s\S]*?)<\/\1>|<[^>]+>|([^<]+)/g, m;
    while ((m = re.exec(raw))) {
      var t = m[3] != null ? m[3].replace(/<[^>]+>/g, '') : (m[4] || '');
      var c = m[3] != null ? (TAJWEED[m[2]] || null) : null;
      t = t.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
      for (var i = 0; i < t.length; i++) { text += t[i]; colors.push(c); }
    }
    return { text: text, colors: colors };
  }

  function Quran(data) {
    this.meta = data.meta;
    this.suras = data.suras;             // [[nameAr, nameUz, ayahCount]]
    this.offsets = [];
    var o = 0;
    for (var i = 0; i < this.suras.length; i++) { this.offsets.push(o); o += this.suras[i][2]; }
    this.extraNames = [];                // other languages, for finding a sura by name
    this.setScript(data.ayahs);
  }

  /* ayahs: 6236 texts; tajweed: texts contain <tajweed class=...> markup */
  Quran.prototype.setScript = function (ayahs, opts) {
    opts = opts || {};
    this.tajweed = !!opts.tajweed;
    this.colors = null;
    if (this.tajweed) {
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
    var idx = [[], [], []];
    for (var i = 0; i < this.ayahs.length; i++)
      for (var l = 0; l < 3; l++) idx[l].push(' ' + normArabic(this.ayahs[i], l) + ' ');
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

  var normCache = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  function normalized(arr) {
    var v = normCache && normCache.get(arr);
    if (!v) { v = arr.map(function (t) { return ' ' + normText(stripHtml(t)) + ' '; }); if (normCache) normCache.set(arr, v); }
    return v;
  }

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
      for (var l = 0; l < 3 && out.length < limit; l++) {
        var nq = normArabic(q, l);
        if (!nq) continue;
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

  /* Word spans of an ayah (end mark excluded). Ordinary spaces only: U+200A inside
     words like وَرِضۡوَ ٰ⁠نࣰا is not a word break. */
  Quran.prototype.spans = function (s, a) {
    var t = this.text(s, a), m = t.match(END_MARK), end = m ? m.index : t.length, out = [], re = /[^ ]+/g, w;
    var body = t.slice(0, end);
    while ((w = re.exec(body))) out.push({ start: w.index, end: w.index + w[0].length, text: w[0] });
    return { words: out, mark: m ? m[0].trim() : '', markStart: m ? t.indexOf(m[0].trim(), end) : -1 };
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
    var t = this.text(s, a), cols = this.colors && this.colors[this.index(s, a)], runs = [];
    for (var i = start; i < end; i++) {
      var c = cols ? cols[i] : null, last = runs[runs.length - 1];
      if (last && last.color === c) last.t += t[i];
      else runs.push({ t: t[i], color: c });
    }
    return runs;
  };

  /* sel  = {sura, from, to, wordFrom?, wordTo?}  (0-based word indexes; wordFrom
            applies to the first ayah, wordTo to the last one)
     opts = {brackets, auza, basmala, ref,
             translations: [{data, dir, quotes:[open, close], suraName}],
             tafsirs: [{name, dir, get(sura, aya) -> {from, to, text} | null}]}
     Returns {arabic: {dir, runs}, paras: [{dir, runs}], text}: runs = [{t, bold, italic, color}] */
  Quran.prototype.format = function (sel, opts) {
    opts = opts || {};
    var self = this, br = this.meta.brackets, ar = [];
    function push(t, extra) { var r = { t: t, bold: true }; for (var k in extra) r[k] = extra[k]; ar.push(r); }

    if (opts.auza) push(AUZA + ' ');
    if (opts.basmala && !(sel.sura === 1 && sel.from === 1)) push(BASMALA + ' ');
    if (opts.brackets !== false) push(br.open);
    for (var a = sel.from; a <= sel.to; a++) {
      var sp = this.spans(sel.sura, a), w = sp.words, t = this.text(sel.sura, a);
      var b = a === sel.from && sel.wordFrom > 0 ? Math.min(sel.wordFrom, w.length - 1) : 0;
      var e = a === sel.to && sel.wordTo != null ? Math.min(sel.wordTo, w.length - 1) : w.length - 1;
      if (a > sel.from) push(' ');
      var endChar = e === w.length - 1 ? t.length : w[e].end;
      var pr = this._runs(sel.sura, a, w[b].start, endChar);
      if (pr.length) pr[pr.length - 1].t = pr[pr.length - 1].t.replace(/ +$/, '');
      pr.forEach(function (r) { push(r.t, r.color ? { color: r.color } : {}); });
    }
    if (opts.brackets !== false) push(br.close);
    if (opts.ref) {
      var rng = sel.to > sel.from ? arNum(sel.from) + '-' + arNum(sel.to) : arNum(sel.from);
      ar.push({ t: ' [' + this.suras[sel.sura - 1][0] + ' ' + rng + ']', bold: false });
    }
    ar = mergeRuns(ar);

    var paras = [], multi = sel.to > sel.from;
    (opts.translations || []).forEach(function (tr) {
      var parts = [], bounds = [], pos = 1;
      for (var a2 = sel.from; a2 <= sel.to; a2++) {
        var x = stripTrNumber(stripHtml(tr.data[self.index(sel.sura, a2)]).replace(/\s+/g, ' '));
        parts.push(multi ? a2 + '. ' + x : x);
        bounds.push(pos); pos += parts[parts.length - 1].length + 1;
      }
      var q = tr.quotes || ['«', '»'];
      var quote = q[0] + parts.join(' ').replace(/[\s.,;:،]+$/, '') + q[1];
      var range = multi ? sel.from + '-' + sel.to : String(sel.from);
      var runs = splitParens(quote, bounds, q[0].length).concat([{ t: ' (' + tr.suraName + ': ' + range + ').', bold: false, italic: true }]);
      paras.push({ dir: tr.dir || 'ltr', runs: runs });
    });

    (opts.tafsirs || []).forEach(function (tf) {
      var seen = {}, entries = [];
      for (var a3 = sel.from; a3 <= sel.to; a3++) {
        var en = tf.get(sel.sura, a3);
        if (!en || !en.text) continue;
        var key = en.from + '-' + en.to;
        if (seen[key]) continue;
        seen[key] = 1; entries.push(en);
      }
      if (!entries.length) return;
      paras.push({ dir: tf.dir || 'ltr', runs: [{ t: tf.name, bold: true }] });
      entries.forEach(function (en) {
        var label = entries.length > 1 || en.from !== en.to ? (en.from === en.to ? en.from : en.from + '-' + en.to) + '. ' : '';
        tafsirParagraphs(en.text).forEach(function (p, i) {
          var runs = [];
          if (i === 0 && label) runs.push({ t: label, bold: true });
          runs.push({ t: p, bold: false });
          paras.push({ dir: tf.dir || 'ltr', runs: runs });
        });
      });
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
      if (l && l.bold === r.bold && (l.color || null) === (r.color || null) && !l.italic && !r.italic) l.t += r.t;
      else out.push(r);
    });
    return out;
  }

  /* Tafsir HTML -> plain paragraphs */
  function tafsirParagraphs(html) {
    var t = String(html || '').replace(/\r/g, '')
      .replace(/<\s*br\s*\/?>/gi, '\n').replace(/<\/(p|div|h\d|li|blockquote|tr)>/gi, '\n');
    t = stripHtml(t);
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

  return { Quran: Quran, normArabic: normArabic, normText: normText, arNum: arNum,
           tafsirParagraphs: tafsirParagraphs, stripHtml: stripHtml, AUZA: AUZA, BASMALA: BASMALA };
});
