# Paper Converting Professional — new website

A new website for [paper-professional.com](https://paper-professional.com) (Пейпър Конвертинг ООД), in Bulgarian and English.
It is a static site: plain HTML, CSS and JavaScript, with no dependencies.
All products, prices, photos and categories are copied from the current shop.

## Run it

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Home page. Hero slider with small product demos (pull a towel from the dispenser, pull and tear a sheet from a 3D toilet roll, a fan of napkin colours), categories, best sellers, V or Z towels, napkin colour picker, banners, about, brands, quote form |
| `category.html?id=187` | A category: breadcrumbs, description, subcategories, side menu, filter by brand, in-stock only, sort by price or name, "show more" |
| `category.html` | All categories |
| `category.html?id=new`, `?id=promo` | New products, promotions |
| `category.html?q=салфетки` | Search results |
| `product.html?id=3330` | A product: photos with zoom, code, brand, prices with and without VAT, stock, options (colour, size, packaging), quantity, add to cart, quote request, description, specifications, similar and recently viewed products |

Every page has the same header: search with suggestions, the "All categories" menu, a mobile menu and the cart.
The cart stays in the browser and works on every page. "Изпрати като запитване" fills the quote form with its contents.

### English

The same pages in English are in `en/`: `en/index.html`, `en/category.html?id=187`, `en/product.html?id=3330`.
The БГ / EN switch in the top bar (and in the mobile menu) opens the same page, with the same filters, in the other language.
Everything is in English there: the page text, menus, cart, quote form and emails, category and product names,
descriptions, specifications, options and the home page banners. Prices show without and with VAT, in euro only.
A search on the English site also finds products by their Bulgarian names.

## Files

```
index.html                 home page markup (Bulgarian)
category.html              made from index.html by tools/build_pages.py
product.html               made from index.html by tools/build_pages.py
en/                        the English pages, made from index.html by tools/build_pages.py
assets/css/style.css       all styles; colour and type tokens at the top
assets/js/site.js          shared by every page: catalog lookups, product cards, menus, search, cart, forms
assets/js/home.js          home page: slider and its demos, best sellers, napkin colours
assets/js/roll3d.js        the toilet roll in 3D; loaded only when the browser can draw it, else a flat drawing shows
assets/vendor/             three.js 0.160 (MIT licence, see THREE-LICENSE.txt), used by roll3d.js
assets/js/shop.js          category, search and product pages
assets/data/catalog.js     every category and product (made by tools/import_catalog.py)
assets/data/catalog.en.js  English names and descriptions (made by tools/build_pages.py)
assets/data/products/      details of each product, loaded on its page; <id>.en.js holds the English
assets/img/catalog/        product and category photos from the shop
assets/img/                logo, home page photos, banners (banners/en/ in English), brand logos
tools/import_catalog.py    copies the catalog from the current shop
tools/build_pages.py       makes the catalog pages, the English pages and the English catalog files
tools/i18n/en_pages.py     English for the text of index.html
tools/i18n/en/             English for the catalog: names.json, terms.json (sizes, specifications, options), texts.json (descriptions)
```

## Updating

- **Prices and products.** Run `python3 tools/import_catalog.py`. It reads the current shop, about 1,700 pages, and takes 10–20 minutes. Add `--cache DIR` to keep the downloaded pages, so a second run takes seconds. It then updates the English catalog files and lists any new text that has no English yet; until it gets one, that text shows in Bulgarian on the English site. Add the English to the files in `tools/i18n/en/` (each is a list of `"Bulgarian": "English"`) and run `python3 tools/build_pages.py`.
- **Header, menus, footer or home page text.** Edit `index.html`, then run `python3 tools/build_pages.py`. If you changed Bulgarian text, the script stops and lists what has no English; add it to `tools/i18n/en_pages.py`.
- **Best sellers and napkin colours on the home page.** They are lists of product numbers at the top of `assets/js/home.js`.

## Not done yet

- Prices are copied from the shop on 13 Oct 2026 and are not live.
- The cart has no checkout. It sends the order as a quote request.
- The quote form has no backend. It opens an email to office@paper-professional.com.
- The newsletter form is not connected.
- "Вход" and the pages under "Информация" (delivery, terms, returns, privacy) still open the current site. They are in Bulgarian only; the English footer marks them "BG".
- Some product options (for example a box instead of a pack) may change the price in the current shop. The product page says the price will be confirmed.
- The link-preview tags (`og:url`, `og:image`, the `hreflang` links in `index.html`, and `SITE` in `tools/build_pages.py`) point to https://shovelforsale.github.io/paper-professional/. Change them when the site moves to its own domain.
