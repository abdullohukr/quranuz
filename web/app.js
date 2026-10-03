/* MyQuran: UI for the website and the Word add-in task pane. */
(function () {
  'use strict';
  var V = '5';
  var $ = function (id) { return document.getElementById(id); };
  var DEFAULTS = {
    uiLang: 'uz', script: 'default',
    withTr: true, translations: ['alovuddin_mansur'],
    withTafsir: false, tafsirs: [],
    brackets: true, auza: false, basmala: false, ref: false, trRef: true, newPara: true,
    arFont: '', arSize: 18, arBold: false, uzFont: '', uzSize: 14,
    auzaFont: '', auzaSize: 0, basmalaFont: '', basmalaSize: 0, refFont: '', refSize: 0    // 0 / '': automatic
  };
  var QUOTES = { en: ['“', '”'], tr: ['“', '”'], id: ['“', '”'], ms: ['“', '”'], az: ['“', '”'], zh: ['“', '”'],
                 ja: ['「', '」'], ko: ['“', '”'], de: ['„', '“'], nl: ['„', '”'], it: ['«', '»'] };
  var settings = loadSettings(), i18n = new I18n(settings.uiLang);
  var quran, catalog = { translations: [], tafsirs: [], scripts: [] }, suraNames = {}, surahInfo = {}, langNames = {};
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
    fixFont(st);
    return st;
  }
  /* The tafsir.one text is not encoded for KFGQPC fonts (ی, ۝ + digits): in KFGQPC it shows dots
     and double circles. Asking for KFGQPC therefore selects the Quran Library Hafs mushaf, whose
     text is made for that font (the Hafs mushafs already use it).                              */
  function fixFont(st) {
    if (!/KFGQPC|Uthmanic/i.test(st.arFont || '')) return;
    if (!/^text_qpc_hafs/.test(st.script)) st.script = 'text_qpc_hafs';
    st.arFont = '';
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
  ['ui-lang', 's-ui-lang'].forEach(function (id) {
    $(id).innerHTML = I18n.languages.map(function (l) { return '<option value="' + l.id + '">' + esc(l.name) + '</option>'; }).join('');
    $(id).value = settings.uiLang;
    $(id).addEventListener('change', function () { setUiLang(this.value); });
  });
  function setUiLang(lang) {
    settings.uiLang = lang; i18n.set(lang); saveSettings();
    $('ui-lang').value = $('s-ui-lang').value = lang;
    applyI18n(); fillSuraSelect(); fillScriptSelect(); render(); if (results.length) runSearch();
    if ($('settings').open) {                        // language names in the lists follow the interface
      checklist($('s-tr-list'), catalog.translations, settings.translations);
      checklist($('s-tf-list'), catalog.tafsirs, settings.tafsirs);
      syncLists();
      [].forEach.call(document.querySelectorAll('.filter'), function (f) { f.dispatchEvent(new Event('input')); });
    }
  }

  /* Help: a separate page, opened in the browser (from Word too) */
  $('help-btn').addEventListener('click', function () {
    var url = new URL('help.html?lang=' + settings.uiLang, location.href).href;
    try {
      if (inWord && Office.context.ui.openBrowserWindow) { Office.context.ui.openBrowserWindow(url); return; }
    } catch (e) {}
    window.open(url, '_blank');
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
  /* Russian surah names (Cyrillic languages without their own list use them) */
  var RU_NAMES = ('Аль-Фатиха|Аль-Бакара|Аль Имран|Ан-Ниса|Аль-Маида|Аль-Анам|Аль-Араф|Аль-Анфаль|Ат-Тауба|Юнус|Худ|Юсуф|' +
    'Ар-Раад|Ибрахим|Аль-Хиджр|Ан-Нахль|Аль-Исра|Аль-Кахф|Марьям|Та Ха|Аль-Анбия|Аль-Хадж|Аль-Муминун|Ан-Нур|Аль-Фуркан|' +
    'Аш-Шуара|Ан-Намль|Аль-Касас|Аль-Анкабут|Ар-Рум|Лукман|Ас-Саджда|Аль-Ахзаб|Саба|Фатыр|Йа Син|Ас-Саффат|Сад|Аз-Зумар|' +
    'Гафир|Фуссилат|Аш-Шура|Аз-Зухруф|Ад-Духан|Аль-Джасия|Аль-Ахкаф|Мухаммад|Аль-Фатх|Аль-Худжурат|Каф|Аз-Зарият|Ат-Тур|' +
    'Ан-Наджм|Аль-Камар|Ар-Рахман|Аль-Вакиа|Аль-Хадид|Аль-Муджадила|Аль-Хашр|Аль-Мумтахана|Ас-Сафф|Аль-Джумуа|' +
    'Аль-Мунафикун|Ат-Тагабун|Ат-Талак|Ат-Тахрим|Аль-Мульк|Аль-Калам|Аль-Хакка|Аль-Мааридж|Нух|Аль-Джинн|Аль-Муззаммиль|' +
    'Аль-Муддассир|Аль-Кияма|Аль-Инсан|Аль-Мурсалят|Ан-Наба|Ан-Назиат|Абаса|Ат-Таквир|Аль-Инфитар|Аль-Мутаффифин|' +
    'Аль-Иншикак|Аль-Бурудж|Ат-Тарик|Аль-Аля|Аль-Гашия|Аль-Фаджр|Аль-Балад|Аш-Шамс|Аль-Лейль|Ад-Духа|Аш-Шарх|Ат-Тин|' +
    'Аль-Алак|Аль-Кадр|Аль-Баййина|Аз-Зальзаля|Аль-Адият|Аль-Кариа|Ат-Такасур|Аль-Аср|Аль-Хумаза|Аль-Филь|Курайш|' +
    'Аль-Маун|Аль-Каусар|Аль-Кафирун|Ан-Наср|Аль-Масад|Аль-Ихлас|Аль-Фаляк|Ан-Нас').split('|');
  function scriptOf(text) {                                       // 'arab' | 'cyrl' | 'latn' | '' (by letters)
    var s = QuranCore.stripHtml(text || '').slice(0, 400);
    var ar = (s.match(/[\u0600-\u06FF]/g) || []).length, cy = (s.match(/[\u0400-\u04FF]/g) || []).length,
        la = (s.match(/[A-Za-z\u00C0-\u024F]/g) || []).length, max = Math.max(ar, cy, la);
    return !max ? '' : max === ar ? 'arab' : max === cy ? 'cyrl' : 'latn';
  }
  /* Name of sura i (1-based) for a reference: the language's own names if we have them, otherwise
     in the script of the text: Arabic script -> Arabic, Cyrillic -> Cyrillic, else Latin. */
  function suraName(i, lang, sample) {
    var sc = scriptOf(sample) || ((catalog.languages && catalog.languages[lang] || {}).dir === 'rtl' ? 'arab' : '');
    if (lang === 'uz' && sc !== 'latn') return quran.suras[i - 1][1];
    if (lang === 'ru' || (sc === 'cyrl' && lang !== 'uz')) return RU_NAMES[i - 1];
    if (sc === 'arab') return quran.suras[i - 1][0];
    var n = suraNames.en && suraNames.en.simple;
    return n ? n[i - 1] : quran.suras[i - 1][0];
  }
  function uiSuraName(i) {
    var c = i18n.code();
    if (c === 'uz' && settings.uiLang !== 'uz_latn') return quran.suras[i - 1][1];
    if (c === 'ar' || c === 'fa' || c === 'ur') return quran.suras[i - 1][0];
    if (c === 'ru' || c === 'kk' || c === 'ky' || c === 'tg') return RU_NAMES[i - 1];
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
  var PLAIN_AR = 'Scheherazade New';     // A'udhu and the [sura n] reference: ordinary Arabic, not a Mushaf font
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
        esc(quran.suras[r.sura - 1][0]) + '</bdi></div><div class="ar" dir="rtl">' + ayahHtml(r.sura, r.aya) + '</div>' +
        (settings.withTr && first ? '<div class="small muted" dir="' + (first.dir || 'auto') + '">' +
          esc(QuranCore.stripHtml(first.data[quran.index(r.sura, r.aya)]).slice(0, 160)) + '…</div>' : '');
      list.appendChild(li);
    });
  }
  /* an ayah in the chosen mushaf (page fonts, tajweed colours) */
  function ayahHtml(s, a) {
    var t = quran.text(s, a);
    if (!quran.pages && !quran.colors) return esc(t);
    return quran._runs(s, a, 0, t.length).map(function (r) {
      var st = (r.color ? 'color:#' + r.color + ';' : '') + (r.page ? 'font-family:' + pageFamily(r.page) : '');
      return st ? '<span style="' + st + '">' + esc(r.t) + '</span>' : esc(r.t);
    }).join('');
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
    var sc = scriptById(settings.script);
    return quran.format(sel, {
      brackets: settings.brackets, auza: settings.auza, basmala: settings.basmala, ref: settings.ref, trRef: settings.trRef,
      bold: settings.arBold,
      // a font chosen for the basmala needs Unicode text (the QPC page mushafs have glyph codes)
      basmalaText: settings.basmalaFont && sc.glyph ? QuranCore.BASMALA : null,
      translations: settings.withTr ? activeTranslations().filter(function (x) { return x.data; }).map(function (x) {
        return { data: x.data, dir: x.dir, quotes: QUOTES[x.lang] || ['«', '»'],
                 suraName: suraName(sel.sura, x.lang, x.data[quran.index(sel.sura, sel.from)]) };
      }) : [],
      tafsirs: settings.withTafsir ? activeTafsirs().map(function (tf) {
        var get = tafsirGetter(tf), first = get(sel.sura, sel.from);
        return { name: tf.name, dir: tf.dir, quotes: QUOTES[tf.lang] || ['«', '»'],
                 suraName: suraName(sel.sura, tf.lang, first && first.text), get: get };
      }) : []
    });
  }
  /* font and size of an Arabic run (A'udhu, basmala and the reference can have their own) */
  function runFont(r, font) {
    if (r.role === 'auza') return settings.auzaFont || PLAIN_AR;
    if (r.role === 'ref') return settings.refFont || PLAIN_AR;
    if (r.role === 'basmala' && settings.basmalaFont) return settings.basmalaFont;
    if (r.page) return wordFont(r.page);
    return r.plain ? PLAIN_AR : font;
  }
  function runSize(r) {
    var base = +settings.arSize || 18;
    if (r.role === 'auza') return +settings.auzaSize || base;
    if (r.role === 'basmala') return +settings.basmalaSize || base;
    if (r.role === 'ref') return +settings.refSize || Math.round(base * 0.7);
    return base;
  }

  /* pt: font sizes in points (clipboard); otherwise relative to the paragraph (preview) */
  function runsHtml(runs, pt) {
    var base = +settings.arSize || 18;
    return runs.map(function (r) {
      var st = 'font-weight:' + (r.bold ? 'bold' : 'normal') + ';font-style:' + (r.italic ? 'italic' : 'normal') + (r.color ? ';color:#' + r.color : '');
      if (r.role || r.plain || r.page) {
        var f = runFont(r, arabicFont());
        st += ';font-family:' + (r.page && f === wordFont(r.page) ? pageFamily(r.page) : "'" + esc(f) + "','QuranUz Arabic'");
        var size = runSize(r);
        if (size !== base) st += ';font-size:' + (pt ? size + 'pt' : (size / base).toFixed(3) + 'em');
      }
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
  function paraXml(p, font, size, arabic) {
    var rtl = p.dir === 'rtl';
    return '<w:p><w:pPr><w:bidi' + (rtl ? '' : ' w:val="0"') + '/><w:jc w:val="both"/></w:pPr>' +
      p.runs.map(function (r) { return arabic ? runXml(r, runFont(r, font), runSize(r), rtl) : runXml(r, font, size, rtl); }).join('') + '</w:p>';
  }
  function buildOoxml(out) {
    var body = paraXml(out.arabic, arabicFont(), settings.arSize, true);
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
      runsHtml(out.arabic.runs, true) + '</p>';
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
            ref: 's-ref', trRef: 's-tr-ref', newPara: 's-newpara', arFont: 's-ar-font', arSize: 's-ar-size', arBold: 's-ar-bold',
            uzFont: 's-uz-font', uzSize: 's-uz-size', auzaFont: 's-auza-font', auzaSize: 's-auza-size',
            basmalaFont: 's-basmala-font', basmalaSize: 's-basmala-size', refFont: 's-ref-font', refSize: 's-ref-size' };
  /* Group label in the interface language + the native name: "Турк тили (Türkçe)" */
  function langLabel(x) {
    var ui = langNames.ui && langNames.ui[settings.uiLang] || {};
    var loc = ui[x.lang] || x.langEn || x.langName || x.lang || '';
    var nat = langNames.native && langNames.native[x.lang] || x.langName || '';
    return nat && nat.toLowerCase() !== loc.toLowerCase() ? loc + ' (' + nat + ')' : loc;
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
      html += '<div class="grp" data-g="' + esc(k) + '">' + esc(k) + '</div>';
      rest.forEach(function (x) { html += item(x, false); });
    });
    el.innerHTML = html;
    function item(x, on) {
      var label = x.name + (x.author && x.name.indexOf(x.author) < 0 ? ' — ' + x.author : '') +
        (x.partial ? ' (' + x.partial + '/6236)' : '');
      var lang = langLabel(x);
      return '<label data-g="' + esc(on ? '' : lang) + '" data-s="' + esc([label, lang, x.langEn, x.langName, x.lang].join(' ').toLowerCase()) + '">' +
        '<input type="checkbox" value="' + esc(x.id) + '"' + (on ? ' checked' : '') + '> <span>' + esc(label) +
        '</span> <span class="lang">' + esc(lang) + '</span></label>';
    }
  }
  function picked(el, before) {
    var now = [].map.call(el.querySelectorAll('input:checked'), function (i) { return i.value; });
    return before.filter(function (id) { return now.indexOf(id) >= 0; }).concat(now.filter(function (id) { return before.indexOf(id) < 0; }));
  }
  [].forEach.call(document.querySelectorAll('.filter'), function (inp) {
    inp.addEventListener('input', function () {
      var q = inp.value.trim().toLowerCase(), list = $(inp.dataset.list), groups = {};
      [].forEach.call(list.querySelectorAll('label'), function (el) {
        el.hidden = !!q && (el.dataset.s || '').indexOf(q) < 0;
        if (!el.hidden) groups[el.dataset.g] = 1;
      });
      [].forEach.call(list.querySelectorAll('.grp'), function (el) { el.hidden = !!q && !groups[el.dataset.g]; });
    });
  });
  $('settings-btn').addEventListener('click', function () {
    Object.keys(B).forEach(function (k) {
      var el = $(B[k]); if (el.type === 'checkbox') el.checked = !!settings[k]; else el.value = settings[k] || '';
    });
    $('s-ar-font').placeholder = arabicFont();
    $('s-ar-font').dataset.was = settings.arFont;
    $('s-ref-size').placeholder = Math.round((+settings.arSize || 18) * 0.7);
    $('s-auza-size').placeholder = $('s-basmala-size').placeholder = +settings.arSize || 18;
    fillScriptSelect();
    $('s-ui-lang').value = settings.uiLang;
    [].forEach.call(document.querySelectorAll('.filter'), function (f) { f.value = ''; });
    checklist($('s-tr-list'), catalog.translations, settings.translations);
    checklist($('s-tf-list'), catalog.tafsirs, settings.tafsirs);
    syncLists();
    $('settings').showModal();
  });
  /* Settings are applied on every change and on Save: the dialog's "close" event is not fired in
     every WebView (it never came in the Word task pane, so nothing was saved). */
  var applyTimer;
  function applyLater() { clearTimeout(applyTimer); applyTimer = setTimeout(applySettings, 150); }
  /* The "add translation / tafsir" switch follows its list: picking an item turns it on, unpicking
     the last one turns it off (otherwise picked translations were silently not inserted). */
  [['s-tr-list', 's-with-tr'], ['s-tf-list', 's-with-tf']].forEach(function (x) {
    $(x[0]).addEventListener('change', function (e) {
      if (e.target.type !== 'checkbox') return;
      $(x[1]).checked = !!$(x[0]).querySelector('input:checked');
      syncLists();
    });
    $(x[1]).addEventListener('change', syncLists);
  });
  function syncLists() {
    $('s-tr-list').classList.toggle('off', !$('s-with-tr').checked);
    $('s-tf-list').classList.toggle('off', !$('s-with-tf').checked);
  }
  $('settings').addEventListener('change', function (e) {
    if (!e.target.classList.contains('filter') && e.target.id !== 's-ui-lang') applyLater();
  });
  $('settings').addEventListener('submit', function () { clearTimeout(applyTimer); applySettings(); });
  $('settings').addEventListener('close', function () { clearTimeout(applyTimer); applySettings(); });
  function applySettings() {
    Object.keys(B).forEach(function (k) {
      var el = $(B[k]);
      settings[k] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? +el.value || (DEFAULTS[k] || 0) : el.value.trim();
    });
    settings.translations = picked($('s-tr-list'), settings.translations);
    settings.tafsirs = picked($('s-tf-list'), settings.tafsirs);
    var scriptChanged = settings.script !== $('s-script').value;
    settings.script = $('s-script').value;
    if (scriptChanged && settings.arFont === $('s-ar-font').dataset.was) settings.arFont = '';   // font follows the mushaf
    var before = settings.script;
    fixFont(settings);
    if (settings.script !== before) scriptChanged = true;
    saveSettings();
    (scriptChanged ? useScript(settings.script) : Promise.resolve()).then(ensureData).then(function () { render(); if (results.length) runSearch(); });
  }

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
    Promise.all([getJSON('quran.json'), optional('catalog.json', null), optional('suras.json', {}), optional('langnames.json', {})]).then(function (r) {
      var data = r[0], cat = r[1], names = r[2];
      langNames = r[3] || {};
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

  /* Word for Mac serves the task pane from its WebKit cache without asking the server, so after an
     update it kept showing the old version. version.json is read past the cache; when the site has
     a newer version the page reloads at a new address (index.html?v=N), which nothing has cached. */
  function checkVersion() {
    var meta = document.querySelector('meta[name="myquran-version"]'), mine = meta && meta.content;
    if (!mine || !window.fetch) return;
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      if (!d || !d.v || d.v === mine) return;
      try { if (sessionStorage.getItem('myquran-reload') === d.v) return; sessionStorage.setItem('myquran-reload', d.v); } catch (e) {}
      location.replace(location.pathname + '?v=' + encodeURIComponent(d.v) + location.hash);
    }).catch(function () {});
  }
  checkVersion();

  if (window.Office && Office.onReady) {
    Office.onReady(function (info) {
      inWord = info && info.host === Office.HostType.Word;
      if (inWord) { document.body.classList.add('office'); $('host-badge').hidden = false; }
    });
  }
  init();
})();
