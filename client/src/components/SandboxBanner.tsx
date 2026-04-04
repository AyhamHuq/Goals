import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export function SandboxBanner() {
  const [isSandbox, setIsSandbox] = useState(false);

  useEffect(() => {
    fetch('/health')
      .then(r => r.json())
      .then(data => { if (data.sandbox) setIsSandbox(true); })
      .catch(() => {});
  }, []);

  if (!isSandbox) return null;

  return (
    <Box
      sx={{
        width: '100%',
        bgcolor: 'warning.main',
        color: 'warning.contrastText',
        textAlign: 'center',
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
    </Box>
  );
}
