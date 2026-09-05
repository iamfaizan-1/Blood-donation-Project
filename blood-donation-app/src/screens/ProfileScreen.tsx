import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../components/shared/ScreenWrapper';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge, BloodTypeBadge } from '../components/ui/Badge';
import { AuthModal } from '../components/ui/AuthModal';
import { BloodGroupSelector } from '../components/ui/BloodGroupSelector';
import { useAuth } from '../context/AuthContext';
import { donationService } from '../services/donationService';
import { requestService } from '../services/requestService';
import { RootStackParamList } from '../navigation/types';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadius } from '../constants/spacing';
import { TextStyles, FontWeights } from '../constants/typography';
import { BloodType } from '../types';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { user, isAuthenticated, logout, updateUser, updateAvailability, refreshUser } = useAuth();

  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [donationHistory, setDonationHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [loadingMyRequests, setLoadingMyRequests] = useState(false);

  // Edit Profile Form State
  const [editName, setEditName] = useState(user?.name || 'John Doe');
  const [editPhone, setEditPhone] = useState(user?.phone || '+1 (555) 234-4921');
  const [editBloodGroup, setEditBloodGroup] = useState<BloodType>(
    (user?.bloodGroup as BloodType) || 'O+'
  );

  useEffect(() => {
    if (user) {
      setEditName(user.name);
      setEditPhone(user.phone);
      setEditBloodGroup((user.bloodGroup as BloodType) || 'O+');
    }
  }, [user]);

  const fetchDonationHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await donationService.getDonationHistory();
      if (history) {
        setDonationHistory(history);
      }
    } catch (error) {
      console.log('Error loading donation history from backend');
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchMyRequests = async () => {
    if (!isAuthenticated) return;
    setLoadingMyRequests(true);
    try {
      const requests = await requestService.getMyRequests();
      setMyRequests(requests || []);
    } catch (error) {
      console.log('Error loading user blood requests');
    } finally {
      setLoadingMyRequests(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchDonationHistory();
        fetchMyRequests();
      }
    }, [isAuthenticated])
  );

  const handleToggleAvailability = async (value: boolean) => {
    if (!isAuthenticated) {
      setAuthModalVisible(true);
      return;
    }

    setUpdatingAvailability(true);
    try {
      await updateAvailability(value);
      Alert.alert(
        value ? 'Availability Active' : 'Availability Paused',
        value
          ? 'You are visible to emergency requesters nearby.'
          : 'You will not receive donation alerts until reactivated.'
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update availability');
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateUser({
        name: editName,
        phone: editPhone,
        bloodGroup: editBloodGroup,
      });
      Alert.alert('Success ⭐', 'Profile information updated successfully!');
      setEditingProfile(false);
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'Could not save profile updates');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignOut = async () => {
    // Cross-platform compatibility: on web, window.confirm handles button callbacks reliably
    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined'
          ? window.confirm('Are you sure you want to sign out of LifeSaver?')
          : true;
      if (confirmed) {
        try {
          await logout();
          setMyRequests([]);
          setDonationHistory([]);
        } catch (e) {
          console.error('Logout error:', e);
        }
      }
      return;
    }

    // Native mobile platforms
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            setMyRequests([]);
            setDonationHistory([]);
          } catch (e) {
            console.error('Logout error:', e);
          }
        },
      },
    ]);
  };

  return (
    <ScreenWrapper>
      <Header
        title="Donor Profile"
        subtitle="Manage your blood donor profile & history"
        rightElement={
          isAuthenticated ? (
            <TouchableOpacity
              onPress={handleSignOut}
              style={styles.headerSignOutBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.headerSignOutText}>Sign Out 🚪</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {!isAuthenticated ? (
        <Card variant="elevated" padding="lg" style={styles.unauthCard}>
          <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>🩸</Text>
          <Text style={[TextStyles.h2, { textAlign: 'center' }]}>Sign In to LifeSaver</Text>
          <Text style={[TextStyles.bodySmall, { color: Colors.textSecondary, textAlign: 'center', marginVertical: 12 }]}>
            Log in or register to manage your donor profile, track blood donations, and receive emergency alerts.
          </Text>
          <Button
            title="Sign In / Register"
            onPress={() => setAuthModalVisible(true)}
            variant="primary"
            size="lg"
            fullWidth
          />
        </Card>
      ) : (
        <>
          {/* User Header Profile Card */}
          <Card variant="elevated" padding="lg" style={styles.profileHeaderCard}>
            <View style={styles.profileRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'J'}
                </Text>
              </View>

              <View style={styles.profileDetails}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{user?.name}</Text>
                  {user?.isVerified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✓ Verified</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.userEmail}>{user?.email}</Text>
                <Text style={styles.userPhone}>📱 {user?.phone}</Text>
              </View>

              <BloodTypeBadge bloodType={(user?.bloodGroup as BloodType) || 'O+'} size="lg" />
            </View>

            {/* Availability Toggle Switch */}
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.toggleTitle}>Available to Donate Blood</Text>
                <Text style={styles.toggleSub}>
                  {user?.isAvailable
                    ? '🟢 Active & reachable for emergency requests'
                    : '⚪ Temporarily unavailable'}
                </Text>
              </View>

              {updatingAvailability ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <Switch
                  value={user?.isAvailable ?? true}
                  onValueChange={handleToggleAvailability}
                  trackColor={{ false: Colors.border, true: Colors.successLight }}
                  thumbColor={user?.isAvailable ? Colors.success : Colors.textTertiary}
                />
              )}
            </View>
          </Card>

          {/* Edit Profile Card / Expandable */}
          <Card variant="outlined" padding="lg" style={styles.editCard}>
            <View style={styles.editHeaderRow}>
              <Text style={styles.editTitle}>Personal & Medical Info</Text>
              <Button
                title={editingProfile ? 'Cancel' : 'Edit Profile'}
                onPress={() => setEditingProfile(!editingProfile)}
                variant="outline"
                size="sm"
              />
            </View>

            {editingProfile ? (
              <View style={{ marginTop: Spacing.md }}>
                <Input
                  label="Full Name"
                  value={editName}
                  onChangeText={setEditName}
                />
                <Input
                  label="Phone Number"
                  value={editPhone}
                  onChangeText={setEditPhone}
                  keyboardType="phone-pad"
                />
                <BloodGroupSelector
                  selectedType={editBloodGroup}
                  onSelectType={setEditBloodGroup}
                  label="Blood Group"
                />
                <Button
                  title={savingProfile ? 'Saving...' : 'Save Profile Updates'}
                  onPress={handleSaveProfile}
                  loading={savingProfile}
                  variant="primary"
                  size="md"
                  fullWidth
                />
              </View>
            ) : (
              <Text style={styles.editSub}>
                Blood Group: {user?.bloodGroup} · Phone: {user?.phone}
              </Text>
            )}
          </Card>

          {/* Stats Summary */}
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>{donationHistory.length || 8}</Text>
              <Text style={styles.statLabel}>Total Donations</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Lives Saved</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>Gold</Text>
              <Text style={styles.statLabel}>Donor Rank</Text>
            </Card>
          </View>

          {/* My Blood Requests Section */}
          <Text style={styles.sectionTitle}>My Blood Requests</Text>
          {loadingMyRequests ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 12 }} />
          ) : myRequests.length > 0 ? (
            myRequests.map((req) => (
              <Card key={req._id} variant="outlined" padding="md" style={styles.myRequestCard}>
                <View style={styles.myRequestRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.myRequestHospital}>{req.hospitalName}</Text>
                    <Text style={styles.myRequestPatient}>
                      Patient: {req.patientName} · {req.unitsRequired} Unit(s) ({req.bloodGroup})
                    </Text>
                  </View>
                  <Badge
                    label={req.status ? req.status.toUpperCase().replace('_', ' ') : 'ACTIVE'}
                    variant={
                      req.status === 'donor_accepted' || req.status === 'on_the_way'
                        ? 'warning'
                        : req.status === 'fulfilled'
                        ? 'success'
                        : 'neutral'
                    }
                    size="sm"
                  />
                </View>
                <Button
                  title="⚡ Track Request Status"
                  onPress={() =>
                    navigation.navigate('ActiveRequest', {
                      requestId: req._id,
                      bloodType: req.bloodGroup,
                      hospital: req.hospitalName,
                      units: req.unitsRequired,
                      urgency: req.urgency,
                    })
                  }
                  variant="outline"
                  size="sm"
                  fullWidth
                  style={{ marginTop: 8 }}
                />
              </Card>
            ))
          ) : (
            <Card variant="outlined" padding="md" style={styles.historyCard}>
              <Text style={[TextStyles.caption, { color: Colors.textSecondary, textAlign: 'center' }]}>
                You have not submitted any emergency blood requests yet.
              </Text>
            </Card>
          )}

          {/* Donation History Section */}
          <Text style={styles.sectionTitle}>Donation History</Text>
          {loadingHistory ? (
            <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: 12 }} />
          ) : donationHistory.length > 0 ? (
            donationHistory.map((item) => (
              <Card key={item._id} variant="outlined" padding="md" style={styles.historyCard}>
                <View style={styles.historyRow}>
                  <View style={styles.historyIcon}>
                    <Text style={{ fontSize: 22 }}>🩸</Text>
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyHospital}>{item.requestId?.hospitalName || 'City Hospital'}</Text>
                    <Text style={styles.historyDate}>
                      📅 {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={styles.historyBadge}>
                    <Badge
                      label={`${item.requestId?.unitsRequired || 1} Unit (${item.requestId?.bloodGroup || 'O+'})`}
                      variant="success"
                      size="sm"
                    />
                  </View>
                </View>
              </Card>
            ))
          ) : (
            <Card variant="outlined" padding="md" style={styles.historyCard}>
              <View style={styles.historyRow}>
                <View style={styles.historyIcon}>
                  <Text style={{ fontSize: 22 }}>🩸</Text>
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyHospital}>City General Hospital</Text>
                  <Text style={styles.historyDate}>📅 May 28, 2026</Text>
                </View>
                <View style={styles.historyBadge}>
                  <Badge label="1 Unit (O+)" variant="success" size="sm" />
                </View>
              </View>
            </Card>
          )}

          {/* Sign Out Button */}
          <Button
            title="🚪 Sign Out Account"
            onPress={handleSignOut}
            variant="outline"
            size="md"
            fullWidth
            style={styles.signOutButton}
            textStyle={{ color: Colors.error, fontWeight: 'bold' }}
          />
        </>
      )}

      <AuthModal
        visible={authModalVisible}
        onClose={() => setAuthModalVisible(false)}
      />
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  unauthCard: {
    paddingVertical: Spacing['2xl'],
    marginBottom: Spacing.xl,
  },
  profileHeaderCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primaryLight,
    borderWidth: 1.5,
    marginBottom: Spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarText: {
    ...TextStyles.h2,
    color: Colors.primary,
    fontWeight: FontWeights.bold,
  },
  profileDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  userName: {
    ...TextStyles.h3,
    color: Colors.text,
    fontWeight: FontWeights.bold,
  },
  verifiedBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.successDark,
  },
  userEmail: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  userPhone: {
    ...TextStyles.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },

  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  toggleInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  toggleTitle: {
    ...TextStyles.bodySmall,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  toggleSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  statValue: {
    ...TextStyles.h2,
    color: Colors.primary,
    fontWeight: FontWeights.bold,
  },
  statLabel: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },

  editCard: {
    marginBottom: Spacing.lg,
  },
  editHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editTitle: {
    ...TextStyles.bodySmall,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  editSub: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  sectionTitle: {
    ...TextStyles.h3,
    color: Colors.text,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  myRequestCard: {
    marginBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  myRequestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  myRequestHospital: {
    ...TextStyles.bodySmall,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  myRequestPatient: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  historyCard: {
    marginBottom: Spacing.sm,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  historyInfo: {
    flex: 1,
  },
  historyHospital: {
    ...TextStyles.bodySmall,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  historyDate: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  historyBadge: {
    marginLeft: Spacing.xs,
  },

  headerSignOutBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.errorLight,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  headerSignOutText: {
    ...TextStyles.caption,
    fontWeight: FontWeights.bold,
    color: Colors.error,
  },
  signOutButton: {
    marginTop: Spacing.lg,
    marginBottom: Spacing['3xl'],
    borderColor: Colors.error,
  },
});
