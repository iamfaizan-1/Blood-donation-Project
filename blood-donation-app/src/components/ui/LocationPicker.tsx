import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { locationService, LocationCoordinates, LocationResult } from '../../services/locationService';
import { Input } from './Input';
import { Button } from './Button';
import { Card } from './Card';
import { Badge } from './Badge';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius, TouchTarget } from '../../constants/spacing';
import { TextStyles, FontWeights } from '../../constants/typography';

export type RadiusOption = 5 | 10 | 20;

export interface SelectedLocationData {
  address: string;
  hospitalName: string;
  coordinates: LocationCoordinates;
  radiusKm: RadiusOption;
}

export interface HospitalOption {
  id: string;
  name: string;
  address: string;
  distance: string;
  coordinates: LocationCoordinates;
}

const PRESET_HOSPITALS: HospitalOption[] = [
  {
    id: 'h1',
    name: 'City General Hospital',
    address: '123 Health Blvd, Central District',
    distance: '1.8 km',
    coordinates: { latitude: 40.7128, longitude: -74.0060 },
  },
  {
    id: 'h2',
    name: 'St. Jude Medical Center',
    address: '456 Mercy Way, Northside',
    distance: '3.4 km',
    coordinates: { latitude: 40.7250, longitude: -73.9980 },
  },
  {
    id: 'h3',
    name: 'Red Cross Blood Center',
    address: '789 Life Care Ave, Downtown',
    distance: '4.9 km',
    coordinates: { latitude: 40.7010, longitude: -74.0120 },
  },
];

