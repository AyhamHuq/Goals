import React, { useState } from 'react';
import {
  Box,
  Typography,
  Avatar,
  LinearProgress,
  Chip,
  Skeleton,
  Stack,
  Card,
  CardContent,
  Tabs,
  Tab,
  Collapse,
  Divider,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useGroupDashboard } from '../../hooks/useDashboard';
import { usePeriodContext } from '../../context/PeriodContext';
import { useUserContext } from '../../context/UserContext';
import { GoalWithProgress, UserGoalSummary } from '../../types';
import { formatPercentage, getMonthlyLabel, getMonthlyDisplay, fmtValue } from '../../utils/frequency';
import { periodKeyToLabel, periodProportionalThreshold } from '../../utils/dates';
import { GOAL_TEMPLATES } from '../../constants/goalTemplates';
import ProgressHistoryDrawer from '../progress/ProgressHistoryDrawer';

// ── Color helpers (mirrors GoalCard logic) ────────────────────────────────────

type PacingColor = 'success' | 'warning' | 'error' | 'primary';

const colorHexMap: Record<PacingColor, string> = {
  success: '#66BB6A',
  warning: '#FFA726',
  error:   '#EF5350',
  primary: '#5C6BC0',
};

function getProgressColor(goal: GoalWithProgress): PacingColor {
  if (goal.on_track === null) return 'primary';
  if (goal.on_track) return 'success';
  if (goal.goal_type !== 'measurement' && goal.expected_value !== null && goal.expected_value > 0) {
    const ratio = goal.current_value / goal.expected_value;
    if (ratio >= 0.8) return 'warning';
  }
  return 'error';
}

function goalDerivedLabel(goal: GoalWithProgress, includeCategory = false): string {
  const base = getMonthlyLabel(goal);
  return includeCategory && goal.category ? `${goal.category.name}: ${base}` : base;
}

// ── Category view data model ──────────────────────────────────────────────────

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
        const template = GOAL_TEMPLATES.find(
          (t) => t.label.toLowerCase() === name.toLowerCase(),
        );
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

  // Sort entries by percentage desc, assign ranks
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

  // Sort sections alphabetically; uncategorized last
  return sections.sort((a, b) => {
    if (a.categoryId === null) return 1;
    if (b.categoryId === null) return -1;
    return a.categoryName.localeCompare(b.categoryName);
  });
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function UserCardSkeleton() {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1.5} mb={1.5}>
          <Skeleton variant="circular" width={44} height={44} />
          <Box flex={1}>
            <Skeleton variant="text" width="40%" height={20} />
            <Skeleton variant="text" width="60%" height={16} />
          </Box>
          <Skeleton variant="text" width={48} height={20} />
        </Box>
        <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 6 }} />
      </CardContent>
    </Card>
  );
}

// ── Overview tab (by person) ──────────────────────────────────────────────────

function avgPercentage(goals: GoalWithProgress[]): number {
  if (!goals.length) return 0;
  return goals.reduce((sum, g) => sum + g.percentage, 0) / goals.length;
}

interface DrawerState {
  goal: GoalWithProgress;
  userId: string;
}

