import React from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import { useTheme, Box, Typography } from '@mui/material';

interface DataPoint {
  date: string;
  cumulative: number;
  expected?: number;
}

interface Props {
  data: DataPoint[];
  target: number;
  unit: string;
  height?: number;
}

export default function ProgressAreaChart({ data, target, unit, height = 260 }: Props) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const gridColor = isDark ? '#2a2a3e' : '#e0e0e0';
  const textColor = isDark ? '#888' : '#666';

  if (!data.length) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height }}>
        <Typography variant="body2" color="text.secondary">No progress entries yet</Typography>
      </Box>
    );
  }

  const formatted = data.map(d => ({
    ...d,
    date: formatDate(d.date),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6C5CE7" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6C5CE7" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="expectedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00C9A7" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#00C9A7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: textColor }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 11, fill: textColor }}
          tickLine={false}
          axisLine={false}
          unit={` ${unit}`}
        />
        <Tooltip
          contentStyle={{
            background: isDark ? '#1a1a24' : '#fff',
            border: `1px solid ${isDark ? '#333' : '#ddd'}`,
            borderRadius: 8,
            fontSize: 12,
          }}
          formatter={(val, name) => [`${val} ${unit}`, name]}
        />
        <ReferenceLine y={target} stroke="#FFB830" strokeDasharray="4 4" label={{ value: 'Target', fill: '#FFB830', fontSize: 11 }} />
        {data[0]?.expected !== undefined && (
          <Area
            type="monotone"
            dataKey="expected"
            name="Expected"
            stroke="#00C9A7"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="url(#expectedGrad)"
            dot={false}
          />
        )}
        <Area
          type="monotone"
          dataKey="cumulative"
          name="Actual"
          stroke="#6C5CE7"
          strokeWidth={2}
          fill="url(#progressGrad)"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}
