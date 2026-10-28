# Phase 01 - Foundation Platform

This phase builds the shared product skeleton from sections 2, 3, 4, 5, 6, and 12 of `CLAUDE.md`.

## Objective

Create a navigable, branded, scalable toolbox platform before implementing real tools.

## Scope

- App structure
- Global layout
- Theme foundation
- Route structure
- Tool registry
- Listing pages
- Dynamic tool page shell
- SEO base plumbing

## Core Deliverables

- `app/layout.tsx`
- `app/page.tsx`
- `app/tools/page.tsx`
- `app/tools/[slug]/page.tsx`
- `app/category/[slug]/page.tsx`
- `lib/tools.ts`
- header/footer
- theme toggle
- 404 page
- sitemap and robots generation

## Batches

### Batch 01A - App Shell

- Build root layout
- Add header
- Add footer
- Add base spacing and responsive layout rules

### Batch 01B - Design Tokens

- Add color tokens from `CLAUDE.md`
- Add typography setup
- Add light/dark theme support
- Add focus, border, and surface system

### Batch 01C - Registry

- Create typed `lib/tools.ts`
- Add all tools with category, runtime, blurb, and keywords
- Ensure the registry becomes the source of truth for navigation and metadata

### Batch 01D - Browse Surfaces

- Build home page scaffold
- Build `/tools`
- Build `/category/[slug]`
- Ensure counts come from registry

### Batch 01E - Dynamic Tool Routing

- Load tool content by slug
- Show placeholder or shell for not-yet-implemented tools
- Connect breadcrumbs and related tools to registry

### Batch 01F - Base SEO

- Metadata helpers
- page titles
- descriptions
- canonical tags
- sitemap
- robots

## UI Foundations Checklist

This phase must lock the design language defined in section 3 of `CLAUDE.md` before feature work expands.

### Brand Identity

- The product should feel like a warm editorial workshop, not a glassy dark SaaS clone
- Pages should feel calm, crisp, readable, and tool-focused
- The UI should look original even when the feature set overlaps with reference products

### Color And Theme Rules

- Use the `CLAUDE.md` token system as the only source of color truth
- Default to the warm paper light theme
- Support dark mode with the defined warm dark palette
- Keep global brand accent usage intentional and limited
- Use category colors only for stripes, dots, and badges, not for whole-screen theming

### Typography Rules

- Use serif display typography for major headings
- Use a clean sans-serif for UI and body copy
- Use monospace for computed values, results, code, and structured output
- Keep numeric outputs legible and tabular where appropriate

### Shape And Surface Rules

- Prefer bordered surfaces over shadow-heavy surfaces
- Keep radius values consistent with the design system
- Maintain clear separation between page background, cards, and sunk panels
- Use shadows sparingly and only where the design system allows them

### Accent And Visual Discipline

- Use one primary accent emphasis per view
- Do not flood pages with orange or mixed highlight colors
- Keep category stripes and category dots consistent across listings and tool pages
- Preserve a crisp editorial hierarchy instead of decorative noise

### Motion And Accessibility Baseline

- Motion should be subtle and short
- Respect reduced-motion preferences
- Visible focus states must exist from the beginning
- Keyboard navigation must be considered part of the foundation, not polish

### Layout Baseline

- Build mobile-first from the start
- Keep tool workspaces above the fold where possible
- Reserve space for ads and dynamic regions to avoid layout shift
- Ensure listing pages and tool pages share consistent spacing rules

## Exit Criteria

- Site is browseable
- Every route shape exists
- Tool pages resolve from the registry
- The visual system reflects the intended product identity
- Future tools can be plugged in without structural changes
- The foundational visual rules are documented clearly enough to prevent design drift

## Risks To Avoid

- Hardcoding tool data outside the registry
- Building tool pages before the shell contract is stable
- Letting page structure drift from the shared route model
