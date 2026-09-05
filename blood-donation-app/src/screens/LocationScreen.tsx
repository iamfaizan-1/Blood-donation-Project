import React, { useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../components/shared/ScreenWrapper';
import { Header } from '../components/ui/Header';
import { Button } from '../components/ui/Button';
import { LocationPicker, SelectedLocationData, RadiusOption } from '../components/ui/LocationPicker';
import { BloodType } from '../types';
import { RootStackParamList } from '../navigation/types';

type LocationScreenRouteProp = RouteProp<RootStackParamList, 'LocationStack'>;
type LocationScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const LocationScreen: React.FC = () => {
  const navigation = useNavigation<LocationScreenNavigationProp>();
  const route = useRoute<LocationScreenRouteProp>();

  const bloodType: BloodType = (route.params?.bloodType as BloodType) || 'O+';
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocationData>({
    address: 'City General Hospital, Central District',
    hospitalName: 'City General Hospital',
    coordinates: { latitude: 40.7128, longitude: -74.0060 },
    radiusKm: 5,
  });

  const handleContinue = () => {
    navigation.navigate('FindDonorsStack', {
      bloodType,
      hospital: selectedLocation.hospitalName,
      radius: selectedLocation.radiusKm,
    });
  };

  return (
    <ScreenWrapper>
      <Header
        title="Location & Hospital"
        subtitle="Step 2 of 3: Select location and search radius"
        showBack
      />

      {/* Reusable Location Picker Component */}
      <LocationPicker
        initialHospitalName={selectedLocation.hospitalName}
        initialRadius={selectedLocation.radiusKm}
        onLocationChange={(data) => setSelectedLocation(data)}
      />

      {/* Continue Button */}
      <Button
        title="Find Compatible Donors →"
        onPress={handleContinue}
        variant="emergency"
        size="lg"
        fullWidth
        style={{ marginTop: 16, marginBottom: 32 }}
      />
    </ScreenWrapper>
  );
};
