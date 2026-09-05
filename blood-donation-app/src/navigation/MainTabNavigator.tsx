import React from 'react';
import { Text, StyleSheet, View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';

import { HomeScreen } from '../screens/HomeScreen';
import { FindDonorsScreen } from '../screens/FindDonorsScreen';
import { RequestBloodScreen } from '../screens/RequestBloodScreen';
import { LocationScreen } from '../screens/LocationScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

import { Colors } from '../constants/colors';
import { FontSizes, FontWeights } from '../constants/typography';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon = ({ emoji, focused }: { emoji: string; focused: boolean }) => (
  <Text style={[styles.icon, focused && styles.iconFocused]}>{emoji}</Text>
);

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textTertiary,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="FindDonors"
        component={FindDonorsScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔍" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="RequestBlood"
        component={RequestBloodScreen}
        options={{
          tabBarLabel: 'Request',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.centerTab, focused && styles.centerTabFocused]}>
              <Text style={styles.centerTabIcon}>🩸</Text>
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Location"
        component={LocationScreen}
        options={{
          tabBarLabel: 'Donate',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📍" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 8,
    elevation: 8,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  tabLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    marginTop: 2,
  },
  icon: {
    fontSize: 22,
    opacity: 0.5,
  },
  iconFocused: {
    opacity: 1,
  },
  centerTab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  centerTabFocused: {
    backgroundColor: Colors.primaryDark,
    transform: [{ scale: 1.05 }],
  },
  centerTabIcon: {
    fontSize: 22,
  },
});
