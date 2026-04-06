export interface UnitConversionMap {
  baseUnit: string;
  units: string[];
  // multiplier to convert FROM this unit TO baseUnit
  toBase: Record<string, number>;
}

export const UNIT_CONVERSIONS: Record<string, UnitConversionMap> = {
  'Weight Loss': {
    baseUnit: 'lbs',
    units: ['lbs', 'kg'],
    toBase: { lbs: 1, kg: 2.20462 },
  },
  'Arabic Learning': {
    baseUnit: 'hours',
    units: ['lectures', 'minutes', 'hours'],
    toBase: { hours: 1, minutes: 1 / 60, lectures: 3 },
  },
  'Fitness': {
    baseUnit: 'minutes',
    units: ['minutes', 'hours', 'steps'],
    toBase: { minutes: 1, hours: 60, steps: 0.01 },
  },
  'Quran': {
    baseUnit: 'pages',
    units: ['pages', 'juz'],
    toBase: { pages: 1, juz: 20 },
  },
  'Professional Learning': {
    baseUnit: 'hours',
    units: ['flashcards', 'minutes', 'hours'],
    toBase: { hours: 1, minutes: 1 / 60, flashcards: 0.2 },
  },
};

/** Convert a value from one unit to another within the same category. */
export function convertUnit(
  value: number,
  fromUnit: string,
  toUnit: string,
  categoryName: string,
): number {
  if (fromUnit === toUnit) return value;
  const map = UNIT_CONVERSIONS[categoryName];
  if (!map) return value;
  const fromFactor = map.toBase[fromUnit];
  const toFactor = map.toBase[toUnit];
  if (fromFactor === undefined || toFactor === undefined) return value;
  // value * fromFactor = value in baseUnit; divide by toFactor to get target unit
  return (value * fromFactor) / toFactor;
}

/** Get available units for a category, or empty array if unknown. */
export function getUnitsForCategory(categoryName: string): string[] {
  return UNIT_CONVERSIONS[categoryName]?.units ?? [];
}
