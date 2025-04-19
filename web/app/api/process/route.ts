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
    
    try {
      // Run the Python script
      const { stdout, stderr } = await execAsync(
        `python3 ${pythonScript} "${inputPath}" "${outputPath}"`
      );

      console.log('Python script output:', stdout);
      if (stderr) console.error('Python script errors:', stderr);

      // Check if the output file exists
      try {
        await readFile(outputPath);
      } catch (error) {
        console.error('Output file not found:', error);
        throw new Error('Failed to generate output file');
      }

      // Read the output file
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
      // Clean up temporary files in case of error
      await execAsync(`rm -rf ${tempDir}`).catch(console.error);
      throw error;
    }
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process file. Please make sure the file is a valid PowerPoint file.' },
      { status: 500 }
    );
  }
} 