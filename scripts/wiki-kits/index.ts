import { access, mkdir, rm } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeAttribution } from './attributionWriter';
import { parseWikiKitsCliArgs, type WikiKitsCliOptions } from './cli';
import { TEST_WIKI_KIT_TEAMS } from './config';
import {
  type KitLayerPart,
  type KitVariant,
  type CommonsAssetMetadata,
  type RenderedKitManifestEntry,
  type ResolvedKitAssets,
  type TeamId,
  type TeamKitImportData,
  type WikipediaKitParams
} from './types';
import { downloadCommonsAsset } from './downloadCache';
import { extractTeamKitImportData } from './kitParamsExtractor';
import { renderKitPng } from './kitRenderer';
import { createWikiKitsLogger, type WikiKitsLogger } from './logger';
import { writeManifest } from './manifestWriter';
import { writePreview } from './previewWriter';
import { writeImportReport } from './reportWriter';
import { fetchWikipediaPageWikitext, type WikipediaPageWikitext } from './wikipediaClient';
import { resolveBaseLayer, resolvePatternLayer } from './commonsFileResolver';

type ImportStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'SKIPPED';

type KitImportResult = {
  variant: KitVariant;
  status: ImportStatus;
  outputPath: string;
  extractedParams?: WikipediaKitParams;
  ignoredSocks?: {
    color?: string;
    pattern?: string;
  };
  resolvedFiles: Array<{
    part: KitLayerPart;
    kind: 'base' | 'pattern';
    title: string;
    sourceUrl: string;
  }>;
  missingPatterns: Array<{
    part: KitLayerPart;
    token: string;
  }>;
  fallbackLayers: KitLayerPart[];
  warnings: string[];
  errors: string[];
};

type TeamImportResult = {
  teamId: TeamId;
  wikipediaTitle: string;
  status: ImportStatus;
  revisionId?: number;
  kits: KitImportResult[];
  warnings: string[];
  errors: string[];
};

type WikiKitsImportReport = {
  generatedAt: string;
  args: WikiKitsCliOptions;
  teams: TeamImportResult[];
};

type WikiKitsImportPaths = {
  outputRoot: string;
  cacheRoot: string;
  reportPath: string;
  previewPath: string;
};

type WikiKitsImportDependencies = {
  fetchWikipediaPageWikitext: (title: string) => Promise<WikipediaPageWikitext>;
  extractTeamKitImportData: (teamId: TeamId, wikipediaTitle: string, wikitext: string) => TeamKitImportData;
  resolveBaseLayer: typeof resolveBaseLayer;
  resolvePatternLayer: typeof resolvePatternLayer;
  downloadCommonsAsset: typeof downloadCommonsAsset;
  renderKitPng: typeof renderKitPng;
  writeManifest: typeof writeManifest;
  writeAttribution: typeof writeAttribution;
  writeImportReport: typeof writeImportReport;
  writePreview: typeof writePreview;
  paths: WikiKitsImportPaths;
  logger: WikiKitsLogger;
};

type WikiKitsImportDependencyOverrides = Partial<Omit<WikiKitsImportDependencies, 'paths'>> & {
  paths?: Partial<WikiKitsImportPaths>;
};

const DEFAULT_OUTPUT_ROOT = join('public', 'kits', 'imported');
const DEFAULT_CACHE_ROOT = join('.cache', 'wiki-kits');
const DEFAULT_REPORT_PATH = join('reports', 'wiki-kits-import-report.json');
const DEFAULT_PREVIEW_PATH = join('reports', 'wiki-kits-preview.png');
const PARTS: KitLayerPart[] = ['leftArm', 'body', 'rightArm', 'shorts'];
const VARIANTS: KitVariant[] = ['home', 'away'];

const DEFAULT_DEPENDENCIES: WikiKitsImportDependencies = {
  fetchWikipediaPageWikitext,
  extractTeamKitImportData,
  resolveBaseLayer,
  resolvePatternLayer,
  downloadCommonsAsset,
  renderKitPng,
  writeManifest,
  writeAttribution,
  writeImportReport,
  writePreview,
  paths: {
    outputRoot: DEFAULT_OUTPUT_ROOT,
    cacheRoot: DEFAULT_CACHE_ROOT,
    reportPath: DEFAULT_REPORT_PATH,
    previewPath: DEFAULT_PREVIEW_PATH
  },
  logger: createWikiKitsLogger()
};

