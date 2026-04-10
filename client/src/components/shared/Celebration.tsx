import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';

interface CelebrationProps {
  trigger: boolean;
  origin?: { x?: string; y?: string };
}

const PARTICLE_COLORS = [
  '#6C5CE7', '#FF6B6B', '#00C9A7', '#FFB830',
  '#A29BFE', '#55EFC4', '#FF9F9F', '#FFEAA7',
];

const PARTICLE_COUNT = 18;

interface ParticleData {
  angle: number;
  color: string;
  size: number;
  delay: number;
  duration: number;
  shape: string;
  dx: number;
  dy: number;
}

// Called only from useEffect — safe to use Math.random()
function buildParticles(): ParticleData[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (360 / PARTICLE_COUNT) * i + Math.random() * 20;
    const dist = 40 + Math.random() * 80;
    const rad = (angle * Math.PI) / 180;
    const dx = Math.cos(rad) * dist;
    const dy = Math.sin(rad) * dist;
    const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
    const size = 5 + Math.random() * 8;
    const delay = Math.random() * 150;
    const duration = 500 + Math.random() * 300;
    const shapeRoll = Math.random();
    const shape = shapeRoll < 0.33 ? '2px' : shapeRoll < 0.66 ? '50%' : '0';
    return { angle, color, size, delay, duration, shape, dx, dy };
  });
}

/**
 * CSS-only confetti burst.
 * Particles are computed in a useEffect (not during render) to satisfy React's purity rules.
 */
export default function Celebration({ trigger, origin }: CelebrationProps) {
  const ox = origin?.x ?? '50%';
  const oy = origin?.y ?? '50%';

  const [particles, setParticles] = useState<ParticleData[]>([]);

  useEffect(() => {
    if (trigger) {
      setParticles(buildParticles());
    } else {
      setParticles([]);
    }
  }, [trigger]);

  if (!trigger || particles.length === 0) return null;

  const keyframesCSS = particles.map((p, i) => `
    @keyframes particle${i} {
      0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      60%  { opacity: 0.8; }
      100% { opacity: 0; transform: translate(calc(-50% + ${p.dx}px), calc(-50% + ${p.dy}px)) scale(0.2) rotate(${p.angle}deg); }
    }
  `).join('');

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
      <style>{keyframesCSS}</style>
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: ox,
            top: oy,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape,
            opacity: 0,
            animation: `particle${i} ${p.duration}ms ease-out ${p.delay}ms forwards`,
          }}
        />
      ))}
    </Box>
  );
}
