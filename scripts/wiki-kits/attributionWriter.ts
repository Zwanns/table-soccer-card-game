import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { CommonsAssetMetadata, RenderedKitManifestEntry } from './types';

export type AttributionEntry = Omit<CommonsAssetMetadata, 'kind' | 'requestedTitle'> & {
  usedBy: string[];
};

export type WikiKitsAttribution = {
  generatedAt: string;
  source: string;
  assets: AttributionEntry[];
};

export async function writeAttribution(
  entries: readonly RenderedKitManifestEntry[],
  outputPath: string
): Promise<void> {
  const assets = new Map<string, AttributionEntry>();

  entries.forEach((entry) => {
    const usedBy = `${entry.teamId}/${entry.variant}`;

    entry.assets.forEach((asset) => {
      const existing = assets.get(asset.resolvedTitle);

      if (existing === undefined) {
        assets.set(asset.resolvedTitle, {
          resolvedTitle: asset.resolvedTitle,
          sourceUrl: asset.sourceUrl,
          descriptionUrl: asset.descriptionUrl,
          author: asset.author,
          licenseShortName: asset.licenseShortName,
          licenseUrl: asset.licenseUrl,
          credit: asset.credit,
          usageTerms: asset.usageTerms,
          attributionRequired: asset.attributionRequired,
          usedBy: [usedBy]
        });
        return;
      }

      if (!existing.usedBy.includes(usedBy)) {
        existing.usedBy.push(usedBy);
      }
    });
  });

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        source: 'commons.wikimedia.org',
        assets: [...assets.values()]
      } satisfies WikiKitsAttribution,
      null,
      2
    )}\n`,
    'utf8'
  );
}