export async function runWikiKitsImport(
  options: WikiKitsCliOptions,
  dependencies: WikiKitsImportDependencyOverrides = {}
): Promise<WikiKitsImportReport> {
  const deps = {
    ...DEFAULT_DEPENDENCIES,
    ...dependencies,
    paths: {
      ...DEFAULT_DEPENDENCIES.paths,
      ...dependencies.paths
    }
  };
  const selectedTeams =
    options.teamId === undefined
      ? TEST_WIKI_KIT_TEAMS
      : TEST_WIKI_KIT_TEAMS.filter((team) => team.teamId === options.teamId);
  const report: WikiKitsImportReport = {
    generatedAt: new Date().toISOString(),
    args: options,
    teams: []
  };
  const manifestEntries: RenderedKitManifestEntry[] = [];

  if (options.clearCache) {
    deps.logger.info(`Clearing cache: ${deps.paths.cacheRoot}`);
    await rm(deps.paths.cacheRoot, { recursive: true, force: true });
  }

  for (const team of selectedTeams) {
    const result = await importTeam(team.teamId, team.wikipediaTitle, options, deps, manifestEntries);
    report.teams.push(result);
  }

  await deps.writeManifest(manifestEntries, join(deps.paths.outputRoot, 'manifest.json'));
  await deps.writeAttribution(manifestEntries, join(deps.paths.outputRoot, 'ATTRIBUTION.json'));
  await deps.writeImportReport(report, deps.paths.reportPath);
  await deps.writePreview(deps.paths.outputRoot, deps.paths.previewPath);

  report.teams.forEach((team) => {
    deps.logger.info(`${team.teamId}: ${team.status}`);
    team.kits.forEach((kit) => deps.logger.info(`${team.teamId}/${kit.variant}: ${kit.status}`));
  });

  return report;
}

async function importTeam(
  teamId: TeamId,
  wikipediaTitle: string,
  options: WikiKitsCliOptions,
  deps: WikiKitsImportDependencies,
  manifestEntries: RenderedKitManifestEntry[]
): Promise<TeamImportResult> {
  const result: TeamImportResult = {
    teamId,
    wikipediaTitle,
    status: 'FAILED',
    kits: [],
    warnings: [],
    errors: []
  };

  try {
    deps.logger.info(`Fetching Wikipedia page: ${wikipediaTitle}`);
    const page = await deps.fetchWikipediaPageWikitext(wikipediaTitle);
    const importData = deps.extractTeamKitImportData(teamId, wikipediaTitle, page.content);

    result.revisionId = page.revisionId;
    deps.logger.info(`Extracted home and away kit params: ${teamId}`);

    const plannedVariants = await getVariantsToRender(teamId, options, result, deps.paths);

    if (plannedVariants.length === 0) {
      result.status = 'SKIPPED';
      return result;
    }

    deps.logger.info(`Resolving Commons assets: ${teamId}`);
    const baseAssets = await resolveAndDownloadBaseAssets(deps, options);

    for (const variant of plannedVariants) {
      const kit = await importKitVariant(
        teamId,
        wikipediaTitle,
        page.revisionId,
        variant,
        importData[variant],
        options,
        deps,
        baseAssets
      );

      result.kits.push(kit.result);
      result.warnings.push(...kit.result.warnings);
      result.errors.push(...kit.result.errors);

      if (kit.manifestEntry !== undefined) {
        manifestEntries.push(kit.manifestEntry);
      }
    }

    result.status = getTeamStatus(result.kits);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    result.status = 'FAILED';
  }

  return result;
}

async function getVariantsToRender(
  teamId: TeamId,
  options: WikiKitsCliOptions,
  teamResult: TeamImportResult,
  paths: WikiKitsImportPaths
): Promise<KitVariant[]> {
  const plannedVariants: KitVariant[] = [];

  for (const variant of VARIANTS) {
    const outputPath = getKitOutputPath(paths.outputRoot, teamId, variant);

    if (options.force !== true && (await fileExists(outputPath))) {
      teamResult.kits.push({
        variant,
        status: 'SKIPPED',
        outputPath,
        resolvedFiles: [],
        missingPatterns: [],
        fallbackLayers: [],
        warnings: [`Skipped existing PNG: ${outputPath}`],
        errors: []
      });
      continue;
    }

    plannedVariants.push(variant);
  }

  return plannedVariants;
}

type DownloadedBaseAssets = {
  paths: ResolvedKitAssets['base'];
  metadata: CommonsAssetMetadata[];
};

async function resolveAndDownloadBaseAssets(
  deps: WikiKitsImportDependencies,
  options: WikiKitsCliOptions
): Promise<DownloadedBaseAssets> {
  const paths = {} as ResolvedKitAssets['base'];
  const metadata: CommonsAssetMetadata[] = [];

  for (const part of PARTS) {
    const asset = await deps.resolveBaseLayer(part);
    paths[part] = await deps.downloadCommonsAsset(asset, { cacheDir: join(deps.paths.cacheRoot, 'commons'), force: options.force });
    metadata.push(asset);
  }

  return {
    paths,
    metadata
  };
}

