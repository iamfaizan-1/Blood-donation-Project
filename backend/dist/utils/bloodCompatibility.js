"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBloodCompatible = exports.getCompatibleDonorTypes = exports.COMPATIBILITY_MAP = void 0;
/**
 * Recipient to Compatible Donor Blood Groups Mapping
 *
 * Rules based on ABO and Rh factor compatibility:
 * - O- is Universal Donor (can donate to all groups)
 * - AB+ is Universal Recipient (can receive from all groups)
 */
exports.COMPATIBILITY_MAP = {
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
const getCompatibleDonorTypes = (recipientType) => {
    return exports.COMPATIBILITY_MAP[recipientType] || [recipientType];
};
exports.getCompatibleDonorTypes = getCompatibleDonorTypes;
/**
 * Checks if a donor blood group can donate to a recipient blood group.
 */
const isBloodCompatible = (donorType, recipientType) => {
    const compatibleTypes = (0, exports.getCompatibleDonorTypes)(recipientType);
    return compatibleTypes.includes(donorType);
};
exports.isBloodCompatible = isBloodCompatible;
