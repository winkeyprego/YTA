"""Optional authoring sync. Deploy dist/ directly; no runtime or build is required."""
import html
import json
import shutil
from presentation import render_explorer, render_months, render_readers
from experience import render_campaign_hero, render_try_it, render_campaign_note
from motion_sections import render_scroll_story
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
        links.append(f'<a href="{E(value)}">{E(U[key])}</a>' if value else f'<span title="{E(U["unconfigured"])}">{E(U[key])}</span>')
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
    return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#FAF7F2"><title>{E(title)}</title><meta name="description" content="{E(C['seo']['description'])}">{canonical}<meta property="og:type" content="website"><meta property="og:title" content="{E(title)}"><meta property="og:description" content="{E(C['seo']['description'])}"><meta property="og:image" content="{E(share)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="{E(C['seo']['imageAlt'])}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{E(title)}"><meta name="twitter:description" content="{E(C['seo']['description'])}"><meta name="twitter:image" content="{E(share)}"><link rel="icon" type="image/svg+xml" href="assets/favicon.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="preload" href="assets/fonts/dm-sans-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="assets/fonts/libre-caslon-display-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="styles.css">{schema}<script src="site.js" defer></script>{'<script src="https://app.lemonsqueezy.com/js/lemon.js" defer></script>' if C['checkoutUrl'] else ''}{C['analyticsSnippet']}</head><body><a class="skip-link" href="#main">{E(U['skip'])}</a>{body}</body></html>'''


