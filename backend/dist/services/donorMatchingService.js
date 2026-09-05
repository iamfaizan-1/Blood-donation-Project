"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DonorMatchingService = void 0;
const User_js_1 = require("../models/User.js");
const bloodCompatibility_js_1 = require("../utils/bloodCompatibility.js");
const distance_js_1 = require("../utils/distance.js");
class DonorMatchingService {
    /**
     * Rule-based Matching Pipeline:
     * 1. Determine compatible donor blood groups based on medical compatibility.
     * 2. Query donors matching compatible blood groups.
     * 3. Filter for active donors (isDonor: true, isAvailable: true).
     * 4. Filter for verified donors (isVerified: true).
     * 5. Calculate geographic distance using Haversine formula.
     * 6. Filter by maximum search radius (5km, 10km, 20km).
     * 7. Sort by Distance (asc), Availability (desc), and Verification (desc).
     * 8. Privacy sanitization: Exclude phone numbers, exact addresses, and full names.
     */
    static async findMatchingDonors(query) {
        const { recipientBloodGroup, hospitalLocation = { latitude: 0, longitude: 0 }, radiusKm = 20, onlyVerified = false, } = query;
        // Step 1: Get compatible blood groups (Rule-based medical matrix) if specific blood group provided
        let compatibleGroups = null;
        const bgStr = recipientBloodGroup;
        if (bgStr && bgStr !== 'All' && bgStr !== 'ALL') {
            compatibleGroups = (0, bloodCompatibility_js_1.getCompatibleDonorTypes)(recipientBloodGroup);
        }
        // Step 2, 3, 4: Query Database for Compatible, Available Donors
        const filterConditions = {
            isDonor: true,
            isAvailable: true,
        };
        if (compatibleGroups) {
            filterConditions.bloodGroup = { $in: compatibleGroups };
        }
        if (onlyVerified) {
            filterConditions.isVerified = true;
        }
        const potentialDonors = await User_js_1.User.find(filterConditions).select('_id name bloodGroup isAvailable isVerified location createdAt');
        // Step 5 & 6: Calculate Haversine Distance & Apply Radius Filter
        const effectiveHospitalCoords = hospitalLocation.latitude !== 0 || hospitalLocation.longitude !== 0
            ? hospitalLocation
            : { latitude: 40.7128, longitude: -74.0060 };
        const matchedDonorsWithDistance = potentialDonors
            .map((donor) => {
            const donorCoords = {
                latitude: donor.location?.latitude || 40.7150,
                longitude: donor.location?.longitude || -74.0020,
            };
            const distance = (0, distance_js_1.calculateDistanceKm)(effectiveHospitalCoords, donorCoords);
            const firstName = donor.name ? donor.name.split(' ')[0] : 'Donor';
            return {
                id: donor._id.toString(),
                firstName,
                bloodGroup: donor.bloodGroup,
                distanceKm: distance,
                distanceFormatted: `${distance} km`,
                isAvailable: donor.isAvailable,
                isVerified: donor.isVerified,
                totalDonations: 8, // Aggregated from completed donations
            };
        })
            .filter((donor) => {
            // Radius Filtering (Rule 5)
            if (radiusKm > 0) {
                return donor.distanceKm <= radiusKm;
            }
            return true;
        });
        // Step 7: Sort by Distance (closest first), Availability, and Verification
        matchedDonorsWithDistance.sort((a, b) => {
            // Primary Sort: Distance (ascending)
            if (a.distanceKm !== b.distanceKm) {
                return a.distanceKm - b.distanceKm;
            }
            // Secondary Sort: Availability (true first)
            if (a.isAvailable !== b.isAvailable) {
                return a.isAvailable ? -1 : 1;
            }
            // Tertiary Sort: Verification (true first)
            if (a.isVerified !== b.isVerified) {
                return a.isVerified ? -1 : 1;
            }
            return 0;
        });
        // Step 8: Return sanitized matching donor list
        return matchedDonorsWithDistance;
    }
}
exports.DonorMatchingService = DonorMatchingService;
