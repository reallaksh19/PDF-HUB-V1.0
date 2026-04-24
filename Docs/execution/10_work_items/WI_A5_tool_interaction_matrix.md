# AGENT A5 PROMPT — Tool Interaction Contract + Text Selection Rules

## Mission

You are **A5**. End pointer-event and tool-state ambiguity by implementing a strict interaction contract for text selection, object selection, marquee, text-mark tools, and placement tools.

## Owned scope

* `frontend/src/components/workspace/DocumentWorkspace.tsx`
* interaction controllers
* selection overlays
* text-selection bubble
* annotation tool activation rules

## Forbidden scope

* search result list UI
* macro builder UI
* thumbnail page rail
* review thread sidebar

## Must implement

1. Formal tool-state matrix:

   * `select`: text selection + object selection + marquee
   * `highlight/underline/strikeout`: text selection only
   * `sticky-note/callout`: click-to-place and selection-to-create
   * `textbox/shape/line/arrow/stamp`: canvas placement only
2. Text selection bubble actions:

   * highlight
   * underline
   * strikeout
   * note
   * callout
3. Remove plain-click creation of fake text marks
4. Ensure pointer-events do not conflict between text layer and overlay layer
5. Preserve locked annotation protections
6. Normalize `comment` vs `sticky-note` behavior so the product exposes one note concept

## Required UX rules

* no accidental object move while text-marking
* no marquee in text-mark tools
* no empty click creating fake underline/highlight
* selection bubble anchored cleanly and dismissible
* Esc cancels tool cleanly

## Strict pass tests

Automated:

* `corepack pnpm --filter frontend exec tsc --noEmit`
* `corepack pnpm --filter frontend lint`
* `corepack pnpm --filter frontend test -- workspace interaction annotations`

Required test cases:

* highlight tool selects text directly
* underline tool selects text directly
* strikeout tool selects text directly
* note/callout from selected text
* fake text-mark creation blocked
* marquee only in select mode

Manual validations:

* text-mark tools usable without falling back to select
* locked items cannot be moved or edited
* no stuck selection bubble

Evidence:

* `Docs/execution/30_evidence/A5/RESULT.md`
