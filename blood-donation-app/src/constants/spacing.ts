/**
 * Blood Donation App — Spacing Design Tokens
 *
 * 4px base unit spacing scale for consistent
 * padding, margins, and gaps.
 */

export const Spacing = {
  /** 2px */
  xxs: 2,
  /** 4px */
  xs: 4,
  /** 8px */
  sm: 8,
  /** 12px */
  md: 12,
  /** 16px */
  lg: 16,
  /** 20px */
  xl: 20,
  /** 24px */
  '2xl': 24,
  /** 32px */
  '3xl': 32,
  /** 40px */
  '4xl': 40,
  /** 48px */
  '5xl': 48,
  /** 64px */
  '6xl': 64,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const IconSize = {
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
} as const;

/**
 * Minimum touch target dimensions compliant with
 * Apple HIG & Material Design accessibility standards.
 */
export const TouchTarget = {
  /** 44px — Standard minimum accessible touch target */
  min: 44,
  /** 48px — Recommended comfortable touch target */
  comfortable: 48,
  /** 56px — Prominent emergency primary action target */
  prominent: 56,
} as const;

export type SpacingToken = keyof typeof Spacing;
