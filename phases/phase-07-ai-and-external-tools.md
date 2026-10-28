# Phase 07 - AI And External Tools

This phase adds the highest-variability tools after the core product is already useful without them.

## Objective

Ship AI and external-service tools behind clean contracts, graceful fallback states, and clear cost boundaries.

## Scope

- AI writing tools
- grammar and rewrite tools
- translation
- AI detection
- plagiarism integrations
- office conversion routes

## Recommended Batch Order

### Batch 07A - Shared AI API Layer

- `POST /api/ai/:task`
- provider abstraction
- input length limits
- rate limiting
- streaming responses
- not-configured handling

### Batch 07B - AI Writing Tools

- `ai-writer`
- `ai-email-writer`
- `ai-summarizer`
- `paraphrasing-tool`
- `article-rewriter`
- `ai-humanizer`

### Batch 07C - Language Tools

- `grammar-checker`
- `spell-checker`
- `ai-translator`

### Batch 07D - Detection And Similarity Tools

- `ai-detector`
- `plagiarism-checker`

### Batch 07E - Office Conversion

- `pdf-to-word`
- `word-to-pdf`
- `pdf-to-excel`
- `excel-to-pdf`
- `pdf-to-powerpoint`
- `powerpoint-to-pdf`

## Shared Rules

- Do not fake outputs when services are unavailable
- Return explicit not-configured states when keys are missing
- Stream where supported
- Be honest about limitations for detector and plagiarism tools

## UI Guardrails

- AI pages should remain tool-like, not chat-app clones
- Inputs, streamed outputs, retries, and copy actions should follow one reusable pattern
- Warnings about limitations should be visible but not alarmist
- External-service tools should clearly differentiate ready, processing, rate-limited, and unavailable states
- Keep the interface calm even when the underlying provider behavior is variable

## Exit Criteria

- The AI layer is reusable instead of duplicated per tool
- External dependencies are isolated behind route contracts
- The app remains valuable even if AI services are unavailable

## Risks To Avoid

- Shipping AI first and delaying the stable product
- Hiding provider failures behind vague errors
- Overpromising detector accuracy or plagiarism certainty
