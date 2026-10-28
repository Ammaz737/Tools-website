# Project Phases

This folder breaks the `CLAUDE.md` build spec into practical execution phases so the project can be built one batch at a time.

## How To Use These Files

1. Start with `phase-00-planning-freeze.md`.
2. Work on only one phase at a time.
3. Inside each phase, complete batches in order.
4. Do not jump to a later phase until the current phase exit criteria are met.
5. Keep the rules in `CLAUDE.md` as the source of truth when any detail conflicts.

## Execution Rules

- Client-side first whenever possible.
- Prefer reusable primitives over one-off implementations.
- Ship each phase in a usable state.
- Delay server-required tools until the client-heavy foundation is solid.
- Build hard tools last, especially AI, office conversion, and `edit-pdf`.

## Phase Index

- `phase-00-planning-freeze.md`
- `phase-01-foundation-platform.md`
- `phase-02-shared-ui-primitives.md`
- `phase-03-client-core-tools.md`
- `phase-04-client-image-tools.md`
- `phase-05-client-pdf-suite.md`
- `phase-06-server-utility-layer.md`
- `phase-07-ai-and-external-tools.md`
- `phase-08-polish-and-release.md`

## Source

These phase files are derived from:

- `CLAUDE.md`
- the build order in section 13
- the tool page contract in section 6
- the tool registry in section 8
- the done criteria in section 14
