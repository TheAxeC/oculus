# O51 landing

Position: plan migration (cockpit to oculus), step O51 (a per-pane Hide Tab Row), landed 2026-10-22. Next: O54's report, /refute O54 and /land O54; then /spec O61, O53 and O56.

## Open items

- Open item 250 (redone): the status bar scrolls when its items do not fit, and the editor's keys work as VS Code's do, every key Monaco binds. Not reproduced in Chrome on TEST (Cmd+F and Cmd+/ worked); options (a) one step O65 for both parts, (b) the editor keys as O66 and the status bar as O65, recommended (b). Needs Axel's permission for a new step.
- Open item 251: which field names a project's people; Axel likes (a), not locked; a variant (a2) adds "Add person" to the person picker.
- Open item 254 (reworded): the 62 `authors:` lines of the hub's manifests removed at O53's landing, each paper's author list kept in the manuscript or on the website; recommended (a).

## Not done

Nothing of O51.

## The check of Steps 1

The runner's agent listing showed one agent running, O54's builder (a37648dff2f33b214); none of O51's builder (aba446840547d8ea4), brief check (a760fccefd58a7066) or reviewers (a914ccedd6c86f1fa, a0e5d4a6e03b9c695) was running.

## What landed

From base 87e9c76c, the range replayed in the gate worktree `.agents/worktrees/gate` and then on main with the gate's fixed files copied over, the two staged diffs equal under `cmp` (22 paths). Hide Tab Row in the pane menu (and in the strip's right-click menu under `editor_actions: hidden`) hides a pane's tab row and path bar so the view fills the pane; the pane node saves `rowHidden`, set by the store operation `hideTabRow(path, hidden, page?)` with its `PATH_OPERATIONS` row in `saved/rerun.ts` (ruling 245 (a)). A hidden row shows over the view while the pointer is on the pane's 4 px top band or over the row, while a menu opened from the row or its path bar is open, while the focus is in the row and a key brought it there, and while a tab of the pane is dragged; a frame over a slot in that pane is clipped at its top by the band or the shown row. `Menu.svelte` and `ContextMenu.svelte` take a bindable `open` (ruling 246 (a)), and `Menu.svelte` reports an open list to the watch of the region it is drawn in (`src/lib/ui/menu/menu-watch.ts`), which the strip provides. Tests: G102's two-tabs rows for the new operation in both orders, and a G29 row for a pane whose tab row is hidden.

## Fixes at landing

- Round 1 S1 and S2: the strip's read of `aria-expanded` from the page and its `MutationObserver` replaced by the menu watch, so an open menu reaches the strip as state (brief item 5, `agents/spec.md:87`).
- The menu watch's call in `Menu.svelte`'s effect put under `untrack`: the look found that opening the pane menu threw Svelte's `effect_update_depth_exceeded`, since the effect read and wrote the watch's count.
- Round 1 S3: `docs/apps.md:84` trimmed to one sentence.
- Round 1 P1: `npm run diagrams` run, rewriting `docs/diagrams/layer-shell` and `layers`.
- The new G29 row booked in `agents/guarded.md`.

## What was found

The review (`agents/reviews/O51-refuter.md`) found S1, S2, P2, P3, T1, T2 and B1 to B5 on the first report; they went to the one repair round, and the run over the round left S1 to S3 and P1, closed at landing under the Closed heading.

## Verification in the gate

```
$ npm run diagrams && npm run test:quick
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (3.1 s)
ok      eslint (21.5 s)
ok      svelte-check (21.5 s): 1792694163285 COMPLETED 536 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (51.0 s): Duration  26.29s (transform 14.32s, setup 0ms, import 18.01s, tests 7.83s, environment 0ms)
ok      vitest (69.6 s): Duration  44.82s (transform 88.61s, setup 0ms, import 151.41s, tests 1.87s, environment 976ms)
ok      vitest checks (74.5 s): Duration  49.63s (transform 38.53s, setup 0ms, import 48.54s, tests 65.78s, environment 2ms)
test:quick: 77.9 s; every command passed
```

The verify list was not changed. A/B: none, `bench: []`.

## The look, on TEST

- Hide Tab Row from the pane menu: the row and path bar go, the view fills the pane.
- Pointer on the top band: the row and path bar show over the view.
- The pane menu opened from the shown row, pointer moved away: the row stays shown; the menu offers Show Tab Row.
- After Escape the row stays while the focus is on the menu button (put there by a key) and hides once the focus moves into the view.
- raw-pls's `manuscript/main.pdf`: the shown row and path bar draw above the PDF frame; the PDF's Open menu, drawn through the File view's snippet, keeps the row shown with the pointer over the view.
- Show Tab Row brings the row back in place.
- No console error after the `untrack` fix; the two errors in the console are from 20:40:24, before it.
- The PDF tab and a catalogs tab the look opened were closed and vocab.yml shown again.

## Agents

- Builder aba446840547d8ea4, claude-opus-5-5: hand-back 225097 tokens, 52 tool uses, 8 min 39 s; build 108098 tokens, 76 tool uses, 20 min 28 s; round 1 186721 tokens, 40 tool uses, 7 min 16 s.
- Brief check a760fccefd58a7066, claude-opus-5-5: 216679 tokens, 58 tool uses, 8 min 23 s.
- Reviewer a914ccedd6c86f1fa, claude-opus-5-5: 244440 tokens, 76 tool uses, 12 min 55 s.
- Reviewer over round 1 a0e5d4a6e03b9c695, claude-opus-5-5: 194879 tokens, 35 tool uses, 7 min 34 s.
