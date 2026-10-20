import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

const source=readFileSync(fileURLToPath(new URL('./dist/site.js',import.meta.url)),'utf8');
const run=(checkoutUrl,search)=>{
  const events=[];
  const links=['navigation','hero','pricing','final'].map(location=>({
    dataset:{buy:location}, href:checkoutUrl || '#checkout-setup', handlers:{},
    addEventListener(name,fn){this.handlers[name]=fn;}
  }));
  const document={
    querySelector(selector){return selector==='#site-config'?{textContent:JSON.stringify({checkoutUrl})}:null;},
    querySelectorAll(selector){return selector==='[data-buy]'?links:[];}
  };
  vm.runInNewContext(source,{
    document,location:{search,href:'https://preview.example/'},
    matchMedia:()=>({matches:true}),URL,URLSearchParams,
    window:{dispatchEvent:event=>events.push(event.detail)},
    CustomEvent:class{constructor(name,data){this.detail=data.detail;}},
  });
  return {links,events};
};
const paid=run('https://test-store.lemonsqueezy.com/checkout/buy/example?discount=INTRO&utm_medium=old','?utm_source=youtube&utm_medium=description&utm_campaign=payday&utm_content=video%20one&email=private%40example.com');
for(const link of paid.links){
  const target=new URL(link.href);
  assert.equal(target.searchParams.get('discount'),'INTRO');
  assert.equal(target.searchParams.get('utm_source'),'youtube');
  assert.equal(target.searchParams.get('utm_medium'),'description');
  assert.equal(target.searchParams.get('utm_campaign'),'payday');
  assert.equal(target.searchParams.get('utm_content'),'video one');
  assert.equal(target.searchParams.has('email'),false);
  link.handlers.click();
}
assert.deepEqual(paid.events.map(event=>event.props.location),['navigation','hero','pricing','final']);
const preview=run('','?utm_source=youtube');
assert.equal(preview.links.every(link=>link.href==='#checkout-setup'),true);
console.log('PASS: every purchase link carries all four UTMs, retains checkout parameters, excludes unrelated personal query data, tracks its location, and has an honest unconfigured fallback.');
