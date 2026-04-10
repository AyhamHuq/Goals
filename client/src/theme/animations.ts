// CSS keyframe definitions and animation utilities

export const keyframes = {
  fadeSlideUp: `
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `,
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
  `,
  scaleIn: `
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.88); }
      to   { opacity: 1; transform: scale(1); }
    }
  `,
  shimmer: `
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
  `,
  breathe: `
    @keyframes breathe {
      0%, 100% { transform: scale(1); }
      50%       { transform: scale(1.055); }
    }
  `,
  pulseGlow: `
    @keyframes pulseGlow {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.65; }
    }
  `,
  celebrateParticle: `
    @keyframes celebrateParticle {
      0%   { opacity: 1; transform: translate(0, 0) scale(1); }
      100% { opacity: 0; transform: var(--tx) scale(0); }
    }
  `,
  orbitSpin: `
    @keyframes orbitSpin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
  `,
  slideInBottom: `
    @keyframes slideInBottom {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `,
} as const;

// Stagger delay for list animations
export function staggerDelay(index: number, baseMs = 40): string {
  return `${index * baseMs}ms`;
}

// Spring easing — feels more alive than cubic-bezier defaults
export const SPRING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
export const EASE_OUT = 'cubic-bezier(0.0, 0, 0.2, 1)';

// Common animation shorthands (value: CSS animation string)
export const ANIM = {
  fadeSlideUp: (delay = '0ms', duration = '350ms') =>
    `fadeSlideUp ${duration} ${EASE_OUT} ${delay} both`,
  scaleIn: (delay = '0ms') =>
    `scaleIn 200ms ${SPRING} ${delay} both`,
  breathe: 'breathe 3.5s ease-in-out infinite',
  pulseGlow: 'pulseGlow 2s ease-in-out infinite',
  shimmer: 'shimmer 2.5s linear infinite',
  orbitSpin: 'orbitSpin 12s linear infinite',
} as const;
