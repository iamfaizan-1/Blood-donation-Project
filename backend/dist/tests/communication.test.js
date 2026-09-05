"use strict";
/**
 * Unit Tests: Secure Communication System (Chat, Call, Location Sharing, Report & Block)
 * Verifies:
 * 1. Access Control: Only requester and accepted donor can access communication
 * 2. Lifecycle Gating: Communication only allowed after donor accepts
 * 3. Privacy Gating: Donor phone is not exposed publicly
 * 4. Real-Time Message Structure & Timestamps
 * 5. Safety Controls: Blocking and Reporting
 */
Object.defineProperty(exports, "__esModule", { value: true });
let passed = 0;
let failed = 0;
function assertEqual(actual, expected, testName) {
    const actualStr = JSON.stringify(actual);
    const expectedStr = JSON.stringify(expected);
    if (actualStr === expectedStr) {
        console.log(`  ✅ PASS: ${testName}`);
        passed++;
    }
    else {
        console.error(`  ❌ FAIL: ${testName}\n     Expected: ${expectedStr}\n     Actual:   ${actualStr}`);
        failed++;
    }
}
function assertTrue(condition, testName) {
    if (condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passed++;
    }
    else {
        console.error(`  ❌ FAIL: ${testName}\n     Expected: true, Actual: false`);
        failed++;
    }
}
function assertFalse(condition, testName) {
    if (!condition) {
        console.log(`  ✅ PASS: ${testName}`);
        passed++;
    }
    else {
        console.error(`  ❌ FAIL: ${testName}\n     Expected: false, Actual: true`);
        failed++;
    }
}
console.log('\n==================================================');
console.log('🧪 RUNNING SECURE COMMUNICATION UNIT TESTS');
console.log('==================================================\n');
// 1. Access Control & Authorization Guard
console.log('--- Test Suite 1: Authorization Guards (Requester & Accepted Donor Only) ---');
const mockRequest = {
    id: 'REQ-3001',
    requesterId: 'user_requester_100',
    acceptedDonorId: 'user_donor_200',
    status: 'donor_accepted',
};
function canAccessChat(userId, request) {
    const allowedStatuses = ['donor_accepted', 'contact_established', 'on_the_way', 'fulfilled'];
    if (!allowedStatuses.includes(request.status))
        return false;
    return userId === request.requesterId || userId === request.acceptedDonorId;
}
assertTrue(canAccessChat('user_requester_100', mockRequest), 'Requester can access the conversation');
assertTrue(canAccessChat('user_donor_200', mockRequest), 'Accepted donor can access the conversation');
assertFalse(canAccessChat('user_third_party_300', mockRequest), 'Unauthorized third-party user is blocked from conversation');
assertFalse(canAccessChat('unmatched_donor_400', mockRequest), 'Unmatched donor is blocked from conversation');
// 2. Lifecycle State Gating
console.log('\n--- Test Suite 2: Lifecycle State Gating (Only Active After Acceptance) ---');
const pendingRequest = { ...mockRequest, status: 'pending', acceptedDonorId: null };
const matchingRequest = { ...mockRequest, status: 'matching', acceptedDonorId: null };
const contactEstablishedRequest = { ...mockRequest, status: 'contact_established' };
const onTheWayRequest = { ...mockRequest, status: 'on_the_way' };
const fulfilledRequest = { ...mockRequest, status: 'fulfilled' };
assertFalse(canAccessChat('user_requester_100', pendingRequest), 'Chat is BLOCKED when request is pending');
assertFalse(canAccessChat('user_requester_100', matchingRequest), 'Chat is BLOCKED when request is matching');
assertTrue(canAccessChat('user_requester_100', contactEstablishedRequest), 'Chat is ALLOWED during contact_established');
assertTrue(canAccessChat('user_donor_200', onTheWayRequest), 'Chat is ALLOWED during on_the_way');
assertTrue(canAccessChat('user_donor_200', fulfilledRequest), 'Chat history accessible upon fulfilled');
// 3. Privacy Gating (No Public Exposure of Donor Phone)
console.log('\n--- Test Suite 3: Phone Privacy Gating ---');
const donorPrivateProfile = {
    id: 'user_donor_200',
    name: 'Ahmed Khan',
    phone: '+1-555-491-0021',
    bloodGroup: 'O+',
};
function getPublicDonorCard(donor) {
    // Public search card should hide exact phone number and surname
    return {
        id: donor.id,
        firstName: donor.name.split(' ')[0],
        bloodGroup: donor.bloodGroup,
    };
}
function getSecureContact(callerId, request, donor) {
    if (request.status !== 'donor_accepted' && request.status !== 'contact_established') {
        return null;
    }
    if (callerId !== request.requesterId && callerId !== request.acceptedDonorId) {
        return null;
    }
    return { phone: donor.phone, name: donor.name };
}
const publicCard = getPublicDonorCard(donorPrivateProfile);
assertFalse('phone' in publicCard, 'Donor phone is completely omitted from public donor card');
assertEqual(publicCard.firstName, 'Ahmed', 'Only donor first name is revealed publicly');
const securePhoneAccess = getSecureContact('user_requester_100', mockRequest, donorPrivateProfile);
assertTrue(securePhoneAccess !== null, 'Authorized requester receives phone access after acceptance');
assertEqual(securePhoneAccess?.phone, '+1-555-491-0021', 'Correct direct phone number revealed to requester');
const unauthorizedPhoneAccess = getSecureContact('user_third_party_300', mockRequest, donorPrivateProfile);
assertTrue(unauthorizedPhoneAccess === null, 'Unauthorized caller is denied contact phone access');
// 4. Message Structure & Timestamps
console.log('\n--- Test Suite 4: Message Payload & Timestamps ---');
const textMsg = {
    _id: 'msg_001',
    requestId: 'REQ-3001',
    senderId: 'user_donor_200',
    senderName: 'Ahmed Khan',
    message: 'I am on my way to City General Hospital.',
    messageType: 'text',
    createdAt: new Date().toISOString(),
};
assertEqual(textMsg.messageType, 'text', 'Message type is text');
assertTrue(textMsg.createdAt.length > 0, 'Message contains ISO timestamp');
assertTrue(textMsg.message.length > 0, 'Message body is populated');
const locationMsg = {
    _id: 'msg_002',
    requestId: 'REQ-3001',
    senderId: 'user_donor_200',
    senderName: 'Ahmed Khan',
    message: '📍 Near Main Entrance (5 mins away)',
    messageType: 'location',
    locationData: {
        latitude: 40.7128,
        longitude: -74.006,
        address: 'City General Hospital Blood Bank',
    },
    createdAt: new Date().toISOString(),
};
assertEqual(locationMsg.messageType, 'location', 'Message type is location');
assertEqual(locationMsg.locationData.latitude, 40.7128, 'Location message contains latitude');
assertEqual(locationMsg.locationData.longitude, -74.006, 'Location message contains longitude');
// 5. Safety Controls: Blocking & Reporting
console.log('\n--- Test Suite 5: Safety Controls (Reporting & Blocking) ---');
const activeBlocks = [];
function blockUser(blockerId, blockedId) {
    if (blockerId === blockedId)
        throw new Error('Cannot block self');
    if (!activeBlocks.some((b) => b.blockerId === blockerId && b.blockedId === blockedId)) {
        activeBlocks.push({ blockerId, blockedId });
    }
}
function isCommunicationAllowed(userA, userB) {
    const isBlocked = activeBlocks.some((b) => (b.blockerId === userA && b.blockedId === userB) ||
        (b.blockerId === userB && b.blockedId === userA));
    return !isBlocked;
}
assertTrue(isCommunicationAllowed('user_requester_100', 'user_donor_200'), 'Communication allowed before block');
// Requester blocks donor
blockUser('user_requester_100', 'user_donor_200');
assertFalse(isCommunicationAllowed('user_requester_100', 'user_donor_200'), 'Communication is immediately severed after block');
assertFalse(isCommunicationAllowed('user_donor_200', 'user_requester_100'), 'Blocked donor cannot message requester');
// Self-block prevention
let selfBlockThrew = false;
try {
    blockUser('user_requester_100', 'user_requester_100');
}
catch {
    selfBlockThrew = true;
}
assertTrue(selfBlockThrew, 'Self-blocking is rejected');
// Report reason validation
const validReasons = [
    'harassment',
    'inappropriate_behavior',
    'no_show',
    'fraud_or_scam',
    'safety_concern',
    'other',
];
assertTrue(validReasons.includes('harassment'), 'harassment is a valid report reason');
assertTrue(validReasons.includes('no_show'), 'no_show is a valid report reason');
assertFalse(validReasons.includes('invalid_reason'), 'Arbitrary reason is rejected');
console.log('\n==================================================');
console.log(`📊 COMMUNICATION TEST RESULTS: ${passed} Passed, ${failed} Failed`);
console.log('==================================================\n');
if (failed > 0) {
    process.exit(1);
}
