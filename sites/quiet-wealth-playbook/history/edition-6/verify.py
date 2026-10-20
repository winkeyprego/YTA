"""Check the prepared static deliverable without contacting checkout or email providers."""
import json
import re
import subprocess
from html.parser import HTMLParser
from pathlib import Path

ROOT=Path(__file__).resolve().parent
C=json.loads((ROOT/'content.json').read_text(encoding='utf-8'))
D=ROOT/'dist'

class Page(HTMLParser):
    def __init__(self):
        super().__init__();self.tags=[];self.text=[]
    def handle_starttag(self,tag,attrs):self.tags.append((tag,dict(attrs)))
    def handle_data(self,data):self.text.append(data)

page=Page();source=(D/'index.html').read_text(encoding='utf-8');page.feed(source)
assert len([a for tag,a in page.tags if tag=='h1'])==1
assert len([a for tag,a in page.tags if 'data-buy' in a])==4
assert len([a for tag,a in page.tags if 'data-faq' in a])==7
assert len([a for tag,a in page.tags if 'data-page' in a])==6
assert len([a for tag,a in page.tags if 'data-explore' in a])==3
assert len([a for tag,a in page.tags if 'data-month' in a])==12
assert len([a for tag,a in page.tags if 'data-reader' in a])==5
assert (D/'assets/alicia-reference.jpg').read_bytes()==(ROOT/'source/assets/alicia-reference.jpg').read_bytes()
assert source.count('assets/alicia-shh-v3.webp')==2
assert source.count('assets/alicia-money-v3.webp')==2
assert source.count('assets/alicia-desk-v3.webp')==1
assert len([a for tag,a in page.tags if 'data-scroll-chapter' in a])==3
assert 'data-motion-toggle' in source
assert 'alicia-head' not in source and 'alicia-arm' not in source and 'data-greet' not in source
assert len([a for tag,a in page.tags if 'data-life' in a])==4
assert (D/'assets/alicia-puppet-v5.webp').is_file() and (D/'assets/alicia-workbook-v5.webp').is_file()
assert 'data-demo' in source and 'data-save-plan' in source
assert len([a for tag,a in page.tags if 'data-plan-step' in a])==3
assert '\u2014' not in ''.join(page.text)
assert source.count(C['ui']['disclaimer'])==2
assert len(C['pack']['items'])==11 and len(C['months']['items'])==12
assert not re.search(r'\b(secret|hack|crush|explode)\b',' '.join(page.text),re.I)
assert (D/'site.js').stat().st_size<30000
assert 'font-display:swap' in (D/'styles.css').read_text(encoding='utf-8')
assert 'prefers-reduced-motion:reduce' in (D/'styles.css').read_text(encoding='utf-8')
ids={a['id'] for _,a in page.tags if 'id' in a}
for tag,a in page.tags:
    if tag=='img':
        assert (a.get('alt') or a.get('aria-hidden')=='true') and a.get('width') and a.get('height')
        if a.get('src'):assert (D/a['src']).is_file()
    if tag=='a' and a.get('href','').startswith('#') and a['href']!='#':
        assert a['href'][1:] in ids, a
    if 'data-buy' in a:assert a['href']==(C['checkoutUrl'] or '#checkout-setup')
for name in ('privacy','terms','refunds'):
    assert (D/f'{name}.html').is_file()
    assert C['ui']['legalPlaceholder'] in (D/f'{name}.html').read_text(encoding='utf-8')
print('PASS: static content, 4 checkout links, 11 resources, 12 months, 7 FAQs, 6 previews, actual Alicia, interactive controls, legal pages, local assets, no-JS HTML, copy constraints, reduced motion, and JS budget.')
print('JavaScript:',(D/'site.js').stat().st_size,'bytes')
print('Deployable folder:',sum(p.stat().st_size for p in D.rglob('*') if p.is_file()),'bytes')
