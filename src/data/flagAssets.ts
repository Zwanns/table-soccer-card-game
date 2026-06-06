const FLAG_ASSET_URLS = import.meta.glob('../../flags/*.svg', {
  eager: true,
  import: 'default',
  query: '?url'
}) as Record<string, string>;

export function getFlagAssetUrl(flagCode: string): string {
  return FLAG_ASSET_URLS[`../../flags/${flagCode}.svg`] ?? `flags/${flagCode}.svg`;
}
