import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Create a temporary directory for processing
    const tempDir = join(process.cwd(), 'temp');
    const inputPath = join(tempDir, file.name);
    const outputPath = join(tempDir, 'speaker_notes.docx');

    // Write the uploaded file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(inputPath, buffer);

    // Run the Python script
    const pythonScript = join(process.cwd(), '..', 'extract_notes.py');
    await execAsync(`python ${pythonScript} ${inputPath} ${outputPath}`);

    // Read the output file
    const outputFile = await fetch(`file://${outputPath}`);
    const outputBuffer = await outputFile.arrayBuffer();

    // Clean up temporary files
    await execAsync(`rm -rf ${tempDir}`);

    // Return the file
    return new NextResponse(outputBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="speaker_notes.docx"',
      },
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
} 