def home():
    h = C['hero']
    pack = C['pack']['items']
    nav = f'''<header class="topbar" id="topbar"><div class="reading-progress" aria-hidden="true"></div><div class="wrap nav-inner"><a class="wordmark" href="#">{E(C['brand'])}<span class="brand-dot"></span></a><div class="nav-actions"><span class="nav-price">{E(PRICE)}</span>{buy('navigation',U['getPlaybook'])}</div></div></header>'''
    hero = render_campaign_hero(C, buy, icon, launch_line())
    trust = f'''<section class="trust-strip"><div class="wrap trust-inner">{''.join(f'<div class="trust-stat"><strong>{E(t["number"])}</strong><span>{E(t["label"])}</span></div>' for t in C['trust'])}<p>{E(U['trustNote'])}</p></div></section>'''
    problem = render_scroll_story(C)
    people = ''.join(f'''<article class="story-card"><div class="story-heading"><span class="story-initial" aria-hidden="true">{E(p['initial'])}</span><div><h3>{E(p['name'])}<span>, {E(p['age'])}</span></h3><p>{E(p['label'])}</p></div></div><dl><div><dt>{E(C['stories']['incomeLabel'])}</dt><dd>{E(p['income'])}</dd></div><div><dt>{E(C['stories']['debtLabel'])}</dt><dd>{E(p['debt'])}</dd></div></dl><p>{E(p['body'])}</p><p class="story-footer">{E(p['footer'])}</p></article>''' for p in C['stories']['people'])
    stories = f'''<section class="stories section-space"><div class="wrap"><div class="center-heading" data-reveal>{section_head('stories')}</div><div class="story-grid" data-reveal>{people}</div><p class="center story-after">{E(C['stories']['after'])}</p></div></section>'''
    cards = ''.join(f'''<article class="resource-card" data-reveal><div class="resource-top">{icon(p['icon'])}<span>{E(U['bonus']) if p.get('bonus') else f'{i+1:02d}'}</span></div><h3>{E(p['name'])}</h3><p>{E(p['body'])}</p></article>''' for i,p in enumerate(pack))
    resources = f'''<section class="wrap section-space" id="the-pack"><div class="split-heading" data-reveal><div>{section_head('pack')}</div><span class="collection-count" aria-hidden="true">11<span> / 11</span></span></div>{render_explorer(C, icon)}<details class="resource-inventory"><summary>{E(U['inventoryLabel'])}<span>{E(U['inventoryHint'])}</span>{icon("plus")}</summary><div class="resource-grid">{cards}<div class="resource-end" data-reveal><span class="end-star" aria-hidden="true">✳</span><p>{E(U['included'])}</p><a class="text-link" href="#pricing">{E(U['getPlaybook'])}{icon('arrow')}</a></div></div></details></section>'''
    months = render_months(C)
    sample_cards = ''.join(f'''<button class="sample-card" data-page="assets/page-{i+1}.webp" data-page-name="{E(s['name'])}" title="{E(U['expandPage'].replace('{name}',s['name']))}"><div class="sample-paper"><img src="assets/page-{i+1}.webp" width="540" height="720" alt="{E(s['kind'])}: {E(s['title'])}. {E(U['previewLabel'])}." loading="lazy"><span class="expand-icon" aria-hidden="true">↗</span></div><span class="sample-label"><span>{i+1:02d} / {E(s['name'])}</span><small>{E(U['previewLabel'])}</small></span></button>''' for i,s in enumerate(C['samples']['items']))
    samples = f'''<section class="samples section-space" id="look-inside"><div class="wrap sample-heading"><div data-reveal>{section_head('samples')}</div><div class="carousel-controls"><button class="circle-button" data-carousel="-1" aria-label="{E(U['previous'])}">{icon('arrow','reverse')}</button><button class="circle-button" data-carousel="1" aria-label="{E(U['next'])}">{icon('arrow')}</button></div></div><div class="wrap sample-invitation"><img data-life src="assets/alicia-workbook-v5.webp" width="1000" height="667" loading="lazy" alt="Alicia opens a workbook and points to a page with a pen."><div><span class="eyebrow">{E(C["characterMoments"]["eyebrow"])}</span><p>{E(C["characterMoments"]["body"])}</p><a class="text-link" href="#sample-pages">{E(C["characterMoments"]["link"])}{icon("arrow")}</a></div></div><div id="sample-pages" class="sample-track" aria-label="{E(C['samples']['heading'])}">{sample_cards}</div><p class="wrap sample-disclaimer">{E(U['sampleNotice'])}</p></section>'''
    readers = render_readers(C, icon)
    note = render_campaign_note(C)
    old_price = f'<s>${C["regularPrice"]:g}</s>' if C['launchEndDate'] else ''
    pricing = f'''<section class="pricing section-space" id="pricing"><div class="wrap"><div class="center-heading" data-reveal>{section_head('pricing')}</div><div class="price-card" data-reveal><div class="price-main"><p class="eyebrow">{E(U['packLabel'])}</p><h3>{E(C['pricing']['name'])}</h3><div class="price-number">{E(PRICE)}{old_price}</div><p>{E(C['pricing']['once'])}</p><p class="micro">{launch_line()}</p>{buy('pricing',U['access'])}<p class="reassurance">{icon('lock')}{E(U['checkoutReassurance'])}</p><p class="education">{E(U['disclaimer'])}</p></div><div class="price-includes"><h4>{E(C['pricing']['includedLabel'])}</h4><ul>{''.join(f'<li>{icon("tick")}{E(p["short"])}</li>' for p in pack)}</ul></div><div class="refund-note">{icon('heart')}<div><h4>{E(C['pricing']['refundHeading'])}</h4><p>{E(C['pricing']['refundBody'])}</p></div></div></div>{f'<aside class="setup-notice" id="checkout-setup"><strong>{E(U["checkoutMissing"])}</strong><p>{E(U["checkoutHelp"])}</p></aside>' if not C['checkoutUrl'] else ''}</div></section>'''
    faq = f'''<section class="wrap faq section-space"><div data-reveal>{section_head('faq')}</div><div class="faq-list">{''.join(f'<details data-faq="{i+1}"><summary>{E(f["q"])}{icon("plus")}</summary><p>{E(f["a"])}</p></details>' for i,f in enumerate(C['faq']['items']))}</div></section>'''
    final = f'''<section class="final-cta section-space"><div class="wrap" data-reveal><p class="eyebrow">{E(C['final']['eyebrow'])}</p><h2>{E(C['final']['heading'])}</h2>{buy('final')}<p class="micro">{E(U['delivery'])}</p></div></section>'''
    action = E(C['emailFormAction']) if C['emailFormAction'] else '#newsletter-status'
    free = f'''<section class="wrap free-section section-space"><div><h2>{E(C['free']['heading'])}</h2><p>{E(C['free']['body'])}</p></div><form class="email-form" method="post" action="{action}" data-configured="{str(bool(C['emailFormAction'])).lower()}"><label for="email">{E(U['emailLabel'])}</label><div class="email-controls"><input type="email" id="email" name="{E(C['emailFieldName'])}" placeholder="{E(U['emailPlaceholder'])}" autocomplete="email" required{' disabled' if not C['emailFormAction'] else ''}><button class="button" type="submit"{' disabled' if not C['emailFormAction'] else ''}>{E(U['emailButton'])}{icon('arrow')}</button></div><p class="micro" id="newsletter-status" role="status">{E(U['emailPrivacy'] if C['emailFormAction'] else U['emailMissing'])}</p></form></section>'''
    dialog = f'''<dialog class="lightbox" aria-labelledby="preview-title"><div class="lightbox-toolbar"><h2 id="preview-title"></h2><button class="circle-button" data-close aria-label="{E(U['close'])}">{icon('close')}</button></div><img width="540" height="720" alt="{E(U['sampleNotice'])}"><p>{E(U['sampleNotice'])}</p></dialog>'''
    config = {'checkoutUrl': C['checkoutUrl'], 'emailSubmitting': U['emailSubmitting'], 'explorer': C['pack']['explorer']['tabs'], 'readerDescriptions': C['readers']['descriptions'], 'tryIt': C['tryIt'], 'motion': C['motion']}
    data = '<script id="site-config" type="application/json">' + json.dumps(config).replace('<','\\u003c') + '</script>'
    preview = f'<div class="preview-banner">{E(U["previewNotice"])}</div>' if not C['checkoutUrl'] else ''
    return document(C['seo']['title'], nav + '<main id="main">' + hero + trust + problem + stories + render_try_it(C, icon) + resources + months + samples + readers + note + pricing + faq + final + free + '</main>' + foot(True) + preview + dialog + data)


