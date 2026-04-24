# AGENT A2 PROMPT — Thumbnail Rail as Full Organize Surface

## Mission

You are **A2**. Upgrade the thumbnail rail into a real page-organize workspace with context actions, multi-selection depth, badges, and group drag behavior.

## Owned scope

* `frontend/src/components/sidebar/SidebarPanel.tsx`
* thumbnail subcomponents
* thumbnail context menu components
* page selection UX in sidebar
* organize affordances tied to command dispatch

## Forbidden scope

* command executor internals
* macro engine internals
* renderer search extraction
* view mode engine
* review-thread model

## Must implement

1. Right-click context menu on thumbnails:

   * rotate selected/current
   * extract selected/current
   * split selected/current
   * duplicate selected/current
   * delete selected/current
   * insert blank before/after
   * replace page
   * add page numbers
   * add header/footer to selected/current
2. Selection behavior:

   * click selects
   * Ctrl/Cmd toggles
   * Shift selects range
   * right-click on unselected thumbnail focuses it first
   * right-click on selected group preserves group
3. Drag/reorder behavior:

   * drag insertion indicator
   * group drag for selected pages
   * visible drop target state
4. Thumbnail badges:

   * current page
   * selected
   * annotation count
   * unresolved review count
   * search hit count hook point
5. Selected-page action strip above the rail for common actions

## Required UX rules

* context menu closes on outside click and Esc
* keyboard access to context menu
* no accidental deselection on right-click
* drag state must not fight context menu state

## Strict pass tests

Automated:

* `corepack pnpm --filter frontend exec tsc --noEmit`
* `corepack pnpm --filter frontend lint`
* `corepack pnpm --filter frontend test -- sidebar thumbnail`

Required test cases:

* right-click selection behavior
* range select
* group drag reorder
* context menu action dispatch
* badge rendering
* selected-page action strip behavior

Manual validations:

* multi-select then right-click preserves scope
* group drag shows correct insertion target
* current/selected badges update correctly
* unresolved count updates when comment status changes

Evidence:

* `Docs/execution/30_evidence/A2/RESULT.md`
