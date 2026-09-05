import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing, TouchTarget } from '../../constants/spacing';
import { TextStyles } from '../../constants/typography';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'emergency';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[variant],
        styles[`size_${size}`],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'emergency' ? Colors.textInverse : Colors.primary}
          size="small"
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              styles.text,
              styles[`text_${variant}`],
              styles[`textSize_${size}`],
              isDisabled && styles.textDisabled,
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary,
    borderWidth: 0,
  },
  emergency: {
    backgroundColor: '#DC2626',
    borderWidth: 0,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  secondary: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 0,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },

  // Sizes — Standard Accessible Touch Targets
  size_sm: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    minHeight: TouchTarget.min, // 44px minimum touch target
  },
  size_md: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    minHeight: TouchTarget.comfortable, // 48px comfortable target
  },
  size_lg: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing['2xl'],
    minHeight: TouchTarget.prominent, // 56px prominent action target
  },

  fullWidth: {
    width: '100%',
  },

  disabled: {
    opacity: 0.5,
  },

  // Text
  text: {
    ...TextStyles.button,
  },
  text_primary: {
    color: Colors.textInverse,
  },
  text_emergency: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  text_secondary: {
    color: Colors.primary,
  },
  text_outline: {
    color: Colors.primary,
  },
  text_ghost: {
    color: Colors.primary,
  },

  textSize_sm: {
    ...TextStyles.buttonSmall,
  },
  textSize_md: {
    ...TextStyles.button,
  },
  textSize_lg: {
    ...TextStyles.buttonLarge,
  },

  textDisabled: {
    opacity: 0.7,
  },
});
