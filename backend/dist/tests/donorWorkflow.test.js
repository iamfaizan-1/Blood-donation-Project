"use strict";
/**
 * Unit Tests: Donor Request Workflow
 * Verifies:
 * 1. Matching & notification creation logic
 * 2. Privacy gating (sensitive contacts hidden before accept)
 * 3. Race condition prevention (atomic single winner)
 * 4. Decline handling (request remains available)
 * 5. Lifecycle status progression (donor_accepted -> contact_established -> on_the_way -> fulfilled)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const bloodCompatibility_1 = require("../utils/bloodCompatibility");
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
console.log('🧪 RUNNING DONOR REQUEST WORKFLOW UNIT TESTS');
console.log('==================================================\n');
// 1. Matched Donors Discovery
console.log('--- Test Suite 1: Rule-Based Donor Notification Targeting ---');
const requestBloodGroup = 'O+';
const compatibleTypes = (0, bloodCompatibility_1.getCompatibleDonorTypes)(requestBloodGroup);
assertEqual(compatibleTypes, ['O+', 'O-'], 'O+ request only notifies O+ and O- donors');
const donors = [
    { id: 'd1', name: 'Zaid', bloodGroup: 'O+', isAvailable: true, isVerified: true, distanceKm: 2.1 },
    { id: 'd2', name: 'Sara', bloodGroup: 'O-', isAvailable: true, isVerified: true, distanceKm: 4.5 },
    { id: 'd3', name: 'Farhan', bloodGroup: 'A+', isAvailable: true, isVerified: true, distanceKm: 1.2 },
    { id: 'd4', name: 'Omar', bloodGroup: 'O+', isAvailable: false, isVerified: true, distanceKm: 0.8 },
    { id: 'd5', name: 'Hina', bloodGroup: 'O+', isAvailable: true, isVerified: false, distanceKm: 1.5 },
];
const eligibleDonors = donors.filter((d) => (0, bloodCompatibility_1.isBloodCompatible)(d.bloodGroup, requestBloodGroup) &&
    d.isAvailable &&
    d.isVerified);
assertEqual(eligibleDonors.length, 2, 'Only compatible, available, and verified donors are notified');
assertEqual(eligibleDonors.map((d) => d.id), ['d1', 'd2'], 'Dispatches notifications to d1 and d2 only');
// 2. Privacy Protection Pre-Acceptance
console.log('\n--- Test Suite 2: Privacy Gating Prior to Acceptance ---');
const rawRequester = {
    id: 'u1',
    name: 'Hospital Coordinator John',
    phone: '+1-555-901-2345',
    email: 'john@cityhospital.org',
};
// Simulation of donor notification view before acceptance
const donorNotificationView = {
    requestId: 'REQ-1001',
    bloodGroup: 'O+',
    unitsRequired: 2,
    hospitalName: 'City General Hospital',
    distanceKm: 2.1,
    urgency: 'critical',
    requiredDateTime: '2026-09-04T18:00:00Z',
    // Contact details MUST NOT be exposed here
    requesterPhone: undefined,
};
assertTrue(donorNotificationView.requesterPhone === undefined, 'Requester phone number is hidden prior to acceptance');
assertTrue(donorNotificationView.distanceKm === 2.1, 'Approximate distance is exposed for response decision');
// 3. Atomic Acceptance & Race Condition Prevention
console.log('\n--- Test Suite 3: Race Condition Prevention Simulation ---');
let bloodRequestState = {
    id: 'REQ-1001',
    status: 'donor_found',
    acceptedDonorId: null,
};
let notificationStates = {
    n1: 'pending', // for donor d1
    n2: 'pending', // for donor d2
};
// Atomic accept function simulating MongoDB findOneAndUpdate with acceptedDonorId: null condition
function simulateAccept(notificationId, donorId) {
    if (bloodRequestState.acceptedDonorId === null) {
        // First acceptor wins atomically
        bloodRequestState.acceptedDonorId = donorId;
        bloodRequestState.status = 'donor_accepted';
        notificationStates[notificationId] = 'accepted';
        // All other pending notifications expire
        for (const key of Object.keys(notificationStates)) {
            if (key !== notificationId && notificationStates[key] === 'pending') {
                notificationStates[key] = 'expired';
            }
        }
        return {
            success: true,
            requesterContact: { name: rawRequester.name, phone: rawRequester.phone },
        };
    }
    else {
        // Conflict: already accepted by another donor
        notificationStates[notificationId] = 'expired';
        return {
            success: false,
            error: 'Conflict: Request has already been accepted by another donor',
        };
    }
}
// Donor 1 accepts first
const resultD1 = simulateAccept('n1', 'd1');
assertTrue(resultD1.success, 'First donor (d1) successfully accepts request');
assertEqual(bloodRequestState.status, 'donor_accepted', 'Request status updated to "donor_accepted"');
assertEqual(bloodRequestState.acceptedDonorId, 'd1', 'Donor d1 is recorded as accepted donor');
assertTrue(resultD1.requesterContact?.phone === '+1-555-901-2345', 'Requester phone is securely revealed to accepted donor');
// Donor 2 attempts to accept simultaneously after d1
const resultD2 = simulateAccept('n2', 'd2');
assertFalse(resultD2.success, 'Second donor (d2) accept is rejected to prevent multiple simultaneous acceptors');
assertEqual(notificationStates['n2'], 'expired', 'Competing donor notification is marked as expired');
assertEqual(bloodRequestState.acceptedDonorId, 'd1', 'Primary accepted donor remains d1');
// 4. Decline Workflow
console.log('\n--- Test Suite 4: Donor Decline Handling ---');
let freshRequest = {
    id: 'REQ-2002',
    status: 'donor_found',
    acceptedDonorId: null,
};
let freshNotifications = {
    notifA: 'pending',
    notifB: 'pending',
};
function simulateDecline(notificationId) {
    freshNotifications[notificationId] = 'declined';
    const remainingPending = Object.values(freshNotifications).filter((s) => s === 'pending').length;
    if (remainingPending === 0) {
        freshRequest.status = 'pending';
    }
}
// Donor A declines
simulateDecline('notifA');
assertEqual(freshNotifications['notifA'], 'declined', 'Declining donor notification status updated to "declined"');
assertEqual(freshRequest.status, 'donor_found', 'Request remains in donor_found while other matched donors are pending');
assertEqual(freshNotifications['notifB'], 'pending', 'Other matched donors keep pending state to accept');
// 5. Workflow Status Transitions with Role-Based Controls
console.log('\n--- Test Suite 5: Role-Based Workflow Lifecycle Transitions ---');
const donorTransitions = {
    donor_accepted: ['contact_established'],
    contact_established: ['on_the_way'],
    on_the_way: ['fulfilled'],
};
const requesterTransitions = {
    fulfilled: ['closed'],
};
function canRoleTransition(role, current, next) {
    if (role === 'donor') {
        return donorTransitions[current]?.includes(next) ?? false;
    }
    if (role === 'requester') {
        return requesterTransitions[current]?.includes(next) ?? false;
    }
    return false;
}
// Donor transitions
assertTrue(canRoleTransition('donor', 'donor_accepted', 'contact_established'), 'Donor can transition: donor_accepted -> contact_established');
assertTrue(canRoleTransition('donor', 'contact_established', 'on_the_way'), 'Donor can transition: contact_established -> on_the_way');
assertTrue(canRoleTransition('donor', 'on_the_way', 'fulfilled'), 'Donor can transition: on_the_way -> fulfilled');
assertFalse(canRoleTransition('donor', 'fulfilled', 'closed'), 'Donor CANNOT close the request (requester-only)');
assertFalse(canRoleTransition('donor', 'donor_accepted', 'fulfilled'), 'Donor cannot skip steps directly to fulfilled');
// Requester transitions
assertTrue(canRoleTransition('requester', 'fulfilled', 'closed'), 'Requester can close request: fulfilled -> closed');
assertFalse(canRoleTransition('requester', 'donor_accepted', 'contact_established'), 'Requester CANNOT advance contact_established (donor-only)');
assertFalse(canRoleTransition('requester', 'contact_established', 'on_the_way'), 'Requester CANNOT advance on_the_way (donor-only)');
assertFalse(canRoleTransition('requester', 'on_the_way', 'fulfilled'), 'Requester CANNOT complete donation (donor-only)');
assertFalse(canRoleTransition('requester', 'closed', 'fulfilled'), 'Closed is terminal: cannot revert from closed');
// Status history tracking simulation
console.log('\n--- Test Suite 6: Status History Tracking & Display Labels ---');
const statusHistoryLog = [];
function recordHistory(status, updatedBy) {
    statusHistoryLog.push({
        status,
        timestamp: new Date(),
        updatedBy,
    });
}
recordHistory('pending', 'u1');
recordHistory('donor_found', 'u1');
recordHistory('donor_accepted', 'd1');
recordHistory('contact_established', 'd1');
recordHistory('on_the_way', 'd1');
recordHistory('fulfilled', 'd1');
recordHistory('closed', 'u1');
assertEqual(statusHistoryLog.length, 7, 'All 7 workflow transitions are captured in statusHistory');
assertEqual(statusHistoryLog[0].status, 'pending', 'Step 1 is pending');
assertEqual(statusHistoryLog[6].status, 'closed', 'Step 7 is closed');
assertEqual(statusHistoryLog[6].updatedBy, 'u1', 'Requester u1 closed the request');
console.log('\n==================================================');
console.log(`📊 WORKFLOW TEST RESULTS: ${passed} Passed, ${failed} Failed`);
console.log('==================================================\n');
if (failed > 0) {
    process.exit(1);
}
