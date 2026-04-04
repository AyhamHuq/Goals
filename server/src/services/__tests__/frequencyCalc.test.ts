import { calcProgress } from '../frequencyCalc';

const PERIOD = '2026-04'; // April 2026 — 30 days

describe('calcProgress — total', () => {
  it('returns percentage and null pacing fields', () => {
    const result = calcProgress('total', 2, 8, PERIOD);
    expect(result.percentage).toBeCloseTo(25);
    expect(result.expectedValue).toBeNull();
    expect(result.onTrack).toBeNull();
  });

  it('handles zero target gracefully', () => {
    const result = calcProgress('total', 0, 0, PERIOD);
    expect(result.percentage).toBe(0);
  });

  it('returns > 100% when current exceeds target', () => {
    const result = calcProgress('total', 10, 4, PERIOD);
    expect(result.percentage).toBeCloseTo(250);
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
    const result = calcProgress('total', 82.5, 75, PERIOD, undefined, 'measurement', 90);
    expect(result.percentage).toBeCloseTo(50);
    expect(result.expectedValue).toBeNull();
    expect(result.onTrack).toBeNull();
  });

  it('goal exactly reached returns 100%', () => {
    const result = calcProgress('total', 75, 75, PERIOD, undefined, 'measurement', 90);
    expect(result.percentage).toBeCloseTo(100);
  });

  it('past target returns > 100%', () => {
    // moved=16, span=15 → 106.67%
    const result = calcProgress('total', 74, 75, PERIOD, undefined, 'measurement', 90);
    expect(result.percentage).toBeGreaterThan(100);
  });

  it('no progress yet returns 0%', () => {
    // currentValue = startValue → moved=0
    const result = calcProgress('total', 90, 75, PERIOD, undefined, 'measurement', 90);
    expect(result.percentage).toBe(0);
  });

  it('zero span (start equals target) returns 0% safely', () => {
    const result = calcProgress('total', 75, 75, PERIOD, undefined, 'measurement', 75);
    expect(result.percentage).toBe(0);
  });

  it('always returns null for expectedValue and onTrack', () => {
    const result = calcProgress('total', 82.5, 75, PERIOD, undefined, 'measurement', 90);
    expect(result.expectedValue).toBeNull();
    expect(result.onTrack).toBeNull();
  });

  it('does not affect accumulation goals when goalType omitted', () => {
    // regression: existing call signature unchanged
    const result = calcProgress('total', 2, 8, PERIOD);
    expect(result.percentage).toBeCloseTo(25);
    expect(result.expectedValue).toBeNull();
    expect(result.onTrack).toBeNull();
  });
});
