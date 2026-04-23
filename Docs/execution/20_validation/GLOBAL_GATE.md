# Global release gate

The release is blocked unless all are true:

* typecheck passes
* lint passes
* full test suite passes
* clean install passes
* no `window.prompt(`
* no `SearchPanelStub`
* `viewMode` and `fitMode` affect workspace rendering
* document mutation undo/redo works
* thumbnail right-click menu works
* text selection to highlight/underline/note/callout works
* macro dry-run works
* batch continue-on-error works
* save/export/session semantics are clear in UI and code
* Chrome smoke green
* Edge smoke green
