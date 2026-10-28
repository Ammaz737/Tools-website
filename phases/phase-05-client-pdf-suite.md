# Phase 05 - Client PDF Suite

This phase delivers the largest client-side differentiator after the core platform and utility tools are stable.

## Objective

Build a practical PDF suite that stays as browser-local as possible and postpones the hardest editor workflows until late.

## Recommended Batch Order

### Batch 05A - Structural PDF Operations

- `merge-pdf`
- `split-pdf`
- `rotate-pdf`
- `delete-pdf-pages`
- `rearrange-pdf-pages`

### Batch 05B - Image And Export PDF Workflows

- `jpg-to-pdf`
- `png-to-pdf`
- `pdf-to-jpg`
- `pdf-to-png`

### Batch 05C - Enhancement Tools

- `watermark-pdf`
- `sign-pdf`
- `protect-pdf`

### Batch 05D - Compression And Unlock Flow

- `compress-pdf`
- `unlock-pdf`

### Batch 05E - OCR

- `ocr-pdf`

### Batch 05F - Full Editor Milestone

- `edit-pdf`

## Supporting Work

- Thumbnail rendering
- Page selection UI
- Drag reorder support
- zip export when needed
- worker strategy for OCR and large operations

## Shared Rules

- Never upload files for client-designated tools
- Use `pdf-lib` and `pdfjs-dist` patterns consistently
- Keep large jobs visibly staged with loading and progress states
- Use sensible download names

## UI Guardrails

- Thumbnail-heavy tools should remain scannable and not feel cramped
- Selection, reorder, and page-state cues must be visually obvious
- Editing overlays should feel precise and not visually cluttered
- Keep the PDF workspace as the dominant area above the fold
- Preserve consistency between simple PDF tools and the advanced editor milestone

## Exit Criteria

- Core PDF workflows are usable in-browser
- The hardest PDF tool, `edit-pdf`, is intentionally isolated as its own batch
- Advanced processing does not compromise the simpler PDF tools

## Risks To Avoid

- Building `edit-pdf` too early
- Mixing page preview logic with export logic in a way that becomes hard to maintain
- Letting large PDF files freeze the interface
