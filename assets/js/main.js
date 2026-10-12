/* Paper Converting Professional — front page interactions */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const BGN = 1.95583;

  const store = {
    get(k, d) { try { const v = localStorage.getItem('pcp.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('pcp.' + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };

  const state = { vat: store.get('vat', true), cart: store.get('cart', []) };

  /* Run a callback only while an element is on screen (keeps rAF loops cheap). */
  function whileVisible(el, onChange, margin = '100px') {
    if (!('IntersectionObserver' in window)) { onChange(true); return; }
    new IntersectionObserver(([e]) => onChange(e.isIntersecting), { rootMargin: margin }).observe(el);
  }

  function loop(fn) {
    let id = 0, last = 0, on = false;
    const tick = t => { const dt = Math.min(64, t - (last || t)); last = t; fn(dt, t); if (on) id = requestAnimationFrame(tick); };
    return {
      start() { if (on) return; on = true; last = 0; id = requestAnimationFrame(tick); },
      stop() { on = false; cancelAnimationFrame(id); },
    };
  }

  /* ---------------- toast ---------------- */
  const toastEl = $('#toast');
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
  }

  /* ---------------- header ---------------- */
  const header = $('#header');
  const onScrollHeader = () => header.classList.toggle('is-stuck', scrollY > 30);
  addEventListener('scroll', onScrollHeader, { passive: true });
  onScrollHeader();

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* desktop dropdowns: hover with intent delay, click to toggle, Esc / outside to close */
  const navItems = $$('.nav__item.has-mega, .nav__item.has-drop');
  function closeNav(except) {
    navItems.forEach(li => {
      if (li === except) return;
      li.classList.remove('is-open');
      $('.nav__link', li).setAttribute('aria-expanded', 'false');
    });
  }
  navItems.forEach(li => {
    const btn = $('.nav__link', li);
    let t;
    const open = () => { clearTimeout(t); closeNav(li); li.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); };
    const close = () => { t = setTimeout(() => { li.classList.remove('is-open'); btn.setAttribute('aria-expanded', 'false'); }, 160); };
    btn.addEventListener('click', () => (li.classList.contains('is-open') ? (li.classList.remove('is-open'), btn.setAttribute('aria-expanded', 'false')) : open()));
    if (finePointer) { li.addEventListener('mouseenter', open); li.addEventListener('mouseleave', close); }
    $$('a', li).forEach(a => a.addEventListener('click', () => closeNav()));
  });
  document.addEventListener('click', e => { if (!e.target.closest('.nav__item')) closeNav(); });

  /* ---------------- overlays: drawer, search, cart ---------------- */
  const drawer = $('#drawer'), burger = $('#burger'), search = $('#search'), cart = $('#cart');
  function setOverlay(el, open) {
    el.classList.toggle('is-open', open);
    el.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('is-locked', $$('.drawer.is-open, .cart.is-open, .search.is-open').length > 0);
  }
  burger.addEventListener('click', () => {
    const open = !drawer.classList.contains('is-open');
    setOverlay(drawer, open);
    burger.setAttribute('aria-expanded', String(open));
  });
  drawer.addEventListener('click', e => {
    if (e.target === drawer || e.target.closest('[data-close-drawer]') || e.target.closest('a')) {
      setOverlay(drawer, false); burger.setAttribute('aria-expanded', 'false');
    }
  });

  const searchInput = $('#searchInput'), searchResults = $('#searchResults');
  $('#searchOpen').addEventListener('click', () => { setOverlay(search, true); renderSearch(''); setTimeout(() => searchInput.focus(), 60); });
  $('#searchClose').addEventListener('click', () => setOverlay(search, false));
  search.addEventListener('click', e => { if (e.target === search || e.target.closest('.search__results a')) setOverlay(search, false); });

  $('#cartOpen').addEventListener('click', () => { renderCart(); setOverlay(cart, true); });
  cart.addEventListener('click', e => { if (e.target === cart || e.target.closest('[data-close-cart]')) setOverlay(cart, false); });

  addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      [drawer, search, cart].forEach(el => el.classList.contains('is-open') && setOverlay(el, false));
      burger.setAttribute('aria-expanded', 'false');
      closeNav();
    }
    if (e.key === '/' && !e.target.closest('input, textarea')) { e.preventDefault(); $('#searchOpen').click(); }
  });

  /* ---------------- search ---------------- */
  const SEARCH = [
    ['Тоалетна хартия на пачки', 'Хартия', '#own'], ['Тоалетна хартия на ролки', 'Хартия', '#own'],
    ['Тоалетна хартия мини джъмбо', 'Хартия', '#own'], ['Smart One', 'Хартия', '#own'],
    ['Кърпи за ръце V сгъване', 'Хартия', '#pull'], ['Кърпи за ръце Z сгъване', 'Хартия', '#pull'],
    ['Кърпи за ръце на ролка', 'Хартия', '#own'], ['Кухненски ролки', 'Хартия', '#own'],
    ['Салфетки 24×24 за бар', 'Салфетки', '#napkins'], ['Салфетки 33×33', 'Салфетки', '#napkins'],
    ['Салфетки 40×40', 'Салфетки', '#napkins'], ['Цветни салфетки', 'Салфетки', '#napkins'],
    ['Салфетки с печат Santia', 'Салфетки', '#napkins'], ['Салфетки с шевица', 'Салфетки', '#napkins'],
    ['Коледни салфетки', 'Салфетки', '#napkins'], ['Великденски салфетки', 'Салфетки', '#napkins'],
    ['Медицински ролки', 'Хартия', '#catalog'], ['Индустриални ролки', 'Индустрия', '#catalog'],
    ['Kimtech кърпи', 'Индустрия', '#catalog'], ['Бели дозатори', 'Дозатори', '#catalog'],
    ['Черни дозатори', 'Дозатори', '#catalog'], ['Инокс дозатори', 'Дозатори', '#catalog'],
    ['Сензорни дозатори', 'Дозатори', '#catalog'], ['Течен сапун и пяна', 'Хигиена', '#catalog'],
    ['Дезинфектанти', 'Хигиена', '#catalog'], ['Ароматизатори', 'Хигиена', '#catalog'],
    ['Препарати за кухня', 'Почистващи', '#catalog'], ['Препарати за под', 'Почистващи', '#catalog'],
    ['Препарати за WC и баня', 'Почистващи', '#catalog'], ['Препарати за стъкла', 'Почистващи', '#catalog'],
    ['Микрофибърни кърпи', 'Почистващи', '#catalog'], ['Перилни препарати', 'Почистващи', '#catalog'],
    ['Чували за смет', 'Консумативи', '#catalog'], ['Нитрилни ръкавици', 'ЛПС', '#catalog'],
    ['Маски за лице', 'ЛПС', '#catalog'], ['Престилки и калцуни', 'ЛПС', '#catalog'],
    ['Хотелска козметика', 'Хотели', '#catalog'], ['Еднократни прибори', 'Консумативи', '#catalog'],
    ['Покривки за маса', 'Консумативи', '#catalog'], ['Хигиенни колички', 'Почистващи', '#catalog'],
  ];
  const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function renderSearch(q) {
    const term = q.trim().toLowerCase();
    let list = term ? SEARCH.filter(([n, c]) => (n + ' ' + c).toLowerCase().includes(term)) : SEARCH.slice(0, 6);
    list = list.slice(0, 8);
    if (!list.length) {
      searchResults.innerHTML = `<li><a href="#contact"><span>Няма точно съвпадение. Попитайте ни за „${esc(q)}“</span><small>Контакт</small></a></li>`;
      return;
    }
    searchResults.innerHTML = list.map(([n, c, h]) => {
      let label = esc(n);
      if (term) {
        const i = n.toLowerCase().indexOf(term);
        if (i > -1) label = esc(n.slice(0, i)) + '<mark>' + esc(n.slice(i, i + term.length)) + '</mark>' + esc(n.slice(i + term.length));
      }
      return `<li><a href="${h}"><span>${label}</span><small>${c}</small></a></li>`;
    }).join('');
  }
  searchInput.addEventListener('input', () => renderSearch(searchInput.value));
  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') { const a = $('a', searchResults); if (a) { a.click(); location.hash = a.getAttribute('href'); } }
  });

  /* ---------------- product illustrations (inline SVG) ---------------- */
  let gid = 0;
  function illus(p) {
    const id = 'p' + (++gid);
    const paper = `<linearGradient id="${id}w" x1="0" x2="1"><stop offset="0" stop-color="#d9d2c5"/><stop offset=".45" stop-color="#fffdf8"/><stop offset="1" stop-color="#cfc7b8"/></linearGradient>`;
    const gold = `<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dd9e"/><stop offset=".5" stop-color="#d6ae5c"/><stop offset="1" stop-color="#8f6a2c"/></linearGradient>`;
    const shadow = `<ellipse cx="95" cy="146" rx="70" ry="8" fill="#000" opacity=".45"/>`;
    const roll = (x, y, w, h) => `
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}w)"/>
      <ellipse cx="${x + w / 2}" cy="${y + h}" rx="${w / 2}" ry="${w * .18}" fill="#cfc7b8"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#${id}w)"/>
      <ellipse cx="${x + w / 2}" cy="${y}" rx="${w / 2}" ry="${w * .18}" fill="#f6f1e7" stroke="#d9d2c5"/>
      <ellipse cx="${x + w / 2}" cy="${y}" rx="${w * .17}" ry="${w * .06}" fill="#9a7745"/>
      <ellipse cx="${x + w / 2}" cy="${y}" rx="${w * .12}" ry="${w * .042}" fill="#1c160f"/>`;
    const box = (front, top, side, deco = '') => `
      <path d="M40 70 L70 46 H160 L130 70 Z" fill="${top}"/>
      <path d="M130 70 L160 46 V112 L130 136 Z" fill="${side}"/>
      <path d="M40 70 H130 V136 H40 Z" fill="${front}"/>${deco}`;
    const s = {
      tp: `${shadow}${roll(48, 52, 36, 58)}${roll(92, 52, 36, 58)}${roll(26, 82, 36, 58)}${roll(70, 82, 36, 58)}${roll(114, 82, 36, 58)}
           <rect x="22" y="40" width="132" height="104" rx="16" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="2"/>`,
      jumbo: `${shadow}${roll(42, 46, 106, 92)}<rect x="42" y="98" width="106" height="16" fill="url(#${id}g)" opacity=".9"/>
           <text x="95" y="110" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#1a1408" letter-spacing="1.5">MINI JUMBO</text>`,
      kitchen: `${shadow}${roll(46, 34, 46, 104)}${roll(98, 34, 46, 104)}
           <path d="M46 70 h46 M46 100 h46 M98 70 h46 M98 100 h46" stroke="#5b4a2e" stroke-opacity=".25" stroke-dasharray="2 3"/>`,
      ztowel: `${shadow}${box(`url(#${id}w)`, '#f6f1e7', '#bdb4a3',
           `<path d="M40 82 H130 M40 94 H130 M40 106 H130 M40 118 H130" stroke="#5b4a2e" stroke-opacity=".18"/>
            <path d="M136 62 l8 6 -8 6 8 6 -8 6 8 6 -8 6" fill="none" stroke="#8f6a2c" stroke-width="2"/>
            <rect x="58" y="88" width="54" height="30" rx="4" fill="url(#${id}g)"/>
            <text x="85" y="109" text-anchor="middle" font-family="Unbounded, sans-serif" font-weight="700" font-size="18" fill="#1a1408">Z</text>`)}`,
      vtowel: `${shadow}${box(`url(#${id}w)`, '#f6f1e7', '#bdb4a3',
           `<path d="M40 82 H130 M40 94 H130 M40 106 H130 M40 118 H130" stroke="#5b4a2e" stroke-opacity=".18"/>
            <path d="M136 64 l8 8 -8 8 M136 84 l8 8 -8 8" fill="none" stroke="#8f6a2c" stroke-width="2"/>
            <rect x="58" y="88" width="54" height="30" rx="4" fill="url(#${id}g)"/>
            <text x="85" y="109" text-anchor="middle" font-family="Unbounded, sans-serif" font-weight="700" font-size="18" fill="#1a1408">V</text>`)}`,
      napkin: (() => {
        const c = p.color || '#6d1a2a';
        let out = shadow;
        for (let i = 0; i < 7; i++) {
          const y = 116 - i * 7;
          out += `<path d="M95 ${y - 30} L150 ${y - 8} L95 ${y + 14} L40 ${y - 8} Z" fill="${c}" stroke="#000" stroke-opacity=".25"/>`;
        }
        out += `<path d="M95 44 L150 66 L95 88 L40 66 Z" fill="${c}"/>
                <path d="M95 44 L95 88" stroke="#fff" stroke-opacity=".25"/>
                <path d="M50 66 L95 48 L140 66 L95 84 Z" fill="none" stroke="#fff" stroke-opacity=".3" stroke-dasharray="2 3"/>`;
        return out;
      })(),
      gloves: `${shadow}${box('#e9eef5', '#f6f8fb', '#b9c3cf',
           `<path d="M66 60 c-4 -18 6 -26 10 -16 l2 -14 c1 -6 8 -6 9 0 l1 12 l3 -14 c1 -6 9 -5 9 1 l-1 16 l4 -10 c2 -5 9 -3 8 3 l-4 22 Z" fill="#5d7fd6" opacity=".95"/>
            <rect x="52" y="88" width="66" height="26" rx="4" fill="#5d7fd6"/>
            <text x="85" y="105" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#fff" letter-spacing="1.5">NITRILE</text>`)}`,
      foam: `${shadow}<rect x="88" y="26" width="16" height="16" rx="3" fill="#5b5146"/>
           <path d="M60 52 Q60 40 74 40 H118 Q132 40 132 52 V134 Q132 142 124 142 H68 Q60 142 60 134 Z" fill="url(#${id}w)"/>
           <path d="M106 40 Q126 30 128 52" fill="none" stroke="#cfc7b8" stroke-width="7" stroke-linecap="round"/>
           <rect x="68" y="72" width="56" height="48" rx="6" fill="#e8b8c8"/>
           <rect x="68" y="72" width="56" height="12" rx="4" fill="url(#${id}g)"/>
           <text x="96" y="106" text-anchor="middle" font-family="Unbounded, sans-serif" font-weight="600" font-size="14" fill="#5a2236">5L</text>`,
      bags: `${shadow}<path d="M58 100 L58 142 Q95 150 132 142 L132 100" fill="#1d1d1f" stroke="#333"/>
           <path d="M66 112 Q95 120 124 112" stroke="#444" fill="none"/>
           <rect x="40" y="56" width="110" height="48" rx="24" fill="#232325"/>
           <ellipse cx="150" cy="80" rx="12" ry="24" fill="#2e2e31"/>
           <ellipse cx="150" cy="80" rx="5" ry="10" fill="#0c0c0d"/>
           <path d="M50 66 Q95 60 140 66" stroke="#fff" stroke-opacity=".12" stroke-width="3" fill="none"/>`,
    };
    return `<svg viewBox="0 0 190 160" aria-hidden="true"><defs>${paper}${gold}</defs>${s[p.type] || s.tp}</svg>`;
  }

  /* ---------------- demo products ---------------- */
  // Names and prices taken from the current online store; demo only.
  const PRODUCTS = [
    { id: 'z2121', code: '11004', type: 'ztowel', name: 'Z кърпи за ръце 21×21 см, 2 пласта, бели плътни', meta: '20 пакета в кашон', net: 19.50, gross: 23.40, badge: 'Хит' },
    { id: 'v2421', code: '24*23', type: 'vtowel', name: 'V кърпи за ръце 24×21 см, 2 пласта, бели', meta: '20 пакета в кашон', net: 21.50, gross: 25.80 },
    { id: 'tp48', code: 'TP-48', type: 'tp', name: 'Тоалетна хартия бяла, 3 пласта', meta: '48 броя', net: 8.44, gross: 10.13, badge: 'Хит' },
    { id: 'mj12', code: 'MJ-12', type: 'jumbo', name: 'Тоалетна хартия Mini Jumbo, бяла, 3 пласта', meta: '12 броя', net: 11.70, gross: 14.04 },
    { id: 'kr6', code: 'KR-6', type: 'kitchen', name: 'Кухненска ролка бяла, 2 пласта', meta: '6 броя', net: 13.29, gross: 15.95 },
    { id: 'np40', code: 'NP-40', type: 'napkin', color: '#6d1a2a', name: 'Салфетки бордо 40×40, 2 пласта', meta: '40 броя', net: 1.50, gross: 1.80, badge: 'Ново' },
    { id: 'gl100', code: '1140', type: 'gloves', name: 'Нитрилни ръкавици без пудра', meta: '100 броя', net: 9.00, gross: 10.80, oldNet: 11.25, oldGross: 13.50, badge: '-20%' },
    { id: 'foam5', code: 'RLX-5', type: 'foam', name: 'Пяна за ръце RELAX', meta: '5 литра', net: 10.00, gross: 12.00 },
    { id: 'bag130', code: 'BAG-130', type: 'bags', name: 'Чували за смет 80×110, черни плътни', meta: '130 л · 10 броя', net: 0.82, gross: 0.98 },
  ];
  const byId = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));
  const priceOf = p => (state.vat ? p.gross : p.net);
  const eur = v => '€' + v.toFixed(2);
  const bgn = v => (v * BGN).toFixed(2) + ' лв.';

  const rail = $('#rail');
  function renderRail() {
    rail.innerHTML = PRODUCTS.map(p => {
      const old = state.vat ? p.oldGross : p.oldNet;
      const badge = p.badge ? `<span class="tag ${p.badge.startsWith('-') ? 'sale' : 'tag--gold'} product__badge">${p.badge}</span>` : '';
      return `<article class="product" data-id="${p.id}">
        <div class="product__img">${badge}${illus(p)}</div>
        <div class="product__body">
          <p class="mono product__code">код ${esc(p.code)}</p>
          <h3>${esc(p.name)}</h3>
          <p class="product__meta">${esc(p.meta)}</p>
          <div class="product__foot">
            <div class="price">${old ? `<s>${eur(old)}</s>` : ''}<b>${eur(priceOf(p))}</b><small>${bgn(priceOf(p))} · ${state.vat ? 'с ДДС' : 'без ДДС'}</small></div>
            <button type="button" class="add" data-add="${p.id}" aria-label="Добави ${esc(p.name)} в количката">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
            </button>
          </div>
        </div>
      </article>`;
    }).join('');
    bindSpotlight($$('.product', rail));
  }
  $$('[data-rail]').forEach(b => b.addEventListener('click', () => {
    const card = $('.product', rail);
    const step = card ? card.getBoundingClientRect().width + 16 : 300;
    rail.scrollBy({ left: step * 2 * +b.dataset.rail, behavior: reduce ? 'auto' : 'smooth' });
  }));

  /* ---------------- cart ---------------- */
  const cartCount = $('#cartCount');
  function saveCart() { store.set('cart', state.cart); }
  function cartQty() { return state.cart.reduce((a, i) => a + i.qty, 0); }
  function updateBadge(bump) {
    const n = cartQty();
    cartCount.textContent = n;
    cartCount.classList.toggle('has', n > 0);
    if (bump) { cartCount.classList.remove('bump'); void cartCount.offsetWidth; cartCount.classList.add('bump'); }
  }
  function addToCart(id, fromEl) {
    const row = state.cart.find(i => i.id === id);
    if (row) row.qty++; else state.cart.push({ id, qty: 1 });
    saveCart();
    const done = () => updateBadge(true);
    if (fromEl && !reduce) flyTo(fromEl, $('#cartOpen'), done); else done();
    fromEl && (fromEl.classList.remove('done'), void fromEl.offsetWidth, fromEl.classList.add('done'));
    toast('Добавено в количката: ' + byId[id].name);
  }
  function flyTo(a, b, cb) {
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const dot = document.createElement('i');
    dot.className = 'fly';
    document.body.appendChild(dot);
    const x0 = ra.left + ra.width / 2 - 7, y0 = ra.top + ra.height / 2 - 7;
    const x1 = rb.left + rb.width / 2 - 7, y1 = rb.top + rb.height / 2 - 7;
    const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 120;
    const anim = dot.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(1)` },
      { transform: `translate(${mx}px, ${my}px) scale(1.4)`, offset: .5 },
      { transform: `translate(${x1}px, ${y1}px) scale(.4)`, opacity: .6 },
    ], { duration: 750, easing: 'cubic-bezier(.4,0,.2,1)' });
    dot.style.left = dot.style.top = '0';
    anim.onfinish = () => { dot.remove(); cb(); };
  }
  function renderCart() {
    const list = $('#cartList');
    $('#cartVatLabel').textContent = state.vat ? 'с ДДС' : 'без ДДС';
    if (!state.cart.length) {
      list.innerHTML = '<li class="cart__empty">Количката е празна.<br>Добавете продукт от „Най-продавани“.</li>';
      $('#cartTotal').textContent = eur(0);
      return;
    }
    list.innerHTML = state.cart.map(({ id, qty }) => {
      const p = byId[id];
      return `<li class="cart__row">${illus(p)}<div><h4>${esc(p.name)}</h4><small>${eur(priceOf(p))} × ${qty}</small></div>
        <div class="qty"><button type="button" data-q="-1" data-id="${id}" aria-label="Намали">−</button><span>${qty}</span><button type="button" data-q="1" data-id="${id}" aria-label="Увеличи">+</button></div></li>`;
    }).join('');
    const total = state.cart.reduce((a, { id, qty }) => a + priceOf(byId[id]) * qty, 0);
    $('#cartTotal').textContent = eur(total);
  }
  $('#cartList').addEventListener('click', e => {
    const b = e.target.closest('[data-q]');
    if (!b) return;
    const row = state.cart.find(i => i.id === b.dataset.id);
    row.qty += +b.dataset.q;
    if (row.qty <= 0) state.cart = state.cart.filter(i => i !== row);
    saveCart(); updateBadge(); renderCart();
  });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-add]');
    if (b) addToCart(b.dataset.add, b);
  });

  /* ---------------- VAT toggle ---------------- */
  const vatBtns = $$('.vat__btn');
  function setVat(on) {
    state.vat = on;
    store.set('vat', on);
    vatBtns.forEach(b => { const me = (b.dataset.vat === '1') === on; b.classList.toggle('is-on', me); b.setAttribute('aria-pressed', String(me)); });
    renderRail(); renderCart();
  }
  vatBtns.forEach(b => b.addEventListener('click', () => setVat(b.dataset.vat === '1')));

  /* ---------------- open now (Sofia time) ---------------- */
  function openStatus() {
    let open = false;
    try {
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Sofia', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(new Date()).map(p => [p.type, p.value]));
      const mins = +parts.hour * 60 + +parts.minute;
      open = !['Sat', 'Sun'].includes(parts.weekday) && mins >= 510 && mins < 1050;
    } catch { /* Intl without time zones */ }
    const top = $('#openStatus'), pill = $('#openPill');
    top.classList.toggle('is-open', open);
    top.lastChild.textContent = open ? ' Отворено · до 17:30' : ' Затворено · Пон–Пет 8:30–17:30';
    pill.classList.toggle('is-open', open);
    pill.textContent = open ? 'Отворено сега' : 'Затворено в момента';
  }
  openStatus();
  setInterval(openStatus, 60000);

  /* ---------------- reveal on scroll ---------------- */
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); }
    }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    $$('[data-reveal]').forEach(el => {
      const sibs = [...el.parentElement.children].filter(c => c.hasAttribute('data-reveal'));
      el.style.setProperty('--d', (sibs.indexOf(el) % 6) * 0.07 + 's');
      if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pre'); io.observe(el); }
    });
  }

  /* ---------------- spotlight + magnetic ---------------- */
  function bindSpotlight(els) {
    if (!finePointer) return;
    els.forEach(el => el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', e.clientX - r.left + 'px');
      el.style.setProperty('--my', e.clientY - r.top + 'px');
    }));
  }
  bindSpotlight($$('.own-card, .tile'));

  if (finePointer && !reduce) {
    $$('.magnetic').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px, ${(e.clientY - r.top - r.height / 2) * .32}px)`;
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------------- counters ---------------- */
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, suf = el.dataset.suffix || '';
    if (reduce) return;
    let done = false;
    whileVisible(el, vis => {
      if (!vis || done) return;
      done = true;
      const t0 = performance.now();
      const step = t => {
        const k = clamp((t - t0) / 1400, 0, 1), e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(end * e) + suf;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, '0px');
  });

  /* ---------------- quote form ---------------- */
  const form = $('#quoteForm'), formMsg = $('#formMsg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#f-name'), email = $('#f-email');
    let ok = true;
    [name, email].forEach(f => f.parentElement.classList.remove('is-bad'));
    if (!name.value.trim()) { name.parentElement.classList.add('is-bad'); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { email.parentElement.classList.add('is-bad'); ok = false; }
    if (!ok) {
      formMsg.className = 'form__msg bad';
      formMsg.textContent = 'Попълнете име и валиден имейл, за да ви отговорим.';
      return;
    }
    const interests = $$('input[name="interest"]:checked').map(i => i.value).join(', ') || '—';
    const body = [
      'Име: ' + name.value.trim(),
      'Фирма: ' + ($('#f-company').value.trim() || '—'),
      'Телефон: ' + ($('#f-phone').value.trim() || '—'),
      'Имейл: ' + email.value.trim(),
      'Интерес: ' + interests,
      '', $('#f-msg').value.trim(),
    ].join('\n');
    formMsg.className = 'form__msg ok';
    formMsg.textContent = 'Отваряме имейл до office@paper-professional.com с попълнените данни. Ако не се отвори, пишете ни директно на този адрес.';
    location.href = 'mailto:office@paper-professional.com?subject=' + encodeURIComponent('Запитване за оферта') + '&body=' + encodeURIComponent(body);
  });

  /* ======================================================
     HERO — golden dust
     ====================================================== */
  (function dust() {
    const cv = $('#dust');
    if (!cv || reduce) return;
    const ctx = cv.getContext('2d');
    let w = 0, h = 0, dpr = 1, parts = [], mx = .5, my = .5;
    function size() {
      dpr = Math.min(2, devicePixelRatio || 1);
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(clamp(w * h / 16000, 30, 90));
      parts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h, z: Math.random(),
        r: .4 + Math.random() * 1.6, vy: .05 + Math.random() * .22, ph: Math.random() * 6.28,
      }));
    }
    size();
    addEventListener('resize', size);
    addEventListener('pointermove', e => { mx = e.clientX / innerWidth; my = e.clientY / innerHeight; }, { passive: true });
    const lp = loop((dt, t) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of parts) {
        p.y -= p.vy * dt * .06 * (0.5 + p.z);
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        const ox = (mx - .5) * 30 * p.z, oy = (my - .5) * 20 * p.z;
        const a = .25 + .55 * (0.5 + 0.5 * Math.sin(t * .002 + p.ph));
        ctx.beginPath();
        ctx.arc(p.x + ox + Math.sin(t * .0006 + p.ph) * 8, p.y + oy, p.r * (0.6 + p.z), 0, 6.283);
        ctx.fillStyle = p.z > .7 ? `rgba(246,221,158,${a})` : `rgba(214,174,92,${a * .7})`;
        ctx.fill();
      }
    });
    whileVisible(cv, v => (v ? lp.start() : lp.stop()));
  })();

  /* ======================================================
     HERO — toilet roll you can pull and tear
     ====================================================== */
  (function heroRoll() {
    const svg = $('#rollSvg');
    if (!svg) return;
    const paper = $('#sheetPaper'), emb = $('#sheetEmboss'), perfG = $('#perfs'), sheet = $('#sheet');
    const patBody = $('#embossBody'), patSheet = $('#embossSheet'), caps = $$('#capRings ellipse');
    const hint = $('#pullHint'), counter = $('#sheetCount');
    const NS = 'http://www.w3.org/2000/svg';
    const TOP = 300, X0 = 134, X1 = 386, PERF = 92, BASE = 230, MAXL = 410;

    let L = BASE, U = 0, drag = 0, scrollExtra = 0, torn = 0, t0 = 0;
    let dragging = false, startY = 0, moved = 0, auto = false;

    const perfLines = Array.from({ length: 6 }, () => {
      const l = document.createElementNS(NS, 'line');
      l.setAttribute('x1', X0); l.setAttribute('x2', X1);
      perfG.appendChild(l);
      return l;
    });
    sheet.setAttribute('tabindex', '0');
    sheet.setAttribute('role', 'button');
    sheet.setAttribute('aria-label', 'Откъсни лист');

    function shape(len, top = TOP) {
      const y = top + len, n = 18, step = (X1 - X0) / n;
      let d = `M${X0} ${top} H${X1} V${y}`;
      for (let i = 1; i <= n; i++) d += ` L${(X1 - step * i).toFixed(1)} ${(y + (i % 2 ? 3.5 : 0)).toFixed(1)}`;
      return d + ' Z';
    }
    function perfDists() {
      const off = ((U % PERF) + PERF) % PERF, out = [];
      for (let d = off; d < L - 8; d += PERF) if (d > 14) out.push(d);
      return out;
    }
    function render(t) {
      const d = shape(L);
      paper.setAttribute('d', d);
      emb.setAttribute('d', d);
      const ds = perfDists();
      perfLines.forEach((l, i) => {
        if (i < ds.length) { l.setAttribute('y1', TOP + ds[i]); l.setAttribute('y2', TOP + ds[i]); l.style.display = ''; }
        else l.style.display = 'none';
      });
      patSheet.setAttribute('patternTransform', `translate(0 ${(U % 18).toFixed(2)})`);
      patBody.setAttribute('patternTransform', `translate(0 ${(U % 18).toFixed(2)})`);
      caps.forEach((c, i) => { c.style.strokeDashoffset = (-U * (0.35 + i * 0.12)).toFixed(1); });
      const bob = reduce ? 0 : Math.sin((t || 0) / 380) * 3;
      hint.setAttribute('transform', `translate(0 ${(TOP + L + 16 + bob).toFixed(1)})`);
      sheet.style.transform = reduce || dragging ? '' : `skewX(${(Math.sin((t || 0) / 900) * 0.6).toFixed(3)}deg)`;
    }
    sheet.style.transformBox = 'fill-box';
    sheet.style.transformOrigin = '50% 0%';

    function setL(v, moving = true) {
      v = clamp(v, 60, MAXL);
      if (moving) U += v - L;
      L = v;
    }
    function unitsPerPx() {
      const r = svg.getBoundingClientRect();
      return 1 / Math.min(r.width / 520, r.height / 720);
    }

    function tear() {
      const cands = perfDists().filter(d => d >= 70 && d <= L - 40);
      const cut = cands.length ? cands[cands.length - 1] : Math.max(70, L - PERF);
      const pieceLen = L - cut;
      // falling piece, same paper + emboss, perforated top edge
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'torn-piece');
      const top = TOP + cut;
      const n = 18, step = (X1 - X0) / n;
      let d = `M${X0} ${top}`;
      for (let i = 1; i <= n; i++) d += ` L${(X0 + step * i).toFixed(1)} ${(top + (i % 2 ? 2.5 : 0)).toFixed(1)}`;
      d += ` V${top + pieceLen}`;
      for (let i = 1; i <= n; i++) d += ` L${(X1 - step * i).toFixed(1)} ${(top + pieceLen + (i % 2 ? 3.5 : 0)).toFixed(1)}`;
      d += ' Z';
      g.innerHTML = `<path d="${d}" fill="url(#gSheet)"/><path d="${d}" fill="url(#embossSheet)"/>`;
      svg.insertBefore(g, $('#pullHint'));
      g.style.transformBox = 'fill-box';
      g.style.transformOrigin = '50% 0%';
      const dir = Math.random() > .5 ? 1 : -1;
      const a = g.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: `translate(${dir * 30}px, 120px) rotate(${dir * 8}deg)`, opacity: 1, offset: .35 },
        { transform: `translate(${dir * 90}px, 520px) rotate(${dir * 26}deg)`, opacity: 0 },
      ], { duration: reduce ? 1 : 1300, easing: 'cubic-bezier(.45,0,.8,.55)' });
      a.onfinish = () => g.remove();
      setL(cut, false);
      drag = 0;
      torn += Math.max(1, Math.round(pieceLen / PERF));
      counter.textContent = 'листа: ' + torn;
      hint.classList.add('is-hidden');
      clearTimeout(t0);
      t0 = setTimeout(() => hint.classList.remove('is-hidden'), 5000);
    }

    async function autoPull() {
      if (auto) return;
      auto = true;
      const from = drag, to = from + 130, t1 = performance.now();
      await new Promise(res => {
        const step = t => {
          const k = clamp((t - t1) / 520, 0, 1);
          drag = from + (to - from) * (1 - Math.pow(1 - k, 3));
          if (k < 1) requestAnimationFrame(step); else res();
        };
        requestAnimationFrame(step);
      });
      await wait(120);
      tear();
      auto = false;
    }

    sheet.addEventListener('pointerdown', e => {
      dragging = true; moved = 0; startY = e.clientY;
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
      if (moved < 6) autoPull();
      else if (drag > 36) tear();
    };
    sheet.addEventListener('pointerup', up);
    sheet.addEventListener('pointercancel', up);
    sheet.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); autoPull(); } });

    const hero = $('.hero');
    addEventListener('scroll', () => {
      scrollExtra = clamp(scrollY / Math.max(1, hero.offsetHeight) * 160, 0, 160);
    }, { passive: true });

    const lp = loop((dt, t) => {
      const target = BASE + scrollExtra + drag;
      const k = dragging ? .45 : .09;
      if (Math.abs(target - L) > .05) setL(L + (target - L) * k);
      if (!dragging && !auto && drag > 0) drag *= .9; // a short tug springs back
      render(t);
    });
    render(0);
    if (!reduce) whileVisible(svg, v => (v ? lp.start() : lp.stop()));
    else { svg.addEventListener('pointerup', () => requestAnimationFrame(() => render(0))); }
  })();

  /* ======================================================
     PROCESS — scroll-driven converting line
     ====================================================== */
  (function processLine() {
    const sec = $('#process'), svg = $('#line');
    if (!sec || !svg) return;
    const NS = 'http://www.w3.org/2000/svg';
    const outer = $('#jumboOuter'), ringsG = $('#jumboRings'), spin = $('#jumboSpin'), mark = $('#jumboMark');
    const web = $('#web'), flow = $('#webFlow'), zig = $('#zig'), beltFlow = $('#beltFlow'), itemsG = $('#items');
    const steps = $$('#steps li'), bar = $('#processBar');
    const parts = $$('#line [data-stage]');
    const rollers = $$('#line .roller').map(g => ({
      g, r: +g.dataset.roller, base: g.getAttribute('transform'),
      spokes: $('.roller__spokes', g), knurl: $('.knurl', g),
    }));
    const CX = 190, CY = 270, RMAX = 170, RMIN = 64;

    const rings = [];
    for (let r = 44; r <= RMAX - 4; r += 9) {
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', CX); c.setAttribute('cy', CY); c.setAttribute('r', r);
      ringsG.appendChild(c); rings.push({ c, r });
    }

    // conveyor items: rolls, towel stacks, napkin packs
    const kinds = [
      `<rect x="-11" y="-22" width="22" height="22" fill="#f3eee4"/><ellipse cx="0" cy="-22" rx="11" ry="4" fill="#fffdf8" stroke="#cfc7b8"/><ellipse cx="0" cy="-22" rx="3.5" ry="1.4" fill="#1c160f"/>`,
      `<rect x="-14" y="-18" width="28" height="18" rx="2" fill="#f3eee4"/><path d="M-14 -12 H14 M-14 -6 H14" stroke="#9a8f7c" stroke-width="1"/><rect x="-6" y="-14" width="12" height="7" rx="1.5" fill="#d6ae5c"/>`,
      `<path d="M0 -20 L16 -12 L0 -4 L-16 -12 Z" fill="#c8102e"/><path d="M-16 -12 V-6 L0 2 V-4 Z" fill="#8e0b20"/><path d="M16 -12 V-6 L0 2 V-4 Z" fill="#a50d26"/>`,
    ];
    const items = [];
    let spawnAcc = 0, kindIdx = 0;
    function spawn() {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'item');
      g.innerHTML = kinds[kindIdx++ % kinds.length];
      itemsG.appendChild(g);
      items.push({ g, s: 0 });
    }

    let p = 0, offset = 0, lastScroll = scrollY, boost = 0, active = -1;
    function measure() {
      const r = sec.getBoundingClientRect();
      const total = sec.offsetHeight - innerHeight;
      p = clamp(-r.top / Math.max(1, total), 0, 1);
      const v = Math.abs(scrollY - lastScroll);
      lastScroll = scrollY;
      boost = Math.min(5, boost + v * .02);
    }
    function setActive(i) {
      if (i === active) return;
      active = i;
      steps.forEach((li, k) => { li.classList.toggle('is-active', k === i); li.classList.toggle('is-done', k < i); });
      parts.forEach(el => { const s = +el.dataset.stage; el.classList.toggle('is-on', s === i); el.classList.toggle('is-past', s < i); });
    }
    function draw(dt) {
      const r = RMAX - (RMAX - RMIN) * p;
      outer.setAttribute('r', r.toFixed(1));
      rings.forEach(o => { o.c.style.display = o.r < r - 3 ? '' : 'none'; });
      mark.setAttribute('d', `M${CX} ${CY - 36} V${(CY - r + 8).toFixed(1)}`);
      const y0 = CY + r;
      const d = `M${CX} ${y0.toFixed(1)} C${CX + 120} ${y0.toFixed(1)} 330 414 400 400 L800 400`;
      web.setAttribute('d', d);
      flow.setAttribute('d', d);
      const speed = (reduce ? 0 : 70) * (1 + boost); // paper units per second
      const ds = speed * dt / 1000;
      offset += ds;
      boost *= .94;
      flow.style.strokeDashoffset = (-offset).toFixed(1);
      spin.setAttribute('transform', `rotate(${(offset / r * 57.2958).toFixed(2)} ${CX} ${CY})`);
      rollers.forEach(o => {
        const a = (offset / o.r * 57.2958) % 360;
        if (o.spokes) o.spokes.setAttribute('transform', `rotate(${a.toFixed(1)})`);
        if (o.knurl) o.knurl.style.strokeDashoffset = (-offset).toFixed(1);
      });
      zig.style.strokeDashoffset = (160 - (offset * 1.4) % 320 > 0 ? 160 - (offset * 1.4) % 320 : 0).toFixed(1);
      beltFlow.style.strokeDashoffset = (-offset * .6).toFixed(1);

      spawnAcc += ds;
      if (spawnAcc > 70 && !reduce) { spawnAcc = 0; spawn(); }
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.s += ds;
        let x, y;
        if (it.s < 26) { x = 800; y = 440 + it.s * .85; } else { x = 800 + (it.s - 26) * .9; y = 470; }
        it.g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
        it.g.style.opacity = x > 905 ? clamp(1 - (x - 905) / 30, 0, 1) : clamp(it.s / 10, 0, 1);
        if (x > 940) { it.g.remove(); items.splice(i, 1); }
      }

      bar.style.width = (p * 100).toFixed(1) + '%';
      setActive(Math.min(4, Math.floor(p * 5)));
    }

    // prefill the conveyor so it never starts empty
    for (let i = 0; i < 4; i++) { spawn(); items[items.length - 1].s = 26 + i * 52; }

    addEventListener('scroll', measure, { passive: true });
    addEventListener('resize', measure);
    measure();
    draw(0);
    const lp = loop(dt => draw(dt));
    if (!reduce) whileVisible(sec, v => (v ? lp.start() : lp.stop()), '0px');
    else addEventListener('scroll', () => draw(0), { passive: true });
  })();

  /* ======================================================
     PULL DEMO — dispenser + interfold diagram
     ====================================================== */
  (function dispenser() {
    const disp = $('#disp');
    if (!disp) return;
    const towel = $('#towel'), stack = $('#dispStack'), led = $('#dispLed'), btn = $('#pullBtn');
    const count = $('#pulledCount'), toggle = $('.fold-toggle'), toggleBtns = $$('.fold-toggle__btn');
    const fText = $('#foldText'), fSize = $('#foldSize'), fPanels = $('#foldPanels');
    const diagG = $('#diagSheets');
    const NS = 'http://www.w3.org/2000/svg';
    const CAP = 12, TAB = -64;
    let left = CAP, pulled = 0, busy = false, fold = 'v';

    const COPY = {
      v: { text: 'Всяка кърпа е сгъната на две и захваща следващата. Компактна и икономична, за повечето стандартни дозатори.', size: '21×21 · 24×21 см', panels: '2' },
      z: { text: 'Три панела с по-голяма площ за подсушаване. Подават се плавно една след друга, дори когато дозаторът е пълен.', size: '21×21 см', panels: '3' },
    };

    for (let i = 0; i < CAP; i++) stack.appendChild(document.createElement('i'));
    const bars = [...stack.children];

    function setY(y, dur = 0, ease = 'cubic-bezier(.2,.7,.1,1)') {
      towel.style.transition = dur ? `transform ${dur}ms ${ease}, opacity 400ms` : 'none';
      towel.style.transform = `translateY(${y}px)`;
    }
    function syncStack() {
      bars.forEach((b, i) => b.classList.toggle('gone', i >= left));
      led.classList.toggle('is-low', left <= 2);
      count.textContent = pulled;
      btn.querySelector('span').textContent = left > 0 ? 'Изтегли кърпа' : 'Зареди дозатора';
    }
    async function refill() {
      left = CAP; syncStack();
      setY(-140); towel.style.opacity = '1';
      void towel.offsetWidth;
      setY(TAB, 600, 'cubic-bezier(.34,1.56,.64,1)');
      toast('Дозаторът е зареден с нов пакет.');
    }
    async function pull() {
      if (busy) return;
      if (left <= 0) { refill(); return; }
      busy = true;
      towel.classList.add('is-open');
      setY(0, 420);
      diagramPull();
      await wait(reduce ? 0 : 640);
      towel.style.transition = 'transform 720ms cubic-bezier(.5,0,.75,0), opacity 620ms';
      towel.style.transform = `translateY(440px) rotate(${Math.random() > .5 ? 7 : -7}deg)`;
      towel.style.opacity = '0';
      await wait(reduce ? 0 : 660);
      left--; pulled++;
      syncStack();
      towel.classList.remove('is-open');
      setY(-140);
      void towel.offsetWidth;
      towel.style.opacity = '1';
      if (left > 0) setY(TAB, 560, 'cubic-bezier(.34,1.56,.64,1)');
      await wait(reduce ? 0 : 480);
      busy = false;
    }

    // drag the tab down to pull
    let dragging = false, sy = 0, dy = 0;
    towel.addEventListener('pointerdown', e => {
      if (busy || left <= 0) return;
      dragging = true; sy = e.clientY; dy = 0;
      towel.setPointerCapture?.(e.pointerId);
    });
    towel.addEventListener('pointermove', e => {
      if (!dragging) return;
      dy = clamp(e.clientY - sy, 0, 140);
      setY(TAB + dy);
      if (dy > 56) { dragging = false; pull(); }
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      if (dy < 6) pull(); else setY(TAB, 380, 'cubic-bezier(.34,1.56,.64,1)');
    };
    towel.addEventListener('pointerup', end);
    towel.addEventListener('pointercancel', end);
    towel.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pull(); } });
    btn.addEventListener('click', pull);

    toggleBtns.forEach(b => b.addEventListener('click', () => {
      fold = b.dataset.fold;
      disp.dataset.fold = fold;
      toggle.dataset.fold = fold;
      toggleBtns.forEach(x => { const on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', String(on)); });
      fText.textContent = COPY[fold].text;
      fSize.textContent = COPY[fold].size;
      fPanels.textContent = COPY[fold].panels;
      diagC = 0;
      drawDiagram(0);
    }));

    /* Cross-section of an interfolded stack.
       V: sheet k has panels on layers 2k-1 and 2k+2 (one fold, alternating sides).
       Z: sheet k has panels on layers 3k-2, 3k, 3k+2 (fold right, then left).
       The lowest panel of the current sheet hangs out of the slot. */
    const G = { x0: 58, x1: 262, yb: 202, s: 13, slot: 160 };
    const layers = (k, f) => (f === 'v' ? [2 * k - 1, 2 * k + 2] : [3 * k - 2, 3 * k, 3 * k + 2]);
    const base = (c, f) => (f === 'v' ? 2 * c + 1 : 3 * c);
    let diagC = 0;

    function sheetD(k, c, f, isTab) {
      const L = layers(k, f), b = base(c, f);
      const y = n => G.yb - (n - b) * G.s;
      const sides = f === 'v'
        ? (k % 2 === 0 ? [G.x1] : [G.x0])
        : [G.x1, G.x0];
      let d = '';
      for (let i = 0; i < L.length; i++) {
        const yy = y(L[i]);
        const foldX = sides[i] ?? null;              // fold after this panel
        const prevFold = i > 0 ? sides[i - 1] : null; // fold before this panel
        const startX = prevFold ?? (f === 'v' ? (sides[0] === G.x1 ? G.x0 : G.x1) : G.x0);
        const endX = foldX ?? (startX === G.x0 ? G.x1 : G.x0);
        if (i === 0) {
          if (isTab) {
            const ty = G.yb + 7, dir = endX > G.slot ? 1 : -1;
            d += `M${G.slot} ${G.yb + 46} L${G.slot} ${ty + 7} Q${G.slot} ${ty} ${G.slot + dir * 14} ${ty} L${endX} ${ty}`;
          } else {
            d += `M${startX} ${yy.toFixed(1)} L${endX} ${yy.toFixed(1)}`;
          }
        } else {
          d += ` L${endX} ${yy.toFixed(1)}`;
        }
        if (i < L.length - 1) {
          const y0 = i === 0 && isTab ? G.yb + 7 : yy, y1 = y(L[i + 1]);
          const r = Math.max(1, (y0 - y1) / 2);
          const sweep = foldX === G.x1 ? 0 : 1;
          d += ` A${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${sweep} ${foldX} ${y1.toFixed(1)}`;
        }
      }
      return d;
    }
    function drawDiagram(c) {
      const k0 = Math.floor(c), frac = c - k0;
      const n = fold === 'v' ? 9 : 7;
      let html = '';
      for (let k = k0 + n; k >= k0; k--) {
        const isCur = k === k0;
        const col = k % 2 === 0 ? '#d6ae5c' : '#f3eee4';
        const d = sheetD(k, c, fold, isCur && frac === 0);
        const tf = isCur && frac > 0 ? ` transform="translate(0 ${(frac * 70).toFixed(1)})" opacity="${(1 - frac).toFixed(2)}"` : '';
        html += `<path d="${d}" stroke="${col}"${tf}/>`;
      }
      diagG.innerHTML = html;
    }
    function diagramPull() {
      const c0 = diagC, t1 = performance.now(), dur = reduce ? 1 : 700;
      const step = t => {
        const k = clamp((t - t1) / dur, 0, 1);
        const e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        drawDiagram(c0 + e);
        if (k < 1) requestAnimationFrame(step); else { diagC = c0 + 1; drawDiagram(diagC); }
      };
      requestAnimationFrame(step);
    }

    syncStack();
    drawDiagram(0);
  })();

  /* ======================================================
     NAPKINS — colour picker, folding napkin, orbiting fan
     ====================================================== */
  (function napkins() {
    const sec = $('#napkins');
    if (!sec) return;
    const COLORS = [
      { n: 'Червено', c: '#c8102e' }, { n: 'Бордо', c: '#6d1a2a', t: '#b2394f' },
      { n: 'Шампанско', c: '#e3c98f' }, { n: 'Жълто', c: '#f2c230' },
      { n: 'Зелено', c: '#2f8f4e' }, { n: 'Синьо', c: '#1f5fbf', t: '#4f86e0' },
      { n: 'Лилаво', c: '#6b3fa0', t: '#9a6fd0' }, { n: 'Черно', c: '#1c1c1e', t: '#8c8c90' },
      { n: 'Крафт', c: '#b58a5a' }, { n: 'Бяло', c: '#f5f2ea' },
    ];
    const sw = $('#swatches'), name = $('#napkinName'), fan = $('#fan');
    sw.innerHTML = COLORS.map((o, i) =>
      `<button type="button" class="swatch" role="radio" aria-checked="${i === 0}" style="--c:${o.c}" data-i="${i}"><span class="sr">${o.n}</span></button>`).join('');
    function pick(i) {
      const o = COLORS[i];
      sec.style.setProperty('--nc', o.c);
      name.style.color = o.t || o.c;
      name.textContent = o.n + '.';
      $$('.swatch', sw).forEach((b, k) => { b.setAttribute('aria-checked', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
    }
    sw.addEventListener('click', e => { const b = e.target.closest('.swatch'); if (b) pick(+b.dataset.i); });
    sw.addEventListener('keydown', e => {
      const cur = $$('.swatch', sw).findIndex(b => b.getAttribute('aria-checked') === 'true');
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!d) return;
      e.preventDefault();
      const n = (cur + d + COLORS.length) % COLORS.length;
      pick(n); $$('.swatch', sw)[n].focus();
    });
    pick(0);

    // orbiting napkins around the folding one
    const small = matchMedia('(max-width: 720px)').matches;
    const R = small ? 160 : 235;
    fan.innerHTML = COLORS.filter(o => o.n !== 'Бяло').map((o, i, arr) => {
      const ang = i * (360 / arr.length) + 12;
      return `<i style="--c:${o.c};--r:${ang}deg;--tx:0px;--ty:${-R}px;--rr:${(i * 37) % 50 - 25}deg;--dl:${-i * 1.1}s"></i>`;
    }).join('');

    // fold stage label follows the CSS fold animation
    const topHalf = $('.fq-top'), stepEl = $('#foldStep'), mmEl = $('#foldMm');
    if (reduce || !topHalf.getAnimations) return;
    setInterval(() => {
      const a = topHalf.getAnimations()[0];
      if (!a || a.currentTime == null) return;
      const ph = (a.currentTime % 9000) / 9000;
      let s = '1/1', mm = '400 × 400 mm';
      if (ph >= .2 && ph < .38) { s = '1/2'; mm = '200 × 400 mm'; }
      else if (ph >= .38 && ph < .74) { s = '1/4'; mm = '200 × 200 mm'; }
      else if (ph >= .74 && ph < .8) { s = '1/2'; mm = '200 × 400 mm'; }
      if (stepEl.textContent !== s) { stepEl.textContent = s; mmEl.textContent = mm; }
    }, 120);
  })();

  /* ---------------- first paint ---------------- */
  renderRail();
  updateBadge();
  renderSearch('');
  if (state.vat === false) setVat(false);
})();
