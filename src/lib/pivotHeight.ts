export function parsePivotHeight(input: string): number | null {
  const normalized = input.trim().replace(',', '.');
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) return null;
  const height = Number(normalized);
  return Number.isFinite(height) && height > 0 ? height : null;
}
