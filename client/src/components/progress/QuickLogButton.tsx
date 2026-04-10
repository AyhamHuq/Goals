import React, { useState } from 'react';
import Button from '@mui/material/Button';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { GoalWithProgress } from '../../types';
import ProgressLogDialog from './ProgressLogDialog';

interface QuickLogButtonProps {
  goal: GoalWithProgress & { id: string };
  onLog?: () => void;
  accentColor?: string;
  accentGradient?: string;
}

export default function QuickLogButton({ goal, onLog, accentColor, accentGradient }: QuickLogButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="contained"
        size="small"
        startIcon={<AddRoundedIcon sx={{ fontSize: '17px !important' }} />}
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        sx={{
          py: 0.7,
          px: 1.75,
          minHeight: 36,
          fontWeight: 700,
          fontSize: '0.78rem',
          borderRadius: '100px',
          letterSpacing: '0',
          ...(accentGradient
            ? {
                background: accentGradient,
                boxShadow: `0 3px 10px ${accentColor}55`,
                '&:hover': {
                  background: accentGradient,
                  boxShadow: `0 5px 16px ${accentColor}66`,
                  filter: 'brightness(1.08)',
                },
              }
            : {}),
        }}
      >
        {goal.goal_type === 'measurement' ? 'Log Measurement' : 'Log Progress'}
      </Button>
      <ProgressLogDialog
        open={open}
        onClose={() => {
          setOpen(false);
          onLog?.();
        }}
        goal={goal}
      />
    </>
  );
}
