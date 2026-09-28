/*
  script.js
  Version: 1.0
  Date: 2026-09-28
  Changes: First version. Only job is the light/dark theme toggle button;
  the predict-then-reveal snippets use native <details> and need no JS.
*/
(function () {
  'use strict';

  var KEY = 'iec304-theme';
  var root = document.documentElement;
  var btn = document.querySelector('.theme-toggle');

  function apply(theme) {
    if (theme === 'light' || theme === 'dark') {
      root.setAttribute('data-theme', theme);
    } else {
      root.removeAttribute('data-theme');
    }
    if (btn) {
      var isDark = theme === 'dark' ||
        (!theme && window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches);
      btn.textContent = isDark ? 'Mode terang' : 'Mode gelap';
      btn.setAttribute('aria-pressed', theme === 'dark' ? 'true' : 'false');
    }
  }

  var saved = null;
  try {
    saved = window.localStorage.getItem(KEY);
  } catch (e) {
    /* private browsing or storage blocked: fall back to system theme */
  }
  apply(saved);

  if (btn) {
    btn.addEventListener('click', function () {
      var current = root.getAttribute('data-theme');
      var systemDark = window.matchMedia &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
      var currentlyDark = current === 'dark' || (!current && systemDark);
      var next = currentlyDark ? 'light' : 'dark';
      apply(next);
      try {
        window.localStorage.setItem(KEY, next);
      } catch (e) {
        /* ignore: theme just won't persist across visits */
      }
    });
  }
})();
