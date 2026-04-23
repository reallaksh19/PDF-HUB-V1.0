# WI_A1 - Command Bus + Document Mutation History

## Goal
Create one typed command/action path and product-safe undo/redo for document mutations.

## Owned write scope
- frontend/src/core/commands/**
- frontend/src/core/document-history/**
- Integration touchpoints for toolbar/sidebar/macro shortcut dispatch

## Forbidden write scope
- Search UI rendering behavior
- Review thread UX
- Thumbnail visual polish unrelated to command dispatch

## Required deliverables
- `core/commands/types.ts` and `dispatch.ts`
- Document mutation transaction store/types
- UI entrypoints dispatch through single command layer

## Pass tests
- corepack pnpm --filter frontend exec tsc --noEmit
- corepack pnpm --filter frontend lint
- corepack pnpm --filter frontend test

## Manual validations
- Undo/redo works for rotate/extract/split/delete/replace/header-footer/macro mutations
- No direct mutation bypasses remain in owned entrypoints

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
