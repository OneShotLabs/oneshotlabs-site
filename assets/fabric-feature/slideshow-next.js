/* The Fabric feature carousel (next). The published rebuild (default since the 2026-11 release).
   Same structure and controls as slideshow.js. Adds the eighth chapter (the
   Fable 5.2 rebuild), slower and softer travel, images that drift inside
   their frames, a prompt that types itself, a light that travels the
   timeline, and a 'fabric-chapter' event the backdrop listens to. */
(()=>{
 // ── Chapter eight ──────────────────────────────────────────────────────
 // Added here rather than in the page, so the published post keeps its seven.
 {
  const gallery=document.querySelector('.evolution'),list=gallery.querySelector('.track'),nav=gallery.querySelector('.timeline');
  const figure=document.createElement('figure');figure.className='frame';figure.id='phase-8';figure.setAttribute('role','group');figure.setAttribute('aria-roledescription','slide');
  figure.innerHTML='<div class="art"><img src="/assets/fabric-feature/08-fabric-rewoven-2026-11-09.png" alt="Preview of the rebuilt AI page: translucent woven silk with visible threads, suspended from two gold nodes against a starry navy sky" draggable="false" loading="lazy"></div><figcaption><div class="caption-date"><span>08 / 08</span><time datetime="2026-11-09">November 9, 2026 · preview build</time></div><h3>The Fabric, rewoven</h3><p>Rebuilt thread by thread in Fable 5.2: a weave that resolves up close, light carried in the yarn, and stars that settle into silk.</p></figcaption>';
  list.append(figure);
  const tab=document.createElement('button');tab.type='button';tab.dataset.slide='7';tab.setAttribute('aria-label','The Fabric, rewoven, November 9, 2026');
  tab.innerHTML='<span class="timeline-line"></span><span class="timeline-number">08</span><span class="timeline-date">Nov 09</span>';nav.append(tab);
  const figures=[...list.querySelectorAll('.frame')];
  figures.forEach((f,i)=>{f.setAttribute('aria-label',`${i+1} of ${figures.length}: ${f.querySelector('h3').textContent}`);f.querySelector('.caption-date>span').textContent=`${String(i+1).padStart(2,'0')} / ${String(figures.length).padStart(2,'0')}`;});
  gallery.querySelector('.gallery-heading .eyebrow').textContent='A study in eight iterations';
  gallery.querySelector('.gallery-period').textContent='AUG — NOV 2026';
  const light=document.createElement('span');light.className='timeline-light';light.setAttribute('aria-hidden','true');nav.append(light);
 }
 const root=document.querySelector('.evolution'),track=root.querySelector('.track'),cards=[...root.querySelectorAll('.frame')],tabs=[...root.querySelectorAll('[data-slide]')],arrows=[...root.querySelectorAll('[data-step]')],status=root.querySelector('#gallery-status'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let active=-1,animation=0,timer=0,drag=null;
 const position=i=>cards[i].offsetLeft-cards[0].offsetLeft;
 const timelineLight=root.querySelector('.timeline-light');let inView=0;
 function broadcast(){document.dispatchEvent(new CustomEvent('fabric-chapter',{detail:{index:Math.max(0,active),count:cards.length,weight:inView}}));}
 function moveLight(){const tab=tabs[Math.max(0,active)],nav=tab.parentElement.getBoundingClientRect(),box=tab.getBoundingClientRect();timelineLight.style.left=`${box.left-nav.left+box.width/2}px`;timelineLight.classList.add('is-lit');}
 // The first chapter writes itself out the first time it is read.
 const promptText=cards[0].querySelector('pre'),promptCursor=promptText.querySelector('.cursor'),promptFull=promptText.firstChild.textContent;let typed=false,typing=0;
 function typePrompt(){
  if(typed||reduced.matches||document.documentElement.classList.contains('motion-off'))return;typed=true;
  const node=promptText.firstChild,began=performance.now(),duration=5200;node.textContent='';
  (function write(now){const k=Math.min(1,(now-began)/duration);node.textContent=promptFull.slice(0,Math.round(promptFull.length*k));if(k<1)typing=requestAnimationFrame(write);})(began);
 }
 // Each image travels a few percent slower than its frame.
 function drift(){const centre=track.scrollLeft+track.clientWidth/2;for(const card of cards){const image=card.querySelector('.art img');if(!image)continue;const offset=(card.offsetLeft-cards[0].offsetLeft+card.offsetWidth/2-centre)/track.clientWidth;image.style.setProperty('--drift',`${(-offset*26).toFixed(1)}px`);}}
 function setActive(i){if(i===active)return;active=i;cards.forEach((c,n)=>c.classList.toggle('active',n===i));tabs.forEach((b,n)=>n===i?b.setAttribute('aria-current','step'):b.removeAttribute('aria-current'));arrows[0].disabled=i===0;arrows[1].disabled=i===cards.length-1;moveLight();broadcast();if(i===0&&inView>.5)typePrompt();}
 function nearest(){return cards.reduce((best,_,i)=>Math.abs(position(i)-track.scrollLeft)<Math.abs(position(best)-track.scrollLeft)?i:best,0);}
 function announce(){status.textContent=`${active+1} of ${cards.length}. ${cards[active].querySelector('h3').textContent}. ${cards[active].querySelector('time').textContent}.`;}
 function stop(){cancelAnimationFrame(animation);animation=0;}
 function go(i){stop();i=Math.max(0,Math.min(cards.length-1,i));const start=track.scrollLeft,distance=position(i)-start;if(reduced.matches||document.documentElement.classList.contains("motion-off")){track.scrollLeft=position(i);setActive(i);announce();return;}const begin=performance.now();track.style.scrollSnapType='none';// Slow and continuous: a gentle start, a long settle.
  const duration=Math.min(1500,1050+Math.abs(distance)*.16);function step(now){const t=Math.min(1,(now-begin)/duration),ease=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;track.scrollLeft=start+distance*ease;if(t<1)animation=requestAnimationFrame(step);else{animation=0;track.style.scrollSnapType='';setActive(i);announce();}}animation=requestAnimationFrame(step);}
 tabs.forEach((b,i)=>b.addEventListener('click',()=>go(i)));arrows.forEach(b=>b.addEventListener('click',()=>go(active+Number(b.dataset.step))));
 track.addEventListener('scroll',()=>{drift();setActive(nearest());clearTimeout(timer);timer=setTimeout(()=>{if(!drag&&!animation)announce();},160);},{passive:true});
 track.addEventListener('keydown',e=>{const target={ArrowRight:active+1,ArrowLeft:active-1,Home:0,End:cards.length-1}[e.key];if(target!==undefined){e.preventDefault();go(target);}});
 track.addEventListener('wheel',()=>{stop();track.style.scrollSnapType='';},{passive:true});
 track.addEventListener('pointerdown',e=>{stop();track.style.scrollSnapType='';if(e.pointerType!=='mouse'||e.button!==0)return;drag={x:e.clientX,start:track.scrollLeft};track.classList.add('dragging');track.setPointerCapture(e.pointerId);});
 track.addEventListener('pointermove',e=>{if(drag)track.scrollLeft=drag.start+drag.x-e.clientX;});
 function release(){if(!drag)return;drag=null;track.classList.remove('dragging');go(nearest());}
 track.addEventListener('pointerup',release);track.addEventListener('pointercancel',release);
 window.addEventListener('resize',()=>{stop();track.style.scrollSnapType='';track.scrollLeft=position(Math.max(0,active));});
 function resetToPrompt(){stop();track.style.scrollSnapType='none';track.scrollTo({left:0,behavior:'instant'});setActive(0);announce();requestAnimationFrame(()=>{track.style.scrollSnapType='';});}
 resetToPrompt();drift();
 new IntersectionObserver(([entry])=>{inView=entry.intersectionRatio;broadcast();if(inView>.5&&active===0)typePrompt();},{threshold:[0,.15,.3,.45,.6,.75,.9,1]}).observe(root);
 window.addEventListener('resize',()=>{moveLight();drift();});
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
