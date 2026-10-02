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

## Repair round 1, refuted

Step L4, worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/L4`, base 3a246eca. Paths are relative to `tools/oculus` unless stated. My scratch files are in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/l4r1/`. The worktree is unchanged by me: `git diff 3a246eca | shasum` printed `aabd88bf...` and `git status --short | shasum` printed `78d6a7a2...` before and after every command.

### Verification (rerun by me)

The list is NOT a pass. `checks.sh` stopped at its first command with 5 timeouts of 5000 ms. The other six commands passed when run one by one.

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams
> node utils/diagrams/diagrams.mjs      (EXIT 0; the diff and status checksums above were identical before and after)

$ sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md      (output in l4r1/checks1.out; the machine load average was 18 to 23 throughout)
$ npm test
 FAIL  |unit| tests/server/edit/config-key.test.ts > a value the option does not take > refuses what is not a finite number for a number option
 FAIL  |unit| tests/server/edit/config-key.test.ts > a file that does not hold the key > refuses a key that is absent, empty, null, an alias, anchored, tagged or a block scalar
 FAIL  |unit| tests/server/git/autofetch.test.ts > a real fetch through the module > moves origin/main and prunes a branch deleted on the remote
 FAIL  |unit| tests/server/git/autofetch.test.ts > a real fetch through the module > fetches a clone whose path holds a space
 FAIL  |unit| tests/server/git/autofetch.test.ts > the environment of an unattended fetch > appends BatchMode to the repository command and asks for no password
 (each: Error: Test timed out in 5000ms.)
 Test Files  2 failed | 422 passed | 22 skipped (446)
      Tests  5 failed | 11158 passed | 618 skipped (11781)
   Duration  443.24s
