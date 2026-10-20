"""Accessible, progressive scroll storytelling for the Alicia sales page."""
from html import escape as e


def render_scroll_story(c):
    s=c['scrollStory']
    poses=''.join(f'<img class="story-pose{" is-active" if i==0 else ""}" data-pose="{i}" {("src" if i==0 else "data-src")}="{e(step["image"])}" alt="" aria-hidden="true" width="{step["width"]}" height="{step["height"]}" loading="lazy">' for i,step in enumerate(s['steps']))
    steps=''.join(f'<article class="scroll-chapter{" is-current" if i==0 else ""}" data-scroll-chapter="{i}" data-pose-alt="{e(step["alt"])}"><span class="chapter-kicker">{i+1:02d} / {e(step["label"])}</span><h3>{e(step["heading"])}</h3><p>{e(step["body"])}</p></article>' for i,step in enumerate(s['steps']))
    return f'''<section class="scroll-story section-space" id="the-approach" data-active-pose="0"><div class="wrap"><div class="story-section-heading"><p class="eyebrow">{e(c['problem']['eyebrow'])}</p><h2>{e(c['problem']['heading'])}</h2></div><div class="scroll-story-grid"><div class="scroll-stage"><div class="story-stage-art" role="img" aria-label="{e(s['steps'][0]['alt'])}"><div class="story-stage-halo" aria-hidden="true"></div><div class="pose-layer">{poses}</div><div class="stage-folio" aria-hidden="true"><span data-story-number>01</span><span>/ 03</span></div></div><p class="stage-caption">{e(s['caption'])}</p><div class="stage-progress" aria-hidden="true"><i class="is-active"></i><i></i><i></i></div></div><div class="scroll-chapters">{steps}<a class="text-link" href="#try-it">{e(c['interactionHint'])}<span aria-hidden="true">↗</span></a></div></div></div></section>'''
