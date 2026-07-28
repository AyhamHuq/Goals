import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Skeleton,
  Stack,
  IconButton,
  Tooltip,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import RadioButtonUncheckedRoundedIcon from '@mui/icons-material/RadioButtonUncheckedRounded';
import NotificationsNoneRoundedIcon from '@mui/icons-material/NotificationsNoneRounded';
import WhatshotRoundedIcon from '@mui/icons-material/WhatshotRounded';
import CardGiftcardRoundedIcon from '@mui/icons-material/CardGiftcardRounded';
import { getHours } from 'date-fns';
import { useUserContext } from '../../context/UserContext';
import { usePeriodContext } from '../../context/PeriodContext';
import { usePersonalDashboard } from '../../hooks/useDashboard';
import { formatDayLabel } from '../../utils/dates';
import GoalCard from './GoalCard';
import GoalFormDialog from '../goals/GoalFormDialog';
import NotificationSettings from '../NotificationSettings';
import { useMarkDayComplete, useUnmarkDayComplete } from '../../hooks/useDailyCompletions';
import Celebration from '../shared/Celebration';

function greeting(): string {
  const h = getHours(new Date());
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function GoalCardSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <Box
      sx={{
        borderRadius: '20px',
        border: '1px solid',
        borderColor: 'divider',
        p: 2.5,
        minHeight: 140,
        animation: `fadeSlideUp 350ms ease-out ${delay}ms both`,
        '@keyframes fadeSlideUp': {
          from: { opacity: 0, transform: 'translateY(14px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      <Box display="flex" gap={1.25}>
        <Box flex={1}>
          <Skeleton variant="text" width="65%" height={22} sx={{ mb: 0.5, borderRadius: 2 }} />
          <Skeleton variant="text" width="40%" height={16} sx={{ mb: 1.5, borderRadius: 2 }} />
        </Box>
        <Skeleton variant="circular" width={62} height={62} />
      </Box>
      <Skeleton variant="rectangular" sx={{ flex: 1, height: 3, borderRadius: 4, mb: 1.25 }} />
      <Skeleton variant="rectangular" width={80} height={34} sx={{ borderRadius: '100px', mt: 0.5 }} />
    </Box>
  );
}

function StatCard({
  value,
  label,
  color,
  icon,
  delay,
}: {
  value: string | number;
  label: string;
  color: string;
  icon?: React.ReactNode;
  delay?: number;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
        borderRadius: '16px',
        px: 1.5,
        py: 1.5,
        textAlign: 'center',
        bgcolor: isDark ? alpha(color, 0.12) : alpha(color, 0.08),
        border: `1px solid ${alpha(color, isDark ? 0.15 : 0.12)}`,
        animation: `fadeSlideUp 350ms ease-out ${delay ?? 0}ms both`,
      }}
    >
      {icon && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.25, color }}>
          {icon}
        </Box>
      )}
      <Typography
        variant="h5"
        fontWeight={800}
        sx={{ color, lineHeight: 1.1, letterSpacing: '-0.02em' }}
      >
        {value}
      </Typography>
      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mt: 0.2, fontSize: '0.7rem' }}>
        {label}
      </Typography>
    </Box>
  );
}

