import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { Button } from './Button';
import { Badge, BloodTypeBadge } from './Badge';
import { BloodType, UrgencyLevel } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/spacing';
import { TextStyles, FontWeights } from '../../constants/typography';

export interface RequestCardProps {
  id?: string;
  bloodType: BloodType;
  hospital: string;
  distance: string;
  units: number;
  urgency: UrgencyLevel;
  timeRemaining?: string;
  onPressAction?: () => void;
  actionText?: string;
  isCompact?: boolean;
}

export const RequestCard: React.FC<RequestCardProps> = ({
  bloodType,
  hospital,
  distance,
  units,
  urgency,
  timeRemaining = '2 hours left',
  onPressAction,
  actionText = 'View Details',
  isCompact = false,
}) => {
  const getUrgencyBadge = () => {
    switch (urgency) {
      case 'critical':
        return <Badge label="Critical" variant="error" size="sm" />;
      case 'urgent':
        return <Badge label="Urgent" variant="warning" size="sm" />;
      default:
        return <Badge label="Normal" variant="neutral" size="sm" />;
    }
  };

  return (
    <Card variant="outlined" padding={isCompact ? 'md' : 'lg'} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.bloodTypeContainer}>
          <BloodTypeBadge bloodType={bloodType} size={isCompact ? 'md' : 'lg'} />
          <View style={styles.headerInfo}>
            <Text style={styles.hospitalName} numberOfLines={1}>
              {hospital}
            </Text>
            <Text style={styles.metaText}>
              📍 {distance} · 🩸 {units} unit{units > 1 ? 's' : ''} needed
            </Text>
          </View>
        </View>
        {getUrgencyBadge()}
      </View>

      <View style={styles.footer}>
        <Text style={styles.timeText}>⏰ {timeRemaining}</Text>
        {onPressAction && (
          <Button
            title={actionText}
            onPress={onPressAction}
            variant="primary"
            size="sm"
            style={styles.actionBtn}
          />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  bloodTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  headerInfo: {
    marginLeft: Spacing.md,
    flex: 1,
  },
  hospitalName: {
    ...TextStyles.subtitle,
    color: Colors.text,
    fontWeight: FontWeights.semibold,
  },
  metaText: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    marginTop: Spacing.xxs,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
  },
  timeText: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  actionBtn: {
    minWidth: 110,
  },
});
