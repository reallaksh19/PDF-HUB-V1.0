## Master-Orchestrated Multi-Agent Delivery Plan (8 Agents) for Product-Grade PDF Hub

### Summary
This plan integrates your original audit plus all 13 additional gaps and converts them into one orchestrator-led, parallelizable execution model.
The system will be delivered through one typed command/action layer, product-safe document mutation history, explicit save/export semantics, full thumbnail/search/view/tool interaction contracts, macro productization, review workflow expansion, accessibility/performance hardening, and strict validation gates.

### Folder Structure + Placeholders (create first)
Use `Docs/execution` as the control plane for foolproof execution.

```text
Docs/execution/
  README.md
  00_orchestrator/
    MASTER_SCOPE.md
    DEPENDENCY_GRAPH.md
    MERGE_ORDER.md
    RISK_REGISTER.md
    DECISIONS_LOG.md
    DAILY_STATUS.md
  10_work_items/
    WI_A0_orchestrator.md
    WI_A1_command_bus_history.md
    WI_A2_thumbnail_organize_surface.md
    WI_A3_search_geometry_nav.md
    WI_A4_view_modes_rendering.md
    WI_A5_tool_interaction_matrix.md
    WI_A6_macro_productization.md
    WI_A7_review_workflow.md
    WI_A8_feedback_a11y_perf_tests.md
  20_validation/
    AGENT_GATE_TEMPLATE.md
    GLOBAL_GATE.md
    MANUAL_SMOKE_CHROME_EDGE.md
    REGRESSION_CHECKLIST.md
  30_evidence/
    A0/RESULT.md
    A1/RESULT.md
    A2/RESULT.md
    A3/RESULT.md
    A4/RESULT.md
    A5/RESULT.md
    A6/RESULT.md
    A7/RESULT.md
    A8/RESULT.md
  40_handoff/
    RELEASE_NOTES_DRAFT.md
    KNOWN_LIMITS.md
    FOLLOWUPS.md
```

Each `WI_Ax_*.md` placeholder must contain:
- Goal
- Owned write scope
- Forbidden write scope
- Required deliverables
- Pass tests
- Manual validations
- Rollback criteria
- Evidence checklist

### Public Interfaces / Types to Add
- `core/commands/types.ts`: `DocumentCommand`, `CommandSource`, `CommandResult`, `CommandContext`.
- `core/commands/dispatch.ts`: single execution entrypoint for toolbar, thumbnail menu, macro runner, shortcuts.
- `core/document-history/types.ts` and `store.ts`: document mutation undo/redo transactions.
- `core/session/types.ts`: explicit save/export action types and last operation metadata.
- `core/search/types.ts`: text hit geometry and active result model.
- `core/review/types.ts`: thread metadata and review summary export model.
- No backend/API changes in this phase.

### Dependency Waves and Merge Order
1. Wave 0: A0 creates execution scaffolding and merge policy docs.
2. Wave 1: A1 lands command bus + document mutation history foundation.
3. Wave 2: A2, A3, A4, A5, A6, A7 run in parallel on disjoint scopes using A1 contracts.
4. Wave 3: A8 performs cross-cutting hardening, accessibility, and test expansion.
5. Wave 4: A0 integrates, runs global gate, resolves conflicts, and signs off.

Merge order:
1. A1
2. A4
3. A5
4. A2
5. A3
6. A6
7. A7
8. A8
9. A0 final integration

### Work Instructions (WI Prompts)

#### WI A0 — Master Orchestrator
Goal: Own delivery control, dependency management, evidence quality, and final release gate.
Owned write scope: `Docs/execution/**`, integration touchpoints approved in merge queue.
Forbidden scope: deep feature implementation owned by A1-A8 unless conflict resolution is required.
Required deliverables:
- Create all placeholder files listed above.
- Publish dependency graph and conflict map.
- Enforce branch naming, merge order, and per-agent gate compliance.
- Produce final integration report and go/no-go decision.
Pass tests:
- All per-agent gates green.
- Global gate green.
Manual validations:
- Chrome + Edge smoke checklist fully signed.
- No unresolved P0/P1 findings.
Rollback criteria:
- Any gate fail or regression reopen blocks merge.
Evidence:
- `Docs/execution/30_evidence/A0/RESULT.md` with links to all agent evidence.

