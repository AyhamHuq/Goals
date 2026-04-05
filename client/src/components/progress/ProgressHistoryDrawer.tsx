import React, { useState } from 'react';
import {
  Drawer,
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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import { GoalWithProgress, ProgressEntry } from '../../types';
import { useProgress, useUpdateProgress, useDeleteProgress } from '../../hooks/useProgress';
import { useToast } from '../Toast';
import { formatLoggedFor } from '../../utils/dates';
import { getMonthlyLabel } from '../../utils/frequency';

interface ProgressHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  goal: GoalWithProgress & { id: string };
  readOnly?: boolean;
}

function EditRow({
  entry,
  unit,
  onSave,
  onCancel,
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
        <CheckIcon fontSize="small" />
      </IconButton>
      <IconButton size="small" onClick={onCancel}>
        <CancelIcon fontSize="small" />
      </IconButton>
    </Stack>
  );
}

export default function ProgressHistoryDrawer({ open, onClose, goal, readOnly = false }: ProgressHistoryDrawerProps) {
  const { data: entries = [], isLoading } = useProgress(open ? goal.id : undefined);
  const updateProgress = useUpdateProgress();
  const deleteProgress = useDeleteProgress();
  const { showToast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSave = async (id: string, value: number, note: string) => {
    if (isNaN(value) || value <= 0) return;
    try {
      await updateProgress.mutateAsync({
        id,
        data: { value, note: note.trim() || undefined },
      });
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

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: '70vh',
          },
        }}
      >
        {/* Handle bar */}
        <Box display="flex" justifyContent="center" pt={1} pb={0.5}>
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: 2,
              bgcolor: 'grey.300',
            }}
          />
        </Box>

        <Box sx={{ px: 2, pb: 2 }}>
          {/* Header */}
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
            <Box flex={1} mr={1} minWidth={0}>
              <Typography variant="h6" noWrap>
                {(() => {
                  const base = getMonthlyLabel(goal);
                  return goal.category ? `${goal.category.name}: ${base}` : base;
                })()}
              </Typography>
              {goal.title && (
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {goal.title}
                </Typography>
              )}
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />

          {isLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress size={28} />
            </Box>
          ) : entries.length === 0 ? (
            <Box py={4} textAlign="center">
              <Typography color="text.secondary" variant="body2">
                No entries yet — log your first progress above.
              </Typography>
            </Box>
          ) : (
            <List dense sx={{ overflow: 'auto' }}>
              {entries.map((entry) => (
                <React.Fragment key={entry.id}>
                  <ListItem disableGutters alignItems="flex-start" sx={{ py: 1 }}>
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
                        {/* Date on left */}
                        <Box flex={1} minWidth={0}>
                          <Box display="flex" alignItems="baseline" gap={1.5}>
                            <Typography variant="body2" fontWeight={700} sx={{ minWidth: 80 }}>
                              {formatLoggedFor(entry.logged_for)}
                            </Typography>
                            <Typography variant="body2" color="text.primary" fontWeight={600}>
                              {entry.value} {goal.unit}
                            </Typography>
                          </Box>
                          {entry.note && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              display="block"
                              sx={{ mt: 0.25 }}
                            >
                              {entry.note}
                            </Typography>
                          )}
                        </Box>
                        {/* Actions on right */}
                        {!readOnly && (
                          <Box display="flex" gap={0.25}>
                            <IconButton size="small" onClick={() => setEditingId(entry.id)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteConfirmId(entry.id)}
                            >
                              <DeleteIcon fontSize="small" />
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

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} maxWidth="xs">
        <DialogTitle>Delete entry?</DialogTitle>
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
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
