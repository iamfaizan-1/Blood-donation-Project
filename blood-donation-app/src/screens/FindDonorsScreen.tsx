import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, useFocusEffect, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenWrapper } from '../components/shared/ScreenWrapper';
import { Header } from '../components/ui/Header';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge, BloodTypeBadge } from '../components/ui/Badge';
import { DonorCard } from '../components/ui/DonorCard';
import { getCompatibleDonorTypes, isBloodCompatible } from '../utils/bloodCompatibility';
import { requestService } from '../services/requestService';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/shared/EmptyState';
import { Colors } from '../constants/colors';
import { Spacing, BorderRadius } from '../constants/spacing';
import { TextStyles, FontWeights } from '../constants/typography';
import { BloodType, DonorStatus } from '../types';
import { RootStackParamList } from '../navigation/types';

type FindDonorsRouteProp = RouteProp<RootStackParamList, 'FindDonorsStack'>;
type FindDonorsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface MockDonor {
  id: string;
  firstName: string; // ONLY first name for privacy
  bloodType: BloodType;
  distance: string;
  status: DonorStatus;
  isVerified: boolean;
  totalDonations: number;
  lastDonated?: string;
}

const MOCK_DONORS: MockDonor[] = [
  {
    id: 'd1',
    firstName: 'Ahmed',
    bloodType: 'O+',
    distance: '1.2 km',
    status: 'available',
    isVerified: true,
    totalDonations: 9,
    lastDonated: '3 months ago',
  },
  {
    id: 'd2',
    firstName: 'Sara',
    bloodType: 'O-',
    distance: '2.4 km',
    status: 'available',
    isVerified: true,
    totalDonations: 14,
    lastDonated: '5 months ago',
  },
  {
    id: 'd3',
    firstName: 'Hassan',
    bloodType: 'A+',
    distance: '3.1 km',
    status: 'available',
    isVerified: true,
    totalDonations: 6,
    lastDonated: '2 months ago',
  },
  {
    id: 'd4',
    firstName: 'Fatima',
    bloodType: 'A-',
    distance: '3.8 km',
    status: 'available',
    isVerified: true,
    totalDonations: 21,
    lastDonated: '4 months ago',
  },
  {
    id: 'd5',
    firstName: 'Zaid',
    bloodType: 'B+',
    distance: '4.5 km',
    status: 'available',
    isVerified: true,
    totalDonations: 3,
    lastDonated: '1 month ago',
  },
  {
    id: 'd6',
    firstName: 'Tariq',
    bloodType: 'AB+',
    distance: '4.9 km',
    status: 'available',
    isVerified: true,
    totalDonations: 11,
    lastDonated: '2 months ago',
  },
];

