import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { userService } from './userService';
import { navigate } from '../navigation/navigationRef';

// Configure foreground notification presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  /**
   * Request push notification permissions and retrieve Expo Push Token
   */
  registerForPushNotificationsAsync: async (): Promise<string | null> => {
    let token: string | null = null;

    try {
      // Configure Android emergency notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('emergency-blood-requests', {
          name: 'Emergency Blood Requests',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#E53E3E',
          sound: 'default',
          enableLights: true,
          enableVibrate: true,
        });
      }

      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== 'granted') {
          console.warn('Push notification permission denied by user');
          return null;
        }

        const pushTokenData = await Notifications.getExpoPushTokenAsync({
          // projectId is optional in development or automatically picked up by app.json
        });
        token = pushTokenData.data;
      } else {
        // Simulator or Web fallback: generate a valid-format test token so backend flow can be validated
        console.log('Running on Simulator/Web: Using mock Expo push token for testing');
        token = `ExponentPushToken[mock-device-${Math.random().toString(36).substring(2, 9)}]`;
      }

      // Automatically register token with backend if user is authenticated
      if (token) {
        try {
          await userService.registerPushToken(token);
          console.log('Push token successfully registered with backend:', token);
        } catch (apiError: any) {
          // Unauthenticated or network error: will retry upon login
          console.log('Push token registration deferred (user not yet authenticated or offline)');
        }
      }

      return token;
    } catch (error: any) {
      console.warn('Error during push notification registration:', error.message);
      return null;
    }
  },

  /**
   * Upload push token to backend for the currently authenticated user
   */
  syncPushTokenWithBackend: async (token?: string | null): Promise<void> => {
    try {
      const activeToken = token || (await notificationService.registerForPushNotificationsAsync());
      if (activeToken) {
        await userService.registerPushToken(activeToken);
        console.log('Push token synced with backend account');
      }
    } catch (error: any) {
      console.warn('Deferred push token sync:', error.message);
    }
  },

  /**
   * Setup listeners for foreground notifications and user tap responses
   */
  setupNotificationListeners: () => {
    // 1. In-App Foreground Notification Received Listener
    const notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body } = notification.request.content;
      console.log('Notification received in foreground:', title, body);
    });

    // 2. Notification Tap / Response Received Listener
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data || {};
      console.log('User tapped push notification with data:', data);

      notificationService.handleNotificationNavigation(data);
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  },

  /**
   * Route user to the appropriate screen based on notification type and data payload
   */
  handleNotificationNavigation: (data: any) => {
    if (!data || !data.type) return;

    switch (data.type) {
      case 'NEW_REQUEST':
        // Navigate donor to emergency request screen
        navigate('DonorRequest', {
          requestId: data.requestId,
          bloodType: data.bloodType,
          units: data.units,
          hospital: data.hospital,
          distance: data.distance,
          urgency: data.urgency,
          patientName: data.patientName,
          requiredDateTime: data.requiredDateTime,
          notes: data.notes,
        });
        break;

      case 'DONOR_ACCEPTED':
      case 'DONOR_ON_THE_WAY':
        // Navigate requester/donor to active tracking screen
        navigate('ActiveRequest', {
          requestId: data.requestId,
          donorName: data.donorName,
          bloodType: data.bloodType,
          hospital: data.hospital,
        });
        break;

      case 'DONOR_DECLINED':
        // Alert requester that search continues and open active request
        Alert.alert(
          'Donation Search Ongoing',
          'A nearby donor was unavailable. We are actively notifying other compatible donors.',
          [
            {
              text: 'View Request',
              onPress: () =>
                navigate('ActiveRequest', {
                  requestId: data.requestId,
                }),
            },
            { text: 'OK' },
          ]
        );
        break;

      case 'DONATION_COMPLETED':
        // Navigate to completion celebration screen
        navigate('DonationCompleted', {
          donationId: data.donationId || `DON-${Math.floor(10000 + Math.random() * 90000)}`,
          bloodType: data.bloodType,
          hospital: data.hospital,
        });
        break;

      default:
        console.log('Unknown notification type:', data.type);
    }
  },
};

export default notificationService;
