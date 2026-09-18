# Review of Q54, `ui/Tabs.svelte` split by concern

Worktree untouched. Opening and closing `git status --short` are byte-identical, and `git diff --stat 8d8426df` is unchanged:

```
 M bin/size-allow.txt
 M src/lib/ui/Tabs.svelte
 M tests/allow-styling.ts
 M tests/boundaries.test.ts
 M tests/browser/tabs.spec.ts
 M tests/ui/primitives.test.ts
 M tests/ui/wall.test.ts
 M tests/views/type-scale.test.ts
?? src/lib/ui/TabFace.svelte

 tools/oculus/bin/size-allow.txt             |   1 -
 tools/oculus/src/lib/ui/Tabs.svelte         | 270 ++--------------------------
 tools/oculus/tests/allow-styling.ts         |   4 +-
 tools/oculus/tests/boundaries.test.ts       |   1 +
 tools/oculus/tests/browser/tabs.spec.ts     |  12 +-
 tools/oculus/tests/ui/primitives.test.ts    |  12 +-
 tools/oculus/tests/ui/wall.test.ts          |   3 +-
 tools/oculus/tests/views/type-scale.test.ts |   6 +-
 8 files changed, 44 insertions(+), 265 deletions(-)
```

Every experiment ran in a copy at `.../scratchpad/q54-review/oculus` (rsync of the worktree, `node_modules` symlinked), removed afterwards.

## The verification lines, verbatim

`npx vitest run --reporter=dot`
```
 Test Files  259 passed (259)
      Tests  4357 passed (4357)
   Duration  52.37s
```
No rerun was needed; `tests/server/hpc/ssh.test.ts` passed in the one full run.

`npm run check`
```
1789724243220 START "/Users/axelfaes/workspace/research-hub/.agents/worktrees/q54/tools/oculus"
1789724243227 COMPLETED 1242 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
```

`npm run lint` -> no output after the npm banner.

`npm run format:check`
```
Checking formatting...
All matched files use Prettier code style!
```

`npm run build` -> `build exit=0`; `✓ built in 1.68s`, `✓ built in 5.09s`, `✔ done`. The only line matching `error` is the asset name `.svelte-kit/output/server/entries/fallbacks/error.svelte.js`.

