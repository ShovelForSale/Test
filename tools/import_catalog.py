#!/usr/bin/env python3
"""Copy the catalog of the current shop (paper-professional.com) into the new site.

Writes
  assets/data/catalog.js          category tree and product summaries, as a script the
                                  pages load (menus, search, category pages)
  assets/data/products/<id>.js    one file per product: description, specs,
                                  packaging options, photos, related products
  assets/img/catalog/             product and category photos

Usage
  python3 tools/import_catalog.py                  # full import with fresh prices
  python3 tools/import_catalog.py --no-images      # data only
  python3 tools/import_catalog.py --cache /tmp/pc  # keep the downloaded pages in /tmp/pc

Only the Python standard library is needed. With --cache, a second run reads the
saved pages and takes seconds; empty that folder to fetch fresh prices.
"""
import argparse
import concurrent.futures as cf
import hashlib
import html
import json
import os
import re
import sys
import tempfile
import time
import urllib.parse
import urllib.request
from html.parser import HTMLParser

BASE = 'https://paper-professional.com'
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = 'Mozilla/5.0 (compatible; PaperConvertingCatalogImport/1.0)'
MAX_PHOTOS = 5


# ---------------------------------------------------------------- fetching
class Fetcher:
    def __init__(self, cache):
        self.cache = cache
        os.makedirs(cache, exist_ok=True)

    def path(self, url):
        return os.path.join(self.cache, hashlib.sha1(url.encode()).hexdigest())

    def get(self, url, binary=False):
        if url.startswith('/'):
            url = BASE + url
        url = urllib.parse.quote(url, safe="%/:=&?~#+!$,;'@()*[]")  # e.g. /сапун.html
        p = self.path(url)
        if os.path.exists(p):
            with open(p, 'rb') as f:
                data = f.read()
        else:
            data = None
            for attempt in range(4):
                try:
                    req = urllib.request.Request(url, headers={'User-Agent': UA})
                    with urllib.request.urlopen(req, timeout=60) as r:
                        data = r.read()
                    break
                except Exception as e:  # network hiccup: back off and retry
                    if attempt == 3:
                        print(f'  ! failed {url}: {e}', file=sys.stderr)
                        return None
                    time.sleep(2 ** attempt)
            with open(p, 'wb') as f:
                f.write(data)
        return data if binary else data.decode('utf-8', 'replace')


# ---------------------------------------------------------------- text helpers
def text(s):
    s = re.sub(r'<br\s*/?>', ' ', s or '')
    s = re.sub(r'<[^>]+>', ' ', s)
    return re.sub(r'\s+', ' ', html.unescape(s)).strip()


KEEP_CAPS = {'ЛПС', 'ДДС', 'WC', 'PP', 'PE', 'РР', 'РЕ', 'ПВЦ', 'ЕКО', 'ЦИФ', 'ДСП'}


SHORT_WORDS = {'БР', 'ПЛ', 'ЗА', 'НА', 'ОТ', 'ДО', 'СЪС', 'НАД', 'БЕЗ', 'ПОД', 'СИВ', 'БЯЛ', 'БОЯ'}


def tidy_caps(s):
    """Lower-case shouty Cyrillic words (БЕЛИ ПЛЪТНИ -> бели плътни); keep acronyms and Latin brands."""
    def fix(m):
        w = m.group(0)
        if w in KEEP_CAPS or len(w) < 4 and w not in SHORT_WORDS:
            return w
        return w.lower()
    return re.sub(r'\b[А-ЯЁЪЬЮЩ]{2,}\b', fix, s)


LOOK_CYR, LOOK_LAT = 'АВЕКМНОРСТХаеорсух', 'ABEKMHOPCTXaeopcyx'


