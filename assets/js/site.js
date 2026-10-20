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

  // Reveal: fade content up the first time it scrolls into view. Elements arriving together
  // follow one another a beat apart.
  var reveals = document.querySelectorAll('[data-reveal]');
  if (reveals.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('is-revealed'); });
    } else {
      var revealer = new IntersectionObserver(function (entries) {
        var step = 0;
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          el.style.setProperty('--reveal-delay', Math.min(step++, 5) * 80 + 'ms');
          el.classList.add('is-revealed');
          revealer.unobserve(el);
          el.addEventListener('transitionend', function () { el.style.removeProperty('--reveal-delay'); }, { once: true });
        });
      }, { rootMargin: '0px 0px -10% 0px' });
      reveals.forEach(function (el) { revealer.observe(el); });
    }
  }

  // Demo: pause and play the loop (video, or an animated SVG); reduced motion stops it on a finished stroke
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
      if (video) video.currentTime = 4.75;
      else if (svg) svg.setCurrentTime(4.8);
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
  // Without JavaScript the form still posts to Formspree normally, with every field showing.
  var form = document.querySelector('[data-ac-feedback]');
  if (form) {
    var status = form.querySelector('.ac-form__status');
    var submit = form.querySelector('[type="submit"]');
    var sent = document.querySelector('.ac-sent');
    var subject = form.querySelector('[name="_subject"]');
    var email = form.querySelector('[name="email"]');
    var emailField = email.closest('.ac-field');
    var emailError = emailField.querySelector('.ac-field__error');
    var emailOptional = form.querySelector('[data-email-optional]');
    var message = form.querySelector('[name="message"]');
    var hint = document.getElementById('f-msg-hint');
    var followup = form.querySelector('[data-followup]');
    var followupBox = followup.querySelector('input');
    var mailto = form.getAttribute('data-mailto');

    // Bugs and questions need a way to reply and the setup; ideas and praise don't
    var KINDS = {
      Bug: { placeholder: 'What happened, and what did you expect?', emailRequired: true, hint: true },
      Idea: { placeholder: 'What would make AirCursor better for you?', emailRequired: false },
      Question: { placeholder: 'What would you like to know?', emailRequired: true },
      Praise: { placeholder: 'What did you make, or what do you love?', emailRequired: false }
    };

    function currentKind() { return form.querySelector('[name="kind"]:checked').value; }
    function setShown(el, shown) {
      el.hidden = !shown;
      el.querySelectorAll('input, select, textarea').forEach(function (control) { control.disabled = !shown; });
    }
    function updateFollowup() {
      var shown = email.required || email.value.trim() !== '';
      if (shown && followup.hidden) followupBox.checked = true;
      setShown(followup, shown);
    }
    function applyKind() {
      var kind = currentKind();
      var options = KINDS[kind];
      form.querySelectorAll('[data-kinds]').forEach(function (el) {
        setShown(el, el.getAttribute('data-kinds').split(' ').indexOf(kind) !== -1);
      });
      email.required = options.emailRequired;
      emailOptional.hidden = options.emailRequired;
      message.placeholder = options.placeholder;
      hint.hidden = !options.hint;
      if (options.hint) message.setAttribute('aria-describedby', hint.id);
      else message.removeAttribute('aria-describedby');
      subject.value = 'AirCursor feedback: ' + kind;
      // A required-email error doesn't apply once the email becomes optional
      if (!email.required && !email.value) clearEmailError();
      updateFollowup();
    }

    function showStatus(html) { status.innerHTML = html; status.hidden = false; }
    function setEmailError(error) {
      emailField.classList.toggle('ac-field--error', error);
      email.setAttribute('aria-invalid', String(error));
      emailError.hidden = !error;
    }
    function clearEmailError() { setEmailError(false); }
    function validEmail() {
      var value = email.value.trim();
      var ok = value === '' ? !email.required : email.validity.valid;
      setEmailError(!ok);
      return ok;
    }
    email.addEventListener('blur', function () { if (email.value) validEmail(); });
    email.addEventListener('input', updateFollowup);
    form.querySelectorAll('[name="kind"]').forEach(function (radio) { radio.addEventListener('change', applyKind); });
    applyKind();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.hidden = true;
      if (!validEmail()) { email.focus(); return; }
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
          if (!email.value.trim()) sent.querySelector('[data-sent-reply]').textContent = 'Every message is read by the person who builds AirCursor.';
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
