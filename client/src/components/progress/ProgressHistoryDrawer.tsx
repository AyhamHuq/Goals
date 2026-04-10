import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  TextField,
  Button,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Drawer,
  useTheme,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import { alpha } from '@mui/material/styles';
import { GoalWithProgress, ProgressEntry } from '../../types';
import { useProgress, useUpdateProgress, useDeleteProgress } from '../../hooks/useProgress';
import { useDeleteGoal } from '../../hooks/useGoals';
import { useToast } from '../Toast';
import { formatLoggedFor } from '../../utils/dates';
import { getMonthlyLabel } from '../../utils/frequency';
import GoalFormDialog from '../goals/GoalFormDialog';
import Sparkline from '../shared/Sparkline';

interface ProgressHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  goal: GoalWithProgress & { id: string };
  readOnly?: boolean;
}

function EditRow({
  entry, unit, onSave, onCancel,
}: {
  entry: ProgressEntry;
  unit: string;
  onSave: (id: string, value: number, note: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(String(entry.value));
  const [note, setNote] = useState(entry.note ?? '');
  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ py: 1 }}>
      <TextField
        size="small"
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        label={unit}
        sx={{ width: 100 }}
        inputProps={{ step: 'any' }}
      />
      <TextField
        size="small"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        label="Note"
        sx={{ flex: 1, minWidth: 120 }}
      />
      <IconButton size="small" color="primary" onClick={() => onSave(entry.id, parseFloat(val), note)}>
        <CheckRoundedIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={onCancel}>
        <CancelRoundedIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}

