/* Static sales page enhancements: checkout links, FAQ and chapter events, email form and motion preference. */
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

/* Money check-up: eight questions, one at a time, then a short personal plan. Answers never leave the page. */
(() => {
 'use strict';
 const config=JSON.parse(document.querySelector('#site-config')?.textContent||'{}');
 const cfg=config.checkup;

 // Pure scoring, shared with verify-tools.mjs: answers {questionId: optionValue} -> stage, steps, chapters.
 const result=(answers,setup)=>{
  const a=answers;const needs=[];const add=key=>{if(!needs.includes(key)) needs.push(key);};
  if(a.feel==='avoid') add('look');
  if(a.bills==='no'||a.bills==='rough') add('list');
  if(a.subs==='unknown') add('subs');
  if(a.surprise==='borrow'||a.surprise==='stretch') add('cushion');
  if(a.debt==='heavy') add('debt');
  if(a.payday==='drift'||a.payday==='bills') add('payday');
  if(a.debt==='manageable') add('debt');
  const decision=a.decision&&a.decision!=='none'?a.decision:null;
  const stage=a.feel==='avoid'||a.bills==='no'?'fog'
   :a.surprise==='borrow'||a.surprise==='stretch'?'cushion'
   :a.payday==='drift'||a.payday==='bills'||a.debt==='heavy'||a.debt==='manageable'||a.subs==='unknown'?'rhythm':'ahead';
  // The step that matches the result comes first, so the plan and the stage agree.
  const lead={fog:needs[0],cushion:'cushion',rhythm:['payday','debt','subs'].find(key=>needs.includes(key))}[stage];
  if(lead) needs.splice(needs.indexOf(lead),1),needs.unshift(lead);
  let steps=needs.slice(0,3);
  if(decision&&!steps.includes(decision)) steps=[...steps.slice(0,2),decision];
  for(const filler of ['moneydate','learn','subs']) if(steps.length<3&&!steps.includes(filler)) steps.push(filler);
  let chapters=[...needs,...(decision?[decision]:[])].map(key=>setup.chapterFor[key]).filter(Boolean);
  chapters=[...new Set(chapters)].slice(0,3);
  const decisionChapter=decision&&setup.chapterFor[decision];
  if(decisionChapter&&!chapters.includes(decisionChapter)) chapters=[...chapters.slice(0,2),decisionChapter];
  for(const filler of [8,11,12]) if(chapters.length<3&&!chapters.includes(filler)) chapters.push(filler);
  chapters.sort((x,y)=>x-y);
  return {stage,steps,chapters,life:Number(a.life??0)};
 };
 window.quietWealthCheckup={result};

 const root=document.querySelector('[data-checkup]');
 if(!root||!cfg) return;
 const form=root.querySelector('form');
 const sets=[...form.querySelectorAll('[data-question]')];
 const intro=root.querySelector('[data-checkup-intro]');
 const bar=root.querySelector('[data-checkup-bar]');
 const count=root.querySelector('[data-checkup-count]');
 const back=root.querySelector('[data-checkup-back]');
 const next=root.querySelector('[data-checkup-next]');
 const out=root.querySelector('[data-checkup-result]');
 let index=-1;
 const esc=text=>String(text).replace(/[&<>"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[ch]);

 const show=i=>{
  index=i;
  root.classList.toggle('is-asking',i>=0&&i<sets.length);
  root.classList.toggle('is-done',i>=sets.length);
  intro.hidden=i>=0;
  sets.forEach((set,n)=>{set.hidden=n!==i;});
  back.hidden=i<=0||i>=sets.length;
  // Going back to an answered question: re-picking the same answer fires no change event, so offer Next.
  next.hidden=!(i>=0&&i<sets.length&&sets[i].querySelector('input:checked'));
  bar.style.setProperty('--done',Math.max(0,Math.min(i,sets.length))/sets.length);
  count.textContent=i>=0&&i<sets.length?cfg.progress.replace('{n}',i+1).replace('{total}',sets.length):'';
  if(i>=0&&i<sets.length) (sets[i].querySelector('input:checked')||sets[i].querySelector('input')).focus({preventScroll:true});
 };

 const finish=()=>{
  const answers=Object.fromEntries(new FormData(form));
  const r=result(answers,cfg);
  const [name,body]=cfg.stages[r.stage];
  const chapters=config.chapters||[];
  out.innerHTML=`<p class="eyebrow">${esc(cfg.resultEyebrow)}</p><h3>${esc(name)}</h3><p class="checkup-stage-body">${esc(body)}</p>
<div class="checkup-plan"><section><h4>${esc(cfg.stepsTitle)}</h4><ol>${r.steps.map(key=>`<li>${esc(cfg.steps[key])}</li>`).join('')}</ol></section>
<section><h4>${esc(cfg.chaptersTitle)}</h4><ul class="checkup-chapters">${r.chapters.map(n=>`<li><span>${String(n).padStart(2,'0')}</span><div><strong>${esc(chapters[n-1]?.title||'')}</strong><small>${esc(chapters[n-1]?.body||'')}</small></div></li>`).join('')}</ul></section></div>
<p class="checkup-life"><strong>${esc(cfg.lifeTitle)}:</strong> ${esc(config.readerDescriptions?.[r.life]||'')}</p>
<div class="checkup-actions"><button class="button" type="button" data-checkup-print>${esc(cfg.print)}</button><a class="text-link" href="#the-pack">${esc(cfg.toPack)}</a><button class="checkup-retake" type="button" data-checkup-retake>${esc(cfg.retake)}</button></div>
<p class="fine-print">${esc(cfg.disclaimer)}</p>`;
  out.hidden=false;
  show(sets.length);
  out.querySelector('h3').setAttribute('tabindex','-1');
  out.querySelector('h3').focus({preventScroll:true});
  root.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
  window.dispatchEvent(new CustomEvent('quietwealth:analytics',{detail:{name:'Check-up finished',props:{stage:r.stage}}}));
 };

 root.querySelector('[data-checkup-start]').addEventListener('click',()=>show(0));
 back.addEventListener('click',()=>show(Math.max(0,index-1)));
 next.addEventListener('click',()=>index>=sets.length-1?finish():show(index+1));
 form.addEventListener('change',event=>{
  if(!event.target.matches('input[type="radio"]')) return;
  // A short pause lets the chosen answer register visually before the next question.
  setTimeout(()=>index>=sets.length-1?finish():show(index+1),260);
 });
 form.addEventListener('submit',event=>{event.preventDefault();finish();});
 out.addEventListener('click',event=>{
  if(event.target.closest('[data-checkup-retake]')){form.reset();out.hidden=true;show(0);}
  if(event.target.closest('[data-checkup-print]')){
   document.documentElement.dataset.print='checkup';
   window.print();
   setTimeout(()=>delete document.documentElement.dataset.print,500);
  }
 });
 root.classList.add('is-ready');
 show(-1);
})();

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

/* Edition 9 interactions. Nothing here intercepts scrolling or sends what visitors type. */
(() => {
 'use strict';
 const root=document.documentElement;
 // The checkout and tool fixtures run this file without a real page; nothing below applies there.
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
 if(book && toggle){
  // The cover opens as the book rises past the middle of the screen; once the reader uses the button, their choice wins.
  let chosen=null;
  const paintBook=()=>{
   const box=area.getBoundingClientRect();
   const start=Math.max(0,box.top+scrollY-innerHeight*.55);
   const scrolled=moving()?Math.min(1,Math.max(0,(scrollY-start)/(box.height*.5))):0;
   const open=chosen===null?scrolled:chosen;
   book.style.setProperty('--open',open.toFixed(3));
   const shown=open>.5;
   toggle.setAttribute('aria-pressed',String(shown));
   toggle.querySelector('[data-open-label]').hidden=shown;
   toggle.querySelector('[data-close-label]').hidden=!shown;
  };
  toggle.addEventListener('click',()=>{chosen=Number(book.style.getPropertyValue('--open'))>.5?0:1;paintBook();});
  addEventListener('scroll',()=>{if(chosen===null) requestAnimationFrame(paintBook);},{passive:true});
  paintBook();
 }

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

 // Alicia's signature writes itself the first time the letter scrolls into view.
 const sign=document.querySelector('[data-signature]');
 if(sign && moving() && 'IntersectionObserver' in window && sign.getBoundingClientRect().top>innerHeight){
  sign.classList.add('is-pending');
  const watch=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){sign.classList.add('is-signed');watch.disconnect();}},{rootMargin:'0px 0px -15% 0px'});
  watch.observe(sign);
  document.querySelector('[data-motion-toggle]')?.addEventListener('click',()=>sign.classList.add('is-signed'));
 }

 // Viewer comments: the first six show; the rest wait behind a button.
 const more=document.querySelector('[data-comments-more]');
 if(more){
  const wall=more.closest('.comments');
  more.hidden=false;
  more.addEventListener('click',()=>{
   const open=wall.classList.toggle('show-all');
   more.setAttribute('aria-expanded',String(open));
   more.textContent=open?more.dataset.less:more.dataset.more;
  });
 }

 // Gentle reveals for content below the first screen. Anything already visible stays put.
 const reveal=[...document.querySelectorAll('.section-head,.volume,.tile,.leak-card,.checkup-card,.sheet-stack,.path li,.person,.dial,.chapter-card,.readers-art,.letter,.offer-card,.faq-list,.finale-inner')];
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
