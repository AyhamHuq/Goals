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
} from '@mui/material';
import { Goal, FrequencyType } from '../../types';
import { useCreateGoal, useUpdateGoal } from '../../hooks/useGoals';
import { useCategories } from '../../hooks/useCategories';
import { useUserContext } from '../../context/UserContext';

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
}

const defaultForm: FormState = {
  title: '',
  category_id: '',
  target_value: '',
  unit: '',
  frequency_type: 'total',
};

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
        });
      } else {
        setForm(defaultForm);
      }
      setErrors({});
    }
  }, [open, goal]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormState, string>> = {};
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.target_value || isNaN(Number(form.target_value)) || Number(form.target_value) <= 0) {
      newErrors.target_value = 'Enter a positive number';
    }
    if (!form.unit.trim()) newErrors.unit = 'Unit is required';
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
    };
    if (goal) {
      await updateGoal.mutateAsync({ id: goal.id, data: payload });
    } else {
      await createGoal.mutateAsync(payload);
    }
    onClose();
  };

  const isPending = createGoal.isPending || updateGoal.isPending;

  return (
    <Dialog open={open} onClose={onClose} fullScreen={fullScreen} maxWidth="sm" fullWidth>
      <DialogTitle>{goal ? 'Edit Goal' : 'New Goal'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            error={!!errors.title}
            helperText={errors.title}
            autoFocus
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel id="category-label">Category (optional)</InputLabel>
            <Select
              labelId="category-label"
              value={form.category_id}
              label="Category (optional)"
              onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
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
              placeholder="e.g. books, km, mins"
              sx={{ flex: 1 }}
            />
          </Stack>

          <FormControl fullWidth>
            <InputLabel id="freq-label">Frequency</InputLabel>
            <Select
              labelId="freq-label"
              value={form.frequency_type}
              label="Frequency"
              onChange={(e) =>
                setForm((f) => ({ ...f, frequency_type: e.target.value as FrequencyType }))
              }
            >
              <MenuItem value="total">Total for the month</MenuItem>
              <MenuItem value="daily">Per day</MenuItem>
              <MenuItem value="weekly">Per week</MenuItem>
            </Select>
            <FormHelperText>
              {form.frequency_type === 'total' && 'Track a total amount for the month'}
              {form.frequency_type === 'daily' && 'Tracks pacing: target × days elapsed'}
              {form.frequency_type === 'weekly' && 'Tracks pacing: target × weeks elapsed'}
            </FormHelperText>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isPending}>
          {goal ? 'Save Changes' : 'Create Goal'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
