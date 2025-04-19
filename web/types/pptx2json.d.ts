declare module 'pptx2json' {
  interface Slide {
    notes?: string;
    [key: string]: any;
  }

  interface PptxData {
    slides: Slide[];
    [key: string]: any;
  }

  function pptx2json(filePath: string): Promise<PptxData>;
  export default pptx2json;
} 