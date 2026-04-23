# AGENT A7 PROMPT — Review Workflow Depth

## Mission

You are **A7**. Upgrade the app from annotation editor to review product. Build a proper comments/review index with filters, metadata, replies, and summary export.

## Owned scope

* comments/review sidebar
* review metadata model
* review summary export
* inspector review fields
* canvas hide-resolved integration

## Forbidden scope

* command bus
* macro executor
* view rendering model
* thumbnail organize rail

## Must implement

1. Review-first comments panel:

   * group by page
   * filter by open/resolved/rejected
   * type badges
   * jump-to-annotation
2. Metadata:

   * author
   * createdAt
   * updatedAt
   * reviewStatus
   * optional title/category
3. Replies/threads in static storage model
4. Bulk actions:

   * resolve
   * reopen
   * reject
5. Hide-resolved toggle on canvas
6. Export review summary:

   * JSON
   * human-readable summary view

## Required UX rules

* sidebar is the source of truth for review navigation
* resolved items can be found even when hidden on canvas
* clicking a sidebar row jumps and selects annotation reliably
* thread replies remain tied to parent review item

## Strict pass tests

Automated:

* `corepack pnpm --filter frontend exec tsc --noEmit`
* `corepack pnpm --filter frontend lint`
* `corepack pnpm --filter frontend test -- review comments inspector`

Required test cases:

* filter by status
* jump-to-annotation
* bulk resolve/reopen
* hide-resolved behavior
* summary export shape
* reply thread persistence

Manual validations:

* create note, resolve it, filter it, reopen it
* click sidebar row to jump
* summary export reflects current review state

Evidence:

* `Docs/execution/30_evidence/A7/RESULT.md`
