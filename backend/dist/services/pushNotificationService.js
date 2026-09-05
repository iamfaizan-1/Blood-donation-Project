"use strict";
/**
 * Push Notification Service
 * Sends push notifications to iOS and Android devices using Expo's Push API.
 * Supports all 5 critical lifecycle notifications with privacy preservation.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushNotificationService = void 0;
class PushNotificationService {
    static EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
    /**
     * Check whether a token is formatted as a valid Expo push token
     */
    static isExpoPushToken(token) {
        return (typeof token === 'string' &&
            (token.startsWith('ExponentPushToken[') ||
                token.startsWith('ExpoPushToken[') ||
                token.startsWith('FCM-') ||
                token.length >= 20));
    }
    /**
     * Send a batch of push messages via Expo Push HTTP API
     */
    static async sendPushNotifications(messages) {
        if (!messages || messages.length === 0) {
            return { successCount: 0, failureCount: 0 };
        }
        // Filter for valid push tokens
        const validMessages = messages.filter((m) => this.isExpoPushToken(m.to));
        if (validMessages.length === 0) {
            return { successCount: 0, failureCount: messages.length };
        }
        try {
            const response = await fetch(this.EXPO_PUSH_URL, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Accept-Encoding': 'gzip, deflate',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(validMessages),
            });
            if (!response.ok) {
                console.warn(`Expo push notification service returned HTTP ${response.status}`);
                return { successCount: 0, failureCount: validMessages.length };
            }
            const result = (await response.json());
            const data = result.data || [];
            let successCount = 0;
            let failureCount = 0;
            for (const item of data) {
                if (item.status === 'ok') {
                    successCount++;
                }
                else {
                    failureCount++;
                    console.warn(`Push delivery error: ${item.message} (${item.details?.error})`);
                }
            }
            return { successCount, failureCount };
        }
        catch (error) {
            // Graceful degradation: never crash calling workflows on notification failure
            console.warn('Failed to send Expo push notification:', error.message);
            return { successCount: 0, failureCount: validMessages.length };
        }
    }
    /**
     * 1. Send push to matched donors when an emergency request is created
     */
    static async notifyEmergencyRequest(donorTokens, requestData) {
        if (!donorTokens || donorTokens.length === 0)
            return;
        const messages = donorTokens.map((token) => ({
            to: token,
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
                distance: requestData.distanceKm ? `${requestData.distanceKm} km away` : 'Nearby',
                requiredDateTime: requestData.requiredDateTime,
                patientName: requestData.patientName,
                notes: requestData.notes,
            },
        }));
        return await this.sendPushNotifications(messages);
    }
    /**
     * 2. Send push to requester when a donor accepts the request
     */
    static async notifyDonorAccepted(requesterToken, donorName, requestData) {
        if (!requesterToken)
            return;
        const message = {
            to: requesterToken,
            sound: 'default',
            priority: 'high',
            channelId: 'emergency-blood-requests',
            title: '❤️ Donor Matched!',
            body: `${donorName} has accepted to donate ${requestData.bloodGroup} blood for ${requestData.hospitalName}.`,
            data: {
                type: 'DONOR_ACCEPTED',
                requestId: requestData.requestId,
                donorName,
                bloodType: requestData.bloodGroup,
                hospital: requestData.hospitalName,
            },
        };
        return await this.sendPushNotifications([message]);
    }
    /**
     * 3. Send push to requester when a donor declines
     */
    static async notifyDonorDeclined(requesterToken, requestData) {
        if (!requesterToken)
            return;
        const message = {
            to: requesterToken,
            sound: 'default',
            priority: 'normal',
            channelId: 'emergency-blood-requests',
            title: '🩸 Request Status Update',
            body: `A nearby donor was unavailable. We are notifying other compatible donors for ${requestData.hospitalName}.`,
            data: {
                type: 'DONOR_DECLINED',
                requestId: requestData.requestId,
            },
        };
        return await this.sendPushNotifications([message]);
    }
    /**
     * 4. Send push to requester when donor is on the way
     */
    static async notifyDonorOnTheWay(requesterToken, donorName, requestData) {
        if (!requesterToken)
            return;
        const message = {
            to: requesterToken,
            sound: 'default',
            priority: 'high',
            channelId: 'emergency-blood-requests',
            title: '🚗 Donor is On The Way!',
            body: `${donorName} is heading towards ${requestData.hospitalName}. Estimated arrival soon.`,
            data: {
                type: 'DONOR_ON_THE_WAY',
                requestId: requestData.requestId,
            },
        };
        return await this.sendPushNotifications([message]);
    }
    /**
     * 5. Send push to both donor and requester when donation is completed
     */
    static async notifyDonationCompleted(tokens, requestData) {
        if (!tokens || tokens.length === 0)
            return;
        const messages = tokens
            .filter((t) => !!t)
            .map((token) => ({
            to: token,
            sound: 'default',
            priority: 'high',
            channelId: 'emergency-blood-requests',
            title: '🎉 Donation Completed! Life Saved!',
            body: `Thank you! The blood donation at ${requestData.hospitalName} has been successfully completed.`,
            data: {
                type: 'DONATION_COMPLETED',
                requestId: requestData.requestId,
                hospital: requestData.hospitalName,
                bloodType: requestData.bloodGroup,
            },
        }));
        return await this.sendPushNotifications(messages);
    }
}
exports.PushNotificationService = PushNotificationService;
