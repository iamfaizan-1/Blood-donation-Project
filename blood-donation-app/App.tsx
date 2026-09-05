import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { navigationRef } from './src/navigation/navigationRef';
import { notificationService } from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    // 1. Request notification permissions and register push token
    notificationService.registerForPushNotificationsAsync();

    // 2. Setup foreground received and user tap response listeners
    const cleanupListeners = notificationService.setupNotificationListeners();

    return () => {
      cleanupListeners?.();
    };
  }, []);

  return (
    <AuthProvider>
      <NavigationContainer ref={navigationRef}>
        <StatusBar style="dark" />
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
