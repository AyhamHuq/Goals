import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Stack,
  FormHelperText,
  IconButton,
  CircularProgress,
  Box,
  Typography,
  useTheme,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { alpha } from '@mui/material/styles';
import { Goal, FrequencyType, GoalType } from '../../types';
import { useCreateGoal, useUpdateGoal } from '../../hooks/useGoals';
import { useCategories } from '../../hooks/useCategories';
import { useUserContext } from '../../context/UserContext';
import { useToast } from '../Toast';
import { GOAL_TEMPLATES } from '../../constants/goalTemplates';
import BottomSheet from '../shared/BottomSheet';

interface GoalFormDialogProps {
  open: boolean;
  onClose: () => void;
  goal?: Goal;
  userId: string;
  periodKey: string;
}

interface FormState {
  title: string;
  category_id: string;
  target_value: string;
  unit: string;
  frequency_type: FrequencyType;
  goal_type: GoalType;
  start_value: string;
}

const defaultForm: FormState = {
  title: '',
  category_id: '',
  target_value: '',
  unit: '',
  frequency_type: 'total',
  goal_type: 'accumulation',
  start_value: '',
};

const frequencyOptions: { value: FrequencyType; label: string; description: string }[] = [
  { value: 'total', label: 'Monthly total', description: 'Fixed total for the whole month' },
  { value: 'daily', label: 'Daily target', description: 'Amount per day, paced by days elapsed' },
  { value: 'weekly', label: 'Weekly target', description: 'Amount per week, paced by weeks elapsed' },
];

