import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Switch,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { User } from '../types';
import { useUpdatePreferences } from '../hooks/useUsers';
import { getVapidPublicKey, subscribeUser, unsubscribeUser } from '../api/push';
import { subscribeToPush, unsubscribeFromPush } from '../utils/pushNotifications';

interface Props {
  open: boolean;
  onClose: () => void;
  user: User;
}

const HOUR_OPTIONS = Array.from({ length: 17 }, (_, i) => i + 6);

function hourLabel(h: number): string {
  const ampm = h < 12 ? 'AM' : 'PM';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:00 ${ampm}`;
}

export default function NotificationSettings({ open, onClose, user }: Props) {
  const [enabled, setEnabled] = useState(user.push_reminders_enabled);
  const [hour, setHour] = useState(user.reminder_hour);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    setEnabled(user.push_reminders_enabled);
    setHour(user.reminder_hour);
  }, [user]);

  const { mutate, isPending } = useUpdatePreferences();

  async function handleToggle(checked: boolean) {
    if (toggling) return;
    setToggling(true);
    setPermissionDenied(false);

    try {
      const swReg = await navigator.serviceWorker?.ready;
      if (!swReg) return;

      if (checked) {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          setPermissionDenied(true);
          setToggling(false);
          return;
        }
        const vapidKey = await getVapidPublicKey();
        const subscription = await subscribeToPush(swReg, vapidKey);
        if (!subscription) {
          setToggling(false);
          return;
        }
        await subscribeUser(user.id, subscription);
        setEnabled(true);
        mutate({ id: user.id, prefs: { push_reminders_enabled: true, reminder_hour: hour } });
      } else {
        const subscription = await swReg.pushManager.getSubscription();
        if (subscription) {
          await unsubscribeFromPush(swReg);
          await unsubscribeUser(subscription.endpoint);
        }
        setEnabled(false);
        mutate({ id: user.id, prefs: { push_reminders_enabled: false } });
      }
    } catch (err) {
      console.error('[NotificationSettings] Toggle failed:', err);
    } finally {
      setToggling(false);
    }
  }

  function handleSave() {
    mutate({ id: user.id, prefs: { reminder_hour: hour } }, { onSuccess: onClose });
  }

  const pushSupported =
    'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Notification Settings</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2.5} pt={1}>
          {!pushSupported && (
            <Alert severity="warning">
              Push notifications require adding this app to your home screen on iOS.
            </Alert>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                onChange={(e) => handleToggle(e.target.checked)}
                color="primary"
                disabled={toggling || !pushSupported}
              />
            }
            label="Daily push reminders"
          />

          {permissionDenied && (
            <Typography variant="caption" color="error">
              Notification permission was denied. To re-enable, go to your browser or iOS Settings
              and allow notifications for this site.
            </Typography>
          )}

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
        <Button onClick={onClose} disabled={isPending || toggling}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isPending || toggling}
          startIcon={isPending ? <CircularProgress size={16} /> : null}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
