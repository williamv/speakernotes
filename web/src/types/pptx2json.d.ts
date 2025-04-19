declare module 'pptx2json' {
  function PPTX2Json(): {
    parse(filePath: string): Promise<{
      slides: Array<{
        notes?: string;
      }>;
    }>;
  };
  export default PPTX2Json;
} 