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
        variant="outlined"
        size="small"
        startIcon={<AddIcon />}
        onClick={() => setOpen(true)}
        sx={{ mt: 1 }}
      >
        Log Progress
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