checks: failed with exit 1: npm test
```

The two failing files rerun alone (neither is in the step's diff, and `git diff 3a246eca --stat -- tests/server` printed nothing):

```
$ npx vitest run tests/server/edit/config-key.test.ts --reporter=dot      Test Files  1 passed (1)   Tests  35 passed (35)
$ npx vitest run tests/server/git/autofetch.test.ts --reporter=dot        Test Files  1 passed (1)   Tests  44 passed (44)
```

A combined rerun of both files timed out again on two autofetch cases (load). Each file alone passes, so I name this as a load timeout. It is not counted as a pass of the list.

The remaining six commands, one by one:

```
$ npm run test:checks      Test Files  29 passed | 2 skipped (31)    Tests  442 passed | 9 skipped (451)
$ npm run check            1790908644866 COMPLETED 2960 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build            exit 0; "built in 19.95s", "built in 45.63s", "done"
$ npm run format:check     All matched files use Prettier code style!
$ npm run lint             exit 0, no output
$ ! LC_ALL=C grep -rna '[^ -~]' src tests      exit 0, no output
```

Also run:
- The spec's ASCII perl gate over `src tests config` (`bin` does not exist): no output.
- `sh utils/folder-check.sh` and `sh utils/size-check.sh`: no output, exit 0 each.

The builder's pass line, `checks: 7 commands passed`, was not seen in any of its seven round runs or in mine. The orchestrator's landing run on a quieter machine is the run that can print it.

### Evidence reruns (taken out on a scratch copy `l4r1/copy`, with `node_modules` symlinked; the worktree was never edited)

Every claim of the round's table reproduces:

| Claim | My run | Result |
|---|---|---|
| Case 29 `File.svelte` clause (ruling 3): the keep rule replaced by `() => null` in `layout.svelte.ts` | `kept-panes.test.ts -t "file tab closes itself"` | `AssertionError: expected [ [ 'f' ] ] to deeply equal [ [ 'f' ], [] ]`, `Tests 1 failed \| 21 skipped (22)`. With the rule back, `floatlayer`/store files pass. This is a store-level test, since `File.svelte:148` only calls the store's `closeInstance`. |
| `stackOf` returns `order` as it is, `raised` unfiltered, `dragDepth` returns 10 | `float-geometry.test.ts` | the 5 named cases fail, `Tests 5 failed \| 21 passed (26)` |
| `dragDepth` alone returns 10 | `float-geometry.test.ts` | `puts the drag layer above the front of 7 free floats` and `... 20 free floats` fail, `Tests 2 failed \| 24 passed (26)`. The 1-float case passes with the old constant, as it should. |
| `FloatLayer.svelte` template replaced by separate `{#each}` blocks for docked and free floats (`class="dock {edge}"`, free pane outside a `.fill`) | `floatlayer.test.ts` | 3 failed, `Tests 3 failed \| 10 passed (13)` |
| `style="z-index: {depth}"` taken off the layer in `DropLayer.svelte` | `floatlayer.test.ts` | `expected null to be 6`, `Tests 2 failed \| 11 passed (13)`. With it back: 13 passed. |

Other quoted greps:
- `grep -rn fitFloats src tests DESIGN.md HELP.md | wc -l` prints 0.
- `grep -n "0\.3\|0\.4" src/lib/shell/panes/floats/float-geometry.ts` prints nothing.
- `START_W` and `START_H` are exported at `layout/open/floats.ts:28-29` and `layout/index.ts` and used at `float-geometry.ts:149-150`.
- `serialiseFloatless` is at `saved.ts:444`, `needsFloats` at `saved.ts:456`, `pendingFloats` at `layout.svelte.ts:255`, `FLOATLESS_VERSION` at `model.ts:127`.

Not reproduced: the builder's round 1 to 7 individual full-list runs, and the first-run counts of the first report. I did not rerun them.

### Verdicts, whole diff since the base

Items of "What to build":
- 1: holds.
- 2: holds.
- 3: holds.
- 4: holds. The version-4 envelope mechanism is now named at `DESIGN.md:370` and in the round (ruling 2), and I read the flag as per store instance: `let pendingFloats` is inside the store factory at `layout.svelte.ts:255`.
- 5: holds. The first round's two violations are closed: the window reading as ruled, and the drag layer's depth (see "Evidence reruns"). Behaviour finding 4.1 below concerns the stacking of a new float.
- 6: holds, read against Z184 (5), as in the first review.
- 7: holds.
- 8: holds. Kept rule, `landing.ts` order, and the `*.keeps` pane text are unchanged by the round, and the 22 kept-panes cases pass in the `npm test` run.
- 9: holds. `DESIGN.md:212` and `HELP.md:40` carry the fractions-of-the-window reading and no longer mention a resize fit.

Cases:
- 1 to 10: met.
- 11 (`fitFloats`): not applicable by ruling 6. The property it guarded, a float never leaves the window, holds by construction: `floatStyle` writes `vw`/`vh` fractions, and every writer of a place goes through `placeFits` (parse `saved.ts`, `placeFloat`, `parseFloats`) or clamps (`floatTab`, `centred`). I read this; no automated check names it beyond the `placeFloat` cases.
- 12 to 20: met.
- 21: met for the strip, the pane and the border markup (`floatlayer.test.ts:108`). Two clauses are met by my reading only. `<FloatLayer>` is at `Workbench.svelte:323`, after `{/key}` at line 319 and outside the keyed block. `--float-border: var(--c-orange)` is declared at `tokens.css:215`. No test covers either, as ruling 5 intends; both depend on the landing's look.
- 22 to 31: met.
- 32: not applicable by ruling 6 (no listener, no function), reason as for case 11.
- 33 to 36: met.
- 37: met, except the 5 load timeouts named above.

### 1. Spec

1.1 `agents/reviews/L4-report.md:133-137` ("Anything wrong in the brief") does not hold the item 5 versus item 1 contradiction that ruling 1 told the report to name there. It is named only in the round section (`:159`). The round section says it supersedes the first report, but these sentences remain and are false at the end state:
- `:44` (DONE row 5): "kept inside the window on resize", with counts "floatlayer.test.ts 11 / 11; float-geometry.test.ts 18 / 18". The files now hold 13 and 26 cases, and there is no resize behaviour.
- `:119`: "docked or freed, its views remount once".
- `:142`: "A float docked or freed remounts its views once, because it moves between two places in the markup."
- `:130` (Judgment call 6): "`File.svelte` and `Doc.svelte` needed no change". The round (`:174`) corrects it for `Doc.svelte`.

Failure scenario: the orchestrator reads the top of the report, books the remount limitation or the resize fit as live, or lands believing `Doc.svelte` is untouched. Verdict: rulings 1 and 4 done in the round section, not in the places the rulings name.

1.2 Ruling 4's list omits `tests/shell/keys/workbench-keys.test.ts` (changed, outside the brief's test path list; it serves case 33). Minor; the first report's changed-tests table may cover it. Not verified.

