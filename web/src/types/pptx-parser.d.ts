declare module 'pptx-parser' {
  export function parse(filePath: string): Promise<{
    slides: Array<{
      notes?: string;
    }>;
  }>;
} 