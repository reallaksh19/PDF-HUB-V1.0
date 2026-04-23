# AGENT A8 PROMPT — Feedback, Accessibility, Performance, Reproducibility, Tests

## Mission

You are **A8**. Harden the product shell: feedback, accessibility, performance, test depth, and reproducible delivery.

## Owned scope

* shared feedback components
* accessibility wiring
* performance optimizations
* test expansion
* build/install reproducibility
* code splitting of heavy UI surfaces

## Forbidden scope

* alternate command paths
* feature-specific business logic already owned by A1–A7

## Must implement

1. Feedback system:

   * toasts for success/failure
   * inline validation
   * non-blocking progress UI
   * recoverable error states
2. Accessibility:

   * keyboard navigation for thumbnails
   * keyboard context menu usage
   * focus trap in dialogs
   * ARIA roles/labels
   * visible focus states
3. Performance:

   * bounded thumbnail rendering
   * lazy-load heavy sidebars
   * macro panel split
   * throttled persistence/autosave
   * large-doc smoke resilience
4. Reproducibility:

   * lockfile sync
   * clean install verification
   * build verification
5. Test expansion:

   * macros
   * batch runner
   * thumbnail context actions
   * text selection flows
   * view mode flows
   * save/export distinction
   * donor-file flows

## Strict pass tests

Automated:

* `corepack pnpm --filter frontend exec tsc --noEmit`
* `corepack pnpm --filter frontend lint`
* `corepack pnpm --filter frontend test`
* clean install succeeds from fresh checkout

Required test cases:

* keyboard navigation in dialogs and menus
* toast visibility on failure
* lazy-loaded panels still function
* large thumbnail set does not lock UI
* save/export distinction tests
* macro failure reporting tests

Manual validations:

* Chrome keyboard-only smoke
* Edge keyboard-only smoke
* 200+ page PDF smoke
* repeated page operations smoke
* repeated macro batch smoke

Evidence:

* `Docs/execution/30_evidence/A8/RESULT.md`
