#!/usr/bin/env python3
"""Make the pages and data files that come from index.html and the catalog.

    python3 tools/build_pages.py

Writes
  category.html, product.html          the Bulgarian catalog pages, from index.html
  en/index.html                        the English home page: index.html with the English of tools/i18n/en_pages.py
  en/category.html, en/product.html    the English catalog pages, from en/index.html
  assets/data/catalog.en.js            English names and descriptions of the categories and products
  assets/data/products/<id>.en.js      English description, specifications and options of each product

The pages share the home page's head, top bar, header, menus, cart and footer, so a change there needs only this
script run again. The English catalog text is in tools/i18n/en/*.json, each a list of {"Bulgarian": "English"}:
names.json (category and product names), terms.json (sizes, specifications, options) and texts.json (descriptions).
A text with no English stays Bulgarian on the English pages; the script lists those at the end.
tools/import_catalog.py runs this script after every import.
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools', 'i18n'))
import en_pages  # noqa: E402

SITE = 'https://shovelforsale.github.io/paper-professional/'
CYRILLIC = re.compile('[А-Яа-яЁёЪъ]')

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
NOSCRIPT = 'Каталогът се показва с JavaScript. Включете го или ни се обадете на <a href="tel:+359882027070">0882 027 070</a>.'


def between(s, start, end, include_end=True):
    i = s.index(start)
    j = s.index(end, i)
    return s[i:j + (len(end) if include_end else 0)]


def local_links(s):
    """Links to sections of the home page must point back to it."""
    s = s.replace('href="#top"', 'href="index.html"')
    return re.sub(r'href="#(?!main")([\w-]+)"', r'href="index.html#\1"', s)


def switch_to(s, href):
    """Point the language switch at the same page in the other language."""
    return re.sub(r'(<a class="lang__opt" href=")[^"]*(" hreflang="\w+" lang="\w+" data-lang-switch>)', rf'\g<1>{href}\2', s)


def catalog_page(src, name, cfg, lang):
    """category.html or product.html, from a whole home page in the same language."""
    up = '../' if lang == 'en' else ''
    head = between(src, '<head>', '</head>')
    chrome = between(src, '<a class="skip"', '<main id="main">', include_end=False)
    footer = between(src, '<footer', '</footer>')
    head = re.sub(r'<title>.*?</title>', f'<title>{cfg["title"]} | Paper Converting Professional</title>', head)
    head = re.sub(r'(<meta name="description" content=")[^"]*', lambda m: m.group(1) + cfg['desc'], head)
    head = re.sub(r'\s*<meta property="og:url"[^>]*>', '', head)
    head = re.sub(r'\s*<link rel="alternate" hreflang[^>]*>', '', head)
    chrome = switch_to(chrome, '../' + name if lang == 'en' else 'en/' + name)
    scripts = [f'{up}assets/data/catalog.js'] + ([f'{up}assets/data/catalog.en.js'] if lang == 'en' else []) \
        + [f'{up}assets/js/site.js', f'{up}assets/js/shop.js']
    return f'''<!doctype html>
<!-- Made by tools/build_pages.py from index.html. Edit index.html, then run the script again. -->
<html lang="{lang}">
{head}
<body data-page="{cfg["page"]}">

{local_links(chrome).rstrip()}

<main id="main" class="shop-main">
  <noscript><div class="wrap"><p class="shop-noscript">{cfg["noscript"]}</p></div></noscript>
</main>

{local_links(footer)}

''' + ''.join(f'<script src="{s}" defer></script>\n' for s in scripts) + '''</body>
</html>
'''


# ------------------------------------------------------------------ English pages
def to_english(src):
    """en/index.html from index.html."""
    out, missing = src, []
    # whole texts between tags and whole attribute values; the longest first, so a sentence wins over a word in it
    for bg, en in sorted(en_pages.PAGE, key=lambda kv: -len(kv[0])):
        pat = re.compile(r'(?<=[>"])(\s*)' + re.escape(bg) + r'(\s*)(?=[<"])')
        out, n = pat.subn(lambda m: m.group(1) + en + m.group(2), out)
        if not n:
            missing.append(bg)
    out = out.replace('<html lang="bg">', '<html lang="en">')
    # the switch: БГ becomes the link, EN the current language
    out = re.sub(r'<div class="lang([^"]*)" role="group" aria-label="[^"]*"><span class="lang__opt is-on" lang="bg" aria-current="true">БГ</span>'
                 r'<a class="lang__opt" href="en/" hreflang="en" lang="en" data-lang-switch>EN</a></div>',
                 r'<div class="lang\1" role="group" aria-label="Language / Език"><a class="lang__opt" href="../" hreflang="bg" lang="bg" data-lang-switch>БГ</a>'
                 r'<span class="lang__opt is-on" lang="en" aria-current="true">EN</span></div>', out)
    # link previews
    out = out.replace('<meta property="og:locale" content="bg_BG">', '<meta property="og:locale" content="en_GB">\n<meta property="og:locale:alternate" content="bg_BG">')
    out = out.replace(f'<meta property="og:url" content="{SITE}">', f'<meta property="og:url" content="{SITE}en/">')
    if os.path.exists(os.path.join(ROOT, 'assets/img/og-image-en.jpg')):
        out = out.replace(f'{SITE}assets/img/og-image.jpg', f'{SITE}assets/img/og-image-en.jpg')
    # files are one folder up; banners with English text are used where they exist
    out = re.sub(r'(src|href)="assets/', r'\1="../assets/', out)
    out = re.sub(r'"\.\./assets/img/banners/([\w-]+\.jpg)"',
                 lambda m: f'"../assets/img/banners/en/{m.group(1)}"' if os.path.exists(os.path.join(ROOT, 'assets/img/banners/en', m.group(1))) else m.group(0), out)
    out = out.replace('&amp;hl=bg&amp;', '&amp;hl=en&amp;')
    out = out.replace('<script src="../assets/data/catalog.js" defer></script>',
                      '<script src="../assets/data/catalog.js" defer></script>\n<script src="../assets/data/catalog.en.js" defer></script>')
    # pages of the current shop are in Bulgarian: say so next to their links
    out = re.sub(r'(<a href="https://paper-professional\.com/page/[^"]+")>([^<]+)</a>', r'\1 hreflang="bg">\2 <small class="lang-tag">BG</small></a>', out)

    if missing:
        print('en_pages.py: these pieces are no longer in index.html:\n  ' + '\n  '.join(missing[:20]))
    left = [m for m in re.finditer(r'[^<>"]*' + CYRILLIC.pattern + r'[^<>"]*', re.sub(r'<div class="lang[^"]*".*?</div>', '', out))]
    if left:
        sys.exit('en/index.html would still have Bulgarian text. Add it to tools/i18n/en_pages.py:\n  '
                 + '\n  '.join(sorted({' '.join(m.group(0).split()) for m in left})))
    return out


# ------------------------------------------------------------------ English catalog data
def load_json(path):
    return json.loads(open(path, encoding='utf-8').read().split('=', 1)[1].rstrip().rstrip(';')) if path.endswith('.js') \
        else json.load(open(path, encoding='utf-8'))


def build_catalog_en():
    data = os.path.join(ROOT, 'assets', 'data')
    tm = {k: load_json(os.path.join(ROOT, 'tools', 'i18n', 'en', k + '.json')) for k in ('names', 'terms', 'texts')}
    gaps = {k: set() for k in tm}

    def tr(kind, text):
        key = (text or '').strip()
        if not key or not CYRILLIC.search(key):
            return text
        if key in tm[kind]:
            return tm[kind][key]
        gaps[kind].add(key)
        return text

    cat = load_json(os.path.join(data, 'catalog.js'))
    out = {'c': {}, 'p': {}}
    for c in cat['categories']:
        item = {'n': tr('names', c['name'])}
        if c.get('desc'):
            item['d'] = [tr('texts', line) for line in c['desc']]
        out['c'][c['id']] = item
    names = {}
    for p in cat['products']:
        item = {'n': tr('names', p['name'])}
        if p.get('size'):
            item['s'] = tr('terms', p['size'])
        out['p'][p['id']] = item
        names[p['id']] = p['name'].strip()
    with open(os.path.join(data, 'catalog.en.js'), 'w', encoding='utf-8') as f:
        f.write('window.PC_CATALOG_EN=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')

    pdir = os.path.join(data, 'products')
    written = set()
    for pid, bg_name in names.items():
        path = os.path.join(pdir, f'{pid}.js')
        if not os.path.exists(path):
            continue
        s = open(path, encoding='utf-8').read()
        d = json.loads(s[s.index('(') + 1:s.rindex(')')])
        # a line that only repeats the product's name is not shown, in either language
        lines = lambda key: [tr('texts', line) for line in d.get(key) or [] if line.strip() and line.strip() != bg_name]
        en = {
            'id': pid,
            'desc': lines('desc'),
            'more': lines('more'),
            'specs': [[tr('terms', k), tr('terms', v)] for k, v in d.get('specs') or []],
            'options': [{'name': tr('terms', o['name']), 'values': [tr('terms', v) for v in o['values']]} for o in d.get('options') or []],
        }
        with open(os.path.join(pdir, f'{pid}.en.js'), 'w', encoding='utf-8') as f:
            f.write('window.PC_PRODUCT_EN&&PC_PRODUCT_EN(' + json.dumps(en, ensure_ascii=False, separators=(',', ':')) + ');\n')
        written.add(f'{pid}.en.js')
    for old in glob.glob(os.path.join(pdir, '*.en.js')):
        if os.path.basename(old) not in written:
            os.remove(old)
    print(f'wrote assets/data/catalog.en.js and {len(written)} English product files')
    for kind, keys in gaps.items():
        if keys:
            print(f'  {len(keys)} texts have no English yet (tools/i18n/en/{kind}.json); they stay Bulgarian, e.g.:')
            for k in sorted(keys)[:5]:
                print('    ' + k[:100])


def main():
    src = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    en_src = to_english(src)
    os.makedirs(os.path.join(ROOT, 'en'), exist_ok=True)
    with open(os.path.join(ROOT, 'en', 'index.html'), 'w', encoding='utf-8') as f:
        f.write(en_src)
    print('wrote en/index.html')

    for name, cfg in PAGES.items():
        for lang, page, conf in (('bg', src, {**cfg, 'noscript': NOSCRIPT}),
                                 ('en', en_src, {**cfg, **en_pages.PAGES[name], 'noscript': en_pages.NOSCRIPT})):
            path = os.path.join(ROOT, *(['en'] if lang == 'en' else []), name)
            with open(path, 'w', encoding='utf-8') as f:
                f.write(catalog_page(page, name, conf, lang))
            print('wrote', os.path.relpath(path, ROOT))
    build_catalog_en()


if __name__ == '__main__':
    main()
