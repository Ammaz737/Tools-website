# Phase 02 - Shared UI Primitives

This phase builds the component system that all tools will reuse.

## Objective

Prevent duplication by building a consistent UI layer before large-scale tool implementation.

## Scope

Build the core components named in section 3.5 of `CLAUDE.md`.

## Primary Components

- `Button`
- `IconButton`
- `Input`
- `Textarea`
- `Select`
- `Toggle`
- `Slider`
- `Checkbox`
- `RadioGroup`
- `Tabs`
- `Tooltip`
- `Dialog`
- `Dropdown`
- `Toast`
- `Badge`
- `Card`
- `Breadcrumbs`
- `CopyButton`
- `EmptyState`
- `Spinner`
- `ProgressBar`
- `Dropzone`
- `ResultPanel`
- `ToolShell`

## Batches

### Batch 02A - Form Foundation

- Button variants
- text inputs
- textarea
- select controls
- checkbox and radio controls

### Batch 02B - Feedback Components

- spinner
- progress bar
- empty state
- toast
- badges and pills

### Batch 02C - Layout Components

- card
- breadcrumbs
- tabs
- dialog
- dropdown

### Batch 02D - Tool-Specific Primitives

- `CopyButton`
- `Dropzone`
- `ResultPanel`
- `ToolShell`

### Batch 02E - Interaction Polish

- keyboard states
- loading states
- clear disabled states
- focus visibility
- reduced-motion support

## Component UI Rules

This phase translates the design system into reusable component behavior.

### Shared Component Standards

- Components must use shared tokens instead of ad hoc colors or spacing
- Similar components should feel like members of one family
- State styling must be predictable across inputs, buttons, cards, and panels
- Components should be easy to compose without restyling per tool

### Inputs And Controls

- Inputs should feel clean, quiet, and sturdy
- Borders should do more visual work than shadows
- Disabled, error, focus, and active states must be clearly distinguishable
- Controls must remain usable on small screens and with keyboard-only input

### Buttons And Actions

- Primary buttons should carry the main accent
- Secondary and ghost buttons should remain visually restrained
- Danger actions should be obvious but not dominant
- Loading states should preserve layout and clearly communicate processing

### Cards, Panels, And Surfaces

- Cards should use the shared editorial shape language
- Sunk panels should feel distinct from normal cards
- Result surfaces should visually separate input from output
- Floating UI should use the limited shadow system defined in `CLAUDE.md`

### Tool-Specific Primitives

- `Dropzone` should be the standard file intake surface everywhere
- `ResultPanel` should be the standard result pattern everywhere
- `ToolShell` should enforce shared page structure and trust messaging
- `CopyButton` behavior should stay consistent across all output surfaces

### Typography And Output Rules

- Computed results should use monospace styling
- UI copy should stay calm and concise
- Labels and helper text should maintain strong readability contrast
- Number-heavy tools should prefer tabular numeric presentation

### Interaction And Motion Rules

- Hover and active feedback should be subtle
- Drag interactions may feel slightly more dynamic where appropriate
- Reduced-motion mode should remove transforms that are not essential
- Focus indicators must remain visible across all interactive components

### Accessibility Baseline

- Components should be keyboard reachable and screen-reader friendly
- Error feedback should be understandable and close to the source
- Status changes should be communicated clearly
- Reusable primitives must not ship with hidden accessibility debt

## Exit Criteria

- Tools can reuse components without custom one-off UI work
- File-based tools have a standard input surface
- Output-heavy tools have a standard result surface
- Tool pages can be composed consistently with `ToolShell`
- Shared components enforce the design language instead of only approximating it

## Risks To Avoid

- Building tool UIs directly before primitives are ready
- Letting similar controls diverge in spacing or behavior
- Hiding accessibility work until the end