def one_script(s):
    """Words typed with a mix of Latin and Cyrillic look-alikes (Мini, ЕCO) get one script."""
    def fix(m):
        w = m.group(0)
        lat = len(re.findall(r'[A-Za-z]', w))
        cyr = len(re.findall(r'[А-Яа-яЁё]', w))
        if not lat or not cyr:
            return w
        src, dst = (LOOK_CYR, LOOK_LAT) if lat >= cyr else (LOOK_LAT, LOOK_CYR)
        return w.translate(str.maketrans(src, dst))
    s = re.sub(r'\b([VZ])(?=[а-я])', r'\1 ', s)  # Vсгънати -> V сгънати
    s = re.sub(r'\bРЕ\b', 'PE', s)
    s = re.sub(r'\bРР\b', 'PP', s)
    return re.sub(r'[A-Za-zА-Яа-яЁё]+', fix, s)


def clean_product_name(name):
    s = text(name)
    s = re.sub(r'\s*[-–,/]?\s*код\s*:?\s*[\w*./\-]*\s*-?\s*$', '', s, flags=re.I)  # trailing "код: 11004-"
    s = re.sub(r'^\d[\d\-]*(?:-?lux)?\s*-\s*', '', s, flags=re.I)                     # leading "4021 - "
    s = re.sub(r'^(?:0|\d{2,5}(?=\s+[A-Za-z]))\s+', '', s)                                # "950 Kleenguard" -> "Kleenguard"
    s = re.sub(r'(?<=[A-Za-z])\*(?=[A-Za-z])', ' ', s).replace('*', '')               # KIMTECH*SCIENCE -> KIMTECH SCIENCE
    s = one_script(s)
    s = tidy_caps(s)
    s = re.sub(r'\bza\b', 'за', s)
    s = re.sub(r'(\d)\s*[хxXХ]\s*(\d)', r'\1×\2', s)                                   # 21х21 -> 21×21
    s = re.sub(r'(\d)\s*(пласта|пласт|пл|цвята|цвят|см|мм|мл|ml|кг|гр|бр|л|м)\b', lambda m: f'{m.group(1)} {m.group(2).lower()}', s, flags=re.I)  # 2ПЛАСТА -> 2 пласта
    s = re.sub(r'(?<=[а-я,.] )([ВСИА])(?= [а-я])', lambda m: m.group(1).lower(), s)  # "пакета В кашон" -> "пакета в кашон"
    s = re.sub(r'(?:^|(?<=\s))([VZ])\s*-\s*(\w)', lambda m: f'{m.group(1)} {m.group(2).lower()}', s)  # "Z - Кърпи" -> "Z кърпи"
    s = re.sub(r'(?<=\S)-\s', ' - ', s)                                                 # "плътни- 130" -> "плътни - 130"
    s = re.sub(r'\s+-\s+', ', ', s)                                                     # " - 40 бр." -> ", 40 бр."
    s = re.sub(r'\.\s*/\s*(?=\d)', '., ', s)                                           # "130 л./ 10 бр." -> "130 л., 10 бр."
    s = re.sub(r'\s/(?=\d)', ' ', s)
    s = re.sub(r'(?<=[^\d\s]),(?=\S)', ', ', s)                                          # "пл,33" -> "пл, 33"
    s = re.sub(r'\s+([,.])', r'\1', s)
    s = re.sub(r',(\s*,)+', ',', s)
    s = re.sub(r'\s{2,}', ' ', s).strip(' -–,/')
    return s[:1].upper() + s[1:]


BRAND_WORDS = {'WYPALL': 'WypAll', 'KLEENGUARD': 'KleenGuard', 'KIMTECH': 'Kimtech'}


def tidy_brand(b):
    """'Kimberly-Clark SCOTT' -> 'Kimberly-Clark Scott', 'Paper-Converting' -> 'Paper Converting'."""
    b = re.sub(r'\s+', ' ', b or '').strip()
    if re.fullmatch(r'Santia Paper-Converting', b):
        return 'Santia'
    b = b.replace('Paper-Converting', 'Paper Converting').replace('Katrin-Max', 'Katrin Max')
    b = re.sub(r'\b[A-Z]{3,}\b', lambda m: BRAND_WORDS.get(m.group(0), m.group(0).title()), b)
    return re.sub(r'(WypAll L) WypAll X', r'\1/X', b)


