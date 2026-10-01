# Step L4 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/L4, base 3a246eca)

Pages cited (the rules file, the brief, the state file) are named with their section. Findings in code keep `file:line`. Paths are relative to `tools/oculus` in the worktree.

## Verification (rerun by the reviewer)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams
> node utils/diagrams/diagrams.mjs   (exit 0; the tracked diagrams are unchanged by it:
  `git diff 3a246eca -- docs/diagrams | shasum` 3db2a075... before and after; `git diff 3a246eca | shasum` 2f6bbc17... before and after; `git status --short | shasum` a540be6a... before and after)

$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md   (run 1, output through tail -150)
... format:check, lint, the non-ASCII grep, then:
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
EXIT 0

Same command, run 2 (filtered to summary lines):
$ npm test
 FAIL  |unit| tests/server/edit/config-key.test.ts > one value written over its own bytes > keeps the quote style of the line, the apostrophe of a single-quoted one doubled
 FAIL  |unit| tests/server/edit/config-key.test.ts > a value the option does not take > refuses a whole number the reader refuses, with the reader's own sentence
 Test Files  1 failed | 423 passed | 22 skipped (446)
      Tests  2 failed | 11156 passed | 618 skipped (11776)
checks: failed with exit 1: npm test

Failing file the step does not touch, rerun alone:
$ npx vitest run tests/server/edit/config-key.test.ts --reporter=dot
 Test Files  1 passed (1)
      Tests  35 passed (35)
(spec.md "Verify before you report": named in one line, not a finding; the file took 51 s in the full run, a load timeout.)

The six other commands of the list, run one by one after run 2:
$ npm run test:checks     Test Files  29 passed | 2 skipped (31)    Tests  442 passed | 9 skipped (451)
$ npm run check           1790897182270 COMPLETED 2960 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run format:check    All matched files use Prettier code style!
$ npm run lint            (eslint ., no output)
$ ! LC_ALL=C grep -rna '[^ -~]' src tests    (no output)
(npm run build passed inside run 1: its output ends "built in 26.00s", "done".)

