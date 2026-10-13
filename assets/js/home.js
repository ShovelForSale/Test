/* Paper Converting Professional — home page: hero slider and its demos, best sellers, napkin colours.
   Needs site.js (window.PC). */
(() => {
  'use strict';

  const { $, $$, esc, reduce, IMG, getProduct, productCard, priceHtml, prodUrl, whileVisible, params, cartAsText } = window.PC;
  const scriptUrl = document.currentScript && document.currentScript.src;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const wait = ms => new Promise(r => setTimeout(r, ms));

  /* ---------------- best sellers (product ids from the shop) ---------------- */
  const PICKS = {
    all: [3330, 2733, 2353, 2957, 3158, 4788, 580, 2998],
    paper: [3330, 2733, 2536, 2353, 3160, 2392, 2957, 3158],
    hygiene: [4788, 575, 580, 664, 2791, 2998, 587, 2585],
  };
  const HITS = new Set([3330, 3158, 580]);
  const grid = $('#productGrid');
  function renderProducts(filter) {
    grid.innerHTML = PICKS[filter].map(id => getProduct(id)).filter(Boolean)
      .map((p, i) => productCard(p, i, { hit: HITS.has(p.id) })).join('');
  }
  $$('#prodTabs .tab').forEach(t => t.addEventListener('click', () => {
    $$('#prodTabs .tab').forEach(x => { const on = x === t; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', String(on)); });
    renderProducts(t.dataset.filter);
  }));
  renderProducts('all');

  /* prices written in the page are refreshed from the catalog */
  $$('[data-price]').forEach(el => {
    const p = getProduct(el.dataset.price);
    if (p) el.innerHTML = priceHtml(p);
  });

  /* ---------------- napkin colour picker ---------------- */
  const NAPKINS = [
    { id: 2313, color: 'Червено', c: '#c8102e' },
    { id: 4533, color: 'Бордо', c: '#6d1a2a' },
    { id: 2426, color: 'Шампанско', c: '#e3cf9e', light: true },
    { id: 2403, color: 'Жълто', c: '#f2c230', light: true },
    { id: 4688, color: 'Светлозелено', c: '#9cc83c', light: true },
    { id: 2322, color: 'Синьо', c: '#1f4fa8' },
    { id: 4693, color: 'Пепел от рози', c: '#c99aa6', light: true },
    { id: 2348, color: 'Черно', c: '#1d1d1f' },
    { id: 2465, color: 'Бяло', c: '#f7f5f0', light: true, white: true },
  ].map(n => ({ ...n, p: getProduct(n.id) })).filter(n => n.p);

  const sw = $('#swatches');
  sw.innerHTML = NAPKINS.map((n, i) => `<button type="button" class="swatch" role="radio" aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}" style="--c:${n.c}" data-i="${i}" title="${esc(n.color)}"><span class="sr">${esc(n.color)}</span></button>`).join('');
  function pickNapkin(i, focus) {
    const n = NAPKINS[i], img = $('#napImg');
    if (!n) return;
    $$('.swatch', sw).forEach((b, k) => { b.setAttribute('aria-checked', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
    if (focus) $$('.swatch', sw)[i].focus();
    img.classList.add('is-swapping');
    setTimeout(() => {
      if (n.p.img) img.src = IMG + n.p.img;
      img.alt = n.p.name;
      img.classList.remove('is-swapping');
    }, reduce ? 0 : 180);
    $('#napLink').href = prodUrl(n.p.id);
    $('#napColor').textContent = n.color;
    $('#napColor').style.setProperty('--c', n.c);
    $('#napTitle').textContent = n.p.name;
    $('#napPrice').innerHTML = priceHtml(n.p);
    $('#napAdd').dataset.add = n.p.id;
  }
  sw.addEventListener('click', e => { const b = e.target.closest('.swatch'); if (b) pickNapkin(+b.dataset.i); });
  sw.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    const cur = $$('.swatch', sw).findIndex(b => b.getAttribute('aria-checked') === 'true');
    pickNapkin((cur + d + NAPKINS.length) % NAPKINS.length, true);
  });
  pickNapkin(0);

  /* ---------------- quote form filled from the cart or a product page ---------------- */
  const msg = $('#f-msg');
  const asked = params.get('product') && getProduct(params.get('product'));
  if (msg && (params.get('quote') === 'cart' || asked)) {
    msg.value = asked ? `Бих искал(а) оферта за:\n${asked.name}${params.get('opt') ? ` (${params.get('opt')})` : ''}\nКоличество: ${params.get('qty') || 1}` : cartAsText();
    history.replaceState(null, '', location.pathname + '#contact');
    requestAnimationFrame(() => {
      $('#contact').scrollIntoView();
      $('#f-name').focus({ preventScroll: true });
    });
  }

  /* ======================================================
     HERO — slider
     ====================================================== */
  const slider = $('#slider'), slides = $$('.slide', slider), tabs = $$('.slider__tab', slider);
  const SLIDE_MS = 8000;
  let cur = 0, elapsed = 0, hover = false, holdUntil = 0, sliderSeen = true;
  const hold = (ms = 12000) => { holdUntil = performance.now() + ms; };

  function go(i) {
    cur = (i + slides.length) % slides.length;
    elapsed = 0;
    slides.forEach((s, k) => { s.classList.toggle('is-active', k === cur); s.setAttribute('aria-hidden', String(k !== cur)); s.inert = k !== cur; });
    tabs.forEach((t, k) => { t.classList.toggle('is-active', k === cur); t.setAttribute('aria-selected', String(k === cur)); $('i', t).style.width = '0%'; });
    if (cur === 1) (roll3d || roll).onShow();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { go(i); hold(); });
    t.addEventListener('keydown', e => {
      const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!d) return;
      go(cur + d); hold(); tabs[cur].focus();
    });
  });
  slider.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') hover = true; });
  slider.addEventListener('pointerleave', () => { hover = false; });
  slider.addEventListener('focusin', () => hold());
  whileVisible(slider, v => { sliderSeen = v; });

  // swipe between slides on touch, but not while pulling a towel or a sheet
  let sx = null, sy = 0;
  slider.addEventListener('touchstart', e => {
    if (e.target.closest('.towel, #sheet, .fan-nap, .roll3d')) { sx = null; return; }
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  slider.addEventListener('touchend', e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { go(cur + (dx < 0 ? 1 : -1)); hold(); }
    sx = null;
  }, { passive: true });

  /* ---------------- slide 1: towel dispenser ---------------- */
  const towelArt = (() => {
    const svg = $('#dispSvg'), host = $('#towel'), hint = $('#towelHint');
    const NS = 'http://www.w3.org/2000/svg';
    const SLOT = 330, X0 = 122, X1 = 278, CX = 200;
    const PANEL = 96, FULL = PANEL * 3, REST = PANEL;   // a Z towel has three panels; one hangs out of the slot
    const CAP = 12, AUTO_MS = 760;
    const el = (tag, attrs, parent) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(n);
      return n;
    };

    // the stack of towels behind the window goes down by one towel each time
    const stackParts = ['#stackPaper', '#stackLines', '#stackSide'].map(s => $(s, svg)), stackTop = $('#stackTop', svg);
    const FLOOR = 254, PER = 10.5;
    let left = CAP, stackH = CAP * PER;
    function drawStack() {
      const y = (FLOOR - stackH).toFixed(1), h = Math.max(0, stackH).toFixed(1);
      stackParts.forEach(r => { r.setAttribute('y', y); r.setAttribute('height', h); });
      stackTop.setAttribute('y', y);
      stackTop.setAttribute('opacity', stackH > 3 ? 1 : 0);
    }

    // one towel, drawn from its lower edge (y = 0) up to its top (y = -FULL)
    function makeTowel() {
      const g = el('g', {});
      el('rect', { x: X0 + 2, y: -FULL, width: X1 - X0 + 8, height: FULL, fill: 'url(#tShadowX)', transform: 'translate(4 6)' }, g);
      el('rect', { x: X0 + 10, y: 5, width: X1 - X0 - 8, height: 8, fill: 'url(#tShadowY)', opacity: '.7' }, g);
      const d = `M${X0} ${-FULL} H${X1} V-2 Q${CX} 6 ${X0} -2 Z`;
      el('path', { class: 'tw-paper', d, fill: 'url(#tPaper)' }, g);
      el('path', { d, fill: 'url(#tEmboss)' }, g);
      for (let k = 1; k < 3; k++) {   // fold lines between the panels
        const y = -k * PANEL;
        el('rect', { x: X0, y, width: X1 - X0, height: 10, fill: '#5a4626', 'fill-opacity': '.045' }, g);
        el('line', { x1: X0, x2: X1, y1: y, y2: y, stroke: '#5a4626', 'stroke-opacity': '.2', 'stroke-width': 1.2 }, g);
        el('line', { x1: X0, x2: X1, y1: y + 1.5, y2: y + 1.5, stroke: '#fff', 'stroke-width': 1.2 }, g);
      }
      el('path', { d: `M${X1 - 1} -5 Q${CX} 3 ${X0 + 1} -5`, fill: 'none', stroke: '#fff', 'stroke-width': 1.4 }, g);
      el('path', { d: `M${X1} -2 Q${CX} 6 ${X0} -2`, fill: 'none', stroke: '#5a4626', 'stroke-opacity': '.18' }, g);
      return { g, len: 0 };
    }
    let cur = makeTowel(), next = makeTowel();
    host.append(next.g, cur.g);   // the next towel waits behind, folded into this one

    let L = REST, vel = 0, sway = 0, swayV = 0, mode = 'rest', busy = false, autoFrom = REST, autoT0 = 0, still = false;
    const falling = [];
    const place = (tw, a) => tw.g.setAttribute('transform', `rotate(${a.toFixed(2)} ${CX} ${SLOT}) translate(0 ${(SLOT + tw.len).toFixed(1)})`);
    const ease = k => (k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
    const unitsPerPx = () => { const r = svg.getBoundingClientRect(); return 1 / Math.min(r.width / 400, r.height / 470); };

    function detach() {
      const g = cur.g, dir = Math.random() > .5 ? 1 : -1;
      if (reduce) g.remove();
      else falling.push({ g, y: SLOT + FULL, vy: 2.5, rot: sway, vr: dir * .3, op: 1 });
      cur = next; cur.len = REST; L = REST; vel = 0;
      next = makeTowel();
      host.insertBefore(next.g, host.firstChild);
      swayV += dir * .9;   // the next towel swings as it is pulled out
      left = Math.max(0, left - 1);
      if (!left) setTimeout(() => { left = CAP; still = false; }, 900);   // a fresh pack goes in
      mode = 'rest';
      still = false;
      setTimeout(() => { busy = false; hint.classList.remove('is-hidden'); }, 500);
    }
    function pull() {
      if (busy) return;
      busy = true; still = false;
      hint.classList.add('is-hidden');
      if (reduce) { L = FULL; detach(); return; }
      autoFrom = L; autoT0 = performance.now(); mode = 'auto';
    }

    function frame(t = performance.now()) {
      if (still && mode === 'rest') return;   // nothing moves: draw nothing
      if (mode === 'auto') {
        const k = Math.min(1, (t - autoT0) / AUTO_MS);
        L = autoFrom + (FULL + 2 - autoFrom) * ease(k);
        if (L >= FULL) detach();
      } else if (mode === 'rest') {
        vel = (vel + (REST - L) * .16) * .7;   // a short tug springs back
        L += vel;
      }
      swayV = (swayV - sway * .05) * .93;
      sway += swayV;
      stackH += (left * PER - stackH) * .12;
      drawStack();
      cur.len = L;
      next.len = Math.max(0, Math.min(REST, L - (FULL - REST)));
      place(cur, sway);
      place(next, sway * .6);
      hint.setAttribute('transform', `translate(0 ${(SLOT + L + 9).toFixed(1)})`);
      for (let i = falling.length - 1; i >= 0; i--) {
        const f = falling[i];
        f.vy += .38; f.y += f.vy; f.rot += f.vr; f.op -= .018;
        if (f.op <= 0) { f.g.remove(); falling.splice(i, 1); continue; }
        f.g.setAttribute('transform', `translate(0 ${f.y.toFixed(1)}) rotate(${f.rot.toFixed(2)} ${CX} ${-FULL / 2})`);
        f.g.setAttribute('opacity', f.op.toFixed(2));
      }
      if (mode === 'rest' && !falling.length && Math.abs(L - REST) < .02 && Math.abs(vel) < .02
        && Math.abs(sway) < .01 && Math.abs(swayV) < .01 && Math.abs(stackH - left * PER) < .02) {
        L = REST; sway = 0; stackH = left * PER;
        drawStack(); cur.len = L; place(cur, 0); place(next, 0);
        still = true;
      }
    }

    // drag the towel down to pull it
    let y0 = 0, x0 = 0, l0 = 0, moved = 0;
    host.addEventListener('pointerdown', e => {
      if (busy) return;
      mode = 'drag'; still = false; y0 = e.clientY; x0 = e.clientX; l0 = L; moved = 0; hold();
      svg.classList.add('is-dragging');
      hint.classList.add('is-hidden');
      host.setPointerCapture?.(e.pointerId);
    });
    host.addEventListener('pointermove', e => {
      if (mode !== 'drag') return;
      const k = unitsPerPx(), dy = (e.clientY - y0) * k, dx = (e.clientX - x0) * k;
      moved = Math.max(moved, Math.abs(dy), Math.abs(dx));
      L = Math.max(REST, Math.min(FULL + 2, l0 + dy));
      sway = Math.max(-6, Math.min(6, dx * .06)); swayV = 0;
      if (L >= FULL) {
        busy = true;
        svg.classList.remove('is-dragging');
        detach();
      }
    });
    const up = () => {
      if (mode !== 'drag') return;
      mode = 'rest';
      svg.classList.remove('is-dragging');
      if (moved < 6 || L > REST + 46) pull();   // a tap, or a long enough pull, finishes it
      else hint.classList.remove('is-hidden');
    };
    host.addEventListener('pointerup', up);
    host.addEventListener('pointercancel', up);
    host.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hold(); pull(); } });
    host.addEventListener('touchstart', e => e.preventDefault(), { passive: false });   // pulling must not scroll the page
    frame();
    return { pull, frame, get busy() { return busy || mode === 'drag'; } };
  })();

  /* ---------------- slide 2: toilet roll ---------------- */
  const roll = (() => {
    const svg = $('#rollSvg'), sheet = $('#sheet'), perfG = $('#perfs');
    const sheetParts = ['#sheetPaper', '#sheetDots', '#sheetEmboss'].map(id => $(id));
    const patterns = [$('#paperDots'), $('#paperFlowers')], rings = $$('#capRings ellipse'), hint = $('#pullHint');
    const NS = 'http://www.w3.org/2000/svg';
    const TOP = 132, EDGE = 242, X0 = 160, X1 = 380, PERF = 150, MIN = 150, MAXL = 370;   // TOP: where the sheet leaves the roll; EDGE: bottom of the roll
    const shadowX = $('#sheetShadowX'), shadowY = $('#sheetShadowY');
    let base = 240, L = base, U = 0, drag = 0, dragging = false, startY = 0, moved = 0, auto = false, demoed = false, hintT, drawn = '';

    const perfs = Array.from({ length: 4 }, () => {
      const a = document.createElementNS(NS, 'line'), b = document.createElementNS(NS, 'line');
      b.setAttribute('class', 'hl');
      [a, b].forEach(l => { l.setAttribute('x1', X0 + 4); l.setAttribute('x2', X1 - 4); perfG.appendChild(l); });
      return [a, b];
    });
    sheet.setAttribute('tabindex', '0');
    sheet.setAttribute('role', 'button');
    sheet.setAttribute('aria-label', 'Откъснете лист');

    const zig = (y, from, to, amp) => {
      let d = '';
      const n = 22, step = (to - from) / n;
      for (let i = 1; i <= n; i++) d += ` L${(from + step * i).toFixed(1)} ${(y + (i % 2 ? amp : 0)).toFixed(1)}`;
      return d;
    };
    // straight down the front of the roll, then the sheet narrows a little as it hangs, like real paper
    const shape = len => {
      const b = TOP + len, h = Math.max(0, b - EDGE), i = Math.min(3, h * .014);
      return `M${X0} ${TOP} H${X1} V${EDGE} C${X1} ${(EDGE + h * .45).toFixed(1)} ${X1 - i} ${(EDGE + h * .7).toFixed(1)} ${X1 - i} ${b.toFixed(1)}`
        + zig(b, X1 - i, X0 + i, 3.2) + ` C${X0 + i} ${(EDGE + h * .7).toFixed(1)} ${X0} ${(EDGE + h * .45).toFixed(1)} ${X0} ${EDGE} Z`;
    };
    function perfDists() {
      const off = ((U % PERF) + PERF) % PERF, out = [];
      for (let d = off; d < L - 10; d += PERF) if (d > 18) out.push(d);
      return out;
    }
    function render() {
      const key = L.toFixed(2) + '|' + U.toFixed(2);
      if (key === drawn) return;   // nothing moved: draw nothing
      drawn = key;
      const d = shape(L);
      sheetParts.forEach(part => part.setAttribute('d', d));
      const ds = perfDists();
      perfs.forEach(([a, b], i) => {
        const on = i < ds.length;
        a.style.display = b.style.display = on ? '' : 'none';
        if (on) { a.setAttribute('y1', TOP + ds[i]); a.setAttribute('y2', TOP + ds[i]); b.setAttribute('y1', TOP + ds[i] + 1.6); b.setAttribute('y2', TOP + ds[i] + 1.6); }
      });
      const shift = `translate(0 ${(U % 120).toFixed(2)})`;   // the embossing moves as the paper unrolls
      patterns.forEach(pat => pat.setAttribute('patternTransform', shift));
      rings.forEach((r, i) => { r.style.strokeDashoffset = (-U * (.3 + i * .1)).toFixed(1); });
      shadowX.setAttribute('height', Math.max(0, TOP + L - 246).toFixed(1));
      shadowY.setAttribute('y', (TOP + L).toFixed(1));
      hint.setAttribute('transform', `translate(0 ${(TOP + L + 18).toFixed(1)})`);
    }
    function setL(v, moving = true) {
      v = Math.max(60, Math.min(MAXL, v));
      if (moving) U += v - L;
      L = v;
    }
    const unitsPerPx = () => { const r = svg.getBoundingClientRect(); return 1 / Math.min(r.width / 520, r.height / 600); };

    function tear() {
      // tear at the perforation that leaves the sheet closest to its usual length
      const cands = perfDists().filter(d => d >= MIN && d <= L - 50);
      const cut = cands.length ? cands.reduce((a, b) => (Math.abs(b - 240) < Math.abs(a - 240) ? b : a)) : Math.max(MIN, L - PERF);
      const len = L - cut, top = TOP + cut;
      const g = document.createElementNS(NS, 'g');
      const dd = `M${X0 + 2} ${top}${zig(top, X0 + 2, X1 - 2, 2.6)} L${X1 - 3} ${top + len}${zig(top + len, X1 - 3, X0 + 3, 3.2)} Z`;
      g.innerHTML = `<path d="${dd}" fill="url(#gSheet)"/><path d="${dd}" fill="url(#paperDots)"/><path d="${dd}" fill="url(#paperFlowers)"/>`;
      svg.insertBefore(g, hint);
      g.style.transformBox = 'fill-box';
      g.style.transformOrigin = '50% 0%';
      const dir = Math.random() > .5 ? 1 : -1;
      const a = g.animate([
        { transform: 'translate(0px, 0px) rotate(0deg) skewX(0deg)', opacity: 1 },
        { transform: `translate(${dir * 16}px, 46px) rotate(${dir * 6}deg) skewX(${dir * 3}deg)`, opacity: 1, offset: .25 },
        { transform: `translate(${-dir * 14}px, 150px) rotate(${-dir * 8}deg) skewX(${-dir * 4}deg)`, opacity: .95, offset: .58 },
        { transform: `translate(${dir * 34}px, 330px) rotate(${dir * 18}deg) skewX(${dir * 2}deg)`, opacity: 0 },
      ], { duration: reduce ? 1 : 1500, easing: 'cubic-bezier(.4,0,.7,.6)' });
      a.onfinish = () => g.remove();
      setL(cut, false);
      base = Math.max(MIN, Math.min(290, cut));
      drag = 0;
      hint.classList.add('is-hidden');
      clearTimeout(hintT);
      hintT = setTimeout(() => hint.classList.remove('is-hidden'), 3500);
    }
    async function autoPull() {
      if (auto) return;
      auto = true;
      hint.classList.add('is-hidden');
      const from = drag, t1 = performance.now();
      await new Promise(res => {
        const step = t => {
          const k = Math.min(1, (t - t1) / 650);
          drag = from + 125 * (1 - Math.pow(1 - k, 3));
          if (k < 1) requestAnimationFrame(step); else res();
        };
        requestAnimationFrame(step);
      });
      await wait(140);
      tear();
      auto = false;
    }
    sheet.addEventListener('pointerdown', e => {
      dragging = true; moved = 0; startY = e.clientY; hold();
      hint.classList.add('is-hidden');
      svg.classList.add('is-dragging');
      sheet.setPointerCapture?.(e.pointerId);
    });
    sheet.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dy = (e.clientY - startY) * unitsPerPx();
      moved = Math.max(moved, Math.abs(dy));
      drag = Math.max(0, dy);
    });
    const up = () => {
      if (!dragging) return;
      dragging = false;
      svg.classList.remove('is-dragging');
      if (moved < 6) autoPull(); else if (drag > 40) tear();
    };
    sheet.addEventListener('pointerup', up);
    sheet.addEventListener('pointercancel', up);
    sheet.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hold(); autoPull(); } });
    sheet.addEventListener('touchstart', e => e.preventDefault(), { passive: false });   // pulling must not scroll the page

    function frame() {
      const target = Math.max(base, base + drag);
      if (dragging) setL(target);   // the sheet follows the finger
      else if (Math.abs(target - L) > .05) setL(L + (target - L) * .14);
      if (!dragging && !auto && drag > 0) drag = drag < .5 ? 0 : drag * .86;   // a short tug springs back
      render();
    }
    render();
    return {
      frame,
      onShow() {
        // show once what the sheet does, then leave it to the visitor
        if (demoed || reduce) return;
        demoed = true;
        setTimeout(() => { if (cur === 1 && !dragging) autoPull(); }, 1500);
      },
    };
  })();

  /* the toilet paper in 3D when the browser can draw it; the flat drawing stays for the rest */
  let roll3d = null;
  function load3d() {
    if (!scriptUrl || location.protocol === 'file:') return;
    let gl = null;
    try { const c = document.createElement('canvas'); gl = c.getContext('webgl2') || c.getContext('webgl'); } catch { /* no WebGL */ }
    if (!gl) return;
    import(new URL('roll3d.js', scriptUrl).href).then(m => {
      const host = $('#slide-1 .slide__art');
      roll3d = m.createRoll(host, { reduce, hold });
      host.classList.add('has-3d');
      if (cur === 1) roll3d.onShow();
    }).catch(() => { /* keep the flat drawing */ });
  }
  if ('requestIdleCallback' in window) requestIdleCallback(load3d, { timeout: 2000 }); else setTimeout(load3d, 1000);

  /* ---------------- slide 3: napkin fan ---------------- */
  (function fan() {
    const art = $('#artFan');
    const picks = NAPKINS.filter(n => !n.white).slice(0, 7);
    art.innerHTML = picks.map((n, i) => {
      const a = -26 + i * 12;
      return `<button type="button" class="fan-nap${n.light ? ' is-light' : ''}" style="--c:${n.c};--a:${a}deg;--d:${(i * .07).toFixed(2)}s" data-nap="${NAPKINS.indexOf(n)}" aria-label="${esc(n.color)} салфетки"><span>${esc(n.color)}</span></button>`;
    }).join('');
    art.addEventListener('click', e => {
      const b = e.target.closest('.fan-nap');
      if (!b) return;
      pickNapkin(+b.dataset.nap);
      $('#napkins').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    });
  })();

  /* one clock for the slider, the towel demo and the roll */
  let last = 0, towelT = 0;
  function tick(t) {
    const dt = Math.min(64, t - (last || t));
    last = t;
    const running = sliderSeen && !document.hidden;
    if (running && !reduce) {
      const paused = hover || t < holdUntil;
      if (!paused) {
        elapsed += dt;
        $('i', tabs[cur]).style.width = Math.min(100, elapsed / SLIDE_MS * 100).toFixed(2) + '%';
        if (elapsed >= SLIDE_MS) go(cur + 1);
      }
      if (cur === 0 && t >= holdUntil) {
        towelT += dt;
        if (towelT > 3600 && !towelArt.busy) { towelT = 0; towelArt.pull(); }
      }
    }
    if (running && cur === 0) towelArt.frame(t);
    if (running && cur === 1) (roll3d || roll).frame(t);
    requestAnimationFrame(tick);
  }
  go(0);
  requestAnimationFrame(tick);
})();
