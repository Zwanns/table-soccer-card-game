import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { KitVariant, RenderedKitManifestEntry, TeamId } from './types';

type ManifestTeamEntry = Partial<Record<KitVariant, ManifestKitEntry>>;

type ManifestKitEntry = {
  path: string;
  wikipediaTitle: string;
  revisionId?: number;
  warnings: string[];
};

export type WikiKitsManifest = {
  generatedAt: string;
  source: string;
  ignoredSocks: true;
  teams: Partial<Record<TeamId, ManifestTeamEntry>>;
};

export async function writeManifest(entries: readonly RenderedKitManifestEntry[], outputPath: string): Promise<void> {
  const manifest: WikiKitsManifest = {
    generatedAt: new Date().toISOString(),
    source: 'ru.wikipedia.org + commons.wikimedia.org',
    ignoredSocks: true,
    teams: {}
  };

  entries.forEach((entry) => {
    const teamEntry = manifest.teams[entry.teamId] ?? {};
    manifest.teams[entry.teamId] = teamEntry;
    teamEntry[entry.variant] = {
      path: entry.outputPath,
      wikipediaTitle: entry.wikipediaTitle,
      revisionId: entry.wikipediaRevisionId,
      warnings: entry.warnings
    };
  });

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
}
