#!/usr/bin/env python3
"""Make category.html and product.html from index.html.

They share the home page's head, top bar, header, menus, cart and footer, so a change there
needs only this script run again:

    python3 tools/build_pages.py
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PAGES = {
    'category.html': {
        'page': 'category',
        'title': 'Каталог',
        'desc': 'Каталог на Пейпър Конвертинг: кърпи за ръце, тоалетна хартия, кухненски ролки, салфетки, дозатори и хигиенни консумативи.',
    },
    'product.html': {
        'page': 'product',
        'title': 'Продукт',
        'desc': 'Продукт от каталога на Пейпър Конвертинг. Цени с и без ДДС, на едро и дребно.',
    },
}


def between(s, start, end, include_end=True):
    i = s.index(start)
    j = s.index(end, i)
    return s[i:j + (len(end) if include_end else 0)]


def local_links(s):
    """Links to sections of the home page must point back to it."""
    s = s.replace('href="#top"', 'href="index.html"')
    return re.sub(r'href="#(?!main")([\w-]+)"', r'href="index.html#\1"', s)


def main():
    src = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    head = between(src, '<head>', '</head>')
    chrome = between(src, '<a class="skip"', '<main id="main">', include_end=False)
    footer = between(src, '<footer', '</footer>')

    for name, cfg in PAGES.items():
        h = re.sub(r'<title>.*?</title>', f'<title>{cfg["title"]} | Paper Converting Professional</title>', head)
        h = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + cfg['desc'], h)
        h = re.sub(r'\s*<meta property="og:url"[^>]*>', '', h)
        out = f'''<!doctype html>
<!-- Made by tools/build_pages.py from index.html. Edit index.html, then run the script again. -->
<html lang="bg">
{h}
<body data-page="{cfg["page"]}">

{local_links(chrome).rstrip()}

<main id="main" class="shop-main">
  <noscript><div class="wrap"><p class="shop-noscript">Каталогът се показва с JavaScript. Включете го или ни се обадете на <a href="tel:+359882027070">0882 027 070</a>.</p></div></noscript>
</main>

{local_links(footer)}

<script src="assets/data/catalog.js" defer></script>
<script src="assets/js/site.js" defer></script>
<script src="assets/js/shop.js" defer></script>
</body>
</html>
'''
        with open(os.path.join(ROOT, name), 'w', encoding='utf-8') as f:
            f.write(out)
        print('wrote', name)


if __name__ == '__main__':
    main()
