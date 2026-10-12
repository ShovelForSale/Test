# Paper Converting Professional — new front page

A new animated home page for [paper-professional.com](https://paper-professional.com) (Пейпър Конвертинг ООД).
It is a static site: plain HTML, CSS and JavaScript, with no build step and no dependencies.

## Run it

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## What's on the page

| Section | What it does |
| --- | --- |
| Header | Top bar (phone, email, live "open now" status in Sofia time, VAT on/off toggle), mega menu, search overlay, cart drawer, mobile menu |
| Hero | Toilet roll you can drag: the sheet unrolls, tears at the perforation and falls. It also unrolls as you scroll |
| Own production | Toilet paper, V/Z hand towels, kitchen rolls, napkins, each with a small animation |
| How we work | Scroll-driven converting line: jumbo roll → plies → cutting → folding → packing |
| Pull demo | Towel dispenser. Pull a towel and the next one comes out. Switch between V and Z fold with a live cross-section diagram |
| Napkins | Pick a colour; a 3D napkin folds to 1/2 and 1/4 with real sizes |
| Catalog | Bought-in ranges: dispensers, cleaning products, disinfectants, soap, PPE, hotel supplies, bags and more |
| Best sellers | **Demo** products with prices taken from the current shop; add-to-cart works locally |
| Contact | Quote form (opens the visitor's email app; no server yet), address, hours, map link |

## Files

```
index.html            page markup (Bulgarian)
assets/css/style.css  all styles; colour and type tokens at the top
assets/js/main.js     all interactions and animations
assets/img/logo.jpg   company logo
```

## Not done yet

- Products are demo data in `assets/js/main.js` (`PRODUCTS`). The real catalog, product pages and checkout still need connecting.
- The quote form has no backend. It builds an email to office@paper-professional.com.
- Category links point to sections on this page until the category pages exist.
- Marketing copy (process steps, sectors) is a first draft; please check it against how the company actually works.
