"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const chatbotService_js_1 = require("../services/chatbotService.js");
async function run() {
    delete process.env.CHATBOT_API_KEY;
    const compatibility = await chatbotService_js_1.ChatbotService.getReply('Who can donate to O+?');
    strict_1.default.equal(compatibility.intent, 'compatibility');
    strict_1.default.match(compatibility.reply, /O\+, O-/);
    strict_1.default.match(compatibility.reply, /crossmatch/i);
    const appHelp = await chatbotService_js_1.ChatbotService.getReply('How can I find nearby donors?');
    strict_1.default.equal(appHelp.intent, 'find_donors');
    strict_1.default.match(appHelp.reply, /Search tab/);
    const safety = await chatbotService_js_1.ChatbotService.getReply('Can I donate while taking medication?');
    strict_1.default.equal(safety.intent, 'deferral');
    strict_1.default.match(safety.reply, /do not stop prescribed medication/i);
    const unknown = await chatbotService_js_1.ChatbotService.getReply('What is the weather tomorrow?');
    strict_1.default.equal(unknown.intent, 'fallback');
    strict_1.default.ok(unknown.suggestedReplies?.length);
    const originalFetch = globalThis.fetch;
    const originalApiKey = process.env.CHATBOT_API_KEY;
    const originalApiUrl = process.env.CHATBOT_API_URL;
    const originalModel = process.env.CHATBOT_MODEL;
    let requestBody;
    process.env.CHATBOT_API_KEY = 'test-key';
    process.env.CHATBOT_API_URL = 'https://chat.test/v1';
    process.env.CHATBOT_MODEL = 'test-model';
    globalThis.fetch = (async (_input, init) => {
        requestBody = JSON.parse(String(init?.body));
        return new Response(JSON.stringify({ choices: [{ message: { content: 'Use the Profile tab.' } }] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    });
    try {
        const generated = await chatbotService_js_1.ChatbotService.getReply('Where is my profile?', [
            { role: 'user', content: 'I need help in the app.' },
            { role: 'assistant', content: 'What are you trying to do?' },
        ]);
        strict_1.default.equal(generated.intent, 'assistant');
        strict_1.default.equal(generated.reply, 'Use the Profile tab.');
        strict_1.default.deepEqual(requestBody?.messages.slice(-3).map(({ role }) => role), [
            'user',
            'assistant',
            'user',
        ]);
    }
    finally {
        globalThis.fetch = originalFetch;
        if (originalApiKey === undefined)
            delete process.env.CHATBOT_API_KEY;
        else
            process.env.CHATBOT_API_KEY = originalApiKey;
        if (originalApiUrl === undefined)
            delete process.env.CHATBOT_API_URL;
        else
            process.env.CHATBOT_API_URL = originalApiUrl;
        if (originalModel === undefined)
            delete process.env.CHATBOT_MODEL;
        else
            process.env.CHATBOT_MODEL = originalModel;
    }
    console.log('Chatbot tests passed');
}
run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
