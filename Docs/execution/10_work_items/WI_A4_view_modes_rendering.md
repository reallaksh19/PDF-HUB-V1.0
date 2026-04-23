# AGENT A4 PROMPT — View Modes as Real Rendering Models

## Mission

You are **A4**. Turn view controls from dead state into actual rendering behavior. Implement continuous, single-page, two-page, fit-width, fit-page, and working hand/pan mode.

## Owned scope

* `frontend/src/components/workspace/**`
* `frontend/src/components/toolbar/ToolbarView.tsx`
* `frontend/src/core/session/store.ts` view-related integration
* rendering layout model

## Forbidden scope

* macro UI
* search panel
* review sidebar logic
* command history logic

## Must implement

1. Continuous mode:

   * virtualized page list
   * stable scroll behavior
2. Single-page mode:

   * only current page rendered
   * optional neighbor prefetch
3. Two-page mode:

   * proper spread pairing
   * first-page handling
   * centered spread layout
4. Fit modes:

   * fit width
   * fit page
   * recompute on resize
5. Hand tool:

   * click-drag pan
   * cursor feedback
6. Mode transitions:

   * preserve context
   * restore scroll/page focus sensibly

## Performance requirements

* virtualization policy for large docs
* bounded render churn
* no full rerender storm on mode toggle

## Strict pass tests

Automated:

* `corepack pnpm --filter frontend exec tsc --noEmit`
* `corepack pnpm --filter frontend lint`
* `corepack pnpm --filter frontend test -- view workspace`

Required test cases:

* viewMode changes layout
* fitMode changes zoom behavior
* hand tool pans
* mode switch preserves current page
* resize recomputes fit correctly

Manual validations:

* 200+ page PDF still responsive
* two-page spreads render correctly
* switching from continuous to single to two-page does not lose place badly

Evidence:

* `Docs/execution/30_evidence/A4/RESULT.md`
