// netlify/functions/score-curve.js
//
// OneShotLabs AI Curve — server-side scoring.
//
// Why this exists: OSL_AI_CURVE_MASTER_SPEC.md requires "Never trust
// client-supplied scores. Validate inputs server-side." and "No public
// exposure of scoring IP." The site itself is static HTML/CSS/JS with no
// backend, but it deploys on Netlify, which supports Netlify Functions —
// so this is the smallest way to satisfy that requirement without adding
// a new hosting platform. The client only ever sees question text and
// option text (data/ai-curve-questions-public.json). Point values,
// dimension mappings, and the consistency-check logic below never leave
// this function.
//
// Request:  POST /.netlify/functions/score-curve
//   { assessment_version, started_at, completed_at, answers: {q01:'a', ...},
//     optional_qualitative, segmentation }
// Response: JSON matching OSL_AI_CURVE_DATA_SCHEMA.json's "scoring" block
//   plus a full submission envelope, ready to persist once storage exists.

const ASSESSMENT_VERSION = '2026.08-10q-v1';
const SCORING_VERSION = '2026.08-10q-v1';
const crypto = require('node:crypto');

// ---- Full question bank (private — points + dimension live only here) ----
// Kept inline rather than imported from the public JSON so a client can
// never reach this data by requesting the wrong file.
const QUESTIONS = {
  q01: { dimension: 'adoption', type: 'applied', points: { a: 0, b: 1, c: 2, d: 3, e: 4 } },
  q02: { dimension: 'sophistication', type: 'applied', points: { a: 1, b: 2, c: 3, d: 4, e: 0 } },
  q03: { dimension: 'integration', type: 'applied', points: { a: 1, b: 2, c: 3, d: 4, e: 0 } },
  q05: { dimension: 'automation', type: 'frontier', points: { a: 0, b: 4, c: 0, d: 1, e: 0 } },
  q06: { dimension: 'adoption', type: 'frontier', points: { a: 1, b: 4, c: 0, d: 0, e: 1 } },
  q08: { dimension: 'integration', type: 'frontier', points: { a: 0, b: 4, c: 0, d: 1, e: 0 } },
  q09: { dimension: 'automation', type: 'applied', points: { a: 0, b: 1, c: 2, d: 3, e: 4 } },
  q10: { dimension: 'control', type: 'frontier', points: { a: 0, b: 4, c: 0, d: 0, e: 0 } },
  q12: { dimension: 'sophistication', type: 'frontier', points: { a: 0, b: 4, c: 0, d: 1, e: 0 } },
  q15: { dimension: 'control', type: 'applied', points: { a: 0, b: 1, c: 2, d: 3, e: 4 } },
};

const DIMENSIONS = ['adoption', 'sophistication', 'integration', 'automation', 'control'];
const QUESTION_IDS = Object.keys(QUESTIONS);
const MAX_APPLIED_POINTS = 20; // 5 applied questions * 4
const MAX_FRONTIER_POINTS = 20; // 5 frontier questions * 4

const RECOMMENDATIONS = {
  integration: "Look for one recurring workflow where information is still manually copied between AI and another approved system. Explore whether that handoff can be connected safely.",
  automation: "Choose one repeatable task with clear inputs, outputs, and review points. Turn it into a reusable multi-step workflow before pursuing broader autonomy.",
  control: "Before increasing automation, strengthen source validation, data-handling rules, permissions, and human review for material outputs.",
  sophistication: "Move beyond isolated prompts by giving AI better context, source materials, explicit constraints, and repeatable instructions.",
  adoption: "Identify one recurring, low-risk professional task where AI can save time without compromising judgment or confidentiality.",
};

const AHEAD_COPY = {
  adoption: "AI already shows up across a meaningful share of your professional work, not just isolated moments.",
  sophistication: "You give AI real context and structure instead of relying on one-line prompts.",
  integration: "AI in your workflow reaches beyond a single chat window into the documents and tools you actually use.",
  automation: "You've moved past manually driving every step — some of your work runs as a repeatable, reviewable process.",
  control: "You treat AI output on material decisions the way it should be treated: verified, sourced, and reviewed.",
};

