/**
 * Server-side data loading utilities
 * Use these in API routes and server components to read data files.
 */

import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

export function readDataFile<T>(filename: string, fallback: T): T {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return fallback;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    console.error(`Failed to parse ${filename}`);
    return fallback;
  }
}

export function writeDataFile(filename: string, data: unknown): void {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function dataFileExists(filename: string): boolean {
  return fs.existsSync(path.join(DATA_DIR, filename));
}
