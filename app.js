/* Khatt al-Quran: UI for the website and the Word add-in task pane. */
(function () {
  'use strict';
  var V = '5';
  var $ = function (id) { return document.getElementById(id); };
  var DEFAULTS = {
    uiLang: 'uz', script: 'default', theme: 'auto', tab: 'general',
    withTr: true, translations: ['alovuddin_mansur'],
    withTafsir: false, tafsirs: [],
    brackets: true, auza: false, basmala: false, ref: false, trRef: true, newPara: true,
    ayahNums: true, hizb: true, sajda: true, waqf: true,
    arFont: '', arSize: 18, arBold: false, uzFont: '', uzSize: 14, arText: false,
    picBgOn: false, picBg: '#ffffff',                  // the Arabic as a picture: transparent unless a background is switched on
    extInsert: 'ask',                                  // browser extension, editors on web pages: 'ask' | 'text' | 'picture'
    votd: true,                                        // the "Ayah of the day" card at the top
    votdClose: 'ask',                                  // its cross: 'ask' | 'day' (hide until tomorrow) | 'off' (turn it off)
    markAyahs: false,                                  // Word: every inserted ayah goes into a content control, so "Update all ayahs" can find it
    picAction: 'ask',                                  // the picture button in Word: 'ask' | 'insert' | 'copy'
    searchScope: 'default',                            // search in every language: 'default' | 'selected' | 'all'
    auzaFont: '', auzaSize: 0, basmalaFont: '', basmalaSize: 0, refFont: '', refSize: 0    // 0 / '': automatic
  };
  var QUOTES = { en: ['“', '”'], tr: ['“', '”'], id: ['“', '”'], ms: ['“', '”'], az: ['“', '”'], zh: ['“', '”'],
                 ja: ['「', '」'], ko: ['“', '”'], de: ['„', '“'], nl: ['„', '”'], it: ['«', '»'] };
  var fontWas = '', firstRun = false, settings = loadSettings(), i18n = new I18n(settings.uiLang);
  var quran, catalog = { translations: [], tafsirs: [], scripts: [] }, suraNames = {}, nativeNames = {}, surahInfo = {}, langNames = {};
  var cache = {}, sel = { sura: 1, from: 1, to: 1, wordFrom: 0, wordTo: null };
  /* ?host=gdocs | wp | ext: the panel inside Google Docs, WordPress or the browser extension (see sendToHost).
     ?host=adobe: InDesign / InCopy / Photoshop / Premiere (adobe/uxp: a <webview>, not a frame, so window.parent is
     the page itself and the way out is window.uxpHost) or a CEP panel (an iframe). Fonts installed on the computer
     work there, so the QPC page mushafs stay and online is false. */
  var HOST = (location.search.match(/[?&]host=(gdocs|wp|ext|adobe)\b/) || [])[1] || '';
  if (window.parent === window && HOST !== 'adobe') HOST = '';
  var ADOBE = HOST === 'adobe';
  var clickStart = null, inWord = false, online = !!HOST && !ADOBE, windows = /Win/.test(navigator.platform || ''), results = [];
  var t = function (k, v) { return i18n.t(k, v); };
  /* host=ext: only the extension's own page (chrome-extension:// …) is a parent that counts; its origin is learnt from its
     first message and is the only address the panel sends to (the history and favourites never go out with '*') */
  var extOrigin = '';
  function fromExt(e) {
    if (HOST !== 'ext') return true;
    if (!/^(chrome|moz|safari-web)-extension:\/\//.test(e.origin || '') || (extOrigin && e.origin !== extOrigin)) return false;
    extOrigin = e.origin; return true;
  }
  function toParent(msg) {
    if (HOST !== 'ext') { window.parent.postMessage(msg, '*'); return true; }
    if (extOrigin) { window.parent.postMessage(msg, extOrigin); return true; }
    if (msg.type === 'khatt-ready') { window.parent.postMessage(msg, '*'); return true; }     // nothing in it
    return false;
  }

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
      else firstRun = true;                         // nothing saved yet: the welcome screen asks for the language
    } catch (e) {}
    sanitize(st);
    migrateFmt(st);
    fixFont(st);
    return st;
  }
  /* damaged or foreign data in the storage must never stop the panel: every value gets the type it must have */
  function sanitize(st) {
    var oneOf = function (v, list, d) { return list.indexOf(v) >= 0 ? v : d; };
    ['translations', 'tafsirs'].forEach(function (k) {
      st[k] = Array.isArray(st[k]) ? st[k].filter(function (x) { return typeof x === 'string'; }).slice(0, 200) : DEFAULTS[k].slice();
    });
    ['uiLang', 'script', 'theme', 'tab', 'arFont', 'uzFont', 'picBg', 'auzaFont', 'basmalaFont', 'refFont'].forEach(function (k) { if (typeof st[k] !== 'string') st[k] = DEFAULTS[k]; });
    ['arSize', 'uzSize', 'auzaSize', 'basmalaSize', 'refSize'].forEach(function (k) { if (typeof st[k] === 'string' && +st[k]) st[k] = +st[k]; if (typeof st[k] !== 'number' || !isFinite(st[k])) st[k] = DEFAULTS[k]; });
    ['withTr', 'withTafsir', 'brackets', 'auza', 'basmala', 'ref', 'trRef', 'newPara', 'ayahNums', 'hizb', 'sajda', 'waqf', 'arBold', 'arText', 'picBgOn', 'votd', 'markAyahs']
      .forEach(function (k) { st[k] = typeof st[k] === 'boolean' ? st[k] : DEFAULTS[k]; });
    st.searchScope = oneOf(st.searchScope, ['default', 'selected', 'all'], 'default');
    st.votdClose = oneOf(st.votdClose, ['ask', 'day', 'off'], 'ask');
    st.picAction = oneOf(st.picAction, ['ask', 'insert', 'copy'], 'ask');
    st.extInsert = oneOf(st.extInsert, ['ask', 'text', 'picture'], 'ask');
    if (!/^#[0-9a-f]{6}$/i.test(st.picBg)) st.picBg = DEFAULTS.picBg;
    if (st.fmt !== undefined && (!st.fmt || typeof st.fmt !== 'object' || Array.isArray(st.fmt))) delete st.fmt;
  }
  /* The tafsir.one text is not encoded for KFGQPC fonts (ی, ۝ + digits): in KFGQPC it shows dots
     and double circles. Asking for KFGQPC therefore selects the Quran Library Hafs mushaf, whose
     text is made for that font (the Hafs mushafs already use it).                              */
  function fixFont(st) {
    if (!/KFGQPC|Uthmanic/i.test(st.fmt.ar.font || '')) return;
    if (!/^text_qpc_hafs/.test(st.script)) st.script = 'text_qpc_hafs';
    st.fmt.ar.font = '';
  }
  function saveSettings() { try { localStorage.setItem('myquran-settings', JSON.stringify(settings)); } catch (e) {} }

  var MAC = /Mac|iPhone|iPad/.test(navigator.platform || '');
  /* toast(text) or toast(text, {label, fn}): a button in the message (stays 7 s); on a Mac the keys are written with ⌘ */
  function toast(msg, act) {
    var el = $('toast');
    if (MAC) msg = String(msg).replace(/(Ctrl|Strg)\+/g, '⌘');
    el.textContent = msg;
    if (act) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'toast-act'; b.textContent = act.label;
      b.addEventListener('click', function () { el.classList.remove('show'); act.fn(); });
      el.appendChild(b);
    }
    el.classList.add('show');
    clearTimeout(toast.t); toast.t = setTimeout(function () { el.classList.remove('show'); }, act ? 7000 : 2000);
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
    [].forEach.call(document.querySelectorAll('[data-i18n-title]'), function (el) {   // screen readers read aria-label
      el.title = t(el.dataset.i18nTitle);
      if (el.hasAttribute('aria-label')) el.setAttribute('aria-label', el.title);
    });
  }
  $('s-ui-lang').innerHTML = I18n.languages.map(function (l) { return '<option value="' + l.id + '">' + esc(l.name) + '</option>'; }).join('');
  $('s-ui-lang').value = settings.uiLang;
  $('s-ui-lang').addEventListener('change', function () { setUiLang(this.value); });
  function setUiLang(lang) {
    settings.uiLang = lang; i18n.set(lang); saveSettings();
    $('s-ui-lang').value = lang;
    applyI18n(); resetIdle(); fillSuraSelect(); fillScriptSelect(); fillThemes(); render(); footerLinks(); drawMarks(); drawVotd();
    if (quran) $('status').textContent = '';          // applyI18n put the "Loading…" text back
    if (searchQ.trim()) runSearch();
    fmtEditor();                                     // Format tab: part names, font placeholder, preview
    if ($('settings').open) {                        // language names in the lists follow the interface
      insertTab();
      checklist($('s-tr-list'), catalog.translations, settings.translations);
      checklist($('s-tf-list'), catalog.tafsirs, settings.tafsirs);
      syncLists();
      [].forEach.call(document.querySelectorAll('.filter'), function (f) { f.dispatchEvent(new Event('input')); });
    }
  }

  /* ---------- themes: [id, background, surface, accent] (swatches); 'auto' follows the system ---------- */
  var THEMES = [['auto', '#f4f6f8', '#171a21', '#0f766e'], ['light', '#f4f6f8', '#ffffff', '#0f766e'], ['dark', '#0f1115', '#1f232c', '#2dd4bf'],
    ['sepia', '#f3ead6', '#fbf6ea', '#8b5e34'], ['ocean', '#eaf3fb', '#ffffff', '#0369a1'], ['forest', '#0c1813', '#183025', '#4ade80'],
    ['midnight', '#0a0f1e', '#17213d', '#fbbf24'], ['rose', '#fcf1f3', '#ffffff', '#be185d'], ['lavender', '#f4f2fe', '#ffffff', '#6d28d9'],
    ['desert', '#f8efe3', '#fffaf3', '#c2410c'], ['graphite', '#161618', '#29292e', '#f97316'], ['nord', '#2e3440', '#434c5e', '#88c0d0'],
    ['contrast', '#000000', '#111111', '#ffd60a']];
  function applyTheme() {
    if (settings.theme && settings.theme !== 'auto') document.documentElement.setAttribute('data-theme', settings.theme);
    else document.documentElement.removeAttribute('data-theme');
  }
  function fillThemes() {
    $('s-theme').innerHTML = THEMES.map(function (x) {
      var cap = x[0].charAt(0).toUpperCase() + x[0].slice(1);
      return '<button type="button" class="theme" role="radio" data-theme-id="' + x[0] + '" aria-checked="' + (settings.theme === x[0]) + '">' +
        '<span class="sw"><b style="background:' + x[1] + '"></b><b style="background:' + x[2] + '"></b><b style="background:' + x[3] + '"></b></span>' +
        '<span class="nm">' + esc(t('theme' + cap)) + '</span></button>';
    }).join('');
  }
  $('s-theme').addEventListener('click', function (e) {
    var b = e.target.closest('.theme'); if (!b) return;
    settings.theme = b.dataset.themeId; applyTheme(); saveSettings();
    [].forEach.call($('s-theme').children, function (x) { x.setAttribute('aria-checked', x === b); });
  });
  applyTheme();

  /* ---------- Format tab: one part at a time (chips), live preview of the real result ---------- */
  var fmtKey = 'ar';
  var FMT_LABEL = { ar: 'arabicText', auza: 'auza', basmala: 'basmala', ref: 'ref', tr: 'translation', tf: 'tafsir', trRef: 'refTr' };
  function fmtEditor() {
    var F = settings.fmt, f = F[fmtKey], arabicKey = !/^(tr|tf|trRef)$/.test(fmtKey);
    $('f-keys').innerHTML = Object.keys(FMT_LABEL).map(function (k) {
      return '<button type="button" role="tab" data-k="' + k + '" aria-selected="' + (k === fmtKey) + '">' + esc(t(FMT_LABEL[k])) + '</button>';
    }).join('');
    $('f-font').value = f.font || '';
    $('f-font').placeholder = fmtKey === 'ar' ? arabicFont() : arabicKey ? (fmtKey === 'basmala' ? t('mushafFont') : PLAIN_AR) :
      fmtKey === 'trRef' ? (F.tr.font || t('docFont')) : t('docFont');
    if (arabicKey) $('f-font').setAttribute('list', 'ar-fonts'); else $('f-font').removeAttribute('list');
    $('f-size').value = +f.size || '';
    var base = +F.ar.size || 18;
    $('f-size').placeholder = fmtKey === 'ref' ? Math.round(base * 0.7) : arabicKey ? base : fmtKey === 'trRef' ? (+F.tr.size || 14) : 14;
    [].forEach.call($('f-style').children, function (b) { b.setAttribute('aria-pressed', !!f[b.dataset.p]); });
    $('f-color').value = f.color || '#000000';
    $('f-color-show').style.background = f.color || '';
    $('f-color-show').classList.toggle('auto', !f.color);
    document.querySelector('#settings .para-only').hidden = !FMT_PARA[fmtKey];
    if (FMT_PARA[fmtKey]) {
      [].forEach.call($('f-align').children, function (b) { b.setAttribute('aria-pressed', (f.align || 'both') === b.dataset.a); });
      $('f-line').value = String(+f.line || 0);
    }
    fmtPreview();
  }
  function fmtPreview() {
    if (!quran) return;
    var out = current(), F = settings.fmt, html = '';
    var arP = function () {
      var f = F.ar;
      return '<p dir="rtl" class="arabic" style="text-align:' + (f.align === 'both' ? 'justify' : f.align) + (+f.line ? ';line-height:' + (1.45 * f.line) : '') +
        ";font-family:'" + esc(arabicFont()) + "','QuranUz Arabic'" + '">' + runsHtml(out.arabic.runs, false) + '</p>';
    };
    if (!/^(tr|tf|trRef)$/.test(fmtKey)) html = arP();
    else {
      var kind = fmtKey === 'trRef' ? 'tr' : fmtKey, p = out.paras.filter(function (x) { return x.kind === kind; })[0] ||
        (fmtKey === 'trRef' ? out.paras[0] : null);
      if (p) {
        var f = F[p.kind];
        html = '<p dir="' + p.dir + '" style="text-align:' + (f.align === 'both' ? 'justify' : f.align) + (+f.line ? ';line-height:' + f.line : '') +
          (f.font ? ";font-family:'" + esc(f.font) + "'" : '') + '">' + runsHtml(p.runs, false, p.kind) + '</p>';
      } else html = '<p class="muted small">' + esc(t(kind === 'tf' ? 'withTafsir' : 'withTranslation') + ' — ' + t('off')) + '</p>';
    }
    $('f-preview').innerHTML = html;
  }
  function fmtSet(prop, value) {
    settings.fmt[fmtKey][prop] = value;
    saveSettings(); fmtEditor(); render();
  }
  $('f-keys').addEventListener('click', function (e) { var b = e.target.closest('[data-k]'); if (b) { fmtKey = b.dataset.k; fmtEditor(); } });
  $('f-style').addEventListener('click', function (e) { var b = e.target.closest('[data-p]'); if (b) fmtSet(b.dataset.p, !settings.fmt[fmtKey][b.dataset.p]); });
  $('f-align').addEventListener('click', function (e) { var b = e.target.closest('[data-a]'); if (b) fmtSet('align', b.dataset.a); });
  $('f-line').addEventListener('change', function () { fmtSet('line', +this.value); });
  $('f-font').addEventListener('change', function () { fmtSet('font', this.value.trim()); });
  $('f-size').addEventListener('change', function () { fmtSet('size', Math.max(0, Math.min(96, +this.value || 0))); });
  $('f-color').addEventListener('input', function () { fmtSet('color', this.value); });
  $('f-color-reset').addEventListener('click', function () { fmtSet('color', ''); });

  /* ---------- settings tabs ---------- */
  function showTab(name) {
    if (!document.querySelector('.tab[data-tab="' + name + '"]')) name = 'general';
    [].forEach.call(document.querySelectorAll('.tabs [data-tab]'), function (b) { b.setAttribute('aria-selected', b.dataset.tab === name); });
    [].forEach.call(document.querySelectorAll('section.tab'), function (s) { s.hidden = s.dataset.tab !== name; });
    settings.tab = name;
  }
  document.querySelector('.tabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tab]'); if (!b) return;
    showTab(b.dataset.tab); saveSettings();
    document.querySelector('.sheet-body').scrollTop = 0;
  });

  /* ---------- first run: choose the interface language; it sets the default translation / tafsir ---------- */
  var PREFER_TR = { en: /saheeh/i, ru: /kuliev/i, ur: /junagar/i, tr: /diyanet/i, fr: /hamidullah/i, de: /bubenheim/i,
                    es: /isa garcia/i, id: /ministry|kementerian/i, bn: /taisirul/i, fa: /rowwad/i, zh: /ma jain|ma jian/i,
                    ko: /hamed choi/i, ja: /saeed sato/i, az: /musayev/i, tg: /arfy|mirof/i };
  function defaultsFor(ui) {
    var lang = ui.split('_')[0], st = { uiLang: ui, script: 'default', translations: [], tafsirs: [], withTr: false, withTafsir: false };
    if (lang === 'ar') return st;                      // Arabic: the mushaf only
    function pick(list, prefs) {                       // the first preference that matches, else the first one
      var own = list.filter(function (x) { return x.lang === lang; });
      for (var i = 0; i < prefs.length; i++) {
        var hit = own.filter(function (x) { return prefs[i] && prefs[i].test((x.name || '') + ' ' + (x.author || '')); })[0];
        if (hit) return hit;
      }
      return own[0];
    }
    var tr = lang === 'uz' ? trById('alovuddin_mansur') : pick(catalog.translations, [PREFER_TR[lang]]);
    var tf = lang === 'uz' ? tfById('muyassar_tafsiri') :
      pick(catalog.tafsirs, [/mukhtasar|mokhtasar|abridged/i, /ibne? kathir/i, /saadi/i]);
    if (tr) { st.translations = [tr.id]; st.withTr = true; }
    if (tf) { st.tafsirs = [tf.id]; st.withTafsir = true; }
    return st;
  }
  function showWelcome() {
    var MAIN = ['en', 'ar', 'ru', 'ur', 'uz'];
    var el = document.createElement('div');
    el.id = 'welcome';
    el.innerHTML = '<div class="welcome-card">' +
      '<img class="welcome-logo" src="assets/brand/word-office/clear-300.png" width="112" height="112" alt="">' +
      '<h1>Khatt al-Quran</h1><p class="welcome-ar" dir="rtl">خط القرآن</p>' +
      '<p class="welcome-sub">Choose your language · Тилни танланг · Выберите язык<br><span dir="rtl">اختر اللغة · زبان منتخب کریں</span></p>' +
      '<div class="welcome-langs">' + MAIN.map(function (id) {
        return '<button type="button" class="btn welcome-lang" data-lang="' + id + '">' + esc(new I18n(id).t('_name')) + '</button>';
      }).join('') + '</div>' +
      '<button type="button" class="link welcome-more">Other languages · Бошқа тиллар · Другие языки</button>' +
      '<div class="welcome-other" hidden>' + I18n.languages.filter(function (l) { return MAIN.indexOf(l.id) < 0; }).map(function (l) {
        return '<button type="button" class="btn welcome-lang small-lang" data-lang="' + l.id + '">' + esc(l.name) + '</button>';
      }).join('') + '</div></div>';
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('show'); });
    el.querySelector('.welcome-more').addEventListener('click', function () {
      el.querySelector('.welcome-other').hidden = false; this.hidden = true;
    });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('.welcome-lang'); if (!b) return;
      var d = defaultsFor(b.dataset.lang);
      Object.keys(d).forEach(function (k) { settings[k] = d[k]; });
      setUiLang(settings.uiLang);                      // saves the settings too
      el.classList.add('hide');
      setTimeout(function () { el.remove(); }, 400);
      useScript(settings.script).then(ensureData).then(function () { render(); drawVotd(); });
    });
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
  /* Names in the language's own script (Chinese, Japanese, Hindi, Bengali, Hebrew…): suranames.json */
  function native(lang) { return nativeNames[lang === 'cn_simp' ? 'zh' : lang]; }
  function ownScript(text) {                     // mostly letters of another script than Latin/Cyrillic/Arabic
    var s = QuranCore.stripHtml(text || '').slice(0, 400);
    var other = (s.match(/[\u0590-\u05FF\u0900-\u0DFF\u0E00-\u0FFF\u1100-\u11FF\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF]/g) || []).length;
    return other > (s.match(/[A-Za-z\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF]/g) || []).length;
  }
  /* Name of sura i (1-based) for a reference: the language's own names if we have them, otherwise
     in the script of the text: Arabic script -> Arabic, Cyrillic -> Cyrillic, else Latin. */
  function suraName(i, lang, sample) {
    var own = native(lang);
    if (own && ownScript(sample)) return own[i - 1];
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
    if (native(c)) return native(c)[i - 1];
    var n = suraNames[c] && suraNames[c].simple || suraNames.en && suraNames.en.simple;
    return n ? n[i - 1] : quran.suras[i - 1][1];
  }

  function loadTranslation(tr) { return getJSON(tr.file).then(function (d) { tr.data = d; tr.failed = false; return d; }, function (e) { tr.failed = true; throw e; }); }
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
    return Promise.all(jobs).then(function () { loadFailed = []; }, function (e) {
      loadFailed = (settings.withTr ? activeTranslations().filter(function (x) { return !x.data; }) : [])
        .concat(settings.withTafsir ? activeTafsirs().filter(function (tf) { return tf.format === 'array' ? !tf.all : !(tf.suras && tf.suras[sel.sura]); }) : []);
      if (!loadFailed.length) toast(t('error') + ': ' + e.message);
    }).then(function () { drawChips(); });
  }
  var loadFailed = [], muted = {}, skipExtras = false;      // what did not load; translations switched off for now (chips); "only Arabic" for one insert

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
  /* Where a QPC page font comes from, in this order (the browser takes the next one by itself when one does not answer):
     our own site, GitHub (jsDelivr, then raw), Hugging Face, archive.org (copies we upload), and only last the QUL CDN.
     Same list: wordpress plugin, extension. Files are exactly the QUL ones (tools/mirror_qpc_fonts.py, manifest.json). */
  var QPC_FONT_HOSTS = [
    'fonts/qpc/',
    'https://cdn.jsdelivr.net/gh/abdullohukr/quranuz@main/fonts/qpc/',
    'https://raw.githubusercontent.com/abdullohukr/quranuz/main/fonts/qpc/',
    'https://huggingface.co/datasets/abdullohukr/khatt-al-quran-fonts/resolve/main/qpc/',
    'https://archive.org/download/khatt-al-quran-fonts/qpc/'
  ];
  function qpcSources(sc, page) {
    var v = sc.id.replace('qpc_', ''), f = v + '/p' + page + '.woff2';
    return QPC_FONT_HOSTS.map(function (h) { return h + f; }).concat([sc.pageFont.url.replace('{n}', page)]);
  }
  /* QPC page fonts: one web font per Mushaf page, loaded when a page is shown */
  function pageFamily(page) {
    var sc = scriptById(settings.script), fam = 'MQ-' + sc.id + '-p' + page;
    if (!loadedFonts[fam]) {
      var st = document.createElement('style');
      st.textContent = "@font-face{font-family:'" + fam + "';src:" + qpcSources(sc, page).map(function (u) { return "url('" + u + "') format('woff2')"; }).join(',') + ";font-display:block}";
      document.head.appendChild(st); loadedFonts[fam] = 1;
    }
    return "'" + sc.pageFont.families[page - 1] + "','" + fam + "'";
  }
  /* ---------- formatting of each part: settings.fmt[key] = {font, size, b, i, u, color[, align, line]} ----------
     ar = the Arabic text (mushaf), auza / basmala / ref (Arabic reference) inside it,
     tr / tf = translation / tafsir paragraphs, trRef = "(Surah: 1-2)." after them.
     size 0 = automatic; align is physical (left / center / right / both); line 0 = Word's default spacing */
  var FMT_PARA = { ar: 1, tr: 1, tf: 1 };
  function defaultFmt() {
    var run = function (b, i) { return { font: '', size: 0, b: !!b, i: !!i, u: false, color: '' }; };
    var para = function (size, b) { var x = run(b); x.size = size; x.align = 'both'; x.line = 0; return x; };
    return { ar: para(18, false), auza: run(), basmala: run(), ref: run(), tr: para(14, true), tf: para(14, true), trRef: run(false, true) };
  }
  function migrateFmt(st) {                          // settings of 2.4 and older: separate font / size keys
    var f = defaultFmt(), old = st.fmt || {};
    Object.keys(f).forEach(function (k) { if (old[k]) Object.keys(old[k]).forEach(function (p) { f[k][p] = old[k][p]; }); });
    if (!st.fmt) {
      if (st.arFont) f.ar.font = st.arFont; if (+st.arSize) f.ar.size = +st.arSize; f.ar.b = !!st.arBold;
      ['auza', 'basmala', 'ref'].forEach(function (k) { if (st[k + 'Font']) f[k].font = st[k + 'Font']; if (+st[k + 'Size']) f[k].size = +st[k + 'Size']; });
      ['tr', 'tf'].forEach(function (k) { if (st.uzFont) f[k].font = st.uzFont; if (+st.uzSize) f[k].size = +st.uzSize; });
    }
    st.fmt = f;
  }
  function fmtOf(r, kind) {                          // the format key of a run
    if (kind) return r.role === 'trref' ? 'trRef' : kind;
    return r.role === 'auza' || r.role === 'basmala' || r.role === 'ref' ? r.role : 'ar';
  }
  /* style of a run: Arabic runs (kind undefined) or runs of a translation / tafsir paragraph */
  function runStyle(r, kind) {
    var F = settings.fmt, k = fmtOf(r, kind), f = F[k], para = kind ? F[kind] : F.ar;
    var st = { b: f.b, i: f.i, u: f.u, color: f.color || (r.color ? '#' + r.color : '') };
    if (kind && k === kind) { st.b = f.b && r.bold; st.i = f.i || r.italic; }   // explanations in ( ) stay regular
    st.font = k === 'trRef' ? (f.font || para.font) : null;
    st.size = k === 'trRef' ? (+f.size || +para.size || 14) : null;
    return st;
  }
  var PLAIN_AR = 'Scheherazade New';     // A'udhu and the [sura n] reference: ordinary Arabic, not a Mushaf font
  function wordFont(page) { return scriptById(settings.script).pageFont.families[page - 1]; }
  function arabicFont() {
    var sc = scriptById(settings.script), own = settings.fmt.ar.font;
    if (online && !sc.glyph) return own || CLOUD_AR;
    if (sc.glyph) return own || 'Scheherazade New';   // brackets, A'udhu, reference
    return own || (sc.font && sc.font.family) || 'Scheherazade New';
  }
  /* Word on the web and on iPad cannot use fonts installed on the computer. The QPC page mushafs
     (604 fonts each) are offered there too: their Arabic paragraph is inserted as a picture drawn
     with the web fonts (see ayahPicture), with the Unicode text as its alternative text. */
  function usableScripts() {                          // no page-font mushafs in Google Docs (no picture there); WordPress and the browser extension get them as text (they load the page fonts)
    return HOST === 'gdocs' ? catalog.scripts.filter(function (sc) { return !sc.glyph; }) : catalog.scripts;
  }
  /* Word on the web / iPad: no locally installed fonts and no add-in fonts. Ordinary mushafs go in as text in
     a Microsoft cloud font that renders the Quran text correctly (checked: ayah signs ۝١, all marks);
     only the QPC page mushafs (a glyph of one of 604 page fonts per word) need a picture. */
  var CLOUD_AR = HOST ? 'Scheherazade New' : 'Sakkal Majalla';    // Google Docs, web pages: a Google / web font
  function asPicture() { return online && !!scriptById(settings.script).glyph; }
  function fillScriptSelect() {
    $('s-script').innerHTML = usableScripts().map(function (sc) {
      return '<option value="' + sc.id + '">' + esc(scriptName(sc)) + (sc.ayahByAyah ? ' *' : '') + '</option>';
    }).join('');
    $('s-script').value = settings.script;
    $('ar-fonts').innerHTML = ['Scheherazade New', 'Amiri Quran'].concat(catalog.scripts.map(function (s) { return s.font && s.font.family; }))
      .filter(function (x, i, a) { return x && a.indexOf(x) === i; }).map(function (f) { return '<option value="' + esc(f) + '">'; }).join('');
  }

  /* ---------- search ----------
     1. At once (synchronous, as before): the Quran and the translations already loaded (quran.search).
     2. Right after it (a pause in typing, or at once for a search from the extension / a drop): every language, through
        the static search index (web/search.js, docs/search-index-format.md). Its results stream in (local, index,
        final) into the same list: an ayah already shown gets the fragment of the translation with the words marked and
        the name of its source, new ayahs go below. Nothing that is shown moves or blinks, the chosen item stays chosen.
        A newer text makes the older search stale (deepSeq): its answers are dropped. Search.run never rejects; nothing
        reaches the screen as an error, only a quiet line when a part of the sources could not be loaded.
     The list shows PAGE items, "Show more" the next ones. */
  var PAGE = 30, shown = PAGE, byKey = {}, searchQ = '', deepSeq = 0, deepTimer, deepClient = null, deepState = null, srcIndex = null;
  function runSearch(now) {
    var q = $('q').value;
    searchQ = q; deepSeq++; clearTimeout(deepTimer); deepState = null;
    var ref = q.trim() && quran.parseRef(q);
    if (ref) setSel(ref.sura, ref.from, ref.to);
    var trs = activeTranslations().filter(function (x) { return x.data; }).map(function (x) { return x.data; });
    results = quran.search(q, trs, 200).map(function (r) { return { sura: r.sura, aya: r.aya, hits: [] }; });
    byKey = {};
    results.forEach(function (r) { byKey[r.sura + ':' + r.aya] = r; });
    shown = PAGE;
    $('results').innerHTML = '';
    deepNote('', false);
    if (!ref && q.trim().length >= 2 && window.QuranSearch) {
      deepState = { seq: deepSeq, q: q, done: false, blocks: 0 };
      $('deep-note').dataset.state = 'run';
      deepTimer = setTimeout(function () { deepSearch(q); }, now ? 0 : 50);
    }
    drawResults(); statusLine();
  }
  function statusLine() {
    var q = searchQ.trim();
    $('status').textContent = !q ? '' : results.length ? t('results', { n: results.length }) : deepState && !deepState.done ? '' : t('notFound');
  }
  function deepNote(text, busy, state) {
    var el = $('deep-note');
    el.dataset.state = state || (busy ? 'run' : '');         // run | done (read by tools/test-embed/run.mjs)
    if (el.textContent !== text) el.textContent = text;
    el.classList.toggle('busy', !!busy && !!text);
  }
  /* the items up to `shown` that are not drawn yet are added; the drawn ones are only repainted when they change */
  function drawResults() {
    var list = $('results');
    for (var i = list.children.length; i < Math.min(shown, results.length); i++) {
      var li = document.createElement('li');
      li.dataset.i = i; results[i].li = li; results[i].html = '';
      list.appendChild(li);
      paintResult(results[i]);
    }
    $('more').hidden = results.length <= shown;
  }
  function paintResult(r) {
    if (!r.li) return;
    var html = resultHtml(r);
    if (html !== r.html) { r.html = html; r.li.innerHTML = html; }
  }
  function resultHtml(r) {
    var first = activeTranslations().filter(function (x) { return x.data; })[0], ar = arHit(r);
    var h = '<div class="ref">' + esc(uiSuraName(r.sura)) + ' <bdi>' + r.sura + ':' + r.aya + '</bdi> · <bdi>' +
      esc(quran.suras[r.sura - 1][0]) + '</bdi></div><div class="ar" dir="rtl">' + ayahHtml(r.sura, r.aya, ar) + '</div>';
    if (r.frag) h += '<div class="hit" dir="' + r.frag.dir + '">' + r.frag.html + '</div>';
    else if (settings.withTr && first) h += '<div class="small muted" dir="' + (first.dir || 'auto') + '">' +
      esc(QuranCore.stripHtml(first.data[quran.index(r.sura, r.aya)]).slice(0, 160)) + '…</div>';
    var names = sourceNames(r);
    if (names) h += '<div class="src">' + esc(t('foundIn')) + ' ' + names + '</div>';
    return h;
  }
  /* the hit in the Arabic of the Quran (its words are marked and selected on a click); the hit whose text is shown */
  function arHit(r) {
    var h = (r.hits || []).filter(function (x) { return x.src === 'quran' && x.wordFrom != null; })[0];
    return h && sameWords(r.sura, r.aya) ? h : null;
  }
  function textHit(r) {
    var hs = (r.hits || []).filter(function (x) { return x.src !== 'quran'; });
    function has(x) { var c = trById(x.src), m = srcMeta(x.src); return !!(c && c.data) || !!(m && m.text); }
    function rank(x) { return (has(x) ? 0 : 4) + (x.ranges && x.ranges.length ? 0 : 2) + (x.kind === 'tafsir' ? 1 : 0); }
    return hs.slice().sort(function (a, b) { return rank(a) - rank(b); })[0] || null;
  }
  /* word numbers of the search are those of the Unicode text: the chosen mushaf must split the ayah the same way */
  var baseQuran = null;
  function sameWords(s, a) {
    if (quran.ayahs === quran.baseAyahs) return true;
    if (!baseQuran) { baseQuran = Object.create(quran); baseQuran.ayahs = quran.baseAyahs; baseQuran.pages = null; baseQuran.colors = null; }
    return baseQuran.spans(s, a).words.length === quran.spans(s, a).words.length;
  }
  /* a source of the index or of the catalog: {name, lang, dir} */
  function srcMeta(id) {
    var m = deepClient && deepClient._manifest;            // read by Search.run before it gives index results
    if (m && !srcIndex) { srcIndex = {}; m.sources.forEach(function (s, n) { srcIndex[s.id] = n; }); }
    var c = trById(id) || tfById(id), s = m && srcIndex[id] != null ? m.sources[srcIndex[id]] : null;
    if (!c && !s) return null;
    var script = s ? s.script : '';
    return { name: (c && c.name) || (s && s.name) || id, lang: (c && c.lang) || (s && s.lang) || '', n: s ? srcIndex[id] : null,
             dir: c && c.dir || (/^(Arab|Hebr|Thaa|Syrc)$/.test(script) ? 'rtl' : 'auto'), script: s && s.stem ? 'ar' : script, text: !!(s && s.text) };
  }
  function langName(l) {
    var ui = langNames.ui && langNames.ui[settings.uiLang] || {};
    return ui[l] || (langNames.ui && langNames.ui.en || {})[l] || (langNames.native || {})[l] || l;
  }
  function sourceNames(r) {
    var seen = {}, list = [];
    (r.hits || []).forEach(function (h) { if (!seen[h.src]) { seen[h.src] = 1; list.push(h.src); } });
    if (!list.length) return '';
    var out = list.slice(0, 2).map(function (id) {
      if (id === 'quran') return '<b>' + esc(t('arabicText')) + '</b>';
      var x = srcMeta(id);
      return x ? '<b>' + esc(x.name) + '</b>' + (x.lang ? ' (' + esc(langName(x.lang)) + ')' : '') : '<b>' + esc(id) + '</b>';
    }).join(', ');
    return out + (list.length > 2 ? ' +' + (list.length - 2) : '');
  }
  /* the text around the place with the most marked words; the text is escaped piece by piece, only <mark> is ours */
  function fragmentHtml(text, ranges) {
    var MAX = 220, best = 0, bestN = 0;
    for (var i = 0; i < ranges.length; i++) {
      var n = 0;
      for (var j = i; j < ranges.length && ranges[j][1] <= ranges[i][0] + MAX - 60; j++) n += ranges[j][1] - ranges[j][0] > 2 ? 2 : 1;
      if (n > bestN) { bestN = n; best = i; }
    }
    var first = ranges.length ? ranges[best][0] : 0, start = Math.max(0, first - 50);
    if (start > 0) { var sp = text.lastIndexOf(' ', start); if (sp > 0 && first - sp < 110) start = sp + 1; }
    var end = Math.min(text.length, start + MAX);
    if (end < text.length) { var e2 = text.indexOf(' ', end); if (e2 > 0 && e2 - end < 30) end = e2; }
    var h = start > 0 ? '…' : '', pos = start;
    ranges.forEach(function (rg) {
      var a = Math.max(rg[0], pos), b = Math.min(rg[1], end);
      if (b <= a) return;
      h += esc(text.slice(pos, a)) + '<mark>' + esc(text.slice(a, b)) + '</mark>';
      pos = b;
    });
    return h + esc(text.slice(pos, end)) + (end < text.length ? '…' : '');
  }
  /* the texts of the shown items: a loaded translation, else a text block of the index (at most a few new blocks a time) */
  function hitText(id, i) {
    var c = trById(id);
    if (c && c.data) return Promise.resolve({ text: QuranCore.stripHtml(c.data[i] || '').replace(/\s+/g, ' ').trim(), local: true });
    var m = deepClient && deepClient._manifest, x = srcMeta(id);
    if (!m || !m.text || !x || x.n == null || !x.text) return Promise.resolve(null);
    var b = Math.floor(i / m.text.block);
    return deepClient.block(m, x.n, b).then(function (arr) { var s = Array.isArray(arr) && arr[i - b * m.text.block]; return typeof s === 'string' ? { text: s } : null; });
  }
  /* Two at a time, in the order of the list; a newer query stops the queue of the older one, so its text blocks do not
     stand in the way of the new search (the loader has only 4 requests at a time). */
  function loadFragments() {
    var st = deepState; if (!st) return;
    st.active = st.active || 0;
    function key(h) { return h.src + (h.ranges ? '+' : ''); }
    function next() {
      if (st !== deepState) return null;
      for (var k = 0; k < Math.min(shown, results.length); k++) {
        var r = results[k], h = textHit(r);
        if (!h || (r.frag && r.frag.src === h.src && (r.frag.ranged || !h.ranges)) || r.loading === key(h)) continue;
        return { r: r, h: h };
      }
      return null;
    }
    function pump() {
      while (st === deepState && st.active < 2 && st.blocks < shown + 10) {
        var job = next(); if (!job) return;
        run(job.r, job.h);
      }
    }
    function run(r, h) {
      st.active++; st.blocks++; r.loading = key(h);
      hitText(h.src, quran.index(r.sura, r.aya)).then(function (x) {
        if (st !== deepState || !x || !x.text) return;
        var meta = srcMeta(h.src) || {}, ranges = !x.local && h.ranges ? h.ranges : QuranSearch.highlight(x.text, st.q, meta.script);
        r.frag = { src: h.src, ranged: !!h.ranges, dir: meta.dir || 'auto', html: fragmentHtml(x.text, ranges) };
        paintResult(r);
      }).catch(function () { /* no text: the source name is shown all the same */ }).then(function () { st.active--; pump(); });
    }
    pump();
  }
  function searcher() {
    if (!deepClient && window.QuranSearch) try {
      var own = /^https?:/.test(location.protocol) ? new URL('./', location.href).href : null;
      deepClient = QuranSearch.Search({ bases: (own ? [own] : []).concat(QuranSearch.BASES.filter(function (b) { return b !== own; })) });
    } catch (e) { deepClient = null; }
    return deepClient;
  }
  function chosenSources() { return settings.translations.concat(settings.tafsirs); }
  var DEFAULT_LANGS = ['en', 'ar', 'ru', 'tr', 'uz'];
  function defaultLangs(ids) {
    var l = {};
    DEFAULT_LANGS.concat([i18n.code()]).forEach(function (x) { l[x] = 1; });
    ids.forEach(function (id) { var x = srcMeta(id); if (x && x.lang) l[x.lang] = 1; });
    return l;
  }
  function sourceCount(scope, ids) {
    var m = deepClient && deepClient._manifest; if (!m) return 0;
    var langs = defaultLangs(ids), want = {};
    ids.forEach(function (id) { want[id] = 1; });
    return m.sources.filter(function (s) { return scope === 'selected' ? want[s.id] : scope === 'all' || langs[s.lang] || want[s.id]; }).length;
  }
  /* Search.run found nothing in the main languages and looked in all of them */
  function widened(list, scope, ids) {
    if (scope !== 'default') return false;
    var langs = defaultLangs(ids), any = false, other = true;
    list.forEach(function (r) {
      (r.hits || []).forEach(function (h) {
        if (h.src === 'quran') return;
        var x = srcMeta(h.src); if (!x) return;
        any = true; if (langs[x.lang]) other = false;
      });
    });
    return any && other;
  }
  function takeDeep(list) {
    (list || []).forEach(function (x) {
      var k = x.sura + ':' + x.aya, r = byKey[k];
      if (!r) { r = byKey[k] = { sura: x.sura, aya: x.aya, hits: [] }; results.push(r); }
      if (x.hits && x.hits.length) r.hits = x.hits;
      paintResult(r);
    });
    drawResults(); statusLine(); loadFragments();
  }
  function deepSearch(q) {
    var s = searcher(), st = deepState;
    if (!s || !st || q !== searchQ) return;
    var seq = st.seq, scope = settings.searchScope || 'default', ids = chosenSources();
    var mine = activeTranslations().filter(function (x) { return x.data; });
    try {
      s.run(q, { quran: quran, scope: scope, uiLang: i18n.code(), langs: mine.map(function (x) { return x.lang; }), selected: ids, prefer: ids,
                 limit: 100, localTranslations: mine.map(function (x) { return { id: x.id, data: x.data }; }),
        onProgress: function (p) {
          if (seq !== deepSeq || st.done || p.stage !== 'chunks' || p.done >= p.total) return;
          var n = sourceCount(scope, ids);
          if (n) deepNote(t('searchingIn', { n: n }), true);
        },
        onResults: function (list) { if (seq === deepSeq) takeDeep(list); }
      }).then(function (list) {
        if (seq !== deepSeq) return;
        st.done = true;
        deepNote(list && list.partial ? t('searchPartial') : list && widened(list, scope, ids) ? t('searchWidened') : '', false, 'done');
        statusLine();
      }).catch(function () { if (seq === deepSeq) { st.done = true; deepNote('', false, 'done'); statusLine(); } });
    } catch (e) { st.done = true; deepNote('', false, 'done'); statusLine(); }
  }
  $('more').addEventListener('click', function () { shown += PAGE; drawResults(); loadFragments(); });
  /* an ayah in the chosen mushaf (page fonts, tajweed colours); mark: {wordFrom, wordTo} words to mark */
  function ayahHtml(s, a, mark) {
    var t = quran.text(s, a);
    function piece(from, to) {
      if (!quran.pages && !quran.colors) return esc(t.slice(from, to));
      return quran._runs(s, a, from, to).map(function (r) {
        var st = (r.color ? 'color:#' + r.color + ';' : '') + (r.page ? 'font-family:' + pageFamily(r.page) : '');
        return st ? '<span style="' + st + '">' + esc(r.t) + '</span>' : esc(r.t);
      }).join('');
    }
    if (!mark) return piece(0, t.length);
    var w = quran.spans(s, a).words, html = '', pos = 0;
    if (!w.length) return piece(0, t.length);
    var wf = Math.min(mark.wordFrom, w.length - 1), wt = Math.min(mark.wordTo == null ? wf : mark.wordTo, w.length - 1);
    w.forEach(function (x, k) {
      html += piece(pos, x.start);
      html += k >= wf && k <= wt ? '<mark>' + piece(x.start, x.end) + '</mark>' : piece(x.start, x.end);
      pos = x.end;
    });
    return html + piece(pos, t.length);
  }
  var searchTimer;
  $('q').addEventListener('input', function () { clearTimeout(searchTimer); searchTimer = setTimeout(runSearch, 250); });
  $('q').addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    clearTimeout(searchTimer); runSearch(true); addRecent($('q').value);
    if (results.length && !quran.parseRef($('q').value)) setSel(results[0].sura, results[0].aya, results[0].aya);     // Enter: the first one found
  });
  $('results').addEventListener('click', function (e) {
    var li = e.target.closest('li'); if (!li) return;
    var r = results[+li.dataset.i]; if (!r) return;
    if (e.shiftKey && r.sura === sel.sura) setSel(r.sura, Math.min(sel.from, r.aya), Math.max(sel.to, r.aya));
    else {
      addRecent($('q').value);
      setSel(r.sura, r.aya, r.aya);                       // the whole ayah is what gets inserted; the found words stay marked in the list,
    }                                                     // a part is chosen by tapping the words (as before)
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
  /* the right number below the left one: the LEFT one follows it (5–9, then 2 on the right → 2–2) */
  $('to').addEventListener('change', function () {
    var v = +this.value; if (!(v >= 1)) v = sel.to;
    if (v !== sel.to || v < sel.from) setSel(sel.sura, Math.min(sel.from, v), v);
  });
  /* a tap on a number selects all its digits: typing replaces it at once */
  ['from', 'to'].forEach(function (id) {
    var el = $(id);
    var all = function () { var x = this; x.select(); setTimeout(function () { if (document.activeElement === x) x.select(); }, 0); };   // now, and after the browser has put its caret
    el.addEventListener('focus', all); el.addEventListener('click', all); el.addEventListener('mouseup', function (e) { e.preventDefault(); });
  });
  $('reset-words').addEventListener('click', function () { setSel(sel.sura, sel.from, sel.to); });

  function wordState(a, w) {
    if (a === sel.from && w < sel.wordFrom) return 'off';
    if (a === sel.to && sel.wordTo != null && w > sel.wordTo) return 'off';
    if (clickStart && clickStart.a === a && clickStart.w === w) return 'start';
    return '';
  }

  function current(src) {
    var sc = scriptById(settings.script);
    return (src || quran).format(sel, {
      brackets: settings.brackets, auza: settings.auza, basmala: settings.basmala, ref: settings.ref, trRef: settings.trRef,
      ayahNums: settings.ayahNums, hizb: settings.hizb, sajda: settings.sajda, waqf: settings.waqf,
      bold: false,                                     // weight etc. come from settings.fmt
      // a font chosen for the basmala needs Unicode text (the QPC page mushafs have glyph codes)
      basmalaText: settings.fmt.basmala.font && sc.glyph && !src ? QuranCore.BASMALA : null,
      translations: settings.withTr && !skipExtras ? activeTranslations().filter(function (x) { return x.data && !muted[x.id]; }).map(function (x) {
        return { data: x.data, dir: x.dir, quotes: QUOTES[x.lang] || ['«', '»'],
                 suraName: suraName(sel.sura, x.lang, x.data[quran.index(sel.sura, sel.from)]) };
      }) : [],
      tafsirs: settings.withTafsir && !skipExtras ? activeTafsirs().filter(function (tf) { return !muted[tf.id]; }).map(function (tf) {
        var get = tafsirGetter(tf), first = get(sel.sura, sel.from);
        return { name: tf.name, dir: tf.dir, quotes: QUOTES[tf.lang] || ['«', '»'],
                 suraName: suraName(sel.sura, tf.lang, first && first.text), get: get };
      }) : []
    });
  }
  /* font and size of an Arabic run (A'udhu, basmala and the reference can have their own) */
  function runFont(r, font) {
    var F = settings.fmt, plain = online ? CLOUD_AR : PLAIN_AR;
    if (r.role === 'auza') return F.auza.font || plain;
    if (r.role === 'ref') return F.ref.font || plain;
    if (r.role === 'basmala' && F.basmala.font) return F.basmala.font;
    if (r.page) return wordFont(r.page);
    return r.plain ? plain : font;
  }
  function runSize(r) {
    var F = settings.fmt, base = +F.ar.size || 18;
    if (r.role === 'auza') return +F.auza.size || base;
    if (r.role === 'basmala') return +F.basmala.size || base;
    if (r.role === 'ref') return +F.ref.size || Math.round(base * 0.7);
    return base;
  }

  /* pt: font sizes in points (clipboard); otherwise relative to the paragraph (preview) */
  /* pt: font sizes in points (clipboard); otherwise relative to the paragraph (preview). kind: 'tr' / 'tf' or none (Arabic) */
  function runsHtml(runs, pt, kind) {
    var base = +settings.fmt.ar.size || 18;
    return runs.map(function (r) {
      var s = runStyle(r, kind);
      var st = 'font-weight:' + (s.b ? 'bold' : 'normal') + ';font-style:' + (s.i ? 'italic' : 'normal') +
        (s.u ? ';text-decoration:underline' : '') + (s.color ? ';color:' + s.color : '');
      if (!kind && (r.role || r.plain || r.page)) {
        var f = runFont(r, arabicFont());
        st += ';font-family:' + (r.page && f === wordFont(r.page) ? pageFamily(r.page) : "'" + esc(f) + "','QuranUz Arabic'");
        var size = runSize(r);
        if (size !== base) st += ';font-size:' + (pt ? size + 'pt' : (size / base).toFixed(3) + 'em');
      }
      if (kind && s.font) st += ";font-family:'" + esc(s.font) + "'";
      if (kind && s.size && pt) st += ';font-size:' + s.size + 'pt';
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
    starState(); drawChips();
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
  /* Indic scripts: Word does not substitute a font for them, so in Aptos, Calibri etc. Bengali came out as
     boxes; Apple's own Indic fonts (Kohinoor Bangla…) did not help either, Word for Mac shapes these scripts
     with Microsoft's engine and showed boxes in them too. So the text gets Microsoft's font for the script:
     Nirmala UI, which every Windows has, and elsewhere the Office cloud font that Word for Mac, iPad and the
     web download by themselves. [range, cloud font, language] */
  var INDIC = [[/[\u0900-\u097F]/g, 'Mangal', 'hi-IN'], [/[\u0980-\u09FF]/g, 'Vrinda', 'bn-BD'],
               [/[\u0A00-\u0A7F]/g, 'Raavi', 'pa-IN'], [/[\u0A80-\u0AFF]/g, 'Shruti', 'gu-IN'],
               [/[\u0B80-\u0BFF]/g, 'Latha', 'ta-IN'], [/[\u0C00-\u0C7F]/g, 'Gautami', 'te-IN'],
               [/[\u0C80-\u0CFF]/g, 'Tunga', 'kn-IN'], [/[\u0D00-\u0D7F]/g, 'Kartika', 'ml-IN'],
               [/[\u0D80-\u0DFF]/g, 'Iskoola Pota', 'si-LK']];
  function indicOf(t) {                          // -> {font, lang} when the text is mostly in an Indic script
    var best = null, n = 0;
    INDIC.forEach(function (x) { var k = (t.match(x[0]) || []).length; if (k > n) { n = k; best = x; } });
    if (!best || n * 2 <= (t.match(/[A-Za-z\u00C0-\u024F\u0400-\u04FF\u0600-\u06FF]/g) || []).length) return null;
    return { font: windows && best[1] !== 'Iskoola Pota' ? 'Nirmala UI' : best[1], lang: best[2] };
  }
  /* every property is set explicitly, so nothing is inherited from the cursor position */
  function runXml(r, font, size, rtl, s) {
    var ind = indicOf(r.t); if (ind) font = ind.font;
    var f = font ? '<w:rFonts w:ascii="' + xmlEsc(font) + '" w:hAnsi="' + xmlEsc(font) + '" w:cs="' + xmlEsc(font) + '"/>' : '';
    var v = function (on) { return on ? '' : ' w:val="0"'; };
    var c = s.color ? '<w:color w:val="' + s.color.replace('#', '').toUpperCase() + '"/>' : '';
    var sz = size ? '<w:sz w:val="' + Math.round(size * 2) + '"/><w:szCs w:val="' + Math.round(size * 2) + '"/>' : '';
    return '<w:r><w:rPr>' + f + '<w:b' + v(s.b) + '/><w:bCs' + v(s.b) + '/><w:i' + v(s.i) + '/><w:iCs' + v(s.i) + '/>' +
      '<w:u w:val="' + (s.u ? 'single' : 'none') + '"/>' + c + sz + '<w:rtl' + v(rtl) + '/>' +
      (ind ? '<w:lang w:bidi="' + ind.lang + '"/>' : '') + '</w:rPr>' +
      '<w:t xml:space="preserve">' + xmlEsc(r.t) + '</w:t></w:r>';
  }
  /* paragraph properties: alignment is stored physically; in a right-to-left paragraph Word reads
     "left" as the start of the line (checked in Word), so left and right are swapped there */
  function pPrXml(f, rtl) {
    var jc = f.align || 'both';
    if (rtl && (jc === 'left' || jc === 'right')) jc = jc === 'left' ? 'right' : 'left';
    return '<w:pPr><w:bidi' + (rtl ? '' : ' w:val="0"') + '/>' +
      (+f.line ? '<w:spacing w:line="' + Math.round(240 * f.line) + '" w:lineRule="auto"/>' : '') + '<w:jc w:val="' + jc + '"/></w:pPr>';
  }
  function cloudText(t) { return t.replace(/(^|[\s\u00a0])([\u0660-\u0669]+)(?=[\s\u00a0﴾]|$)/g, '$1\u06DD$2'); }
  /* A paragraph with every run's font, size and style resolved from the settings:
     {dir, kind, f (paragraph format), runs: [{t, font, size, s: {b, i, u, color}}]} */
  function paraModel(p, arabic) {
    var F = settings.fmt, kind = arabic ? null : (p.kind || 'tr'), pf = arabic ? F.ar : F[kind];
    if (arabic && online && !settings.fmt.ar.font) p = { dir: p.dir, runs: p.runs.map(function (r) {
      return r.role || r.page ? r : { t: cloudText(r.t), bold: r.bold, color: r.color, plain: r.plain };
    }) };
    return { dir: p.dir, kind: kind || 'ar', f: pf, runs: p.runs.map(function (r) {
      var s = runStyle(r, kind);
      return arabic ? { t: r.t, font: runFont(r, arabicFont()), size: runSize(r), s: s }
                    : { t: r.t, font: s.font || pf.font, size: s.size || +pf.size || 14, s: s };
    }) };
  }
  function paraXml(p, arabic) {
    var m = paraModel(p, arabic), rtl = m.dir === 'rtl';
    return '<w:p>' + pPrXml(m.f, rtl) + m.runs.map(function (x) { return runXml(x, x.font, x.size, rtl, x.s); }).join('') + '</w:p>';
  }
  /* ---------- the Arabic paragraph as a picture (page-font mushafs where local fonts do not exist) ---------- */
  var PIC_WIDTH_PT = 450, PIC_SCALE = 4;               // 450 pt ≈ text width of A4 / Letter; 4 px per point
  function cssFamily(r) {
    if (r.page) return pageFamily(r.page);
    var f = runFont(r, arabicFont());
    return "'" + f + "','QuranUz Arabic','Scheherazade New',serif";
  }
  function ayahPicture(out) {
    var toks = [], fontsToLoad = {};
    out.arabic.runs.forEach(function (r) {
      var s = runStyle(r), px = runSize(r) * PIC_SCALE;
      var font = (s.i ? 'italic ' : '') + (s.b ? 'bold ' : '') + px + 'px ' + cssFamily(r);
      fontsToLoad[font] = r.t.replace(/[\u200F\s]/g, '').slice(0, 8) || 'ا';
      var parts = r.role === 'ref' ? [r.t.trim()] : r.t.replace(/\u200F/g, '').split(/ +/);
      parts.forEach(function (p, i) {
        if (i > 0 || (/^ /.test(r.t) && toks.length)) toks.push({ space: true, font: font, px: px });
        if (p) toks.push({ t: p, font: font, px: px, color: s.color || '#000000', u: s.u });
      });
    });
    return Promise.all(Object.keys(fontsToLoad).map(function (f) {
      return document.fonts && document.fonts.load ? document.fonts.load(f, fontsToLoad[f]).catch(function () {}) : null;
    })).then(function () {
      var W = PIC_WIDTH_PT * PIC_SCALE, cv = document.createElement('canvas'), ctx = cv.getContext('2d');
      var F = settings.fmt.ar, base = (+F.size || 18) * PIC_SCALE, lineH = Math.round(base * (+F.line ? 1.45 * F.line : 2.1));
      toks.forEach(function (k) { ctx.font = k.font; k.w = ctx.measureText(k.space ? ' ' : k.t).width; });
      // lines, right to left; spaces between words can be stretched (justified, like the text in Word)
      var lines = [], cur = [], width = 0;
      toks.forEach(function (k) {
        if (k.space) { if (cur.length) { cur.push(k); width += k.w; } return; }
        if (width + k.w > W && cur.length) {
          while (cur.length && cur[cur.length - 1].space) width -= cur.pop().w;
          lines.push({ toks: cur, w: width }); cur = []; width = 0;
        }
        cur.push(k); width += k.w;
      });
      if (cur.length) lines.push({ toks: cur, w: width, last: true });
      cv.width = W; cv.height = Math.max(1, lines.length) * lineH;
      if (settings.picBgOn && /^#[0-9a-f]{6}$/i.test(settings.picBg)) { ctx.fillStyle = settings.picBg; ctx.fillRect(0, 0, W, cv.height); }   // else: transparent PNG
      ctx.textBaseline = 'alphabetic'; ctx.direction = 'rtl'; ctx.textAlign = 'right';
      var align = F.align || 'both';
      lines.forEach(function (ln, i) {
        var gaps = ln.toks.filter(function (k) { return k.space; }).length;
        var extra = align === 'both' && !ln.last && gaps ? (W - ln.w) / gaps : 0, y = i * lineH + lineH * 0.7;
        var x = align === 'left' ? ln.w : align === 'center' ? (W + ln.w) / 2 : W;   // right-to-left: x is the right edge
        ln.toks.forEach(function (k) {
          if (k.space) { x -= k.w + extra; return; }
          ctx.font = k.font; ctx.fillStyle = k.color; ctx.fillText(k.t, x, y);
          if (k.u) ctx.fillRect(x - k.w, y + k.px * 0.18, k.w, Math.max(2, k.px * 0.05));
          x -= k.w;
        });
      });
      var s = quran.offsets[sel.sura - 1], alt = [];
      for (var a = sel.from; a <= sel.to; a++) alt.push(quran.baseAyahs[s + a - 1]);
      return { png: cv.toDataURL('image/png').split(',')[1], wPt: PIC_WIDTH_PT, hPt: cv.height / PIC_SCALE,
               alt: alt.join(' ') + ' [' + quran.suras[sel.sura - 1][0] + ' ' + sel.from + (sel.to > sel.from ? '-' + sel.to : '') + ']' };
    });
  }
  function pictureXml(pic) {
    var cx = Math.round(pic.wPt * 12700), cy = Math.round(pic.hPt * 12700), alt = xmlEsc(pic.alt).replace(/"/g, '&quot;');
    return '<w:p>' + pPrXml({ align: 'center' }, true) + '<w:r><w:drawing>' +
      '<wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="' + cx + '" cy="' + cy + '"/>' +
      '<wp:docPr id="1" name="Khatt al-Quran" descr="' + alt + '"/>' +
      '<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">' +
      '<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="0" name="ayah.png" descr="' + alt + '"/><pic:cNvPicPr/></pic:nvPicPr>' +
      '<pic:blipFill><a:blip r:embed="rIdAyah"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>' +
      '<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="' + cx + '" cy="' + cy + '"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>' +
      '</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
  }

  function buildOoxml(out, pic) {
    var body = pic ? pictureXml(pic) : paraXml(out.arabic, true);
    out.paras.forEach(function (p) { body += paraXml(p); });
    // Word merges the LAST inserted paragraph into the paragraph at the cursor and gives it
    // that paragraph's properties; an empty last paragraph takes that role.
    body += '<w:p/>';
    return '<pkg:package xmlns:pkg="http://schemas.microsoft.com/office/2006/xmlPackage">' +
      '<pkg:part pkg:name="/_rels/.rels" pkg:contentType="application/vnd.openxmlformats-package.relationships+xml"><pkg:xmlData>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships></pkg:xmlData></pkg:part>' +
      (pic ? '<pkg:part pkg:name="/word/_rels/document.xml.rels" pkg:contentType="application/vnd.openxmlformats-package.relationships+xml"><pkg:xmlData>' +
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
        '<Relationship Id="rIdAyah" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/ayah.png"/>' +
        '</Relationships></pkg:xmlData></pkg:part>' +
        '<pkg:part pkg:name="/word/media/ayah.png" pkg:contentType="image/png" pkg:compression="store"><pkg:binaryData>' + pic.png + '</pkg:binaryData></pkg:part>' : '') +
      '<pkg:part pkg:name="/word/document.xml" pkg:contentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"><pkg:xmlData>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"' +
      ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"' +
      ' xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"><w:body>' + body +
      '</w:body></w:document></pkg:xmlData></pkg:part></pkg:package>';
  }
  function buildHtml(out, noArabic) {               // noArabic: the translation / tafsir paragraphs only
    var F = settings.fmt, css = function (f, rtl) {
      var al = f.align === 'both' ? 'justify' : f.align || 'justify';
      return 'text-align:' + al + (+f.line ? ';line-height:' + f.line : '');
    };
    var ar = '<p dir="rtl" style="' + css(F.ar, true) + ";font-family:'" + esc(arabicFont()) + "';font-size:" + (+F.ar.size || 18) + 'pt">' +
      runsHtml(out.arabic.runs, true) + '</p>';
    if (noArabic) ar = '';
    out.paras.forEach(function (p) {
      var k = p.kind || 'tr', f = F[k];
      ar += '<p dir="' + p.dir + '" style="' + css(f) + ';' + (f.font ? "font-family:'" + esc(f.font) + "';" : '') +
        'font-size:' + (+f.size || 14) + 'pt">' + runsHtml(p.runs, true, k) + '</p>';
    });
    return ar;
  }
  /* "New paragraph": the text goes right where the cursor is, in paragraphs of its own. In the middle
     of a paragraph it is split there first (like pressing Enter, both halves keep their style); at the
     start of a paragraph nothing is split. Before, it was put after the end of the whole paragraph. */
  function insertWord(out) {
    // page-font mushaf where local fonts do not exist: the Arabic paragraph goes in as a picture
    return (asPicture() ? ayahPicture(out) : Promise.resolve(null)).then(function (pic) { return insertWordWith(out, pic, { tag: refTag() }); });
  }
  function insertWordWith(out, pic, opts) {
    opts = opts || {};
    return Word.run(function (ctx) {
      var sel = ctx.document.getSelection(), before = null, safe = true;
      sel.load('text');
      if (settings.newPara) {
        before = sel.paragraphs.getFirst().getRange('Start').expandTo(sel.getRange('Start'));
        before.load('text');
      }
      return ctx.sync().then(function () {
        var target = sel;
        // a selection that gets replaced, or a paragraph that is split: "Undo" could not bring that back, so it only advises Ctrl+Z
        if (sel.text) safe = false;
        // 'After' = the start of the new second half; 'End' of the break is still before its paragraph
        // mark, so the Arabic text was glued to the first half and an empty paragraph was left over
        if (before && before.text.replace(/\s+/g, '') !== '') { target = sel.insertText('\n', 'Replace').getRange('After'); safe = false; }
        var rng = opts.html ? target.insertHtml(opts.html, 'Replace') : target.insertOoxml(buildOoxml(out, pic), 'Replace');
        return keepInserted(ctx, rng, safe, opts.tag);
      });
    }).catch(function () {
      return Word.run(function (ctx) {                       // hosts without OOXML support
        var target = ctx.document.getSelection();
        if (settings.newPara) target = target.insertText('\n', 'Replace').getRange('After');
        return keepInserted(ctx, target.insertHtml(opts.html || buildHtml(out), 'Replace'), false, opts.tag);
      });
    });
  }
  /* The inserted range is tracked, so "Undo" can take exactly it out again (only when nothing was replaced or split and
     the text is still the same). With "mark ayahs" the range goes into a content control that carries the reference
     (tag khatt:sura:from-to[:wordFrom:wordTo]); "Update all ayahs" finds them by it. A failure here never repeats the insert. */
  function keepInserted(ctx, rng, safe, tag) {
    return ctx.sync().then(function () {
      var cc = null;
      if (tag && settings.markAyahs) {
        try { cc = rng.insertContentControl(); cc.tag = tag; cc.title = 'Khatt al-Quran'; cc.appearance = 'Hidden'; } catch (e) { cc = null; }
      }
      var obj = cc || rng;
      try { obj.track(); obj.load('text'); } catch (e) { setUndo(true, null); return; }
      return ctx.sync().then(function () { setUndo(true, safe ? { rng: obj, cc: !!cc, text: obj.text } : null); }, function () { setUndo(true, null); });
    });
  }
  function refTag() {
    return 'khatt:' + sel.sura + ':' + sel.from + '-' + sel.to + (sel.wordFrom > 0 || sel.wordTo != null ? ':' + sel.wordFrom + ':' + (sel.wordTo == null ? 'n' : sel.wordTo) : '');
  }
  function copy(out) { return copyRaw(buildHtml(out), out.text); }
  function copyRaw(html, text) {
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
  function doInsert() {
    return ensureData().then(function () {
      if (loadFailed.length && !skipExtras) return askTrFail();       // a translation did not load: ask before inserting without it
      return insertNow();
    }).catch(function (e) { toast(t('error') + ': ' + e.message); });
  }
  function insertNow() {
    var out = current();
    remember();
    if (HOST) return sendToHost(out);
    return (inWord ? insertWord(out) : copy(out)).then(function () { toast(inWord ? t('inserted') : t('copiedPaste'), inWord && undoReady ? undoAct() : null); });
  }
  function undoAct() { return { label: t('undoShort'), fn: doUndo }; }
  /* the translation or tafsir that was asked for did not load (no network, a mirror down): the text would go in without it */
  function askTrFail() {
    $('tr-fail-names').textContent = loadFailed.map(function (x) { return x.name; }).join(', ');
    $('tr-fail').returnValue = '';
    $('tr-fail').showModal();
    return new Promise(function (done) {
      $('tr-fail').addEventListener('close', function once() {
        $('tr-fail').removeEventListener('close', once);
        var how = $('tr-fail').returnValue;
        if (how === 'ar') { skipExtras = true; Promise.resolve(insertNow()).then(function () { skipExtras = false; }, function () { skipExtras = false; }).then(done); }
        else if (how === 'reload') location.reload();
        else if (how === 'other') { $('settings-btn').click(); showTab('tr'); done(); }
        else done();
      });
    });
  }
  $('insert').addEventListener('click', doInsert);
  /* Embedding hosts get the result as a message: html + text (web pages, editors) and doc, the paragraphs
     with resolved fonts and styles (Google Docs builds them itself). It is also put on the clipboard first,
     while the click still counts as the user's: where the host cannot insert, Ctrl+V does it. */
  var hostWait = null, hostCopied = null;
  function hostDoc(out) {
    return [paraModel(out.arabic, true)].concat(out.paras.map(function (p) { return paraModel(p); })).map(function (m) {
      return { dir: m.dir, kind: m.kind, align: m.f.align || 'both', line: +m.f.line || 0, runs: m.runs.map(function (x) {
        return { t: x.t, font: x.font || '', size: x.size, b: !!x.s.b, i: !!x.s.i, u: !!x.s.u, color: x.s.color || '' };
      }) };
    });
  }
  /* The QPC page mushafs are private-use glyphs: a plain text field (and the plain text on the clipboard) gets the same
     selection in Unicode (quran.baseAyahs); editors and pictures keep the page fonts. */
  function withUnicodeText(out) {
    if (!scriptById(settings.script).glyph) return out;
    var u = Object.create(quran);
    u.ayahs = quran.baseAyahs; u.pages = null; u.colors = null; u.tajweed = false;
    var x = {}; for (var k in out) x[k] = out[k];
    try { x.text = current(u).text; } catch (e) { /* the glyph text stays */ }
    return x;
  }
  function sendToHost(out) {
    if (HOST === 'ext') out = withUnicodeText(out);
    var copied = hostCopied = copy(out).then(function () { return true; }, function () { return false; });
    if (ADOBE) return sendToAdobe(out, copied);
    if (HOST === 'ext') return sendToExt(out, copied);
    window.parent.postMessage({ type: 'khatt-insert', v: 1, html: buildHtml(out), text: out.text, doc: hostDoc(out),
                                newPara: !!settings.newPara }, '*');
    clearTimeout(hostWait);
    hostWait = setTimeout(function () { copied.then(function (ok) { toast(ok ? t('copiedPaste') : t('error')); }); }, 4000);
  }
  /* Adobe: the same message, plus for a QPC page mushaf the Arabic paragraph as a picture (pic: transparent PNG
     unless a background is set, see ayahPicture). The program uses the text when it can (InDesign with the page
     fonts installed) and the picture where it cannot (Photoshop, Premiere, missing fonts). */
  function adobePost(msg) {
    if (window.uxpHost && window.uxpHost.postMessage) window.uxpHost.postMessage(msg);   // UXP webview
    else window.parent.postMessage(msg, '*');                                              // CEP iframe
  }
  var adobePicAlways = false;      // Premiere: no text API, a picture for every mushaf (khatt-host from bridge.js)
  function sendToAdobe(out, copied) {
    var qpc = !!scriptById(settings.script).glyph;
    var msg = { type: 'khatt-insert', v: 1, html: buildHtml(out), text: out.text, doc: hostDoc(out),
                newPara: !!settings.newPara, qpc: qpc };
    clearTimeout(hostWait);
    hostWait = setTimeout(function () { copied.then(function (ok) { toast(ok ? t('copiedPaste') : t('error')); }); }, 30000);
    return (qpc || adobePicAlways ? ayahPicture(out).catch(function () { return null; }) : Promise.resolve(null)).then(function (pic) {
      if (pic) msg.pic = pic;
      adobePost(msg);
    });
  }
  function fromAdobe(e) {          // UXP: the plugin's messages come from window.uxpHost (origin = the plugin id)
    return ADOBE && !!window.uxpHost && (e.source === window.uxpHost || !/^https?:/.test(e.origin || ''));
  }
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (typeof d === 'string' && fromAdobe(e)) try { d = JSON.parse(d); } catch (x) { return; }
    if (d && d.type === 'khatt-host' && fromAdobe(e)) { adobePicAlways = d.picture === 'always'; return; }
    if (!HOST || (e.source !== window.parent && !fromAdobe(e)) || !d || d.type !== 'khatt-result' || !fromExt(e)) return;
    clearTimeout(hostWait);
    if (d.undo) {                                                                 // the answer to "Undo"
      clearTimeout(undoWait);
      if (d.ok) { setUndo(false); toast(t('undoDone')); }
      else if (d.error === 'gone') { setUndo(false); toast(t('undoGone')); }
      else toast(t(d.error === 'changed' ? 'undoChanged' : 'undoManual'));
      return;
    }
    if (d.ok && !d.ask) setUndo(true, null);
    if (HOST === 'ext' && d.ask) { askExt(); return; }                            // an editor, the way is not chosen yet
    if (HOST === 'ext' && d.ok && d.pic === 'none') { toast(t('extNoPicture')); return; }
    if (d.ok) toast(t('inserted'), HOST === 'wp' || HOST === 'gdocs' ? undoAct() : null);
    else if (ADOBE && /^adobe[A-Z]\w*$/.test(d.error || '')) toast(t(d.error));   // "Open a document first", …
    else if (ADOBE && d.error) toast(t('error') + ': ' + d.error);    // other Adobe errors: the text itself, not "copied"
    else (hostCopied || Promise.resolve(false)).then(function (ok) { toast(ok ? t('copiedPaste') : t('error') + (d.error ? ': ' + d.error : '')); });
  });
  /* Browser extension (extension/panel.js): plain text fields get the Unicode text; editors (contenteditable) get
     the text with its font or a transparent picture (settings.extInsert; 'ask': the panel answers ask: true without
     inserting and the choice is asked here once). The extension keeps the choice in storage.sync as well
     (khatt-pref both ways) and sends searches from the context menu / shortcut (khatt-search). */
  var extLast = null;
  function sendToExt(out, copied, mode) {
    mode = mode || settings.extInsert || 'ask'; extLast = out;
    var msg = { type: 'khatt-insert', v: 1, html: buildHtml(out), text: out.text, doc: hostDoc(out),
                newPara: !!settings.newPara, mode: mode };
    clearTimeout(hostWait);
    return (mode === 'picture' ? ayahPicture(out).catch(function () { return null; }) : Promise.resolve(null)).then(function (pic) {
      if (pic) {
        msg.pic = 'data:image/png;base64,' + pic.png;
        msg.picHtml = '<p dir="rtl" style="text-align:center"><img src="' + msg.pic + '" alt="' + esc(pic.alt) + '" width="' +
          Math.round(pic.wPt * 4 / 3) + '" style="max-width:100%;height:auto"></p>';      // shown at the size of the text
        msg.restHtml = buildHtml(out, true);
      }
      toParent(msg);
      hostWait = setTimeout(function () { copied.then(function (ok) { toast(ok ? t('copiedPaste') : t('error')); }); }, 4000);
    });
  }
  function extPref() { if (HOST === 'ext') toParent({ type: 'khatt-pref', extInsert: settings.extInsert }); }
  var CLOSE_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';
  if (HOST === 'ext') {
    var askDlg = document.createElement('dialog');
    askDlg.id = 'ext-ask'; askDlg.className = 'sheet';
    askDlg.innerHTML = '<form method="dialog"><div class="sheet-head"><h2 data-i18n="browser"></h2>' +
      '<button value="close" class="icon-btn" data-i18n-title="close" aria-label="Close">' + CLOSE_SVG + '</button></div>' +
      '<div class="sheet-body"><p data-i18n="extAskQ"></p>' +
      '<p class="actions"><button value="text" class="btn primary" data-i18n="extAsText"></button>' +
      '<button value="picture" class="btn" data-i18n="extAsPicture"></button></p>' +
      '<label class="switch"><input type="checkbox" id="ext-remember" checked><i></i> <span data-i18n="extRemember"></span></label></div></form>';
    document.body.appendChild(askDlg);
    askDlg.addEventListener('close', function () {
      var how = askDlg.returnValue;
      if (how !== 'text' && how !== 'picture') { (hostCopied || Promise.resolve(false)).then(function (ok) { if (ok) toast(t('copiedPaste')); }); return; }
      if ($('ext-remember').checked) { settings.extInsert = how; saveSettings(); extPref(); }
      if (extLast) sendToExt(extLast, hostCopied || Promise.resolve(false), how);
    });
    // settings, Insert tab: the same choice
    var extBox = document.createElement('div');
    extBox.className = 'opt-group'; extBox.id = 's-ext';
    extBox.innerHTML = '<h3 data-i18n="browser"></h3><label class="field"><span data-i18n="extInsertIn"></span> <select id="s-ext-insert">' +
      '<option value="ask" data-i18n="extAsk"></option><option value="text" data-i18n="extAsText"></option>' +
      '<option value="picture" data-i18n="extAsPicture"></option></select></label><p class="small muted" data-i18n="extInsertNote"></p>';
    document.querySelector('#settings section.tab[data-tab="insert"]').appendChild(extBox);
    $('s-ext-insert').addEventListener('change', function () { settings.extInsert = this.value; saveSettings(); extPref(); });
  }
  function askExt() { $('ext-remember').checked = true; askDlg.returnValue = ''; askDlg.showModal(); }
  /* put a text into the search field and search (the data may still be loading: wait for it) */
  function searchFor(q) {
    q = String(q || '').replace(/\s+/g, ' ').trim().slice(0, 500);
    if (!q) return;
    (function go(n) {
      if (!quran) { if (n < 300) setTimeout(function () { go(n + 1); }, 200); return; }
      var box = $('q'); box.value = q;
      clearTimeout(searchTimer); runSearch(true);       // from the extension / a drop: the deep search starts at once
    })(0);
  }
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!HOST || ADOBE || e.source !== window.parent || !d || !fromExt(e)) return;
    if (d.type === 'khatt-search' && typeof d.q === 'string') searchFor(d.q);
    else if (d.type === 'khatt-pref' && HOST === 'ext') {
      if (/^(ask|text|picture)$/.test(d.extInsert || '')) {
        if (settings.extInsert !== d.extInsert) { settings.extInsert = d.extInsert; saveSettings(); }
        if ($('s-ext-insert')) $('s-ext-insert').value = settings.extInsert;
      } else if (settings.extInsert !== 'ask') extPref();      // the extension has none yet: give it ours
      if (typeof d.fav === 'string' || Array.isArray(d.hist)) takeExtMarks(d);
      else if (marks.fav.length || marks.hist.length) marksPref();
    }
  });
  if (HOST === 'ext') toParent({ type: 'khatt-ready' });
  /* text dragged onto the panel (from a web page, another program) is searched */
  var dropTimer;
  function dropOff() { document.body.style.boxShadow = ''; }
  function dropTarget(e) {
    var dt = e.dataTransfer, el = e.target && e.target.closest ? e.target.closest('input, textarea, select, [contenteditable]') : null;
    return dt && [].indexOf.call(dt.types || [], 'text/plain') >= 0 && (!el || el.id === 'q');
  }
  window.addEventListener('dragover', function (e) {
    if (!dropTarget(e)) return;
    e.preventDefault(); e.dataTransfer.dropEffect = 'copy';
    document.body.style.boxShadow = 'inset 0 0 0 3px var(--accent)';
    clearTimeout(dropTimer); dropTimer = setTimeout(dropOff, 250);
  });
  window.addEventListener('drop', function (e) {
    if (!dropTarget(e)) return;
    e.preventDefault(); dropOff();
    searchFor(e.dataTransfer.getData('text/plain'));
  });
  $('copy').addEventListener('click', function () {
    ensureData().then(function () { remember(); return copy(current()); }).then(function () { toast(t('copied')); })
      .catch(function (e) { toast(t('error') + ': ' + e.message); });
  });

  /* ---------- history, favourites, insert the last one again ----------
     History: every insert and copy (newest first, up to 50); favourites: the star on the ayah card (up to 500).
     Kept in localStorage. In the browser extension also in its storage.sync (khatt-pref {fav, hist}, like extInsert):
     the extension's copy wins when the panel starts, every change here is sent to it at once. */
  var MARK_KEY = { hist: 'myquran-history', fav: 'myquran-favorites', bask: 'myquran-basket' }, MARK_MAX = { hist: 50, fav: 500, bask: 100 }, marksOpen = '';
  function okMark(x) { return !!x && x.sura >= 1 && x.sura <= 114 && x.from >= 1 && x.to >= x.from && x.to <= 286; }
  function loadMarks(k) {
    try { var x = JSON.parse(localStorage.getItem(MARK_KEY[k]) || '[]'); return Array.isArray(x) ? x.filter(okMark).slice(0, MARK_MAX[k]) : []; }
    catch (e) { return []; }
  }
  var marks = { hist: loadMarks('hist'), fav: loadMarks('fav'), bask: loadMarks('bask') };
  function markId(x) { return x.sura + ':' + x.from + '-' + x.to; }
  function storeMarks(k) { try { localStorage.setItem(MARK_KEY[k], JSON.stringify(marks[k])); } catch (e) {} }
  function saveMarks(k) { storeMarks(k); marksPref(); drawMarks(); starState(); }
  function addMark(k, x) {
    var id = markId(x);
    marks[k] = [x].concat(marks[k].filter(function (y) { return markId(y) !== id; })).slice(0, MARK_MAX[k]);
    saveMarks(k);
  }
  function remember() {                              // the current selection goes on top of the history
    var x = { sura: sel.sura, from: sel.from, to: sel.to, time: Date.now() };
    if (sel.wordFrom > 0 || sel.wordTo != null) { x.wf = sel.wordFrom; x.wt = sel.wordTo; }
    addMark('hist', x);
  }
  function isFav() { var id = markId(sel); return marks.fav.some(function (y) { return markId(y) === id; }); }
  function starState() {
    var on = isFav(), b = $('fav-toggle');
    b.setAttribute('aria-pressed', on); b.title = t(on ? 'favRemove' : 'favAdd'); b.setAttribute('aria-label', b.title);
  }
  $('fav-toggle').addEventListener('click', function () {
    if (!quran) return;
    var id = markId(sel);
    if (isFav()) { marks.fav = marks.fav.filter(function (y) { return markId(y) !== id; }); saveMarks('fav'); }
    else addMark('fav', { sura: sel.sura, from: sel.from, to: sel.to, time: Date.now() });
  });
  function markRef(x) { return uiSuraName(x.sura) + ' ' + x.sura + ':' + (x.to > x.from ? x.from + '-' + x.to : x.from); }
  function markTime(ms) {
    if (!ms) return '';
    var d = new Date(ms), today = d.toDateString() === new Date().toDateString();
    var o = today ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short' };
    try { return d.toLocaleString(i18n.code(), o); } catch (e) { return d.toLocaleString(undefined, o); }
  }
  function drawMarks() {
    if (!quran) return;
    ['hist', 'fav', 'bask'].forEach(function (k) {         // a mark beyond the end of its surah (damaged data) is dropped
      var n = marks[k].length;
      marks[k] = marks[k].filter(function (x) { return x.to <= quran.count(x.sura); });
      if (marks[k].length !== n) storeMarks(k);
    });
    $('hist-n').textContent = marks.hist.length || ''; $('fav-n').textContent = marks.fav.length || ''; $('bask-n').textContent = marks.bask.length || '';
    [['hist', 'history'], ['fav', 'favorites'], ['bask', 'basket']].forEach(function (x) {      // the count is read by screen readers too
      var b = $(x[0] + '-btn'), n = marks[x[0]].length;
      b.title = t(x[1]) + (n ? ' (' + n + ')' : ''); b.setAttribute('aria-label', b.title);
    });
    ['hist', 'fav', 'bask'].forEach(function (k) { $(k + '-btn').setAttribute('aria-expanded', marksOpen === k); });
    $('bask-acts').hidden = marksOpen !== 'bask' || !marks.bask.length;
    $('marks-panel').hidden = !marksOpen;
    if (!marksOpen) return;
    var list = marks[marksOpen];
    $('marks-list').innerHTML = list.map(function (x, i) {
      var ar = String(quran.baseAyahs[quran.index(x.sura, x.from)] || '').replace(/\s*۝[٠-٩]+\s*$/, '');
      return '<li data-i="' + i + '"><button type="button" class="mk-go"><span class="mk-ref">' + esc(uiSuraName(x.sura)) + ' <bdi>' + x.sura + ':' +
        (x.to > x.from ? x.from + '-' + x.to : x.from) + '</bdi>' + (marksOpen === 'hist' ? ' <span class="mk-time">' + esc(markTime(x.time)) + '</span>' : '') +
        '</span><span class="mk-ar" dir="rtl">' + esc(ar) + '</span></button>' +
        '<button type="button" class="icon-btn mk-del" title="' + esc(t('remove')) + '" aria-label="' + esc(t('remove') + ': ' + markRef(x)) + '">' + CLOSE_SVG + '</button></li>';
    }).join('');
    $('marks-empty').textContent = list.length ? '' : t(marksOpen === 'hist' ? 'histEmpty' : marksOpen === 'fav' ? 'favEmpty' : 'basketEmpty');
    $('marks-clear').hidden = !list.length;
  }
  ['hist', 'fav', 'bask'].forEach(function (k) {
    $(k + '-btn').addEventListener('click', function () {
      marksOpen = marksOpen === k ? '' : k; drawMarks();
      if (marksOpen) $('marks-panel').scrollIntoView({ block: 'start', behavior: 'smooth' });
    });
  });
  function pickMark(x) {
    setSel(x.sura, x.from, x.to);
    if (x.wf > 0 || x.wt != null) {                 // a part of the ayahs: the same words again
      sel.wordFrom = Math.max(0, x.wf | 0); sel.wordTo = x.wt == null ? null : x.wt | 0; render();
    }
  }
  $('marks-list').addEventListener('click', function (e) {
    var li = e.target.closest('li'), k = marksOpen; if (!li || !k) return;
    var i = +li.dataset.i, x = marks[k][i]; if (!x) return;
    if (!e.target.closest('.mk-del')) { pickMark(x); return; }
    marks[k].splice(i, 1); saveMarks(k);
    var next = $('marks-list').querySelectorAll('.mk-del')[Math.min(i, marks[k].length - 1)];   // keep the keyboard focus in the list
    (next || $(k + '-btn')).focus();
  });
  $('marks-clear').addEventListener('click', function () {
    if (!marksOpen) return;
    marks[marksOpen] = []; saveMarks(marksOpen); $(marksOpen + '-btn').focus();
  });
  /* Undo the last insert, as careful as possible (it is somebody's book): only when nothing was replaced or split and the
     inserted text is still exactly as it was put in. Word: the tracked range is deleted; WordPress and Google Docs take the
     inserted blocks / paragraphs out themselves (khatt-undo) under the same rule; everything else says "press Ctrl+Z". */
  var undoReady = false, undoRange = null, undoWait = null;
  function setUndo(on, word) {
    var old = undoRange;
    if (old && old !== word && old.rng && window.Word) {                    // free the tracking of the previous insert
      try { Word.run(old.rng, function (ctx) { old.rng.untrack(); return ctx.sync(); }).catch(function () {}); } catch (e) {}
    }
    undoReady = on; undoRange = on ? word || null : null; $('again').disabled = !on;
  }
  function doUndo() {
    if (!undoReady) return;
    if (HOST) {
      if (HOST !== 'wp' && HOST !== 'gdocs') { toast(t('undoManual')); return; }
      clearTimeout(undoWait); undoWait = setTimeout(function () { toast(t('undoManual')); }, 6000);
      window.parent.postMessage({ type: 'khatt-undo', v: 1 }, '*');
      return;
    }
    var u = undoRange;
    if (!inWord || !u || !window.Word) { toast(t('undoManual')); return; }
    Word.run(u.rng, function (ctx) {
      u.rng.load('text');
      return ctx.sync().then(function () {
        var now = u.rng.text;
        if (!String(now).replace(/\s+/g, '')) return 'gone';        // already taken out (the person pressed Ctrl+Z)
        if (now !== u.text) return 'changed';                       // edited since: do not delete the person's own words
        if (u.cc) u.rng.delete(false); else u.rng.delete();
        return ctx.sync().then(function () { try { u.rng.untrack(); } catch (e) {} return 'ok'; });
      });
    }).then(function (r) {
      if (r === 'ok') { setUndo(false); toast(t('undoDone')); }
      else if (r === 'gone') { setUndo(false); toast(t('undoGone')); }
      else toast(t('undoChanged'));
    }, function () { toast(t('undoManual')); });
  }
  $('again').addEventListener('click', doUndo);
  function marksPref() {
    if (HOST !== 'ext') return;
    toParent({ type: 'khatt-pref', fav: marks.fav.map(markId).join(','), hist: marks.hist.map(function (x) {
      return [x.sura, x.from, x.to, Math.round((x.time || 0) / 1000)].concat(x.wf != null ? [x.wf, x.wt] : []);
    }) });
  }
  function takeExtMarks(d) {
    if (typeof d.fav === 'string') {
      marks.fav = d.fav.split(',').map(function (s) {
        var m = /^(\d+):(\d+)-(\d+)$/.exec(s); return m && { sura: +m[1], from: +m[2], to: +m[3], time: 0 };
      }).filter(okMark).slice(0, MARK_MAX.fav);
      storeMarks('fav');
    }
    if (Array.isArray(d.hist)) {
      marks.hist = d.hist.map(function (a) {
        if (!Array.isArray(a)) return null;
        var x = { sura: +a[0], from: +a[1], to: +a[2], time: (+a[3] || 0) * 1000 };
        if (a.length > 4) { x.wf = +a[4] || 0; x.wt = a[5] == null ? null : +a[5]; }
        return x;
      }).filter(okMark).slice(0, MARK_MAX.hist);
      storeMarks('hist');
    }
    if (typeof d.fav !== 'string' || !Array.isArray(d.hist)) marksPref();   // the extension lacks one of them: give it ours
    drawMarks(); if (quran) starState();
  }

  /* ---------- copy as a picture: the Arabic as a PNG (ayahPicture: transparent unless a background is set) ---------- */
  function pictureBlob(out) {
    return ayahPicture(out).then(function (pic) {
      var bin = atob(pic.png), buf = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
      return new Blob([buf], { type: 'image/png' });
    });
  }
  function savePicture(blob) {                       // no image clipboard here: the picture is downloaded
    var a = document.createElement('a'), url = URL.createObjectURL(blob);
    a.href = url; a.download = 'ayah-' + sel.sura + '-' + sel.from + (sel.to > sel.from ? '-' + sel.to : '') + '.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 10000);
    toast(t('pictureSaved'));
  }
  function copyPicture() {
    var blob = ensureData().then(function () { remember(); return pictureBlob(current()); }), write;
    // the clipboard item gets the promise: it is written while the click still counts (Safari needs that)
    try {
      if (!navigator.clipboard || !navigator.clipboard.write || !window.ClipboardItem ||
          (ClipboardItem.supports && !ClipboardItem.supports('image/png'))) throw new Error('no image clipboard');
      write = navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    } catch (e) { write = Promise.reject(e); }
    write.then(function () { toast(t('pictureCopied')); }, function () { return blob.then(savePicture); })
      .catch(function (e) { toast(t('error') + (e && e.message ? ': ' + e.message : '')); });
  }
  function insertPicture() {                         // Word: the Arabic as a picture at the cursor
    return ensureData().then(function () {
      remember();
      var out = current();
      return ayahPicture(out).then(function (pic) { return insertWordWith(out, pic, { tag: refTag() }); });
    }).then(function () { toast(t('inserted'), undoReady ? undoAct() : null); }, function (e) { toast(t('error') + (e && e.message ? ': ' + e.message : '')); });
  }
  /* In Word the button asks: insert the picture or copy it (the answer can be remembered; Settings, Insert tab). */
  $('copy-pic').addEventListener('click', function () {
    if (!quran) return;
    if (!inWord || HOST || settings.picAction === 'copy') return copyPicture();
    if (settings.picAction === 'insert') return insertPicture();
    $('pic-remember').checked = false; $('pic-ask').returnValue = ''; $('pic-ask').showModal();
  });
  $('pic-ask').addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button[value=insert], button[value=copy]');
    if (!b) return;
    e.preventDefault();                                          // the action runs in this click, then the dialog closes
    var how = b.value;
    if ($('pic-remember').checked) { settings.picAction = how; saveSettings(); $('s-pic-action').value = how; }
    if (how === 'insert') insertPicture(); else copyPicture();
    $('pic-ask').close(how);
  });

  /* ---------- 3.11: translation chips, next ayah, "More" menu, basket, keyboard, recent searches, quick sets ---------- */
  function drawChips() {
    var box = $('chips'); if (!box || !quran) return;
    var items = (settings.withTr ? activeTranslations() : []).concat(settings.withTafsir ? activeTafsirs() : []);
    box.hidden = !items.length;
    box.innerHTML = items.map(function (x) {
      var bad = loadFailed.indexOf(x) >= 0;
      return '<button type="button" class="tchip' + (muted[x.id] ? ' off' : '') + (bad ? ' bad' : '') + '" data-id="' + esc(x.id) + '" aria-pressed="' + !muted[x.id] +
        '" title="' + esc(t('chipHint')) + '">' + esc(x.name) + '</button>';
    }).join('');
  }
  $('chips').addEventListener('click', function (e) {
    var b = e.target.closest('.tchip'); if (!b) return;
    muted[b.dataset.id] = !muted[b.dataset.id]; drawChips();
  });
  function stepAyah(d) {
    if (!quran) return;
    var c = quran.count(sel.sura);
    if (d > 0) { if (sel.to < c) setSel(sel.sura, sel.to + 1, sel.to + 1); else if (sel.sura < 114) setSel(sel.sura + 1, 1, 1); }
    else if (sel.from > 1) setSel(sel.sura, sel.from - 1, sel.from - 1);
    else if (sel.sura > 1) setSel(sel.sura - 1, quran.count(sel.sura - 1), quran.count(sel.sura - 1));
  }
  $('next').addEventListener('click', function () { stepAyah(1); });
  document.addEventListener('keydown', function (e) {
    var tag = (e.target.tagName || ''), typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tag) || e.target.isContentEditable, dlg = document.querySelector('dialog[open]');
    if (e.key === '/' && !typing && !dlg && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); $('q').focus(); $('q').select(); }
    else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !dlg) { e.preventDefault(); doInsert(); }
    else if (e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && !dlg) { e.preventDefault(); stepAyah(e.key === 'ArrowDown' ? 1 : -1); }
  });

  var RECENT_KEY = 'myquran-recent';
  function recentList() {
    try { var x = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); return Array.isArray(x) ? x.filter(function (s) { return typeof s === 'string'; }).slice(0, 10) : []; } catch (e) { return []; }
  }
  function addRecent(q) {
    q = String(q || '').trim();
    if (q.length < 2 || q.length > 80) return;
    try { localStorage.setItem(RECENT_KEY, JSON.stringify([q].concat(recentList().filter(function (x) { return x !== q; })).slice(0, 10))); } catch (e) {}
    drawRecent();
  }
  function drawRecent() { $('recent-q').innerHTML = recentList().map(function (q) { return '<option value="' + esc(q) + '">'; }).join(''); }
  drawRecent();

  /* "More": copy as plain text / Markdown / a link, the basket, a footnote (Word), update the marked ayahs (Word) */
  var LINK_BASE = 'https://quran.abdulloh.org/#';
  function refLink() { return LINK_BASE + sel.sura + ':' + sel.from + (sel.to > sel.from ? '-' + sel.to : ''); }
  function mdOf(out) {
    return String(out.text).split(/\n+/).filter(function (p) { return p.trim(); }).map(function (p, i) { return '> ' + (i ? '*' + p.trim() + '*' : p.trim()); }).join('\n>\n');
  }
  function clipText(txt) {
    var done = function () { toast(t('copied')); };
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(txt).then(done, function () { fallback(); });
    function fallback() { var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast(t('error')); } ta.remove(); }
    fallback();
  }
  function menuOpen(on) {
    var m = $('more-menu'); m.hidden = !on; $('more-btn').setAttribute('aria-expanded', !!on);
    if (on) {
      $('m-foot').hidden = !(inWord && window.Office && Office.context && Office.context.requirements && Office.context.requirements.isSetSupported('WordApi', '1.5'));
      $('m-update').hidden = !(inWord && settings.markAyahs); delete $('m-update').dataset.sure; $('m-update').textContent = t('updateAyahs');
    }
  }
  $('more-btn').addEventListener('click', function (e) { e.stopPropagation(); menuOpen($('more-menu').hidden); });
  document.addEventListener('click', function (e) { if (!$('more-menu').hidden && !e.target.closest('#more-menu')) menuOpen(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('more-menu').hidden) { menuOpen(false); $('more-btn').focus(); } });
  function withOut(fn) { if (!quran) return; ensureData().then(function () { remember(); fn(current()); }); }
  $('m-text').addEventListener('click', function () { menuOpen(false); withOut(function (out) { clipText(out.text); }); });
  $('m-md').addEventListener('click', function () { menuOpen(false); withOut(function (out) { clipText(mdOf(out)); }); });
  $('m-link').addEventListener('click', function () { menuOpen(false); clipText(refLink()); });
  /* the basket: ayahs and ranges collected in order, inserted (or copied) all at once */
  function addBask(x) {
    var id = markId(x);
    marks.bask = marks.bask.filter(function (y) { return markId(y) !== id; }).concat([x]).slice(-MARK_MAX.bask);     // in the order they were added
    saveMarks('bask');
  }
  $('m-bask').addEventListener('click', function () {
    menuOpen(false); if (!quran) return;
    var x = { sura: sel.sura, from: sel.from, to: sel.to, time: Date.now() };
    if (sel.wordFrom > 0 || sel.wordTo != null) { x.wf = sel.wordFrom; x.wt = sel.wordTo; }
    addBask(x); toast(t('basketAdded'));
  });
  function basketParts() {
    var save = JSON.parse(JSON.stringify(sel)), parts = [];
    return marks.bask.slice().reduce(function (p, x) {
      return p.then(function () {
        sel = { sura: x.sura, from: x.from, to: x.to, wordFrom: x.wf > 0 ? x.wf : 0, wordTo: x.wt == null ? null : x.wt };
        return ensureData().then(function () { var out = current(); parts.push({ html: buildHtml(out), text: out.text, doc: hostDoc(out) }); });
      });
    }, Promise.resolve()).then(function () { sel = save; render(); return parts; }, function (e) { sel = save; render(); throw e; });
  }
  function basketGo(copyOnly) {
    if (!quran || !marks.bask.length) return;
    basketParts().then(function (parts) {
      var html = parts.map(function (x) { return x.html; }).join(''), text = parts.map(function (x) { return x.text; }).join('\n\n');
      if (!copyOnly && inWord && !HOST) return insertWordWith(null, null, { html: html }).then(function () { toast(t('inserted'), undoReady ? undoAct() : null); });
      if (!copyOnly && (HOST === 'gdocs' || HOST === 'wp' || HOST === 'ext')) {
        var msg = { type: 'khatt-insert', v: 1, html: html, text: text, doc: [].concat.apply([], parts.map(function (x) { return x.doc; })), newPara: !!settings.newPara };
        if (HOST === 'ext') msg.mode = 'text';
        hostCopied = copyRaw(html, text).then(function () { return true; }, function () { return false; });
        toParent(msg); return;
      }
      return copyRaw(html, text).then(function () { toast(t('copied')); });
    }).catch(function (e) { toast(t('error') + ': ' + e.message); });
  }
  $('bask-insert').addEventListener('click', function () { basketGo(false); });
  $('bask-copy').addEventListener('click', function () { basketGo(true); });
  /* Word: the reference as a footnote at the cursor */
  $('m-foot').addEventListener('click', function () {
    menuOpen(false);
    Word.run(function (ctx) { ctx.document.getSelection().insertFootnote(markRef(sel)); return ctx.sync(); })
      .then(function () { toast(t('inserted')); }, function () { toast(t('footnoteNo')); });
  });
  /* Word: every ayah that was inserted with "mark ayahs" is put in again with the settings of now (asks twice) */
  $('m-update').addEventListener('click', function () {
    var b = this;
    if (!b.dataset.sure) { b.dataset.sure = '1'; b.textContent = t('pressAgain'); return; }
    menuOpen(false);
    var save = JSON.parse(JSON.stringify(sel)), n = 0;
    Word.run(function (ctx) {
      var ccs = ctx.document.contentControls; ccs.load('items/tag');
      return ctx.sync().then(function () {
        var jobs = ccs.items.map(function (cc) { var m = /^khatt:(\d+):(\d+)-(\d+)(?::(\d+):(\d+|n))?$/.exec(cc.tag || ''); return m && { cc: cc, m: m }; }).filter(Boolean);
        return jobs.reduce(function (p, j) {
          return p.then(function () {
            sel = { sura: +j.m[1], from: +j.m[2], to: +j.m[3], wordFrom: j.m[4] ? +j.m[4] : 0, wordTo: j.m[5] && j.m[5] !== 'n' ? +j.m[5] : null };
            return ensureData().then(function () { j.cc.insertOoxml(buildOoxml(current(), null), 'Replace'); n++; return ctx.sync(); });
          });
        }, Promise.resolve());
      });
    }).then(function () { sel = save; render(); toast(n ? t('updatedN', { n: n }) : t('updateNone')); },
            function (e) { sel = save; render(); toast(t('error') + (e && e.message ? ': ' + e.message : '')); });
  });
  /* quick sets of settings */
  var PRESETS = { ar: { withTr: false, withTafsir: false }, article: { withTr: true, withTafsir: false, ref: true, trRef: true }, tafsir: { withTr: true, withTafsir: true } };
  [].forEach.call(document.querySelectorAll('[data-preset]'), function (b) {
    b.addEventListener('click', function () {
      var p = PRESETS[b.dataset.preset]; if (!p) return;
      Object.keys(p).forEach(function (k) { settings[k] = p[k]; });
      if (settings.withTr && !settings.translations.length && catalog.translations.length) settings.translations = [catalog.translations[0].id];
      if (settings.withTafsir && !settings.tafsirs.length && catalog.tafsirs.length) settings.tafsirs = [catalog.tafsirs[0].id];
      saveSettings(); fillSettingsForm(); applySettings(); toast(t('presetApplied'));
    });
  });
  /* offline: the service worker keeps the Quran data, the search index and the fonts that were used (never the pages themselves) */
  if ('serviceWorker' in navigator && /^https:|^http:\/\/localhost/.test(location.protocol + '//' + location.hostname) && !ADOBE) {
    window.addEventListener('load', function () { setTimeout(function () { try { navigator.serviceWorker.register('sw.js').catch(function () {}); } catch (e) {} }, 3000); });
  }

  /* ---------- ayah of the day: the same for everyone on a calendar day; drawn after the panel ---------- */
  var votdList = null, VOTD_CLOSED = 'myquran-votd-closed';
  function dayKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function dayAyah(d) {
    if (!votdList) {        // ayahs of a readable length (up to ~250 characters) that do not go on with the one before
      var cont = /^(إلا|ثم|أو|حتى)\s/;
      votdList = [];
      quran.baseAyahs.forEach(function (x, i) {
        var n = Array.from(x).length;
        if (n >= 60 && n <= 250 && !cont.test(x.replace(/[ـً-ٰٟۖ-ۭ]/g, ''))) votdList.push(i);
      });
    }
    var day = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
    return quran.locate(votdList[(day * 7919) % votdList.length]);     // a prime step: neighbouring days are far apart
  }
  function drawVotd() {
    var card = $('votd'), now = new Date(), closed = '';
    try { closed = localStorage.getItem(VOTD_CLOSED) || ''; } catch (e) {}
    card.dataset.day = dayKey(now);
    if (!quran || !settings.votd || closed === dayKey(now)) { card.hidden = true; return; }
    var x = dayAyah(now);
    card.dataset.ref = x.sura + ':' + x.aya;
    $('votd-ref').textContent = uiSuraName(x.sura) + ' ' + x.sura + ':' + x.aya;
    $('votd-ar').innerHTML = ayahHtml(x.sura, x.aya);
    $('votd-tr').innerHTML = (settings.withTr ? activeTranslations().filter(function (tr) { return tr.data; }) : []).map(function (tr) {
      var s = QuranCore.stripHtml(tr.data[quran.index(x.sura, x.aya)] || '').replace(/^\s*\d+[.)]\s*/, '').trim();
      return s ? '<p dir="' + (tr.dir || 'auto') + '">' + esc(s) + '</p>' : '';
    }).join('');
    card.hidden = false;
  }
  function votdSel() {
    var p = ($('votd').dataset.ref || '').split(':');
    if (p.length !== 2) return false;
    setSel(+p[0], +p[1], +p[1]); return true;
  }
  $('votd-pick').addEventListener('click', function () { if (votdSel()) $('preview-ar').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); });
  $('votd-insert').addEventListener('click', function () { if (votdSel()) doInsert(); });
  /* the cross: the first time asks "turn it off or hide until tomorrow"; the answer is a setting (Settings, General) */
  function closeVotd(how) {
    if (how === 'off') { settings.votd = false; $('s-votd').checked = false; saveSettings(); }
    else { try { localStorage.setItem(VOTD_CLOSED, dayKey(new Date())); } catch (e) {} }
    $('votd').hidden = true;
  }
  $('votd-close').addEventListener('click', function () {
    if (settings.votdClose === 'off' || settings.votdClose === 'day') closeVotd(settings.votdClose);
    else { $('votd-ask').returnValue = ''; $('votd-ask').showModal(); }
  });
  $('votd-ask').addEventListener('close', function () {
    var how = $('votd-ask').returnValue;
    if (how !== 'off' && how !== 'day') return;
    settings.votdClose = how; saveSettings(); $('s-votd-close').value = how;
    closeVotd(how);
  });
  document.addEventListener('visibilitychange', function () {   // the panel stayed open past midnight
    if (!document.hidden && quran && $('votd').dataset.day !== dayKey(new Date())) drawVotd();
  });

  /* ---------- settings dialog ---------- */
  var B = { withTr: 's-with-tr', withTafsir: 's-with-tf', brackets: 's-brackets', auza: 's-auza', basmala: 's-basmala',
            ref: 's-ref', trRef: 's-tr-ref', newPara: 's-newpara', picBgOn: 's-picbg-on', picBg: 's-picbg',
            ayahNums: 's-nums', hizb: 's-hizb', sajda: 's-sajda', waqf: 's-waqf', votd: 's-votd', votdClose: 's-votd-close', picAction: 's-pic-action', markAyahs: 's-mark',
            searchScope: 's-search-scope' };
  if (HOST === 'ext') B.extInsert = 's-ext-insert';
  /* Group label in the interface language + the native name: "Турк тили (Türkçe)" */
  function langLabel(x) {
    var ui = langNames.ui && langNames.ui[settings.uiLang] || {};
    var loc = ui[x.lang] || x.langEn || x.langName || x.lang || '';
    var nat = langNames.native && langNames.native[x.lang] || x.langName || '';
    var bare = loc.replace(/ (тили|tili|тілі)$/i, '').toLowerCase();       // "Maguindanaon тили (Maguindanaon)" -> once
    return nat && nat.toLowerCase() !== loc.toLowerCase() && nat.toLowerCase() !== bare ? loc + ' (' + nat + ')' : loc;
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
        '</span>' + (on ? ' <span class="lang">' + esc(lang) + '</span>' : '') + '</label>';   // in a group the heading names the language
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
        // picked items stay visible on top while searching
        el.hidden = !!q && !el.querySelector('input').checked && (el.dataset.s || '').indexOf(q) < 0;
        if (!el.hidden) groups[el.dataset.g] = 1;
      });
      [].forEach.call(list.querySelectorAll('.grp'), function (el) { el.hidden = !!q && !groups[el.dataset.g]; });
    });
  });
  $('settings-btn').addEventListener('click', function () { fillSettingsForm(); $('settings').showModal(); });
  function fillSettingsForm() {
    Object.keys(B).forEach(function (k) {
      var el = $(B[k]); if (el.type === 'checkbox') el.checked = !!settings[k]; else el.value = settings[k] || '';
    });
    fontWas = settings.fmt.ar.font;
    fmtEditor();
    fillScriptSelect();
    $('s-ui-lang').value = settings.uiLang;
    fillThemes(); showTab(settings.tab);
    [].forEach.call(document.querySelectorAll('.filter'), function (f) { f.value = ''; });
    checklist($('s-tr-list'), catalog.translations, settings.translations);
    checklist($('s-tf-list'), catalog.tafsirs, settings.tafsirs);
    syncLists(); insertTab();
    $('s-mark-row').hidden = !inWord;
  }
  /* Insert tab: the translation reference sample in the interface language; in the page-font mushafs
     (QPC V1/V2/V4) hizb, sajdah and pause signs are parts of word glyphs and cannot be left out */
  function insertTab() {
    if (quran) $('s-tr-ref-sample').textContent = '(' + uiSuraName(10) + ': 1)';
    var sc = scriptById($('s-script').value) || {};
    [].forEach.call(document.querySelectorAll('.glyph-off'), function (el) {
      el.classList.toggle('disabled', !!sc.glyph); el.querySelector('input').disabled = !!sc.glyph;
    });
    $('marks-note').hidden = !sc.glyph;
  }
  $('s-script').addEventListener('change', insertTab);
  /* Settings are applied on every change and on Save: the dialog's "close" event is not fired in
     every WebView (it never came in the Word task pane, so nothing was saved). */
  var applyTimer;
  function applyLater() { clearTimeout(applyTimer); applyTimer = setTimeout(applySettings, 150); }
  /* The "add translation / tafsir" switch follows its list: picking an item turns it on, unpicking
     the last one turns it off (otherwise picked translations were silently not inserted). */
  /* A picked item moves to the top of its list at once, an unpicked one goes back to its language */
  [['s-tr-list', 's-with-tr', 'translations'], ['s-tf-list', 's-with-tf', 'tafsirs']].forEach(function (x) {
    $(x[0]).addEventListener('change', function (e) {
      if (e.target.type !== 'checkbox') return;
      var list = $(x[0]), top = list.scrollTop;
      $(x[1]).checked = !!list.querySelector('input:checked');
      settings[x[2]] = picked(list, settings[x[2]]);
      checklist(list, catalog[x[2]], settings[x[2]]);
      list.scrollTop = top;
      syncLists();
      var f = document.querySelector('.filter[data-list="' + x[0] + '"]');
      if (f && f.value) f.dispatchEvent(new Event('input'));
    });
    $(x[1]).addEventListener('change', syncLists);
  });
  function syncLists() {
    $('s-tr-list').classList.toggle('off', !$('s-with-tr').checked);
    $('s-tf-list').classList.toggle('off', !$('s-with-tf').checked);
  }
  $('settings').addEventListener('change', function (e) {
    if (!e.target.classList.contains('filter') && e.target.id !== 's-ui-lang' && !e.target.closest('.fmt-card')) applyLater();
  });
  $('settings').addEventListener('submit', function () { clearTimeout(applyTimer); applySettings(); });
  $('settings').addEventListener('close', function () { clearTimeout(applyTimer); applySettings(); resetIdle(); });
  function applySettings() {
    Object.keys(B).forEach(function (k) {
      var el = $(B[k]);
      settings[k] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? +el.value || (DEFAULTS[k] || 0) : el.value.trim();
    });
    settings.translations = picked($('s-tr-list'), settings.translations);
    settings.tafsirs = picked($('s-tf-list'), settings.tafsirs);
    var scriptChanged = settings.script !== $('s-script').value;
    settings.script = $('s-script').value;
    if (scriptChanged && settings.fmt.ar.font === fontWas) settings.fmt.ar.font = '';   // font follows the mushaf
    var before = settings.script;
    fixFont(settings);
    if (settings.script !== before) scriptChanged = true;
    saveSettings();
    (scriptChanged ? useScript(settings.script) : Promise.resolve()).then(ensureData).then(function () { render(); if (searchQ.trim()) runSearch(); drawVotd(); });
  }

  /* Reset: everything but the interface language, history and favourites. The first press asks, the second does it. */
  var resetTimer;
  function resetIdle() { var b = $('s-reset'); clearTimeout(resetTimer); delete b.dataset.sure; b.textContent = t('resetSettings'); }
  $('s-reset').addEventListener('click', function () {
    var b = this;
    if (!b.dataset.sure) {
      b.dataset.sure = '1'; b.textContent = t('resetSure');
      resetTimer = setTimeout(function () { delete b.dataset.sure; b.textContent = t('resetSettings'); }, 5000);
      return;
    }
    clearTimeout(resetTimer); clearTimeout(applyTimer);
    try { localStorage.removeItem(VOTD_CLOSED); localStorage.setItem('myquran-settings', JSON.stringify({ uiLang: settings.uiLang })); } catch (e) {}
    settings.extInsert = 'ask'; extPref();
    toast(t('resetDone'));
    setTimeout(function () { location.reload(); }, 400);
  });

  /* the search block stays under the top bar: the page knows both heights (CSS: .pin, scroll-margin of the lists) */
  function layoutVars() {
    var root = document.documentElement.style, bar = document.querySelector('.topbar'), pin = document.querySelector('.pin');
    if (bar) root.setProperty('--topbar-h', bar.offsetHeight + 'px');
    if (pin) root.setProperty('--pin-h', pin.offsetHeight + 'px');
  }
  layoutVars(); window.addEventListener('resize', layoutVars);
  if (window.ResizeObserver) { var lro = new ResizeObserver(layoutVars); [].forEach.call(document.querySelectorAll('.topbar, .pin'), function (e) { lro.observe(e); }); }

  /* ---------- surah info ---------- */
  $('info-btn').addEventListener('click', function () {
    var c = i18n.code(), s = sel.sura;
    // Uzbek in Latin letters has its own file (transliterated from the Cyrillic one)
    (settings.uiLang === 'uz_latn' ? optional('surah_info/uz_latn.json', null) : Promise.resolve(null)).then(function (d) {
      return d || optional('surah_info/' + c + '.json', null);
    }).then(function (d) {
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
    Promise.all([getJSON('quran.json'), optional('catalog.json', null), optional('suras.json', {}), optional('langnames.json', {}), optional('suranames.json', {})]).then(function (r) {
      var data = r[0], cat = r[1], names = r[2];
      langNames = r[3] || {};
      nativeNames = r[4] || {};
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
      fillScriptSelect();
      return useScript(settings.script);
    }).then(function () {
      setSel(1, 1, 1);
      if (firstRun) showWelcome(); else fromHash();
      /* the word tables of the search: from web/data/quran.search.json (made by the builder, read after the panel is
         drawn) they take ~40 ms of the main thread instead of ~250 ms when they are built here; without the file they
         are built as before */
      setTimeout(function () {
        optional('quran.search.json', null).then(function (sd) {
          var ok = sd && sd.v === 1 && sd.ayahs && sd.ayahs.length === quran.baseAyahs.length && !quran._idx && !quran._w;
          if (ok) quran._sd = sd;
          setTimeout(function () { quran._buildIndex(); if (ok) setTimeout(function () { quran._words().tables(); }, 0); }, 0);
        });
      }, 50);
      drawMarks();
      setTimeout(function () { ensureData().then(drawVotd); }, 300);   // after the panel is drawn: it must not slow the start down
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
      location.replace(location.pathname + '?v=' + encodeURIComponent(d.v) + (HOST ? '&host=' + HOST : '') + location.hash);
    }).catch(function () {});
  }
  checkVersion();
  /* The ribbon's "Settings" button opens the panel at index.html#settings */
  function fromHash() {
    var m = quran && /^#(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?$/.exec(location.hash);       // a link to an ayah: #2:255 or #2:255-257
    if (m && +m[1] >= 1 && +m[1] <= 114) { setSel(+m[1], +m[2], +(m[3] || m[2])); return; }
    if (location.hash !== '#settings' || !quran) return;
    history.replaceState(null, '', location.pathname + location.search);
    $('settings-btn').click();
  }
  window.addEventListener('hashchange', fromHash);
  /* Footer pages: the address carries the version, so after an update the browser does not show an
     old copy of "What's new" from its cache; Help opens in the interface language */
  function footerLinks() {
    var meta = document.querySelector('meta[name="myquran-version"]'), v = meta ? meta.content : '';
    [].forEach.call(document.querySelectorAll('footer.author a[href$=".html"], footer.author a[data-page]'), function (a) {
      var page = a.dataset.page || (a.dataset.page = a.getAttribute('href'));
      a.href = page + '?v=' + v + '&lang=' + settings.uiLang;
    });
    // Uzbek calls both the Updates window and the versions page «Дастур нашри»: one link (the version number
    // next to it opens the window)
    $('updates-link').hidden = t('updates') === t('whatsNew');
  }
  footerLinks();
  /* Updates window (footer): is this panel the newest version, the latest release notes, and the
     installer that updates the fonts and the Word add-in on this computer. The release list
     (releases.js, also used by releases.html) is loaded with the newest version in its address. */
  function loadReleases(v) {
    return new Promise(function (ok, fail) {
      var s = document.createElement('script');
      s.src = 'releases.js?v=' + encodeURIComponent(v);
      s.onload = function () { s.remove(); window.KhattReleases ? ok(window.KhattReleases) : fail(); };
      s.onerror = function () { s.remove(); fail(); };
      document.head.appendChild(s);
    });
  }
  function showNews(list) {
    var l = settings.uiLang.split('_')[0], L = { uz: 1, ru: 1, en: 1, ar: 1 }[l] ? l : 'en';
    $('upd-news').innerHTML = list.slice(0, 3).map(function (r) {
      return '<div class="rel"><b><span class="ver">' + esc(r[0]) + '</span>' + esc(r[2][L]) + '<span class="date">' + esc(r[1]) + '</span></b>' +
        '<ul>' + r[3][L].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>';
    }).join('');
  }
  function openUpdates() {
    var meta = document.querySelector('meta[name="myquran-version"]'), mine = meta ? meta.content : '';
    var st = $('upd-status'), now = $('upd-now');
    st.className = 'upd-status'; st.textContent = t('updChecking'); now.hidden = true;
    if (!HOST) {
      var mac = /Mac/.test(navigator.platform || '') && !windows;
      $('upd-download').href = 'install/' + (windows ? 'Khatt-al-Quran-Windows.exe' : mac ? 'Khatt-al-Quran-Setup-Mac.dmg' : '');
      $('upd-download').hidden = !(windows || mac);
      $('upd-local').hidden = false;
    }
    $('updates').showModal();
    fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (d) {
      return loadReleases(d.v).then(function (list) {
        showNews(list);
        if (d.v === mine) { st.textContent = t('updLatest', { v: list[0][0] }); return; }
        st.textContent = t('updNew', { v: list[0][0] }); st.classList.add('new'); now.hidden = false;
        now.onclick = function () {
          try { sessionStorage.setItem('myquran-reload', d.v); } catch (e) {}
          location.replace(location.pathname + '?v=' + encodeURIComponent(d.v) + (HOST ? '&host=' + HOST : ''));
        };
      });
    }).catch(function () {
      st.textContent = t('updOffline');
      loadReleases(mine).then(showNews, function () {});
    });
  }
  $('updates-btn').addEventListener('click', function (e) { e.preventDefault(); openUpdates(); });
  /* Footer: the version of this panel (the newest release in releases.js of this build); opens Updates */
  (function () {
    var meta = document.querySelector('meta[name="myquran-version"]');
    loadReleases(meta ? meta.content : '').then(function (list) {
      var a = document.querySelector('#app-version a');
      a.textContent = 'v' + list[0][0];
      a.addEventListener('click', function (e) { e.preventDefault(); openUpdates(); });
      $('app-version').hidden = false;
    }, function () {});
  })();
  if (/[?&]debug\b/.test(location.search)) window.MQDebug = { ayahPicture: ayahPicture, buildOoxml: buildOoxml, current: current,
    setSel: function (s, f, t) { setSel(s, f, t); }, settings: settings, useScript: useScript,
    setOnline: function (v) { online = !!v; }, setWord: function (v) { inWord = !!v; }, pictureBlob: function () { return pictureBlob(current()); },
    dayAyah: function (d) { return dayAyah(d || new Date()); }, marks: function () { return marks; } };   // tests only

  if (window.Office && Office.onReady) {
    Office.onReady(function (info) {
      inWord = info && info.host === Office.HostType.Word;
      // fonts installed on the computer exist only in Word for Windows and Mac (not on the web, iPad, …)
      online = !!HOST && !ADOBE || inWord && info.platform !== Office.PlatformType.PC && info.platform !== Office.PlatformType.Mac;
      if (inWord) windows = info.platform === Office.PlatformType.PC;
      if (inWord) { document.body.classList.add('office'); $('host-badge').hidden = false; }
      if (online && quran) render();
    });
  }
  if (HOST) {
    $('host-badge').textContent = { gdocs: 'Google Docs', wp: 'WordPress', ext: t('browser'), adobe: 'Adobe' }[HOST];
    if (HOST === 'ext') $('host-badge').dataset.i18n = 'browser';     // follows the interface language
    $('host-badge').hidden = false;
    document.body.classList.add('embedded');
  }
  init();
})();
