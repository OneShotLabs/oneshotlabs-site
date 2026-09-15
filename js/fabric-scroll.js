/* Scroll-paced editorial transition; native scrolling remains untouched. */
(()=>{'use strict';
const caption=document.querySelector('.woven-method'),reduce=matchMedia('(prefers-reduced-motion: reduce)');let frame=0;
const smooth=v=>{const x=Math.max(0,Math.min(1,v));return x*x*(3-2*x)};
function paint(){frame=0;const b=caption.getBoundingClientRect(),h=innerHeight;
const reading=caption.matches(':focus-within')||caption.querySelector('.method-expansion').open;
const enter=smooth((h*.98-b.top)/(h*.30)),leave=smooth((-b.top)/(Math.max(b.height,120)*.85));
const strength=reduce.matches||reading?1:enter*(1-leave);
caption.style.setProperty('--caption-opacity',String(.12+.88*strength));
caption.style.setProperty('--caption-shift',reduce.matches||reading?'0px':`${14*(1-enter)-10*leave}px`);
}
function schedule(){if(!frame)frame=requestAnimationFrame(paint)}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
caption.addEventListener('focusin',schedule);caption.addEventListener('focusout',schedule);caption.querySelector('.method-expansion').addEventListener('toggle',schedule);reduce.addEventListener('change',schedule);new ResizeObserver(schedule).observe(caption);paint();
})();
