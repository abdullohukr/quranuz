/* MyQuran: UI for the website and the Word add-in task pane. */
(function () {
  'use strict';
  var V = '5';
  var $ = function (id) { return document.getElementById(id); };
  var DEFAULTS = {
    uiLang: 'uz', script: 'default',
    withTr: true, translations: ['alovuddin_mansur'],
    withTafsir: false, tafsirs: [],
    brackets: true, auza: false, basmala: false, ref: false, newPara: true,
    arFont: '', arSize: 18, uzFont: '', uzSize: 14
  };
  var QUOTES = { en: ['“', '”'], tr: ['“', '”'], id: ['“', '”'], ms: ['“', '”'], az: ['“', '”'], zh: ['“', '”'],
                 ja: ['「', '」'], ko: ['“', '”'], de: ['„', '“'], nl: ['„', '”'], it: ['«', '»'] };
  var settings = loadSettings(), i18n = new I18n(settings.uiLang);
  var quran, catalog = { translations: [], tafsirs: [], scripts: [] }, suraNames = {}, surahInfo = {};
  var cache = {}, sel = { sura: 1, from: 1, to: 1, wordFrom: 0, wordTo: null };
  var clickStart = null, inWord = false, results = [];
  var t = function (k, v) { return i18n.t(k, v); };

  /* ---------- settings (kept in localStorage, so they survive restarts) ---------- */
  function loadSettings() {
    var st = Object.assign({}, DEFAULTS);
    try {
      var saved = JSON.parse(localStorage.getItem('myquran-settings') || 'null');
      if (!saved) {                                 // migrate from the first version
        var old = JSON.parse(localStorage.getItem('quranuz-settings') || 'null');
        if (old) {
          saved = { brackets: old.brackets, newPara: old.newPara, arSize: old.arSize, uzFont: old.uzFont, uzSize: old.uzSize,
                    withTr: old.withTr };
          if (/tafsiri$/.test(old.translation || '')) { saved.tafsirs = [old.translation]; saved.withTafsir = true; }
          else if (old.translation) saved.translations = [old.translation];
          if (old.arFont && !/KFGQPC/i.test(old.arFont) && old.arFont !== 'Scheherazade New') saved.arFont = old.arFont;
        }
      }
      if (saved) Object.keys(saved).forEach(function (k) { if (saved[k] !== undefined) st[k] = saved[k]; });
    } catch (e) {}
    if (/KFGQPC/i.test(st.arFont)) st.arFont = '';
    return st;
  }
  function saveSettings() { try { localStorage.setItem('myquran-settings', JSON.stringify(settings)); } catch (e) {} }

  function toast(msg) {
    var el = $('toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove('show'); }, 2000);
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function getJSON(path) {
    if (!cache[path]) cache[path] = fetch((/^https?:/.test(path) ? '' : 'data/') + path + (path.indexOf('?') < 0 ? '?v=' + V : ''))
      .then(function (r) { if (!r.ok) throw new Error(r.status + ' ' + path); return r.json(); })
      .catch(function (e) { delete cache[path]; throw e; });
    return cache[path];
  }
  function optional(path, fallback) { return getJSON(path).catch(function () { return fallback; }); }

  /* ---------- interface language ---------- */
  function applyI18n() {
    document.documentElement.lang = i18n.code();
    document.documentElement.dir = i18n.dir();
    [].forEach.call(document.querySelectorAll('[data-i18n]'), function (el) { el.textContent = t(el.dataset.i18n); });
    [].forEach.call(document.querySelectorAll('[data-i18n-placeholder]'), function (el) { el.placeholder = t(el.dataset.i18nPlaceholder); });
    [].forEach.call(document.querySelectorAll('[data-i18n-title]'), function (el) { el.title = t(el.dataset.i18nTitle); });
  }
  $('ui-lang').innerHTML = I18n.languages.map(function (l) { return '<option value="' + l.id + '">' + esc(l.name) + '</option>'; }).join('');
  $('ui-lang').value = settings.uiLang;
  $('ui-lang').addEventListener('change', function () {
    settings.uiLang = this.value; i18n.set(settings.uiLang); saveSettings();
    applyI18n(); fillSuraSelect(); fillScriptSelect(); render(); if (results.length) runSearch();
  });

  /* ---------- catalog helpers ---------- */
  function trById(id) { return catalog.translations.filter(function (x) { return x.id === id; })[0]; }
  function tfById(id) { return catalog.tafsirs.filter(function (x) { return x.id === id; })[0]; }
  function scriptById(id) { return catalog.scripts.filter(function (x) { return x.id === id; })[0] || catalog.scripts[0]; }
  function activeTranslations() { return settings.translations.map(trById).filter(Boolean); }
  function activeTafsirs() { return settings.tafsirs.map(tfById).filter(Boolean); }
  function scriptName(sc) {
    if (sc.nameKey) return t(sc.nameKey);
    return (sc.label || [sc.name]).map(function (p) { return /^script\./.test(p) ? t(p) : p; }).join('');
  }
  function suraName(i, lang) {                                    // name of sura i (1-based) for a reference
    if (lang === 'uz' || lang === 'uz_latn') return quran.suras[i - 1][1];
    var dir = (catalog.languages && catalog.languages[lang] || {}).dir;
    if (dir === 'rtl') return quran.suras[i - 1][0];
    var n = suraNames[lang] && suraNames[lang].simple || suraNames.en && suraNames.en.simple;
    return n ? n[i - 1] : quran.suras[i - 1][0];
  }
  function uiSuraName(i) {
    var c = i18n.code();
    if (c === 'uz') return quran.suras[i - 1][1];
    if (c === 'ar') return quran.suras[i - 1][0];
    var n = suraNames[c] && suraNames[c].simple || suraNames.en && suraNames.en.simple;
    return n ? n[i - 1] : quran.suras[i - 1][1];
  }

  function loadTranslation(tr) { return getJSON(tr.file).then(function (d) { tr.data = d; return d; }); }
  function loadTafsirSura(tf, s) {
    tf.suras = tf.suras || {};
    if (tf.format === 'array') return getJSON(tf.file).then(function (d) { tf.all = d; });
    return getJSON(tf.path + s + '.json').then(function (d) { tf.suras[s] = d; });
  }
  function tafsirGetter(tf) {
    return function (s, a) {
      if (tf.format === 'array') { var x = tf.all && tf.all[quran.index(s, a)]; return x ? { from: a, to: a, text: x.replace(/^\d+\.\s*/, '') } : null; }
      var list = tf.suras && tf.suras[s] || [];
      for (var i = 0; i < list.length; i++) if (list[i][0] <= a && a <= list[i][1]) return { from: list[i][0], to: list[i][1], text: list[i][2] };
      return null;
    };
  }
  /* load everything the current selection needs */
  function ensureData() {
    var jobs = [];
    if (settings.withTr) activeTranslations().forEach(function (tr) { if (!tr.data) jobs.push(loadTranslation(tr)); });
    if (settings.withTafsir) activeTafsirs().forEach(function (tf) {
      if (tf.format === 'array' ? !tf.all : !(tf.suras && tf.suras[sel.sura])) jobs.push(loadTafsirSura(tf, sel.sura));
    });
    return Promise.all(jobs).catch(function (e) { toast(t('error') + ': ' + e.message); });
  }

  /* ---------- mushaf (Arabic script) ---------- */
  var loadedFonts = {};
  function useScript(id) {
    var sc = scriptById(id);
    var done = sc.file ? getJSON(sc.file) : Promise.resolve(sc.ayahs);
    return done.then(function (ayahs) {
      quran.setScript(ayahs, { tajweed: !!sc.tajweed && !sc.glyph, glyph: !!sc.glyph });
      if (sc.font && sc.font.url && !loadedFonts[sc.font.family]) {
        var st = document.createElement('style');
        st.textContent = "@font-face{font-family:'" + sc.font.family + "';src:url('" + sc.font.url + "');font-display:swap}";
        document.head.appendChild(st); loadedFonts[sc.font.family] = 1;
      }
      var fam = (sc.font && sc.font.family) ? "'" + sc.font.family + "', " : '';
      document.documentElement.style.setProperty('--ar-script', fam + "'QuranUz Arabic', 'Scheherazade New', serif");
      $('script-note').hidden = !sc.ayahByAyah;
      $('glyph-note').hidden = !sc.glyph;
      if (sc.glyph) $('glyph-zip').href = sc.fontsZip || '#';
      $('source').textContent = scriptName(sc) + (sc.source ? ' — ' + sc.source : '');
    });
  }
  /* QPC page fonts: one web font per Mushaf page, loaded when a page is shown */
  function pageFamily(page) {
    var sc = scriptById(settings.script), fam = 'MQ-' + sc.id + '-p' + page;
    if (!loadedFonts[fam]) {
      var st = document.createElement('style');
      st.textContent = "@font-face{font-family:'" + fam + "';src:url('" + sc.pageFont.url.replace('{n}', page) + "');font-display:block}";
      document.head.appendChild(st); loadedFonts[fam] = 1;
    }
    return "'" + sc.pageFont.families[page - 1] + "','" + fam + "'";
  }
  function wordFont(page) { return scriptById(settings.script).pageFont.families[page - 1]; }
  function arabicFont() {
    var sc = scriptById(settings.script);
    if (sc.glyph) return settings.arFont || 'Scheherazade New';   // brackets, A'udhu, reference
    return settings.arFont || (sc.font && sc.font.family) || 'Scheherazade New';
  }
  function fillScriptSelect() {
    $('s-script').innerHTML = catalog.scripts.map(function (sc) {
      return '<option value="' + sc.id + '">' + esc(scriptName(sc)) + (sc.ayahByAyah ? ' *' : '') + '</option>';
    }).join('');
    $('s-script').value = settings.script;
    $('ar-fonts').innerHTML = ['Scheherazade New', 'Amiri Quran'].concat(catalog.scripts.map(function (s) { return s.font && s.font.family; }))
      .filter(function (x, i, a) { return x && a.indexOf(x) === i; }).map(function (f) { return '<option value="' + esc(f) + '">'; }).join('');
  }

  /* ---------- search ---------- */
  function runSearch() {
    var q = $('q').value;
    var ref = q.trim() && quran.parseRef(q);
    if (ref) setSel(ref.sura, ref.from, ref.to);
    var trs = activeTranslations().filter(function (x) { return x.data; }).map(function (x) { return x.data; });
    results = quran.search(q, trs, 200);
    var list = $('results'); list.innerHTML = '';
    $('status').textContent = q.trim() ? (results.length ? t('results', { n: results.length }) : t('notFound')) : '';
    var first = activeTranslations().filter(function (x) { return x.data; })[0];
    results.forEach(function (r, i) {
      var li = document.createElement('li');
      li.dataset.i = i;
      li.innerHTML = '<div class="ref">' + esc(uiSuraName(r.sura)) + ' <bdi>' + r.sura + ':' + r.aya + '</bdi> · <bdi>' +
        esc(quran.suras[r.sura - 1][0]) + '</bdi></div><div class="ar">' + esc(quran.text(r.sura, r.aya)) + '</div>' +
        (first ? '<div class="small muted" dir="' + (first.dir || 'auto') + '">' +
          esc(QuranCore.stripHtml(first.data[quran.index(r.sura, r.aya)]).slice(0, 160)) + '…</div>' : '');
      list.appendChild(li);
    });
  }
  var searchTimer;
  $('q').addEventListener('input', function () { clearTimeout(searchTimer); searchTimer = setTimeout(runSearch, 250); });
  $('q').addEventListener('keydown', function (e) { if (e.key === 'Enter') { clearTimeout(searchTimer); runSearch(); } });
  $('results').addEventListener('click', function (e) {
    var li = e.target.closest('li'); if (!li) return;
    var r = results[+li.dataset.i];
    if (e.shiftKey && r.sura === sel.sura) setSel(r.sura, Math.min(sel.from, r.aya), Math.max(sel.to, r.aya));
    else setSel(r.sura, r.aya, r.aya);
    [].forEach.call($('results').children, function (x) { x.classList.toggle('active', x === li); });
  });

  /* ---------- selection ---------- */
  function fillSuraSelect() {
    $('sura').innerHTML = quran.suras.map(function (s, i) {
      return '<option value="' + (i + 1) + '">' + (i + 1) + '. ' + esc(uiSuraName(i + 1)) + ' — ' + esc(s[0]) + '</option>';
    }).join('');
    $('sura').value = sel.sura;
  }
  function setSel(sura, from, to) {
    var c = quran.count(sura);
    from = Math.min(Math.max(1, from | 0), c); to = Math.min(Math.max(from, to | 0), c);
    sel = { sura: sura, from: from, to: to, wordFrom: 0, wordTo: null };
    clickStart = null;
    $('sura').value = sura; $('from').max = c; $('to').max = c; $('from').value = from; $('to').value = to;
    render();
    ensureData().then(render);
  }
  $('sura').addEventListener('change', function () { setSel(+this.value, 1, 1); });
  $('from').addEventListener('change', function () { if (+this.value !== sel.from) setSel(sel.sura, +this.value, Math.max(+this.value, sel.to)); });
  $('to').addEventListener('change', function () { if (+this.value !== sel.to) setSel(sel.sura, sel.from, +this.value); });
  $('reset-words').addEventListener('click', function () { setSel(sel.sura, sel.from, sel.to); });

  function wordState(a, w) {
    if (a === sel.from && w < sel.wordFrom) return 'off';
    if (a === sel.to && sel.wordTo != null && w > sel.wordTo) return 'off';
    if (clickStart && clickStart.a === a && clickStart.w === w) return 'start';
    return '';
  }

  function current() {
    return quran.format(sel, {
      brackets: settings.brackets, auza: settings.auza, basmala: settings.basmala, ref: settings.ref,
      translations: settings.withTr ? activeTranslations().filter(function (x) { return x.data; }).map(function (x) {
        return { data: x.data, dir: x.dir, quotes: QUOTES[x.lang] || ['«', '»'], suraName: suraName(sel.sura, x.lang) };
      }) : [],
      tafsirs: settings.withTafsir ? activeTafsirs().map(function (tf) {
        return { name: tf.name, dir: tf.dir, get: tafsirGetter(tf) };
      }) : []
    });
  }

  function runsHtml(runs) {
    return runs.map(function (r) {
      var st = 'font-weight:' + (r.bold ? 'bold' : 'normal') + ';font-style:' + (r.italic ? 'italic' : 'normal') + (r.color ? ';color:#' + r.color : '') +
        (r.page ? ';font-family:' + pageFamily(r.page) : '');
      return '<span style="' + st + '">' + esc(r.t) + '</span>';
    }).join('');
  }

  function render() {
    if (!quran) return;
    var s = sel.sura;
    $('sel-title').innerHTML = esc(uiSuraName(s)) + ' <bdi>' + esc(quran.suras[s - 1][0]) + '</bdi> <bdi>' + s + ':' +
      (sel.to > sel.from ? sel.from + '-' + sel.to : sel.from) + '</bdi>';
    var html = '';
    if (sel.from === 1 && s !== 1 && s !== 9) html += '<div class="muted basmala">' + quran.meta.basmala + '</div>';
    for (var a = sel.from; a <= sel.to; a++) {
      var sp = quran.spans(s, a), cols = quran.colors && quran.colors[quran.index(s, a)], text = quran.text(s, a);
      sp.words.forEach(function (w, i) {
        var inner = '';
        if (cols || quran.pages) quran._runs(s, a, w.start, w.end).forEach(function (r) {
          var st = (r.color ? 'color:#' + r.color + ';' : '') + (r.page ? 'font-family:' + pageFamily(r.page) : '');
          inner += st ? '<span style="' + st + '">' + esc(r.t) + '</span>' : esc(r.t);
        }); else inner = esc(w.text);
        html += '<span class="w ' + wordState(a, i) + '" data-a="' + a + '" data-w="' + i + '">' + inner + '</span> ';
      });
      if (sp.mark) {
        var mk = quran.pages ? quran._runs(s, a, text.lastIndexOf(sp.mark), text.length)[0] : null;
        html += '<span class="num"' + (mk && mk.page ? ' style="font-family:' + pageFamily(mk.page) + '"' : '') + '>' + esc(sp.mark) + '</span> ';
      }
    }
    $('preview-ar').innerHTML = html;
    $('reset-words').hidden = !(sel.wordFrom > 0 || sel.wordTo != null);
    var out = current(), o = '<p class="arabic" dir="rtl">' + runsHtml(out.arabic.runs) + '</p>';
    out.paras.forEach(function (p) { o += '<p dir="' + p.dir + '">' + runsHtml(p.runs) + '</p>'; });
    $('out').innerHTML = o;
  }

  /* Word selection: click first word then last word, or drag across words with the mouse. */
  function applyRange(st, en) {
    if (en.a < st.a || (en.a === st.a && en.w < st.w)) { var x = st; st = en; en = x; }
    sel.from = st.a; sel.wordFrom = st.w; sel.to = en.a; sel.wordTo = en.w;
    clickStart = null;
    $('from').value = sel.from; $('to').value = sel.to;
    render();
  }
  function clickWord(a, w) {
    if (clickStart) { applyRange(clickStart, { a: a, w: w }); return; }
    clickStart = { a: a, w: w };
    sel.from = a; sel.wordFrom = w; sel.wordTo = null;
    if (sel.to < a) sel.to = a;
    $('from').value = sel.from; $('to').value = sel.to;
    render();
  }
  var drag = null;
  function wordAt(x, y) {
    var el = document.elementFromPoint(x, y);
    el = el && el.closest ? el.closest('#preview-ar .w') : null;
    return el ? { a: +el.dataset.a, w: +el.dataset.w } : null;
  }
  function paintDrag() {
    var lo = drag.start, hi = drag.end;
    if (hi.a < lo.a || (hi.a === lo.a && hi.w < lo.w)) { var x = lo; lo = hi; hi = x; }
    [].forEach.call($('preview-ar').querySelectorAll('.w'), function (el) {
      var a = +el.dataset.a, w = +el.dataset.w;
      el.classList.toggle('drag', (a > lo.a || (a === lo.a && w >= lo.w)) && (a < hi.a || (a === hi.a && w <= hi.w)));
    });
  }
  $('preview-ar').addEventListener('pointerdown', function (e) {
    if (e.button > 0) return;
    var p = wordAt(e.clientX, e.clientY); if (!p) return;
    e.preventDefault();
    drag = { start: p, end: p, moved: false };
  });
  document.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var p = wordAt(e.clientX, e.clientY);
    if (!p || (p.a === drag.end.a && p.w === drag.end.w)) return;
    drag.end = p; drag.moved = true;
    $('preview-ar').classList.add('dragging');
    paintDrag();
  });
  document.addEventListener('pointerup', function () {
    if (!drag) return;
    var d = drag; drag = null;
    $('preview-ar').classList.remove('dragging');
    if (d.moved) applyRange(d.start, d.end); else clickWord(d.start.a, d.start.w);
  });
  document.addEventListener('pointercancel', function () { drag = null; $('preview-ar').classList.remove('dragging'); render(); });

  /* ---------- output: Word (OOXML), clipboard (HTML + text) ---------- */
  function xmlEsc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  /* every property is set explicitly, so nothing is inherited from the cursor position */
  function runXml(r, font, size, rtl) {
    var f = font ? '<w:rFonts w:ascii="' + xmlEsc(font) + '" w:hAnsi="' + xmlEsc(font) + '" w:cs="' + xmlEsc(font) + '"/>' : '';
    var v = function (on) { return on ? '' : ' w:val="0"'; };
    var c = r.color ? '<w:color w:val="' + r.color + '"/>' : '';
    var sz = size ? '<w:sz w:val="' + Math.round(size * 2) + '"/><w:szCs w:val="' + Math.round(size * 2) + '"/>' : '';
    return '<w:r><w:rPr>' + f + '<w:b' + v(r.bold) + '/><w:bCs' + v(r.bold) + '/><w:i' + v(r.italic) + '/><w:iCs' + v(r.italic) + '/>' +
      c + sz + '<w:rtl' + v(rtl) + '/></w:rPr><w:t xml:space="preserve">' + xmlEsc(r.t) + '</w:t></w:r>';
  }
  function paraXml(p, font, size) {
    var rtl = p.dir === 'rtl';
    return '<w:p><w:pPr><w:bidi' + (rtl ? '' : ' w:val="0"') + '/><w:jc w:val="both"/></w:pPr>' +
      p.runs.map(function (r) { return runXml(r, r.page ? wordFont(r.page) : font, size, rtl); }).join('') + '</w:p>';
  }
  function buildOoxml(out) {
    var body = paraXml(out.arabic, arabicFont(), settings.arSize);
    out.paras.forEach(function (p) { body += paraXml(p, settings.uzFont, settings.uzSize); });
    // Word merges the LAST inserted paragraph into the paragraph at the cursor and gives it
    // that paragraph's properties; an empty last paragraph takes that role.
    body += '<w:p/>';
    return '<pkg:package xmlns:pkg="http://schemas.microsoft.com/office/2006/xmlPackage">' +
      '<pkg:part pkg:name="/_rels/.rels" pkg:contentType="application/vnd.openxmlformats-package.relationships+xml"><pkg:xmlData>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships></pkg:xmlData></pkg:part>' +
      '<pkg:part pkg:name="/word/document.xml" pkg:contentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"><pkg:xmlData>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + body +
      '</w:body></w:document></pkg:xmlData></pkg:part></pkg:package>';
  }
  function buildHtml(out) {
    var ar = '<p dir="rtl" style="text-align:justify;font-family:\'' + esc(arabicFont()) + '\';font-size:' + settings.arSize + 'pt">' +
      runsHtml(out.arabic.runs) + '</p>';
    out.paras.forEach(function (p) {
      ar += '<p dir="' + p.dir + '" style="text-align:justify;' + (settings.uzFont ? "font-family:'" + esc(settings.uzFont) + "';" : '') +
        'font-size:' + settings.uzSize + 'pt">' + runsHtml(p.runs) + '</p>';
    });
    return ar;
  }
  function insertWord(out) {
    return Word.run(function (ctx) {
      var target = ctx.document.getSelection();
      if (settings.newPara) target = target.paragraphs.getLast().insertParagraph('', 'After');
      target.insertOoxml(buildOoxml(out), 'Replace');
      return ctx.sync();
    }).catch(function () {
      return Word.run(function (ctx) {                       // hosts without OOXML support
        var target = ctx.document.getSelection();
        if (settings.newPara) target = target.paragraphs.getLast().insertParagraph('', 'After');
        target.insertHtml(buildHtml(out), 'Replace');
        return ctx.sync();
      });
    });
  }
  function copy(out) {
    var html = buildHtml(out), text = out.text;
    if (navigator.clipboard && window.ClipboardItem) {
      return navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' })
      })]);
    }
    var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
    ta.select(); document.execCommand('copy'); ta.remove();
    return Promise.resolve();
  }
  $('insert').addEventListener('click', function () {
    ensureData().then(function () {
      var out = current();
      return (inWord ? insertWord(out) : copy(out)).then(function () { toast(inWord ? t('inserted') : t('copiedPaste')); });
    }).catch(function (e) { toast(t('error') + ': ' + e.message); });
  });
  $('copy').addEventListener('click', function () {
    ensureData().then(function () { return copy(current()); }).then(function () { toast(t('copied')); })
      .catch(function (e) { toast(t('error') + ': ' + e.message); });
  });

  /* ---------- settings dialog ---------- */
  var B = { withTr: 's-with-tr', withTafsir: 's-with-tf', brackets: 's-brackets', auza: 's-auza', basmala: 's-basmala',
            ref: 's-ref', newPara: 's-newpara', arFont: 's-ar-font', arSize: 's-ar-size', uzFont: 's-uz-font', uzSize: 's-uz-size' };
  /* Group label: English language name (+ native name), e.g. "Russian — Русский" */
  function langLabel(x) {
    var en = x.langEn || x.langName || x.lang || '', nat = x.langName || '';
    return nat && nat !== en ? en + ' — ' + nat : en;
  }
  function checklist(el, items, chosen) {
    var byLang = {}, order = [];
    items.forEach(function (x) {
      var k = langLabel(x);
      if (!byLang[k]) { byLang[k] = []; order.push(k); }
      byLang[k].push(x);
    });
    // languages in alphabetical order ("Other" last)
    order.sort(function (a, b) {
      if (/^Other/.test(a) !== /^Other/.test(b)) return /^Other/.test(a) ? 1 : -1;
      return a.localeCompare(b);
    });
    order.forEach(function (k) { byLang[k].sort(function (a, b) { return (a.name || '').localeCompare(b.name || ''); }); });
    // chosen items on top (in the order they were chosen), then every language alphabetically
    var html = '';
    chosen.map(function (id) { return items.filter(function (x) { return x.id === id; })[0]; }).filter(Boolean)
      .forEach(function (x) { html += item(x, true); });
    order.forEach(function (k) {
      var rest = byLang[k].filter(function (x) { return chosen.indexOf(x.id) < 0; });
      if (!rest.length) return;
      html += '<div class="grp">' + esc(k) + '</div>';
      rest.forEach(function (x) { html += item(x, false); });
    });
    el.innerHTML = html;
    function item(x, on) {
      var label = x.name + (x.author && x.name.indexOf(x.author) < 0 ? ' — ' + x.author : '') +
        (x.partial ? ' (' + x.partial + '/6236)' : '');
      return '<label data-s="' + esc((label + ' ' + langLabel(x) + ' ' + (x.lang || '')).toLowerCase()) + '">' +
        '<input type="checkbox" value="' + esc(x.id) + '"' + (on ? ' checked' : '') + '> <span>' + esc(label) +
        '</span> <span class="lang">' + esc(x.langEn || x.langName || x.lang || '') + '</span></label>';
    }
  }
  function picked(el, before) {
    var now = [].map.call(el.querySelectorAll('input:checked'), function (i) { return i.value; });
    return before.filter(function (id) { return now.indexOf(id) >= 0; }).concat(now.filter(function (id) { return before.indexOf(id) < 0; }));
  }
  [].forEach.call(document.querySelectorAll('.filter'), function (inp) {
    inp.addEventListener('input', function () {
      var q = inp.value.trim().toLowerCase(), list = $(inp.dataset.list);
      [].forEach.call(list.children, function (el) { el.hidden = !!q && (el.classList.contains('grp') || (el.dataset.s || '').indexOf(q) < 0); });
    });
  });
  $('settings-btn').addEventListener('click', function () {
    Object.keys(B).forEach(function (k) {
      var el = $(B[k]); if (el.type === 'checkbox') el.checked = !!settings[k]; else el.value = settings[k];
    });
    $('s-ar-font').placeholder = arabicFont();
    fillScriptSelect();
    checklist($('s-tr-list'), catalog.translations, settings.translations);
    checklist($('s-tf-list'), catalog.tafsirs, settings.tafsirs);
    $('settings').showModal();
  });
  $('settings').addEventListener('close', function () {
    Object.keys(B).forEach(function (k) {
      var el = $(B[k]);
      settings[k] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? +el.value : el.value.trim();
    });
    settings.translations = picked($('s-tr-list'), settings.translations);
    settings.tafsirs = picked($('s-tf-list'), settings.tafsirs);
    var scriptChanged = settings.script !== $('s-script').value;
    settings.script = $('s-script').value;
    saveSettings();
    (scriptChanged ? useScript(settings.script) : Promise.resolve()).then(ensureData).then(function () { render(); });
  });

  /* ---------- surah info ---------- */
  $('info-btn').addEventListener('click', function () {
    var c = i18n.code(), s = sel.sura;
    optional('surah_info/' + c + '.json', null).then(function (d) {
      var fallback = !d || !d[s];
      return (fallback ? optional('surah_info/en.json', {}) : Promise.resolve(d)).then(function (x) {
        var info = x[s] || {};
        $('info-title').innerHTML = esc(uiSuraName(s)) + ' <bdi>' + esc(quran.suras[s - 1][0]) + '</bdi>';
        $('info-note').hidden = !(fallback && c !== 'en');
        $('info-body').innerHTML = safeHtml(info.text || '');
        $('info-body').dir = fallback ? 'ltr' : i18n.dir();
        $('info').showModal();
      });
    });
  });
  function safeHtml(h) {      // keep simple formatting tags only
    return String(h).replace(/<(\/?)(\w+)[^>]*>/g, function (m, close, tag) {
      return /^(h[1-6]|p|ul|ol|li|b|strong|i|em|br|blockquote|span)$/i.test(tag) ? '<' + close + tag.toLowerCase() + '>' : '';
    });
  }

  /* ---------- init ---------- */
  function init() {
    applyI18n();
    Promise.all([getJSON('quran.json'), optional('catalog.json', null), optional('suras.json', {})]).then(function (r) {
      var data = r[0], cat = r[1], names = r[2];
      quran = new QuranCore.Quran(data);
      suraNames = names || {};
      Object.keys(suraNames).forEach(function (k) { quran.addSuraNames(suraNames[k].simple); });
      // local (Uzbek) resources from quran.json, plus QUL resources from catalog.json
      data.meta.translations.forEach(function (x) {
        var item = { id: x.id, name: x.name, lang: 'uz', langName: 'Ўзбекча', langEn: 'Uzbek', dir: 'ltr', file: 'tr/' + x.id + '.json', format: 'array' };
        (x.kind === 'tafsir' ? catalog.tafsirs : catalog.translations).push(item);
      });
      catalog.scripts.push({ id: 'default', nameKey: 'script.default', ayahs: data.ayahs, source: data.meta.source,
                             font: { family: 'Scheherazade New' } });
      if (cat) {
        catalog.translations = catalog.translations.concat(cat.translations || []);
        catalog.tafsirs = catalog.tafsirs.concat(cat.tafsirs || []);
        catalog.scripts = catalog.scripts.concat(cat.scripts || []);
        catalog.languages = cat.languages || {};
      }
      fillSuraSelect(); fillScriptSelect();
      $('status').textContent = '';
      return useScript(settings.script);
    }).then(function () {
      setSel(1, 1, 1);
      setTimeout(function () { quran._buildIndex(); }, 50);
    }).catch(function (e) { $('status').textContent = t('error') + ': ' + e.message; });
  }

  if (window.Office && Office.onReady) {
    Office.onReady(function (info) {
      inWord = info && info.host === Office.HostType.Word;
      if (inWord) { document.body.classList.add('office'); $('host-badge').hidden = false; }
    });
  }
  init();
})();
