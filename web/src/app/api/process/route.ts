import { NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveTempFile, cleanupTempFile } from '@/utils/fileUtils';
import PPTX2Json from 'pptx2json';

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

    console.log('Processing file:', file.name);
    let inputPath: string | null = null;

    try {
      // Save the uploaded file temporarily
      inputPath = await saveTempFile(file);
      console.log('Temporary file saved at:', inputPath);

      // Parse the PowerPoint file
      console.log('Starting PowerPoint parsing...');
      const parser = new PPTX2Json();
      const json = await parser.parse(inputPath);
      console.log('JSON structure:', JSON.stringify(json, null, 2));

      if (!json || !json.slides) {
        throw new Error('No content extracted from PowerPoint file');
      }

      // Create paragraphs for each slide's notes
      const paragraphs = json.slides.map((slide: any, index: number) => {
        const notes = slide.notes || '';
        console.log(`Slide ${index + 1} notes:`, notes);

        // Extract the first 4 words for the header
        const firstFourWords = notes
          .split(/\s+/)
          .filter((word: string) => word.length > 0)
          .slice(0, 4)
          .join(' ');

        const slideHeader = `Slide ${index + 1} - ${firstFourWords}`;

        return [
          new Paragraph({
            text: slideHeader,
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [
              new TextRun(notes)
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
        { error: 'Failed to process file: ' + (error as Error).message },
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