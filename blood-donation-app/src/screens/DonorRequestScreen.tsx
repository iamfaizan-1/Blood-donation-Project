import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../components/shared/ScreenWrapper';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, BloodTypeBadge } from '../components/ui/Badge';
import { showAlert } from '../utils/alert';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadius } from '../constants/spacing';
import { TextStyles, FontWeights } from '../constants/typography';
import { RootStackParamList } from '../navigation/types';
import { donorWorkflowService } from '../services/donorWorkflowService';
import { useAuth } from '../context/AuthContext';

type DonorRequestRouteProp = RouteProp<RootStackParamList, 'DonorRequest'>;
type DonorRequestNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const DonorRequestScreen: React.FC = () => {
  const navigation = useNavigation<DonorRequestNavigationProp>();
  const route = useRoute<DonorRequestRouteProp>();
  const { user } = useAuth();

  const notificationId = route.params?.notificationId;
  const requestId = route.params?.requestId || 'REQ-9421';
  const donorName = route.params?.donorName || user?.name || 'Verified Donor';
  const bloodType = route.params?.bloodType || 'O+';
  const hospital = route.params?.hospital || 'City General Hospital';
  const distance = route.params?.distance || '1.8 km away';
  const units = route.params?.units || 2;
  const urgency = route.params?.urgency || 'critical';
  const patientName = route.params?.patientName || 'Sarah Jenkins (ICU Ward 3B)';
  const requiredDateTime = route.params?.requiredDateTime;
  const notes =
    route.params?.notes ||
    'Emergency surgery requirement. Direct blood transfusion needed at hospital blood bank.';

  const [loadingAction, setLoadingAction] = useState<'accept' | 'decline' | null>(null);

  const handleAccept = async () => {
    setLoadingAction('accept');
    try {
      let requesterName = 'Emergency Requester';
      let requesterPhone = '';

      if (notificationId) {
        // Call backend atomic accept API
        const result = await donorWorkflowService.acceptRequest(notificationId);
        if (result.requesterContact) {
          requesterName = result.requesterContact.name;
          requesterPhone = result.requesterContact.phone;
        }
      }

      showAlert(
        'Donation Accepted! ❤️',
        `Thank you ${donorName}! You have accepted to donate ${units} units of ${bloodType} blood for ${hospital}. Secure direct communication is now enabled.`,
        [
          {
            text: 'Proceed to Live Tracking',
            onPress: () => {
              navigation.navigate('ActiveRequest', {
                requestId,
                donorName,
                bloodType,
                hospital,
                requesterName,
                requesterPhone,
              });
            },
          },
        ]
      );
    } catch (error: any) {
      if (error.response?.status === 409) {
        showAlert(
          'Request Already Accepted',
          'Another generous donor has already accepted this emergency request. Thank you for your readiness to save a life!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        const errorMsg =
          error.response?.data?.message || error.message || 'Unable to accept request';
        showAlert('Acceptance Error', errorMsg);
      }
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDecline = () => {
    showAlert(
      'Decline Request?',
      'Are you sure you want to decline this request? Other compatible donors nearby will be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Decline',
          style: 'destructive',
          onPress: async () => {
            setLoadingAction('decline');
            try {
              if (notificationId) {
                await donorWorkflowService.declineRequest(notificationId);
              }
              showAlert(
                'Request Declined',
                'The request remains available for other matched donors. Thank you!',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
              );
            } catch (error: any) {
              const errorMsg =
                error.response?.data?.message || error.message || 'Error declining request';
              showAlert('Error', errorMsg);
            } finally {
              setLoadingAction(null);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenWrapper>
      <Header
        title="Emergency Request"
        subtitle={`Request ID: ${requestId}`}
        showBack
      />

      {/* Main Request Information Card */}
      <Card variant="elevated" padding="lg" style={styles.card}>
        {/* Urgency Badge Banner */}
        <View style={styles.urgencyBanner}>
          <Text style={styles.urgencyEmoji}>🚨</Text>
          <Text style={styles.urgencyTitle}>CRITICAL EMERGENCY REQUEST</Text>
        </View>

        {/* Blood Group & Units Header */}
        <View style={styles.headerRow}>
          <View style={styles.bloodTypeWrap}>
            <BloodTypeBadge bloodType={bloodType} size="lg" />
          </View>
          <View style={styles.unitsWrap}>
            <Text style={styles.unitsNumber}>{units} Units</Text>
            <Text style={styles.unitsLabel}>Blood Required</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Emergency Info Details */}
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🏥</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Hospital / Location</Text>
            <Text style={styles.infoValue}>{hospital}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📍</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Distance from You</Text>
            <Text style={styles.infoValue}>{distance}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>⏰</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Required Date & Time</Text>
            <Text style={[styles.infoValue, { color: Colors.primary, fontWeight: FontWeights.bold }]}>
              {requiredDateTime
                ? new Date(requiredDateTime).toLocaleString()
                : urgency === 'critical'
                ? 'Immediate / Within 2 Hours'
                : urgency === 'urgent'
                ? 'Within 12 Hours'
                : 'Within 24-48 Hours'}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>👤</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Requested For</Text>
            <Text style={styles.infoValue}>{patientName}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🚨</Text>
          <View style={styles.infoContent}>
            <Text style={styles.infoLabel}>Urgency Priority</Text>
            <Text
              style={[
                styles.infoValue,
                {
                  color:
                    urgency === 'critical'
                      ? Colors.error
                      : urgency === 'urgent'
                      ? Colors.warning
                      : Colors.text,
                  fontWeight: FontWeights.bold,
                  textTransform: 'uppercase',
                },
              ]}
            >
              {urgency} Priority
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Notes */}
        <Text style={styles.notesHeader}>Patient Notes & Instructions</Text>
        <Text style={styles.notesBody}>{notes}</Text>
      </Card>

      {/* Action Buttons: Accept & Decline */}
      <View style={styles.actionButtonsContainer}>
        <Button
          title={loadingAction === 'accept' ? 'Accepting...' : '❤️ Accept Emergency Request'}
          onPress={handleAccept}
          variant="emergency"
          size="lg"
          fullWidth
          loading={loadingAction === 'accept'}
          disabled={loadingAction !== null}
          style={styles.acceptButton}
        />
        <Button
          title={loadingAction === 'decline' ? 'Declining...' : 'Decline Request'}
          onPress={handleDecline}
          variant="outline"
          size="lg"
          fullWidth
          loading={loadingAction === 'decline'}
          disabled={loadingAction !== null}
          style={styles.declineButton}
        />
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.xl,
  },
  urgencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.errorLight,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  urgencyEmoji: {
    fontSize: 20,
  },
  urgencyTitle: {
    fontSize: 12,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  bloodTypeWrap: {
    alignItems: 'center',
  },
  unitsWrap: {
    alignItems: 'flex-end',
  },
  unitsNumber: {
    ...TextStyles.h1,
    color: Colors.text,
    fontWeight: FontWeights.bold,
  },
  unitsLabel: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.lg,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  infoIcon: {
    fontSize: 22,
    width: 32,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
  },
  infoValue: {
    ...TextStyles.body,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    marginTop: 2,
  },

  notesHeader: {
    ...TextStyles.bodySmall,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  notesBody: {
    ...TextStyles.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  actionButtonsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing['2xl'],
  },
  acceptButton: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  declineButton: {
    borderColor: Colors.border,
  },
});
