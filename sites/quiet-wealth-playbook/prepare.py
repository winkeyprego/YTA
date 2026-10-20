"""Optional authoring sync. Deploy dist/ directly; no runtime or build is required."""
import html
import json
import shutil
from sales import render_sales, make_printables
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent
C = json.loads((ROOT / 'content.json').read_text(encoding='utf-8'))
D = ROOT / 'dist'
E = lambda value: html.escape(str(value), quote=True)
U = C['ui']
PRICE = f"${C['price']:g}"


def icon(name='book', cls=''):
    shapes = {
        'book': '<path d="M4 4h7a3 3 0 0 1 3 3v14a4 4 0 0 0-4-2H4zM14 7a3 3 0 0 1 3-3h3v15h-3a4 4 0 0 0-3 2"/>',
        'grid': '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M10 4v16M10 15h10"/>',
        'check': '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="m8 9 2 2 4-4M8 16h7"/>',
        'message': '<path d="M4 5h16v11H9l-5 4zM8 9h8M8 12h5"/>',
        'branch': '<rect x="9" y="3" width="6" height="5" rx="1"/><path d="M12 8v4M6 16v-4h12v4"/><rect x="3" y="16" width="6" height="5" rx="1"/><rect x="15" y="16" width="6" height="5" rx="1"/>',
        'calendar': '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4M16 3v4M4 11h16M8 15h2M14 15h2"/>',
        'compass': '<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5z"/>',
        'heart': '<path d="M12 20 4.5 12A5 5 0 0 1 12 5a5 5 0 0 1 7.5 7z"/>',
        'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1 1M18 18l1 1M5 19l1-1M18 6l1-1"/>',
        'phone': '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
        'folder': '<path d="M3 6a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v10H3z"/>',
        'arrow': '<path d="M5 12h14M13 6l6 6-6 6"/>',
        'tick': '<path d="m5 12 4 4L19 6"/>',
        'lock': '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
        'plus': '<path d="M12 5v14M5 12h14"/>',
        'close': '<path d="m6 6 12 12M18 6 6 18"/>',
    }
    return f'<svg class="icon {cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{shapes.get(name, shapes["book"])}</svg>'


def buy(location, label=None, secondary=False):
    label = label or U['buy'].replace('{price}', PRICE)
    url = C['checkoutUrl'] or '#checkout-setup'
    lemon = ' lemonsqueezy-button' if C['checkoutUrl'] else ''
    css = 'button button-outline' if secondary else 'button'
    return f'<a class="{css}{lemon}" href="{E(url)}" data-buy="{E(location)}">{E(label)}{icon("arrow")}</a>'


def section_head(key):
    item = C[key]
    return f'<p class="eyebrow">{E(item["eyebrow"])}</p><h2>{E(item["heading"])}</h2>' + (f'<p class="section-intro">{E(item["intro"])}</p>' if item.get('intro') else '')


def launch_line():
    if not C['launchEndDate']:
        return ''
    end = date.fromisoformat(C['launchEndDate'])
    # Never display an expired launch offer.
    if end < date.today():
        raise ValueError('Launch date has passed. Update price and remove the launch date before preparing the site.')
    label = U['launchLine'].replace('{date}', end.strftime('%B %d, %Y').replace(' 0', ' ')).replace('{price}', f"${C['regularPrice']:g}")
    return f'<span>{E(label)}</span> '


def foot(motion=False):
    links = []
    for key, value in [('youtube', C['youtubeUrl']), ('contact', 'mailto:' + C['supportEmail'] if C['supportEmail'] else '')]:
        if value:
            links.append(f'<a href="{E(value)}">{E(U[key])}</a>')
    if motion:
        links.append(f'<button class="motion-toggle" type="button" data-motion-toggle aria-pressed="false" disabled>{E(C["motion"]["pause"])}</button>')
    links += [f'<a href="{key}.html">{E(U[key])}</a>' for key in ('privacy', 'terms', 'refunds')]
    return f'''<footer class="site-footer"><div class="wrap footer-top"><a class="wordmark" href="index.html">{E(C['brand'])}<span class="brand-dot"></span></a><nav aria-label="Footer">{''.join(links)}</nav></div><div class="wrap footer-bottom"><p>{E(U['disclaimer'])}</p><p>{E(U['copyright'].replace('{year}',str(C['copyrightYear'])))}</p></div></footer>'''


