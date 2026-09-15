/* Presentation wrapper only. The existing question bank and scoring client are unchanged. */
(()=>{'use strict';const section=document.querySelector('#questionnaire'),root=document.querySelector('#ai-curve-app'),entry=document.querySelector('.horizon .copy a'),back=document.querySelector('#return-to-globe');let loading;
function load(){return loading||(loading=new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='js/ai-curve.js?v=20260914-merged1';s.onload=resolve;s.onerror=reject;document.body.append(s)}));}
entry.addEventListener('click',async e=>{e.preventDefault();section.hidden=false;document.body.classList.add('questionnaire-open');section.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'start'});try{await load();}catch{root.textContent='The questionnaire could not load. Refresh this page to try again.'}back.focus({preventScroll:true});});
back.addEventListener('click',()=>{section.hidden=true;document.body.classList.remove('questionnaire-open');document.querySelector('#horizon').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});entry.focus({preventScroll:true});});
let pausedForQuestions=false;
new MutationObserver(()=>{const mark=root.querySelector('.curve-scoring-mark');if(mark&&!mark.querySelector('svg')){const logo=document.querySelector('.logo-icon svg').cloneNode(true);logo.querySelectorAll('[id]').forEach(el=>el.id='loading-'+el.id);logo.querySelectorAll('use').forEach(el=>{for(const attr of ['href','xlink:href']){const ref=el.getAttribute(attr);if(ref)el.setAttribute(attr,ref.replace('#','#loading-'));}});mark.replaceChildren(logo);}
const result=Boolean(root.querySelector('.curve-result'));section.classList.toggle('has-result',result);document.body.classList.toggle('assessment-result',result);
const pause=document.querySelector('#globe-motion');if(!result&&!section.hidden&&pause.getAttribute('aria-pressed')==='false'){pause.click();pausedForQuestions=true;}else if(result&&pausedForQuestions){if(pause.getAttribute('aria-pressed')==='true')pause.click();pausedForQuestions=false;}
if(!section.hidden&&root.querySelector('.curve-question-panel,.curve-result'))requestAnimationFrame(()=>section.scrollIntoView({behavior:'instant',block:'start'}));}).observe(root,{childList:true});
back.addEventListener('click',()=>{if(pausedForQuestions){const pause=document.querySelector('#globe-motion');if(pause.getAttribute('aria-pressed')==='true')pause.click();pausedForQuestions=false;}});
if(location.hash==='#ai-curve'||location.hash==='#questionnaire')entry.click();
// Isolated design-review entry point; never replace a real assessment session.
if(new URLSearchParams(location.search).get('preview')==='results'&&['127.0.0.1','localhost'].includes(location.hostname)){
(async()=>{const namespace='fabric-design-result';root.dataset.storageNamespace=namespace;
const answers={q01:'d',q02:'c',q03:'c',q05:'b',q06:'b',q08:'d',q09:'c',q10:'b',q12:'d',q15:'d'};
section.querySelector('.questionnaire-note').textContent='SAMPLE RESULT · Scored from illustrative answers for design review. This is not your assessment. No participant locations or live submissions.';
try{const response=await fetch('/.netlify/functions/score-curve',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({assessment_version:'2026.08-10q-v1',answers})});if(!response.ok)throw Error('Local scorer unavailable');const result=await response.json();sessionStorage.setItem(`oneshot-ai-curve-session-v2-${namespace}`,JSON.stringify({step:'result',answers,index:9,segmentation:{},answer_times_ms:{}}));sessionStorage.setItem(`oneshot-ai-curve-last-result-v2-${namespace}`,JSON.stringify(result));entry.click();
const sample=document.createElement('p');sample.className='questionnaire-note';sample.textContent='Sample result / Design preview';section.querySelector('.questionnaire-header>span').replaceChildren(sample);
}catch{section.hidden=false;root.textContent='The local results preview could not load. Check that the local scoring server is running, then refresh.';section.scrollIntoView();}})();}
})();
