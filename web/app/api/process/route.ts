import { NextResponse } from 'next/server';
import { writeFile, mkdir, readFile } from 'fs/promises';
import { join } from 'path';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import pptx2json from 'pptx2json';
import os from 'os';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Use the system's temp directory
    const tempDir = join(os.tmpdir(), 'speakernotes');
    await mkdir(tempDir, { recursive: true });
    
    const inputPath = join(tempDir, file.name);
    const outputPath = join(tempDir, 'speaker_notes.docx');

    // Write the uploaded file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(inputPath, buffer);

    try {
      // Parse the PowerPoint file
      const pptxData = await pptx2json(inputPath);
      
      // Create a new Word document
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "Speaker Notes",
              heading: HeadingLevel.TITLE,
            }),
            new Paragraph({}),
          ],
        }],
      });

      // Process each slide
      for (let i = 0; i < pptxData.slides.length; i++) {
        const slide = pptxData.slides[i];
        
        // Add slide number as header
        doc.addParagraph(
          new Paragraph({
            text: `Slide ${i + 1}`,
            heading: HeadingLevel.HEADING_1,
          })
        );

        // Get notes
        const notes = slide.notes || 'No notes for this slide.';
        
        // Add notes with proper formatting
        doc.addParagraph(
          new Paragraph({
            children: [new TextRun(notes)],
          })
        );
        doc.addParagraph(new Paragraph({}));
      }

      // Save the document
      const docBuffer = await Packer.toBuffer(doc);
      await writeFile(outputPath, docBuffer);

      // Read the output file
      const outputBuffer = await readFile(outputPath);

      // Clean up temporary files
      await Promise.all([
        writeFile(inputPath, '').catch(console.error),
        writeFile(outputPath, '').catch(console.error),
      ]);

      // Return the file
      return new NextResponse(outputBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': 'attachment; filename="speaker_notes.docx"',
        },
      });
    } catch (error) {
      // Clean up temporary files in case of error
      await Promise.all([
        writeFile(inputPath, '').catch(console.error),
        writeFile(outputPath, '').catch(console.error),
      ]);
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