def tidy_size(s):
    """'Ш24,0 х Д21,0 см.' -> '24×21 см', '33х33 разгъната с-ка' -> '33×33 см'."""
    s = re.sub(r'\s+', ' ', s or '').strip()
    num = lambda x: re.sub(r'[.,]0$', '', x).replace('.', ',')
    m = re.match(r'^(\d+)\s*[хxХX×]\s*(\d+)\s*разгъната', s)
    if m:
        return f'{m.group(1)}×{m.group(2)} см'
    m = re.match(r'^Ш\s*([\d.,]+)\s*(?:см\.?)?\s*[хxХX×]\s*Д\s*([\d.,]+)\s*(см|метра|м)', s)
    if m:
        a, b = num(m.group(1)), num(m.group(2))
        return f'{a}×{b} см' if m.group(3) == 'см' else f'{a} см × {b} м'
    return s


CAT_NAMES = {
    # names that the automatic sentence-casing would get wrong
    474: 'Тоалетна хартия на ролки – бяла, 100% целулоза',
    475: 'Тоалетна хартия на ролки – избелена',
    476: 'Тоалетна хартия на ролки – сива, рециклирана',
    477: 'Тоалетна хартия в пакети',
    269: 'Smart One',
    383: 'Кухненски ролки – бели',
    334: 'Кухненски ролки – избелени',
    384: 'Кухненски ролки за магазини',
    508: 'Салфетки 24×24 за бар',
    510: 'Бели салфетки 24×24 и 25×25',
    511: 'Цветни салфетки 24×24',
    512: 'Салфетки 24×24 с печат Santia',
    382: 'Салфетки 33×33',
    390: 'Бели салфетки 33×33',
    343: 'Цветни салфетки 33×33',
    518: 'Салфетки 33×33 с печат Santia',
    381: 'Салфетки 40×40',
    516: 'Бели салфетки 40×40',
    527: 'Цветни салфетки 40×40',
    517: 'Салфетки 40×40 с декор Santia',
    543: 'Диспенсърни салфетки – малки',
    544: 'Диспенсърни салфетки – 16 см',
    534: 'Великденски салфетки – 1 пласт',
    535: 'Великденски салфетки – 2 пласта',
    210: 'Индустриални ролки – 1 пласт',
    211: 'Индустриални ролки – 2 пласта',
    212: 'Индустриални ролки – 3 пласта',
    207: 'Индустриални кърпи',
    214: 'Кърпи Kimtech Prep',
    246: 'Кърпи Kimtech Science',
    193: 'Лични предпазни средства',
    391: 'Почистващи препарати',
    409: 'За WC и баня',
    541: 'Препарати за кожа и килими',
    199: 'Сапун и пяна – 500 мл, 1 л и 5 л',
    200: 'Пълнители Kimberly-Clark',
    407: 'Ароматизатори Kimberly-Clark',
    380: 'Дозатори и козметични кърпи',
    414: 'Чували 20, 35 и 50 л',
    415: 'Чували 70, 80 и 90 л',
    416: 'Чували 130, 200 и 300 л',
    412: 'Чували за смет',
    424: 'Кърпи за ръце Kimberly-Clark',
    423: 'V кърпи за ръце – къси',
    425: 'V кърпи за ръце – широки',
    487: 'Z кърпи за ръце',
    188: 'Кърпи за ръце на пачка',
    189: 'Кърпи за ръце на ролка',
    327: 'Медицински ролки и чаршафи',
    192: 'Индустриални продукти',
    186: 'Мокри кърпички с лого',
    557: 'Бели луксозни салфетки 33 см, 1/8 сгънати',
    365: 'Бели луксозни салфетки 33 см, 1/4 сгънати',
    359: 'Гофрирани салфетки – 1/8 сгънати, 1 пласт',
    342: 'Гофрирани салфетки – 1/4 сгънати, 1 пласт',
    360: 'Серия Classic – гофра, 33×33, 1/8, 1 пласт, 100 бр.',
    558: 'Серия Lovely Home – лукс, 33×24, 1/8, 2 пласта, 100 бр.',
    559: 'Серия Premium – лукс, 33×33, 1/4, 2 пласта, 40 бр.',
    361: 'Колекции 33×25 – 1/8, 1 пласт',
    509: 'Колекции 33×33 – 1/4, 1 пласт',
    438: 'Колекции 33×33 – 1/4, 2 пласта',
    520: 'Колекции 33×33 – 1/8, 2 пласта',
    181: 'Бели дозатори',
    182: 'Черни дозатори',
    185: 'Инокс дозатори',
    264: 'Сензорни дозатори',
    191: 'Тоалетна хартия',
    202: 'Тоалетна хартия на пачки',
    358: 'Тоалетна хартия на ролки',
    190: 'Течен сапун, пяна и душ гел',
}


