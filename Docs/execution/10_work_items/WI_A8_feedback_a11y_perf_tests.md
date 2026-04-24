# WI_A8 - Feedback + Accessibility + Performance + Tests

## Goal
Add robust user feedback, accessibility compliance, performance hardening, and risk-focused tests.

## Owned write scope
- Shared UI feedback components
- accessibility behavior in dialogs/menus/thumbnail keyboard flow
- performance and test suites

## Forbidden write scope
- Core command schema
- Macro business logic unrelated to feedback/a11y/perf

## Required deliverables
- Toast and inline validation patterns
- Non-blocking long-run progress + recoverable errors
- Performance optimizations (virtualization/lazy-load/throttling)
- Expanded tests for high-risk flows

## Pass tests
- corepack pnpm --filter frontend exec tsc --noEmit
- corepack pnpm --filter frontend lint
- corepack pnpm --filter frontend test

## Manual validations
- Validate keyboard-only operation for thumbnails/context menus/dialogs and visible focus states

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
