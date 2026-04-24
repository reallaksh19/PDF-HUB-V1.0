# WI_A6 - Macro Productization

## Goal
Upgrade macro UX with validation, presets, donor binding, and reproducibility.

## Owned write scope
- frontend/src/components/sidebar/MacrosSidebar.tsx
- frontend/src/core/macro/** (UI-facing validation/reporting additions)

## Forbidden write scope
- View mode rendering model
- Thumbnail organize interactions

## Required deliverables
- Preset lifecycle
- Dry-run validation path
- Per-step errors, donor-file binding, continue-on-error batch mode
- Per-file summary + last-run reproducibility metadata

## Pass tests
- corepack pnpm --filter frontend exec tsc --noEmit
- corepack pnpm --filter frontend lint
- corepack pnpm --filter frontend test

## Manual validations
- Validate no auto-save dialogs triggered at run completion unless user clicks save

## Rollback criteria
- Any failed pass-test command.
- Any blocker regression in owned scope.
- Any unresolved conflict in protected files.

## Evidence checklist
- [ ] Summary of changes
- [ ] Files changed list
- [ ] Pass-test output snippets
- [ ] Manual validation results
- [ ] Known risks and follow-ups