async function importKitVariant(
  teamId: TeamId,
  wikipediaTitle: string,
  revisionId: number,
  variant: KitVariant,
  params: WikipediaKitParams,
  options: WikiKitsCliOptions,
  deps: WikiKitsImportDependencies,
  base: DownloadedBaseAssets
): Promise<{ result: KitImportResult; manifestEntry?: RenderedKitManifestEntry }> {
  const outputPath = getKitOutputPath(deps.paths.outputRoot, teamId, variant);
  const result: KitImportResult = {
    variant,
    status: 'FAILED',
    outputPath,
    extractedParams: params,
    ignoredSocks: {
      color: params.ignoredSocksColor,
      pattern: params.ignoredSocksPattern
    },
    resolvedFiles: base.metadata.map((asset) => ({
      part: getPartFromAssetKind(asset.kind),
      kind: 'base',
      title: asset.resolvedTitle,
      sourceUrl: asset.sourceUrl
    })),
    missingPatterns: [],
    fallbackLayers: [],
    warnings: [],
    errors: []
  };

  try {
    const resolvedAssets: ResolvedKitAssets = {
      base: base.paths,
      patterns: {}
    };
    const manifestAssets: CommonsAssetMetadata[] = [...base.metadata];

    for (const part of PARTS) {
      const token = getPatternToken(params, part);

      if (token === undefined) {
        continue;
      }

      const resolution = await deps.resolvePatternLayer(part, token);
      result.warnings.push(...resolution.warnings);

      if (resolution.asset === undefined) {
        result.missingPatterns.push({
          part,
          token
        });
        result.fallbackLayers.push(part);
        deps.logger.warn(`Using solid-color fallback: ${teamId}/${variant}/${part}`);
        continue;
      }

      resolvedAssets.patterns![part] = await deps.downloadCommonsAsset(resolution.asset, {
        cacheDir: join(deps.paths.cacheRoot, 'commons'),
        force: options.force
      });
      result.resolvedFiles.push({
        part,
        kind: 'pattern',
        title: resolution.asset.resolvedTitle,
        sourceUrl: resolution.asset.sourceUrl
      });
      manifestAssets.push(resolution.asset);
    }

    await mkdir(join(deps.paths.outputRoot, teamId), { recursive: true });
    await deps.renderKitPng(
      {
        teamId,
        variant,
        params,
        assets: resolvedAssets
      },
      outputPath,
      {
        debug: options.debug
      }
    );

    deps.logger.info(`Rendered: ${outputPath}`);
    result.status = result.warnings.length > 0 ? 'PARTIAL' : 'SUCCESS';

    return {
      result,
      manifestEntry: {
        teamId,
        variant,
        outputPath: toPosixPath(relative(deps.paths.outputRoot, outputPath)),
        wikipediaTitle,
        wikipediaRevisionId: revisionId,
        importedAt: new Date().toISOString(),
        ignoredSocks: true,
        colors: {
          leftArm: params.leftArmColor,
          body: params.bodyColor,
          rightArm: params.rightArmColor,
          shorts: params.shortsColor
        },
        patterns: {
          leftArm: params.patternLeftArm,
          body: params.patternBody,
          rightArm: params.patternRightArm,
          shorts: params.patternShorts
        },
        assets: manifestAssets,
        warnings: result.warnings
      }
    };
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
    result.status = 'FAILED';

    return { result };
  }
}

function getPatternToken(params: WikipediaKitParams, part: KitLayerPart): string | undefined {
  switch (part) {
    case 'leftArm':
      return params.patternLeftArm;
    case 'body':
      return params.patternBody;
    case 'rightArm':
      return params.patternRightArm;
    case 'shorts':
      return params.patternShorts;
  }
}

function getPartFromAssetKind(kind: CommonsAssetMetadata['kind']): KitLayerPart {
  switch (kind) {
    case 'base-left-arm':
    case 'pattern-left-arm':
      return 'leftArm';
    case 'base-body':
    case 'pattern-body':
      return 'body';
    case 'base-right-arm':
    case 'pattern-right-arm':
      return 'rightArm';
    case 'base-shorts':
    case 'pattern-shorts':
      return 'shorts';
  }
}

function getKitOutputPath(outputRoot: string, teamId: TeamId, variant: KitVariant): string {
  return join(outputRoot, teamId, `${variant}.png`);
}

function getTeamStatus(kits: readonly KitImportResult[]): ImportStatus {
  if (kits.length === 0) {
    return 'FAILED';
  }

  if (kits.every((kit) => kit.status === 'SKIPPED')) {
    return 'SKIPPED';
  }

  if (kits.every((kit) => kit.status === 'SUCCESS' || kit.status === 'SKIPPED')) {
    return 'SUCCESS';
  }

  if (kits.some((kit) => kit.status === 'SUCCESS' || kit.status === 'PARTIAL' || kit.status === 'SKIPPED')) {
    return 'PARTIAL';
  }

  return 'FAILED';
}

function toPosixPath(path: string): string {
  return path.replace(/\\/g, '/');
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  const options = parseWikiKitsCliArgs(process.argv.slice(2));
  const logger = createWikiKitsLogger({ debugEnabled: options.debug });

  await runWikiKitsImport(options, {
    logger
  });
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(`[wiki-kits] ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}
