# Phase 2 → 3 Handoff Notes

## Accomplished in Phase 2
- **Backend File Endpoints (`P2-T8`)**: Setup FastAPI file upload mechanisms (`POST /api/files/upload`) enforcing a 100MB limit. Wired `PyMuPDF` through isolated `pdf_engine` for initial PDF reading, and created UUID-based file storage and TTL cleanup scripts (`cleanup_expired`). Tests created and passing.
- **Sidebar & Inspector Panel Behavior (`P2-T7` & `P2-T9`)**: Implemented visual thumbnails generated from `pdfjs-dist` rendered inside the Sidebar Panel. Bound PDF metadata (name, size, page count) onto the Inspector Panel utilizing the frontend Zustand `useSessionStore()`.
- **E2E Spec**: Drafted Playwright test `tests/p2-viewer.spec.ts` structure according to phase handoff guidelines.

## Known Limits & Deferred Tasks
- The E2E tests have not been comprehensively ran or fixed in this environment due to significant git tracking limits/environment diffing errors related to unignored `node_modules` / `venv` build output intercepting standard output.
- The state of Phase 2 is held inside the local `temp-jules` / `c7d0d46` commit history, which should be merged over the clean `NewBranch` target.

## Next Up: Phase 3 - Annotations and Persistence
1. Implement `adapters/annotation-canvas/KonvaAdapter.ts` linking `Konva` objects to `PdfAnnotation` objects.
2. Build the `AnnotationOverlay.tsx` layer inside the Document Workspace, taking care to mount the `Konva.Stage` side-by-side with the `react-pdf` canvas, _not_ inside or strictly over.
3. Build drawing toolkit components (TextBox, Highlight, Shape, Freehand).
4. Implement Annotation Zustand store (`P3-T4`) persisting to IndexedDB (Preview Mode) or SQLite (Server mode via new endpoint `/api/annotations`).
