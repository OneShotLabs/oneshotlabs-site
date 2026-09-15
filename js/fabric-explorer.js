/* In-page inspection mode: the real artwork and its controls share a viewport. */
(()=>{'use strict';
const expansion=document.querySelector('.method-expansion'),fabric=document.querySelector('.fabric'),method=document.querySelector('.woven-method');
function sync(){document.body.classList.toggle('exploring-system',expansion.open);
requestAnimationFrame(()=>{if(expansion.open)fabric.scrollIntoView({behavior:'instant',block:'start'});else method.scrollIntoView({behavior:'instant',block:'end'});});}
expansion.addEventListener('toggle',sync);
fabric.querySelector('.copy a').addEventListener('click',e=>{e.preventDefault();expansion.open=true;expansion.querySelector('summary').focus({preventScroll:true});});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&expansion.open){expansion.open=false;expansion.querySelector('summary').focus({preventScroll:true});}});
})();
