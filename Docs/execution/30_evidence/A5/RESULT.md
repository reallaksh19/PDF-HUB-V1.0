# A5 Execution Evidence

- Added `strikeout` and unified `comment` to `sticky-note` in `core/annotations/types.ts` and `core/editor/types.ts`.
- Updated `DocumentWorkspace.tsx` to handle `underline`, `strikeout`, and `sticky-note` creation from selection and placement.
- Improved pointer event interactions so that text mark tools and note tools correctly intercept pointer interactions without breaking text selection or canvas actions.
- Disabled moving objects while in text-mark tools by switching pointerEvents on the annotation layer wrapper.
- `Escape` key effectively resets the current tool to `select` and removes the selection bubble.
- Addressed click-to-place vs selection bug for note tools when overlay prevents clicks.
- Cleanly passed typechecks, tests, and lint rules in the frontend workspace.
