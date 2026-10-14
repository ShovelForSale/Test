/* Paper Converting Professional — category, search and product pages. Needs site.js (window.PC). */
(() => {
  'use strict';

  const {
    $, $$, esc, eur, bgn, plural, products, store, reduce, finePointer, IMG, ROOT, EN, tr, PHONE, telLink,
    CAT, catById, prodById, getProduct, children, tops, catUrl, prodUrl, catProducts, pathTo, catImage,
    isOwn, discount, soldOut, stockNote, productCard, cartIcon, quoteUrl, addToCart, reveal, params, searchAll,
  } = window.PC;
  const COMPANY = tr('Пейпър Конвертинг', 'Paper Converting');
  const main = $('#main');
  const PAGE = 24;
  const SITE = 'Paper Converting Professional';
  const ico = {
    tag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12V4h8l10 10-8 8L3 12z"/><circle cx="7.5" cy="8.5" r="1.4"/></svg>',
    doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
    box: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/></svg>',
  };
  const img = p => (p && p.img ? IMG + p.img : IMG + 'logo-badge.png');
  const setMeta = (title, desc) => {
    document.title = `${title} | ${SITE}`;
    if (desc) $('meta[name="description"]').setAttribute('content', desc);
  };
  const crumbs = list => `<nav class="crumbs" aria-label="${tr('Път до страницата', 'Breadcrumb')}"><ol>${[[tr('Начало', 'Home'), 'index.html'], ...list]
    .map(([n, h], i, a) => (i < a.length - 1 && h ? `<li><a href="${h}">${esc(n)}</a></li>` : `<li aria-current="page">${esc(n)}</li>`)).join('')}</ol></nav>`;
  const catCrumbs = id => pathTo(id).map(c => [c.name, catUrl(c.id)]);

  /* ======================================================
     CATEGORY, NEW, PROMOTIONS AND SEARCH
     ====================================================== */
  function categoryPage() {
    const q = (params.get('q') || '').trim();
    const key = params.get('id');
    const cat = key && catById.get(+key);

    if (q) {
      const hits = searchAll(q);
      const cats = hits.filter(x => x.kind === 'cat').slice(0, 12).map(x => catById.get(x.id));
      const ids = hits.filter(x => x.kind === 'prod').map(x => x.id);
      setMeta(`${tr('Търсене', 'Search')}: ${q}`);
      return shell({
        crumbs: [[tr('Търсене', 'Search'), '']], kicker: tr('Търсене', 'Search'), title: tr(`Резултати за „${q}“`, `Results for “${q}”`),
        count: ids.length ? products(ids.length) : '', tiles: cats, ids,
        empty: tr(`Няма продукти, които отговарят на „${esc(q)}“. Опитайте с друга дума или ни се обадете на ${telLink} и ще ви помогнем да намерите нужното.`,
          `No products match “${esc(q)}”. Try another word, or call us on ${telLink} and we will help you find what you need.`),
      });
    }
    if (key === 'new' || key === 'promo') {
      const isNew = key === 'new';
      const title = isNew ? tr('Нови продукти', 'New products') : tr('Промоции', 'Special offers');
      setMeta(title, isNew ? tr('Най-новите продукти в каталога на Пейпър Конвертинг.', 'The newest products in the Paper Converting catalogue.')
        : tr('Продукти на промоционални цени.', 'Products at special prices.'));
      const ids = (isNew ? CAT.new : CAT.promo).filter(id => prodById.has(id));
      return shell({
        crumbs: [[title, '']], kicker: tr('Каталог', 'Catalogue'), title, count: products(ids.length), ids,
        lead: isNew ? tr('Последно добавените продукти в каталога.', 'The latest additions to our catalogue.') : tr('Продукти с намалени цени.', 'Products with reduced prices.'),
        empty: isNew ? tr('В момента няма нови продукти.', 'There are no new products at the moment.')
          : tr('В момента няма продукти в промоция. Попитайте ни за цени на едро.', 'There are no special offers at the moment. Ask us about wholesale prices.'),
        sale: !isNew,
      });
    }
    if (cat) {
      const ids = catProducts(cat.id);
      const subs = children(cat.id);
      setMeta(cat.name, tr(`${cat.name}: ${products(ids.length)} в каталога на Пейпър Конвертинг. Цени с и без ДДС, на едро и дребно.`,
        `${cat.name}: ${products(ids.length)} in the Paper Converting catalogue. Prices with and without VAT, wholesale and retail.`));
      return shell({
        crumbs: catCrumbs(cat.id), cat, kicker: cat.parent ? catById.get(cat.parent)?.name : tr('Категория', 'Category'), title: cat.name,
        count: products(ids.length) + (subs.length ? ` ${tr('в', 'in')} ${plural(subs.length, tr('подкатегория', 'subcategory'), tr('подкатегории', 'subcategories'))}` : ''),
        lead: (cat.desc || []).map(l => l.replace(/^\*+\s*/, '')), tiles: subs, ids, image: catImage(cat),
        empty: tr(`В момента няма продукти в тази категория. Обадете се на ${telLink}, за да проверим наличност.`,
          `There are no products in this category at the moment. Call us on ${telLink} and we will check availability.`),
      });
    }
    if (key) {
      const title = tr('Категорията не е намерена', 'Category not found');
      setMeta(title);
      return shell({ crumbs: [[tr('Категории', 'Categories'), 'category.html'], [tr('Не е намерена', 'Not found'), '']], kicker: tr('Каталог', 'Catalogue'), title, ids: [], tiles: tops,
        empty: tr('Тази категория вече не съществува. Изберете от категориите по-горе.', 'This category no longer exists. Choose one of the categories above.') });
    }
    setMeta(tr('Всички категории', 'All categories'), tr('Всички категории продукти: кърпи за ръце, тоалетна хартия, кухненски ролки, салфетки, дозатори, почистващи препарати и хигиенни консумативи.',
      'All product categories: hand towels, toilet paper, kitchen rolls, napkins, dispensers, cleaning products and hygiene supplies.'));
    allCategories();
  }

  /* the frame shared by every listing: head band, subcategory tiles, side menu, toolbar and grid */
  function shell(o) {
    main.innerHTML = `
      <section class="shop-head">
        <div class="wrap">
          ${crumbs(o.crumbs)}
          <div class="shop-head__row">
            <div class="shop-head__copy">
              ${o.kicker ? `<p class="kicker">${esc(o.kicker)}</p>` : ''}
              <h1 class="shop-head__title">${esc(o.title)}</h1>
              ${o.count ? `<p class="shop-head__count">${esc(o.count)}</p>` : ''}
              ${o.lead && o.lead.length ? `<div class="shop-head__lead" id="lead">${[].concat(o.lead).map(l => `<p>${esc(l)}</p>`).join('')}</div>
                <button type="button" class="shop-head__more" id="leadMore" aria-expanded="false" hidden>${tr('Прочети още', 'Read more')}</button>` : ''}
            </div>
            ${o.image ? `<div class="shop-head__img" aria-hidden="true"><img src="${o.image}" alt=""></div>` : ''}
          </div>
          ${o.tiles && o.tiles.length ? `<div class="subcats">${o.tiles.map(c => `
            <a class="subcat" href="${catUrl(c.id)}"><span class="subcat__img"><img src="${catImage(c)}" alt="" loading="lazy"></span>
              <span class="subcat__txt"><b>${esc(c.name)}</b><small>${products(catProducts(c.id).length)}</small></span></a>`).join('')}</div>` : ''}
        </div>
      </section>
      <section class="shop-body">
        <div class="wrap shop-body__grid">
          <aside class="side" aria-label="${tr('Категории', 'Categories')}">${sideMenu(o.cat ? o.cat.id : null)}</aside>
          <div class="shop-body__main" id="listing"></div>
        </div>
      </section>`;
    listing($('#listing'), o.ids, o);
    const lead = $('#lead'), more = $('#leadMore');
    if (lead && lead.scrollHeight > lead.clientHeight + 4) {
      more.hidden = false;
      more.addEventListener('click', () => {
        const open = lead.classList.toggle('is-open');
        more.textContent = open ? tr('Скрий', 'Show less') : tr('Прочети още', 'Read more');
        more.setAttribute('aria-expanded', String(open));
      });
    }
    reveal(main);
  }

  function sideMenu(activeId) {
    const path = activeId ? pathTo(activeId).map(c => c.id) : [];
    const node = c => {
      const open = path.includes(c.id), subs = children(c.id);
      return `<li class="${c.id === activeId ? 'is-current' : ''}${open ? ' is-open' : ''}">
        <a href="${catUrl(c.id)}"${c.id === activeId ? ' aria-current="page"' : ''}><span>${esc(c.name)}</span><small>${catProducts(c.id).length}</small></a>
        ${open && subs.length ? `<ul>${subs.map(node).join('')}</ul>` : ''}</li>`;
    };
    return `<nav class="side__nav"><p class="side__title">${tr('Категории', 'Categories')}</p><ul>${tops.map(node).join('')}</ul>
        <p class="side__extra"><a href="category.html?id=new">${tr('Ново', 'New')}</a><a class="is-sale" href="category.html?id=promo">${tr('Промоции', 'Offers')}</a></p></nav>
      <div class="side__cta">
        <b>${tr('Купувате на едро?', 'Buying wholesale?')}</b>
        <p>${tr('Специални цени за фирми, хотели, ресторанти и магазини.', 'Special prices for businesses, hotels, restaurants and shops.')}</p>
        <a class="btn btn--gold btn--block" href="index.html#contact">${tr('Поискайте оферта', 'Request a quote')}</a>
        <a class="side__tel" href="tel:+359882027070">${ico.phone}${PHONE}</a>
      </div>`;
  }

  /* toolbar, grid and "show more"; the choices stay in the address so Back returns to the same list */
  function listing(root, ids, o) {
    const all = ids.map(id => prodById.get(id)).filter(Boolean);
    if (!all.length) {
      root.innerHTML = `<div class="empty"><span class="empty__ico">${ico.box}</span><p>${o.empty}</p>
        <div class="empty__links">${tops.slice(0, 6).map(c => `<a class="chip" href="${catUrl(c.id)}">${esc(c.name)}</a>`).join('')}</div></div>`;
      return;
    }
    const brands = [...all.reduce((m, p) => (p.brand ? m.set(p.brand, (m.get(p.brand) || 0) + 1) : m), new Map())].sort((a, b) => b[1] - a[1]);
    const hasOut = all.some(soldOut);
    const st = {
      sort: params.get('sort') || 'rec',
      brand: brands.some(([b]) => b === params.get('brand')) ? params.get('brand') : '',
      stock: hasOut && params.get('stock') === '1',
      n: Math.max(PAGE, +params.get('n') || PAGE),
    };
    root.innerHTML = `
      <div class="toolbar">
        <p class="toolbar__count" id="tbCount" aria-live="polite"></p>
        <div class="toolbar__ctl">
          ${brands.length > 1 ? `<label class="field-s"><span>${tr('Марка', 'Brand')}</span><select id="fBrand"><option value="">${tr('Всички марки', 'All brands')}</option>
            ${brands.map(([b, n]) => `<option value="${esc(b)}">${esc(b)} (${n})</option>`).join('')}</select></label>` : ''}
          <label class="field-s"><span>${tr('Подреди', 'Sort')}</span><select id="fSort">
            <option value="rec">${o.sale ? tr('Най-голяма отстъпка', 'Biggest discount') : tr('Препоръчани', 'Recommended')}</option><option value="price">${tr('Цена: от ниска към висока', 'Price: low to high')}</option>
            <option value="-price">${tr('Цена: от висока към ниска', 'Price: high to low')}</option><option value="name">${tr('Име: А–Я', 'Name: A–Z')}</option></select></label>
          ${hasOut ? `<label class="check"><input type="checkbox" id="fStock"><span>${tr('Само налични', 'In stock only')}</span></label>` : ''}
        </div>
      </div>
      <div class="products products--shop" id="grid"></div>
      <div class="more" id="more"></div>`;
    const grid = $('#grid', root), more = $('#more', root);
    const fBrand = $('#fBrand', root), fSort = $('#fSort', root), fStock = $('#fStock', root);
    if (fBrand) fBrand.value = st.brand;
    fSort.value = st.sort;
    if (fStock) fStock.checked = st.stock;

    const byName = (a, b) => a.name.localeCompare(b.name, tr('bg', 'en'));
    function list() {
      let out = all.filter(p => (!st.brand || p.brand === st.brand) && (!st.stock || !soldOut(p)));
      if (st.sort === 'price') out = [...out].sort((a, b) => (a.net || Infinity) - (b.net || Infinity));
      else if (st.sort === '-price') out = [...out].sort((a, b) => b.net - a.net);
      else if (st.sort === 'name') out = [...out].sort(byName);
      else if (o.sale) out = [...out].sort((a, b) => discount(b) - discount(a));
      // sold-out products go to the end of the list
      return [...out.filter(p => !soldOut(p)), ...out.filter(soldOut)];
    }
    function remember() {
      const u = new URLSearchParams(location.search);
      const set = (k, v, def) => (v === def ? u.delete(k) : u.set(k, v));
      set('sort', st.sort, 'rec'); set('brand', st.brand, ''); set('stock', st.stock ? '1' : '', ''); set('n', String(st.n), String(PAGE));
      const s = u.toString();
      history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
    }
    function render(from = 0) {
      const items = list(), shown = items.slice(0, st.n);
      const html = shown.slice(from).map((p, i) => productCard(p, i)).join('');
      if (from) grid.insertAdjacentHTML('beforeend', html); else grid.innerHTML = html;
      $('#tbCount', root).innerHTML = items.length
        ? tr(`Показани <b>${shown.length}</b> от ${products(items.length)}`, `Showing <b>${shown.length}</b> of ${products(items.length)}`)
        : tr('Няма продукти с тези филтри.', 'No products match these filters.');
      const left = items.length - shown.length;
      more.innerHTML = left > 0 ? `<div class="more__bar"><i style="width:${(shown.length / items.length * 100).toFixed(1)}%"></i></div>
        <button type="button" class="btn btn--line" id="moreBtn">${tr(`Покажи още ${Math.min(PAGE, left)}`, `Show ${Math.min(PAGE, left)} more`)}</button>` : '';
      if (!items.length) grid.innerHTML = `<div class="empty empty--inline"><p>${tr('Няма продукти с избраните филтри.', 'No products match the selected filters.')}</p><button type="button" class="btn btn--line" id="clearF">${tr('Изчисти филтрите', 'Clear filters')}</button></div>`;
    }
    root.addEventListener('change', e => {
      if (e.target === fBrand) st.brand = fBrand.value;
      if (e.target === fSort) st.sort = fSort.value;
      if (e.target === fStock) st.stock = fStock.checked;
      st.n = PAGE;
      render(); remember();
    });
    root.addEventListener('click', e => {
      if (e.target.closest('#moreBtn')) {
        const from = st.n;
        st.n += PAGE;
        render(from); remember();
        grid.children[from]?.querySelector('a')?.focus({ preventScroll: true });
      }
      if (e.target.closest('#clearF')) {
        st.brand = ''; st.stock = false; st.n = PAGE;
        if (fBrand) fBrand.value = '';
        if (fStock) fStock.checked = false;
        render(); remember();
      }
    });
    render();
  }

  function allCategories() {
    main.innerHTML = `
      <section class="shop-head">
        <div class="wrap">
          ${crumbs([[tr('Всички категории', 'All categories'), '']])}
          <div class="shop-head__copy">
            <p class="kicker">${tr('Каталог', 'Catalogue')}</p>
            <h1 class="shop-head__title">${tr('Всички категории', 'All categories')}</h1>
            <p class="shop-head__count">${products(CAT.products.length)} ${tr('в', 'in')} ${plural(tops.length, tr('категория', 'category'), tr('категории', 'categories'))}</p>
          </div>
        </div>
      </section>
      <section class="shop-body">
        <div class="wrap">
          <div class="catcards">${tops.map(c => `
            <article class="catcard" data-reveal>
              <a class="catcard__img" href="${catUrl(c.id)}"><img src="${catImage(c)}" alt="" loading="lazy"></a>
              <div class="catcard__body">
                <h2><a href="${catUrl(c.id)}">${esc(c.name)}</a></h2>
                <p class="catcard__count">${products(catProducts(c.id).length)}</p>
                ${children(c.id).length ? `<ul>${children(c.id).slice(0, 6).map(ch => `<li><a href="${catUrl(ch.id)}">${esc(ch.name)}</a></li>`).join('')}</ul>` : ''}
                <a class="link-arrow" href="${catUrl(c.id)}">${tr('Виж всички', 'View all')}</a>
              </div>
            </article>`).join('')}</div>
        </div>
      </section>`;
    reveal(main);
  }

  /* ======================================================
     PRODUCT
     ====================================================== */
  function productPage() {
    const asked = params.get('id');
    const p = asked && getProduct(asked);
    if (!p) {
      setMeta(tr('Продуктът не е намерен', 'Product not found'));
      main.innerHTML = `<section class="shop-head"><div class="wrap">${crumbs([[tr('Продукт', 'Product'), '']])}
        <h1 class="shop-head__title">${tr('Продуктът не е намерен', 'Product not found')}</h1></div></section>
        <section class="shop-body"><div class="wrap"><div class="empty"><span class="empty__ico">${ico.box}</span>
        <p>${tr(`Този продукт вече не е в каталога. Потърсете го отгоре или ни се обадете на ${telLink}.`, `This product is no longer in our catalogue. Search above or call us on ${telLink}.`)}</p>
        <div class="empty__links">${tops.slice(0, 8).map(c => `<a class="chip" href="${catUrl(c.id)}">${esc(c.name)}</a>`).join('')}</div></div></div></section>`;
      return;
    }
    if (String(p.id) !== asked) history.replaceState(null, '', prodUrl(p.id));

    // the breadcrumb follows the category the visitor came from, else the most specific one
    const from = (() => { try { return new URL(document.referrer).searchParams.get('id'); } catch { return null; } })();
    const cats = (p.cats || []).filter(id => catById.has(id));
    const catId = cats.includes(+from) ? +from : cats.sort((a, b) => pathTo(b).length - pathTo(a).length)[0];
    const cat = catById.get(catId);
    setMeta(p.name, p.gross ? tr(`${p.name}. Цена ${eur(p.net)} без ДДС (${eur(p.gross)} с ДДС). Пейпър Конвертинг, на едро и дребно.`,
      `${p.name}. Price ${eur(p.net)} excl. VAT (${eur(p.gross)} incl. VAT). Paper Converting, wholesale and retail.`)
      : `${p.name}. ${tr('Цена по запитване. Пейпър Конвертинг, на едро и дребно.', 'Price on request. Paper Converting, wholesale and retail.')}`);

    const off = discount(p), out = soldOut(p), ask = !p.gross;
    const stock = stockNote(p);
    if (!EN && p.stock) {   // the Bulgarian page uses the shop's own words, which say a little more than the badge
      if (stock[0] === 'low' || stock[0] === 'sale') stock[1] = p.stock;
      else if (/заявка/i.test(p.stock)) stock[1] = 'Изработка по заявка';
    }
    if (stock[0] === 'sale') stock[0] = 'ok';

    main.innerHTML = `
      <section class="shop-head shop-head--slim"><div class="wrap">${crumbs([...(cat ? catCrumbs(cat.id) : []), [p.name, '']])}</div></section>
      <section class="pd-wrap">
        <div class="wrap">
          <article class="pd">
            <div class="pd__gallery">
              <div class="pd__stage" id="pdStage"><img id="pdImg" src="${img(p)}" alt="${esc(p.name)}"></div>
              <div class="pd__thumbs" id="pdThumbs" hidden></div>
            </div>
            <div class="pd__info">
              <div class="product__badges">${isOwn(p) ? `<span class="pbadge">${tr('Собствено производство', 'Made by us')}</span>` : ''}${off ? `<span class="pbadge pbadge--sale">−${off}%</span>` : ''}</div>
              <h1 class="pd__title">${esc(p.name)}</h1>
              <p class="pd__meta" id="pdMeta">${p.brand ? `<span>${tr('Марка', 'Brand')}: <b>${esc(p.brand)}</b></span>` : ''}${p.size ? `<span>${tr('Размер', 'Size')}: <b>${esc(p.size)}</b></span>` : ''}</p>
              <div class="pd__price">${ask
                ? `<div class="pd__now"><b class="pd__ask">${tr('Цена по запитване', 'Price on request')}</b></div><p>${tr('Цената зависи от количеството и печата. Изпратете запитване и ще ви направим оферта.',
                  'The price depends on the quantity and the print. Send us a request and we will prepare a quote.')}</p>`
                : `<div class="pd__now">${off ? `<s>${eur(p.oldNet)}</s>` : ''}<b>${eur(p.net)}</b><span>${tr('без ДДС', 'excl. VAT')}</span></div>
                <p>${EN ? `incl. VAT: <b>${eur(p.gross)}</b>` : `с ДДС: <b>${eur(p.gross)}</b> · ${bgn(p.gross)}`}</p>`}
              </div>
              <p class="pd__stock is-${stock[0]}"><i></i>${esc(stock[1])}</p>
              <div class="pd__opts" id="pdOpts"></div>
              <div class="pd__buy">
                <div class="qty qty--l" role="group" aria-label="${tr('Количество', 'Quantity')}">
                  <button type="button" data-step="-1" aria-label="${tr('Намали количеството', 'Decrease quantity')}">−</button>
                  <input id="pdQty" type="number" min="1" max="999" value="1" inputmode="numeric" aria-label="${tr('Количество', 'Quantity')}">
                  <button type="button" data-step="1" aria-label="${tr('Увеличи количеството', 'Increase quantity')}">+</button>
                </div>
                ${ask || out ? `<a class="btn btn--dark pd__add" id="pdAsk" href="${quoteUrl(p.id)}">${ask ? tr('Поискайте оферта', 'Request a quote') : tr('Запитване за наличност', 'Ask about stock')}</a>`
                  : `<button type="button" class="btn btn--dark pd__add" id="pdAdd" data-add="${p.id}" data-custom-add>${cartIcon}<span>${tr('Добави в количката', 'Add to basket')}</span></button>`}
              </div>
              <p class="pd__err" id="pdErr" role="alert"></p>
              <a class="btn btn--line btn--block" id="pdQuote" href="${quoteUrl(p.id)}"${ask ? ' hidden' : ''}>${tr('Поискайте оферта на едро', 'Request a wholesale quote')}</a>
              <ul class="pd__perks">
                <li>${ico.tag}<span>${tr('Цени на едро за фирми, хотели, ресторанти и магазини', 'Wholesale prices for businesses, hotels, restaurants and shops')}</span></li>
                <li>${ico.doc}<span>${tr('Фактура за фирми', 'VAT invoices for businesses')}</span></li>
                <li>${ico.phone}<span>${tr('Въпроси и поръчки', 'Questions and orders')}: ${telLink}, ${tr('Пон–Пет 8:30–17:30', 'Mon–Fri 8:30–17:30')}</span></li>
              </ul>
            </div>
          </article>
          <div class="pd-more" id="pdMore"></div>
        </div>
      </section>
      <section class="section section--linen section--tight" id="relatedSec" hidden>
        <div class="wrap">
          <header class="sec-head"><div><p class="kicker">${tr('Още продукти', 'More products')}</p><h2 class="sec-title" id="relatedTitle">${tr('Подобни продукти', 'Similar products')}</h2></div>
            ${cat ? `<a class="link-arrow" href="${catUrl(cat.id)}">${tr(`Всички в „${esc(cat.name)}“`, `All in “${esc(cat.name)}”`)}</a>` : ''}</header>
          <div class="products products--row" id="related"></div>
        </div>
      </section>
      <section class="section section--tight" id="seenSec" hidden>
        <div class="wrap">
          <header class="sec-head"><div><p class="kicker">${tr('История', 'History')}</p><h2 class="sec-title">${tr('Наскоро разгледани', 'Recently viewed')}</h2></div></header>
          <div class="products products--row" id="seen"></div>
        </div>
      </section>`;

    /* quantity and options */
    const qty = $('#pdQty'), err = $('#pdErr');
    const getQty = () => Math.min(999, Math.max(1, parseInt(qty.value, 10) || 1));
    let options = [];
    const chosen = () => options.map((o, i) => {
      const el = $(`[name="opt${i}"]:checked`) || $(`#opt${i}`);
      return el && el.value ? `${o.name}: ${el.value}` : '';
    });
    function syncQuote() {
      const opt = chosen().filter(Boolean).join(', ');
      const href = quoteUrl(p.id, `&qty=${getQty()}${opt ? '&opt=' + encodeURIComponent(opt) : ''}`);
      $('#pdQuote').href = href;
      if ($('#pdAsk')) $('#pdAsk').href = href;
    }
    main.addEventListener('click', e => {
      const b = e.target.closest('[data-step]');
      if (!b) return;
      qty.value = Math.min(999, Math.max(1, getQty() + +b.dataset.step));
      syncQuote();
    });
    qty.addEventListener('change', () => { qty.value = getQty(); syncQuote(); });
    main.addEventListener('change', e => { if (e.target.closest('#pdOpts')) { err.textContent = ''; $('#pdOpts').classList.remove('is-bad'); syncQuote(); } });
    $('#pdAdd')?.addEventListener('click', e => {
      const picked = chosen();
      const miss = options.findIndex((o, i) => !picked[i]);
      if (miss >= 0) {
        err.textContent = `${tr('Изберете', 'Please choose')} ${options[miss].name.toLowerCase()}.`;
        const box = $('#pdOpts');
        box.classList.remove('is-bad'); void box.offsetWidth; box.classList.add('is-bad');
        return;
      }
      addToCart(p.id, { qty: getQty(), opt: picked.filter(Boolean).join(', '), from: e.currentTarget });
    });

    /* gallery */
    const stage = $('#pdStage'), main_img = $('#pdImg');
    function photos(list) {
      const th = $('#pdThumbs');
      if (list.length < 2) return;
      th.hidden = false;
      th.innerHTML = list.map((src, i) => `<button type="button" class="${i ? '' : 'is-on'}" data-src="${IMG + src}" aria-label="${tr('Снимка', 'Photo')} ${i + 1} ${tr('от', 'of')} ${list.length}"><img src="${IMG + src}" alt="" loading="lazy"></button>`).join('');
      th.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        $$('button', th).forEach(x => x.classList.toggle('is-on', x === b));
        main_img.src = b.dataset.src;
      });
    }
    if (finePointer && !reduce) {
      stage.addEventListener('pointermove', e => {
        const r = stage.getBoundingClientRect();
        main_img.style.transformOrigin = `${((e.clientX - r.left) / r.width * 100).toFixed(1)}% ${((e.clientY - r.top) / r.height * 100).toFixed(1)}%`;
        stage.classList.add('is-zoom');
      });
      stage.addEventListener('pointerleave', () => stage.classList.remove('is-zoom'));
    }

    /* details arrive from assets/data/products/<id>.js, and on the English pages also from <id>.en.js */
    function details(d) {
      d = d || {};
      if (d.code) $('#pdMeta').insertAdjacentHTML('afterbegin', `<span>${tr('Код', 'Code')}: <b>${esc(d.code)}</b></span>`);
      photos(d.photos || []);
      options = (d.options || []).filter(o => o.values && o.values.length);
      $('#pdOpts').innerHTML = options.map((o, i) => o.values.length <= 10
        ? `<fieldset class="opt"><legend>${esc(o.name)}</legend><div class="opt__list">${o.values.map((v, k) => `<label class="opt__chip"><input type="radio" name="opt${i}" value="${esc(v)}"${o.values.length === 1 ? ' checked' : ''}><span>${esc(v)}</span></label>`).join('')}</div></fieldset>`
        : `<label class="opt"><span class="opt__label">${esc(o.name)}</span><select id="opt${i}"><option value="">${tr('Изберете…', 'Choose…')}</option>${o.values.map(v => `<option>${esc(v)}</option>`).join('')}</select></label>`).join('')
        + (options.some(o => /опаковка|разфасовка|packaging|pack\b/i.test(o.name) && o.values.length > 1)
          ? `<p class="opt__note">${tr('Цената може да е различна според опаковката. Ще я потвърдим, когато се свържем с вас.', 'The price may differ depending on the packaging. We will confirm it when we contact you.')}</p>` : '');
      syncQuote();

      const para = lines => {
        let html = '', inList = false;
        lines.forEach(l => {
          const li = /^[•\-–]\s*/.test(l);
          if (li && !inList) { html += '<ul>'; inList = true; }
          if (!li && inList) { html += '</ul>'; inList = false; }
          html += li ? `<li>${esc(l.replace(/^[•\-–]\s*/, ''))}</li>` : `<p>${esc(l)}</p>`;
        });
        return html + (inList ? '</ul>' : '');
      };
      const text = [...(d.desc || []), ...(d.more || [])].filter((l, i, a) => a.indexOf(l) === i && l.trim() !== p.name.trim());
      const specs = (d.specs || []).filter(([k]) => !/^(марка|brand)$/i.test(k) || !p.brand);
      if (p.brand) specs.unshift([tr('Марка', 'Brand'), p.brand]);
      const w = parseFloat(String(d.weight || '').replace(',', '.'));
      if (w > 0) specs.push([tr('Тегло', 'Weight'), `${w.toLocaleString(tr('bg-BG', 'en-GB'))} ${tr('кг', 'kg')}`]);
      if (d.code) specs.unshift([tr('Код', 'Code'), d.code]);
      $('#pdMore').innerHTML = (text.length ? `<section class="pd-more__box"><h2>${tr('Описание', 'Description')}</h2><div class="prose">${para(text)}</div></section>` : '')
        + (specs.length ? `<section class="pd-more__box"><h2>${tr('Характеристики', 'Specifications')}</h2><dl class="specs">${specs.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>` : '');
      $('#pdMore').classList.toggle('is-single', !(text.length && specs.length));

      // related: the shop's own picks, then more from the same category
      const rel = [];
      const push = id => { const r = getProduct(id); if (r && r.id !== p.id && !rel.includes(r) && !soldOut(r)) rel.push(r); };
      (d.related || []).forEach(push);
      if (rel.length < 4 && cat) catProducts(cat.id).forEach(id => rel.length < 8 && push(id));
      if (rel.length) {
        $('#relatedTitle').textContent = d.related && d.related.length ? tr('Подобни продукти', 'Similar products')
          : tr(`Още от „${cat ? cat.name : 'каталога'}“`, `More from “${cat ? cat.name : 'the catalogue'}”`);
        $('#related').innerHTML = rel.slice(0, 8).map((r, i) => productCard(r, i)).join('');
        $('#relatedSec').hidden = false;
      }
    }
    const load = (file, ok, fail) => {
      const s = document.createElement('script');
      s.src = `${ROOT}assets/data/products/${file}`;
      s.onerror = fail;
      document.head.appendChild(s);
      if (ok) s.onload = ok;
    };
    let base = null;
    window.PC_PRODUCT = d => { if (d && d.id === p.id) base = d; };
    // the English text replaces the Bulgarian where it is translated; the rest (code, photos, related) stays the same
    window.PC_PRODUCT_EN = d => { if (d && d.id === p.id && base) Object.assign(base, d); };
    load(`${p.id}.js`, () => {
      if (!EN) { details(base); return; }
      load(`${p.id}.en.js`, () => details(base), () => details(base));
    }, () => details(null));

    /* recently viewed */
    const seen = store.get('seen', []).filter(id => id !== p.id && prodById.has(id));
    store.set('seen', [p.id, ...seen].slice(0, 12));
    if (seen.length) {
      $('#seen').innerHTML = seen.slice(0, 4).map((id, i) => productCard(prodById.get(id), i)).join('');
      $('#seenSec').hidden = false;
    }
  }

  if (document.body.dataset.page === 'product') productPage(); else categoryPage();
})();