### 2. Proof

2.1 `tests/shell/panes/floatlayer.test.ts:166-194`: "draws a docked and a free float as one element with the pane in one fill" and its two siblings. They are claimed to fail without ruling 11's fix, and they do (my rerun above). What they assert is markup shape: the class string `float dock right`, `float free`, `class="fill"` before `data-pane-page`. A template with two separate `{#each}` blocks that emits the same class strings and the same `.fill` would pass all three while remounting `PaneView` on Dock and Float. They prove the template shape, not "no remount". The round states this plainly ("not verified by a test", `L4-report.md:189`), so the claim is not overstated. Failure scenario: a later edit splits the each-block again while keeping the class strings, and the suite stays green. Verdict: none against the round; the guard is the look on Dock and Float of a Terminal tab.

2.2 No test of the removed source-text assertions remains (ruling 5). I judge the removal correct, not a check dropped to close a finding. The three asserted facts (FloatLayer outside the key, `--float-border` on `body`, a resize listener) were source scans; `spec.md` says such an assertion "proves nothing and is reported as an audit". The `still draws both floats after a switch` test renders fresh each call and could not detect a mount inside the key either. I read the first two facts true (see case 21); the third no longer exists.

2.3 Removal of `fitFloats` and `fitted` (ruling 6) is not a guard removed in place of a fix. `grep` shows no caller left. `placeFits` stays and is covered through `placeFloat` (`floats.test.ts:259` `it.each`, `:273`) and the dropped-float cases of `layout-floats.test.ts`. The removed store test (`floats-store.test.ts:483-501`) gave a float that already fit and asserted nothing moved, so it could not fail on a missing fit.

### 3. Standards

None. Checked: ASCII gate, folder and size checks, `npm run format:check`, `lint`, and the `comment-width` check inside `test:checks` all pass. `float-geometry.ts`, `FloatLayer.svelte`, `float-gesture.ts` and `floats.ts` open with a layer comment, and none carries history (`grep` for package ids and "previously/used to" hit only "no longer exists" in two non-history sentences). `Hpc.svelte:2-3` and `Usage.svelte:2-3` are now true (`grep -rniE "live hpc|focus.*(hpc|usage)"` shows no other stale statement).

The `Usage.svelte` change beside ruling 7 is the same defect as the one ruling 7 names: a head comment the diff makes false by moving the pane out of the Focus group (the old text said "closes the Focus page's group"). It is not beyond the ruling. The round discloses it.

### 4. Behaviour

4.1 `src/lib/shell/panes/floats/float-geometry.ts:167-172` (`stackOf`) and `FloatLayer.svelte:66,71`: "`return [...free.filter((id) => !known.has(id)), ...kept];`" and "`z-index: ${depthOf(stack, float.id)}`". A free float that `order` has not met is placed behind every float that has been pressed. I ran, on the scratch copy:

```
stackOf(raised([], ['A'], 'A'), ['A', 'N'])  ->  ["N","A"]   depthOf: A 6, N 5
```

Every float made by Float, Return-less floating, or Alt-drag starts at the same centred 0.3 by 0.4 (`centred()` / `floatTab` at the pointer). Failure scenario: free float A is pressed once. The reader then uses Float on a page pane. The new float N is drawn at z 5 under A at z 6 in the same place and size, so Float appears to do nothing until A is moved or N is pressed. Before ruling 10, a new float had `indexOf` -1 clamped to 0, the same z as a float pressed first, and sat above it by DOM order. Ruling 10(a) changed this for the one-pressed-float case. The round's "Before and after" does not state it. Verdict: item 5, a visible behaviour change of the round not reported. The fix is one rule in `stackOf`/`raised`: a float the order has not met goes on top, or `FloatLayer` calls `raise(id)` when a float first appears.

