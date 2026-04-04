import { GoalType, FrequencyType } from '../types';

export interface GoalTemplate {
  id: string;
  label: string;
  icon: string;
  description: string;
  goal_type: GoalType;
  unit: string;        // default unit (first selection)
  units: string[];     // all available unit options
  frequency_type: FrequencyType;
  requiresStartValue: boolean;
}

export const GOAL_TEMPLATES: GoalTemplate[] = [
  {
    id: 'weight-loss',
    label: 'Weight Loss',
    icon: '⚖️',
    description: 'Track your weight toward a goal',
    goal_type: 'measurement',
    unit: 'lbs',
    units: ['lbs', 'kg'],
    frequency_type: 'total',
    requiresStartValue: true,
  },
  {
    id: 'fitness',
    label: 'Fitness',
    icon: '🏋️',
    description: 'Track fitness activity',
    goal_type: 'accumulation',
    unit: 'minutes',
    units: ['minutes', 'km', 'miles', 'reps'],
    frequency_type: 'daily',
    requiresStartValue: false,
  },
  {
    id: 'arabic-learning',
    label: 'Arabic Learning',
    icon: '📖',
    description: 'Log Arabic study progress',
    goal_type: 'accumulation',
    unit: 'lectures',
    units: ['lectures', 'pages', 'minutes'],
    frequency_type: 'weekly',
    requiresStartValue: false,
  },
];
