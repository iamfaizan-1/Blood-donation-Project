import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../components/shared/ScreenWrapper';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, BloodTypeBadge } from '../components/ui/Badge';
import { StatusTracker, WORKFLOW_STEPS, StepItem } from '../components/ui/StatusTracker';
import { showAlert } from '../utils/alert';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadius, TouchTarget } from '../constants/spacing';
import { TextStyles, FontWeights } from '../constants/typography';
import { RootStackParamList } from '../navigation/types';
import { donorWorkflowService } from '../services/donorWorkflowService';
import { chatService } from '../services/chatService';
import { useAuth } from '../context/AuthContext';
import { RequestStatus } from '../types';

type ActiveRequestRouteProp = RouteProp<RootStackParamList, 'ActiveRequest'>;
type ActiveRequestNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ActiveRequestScreen: React.FC = () => {
  const navigation = useNavigation<ActiveRequestNavigationProp>();
  const route = useRoute<ActiveRequestRouteProp>();
  const { user } = useAuth();

  const requestId = route.params?.requestId || 'REQ-8942';
  const initialDonorName = route.params?.donorName || 'Ahmed K.';
  const bloodType = route.params?.bloodType || 'O+';
  const hospital = route.params?.hospital || 'City General Hospital';

  const [donorName, setDonorName] = useState(initialDonorName);
  const [requesterName, setRequesterName] = useState(
    route.params?.requesterName || 'Hospital Coordinator'
  );
  const [contactPhone, setContactPhone] = useState(route.params?.requesterPhone || '');
  const [currentStep, setCurrentStep] = useState<number>(2); // Default to Step 2: Donor Accepted
  const [statusHistory, setStatusHistory] = useState<
    Array<{ status: string; timestamp: string; updatedBy?: string }>
  >([]);
  const [isDonorUser, setIsDonorUser] = useState<boolean>(false);
  const [isRequesterUser, setIsRequesterUser] = useState<boolean>(false);
  const [isSharingLocation, setIsSharingLocation] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [advancing, setAdvancing] = useState(false);

  // 7-step mapping between backend status and step index
  // 0: REQUESTED (pending)
  // 1: DONORS_NOTIFIED (matching / donor_found)
  // 2: DONOR_ACCEPTED (donor_accepted)
  // 3: CONTACT_ESTABLISHED (contact_established)
  // 4: ON_THE_WAY (on_the_way)
  // 5: DONATION_COMPLETED (fulfilled)
  // 6: CLOSED (closed)
  const statusToStep: Record<string, number> = {
    pending: 0,
    matching: 1,
    donor_found: 1,
    donor_accepted: 2,
    contact_established: 3,
    on_the_way: 4,
    active: 4,
    fulfilled: 5,
    closed: 6,
  };

  const fetchActiveRequestDetails = async () => {
    if (!requestId || requestId.startsWith('REQ-')) return;
    try {
      const details = await donorWorkflowService.getRequestDetails(requestId);
      const req = details.request;
      if (req?.status && statusToStep[req.status] !== undefined) {
        setCurrentStep(statusToStep[req.status]);
      }

      if (req?.statusHistory) {
        setStatusHistory(req.statusHistory);
      }

      // Check user roles
      const currentUserId = user?._id;
      const isDonor =
        !!details.requesterContact ||
        (!!currentUserId && req?.acceptedDonorId === currentUserId);
      const isRequester =
        !!details.donorContact ||
        (!!currentUserId && req?.requesterId === currentUserId);

      setIsDonorUser(isDonor);
      setIsRequesterUser(isRequester);

      if (details.requesterContact) {
        setRequesterName(details.requesterContact.name);
        setContactPhone(details.requesterContact.phone);
      } else if (details.donorContact) {
        setDonorName(details.donorContact.name);
        setContactPhone(details.donorContact.phone);
      }
    } catch (error) {
      // Keep local state if running offline / demo
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchActiveRequestDetails().finally(() => setLoading(false));

    // Connect to Socket.IO for live real-time status updates
    if (!requestId.startsWith('REQ-')) {
      chatService.connect(requestId).catch(() => {});
      const unsubscribe = chatService.onStatusUpdate((data) => {
        if (data.requestId === requestId) {
          if (data.status && statusToStep[data.status] !== undefined) {
            setCurrentStep(statusToStep[data.status]);
          }
          fetchActiveRequestDetails();
        }
      });

      return () => {
        unsubscribe();
      };
    }
  }, [requestId]);

  // Format steps with timestamps from statusHistory
  const dynamicSteps: StepItem[] = useMemo(() => {
    return WORKFLOW_STEPS.map((stepDef, idx) => {
      let matchingEntry = statusHistory.find((entry) => {
        switch (stepDef.key) {
          case 'requested':
            return entry.status === 'pending';
          case 'donors_notified':
            return entry.status === 'donor_found' || entry.status === 'matching';
          case 'donor_accepted':
            return entry.status === 'donor_accepted';
          case 'contact_established':
            return entry.status === 'contact_established';
          case 'on_the_way':
            return entry.status === 'on_the_way';
          case 'donation_completed':
            return entry.status === 'fulfilled';
          case 'closed':
            return entry.status === 'closed';
          default:
            return false;
        }
      });

      let timeText: string | undefined;
      if (matchingEntry?.timestamp) {
        try {
          timeText = new Date(matchingEntry.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
        } catch {
          timeText = undefined;
        }
      } else if (idx < currentStep) {
        timeText = 'Completed';
      } else if (idx === currentStep) {
        timeText = 'In Progress';
      }

      return {
        ...stepDef,
        time: timeText,
      };
    });
  }, [statusHistory, currentStep]);

  const handleCall = () => {
    if (contactPhone) {
      Alert.alert(`Call Contact`, `Direct phone line to ${contactPhone}.`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dial Phone',
          onPress: () => Linking.openURL(`tel:${contactPhone}`).catch(() => {}),
        },
      ]);
    } else {
      Alert.alert(
        `Calling Contact`,
        `Connecting secure emergency voice channel...`,
        [{ text: 'End Call', style: 'cancel' }]
      );
    }
  };

  const handleChat = () => {
    navigation.navigate('Chat', {
      requestId,
      partnerName: isRequesterUser ? donorName : requesterName,
      bloodType,
      hospital,
    });
  };

  const handleShareLocation = () => {
    setIsSharingLocation(!isSharingLocation);
    Alert.alert(
      isSharingLocation ? 'Location Sharing Paused' : 'Live GPS Sharing Activated',
      isSharingLocation
        ? 'Partner will see the static hospital destination pin.'
        : 'Live GPS ETA is being broadcasted to partner.'
    );
  };

  // Status transitions:
  // Donor updates:
  // - Step 2 (donor_accepted) -> step 3 (contact_established)
  // - Step 3 (contact_established) -> step 4 (on_the_way)
  // - Step 4 (on_the_way) -> step 5 (fulfilled)
  // Requester updates:
  // - Step 5 (fulfilled) -> step 6 (closed)
  const handleAdvanceStatus = async () => {
    let nextStatus: 'contact_established' | 'on_the_way' | 'fulfilled' | 'closed' | null =
      null;

    if (currentStep === 2 && (isDonorUser || !isRequesterUser)) {
      nextStatus = 'contact_established';
    } else if (currentStep === 3 && (isDonorUser || !isRequesterUser)) {
      nextStatus = 'on_the_way';
    } else if (currentStep === 4 && (isDonorUser || !isRequesterUser)) {
      nextStatus = 'fulfilled';
    } else if (currentStep === 5 && (isRequesterUser || !isDonorUser)) {
      nextStatus = 'closed';
    }

    if (!nextStatus) return;

    setAdvancing(true);
    try {
      if (!requestId.startsWith('REQ-')) {
        await donorWorkflowService.advanceStatus(requestId, nextStatus);
      }
      const newStep = statusToStep[nextStatus];
      setCurrentStep(newStep);

      if (nextStatus === 'fulfilled') {
        showAlert(
          'Donation Completed! 🎉',
          'Thank you for saving a life. The requester will verify and close the case.',
          [
            {
              text: 'View Certificate',
              onPress: () =>
                navigation.navigate('DonationCompleted', {
                  donationId: `DON-${Math.floor(10000 + Math.random() * 90000)}`,
                  bloodType,
                  hospital,
                }),
            },
          ]
        );
      } else if (nextStatus === 'closed') {
        showAlert('Request Closed', 'This blood request has been fulfilled and closed.');
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.message || error.message || 'Failed to update status';
      showAlert('Status Update', errorMsg);
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <ScreenWrapper>
      <Header
        title="Active Emergency Request"
        subtitle={`Request ID: ${requestId} · Live Workflow`}
        showBack
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Syncing request status...</Text>
        </View>
      ) : null}

      {/* Hero Donor & Hospital Summary */}
      <Card variant="elevated" padding="md" style={styles.donorHeaderCard}>
        <View style={styles.donorRow}>
          <View style={styles.donorAvatar}>
            <Text style={styles.avatarText}>
              {(isRequesterUser ? donorName : requesterName).charAt(0)}
            </Text>
          </View>

          <View style={styles.donorInfo}>
            <View style={styles.donorTitleRow}>
              <Text style={styles.donorName}>
                {isRequesterUser ? donorName : requesterName}
              </Text>
              <Badge
                label={isRequesterUser ? '✓ Donor Matched' : 'Requester'}
                variant={isRequesterUser ? 'success' : 'primary'}
                size="sm"
              />
            </View>
            <Text style={styles.hospitalText}>🏥 Hospital: {hospital}</Text>
            <Text style={styles.roleText}>
              👤 You are viewing as:{' '}
              <Text style={{ fontWeight: FontWeights.bold }}>
                {isDonorUser ? 'Donor' : isRequesterUser ? 'Requester' : 'Participant'}
              </Text>
            </Text>
          </View>

          <BloodTypeBadge bloodType={bloodType} size="md" />
        </View>
      </Card>

      {/* Communication Action Bar: Call, Chat, Share Location */}
      <View style={styles.actionBar}>
        {/* Call Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleCall}
          style={[styles.actionBtn, styles.callBtn]}
        >
          <Text style={styles.actionBtnEmoji}>📞</Text>
          <Text style={[styles.actionBtnLabel, styles.callBtnLabel]}>Call</Text>
        </TouchableOpacity>

        {/* Chat Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleChat}
          style={[styles.actionBtn, styles.chatBtn]}
        >
          <Text style={styles.actionBtnEmoji}>💬</Text>
          <Text style={styles.actionBtnLabel}>Chat</Text>
        </TouchableOpacity>

        {/* Share Location Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleShareLocation}
          style={[
            styles.actionBtn,
            isSharingLocation ? styles.locationActiveBtn : styles.chatBtn,
          ]}
        >
          <Text style={styles.actionBtnEmoji}>📍</Text>
          <Text
            style={[
              styles.actionBtnLabel,
              isSharingLocation && styles.locationActiveText,
            ]}
          >
            {isSharingLocation ? 'Sharing GPS' : 'Share Location'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Request Status Tracker */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Status Workflow Tracker</Text>
        <Badge
          label={
            currentStep === 0
              ? 'REQUESTED'
              : currentStep === 1
              ? 'DONORS_NOTIFIED'
              : currentStep === 2
              ? 'DONOR_ACCEPTED'
              : currentStep === 3
              ? 'CONTACT_ESTABLISHED'
              : currentStep === 4
              ? 'ON_THE_WAY'
              : currentStep === 5
              ? 'DONATION_COMPLETED'
              : 'CLOSED'
          }
          variant={currentStep >= 5 ? 'success' : 'primary'}
          size="sm"
        />
      </View>

      <Card variant="outlined" padding="lg" style={styles.trackerCard}>
        <StatusTracker currentStepIndex={currentStep} steps={dynamicSteps} />
      </Card>

      {/* Role-Based Action Buttons */}
      <View style={styles.bottomActions}>
        {/* Donor controls: Step 2 -> 3, Step 3 -> 4, Step 4 -> 5 */}
        {currentStep === 2 && (!isRequesterUser || isDonorUser) && (
          <Button
            title={advancing ? 'Updating...' : '📞 Mark Contact Established'}
            onPress={handleAdvanceStatus}
            variant="primary"
            size="lg"
            fullWidth
            loading={advancing}
            disabled={advancing}
            style={styles.actionButton}
          />
        )}

        {currentStep === 3 && (!isRequesterUser || isDonorUser) && (
          <Button
            title={advancing ? 'Updating...' : '🚗 Mark Donor On The Way'}
            onPress={handleAdvanceStatus}
            variant="primary"
            size="lg"
            fullWidth
            loading={advancing}
            disabled={advancing}
            style={styles.actionButton}
          />
        )}

        {currentStep === 4 && (!isRequesterUser || isDonorUser) && (
          <Button
            title={advancing ? 'Updating...' : '🩸 Complete Donation & Save Life'}
            onPress={handleAdvanceStatus}
            variant="primary"
            size="lg"
            fullWidth
            loading={advancing}
            disabled={advancing}
            style={styles.actionButton}
          />
        )}

        {/* Requester controls: Step 5 -> 6 (Close Request) */}
        {currentStep === 5 && (!isDonorUser || isRequesterUser) && (
          <Button
            title={advancing ? 'Closing...' : '🏁 Verify & Close Request'}
            onPress={handleAdvanceStatus}
            variant="secondary"
            size="lg"
            fullWidth
            loading={advancing}
            disabled={advancing}
            style={styles.closeButton}
          />
        )}

        {/* Step 5 state when viewed by donor */}
        {currentStep === 5 && isDonorUser && !isRequesterUser && (
          <View style={styles.statusNotice}>
            <Text style={styles.statusNoticeText}>
              🎉 Donation completed! Awaiting requester verification to close.
            </Text>
          </View>
        )}

        {/* Terminal state: CLOSED */}
        {currentStep === 6 && (
          <View style={styles.statusNoticeClosed}>
            <Text style={styles.statusNoticeClosedText}>
              🏁 This blood donation request is fulfilled and closed.
            </Text>
          </View>
        )}
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  loadingText: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
  },
  donorHeaderCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primaryLight,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
  },
  donorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  donorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
  donorInfo: {
    flex: 1,
    paddingRight: Spacing.xs,
  },
  donorTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 2,
  },
  donorName: {
    ...TextStyles.subtitle,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  hospitalText: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  roleText: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  actionBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    borderWidth: 1.5,
    minHeight: TouchTarget.comfortable, // 48px standard touch target
  },
  callBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  callBtnLabel: {
    color: Colors.textInverse,
  },
  chatBtn: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  actionBtnEmoji: {
    fontSize: 18,
  },
  actionBtnLabel: {
    ...TextStyles.bodySmall,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  locationActiveBtn: {
    backgroundColor: Colors.secondaryLight,
    borderColor: Colors.secondary,
  },
  locationActiveText: {
    color: Colors.secondaryDark,
  },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    ...TextStyles.h3,
    color: Colors.text,
  },
  trackerCard: {
    marginBottom: Spacing.xl,
  },

  bottomActions: {
    marginBottom: Spacing['2xl'],
  },
  actionButton: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  closeButton: {
    backgroundColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  statusNotice: {
    backgroundColor: '#ECFDF5',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.success,
    alignItems: 'center',
  },
  statusNoticeText: {
    ...TextStyles.bodySmall,
    fontWeight: FontWeights.bold,
    color: Colors.successDark,
    textAlign: 'center',
  },
  statusNoticeClosed: {
    backgroundColor: '#F1F5F9',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  statusNoticeClosedText: {
    ...TextStyles.bodySmall,
    fontWeight: FontWeights.bold,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
