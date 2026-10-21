/* Leak Hunt: pick recurring costs, see the year, decide keep / ask about / cancel, keep an action list. All local. */
(() => {
 'use strict';
 const config=JSON.parse(document.querySelector('#site-config')?.textContent||'{}');
 const L=config.leakHunt;

 // Pure helpers, shared with verify-tools.mjs.
 const factors={monthly:12,weekly:52,yearly:1};
 const clean=value=>{const n=Number(value);return Number.isFinite(n)?Math.min(10000,Math.max(0,n)):0;};
 const annual=row=>Math.round(clean(row.amount)*(factors[row.frequency]||12)*100)/100;
 const summarize=(rows,hourly)=>{
  const sum=list=>Math.round(list.reduce((total,row)=>total+annual(row),0)*100)/100;
  const total=sum(rows);const rate=clean(hourly);
  return {total,monthly:Math.round(total/12*100)/100,call:sum(rows.filter(row=>row.decision==='call')),cancel:sum(rows.filter(row=>row.decision==='cancel')),
   keep:sum(rows.filter(row=>row.decision!=='call'&&row.decision!=='cancel')),hours:rate>0?Math.round(total/rate):null};
 };
 const cell=value=>{
  let text=String(value);
  // Prevent user-entered spreadsheet formulas from being evaluated when opened.
  if(/^[\s]*[=+@-]/.test(text)) text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
 };
 const toCsv=(rows,labels,hourly)=>{
  const s=summarize(rows,hourly);const decision=Object.fromEntries(labels.decisions);
  const records=[[labels.csvBrand],[labels.disclosure],[],[labels.nameLabel,labels.amountLabel,labels.frequencyLabel,labels.annualLabel,labels.decisionLabel],
   ...rows.map(row=>[row.name,clean(row.amount),labels.frequencyLabels[row.frequency]||row.frequency,annual(row),decision[row.decision]||decision.keep]),
   [],[labels.yearTotal,s.total],[labels.callTotal,s.call],[labels.cancelTotal,s.cancel],[labels.note]];
  return '﻿'+records.map(record=>record.map(cell).join(',')).join('\r\n');
 };
 const script=(template,name)=>template.replace('{name}',name.trim()||'this');
 window.quietWealthLeakHunt={annual,summarize,toCsv,script,clean};

 const root=document.querySelector('[data-leak-hunt]');
 if(!root||!L) return;
 const s=config.sales||{};
 const money=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:2});
 const list=root.querySelector('[data-leak-list]');
 const chips=[...root.querySelectorAll('[data-leak-item]')];
 const hourly=root.querySelector('[data-leak-hourly]');
 const plan=root.querySelector('[data-leak-plan]');
 const bubble=document.querySelector('[data-leak-bubble]');
 const status=root.querySelector('[data-leak-status]');
 const labels={...L,csvBrand:s.csvBrand,disclosure:s.sampleDisclosure,nameLabel:s.expenseLabel,amountLabel:s.costLabel,frequencyLabel:s.frequencyLabel,annualLabel:s.annualCsvLabel,frequencyLabels:s.frequencyLabels};
 let uid=0;
 const esc=text=>String(text).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[ch]);

 const rowMarkup=(name,amount,frequency,decision)=>{
  const id=++uid;
  const freq=Object.entries(s.frequencyLabels||{monthly:'Monthly',weekly:'Weekly',yearly:'Yearly'}).map(([key,label])=>`<option value="${key}"${key===frequency?' selected':''}>${esc(label)}</option>`).join('');
  const choices=L.decisions.map(([key,label])=>`<label class="leak-choice leak-${key}"><input type="radio" name="leak-decision-${id}" value="${key}"${key===decision?' checked':''}><span>${esc(label)}</span></label>`).join('');
  return `<li class="leak-row" data-leak-row data-source="${esc(name)}"><div class="leak-name"><label class="sr-only" for="leak-name-${id}">${esc(s.expenseLabel||'Cost')}</label><input id="leak-name-${id}" data-leak-name value="${esc(name)}" maxlength="60"></div>
<div class="leak-amount"><label class="sr-only" for="leak-amount-${id}">${esc(s.costLabel||'Amount')}</label><span aria-hidden="true">$</span><input id="leak-amount-${id}" data-leak-amount type="number" min="0" max="10000" step="0.01" inputmode="decimal" value="${amount}"></div>
<div class="leak-frequency"><label class="sr-only" for="leak-frequency-${id}">${esc(s.frequencyLabel||'Frequency')}</label><select id="leak-frequency-${id}" data-leak-frequency>${freq}</select></div>
<fieldset class="leak-decision"><legend class="sr-only">${esc(L.decisionLabel)}</legend>${choices}</fieldset>
<button class="leak-remove" type="button" data-leak-remove aria-label="${esc(L.remove)} ${esc(name)}">×</button><span class="leak-annual" data-leak-annual></span></li>`;
 };
 const rows=()=>[...list.querySelectorAll('[data-leak-row]')].map(row=>({
  el:row,source:row.dataset.source,name:row.querySelector('[data-leak-name]').value,amount:row.querySelector('[data-leak-amount]').value,
  frequency:row.querySelector('[data-leak-frequency]').value,decision:row.querySelector('input[type="radio"]:checked')?.value||'keep'}));
 const add=(name,amount,frequency,decision='keep',focus=false)=>{
  list.insertAdjacentHTML('beforeend',rowMarkup(name,amount,frequency,decision));
  if(focus) list.lastElementChild.querySelector(name===L.ownName?'[data-leak-name]':'[data-leak-amount]').select();
 };
 const syncChips=()=>{const picked=new Set(rows().map(row=>row.source));chips.forEach(chip=>chip.setAttribute('aria-pressed',String(picked.has(chip.dataset.name))));};

 let lastBubble='';
 const paint=()=>{
  const data=rows();const sum=summarize(data,hourly.value);
  data.forEach(row=>{row.el.querySelector('[data-leak-annual]').textContent=money.format(annual(row))+' / yr';row.el.dataset.decision=row.decision;});
  root.querySelector('[data-leak-total]').value=money.format(sum.total);
  root.querySelector('[data-leak-monthly]').textContent=L.monthTotal.replace('{amount}',money.format(sum.monthly));
  root.querySelector('[data-leak-hours]').textContent=sum.hours?L.hours.replace('{hours}',sum.hours.toLocaleString('en-US')):'';
  root.querySelector('[data-leak-call]').value=money.format(sum.call);
  root.querySelector('[data-leak-cancel]').value=money.format(sum.cancel);
  const bar=root.querySelector('[data-leak-bar]');
  ['keep','call','cancel'].forEach(key=>bar.querySelector(`.bar-${key}`).style.setProperty('--w',sum.total>0?sum[key]/sum.total*100:0));
  const actions=data.filter(row=>row.decision==='call'||row.decision==='cancel');
  plan.innerHTML=actions.length?actions.map(row=>row.decision==='call'
   ?`<li class="plan-call"><p class="plan-tag">${esc(L.callLabel)}</p><h5>${esc(row.name||L.ownName)} <span>${money.format(annual(row))} / yr</span></h5><blockquote>${esc(script(L.callScript,row.name.toLowerCase()))}</blockquote></li>`
   :`<li class="plan-cancel"><p class="plan-tag">${esc(L.cancelLabel)}</p><h5>${esc(row.name||L.ownName)} <span>${money.format(annual(row))} / yr</span></h5><p>${esc(L.cancelSteps)}</p></li>`).join('')
   :`<li class="plan-empty">${esc(L.planEmpty)}</li>`;
  const text=sum.total<=0?L.empty
   :`Together, these come to ${money.format(sum.total)} a year.`+(sum.hours?` That’s about ${sum.hours.toLocaleString('en-US')} hours of work.`:'')+(sum.call+sum.cancel>0?` You’ve marked ${money.format(sum.call+sum.cancel)} to look at.`:' Mark any you’d like to look at.');
  if(bubble&&text!==lastBubble){bubble.textContent=text;lastBubble=text;}
  syncChips();
 };

 chips.forEach(chip=>chip.addEventListener('click',()=>{
  const existing=rows().find(row=>row.source===chip.dataset.name);
  if(existing) existing.el.remove(); else add(chip.dataset.name,chip.dataset.amount,chip.dataset.frequency,'keep',true);
  paint();
 }));
 root.querySelector('[data-leak-add]').addEventListener('click',()=>{add(L.ownName,'','monthly','keep',true);paint();});
 list.addEventListener('click',event=>{const remove=event.target.closest('[data-leak-remove]');if(remove){remove.closest('[data-leak-row]').remove();paint();}});
 root.addEventListener('input',paint);root.addEventListener('change',paint);
 root.querySelector('[data-leak-print]').addEventListener('click',()=>{
  document.documentElement.dataset.print='leaks';window.print();setTimeout(()=>delete document.documentElement.dataset.print,500);
 });
 root.querySelector('[data-leak-download]').addEventListener('click',()=>{
  const fields=[...list.querySelectorAll('[data-leak-amount]'),hourly];
  if(fields.some(field=>typeof field.reportValidity==='function'&&!field.reportValidity())) return;
  const url=URL.createObjectURL(new Blob([toCsv(rows(),labels,hourly.value)],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=L.downloadFile;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
  status.textContent=L.downloadStatus;
  window.dispatchEvent(new CustomEvent('quietwealth:analytics',{detail:{name:'Leak hunt downloaded',props:{source:'website'}}}));
 });

 const library=Object.fromEntries(L.groups.flatMap(([,items])=>items.map(item=>[item[0],item])));
 L.starter.forEach(([name,decision])=>{const item=library[name];if(item) add(item[0],item[1],item[2],decision);});
 root.classList.add('is-ready');
 paint();
})();
