"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotService = void 0;
const bloodCompatibility_js_1 = require("../utils/bloodCompatibility.js");
const BLOOD_GROUP_REGEX = /\b(AB|A|B|O)[+-](?![A-Z0-9])/i;
const FALLBACK_SUGGESTIONS = [
    'Who can donate to O+?',
    'How do I request blood?',
    'What should I expect when donating?',
];
function extractBloodGroup(message) {
    const match = message.toUpperCase().match(BLOOD_GROUP_REGEX);
    return match ? match[0] : null;
}
function normalizeMessage(message) {
    return message.toLowerCase().replace(/[^a-z0-9+]+/g, ' ').trim();
}
const INTENTS = [
    {
        name: 'greeting',
        keywords: ['hi', 'hello', 'hey', 'salam', 'assalam'],
        handler: () => 'Hi! I can help with blood donation questions and using the LifeSaver app. What would you like to know?',
    },
    {
        name: 'compatibility',
        keywords: [
            'compatible',
            'compatibility',
            'can donate',
            'who can donate',
            'blood type match',
            'blood group match',
            'receive blood',
        ],
        handler: (message) => {
            const bloodGroup = extractBloodGroup(message);
            if (!bloodGroup) {
                return "Tell me the recipient's blood group, for example, 'who can donate to O+?' The app lists red-cell compatibility groups, but a hospital must perform compatibility testing before transfusion.";
            }
            const donors = (0, bloodCompatibility_js_1.getCompatibleDonorTypes)(bloodGroup);
            return `For red-cell compatibility, the app lists ${donors.join(', ')} as donor groups for a ${bloodGroup} recipient. The hospital must confirm with blood testing and crossmatching; this does not determine an individual's suitability for transfusion.`;
        },
    },
    {
        name: 'universal_groups',
        keywords: ['universal donor', 'universal recipient', 'which blood group is universal'],
        handler: () => 'For red-cell transfusions, O-negative is often called the universal donor type and AB-positive the universal recipient type. These are simplified rules: the clinical team must still check the blood and crossmatch it.',
    },
    {
        name: 'eligibility',
        keywords: [
            'eligible',
            'eligibility',
            'can i donate',
            'requirements',
            'criteria',
            'age limit',
            'weight',
            'who can give blood',
            'donor requirement',
        ],
        handler: () => 'Donation eligibility depends on your location, donation type, health, medications, and donation history. Collection staff check factors such as age, weight, hemoglobin, recent illness or travel, and time since your last donation. Confirm with your local blood center; I cannot determine whether you personally can donate.',
    },
    {
        name: 'deferral',
        priority: 1,
        keywords: [
            'medication',
            'medicine',
            'antibiotic',
            'tattoo',
            'piercing',
            'pregnant',
            'pregnancy',
            'anemia',
            'low iron',
            'sick',
            'illness',
            'travel',
            'chronic condition',
            'vaccine',
        ],
        handler: () => 'Medications, recent tattoos or travel, pregnancy, low iron, illness, and health conditions can affect eligibility, but rules vary and some situations only require a temporary wait. Tell blood center staff the relevant details and follow their screening decision; do not stop prescribed medication to donate.',
    },
    {
        name: 'frequency',
        keywords: [
            'how often',
            'wait time',
            'next donation',
            'gap between donations',
            'how soon',
            'donate again',
            'donation interval',
        ],
        handler: () => 'The safe interval depends on donation type and local rules. Whole-blood intervals are commonly around 8-12 weeks, while platelets and plasma can have different schedules. Follow the date given by your blood center and the eligibility date shown in your profile, if available.',
    },
    {
        name: 'preparation',
        keywords: [
            'prepare',
            'before donating',
            'before donation',
            'eat before',
            'drink before',
            'what to bring',
            'fasting',
        ],
        handler: () => "Before donating, follow your blood center's instructions, drink water, eat a normal meal, and bring the requested identification. Avoid donating if you feel unwell, and tell screening staff about your health, medicines, and recent travel.",
    },
    {
        name: 'aftercare',
        keywords: [
            'after donating',
            'after donation',
            'aftercare',
            'feel dizzy',
            'side effect',
            'bruise',
            'recover',
        ],
        handler: () => 'After donation, rest briefly, have the provided refreshments, drink fluids, and follow the blood center\'s aftercare instructions. If you feel faint, sit or lie down and tell staff. Contact a healthcare professional for concerning or persistent symptoms.',
    },
    {
        name: 'donation_types',
        keywords: [
            'platelet',
            'plasma',
            'whole blood',
            'different types of donation',
            'donation type',
            'apheresis',
        ],
        handler: () => 'Common donations include whole blood, platelets, and plasma. They use different collection methods, take different amounts of time, and have different eligibility and repeat-donation rules. Ask your local blood center which types they collect and which may suit you.',
    },
    {
        name: 'process',
        keywords: [
            'how to donate',
            'donation process',
            'steps',
            'procedure',
            'how does donating work',
            'what happens when',
        ],
        handler: () => "In the app, open Find Donors to browse requests or use Request Blood if you need a donor. A donor can accept a matching request, then participants can coordinate through the request's communication tools. The blood center handles medical screening and the donation itself; mark the donation completed in the app afterward when available.",
    },
    {
        name: 'request_help',
        keywords: ['need blood', 'request blood', 'urgent', 'emergency', 'patient', 'find blood'],
        handler: () => 'Open Request Blood, enter the requested blood group and hospital details, and choose the urgency. The app can help connect a request with donors, but cannot guarantee availability or replace a hospital or emergency service. For an urgent medical situation, contact the treating hospital or local emergency services now.',
    },
    {
        name: 'find_donors',
        keywords: [
            'find donor',
            'find donors',
            'search donor',
            'nearby donor',
            'nearby donors',
            'near me',
            'donor location',
            'search requests',
        ],
        handler: () => 'Use the Search tab to view available requests and the Donate/Location area to choose a location and radius where supported. Matching depends on donor availability and compatibility; contact the hospital directly for urgent needs.',
    },
    {
        name: 'accept_request',
        keywords: [
            'accept request',
            'respond to request',
            'donor request',
            'offer to donate',
            'volunteer',
        ],
        handler: () => 'Open a request that you may be able to help with and use its accept action. Only accept if you are willing and can attend; the blood center will determine your final eligibility. Once accepted, the app enables secure coordination with the requester.',
    },
    {
        name: 'communication',
        keywords: [
            'chat with donor',
            'message donor',
            'call donor',
            'contact donor',
            'chat with requester',
            'share location',
            'privacy',
            'phone number',
        ],
        handler: () => 'The request chat and contact tools are available to the requester and accepted donor after a donor accepts. Location sharing is optional and requires location permission. Do not share sensitive personal or medical information in chat.',
    },
    {
        name: 'notifications',
        keywords: ['notification', 'alert', 'donor alert', 'push notification', 'not receiving'],
        handler: () => 'Donation alerts depend on your notification permission, account settings, matching details, and donor availability. Check that notifications are enabled for the app and that your profile is active and up to date. You can still check requests in the app.',
    },
    {
        name: 'profile_history',
        keywords: [
            'edit profile',
            'update profile',
            'donation history',
            'past donations',
            'my donations',
            'account details',
        ],
        handler: () => 'Open the Profile tab to review or update your donor details and view donation history when available. Keeping your blood group and contact details accurate helps the app match requests; only enter information you are comfortable sharing with the service.',
    },
    {
        name: 'blood_basics',
        keywords: ['blood groups', 'blood types', 'abo', 'rh factor', 'what is rh', 'how many blood types'],
        handler: () => 'The main ABO groups are A, B, AB, and O. Each is commonly described as Rh-positive or Rh-negative, giving eight familiar types such as A+ and O-. Compatibility also depends on other blood antigens, so hospitals test and crossmatch before transfusion.',
    },
    {
        name: 'duration',
        keywords: [
            'how long does donation take',
            'how long to donate',
            'time to donate',
            'duration',
        ],
        handler: () => 'The total visit includes registration, health screening, collection, and recovery, so it is longer than the collection itself. Timing varies by center and donation type; ask the center for its current estimate.',
    },
    {
        name: 'thanks',
        keywords: ['thanks', 'thank you', 'shukriya'],
        handler: () => "You're welcome. I'm here if you have another question.",
    },
];
const FALLBACK_REPLY = "I couldn't confidently answer that from the app's offline help. Try asking about blood compatibility, donation eligibility, preparation, aftercare, requests, donor matching, notifications, or your profile.";
const SYSTEM_PROMPT = `You are the LifeSaver Blood Donation app assistant. Answer questions about this app and general blood donation clearly, directly, and in plain language.

App guidance: users can manage donor details and donation history in Profile; browse requests in Search/Find Donors; create a blood request with blood group, hospital, and urgency in Request Blood; and use location tools to narrow or share location where enabled. A requester and donor can use secure communication after the donor accepts. Matching and alerts depend on availability and settings. The app cannot guarantee a donor, provide a transfusion, or replace a hospital or emergency service.

Safety: provide general education, not diagnosis or individualized medical clearance. Eligibility and donation intervals vary by country, center, donation type, health, and medication; direct users to local collection staff and never tell them to stop prescribed medicine. For urgent medical needs, direct them to the treating hospital or local emergency services. Explain that compatibility examples concern red-cell compatibility only and do not replace hospital testing/crossmatching. Do not invent app features, policies, or a user's account/request status. If uncertain, say so and suggest the relevant app screen or blood center. Do not request or repeat identifying patient information.`;
function getLocalReply(message) {
    const normalized = normalizeMessage(message);
    if (!normalized) {
        return { intent: 'empty', reply: 'Type a question and I will do my best to help.' };
    }
    const paddedMessage = ` ${normalized} `;
    let bestIntent = null;
    let bestScore = 0;
    let bestPriority = 0;
    for (const intent of INTENTS) {
        const score = intent.keywords.reduce((total, keyword) => {
            const normalizedKeyword = normalizeMessage(keyword);
            return total + (paddedMessage.includes(` ${normalizedKeyword} `) ? 1 : 0);
        }, 0);
        const priority = intent.priority || 0;
        if (score > 0 &&
            (score > bestScore || (score === bestScore && priority > bestPriority))) {
            bestScore = score;
            bestPriority = priority;
            bestIntent = intent;
        }
    }
    if (!bestIntent) {
        return {
            intent: 'fallback',
            reply: FALLBACK_REPLY,
            suggestedReplies: FALLBACK_SUGGESTIONS,
        };
    }
    return { intent: bestIntent.name, reply: bestIntent.handler(message) };
}
class ChatbotService {
    static async getReply(rawMessage, history = []) {
        const message = rawMessage.trim();
        const apiKey = process.env.CHATBOT_API_KEY;
        if (!message || !apiKey)
            return getLocalReply(message);
        const endpoint = process.env.CHATBOT_API_URL || 'https://api.openai.com/v1/chat/completions';
        const model = process.env.CHATBOT_MODEL || 'gpt-4o-mini';
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model,
                    temperature: 0.3,
                    max_tokens: 500,
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        ...history.slice(-10).map(({ role, content }) => ({ role, content })),
                        { role: 'user', content: message },
                    ],
                }),
                signal: AbortSignal.timeout(15_000),
            });
            if (!response.ok)
                throw new Error(`Chatbot provider returned ${response.status}`);
            const payload = (await response.json());
            const reply = payload.choices?.[0]?.message?.content;
            if (typeof reply !== 'string' || !reply.trim()) {
                throw new Error('Empty chatbot response');
            }
            return { intent: 'assistant', reply: reply.trim() };
        }
        catch {
            return getLocalReply(message);
        }
    }
}
exports.ChatbotService = ChatbotService;
