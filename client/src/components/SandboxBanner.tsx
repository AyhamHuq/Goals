import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

export function SandboxBanner() {
  const [isSandbox, setIsSandbox] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetch('/health')
      .then(r => r.json())
      .then(data => { if (data.sandbox) setIsSandbox(true); })
      .catch(() => {});
  }, []);

  if (!isSandbox) return null;

  const handleReset = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    setResetting(true);
    fetch('/api/sandbox/reset', { method: 'POST' })
      .then(() => window.location.reload())
      .catch(() => setResetting(false));
  };

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'warning.main',
        color: 'warning.contrastText',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        py: 0.5,
        px: 2,
        position: 'sticky',
        top: 0,
        zIndex: theme => theme.zIndex.appBar + 1,
      }}
    >
      <Typography variant="caption" fontWeight="bold">
        SANDBOX MODE — changes will not affect real data
      </Typography>
      {resetting ? (
        <CircularProgress size={14} color="inherit" />
      ) : (
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          onClick={handleReset}
          onBlur={() => setConfirming(false)}
          sx={{ py: 0, minHeight: 0, fontSize: '0.65rem', lineHeight: 1.5 }}
        >
          {confirming ? 'Confirm reset?' : 'Reset DB'}
        </Button>
      )}
    </Box>
  );
}
