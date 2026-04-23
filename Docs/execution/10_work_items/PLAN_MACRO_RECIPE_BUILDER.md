# Comprehensive Plan: Macro Productization & Custom Recipe Builder

## Objective
Evolve the macro engine from simple prompt-driven batches to a robust, programmatic Recipe Builder capable of complex, page-aware document generation, and eventually support external API/syntax injection.

## Phase 1: Foundation - Macro Actions & Context
- **Action:** Expand the core macro engine actions within `frontend/src/core/macro/`.
- **Details:**
  - Implement actions: `add_page` (blank or donor), `insert_image` (with X/Y constraints), `insert_rich_text`.
  - Introduce Macro Context Variables: Support evaluating tokens like `$PAGE_NUMBER`, `$TOTAL_PAGES`, and `$DATE` during execution.
  - Implement actions: `set_header` and `set_footer` that leverage the context variables and loop over pages.

## Phase 2: Reproducibility & Error Handling
- **Action:** Implement the hardening requirements from `WI_A6_macro_productization_dialogs.md`.
- **Details:**
  - Add Dry Run capabilities to validate constraints without mutating the document store.
  - Add "Continue on Error" configurations for batch execution.
  - Generate reproducible metadata logs and downloadable reports.

## Phase 3: Visual Custom Recipe Builder
- **Action:** Replace simplistic dialogs with a dynamic UI in the Macro Center/Sidebar.
- **Details:**
  - Build a drag-and-drop or sequential list builder where users can select actions (e.g., "Insert Text", "Add Page").
  - For each step, provide a property form (e.g., inputting text content, setting X/Y coordinates, selecting a donor file).
  - Implement Preset lifecycle (save, load, duplicate, rename).

## Phase 4: Programmatic Execution via External Syntax
- **Action:** Allow external applications to drive document creation via code.
- **Details:**
  - Define a strict JSON/YAML schema representing a "Recipe" (a sequence of macro actions and parameters).
  - Expose an interface (e.g., `window.executePDFHubRecipe(jsonPayload)`, URL hash state, or API endpoint if applicable).
  - Ensure external execution runs through the same validation (Dry Run) and error reporting engine to maintain safety and predictability.
