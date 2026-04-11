import React, { useState, useEffect } from 'react';
import {
  Button,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
} from '@mui/material';
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded';
import NotificationsOffRoundedIcon from '@mui/icons-material/NotificationsOffRounded';
import { alpha } from '@mui/material/styles';
import { User } from '../types';
import { useUpdatePreferences } from '../hooks/useUsers';
import { getVapidPublicKey, subscribeUser, unsubscribeUser } from '../api/push';
import { subscribeToPush, unsubscribeFromPush } from '../utils/pushNotifications';
import BottomSheet from './shared/BottomSheet';

interface Props {
  open: boolean;
  onClose: () => void;
  user: User;
}

export default function NotificationSettings({ open, onClose, user }: Props) {
  const [enabled, setEnabled] = useState(user.push_reminders_enabled);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    setEnabled(user.push_reminders_enabled);
  }, [user]);

  const { mutate } = useUpdatePreferences();

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
        if (!subscription) { setToggling(false); return; }
        await subscribeUser(user.id, subscription);
        setEnabled(true);
        mutate({ id: user.id, prefs: { push_reminders_enabled: true } });
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

  const pushSupported =
    'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

  return (
    <BottomSheet open={open} onClose={onClose} maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
        Notifications
      </DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2.5} pt={0.5}>
          {/* Status card */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              p: 2,
              borderRadius: '16px',
              bgcolor: enabled
                ? alpha('#00C9A7', 0.08)
                : alpha('#6B7280', 0.07),
              border: `1px solid ${enabled ? alpha('#00C9A7', 0.2) : alpha('#6B7280', 0.12)}`,
            }}
          >
            <Box sx={{ color: enabled ? '#00C9A7' : 'text.secondary', fontSize: 28 }}>
              {enabled ? <NotificationsRoundedIcon /> : <NotificationsOffRoundedIcon />}
            </Box>
            <Box flex={1}>
              <Typography variant="body2" fontWeight={700} color={enabled ? '#00C9A7' : 'text.secondary'}>
                {enabled ? 'Reminders on' : 'Reminders off'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {enabled
                  ? 'Reminders at 3 PM, 8 PM, and 10 PM if not logged'
                  : "You won't get daily reminders"}
              </Typography>
            </Box>
          </Box>

          {!pushSupported && (
            <Alert severity="warning" sx={{ borderRadius: 2 }}>
              Push notifications require adding this app to your home screen on iOS.
            </Alert>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                onChange={(e) => handleToggle(e.target.checked)}
                disabled={toggling || !pushSupported}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>Daily push reminders</Typography>
                <Typography variant="caption" color="text.secondary">
                  You'll get reminders at 3 PM, 8 PM, and 10 PM if your day isn't logged
                </Typography>
              </Box>
            }
          />

          {permissionDenied && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              Notification permission denied. Enable in your browser or iOS Settings.
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 1 }}>
        <Button onClick={onClose} disabled={toggling} sx={{ borderRadius: 2.5 }}>
          Close
        </Button>
      </DialogActions>
    </BottomSheet>
  );
}
