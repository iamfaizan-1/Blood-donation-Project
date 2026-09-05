import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationResult {
  coordinates: LocationCoordinates;
  address: string;
  isGpsDetected: boolean;
  error?: string;
}

export const locationService = {
  /**
   * Request Location Permission from User
   */
  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permission', error);
      return false;
    }
  },

  /**
   * Get User's Current GPS Location with error fallback handling
   */
  async getCurrentLocation(): Promise<LocationResult> {
    try {
      // 1. Check & Request Permissions
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return {
          coordinates: { latitude: 40.7128, longitude: -74.0060 }, // NYC Fallback
          address: 'City General Hospital, Central District',
          isGpsDetected: false,
          error: 'LOCATION_PERMISSION_DENIED',
        };
      }

      // 2. Fetch GPS Position
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = position.coords;

      // 3. Reverse Geocode Address
      let address = 'Detected GPS Location';
      try {
        const geocode = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocode && geocode.length > 0) {
          const item = geocode[0];
          const parts = [
            item.name || item.street,
            item.district || item.city,
            item.region,
          ].filter(Boolean);
          address = parts.join(', ') || address;
        }
      } catch (geocodeError) {
        console.log('Reverse geocoding unavailable, using raw coordinates');
      }

      return {
        coordinates: { latitude, longitude },
        address,
        isGpsDetected: true,
      };
    } catch (error: any) {
      console.error('GPS location detection error:', error);
      let errorMsg = 'GPS_UNAVAILABLE';
      if (error.message && error.message.includes('permission')) {
        errorMsg = 'LOCATION_PERMISSION_DENIED';
      }

      return {
        coordinates: { latitude: 40.7128, longitude: -74.0060 },
        address: 'City General Hospital, Central District',
        isGpsDetected: false,
        error: errorMsg,
      };
    }
  },
};
