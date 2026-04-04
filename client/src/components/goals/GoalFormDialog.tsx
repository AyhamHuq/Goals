import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  useMediaQuery,
  useTheme,
  IconButton,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Goal, FrequencyType, GoalType } from '../../types';
import { useCreateGoal, useUpdateGoal } from '../../hooks/useGoals';
import { useCategories } from '../../hooks/useCategories';
import { useUserContext } from '../../context/UserContext';
import { useToast } from '../Toast';
import { GOAL_TEMPLATES } from '../../constants/goalTemplates';

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
  { value: 'total',  label: 'Total for the month', description: 'Track a total amount for the month' },
  { value: 'daily',  label: 'Daily target',         description: 'Tracks pacing: target × days elapsed' },
  { value: 'weekly', label: 'Weekly target',        description: 'Tracks pacing: target × weeks elapsed' },
];

export default function GoalFormDialog({
  open,
  onClose,
  goal,
  userId,
  periodKey,
}: GoalFormDialogProps) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const { selectedUser } = useUserContext();
  const { showToast } = useToast();
  const groupId = selectedUser?.group_id;

  const { data: categories = [] } = useCategories(groupId);
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();

  const [form, setForm] = useState<FormState>(defaultForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

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
        unit: template.unit,
        frequency_type: template.frequency_type,
        start_value: '',
      }),
    }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
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
  const freqDescription = frequencyOptions.find((o) => o.value === form.frequency_type)?.description ?? '';

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Typography variant="h6">{goal ? 'Edit Goal' : 'New Goal'}</Typography>
        <IconButton size="small" onClick={onClose} disabled={isPending}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          <TextField
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            error={!!errors.title}
            helperText={errors.title}
            autoFocus
            fullWidth
            placeholder="e.g. Read 10 books"
          />

          <FormControl fullWidth size="small">
            <InputLabel id="category-label">Category (optional)</InputLabel>
            <Select
              labelId="category-label"
              value={form.category_id}
              label="Category (optional)"
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat.id} value={cat.id}>
                  {cat.icon ? `${cat.icon} ` : ''}{cat.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Stack direction="row" spacing={2}>
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
            <TextField
              label="Unit"
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              error={!!errors.unit}
              helperText={errors.unit}
              placeholder="books, km, mins…"
              sx={{ flex: 1 }}
            />
          </Stack>

          {/* Start value — measurement goals only */}
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

          {/* Frequency selector — accumulation goals only */}
          {form.goal_type === 'accumulation' && (
            <FormControl fullWidth size="small">
              <InputLabel id="freq-label">Frequency</InputLabel>
              <Select
                labelId="freq-label"
                value={form.frequency_type}
                label="Frequency"
                onChange={(e) =>
                  setForm((f) => ({ ...f, frequency_type: e.target.value as FrequencyType }))
                }
              >
                {frequencyOptions.map((o) => (
                  <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                ))}
              </Select>
              <FormHelperText>{freqDescription}</FormHelperText>
            </FormControl>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Box width="100%">
          <Button
            onClick={handleSubmit}
            variant="contained"
            fullWidth
            size="large"
            disabled={isPending}
            startIcon={isPending ? <CircularProgress size={16} color="inherit" /> : undefined}
          >
            {goal ? 'Save Changes' : 'Create Goal'}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}
