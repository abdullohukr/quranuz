/* Language switch for the privacy and terms pages: ?lang=…, else the app's interface language */
(function () {
  'use strict';
  var sel = document.getElementById('lang'), have = [].map.call(sel.options, function (o) { return o.value; });
  function show(l) {
    if (have.indexOf(l) < 0) l = 'en';
    sel.value = l;
    document.documentElement.lang = l;
    [].forEach.call(document.querySelectorAll('[data-l]'), function (el) {
      el.style.display = el.dataset.l === l ? (el.tagName === 'SPAN' ? 'inline' : 'block') : 'none';
    });
  }
  var lang = (location.search.match(/[?&]lang=(\w+)/) || [])[1];
  if (!lang) try { lang = (JSON.parse(localStorage.getItem('myquran-settings') || '{}').uiLang || '').split('_')[0]; } catch (e) {}
  if (!lang) lang = (navigator.language || 'en').slice(0, 2);
  sel.addEventListener('change', function () { show(sel.value); history.replaceState(null, '', '?lang=' + sel.value); });
  show(lang);
})();
