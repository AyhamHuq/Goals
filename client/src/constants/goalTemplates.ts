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
    units: ['minutes', 'hours', 'steps'],
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
    units: ['lectures', 'minutes', 'hours'],
    frequency_type: 'weekly',
    requiresStartValue: false,
  },
  {
    id: 'quran',
    label: 'Quran',
    icon: '🕌',
    description: 'Track Quran reading',
    goal_type: 'accumulation',
    unit: 'pages',
    units: ['pages', 'juz'],
    frequency_type: 'total',
    requiresStartValue: false,
  },
  {
    id: 'professional-learning',
    label: 'Professional Learning',
    icon: '💼',
    description: 'Track professional development',
    goal_type: 'accumulation',
    unit: 'hours',
    units: ['flashcards', 'minutes', 'hours', 'jobs'],
    frequency_type: 'daily',
    requiresStartValue: false,
  },
];
