import { createTheme, alpha } from '@mui/material/styles';

export { alpha };

export function createAppTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#6C5CE7',
        light: '#A29BFE',
        dark: '#4834D4',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#FF6B6B',
        light: '#FF9F9F',
        dark: '#E84343',
        contrastText: '#ffffff',
      },
      success: {
        main: '#00C9A7',
        light: '#55EFC4',
        dark: '#00A887',
      },
      warning: {
        main: '#FFB830',
        light: '#FFEAA7',
        dark: '#E09B00',
      },
      error: {
        main: '#EF5350',
        light: '#FF7675',
        dark: '#C62828',
      },
      background: isDark
        ? { default: '#0F0F14', paper: '#1A1A24' }
        : { default: '#F7F7FB', paper: '#FFFFFF' },
      text: isDark
        ? { primary: '#F0F0F8', secondary: '#9B9BB8' }
        : { primary: '#1A1A2E', secondary: '#6B7280' },
      divider: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    },

    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 800, letterSpacing: '-0.03em' },
      h5: { fontWeight: 800, letterSpacing: '-0.02em' },
      h6: { fontWeight: 700, letterSpacing: '-0.01em' },
      subtitle1: { fontWeight: 700 },
      subtitle2: { fontWeight: 600 },
      body1: { fontWeight: 400 },
      body2: { fontWeight: 400, color: isDark ? '#9B9BB8' : '#6B7280' },
      caption: { fontWeight: 500 },
      button: { fontWeight: 700, letterSpacing: '0' },
    },

    shape: { borderRadius: 16 },

    components: {
      MuiCssBaseline: {
        styleOverrides: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
          * { -webkit-tap-highlight-color: transparent; }
          html { scroll-behavior: smooth; }
        `,
      },

      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: isDark
              ? '0 2px 8px rgba(0,0,0,0.3), 0 8px 24px rgba(0,0,0,0.2)'
              : '0 1px 4px rgba(0,0,0,0.04), 0 8px 20px rgba(0,0,0,0.05)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            borderRadius: 16,
            transition: 'box-shadow 0.25s ease, transform 0.18s ease',
            '&:hover': {
              boxShadow: isDark
                ? '0 4px 16px rgba(108,92,231,0.2), 0 12px 32px rgba(0,0,0,0.3)'
                : '0 4px 16px rgba(108,92,231,0.12), 0 12px 32px rgba(0,0,0,0.07)',
            },
          },
        },
      },

      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 12,
            letterSpacing: '0',
            '&:active': {
              transform: 'scale(0.97)',
              transition: 'transform 0.1s cubic-bezier(0.2, 0.8, 0.2, 1)',
            },
          },
          containedPrimary: {
            background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
            boxShadow: '0 4px 14px rgba(108,92,231,0.4)',
            '&:hover': {
              background: 'linear-gradient(135deg, #4834D4 0%, #6C5CE7 100%)',
              boxShadow: '0 6px 20px rgba(108,92,231,0.5)',
            },
            '&:disabled': {
              background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              boxShadow: 'none',
            },
          },
          containedSuccess: {
            background: 'linear-gradient(135deg, #00C9A7 0%, #55EFC4 100%)',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(0,201,167,0.35)',
            '&:hover': {
              background: 'linear-gradient(135deg, #00A887 0%, #00C9A7 100%)',
              boxShadow: '0 6px 20px rgba(0,201,167,0.45)',
            },
          },
          sizeLarge: {
            padding: '14px 28px',
            fontSize: '1rem',
            borderRadius: 14,
          },
          sizeMedium: {
            padding: '10px 20px',
          },
        },
      },

      MuiLinearProgress: {
        styleOverrides: {
          root: { borderRadius: 8, height: 6, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' },
          bar: { borderRadius: 8 },
        },
      },

      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            fontSize: '0.75rem',
            borderRadius: 8,
          },
        },
      },

      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 24,
            backgroundImage: 'none',
            boxShadow: isDark
              ? '0 24px 64px rgba(0,0,0,0.6)'
              : '0 24px 64px rgba(0,0,0,0.15)',
          },
        },
      },

      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
          },
        },
      },

      MuiTextField: {
        defaultProps: { variant: 'outlined', size: 'small' },
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
            },
          },
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },

      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background: isDark ? 'rgba(15,15,20,0.85)' : 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            color: isDark ? '#F0F0F8' : '#1A1A2E',
            boxShadow: `0 1px 0 ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)'}`,
          },
        },
      },

      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            height: 60,
            background: isDark ? 'rgba(15,15,20,0.85)' : 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          },
        },
      },

      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            minWidth: 56,
            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
            '&.Mui-selected': {
              color: '#6C5CE7',
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.68rem',
              fontWeight: 600,
            },
          },
        },
      },

      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            '&:active': { transform: 'scale(0.92)' },
          },
        },
      },

      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            '&.Mui-checked': {
              color: '#6C5CE7',
              '& + .MuiSwitch-track': { backgroundColor: '#6C5CE7' },
            },
          },
        },
      },

      MuiAvatar: {
        styleOverrides: {
          root: { fontWeight: 700 },
        },
      },

      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            '&:active': { transform: 'scale(0.98)' },
          },
        },
      },
    },
  });
}
