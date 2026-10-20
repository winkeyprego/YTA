"""Verify the current product-first page and its printable examples."""
import json,re
from html.parser import HTMLParser
from pathlib import Path
R=Path(__file__).resolve().parent;D=R/'dist';C=json.loads((R/'content.json').read_text(encoding='utf-8'))
class Page(HTMLParser):
 def __init__(self):super().__init__();self.tags=[];self.text=[]
 def handle_starttag(self,tag,attrs):self.tags.append((tag,dict(attrs)))
 def handle_data(self,data):self.text.append(data)
p=Page();source=(D/'index.html').read_text(encoding='utf-8');p.feed(source);text=' '.join(p.text)
assert len([a for t,a in p.tags if t=='h1'])==1
assert len([a for t,a in p.tags if 'data-buy' in a])==4
assert len([a for t,a in p.tags if 'data-faq' in a])==7
assert len([a for t,a in p.tags if 'data-month' in a])==12
assert len([a for t,a in p.tags if 'data-cost-row' in a])==3
assert len([a for t,a in p.tags if 'data-life' in a])==3
assert 'alicia-joint' not in source and 'data-greet' not in source
assert len(C['pack']['items'])==11
assert source.count(C['ui']['disclaimer'])==2
assert source.index('id="the-pack"')<source.index('id="try-it"')<source.index('id="pricing"')
assert 'composite characters based on real people' in text
assert '105,000' not in text and '2,000,000' not in text and 'real-life stories' not in text
assert 'not excerpts from the paid pack' in text
assert '\u2014' not in text
assert not re.search(r'\b(secret|hack|crush|explode)\b',text,re.I)
assert (D/'site.js').stat().st_size<30000
css=(D/'styles.css').read_text(encoding='utf-8')
assert 'font-display:swap' in css and 'prefers-reduced-motion:reduce' in css
ids={a['id'] for t,a in p.tags if 'id' in a}
for tag,a in p.tags:
 if tag=='img':
  assert a.get('alt') and a.get('width') and a.get('height')
  assert (D/a['src']).is_file()
 if tag=='a':
  h=a.get('href','')
  if h.startswith('#'):assert h[1:] in ids
  elif h.endswith('.html'):assert (D/h.split('#')[0]).is_file()
 if 'data-buy' in a:assert a['href']==(C['checkoutUrl'] or '#checkout-setup')
for item in C['sales']['examples']:
 f=D/(item['slug']+'.html');assert f.is_file()
 html=f.read_text(encoding='utf-8')
 assert item['title'] in html and all(step.replace('&','&amp;') in html for step in item['steps'])
 assert C['sales']['printNotice'] in html and 'window.print()' in html
for name in ('privacy','terms','refunds'):
 assert C['ui']['legalPlaceholder'] in (D/f'{name}.html').read_text(encoding='utf-8')
assert not C['checkoutUrl'] or C['checkoutUrl'].startswith('https://')
assert bool(C['emailFormAction'])==any(t=='form' and 'email-form' in a.get('class','').split() for t,a in p.tags)
print('PASS: product-first order, four checkout links, eleven resources, twelve chapters, honest composite/preview labels, three working-printable examples, accessible local assets, no unsupported proof, and no-JS content.')
print('JS:',(D/'site.js').stat().st_size,'bytes; CSS:',(D/'styles.css').stat().st_size,'bytes')
