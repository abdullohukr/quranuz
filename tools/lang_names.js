/* Language names in every interface language -> web/data/langnames.json
   Run on macOS:  osascript -l JavaScript tools/lang_names.js
   Names come from the system's CLDR data (NSLocale). Uzbek gets the usual "<name> тили" form.
   Result: {native: {code: name}, ui: {uiLang: {code: name}}}                                   */
ObjC.import('Foundation');
var ROOT = $.NSFileManager.defaultManager.currentDirectoryPath.js;
function read(p) { return $.NSString.stringWithContentsOfFileEncodingError(ROOT + '/' + p, $.NSUTF8StringEncoding, null).js; }
var cat = JSON.parse(read('web/data/catalog.json'));
var codes = Object.keys(cat.languages || {});
['uz'].concat((cat.translations || []).concat(cat.tafsirs || []).map(function (x) { return x.lang; }))
  .forEach(function (c) { if (c && codes.indexOf(c) < 0) codes.push(c); });
codes.sort();
var UI = { uz: 'uz-Cyrl', uz_latn: 'uz-Latn', ar: 'ar', en: 'en', ru: 'ru', tr: 'tr', fr: 'fr', de: 'de', es: 'es',
           kk: 'kk', ky: 'ky', tg: 'tg', az: 'az', fa: 'fa', ur: 'ur', id: 'id', ms: 'ms', bn: 'bn', hi: 'hi',
           zh: 'zh-Hans', ko: 'ko', ja: 'ja' };
function name(locale, code) {
  var s = $.NSLocale.alloc.initWithLocaleIdentifier(locale).localizedStringForLanguageCode(code);
  return s.isNil() ? null : s.js;
}
function cap(s) { return s ? s.charAt(0).toLocaleUpperCase() + s.slice(1) : s; }
var out = { native: {}, ui: {} };
codes.forEach(function (c) { var n = c === 'uz' ? 'Ўзбекча' : name(c, c); if (n) out.native[c] = cap(n); });
Object.keys(UI).forEach(function (ui) {
  var m = {};
  codes.forEach(function (c) {
    var n = name(UI[ui], c);
    if (!n) return;
    if (ui === 'uz' && !/ тили$/.test(n)) n = n.replace(/ча$/, '') + ' тили';           // туркча -> Турк тили
    if (ui === 'uz_latn' && !/ tili$/.test(n)) n = n.replace(/cha$/, '') + ' tili';    // ruscha -> Rus tili
    m[c] = cap(n);
  });
  out.ui[ui] = m;
});
var json = JSON.stringify(out);
$(json).writeToFileAtomicallyEncodingError(ROOT + '/web/data/langnames.json', true, $.NSUTF8StringEncoding, null);
codes.length + ' languages, ' + json.length + ' bytes';
