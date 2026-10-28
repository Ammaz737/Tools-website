# Tool inventory

The generated [tool-inventory.md](tool-inventory.md) and [tool-test-matrix.json](tool-test-matrix.json) are authoritative. Regenerate with `npm run audit:tools`; record completed Chromium results with `npm run test:record` after a fresh production build and browser run.

2026-10-13: 137 unique registered IDs; 137 dispatcher entries; 0 generic placeholders. The 34 former placeholders have implementation workspaces; unsupported HEIC, unavailable plagiarism checking and unverified OCR/live providers still require resolution. Evidence is scoped and invalidated by source fingerprints. Neither route success nor dispatcher wiring is an operation PASS.