const NEXT_STEPS = {
  integration: [
    'Map one recurring handoff where AI output is still copied into another approved system.',
    'Define the required structure, permissions, validation, and human approval before connecting it.',
    'Pilot the handoff on low-risk work and measure time saved and error rates.',
  ],
  automation: [
    'Choose one repeatable task with stable inputs, outputs, and exceptions.',
    'Write the workflow as explicit steps with review gates before automating it.',
    'Run a limited pilot and compare quality, cycle time, and intervention rate.',
  ],
  control: [
    'Classify the data and decisions involved in one material AI-assisted workflow.',
    'Document approved tools, source checks, permissions, and required human review.',
    'Test failure cases before expanding access or autonomy.',
  ],
  sophistication: [
    'Turn one successful prompt into a reusable brief with context, sources, constraints, and examples.',
    'Add an explicit verification rubric for the output.',
    'Reuse it for three cycles and refine the instructions based on failures.',
  ],
  adoption: [
    'Pick one frequent, low-risk task with a clear definition of done.',
    'Use AI for that task consistently for two weeks while keeping human review.',
    'Record time saved, output quality, and the situations where AI should not be used.',
  ],
};

const CHALLENGES = {
  integration: 'Eliminate one manual handoff between AI and an approved system.',
  automation: 'Turn one recurring task into a controlled, repeatable workflow.',
  control: 'Build a review and data-handling standard for one material AI workflow.',
  sophistication: 'Convert one successful prompt into a sourced, reusable professional brief.',
  adoption: 'Use AI consistently on one frequent, low-risk task for two weeks.',
};

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

function validAnswers(answers) {
  if (!answers || typeof answers !== 'object') return false;
  for (const id of QUESTION_IDS) {
    const val = answers[id];
    if (typeof val !== 'string' || !(val in QUESTIONS[id].points)) return false;
  }
  return true;
}

function cleanSegmentation(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const allowed = ['industry', 'function', 'seniority', 'experience'];
  return Object.fromEntries(allowed.map((key) => [key, typeof value[key] === 'string' ? value[key].slice(0, 100) : '']));
}

function cleanQualitative(value) {
  return typeof value === 'string' ? value.trim().slice(0, 2000) : null;
}

function allowedOrigin(event) {
  const configured = process.env.AI_CURVE_ALLOWED_ORIGIN;
  if (configured) return configured;
  return event.headers?.origin || '*';
}

async function persistResearchSubmission(submission) {
  if (process.env.AI_CURVE_STORAGE_ENABLED !== 'true') return { status: 'disabled' };
  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore({ name: 'ai-curve-responses' });
    const date = submission.completed_at.slice(0, 10);
    const id = crypto.randomUUID();
    await store.setJSON(`${date}/${id}`, submission, {
      metadata: { assessmentVersion: submission.assessment_version, researchEligible: submission.scoring.research_eligible },
    });
    return { status: 'stored', id };
  } catch (error) {
    console.error('AI Curve persistence failed', error);
    return { status: 'unavailable' };
  }
}

function cleanVisitorId(value) {
  if (typeof value !== 'string') return '';
  const cleaned = value.trim().slice(0, 100);
  return /^[A-Za-z0-9:_-]{8,100}$/.test(cleaned) ? cleaned : '';
}

