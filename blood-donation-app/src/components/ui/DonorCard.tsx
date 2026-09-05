import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { Badge, BloodTypeBadge } from './Badge';
import { BloodType, DonorStatus } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { TextStyles, FontWeights } from '../../constants/typography';

export interface DonorCardProps {
  id?: string;
  firstName: string; // Only first name displayed for privacy
  bloodType: BloodType;
  distance: string; // Approximate distance e.g. "1.2 km away"
  status: DonorStatus | 'available' | 'unavailable';
  isVerified?: boolean;
  totalDonations?: number;
  lastDonated?: string;
  onRequestDonor?: () => void;
  isRequested?: boolean;
}

export const DonorCard: React.FC<DonorCardProps> = ({
  firstName,
  bloodType,
  distance,
  status = 'available',
  isVerified = true,
  totalDonations = 5,
  lastDonated = '2 months ago',
  onRequestDonor,
  isRequested = false,
}) => {
  const isAvailable = status === 'available' || status === ('Available' as any);

  return (
    <Card variant="outlined" padding="md" style={styles.card}>
      <View style={styles.contentRow}>
        {/* Avatar with initial */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
        </View>

        {/* Info */}
        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.donorName}>{firstName}</Text>
            {isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>✓ Verified</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaText}>📍 {distance}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Text style={styles.metaText}>🩸 {totalDonations} donations</Text>
          </View>

          <Text style={styles.lastDonatedText}>Last donated: {lastDonated}</Text>

          <View style={styles.statusAndAction}>
            <Badge
              label={isAvailable ? 'Available' : 'Busy'}
              variant={isAvailable ? 'success' : 'neutral'}
              size="sm"
            />

            {onRequestDonor && (
              <Button
                title={isRequested ? 'Request Sent' : 'Request Donor'}
                onPress={onRequestDonor}
                variant={isRequested ? 'secondary' : 'emergency'}
                disabled={!isAvailable || isRequested}
                size="sm"
                style={styles.requestBtn}
              />
            )}
          </View>
        </View>

        {/* Blood group badge on right */}
        <View style={styles.bloodTypeBox}>
          <BloodTypeBadge bloodType={bloodType} size="md" />
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
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
  infoCol: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xxs,
  },
  donorName: {
    ...TextStyles.subtitle,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  verifiedBadge: {
    backgroundColor: Colors.secondaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.secondaryDark,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  metaText: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
  },
  metaDot: {
    color: Colors.textTertiary,
    fontSize: 10,
  },
  lastDonatedText: {
    ...TextStyles.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  statusAndAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  requestBtn: {
    paddingHorizontal: Spacing.md,
  },
  bloodTypeBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
