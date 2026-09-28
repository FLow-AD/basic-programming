/*
  script.js
  Version: 1.1
  Date: 2026-09-28
  Changes: v1.1 adds a small scroll-spy for the new sticky section rail
  (.sidenav .toc a): highlights the link for whichever <h2 id="..."> is
  currently in view, using IntersectionObserver, with a no-op fallback
  if that API or the rail isn't present on the page. No behaviour change
  for pages without a .sidenav (e.g. index.html).
  v1.0: First version. Only job is the light/dark theme toggle button;
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

  var railLinks = document.querySelectorAll('.sidenav .toc a[href^="#"]');
  if (railLinks.length && 'IntersectionObserver' in window) {
    var linkByHash = {};
    railLinks.forEach(function (a) {
      linkByHash[a.getAttribute('href')] = a;
    });
    var sections = [];
    railLinks.forEach(function (a) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) sections.push(target);
    });
    var setActive = function (hash) {
      railLinks.forEach(function (a) { a.classList.remove('on'); });
      var link = linkByHash[hash];
      if (link) link.classList.add('on');
    };
    var observer = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (e) { return e.isIntersecting; });
      if (visible.length) {
        visible.sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
        setActive('#' + visible[0].target.id);
      }
    }, { rootMargin: '-88px 0px -70% 0px', threshold: 0 });
    sections.forEach(function (s) { observer.observe(s); });
  }
})();