export const FindDonorsScreen: React.FC = () => {
  const navigation = useNavigation<FindDonorsNavigationProp>();
  const route = useRoute<FindDonorsRouteProp>();
  const { user } = useAuth();

  const requiredBloodType: BloodType = (route.params?.bloodType as BloodType) || 'O+';
  const hospitalName = route.params?.hospital || 'City General Hospital';
  const searchRadius = route.params?.radius || 5;

  const [selectedFilterType, setSelectedFilterType] = useState<string>('Compatible');
  const [searchQuery, setSearchQuery] = useState('');
  const [requestedDonorIds, setRequestedDonorIds] = useState<string[]>([]);
  const [donors, setDonors] = useState<MockDonor[]>([]);
  const [loading, setLoading] = useState(false);

  // Determine rule-based compatible donor blood groups
  const compatibleTypes = getCompatibleDonorTypes(requiredBloodType);

  const fetchMatchingDonors = async () => {
    setLoading(true);
    try {
      // Call Rule-Based Matching API on Express Backend
      const backendDonors = await requestService.getMatchingDonors(requiredBloodType, searchRadius);
      let formatted: MockDonor[] = [];

      if (backendDonors && backendDonors.length > 0) {
        formatted = backendDonors.map((d: any) => ({
          id: d.id,
          firstName: d.firstName,
          bloodType: d.bloodGroup,
          distance: d.distanceFormatted,
          status: 'available' as DonorStatus,
          isVerified: d.isVerified,
          totalDonations: d.totalDonations || 5,
        }));
      } else {
        // Fallback to client-side rule-based filtering on mock data
        formatted = MOCK_DONORS.filter(
          (d) =>
            isBloodCompatible(d.bloodType, requiredBloodType) &&
            d.status === 'available' &&
            d.isVerified
        ).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
      }

      // If the logged-in user is an active donor, guarantee they appear in the donor section
      if (user && user.isAvailable) {
        const currentUserId = user._id;
        const existingIndex = formatted.findIndex(
          (d) => d.id === currentUserId || d.firstName === user.name.split(' ')[0]
        );

        const myUserFirstName = user.name ? `${user.name.split(' ')[0]} (You)` : 'You';
        const myBloodGroup = (user.bloodGroup as BloodType) || 'O+';

        if (existingIndex >= 0) {
          formatted[existingIndex].firstName = myUserFirstName;
        } else {
          // Prepend current active donor
          formatted.unshift({
            id: currentUserId || 'my-active-donor-id',
            firstName: myUserFirstName,
            bloodType: myBloodGroup,
            distance: '0.2 km away',
            status: 'available' as DonorStatus,
            isVerified: true,
            totalDonations: 8,
            lastDonated: 'Available Now',
          });
        }
      }

      setDonors(formatted);
    } catch (error) {
      applyClientMatching();
    } finally {
      setLoading(false);
    }
  };

  const applyClientMatching = () => {
    // 1. Filter for rule-based medical compatibility
    // 2. Filter for availability & verification
    // 3. Distance sorting
    let matched = MOCK_DONORS.filter(
      (donor) =>
        isBloodCompatible(donor.bloodType, requiredBloodType) &&
        donor.status === 'available' &&
        donor.isVerified
    ).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    if (user && user.isAvailable) {
      const myUserFirstName = user.name ? `${user.name.split(' ')[0]} (You)` : 'You';
      matched.unshift({
        id: user._id || 'my-active-donor-id',
        firstName: myUserFirstName,
        bloodType: (user.bloodGroup as BloodType) || 'O+',
        distance: '0.2 km away',
        status: 'available' as DonorStatus,
        isVerified: true,
        totalDonations: 8,
        lastDonated: 'Available Now',
      });
    }

    setDonors(matched);
  };

  // Refresh matching donors whenever screen focuses or parameters change
  useFocusEffect(
    useCallback(() => {
      fetchMatchingDonors();
    }, [requiredBloodType, searchRadius, user?.isAvailable, user?.bloodGroup])
  );

  const handleRequestDonor = (donor: MockDonor) => {
    setRequestedDonorIds((prev) => [...prev, donor.id]);

    navigation.navigate('DonorRequest', {
      requestId: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      donorName: donor.firstName,
      bloodType: donor.bloodType,
      hospital: hospitalName,
      distance: donor.distance,
      units: 2,
      urgency: 'critical',
    });
  };

  const filteredDonors = donors.filter((donor) => {
    const isCurrentUser =
      (user?._id && donor.id === user._id) || donor.firstName.includes('(You)');

    const matchesSearch = donor.firstName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    // Current user's donor card is always visible in the donor section
    if (isCurrentUser) {
      if (selectedFilterType === 'All' || selectedFilterType === 'Compatible') {
        return true;
      }
      return donor.bloodType === selectedFilterType;
    }

    const matchesFilter =
      selectedFilterType === 'Compatible'
        ? isBloodCompatible(donor.bloodType, requiredBloodType)
        : selectedFilterType === 'All'
        ? true
        : donor.bloodType === selectedFilterType;

    return matchesFilter;
  });

  return (
    <ScreenWrapper>
      <Header
        title="Find Compatible Donors"
        subtitle={`Rule-matched donors for ${hospitalName} (${searchRadius}km radius)`}
        showBack
      />

      {/* Target Hospital & Required Blood Group Summary Header */}
      <Card variant="elevated" padding="md" style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryInfo}>
            <Text style={styles.summaryLabel}>DESTINATION HOSPITAL</Text>
            <Text style={styles.summaryHospital}>{hospitalName}</Text>
            <Text style={styles.summaryMeta}>
              📍 Within {searchRadius} km radius · 🩸 Compatible: {compatibleTypes.join(', ')}
            </Text>
          </View>

          <View style={styles.summaryTypeBox}>
            <Text style={styles.typeLabel}>RECIP. NEED</Text>
            <BloodTypeBadge bloodType={requiredBloodType} size="md" />
          </View>
        </View>
      </Card>

      {/* Current User Active Donor Status Card */}
      {user && (
        <Card
          variant="elevated"
          padding="md"
          style={{
            backgroundColor: user.isAvailable ? Colors.successLight : Colors.surface,
            borderColor: user.isAvailable ? Colors.success : Colors.border,
            borderWidth: 1.5,
            marginBottom: Spacing.md,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: Spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16 }}>{user.isAvailable ? '🟢' : '⚪'}</Text>
                <Text style={[TextStyles.subtitle, { fontWeight: FontWeights.bold }]}>
                  {user.name} (You)
                </Text>
                <Badge
                  label={user.isAvailable ? 'Active Donor' : 'Off-Duty'}
                  variant={user.isAvailable ? 'success' : 'neutral'}
                  size="sm"
                />
              </View>
              <Text style={[TextStyles.caption, { color: Colors.textSecondary, marginTop: 4 }]}>
                Your Blood Group: {user.bloodGroup || 'O+'} · {user.isAvailable ? 'Visible to nearby emergency requests' : 'Status paused'}
              </Text>
            </View>
            <BloodTypeBadge bloodType={(user.bloodGroup as BloodType) || 'O+'} size="md" />
          </View>
        </Card>
      )}

      {/* Search Input */}
      <Input
        placeholder="Search donor first name..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        prefixIcon={<Text style={{ fontSize: 16 }}>🔍</Text>}
      />

      {/* Quick Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {['Compatible', 'All', ...compatibleTypes].map((type) => {
          const isSelected = selectedFilterType === type;
          return (
            <Badge
              key={type}
              label={type === 'Compatible' ? '✨ Compatible' : type === 'All' ? 'All Donors' : type}
              variant={isSelected ? 'error' : 'neutral'}
              size="md"
              style={isSelected ? styles.filterBadgeActive : styles.filterBadge}
              onPress={() => setSelectedFilterType(type)}
            />
          );
        })}
      </ScrollView>

      {/* Results Count & Privacy Notice */}
      <View style={styles.privacyNotice}>
        <Text style={styles.resultsCount}>
          {filteredDonors.length} Verified & Compatible Donors Found
        </Text>
        <Text style={styles.privacyText}>
          🔒 Privacy Protected: Only first name & distance shown. Phone numbers & exact addresses stay hidden.
        </Text>
      </View>

      {/* Compatible Donor Cards */}
      {loading ? (
        <View style={{ paddingVertical: 48, alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={[TextStyles.bodySmall, { color: Colors.textSecondary, marginTop: 12 }]}>
            Searching for verified, compatible donors nearby...
          </Text>
        </View>
      ) : filteredDonors.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No Matching Donors Nearby"
          subtitle={`No active donors found for ${requiredBloodType} blood within ${searchRadius}km radius. Try widening search radius or viewing all donors.`}
          actionLabel="Show All Available Donors"
          onAction={() => {
            setSelectedFilterType('All');
            setSearchQuery('');
          }}
        />
      ) : (
        filteredDonors.map((donor) => (
          <DonorCard
            key={donor.id}
            id={donor.id}
            firstName={donor.firstName}
            bloodType={donor.bloodType}
            distance={donor.distance}
            status={donor.status}
            isVerified={donor.isVerified}
            totalDonations={donor.totalDonations}
            lastDonated={donor.lastDonated || 'Recent'}
            isRequested={requestedDonorIds.includes(donor.id)}
            onRequestDonor={
              donor.id === user?._id || donor.firstName.includes('(You)')
                ? undefined
                : () => handleRequestDonor(donor)
            }
          />
        ))
      )}
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.primaryLight,
    borderWidth: 1.5,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryInfo: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  summaryHospital: {
    ...TextStyles.subtitle,
    fontWeight: FontWeights.bold,
    color: Colors.text,
    marginTop: 2,
  },
  summaryMeta: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summaryTypeBox: {
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  typeLabel: {
    fontSize: 8,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
    marginBottom: 4,
  },

  filterScroll: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  filterBadge: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  filterBadgeActive: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
  },

  privacyNotice: {
    marginBottom: Spacing.md,
  },
  resultsCount: {
    ...TextStyles.bodySmall,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  privacyText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing['2xl'],
    marginTop: Spacing.md,
  },
});
