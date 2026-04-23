# PDF Hub source-fix work instructions

This is a source-level fix plan aimed at getting the current app to a stable base quickly while still improving the product in the exact areas you asked about: thumbnail/page operations, annotations+inspector, search/replace feasibility, and expert macros.

## What is already fixed in the attached patch bundle

### Phase 0 stabilization fixes included now

1. **Toolbar organize merge cleanup**
   - Removed the duplicate `handleBatchRun` declaration.
   - Removed the dead `runMacroRecipeAcrossFiles(...)` call path.
   - Kept one batch-run flow using `BatchRunDialog` + `runMacroBatch`.
   - File: `frontend/src/components/toolbar/ToolbarOrganize.tsx`

2. **Macro contract alignment**
   - Added missing macro op types for `draw_text_on_pages`.
   - Kept `inject_rich_text` as the supported rich-text path.
   - Aligned `MacroRunResult` with actual executor behavior.
   - Removed obsolete duplicate executor branches.
   - Files:
     - `frontend/src/core/macro/types.ts`
     - `frontend/src/core/macro/executor.ts`

3. **Annotation/tool contract cleanup**
   - Added `strikeout` and `shape` to the shared type definitions so toolbar/workspace/inspector agree on the same contract.
   - Files:
     - `frontend/src/core/editor/types.ts`
     - `frontend/src/core/annotations/types.ts`

4. **Thumbnail/page organizer improvements**
   - Added **Shift-click range selection**.
   - Added **block move for multi-selected pages**.
   - Added **external PDF drag-drop into thumbnail rail** to insert donor pages before the hovered thumbnail.
   - Added inline drop affordance text for operator clarity.
   - File: `frontend/src/components/sidebar/SidebarPanel.tsx`

5. **Search panel from placeholder to real feature**
   - Replaced the search stub with a working page-text search panel backed by `PdfRendererAdapter.searchDocumentText(...)`.
   - File: `frontend/src/components/sidebar/SidebarPanel.tsx`

6. **PDF export bug fix**
   - Fixed `backgroundColor` reference bug in annotation export.
   - Added export support for `underline`, `strikeout`, and `shape`.
   - Added `movePagesAsBlock(...)` to the PDF edit adapter to support robust thumbnail block moves.
   - File: `frontend/src/adapters/pdf-edit/PdfEditAdapter.ts`

---

## Phase 1 — compile and contract recovery

### Goal
Get the app back to a state where `build`, `lint`, and `test` failures are about real logic, not contract drift.

### Files to work first
- `frontend/src/components/toolbar/ToolbarOrganize.tsx`
- `frontend/src/core/macro/types.ts`
- `frontend/src/core/macro/executor.ts`
- `frontend/src/core/editor/types.ts`
- `frontend/src/core/annotations/types.ts`
- `frontend/src/components/toolbar/ToolbarComment.tsx`
- `frontend/src/components/workspace/DocumentWorkspace.tsx`
- `frontend/src/adapters/annotation-canvas/KonvaAdapter.ts`
- `frontend/src/adapters/annotation-canvas/serializer.ts`

### Work steps
1. Freeze the source-of-truth unions:
   - `ActiveTool`
   - `AnnotationType`
   - `MacroStep['op']`
2. Remove any branch leftovers that introduce alternate names for the same action.
3. Ban “shadow APIs” where executor supports operations not declared in types.
4. Confirm every toolbar button maps to one legal `ActiveTool` and one legal annotation creation path.
5. Confirm every macro builtin is representable by `MacroStep` without `any` escapes.

### Must-pass checks
- Zero duplicate function declarations in toolbar files.
- Zero macro ops used in builtins/sidebar that are absent from `MacroStep`.
- Zero annotation/tool names used in UI but absent from shared types.

### Quantitative pass test
- `rg "handleBatchRun" frontend/src/components/toolbar/ToolbarOrganize.tsx | wc -l` must equal **1**.
- `rg "draw_text_on_pages|inject_rich_text|insert_rich_text" frontend/src/core/macro -n` must show **only declared/intentional operations**.
- `rg "'shape'|'strikeout'" frontend/src -n` must only reference legal shared types after phase completion.

