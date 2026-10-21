"""Edition 9: the editorial Alicia-led page. Copy lives in content.json; prepare.py calls render()."""
import json
from html import escape as e
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent


def art(name, alt, cls='', life=True, eager=False):
    """An optimized illustration from dist/assets, sized from the file prepare.py just wrote."""
    with Image.open(ROOT / 'dist/assets' / f'{name}.webp') as im:
        w, h = im.size
    alt_attr = f'alt="{e(alt)}"' if alt else 'alt="" aria-hidden="true"'
    loading = 'fetchpriority="high"' if eager else 'loading="lazy"'
    return f'<img class="{cls}"{" data-life" if life else ""} src="assets/{name}.webp" width="{w}" height="{h}" {loading} decoding="async" {alt_attr}>'


def signature():
    """Alicia's signature: the script name plus a flourish that draws itself when motion is on."""
    return (ROOT / 'source/assets/site/alicia-signature.svg').read_text(encoding='utf-8').strip()


def book(c, s, interactive=False):
    """The concept cover as a 3D object. The hero copy can open it to a contents page."""
    contents = ''.join(f'<li><span>{i+1:02d}</span>{e(title)}</li>' for i, title in enumerate(c['months']['items']))
    inside = f'''<div class="book-inside" aria-hidden="true"><p class="book-inside-kicker">Contents</p><ol>{contents}</ol></div>''' if interactive else ''
    return f'''<div class="book{' book-hero' if interactive else ''}" data-book role="img" aria-label="{e(s['coverAlt'])}"><div class="book-body">{inside}<div class="book-pages" aria-hidden="true"></div><div class="book-spine" aria-hidden="true"></div><div class="book-cover" aria-hidden="true"><span class="book-kicker">{e(c['slogan'])}</span><strong>The Quiet<br>Wealth<br><em>Playbook.</em></strong><span class="book-rule"><i></i><i></i><i></i></span><span class="book-foot">{e(s['coverBottom'])}</span><span class="book-byline">{e(c['brand'])}</span></div></div></div>'''


def seal(text):
    """Circular label that slowly turns around a small monogram."""
    return f'''<svg class="seal" data-life viewBox="0 0 120 120" aria-hidden="true"><defs><path id="seal-path" d="M60 60m-46 0a46 46 0 1 1 92 0a46 46 0 1 1-92 0"/></defs><circle cx="60" cy="60" r="58"/><g class="seal-ring"><text><textPath href="#seal-path" textLength="286">{e(text)}</textPath></text></g><text class="seal-mark" x="60" y="70" text-anchor="middle">A</text></svg>'''


