import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/spacing';
import { FontSizes, FontWeights } from '../../constants/typography';
import { BloodType } from '../../types';

interface BadgeProps {
  label: string;
  variant?: 'primary' | 'error' | 'success' | 'warning' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle | ViewStyle[];
  onPress?: () => void;
}

interface BloodTypeBadgeProps {
  bloodType: BloodType;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle | ViewStyle[];
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  style,
  onPress,
}) => {
  const content = (
    <View style={[styles.base, styles[variant], styles[`size_${size}`], style]}>
      <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]]}>
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={onPress}
        hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
        style={{ minHeight: 44, justifyContent: 'center' }}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

export const BloodTypeBadge: React.FC<BloodTypeBadgeProps> = ({
  bloodType,
  size = 'md',
  style,
}) => {
  return (
    <View style={[styles.base, styles.bloodType, styles[`size_${size}`], style]}>
      <Text style={[styles.text, styles.text_bloodType, styles[`textSize_${size}`]]}>
        {bloodType}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Variants
  primary: {
    backgroundColor: Colors.primaryLight,
  },
  error: {
    backgroundColor: Colors.primary,
  },
  success: {
    backgroundColor: Colors.successLight,
  },
  warning: {
    backgroundColor: Colors.warningLight,
  },
  info: {
    backgroundColor: Colors.infoLight,
  },
  neutral: {
    backgroundColor: Colors.borderLight,
  },
  bloodType: {
    backgroundColor: Colors.primary,
    minWidth: 40,
  },

  // Sizes
  size_sm: {
    paddingVertical: Spacing.xxs,
    paddingHorizontal: Spacing.sm,
  },
  size_md: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  size_lg: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },

  // Text
  text: {
    fontWeight: FontWeights.semibold,
    textAlign: 'center',
  },
  text_primary: {
    color: Colors.primary,
  },
  text_error: {
    color: Colors.textInverse,
  },
  text_success: {
    color: Colors.success,
  },
  text_warning: {
    color: Colors.warning,
  },
  text_info: {
    color: Colors.info,
  },
  text_neutral: {
    color: Colors.textSecondary,
  },
  text_bloodType: {
    color: Colors.textInverse,
    fontWeight: FontWeights.bold,
  },

  // Text Sizes
  textSize_sm: {
    fontSize: FontSizes.xs,
  },
  textSize_md: {
    fontSize: FontSizes.sm,
  },
  textSize_lg: {
    fontSize: FontSizes.md,
  },
});
