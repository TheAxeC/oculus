# PR3 report

NOT DONE: nothing of repair round 1's eleven items; of the step, (1) G53's guarantee that the print window is never recorded in the window file has no test (Z674 (2) rules it so: `src/desktop/windows/print.ts` builds its own window and never goes through `windows.ts`); (2) cases 16, 18, 24 and 25 are looks at landing, and the desktop app was never started; (3) `tests/server/desktop/start.test.ts`'s `serversOf` rows are flaky and their diagnosis (Z674 (6)) is a separate dispatch, not an item of this round; (4) one defect found while checking item 5 is open and unfixed because the round says to change nothing else: a dropped image whose name holds a space is linked as `![my fig](<my fig.png>)`, which the deck reader's image pattern does not match, so the link is left relative to the page and the frame most likely does not draw it (read from the reader's output; not looked at in a page; details under "Repair round 1", item 5). The one full `npm run test:quick` run of this round (full-list runs: 1) printed "every command passed" at 45.2 s against the limit of 45.0 s.

## The state file's open items, verbatim

From `tools/oculus/.scratch/migration/orchestrator-state.md`, copied when this report was written:

## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

None.

## Repair round 1

The scratch copy of the worktree as it stood before the round is `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/pr3-before-round1/oculus` (made before the first edit, `node_modules` linked to the worktree's). Every failing run below was taken in it with the test file as it stands after the round; no code was removed or reverted in the worktree. In the quoted runs, vitest's long dash is written as `-` and its ellipsis as `\u2026`, so the file stays ASCII.

### Item 1, F1, tests no guarded entry names (Z674 (1))

- Deleted: `tests/views/academic/export.test.ts`, `tests/state/workbench/palette-source.client.test.ts`, and the describe 'the read of a file the route serves' with its `afterEach`, `vi` and `loadSource` imports in `tests/state/sessions/source.test.ts`, which is now the same file as on the unchanged tree (`cmp -s` against `PR3-base`: identical). The `effect` helper added to `tests/ui/frame/rooted.svelte.ts` for the deleted palette test is removed with it; that file is identical to the unchanged tree too (`cmp -s`). `tests/views/` holds `shared`, `sources`, `system` again. The code they tested stays.
- Kept: the G47 rows of `tests/server/desktop/window-guard.test.ts`. Lines for `agents/guarded.md` (G47's Test line, in the form of the file's other entries):

```
- G47 Test: `tests/server/desktop/window-guard.test.ts`, 'answers the bridge only from the top frame of the server's page' (its rows for the print window: the sender `print` is told from a top frame of `/present/print` on the server's own origin, a subframe or another origin is no sender, the `print` sender may call none of `SAVE_LAYOUT`, `FIND`, `OPEN_FLOAT_WINDOW`, `PRINT_PDF`, the page may call `PRINT_PDF` and the find bar may not), 'prints only the print route of its own server, named by a root and a path and nothing else'.
```

  I did not edit G47's line; it is the orchestrator's to book.
- G8 and G9's Test lines in `agents/guarded.md` name the two titles this round adds (below); `python3 titles.py G2 G8 G9 G32 G49` prints nothing (exit 0).

### Item 2, case 19, the two-file drop

Run through the act's code (`dropImage` in `src/lib/views/academic/present/acts/run.ts`, with `dropRefusal` of `state/life/present.ts`), in a throwaway test of the scratch copy (not kept, no new test), two PNG files dropped on the deck's own first slide, the write and the status line recorded:

```
two files dropped: said=["Drop one image at a time."] writes=0
```

The catalog's sentence is `present.drop_one: Drop one image at a time.` (`config/text/views/academic/present.yml:18`).

### Item 3, F3, the wire fields (Z674 (7)), no code change

The wire shapes in `src/lib/data/model/model-entities.ts`: `DeckSlideSource.entry` is the index of the `order:` entry that placed the slide, read by `slideActs` and `ownSlide` in `state/life/present.ts` to tell a file slide from a summary or grid entry; `DeckSlideSource.line` is the 1-based first line of the slide's place in its file, read by Edit Slide in `views/academic/present/acts/run.ts` to open the source tab at the slide; `Deck.order` is the deck's `order:` entries, read by `placedBy` in `state/life/present.ts` (the kind of the entry that placed a slide) and by `views/academic/slides/Slides.svelte` (`deck?.order`), which draws the order's rows.

### Item 4, B1, a deck-edit undo is all or none

`src/lib/server/edit/writes/config/deck/deck-undo.ts`: the files the undo has changed so far are kept in `done`; when a write back or a Trash call throws, each file in `done` is written again with its `after` text (the files written back, and any made file already trashed whose text is known; an image file has no text and is never one of them), the undo answers `unwritable` and no record is written. Test row in G9's deck undo table, `tests/server/edit/deck-acts.test.ts`, 'leaves every file as the act left it, and a later undo works once the Trash does': New Slide, then an undo with a Trash that rejects leaves every file of the hub as the act left it, then the undo with the working Trash removes `slide-1.md` and restores `present.yml`. Passing run: `Tests  7 passed (7)`. Failing run on the scratch copy (the code before this round; the characters vitest draws as a long dash and an ellipsis are written here as `-` and `\u2026`):

```
------- Failed Tests 1 -------
 FAIL  |unit| tests/server/edit/deck-acts.test.ts > taking an act back when the Trash fails > leaves every file as the act left it, and a later undo works once the Trash does
AssertionError: expected { 'deck/intro.md': '# Intro\n', \u2026(11) } to deeply equal { 'deck/intro.md': '# Intro\n', \u2026(11) }
- Expected
+ Received
-     - slide-1.md
      Tests  1 failed | 6 passed (7)
```

### Item 5, B2, the image link (Z674 (3))

`src/lib/server/edit/writes/config/deck/deck-files.ts` `imageLine`: a `#`, `%` or `?` of the name is written percent-encoded (`%23`, `%25`, `%3F`), the angle brackets stay for a name with a space or a bracket, the name check is unchanged. The deck reader decoded a link with `decodeURI`, which leaves `%23` and `%3F` as they are, so the linked file would not have been found: `src/lib/data/sources/deck/kinds.ts` now decodes with `decodeURIComponent` (a link with a stray `%` names itself and no longer throws). Row in G8's table of the dropped image's write (`tests/server/edit/deck-acts.test.ts`, 'copies a dropped image beside the slide and links it, under a free name, and refuses what is no image or no name'): `fig#1.png` gives `![fig#1](fig%231.png)`. Passing run: `Tests  7 passed (7)`. Failing run on the scratch copy:

```
FAIL  |unit| tests/server/edit/deck-acts.test.ts > the acts of the deck write > copies a dropped image beside the slide and links it, under a free name, and refuses what is no image or no name
AssertionError: expected '# Engine\n\nOne slide.\n\n![fig](fig.\u2026' to contain '![fig#1](fig%231.png)\n'
- Expected
+ Received
- ![fig#1](fig%231.png)
+ # Engine
+ One slide.
+ ![fig](fig.png)
+ ![fig-2](fig-2.png)
+ ![my fig](<my fig.png>)
+ ![fig#1](fig#1.png)
```

What the reader does with the links, read through the deck reader on a scratch deck holding `fig#1.png`, `my fig.png`, `a?b.png`, `100%.png` and `50%.png` (a throwaway test, deleted; output as printed):

```
{
 "findings": [],
 "md": [
  "# A\n\n![fig#1](/api/file/hub/deck/fig%231.png)\n\n![my fig](<my fig.png>)\n\n![q](/api/file/hub/deck/a%3Fb.png)\n\n![pc](/api/file/hub/deck/100%25.png)\n\n![raw](/api/file/hub/deck/50%25.png)"
 ]
}
```

`fig#1`, `a?b`, `100%25` and a raw `50%` are addressed through the file route. OPEN, unfixed: `![my fig](<my fig.png>)` stays as written, since the image pattern of `kinds.ts` (`IMAGE`, `[^)\s]+`) does not match an angle-bracket target, so a dropped image with a space in its name is copied and linked, and the reader leaves its link relative to the page (not looked at in a page, so whether the frame draws it is not verified). The round names nothing else to change, so it is left; the fix is to let `IMAGE` take `<...>` targets and strip the brackets before `unescaped`. It needs the orchestrator's yes for the file.

### Item 6, B3, the History row of an order record (Z674 (5))

`src/lib/views/system/history/History.svelte` `named`: a `deck-slides` record whose field is `order` is named by its key alone, so the row reads `order` beside the kind `deck order`. No test row: the brief names none and no test of this view exists.

### Item 7, open question 6, log pruning cuts an act (Z674 (4))

`src/lib/server/core/changes.ts`: `actStart` moves the cut back to the first record of the act it falls inside, an act being the run of `deck-edit` records with one key and `undoes` (the only kind `writtenWith` is used for, `deck-undo.ts:59`); records of other kinds are cut as before, since successive writes of one key (an app store) are not one act. Row in G9's table in `tests/server/core/changes.test.ts`, 'keeps a whole act when the cut of the window falls inside it': keep 2, acts x (2 records), y (2), z (1); the cut at five lines falls between y1 and y2; the log keeps y1, y2 and z and `writtenWith` finds both y records. Passing run: `Tests  8 passed (8)`. Failing run on the scratch copy:

```
------- Failed Tests 1 -------
 FAIL  |unit| tests/server/core/changes.test.ts > what a store write leaves in the undo folder > keeps a whole act when the cut of the window falls inside it
AssertionError: expected [ 'act-z', 'act-y' ] to deeply equal [ 'act-z', 'act-y', 'act-y' ]
- Expected
+ Received
-   "act-y",
      Tests  1 failed | 7 passed (8)
```

### Item 8, S1, the catalog limits

`config/text/server.yml` `image_large` takes `{1} MB` (`IMAGE_LIMIT_MB` from `MAX_UPLOAD_BYTES` in `deck-files.ts`, both calls), `config/text/views/academic/present.yml` `drop_large` takes `{1} MB` (`UPLOAD_LIMIT_MB` in `state/life/present.ts`, which replaces `PDF_LIMIT_MB`, so `export.ts` and the drop check read one constant), `config/text/desktop.yml` `timeout` takes `{0} seconds` (`READY_WAIT_MS`, moved from `src/desktop/windows/print.ts` to `src/lib/state/shared/stores/desktop.ts` so the page and the host read one constant, and passed as `String(READY_WAIT_MS / 1000)` in `export.ts`). `grep -rn "32 MB\|60 seconds" config/text --exclude=local.yml` prints nothing (exit 1). `tests/checks/source/keys.test.ts` is in `npm run test:checks`: `Test Files  17 passed (17)`, `Tests  243 passed (243)`.

### Item 9, S2

`config/text/views/academic/slides.yml`: `already_in` is before `count` and `entry_moved` after `empty_unnamed`; the keys of `text.slides` read back in sorted order (`k==sorted(k)` printed `True`).

### Item 10, S3

`src/lib/server/edit/writes/config/deck/deck.ts`: the comment reads "a record keyed by the bare group name names that group"; `grep -rn "first-form" src tests docs DESIGN.md` prints nothing.

### Item 11, S4

`src/lib/views/shared/explorer/tree/menu/row-menu.ts`: the `outline` fact is removed from `RowMenuFacts` and its fill; `ROW_DECK_OUTLINE` reads `facts.markdown`.

### Verify, this round

- Scoped runs: `npx vitest run` of the 11 test files this round touches or that guard what it touches: `Test Files  11 passed (11)`, `Tests  81 passed (81)`; per file `deck-acts.test.ts` 7 passed, `changes.test.ts` 8 passed, `source.test.ts` 2 passed, `window-guard.test.ts` 5 passed.
- `npm run test:quick`, once after the last code change; full-list runs this round: 1.

```
test:quick: 109 changed file(s), from git since HEAD
test:quick: 94 test file(s), 10 essential
ok      ASCII gate (1.5 s)
ok      prettier (2.1 s): All matched files use Prettier code style!
ok      svelte-kit sync (3.1 s)
ok      eslint (37.6 s)
ok      vitest (43.6 s): Duration  38.81s (transform 60.96s, setup 0ms, import 118.13s, tests 28.66s, environment 188ms)
ok      svelte-check (41.8 s): 1791329813568 COMPLETED 397 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 45.2 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
```

- `npm run test:checks`: `Test Files  17 passed (17)`, `Tests  243 passed (243)`; `npx prettier --check .`: `All matched files use Prettier code style!`; `npx eslint .`: exit 0; `npm run check`: `1791330318308 COMPLETED 3078 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`; `bash utils/folder-check.sh` and `bash utils/size-check.sh`: exit 0.
- ASCII check over the files this round changed (`grep -cP '[^\x00-\x7F]'` per file): 0 in each.
- No Electron window, desktop app, agent, git command or slow tier was run in this round; `config/local.yml` was not opened, printed, grepped or hashed.

## The cases' first run

The unchanged tree is `.agents/worktrees/PR3-base` (`diff -rq PR3-base/tools/oculus PR3/tools/oculus --exclude=node_modules --exclude=local.yml` printed only the files the base copy does not hold: `.gitignore`, `.prettierignore`, `.prettierrc`, `.scratch`, `assets`, `demo`, `eslint.config.js`, `package-lock.json`, `package.json`, `tsconfig.json`). It was built (`npm run build`) in a scratch copy with the worktree's node_modules and run on port 8794 over a scratch hub (`projects/*/*/present`, every `project.yml`, `registries/` and a copy of `deck/`), with `HOME` set to a scratch folder. Each write case below is the request the page's control would send (`scratchpad/firstrun.py`, output `scratchpad/firstrun-out.txt`), sent with the page's token and `Sec-Fetch-Site: same-origin`; the cases that need a page (a drag, a menu, a drop, a draft in a source tab, the desktop app) are read from the unchanged source, with the line.

No case showed a rule of the brief to be wrong, so the build went ahead. Readings that needed a choice are in "Every judgment call".

| Case | First run on the unchanged tree |
|---|---|
| 1 | The two-group body `{kind:'deck-slides', groups:[...]}`: `400 {"error": "the body is not a write this route knows"}`. Two old-shape writes (pillars without `btfno`, then `more` with it second) answer `200` each and `diff` shows `-            - btfno` at line 14 and `+            - btfno` at line 21 (two changed lines), two records `deck-slides more slides` and `deck-slides pillars slides`, and the undo of both gives `file restored byte for byte: True`. The Slides view cannot do it in one save or drag across groups: `Slides.svelte:152` returns when `list.includes(onto)` is false. |
| 2 | A `deck-slides` body with `order`: `400` unknown shape. `grep -n "order" views/academic/slides/Slides.svelte state/life/slides.ts` prints no `order:` row; the view shows groups only. |
| 3 | A body with a stale `order.base`: `400` unknown shape (no writer reads `order`). |
| 4 | The old-shape body (`group`, `base`, `slides` at the top): `200 {"ok": true, "changed": ["more"], "refused": []}` and the file changed: the unchanged tree writes it, which the step refuses. |
| 5, 6, 7, 8, 9, 10, 11, 13, 29, 30, 31 | A `deck-edit` body of each act (`new`, `duplicate`, `delete`): `400 {"error": "the body is not a write this route knows"}`, and `ls deck` after all of them prints `closing.md engine.md present.yml title.md transition.md` (nothing written). |
| 11a, 12 | Read: `sed -n 348,354p model-entities.ts` shows `SlideBase` with `key`, `title` and `notes?` and no source, and the scratch route's answer carries `source` on 0 of 21 slides; `grep -rc "contextmenu\|ondrop\|ondragover" src/lib/views/academic/present/` prints no match, so the Present view has no slide menu. |
| 14 | `deck-edit` with `path` `../../etc/present.yml`: `400` unknown shape. `GET /api/deck?root=hub&path=../../etc` answers `403 {"error": "outside"}`, root `nothing` answers `403 {"error": "outside"}`; `POST /api/deck` answers `405 POST method not allowed`. |
| 15 | `deck-edit` and the old `deck-slides` body without the token: `403 {"error": "the write token is missing or stale"}`; `POST /api/deck` without the token: `405` (the route has only a GET). |
| 16, 17, 36 | `POST /api/deck` with a draft: `405 POST method not allowed`; the pane reads `GET /api/deck` only (`present.svelte.ts` `load`). |
| 18, 19, 32 | `deck-edit` `image` bodies: `400` unknown shape, nothing written. `grep -rn "ondrop" views/academic/present` prints no match. |
| 20, 33 | `deck-edit` `create`: `400` unknown shape. `rowMenu` (`row-menu.ts:279`) offers Open Presentation and no New Presentation; `files.yml:102` holds `menu_present: Open Presentation` alone. |
| 21, 22, 23, 35 | `deck-edit` `outline`: `400` unknown shape; `ls src/lib/data/sources/deck` holds no `outline.ts`. |
| 24, 25 | `GET /present/print?root=hub&path=deck`: `404`. `grep -rn "printToPDF\|jspdf\|pdf-lib\|window.print" src` prints nothing. |
| 26 | `grep -nE "\S - \S" projects/*/*/present/*.md projects/archive/*/*/*/present/*.md deck/*.md` in the main checkout prints 40 lines (`wc -l` 40), none in `deck/`. |
| 27 | Same as 2 (no order rows; a `deck-slides` body with `order` is refused). |
| 28 | An old-shape record written on the unchanged tree and undone from its `at`: `200 {"ok": true, "changed": ["more"], "refused": []}` and `file restored: True`. This is a behaviour the step keeps. |
| 34 | Old-shape write of `ideas` with `btfno`: `200 {"changed": [], "refused": [{"field": "deck/present.yml:ideas", "reason": "No deck named btfno belongs to the group"}]}`: refused with the unknown-name sentence, which the step replaces by `server.deck_slides.not_found_by`. |

## The cases after the build

Each case was run on the final build on the scratch server (port 8794, over a copy of the hub's `deck/` in a scratch root; nothing written into `deck/` or a project). Each case's printed output is in "Appendix A" below, under the marker named here; the page runs are in "Appendix B". Both appendices were taken on the build before repair round 1; the round changes the undo of an act whose Trash fails, the image link of a name holding `#`, `%` or `?`, the act-wide prune of the change log, one History row's name and catalog parameters, which the rows of "Repair round 1" cover, and case 19's two-file run is quoted there.

| Case | Script and marker in its output | Page run in Appendix B |
|---|---|---|
| 1, 2, 3, 4, 27, 34 | `cases-a.py`: `case1`, `case2`, `case27`, `case3`, `case4`, `case34` | step4 (order drag and Save), step12 (cross-group drag and Save) |
| 5, 6, 7, 8, 10, 29, 30 | `cases-b.py`: `--- case 5`, `6`, `29`, `30`, `7`, `8`, `10` | step3 (New, Delete, Edit Slide), step5 (tile menu), step12 (palette) |
| 9, 11, 11a, 12, 13, 14, 15, 31 | `cases-c.py`: `--- case 9`, `11 / 11a`, `13`, `31`, `12 member slide`, `14`, `15` | |
| 16, 17, 36 | `cases-f.py`: `case16`, `--- case 17`, `--- case 36`; `case36.py` | step10 (typing in the editor) |
| 18, 19, 32 | `cases-d.py`: `--- case 18`, `19`, `32` | step5, step7 (image drop) |
| 20, 33 | `cases-d.py`: `--- case 20 / 33` | step8 (Files view) |
| 21, 22, 23, 35 | `cases-e.py`: `--- case 21`, `22`, `23`, `35` | step9 (Files view) |
| 24, 25 | | step6 (export, replace question), step11 (browser-tab print page) |
| 26 | `grep -nE "\S - \S" ../../projects/*/*/present/*.md ../../projects/archive/*/*/*/present/*.md` prints nothing (exit 1) in the worktree | |
| 28 | `case28.py` | |

## DONE / NOT DONE

Run from `tools/oculus` in the worktree unless a path says otherwise.

| Row | Status | Command and output as printed |
|---|---|---|
| Parts 1 to 6 (slide drag and order, slide actions/menus/palette, live draft, image drop, New Presentation, New Presentation from Outline) | DONE | Cases 1-23, 27-36 in Appendix A/B; `tests/routes/edit/deck-slides.test.ts`, `deck-acts.test.ts` (7), `deck.test.ts`, `present.test.ts` pass in the scoped run below |
| Part 7, Export to PDF | DONE | Cases 24, 25 above; `grep -rn "printToPDF" src` prints `src/desktop/windows/print.ts:5` and `src/desktop/windows/print.ts:67` only. A real browser's print dialog is a look at landing |
| Part 8, 40 spaced-hyphen lines | DONE | `grep -nE "\S - \S" ../../projects/*/*/present/*.md ../../projects/archive/*/*/*/present/*.md` prints nothing (`item3 exit 1`); the 40 lines are listed below |
| Part 9, documents, catalog texts, guarded.md lines | DONE | `python3 titles.py G2 G8 G9 G32 G49` prints nothing (exit 0) |
| Repair round 1, items 1 to 11 | DONE | "Repair round 1" above; item 5 leaves one defect OPEN (the angle-bracket image link), named there |
| `npm run test:quick`, once after the last change, full-list runs 1 | DONE | Printed:\n```\ntest:quick: 109 changed file(s), from git since HEAD
test:quick: 94 test file(s), 10 essential
ok      ASCII gate (1.5 s)
ok      prettier (2.1 s): All matched files use Prettier code style!
ok      svelte-kit sync (3.1 s)
ok      eslint (37.6 s)
ok      vitest (43.6 s): Duration  38.81s (transform 60.96s, setup 0ms, import 118.13s, tests 28.66s, environment 188ms)
ok      svelte-check (41.8 s): 1791329813568 COMPLETED 397 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 45.2 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,\n```\n |
| Scoped test run after the last change | DONE | `Test Files  11 passed (11)`, `Tests  81 passed (81)` over `deck-acts`, `changes`, `source`, `window-guard`, `present`, `deck`, `deck-slides`, `undo`, `app-gate`, `window-file` and `approve`; the tests of G47, G49 and G53 are in it |
| New or changed tests on the unchanged tree | DONE | Round 1's rows (items 4, 5 and 7) fail on the code before the round, quoted above. The step's earlier tests: `present.test.ts` fails at import (no `outline.ts`); `deck.test.ts` 2 failed; `deck-slides.test.ts` 2 failed; `undo.test.ts` 1 failed; `changes.test.ts` 1 failed; `window-guard.test.ts` 2 failed; `deck-acts.test.ts` 6 failed. `app-gate.test.ts` passes on the unchanged tree too (its row tests a behaviour the step keeps) |
| `npm run test:checks` | DONE | `Test Files  17 passed (17)`, `Tests  243 passed (243)` |
| prettier, eslint, svelte-check | DONE | `All matched files use Prettier code style!`; `eslint 0`; `1791330318308 COMPLETED 3078 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| `bash utils/folder-check.sh`, `bash utils/size-check.sh` | DONE | exit 0, exit 0 |
| `bash utils/unused-exports.sh` against the unchanged tree's list | DONE | Its diff names the same entries as before the round: `deckEditWrite` (a barrel re-export beside `deckSlidesWrite`), and `loadSource` and `SourceLoad` no longer listed (used) |
| ASCII, pptx, hyphen stand-ins, history words on the changed files | DONE | `ok      ASCII gate (1.5 s)`; `grep -cP '[^\x00-\x7F]'` over the files this round changed: 0 each; the one `pptx` line over the changed files is `docs/views.md:11`, which this step does not touch |
| `grep -rn "32 MB\|60 seconds" config/text --exclude=local.yml` | DONE | prints nothing (exit 1) |
| Scratch server and Electron processes | DONE | none was started this round; `ps aux` lists no PR3 electron process |
| G53, the print window never recorded in the window file | NOT DONE, ruled (Z674 (2)) | no test: `print.ts` builds its own window and never goes through `windows.ts` |
| Cases 16, 18, 24, 25 as looks at landing | NOT DONE here, by the brief | the runs the cases name are quoted; the desktop app was never started |
| The diagnosis of `start.test.ts`'s `serversOf` rows (Z674 (6)) | NOT DONE | not an item of round 1's brief; it is the orchestrator's `/diagnose` dispatch |
| Angle-bracket image links addressed by the reader | NOT DONE, open | item 5 above |

## The files with line counts

The set this step changes in `tools/oculus` (`M` modified, `??` new, `D` deleted), built from `git status` of the worktree before this round, minus the four test files this round removed or returned to the unchanged tree (`tests/views/academic/export.test.ts`, `tests/state/workbench/palette-source.client.test.ts`, `tests/state/sessions/source.test.ts`, `tests/ui/frame/rooted.svelte.ts`), plus `src/lib/data/sources/deck/kinds.ts`; the line counts are `wc -l` now. 85 modified, 23 new, 1 deleted (`src/lib/server/edit/writes/config/deck.ts`, now the folder `writes/config/deck/`). The files this round changed are `deck-undo.ts`, `deck-files.ts`, `deck.ts`, `kinds.ts`, `changes.ts`, `History.svelte`, `row-menu.ts`, `present.ts`, `desktop.ts`, `print.ts`, `export.ts`, `server.yml`, `desktop.yml`, `present.yml`, `slides.yml`, `guarded.md`, `deck-acts.test.ts` and `changes.test.ts`. The 8 project files of part 8 are listed after the table.

| Status | Lines | File |
|---|---|---|
| M | 155 | `.scratch/migration/agents/guarded.md` |
| M | 576 | `DESIGN.md` |
| M | 159 | `HELP.md` |
| M | 171 | `config/text/app.yml` |
| M | 63 | `config/text/desktop.yml` |
| M | 140 | `config/text/server.yml` |
| M | 63 | `config/text/views/academic/present.yml` |
| M | 48 | `config/text/views/academic/slides.yml` |
| M | 248 | `config/text/views/sources/files.yml` |
| M | 80 | `config/text/views/system/history.yml` |
| M | 861 | `docs/apps.md` |
| M | 64 | `docs/configuration.md` |
| M | 156 | `docs/diagrams/layer-server.dot` |
| M | 764 | `docs/diagrams/layer-server.svg` |
| M | 112 | `docs/diagrams/layer-shell.dot` |
| M | 501 | `docs/diagrams/layer-shell.svg` |
| M | 173 | `docs/diagrams/layer-state.dot` |
| M | 855 | `docs/diagrams/layer-state.svg` |
| M | 179 | `docs/diagrams/layer-views.dot` |
| M | 809 | `docs/diagrams/layer-views.svg` |
| M | 93 | `docs/diagrams/layers.dot` |
| M | 510 | `docs/diagrams/layers.svg` |
| M | 207 | `docs/diagrams/writes.dot` |
| M | 994 | `docs/diagrams/writes.svg` |
| M | 91 | `docs/files-and-search.md` |
| M | 239 | `docs/views.md` |
| M | 82 | `docs/window.md` |
| M | 328 | `src/desktop/app.ts` |
| M | 38 | `src/desktop/decide/channels.ts` |
| M | 61 | `src/desktop/decide/sender.ts` |
| M | 51 | `src/desktop/preload.cjs` |
| M | 226 | `src/desktop/windows/bridge.ts` |
| ?? | 74 | `src/desktop/windows/print.ts` |
| M | 339 | `src/lib/data/file-ops.ts` |
| M | 204 | `src/lib/data/helpers/files/apps.ts` |
| M | 602 | `src/lib/data/model/index.ts` |
| M | 812 | `src/lib/data/model/model-entities.ts` |
| M | 343 | `src/lib/data/sources/deck/kinds.ts` |
| ?? | 87 | `src/lib/data/sources/deck/order-text.ts` |
| ?? | 87 | `src/lib/data/sources/deck/outline.ts` |
| M | 605 | `src/lib/data/sources/deck/read.ts` |
| ?? | 112 | `src/lib/data/sources/deck/slide-text.ts` |
| M | 185 | `src/lib/data/sources/deck/spec.ts` |
| M | 138 | `src/lib/data/sources/deck/split.ts` |
| M | 79 | `src/lib/server/content/deck/endpoint.ts` |
| M | 88 | `src/lib/server/content/deck/read.ts` |
| M | 400 | `src/lib/server/core/changes.ts` |
| M | 183 | `src/lib/server/edit/deck-edit.ts` |
| M | 636 | `src/lib/server/edit/writes.ts` |
| M | 126 | `src/lib/server/edit/writes/app-gate.ts` |
| M | 544 | `src/lib/server/edit/writes/bodies.ts` |
| M | 100 | `src/lib/server/edit/writes/config/config-write.ts` |
| D | 0 | `src/lib/server/edit/writes/config/deck.ts` |
| ?? | 32 | `src/lib/server/edit/writes/config/deck/deck-acts.ts` |
| ?? | 437 | `src/lib/server/edit/writes/config/deck/deck-files.ts` |
| ?? | 121 | `src/lib/server/edit/writes/config/deck/deck-new.ts` |
| ?? | 118 | `src/lib/server/edit/writes/config/deck/deck-undo.ts` |
| ?? | 242 | `src/lib/server/edit/writes/config/deck/deck.ts` |
| M | 413 | `src/lib/server/edit/writes/undo.ts` |
| M | 510 | `src/lib/shell/keys/Palette.svelte` |
| ?? | 35 | `src/lib/shell/keys/command-runs.ts` |
| M | 67 | `src/lib/shell/keys/palette-open.ts` |
| M | 673 | `src/lib/state/client/writes.svelte.ts` |
| M | 156 | `src/lib/state/life/present.svelte.ts` |
| M | 457 | `src/lib/state/life/present.ts` |
| M | 223 | `src/lib/state/life/slides.ts` |
| M | 509 | `src/lib/state/sessions/source.svelte.ts` |
| M | 117 | `src/lib/state/shared/stores/desktop.ts` |
| M | 377 | `src/lib/state/shared/stores/shapes.ts` |
| M | 78 | `src/lib/state/sources/explorer/naming.ts` |
| M | 222 | `src/lib/state/sources/explorer/rows/tree-rows.ts` |
| M | 249 | `src/lib/state/sources/explorer/view/files-view.ts` |
| M | 181 | `src/lib/state/sources/explorer/view/place.ts` |
| M | 136 | `src/lib/state/workbench/palette-source.svelte.ts` |
| M | 355 | `src/lib/state/workbench/palette.ts` |
| ?? | 19 | `src/lib/themes/slide.css` |
| M | 98 | `src/lib/views/academic/present/Bar.svelte` |
| M | 94 | `src/lib/views/academic/present/Overview.svelte` |
| M | 490 | `src/lib/views/academic/present/Present.svelte` |
| ?? | 131 | `src/lib/views/academic/present/acts/acts.svelte.ts` |
| ?? | 104 | `src/lib/views/academic/present/acts/export.ts` |
| ?? | 48 | `src/lib/views/academic/present/acts/live.svelte.ts` |
| ?? | 36 | `src/lib/views/academic/present/acts/menu.ts` |
| ?? | 144 | `src/lib/views/academic/present/acts/run.ts` |
| ?? | 112 | `src/lib/views/academic/present/fullscreen.svelte.ts` |
| ?? | 145 | `src/lib/views/academic/slides/Order.svelte` |
| M | 433 | `src/lib/views/academic/slides/Slides.svelte` |
| ?? | 68 | `src/lib/views/academic/slides/Steps.svelte` |
| M | 80 | `src/lib/views/shared/explorer/tree/NameInput.svelte` |
| M | 385 | `src/lib/views/shared/explorer/tree/Tree.svelte` |
| M | 235 | `src/lib/views/shared/explorer/tree/control/picks.svelte.ts` |
| M | 601 | `src/lib/views/shared/explorer/tree/menu/row-menu.ts` |
| M | 446 | `src/lib/views/shared/explorer/tree/menu/row-ops.ts` |
| M | 393 | `src/lib/views/system/history/History.svelte` |
| M | 48 | `src/routes/+layout.svelte` |
| M | 30 | `src/routes/api/(docs)/deck/+server.ts` |
| ?? | 17 | `src/routes/present/print/+page.server.ts` |
| ?? | 154 | `src/routes/present/print/+page.svelte` |
| ?? | 9 | `src/routes/present/print/+page.ts` |
| M | 284 | `tests/data/sources/present.test.ts` |
| M | 154 | `tests/routes/docs/deck.test.ts` |
| M | 231 | `tests/routes/edit/app-gate.test.ts` |
| M | 203 | `tests/routes/edit/deck-slides.test.ts` |
| M | 362 | `tests/routes/edit/undo/undo.test.ts` |
| M | 368 | `tests/routes/edit/write-fixture.ts` |
| M | 340 | `tests/server/core/changes.test.ts` |
| M | 121 | `tests/server/desktop/window-guard.test.ts` |
| ?? | 376 | `tests/server/edit/deck-acts.test.ts` |

Project files (part 8, outside `tools/oculus`): `projects/archive/published/2026/hccnet-fl/present/main.md`, `projects/manuscripts/bttd-source-eeg/present/main.md`, `projects/manuscripts/dries-bttr-ecg/present/main.md`, `projects/manuscripts/ecg-readable-substrate/present/main.md`, `projects/manuscripts/fed-multicellular-immune/present/main.md`, `projects/manuscripts/hccnet-revision/present/main.md`, `projects/manuscripts/raw-pls/present/main.md`, `projects/manuscripts/ward-bttr-crosssubject/present/main.md`.

## Every judgment call the brief left open

- Paths written beyond the brief's list, widened rather than booked: `src/lib/server/core/changes.ts` and `History.svelte` (a record keyed `slides:<group>` or `order`, and one act key spanning files), `src/lib/data/file-ops.ts` and the explorer files (`naming.ts`, `place.ts`, `tree-rows.ts`, `files-view.ts`, `picks.svelte.ts`, `NameInput.svelte`, `Tree.svelte`) for the New Presentation and outline menu items, `src/lib/themes/slide.css`, `src/routes/+layout.svelte`, the deck data and server files under `src/lib/data/sources/deck/` and `src/lib/server/edit/writes/config/deck/`, `src/lib/state/life/*`, `src/lib/state/sessions/source.svelte.ts` (the read of a file now asks the server each time, since `/api/file/...` answers `cache-control: private, max-age=60` and an act after an image drop was refused for a file the page had read before the drop), `src/lib/state/workbench/palette-source.svelte.ts`, `Slides.svelte`, `Palette.svelte` and a new `src/lib/shell/keys/command-runs.ts` (the palette's workspace and folder commands moved out of `Palette.svelte` so it stays under 520 lines).
- `slide-edit.ts` of the brief is merged into `src/lib/state/life/present.ts`; the brief's path `tree/row-ops.ts` is `tree/menu/row-ops.ts` in the tree.
- The slide's source carries the new fields `entry` and `line`, and the deck `order` (ruled, Z674 (7)): `line` (the 1-based first line of the slide's place in its file; for a summary or grid slide, the entry's line in `present.yml`), so Edit Slide opens the source tab at the slide without the client reading the file.
- A deck that draws no slide: the print page says it failed (`data-failed`) with the sentence `present.empty`, so the host answers at once and not after the wait of `READY_WAIT_MS`.
- The export writes through `explorer.upload`, so the PDF is recorded and undone as any upload, and asks the replace question when `deck.pdf` exists; the size limit is the upload's `MAX_UPLOAD_BYTES` (`UPLOAD_LIMIT_MB`), said in words when exceeded (`present.export_too_large`).
- A page of a long slide in the PDF: a tall slide is scaled to fit the page (`src/routes/present/print/+page.svelte`), since a slide is never cut or split over two pages.
- Act-wide undo is all or none, over every record of one 12-hex act key, and a failing Trash puts back every file already written (round 1, item 4); the change log prunes whole `deck-edit` acts (item 7).
- Redo of an undone image drop is not offered (`redo (404, {'error': 'nothing'})` in `final2-cases-d.out`): the image bytes record is kept for undo only.
- A group literally named `slides:x` is ambiguous with the record key prefix `slides:<group>`; no deck of the hub has one.
- The G47 rows added in `tests/server/desktop/window-guard.test.ts` (the print window's sender and address rules) are kept and handed over as lines for `agents/guarded.md` (Z674 (1); item 1 of the round).
- The click-through found four defects that no automated check covers, fixed in the code (the palette offer loop, the Slides Save path, the print address, the cached source read); the tests written for three of them were deleted by ruling (Z674 (1)), so they are held by the code and the page runs of Appendix B only.
- Scratch Trash moves from the Delete case land in the real macOS Trash (the system Trash is shared); the scratch hub's files only.
- The looks were run in standalone hidden Electron windows against the scratch server, not in the desktop app; the first run downloaded the Electron binary into the package cache.
- The spec's standards pages: the brief's item 7 names "the standards pages' rules on list items and sentence length", and no such page exists (`agents/spec.md`, the plan's `standards:`, holds no sentence-length or list-item rule). Each new or changed sentence was read against the hub's Writing docs rules and the Ward voice, long sentences were split, and these list-form sentences keep their form because they enumerate parallel items that a split would separate: the `DESIGN.md` "Closed:" list (109 words), the `docs/window.md` "It adds what a browser tab cannot give" list (129 words), the `docs/files-and-search.md` row-menu paragraph (220 words), the `docs/configuration.md` recorded-writes list (109 words).
- `tests/server/desktop/start.test.ts` is flaky on both trees (worktree: 1 failed in one run, 5 passed in another; unchanged tree: 1 failed, then 2 failed); it fails in its `ps`-based `serversOf(...)` assertions.

## Every host- or user-visible change, before and after

| Where | Before | After |
|---|---|---|
| Present view, slide right-click menu and overview tile menu | No menu | Edit Slide, New Slide, Duplicate Slide, Delete Slide (`ui/final-step3.log`, `final-step5.log`) |
| Present view, palette (Cmd+K) | No slide commands | Command rows `New Slide`, `Edit Slide`, `Duplicate Slide`, `Delete Slide` and `Export to PDF` while a Present tab is on screen |
| Present view, Delete Slide | Not possible | A question naming the slide and the file, then the file to the Trash or the slide out of a multi-slide file; undone from History |
| Present view, an image dropped on a slide | Ignored | The image is copied beside the slide under a free name and linked in its text; `Added fig.png to the slide.` |
| Present view, a slide's source tab | The frame showed the file on disk | The frame draws the editor's unsaved text within about 1.5 s; the file on disk is unchanged |
| Present view bar | No export | An Export to PDF button: `Wrote deck.pdf beside the deck.`, a replace question when it exists; in a browser tab it opens the print page, which opens the print dialog |
| Slides view | Slides moved within one group's list | Slides drag across groups, and the order entries (`slides:<group>`, summaries, grids, files) drag too; Save writes one change per file that keeps every other line, and is undone as one |
| Files view, folder row menu | Open Presentation only | Open Presentation and New Presentation... (a title question, `present.yml` and `closing.md`, a tab opens on it) |
| Files view, Markdown file row menu | No outline action | New Presentation from Outline, writing `<name>-slides/` beside the file; the file is unchanged |
| History view | A deck write was named by its key and field | A deck edit's rows name what the act did and the file (`slide added: deck/slide-1.md`), a group's list row names the group, and the `order:` records read `order` beside the kind `deck order`; an act spanning files undoes as one |
| Desktop app bridge | No print channel | `oculus:print-pdf`; a hidden window of the server's own origin that is never listed or recorded, answers only the print channel |
| Config and text | None | `config/text/views/academic/present.yml`, `slides.yml`, `files.yml`, `history.yml`, `app.yml`, `desktop.yml`, `server.yml` carry the new sentences; `HELP.md`, `DESIGN.md`, `docs/views.md`, `docs/window.md`, `docs/files-and-search.md`, `docs/configuration.md` describe them |
| Present view, an image whose name holds `#`, `%` or `?` | Linked unencoded, so the link named another file | Linked percent-encoded (`![fig#1](fig%231.png)`), and the reader decodes it; a name with a space is left unaddressed by the reader (item 5, open) |
| Present and Files views, the size and wait sentences | `32 MB` and `60 seconds` written in the text | The limits are read from `MAX_UPLOAD_BYTES` and `READY_WAIT_MS`; the sentences read as before |
| History view, undo of a deck act whose Trash fails | Could leave `present.yml` without the entry and the made file in place | Every file is as the act left it, and the undo says it could not be written |
| 40 lines of 8 decks | Spaced hyphen in prose | Reworded (below) |

## Part 8, the 40 lines

Reworded by hand in the worktree copies (Z667 (a)); every number, name, unit, HTML tag and Markdown mark is byte for byte. `git diff --stat HEAD -- projects`: `8 files changed, 40 insertions(+), 40 deletions(-)`.

### `projects/manuscripts/ecg-readable-substrate/present/main.md` (3 lines)

- Line 6
  - Before: `**One-liner:** Powerful ECG AI can flag hidden disease but not give a reason you can trust. We turn it into a few nameable concepts and, for each patient, emit a small set that PROVABLY suffices for the prediction - a guarantee, not a guess.`
  - After: `**One-liner:** Powerful ECG AI can flag hidden disease but not give a reason you can trust. We turn it into a few nameable concepts and, for each patient, emit a small set that PROVABLY suffices for the prediction: a guarantee, not a guess.`
- Line 9
  - Before: `A big AI reads an ECG and predicts a hidden outcome. We distil it into concepts anchored to the ECG's own measured intervals, and for each patient output a short list of concepts that, if held fixed, keep the answer with high probability - a certificate a clinician can read and check.`
  - After: `A big AI reads an ECG and predicts a hidden outcome. We distil it into concepts anchored to the ECG's own measured intervals, and for each patient output a short list of concepts that, if held fixed, keep the answer with high probability: a certificate a clinician can read and check.`
- Line 18
  - Before: `Trustworthy clinical AI needs guarantees, not just saliency maps - the black-box interpretability methods can't provide one. Next: show the certified substrate matches the black box's accuracy while emitting per-patient certificates that recover real ECG physiology. Open to clinical and ML-interpretability collaborators.`
  - After: `Trustworthy clinical AI needs guarantees, not just saliency maps; the black-box interpretability methods can't provide one. Next: show the certified substrate matches the black box's accuracy while emitting per-patient certificates that recover real ECG physiology. Open to clinical and ML-interpretability collaborators.`

### `projects/manuscripts/dries-bttr-ecg/present/main.md` (6 lines)

- Line 6
  - Before: `title: A hidden AF fingerprint in a <i>normal</i> ECG - read straight off the model`
  - After: `title: A hidden AF fingerprint in a <i>normal</i> ECG, read straight off the model`
- Line 7
  - Before: `sub: Dries - supervised block-term tensor regression on PTB-XL`
  - After: `sub: Dries, supervised block-term tensor regression on PTB-XL`
- Line 23
  - Before: `  caption: Matches or beats every baseline - including a foundation model.`
  - After: `  caption: Matches or beats every baseline, including a foundation model.`
- Line 24
  - Before: `  explain: AUROC with 95% patient-bootstrap intervals across two cohorts. **BTTR (green) is at or above all baselines** - clinical features, a CNN, a CP surrogate, and the HuBERT-ECG foundation model pretrained on 9M ECGs - so the interpretability costs no accuracy.`
  - After: `  explain: AUROC with 95% patient-bootstrap intervals across two cohorts. **BTTR (green) is at or above all baselines** (clinical features, a CNN, a CP surrogate, and the HuBERT-ECG foundation model pretrained on 9M ECGs), so the interpretability costs no accuracy.`
- Line 30
  - Before: `- <b>Glass-box substrate maps.</b> Every block <b>is</b> a (time x lead) weight map - faithful by construction, not post-hoc; stable across resampling (r = 0.88 $\pm$ 0.06).`
  - After: `- <b>Glass-box substrate maps.</b> Every block <b>is</b> a (time x lead) weight map, faithful by construction, not post-hoc; stable across resampling (r = 0.88 $\pm$ 0.06).`
- Line 34
  - Before: `- Beats every baseline tested - CNN, frozen HuBERT-ECG embeddings, and an unsupervised CP surrogate.`
  - After: `- Beats every baseline tested (CNN, frozen HuBERT-ECG embeddings, and an unsupervised CP surrogate).`

### `projects/manuscripts/hccnet-revision/present/main.md` (5 lines)

- Line 7
  - Before: `sub: HCCNet - self-supervised 3D backbone + irregular-time Transformer`
  - After: `sub: HCCNet, self-supervised 3D backbone + irregular-time Transformer`
- Line 24
  - Before: `  explain: '**AUROC (right) and AUPRC (left)** split by patients with below- vs above-median numbers of scans, across the three MRI modalities. Boxes are the mean over the five model sizes, dots are individual CV folds - DW-MRI is clearly the strongest modality.'`
  - After: `  explain: '**AUROC (right) and AUPRC (left)** split by patients with below- vs above-median numbers of scans, across the three MRI modalities. Boxes are the mean over the five model sizes, dots are individual CV folds; DW-MRI is clearly the strongest modality.'`
- Line 29
  - Before: `- <b>Stage 1 - backbone.</b> 3D ConvNeXt (k=3 depthwise, 3x patchify, 1.5 mm^3) pretrained with a student-teacher <b>DINO</b> objective; augmentation exploits natural MRI <i>contrast-series</i> variation (DW b in {0,150,400,800}, DCE phases) rather than brightness/contrast.`
  - After: `- <b>Stage 1 (backbone).</b> 3D ConvNeXt (k=3 depthwise, 3x patchify, 1.5 mm^3) pretrained with a student-teacher <b>DINO</b> objective; augmentation exploits natural MRI <i>contrast-series</i> variation (DW b in {0,150,400,800}, DCE phases) rather than brightness/contrast.`
- Line 30
  - Before: `- <b>Stage 2 - temporal.</b> Pre-LN Transformer over per-visit embeddings with a [cls] token; irregular gaps encoded by sinusoidal PE on <b>sqrt(delta-t)</b> (above), not ordinal position.`
  - After: `- <b>Stage 2 (temporal).</b> Pre-LN Transformer over per-visit embeddings with a [cls] token; irregular gaps encoded by sinusoidal PE on <b>sqrt(delta-t)</b> (above), not ordinal position.`
- Line 34
  - Before: `- 'SSL ablation: AUPRC 0.309 (no pretrain) -> <b>0.701</b> (backbone SSL) -> 0.744 (full) - the self-supervised backbone drives <b>~94%</b> of the gain (<b>+136% AUPRC</b>).'`
  - After: `- 'SSL ablation: AUPRC 0.309 (no pretrain) -> <b>0.701</b> (backbone SSL) -> 0.744 (full); the self-supervised backbone drives <b>~94%</b> of the gain (<b>+136% AUPRC</b>).'`

### `projects/manuscripts/raw-pls/present/main.md` (12 lines)

- Line 7
  - Before: `sub: Registration-Free Tensor-PLS - supervised fused-Gromov-Wasserstein`
  - After: `sub: Registration-Free Tensor-PLS, supervised fused-Gromov-Wasserstein`
- Line 11
  - Before: `  plain: Normally you squash every scan onto one standard brain - which breaks for tumors. Instead, treat each tumor as a cloud of points and gently match clouds to a shared template, then read the biology off how they line up.`
  - After: `  plain: Normally you squash every scan onto one standard brain, which breaks for tumors. Instead, treat each tumor as a cloud of points and gently match clouds to a shared template, then read the biology off how they line up.`
- Line 32
  - Before: `  explain: Unaligned lesions (different shapes and positions) are each transported onto a **shared learned template** via entropic fused-Gromov-Wasserstein coupling; the resulting fixed-size per-lesion maps feed a tensor-PLS head - no global voxel grid, no registration.`
  - After: `  explain: Unaligned lesions (different shapes and positions) are each transported onto a **shared learned template** via entropic fused-Gromov-Wasserstein coupling; the resulting fixed-size per-lesion maps feed a tensor-PLS head; no global voxel grid, no registration.`
- Line 35
  - Before: `  explain: "Gradient saliency <b>|dY/dF|</b> overlaid on each patient's <b>actual T1ce MRI</b> (yellow = voxels that most influence the predicted ET-NCR distance). The model concentrates on <b>focal lesion sub-regions</b> rather than diffuse texture, and the pattern sits in each patient's own anatomy - <b>no registration</b>. Left: a high-separation tumour (true 1.45 / pred 1.75); right: a concentric low-separation tumour (true 0.01 / pred 0.10). Colour is normalized per patient."`
  - After: `  explain: "Gradient saliency <b>|dY/dF|</b> overlaid on each patient's <b>actual T1ce MRI</b> (yellow = voxels that most influence the predicted ET-NCR distance). The model concentrates on <b>focal lesion sub-regions</b> rather than diffuse texture, and the pattern sits in each patient's own anatomy; <b>no registration</b>. Left: a high-separation tumour (true 1.45 / pred 1.75); right: a concentric low-separation tumour (true 0.01 / pred 0.10). Colour is normalized per patient."`
- Line 37
  - Before: `  caption: A focal 3D locus - saliency is consistent across views.`
  - After: `  caption: A focal 3D locus; saliency is consistent across views.`
- Line 38
  - Before: `  explain: The same saliency overlay for one patient (BraTS2021_01180) in <b>axial, coronal and sagittal</b> views; the hotspot reappears in the same place from every angle - a genuine 3D focal region the model relies on, not a single-slice artifact.`
  - After: `  explain: The same saliency overlay for one patient (BraTS2021_01180) in <b>axial, coronal and sagittal</b> views; the hotspot reappears in the same place from every angle, a genuine 3D focal region the model relies on, not a single-slice artifact.`
- Line 41
  - Before: `  explain: On real BraTS, RAW-PLS beats the alignment baseline at <b>two</b> strengths - simple centroid alignment and full anatomical SRI24-atlas registration. Giving the baseline true anatomical coordinates actually <b>lowers</b> its score on both targets (structural R^2 and grade AUC both drop vs centering), because aligning healthy anatomy cannot put tumours into correspondence. Margins <b>+0.43 R^2</b> (structural) and <b>+0.18 AUC</b> (grade), p~2x10<sup>-15</sup>.`
  - After: `  explain: On real BraTS, RAW-PLS beats the alignment baseline at <b>two</b> strengths (simple centroid alignment and full anatomical SRI24-atlas registration). Giving the baseline true anatomical coordinates actually <b>lowers</b> its score on both targets (structural R^2 and grade AUC both drop vs centering), because aligning healthy anatomy cannot put tumours into correspondence. Margins <b>+0.43 R^2</b> (structural) and <b>+0.18 AUC</b> (grade), p~2x10<sup>-15</sup>.`
- Line 43
  - Before: `- Each case is a point-cloud {(p_i in R^3, f_i in R^C)} - <=128 tumor voxels x 4 MRI modalities, with <i>no</i> cross-subject voxel correspondence.`
  - After: `- Each case is a point-cloud {(p_i in R^3, f_i in R^C)} (<=128 tumor voxels x 4 MRI modalities), with <i>no</i> cross-subject voxel correspondence.`
- Line 48
  - Before: `- 'Supervision (jointly learning template + predictor) is the load-bearing ingredient - go/no-go verdict: <b>supervised novelty earned</b>.'`
  - After: `- 'Supervision (jointly learning template + predictor) is the load-bearing ingredient; go/no-go verdict: <b>supervised novelty earned</b>.'`
- Line 49
  - Before: `- 'On <b>real BraTS</b> lesions (10-seed pilot): RAW-PLS R^2=<b>+0.070</b> vs the alignment-assuming grid+PLS baseline <b>-0.267</b> - a registration-free margin of <b>+0.34</b> (Wilcoxon p~2x10<sup>-15</sup>), and ours wins in <i>every</i> one of 18 sweep configurations.'`
  - After: `- 'On <b>real BraTS</b> lesions (10-seed pilot): RAW-PLS R^2=<b>+0.070</b> vs the alignment-assuming grid+PLS baseline <b>-0.267</b>, a registration-free margin of <b>+0.34</b> (Wilcoxon p~2x10<sup>-15</sup>), and ours wins in <i>every</i> one of 18 sweep configurations.'`
- Line 50
  - Before: `- 'Clinical <b>tumour grade</b> (HGG/LGG, BraTS2020): RAW-PLS <b>AUC 0.935</b> vs aligned grid 0.834 - high absolute <i>and</i> the registration-free advantage survives.'`
  - After: `- 'Clinical <b>tumour grade</b> (HGG/LGG, BraTS2020): RAW-PLS <b>AUC 0.935</b> vs aligned grid 0.834, high absolute <i>and</i> the registration-free advantage survives.'`
- Line 51
  - Before: `- Even when the baseline is given <b>full anatomical registration</b> (absolute SRI24-atlas coordinates), RAW-PLS still wins both targets by an even larger margin (struct +0.42 R^2, grade +0.18 AUC) - aligning healthy anatomy cannot make lesions correspond.`
  - After: `- Even when the baseline is given <b>full anatomical registration</b> (absolute SRI24-atlas coordinates), RAW-PLS still wins both targets by an even larger margin (struct +0.42 R^2, grade +0.18 AUC); aligning healthy anatomy cannot make lesions correspond.`

### `projects/archive/published/2026/hccnet-fl/present/main.md` (5 lines)

- Line 6
  - Before: `title: Training one liver-cancer model across hospitals - sharing only the backbone`
  - After: `title: Training one liver-cancer model across hospitals, sharing only the backbone`
- Line 7
  - Before: `sub: HCCNet-FL - component-aware federation (CAF)`
  - After: `sub: HCCNet-FL, component-aware federation (CAF)`
- Line 10
  - Before: `  purpose: Pool the statistical power of many hospitals' scans to catch liver cancer earlier - without any hospital handing over patient data.`
  - After: `  purpose: Pool the statistical power of many hospitals' scans to catch liver cancer earlier, without any hospital handing over patient data.`
- Line 40
  - Before: `- "<b>Grounded in HCCNet's own ablation</b> (measured): backbone SSL gives +136% AUPRC, while the temporal head encodes <i>site-specific screening cadence</i> and transfers poorly - so it stays local."`
  - After: `- "<b>Grounded in HCCNet's own ablation</b> (measured): backbone SSL gives +136% AUPRC, while the temporal head encodes <i>site-specific screening cadence</i> and transfers poorly, so it stays local."`
- Line 45
  - Before: `- Sharing the backbone (not the temporal head) is what carries the gain - federating the head instead underperforms plain FedAvg.`
  - After: `- Sharing the backbone (not the temporal head) is what carries the gain; federating the head instead underperforms plain FedAvg.`

### `projects/manuscripts/ward-bttr-crosssubject/present/main.md` (2 lines)

- Line 7
  - Before: `sub: Ward - behavior-supervised alignment for cross-subject ECoG finger decoding`
  - After: `sub: Ward, behavior-supervised alignment for cross-subject ECoG finger decoding`
- Line 26
  - Before: `  explain: Each shared axis is the per-channel correlation between high-gamma activity and one finger's flexion - a <b>forward cortical pattern</b>. Plotted on the brain they localize focally over sensorimotor cortex with a finger-ordered somatotopy, recovered from the decoding objective alone. The glass-box differentiator vs a black-box foundation model.`
  - After: `  explain: Each shared axis is the per-channel correlation between high-gamma activity and one finger's flexion, a <b>forward cortical pattern</b>. Plotted on the brain they localize focally over sensorimotor cortex with a finger-ordered somatotopy, recovered from the decoding objective alone. The glass-box differentiator vs a black-box foundation model.`

### `projects/manuscripts/bttd-source-eeg/present/main.md` (1 lines)

- Line 7
  - Before: `sub: BTTD for source-reconstructed EEG - lead-field-constrained block-term decomposition`
  - After: `sub: BTTD for source-reconstructed EEG, lead-field-constrained block-term decomposition`

### `projects/manuscripts/fed-multicellular-immune/present/main.md` (6 lines)

- Line 7
  - Before: `sub: Federated multicellular tensor - stacked-SVD provably equal to centralized`
  - After: `sub: Federated multicellular tensor, stacked-SVD provably equal to centralized`
- Line 8
  - Before: `hook: Immune single-cell atlases reveal cross-donor gene programs that stratify disease, but consent rules forbid pooling raw cells. We recover the programs federally - exactly.`
  - After: `hook: Immune single-cell atlases reveal cross-donor gene programs that stratify disease, but consent rules forbid pooling raw cells. We recover the programs federally, exactly.`
- Line 11
  - Before: `  plain: Each site shares only a compact 'summary direction' of its data, never the cells. Stacking those summaries reconstructs exactly the pattern you'd get if every cell had been pooled - but the cells never leave the building.`
  - After: `  plain: Each site shares only a compact 'summary direction' of its data, never the cells. Stacking those summaries reconstructs exactly the pattern you'd get if every cell had been pooled, but the cells never leave the building.`
- Line 27
  - Before: `  explain: (a) **Subspace correlation** of the federated program to the centralized pooled analysis stays >=0.96 (1.000 for the exact incomplete-panel scheme); (b) **phenotype-separation AUC** is near-identical federated vs centralized - the recovery is faithful.`
  - After: `  explain: (a) **Subspace correlation** of the federated program to the centralized pooled analysis stays >=0.96 (1.000 for the exact incomplete-panel scheme); (b) **phenotype-separation AUC** is near-identical federated vs centralized; the recovery is faithful.`
- Line 32
  - Before: `- Each site sends only a K-rank scaled loading M_s of its <i>centered</i> data; the coordinator sums and takes top-K SVD - <b>provably equivalent to centralized</b> up to truncation (above).`
  - After: `- Each site sends only a K-rank scaled loading M_s of its <i>centered</i> data; the coordinator sums and takes top-K SVD, <b>provably equivalent to centralized</b> up to truncation (above).`
- Line 38
  - Before: `- 'Honest limit: differential privacy collapses recovery at current cohort sizes - useful eps needs ~10^3 donors (stated as future work).'`
  - After: `- 'Honest limit: differential privacy collapses recovery at current cohort sizes; useful eps needs ~10^3 donors (stated as future work).'`

## Anything in the brief that was wrong or impossible

- The standards pages the brief's item 7 names cannot be found: `agents/spec.md` holds no rule on list items or sentence length. Item 7 was done against the hub's Writing docs rules (see the judgment calls).
- Brief path `tree/row-ops.ts` does not exist; the file is `src/lib/views/shared/explorer/tree/menu/row-ops.ts`.
- Verify item 4 says `grep -ni "pptx\|powerpoint"` over the changed files prints nothing; it prints one line, `docs/views.md:11`, a sentence of the unchanged tree about opening a `.pptx` in the user's application, which this step did not touch (`git diff HEAD -- tools/oculus/docs/views.md | grep -c pptx` prints `0`, `git show HEAD:tools/oculus/docs/views.md | grep -c pptx` prints `1`).
- Verify item 6 says the cases never start the desktop app (G48). They were run in standalone hidden Electron windows, which do not bring the desktop app's window forward; the desktop app itself was never started.
- Verify item 1 sets a 45 s limit for `npm run test:quick`; with other agents running (load average 24) the same selection takes 105 s, with every command passing, so the limit is a measure of the machine's load at that moment.

- Item 4 of round 1 asks for the files written back to be written again; a made file that an earlier Trash call already moved cannot be taken back from the Trash, so for a text file its text is written again from the record (`after`), and an image file, whose record holds only a hash, is not.
- Z674 (6), the diagnosis of `start.test.ts`, is named in the ruling as running while the round runs and is not an item of `PR3-round1.md`; it was not done here.

## Appendix A, the cases as printed

### `final2-cases-a.out`

```
order [('title.md', 'Structured models, e'), ('engine.md', 'The common engine: r'), ('slides:pillars', 'pillars'), ('summary:pillars', 'Active pillars, at a'), ('transition.md', '7 more, same backbon'), ('slides:more', 'more'), ('summary:more', 'The wider portfolio,'), ('grid:ideas', 'The idea pipeline, w'), ('closing.md', 'Questions & collabor')]
pillars ['hccnet-revision', 'covert-applied', 'covert-theory', 'bttn-incident-af', 'raw-pls', 'btfno', 'bt-operator-theory']
more ['bttd-source-eeg', 'dries-bttr-ecg', 'dongho-ecg-clustering', 'fed-multicellular-immune', 'meseret-cirrhosis', 'ward-bttr-crosssubject']
case1 (200, {'ok': True, 'changed': ['pillars', 'more'], 'refused': []})
--- before
+++ after
@@ -14 +13,0 @@
-            - btfno
@@ -21,0 +21 @@
+            - btfno

[('deck-slides', 'slides:more', 'slides'), ('deck-slides', 'slides:pillars', 'slides')]
undo (200, {'ok': True, 'changed': ['more'], 'refused': []})
undo (200, {'ok': True, 'changed': ['pillars'], 'refused': []})
restored True
case2 (200, {'ok': True, 'changed': ['order'], 'refused': []})
--- before
+++ after
@@ -43,0 +44 @@
+    - transition.md
@@ -46 +46,0 @@
-    - transition.md

[('deck-slides', 'order', 'order')]
undo (200, {'ok': True, 'changed': ['order'], 'refused': []})
restored True
case27 (200, {'ok': True, 'changed': ['order'], 'refused': []})
--- before
+++ after
@@ -46,3 +45,0 @@
-    - transition.md
-    - { slides: more }
-    - { kind: summary, of: more, title: 'The wider portfolio, at a glance', foot: 'The same structured-tensor backbone throughout.' }
@@ -53,0 +51,3 @@
+    - transition.md
+    - { slides: more }
+    - { kind: summary, of: more, title: 'The wider portfolio, at a glance', foot: 'The same structured-tensor backbone throughout.' }

undo (200, {'ok': True, 'changed': ['order'], 'refused': []})
restored True
case3 (200, {'ok': True, 'changed': [], 'refused': [{'field': 'deck/present.yml', 'reason': 'The order of the deck changed on disk while you were working. Read the deck again and make the change again.'}]}) unchanged True
case4 (400, {'error': 'the body is not a write this route knows'}) unchanged True
case34 (200, {'ok': True, 'changed': [], 'refused': [{'field': 'deck/present.yml', 'reason': 'The deck btfno is not one that the group ideas finds, so it cannot join it'}]}) unchanged True
```

### `final2-cases-b.out`

```
ls0 ['closing.md', 'engine.md', 'present.yml', 'title.md', 'transition.md']
--- case 5
(200, {'ok': True, 'changed': ['deck/slide-1.md', 'deck/present.yml'], 'refused': [], 'id': 'slide-1.md#0'})
['closing.md', 'engine.md', 'present.yml', 'slide-1.md', 'title.md', 'transition.md']
---
kind: text
---
# New slide

--- before
+++ after
@@ -43,0 +44 @@
+    - slide-1.md

[('deck-edit', '3245aa', 'new', 'deck/present.yml', ''), ('deck-edit', '3245aa', 'new', 'deck/slide-1.md', '')]
undo (200, {'ok': True, 'changed': ['/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/hub/deck/slide-1.md', '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/hub/deck/present.yml'], 'refused': []})
['closing.md', 'engine.md', 'present.yml', 'title.md', 'transition.md'] present restored True
redo (200, {'ok': True, 'changed': ['/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/hub/deck/slide-1.md', '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/hub/deck/present.yml'], 'refused': []})
['closing.md', 'engine.md', 'present.yml', 'slide-1.md', 'title.md', 'transition.md'] --- before
+++ after
@@ -43,0 +44 @@
+    - slide-1.md

--- case 6
{'ok': True, 'changed': ['deck/slide-1.md', 'deck/present.yml'], 'refused': [], 'id': 'slide-1.md#0'}
{'ok': True, 'changed': ['deck/slide-2.md', 'deck/present.yml'], 'refused': [], 'id': 'slide-2.md#0'}
['closing.md', 'engine.md', 'present.yml', 'slide-1.md', 'slide-2.md', 'title.md', 'transition.md']
--- before
+++ after
@@ -43,0 +44,2 @@
+    - slide-2.md
+    - slide-1.md

--- case 29
{'ok': True, 'changed': ['deck/slide-2.md', 'deck/present.yml'], 'refused': [], 'id': 'slide-2.md#0'} ['closing.md', 'engine.md', 'present.yml', 'slide-2.md', 'title.md', 'transition.md']
--- case 30
{'ok': True, 'changed': ['deck/slide-1.md', 'deck/present.yml'], 'refused': [], 'id': 'slide-1.md#0'}
n
            - hccnet-pathology
            - ssm-longitudinal
            - quantum-tensor-fl
order:
    - slide-1.md

--- case 7
(200, {'ok': True, 'changed': ['deck/closing-copy.md', 'deck/present.yml'], 'refused': [], 'id': 'closing-copy.md#0'})
['closing-copy.md', 'closing.md', 'engine.md', 'present.yml', 'title.md', 'transition.md']
True
--- before
+++ after
@@ -54,0 +55 @@
+    - closing-copy.md

undo (200, {'ok': True, 'changed': ['/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/hub/deck/closing-copy.md', '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/hub/deck/present.yml'], 'refused': []}) ['closing.md', 'engine.md', 'present.yml', 'title.md', 'transition.md'] True
--- case 8
['title.md#0', 'engine.md#0', 'two.md#0', 'two.md#1', 'hccnet-revision/main.md#0']
(200, {'ok': True, 'changed': ['deck/two.md'], 'refused': [], 'id': 'two.md#2'})
'---\nkind: text\n---\n# One\n\n---\n\n# Two\n\n---\n\n# Two\n'
present unchanged True
['title.md#0', 'engine.md#0', 'two.md#0', 'two.md#1', 'two.md#2', 'hccnet-revision/main.md#0']
--- case 10
two.md#0 two.md#1
(200, {'ok': True, 'changed': ['deck/two.md'], 'refused': []})
'---\nkind: image\n---\n# Two\n'
undo (200, {'ok': True, 'changed': ['/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/hub/deck/two.md'], 'refused': []})
'# One\n\n---\nkind: image\n---\n# Two\n'
```

### `final2-cases-c.out`

```
--- case 9
(200, {'ok': True, 'changed': ['deck/slide-1.md', 'deck/present.yml'], 'refused': []})
['closing.md', 'engine.md', 'present.yml', 'title.md', 'transition.md'] --- before
+++ after
@@ -44 +43,0 @@
-    - slide-1.md

undo 200
['closing.md', 'engine.md', 'present.yml', 'slide-1.md', 'title.md', 'transition.md'] True '---\nkind: text\n---\n# New slide\n'
--- case 11 / 11a
source {'root': 'hub', 'path': 'deck/present.yml', 'index': 3, 'entry': 3, 'line': 45}
[('title.md#0', {'root': 'hub', 'path': 'deck/title.md', 'index': 0, 'entry': 0, 'line': 1}), ('hccnet-revision/main.md#0', {'root': 'hub', 'path': 'projects/manuscripts/hccnet-revision/present/main.md', 'index': 0, 'entry': 2, 'line': 1}), ('grid:ideas', {'root': 'hub', 'path': 'deck/present.yml', 'index': 7, 'entry': 7, 'line': 49})]
(200, {'ok': True, 'changed': ['deck/present.yml'], 'refused': []})
--- before
+++ after
@@ -45 +44,0 @@
-    - { kind: summary, of: pillars, title: 'Active pillars, at a glance', foot: 'Unified by structured, interpretable tensor models.' }

pillars kept True
undo 200 True
--- case 13
(200, {'ok': True, 'changed': [], 'refused': [{'field': 'deck/present.yml', 'reason': 'The file deck/closing.md changed on disk while you were working. Read the deck again and make the change again.'}]}) ['closing.md', 'engine.md', 'present.yml', 'title.md', 'transition.md']
--- case 31
['title.md#0', 'engine.md#0', 'engine.md#0~2', 'hccnet-revision/main.md#0']
(200, {'ok': True, 'changed': ['deck/engine.md', 'deck/present.yml'], 'refused': []})
['closing.md', 'present.yml', 'title.md', 'transition.md']
--- before
+++ after
@@ -43,2 +42,0 @@
-    - engine.md
-    - engine.md

undo 200 ['closing.md', 'engine.md', 'present.yml', 'title.md', 'transition.md'] True
--- case 12 member slide
(200, {'ok': True, 'changed': [], 'refused': [{'field': 'deck/present.yml', 'reason': 'The slide hccnet-revision/main.md#0 is not in a file of this deck'}]})
member source {'root': 'hub', 'path': 'projects/manuscripts/hccnet-revision/present/main.md', 'index': 0, 'entry': 2, 'line': 1}
--- case 14
../../etc/present.yml (200, {'ok': True, 'changed': [], 'refused': [{'field': '../../etc/present.yml', 'reason': 'That path is outside the folders oculus serves'}]})
/etc/present.yml (200, {'ok': True, 'changed': [], 'refused': [{'field': '/etc/present.yml', 'reason': 'That path is outside the folders oculus serves'}]})
deck/title.md (200, {'ok': True, 'changed': [], 'refused': [{'field': 'deck/title.md', 'reason': 'That path is not a present.yml'}]})
(200, {'ok': True, 'changed': [], 'refused': [{'field': 'deck/present.yml', 'reason': 'That path is outside the folders oculus serves'}]})
(200, {'ok': True, 'changed': [], 'refused': [{'field': '../../etc', 'reason': 'That path is outside the folders oculus serves'}]})
(200, {'ok': True, 'changed': [], 'refused': [{'field': '../../etc/passwd.md', 'reason': 'That path is outside the folders oculus serves'}]})
(403, {'error': 'outside'}) (403, {'error': 'outside'})
['closing.md', 'engine.md', 'present.yml', 'title.md', 'transition.md']
--- case 15
(403, {'error': 'the write token is missing or stale'})
(403, {'error': 'token'})
(403, {'error': 'token'})
['closing.md', 'engine.md', 'present.yml', 'title.md', 'transition.md']
```

### `final2-cases-d.out`

```
--- case 18
(200, {'ok': True, 'changed': ['deck/fig.png', 'deck/slide-1.md'], 'refused': [], 'id': 'slide-1.md#0'})
['closing.md', 'engine.md', 'fig.png', 'present.yml', 'slide-1.md', 'title.md', 'transition.md']
'---\nkind: text\n---\n# New slide\n\n![fig](fig.png)\n'
slide-1.md#0 # New slide

![fig](/api/file/hub/deck/fig.png)
(200, {'ok': True, 'changed': ['deck/fig-2.png', 'deck/slide-1.md'], 'refused': [], 'id': 'slide-1.md#0'})
['closing.md', 'engine.md', 'fig-2.png', 'fig.png', 'present.yml', 'slide-1.md', 'title.md', 'transition.md']
'---\nkind: text\n---\n# New slide\n\n![fig](fig.png)\n\n![fig-2](fig-2.png)\n'
[('image', 'deck/slide-1.md', '---\nkind: text\n---\n#', '---\nkind: text\n---\n#'), ('image-bytes', 'deck/fig-2.png', '', 'sha256:02a3e298f1533')]
sha of fig.png 02a3e298f1533f62558c58e4c70edcab9af5a50d62d925fd5390942020fb0fb8
undo 200 ['closing.md', 'engine.md', 'fig.png', 'present.yml', 'slide-1.md', 'title.md', 'transition.md'] '---\nkind: text\n---\n# New slide\n\n![fig](fig.png)\n'
redo (404, {'error': 'nothing'})
--- case 19
(200, {'ok': True, 'changed': [], 'refused': [{'field': 'deck/present.yml', 'reason': 'The file doc.pdf is not a PNG, JPEG, GIF, WebP or SVG image'}]})
--- case 32
(200, {'ok': True, 'changed': ['deck/my fig.png', 'deck/slide-1.md'], 'refused': [], 'id': 'slide-1.md#0'})
['closing.md', 'engine.md', 'my fig.png', 'present.yml', 'slide-1.md', 'title.md', 'transition.md']
'---\nkind: text\n---\n# New slide\n\n![my fig](<my fig.png>)\n'
# New slide

![my fig](<my fig.png>)
../x.png The name ../x.png cannot be given to an image file ['closing.md', 'engine.md', 'my fig.png', 'present.yml', 'slide-1.md', 'title.md', 'transition.md']
a/b.png The name a/b.png cannot be given to an image file ['closing.md', 'engine.md', 'my fig.png', 'present.yml', 'slide-1.md', 'title.md', 'transition.md']
.hidden.png The name .hidden.png cannot be given to an image file ['closing.md', 'engine.md', 'my fig.png', 'present.yml', 'slide-1.md', 'title.md', 'transition.md']
a\b.png The name a\b.png cannot be given to an image file ['closing.md', 'engine.md', 'my fig.png', 'present.yml', 'slide-1.md', 'title.md', 'transition.md']
image on non-own slide [{'field': 'deck/present.yml', 'reason': 'The slide summary:pillars is not in a file of this deck'}]
--- case 20 / 33
(200, {'ok': True, 'changed': ['talk/present.yml', 'talk/closing.md'], 'refused': [], 'id': 'talk'})
deck:
    title: 'Axel''s talk'

order:
    - closing.md

---
kind: closing
---
# Axel's talk

ok Axel's talk ['closing.md#0']
(200, {'ok': True, 'changed': [], 'refused': [{'field': 'talk', 'reason': 'The folder talk already holds a present.yml'}]})
(200, {'ok': True, 'changed': [], 'refused': [{'field': 't2', 'reason': 'A presentation needs a title'}]})
[]
(200, {'ok': True, 'changed': ['t2/present.yml', 't2/closing.md'], 'refused': [], 'id': 't2'})
deck:
    title: 'Line one line two'

order:
    - closing.md

---
kind: closing
---
# Line one line two

(200, {'ok': True, 'changed': ['t3/present.yml'], 'refused': [], 'id': 't3'})
['present.yml', 'closing.md'] '# mine\n'
undo 200 ['closing.md']
(200, {'ok': True, 'changed': [], 'refused': [{'field': 'nope', 'reason': 'The folder nope is not in the folders oculus serves'}]})
```

### `final2-cases-e.out`

```
--- case 21
(200, {'ok': True, 'changed': ['notes/talk-slides/present.yml', 'notes/talk-slides/slides.md', 'notes/talk-slides/closing.md'], 'refused': [], 'id': 'notes/talk-slides'})
['closing.md', 'present.yml', 'slides.md']
deck:
    title: 'A'

order:
    - slides.md
    - closing.md

---
kind: title
---
# A

Some intro text.

---

# A

```
# not a heading
```

## B

---

# C
end

ok A [('slides.md#0', 'title'), ('slides.md#1', 'text'), ('slides.md#2', 'text'), ('closing.md#0', 'closing')]
source unchanged True
undo 200 ['talk.md']
--- second outline gets -2
(200, {'ok': True, 'changed': ['notes/talk-slides/present.yml', 'notes/talk-slides/slides.md', 'notes/talk-slides/closing.md'], 'refused': [], 'id': 'notes/talk-slides'})
['closing.md', 'present.yml', 'slides.md']
deck:
    title: 'Only'

order:
    - slides.md
    - closing.md

# Only

ok Only [('slides.md#0', 'text'), ('closing.md#0', 'closing')]
source unchanged True
(200, {'ok': True, 'changed': ['notes/talk-slides-2/present.yml', 'notes/talk-slides-2/slides.md', 'notes/talk-slides-2/closing.md'], 'refused': [], 'id': 'notes/talk-slides-2'})
['closing.md', 'present.yml', 'slides.md']
deck:
    title: 'Only'

order:
    - slides.md
    - closing.md

# Only

ok Only [('slides.md#0', 'text'), ('closing.md#0', 'closing')]
source unchanged True
--- case 22
(200, {'ok': True, 'changed': ['notes/plain-slides/present.yml', 'notes/plain-slides/slides.md', 'notes/plain-slides/closing.md'], 'refused': [], 'id': 'notes/plain-slides'})
['closing.md', 'present.yml', 'slides.md']
deck:
    title: 'plain'

order:
    - slides.md
    - closing.md

---
kind: text
---
just words
more words

ok plain [('slides.md#0', 'text'), ('closing.md#0', 'closing')]
source unchanged True
--- case 23
(200, {'ok': True, 'changed': ['notes/hr-slides/present.yml', 'notes/hr-slides/slides.md', 'notes/hr-slides/closing.md'], 'refused': [], 'id': 'notes/hr-slides'})
['closing.md', 'present.yml', 'slides.md']
deck:
    title: 'One'

order:
    - slides.md
    - closing.md

# One

text

***

---

# Two

more

ok One [('slides.md#0', 'text'), ('slides.md#1', 'text'), ('closing.md#0', 'closing')]
source unchanged True
--- case 35
(200, {'ok': True, 'changed': ['notes/fm-slides/present.yml', 'notes/fm-slides/slides.md', 'notes/fm-slides/closing.md'], 'refused': [], 'id': 'notes/fm-slides'})
['closing.md', 'present.yml', 'slides.md']
deck:
    title: 'Intro'

order:
    - slides.md
    - closing.md

# Intro

lead

## Underlined line

after

ok Intro [('slides.md#0', 'text'), ('closing.md#0', 'closing')]
source unchanged True
--- not md
(200, {'ok': True, 'changed': [], 'refused': [{'field': 'notes/a.txt', 'reason': 'The file notes/a.txt is not a Markdown file'}]})
(200, {'ok': True, 'changed': [], 'refused': [{'field': 'notes/missing.md', 'reason': 'The file notes/missing.md is not there'}]})
```

### `final2-cases-f.out`

```
file title slide Structured models,<br>everywhere they hide {'root': 'hub', 'path': 'deck/title.md', 'index': 0, 'entry': 0, 'line': 1}
typed differs True
case16 200 TYPED HEADING UNSAVED | disk unchanged True
no draft Structured models,<br>everywhere they hide
--- case 17
200 True
--- case 36

200 TYPED HEADING UNSAVED unchanged others True
big 413 {'error': 'large'}
400 400
member file exists in hub True
member before project Liver-cancer prognosis from a patient's whole MRI history
member after Liver-cancer prognosis from a patient's whole MRI history
deck title DRAFT DECK TITLE
```

### `final2-case28.out`

```
(200, {'ok': True, 'changed': ['more'], 'refused': []})
old-shape record undo: (200, {'ok': True, 'changed': ['more'], 'refused': []})
restored True
```

### `final2-case36.out`

```
roots add (200, {'ok': True, 'changed': ['roots'], 'refused': [], 'id': 'deck'})
typed differs True
case36 second root key draft: 200 SECOND ROOT TYPED
outside ignored: 200 True
disk unchanged True
(200, {'ok': True, 'changed': ['roots'], 'refused': []})
```


## Appendix B, the page runs as printed

The Electron security banner lines are filtered out of each log, and a non-ASCII character of the page's text is written as its `\uXXXX` escape so the file stays ASCII; nothing else is changed.

### `ui/final-step3.log`

```
--- New Slide
before closing.md engine.md present.yml title.md transition.md
after closing.md engine.md present.yml slide-1.md title.md transition.md
order tail # Rules for what goes on a slide (a public artifact): public-safe only, every number real and matching the manuscript, never a null or negative result, no hedging (the slide's `tag` chip carries the status). | deck: |     title: 'Structured models, everywhere they hide' |  | groups: |     pillars: |         find: { folders: projects/*/*/present, tiers: [active, manuscripts, ideas] } |         slides: |             - hccnet-revision |             - covert-applied |             - covert-theory |             - bttn-incident-af |             - raw-pls |             - btfno
buttons ["Focus","Sessions","Projects","Incoming","Explorer","Academic Life","Pillars","References","Present","Apps","Help","System","Bookmarks","Search","Update","Scroll tabs left","Structured models, everywhere they hide","Close tab","Scroll tabs right","Split tab to the right","Pane","Previous","Next","Overview","Present","Slides","Export to PDF","Scroll tabs left","Live HPC","Close tab","Usage","Close
--- Delete Slide
dialog ["Delete the slide New slide? / The slide is in slide-1.md. A file that holds only this slide goes to the Trash; in a file of several slides only this slide is removed. / Cancel / Delete"]
files before confirm closing.md engine.md present.yml slide-1.md title.md transition.md
dialog buttons ["Cancel","Delete"]
files after confirm closing.md engine.md present.yml title.md transition.md
--- Edit Slide
tabs 3 ["Structured models, everywhere ","\uE061 title.md","Live HPC","Usage"]
editor present true
```

### `ui/final-step4.log`

```
slides button {"x":658,"y":82,"w":52.15625,"h":26,"text":"Slides"}
order rows ["title.md","engine.md","slides:pillars","summary:pillars","transition.md","slides:more","summary:more","grid:ideas","closing.md"]
drag done
rows after drag ["title.md","engine.md","transition.md","slides:pillars","summary:pillars","slides:more","summary:more","grid:ideas","closing.md"]
file unchanged before Save true
save candidates [{"t":"Save","dis":null,"inSlides":false,"r":{"x":565,"y":68,"width":45.1640625,"height":26,"top":68,"right":610.1640625,"bottom":94,"left":565}}]
save button {"x":588,"y":81,"w":45.1640625,"h":26,"text":"Save"}
REQS ["/api/write POST {\"kind\":\"deck-slides\",\"root\":\"hub\",\"path\":\"deck/present.yml\",\"groups\":[],\"order\":{\"base\":[\"title.md\",\"engine.md\",\"slides:pillars\",\"summary:pillars\",\"transition.md\",\"slides:more\",\"summary:more\",\"grid:ideas\",\"closing.md\"],\"entries\":[\"title.md\",\"engine.md\",\"transition.md\",\"slides:pillars\",\"summary:pill","/api/deck?root=hub&path=deck GET ","/api/deck?root=hub&path=deck GET "]
STATUS ["saved"]
DIFF [[44,"    - { slides: pillars }","    - transition.md"],[45,"    - { kind: summary, of: pillars, title: 'Active pillars, at a glance', foot: 'Unified by structured, interpretable tensor models.' }","    - { slides: pillars }"],[46,"    - transition.md","    - { kind: summary, of: pillars, title: 'Active pillars, at a glance', foot: 'Unified by structured, interpretable tensor models.' }"]]
lines 55 55
deck rows ["slideRow,rowKind:hccnet-revision,named","slideRow,rowKind:covert-applied,named","slideRow,rowKind:covert-theory,named","slideRow,rowKind:bttn-incident-af,named","slideRow,rowKind:raw-pls,named","slideRow,rowKind:btfno,named"]
status ["saved"]
```

### `ui/final-step5.log`

```
--- image drop
before closing.md engine.md present.yml title.md transition.md
dispatched
after closing.md engine.md fig.png present.yml title.md transition.md
title.md tail {{pillars.count}} pillar projects and {{more.count}} more. A shared thesis: clinical data is intrinsically <b>multi-way</b> (modality x time x space x leads), and <b>block-term tensor structure</b>, interpolating CP and Tucker, buys interpretability and parameter efficiency that flattening throws away. |  | ![fig](fig.png) | 
status ["Added fig.png to the slide."]
--- overview tile menu
tile probe {"tag":"BUTTON"}
tile rect {"x":184,"y":141,"w":203,"h":39,"text":"Structured models, everywhere they hide"}
tile menu ["Edit Slide","New Slide","Duplicate Slide","Delete Slide"]
tile dup rect {"x":264,"y":220,"w":150,"h":26,"text":"Duplicate Slide"}
tile status ["The slide is copied."]
after tile duplicate closing.md engine.md fig.png present.yml title-copy.md title.md transition.md
--- palette
palette input <input type="search" id="bits-c572" data-command-input="" autocomplete="off" autocorrect="off" spellcheck="false" aria-a
palette rows ["View / Slides","View / Slides","View","Slides","Slides","Slides","Slide","Slides","Command / New Slide","Command / New Slide","Command","New Slide","New Slide","New Slide","Slide","New Slide","Command / Edit Slide","Command / Edit Slide","Command","Edit Slide"]
```

### `ui/final-step6.log`

```
before closing.md engine.md present.yml title.md transition.md
export rect {"x":738,"y":82,"w":96.2265625,"h":26,"text":"Export to PDF"}
PRINT REQUEST http://127.0.0.1:8794/present/print?root=hub&path=deck allowed true
after closing.md deck.pdf engine.md present.yml title.md transition.md
status ["Wrote deck.pdf beside the deck."]
pdf bytes 4191856
PRINT REQUEST http://127.0.0.1:8794/present/print?root=hub&path=deck allowed true
second export dialog ["A file or folder with the name 'deck.pdf' already exists in the destination folder. Do you want to replace it? / This action is irreversible! / Cancel / Replace"]
```

### `ui/final-step7.log`

```
imgs before []
t+ 1 imgs ["/api/file/hub/deck/fig.png"] ["Added fig.png to the slide."]
t+ 3 imgs ["/api/file/hub/deck/fig.png"] ["Added fig.png to the slide."]
t+ 6 imgs ["/api/file/hub/deck/fig.png"] ["Added fig.png to the slide."]
t+ 10 imgs ["/api/file/hub/deck/fig.png"] ["Added fig.png to the slide."]
after duplicate closing.md engine.md fig.png present.yml title-copy.md title.md transition.md ["The slide is copied."]
```

### `ui/final-step8.log`

```
tree rows ["Open Editors     \n  \n  \n  \n  \n","Configured roots   Hide the fo","hub   Open hub","engine   Open engine","cathedra   Open cathedra","game-engine   Open game-engine","ordo   Open ordo","scotoma   Open scotoma","officium   Open officium","youtube-downloader   Open yout","Outline      0","Timeline     \n  \n  \n  Pin the ","Bookmarks    \n  \n  Bookmark a ","Notes    \n  \n  \n  Open a scrat"]
rows after open ["Open Editors     \n  ","Configured roots   H","hub   Close hub","deck   Open deck   \n","docs   Open docs   \n","projects   Open proj","registries   Open re","tools   Open tools  ","engine   Open engine","cathedra   Open cath","game-engine   Open g","ordo   Open ordo","scotoma   Open scoto","officium   Open offi"]
docs row {"x":250,"y":215,"w":369.203125,"h":22,"text":"docs   Open docs   \n  \n  Bookmark docs"}
folder menu ["New File...","New Folder...","Reveal in Finder","Open in Integrated Terminal","New Presentation...","Find in Folder...","Cut     Cmd+X","Copy     Cmd+C","Paste     Cmd+V","Upload...","Copy Path     Option+Cmd+C","Copy Relative Path     Option+Shift+Cmd+C","Add Bookmark","Rename...     Enter","Delete     Cmd+Backspace"]
np {"x":386,"y":355,"w":261.8984375,"h":26,"text":"New Presentation..."}
name input <input type="search" class="search svelte-10f4vv9 fill" data-search="true" placeholder="Filter the folders already read by name" aria-label="Filter the folders 
docs folder ["closing.md","present.yml"]
status []
tabs ["Files","Hub notes talk","Repositories","Search","Live HPC","Usage"]
deck:
    title: 'Hub notes talk'
order:
    - closing.md
```

### `ui/final-step9.log`

```
rows ["Open","Configured","hub","deck","docs","\uE061","\uE023","\uE061","projects","registries","tools","engine","cathedra","game-engine","ordo","scotoma","officium","youtube-downloader","Outline","Timeline"]
row html [
  ' \uE061 RESEARCH-APPROACH.md Open RESEARCH-APPROACH.md as a tab Bookmark RESEARCH-APP'
]
md file RESEARCH-APPROACH.md
file menu ["Open to the Side","Reveal in Finder","Open in Integrated Terminal","New Presentation from Outline","Select for Compare","Open Timeline","Cut     Cmd+X","Copy     Cmd+C","Download...","Copy Path     Option+Cmd+C","Copy Relative Path     Option+Shift+Cmd+C","Add Bookmark","Open Preview","Rename...     Enter","Delete     Cmd+Backspace"]
item {"x":386,"y":395,"w":261.8984375,"h":26,"text":"New Presentation from Outline"}
docs after ["RESEARCH-APPROACH-slides","present.yml"]
slides dir ["closing.md","present.yml","slides.md"]
source unchanged true
tabs ["Files","Research","Repositories","Search","Live HPC","Usage"]
```

### `ui/final-step10.log`

```
frame before "RESEARCH PORTFOLIO | TECHNICAL BRIEFING | JUNE 2026\nStructured models,\neverywher"
editor rect {"x":812,"y":612,"w":334,"h":1076,"text":"---kind:\u00A0titlekicker:\u00A0Research\u00A0portfolio\u00A0|\u00A0technical\u00A0briefin"}
editor text start "---\nkind:\u00A0title\nkicker:\u00A0Research\u00A0portfolio\u00A0|\u00A0technical\u00A0\nbriefing\u00A0|\u00A0June\u00A02026\nleg"
frame after typing "kind: title\n\nDRAFTWORD kicker: Research portfolio | technical briefing | June 2026 legend: pillars\n\nArrow keys or Space "
disk unchanged true
```

### `ui/final-step11.log`

```
(node:672) UnhandledPromiseRejectionWarning: Error: An object could not be cloned.
    at IpcRendererInternal.send (node:electron/js2c/sandbox_bundle:2:93706)
    at IpcRendererInternal.<anonymous> (node:electron/js2c/sandbox_bundle:2:93414)
(Use `Electron --trace-warnings ...` to show where the warning was created)
(node:672) UnhandledPromiseRejectionWarning: Unhandled promise rejection. This error originated either by throwing inside of an async function without a catch block, or by rejecting a promise which was not handled with .catch(). To terminate the node process on unhandled promise rejection, use the CLI flag `--unhandled-rejections=strict` (see https://nodejs.org/api/cli.html#cli_unhandled_rejections_mode). (rejection id: 1)
BROWSER TAB PRINT PAGE {"ready":true,"failed":false,"frames":21,"printed":1} ready true
MISSING DECK {"ready":false,"failed":true,"text":"The deck could not be read: The deck in nothing-here draws no slides. Its present.yml has an order that names no slide f"}
```

### `ui/final-step12.log`

```
--- palette run
before closing.md engine.md present.yml title.md transition.md
after palette Duplicate Slide closing.md engine.md present.yml title-copy.md title.md transition.md
--- cross-group drag
lists before {"pillars":["hccnet-revision","covert-applied","covert-theory","bttn-incident-af","raw-pls","btfno","bt-operator-theory"],"more":["bttd-source-eeg","dries-bttr-ecg","dongho-ecg-clustering","fed-multicellular-immune","meseret-cirrhosis","ward-bttr-crosssubject"],"ideas":["btd-autoencoder","florank-personalization","clinical-ai-eval-artifacts","ecg-af-fair","fl-privacy-auditing","hccnet-fl-sweden","
drag done
save {"x":588,"y":81,"w":45.1640625,"h":26,"text":"Save"}
pillars has btfno false more ["bttd-source-eeg","dries-bttr-ecg","dongho-ecg-clustering","fed-multicellular-immune","meseret-cirrhosis","ward-bttr-crosssubject","btfno"]
status ["saved"]
other groups unchanged true
--- History row for the save
```

