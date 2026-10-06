# Step Q96 refuter report (on .agents/worktrees/Q96, base a3c51883)

## Verification (rerun by the reviewer)

```
$ sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md </dev/null   (from .agents/worktrees/Q96/tools/oculus, node v24.21.0 on PATH)
 Test Files  357 passed (357)
      Tests  5720 passed | 1 skipped (5721)
1790682405914 COMPLETED 2049 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
All matched files use Prettier code style!
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 6 commands passed
exit 0
(git-ops.test.ts did not fail in this run; tests/checks/diagrams/diagrams.test.ts is among the 357 passed)

$ grep -rn "Tooltip.Provider" src
src/lib/ui/menu/TooltipGroup.svelte:20:<Tooltip.Provider
src/lib/ui/menu/TooltipGroup.svelte:27:</Tooltip.Provider>
(two lines, the opening and closing tag of one provider; the brief's "one line" counted lines, not providers)

$ sh bin/folder-check.sh
(no output) exit 0

$ spec.md ASCII gate (perl form over src tests bin config)
(no output) exit 0

$ comment width over the new files (awk 'length > 100' on comment lines)
(no output)

$ moved files compared with their deletions in `git diff a3c51883` (diff of the '-' lines against the new file)
tests/ui/{colours,theme,wall}.test.ts -> tests/ui/theme/: only relative import depth and SRC path changed; wall.test.ts also gains the GlyphList/GlyphSelect entries and the choice/ paths
src/lib/ui/forms/{Select,MultiSelect}.svelte -> forms/choice/: import paths; Select takes isStray from choices.ts
src/lib/ui/menu/{KeySheet.svelte,key-rows.ts} -> menu/keys/: import paths only
src/lib/ui/menu/tooltip-target.ts -> tooltip-rules.ts: head comment rewritten, DELAY added
```

npm run diagrams was not run (it writes files); the diagrams test passes in the full run.

## 1. Spec

- `tests/ui/forms/glyph-select.test.ts:109-119` and report DONE row "Pick hands the name, empty hands ''": the brief's case 6 asks that picking calls `onchange` with the name and `''`, "tested through the list component's handler". `GlyphList.svelte` has no handler; the test pins `data-value` only. The wiring `onValueChange={onchange}` at `src/lib/ui/forms/choice/GlyphSelect.svelte:38` is not exercised by any test (see Proof). The report says the press is left for the look, but the table row still reads DONE. It needs to say "audit, look carries it".
- Paths outside the brief's list: `src/lib/ui/forms/{Select,MultiSelect}.svelte`, `src/lib/ui/menu/{KeySheet.svelte,key-rows.ts,tooltip-target.ts}`, `tests/ui/{colours,theme,wall}.test.ts` (all moved), the eight view importers, `shell/Workbench.svelte`, `state/shared/words/tones.ts`, `ui/tabs/TabFace.svelte`, `tests/checks/tree/allow-duplication.txt`, `tests/ui/primitives.test.ts`, `tests/views/system/help.test.ts`, `tests/shell/workbench.test.ts`, `tests/fixtures/client.ts`. `bin/folder-check.sh` forces these moves: the brief's own paths would have put `ui/forms`, `ui/menu` and `tests/ui` over ten items. The report states this (section 8). The moves collide with Q79b in flight. Q79b's brief lists `tests/ui/colours.test.ts`, `tests/ui/wall.test.ts` (brief lines 329-330), `tests/views/system/help.test.ts` and `type-scale.test.ts` for its sweep and readdirSync rewrite. The dispatch block's `shared_paths` for Q96 names only `type-scale.test.ts`. The file Q79b edits is the one Q96 deletes and recreates at another depth. Whichever lands second must redo Q79b's edits by hand on `tests/ui/theme/{colours,wall}.test.ts`. If Q96 lands second on a plain cherry-pick, Q79b's new scratch rule (no `afterAll(sweepScratch)`) turns red on those files. Rename detection is unverified.
- `config/text/views/system/workbench.yml:50`: `rail_why_shape: 'button {0} is not a label, a glyph and a page'` still says "glyph" to the reader. The brief listed four strings and not this one, and the builder's judgment call 8 keeps it because it names the file's keys. It is shown as prose, not as key names, beside fields now labelled Label, Icon, Page. Under Z23 ("the word Icon") this is for the orchestrator to rule. I record it and make no ruling.

## 2. Proof

