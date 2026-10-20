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
