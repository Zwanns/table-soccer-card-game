import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { KIT_RENDER_GEOMETRY, KIT_RESIZE_KERNEL } from './renderGeometry';
import type { KitLayerPart, KitVariant, ResolvedKitAssets, TeamId, WikipediaKitParams } from './types';

type RenderGeometryPart = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type RenderKitPngInput = {
  teamId: TeamId;
  variant: KitVariant;
  params: WikipediaKitParams;
  assets: ResolvedKitAssets;
};

type RenderKitPngOptions = {
  debug?: boolean;
  intermediateDir?: string;
};

const LAYER_ORDER: KitLayerPart[] = ['leftArm', 'body', 'rightArm', 'shorts'];

export async function renderKitPng(
  input: RenderKitPngInput,
  outputPath: string,
  options: RenderKitPngOptions = {}
): Promise<void> {
  const composites: Array<Record<string, unknown>> = [];
  const debugLayers: Array<{ name: string; buffer: Buffer }> = [];

  for (const part of LAYER_ORDER) {
    const geometry = getPartGeometry(part);
    const mask = await createPartMask(input.assets.base[part], geometry);
    const baseLayer = await createColoredLayer(mask, geometry, getPartColor(input.params, part));

    composites.push({
      input: baseLayer,
      left: geometry.x,
      top: geometry.y
    });
    debugLayers.push({ name: `${getLayerNumber(part, 'base')}-${toDebugName(part)}-base.png`, buffer: baseLayer });

    const patternPath = input.assets.patterns?.[part];

    if (patternPath !== undefined) {
      const patternLayer = await createPatternLayer(patternPath, mask, geometry);

      composites.push({
        input: patternLayer,
        left: geometry.x,
        top: geometry.y
      });
      debugLayers.push({ name: `${getLayerNumber(part, 'pattern')}-${toDebugName(part)}-pattern.png`, buffer: patternLayer });
    }
  }

  const output = await sharp({
    create: {
      width: KIT_RENDER_GEOMETRY.canvas.width,
      height: KIT_RENDER_GEOMETRY.canvas.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(composites)
    .png()
    .toBuffer();

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, output);

  if (options.debug === true) {
    await writeDebugLayers(input, debugLayers, output, options.intermediateDir);
  }
}

async function createPartMask(assetPath: string, geometry: RenderGeometryPart): Promise<Buffer> {
  return sharp(assetPath)
    .resize(geometry.width, geometry.height, {
      fit: 'fill',
      kernel: sharp.kernel[KIT_RESIZE_KERNEL]
    })
    .ensureAlpha()
    .extractChannel('alpha')
    .raw()
    .toBuffer();
}

async function createColoredLayer(mask: Buffer, geometry: RenderGeometryPart, color: string): Promise<Buffer> {
  return sharp({
    create: {
      width: geometry.width,
      height: geometry.height,
      channels: 4,
      background: `#${color}`
    }
  })
    .composite([
      {
        input: mask,
        raw: {
          width: geometry.width,
          height: geometry.height,
          channels: 1
        },
        blend: 'dest-in'
      }
    ])
    .png()
    .toBuffer();
}

async function createPatternLayer(
  patternPath: string,
  mask: Buffer,
  geometry: RenderGeometryPart
): Promise<Buffer> {
  const pattern = await sharp(patternPath)
    .resize(geometry.width, geometry.height, {
      fit: 'fill',
      kernel: sharp.kernel[KIT_RESIZE_KERNEL]
    })
    .ensureAlpha()
    .png()
    .toBuffer();

  return sharp(pattern)
    .composite([
      {
        input: mask,
        raw: {
          width: geometry.width,
          height: geometry.height,
          channels: 1
        },
        blend: 'dest-in'
      }
    ])
    .png()
    .toBuffer();
}

async function writeDebugLayers(
  input: RenderKitPngInput,
  layers: Array<{ name: string; buffer: Buffer }>,
  output: Buffer,
  intermediateDir?: string
): Promise<void> {
  const baseDir = intermediateDir ?? join('.cache', 'wiki-kits', 'intermediate', input.teamId, input.variant);

  await mkdir(baseDir, { recursive: true });

  await Promise.all(layers.map((layer) => writeFile(join(baseDir, layer.name), layer.buffer)));
  await writeFile(join(baseDir, '09-composite.png'), output);
}

function getPartGeometry(part: KitLayerPart): RenderGeometryPart {
  return KIT_RENDER_GEOMETRY[part];
}

function getPartColor(params: WikipediaKitParams, part: KitLayerPart): string {
  switch (part) {
    case 'leftArm':
      return params.leftArmColor;
    case 'body':
      return params.bodyColor;
    case 'rightArm':
      return params.rightArmColor;
    case 'shorts':
      return params.shortsColor;
  }
}

function getLayerNumber(part: KitLayerPart, kind: 'base' | 'pattern'): string {
  const index = LAYER_ORDER.indexOf(part) * 2 + (kind === 'base' ? 1 : 2);

  return String(index).padStart(2, '0');
}

function toDebugName(part: KitLayerPart): string {
  return part.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`);
}
