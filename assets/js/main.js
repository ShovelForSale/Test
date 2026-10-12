/* Paper Converting Professional — home page */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const SHOP = 'https://paper-professional.com';
  const IMG = 'assets/img/';
  const BGN = 1.95583;

  const store = {
    get(k, d) { try { const v = localStorage.getItem('pcp.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('pcp.' + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const eur = v => '€' + v.toFixed(2);
  const bgn = v => (v * BGN).toFixed(2) + ' лв.';

  /* ======================================================
     DATA — categories, products and prices from the current shop
     ====================================================== */
  const c = (id, slug) => `${SHOP}/category/${id}/${slug}.html`;
  const CATEGORIES = [
    { name: 'Кърпи за ръце', href: c(187, 'karpi-za-ratse'), img: 'products/p5892.jpg', subs: [
      ['V кърпи – къси', c(423, 'v-karpi-za-ratse-kasi')], ['V кърпи – широки', c(425, 'v-karpi-za-ratse-shiroki')],
      ['Z кърпи', c(487, 'z-karpi-za-ratse')], ['Кърпи Kimberly-Clark', c(424, 'karpi-za-ratse-kimberly-clark')],
      ['Кърпи на ролка', c(189, 'karpi-za-ratse-na-rolka')]] },
    { name: 'Тоалетна хартия', href: c(191, 'toaletni-hartii'), img: 'products/p5914.jpg', subs: [
      ['На пачки', c(202, 'na-pachki')], ['Малки ролки', c(358, 'na-rolki-malki')], ['Мини джъмбо', c(267, 'mini-dzhambo')],
      ['Smart One', `${SHOP}/smart/one.html`], ['Пакети', c(477, 'toaletna-hartia-paketi')]] },
    { name: 'Кухненски ролки', href: c(251, 'kuhnenski-rolki'), img: 'products/p5945.jpg', subs: [
      ['Бели', c(383, 'kuhn-rolki-beli')], ['Избелени', c(334, 'kuhn-rolki-izbeleni')], ['За магазини', c(384, 'kuhn-rolki-magazini')]] },
    { name: 'Салфетки', href: c(341, 'salfetki'), img: 'categories/napkins.jpg', subs: [
      ['24×24 за бар', c(508, 'salfetki-24-24-barovi')], ['33×33', c(382, 'salfetki-33h33')], ['40×40', c(381, 'salfetki-40h40')],
      ['Цветни 33×33', c(343, 'tsvetni-salfetki-33-33')], ['С шевици', c(385, 'salfetki-s-shevitsi')],
      ['Коледни', c(356, 'koledni-salfetki')], ['Великденски', c(422, 'velikdenski-salfetki')], ['За диспенсър', c(370, 'salfetki-za-dispensar')]] },
    { name: 'Дозатори', href: c(180, 'dozatori'), img: 'products/p6312.jpg', subs: [
      ['Бели', c(181, 'beli-dozatori')], ['Черни', c(182, 'cherni-dozatori')], ['Инокс', c(185, 'inoksovi-dozatori')],
      ['Сензорни', c(264, 'senzorni-dozatori')], ['Аксесоари за WC', c(401, 'aksesoari-za-wc')], ['Индустриални', c(325, 'industrialni-dozatori')]] },
    { name: 'Сапун, пяна и дезинфектанти', href: c(199, 'sapun-pyana-500ml-1l-5l'), img: 'categories/soap.jpg', subs: [
      ['Пълнители Kimberly-Clark', c(200, 'palniteli-kimberly-clark')], ['Сапун и пяна 500 мл – 5 л', c(199, 'sapun-pyana-500ml-1l-5l')],
      ['Дезинфектанти за ръце', c(418, 'dezinfektanti-za-ratse')]] },
    { name: 'Почистващи препарати', href: c(391, 'preparati-i-pochistvashti-sredstva'), img: 'categories/cleaning.jpg', subs: [
      ['За кухня', c(410, 'za-kuhnya')], ['За под', c(405, 'za-pod')], ['За WC и баня', c(409, 'za-wc-banya')],
      ['За стъкла', c(402, 'za-stakla')], ['Дезинфектанти', c(413, 'dezinfektanti')], ['Ароматизатори', c(256, 'aromatizatori')],
      ['Перилни препарати', c(462, 'za-prane')], ['Други препарати', c(539, 'drugi-preparati')]] },
    { name: 'Лични предпазни средства', href: c(193, 'lichni-predpazni-sredstva'), img: 'products/p3590.jpg', subs: [
      ['Ръкавици', c(194, 'rakavitsi')], ['Маски за лице', c(195, 'maski-za-litse')], ['Престилки', c(328, 'prestilki')],
      ['Калцуни', c(353, 'kaltsuni')], ['Бонета', c(392, 'boneta')], ['Очила', c(196, 'ochila')], ['Тапи за уши', c(197, 'tapi-za-ushi')]] },
    { name: 'Хотелски консумативи', href: c(411, 'hotelski-konsumativi'), img: 'banners/hotel.jpg', subs: [
      ['Хотелска козметика', c(435, 'hotelska-kozmetika')], ['Санитарни консумативи', c(434, 'sanitarni-konsumativi')],
      ['Чехли', c(471, 'chehli')], ['Козметични кърпи', c(266, 'kozmetichni-karpi')], ['Мокри кърпички с лого', c(186, 'mokri-karpichki-s-logo')]] },
    { name: 'Индустриални продукти', href: c(192, 'industrialni-produkti'), img: 'categories/industrial.jpg', subs: [
      ['Индустриални ролки', c(206, 'industrialni-rolki')], ['Индустриален сапун', c(286, 'industrialen-sapun')],
      ['Кърпи Kimtech Prep', c(214, 'karpi-kimtech-prep')], ['Кърпи Kimtech Science', c(246, 'karpi-kimtech-science')],
      ['Стойки', c(307, 'stoyki')], ['Медицински ролки', c(327, 'meditsinski-rolki-charshafi')]] },
    { name: 'Чували за смет', href: c(412, 'chuvali'), img: 'categories/bags.jpg', subs: [
      ['20 – 50 л', c(414, 'chuvali-20l-35l-50l')], ['70 – 90 л', c(415, 'chuvali-70l-80l-90l')], ['130 – 300 л', c(416, 'chuvali-130l-200l-300l')]] },
    { name: 'Еднократни и за масата', href: c(497, 'ednokratni-pribori'), img: 'products/p4166.jpg', subs: [
      ['Еднократни прибори', c(497, 'ednokratni-pribori')], ['Покривки за маса', c(488, 'pokrivki-za-masa')],
      ['Хигиенни колички', c(519, 'higienni-kolichki')]] },
  ];

  const p = (id, slug) => `${SHOP}/product/${id}/${slug}.html`;
  // own: made by Paper Converting (the shop photos carry their badge)
  const PRODUCTS = [
    { id: 'z2121', group: 'paper', own: true, hit: true, img: 'p5892.jpg', name: 'Z кърпи за ръце 21×21 см, 2 пласта, бели плътни', meta: '20 пакета в кашон', net: 19.50, gross: 23.40, href: p(3330, 'z-karpi-za-ratse-21h21sm-2-pl-beli-platni-20-paketa-v-kashon-kod-11004') },
    { id: 'v2421', group: 'paper', own: true, img: 'p5901.jpg', name: 'V кърпи за ръце 24×21 см, 2 пласта, бели', meta: '20 пакета в кашон', net: 21.50, gross: 25.80, href: p(2733, 'v-karpi-za-ratse-24h21-2plasta-beli-20-paketa-v-kashon-kod-24-23') },
    { id: 'v2121', group: 'paper', own: true, img: 'p5925.jpg', name: 'V кърпи за ръце 21×21 см, 2 пласта, бели', meta: 'Кашон, код 21', net: 19.50, gross: 23.40, href: p(2536, 'karpi-za-ratse-v-sganati-21h21-2plasta-beli-kod-21') },
    { id: 'mj12', group: 'paper', own: true, img: 'p5914.jpg', name: 'Тоалетна хартия Мини джъмбо, бяла, 3 пласта', meta: '12 ролки', net: 11.70, gross: 14.04, href: p(2353, 'toaletna-hartia-mini-jumbo-byala-3-plasta-12-br') },
    { id: 'mjg12', group: 'paper', own: true, img: 'p5913.jpg', name: 'Тоалетна хартия Мини джъмбо, гладка, 3 пласта', meta: '12 ролки', net: 13.29, gross: 15.95, href: p(3160, 'toaletna-hartia-mini-dzhambo-gladka-3-plasta-12-broya') },
    { id: 'tp4021', group: 'paper', own: true, img: 'p5921.jpg', name: 'Тоалетна хартия на пачки, бяла, 2 пласта', meta: '40 пачки в кашон', net: 26.60, gross: 31.92, href: p(2392, '4021-toaletna-hartia-na-pachki-byala-2-plasta-40-pachki-kashon') },
    { id: 'kr6', group: 'paper', own: true, img: 'p5945.jpg', name: 'Кухненска ролка бяла, 2 пласта', meta: '6 ролки', net: 13.29, gross: 15.95, href: p(2957, 'kuhnenska-rolka-byala-2plasta-6-broya') },
    { id: 'tp48', group: 'paper', hit: true, img: 'p3835.jpg', name: 'Тоалетна хартия бяла, 3 пласта', meta: '48 ролки', net: 8.44, gross: 10.13, href: p(3158, 'toaletna-hartia-byala-3-plasta-48-broya') },
    { id: 'dispViali', group: 'hygiene', img: 'p6196.jpg', name: 'Дозатор за кърпи за ръце Виали, за Z и V кърпи 21×21', meta: '1 брой', net: 11.00, gross: 13.20, href: p(4788, 'dozator-za-karpi-za-ratse-viali-za-z-i-v-karpi-21h21') },
    { id: 'kc6945', group: 'hygiene', img: 'p6312.jpg', name: 'Дозатор за кърпи за ръце Kimberly-Clark, тесен', meta: 'Код 6945', net: 30.65, gross: 36.78, href: p(575, '6945-dozator-za-karpi-za-ratse-kimberly-clark-tesen') },
    { id: 'scott6340', group: 'hygiene', hit: true, img: 'p6309.jpg', name: 'SCOTT Essential розова пяна за ръце', meta: '2500 дози, код 6340', net: 10.25, gross: 12.30, href: p(625, '6340-scott-essential-rozova-pyana-za-ratse-2500-dozi') },
    { id: 'kleenex6331', group: 'hygiene', img: 'p6313.jpg', name: 'Kleenex розов течен сапун с глицерин', meta: '1000 дози, код 6331', net: 9.70, gross: 11.64, href: p(580, '6331-rozov-techen-sapun-kleenex-s-glitserin-1000-dozi') },
    { id: 'foam5', group: 'hygiene', img: 'p4001.jpg', name: 'Пяна за ръце RELAX', meta: '5 литра', net: 10.00, gross: 12.00, href: p(2791, 'pyana-za-ratse-relax-5l') },
    { id: 'gloves', group: 'hygiene', img: 'p3590.jpg', name: 'Нитрилни ръкавици без пудра', meta: '100 броя, код 1140', net: 9.00, gross: 10.80, href: p(2998, 'nitrilni-rakavitsi-bez-pudra-100-br-kod-1140') },
    { id: 'kleenexRoll', group: 'hygiene', img: 'p1872.jpg', name: 'Kleenex кърпи за ръце на ролка', meta: 'Ultra Slim, 2 пласта, 100 м', net: 12.50, gross: 15.00, href: p(587, '6781-kleenex-ultra-slim-2-pl-100-m') },
    { id: 'bags130', group: 'hygiene', img: 'p3159.jpg', name: 'Чували за смет 80×110 см, черни плътни', meta: '130 л, 10 броя', net: 0.82, gross: 0.98, href: p(2585, 'chuvali-za-smet-80h110-cherni-platni-130l-10-br') },
  ];
  const BEST = ['z2121', 'v2421', 'mj12', 'kr6', 'tp48', 'dispViali', 'scott6340', 'gloves'];

  const NAPKINS = [
    { id: 'np-red', color: 'Червено', c: '#c8102e', img: 'p5580.jpg', name: 'Червени салфетки Santia Лукс, 2 пласта, 33×33 см', meta: '40 броя', net: 1.00, gross: 1.20, href: p(2313, 'cherveni-salfetki-2-plasta-33h33-40-br') },
    { id: 'np-bordo', color: 'Бордо', c: '#6d1a2a', img: 'p6089.jpg', name: 'Салфетки бордо, 2 пласта, 40×40 см', meta: '40 броя', net: 1.50, gross: 1.80, href: p(4533, 'salfetki-bordo-40-40-2-pl-40-br') },
    { id: 'np-champ', color: 'Шампанско', c: '#e3cf9e', light: true, img: 'p5575.jpg', name: 'Салфетки шампанско Santia Лукс, 2 пласта, 33×33 см', meta: '40 броя', net: 1.00, gross: 1.20, href: p(2426, 'salfetki-shampansko-luks-2pl-33h33-40-br') },
    { id: 'np-yellow', color: 'Жълто', c: '#f2c230', light: true, img: 'p5577.jpg', name: 'Жълти салфетки Santia Лукс, 2 пласта, 33×33 см', meta: '40 броя', net: 1.00, gross: 1.20, href: p(2403, 'zhalti-salfetki-luks-2pl-33h33-40-br') },
    { id: 'np-green', color: 'Светлозелено', c: '#9cc83c', light: true, img: 'p6637.jpg', name: 'Светлозелени салфетки Santia Lovely Home, 2 пласта, 33×24 см, 1/8', meta: '100 броя', net: 2.00, gross: 2.40, href: p(4688, 'svetlo-zeleni-salfetki-33-24-sm-1-8-2-pl-100-br') },
    { id: 'np-blue', color: 'Синьо', c: '#1f4fa8', img: 'p5579.jpg', name: 'Сини салфетки Santia Лукс, 2 пласта, 33×33 см', meta: '40 броя', net: 1.00, gross: 1.20, href: p(2322, 'sini-salfetki-luks-2-pl-33h33-40-br') },
    { id: 'np-rose', color: 'Пепел от рози', c: '#c99aa6', light: true, img: 'p6632.jpg', name: 'Салфетки пепел от рози Santia Lovely Home, 2 пласта, 33×24 см, 1/8', meta: '100 броя', net: 2.00, gross: 2.40, href: p(4693, 'salfetki-pepel-ot-rozi-33-24-sm-1-8-2-pl-100-br') },
    { id: 'np-black', color: 'Черно', c: '#1d1d1f', img: 'p5578.jpg', name: 'Черни салфетки Santia Лукс, 2 пласта, 33×33 см, 1/4', meta: '40 броя', net: 1.20, gross: 1.44, href: p(2348, 'cherni-salfetki-luks-33h33-1-4-2-pl-40-br') },
    { id: 'np-white', color: 'Бяло', c: '#f7f5f0', light: true, img: 'p5712.jpg', name: 'Бели луксозни салфетки, 2 пласта, 40×40 см, 1/8', meta: 'Пакет', net: 5.11, gross: 6.13, href: p(2465, 'beli-luksozni-salfetki-40-40-1-8-2-plasta') },
  ];

  const ITEMS = Object.fromEntries([...PRODUCTS, ...NAPKINS].map(x => [x.id, x]));

  /* ---------------- small UI helpers ---------------- */
  const toastEl = $('#toast');
  let toastT;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('is-on'), 2800);
  }

  function whileVisible(el, cb, margin = '0px') {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(([e]) => cb(e.isIntersecting), { rootMargin: margin }).observe(el);
  }

  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const header = $('#header');
  const onScroll = () => header.classList.toggle('is-stuck', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- overlays ---------------- */
  const drawer = $('#drawer'), cart = $('#cart'), burger = $('#burger');
  function setOverlay(el, open) {
    el.classList.toggle('is-open', open);
    el.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('is-locked', !!$('.drawer.is-open, .cart.is-open'));
    if (el === drawer) burger.setAttribute('aria-expanded', String(open));
  }
  burger.addEventListener('click', () => setOverlay(drawer, true));
  [drawer, cart].forEach(el => el.addEventListener('click', e => {
    if (e.target === el || e.target.closest('[data-close]')) setOverlay(el, false);
  }));
  $('#cartOpen').addEventListener('click', () => { renderCart(); setOverlay(cart, true); });

  /* ---------------- mega menu ---------------- */
  const mega = $('#mega'), megaBtn = $('#allCatsBtn'), megaList = $('#megaList'), megaPanel = $('#megaPanel');
  megaList.innerHTML = CATEGORIES.map((cat, i) => `<li><button type="button" data-i="${i}">${esc(cat.name)}</button></li>`).join('');
  function showCat(i) {
    const cat = CATEGORIES[i];
    $$('button', megaList).forEach((b, k) => b.classList.toggle('is-on', k === i));
    megaPanel.innerHTML = `<div><h3><a href="${cat.href}">${esc(cat.name)}</a></h3>
      <div class="mega__subs">${cat.subs.map(([n, h]) => `<a href="${h}">${esc(n)}</a>`).join('')}</div></div>
      <a class="mega__pic" href="${cat.href}"><img src="${IMG + cat.img}" alt="">Всички: ${esc(cat.name.toLowerCase())}</a>`;
  }
  function setMega(open) {
    mega.hidden = !open;
    megaBtn.setAttribute('aria-expanded', String(open));
    if (open && !$('.is-on', megaList)) showCat(0);
  }
  megaBtn.addEventListener('click', e => { e.stopPropagation(); setMega(mega.hidden); });
  megaList.addEventListener('mouseover', e => { const b = e.target.closest('button'); if (b) showCat(+b.dataset.i); });
  megaList.addEventListener('focusin', e => { const b = e.target.closest('button'); if (b) showCat(+b.dataset.i); });
  megaList.addEventListener('click', e => { const b = e.target.closest('button'); if (b) location.href = CATEGORIES[+b.dataset.i].href; });
  if (finePointer) {
    let t;
    $('#allcats').addEventListener('mouseenter', () => { clearTimeout(t); t = setTimeout(() => setMega(true), 120); });
    $('#allcats').addEventListener('mouseleave', () => { clearTimeout(t); t = setTimeout(() => setMega(false), 220); });
  }
  document.addEventListener('click', e => { if (!e.target.closest('#allcats')) setMega(false); });
  $('#allCatsLink').addEventListener('click', () => {
    if (innerWidth <= 760) { setOverlay(drawer, true); return; }
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    setTimeout(() => { setMega(true); megaBtn.focus(); }, reduce ? 0 : 450);
  });

  /* mobile drawer mirrors the same categories */
  $('#drawerNav').innerHTML = CATEGORIES.map(cat => `<details><summary>${esc(cat.name)}</summary>
      <a href="${cat.href}">Всички продукти</a>${cat.subs.map(([n, h]) => `<a href="${h}">${esc(n)}</a>`).join('')}</details>`).join('')
    + `<a href="${SHOP}/new_products.html">Ново</a><a class="is-sale" href="${SHOP}/all_promotions.html">Промоции</a><a href="#contact" data-close>Контакти</a>`;

  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    setMega(false); closeSearch();
    [drawer, cart].forEach(el => el.classList.contains('is-open') && setOverlay(el, false));
  });

  /* ---------------- search ---------------- */
  const q = $('#q'), drop = $('#searchDrop');
  const INDEX = [
    ...CATEGORIES.flatMap(cat => [{ kind: 'cat', name: cat.name, href: cat.href },
      ...cat.subs.map(([n, h]) => ({ kind: 'cat', name: `${cat.name}: ${n}`, href: h }))]),
    ...[...PRODUCTS, ...NAPKINS].map(x => ({ kind: 'prod', name: x.name, href: x.href, img: x.img, price: x.gross })),
  ];
  let hits = [], active = -1;
  const norm = s => s.toLowerCase().replace(/[×x]/g, 'х').replace(/\s+/g, ' ');
  function mark(text, term) {
    const i = norm(text).indexOf(norm(term));
    if (!term || i < 0) return esc(text);
    return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + term.length)) + '</mark>' + esc(text.slice(i + term.length));
  }
  function renderSearch() {
    const term = q.value.trim();
    if (term.length < 2) { closeSearch(); return; }
    const words = norm(term).split(' ').filter(Boolean);
    const match = x => words.every(w => norm(x.name).includes(w));
    const cats = INDEX.filter(x => x.kind === 'cat' && match(x)).slice(0, 5);
    const prods = INDEX.filter(x => x.kind === 'prod' && match(x)).slice(0, 6);
    hits = [...cats, ...prods];
    active = -1;
    if (!hits.length) {
      drop.innerHTML = `<p class="search__empty">Няма резултати за „${esc(term)}“. Обадете се на <a href="tel:+359882027070"><b>0882 027 070</b></a> и ще ви помогнем.</p>`;
    } else {
      drop.innerHTML =
        (cats.length ? `<p class="search__group">Категории</p>` + cats.map((x, i) => `<a class="search__item" data-k="${i}" href="${x.href}">${mark(x.name, term)}</a>`).join('') : '') +
        (prods.length ? `<p class="search__group">Продукти</p>` + prods.map((x, i) => `<a class="search__item" data-k="${cats.length + i}" href="${x.href}"><img src="${IMG}products/${x.img}" alt="">${mark(x.name, term)}<small>${eur(x.price)}</small></a>`).join('') : '');
    }
    drop.hidden = false;
    q.setAttribute('aria-expanded', 'true');
  }
  function closeSearch() { drop.hidden = true; q.setAttribute('aria-expanded', 'false'); }
  function setActive(i) {
    active = i;
    $$('.search__item', drop).forEach(a => a.classList.toggle('is-active', +a.dataset.k === i));
  }
  q.addEventListener('input', renderSearch);
  q.addEventListener('focus', () => { if (q.value.trim().length >= 2) renderSearch(); });
  q.addEventListener('keydown', e => {
    if (drop.hidden || !hits.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((active + 1) % hits.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((active - 1 + hits.length) % hits.length); }
  });
  $('#searchForm').addEventListener('submit', e => {
    e.preventDefault();
    const target = hits[active] || hits[0];
    if (target) location.href = target.href;
    else renderSearch();
  });
  document.addEventListener('click', e => { if (!e.target.closest('#searchForm')) closeSearch(); });

  /* ---------------- products ---------------- */
  const grid = $('#productGrid');
  const cartIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"/><circle cx="10" cy="20.5" r="1.3"/><circle cx="17" cy="20.5" r="1.3"/></svg>';
  function renderProducts(filter) {
    const list = filter === 'all' ? BEST.map(id => ITEMS[id]) : PRODUCTS.filter(x => x.group === filter).slice(0, 8);
    grid.innerHTML = list.map((x, i) => `
      <article class="product" style="--d:${i * 0.04}s">
        <a class="product__img" href="${x.href}"><img src="${IMG}products/${x.img}" alt="" loading="lazy"></a>
        <div class="product__body">
          <div class="product__badges">${x.own ? '<span class="pbadge">Собствено производство</span>' : ''}${x.hit ? '<span class="pbadge pbadge--hit">Хит</span>' : ''}</div>
          <a class="product__name" href="${x.href}">${esc(x.name)}</a>
          <span class="price__meta">${esc(x.meta)}</span>
          <div class="price"><b>${eur(x.gross)}</b><span>с ДДС · ${eur(x.net)} без ДДС · ${bgn(x.gross)}</span></div>
          <button type="button" class="add" data-add="${x.id}">${cartIcon}Добави</button>
        </div>
      </article>`).join('');
  }
  $$('#prodTabs .tab').forEach(t => t.addEventListener('click', () => {
    $$('#prodTabs .tab').forEach(x => { const on = x === t; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', String(on)); });
    renderProducts(t.dataset.filter);
  }));
  renderProducts('all');

  /* ---------------- cart ---------------- */
  let cartItems = store.get('cart', []).filter(r => ITEMS[r.id]);
  const save = () => store.set('cart', cartItems);
  const totals = () => cartItems.reduce((a, r) => ({ net: a.net + ITEMS[r.id].net * r.qty, gross: a.gross + ITEMS[r.id].gross * r.qty, qty: a.qty + r.qty }), { net: 0, gross: 0, qty: 0 });
  function updateHeader(bump) {
    const t = totals(), badge = $('#cartCount');
    badge.textContent = t.qty;
    badge.classList.toggle('has', t.qty > 0);
    $('#cartSum').textContent = eur(t.gross);
    if (bump) { badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump'); }
  }
  function renderCart() {
    const list = $('#cartList'), t = totals();
    list.innerHTML = cartItems.length ? cartItems.map(r => {
      const x = ITEMS[r.id];
      return `<li class="cart__item"><img src="${IMG}products/${x.img}" alt="">
        <div><h4>${esc(x.name)}</h4><small>${eur(x.gross)} с ДДС × ${r.qty}</small></div>
        <div class="qty"><button type="button" data-q="-1" data-id="${r.id}" aria-label="Намали количеството">−</button><span>${r.qty}</span><button type="button" data-q="1" data-id="${r.id}" aria-label="Увеличи количеството">+</button></div></li>`;
    }).join('') : '<li class="cart__empty">Количката е празна.<br>Добавете продукти от каталога.</li>';
    $('#cartNet').textContent = eur(t.net);
    $('#cartTotal').textContent = eur(t.gross);
    $('#cartToQuote').disabled = !cartItems.length;
  }
  function addToCart(id, btn) {
    const row = cartItems.find(r => r.id === id);
    if (row) row.qty++; else cartItems.push({ id, qty: 1 });
    save();
    const done = () => updateHeader(true);
    const img = btn.closest('.product, .napkins__card, .fold')?.querySelector('img');
    if (img && !reduce) fly(img, $('#cartOpen .hcart__icon'), done); else done();
    btn.classList.add('done');
    const label = btn.lastChild;
    if (label && label.nodeType === 3) { const old = label.textContent; label.textContent = 'Добавено'; setTimeout(() => { label.textContent = old; btn.classList.remove('done'); }, 1400); }
    else setTimeout(() => btn.classList.remove('done'), 1400);
    toast('Добавено в количката: ' + ITEMS[id].name);
  }
  function fly(img, target, cb) {
    const a = img.getBoundingClientRect(), b = target.getBoundingClientRect();
    const f = document.createElement('img');
    f.src = img.currentSrc || img.src; f.className = 'fly'; f.alt = '';
    document.body.appendChild(f);
    const x0 = a.left + a.width / 2 - 23, y0 = a.top + a.height / 2 - 23, x1 = b.left + b.width / 2 - 23, y1 = b.top + b.height / 2 - 23;
    const anim = f.animate([
      { transform: `translate(${x0}px, ${y0}px) scale(1.6)`, opacity: 1 },
      { transform: `translate(${(x0 + x1) / 2}px, ${Math.min(y0, y1) - 80}px) scale(1)`, opacity: 1, offset: .55 },
      { transform: `translate(${x1}px, ${y1}px) scale(.3)`, opacity: .4 },
    ], { duration: 700, easing: 'cubic-bezier(.4,0,.2,1)' });
    anim.onfinish = () => { f.remove(); cb(); };
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-add]');
    if (b) addToCart(b.dataset.add, b);
  });
  $('#cartList').addEventListener('click', e => {
    const b = e.target.closest('[data-q]');
    if (!b) return;
    const row = cartItems.find(r => r.id === b.dataset.id);
    row.qty += +b.dataset.q;
    if (row.qty <= 0) cartItems = cartItems.filter(r => r !== row);
    save(); updateHeader(); renderCart();
  });
  $('#cartToQuote').addEventListener('click', () => {
    if (!cartItems.length) return;
    const t = totals();
    $('#f-msg').value = 'Бих искал(а) оферта за:\n' + cartItems.map(r => `${r.qty} × ${ITEMS[r.id].name} (${eur(ITEMS[r.id].gross)} с ДДС)`).join('\n') + `\n\nОбщо: ${eur(t.gross)} с ДДС`;
    setOverlay(cart, false);
    $('#contact').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    setTimeout(() => $('#f-name').focus({ preventScroll: true }), 600);
  });
  updateHeader();

  /* ---------------- napkin colour picker ---------------- */
  const sw = $('#swatches');
  sw.innerHTML = NAPKINS.map((n, i) => `<button type="button" class="swatch" role="radio" aria-checked="${i === 0}" tabindex="${i === 0 ? 0 : -1}" style="--c:${n.c}" data-i="${i}" title="${n.color}"><span class="sr">${n.color}</span></button>`).join('');
  function pickNapkin(i, focus) {
    const n = NAPKINS[i], img = $('#napImg');
    $$('.swatch', sw).forEach((b, k) => { b.setAttribute('aria-checked', String(k === i)); b.tabIndex = k === i ? 0 : -1; });
    if (focus) $$('.swatch', sw)[i].focus();
    img.classList.add('is-swapping');
    setTimeout(() => {
      img.src = IMG + 'products/' + n.img;
      img.alt = n.name;
      img.classList.remove('is-swapping');
    }, reduce ? 0 : 180);
    $('#napLink').href = n.href;
    $('#napColor').textContent = n.color;
    $('#napColor').style.setProperty('--c', n.c);
    $('#napTitle').textContent = `${n.name}, ${n.meta.toLowerCase()}`;
    $('#napPrice').textContent = eur(n.gross);
    $('#napNet').textContent = `с ДДС · ${eur(n.net)} без ДДС`;
    $('#napAdd').dataset.add = n.id;
  }
  sw.addEventListener('click', e => { const b = e.target.closest('.swatch'); if (b) pickNapkin(+b.dataset.i); });
  sw.addEventListener('keydown', e => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    const cur = $$('.swatch', sw).findIndex(b => b.getAttribute('aria-checked') === 'true');
    pickNapkin((cur + d + NAPKINS.length) % NAPKINS.length, true);
  });

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
    const picks = NAPKINS.filter(n => n.id !== 'np-white').slice(0, 7);
    art.innerHTML = picks.map((n, i) => {
      const a = -26 + i * 12;
      return `<button type="button" class="fan-nap${n.light ? ' is-light' : ''}" style="--c:${n.c};--a:${a}deg;--d:${(i * .07).toFixed(2)}s" data-nap="${NAPKINS.indexOf(n)}" aria-label="${n.color} салфетки"><span>${n.color}</span></button>`;
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

  /* ---------------- open now (Sofia time) ---------------- */
  function openStatus() {
    let open = false;
    try {
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Sofia', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(new Date()).map(x => [x.type, x.value]));
      const mins = +parts.hour * 60 + +parts.minute;
      open = !['Sat', 'Sun'].includes(parts.weekday) && mins >= 510 && mins < 1050;
    } catch { /* no time zone data */ }
    const top = $('#openStatus'), pill = $('#openPill');
    top.classList.toggle('is-open', open);
    top.lastChild.textContent = open ? 'Отворено сега · до 17:30' : 'Пон–Пет 8:30–17:30';
    pill.classList.toggle('is-open', open);
    pill.textContent = open ? 'Отворено сега' : 'Затворено в момента';
  }
  openStatus();
  setInterval(openStatus, 60000);

  /* ---------------- forms ---------------- */
  const form = $('#quoteForm'), msg = $('#formMsg');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const name = $('#f-name'), email = $('#f-email');
    const okName = !!name.value.trim(), okMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    name.parentElement.classList.toggle('is-bad', !okName);
    email.parentElement.classList.toggle('is-bad', !okMail);
    if (!okName || !okMail) {
      msg.className = 'form__msg bad';
      msg.textContent = 'Попълнете име и валиден имейл, за да ви отговорим.';
      (okName ? email : name).focus();
      return;
    }
    const body = [
      'Име: ' + name.value.trim(),
      'Фирма: ' + ($('#f-company').value.trim() || '—'),
      'Телефон: ' + ($('#f-phone').value.trim() || '—'),
      'Имейл: ' + email.value.trim(),
      'Тип обект: ' + ($('#f-type').value || '—'),
      '', $('#f-msg').value.trim(),
    ].join('\n');
    msg.className = 'form__msg ok';
    msg.textContent = 'Отваряме имейл до office@paper-professional.com с вашето запитване. Ако не се отвори, пишете ни на този адрес или звънете на 0882 027 070.';
    location.href = 'mailto:office@paper-professional.com?subject=' + encodeURIComponent('Запитване за оферта') + '&body=' + encodeURIComponent(body);
  });
  $('#newsForm').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#news-email').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { toast('Въведете валиден имейл адрес.'); return; }
    toast('Бюлетинът ще бъде свързан при пускането на новия сайт.');
  });

  /* ---------------- reveal on scroll ---------------- */
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.remove('pre'); io.unobserve(e.target); }
    }), { threshold: .1, rootMargin: '0px 0px -30px 0px' });
    $$('[data-reveal]').forEach(el => {
      const sibs = [...el.parentElement.children].filter(x => x.hasAttribute('data-reveal'));
      el.style.setProperty('--d', (sibs.indexOf(el) % 6) * 0.05 + 's');
      if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pre'); io.observe(el); }
    });
  }
})();
