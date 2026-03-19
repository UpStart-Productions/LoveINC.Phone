declare module 'html-to-pdfmake' {
  interface ConvertOptions {
    window?: unknown;
    removeExtraBlanks?: boolean;
  }

  function htmlToPdfmake(html: string, options?: ConvertOptions): unknown[];
  export = htmlToPdfmake;
}
