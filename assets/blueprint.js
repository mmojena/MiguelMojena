/*
 * Blueprint layer for the project previews.
 *
 * Every capture has a line-art twin in assets/projects/blueprint/*.avif,
 * edge-detected from the capture itself (a stylisation of the finished page,
 * not the project's original wireframe). Build mode draws the blueprint
 * before it renders the real capture (see build-mode.js); with a mouse, an
 * x-ray lens shows the structure under the cursor. Purely decorative: the
 * blueprint and the lens are aria-hidden and never take pointer events, so
 * the preview link behaves exactly as before.
 */
(() => {
  'use strict';

  const LABEL = { pt: 'Estrutura', en: 'Structure', es: 'Estructura' };
  const RADIUS = 104;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const toBlueprint = src => src.replace(/\/projects\/([^/?#]+)\.webp(?=$|[?#])/, '/projects/blueprint/$1.avif');
  const frames = [...document.querySelectorAll('.project__preview')];
  const mounted = new Map();

  // Twin <picture> mirrors the capture's own <source> list, so phone and
  // desktop crops get their matching blueprint.
  function mount(frame) {
    if (mounted.has(frame)) return mounted.get(frame);
    const real = frame.querySelector('img');
    if (!real) return null;
    const picture = document.createElement('picture');
    picture.className = 'project__bp-pic';
    for (const source of frame.querySelectorAll('source')) {
      const twin = document.createElement('source');
      if (source.media) twin.media = source.media;
      twin.type = 'image/avif';
      twin.srcset = toBlueprint(source.getAttribute('srcset'));
      picture.appendChild(twin);
    }
    const img = document.createElement('img');
    img.className = 'project__bp';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.decoding = 'async';
    img.src = toBlueprint(real.getAttribute('src'));
    picture.appendChild(img);
    const lens = document.createElement('span');
    lens.className = 'project__lens';
    lens.setAttribute('aria-hidden', 'true');
    lens.innerHTML = '<span class="project__lens-tag"></span>';
    frame.append(picture, lens);
    // Unsupported AVIF or a missing file simply means no blueprint.
    const ready = img.decode().then(() => img, () => null);
    const entry = { frame, img, lens, ready, ok: false, r: 0, target: 0, ix: 0, iy: 0, fx: 0, fy: 0, k: 1, raf: 0 };
    ready.then(found => { entry.ok = !!found; });
    mounted.set(frame, entry);
    return entry;
  }

  // Load a little before the previews are reached.
  const io = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      mount(entry.target);
      io.unobserve(entry.target);
    }
  }, { rootMargin: '900px 0px' });
  frames.forEach(frame => io.observe(frame));

  // ---------------------------------------------------------------- x-ray lens
  // Coordinates are converted into each element's own CSS pixels, because the
  // capture is zoomed by the scroll animation and the section may be receding.
  function local(el, event) {
    const r = el.getBoundingClientRect();
    const k = r.width / (el.offsetWidth || r.width) || 1;
    return [(event.clientX - r.left) / k, (event.clientY - r.top) / k, k];
  }
  // A frame being built by the agents owns its own clipping.
  const busy = frame => !!frame.style.clipPath || frame.classList.contains('mmb-building');

  function paint(entry) {
    entry.raf = 0;
    // The agents took this frame over (e.g. Replay): the lens steps aside and
    // leaves the blueprint's clipping to the build.
    if (busy(entry.frame)) {
      entry.r = entry.target = 0;
      entry.frame.classList.remove('is-xray');
      return;
    }
    const snap = reducedMotion.matches;
    entry.r = snap ? entry.target : entry.r + (entry.target - entry.r) * .22;
    if (Math.abs(entry.target - entry.r) < .5) entry.r = entry.target;
    if (entry.r <= 0) {
      entry.img.style.removeProperty('clip-path');
      entry.frame.classList.remove('is-xray');
      return;
    }
    entry.img.style.clipPath = `circle(${entry.r.toFixed(1)}px at ${entry.ix.toFixed(1)}px ${entry.iy.toFixed(1)}px)`;
    entry.lens.style.setProperty('--r', `${(entry.r * entry.k).toFixed(1)}px`);
    entry.lens.style.transform = `translate(${entry.fx.toFixed(1)}px, ${entry.fy.toFixed(1)}px)`;
    entry.frame.classList.add('is-xray');
    if (entry.r !== entry.target) entry.raf = requestAnimationFrame(() => paint(entry));
  }
  function schedule(entry) {
    if (!entry.raf) entry.raf = requestAnimationFrame(() => paint(entry));
  }
  function track(entry, event) {
    const [ix, iy, ik] = local(entry.img, event);
    const [fx, fy, fk] = local(entry.frame, event);
    entry.ix = ix;
    entry.iy = iy;
    entry.fx = fx;
    entry.fy = fy;
    entry.k = ik / fk;
  }

  for (const frame of frames) {
    frame.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || !finePointer.matches) return;
      const entry = mount(frame);
      if (!entry || !entry.ok || busy(frame)) return;
      const lang = (document.documentElement.lang || 'pt').slice(0, 2);
      entry.lens.firstChild.textContent = LABEL[lang] || LABEL.pt;
      track(entry, event);
      entry.target = RADIUS;
      schedule(entry);
    });
    frame.addEventListener('pointerleave', () => {
      const entry = mounted.get(frame);
      if (!entry || busy(frame)) return;
      entry.target = 0;
      schedule(entry);
    });
  }

  window.mmBlueprint = {
    // Resolves to the blueprint <img> once decoded, or null without one.
    ensure(frame) {
      const entry = mount(frame);
      return entry ? entry.ready : Promise.resolve(null);
    },
  };
})();
