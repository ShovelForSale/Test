# Paper Converting Professional — new home page

A new home page for [paper-professional.com](https://paper-professional.com) (Пейпър Конвертинг ООД).
It is a static site: plain HTML, CSS and JavaScript, with no build step and no dependencies.
Products, prices, photos, banners and category links are taken from the current shop.

## Run it

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## What's on the page

| Section | What it does |
| --- | --- |
| Header | Delivery note, phone, live "open now" status (Sofia time), product search with suggestions, cart with total, "All categories" menu with every category from the shop, mobile menu |
| Hero | Slider with three own product lines. Each slide has a small demo of the product: pull a towel from the dispenser and the next one comes out, pull and tear a toilet paper sheet, a fan of napkin colours. Next to it: the shop's banners for wet wipes with your logo and hotel supplies |
| Benefits | Own production, delivery in 1–4 days with Econt or Speedy, wholesale and retail, Kimberly-Clark |
| Categories | 12 categories with product photos, linking to the shop |
| Best sellers | Real products and prices (with and without VAT, € and лв.), filter by paper or hygiene, add to cart |
| V or Z | What the two hand towel folds are, with sizes, and the dispenser that fits them |
| Napkins | Pick a colour and see the actual Santia product, price and add to cart |
| Banners | Christmas napkins, toilet paper, kitchen, cleaning, Santia for shops |
| About | What the company does, with a small animation of jumbo roll → cutting → packs |
| Brands | Paper Converting, Kimberly-Clark, Santia, Scott, Kleenex, WypAll, Sano, Mar Plast |
| Contact | Wholesale quote form, phone, email, address, hours, map link |

## Files

```
index.html                 page markup (Bulgarian)
assets/css/style.css       all styles; colour and type tokens at the top
assets/js/main.js          interactions; categories, products and napkins data at the top
assets/img/                logo, product photos, category photos, banners, brand logos
```

## Not done yet

- Links go to the current shop's category and product pages. They need updating if the shop platform changes.
- Prices are copied from the shop on 12 Oct 2026 and are not live.
- The cart stays in the browser. "Изпрати като запитване" fills the quote form with the cart items.
- The quote form has no backend. It opens an email to office@paper-professional.com.
- The newsletter form is not connected.
