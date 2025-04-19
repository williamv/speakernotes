import { mkdir, writeFile, unlink } from 'fs/promises';
import { join } from 'path';

export async function saveTempFile(file: File): Promise<string> {
  const tempDir = join(process.cwd(), 'temp');
  await mkdir(tempDir, { recursive: true });
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const inputPath = join(tempDir, file.name);
  await writeFile(inputPath, buffer);
  
  return inputPath;
}

export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error) {
    console.error('Error cleaning up temp file:', error);
  }
} 