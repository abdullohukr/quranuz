/* Khatt al-Quran: the public counter (users, ayahs inserted, downloads and installs) and its anonymous events.
   Privacy: a random number made on this device (myquran-id) is the only thing that is sent, together with what happened (open the panel
   once a day, how many ayahs were inserted, the platform, the version, the interface language). No name, e-mail, IP, text of a document.
   The person can switch it off in Settings ("Take part in the public counter"); then nothing is sent.
   Used by the panel (app.js: Stats.open / Stats.insert) and by every page of the site (the numbers in the footer: Stats.mount). */
(function (root) {
  'use strict';
  var API = root.KHATT_STATS_API || 'https://stats.abdulloh.org';
  var KEY_ID = 'myquran-id', KEY_DAY = 'myquran-stats-day', KEY_CACHE = 'myquran-stats-cache';
  /* a number is shown only when it is big enough to mean something (and never invented: it is what the counter says) */
  var MIN = { users: 100, ayahs: 1000, downloads: 50 };
  var Stats = { enabled: true, API: API, MIN: MIN };
  var pending = 0, timer = null, noop = function () {};
  function ls(k, v) {
    try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {}
    return null;
  }
  function newId() {
    var a = new Uint8Array(16), s = '';
    try { crypto.getRandomValues(a); } catch (e) { for (var i = 0; i < 16; i++) a[i] = Math.floor(Math.random() * 256); }
    for (var j = 0; j < 16; j++) s += (a[j] < 16 ? '0' : '') + a[j].toString(16);
    return s;
  }
  Stats.id = function () {
    var id = ls(KEY_ID);
    if (!/^[0-9a-f]{32}$/.test(id || '')) { id = newId(); ls(KEY_ID, id); }
    return id;
  };
  function send(obj, beacon) {
    if (!Stats.enabled || !root.fetch && !navigator.sendBeacon) return;
    var body = JSON.stringify(obj), url = API + '/v1/hit';
    try {
      if (beacon && navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type: 'text/plain;charset=UTF-8' }))) return;
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=UTF-8' }, body: body, keepalive: true, credentials: 'omit', mode: 'cors' }).catch(noop);
    } catch (e) {}
  }
  Stats.send = send;
  function today() { return new Date().toISOString().slice(0, 10); }
  /* the panel was opened: once a day on this device */
  Stats.open = function (platform, version, lang) {
    if (!Stats.enabled || ls(KEY_DAY) === today()) return;
    ls(KEY_DAY, today());
    send({ id: Stats.id(), e: 'open', p: platform || 'web', v: String(version || '').replace(/[^\d.]/g, '').slice(0, 20), l: String(lang || '').toLowerCase().replace(/[^a-z_-]/g, '').slice(0, 8) });
  };
  /* n ayahs were inserted: sent together, a few seconds later (and when the page goes away) */
  Stats.insert = function (n, platform) {
    n = Math.min(300, Math.max(0, n | 0));
    if (!Stats.enabled || !n) return;
    pending += n; Stats.platform = platform || Stats.platform;
    clearTimeout(timer); timer = setTimeout(Stats.flush, 5000);
  };
  Stats.flush = function (beacon) {
    clearTimeout(timer);
    if (!pending) return;
    var n = pending; pending = 0;
    send({ id: Stats.id(), e: 'insert', p: Stats.platform || 'web', n: n }, beacon === true);
  };
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', function () { if (document.hidden) Stats.flush(true); });
  /* the public numbers: from the cache of the last hour at once, then fresh */
  Stats.load = function (cb) {
    var cached = null;
    try { cached = JSON.parse(ls(KEY_CACHE) || 'null'); } catch (e) {}
    if (cached && cached.d) cb(cached.d);
    if (cached && Date.now() - cached.t < 36e5) return;
    if (!root.fetch) return;
    var done = false, ctl = root.AbortController ? new AbortController() : null;
    setTimeout(function () { if (!done && ctl) ctl.abort(); }, 6000);
    fetch(API + '/v1/stats', { credentials: 'omit', cache: 'no-cache', signal: ctl ? ctl.signal : undefined }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
      done = true;
      if (!d || !d.users || typeof d.users.total !== 'number') return;
      ls(KEY_CACHE, JSON.stringify({ t: Date.now(), d: d })); cb(d);
    }).catch(noop);
  };
  var ICON = {
    users: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 19c0-3.2 2.7-5.2 6-5.2s6 2 6 5.2"/><path d="M16 5.2a3 3 0 0 1 0 5.6M18 14c2 .6 3 2.2 3 5"/></svg>',
    ayahs: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Zm9-1.5h5.5c.8 0 1.5.7 1.5 1.5v13c0 .8-.7 1.5-1.5 1.5H13V4Z"/></svg>',
    downloads: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14"/></svg>'
  };
  function fmt(n, lang) { try { return Number(n).toLocaleString(lang || undefined); } catch (e) { return String(n); } }
  /* t(key, {n}) gives the text in the interface language (the panel's t or I18n of the page); the numbers below the minimum are not shown */
  Stats.render = function (el, d, t, lang) {
    if (!el || !d) return;
    var parts = [];
    function part(kind, n, key, extra) { parts.push('<span class="st" data-k="' + kind + '">' + ICON[kind] + '<span>' + t(key, { n: '<b>' + fmt(n, lang) + '</b>' }) + (extra || '') + '</span></span>'); }
    var u = d.users || {};
    if (u.total >= MIN.users) part('users', u.total, 'statsUsers', u.d30 >= 10 && u.d30 !== u.total ? ' <span class="muted">(' + t('statsMonth', { n: fmt(u.d30, lang) }) + ')</span>' : '');
    if (d.ayahs >= MIN.ayahs) part('ayahs', d.ayahs, 'statsAyahs');
    var dl = (d.downloads || 0) + (d.installs || 0);
    if (dl >= MIN.downloads) part('downloads', dl, 'statsDownloads');
    el.innerHTML = parts.join('<span class="sep" aria-hidden="true"> · </span>');
    el.hidden = !parts.length;
  };
  /* the footer block of a page: #stats, else made before the footer; i18n: the page's I18n */
  Stats.mount = function (t, lang) {
    var el = document.getElementById('stats');
    if (!el) {
      var anchor = document.querySelector('footer') || document.querySelector('p.author');
      el = document.createElement('div'); el.id = 'stats'; el.className = 'stats'; el.hidden = true;
      if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(el, anchor); else document.body.appendChild(el);
    }
    Stats.load(function (d) { Stats.render(el, d, t, lang); });
    return el;
  };
  /* a page of the site (help, privacy, …): the language from ?lang=, the saved interface language or the browser */
  Stats.mountPage = function () {
    if (!root.I18n) return;
    var lang = ((location.search.match(/[?&]lang=([\w]+)/) || [])[1] || '');
    if (!lang) try { lang = JSON.parse(ls('myquran-settings') || '{}').uiLang || ''; } catch (e) {}
    if (!lang) lang = (navigator.language || 'en').slice(0, 2);
    var i;
    try { i = new root.I18n(lang); } catch (e) { return; }
    Stats.mount(function (k, v) { return i.t(k, v); }, (i.code && i.code()) || lang.split('_')[0]);
  };
  root.Stats = Stats;
})(typeof window !== 'undefined' ? window : this);
