/* Scroll-scrubbed illustration motion. No perpetual animation loop or scroll interception. */
(() => {
  'use strict';
  const root = document.documentElement;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const toggle = document.querySelector('[data-motion-toggle]');
  const labels = JSON.parse(document.querySelector('#site-config')?.textContent || '{}').motion || {};
  const story = document.querySelector('.scroll-story');
  const chapters = [...document.querySelectorAll('[data-scroll-chapter]')];
  const poses = [...document.querySelectorAll('[data-pose]')];
  const stage = document.querySelector('.story-stage-art');
  const targets = [
    { section: document.querySelector('#hero'), image: document.querySelector('.campaign-alicia'), type: 'hero' },
    { section: document.querySelector('.try-layout'), image: document.querySelector('.demo-visual > img'), type: 'money' },
    { section: document.querySelector('.sample-invitation'), image: document.querySelector('.sample-invitation img'), type: 'workbook' },
    { section: document.querySelector('.note-v3'), image: document.querySelector('.alicia-tea'), type: 'desk' },
  ].filter(item => item.section && item.image);
  if (!targets.length && !story) return;
  const active = new Set();
  const progress = document.querySelector('.reading-progress');
  let paused = false;
  let scheduled = false;
  let currentPose = 0;
  const clamp = value => Math.min(1, Math.max(0, value));
  const enabled = () => !paused && !media.matches;

  function selectPose(index) {
    if (index === currentPose) return;
    if (!poses[index].naturalWidth) {
      if (!poses[index].dataset.waiting) {
        poses[index].dataset.waiting = '1';
        poses[index].addEventListener('load', () => { delete poses[index].dataset.waiting; schedule(); }, {once: true});
      }
      return;
    }
    currentPose = index;
    poses.forEach((pose, i) => pose.classList.toggle('is-active', i === index));
    chapters.forEach((chapter, i) => chapter.classList.toggle('is-current', i === index));
    document.querySelectorAll('.stage-progress i').forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    document.querySelector('[data-story-number]').textContent = String(index + 1).padStart(2, '0');
    stage.setAttribute('aria-label', chapters[index].dataset.poseAlt);
    story.dataset.activePose = String(index);
  }

  function update() {
    scheduled = false;
    if (document.hidden) return;
    const height = innerHeight;
    // Read layout together, before any style writes.
    const measured = targets.filter(item => active.has(item.section)).map(item => ({ ...item, rect: item.section.getBoundingClientRect() }));
    const storyRect = story && active.has(story) ? story.getBoundingClientRect() : null;
    const chapterRects = storyRect ? chapters.map(el => el.getBoundingClientRect()) : [];
    const distance = document.documentElement.scrollHeight - height;
    if (progress) progress.style.transform = `scaleX(${distance > 0 ? clamp(scrollY / distance) : 0})`;
    if (!enabled()) return;
    const amplitude = innerWidth < 761 ? .55 : 1;
    measured.forEach(({ image, section, rect, type }) => {
      const travel = type === 'hero' ? clamp(-rect.top / rect.height) : clamp((height - rect.top) / (height + rect.height));
      const centered = type === 'hero' ? travel : travel - .5;
      image.style.setProperty('--motion-y', `${(type === 'hero' ? 32 : -28) * centered * amplitude}px`);
      image.style.setProperty('--motion-x', `${(type === 'hero' ? 9 : 4) * centered * amplitude}px`);
      image.style.setProperty('--motion-turn', `${(type === 'hero' ? -1.4 : 1.4) * centered * amplitude}deg`);
      image.style.setProperty('--motion-scale', String(1 + (type === 'hero' ? travel * .025 : .008)));
      if (type === 'hero') section.style.setProperty('--scene-travel', `${-18 * travel * amplitude}px`);
    });
    if (storyRect) {
      poses.forEach(pose => { if (pose.dataset.src && !pose.getAttribute('src')) pose.src = pose.dataset.src; });
      let next = 0;
      chapterRects.forEach((rect, index) => { if (rect.top < height * .62) next = index; });
      selectPose(next);
      const travel = clamp((height - storyRect.top) / (height + storyRect.height));
      stage.style.setProperty('--stage-y', `${(travel - .5) * -22 * amplitude}px`);
      stage.style.setProperty('--stage-turn', `${(travel - .5) * 1.5 * amplitude}deg`);
    }
  }

  function schedule() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  }

  function preferences() {
    root.dataset.motion = media.matches ? 'reduced' : paused ? 'paused' : 'running';
    if (toggle) {
      toggle.disabled = media.matches;
      toggle.setAttribute('aria-pressed', String(paused || media.matches));
      toggle.textContent = media.matches ? labels.reduced : paused ? labels.resume : labels.pause;
    }
    schedule();
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) active.add(entry.target); else active.delete(entry.target);
        entry.target.classList.toggle('motion-visible', entry.isIntersecting && enabled());
      });
      schedule();
    }, { rootMargin: '100px 0px' });
    targets.forEach(item => observer.observe(item.section));
    if (story) observer.observe(story);
  } else {
    targets.forEach(item => active.add(item.section));
    if (story) active.add(story);
  }
  toggle?.addEventListener('click', () => { paused = !paused; preferences(); });
  media.addEventListener?.('change', preferences);
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  preferences();
})();
