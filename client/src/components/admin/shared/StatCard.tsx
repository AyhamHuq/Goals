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
        <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500} gutterBottom noWrap>
            {label}
          </Typography>
          {loading ? (
            <Skeleton width={60} height={32} />
          ) : (
            <Typography
              variant="h4"
              fontWeight={700}
              lineHeight={1}
              sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
              noWrap
            >
              {value ?? '—'}
            </Typography>
          )}
          {subtext && !loading && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }} noWrap>
              {subtext}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            width: { xs: 36, sm: 44 }, height: { xs: 36, sm: 44 }, borderRadius: 2,
            background: `${color}22`,
            display: { xs: 'none', sm: 'flex' }, alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon sx={{ color, fontSize: 22 }} />
        </Box>
      </Box>
    </Paper>
  );
}
