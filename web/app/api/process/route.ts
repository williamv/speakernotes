import { NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
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
    await mkdir(tempDir, { recursive: true });
    
    const inputPath = join(tempDir, file.name);
    const outputPath = join(tempDir, 'speaker_notes.docx');

    // Write the uploaded file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(inputPath, buffer);

    // Run the Python script with the correct Python path
    const pythonScript = join(process.cwd(), 'extract_notes.py');
    console.log('Running Python script:', pythonScript);
    console.log('Input path:', inputPath);
    console.log('Output path:', outputPath);
    
    // Use the full path to Python and set PYTHONPATH
    const { stdout, stderr } = await execAsync(
      `PYTHONPATH=/usr/local/lib/python3.11/site-packages python3 ${pythonScript} "${inputPath}" "${outputPath}"`,
      { env: { ...process.env, PYTHONPATH: '/usr/local/lib/python3.11/site-packages' } }
    );

    console.log('Python script output:', stdout);
    if (stderr) console.error('Python script errors:', stderr);

    // Read the output file directly
    const outputBuffer = await readFile(outputPath);

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
      { error: 'Failed to process file. Please make sure the file is a valid PowerPoint file.' },
      { status: 500 }
    );
  }
} 