def make_assets():
    assets = D / 'assets'
    assets.mkdir(parents=True, exist_ok=True)
    for i,s in enumerate(C['samples']['items']):
        rows = ''.join(f'<rect x="58" y="{280+j*24}" width="{[416,388,416,343,404,372][j%6]}" height="5" rx="2" fill="#d8d4cb"/>' for j in range(12))
        if i in (1,5):
            rows = '<rect x="58" y="275" width="424" height="276" rx="4" fill="#f4f2ec"/>' + ''.join(f'<path d="M58 {310+j*40}h424" stroke="#d7d9d2"/>' for j in range(6)) + ''.join(f'<path d="M{58+j*106} 275v276" stroke="#d7d9d2"/>' for j in range(5)) + '<rect x="270" y="435" width="106" height="40" fill="#d5dfd1"/>'
        elif i in (2,4):
            rows = ''.join(f'<rect x="58" y="{282+j*46}" width="14" height="14" rx="2" fill="none" stroke="#8fa58b"/><rect x="88" y="{287+j*46}" width="{[322,300,338,269,320][j]}" height="5" rx="2" fill="#d8d4cb"/>' for j in range(5))
        elif i == 3:
            rows = '<rect x="58" y="280" width="424" height="235" rx="6" fill="#f0eee6"/><text x="82" y="330" font-family="Georgia,serif" font-size="64" fill="#c9a54b">“</text>' + ''.join(f'<rect x="88" y="{356+j*24}" width="{[320,300,313,249][j]}" height="5" rx="2" fill="#c6c4ba"/>' for j in range(4))
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="540" height="720" viewBox="0 0 540 720"><rect width="540" height="720" fill="#fffdf7"/><path d="M58 82h424" stroke="#c9a54b"/><text x="58" y="61" font-family="Arial,sans-serif" font-size="10" letter-spacing="2" fill="#6a6e68">{E(s['footer'])}</text><text x="58" y="138" font-family="Georgia,serif" font-size="14" fill="#9a8039">{i+1:02d} / {E(s['kind'].upper())}</text><foreignObject x="58" y="165" width="424" height="86"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Georgia,serif;font-size:34px;line-height:1.15;color:#1b2a41">{E(s['title'])}</div></foreignObject>{rows}<text x="58" y="602" font-family="Arial,sans-serif" font-size="12" fill="#5b655f">{E(s['subtitle'])}</text><path d="M58 640h424" stroke="#d8d4cb"/><text x="58" y="666" font-family="Arial,sans-serif" font-size="9" letter-spacing="2" fill="#777d73">{E(U['previewLabel'].upper())} / {E(C['brand'].upper())}</text><text x="477" y="666" font-family="Georgia,serif" font-size="13" text-anchor="end" fill="#1b2a41">{i+1}</text></svg>'''
        (assets / f'page-{i+1}.svg').write_text(svg,encoding='utf-8')
    (assets/'favicon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#1b2a41"/><text x="14" y="46" font-family="Georgia,serif" font-size="49" fill="#faf7f2">a<tspan fill="#c9a54b">.</tspan></text></svg>',encoding='utf-8')
    (assets/'og-image.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#faf7f2"/><rect x="800" width="400" height="630" fill="#1b2a41"/><path d="M80 120h80M80 510h630" stroke="#c9a54b" stroke-width="2"/><text x="80" y="170" font-family="Arial,sans-serif" font-size="20" letter-spacing="4" fill="#687161">{E(C["brand"].upper())}</text><text x="80" y="305" font-family="Georgia,serif" font-size="76" fill="#1b2a41">The Quiet Wealth</text><text x="80" y="395" font-family="Georgia,serif" font-size="86" font-style="italic" fill="#1b2a41">Playbook.</text><text x="80" y="465" font-family="Arial,sans-serif" font-size="25" fill="#596156">{E(C["slogan"])}</text><text x="950" y="375" font-family="Georgia,serif" font-size="190" fill="#c9a54b">a.</text></svg>',encoding='utf-8')
    shutil.copy2(ROOT/'source/assets/alicia-reference.jpg', assets/'alicia-reference.jpg')
    for name, size in [('alicia-shh-v3',(800,1200)),('alicia-money-v3',(800,960)),('alicia-desk-v3',(1200,800)),('alicia-puppet-v5',(1280,1280)),('alicia-workbook-v5',(1000,1000))]:
        from PIL import Image
        with Image.open(ROOT/'source/assets'/f'{name}.png') as asset:
            asset.thumbnail(size,Image.Resampling.LANCZOS)
            asset.save(assets/f'{name}.webp',quality=88,method=6)
    make_raster_assets(assets)