def document(title, body, legal=False):
    canonical = f'<link rel="canonical" href="{E(C["siteUrl"].rstrip("/"))}/{"index.html" if not legal else legal + ".html"}">' if C['siteUrl'] else ''
    share = (C['siteUrl'].rstrip('/') + '/' if C['siteUrl'] else '') + 'assets/og-image.png'
    product = {'@context': 'https://schema.org', '@type': 'Product', 'name': C['product'], 'description': C['seo']['description'], 'brand': {'@type': 'Brand', 'name': C['brand']}, 'offers': {'@type': 'Offer', 'price': C['price'], 'priceCurrency': C['currency']}}
    if C['checkoutUrl']:
        product['offers']['url'] = C['checkoutUrl']
        product['offers']['availability'] = 'https://schema.org/InStock'
    schema = '' if legal else '<script type="application/ld+json">' + json.dumps(product, ensure_ascii=False).replace('<','\\u003c') + '</script>'
    stylesheet = '<link rel="stylesheet" href="styles.css">' if legal else '<style>' + (ROOT/'source/sales.css').read_text(encoding='utf-8') + '</style>'
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#FAF7F2"><title>{E(title)}</title><meta name="description" content="{E(C['seo']['description'])}">{canonical}<meta property="og:type" content="website"><meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(C['seo']['description'])}"><meta property="og:image" content="{E(share)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="{E(C['seo']['imageAlt'])}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{E(title)}"><meta name="twitter:description" content="{E(C['seo']['description'])}"><meta name="twitter:image" content="{E(share)}"><link rel="icon" type="image/svg+xml" href="assets/favicon.svg"><link rel="preload" href="assets/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="assets/fonts/libre-caslon-display-latin.woff2" as="font" type="font/woff2" crossorigin>{stylesheet}{schema}<script src="site.js" defer></script>{'<script src="https://app.lemonsqueezy.com/js/lemon.js" defer></script>' if C['checkoutUrl'] else ''}{C['analyticsSnippet']}</head><body><a class="skip-link" href="#main">{E(U['skip'])}</a>{body}</body></html>'''


def make_assets():
    from PIL import Image
    assets=D/'assets';assets.mkdir(parents=True,exist_ok=True)
    shutil.copytree(ROOT/'source/assets/fonts',assets/'fonts',dirs_exist_ok=True)
    for name in ['favicon.svg','og-image.png']:
        shutil.copy2(ROOT/'source/assets/site'/name,assets/name)
    for name,size in [('alicia-shh-v3',(600,900)),('alicia-money-v3',(800,960)),('alicia-desk-v3',(1200,800)),('alicia-puppet-v5',(1280,1280)),('alicia-workbook-v5',(1000,1000))]:
        with Image.open(ROOT/'source/assets'/f'{name}.png') as asset:
            asset.thumbnail(size,Image.Resampling.LANCZOS)
            asset.save(assets/f'{name}.webp',quality=88,method=6)
    for sample in C.get('productSamples',[]):
        relative=Path(sample['image'])
        source=(ROOT/'source'/relative).resolve()
        target=(D/relative).resolve()
        if not source.is_relative_to((ROOT/'source/assets').resolve()) or not target.is_relative_to((D/'assets').resolve()):
            raise ValueError('Product samples must use local assets/ paths.')
        target.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(source,target)


def main():
    D.mkdir(exist_ok=True)
    make_assets()
    (D/'index.html').write_text(render_sales(C,buy,icon,foot,document),encoding='utf-8')
    make_printables(C,D)
    for key,item in C['legal'].items():
        content = ''.join(f'<section><h2>{E(s["title"])}</h2><p>{E(s["body"])}</p></section>' for s in item['sections'])
        body = f'<header class="wrap legal-nav"><a class="wordmark" href="index.html">{E(C["brand"])}</a><a class="text-link" href="index.html">{E(U["back"])}</a></header><main id="main" class="wrap legal-content"><p class="eyebrow">{E(U["previewLabel"])}</p><h1>{E(item["title"])}</h1><aside class="setup-notice">{E(U["legalPlaceholder"])}</aside>{content}</main>' + foot()
        (D/f'{key}.html').write_text(document(item['title']+' | '+C['brand'],body,legal=key),encoding='utf-8')
    shutil.copy2(ROOT/'source/sales.css',D/'styles.css')
    shutil.copy2(ROOT/'source/sales.js',D/'site.js')
    with (D/'site.js').open('a',encoding='utf-8') as client:
        client.write('\n'+(ROOT/'source/character.js').read_text(encoding='utf-8'))
        client.write('\n'+(ROOT/'source/guided.js').read_text(encoding='utf-8'))
    print(f'Ready to preview or deploy: {D}')


if __name__ == '__main__':
    main()
