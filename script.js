(() => {
  'use strict';
  document.documentElement.classList.add('js');

  /* ---------- Nav: scroll state + mobile menu ---------- */
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 12);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  links.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
  window.matchMedia('(min-width: 881px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
        el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 6) * 70}ms`;
        el.classList.add('is-visible');
        io.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------- Footer year ---------- */
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Booking form ---------- */
  const form = document.getElementById('bookingForm');
  const status = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');
  const dateInput = document.getElementById('preferredDate');

  const tomorrow = new Date(Date.now() + 864e5);
  dateInput.min = tomorrow.toISOString().split('T')[0];

  const setStatus = (msg, type) => {
    status.textContent = msg;
    status.className = `form__status${type ? ` is-${type}` : ''}`;
  };

  const validate = () => {
    let firstInvalid = null;
    form.querySelectorAll('[required]').forEach((input) => {
      const wrap = input.closest('.field');
      const ok = input.checkValidity() && input.value.trim() !== '';
      wrap.classList.toggle('is-invalid', !ok);
      if (!ok && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  };

  form.addEventListener('input', (e) => {
    const wrap = e.target.closest('.field.is-invalid');
    if (wrap && e.target.checkValidity()) wrap.classList.remove('is-invalid');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('', null);

    if (!validate()) {
      setStatus('Please complete the highlighted fields.', 'error');
      return;
    }
    if (form._gotcha.value) return; // bot

    const endpoint = form.dataset.endpoint;
    if (!endpoint) {
      setStatus('Online booking is not yet connected. Please try again later.', 'error');
      console.warn('[DPA] Set data-endpoint on #bookingForm to a Formspree (or compatible) URL.');
      return;
    }

    const data = new FormData(form);
    const interests = data.getAll('interests');
    data.delete('interests');
    data.set('interests', interests.length ? interests.join(', ') : 'Not specified');
    data.set('_subject', `Consultation request: ${data.get('company')}`);

    submitBtn.disabled = true;
    const label = submitBtn.firstChild.textContent;
    submitBtn.firstChild.textContent = 'Sending… ';

    try {
      const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.reset();
      setStatus('Thank you. Your request has been received and our team will be in touch shortly to schedule your consultation.', 'success');
    } catch (err) {
      console.error('[DPA] Booking submit failed:', err);
      setStatus('Something went wrong sending your request. Please try again in a moment.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.firstChild.textContent = label;
    }
  });
})();
