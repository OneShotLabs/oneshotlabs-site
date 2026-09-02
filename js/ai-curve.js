/* js/ai-curve.js
   OneShotLabs AI Curve — assessment flow, result reveal, curve visualization.
   No point values or dimension mappings live in this file; those stay
   server-side in netlify/functions/score-curve.js. This file only knows
   question/option text and the answer IDs the user picked. */

(function () {
  'use strict';

  const QUESTIONS_URL = 'data/ai-curve-questions-public.json';
  const SCORE_ENDPOINT = '/.netlify/functions/score-curve';
  const FRICTION_ENDPOINT = '/.netlify/functions/friction-feedback';
  const PARTICIPATION_ENDPOINT = '/api/participation';

  const root = document.getElementById('ai-curve-app');
  if (!root) return;
  const storageNamespace = root.dataset.storageNamespace || 'live';
  const SHARE_URL = root.dataset.shareUrl || 'https://oneshotlabs.com/ai-curve.html';
  const STORAGE_KEY = `oneshot-ai-curve-session-v2-${storageNamespace}`;
  const RESULT_KEY = `oneshot-ai-curve-last-result-v2-${storageNamespace}`;
  const HISTORY_KEY = `oneshot-ai-curve-history-v1-${storageNamespace}`;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** @type {{assessment_version:string, questions:Array, optional_unscored:Object, optional_segmentation:Object}} */
  let BANK = null;

  const state = {
    step: 'intro', // intro | question | segmentation | qualitative | submitting | result | error
    index: 0,
    answers: {},
    segmentation: {},
    qualitative: '',
    started_at: null,
    question_started_at: null,
    answer_times_ms: {},
  };

  function restoreSession() {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved && saved.answers) {
        Object.assign(state, saved);
      }
      if (state.step === 'result') {
        const savedResult = sessionStorage.getItem(RESULT_KEY);
        if (savedResult) state.result = JSON.parse(savedResult);
      }
    } catch {
      /* ignore corrupt session data */
    }
  }

  function persistSession() {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          step: state.step,
          index: state.index,
          answers: state.answers,
          segmentation: state.segmentation,
          qualitative: state.qualitative,
          started_at: state.started_at,
          answer_times_ms: state.answer_times_ms,
        })
      );
    } catch {
      /* sessionStorage may be unavailable (private browsing); non-fatal */
    }
  }

  function track(eventName, detail) {
    // Funnel analytics stub — wire to the site's real analytics provider
    // when one exists. Kept separate from scoring payloads on purpose.
    try {
      if (window.dataLayer) {
        window.dataLayer.push({ event: 'ai_curve_' + eventName, ...detail });
      }
    } catch {
      /* analytics must never break the assessment */
    }
  }

  function visitorId() {
    const key = 'oneshot-anonymous-visitor-v1';
    try {
      let value = localStorage.getItem(key);
      if (!value) {
        value = window.crypto?.randomUUID ? window.crypto.randomUUID() : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem(key, value);
      }
      return value;
    } catch {
      return '';
    }
  }

  async function loadLiveParticipation() {
    const recordedKey = 'oneshot-ai-curve-participation-recorded-v1';
    let method = 'GET';
    try { if (!sessionStorage.getItem(recordedKey)) method = 'POST'; } catch { /* non-fatal */ }
    const response = await fetch(PARTICIPATION_ENDPOINT, {
      method,
      headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
      body: method === 'POST' ? JSON.stringify({ visitor_id: visitorId() }) : undefined,
    });
    if (!response.ok) return null;
    const participation = await response.json();
    if (method === 'POST') {
      try { sessionStorage.setItem(recordedKey, '1'); } catch { /* non-fatal */ }
    }
    if (participation.status === 'live') return participation;
    return {
      status: 'pending',
      representative: false,
      total: 0,
      countries: 0,
      privacy_threshold: 3,
      locations: [],
    };
  }

  function insertLiveParticipation(participation) {
    if (!participation) return;
    state.result.participation = participation;
    const panel = root.querySelector('.curve-result');
    const disclosure = panel?.querySelector('.curve-disclosure');
    if (!panel || !disclosure) return;
    const globe = buildParticipationGlobe(participation);
    const existing = panel.querySelector('.curve-participation');
    if (existing) existing.replaceWith(globe);
    else disclosure.before(globe);
    try { sessionStorage.setItem(RESULT_KEY, JSON.stringify(state.result)); } catch { /* non-fatal */ }
  }

  function emptyParticipation() {
    return { status: 'pending', representative: false, total: 0, countries: 0, privacy_threshold: 3, locations: [] };
  }

  function applyLocalReturnRecognition(result) {
    try {
      const previous = JSON.parse(localStorage.getItem(HISTORY_KEY) || 'null');
      if (!result.recognition?.returning && previous) {
        result.recognition = {
          status: 'recognized_in_browser',
          returning: true,
          prior_attempts: Math.max(1, Number(previous.attempts) || 1),
          previous: {
            completed_at: previous.completed_at,
            level: previous.level,
            score: previous.score,
          },
        };
      }
      localStorage.setItem(HISTORY_KEY, JSON.stringify({
        attempts: Math.max(1, Number(result.recognition?.prior_attempts) + 1 || Number(previous?.attempts) + 1 || 1),
        completed_at: new Date().toISOString(),
        level: result.scoring.level,
        score: result.scoring.overall,
      }));
    } catch {
      /* Return recognition is an enhancement and must never block results. */
    }
    return result;
  }

  async function loadQuestions() {
    const res = await fetch(QUESTIONS_URL, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error('Could not load the assessment.');
    BANK = await res.json();
    if (Array.isArray(BANK.active_question_ids)) {
      const active = new Set(BANK.active_question_ids);
      BANK.questions = BANK.questions.filter((question) => active.has(question.id));
    }
  }

  function render() {
    root.innerHTML = '';
    root.appendChild(buildAssessmentBrand());
    switch (state.step) {
      case 'intro':
        renderIntro();
        break;
      case 'question':
        renderQuestion();
        break;
      case 'segmentation':
        renderSegmentation();
        break;
      case 'qualitative':
        renderQualitative();
        break;
      case 'submitting':
        renderSubmitting();
        break;
      case 'result':
        renderResult();
        break;
      case 'error':
        renderError();
        break;
    }
    persistSession();
  }

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (k === 'class') node.className = v;
        else if (k === 'html') node.innerHTML = v;
        else node.setAttribute(k, v);
      }
    }
    (children || []).forEach((c) => {
      if (c) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  // ---------- Intro ----------
  function renderIntro() {
    const wrap = el('div', { class: 'curve-panel curve-intro reveal is-visible' }, [
      el('p', { class: 'hero-eyebrow' }, ['OneShotLabs / AI Curve']),
      el('h2', {}, ['Where are you on the AI Curve?']),
      el('p', { class: 'curve-lede' }, [
        'A focused assessment of how you use AI professionally against today\u2019s capability frontier \u2014 10 questions and a straight read on where you stand.',
      ]),
      el('p', { class: 'muted' }, [
        'Built for professionals in finance, investing, real estate and other knowledge-intensive industries.',
      ]),
      el('ul', { class: 'curve-intro-facts' }, [
        el('li', {}, ['About 3 minutes']),
        el('li', {}, ['No email required']),
        el('li', {}, ['Private, server-side scoring']),
      ]),
      el('button', { class: 'btn btn-accent', id: 'curve-start' }, ['Take the Assessment \u2192']),
    ]);
    root.appendChild(wrap);
    document.getElementById('curve-start').addEventListener('click', () => {
      state.started_at = new Date().toISOString();
      state.step = 'question';
      state.index = 0;
      state.question_started_at = Date.now();
      track('start', {});
      render();
      focusPanel();
    });
  }

  // ---------- Question ----------
  function renderQuestion() {
    const q = BANK.questions[state.index];
    const total = BANK.questions.length;
    const answered = state.answers[q.id];

    const progress = el('div', { class: 'curve-progress', role: 'progressbar', 'aria-valuenow': String(state.index + 1), 'aria-valuemin': '1', 'aria-valuemax': String(total) }, [
      el('div', { class: 'curve-progress-fill', style: `width:${((state.index + 1) / total) * 100}%` }),
    ]);
    const progressLabel = el('p', { class: 'muted curve-progress-label' }, [
      `Question ${state.index + 1} of ${total}`,
    ]);

    const fieldset = el('fieldset', { class: 'curve-options' }, []);
    fieldset.appendChild(el('legend', { class: 'curve-question' }, [q.prompt]));

    q.options.forEach((opt) => {
      const id = `opt-${q.id}-${opt.id}`;
      const label = el('label', { class: 'curve-option', for: id }, []);
      const input = el('input', {
        type: 'radio',
        name: q.id,
        id,
        value: opt.id,
      });
      if (answered === opt.id) input.setAttribute('checked', 'checked');
      input.addEventListener('change', () => {
        state.answers[q.id] = opt.id;
        const elapsed = state.question_started_at ? Date.now() - state.question_started_at : null;
        if (elapsed !== null) state.answer_times_ms[q.id] = elapsed;
        track('answer', { question: q.id });
        render();
        focusPanel();
      });
      label.appendChild(input);
      label.appendChild(el('span', {}, [opt.text]));
      fieldset.appendChild(label);
    });

    const nav = el('div', { class: 'curve-nav' }, [
      el(
        'button',
        { class: 'btn curve-back', type: 'button', ...(state.index === 0 ? { disabled: 'disabled' } : {}) },
        ['\u2190 Back']
      ),
      el('button', { class: 'btn btn-accent curve-next', type: 'button', ...(answered ? {} : { disabled: 'disabled' }) }, [state.index === total - 1 ? 'Continue \u2192' : 'Next \u2192']),
    ]);
    nav.querySelector('.curve-back').addEventListener('click', goBack);
    nav.querySelector('.curve-next').addEventListener('click', goNext);

    const panel = el('div', { class: 'curve-panel curve-question-panel reveal is-visible', tabindex: '-1' }, [
      progress,
      progressLabel,
      fieldset,
      nav,
    ]);
    root.appendChild(panel);

  }

  function goNext() {
    if (state.index < BANK.questions.length - 1) {
      state.index += 1;
      state.question_started_at = Date.now();
      render();
      focusPanel();
    } else {
      state.step = 'segmentation';
      state.index = 0;
      render();
      focusPanel();
    }
  }

  function buildAssessmentBrand() {
    return el('div', { class: 'curve-brand-mark' }, [
      el('span', {}, [
        el('img', { src: 'favicon.svg', alt: 'OneShotLabs' }, []),
      ]),
    ]);
  }

  function goBack() {
    if (state.index > 0) {
      state.index -= 1;
      state.question_started_at = Date.now();
      render();
      focusPanel();
    }
  }

  function focusPanel() {
    const panel = root.querySelector('.curve-panel');
    if (panel) panel.focus({ preventScroll: false });
  }

  // ---------- Optional segmentation ----------
  function renderSegmentation() {
    const seg = BANK.optional_segmentation;
    const fields = ['industry', 'function', 'seniority', 'experience'];
    const labels = { industry: 'Industry', function: 'Function', seniority: 'Seniority', experience: 'Years of experience' };

    const form = el('div', { class: 'curve-panel curve-form reveal is-visible', tabindex: '-1' }, [
      el('p', { class: 'hero-eyebrow' }, ['Optional']),
      el('h2', {}, ['A little context (optional)']),
      el('p', { class: 'muted' }, ['Helps future benchmark comparisons. Skip anything you\u2019d rather not share.']),
    ]);

    fields.forEach((f) => {
      const row = el('div', { class: 'form-row' }, [el('label', { for: `curve-${f}` }, [labels[f]])]);
      const select = el('select', { id: `curve-${f}`, class: 'curve-select' }, [
        el('option', { value: '' }, ['Prefer not to say']),
        ...seg[f].map((opt) => el('option', { value: opt }, [opt])),
      ]);
      if (state.segmentation[f]) select.value = state.segmentation[f];
      select.addEventListener('change', () => {
        state.segmentation[f] = select.value;
      });
      row.appendChild(select);
      form.appendChild(row);
    });

    form.appendChild(
      el('p', { class: 'curve-data-note' }, [
        el('strong', {}, ['Private by design. ']),
        'No name or email is required. Responses may be retained without direct identifiers to improve the Curve and support aggregate research.',
      ])
    );

    const nav = el('div', { class: 'curve-nav' }, [
      el('button', { class: 'btn', type: 'button', id: 'curve-seg-back' }, ['\u2190 Back']),
      el('button', { class: 'btn btn-accent', type: 'button', id: 'curve-seg-continue' }, ['See my results \u2192']),
    ]);
    form.appendChild(nav);
    root.appendChild(form);

    document.getElementById('curve-seg-back').addEventListener('click', () => {
      state.step = 'question';
      state.index = BANK.questions.length - 1;
      state.question_started_at = Date.now();
      render();
      focusPanel();
    });

    document.getElementById('curve-seg-continue').addEventListener('click', () => {
      submit();
    });
  }

  // ---------- Optional qualitative ----------
  function renderQualitative() {
    const q = BANK.optional_unscored;
    const panel = el('div', { class: 'curve-panel curve-form reveal is-visible', tabindex: '-1' }, [
      el('p', { class: 'hero-eyebrow' }, ['Optional']),
      el('h2', {}, [q.prompt]),
      el('p', { class: 'muted' }, [q.warning]),
    ]);
    const row = el('div', { class: 'form-row' }, []);
    const textarea = el('textarea', { id: 'curve-qualitative', rows: '4', maxlength: '2000' }, []);
    textarea.value = state.qualitative || '';
    textarea.addEventListener('input', () => {
      state.qualitative = textarea.value;
    });
    row.appendChild(textarea);
    panel.appendChild(row);

    const nav = el('div', { class: 'curve-nav' }, [
      el('button', { class: 'btn', type: 'button', id: 'curve-qual-back' }, ['\u2190 Back']),
      el('button', { class: 'btn btn-accent', type: 'button', id: 'curve-see-result' }, ['See my results \u2192']),
    ]);
    panel.appendChild(nav);
    root.appendChild(panel);

    document.getElementById('curve-qual-back').addEventListener('click', () => {
      state.step = 'segmentation';
      render();
      focusPanel();
    });

    document.getElementById('curve-see-result').addEventListener('click', submit);
  }

  // ---------- Submit / score ----------
  function renderSubmitting() {
    root.appendChild(
      el('div', { class: 'curve-panel curve-submitting reveal is-visible' }, [
        el('div', { class: 'curve-scoring-mark', 'aria-hidden': 'true' }, [
          el('span', {}, []), el('span', {}, []), el('span', {}, []), el('span', {}, []),
        ]),
        el('p', { class: 'curve-scoring-label' }, ['Mapping your position']),
        el('p', { class: 'muted' }, ['Scoring your responses\u2026']),
      ])
    );
  }

  function renderError() {
    root.appendChild(
      el('div', { class: 'curve-panel reveal is-visible' }, [
        el('p', {}, ['Something interrupted the assessment. Your answers are still saved in this browser tab \u2014 refresh to try again.']),
        el('button', { class: 'btn', id: 'curve-retry' }, ['Try again']),
      ])
    );
    document.getElementById('curve-retry').addEventListener('click', submit);
  }

  async function submit() {
    state.step = 'submitting';
    render();
    track('complete', {});
    const revealHold = new Promise((resolve) => setTimeout(resolve, reducedMotion ? 0 : 650));

    const payload = {
      assessment_version: BANK.assessment_version,
      started_at: state.started_at,
      completed_at: new Date().toISOString(),
      answers: state.answers,
      optional_qualitative: state.qualitative || null,
      segmentation: state.segmentation,
      data_use_notice_version: '2026.08-v1',
      answer_times_ms: state.answer_times_ms,
      visitor_id: visitorId(),
    };

    try {
      const res = await fetch(SCORE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const failure = await res.json().catch(() => ({}));
        throw new Error(failure.error || 'scoring_failed');
      }
      const result = applyLocalReturnRecognition(await res.json());
      await revealHold;
      state.result = result;
      try {
        sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
      } catch {
        /* non-fatal */
      }
      state.step = 'result';
      render();
      focusPanel();
      track('result_view', { level: result.scoring.level });
    } catch (err) {
      state.step = 'error';
      render();
    }
  }

  // ---------- Result ----------
  const DIMENSION_LABELS = {
    adoption: 'Adoption',
    sophistication: 'Sophistication',
    integration: 'Integration',
    automation: 'Automation',
    control: 'Control',
  };
  const DIMENSION_ORDER = ['adoption', 'sophistication', 'integration', 'automation', 'control'];

  function renderResult() {
    const { scoring, interpretation, assessment_version } = state.result;
    const panel = el('div', { class: 'curve-panel curve-result reveal is-visible', tabindex: '-1' }, []);

    panel.appendChild(el('p', { class: 'hero-eyebrow' }, ['OneShotLabs / AI Curve']));
    panel.appendChild(el('h2', {}, ['Your position']));

    panel.appendChild(el('p', { class: 'curve-result-lede' }, [levelSummary(scoring.level)]));

    // Capability curve visualization
    panel.appendChild(buildCurveSvg(scoring.overall, reducedMotion));

    const scoreRow = el('div', { class: 'curve-score-row curve-reveal-stage', style: '--curve-stage-delay:820ms' }, [
      el('div', { class: 'curve-score-num', 'data-score': String(Math.round(scoring.overall)), 'aria-label': `${Math.round(scoring.overall)} out of 100` }, [reducedMotion ? String(Math.round(scoring.overall)) : '0']),
      el('div', { class: 'curve-score-meta' }, [
        el('p', { class: 'curve-level' }, [scoring.level]),
        el('p', { class: 'muted' }, [`Assessment ${assessment_version}`]),
      ]),
    ]);
    panel.appendChild(scoreRow);

    if (state.result.recognition?.returning && state.result.recognition.previous) {
      const previous = state.result.recognition.previous;
      const scoreDelta = Math.round(scoring.overall - Number(previous.score || 0));
      const priorDate = previous.completed_at ? new Date(previous.completed_at) : null;
      const dateLabel = priorDate && !Number.isNaN(priorDate.getTime())
        ? priorDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : 'your previous visit';
      const movement = scoreDelta > 0
        ? `You moved up ${scoreDelta} point${scoreDelta === 1 ? '' : 's'}.`
        : scoreDelta < 0
          ? `Your score changed by ${scoreDelta} points.`
          : 'Your overall score held steady.';
      panel.appendChild(
        el('div', { class: 'curve-return-card curve-reveal-stage', style: '--curve-stage-delay:980ms' }, [
          el('p', { class: 'hero-eyebrow' }, ['Welcome back']),
          el('p', { class: 'curve-return-title' }, [`Previously ${previous.level || 'assessed'} · ${Math.round(Number(previous.score) || 0)}/100`]),
          el('p', { class: 'muted' }, [`Last taken ${dateLabel}. ${movement}`]),
        ])
      );
    }

    const bars = el('div', { class: 'curve-dimensions' }, []);
    DIMENSION_ORDER.forEach((d, index) => {
      const val = scoring.dimensions[d];
      const bar = el('div', { class: 'curve-dim-row curve-reveal-stage', style: `--curve-stage-delay:${1180 + index * 105}ms` }, [
        el('span', { class: 'curve-dim-label' }, [DIMENSION_LABELS[d]]),
        el('div', { class: 'curve-dim-track' }, [
          el('div', { class: 'curve-dim-fill', style: `width:${reducedMotion ? val : 0}%;transition-delay:${reducedMotion ? 0 : 1180 + index * 105}ms`, 'data-target': String(val) }),
        ]),
        el('span', { class: 'curve-dim-val' }, [String(Math.round(val))]),
      ]);
      bars.appendChild(bar);
    });
    panel.appendChild(bars);

    panel.appendChild(
      el('div', { class: 'curve-interp curve-reveal-stage', style: '--curve-stage-delay:1830ms' }, [
        el('h3', {}, ['Where you\u2019re ahead']),
        el('p', {}, [interpretation.ahead.copy]),
        el('h3', {}, ['Where the gap is']),
        el('p', {}, [interpretation.gap.copy]),
        el('h3', {}, ['Your next challenge']),
        el('p', { class: 'curve-challenge-title' }, [interpretation.challenge || interpretation.gap.copy]),
        el('ol', { class: 'curve-next-steps' }, (interpretation.next_steps || [interpretation.gap.copy]).map((step) => el('li', {}, [step]))),
      ])
    );

    panel.appendChild(
      el('p', { class: 'curve-retest curve-reveal-stage', style: '--curve-stage-delay:2020ms' }, [
        el('strong', {}, ['Updated weekly. ']),
        'The AI Curve evolves with current capabilities and professional practice. Retake it every 30 days to track your position and progress.',
      ])
    );

    panel.appendChild(
      el('div', { class: 'curve-cta curve-reveal-stage', style: '--curve-stage-delay:2180ms' }, [
        el('button', { class: 'btn btn-accent', type: 'button', id: 'curve-open-friction' }, ['Turn the gap into a plan \u2192']),
        el('button', { class: 'btn', type: 'button', id: 'curve-copy-result' }, ['Copy result summary']),
        el('button', { class: 'btn curve-linkedin-share', type: 'button', id: 'curve-share-linkedin', 'aria-label': 'Share your AI Curve result on LinkedIn' }, ['Share on LinkedIn \u2197']),
      ])
    );

    const clinic = buildFrictionClinic(scoring, interpretation, assessment_version);
    panel.appendChild(clinic);

    panel.appendChild(buildParticipationGlobe(state.result.participation || emptyParticipation()));
    panel.appendChild(
      el('details', { class: 'curve-disclosure curve-reveal-stage', style: '--curve-stage-delay:2260ms' }, [
        el('summary', {}, ['Methodology & privacy']),
        el('p', {}, [
          'Your position is measured against OneShotLabs\u2019 own framework for what current AI makes possible for sophisticated professional users \u2014 not against other respondents. Comparisons to other people will only appear once there\u2019s a large enough, real sample to support them.',
        ]),
        el('p', {}, [
          'Scoring happens on the server; this page never sees the point values behind your answers. Your response may be included in aggregate, non-identifying research about how professionals use AI. No employer name, salary, or unnecessary personal data is collected, and results don\u2019t require an email address.',
        ]),
        el('p', {}, [
          'The participation globe uses a coarse regional location supplied by the hosting network. It does not store your raw IP address, city, or postal code, and an area is not displayed until at least three assessments have been recorded there.',
        ]),
      ])
    );

    root.appendChild(panel);

    if (storageNamespace !== 'preview') {
      loadLiveParticipation().then(insertLiveParticipation).catch(() => {
        /* The empty launch globe remains visible if live data is unavailable. */
      });
    }

    if (!reducedMotion) {
      setTimeout(() => animateScore(panel.querySelector('.curve-score-num'), Math.round(scoring.overall)), 820);
    }

    document.getElementById('curve-copy-result').addEventListener('click', async (event) => {
      const summary = `OneShotLabs AI Curve: ${Math.round(scoring.overall)}/100 — ${scoring.level}. Strongest: ${DIMENSION_LABELS[interpretation.ahead.dimension]}. Priority: ${DIMENSION_LABELS[interpretation.gap.dimension]}.`;
      try {
        await navigator.clipboard.writeText(summary);
        event.currentTarget.textContent = 'Copied';
      } catch {
        event.currentTarget.textContent = 'Copy unavailable';
      }
    });
    document.getElementById('curve-share-linkedin').addEventListener('click', async (event) => {
      const summary = `I scored ${Math.round(scoring.overall)}/100 — ${scoring.level} — on the OneShotLabs AI Curve. My strongest area is ${DIMENSION_LABELS[interpretation.ahead.dimension]}, and my next priority is ${DIMENSION_LABELS[interpretation.gap.dimension]}.`;
      const shareWindow = window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SHARE_URL)}`,
        'linkedin-share',
        'width=720,height=720,noopener,noreferrer'
      );
      try {
        await navigator.clipboard.writeText(`${summary}\n\n${SHARE_URL}`);
        event.currentTarget.textContent = 'Summary copied — paste on LinkedIn';
      } catch {
        event.currentTarget.textContent = shareWindow ? 'LinkedIn opened' : 'Open LinkedIn to share';
      }
      track('linkedin_share', { level: scoring.level });
    });
    document.getElementById('curve-open-friction').addEventListener('click', () => {
      clinic.hidden = false;
      document.getElementById('curve-friction-problem').focus();
      clinic.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
      track('friction_open', { level: scoring.level });
    });

    if (!reducedMotion) {
      requestAnimationFrame(() => {
        panel.querySelectorAll('.curve-dim-fill').forEach((fill) => {
          const target = fill.getAttribute('data-target');
          requestAnimationFrame(() => {
            fill.style.width = target + '%';
          });
        });
      });
    }
  }

  function buildParticipationGlobe(participation) {
    const pending = participation.status === 'pending';
    const stage = el('div', {
      class: 'curve-participation-stage',
      'data-participation-globe': 'true',
      role: 'img',
      'aria-label': `Interactive globe showing ${participation.representative ? 'representative' : 'aggregate'} AI Curve participation. Drag to rotate and scroll to zoom.`,
    }, []);
    stage.participationData = participation;

    return el('section', { class: 'curve-participation curve-reveal-stage', style: '--curve-stage-delay:2260ms' }, [
      el('div', { class: 'curve-participation-head' }, [
        el('div', {}, [
          el('p', { class: 'hero-eyebrow' }, [pending ? 'Participation preview' : participation.representative ? 'Representative display' : 'Global participation']),
          el('h3', {}, ['Participation Across the Curve']),
        ]),
        el('span', { class: 'curve-participation-update' }, [pending ? 'Activates at launch' : 'Updated weekly']),
      ]),
      el('p', { class: 'muted curve-participation-lede' }, [pending ? 'The live map will begin recording privacy-protected participation when the assessment launches.' : 'Each response appears as a tiny brass map pin. Concentrated participation forms a soft navy ink field.']),
      stage,
      el('div', { class: 'curve-participation-foot' }, [
        el('span', {}, [`${Number(participation.total || 0).toLocaleString()} assessments`]),
        el('span', {}, [`${Number(participation.countries || 0).toLocaleString()} countries`]),
        el('div', { class: 'curve-participation-controls' }, [
          el('button', { type: 'button', class: 'curve-globe-zoom', 'data-globe-zoom': 'out', 'aria-label': 'Zoom globe out' }, ['−']),
          el('button', { type: 'button', class: 'curve-globe-zoom', 'data-globe-zoom': 'in', 'aria-label': 'Zoom globe in' }, ['+']),
        ]),
      ]),
    ]);
  }

  function buildFrictionClinic(scoring, interpretation, assessmentVersion) {
    const clinic = el('section', { class: 'curve-friction-clinic', id: 'curve-friction-clinic', hidden: 'hidden' }, [
      el('p', { class: 'hero-eyebrow' }, ['OneShotLabs / Friction Clinic']),
      el('h3', {}, ['What is one point of friction in your work?']),
      el('p', { class: 'muted' }, ['Describe a recurring problem, bottleneck, or task that takes more effort than it should.']),
    ]);
    const textarea = el('textarea', { id: 'curve-friction-problem', rows: '5', maxlength: '1200', placeholder: 'For example: Our weekly reporting process requires pulling information from several systems, reconciling it manually, and rewriting the same summary for different audiences.' }, []);
    const warning = el('p', { class: 'curve-friction-warning' }, ['Keep it general—don’t include client names, confidential transactions, proprietary data, or account information.']);
    const submitButton = el('button', { class: 'btn btn-accent', type: 'button', id: 'curve-friction-submit' }, ['Think this through with AI \u2192']);
    const status = el('p', { class: 'curve-friction-status', id: 'curve-friction-status', role: 'status' }, []);
    const output = el('div', { class: 'curve-friction-output', id: 'curve-friction-output' }, []);
    clinic.appendChild(textarea);
    clinic.appendChild(warning);
    clinic.appendChild(submitButton);
    clinic.appendChild(status);
    clinic.appendChild(output);

    submitButton.addEventListener('click', async () => {
      const problem = textarea.value.trim();
      if (problem.length < 20) {
        status.textContent = 'Add a little more detail so the feedback can be useful.';
        status.classList.add('is-error');
        return;
      }
      status.classList.remove('is-error');
      status.textContent = 'Thinking through the friction point\u2026';
      submitButton.disabled = true;
      output.innerHTML = '';
      try {
        let body;
        if (window.AI_CURVE_LOCAL_FRICTION_DEMO === true) {
          await new Promise((resolve) => setTimeout(resolve, reducedMotion ? 0 : 650));
          body = { feedback: localFrictionDemo(problem, interpretation.gap.dimension) };
        } else {
          const response = await fetch(FRICTION_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              problem,
              visitor_id: visitorId(),
              context: {
                assessment_version: assessmentVersion,
                level: scoring.level,
                ahead_dimension: interpretation.ahead.dimension,
                gap_dimension: interpretation.gap.dimension,
                challenge: interpretation.challenge,
              },
            }),
          });
          body = await response.json().catch(() => ({}));
          if (!response.ok) throw new Error(body.error || 'feedback_unavailable');
        }
        renderFrictionFeedback(output, body.feedback);
        status.textContent = body.feedback.demo ? 'Local demonstration feedback' : 'A practical starting point based on your result';
        textarea.disabled = true;
        submitButton.hidden = true;
        track('friction_result', { level: scoring.level, sourced: Boolean(body.feedback.sources?.length) });
      } catch {
        status.classList.add('is-error');
        status.textContent = 'The feedback service is temporarily unavailable. Your text is still here—try again in a moment.';
        submitButton.disabled = false;
      }
    });
    return clinic;
  }

  function localFrictionDemo(problem, gapDimension) {
    void problem;
    return {
      demo: true,
      reframing: `The friction may not be electronic signatures themselves. It is more likely the repeated preparation, routing, status tracking, and filing around the signature event. Your ${gapDimension} result suggests that the handoff between systems is the best place to investigate.`,
      way_forward: 'Design a simple signature workflow around a reusable document template, borrower data captured once, automatic recipient routing, reminders, and a completed-document handoff to the approved system of record. Start with one common form before attempting a broader automation.',
      first_steps: [
        'Map the current process from document preparation through final filing and identify every manual handoff.',
        'Create one reusable template with fixed signature fields and the minimum borrower information needed for routing.',
        'Pilot an approved e-signature workflow that sends, reminds, records status, and returns the completed document for review.',
      ],
      watch_out: 'Confirm applicable electronic-signature, record-retention, authentication, privacy, and company-policy requirements before automating borrower communications. Keep a human review point before documents are sent.',
      sources: [],
    };
  }

  function renderFrictionFeedback(output, feedback) {
    const sections = [
      ['What may actually be causing the friction', feedback.reframing],
      ['A practical way forward', feedback.way_forward],
    ];
    sections.forEach(([title, copy]) => {
      output.appendChild(el('h4', {}, [title]));
      output.appendChild(el('p', {}, [copy]));
    });
    output.appendChild(el('h4', {}, ['Start here']));
    output.appendChild(el('ol', {}, (feedback.first_steps || []).map((step) => el('li', {}, [step]))));
    output.appendChild(el('h4', {}, ['What to watch']));
    output.appendChild(el('p', {}, [feedback.watch_out]));
    if (feedback.sources?.length) {
      output.appendChild(el('h4', {}, ['Sources']));
      const list = el('ul', { class: 'curve-friction-sources' }, []);
      feedback.sources.forEach((source) => list.appendChild(el('li', {}, [el('a', { href: source.url, target: '_blank', rel: 'noopener noreferrer' }, [source.title])])));
      output.appendChild(list);
    }
  }

  function animateScore(node, target) {
    if (!node) return;
    const duration = 1050;
    const started = performance.now();
    function frame(now) {
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      node.textContent = String(Math.round(target * eased));
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function levelSummary(level) {
    const summaries = {
      Exploring: 'You are establishing where AI can add value safely and repeatably.',
      Adopting: 'You have useful habits in place; the next gain comes from making them more consistent.',
      Integrating: 'AI is becoming part of real workflows, with clear opportunities to connect and standardize the work.',
      Advanced: 'You use AI as a capable professional system, with a few gaps separating practice from the frontier.',
      Frontier: 'Your practices combine broad adoption, structured execution, integration, and strong controls.',
    };
    return summaries[level] || 'Your result reflects your current professional AI practices.';
  }

  function buildCurveSvg(overall, noMotion) {
    const w = 640;
    const h = 180;
    const pad = 24;
    // Restrained S-curve as a visual metaphor for the capability frontier —
    // not a population distribution (guardrail from the spec).
    const path = `M ${pad},${h - pad} C ${w * 0.32},${h - pad} ${w * 0.32},${pad} ${w * 0.62},${pad} C ${w * 0.82},${pad} ${w - pad},${pad} ${w - pad},${pad}`;
    const t = Math.max(0, Math.min(1, overall / 100));
    // Approximate a point along the curve horizontally by overall score.
    const userX = pad + t * (w - pad * 2);
    const userY = h - pad - t * (h - pad * 2);
    const frontierX = w - pad;
    const frontierY = pad;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('class', 'curve-svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `Your score of ${Math.round(overall)} out of 100 plotted against the current AI capability frontier.`);

    const curve = document.createElementNS(svgNS, 'path');
    curve.setAttribute('d', path);
    curve.setAttribute('class', 'curve-line');
    curve.setAttribute('pathLength', '1');
    svg.appendChild(curve);

    const frontierDot = document.createElementNS(svgNS, 'circle');
    frontierDot.setAttribute('cx', String(frontierX));
    frontierDot.setAttribute('cy', String(frontierY));
    frontierDot.setAttribute('r', '5');
    frontierDot.setAttribute('class', 'curve-frontier-marker');
    svg.appendChild(frontierDot);

    const frontierLabel = document.createElementNS(svgNS, 'text');
    frontierLabel.setAttribute('x', String(frontierX - 6));
    frontierLabel.setAttribute('y', String(frontierY - 12));
    frontierLabel.setAttribute('class', 'curve-svg-label');
    frontierLabel.setAttribute('text-anchor', 'end');
    frontierLabel.textContent = 'Current frontier';
    svg.appendChild(frontierLabel);

    const userDot = document.createElementNS(svgNS, 'circle');
    userDot.setAttribute('cx', String(noMotion ? userX : pad));
    userDot.setAttribute('cy', String(noMotion ? userY : h - pad));
    userDot.setAttribute('r', '6');
    userDot.setAttribute('class', 'curve-user-marker' + (noMotion ? '' : ' is-animating'));
    svg.appendChild(userDot);

    const userLabel = document.createElementNS(svgNS, 'text');
    userLabel.setAttribute('x', String(userX));
    userLabel.setAttribute('y', String(Math.max(14, userY - 14)));
    userLabel.setAttribute('class', 'curve-svg-label curve-svg-label-user');
    userLabel.setAttribute('text-anchor', 'middle');
    userLabel.textContent = 'You';
    svg.appendChild(userLabel);

    if (!noMotion) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        userDot.setAttribute('cx', String(userX));
        userDot.setAttribute('cy', String(userY));
      }));
    }

    return svg;
  }

  // ---------- Boot ----------
  restoreSession();
  if (state.step === 'result' && state.result) {
    // Result previews and restored results do not need the public question
    // bank. This also allows the development results gallery to be opened
    // directly from disk without Chrome blocking a local JSON fetch.
    render();
  } else {
    loadQuestions()
      .then(() => {
        if (state.step === 'result' && !state.result) {
          // Session said "result" but we lost the computed payload (e.g. tab
          // closed mid-render) — safest is to restart rather than guess.
          state.step = 'intro';
        }
        render();
      })
      .catch(() => {
        root.appendChild(
          el('div', { class: 'curve-panel' }, [
            el('p', {}, ['The assessment couldn\u2019t load. Open this page through the local Netlify preview, then try again.']),
          ])
        );
      });
  }
})();