The ASCII gate (the spec's `perl` one-liner over `find src tests bin config -type f ! -name glyphs.yml`) printed nothing.

`sh bin/size-check.sh` -> no output, `exit=0`.

`find src tests bin -type f | xargs wc -l | sort -n | tail -6`
```
     940 src/lib/server/audit.ts
     970 tests/routes/terminal.test.ts
     970 tests/state/layout.test.ts
     973 tests/views/collection.test.ts
     980 tests/state/board.test.ts
  180685 total
```

`npx playwright test tests/browser/tabs.spec.ts tests/browser/pages.spec.ts tests/browser/shell-defects.spec.ts tests/browser/keyboard.spec.ts`
```
  49 passed (1.1m)
```
Port 8792 was free at each check (`lsof -iTCP:8792 -sTCP:LISTEN` printed nothing); no lock touched, no pid signalled, no `pgrep -f`.

`wc -l` -> `362 src/lib/ui/Tabs.svelte`, `306 src/lib/ui/TabFace.svelte`. Every row of the report's line-count table reproduces, including `tests/boundaries.test.ts` which the report marked "not measured before": `git show 8d8426df:...` gives 567, the tree gives 568.

`node bin/revert-check.mjs tests/ui/primitives.test.ts tests/ui/wall.test.ts tests/views/type-scale.test.ts tests/boundaries.test.ts tests/size.test.ts` -> `23 reverts, 1 unproven, 77 unchecked`. All seven directives the report quotes come back `red`:
```
red tests/ui/primitives.test.ts :: marks the shown tab current and no other (revert src/lib/ui/TabFace.svelte:77)
red tests/ui/primitives.test.ts :: marks a tab holding unsaved text and draws its dot, and draws no dot on a clean tab (revert src/lib/ui/TabFace.svelte:78)
red tests/ui/primitives.test.ts :: names a tab holding unsaved text with the catalog word, and leaves a clean tab its label (revert src/lib/ui/TabFace.svelte:89)
red tests/ui/primitives.test.ts :: draws the glyph before the label, and the preview mark on the preview tab alone (revert src/lib/ui/TabFace.svelte:100)
red tests/ui/wall.test.ts :: answers every surface a component paints, or names it as solid with its reason (revert src/lib/ui/TabFace.svelte:258)
red tests/boundaries.test.ts :: lets no view or shell component style a primitive own class (revert tests/allow-styling.ts:72)
red tests/size.test.ts :: is on the list with a count it has not passed (revert bin/size-allow.txt:7)
```
The one `GREEN` is `tests/ui/primitives.test.ts :: draws a row action as a button only when the caller says what one means (revert src/lib/ui/Ticker.svelte:231)`; `git diff 8d8426df` touches neither `src/lib/ui/Ticker.svelte` nor that directive's line, so it is pre-existing, as the report says. Each of the eight directive line numbers names the line it claims (`TabFace.svelte:77 class:current`, `:78 class:dirty`, `:89 aria-label`, `:100 <Glyph name={tab.glyph} />`, `:169 border-top-color: var(--accent)`, `:177 border-top-color: var(--line)`, `:258 background: var(--chip)`, `:289 display: flex`).

The two hand-run `type-scale` reverts, run by me in the copy:
- delete `font-size: var(--fs-lg);` at `src/lib/ui/TabFace.svelte:224` -> `FAIL tests/views/type-scale.test.ts > the view type scale > sets every pass-through role in src/lib/ui/TabFace.svelte`, `Tests 1 failed | 155 passed (156)`
- insert `font-size: var(--fs-lg);` into `.strip` at `src/lib/ui/Tabs.svelte:291` -> `FAIL ... sets every pass-through role in src/lib/ui/Tabs.svelte`, `Tests 1 failed | 155 passed (156)`

The `badgeStyle` / `cellStyle` claim, tested by making the move in the copy (both functions exported from `src/lib/ui/tab-strip.ts`, imported into `TabFace.svelte`) and running `npx vitest run tests/ui/colours.test.ts`:
```
 FAIL  tests/ui/colours.test.ts > the colour rule > holds in every component under ui, shell, views and routes
+   "lib/ui/TabFace.svelte: .cell: background: var(--cell-bg) (not a surface or a hue)",
+   "lib/ui/TabFace.svelte: .cell: color: var(--cell-fg) (not a -txt or --on- token)",
+   "lib/ui/TabFace.svelte: .tab-badge: background: var(--tab-badge-bg, var(--chip)) (not a surface or a hue)",
+   "lib/ui/TabFace.svelte: .tab-badge: color: var(--tab-badge-fg, var(--accent-txt, var(--accent))) (not a -txt or --on- token)",
```
The claim holds exactly as written. `assignments()` at `tests/ui/colours.test.ts:296` reads the component source only, so the token pair must be built in the file whose CSS names it.

## Spec

**none.** Every deliverable of the brief is in the diff and the widened paths are each forced.

Declaration by declaration: I sorted every CSS declaration of the base `Tabs.svelte` against the union of the new `Tabs.svelte` and `TabFace.svelte`. The only difference is the one selector's text plus one added comment; every property, value and rule body is byte-identical. The base has 30 rules, the pair has 12 + 18 = 30, one to one.

The four widened paths:
- `bin/size-allow.txt`: one line removed (`src/lib/ui/Tabs.svelte 596`). Strengthens, does not weaken: `tests/size.test.ts :: is on the list with a count it has not passed` goes red without the removal, and `sh bin/size-check.sh` exits 0. Neither 362 nor 306 needs an entry.
- `tests/allow-styling.ts:72` and `:96`: `ui/Tabs.svelte` -> `ui/TabFace.svelte` in the `line:` text of two held entries, because `.label` is now declared by `TabFace.svelte` (`.face.preview .label`). The other ten entries naming `ui/Tabs.svelte` are for `.card` and `.opener`, both classes still declared in `Tabs.svelte`, and are correctly untouched. The reason clause and the `file:line` of each violation are unchanged, so no violation was relaxed.
- `tests/views/type-scale.test.ts:216-217`: `'src/lib/ui/Tabs.svelte': ''` plus a new `TabFace.svelte` entry carrying the four roles verbatim. Keeping the empty entry is the stronger option: deleting the key would drop the check for `Tabs.svelte` entirely, and my hand-revert proves the empty entry still fails when a font size is put on `.strip`. There is precedent at `:221` (`'src/lib/shell/Workbench.svelte': ''`).
- `tests/boundaries.test.ts:505`: one comment line, a revert directive for the `allow-styling.ts:72` edit. Adds a proof, weakens nothing.

No check anywhere in the diff was loosened.

## Proof

**One number in the report does not reproduce.** `Q54-report.md`, the DONE/NOT DONE table:

> | `find src tests bin -type f \| xargs wc -l \| sort -n \| tail -5` | DONE | ... `180673 total` |

The tree gives `180685 total` (run twice). The four file rows it quotes (970, 970, 973, 980) reproduce exactly. The 12-line gap is the revert-directive comment lines the builder added after running that command; it is a stale quote, not a defect in the diff. Every other number, output line and revert in the report reproduces.

Everything else under this heading: **none**. Node suite, `check`, `build`, `lint`, `format:check`, the ASCII gate, `size-check`, the browser 49, the line counts before and after per file, and the seven machine reverts plus the two hand reverts all reproduce as quoted.

## Standards

**`DESIGN.md:98` is not made false; the report over-flags it.** The report names it as a doc line the split breaks, on the ground that `TabFace.svelte` is a primitive missing from the list. `ls src/lib/ui/*.svelte | wc -l` gives 32, and line 98 lists 10:

```
        Card.svelte Chip.svelte Tag.svelte Meter.svelte Table.svelte Pane.svelte Tabs.svelte Sash.svelte Empty.svelte Toolbar.svelte
```

`Breadcrumb`, `Checkbox`, `Confirm`, `DateInput`, `Disclosure`, `Field`, `Glyph`, `KeySheet`, `Menu`, `MultiSelect`, `Search`, `Segment`, `Select`, `TextArea`, `TextInput`, `Ticker`, `ToolButton`, `Tooltip`, `TreeItem`, `TreeSection`, `TreeView` are already absent. The line is a sample, so the split changes nothing about it. `DESIGN.md:339` is the one genuinely made partly false, as the report says, and there are no others: `grep -rn 'Tabs\.svelte\|tab-strip\|TabFace' DESIGN.md HELP.md README.md` returns only `DESIGN.md:98`, `DESIGN.md:331` and `DESIGN.md:339`, and 331 names `ui/tab-strip.ts` and `ui/tab-scroll.svelte.ts` for the scroll arithmetic, which did not move. `HELP.md` names no source file (its tab text at lines 7, 9, 15, 23, 27, 30-34, 43 describes behaviour only), so the report's `HELP.md` claim holds.

No history in any comment: `grep -nE 'Q[0-9]{1,2}\b|20[0-9]{2}-|package |previously|used to|was moved' src/lib/ui/TabFace.svelte` prints nothing, and the added lines in the diff carry no package id and no date. The `// revert:` lines are the tree's machine-readable convention, read by `bin/revert-check.mjs`.

No non-ASCII (gate above). No file over the limit (`size-check` exit 0; 362 and 306 against the 600 component guide).

Head comments: `TabFace.svelte:2` opens `Layer 3, primitive.` and owns the face, the marks and the close control; the paragraph about a button not nesting in a button moved with the markup it describes. `Tabs.svelte:21-24` now describes the strip's own surface, line, mark and controls and points at `ui/TabFace.svelte`. `tests/ui/primitives.test.ts:827` ("drop `class:unfocused`, `class:low` or `class:card` from the strip in ui/Tabs.svelte") is still true.

## Behaviour

**none.** The three things the brief told me to attack all come back clean, each by a command.

**The markup contract.** I rendered the base component and the split pair side by side through `svelte/server` with one props set exercising every branch (glyph, hint, badge with tone and title, glyph badge, split cells, dirty, preview, `dropIndex`, `focused: false`, `low`, `surface: 'card'`, `onpointerdown` present). With Svelte's scope hashes stripped the two bodies differ only by the `<!---->` anchor comment Svelte emits after a component instance; with those normalised away the assertion passes:
```
 Test Files  1 passed (1)
      Tests  1 passed (1)
```
Every `data-tab-preview`, `data-drag-handle`, `role="tab"`, `role="presentation"`, `role="tablist"`, `aria-selected`, `aria-label`, `aria-hidden`, `tabindex`, `title`, inline `style`, and every class (`tab`, `tab current`, `tab dirty`, `face`, `face preview`, `label`, `tab-badge`, `cells`, `cell`, `close`, `dot`, `cross`, `mark`, `strip`, `tabs`, `scroll-control`, `opener`) sits on the same element as before. The anchor is a comment node, so `:scope > .tab` still resolves (used at `tests/browser/tabs.spec.ts:41`, `:229`, `tests/browser/pages.spec.ts:154`, `tests/browser/shell-defects.spec.ts:393`, all in the four specs that passed). The only `childNodes` walk in the browser suite is `tests/browser/focus-look.spec.ts:149`, over Focus cards, not tabs.

**The one rewritten selector carries its specificity.** Compiling both with `svelte/compiler`:
```
Tabs.base.svelte | .strip.unfocused.svelte-1pbz05d .tab.current:where(.svelte-1pbz05d) {
TabFace.svelte   | .strip.unfocused .tab.current.svelte-r6fpqc {
```
`:where()` contributes nothing, so the base is `(0,5,0)`; the new form is `2 + 3 = (0,5,0)`. Identical, and both beat `.tab.current.svelte-*` at `(0,3,0)`, which is the rule they must override. `:global(body.wall) .tab.current` compiles to `body.wall .tab.current.svelte-*` in both, `(0,4,1)`. The browser case at `tabs.spec.ts:255` exercises exactly this pair and passes.

The `:global` does widen the ancestor match in principle, from "a `.strip.unfocused` rendered by `Tabs.svelte`" to any such element. I checked whether another can exist: `grep -rn 'class="strip\|class:strip' src/lib` finds `src/lib/shell/PageStrip.svelte:282` (`<section class="strip" ...>`, a static class list) and `src/lib/shell/SplitView.svelte:129` (`<div class="strip {layout.dir}">`, where `layout.dir` is `'row'` or `'col'`, per `SplitView.svelte:49`). Neither can carry `unfocused`, so the match set is the same one today. `TabFace.svelte:174-175` explains the reach in its own comment.

**The bindings.** The strip measures the same box and focuses the same element: `bind:face` lands on the same `<div class="tab">` and `bind:head` on the same `<button class="face">`, proven by the markup probe above. For the timing I instrumented the copy's two `$effect`s in `Tabs.svelte` to print the state of `faces` at the moment each runs and at the moment the queued `reveal` microtask fires, built it, and ran a Playwright probe that boots, opens six more views and then reloads the page with seven tabs and the active one last:
```
Q54PROBE effect faces=[el,el,el,el,el,el,el]
Q54PROBE reveal index=6 n=7 faces=[el,el,el,el,el,el,el]
```
Every effect run and every reveal microtask, on first mount and after the reload, finds every face bound. The one `faces=[n]` in the log is a strip being torn down, which `measure()` already guards at `tab-scroll.svelte.ts:88-89`. Nothing is measured before the child has bound it. (The `$effect` at `Tabs.svelte:110` also reads `faces` as `$state`, so a late binding would retrigger it; the `reveal` effect at `:123` does not, which is why I measured it rather than argued it.)

**The wall rule.** The strip's styles all stayed in `ui/Tabs.svelte`, and the block the other step writes into is byte-identical to the base:
```
$ diff <(base .strip block) <(new .strip block)
strip block IDENTICAL between base and split
```
That is `Tabs.svelte:288-311`: `.strip`, `.strip.low`, `.strip.card`, `:global(body.wall) .strip`, `:global(body.wall) .strip.card`. `.strip` is still the root element of `Tabs.svelte` at `:216`, and the built CSS confirms `body.wall .strip.svelte-1fwbyla`. So `position: relative; z-index: 1` under `:global(body.wall) .strip` still applies to the same element, and its hunk context is unchanged, which is what a cherry-pick needs.

Nothing the split moved needs its own depth. `grep -n 'z-index\|position:' src/lib/ui/Tabs.svelte src/lib/ui/TabFace.svelte` finds no `z-index` at all and only `TabFace.svelte:271 position: relative` (the unsaved dot) and `:278 position: absolute` (its svg), both contained inside one tab. A stacking context on `.strip` does not reorder its descendants among themselves.

## Things worth telling the orchestrator, none of them a defect of this step

- `tests/views/type-scale.test.ts` has a completeness guard only for `src/lib/views` (`lists every view file in the audit`, `:225-232`); `PASS_THROUGH` is hand-curated with no such guard, so a future `ui/` component with a `font-size` and no entry goes unchecked. Pre-existing; this step did add its own entry.
- `z-index: 1` on `.strip` would make the strip a stacking context, which traps anything the caller's `menu` snippet renders inside `.opener`. Unchanged by this split (the `.opener` and the menu stayed in `Tabs.svelte`), and a question for the wall step, not this one.
- The wall step and Q54 both name `src/lib/ui/Tabs.svelte`, which the spec's 2026-09-14 amendment says disjoint briefs should avoid. The block they touch does not overlap, and I verified the context is intact, so the landing order does not matter here.

## What I did not check, named

- **Other browser specs.** I ran only the four the brief names. `grep -rn 'data-\|locator(\|getByRole' tests/browser` shows tab markup also selected in `cards`, `files`, `source`, `nested`, `layout`, `focus-look`, `unsaved-forms`, `show-in-files`, `board`, `repositories` and others; the markup probe proves the DOM is byte-identical apart from a comment node, but I did not run them.
- **The look on screen in Chrome.** Not done; that is the orchestrator's TEST-page look, and the report's "before and after" section says the answer is that nothing should differ anywhere in its list.
- **The other in-flight steps' diffs.** I read neither, and I did not attempt the cherry-pick.
- **`tests/ui/colours.test.ts` beyond the one experiment.** It passed in the full suite; I ran it standalone only with the helpers moved, to test the report's claim.
- **The pre-existing GREEN revert at `src/lib/ui/Ticker.svelte:231`.** I confirmed it is outside the diff, but I did not investigate why it is green.

## Usage

27 tool calls, all inline, no subagents. Roughly 15 minutes of wall clock, most of it the node suite (52s), `npm run check`, two builds and the browser run (1.1m), plus one instrumented build and browser probe in the copy. No file in the worktree was written; the copy was removed.

