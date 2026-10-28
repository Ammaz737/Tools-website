# Phase 03 - Client Core Tools

This phase ships the largest low-cost batch of useful tools using only browser computation wherever possible.

## Objective

Launch a strong practical product quickly by prioritizing client-only text, developer, converter, calculator, and utility tools.

## Why This Phase Comes Early

- Low server cost
- Faster implementation cycles
- Strong SEO surface area
- Repeated UI patterns
- Immediate user value

## Scope

- Text tools
- Developer tools
- Converters
- Calculators
- Simple utilities

## Recommended Batch Order

### Batch 03A - Text Tools

- `case-converter`
- `word-counter`
- `character-counter`
- `sentence-counter`
- `remove-duplicate-lines`
- `text-sorter`
- `text-cleaner`
- `lorem-ipsum-generator`
- `random-text-generator`
- `remove-extra-spaces`
- `reverse-text`

### Batch 03B - Developer Formatting Tools

- `json-formatter`
- `json-validator`
- `json-minifier`
- `xml-formatter`
- `xml-validator`
- `html-formatter`
- `html-minifier`
- `css-minifier`
- `javascript-minifier`
- `sql-formatter`

### Batch 03C - Developer Encoding And Utility Tools

- `base64-encoder`
- `base64-decoder`
- `url-encoder`
- `url-decoder`
- `jwt-decoder`
- `uuid-generator`
- `hash-generator`
- `md5-generator`
- `sha256-generator`

### Batch 03D - Converters

- `length-converter`
- `weight-converter`
- `area-converter`
- `temperature-converter`
- `time-zone-converter`
- `data-storage-converter`
- `binary-converter`
- `roman-numeral-converter`
- `currency-converter` after rate-source support is ready

### Batch 03E - Calculators

- `age-calculator`
- `bmi-calculator`
- `percentage-calculator`
- `emi-calculator`
- `loan-calculator`
- `gst-calculator`
- `vat-calculator`
- `discount-calculator`
- `profit-calculator`
- `scientific-calculator`
- `date-calculator`
- `mortgage-calculator`
- `roi-calculator`
- `tip-calculator`
- `margin-calculator`

### Batch 03F - Simple Utilities

- `qr-code-generator`
- `barcode-generator`
- `color-picker`
- `color-converter`
- `uuid-generator-util`
- `random-number-generator`
- `random-password-generator`
- `timestamp-converter`
- `unix-time-converter`
- `coin-flipper`
- `dice-roller`
- `stopwatch`
- `timer`
- `notepad-online`
- `todo-list-online`

## Shared Rules

- Keep tools live where computation is cheap
- Use copy and download actions where useful
- Keep everything mobile-friendly
- Use monospace output for computed results
- Persist only where the product spec calls for local storage

## UI Guardrails

- Reuse shared components instead of designing each tool from scratch
- Keep text and developer tools visually quiet and output-focused
- Use monospace consistently for results, formatted code, and calculations
- Keep accent usage disciplined so dense tool pages do not become noisy
- Preserve two-pane or structured layouts only where they improve clarity on mobile and desktop

## Exit Criteria

- A large set of tools is already usable
- Most common utility traffic can be served without server compute
- Reusable logic patterns for future tools are established

## Risks To Avoid

- Overengineering simple tools
- Introducing server calls to tools that should remain local
- Delaying shipping because every tool is treated like a complex app
