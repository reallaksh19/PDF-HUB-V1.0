# AGENT A1 PROMPT — Single Command Layer + Document Mutation History + Save/Export Semantics

## Mission

You are **A1**. Build the single source of truth for all page/document actions. Eliminate multi-path execution drift. Add product-safe undo/redo for document mutations. Clarify save/export/session semantics in code and state.

## Owned scope

* `frontend/src/core/commands/**`
* `frontend/src/core/document-history/**`
* `frontend/src/core/session/types.ts`
* `frontend/src/core/session/store.ts`
* integration adapters used by toolbar/sidebar/macro entrypoints
* file/save/export action contracts

## Forbidden scope

* search UI
* thumbnail UI
* macro visual builder
* annotation rendering rules
* comments/review threading

## Must implement

1. Typed command contract:

   * `DocumentCommand`
   * `CommandSource`
   * `CommandPayload`
   * `CommandResult`
   * `CommandContext`
2. Single dispatcher:

   * toolbar uses dispatcher
   * thumbnail context menu uses dispatcher
   * macro runner uses dispatcher
   * keyboard shortcuts use dispatcher
3. Document mutation history:

   * rotate pages
   * reorder pages
   * extract/split/delete
   * insert/replace page
   * header/footer
   * batch text
   * macro-applied mutations
4. Session/save/export model:

   * explicit “save working document”
   * explicit “save session snapshot”
   * explicit “export flattened review copy”
   * explicit “download processed PDF”
5. Dirty-state semantics:

   * document dirty
   * review dirty
   * session dirty
6. Prevent direct `replaceWorkingCopy` style mutation from UI except through dispatcher-approved flows.

## Required file outputs

Create/update:

* `frontend/src/core/commands/types.ts`
* `frontend/src/core/commands/dispatch.ts`
* `frontend/src/core/document-history/types.ts`
* `frontend/src/core/document-history/store.ts`
* `frontend/src/core/document-history/transactions.ts`
* `frontend/src/core/session/types.ts`
* `frontend/src/core/session/store.ts`

## Required validations

You must prove:

* same rotate command produces identical result from toolbar, macro, and thumbnail menu
* undo reverses document mutation
* redo reapplies document mutation
* save/export actions are typed and distinguishable

## Strict pass tests

Automated:

* `corepack pnpm --filter frontend exec tsc --noEmit`
* `corepack pnpm --filter frontend lint`
* `corepack pnpm --filter frontend test -- core/commands core/document-history core/session`

Required test cases:

* command dispatch parity
* transaction push/pop
* undo/redo for rotate
* undo/redo for header/footer apply
* undo/redo for split/delete
* save/export action typing
* dirty-state transitions

Structural gates:

* no UI component directly mutates document bytes except through dispatcher
* no duplicate command handlers for same action

Manual validations:

* rotate → undo → redo
* add page numbers → undo → redo
* apply header/footer from macro and from UI, same output
* save working document does not falsely imply flattened review export

Evidence:

* `Docs/execution/30_evidence/A1/RESULT.md`
