import test from 'node:test';
import assert from 'node:assert/strict';

import { POST } from '../api/investigate.mjs';
import researchResults from '../src/data/researchResults.json' with { type: 'json' };

const sampleId = researchResults.rings[0].id;

const request = (body, token) => new Request('https://example.test/api/investigate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  body: JSON.stringify(body),
});

test('rejects unknown evidence packages', async () => {
  const response = await POST(request({ ringId: 'AR-9999999' }));
  assert.equal(response.status, 404);
});

test('requires a server-side credential', async () => {
  const saved = process.env.GEMINI_API_KEY;
  const savedAccess = process.env.INVESTIGATOR_ACCESS_TOKEN;
  delete process.env.GEMINI_API_KEY;
  process.env.INVESTIGATOR_ACCESS_TOKEN = 'test-access';
  try {
    const response = await POST(request({ ringId: sampleId }, 'test-access'));
    assert.equal(response.status, 503);
  } finally {
    if (saved === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = saved;
    if (savedAccess === undefined) delete process.env.INVESTIGATOR_ACCESS_TOKEN;
    else process.env.INVESTIGATOR_ACCESS_TOKEN = savedAccess;
  }
});

test('rejects an invalid analyst token', async () => {
  const saved = process.env.INVESTIGATOR_ACCESS_TOKEN;
  process.env.INVESTIGATOR_ACCESS_TOKEN = 'test-access';
  try {
    const response = await POST(request({ ringId: sampleId }, 'wrong-access'));
    assert.equal(response.status, 401);
  } finally {
    if (saved === undefined) delete process.env.INVESTIGATOR_ACCESS_TOKEN;
    else process.env.INVESTIGATOR_ACCESS_TOKEN = saved;
  }
});

test('sends only server-selected evidence and returns report text', async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  const previousAccess = process.env.INVESTIGATOR_ACCESS_TOKEN;
  const previousFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = 'test-only-key';
  process.env.INVESTIGATOR_ACCESS_TOKEN = 'test-access';
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers['x-goog-api-key'], 'test-only-key');
    const payload = JSON.parse(options.body);
    const prompt = payload.contents[0].parts[0].text;
    assert.match(prompt, new RegExp(`"id":"${sampleId}"`));
    assert.doesNotMatch(prompt, /ground_truth/);
    assert.doesNotMatch(prompt, /user supplied prompt/);
    return Response.json({ candidates: [{ content: { parts: [{ text: 'Evidence-based review.' }] } }] });
  };
  try {
    const response = await POST(request({ ringId: sampleId, prompt: 'user supplied prompt' }, 'test-access'));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).report, 'Evidence-based review.');
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousKey;
    if (previousAccess === undefined) delete process.env.INVESTIGATOR_ACCESS_TOKEN;
    else process.env.INVESTIGATOR_ACCESS_TOKEN = previousAccess;
  }
});
