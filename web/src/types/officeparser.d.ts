declare module 'officeparser' {
  interface OfficeParserConfig {
    ignoreNotes?: boolean;
    putNotesAtLast?: boolean;
    newlineDelimiter?: string;
    outputErrorToConsole?: boolean;
  }

  export function parseOfficeAsync(filePath: string | Buffer | ArrayBuffer, config?: OfficeParserConfig): Promise<string>;
} 