export default function ProgressHistoryDrawer({ open, onClose, goal, readOnly = false }: ProgressHistoryDrawerProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { data: entries = [], isLoading } = useProgress(open ? goal.id : undefined);
  const updateProgress = useUpdateProgress();
  const deleteProgress = useDeleteProgress();
  const deleteGoal = useDeleteGoal();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editGoalOpen, setEditGoalOpen] = useState(false);
  const [deleteGoalConfirm, setDeleteGoalConfirm] = useState(false);

  const handleSave = async (id: string, value: number, note: string) => {
    if (isNaN(value) || value <= 0) return;
    try {
      await updateProgress.mutateAsync({ id, data: { value, note: note.trim() || undefined } });
      showToast({ message: 'Entry updated!', severity: 'success' });
    } catch {
      showToast({ message: 'Failed to update entry.', severity: 'error' });
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProgress.mutateAsync(id);
      showToast({ message: 'Entry deleted.', severity: 'info' });
    } catch {
      showToast({ message: 'Failed to delete entry.', severity: 'error' });
    }
    setDeleteConfirmId(null);
  };

  // Sparkline data from entries
  const sparklineData = entries
    .slice()
    .reverse()
    .map((e) => Number(e.value));

  const goalTitle = (() => {
    const base = getMonthlyLabel(goal);
    return goal.category ? `${goal.category.name}: ${base}` : base;
  })();

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            maxHeight: '88vh',
            pb: 'env(safe-area-inset-bottom, 0px)',
            backgroundImage: 'none',
          },
        }}
      >
        {/* Handle */}
        <Box display="flex" justifyContent="center" pt={1.25} pb={0.5}>
          <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: 'divider' }} />
        </Box>

        <Box sx={{ px: 2, pb: 2, overflow: 'auto', flex: 1 }}>
          {/* Header */}
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
            <Box flex={1} mr={1} minWidth={0}>
              <Typography variant="h6" fontWeight={800} noWrap sx={{ letterSpacing: '-0.02em' }}>
                {goalTitle}
              </Typography>
              {goal.title && (
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {goal.title}
                </Typography>
              )}
            </Box>
            <Box display="flex" gap={0.5}>
              {!readOnly && (
                <>
                  <IconButton size="small" onClick={() => setEditGoalOpen(true)} aria-label="Edit goal" sx={{ color: 'text.secondary' }}>
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setDeleteGoalConfirm(true)} aria-label="Delete goal">
                    <DeleteRoundedIcon fontSize="small" />
                  </IconButton>
                </>
              )}
              <IconButton onClick={onClose} size="small" sx={{ color: 'text.secondary' }}>
                <CloseRoundedIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Sparkline chart */}
          {sparklineData.length >= 2 && (
            <Box
              sx={{
                mb: 2,
                p: 1.5,
                borderRadius: '16px',
                bgcolor: isDark ? alpha('#6C5CE7', 0.08) : alpha('#6C5CE7', 0.05),
                border: `1px solid ${alpha('#6C5CE7', 0.12)}`,
              }}
            >
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.75} sx={{ textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.62rem' }}>
                Progress trend
              </Typography>
              <Sparkline
                data={sparklineData}
                width={280}
                height={48}
                color="#6C5CE7"
                filled
              />
            </Box>
          )}

          <Divider sx={{ mb: 1 }} />

          {isLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={28} />
            </Box>
          ) : entries.length === 0 ? (
            <Box py={4} textAlign="center">
              <Typography color="text.secondary" variant="body2" fontWeight={500}>
                No entries yet — log your first progress above.
              </Typography>
            </Box>
          ) : (
            <List dense sx={{ overflow: 'auto' }}>
              {entries.map((entry) => (
                <React.Fragment key={entry.id}>
                  <ListItem disableGutters alignItems="flex-start" sx={{ py: 1.25 }}>
                    {editingId === entry.id ? (
                      <Box width="100%">
                        <EditRow
                          entry={entry}
                          unit={goal.unit}
                          onSave={handleSave}
                          onCancel={() => setEditingId(null)}
                        />
                      </Box>
                    ) : (
                      <Box display="flex" alignItems="flex-start" width="100%">
                        <Box flex={1} minWidth={0}>
                          <Box display="flex" alignItems="baseline" gap={1.5}>
                            <Typography variant="body2" fontWeight={700} sx={{ minWidth: 80, letterSpacing: '-0.01em' }}>
                              {formatLoggedFor(entry.logged_for)}
                            </Typography>
                            <Typography variant="body2" fontWeight={600} sx={{ color: '#6C5CE7' }}>
                              {entry.logged_unit && entry.logged_unit !== goal.unit && entry.logged_value !== null
                                ? `${entry.logged_value} ${entry.logged_unit} (${entry.value} ${goal.unit})`
                                : `${entry.value} ${goal.unit}`
                              }
                            </Typography>
                          </Box>
                          {entry.note && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              sx={{ mt: 0.2 }}
                            >
                              {entry.note}
                            </Typography>
                          )}
                        </Box>
                        {!readOnly && (
                          <Box display="flex" gap={0.25}>
                            <IconButton
                              size="small"
                              onClick={() => setEditingId(entry.id)}
                              sx={{ minWidth: 36, minHeight: 36, color: 'text.secondary' }}
                            >
                              <EditRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteConfirmId(entry.id)}
                              sx={{ minWidth: 36, minHeight: 36 }}
                            >
                              <DeleteRoundedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        )}
                      </Box>
                    )}
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </Box>
      </Drawer>

      {/* Delete entry confirm */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Delete entry?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This progress entry will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            disabled={deleteProgress.isPending}
            sx={{ borderRadius: 2.5 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit goal */}
      {!readOnly && (
        <GoalFormDialog
          open={editGoalOpen}
          onClose={() => setEditGoalOpen(false)}
          goal={{
            id: goal.id,
            user_id: goal.user_id,
            category_id: goal.category_id,
            period_key: goal.period_key,
            title: goal.title,
            target_value: goal.target_value,
            unit: goal.unit,
            frequency_type: goal.frequency_type,
            goal_type: goal.goal_type,
            start_value: goal.start_value,
            is_archived: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }}
          userId={goal.user_id}
          periodKey={goal.period_key}
        />
      )}

      {/* Delete goal confirm */}
      {!readOnly && (
        <Dialog open={deleteGoalConfirm} onClose={() => setDeleteGoalConfirm(false)} maxWidth="xs">
          <DialogTitle sx={{ fontWeight: 800 }}>Delete goal?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              This goal and all its progress entries will be permanently deleted. This cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteGoalConfirm(false)}>Cancel</Button>
            <Button
              color="error"
              variant="contained"
              sx={{ borderRadius: 2.5 }}
              onClick={async () => {
                try {
                  await deleteGoal.mutateAsync(goal.id);
                  showToast({ message: 'Goal deleted.', severity: 'info' });
                  setDeleteGoalConfirm(false);
                  onClose();
                } catch {
                  showToast({ message: 'Failed to delete goal.', severity: 'error' });
                }
              }}
              disabled={deleteGoal.isPending}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}
