/* Static sales page enhancements. Entries and worksheets stay on the visitor's device. */
(() => {
 'use strict';
 const config=JSON.parse(document.querySelector('#site-config')?.textContent || '{}');
 const track=(name,props={})=>{
  if(typeof window.plausible==='function') window.plausible(name,{props});
  window.dispatchEvent(new CustomEvent('quietwealth:analytics',{detail:{name,props}}));
 };
 const incoming=new URLSearchParams(location.search);
 document.querySelectorAll('[data-buy]').forEach(link=>{
  if(config.checkoutUrl){
   const target=new URL(config.checkoutUrl,location.href);
   ['utm_source','utm_medium','utm_campaign','utm_content'].forEach(key=>{
    const value=incoming.get(key); if(value) target.searchParams.set(key,value.slice(0,512));
   });
   link.href=target.href;
  }
  link.addEventListener('click',()=>track('Buy click',{location:link.dataset.buy}));
 });
 document.querySelectorAll('[data-faq]').forEach(item=>item.addEventListener('toggle',()=>{
  if(item.open) track('FAQ open',{question:item.dataset.faq});
 }));
 document.querySelectorAll('[data-month]').forEach(item=>item.addEventListener('toggle',()=>{
  if(!item.open) return;
  const marker=document.querySelector('[data-month-current]');if(marker) marker.textContent=item.dataset.month.padStart(2,'0');
  document.querySelectorAll('[data-month]').forEach(other=>{if(other!==item) other.open=false;});
 }));
 const form=document.querySelector('.email-form');
 form?.addEventListener('submit',()=>{
  track('Email signup',{state:'submitted'});
  document.querySelector('#newsletter-status').textContent=config.emailSubmitting;
 });
 const tool=document.querySelector('[data-cost-tool]');
 if(tool && config.sales){
  const s=config.sales;
  const rows=[...tool.querySelectorAll('[data-cost-row]')];
  const factors={monthly:12,weekly:52,yearly:1};
  const format=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2});
  const entries=()=>rows.map(row=>{
   const amount=Number(row.querySelector('[data-cost-amount]').value);
   const frequency=row.querySelector('[data-cost-frequency]').value;
   return {
    name:row.querySelector('[data-cost-name]').value.trim(),
    amount:Number.isFinite(amount)?Math.min(10000,Math.max(0,amount)):0,
    frequency:Object.hasOwn(factors,frequency)?frequency:'monthly',
    review:row.querySelector('[data-cost-review]').checked
   };
  });
  const annual=row=>Math.round(row.amount*factors[row.frequency]*100)/100;
  const update=()=>{
   const data=entries();
   tool.querySelector('[data-cost-total]').value=format.format(data.reduce((sum,row)=>sum+annual(row),0));
   tool.querySelector('[data-review-total]').value=format.format(data.filter(row=>row.review).reduce((sum,row)=>sum+annual(row),0));
  };
  tool.addEventListener('input',update); tool.addEventListener('change',update);
  const csv=value=>{
   let text=String(value);
   // Prevent user-entered spreadsheet formulas from being evaluated when opened.
   if(/^[\s]*[=+@-]/.test(text)) text="'"+text;
   return '"'+text.replaceAll('"','""')+'"';
  };
  tool.querySelector('[data-download-costs]').addEventListener('click',()=>{
   if(rows.some(row=>{const field=row.querySelector('[data-cost-amount]');return typeof field.reportValidity==='function' && !field.reportValidity();})) return;
   const data=entries();
   const records=[[s.csvBrand],[s.sampleDisclosure],[],[s.expenseLabel,s.costLabel,s.frequencyLabel,s.annualCsvLabel,s.reviewLabel],...data.map(row=>[row.name,row.amount,s.frequencyLabels[row.frequency],annual(row),row.review?s.yesLabel:s.noLabel]),[],[s.annualTotal,data.reduce((sum,row)=>sum+annual(row),0)],[s.reviewTotal,data.filter(row=>row.review).reduce((sum,row)=>sum+annual(row),0)],[s.reviewNote]];
   const content='\uFEFF'+records.map(row=>row.map(csv).join(',')).join('\r\n');
   const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));
   const link=document.createElement('a'); link.href=url;link.download=s.downloadFile;
   document.body.append(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(url),60000);
   tool.querySelector('[data-tool-status]').textContent=s.downloadStatus;
   track('Starter worksheet downloaded',{source:'website'});
  });
  update();
 }
 const motion=document.querySelector('[data-motion-toggle]');
 if(motion){
  const media=matchMedia('(prefers-reduced-motion: reduce)');let paused=false;
  const paint=()=>{
   document.documentElement.dataset.motion=media.matches?'reduced':paused?'paused':'running';
   motion.disabled=media.matches;motion.setAttribute('aria-pressed',String(media.matches||paused));
   const labels=config.motion||{};
   motion.textContent=media.matches?labels.reduced:paused?labels.resume:labels.pause;
  };
  motion.addEventListener('click',()=>{paused=!paused;paint();});
  media.addEventListener?.('change',paint);paint();
 }
})();
