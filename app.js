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
    auzaFont: '', auzaSize: 0, basmalaFont: '', basmalaSize: 0, refFont: '', refSize: 0    // 0 / '': automatic
  };
  var QUOTES = { en: ['“', '”'], tr: ['“', '”'], id: ['“', '”'], ms: ['“', '”'], az: ['“', '”'], zh: ['“', '”'],
                 ja: ['「', '」'], ko: ['“', '”'], de: ['„', '“'], nl: ['„', '”'], it: ['«', '»'] };
  var fontWas = '', firstRun = false, settings = loadSettings(), i18n = new I18n(settings.uiLang);
  var quran, catalog = { translations: [], tafsirs: [], scripts: [] }, suraNames = {}, nativeNames = {}, surahInfo = {}, langNames = {};
  var cache = {}, sel = { sura: 1, from: 1, to: 1, wordFrom: 0, wordTo: null };
  /* ?host=gdocs | wp | ext: the panel inside Google Docs, WordPress or the browser extension (see sendToHost) */
  var HOST = (location.search.match(/[?&]host=(gdocs|wp|ext)\b/) || [])[1] || '';
  if (window.parent === window) HOST = '';
  var clickStart = null, inWord = false, online = !!HOST, windows = /Win/.test(navigator.platform || ''), results = [];
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
      else firstRun = true;                         // nothing saved yet: the welcome screen asks for the language
    } catch (e) {}
    migrateFmt(st);
    fixFont(st);
    return st;
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
    applyI18n(); fillSuraSelect(); fillScriptSelect(); fillThemes(); render(); footerLinks();
    if (quran) $('status').textContent = '';          // applyI18n put the "Loading…" text back
    if (results.length) runSearch();
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
      '<img class="welcome-logo" src="assets/icon-300.png" width="112" height="112" alt="">' +
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
      useScript(settings.script).then(ensureData).then(function () { render(); });
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
  function usableScripts() {                          // no page-font mushafs in the embedding hosts (no picture there)
    return HOST ? catalog.scripts.filter(function (sc) { return !sc.glyph; }) : catalog.scripts;
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
      ayahNums: settings.ayahNums, hizb: settings.hizb, sajda: settings.sajda, waqf: settings.waqf,
      bold: false,                                     // weight etc. come from settings.fmt
      // a font chosen for the basmala needs Unicode text (the QPC page mushafs have glyph codes)
      basmalaText: settings.fmt.basmala.font && sc.glyph ? QuranCore.BASMALA : null,
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
  function buildHtml(out) {
    var F = settings.fmt, css = function (f, rtl) {
      var al = f.align === 'both' ? 'justify' : f.align || 'justify';
      return 'text-align:' + al + (+f.line ? ';line-height:' + f.line : '');
    };
    var ar = '<p dir="rtl" style="' + css(F.ar, true) + ";font-family:'" + esc(arabicFont()) + "';font-size:" + (+F.ar.size || 18) + 'pt">' +
      runsHtml(out.arabic.runs, true) + '</p>';
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
    return (asPicture() ? ayahPicture(out) : Promise.resolve(null)).then(function (pic) { return insertWordWith(out, pic); });
  }
  function insertWordWith(out, pic) {
    return Word.run(function (ctx) {
      var sel = ctx.document.getSelection(), before = null;
      if (settings.newPara) {
        before = sel.paragraphs.getFirst().getRange('Start').expandTo(sel.getRange('Start'));
        before.load('text');
      }
      return ctx.sync().then(function () {
        var target = sel;
        // 'After' = the start of the new second half; 'End' of the break is still before its paragraph
        // mark, so the Arabic text was glued to the first half and an empty paragraph was left over
        if (before && before.text.replace(/\s+/g, '') !== '') target = sel.insertText('\n', 'Replace').getRange('After');
        target.insertOoxml(buildOoxml(out, pic), 'Replace');
        return ctx.sync();
      });
    }).catch(function () {
      return Word.run(function (ctx) {                       // hosts without OOXML support
        var target = ctx.document.getSelection();
        if (settings.newPara) target = target.insertText('\n', 'Replace').getRange('After');
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
      if (HOST) return sendToHost(out);
      return (inWord ? insertWord(out) : copy(out)).then(function () { toast(inWord ? t('inserted') : t('copiedPaste')); });
    }).catch(function (e) { toast(t('error') + ': ' + e.message); });
  });
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
  function sendToHost(out) {
    var copied = hostCopied = copy(out).then(function () { return true; }, function () { return false; });
    window.parent.postMessage({ type: 'khatt-insert', v: 1, html: buildHtml(out), text: out.text, doc: hostDoc(out),
                                newPara: !!settings.newPara }, '*');
    clearTimeout(hostWait);
    hostWait = setTimeout(function () { copied.then(function (ok) { toast(ok ? t('copiedPaste') : t('error')); }); }, 4000);
  }
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!HOST || e.source !== window.parent || !d || d.type !== 'khatt-result') return;
    clearTimeout(hostWait);
    if (d.ok) toast(t('inserted'));
    else (hostCopied || Promise.resolve(false)).then(function (ok) { toast(ok ? t('copiedPaste') : t('error') + (d.error ? ': ' + d.error : '')); });
  });
  $('copy').addEventListener('click', function () {
    ensureData().then(function () { return copy(current()); }).then(function () { toast(t('copied')); })
      .catch(function (e) { toast(t('error') + ': ' + e.message); });
  });

  /* ---------- settings dialog ---------- */
  var B = { withTr: 's-with-tr', withTafsir: 's-with-tf', brackets: 's-brackets', auza: 's-auza', basmala: 's-basmala',
            ref: 's-ref', trRef: 's-tr-ref', newPara: 's-newpara',
            ayahNums: 's-nums', hizb: 's-hizb', sajda: 's-sajda', waqf: 's-waqf' };
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
  $('settings-btn').addEventListener('click', function () {
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
    $('settings').showModal();
  });
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
    if (scriptChanged && settings.fmt.ar.font === fontWas) settings.fmt.ar.font = '';   // font follows the mushaf
    var before = settings.script;
    fixFont(settings);
    if (settings.script !== before) scriptChanged = true;
    saveSettings();
    (scriptChanged ? useScript(settings.script) : Promise.resolve()).then(ensureData).then(function () { render(); if (results.length) runSearch(); });
  }

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
      location.replace(location.pathname + '?v=' + encodeURIComponent(d.v) + (HOST ? '&host=' + HOST : '') + location.hash);
    }).catch(function () {});
  }
  checkVersion();
  /* The ribbon's "Settings" button opens the panel at index.html#settings */
  function fromHash() {
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
    setOnline: function (v) { online = !!v; } };   // tests only

  if (window.Office && Office.onReady) {
    Office.onReady(function (info) {
      inWord = info && info.host === Office.HostType.Word;
      // fonts installed on the computer exist only in Word for Windows and Mac (not on the web, iPad, …)
      online = !!HOST || inWord && info.platform !== Office.PlatformType.PC && info.platform !== Office.PlatformType.Mac;
      if (inWord) windows = info.platform === Office.PlatformType.PC;
      if (inWord) { document.body.classList.add('office'); $('host-badge').hidden = false; }
      if (online && quran) render();
    });
  }
  if (HOST) {
    $('host-badge').textContent = { gdocs: 'Google Docs', wp: 'WordPress', ext: t('browser') }[HOST];
    if (HOST === 'ext') $('host-badge').dataset.i18n = 'browser';     // follows the interface language
    $('host-badge').hidden = false;
    document.body.classList.add('embedded');
  }
  init();
})();
