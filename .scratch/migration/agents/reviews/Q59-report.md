# Q59 report

Everything in the brief is done, and every finding of the review is closed in the tree.

## Open items, verbatim from the state file

Nothing is waiting on a ruling.

Booked list: four entries in the state file (`sed -n 104,110p ../../orchestrator-state.md | grep -c '^- '` gives 4). Two of them are this step: the audits scan's three holes (item F) and the sixteen revert lines (item J). The other two are the three landings that name no TEST-page look (Q30, Q45, D22) and the line "the steps a review booked rather than a brief", which this step closes and whose entry is ticked at its landing.

## What the tree said about the brief's premises

Nine of the findings the brief carried no longer stood. Each was re-read on the worktree before the step began, with the command in the brief, and nothing was built for them: the literal glyph name and the literal word in two state modules, the bookmarks and notes error branches hiding their add control, the history in the two card comments, the `words` scan beyond `lib/server/pty/`, `ui.tab_unsaved` against HELP.md, the Changes panel's `reading` branch, a draft for a vanished entry, the two readers' file defaults (every caller passes the file, and the spec forbids a hardcoded default beside a config key), and the package ids in DESIGN.md. Two of the nine carried a line-number drift, which the brief now names as the tree has it: the `words` fixture is written at `tests/checks/source/keys.test.ts:397`, and `repoShape` answers `reading` at `src/lib/views/shared/changes/repo-shape.ts:26`.

## DONE, one row per item of the brief

