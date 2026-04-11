import React from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, BarChart, Bar,
} from 'recharts';
import { useTheme, Box, Typography } from '@mui/material';
import type { TrendPoint } from '../../../types/admin';

interface TrendLineProps {
  data: TrendPoint[];
  lines: Array<{ key: keyof TrendPoint; label: string; color: string }>;
  height?: number;
}

export function TrendLineChart({ data, lines, height = 250 }: TrendLineProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const gridColor = isDark ? '#2a2a3e' : '#e0e0e0';
  const textColor = isDark ? '#888' : '#666';

  if (!data.length) return <EmptyChart />;

  const formatted = data.map(d => ({
    ...d,
    date: formatDate(d.date),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: textColor }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: textColor }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: isDark ? '#1a1a24' : '#fff',
            border: `1px solid ${isDark ? '#333' : '#ddd'}`,
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {lines.map(l => (
          <Line
            key={String(l.key)}
            type="monotone"
            dataKey={l.key as string}
            name={l.label}
            stroke={l.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

interface BarProps {
  data: Array<{ label: string; value: number }>;
  color?: string;
  height?: number;
}

export function SimpleBarChart({ data, color = '#6C5CE7', height = 220 }: BarProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const gridColor = isDark ? '#2a2a3e' : '#e0e0e0';
  const textColor = isDark ? '#888' : '#666';

  if (!data.length) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: textColor }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: textColor }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: isDark ? '#1a1a24' : '#fff',
            border: `1px solid ${isDark ? '#333' : '#ddd'}`,
            borderRadius: 8,
            fontSize: 12,
          }}
          cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <Typography variant="body2" color="text.secondary">No data for this range</Typography>
    </Box>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}
