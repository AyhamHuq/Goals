import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface CircularProgressRingProps {
  value: number; // 0–100
  size?: number;
  strokeWidth?: number;
  color: string;
  trackColor?: string;
  children?: React.ReactNode;
  animate?: boolean;
}

/**
 * SVG-based circular progress ring — Apple Fitness-style.
 * Uses stroke-dashoffset animation for a smooth sweep on mount.
 */
export default function CircularProgressRing({
  value,
  size = 64,
  strokeWidth = 5,
  color,
  trackColor,
  children,
  animate = true,
}: CircularProgressRingProps) {
  const arcRef = useRef<SVGCircleElement>(null);
  const clamped = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  // Animate arc on mount
  useEffect(() => {
    if (!animate || !arcRef.current) return;
    const el = arcRef.current;
    // Start fully hidden
    el.style.transition = 'none';
    el.style.strokeDashoffset = String(circumference);
    // Force reflow then animate
    void el.getBoundingClientRect();
    el.style.transition = 'stroke-dashoffset 700ms cubic-bezier(0.4, 0, 0.2, 1)';
    el.style.strokeDashoffset = String(offset);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Animate on value changes after mount
  useEffect(() => {
    if (!animate || !arcRef.current) return;
    arcRef.current.style.transition = 'stroke-dashoffset 500ms cubic-bezier(0.4, 0, 0.2, 1)';
    arcRef.current.style.strokeDashoffset = String(offset);
  }, [offset, animate]);

  const defaultTrack = 'rgba(0,0,0,0.07)';

  return (
    <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor ?? defaultTrack}
          strokeWidth={strokeWidth}
        />
        {/* Progress arc */}
        <circle
          ref={arcRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animate ? circumference : offset}
          style={{ transition: animate ? undefined : 'none' }}
        />
      </svg>
      {/* Center content */}
      {children && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </Box>
      )}
    </Box>
  );
}