| Item | What it is now | The command that proves it |
| --- | --- | --- |
| A1 comment width | Every comment line of `src`, `tests` and `bin` ends by the hundredth column, and `tests/checks/source/comment-width.test.ts` fails on a new one; the rewrap and the fixes together touch 539 files under those three folders (`git diff bdc6aad1 --name-only -- src tests bin | wc -l`). Its head comment names each exempted marker: a `revert:` directive, an `eslint-disable` or `eslint-enable`, a `prettier-ignore`, a `svelte-ignore`, a `@ts-expect-error` | `npx vitest run tests/checks/source/comment-width.test.ts` 2 passed; `node bin/revert-check.mjs tests/checks/source/comment-width.test.ts` 2 reverts, 0 unproven |
| A2 tree and badge measures | `--tree-row`, `--tree-font`, `--tree-indent`, `--tree-heading-font`, `--tab-badge-min`, `--tab-badge-pad` and `--tab-badge-line` are tokens of `themes/tokens.css`; the row multiplies each by the text scale where it is drawn | `npx playwright test tests/browser/sources/files.spec.ts` (the 22-pixel row case) |
| A3 glyph catalog | The orphan comment is gone; `sent`, `x_mark`, and the two stand-ins for characters no name holds are gone. The reader scan takes the four shapes the source names a glyph in, not every quoted word: a prop or field whose own name carries `glyph` or `icon`, the `name` of a `<Glyph>`, a `glyph()` call, and a config value or a `{G.name}` placeholder | `node bin/revert-check.mjs tests/checks/config/config-folder.test.ts` 2 reverts, 0 unproven |
| A4 cleanup outside a finally | `keepServedFiles()` puts the served run's bookmarks file, workspaces file and notes back after every case, passed or failed, and sweeps the spec's scratch roots; the in-body cleanups are gone; the six specs that write any of them call it, `files-sections.spec.ts` included | `node bin/revert-check.mjs tests/browser/sources/files-forms.spec.ts` (the halfway-stop pair) |
| A5 the orientation cap | `SEGMENTS` is exported and said in the module's head comment; a node case per walk sits at the cap's boundary | `node bin/revert-check.mjs tests/server/content/images.test.ts` 4 reverts, 0 unproven |
| A6 the unborn branch | The Branches head comment says what the code does, and a browser case creates a branch on a repository with no commit yet | `node bin/revert-check.mjs tests/browser/sources/repositories.spec.ts` |
| A7 test scratch | `bin/revert-check.mjs` runs each case with its temporary directory inside the copy, removes the copy on a signal, and names a revert that leaves a script unparsable rather than calling it red | `node bin/revert-check.mjs tests/checks/bin/revert-check.test.ts` 17 reverts, 0 unproven |
| A8 the served run's layout | `runLayout` in `tests/browser/helpers/hub.ts` names the hub, engine and home folders once; `serve.ts` makes them by it and `changes.spec.ts` reads the home through `servedHomeDir()` | `npx playwright test tests/browser/views/changes.spec.ts` |
| B1 the sash reach | Measured at 1, 1.25, 1.5, 2 and 3 device pixels a CSS pixel, and the committed case walks all five; the reach is `--sash-reach` after the handle and the sliver `--sash-reach-start` before it, so no pane's device pixel catches the handle at any ratio | `node bin/revert-check.mjs tests/browser/workbench/tabs.spec.ts` (the every-device-pixel case) |
| C1 an unknown lane tone | `namedTone` answers the unknown tone for a hue the palette does not hold; `Band.svelte` resolves the three column tones once, for the column and its header | `node bin/revert-check.mjs tests/views/boards/focus.test.ts` |
| C2 a replaced picture | A new answer of the folder drops what the wall knew of a picture that failed and asks for it again at `&again=<n>` on the same address | `node bin/revert-check.mjs tests/browser/views/memories.spec.ts` 2 reverts, 0 unproven |
| C3 the map's label boxes | The measure effect reads the text scale, a browser case reads that no two drawn labels overlap after the text grows, and a named audit holds the effect's read | `npx vitest run tests/views/structure/map.test.ts` 19 passed; `node bin/revert-check.mjs tests/browser/views/map.spec.ts` |
| C4 the card hover reach | `ui/frame/Card.svelte` sets `--card-reveal` on every card, so a card inside another answers for itself; `CardActions` reads it and styles no primitive class | `node bin/revert-check.mjs tests/browser/boards/cards.spec.ts` |
| C5 the entry card's long title | A browser case writes a task with an unbroken title and reads the card's box | same run, the collection-entry case |
| C6 the Files view's lines | `note` and `said` are `FilesView` state, written into the instance the request went from; both come back with the form after a tab switch | `node bin/revert-check.mjs tests/browser/sources/files-forms.spec.ts` (two cases) |
| D1 the per-keystroke write | Measured, and nothing changed: see the measurement below | the probe quoted below |
| D2 two add forms of one key | No view draws two, and `tests/checks/source/add-forms.test.ts` reads every component of `views/` and `shell/` and fails the day one does. Nothing throws at runtime for it | `node bin/revert-check.mjs tests/checks/source/add-forms.test.ts` 2 reverts, 0 unproven |
| D3 the unsaved walk | `layout.instanceView(id)` answers from the store's own lookup and `registerUnsaved` reads it | `node bin/revert-check.mjs tests/state/workbench/layout/nested.test.ts` |
| D4 the `{#key}` | It earns its place: keyed by the instance alone, the case that opens an edit form from the add form is red | `node bin/revert-check.mjs tests/browser/sources/files-forms.spec.ts` |
| E1 one helper | `stripRest` in `tests/browser/helpers/style.ts`; the two copies are gone | `npx playwright test tests/browser/workbench/pages.spec.ts tests/browser/shell/shell-defects.spec.ts` 30 passed |
| E2 the token comment | Each of the four is cited where VS Code writes it | the four files fetched from `github.com/microsoft/vscode`, quoted below |
| E3 the unmount-while-open path | A browser case closes the tab while the press is out: nothing is drawn and nothing is thrown. An audit: no revert turns it red | `npx playwright test tests/browser/sources/open-file.spec.ts` |
| E4 the fail-closed catches | Four are pinned, including `allowed`'s per-root catch; two are named as audits below | `node bin/revert-check.mjs tests/routes/files/open-program.test.ts` 4 reverts, 0 unproven |
| E5 the tree row's four | The row width, the description and the hoverless controls are fixed and proven; the row's own space answers a press and opens the row's words, so the line acts as the name does; the bordered picker is kept, with the reason below | `node bin/revert-check.mjs tests/browser/shell/views.spec.ts` 3 reverts, 0 unproven; `tests/browser/sources/files.spec.ts` 4 reverts, 0 unproven |
| E6 the focus after Show in Files | The revealed row takes the keyboard, and the arrow keys go on from it | `node bin/revert-check.mjs tests/browser/sources/show-in-files.spec.ts` |
| E7 the terminal stand-in | A case under a rice theme reads `[@]` on the control, once | same run |
| F the audits scan | The scan reads code with strings and comments blanked, counts a name only where the file binds it outside every case, and reads a comment's brackets as none; a case per shape, and a case holding the floor to the cases the scan still finds | `node bin/revert-check.mjs tests/checks/tree/audits.test.ts` 11 reverts, 0 unproven |
| G a write with no answer | A write is given up after `writes.timeout_seconds` of `config/behavior.yml` (30), the request aborted, and the answer carries `app.write_timed_out` from the catalog, which every reader of `answer.error` draws and the entry form wraps in `editor.failed`, with Save pressable again | `node bin/revert-check.mjs tests/state/client/writes.test.ts` 4 reverts, 0 unproven, 0 unchecked; `npx playwright test tests/browser/workbench/unsaved-forms.spec.ts` |
| H the project tab's tags | The tab draws the card's tag for a known document the project has not got, once | `node bin/revert-check.mjs tests/views/boards/project.test.ts` |
| I the type-scale guard | `src/lib/ui` has the completeness guard `src/lib/views` had, with the twenty entries the tree needs | `node bin/revert-check.mjs tests/views/whole/type-scale.test.ts` |
| J the sixteen revert lines | Every directive of the tree names the line its prose names and reddens its own case; `revert-check` reads a directive above a case's prose as that case's | `node bin/revert-check.mjs` over the 49 test files that carry a directive: 218 reverts, 0 unproven |

