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

/* Whole-illustration life. Offscreen and hidden-page animation pauses. */
(() => {
 const art=[...document.querySelectorAll('[data-life]')];
 if(!art.length) return;
 if('IntersectionObserver' in window){
   const observer=new IntersectionObserver(entries=>{
     entries.forEach(entry=>entry.target.classList.toggle('is-in-view',entry.isIntersecting));
   },{rootMargin:'25px 0px'});
   art.forEach(el=>observer.observe(el));
 }
 const visibility=()=>{document.documentElement.dataset.pageHidden=String(document.hidden);};
 document.addEventListener('visibilitychange',visibility); visibility();
})();

/* Alicia's scroll conversation and reader choices. No scroll interception. */
(() => {
 const section=document.querySelector('.conversation-section');
 if(!section) return;
 const steps=[...section.querySelectorAll('[data-conversation-step]')];
 const poses=[...section.querySelectorAll('[data-conversation-pose]')];
 const stage=section.querySelector('.conversation-art');
 let visible=false,scheduled=false,current=0;
 const update=()=>{
  scheduled=false;
  if(!visible || document.hidden || document.documentElement.dataset.motion!=='running') return;
  let next=0;
  steps.forEach((step,i)=>{if(step.getBoundingClientRect().top<innerHeight*.6) next=i;});
  if(next===current) return;
  if(!poses[next].complete || !poses[next].naturalWidth) return;
  current=next;
  poses.forEach((pose,i)=>pose.classList.toggle('is-active',i===next));
  steps.forEach((step,i)=>step.classList.toggle('is-current',i===next));
  section.querySelectorAll('.conversation-dots i').forEach((dot,i)=>dot.classList.toggle('is-active',i===next));
  section.querySelector('[data-conversation-number]').textContent=String(next+1).padStart(2,'0');
  stage.setAttribute('aria-label',steps[next].dataset.poseAlt);
 };
 const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}};
 if('IntersectionObserver' in window){
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible) poses.forEach(pose=>{if(pose.dataset.src && !pose.getAttribute('src')) pose.src=pose.dataset.src;});schedule();},{rootMargin:'100px 0px'}).observe(section);
 }else visible=true;
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',schedule,{passive:true});
 window.addEventListener('scrollend',schedule,{passive:true});
 document.addEventListener('visibilitychange',schedule);
 poses.forEach(pose=>pose.addEventListener('load',schedule));
 document.querySelector('[data-motion-toggle]')?.addEventListener('click',schedule);
 const config=JSON.parse(document.querySelector('#site-config')?.textContent||'{}');
 document.querySelectorAll('[data-reader]').forEach(button=>button.addEventListener('click',()=>{
  const text=config.readerDescriptions?.[Number(button.dataset.reader)];if(!text) return;
  document.querySelectorAll('[data-reader]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
  document.querySelector('#reader-description').textContent=text;
 }));
 schedule();
})();
