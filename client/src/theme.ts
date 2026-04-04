import { createTheme, alpha } from '@mui/material/styles';

// alpha is imported for potential use in component consumers
export { alpha };

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#5C6BC0' },       // indigo — softer than pure blue
    secondary: { main: '#EC407A' },      // pink accent
    success: { main: '#66BB6A' },
    warning: { main: '#FFA726' },
    error: { main: '#EF5350' },
    background: {
      default: '#F5F6FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A1D2E',
      secondary: '#6B7280',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.5px' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    body2: { color: '#6B7280' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.10)' },
          transition: 'box-shadow 0.2s ease',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 8 },
        containedPrimary: {
          background: 'linear-gradient(135deg, #5C6BC0 0%, #7986CB 100%)',
          boxShadow: '0 2px 8px rgba(92,107,192,0.4)',
          '&:hover': { boxShadow: '0 4px 16px rgba(92,107,192,0.5)' },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 6, height: 8 },
        bar: { borderRadius: 6 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500, fontSize: '0.75rem' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16 },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined', size: 'small' },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#FFFFFF',
          color: '#1A1D2E',
          boxShadow: '0 1px 0 rgba(0,0,0,0.08)',
        },
      },
    },
  },
});

export default theme;
