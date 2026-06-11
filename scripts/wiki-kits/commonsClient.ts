import { COMMONS_API_URL, COMMONS_REQUEST_DELAY_MS, USER_AGENT } from './config';
import { delay, fetchWithHttp429Retry } from './httpRetry';
import type { CommonsAssetKind, CommonsAssetMetadata } from './types';

type CommonsApiResponse = {
  query?: {
    pages?: CommonsApiPage[];
  };
};

type CommonsApiPage = {
  title?: string;
  missing?: boolean;
  imageinfo?: CommonsImageInfo[];
};

type CommonsImageInfo = {
  url?: string;
  thumburl?: string;
  descriptionurl?: string;
  descriptionshorturl?: string;
  extmetadata?: Record<string, { value?: string }>;
};

let commonsRequestQueue: Promise<void> = Promise.resolve();

export async function resolveCommonsFile(
  fileTitle: string,
  kind: CommonsAssetKind = 'pattern-body'
): Promise<CommonsAssetMetadata | null> {
  const requestedTitle = normalizeCommonsFileTitle(fileTitle);
  const response = await queueCommonsRequest(() =>
    fetchWithHttp429Retry(buildCommonsImageInfoUrl(requestedTitle), {
      headers: {
        'User-Agent': USER_AGENT
      }
    })
  );

  if (!response.ok) {
    throw new Error(`Failed to resolve Commons file "${requestedTitle}": HTTP ${response.status}`);
  }

  let data: CommonsApiResponse;

  try {
    data = (await response.json()) as CommonsApiResponse;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);

    throw new Error(`Failed to resolve Commons file "${requestedTitle}": ${reason}`);
  }

  const page = data.query?.pages?.[0];

  if (page === undefined || page.missing === true) {
    return null;
  }

  const imageInfo = page.imageinfo?.[0];

  if (imageInfo === undefined) {
    return null;
  }

  const sourceUrl = imageInfo.thumburl ?? imageInfo.url;
  const descriptionUrl = imageInfo.descriptionurl ?? imageInfo.descriptionshorturl;

  if (sourceUrl === undefined || descriptionUrl === undefined) {
    return null;
  }

  const extmetadata = imageInfo.extmetadata ?? {};

  return {
    kind,
    requestedTitle,
    resolvedTitle: page.title ?? requestedTitle,
    sourceUrl,
    descriptionUrl,
    author: getExtMetadataValue(extmetadata, 'Artist'),
    licenseShortName: getExtMetadataValue(extmetadata, 'LicenseShortName'),
    licenseUrl: getExtMetadataValue(extmetadata, 'LicenseUrl'),
    credit: getExtMetadataValue(extmetadata, 'Credit'),
    usageTerms: getExtMetadataValue(extmetadata, 'UsageTerms'),
    attributionRequired: parseAttributionRequired(getExtMetadataValue(extmetadata, 'AttributionRequired'))
  };
}

export function buildCommonsImageInfoUrl(fileTitle: string): URL {
  const url = new URL(COMMONS_API_URL);
  url.search = new URLSearchParams({
    action: 'query',
    prop: 'imageinfo',
    titles: normalizeCommonsFileTitle(fileTitle),
    iiprop: 'url|extmetadata',
    iiurlwidth: '512',
    format: 'json',
    formatversion: '2'
  }).toString();

  return url;
}

export function normalizeCommonsFileTitle(fileTitle: string): string {
  const trimmed = fileTitle.trim().replace(/_/g, ' ');

  return trimmed.startsWith('File:') ? trimmed : `File:${trimmed}`;
}

async function queueCommonsRequest<T>(request: () => Promise<T>): Promise<T> {
  const result = commonsRequestQueue.then(request);
  commonsRequestQueue = result.then(
    () => delay(COMMONS_REQUEST_DELAY_MS),
    () => delay(COMMONS_REQUEST_DELAY_MS)
  );

  return result;
}

function getExtMetadataValue(extmetadata: Record<string, { value?: string }>, key: string): string | undefined {
  const value = extmetadata[key]?.value?.trim();

  return value === undefined || value.length === 0 ? undefined : value;
}

function parseAttributionRequired(value: string | undefined): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  return value.toLowerCase() === 'true';
}
