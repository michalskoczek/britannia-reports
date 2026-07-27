// @ts-expect-error pdfMake
import pdfMake from 'pdfmake/build/pdfmake';

/**
 * Interception helpers for the PDF-fidelity baseline.
 *
 * The four report components end `generatePDF` with `pdfMake.createPdf(dd).download(fileName)`, so a
 * test cannot see the document definition and cannot let the call run either — `download` routes
 * through file-saver and would trigger real browser downloads under Karma.
 *
 * `pdfMake` is a mutable module object (every report component already assigns `pdfMake.vfs`), so we
 * swap `createPdf` for the duration of one call, keep the definition, and restore it. The original
 * function is captured at module load, before any swap, so rendering always uses the real pdfmake.
 */

/** The subset of pdfmake's browser document handle this project touches. */
interface PdfDocumentHandle {
  getBlob(): Promise<Blob>;
  download(filename?: string): Promise<void>;
  open(): Promise<void>;
}

interface PdfMakeBrowserModule {
  createPdf(definition: unknown): PdfDocumentHandle;
}

const pdfMakeModule = pdfMake as PdfMakeBrowserModule;

const originalCreatePdf: (definition: unknown) => PdfDocumentHandle =
  pdfMakeModule.createPdf.bind(pdfMakeModule);

const inertHandle = (): PdfDocumentHandle => ({
  getBlob: () => Promise.resolve(new Blob([], { type: 'application/pdf' })),
  download: () => Promise.resolve(),
  open: () => Promise.resolve(),
});

/**
 * Runs `generate` with `pdfMake.createPdf` swapped for a collector, and returns the document
 * definition the component handed to pdfmake. Nothing is rendered and nothing is downloaded.
 *
 * `createPdf` is always restored, including when `generate` throws — a component that crashes before
 * reaching pdfmake surfaces its real error rather than a spurious one from a leaked swap.
 */
export function capturePdfDefinition(generate: () => void): unknown {
  let captured: unknown = null;
  const installed = pdfMakeModule.createPdf;

  pdfMakeModule.createPdf = (definition: unknown): PdfDocumentHandle => {
    captured = definition;
    return inertHandle();
  };

  try {
    generate();
  } finally {
    pdfMakeModule.createPdf = installed;
  }

  return captured;
}

/** Renders a captured document definition with the real pdfmake. Rejects if pdfmake refuses it. */
export function renderToBlob(definition: unknown): Promise<Blob> {
  return originalCreatePdf(definition).getBlob();
}

/** Downloads a captured document definition under a caller-chosen filename. Capture harness only. */
export function downloadDefinition(definition: unknown, filename: string): Promise<void> {
  return originalCreatePdf(definition).download(filename);
}
