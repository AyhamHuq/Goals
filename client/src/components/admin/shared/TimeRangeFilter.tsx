import React from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import type { TimeRange } from '../../../types/admin';

interface Props {
  from: string;
  to: string;
  range: TimeRange;
  onRangeChange: (range: TimeRange, from: string, to: string) => void;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function yearStart(): string {
  return `${new Date().getFullYear()}-01-01`;
}

const PRESETS: Array<{ label: string; value: TimeRange; from: () => string; to: () => string }> = [
  { label: '12h', value: '12h', from: today, to: today },
  { label: '1d', value: '1d', from: () => daysAgo(1), to: today },
  { label: '7d', value: '7d', from: () => daysAgo(7), to: today },
  { label: '30d', value: '30d', from: () => daysAgo(30), to: today },
  { label: '90d', value: '90d', from: () => daysAgo(90), to: today },
  { label: '1y', value: '1y', from: () => daysAgo(365), to: today },
  { label: 'All', value: 'all', from: () => '2024-01-01', to: today },
];

export default function TimeRangeFilter({ from, to, range, onRangeChange }: Props) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      {/* Preset buttons — scrollable row on mobile */}
      <Box
        sx={{
          display: 'flex',
          gap: 0.75,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          pb: 0.5,
          mx: { xs: -0.5, sm: 0 },
          px: { xs: 0.5, sm: 0 },
          // Hide scrollbar
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {PRESETS.map(p => (
          <Button
            key={p.value}
            size="small"
            variant={range === p.value ? 'contained' : 'outlined'}
            onClick={() => onRangeChange(p.value, p.from(), p.to())}
            sx={{
              borderRadius: 2,
              minWidth: 40,
              flexShrink: 0,
              fontWeight: range === p.value ? 700 : 400,
              ...(range === p.value && {
                background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)',
                border: 'none',
              }),
            }}
          >
            {p.label}
          </Button>
        ))}
      </Box>
      {/* Custom date range */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="body2" color="text.secondary">Custom:</Typography>
        <TextField
          type="date"
          size="small"
          value={from}
          onChange={e => onRangeChange('custom', e.target.value, to)}
          sx={{ width: { xs: 130, sm: 140 }, flex: { xs: '1 1 120px', sm: '0 0 140px' } }}
          InputLabelProps={{ shrink: true }}
        />
        <Typography variant="body2" color="text.secondary">–</Typography>
        <TextField
          type="date"
          size="small"
          value={to}
          onChange={e => onRangeChange('custom', from, e.target.value)}
          sx={{ width: { xs: 130, sm: 140 }, flex: { xs: '1 1 120px', sm: '0 0 140px' } }}
          InputLabelProps={{ shrink: true }}
        />
      </Box>
    </Box>
  );
}

export { daysAgo, today, yearStart };
