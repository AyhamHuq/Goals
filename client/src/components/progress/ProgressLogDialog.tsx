import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Stack,
  IconButton,
  Typography,
  CircularProgress,
  Box,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import { alpha } from '@mui/material/styles';
import { GoalWithProgress } from '../../types';
import { useCreateProgress } from '../../hooks/useProgress';
import { useToast } from '../Toast';
import { getUnitsForCategory, convertUnit } from '../../constants/unitConversions';
import { usePeriodContext } from '../../context/PeriodContext';
import { formatDayLabel } from '../../utils/dates';
import BottomSheet from '../shared/BottomSheet';
import { getMonthlyLabel } from '../../utils/frequency';

interface ProgressLogDialogProps {
  open: boolean;
  onClose: () => void;
  goal: GoalWithProgress & { id: string };
}

// Quick value suggestions by unit
const QUICK_VALUES: Record<string, number[]> = {
  minutes: [15, 30, 45, 60],
  mins: [15, 30, 45, 60],
  hours: [0.5, 1, 1.5, 2],
  km: [1, 2, 5, 10],
  miles: [1, 2, 3, 5],
  pages: [10, 20, 30, 50],
  books: [1],
  sessions: [1, 2, 3],
};

function getQuickValues(unit: string): number[] {
  const key = unit.toLowerCase();
  return QUICK_VALUES[key] ?? [];
}

export default function ProgressLogDialog({ open, onClose, goal }: ProgressLogDialogProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { showToast } = useToast();
  const { selectedDay } = usePeriodContext();

  const [value, setValue] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [logUnit, setLogUnit] = useState<string>(goal.unit);

  const availableUnits = goal.category ? getUnitsForCategory(goal.category.name) : [];
  const quickValues = getQuickValues(logUnit);

  const createProgress = useCreateProgress();

  useEffect(() => {
    if (open) {
      setValue('');
      setNote('');
      setError('');
      setLogUnit(goal.unit);
    }
  }, [open, goal.unit]);

  const handleClose = () => {
    setValue('');
    setNote('');
    setError('');
    setLogUnit(goal.unit);
    onClose();
  };

  const handleSubmit = async () => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) {
      setError('Enter a valid positive number');
      return;
    }
    setError('');

    let submittedValue = num;
    let loggedUnitPayload: string | undefined;
    let loggedValuePayload: number | undefined;

    if (logUnit !== goal.unit) {
      submittedValue = convertUnit(num, logUnit, goal.unit, goal.category?.name ?? '');
      loggedUnitPayload = logUnit;
      loggedValuePayload = num;
    }

    try {
      await createProgress.mutateAsync({
        goal_id: goal.id,
        value: submittedValue,
        logged_for: selectedDay,
        note: note.trim() || undefined,
        logged_unit: loggedUnitPayload,
        logged_value: loggedValuePayload,
      });
      showToast({ message: goal.goal_type === 'measurement' ? 'Measurement logged!' : 'Progress logged! 🎉', severity: 'success' });
      handleClose();
    } catch {
      showToast({ message: 'Failed to log progress. Try again.', severity: 'error' });
    }
  };

  const displayTitle = goal.title || getMonthlyLabel(goal);

  const content = (
    <>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box flex={1} mr={1} minWidth={0}>
          <Typography variant="h6" fontWeight={800} noWrap sx={{ letterSpacing: '-0.02em', maxWidth: 260 }}>
            {displayTitle}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Logging for <strong>{formatDayLabel(selectedDay)}</strong>
          </Typography>
        </Box>
        <IconButton size="small" onClick={handleClose} sx={{ color: 'text.secondary' }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: '12px !important' }}>
        <Stack spacing={2.5}>
          {/* Unit pills — above value input when multiple units available */}
          {availableUnits.length > 1 && (
            <Box display="flex" gap={1} flexWrap="wrap">
              {availableUnits.map((u) => (
                <Box
                  key={u}
                  onClick={() => setLogUnit(u)}
                  sx={{
                    px: 1.75,
                    py: 0.6,
                    borderRadius: '100px',
                    border: '1.5px solid',
                    borderColor: logUnit === u ? 'primary.main' : 'divider',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: logUnit === u ? 700 : 500,
                    color: logUnit === u ? 'primary.main' : 'text.secondary',
                    transition: 'all 0.15s ease',
                    '&:active': { transform: 'scale(0.93)' },
                  }}
                >
                  {u}
                </Box>
              ))}
            </Box>
          )}

          {/* Full-width value input */}
          <Box>
            <TextField
              label={goal.goal_type === 'measurement' ? `Current ${logUnit}` : `Value (${logUnit})`}
              type="number"
              value={value}
              onChange={(e) => { setValue(e.target.value); if (error) setError(''); }}
              error={!!error}
              helperText={error}
              autoFocus
              inputProps={{
                min: 0,
                step: 'any',
                style: { textAlign: 'center', fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', paddingTop: 18, paddingBottom: 18 },
              }}
              fullWidth
              size="medium"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
            />

            {/* Unit conversion helper */}
            {logUnit !== goal.unit && value && !isNaN(parseFloat(value)) && parseFloat(value) > 0 && (
              <Typography variant="caption" color="text.secondary" display="block" mt={0.75} textAlign="center">
                = {convertUnit(parseFloat(value), logUnit, goal.unit, goal.category?.name ?? '').toFixed(2)} {goal.unit} stored
              </Typography>
            )}

            {/* Measurement helper */}
            {goal.goal_type === 'measurement' && goal.start_value != null && (
              <Typography variant="caption" color="text.secondary" display="block" mt={0.5} textAlign="center">
                Started at {goal.start_value} {goal.unit} · Goal: {goal.target_value} {goal.unit}
              </Typography>
            )}
          </Box>

          {/* Quick value pills */}
          {quickValues.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1} sx={{ textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.65rem' }}>
                Quick add
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {quickValues.map((qv) => (
                  <Box
                    key={qv}
                    onClick={() => setValue(String(Number(value || 0) + qv))}
                    sx={{
                      px: 2,
                      py: 0.75,
                      borderRadius: '100px',
                      border: '1.5px solid',
                      borderColor: 'divider',
                      cursor: 'pointer',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: 'primary.main',
                      bgcolor: isDark ? alpha('#6C5CE7', 0.1) : alpha('#6C5CE7', 0.06),
                      transition: 'all 0.12s ease',
                      '&:hover': { borderColor: 'primary.main', bgcolor: alpha('#6C5CE7', 0.12) },
                      '&:active': { transform: 'scale(0.93)' },
                    }}
                  >
                    +{qv}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Note */}
          <TextField
            label="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            multiline
            maxRows={3}
            rows={2}
            placeholder="Optional note…"
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 1.5 }}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          fullWidth
          size="large"
          disabled={createProgress.isPending}
          startIcon={
            createProgress.isPending
              ? <CircularProgress size={16} color="inherit" />
              : <CheckRoundedIcon />
          }
          sx={{ py: 1.6, fontSize: '1rem', borderRadius: 3, minHeight: 54 }}
        >
          {goal.goal_type === 'measurement' ? 'Log Measurement' : 'Log Progress'}
        </Button>
      </DialogActions>
    </>
  );

  return (
    <BottomSheet open={open} onClose={handleClose} maxWidth="xs">
      {content}
    </BottomSheet>
  );
}
