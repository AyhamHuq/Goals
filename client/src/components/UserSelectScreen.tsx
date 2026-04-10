import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Avatar,
  Skeleton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import { useUserContext } from '../context/UserContext';
import { touchUser } from '../api/users';
import { User } from '../types';

function AvatarCard({
  user,
  selected,
  onSelect,
}: {
  user: User;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Box
      onClick={onSelect}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0.75,
        cursor: 'pointer',
        p: 1.5,
        borderRadius: 2,
        transition: 'background 0.15s',
        '&:hover': { bgcolor: 'rgba(92,107,192,0.06)' },
      }}
    >
      <Avatar
        sx={{
          width: 64,
          height: 64,
          bgcolor: user.avatar_color,
          fontSize: 24,
          fontWeight: 700,
          border: selected ? `3px solid ${user.avatar_color}` : '3px solid transparent',
          boxShadow: selected
            ? `0 0 0 3px ${user.avatar_color}33`
            : '0 2px 8px rgba(0,0,0,0.10)',
          transition: 'box-shadow 0.15s, border 0.15s',
        }}
      >
        {user.display_name[0].toUpperCase()}
      </Avatar>
      <Typography
        variant="caption"
        fontWeight={selected ? 700 : 500}
        color={selected ? 'primary.main' : 'text.secondary'}
        sx={{ fontSize: '0.8rem' }}
      >
        {user.display_name}
      </Typography>
    </Box>
  );
}

export default function UserSelectScreen() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { users, usersLoading, selectedUser, setSelectedUser } = useUserContext();
  const [chosenId, setChosenId] = useState<string>('');

  useEffect(() => {
    if (selectedUser) {
      setChosenId(selectedUser.id);
    }
  }, [selectedUser]);

  const handleGo = async () => {
    const user = users.find((u) => u.id === chosenId);
    if (!user) return;
    setSelectedUser(user);
    try {
      await touchUser(user.id);
    } catch {
      // non-critical
    }
    navigate('/dashboard');
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        background: 'linear-gradient(160deg, #EEF0FF 0%, #F5F6FA 100%)',
        p: 2,
        pt: 'max(16px, calc(16px + env(safe-area-inset-top, 0px)))',
        pb: 'max(16px, calc(16px + env(safe-area-inset-bottom, 0px)))',
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 8px 32px rgba(92,107,192,0.12)',
          borderRadius: 3,
        }}
      >
        <CardContent sx={{ p: isMobile ? 3 : 4 }}>
          {/* Logo area */}
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #5C6BC0 0%, #7986CB 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                boxShadow: '0 4px 16px rgba(92,107,192,0.35)',
              }}
            >
              <TrackChangesIcon sx={{ fontSize: 36, color: '#fff' }} />
            </Box>
            <Typography variant="h4" component="h1" align="center" gutterBottom>
              Family Goals
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Track what matters, together.
            </Typography>
          </Box>

          {/* Who's checking in label */}
          <Typography
            variant="subtitle1"
            align="center"
            color="text.secondary"
            sx={{ mb: 2, fontSize: '0.9rem', fontWeight: 500 }}
          >
            Who's checking in?
          </Typography>

          {/* Avatar grid */}
          {usersLoading ? (
            <Box display="flex" justifyContent="center" gap={2} flexWrap="wrap" mb={3}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Box key={i} display="flex" flexDirection="column" alignItems="center" gap={0.75}>
                  <Skeleton variant="circular" width={64} height={64} />
                  <Skeleton variant="text" width={48} height={16} />
                </Box>
              ))}
            </Box>
          ) : (
            <Box
              display="flex"
              justifyContent="center"
              flexWrap="wrap"
              gap={1}
              mb={3}
            >
              {users.map((user) => (
                <AvatarCard
                  key={user.id}
                  user={user}
                  selected={chosenId === user.id}
                  onSelect={() => setChosenId(user.id)}
                />
              ))}
            </Box>
          )}

          {/* CTA button */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            disabled={!chosenId}
            onClick={handleGo}
            sx={{ py: 1.5, fontSize: '1rem' }}
          >
            Let's go →
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
