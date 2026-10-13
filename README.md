# Paper Converting Professional — new website

A new website for [paper-professional.com](https://paper-professional.com) (Пейпър Конвертинг ООД).
It is a static site: plain HTML, CSS and JavaScript, with no build step and no dependencies.
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

## Files

```
index.html                 home page markup (Bulgarian)
category.html              made from index.html by tools/build_pages.py
product.html               made from index.html by tools/build_pages.py
assets/css/style.css       all styles; colour and type tokens at the top
assets/js/site.js          shared by every page: catalog lookups, product cards, menus, search, cart, forms
assets/js/home.js          home page: slider and its demos, best sellers, napkin colours
assets/js/roll3d.js        the toilet roll in 3D; loaded only when the browser can draw it, else a flat drawing shows
assets/vendor/             three.js 0.160 (MIT licence, see THREE-LICENSE.txt), used by roll3d.js
assets/js/shop.js          category, search and product pages
assets/data/catalog.js     every category and product (made by tools/import_catalog.py)
assets/data/products/      details of each product, loaded on its page
assets/img/catalog/        product and category photos from the shop
assets/img/                logo, home page photos, banners, brand logos
tools/import_catalog.py    copies the catalog from the current shop
tools/build_pages.py       makes category.html and product.html from index.html
```

## Updating

- **Prices and products.** Run `python3 tools/import_catalog.py`. It reads the current shop, about 1,700 pages, and takes 10–20 minutes. Add `--cache DIR` to keep the downloaded pages, so a second run takes seconds.
- **Header, menus or footer.** Edit `index.html`, then run `python3 tools/build_pages.py`.
- **Best sellers and napkin colours on the home page.** They are lists of product numbers at the top of `assets/js/home.js`.

## Not done yet

- Prices are copied from the shop on 13 Oct 2026 and are not live.
- The cart has no checkout. It sends the order as a quote request.
- The quote form has no backend. It opens an email to office@paper-professional.com.
- The newsletter form is not connected.
- "Вход" and the pages under "Информация" (delivery, terms, returns, privacy) still open the current site.
- Some product options (for example a box instead of a pack) may change the price in the current shop. The product page says the price will be confirmed.
- The link-preview tags (`og:url`, `og:image` in `index.html`) point to https://shovelforsale.github.io/Test/. Change them when the site moves to its own domain.