def render(c, buy, icon, foot, document):
    s = c['sales']
    u = c['ui']
    price = f"${c['price']:g}"
    head = lambda eyebrow, title, body='': f'<p class="eyebrow">{e(eyebrow)}</p><h2>{e(title)}</h2>' + (f'<p class="intro">{e(body)}</p>' if body else '')

    nav = f'''<header class="topbar"><div class="wrap nav-inner"><a class="wordmark" href="#hero">{e(c['brand'])}<span>.</span></a><nav aria-label="Main navigation"><a href="#check-up">Check-up</a><a href="#the-approach">Alicia’s approach</a><a href="#the-pack">Inside</a><a href="#chapters">The chapters</a><span class="nav-price">{price}</span>{buy('navigation', u['getPlaybook'])}</nav></div><span class="read-progress" data-progress aria-hidden="true"></span></header>'''

    hero_buy = buy('hero').replace('class="button"', 'class="text-link hero-purchase"')
    hero = f'''<section class="hero" id="hero"><div class="wrap hero-grid"><div class="hero-copy"><p class="eyebrow">{e(s['productLabel'])}</p><h1><span class="line">{e(s['heroHeadline'])}</span> <em class="line">{e(s['heroEmphasis'])}</em></h1><p class="hero-lede">{e(c['hero']['lede'])}</p><p class="hero-support">{e(c['hero']['support'])}</p><div class="hero-actions"><a class="button" href="#the-approach">{e(s['heroSecondary'])}{icon('arrow')}</a>{hero_buy}</div><p class="hero-invite">{e(s['heroInvitation'])} <a href="#check-up">{e(s['heroCheckup'])}</a></p></div><div class="hero-stage" data-tilt-area><div class="arch" aria-hidden="true"><span class="arch-glow"></span></div><img class="hero-alicia" data-life src="assets/alicia-shh-v3.webp" width="600" height="900" fetchpriority="high" decoding="async" alt="{e(c['hero']['portraitAlt'])}">{book(c, s, interactive=True)}<button class="book-toggle" type="button" data-book-toggle aria-pressed="false"><span data-open-label>Open the cover</span><span data-close-label hidden>Close the cover</span></button>{seal('THE BORING MONEY SYSTEM · ONE PAYMENT · ' + price + ' · ')}<p class="handnote">{e(s['heroHandnote'])}<svg viewBox="0 0 220 14" aria-hidden="true"><path d="M3 9c40-6 92-8 140-4 26 2 50 2 74-2"/></svg></p><p class="stage-caption">{e(s['coverNote'])}</p></div></div></section>'''

    ribbon_items = ''.join(f'<span>{e(t)}</span>' for t in c['months']['items'])
    ribbon = f'''<div class="ribbon" aria-hidden="true"><div class="ribbon-track" data-life>{ribbon_items}{ribbon_items}</div></div><p class="sr-only">{e(s['trustLine'])}</p>'''

    story = c['scrollStory']
    poses = ''.join(f'<img class="pose{" is-active" if i == 0 else ""} pose-{i}" data-conversation-pose="{i}" {"src" if i == 0 else "data-src"}="{e(x["image"])}" width="{x["width"]}" height="{x["height"]}" loading="lazy" alt="" aria-hidden="true">' for i, x in enumerate(story['steps']))
    steps = ''.join(f'<article class="talk-step{" is-current" if i == 0 else ""}" data-conversation-step="{i}" data-pose-alt="{e(x["alt"])}"><p class="talk-number" aria-hidden="true">{i+1:02d}</p><p class="eyebrow">{e(x["label"])}</p><h3>{e(x["heading"])}</h3><p>{e(x["body"])}</p></article>' for i, x in enumerate(story['steps']))
    approach = f'''<section class="talk" id="the-approach" data-step="0"><div class="wrap"><div class="talk-head">{head(story['eyebrow'], story['heading'], story['intro'])}</div><div class="talk-grid"><div class="talk-stage"><div class="talk-window" role="img" aria-label="{e(story['steps'][0]['alt'])}"><span class="talk-big" data-conversation-number aria-hidden="true">01</span><div class="talk-poses" data-life>{poses}</div></div><p class="talk-caption">{e(story['caption'])}</p><div class="talk-meter" aria-hidden="true"><i data-meter></i></div></div><div class="talk-steps">{steps}<a class="text-link" href="#the-pack">{e(c['hero']['explore'])}{icon('arrow')}</a></div></div></div></section>'''

    tones = ['navy', 'cream', 'sage']
    volumes = ''.join(f'<article class="volume volume-{tones[i]}" tabindex="0"><div class="volume-face"><p class="volume-label">{e(x["detail"])}</p><h3>{e(x["title"])}</h3><p>{e(x["body"])}</p><p class="volume-metric">{e(x["metric"])}</p></div></article>' for i, x in enumerate(s['core']))
    bonus_tag = f'<span class="tile-tag">{e(u["bonus"])}</span>'
    tiles = ''.join(f'<li class="tile{" tile-bonus" if x.get("bonus") else ""}">{icon(x.get("icon", "book"))}<div><h4>{e(x["name"])}</h4><p>{e(x["body"])}</p></div>{bonus_tag if x.get("bonus") else ""}</li>' for x in c['pack']['items'])
    compare = ''.join(f'<li><strong>{e(x["topic"])}</strong><span>{e(x["channel"])}</span><span>{e(x["pack"])}</span></li>' for x in s['comparison'])
    pack = f'''<section class="pack section" id="the-pack"><div class="wrap"><div class="pack-head"><div class="section-head">{head(c['pack']['eyebrow'], s['packHeading'], s['packIntro'])}</div>{art('alicia-present-a', 'Alicia gesturing toward the collection with an open hand.', 'pack-art')}</div><div class="shelf">{volumes}</div><div class="index-head"><h3>{e(s['inventoryTitle'])}</h3><p>{icon('folder')}{e(s['formats'])}</p></div><ul class="tiles">{tiles}</ul><details class="compare"><summary>{e(s['differenceTitle'])}{icon('plus')}</summary><p>{e(s['differenceIntro'])}</p><ul class="compare-rows"><li class="compare-label"><span></span><span>{e(s['channelColumn'])}</span><span>{e(s['packColumn'])}</span></li>{compare}</ul></details></div></section>'''

    L = c['leakHunt']
    chips = ''.join(f'<div class="leak-group"><p>{e(group)}</p><div class="leak-chips">' + ''.join(f'<button class="leak-chip" type="button" data-leak-item data-name="{e(name)}" data-amount="{amount}" data-frequency="{e(freq)}" aria-pressed="false">{e(name)}</button>' for name, amount, freq in items) + '</div></div>' for group, items in L['groups'])
    tool = f'''<section class="leak section" id="try-it"><div class="wrap leak-grid"><div class="leak-side"><div class="section-head">{head(s['starterEyebrow'], L['heading'], L['intro'])}</div><figure class="alicia-says">{art('alicia-present-b', 'Alicia gesturing toward the Leak Hunt with an open hand.')}<figcaption class="bubble" data-leak-bubble aria-hidden="true">{e(L['empty'])}</figcaption></figure></div><div class="leak-card" data-leak-hunt><div class="leak-library"><p class="leak-label">{e(L['libraryTitle'])} <small>{e(L['amountsNote'])}</small></p>{chips}</div><div class="leak-list-head"><p class="leak-label">{e(L['yourList'])}</p><p class="tool-example">{e(L['exampleNote'])}</p></div><ul class="leak-list" data-leak-list></ul><button class="leak-add" type="button" data-leak-add>{icon('plus')}{e(L['addOwn'])}</button><div class="leak-hourly"><label for="leak-hourly">{e(L['hourly'])}</label><div class="dollar-input"><span aria-hidden="true">$</span><input id="leak-hourly" data-leak-hourly type="number" min="0" max="10000" step="0.01" inputmode="decimal" placeholder="25"></div></div><div class="leak-results" aria-live="polite"><div class="leak-total"><span>{e(L['yearTotal'])}</span><output data-leak-total>$0</output><small data-leak-monthly></small><small data-leak-hours></small></div><div class="leak-bar" data-leak-bar aria-hidden="true"><i class="bar-keep"></i><i class="bar-call"></i><i class="bar-cancel"></i></div><div class="leak-split"><div class="split-call"><span>{e(L['callTotal'])}</span><output data-leak-call>$0</output></div><div class="split-cancel"><span>{e(L['cancelTotal'])}</span><output data-leak-cancel>$0</output></div></div><p class="fine-print">{e(L['note'])}</p></div><div class="leak-plan-wrap"><h4>{e(L['planTitle'])}</h4><ol class="leak-plan" data-leak-plan></ol></div><div class="tool-footer"><div><button class="button" type="button" data-leak-print>{e(L['print'])}{icon('arrow')}</button><button class="text-link leak-download" type="button" data-leak-download>{e(L['download'])}</button></div><p>{e(s['demoPrivacy'])}</p></div><p class="tool-status" role="status" data-leak-status></p><noscript><p class="fine-print">{e(L['noJs'])} <a href="starter-worksheet.html">{e(s['freeLink'])}</a></p></noscript></div></div><div class="wrap"><p class="fine-print">{e(s['demoNotice'])}</p></div></section>'''

    k = c['checkup']
    questions = ''.join(f'<fieldset class="checkup-q" data-question="{q["id"]}"><legend><span>{i+1:02d}</span>{e(q["q"])}</legend><div class="checkup-options">' + ''.join(f'<label class="checkup-option"><input type="radio" name="{q["id"]}" value="{e(value)}"><span>{e(label)}</span></label>' for value, label in q['options']) + '</div></fieldset>' for i, q in enumerate(k['questions']))
    gets = ''.join(f'<li>{icon(name)}{e(text)}</li>' for name, text in [('compass', 'Where you are right now'), ('check', 'Three next steps'), ('book', 'Chapters to start with'), ('folder', 'A plan you can print')])
    checkup = f'''<section class="checkup section" id="check-up" data-checkup><div class="wrap checkup-grid"><div class="checkup-side"><div class="section-head">{head(k['eyebrow'], k['heading'], k['intro'])}</div><figure class="checkup-alicia">{art('alicia-portrait', 'Alicia smiling.', 'checkup-avatar', life=False)}<figcaption class="bubble">{e(k['aliciaNote'])}</figcaption></figure></div><div class="checkup-card"><div class="checkup-top"><span class="checkup-count" data-checkup-count aria-live="polite"></span><div class="checkup-bar" data-checkup-bar aria-hidden="true"><i></i></div></div><div class="checkup-intro" data-checkup-intro><p class="leak-label">What you’ll get</p><ul class="checkup-gets">{gets}</ul><button class="button" type="button" data-checkup-start>{e(k['start'])}{icon('arrow')}</button><noscript><p class="fine-print">{e(k['noJs'])} <a href="starter-worksheet.html">{e(s['freeLink'])}</a></p></noscript></div><form class="checkup-form" novalidate>{questions}<div class="checkup-nav"><button class="checkup-back" type="button" data-checkup-back hidden>{icon('arrow', 'flip')}{e(k['back'])}</button><button class="checkup-next" type="button" data-checkup-next hidden>Next{icon('arrow')}</button></div></form><div class="checkup-result" data-checkup-result hidden></div></div></div></section>'''

    tab_icons = ['grid', 'message', 'check']
    tabs = ''.join(f'<button type="button" role="tab" id="sheet-tab-{i}" aria-controls="sheet-{i}" aria-selected="{str(i == 0).lower()}" data-sheet-tab="{i}"{"" if i == 0 else ' tabindex="-1"'}>{icon(tab_icons[i])}<span><small>{e(x["number"])} / {e(x["tag"])}</small>{e(x["title"])}</span></button>' for i, x in enumerate(s['examples']))
    sheets = ''.join(f'''<article class="sheet{" is-front" if i == 0 else ""}" id="sheet-{i}" role="tabpanel" aria-labelledby="sheet-tab-{i}" data-sheet="{i}"><p class="sheet-kicker">{e(s['printBrand'])}</p><h3>{e(x['title'])}</h3><p class="sheet-intro">{e(x['intro'])}</p>{f'<blockquote>{e(x["quote"])}</blockquote>' if x.get('quote') else ''}<ol>{''.join(f'<li>{e(t)}</li>' for t in x['steps'])}</ol><p class="sheet-foot">{e(x['footer'])}</p><a class="text-link" href="{e(x['slug'])}.html">{e(s['printLabel'])}{icon('arrow')}</a></article>''' for i, x in enumerate(s['examples']))
    samples = f'''<section class="samples section" id="look-inside"><div class="wrap samples-grid"><div><div class="section-head">{head(s['samplesEyebrow'], s['samplesHeading'], s['samplesIntro'])}</div><div class="sheet-tabs" role="tablist" aria-label="Website examples">{tabs}</div><p class="fine-print">{e(s['sampleDisclosure'])}</p></div><div class="sheet-stack" id="sample-pages">{sheets}</div></div></section>'''
    if c.get('productSamples'):
        actual = ''.join(f'<article class="finished-sample"><a href="{e(x["image"])}"><img src="{e(x["image"])}" width="{int(x["width"])}" height="{int(x["height"])}" alt="{e(x["alt"])}" loading="lazy"></a><h3>{e(x["title"])}</h3><p>{e(x["description"])}</p></article>' for x in c['productSamples'])
        samples = f'<section class="section wrap" id="product-samples"><div class="section-head">{head(c["samples"]["eyebrow"], c["samples"]["heading"], c["samples"]["intro"])}</div><div class="finished-grid">{actual}</div></section>' + samples

    path = ''.join(f'<li><span class="path-number">{i+1:02d}</span><h3>{e(x["title"])}</h3><p>{e(x["body"])}</p></li>' for i, x in enumerate(s['startSteps']))
    people = ''.join(f'<article class="person"><span class="monogram" aria-hidden="true">{e(x["initial"])}</span><div><h4>{e(x["name"])}, {e(x["age"])}</h4><p class="person-label">{e(x["label"])}</p></div><dl><div><dt>{e(c["stories"]["incomeLabel"])}</dt><dd>{e(x["income"])}</dd></div><div><dt>{e(c["stories"]["debtLabel"])}</dt><dd>{e(x["debt"])}</dd></div></dl><p>{e(x["body"])}</p></article>' for x in c['stories']['people'])
    how = f'''<section class="begin section" id="how-it-works"><div class="wrap"><div class="begin-head"><div class="section-head">{head(s['howEyebrow'], s['startHeading'], s['startIntro'])}</div>{art('alicia-laptop', 'Alicia sitting on a stool with a laptop and a cup of coffee.', 'begin-art')}</div><ol class="path">{path}</ol><div class="people"><div class="people-head"><p class="eyebrow">{e(c['stories']['eyebrow'])}</p><h3>{e(c['conversationJourney']['storiesHeading'])}</h3><p class="fine-print">{e(c['stories']['after'])}</p></div>{people}</div></div></section>'''

    m = c['months']
    j = c['conversationJourney']
    dial = ''.join(f'<button type="button" class="dial-month{" is-active" if i == 0 else ""}" style="--i:{i}" data-month="{i+1}" aria-pressed="{str(i == 0).lower()}" aria-label="Chapter {i+1}: {e(t)}">{i+1:02d}</button>' for i, t in enumerate(m['items']))
    chapter_list = ''.join(f'<li><strong>{i+1:02d} {e(t)}</strong> {e(m["descriptions"][i])}</li>' for i, t in enumerate(m['items']))
    chapters = f'''<section class="year section" id="chapters"><div class="wrap year-grid"><div class="year-copy">{head(j['eyebrow'], j['heading'], j['intro'])}<div class="chapter-card" aria-live="polite"><p class="chapter-kicker">Chapter <span data-chapter-number>01</span> of 12</p><h3 data-chapter-title>{e(m['items'][0])}</h3><p data-chapter-body>{e(m['descriptions'][0])}</p><div class="chapter-steps"><button type="button" data-chapter-step="-1" aria-label="Previous chapter">{icon('arrow', 'flip')}</button><button type="button" data-chapter-step="1" aria-label="Next chapter">{icon('arrow')}</button></div></div><p class="year-caption">{e(j['caption'])}</p></div><div class="dial" role="group" aria-label="{e(j['hint'])}"><svg class="dial-ring" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="88"/><circle class="dial-arc" data-dial-arc cx="100" cy="100" r="88" pathLength="12"/></svg><div class="dial-centre" aria-hidden="true"><span data-month-current>01</span><small>of 12</small></div>{dial}</div></div><noscript><div class="wrap"><ol class="chapter-list">{chapter_list}</ol></div></noscript></section>'''

    r = c['readers']
    reader_buttons = ''.join(f'<button type="button" data-reader="{i}" aria-pressed="{str(i == 0).lower()}" aria-controls="reader-description">{e(x)}</button>' for i, x in enumerate(r['items']))
    fallback = ''.join(f'<li><strong>{e(x)}</strong> {e(r["descriptions"][i])}</li>' for i, x in enumerate(r['items']))
    readers = f'''<section class="readers section" id="your-situation"><div class="wrap readers-grid"><div class="readers-copy">{head(j['readersEyebrow'], j['readersHeading'], j['readersIntro'])}<div class="reader-buttons" role="group" aria-label="{e(r['selectLabel'])}">{reader_buttons}</div><p class="fine-print">{e(j['readersFoot'])}</p><noscript><ul class="chapter-list">{fallback}</ul></noscript></div><figure class="readers-art"><p id="reader-description" class="bubble bubble-large" aria-live="polite">{e(r['descriptions'][0])}</p>{art('alicia-thinking', 'Alicia with a hand at her chin, thinking it through.')}</figure></div></section>'''

    note = f'''<section class="letter-section" aria-labelledby="note-heading">{art('scene-kitchen-morning', '', 'letter-scene', life=False)}<div class="wrap letter-grid"><article class="letter"><p class="eyebrow" id="note-heading">{e(c['note']['eyebrow'])}</p><blockquote>{e(c['note']['body'])}</blockquote><div class="signature-row">{art('alicia-portrait', 'Alicia smiling.', 'letter-avatar', life=False)}<p class="signature" data-signature>{signature()}</p></div><span class="wax" aria-hidden="true">A</span></article></div></section>'''

    cm = c.get('comments', {})
    items = cm.get('items', [])
    comments = ''
    if items:
        featured = next((x for x in items if x.get('featured')), None)
        rest = [x for x in items if x is not featured]

        def card(i, x):
            initial = (x['handle'].lstrip('@')[:1] or 'A').upper()
            title = f'{cm["videoLabel"]} {x["video"]}' if x.get('video') else cm['noVideo']
            video = f'<a href="{e(x["url"])}">{e(title)}</a>' if x.get('url') else e(title)
            likes = f'<p class="comment-likes">{icon("thumb")}{e(str(x["likes"]))}</p>' if x.get('likes') else ''
            return f'<article class="comment{" is-extra" if i >= 6 else ""}" data-comment><header><span class="comment-avatar tone-{i % 3}" aria-hidden="true">{e(initial)}</span><div><p class="comment-handle">{e(x["handle"])}</p><p class="comment-video">{video}</p></div></header><p class="comment-text">{e(x["text"])}</p>{likes}</article>'
        if featured:
            where = f'{cm["videoLabel"]} {featured["video"]}' if featured.get('video') else cm['noVideo']
            long = ' is-long' if len(featured['text']) > 260 else ''
            feature = f'<figure class="comment-feature{long}" data-comment><blockquote>{e(featured["text"])}</blockquote><figcaption>{e(featured["handle"])} · {e(where)}</figcaption></figure>'
        else:
            feature = ''
        more = f'<button class="comment-more" type="button" data-comments-more aria-expanded="false" hidden data-more="{e(cm["more"])}" data-less="{e(cm["less"])}">{e(cm["more"])}</button>' if len(rest) > 6 else ''
        comments = f'''<section class="comments section" id="comments"><div class="wrap"><div class="comments-head">{art('alicia-portrait', '', 'comments-avatar', life=False)}<div class="section-head">{head(cm['eyebrow'], cm['heading'], cm['intro'])}</div></div>{feature}<div class="comment-wall">{''.join(card(i, x) for i, x in enumerate(rest))}</div>{more}<p class="fine-print">{e(cm['disclosure'])}</p></div></section>'''

    includes = ''.join(f'<li>{icon("tick")}{e(x["short"])}</li>' for x in c['pack']['items'])
    notice = f'<aside class="setup-notice" id="checkout-setup"><strong>{e(u["checkoutMissing"])}</strong><p>{e(s["offerPreview"])}</p></aside>' if not c['checkoutUrl'] else ''
    pricing = f'''<section class="offer section" id="pricing"><div class="wrap"><div class="section-head centered">{head(c['pricing']['eyebrow'], c['pricing']['heading'])}</div><div class="offer-card"><div class="offer-object"><figure class="held-book">{art('alicia-book-front', 'Alicia holding The Quiet Wealth Playbook. The cover is a concept.')}<div class="held-cover" aria-hidden="true"><span class="book-kicker">{e(c['slogan'])}</span><strong>The Quiet<br>Wealth<br><em>Playbook.</em></strong><span class="book-rule"><i></i><i></i><i></i></span><span class="book-byline">{e(c['brand'])}</span></div></figure><p class="offer-object-note">{e(s['coverNote'])}</p></div><div class="offer-main"><p class="eyebrow">{e(u['packLabel'])}</p><h3>{e(c['pricing']['name'])}</h3><p class="offer-price"><span>{price}</span><small>USD<br>{e(c['pricing']['once'])}</small></p>{buy('pricing', u['access'])}<p class="offer-guarantee">{icon('heart')}{e(u['refundBadge'])}</p><p class="education">{e(u['disclaimer'])}</p></div><div class="offer-includes"><h4>{e(c['pricing']['includedLabel'])}</h4><ul>{includes}</ul></div></div><div class="refund-line"><strong>{e(c['pricing']['refundHeading'])}</strong><p>{e(c['pricing']['refundBody'])}</p></div>{notice}</div></section>'''

    faq_items = ''.join(f'<details data-faq="{i+1}"><summary>{e(x["q"])}{icon("plus")}</summary><p>{e(x["a"])}</p></details>' for i, x in enumerate(c['faq']['items']))
    faq = f'''<section class="faq section" id="questions"><div class="wrap faq-grid"><div>{head(c['faq']['eyebrow'], c['faq']['heading'])}</div><div class="faq-list">{faq_items}</div></div></section>'''

    free_link = f'''<div class="finale-free"><p><strong>{e(s['freeHeading'])}</strong> {e(s['freeBody'])}</p><a class="text-link" href="starter-worksheet.html">{e(s['freeLink'])}{icon('arrow')}</a></div>'''
    final = f'''<section class="finale">{art('alicia-walking', 'Alicia walking forward with the Playbook under her arm and a tote bag in her hand.', 'finale-walk')}<div class="wrap finale-inner"><p class="eyebrow">{e(c['final']['eyebrow'])}</p><h2>{e(c['final']['heading'])}</h2><p>{e(s['finalBody'])}</p>{buy('final')}<p class="micro">{e(s['offerNote'])}</p>{'' if c['emailFormAction'] else free_link}</div></section>'''
    free = ''
    if c['emailFormAction']:
        free = f'''<section class="free wrap"><div><h2>{e(c['free']['heading'])}</h2><p>{e(c['free']['body'])}</p></div><form class="email-form" method="post" action="{e(c['emailFormAction'])}" data-configured="true"><label for="email">{e(u['emailLabel'])}</label><input id="email" type="email" name="{e(c['emailFieldName'])}" autocomplete="email" required><button class="button">{e(u['emailButton'])}</button><p id="newsletter-status">{e(u['emailPrivacy'])}</p></form></section>'''

    config = {'checkup': k, 'leakHunt': L, 'checkoutUrl': c['checkoutUrl'], 'emailSubmitting': u['emailSubmitting'], 'motion': c['motion'], 'sales': s, 'readerDescriptions': r['descriptions'], 'chapters': [{'title': t, 'body': m['descriptions'][i]} for i, t in enumerate(m['items'])]}
    data = '<script id="site-config" type="application/json">' + json.dumps(config).replace('<', '\\u003c') + '</script>'
    banner = f'<p class="preview-banner">{e(u["previewNotice"])}</p>' if not c['checkoutUrl'] else ''
    main = hero + ribbon + checkup + approach + pack + tool + samples + how + chapters + readers + note + comments + pricing + faq + final + free
    return document(c['seo']['title'], nav + '<main id="main">' + main + '</main>' + foot(True) + banner + data)
