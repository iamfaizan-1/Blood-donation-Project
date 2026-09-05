/**
 * Blood Donation App — Color Design Tokens
 *
 * Healthcare-inspired palette:
 * - Red primary for emergency/action
 * - White background for clinical clarity
 * - Accessible contrast ratios (WCAG AA+)
 */

export const Colors = {
  // Primary — Emergency Red
  primary: '#DC2626',
  primaryDark: '#991B1B',
  primaryLight: '#FEE2E2',
  primaryMuted: '#FECACA',

  // Secondary — Healthcare Teal/Blue
  secondary: '#0284C7',
  secondaryDark: '#0369A1',
  secondaryLight: '#E0F2FE',

  // Backgrounds
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceElevated: '#FFFFFF',

  // Text
  text: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Borders & Dividers
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#E5E7EB',

  // Semantic
  success: '#059669',
  successDark: '#047857',
  successLight: '#D1FAE5',
  warning: '#D97706',
  warningDark: '#B45309',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorDark: '#991B1B',
  errorLight: '#FEE2E2',
  info: '#2563EB',
  infoDark: '#1D4ED8',
  infoLight: '#DBEAFE',

  // Shadows
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowDark: 'rgba(0, 0, 0, 0.16)',

  // Tab Bar
  tabActive: '#DC2626',
  tabInactive: '#9CA3AF',
  tabBackground: '#FFFFFF',
} as const;

export type ColorToken = keyof typeof Colors;
