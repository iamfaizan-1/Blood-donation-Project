/**
 * Blood Donation App — Navigation Type Definitions
 */

import { NavigatorScreenParams } from '@react-navigation/native';
import { BloodType, UrgencyLevel } from '../types';

/** Bottom tab routes */
export type MainTabParamList = {
  Home: undefined;
  FindDonors: { bloodType?: BloodType; hospital?: string } | undefined;
  RequestBlood: undefined;
  Location: { bloodType?: BloodType; units?: number; urgency?: UrgencyLevel } | undefined;
  Profile: undefined;
};

/** Stack routes (screens that push on top of tabs) */
export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList> | undefined;
  RequestBloodStack: undefined;
  LocationStack: { bloodType?: BloodType; units?: number; urgency?: UrgencyLevel } | undefined;
  FindDonorsStack: { bloodType?: BloodType; hospital?: string; radius?: number } | undefined;
  DonorRequest: {
    notificationId?: string;
    requestId?: string;
    donorName?: string;
    bloodType?: BloodType;
    hospital?: string;
    distance?: string;
    units?: number;
    urgency?: UrgencyLevel;
    requiredDateTime?: string | null;
    patientName?: string;
    notes?: string;
  } | undefined;
  ActiveRequest: {
    requestId?: string;
    donorName?: string;
    bloodType?: BloodType;
    hospital?: string;
    requesterName?: string;
    requesterPhone?: string;
    units?: number;
    urgency?: UrgencyLevel;
  } | undefined;
  Chat: {
    requestId: string;
    partnerName?: string;
    bloodType?: BloodType;
    hospital?: string;
  };
  DonationCompleted: { donationId?: string; bloodType?: BloodType; hospital?: string } | undefined;
  Insights: undefined;
  Chatbot: undefined;
};

/**
 * Augment React Navigation's global types so useNavigation()
 * is fully typed without explicit generics at every call-site.
 */
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
