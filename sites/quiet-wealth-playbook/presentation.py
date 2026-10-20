"""Editorial sections for the standalone Quiet Wealth page."""
from html import escape as e


def render_hero(c, buy, icon, launch=""):
    h=c['hero']
    cover=f'''<div class="cover-face"><span>{e(h['bookKicker'])}</span><p>{'<br>'.join(e(w) for w in h['headlineTop'].split())}<br><em>{e(h['headlineBottom'])}.</em></p><div class="cover-steps" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div><small>{e(h['bookByline'])}</small></div>'''
    return f'''<section class="hero-v2 wrap" id="hero">
      <div class="hero-copy-v2"><p class="eyebrow"><span class="tiny-rule"></span>{e(h['from'])}</p>
        <h1>{e(h['headlineTop'])}<br><em>{e(h['headlineBottom'])}</em><span>.</span></h1>
        <p class="hero-lede">{e(h['lede'])}</p><p class="hero-support">{e(h['support'])}</p>
        <div class="hero-actions">{buy('hero')}<p class="micro">{launch}{e(c['ui']['delivery'])}</p></div>
        <a class="text-link" href="#look-inside">{e(h['explore'])}<span aria-hidden="true">↓</span></a>
        <ul class="hero-meta">{''.join(f'<li>{icon("tick")}{e(item)}</li>' for item in h['heroMeta'])}</ul>
      </div>
      <div class="hero-world" data-hero-world>
        <div class="world-disc" aria-hidden="true"></div><div class="world-orbit" aria-hidden="true"></div>
        <p class="world-edition">{e(h['edition'])}<svg viewBox="0 0 80 50" aria-hidden="true"><path d="M5 4c44-9 68 21 48 37m-9-9 8 11 12-5"/></svg></p>
        <div class="alicia-window"><img src="assets/alicia-reference.jpg" alt="{e(h['portraitAlt'])}" width="1280" height="720" fetchpriority="high"></div>
        <div class="world-book" data-book-tilt>{cover}</div>
        <div class="world-ticket"><span>{e(h['monthBadge'])}</span><strong>{e(h['systemLabel'])}</strong><svg viewBox="0 0 120 45" aria-hidden="true"><path d="m4 35 22-8 20 3 22-14 20 3 26-14"/><circle cx="114" cy="5" r="3"/></svg></div>
        <div class="alicia-intro"><span class="intro-dot" aria-hidden="true"></span><span>{e(h['hostLabel'])}<small>{e(h['hostPlaceholder'])}</small></span></div>
        <p class="world-caption">{e(c['ui']['mockupNotice'])}</p>
      </div>
    </section>'''


def render_explorer(c, icon):
    x=c['pack']['explorer']
    tabs=''.join(f'<button type="button" data-explore="{i}" aria-pressed="{str(i==0).lower()}" aria-controls="toolkit-preview">{e(t["label"])}{icon("arrow")}</button>' for i,t in enumerate(x['tabs']))
    first=x['tabs'][0]
    return f'''<div class="toolkit-explorer" data-reveal>
      <div class="explorer-main"><p class="eyebrow">{e(x['eyebrow'])}</p><h3>{e(x['title'])}</h3><div class="explorer-tabs" role="group" aria-label="{e(x['label'])}">{tabs}</div></div>
      <div class="toolkit-preview" id="toolkit-preview" aria-live="polite"><div class="edition-spine" aria-hidden="true">{e(c['product'])}</div><div class="explorer-paper"><img src="{e(first['image'])}" alt="{e(x['imageNote'])}: {e(first['title'])}" width="540" height="720" loading="lazy"></div><div class="explorer-copy"><p class="eyebrow" data-explorer-kicker>{e(first['kicker'])}</p><h4 data-explorer-title>{e(first['title'])}</h4><p data-explorer-body>{e(first['body'])}</p><span class="explorer-tag" data-explorer-tag>{e(first['tag'])}</span><small>{e(x['imageNote'])}</small><button type="button" class="text-link open-sample" data-open-explorer>{e(x['openPreview'])}{icon("arrow")}</button></div></div>
    </div>'''


def render_months(c):
    m=c['months']
    entries=''.join(f'''<details class="journey-month" data-month="{i+1}"{' open' if i==0 else ''}><summary><span class="journey-index">{i+1:02d}</span><span>{e(title)}</span><span class="journey-toggle" aria-hidden="true">+</span></summary><p>{e(m['descriptions'][i])}</p></details>''' for i,title in enumerate(m['items']))
    return f'''<section class="months journey section-space"><div class="wrap journey-layout"><div class="journey-intro" data-reveal><p class="eyebrow">{e(m['eyebrow'])}</p><h2>{e(m['heading'])}</h2><p class="section-intro">{e(m['intro'])}</p><div class="journey-marker" aria-hidden="true"><span data-month-current>01</span><span>/ 12</span></div><p class="journey-caption">{e(m['subheading'])}</p><a class="text-link" href="#pricing">{e(c['ui']['getPlaybook'])}<span aria-hidden="true">↗</span></a></div><div class="journey-list"><p class="journey-instruction">{e(m['interactLabel'])}</p>{entries}</div></div></section>'''


def render_note(c):
    n=c['note']
    return f'''<section class="note-section note-v2 section-space"><div class="wrap note-inner" data-reveal><div class="note-art"><div class="note-frame"><img src="assets/alicia-reference.jpg" width="1280" height="720" alt="{e(n['portraitAlt'])}" loading="lazy"></div><span class="note-handwritten">{e(c['hero']['floatingNote'])}</span></div><div class="note-copy"><p class="eyebrow">{e(n['eyebrow'])}</p><blockquote>{e(n['body'])}</blockquote><p class="signature">{e(n['signature'])}<span aria-hidden="true">♡</span></p></div></div></section>'''


def render_readers(c, icon):
    r=c['readers']
    chips=''.join(f'<button type="button" data-reader="{i}" aria-pressed="{str(i==0).lower()}" aria-controls="reader-description">{icon("tick")}{e(item)}</button>' for i,item in enumerate(r['items']))
    return f'''<section class="wrap readers reader-v2 section-space" data-reveal><p class="eyebrow">{e(r['eyebrow'])}</p><h2>{e(r['heading'])}</h2><div class="reader-chips" role="group" aria-label="{e(r['selectLabel'])}">{chips}</div><p id="reader-description" class="reader-description" aria-live="polite">{e(r['descriptions'][0])}</p><p>{e(r['body'])}</p></section>'''
