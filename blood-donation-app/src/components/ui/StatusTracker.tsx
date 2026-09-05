import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/spacing';
import { TextStyles, FontWeights } from '../../constants/typography';

export type RequestStepKey =
  | 'requested'
  | 'donors_notified'
  | 'donor_accepted'
  | 'contact_established'
  | 'on_the_way'
  | 'donation_completed'
  | 'closed';

export interface StepItem {
  key: RequestStepKey;
  label: string; // e.g. "REQUESTED"
  title: string;
  subtitle: string;
  icon: string;
  time?: string;
}

export const WORKFLOW_STEPS: StepItem[] = [
  {
    key: 'requested',
    label: 'REQUESTED',
    title: 'Request Created',
    subtitle: 'Emergency blood request created & registered in system',
    icon: '📋',
  },
  {
    key: 'donors_notified',
    label: 'DONORS_NOTIFIED',
    title: 'Donors Notified',
    subtitle: 'Compatible donors within radius notified via push alerts',
    icon: '📡',
  },
  {
    key: 'donor_accepted',
    label: 'DONOR_ACCEPTED',
    title: 'Donor Accepted',
    subtitle: 'A compatible donor accepted your emergency request',
    icon: '🤝',
  },
  {
    key: 'contact_established',
    label: 'CONTACT_ESTABLISHED',
    title: 'Contact Established',
    subtitle: 'Direct communication & chat line active between parties',
    icon: '📞',
  },
  {
    key: 'on_the_way',
    label: 'ON_THE_WAY',
    title: 'Donor On The Way',
    subtitle: 'Donor is travelling to the hospital location',
    icon: '🚗',
  },
  {
    key: 'donation_completed',
    label: 'DONATION_COMPLETED',
    title: 'Donation Completed',
    subtitle: 'Blood donation completed successfully at the facility',
    icon: '🩸',
  },
  {
    key: 'closed',
    label: 'CLOSED',
    title: 'Request Closed',
    subtitle: 'Case verified, completed and closed',
    icon: '🏁',
  },
];

// Keep legacy export for backwards compatibility
export const STATUS_STEPS = WORKFLOW_STEPS;

interface StatusTrackerProps {
  currentStepIndex: number; // 0 to 6
  steps?: StepItem[];
}

export const StatusTracker: React.FC<StatusTrackerProps> = ({
  currentStepIndex,
  steps = WORKFLOW_STEPS,
}) => {
  // Pulse animation for the active step
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStepIndex;
        const isCurrent = index === currentStepIndex;
        const isPending = index > currentStepIndex;
        const isLast = index === steps.length - 1;

        return (
          <View key={step.key} style={styles.stepRow}>
            {/* Left Indicator Column */}
            <View style={styles.indicatorCol}>
              {isCurrent ? (
                <Animated.View
                  style={[
                    styles.circle,
                    styles.circleCurrent,
                    { transform: [{ scale: pulseAnim }] },
                  ]}
                >
                  <Text style={styles.iconCurrent}>{step.icon}</Text>
                </Animated.View>
              ) : (
                <View
                  style={[
                    styles.circle,
                    isCompleted && styles.circleCompleted,
                    isPending && styles.circlePending,
                  ]}
                >
                  {isCompleted ? (
                    <Text style={styles.checkIcon}>✓</Text>
                  ) : (
                    <Text style={styles.iconPending}>{step.icon}</Text>
                  )}
                </View>
              )}

              {!isLast && (
                <View
                  style={[
                    styles.line,
                    isCompleted ? styles.lineCompleted : styles.linePending,
                  ]}
                />
              )}
            </View>

            {/* Right Content Column */}
            <View
              style={[
                styles.contentCol,
                !isLast && { paddingBottom: Spacing.lg },
              ]}
            >
              <View style={styles.titleRow}>
                <View style={styles.titleWithBadge}>
                  <Text
                    style={[
                      styles.stepTitle,
                      isCurrent && styles.stepTitleCurrent,
                      isPending && styles.stepTitlePending,
                    ]}
                  >
                    {step.title}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      isCompleted && styles.statusBadgeCompleted,
                      isCurrent && styles.statusBadgeCurrent,
                      isPending && styles.statusBadgePending,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isCompleted && styles.statusBadgeTextCompleted,
                        isCurrent && styles.statusBadgeTextCurrent,
                        isPending && styles.statusBadgeTextPending,
                      ]}
                    >
                      {step.label}
                    </Text>
                  </View>
                </View>
                {step.time ? (
                  <Text
                    style={[
                      styles.stepTime,
                      isCurrent && {
                        color: Colors.primary,
                        fontWeight: FontWeights.bold,
                      },
                    ]}
                  >
                    {step.time}
                  </Text>
                ) : null}
              </View>

              <Text style={styles.stepSubtitle}>{step.subtitle}</Text>

              {isCurrent && (
                <View style={styles.activeTag}>
                  <View style={styles.activeDot} />
                  <Text style={styles.activeTagText}>CURRENT STAGE</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.xs,
  },
  stepRow: {
    flexDirection: 'row',
  },
  indicatorCol: {
    alignItems: 'center',
    width: 38,
    marginRight: Spacing.md,
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  circleCompleted: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  circleCurrent: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  circlePending: {
    backgroundColor: '#F8FAFC',
    borderColor: Colors.borderLight,
  },
  checkIcon: {
    color: Colors.textInverse,
    fontWeight: FontWeights.bold,
    fontSize: 16,
  },
  iconCurrent: {
    fontSize: 15,
  },
  iconPending: {
    fontSize: 14,
    opacity: 0.5,
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 4,
  },
  lineCompleted: {
    backgroundColor: Colors.success,
  },
  linePending: {
    backgroundColor: Colors.borderLight,
  },
  contentCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  titleWithBadge: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    paddingRight: Spacing.xs,
  },
  stepTitle: {
    ...TextStyles.body,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  stepTitleCurrent: {
    color: Colors.primary,
  },
  stepTitlePending: {
    color: Colors.textTertiary,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 1,
  },
  statusBadgeCompleted: {
    backgroundColor: '#ECFDF5',
  },
  statusBadgeCurrent: {
    backgroundColor: Colors.primaryLight,
  },
  statusBadgePending: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
  },
  statusBadgeTextCompleted: {
    color: Colors.success,
  },
  statusBadgeTextCurrent: {
    color: Colors.primary,
  },
  statusBadgeTextPending: {
    color: Colors.textTertiary,
  },
  stepTime: {
    ...TextStyles.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  stepSubtitle: {
    ...TextStyles.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
});
