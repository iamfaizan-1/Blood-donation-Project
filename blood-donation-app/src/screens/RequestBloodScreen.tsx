import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { showAlert } from '../utils/alert';
import { ScreenWrapper } from '../components/shared/ScreenWrapper';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { BloodGroupSelector } from '../components/ui/BloodGroupSelector';
import { AuthModal } from '../components/ui/AuthModal';
import { useAuth } from '../context/AuthContext';
import { requestService } from '../services/requestService';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadius } from '../constants/spacing';
import { TextStyles, FontWeights } from '../constants/typography';
import { BloodType, UrgencyLevel } from '../types';
import { RootStackParamList } from '../navigation/types';

type RequestBloodNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const RequestBloodScreen: React.FC = () => {
  const navigation = useNavigation<RequestBloodNavigationProp>();
  const { user, isAuthenticated } = useAuth();

  const [selectedBloodType, setSelectedBloodType] = useState<BloodType>('O+');
  const [units, setUnits] = useState<number>(2);
  const [urgency, setUrgency] = useState<UrgencyLevel>('critical');
  const [patientName, setPatientName] = useState('Sarah Jenkins');
  const [hospitalName, setHospitalName] = useState('City General Hospital');
  const [contactNumber, setContactNumber] = useState('+1 (555) 234-4921');
  const [notes, setNotes] = useState('Emergency surgery requirement');
  const [loading, setLoading] = useState(false);
  const [authModalVisible, setAuthModalVisible] = useState(false);

  React.useEffect(() => {
    if (user) {
      if (user.phone && (!contactNumber || contactNumber === '+1 (555) 234-4921')) {
        setContactNumber(user.phone);
      }
      if (user.bloodGroup) {
        setSelectedBloodType(user.bloodGroup as BloodType);
      }
    }
  }, [user]);

  const handleIncrementUnits = () => {
    if (units < 10) setUnits(units + 1);
  };

  const handleDecrementUnits = () => {
    if (units > 1) setUnits(units - 1);
  };

  const handleContinue = async () => {
    if (!selectedBloodType) {
      showAlert('Required', 'Please select a blood group.');
      return;
    }

    if (!patientName || !hospitalName || !contactNumber) {
      showAlert('Required', 'Please fill in patient name, hospital, and contact number.');
      return;
    }

    if (!isAuthenticated) {
      setAuthModalVisible(true);
      return;
    }

    setLoading(true);
    try {
      // Submit request to backend API
      const newRequest = await requestService.createRequest({
        patientName,
        bloodGroup: selectedBloodType,
        unitsRequired: units,
        hospitalName,
        urgency,
        contactNumber,
        notes,
      });

      showAlert(
        'Blood Request Broadcasted! 🚨',
        `Your request for ${units} units of ${selectedBloodType} blood at ${hospitalName} is live and notifying nearby donors.`,
        [
          {
            text: 'Track Request Now',
            onPress: () => {
              navigation.navigate('ActiveRequest', {
                requestId: newRequest._id,
                bloodType: newRequest.bloodGroup,
                hospital: newRequest.hospitalName,
                units: newRequest.unitsRequired,
                urgency: newRequest.urgency,
              });
            },
          },
        ]
      );

      // Proactively navigate to Active Request screen
      navigation.navigate('ActiveRequest', {
        requestId: newRequest._id,
        bloodType: newRequest.bloodGroup,
        hospital: newRequest.hospitalName,
        units: newRequest.unitsRequired,
        urgency: newRequest.urgency,
      });
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || 'Failed to submit blood request';
      showAlert('Submission Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header
        title="Request Blood"
        subtitle="Step 1 of 3: Request Specifications"
      />

      <Card variant="elevated" padding="lg" style={styles.card}>
        {/* Blood Group Selection */}
        <BloodGroupSelector
          selectedType={selectedBloodType}
          onSelectType={(type) => setSelectedBloodType(type)}
          label="1. Required Blood Group"
        />

        {/* Units Counter */}
        <Text style={styles.sectionLabel}>2. Blood Units Required</Text>
        <View style={styles.unitsContainer}>
          <TouchableOpacity
            style={[styles.unitBtn, units <= 1 && styles.unitBtnDisabled]}
            onPress={handleDecrementUnits}
            disabled={units <= 1}
            activeOpacity={0.7}
          >
            <Text style={styles.unitBtnText}>-</Text>
          </TouchableOpacity>

          <View style={styles.unitDisplay}>
            <Text style={styles.unitNumber}>{units}</Text>
            <Text style={styles.unitSublabel}>Unit{units > 1 ? 's' : ''} (approx {units * 450}ml)</Text>
          </View>

          <TouchableOpacity
            style={styles.unitBtn}
            onPress={handleIncrementUnits}
            activeOpacity={0.7}
          >
            <Text style={styles.unitBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Urgency Selection */}
        <Text style={styles.sectionLabel}>3. Urgency Level</Text>
        <View style={styles.urgencyGrid}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setUrgency('critical')}
            style={[
              styles.urgencyCard,
              urgency === 'critical' && styles.urgencyCriticalActive,
            ]}
          >
            <Text style={styles.urgencyIcon}>🔴</Text>
            <Text style={[styles.urgencyTitle, urgency === 'critical' && styles.urgencyTitleActive]}>
              Critical
            </Text>
            <Text style={styles.urgencyDesc}>Immediate (&lt; 2 hrs)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setUrgency('urgent')}
            style={[
              styles.urgencyCard,
              urgency === 'urgent' && styles.urgencyUrgentActive,
            ]}
          >
            <Text style={styles.urgencyIcon}>🟡</Text>
            <Text style={[styles.urgencyTitle, urgency === 'urgent' && styles.urgencyTitleActive]}>
              Urgent
            </Text>
            <Text style={styles.urgencyDesc}>Today (&lt; 12 hrs)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setUrgency('normal')}
            style={[
              styles.urgencyCard,
              urgency === 'normal' && styles.urgencyNormalActive,
            ]}
          >
            <Text style={styles.urgencyIcon}>🟢</Text>
            <Text style={[styles.urgencyTitle, urgency === 'normal' && styles.urgencyTitleActive]}>
              Normal
            </Text>
            <Text style={styles.urgencyDesc}>Within 24-48 hrs</Text>
          </TouchableOpacity>
        </View>

        {/* Patient Details */}
        <Text style={styles.sectionLabel}>4. Patient & Hospital Details</Text>
        <Input
          label="Patient Full Name *"
          value={patientName}
          onChangeText={setPatientName}
          placeholder="e.g. Sarah Jenkins"
        />

        <Input
          label="Hospital Name *"
          value={hospitalName}
          onChangeText={setHospitalName}
          placeholder="e.g. City General Hospital"
        />

        <Input
          label="Emergency Contact Phone *"
          value={contactNumber}
          onChangeText={setContactNumber}
          placeholder="e.g. +1 555-234-4921"
          keyboardType="phone-pad"
          hint="Direct telephone line for responding donors"
        />

        <Input
          label="Medical Notes / Reason (Optional)"
          value={notes}
          onChangeText={setNotes}
          placeholder="e.g. Emergency surgery requirement"
          multiline
          numberOfLines={2}
        />

        {/* Continue Button */}
        <Button
          title={loading ? 'Broadcasting Request...' : '🚨 Broadcast Emergency Request'}
          onPress={handleContinue}
          loading={loading}
          variant="emergency"
          size="lg"
          fullWidth
          style={styles.continueBtn}
        />
      </Card>

      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing['2xl'],
  },
  sectionLabel: {
    ...TextStyles.bodySmall,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  unitsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  unitBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  unitBtnDisabled: {
    opacity: 0.35,
    backgroundColor: Colors.borderLight,
    borderColor: Colors.border,
  },
  unitBtnText: {
    fontSize: 26,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
    marginTop: -2,
  },
  unitDisplay: {
    alignItems: 'center',
  },
  unitNumber: {
    ...TextStyles.h1,
    color: Colors.primary,
    fontWeight: FontWeights.bold,
  },
  unitSublabel: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
  },

  urgencyGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  urgencyCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  urgencyCriticalActive: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  urgencyUrgentActive: {
    borderColor: Colors.warning,
    backgroundColor: Colors.warningLight,
  },
  urgencyNormalActive: {
    borderColor: Colors.success,
    backgroundColor: Colors.successLight,
  },
  urgencyIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  urgencyTitle: {
    ...TextStyles.caption,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  urgencyTitleActive: {
    color: Colors.text,
  },
  urgencyDesc: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  continueBtn: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.primary,
  },
});
