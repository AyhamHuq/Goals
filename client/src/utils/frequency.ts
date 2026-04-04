export function getFrequencyLabel(
  frequencyType: string,
  targetValue: number,
  unit: string
): string {
  switch (frequencyType) {
    case 'total':
      return `${targetValue} ${unit} total`;
    case 'daily':
      return `${targetValue} ${unit}/day`;
    case 'weekly':
      return `${targetValue} ${unit}/week`;
    default:
      return `${targetValue} ${unit}`;
  }
}

export function formatPercentage(value: number): string {
  const capped = Math.min(Math.round(value), 100);
  return `${capped}%`;
}
