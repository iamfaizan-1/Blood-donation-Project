/**
 * Blood Donation App — Shared TypeScript Types
 */

/** Supported blood types */
export type BloodType =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-';

/** Urgency level for blood requests */
export type UrgencyLevel = 'critical' | 'urgent' | 'normal';

/** Status of a blood request */
export type RequestStatus =
  | 'pending'
  | 'matching'
  | 'donor_found'
  | 'donor_accepted'
  | 'contact_established'
  | 'on_the_way'
  | 'active'
  | 'fulfilled'
  | 'closed'
  | 'cancelled'
  | 'expired';

/** Donor availability */
export type DonorStatus = 'available' | 'unavailable' | 'donating';

/** User profile */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  bloodType: BloodType;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  isDonor: boolean;
  lastDonation?: string; // ISO date
  totalDonations: number;
  avatarUrl?: string;
}

/** Blood request */
export interface BloodRequest {
  id: string;
  requesterId: string;
  bloodType: BloodType;
  urgency: UrgencyLevel;
  units: number;
  hospital: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: RequestStatus;
  createdAt: string; // ISO date
  expiresAt: string; // ISO date
  notes?: string;
}

/** Donor info (for Find Donors) */
export interface Donor {
  id: string;
  name: string;
  bloodType: BloodType;
  distance: number; // km
  status: DonorStatus;
  lastDonation?: string;
  totalDonations: number;
  avatarUrl?: string;
}

/** Notification sent to a matched donor */
export interface DonorNotification {
  notificationId: string;
  requestId: string;
  bloodGroup: BloodType;
  unitsRequired: number;
  hospitalName: string;
  hospitalAddress: string;
  distanceKm: number;
  distanceFormatted: string;
  urgency: UrgencyLevel;
  requiredDateTime: string | null;
  patientName: string;
  notes: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  requestStatus: RequestStatus;
  createdAt: string;
}

/** Accepted request details with privacy-gated contact access */
export interface AcceptedRequestDetails {
  request: {
    _id: string;
    patientName: string;
    bloodGroup: BloodType;
    unitsRequired: number;
    hospitalName: string;
    hospitalLocation?: {
      address: string;
      latitude: number;
      longitude: number;
    };
    urgency: UrgencyLevel;
    requiredDateTime?: string;
    notes?: string;
    status: RequestStatus;
    statusHistory?: Array<{
      status: string;
      timestamp: string;
      updatedBy?: string;
    }>;
    requesterId?: string;
    acceptedDonorId?: string;
    createdAt: string;
  };
  requesterContact?: {
    name: string;
    phone: string;
  };
  donorContact?: {
    name: string;
    phone: string;
    bloodGroup: string;
  };
}
