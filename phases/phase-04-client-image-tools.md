# Phase 04 - Client Image Tools

This phase expands the browser-first product with image workflows that can mostly run locally.

## Objective

Ship image tools with minimal server load while keeping performance, previews, and downloads smooth.

## Scope

- image compression
- resize
- crop
- rotate
- conversion
- HEIC support
- SVG export
- background removal
- upscaling fallback
- image-to-pdf
- screenshot annotation

## Recommended Batch Order

### Batch 04A - Image Processing Base

- Shared canvas helpers
- File validation
- Preview generation
- Download naming rules
- Batch processing patterns

### Batch 04B - Basic Transform Tools

- `image-compressor`
- `image-resizer`
- `crop-image`
- `rotate-image`

### Batch 04C - Format Conversion Tools

- `convert-image`
- `jpg-to-png`
- `png-to-jpg`
- `webp-converter`
- `webp-to-jpg`
- `webp-to-png`
- `jfif-to-png`
- `jpeg-to-jpg`
- `heic-to-jpg`
- `svg-converter`

### Batch 04D - Image To PDF

- `image-to-pdf`

### Batch 04E - Advanced Browser Imaging

- `background-remover`
- `image-upscaler`
- `screenshot-tool`

## Shared Rules

- Keep processing local whenever possible
- Use workers for expensive operations
- Avoid blocking the main thread during batch work
- Show clear before/after or input/output feedback

## UI Guardrails

- Keep previews large enough to be genuinely useful on small screens
- Distinguish controls, canvas areas, and result areas with clear surfaces
- Do not overload image pages with too many simultaneous accent states
- Preserve a calm editor feel even when a tool has many controls
- Keep loading and progress feedback visible during long browser tasks

## Exit Criteria

- Image workflows are reliable in-browser
- Heavy image tasks degrade gracefully when needed
- Downloads, previews, and batch handling are standardized

## Risks To Avoid

- Large synchronous canvas work freezing the UI
- Inconsistent export naming and result handling
- Promising AI-grade output where a best-effort local fallback is more honest