def tidy_stock(s):
    """'Изчерпан Извести ме при наличност' -> 'Изчерпан'; enquiry notes -> 'По запитване'."""
    s = re.sub(r'\s+', ' ', s).strip()
    if s.lower().startswith('изчерпан'):
        return 'Изчерпан'
    if s.lower().startswith('запитване'):
        return 'По запитване'
    return s


def cat_display_name(cid, raw):
    if cid in CAT_NAMES:
        return CAT_NAMES[cid]
    s = text(raw).replace('*', '')
    letters = [ch for ch in s if ch.isalpha()]
    if letters and sum(ch.isupper() for ch in letters) / len(letters) > .6:
        words = []
        for w in s.split(' '):
            core = w.strip('.,-–()/')
            if core in KEEP_CAPS or re.fullmatch(r'[VZ]', core):
                words.append(w)
            elif re.fullmatch(r'[A-Za-z][A-Za-z\-]*', core):
                words.append(w.capitalize() if w.isupper() else w)
            else:
                words.append(w.lower())
        s = ' '.join(words)
    s = re.sub(r'\s*-\s*', ' – ', s) if ' - ' in s else s
    s = re.sub(r'\s{2,}', ' ', s).strip(' –-')
    return s[:1].upper() + s[1:]


# ---------------------------------------------------------------- category tree
class MenuParser(HTMLParser):
    """Rebuild the category tree from the nested "ПРОДУКТИ" menu."""

    def __init__(self):
        super().__init__()
        self.stack, self.cats, self.order = [], {}, []
        self.want_name = None
        self.in_span = False
        self.buf = ''

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'li':
            m = re.search(r'c-box-dd-categories__categoryid-(\d+)', a.get('class', ''))
            cid = int(m.group(1)) if m else None
            if cid is not None and cid not in self.cats:
                parent = next((x for x in reversed(self.stack) if x is not None), None)
                self.cats[cid] = {'id': cid, 'parent': parent, 'raw': '', 'url': ''}
                self.order.append(cid)
                self.want_name = cid
            self.stack.append(cid)
        elif tag == 'a' and self.want_name is not None and not self.cats[self.want_name]['url']:
            self.cats[self.want_name]['url'] = a.get('href', '')
        elif tag == 'span' and self.want_name is not None and not self.cats[self.want_name]['raw']:
            self.in_span, self.buf = True, ''

    def handle_endtag(self, tag):
        if tag == 'span' and self.in_span:
            self.in_span = False
            if self.want_name is not None:
                self.cats[self.want_name]['raw'] = self.buf.strip()
                self.want_name = None
        elif tag == 'li' and self.stack:
            self.stack.pop()

    def handle_data(self, data):
        if self.in_span:
            self.buf += data


def parse_tree(home):
    start = home.find('title="ПРОДУКТИ"')
    end = home.find('c-box-main-menu__item js-box-main-menu__item', start + 50)
    p = MenuParser()
    p.feed(home[start:end if end > 0 else None])
    return p.cats, p.order


