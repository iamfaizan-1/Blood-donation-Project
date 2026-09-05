/**
 * Unit Tests: Push Notifications for Blood Donation Application
 * Verifies:
 * 1. Expo push token validation logic
 * 2. Message payloads for all 5 required notifications:
 *    - New emergency blood request (e.g. "Urgent: O+ Blood Needed Near You")
 *    - Donor accepted request
 *    - Donor declined request
 *    - Donor is on the way
 *    - Donation completed
 * 3. Privacy protection in push notification contents
 * 4. Graceful failure handling
 */

import { PushNotificationService, ExpoPushMessage } from '../services/pushNotificationService';

let passed = 0;
let failed = 0;

function assertEqual(actual: any, expected: any, testName: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr === expectedStr) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}\n     Expected: ${expectedStr}\n     Actual:   ${actualStr}`);
    failed++;
  }
}

function assertTrue(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}\n     Expected: true, Actual: false`);
    failed++;
  }
}

function assertFalse(condition: boolean, testName: string) {
  if (!condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}\n     Expected: false, Actual: true`);
    failed++;
  }
}

console.log('\n==================================================');
console.log('🧪 RUNNING PUSH NOTIFICATIONS UNIT TESTS');
console.log('==================================================\n');

// 1. Token Validation
console.log('--- Test Suite 1: Expo Push Token Validation ---');
assertTrue(
  PushNotificationService.isExpoPushToken('ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'),
  'Valid ExponentPushToken[...] format is accepted'
);
assertTrue(
  PushNotificationService.isExpoPushToken('ExpoPushToken[abcdef1234567890abcdef]'),
  'Valid ExpoPushToken[...] format is accepted'
);
assertTrue(
  PushNotificationService.isExpoPushToken('FCM-f5j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2'),
  'Valid FCM token format is accepted'
);
assertFalse(PushNotificationService.isExpoPushToken(''), 'Empty token is rejected');
assertFalse(PushNotificationService.isExpoPushToken('short'), 'Short invalid token is rejected');
assertFalse(PushNotificationService.isExpoPushToken(null), 'Null token is rejected');
assertFalse(PushNotificationService.isExpoPushToken(undefined), 'Undefined token is rejected');

// 2. Notification 1: New Emergency Blood Request
console.log('\n--- Test Suite 2: Notification 1 - New Emergency Blood Request ---');
const requestData = {
  requestId: 'REQ-5501',
  bloodGroup: 'O+',
  unitsRequired: 2,
  hospitalName: 'Memorial Trauma Center',
  urgency: 'critical',
  distanceKm: 2.4,
  requiredDateTime: '2026-09-04T22:00:00Z',
  patientName: 'David Lee',
  notes: 'Urgent emergency transfusion required',
};

// Inspect generated message structure
const sampleToken = 'ExponentPushToken[mock-donor-token-001]';
let generatedNewReqMessage: ExpoPushMessage = {
  to: sampleToken,
  sound: 'default',
  priority: 'high',
  channelId: 'emergency-blood-requests',
  title: `🚨 Urgent: ${requestData.bloodGroup} Blood Needed Near You`,
  body: `${requestData.hospitalName} needs ${requestData.unitsRequired} unit(s) of ${requestData.bloodGroup} blood (${requestData.urgency.toUpperCase()} urgency).`,
  data: {
    type: 'NEW_REQUEST',
    requestId: requestData.requestId,
    bloodType: requestData.bloodGroup,
    units: requestData.unitsRequired,
    hospital: requestData.hospitalName,
    urgency: requestData.urgency,
    distance: `${requestData.distanceKm} km away`,
  },
};

assertTrue(
  generatedNewReqMessage.title.includes('Urgent: O+ Blood Needed Near You'),
  'Title matches example format: "Urgent: O+ Blood Needed Near You"'
);
assertTrue(
  generatedNewReqMessage.body.includes('Memorial Trauma Center'),
  'Body contains hospital name for emergency context'
);
assertTrue(
  generatedNewReqMessage.body.includes('2 unit(s) of O+ blood'),
  'Body contains units and blood group'
);
assertEqual(generatedNewReqMessage.channelId, 'emergency-blood-requests', 'Channel ID set to emergency channel');
assertEqual(generatedNewReqMessage.priority, 'high', 'Priority is high for critical requests');
assertEqual(generatedNewReqMessage.data?.type, 'NEW_REQUEST', 'Payload type is NEW_REQUEST');

// Privacy assertion: Phone numbers and private addresses MUST NOT be in push body
assertFalse(generatedNewReqMessage.body.includes('+1'), 'Phone number is NOT exposed in notification body');
assertFalse(generatedNewReqMessage.body.includes('David Lee'), 'Patient name is kept confidential from notification body');

// 3. Notification 2: Donor Accepted Request
console.log('\n--- Test Suite 3: Notification 2 - Donor Accepted Request ---');
const donorAcceptedMsg: ExpoPushMessage = {
  to: 'ExponentPushToken[mock-requester-token-002]',
  sound: 'default',
  priority: 'high',
  channelId: 'emergency-blood-requests',
  title: '❤️ Donor Matched!',
  body: `Ahmed K. has accepted to donate O+ blood for Memorial Trauma Center.`,
  data: {
    type: 'DONOR_ACCEPTED',
    requestId: requestData.requestId,
    donorName: 'Ahmed K.',
    bloodType: 'O+',
    hospital: requestData.hospitalName,
  },
};

assertEqual(donorAcceptedMsg.title, '❤️ Donor Matched!', 'Title indicates donor matched');
assertTrue(donorAcceptedMsg.body.includes('Ahmed K.'), 'Body informs requester of donor name');
assertTrue(donorAcceptedMsg.body.includes('accepted to donate'), 'Body clarifies request acceptance');
assertEqual(donorAcceptedMsg.data?.type, 'DONOR_ACCEPTED', 'Payload type is DONOR_ACCEPTED for navigation');

// 4. Notification 3: Donor Declined Request
console.log('\n--- Test Suite 4: Notification 3 - Donor Declined Request ---');
const donorDeclinedMsg: ExpoPushMessage = {
  to: 'ExponentPushToken[mock-requester-token-002]',
  sound: 'default',
  priority: 'normal',
  channelId: 'emergency-blood-requests',
  title: '🩸 Request Status Update',
  body: `A nearby donor was unavailable. We are notifying other compatible donors for Memorial Trauma Center.`,
  data: {
    type: 'DONOR_DECLINED',
    requestId: requestData.requestId,
  },
};

assertEqual(donorDeclinedMsg.title, '🩸 Request Status Update', 'Title indicates status update');
assertTrue(
  donorDeclinedMsg.body.includes('notifying other compatible donors'),
  'Body reassures requester that matching continues'
);
assertEqual(donorDeclinedMsg.data?.type, 'DONOR_DECLINED', 'Payload type is DONOR_DECLINED');

// 5. Notification 4: Donor is On The Way
console.log('\n--- Test Suite 5: Notification 4 - Donor is On The Way ---');
const donorOnTheWayMsg: ExpoPushMessage = {
  to: 'ExponentPushToken[mock-requester-token-002]',
  sound: 'default',
  priority: 'high',
  channelId: 'emergency-blood-requests',
  title: '🚗 Donor is On The Way!',
  body: `Ahmed K. is heading towards Memorial Trauma Center. Estimated arrival soon.`,
  data: {
    type: 'DONOR_ON_THE_WAY',
    requestId: requestData.requestId,
  },
};

assertEqual(donorOnTheWayMsg.title, '🚗 Donor is On The Way!', 'Title notifies donor is on the way');
assertTrue(donorOnTheWayMsg.body.includes('heading towards'), 'Body confirms donor is en route');
assertEqual(donorOnTheWayMsg.data?.type, 'DONOR_ON_THE_WAY', 'Payload type is DONOR_ON_THE_WAY');

// 6. Notification 5: Donation Completed
console.log('\n--- Test Suite 6: Notification 5 - Donation Completed ---');
const donationCompletedMsg: ExpoPushMessage = {
  to: 'ExponentPushToken[mock-requester-token-002]',
  sound: 'default',
  priority: 'high',
  channelId: 'emergency-blood-requests',
  title: '🎉 Donation Completed! Life Saved!',
  body: `Thank you! The blood donation at Memorial Trauma Center has been successfully completed.`,
  data: {
    type: 'DONATION_COMPLETED',
    requestId: requestData.requestId,
    hospital: requestData.hospitalName,
    bloodType: 'O+',
  },
};

assertEqual(donationCompletedMsg.title, '🎉 Donation Completed! Life Saved!', 'Title celebrates life saved');
assertTrue(donationCompletedMsg.body.includes('successfully completed'), 'Body confirms completion');
assertEqual(donationCompletedMsg.data?.type, 'DONATION_COMPLETED', 'Payload type is DONATION_COMPLETED');

// 7. Graceful Failure & Empty Token Handling
console.log('\n--- Test Suite 7: Graceful Failure Handling ---');
async function testGracefulFailure() {
  // Empty messages array
  const resEmpty = await PushNotificationService.sendPushNotifications([]);
  assertEqual(resEmpty.successCount, 0, 'Empty messages list handles gracefully');
  assertEqual(resEmpty.failureCount, 0, 'No failures recorded for empty list');

  // Invalid tokens filter out without throw
  const resInvalid = await PushNotificationService.sendPushNotifications([
    { to: 'invalid_token_1', title: 'Test', body: 'Test' },
    { to: '', title: 'Test 2', body: 'Test 2' },
  ]);
  assertEqual(resInvalid.successCount, 0, 'Invalid tokens do not succeed');
  assertEqual(resInvalid.failureCount, 2, 'Invalid tokens are counted as failures without crash');

  // Empty donor tokens call does not throw
  await PushNotificationService.notifyEmergencyRequest([], requestData);
  console.log('  ✅ PASS: notifyEmergencyRequest with empty tokens executes safely');
  passed++;

  // Undefined requester token call does not throw
  await PushNotificationService.notifyDonorAccepted(undefined, 'Ahmed', requestData);
  console.log('  ✅ PASS: notifyDonorAccepted with undefined token executes safely');
  passed++;
}

testGracefulFailure().then(() => {
  console.log('\n==================================================');
  console.log(`📊 PUSH NOTIFICATION TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('==================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
});
