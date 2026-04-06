import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';
import { User } from '../types';
import { useUpdatePreferences } from '../hooks/useUsers';

interface Props {
  open: boolean;
  onClose: () => void;
  user: User;
}

const HOUR_OPTIONS = Array.from({ length: 17 }, (_, i) => i + 6); // 6am–10pm

function hourLabel(h: number): string {
  const ampm = h < 12 ? 'AM' : 'PM';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:00 ${ampm}`;
}

export default function NotificationSettings({ open, onClose, user }: Props) {
  const [phone, setPhone] = useState(user.phone ?? '');
  const [enabled, setEnabled] = useState(user.sms_reminders_enabled);
  const [hour, setHour] = useState(user.reminder_hour);

  // Sync when user prop changes (e.g., after save)
  useEffect(() => {
    setPhone(user.phone ?? '');
    setEnabled(user.sms_reminders_enabled);
    setHour(user.reminder_hour);
  }, [user]);

  const { mutate, isPending } = useUpdatePreferences();

  function handleSave() {
    mutate(
      {
        id: user.id,
        prefs: {
          phone: phone.trim() || null,
          sms_reminders_enabled: enabled,
          reminder_hour: hour,
        },
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Notification Settings</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2.5} pt={1}>
          <TextField
            label="Phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+15551234567"
            size="small"
            helperText="Include country code, e.g. +1 for US"
          />

          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                color="primary"
              />
            }
            label="SMS reminders"
          />

          {enabled && (
            <>
              <FormControl size="small">
                <InputLabel>Reminder time</InputLabel>
                <Select
                  value={hour}
                  label="Reminder time"
                  onChange={(e) => setHour(Number(e.target.value))}
                >
                  {HOUR_OPTIONS.map((h) => (
                    <MenuItem key={h} value={h}>
                      {hourLabel(h)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">
                You'll get a reminder if you haven't logged any progress by this time.
              </Typography>
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isPending}
          startIcon={isPending ? <CircularProgress size={16} /> : null}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
