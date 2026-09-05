import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../components/shared/ScreenWrapper';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { RequestCard } from '../components/ui/RequestCard';
import { AuthModal } from '../components/ui/AuthModal';
import { useAuth } from '../context/AuthContext';
import { requestService } from '../services/requestService';
import { donorWorkflowService } from '../services/donorWorkflowService';
import { DonorNotification } from '../types';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadius } from '../constants/spacing';
import { TextStyles, FontWeights } from '../constants/typography';
import { RootStackParamList } from '../navigation/types';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, isAuthenticated, updateAvailability } = useAuth();
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);
  const [donorNotifications, setDonorNotifications] = useState<DonorNotification[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  const fetchActiveRequests = async () => {
    setLoadingRequests(true);
    try {
      let myPendingRequest: any = null;
      if (isAuthenticated && user?._id) {
        try {
          const userRequests = await requestService.getMyRequests();
          if (userRequests && userRequests.length > 0) {
            myPendingRequest = userRequests.find((r: any) =>
              ['pending', 'active', 'matching', 'donor_found', 'donor_accepted', 'contact_established', 'on_the_way'].includes(
                r.status
              )
            );
          }
        } catch (e) {
          // ignore
        }
      }

      const requests = await requestService.getActiveRequests();
      if (myPendingRequest) {
        setActiveRequest(myPendingRequest);
      } else if (requests && requests.length > 0) {
        const currentUserId = user?._id?.toString();
        const myRequest = currentUserId
          ? requests.find((r: any) => {
              const reqUser = (r.requesterId?._id || r.requesterId)?.toString();
              return reqUser === currentUserId;
            })
          : null;
        setActiveRequest(myRequest || requests[0]);
      } else {
        setActiveRequest(null);
      }
    } catch (error) {
      console.log('Error fetching active requests from backend');
    } finally {
      setLoadingRequests(false);
    }
  };

  const fetchDonorNotifications = async () => {
    try {
      const notifications = await donorWorkflowService.getMyNotifications();
      setDonorNotifications(notifications || []);
    } catch (error) {
      console.log('Error fetching donor notifications');
    }
  };

  // Auto-refresh active requests and alerts whenever HomeScreen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchActiveRequests();
      if (isAuthenticated) {
        fetchDonorNotifications();
      }
    }, [isAuthenticated, user?._id])
  );

  const handleToggleDonor = async () => {
    if (!isAuthenticated) {
      setAuthModalVisible(true);
      return;
    }

    setUpdatingAvailability(true);
    try {
      const newStatus = !user?.isAvailable;
      await updateAvailability(newStatus);
      Alert.alert(
        newStatus ? 'You are now an Active Donor!' : 'Donor Status Set to Off-Duty',
        newStatus
          ? 'Thank you for standing by to save lives. Nearby emergency requests will be notified to you.'
          : 'You will not receive donation alerts until reactivated.'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update donor status');
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleRequestBlood = () => {
    navigation.navigate('MainTabs', { screen: 'RequestBlood' });
  };

  const handleFindDonors = () => {
    navigation.navigate('MainTabs', { screen: 'FindDonors' });
  };

  const handleBloodBanks = () => {
    navigation.navigate('MainTabs', { screen: 'Location' });
  };

  const handleViewActiveRequest = (reqToView?: any) => {
    const target = reqToView || activeRequest;
    if (target && target._id) {
      navigation.navigate('ActiveRequest', {
        requestId: target._id,
        bloodType: target.bloodGroup,
        hospital: target.hospitalName,
        units: target.unitsRequired,
        urgency: target.urgency,
      });
    } else {
      navigation.navigate('ActiveRequest', { requestId: 'REQ-8942' });
    }
  };

  return (
    <ScreenWrapper>
      {/* App Header & Welcome Message */}
      <Header
        title="🩸 LifeSaver"
        subtitle={
          user
            ? `Welcome back, ${user.name}! Save lives today.`
            : 'Welcome to LifeSaver. Save lives, donate blood.'
        }
        rightElement={
          <TouchableOpacity
            onPress={handleToggleDonor}
            disabled={updatingAvailability}
            activeOpacity={0.8}
            style={[
              styles.donorStatusBadge,
              user?.isAvailable ? styles.donorActive : styles.donorInactive,
            ]}
          >
            {updatingAvailability ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Text style={styles.donorStatusDot}>
                  {user?.isAvailable ? '🟢' : '⚪'}
                </Text>
                <Text
                  style={[
                    styles.donorStatusText,
                    user?.isAvailable ? styles.donorActiveText : styles.donorInactiveText,
                  ]}
                >
                  {user?.isAvailable ? 'Donor Active' : 'Off Duty'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        }
      />

      {/* Incoming Matched Donor Emergency Alert */}
      {donorNotifications.length > 0 && (
        <Card variant="elevated" padding="md" style={styles.incomingRequestCard}>
          <View style={styles.incomingHeader}>
            <View style={styles.incomingBadge}>
              <Text style={styles.incomingBadgeText}>🚨 MATCHED EMERGENCY REQUEST</Text>
            </View>
            <Badge label={`${donorNotifications.length} Pending`} variant="error" size="sm" />
          </View>
          <Text style={styles.incomingTitle}>
            {donorNotifications[0].hospitalName} requires {donorNotifications[0].unitsRequired} unit(s) of{' '}
            {donorNotifications[0].bloodGroup} blood
          </Text>
          <Text style={styles.incomingSubtitle}>
            📍 {donorNotifications[0].distanceFormatted} away · Urgency: {donorNotifications[0].urgency.toUpperCase()}
          </Text>
          <Button
            title="❤️ View & Respond to Request"
            onPress={() => {
              const n = donorNotifications[0];
              navigation.navigate('DonorRequest', {
                notificationId: n.notificationId,
                requestId: n.requestId,
                bloodType: n.bloodGroup,
                units: n.unitsRequired,
                hospital: n.hospitalName,
                distance: n.distanceFormatted,
                urgency: n.urgency,
                patientName: n.patientName,
                requiredDateTime: n.requiredDateTime,
                notes: n.notes,
              });
            }}
            variant="primary"
            size="md"
            fullWidth
            style={{ marginTop: 10 }}
          />
        </Card>
      )}

      {/* Hero Banner */}
      <Card variant="elevated" padding="lg" style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>EMERGENCY RESPONSE</Text>
          </View>
          <Text style={styles.heroEmoji}>🩸</Text>
        </View>

        <Text style={styles.heroTitle}>Need Urgent Blood Transfusion?</Text>
        <Text style={styles.heroSubtitle}>
          Broadcast an instant request to verified donors & nearby blood centers within 5km radius.
        </Text>

        <Button
          title="🚨 Request Blood Now"
          onPress={handleRequestBlood}
          variant="emergency"
          size="lg"
          fullWidth
          style={styles.requestBloodBtn}
        />
      </Card>

      {/* Quick Action Grid */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleFindDonors}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBg, { backgroundColor: Colors.primaryLight }]}>
            <Text style={styles.actionEmoji}>🔍</Text>
          </View>
          <Text style={styles.actionTitle}>Find Blood</Text>
          <Text style={styles.actionSub}>Search compatible donors</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleToggleDonor}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBg, { backgroundColor: Colors.successLight }]}>
            <Text style={styles.actionEmoji}>❤️</Text>
          </View>
          <Text style={styles.actionTitle}>Become Donor</Text>
          <Text style={styles.actionSub}>
            {user?.isAvailable ? 'Active Status ON' : 'Tap to Activate'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleBloodBanks}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBg, { backgroundColor: Colors.secondaryLight }]}>
            <Text style={styles.actionEmoji}>🏥</Text>
          </View>
          <Text style={styles.actionTitle}>Blood Banks</Text>
          <Text style={styles.actionSub}>Centers & inventory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={handleViewActiveRequest}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconBg, { backgroundColor: Colors.warningLight }]}>
            <Text style={styles.actionEmoji}>⚡</Text>
          </View>
          <Text style={styles.actionTitle}>Active Request</Text>
          <Text style={styles.actionSub}>Track in-progress</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>8</Text>
          <Text style={styles.statLabel}>Donations Made</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>24</Text>
          <Text style={styles.statLabel}>Lives Saved</Text>
        </Card>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{user?.bloodGroup || 'O+'}</Text>
          <Text style={styles.statLabel}>Blood Group</Text>
        </Card>
      </View>

      {/* Recent / Active Request Card from Backend */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Emergency Request</Text>
        {activeRequest && <Badge label="1 Live" variant="warning" size="sm" />}
      </View>

      {loadingRequests ? (
        <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 16 }} />
      ) : activeRequest ? (
        <RequestCard
          bloodType={activeRequest.bloodGroup}
          hospital={activeRequest.hospitalName}
          distance="Nearby Hospital"
          units={activeRequest.unitsRequired}
          urgency={activeRequest.urgency}
          timeRemaining="Active · In Progress"
          actionText="Track Status"
          onPressAction={() => handleViewActiveRequest(activeRequest)}
        />
      ) : (
        <Card variant="outlined" padding="md" style={styles.noRequestCard}>
          <Text style={{ fontSize: 24, textAlign: 'center', marginBottom: 4 }}>🏥</Text>
          <Text style={[TextStyles.subtitle, { textAlign: 'center' }]}>
            No Active Emergency Requests
          </Text>
          <Text style={[TextStyles.caption, { color: Colors.textSecondary, textAlign: 'center', marginVertical: 6 }]}>
            Need blood urgently? Tap 'Request Blood Now' above to broadcast an emergency request to nearby donors.
          </Text>
          <Button
            title="Create Blood Request"
            onPress={handleRequestBlood}
            variant="outline"
            size="sm"
            style={{ alignSelf: 'center', marginTop: 4 }}
          />
        </Card>
      )}

      {/* Auth Modal */}
      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  donorStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    minHeight: 44, // Accessible touch target
    minWidth: 110,
    justifyContent: 'center',
  },
  donorActive: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  donorInactive: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
  },
  donorStatusDot: {
    fontSize: 10,
    marginRight: 4,
  },
  donorStatusText: {
    fontSize: 12,
    fontWeight: FontWeights.bold,
  },
  donorActiveText: {
    color: Colors.successDark,
  },
  donorInactiveText: {
    color: Colors.textSecondary,
  },

  incomingRequestCard: {
    backgroundColor: '#FFF5F5',
    borderColor: Colors.error,
    borderWidth: 2,
    marginBottom: Spacing.lg,
  },
  incomingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  incomingBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  incomingBadgeText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: '#FFF',
    letterSpacing: 0.5,
  },
  incomingTitle: {
    ...TextStyles.subtitle,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginTop: 4,
  },
  incomingSubtitle: {
    ...TextStyles.caption,
    color: Colors.error,
    fontWeight: FontWeights.semibold,
    marginTop: 2,
  },

  heroCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primaryLight,
    borderWidth: 2,
    marginBottom: Spacing.xl,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  heroBadge: {
    backgroundColor: Colors.errorLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  heroEmoji: {
    fontSize: 28,
  },
  heroTitle: {
    ...TextStyles.h2,
    color: Colors.text,
    marginVertical: Spacing.xs,
  },
  heroSubtitle: {
    ...TextStyles.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  requestBloodBtn: {
    backgroundColor: Colors.primary,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...TextStyles.h3,
    color: Colors.text,
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginVertical: Spacing.md,
  },
  actionCard: {
    width: '47.5%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'flex-start',
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  actionEmoji: {
    fontSize: 22,
  },
  actionTitle: {
    ...TextStyles.subtitle,
    color: Colors.text,
    fontWeight: FontWeights.bold,
    fontSize: 15,
  },
  actionSub: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  statNumber: {
    ...TextStyles.h2,
    color: Colors.primary,
    fontWeight: FontWeights.bold,
  },
  statLabel: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    marginTop: 2,
    fontSize: 11,
  },
  noRequestCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.borderLight,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
});