- `src/lib/ui/forms/choice/GlyphSelect.svelte:38` `<Select.Root type="single" {value} {items} onValueChange={onchange}>`: with `onValueChange={onchange}` removed, every test stays green. No test renders GlyphSelect with a pick, and `glyph-select.test.ts:112` reads only `data-value` from the harness, which does not use GlyphSelect. The test title "gives each item its name as the value a pick hands on" claims more than it checks. Reasoned from the code, not run. It should be marked as an audit, with the pick named as look proof.
- `tests/fixtures/client.ts:17-33`, `tooltipGroup()`: I checked every server render in the suite. Under `tests/ui`, `tests/views` and `tests/shell` no `render` is expected to throw, apart from the new provider test and `glyph.test.ts:87` (unrelated). The only custom contexts are `tooltip.test.ts:139,149` (deliberate) and `collection-form.test.ts:112,151`, which spread `clientContext`. So no test that draws a Tooltip passes for another reason. R13's claim (26 red without the group) is consistent with this. I did not rerun it.
- Reverts R1 and R2 (case 9): R1 (provider back inside Tooltip) turns `tooltip.test.ts:149` red, and R2 (layout renders children bare) turns `:161` red. The code confirms both: bits-ui throws without a provider, and the test matches `/Tooltip\.Provider/`, which passes. Case 9 is a real render, not an audit.
- The TooltipGroup settings (`delayDuration`, `skipDelayDuration`, `disableHoverableContent`, `ignoreNonKeyboardFocus`, `TooltipGroup.svelte:20-25`) are held by no test (`grep -rn "ignoreNonKeyboardFocus\|skipDelayDuration\|delayDuration\|DELAY" tests` prints nothing). No test held them at base either, so this is not a regression. It is recorded as the unguarded part of the move.

## 3. Standards

- `src/lib/ui/forms/choice/GlyphList.svelte:48-68,70-87` repeats `MenuList.svelte:183-203,236-251` rule for rule: `.list` z-index 70, flex column, padding, border, radius, panel, shadow, the `body.wall` colour-mix and blur, and the `.item` and `.item .lead { order: -1 }` blocks. `GlyphSelect.svelte:67-94` repeats `Select.svelte:47-70` (`.select`, focus ring, rice). spec.md "The principles every package is judged on" says a rule exists once. The duplication check does not read style blocks, which is the only reason this passes.
- `tests/fixtures/client.ts:10` imports `../ui/menu/GroupContexts.svelte`, so the fixture every test uses depends on a harness in one test folder. That harness serves every client render, not the tooltip tests. spec.md says "a new file goes where its concern already lives", and the report says it went to `tests/ui/menu/` only because `tests/fixtures` is full. The rule's answer to a full folder is a sub-folder named for what it holds (`tests/fixtures/<x>/`).
- `tests/fixtures/client.ts:17`: `export function tooltipGroup()` has no importer besides its own module (`grep -rn tooltipGroup tests src`). spec.md's YAGNI rule applies to the export.
- `tests/views/system/workbench/settings.test.ts:784,803,875`: `expect(glyphsIn(field)).toEqual(['disclosure'])` asserts that no icon is drawn (only the caret), but no reason comment sits directly above it. The brief's Conventions say "A new absence assertion under tests/views carries a reason comment directly above it". Only `:883` has one.
- `src/lib/ui/display/Glyph.svelte:5-6` ("It sits in ui/display, below the controls, the menus and the frames that draw it") is still true but now incomplete, since `ui/forms` draws it too. The diagram regained the `ui/forms to ui/display` edge. This is minor.
- The docs grep (`tooltip-target`, `KeySheet`, `key-rows`, `forms/Select`, `forms/MultiSelect`, `tests/ui/colours`, `tests/ui/wall`, `tests/ui/theme.test`) over src, tests, bin, config, DESIGN.md, HELP.md and README.md leaves only new-path hits. DESIGN.md:306 says true things. HELP.md describes the Settings rail list only as "the rail list" (lines 19, 142), so none of its sentences became false. `disclosure` exists in `glyphs.yml:34` ("v", the ASCII stand-in) and in `icons.yml:33` (chevron-down), so both glyph modes draw it. The layer order holds: `ui/forms` sits above `ui/display` in `tests/checks/imports/order.ts` ORDER, and `forms/choice` and `menu/keys` count as their parents.

## 4. Behaviour

- The keyboard never scrolls the open list. In bits-ui 2.19.3, `SelectBaseRootState.scrollHighlightedNodeIntoView` (`node_modules/bits-ui/dist/bits/select/select.svelte.js:96-99`) returns early when `!this.viewportNode`, and `viewportNode` is set only by `Select.Viewport` (`:1108-1123`). `GlyphList.svelte` draws no `Select.Viewport`, and the focus stays on the trigger (`aria-activedescendant`), so the browser never scrolls to the item. Over 165 names in a box capped at `min(60vh, available)`:
  - Down past the visible rows highlights items out of sight;
  - End goes out of sight;
  - typing "te" highlights `terminal` out of sight;
  - opening a row whose icon is far down (the initial highlight at `:92-93` goes through the same function) shows the top of the list with the chosen item hidden.

  The report's DONE row "scrolls" and its look list (Up, Down, Home, End, type-ahead to `terminal`) do not state this. A native select, the before, kept the picked option in view. The fix: wrap the items in `<Select.Viewport>` inside `.list`, or make the viewport the scrolling box.
