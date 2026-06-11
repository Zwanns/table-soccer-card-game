import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import { COMMONS_REQUEST_DELAY_MS, USER_AGENT } from './config';
import { delay, fetchWithHttp429Retry } from './httpRetry';
import type { CommonsAssetMetadata } from './types';

export type DownloadCommonsAssetOptions = {
  cacheDir?: string;
  force?: boolean;
};

const DEFAULT_CACHE_DIR = join('.cache', 'wiki-kits', 'commons');
let downloadQueue: Promise<void> = Promise.resolve();

export async function downloadCommonsAsset(
  metadata: CommonsAssetMetadata,
  options: DownloadCommonsAssetOptions = {}
): Promise<string> {
  const cacheDir = options.cacheDir ?? DEFAULT_CACHE_DIR;
  const cachePath = join(cacheDir, createCommonsCacheFileName(metadata));

  if (options.force !== true && (await fileExists(cachePath))) {
    return cachePath;
  }

  const response = await queueDownloadRequest(() =>
    fetchWithHttp429Retry(metadata.sourceUrl, {
      headers: {
        'User-Agent': USER_AGENT
      }
    })
  );

  if (!response.ok) {
    throw new Error(`Failed to download Commons asset "${metadata.resolvedTitle}": HTTP ${response.status}`);
  }

  await mkdir(cacheDir, { recursive: true });
  await writeFile(cachePath, Buffer.from(await response.arrayBuffer()));

  return cachePath;
}

async function queueDownloadRequest<T>(request: () => Promise<T>): Promise<T> {
  const result = downloadQueue.then(request);
  downloadQueue = result.then(
    () => delay(COMMONS_REQUEST_DELAY_MS),
    () => delay(COMMONS_REQUEST_DELAY_MS)
  );

  return result;
}

export function createCommonsCacheFileName(metadata: CommonsAssetMetadata): string {
  const sourceExtension = extname(new URL(metadata.sourceUrl).pathname);
  const titleExtension = extname(metadata.resolvedTitle);
  const extension = sourceExtension || titleExtension || '.bin';
  const titleWithoutExtension = basename(metadata.resolvedTitle, titleExtension).replace(/^File:/, '');
  const safeTitle = titleWithoutExtension
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return `${safeTitle || 'commons-asset'}${extension.toLowerCase()}`;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}
