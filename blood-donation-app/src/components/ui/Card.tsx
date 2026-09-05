import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing } from '../../constants/spacing';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'md',
}) => {
  return (
    <View
      style={[
        styles.base,
        styles[variant],
        styles[`padding_${padding}`],
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },

  // Variants
  default: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  elevated: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: 'rgba(229, 231, 235, 0.8)',
    shadowColor: Colors.shadowDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  outlined: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },

  // Padding
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: Spacing.md,
  },
  padding_md: {
    padding: Spacing.lg,
  },
  padding_lg: {
    padding: Spacing['2xl'],
  },
});
