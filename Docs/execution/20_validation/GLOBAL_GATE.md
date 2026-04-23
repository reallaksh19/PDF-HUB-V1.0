# Global pass gate for the entire program

This release is blocked unless all are true:

* typecheck passes
* lint passes
* full tests pass
* clean install passes
* no `window.prompt(`
* no `SearchPanelStub`
* `viewMode` and `fitMode` visibly affect rendering
* text selection → highlight/underline/note/callout works
* thumbnail right-click menu works
* document mutation undo/redo works
* save/export/session semantics are explicit and correct
* macro dry-run works
* macro batch continue-on-error works
* review sidebar filters and jump-to-annotation work
* Chrome smoke green
* Edge smoke green
