const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('AI Curve serves eight questions with four responses each', () => {
  const bank = JSON.parse(read('data/ai-curve-questions-public.json'));
  const active = new Set(bank.active_question_ids);
  const questions = bank.questions.filter((question) => active.has(question.id));
  assert.equal(bank.assessment_version, '2026.09-8q-v1');
  assert.equal(questions.length, 8);
  questions.forEach((question) => assert.equal(question.options.length, 4, question.id));
});

test('the eighth answer submits directly and LinkedIn uses a real share link', () => {
  const client = read('js/ai-curve.js');
  assert.match(client, /state\.index === total - 1 \? 'See my results/);
  assert.match(client, /else \{\s*submit\(\);/);
  assert.match(client, /href: `https:\/\/www\.linkedin\.com\/feed\/\?shareActive=true&text=/);
  assert.match(client, /Publish to LinkedIn/);
  assert.match(client, /Access to AI is a beginning\. What you do with it changes the work\./);
  assert.match(client, /Find yours: \$\{SHARE_URL\}/);
});

test('server scoring accepts the revised assessment', async () => {
  const { handler } = require('../netlify/functions/score-curve.js');
  const answers = { q01: 'd', q02: 'd', q03: 'd', q05: 'b', q08: 'b', q09: 'd', q10: 'b', q15: 'd' };
  const response = await handler({
    httpMethod: 'POST',
    headers: { origin: 'http://localhost' },
    body: JSON.stringify({ assessment_version: '2026.09-8q-v1', answers }),
  });
  assert.equal(response.statusCode, 200);
  const result = JSON.parse(response.body);
  assert.equal(result.assessment_version, '2026.09-8q-v1');
  assert.equal(result.scoring.overall, 100);
  Object.values(result.scoring.dimensions).forEach((score) => assert.equal(score, 100));
});

test('mobile fabric controls and both 3D experiences expose pinch zoom', () => {
  const cloth = read('js/fabric-cloth-3d.js');
  const globe = read('js/fabric-results-globe.js');
  const lumen = read('css/lumen.css');
  assert.match(cloth, /clothTouches\.size>=2/);
  assert.match(cloth, /Pinch to zoom/);
  assert.match(globe, /pinch\.radius\*distance\(a,b\)\/pinch\.distance/);
  assert.match(globe, /Pinch or use \+ \/ − to zoom/);
  assert.match(lumen, /grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
});

test('AI feedback can use the gateway and emits structured connectivity logs', async () => {
  const fn = read('netlify/lib/friction-feedback-core.cjs');
  const adapter = read('netlify/functions/friction-feedback.mjs');
  assert.match(fn, /process\.env\.OPENAI_BASE_URL/);
  assert.match(fn, /oneshot_ai_connectivity/);
  assert.doesNotMatch(fn, /console\.(?:info|log)\([^\n]*problem/);
  assert.match(adapter, /export default async function frictionFeedback/);

  const oldDemo = process.env.AI_CURVE_DEMO_FEEDBACK;
  process.env.AI_CURVE_DEMO_FEEDBACK = 'true';
  const originalInfo = console.info;
  console.info = () => {};
  try {
    delete require.cache[require.resolve('../netlify/lib/friction-feedback-core.cjs')];
    const { handler } = require('../netlify/lib/friction-feedback-core.cjs');
    const response = await handler({
      httpMethod: 'POST',
      body: JSON.stringify({
        problem: 'A recurring weekly report requires several manual handoffs and repeated formatting.',
        visitor_id: 'visitor-test-1234',
        context: { level: 'Integrating', gap_dimension: 'automation', ahead_dimension: 'control', assessment_version: '2026.09-8q-v1' },
      }),
    }, { awsRequestId: 'test-request' });
    assert.equal(response.statusCode, 200);
    assert.equal(JSON.parse(response.body).model, 'local-demonstration');
  } finally {
    console.info = originalInfo;
    if (oldDemo === undefined) delete process.env.AI_CURVE_DEMO_FEEDBACK;
    else process.env.AI_CURVE_DEMO_FEEDBACK = oldDemo;
  }
});
