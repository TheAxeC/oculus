# Q81 landing

Roadmap entry oculus/migration (the migration of oculus). Plan step Q81: menus, context menus, tooltips and dialogs on bits-ui, and the palette on bits-ui's Command with fuzzysort. Next: Q79b, which runs alone.

## Open items (only what Axel must rule on; every report opens with this list verbatim and repeats it until he has ruled)

- None.

## NOT DONE

The looks of Q81 and Q82 were not taken. At landing the browser tab showed Axel's Focus page, and a look is taken only on TEST. Both are booked in the state file's Booked section and are taken together at the next landing whose tab shows TEST. The browser-only behaviour of this step (the quiet focus, the key sheet's focus on its box, the tray's Close, the menus' keys, the tooltip's flip) has no other check until then.

## The check before landing

The runner's agent listing showed no agent of this session running: only the idle peer session ordo-2b.

## What landed

- **Menus.** `ui/menu/Menu.svelte`, `ContextMenu.svelte` and `MenuList.svelte` run on bits-ui 2.19.3's Dropdown Menu and Context Menu. A choice with its own list opens it to the side with a chevron; the in-place list with its Back choice and `ui.menu_back` are gone. Home, End, type-ahead, ArrowRight and ArrowLeft are bits-ui's. The lists stand on the body at z-index 70, and `ui/frame/on-body.ts` is removed.
- **Tooltips.** `ui/menu/Tooltip.svelte` runs on bits-ui's Tooltip, with the description always on.
- **Dialogs.** The confirm, the prompt, the key sheet, the palette, the update tray and the Memories overlay stand on one modal ground, the new `ui/frame/Modal.svelte` on bits-ui's Dialog and Alert Dialog. Its Escape and press outside replace the shell's three Escape branches.
- **Quiet focus.** `ui/frame/quiet-focus.ts` holds `focusQuietly` and `focusFirstQuietly`. A dialog that names no control of its own puts its first focus, quietly, on the first control Tab reaches inside it, or on the box itself when it holds none. The focus given back when a dialog goes is quiet too.
- **Fuzzy matching.** `state/shared/words/fuzzy.ts` wraps fuzzysort 4.0.2 for the palette's `ranked`, the language list's `languageMatches` and the files filter's `matchingFiles`. A title match ranks first, and a match is drawn in the Search view's match look.
- **Size.** 62 files, 2249 lines added and 1593 removed.
- **Dependencies.** bits-ui and fuzzysort, pinned. The lock adds 15 packages under MIT, Apache-2.0 and 0BSD, and changes the dev flags of 58 entries through runed's optional peer @sveltejs/kit.

## Visible changes, before and after

- **Submenus.** Before: the list replaced the menu in place, with a Back choice. After: it opens to the side with a chevron. ArrowRight or Enter opens it; ArrowLeft or Escape closes it and puts the focus back on its choice.
- **Tab in an open menu.** Before: the list stayed open. After: the menu closes.
- **Opening a menu with a pointer.** Before: the first choice took the focus. After: the list takes the focus.
- **A pick.** Before: it was answered in the click. After: it is answered once the menu has closed and the focus is back on the opener.
- **Tooltips near the bottom edge.** Before: clamped left and right only. After: flipped to the other side.
- **Palette.**
  - Home and End: before, they moved the caret. After, they move the selection.
  - Matching: before, by substring. After, fuzzy, with a title match first.
  - The match mark: before, weight 600. After, the accent's text colour at weight 700.
- **Escape on the key sheet, the palette and the tray.** Before: the shell handled it. After: bits-ui does. A Confirm over the tray takes the first Escape.
- **The tray's first focus.** Before: none. After: its Close button, with no tooltip. It now runs as bits-ui's focus scope mounts, where bits-ui's own first focus ran in an animation frame.
- **The key sheet's first focus.** After: its box, with no tooltip. Not seen in a browser.
- **The focus after a dialog closes.** Before: the palette, the tray and the sheet gave none back. After: the control that held it gets it back, with no tooltip.
- **A Confirm and the Memories overlay.** Before: the overlay did not hold the keyboard. After: both hold the keyboard for the whole workbench while they show.

## What was found

- **The builder's first report did not pass its bar.** The first review's findings were closed in repair round 1 or ruled in its brief.
- **The run over round 1 found eight things. All were fixed at landing:**
  - `ui/frame/Modal.svelte` imported `ui/menu`, which is above `ui/frame` in the ui order, so `tests/checks/imports/order.test.ts` failed. The focus helpers moved to `ui/frame/quiet-focus.ts`, and `tooltip-target.ts` keeps only the description helpers. The ui root already holds the ten items a folder may hold. The order check failed on main with that line before the move and passes after it.
  - The key sheet took no focus, since it holds no control. `focusFirstQuietly` now focuses the box itself, as bits-ui's own fallback does.
  - `focusFirstQuietly` could pick a control Tab does not reach. It now skips controls outside the tab order, disabled controls, hidden inputs, and anything under `[hidden]` or `[inert]`.
  - Sentences on the first focus claimed more than the code did. They were reworded in `Modal.svelte`, `Tooltip.svelte` and `DESIGN.md:306`.
  - `describe('match')` in `palette.test.ts` became `describe('ranked')`.
  - Five audit comments described the step itself, as the round brief had asked; the rules file forbids that wording. They were reworded in present tense, each naming what turns it red.
  - Palette case 2 was not marked as an audit. It now is.
  - The builder's report did not state two behaviour changes: the key sheet's focus and the tray's synchronous first focus. They are stated above.
- **Found by the verify list on main:** `allow-duplication.txt` still held the clone between `Menu.svelte` and `MenuOpener.svelte`, which this step removes. The entry is out.
- **The cherry-pick conflicted with Q82 and Q87** in `package.json`, `package-lock.json` and `docs/diagrams/layers.*`. Both sides' dependencies were kept, npm regenerated the lock from main's copy, and `npm run diagrams` regenerated the diagrams. `npm install` on main then left the lock unchanged.
- **The focus fallback and the filter run only in a browser.** The tests run under `environment: 'node'`, so the owed look is their check.

## Verification on main

`checks: 6 commands passed`:
- `Test Files 356 passed (356)`;
- `Tests 5704 passed | 1 skipped (5705)`;
- svelte-check `0 ERRORS 0 WARNINGS`;
- the build, format, lint and ASCII checks all passing.

## Usage

- **Builder:**
  - the cases hand-back: 63 tool uses, 291k tokens, 11 min;
  - the build: 203 tool uses, 117k tokens, 57 min;
  - round 1: 44 tool uses, 229k tokens, 11 min.
- **Reviewers:**
  - the first review: 325k tokens, 124 tool uses, 24 min;
  - the round 1 review: 199k tokens, 50 tool uses, 12 min.
- **Fixes at landing:** nine. Seven are code fixes of the round review's findings: the import move, the box fallback, the filter, the sentences, the describe title, the audit comments and palette case 2. The other two are the stale allow-list entry and the conflict resolution. The review's eighth finding, the two unstated behaviour changes, is answered in this report.

## Next

Q79b, alone. The looks of Q81 and Q82 are taken on TEST at the first landing where the tab shows it.