---

## Phase 2 — thumbnail/page organizer hardening

### Goal
Make the page rail feel professional, fast, and safe for multipage work.

### Files
- `frontend/src/components/sidebar/SidebarPanel.tsx`
- `frontend/src/adapters/pdf-edit/PdfEditAdapter.ts`
- `frontend/src/core/session/store.ts`
- optionally add:
  - `frontend/src/core/session/pageSelection.ts`
  - `frontend/src/core/session/pageReorder.ts`

### Source-level tasks
1. Replace single-page drag assumptions with block semantics.
2. Persist drag payload as a normalized selection block.
3. Add explicit drop zones:
   - before page
   - after page
   - append to end
4. Add donor-drop parsing for external PDFs.
5. Add context-menu batch operations for selected pages:
   - rotate
   - duplicate
   - extract
   - replace
   - insert blank before/after
   - split out
6. Add thumbnail cache keyed by:
   - `documentKey`
   - `pageNumber`
   - `rotation`
   - thumbnail size bucket
7. Generate thumbnails in a concurrency-limited queue instead of serial await.
8. Add drag auto-scroll near panel edges.
9. Add keyboard page-organizer shortcuts.

### Recommended implementation detail
Create a pure reorder helper:
- input: `pageCount`, `selectedPages`, `targetPage`, `placement`
- output: new 1-based page order
Then make both UI drag-drop and future keyboard move commands use the same helper.

### Quantitative pass test
- 1,000 randomized reorder cases must match expected order exactly.
- Range select 3→11 must return **9 pages**.
- Drag 5 selected pages in a 200-page file must finish reorder logic in **< 25 ms** for the pure helper.
- First 20 visible thumbnails should appear in **< 400 ms** on the reference machine after cache warm.
- External donor drop with a 12-page donor must preserve page contiguity in **100%** of test runs.

### Critical test cases
1. Move block `[3,4,5]` before `12`.
2. Move block `[12,13]` before `2`.
3. Move block that contains current page.
4. Drop external donor on first page.
5. Drop external donor on last page append zone.
6. Undo after block move.
7. Undo after donor insertion.

---

## Phase 3 — annotations and inspector upgrade

### Goal
Move inspector from raw-property editing to a real review workflow.

### Files
- `frontend/src/components/inspector/InspectorPanel.tsx`
- `frontend/src/core/annotations/store.ts`
- `frontend/src/core/annotations/types.ts`
- `frontend/src/components/workspace/DocumentWorkspace.tsx`
- `frontend/src/adapters/pdf-edit/PdfEditAdapter.ts`

### Source-level tasks
1. Keep annotation type stable. Do not let inspector mutate to unsupported types.
2. Split inspector into sections:
   - Geometry
   - Style
   - Content
   - Review
   - Metadata
3. Add **mixed-state controls** for multiselect edits.
4. Add annotation presets:
   - Review note
   - Approved
   - Revise
   - Site verify
   - Clash
5. Add comment-thread fields on data model:
   - `author`
   - `replies[]`
   - `status`
   - `assignee?`
   - `dueDate?`
6. Add lock badges, unresolved badges, and page badges in comments sidebar.
7. Add z-order commands.
8. Add copy-style / paste-style.
9. Add flatten/export fidelity tests.

### High-value source fix
Move all visual reads through accessor helpers. Right now rendering still reads a mix of:
- `backgroundColor`
- `fillColor`
- `borderColor`
- `strokeColor`
- `borderWidth`
- `strokeWidth`

Create canonical readers like:
- `readFillColor(annotation)`
- `readStrokeColor(annotation)`
- `readStrokeWidth(annotation)`

Then use them in both workspace rendering and export flattening.

### Quantitative pass test
- Bulk style update on 50 annotations completes in **< 100 ms**.
- Drag/resizing locked annotations changes **0** geometry fields.
- Flattened export for callout anchor stays within **2 px median drift**.
- Undo/redo after 20 inspector edits restores exact pre-edit snapshot hash.
- Mixed-state multiselect controls show neutral state in **100%** of fixture cases.

