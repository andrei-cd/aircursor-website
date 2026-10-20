// AirCursor site behaviour. Every page works without this file; it only adds polish.
(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile nav: the menu button shows and hides the page links
  document.querySelectorAll('.ac-nav').forEach(function (nav) {
    var button = nav.querySelector('.ac-nav__menu');
    if (!button) return;
    var use = button.querySelector('use');
    function setOpen(open) {
      nav.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      if (use) use.setAttribute('href', use.getAttribute('href').replace(/#.*$/, open ? '#close' : '#menu'));
    }
    button.addEventListener('click', function () { setOpen(!nav.classList.contains('is-open')); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
  });

  // Demo: pause and play the SVG loop; reduced motion stops it on a finished stroke
  var PAUSE = '<svg viewBox="0 0 14 14" aria-hidden="true"><rect x="2.5" y="1.5" width="3.2" height="11" rx="1" fill="currentColor"/><rect x="8.3" y="1.5" width="3.2" height="11" rx="1" fill="currentColor"/></svg>';
  var PLAY = '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M3.5 1.8v10.4a.6.6 0 0 0 .9.5l8.3-5.2a.6.6 0 0 0 0-1L4.4 1.3a.6.6 0 0 0-.9.5z" fill="currentColor"/></svg>';
  document.querySelectorAll('[data-ac-demo]').forEach(function (demo) {
    var button = demo.querySelector('.ac-demo__toggle');
    var video = demo.querySelector('video');
    var svg = demo.querySelector('.ac-demo__canvas > svg');
    if (!button) return;
    function isPaused() { return video ? video.paused : svg.animationsPaused(); }
    function setPaused(paused) {
      if (video) { if (paused) video.pause(); else video.play(); }
      else if (paused) svg.pauseAnimations();
      else svg.unpauseAnimations();
      button.setAttribute('aria-pressed', String(paused));
      button.setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation');
      button.innerHTML = paused ? PLAY : PAUSE;
    }
    if (!video && !(svg && svg.pauseAnimations)) { button.hidden = true; return; }
    if (reduceMotion) {
      if (svg) svg.setCurrentTime(4.8);
      setPaused(true);
    }
    button.addEventListener('click', function () { setPaused(!isPaused()); });
  });

  // Support: filter the FAQ as you type
  var search = document.querySelector('[data-ac-search]');
  if (search) {
    var items = Array.prototype.slice.call(document.querySelectorAll('.ac-faq details'));
    var empty = document.querySelector('.ac-search-empty');
    var faq = document.getElementById('faq');
    var scrolled = false;
    search.addEventListener('input', function () {
      var q = search.value.trim().toLowerCase();
      var shown = 0;
      items.forEach(function (item) {
        var match = !q || item.textContent.toLowerCase().indexOf(q) !== -1;
        item.hidden = !match;
        if (match) shown++;
        if (q && match) item.open = shown === 1;
      });
      if (empty) empty.hidden = shown > 0;
      if (q && !scrolled && faq) { faq.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' }); scrolled = true; }
      if (!q) scrolled = false;
    });
    search.form && search.form.addEventListener('submit', function (e) { e.preventDefault(); });
  }

  // Privacy: mark the section in view in the table of contents
  var tocLinks = document.querySelectorAll('.ac-legal__toc a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    tocLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        tocLinks.forEach(function (a) { a.removeAttribute('aria-current'); });
        var link = byId[entry.target.id];
        if (link) link.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-80px 0px -70% 0px' });
    Object.keys(byId).forEach(function (id) { var el = document.getElementById(id); if (el) observer.observe(el); });
  }

  // Feedback: send to Formspree in the background and show the sent state.
  // Without JavaScript the form still posts to Formspree normally.
  var form = document.querySelector('[data-ac-feedback]');
  if (form) {
    var status = form.querySelector('.ac-form__status');
    var submit = form.querySelector('[type="submit"]');
    var sent = document.querySelector('.ac-sent');
    var email = form.querySelector('[name="email"]');
    var emailField = email.closest('.ac-field');
    var emailError = emailField.querySelector('.ac-field__error');
    var mailto = form.getAttribute('data-mailto');

    function showStatus(html) { status.innerHTML = html; status.hidden = false; }
    function validEmail() {
      var ok = email.validity.valid && email.value.trim() !== '';
      emailField.classList.toggle('ac-field--error', !ok);
      email.setAttribute('aria-invalid', String(!ok));
      emailError.hidden = ok;
      return ok;
    }
    email.addEventListener('blur', function () { if (email.value) validEmail(); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.hidden = true;
      if (!validEmail()) { email.focus(); return; }
      var message = form.querySelector('[name="message"]');
      if (!message.value.trim()) { showStatus('Write a message before sending.'); message.focus(); return; }
      if (/YOUR_FORM_ID/.test(form.action)) {
        showStatus('The feedback form isn’t connected yet. Please email <a href="mailto:' + mailto + '">' + mailto + '</a> instead.');
        return;
      }
      var label = submit.textContent;
      submit.disabled = true;
      submit.textContent = 'Sending…';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (response) {
          if (!response.ok) throw new Error(String(response.status));
          form.closest('.ac-card').hidden = true;
          sent.hidden = false;
          sent.querySelector('h2').focus();
        })
        .catch(function () {
          showStatus('Your message didn’t send. Check your connection and try again, or email <a href="mailto:' + mailto + '">' + mailto + '</a>.');
        })
        .then(function () {
          submit.disabled = false;
          submit.textContent = label;
        });
    });
  }
})();
