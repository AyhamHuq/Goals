import { describe, it, expect } from 'vitest';
import {
  formatPercentage,
  fmtValue,
  getMonthlyTotal,
  getMonthlyLabel,
  getMonthlyDisplay,
} from '../frequency';
import type { GoalWithProgress } from '../../types';

function makeGoal(overrides: Partial<GoalWithProgress> = {}): GoalWithProgress {
  return {
    id: 'test-id',
    title: 'Test Goal',
    category: null,
    target_value: 10,
    unit: 'books',
    frequency_type: 'total',
    goal_type: 'accumulation',
    start_value: null,
    current_value: 0,
    expected_value: null,
    percentage: 0,
    on_track: null,
    recent_entries: [],
    ...overrides,
  };
}

// ── formatPercentage ────────────────────────────────────────────────────────

describe('formatPercentage', () => {
  it('formats a normal percentage', () => {
    expect(formatPercentage(33.3)).toBe('33%');
  });

  it('rounds to nearest integer', () => {
    expect(formatPercentage(66.6)).toBe('67%');
  });

  it('caps at 100% when value exceeds 100', () => {
    expect(formatPercentage(105)).toBe('100%');
    expect(formatPercentage(250)).toBe('100%');
  });

  it('returns 0% for zero', () => {
    expect(formatPercentage(0)).toBe('0%');
  });

  it('rounds up to 100% at boundary', () => {
    expect(formatPercentage(99.6)).toBe('100%');
  });

  it('handles exactly 100%', () => {
    expect(formatPercentage(100)).toBe('100%');
  });
});

// ── fmtValue ────────────────────────────────────────────────────────────────

describe('fmtValue', () => {
  it('returns integer as string with no decimal', () => {
    expect(fmtValue(5)).toBe('5');
    expect(fmtValue(0)).toBe('0');
    expect(fmtValue(100)).toBe('100');
  });

  it('returns one decimal for small non-integers', () => {
    expect(fmtValue(5.5)).toBe('5.5');
    expect(fmtValue(2.3)).toBe('2.3');
  });

  it('rounds to integer for values >= 10 with decimals', () => {
    expect(fmtValue(10.7)).toBe('11');
    expect(fmtValue(15.4)).toBe('15');
  });

  it('handles negative values', () => {
    expect(fmtValue(-5)).toBe('-5');
  });
});

// ── getMonthlyTotal ─────────────────────────────────────────────────────────

describe('getMonthlyTotal', () => {
  it('multiplies by 30 for daily goals', () => {
    expect(getMonthlyTotal('daily', 2)).toBe(60);
    expect(getMonthlyTotal('daily', 0.5)).toBe(15);
  });

  it('multiplies by 5 (ceil(30/7)) for weekly goals', () => {
    expect(getMonthlyTotal('weekly', 3)).toBe(15);
    expect(getMonthlyTotal('weekly', 2)).toBe(10);
  });

  it('returns target unchanged for total goals', () => {
    expect(getMonthlyTotal('total', 10)).toBe(10);
    expect(getMonthlyTotal('total', 4)).toBe(4);
  });
});

// ── getMonthlyLabel ─────────────────────────────────────────────────────────

describe('getMonthlyLabel', () => {
  it('shows Target label for measurement goals', () => {
    const goal = makeGoal({ goal_type: 'measurement', target_value: 75, unit: 'kg' });
    expect(getMonthlyLabel(goal)).toBe('Target: 75 kg');
  });

  it('shows monthly total with ~ for daily goals', () => {
    const goal = makeGoal({ frequency_type: 'daily', target_value: 2, unit: 'km' });
    // daily: 2 * 30 = 60, isApprox = true → ~60 km/month
    expect(getMonthlyLabel(goal)).toBe('~60 km/month');
  });

  it('shows monthly total with ~ for weekly goals', () => {
    const goal = makeGoal({ frequency_type: 'weekly', target_value: 3, unit: 'workouts' });
    // weekly: 3 * 5 = 15, isApprox = true → ~15 workouts/month
    expect(getMonthlyLabel(goal)).toBe('~15 workouts/month');
  });

  it('shows monthly total without ~ for total goals', () => {
    const goal = makeGoal({ frequency_type: 'total', target_value: 4, unit: 'books' });
    expect(getMonthlyLabel(goal)).toBe('4 books/month');
  });
});

// ── getMonthlyDisplay ───────────────────────────────────────────────────────

describe('getMonthlyDisplay', () => {
  it('passes measurement goal through unchanged', () => {
    const goal = makeGoal({
      goal_type: 'measurement',
      target_value: 75,
      current_value: 82,
      expected_value: 85,
      unit: 'kg',
    });
    const display = getMonthlyDisplay(goal);
    expect(display.monthlyTarget).toBe(75);
    expect(display.current).toBe(82);
    expect(display.expected).toBe(85);
    expect(display.unit).toBe('kg');
    expect(display.isApprox).toBe(false);
  });

  it('scales daily minutes to hours when monthly total >= 60', () => {
    // daily 30 mins → monthly = 900 mins → scaled to 15 hours (900/60)
    const goal = makeGoal({
      frequency_type: 'daily',
      target_value: 30,
      unit: 'minutes',
      current_value: 450, // raw minutes
      expected_value: null,
    });
    const display = getMonthlyDisplay(goal);
    expect(display.unit).toBe('hours');
    expect(display.monthlyTarget).toBe(15); // 900 / 60 = 15 hours
    expect(display.current).toBe(7.5); // 450 * (15/900) = 7.5 hours
    expect(display.isApprox).toBe(true);
  });

  it('does not scale minutes when monthly total < 60', () => {
    // daily 1 min → monthly = 30 mins → no scaling
    const goal = makeGoal({
      frequency_type: 'daily',
      target_value: 1,
      unit: 'minutes',
      current_value: 10,
    });
    const display = getMonthlyDisplay(goal);
    expect(display.unit).toBe('minutes');
    expect(display.monthlyTarget).toBe(30);
  });

  it('sets isApprox true for daily and weekly, false for total', () => {
    expect(getMonthlyDisplay(makeGoal({ frequency_type: 'daily' })).isApprox).toBe(true);
    expect(getMonthlyDisplay(makeGoal({ frequency_type: 'weekly' })).isApprox).toBe(true);
    expect(getMonthlyDisplay(makeGoal({ frequency_type: 'total' })).isApprox).toBe(false);
  });

  it('scales expected_value when unit is converted', () => {
    const goal = makeGoal({
      frequency_type: 'daily',
      target_value: 30,
      unit: 'minutes',
      current_value: 0,
      expected_value: 300, // 300 raw minutes
    });
    const display = getMonthlyDisplay(goal);
    // scale = 15/900 = 1/60; 300 * (1/60) = 5 hours
    expect(display.expected).toBeCloseTo(5);
  });

  it('passes expected_value=null through', () => {
    const goal = makeGoal({ expected_value: null });
    expect(getMonthlyDisplay(goal).expected).toBeNull();
  });
});
