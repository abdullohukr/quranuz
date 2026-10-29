/* Search in every language: the client of the static search index of translations, tafsirs and
   transliterations, the encoder / decoder of its chunks and an in-memory builder. No DOM: the site, the Word panel,
   the extension, Node (index builder, MCP) and Cloudflare Workers use the same code. The text normalisation is
   QuranCore.text (web/core.js), shared with the builder. Format: docs/search-index-format.md.

     var s = QuranSearch.Search({ fetch, bases?, version?, cache?, timeout? });
     s.run(query, { quran, scope, langs, uiLang, selected, prefer, kinds, limit, onProgress, onResults })
       -> Promise<[{sura, aya, score, hits: [{src, kind, ranges? | wordFrom, wordTo}]}]> (never rejects;
          the array has .warnings [] and .partial when a part of the data could not be loaded)
     Tafsirs (the layer search/tafsir/, read only then): scope 'tafsir' (only tafsirs), scope 'selected' (the chosen
     tafsirs among `selected`), or opts.tafsir: true | [ids] with any scope. Their hits: {src, kind: 'tafsir',
     layer: 'tafsir', ayaTo? (the last ayah of the range), snippet?, ranges? (in the snippet)}.
     s.tafsirs() -> [{id, lang, script, name}], s.tafsirText(id, ayahIndex) -> {text, from, to} | null      */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./core.js'));
  else root.QuranSearch = factory(root.QuranCore);
})(typeof self !== 'undefined' ? self : this, function (core) {
  'use strict';

  var T = core.text;
  var AYAHS = 6236;
  var DEFAULT_LANGS = ['en', 'ar', 'ru', 'tr', 'uz'];
  // web/search/ is published with the site: the main branch of the public repository (not qul-data)
  var BASES = ['https://quran.abdulloh.org/', 'https://cdn.jsdelivr.net/gh/abdullohukr/quranuz@main/',
               'https://raw.githubusercontent.com/abdullohukr/quranuz/main/'];
  // the tafsir index (search/tafsir/…, ~95 MB) lives in Cloudflare R2: it is asked there first (the site and its mirrors follow)
  var TAFSIR_BASE = 'https://tafsir.abdulloh.org/';
  var MAGIC = [0x4B, 0x51, 0x53, 0x31];          // "KQS1"
  var MAX_QUERY = 200, MAX_WORDS = 12, MAX_PAIRS = 24, MAX_POSTINGS = 600000;

  /* ---------- bytes ---------- */
  function utf8(s) {
    if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s);
    var out = [];
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      if (c >= 0xD800 && c < 0xDC00 && i + 1 < s.length) { c = 0x10000 + ((c - 0xD800) << 10) + (s.charCodeAt(++i) - 0xDC00); }
      if (c < 0x80) out.push(c);
      else if (c < 0x800) out.push(0xC0 | c >> 6, 0x80 | c & 63);
      else if (c < 0x10000) out.push(0xE0 | c >> 12, 0x80 | c >> 6 & 63, 0x80 | c & 63);
      else out.push(0xF0 | c >> 18, 0x80 | c >> 12 & 63, 0x80 | c >> 6 & 63, 0x80 | c & 63);
    }
    return new Uint8Array(out);
  }
  var decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { fatal: true }) : null;
  function fromUtf8(b, from, to) {
    if (decoder) return decoder.decode(b.subarray(from, to));
    var s = '';
    for (var i = from; i < to;) {
      var c = b[i++];
      if (c >= 0xF0) c = (c & 7) << 18 | (b[i++] & 63) << 12 | (b[i++] & 63) << 6 | b[i++] & 63;
      else if (c >= 0xE0) c = (c & 15) << 12 | (b[i++] & 63) << 6 | b[i++] & 63;
      else if (c >= 0xC0) c = (c & 31) << 6 | b[i++] & 63;
      if (c >= 0x10000) { c -= 0x10000; s += String.fromCharCode(0xD800 + (c >> 10), 0xDC00 + (c & 1023)); }
      else s += String.fromCharCode(c);
    }
    return s;
  }
  function Writer() { this.b = new Uint8Array(1024); this.n = 0; }
  Writer.prototype.room = function (k) {
    if (this.n + k <= this.b.length) return;
    var nb = new Uint8Array(Math.max(this.b.length * 2, this.n + k)); nb.set(this.b.subarray(0, this.n)); this.b = nb;
  };
  Writer.prototype.u = function (v) {            // unsigned LEB128
    this.room(5);
    while (v >= 0x80) { this.b[this.n++] = v & 0x7F | 0x80; v = Math.floor(v / 128); }
    this.b[this.n++] = v;
  };
  Writer.prototype.bytes = function (a) { this.room(a.length); this.b.set(a, this.n); this.n += a.length; };
  Writer.prototype.done = function () { return this.b.slice(0, this.n); };
  function varLen(v) { var k = 1; while (v >= 0x80) { v = Math.floor(v / 128); k++; } return k; }
  function readU(b, st) {                        // st = {p}
    var v = 0, mul = 1, c;
    do {
      if (st.p >= b.length) throw new Error('chunk: truncated');
      c = b[st.p++]; v += (c & 0x7F) * mul; mul *= 128;
      if (mul > 0x800000000) throw new Error('chunk: bad number');
    } while (c & 0x80);
    return v;
  }

  /* ---------- chunks ----------
     entries: [{term, df, pairs: [ayah, src, ayah, src, ...] (any order) | null, ayahs: [ayah, ...] | null}]
     A term is written as a bitmap of ayahs (no sources) when it has more than `bitmapPairs` pairs.          */
  function cmp(a, b) { return a < b ? -1 : a > b ? 1 : 0; }
  function encodeChunk(entries, opts) {
    opts = opts || {};
    var ayahs = opts.ayahs || AYAHS, bitmapPairs = opts.bitmapPairs || 8000;
    var list = entries.slice().sort(function (x, y) { return cmp(x.term, y.term); });
    var w = new Writer(), prev = new Uint8Array(0);
    w.bytes(MAGIC);
    w.u(list.length);
    for (var i = 0; i < list.length; i++) {
      var e = list[i], tb = utf8(e.term), sh = 0;
      if (i && list[i - 1].term === e.term) throw new Error('chunk: duplicate term ' + e.term);
      while (sh < tb.length && sh < prev.length && tb[sh] === prev[sh]) sh++;
      w.u(sh); w.u(tb.length - sh); w.bytes(tb.subarray(sh));
      prev = tb;
      var body = new Writer(), mode = 0, df;
      if (e.pairs && e.pairs.length / 2 <= bitmapPairs) {
        var codes = [];
        for (var k = 0; k < e.pairs.length; k += 2) codes.push(e.pairs[k] * 65536 + e.pairs[k + 1]);
        codes.sort(function (a, b) { return a - b; });
        var last = 0, lastCode = -1, cnt = 0;
        for (var j = 0; j < codes.length; j++) {
          if (codes[j] === lastCode) continue;
          var ay = Math.floor(codes[j] / 65536), src = codes[j] % 65536;
          body.u(ay - last); body.u(src); last = ay; lastCode = codes[j]; cnt++;
        }
        df = cnt;
      } else {
        mode = 1;
        var bm = new Uint8Array(Math.ceil(ayahs / 8)), set = e.ayahs || [];
        if (e.pairs) { set = []; for (var m = 0; m < e.pairs.length; m += 2) set.push(e.pairs[m]); }
        for (var q = 0; q < set.length; q++) bm[set[q] >> 3] |= 1 << (set[q] & 7);
        body.bytes(bm);
        df = e.df || (e.pairs ? e.pairs.length / 2 : set.length);
      }
      var bb = body.done();
      w.u(df); w.u(mode); w.u(bb.length); w.bytes(bb);
    }
    return w.done();
  }

  /* -> {terms[], find(term) -> i | -1, prefix(p, max) -> [i], df(i), mode(i), postings(i) -> Uint32Array
         [ayah, src, ...] (mode 0) | ayahs(i) -> [ayah] (mode 1)}; throws on a broken chunk */
  function decodeChunk(buf, ayahs) {
    var b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
    ayahs = ayahs || AYAHS;
    for (var i = 0; i < 4; i++) if (b[i] !== MAGIC[i]) throw new Error('chunk: not a search chunk');
    var st = { p: 4 }, n = readU(b, st);
    if (n > b.length) throw new Error('chunk: bad term count');
    var terms = new Array(n), dfs = new Array(n), modes = new Array(n), offs = new Array(n), lens = new Array(n);
    var prev = new Uint8Array(0);
    for (var k = 0; k < n; k++) {
      var sh = readU(b, st), sl = readU(b, st);
      if (sh > prev.length || st.p + sl > b.length) throw new Error('chunk: bad term');
      var tb = new Uint8Array(sh + sl);
      tb.set(prev.subarray(0, sh)); tb.set(b.subarray(st.p, st.p + sl), sh);
      st.p += sl; prev = tb;
      terms[k] = fromUtf8(tb, 0, tb.length);
      dfs[k] = readU(b, st); modes[k] = readU(b, st); lens[k] = readU(b, st); offs[k] = st.p;
      if (modes[k] > 1 || st.p + lens[k] > b.length) throw new Error('chunk: bad postings');
      if (modes[k] === 0 ? dfs[k] * 2 > lens[k] : lens[k] !== Math.ceil(ayahs / 8)) throw new Error('chunk: bad postings size');
      st.p += lens[k];
    }
    function find(t) {
      var lo = 0, hi = n - 1;
      while (lo <= hi) { var m = (lo + hi) >> 1; if (terms[m] < t) lo = m + 1; else if (terms[m] > t) hi = m - 1; else return m; }
      return -1;
    }
    return {
      terms: terms, bytes: b.length,
      find: find,
      prefix: function (p, max) {
        var lo = 0, hi = n, out = [];
        while (lo < hi) { var m = (lo + hi) >> 1; if (terms[m] < p) lo = m + 1; else hi = m; }
        for (var j = lo; j < n && out.length < (max || 50) && terms[j].slice(0, p.length) === p; j++) out.push(j);
        return out;
      },
      df: function (j) { return dfs[j]; },
      mode: function (j) { return modes[j]; },
      postings: function (j) {
        var s = { p: offs[j] }, end = offs[j] + lens[j], out = new Uint32Array(dfs[j] * 2), c = 0, ay = 0;
        while (s.p < end && c < out.length) { ay += readU(b, s); out[c++] = ay; out[c++] = readU(b, s); }
        if (ay >= ayahs) throw new Error('chunk: ayah out of range');
        return c === out.length ? out : out.subarray(0, c);
      },
      ayahs: function (j) {
        var out = [];
        for (var a = 0; a < ayahs; a++) if (b[offs[j] + (a >> 3)] & 1 << (a & 7)) out.push(a);
        return out;
      }
    };
  }

  /* the group of a term: by the script of its first letter (manifest.groups[<set>-<script>]) */
  function scriptKey(term) {
    var c = term.charCodeAt(0);
    if (c >= 0xD800 && c < 0xDC00) c = 0x10000 + ((c - 0xD800) << 10) + (term.charCodeAt(1) - 0xDC00);
    return (T.scriptOf(c) || 'Zyyy').toLowerCase();
  }
  function textBlock(ayah, size) { return Math.floor(ayah / size); }

  /* ---------- an in-memory builder (tests, small indexes; the big one uses the same functions) ----------
     b = new Builder({ayahs}); b.addSource({id, lang, kind: 'tr'|'tafsir'|'translit', name, script?}, texts[6236]);
     b.finish({groups?, chunkBytes?, bitmapPairs?, text?, version?}) -> {version, manifest, files: {path: Uint8Array|string}} */
  function Builder(o) { o = o || {}; this.ayahs = o.ayahs || AYAHS; this.sources = []; this.texts = []; this.post = {}; }
  Builder.prototype.addSource = function (meta, texts) {
    var n = this.sources.length, stem = meta.lang === 'ar', post = this.post, sample = '';
    if (n >= 65535) throw new Error('too many sources');
    for (var i = 0; i < this.ayahs; i++) {
      var t = texts[i];
      if (!t) continue;
      t = core.stripHtml(t);
      if (sample.length < 2000) sample += ' ' + t;
      var seen = {}, list = T.terms(t, { stem: stem });
      for (var k = 0; k < list.length; k++) {
        var term = list[k];
        if (seen[term] || term.length > 60) continue;
        seen[term] = 1;
        (post[term] || (post[term] = [])).push(i * 65536 + n);
      }
    }
    this.sources.push({ id: meta.id, lang: meta.lang, script: meta.script || T.detectScript(sample) || 'Latn',
                        kind: meta.kind || 'tr', stem: stem ? 1 : 0, name: meta.name || meta.id, text: 1 });
    this.texts.push(texts);
    return n;
  };
  Builder.prototype.finish = function (o) {
    o = o || {};
    var self = this, chunkBytes = o.chunkBytes || 65536, bitmapPairs = o.bitmapPairs || 8000, block = o.block || 195;
    var langs = {};
    this.sources.forEach(function (s) { langs[s.lang] = 1; });
    var sets = o.groups || [{ name: 'core', langs: DEFAULT_LANGS }];
    var inSet = {};
    sets.forEach(function (g) { g.langs.forEach(function (l) { inSet[l] = 1; }); });
    Object.keys(langs).sort().forEach(function (l) { if (!inSet[l]) sets.push({ name: l, langs: [l] }); });
    if (o.all) sets.push({ name: 'all', langs: Object.keys(langs).sort() });
    var files = {}, groups = {};
    var terms = Object.keys(this.post).sort(cmp);
    sets.forEach(function (g) {
      var allowed = {};
      self.sources.forEach(function (s, n) { if (g.langs.indexOf(s.lang) >= 0) allowed[n] = 1; });
      var byScript = {}, langsOf = {};
      terms.forEach(function (term) {
        var codes = self.post[term], pairs = [], key = scriptKey(term), ls = langsOf[key] || (langsOf[key] = {});
        for (var i = 0; i < codes.length; i++) {
          var src = codes[i] % 65536;
          if (allowed[src]) { pairs.push(Math.floor(codes[i] / 65536), src); ls[self.sources[src].lang] = 1; }
        }
        if (!pairs.length) return;
        (byScript[key] || (byScript[key] = [])).push({ term: term, pairs: pairs });
      });
      Object.keys(byScript).forEach(function (sk) {
        var name = g.name + '-' + sk, list = byScript[sk], first = [], sizes = [], cur = [], size = 0;
        function flush() {
          if (!cur.length) return;
          var bin = encodeChunk(cur, { ayahs: self.ayahs, bitmapPairs: bitmapPairs });
          files[name + '/' + first.length + '.bin'] = bin;
          first.push(first.length ? cur[0].term : '');
          sizes.push(bin.length);
          cur = []; size = 0;
        }
        list.forEach(function (e) {
          var est = e.pairs.length / 2 > bitmapPairs ? Math.ceil(self.ayahs / 8) : e.pairs.length * 1.6;
          if (size && size + est > chunkBytes) flush();
          cur.push(e); size += est + e.term.length + 6;
        });
        flush();
        // the languages that really have words of this script in the group
        groups[name] = { set: g.name, langs: Object.keys(langsOf[sk]).sort(), script: sk, first: first, bytes: sizes };
      });
    });
    var docs = 0;
    if (o.text !== false) {
      this.texts.forEach(function (texts, n) {
        for (var b = 0; b * block < self.ayahs; b++) {
          var arr = [];
          for (var a = b * block; a < Math.min(self.ayahs, (b + 1) * block); a++) {
            arr.push(texts[a] ? core.stripHtml(texts[a]).replace(/\s+/g, ' ').trim() : null);
          }
          files['text/' + n + '/' + b + '.json'] = JSON.stringify(arr);
        }
      });
    }
    this.texts.forEach(function (texts) { for (var a = 0; a < self.ayahs; a++) if (texts[a]) docs++; });
    var manifest = { format: 1, ayahs: this.ayahs, docs: docs, defaultLangs: DEFAULT_LANGS, sources: this.sources,
                     groups: groups, text: o.text !== false ? { block: block, count: Math.ceil(this.ayahs / block) } : null };
    var version = o.version || hashFiles(files, JSON.stringify(manifest));
    manifest.version = version;
    var out = {};
    Object.keys(files).forEach(function (p) { out['search/v' + version + '/' + p] = files[p]; });
    out['search/v' + version + '/manifest.json'] = JSON.stringify(manifest);
    out['search/current.json'] = JSON.stringify({ version: version });
    return { version: version, manifest: manifest, files: out };
  };
  /* a layer (the tafsirs: search/<name>/, docs/search-index-format.md "The tafsir layer"):
       buildLayer('tafsir', [{id, lang, name, script?, entries: [[fromAyah, toAyah, text], ...]}], {chunkBytes?, textBytes?, version?})
       -> {version, manifest, files: {'search/<name>/v<v>/...', 'search/<name>/current.json'}}
     Entries: ayah indexes 0..ayahs-1; HTML removed, spaces collapsed, sorted, the same first ayah joined, overlaps cut.
     The terms of an entry are on its first ayah. No bitmaps: every hit keeps its source. */
  function cleanEntries(list, ayahs) {
    var out = [];
    (list || []).forEach(function (e) {
      var from = Math.floor(+e[0]), to = Math.floor(+e[1]), text = core.stripHtml(String(e[2] == null ? '' : e[2])).replace(/\s+/g, ' ').trim();
      if (!text || !(from >= 0) || from >= ayahs) return;
      out.push([from, Math.max(from, Math.min(to >= 0 ? to : from, ayahs - 1)), text]);
    });
    out.sort(function (a, b) { return a[0] - b[0]; });
    var clean = [];
    out.forEach(function (e) {
      var l = clean[clean.length - 1];
      if (l && l[0] === e[0]) { l[1] = Math.max(l[1], e[1]); l[2] += ' ' + e[2]; return; }
      if (l && l[1] >= e[0]) l[1] = e[0] - 1;
      clean.push(e);
    });
    return clean;
  }
  function buildLayer(name, list, o) {
    o = o || {};
    var ayahs = o.ayahs || AYAHS, textBytes = o.textBytes || 49152;
    var b = new Builder({ ayahs: ayahs }), files = {}, lens = new Uint8Array(list.length * ayahs), meta = [], docs = 0, langs = {};
    list.forEach(function (s, n) {
      var entries = cleanEntries(s.entries, ayahs), texts = new Array(ayahs), stem = s.lang === 'ar';
      entries.forEach(function (e) { texts[e[0]] = e[2]; lens[n * ayahs + e[0]] = lengthQ(T.terms(e[2], { stem: stem }).length); });
      b.addSource({ id: s.id, lang: s.lang, kind: 'tafsir', name: s.name, script: s.script }, texts);
      b.texts[n] = [];                               // not needed any more (memory)
      // text blocks: whole entries, about textBytes each (a larger entry is a block of its own)
      var blocks = [], spans = [], cur = [], size = 0;
      function flush() {
        if (!cur.length) return;
        files['text/' + n + '/' + blocks.length + '.json'] = JSON.stringify(cur);
        blocks.push(cur[0][0]); cur = []; size = 0;
      }
      entries.forEach(function (e) {
        var bytes = utf8(e[2]).length + 16;
        if (size && size + bytes > textBytes) flush();
        cur.push(e); size += bytes;
        if (e[1] > e[0]) spans.push(e[0], e[1] - e[0]);
      });
      flush();
      meta.push({ blocks: blocks, spans: spans, entries: entries.length });
      docs += entries.length; langs[s.lang] = 1;
      if (o.onSource) o.onSource(n, s, entries);
    });
    var built = b.finish({ groups: [{ name: name, langs: Object.keys(langs).sort() }], chunkBytes: o.chunkBytes || 65536, bitmapPairs: 1e9,
                           text: false, version: 'x' });
    Object.keys(built.files).forEach(function (p) {
      var mm = p.match(/^search\/vx\/(.+)$/);
      if (mm && mm[1] !== 'manifest.json') files[mm[1]] = built.files[p];
    });
    files['lens.bin'] = lens;
    var manifest = {
      format: 1, layer: name, lens: 1, ayahs: ayahs, docs: docs, defaultLangs: DEFAULT_LANGS,
      sources: built.manifest.sources.map(function (s, n) {
        return { id: s.id, lang: s.lang, script: s.script, kind: 'tafsir', stem: s.stem, name: s.name, text: 1,
                 blocks: meta[n].blocks, spans: meta[n].spans };
      }),
      groups: built.manifest.groups, text: { ranges: 1 }
    };
    var version = o.version || hashFiles(files, JSON.stringify(manifest));
    manifest.version = version;
    var out = {};
    Object.keys(files).forEach(function (p) { out['search/' + name + '/v' + version + '/' + p] = files[p]; });
    out['search/' + name + '/v' + version + '/manifest.json'] = JSON.stringify(manifest);
    out['search/' + name + '/current.json'] = JSON.stringify({ version: version });
    return { version: version, manifest: manifest, files: out, entries: meta.map(function (x) { return x.entries; }) };
  }
  function hashFiles(files, extra) {                // FNV-1a over the paths and bytes: the version of the index
    var h = 0x811C9DC5;
    function mix(c) { h ^= c; h = Math.imul ? Math.imul(h, 0x01000193) >>> 0 : (h * 0x01000193) >>> 0; }
    Object.keys(files).sort().forEach(function (p) {
      var f = files[p], i;
      for (i = 0; i < p.length; i++) mix(p.charCodeAt(i) & 255);
      if (typeof f === 'string') for (i = 0; i < f.length; i++) mix(f.charCodeAt(i) & 255);
      else for (i = 0; i < f.length; i++) mix(f[i]);
    });
    for (var j = 0; j < extra.length; j++) mix(extra.charCodeAt(j) & 255);
    return ('0000000' + h.toString(16)).slice(-8);
  }

  /* ---------- loading: memory LRU -> Cache API -> mirrors (own site -> jsDelivr -> raw GitHub) ---------- */
  function now() { return Date.now(); }
  function delay(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function tick() { return typeof setTimeout === 'function' ? delay(0) : Promise.resolve(); }
  /* a newer query took over: not an error of the data (no warning, no "partial") */
  function abortError() { var e = new Error('cancelled'); e.name = 'AbortError'; e.cancelled = true; return e; }
  function isAbort(e) { return !!(e && e.cancelled); }
  /* p, or null after ms (a Cache API that never answers must not stop the search); late(): called on the timeout */
  function orNull(p, ms, late) {
    return new Promise(function (resolve) {
      var tm = setTimeout(function () { if (late) late(); resolve(null); }, ms);
      Promise.resolve(p).then(function (v) { clearTimeout(tm); resolve(v); }, function () { clearTimeout(tm); resolve(null); });
    });
  }
  function onAbort(signal, fn) {
    if (!signal || !signal.addEventListener) return function () {};
    signal.addEventListener('abort', fn);
    return function () { signal.removeEventListener('abort', fn); };
  }

  function Loader(o) {
    o = o || {};
    this.fetch = o.fetch || (typeof fetch === 'function' ? function (u, init) { return fetch(u, init); } : null);
    this.bases = (o.bases || (o.base ? [].concat(o.base) : BASES)).map(function (b) { return /\/$/.test(b) ? b : b + '/'; });
    this.tafsirBase = o.tafsirBase !== undefined ? o.tafsirBase : (o.bases || o.base ? null : TAFSIR_BASE);       // only with the default mirrors (the panel passes it with its own list)
    this.timeout = o.timeout || 6000;
    this.retries = o.retries != null ? o.retries : 1;
    this.retryPause = o.retryPause != null ? o.retryPause : 400;
    this.deadMs = o.deadMs || 60000;
    this.max = o.concurrency || 4;
    this.memMax = Math.min(o.memoryBytes || 24e6, 30e6);
    this.cacheName = o.cache === false ? null : (typeof o.cache === 'string' ? o.cache : 'khatt-search-v1');
    this.cacheObj = o.cache && typeof o.cache === 'object' ? o.cache : null;
    this.mem = {}; this.order = []; this.memBytes = 0;
    this.inflight = {}; this.dead = {}; this.active = 0; this.queue = [];
    this.stats = { network: 0, cache: 0, memory: 0, failed: 0, bytes: 0 };
  }
  Loader.prototype.remember = function (key, value, bytes) {
    if (this.mem[key]) return;
    this.mem[key] = { v: value, n: bytes }; this.order.push(key); this.memBytes += bytes;
    while (this.memBytes > this.memMax && this.order.length > 1) {
      var k = this.order.shift(); this.memBytes -= this.mem[k].n; delete this.mem[k];
    }
  };
  Loader.prototype.recall = function (key) {
    var e = this.mem[key];
    if (!e) return undefined;
    var i = this.order.indexOf(key);
    if (i >= 0 && i !== this.order.length - 1) { this.order.splice(i, 1); this.order.push(key); }
    return e.v;
  };
  /* at most `max` requests at a time, in the order asked; want() false when its turn comes (every query that waited
     for it has been replaced by a newer one): it is dropped without a request and the next one goes */
  Loader.prototype.slot = function (fn, want) {
    var self = this;
    return new Promise(function (resolve, reject) {
      self.queue.push(function () {
        if (want && !want()) { reject(abortError()); return; }
        self.active++;
        var p;
        try { p = Promise.resolve(fn()); } catch (e) { p = Promise.reject(e); }
        p.then(function (v) { done(); resolve(v); }, function (e) { done(); reject(e); });
      });
      function done() { self.active--; self.pump(); }
      self.pump();
    });
  };
  Loader.prototype.pump = function () {
    while (this.active < this.max && this.queue.length) this.queue.shift()();
  };
  Loader.prototype.cache = function () {
    if (this.cacheObj) return Promise.resolve(this.cacheObj);
    if (!this.cacheName || typeof caches === 'undefined' || !caches.open) return Promise.resolve(null);
    var self = this;
    if (!this._cache) this._cache = orNull(caches.open(this.cacheName), 3000).then(function (c) { if (!c) self.cacheName = null; return c; });
    return this._cache;
  };
  Loader.prototype.noCache = function () { this.cacheObj = null; this.cacheName = null; };   // the Cache API hangs: go without it
  Loader.prototype.fetchOne = function (url) {
    var self = this, ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, timer;
    return new Promise(function (resolve, reject) {
      timer = setTimeout(function () { if (ctl) try { ctl.abort(); } catch (e) { /* ignore */ } reject(new Error('timeout')); }, self.timeout);
      var p;
      try { p = self.fetch(url, ctl ? { signal: ctl.signal } : undefined); } catch (e) { p = Promise.reject(e); }
      Promise.resolve(p).then(function (r) {
        if (!r || !r.ok) { var er = new Error('HTTP ' + (r ? r.status : '?')); er.status = r ? r.status : 0; throw er; }
        return r.arrayBuffer().then(function (ab) { return { r: r, ab: ab }; });
      }).then(function (v) { clearTimeout(timer); resolve(v); }, function (e) { clearTimeout(timer); reject(e); });
    });
  };
  /* path relative to the bases; type 'bin' | 'json'; immutable: the answer may be kept in the Cache API forever.
     One load per file, shared by everybody who asks for it. signal (AbortSignal, optional): the asker gives up — its
     promise rejects at once (an AbortError, err.cancelled); the shared load goes on while somebody else waits for it
     or its request is already running (the answer is kept for later), a queued one nobody wants any more is dropped. */
  Loader.prototype.get = function (path, type, immutable, signal) {
    var self = this, key = type + ':' + path, m = this.recall(key);
    if (signal && signal.aborted) return Promise.reject(abortError());
    if (m !== undefined) { this.stats.memory++; return Promise.resolve(m); }
    var e = this.inflight[key] || this.load(key, path, type, immutable);
    if (!signal) { e.strong++; return e.p; }
    e.users++;
    return new Promise(function (resolve, reject) {
      var over = false, off = onAbort(signal, function () { end(); reject(abortError()); });
      function end() { if (over) return false; over = true; e.users--; off(); return true; }
      e.p.then(function (v) { if (end()) resolve(v); }, function (err) {
        if (!end()) return;
        // the shared load was dropped just before this asker joined it: start it again
        if (isAbort(err) && !signal.aborted) self.get(path, type, immutable, signal).then(resolve, reject);
        else reject(err);
      });
    });
  };
  Loader.prototype.load = function (key, path, type, immutable) {
    var self = this, e = { users: 0, strong: 0 };
    function want() {                               // somebody still waits for it (else: forget it at once)
      if (e.strong > 0 || e.users > 0) return true;
      if (self.inflight[key] === e) delete self.inflight[key];
      return false;
    }
    var cacheKey = 'https://khatt-search.invalid/' + path;
    function parse(ab) {
      if (type === 'bin') return { v: new Uint8Array(ab), n: ab.byteLength * 3 };
      var text = fromUtf8(new Uint8Array(ab), 0, ab.byteLength);
      return { v: JSON.parse(text), n: text.length * 2 + 64 };
    }
    var p = (immutable ? this.cache().then(function (c) {
      return c ? orNull(c.match(cacheKey).then(function (r) { return r ? r.arrayBuffer() : null; }), 3000, function () { self.noCache(); }) : null;
    }) : Promise.resolve(null)).then(function (ab) {
      if (ab) {
        try { var got = parse(ab); self.stats.cache++; return got; }
        catch (er) { self.cache().then(function (c) { if (c && c['delete']) c['delete'](cacheKey); }); }
      }
      if (!want()) throw abortError();
      return self.network(path, want).then(function (res) {
        var got = parse(res.ab);                     // throws on broken data: the caller skips this part
        self.stats.network++; self.stats.bytes += res.ab.byteLength;
        if (immutable) self.cache().then(function (c) {
          if (c && typeof Response !== 'undefined') return c.put(cacheKey, new Response(res.ab));
        }).catch(function () { /* full storage: no cache */ });
        return got;
      });
    }).then(function (got) {
      if (self.inflight[key] === e) delete self.inflight[key];
      self.remember(key, got.v, got.n);
      return got.v;
    }, function (er) {
      if (self.inflight[key] === e) delete self.inflight[key];
      if (!isAbort(er)) self.stats.failed++;
      throw er;
    });
    p.then(null, function () { /* the askers get the error; nobody left: not an unhandled rejection */ });
    e.p = p;
    this.inflight[key] = e;
    return e;
  };
  /* the mirrors in turn (404: the next one; down / slow: the next one, and that mirror is left alone for a while);
     want(): see slot() */
  Loader.prototype.basesFor = function (path) {
    return this.tafsirBase && /^search\/tafsir\//.test(path) ? [this.tafsirBase].concat(this.bases) : this.bases;
  };
  Loader.prototype.network = function (path, want) {
    var self = this;
    if (!this.fetch) return Promise.reject(new Error('no fetch'));
    function round(attempt) {
      var all = self.basesFor(path), t = now(), live = all.filter(function (b) { return !(self.dead[b] > t); });
      if (!live.length) live = all.slice(0, 1);          // all marked down: try the first one once
      var all404 = true, lastErr = null;
      function next(k) {
        if (k >= live.length) {
          if (!all404 && attempt < self.retries) return delay(self.retryPause * (attempt + 1)).then(function () { return round(attempt + 1); });
          var e = lastErr || new Error('not loaded'); e.path = path; throw e;
        }
        var base = live[k];
        return self.slot(function () {
          // a mirror found down while this request waited in the queue: straight to the next one
          while (k + 1 < live.length && self.dead[live[k]] > now()) k++;
          base = live[k];
          return self.fetchOne(base + path).then(null, function (e) {
            // down / slow: leave it alone for a while (marked before the slot is free: the next one in the queue skips it)
            if (e.status !== 404) self.dead[base] = now() + self.deadMs;
            throw e;
          });
        }, want).then(null, function (e) {
          if (isAbort(e)) throw e;                             // nobody waits for it any more: not the mirror's fault
          lastErr = e;
          if (e.status !== 404) all404 = false;                // 404: the file is not there (yet)
          return next(k + 1);                                  // either way: the next mirror
        });
      }
      return next(0);
    }
    return round(0);
  };

  /* ---------- the query ---------- */
  function cleanQuery(q) {
    q = String(q == null ? '' : q).replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
    return q.length > MAX_QUERY ? q.slice(0, MAX_QUERY) : q;
  }
  /* query words: [{forms: [{t, stem}], need: [term] (pairs: all of them), prefix}] */
  function queryWords(q, prefixLast) {
    var words = T.queryTerms(q).slice(0, MAX_WORDS), pairs = 0, out = [];
    words.forEach(function (w, i) {
      if (w.pairs) {
        w.pairs.forEach(function (p) { if (pairs++ < MAX_PAIRS) out.push({ t: p, stem: p, prefix: false, pair: true }); });
      } else out.push({ t: w.t, stem: w.stem, prefix: prefixLast && i === words.length - 1 && w.t.length >= 3, pair: false });
    });
    return out;
  }
  function scriptOfQuery(q) { return T.detectScript(q); }

  /* text normalised for a phrase check / highlighting: stem: the Arabic-language variant */
  function normFor(s, stem) {
    return T.tokenize(s).map(function (t) { return t.pairs ? t.t : stem && T.scriptOf(t.t.charCodeAt(0)) === 'Arab' ? T.arStem(t.t) : t.t; }).join(' ');
  }
  function phraseIn(text, q, stem) {
    var nq = normFor(q, stem);
    if (!nq) return false;
    var nt = ' ' + normFor(text, stem) + ' ';
    return nt.indexOf(' ' + nq) >= 0 || /[^\s]/.test(nq) && T.tokenize(q).some(function (t) { return t.pairs; }) && nt.indexOf(nq) >= 0;
  }

  /* [[start, end]] of the query words in text (original offsets), for any script */
  function highlight(text, q, script) {
    text = String(text || '');
    var toks = T.tokenize(text, true), qw = T.queryTerms(cleanQuery(q)), ranges = [];
    if (!qw.length) return [];
    var stem = script === 'Arab' || script === 'ar';
    qw.forEach(function (w, wi) {
      var last = wi === qw.length - 1;
      toks.forEach(function (tk) {
        if (w.pairs || tk.pairs) {
          var from = 0, p;
          while ((p = tk.t.indexOf(w.t, from)) >= 0) {
            ranges.push([tk.a[p], tk.b[p + w.t.length - 1]]);
            from = p + Math.max(1, w.t.length);
          }
          return;
        }
        var ok = tk.t === w.t || last && w.t.length >= 3 && tk.t.slice(0, w.t.length) === w.t;
        if (!ok && T.scriptOf(tk.t.charCodeAt(0)) === 'Arab') ok = T.arStem(tk.t) === w.stem && (stem || w.stem.length >= 3);
        if (ok) ranges.push([tk.a[0], tk.b[tk.t.length - 1]]);
      });
    });
    ranges.sort(function (x, y) { return x[0] - y[0] || x[1] - y[1]; });
    var out = [];
    ranges.forEach(function (r) {
      var l = out[out.length - 1];
      if (l && r[0] <= l[1]) l[1] = Math.max(l[1], r[1]); else out.push([r[0], r[1]]);
    });
    return out;
  }

  /* groups to read for the terms of one script: the cheapest that cover the wanted languages */
  function pickGroups(manifest, script, langs) {
    var want = {}, left = 0, cands = [];
    langs.forEach(function (l) { if (!want[l]) { want[l] = 1; left++; } });
    Object.keys(manifest.groups || {}).forEach(function (name) {
      var g = manifest.groups[name];
      if (g.script !== script) return;
      var hit = g.langs.filter(function (l) { return want[l]; }).length;
      if (!hit) return;
      var avg = g.bytes && g.bytes.length ? g.bytes.reduce(function (a, b) { return a + b; }, 0) / g.bytes.length : 32768;
      // a request + its bytes + the share of languages nobody asked for
      cands.push({ name: name, g: g, cost: 1 + avg / 65536 + 0.5 * (g.langs.length - hit) / g.langs.length });
    });
    var exist = {};
    cands.forEach(function (c) { c.g.langs.forEach(function (l) { if (want[l]) exist[l] = 1; }); });
    left = Object.keys(exist).length;
    var out = [], covered = {};
    while (left > 0) {
      var best = null, bestV = 0;
      cands.forEach(function (c) {
        var gain = c.g.langs.filter(function (l) { return exist[l] && !covered[l]; }).length;
        if (gain && gain / c.cost > bestV) { bestV = gain / c.cost; best = c; }
      });
      if (!best) break;
      best.g.langs.forEach(function (l) { if (exist[l] && !covered[l]) { covered[l] = 1; left--; } });
      out.push(best.name);
      cands.splice(cands.indexOf(best), 1);
    }
    return out;
  }
  function chunkOf(group, term) {                   // last chunk whose first term <= term
    var f = group.first, lo = 0, hi = f.length - 1;
    while (lo < hi) { var m = (lo + hi + 1) >> 1; if (f[m] <= term) lo = m; else hi = m - 1; }
    return lo;
  }

  /* ---------- the client ---------- */
  function Search(o) {
    if (!(this instanceof Search)) return new Search(o);
    o = o || {};
    this.o = o;
    this.loader = new Loader(o);
    this.version = o.version || null;
    this.root = o.root || 'search/';
  }
  Search.prototype.manifest = function () {
    var self = this;
    if (this._manifest) return Promise.resolve(this._manifest);
    var v = this.version ? Promise.resolve(this.version) : this.loader.get(this.root + 'current.json', 'json', false).then(function (c) {
      if (!c || !c.version || !/^[\w.-]{1,64}$/.test(c.version)) throw new Error('bad current.json');
      return c.version;
    });
    return v.then(function (ver) {
      return self.loader.get(self.root + 'v' + ver + '/manifest.json', 'json', true).then(function (m) {
        if (!m || m.format !== 1 || !m.sources || !m.groups) throw new Error('bad manifest');
        m.version = ver;
        self._manifest = m; self.version = ver;
        return m;
      });
    });
  };
  /* the tafsir layer (and any other one): search/<name>/current.json -> search/<name>/v<v>/manifest.json, read only
     when a run asks for it; m._base is its folder, m._layer its name. A failure is not kept: the next run tries again. */
  Search.prototype.layer = function (name) {
    var self = this, L = this._layers || (this._layers = {}), dir = this.root + name + '/';
    if (L[name]) return L[name].m ? Promise.resolve(L[name].m) : L[name].p;
    var e = L[name] = {};
    e.p = this.loader.get(dir + 'current.json', 'json', false).then(function (c) {
      if (!c || !c.version || !/^[\w.-]{1,64}$/.test(c.version)) throw new Error('bad ' + name + '/current.json');
      return self.loader.get(dir + 'v' + c.version + '/manifest.json', 'json', true).then(function (m) {
        if (!m || m.format !== 1 || !m.sources || !m.groups || m.layer !== name) throw new Error('bad ' + name + ' manifest');
        m.version = c.version; m._base = dir + 'v' + c.version + '/'; m._layer = name; m._ids = {};
        m.sources.forEach(function (s, n) { m._ids[s.id] = n; });
        if (!m.lens) { e.m = m; return m; }
        // the length of every entry (one byte per source and ayah): without it the ranking only loses the length
        return self.loader.get(m._base + 'lens.bin', 'bin', true).then(function (u8) {
          m._dl = lengths(u8, m.sources.length, m.ayahs);
        }, function () { /* without lengths */ }).then(function () { e.m = m; return m; });
      });
    });
    e.p.then(null, function () { if (L[name] === e) delete L[name]; });
    return e.p;
  };
  /* the tafsirs that can be searched: [{id, lang, script, name}] ([] when the layer cannot be read) */
  Search.prototype.tafsirs = function () {
    return this.layer('tafsir').then(function (m) {
      return m.sources.map(function (s) { return { id: s.id, lang: s.lang, script: s.script, name: s.name }; });
    }, function () { return []; });
  };
  /* the text of a tafsir of the layer at an ayah (0-based index i; the entry that starts there or covers it):
     {text, from, to} (ayah indexes) or null. For the fragments of the results the run did not give one. */
  Search.prototype.tafsirText = function (id, i, signal) {
    var self = this;
    return this.layer('tafsir').then(function (m) {
      var n = m._ids[id];
      if (n == null) return null;
      var b = blockOf(m.sources[n], i);
      if (b < 0) return null;
      return self.layerBlock(m, n, b, signal).then(function (arr) {
        var e = entryAt(arr, i);
        return e ? { text: e[2], from: e[0], to: e[1] } : null;
      });
    });
  };
  Search.prototype.layerBlock = function (m, n, b, signal) {
    return this.loader.get(m._base + 'text/' + n + '/' + b + '.json', 'json', true, signal);
  };
  /* lens.bin: byte q of (source n, ayah i) at n * ayahs + i, q = round(8 * log2(1 + words)) (0: no entry) ->
     dl(i, n): the length of the entry against the average of its source (1 when unknown) */
  function lengths(u8, sources, ayahs) {
    if (!u8 || u8.length !== sources * ayahs) return null;
    var avg = [];
    for (var n = 0; n < sources; n++) {
      var sum = 0, cnt = 0;
      for (var i = 0; i < ayahs; i++) { var q = u8[n * ayahs + i]; if (q) { sum += Math.pow(2, q / 8) - 1; cnt++; } }
      avg.push(cnt ? sum / cnt : 1);
    }
    return function (i, n) {
      var q = n < sources ? u8[n * ayahs + i] : 0;
      return q ? (Math.pow(2, q / 8) - 1) / (avg[n] || 1) : 1;
    };
  }
  function lengthQ(words) { return Math.min(255, Math.max(1, Math.round(8 * Math.log(1 + words) / Math.LN2))); }   // (the builder)
  function blockOf(s, i) {                          // the last text block whose first entry is <= ayah i
    var f = s && s.blocks;
    if (!f || !f.length || i < f[0]) return -1;
    var lo = 0, hi = f.length - 1;
    while (lo < hi) { var mid = (lo + hi + 1) >> 1; if (f[mid] <= i) lo = mid; else hi = mid - 1; }
    return lo;
  }
  function entryAt(arr, i) {                        // [from, to, text] of a block that starts at / covers ayah i
    if (!Array.isArray(arr)) return null;
    for (var k = 0; k < arr.length; k++) {
      var e = arr[k];
      if (Array.isArray(e) && e[0] <= i && i <= e[1] && typeof e[2] === 'string') return e;
    }
    return null;
  }
  function spanEnd(s, i) {                          // the last ayah of the entry that starts at ayah i
    if (!s._span) {
      s._span = {};
      for (var k = 0; s.spans && k + 1 < s.spans.length; k += 2) s._span[s.spans[k]] = s.spans[k] + s.spans[k + 1];
    }
    return s._span[i] != null ? s._span[i] : i;
  }
  /* about `max` characters of text around the place with the most marked words; ranges moved into it.
     -> {text, ranges} ("…" where the text was cut) */
  function snippet(text, ranges, max) {
    text = String(text || ''); ranges = ranges || []; max = max || 200;
    var best = 0, bestN = 0;
    for (var i = 0; i < ranges.length; i++) {
      var n = 0;
      for (var j = i; j < ranges.length && ranges[j][1] <= ranges[i][0] + max - 60; j++) n += ranges[j][1] - ranges[j][0] > 2 ? 2 : 1;
      if (n > bestN) { bestN = n; best = i; }
    }
    var first = ranges.length ? ranges[best][0] : 0, start = Math.max(0, first - 60);
    if (start > 0) { var sp = text.lastIndexOf(' ', start); if (sp >= 0 && first - sp < 120) start = sp + 1; }
    var end = Math.min(text.length, start + max);
    if (end < text.length) { var e2 = text.indexOf(' ', end); if (e2 > 0 && e2 - end < 30) end = e2; }
    var pre = start > 0 ? '…' : '', out = [];
    ranges.forEach(function (r) {
      var a = Math.max(r[0], start), b = Math.min(r[1], end);
      if (b > a) out.push([a - start + pre.length, b - start + pre.length]);
    });
    return { text: pre + text.slice(start, end) + (end < text.length ? '…' : ''), ranges: out };
  }

  Search.prototype.chunk = function (m, group, n, signal) {
    var self = this, key = 'dec:' + (m._base || '') + group + '/' + n, have = this.loader.recall(key);
    if (have) return Promise.resolve(have);
    return this.loader.get((m._base || this.root + 'v' + m.version + '/') + group + '/' + n + '.bin', 'bin', true, signal).then(function (u8) {
      var d = decodeChunk(u8, m.ayahs);
      self.loader.remember(key, d, 64 + d.terms.length * 48);
      return d;
    });
  };
  Search.prototype.block = function (m, src, b, signal) {
    return this.loader.get(this.root + 'v' + m.version + '/text/' + src + '/' + b + '.json', 'json', true, signal);
  };

  /* which sources take part */
  function chooseSources(m, opts) {
    var scope = opts.scope || 'default', langs = {}, ids = {}, kinds = null;
    (opts.selected || []).forEach(function (id) { ids[id] = 1; });
    if (opts.kinds) { kinds = {}; [].concat(opts.kinds).forEach(function (k) { kinds[k] = 1; }); }
    if (scope === 'default') {
      DEFAULT_LANGS.concat(opts.langs || [], opts.uiLang ? [opts.uiLang] : []).forEach(function (l) { langs[l] = 1; });
      m.sources.forEach(function (s) { if (ids[s.id]) langs[s.lang] = 1; });
    }
    var out = [];
    m.sources.forEach(function (s, n) {
      if (kinds && !kinds[s.kind]) return;
      if (scope === 'selected' ? ids[s.id] : scope === 'all' ? true : langs[s.lang] || ids[s.id]) out.push(n);
    });
    return out;
  }

  /* opts.signal (AbortSignal): a newer query replaces this one: from then on no onResults / onProgress, its loads nobody
     else waits for are dropped, the promise resolves at once with [] (.cancelled). opts.deadline (ms, 15000): what has
     not come by then is left out (a warning, .partial): the search always ends. */
  var K1 = 1.2, B = 0.6;
  Search.prototype.run = function (query, opts) {
    var self = this;
    opts = opts || {};
    var warnings = [], limit = Math.max(1, Math.min(opts.limit || 50, 500));
    var q = cleanQuery(query), quran = opts.quran || null, local = [], user = opts.signal || null;
    function cancelled() { return !!(user && user.aborted); }
    function progress(p) { if (opts.onProgress && !cancelled()) try { opts.onProgress(p); } catch (e) { /* the caller's problem */ } }
    function finish(list, partial) {
      list.warnings = warnings; list.partial = !!partial;
      return list;
    }
    function emit(list, stage) { if (opts.onResults && !cancelled()) try { opts.onResults(list, { stage: stage }); } catch (e) { /* the caller's problem */ } }
    if (!q) return Promise.resolve(finish([], false));
    // 1. at once: the Quran itself (reference, Arabic, transliteration) and the translations already in memory
    // (not for scope 'tafsir': the Quran's own hits would stand above every tafsir)
    if (opts.scope !== 'tafsir') try {
      if (quran && quran.searchSmart) local = quran.searchSmart(q, { limit: limit, translations: opts.localTranslations }).map(fromLocal);
      else if (quran) local = quran.search(q, opts.localTranslations || [], limit).map(function (r, k) { return { sura: r.sura, aya: r.aya, score: 20 - k / 100, hits: [{ src: 'quran', kind: 'ar' }] }; });
    } catch (e) { warnings.push('local: ' + e.message); }
    emit(local.slice(0, limit), 'local');
    progress({ stage: 'local', done: 0, total: 1 });
    if (opts.scope === 'quran') return Promise.resolve(finish(local.slice(0, limit), false));
    if (cancelled()) return Promise.resolve(gone());

    // the loads of this run: given up when the caller cancels or when the run is over (nobody needs them then)
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, signal = ctl ? ctl.signal : null;
    var t0 = now(), deadline = opts.deadline > 0 ? opts.deadline : 15000, settle = null;
    var stop = new Promise(function (resolve) { settle = resolve; });   // resolves on cancel: the run ends at once
    var unhook = onAbort(user, function () { settle(); if (ctl) ctl.abort(); });
    function gone() { var l = finish([], false); l.cancelled = true; return l; }
    function check(v) { if (cancelled()) throw abortError(); return v; }
    /* p, or an error 'slow' when the deadline of the whole run has passed */
    function within(p) {
      var left = deadline - (now() - t0);
      return new Promise(function (resolve, reject) {
        var tm = setTimeout(function () { reject(new Error('slow')); }, Math.max(0, left));
        p.then(function (v) { clearTimeout(tm); resolve(v); }, function (e) { clearTimeout(tm); reject(e); });
      });
    }
    var ctx = { signal: signal, within: within, cancelled: cancelled };

    var m, lm = null, prefixLast = !/\s$/.test(String(query == null ? '' : query)), scope = opts.scope || 'default';
    // scope 'tafsir': only the tafsir layer (the main manifest is not needed)
    var work = (scope === 'tafsir' ? Promise.resolve(null) : within(this.manifest())).then(function (man) {
      check(); m = man;
      // the main index and the layer at the same time: a slow layer never holds the translations
      var pm = m ? self._index(q, m, opts, warnings, progress, prefixLast, ctx) : Promise.resolve([]);
      var pl = !wantsLayer(m, opts, scope) ? Promise.resolve([]) : within(self.layer('tafsir')).then(function (layer) {
        check();
        var lo = layerOpts(layer, opts, scope);
        if (!lo) return [];
        lm = layer;
        return self._index(q, lm, lo, warnings, function (p) { p.layer = 'tafsir'; progress(p); }, prefixLast, ctx)
          .then(function (l) { return tagLayer(lm, l); });
      }, function (e) {
        if (isAbort(e)) throw e;
        warnings.push('tafsir: ' + (e && e.message || e));
        return [];
      });
      return Promise.all([pm, pl]).then(function (r) { return combine(r[0], r[1]); });
    }).then(function (found) {
      check();
      // nothing in the default languages: search everywhere (not when parts of the data are missing)
      // (not for Arabic-script words the Quran itself has found: that would read every Urdu / Persian / … group)
      var widen = m && !found.length && !warnings.length && (opts.scope || 'default') === 'default' && opts.widen !== false &&
                  !(local.length && scriptOfQuery(q) === 'Arab');
      if (!widen) return found;
      var o2 = {};
      for (var k in opts) o2[k] = opts[k];
      o2.scope = 'all';
      return self._index(q, m, o2, warnings, progress, prefixLast, ctx);
    }).then(function (found) {
      check();
      var list = merge(local, found, limit);
      emit(clean(list.slice(0, limit), true), 'index');
      // the phrase check of the translations and the fragments of the tafsirs load their texts at the same time
      return Promise.all([m ? self._confirm(q, m, list, opts, warnings, ctx) : list,
                          lm ? self._snippets(q, lm, list, opts, warnings, ctx) : null]).then(function () {
        list.sort(function (x, y) { return y.score - x.score || x.sura - y.sura || x.aya - y.aya; });
        return list;
      });
    }).then(function (list) {
      check();
      list = clean(list.slice(0, limit), false);
      emit(list, 'final');
      progress({ stage: 'done', done: 1, total: 1 });
      return finish(list, warnings.length > 0);
    }, function (e) {
      if (isAbort(e) || cancelled()) return gone();
      warnings.push('index: ' + (e && e.message || e));
      var list = local.slice(0, limit);
      emit(list, 'final');
      return finish(list, true);
    }).then(null, function (e) {                       // never rejects
      if (cancelled()) return gone();
      warnings.push('search: ' + (e && e.message || e));
      return finish(local.slice(0, limit), true);
    });
    return Promise.race([work, stop.then(gone)]).then(function (list) {
      unhook(); if (ctl) ctl.abort();                  // over: the loads only this run waited for are dropped
      return list;
    });
  };

  /* searchSmart score -> the scale of the index scores (Arabic of the Quran above everything else) */
  function fromLocal(r) {
    var s = r.score, t = core.SEARCH_TIERS;
    var score = s >= t.ref ? 100 + (s - t.ref) / 10 : s >= t.part ? 30 + (s - 500) / 20 : s >= t.trAll ? 12 + (s - t.trAll) / 10 : 3 + (s - t.translit) / 8;
    return { sura: r.sura, aya: r.aya, score: Math.round(score * 100) / 100, hits: r.hits, match: r.match };
  }
  /* the tafsir layer takes part: scope 'tafsir', opts.tafsir (true | [ids]), or scope 'selected' with a chosen id that
     is not a translation of the main index. Never in the scopes 'default' / 'all' by themselves. */
  function wantsLayer(m, opts, scope) {
    if (opts.tafsir === false || opts.kinds && [].concat(opts.kinds).indexOf('tafsir') < 0) return false;
    if (scope === 'tafsir' || opts.tafsir === true || Array.isArray(opts.tafsir) && opts.tafsir.length) return true;
    if (scope !== 'selected') return false;
    var kind = {};
    if (m) m.sources.forEach(function (s) { kind[s.id] = s.kind; });
    return (opts.selected || []).some(function (id) { return kind[id] == null || kind[id] === 'tafsir'; });
  }
  /* the options of the run over the layer (scope 'selected' with its tafsirs), or null when none of them is wanted */
  function layerOpts(lm, opts, scope) {
    var ids = {}, list = [], t = opts.tafsir;
    function add(id) { if (lm._ids[id] != null && !ids[id]) { ids[id] = 1; list.push(id); } }
    if (Array.isArray(t)) t.forEach(add);
    else if (t === true || scope === 'tafsir') lm.sources.forEach(function (s) { add(s.id); });
    if (scope === 'selected') (opts.selected || []).forEach(add);
    if (!list.length) return null;
    var o = {};
    for (var k in opts) o[k] = opts[k];
    o.scope = 'selected'; o.selected = list; o.kinds = null;
    return o;
  }
  /* the hits of the layer: marked (their _n is a source of the layer), with the last ayah of a range */
  function tagLayer(lm, list) {
    list.forEach(function (r) {
      (r.hits || []).forEach(function (h) {
        h._lm = 1; h.layer = lm._layer;
        var s = lm.sources[h._n], to = s ? spanEnd(s, r._i) : r._i;
        if (to > r._i) h.ayaTo = r.aya + (to - r._i);
      });
    });
    return list;
  }
  /* the results of the main index and of the layer, one per ayah (the main index first among the hits; a tafsir
     that is in both, like the Uzbek ones: the hit of the layer, which has the text) */
  function combine(a, b) {
    if (!b.length) return a;
    if (!a.length) return b;
    var by = {}, out = [];
    a.concat(b).forEach(function (r) {
      var e = by[r._i];
      if (!e) { by[r._i] = e = { sura: r.sura, aya: r.aya, score: r.score, hits: r.hits.slice(), _i: r._i, _all: r._all }; out.push(e); return; }
      var same = r.hits.length && e.hits.length && r.hits.every(function (h) { return e.hits.some(function (x) { return x.src === h.src; }); });
      e.score = Math.round((same ? Math.max(e.score, r.score) : Math.max(e.score, r.score) + 0.1) * 100) / 100;
      r.hits.forEach(function (h) {
        for (var k = 0; k < e.hits.length; k++) if (e.hits[k].src === h.src) { e.hits[k] = h; return; }
        e.hits.push(h);
      });
    });
    out.sort(function (x, y) { return y.score - x.score || x._i - y._i; });
    return out.slice(0, 200);
  }
  function merge(local, found, limit) {
    var by = {}, out = [];
    local.concat(found).forEach(function (r) {
      var k = r.sura + ':' + r.aya, e = by[k];
      if (!e) { by[k] = e = { sura: r.sura, aya: r.aya, score: r.score, hits: r.hits.slice(), _i: r._i }; out.push(e); return; }
      if (e._i == null) e._i = r._i;
      e.score = Math.max(e.score, r.score) + 0.5;      // found both in the Quran and in the translations
      r.hits.forEach(function (h) { if (!e.hits.some(function (x) { return x.src === h.src; })) e.hits.push(h); });
    });
    out.sort(function (x, y) { return y.score - x.score || x.sura - y.sura || x.aya - y.aya; });
    return out.slice(0, Math.max(limit, 50));
  }

  /* copies without the internal fields (copy: for the intermediate results, the final ones are cleaned in place) */
  function clean(list, copy) {
    return list.map(function (r) {
      var o = copy ? { sura: r.sura, aya: r.aya, score: r.score, hits: [] } : r;
      var hits = (r.hits || []).map(function (h) {
        var x = {};
        for (var k in h) if (k.charAt(0) !== '_') x[k] = h[k];
        return x;
      });
      o.hits = hits;
      if (!copy) { delete r._i; delete r._all; }
      return o;
    });
  }

  Search.prototype._index = function (q, m, opts, warnings, progress, prefixLast, ctx) {
    var self = this, srcs = chooseSources(m, opts);
    ctx = ctx || { signal: null, within: function (p) { return p; }, cancelled: function () { return false; } };
    if (!srcs.length) return Promise.resolve([]);
    var allowed = {}, needStem = false, needFull = false;
    srcs.forEach(function (n) { var st = !!m.sources[n].stem; allowed[n] = st ? 2 : 1; if (st) needStem = true; else needFull = true; });
    var langs = {};
    srcs.forEach(function (n) { langs[m.sources[n].lang] = 1; });
    langs = Object.keys(langs);
    var results = {};
    // the query as typed first; the other alphabet (Latin <-> Cyrillic) only when that found little
    function runVariant(v) {
      var jobs = {}, words = queryWords(v.q, prefixLast && opts.prefix !== false);
      words.forEach(function (w) {
        var forms = [];
        if (needFull) forms.push(w.t);
        if (needStem && forms.indexOf(w.stem) < 0) forms.push(w.stem);
        w.at = [];
        forms.forEach(function (t) {
          pickGroups(m, scriptKey(t), langs).forEach(function (g) {
            var gr = m.groups[g], n = chunkOf(gr, t), key = g + '/' + n;
            jobs[key] = jobs[key] || { g: g, n: n };
            w.at.push({ t: t, key: key });
            // a part of a word: its longer forms may begin in the next chunks (at most 2 more)
            for (var nx = n + 1; w.prefix && nx <= n + 2 && nx < gr.first.length && gr.first[nx].slice(0, t.length) === t; nx++) {
              key = g + '/' + nx;
              jobs[key] = jobs[key] || { g: g, n: nx };
              w.at.push({ t: t, key: key });
            }
          });
        });
      });
      var keys = Object.keys(jobs), chunks = {}, done = 0;
      progress({ stage: 'chunks', done: 0, total: keys.length });
      return Promise.all(keys.map(function (k) {
        return ctx.within(self.chunk(m, jobs[k].g, jobs[k].n, ctx.signal)).then(function (d) { chunks[k] = d; }, function (e) {
          if (!isAbort(e)) warnings.push('chunk ' + k + ': ' + (e && e.message || e));
        }).then(function () { progress({ stage: 'chunks', done: ++done, total: keys.length }); });
      })).then(tick).then(function () {
        if (ctx.cancelled()) throw abortError();
        scoreVariant({ v: v, words: words }, chunks, m, allowed, opts, results);
      });
    }
    function good() { var n = 0; for (var k in results) n++; return n; }
    var step = runVariant({ q: q, w: 1 }), sc = scriptOfQuery(q), other = null;
    if (sc === 'Latn' && /[a-z]/i.test(q)) other = T.latToCyr(q);
    if (sc === 'Cyrl') other = T.cyrToLat(q);
    if (other && T.norm(other) !== T.norm(q)) step = step.then(function () { if (good() < 3) return runVariant({ q: other, w: 0.8 }); });
    return step.then(function () {
      var list = Object.keys(results).map(function (k) { return results[k]; });
      list.sort(function (x, y) { return y.score - x.score || x.i - y.i; });
      return list.slice(0, 200).map(function (r) {
        var loc = opts.quran ? opts.quran.locate(r.i) : locate(r.i);
        return { sura: loc.sura, aya: loc.aya, score: Math.round(r.score * 100) / 100, hits: r.hits, _i: r.i, _all: r.all };
      });
    });
  };

  var SURA_AYAHS = null;
  function locate(i) {                              // without a Quran object: the standard ayah counts
    if (!SURA_AYAHS) SURA_AYAHS = [7, 286, 200, 176, 120, 165, 206, 75, 129, 109, 123, 111, 43, 52, 99, 128, 111, 110, 98, 135, 112, 78, 118, 64, 77, 227, 93, 88, 69, 60, 34, 30, 73, 54, 45, 83, 182, 88, 75, 85, 54, 53, 89, 59, 37, 35, 38, 29, 18, 45, 60, 49, 62, 55, 78, 96, 29, 22, 24, 13, 14, 11, 11, 18, 12, 12, 30, 52, 52, 44, 28, 28, 20, 56, 40, 31, 50, 40, 46, 42, 29, 19, 36, 25, 22, 17, 19, 26, 30, 20, 15, 21, 11, 8, 8, 19, 5, 8, 8, 11, 11, 8, 3, 9, 5, 4, 7, 3, 6, 3, 5, 4, 5, 6];
    var s = 0;
    while (s < 113 && i >= SURA_AYAHS[s]) { i -= SURA_AYAHS[s]; s++; }
    return { sura: s + 1, aya: i + 1 };
  }

  /* BM25 without term frequencies (a term is in an ayah of a source or not; the ayah length from the Arabic text).
     An (ayah, source) needs every word, or with three words or more the words that carry half of the weight (idf).
     Memory stays small: only the postings of the rarest words make candidates, the frequent ones only add to them. */
  function scoreVariant(p, chunks, m, allowed, opts, results) {
    var words = p.words.slice(0, 30), nW = words.length;
    if (!nW) return;
    var N = m.docs || m.ayahs * m.sources.length, total = 0, budget = MAX_POSTINGS, idf = [], lists = [];
    var W = opts.quran && opts.quran._words ? opts.quran._words() : null, avg = 0;
    if (W) { W.tables(); for (var a = 0; a < W.len.length; a++) avg += W.len[a]; avg /= W.len.length; }
    words.forEach(function (w, j) {
      var df = 0, ls = [];
      w.at.forEach(function (at) {
        var d = chunks[at.key];
        if (!d) return;
        var ids = w.prefix ? d.prefix(at.t, 40) : [], exact = d.find(at.t);
        if (exact >= 0 && ids.indexOf(exact) < 0) ids.unshift(exact);
        ids.forEach(function (id) {
          df += d.df(id);
          ls.push({ d: d, id: id, exact: id === exact, full: at.t === w.t, stem: at.t === w.stem });
        });
      });
      idf[j] = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      total += idf[j];
      lists[j] = { ls: ls, df: df };
    });
    if (!total) return;
    var strict = nW <= 2;
    // the words that make candidates: the rarest ones, until the rest weigh less than half (all: the rarest one)
    var order = words.map(function (w, j) { return j; }).sort(function (x, y) { return lists[x].df - lists[y].df; });
    var makes = {}, rest = total;
    for (var o = 0; o < order.length; o++) {
      if (strict ? o > 0 : rest < total * 0.5) break;
      makes[order[o]] = 1; rest -= idf[order[o]];
    }
    var cand = typeof Map !== 'undefined' ? new Map() : null, candObj = cand ? null : {};
    var pre = {}, anyMask = new Array(m.ayahs), anyPre = {};
    function get(c) { return cand ? cand.get(c) : candObj[c]; }
    function set(c, v) { if (cand) cand.set(c, v); else candObj[c] = v; }
    order.forEach(function (j) {
      var bit = 1 << j;
      lists[j].ls.forEach(function (l) {
        if (l.d.mode(l.id) === 1) {
          l.d.ayahs(l.id).forEach(function (ay) { anyMask[ay] = (anyMask[ay] | 0) | bit; if (!l.exact) anyPre[ay] = (anyPre[ay] | 0) | bit; });
          return;
        }
        if (budget <= 0) return;
        var ps = l.d.postings(l.id);
        budget -= ps.length / 2;
        for (var k = 0; k < ps.length; k += 2) {
          var src = ps[k + 1], kind = allowed[src];
          if (!kind || (kind === 2 ? !l.stem : !l.full)) continue;
          var code = ps[k] * 65536 + src, v = get(code);
          if (v === undefined && !makes[j]) continue;
          set(code, (v | 0) | bit);
          if (!l.exact) pre[code] = (pre[code] | 0) | bit;
        }
      });
    });
    var fullMask = nW >= 31 ? -1 : (1 << nW) - 1;
    function weigh(mask, pmask) {
      var sc = 0, cnt = 0;
      for (var j = 0; j < nW; j++) if (mask & 1 << j) { cnt++; sc += idf[j] * (pmask & 1 << j ? 0.7 : 1); }
      return { sc: sc, cnt: cnt };
    }
    var per = {};
    function consider(i, src, mask, pmask) {
      var w = weigh(mask, pmask), whole = (mask & fullMask) === fullMask;
      if (!whole && (strict || w.sc < total * 0.5)) return;
      // the length: of the entry (the tafsir layer: lens.bin), else of the Arabic ayah
      var len = m._dl && src >= 0 ? m._dl(i, src) : W ? W.len[i] / (avg || 1) : 1, norm = (K1 + 1) / (1 + K1 * (1 - B + B * len));
      var s = src >= 0 ? m.sources[src] : null, v = w.sc * norm * (whole ? 1 : 0.8 * w.sc / total);
      if (s && s.kind === 'tafsir') v *= 0.5;
      if (s && opts.prefer && opts.prefer.indexOf(s.id) >= 0) v += 0.5;
      var e = per[i] || (per[i] = { best: 0, full: 0, hits: [] });
      if (whole) e.full++;
      if (v > e.best) e.best = v;
      if (s) e.hits.push({ src: s.id, kind: s.kind, _n: src, v: v });
    }
    function each(fn) { if (cand) cand.forEach(function (v, c) { fn(c, v); }); else for (var c in candObj) fn(+c, candObj[c]); }
    each(function (code, mask) {
      var i = Math.floor(code / 65536);
      consider(i, code % 65536, mask | (anyMask[i] | 0), (pre[code] | 0) | (anyPre[i] | 0));
    });
    for (var i = 0; i < m.ayahs; i++) if (anyMask[i] && !per[i]) consider(i, -1, anyMask[i], anyPre[i] | 0);
    Object.keys(per).forEach(function (key) {
      var i = +key, e = per[key];
      if (!e.best) return;
      e.hits.sort(function (x, y) { return y.v - x.v; });
      var score = (e.best + 0.1 * Math.log(1 + e.full)) * p.v.w, r = results[i];
      if (!r || score > r.score) {
        results[i] = { i: i, score: score, all: e.full,
                       hits: e.hits.slice(0, 8).map(function (h) { return { src: h.src, kind: h.kind, _n: h._n }; }) };
      }
    });
  }

  /* the phrase in the text of the best sources of the first results: +2, and the ranges to highlight */
  Search.prototype._confirm = function (q, m, list, opts, warnings, ctx) {
    var within = ctx ? ctx.within : function (p) { return p; }, signal = ctx ? ctx.signal : null;
    var self = this, top = list.slice(0, opts.confirm != null ? opts.confirm : 10), maxBlocks = opts.maxBlocks || 2;
    if (!m.text || !top.length) return Promise.resolve(list);
    var want = {}, order = [];
    top.forEach(function (r) {
      // translations first: their blocks are small, a tafsir block can be large
      // (the hits of the tafsir layer are not of this manifest: _snippets)
      var own = (r.hits || []).filter(function (h) { return !h._lm; });
      var hs = own.filter(function (h) { return h.kind !== 'tafsir'; }).concat(own.filter(function (h) { return h.kind === 'tafsir'; }));
      hs.slice(0, 2).forEach(function (h) {
        if (h._n == null || !m.sources[h._n] || !m.sources[h._n].text) return;
        var b = textBlock(r._i, m.text.block), key = h._n + '/' + b;
        if (!want[key]) { want[key] = { src: h._n, b: b }; order.push(key); }
      });
    });
    order = order.slice(0, maxBlocks);
    var blocks = {};
    return Promise.all(order.map(function (k) {
      return within(self.block(m, want[k].src, want[k].b, signal)).then(function (arr) { if (Array.isArray(arr)) blocks[k] = arr; },
        function (e) { if (!isAbort(e)) warnings.push('text ' + k + ': ' + (e && e.message || e)); });
    })).then(function () {
      var multi = T.tokenize(q).length > 1 || T.tokenize(q).some(function (t) { return t.pairs; });
      list.forEach(function (r) {
        var confirmed = false;
        (r.hits || []).forEach(function (h) {
          if (h._n == null || h._lm) return;
          var s = m.sources[h._n], b = textBlock(r._i, m.text.block), arr = blocks[h._n + '/' + b];
          var text = arr && arr[r._i - b * m.text.block];
          if (typeof text !== 'string') return;
          h.ranges = highlight(text, q, s.stem ? 'ar' : s.script);
          if (multi && !confirmed && phraseIn(text, q, !!s.stem)) confirmed = true;
        });
        if (confirmed) r.score = Math.round((r.score + 2) * 100) / 100;
      });
      list.sort(function (x, y) { return y.score - x.score || x.sura - y.sura || x.aya - y.aya; });
      return list;
    }).then(null, function (e) { warnings.push('confirm: ' + e.message); return list; });
  };

  /* the tafsir hits of the first results: the text of their entry (blocks of the layer, at most opts.maxTafsirBlocks,
     4) -> h.snippet (about opts.snippet characters, 200, around the most marked words) and h.ranges in it; the phrase
     in the tafsir: +1 */
  Search.prototype._snippets = function (q, lm, list, opts, warnings, ctx) {
    var within = ctx ? ctx.within : function (p) { return p; }, signal = ctx ? ctx.signal : null;
    var self = this, top = list.slice(0, opts.confirm != null ? opts.confirm : 10), maxBlocks = opts.maxTafsirBlocks || 4;
    var want = {}, order = [];
    top.forEach(function (r) {
      (r.hits || []).filter(function (h) { return h._lm && h._n != null; }).slice(0, 2).forEach(function (h) {
        var b = blockOf(lm.sources[h._n], r._i), key = h._n + '/' + b;
        if (b >= 0 && !want[key]) { want[key] = { n: h._n, b: b }; order.push(key); }
      });
    });
    order = order.slice(0, maxBlocks);
    if (!order.length) return Promise.resolve(list);
    var blocks = {};
    return Promise.all(order.map(function (k) {
      return within(self.layerBlock(lm, want[k].n, want[k].b, signal)).then(function (arr) {
        if (Array.isArray(arr)) blocks[k] = arr; else warnings.push('tafsir text ' + k + ': not a list');
      }, function (e) { if (!isAbort(e)) warnings.push('tafsir text ' + k + ': ' + (e && e.message || e)); });
    })).then(function () {
      var multi = T.tokenize(q).length > 1 || T.tokenize(q).some(function (t) { return t.pairs; });
      var sq = scriptOfQuery(q), other = sq === 'Latn' && /[a-z]/i.test(q) ? T.latToCyr(q) : sq === 'Cyrl' ? T.cyrToLat(q) : null;
      top.forEach(function (r) {
        var confirmed = false;
        (r.hits || []).forEach(function (h) {
          if (!h._lm || h._n == null || h.snippet != null) return;
          var s = lm.sources[h._n], e = entryAt(blocks[h._n + '/' + blockOf(s, r._i)], r._i);
          if (!e) return;
          var sc = s.stem ? 'ar' : s.script, rg = highlight(e[2], q, sc);
          if (!rg.length && other) rg = highlight(e[2], other, sc);      // found with the other alphabet
          var sn = snippet(e[2], rg, opts.snippet || 200);
          h.snippet = sn.text; h.ranges = sn.ranges;
          if (e[1] > e[0]) h.ayaTo = r.aya + (e[1] - r._i);
          if (multi && !confirmed && (phraseIn(e[2], q, !!s.stem) || other && phraseIn(e[2], other, !!s.stem))) confirmed = true;
        });
        if (confirmed) r.score = Math.round((r.score + 1) * 100) / 100;
      });
      return list;
    }).then(null, function (e) { warnings.push('tafsir texts: ' + e.message); return list; });
  };

  return {
    Search: Search, Builder: Builder, Loader: Loader, buildLayer: buildLayer,
    encodeChunk: encodeChunk, decodeChunk: decodeChunk, scriptKey: scriptKey, chunkOf: chunkOf, pickGroups: pickGroups,
    highlight: highlight, phraseIn: phraseIn, snippet: snippet, lengthQ: lengthQ, norm: T.norm, terms: T.terms, queryTerms: T.queryTerms, detectScript: T.detectScript,
    DEFAULT_LANGS: DEFAULT_LANGS, BASES: BASES, TAFSIR_BASE: TAFSIR_BASE, AYAHS: AYAHS,
    limits: { query: MAX_QUERY, words: MAX_WORDS, pairs: MAX_PAIRS, postings: MAX_POSTINGS }
  };
});
