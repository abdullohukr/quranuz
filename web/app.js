/* UI for the website and the Word add-in task pane. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var DEFAULTS = {
    translation: 'alovuddin_mansur', withTr: true, brackets: true, newPara: true,
    arFont: 'Scheherazade New', arSize: 18, uzFont: '', uzSize: 14
  };
  var settings = load();
  var quran, translations = {}, sel = { sura: 1, from: 1, to: 1, wordFrom: 0, wordTo: null };
  var clickStart = null, inWord = false, results = [];

  function load() {
    try {
      var st = Object.assign({}, DEFAULTS, JSON.parse(localStorage.getItem('quranuz-settings') || '{}'));
      // KFGQPC fonts expect another encoding (ی shows as a dot, ۝ doubles) - switch old default
      if (/KFGQPC/i.test(st.arFont)) st.arFont = DEFAULTS.arFont;
      return st;
    }
    catch (e) { return Object.assign({}, DEFAULTS); }
  }
  function save() { try { localStorage.setItem('quranuz-settings', JSON.stringify(settings)); } catch (e) {} }
  function toast(msg) {
    var t = $('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function getTranslation(id) {
    if (translations[id]) return Promise.resolve(translations[id]);
    return fetch('data/tr/' + id + '.json').then(function (r) { return r.json(); })
      .then(function (d) { translations[id] = d; return d; });
  }
  function currentTr() { return translations[settings.translation] || null; }

  /* ---------- search ---------- */
  function runSearch() {
    var q = $('q').value;
    var ref = q.trim() && quran.parseRef(q);
    if (ref) { setSel(ref.sura, ref.from, ref.to); }
    results = quran.search(q, currentTr(), 200);
    var list = $('results'); list.innerHTML = '';
    $('status').textContent = q.trim() ? (results.length ? results.length + ' та натижа' : 'Топилмади') : '';
    var tr = currentTr();
    results.slice(0, 200).forEach(function (r, i) {
      var li = document.createElement('li');
      li.dataset.i = i;
      li.innerHTML = '<div class="ref">' + esc(quran.suras[r.sura - 1][1]) + ' <bdi>' + r.sura + ':' + r.aya +
        '</bdi> · <bdi>' + esc(quran.suras[r.sura - 1][0]) + '</bdi></div><div class="ar">' + esc(quran.text(r.sura, r.aya)) + '</div>' +
        (tr ? '<div class="small muted">' + esc(tr[quran.index(r.sura, r.aya)].slice(0, 140)) + '…</div>' : '');
      list.appendChild(li);
    });
  }
  var searchTimer;
  $('q').addEventListener('input', function () { clearTimeout(searchTimer); searchTimer = setTimeout(runSearch, 200); });
  $('q').addEventListener('keydown', function (e) { if (e.key === 'Enter') { clearTimeout(searchTimer); runSearch(); } });
  $('results').addEventListener('click', function (e) {
    var li = e.target.closest('li'); if (!li) return;
    var r = results[+li.dataset.i];
    // shift-click extends the range inside the same sura
    if (e.shiftKey && r.sura === sel.sura) setSel(r.sura, Math.min(sel.from, r.aya), Math.max(sel.to, r.aya));
    else setSel(r.sura, r.aya, r.aya);
    [].forEach.call($('results').children, function (x) { x.classList.toggle('active', x === li); });
  });

  /* ---------- selection ---------- */
  function setSel(sura, from, to) {
    var c = quran.count(sura);
    from = Math.min(Math.max(1, from | 0), c); to = Math.min(Math.max(from, to | 0), c);
    sel = { sura: sura, from: from, to: to, wordFrom: 0, wordTo: null };
    clickStart = null;
    $('sura').value = sura; $('from').max = c; $('to').max = c; $('from').value = from; $('to').value = to;
    render();
  }
  $('sura').addEventListener('change', function () { setSel(+this.value, 1, 1); });
  $('from').addEventListener('change', function () {
    if (+this.value !== sel.from) setSel(sel.sura, +this.value, Math.max(+this.value, sel.to));
  });
  $('to').addEventListener('change', function () { if (+this.value !== sel.to) setSel(sel.sura, sel.from, +this.value); });
  $('reset-words').addEventListener('click', function () { setSel(sel.sura, sel.from, sel.to); });

  function wordState(a, w, n) {
    if (a === sel.from && w < sel.wordFrom) return 'off';
    if (a === sel.to && sel.wordTo != null && w > sel.wordTo) return 'off';
    if (clickStart && clickStart.a === a && clickStart.w === w) return 'start';
    return '';
  }

  function render() {
    var s = sel.sura;
    $('sel-title').innerHTML = esc(quran.suras[s - 1][1]) + ' <bdi>' + esc(quran.suras[s - 1][0]) + '</bdi> <bdi>' + s + ':' +
      (sel.to > sel.from ? sel.from + '-' + sel.to : sel.from) + '</bdi>';
    var html = '';
    if (sel.from === 1 && s !== 1 && s !== 9) html += '<div class="muted" style="text-align:center">' + quran.meta.basmala + '</div>';
    for (var a = sel.from; a <= sel.to; a++) {
      var words = quran.words(s, a), full = quran.text(s, a);
      words.forEach(function (w, i) {
        html += '<span class="w ' + wordState(a, i, words.length) + '" data-a="' + a + '" data-w="' + i + '">' + esc(w) + '</span> ';
      });
      html += '<span class="num">' + esc(full.match(/۝[٠-٩]+ *$/)[0]) + '</span> ';
    }
    $('preview-ar').innerHTML = html;
    $('reset-words').hidden = !(sel.wordFrom > 0 || sel.wordTo != null);
    var out = quran.format(sel, { brackets: settings.brackets, translation: settings.withTr ? currentTr() : null });
    $('out-ar').textContent = out.arabic;
    $('out-uz').innerHTML = out.translation ? partsHtml(out.translationParts) : '';
    $('out-ar').style.fontFamily = settings.arFont ? "'" + settings.arFont + "', var(--ar-font)" : '';
  }

  $('preview-ar').addEventListener('click', function (e) {
    var el = e.target.closest('.w'); if (!el) return;
    var a = +el.dataset.a, w = +el.dataset.w;
    if (!clickStart) {
      clickStart = { a: a, w: w };
      sel.from = a; sel.wordFrom = w; sel.wordTo = null;
      if (sel.to < a) sel.to = a;
    } else {
      var st = clickStart, en = { a: a, w: w };
      if (en.a < st.a || (en.a === st.a && en.w < st.w)) { var t = st; st = en; en = t; }
      sel.from = st.a; sel.wordFrom = st.w; sel.to = en.a; sel.wordTo = en.w;
      clickStart = null;
    }
    $('from').value = sel.from; $('to').value = sel.to;
    render();
  });

  /* ---------- output ---------- */
  function current() {
    return quran.format(sel, { brackets: settings.brackets, translation: settings.withTr ? currentTr() : null });
  }

  function xmlEsc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  /* fmt = {bold, italic}; set explicitly on/off so nothing is inherited from the cursor position */
  function runXml(text, font, size, rtl, fmt) {
    var f = font ? '<w:rFonts w:ascii="' + xmlEsc(font) + '" w:hAnsi="' + xmlEsc(font) + '" w:cs="' + xmlEsc(font) + '"/>' : '';
    var v = function (on) { return on ? '' : ' w:val="0"'; };
    var bi = '<w:b' + v(fmt.bold) + '/><w:bCs' + v(fmt.bold) + '/><w:i' + v(fmt.italic) + '/><w:iCs' + v(fmt.italic) + '/>';
    var sz = size ? '<w:sz w:val="' + Math.round(size * 2) + '"/><w:szCs w:val="' + Math.round(size * 2) + '"/>' : '';
    return '<w:r><w:rPr>' + f + bi + sz + (rtl ? '<w:rtl/>' : '') + '</w:rPr><w:t xml:space="preserve">' + xmlEsc(text) + '</w:t></w:r>';
  }
  function buildOoxml(out) {
    var body = '<w:p><w:pPr><w:bidi/><w:jc w:val="both"/></w:pPr>' +
      runXml(out.arabic, settings.arFont, settings.arSize, true, { bold: true, italic: false }) + '</w:p>';
    if (out.translation)
      body += '<w:p><w:pPr><w:jc w:val="both"/></w:pPr>' + out.translationParts.map(function (p) {
        return runXml(p.text, settings.uzFont, settings.uzSize, false, p);
      }).join('') + '</w:p>';
    return '<pkg:package xmlns:pkg="http://schemas.microsoft.com/office/2006/xmlPackage">' +
      '<pkg:part pkg:name="/_rels/.rels" pkg:contentType="application/vnd.openxmlformats-package.relationships+xml"><pkg:xmlData>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships></pkg:xmlData></pkg:part>' +
      '<pkg:part pkg:name="/word/document.xml" pkg:contentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"><pkg:xmlData>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + body +
      '</w:body></w:document></pkg:xmlData></pkg:part></pkg:package>';
  }
  function partsHtml(parts) {
    return parts.map(function (p) {
      return '<span style="font-weight:' + (p.bold ? 'bold' : 'normal') + ';font-style:' + (p.italic ? 'italic' : 'normal') + '">' + esc(p.text) + '</span>';
    }).join('');
  }
  function buildHtml(out) {
    var ar = '<p dir="rtl" style="text-align:justify;font-weight:bold;' + (settings.arFont ? "font-family:'" + esc(settings.arFont) + "';" : '') +
      'font-size:' + settings.arSize + 'pt">' + esc(out.arabic) + '</p>';
    var uz = out.translation ? '<p style="text-align:justify;' + (settings.uzFont ? "font-family:'" + esc(settings.uzFont) + "';" : '') +
      'font-size:' + settings.uzSize + 'pt">' + partsHtml(out.translationParts) + '</p>' : '';
    return ar + uz;
  }
  function plain(out) { return out.arabic + (out.translation ? '\n' + out.translation : ''); }

  function insertWord(out) {
    return Word.run(function (ctx) {
      var target = ctx.document.getSelection();
      if (settings.newPara) target = target.paragraphs.getLast().insertParagraph('', 'After');
      target.insertOoxml(buildOoxml(out), 'Replace');
      return ctx.sync();
    }).catch(function () {
      // fallback for hosts without OOXML support
      return Word.run(function (ctx) {
        var target = ctx.document.getSelection();
        if (settings.newPara) target = target.paragraphs.getLast().insertParagraph('', 'After');
        target.insertHtml(buildHtml(out), 'Replace');
        return ctx.sync();
      });
    });
  }

  function copy(out) {
    var html = buildHtml(out), text = plain(out);
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
    var out = current();
    (inWord ? insertWord(out) : copy(out))
      .then(function () { toast(inWord ? 'Қўйилди' : 'Нусха олинди — исталган жойга қўйинг (Ctrl+V)'); })
      .catch(function (e) { toast('Хато: ' + e.message); });
  });
  $('copy').addEventListener('click', function () {
    copy(current()).then(function () { toast('Нусха олинди'); }).catch(function (e) { toast('Хато: ' + e.message); });
  });

  /* ---------- settings ---------- */
  var S = { translation: 's-translation', withTr: 's-with-tr', brackets: 's-brackets', newPara: 's-newpara',
            arFont: 's-ar-font', arSize: 's-ar-size', uzFont: 's-uz-font', uzSize: 's-uz-size' };
  $('settings-btn').addEventListener('click', function () {
    Object.keys(S).forEach(function (k) {
      var el = $(S[k]); if (el.type === 'checkbox') el.checked = !!settings[k]; else el.value = settings[k];
    });
    $('settings').showModal();
  });
  $('settings').addEventListener('close', function () {
    Object.keys(S).forEach(function (k) {
      var el = $(S[k]);
      settings[k] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? +el.value : el.value;
    });
    save();
    getTranslation(settings.translation).then(function () { render(); });
  });

  /* ---------- init ---------- */
  function init() {
    fetch('data/quran.json').then(function (r) { return r.json(); }).then(function (data) {
      quran = new QuranCore.Quran(data);
      $('sura').innerHTML = data.suras.map(function (s, i) {
        return '<option value="' + (i + 1) + '">' + (i + 1) + '. ' + esc(s[1]) + ' — ' + esc(s[0]) + '</option>';
      }).join('');
      $('s-translation').innerHTML = data.meta.translations.map(function (t) {
        return '<option value="' + t.id + '">' + esc(t.name) + (t.kind === 'tafsir' ? ' (тафсир)' : '') + '</option>';
      }).join('');
      $('source').textContent = 'Араб матни манбаси: ' + data.meta.source;
      $('status').textContent = '';
      setSel(1, 1, 1);
      return getTranslation(settings.translation);
    }).then(function () { render(); setTimeout(function () { quran._buildIndex(); }, 50); })
      .catch(function (e) { $('status').textContent = 'Маълумот юкланмади: ' + e.message; });
  }

  if (window.Office && Office.onReady) {
    Office.onReady(function (info) {
      inWord = info && info.host === Office.HostType.Word;
      if (inWord) { document.body.classList.add('office'); $('host-badge').hidden = false; }
    });
  }
  init();
})();
