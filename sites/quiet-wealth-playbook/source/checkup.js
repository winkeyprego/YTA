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
