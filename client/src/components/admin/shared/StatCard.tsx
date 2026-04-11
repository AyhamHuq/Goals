import React from 'react';
import { Box, Paper, Typography, Skeleton } from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';

interface Props {
  label: string;
  value: string | number | undefined;
  icon: SvgIconComponent;
  color: string;
  subtext?: string;
  loading?: boolean;
}

export default function StatCard({ label, value, icon: Icon, color, subtext, loading }: Props) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: 3,
          background: color,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom>
            {label}
          </Typography>
          {loading ? (
            <Skeleton width={80} height={36} />
          ) : (
            <Typography variant="h4" fontWeight={700} lineHeight={1}>
              {value ?? '—'}
            </Typography>
          )}
          {subtext && !loading && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {subtext}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: 44, height: 44, borderRadius: 2,
            background: `${color}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon sx={{ color, fontSize: 22 }} />
        </Box>
      </Box>
    </Paper>
  );
}