Builder's quoted evidence, rerun:
$ grep -n "LAYOUT_VERSION = 5" src/lib/state/workbench/layout/model.ts      121:export const LAYOUT_VERSION = 5;
$ grep -n "floats:" config/layout.yml                                       118:floats:
$ the spec's ASCII perl gate over src tests bin config (not local.yml)       (no output)
$ sh utils/folder-check.sh; sh utils/size-check.sh                          (no output, exit 0 each)
$ folder counts (ls | wc -l): shell/panes 10, state/workbench 10, state/workbench/layout 10, layout/open 7, tests/shell/panes 6, tests/.../layout/open 6, layout/saved 8, shell/panes/floats 3      (match the report)
$ wc -l src/lib/shell/panes/PaneView.svelte                                 496   (matches)
$ npx vitest run <the twelve files the report names> --reporter=dot         Test Files 12 passed (12)  Tests 376 passed (376)   (matches "376 passed, 0 failed")
Counts of run 2 (424 files, 11158 tests) match the report's 424 / 11158.
```

Not reproduced: the report's "first run on the unchanged tree" counts (they need a second checkout at base 3a246eca with stub modules; I may write nowhere). See Declined to judge.

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `model.ts` has `Float`, `FloatPlace`, `Host`, `Pages.floats`, `Pane.keeps?: 'terminals'`, `LAYOUT_VERSION = 5` (grep above).
- 2: holds. `saved.ts` gate accepts 5, 4 and 3; `readFloats`/`readFloat` drop bad floats and keep the rest; `checkFloats` checks ids; `readPane` reads `keeps`; `layout-floats.test.ts` 27 cases pass in my twelve-file run.
- 3: holds. `config/layout.yml:118-119` `floats:` with `{ view: [hpc, usage], dock: right, size: 0.3 }`; Focus is `root: { kind: pane, view: focus }`; `parseFloats` in `navigation/arrangement.ts`; options entry added; `portfolio.ts` needed no change (config-folder and options-catalog tests pass in `npm run test:checks`).
- 4: holds. `access.ts` returns `Host`, `isPage` narrows, `instances.ts` loops walk `hostsOf`, `touched()` ignores floats, `openInto` finds a view in the floats, `takeSaved`/literals carry `floats`, `startOnRailPage`/`resetPages` take the shipped floats, `floats.ts` holds the pure operations and `FLOAT_MIN = 0.1`. Two parts are not what the item names (finding 1.2 on a mechanism it adds, finding 1.4 on files outside its path list); neither makes the item's text false.
- 5: violated. A free float is positioned from fractions of the window (`position: fixed`, `vw`/`vh`), not "over the area ... from their fractions of the area"; see 1.1. The z-order below the drag layer fails after several floats were pressed; see 4.1. `--float-border` on `body`, the strip with a sash, `FloatLayer` mounted once outside `{#key page.id}` (`Workbench.svelte:323`), drawn while a pane is maximised, `interactjs` gestures, 24 px docking and the resize listener are present.
- 6: holds, read against Z184 (5), case 14 and case 34. The brief's item 6 sentence says a float's menus offer "the splits, the fold, maximise or restore ... and the page lists" and contradicts those three; the builder followed the cases and said so (report "Judgment calls" 1). The menus are in `pane-view.ts` (`floatItems`, `floatMenu`, `stripMenu`) and `PaneView.svelte:219-234`.
- 7: holds. `drag.svelte.ts` reads Alt, `end()` floats at the pointer, `DropLayer.svelte` draws the outline (`outlineAt`), `PaneBody.svelte:89` takes an edge hover over a float as a centre drop; `drag.test.ts` 37 pass. (An edge hover over a float becomes a centre drop rather than a refused drop: see Declined to judge.)
- 8: holds. `tree.ts` `KeepRule`/`keptPane`, `removeTab`, `closeInstance`, `moveInstance`, `splitWith` take the rule; `landing.ts` takes an empty documents pane before a terminals pane; `PaneBody.svelte` draws `ui.pane_empty_terminals`; `kept-panes.test.ts` 22 pass.
- 9: holds. `config/text/ui.yml` keys present; `DESIGN.md` gains the floats and kept-pane paragraphs and the Pages/Floats/landing bullets; `HELP.md` gains the Float bullet, the kept-pane rule and, at `HELP.md:128`, "line height, letter spacing, weight and ligatures are fixed and have no setting". Finding 3.1 is a comment the diff makes false outside these pages.

Cases of the brief's "Cases":

- 1 (serialise/parse, version 5, version 4 with `floats: []`): met, `layout-floats.test.ts:46`, `:58`.
- 2 (bad floats dropped, valid kept): met, `layout-floats.test.ts:100` and the `it.each` at `:112`.
- 3 (two docked on one edge, first kept): met, `layout-floats.test.ts:156`.
- 4 (no saved layout on the shipped config): met, `floats-store.test.ts:84`.
- 5 (`resetPages` puts the shipped floats back): met, `floats-store.test.ts:117`.
- 6 (`floatPane` on the right pane): met, `floats.test.ts:40`.
- 7 (`floatPane` on the only pane): met, `floats.test.ts:65`.
- 8 (`openIn` a float, last tab removes it): met, `floats-store.test.ts:209`.
- 9 (`dockFloat`, merge on a taken edge): met, `floats.test.ts:144`, `:152`.
- 10 (`returnFloat`): met, `floats.test.ts:196`.
- 11 (`fitFloats`): met, `floats.test.ts:298-306`.
- 12 (a split of a float leaves the pages unchanged): met, `floats-store.test.ts:224`.
- 13 (Alt drop over a pane centre): met, `drag.test.ts` "puts the tab in a new free float at the pointer through the store".
- 14 (menus): met, `pane-strip-menu.test.ts` "the strip menu of a float".
- 15, 16, 17, 18, 19: met, `kept-panes.test.ts` (Explorer `:168`, terminals `:95`/`:100`, second documents pane `:107`, drag `:123` and `:199`, `closePane` `:134`).
- 20 (`landingFor` order): met, `landing.test.ts` "lands a document in the empty documents pane before an empty terminals pane".
- 21 (server render with a docked and a free float; a page switch keeps the float): met, `floatlayer.test.ts:88-110`, `:155`; the "outside the keyed block" part is a source-text assertion (finding 2.1).
- 22 (saved version 4 Focus page adopts the shipped floats): met, `floats-store.test.ts:157`, `:168`.
- 23 (`takeSaved` with two floats): met, `floats-store.test.ts:462`.
- 24 (closing the last page keeps the floats): met, `floats-store.test.ts:445`.
- 25 (`touched()` never a float): met, `floats-store.test.ts:294`, `:303`.
- 26 (`openView('hpc')` with hpc in a float): met, `floats-store.test.ts:318`.
- 27 (`closeInstancesOfView`, `closeRecord`): met, `floats-store.test.ts:372`, `:379`.
- 28 (`moveInstanceToPage` from a float): met, `floats-store.test.ts:404`.
- 29 (kept rule on other routes): met, `kept-panes.test.ts:193`, `:205`, `:242`; the `File.svelte` clause has no first run on the unchanged tree (finding 1.3).
- 30 (Alt-drag of the only tab): met, `floats-store.test.ts:436`.
- 31 (a float's tab to a page pane and back): met, `floats-store.test.ts:419`.
- 32 (`fitFloats` called by the resize): partial: the listener exists (`FloatLayer.svelte:110-114`) and the test is a source-text assertion (finding 2.1); by reading, no stored place can fail to fit, so the call changes nothing (finding 2.2).
- 33 (`workbench-keys` resolves a float id): met, `workbench-keys.test.ts` "a pane of a float" (digit and bracket act on the float's pane).
- 34 (no maximise in a float's menu; layer drawn with a pane maximised): met, `pane-strip-menu.test.ts` "offers no maximise, fold or page to show beside it"; `floatlayer.test.ts:172`.
- 35 (`Host` without `label`; rail and Pages view list no float): met, `floats-store.test.ts:250`, `:262`.
- 36 (implied cases): met, `floats-store.test.ts:270`, `:278`, `:462`.
- 37 (existing cases pass except the named ones): met. The full suite passes in run 1; the changed existing tests are listed in the report and each appears in the diff.

## 1. Spec

- 1.1 `src/lib/shell/panes/floats/float-geometry.ts:41-44` and `FloatLayer.svelte:197-199`: "`left: ${viewport(place.x, 'vw')}` ... `.free { position: fixed;`"; what is wrong: item 5 says free floats are "drawn over the area ... positioned from their fractions of the area"; the diff positions them from the window with fixed positioning and viewport units. Items 1 and Z95 (3) say the fractions are "of the window", so the brief contradicts itself, and the report does not name the contradiction, the choice made, or its effect (not in "Anything wrong in the brief", not in "Before and after"); failure scenario: a free float at `y 0.7, h 0.4`... or any `y + h` above the bottom edge of the area is drawn over the status bar, and one at `x 0` over the activity rail, which the "over the area" reading would not allow; the reader who puts a float there loses the rail buttons or the status bar under it; verdict: item 5 violated (to be ruled: fractions of the window or of the area).
- 1.2 `src/lib/state/workbench/layout/saved/saved.ts:444-459` `serialiseFloatless`, `needsFloats`; `saved/storage.ts:85-86` "`const held = floatless && next.floats.length === 0; ... held ? serialiseFloatless(next) : serialiseLayout(next)`"; `layout.svelte.ts:258,390,423,428,498,584-585` `pendingFloats`; `model.ts:127` `FLOATLESS_VERSION`; what is wrong: no item asks for a build that writes a version 4 envelope while it is at version 5. Item 2 says `serialiseLayout` writes `floats` and item 4 says `adoptFloats` takes the floats in; the extra mechanism keeps a layout read from an older envelope in that envelope's form until the floats arrive. The report does not mention it (no hit for `floatless`, `pendingFloats` or `needsFloats` in `L4-report.md`), and `DESIGN.md:370` says "the envelope is `{ version: 5, pages, current, floats }`"; failure scenario: a reader of `DESIGN.md:370` inspecting `oculus.layout.v1` after loading a saved version 4 layout and changing a page name finds `"version":4`, and a later change to `needsFloats` or `adoptFloats` that does not know the interim form loses the adoption silently; verdict: none (no item violated), a change no item asks for and a surface the report and the page leave out.
- 1.3 `L4-report.md:32`: "The file-tab route case (`File.svelte` closing through the store) was added after that run and has no first run on the unchanged tree: not verified there."; what is wrong: the brief's "Cases" and Spec heading require the first run on the unchanged tree of every case; case 29's third clause (`File.svelte`'s own close) has none, and the report gives the first run as counts per file rather than a result per case; failure scenario: nobody can tell from the report that `kept-panes.test.ts:242` would fail without the rule; verdict: case 29 met by the test, with this gap.
- 1.4 Files the diff changes outside "Paths this step writes" and not named in the report: `src/lib/shell/status/StatusBar.svelte`, `src/lib/state/client/context.ts`, `src/lib/state/workbench/layout/saved/storage.ts`, `src/routes/+page.svelte`, `src/lib/views/sessions/terminal/Terminal.svelte`, `src/lib/views/sources/doc/Doc.svelte`, `config/text/views/system/workbench.yml` (the report names `Tabs.svelte`, `registry.ts` and, as widened signatures, `pageInstanceIds`, `firstUnsaved`, `unsavedCount`); what is wrong: the changes follow from item 4 (each walks every tab through `hosts()`), but the report's list of changes outside the path list is incomplete, and `L4-report.md:130` says "`File.svelte` and `Doc.svelte` needed no change" while `Doc.svelte:46,79-84` is in the diff (`pages()` became `hosts()`); failure scenario: the orchestrator reads the report, reads `Doc.svelte` as untouched, and lands a change it was told is absent; verdict: none.

## 2. Proof

- 2.1 `tests/shell/panes/floatlayer.test.ts:164-170`, `:184-189`, `:192-196`: "`const source = readFileSync('src/lib/shell/Workbench.svelte', 'utf8'); ... expect(layer).toBeGreaterThan(source.indexOf('{/key}'))`", "`expect(source).toMatch(/addEventListener\('resize'/)`", "`expect(css).toMatch(/body\s*\{[^}]*--float-border:\s*var\(--c-orange\)/)`"; what is wrong: three assertions over source text; the report counts them in "floatlayer.test.ts 11 / 11" as proof of item 5 and cases 21 and 32 without marking them as audit (`spec.md` "What every package obeys": an assertion over source text "is reported as an audit, never as coverage"; the brief's cases 21 and 32 allow "by reading the component", which is a reading and not a pass); failure scenario: `FloatLayer` moved inside a keyed block that closes before the first `{/key}` text, or the `resize` listener put in a dead branch, still passes all three; verdict: none (cases 21 and 32 read as met/partial in "Verdicts" on the reading, not on these tests).
- 2.2 `tests/state/workbench/layout/open/floats-store.test.ts:483-501`: "`it('fits every float back inside the window, through placeFloat, and writes nothing when they fit'`"; what is wrong: the title claims the store fits floats back, the body gives it a float that already fits and asserts nothing is written, then calls `placeFloat` with another fitting place; no case moves a float through `fitFloats` in the store. By reading, every writer of a place yields one that fits (`floats.ts:46` `placeFits` at parse and `placeFloat:375`, `floatTab:241` clamp, `centred:63`), and places are fractions of the window, so `fitFloats` called on a resize changes nothing in any state the store can hold; the pure function is covered at `floats.test.ts:298-318`; failure scenario: a reader of case 32 and of `DESIGN.md:212` ("a smaller window brings every free float back inside it") takes it that a resize moves floats; it never does; verdict: case 32 partial.
- 2.3 `L4-report.md:13-33`: the first-run counts (0/42, 1/33, 6/21, ...) are not reproducible here; no decision rests on them beyond the Spec finding 1.3. Not a finding.

## 3. Standards

- 3.1 `src/lib/views/system/hpc/Hpc.svelte:2-3`: "`Live HPC follows Focus in the Focus page's group, in the pane beside it.`"; what is wrong: the diff moves Live HPC out of the Focus page's tree into a float docked at the right edge (`config/layout.yml:119`), so the sentence is false (a sentence in a head comment the diff makes false, found by `grep -rniE "focus page|hpc and usage" src config HELP.md DESIGN.md`); failure scenario: a reader of `Hpc.svelte` looks for Live HPC in a pane of the Focus page and does not find it; verdict: none.
- 3.2 `src/lib/shell/panes/floats/float-geometry.ts:147-148`: "`const width = window.width * 0.3; const height = window.height * 0.4;`"; what is wrong: the outline of an Alt-dragged float repeats the 0.3 and 0.4 that `floats.ts:28-29` holds as `START_W` and `START_H` (not exported) and that `floatTab` uses to make the float; a rule exists once (brief "Conventions": "a parser or a rule exists once"; `spec.md` DRY); failure scenario: changing the starting size in `floats.ts` leaves the outline drawn at the old size, so the outline shows a float that is not the one made on release; verdict: none.
- 3.3 `L4-report.md:151`: "I ran `git diff --stat` twice, read-only, by mistake"; what is wrong: `spec.md` "Where you work": "You never run a git command"; the report states it; failure scenario: none observed (read-only, the diff is unchanged); verdict: none.

## 4. Behaviour

- 4.1 `src/lib/shell/panes/floats/FloatLayer.svelte:56,60,64`: "`const BASE_DEPTH = 5;` ... `z-index: ${BASE_DEPTH + Math.max(0, order.indexOf(float.id))}` ... `order = [...order.filter((one) => one !== id), id];`" against `DropLayer.svelte:91-93` "`.layer { position: fixed; inset: 0; z-index: 10;`"; what is wrong: `order` is never pruned of the ids of floats that were removed; every float made (a new uuid each time Float, Return to Page or Alt-drag is used) and pressed adds an entry, so after seven distinct floats were pressed in one session the last pressed one gets `z-index: 11`. Item 5 and the file's own comment ("the drag layer is above every float") require the drag layer above every float; failure scenario: float and return a pane seven times, then press the newest float and Alt-drag a tab over it: the drag ghost and the float outline (z-index 10) are drawn under the float and the reader sees no outline; verdict: item 5 violated.
- 4.2 `L4-report.md:142`, `FloatLayer.svelte:117-155`: docking or freeing a float moves it between two `{#each}` blocks, so its views mount again (the report states this under "Limitations"). Item 5 asks only that a page switch never remount; stated here for the orchestrator since a Terminal tab in a float repaints its scrollback on Dock and Float. No verdict.

## Declined to judge

- The look and every pointer gesture (`interactjs` move and resize, the 24 px docking on release, the Alt-drag outline, the sash drag, the Alt key pressed or released with the pointer at rest): no DOM and no browser here; the report says the same.
- The report's first run on the unchanged tree (counts per file, built with stub modules): reproducing it needs a second checkout at 3a246eca and writing files, which this review may not do; I read the new tests and the old code instead (e.g. `closeInstance(tree, 's', keep)` has no fourth parameter on the base).
- Whether a tab dropped on the border zone of a float should be refused (item 7: "refuses edge drops") or taken as a centre drop, which `PaneBody.svelte:89` does: the store refuses every split (case 12 met); the pointer path needs the DOM.
- Whether the page-to-float strip drop (`transferInstance(id, path, index, floatId)`, `instances.ts:291-307`) behaves: read as correct (`carryToPage` writes through `writeHost`); no test drives it (a test would need a new file).
- `npm view interactjs` and the library's published facts: ruled by LA18, a network fetch.
- The ruling between fractions of the window and of the area (finding 1.1) and the choice for `FloatLayer`'s dock/free remount (4.2): the orchestrator's and Axel's, not a read's.

Reviewer usage: not reported by the runner to me; about 60 tool uses, about 55 minutes of wall time (two full `checks.sh` runs of about 11 minutes each).
