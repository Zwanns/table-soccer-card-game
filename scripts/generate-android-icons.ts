import { mkdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const SOURCE_SIZE = 512;
const ADAPTIVE_CANVAS_DP = 108;
const ADAPTIVE_SAFE_ZONE_DP = 66;
const BLACK = { r: 0, g: 0, b: 0 } as const;

const densities = [
  { directory: 'mipmap-mdpi', legacySize: 48, scale: 1 },
  { directory: 'mipmap-hdpi', legacySize: 72, scale: 1.5 },
  { directory: 'mipmap-xhdpi', legacySize: 96, scale: 2 },
  { directory: 'mipmap-xxhdpi', legacySize: 144, scale: 3 },
  { directory: 'mipmap-xxxhdpi', legacySize: 192, scale: 4 }
] as const;

interface SymbolMask {
  data: Buffer;
  height: number;
  width: number;
}

async function extractSymbolMask(sourcePath: string): Promise<SymbolMask> {
  const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  const mask = Buffer.alloc(info.width * info.height);

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const sourceOffset = (y * info.width + x) * info.channels;
      const alpha = data[sourceOffset + 3] ?? 255;
      const luminance = Math.max(data[sourceOffset], data[sourceOffset + 1], data[sourceOffset + 2]);
      const maskAlpha = Math.round(luminance * alpha / 255);
      mask[y * info.width + x] = maskAlpha;

      if (maskAlpha > 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    throw new Error('The source icon does not contain a visible symbol.');
  }

  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const cropped = Buffer.alloc(width * height);

  for (let y = 0; y < height; y += 1) {
    const sourceOffset = (minY + y) * info.width + minX;
    mask.copy(cropped, y * width, sourceOffset, sourceOffset + width);
  }

  return { data: cropped, height, width };
}

async function createTransparentSymbol(
  mask: SymbolMask,
  canvasSize: number,
  contentSize: number
): Promise<Buffer> {
  const { data: resizedMask, info } = await sharp(mask.data, {
    raw: { channels: 1, height: mask.height, width: mask.width }
  })
    .resize(contentSize, contentSize, { fit: 'inside', kernel: sharp.kernel.lanczos3 })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const canvas = Buffer.alloc(canvasSize * canvasSize * 4);
  const left = Math.floor((canvasSize - info.width) / 2);
  const top = Math.floor((canvasSize - info.height) / 2);

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const alpha = resizedMask[(y * info.width + x) * info.channels];
      const targetOffset = ((top + y) * canvasSize + left + x) * 4;
      if (alpha === 0) {
        continue;
      }

      canvas[targetOffset] = 255;
      canvas[targetOffset + 1] = 255;
      canvas[targetOffset + 2] = 255;
      canvas[targetOffset + 3] = alpha;
    }
  }

  return sharp(canvas, { raw: { channels: 4, height: canvasSize, width: canvasSize } }).png().toBuffer();
}

async function writePng(image: sharp.Sharp, outputPath: string): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  await image.png().toFile(outputPath);
}

async function createColorForeground(sourcePath: string, canvasSize: number, contentSize: number): Promise<Buffer> {
  const { data, info } = await sharp(sourcePath)
    .ensureAlpha()
    .resize(contentSize, contentSize, { fit: 'inside', kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer({ resolveWithObject: true });
  const left = Math.floor((canvasSize - info.width) / 2);
  const top = Math.floor((canvasSize - info.height) / 2);

  return sharp(data)
    .extend({
      left,
      right: canvasSize - info.width - left,
      top,
      bottom: canvasSize - info.height - top,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();
}

async function main(): Promise<void> {
  const projectRoot = resolve(import.meta.dirname, '..');
  const sourcePath = resolve(projectRoot, process.argv[2] ?? 'TSM icon for GP.png');
  const sourceMetadata = await sharp(sourcePath).metadata();
  const sourceStats = await stat(sourcePath);

  if (sourceMetadata.width !== SOURCE_SIZE || sourceMetadata.height !== SOURCE_SIZE) {
    throw new Error(`Expected a ${SOURCE_SIZE}x${SOURCE_SIZE} source PNG, received ${sourceMetadata.width}x${sourceMetadata.height}.`);
  }

  const resRoot = resolve(projectRoot, 'android/app/src/main/res');
  const symbolMask = await extractSymbolMask(sourcePath);

  // branding/play-store-icon.png is maintained manually for Google Play and must never be overwritten here.
  for (const density of densities) {
    const outputDirectory = resolve(resRoot, density.directory);
    const legacy = sharp(sourcePath)
      .flatten({ background: BLACK })
      .resize(density.legacySize, density.legacySize, { fit: 'fill', kernel: sharp.kernel.lanczos3 });
    await writePng(legacy.clone(), resolve(outputDirectory, 'ic_launcher.png'));
    await writePng(legacy.clone(), resolve(outputDirectory, 'ic_launcher_round.png'));

    const canvasSize = Math.round(ADAPTIVE_CANVAS_DP * density.scale);
    const contentSize = Math.round(ADAPTIVE_SAFE_ZONE_DP * density.scale);
    const transparentSymbol = await createTransparentSymbol(symbolMask, canvasSize, contentSize);
    const colorForeground = await createColorForeground(sourcePath, canvasSize, contentSize);
    await writePng(sharp(colorForeground), resolve(outputDirectory, 'ic_launcher_foreground.png'));
    await writePng(sharp(transparentSymbol), resolve(outputDirectory, 'ic_launcher_monochrome.png'));
  }

  console.log(`Source: ${sourcePath} (${sourceMetadata.width}x${sourceMetadata.height}, ${sourceStats.size} bytes)`);
  console.log(`Symbol bounds: ${symbolMask.width}x${symbolMask.height}px; adaptive safe zone: ${ADAPTIVE_SAFE_ZONE_DP}dp`);
}

await main();