export default function PersonalDashboard() {
  const { selectedUser } = useUserContext();
  const { selectedDay, periodKey, isCurrentPeriod, isToday } = usePeriodContext();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const markComplete = useMarkDayComplete();
  const unmarkComplete = useUnmarkDayComplete();

  const { data, isLoading, isError } = usePersonalDashboard(selectedUser?.id, periodKey, selectedDay);

  const goals = data?.goals ?? [];
  const streak = data?.streak ?? 0;
  const dayCompleted = data?.day_completed ?? false;
  const proportionalThreshold = data
    ? (data.days_elapsed / data.days_in_month) * 100
    : 50;
  const onTrackCount = goals.filter(
    (g) => g.on_track === true || (g.on_track === null && g.percentage >= proportionalThreshold),
  ).length;
  const totalCount = goals.length;
  const avgPct =
    totalCount > 0
      ? Math.round(goals.reduce((sum, g) => sum + g.percentage, 0) / totalCount)
      : 0;

  const avgColor = avgPct >= 80 ? '#00C9A7' : avgPct >= 50 ? '#FFB830' : '#EF5350';
  const showDoneBar = !isLoading && totalCount > 0 && !!selectedUser;

  const handleMarkDone = () => {
    if (!selectedUser) return;
    markComplete.mutate(
      { userId: selectedUser.id, completedDate: selectedDay },
      {
        onSuccess: () => {
          setCelebrating(true);
          setTimeout(() => setCelebrating(false), 1000);
        },
      },
    );
  };

  if (isError) {
    return (
      <Box py={6} textAlign="center">
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: alpha('#EF5350', 0.1),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
            fontSize: 32,
          }}
        >
          ⚠️
        </Box>
        <Typography color="text.secondary" fontWeight={600}>
          Failed to load dashboard.
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Check your connection and try again.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pb: showDoneBar ? '160px' : '8px' }}>
      <Celebration trigger={celebrating} />

      {/* Gift Card Challenge Banner */}
      {data?.active_challenge && (
        <Box
          sx={{
            mb: 2,
            p: 2,
            borderRadius: '16px',
            background: data.active_challenge.status === 'active'
              ? (isDark
                ? 'linear-gradient(135deg, rgba(255,184,48,0.15) 0%, rgba(255,107,107,0.1) 100%)'
                : 'linear-gradient(135deg, rgba(255,184,48,0.12) 0%, rgba(255,107,107,0.06) 100%)')
              : (isDark
                ? 'linear-gradient(135deg, rgba(108,92,231,0.15) 0%, rgba(162,155,254,0.1) 100%)'
                : 'linear-gradient(135deg, rgba(108,92,231,0.08) 0%, rgba(162,155,254,0.05) 100%)'),
            border: '1px solid',
            borderColor: data.active_challenge.status === 'active'
              ? (isDark ? 'rgba(255,184,48,0.3)' : 'rgba(255,184,48,0.25)')
              : (isDark ? 'rgba(108,92,231,0.3)' : 'rgba(108,92,231,0.2)'),
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <CardGiftcardRoundedIcon sx={{ color: data.active_challenge.status === 'active' ? '#FFB830' : '#6C5CE7', fontSize: 22 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
              {data.active_challenge.status === 'active'
                ? `Gift Card Challenge: ${data.active_challenge.days_remaining} day${data.active_challenge.days_remaining !== 1 ? 's' : ''} left!`
                : 'Challenge ended — winner will be announced soon!'}
            </Typography>
          </Box>
          {data.active_challenge.status === 'active' && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {data.active_challenge.gift_card_name
                ? `Log consistently to win a ${data.active_challenge.gift_card_amount ? `$${data.active_challenge.gift_card_amount} ` : ''}${data.active_challenge.gift_card_name} gift card!`
                : 'Log consistently to win a gift card!'}
            </Typography>
          )}
          {data.active_challenge.leader_name && (
            <Typography variant="caption" fontWeight={700} sx={{ mt: 0.5, display: 'block', color: '#FFB830' }}>
              Current leader: {data.active_challenge.leader_name}
              {data.active_challenge.leader_id === selectedUser?.id ? ' (You!)' : ''}
            </Typography>
          )}
        </Box>
      )}

      {/* Greeting header */}
      <Box
        mb={2.5}
        sx={{
          borderRadius: '20px',
          p: { xs: 2, sm: 2.5 },
          background: isDark
            ? 'linear-gradient(135deg, rgba(108,92,231,0.1) 0%, rgba(255,107,107,0.05) 100%)'
            : 'linear-gradient(135deg, rgba(108,92,231,0.06) 0%, rgba(255,107,107,0.03) 100%)',
          border: `1px solid ${isDark ? 'rgba(108,92,231,0.2)' : 'rgba(108,92,231,0.1)'}`,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box display="flex" alignItems="center" gap={1.5}>
            {selectedUser && (
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  bgcolor: selectedUser.avatar_color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#fff',
                  flexShrink: 0,
                  boxShadow: `0 4px 12px ${selectedUser.avatar_color}66`,
                }}
              >
                {selectedUser.display_name[0].toUpperCase()}
              </Box>
            )}
            <Box>
              <Typography
                variant="h6"
                fontWeight={800}
                sx={{ lineHeight: 1.2, letterSpacing: '-0.02em', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
              >
                {greeting()}, {selectedUser?.display_name ?? ''}!
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>
                {isToday ? "Let's make progress today." : `Viewing ${formatDayLabel(selectedDay)}`}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={0.5} flexShrink={0}>
            {selectedUser && (
              <Tooltip title="Notification settings">
                <IconButton
                  size="small"
                  onClick={() => setNotifOpen(true)}
                  sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
                >
                  <NotificationsNoneRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {isCurrentPeriod && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddRoundedIcon />}
                onClick={() => setAddGoalOpen(true)}
                sx={{
                  display: { xs: 'none', sm: 'flex' },
                  borderRadius: 2.5,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  borderColor: alpha('#6C5CE7', 0.3),
                  color: 'primary.main',
                  '&:hover': { borderColor: 'primary.main', bgcolor: alpha('#6C5CE7', 0.06) },
                }}
              >
                Add Goal
              </Button>
            )}
          </Box>
        </Box>
      </Box>

      {/* Stats strip */}
      {!isLoading && totalCount > 0 && (
        <Box display="flex" gap={1.25} mb={2.5}>
          <StatCard value={totalCount} label="Goals" color="#6C5CE7" delay={0} />
          <StatCard value={onTrackCount} label="On track" color="#00C9A7" delay={40} />
          <StatCard value={`${avgPct}%`} label="Average" color={avgColor} delay={80} />
          {streak > 0 && (
            <StatCard
              value={streak}
              label="Day streak"
              color="#FFB830"
              delay={120}
              icon={<WhatshotRoundedIcon sx={{ fontSize: 16 }} />}
            />
          )}
        </Box>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <Stack spacing={2}>
          <GoalCardSkeleton delay={0} />
          <GoalCardSkeleton delay={40} />
          <GoalCardSkeleton delay={80} />
        </Stack>
      )}

      {/* Empty state */}
      {!isLoading && totalCount === 0 && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          py={8}
          gap={2}
        >
          <Box
            sx={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(108,92,231,0.1), rgba(255,107,107,0.08))',
              border: '1px solid rgba(108,92,231,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 0.5,
              fontSize: 44,
            }}
          >
            🎯
          </Box>
          <Box textAlign="center">
            <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.02em', mb: 0.5 }}>
              No goals yet
            </Typography>
            <Typography variant="body2" color="text.secondary" maxWidth={260} mx="auto">
              Set your first goal to start building momentum this month.
            </Typography>
          </Box>
          {isCurrentPeriod && (
            <Button
              variant="contained"
              startIcon={<AddRoundedIcon />}
              onClick={() => setAddGoalOpen(true)}
              sx={{
                mt: 0.5,
                py: 1.25,
                px: 3.5,
                borderRadius: 3,
                fontWeight: 700,
                fontSize: '0.95rem',
                // shimmer animation
                background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 50%, #6C5CE7 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2.5s linear infinite',
                '@keyframes shimmer': {
                  '0%': { backgroundPosition: '-200% center' },
                  '100%': { backgroundPosition: '200% center' },
                },
              }}
            >
              Create your first goal
            </Button>
          )}
        </Box>
      )}

      {/* Goal cards */}
      {!isLoading && totalCount > 0 && (
        <Stack spacing={1.75}>
          {goals.map((goal, index) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              readOnly={false}
              selectedDay={selectedDay}
              animationDelay={index * 40}
            />
          ))}
        </Stack>
      )}

      {selectedUser && (
        <GoalFormDialog
          open={addGoalOpen}
          onClose={() => setAddGoalOpen(false)}
          userId={selectedUser.id}
          periodKey={periodKey}
        />
      )}

      {selectedUser && (
        <NotificationSettings
          open={notifOpen}
          onClose={() => setNotifOpen(false)}
          user={selectedUser}
        />
      )}

      {/* Fixed "Done for today" bar */}
      {showDoneBar && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 'calc(60px + env(safe-area-inset-bottom, 0px))',
            left: 0,
            right: 0,
            zIndex: 1099,
            px: 2,
            py: 1,
            background: isDark ? 'rgba(15,15,20,0.92)' : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {dayCompleted ? (
            <Box
              display="flex"
              alignItems="center"
              gap={1.5}
              width="100%"
              maxWidth={400}
              justifyContent="center"
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2.5,
                  py: 1,
                  borderRadius: '100px',
                  background: 'linear-gradient(135deg, #00C9A7, #55EFC4)',
                  boxShadow: '0 4px 16px rgba(0,201,167,0.35)',
                }}
              >
                <CheckCircleRoundedIcon sx={{ color: '#fff', fontSize: 18 }} />
                <Typography fontWeight={700} color="#fff" fontSize="0.9rem">
                  Day completed! 🎉
                </Typography>
              </Box>
              <Button
                size="small"
                variant="text"
                sx={{ color: 'text.secondary', fontSize: '0.75rem', fontWeight: 600 }}
                disabled={unmarkComplete.isPending}
                onClick={() =>
                  unmarkComplete.mutate({ userId: selectedUser!.id, completedDate: selectedDay })
                }
              >
                Undo
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={
                markComplete.isPending
                  ? <CircularProgress size={16} color="inherit" />
                  : <RadioButtonUncheckedRoundedIcon />
              }
              disabled={markComplete.isPending}
              onClick={handleMarkDone}
              sx={{
                maxWidth: 400,
                borderRadius: 3,
                py: 1.4,
                fontWeight: 700,
                fontSize: '0.95rem',
                background: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
                boxShadow: '0 4px 16px rgba(108,92,231,0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #4834D4 0%, #6C5CE7 100%)',
                  boxShadow: '0 6px 20px rgba(108,92,231,0.5)',
                },
              }}
            >
              {isToday ? 'Done for today' : 'Mark day as done'}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