function OverviewTab({
  users,
  isLoading,
  currentUserId,
  periodKey,
}: {
  users: UserGoalSummary[];
  isLoading: boolean;
  currentUserId: string;
  periodKey: string;
}) {
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const threshold = periodProportionalThreshold(periodKey);

  if (isLoading) {
    return (
      <Stack spacing={2}>
        {[1, 2, 3, 4].map((i) => <UserCardSkeleton key={i} />)}
      </Stack>
    );
  }

  const hasAnyGoals = users.some((u) => u.goals.length > 0);

  if (!hasAnyGoals) {
    return (
      <Box py={6} textAlign="center">
        <Typography color="text.secondary">
          No one has set goals for this period yet.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Stack spacing={2}>
        {users.map(({ user, goals }) => {
          const avg = avgPercentage(goals);
          const onTrack = goals.filter(
            (g) => g.on_track === true || (g.on_track === null && g.percentage >= threshold),
          ).length;
          const barColor: 'success' | 'warning' | 'error' =
            goals.length > 0 && onTrack === goals.length ? 'success' :
            avg >= 80 ? 'success' : avg >= 50 ? 'warning' : 'error';
          const isChampion = avg >= 80;
          const isExpanded = expandedUserId === user.id;

          return (
            <Card key={user.id} sx={{ borderRadius: 2 }}>
              <CardContent
                sx={{ cursor: goals.length > 0 ? 'pointer' : 'default', '&:hover': goals.length > 0 ? { bgcolor: 'action.hover' } : {} }}
                onClick={() => goals.length > 0 && setExpandedUserId(isExpanded ? null : user.id)}
              >
                <Box display="flex" alignItems="center" gap={1.5} mb={1.25}>
                  <Avatar
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: user.avatar_color,
                      fontSize: 18,
                      fontWeight: 700,
                    }}
                  >
                    {user.display_name[0].toUpperCase()}
                  </Avatar>
                  <Box flex={1} minWidth={0}>
                    <Box display="flex" alignItems="center" gap={0.75}>
                      <Typography fontWeight={700} noWrap>
                        {user.display_name}
                      </Typography>
                      {isChampion && (
                        <EmojiEventsIcon sx={{ fontSize: 16, color: '#FFA726' }} />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {goals.length === 0
                        ? 'No goals this period'
                        : `${onTrack}/${goals.length} goals on track`}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Chip
                      label={formatPercentage(avg)}
                      size="small"
                      color={barColor}
                      sx={{ fontWeight: 700, minWidth: 52 }}
                    />
                    {goals.length > 0 && (
                      isExpanded
                        ? <ExpandLessIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                        : <ExpandMoreIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    )}
                  </Box>
                </Box>

                {goals.length > 0 && (
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(avg, 100)}
                    color={barColor}
                    sx={{ height: 8, borderRadius: 6 }}
                  />
                )}
              </CardContent>

              {/* Expanded goal list */}
              <Collapse in={isExpanded}>
                <Divider />
                <Box sx={{ px: 2, pt: 1, pb: 1.5 }}>
                  <Stack spacing={0}>
                    {goals.map((goal, idx) => {
                      const color = getProgressColor(goal);
                      const hex = colorHexMap[color];
                      return (
                        <Box key={goal.id}>
                          {idx > 0 && <Divider sx={{ my: 0.75 }} />}
                          <Box
                            onClick={() => setDrawer({ goal, userId: user.id })}
                            sx={{
                              py: 0.75,
                              px: 0.5,
                              cursor: 'pointer',
                              borderRadius: 1,
                              '&:hover': { bgcolor: 'action.hover' },
                            }}
                          >
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.4}>
                              <Box minWidth={0} flex={1} mr={1}>
                                <Typography variant="body2" fontWeight={600} noWrap>
                                  {goalDerivedLabel(goal, true)}
                                </Typography>
                                {goal.title && (
                                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                                    {goal.title}
                                  </Typography>
                                )}
                              </Box>
                              <Chip
                                label={formatPercentage(goal.percentage)}
                                size="small"
                                sx={{
                                  bgcolor: alpha(hex, 0.12),
                                  color: hex,
                                  fontWeight: 700,
                                  fontSize: '0.65rem',
                                  height: 20,
                                  flexShrink: 0,
                                }}
                              />
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(goal.percentage, 100)}
                              color={color}
                              sx={{ height: 5, borderRadius: 4 }}
                            />
                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={0.3}>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                {(() => {
                                  const m = getMonthlyDisplay(goal);
                                  const ap = m.isApprox ? '~' : '';
                                  if (goal.goal_type === 'measurement') {
                                    return `${fmtValue(goal.current_value)} → ${goal.target_value} ${goal.unit}${m.expected !== null ? ` · ${fmtValue(m.expected)} exp` : ''}`;
                                  }
                                  return `${fmtValue(m.current)} / ${ap}${fmtValue(m.monthlyTarget)} ${m.unit}${m.expected !== null ? ` · ${fmtValue(m.expected)} exp` : ''}`;
                                })()}
                              </Typography>
                              {goal.on_track !== null && (
                                <Box display="flex" alignItems="center" gap={0.3}>
                                  {goal.on_track ? (
                                    <CheckCircleOutlineIcon sx={{ fontSize: 11, color: colorHexMap.success }} />
                                  ) : (
                                    <HighlightOffIcon sx={{ fontSize: 11, color: colorHexMap.error }} />
                                  )}
                                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: goal.on_track ? colorHexMap.success : colorHexMap.error, fontWeight: 600 }}>
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

// ── By Category tab ───────────────────────────────────────────────────────────

const rankColors: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' };

function ByCategoryTab({
  users,
  isLoading,
  currentUserId,
}: {
  users: UserGoalSummary[];
  isLoading: boolean;
  currentUserId: string;
}) {
  const [drawer, setDrawer] = useState<DrawerState | null>(null);

  if (isLoading) {
    return (
      <Stack spacing={2}>
        {[1, 2].map((i) => <UserCardSkeleton key={i} />)}
      </Stack>
    );
  }

  const sections = buildCategoryView(users);

  if (sections.length === 0) {
    return (
      <Box py={6} textAlign="center">
        <Typography color="text.secondary">
          No goals to compare yet.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Stack spacing={3}>
        {sections.map((section) => (
          <Box key={section.categoryId ?? '__none__'}>
            {/* Section header */}
            <Typography variant="subtitle1" fontWeight={700} mb={1.25}>
              {section.categoryIcon} {section.categoryName}
            </Typography>

            <Card sx={{ borderRadius: 2 }}>
              <CardContent sx={{ pb: '12px !important' }}>
                <Stack spacing={1.5}>
                  {section.entries.map(({ user, goal, rank }, idx) => {
                    const color = getProgressColor(goal);
                    const hex = colorHexMap[color];
                    const showPacing = goal.on_track !== null;

                    return (
                      <Box key={`${user.id}-${goal.id}`}>
                        {idx > 0 && (
                          <Box
                            sx={{ height: '1px', bgcolor: 'divider', mb: 1.5 }}
                          />
                        )}
                        <Box
                          onClick={() => setDrawer({ goal, userId: user.id })}
                          sx={{ cursor: 'pointer', borderRadius: 1, '&:hover': { bgcolor: 'action.hover' }, p: 0.5, mx: -0.5 }}
                        >
                          <Box display="flex" alignItems="center" gap={1.25}>
                            {/* Rank badge */}
                            <Typography
                              variant="caption"
                              fontWeight={700}
                              sx={{
                                width: 22,
                                textAlign: 'center',
                                color: rankColors[rank] ?? 'text.secondary',
                                flexShrink: 0,
                              }}
                            >
                              #{rank}
                            </Typography>

                            {/* Avatar */}
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: user.avatar_color,
                                fontSize: 13,
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {user.display_name[0].toUpperCase()}
                            </Avatar>

                            {/* Name + goal label */}
                            <Box flex={1} minWidth={0}>
                              <Typography variant="body2" fontWeight={700} noWrap>
                                {user.display_name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" noWrap display="block">
                                {goalDerivedLabel(goal)}
                                {goal.title ? ` (${goal.title})` : ''}
                              </Typography>
                            </Box>

                            {/* Percentage chip */}
                            <Chip
                              label={formatPercentage(goal.percentage)}
                              size="small"
                              sx={{
                                bgcolor: alpha(hex, 0.12),
                                color: hex,
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                height: 22,
                                minWidth: 44,
                                flexShrink: 0,
                              }}
                            />
                          </Box>

                          {/* Progress bar row */}
                          <Box display="flex" alignItems="center" gap={1} mt={0.75} pl={`${22 + 8 + 32 + 10}px`}>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(goal.percentage, 100)}
                              color={color}
                              sx={{ flex: 1, height: 6, borderRadius: 4 }}
                            />
                            {showPacing && (
                              <Box display="flex" alignItems="center" gap={0.4} flexShrink={0}>
                                {goal.on_track ? (
                                  <>
                                    <CheckCircleOutlineIcon sx={{ fontSize: 12, color: colorHexMap.success }} />
                                    <Typography variant="caption" sx={{ color: colorHexMap.success, fontWeight: 600, fontSize: '0.65rem' }}>
                                      On pace
                                    </Typography>
                                  </>
                                ) : (
                                  <>
                                    <HighlightOffIcon sx={{ fontSize: 12, color: colorHexMap.error }} />
                                    <Typography variant="caption" sx={{ color: colorHexMap.error, fontWeight: 600, fontSize: '0.65rem' }}>
                                      Behind
                                    </Typography>
                                  </>
                                )}
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

// ── Root component ────────────────────────────────────────────────────────────

export default function GroupDashboard() {
  const { selectedUser } = useUserContext();
  const { periodKey, selectedDay } = usePeriodContext();
  const groupId = selectedUser?.group_id;
  const [tab, setTab] = useState(0);

  const { data, isLoading, isError } = useGroupDashboard(groupId, periodKey, selectedDay);

  if (isError) {
    return (
      <Box py={4} textAlign="center">
        <Typography color="error">Failed to load group dashboard.</Typography>
      </Box>
    );
  }

  const users = data?.users ?? [];
  const currentUserId = selectedUser?.id ?? '';

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={0.5}>
        Family Overview
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>
        {periodKeyToLabel(periodKey)}
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2.5, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="Overview" />
        <Tab label="By Category" />
      </Tabs>

      {tab === 0 && (
        <OverviewTab
          users={users}
          isLoading={isLoading}
          currentUserId={currentUserId}
          periodKey={periodKey}
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
