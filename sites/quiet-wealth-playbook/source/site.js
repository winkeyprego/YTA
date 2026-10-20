/* Progressive enhancement. All content and checkout hrefs exist in the HTML. */
(() => {
  'use strict';
  const config = JSON.parse(document.querySelector('#site-config')?.textContent || '{}');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const track = (name, props = {}) => {
    // Attach a cookieless provider here, or listen for quietwealth:analytics.
    if (typeof window.plausible === 'function') window.plausible(name, { props });
    window.dispatchEvent(new CustomEvent('quietwealth:analytics', { detail: { name, props } }));
  };

  const incoming = new URLSearchParams(location.search);
  document.querySelectorAll('[data-buy]').forEach(link => {
    if (config.checkoutUrl) {
      const url = new URL(config.checkoutUrl, location.href);
      ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].forEach(key => {
        const value = incoming.get(key);
        if (value) url.searchParams.set(key, value.slice(0, 512));
      });
      link.href = url.href;
    }
    link.addEventListener('click', () => track('Buy click', { location: link.dataset.buy }));
  });

  const bar = document.querySelector('#topbar');
  const hero = document.querySelector('#hero');
  if (bar && hero && 'IntersectionObserver' in window) {
    const spacer = document.createElement('div');
    spacer.setAttribute('aria-hidden', 'true');
    bar.after(spacer);
    new IntersectionObserver(([entry]) => {
      const stuck = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
      spacer.style.height = stuck ? `${bar.offsetHeight}px` : '0px';
      bar.classList.toggle('is-sticky', stuck);
    }).observe(hero);
  }

  document.querySelectorAll('[data-faq]').forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) track('FAQ open', { question: item.dataset.faq });
    });
  });

  const carousel = document.querySelector('.sample-track');
  document.querySelectorAll('[data-carousel]').forEach(button => {
    button.addEventListener('click', () => {
      if (!carousel) return;
      const card = carousel.querySelector('.sample-card');
      carousel.scrollBy({ left: Number(button.dataset.carousel) * ((card?.offsetWidth || 255) + 22), behavior: reduced ? 'auto' : 'smooth' });
      track('Carousel interaction', { type: 'arrow', direction: button.dataset.carousel });
    });
  });
  let swipeReported = false;
  carousel?.addEventListener('scroll', () => {
    if (!swipeReported) {
      track('Carousel interaction', { type: 'scroll' });
      swipeReported = true;
    }
  }, { passive: true });

  const dialog = document.querySelector('.lightbox');
  let opener;
  if (dialog && typeof dialog.showModal === 'function') {
    document.querySelectorAll('[data-page]').forEach(button => {
      button.addEventListener('click', () => {
        opener = button;
        dialog.querySelector('h2').textContent = button.dataset.pageName;
        const image = dialog.querySelector('img');
        image.src = button.dataset.page;
        image.alt = button.querySelector('img').alt;
        dialog.showModal();
        track('Carousel interaction', { type: 'preview', page: button.dataset.pageName });
      });
    });
    document.querySelector('[data-open-explorer]')?.addEventListener('click', event => {
      const preview = document.querySelector('.toolkit-preview');
      const source = preview.querySelector('img');
      opener = event.currentTarget;
      dialog.querySelector('h2').textContent = preview.querySelector('[data-explorer-title]').textContent;
      dialog.querySelector('img').src = source.src;
      dialog.querySelector('img').alt = source.alt;
      dialog.showModal();
    });
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      const box = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => opener?.focus());
  }

  const form = document.querySelector('.email-form');
  form?.addEventListener('submit', event => {
    if (form.dataset.configured !== 'true') {
      event.preventDefault();
      return;
    }
    // Native navigation lets the provider handle confirmation and double opt-in.
    // No email address is sent to analytics, and this is a submission, not a confirmed subscription.
    track('Email signup', { state: 'submitted' });
    document.querySelector('#newsletter-status').textContent = config.emailSubmitting;
  });

  const explorer = document.querySelector('.toolkit-preview');
  document.querySelectorAll('[data-explore]').forEach(button => {
    button.addEventListener('click', () => {
      const item = config.explorer?.[Number(button.dataset.explore)];
      if (!explorer || !item) return;
      document.querySelectorAll('[data-explore]').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
      const image = explorer.querySelector('img');
      image.src = item.image;
      explorer.dataset.edition = button.dataset.explore;
      if (!reduced && typeof image.animate === 'function') image.animate([{ opacity: .35, transform: 'translateY(9px)' }, { opacity: 1, transform: 'translateY(0)' }], {duration: 360, easing: 'ease-out'});
      image.alt = item.title;
      explorer.querySelector('[data-explorer-kicker]').textContent = item.kicker;
      explorer.querySelector('[data-explorer-title]').textContent = item.title;
      explorer.querySelector('[data-explorer-body]').textContent = item.body;
      explorer.querySelector('[data-explorer-tag]').textContent = item.tag;
      track('Toolkit explore', { resource: button.dataset.explore });
    });
  });

  const readerDescription = document.querySelector('#reader-description');
  document.querySelectorAll('[data-reader]').forEach(button => {
    button.addEventListener('click', () => {
      const text = config.readerDescriptions?.[Number(button.dataset.reader)];
      if (!text || !readerDescription) return;
      document.querySelectorAll('[data-reader]').forEach(tab => tab.setAttribute('aria-pressed', String(tab === button)));
      readerDescription.textContent = text;
    });
  });

  document.querySelectorAll('[data-month]').forEach(month => {
    month.addEventListener('toggle', () => {
      if (!month.open) return;
      document.querySelectorAll('[data-month]').forEach(other => {
        if (other !== month) other.open = false;
      });
      const marker = document.querySelector('[data-month-current]');
      if (marker) marker.textContent = month.dataset.month.padStart(2, '0');
    });
  });

  const demo = document.querySelector('[data-demo]');
  if (demo && config.tryIt) {
    const options = config.tryIt;
    const amount = document.querySelector('#demo-amount');
    const range = document.querySelector('#demo-range');
    const annualOutput = document.querySelector('#annual-cost');
    const retainedOutput = document.querySelector('#retained-cost');
    const steps = [...document.querySelectorAll('[data-plan-step]')];
    const format = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
    const state = { amount: options.defaultAmount, frequency: options.defaultFrequency, fraction: options.defaultFraction };
    const annual = () => state.amount * options.annualTimes[state.frequency];
    const paint = () => {
      annualOutput.value = format.format(annual());
      retainedOutput.value = format.format(annual() * state.fraction);
      const ratio = (state.amount - options.rangeMin) / (options.rangeMax - options.rangeMin);
      range.style.background = `linear-gradient(to right, #1e3459 ${ratio * 100}%, #e0e3eb ${ratio * 100}%)`;
      document.querySelectorAll('.coin-meter i').forEach((coin, index) => coin.classList.toggle('is-filled', index < Math.round(state.fraction * 12)));
    };
    const setAmount = value => {
      const number = Number(value);
      if (!Number.isFinite(number)) return;
      state.amount = Math.round(Math.min(options.rangeMax, Math.max(options.rangeMin, number)));
      amount.value = String(state.amount);
      range.value = String(state.amount);
      paint();
    };
    amount.addEventListener('input', () => setAmount(amount.value));
    range.addEventListener('input', () => setAmount(range.value));
    document.querySelectorAll('[data-frequency]').forEach(button => {
      button.addEventListener('click', () => {
        if (!Object.hasOwn(options.annualTimes, button.dataset.frequency)) return;
        state.frequency = button.dataset.frequency;
        document.querySelectorAll('[data-frequency]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
        paint();
      });
    });
    document.querySelectorAll('[data-keep]').forEach(button => {
      button.addEventListener('click', () => {
        state.fraction = Number(button.dataset.keep) / 100;
        document.querySelectorAll('[data-keep]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
        paint();
      });
    });
    steps.forEach(step => step.addEventListener('change', () => {
      const count = steps.filter(item => item.checked).length;
      document.querySelector('#plan-progress').textContent = options.planProgress.replace('{count}', String(count)).replace('{total}', String(steps.length));
      document.querySelector('.plan-meter i').style.width = `${count / steps.length * 100}%`;
    }));
    document.querySelector('[data-save-plan]').addEventListener('click', () => {
      const frequencyLabel = state.frequency === 'weekly' ? options.weekly : options.monthly;
      const text = [options.downloadTitle, '', `${options.costText}: ${format.format(state.amount)}`, `${options.frequencyText}: ${frequencyLabel}`, `${options.annualText}: ${format.format(annual())}`, `${options.keptText}: ${format.format(annual() * state.fraction)}`, '', options.checklistTitle, ...steps.map((step, index) => `${step.checked ? '[x]' : '[ ]'} ${options.steps[index]}`), '', options.downloadDisclaimer].join('\n');
      const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = options.downloadFile;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      document.querySelector('#save-status').textContent = options.savedMessage;
      track('Starting point saved', { source: 'demo' });
    });
    paint();
  }

  const world = document.querySelector('[data-hero-world]');
  const book = document.querySelector('[data-book-tilt]');
  if (world && book && !reduced && matchMedia('(hover: hover)').matches) {
    let bounds;
    world.addEventListener('pointerenter', () => { bounds = world.getBoundingClientRect(); });
    world.addEventListener('pointermove', event => {
      if (!bounds) return;
      const x = (event.clientX - bounds.left) / bounds.width - .5;
      const y = (event.clientY - bounds.top) / bounds.height - .5;
      book.style.setProperty('--turn-x', `${-y * 6}deg`);
      book.style.setProperty('--turn-y', `${x * 8}deg`);
    }, { passive: true });
    world.addEventListener('pointerleave', () => {
      book.style.setProperty('--turn-x', '0deg');
      book.style.setProperty('--turn-y', '0deg');
    });
  }

  if (!reduced && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('js-reveal');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.remove('pending-reveal');
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px 45px 0px', threshold: .04 });
    document.querySelectorAll('[data-reveal]').forEach(el => {
      if (el.getBoundingClientRect().top > innerHeight) {
        el.classList.add('pending-reveal');
        observer.observe(el);
      }
    });
  }
})();
