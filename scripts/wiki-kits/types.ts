export type KitVariant = 'home' | 'away';

export type TeamId = 'poland' | 'ukraine' | 'brazil';

export type WikipediaKitParams = {
  patternLeftArm?: string;
  patternBody?: string;
  patternRightArm?: string;
  patternShorts?: string;

  leftArmColor: string;
  bodyColor: string;
  rightArmColor: string;
  shortsColor: string;

  ignoredSocksColor?: string;
  ignoredSocksPattern?: string;
};

export type TeamKitImportData = {
  teamId: TeamId;
  wikipediaTitle: string;
  home: WikipediaKitParams;
  away: WikipediaKitParams;
};

export type KitLayerPart = 'leftArm' | 'body' | 'rightArm' | 'shorts';

export type ResolvedKitAssets = {
  base: Record<KitLayerPart, string>;
  patterns?: Partial<Record<KitLayerPart, string>>;
};

export type CommonsAssetKind =
  | 'base-body'
  | 'base-left-arm'
  | 'base-right-arm'
  | 'base-shorts'
  | 'pattern-body'
  | 'pattern-left-arm'
  | 'pattern-right-arm'
  | 'pattern-shorts';

export type CommonsAssetMetadata = {
  kind: CommonsAssetKind;
  requestedTitle: string;
  resolvedTitle: string;
  sourceUrl: string;
  descriptionUrl: string;
  author?: string;
  licenseShortName?: string;
  licenseUrl?: string;
  credit?: string;
  usageTerms?: string;
  attributionRequired?: boolean;
};

export type RenderedKitManifestEntry = {
  teamId: TeamId;
  variant: KitVariant;
  outputPath: string;
  wikipediaTitle: string;
  wikipediaRevisionId?: number;
  importedAt: string;
  ignoredSocks: true;
  colors: {
    leftArm: string;
    body: string;
    rightArm: string;
    shorts: string;
  };
  patterns: {
    leftArm?: string;
    body?: string;
    rightArm?: string;
    shorts?: string;
  };
  assets: CommonsAssetMetadata[];
  warnings: string[];
};