## The measurements

**D1, the per-keystroke storage write.** Twenty characters typed into the Tasks add form on the served build made twenty writes of `oculus.ui.v1`, the record 374 bytes, each write under 0.1 ms (`performance.now()` around `Storage.prototype.setItem` in a page init script), 0.2 ms in total. Nothing was changed for it, and the probe spec is not kept: the spec folder is the orchestrator's and the numbers are what the measurement is for.

**B1, the sash reach.** With the pointer moved to each device pixel column across the handle, at ratios 1, 1.25, 1.5, 2 and 3, the handle was caught on every column of the two 1px borders and on no column of either pane body. The earlier reading that a body column caught it came from the hit test: a pointer is tested as the whole CSS pixel that starts at it, so a full pixel of reach before the handle takes the last device-pixel column of the pane before it, whatever the ratio. `--sash-reach-start` is 0.1px for that reason.

**E2, the four tab measures against VS Code.** `multieditortabscontrol.css`: `.tab { padding-left: 10px }`, `.tab-actions { width: 28px }`, the close control `font-size: 16px; padding: 2px; width: 16px` (20 in all). `editorTabsControl.ts`: `EDITOR_TAB_HEIGHT.normal = 35`. `iconlabel.css`: `padding-right: 6px` after the icon.

## The choices the brief left open

- **E5, the repository picker.** Kept as a bordered `Menu` opener: it is the same opener every toolbar draws, and a picker that looks unlike every other menu in the tree would be the odd one.
- **E4, two catches left as audits.** `fileOrFolder`'s and `openTarget`'s `statSync` answer false only when a path that has just been resolved stops being readable between two calls; no fixture reaches them. They are named here rather than pinned by a case that cannot fail. `allowed`'s per-root `realpathSync` is no longer among them: a root whose folder is gone is reachable, and a case now hands the endpoint such a root before a real one.
- **C3, the map's dependency.** The effect reads the text scale, and no revert of that read alone reddens the browser case: the pane's saved state is rewritten when the text scale changes, so the graph is derived again and the labels are measured through that. The read is held instead by a named audit over the source, `tests/views/structure/map.test.ts`, which says in its own name that it audits.
- **D2, the one-add-form rule.** It is a check over the source, not a runtime error: `tests/checks/source/add-forms.test.ts` reads the `<EntryForm` props of every component under `src/lib/views` and `src/lib/shell` and fails when one view draws two forms with no entry.

