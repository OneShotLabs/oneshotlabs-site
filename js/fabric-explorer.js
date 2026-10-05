/* In-page inspection mode: the real artwork and its controls share a viewport. */
(()=>{'use strict';
const expansion=document.querySelector('.method-expansion'),fabric=document.querySelector('.fabric'),method=document.querySelector('.woven-method'),heroCopy=fabric.querySelector('.copy');
function sync(){document.body.classList.toggle('exploring-system',expansion.open);heroCopy.hidden=expansion.open;heroCopy.setAttribute('aria-hidden',String(expansion.open));
requestAnimationFrame(()=>{if(expansion.open)fabric.scrollIntoView({behavior:'instant',block:'start'});else method.scrollIntoView({behavior:'instant',block:'end'});});}
expansion.addEventListener('toggle',sync);
// A founder's note appears shortly after the system opens. Once folded it
// stays folded for the session; the tab reopens it at any time.
const note=document.querySelector('#founder-note'),tab=note?.querySelector('.founder-note-tab');
let noteTimer=0;
function fold(folded){note.classList.toggle('is-folded',folded);tab.setAttribute('aria-expanded',String(!folded));try{sessionStorage.setItem('osl-founder-note',folded?'folded':'open');}catch{}}
if(note){
  tab.addEventListener('click',()=>fold(!note.classList.contains('is-folded')));
  let saved=null;try{saved=sessionStorage.getItem('osl-founder-note');}catch{}
  if(saved==='folded')fold(true);
  expansion.addEventListener('toggle',()=>{clearTimeout(noteTimer);
    if(expansion.open){note.hidden=false;noteTimer=setTimeout(()=>note.classList.add('is-visible'),matchMedia('(prefers-reduced-motion:reduce)').matches?0:1100);}
    else note.classList.remove('is-visible');});
}
fabric.querySelector('.copy a').addEventListener('click',e=>{e.preventDefault();expansion.open=true;expansion.querySelector('summary').focus({preventScroll:true});});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&expansion.open){expansion.open=false;expansion.querySelector('summary').focus({preventScroll:true});}});
})();
