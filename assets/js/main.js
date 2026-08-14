(function () {
  'use strict';

  /* ============ LANGUAGE (select dropdown) ============ */
  var STORAGE_LANG = 'circusar-lang';
  var langSelect = document.getElementById('lang-select');

  function applyLang(lang) {
    document.documentElement.setAttribute('lang', lang);
    var nodes = document.querySelectorAll('[data-en]');
    nodes.forEach(function (el) {
      var val = el.getAttribute('data-' + lang);
      if (val !== null) el.innerHTML = val;
    });
    document.title = lang === 'tr' ? 'Circusar — Basın Kiti' : 'Circusar — Press Kit';
    localStorage.setItem(STORAGE_LANG, lang);
    if (langSelect) langSelect.value = lang;
  }

  var savedLang = localStorage.getItem(STORAGE_LANG);
  var browserLang = (navigator.language || 'en').slice(0, 2) === 'tr' ? 'tr' : 'en';
  applyLang(savedLang || browserLang);

  if (langSelect) {
    langSelect.addEventListener('change', function () {
      applyLang(langSelect.value);
    });
  }

  /* ============ THEME (dark / light) ============ */
  var STORAGE_THEME = 'circusar-theme';
  var themeToggle = document.getElementById('theme-toggle');
  var root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_THEME, theme);
  }

  var savedTheme = localStorage.getItem(STORAGE_THEME);
  var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
  applyTheme(savedTheme || (prefersLight ? 'light' : 'dark'));

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      var current = root.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  /* ============ ZIP DOWNLOADS ============ */
  // Any button with data-zip-files="a.png,b.png,..." and data-zip-name="my-zip"
  // fetches those files client-side and bundles them into a single .zip download.
  document.querySelectorAll('.btn-zip').forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.getAttribute('data-state') === 'working') return;
      var files = (btn.getAttribute('data-zip-files') || '')
        .split(',')
        .map(function (f) { return f.trim(); })
        .filter(Boolean);
      var zipName = (btn.getAttribute('data-zip-name') || 'circusar-assets') + '.zip';
      if (!files.length || typeof JSZip === 'undefined') return;

      var label = btn.querySelector('span');
      var originalHTML = label ? label.innerHTML : null;
      btn.setAttribute('data-state', 'working');
      if (label) label.textContent = '…';

      var zip = new JSZip();
      Promise.all(
        files.map(function (path) {
          return fetch(path)
            .then(function (res) {
              if (!res.ok) throw new Error('Failed to fetch ' + path);
              return res.blob();
            })
            .then(function (blob) {
              var filename = path.split('/').pop();
              zip.file(filename, blob);
            });
        })
      )
        .then(function () {
          return zip.generateAsync({ type: 'blob' });
        })
        .then(function (content) {
          var url = URL.createObjectURL(content);
          var a = document.createElement('a');
          a.href = url;
          a.download = zipName;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        })
        .catch(function (err) {
          console.error('ZIP download failed:', err);
          alert('Could not build the ZIP file. Check the console for details.');
        })
        .finally(function () {
          btn.removeAttribute('data-state');
          if (label && originalHTML !== null) label.innerHTML = originalHTML;
        });
    });
  });
})();