## The floor of the audits scan

`tests/checks/tree/allow-audits.txt` is unchanged: regenerated from the tree under the new rule it holds the same 150 entries, none leaving and none joining. What changed instead is the tree's own naming: 31 cases that draw nothing were renamed to open with "audits that", which the scan reads as a case that says what it is, so none of them needed an entry (`git diff bdc6aad1 -- tests | grep -c "^+.*audits that"` gives 32, the thirty-second being the new audit over the map's label measuring; nothing is removed, the same command over `^-` gives 0). The floor is now held to that by a case of its own, `holds the allow list to the cases the scan still finds`, so an entry whose case starts rendering fails the check rather than sitting on the list.

## The before and after of every visible change

- **A tree row's controls.** Before: the name button filled the row, so a row's controls and count sat at the pane's far edge, a whole pane's width from the name in a wide pane. After: the name takes the width it needs, the controls and the count follow it, and the row still spans the pane for its hover and its selection.
- **What the row's own space answers.** The button no longer covers the line, so three things the button gave the whole row are given by the row itself. A press on the space beyond the row's parts opens the row, through the row's own handler. The row's words open while the pointer is anywhere over the row, through `Tooltip`'s new `over` prop, which takes the element whose hover opens the bubble while the bubble stays laid out under the name. A double press on that space reaches no `ondblclick` and is two presses on the row instead; the tab it opens is kept either way, since the second press on a row already keeps its tab (`tests/browser/sources/files.spec.ts`, "the second click on the same row keeps the tab"). A double press on the name is unchanged.
- **A write that outlasts its timeout.** Before: the request was never given up and the form's Save stayed disabled until Cancel or a reload. After, at 30 seconds: the request is aborted and every surface that writes draws the catalog sentence `app.write_timed_out` ("no answer came in time, so the write was given up and may not have landed"), the entry form wrapping it in `editor.failed` as it wraps every other refusal. This is one path for every write: a git commit, a bookmark star, a root add, a memory upload and the rest all go through `send`.
- **A picture that failed on the Memories wall.** Before: the tile kept its failed mark and the browser answered a re-read from its cache. After: a new answer of the folder drops the mark and the tile asks for the file at `/api/memories?file=<name>&again=<n>`, which the server ignores and the browser reads as another picture. DESIGN.md's Memories line says so.
- **The sash's reach before a handle.** Before: `1px`, so a pointer on the last device-pixel column of the pane before the handle caught the handle. After: `--sash-reach-start`, `0.1px`, so that column belongs to the pane; the reach after the handle is unchanged.
- **The project tab's document tags.** Before: the tab drew nothing for a known document a project has not got. After: it draws the muted tag the project card draws, as Axel ruled.
- **A tree row's tooltip.** Before: the tooltip sat inside the button and described nothing to a screen reader on a row of a tree. After: it describes the element that takes the focus, the row in a tree and the button outside one.
- **Row controls on a touch screen.** Before: hidden until hover, so unreachable without a pointer. After: drawn where the display has no hover.

## What else the step found and fixed

