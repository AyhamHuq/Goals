import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Avatar,
  Skeleton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useUserContext } from '../context/UserContext';
import { touchUser } from '../api/users';
import { User } from '../types';

function AvatarCard({
  user,
  selected,
  index,
  onSelect,
}: {
  user: User;
  selected: boolean;
  index: number;
  onSelect: () => void;
}) {
  return (
    <Box
      onClick={onSelect}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        cursor: 'pointer',
        p: 1.5,
        borderRadius: 3,
        transition: 'transform 0.2s cubic-bezier(0.2,0.8,0.2,1)',
        animation: `fadeSlideUp 400ms ease-out ${index * 50}ms both`,
        '@keyframes fadeSlideUp': {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '&:active': { transform: 'scale(0.9)' },
        transform: selected ? 'scale(1.08)' : 'scale(1)',
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <Avatar
          sx={{
            width: 68,
            height: 68,
            bgcolor: user.avatar_color,
            fontSize: 26,
            fontWeight: 800,
            border: selected ? '3px solid rgba(255,255,255,0.9)' : '3px solid rgba(255,255,255,0.25)',
            boxShadow: selected
              ? `0 0 0 4px rgba(255,255,255,0.35), 0 8px 24px ${user.avatar_color}88`
              : `0 4px 16px ${user.avatar_color}66`,
            transition: 'box-shadow 0.2s ease, border 0.2s ease',
            background: selected
              ? `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.3), transparent), ${user.avatar_color}`
              : `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.15), transparent), ${user.avatar_color}`,
          }}
        >
          {user.display_name[0].toUpperCase()}
        </Avatar>
        {selected && (
          <Box
            sx={{
              position: 'absolute',
              inset: -4,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.6)',
              animation: 'pulseRing 1.5s ease-out infinite',
              '@keyframes pulseRing': {
                '0%': { transform: 'scale(1)', opacity: 0.6 },
                '100%': { transform: 'scale(1.25)', opacity: 0 },
              },
            }}
          />
        )}
      </Box>
      <Typography
        variant="caption"
        sx={{
          fontWeight: selected ? 800 : 500,
          color: selected ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.75)',
          fontSize: '0.82rem',
          letterSpacing: '-0.01em',
          transition: 'color 0.15s ease, font-weight 0.15s ease',
        }}
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
    if (selectedUser) setChosenId(selectedUser.id);
  }, [selectedUser]);

  const handleGo = async () => {
    const user = users.find((u) => u.id === chosenId);
    if (!user) return;
    setSelectedUser(user);
    try { await touchUser(user.id); } catch { /* non-critical */ }
    navigate('/dashboard');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #4834D4 0%, #6C5CE7 30%, #A29BFE 65%, #FF6B6B 100%)',
        p: 2,
        pt: 'max(24px, calc(24px + env(safe-area-inset-top, 0px)))',
        pb: 'max(32px, calc(32px + env(safe-area-inset-bottom, 0px)))',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration rings */}
      <Box
        sx={{
          position: 'absolute',
          top: '-20%',
          right: '-15%',
          width: '60vw',
          height: '60vw',
          maxWidth: 400,
          maxHeight: 400,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.12)',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-10%',
          left: '-10%',
          width: '50vw',
          height: '50vw',
          maxWidth: 350,
          maxHeight: 350,
          borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.08)',
          pointerEvents: 'none',
        }}
      />

      <Box
        sx={{
          width: '100%',
          maxWidth: 480,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Animated logo */}
        <Box sx={{ position: 'relative', mb: 3, animation: 'breathe 3.5s ease-in-out infinite' }}>
          <style>{`@keyframes breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }`}</style>
          {/* Outer orbit ring */}
          <Box
            sx={{
              position: 'absolute',
              inset: -16,
              borderRadius: '50%',
              border: '1.5px solid rgba(255,255,255,0.2)',
              animation: 'orbitSpin 12s linear infinite',
              '@keyframes orbitSpin': {
                from: { transform: 'rotate(0deg)' },
                to: { transform: 'rotate(360deg)' },
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: -3,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.7)',
              },
            }}
          />
          <Box
            sx={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.18)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1.5px solid rgba(255,255,255,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              fontSize: 44,
            }}
          >
            🎯
          </Box>
        </Box>

        {/* App name */}
        <Typography
          variant={isMobile ? 'h4' : 'h3'}
          component="h1"
          align="center"
          sx={{
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-0.03em',
            mb: 0.75,
            textShadow: '0 2px 16px rgba(0,0,0,0.25)',
            animation: 'fadeSlideUp 500ms ease-out 100ms both',
          }}
        >
          Family Goals
        </Typography>
        <Typography
          variant="body1"
          align="center"
          sx={{
            color: 'rgba(255,255,255,0.8)',
            mb: 4,
            fontWeight: 500,
            letterSpacing: '-0.01em',
            animation: 'fadeSlideUp 500ms ease-out 160ms both',
          }}
        >
          Track what matters, together.
        </Typography>

        {/* Who's checking in */}
        <Typography
          variant="body2"
          align="center"
          sx={{
            color: 'rgba(255,255,255,0.65)',
            mb: 2,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            fontSize: '0.7rem',
            animation: 'fadeSlideUp 500ms ease-out 220ms both',
          }}
        >
          Who's checking in?
        </Typography>

        {/* Avatar grid */}
        <Box
          sx={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: { xs: 0.5, sm: 1 },
            mb: 4,
          }}
        >
          {usersLoading
            ? [1, 2, 3, 4].map((i) => (
                <Box key={i} display="flex" flexDirection="column" alignItems="center" gap={1} p={1.5}>
                  <Skeleton variant="circular" width={68} height={68} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
                  <Skeleton variant="text" width={52} height={14} sx={{ bgcolor: 'rgba(255,255,255,0.15)' }} />
                </Box>
              ))
            : users.map((user, index) => (
                <AvatarCard
                  key={user.id}
                  user={user}
                  selected={chosenId === user.id}
                  index={index}
                  onSelect={() => setChosenId(user.id)}
                />
              ))}
        </Box>

        {/* CTA */}
        <Box
          sx={{
            width: '100%',
            maxWidth: 320,
            animation: 'fadeSlideUp 500ms ease-out 320ms both',
          }}
        >
          <Button
            variant="contained"
            fullWidth
            size="large"
            disabled={!chosenId}
            onClick={handleGo}
            sx={{
              py: 1.75,
              fontSize: '1.05rem',
              fontWeight: 800,
              borderRadius: 3.5,
              bgcolor: '#fff',
              color: '#6C5CE7',
              boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
              letterSpacing: '-0.01em',
              transition: 'transform 0.18s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.18s ease',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.95)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.3)',
                transform: 'translateY(-1px)',
              },
              '&:active': {
                transform: 'scale(0.97) translateY(0)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              },
              '&:disabled': {
                bgcolor: 'rgba(255,255,255,0.25)',
                color: 'rgba(255,255,255,0.45)',
                boxShadow: 'none',
              },
            }}
          >
            Let's go →
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
