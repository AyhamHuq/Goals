import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
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
import { formatLoggedFor } from '../../utils/dates';

interface ProgressHistoryDrawerProps {
  open: boolean;
  onClose: () => void;
  goal: GoalWithProgress & { id: string };
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

export default function ProgressHistoryDrawer({ open, onClose, goal }: ProgressHistoryDrawerProps) {
  const { data: entries = [], isLoading } = useProgress(open ? goal.id : undefined);
  const updateProgress = useUpdateProgress();
  const deleteProgress = useDeleteProgress();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSave = async (id: string, value: number, note: string) => {
    if (isNaN(value) || value <= 0) return;
    await updateProgress.mutateAsync({
      id,
      data: { value, note: note.trim() || undefined },
    });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteProgress.mutateAsync(id);
    setDeleteConfirmId(null);
  };

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        PaperProps={{ sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16, maxHeight: '70vh' } }}
      >
        <Box sx={{ p: 2 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
            <Typography variant="h6">{goal.title} — History</Typography>
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
            <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              No progress logged yet.
            </Typography>
          ) : (
            <List dense sx={{ overflow: 'auto' }}>
              {entries.map((entry) => (
                <React.Fragment key={entry.id}>
                  <ListItem disableGutters alignItems="flex-start">
                    {editingId === entry.id ? (
                      <EditRow
                        entry={entry}
                        unit={goal.unit}
                        onSave={handleSave}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <>
                        <ListItemText
                          primary={`${entry.value} ${goal.unit}`}
                          secondary={`${formatLoggedFor(entry.logged_for)}${entry.note ? ` — ${entry.note}` : ''}`}
                        />
                        <ListItemSecondaryAction>
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
                        </ListItemSecondaryAction>
                      </>
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
          <Typography>This progress entry will be permanently deleted.</Typography>
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
