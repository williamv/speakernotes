import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { parseOfficeAsync } from 'officeparser';
import { saveTempFile, cleanupTempFile } from '@/utils/fileUtils';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    let inputPath: string | null = null;

    try {
      // Save the uploaded file temporarily
      inputPath = await saveTempFile(file);

      // Parse the PowerPoint file
      const parsedText = await parseOfficeAsync(inputPath, {
        ignoreNotes: false,
        putNotesAtLast: false,
        newlineDelimiter: '\n'
      });

      // Split the text into slides based on the format
      const slides = parsedText.split(/\n(?=Slide \d+)/).filter(Boolean);

      // Create paragraphs for each slide's notes
      const paragraphs = slides.map((slideText: string) => {
        const [header, ...notes] = slideText.split('\n');
        return [
          new Paragraph({
            text: header.trim(),
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun(notes.join('\n').trim())
            ]
          })
        ];
      }).flat();

      // Create a new Word document with all paragraphs
      const doc = new Document({
        sections: [{
          properties: {},
          children: paragraphs
        }]
      });

      // Generate the Word document
      const docBuffer = await Packer.toBuffer(doc);

      // Return the Word document
      return new NextResponse(docBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${file.name.replace('.pptx', '')}_notes.docx"`
        }
      });
    } catch (error) {
      console.error('Error processing file:', error);
      return NextResponse.json(
        { error: 'Failed to process file' },
        { status: 500 }
      );
    } finally {
      // Clean up the temporary file
      if (inputPath) {
        await cleanupTempFile(inputPath);
      }
    }
  } catch (error) {
    console.error('Error handling request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 