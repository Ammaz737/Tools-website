# Phase 00 - Planning Freeze

This phase turns the broad product spec into a controlled execution plan before implementation expands.

## Objective

Freeze the high-level structure so later phases can move fast without re-deciding core product rules.

## Must Follow From `CLAUDE.md`

- `CLAUDE.md` remains the source of truth.
- The product stays privacy-first, mobile-first, accessible, and SEO-ready.
- Every tool must map to a typed registry entry.
- The architecture must remain client-first wherever practical.

## Deliverables

- Finalized tool classification by runtime:
  - `client`
  - `server`
- Priority labeling for all tools:
  - Tier 1
  - Tier 2
  - Tier 3
- Confirmed category mapping for all 137 tools
- Agreed design system boundaries
- Confirmed phase sequencing
- A stable definition of done for tools and for phases

## Batches

### Batch 00A - Registry Audit

- Verify all 137 tool IDs
- Verify unique slugs
- Verify categories match `CLAUDE.md`
- Verify duplicate-like tools intentionally remain separate routes

### Batch 00B - Runtime Classification

- Mark each tool as `client` or `server`
- Note any tools that may need a fallback mode
- Mark server-cost risk areas

### Batch 00C - Priority Classification

- Tier 1: fastest, highest-value, client-heavy tools
- Tier 2: useful but more complex tools
- Tier 3: advanced or infra-heavy tools

### Batch 00D - UX Contract Freeze

- Confirm `ToolShell`
- Confirm `Dropzone`
- Confirm `ResultPanel`
- Confirm common input, processing, result, and error states

### Batch 00E - Delivery Rules

- One phase at a time
- One batch at a time
- No jumping ahead unless blockers force resequencing

## Exit Criteria

- The project has a locked execution order
- The registry structure is agreed
- Server-heavy tools are intentionally delayed
- Shared UX expectations are fixed before tool implementation starts

## Notes

If a new idea appears mid-build, add it to a later backlog unless it is required to unblock the current phase.
