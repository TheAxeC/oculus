Everything in the brief is done.

Not verified by any command: the drawn behaviour the brief assigns to the look on TEST (no browser and no real Trash are used in this worktree). They are listed under "Audits for the look" with what each must show.

## Open items

None. The "Open items" section of `tools/oculus/.scratch/migration/orchestrator-state.md` in the main checkout (lines 142-147, read at report time with `sed -n 142,147p`) holds no entry, and Z146, Z147 and Z148 are in its closed log (lines 171-173, found with `grep -n "Z146\|Z147\|Z148"`). The copy of that file inside this worktree is older and still lists the three as open at lines 125-127.

## Repair round 1

Eight rulings changed code, tests or documents; ruling 9 is no change. Every row below was run from `tools/oculus` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. Each new case was written first and run on the tree without its fix; the quoted failure is that run. The real `config/local.yml` was never opened: every case plants its own `local.yml` in a scratch folder (`engineWorld()` in `tests/server/files/ops-paste.test.ts`).

- Ruling 1, `protected` by identity. `src/lib/server/files/fs/ops.ts` (`protectedFiles`, `holdsProtected`, `identityOf`) now holds the device and inode (`lstatSync(path, { bigint: true })`) of each protected file and of every folder above it, and `holdsProtected` compares the identity of the path asked about, so `LOCAL.YML`, `Local.yml` and `TOOLS/oculus/config` are refused on a volume that folds case. For a path with nothing at it, a name that matches a protected file's name in any case, in a folder that holds one, is refused too. New cases in `tests/server/files/ops-paste.test.ts` (branching on `INSENSITIVE`): `refuses every spelling of the file and of its folders that the volume accepts (case 24)` covers `delete LOCAL.YML`, `trash Local.yml`, `rename LOCAL.yml`, `rename other.yml to Local.yml`, `upload LOCAL.YML` with `replace: true`, `delete TOOLS/oculus/config` through the hub root and `trash Tools/OCULUS`, each with the fixture file still there and the trash spy never called; `refuses a paste with Replace onto another spelling of the file (case 24)` pastes `spare/Local.yml` onto the engine root with `replace: true`. Failing on the tree before the fix (this volume is case-insensitive, `INSENSITIVE` is true): `delete LOCAL.YML`, `delete TOOLS/oculus/config` and `rename LOCAL.yml` answered `ok: true` with `kept: false` (the fixture file gone); `trash Local.yml` and `trash Tools/OCULUS` answered `ok: true` and called the trash spy once; `upload LOCAL.YML` answered `ok: true`, `kept: false`, after one trash call; `rename other.yml to Local.yml` answered `exists`, not `protected`; the Replace paste answered `{ ok: true, paths: ['Local.yml'] }` where `protected` was expected (full output: `npx vitest run tests/server/files/ops-paste.test.ts` on that tree, "2 failed | 20 passed"). After the fix: `npx vitest run tests/server/files` prints `Test Files  7 passed (7)` / `Tests  159 passed (159)`. On a volume that tells the spellings apart the same cases expect `missing`, or a made file, and are not run here. DESIGN.md line 384 now says "compared by device and inode so that every spelling the volume accepts is refused".
- Ruling 2, the whole typed name. `nameMessage` in `src/lib/views/sources/files/tree/row-ops.ts` asks `taken(shown)`, the whole name with trailing slashes removed, not its first segment. `tests/views/sources/files/files-naming.test.ts` replaced the first-segment test with `audits that asks the folder for the whole name typed, without a trailing slash` (asked names are `['a/b.md', 'dir']`) and `audits that a name of several segments is not taken because its first segment is` (`lib/new.ts` and `lib/sub` beside a folder `lib` give no message; `lib` gives `@files.name_taken(lib)`). Failing before the fix, with the first-segment line put back in `nameMessage`: `AssertionError: expected [ 'a', 'dir' ] to deeply equal [ 'a/b.md', 'dir' ]` and `AssertionError: expected { ...(2) } to be null` with the received message `@files.name_taken(lib/new.ts)`. The two cases pass after it (`npx vitest run tests/views/sources/files/files-naming.test.ts`: 12 passed). The server's `exists` answer covers a full path that is there (`createItem`, `walked.rest.length === 0 && pathExists(target)`).
- Ruling 3, a link to a folder (Z158). The listing's entry carries `link: true` for a symbolic link and no `link` key otherwise: `described` in `src/lib/server/files/fs.ts` reads `lstatSync(path).isSymbolicLink()` beside its `statSync`; `Entry` there, `FsEntry` and `TreeRow` in `src/lib/state/sources/fs.ts` name the field, and `treeRows` and `filterRows` copy it to the row. There is no zod schema for the listing's entry in this tree (the client reads `body.entries as Entry[]` in `fs.svelte.ts`, as before), so no schema was changed; the field is optional in the type. `holdsContents(row)` in `row-ops.ts` is `row.kind === 'dir' && row.link !== true`; `rowOpsPicker` uses it for the Delete question's `folder` and `Tree.svelte` for the unsaved-draft check (`explorer.unsaved(..., holdsContents(row))`). New cases: `tests/server/files/fs.test.ts` `marks a link as a link and leaves the mark off a folder or a file` (a link `team/docs -> ../shared/docs` lists with `link: true`, the real folder `shared/docs` and the file `b.md` carry no `link` key, a link to a file has it) and `tests/views/sources/files/files-ops.test.ts` `audits that asks the file question for a link to a folder, which removes only the link` (the question asked is `{ kind: 'delete', name: 'docs', folder: false, unsaved: false }`; a plain folder keeps `folder: true`, which `Questions.svelte` draws as "and its contents", asserted by the existing `files-naming.test.ts` case). Failing before, with `described` returning no `link` and `holdsContents` returning `row.kind === 'dir'`: the listing test shows `- "link": true` expected and `+ "mtime": ..., "size": 0` received for `docs` and for `to-b`; the Delete test shows `- "folder": false` expected and `+ "folder": true` received. DESIGN.md line 384 now has the sentence on the listing's entry (there was none before) naming `link`.
- Ruling 4, the network case (Z159). `ops.svelte.ts` is as built. `tests/state/sources/explorer/ops.test.ts` `keeps a cut clipboard when the request never reached the server, so the Cut can be pasted again`: the paste answers `network`, no replace question is asked, the clipboard still holds the Cut, and a second paste against a working server answers ok and empties it. It fails when `held.clip = null` is added before the `network` return (`expected null to deeply equal { mode: 'cut', items: [ { path: 'a.md', root: 'hub' } ] }`) and passes as built. DESIGN.md line 384 says "unless the replace question was cancelled or the request never reached the server (the paste answers `network`), since nothing moved and the Cut can be pasted again".
- Ruling 5, `README.md:13` names `` `trash` (MIT) moves a file or folder to the Trash `` in the dependency list, before `write-file-atomic`. Check: `sed -n 13p README.md | grep -o "trash. (MIT)[^,]*"` prints `trash` (MIT) moves a file or folder to the Trash.
- Ruling 6, `HELP.md:164` and the same sentence in DESIGN.md line 384. The old sentence ("searched whole, hidden and ignored files included") was wrong for what is inside the folder. The sentence rests on `src/lib/data/helpers/search.ts:142`: `args.push('--regexp', query.q, query.under === '' ? SEARCH_PATH : `./${query.under}`);`, after the skip globs (`SKIP_GLOBS = ['!node_modules', '!.git', '!.svelte-kit']`, line 29, pushed at line 138) and with no `--hidden` or `--no-ignore` flag. The shipped ripgrep (`@vscode/ripgrep-darwin-arm64/bin/rg`), run in a scratch repository with those globs: `rg --files-with-matches needle ./.hid` finds `.hid/a.txt` and skips `.hid/.dot.txt`, `.hid/inner/.deep/x.txt` and `.hid/node_modules/n.txt`; `./ign` (listed in the repository's `.gitignore`) finds `ign/b.txt` and `ign/sub/s.txt` and skips `ign/.dot.txt`; with `*.log` in the parent `.gitignore`, `./ign` skips `ign/x.log`; with `skipme/` in `ign/.gitignore`, it skips `ign/skipme/k.txt`; from `.` it finds only `src/c.txt`. The sentence now says the folder is searched even when it is hidden or ignored itself, while the files and folders inside it follow the search's rule, so a hidden file in it and an entry an ignore file names are still skipped.
- Ruling 7, `HELP.md:111` now reads "Pasting a Copy onto a name that is taken takes the next free name (`report copy.md`, then `report copy 2.md`) and asks nothing; pasting a Cut onto a taken name asks before it replaces the item, which goes to the Trash." The behaviour is `freeName` in `src/lib/data/file-ops.ts` used by the copy branch of `pasteItems`, asserted by the existing copy cases of `tests/server/files/ops-paste.test.ts` and `tests/data/file-ops.test.ts`.
- Ruling 8, the first run in final form. The unchanged source is a copy of the main checkout's `tools/oculus` (no Q88b file in it: `src/lib/data/file-ops.ts`, `server/files/fs/ops.ts` and `state/sources/explorer/` are absent), with this worktree's whole `tests/` directory copied over it, `node_modules` linked, and `npx svelte-kit sync` run. The four files, quoted from `npx vitest run <file>` in that copy: `tests/state/sources/explorer/naming.test.ts` fails to load, `Cannot find module '../../../../src/lib/state/sources/explorer/naming.ts'`, 0 tests; `tests/views/sources/files/files-naming.test.ts` fails to load, `Cannot find module '../../../../src/lib/views/sources/files/Questions.svelte'`, 0 tests; `tests/server/files/ops-paste.test.ts` fails to load, `Cannot find module '/src/lib/data/file-ops.ts'`, 0 tests; `tests/server/files/ops.test.ts`, which shares `ops-fixture.ts` with it, fails to load with the same message, 0 tests. `ops-fixture.ts` is a helper without tests; it imports `server/files/fs/ops.ts`, so both files that use it are red for the same reason. The rest of this round's new cases on that tree: `tests/server/files/fs.test.ts` `marks a link as a link...` fails (`Tests  1 failed | 42 passed (43)`), `tests/state/sources/explorer/ops.test.ts` fails on every case (`client.explorer` does not exist), `tests/views/sources/files/files-ops.test.ts` fails to load.
- Ruling 9: no change. The slow suite was not run again; its row below is the run before this round. The catalog-words test keeps its audit title.

Verification after all changes (`tools/oculus`): `npm run diagrams` printed "done" and `docs/diagrams/*` regenerated; `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` printed `checks: 7 commands passed`, exit 0, with `npm test` at `Test Files  378 passed | 20 skipped (398)` / `Tests  6207 passed | 614 skipped (6821)` and `npm run test:checks` at `Test Files  29 passed | 2 skipped (31)` / `Tests  442 passed | 9 skipped (451)`. `wc -l` of `Files.svelte` is 539 and of `Diff.svelte` 535; `grep -rn "from 'trash'" tests` prints nothing; `sh utils/folder-check.sh` exits 0.

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

The final form of `tests/state/sources/explorer/naming.test.ts`, `tests/views/sources/files/files-naming.test.ts`, `tests/server/files/ops-paste.test.ts` and `tests/server/files/ops.test.ts` (with `ops-fixture.ts`) on the unchanged source is quoted in "Repair round 1", ruling 8: all four fail to load there.

### Rulings (from `tools/oculus/.scratch/migration/agents/briefs/Q88b-cases.md`, read in the main checkout)

- Case 1, Copy on a root: ruled (A). A root's line offers no Cut, Copy, Rename... or Delete, as item 8 says and as VS Code registers Copy with `when: ExplorerRootContext.toNegated()` (`fileActions.contribution.ts:548-556`). Built that way: the root branch of `rowMenu` in `src/lib/views/sources/files/tree/row-menu.ts` has no cut, copy or modify group, and the test "offers a root the folder items VS Code gives a workspace folder" asserts Cut, Copy, Rename... and Delete absent.
- Case 2, the name length: ruled (A). A segment longer than 255 UTF-16 units (`name.length > 255`) is `invalid_name`, VS Code's `isValidBasename` (`extpath.ts:197`); the server still maps `ENAMETOOLONG` to `invalid_name`. Built that way: `MAX_NAME_LENGTH = 255` and `validSegment` in `src/lib/data/file-ops.ts`, and `tests/data/file-ops.test.ts` accepts 128 times e-acute and a 100-character CJK name and refuses a 256-character segment.

## DONE / NOT DONE

Every row names the command that proves it, run from `tools/oculus` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, and quotes the last lines of its output. Cases 1-28 carry their number in the test title (`grep -rhoE "\(case [0-9]+\)" tests/server/files/ops.test.ts tests/server/files/ops-paste.test.ts` lists 1 to 28); cases 29-42 are the tests of the files named in the rows.

| Item | Status | Command | Output |
| --- | --- | --- | --- |
| Items 1, 2, 3 and cases 1-28, 33: the rules, the server operations, the comparison | DONE | `npx vitest run tests/data/file-ops.test.ts tests/server/files/ops.test.ts tests/server/files/ops-paste.test.ts` | Test Files  3 passed (3) / Tests  67 passed (67) |
| Items 5, 6 and cases 29, 30, 40: Reveal in Finder, Find in Folder | DONE | `npx vitest run tests/routes/files tests/data/helpers/search.test.ts tests/server/files/search.test.ts tests/state/sources/search.test.ts` | Test Files  10 passed (10) / Tests  211 passed (211) |
| Items 7, 10 and cases 34-39: the explorer store, the following of moved paths, the diff pane over two files | DONE | `npx vitest run tests/state/sources` | Test Files  21 passed (21) / Tests  410 passed (410) |
| Items 8, 9, 11, 12, 13 and cases 31, 32, 41, 42: the menu, the name input, the questions, upload, the cut fade | DONE | `npx vitest run tests/views/sources/files tests/views/sources/search tests/views/personal tests/ui/menu tests/ui/theme tests/views/whole/type-scale.test.ts` | Test Files  21 passed (21) / Tests  501 passed (501) |
| The client state registry and the Memories limit | DONE | `npx vitest run tests/state/client tests/state/life` | Test Files  17 passed (17) / Tests  274 passed (274) |
| Items 14 and 15: the words and the documents | DONE | `grep -n "device and inode\|link: true\|next free name\|even when it is hidden" DESIGN.md HELP.md`, `sed -n 13p README.md` and `npm run test:checks` (keys.test.ts: every catalog key has a reader) | DESIGN.md 384 (three phrases), HELP.md 111 and 164, README.md 13 print their hits; the hunk lines of the first run were DESIGN.md 148, 171, 376, 378, 379, 384, 402 and HELP.md 3, 43, 111, 164; test:checks below |
| `npm run diagrams` | DONE | `npm run diagrams` | docs/diagrams/writes.svg / diagrams exit 0 |
| The land checks | DONE | `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` | checks: 7 commands passed / checks.sh exit 0; its `npm test`: Test Files 378 passed / 20 skipped (398) / Tests 6207 passed / 614 skipped (6821) |
| The checks suite | DONE | `npm run test:checks` | Test Files 29 passed / 2 skipped (31) / Tests 442 passed / 9 skipped (451) |
| The slow suite (run before round 1; not run again, ruling 9) | DONE | `npm run test:slow` | Test Files 22 passed / 407 skipped (429) / Tests 623 passed / 6643 skipped (7266) / slow exit 0 |
| Sizes under 540 | DONE | `wc -l src/lib/views/sources/files/Files.svelte src/lib/views/sources/repositories/diff/Diff.svelte` | 539 src/lib/views/sources/files/Files.svelte /      535 src/lib/views/sources/repositories/diff/Diff.svelte /     1074 total |
| ASCII gate | DONE | `LC_ALL=C grep -rna "[^ -~]" src tests DESIGN.md HELP.md config/text/views/sources/files.yml config/text/views/sources/search.yml` | nothing printed, exit 1 |
| Formatting | DONE | `npm run format` and `npm run format:check` | every file reported `(unchanged)`; All matched files use Prettier code style! |
| No real Trash in a test | DONE | `grep -rn "from 'trash'" tests` | nothing printed, exit 1; the library is mocked at `tests/server/files/ops.test.ts:42` and `tests/server/files/ops-paste.test.ts:30` |
| Folder item counts | DONE | `sh utils/folder-check.sh` | exit 0  |
| The drawn behaviour (the audits below) | NOT VERIFIED | none | no browser, no real Trash in this worktree |

The loads while these ran: `uptime` printed `14:52  up 1 day, 15:45, 1 user, load averages: 10.14 13.43 14.89` at the end.

What the green results do not cover: anything drawn (the audits below), the real Trash (every test hands in a spy), a volume without a Trash, and the multi-select Compare Selected path, which the tree cannot reach until X3a.

## Files

New files (`wc -l`):

| File | Lines |
| --- | --- |
| `src/lib/data/file-ops.ts` | 181 |
| `src/lib/server/files/fs/ops.ts` | 599 |
| `src/lib/state/sources/explorer/file-type.ts` | 96 |
| `src/lib/state/sources/explorer/follow.ts` | 133 |
| `src/lib/state/sources/explorer/naming.ts` | 41 |
| `src/lib/state/sources/explorer/ops.svelte.ts` | 418 |
| `src/lib/ui/forms/file-data.ts` | 22 |
| `src/lib/ui/tree/NameField.svelte` | 148 |
| `src/lib/views/sources/files/Questions.svelte` | 57 |
| `src/lib/views/sources/files/tree/NameInput.svelte` | 77 |
| `src/lib/views/sources/files/tree/row-ops.ts` | 294 |
| `src/lib/views/sources/repositories/diff/compare-words.ts` | 22 |
| `src/routes/api/(files)/ops/+server.ts` | 32 |
| `tests/data/file-ops.test.ts` | 137 |
| `tests/server/files/ops-fixture.ts` | 89 |
| `tests/server/files/ops-paste.test.ts` | 544 |
| `tests/server/files/ops.test.ts` | 464 |
| `tests/state/sources/explorer/explorer.test.ts` | 444 |
| `tests/state/sources/explorer/naming.test.ts` | 282 |
| `tests/state/sources/explorer/ops.test.ts` | 620 |
| `tests/views/sources/files/files-fixture.ts` | 30 |
| `tests/views/sources/files/files-naming.test.ts` | 238 |
| `tests/views/sources/files/files-ops.test.ts` | 349 |

Changed files (added/removed lines: the phase-1 `git diff --numstat` figures, with this round's edits to `fs.ts`, `README.md` and `tests/server/files/fs.test.ts` counted by `diff` against the unchanged copy of the same file; `docs/diagrams/*` as `npm run diagrams` regenerates them):

| File | + / - |
| --- | --- |
| `DESIGN.md` | +7 / -6 |
| `HELP.md` | +4 / -4 |
| `config/text/views/sources/files.yml` | +52 / -2 |
| `config/text/views/sources/search.yml` | +5 / -0 |
| `package-lock.json` | +707 / -8 |
| `package.json` | +1 / -0 |
| `README.md` | +1 / -1 |
| `src/lib/data/helpers/search.ts` | +43 / -7 |
| `src/lib/server/content/memories.ts` | +8 / -7 |
| `src/lib/server/core/json.ts` | +3 / -3 |
| `src/lib/server/files/fs.ts` | +17 / -6 |
| `src/lib/server/files/open.ts` | +16 / -6 |
| `src/lib/server/files/search-routes.ts` | +6 / -4 |
| `src/lib/server/files/search.ts` | +20 / -1 |
| `src/lib/server/root/context.ts` | +6 / -0 |
| `src/lib/state/client/context.ts` | +14 / -0 |
| `src/lib/state/client/writes.svelte.ts` | +9 / -0 |
| `src/lib/state/life/memories.ts` | +12 / -9 |
| `src/lib/state/shared/stores/shapes.ts` | +1 / -0 |
| `src/lib/state/sources/file-type.ts` (moved to `src/lib/state/sources/explorer/file-type.ts`) | +0 / -96 |
| `src/lib/state/sources/fs.svelte.ts` | +31 / -0 |
| `src/lib/state/sources/fs.ts` | +65 / -8 |
| `src/lib/state/sources/repositories/repositories.ts` | +22 / -3 |
| `src/lib/state/sources/search.svelte.ts` | +11 / -1 |
| `src/lib/state/sources/search.ts` | +4 / -1 |
| `src/lib/themes/tokens.css` | +2 / -0 |
| `src/lib/views/personal/memories/Memories.svelte` | +1 / -10 |
| `src/lib/views/sessions/session-list/TerminalRows.svelte` | +1 / -1 |
| `src/lib/views/sessions/timeline/Timeline.svelte` | +1 / -1 |
| `src/lib/views/sources/files/Files.svelte` | +11 / -10 |
| `src/lib/views/sources/files/tree/Tree.svelte` | +236 / -59 |
| `src/lib/views/sources/files/tree/row-menu.ts` | +98 / -20 |
| `src/lib/views/sources/repositories/diff/Diff.svelte` | +6 / -1 |
| `src/lib/views/sources/search/Query.svelte` | +68 / -36 |
| `src/lib/views/sources/search/Search.svelte` | +2 / -0 |
| `src/lib/views/system/usage/Usage.svelte` | +1 / -1 |
| `tests/checks/tree/allow-duplication.txt` | +1 / -1 |
| `tests/checks/tree/boundaries.test.ts` | +5 / -1 |
| `tests/data/helpers/search.test.ts` | +48 / -10 |
| `tests/fixtures/scratch.ts` | +15 / -3 |
| `tests/routes/files/open-program.test.ts` | +78 / -1 |
| `tests/routes/files/open.test.ts` | +39 / -1 |
| `tests/routes/files/search.test.ts` | +10 / -3 |
| `tests/server/files/fs.test.ts` | +23 / -0 |
| `tests/server/files/search.test.ts` | +102 / -11 |
| `tests/server/root/context-fixture.ts` | +1 / -0 |
| `tests/state/client/client-state.test.ts` | +1 / -0 |
| `tests/state/sources/explorer.test.ts` (moved to `tests/state/sources/explorer/explorer.test.ts`) | +0 / -439 |
| `tests/state/sources/repositories/diff-view.test.ts` | +61 / -0 |
| `tests/state/sources/search.test.ts` | +54 / -1 |
| `tests/ui/menu/menu-words.test.ts` | +14 / -3 |
| `tests/ui/theme/wall.test.ts` | +1 / -0 |
| `tests/views/sources/files/files-menu.test.ts` | +304 / -26 |
| `tests/views/sources/files/files.test.ts` | +2 / -15 |
| `tests/views/sources/files/tree-window.test.ts` | +1 / -0 |
| `tests/views/whole/type-scale.test.ts` | +3 / -0 |
| `docs/diagrams/*` (10 files) | regenerated |

`allow-duplication.txt:154` carries only the moved test's new path. `grep -rn "sources/file-type\|explorer.test" src tests config HELP.md DESIGN.md README.md --exclude=local.yml` prints one line: `tests/checks/tree/allow-duplication.txt:154:tests/state/sources/explorer/explorer.test.ts tests/state/sources/fs-shape.test.ts 20171008d2f9 ...`.

## Every user-visible change, before and after

- A file's right-click menu. Before: Open to the Side, Open in Integrated Terminal, Download..., Copy Path, Copy Relative Path, and Open Preview on Markdown. After, in these groups with a rule between them: Open to the Side; Reveal in Finder, Open in Integrated Terminal; Compare with Selected (only with a file selected for compare) and Select for Compare; Cut, Copy; Download...; Copy Path, Copy Relative Path; Open Preview (Markdown); Rename..., Delete. Asserted by `tests/views/sources/files/files-menu.test.ts`.
- A folder's menu. Before: Reveal in Finder, Open in Integrated Terminal, Copy Path, Copy Relative Path. After: New File..., New Folder...; Reveal in Finder, Open in Integrated Terminal; Find in Folder...; Cut, Copy, Paste (disabled with an empty clipboard); Upload...; Copy Path, Copy Relative Path; Rename..., Delete.
- A root's menu. Before: Reveal in Finder, Open in Integrated Terminal, Find in Workspace..., the two copies, Add Folder to Workspace... and, for a root the reader added, Remove Folder from Workspace. After: New File..., New Folder...; Reveal in Finder, Open in Integrated Terminal; Find in Folder...; Paste (disabled with an empty clipboard); Upload...; the two copies; Add Folder to Workspace... and Remove Folder from Workspace as before. No Cut, Copy, Rename... or Delete (ruling 1). "Find in Workspace..." is gone; the word `menu_find` is now "Find in Folder..." on every folder and root row.
- New File..., New Folder... and Rename... draw a text box in the tree. A new item is a row at the top of its folder (the folder opens first and the filter clears); a rename replaces the row's name, selecting the name without its extension for a file. Enter or leaving the box accepts a valid name, Escape cancels, an empty or unchanged name cancels. The message under the box is one of: "A file or folder name must be provided.", "A file or folder name cannot start with a slash.", "A file or folder '{0}' already exists at this location. Please choose a different name.", "The name '{0}' is not valid as a file or folder name. Please choose a different name.", and the warning "Leading or trailing whitespace detected in file or folder name."
- A row on the clipboard as Cut is drawn at half opacity (`--tree-cut-opacity: 0.5` in `src/lib/themes/tokens.css`, `data-cut` on the row).
- Delete asks "Are you sure you want to delete '{0}'?" (a folder that is not a link: "...'{0}' and its contents?"; a link to a folder takes the file wording) with the detail "You can restore this file from the Trash." (plus "Your changes will be lost if you don't save them." when a tab holds unsaved text of it) and the button "Move to Trash". When the Trash fails it asks "Failed to delete using the Trash. Do you want to permanently delete instead?" with "This action is irreversible!" and "Delete Permanently". A paste or upload onto a taken name asks "A file or folder with the name '{0}' already exists in the destination folder. Do you want to replace it?" with "Replace", and for an upload the detail "This action is irreversible!".
- Upload... opens the file dialog (several files), skips a file over 32 MiB with "{0} was not uploaded: That file is larger than an upload may be.", and says "Files uploaded: {0}." plus one such sentence per refused file on the tree's refusal line.
- A refused operation says a sentence on the tree's refusal line instead of its word: "It is not inside a served root.", "It is not there any more.", "A root cannot be changed here.", "This machine's settings file cannot be changed here.", "That is not a name a file or folder can have.", "A file or folder of that name is already there.", "A folder cannot be put inside itself.", "That is not a folder.", "The folder does not allow that change.", "The Trash could not take it.", "That file is larger than an upload may be.", "The file could not be read correctly.", "The write token was refused; reload the page.", "The server did not recognise that operation.", "The server could not be reached." (`config/text/views/sources/files.yml`, keys `refused_*`).
- Select for Compare and Compare with Selected open a diff pane titled "{selected file} vs {this file}" (left is the file selected for compare, right the row). A refused comparison says one of "One of the two files is not there.", "A folder cannot be compared with a file.", "One of the two files is not inside a served root.", "One of the two files is too large to compare." in the pane.
- Reveal in Finder is on a file row (it selects the file in Finder without opening it).
- Find in Folder... opens the Search view on that folder. The Search view shows a line "In {root}/{folder}" with a control "Search the whole root"; choosing another root clears the folder. A folder is searched even when it is hidden or ignored itself, and what is inside it follows the search's hidden and ignored rule. Two new refusals: "A folder is searched under one root, inside it." and "That folder is not there."
- Documents: `HELP.md` lines 3, 43, 111, 164 and `DESIGN.md` lines 148, 171, 376, 378, 379, 384, 402 say the above (lines found with `grep -n "Files view's file operations\|^| `files`" DESIGN.md HELP.md`), and `README.md` line 13 names the `trash` dependency.
- No visible change: the Memories wall's 32 MiB limit and its picture upload are as before; the limit now comes from `data/file-ops.ts`.

## VS Code's words and groups, with source and line (commit e4f7a6f2, fetched with curl from raw.githubusercontent.com; the lines are those of that file)

- `src/vs/workbench/contrib/files/browser/fileActions.ts`: button "Move to Trash" `:90`; "Your changes will be lost if you don't save them." `:121`; "You can restore this file from the Trash." `:176`; "Failed to delete using the Trash. Do you want to permanently delete instead?" `:227` and "Delete Permanently" `:229`; the delete questions `:278` (folder) and `:281` (file); the replace question and "Replace" `:489-490`; `validateFileName` `:714` with its messages `:721`, `:729`, `:742`, `:753`, `:760`.
- `fileImportExport.ts`: the upload's replace question with the detail "This action is irreversible!" and "Replace" `:864-866`.
- `src/vs/base/common/extpath.ts:197`: `if (name.length > 255)`.
- `fileActions.contribution.ts`: New File `:479-487` and New Folder `:489-497` (group `navigation`, orders 4 and 6, when `ExplorerFolderContext`); the compare items `:517-536` (group `3_compare`); Cut `:538-546` (`5_cutcopypaste` 8, not a root and writable); Copy `:548-556` (10, not a root); Paste `:558-567` (20, `ExplorerFolderContext`); Upload `:586-601` (`5b_importexport` 20); Copy Path `:603-615` (`6_copypath`); Add and Remove Folder `:617-635` (`2_workspace`); Rename `:637-646` (`7_modification` 10, not a root); Delete `:648-669` (`7_modification` 20, not a root).
- `src/vs/workbench/contrib/files/electron-browser/fileActions.contribution.ts:84-89`: Reveal in Finder, group `navigation`, order 20.
- `src/vs/workbench/contrib/search/browser/searchActionsFind.ts`: Find in Folder... `:260-285` (group `4_search`, when `ExplorerFolderContext`, so on a root too) and Find in Workspace... `:287-300` (only where `ExplorerRootContext` holds and `ExplorerFolderContext` does not).
- `src/vs/workbench/contrib/files/browser/media/explorerviewlet.css:39-41`: `.explorer-item.cut { opacity: 0.5; }`; `explorerViewer.ts:997-998` adds the class `cut` when `explorerService.isCut(stat)`.

## Audits for the look (no DOM in the unit suite; not verified by any command)

- The name box: it takes the focus when drawn; a file rename selects the name without its extension and a folder or a new item selects nothing of a stem; Enter accepts a valid name and keeps a refused one with its message; Escape cancels; leaving the box accepts a valid name and cancels an empty or unchanged one; the message draws over the rows below the box and does not move them; the error and the warning read differently.
- A right-click inside the name box opens the text boxes' editing menu (`TextBoxMenu.svelte`); whether the focus that menu takes counts as leaving the box and accepts a half-typed name is not checked.
- The cut row: half opacity, and how it reads beside the selected row's highlight and the hover.
- The questions: the wording and buttons of the delete, permanent-delete and replace questions, Enter and Escape in them, and that a new question cancels the one on screen and that closing the tab cancels it (`asking?.resolve(false)` and `choosing?.([])` in `Tree.svelte`'s `onDestroy`; these two paths have no DOM test).
- The pending row at the top of its folder in the virtualised tree: it is drawn, focused and scrolled into view when the folder is long.
- On a scratch root, in the real browser: New File, New Folder, Rename (with a source tab open on the file, restated with its draft), Delete into the real macOS Trash (the one step no test may do), Cut and Paste, Copy and Paste twice (`report copy.md`, `report copy 2.md`), Upload of a file and of a taken name, Select for Compare then Compare with Selected, Reveal in Finder on a file, Find in Folder on a hidden folder.

## Anything in the brief that was wrong or impossible, and the choices to report

- The Memories view is `src/lib/views/personal/memories/Memories.svelte`, not `views/life/memories/` (item 12 and "Paths this step writes"). Case 41's test is in the new `tests/views/sources/files/files-ops.test.ts` beside `files.test.ts`, since `tests/views/sources/repositories/` holds 10 items (both as the first run found; Q88b-cases.md confirms).
- Item 10 says the "doc views" carry `{ root, path }`. Two views carry a document. The `document` view (an HTML file under a root) has `{ id, root, path, label }` and is followed. The `doc` view (an entry of layout.yml's `docs:`) has `{ id, path, label }` with a path under the hub and no root, and is not followed: `Doc.svelte` restates a tab whose path left the list back to the entry that carries its label (`followDoc`, `src/lib/state/workbench/navigation/catalogue.ts:36-47`), so a restated path would be undone by the view itself. The entry is layout.yml's.
- The permanent-delete question's detail is "This action is irreversible!" for every item, as item 11 says. VS Code's detail for a single file there is "You can restore this file using the Undo command." and "This action is irreversible!" only for a folder (`fileActions.ts:160-163`, used at `:228`). Oculus has no Undo for a file removed for good, so the brief's text is the true one here.
- The two name messages that carry the name drop VS Code's `**` bold markers (`fileActions.ts:742`, `:753`): the name is shown in single quotes, because the text catalog has no markup.
- `GET /api/search` answered a folder that is not there as English text of the route (`the folder is not there`), which the page showed as it came, so the catalog sentence `search.refused_missing` was never reached. The 400 body now carries the word beside the sentence (`{ error, refused }`, `src/lib/server/files/search-routes.ts`), and the page says the catalog sentence for a word it knows (`ask` in `src/lib/state/sources/search.svelte.ts`, `refusalFrom` in `src/lib/data/helpers/search.ts`). The three existing exact-body assertions of `tests/routes/files/search.test.ts` carry the new field. The check that fails without the fix: `tests/state/sources/search.test.ts` "says a folder the server found missing as the search words" (run with the mapping line removed it fails with `expected 'the folder is not there' to be 'That folder is not there.'`). This adds a field to an internal wire the brief did not name; it is listed here for a ruling.
- Compare Selected is built, tested and in `rowMenu`, and is not reachable in the running view: `rowFacts` gives `selection: 1` until X3a brings multi-select, as item 8 says, and `rowOpsPicker` reads the selected rows through an optional `selected` dependency that `Tree.svelte` supplies as the one selected row.
- The pending row of a new file or folder is the first row under its folder, and its path is the folder's path with a `/` after it (`pendingPath` in `src/lib/state/sources/explorer/naming.ts`), so it is the key of no real entry. A new item in a root's own line is under `''`, so its row path is `/`.
- A Cut paste whose request never reached the server (`network`) keeps the clipboard, where item 7 empties it on every failure (VS Code's `finally`, `fileActions.ts:1280-1285`): nothing was moved, so the same Cut can be pasted again (ruled Z159, kept; test and DESIGN.md sentence in Repair round 1). Every answer from the server, ok or refused, empties it, except a cancelled replace question.
- The pending name is the Files view's own state, so a tab reloaded with a name half typed reopens the input.
- The reveal is the open endpoint's body `reveal: true` beside `root` and `path` (`src/lib/server/files/open.ts`, `revealPath` in `writes.svelte.ts`), as item 5 says; `DESIGN.md:402` states it.
- VS Code puts New File..., New Folder..., Open to the Side and Reveal in its `navigation` group (`fileActions.contribution.ts:479-497`, `electron.ts:84-89`). The Q88 menu and the brief keep New File... and New Folder... in a group of their own and Reveal beside the terminal; the groups follow the brief.
- The brief's verify command `grep -n "from 'trash'" tests` has no `-r`, and `grep` on a directory without it prints `grep: tests: Is a directory` and nothing else, so it passes whatever the tests hold. The row below runs `grep -rn "from 'trash'" tests`.
- `npm test` excludes the tests tagged slow (`package.json`: `--tagsFilter '!slow'`), so `checks.sh` does not run them. Running `npm run test:slow` found one defect of this step (`.scope` in `Query.svelte` painted `color: var(--muted)`, which `tests/ui/theme/colours.test.ts` refuses), now `var(--muted-txt, var(--muted))`. The slow suite is in the table below.
- Load on this machine was high while the suites ran (`uptime`: load averages near 15). Under it `tests/server/edit/config-key.test.ts` timed out once at 5000 ms and passed alone twice, and two files of the slow suite failed once (`tests/server/git/git-ops.test.ts`, `tests/server/root/watch/portfolio.test.ts`) and passed in a later run; none of the three touches this step.

## Paths used beyond the brief's list

- `src/lib/ui/tree/NameField.svelte` (the primitive the input is drawn with; eslint forbids a raw input in a view), `src/lib/ui/forms/file-data.ts` (the shared base64 reader, "its new home" in item 12), `src/lib/views/sources/files/Questions.svelte` (the questions component the brief names without a path), `src/lib/state/sources/explorer/follow.ts` and `naming.ts` (beside `ops.svelte.ts`), `src/lib/views/sources/search/Search.svelte` (passes `under` and the clear control to `Query.svelte`).
- `src/lib/themes/tokens.css` (`--tree-cut-opacity`, the token item 13 names without a path).
- `tests/server/files/ops-paste.test.ts` and `tests/server/files/ops-fixture.ts` (`ops.test.ts` was 969 lines; the size line is 900), `tests/views/sources/files/files-naming.test.ts`, `tests/views/sources/files/files-fixture.ts` (the tree's props, shared by `files.test.ts` and `files-naming.test.ts` so the duplication check holds), `tests/state/sources/explorer/naming.test.ts`.
- `tests/fixtures/scratch.ts` (`plantScratch` takes a list of empty folders), `tests/server/root/context-fixture.ts` (`opsWrites`), `tests/state/client/client-state.test.ts` (the `explorer` store in its list), `tests/views/whole/type-scale.test.ts` and `tests/ui/theme/wall.test.ts` (the registry entries for `Questions.svelte`, `NameInput.svelte` and `NameField.svelte`), `tests/ui/menu/menu-words.test.ts` (listed), `tests/views/sources/files/files.test.ts` and `tree-window.test.ts` (the `owner` prop of `Tree`), `tests/routes/files/search.test.ts` (the `refused` field).
- `docs/diagrams/*` as `npm run diagrams` regenerates it.

## Next

The orchestrator reads the diff and lands it; the look on TEST then covers the audits above. No step depends on a decision still open in this report except the `refused` field of the search answer, which is listed for a ruling.
