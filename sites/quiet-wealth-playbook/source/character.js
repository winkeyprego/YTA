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
