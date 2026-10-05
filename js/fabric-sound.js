/* Optional score for the AI page. Dormant until a track is declared with
   <meta name="osl-score" content="assets/audio/fabric-theme.mp3"> in ai.html,
   so no request is made today. It is always off until the
   visitor chooses it, fades in gently, sits well beneath the experience,
   and lifts the fabric's breeze slightly with the music's own energy. */
(()=>{'use strict';
const SRC=document.querySelector('meta[name="osl-score"]')?.content,KEY='osl-fabric-sound',VOLUME=.30;
if(!SRC)return;
fetch(SRC,{method:'HEAD'}).then(r=>{if(r.ok&&/audio|mpeg|octet/.test(r.headers.get('content-type')||''))mount();}).catch(()=>{});
function mount(){
  const button=document.createElement('button');button.type='button';button.className='lumen-sound';
  button.innerHTML='<i aria-hidden="true"><b></b><b></b><b></b></i><span>Sound</span>';
  button.setAttribute('aria-pressed','false');button.setAttribute('aria-label','Play the score');document.body.append(button);
  const audio=new Audio(SRC);audio.loop=true;audio.preload='none';audio.crossOrigin='anonymous';
  let context=null,gain=null,analyser=null,data=null,on=false,frame=0,level=0;
  function graph(){
    if(context)return;
    context=new (window.AudioContext||window.webkitAudioContext)();
    const source=context.createMediaElementSource(audio);gain=context.createGain();gain.gain.value=0;
    analyser=context.createAnalyser();analyser.fftSize=512;data=new Uint8Array(analyser.fftSize);
    source.connect(analyser);analyser.connect(gain);gain.connect(context.destination);
  }
  function listen(){
    frame=0;if(!analyser)return;
    analyser.getByteTimeDomainData(data);let sum=0;for(const v of data){const x=(v-128)/128;sum+=x*x;}
    const rms=Math.sqrt(sum/data.length);
    // Slow attack and slower release: the music breathes into the silk, never jolts it.
    level+=(Math.min(1,rms*5)-level)*(rms*5>level?.04:.015);
    window.oslMusicLevel=on?level:level*.96;
    if(on||level>.01)frame=requestAnimationFrame(listen);else window.oslMusicLevel=0;
  }
  async function set(next){
    on=next;button.setAttribute('aria-pressed',String(on));button.setAttribute('aria-label',on?'Pause the score':'Play the score');
    try{sessionStorage.setItem(KEY,on?'1':'0');}catch{}
    graph();if(context.state==='suspended')await context.resume();
    const now=context.currentTime;gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(gain.gain.value,now);
    if(on){try{await audio.play();}catch{on=false;button.setAttribute('aria-pressed','false');return;}gain.gain.linearRampToValueAtTime(VOLUME,now+3.5);if(!frame)frame=requestAnimationFrame(listen);}
    else{gain.gain.linearRampToValueAtTime(0,now+1.4);setTimeout(()=>{if(!on)audio.pause();},1500);}
  }
  button.addEventListener('click',()=>set(!on));
  // Remembered within the session, but browsers still need a gesture to begin.
  let wanted=false;try{wanted=sessionStorage.getItem(KEY)==='1';}catch{}
  if(wanted){button.setAttribute('aria-pressed','true');const resume=()=>{removeEventListener('pointerdown',resume);if(!on)set(true);};addEventListener('pointerdown',resume,{once:true});}
  document.addEventListener('visibilitychange',()=>{if(!context||!on)return;const now=context.currentTime;gain.gain.cancelScheduledValues(now);gain.gain.setValueAtTime(gain.gain.value,now);gain.gain.linearRampToValueAtTime(document.hidden?0:VOLUME,now+(document.hidden?.6:2.5));});
}
})();
