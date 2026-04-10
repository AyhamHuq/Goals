import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar, Box, Typography, useTheme } from '@mui/material';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import InfoRoundedIcon from '@mui/icons-material/InfoRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import { alpha } from '@mui/material/styles';

type Severity = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  message: string;
  severity?: Severity;
  duration?: number;
}

interface ToastContextValue {
  showToast: (opts: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

const TOAST_ICONS: Record<Severity, React.ReactNode> = {
  success: <CheckCircleRoundedIcon sx={{ fontSize: 18 }} />,
  error: <ErrorRoundedIcon sx={{ fontSize: 18 }} />,
  info: <InfoRoundedIcon sx={{ fontSize: 18 }} />,
  warning: <WarningRoundedIcon sx={{ fontSize: 18 }} />,
};

const TOAST_COLORS: Record<Severity, string> = {
  success: '#00C9A7',
  error: '#EF5350',
  info: '#6C5CE7',
  warning: '#FFB830',
};

function CustomToast({ message, severity = 'success', onClose }: ToastOptions & { onClose: () => void }) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const color = TOAST_COLORS[severity];
  const icon = TOAST_ICONS[severity];

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        px: 2,
        py: 1.25,
        borderRadius: '100px',
        background: isDark
          ? `rgba(20, 20, 30, 0.95)`
          : `rgba(255, 255, 255, 0.97)`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${alpha(color, 0.25)}`,
        borderLeft: `3px solid ${color}`,
        boxShadow: `0 8px 32px rgba(0,0,0,${isDark ? 0.5 : 0.12}), 0 0 0 1px ${alpha(color, 0.08)}`,
        maxWidth: 320,
        cursor: 'pointer',
        animation: 'slideInTop 250ms cubic-bezier(0.2,0.8,0.2,1) both',
        '@keyframes slideInTop': {
          from: { opacity: 0, transform: 'translateY(-16px) scale(0.96)' },
          to: { opacity: 1, transform: 'translateY(0) scale(1)' },
        },
      }}
      onClick={onClose}
    >
      <Box sx={{ color, flexShrink: 0, display: 'flex' }}>
        {icon}
      </Box>
      <Typography
        variant="body2"
        fontWeight={600}
        sx={{ color: isDark ? 'rgba(255,255,255,0.9)' : '#1A1A2E', letterSpacing: '-0.01em', lineHeight: 1.35 }}
      >
        {message}
      </Typography>
    </Box>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ToastOptions>({ message: '', severity: 'success' });

  const showToast = useCallback((o: ToastOptions) => {
    setOpts(o);
    setOpen(true);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={opts.duration ?? 3000}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          top: {
            xs: 'calc(env(safe-area-inset-top, 0px) + 16px) !important',
            sm: '16px !important',
          },
        }}
      >
        <Box>
          <CustomToast {...opts} onClose={() => setOpen(false)} />
        </Box>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