def category_images(page):
    found = {}
    for m in re.finditer(r'href="/category/(\d+)/[^"]*"(?:(?!</a>).){0,900}?(?:data-src|src)="(/userfiles/categoryimages/[^"?]+)', page, re.S):
        found.setdefault(int(m.group(1)), m.group(2))
    return found


# ---------------------------------------------------------------- listings
PRICE_RE = re.compile(r'(Цена без ДДС|Цена с ДДС|Каталожна цена):?\s*</span>\s*<(?:span|del)[^>]*>\s*€\s*([\d.,]+)', re.S)


def parse_prices(block):
    out, seen_gross = {}, False
    cut = block.find('виж отстъпката')
    for label, val in PRICE_RE.findall(block if cut < 0 else block[:cut]):
        v = float(val.replace(',', ''))
        if label == 'Цена без ДДС' and 'net' not in out:
            out['net'] = v
        elif label == 'Цена с ДДС' and 'gross' not in out:
            out['gross'] = v
            seen_gross = True
        elif label == 'Каталожна цена':
            out.setdefault('oldGross' if seen_gross else 'oldNet', v)
    return out


def photo_numbers(chunk):
    nums = []
    for m in re.finditer(r'/userfiles/product(?:images|thumbs|boximages)/(?:product|thumb)_(\d+)\.(\w+)', chunk):
        key = (m.group(1), m.group(2).lower())
        if key not in nums:
            nums.append(key)
    return nums


def parse_listing(page):
    """Products on a category / promotions / new-products page, and the last page number."""
    items = []
    parts = page.split('<li class="c-product-grid__wrapper')[1:]
    for part in parts:
        chunk = part.split('</li>\n')[0] if '</li>\n' in part else part
        href = re.search(r'href="(/product/(\d+)/[^"]+)"', chunk)
        pid = re.search(r'data-productId="(\d+)"', chunk)
        title = re.search(r'c-product-grid__product-title-link[^"]*"\s+title="([^"]*)"', chunk)
        if not (href and title):
            continue
        attrs = {}
        for lab, val in re.findall(r'global-attributes-label">([^<]+)</div>\s*<div class="c-product-grid__global-attributes-values">(.*?)</div>', chunk, re.S):
            attrs[text(lab).rstrip(':')] = text(val)
        avail = re.search(r'c-product-grid__availability[^>]*>(.*?)</div>', chunk, re.S)
        items.append({
            'pid': int(pid.group(1)) if pid else int(href.group(2)),
            'urlid': int(href.group(2)),
            'url': href.group(1),
            'raw': html.unescape(title.group(1)).strip(),
            'photos': photo_numbers(chunk),
            'attrs': attrs,
            'stock': text(avail.group(1)) if avail else '',
            **parse_prices(chunk),
        })
    pager = re.search(r'c-pager__buttons(.*?)</div>', page, re.S)
    last = max([1] + [int(n) for n in re.findall(r'[?&]page=(\d+)', pager.group(1))]) if pager else 1
    return items, last


def sanitize(fragment):
    """Keep only simple formatting tags; drop styles, fonts, scripts and attributes."""
    s = re.sub(r'<(script|style)[^>]*>.*?</\1>', '', fragment or '', flags=re.S | re.I)
    s = re.sub(r'<br\s*/?>', '\n', s, flags=re.I)
    s = re.sub(r'</(p|div|h\d|li|tr)>', '\n', s, flags=re.I)
    s = re.sub(r'<li[^>]*>', '\n• ', s, flags=re.I)
    s = re.sub(r'<[^>]+>', '', s)
    lines = [re.sub(r'\s+', ' ', html.unescape(l)).strip() for l in s.split('\n')]
    return [l for l in lines if l and l != '•']


