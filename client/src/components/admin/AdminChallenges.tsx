import React, { useState } from 'react';
import {
  Box, Typography, Button, Card, CardContent, TextField, Chip, Avatar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, LinearProgress,
  Divider, Stack, IconButton, Tooltip, Select, MenuItem, InputLabel, FormControl,
} from '@mui/material';
import {
  EmojiEvents, CardGiftcard, Timer, Cancel, CheckCircle,
  History, PlayArrow, Star,
} from '@mui/icons-material';
import {
  useCurrentChallenge,
  useChallengeActivity,
  useChallengeHistory,
  useCreateChallenge,
  usePickWinner,
  useSetLeader,
  useCancelChallenge,
  useAdminUsers,
} from '../../hooks/useAdmin';

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export default function AdminChallenges() {
  const [durationDays, setDurationDays] = useState(10);
  const [giftCardName, setGiftCardName] = useState('');
  const [giftCardAmount, setGiftCardAmount] = useState('');
  const [confirmWinner, setConfirmWinner] = useState<{ userId: string; name: string } | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState('');

  // Get group_id from users API on mount
  const [groupIdState, setGroupIdState] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (!groupIdState) {
      import('../../api/client').then(({ default: apiClient }) => {
        apiClient.get('/users').then(res => {
          if (res.data?.length > 0) {
            setGroupIdState(res.data[0].group_id);
          }
        }).catch(() => {});
      });
    }
  }, [groupIdState]);

  const { data: users } = useAdminUsers(defaultFrom(), today());
  const { data: currentChallenge, isLoading: loadingCurrent } = useCurrentChallenge(groupIdState);
  const { data: activityFeed, isLoading: loadingActivity } = useChallengeActivity(
    currentChallenge?.status === 'judging' ? currentChallenge.id : undefined,
  );
  const { data: history } = useChallengeHistory(groupIdState);

  const createMutation = useCreateChallenge();
  const pickWinnerMutation = usePickWinner();
  const setLeaderMutation = useSetLeader();
  const cancelMutation = useCancelChallenge();

  const handleCreate = () => {
    if (!groupIdState) return;
    createMutation.mutate({
      groupId: groupIdState,
      durationDays,
      giftCardName: giftCardName || undefined,
      giftCardAmount: giftCardAmount || undefined,
    }, {
      onSuccess: () => {
        setGiftCardName('');
        setGiftCardAmount('');
      },
    });
  };

  const handlePickWinner = () => {
    if (!confirmWinner || !currentChallenge) return;
    pickWinnerMutation.mutate(
      { challengeId: currentChallenge.id, userId: confirmWinner.userId },
      { onSuccess: () => setConfirmWinner(null) },
    );
  };

  const handleSetLeader = () => {
    if (!selectedLeader || !currentChallenge) return;
    setLeaderMutation.mutate(
      { challengeId: currentChallenge.id, userId: selectedLeader },
      { onSuccess: () => setSelectedLeader('') },
    );
  };

  const handleCancel = () => {
    if (!currentChallenge) return;
    cancelMutation.mutate(currentChallenge.id, {
      onSuccess: () => setConfirmCancel(false),
    });
  };

  if (!groupIdState) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  const challengeWithDetails = currentChallenge as typeof currentChallenge & {
    days_remaining?: number;
    gift_card_name?: string | null;
    gift_card_amount?: string | null;
    leader_id?: string | null;
    leader_name?: string | null;
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CardGiftcard /> Gift Card Challenges
      </Typography>

      {/* Current Challenge Status */}
      {loadingCurrent ? (
        <LinearProgress sx={{ my: 2 }} />
      ) : !currentChallenge ? (
        /* No active challenge — show create form */
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Start a New Challenge</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Create a timed challenge. Players will see a countdown and know a gift card is at stake.
              At the end, you review activity and pick a winner.
            </Typography>
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                <TextField
                  type="number"
                  label="Duration (days)"
                  value={durationDays}
                  onChange={e => setDurationDays(Math.max(1, Number(e.target.value)))}
                  size="small"
                  sx={{ width: 150 }}
                  inputProps={{ min: 1, max: 90 }}
                />
                <TextField
                  label="Gift Card Name"
                  placeholder="e.g. Amazon, Starbucks"
                  value={giftCardName}
                  onChange={e => setGiftCardName(e.target.value)}
                  size="small"
                  sx={{ width: 200 }}
                />
                <TextField
                  label="Amount"
                  placeholder="e.g. 25"
                  value={giftCardAmount}
                  onChange={e => setGiftCardAmount(e.target.value)}
                  size="small"
                  sx={{ width: 120 }}
                  InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary' }}>$</Typography> }}
                />
              </Stack>
              <Box>
                <Button
                  variant="contained"
                  startIcon={<PlayArrow />}
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Starting...' : 'Start Challenge'}
                </Button>
              </Box>
            </Stack>
            {createMutation.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {(createMutation.error as Error).message || 'Failed to create challenge'}
              </Alert>
            )}
          </CardContent>
        </Card>
      ) : currentChallenge.status === 'active' ? (
        /* Active challenge — show countdown + leader controls */
        <Card sx={{ mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Timer color="primary" />
              <Typography variant="h6">Challenge In Progress</Typography>
              <Chip label="Active" color="primary" size="small" />
            </Stack>
            <Typography variant="h3" fontWeight={700} color="primary.main" sx={{ mb: 1 }}>
              {challengeWithDetails?.days_remaining ?? '?'} days remaining
            </Typography>
            {(challengeWithDetails?.gift_card_name || challengeWithDetails?.gift_card_amount) && (
              <Typography variant="body1" sx={{ mb: 1 }}>
                Prize: {challengeWithDetails.gift_card_amount ? `$${challengeWithDetails.gift_card_amount} ` : ''}
                {challengeWithDetails.gift_card_name || 'Gift Card'}
              </Typography>
            )}
            <Typography color="text.secondary">
              {currentChallenge.start_date} to {currentChallenge.end_date}
            </Typography>

            {/* Leader selection */}
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Star sx={{ fontSize: 18, color: '#FFB830' }} /> Current Leader
            </Typography>
            {challengeWithDetails?.leader_name ? (
              <Chip
                label={challengeWithDetails.leader_name}
                color="warning"
                icon={<Star />}
                sx={{ mb: 1 }}
              />
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                No leader set yet
              </Typography>
            )}
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Set Leader</InputLabel>
                <Select
                  value={selectedLeader}
                  onChange={e => setSelectedLeader(e.target.value)}
                  label="Set Leader"
                >
                  {users?.map(u => (
                    <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                size="small"
                onClick={handleSetLeader}
                disabled={!selectedLeader || setLeaderMutation.isPending}
              >
                {setLeaderMutation.isPending ? 'Saving...' : 'Update'}
              </Button>
            </Stack>

            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={() => setConfirmCancel(true)}
              sx={{ mt: 3 }}
              size="small"
            >
              Cancel Challenge
            </Button>
          </CardContent>
        </Card>
      ) : currentChallenge.status === 'judging' ? (
        /* Judging — show activity feed with pick winner buttons */
        <Card sx={{ mb: 3, border: '2px solid', borderColor: 'warning.main' }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <EmojiEvents color="warning" />
              <Typography variant="h6">Time to Pick a Winner!</Typography>
              <Chip label="Judging" color="warning" size="small" />
            </Stack>
            {(challengeWithDetails?.gift_card_name || challengeWithDetails?.gift_card_amount) && (
              <Typography variant="body1" sx={{ mb: 1 }}>
                Prize: {challengeWithDetails.gift_card_amount ? `$${challengeWithDetails.gift_card_amount} ` : ''}
                {challengeWithDetails.gift_card_name || 'Gift Card'}
              </Typography>
            )}
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Challenge ran from {currentChallenge.start_date} to {currentChallenge.end_date}. Review each player's activity below and pick a winner.
            </Typography>

            {loadingActivity ? (
              <LinearProgress />
            ) : activityFeed ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Player</TableCell>
                      <TableCell align="center">Days Logged</TableCell>
                      <TableCell align="center">Consistency</TableCell>
                      <TableCell>Completions</TableCell>
                      <TableCell align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activityFeed.users.map(user => (
                      <React.Fragment key={user.user_id}>
                        <TableRow>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <Avatar sx={{ bgcolor: user.avatar_color, width: 28, height: 28, fontSize: 14 }}>
                                {user.display_name[0]}
                              </Avatar>
                              <Typography variant="body2" fontWeight={600}>{user.display_name}</Typography>
                            </Stack>
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" fontWeight={700}>
                              {user.days_logged} / {user.total_days}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <LinearProgress
                              variant="determinate"
                              value={(user.days_logged / user.total_days) * 100}
                              sx={{ height: 8, borderRadius: 4, minWidth: 80 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {Math.round((user.days_logged / user.total_days) * 100)}%
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                              {user.completions.map(date => (
                                <Chip
                                  key={date}
                                  label={date.slice(5)}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  sx={{ fontSize: 11 }}
                                />
                              ))}
                            </Stack>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title={`Pick ${user.display_name} as winner`}>
                              <IconButton
                                color="primary"
                                onClick={() => setConfirmWinner({ userId: user.user_id, name: user.display_name })}
                                disabled={pickWinnerMutation.isPending}
                              >
                                <EmojiEvents />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                        {user.progress_entries.length > 0 && (
                          <TableRow>
                            <TableCell colSpan={5} sx={{ py: 0.5, pl: 6 }}>
                              <Typography variant="caption" color="text.secondary">
                                Recent activity:{' '}
                                {user.progress_entries.slice(0, 5).map((e, i) => (
                                  <span key={e.id}>
                                    {i > 0 && ' | '}
                                    {e.goal_title}: {e.value} {e.unit} ({e.logged_for.slice(5)})
                                    {e.note && ` - "${e.note}"`}
                                  </span>
                                ))}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : null}

            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={() => setConfirmCancel(true)}
              sx={{ mt: 2 }}
              size="small"
            >
              Cancel Without Winner
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Challenge History */}
      {history && history.length > 0 && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <History /> Past Challenges
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell>Prize</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Winner</TableCell>
                  <TableCell>Awarded</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.filter(c => c.status === 'completed' || c.status === 'cancelled').map(c => (
                  <TableRow key={c.id}>
                    <TableCell>{c.start_date} to {c.end_date}</TableCell>
                    <TableCell>
                      {c.gift_card_name
                        ? `${c.gift_card_amount ? `$${c.gift_card_amount} ` : ''}${c.gift_card_name}`
                        : <Typography variant="body2" color="text.secondary">—</Typography>}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={c.status}
                        size="small"
                        color={c.status === 'completed' ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {c.winner_name ? (
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <CheckCircle color="success" sx={{ fontSize: 16 }} />
                          <Typography variant="body2">{c.winner_name}</Typography>
                        </Stack>
                      ) : (
                        <Typography variant="body2" color="text.secondary">—</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {c.awarded_at ? new Date(c.awarded_at).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Confirm Winner Dialog */}
      <Dialog open={!!confirmWinner} onClose={() => setConfirmWinner(null)}>
        <DialogTitle>Confirm Winner</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to select <strong>{confirmWinner?.name}</strong> as the winner?
            They will receive a push notification, and you'll need to send them a gift card.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmWinner(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePickWinner}
            disabled={pickWinnerMutation.isPending}
          >
            {pickWinnerMutation.isPending ? 'Selecting...' : 'Confirm Winner'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Cancel Dialog */}
      <Dialog open={confirmCancel} onClose={() => setConfirmCancel(false)}>
        <DialogTitle>Cancel Challenge</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this challenge? No winner will be selected.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmCancel(false)}>Keep Challenge</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleCancel}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Challenge'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
