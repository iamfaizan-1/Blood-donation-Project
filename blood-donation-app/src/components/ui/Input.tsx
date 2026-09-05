import React, { useState } from 'react';
import {
  View,
  TextInput as RNTextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps as RNTextInputProps,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius, Spacing, TouchTarget } from '../../constants/spacing';
import { FontSizes, FontWeights, TextStyles } from '../../constants/typography';

interface InputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  prefixIcon,
  suffixIcon,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          error ? styles.inputError : undefined,
        ]}
      >
        {prefixIcon && <View style={styles.prefix}>{prefixIcon}</View>}
        <RNTextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textTertiary}
          onFocus={(e) => {
            setIsFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          accessibilityLabel={label || props.placeholder}
          {...props}
        />
        {suffixIcon && <View style={styles.suffix}>{suffixIcon}</View>}
      </View>
      {error && (
        <View style={styles.errorRow}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    ...TextStyles.bodySmall,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    minHeight: TouchTarget.comfortable, // 48px standard
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: '#FFFFFF',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 1,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.md,
    color: Colors.text,
    minHeight: TouchTarget.comfortable,
  },
  prefix: {
    marginRight: Spacing.sm,
  },
  suffix: {
    marginLeft: Spacing.sm,
  },
  inputError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight,
  },
  errorRow: {
    marginTop: Spacing.xs,
  },
  errorText: {
    ...TextStyles.caption,
    color: '#B91C1C',
    fontWeight: FontWeights.semibold,
  },
  hint: {
    ...TextStyles.caption,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
  },
});
