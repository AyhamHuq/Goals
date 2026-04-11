import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Skeleton,
  Stack,
  Card,
  CardContent,
  Collapse,
  Divider,
  LinearProgress,
  IconButton,
  useTheme,
} from '@mui/material';
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded';
import FavoriteRoundedIcon from '@mui/icons-material/FavoriteRounded';
import FavoriteBorderRoundedIcon from '@mui/icons-material/FavoriteBorderRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import WarningRoundedIcon from '@mui/icons-material/WarningRounded';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import ExpandLessRoundedIcon from '@mui/icons-material/ExpandLessRounded';
import { useGroupDashboard } from '../../hooks/useDashboard';
import { usePeriodContext } from '../../context/PeriodContext';
import { useUserContext } from '../../context/UserContext';
import { GoalWithProgress, UserGoalSummary } from '../../types';
import { formatPercentage, getMonthlyLabel, getMonthlyDisplay, fmtValue } from '../../utils/frequency';
import { periodKeyToLabel } from '../../utils/dates';
import { GOAL_TEMPLATES } from '../../constants/goalTemplates';
import { PACING_HEX } from '../../theme/tokens';
import ProgressHistoryDrawer from '../progress/ProgressHistoryDrawer';
import CircularProgressRing from '../shared/CircularProgressRing';
import { likeGoal, unlikeGoal } from '../../api/likes';

type PacingColor = 'success' | 'warning' | 'error' | 'primary';

function getProgressColor(goal: GoalWithProgress): PacingColor {
  if (goal.on_track === null) return 'primary';
  if (goal.on_track) return 'success';
  if (goal.goal_type !== 'measurement' && goal.expected_value !== null && goal.expected_value > 0) {
    const ratio = goal.current_value / goal.expected_value;
    if (ratio >= 0.8) return 'warning';
  }
  return 'error';
}

function goalDerivedLabel(goal: GoalWithProgress): string {
  return getMonthlyLabel(goal);
}

interface CategoryEntry {
  user: { id: string; display_name: string; avatar_color: string };
  goal: GoalWithProgress;
  rank: number;
}
interface CategorySection {
  categoryId: string | null;
  categoryName: string;
  categoryIcon: string;
  entries: CategoryEntry[];
}

function buildCategoryView(users: UserGoalSummary[]): CategorySection[] {
  const map = new Map<string, Omit<CategorySection, 'entries'> & { entries: Omit<CategoryEntry, 'rank'>[] }>();

  for (const { user, goals } of users) {
    for (const goal of goals) {
      const key = goal.category?.id ?? '__none__';
      const name = goal.category?.name ?? 'Uncategorized';
      if (!map.has(key)) {
        const template = GOAL_TEMPLATES.find((t) => t.label.toLowerCase() === name.toLowerCase());
        map.set(key, {
          categoryId: goal.category?.id ?? null,
          categoryName: name,
          categoryIcon: template?.icon ?? '🎯',
          entries: [],
        });
      }
      map.get(key)!.entries.push({ user, goal });
    }
  }

  const sections: CategorySection[] = [];
  for (const section of map.values()) {
    section.entries.sort((a, b) => b.goal.percentage - a.goal.percentage);
    let rank = 1;
    const ranked: CategoryEntry[] = section.entries.map((e, i) => {
      if (i > 0 && e.goal.percentage < section.entries[i - 1].goal.percentage) rank = i + 1;
      return { ...e, rank };
    });
    sections.push({ ...section, entries: ranked });
  }

  return sections.sort((a, b) => {
    if (a.categoryId === null) return 1;
    if (b.categoryId === null) return -1;
    return a.categoryName.localeCompare(b.categoryName);
  });
}

function avgPercentage(goals: GoalWithProgress[]): number {
  if (!goals.length) return 0;
  return goals.reduce((sum, g) => sum + g.percentage, 0) / goals.length;
}

