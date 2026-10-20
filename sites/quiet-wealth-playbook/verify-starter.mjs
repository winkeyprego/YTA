import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const settings=JSON.parse(readFileSync(new URL('./content.json',import.meta.url),'utf8'));
const field=value=>({value,checked:false});
const rows=settings.sales.defaultRows.map(row=>{
 const fields={'[data-cost-name]':field(row.name),'[data-cost-amount]':field(row.amount),'[data-cost-frequency]':field(row.frequency),'[data-cost-review]':{checked:row.review}};
 return {fields,querySelector:key=>fields[key]};
});
const nodes={'[data-cost-total]':{},'[data-review-total]':{},'[data-tool-status]':{},'[data-download-costs]':{addEventListener(name,handler){this[name]=handler;}}};
const handlers={},events=[];let exported='';let clicked=false;
const tool={querySelectorAll:()=>rows,querySelector:key=>nodes[key],addEventListener:(name,fn)=>handlers[name]=fn};
const document={querySelector:key=>key==='#site-config'?{textContent:JSON.stringify({sales:settings.sales})}:key==='[data-cost-tool]'?tool:null,querySelectorAll:()=>[],body:{append(){}},createElement(){return {click(){clicked=true;},remove(){}};}};
class LocalURL extends URL{static createObjectURL(){return 'blob:local-test';}static revokeObjectURL(){}}
vm.runInNewContext(readFileSync(new URL('./dist/site.js',import.meta.url),'utf8'),{document,window:{dispatchEvent:event=>events.push(event.detail)},location:{search:'',href:'http://localhost/'},URL:LocalURL,URLSearchParams,Intl,Number,Object,String,setTimeout:fn=>fn(),Blob:class{constructor(parts){exported=parts.join('');}},CustomEvent:class{constructor(name,data){this.detail=data.detail;}}});
assert.equal(nodes['[data-cost-total]'].value,'$912.00');assert.equal(nodes['[data-review-total]'].value,'$300.00');
rows[0].fields['[data-cost-amount]'].value='10.5';rows[0].fields['[data-cost-frequency]'].value='yearly';rows[1].fields['[data-cost-review]'].checked=true;rows[2].fields['[data-cost-frequency]'].value='yearly';handlers.change();
assert.equal(nodes['[data-cost-total]'].value,'$163.50');assert.equal(nodes['[data-review-total]'].value,'$154.50');
rows[0].fields['[data-cost-amount]'].reportValidity=()=>false;nodes['[data-download-costs]'].click();assert.equal(clicked,false);delete rows[0].fields['[data-cost-amount]'].reportValidity;
rows[0].fields['[data-cost-name]'].value='=1+1';rows[1].fields['[data-cost-name]'].value='A "quoted", cost';nodes['[data-download-costs]'].click();
assert.equal(clicked,true);assert.ok(exported.startsWith('\uFEFF'));assert.ok(exported.includes('"\'=1+1"'));assert.ok(exported.includes('"A ""quoted"", cost"'));assert.ok(exported.includes('"Selected for review","154.5"'));assert.ok(exported.includes(settings.sales.sampleDisclosure));assert.equal(JSON.stringify(events.at(-1).props),JSON.stringify({source:'website'}));
rows[0].fields['[data-cost-amount]'].value='-1';rows[1].fields['[data-cost-amount]'].value='';rows[2].fields['[data-cost-amount]'].value='not a number';handlers.input();assert.equal(nodes['[data-cost-total]'].value,'$0.00');
console.log('PASS: default/changed annual totals, selection, empty/invalid inputs, CSV contents and quote/formula escaping, and no entered values in analytics.');
