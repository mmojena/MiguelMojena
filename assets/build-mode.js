/*
 * Build mode — a squad of cursor "agents" assembles each block of the page as
 * it scrolls into view: selection boxes with live measurements, text typed
 * line by line, image placeholders that resolve into the real image, rules
 * pulled across the layout and section backgrounds painted in.
 *
 * Pure enhancement. The content always lives in the HTML; while a block waits
 * to be built it is only visually clipped (clip-path), so the DOM text stays
 * available to search engines, screen readers and the i18n script. The
 * <head> bootstrap only adds `.mm-build` when motion is allowed, and drops it
 * after a few seconds if this file never reports ready.
 *
 * The page also moves on its own (scroll-driven 3D in index.html), so every
 * task keeps its overlay in an "anchor" frame captured when it starts and
 * maps that frame onto the element's current box on every animation frame.
 */
(() => {
  'use strict';

  const root = document.documentElement;
  if (!root.classList.contains('mm-build')) return;

  const ACCENT = '#b8ff2c';
  const INK = '#111416';
  const HIDDEN_CLIP = 'inset(0 0 100% 0)';
  const SMALL = matchMedia('(max-width: 767px)').matches;
  const SPEED = SMALL ? 1.15 : 1;
  const OFFSCREEN_GRACE = 450;

  const ROSTER = [
    { name: 'Miguel', color: ACCENT, role: 'lead' },
    { name: { pt: 'Estratégia', en: 'Strategy', es: 'Estrategia' }, color: '#ff6b4a', role: 'text' },
    { name: { pt: 'Design', en: 'Design', es: 'Diseño' }, color: '#4da3ff', role: 'shape' },
    { name: 'Copy', color: '#c38bff', role: 'text' },
    { name: { pt: 'Imagem', en: 'Image', es: 'Imagen' }, color: '#2fe0c0', role: 'image' },
    { name: 'Front-end', color: '#ffc94d', role: 'button' },
    { name: 'QA', color: '#ff7ab6', role: 'rule' },
    { name: '', color: '#4da3ff' },
    { name: '', color: '#ff6b4a' },
    { name: '', color: '#2fe0c0' },
  ];
  const AGENT_COUNT = SMALL ? 6 : ROSTER.length;

  const STRINGS = {
    pt: { agents: 'agentes', layers: 'camadas', replay: 'Rever', skip: 'Pular', you: 'Você', ready: 'Página pronta', group: 'Animação de construção da página', replayLabel: 'Rever a construção desta parte da página', skipLabel: 'Pular a animação de construção' },
    en: { agents: 'agents', layers: 'layers', replay: 'Replay', skip: 'Skip', you: 'You', ready: 'Page ready', group: 'Page build animation', replayLabel: 'Replay the build of this part of the page', skipLabel: 'Skip the build animation' },
    es: { agents: 'agentes', layers: 'capas', replay: 'Repetir', skip: 'Saltar', you: 'Tú', ready: 'Página lista', group: 'Animación de construcción de la página', replayLabel: 'Repetir la construcción de esta parte de la página', skipLabel: 'Saltar la animación de construcción' },
  };

  // Blocks are observed units; layers are what the agents build inside them.
  // [block selector, [[layer selector | ':scope', kind, options]]]
  const SPEC = [
    ['.hero__copy', [['.hero__intro', 'text'], ['h1 > span', 'text', { lead: true, cps: 30 }], ['.hero__description', 'text'], ['.actions .button', 'button']]],
    ['.hero__visual', [['.hero__shape', 'shape'], ['.hero__word:not(.hero__word--front)', 'text', { cps: 13, twin: '.hero__word--front' }], ['.hero__photo', 'image', { dir: 'up' }], ['.hero__caption', 'text']]],
    ['.hero__foot', [[':scope', 'rule', { edge: 'top' }], ['p', 'text'], ['a', 'text']]],
    ['.work', [[':scope', 'fill']]],
    ['.work .section__head', [['h2', 'text', { lead: true, cps: 34 }], ['p', 'text']]],
    ['.work .project', [['.project__preview', 'image'], ['.project__type', 'text'], ['h3', 'text', { lead: true, cps: 30 }], ['.project__copy p', 'text'], ['.text-link', 'text'], [':scope', 'rule', { edge: 'bottom', when: '.project--featured' }]]],
    ['.offer__heading', [['h2', 'text', { lead: true, cps: 34 }], ['p', 'text']]],
    ['.offer-row', [[':scope', 'rule', { edge: 'top' }], [':scope', 'rule', { edge: 'bottom', when: ':last-child' }], ['h3', 'text', { cps: 40 }], ['p', 'text'], ['small', 'text'], ['.text-link', 'text']]],
    ['.about', [[':scope', 'rule', { edge: 'top' }]]],
    ['.about__photo', [[':scope', 'image']]],
    ['.about__copy', [['h2', 'text', { lead: true, cps: 30 }], ['p', 'text'], ['.text-link', 'text']]],
    ['.process__intro', [['h2', 'text', { lead: true, cps: 34 }], ['p', 'text'], ['.text-link', 'text']]],
    ['.steps li', [[':scope', 'rule', { edge: 'top', marker: true }], ['h3', 'text', { cps: 36 }], ['p', 'text']]],
    ['.contact', [[':scope', 'fill']]],
    ['.contact__grid', [['h2', 'text', { lead: true, cps: 38 }], ['p', 'text'], ['.button', 'button']]],
    ['.footer__grid', [['.brand', 'text'], ['.footer__links a', 'text']]],
    ['.footer__note', [[':scope', 'text']]],
  ];

  // ---------------------------------------------------------------- helpers
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const easeOut = t => 1 - (1 - t) ** 3;
  const easeInOut = t => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
  const lang = () => {
    const code = (root.lang || 'pt').slice(0, 2).toLowerCase();
    return STRINGS[code] ? code : 'pt';
  };
  const str = key => STRINGS[lang()][key];
  const label = name => (typeof name === 'string' ? name : name[lang()] || name.pt);
  const pageBox = el => {
    const r = el.getBoundingClientRect();
    return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
  };
  const view = () => ({ x: scrollX, y: scrollY, w: innerWidth, h: innerHeight });
  const onScreen = el => {
    const r = el.getBoundingClientRect();
    return r.top < innerHeight && r.bottom > 0;
  };
  // Box without the inline transform used to hide it (read and restored in
  // the same task, so it never paints).
  const naturalBox = el => {
    const t = el.style.transform;
    el.style.transform = 'none';
    const b = pageBox(el);
    el.style.transform = t;
    return b;
  };

  const layer = document.createElement('div');
  layer.className = 'mmb-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  function node(cls, color, parent = layer) {
    const n = document.createElement('div');
    n.className = cls;
    if (color) n.style.setProperty('--c', color);
    parent.appendChild(n);
    return n;
  }
  // Overlay node owned by a task: lives in the task frame (see track()).
  const tnode = (task, cls, color) => node(cls, color, task.wrap);
  function sizeLayer() {
    layer.style.height = `${Math.ceil(document.body.getBoundingClientRect().height)}px`;
  }

  // Text lines of an element, in element-local CSS pixels (ancestor scale,
  // e.g. a receding section, is divided out so clip-path stays exact).
  function measureLines(el) {
    const r = el.getBoundingClientRect();
    const kx = r.width / (el.offsetWidth || r.width) || 1;
    const ky = r.height / (el.offsetHeight || r.height) || 1;
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter(q => q.width > .5 && q.height > .5);
    range.detach?.();
    rects.sort((a, b) => a.top - b.top || a.left - b.left);
    const lines = [];
    for (const q of rects) {
      const mid = (q.top + q.bottom) / 2;
      const line = lines.find(l => mid > l.top && mid < l.bottom);
      if (line) {
        line.left = Math.min(line.left, q.left);
        line.right = Math.max(line.right, q.right);
        line.top = Math.min(line.top, q.top);
        line.bottom = Math.max(line.bottom, q.bottom);
      } else {
        lines.push({ left: q.left, right: q.right, top: q.top, bottom: q.bottom });
      }
    }
    if (!lines.length) lines.push({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
    lines.sort((a, b) => a.top - b.top);
    const local = lines.map(l => ({ x0: (l.left - r.left) / kx, x1: (l.right - r.left) / kx, y0: (l.top - r.top) / ky, y1: (l.bottom - r.top) / ky }));
    // Bands split overlapping line boxes at their midpoints; outer bands bleed
    // past the box so glyph overhangs are never cut.
    local.forEach((l, i) => {
      l.b0 = i === 0 ? -48 : (local[i - 1].y1 + l.y0) / 2;
      l.b1 = i === local.length - 1 ? r.height / ky + 48 : (l.y1 + local[i + 1].y0) / 2;
      l.len = Math.max(1, l.x1 - l.x0);
    });
    return { w: r.width / kx, h: r.height / ky, lines: local, total: local.reduce((s, l) => s + l.len, 0) };
  }

  // Line k revealed up to x: everything above, plus the current line until x.
  function typingState(m, p) {
    let left = p * m.total;
    for (let k = 0; k < m.lines.length; k++) {
      const l = m.lines[k];
      if (left <= l.len || k === m.lines.length - 1) {
        return { k, line: l, x: l.x0 + Math.min(left, l.len) };
      }
      left -= l.len;
    }
    return null;
  }
  function typingClip(m, s) {
    const L = -48, R = m.w + 48, T = -48;
    const { b0, b1 } = s.line;
    return `polygon(${L}px ${T}px, ${R}px ${T}px, ${R}px ${b0}px, ${s.x}px ${b0}px, ${s.x}px ${b1}px, ${L}px ${b1}px)`;
  }

  // ---------------------------------------------------------------- overlay parts
  function selection(task, color) {
    const sel = tnode(task, 'mmb-sel', color);
    sel.innerHTML = '<i></i><i></i><i></i><i></i>';
    const badge = tnode(task, 'mmb-badge', color);
    task.nodes.push(sel, badge);
    return {
      set(x, y, w, h) {
        sel.style.transform = `translate(${x}px, ${y}px)`;
        sel.style.width = `${w}px`;
        sel.style.height = `${h}px`;
        badge.textContent = `${Math.round(w)} × ${Math.round(h)}`;
        badge.style.transform = `translate(${x + w / 2}px, ${y + h + 7}px) translateX(-50%)`;
      },
      fade(o) { sel.style.opacity = o; badge.style.opacity = o; },
    };
  }
  function guides(task, b, area) {
    const h = tnode(task, 'mmb-guide');
    const v = tnode(task, 'mmb-guide');
    task.nodes.push(h, v);
    h.style.cssText = `transform: translate(${area.x - 32}px, ${b.y}px); width: ${area.w + 64}px; height: 1px;`;
    v.style.cssText = `transform: translate(${b.x}px, ${area.y - 32}px); width: 1px; height: ${area.h + 64}px;`;
    return { fade(o) { h.style.opacity = o * .6; v.style.opacity = o * .6; } };
  }
  function ripple(task, x, y, color) {
    const r = tnode(task, 'mmb-ripple', color);
    r.style.left = `${x}px`;
    r.style.top = `${y}px`;
    setTimeout(() => r.remove(), 650);
  }

  // ---------------------------------------------------------------- agents
  class Agent {
    constructor(def, index) {
      this.def = def;
      this.index = index;
      this.el = node('mmb-agent', def.color);
      this.el.innerHTML =
        '<svg class="mmb-arrow" width="18" height="22" viewBox="0 0 18 22"><path d="M1.5 1.5v16.2l4.4-4.1 3 6.8 2.9-1.3-3-6.7h6.1z" fill="currentColor" stroke="#111416" stroke-width="1.4" stroke-linejoin="round"/></svg>' +
        '<svg class="mmb-ibeam" width="12" height="22" viewBox="0 0 12 22"><path d="M2.5 2h7M2.5 20h7M6 2v18" fill="none" stroke="#111416" stroke-width="3.4" stroke-linecap="round"/><path d="M2.5 2h7M2.5 20h7M6 2v18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' +
        (def.name ? '<span class="mmb-tag"></span>' : '');
      this.tag = this.el.querySelector('.mmb-tag');
      this.relabel();
      const v = view();
      this.x = v.x + v.w * (.12 + Math.random() * .76);
      this.y = v.y + clamp(v.h * (.2 + Math.random() * .6), 110, v.h - 40);
      this.alpha = 0;
      this.task = null;
      this.idleSince = -1e9;
      this.readyAt = 0;
      this.seed = Math.random() * 1000;
      this.mode = 'arrow';
      this.pressUntil = 0;
    }
    relabel() { if (this.tag) this.tag.textContent = label(this.def.name); }
    rand() { this.seed = (this.seed * 9301 + 49297) % 233280; return this.seed / 233280; }
    likes(l) {
      const role = this.def.role;
      if (!role) return false;
      if (role === 'lead') return !!l.opts.lead;
      if (role === 'shape') return l.kind === 'shape' || l.kind === 'fill';
      return l.kind === role;
    }
    // Agents that faded out or drifted away re-enter from the viewport edge
    // nearest to where they were, so the squad seems to follow the reader.
    prepareFor(tx) {
      const v = view();
      const offscreen = this.y < v.y - 60 || this.y > v.y + v.h + 60;
      if (!offscreen) return;
      this.y = this.y < v.y ? v.y - 26 : v.y + v.h + 26;
      this.x = clamp(tx + (this.rand() - .5) * 440, v.x + 20, v.x + v.w - 40);
    }
    press() { this.pressUntil = clock + 140; }
    render(dt) {
      const recent = clock - this.idleSince < 1500;
      const target = this.task || recent || clock < this.readyAt ? 1 : 0;
      this.alpha += (target - this.alpha) * Math.min(1, dt / (target ? 90 : 260));
      const idle = this.task ? 0 : 1;
      const ox = Math.sin(clock * .0017 + this.index * 1.7) * 5 * idle;
      const oy = Math.cos(clock * .0013 + this.index * 2.3) * 4 * idle;
      const [x, y] = this.task ? toPage(this.task, this.x, this.y) : [this.x, this.y];
      this.el.style.transform = `translate3d(${x + ox}px, ${y + oy}px, 0)`;
      this.el.style.opacity = this.alpha.toFixed(3);
      this.el.classList.toggle('is-text', this.mode === 'text');
      this.el.classList.toggle('is-press', clock < this.pressUntil);
    }
  }

  function travel(agent, target) {
    return {
      begin(ph) {
        const [tx, ty] = target();
        agent.prepareFor(tx);
        agent.mode = 'arrow';
        const d = Math.hypot(tx - agent.x, ty - agent.y);
        ph.from = [agent.x, agent.y];
        ph.to = [tx, ty];
        ph.dur = clamp(150 + d * .3, 180, 620) / SPEED;
        const nx = -(ty - agent.y) / (d || 1);
        const ny = (tx - agent.x) / (d || 1);
        const bend = (agent.rand() - .5) * Math.min(d * .4, 160);
        ph.c = [(agent.x + tx) / 2 + nx * bend, (agent.y + ty) / 2 + ny * bend];
      },
      update(p, ph) {
        const e = easeInOut(p);
        const u = 1 - e;
        agent.x = u * u * ph.from[0] + 2 * u * e * ph.c[0] + e * e * ph.to[0];
        agent.y = u * u * ph.from[1] + 2 * u * e * ph.c[1] + e * e * ph.to[1];
      },
    };
  }

  // Drag-to-draw a frame, Figma style: the box grows under the cursor while
  // the badge reports the live size and pink guides snap to the edges.
  function draw(task, getBox, dur, onGrow) {
    const { agent, color, layer: l } = task;
    let b, sel, g;
    return {
      dur: dur / SPEED,
      begin() {
        b = getBox();
        sel = selection(task, color);
        g = guides(task, b, pageBox(l.block.el));
        task.sel = sel;
        task.guides = g;
      },
      update(p) {
        const e = easeOut(p);
        const w = Math.max(2, b.w * e);
        const h = Math.max(2, b.h * e);
        sel.set(b.x, b.y, w, h);
        g.fade(Math.min(1, p * 3));
        agent.x = b.x + w;
        agent.y = b.y + h;
        onGrow?.(e, b);
      },
    };
  }
  function settle(task, extra) {
    return {
      dur: 200 / SPEED,
      begin() { task.agent.mode = 'arrow'; extra?.begin?.(); },
      update(p) {
        task.sel?.fade(1 - p);
        task.guides?.fade(1 - p);
        extra?.update?.(p);
      },
    };
  }

  // ---------------------------------------------------------------- plans
  const PLANS = {
    text(task) {
      const { agent, layer: l, color } = task;
      const el = l.el;
      let b, m, caret;
      return [
        travel(agent, () => { b = task.anchor; return [b.x, b.y]; }),
        draw(task, () => b, 210),
        {
          begin(ph) {
            m = measureLines(el);
            const chars = (el.textContent || '').replace(/\s+/g, ' ').trim().length || 8;
            ph.dur = clamp(chars * 1000 / (l.opts.cps || 95), 160, 1300) / SPEED;
            caret = tnode(task, 'mmb-caret', color);
            task.nodes.push(caret);
            task.guides.fade(0);
            agent.mode = 'text';
          },
          update(p) {
            const s = typingState(m, p);
            el.style.clipPath = typingClip(m, s);
            if (l.twin) l.twin.style.clipPath = el.style.clipPath;
            const k = task.k;
            const top = b.y + s.line.y0 * k;
            const h = (s.line.y1 - s.line.y0) * k;
            caret.style.transform = `translate(${b.x + s.x * k}px, ${top}px)`;
            caret.style.height = `${h}px`;
            agent.x = b.x + s.x * k + 12;
            agent.y = top + h / 2 + 4;
            l.progress = p;
          },
        },
        settle(task, {
          begin() {
            el.style.removeProperty('clip-path');
            l.twin?.style.removeProperty('clip-path');
          },
          update(p) { caret.style.opacity = 1 - p; },
        }),
      ];
    },

    button(task) {
      const { agent, layer: l } = task;
      const el = l.el;
      let b;
      return [
        travel(agent, () => { b = task.anchor; return [b.x, b.y]; }),
        draw(task, () => b, 230),
        {
          dur: 320 / SPEED,
          update(p) {
            const e = easeInOut(p);
            el.style.clipPath = `inset(0 ${(1 - e) * 100}% 0 0)`;
            agent.x = b.x + b.w * e;
            agent.y = b.y + b.h * .62;
            l.progress = p;
          },
        },
        {
          dur: 150,
          begin() {
            el.style.removeProperty('clip-path');
            agent.x = b.x + b.w * .82;
            agent.press();
            ripple(task, agent.x, agent.y, task.color);
          },
        },
        settle(task),
      ];
    },

    image(task) {
      const { agent, layer: l, color } = task;
      const el = l.el;
      const img = el.tagName === 'IMG' ? el : el.querySelector('img');
      const up = l.opts.dir === 'up';
      let b, ph, scan, waitedFrom;
      // Project previews are drawn as a blueprint first (assets/blueprint.js).
      let bp = null;
      let bpSettled = true;
      if (el.matches('.project__preview') && window.mmBlueprint) {
        bpSettled = false;
        window.mmBlueprint.ensure(el).then(found => { bp = found; bpSettled = true; });
      }
      const loaded = () => !img || (img.complete && img.naturalWidth > 0);
      const reveal = {
        dur: 560 / SPEED,
        begin() {
          scan = tnode(task, 'mmb-scan', color);
          scan.style.width = `${b.w}px`;
          task.nodes.push(scan);
          task.guides.fade(0);
        },
        update(p) {
          const e = easeInOut(p);
          el.style.clipPath = up ? `inset(${(1 - e) * 100}% 0 0 0)` : `inset(0 0 ${(1 - e) * 100}% 0)`;
          const y = up ? b.y + b.h * (1 - e) : b.y + b.h * e;
          scan.style.transform = `translate(${b.x}px, ${y - 1}px)`;
          scan.style.opacity = Math.min(1, (1 - p) * 4);
          agent.x = b.x + b.w - 6;
          agent.y = y;
          l.progress = p;
        },
      };
      // Blueprint: the line drawing sweeps in from the left, then the real
      // capture renders over it from the top behind a scanline.
      const wire = {
        dur: 640 / SPEED,
        begin() {
          bp.style.clipPath = 'none';
          task.guides.fade(0);
        },
        update(p) {
          const e = easeInOut(p);
          el.style.clipPath = `inset(0 ${(1 - e) * 100}% 0 0)`;
          ph.style.opacity = 1 - p;
          agent.x = b.x + b.w * e;
          agent.y = b.y + b.h * (.5 + Math.sin(p * Math.PI * 2) * .18);
          l.progress = p * .45;
        },
      };
      const render = {
        dur: 760 / SPEED,
        begin() {
          el.style.removeProperty('clip-path');
          scan = tnode(task, 'mmb-scan', color);
          scan.style.width = `${b.w}px`;
          task.nodes.push(scan);
        },
        update(p) {
          const e = easeInOut(p);
          bp.style.clipPath = `inset(${e * 100}% 0 0 0)`;
          const y = b.y + b.h * e;
          scan.style.transform = `translate(${b.x}px, ${y - 1}px)`;
          scan.style.opacity = Math.min(1, (1 - p) * 4);
          agent.x = b.x + b.w - 6;
          agent.y = y;
          l.progress = .45 + p * .55;
        },
      };
      // Phases are picked once the wait is over: blueprint path or plain reveal.
      const branch = {
        phases: null,
        begin() {
          this.phases = bp ? [wire, render] : [reveal];
          // Tells the x-ray lens to keep off while the agents draw here.
          if (bp) el.classList.add('mmb-building');
        },
      };
      return [
        travel(agent, () => { b = task.anchor; return [b.x, b.y]; }),
        draw(task, () => b, 320, e => {
          if (!ph) {
            ph = tnode(task, 'mmb-ph', color);
            const file = img ? (img.currentSrc || img.src).split('/').pop().split('?')[0] : '';
            const name = document.createElement('span');
            name.textContent = file;
            ph.appendChild(name);
            task.nodes.push(ph);
          }
          ph.style.transform = `translate(${b.x}px, ${b.y}px)`;
          ph.style.width = `${Math.max(2, b.w * e)}px`;
          ph.style.height = `${Math.max(2, b.h * e)}px`;
        }),
        {
          begin() { waitedFrom = clock; },
          until: () => (loaded() && bpSettled) || clock - waitedFrom > 5000,
        },
        branch,
        settle(task, {
          begin() {
            el.style.removeProperty('clip-path');
            bp?.style.removeProperty('clip-path');
          },
          update(p) {
            const o = ph.style.opacity === '' ? 1 : +ph.style.opacity;
            ph.style.opacity = Math.min(o, 1 - p);
          },
        }),
      ];
    },

    shape(task) {
      const { agent, layer: l } = task;
      const el = l.el;
      let b;
      return [
        travel(agent, () => { b = task.anchor; return [b.x, b.y]; }),
        draw(task, () => b, 380, e => {
          el.style.transform = `scale(${Math.max(.001, e)})`;
          l.progress = e;
        }),
        settle(task, { begin() { el.style.transform = 'none'; } }),
      ];
    },

    rule(task) {
      const { agent, layer: l, color } = task;
      const el = l.el;
      const edge = l.opts.edge;
      let b, y, line, badge;
      return [
        travel(agent, () => {
          b = task.anchor;
          y = edge === 'top' ? b.y : b.y + b.h - 1;
          return [b.x, y];
        }),
        {
          dur: 440 / SPEED,
          begin() {
            line = tnode(task, 'mmb-rule', color);
            badge = tnode(task, 'mmb-badge', color);
            task.nodes.push(line, badge);
          },
          update(p) {
            const w = b.w * easeInOut(p);
            line.style.transform = `translate(${b.x}px, ${y}px)`;
            line.style.width = `${Math.max(1, w)}px`;
            badge.textContent = `${Math.round(w)}`;
            badge.style.transform = `translate(${b.x + w + 10}px, ${y - 8}px)`;
            agent.x = b.x + w;
            agent.y = y;
            l.progress = p;
          },
        },
        settle(task, {
          begin() {
            el.style.removeProperty(`border-${edge}-color`);
            el.classList.remove('mmb-nomark');
          },
          update(p) { line.style.opacity = 1 - p; badge.style.opacity = 1 - p; },
        }),
      ];
    },

    // "Paint bucket": the section background floods out from a click.
    fill(task) {
      const { agent, layer: l } = task;
      const color = agent.def.color;
      const el = l.el;
      let b, cx, cy, maxR;
      return [
        travel(agent, () => {
          b = task.anchor;
          const v = view();
          cx = b.x + b.w * (SMALL ? .5 : .14);
          cy = clamp(v.y + v.h * .38, b.y + 48, b.y + b.h - 48);
          return [cx, cy];
        }),
        {
          dur: 160,
          begin() { agent.press(); ripple(task, cx, cy, color); },
        },
        {
          dur: 900 / SPEED,
          begin() {
            // ::before lives in CSS pixels; the anchor box may be scaled.
            const k = task.k;
            const lx = (cx - b.x) / k;
            const ly = (cy - b.y) / k;
            const w = b.w / k;
            const h = b.h / k;
            maxR = Math.max(Math.hypot(lx, ly), Math.hypot(w - lx, ly), Math.hypot(lx, h - ly), Math.hypot(w - lx, h - ly));
            el.style.setProperty('--mmb-x', `${lx}px`);
            el.style.setProperty('--mmb-y', `${ly}px`);
          },
          update(p) {
            // Accelerating radius: the visible part fills fast, the rest of a
            // tall section catches up off screen.
            el.style.setProperty('--mmb-r', `${maxR * (p * p * .65 + p * .35)}px`);
            l.progress = p;
          },
        },
      ];
    },
  };

  // ---------------------------------------------------------------- layers & blocks
  const blocks = [];
  const layers = [];
  const queue = [];
  const tasks = new Set();

  function makeLayer(el, kind, opts, block) {
    const l = { el, kind, opts, block, state: 'hidden', progress: 0, task: null };
    // A decorative copy that must show exactly what the layer shows.
    l.twin = opts.twin ? block.el.querySelector(opts.twin) : null;
    if (kind === 'fill') l.fillColor = getComputedStyle(el).backgroundColor;
    l.onAccent = !!el.closest('.contact');
    layers.push(l);
    return l;
  }
  function hide(l) {
    const s = l.el.style;
    if (l.kind === 'shape') { s.transformOrigin = '0 0'; s.transform = 'scale(0.001)'; }
    else if (l.kind === 'rule') {
      s.setProperty(`border-${l.opts.edge}-color`, 'transparent');
      if (l.opts.marker) l.el.classList.add('mmb-nomark');
    } else if (l.kind === 'fill') {
      s.setProperty('--mmb-fill', l.fillColor);
      s.setProperty('--mmb-r', '0px');
      l.el.classList.add('mmb-fill');
    } else {
      s.clipPath = HIDDEN_CLIP;
      if (l.twin) l.twin.style.clipPath = HIDDEN_CLIP;
    }
    l.state = 'hidden';
    l.progress = 0;
  }
  function restore(l) {
    const s = l.el.style;
    if (l.kind === 'shape') { s.removeProperty('transform'); s.removeProperty('transform-origin'); }
    else if (l.kind === 'rule') { s.removeProperty(`border-${l.opts.edge}-color`); l.el.classList.remove('mmb-nomark'); }
    else if (l.kind === 'fill') {
      l.el.classList.remove('mmb-fill');
      for (const p of ['--mmb-fill', '--mmb-r', '--mmb-x', '--mmb-y']) s.removeProperty(p);
    } else {
      s.removeProperty('clip-path');
      l.twin?.style.removeProperty('clip-path');
      // An interrupted blueprint stage must not leave the drawing on top.
      if (l.kind === 'image') {
        l.el.querySelector('.project__bp')?.style.removeProperty('clip-path');
        l.el.classList.remove('mmb-building');
      }
    }
  }

  for (const [selector, specs] of SPEC) {
    for (const el of document.querySelectorAll(selector)) {
      const block = { el, layers: [], state: 'idle', visible: false, gate: null, enqueuedAt: 0 };
      for (const [layerSelector, kind, opts = {}] of specs) {
        if (opts.when && !el.matches(opts.when)) continue;
        const targets = layerSelector === ':scope' ? [el] : el.querySelectorAll(layerSelector);
        for (const target of targets) block.layers.push(makeLayer(target, kind, opts, block));
      }
      if (block.layers.length) blocks.push(block);
    }
  }
  blocks.sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  const fillBlocks = blocks.filter(b => b.layers[0].kind === 'fill');
  for (const block of blocks) {
    const owner = fillBlocks.find(f => f !== block && f.el.contains(block.el));
    if (owner) block.gate = owner.layers[0];
  }
  const blockByEl = new Map(blocks.map(b => [b.el, b]));

  function enqueue(block) {
    if (block.state !== 'idle') return;
    if (block.gate && block.gate.state === 'hidden') enqueue(block.gate.block);
    block.state = 'queued';
    block.enqueuedAt = clock;
    for (const l of block.layers) {
      if (l.state !== 'hidden') continue;
      l.state = 'queued';
      queue.push(l);
    }
    checkBlock(block);
    wake();
  }
  function checkBlock(block) {
    if (block.layers.every(l => l.state === 'done')) block.state = 'done';
  }
  function startable(l) {
    const g = l.block.gate;
    if (!g || g.state === 'done') return true;
    if (g.state === 'hidden') { enqueue(g.block); return false; }
    return g.state === 'active' && g.progress >= .3;
  }
  function pick(agent) {
    let best = null;
    let bestScore = -Infinity;
    let seen = 0;
    for (const l of [...queue]) {
      if (!startable(l)) continue;
      const b = l.el.getBoundingClientRect();
      if (!b.width && !b.height) { complete(l); continue; }
      const d = Math.hypot(b.left + scrollX - agent.x, b.top + scrollY - agent.y);
      const score = (l.block.visible ? 100 : 0) + (agent.likes(l) ? 12 : 0) - seen * 4 - d / 300;
      if (score > bestScore) { best = l; bestScore = score; }
      if (++seen >= 6) break;
    }
    return best;
  }

  // ---------------------------------------------------------------- tasks
  // The box a task follows. A shape is hidden by its own inline transform,
  // which must not count as movement.
  const trackBox = l => (l.kind === 'shape' ? naturalBox(l.el) : pageBox(l.el));
  // Map a point from the task's anchor frame to the page.
  function toPage(task, x, y) {
    const m = task.map;
    if (!m) return [x, y];
    return [m.x + (x - task.anchor.x) * m.sx, m.y + (y - task.anchor.y) * m.sy];
  }
  // Follow the element: the overlay frame becomes the anchor box mapped onto
  // the current box (translation + scale; small 3D tilts read as their bounds).
  function track(task, cur) {
    const a = task.anchor;
    const sx = a.w > 1 && cur.w > 0 ? cur.w / a.w : 1;
    const sy = a.h > 1 && cur.h > 0 ? cur.h / a.h : 1;
    const still = Math.abs(cur.x - a.x) < .25 && Math.abs(cur.y - a.y) < .25 && Math.abs(sx - 1) < .001 && Math.abs(sy - 1) < .001;
    task.map = still ? null : { x: cur.x, y: cur.y, sx, sy };
    task.wrap.style.transform = still ? '' : `translate(${cur.x}px, ${cur.y}px) scale(${sx}, ${sy}) translate(${-a.x}px, ${-a.y}px)`;
  }
  function start(agent, l) {
    queue.splice(queue.indexOf(l), 1);
    l.state = 'active';
    const color = l.onAccent && agent.def.color === ACCENT ? INK : agent.def.color;
    const anchor = trackBox(l);
    const task = {
      agent, layer: l, color, nodes: [], i: 0, tNext: clock,
      anchor, map: null, wrap: node('mmb-task'),
      // Rendered px per CSS px of the element when the task began.
      k: anchor.w / (l.el.offsetWidth || anchor.w) || 1,
    };
    task.phases = PLANS[l.kind](task);
    l.task = task;
    agent.task = task;
    tasks.add(task);
  }
  function step(task) {
    for (;;) {
      const ph = task.phases[task.i];
      if (!ph.started) {
        ph.started = true;
        ph.t0 = task.tNext;
        ph.begin?.(ph);
        if (ph.phases) {
          task.phases.splice(task.i, 1, ...ph.phases);
          continue;
        }
      }
      if (ph.until) {
        if (!ph.until()) { task.tNext = clock; return; }
        task.tNext = clock;
      } else {
        const dur = ph.dur || 0;
        const p = dur > 0 ? Math.min(1, (clock - ph.t0) / dur) : 1;
        ph.update?.(p, ph);
        if (p < 1) return;
        task.tNext = ph.t0 + dur;
      }
      task.i++;
      if (task.i >= task.phases.length) { complete(task.layer); return; }
    }
  }
  function release(task) {
    if (!tasks.has(task)) return;
    tasks.delete(task);
    const a = task.agent;
    [a.x, a.y] = toPage(task, a.x, a.y);
    task.wrap.remove();
    a.task = null;
    a.mode = 'arrow';
    a.idleSince = clock;
    a.readyAt = clock + 40 + a.rand() * 120;
    task.layer.task = null;
  }
  function complete(l) {
    if (l.state === 'done') return;
    if (l.task) release(l.task);
    restore(l);
    const i = queue.indexOf(l);
    if (i >= 0) queue.splice(i, 1);
    l.state = 'done';
    l.progress = 1;
    checkBlock(l.block);
  }
  function finish({ everything = false } = {}) {
    for (const l of layers) {
      if (l.state === 'queued' || l.state === 'active' || (everything && l.state === 'hidden')) complete(l);
    }
    for (const b of blocks) if (everything || b.state === 'queued') checkBlock(b);
    if (everything) for (const b of blocks) b.state = 'done';
  }
  // Blocks the reader has already scrolled past are not worth animating.
  function fastForward() {
    for (const block of blocks) {
      if (block.state !== 'queued' || block.visible || clock - block.enqueuedAt < OFFSCREEN_GRACE) continue;
      if (block.gate && block.gate.state !== 'done') complete(block.gate);
      for (const l of block.layers) if (l.state !== 'done') complete(l);
    }
  }

  // ---------------------------------------------------------------- visitor
  // Mouse users join the squad: while the agents work, a "You" tag rides
  // along the real pointer (the cursor itself is never replaced).
  const me = document.createElement('div');
  me.className = 'mmb-me';
  me.setAttribute('aria-hidden', 'true');
  me.innerHTML = '<span class="mmb-tag"></span>';
  me.style.setProperty('--c', getComputedStyle(root).getPropertyValue('--paper').trim() || '#f2f4ef');
  const meTag = me.firstChild;
  document.body.appendChild(me);
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let meInside = false;
  let meX = 0;
  let meY = 0;
  let meQueued = false;
  addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || !finePointer.matches) return;
    meX = event.clientX;
    meY = event.clientY;
    meInside = true;
    if (meQueued) return;
    meQueued = true;
    requestAnimationFrame(() => {
      meQueued = false;
      me.style.transform = `translate3d(${meX}px, ${meY}px, 0)`;
    });
  }, { passive: true });
  document.addEventListener('mouseout', event => { if (!event.relatedTarget) meInside = false; });

  // ---------------------------------------------------------------- HUD
  const hud = document.createElement('div');
  hud.className = 'mmb-hud';
  hud.setAttribute('role', 'group');
  hud.innerHTML =
    `<span class="mmb-hud__dots" aria-hidden="true">${ROSTER.slice(0, 5).map((a, i) => `<i style="--c:${a.color};--i:${i}"></i>`).join('')}</span>` +
    '<span class="mmb-hud__busy" aria-hidden="true"><b class="mmb-hud__agents"></b> <span class="mmb-hud__agents-label"></span></span>' +
    '<span class="mmb-hud__busy" aria-hidden="true"><b class="mmb-hud__done"></b> / <span class="mmb-hud__total"></span> <span class="mmb-hud__layers-label"></span></span>' +
    '<span class="mmb-hud__busy mmb-hud__bar" aria-hidden="true"><i></i></span>' +
    '<span class="mmb-hud__ready" aria-hidden="true"></span>' +
    '<button type="button" data-act="replay"></button>' +
    '<button type="button" class="mmb-hud__busy" data-act="skip"></button>';
  document.body.appendChild(hud);
  const hudParts = {
    agents: hud.querySelector('.mmb-hud__agents'),
    agentsLabel: hud.querySelector('.mmb-hud__agents-label'),
    done: hud.querySelector('.mmb-hud__done'),
    total: hud.querySelector('.mmb-hud__total'),
    layersLabel: hud.querySelector('.mmb-hud__layers-label'),
    bar: hud.querySelector('.mmb-hud__bar i'),
    ready: hud.querySelector('.mmb-hud__ready'),
    replay: hud.querySelector('[data-act="replay"]'),
    skip: hud.querySelector('[data-act="skip"]'),
  };
  function relabelHud() {
    hud.setAttribute('aria-label', str('group'));
    hudParts.agents.textContent = AGENT_COUNT;
    hudParts.agentsLabel.textContent = str('agents');
    hudParts.total.textContent = layers.length;
    hudParts.layersLabel.textContent = str('layers');
    hudParts.replay.textContent = `↺ ${str('replay')}`;
    hudParts.replay.setAttribute('aria-label', str('replayLabel'));
    hudParts.skip.textContent = str('skip');
    hudParts.skip.setAttribute('aria-label', str('skipLabel'));
    hudParts.ready.textContent = `✓ ${str('ready')}`;
    meTag.textContent = str('you');
  }
  let lastDone = -1;
  let idleSince = 0;
  let readyUntil = 0;
  function updateHud(busy) {
    const done = layers.reduce((n, l) => n + (l.state === 'done'), 0);
    if (done !== lastDone) {
      // The last layer just landed: a short "page ready" beat before idling.
      if (done === layers.length && lastDone >= 0) readyUntil = clock + 2600;
      lastDone = done;
      hudParts.done.textContent = done;
      hudParts.bar.style.transform = `scaleX(${done / layers.length})`;
    }
    if (busy) idleSince = 0; else if (!idleSince) idleSince = clock;
    const ready = clock < readyUntil;
    if (ready && document.activeElement === hudParts.skip) hudParts.replay.focus();
    const keep = hud.matches(':hover') || hud.contains(document.activeElement);
    hud.classList.toggle('is-ready', ready);
    hud.classList.toggle('is-idle', !busy && !ready && !keep && clock - idleSince > 1800);
    me.classList.toggle('is-on', meInside && (busy || clock - idleSince < 1500));
  }
  hud.addEventListener('click', event => {
    const act = event.target.closest('button')?.dataset.act;
    if (act === 'replay') replay();
    if (act === 'skip') skipAll();
  });

  function replay() {
    const inView = blocks.filter(b => b.visible);
    for (const b of inView) {
      for (const l of b.layers) { complete(l); hide(l); }
      b.state = 'idle';
    }
    for (const b of inView) enqueue(b);
    for (const a of agents) a.readyAt = Math.max(a.readyAt, clock + 120 + a.index * 25);
  }
  // Skip lands the whole page for this visit only: every load or reload
  // builds again, and Replay stays available.
  function skipAll() {
    finish({ everything: true });
    if (document.activeElement === hudParts.skip) hudParts.replay.focus();
    wake();
  }
  let alive = true;
  function teardown() {
    alive = false;
    io?.disconnect();
    layer.remove();
    hud.remove();
    me.remove();
  }

  // ---------------------------------------------------------------- loop
  let clock = 0;
  let last = 0;
  let running = false;
  const agents = ROSTER.slice(0, AGENT_COUNT).map((def, i) => new Agent(def, i));

  function frame(now) {
    if (!alive) { running = false; return; }
    const dt = Math.min(64, now - last || 16);
    last = now;
    clock += dt;
    fastForward();
    for (const a of agents) {
      if (a.task || clock < a.readyAt) continue;
      const l = pick(a);
      if (l) start(a, l);
    }
    const live = [...tasks];
    const boxes = live.map(task => trackBox(task.layer));
    live.forEach((task, i) => track(task, boxes[i]));
    for (const task of live) step(task);
    for (const a of agents) a.render(dt);
    const busy = tasks.size > 0 || queue.length > 0;
    updateHud(busy);
    const visibleAgents = agents.some(a => a.alpha > .01);
    if (busy || visibleAgents || !hud.classList.contains('is-idle')) requestAnimationFrame(frame);
    else running = false;
  }
  function wake() {
    if (running || !alive) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  // ---------------------------------------------------------------- boot
  let io = null;
  function safeBoot() {
    try { boot(); } catch (error) {
      for (const l of layers) restore(l);
      root.classList.remove('mm-build', 'mm-build-ready');
      teardown();
    }
  }
  function boot() {
    // The <head> fail-safe already gave up on build mode: leave the page alone.
    if (!root.classList.contains('mm-build')) { teardown(); return; }
    for (const l of layers) hide(l);
    sizeLayer();
    relabelHud();
    hud.classList.add('is-on');
    // Opening shot: a blank canvas where the squad appears before it starts.
    agents.forEach((a, i) => {
      a.idleSince = 0;
      a.readyAt = 380 + i * 45;
    });
    root.classList.add('mm-build-ready');

    io = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const block = blockByEl.get(entry.target);
        block.visible = entry.isIntersecting;
        if (entry.isIntersecting) enqueue(block);
      }
    }, { rootMargin: '0px 0px -8% 0px' });
    for (const b of blocks) io.observe(b.el);
    // The trigger line sits 8% above the bottom edge, which the last blocks
    // of the page can never cross: at the end of the page, build what shows.
    const forced = new Set();
    const atEnd = () => {
      for (const b of forced) if (!onScreen(b.el)) { b.visible = false; forced.delete(b); }
      if (scrollY + innerHeight < document.documentElement.scrollHeight - 4) return;
      for (const b of blocks) {
        if (b.state !== 'idle' || !onScreen(b.el)) continue;
        b.visible = true;
        forced.add(b);
        enqueue(b);
      }
    };
    addEventListener('scroll', atEnd, { passive: true });
    atEnd();
    wake();

    new ResizeObserver(sizeLayer).observe(document.body);
    let lastWidth = innerWidth;
    addEventListener('resize', () => {
      if (innerWidth === lastWidth) return;
      lastWidth = innerWidth;
      finish();
    });
    // Text is about to change under the agents: land everything in progress.
    document.addEventListener('click', event => {
      if (event.target.closest('#lang [data-lang]')) finish();
    }, true);
    new MutationObserver(() => {
      agents.forEach(a => a.relabel());
      relabelHud();
    }).observe(root, { attributes: true, attributeFilter: ['lang'] });
    addEventListener('beforeprint', () => finish({ everything: true }));
    // Keyboard users never wait for the agents: a focused block lands at once.
    document.addEventListener('focusin', event => {
      for (const b of blocks) {
        if (b.state === 'done' || !b.el.contains(event.target)) continue;
        if (b.gate) complete(b.gate);
        for (const l of b.layers) complete(l);
        b.state = 'done';
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && (tasks.size || queue.length)) finish();
    });
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', event => {
      if (event.matches) { finish({ everything: true }); teardown(); }
    });
  }
  // Line geometry depends on the web fonts: wait for them, but never long.
  const fontsReady = document.fonts ? Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1200))]) : Promise.resolve();
  fontsReady.then(safeBoot);
})();
