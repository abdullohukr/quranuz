/* Khatt al-Quran: offline help.
   - the Quran data (data/), the search index (search/) and the fonts that were used (fonts/): served from the copy at once and
     refreshed in the background;
   - the pages, scripts and styles: ALWAYS from the network first (the panel reloads itself when a new version is out); the copy
     is used only when there is no network. */
var CACHE = 'khatt-data-v1', SHELL = 'khatt-shell-v1';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf('khatt-data-') === 0 && k !== CACHE && k !== SHELL; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (!/\/(data|search|fonts)\//.test(u.pathname)) {
    if (/\/(sw\.js|version\.json)$/.test(u.pathname) || !/\.(html|js|css|png|svg|woff2|webmanifest)$|\/$/.test(u.pathname)) return;
    e.respondWith(fetch(r).then(function (res) {
      if (res && res.ok) { var cp = res.clone(); caches.open(SHELL).then(function (c) { return c.put(r, cp); }).catch(function () {}); }
      return res;
    }).catch(function () { return caches.open(SHELL).then(function (c) { return c.match(r, { ignoreSearch: true }); }).then(function (hit) { return hit || Response.error(); }); }));
    return;
  }
  e.respondWith(caches.open(CACHE).then(function (c) {
    return c.match(r).then(function (hit) {
      var net = fetch(r).then(function (res) { if (res && res.ok) c.put(r, res.clone()).catch(function () {}); return res; });
      if (hit) { net.catch(function () {}); return hit; }
      return net;
    });
  }));
});
