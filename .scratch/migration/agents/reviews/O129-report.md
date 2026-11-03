# Report: O129, the Status view's line count removed whole

Everything in the brief is done

## Open items of the state file, verbatim

- Open item 645 (2026-11-03): the rows of `categories:` of a hub other than the primary are held to the whole-file shape only, never to the config check `categoriesFindings` (`src/lib/server/root/watch/portfolio/payload.ts:91` runs it on the primary's config alone), so such a hub's `stages: { words: [nonsense] }` or a row with no `color` gives no finding and the word is not read (the run quoted in `agents/reviews/O128-report.md`, "What is handed back" 2). (a) recommended: a new step that runs `categoriesFindings` over each other hub's merged config in `readOtherHub` (`src/lib/data/index.ts:628-650`), its findings naming that hub's settings file, so every hub's category rows are checked alike; it makes findings appear for such a hub's wrong words, which today are silent. (b) no change, the lazy option: a second hub's wrong category word stays silent.

## The cases' first run

Every case was run or read on the unchanged tree before any change to the code. No case of the brief was wrong under its rules.

- C1. `PROGRAMS` in `tests/server/root/process/first-run.test.ts:73` set to `['git', 'tmux', 'claude']` on the unchanged `first-run.ts`, then `npx vitest run tests/server/root/process/first-run.test.ts --reporter=verbose`: `Tests  6 failed | 11 passed (17)`. The failing rows and their failing lines:
  - 'no workspace state is no lack', 'a workspace state that does not parse is no lack', 'a workspace state naming a workspace file that is gone is no lack', 'an unsaved workspace listing a folder that is not there is no lack' (the four G73 rows run through `startLacks`): `AssertionError: expected [ 'perl' ] to deeply equal []` at `tests/server/root/process/first-run.test.ts:204:48`, the line `expect(lacks.map((lack) => lack.kind)).toEqual(kinds);`.
  - 'names zenity and xdg-utils as optional lacks on Linux, and neither on macOS': `AssertionError: expected [ [ 'perl', false ], <ellipsis>(2) ] to deeply equal [ [ 'zenity', false ], <ellipsis>(1) ]` at `:221:65`, `expect(linux.map((lack) => [lack.kind, lack.required])).toEqual([`.
  - 'names wslview of wslu under WSL2, and no lack once the programs are there': `AssertionError: expected [ 'perl', 'opener' ] to deeply equal [ 'opener' ]` at `:233:46`, `expect(wsl.map((lack) => lack.kind)).toEqual(['opener']);`.
  After the change the same file passes all 17 rows (see the table).
- C2. `ls 'src/routes/api/(machine)/lines' src/lib/server/machine/lines.ts src/lib/state/system/lines.svelte.ts src/lib/views/system/status/LineCounts.svelte docs/licenses/GPL-2.0.txt` before: every path listed (`docs/licenses/GPL-2.0.txt`, `src/lib/server/machine/lines.ts`, `src/lib/state/system/lines.svelte.ts`, `src/lib/views/system/status/LineCounts.svelte`, `src/routes/api/(machine)/lines:` holding `+server.ts`), exit 0.
- C3. `grep -rnw cloc src tests config docs README.md package.json package-lock.json utils --exclude=local.yml` before: 41 hits, exit 0, among them `src/lib/server/core/git/run.ts:53`, 30 lines of `src/lib/server/machine/lines.ts`, `src/lib/state/system/lines.svelte.ts:3`, `src/lib/data/model/index.ts:408`, `config/text/views/system/status.yml:27`, `docs/third-party.md:7`, `package.json:84` and `package-lock.json:33,4525,4526,4527,4531`.
- C4. `grep -rnw perl src --exclude=local.yml` before: 18 hits, exit 0: `lines.ts:40,41,98,105,111,112,179,180,185,195,215,341` and `first-run.ts:18,56,206,207,208,209`, as the brief says.
- C5. Run after the change only, as the brief orders; the base list `.agents/worktrees/O129-base/unused-exports.txt` holds `src/lib/server/machine/lines.ts: TOP_LEVEL, CLOC_TIMEOUT_MS, counted, folderOf, todoLine`, `src/lib/state/system/lines.svelte.ts: readCount` and the type line `src/lib/state/system/lines.svelte.ts: Lines` (`grep -n "lines" ../O129-base/unused-exports.txt`).
- C6. Settled at the look on landing. By reading `Status.svelte` after the change: the hooks sit in `<div class="hooks">` whose rule is `margin-top: 16px` alone, directly after the git line inside the `Surface`, and `.samples { margin-top: 16px; }` holds the Gallery below it, so both gaps are 16 px and no Lines of code section is drawn.
- C7. Covered by C1's rows: `startLacks` and `lacksOn` put only `PROGRAMS` (now without `perl`) on the PATH, and after the change no row names a lack.
- C8. By reading `first-run.ts:115-135` (`packageLacks`): `behind` counts the entries of `wanted` (the lock's `packages`) whose installed version differs; an extra folder in `node_modules/.package-lock.json` is never iterated, so a `cloc` left in an existing `node_modules` is no lack. This worktree is such a checkout: `ls node_modules/cloc` prints `lib` and `package.json` after the uninstall, and the start check's own test file passes.
- C9. Checked by reading after the change; each sentence is listed under "Head comments and documents" below.
- C10. By reading `src/lib/views/shared/card/pane-fold.ts:45`: `open: (key) => !folded().includes(key)`, so `hooks` in the saved list keeps the hooks folded, and `toggle` keeps every other key through `foldedWith` (`src/lib/state/shared/page/folds.ts:23-26`, `folded.filter((one) => one !== key)`), so a `lines` left in the list is read by nothing. No code reads or prunes it; decision 3 leaves its removal from `~/.oculus/views.json` to the orchestrator, which I did not touch.
- C11. By reading `src/lib/data/places/shipped.ts:7-17` (`'docs'` is shipped as it is on the tree) and `src/desktop/release.ts:56` (`['ci', '--omit=dev', '--ignore-scripts', ...]`, an install from the lock): with C2 showing `docs/licenses/GPL-2.0.txt` gone and C3 showing no `cloc` in `package-lock.json`, the release app holds neither.

## DONE / NOT DONE

| Deliverable | Status | Proof |
|---|---|---|
| Item 1: `LineCounts.svelte`, `lines.svelte.ts`, the route with its folder and `server/machine/lines.ts` deleted | DONE | C2 after: `ls: src/routes/api/(machine)/lines: No such file or directory` and the four other "No such file or directory" lines, `exit 1` |
| Item 1: `LineCounts` out of `Status.svelte`, hooks 16 px below the git line | DONE | `git diff src/lib/views/system/status/Status.svelte`: import and element gone, `.groups` with `display: flex; flex-direction: column; gap: 16px` replaced by `.hooks { margin-top: 16px; }`; the gaps are measured at the look (C6) |
| Item 1: `lines` and its doc comment out of `context.ts` and `client-state.ts` | DONE | `grep -rn "createLines\|LinesStore\|system/lines" src` prints nothing; svelte-check in the verify list: `0 ERRORS 0 WARNINGS` |
| Item 1: the four model types and `trackedFiles` deleted, no helper of `files.ts` left unused | DONE | `grep -rn -e trackedFiles -e FolderLines -e LanguageLines -e LineTally src tests` prints nothing; every name `files.ts` imports occurs at least twice in it (`grep -cw <name> src/lib/server/core/git/files.ts`: `run` 9, `refused` 7, `milliseconds` 4, `TIMEOUT_MS` 4, `reasonOf` 3, `Read` 3, `HASH`, `NO_REPOSITORY`, `pathInside`, `FILE_LOG_FORMAT`, `parseFileLog`, `GitFilePage` 2 each), so each is read by `ignoredIn`, `keptFiles` or `fileLog`; eslint passes in the verify list |
| Item 2: the `lines_*` words, `fix_perl_xcode`, `needs_perl` and every other word the deleted code alone read | DONE | `git diff config/`: the 22 `status.lines_*` keys, the two `server.start` keys and `app.thousands_separator` removed; `tests/checks/source/keys.test.ts` in the verify list (see its last lines) |
| Item 3: the `'perl'` kind and row out of `first-run.ts`, head comment, "four" made "three" twice, `PROGRAMS` without `'perl'` | DONE | C4 after: `exit 1` with no line; `npx vitest run tests/server/root/process/first-run.test.ts ...` after: 17 rows passed, 0 failed |
| Item 4: `npm uninstall cloc --package-lock-only`, no `cloc` in `package.json` or the lock | DONE | C3 after: `exit 1`; `git diff --stat -- package.json package-lock.json`: `2 files changed, 11 deletions(-)`, every removed line cloc's (quoted below) |
| Item 4: `docs/licenses/GPL-2.0.txt` deleted, cloc's row out of `docs/third-party.md`, its opening says one program | DONE | C2 after; `git diff docs/third-party.md` |
| Item 5: every sentence naming them made true | DONE | the grep of item 5 below, each hit judged; "Head comments and documents" below |
| C5: no line added by `sh utils/unused-exports.sh` | DONE | `diff ../O129-base/unused-exports.txt <after>`: only `<` lines (removals) and the two counts, `Unused exports (228)` to `(226)` and `Unused exported types (108)` to `(107)` |
| Verify 2a: `npx vitest run tests/server/machine/hpc/submit-files.test.ts tests/checks/config/config-folder.test.ts` before and after | DONE | before: `Test Files  2 passed (2)`, `Tests  32 passed | 2 skipped (34)`; after (run with `first-run.test.ts` in the same call, after the last source change): `Test Files  3 passed (3)`, `Tests  49 passed | 2 skipped (51)`; the two skipped rows both times are config-folder's real-hub rows, `skipped: OCULUS_TEST_HUB is not set` |
| Verify 3: `npm run diagrams` then `npm run test:quick`, once | DONE | `npm run diagrams` exit 0; `npm run test:quick` (34 changed files, 327 test files chosen, among them `first-run.test.ts`, `submit-files.test.ts`, `config-folder.test.ts`, `tests/checks/source/keys.test.ts` and `tests/checks/diagrams/diagrams.test.ts`) ends with the lines quoted below, `test:quick: 306.7 s; every command passed` |

## The commands quoted

`npm run test:quick`, its last lines:

```
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.4 s)
ok      eslint (14.2 s)
ok      svelte-check (39.9 s): 1793712568908 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (149.5 s): Duration  131.18s (transform 71.71s, setup 0ms, import 148.15s, tests 276.23s, environment 5ms)
ok      vitest (201.1 s): Duration  184.60s (transform 186.20s, setup 0ms, import 338.72s, tests 356.78s, environment 14.64s)
ok      vitest slow (304.0 s): Duration  287.67s (transform 31.12s, setup 0ms, import 232.22s, tests 902.64s, environment 22ms)
test:quick: 306.7 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

C3 after, `git diff -- package.json package-lock.json`, every changed line:

```
package-lock.json @@ -30,7 +30,6 @@
-                "cloc": "2.6.0-cloc",
package-lock.json @@ -4522,15 +4521,6 @@
-        "node_modules/cloc": {
-            "version": "2.6.0-cloc",
-            "resolved": "https://registry.npmjs.org/cloc/-/cloc-2.6.0-cloc.tgz",
-            "integrity": "sha512-fCHPvFN6I7WmC005u99WqLxqWnWhEra0YCppc2k8lpRZrPFIEaHaNxgJ+funlSRIZMSIOqxwpt7pmEKDPFCz2g==",
-            "license": "GPL-2.0",
-            "bin": {
-                "cloc": "lib/cloc"
-            }
-        },
package.json @@ -81,7 +81,6 @@
-        "cloc": "2.6.0-cloc",
```

No changed line outside cloc's. npm printed its audit summary and `npm warn install-scripts 1 package has install scripts not yet covered by allowScripts: fsevents@2.3.3`, and exited 0; `node_modules` was not touched (`ls node_modules/cloc` still lists `lib` and `package.json`).

C5 after, `diff ../O129-base/unused-exports.txt <after>`:

```
1c1
< Unused exports (228)
---
> Unused exports (226)
81d80
< src/lib/server/machine/lines.ts: TOP_LEVEL, CLOC_TIMEOUT_MS, counted, folderOf, todoLine
180d178
< src/lib/state/system/lines.svelte.ts: readCount
230c228
< Unused exported types (108)
---
> Unused exported types (107)
317d314
< src/lib/state/system/lines.svelte.ts: Lines
```

`grouped` of `src/lib/state/shared/words/format.ts` had `LineCounts.svelte` as its one importer, so with that file deleted the script lists it as unused; the word it read, `app.thousands_separator`, had no other reader (`grep -rn "thousands_separator" src tests config` printed only `format.ts:49` and `app.yml:322`). Both are removed, and the run above is the one after that removal. After it, `grep -rn "thousands_separator\|app\.thousands" src tests config docs` prints nothing.

The grep of item 5, run as `grep -rnw -e cloc -e perl ...`, `grep -rn -e LineCounts -e 'lines\.svelte' -e 'api/lines' -e trackedFiles -e LineCount -e FolderLines -e LanguageLines -e LineTally -e GPL ...` and `grep -rni 'line count' ...` over `src tests config docs README.md package.json utils --exclude=local.yml`, after the diagrams were written: 62 lines, none of them naming the removed count. Every hit is unrelated:

- `LineCounts` of `src/lib/server/core/git/parse.ts:272,284,285,315`, the numstat map: left alone by the brief.
- `getLineCount` (Monaco) in `src/lib/ui/controls/editor/commands.ts`, `gutter/editor-gutter.ts:130`, `Editor.svelte:268,299`, `kit/latex/latex-widget.ts:79`; `contextLineCount` and `minimumLineCount` in `diff/DiffEditor.svelte:229-230`; `gitLineCount` in `state/sources/repositories/diff/diff-hunks.ts:61` and `views/sources/repositories/diff/DiffSection.svelte:65,273,274`: left alone by the brief.
- `LineCounter` of the `yaml` package in `data/snapshot/schema/check.ts`, `lists.ts`, `run.ts`, `data/sources/config/catalog/agents.ts`, `server/files/source/list-entries.ts`, `server/machine/runs/commands/files.ts`, `state/system/config/rows.ts`: a library class, unrelated.
- "line count(s)" in prose about other things: `data/model/model-sessions.ts:251` and `server/core/git/parse.ts:10`, `server/core/git/state.ts:269`, `views/shared/changes/ChangeCounts.svelte:2`, `views/shared/changes/groups/ChangeRow.svelte:6,16` (a diff's added and deleted lines); `ui/forms/TextArea.svelte:11`, `ui/controls/editor/gutter/editor-gutter.ts:73`, `views/sessions/terminal/terminal-list.ts:4,462` (a text's lines); `server/machine/processes/match.ts:7` ("the head line counts"), `state/boards/board/stats.ts:26`, `state/sessions/terminal/viewport.ts:18,45`, `state/sources/explorer/notes/note-index.ts:154`, `state/sources/repositories/repositories.ts:820` ("line counted", "line counts from one"); `tests/checks/tree/size.test.ts:28` (the size limit).
- `GPL` in `docs/licenses/LGPL-2.1.txt:9` and `docs/third-party.md:7` (7z-wasm's LGPL row): stays with 7z-wasm.
- `perl` in `tests/tiers/run.mjs:25` (the ASCII gate) and `tests/data/sources/config/settings.test.ts:75,587` (a process pattern): left alone by the brief.

`grep -rlE "cloc|perl|LineCounts|lines\.svelte|api/lines|trackedFiles|FolderLines|LanguageLines|LineTally|GPL|machine/lines|system/lines" docs/diagrams` after the diagrams: exit 1, no file.

## Terms

`docs/glossary.md` does not exist (the brief check's `ls docs/glossary.md`: "No such file or directory"); the step adds no term.

## Files changed, with line counts after the step

From `git status --short` and `git diff --numstat` (the base copy holds only `unused-exports.txt`, so the tree is compared with HEAD, the base).

| Path | Lines now | Added / removed | On the write list |
|---|---|---|---|
| `src/lib/views/system/status/LineCounts.svelte` | deleted | 0 / 191 | yes |
| `src/lib/state/system/lines.svelte.ts` | deleted | 0 / 168 | yes |
| `src/routes/api/(machine)/lines/+server.ts` (folder removed) | deleted | 0 / 16 | yes |
| `src/lib/server/machine/lines.ts` | deleted | 0 / 387 | yes |
| `docs/licenses/GPL-2.0.txt` | deleted | 0 / 338 | yes |
| `src/lib/views/system/status/Status.svelte` | 179 | 9 / 16 | yes |
| `src/lib/state/client/context.ts` | 877 | 0 / 3 | yes |
| `src/lib/state/client/shapes/client-state.ts` | 199 | 0 / 3 | yes |
| `src/lib/data/model/index.ts` | 835 | 0 / 24 | yes |
| `src/lib/server/core/git/files.ts` | 141 | 4 / 21 | yes |
| `src/lib/server/core/git/run.ts` | 354 | 8 / 10 | yes |
| `src/lib/data/places/shipped.ts` | 17 | 1 / 2 | yes |
| `src/lib/server/root/process/start/first-run.ts` | 271 | 10 / 15 | yes |
| `tests/server/root/process/first-run.test.ts` | 238 | 1 / 1 | yes |
| `config/text/views/system/status.yml` | 12 | 0 / 22 | yes |
| `config/text/server.yml` | 633 | 0 / 2 | yes |
| `src/lib/ui/controls/heads/GroupHead.svelte` | 239 | 8 / 8 | yes |
| `package.json` | 132 | 0 / 1 | yes |
| `package-lock.json` | 10328 | 0 / 10 | yes |
| `docs/third-party.md` | 9 | 1 / 2 | yes |
| `docs/HELP.md` | 617 | 1 / 1 | yes |
| `README.md` | 118 | 0 / 1 | yes |
| `docs/diagrams/channels.dot`, `channels.svg` | | 2 / 2, 5 / 5 | yes ("any other file `npm run diagrams` rewrites"); the label `context.ts:175` becomes `context.ts:174`, since one import line of `context.ts` went |
| `docs/diagrams/layers.dot`, `layers.svg` | | 6 / 6 each | yes |
| `docs/diagrams/layer-views.dot`, `.svg` | | 3 / 3 each | yes |
| `docs/diagrams/layer-state.dot`, `.svg` | | 3 / 3 each | yes |
| `docs/diagrams/layer-server.dot`, `.svg` | | 2 / 2 each | yes |
| `src/lib/state/shared/words/format.ts` | 123 | 4 / 17 | no: `grouped` (and its head-comment clause) had `LineCounts.svelte` as its one importer, so the export rule of `spec.md:89` and item 2's "every other word the deleted code alone read" remove it |
| `config/text/app.yml` | 337 | 0 / 1 | no: `app.thousands_separator` was read only by `grouped` (item 2) |
| `.scratch/migration/agents/reviews/O129-report.md` | this file | | yes |

## Edits to existing assertions

One, in `tests/server/root/process/first-run.test.ts:73`, the list every row of G73's file reads:

- before: `const PROGRAMS = ['git', 'tmux', 'perl', 'claude'];`
- after: `const PROGRAMS = ['git', 'tmux', 'claude'];`

No row is added, removed or changed; no allow list or predicate is edited. The rows that fail before are quoted under C1.

## Head comments and documents (C9, item 5, `spec.md:72`)

- `Status.svelte` head comment, first and third paragraphs: rewritten (the hooks block and the Gallery; the `Surface` holds the facts and the hooks). Its CSS comment: rewritten, "The hooks 16 px below the facts, and the Gallery 16 px below the hooks."
- `GroupHead.svelte:50-68`: rewritten, "the Status view's hooks and Gallery, with the Gallery's sections nested in it (Hooks.svelte, views/system/status/Gallery.svelte)", paragraph rewrapped.
- `git/run.ts:32`: the `ls-files -z` line removed from the command list; the `--cached --others --exclude-standard` form stays. `run.ts:52-59`: rewritten, "`ls-files` is Submit's file list: ...", paragraph rewrapped.
- `git/files.ts:1-4`: rewritten, "The git forms the file browser, Submit and the Timeline read a folder or a file by: which entries of a listed folder the repository ignores, the paths it keeps under a folder (tracked, or untracked and not ignored), and the commits that touched one file." The Timeline is the reader of `fileLog` (`FILE_LOG_ENTRIES` doc, `files.ts:22`, "one page of the Timeline").
- `keptFiles`' doc comment (`files.ts:50-56`): still true.
- `shipped.ts:1-5`: rewritten, it names only the release app.
- `first-run.ts:17-24` (head, perl gone, paragraph rewrapped), `:53` and `:174` ("three programs"): rewritten. `packageLacks`' and `machineFacts`' doc comments: still true.
- `format.ts:1-4`: rewritten without "a count with its thousands grouped".
- `pane-fold.ts:1-16` ("the Status and Processes views' sections"): still true, the hooks block is a Status section folded through it.
- `Hooks.svelte:1-8`: still true.
- `docs/third-party.md:3`: rewritten, "One bundled program is under a copyleft license and is not linked into oculus's code: it is a separate program that oculus runs in a process of its own." Checked against 7z-wasm: `src/lib/server/machine/runs/recover/unpack.ts:1` says it is "run by Node in a process of its own".
- `docs/HELP.md:249`: rewritten, "The connection, the snapshot, the hooks block, and the Gallery, ...".
- `README.md:58`: the perl line removed; `README.md:101` ("names the bundled programs under other licenses") still true with 7z-wasm left; the Checks section unchanged and the README names `perl` nowhere (`grep -n perl README.md` prints nothing).
- `docs/apps.md`: names no line count (`grep -rniE "lines of code|line count|api/lines" docs` finds nothing about the count).

Plain prose and history check: `git diff -U0 | grep "^+" | grep -v "^+++" | grep -niE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O12[0-9]|20[0-9][0-9]-"` prints nothing. Each new sentence above was read against `spec.md:21` (no em dash, no quip, no "not X but Y") and `spec.md:44` (no package id, date or comparison with an earlier state); no departure.

ASCII: `LC_ALL=C grep -n '[^ -~]'` over every touched file prints nothing (exit 1), `package-lock.json` included (`grep -c` 0).

## Judgment calls the brief left open (each reversible)

1. The wrapper that holds the hooks is renamed from `groups` to `hooks` (`<div class="hooks">`, rule `.hooks`), since it holds one group. The class is scoped by Svelte to `Status.svelte`; no test or other file names `.groups` of this view (`grep -rn "\.groups" src/lib/views/system/status tests` finds only unrelated `groups` fields).
2. `grouped` of `format.ts` and `app.thousands_separator` are removed with the count, outside the write list, for the reason in the file table.
3. The `files.ts` head comment names the Timeline as the reader of the commits of one file, where it named the Status view before for the tracked paths; I chose to name the reader that is left rather than drop the readers' list.

## Host- or user-visible changes, before and after

- The Status view: before, a "Lines of code" group (folder, language and total rows, Count again) stood between the git line and the hooks block; after, the hooks block stands 16 px below the git line and the Gallery 16 px below the hooks. Look on landing: open the Status view (any state; a tab with `folded: ["lines", "hooks"]` should show the hooks folded), measure with `getBoundingClientRect` the gap from the git line's bottom to the hooks heading's top and from the hooks block's bottom to the Gallery heading's top: both 16 px, and no Lines of code group.
- `GET /api/lines` has no route after the step (the folder `src/routes/api/(machine)/lines` is gone, C2); what the server answers for it was not run (no server is started by a builder), and no client asks for it (`grep -rn "api/lines" src` prints nothing).
- The start check: a machine with no `perl` gets no "perl was not found, so the line counts of the Status view do not work" line, at the terminal start and in the app's first window.
- The release app ships no `docs/licenses/GPL-2.0.txt` and no `node_modules/cloc`.
- README's program list and HELP's views row no longer name the line counts or perl; `docs/third-party.md` lists 7z-wasm alone.

## Anything in the brief that was wrong or impossible

Nothing. Two places the brief's lists did not name were needed, `format.ts` and `app.yml`, for the reason above.

## Limitations and sharp edges

- This worktree's `node_modules` still holds `cloc` (the uninstall wrote only the two package files, as the brief orders); C8 shows by reading that it is no lack.
- The saved `lines` key in `~/.oculus/views.json` is left for the orchestrator (decision 3).
- The look (C6) is the only proof of the two 16 px gaps; I started no page.

## Runs of the list and whole-suite commands

`npm run test:quick` ran once, after the last change, with `npm run diagrams` right before it. No whole-suite command was run.
