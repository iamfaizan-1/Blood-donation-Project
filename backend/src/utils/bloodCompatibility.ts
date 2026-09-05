import { BloodGroup } from '../models/User.js';

/**
 * Recipient to Compatible Donor Blood Groups Mapping
 *
 * Rules based on ABO and Rh factor compatibility:
 * - O- is Universal Donor (can donate to all groups)
 * - AB+ is Universal Recipient (can receive from all groups)
 */
export const COMPATIBILITY_MAP: Record<BloodGroup, BloodGroup[]> = {
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
 * Returns an array of compatible donor blood groups for a required recipient blood group.
 */
export const getCompatibleDonorTypes = (recipientType: BloodGroup): BloodGroup[] => {
  return COMPATIBILITY_MAP[recipientType] || [recipientType];
};

/**
 * Checks if a donor blood group can donate to a recipient blood group.
 */
export const isBloodCompatible = (
  donorType: BloodGroup,
  recipientType: BloodGroup
): boolean => {
  const compatibleTypes = getCompatibleDonorTypes(recipientType);
  return compatibleTypes.includes(donorType);
};
