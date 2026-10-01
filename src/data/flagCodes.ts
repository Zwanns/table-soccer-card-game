// Compatibility aliases belong at storage/input boundaries, never in canonical registries.
export const LEGACY_FLAG_CODE_ALIASES: Readonly<Record<string, string>> = {
  'gb-eng': 'eng',
  'gb-sct': 'sct',
  'gb-wls': 'wls'
};

export function normalizeFlagCode(flagCode: string): string {
  return Object.hasOwn(LEGACY_FLAG_CODE_ALIASES, flagCode) ? LEGACY_FLAG_CODE_ALIASES[flagCode] : flagCode;
}

export function normalizeFlagCodeKeys<T>(values: Readonly<Record<string, T>>): Record<string, T> {
  // If both keys exist, the explicit canonical entry wins regardless of insertion order.
  // This returns a copy; reading legacy storage never removes or overwrites the original.
  return Object.fromEntries(Object.entries(values).map(([code, value]) => {
    const canonical = normalizeFlagCode(code);
    return [canonical, Object.hasOwn(values, canonical) ? values[canonical] : value];
  }));
}
