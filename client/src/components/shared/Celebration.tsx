import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface CelebrationProps {
  trigger: boolean; // Flip to true to fire a burst
  origin?: { x?: string; y?: string }; // CSS values, default center
}

const PARTICLE_COLORS = [
  '#6C5CE7', '#FF6B6B', '#00C9A7', '#FFB830',
  '#A29BFE', '#55EFC4', '#FF9F9F', '#FFEAA7',
];

const PARTICLE_COUNT = 18;

/**
 * CSS-only confetti burst.
 * Each particle flies outward from the origin and fades out over 700ms.
 * Auto-unmounts after the animation completes.
 */
export default function Celebration({ trigger, origin }: CelebrationProps) {
  const mountedRef = useRef(trigger);

  useEffect(() => {
    mountedRef.current = trigger;
  }, [trigger]);

  if (!trigger) return null;

  const ox = origin?.x ?? '50%';
  const oy = origin?.y ?? '50%';

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
        overflow: 'hidden',
      }}
    >
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const angle = (360 / PARTICLE_COUNT) * i + Math.random() * 20;
        const dist = 40 + Math.random() * 80;
        const rad = (angle * Math.PI) / 180;
        const tx = `translate(calc(${ox} + ${Math.cos(rad) * dist}px - 50%), calc(${oy} + ${Math.sin(rad) * dist}px - 50%))`;
        const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
        const size = 6 + Math.random() * 7;
        const delay = Math.random() * 120;
        const duration = 500 + Math.random() * 250;
        const shape = i % 3 === 0 ? '2px' : i % 3 === 1 ? '50%' : '0';

        return (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              left: ox,
              top: oy,
              width: size,
              height: size,
              bgcolor: color,
              borderRadius: shape,
              transformOrigin: 'center',
              animation: `celebrateOut ${duration}ms ease-out ${delay}ms both`,
              '@keyframes celebrateOut': {
                '0%': { opacity: 1, transform: `translate(-50%, -50%) scale(1)` },
                '100%': { opacity: 0, transform: `translate(-50%, -50%) scale(0.3) ${tx.replace(/^[^)]+\)/, '')}`, },
              },
            }}
            style={{
              // Override with CSS custom property so each particle goes different direction
              ['--end-transform' as string]: tx,
            }}
          />
        );
      })}
      <style>{`
        @keyframes celebrateOut {
          0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: var(--end-transform, translate(0, -60px)) scale(0); }
        }
      `}</style>
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const angle = (360 / PARTICLE_COUNT) * i + Math.random() * 20;
        const dist = 50 + Math.random() * 90;
        const rad = (angle * Math.PI) / 180;
        const dx = Math.cos(rad) * dist;
        const dy = Math.sin(rad) * dist;
        const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
        const size = 5 + Math.random() * 8;
        const delay = Math.random() * 150;
        const duration = 550 + Math.random() * 300;

        return (
          <div
            key={`p2-${i}`}
            style={{
              position: 'absolute',
              left: ox,
              top: oy,
              width: size,
              height: size,
              backgroundColor: color,
              borderRadius: i % 2 === 0 ? '50%' : '2px',
              opacity: 0,
              animation: `particle${i} ${duration}ms ease-out ${delay}ms forwards`,
            }}
          />
        );
      })}
      <style>{Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const angle = (360 / PARTICLE_COUNT) * i + Math.random() * 20;
        const dist = 50 + Math.random() * 90;
        const rad = (angle * Math.PI) / 180;
        const dx = Math.cos(rad) * dist;
        const dy = Math.sin(rad) * dist;
        return `
          @keyframes particle${i} {
            0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            60%  { opacity: 0.8; }
            100% { opacity: 0; transform: translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.2) rotate(${angle}deg); }
          }
        `;
      }).join('')}</style>
    </Box>
  );
}
