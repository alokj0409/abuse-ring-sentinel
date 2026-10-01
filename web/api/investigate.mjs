import researchResults from '../src/data/researchResults.json' with { type: 'json' };
import { timingSafeEqual } from 'node:crypto';

const json = (body, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'no-store' },
});

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Expected a JSON request body.' }, 400);
  }
  const ringId = body?.ringId;
  if (typeof ringId !== 'string' || !/^AR-\d{1,7}$/.test(ringId)) {
    return json({ error: 'A valid ringId is required.' }, 400);
  }
  const record = researchResults.rings.find(item => item.id === ringId);
  if (!record) {
    return json({ error: 'No evidence package exists for this held-out sample ring.' }, 404);
  }

  const accessToken = process.env.INVESTIGATOR_ACCESS_TOKEN;
  if (!accessToken) {
    return json({ error: 'Analyst access is not configured on this server.' }, 503);
  }
  const supplied = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
  const expectedBytes = Buffer.from(accessToken);
  const suppliedBytes = Buffer.from(supplied);
  if (suppliedBytes.length !== expectedBytes.length || !timingSafeEqual(suppliedBytes, expectedBytes)) {
    return json({ error: 'Analyst access token is required.' }, 401);
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return json({ error: 'Report generation is not configured on this server.' }, 503);
  }
  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  if (!/^[a-zA-Z0-9._-]+$/.test(model)) {
    return json({ error: 'Invalid server model configuration.' }, 500);
  }

  // Ground truth is evaluation-only information and must not enter the report prompt.
  const { ground_truth: _groundTruth, ...evidence } = record;
  const instructions = [
    'You are a fraud analyst assistant. Write a concise, evidence-grounded report for human review.',
    'Use only the JSON evidence below. Do not invent transactions, links, timestamps, or operational outcomes.',
    'The score is an offline calibrated research estimate. Never imply an automatic block or live transaction action occurred.',
    'Shared relationship pair counts are descriptive, not causal explanations of the model score.',
    'Separate observed facts from hypotheses. State uncertainty and recommend analyst verification.',
    JSON.stringify(evidence),
  ].join('\n\n');

  try {
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({ contents: [{ parts: [{ text: instructions }] }] }),
        signal: AbortSignal.timeout(25000),
      },
    );
    if (!upstream.ok) {
      return json({ error: `Report provider returned HTTP ${upstream.status}.` }, 502);
    }
    const data = await upstream.json();
    const report = data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('\n').trim();
    if (!report) {
      return json({ error: 'Report provider returned no text.' }, 502);
    }
    return json({ ringId, report, source: 'Gemini', evidenceVersion: 'held-out-2026-10-01' });
  } catch {
    return json({ error: 'Report provider is unavailable.' }, 502);
  }
}