async function recognizeReturnVisitor(visitorId, currentResult, completedAt) {
  if (process.env.AI_CURVE_STORAGE_ENABLED !== 'true') return { status: 'disabled', returning: false };
  if (!visitorId) return { status: 'unavailable', returning: false };
  const secret = process.env.AI_CURVE_VISITOR_SECRET;
  if (!secret) return { status: 'unavailable', returning: false };

  try {
    const { getStore } = await import('@netlify/blobs');
    const store = getStore({ name: 'ai-curve-visitors' });
    const visitorHash = crypto.createHmac('sha256', secret).update(visitorId).digest('hex');
    const key = `v1/${visitorHash}`;
    const previous = await store.get(key, { type: 'json' });
    const attempts = Math.max(0, Number(previous?.attempts) || 0) + 1;

    await store.setJSON(key, {
      attempts,
      last_completed_at: completedAt,
      last_level: currentResult.level,
      last_score: currentResult.overall,
      assessment_version: ASSESSMENT_VERSION,
    });

    return {
      status: 'recognized',
      returning: Boolean(previous),
      prior_attempts: Math.max(0, attempts - 1),
      previous: previous ? {
        completed_at: previous.last_completed_at,
        level: previous.last_level,
        score: previous.last_score,
      } : null,
    };
  } catch (error) {
    console.error('AI Curve return recognition failed', error);
    return { status: 'unavailable', returning: false };
  }
}

function score(answers) {
  const dimensionRaw = Object.fromEntries(DIMENSIONS.map((d) => [d, 0]));
  let appliedPoints = 0;
  let frontierPoints = 0;

  for (const id of QUESTION_IDS) {
    const q = QUESTIONS[id];
    const pts = q.points[answers[id]];
    dimensionRaw[q.dimension] += pts;
    if (q.type === 'applied') appliedPoints += pts;
    else frontierPoints += pts;
  }

  const dimensions = Object.fromEntries(
    DIMENSIONS.map((d) => [d, (dimensionRaw[d] / 8) * 100])
  );

  const appliedPractice = (appliedPoints / MAX_APPLIED_POINTS) * 100;
  const frontierFluency = (frontierPoints / MAX_FRONTIER_POINTS) * 100;
  const overall = 0.65 * appliedPractice + 0.35 * frontierFluency;

  return { dimensions, appliedPractice, frontierFluency, overall };
}

function levelFor(overall, dimensions, frontierFluency, responseConfidence) {
  if (overall >= 85) {
    const gatesPass =
      dimensions.control >= 70 &&
      dimensions.integration >= 70 &&
      dimensions.automation >= 65 &&
      frontierFluency >= 80 &&
      responseConfidence >= 0.75;
    return gatesPass ? 'Frontier' : 'Advanced';
  }
  if (overall >= 70) return 'Advanced';
  if (overall >= 55) return 'Integrating';
  if (overall >= 35) return 'Adopting';
  return 'Exploring';
}

function responseConfidenceFor(answers, completionSeconds) {
  let confidence = 1.0;
  const flags = [];
  const pts = (id) => QUESTIONS[id].points[answers[id]];

  // Integration: Q3 vs Q8
  if (pts('q03') === 4 && pts('q08') <= 1) {
    confidence -= 0.15;
    flags.push('integration_consistency');
  }
  // Automation: applied workflow practice vs agent fluency
  if (pts('q09') >= 3 && pts('q05') <= 1) {
    confidence -= 0.15;
    flags.push('automation_consistency');
  }
  // Control: data-handling practice vs connected-system risk fluency
  if (pts('q15') === 4 && pts('q10') === 0) {
    confidence -= 0.10;
    flags.push('control_consistency');
  }

  let speedPenaltyApplied = false;
  if (typeof completionSeconds === 'number') {
    if (completionSeconds < 45) {
      confidence -= 0.25;
      flags.push('fast_completion');
      speedPenaltyApplied = true;
    } else if (completionSeconds < 75 && flags.length > 0) {
      // Only penalize the 45-75s band when paired with other suspicious signals.
      confidence -= 0.10;
      flags.push('moderate_speed_with_other_signals');
      speedPenaltyApplied = true;
    }
  }
  void speedPenaltyApplied;

  // Obvious pattern abuse: identical option letter on every question.
  const distinctAnswers = new Set(QUESTION_IDS.map((id) => answers[id]));
  let researchIneligible = false;
  if (distinctAnswers.size === 1) {
    flags.push('possible_pattern_abuse');
    researchIneligible = true;
  }

  return { confidence: clamp01(confidence), flags, researchIneligible };
}

