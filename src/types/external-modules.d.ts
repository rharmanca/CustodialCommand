// Global type declarations for modules that don't have proper @types

declare module 'react-markdown' {
  const content: any;
  export default content;
}

declare module 'jspdf-autotable' {
  import { jsPDF } from 'jspdf';
  
  interface CellConfig {
    content: string;
    styles?: any;
  }
  
  interface TableConfig {
    head: CellConfig[][];
    body: CellConfig[][];
    startY?: number;
    theme?: 'striped' | 'grid' | 'plain';
  }
  
  export default function autoTable(doc: jsPDF, config: TableConfig): void;
}

declare module 'html2canvas' {
  interface Options {
    scale?: number;
    useCORS?: boolean;
    logging?: boolean;
  }
  
  type Element = HTMLElement;
  
  export default function html2canvas(element: Element, options?: Options): Promise<HTMLCanvasElement>;
}

declare module 'xlsx' {
  export interface WorkBook {
    SheetNames: string[];
    Sheets: { [name: string]: any };
  }
  
  export interface WorkSheet {}
  
  export function read(data: any, options?: any): WorkBook;
  export const utils: {
    json_to_sheet<T>(data: T[]): WorkSheet;
    sheet_to_json<T>(sheet: WorkSheet): T[];
    book_new(): WorkBook;
    book_append_sheet(workbook: WorkBook, sheet: WorkSheet, name: string): void;
  };
  export function writeFile(workbook: WorkBook, filename: string): void;
}

// Export an empty object to make this a module
export {};