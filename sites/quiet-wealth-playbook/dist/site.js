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

/* Edition 9 interactions. Nothing here intercepts scrolling or sends what visitors type. */
(() => {
 'use strict';
 const root=document.documentElement;
 // The checkout and worksheet fixtures run this file without a real page; nothing below applies there.
 if(!root || typeof window.addEventListener!=='function') return;
 const config=JSON.parse(document.querySelector('#site-config')?.textContent||'{}');
 const moving=()=>root.dataset.motion!=='paused' && root.dataset.motion!=='reduced' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
 const pad=n=>String(n).padStart(2,'0');
 const replay=(el,cls)=>{el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls);};

 // Reading progress in the header.
 const progress=document.querySelector('[data-progress]');
 let ticking=false;
 const paintProgress=()=>{ticking=false;const max=root.scrollHeight-innerHeight;progress?.style.setProperty('--progress',max>0?Math.min(1,scrollY/max):0);};
 addEventListener('scroll',()=>{if(!ticking){ticking=true;requestAnimationFrame(paintProgress);}},{passive:true});
 paintProgress();

 // The hero book follows a fine pointer a little, and can be opened to its contents page.
 const book=document.querySelector('.book-hero');
 const area=document.querySelector('[data-tilt-area]');
 if(book && area && matchMedia('(pointer: fine)').matches){
  area.addEventListener('pointermove',event=>{
   if(!moving()) return;
   const box=area.getBoundingClientRect();
   book.style.setProperty('--tx',((event.clientX-box.left)/box.width-.5).toFixed(3));
   book.style.setProperty('--ty',((event.clientY-box.top)/box.height-.5).toFixed(3));
  });
  area.addEventListener('pointerleave',()=>{book.style.removeProperty('--tx');book.style.removeProperty('--ty');});
 }
 const toggle=document.querySelector('[data-book-toggle]');
 toggle?.addEventListener('click',()=>{
  const open=!book.classList.contains('is-open');
  book.classList.toggle('is-open',open);
  toggle.setAttribute('aria-pressed',String(open));
  toggle.querySelector('[data-open-label]').hidden=open;
  toggle.querySelector('[data-close-label]').hidden=!open;
 });

 // Illustrations breathe only while visible.
 const life=[...document.querySelectorAll('[data-life]')];
 if('IntersectionObserver' in window){
  const seen=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('is-in-view',entry.isIntersecting)),{rootMargin:'25px 0px'});
  life.forEach(el=>seen.observe(el));
 }
 const hidden=()=>{root.dataset.pageHidden=String(document.hidden);};
 document.addEventListener('visibilitychange',hidden);hidden();

 // Alicia's three-step conversation follows the reader's scroll position.
 const talk=document.querySelector('.talk');
 if(talk){
  const steps=[...talk.querySelectorAll('[data-conversation-step]')];
  const poses=[...talk.querySelectorAll('[data-conversation-pose]')];
  const windowEl=talk.querySelector('.talk-window');
  const number=talk.querySelector('[data-conversation-number]');
  let current=0,queued=false;
  const load=()=>poses.forEach(pose=>{if(pose.dataset.src && !pose.getAttribute('src')) pose.src=pose.dataset.src;});
  const update=()=>{
   queued=false;
   let next=0;
   steps.forEach((step,i)=>{if(step.getBoundingClientRect().top<innerHeight*.58) next=i;});
   if(next===current) return;
   current=next;
   poses.forEach((pose,i)=>pose.classList.toggle('is-active',i===next));
   steps.forEach((step,i)=>step.classList.toggle('is-current',i===next));
   talk.dataset.step=String(next);
   talk.style.setProperty('--meter',((next+1)/steps.length).toFixed(4));
   number.textContent=pad(next+1);
   windowEl.setAttribute('aria-label',steps[next].dataset.poseAlt);
  };
  const queue=()=>{if(!queued){queued=true;requestAnimationFrame(update);}};
  if('IntersectionObserver' in window) new IntersectionObserver(([entry])=>{if(entry.isIntersecting) load();},{rootMargin:'300px 0px'}).observe(talk);
  else load();
  addEventListener('scroll',queue,{passive:true});
  addEventListener('resize',queue,{passive:true});
  queue();
 }

 // The year dial: twelve chapters arranged like a clock face.
 const chapters=config.chapters||[];
 const months=[...document.querySelectorAll('[data-month]')];
 const card=document.querySelector('.chapter-card');
 let month=1;
 const showMonth=(n,focus)=>{
  month=(n+11)%12+1;
  const item=chapters[month-1];if(!item) return;
  months.forEach(button=>{const on=Number(button.dataset.month)===month;button.classList.toggle('is-active',on);button.setAttribute('aria-pressed',String(on));});
  document.querySelector('[data-month-current]').textContent=pad(month);
  document.querySelector('[data-chapter-number]').textContent=pad(month);
  document.querySelector('[data-chapter-title]').textContent=item.title;
  document.querySelector('[data-chapter-body]').textContent=item.body;
  document.querySelector('[data-dial-arc]')?.style.setProperty('--arc',month);
  if(card && moving()) replay(card,'is-new');
  if(focus) months[month-1].focus();
 };
 months.forEach(button=>{
  button.addEventListener('click',()=>showMonth(Number(button.dataset.month)));
  button.addEventListener('keydown',event=>{
   const step={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[event.key];
   if(step){event.preventDefault();showMonth(month+step,true);}
  });
 });
 document.querySelectorAll('[data-chapter-step]').forEach(button=>button.addEventListener('click',()=>showMonth(month+Number(button.dataset.chapterStep))));

 // Reader situations: Alicia answers in her speech bubble.
 const answer=document.querySelector('#reader-description');
 document.querySelectorAll('[data-reader]').forEach(button=>button.addEventListener('click',()=>{
  const text=config.readerDescriptions?.[Number(button.dataset.reader)];if(!text) return;
  document.querySelectorAll('[data-reader]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
  answer.textContent=text;
  if(moving()) replay(answer,'is-new');
 }));

 // Website examples sit in a stack of paper; a tab brings one sheet to the front.
 const tabs=[...document.querySelectorAll('[data-sheet-tab]')];
 const sheets=[...document.querySelectorAll('[data-sheet]')];
 const showSheet=(i,focus)=>{
  tabs.forEach((tab,n)=>{tab.setAttribute('aria-selected',String(n===i));tab.tabIndex=n===i?0:-1;});
  sheets.forEach((sheet,n)=>{sheet.classList.toggle('is-front',n===i);sheet.classList.toggle('is-back',n===(i+2)%sheets.length);});
  if(focus) tabs[i].focus();
 };
 tabs.forEach((tab,i)=>{
  tab.addEventListener('click',()=>showSheet(i));
  tab.addEventListener('keydown',event=>{
   const step={ArrowDown:1,ArrowRight:1,ArrowUp:-1,ArrowLeft:-1}[event.key];
   if(step){event.preventDefault();showSheet((i+step+tabs.length)%tabs.length,true);}
  });
 });
 if(sheets.length) showSheet(0);

 // The worksheet: proportional bar and Alicia's running note. Amounts stay on this page.
 const tool=document.querySelector('[data-cost-tool]');
 if(tool){
  const factors={monthly:12,weekly:52,yearly:1};
  const money=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:2});
  const bars=[...tool.querySelectorAll('[data-ledger-bar] i')];
  const bubble=document.querySelector('[data-ledger-bubble]');
  let last='';
  const paint=()=>{
   const rows=[...tool.querySelectorAll('[data-cost-row]')].map(row=>{
    const amount=Number(row.querySelector('[data-cost-amount]').value);
    const safe=Number.isFinite(amount)?Math.min(10000,Math.max(0,amount)):0;
    return {annual:safe*(factors[row.querySelector('[data-cost-frequency]').value]||12),review:row.querySelector('[data-cost-review]').checked};
   });
   const total=rows.reduce((sum,row)=>sum+row.annual,0);
   const review=rows.filter(row=>row.review).reduce((sum,row)=>sum+row.annual,0);
   bars.forEach((bar,i)=>bar.style.setProperty('--w',total>0?rows[i].annual/total*100:1));
   const text=total<=0?'Add a cost you recognize and I’ll add up the year with you.'
    :review>0?`Together, these come to ${money.format(total)} a year. You’ve marked ${money.format(review)} to look at more closely.`
    :`Together, these come to ${money.format(total)} a year. Tick one you’d like to look at more closely.`;
   if(bubble && text!==last){bubble.textContent=text;if(last && moving()) replay(bubble,'is-new');last=text;}
  };
  tool.addEventListener('input',paint);tool.addEventListener('change',paint);
  paint();
 }

 // Gentle reveals for content below the first screen. Anything already visible stays put.
 const reveal=[...document.querySelectorAll('.section-head,.volume,.tile,.ledger-card,.sheet-stack,.path li,.person,.dial,.chapter-card,.readers-art,.letter,.offer-card,.faq-list,.finale-inner')];
 if(moving() && 'IntersectionObserver' in window){
  const show=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in');show.unobserve(entry.target);}}),{rootMargin:'0px 0px -8% 0px'});
  reveal.forEach((el,i)=>{
   if(el.getBoundingClientRect().top<innerHeight) return;
   el.classList.add('rv');
   el.style.transitionDelay=el.matches('.tile,.volume,.person,.path li')?`${(i%3)*90}ms`:'';
   show.observe(el);
  });
  document.querySelector('[data-motion-toggle]')?.addEventListener('click',()=>reveal.forEach(el=>el.classList.add('in')));
 }
})();
