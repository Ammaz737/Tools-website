import {
  Document,
  ImageRun,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table, TableRow, TableCell, WidthType,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
  TextWrappingType,
  LineRuleType,
  type ISectionOptions,
} from "docx";

import type { RenderedPdfPage } from "@/lib/pdf-client";

/** Convert PDF points to Word DXA (twentieths of a point). */
function ptsToDxa(points: number) {
  return Math.round(points * 20);
}

/** Convert PDF points to approximate on-screen pixels for ImageRun sizing. */
function ptsToDisplayPx(points: number) {
  return Math.max(1, Math.round((points / 72) * 96));
}

/**
 * Build a Word file that preserves PDF visual layout by embedding each page
 * as a full-page image. Each PDF page becomes its own Word section so sizes match.
 */
export async function buildDocxFromPdfPages(
  pages: RenderedPdfPage[],
): Promise<Blob> {
  if (pages.length === 0) {
    throw new Error("No PDF pages to convert");
  }

  const sections: ISectionOptions[] = pages.map((page) => ({
    properties: {
      page: {
        size: {
          width: ptsToDxa(page.widthPts),
          height: ptsToDxa(page.heightPts),
        },
        // docx's page-properties key is `margin` (singular). The previous
        // `margins` key silently didn't match this type, so every page kept
        // the library's default 1" margins — enough to push a full-page
        // image past the right/bottom edge and get clipped by viewers.
        margin: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
      },
    },
    children: [
      new Paragraph({
        spacing: { before: 0, after: 0, line: 1, lineRule: LineRuleType.EXACT },
        children: [
          new ImageRun({
            type: "png",
            data: page.pngBytes,
            transformation: {
              width: ptsToDisplayPx(page.widthPts),
              height: ptsToDisplayPx(page.heightPts),
            },
            // Full-page inline images inherit a text baseline/paragraph gap,
            // expanding the page or spilling onto an extra page in viewers.
            // Position relative to the physical page, outside text flow.
            floating: {
              horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
              verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
              wrap: { type: TextWrappingType.TOP_AND_BOTTOM },
              layoutInCell: false,
            },
            altText: {
              title: `Page ${page.pageNumber}`,
              description: `Rendered PDF page ${page.pageNumber}`,
              name: `page-${page.pageNumber}`,
            },
          }),
        ],
      }),
    ],
  }));

  const doc = new Document({ sections });
  return Packer.toBlob(doc);
}

export async function buildDocxFromText(
  title: string,
  bodyText: string,
): Promise<Blob> {
  const paragraphs = bodyText
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map(
      (line) =>
        new Paragraph({
          children: [new TextRun({ text: line, size: 22 })],
          spacing: { after: 160 },
        }),
    );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            text: title,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 300 },
          }),
          ...(paragraphs.length > 0
            ? paragraphs
            : [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: "No extractable text was found in this PDF. It may be a scanned image-only document.",
                      italics: true,
                    }),
                  ],
                }),
              ]),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}

/** Multi-page editable text DOCX (layout approximate, not visual clone). */
export async function buildDocxFromPageTexts(
  title: string,
  pageTexts: string[],
): Promise<Blob> {
  const children: Paragraph[] = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 240 },
    }),
  ];

  pageTexts.forEach((pageText, index) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Page ${index + 1}`,
            bold: true,
            size: 20,
          }),
        ],
        spacing: { before: 240, after: 120 },
      }),
    );

    pageText.split(/\n+/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      children.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed, size: 22 })],
          spacing: { after: 80 },
        }),
      );
    });
  });

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBlob(doc);
}

/** Reconstruct horizontal text and detected tables; not an arbitrary PDF clone. */
export async function buildDocxFromLayouts(pages: import("./pdf-client").ReconstructedPdfPage[]): Promise<Blob> {
  if (!pages.length) throw new Error("No PDF pages to convert");
  const sections: ISectionOptions[] = pages.map(page => {
    const children: (Paragraph | Table)[] = [];
    for (const block of page.blocks) {
      if (block.type === "table") {
        const usableWidth = Math.max(40, page.widthPts - 40);
        const starts = block.columnStarts;
        const widths = starts.map((start, index) => ptsToDxa(Math.max(20, (starts[index + 1] ?? Math.min(page.widthPts - 20, Math.max(...block.rows.flatMap(row => row.cells.map(cell => cell.x + cell.width))) + 10)) - start)));
        children.push(new Table({
          width: { size: Math.min(ptsToDxa(usableWidth), widths.reduce((a,b)=>a+b,0)), type: WidthType.DXA },
          columnWidths: widths,
          rows: block.rows.map(row => new TableRow({ children: starts.map((_, index) => {
            const cell = row.cells.find(entry => entry.columnIndex === index);
            return new TableCell({ margins: { top: 80, bottom: 80, left: 80, right: 80 }, children: [new Paragraph({ spacing: { before: 0, after: 0, line: Math.ceil((cell?.fontSize ?? row.fontSize) * 26), lineRule: LineRuleType.EXACT }, children: [new TextRun({ text: cell?.text ?? "", size: Math.round((cell?.fontSize ?? row.fontSize) * 2) })] })] });
          }) })),
        }));
      } else {
        for (const row of block.rows) children.push(new Paragraph({
          children: [new TextRun({ text: row.cells.map(cell => cell.text).join(" "), size: Math.round(row.fontSize * 2) })],
          spacing: { before: 0, after: 80 },
        }));
      }
    }
    return { properties: { page: { size: { width: ptsToDxa(page.widthPts), height: ptsToDxa(page.heightPts) }, margin: { top: 400, bottom: 400, left: 400, right: 400 } } }, children: children.length ? children : [new Paragraph("")] };
  });
  return Packer.toBlob(new Document({ sections }));
}