#### WI A1 — Single Command Layer + Document Mutation History
Goal: Eliminate multi-path execution drift and make document mutations undo/redo safe.
Owned write scope: `frontend/src/core/commands/**`, `frontend/src/core/document-history/**`, command integration adapters in toolbar/sidebar/macro entrypoints.
Forbidden scope: rendering behavior, search UI, review threading logic.
Required deliverables:
- Implement typed command dispatcher used by toolbar, thumbnail context menu, macro runner, and shortcuts.
- Route page ops through one execution path.
- Add document mutation transaction history for rotate/split/replace/header-footer/macro mutations.
- Replace direct `replaceWorkingCopy` calls from UI with command commits.
Pass tests:
- `corepack pnpm --filter frontend exec tsc --noEmit`
- `corepack pnpm --filter frontend lint`
- `corepack pnpm --filter frontend test -- core/commands core/document-history`
Manual validations:
- Same command gives identical result from toolbar and macro trigger.
- Undo/redo works for document-level operations, not just annotations.
Evidence:
- `Docs/execution/30_evidence/A1/RESULT.md` with command map and undo/redo matrix.

#### WI A2 — Thumbnail Rail as Organize Surface
Goal: Make thumbnails a complete organize UX, not just a preview list.
Owned write scope: thumbnail sidebar components and context menu components.
Forbidden scope: macro engine internals and renderer core.
Required deliverables:
- Right-click context menu with page operations.
- Shift range select and multi-select group behaviors.
- Visible selected/current badges plus unresolved-comment count badge.
- Drag insertion indicator and group drag behavior.
- Selected-page action strip for common operations.
Pass tests:
- `corepack pnpm --filter frontend exec tsc --noEmit`
- `corepack pnpm --filter frontend lint`
- `corepack pnpm --filter frontend test -- sidebar thumbnail`
Manual validations:
- Keyboard accessible context menu and selection operations.
- Drag-and-drop insert feedback visible and accurate.
Evidence:
- `Docs/execution/30_evidence/A2/RESULT.md` with screenshot checklist.

#### WI A3 — Search with Hit Geometry + Navigation
Goal: Replace stubbed search with integrated, navigable hit experience.
Owned write scope: search panel, search state, renderer text-geometry extraction helpers.
Forbidden scope: view mode architecture and command history internals.
Required deliverables:
- Real search panel replacing stub.
- Grouped results by page with hit counts.
- Active hit persistence, next/previous controls, scroll-to-hit.
- Canvas highlight for current hit.
- Thumbnail hit count badges.
Pass tests:
- `corepack pnpm --filter frontend exec tsc --noEmit`
- `corepack pnpm --filter frontend lint`
- `corepack pnpm --filter frontend test -- search`
Manual validations:
- Results remain stable across page navigation and tab switches.
- Large document search remains responsive.
Evidence:
- `Docs/execution/30_evidence/A3/RESULT.md` with query scenarios.

#### WI A4 — View Modes as Real Rendering Models
Goal: Turn `viewMode` and `fitMode` from dead state into actual rendering behavior.
Owned write scope: workspace viewport/rendering layout and related view controls.
Forbidden scope: annotation interaction contract and macro UI.
Required deliverables:
- Continuous mode with virtualization policy.
- Single-page mode honoring current page and navigation.
- Two-page spread pairing with correct left/right rules.
- Fit-width/fit-page recomputation on resize.
- Scroll restoration and page-centering policy across mode changes.
- Hand/pan behavior integrated.
Pass tests:
- `corepack pnpm --filter frontend exec tsc --noEmit`
- `corepack pnpm --filter frontend lint`
- `corepack pnpm --filter frontend test -- view workspace`
Manual validations:
- Mode switch preserves user context and avoids jumpy scroll.
- 200+ page document remains usable.
Evidence:
- `Docs/execution/30_evidence/A4/RESULT.md` with mode matrix.

#### WI A5 — Tool Interaction Contract (Pointer/Event Matrix)
Goal: End recurring pointer-event regressions with explicit tool-state rules.
Owned write scope: annotation/text selection interaction controller in workspace.
Forbidden scope: thumbnail/search/macro sidebar UI.
Required deliverables:
- Implement formal interaction matrix:
  - select: text + object selection
  - text-mark tools: text selection only
  - shape/line tools: draw/canvas only
  - sticky/callout: click-to-place and selection-to-create rules
  - marquee only in select mode
- Enforce consistent pointer-events behavior.
- Preserve locked-annotation protections.
Pass tests:
- `corepack pnpm --filter frontend exec tsc --noEmit`
- `corepack pnpm --filter frontend lint`
- `corepack pnpm --filter frontend test -- workspace interaction`
Manual validations:
- Text-selection tools usable without fallback to select mode.
- No accidental object drags while text-marking.
Evidence:
- `Docs/execution/30_evidence/A5/RESULT.md` with interaction matrix pass table.

