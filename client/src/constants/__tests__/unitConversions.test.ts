import { convertUnit, getUnitsForCategory } from '../unitConversions';

describe('convertUnit', () => {
  it('converts pages to juz (120 pages = 6 juz)', () => {
    expect(convertUnit(120, 'pages', 'juz', 'Quran')).toBeCloseTo(6);
  });

  it('converts juz to pages (3 juz = 60 pages)', () => {
    expect(convertUnit(3, 'juz', 'pages', 'Quran')).toBeCloseTo(60);
  });

  it('converts minutes to hours (60 min = 1 hr)', () => {
    expect(convertUnit(60, 'minutes', 'hours', 'Fitness')).toBeCloseTo(1);
  });

  it('converts hours to minutes (2 hr = 120 min)', () => {
    expect(convertUnit(2, 'hours', 'minutes', 'Fitness')).toBeCloseTo(120);
  });

  it('returns same value when fromUnit === toUnit', () => {
    expect(convertUnit(42, 'pages', 'pages', 'Quran')).toBe(42);
  });

  it('returns value unchanged for unknown category', () => {
    expect(convertUnit(10, 'widgets', 'thingies', 'Unknown Category')).toBe(10);
  });

  it('returns value unchanged when units not found in category map', () => {
    expect(convertUnit(10, 'unknown-unit', 'pages', 'Quran')).toBe(10);
  });

  it('converts lectures to hours (Arabic Learning)', () => {
    // 1 lecture = 3 hours base; 1 lecture in hours = 3/1 = 3 hours
    expect(convertUnit(1, 'lectures', 'hours', 'Arabic Learning')).toBeCloseTo(3);
  });

  it('converts minutes to hours (Arabic Learning, 60 min = 1 hr)', () => {
    expect(convertUnit(60, 'minutes', 'hours', 'Arabic Learning')).toBeCloseTo(1);
  });
});

describe('getUnitsForCategory', () => {
  it('returns units for Quran', () => {
    expect(getUnitsForCategory('Quran')).toEqual(['pages', 'juz']);
  });

  it('returns units for Fitness', () => {
    expect(getUnitsForCategory('Fitness')).toEqual(['minutes', 'hours', 'steps']);
  });

  it('returns empty array for unknown category', () => {
    expect(getUnitsForCategory('Unknown')).toEqual([]);
  });
});