- The trigger's accessible name hides the chosen icon. `GlyphSelect.svelte:41` `<button {...props} class="select" aria-label={label}>`: bits-ui's trigger props give no `role="combobox"` (`select.svelte.js:795-809`), so a screen reader reads "Icon of button 2, button, collapsed" and never the chosen name, because `aria-label` replaces the text content. Before, the native `<select aria-label>` announced its label and its selected option. The report's before and after says nothing about this.
- Under the rice theme the empty choice and a stray value do not line up with the named items. `GlyphList.svelte:90-92` indents by `calc(1.2em + 6px)`, but `Glyph.svelte:71-73` makes the glyph box `3ch` under `body.rice` in both glyph modes. The report (judgment 9) states this as a limit "in the ASCII glyph mode" instead of fixing it. The cause is the rice theme, not the mode, and a `:global(body.rice) .item .name:only-child` indent of `calc(3ch + 6px)` ends it.
- The new caret (`disclosure`) on the trigger, and the rice list rule (`GlyphList.svelte:102-105`, mono face, square corners, which the menus do not have), are visible choices. The report states the caret (judgment 5) and not the rice list rule.

## Not checked

- The look cases (browser, not run by rule).
- Whether git's rename detection carries Q79b's edits onto `tests/ui/theme/*` at the cherry-pick (no git beyond diff and status allowed).
- The builder's reverts R3 to R15: read against the code and consistent, but not rerun.
- `npm run diagrams` output (not run, it writes files).

Reviewer usage: 224840 tokens, 64 tool uses, 13 min (completion notice).

## Repair round 1, refuted

Verification (rerun by the reviewer, from .agents/worktrees/Q96/tools/oculus):

```
$ sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md </dev/null
 FAIL  tests/server/git/git-ops.test.ts > through the endpoint, with the real operations > routes each action to its own operation with its own fields
Error: Test timed out in 5000ms.
 FAIL  tests/server/root/watch/bookmarks.test.ts > publishes once for a burst of writes, and nothing at all once it is closed
AssertionError: expected [ { channel: 'files', ...(2) }, ...(1) ] to have a length of 1 but got 2
 Test Files  2 failed | 355 passed (357)
      Tests  2 failed | 5722 passed | 1 skipped (5725)
checks: failed with exit 1: npm test
$ npx vitest run tests/server/git/git-ops.test.ts        Test Files  1 passed (1)   Tests  37 passed (37)
$ npx vitest run tests/server/root/watch/bookmarks.test.ts   Test Files  1 passed (1)   Tests  4 passed (4)
(neither file is in git diff a3c51883)
npm run check exit 0 (0 ERRORS 0 WARNINGS); build exit 0; format:check exit 0; lint exit 0; ASCII grep exit 0
sh bin/folder-check.sh: no output, exit 0
grep -rn "Tooltip.Provider" src: TooltipGroup.svelte:20 and :27
```

Closures checked: Behaviour 1 (viewport; bits-ui gives it `flex: 1; overflow: auto`, `contentIsPositioned` set by the floating content's `onPlaced`), Behaviour 2 (`aria-labelledby` over `.unseen` and `.name`), Behaviour 3 and 4, Standards 1 list half (MenuList's own item rules compile at (0,3,0) and still win), the tables, Spec 3, Standards 3, 4, 5, Proof 1, and the new tests V1, N1, F1, F2 each red under its revert (reasoned).

### Spec

none

### Proof

- Report DONE row "One floating list box": F1 and F2 do not test that both lists draw through FloatingList; a GlyphList drawing its own box again keeps them green. The row is an audit (a source read).
- Report DONE row "`rail_why_shape`": a source read; no test renders the shape refusal.

### Standards

- `src/lib/ui/frame/FloatingList.svelte:75-77`: "`:where` keeps these at the weight of one class, so a list's own rules ... always win". The compiled rule `.list.svelte-x :where(.item)` weighs (0,2,0), the same as a list's plain `.item.svelte-y`; the tie is decided by stylesheet order. The comment should state the weight as it is.
- `src/lib/ui/menu/MenuList.svelte:8-15`: the head comment breaks mid-sentence ("here. The keys" on its own line), and says MenuList "puts" bits-ui's attributes on the box, which it now hands to FloatingList.

### Behaviour

- The icon list has no scrollbar: bits-ui's `select-viewport.svelte` styles hide every viewport's scrollbar with `!important` (`[data-select-viewport]{scrollbar-width:none!important}`, `::-webkit-scrollbar{display:none!important}`), both in the built CSS. Nothing shows the list goes on past its rows, and a mouse reader can move only by wheel. The native select before, and the menus, show a scrollbar. The report does not state it.

### Not checked

The look cases; Svelte's CSS order between equal-weight rules (none exists today); `npm run diagrams`; the builder's reverts (reasoned, not rerun). The worktree root holds the reviewers' untracked `.scratch-refute/` and `.scratch-refute-r1/`, not step work.

Reviewer usage: 181020 tokens, 40 tool uses, 13 min (completion notice).

### Closed (at landing)

- Proof 1 and 2: stated as audits in the landing report.
- Standards 1: FloatingList's comment rewritten to the real weight, fixed at landing.
- Standards 2: MenuList's head comment reflowed and reworded, fixed at landing.
- Behaviour 1: GlyphList restores the viewport's scrollbar over bits-ui's `!important`, fixed at landing.
