import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

interface State { hasError: boolean; message: string }

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center"
          minHeight="60vh" gap={2} px={3} textAlign="center">
          <ErrorOutlineIcon sx={{ fontSize: 56, color: 'error.light' }} />
          <Typography variant="h6">Something went wrong</Typography>
          <Typography variant="body2" color="text.secondary">{this.state.message}</Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>Reload page</Button>
        </Box>
      );
    }
    return this.props.children;
  }
}
