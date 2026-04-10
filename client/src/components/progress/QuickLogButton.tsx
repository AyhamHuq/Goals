import React, { useState } from 'react';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import { GoalWithProgress } from '../../types';
import ProgressLogDialog from './ProgressLogDialog';

interface QuickLogButtonProps {
  goal: GoalWithProgress & { id: string };
  onLog?: () => void;
}

export default function QuickLogButton({ goal, onLog }: QuickLogButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="contained"
        size="medium"
        startIcon={<AddIcon />}
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        sx={{ mt: 1.5, py: 1, minHeight: 44, fontWeight: 600, borderRadius: 2 }}
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
