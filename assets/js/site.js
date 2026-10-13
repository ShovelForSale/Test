/* Paper Converting Professional — shared by every page: header, menus, search, cart, forms.
   Product data comes from assets/data/catalog.js (window.PC_CATALOG), made by tools/import_catalog.py. */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;
  const IMG = 'assets/img/';
  const BGN = 1.95583;

  const store = {
    get(k, d) { try { const v = localStorage.getItem('pcp.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('pcp.' + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const eur = v => '€' + Number(v).toFixed(2);
  const bgn = v => (v * BGN).toFixed(2) + ' лв.';
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

  /* ======================================================
     CATALOG — indexes over the imported data
     ====================================================== */
  const CAT = window.PC_CATALOG || { categories: [], products: [], new: [], promo: [] };
  const catById = new Map(CAT.categories.map(c => [c.id, c]));
  const prodById = new Map(CAT.products.map(p => [p.id, p]));
  const kids = new Map();
  CAT.categories.forEach(c => { if (!kids.has(c.parent)) kids.set(c.parent, []); kids.get(c.parent).push(c); });
  const alias = CAT.alias || {};
  /* a product by its id, or by the number in an old shop link */
  const getProduct = id => prodById.get(+id) || prodById.get(alias[id]);
  const catUrl = id => `category.html?id=${id}`;
  const prodUrl = id => `product.html?id=${id}`;

  const memo = new Map();
  /* every product in a category and its subcategories, in the shop's own order */
  function catProducts(id) {
    if (memo.has(id)) return memo.get(id);
    const seen = new Set(), out = [];
    const add = pid => { if (!seen.has(pid) && prodById.has(pid)) { seen.add(pid); out.push(pid); } };
    (catById.get(id)?.products || []).forEach(add);
    (kids.get(id) || []).forEach(ch => catProducts(ch.id).forEach(add));
    memo.set(id, out);
    return out;
  }
  /* subcategories that have products; empty ones stay out of the menus */
  const children = id => (kids.get(id) || []).filter(c => catProducts(c.id).length);
  const tops = children(null);
  function pathTo(id) {
    const out = [];
    for (let c = catById.get(id); c; c = catById.get(c.parent)) out.unshift(c);
    return out;
  }
  /* the main categories use the same pictures as the home page tiles */
  const PICS = {
    187: 'products/p5892.jpg', 191: 'products/p3835.jpg', 251: 'products/p5945.jpg', 341: 'categories/napkins.jpg',
    180: 'products/p6312.jpg', 190: 'categories/soap.jpg', 199: 'categories/soap.jpg', 391: 'categories/cleaning.jpg',
    256: 'categories/air.jpg', 413: 'categories/disinfect.jpg', 193: 'products/p3590.jpg', 192: 'categories/industrial.jpg',
    206: 'categories/industrial.jpg',
  };
  function catImage(c) {
    if (PICS[c.id]) return IMG + PICS[c.id];
    if (c.img) return IMG + c.img;
    const first = catProducts(c.id).map(pid => prodById.get(pid)).find(p => p && p.img);
    return first ? IMG + first.img : IMG + 'logo-badge.png';
  }
  const isOwn = p => /paper\s*converting/i.test(p.brand || '');
  const discount = p => (p.oldGross && p.oldGross > p.gross ? Math.round((1 - p.gross / p.oldGross) * 100) : 0);
  /* stock is left out of the data when the product is simply in stock */
  const soldOut = p => /изчерпан/i.test(p.stock || '');
  function stockBadge(p) {
    const s = p.stock || '';
    if (!s) return '';
    if (soldOut(p)) return '<span class="pbadge pbadge--muted">Изчерпан</span>';
    if (/^остават/i.test(s)) return `<span class="pbadge pbadge--low">${esc(s.replace(/^остават само/i, 'Остават').replace(/броя$/, 'бр.'))}</span>`;
    if (/разпродажба|до изчерпване/i.test(s)) return '<span class="pbadge pbadge--sale">Разпродажба</span>';
    return `<span class="pbadge pbadge--muted">${esc(/заявка/i.test(s) ? 'По заявка' : s)}</span>`;
  }
  const home = document.body.dataset.page === 'home' ? '' : 'index.html';
  const quoteUrl = (id, extra = '') => `${home || 'index.html'}?product=${id}${extra}#contact`;

  const cartIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"/><circle cx="10" cy="20.5" r="1.3"/><circle cx="17" cy="20.5" r="1.3"/></svg>';

  /* price without VAT first, the price with VAT under it */
  const priceHtml = p => (!p.gross
    ? '<p class="price__main"><b class="price__ask">Цена по запитване</b></p><span>Според количество и печат</span>'
    : `<p class="price__main">${discount(p) ? `<s>${eur(p.oldNet)}</s>` : ''}<b>${eur(p.net)}</b><em>без ДДС</em></p>`
      + `<span>с ДДС: ${eur(p.gross)} · ${bgn(p.gross)}</span>`);

  /* the product card used on the home page, category pages and "related" rows */
  function productCard(p, i = 0, extra = {}) {
    const off = discount(p);
    const badges = [
      isOwn(p) ? '<span class="pbadge">Собствено производство</span>' : '',
      extra.hit ? '<span class="pbadge pbadge--hit">Хит</span>' : '',
      off ? `<span class="pbadge pbadge--sale">−${off}%</span>` : '',
      stockBadge(p),
    ].join('');
    const meta = extra.meta || p.size || p.brand || '';
    const out = soldOut(p), ask = !p.gross;
    return `<article class="product${out ? ' is-out' : ''}" style="--d:${(i % 12) * 0.03}s">
      <a class="product__img" href="${prodUrl(p.id)}"><img src="${p.img ? IMG + p.img : IMG + 'logo-badge.png'}" alt="" loading="lazy"></a>
      <div class="product__body">
        <div class="product__badges">${badges}</div>
        <a class="product__name" href="${prodUrl(p.id)}">${esc(p.name)}</a>
        <span class="price__meta">${esc(meta)}</span>
        <div class="price">${priceHtml(p)}</div>
        ${ask ? `<a class="add add--ask" href="${quoteUrl(p.id)}">Поискайте оферта</a>`
          : out ? `<a class="add add--ask" href="${quoteUrl(p.id)}">Запитване за наличност</a>`
          : `<button type="button" class="add" data-add="${p.id}">${cartIcon}<span>Добави</span></button>`}
      </div>
    </article>`;
  }

  /* ---------------- toast ---------------- */
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
  megaList.innerHTML = tops.map((c, i) => `<li><button type="button" data-i="${i}">${esc(c.name)}</button></li>`).join('');
  function showCat(i) {
    const c = tops[i];
    if (!c) return;
    $$('button', megaList).forEach((b, k) => b.classList.toggle('is-on', k === i));
    const subs = children(c.id).map(ch => {
      const grand = children(ch.id).slice(0, 5).map(g => `<a class="mega__grand" href="${catUrl(g.id)}">${esc(g.name)}</a>`).join('');
      return `<div class="mega__sub"><a href="${catUrl(ch.id)}">${esc(ch.name)} <small>${catProducts(ch.id).length}</small></a>${grand}</div>`;
    }).join('');
    megaPanel.innerHTML = `<div><h3><a href="${catUrl(c.id)}">${esc(c.name)}</a></h3><div class="mega__subs">${subs || `<a href="${catUrl(c.id)}">Всички продукти</a>`}</div></div>
      <a class="mega__pic" href="${catUrl(c.id)}"><img src="${catImage(c)}" alt="">Всички ${plural(catProducts(c.id).length, 'продукт', 'продукта')}</a>`;
  }
  function setMega(open) {
    mega.hidden = !open;
    megaBtn.setAttribute('aria-expanded', String(open));
    if (open && !$('.is-on', megaList)) showCat(0);
  }
  megaBtn.addEventListener('click', e => { e.stopPropagation(); setMega(mega.hidden); });
  megaList.addEventListener('mouseover', e => { const b = e.target.closest('button'); if (b) showCat(+b.dataset.i); });
  megaList.addEventListener('focusin', e => { const b = e.target.closest('button'); if (b) showCat(+b.dataset.i); });
  megaList.addEventListener('click', e => { const b = e.target.closest('button'); if (b) location.href = catUrl(tops[+b.dataset.i].id); });
  if (finePointer) {
    let t;
    $('#allcats').addEventListener('mouseenter', () => { clearTimeout(t); t = setTimeout(() => setMega(true), 120); });
    $('#allcats').addEventListener('mouseleave', () => { clearTimeout(t); t = setTimeout(() => setMega(false), 220); });
  }
  document.addEventListener('click', e => { if (!e.target.closest('#allcats')) setMega(false); });
  const allCatsLink = $('#allCatsLink');
  if (allCatsLink) allCatsLink.addEventListener('click', () => {
    if (innerWidth <= 760) { setOverlay(drawer, true); return; }
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    setTimeout(() => { setMega(true); megaBtn.focus(); }, reduce ? 0 : 450);
  });

  /* mobile drawer mirrors the same tree */
  $('#drawerNav').innerHTML = tops.map(c => `<details><summary>${esc(c.name)}</summary>
      <a href="${catUrl(c.id)}">Всички продукти</a>${children(c.id).map(ch => `<a href="${catUrl(ch.id)}">${esc(ch.name)}</a>`).join('')}</details>`).join('')
    + `<a href="category.html?id=new">Ново</a><a class="is-sale" href="category.html?id=promo">Промоции</a><a href="${home}#contact" data-close>Контакти</a>`;

  addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    setMega(false); closeSearch();
    [drawer, cart].forEach(el => el.classList.contains('is-open') && setOverlay(el, false));
  });

  /* ---------------- search ---------------- */
  const q = $('#q'), drop = $('#searchDrop');
  const norm = s => String(s).toLowerCase().replace(/[×x]/g, 'х').replace(/ё/g, 'е').replace(/[^\p{L}\p{N}%/.,]+/gu, ' ').trim();
  const INDEX = [
    ...CAT.categories.map(c => ({ kind: 'cat', id: c.id, name: c.name, label: pathTo(c.id).map(x => x.name).join(' › '), text: norm(pathTo(c.id).map(x => x.name).join(' ')) })),
    ...CAT.products.map(p => ({ kind: 'prod', id: p.id, name: p.name, text: norm(`${p.name} ${p.brand || ''} ${p.size || ''}`), p })),
  ];
  function searchAll(term) {
    const words = norm(term).split(' ').filter(Boolean);
    if (!words.length) return [];
    return INDEX.filter(x => words.every(w => x.text.includes(w)) && (x.kind === 'prod' || catProducts(x.id).length));
  }
  let hits = [], active = -1;
  function mark(textValue, term) {
    const t = String(textValue), w = norm(term).split(' ')[0] || '';
    const i = w ? t.toLowerCase().indexOf(w) : -1;
    if (i < 0) return esc(t);
    return esc(t.slice(0, i)) + '<mark>' + esc(t.slice(i, i + w.length)) + '</mark>' + esc(t.slice(i + w.length));
  }
  function renderSearch() {
    const term = q.value.trim();
    if (term.length < 2) { closeSearch(); return; }
    const all = searchAll(term);
    const cats = all.filter(x => x.kind === 'cat').slice(0, 4);
    const prods = all.filter(x => x.kind === 'prod');
    hits = [...cats, ...prods.slice(0, 6)];
    active = -1;
    if (!hits.length) {
      drop.innerHTML = `<p class="search__empty">Няма резултати за „${esc(term)}“. Обадете се на <a href="tel:+359882027070"><b>0882 027 070</b></a> и ще ви помогнем.</p>`;
    } else {
      drop.innerHTML =
        (cats.length ? '<p class="search__group">Категории</p>' + cats.map((x, i) => `<a class="search__item" data-k="${i}" href="${catUrl(x.id)}">${mark(x.label, term)}</a>`).join('') : '') +
        (prods.length ? '<p class="search__group">Продукти</p>' + prods.slice(0, 6).map((x, i) => `<a class="search__item" data-k="${cats.length + i}" href="${prodUrl(x.id)}"><img src="${x.p.img ? IMG + x.p.img : IMG + 'logo-badge.png'}" alt="">${mark(x.name, term)}<small>${x.p.gross ? `${eur(x.p.net)} без ДДС` : 'по запитване'}</small></a>`).join('') : '') +
        (prods.length > 6 ? `<a class="search__all" href="category.html?q=${encodeURIComponent(term)}">Виж всички ${prods.length} продукта</a>` : '');
    }
    drop.hidden = false;
    q.setAttribute('aria-expanded', 'true');
  }
  function closeSearch() { drop.hidden = true; q.setAttribute('aria-expanded', 'false'); }
  function setActive(i) { active = i; $$('.search__item', drop).forEach(a => a.classList.toggle('is-active', +a.dataset.k === i)); }
  q.addEventListener('input', renderSearch);
  q.addEventListener('focus', () => { if (q.value.trim().length >= 2) renderSearch(); });
  q.addEventListener('keydown', e => {
    if (drop.hidden || !hits.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((active + 1) % hits.length); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActive((active - 1 + hits.length) % hits.length); }
  });
  $('#searchForm').addEventListener('submit', e => {
    e.preventDefault();
    const term = q.value.trim();
    if (active >= 0 && hits[active]) location.href = hits[active].kind === 'cat' ? catUrl(hits[active].id) : prodUrl(hits[active].id);
    else if (term) location.href = `category.html?q=${encodeURIComponent(term)}`;
  });
  document.addEventListener('click', e => { if (!e.target.closest('#searchForm')) closeSearch(); });
  const params = new URLSearchParams(location.search);
  if (params.get('q')) q.value = params.get('q');

  /* ---------------- cart (keeps a snapshot of each line, so it works on every page) ---------------- */
  let lines = store.get('cart2', []).filter(l => l && l.key && l.qty > 0);
  const save = () => store.set('cart2', lines);
  const totals = () => lines.reduce((a, l) => ({ net: a.net + l.net * l.qty, gross: a.gross + l.gross * l.qty, qty: a.qty + l.qty }), { net: 0, gross: 0, qty: 0 });
  function updateHeader(bump) {
    const t = totals(), badge = $('#cartCount');
    badge.textContent = t.qty;
    badge.classList.toggle('has', t.qty > 0);
    $('#cartSum').textContent = eur(t.net);
    if (bump) { badge.classList.remove('bump'); void badge.offsetWidth; badge.classList.add('bump'); }
  }
  function renderCart() {
    const list = $('#cartList'), t = totals();
    list.innerHTML = lines.length ? lines.map(l => `<li class="cart__item"><img src="${l.img ? IMG + l.img : IMG + 'logo-badge.png'}" alt="">
        <div><h4><a href="${prodUrl(l.id)}">${esc(l.name)}</a></h4>${l.opt ? `<small>${esc(l.opt)}</small><br>` : ''}<small>${eur(l.net)} без ДДС × ${l.qty}</small></div>
        <div class="qty"><button type="button" data-q="-1" data-key="${esc(l.key)}" aria-label="Намали количеството">−</button><span>${l.qty}</span><button type="button" data-q="1" data-key="${esc(l.key)}" aria-label="Увеличи количеството">+</button></div></li>`).join('')
      : '<li class="cart__empty">Количката е празна.<br>Добавете продукти от каталога.</li>';
    $('#cartNet').textContent = eur(t.net);
    $('#cartVat').textContent = eur(t.gross - t.net);
    $('#cartTotal').textContent = eur(t.gross);
    $('#cartToQuote').disabled = !lines.length;
  }
  function addToCart(id, { qty = 1, opt = '', from } = {}) {
    const p = getProduct(id);
    if (!p) { toast('Продуктът не е намерен в каталога.'); return; }
    const key = opt ? `${p.id}|${opt}` : String(p.id);
    const line = lines.find(l => l.key === key);
    if (line) line.qty += qty;
    else lines.push({ key, id: p.id, qty, opt, name: p.name, net: p.net, gross: p.gross, img: p.img });
    save();
    const img = from && (from.closest('.product, .napkins__card, .fold, .pd')?.querySelector('img'));
    if (img && !reduce) fly(img, $('#cartOpen .hcart__icon'), () => updateHeader(true)); else updateHeader(true);
    if (from) {
      from.classList.add('done');
      const label = from.querySelector('span') || from;
      const old = label.textContent;
      label.textContent = 'Добавено';
      setTimeout(() => { label.textContent = old; from.classList.remove('done'); }, 1400);
    }
    toast(`Добавено в количката: ${p.name}`);
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
    if (b && !b.hasAttribute('data-custom-add')) addToCart(b.dataset.add, { from: b });
  });
  $('#cartList').addEventListener('click', e => {
    const b = e.target.closest('[data-q]');
    if (!b) return;
    const line = lines.find(l => l.key === b.dataset.key);
    if (!line) return;
    line.qty += +b.dataset.q;
    if (line.qty <= 0) lines = lines.filter(l => l !== line);
    save(); updateHeader(); renderCart();
  });
  function cartAsText() {
    const t = totals();
    return 'Бих искал(а) оферта за:\n' + lines.map(l => `${l.qty} × ${l.name}${l.opt ? ` (${l.opt})` : ''}, ${eur(l.net)} без ДДС`).join('\n') + `\n\nОбщо: ${eur(t.net)} без ДДС (${eur(t.gross)} с ДДС)`;
  }
  $('#cartToQuote').addEventListener('click', () => {
    if (!lines.length) return;
    const msg = $('#f-msg');
    if (!msg) { location.href = 'index.html?quote=cart#contact'; return; }
    msg.value = cartAsText();
    setOverlay(cart, false);
    $('#contact').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
    setTimeout(() => $('#f-name').focus({ preventScroll: true }), 600);
  });
  updateHeader();

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
    if (top) { top.classList.toggle('is-open', open); top.lastChild.textContent = open ? 'Отворено сега · до 17:30' : 'Пон–Пет 8:30–17:30'; }
    if (pill) { pill.classList.toggle('is-open', open); pill.textContent = open ? 'Отворено сега' : 'Затворено в момента'; }
  }
  openStatus();
  setInterval(openStatus, 60000);

  /* ---------------- forms ---------------- */
  const form = $('#quoteForm');
  if (form) form.addEventListener('submit', e => {
    e.preventDefault();
    const msg = $('#formMsg'), name = $('#f-name'), email = $('#f-email');
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
  $('#newsForm')?.addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#news-email').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { toast('Въведете валиден имейл адрес.'); return; }
    toast('Бюлетинът ще бъде свързан при пускането на новия сайт.');
  });

  /* ---------------- reveal on scroll ---------------- */
  function reveal(root = document) {
    if (reduce || !('IntersectionObserver' in window)) return;
    const io = reveal.io || (reveal.io = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.remove('pre'); reveal.io.unobserve(e.target); }
    }), { threshold: .1, rootMargin: '0px 0px -30px 0px' }));
    $$('[data-reveal]', root).forEach(el => {
      const sibs = [...el.parentElement.children].filter(x => x.hasAttribute('data-reveal'));
      el.style.setProperty('--d', (sibs.indexOf(el) % 6) * 0.05 + 's');
      if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pre'); io.observe(el); }
    });
  }
  reveal();

  window.PC = {
    $, $$, esc, eur, bgn, plural, store, reduce, finePointer, IMG, BGN,
    CAT, catById, prodById, getProduct, children, tops, catUrl, prodUrl, catProducts, pathTo, catImage,
    isOwn, discount, soldOut, stockBadge, priceHtml, productCard, cartIcon, home, quoteUrl,
    toast, whileVisible, addToCart, cartAsText, setOverlay, reveal, params, searchAll,
  };
})();
