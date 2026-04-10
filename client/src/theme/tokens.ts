// Design tokens — shared style constants used across components

export const COLORS = {
  // Brand palette
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  primaryDark: '#4834D4',

  secondary: '#FF6B6B',
  secondaryLight: '#FF9F9F',

  success: '#00C9A7',
  successLight: '#55EFC4',

  warning: '#FFB830',
  warningLight: '#FFEAA7',

  error: '#EF5350',
  errorLight: '#FF7675',

  // Neutral
  text: '#1A1A2E',
  textSecondary: '#6B7280',

  // Pacing colors (mirrors GoalCard logic)
  pace: {
    on: '#00C9A7',
    warning: '#FFB830',
    behind: '#EF5350',
    neutral: '#6C5CE7',
  },
} as const;

export const GRADIENTS = {
  primary: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 50%, #FF6B6B 100%)',
  primarySubtle: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
  success: 'linear-gradient(135deg, #00C9A7 0%, #55EFC4 100%)',
  warning: 'linear-gradient(135deg, #FFB830 0%, #FFEAA7 100%)',
  error: 'linear-gradient(135deg, #EF5350 0%, #FF7675 100%)',
  onboarding: 'linear-gradient(160deg, #6C5CE7 0%, #A29BFE 45%, #FF6B6B 100%)',
  dark: 'linear-gradient(135deg, #4834D4 0%, #6C5CE7 100%)',
  hero: 'linear-gradient(180deg, rgba(108,92,231,0.06) 0%, transparent 100%)',
} as const;

// Glass morphism surfaces
export const GLASS = {
  light: {
    background: 'rgba(255,255,255,0.75)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.6)',
  },
  dark: {
    background: 'rgba(18,18,30,0.8)',
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
} as const;

export const SHADOWS = {
  card: '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.04)',
  cardHover: '0 4px 16px rgba(108,92,231,0.15), 0 12px 32px rgba(0,0,0,0.08)',
  cardDark: '0 2px 8px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)',
  button: '0 4px 14px rgba(108,92,231,0.35)',
  nav: '0 -4px 24px rgba(0,0,0,0.08)',
  navDark: '0 -4px 24px rgba(0,0,0,0.4)',
  floatingButton: '0 8px 24px rgba(108,92,231,0.45)',
} as const;

// Color maps keyed by pacing status — for both light and dark
export type PacingColor = 'success' | 'warning' | 'error' | 'primary';

export const PACING_HEX: Record<PacingColor, string> = {
  success: COLORS.success,
  warning: COLORS.warning,
  error: COLORS.error,
  primary: COLORS.primary,
};

export const PACING_GRADIENT: Record<PacingColor, string> = {
  success: GRADIENTS.success,
  warning: GRADIENTS.warning,
  error: GRADIENTS.error,
  primary: GRADIENTS.primarySubtle,
};