export default function GoalFormDialog({
  open, onClose, goal, userId, periodKey,
}: GoalFormDialogProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { selectedUser } = useUserContext();
  const { showToast } = useToast();
  const groupId = selectedUser?.group_id;

  const { data: categories = [] } = useCategories(groupId);
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();

  const [form, setForm] = useState<FormState>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const selectedTemplate = form.category_id
    ? (() => {
        const cat = categories.find((c) => c.id === form.category_id);
        return cat ? GOAL_TEMPLATES.find((t) => t.label.toLowerCase() === cat.name.toLowerCase()) : undefined;
      })()
    : undefined;

  const unitOptions: string[] = selectedTemplate?.units ?? [];
  const allUnitOptions =
    unitOptions.length > 0 && form.unit && !unitOptions.includes(form.unit)
      ? [...unitOptions, form.unit]
      : unitOptions;

  useEffect(() => {
    if (open) {
      if (goal) {
        setForm({
          title: goal.title,
          category_id: goal.category_id ?? '',
          target_value: String(goal.target_value),
          unit: goal.unit,
          frequency_type: goal.frequency_type,
          goal_type: goal.goal_type,
          start_value: goal.start_value != null ? String(goal.start_value) : '',
        });
      } else {
        setForm(defaultForm);
      }
      setErrors({});
    }
  }, [open, goal]);

  const handleCategoryChange = (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    const template = cat
      ? GOAL_TEMPLATES.find((t) => t.label.toLowerCase() === cat.name.toLowerCase())
      : undefined;
    setForm((f) => ({
      ...f,
      category_id: catId,
      ...(template && {
        goal_type: template.goal_type,
        unit: template.units[0] ?? template.unit,
        frequency_type: template.frequency_type,
        start_value: '',
      }),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.category_id) newErrors.category_id = 'Select a category';
    if (!form.target_value || isNaN(Number(form.target_value)) || Number(form.target_value) <= 0) {
      newErrors.target_value = 'Enter a positive number';
    }
    if (!form.unit.trim()) newErrors.unit = 'Unit is required';
    if (form.goal_type === 'measurement') {
      if (!form.start_value || isNaN(Number(form.start_value)) || Number(form.start_value) <= 0) {
        newErrors.start_value = 'Enter your current measurement';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload = {
      user_id: userId,
      category_id: form.category_id || null,
      period_key: periodKey,
      title: form.title.trim(),
      target_value: Number(form.target_value),
      unit: form.unit.trim(),
      frequency_type: form.frequency_type,
      goal_type: form.goal_type,
      ...(form.goal_type === 'measurement' && { start_value: Number(form.start_value) }),
    };
    try {
      if (goal) {
        await updateGoal.mutateAsync({ id: goal.id, data: payload });
        showToast({ message: 'Goal updated!', severity: 'success' });
      } else {
        await createGoal.mutateAsync(payload);
        showToast({ message: 'Goal created!', severity: 'success' });
      }
      onClose();
    } catch {
      showToast({ message: 'Failed to save goal. Please try again.', severity: 'error' });
    }
  };

  const isPending = createGoal.isPending || updateGoal.isPending;

  const content = (
    <>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: '-0.02em' }}>
          {goal ? 'Edit Goal' : 'New Goal'}
        </Typography>
        <IconButton size="small" onClick={onClose} disabled={isPending} sx={{ color: 'text.secondary' }}>
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          {/* Category — card grid */}
          <Box>
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.65rem', mb: 1, display: 'block' }}>
              Category {errors.category_id && <Box component="span" sx={{ color: 'error.main' }}>— {errors.category_id}</Box>}
            </Typography>
            <Box
              display="grid"
              gridTemplateColumns="1fr 1fr"
              gap={1}
            >
              {categories.map((cat) => {
                const template = GOAL_TEMPLATES.find((t) => t.label.toLowerCase() === cat.name.toLowerCase());
                const isSelected = form.category_id === cat.id;
                return (
                  <Box
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    sx={{
                      px: 1.5,
                      py: 1.25,
                      borderRadius: '14px',
                      border: '1.5px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      transition: 'border-color 0.15s ease, background 0.15s ease',
                      bgcolor: isSelected
                        ? alpha('#6C5CE7', isDark ? 0.15 : 0.08)
                        : 'transparent',
                      '&:active': { transform: 'scale(0.97)' },
                    }}
                  >
                    <Box sx={{ fontSize: 20, lineHeight: 1 }}>
                      {cat.icon ?? template?.icon ?? '🎯'}
                    </Box>
                    <Typography variant="body2" fontWeight={isSelected ? 700 : 500} color={isSelected ? 'primary.main' : 'text.primary'} sx={{ letterSpacing: '-0.01em' }}>
                      {cat.name}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {/* Target + Unit */}
          <Stack direction="row" spacing={1.5}>
            <TextField
              label="Target"
              type="number"
              value={form.target_value}
              onChange={(e) => setForm((f) => ({ ...f, target_value: e.target.value }))}
              error={!!errors.target_value}
              helperText={errors.target_value}
              inputProps={{ min: 0, step: 'any' }}
              sx={{ flex: 1 }}
            />
            {allUnitOptions.length > 0 ? (
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.65rem', mb: 0.75, display: 'block' }}>
                  Unit
                </Typography>
                <Box display="flex" flexWrap="wrap" gap={0.75}>
                  {allUnitOptions.map((u) => (
                    <Box
                      key={u}
                      onClick={() => setForm((f) => ({ ...f, unit: u }))}
                      sx={{
                        px: 1.5,
                        py: 0.6,
                        borderRadius: '100px',
                        border: '1.5px solid',
                        borderColor: form.unit === u ? 'primary.main' : 'divider',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: form.unit === u ? 700 : 500,
                        color: form.unit === u ? 'primary.main' : 'text.secondary',
                        bgcolor: form.unit === u ? alpha('#6C5CE7', isDark ? 0.15 : 0.07) : 'transparent',
                        transition: 'all 0.15s ease',
                        '&:active': { transform: 'scale(0.95)' },
                      }}
                    >
                      {u}
                    </Box>
                  ))}
                </Box>
                {errors.unit && <FormHelperText error>{errors.unit}</FormHelperText>}
              </Box>
            ) : (
              <TextField
                label="Unit"
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                error={!!errors.unit}
                helperText={errors.unit}
                placeholder="books, km, mins…"
                sx={{ flex: 1 }}
              />
            )}
          </Stack>

          {/* Note */}
          <TextField
            label="Note (optional)"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            fullWidth
            placeholder="e.g. Before bed, outdoor only…"
            helperText="Any extra context for this goal"
          />

          {/* Start value — measurement goals */}
          {form.goal_type === 'measurement' && (
            <TextField
              label={`Starting ${form.unit || 'value'} (your current measurement)`}
              type="number"
              value={form.start_value}
              onChange={(e) => setForm((f) => ({ ...f, start_value: e.target.value }))}
              error={!!errors.start_value}
              helperText={errors.start_value ?? `Where you're starting from, e.g. your weight today`}
              inputProps={{ min: 0, step: 'any' }}
              fullWidth
            />
          )}

          {/* Frequency selector — card chips */}
          {form.goal_type === 'accumulation' && (
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.65rem', mb: 1, display: 'block' }}>
                Frequency
              </Typography>
              <Stack spacing={0.75}>
                {frequencyOptions.map((o) => {
                  const isSelected = form.frequency_type === o.value;
                  return (
                    <Box
                      key={o.value}
                      onClick={() => setForm((f) => ({ ...f, frequency_type: o.value }))}
                      sx={{
                        px: 1.75,
                        py: 1.25,
                        borderRadius: '14px',
                        border: '1.5px solid',
                        borderColor: isSelected ? 'primary.main' : 'divider',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        bgcolor: isSelected ? alpha('#6C5CE7', isDark ? 0.15 : 0.07) : 'transparent',
                        '&:active': { transform: 'scale(0.98)' },
                      }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={isSelected ? 700 : 600}
                        color={isSelected ? 'primary.main' : 'text.primary'}
                        sx={{ letterSpacing: '-0.01em' }}
                      >
                        {o.label}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {o.description}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 1.5 }}>
        <Button
          onClick={handleSubmit}
          variant="contained"
          fullWidth
          size="large"
          disabled={isPending}
          startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ py: 1.6, fontSize: '1rem', borderRadius: 3, minHeight: 54 }}
        >
          {goal ? 'Save Changes' : 'Create Goal'}
        </Button>
      </DialogActions>
    </>
  );

  return (
    <BottomSheet open={open} onClose={onClose} maxWidth="sm">
      {content}
    </BottomSheet>
  );
}