#### WI A6 — Macro UI Productization
Goal: Move macros from technically capable to operator-friendly.
Owned write scope: macro sidebar UI/state plus macro validation layer and batch runner UX.
Forbidden scope: thumbnail and search rendering.
Required deliverables:
- Preset lifecycle: save/update/delete presets.
- Dry-run mode with validation-only execution.
- Per-step validation errors and blocking states.
- Recipe variable inputs.
- Donor-file binding UX for donor-dependent steps.
- Continue-on-error batch mode.
- Per-file summary report and reproducibility metadata (recipe snapshot, params, timestamp, file hash).
Pass tests:
- `corepack pnpm --filter frontend exec tsc --noEmit`
- `corepack pnpm --filter frontend lint`
- `corepack pnpm --filter frontend test -- macro`
Manual validations:
- Batch run handles partial failures predictably.
- Output queue remains explicit and never auto-saves unexpectedly.
Evidence:
- `Docs/execution/30_evidence/A6/RESULT.md` with run report examples.

#### WI A7 — Review Workflow Depth
Goal: Upgrade from annotation editor to review product behavior.
Owned write scope: comments panel/index, annotation metadata extensions, review export summary.
Forbidden scope: PDF page mutation command handlers.
Required deliverables:
- Comments index with filters: open/resolved/rejected.
- Jump-to-annotation rows and hide-resolved toggle on canvas.
- Author/date metadata support in annotation records.
- Thread/reply support in static-mode storage model.
- Bulk resolve/reopen actions.
- Export review summary.
Pass tests:
- `corepack pnpm --filter frontend exec tsc --noEmit`
- `corepack pnpm --filter frontend lint`
- `corepack pnpm --filter frontend test -- review comments`
Manual validations:
- Thread visibility and filters consistent between sidebar and canvas.
Evidence:
- `Docs/execution/30_evidence/A7/RESULT.md` with review workflow scenarios.

#### WI A8 — Feedback, Accessibility, Performance, Test Expansion
Goal: Harden UX reliability and accessibility while closing risk gaps.
Owned write scope: shared UI feedback components, modal/menu accessibility, performance optimizations, integration tests.
Forbidden scope: introducing alternate command paths.
Required deliverables:
- Toast/inline validation feedback for operation success/failure.
- Non-blocking progress UX for long operations.
- Recoverable error state patterns with no silent skips.
- Accessibility: keyboard nav for thumbnails/context menu, focus trap in dialogs, ARIA labels/roles, visible focus states.
- Performance: bounded thumbnail rendering, lazy-load heavy sidebars, macro panel split, throttled persistence.
- Expand test suite for all high-risk flows listed in your audit.
Pass tests:
- `corepack pnpm --filter frontend exec tsc --noEmit`
- `corepack pnpm --filter frontend lint`
- `corepack pnpm --filter frontend test`
Manual validations:
- Chrome + Edge accessibility keyboard pass.
- 200+ page doc interaction remains stable.
Evidence:
- `Docs/execution/30_evidence/A8/RESULT.md` with a11y/perf checklist.

### Strict Validation Gates

Per-agent gate (mandatory):
1. Typecheck pass.
2. Lint pass.
3. Scoped tests for owned subsystem pass.
4. Manual scenario checklist complete.
5. Evidence file updated.

Global gate (mandatory before merge):
1. `corepack pnpm --filter frontend exec tsc --noEmit`
2. `corepack pnpm --filter frontend lint`
3. `corepack pnpm --filter frontend test`
4. No `window.prompt` in source.
5. No `SearchPanelStub` in shipped UI.
6. `viewMode` and `fitMode` are consumed by workspace rendering, not only toolbar state.
7. Document mutation undo/redo matrix fully green.
8. Chrome + Edge smoke checklist green.

### Assumptions and Defaults
- Static-mode safe only, frontend + `pdf-lib`; no backend dependency added.
- Built-ins remain executable source for macro v1 while custom builder remains controlled by preset/variable UX.
- `Docs/execution` is authoritative artifact root for orchestration and evidence.
- [GUESSED] Memory budget and history depth tuning for document mutation history will be finalized during A1 benchmarking on large PDFs.
- [GUESSED] Thread/reply model in A7 will be local-storage/IndexedDB-backed unless later backend scope is explicitly approved.