function pickAhead(dimensions) {
  const sorted = DIMENSIONS.slice().sort((a, b) => dimensions[b] - dimensions[a]);
  const top = sorted[0];
  return { dimension: top, copy: AHEAD_COPY[top] };
}

function pickGap(dimensions) {
  const sorted = DIMENSIONS.slice().sort((a, b) => dimensions[a] - dimensions[b]);
  const bottom = sorted[0];
  return { dimension: bottom, copy: RECOMMENDATIONS[bottom] };
}

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': allowedOrigin(event),
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'method_not_allowed' }) };
  }

  let payload;
  if ((event.body || '').length > 25000) {
    return { statusCode: 413, headers: cors, body: JSON.stringify({ error: 'payload_too_large' }) };
  }
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'invalid_json' }) };
  }

  const { answers, started_at, completed_at, assessment_version } = payload;

  if (assessment_version && assessment_version !== ASSESSMENT_VERSION) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'unsupported_assessment_version' }) };
  }
  if (!validAnswers(answers)) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'invalid_or_incomplete_answers' }) };
  }

  // Timestamp sanity check.
  let completionSeconds = null;
  let timestampsValid = true;
  if (started_at && completed_at) {
    const start = Date.parse(started_at);
    const end = Date.parse(completed_at);
    if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
      completionSeconds = Math.round((end - start) / 1000);
    } else {
      timestampsValid = false;
    }
  }

  const { dimensions, appliedPractice, frontierFluency, overall } = score(answers);
  const { confidence, flags, researchIneligible } = responseConfidenceFor(answers, completionSeconds);
  if (!timestampsValid) flags.push('impossible_timestamps');

  const level = levelFor(overall, dimensions, frontierFluency, confidence);
  const researchEligible = !researchIneligible && timestampsValid && confidence >= 0.70;

  const gap = pickGap(dimensions);
  const result = {
    assessment_version: ASSESSMENT_VERSION,
    scoring_version: SCORING_VERSION,
    scoring: {
      overall: Math.round(overall * 100) / 100,
      level,
      dimensions: Object.fromEntries(
        DIMENSIONS.map((d) => [d, Math.round(dimensions[d] * 100) / 100])
      ),
      applied_practice: Math.round(appliedPractice * 100) / 100,
      frontier_fluency: Math.round(frontierFluency * 100) / 100,
      response_confidence: Math.round(confidence * 100) / 100,
      research_eligible: researchEligible,
      flags,
    },
    interpretation: {
      ahead: pickAhead(dimensions),
      gap,
      challenge: CHALLENGES[gap.dimension],
      next_steps: NEXT_STEPS[gap.dimension],
    },
    completion_seconds: completionSeconds,
  };

  const noticePresented = payload.data_use_notice_version === '2026.08-v1';
  const completedAt = new Date().toISOString();
  let capture = { status: noticePresented ? 'disabled' : 'notice_missing' };
  let recognition = { status: noticePresented ? 'disabled' : 'notice_missing', returning: false };
  if (noticePresented) {
    recognition = await recognizeReturnVisitor(cleanVisitorId(payload.visitor_id), result.scoring, completedAt);
    capture = await persistResearchSubmission({
      assessment_version: ASSESSMENT_VERSION,
      scoring_version: SCORING_VERSION,
      completed_at: completedAt,
      answers,
      segmentation: cleanSegmentation(payload.segmentation),
      optional_qualitative: cleanQualitative(payload.optional_qualitative),
      answer_times_ms: payload.answer_times_ms && typeof payload.answer_times_ms === 'object' ? payload.answer_times_ms : {},
      data_use_notice_version: payload.data_use_notice_version,
      scoring: result.scoring,
    });
  }

  result.capture = { status: capture.status };
  result.recognition = recognition;

  return {
    statusCode: 200,
    headers: { ...cors, 'Content-Type': 'application/json' },
    body: JSON.stringify(result),
  };
};