function SkeletonCard() {
  return (
    <Card sx={{ borderRadius: '20px' }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
          <Skeleton variant="circular" width={48} height={48} />
          <Box flex={1}>
            <Skeleton variant="text" width="45%" height={20} />
            <Skeleton variant="text" width="65%" height={16} />
          </Box>
          <Skeleton variant="circular" width={56} height={56} />
        </Box>
      </CardContent>
    </Card>
  );
}

interface DrawerState {
  goal: GoalWithProgress;
  userId: string;
}

interface LikeState {
  like_count: number;
  liked_by: string[];
}

function OverviewTab({
  users, isLoading, currentUserId, periodKey: _periodKey, selectedDay,
}: {
  users: UserGoalSummary[];
  isLoading: boolean;
  currentUserId: string;
  periodKey: string;
  selectedDay: string;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [localLikes, setLocalLikes] = useState<Map<string, LikeState>>(new Map());
  const trackColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  const handleToggleLike = useCallback(async (goalId: string, ownerId: string, currentLikedBy: string[]) => {
    if (ownerId === currentUserId) return;
    const isLiked = currentLikedBy.includes(currentUserId);
    const optimistic: LikeState = isLiked
      ? { like_count: currentLikedBy.length - 1, liked_by: currentLikedBy.filter((id) => id !== currentUserId) }
      : { like_count: currentLikedBy.length + 1, liked_by: [...currentLikedBy, currentUserId] };

    setLocalLikes((prev) => new Map(prev).set(goalId, optimistic));
    try {
      const result = isLiked
        ? await unlikeGoal(goalId, currentUserId, selectedDay)
        : await likeGoal(goalId, currentUserId, selectedDay);
      setLocalLikes((prev) => new Map(prev).set(goalId, result));
    } catch {
      // revert on error
      setLocalLikes((prev) => {
        const next = new Map(prev);
        next.delete(goalId);
        return next;
      });
    }
  }, [currentUserId, selectedDay]);

  if (isLoading) {
    return (
      <Stack spacing={1.75}>
        {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
      </Stack>
    );
  }

  if (!users.some((u) => u.goals.length > 0)) {
    return (
      <Box py={6} textAlign="center">
        <Typography color="text.secondary" fontWeight={500}>No one has set goals for this period yet.</Typography>
      </Box>
    );
  }

  return (
    <>
      <Stack spacing={1.75}>
        {users.map(({ user, goals }) => {
          const avg = avgPercentage(goals);
          const avgClamped = Math.min(avg, 100);
          const isChampion = avg >= 80;
          const isExpanded = expandedUserId === user.id;
          // Color by on_track pacing status, not raw % (which is low early in the period)
          const behindCount = goals.filter((g) => g.on_track === false).length;
          const onTrackCount = goals.filter((g) => g.on_track === true).length;
          const ringColor = behindCount === 0
            ? '#00C9A7'                              // nobody behind → green
            : behindCount <= onTrackCount
              ? '#FFB830'                            // minority behind → amber
              : '#EF5350';                           // majority behind → red

          return (
            <Card key={user.id} sx={{ borderRadius: '20px', overflow: 'hidden' }}>
              <CardContent
                sx={{
                  cursor: goals.length > 0 ? 'pointer' : 'default',
                  transition: 'background 0.15s ease',
                  '&:hover': goals.length > 0 ? { bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)' } : {},
                  pb: isExpanded ? 1 : '16px !important',
                }}
                onClick={() => goals.length > 0 && setExpandedUserId(isExpanded ? null : user.id)}
              >
                <Box display="flex" alignItems="center" gap={1.5}>
                  {/* Avatar with champion badge */}
                  <Box sx={{ position: 'relative', flexShrink: 0 }}>
                    <Avatar
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: user.avatar_color,
                        fontSize: 17,
                        fontWeight: 800,
                        boxShadow: isChampion ? `0 4px 14px ${user.avatar_color}66` : undefined,
                      }}
                    >
                      {user.display_name[0].toUpperCase()}
                    </Avatar>
                    {isChampion && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: -4,
                          right: -4,
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          bgcolor: '#FFB830',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 2px 6px rgba(255,184,48,0.5)',
                          border: `2px solid ${isDark ? '#1A1A24' : '#fff'}`,
                        }}
                      >
                        <EmojiEventsRoundedIcon sx={{ fontSize: 10, color: '#fff' }} />
                      </Box>
                    )}
                  </Box>

                  {/* Name + subtitle */}
                  <Box flex={1} minWidth={0}>
                    <Typography fontWeight={700} noWrap sx={{ letterSpacing: '-0.01em' }}>
                      {user.display_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {goals.length === 0
                        ? 'No goals this period'
                        : `${goals.filter(g => g.on_track === true).length}/${goals.length} on track`}
                    </Typography>
                  </Box>

                  {/* Circular progress ring */}
                  {goals.length > 0 && (
                    <CircularProgressRing
                      value={avgClamped}
                      size={56}
                      strokeWidth={4.5}
                      color={ringColor}
                      trackColor={trackColor}
                    >
                      <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: ringColor, lineHeight: 1 }}>
                        {Math.round(avg)}%
                      </Typography>
                    </CircularProgressRing>
                  )}

                  {goals.length > 0 && (
                    <Box sx={{ color: 'text.secondary', ml: 0.5 }}>
                      {isExpanded
                        ? <ExpandLessRoundedIcon sx={{ fontSize: 20 }} />
                        : <ExpandMoreRoundedIcon sx={{ fontSize: 20 }} />}
                    </Box>
                  )}
                </Box>
              </CardContent>

              {/* Expanded goal list */}
              <Collapse in={isExpanded}>
                <Divider />
                <Box sx={{ px: 2, pt: 1, pb: 1.5 }}>
                  <Stack spacing={0}>
                    {goals.map((goal, idx) => {
                      const color = getProgressColor(goal);
                      const hex = PACING_HEX[color];
                      return (
                        <Box key={goal.id}>
                          {idx > 0 && <Divider sx={{ my: 0.75 }} />}
                          <Box
                            onClick={() => setDrawer({ goal, userId: user.id })}
                            sx={{
                              py: 1.25,
                              px: 0.5,
                              cursor: 'pointer',
                              borderRadius: 2,
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                              <Box minWidth={0} flex={1} mr={1}>
                                <Typography variant="body2" fontWeight={700} noWrap sx={{ letterSpacing: '-0.01em' }}>
                                  {goalDerivedLabel(goal)}
                                </Typography>
                                {goal.title && (
                                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                                    {goal.title}
                                  </Typography>
                                )}
                              </Box>
                              <Typography
                                sx={{ fontSize: '0.78rem', fontWeight: 800, color: hex, flexShrink: 0 }}
                              >
                                {formatPercentage(goal.percentage)}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(goal.percentage, 100)}
                              sx={{
                                height: 4,
                                borderRadius: 4,
                                bgcolor: trackColor,
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 4,
                                  bgcolor: hex,
                                },
                              }}
                            />
                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.4}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.66rem' }}>
                                {(() => {
                                  const m = getMonthlyDisplay(goal);
                                  const ap = m.isApprox ? '~' : '';
                                  if (goal.goal_type === 'measurement') {
                                    return `${fmtValue(goal.current_value)} → ${goal.target_value} ${goal.unit}`;
                                  }
                                  return `${fmtValue(m.current)} / ${ap}${fmtValue(m.monthlyTarget)} ${m.unit}`;
                                })()}
                              </Typography>
                              <Box display="flex" alignItems="center" gap={0.5}>
                                {goal.on_track !== null && (
                                  <Box display="flex" alignItems="center" gap={0.3} flexShrink={0}>
                                    {goal.on_track
                                      ? <CheckCircleRoundedIcon sx={{ fontSize: 11, color: PACING_HEX.success }} />
                                      : <WarningRoundedIcon sx={{ fontSize: 11, color: PACING_HEX.error }} />}
                                    <Typography
                                      variant="caption"
                                      sx={{ fontSize: '0.66rem', color: goal.on_track ? PACING_HEX.success : PACING_HEX.error, fontWeight: 700 }}
                                    >
                                      {goal.on_track ? 'On pace' : 'Behind'}
                                    </Typography>
                                  </Box>
                                )}
                                {/* Like button — only on other users' goals with entries today */}
                                {user.id !== currentUserId && goal.day_entry_count > 0 && (() => {
                                  const effective = localLikes.get(goal.id) ?? { like_count: goal.like_count, liked_by: goal.liked_by };
                                  const isLiked = effective.liked_by.includes(currentUserId);
                                  return (
                                    <Box
                                      display="flex"
                                      alignItems="center"
                                      onClick={(e) => { e.stopPropagation(); handleToggleLike(goal.id, user.id, effective.liked_by); }}
                                    >
                                      <IconButton size="small" sx={{ p: 0.4, color: isLiked ? '#EF5350' : 'text.disabled' }}>
                                        {isLiked
                                          ? <FavoriteRoundedIcon sx={{ fontSize: 15 }} />
                                          : <FavoriteBorderRoundedIcon sx={{ fontSize: 15 }} />}
                                      </IconButton>
                                      {effective.like_count > 0 && (
                                        <Typography variant="caption" sx={{ fontSize: '0.66rem', color: 'text.secondary', lineHeight: 1 }}>
                                          {effective.like_count}
                                        </Typography>
                                      )}
                                    </Box>
                                  );
                                })()}
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              </Collapse>
            </Card>
          );
        })}
      </Stack>

      {drawer && (
        <ProgressHistoryDrawer
          open={!!drawer}
          onClose={() => setDrawer(null)}
          goal={drawer.goal}
          readOnly={drawer.userId !== currentUserId}
        />
      )}
    </>
  );
}

