import { createTheme, alpha } from '@mui/material/styles';

// alpha is imported for potential use in component consumers
export { alpha };

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#5C6BC0', light: '#9FA8DA', dark: '#3949AB' },
    secondary: { main: '#EC407A', light: '#F48FB1', dark: '#C2185B' },
    success: { main: '#4CAF50', light: '#81C784' },
    warning: { main: '#FF9800', light: '#FFB74D' },
    error: { main: '#EF5350', light: '#EF9A9A' },
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
    h5: { fontWeight: 700, letterSpacing: '-0.3px' },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    body2: { color: '#6B7280' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
          border: '1px solid rgba(0,0,0,0.06)',
          '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
          transition: 'box-shadow 0.2s ease, transform 0.15s ease',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 },
        containedPrimary: {
          background: 'linear-gradient(135deg, #5C6BC0 0%, #7986CB 100%)',
          boxShadow: '0 2px 8px rgba(92,107,192,0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #3949AB 0%, #5C6BC0 100%)',
            boxShadow: '0 4px 16px rgba(92,107,192,0.4)',
          },
          '&:active': { transform: 'scale(0.98)' },
        },
        sizeLarge: {
          padding: '12px 24px',
          fontSize: '1rem',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 8, height: 10 },
        bar: { borderRadius: 8 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 500, fontSize: '0.75rem' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 20 },
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
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: 56,
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          minWidth: 60,
          '&.Mui-selected': {
            color: '#5C6BC0',
          },
        },
      },
    },
  },
});

export default theme;
