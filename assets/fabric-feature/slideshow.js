(()=>{
 const root=document.querySelector('.evolution'),track=root.querySelector('.track'),cards=[...root.querySelectorAll('.frame')],tabs=[...root.querySelectorAll('[data-slide]')],arrows=[...root.querySelectorAll('[data-step]')],status=root.querySelector('#gallery-status'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let active=-1,animation=0,timer=0,drag=null;
 const position=i=>cards[i].offsetLeft-cards[0].offsetLeft;
 function setActive(i){if(i===active)return;active=i;cards.forEach((c,n)=>c.classList.toggle('active',n===i));tabs.forEach((b,n)=>n===i?b.setAttribute('aria-current','step'):b.removeAttribute('aria-current'));arrows[0].disabled=i===0;arrows[1].disabled=i===cards.length-1;}
 function nearest(){return cards.reduce((best,_,i)=>Math.abs(position(i)-track.scrollLeft)<Math.abs(position(best)-track.scrollLeft)?i:best,0);}
 function announce(){status.textContent=`${active+1} of ${cards.length}. ${cards[active].querySelector('h3').textContent}. ${cards[active].querySelector('time').textContent}.`;}
 function stop(){cancelAnimationFrame(animation);animation=0;}
 function go(i){stop();i=Math.max(0,Math.min(cards.length-1,i));const start=track.scrollLeft,distance=position(i)-start;if(reduced.matches||document.documentElement.classList.contains("motion-off")){track.scrollLeft=position(i);setActive(i);announce();return;}const begin=performance.now();track.style.scrollSnapType='none';const duration=Math.min(850,520+Math.abs(distance)*.13);function step(now){const t=Math.min(1,(now-begin)/duration),ease=1-Math.pow(1-t,4);track.scrollLeft=start+distance*ease;if(t<1)animation=requestAnimationFrame(step);else{animation=0;track.style.scrollSnapType='';setActive(i);announce();}}animation=requestAnimationFrame(step);}
 tabs.forEach((b,i)=>b.addEventListener('click',()=>go(i)));arrows.forEach(b=>b.addEventListener('click',()=>go(active+Number(b.dataset.step))));
 track.addEventListener('scroll',()=>{setActive(nearest());clearTimeout(timer);timer=setTimeout(()=>{if(!drag&&!animation)announce();},160);},{passive:true});
 track.addEventListener('keydown',e=>{const target={ArrowRight:active+1,ArrowLeft:active-1,Home:0,End:cards.length-1}[e.key];if(target!==undefined){e.preventDefault();go(target);}});
 track.addEventListener('wheel',()=>{stop();track.style.scrollSnapType='';},{passive:true});
 track.addEventListener('pointerdown',e=>{stop();track.style.scrollSnapType='';if(e.pointerType!=='mouse'||e.button!==0)return;drag={x:e.clientX,start:track.scrollLeft};track.classList.add('dragging');track.setPointerCapture(e.pointerId);});
 track.addEventListener('pointermove',e=>{if(drag)track.scrollLeft=drag.start+drag.x-e.clientX;});
 function release(){if(!drag)return;drag=null;track.classList.remove('dragging');go(nearest());}
 track.addEventListener('pointerup',release);track.addEventListener('pointercancel',release);
 window.addEventListener('resize',()=>{stop();track.style.scrollSnapType='';track.scrollLeft=position(Math.max(0,active));});
 function resetToPrompt(){stop();track.style.scrollSnapType='none';track.scrollTo({left:0,behavior:'instant'});setActive(0);announce();requestAnimationFrame(()=>{track.style.scrollSnapType='';});}
 resetToPrompt();
 window.addEventListener('pageshow',()=>requestAnimationFrame(resetToPrompt));
 // Invite exploration once the arrow itself is visible, not while it is offscreen.
 const nextArrow=arrows[1];let explored=false,cueTimer=0;
 function dismissCue(){explored=true;clearTimeout(cueTimer);nextArrow.classList.remove('explore-cue');cueObserver.disconnect();}
 const cueObserver=new IntersectionObserver(entries=>{
  if(explored||!entries.some(entry=>entry.isIntersecting)||nextArrow.disabled)return;
  nextArrow.classList.add('explore-cue');cueObserver.disconnect();
  cueTimer=setTimeout(()=>nextArrow.classList.remove('explore-cue'),6000);
 },{threshold:.8});
 cueObserver.observe(nextArrow);
 [...tabs,...arrows].forEach(control=>control.addEventListener('click',dismissCue));
 track.addEventListener('pointerdown',dismissCue,{passive:true});
 track.addEventListener('keydown',event=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(event.key))dismissCue();});
 track.addEventListener('scroll',()=>{if(track.scrollLeft>8)dismissCue();},{passive:true});
})();
