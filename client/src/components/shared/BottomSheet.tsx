import React from 'react';
import {
  Drawer,
  Dialog,
  Box,
  useMediaQuery,
  useTheme,
} from '@mui/material';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Max height on mobile as vh (0–100). Default 92 */
  maxHeightVh?: number;
  /** Desktop dialog max width. Default 'sm' */
  maxWidth?: 'xs' | 'sm' | 'md';
}

/**
 * Renders as a bottom-sheet Drawer on mobile and a centered Dialog on desktop.
 * Provides the drag handle bar automatically on mobile.
 */
export default function BottomSheet({
  open,
  onClose,
  children,
  maxHeightVh = 92,
  maxWidth = 'sm',
}: BottomSheetProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (isMobile) {
    return (
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: `${maxHeightVh}vh`,
            pb: 'env(safe-area-inset-bottom, 0px)',
            overflow: 'visible',
          },
        }}
      >
        {/* Drag handle */}
        <Box display="flex" justifyContent="center" pt={1.25} pb={0.5} flexShrink={0}>
          <Box
            sx={{
              width: 40,
              height: 4,
              borderRadius: 2,
              bgcolor: 'divider',
            }}
          />
        </Box>
        <Box sx={{ overflow: 'auto', flex: 1 }}>
          {children}
        </Box>
      </Drawer>
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
    >
      {children}
    </Dialog>
  );
}
