import assert from 'node:assert/strict';
import { ChatbotService } from '../services/chatbotService.js';

async function run() {
  delete process.env.CHATBOT_API_KEY;

  const compatibility = await ChatbotService.getReply('Who can donate to O+?');
  assert.equal(compatibility.intent, 'compatibility');
  assert.match(compatibility.reply, /O\+, O-/);
  assert.match(compatibility.reply, /crossmatch/i);

  const appHelp = await ChatbotService.getReply('How can I find nearby donors?');
  assert.equal(appHelp.intent, 'find_donors');
  assert.match(appHelp.reply, /Search tab/);

  const safety = await ChatbotService.getReply('Can I donate while taking medication?');
  assert.equal(safety.intent, 'deferral');
  assert.match(safety.reply, /do not stop prescribed medication/i);

  const unknown = await ChatbotService.getReply('What is the weather tomorrow?');
  assert.equal(unknown.intent, 'fallback');
  assert.ok(unknown.suggestedReplies?.length);

  const originalFetch = globalThis.fetch;
  const originalApiKey = process.env.CHATBOT_API_KEY;
  const originalApiUrl = process.env.CHATBOT_API_URL;
  const originalModel = process.env.CHATBOT_MODEL;
  let requestBody: { messages: Array<{ role: string; content: string }> } | undefined;
  process.env.CHATBOT_API_KEY = 'test-key';
  process.env.CHATBOT_API_URL = 'https://chat.test/v1';
  process.env.CHATBOT_MODEL = 'test-model';
  globalThis.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ choices: [{ message: { content: 'Use the Profile tab.' } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    const generated = await ChatbotService.getReply('Where is my profile?', [
      { role: 'user', content: 'I need help in the app.' },
      { role: 'assistant', content: 'What are you trying to do?' },
    ]);
    assert.equal(generated.intent, 'assistant');
    assert.equal(generated.reply, 'Use the Profile tab.');
    assert.deepEqual(requestBody?.messages.slice(-3).map(({ role }) => role), [
      'user',
      'assistant',
      'user',
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiKey === undefined) delete process.env.CHATBOT_API_KEY;
    else process.env.CHATBOT_API_KEY = originalApiKey;
    if (originalApiUrl === undefined) delete process.env.CHATBOT_API_URL;
    else process.env.CHATBOT_API_URL = originalApiUrl;
    if (originalModel === undefined) delete process.env.CHATBOT_MODEL;
    else process.env.CHATBOT_MODEL = originalModel;
  }

  console.log('Chatbot tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});