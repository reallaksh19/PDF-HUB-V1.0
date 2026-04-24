# AGENT A3 PROMPT — Search with Hit Geometry + Navigation

## Mission

You are **A3**. Replace stubbed search with a real document search experience integrated into the viewer, sidebar, thumbnails, and top nav.

## Owned scope

* `frontend/src/components/sidebar/Search*`
* `frontend/src/components/shell/TopNav.tsx` search wiring
* `frontend/src/adapters/pdf-renderer/PdfRendererAdapter.ts`
* `frontend/src/core/search/**`
* active hit navigation model

## Forbidden scope

* thumbnail page menu
* macro UI
* review-threading UI
* command dispatcher internals

## Must implement

1. Search panel replacing any stub:

   * query input
   * result count
   * grouped-by-page results
   * active result state
   * next/previous
2. Hit geometry support:

   * extract page hit rectangles where possible
   * scroll-to-hit
   * flash/highlight active hit on page
3. Top nav search box wiring:

   * debounced search
   * Enter = next hit
   * clear/reset behavior
4. Thumbnail integration:

   * hit counts badge per page
5. State robustness:

   * search survives page navigation
   * active hit remains consistent until query changes

## Required UX rules

* empty search is not an error
* no duplicate results for same hit
* changing query clears stale active-hit state
* large search sets must remain responsive

## Strict pass tests

Automated:

* `corepack pnpm --filter frontend exec tsc --noEmit`
* `corepack pnpm --filter frontend lint`
* `corepack pnpm --filter frontend test -- search`

Required test cases:

* query returns grouped results
* clicking result jumps to correct page
* next/previous cycles correctly
* hit highlight renders for active result
* clearing search clears result state

Manual validations:

* search in long PDF remains usable
* thumbnail badges update
* active hit follows navigation without losing context

Evidence:

* `Docs/execution/30_evidence/A3/RESULT.md`