---

## Phase 4 — search and replace

### Goal
Ship real search now, and only ship replace modes that are honest and technically correct.

### What is realistic in current frontend architecture
1. **Search** — yes.
2. **Replace form field values** — yes.
3. **Overlay replace visible page text** — yes, but as visual replacement only.
4. **True content-stream rewrite of arbitrary page text** — not realistically safe in this browser-only stack.

### Files
- `frontend/src/components/sidebar/SidebarPanel.tsx`
- `frontend/src/adapters/pdf-renderer/PdfRendererAdapter.ts`
- `frontend/src/adapters/pdf-edit/PdfEditAdapter.ts`
- add:
  - `frontend/src/core/search/indexer.ts`
  - `frontend/src/core/search/types.ts`
  - `frontend/src/core/search/overlayReplace.ts`

### Source-level tasks
1. Upgrade search hits from page text only to item/bbox hits.
2. Store per-page text items with normalized text and geometry.
3. Add options:
   - case sensitive
   - whole word
   - regex
4. Add next/prev navigation.
5. Add visible highlight overlay on page.
6. Implement replace in two modes only:
   - form fields
   - overlay replace
7. For overlay replace, persist a synthetic annotation or macro step so replacement is traceable and undoable.

### Quantitative pass test
- 200-page index build in **< 3 s**.
- Next/prev navigation in **< 50 ms** after index build.
- Search fixture corpus returns expected hit counts with **100% exact match** across plain/case/whole-word tests.
- Overlay replace bbox center error **< 2 px** on fixture pages.

---

## Phase 5 — macros to expert level

### Goal
Turn macros into a safe expert-automation system instead of a loose recipe list.

### Files
- `frontend/src/core/macro/types.ts`
- `frontend/src/core/macro/executor.ts`
- `frontend/src/core/macro/validation/validator.ts`
- `frontend/src/core/macro/batchRunner.ts`
- `frontend/src/components/sidebar/MacrosSidebar.tsx`
- add:
  - `frontend/src/core/macro/registry.ts`
  - `frontend/src/core/macro/tokens.ts`
  - `frontend/src/core/macro/history.ts`

### Source-level tasks
1. Replace switch-heavy executor with handler registry.
2. Add schema version to recipes.
3. Add dry-run diff preview.
4. Add token system:
   - `${fileName}`
   - `${page}`
   - `${pages}`
   - `${date}`
   - `${selection}`
5. Add step-level validation and capability flags.
6. Add per-step timing and deterministic logs.
7. Add batch save naming templates.
8. Add donor file manifest binding UI.
9. Add trusted/untrusted recipe mode.
10. Add rollback boundary after each state-mutating step.

### Quantitative pass test
- 100 fixture recipes validate with **0 unknown opcodes**.
- Same input + same recipe yields identical output hash in **5/5** runs.
- 50-file batch run must produce a machine-readable report every time.
- Dry-run plan generation for 20-step recipe in **< 150 ms**.

---

## Immediate critical code patches to keep

### 1. Multi-page move helper
Use adapter-level block move as the single reorder primitive.

### 2. External donor PDF drop
Keep this in the thumbnail rail. It is high ROI and low UI cost.

### 3. Search panel
Keep the current basic search panel, then upgrade hit geometry in Phase 4.

### 4. Macro contract cleanup
Do not reintroduce both `inject_rich_text` and `insert_rich_text` unless one is explicitly a migration alias.

---

## Recommended next coding sequence

1. Apply the included patch bundle.
2. Run compile/lint/test and record the remaining exact errors.
3. Finish Phase 1 contract cleanup until all remaining failures are real logic issues.
4. Do Phase 2 thumbnail hardening immediately after, because it has the highest product ROI.
5. Then do Phase 3 inspector/annotation work.
6. Then Phase 4 search/replace.
7. Then Phase 5 macros.
