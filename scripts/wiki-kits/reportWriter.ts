import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function writeImportReport(report: unknown, outputPath: string): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}
