import { calcProgress } from '../frequencyCalc';

const PERIOD = '2026-04'; // April 2026 — 30 days

describe('calcProgress — total', () => {
  it('returns percentage with linear pacing fields', () => {
    // April 5: daysElapsed=5, daysInMonth=30, target=8
    // expectedValue = 8 * (5/30) ≈ 1.33
    const ref = new Date(2026, 3, 5);
    const result = calcProgress('total', 2, 8, PERIOD, ref);
    expect(result.percentage).toBeCloseTo(25);
    expect(result.expectedValue).toBeCloseTo(8 * (5 / 30), 2);
    expect(result.onTrack).toBe(true); // 2 >= 1.33
  });

  it('handles zero target gracefully', () => {
    const result = calcProgress('total', 0, 0, PERIOD);
    expect(result.percentage).toBe(0);
  });

  it('returns > 100% when current exceeds target', () => {
    const ref = new Date(2026, 3, 10);
    const result = calcProgress('total', 10, 4, PERIOD, ref);
    expect(result.percentage).toBeCloseTo(250);
  });

  it('on-track total goal: current >= expected', () => {
    // April 10: expected = 20 * (10/30) ≈ 6.67, current = 8 → on track
    const ref = new Date(2026, 3, 10);
    const result = calcProgress('total', 8, 20, PERIOD, ref);
    expect(result.expectedValue).toBeCloseTo(20 * (10 / 30), 2);
    expect(result.onTrack).toBe(true);
  });

  it('behind-pace total goal: current < expected', () => {
    // April 20: expected = 20 * (20/30) ≈ 13.33, current = 5 → behind
    const ref = new Date(2026, 3, 20);
    const result = calcProgress('total', 5, 20, PERIOD, ref);
    expect(result.expectedValue).toBeCloseTo(20 * (20 / 30), 2);
    expect(result.onTrack).toBe(false);
  });

  it('first day of month: expected = target * (1/30)', () => {
    const ref = new Date(2026, 3, 1);
    const result = calcProgress('total', 0, 30, PERIOD, ref);
    expect(result.expectedValue).toBeCloseTo(30 * (1 / 30), 2); // 1
    expect(result.onTrack).toBe(false); // 0 < 1
  });

  it('last day of month: expected = full target', () => {
    const ref = new Date(2026, 3, 30);
    const result = calcProgress('total', 30, 30, PERIOD, ref);
    expect(result.expectedValue).toBeCloseTo(30);
    expect(result.onTrack).toBe(true);
  });
});

describe('calcProgress — daily', () => {
  it('first day of month: expects target * 1', () => {
    // April 1
    const ref = new Date(2026, 3, 1);
    const result = calcProgress('daily', 0, 2, PERIOD, ref);
    expect(result.expectedValue).toBeCloseTo(2); // 2 * 1
    expect(result.percentage).toBeCloseTo(0);
    expect(result.onTrack).toBe(false);
  });

  it('on track mid-month', () => {
    // April 10 — 10 days elapsed, expect 2*10=20
    const ref = new Date(2026, 3, 10);
    const result = calcProgress('daily', 20, 2, PERIOD, ref);
    expect(result.expectedValue).toBeCloseTo(20);
    expect(result.onTrack).toBe(true);
    // percentage = 20 / (2*30) * 100 = 33.33
    expect(result.percentage).toBeCloseTo(33.33, 1);
  });

  it('last day of month: full target expected', () => {
    const ref = new Date(2026, 3, 30);
    const result = calcProgress('daily', 60, 2, PERIOD, ref);
    expect(result.expectedValue).toBeCloseTo(60); // 2 * 30
    expect(result.percentage).toBeCloseTo(100);
    expect(result.onTrack).toBe(true);
  });

  it('behind on last day', () => {
    const ref = new Date(2026, 3, 30);
    const result = calcProgress('daily', 55, 2, PERIOD, ref);
    expect(result.onTrack).toBe(false);
    expect(result.percentage).toBeCloseTo((55 / 60) * 100, 1);
  });
});

