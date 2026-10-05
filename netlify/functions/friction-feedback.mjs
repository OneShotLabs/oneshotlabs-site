import frictionFeedbackCore from '../lib/friction-feedback-core.cjs';
import OpenAI from 'openai';

const { handler, configureOpenAI } = frictionFeedbackCore;
configureOpenAI(OpenAI);

export default async function frictionFeedback(request, context) {
  const headers = Object.fromEntries(request.headers.entries());
  const result = await handler({
    httpMethod: request.method,
    headers,
    body: await request.text(),
  }, {
    awsRequestId: context.requestId,
  });

  return new Response(result.body, {
    status: result.statusCode,
    headers: result.headers,
  });
}

export const config = {
  path: '/.netlify/functions/friction-feedback',
};
