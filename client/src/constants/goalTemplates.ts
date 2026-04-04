import { GoalType, FrequencyType } from '../types';

export interface GoalTemplate {
  id: string;
  label: string;
  icon: string;
  description: string;
  goal_type: GoalType;
  unit: string;
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
    unit: 'kg',
    frequency_type: 'total',
    requiresStartValue: true,
  },
  {
    id: 'arabic-learning',
    label: 'Arabic Learning',
    icon: '📖',
    description: 'Log Arabic lectures per week',
    goal_type: 'accumulation',
    unit: 'lectures',
    frequency_type: 'weekly',
    requiresStartValue: false,
  },
  {
    id: 'fitness',
    label: 'Fitness',
    icon: '🏋️',
    description: 'Track daily exercise minutes',
    goal_type: 'accumulation',
    unit: 'minutes',
    frequency_type: 'daily',
    requiresStartValue: false,
  },
  {
    id: 'quran',
    label: 'Quran',
    icon: '🕌',
    description: 'Track Quran recitation sessions',
    goal_type: 'accumulation',
    unit: 'lectures',
    frequency_type: 'total',
    requiresStartValue: false,
  },
];