describe('calcProgress — weekly', () => {
  // April has 30 days → ceil(30/7) = 5 weeks
  it('first day of month', () => {
    const ref = new Date(2026, 3, 1);
    // daysElapsed=1, weeksElapsed=1/7≈0.143
    // expected = 3 * (1/7) ≈ 0.429
    const result = calcProgress('weekly', 0, 3, PERIOD, ref);
    expect(result.expectedValue).toBeCloseTo(3 / 7, 3);
    expect(result.onTrack).toBe(false);
  });

  it('after one full week, exactly on track', () => {
    const ref = new Date(2026, 3, 7); // day 7 → daysElapsed=7, weeksElapsed=1
    // expected = 3 * 1 = 3
    const result = calcProgress('weekly', 3, 3, PERIOD, ref);
    expect(result.expectedValue).toBeCloseTo(3);
    expect(result.onTrack).toBe(true);
  });

  it('last day of month: full target expected', () => {
    const ref = new Date(2026, 3, 30);
    // daysElapsed=30, weeksElapsed=30/7≈4.286
    // expected = 3 * (30/7) ≈ 12.857
    // totalTarget = 3 * 5 = 15
    const result = calcProgress('weekly', 15, 3, PERIOD, ref);
    expect(result.percentage).toBeCloseTo(100);
    expect(result.onTrack).toBe(true);
  });

  it('percentage calculation correct', () => {
    const ref = new Date(2026, 3, 14); // day 14 → 2 weeks
    // totalTarget = 3*5=15, current=6 → 6/15*100=40%
    const result = calcProgress('weekly', 6, 3, PERIOD, ref);
    expect(result.percentage).toBeCloseTo(40);
  });
});

describe('calcProgress — measurement', () => {
  it('halfway from 90kg to 75kg returns 50%', () => {
    // span=15, moved=7.5
    const ref = new Date(2026, 3, 15);
    const result = calcProgress('total', 82.5, 75, PERIOD, ref, 'measurement', 90);
    expect(result.percentage).toBeCloseTo(50);
  });

  it('goal exactly reached returns 100%', () => {
    const ref = new Date(2026, 3, 15);
    const result = calcProgress('total', 75, 75, PERIOD, ref, 'measurement', 90);
    expect(result.percentage).toBeCloseTo(100);
  });

  it('past target returns > 100%', () => {
    // moved=16, span=15 → 106.67%
    const ref = new Date(2026, 3, 15);
    const result = calcProgress('total', 74, 75, PERIOD, ref, 'measurement', 90);
    expect(result.percentage).toBeGreaterThan(100);
  });

  it('no progress yet returns 0%', () => {
    // currentValue = startValue → moved=0
    const ref = new Date(2026, 3, 15);
    const result = calcProgress('total', 90, 75, PERIOD, ref, 'measurement', 90);
    expect(result.percentage).toBe(0);
  });

  it('zero span (start equals target) returns 0% safely with no pacing', () => {
    const result = calcProgress('total', 75, 75, PERIOD, undefined, 'measurement', 75);
    expect(result.percentage).toBe(0);
    expect(result.expectedValue).toBeNull();
    expect(result.onTrack).toBeNull();
  });

  it('computes expected value as linear interpolation for a reducing goal', () => {
    // Losing weight: 90kg → 75kg over April (30 days)
    // Day 10: expected = 90 + (75-90) * (10/30) = 90 - 5 = 85
    const ref = new Date(2026, 3, 10);
    const result = calcProgress('total', 86, 75, PERIOD, ref, 'measurement', 90);
    expect(result.expectedValue).toBeCloseTo(85);
    // current=86 > expected=85 for weight loss → behind
    expect(result.onTrack).toBe(false);
  });

  it('on track when current is at or below expected for a reducing goal', () => {
    const ref = new Date(2026, 3, 10);
    // expected=85, current=84
    const result = calcProgress('total', 84, 75, PERIOD, ref, 'measurement', 90);
    expect(result.onTrack).toBe(true);
  });

  it('computes expected value for an increasing goal', () => {
    // Gaining muscle: 60kg → 75kg over April
    // Day 10: expected = 60 + (75-60) * (10/30) = 60 + 5 = 65
    const ref = new Date(2026, 3, 10);
    const result = calcProgress('total', 66, 75, PERIOD, ref, 'measurement', 60);
    expect(result.expectedValue).toBeCloseTo(65);
    expect(result.onTrack).toBe(true); // 66 >= 65
  });

  it('does not affect accumulation goals when goalType omitted', () => {
    // regression: accumulation goals now get linear pacing (not null)
    const ref = new Date(2026, 3, 15);
    const result = calcProgress('total', 2, 8, PERIOD, ref);
    expect(result.percentage).toBeCloseTo(25);
    // expectedValue = 8 * (15/30) = 4
    expect(result.expectedValue).toBeCloseTo(4, 2);
    expect(result.onTrack).toBe(false); // 2 < 4
  });
});
