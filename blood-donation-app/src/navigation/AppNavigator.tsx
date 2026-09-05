import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';

import { MainTabNavigator } from './MainTabNavigator';
import { LocationScreen } from '../screens/LocationScreen';
import { FindDonorsScreen } from '../screens/FindDonorsScreen';
import { DonorRequestScreen } from '../screens/DonorRequestScreen';
import { ActiveRequestScreen } from '../screens/ActiveRequestScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { DonationCompletedScreen } from '../screens/DonationCompletedScreen';

import { Colors } from '../constants/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      {/* Main bottom tab navigator */}
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />

      {/* Stack screens for wizard flows */}
      <Stack.Screen name="LocationStack" component={LocationScreen} />
      <Stack.Screen name="FindDonorsStack" component={FindDonorsScreen} />

      {/* Detail & status screens */}
      <Stack.Screen name="DonorRequest" component={DonorRequestScreen} />
      <Stack.Screen name="ActiveRequest" component={ActiveRequestScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen
        name="DonationCompleted"
        component={DonationCompletedScreen}
        options={{ animation: 'fade' }}
      />
    </Stack.Navigator>
  );
};
