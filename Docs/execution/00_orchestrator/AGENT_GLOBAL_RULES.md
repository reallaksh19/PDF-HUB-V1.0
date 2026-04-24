# Global rules for all agents

Every agent must follow these rules.

* Work only inside the owned scope.
* Do not create alternate execution paths for page/document actions. All page/document actions must go through the shared command layer.
* Do not call direct document mutation from UI components once the command layer lands.
* Do not introduce new `window.prompt`, `window.confirm`, or placeholder/stub UI in shipped flows.
* Do not leave dead state in store-only controls. Every visible control must affect runtime behavior.
* Do not bypass document-mutation history for page-level changes.
* Do not silently swallow errors. Every failure must surface through typed results and user feedback.
* Every agent must update `Docs/execution/30_evidence/Ax/RESULT.md`.
* Every agent must add or update tests for their owned scope.
* Every agent must list touched files, decisions, risks, and validation evidence.

Common automated gate for each agent:

* `corepack pnpm --filter frontend exec tsc --noEmit`
* `corepack pnpm --filter frontend lint`
* `corepack pnpm --filter frontend test -- <owned-scope>`

Common proof required from each agent:

* before/after screenshots or GIF notes
* touched file list
* known limitations
* rollback note
* manual smoke checklist

Common hard fail conditions:

* new dead-state UI
* duplicate command path
* skipped tests
* silent failure path
* prompt-based input flow
* inaccessible keyboard trap
* broken undo/redo for owned document actions
