import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Run the built bundle without a page, then test the pure check-up and Leak Hunt helpers it exposes.
const settings=JSON.parse(readFileSync(new URL('./content.json',import.meta.url),'utf8'));
const source=readFileSync(new URL('./dist/site.js',import.meta.url),'utf8');
const window={dispatchEvent(){}};
const document={querySelector:key=>key==='#site-config'?{textContent:'{}'}:null,querySelectorAll:()=>[]};
vm.runInNewContext(source,{window,document,location:{search:'',href:'http://localhost/'},URL,URLSearchParams,Intl,CustomEvent:class{}});
// Results come from the sandbox realm; JSON makes them plain values for strict comparison.
const plain=value=>JSON.parse(JSON.stringify(value));
const result=(answers,setup)=>plain(window.quietWealthCheckup.result(answers,setup));
const leak=window.quietWealthLeakHunt;
const k=settings.checkup;

const hard=result({feel:'avoid',bills:'no',surprise:'borrow',subs:'unknown',debt:'heavy',payday:'drift',decision:'car',life:'0'},k);
assert.equal(hard.stage,'fog');
assert.deepEqual(hard.steps,['look','list','car']);
assert.deepEqual(hard.chapters,[1,2,7]);
const steady=result({feel:'calm',bills:'exact',surprise:'easy',subs:'reviewed',debt:'none',payday:'plan',decision:'none',life:'3'},k);
assert.equal(steady.stage,'ahead');
assert.deepEqual(steady.steps,['moneydate','learn','subs']);
assert.deepEqual(steady.chapters,[8,11,12]);
assert.equal(steady.life,3);
const middle=result({feel:'fine',bills:'rough',surprise:'savings',subs:'most',debt:'manageable',payday:'bills',decision:'raise',life:'4'},k);
assert.equal(middle.stage,'rhythm');
assert.deepEqual(middle.steps,['payday','list','raise']);
assert.deepEqual(middle.chapters,[1,3,9]);
assert.equal(result({feel:'anxious',bills:'exact',surprise:'stretch',subs:'most',debt:'none',payday:'plan',decision:'none',life:'1'},k).stage,'cushion');
const cushion=result({feel:'anxious',bills:'rough',surprise:'stretch',subs:'unknown',debt:'manageable',payday:'bills',decision:'car',life:'3'},k);
assert.equal(cushion.stage,'cushion');
assert.deepEqual(cushion.steps,['cushion','list','car']);
assert.deepEqual(cushion.chapters,[1,4,7]);
for(const r of [hard,steady,middle]){
 assert.equal(r.steps.length,3);assert.equal(r.chapters.length,3);
 r.steps.forEach(key=>assert.ok(k.steps[key],key));
 r.chapters.forEach(n=>assert.ok(n>=1&&n<=12));
}

assert.equal(leak.annual({amount:16,frequency:'monthly'}),192);
assert.equal(leak.annual({amount:60,frequency:'weekly'}),3120);
assert.equal(leak.annual({amount:95,frequency:'yearly'}),95);
assert.equal(leak.clean('-5'),0);assert.equal(leak.clean('abc'),0);assert.equal(leak.clean(''),0);assert.equal(leak.clean(20000),10000);
const rows=[{name:'Phone plan',amount:65,frequency:'monthly',decision:'call'},{name:'Gym',amount:40,frequency:'monthly',decision:'cancel'},{name:'Coffee out',amount:20,frequency:'weekly',decision:'keep'}];
const sum=plain(leak.summarize(rows,30));
assert.deepEqual([sum.total,sum.call,sum.cancel,sum.keep,sum.hours],[2300,780,480,1040,77]);
assert.equal(leak.summarize(rows,'').hours,null);
assert.equal(leak.script(settings.leakHunt.callScript,'phone plan').includes('my phone plan bill'),true);
const s=settings.sales;
const labels={...settings.leakHunt,csvBrand:s.csvBrand,disclosure:s.sampleDisclosure,nameLabel:s.expenseLabel,amountLabel:s.costLabel,frequencyLabel:s.frequencyLabel,annualLabel:s.annualCsvLabel,frequencyLabels:s.frequencyLabels};
const csv=leak.toCsv([...rows,{name:'=1+1',amount:5,frequency:'monthly',decision:'keep'},{name:'A "quoted", cost',amount:'-3',frequency:'yearly',decision:'cancel'}],labels,30);
assert.ok(csv.startsWith('﻿'));
assert.ok(csv.includes('"\'=1+1"'));
assert.ok(csv.includes('"A ""quoted"", cost","0"'));
assert.ok(csv.includes(s.sampleDisclosure));
assert.ok(csv.includes(`"${settings.leakHunt.yearTotal}","2360"`));
assert.ok(csv.includes('"Ask about"')&&csv.includes('"Cancel"'));

// Analytics events carry no entered names or amounts.
assert.match(source,/name:'Leak hunt downloaded',props:\{source:'website'\}/);
assert.match(source,/name:'Check-up finished',props:\{stage:r\.stage\}/);
console.log('PASS: check-up stages, steps and chapters; Leak Hunt yearly totals, decisions, hours of work, invalid amounts, CSV escaping and disclosure; analytics without entered values.');
