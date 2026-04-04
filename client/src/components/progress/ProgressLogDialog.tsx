import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import { GoalWithProgress } from '../../types';
import { useCreateProgress } from '../../hooks/useProgress';

interface ProgressLogDialogProps {
  open: boolean;
  onClose: () => void;
  goal: GoalWithProgress & { id: string };
}

export default function ProgressLogDialog({ open, onClose, goal }: ProgressLogDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const today = format(new Date(), 'yyyy-MM-dd');

  const [value, setValue] = useState<string>('');
  const [loggedFor, setLoggedFor] = useState<string>(today);
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');

  const createProgress = useCreateProgress();

  const handleClose = () => {
    setValue('');
    setLoggedFor(today);
    setNote('');
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      setError('Enter a valid positive number');
      return;
    }
    setError('');
    await createProgress.mutateAsync({
      goal_id: goal.id,
      value: num,
      logged_for: loggedFor,
      note: note.trim() || undefined,
    });
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullScreen={fullScreen} maxWidth="xs" fullWidth>
      <DialogTitle>Log Progress — {goal.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label={`Value (${goal.unit})`}
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            error={!!error}
            helperText={error}
            autoFocus
            inputProps={{ min: 0, step: 'any' }}
            fullWidth
          />
          <TextField
            label="Date"
            type="date"
            value={loggedFor}
            onChange={(e) => setLoggedFor(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            rows={2}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={createProgress.isPending}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
