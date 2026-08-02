// Small, dependency-free coercion helpers used by parseAll.ts.
// Kept intentionally boring: the raw CSVs only ever contain "True"/"False"
// strings for booleans and plain decimal strings for numbers, so no locale
// or edge-case handling is needed beyond what's here.

export function toBool(v: string): boolean {
  return v.trim().toLowerCase() === 'true';
}

export function toNum(v: string): number {
  const n = Number(v);
  if (Number.isNaN(n)) {
    throw new Error(`toNum: could not parse "${v}" as a number`);
  }
  return n;
}
