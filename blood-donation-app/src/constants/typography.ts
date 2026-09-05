/**
 * Blood Donation App — Typography Design Tokens
 *
 * System font stack with a clear hierarchy
 * for healthcare readability.
 */

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
} as const;

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const LineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

/**
 * Pre-composed text styles for consistent usage.
 */
export const TextStyles = {
  h1: {
    fontSize: FontSizes['3xl'],
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes['3xl'] * LineHeights.tight,
  },
  h2: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes['2xl'] * LineHeights.tight,
  },
  h3: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.semibold,
    lineHeight: FontSizes.xl * LineHeights.tight,
  },
  subtitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.medium,
    lineHeight: FontSizes.lg * LineHeights.normal,
  },
  body: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.md * LineHeights.normal,
  },
  bodySmall: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.sm * LineHeights.normal,
  },
  caption: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.regular,
    lineHeight: FontSizes.xs * LineHeights.normal,
  },
  button: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    lineHeight: FontSizes.md * LineHeights.tight,
  },
  buttonSmall: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    lineHeight: FontSizes.sm * LineHeights.tight,
  },
  buttonLarge: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    lineHeight: FontSizes.lg * LineHeights.tight,
  },
  emergencyLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.extrabold,
    letterSpacing: 0.8,
  },
} as const;
