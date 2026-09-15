/* Branded frontier metaphor; the participant score and score marker are untouched. */
(()=>{'use strict';const root=document.querySelector('#ai-curve-app'),ns='http://www.w3.org/2000/svg';
function scan(){root.querySelectorAll('.curve-frontier-marker').forEach(dot=>{const svg=dot.closest('svg'),curve=svg.querySelector('.curve-line'),mark=document.createElementNS(ns,'g'),logo=document.querySelector('.logo-icon svg').cloneNode(true);
logo.setAttribute('x','-11');logo.setAttribute('y','-11');logo.setAttribute('width','22');logo.setAttribute('height','22');logo.style.color='#1d2f4e';logo.style.setProperty('--trim','#c6a153');
logo.querySelectorAll('[id]').forEach(el=>el.id='frontier-'+el.id);logo.querySelectorAll('use').forEach(el=>{for(const attr of ['href','xlink:href']){const value=el.getAttribute(attr);if(value)el.setAttribute(attr,value.replace('#','#frontier-'));}});mark.append(logo);mark.classList.add('curve-frontier-brand');dot.replaceWith(mark);
const length=curve.getTotalLength(),reduce=matchMedia('(prefers-reduced-motion:reduce)');let frame=0,start=0;
const turns=Math.max(1,Math.round(length/(2*Math.PI*11)));
const place=t=>{const p=curve.getPointAtLength(length*t),rotation=reduce.matches?0:turns*360*t;mark.setAttribute('transform',`translate(${p.x} ${p.y}) rotate(${rotation})`);mark.dataset.progress=String(t);};place(reduce.matches?1:0);
function animate(now){if(!svg.isConnected)return;if(reduce.matches){place(1);return}start||=now;const t=Math.min(1,(now-start)/2200),ease=t*t*(3-2*t);place(ease);if(t<1)frame=requestAnimationFrame(animate);}
const observer=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){observer.disconnect();if(reduce.matches)place(1);else frame=requestAnimationFrame(animate);}},{threshold:.4});observer.observe(svg);reduce.addEventListener('change',()=>{if(reduce.matches){cancelAnimationFrame(frame);place(1)}});
});}
new MutationObserver(scan).observe(root,{childList:true,subtree:true});scan();})();
