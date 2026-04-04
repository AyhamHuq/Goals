import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Skeleton,
  Divider,
  Chip,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';
import { format } from 'date-fns';
import { useUserContext } from '../../context/UserContext';
import { useHistoryPeriods } from '../../hooks/useHistory';
import { periodKeyToLabel } from '../../utils/dates';
import ArchivedMonthDetail from './ArchivedMonthDetail';

export default function HistoryView() {
  const { selectedUser } = useUserContext();
  const currentMonth = format(new Date(), 'yyyy-MM');

  const { data: periods = [], isLoading } = useHistoryPeriods(selectedUser?.id);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);

  // Exclude current month from history list
  const pastPeriods = periods.filter((p) => p !== currentMonth);

  if (selectedPeriod && selectedUser) {
    return (
      <Box>
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <IconButton onClick={() => setSelectedPeriod(null)} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="body2" color="text.secondary">
            History
          </Typography>
        </Box>
        <ArchivedMonthDetail
          periodKey={selectedPeriod}
          userId={selectedUser.id}
          onBack={() => setSelectedPeriod(null)}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={2}>
        History
      </Typography>

      {isLoading && (
        <Box>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rectangular" height={56} sx={{ mb: 1, borderRadius: 1 }} />
          ))}
        </Box>
      )}

      {!isLoading && pastPeriods.length === 0 && (
        <Typography color="text.secondary" textAlign="center" py={6}>
          No past months yet. Check back next month!
        </Typography>
      )}

      {!isLoading && pastPeriods.length > 0 && (
        <List disablePadding>
          {pastPeriods.map((pk, idx) => (
            <React.Fragment key={pk}>
              <ListItemButton
                onClick={() => setSelectedPeriod(pk)}
                sx={{ borderRadius: 1 }}
              >
                <ListItemText
                  primary={periodKeyToLabel(pk)}
                  secondary={pk}
                />
                <ListItemIcon sx={{ minWidth: 0 }}>
                  <ChevronRightIcon />
                </ListItemIcon>
              </ListItemButton>
              {idx < pastPeriods.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
}
