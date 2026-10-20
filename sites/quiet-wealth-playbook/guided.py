"""Alicia-led exploration, using complete illustrations and native chapter details."""
from html import escape as e

def render_conversation(c,icon):
 s=c['scrollStory']
 poses=''.join(f'<img class="conversation-pose{" is-active" if i==0 else ""}" data-conversation-pose="{i}" {("src" if i==0 else "data-src")}="{e(x["image"])}" width="{x["width"]}" height="{x["height"]}" loading="lazy" alt="" aria-hidden="true">' for i,x in enumerate(s['steps']))
 chapters=''.join(f'<article class="conversation-step{" is-current" if i==0 else ""}" data-conversation-step="{i}" data-pose-alt="{e(x["alt"])}"><p class="eyebrow">{i+1:02d} / {e(x["label"])}</p><h3>{e(x["heading"])}</h3><p>{e(x["body"])}</p></article>' for i,x in enumerate(s['steps']))
 return f'''<section class="conversation-section section-space" id="the-approach"><div class="wrap"><div class="section-heading"><p class="eyebrow">{e(s['eyebrow'])}</p><h2>{e(s['heading'])}</h2><p class="intro">{e(s['intro'])}</p></div><div class="conversation-grid"><div class="conversation-stage"><div class="conversation-art" role="img" aria-label="{e(s['steps'][0]['alt'])}"><div class="conversation-halo" aria-hidden="true"></div><div class="conversation-poses" data-life>{poses}</div><span class="conversation-number" data-conversation-number aria-hidden="true">01</span></div><p class="conversation-caption">{e(s['caption'])}</p><div class="conversation-dots" aria-hidden="true"><i class="is-active"></i><i></i><i></i></div></div><div class="conversation-steps">{chapters}<a class="text-link" href="#the-pack">{e(c['hero']['explore'])}{icon('arrow')}</a></div></div></div></section>'''

def render_journey(c,icon):
 j=c['conversationJourney'];m=c['months']
 chapters=''.join(f'<details class="journey-month" data-month="{i+1}"'+(' open' if i==0 else '')+f'><summary><span>{i+1:02d}</span><span>{e(title)}</span>{icon("plus")}</summary><p>{e(m["descriptions"][i])}</p></details>' for i,title in enumerate(m['items']))
 return f'''<section class="chapter-journey section-space" id="chapters"><div class="wrap chapter-journey-grid"><div class="journey-intro"><p class="eyebrow">{e(j['eyebrow'])}</p><h2>{e(j['heading'])}</h2><p class="intro">{e(j['intro'])}</p><div class="journey-marker" aria-hidden="true"><span data-month-current>01</span><small>/ 12</small></div><p class="journey-caption">{e(j['caption'])}</p></div><div><p class="journey-hint">{e(j['hint'])}</p>{chapters}</div></div></section>'''

def render_reader_explorer(c,icon):
 j=c['conversationJourney'];r=c['readers']
 buttons=''.join(f'<button type="button" data-reader="{i}" aria-pressed="{str(i==0).lower()}" aria-controls="reader-description">{icon("tick")}{e(x)}</button>' for i,x in enumerate(r['items']))
 fallback=''.join(f'<li><strong>{e(x)}</strong> {e(r["descriptions"][i])}</li>' for i,x in enumerate(r['items']))
 return f'''<section class="reader-explorer section-space wrap" id="your-situation"><p class="eyebrow">{e(j['readersEyebrow'])}</p><h2>{e(j['readersHeading'])}</h2><p class="intro">{e(j['readersIntro'])}</p><div class="reader-buttons" role="group" aria-label="{e(r['selectLabel'])}">{buttons}</div><p id="reader-description" class="reader-answer" aria-live="polite">{e(r['descriptions'][0])}</p><p class="reader-foot">{e(j['readersFoot'])}</p><noscript><ul>{fallback}</ul></noscript></section>'''
