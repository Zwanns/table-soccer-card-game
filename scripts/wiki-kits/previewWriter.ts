import { access, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import type { KitVariant, TeamId } from './types';

type PreviewTeam = {
  teamId: TeamId;
  label: string;
};

type PreviewOverlay = {
  input: Buffer;
  left: number;
  top: number;
};

export type WikiKitsPreviewCell = {
  teamId: TeamId;
  variant: KitVariant;
  label: string;
  row: number;
  column: number;
  x: number;
  y: number;
  imageX: number;
  imageY: number;
  imageWidth: number;
  imageHeight: number;
  pngPath: string;
};

export const WIKI_KITS_PREVIEW_LAYOUT = {
  rows: 3,
  columns: 2,
  padding: 24,
  gapX: 20,
  gapY: 20,
  cellWidth: 286,
  cellHeight: 262,
  imageWidth: 160,
  imageHeight: 175,
  imageTop: 26,
  labelTop: 220
} as const;

export const WIKI_KITS_PREVIEW_SIZE = {
  width:
    WIKI_KITS_PREVIEW_LAYOUT.padding * 2 +
    WIKI_KITS_PREVIEW_LAYOUT.columns * WIKI_KITS_PREVIEW_LAYOUT.cellWidth +
    (WIKI_KITS_PREVIEW_LAYOUT.columns - 1) * WIKI_KITS_PREVIEW_LAYOUT.gapX,
  height:
    WIKI_KITS_PREVIEW_LAYOUT.padding * 2 +
    WIKI_KITS_PREVIEW_LAYOUT.rows * WIKI_KITS_PREVIEW_LAYOUT.cellHeight +
    (WIKI_KITS_PREVIEW_LAYOUT.rows - 1) * WIKI_KITS_PREVIEW_LAYOUT.gapY
} as const;

const PREVIEW_TEAMS: PreviewTeam[] = [
  { teamId: 'poland', label: 'Poland' },
  { teamId: 'ukraine', label: 'Ukraine' },
  { teamId: 'brazil', label: 'Brazil' }
];
const PREVIEW_VARIANTS: KitVariant[] = ['home', 'away'];

const COLORS = {
  background: '#F4F6F5',
  grid: '#E3E9E6',
  cellBackground: '#FFFFFF',
  cellBorder: '#B9C8C1',
  placeholderBackground: '#CDD6D2',
  placeholderBorder: '#99A8A1',
  placeholderText: '#5E6D66',
  label: '#26332F'
} as const;

export async function writePreview(inputRoot: string, outputPath: string): Promise<void> {
  const cells = getPreviewCells(inputRoot);
  const composites: PreviewOverlay[] = [
    {
      input: Buffer.from(createBackgroundSvg()),
      left: 0,
      top: 0
    }
  ];

  for (const cell of cells) {
    const pngExists = await fileExists(cell.pngPath);

    composites.push({
      input: Buffer.from(createCellSvg(cell, pngExists)),
      left: cell.x,
      top: cell.y
    });

    if (pngExists) {
      composites.push({
        input: await sharp(cell.pngPath)
          .resize(cell.imageWidth, cell.imageHeight, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .png()
          .toBuffer(),
        left: cell.x + cell.imageX,
        top: cell.y + cell.imageY
      });
    }
  }

  await mkdir(dirname(outputPath), { recursive: true });
  await sharp({
    create: {
      width: WIKI_KITS_PREVIEW_SIZE.width,
      height: WIKI_KITS_PREVIEW_SIZE.height,
      channels: 4,
      background: COLORS.background
    }
  })
    .composite(composites)
    .png()
    .toFile(outputPath);
}

export function getPreviewCells(inputRoot: string): WikiKitsPreviewCell[] {
  return PREVIEW_TEAMS.flatMap((team, row) =>
    PREVIEW_VARIANTS.map((variant, column) => {
      const x =
        WIKI_KITS_PREVIEW_LAYOUT.padding +
        column * (WIKI_KITS_PREVIEW_LAYOUT.cellWidth + WIKI_KITS_PREVIEW_LAYOUT.gapX);
      const y =
        WIKI_KITS_PREVIEW_LAYOUT.padding +
        row * (WIKI_KITS_PREVIEW_LAYOUT.cellHeight + WIKI_KITS_PREVIEW_LAYOUT.gapY);
      const imageX = Math.round((WIKI_KITS_PREVIEW_LAYOUT.cellWidth - WIKI_KITS_PREVIEW_LAYOUT.imageWidth) / 2);

      return {
        teamId: team.teamId,
        variant,
        label: `${team.label} / ${variant}`,
        row,
        column,
        x,
        y,
        imageX,
        imageY: WIKI_KITS_PREVIEW_LAYOUT.imageTop,
        imageWidth: WIKI_KITS_PREVIEW_LAYOUT.imageWidth,
        imageHeight: WIKI_KITS_PREVIEW_LAYOUT.imageHeight,
        pngPath: join(inputRoot, team.teamId, `${variant}.png`)
      };
    })
  );
}

function createBackgroundSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIKI_KITS_PREVIEW_SIZE.width}" height="${WIKI_KITS_PREVIEW_SIZE.height}" viewBox="0 0 ${WIKI_KITS_PREVIEW_SIZE.width} ${WIKI_KITS_PREVIEW_SIZE.height}">
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="${COLORS.grid}" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="${COLORS.background}"/>
  <rect width="100%" height="100%" fill="url(#grid)" opacity="0.65"/>
</svg>`;
}

function createCellSvg(cell: WikiKitsPreviewCell, pngExists: boolean): string {
  const placeholder = pngExists
    ? ''
    : `<g>
      <rect x="${cell.imageX}" y="${cell.imageY}" width="${cell.imageWidth}" height="${cell.imageHeight}" rx="3" fill="${COLORS.placeholderBackground}" stroke="${COLORS.placeholderBorder}" stroke-width="2"/>
      <path d="M ${cell.imageX + 12} ${cell.imageY + cell.imageHeight - 12} L ${cell.imageX + cell.imageWidth - 12} ${cell.imageY + 12}" stroke="${COLORS.placeholderBorder}" stroke-width="2" opacity="0.55"/>
      <text x="${WIKI_KITS_PREVIEW_LAYOUT.cellWidth / 2}" y="${cell.imageY + cell.imageHeight / 2 + 6}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="16" font-weight="700" fill="${COLORS.placeholderText}">PNG missing</text>
    </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIKI_KITS_PREVIEW_LAYOUT.cellWidth}" height="${WIKI_KITS_PREVIEW_LAYOUT.cellHeight}" viewBox="0 0 ${WIKI_KITS_PREVIEW_LAYOUT.cellWidth} ${WIKI_KITS_PREVIEW_LAYOUT.cellHeight}">
  <rect x="0.5" y="0.5" width="${WIKI_KITS_PREVIEW_LAYOUT.cellWidth - 1}" height="${WIKI_KITS_PREVIEW_LAYOUT.cellHeight - 1}" rx="6" fill="${COLORS.cellBackground}" stroke="${COLORS.cellBorder}" stroke-width="1"/>
  ${placeholder}
  <text x="${WIKI_KITS_PREVIEW_LAYOUT.cellWidth / 2}" y="${WIKI_KITS_PREVIEW_LAYOUT.labelTop}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" fill="${COLORS.label}">${escapeXml(cell.label)}</text>
</svg>`;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
