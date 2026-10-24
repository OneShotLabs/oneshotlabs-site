(() => {
  const splash = document.getElementById("splash");
  if (!splash) return;

  const pending = new Set();
  function scheduleIntro(callback, delay) {
    const id = window.setTimeout(() => {pending.delete(id);callback();},delay);
    pending.add(id);
    return id;
  }
  const skip = document.getElementById('intro-skip');
  const background = [document.querySelector('.site-header'),document.getElementById('smooth-wrapper')];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const quoteEl = document.getElementById("splash-quote");
  const stageEl = document.getElementById("splash-quote-stage");
  const frameEl = document.querySelector(".splash-frame");
  const iconFrameEl = document.querySelector(".splash-icon-frame");

  const LINE1 = "Good things come to those who wait,";
  const LINE2 = "but only things left over by those who";
  const LINE3 = "hustle.";

  let playing = false;

  function finish() {
    pending.forEach(clearTimeout);
    pending.clear();
    const hadFocus = document.activeElement === skip;
    skip.hidden = true;
    background.forEach(element => {if(element) element.inert = false;});
    document.documentElement.classList.add('no-splash');
    if (hadFocus) {
      const heading = document.getElementById('launch-film-heading');
      heading.tabIndex = -1;
      heading.focus({preventScroll:true});
    }
    splash.style.display = "none";
    document.body.style.overflow = "";
    playing = false;
  }

  const DIAL_DONE = 950;
  const CLICK_DUR = 220; // matches splash-bolt-click's duration in CSS
  const DOORS_DUR = 500; // matches splash-panel-*-out's duration in CSS
  const FINISH_BUFFER = 200;

  let clickable = false;
  let doorsOpened = false;
  let shutterTimer = null;
  let openTimer = null;
  let finishTimer = null;

  function openDoors() {
    if (doorsOpened) return;
    doorsOpened = true;
    clickable = false;
    if (frameEl) frameEl.classList.remove("clickable");
    splash.classList.add("doors-open");
    finishTimer = scheduleIntro(finish, DOORS_DUR + FINISH_BUFFER);
  }

  function fireShutter() {
    if (!clickable || doorsOpened) return;
    clickable = false;
    if (frameEl) frameEl.classList.remove("clickable");
    clearTimeout(shutterTimer);
    if (frameEl) frameEl.classList.add("clicked");
    if (iconFrameEl) iconFrameEl.classList.add("clicked");
    openTimer = scheduleIntro(openDoors, CLICK_DUR);
  }

  function playSplash() {
    if (playing) return;
    playing = true;
    skip.hidden = false;
    background.forEach(element => {if(element) element.inert = true;});
    skip.focus({preventScroll:true});

    clickable = false;
    doorsOpened = false;
    clearTimeout(shutterTimer);
    clearTimeout(openTimer);
    clearTimeout(finishTimer);
    if (frameEl) frameEl.classList.remove("clickable", "clicked");
    if (iconFrameEl) iconFrameEl.classList.remove("clicked");

    document.documentElement.classList.remove("no-splash");
    splash.style.display = "";
    splash.classList.remove("animate", "doors-open", "reduced", "quote-reduced");
    stageEl.classList.remove("quote-done");
    quoteEl.innerHTML = "";
    document.body.style.overflow = "hidden";

    const clause1 = document.createElement("span");
    clause1.className = "splash-quote-clause";
    clause1.textContent = LINE1;
    const clause2 = document.createElement("span");
    clause2.className = "splash-quote-clause";
    clause2.textContent = LINE2;
    const finale = document.createElement("span");
    finale.className = "splash-quote-finale";
    finale.textContent = LINE3;
    quoteEl.append(clause1, clause2, finale);

    if (reduced) {
      clause1.style.opacity = 1;
      clause2.style.opacity = 1;
      finale.style.opacity = 1;
      splash.classList.add("reduced", "quote-reduced");
      scheduleIntro(finish, 260);
      return;
    }

    const START_DELAY = 300;
    const FADE = 700;
    const PAUSE = 750;
    const PAUSE_BEFORE_HUSTLE = 998; // 750ms base, extended 33%
    const CLAUSE1_START = START_DELAY;
    const CLAUSE2_START = CLAUSE1_START + FADE + PAUSE;
    const FINALE_START = CLAUSE2_START + FADE + PAUSE_BEFORE_HUSTLE;
    const UNDERLINE_START = FINALE_START + 380;

    scheduleIntro(() => {
      clause1.style.animation = "splash-clause-fade 700ms ease-out forwards";
    }, CLAUSE1_START);

    scheduleIntro(() => {
      clause2.style.animation = "splash-clause-fade 700ms ease-out forwards";
    }, CLAUSE2_START);

    scheduleIntro(() => {
      finale.style.animation = "punch-drop 220ms cubic-bezier(0.55,0,1,0.45) forwards";
    }, FINALE_START);

    scheduleIntro(() => {
      finale.classList.add("impact-flash");
    }, FINALE_START + 150);

    scheduleIntro(() => {
      finale.classList.add("underline-go");
    }, UNDERLINE_START);

    const QUOTE_DONE = UNDERLINE_START + 163 + 1250; // pause 1.25s after underline before quote fades
    const QUOTE_FADE = 616; // quote fades out
    scheduleIntro(() => {
      stageEl.classList.add("quote-done");
    }, QUOTE_DONE);

    scheduleIntro(() => {
      splash.classList.add("animate");
      clickable = true;
      shutterTimer = scheduleIntro(fireShutter, DIAL_DONE);
    }, QUOTE_DONE + QUOTE_FADE); // logo pops on screen right as the quote finishes fading
  }

  skip.addEventListener('click',finish);
  document.addEventListener('keydown',event => {
    if (playing && event.key === 'Escape') {event.preventDefault();finish();}
  });
  let seen = false;
  try { seen = sessionStorage.getItem("oneshot-splash-seen") === "1"; } catch {}
  if (reduced || seen) {
    skip.hidden = true;
    splash.style.display = "none";
    return;
  }
  try { sessionStorage.setItem("oneshot-splash-seen", "1"); } catch {}
  playSplash();
})();
