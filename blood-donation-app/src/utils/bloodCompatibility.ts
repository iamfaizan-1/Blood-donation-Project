import { BloodType } from '../types';

/**
 * Medical Compatibility Table: Recipient Blood Group -> Compatible Donor Blood Groups
 */
export const COMPATIBILITY_MAP: Record<BloodType, BloodType[]> = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
};

/**
 * Get compatible donor blood types for a given recipient blood type
 */
export const getCompatibleDonorTypes = (recipientType: BloodType): BloodType[] => {
  return COMPATIBILITY_MAP[recipientType] || [recipientType];
};

/**
 * Check if a donor blood group is medically compatible with a recipient blood group
 */
export const isBloodCompatible = (donorType: BloodType, recipientType: BloodType): boolean => {
  const compatibleTypes = getCompatibleDonorTypes(recipientType);
  return compatibleTypes.includes(donorType);
};
