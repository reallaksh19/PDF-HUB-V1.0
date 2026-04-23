# Comprehensive Plan: Annotation Enhancements & Inspector Panel

## Objective
Elevate the annotation experience by ensuring visual fidelity, distinct representations for different annotation types, and a context-aware rich Inspector panel.

## Phase 1: Visual Fidelity & Rendering Overhaul
- **Current State:** Annotations currently overlay generically, often resembling plain text boxes, and lack distinct visual styles for highlights, stamps, shapes, and callouts.
- **Action:** Refactor the rendering logic in the core canvas components (e.g., `PageSurface` or the annotation overlay layer).
- **Details:**
  - Ensure correct Z-index ordering and coordinate mapping so annotations are firmly anchored to the document content.
  - Implement specific SVG or DOM node renderers for each type:
    - `highlight`: Semi-transparent background over text bounds.
    - `stamp`: Scaled image or styled border with bold text overlay.
    - `callout`: Connecting leader lines anchored to specific document points.
    - `sticky-note`/`comment`: Distinct icon/bubble overlay.

## Phase 2: Context-Aware Inspector Panel
- **Current State:** The Inspector panel provides generic, uniform properties for all tools.
- **Action:** Refactor the Inspector panel to conditionally render settings based on the active or selected annotation type.
- **Details:**
  - Create a polymorphic Inspector component.
  - Text-based tools: Expose font size, font family, text alignment, and text color.
  - Shape tools: Expose border width, stroke style (dashed/solid), fill color, and border color.
  - Highlight/Opacity tools: Expose transparency sliders and blend modes.

## Phase 3: Tool Interaction Matrix Integration
- **Action:** Implement the strict interaction contract outlined in `WI_A5_tool_interaction_matrix.md`.
- **Details:**
  - Enforce tool states: `select` allows marquee and object selection, while `highlight`/`underline` only perform text selection.
  - Implement the "Text Selection Bubble" to allow quick action (highlight, underline, note) upon text selection.
  - Remove accidental click-to-create fake text marks.
