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
