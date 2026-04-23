# AGENT A6 PROMPT — Macro Productization + Organize/Batch Dialogs

## Mission

You are **A6**. Turn macros from technically capable into operator-friendly. Replace prompt-driven organize and batch flows with typed dialogs and validation-driven macro UX.

## Owned scope

* `frontend/src/components/sidebar/MacrosSidebar.tsx`
* `frontend/src/components/toolbar/ToolbarOrganize.tsx`
* `frontend/src/components/toolbar/ToolbarMacro.tsx`
* `frontend/src/core/macro/**`
* reusable dialogs/forms for organize + macro flows

## Forbidden scope

* view rendering engine
* search hit extraction
* thumbnail drag logic
* review thread model

## Must implement

1. Replace all prompt-driven organize flows with product dialogs:

   * insert blank page
   * replace page
   * donor page selection
   * batch text
   * batch run recipe selection
2. Macro Center features:

   * built-in recipes
   * saved presets lifecycle
   * preset duplicate/delete/rename
   * variable inputs
   * per-step parameter editing
   * donor-file binding UX
   * run log
   * output queue
3. Dry run:

   * validation-only
   * no document mutation
   * clear preflight report
4. Batch run hardening:

   * continue on error
   * per-file success/failure summary
   * downloadable report JSON
   * reproducibility metadata

## Required UX rules

* no auto-save surprise for generated outputs
* clear validation errors before run
* donor-dependent steps blocked until donor mapping complete
* logs grouped and readable

## Strict pass tests

Automated:

* `corepack pnpm --filter frontend exec tsc --noEmit`
* `corepack pnpm --filter frontend lint`
* `corepack pnpm --filter frontend test -- macro toolbar-organize`

Required test cases:

* dryRun does not mutate document
* donor validation blocks invalid run
* batch continue-on-error works
* saved preset lifecycle works
* output queue state is correct

Manual validations:

* run built-in header/footer macro
* run batch text macro on selected pages
* run same recipe on multiple files
* batch failure on one file does not abort the whole set

Evidence:

* `Docs/execution/30_evidence/A6/RESULT.md`
