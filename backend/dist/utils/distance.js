"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistanceKm = void 0;
/**
 * Calculates the approximate distance in kilometers between two geographic coordinates
 * using the Haversine formula.
 */
const calculateDistanceKm = (coord1, coord2) => {
    if (!coord1 ||
        !coord2 ||
        coord1.latitude === undefined ||
        coord1.longitude === undefined ||
        coord2.latitude === undefined ||
        coord2.longitude === undefined) {
        return 0;
    }
    // If coordinates are 0,0 (mock data default), return mock distance based on ID hashing or fallback
    if ((coord1.latitude === 0 && coord1.longitude === 0) ||
        (coord2.latitude === 0 && coord2.longitude === 0)) {
        return 2.5; // Default fallback distance
    }
    const EARTH_RADIUS_KM = 6371;
    const dLat = degreesToRadians(coord2.latitude - coord1.latitude);
    const dLon = degreesToRadians(coord2.longitude - coord1.longitude);
    const lat1Rad = degreesToRadians(coord1.latitude);
    const lat2Rad = degreesToRadians(coord2.latitude);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = EARTH_RADIUS_KM * c;
    return Math.round(distance * 10) / 10; // Round to 1 decimal place e.g. 2.4 km
};
exports.calculateDistanceKm = calculateDistanceKm;
const degreesToRadians = (degrees) => {
    return (degrees * Math.PI) / 180;
};
