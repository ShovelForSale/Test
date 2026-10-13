/* Paper Converting Professional — home page: hero slider and its demos, best sellers, napkin colours.
   Needs site.js (window.PC). */
(() => {
  'use strict';

  const { $, $$, esc, reduce, IMG, getProduct, productCard, priceHtml, prodUrl, whileVisible, params, cartAsText } = window.PC;
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
    if (cur === 1) roll.onShow();
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
    if (e.target.closest('.towel, #sheet, .fan-nap')) { sx = null; return; }
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
    const towel = $('#towel'), stack = $('#dispStack');
    const CAP = 10, TAB = -60;
    let left = CAP, busy = false;
    for (let i = 0; i < CAP; i++) stack.appendChild(document.createElement('i'));
    const bars = [...stack.children];
    const setY = (y, ms = 0, ease = 'cubic-bezier(.2,.7,.1,1)') => {
      towel.style.transition = ms ? `transform ${ms}ms ${ease}, opacity 500ms` : 'none';
      towel.style.transform = `translateY(${y}px)`;
    };
    const sync = () => bars.forEach((b, i) => b.classList.toggle('gone', i >= left));
    async function pull() {
      if (busy) return;
      busy = true;
      towel.classList.add('is-open');
      setY(4, 420);
      await wait(reduce ? 0 : 900);
      towel.style.transition = 'transform 700ms cubic-bezier(.5,0,.75,0), opacity 600ms';
      towel.style.transform = `translateY(300px) rotate(${Math.random() > .5 ? 6 : -6}deg)`;
      towel.style.opacity = '0';
      await wait(reduce ? 0 : 650);
      left = left > 1 ? left - 1 : CAP; // a fresh pack goes in when the last towel is taken
      sync();
      towel.classList.remove('is-open');
      setY(-120);
      void towel.offsetWidth;
      towel.style.opacity = '1';
      setY(TAB, 560, 'cubic-bezier(.34,1.56,.64,1)');
      await wait(reduce ? 0 : 560);
      busy = false;
    }
    // drag the tab down to pull
    let dragging = false, y0 = 0, dy = 0;
    towel.addEventListener('pointerdown', e => {
      if (busy) return;
      dragging = true; y0 = e.clientY; dy = 0; hold();
      towel.setPointerCapture?.(e.pointerId);
    });
    towel.addEventListener('pointermove', e => {
      if (!dragging) return;
      dy = clamp(e.clientY - y0, 0, 120);
      setY(TAB + dy);
      if (dy > 50) { dragging = false; pull(); }
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      if (dy < 6) pull(); else setY(TAB, 380, 'cubic-bezier(.34,1.56,.64,1)');
    };
    towel.addEventListener('pointerup', end);
    towel.addEventListener('pointercancel', end);
    towel.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hold(); pull(); } });
    setY(TAB);
    sync();
    return { pull, get busy() { return busy || dragging; } };
  })();

  /* ---------------- slide 2: toilet roll ---------------- */
  const roll = (() => {
    const svg = $('#rollSvg'), sheet = $('#sheet'), paper = $('#sheetPaper'), emb = $('#sheetEmboss'), perfG = $('#perfs');
    const patBody = $('#embossBody'), patSheet = $('#embossSheet'), caps = $$('#capRings ellipse'), hint = $('#pullHint');
    const NS = 'http://www.w3.org/2000/svg';
    const TOP = 210, X0 = 134, X1 = 386, PERF = 90, BASE = 210, MAXL = 330;
    let L = BASE, U = 0, drag = 0, dragging = false, startY = 0, moved = 0, auto = false, demoed = false, hintT;

    const perfLines = Array.from({ length: 5 }, () => {
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', X0); l.setAttribute('x2', X1);
      perfG.appendChild(l);
      return l;
    });
    sheet.setAttribute('tabindex', '0');
    sheet.setAttribute('role', 'button');
    sheet.setAttribute('aria-label', 'Откъснете лист');

    const zig = (y, from, to, amp) => {
      let d = '';
      const n = 18, step = (to - from) / n;
      for (let i = 1; i <= n; i++) d += ` L${(from + step * i).toFixed(1)} ${(y + (i % 2 ? amp : 0)).toFixed(1)}`;
      return d;
    };
    const shape = len => `M${X0} ${TOP} H${X1} V${TOP + len}${zig(TOP + len, X1, X0, 3.5)} Z`;
    function perfDists() {
      const off = ((U % PERF) + PERF) % PERF, out = [];
      for (let d = off; d < L - 8; d += PERF) if (d > 14) out.push(d);
      return out;
    }
    function render(t = 0) {
      const d = shape(L);
      paper.setAttribute('d', d);
      emb.setAttribute('d', d);
      const ds = perfDists();
      perfLines.forEach((l, i) => {
        if (i < ds.length) { l.setAttribute('y1', TOP + ds[i]); l.setAttribute('y2', TOP + ds[i]); l.style.display = ''; }
        else l.style.display = 'none';
      });
      const shift = `translate(0 ${(U % 18).toFixed(2)})`;
      patSheet.setAttribute('patternTransform', shift);
      patBody.setAttribute('patternTransform', shift);
      caps.forEach((cap, i) => { cap.style.strokeDashoffset = (-U * (0.35 + i * 0.12)).toFixed(1); });
      const bob = reduce ? 0 : Math.sin(t / 380) * 3;
      hint.setAttribute('transform', `translate(0 ${(TOP + L + 16 + bob).toFixed(1)})`);
    }
    function setL(v, moving = true) {
      v = clamp(v, 60, MAXL);
      if (moving) U += v - L;
      L = v;
    }
    const unitsPerPx = () => { const r = svg.getBoundingClientRect(); return 1 / Math.min(r.width / 520, r.height / 600); };

    function tear() {
      const cands = perfDists().filter(d => d >= 60 && d <= L - 36);
      const cut = cands.length ? cands[cands.length - 1] : Math.max(60, L - PERF);
      const len = L - cut, top = TOP + cut;
      const g = document.createElementNS(NS, 'g');
      const d = `M${X0} ${top}${zig(top, X0, X1, 2.5)} V${top + len}${zig(top + len, X1, X0, 3.5)} Z`;
      g.innerHTML = `<path d="${d}" fill="url(#gSheet)"/><path d="${d}" fill="url(#embossSheet)"/>`;
      svg.insertBefore(g, hint);
      g.style.transformBox = 'fill-box';
      g.style.transformOrigin = '50% 0%';
      const dir = Math.random() > .5 ? 1 : -1;
      const a = g.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dir * 24}px, 90px) rotate(${dir * 7}deg)`, opacity: 1, offset: .35 },
        { transform: `translate(${dir * 70}px, 380px) rotate(${dir * 22}deg)`, opacity: 0 },
      ], { duration: reduce ? 1 : 1200, easing: 'cubic-bezier(.45,0,.8,.55)' });
      a.onfinish = () => g.remove();
      setL(cut, false);
      drag = 0;
      hint.classList.add('is-hidden');
      clearTimeout(hintT);
      hintT = setTimeout(() => hint.classList.remove('is-hidden'), 4000);
    }
    async function autoPull() {
      if (auto) return;
      auto = true;
      const from = drag, t1 = performance.now();
      await new Promise(res => {
        const step = t => {
          const k = clamp((t - t1) / 600, 0, 1);
          drag = from + 120 * (1 - Math.pow(1 - k, 3));
          if (k < 1) requestAnimationFrame(step); else res();
        };
        requestAnimationFrame(step);
      });
      await wait(150);
      tear();
      auto = false;
    }
    sheet.addEventListener('pointerdown', e => {
      dragging = true; moved = 0; startY = e.clientY; hold();
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
      if (moved < 6) autoPull(); else if (drag > 36) tear();
    };
    sheet.addEventListener('pointerup', up);
    sheet.addEventListener('pointercancel', up);
    sheet.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hold(); autoPull(); } });

    function frame(t) {
      const target = BASE + drag;
      if (Math.abs(target - L) > .05) setL(L + (target - L) * (dragging ? .45 : .1));
      if (!dragging && !auto && drag > 0) drag *= .88; // a short tug springs back
      render(t);
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
    if (running && cur === 1) roll.frame(t);
    requestAnimationFrame(tick);
  }
  go(0);
  requestAnimationFrame(tick);
})();