- **A directive above a case's prose belonged to the case before it.** `revert-check` read a directive as the next case's only when it sat on the line directly above; with the prose revert between, it fell back to the case above. Eight directives of `form-drafts.test.ts` and others named lines that proved nothing under that rule. The rule now skips comment lines between a directive and its case, and a case proves it.
- **Directives naming the wrong line.** Fifteen directives named a line whose content was not what their prose described, so they were red or unproven for the wrong reason: two in `revert-check.test.ts` (one replaced a function header, which made the file unparsable), two in `writes-collection.test.ts`, one each in `leads.test.ts` and `radar.test.ts` (both meant `views/shared/forms/posting.ts`), and the rest in `unsaved-forms.spec.ts`. Each now names the line its prose names.
- **A scratch sweep registered at a helper's top covered the first spec alone.** A Playwright worker loads a module once for every spec it runs, so `test.afterAll(sweepScratch)` at the top of `tests/browser/helpers/files.ts` was the first spec's hook alone; a later spec whose case failed left its scratch roots when the worker was replaced. Measured: with the hook at the module top, a run of the two files specs with one case failing left 17 folders; with the hook registered by `keepServedFiles()`, the same run left none.
- **The scratch scan read a call inside a string.** `codeOnly` of `scratch.test.ts` now reads code through `tests/checks/source/code.ts`, the scanner the audits scan uses.
- **One answer wording written three times.** `EntryForm`, `LeadCard` and `PostCard` each held the same eight lines turning a write's answer into a line for the reader. They now call `answerWords` of `src/lib/views/shared/forms/answer-words.ts`, and the three entries that held the copies in `tests/checks/tree/allow-duplication.txt` are gone with them.
- **A flag nothing read.** The write answer carried `timedOut`, which no view read once the words came from the catalog. It is gone; the words in `error` are what a reader sees and what the state test asserts.
- **The negatives check reads a comment block.** The rewrap turned single-line reasons into blocks, so `explains` now joins the whole comment above an assertion before applying the four-word rule instead of reading its last line alone. The allow list did not grow for it: `tests/checks/tree/allow-negatives.ts` lost entries and gained none.
- **History in a comment.** `views/shared/forms/posting.ts` said what the cards "drew before"; the clause is gone.
- **Three sentences of DESIGN.md and one of HELP.md were made false** by the fixes, and one (the Memories tile's 4:3 box) was already false. All are corrected.

## What the duplication allow list did

`tests/checks/tree/allow-duplication.txt` went from 735 entries to 732 (`git show bdc6aad1:tools/oculus/tests/checks/tree/allow-duplication.txt` against the file). Three left because the copy they held is folded into `answerWords`: `LeadCard`/`PostCard`, `LeadCard`/`EntryForm` and `PostCard`/`EntryForm`. Of the 49 entries that joined, 47 are the same copies the base held with `tests/views/boards/focus.test.ts` renamed to `tests/views/boards/focus-fixture.ts`, which is where the fixture moved; one is `calendar/Head.svelte` with `inbox/Head.svelte`, the pair the base already held, re-hashed after the rewrap; and one, `tests/state/boards/focus.test.ts` with the fixture, is the same fixture-building lines matching over a different eight-line window once the fixture became its own file. No copy written in this step is on the list.

## The two reviews' findings, each closed in the tree

The reviewers' reports are both in `agents/reviews/Q59-refuter.md`, the second run under its own heading.

The run over the repair round found four more in Proof, three in Standards and one in Behaviour, and all eight are closed here. Its Proof 1, three cases of `tests/state/client/writes.test.ts` proven by nothing: each now names a revert and the file reports 4 reverts, 0 unproven, 0 unchecked. Its Proof 2, the report's insertion counts one too high: recomputed above. Its Proof 3, the booked list counted as two: four, named above. Its Proof 4, the duplication list's churn unstated: the section above. Its Standards 1, the head comment of `TreeItem.svelte` made false by the same file's change: rewritten to what the file does. Its Standards 2 and Behaviour 1, the double press and the tooltip narrowing to the name with the button: the tooltip opens over the whole row again, through `Tooltip`'s `over`, and the double press is stated above with its before and after. Its Standards 3, `code.ts` exporting a name nothing reads and holding one body twice: `kinds` and `fileKinds` are internal, `code(text)` is `fileCode('one.ts', text)`, and the file exports `Kind`, `fileCode`, `code` and `commentLines`.

The first run's findings: Spec 1, the row width kept against the brief: fixed, with the case and the revert in the table's E5 row. Spec 2, the floor: the section above. Spec 3, the glyph reader scan: tightened to the four named shapes, and `rail-badges.svelte.ts` names its overdue glyph in a constant rather than in a bare ternary. Spec 4, the runtime throw: the claim mechanism is gone from `form-drafts.svelte.ts` and `EntryForm.svelte`, and the rule is the source check. Spec 5, the two reorganisations: `tests/views/boards/focus-fixture.ts` and the two note cases moved into `files-sections.spec.ts` because `bin/size-check.sh` holds a file to 900 lines and the rewrap put `focus.test.ts` and `files.spec.ts` over it. Spec 6, A1's exceptions: each marker is named in the check's head comment. Spec 7, the `&again=` key: named in DESIGN.md's Memories line and in the before and after above. Proof 1, C3: the audit above. Proof 2, the whole-tree run: in the verification block. Proof 3, B1: the case walks all five ratios and carries its revert. Proof 4, the seventh catch: pinned. Proof 5, the negatives predicate: stated above. Proof 6, the notes left by a case that stops halfway: `keepServedFiles()` puts the notes back too and `files-sections.spec.ts` calls it. Standards 1, the fixture's head comment: it names `focus.test.ts` alone, which is what imports it. Standards 2 and 3, the literal and the clashing name: `TIMED_OUT` is gone from `state/client/writes.svelte.ts`, the words come from `app.write_timed_out`, and `server/files/search.ts` keeps its own name. Standards 4, the probe spec under `.scratch/`: deleted; its numbers are in the measurement above. Behaviour 1 to 4: each is a before and after above.

## Files changed

545 tracked files, 6,466 insertions and 4,207 deletions (`git diff bdc6aad1 --numstat`): 339 under `src` (3,438 and 2,198), 195 under `tests` (2,915 and 1,941), 4 under `config` (10 and 15), 5 under `bin` (94 and 44), `DESIGN.md` (8 and 8) and `HELP.md` (1 and 1). Most of the count is the comment rewrap. Six new files: `src/lib/views/shared/forms/answer-words.ts`, `tests/checks/source/code.ts`, `tests/checks/source/comment-width.test.ts`, `tests/checks/source/add-forms.test.ts`, `tests/state/client/writes.test.ts`, `tests/views/boards/focus-fixture.ts`.

## Verify, on the worktree

```
npx vitest run --reporter=dot          Test Files 274 passed (274); Tests 4451 passed (4451)
npm run check                          COMPLETED 1284 FILES 0 ERRORS 0 WARNINGS
npm run build                          exit 0
npm run format:check                   All matched files use Prettier code style!
npm run lint                           exit 0
the ASCII gate (the brief's perl)      prints nothing, exit 0
python3 yaml.safe_load over config/    58 files parse
sh bin/size-check.sh                   exit 0
sh bin/folder-check.sh                 exit 0
npx playwright test                    291 passed (8.5m)
ls -d $TMPDIR/oculus-* | wc -l         7022 before and after the node run and the browser run
node bin/revert-check.mjs (49 files)   218 reverts, 0 unproven, 652 unchecked, over the tree before
                                       this round's last fixes; the files those fixes moved were
                                       re-run one by one, each 0 unproven, and the whole-tree run
                                       is made again on main at the landing
```

## What the whole-tree revert run leaves open

`node bin/revert-check.mjs` over the 49 files that carry a directive answers 218 reverts, 0 unproven, 652 unchecked, and exits 1 for the unchecked. An unchecked case is one that carries no `// revert:` directive at all, spread over 37 of the 49 files; the tree has always had them and Q59 adds none. The repository's rule binds a new or changed test, which names its revert or says in its name that it audits; whether every case the tree already had should carry one is not this step's question.

## Doc text

Applied in this step, since no other step is in flight: DESIGN.md's config line (the glyph orphan checks), its live-data decision (the write timeout), its unsaved-input decision (`note` and `said`), its tree row line (the tokens and the description), its card line (`--card-reveal` and the project tab's tags), its Memories line (the tile box and the `&again=` key), its Show in Files line (the keyboard) and its tabs line (the two reaches); HELP.md's line on the views opened for something (the project tab's tags).
