NOT done: everything in items 1 to 15. The builder stopped at the first run, before any change to source code, because two rules of the brief give a result that the brief's own sources contradict: case 31 against item 8 on Copy for a root (VS Code's `fileActions.contribution.ts:548-556`), and the name length rule of item 1, case 4 and case 33, which counts bytes where VS Code counts characters and where this machine's volume accepts names that the rule refuses. The rulings needed are below under "Cases the brief's rules get wrong". The only changes in the tree are `package.json` (`trash`), `package-lock.json`, and the case tests listed under "Files".

## Open items of the state file (verbatim, `.scratch/migration/orchestrator-state.md` lines 125-127)

- Z146 (raised 2026-10-01, step U2, its audit's "Proposed grouping", `agents/reviews/U2-audit.md:1126-1138`). How the audit's seven groups become build steps. The groups: 1 the header frame (22 px, one line, title cut with an ellipsis, actions on one line with an overflow menu); 2 control sizes (text button 26 px radius 4px, icon action 20 px with a 16 px glyph and no border, input 26 px, one 1px focus ring); 3 type and row scale (base text 13px, rows 22 px, tree indent 8 px with a 16 px twistie, off-scale sizes removed); 4 icons at 16 px (Z148); 5 row and card actions shown on hover or focus-within; 6 collections as rows (Z147); 7 empty, error and narrow states. The measured footprint of the shared parts: `ui/frame/Pane.svelte` 127 lines and `Toolbar.svelte` 30, used by 51 components; `ToolButton.svelte` 506 lines, used by 137; `ui/frame/Card.svelte` 233 lines, used by 20; 414 of the 442 `font-size` declarations under `src/lib` go through the nine `--fs-*` tokens of `themes/tokens.css`; 13 view files set a fixed px height (`grep -rl`/`grep -rho` over `src/lib`, `wc -l`). (a) One step for groups 1, 2, 3 and 5, which change the shared components and tokens above and so touch the same few files; then group 4 once Z148 is ruled, group 7, and group 6 once Z147 is ruled: four steps. For: no tiny steps; each shared change lands once and is looked at once on TEST. Against: one review covers four kinds of change. (b) Seven steps, one per group, in the order 1, 2, 3, 5, 4, 7, 6. For: each review reads one kind of change. Against: four of them are small edits to the same files. (c) No build steps: the audit stays a record. For: no work. Against: every difference it measured stays. Recommendation: (a). The lazy option is (c). Settings is S3c's, the tab strip X3c's, and the X3d parts of Changes are outside every group.
- Z147 (raised 2026-10-01, step U2, group 6 and differences 7, 10 and 15 of `agents/reviews/U2-audit.md`). Collections drawn as cards (radius 10px, a 3px coloured left rule for the status, 285 to 352 px wide, 15px titles) where VS Code draws 22 px rows with a 13px label and a count badge; it holds for projects, coauthor, archive, pillars, domains, venues, data, code, statements, funding, events, education, applications, joint-work, tasks, radar, leads, inbox, linkedin, usage, gallery, audit, config and project. (a) Rows everywhere: each collection view a list of 22 px rows with a count badge, links without the underline. For: one look across the workbench, as VS Code's. Against: the status rule of a card and the card's room for several lines of detail are lost; the largest change of the audit. (b) Rows on Projects first, looked at on TEST and shown to you, and the other views follow your ruling on it. For: you judge the change on one real view before it spreads. Against: one more look and ruling before the rest is built. (c) Keep the cards and restyle only their controls (groups 2 and 5). For: the cards keep what they show. Against: the views stay unlike VS Code's lists. Recommendation: (b). The lazy option is (c).
- Z148 (raised 2026-10-01, step U2, group 4 and difference 19 of `agents/reviews/U2-audit.md:1124`). Icons are Lucide (`DESIGN.md` "Theming"), drawn at 1em of the text beside them, so 9.5 to 15 px, mostly 11.5 px; VS Code's codicons are 16 x 16 px (`U2-vscode.css` css:241, css:252, css:133). (1) Keep Lucide and draw every icon at 16 px. For: DESIGN.md's decision stands and only the size rule changes. Against: the glyph shapes stay Lucide's, unlike VS Code's. (2) Replace the set with codicons through `config/catalogs/icons.yml`. For: glyph for glyph as VS Code. Against: every glyph id is re-mapped, several domain icons have no codicon, and it reverses DESIGN.md's decision. Recommendation: (1). The lazy option is leaving the icons at the size of their text.

## Cases the brief's rules get wrong (the stop of "Cases")

### 1. Case 31 against item 8: does a root offer Copy

- The rule in case 31: "a root the same [as a folder] without Cut, Rename... and Delete". A folder holds Copy, so the case gives a root Copy.
- The rule in item 8: "a file and a folder (not a root): Cut, Copy" and "Rename..., Delete". It gives a root no Copy.
- The source both cite, `fileActions.contribution.ts` at e4f7a6f2: Copy is registered at lines 548-556 with `when: ExplorerRootContext.toNegated()`, Cut at 539-546 with `ExplorerRootContext.toNegated()` and the writable condition, Rename at 638-645 and Delete at 649-669 with `ExplorerRootContext.toNegated()`, Paste at 559-566 with `ExplorerFolderContext`. A root therefore has Paste and no Cut, Copy, Rename or Delete in VS Code.
- Result the rules give for a root: case 31's sentence makes Copy part of a root's menu, item 8 and VS Code leave it out. The test of the root menu (`tests/views/sources/files/files-menu.test.ts`, "offers a root the folder items VS Code gives a workspace folder") asserts what both agree on and leaves Copy on a root unasserted until this is ruled.
- Option A: follow item 8 and VS Code. A root offers New File..., New Folder..., Upload..., Paste, Find in Folder..., and the existing root items; no Cut, Copy, Rename... or Delete. Case 31's sentence becomes "a root the same without Cut, Copy, Rename... and Delete". For: parity with VS Code, which Axel's rulings ask for; Copy of a whole root has no use the Files view offers. Against: none found.
- Option B: follow case 31's sentence. A root offers Copy. For: nothing in the brief's text beyond that sentence. Against: departs from VS Code at a line the brief cites; Copy of a root then needs its own behaviour (a root copied into itself is `into_itself`, the engine root is `protected`).
- Recommendation: A. The lazy option is B, because it leaves case 31 as written without reading the source.

### 2. Item 1, case 4 and case 33: a segment longer than 255 bytes

- The rule in item 1: "each segment ... longer than 255 bytes is refused". Case 4 and `tests/data/file-ops.test.ts` use "a 256-byte segment" and 128 two-byte letters.
- The source item 1 cites, `fileActions.ts:714-770` (`validateFileName`), calls `pathService.hasValidBasename`, which is `isValidBasename` in `src/vs/base/common/extpath.ts:169-202`: line 197 is `if (name.length > 255)`, a length in UTF-16 units, not bytes.
- The volume of this machine (APFS, `mount` prints `/dev/disk3s3s1 on / (apfs, sealed, local, read-only, journaled)`), probed with `writeFileSync` in a directory under `$TMPDIR` (`scratchpad/probe-len.mjs`):
  - 255 ASCII letters: created. 256 ASCII letters: `ENAMETOOLONG`.
  - 128 x `e` with acute (256 bytes): created.
  - 255 x `e` with acute (510 bytes, 255 characters): created. 256 of them (512 bytes): `ENAMETOOLONG`.
  - 100 CJK characters (300 bytes): created. 255 of them (765 bytes): created. 256 of them: `ENAMETOOLONG`.
- Result the rule gives: the byte rule refuses a name of 100 Japanese characters (300 bytes), which the volume takes and VS Code takes. The macOS limit is 255 characters.
- Option A: count the segment's length in characters, as VS Code does (`name.length > 255`); the server still maps `ENAMETOOLONG` to `invalid_name`, so a name the volume refuses is refused in either case. Case 4 becomes "a 256-character segment", case 33's `e` x 128 is accepted and `e` x 256 is refused. For: parity with VS Code and with what the volume takes. Against: none found.
- Option B: keep bytes. For: none. Against: refuses legal names such as a long non-Latin title.
- Recommendation: A. The lazy option is B, because it keeps the brief's wording and the already written data test.

## The cases' first run

Command, from `tools/oculus` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`: `npx vitest run --reporter=json --outputFile=<scratch>/q88b-first-run.json` over the eleven files below, on the tree with `package.json`, `package-lock.json` and these tests as the only changes (`git status --short` lists exactly those). Totals: 202 tests, 137 passed, 65 failed, 4 test files that could not load their module.

Cases 1-28 (`tests/server/files/ops.test.ts`, 890 lines): the file does not load, `Cannot find module '/src/lib/data/file-ops.ts'` (and `server/files/fs/ops.ts` is absent too); every case is red.
Case 33 (`tests/data/file-ops.test.ts`, 130 lines): does not load, `Cannot find module '../../src/lib/data/file-ops.ts'`; red.
Case 41 and the words (`tests/views/sources/files/files-ops.test.ts`, 326 lines): does not load, same module; red.

Case 29 (`tests/routes/files/open-program.test.ts`, `tests/routes/files/open.test.ts`):
- PASS: Reveal in Finder for a file reveals a file or a folder with -R, the path last
- FAIL: Reveal in Finder for a file takes a real file and a real folder, whatever the file is and has | AssertionError: expected false to be true // Object.is equality
- FAIL: Reveal in Finder for a file refuses a path that is missing, relative, not its own real path or an option | AssertionError: expected false to be true // Object.is equality
- FAIL: Reveal in Finder for a file hands the opener a reveal for a file the endpoint is asked to reveal, one with no application too | AssertionError: plain.unlisted: expected 403 to be 200 // Object.is equality
- PASS: Reveal in Finder for a file reveals a folder asked for with reveal, and refuses a missing path, a path out of its root and a root not served
- PASS: Reveal in Finder for a file still opens a file in its application when the body does not ask to reveal it
- FAIL: the reveal client posts a file by its root and path with reveal: true to the open endpoint with the token | TypeError: client.writes.revealPath is not a function

Case 30 (`tests/data/helpers/search.test.ts`, `tests/server/files/search.test.ts`):
- FAIL: the folder a search is scoped to opens a fresh query on the whole root | AssertionError: expected undefined to be '' // Object.is equality
- FAIL: the folder a search is scoped to ends the arguments with the folder as ./<under>, and with . for the whole root | AssertionError: expected [ '--regexp', 'needle', '.' ] to deeply equal [ '--regexp', 'needle', './src/lib' ]
- FAIL: the folder a search is scoped to refuses a folder that climbs out or is absolute, and any folder with every root | AssertionError: expected { under: '../x', why: null } to deeply equal { under: '../x', why: 'outside' }
- FAIL: the folder a search is scoped to answers a plan with the refusal for a folder that climbs out | AssertionError: expected { ok: true, args: [ '--json', ...(15) ] } to deeply equal { ok: false, refused: 'outside' }
- FAIL: the folder a search is scoped to writes under into the parameters and reads it back, and reads a request without it as the whole root | AssertionError: expected { q: 'a b', root: 'hub', ...(4) } to deeply equal { q: 'a b', root: 'hub', ...(5) }
- FAIL: the folder a search is scoped to runs in the root with the folder as the path argument | AssertionError: expected [ '--regexp', 'needle', '.' ] to deeply equal [ '--regexp', 'needle', './src/lib' ]
- FAIL: the folder a search is scoped to refuses a link to a folder outside the root as outside, before any process starts | AssertionError: expected { ok: true, ...(1) } to deeply equal { ok: false, refused: 'outside' }
- FAIL: the folder a search is scoped to refuses a folder that is not there and a path that is a file as missing | AssertionError: expected { ok: true, ...(1) } to deeply equal { ok: false, refused: 'missing' }
- FAIL: the folder a search is scoped to answers the route a 400 with a sentence of its own for each of the two refusals | AssertionError: out: expected 200 to be 400 // Object.is equality
- FAIL: the folder a search is scoped to searches a hidden folder it is given whole, with the real binary | AssertionError: expected [ 'f.txt' ] to deeply equal [ '.hidden/h.txt' ]

Case 31 and 32 (`tests/views/sources/files/files-menu.test.ts`):
- FAIL: the Files row menu with file operations offers a folder every item of VS Code and the ones oculus has, and Paste disabled with no clipboard | AssertionError: expected [ '@files.menu_copy_path', ...(3) ] to deeply equal [ '@files.menu_copy', ...(12) ]
- FAIL: the Files row menu with file operations enables Paste once the clipboard holds something | AssertionError: expected undefined to be defined
- FAIL: the Files row menu with file operations groups the folder items as VS Code does: the two news first, then cut, copy and paste together, then rename and delete last | AssertionError: expected [ '@files.menu_reveal', ...(1) ] to deeply equal [ '@files.menu_new_file', ...(1) ]
- FAIL: the Files row menu with file operations offers a root the folder items VS Code gives a workspace folder: no cut, rename or delete, and Find in Folder in place of Find in Workspace | AssertionError: @files.menu_new_file: expected [ '@files.menu_reveal', ...(6) ] to include '@files.menu_new_file'
- FAIL: the Files row menu with file operations offers a file Select for Compare, Cut, Copy, Rename..., Delete and Reveal in Finder, and no Paste, Upload or New File | AssertionError: @files.menu_select_compare: expected [ '@files.menu_open_side', ...(5) ] to include '@files.menu_select_compare'
- FAIL: the Files row menu with file operations draws a file's Reveal in Finder in the group of Open in Integrated Terminal | AssertionError: expected [ '@files.menu_terminal' ] to deeply equal ArrayContaining{...}
- FAIL: the Files row menu with file operations offers Compare with Selected only with a file selected for compare | AssertionError: expected [ '@files.menu_open_side', ...(5) ] to include '@files.menu_compare_with'
- FAIL: the Files row menu with file operations offers Compare Selected and neither of the other two when two rows are selected | AssertionError: expected [ '@files.menu_open_side', ...(5) ] to include '@files.menu_compare_selected'
- PASS: the Files row menu with file operations gives every item of every row an id of its own
- FAIL: the facts of a row reads the clipboard from the explorer store it is given | AssertionError: expected undefined to be false // Object.is equality
- FAIL: the facts of a row names the file selected for compare, and none for the row itself | AssertionError: expected undefined to be 'b.md' // Object.is equality

Cases 34, 35, 36, 37, 38 (`tests/state/sources/explorer/ops.test.ts`, 553 lines): all 32 fail with `Cannot read properties of undefined` because `client.explorer` does not exist.

Case 39 (`tests/state/sources/repositories/diff-view.test.ts`):
- FAIL: a diff pane over two files reads the comparison address, the file first and the file selected for compare second | AssertionError: expected '/api/git?diff=hub&path=notes%2Fa.md&s...' to be '/api/ops?root=hub&path=notes%2Fa.md&w...' // Object.is equality
- FAIL: a diff pane over two files keeps a well-formed against and drops a malformed one | AssertionError: expected { Object (id, label, ...) } to match object { Object (against) }
- FAIL: a diff pane over two files does not act on hunks of a comparison | AssertionError: expected true to be false // Object.is equality
- FAIL: a diff pane over two files makes two comparisons two panes, and neither the pane of the file alone | AssertionError: expected 2 to be 4 // Object.is equality

Case 40 (`tests/state/sources/search.test.ts`):
- FAIL: the folder a tab is scoped to reads a state held without under as the whole root | AssertionError: expected undefined to be '' // Object.is equality
- FAIL: the folder a tab is scoped to carries under into the query and the request | AssertionError: expected undefined to be 'src/lib' // Object.is equality
- FAIL: the folder a tab is scoped to clears under when a root is chosen, and keeps it when the change names under too | AssertionError: expected undefined to be 'a' // Object.is equality
- FAIL: the folder a tab is scoped to says a refused folder as a sentence of the search words, not as the key | AssertionError: expected [ { ...(2) } ] to have a length of +0 but got 1

Case 42 (`tests/views/sources/files/files-ops.test.ts`): does not load, as above; red.

New tests that pass on the unchanged tree, with why: the three reveal tests of `open-program.test.ts` that pass test behaviour the step keeps (the `-R` argument list, a folder revealed through the body, a file still opened in its program); `gives every item of every row an id of its own` in `files-menu.test.ts` checks ids stay unique and passes before and after. No other new test passes.

Two existing tests were edited so they still hold with the new field: `tests/state/sources/search.test.ts` "opens on every root, no option, and the cap the configuration carries" now lists `under: ''`, and the `query()` helper of `tests/server/files/search.test.ts` carries `under: ''`. The edited one fails on the unchanged tree (it expects `under`).

## DONE / NOT DONE

| Item | Status | Proof |
| --- | --- | --- |
| `trash` 10.1.1 added | DONE | `git diff -- package.json` prints `+        "trash": "^10.1.1",` |
| First run of the cases as tests | DONE | the tables above; `git status --short` |
| `grep -n "from 'trash'" tests` prints nothing | DONE | printed nothing, exit 1 |
| Items 1-15, cases green, `npm run diagrams`, `checks.sh`, `npm run test:checks`, file sizes, ASCII gate | NOT DONE | stopped at the first run |

## Files

- `package.json` (+1), `package-lock.json` (+708/-8). The 8 deleted lines are `"dev": true` on `cross-spawn`, `is-extglob`, `is-glob`, `isexe`, `path-key`, `shebang-command`, `shebang-regex` and `which`, which `trash` now needs at run time. `trash` also brings in `execa`, `globby`, `move-file`, `mount-point`, `fast-glob`, `micromatch` and about thirty smaller packages as runtime dependencies (`git diff -- package-lock.json | grep '^+        "node_modules/'`).
- New tests: `tests/data/file-ops.test.ts` (130), `tests/server/files/ops.test.ts` (890, not yet formatted), `tests/state/sources/explorer/ops.test.ts` (553), `tests/views/sources/files/files-ops.test.ts` (326).
- Edited tests: `tests/routes/files/open-program.test.ts`, `tests/routes/files/open.test.ts`, `tests/data/helpers/search.test.ts`, `tests/server/files/search.test.ts`, `tests/state/sources/search.test.ts`, `tests/state/sources/repositories/diff-view.test.ts`, `tests/views/sources/files/files-menu.test.ts` (appended blocks; `git diff --stat`).
- Held outside the tree until the rulings: the drafted `src/lib/data/file-ops.ts` (175 lines) at `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/held/file-ops.ts`, written with the byte rule of item 1; it changes to the ruling's rule when restored.

## Anything in the brief that was wrong or impossible

- `views/life/memories/Memories.svelte` (item 12 and "Paths this step writes") is `src/lib/views/personal/memories/Memories.svelte`.
- `tests/state/sources/explorer.test.ts` moves into the new `tests/state/sources/explorer/` as the brief says; `tests/views/sources/repositories/` already holds 10 items, so case 41's test is in the new file beside `files.test.ts`, as the paths list names.
- Choices the first-run tests carry that the brief leaves open (internal, reversible, to be listed in the final report): the store is `client.explorer` with `clipboard`, `copy`, `cut`, `compareFile`, `selectForCompare`, `paste(target, confirm)`, `rename`, `create`, `trash(items, confirm)`, `upload`; `confirm` is called with `{ kind: 'replace' | 'permanent', name }` (and `upload: true` for an upload); `heldDiff` keeps `against` only when `root` and `path` are both non-empty strings; `searchParams` writes `under` only when it is not empty so the existing request address is unchanged; the compare sentence module is `views/sources/repositories/diff/compare-words.ts`.
- User-visible text this step changes: the root and folder item "Find in Workspace..." becomes "Find in Folder..." (Decision 10).

## Next

After the two rulings, the builder restores the drafted `file-ops.ts`, adjusts it and the tests that carry the length rule (case 4, case 33) and the Copy on a root (case 31) to the ruling, and builds items 1-15.