def make_raster_assets(assets):
    from PIL import Image, ImageDraw, ImageFont
    def font(size, serif=False):
        choices = [Path('C:/Windows/Fonts/georgia.ttf' if serif else 'C:/Windows/Fonts/arial.ttf'),
                   Path('/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf' if serif else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')]
        for choice in choices:
            if choice.exists():
                return ImageFont.truetype(str(choice),size)
        return ImageFont.load_default(size=size)

    def wrapped(draw, text, at, width, face, color, leading):
        line, y = '', at[1]
        for word in text.split():
            trial = f'{line} {word}'.strip()
            if draw.textlength(trial,font=face)>width and line:
                draw.text((at[0],y),line,font=face,fill=color)
                line, y = word, y+leading
            else:
                line = trial
        draw.text((at[0],y),line,font=face,fill=color)

    for i,s in enumerate(C['samples']['items']):
        image=Image.new('RGB',(540,720),'#fffdf7'); draw=ImageDraw.Draw(image)
        draw.text((58,48),s['footer'],font=font(10),fill='#66705f')
        draw.line((58,82,482,82),fill='#c9a54b')
        draw.text((58,123),f'{i+1:02d} / '+s['kind'].upper(),font=font(12),fill='#806a2f')
        wrapped(draw,s['title'],(58,168),424,font(33,True),'#1b2a41',41)
        if i in (1,5):
            draw.rounded_rectangle((58,275,482,551),radius=4,fill='#f4f2ec')
            for j in range(6):draw.line((58,310+j*40,482,310+j*40),fill='#d7d9d2')
            for j in range(5):draw.line((58+j*106,275,58+j*106,551),fill='#d7d9d2')
            draw.rectangle((271,436,375,474),fill='#d5dfd1')
        elif i in (2,4):
            for j,width in enumerate([322,300,338,269,320]):
                draw.rectangle((58,282+j*46,72,296+j*46),outline='#8fa58b')
                draw.rounded_rectangle((88,287+j*46,88+width,292+j*46),radius=2,fill='#d8d4cb')
        elif i==3:
            draw.rounded_rectangle((58,280,482,515),radius=6,fill='#f0eee6')
            draw.text((82,286),'“',font=font(64,True),fill='#aa8b40')
            for j,width in enumerate([320,300,313,249]):draw.rounded_rectangle((88,356+j*24,88+width,361+j*24),radius=2,fill='#c6c4ba')
        else:
            for j in range(12):draw.rounded_rectangle((58,280+j*24,58+[416,388,416,343,404,372][j%6],285+j*24),radius=2,fill='#d8d4cb')
        wrapped(draw,s['subtitle'],(58,590),424,font(12),'#5b655f',18)
        draw.line((58,640,482,640),fill='#d8d4cb')
        draw.text((58,657),U['previewLabel'].upper()+' / '+C['brand'].upper(),font=font(9),fill='#687060')
        draw.text((468,657),str(i+1),font=font(13,True),fill='#1b2a41')
        image.save(assets/f'page-{i+1}.webp',quality=87,method=6)
    image=Image.new('RGB',(1200,630),'#faf7f2');draw=ImageDraw.Draw(image)
    draw.rectangle((820,0,1200,630),fill='#1b2a41')
    draw.line((70,110,150,110),fill='#c9a54b',width=2)
    draw.text((70,145),C['brand'].upper(),font=font(20),fill='#65705d')
    draw.text((70,248),C['hero']['headlineTop'],font=font(69,True),fill='#1b2a41')
    draw.text((70,333),C['hero']['headlineBottom']+'.',font=font(83,True),fill='#1b2a41')
    draw.text((70,455),C['slogan'],font=font(24),fill='#596156')
    draw.line((70,520,735,520),fill='#c9a54b',width=2)
    draw.text((911,205),'a.',font=font(180,True),fill='#c9a54b')
    image.save(assets/'og-image.png',optimize=True)


def main():
    D.mkdir(exist_ok=True)
    make_assets()
    (D/'index.html').write_text(home(),encoding='utf-8')
    for key,item in C['legal'].items():
        content = ''.join(f'<section><h2>{E(s["title"])}</h2><p>{E(s["body"])}</p></section>' for s in item['sections'])
        body = f'<header class="wrap legal-nav"><a class="wordmark" href="index.html">{E(C["brand"])}</a><a class="text-link" href="index.html">{E(U["back"])}</a></header><main id="main" class="wrap legal-content"><p class="eyebrow">{E(U["previewLabel"])}</p><h1>{E(item["title"])}</h1><aside class="setup-notice">{E(U["legalPlaceholder"])}</aside>{content}</main>' + foot()
        (D/f'{key}.html').write_text(document(item['title']+' | '+C['brand'],body,legal=key),encoding='utf-8')
    for name in ('styles.css','site.js'):
        shutil.copy2(ROOT/'source'/name,D/name)
    with (D/'styles.css').open('a',encoding='utf-8') as css:
        css.write('\n'+(ROOT/'source/editorial.css').read_text(encoding='utf-8'))
        css.write('\n'+(ROOT/'source/campaign.css').read_text(encoding='utf-8'))
        css.write('\n'+(ROOT/'source/atelier.css').read_text(encoding='utf-8'))
        css.write('\n'+(ROOT/'source/alive.css').read_text(encoding='utf-8'))
    with (D/'site.js').open('a',encoding='utf-8') as client:
        client.write('\n'+(ROOT/'source/motion.js').read_text(encoding='utf-8'))
        client.write('\n'+(ROOT/'source/character.js').read_text(encoding='utf-8'))
    print(f'Ready to preview or deploy: {D}')


if __name__ == '__main__':
    main()