4.2 Ruling 11, read (no run, no DOM here), answers the three questions:
- Remount: `FloatLayer.svelte:122-147` is one `{#each floats() as float (float.id)}`. Dock/Float/edge changes go through `replacing` (`floats.ts:84-89`), which keeps the id and the array position, so the key block persists. The `{#if place.kind === 'dock'}` Sash sits before `.fill` and its toggle does not touch `.fill` or `PaneView`. `dockFloat` onto a taken edge removes the moved float and merges its tabs into the holder, which remounts the moved views by design (they change pane).
- Gesture: `{@attach place.kind === 'free' ? gesture(...) : null}` (`:133`). Svelte 5.57.1's `attach` (`node_modules/svelte/src/internal/client/dom/elements/attachments.js`) destroys the previous branch when the getter returns a different value, so `target.unset()` runs when the float docks, and a new attachment is set up when it is freed. The getter reads `float` and `place`, so it also re-attaches whenever the float object is replaced (a tab opened in it, an active-tab change) and after each gesture's `placeFloat`. If the float object were replaced while a drag is running, `unset()` would end the gesture without `finish()` and `draft` would stay set until the next gesture. I found nothing that replaces a float object mid-gesture, but I did not run it. Not verified.
- Stacking: `depthOf` = `BASE_DEPTH + rank`, `dragDepth(count)` = `BASE_DEPTH + count`, and `DropLayer.svelte:39-40,73` counts the free floats from the same store list as `FloatLayer`'s `free`. For 1, 7 and 20 floats the front float is 5, 11 and 24, and the drag layer is 6, 12 and 25. This is consistent, and tested at `float-geometry.test.ts:204`. With no free floats the layer is now 5 instead of 10. Every other `z-index` in `src` that sits between 5 and 10 is none (nearest are 1, 2, 40, 55 and up), so no layer changes order.

### Declined to judge

- The look and every pointer gesture, including whether Dock and Float keep a Terminal tab's scrollback: no DOM or browser here. Ruling 11 is read from the template and Svelte's `attach` source, not run.
- Whether a free float over the rail and status bar (fixed, viewport units) looks acceptable: the look.
- The builder's seven full-list runs and the first report's first-run counts: not rerun.
- The Z95 (2) edge-drop question and `transferInstance` into a float: unchanged by the round and left as in the first review.

### Usage

About 65 tool uses by me, including one full `checks.sh` (443 s), `test:checks` (128 s) and a build. Token count is not reported to me; I would put it at 200,000 to 250,000 across the reads, the reruns and the scratch probes.

## Closed

Run over round 1 (never sent to the builder; each closed at landing):
- Spec 1.1, sentences of the first report false at the end state (`L4-report.md:44`, `:119`, `:130`, `:142`): the report's "Repair round 1" section supersedes them, and the booking and the landing report state the end state from it: no resize fit, `floatlayer.test.ts` 13 and `float-geometry.test.ts` 26 cases, Dock and Float keep one element, `Doc.svelte` changed.
- Spec 1.2, `tests/shell/keys/workbench-keys.test.ts` outside the brief's test list: the first report names it (`L4-report.md:27` and `:103`, the two float key cases of case 33); no change.
- Proof 2.1, 2.2, 2.3: none against the round; the look on Dock and Float of a Terminal tab stands for 2.1.
- Behaviour 4.1, a new free float drawn under a float already pressed: fixed at landing on main. `stackOf` puts the free floats `order` has not met in front of the pressed ones, so a float just made is on top; the `float-geometry.test.ts` cases that fix the old order are rewritten and a case for a float made after a press is added, each quoted red against the old `stackOf`.
- Behaviour 4.2, the gesture attachment re-made when a float object is replaced: nothing replaces a float object while a drag runs (the reviewer's read); no change.

Found at landing, in the look on TEST, and fixed on main inside items 4 and 5:
- A shipped float took in only the first page's tab of each view it holds: with the TEST page listed before Focus, Focus kept its own Live HPC tab beside the float. `adoptFloats` (`state/workbench/layout/open/floats.ts`) now takes every tab of the view out of the pages, the first one into the float; a case in `tests/state/workbench/layout/open/floats.test.ts` was red without it (`expected [ 'h2', 'k' ] to deeply equal [ 'k' ]`).
- A Monaco diff in a page pane (`diffViewport` at z-index 10, `diffOverview` at 9) drew over a free float at z-index 5, since the round lowered the floats' base depth from 10 to 5. `.area` in `shell/Workbench.svelte` takes `isolation: isolate`, so nothing inside the page stacks above a float; a probe at z-index 999 inside the page was under the float with the rule and over it without.
