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
  IconButton,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { format } from 'date-fns';
import { GoalWithProgress } from '../../types';
import { useCreateProgress } from '../../hooks/useProgress';
import { useToast } from '../Toast';

interface ProgressLogDialogProps {
  open: boolean;
  onClose: () => void;
  goal: GoalWithProgress & { id: string };
}

export default function ProgressLogDialog({ open, onClose, goal }: ProgressLogDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { showToast } = useToast();
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
    try {
      await createProgress.mutateAsync({
        goal_id: goal.id,
        value: num,
        logged_for: loggedFor,
        note: note.trim() || undefined,
      });
      showToast({ message: 'Progress logged! 🎉', severity: 'success' });
      handleClose();
    } catch {
      showToast({ message: 'Failed to log progress. Try again.', severity: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullScreen={fullScreen} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography
          variant="h6"
          noWrap
          sx={{ flex: 1, mr: 1, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis' }}
          title={goal.title}
        >
          {goal.title}
        </Typography>
        <IconButton size="small" onClick={handleClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          {/* Large centered value input */}
          <Box textAlign="center">
            <TextField
              label={`Value (${goal.unit})`}
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              error={!!error}
              helperText={error}
              autoFocus
              inputProps={{ min: 0, step: 'any', style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 700 } }}
              fullWidth
              size="medium"
            />
          </Box>

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
            maxRows={3}
            rows={2}
            placeholder="Optional note…"
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Box width="100%">
          <Button
            onClick={handleSubmit}
            variant="contained"
            fullWidth
            size="large"
            disabled={createProgress.isPending}
            startIcon={
              createProgress.isPending
                ? <CircularProgress size={16} color="inherit" />
                : <CheckIcon />
            }
          >
            Log Progress
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
