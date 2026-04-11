import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, TextField, Button, CircularProgress,
  InputAdornment, IconButton, Alert,
} from '@mui/material';
import { Visibility, VisibilityOff, AdminPanelSettings } from '@mui/icons-material';
import { adminAuth, checkAdminAuth } from '../../api/admin';

interface Props {
  children: React.ReactNode;
}

export default function AdminAuthGate({ children }: Props) {
  const [status, setStatus] = useState<'loading' | 'unauthenticated' | 'authenticated'>('loading');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const verify = useCallback(async () => {
    const ok = await checkAdminAuth();
    setStatus(ok ? 'authenticated' : 'unauthenticated');
  }, []);

  useEffect(() => { void verify(); }, [verify]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await adminAuth(pin);
      setStatus('authenticated');
    } catch {
      setError('Invalid PIN. Please try again.');
      setPin('');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (status === 'authenticated') {
    return <>{children}</>;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F0F14 0%, #1A1A2E 100%)',
        p: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
          borderRadius: 3,
          background: 'rgba(26, 26, 36, 0.95)',
          border: '1px solid rgba(108, 92, 231, 0.2)',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <AdminPanelSettings sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Admin Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your PIN to continue
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="PIN"
            type={showPin ? 'text' : 'password'}
            value={pin}
            onChange={e => setPin(e.target.value)}
            autoFocus
            sx={{ mb: 2 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPin(v => !v)} edge="end" size="small">
                    {showPin ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={!pin || submitting}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #6C5CE7, #a29bfe)',
              fontWeight: 700,
            }}
          >
            {submitting ? <CircularProgress size={22} color="inherit" /> : 'Access Dashboard'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