const rankColors: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

function ByCategoryTab({
  users, isLoading, currentUserId,
}: {
  users: UserGoalSummary[];
  isLoading: boolean;
  currentUserId: string;
}) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const trackColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  if (isLoading) {
    return (
      <Stack spacing={2}>
        {[1, 2].map((i) => <SkeletonCard key={i} />)}
      </Stack>
    );
  }

  const sections = buildCategoryView(users);

  if (sections.length === 0) {
    return (
      <Box py={6} textAlign="center">
        <Typography color="text.secondary" fontWeight={500}>No goals to compare yet.</Typography>
      </Box>
    );
  }

  return (
    <>
      <Stack spacing={3.5}>
        {sections.map((section) => (
          <Box key={section.categoryId ?? '__none__'}>
            {/* Section header */}
            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
              <Box sx={{ fontSize: 24, lineHeight: 1 }}>{section.categoryIcon}</Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
                {section.categoryName}
              </Typography>
            </Box>

            <Card sx={{ borderRadius: '20px' }}>
              <CardContent sx={{ pb: '16px !important' }}>
                <Stack spacing={1.75}>
                  {section.entries.map(({ user, goal, rank }, idx) => {
                    const color = getProgressColor(goal);
                    const hex = PACING_HEX[color];
                    const showPacing = goal.on_track !== null;
                    const rankColor = rankColors[rank];

                    return (
                      <Box key={`${user.id}-${goal.id}`}>
                        {idx > 0 && (
                          <Box sx={{ height: '1px', bgcolor: 'divider', mb: 1.75 }} />
                        )}
                        <Box
                          onClick={() => setDrawer({ goal, userId: user.id })}
                          sx={{ cursor: 'pointer', borderRadius: 2, '&:hover': { bgcolor: 'action.hover' }, p: 0.5, mx: -0.5 }}
                        >
                          <Box display="flex" alignItems="center" gap={1.25} mb={0.75}>
                            {/* Rank */}
                            <Typography
                              variant="caption"
                              fontWeight={800}
                              sx={{
                                width: 22,
                                textAlign: 'center',
                                color: rankColor ?? 'text.secondary',
                                flexShrink: 0,
                                fontSize: '0.78rem',
                              }}
                            >
                              #{rank}
                            </Typography>

                            {/* Avatar */}
                            <Avatar
                              sx={{
                                width: 34,
                                height: 34,
                                bgcolor: user.avatar_color,
                                fontSize: 13,
                                fontWeight: 800,
                                flexShrink: 0,
                              }}
                            >
                              {user.display_name[0].toUpperCase()}
                            </Avatar>

                            {/* Info */}
                            <Box flex={1} minWidth={0}>
                              <Typography variant="body2" fontWeight={700} noWrap sx={{ letterSpacing: '-0.01em' }}>
                                {user.display_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap display="block">
                                {goalDerivedLabel(goal)}
                              </Typography>
                            </Box>

                            {/* Percentage */}
                            <Typography
                              sx={{ fontSize: '0.82rem', fontWeight: 800, color: hex, flexShrink: 0 }}
                            >
                              {formatPercentage(goal.percentage)}
                            </Typography>
                          </Box>

                          {/* Progress bar */}
                          <Box display="flex" alignItems="center" gap={1} pl={`${22 + 8 + 34 + 10}px`}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(goal.percentage, 100)}
                              sx={{
                                flex: 1,
                                height: 5,
                                borderRadius: 4,
                                bgcolor: trackColor,
                                '& .MuiLinearProgress-bar': {
                                  borderRadius: 4,
                                  bgcolor: hex,
                                },
                              }}
                            />
                            {showPacing && (
                              <Box display="flex" alignItems="center" gap={0.3} flexShrink={0}>
                                {goal.on_track
                                  ? <CheckCircleRoundedIcon sx={{ fontSize: 12, color: PACING_HEX.success }} />
                                  : <WarningRoundedIcon sx={{ fontSize: 12, color: PACING_HEX.error }} />}
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: '0.66rem', color: goal.on_track ? PACING_HEX.success : PACING_HEX.error, fontWeight: 700 }}
                                >
                                  {goal.on_track ? 'On pace' : 'Behind'}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Stack>

      {drawer && (
        <ProgressHistoryDrawer
          open={!!drawer}
          onClose={() => setDrawer(null)}
          goal={drawer.goal}
          readOnly={drawer.userId !== currentUserId}
        />
      )}
    </>
  );
}

export default function GroupDashboard() {
  const { selectedUser } = useUserContext();
  const { periodKey, selectedDay } = usePeriodContext();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const groupId = selectedUser?.group_id;
  const [tab, setTab] = useState(0);

  const { data, isLoading, isError } = useGroupDashboard(groupId, periodKey, selectedDay);

  if (isError) {
    return (
      <Box py={4} textAlign="center">
        <Typography color="error" fontWeight={600}>Failed to load group dashboard.</Typography>
      </Box>
    );
  }

  const users = data?.users ?? [];
  const currentUserId = selectedUser?.id ?? '';

  return (
    <Box>
      <Typography
        variant="h5"
        fontWeight={800}
        mb={0.5}
        sx={{ letterSpacing: '-0.02em' }}
      >
        Family Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2.5}>
        {periodKeyToLabel(periodKey)}
      </Typography>

      {/* Segmented control */}
      <Box
        display="flex"
        sx={{
          bgcolor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          borderRadius: '100px',
          p: '3px',
          mb: 2.5,
          width: 'fit-content',
        }}
      >
        {(['Overview', 'By Category'] as const).map((label, idx) => {
          const active = tab === idx;
          return (
            <Box
              key={label}
              onClick={() => setTab(idx)}
              sx={{
                px: 2.5,
                py: 0.75,
                borderRadius: '100px',
                fontSize: '0.82rem',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                userSelect: 'none',
                transition: 'background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease',
                color: active ? (isDark ? '#fff' : '#1A1A2E') : 'text.secondary',
                bgcolor: active
                  ? (isDark ? 'rgba(108,92,231,0.9)' : '#fff')
                  : 'transparent',
                boxShadow: active
                  ? (isDark ? '0 2px 8px rgba(108,92,231,0.4)' : '0 1px 4px rgba(0,0,0,0.1)')
                  : 'none',
                '&:active': { transform: 'scale(0.95)' },
              }}
            >
              {label}
            </Box>
          );
        })}
      </Box>

      {tab === 0 && (
        <OverviewTab
          users={users}
          isLoading={isLoading}
          currentUserId={currentUserId}
          periodKey={periodKey}
          selectedDay={selectedDay}
        />
      )}
      {tab === 1 && (
        <ByCategoryTab
          users={users}
          isLoading={isLoading}
          currentUserId={currentUserId}
        />
      )}
    </Box>
  );
}