def balanced_div(page, marker):
    """Inner HTML of the first <div ...marker...> including nested divs."""
    i = page.find(marker)
    if i < 0:
        return ''
    start = page.find('>', i) + 1
    depth, pos = 1, start
    for m in re.finditer(r'<(/?)div\b', page[start:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return page[start:start + m.start()]
    return page[start:start + 4000]


def parse_product(page):
    d = {}
    h1 = re.search(r'<h1[^>]*c-product-page__product-name[^>]*>(.*?)</h1>', page, re.S)
    d['raw'] = text(h1.group(1)) if h1 else ''
    code = re.search(r'id="ProductCode"[^>]*>(.*?)</div>', page, re.S)
    d['code'] = text(code.group(1)) if code else ''
    weight = re.search(r'id="ProductWeight"[^>]*>([\d.,]+)<', page)
    d['weight'] = weight.group(1) if weight else ''
    d['desc'] = sanitize(balanced_div(page, 'c-product-page__product-description'))
    d['more'] = sanitize(balanced_div(page, 'id="product-detailed-description"'))
    if d['more'] == d['desc']:
        d['more'] = []
    specs = []
    for lab, val in re.findall(r'c-tab-attribute__label">(.*?)</div>.*?c-tab-attribute__value[^"]*"[^>]*>(.*?)</span>', page, re.S):
        lab, val = text(lab).rstrip(':'), text(val)
        if lab and val:
            specs.append([lab.capitalize() if lab.isupper() else lab.replace('пастове', 'пластове'), val.replace('*', '')])
    if not specs:
        for lab, val in re.findall(r'c-product-page__attribute-name">(.*?)</div>\s*<div class="c-product-page__attribute-value">(.*?)</div>', page, re.S):
            specs.append([text(lab).rstrip(':'), text(val).replace('*', '')])
    d['specs'] = specs
    options = []
    for name, sel in re.findall(r'c-product-page__option-name[^>]*>(.*?)</span>\s*<select[^>]*>(.*?)</select>', page, re.S):
        vals = [text(v) for k, v in re.findall(r'<option value="(\d+)"[^>]*>(.*?)</option>', sel, re.S) if k != '0']
        if vals:
            label = re.sub(r'^избер(?:и|ете)\s+', '', text(name).rstrip(':'), flags=re.I)  # "Избери цвят" -> "цвят"
            label = label.capitalize() if label.isupper() else label[:1].upper() + label[1:]
            options.append({'name': label, 'values': [re.sub(r'\s*/\s*', ' / ', v).strip(' /') for v in vals]})
    d['options'] = options
    avail = re.search(r'c-product-page__availability-label[^>]*>(.*?)</div>', page, re.S)
    d['stock'] = text(avail.group(1)) if avail else ''
    main = page[page.find('c-product-page__product-image'):page.find('id="related-products"')] if 'id="related-products"' in page else page[page.find('c-product-page__product-image'):]
    d['photos'] = photo_numbers(main)
    crumbs = page[page.find('c-breadcrumb__list'):page.find('c-breadcrumb__item--last')]
    d['crumbs'] = [int(x) for x in re.findall(r'href="/category/(\d+)/', crumbs)]
    rel = balanced_div(page, 'id="related-products"') if 'id="related-products"' in page else ''
    d['related'] = []
    for u in re.findall(r'href="/product/(\d+)/', rel):
        if int(u) not in d['related']:
            d['related'].append(int(u))
    d.update(parse_prices(page[page.find('ProductPricesHolder'):page.find('ProductPricesHolder') + 6000]))
    return d


def image_size(path):
    """(width, height) of a JPEG, PNG or GIF file, or None."""
    with open(path, 'rb') as f:
        data = f.read()
    if data[:8] == b'\x89PNG\r\n\x1a\n':
        return int.from_bytes(data[16:20], 'big'), int.from_bytes(data[20:24], 'big')
    if data[:6] in (b'GIF87a', b'GIF89a'):
        return int.from_bytes(data[6:8], 'little'), int.from_bytes(data[8:10], 'little')
    i = 2
    while data[:2] == b'\xff\xd8' and i + 9 < len(data):
        if data[i] != 0xFF:
            return None
        marker, size = data[i + 1], int.from_bytes(data[i + 2:i + 4], 'big')
        if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
            return int.from_bytes(data[i + 7:i + 9], 'big'), int.from_bytes(data[i + 5:i + 7], 'big')
        i += 2 + size
    return None


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--cache', help='folder for downloaded pages (default: a new temporary folder)')
    ap.add_argument('--workers', type=int, default=4)
    ap.add_argument('--no-images', action='store_true')
    args = ap.parse_args()
    F = Fetcher(args.cache or tempfile.mkdtemp(prefix='pc-catalog-'))
    pool = cf.ThreadPoolExecutor(args.workers)

    home = F.get('/')
    cats, order = parse_tree(home)
    print(f'{len(cats)} categories')
    cat_imgs = category_images(home)

    # every page of every category, plus "new" and "promotions"
    lists = {cid: cats[cid]['url'] for cid in order}
    lists['new'] = '/new_products.html'
    lists['promo'] = '/all_promotions.html'

    def read_list(key):
        first = F.get(lists[key])
        if first is None:
            return key, [], None
        items, last = parse_listing(first)
        for n in range(2, last + 1):
            sep = '&' if '?' in lists[key] else '?'
            more = F.get(f'{lists[key]}{sep}page={n}')
            if more:
                items += parse_listing(more)[0]
        return key, items, first

    products, membership, urlid_to_pid = {}, {}, {}
    descriptions = {}
    for key, items, first in pool.map(read_list, list(lists)):
        if first is not None and isinstance(key, int):
            cat_imgs.update({k: v for k, v in category_images(first).items() if k not in cat_imgs})
            desc = re.search(r'<div class="c-category-description[^"]*">(.*?)</div>', first, re.S)
            if desc and len(text(desc.group(1))) > 20:
                descriptions[key] = sanitize(desc.group(1))
        ids = []
        for it in items:
            urlid_to_pid[it['urlid']] = it['pid']
            if it['pid'] not in products:
                products[it['pid']] = it
            if it['pid'] not in ids:
                ids.append(it['pid'])
        membership[key] = ids
        label = cats[key]['raw'] if isinstance(key, int) else key
        print(f'  {label[:40]:40} {len(ids):4} products')

    print(f'{len(products)} unique products, reading product pages…')

    def read_product(pid):
        page = F.get(f'/product/{pid}/x.html') or F.get(products[pid]['url'])
        return pid, parse_product(page) if page else None

    details = {}
    for i, (pid, d) in enumerate(pool.map(read_product, list(products)), 1):
        if d:
            details[pid] = d
        if i % 50 == 0:
            print(f'  {i}/{len(products)}')

    # ------------------------------------------------ photos
    img_dir = os.path.join(ROOT, 'assets', 'img', 'catalog')
    os.makedirs(img_dir, exist_ok=True)
    jobs = {}
    for pid, p in products.items():
        nums = (details.get(pid) or {}).get('photos') or p['photos']
        p['photo_files'] = []
        for num, ext in nums[:MAX_PHOTOS]:
            name = f'{num}.{ext}'
            jobs[name] = f'/userfiles/productimages/product_{num}.{ext}'
            p['photo_files'].append(name)
    cat_files = {}
    for cid, url in cat_imgs.items():
        name = 'c' + os.path.basename(url)
        jobs[name] = url
        cat_files[cid] = name

    def save(item):
        name, url = item
        dest = os.path.join(img_dir, name)
        if os.path.exists(dest):
            return name, True
        data = F.get(url, binary=True)
        if not data or len(data) < 200 or data[:15].lower().startswith(b'<!doctype'):
            return name, False
        with open(dest, 'wb') as f:
            f.write(data)
        return name, True

    missing = set()
    if not args.no_images:
        print(f'downloading {len(jobs)} photos…')
        for name, ok in pool.map(save, jobs.items()):
            if not ok:
                missing.add(name)
    for p in products.values():
        p['photo_files'] = [n for n in p['photo_files'] if n not in missing]
    # category pictures are shown as small square tiles; wide banners are left out (a product photo is used instead)
    for cid, name in list(cat_files.items()):
        size = None if name in missing else image_size(os.path.join(img_dir, name))
        if not size or not 0.8 <= size[0] / size[1] <= 1.25:
            missing.add(name)
            if os.path.exists(os.path.join(img_dir, name)):
                os.remove(os.path.join(img_dir, name))

    # ------------------------------------------------ write data
    def pick(cid):
        return cats[cid]['parent']

    out_cats = []
    for cid in order:
        c = cats[cid]
        out_cats.append({
            'id': cid,
            'name': cat_display_name(cid, c['raw']),
            'parent': c['parent'],
            'img': ('catalog/' + cat_files[cid]) if cid in cat_files and cat_files[cid] not in missing else None,
            'products': membership.get(cid, []),
            **({'desc': descriptions[cid]} if cid in descriptions else {}),
        })

    out_products, written = [], set()
    for pid, p in products.items():
        d = details.get(pid, {})
        name = clean_product_name(d.get('raw') or p['raw'])
        net, gross = d.get('net', p.get('net')), d.get('gross', p.get('gross'))
        if net is None or gross is None:
            continue
        item = {'id': pid, 'name': name, 'net': net, 'gross': gross,
                'img': ('catalog/' + p['photo_files'][0]) if p['photo_files'] else None}
        old_net, old_gross = d.get('oldNet', p.get('oldNet')), d.get('oldGross', p.get('oldGross'))
        if old_gross and old_gross > gross:
            item['oldGross'] = old_gross
            item['oldNet'] = old_net if old_net and old_net > net else round(old_gross / 1.2, 2)
        stock = tidy_stock(d.get('stock') or p.get('stock') or '')
        if stock and stock != 'В наличност':  # in stock is the default and left out
            item['stock'] = stock
        size = tidy_size(p['attrs'].get('Размер'))
        if size:
            item['size'] = size
        brand = tidy_brand(next((v for k, v in d.get('specs', []) if k.lower() == 'марка'), ''))
        if brand:
            item['brand'] = brand
        item['cats'] = [cid for cid in order if pid in membership.get(cid, [])]
        out_products.append(item)
        written.add(pid)

        detail = {
            'id': pid,
            'code': d.get('code', ''),
            'weight': d.get('weight', ''),
            'desc': d.get('desc', []),
            'more': d.get('more', []),
            'specs': d.get('specs', []),
            'options': d.get('options', []),
            'photos': ['catalog/' + n for n in p['photo_files']],
            'crumbs': [c for c in d.get('crumbs', []) if c in cats],
            'related': [],
        }
        for r in d.get('related', []):
            rid = r if r in products else urlid_to_pid.get(r)
            if rid and rid != pid and rid not in detail['related']:
                detail['related'].append(rid)
        pdir = os.path.join(ROOT, 'assets', 'data', 'products')
        os.makedirs(pdir, exist_ok=True)
        with open(os.path.join(pdir, f'{pid}.js'), 'w', encoding='utf-8') as f:
            f.write('window.PC_PRODUCT&&PC_PRODUCT(' + json.dumps(detail, ensure_ascii=False, separators=(',', ':')) + ');\n')

    catalog = {
        'source': BASE,
        'imported': time.strftime('%Y-%m-%d'),
        'categories': out_cats,
        'products': out_products,
        'new': membership.get('new', []),
        'promo': membership.get('promo', []),
        # the shop gives some products a different number in the link than their own id
        'alias': {str(u): pid for u, pid in sorted(urlid_to_pid.items()) if u != pid and pid in written},
    }
    with open(os.path.join(ROOT, 'assets', 'data', 'catalog.js'), 'w', encoding='utf-8') as f:
        f.write('window.PC_CATALOG=' + json.dumps(catalog, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(f'wrote {len(out_cats)} categories, {len(out_products)} products')


if __name__ == '__main__':
    main()
