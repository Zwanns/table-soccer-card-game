import { normalizeHexColor } from './config';
import type { KitVariant, TeamId, TeamKitImportData, WikipediaKitParams } from './types';
import { parseFootballTeamTemplateParams } from './wikitextParser';

type TemplateParams = Record<string, string>;

const REQUIRED_COLOR_FIELDS = ['leftarm', 'body', 'rightarm', 'shorts'] as const;

export function normalizePatternToken(value?: string): string | undefined {
  const normalized = value?.trim();

  if (normalized === undefined || normalized.length === 0) {
    return undefined;
  }

  return normalized.replace(/^_+/, '');
}

export function extractTeamKitImportData(
  teamId: TeamId,
  wikipediaTitle: string,
  wikitext: string
): TeamKitImportData {
  const template = parseFootballTeamTemplateParams(wikitext);

  return {
    teamId,
    wikipediaTitle,
    home: extractVariantParams(teamId, 'home', template.params, '1'),
    away: extractVariantParams(teamId, 'away', template.params, '2')
  };
}

function extractVariantParams(
  teamId: TeamId,
  variant: KitVariant,
  params: TemplateParams,
  suffix: '1' | '2'
): WikipediaKitParams {
  const missingFields = REQUIRED_COLOR_FIELDS.filter((field) => isBlank(params[`${field}${suffix}`]));

  if (missingFields.length > 0) {
    throw new Error(`Missing required kit color fields for ${teamId} ${variant}: ${missingFields.join(', ')}`);
  }

  const ignoredSocksColor = normalizeOptionalColor(params[`socks${suffix}`]);
  const ignoredSocksPattern = normalizePatternToken(params[`pattern_so${suffix}`]);

  return {
    patternLeftArm: normalizePatternToken(params[`pattern_la${suffix}`]),
    patternBody: normalizePatternToken(params[`pattern_b${suffix}`]),
    patternRightArm: normalizePatternToken(params[`pattern_ra${suffix}`]),
    patternShorts: normalizePatternToken(params[`pattern_sh${suffix}`]),
    leftArmColor: normalizeHexColor(params[`leftarm${suffix}`] ?? ''),
    bodyColor: normalizeHexColor(params[`body${suffix}`] ?? ''),
    rightArmColor: normalizeHexColor(params[`rightarm${suffix}`] ?? ''),
    shortsColor: normalizeHexColor(params[`shorts${suffix}`] ?? ''),
    ...(ignoredSocksColor === undefined ? {} : { ignoredSocksColor }),
    ...(ignoredSocksPattern === undefined ? {} : { ignoredSocksPattern })
  };
}

function normalizeOptionalColor(value: string | undefined): string | undefined {
  const normalized = value?.trim();

  if (normalized === undefined || normalized.length === 0) {
    return undefined;
  }

  return normalizeHexColor(normalized);
}

function isBlank(value: string | undefined): boolean {
  return value === undefined || value.trim().length === 0;
}