interface LocationPickerProps {
  initialHospitalName?: string;
  initialRadius?: RadiusOption;
  onLocationChange: (data: SelectedLocationData) => void;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  initialHospitalName = 'City General Hospital',
  initialRadius = 5,
  onLocationChange,
}) => {
  const [selectedRadius, setSelectedRadius] = useState<RadiusOption>(initialRadius);
  const [hospitalName, setHospitalName] = useState<string>(initialHospitalName);
  const [coordinates, setCoordinates] = useState<LocationCoordinates>({
    latitude: 40.7128,
    longitude: -74.0060,
  });
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('h1');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'success' | 'denied' | 'error'>('idle');

  // Trigger GPS Location Detection
  const handleDetectGPS = async () => {
    setIsLocating(true);
    setLocationStatus('idle');

    const result: LocationResult = await locationService.getCurrentLocation();
    setIsLocating(false);

    if (result.error === 'LOCATION_PERMISSION_DENIED') {
      setLocationStatus('denied');
      Alert.alert(
        'Permission Denied',
        'Location permission was denied. You can manually enter the hospital name or address below.'
      );
    } else if (result.error === 'GPS_UNAVAILABLE') {
      setLocationStatus('error');
      Alert.alert(
        'GPS Unavailable',
        'Could not access GPS coordinates. Using manual search.'
      );
    } else {
      setLocationStatus('success');
      setCoordinates(result.coordinates);
      const newAddress = `${hospitalName} (${result.address})`;

      onLocationChange({
        address: newAddress,
        hospitalName,
        coordinates: result.coordinates,
        radiusKm: selectedRadius,
      });

      Alert.alert(
        'GPS Location Detected! 📍',
        `Current location updated: ${result.address}`
      );
    }
  };

  const handleSelectHospital = (hospital: HospitalOption) => {
    setSelectedHospitalId(hospital.id);
    setHospitalName(hospital.name);
    setCoordinates(hospital.coordinates);

    onLocationChange({
      address: hospital.address,
      hospitalName: hospital.name,
      coordinates: hospital.coordinates,
      radiusKm: selectedRadius,
    });
  };

  const handleRadiusChange = (radius: RadiusOption) => {
    setSelectedRadius(radius);
    onLocationChange({
      address: hospitalName,
      hospitalName,
      coordinates,
      radiusKm: radius,
    });
  };

  return (
    <View style={styles.container}>
      {/* GPS Location Button */}
      <Button
        title={isLocating ? 'Detecting GPS Coordinates...' : '📍 Use Current GPS Location'}
        onPress={handleDetectGPS}
        loading={isLocating}
        variant="secondary"
        size="md"
        fullWidth
        style={styles.gpsBtn}
      />

      {/* Permission Denied / Error Alert Notice */}
      {locationStatus === 'denied' && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>
            ⚠️ Location permission denied. Please select hospital manually below.
          </Text>
        </View>
      )}

      {/* Manual Hospital & Location Input */}
      <Input
        label="Hospital Name or Emergency Location"
        placeholder="Enter hospital or medical center name..."
        value={hospitalName}
        onChangeText={(text) => {
          setHospitalName(text);
          onLocationChange({
            address: text,
            hospitalName: text,
            coordinates,
            radiusKm: selectedRadius,
          });
        }}
        prefixIcon={<Text style={{ fontSize: 16 }}>🏥</Text>}
      />

      {/* Radius Selector Options: 5km, 10km, 20km */}
      <Text style={styles.sectionLabel}>Search Radius</Text>
      <View style={styles.radiusRow}>
        {([5, 10, 20] as RadiusOption[]).map((radius) => {
          const isSelected = selectedRadius === radius;
          return (
            <TouchableOpacity
              key={radius}
              activeOpacity={0.8}
              onPress={() => handleRadiusChange(radius)}
              style={[
                styles.radiusChip,
                isSelected && styles.radiusChipSelected,
              ]}
            >
              <Text style={[styles.radiusText, isSelected && styles.radiusTextSelected]}>
                {radius} km Radius
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Interactive Map Visual Representation */}
      <Text style={styles.sectionLabel}>Hospital & Search Radius Map</Text>
      <Card variant="outlined" padding="none" style={styles.mapCard}>
        <View style={styles.mapGraphic}>
          <View style={styles.mapGridLine1} />
          <View style={styles.mapGridLine2} />

          {/* Center User/Hospital Pin */}
          <View style={styles.userPin}>
            <Text style={styles.pinIcon}>📍</Text>
            <View style={styles.pulseDot} />
          </View>

          {/* Radius Circle Indicator Overlay */}
          <View
            style={[
              styles.radiusCircleOverlay,
              {
                width: selectedRadius === 5 ? 100 : selectedRadius === 10 ? 130 : 160,
                height: selectedRadius === 5 ? 100 : selectedRadius === 10 ? 130 : 160,
                borderRadius: selectedRadius === 5 ? 50 : selectedRadius === 10 ? 65 : 80,
              },
            ]}
          />

          {/* Nearby Hospital Pins */}
          <View style={[styles.hospitalPin, { top: 25, right: 40 }]}>
            <Text style={styles.hospitalPinIcon}>🏥</Text>
            <Text style={styles.pinLabel}>City General (1.8km)</Text>
          </View>

          <View style={[styles.hospitalPin, { bottom: 25, left: 30 }]}>
            <Text style={styles.hospitalPinIcon}>🏥</Text>
            <Text style={styles.pinLabel}>St. Jude (3.4km)</Text>
          </View>

          <View style={styles.mapOverlay}>
            <Text style={styles.mapOverlayText}>
              Showing verified donors within {selectedRadius}km of {hospitalName}
            </Text>
          </View>
        </View>
      </Card>

      {/* Hospital Preset List */}
      <Text style={styles.sectionLabel}>Select Destination Hospital</Text>
      {PRESET_HOSPITALS.map((hospital) => {
        const isSelected = selectedHospitalId === hospital.id;
        return (
          <TouchableOpacity
            key={hospital.id}
            activeOpacity={0.9}
            onPress={() => handleSelectHospital(hospital)}
          >
            <Card
              variant={isSelected ? 'elevated' : 'outlined'}
              padding="md"
              style={[
                styles.hospitalCard,
                isSelected && styles.hospitalCardSelected,
              ]}
            >
              <View style={styles.hospitalHeader}>
                <View style={styles.hospitalIcon}>
                  <Text style={{ fontSize: 22 }}>🏥</Text>
                </View>
                <View style={styles.hospitalInfo}>
                  <Text style={styles.hospitalTitle}>{hospital.name}</Text>
                  <Text style={styles.hospitalAddress}>{hospital.address}</Text>
                </View>
                <View style={styles.hospitalRight}>
                  <Badge label={hospital.distance} variant="neutral" size="sm" />
                  {isSelected && <Text style={styles.checkMark}>✓</Text>}
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  gpsBtn: {
    marginBottom: Spacing.md,
  },
  errorBanner: {
    backgroundColor: Colors.warningLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  errorText: {
    ...TextStyles.caption,
    color: Colors.warningDark,
    fontWeight: FontWeights.semibold,
  },
  sectionLabel: {
    ...TextStyles.bodySmall,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },

  radiusRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  radiusChip: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    minHeight: TouchTarget.comfortable, // 48px accessible touch target
  },
  radiusChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  radiusText: {
    ...TextStyles.caption,
    fontWeight: FontWeights.bold,
    color: Colors.textSecondary,
  },
  radiusTextSelected: {
    color: Colors.textInverse,
  },

  mapCard: {
    height: 180,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    backgroundColor: '#eaf4f4',
  },
  mapGraphic: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapGridLine1: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    top: 80,
  },
  mapGridLine2: {
    position: 'absolute',
    height: '100%',
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    left: 170,
  },
  userPin: {
    alignItems: 'center',
    zIndex: 2,
  },
  pinIcon: {
    fontSize: 30,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginTop: -4,
  },
  radiusCircleOverlay: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(220, 38, 38, 0.4)',
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    zIndex: 1,
  },
  hospitalPin: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.md,
    elevation: 3,
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 3,
  },
  hospitalPinIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  pinLabel: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    zIndex: 4,
  },
  mapOverlayText: {
    fontSize: 10,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },

  hospitalCard: {
    marginBottom: Spacing.sm,
  },
  hospitalCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    backgroundColor: Colors.primaryLight,
  },
  hospitalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hospitalIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  hospitalInfo: {
    flex: 1,
  },
  hospitalTitle: {
    ...TextStyles.bodySmall,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  hospitalAddress: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  hospitalRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  checkMark: {
    fontSize: 16,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
});
