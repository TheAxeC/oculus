# Q86c landing

Roadmap entry oculus/migration, the migration of the research cockpit to oculus. Plan step Q86c, the Map's forces back on d3-force (Z60 (a)). Next: `/spec` Q84; Q88b waits on Z70 and Q102 on Z69.

## Open items (verbatim from the state file)

- Z69, Q102's Copy as HTML: a library or hand code (raised 2026-09-30 at `/spec` Q102, by the library check `libraries: check` requires). Copy as HTML turns the terminal's buffer, its colours and styles cell by cell, into HTML on the clipboard. xterm's own `@xterm/addon-serialize` does exactly that (`serializeAsHTML()`), and it is what VS Code's Copy as HTML calls. Facts (`npm view`): 0.14.0, MIT, maintained by the xterm.js team (tyriar), released 2025-12-22 in the same wave as the `@xterm/xterm` 6.0.0 oculus runs and the addon-search 0.16 and addon-fit 0.11 it already has; it would replace a hand-written walk over xterm's buffer cells and their attributes; nothing else of Q102 would use it. No ruling names it (`grep -i serialize plan.md` finds none; Q83's ruling covers the search, web-links and unicode11 addons only). The options: (a) `@xterm/addon-serialize` 0.14.0 for Copy as HTML; (b) hand code over xterm's buffer API. Recommendation: (a): it is the addon VS Code uses for this item, from the maintainers of the terminal oculus already runs, and hand code would reimplement its colour and style mapping and carry its own defects; (b) is the lazy option only in the sense of skipping the question, it costs more to write and to prove. Q102 is blocked until the ruling; nothing else is.
- Z70, Q88b's two pane-strip settings: their config keys (raised 2026-09-30 at `/spec` Q88b). Q88b's line asks for "the Tab Bar and Editor Actions Position settings" on the pane strip's right-click menu (the inventory, `agents/reviews/vscode-parity.md:269`). VS Code's are `workbench.editor.showTabs` (`multiple`, `single`, `none`: every tab, only the active one, no strip) and `workbench.editor.editorActionsLocation` (`default`, `titleBar`, `hidden`: the pane's action buttons on the strip, in the title bar, or not drawn). oculus has neither: `config/appearance.yml` holds no tab or action key (`grep -n "tab\|action" config/appearance.yml` prints nothing), and X3c will add `wrap_tabs: false` there (Z47 3 (a)). A key and its values are a user-visible shape, so the brief cannot take them. The options: (a) two keys in `config/appearance.yml` beside `wrap_tabs`, `show_tabs: multiple | single | none` (default `multiple`) and `editor_actions: strip | hidden` (default `strip`; oculus has no title bar, so VS Code's `titleBar` has no place), each with a control in the Settings view's Appearance section as `wrap_tabs` gets, the menu's two items setting them; (b) the two settings move to X3c, which owns the tab strip and its `wrap_tabs` key, and Q88b builds the rest of its line; (c) the two items are left out of oculus. Recommendation: (a): it is what the ruled line asks, the keys sit with the tab key X3c adds and follow VS Code's values, and the rest of Q88b does not wait on X3c; (b) splits one menu's items across two steps for no gain beyond sequencing; (c) is the lazy option, it drops two items Axel's Z52 (b) put in scope. Q88b is blocked until the ruling; nothing else is.

## Not done

- The drag on TEST. The Chrome tab was in the background (`document.visibilityState` "hidden"), which runs no animation frame, so the drag, the release and a link written in link mode were not tried. Booked in the state file's Booked section for the next look with the tab in front.

## The check before the landing

The builder and both reviewers had finished; the agent listing showed no subagent of this session.

## What landed

From base de977c87 (18 files, 802 insertions, 729 deletions, then the fixes at landing). One d3-force simulation over every node of the Map (`state/boards/structure/forces.ts`): links at each edge's neato length, a many-body charge, collision and a pull toward the centre, started from neato's placement and settled once before the first draw. A press moves nothing; a drag holds the node at the pointer while every other node is pushed and pulled; a release frees it; every node stays in the box. The hand-written drag physics are gone from `graph.ts`. `d3-force` 3.0.0 and `@types/d3-force` 3.0.10 are dependencies.

Before and after, for the look: before Q86c a link written from link mode left the drawn positions as they were; after it the new edge changes the placement key, so the whole Map is placed again from neato and settled, which replaces a dragged picture.

Accepted from the first review: `placementKey()` and `drawnAt()` with the `untrack` derivation, which re-place the Map only when the nodes, edges or seed change (Spec 1); the re-keyed `allow-duplication.txt:161` (Spec 2). Z58's slide case is superseded by Z60 (a), and Z58's closure in the state file now says so (Spec 3).

The replay onto main conflicted in README.md, package.json, package-lock.json and `docs/diagrams/layers.*`, resolved by keeping both sides, `npm install` and `npm run diagrams`.

## Fixes at landing (three)

1. The empty-set audit renamed "audits that an empty node set settles to no node" (the round refutation's Standards finding).
2. The builder's report's two pointers, corrected in the booking: the refusal case is at `layout.test.ts:198`, and the view audits at `map.test.ts:542-564` are four.
3. README.md's dependency sentence, which Q86c edits, names every runtime dependency with its licence; sixteen added by earlier steps were missing.

## Verification on main

From `tools/oculus`, `npm run diagrams`, then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`:

```
$ npm test
 Test Files  337 passed | 19 skipped (356)
      Tests  5121 passed | 557 skipped (5678)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  360 passed | 9 skipped (369)
$ npm run check
COMPLETED 2341 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

No A/B: the configuration block names no bench.

## The look on TEST

The Map tab of the TEST page, read from the DOM: 53 circles under the page's filters, none overlapping, the smallest gap between two circles 10.8 units (the brief asks at least 3.5), no failure line. The Chrome tab was closed.

## Usage

- Builder (claude-opus-5-5): 110 tool uses, 323k tokens, 62 min; round 1 41 tool uses, 446k tokens, 13.7 min.
- Brief check: 42 tool uses, 161k tokens, 8 min.
- Reviewer: 33 tool uses, 169k tokens, 9.7 min; the run over round 1 24 tool uses, 156k tokens, 7.4 min.
- The builder's first report did not pass its bar: the first review's Proof 1 and 2 went back in round 1. Three fixes at landing.
