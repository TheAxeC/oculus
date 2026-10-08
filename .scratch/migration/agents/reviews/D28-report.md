# D28 report: saving a source file as VS Code saves it

D28 is built and its checks are green, with these parts NOT done: (1) case 43's press-to-text time was measured on the server only, so the 4 to 6 second wait is not reproduced and the 300 ms bound is not shown in a browser or on TEST; hypothesis H3 was not tested; (2) the on-screen half of every case the brief assigns to the look (1 to 6, 8, 10, 11, 18, 22, 23, 26, 33, 34, 37, 39, 43, 49, 50, 52, 53, 58) is not run, because I ran no browser; (3) cases 21 (the 50-copy history bound under a delay of 0), 34 (caret, scroll and one Cmd+Z after a trimming save), 47 (a 3 MB file in the page), 51 (an automatic save over a half-typed `config/behavior.yml`) and 54 (the tab marked gone for a folder) have no run behind them and are marked "not verified" below.

Scratchpad `$S` below is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/d28`. Every command ran in `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D28/tools/oculus` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. `$S/base` is the copy of the tree as dispatched, and `$S/old` is `$S/base/src` with the current tests copied in, which is the "unchanged tree" below.

## 1. Open items in the state file, verbatim

The state file `tools/oculus/.scratch/migration/orchestrator-state.md` holds one open item (`grep -n "^- Open item" ...`):

- Open item 5 (2026-10-08, X3e's landing): the root drag of the Files tree has no guarded entry, so the test written for S-R1 (`tests/views/shared/explorer/root-drag.test.ts`: a drop over a tree whose own drag never ended, from a drag of another tab, writes no order; the tree's own drag still drops) is not landed and is kept as `agents/reviews/X3e-root-drag-test.patch`. A wrong drop writes the order of the roots into `sources.yml` or the workspace in force, a wrong configuration written. Options: (a) a new entry G57, "A root dropped on a Files tree reorders only that tree's roots: a drag from another tab, or one whose start was in another tree, writes no order", Code `src/lib/views/shared/explorer/tree/control/dragging.svelte.ts`, Test the patch's file with its two titles, landed in the next step that touches the tree (D28); (b) no entry, the fix kept and the look the check, as for every view. Recommended (a): the failure writes the reader's configuration, the kind of cost spec.md names for a test, and the test runs in well under a second; (b) is the lazy option, since it leaves a configuration write with no check that runs.

D28 did not touch `src/lib/views/shared/explorer/tree/control/dragging.svelte.ts` and writes no G57 test; the item stays with Axel.

## 2. The first run of every case

First run means: on the tree as dispatched, before any change. Server cases: `cp $S/probe/server.test.ts tests/zz-probe/ && npx vitest run tests/zz-probe/server.test.ts` (labels `c3`, `c7`, `c12`, `c13`, `c14`, `c37-41`, `c42`). State cases: the same with `$S/probe/state.test.ts` (labels `c1`, `c2`, `c7`, `c10`, `c18`, `c23`, `c44`). Config cases: `$S/probe/config.test.ts` (`c27`). Timing: `$S/probe/time.test.ts`. The probe files were deleted from the tree after each run (`git status --short -uall . | grep -c zz-probe` prints 0). Where the feature does not exist on the dispatched tree, the first run is the absence, shown by `grep` over `$S/base`, and by the new test failing there (section 5, "Failing lines on the unchanged tree"). "Now" names the test (file and title) or the probe that shows the case in the finished tree.

Absence greps on `$S/base`: `grep -rIl autosave src config` lists `src/lib/state/life/notes.ts`, `src/lib/views/sources/note/Note.svelte`, `config/behavior.yml` and `config/catalogs/options.yml` (the notes' own autosave, not `editor.autosave`); `grep -rIl "trim_trailing_whitespace\|final_newline" src config` prints nothing; `grep -rn "'source:'" src/lib/server src/lib/state` prints nothing; `grep -c unsaved src/lib/state/sources/repositories/repositories.ts` prints 0; `grep -n "base\|hash" $S/base/src/lib/server/files/source.ts` prints nothing.

| Case | First run on the unchanged tree | Now |
|---|---|---|
| 1 | `c1`: 1.2 s after another program appended, the clean tab still holds `one\n`; 2 requests, both the initial reads | test `tests/state/sessions/source.test.ts` 'takes the new text into a clean tab, with its edits, and keeps no unsaved mark'; caret and scroll are the look's |
| 2 | `c2`: the dirty tab holds `typed\n`, no disk fact, 2 requests | same file, 'keeps the typed text of a dirty tab and marks it changed' |
| 3 | `c3`: status 200 `{"ok":true}`, the file now holds `typed\n` (the other program's text is gone), 1 history copy | probe `c3` on the finished tree: status 409 `changed`, `refused: [{field: base, reason: changed}]`, file `other program\n`, 0 copies; tests `tests/routes/files/source.test.ts` 'refuses a save whose base differs from the hash of the file and writes nothing' and `source.test.ts` (state) 'refuses the save of a changed file on the base the tab read, and says the conflict'; the line with Compare, Overwrite and Revert is drawn by `DiskNote.svelte`, seen at the look |
| 4 | `grep -c unsaved` on base `repositories.ts` is 0: no `unsaved` subject | probe `c4` ($S/new-diff-probe.txt): id `unsaved@tab-1:hub:a.md`, label `a.md (in file) <-> a.md (in oculus): Resolve save conflict`, `unsaved` kept through the saved-state round trip, address `/api/file/hub/a.md`, `diffActs` false (no hunk action); typing on the right is the look's |
| 5 | `c3`: 1 history copy, made after the overwrite (the base gave no refusal) | test 'writes the tab text over the file with no base when the reader overwrites' (state) and 'writes over whatever is there when the body carries no base' (route, one history copy of the bytes the compare read) |
| 6 | `c18`: Revert File on a dirty tab held `one\n` after 0 reads: it takes the text it last read, not the disk | test 'takes the file as the disk holds it now when the reader reverts' (state) |
| 7 | `c7`: answer `{"ok":true}` without a hash; the POST body carries no `base` | probe `c7` now answers `hash`; tests 'writes a save whose base the file holds and answers the hash of the bytes written' (route) and 'draws no change for the message of the tab own save, even ahead of the answer' (state) |
| 8 | no channel exists on the dispatched tree | test 'follows one channel for two tabs over one file: the clean one reads, the dirty one is marked' (state, one `source:` subscription) and 'is subscribed once for several tabs over one file, and dropped when the last one closes' |
| 9 | the route takes no `stat`; the new test fails at `tests/routes/files/source.test.ts:183` `expected 200 to be 409` | test 'refuses a save when a second stat right before the write differs from the first' passes: 409, outside text on disk, no history folder made |
| 10 | `c10`: the ui store has no `gone` fact (`[]`); `fs.fileGone` is a function | probe `c10` (finished tree): `disk: gone`, text `typed\n` kept, save sends `create: true`, file `typed\n`; test 'marks a tab gone when the file is deleted, keeps its text, and a save makes the file again'; the struck label and the `Deleted` tooltip are the look's |
| 11 | same absence as 10 | probe `c11`: gone, `closeAsks` null, `saveOk` true |
| 12 | `c12`: 404 `the file is not there` for a gone folder | same answer now (`c12`, `c12-gone-folder-create`); test 'makes a file that is not there when its folder is in the root, and refuses a folder in its place' includes `gone/new.md` giving 404 |
| 13 | `c13`: the save wrote the link's target `b.md` and the link stayed a link | probes `c13-poll` (the hash moves to the target's hash) and `c13-overwrite` (target holds `typed\n`, `readlink` still the target); the clean-versus-dirty reaction is case 1 and 2 |
| 14 | `c14`: 403 `the path is outside the named root`, the outside file `outside\n` | same now; test 'publishes null for a file replaced by a link out of every root and reads nothing of its target' (`tests/server/files/open-files.test.ts`) |
| 15 | no channel | test 'never polls or publishes a name out of the roots, a root nothing names or an empty path' and 'takes no name that does not start with source:' |
| 16 | no channel | test 'closes the poll when the last socket drops the name, and hands the next one a fresh hash' |
| 17 | `c7-draft-keys` lists no `disk` key: a draft cannot be marked changed | probe `c17`: Timeline Restore body has no base, and the open dirty tab becomes `disk: changed` |
| 18 | `c18`, as case 6 | test of case 6; probe `c18`: text `rewritten by another program\n`, `saved` the same, clean |
| 19 | the key does not exist (grep above) | test `tests/state/sessions/autosave.client.test.ts` 'saves nothing under off, however long the reader waits' |
| 20 | the key does not exist | tests 'saves once, a delay after the last edit, and not before', 'starts the wait again at each edit, so typing every 500 ms for 3 s saves once', 'never formats the document, whatever the language says' |
| 21 | the key does not exist | test 'saves each edit at a delay of 0, every save sending the hash the save ahead of it answered'; the 50-copy bound: `SAVES_KEPT = 50` at `src/lib/server/files/fs/history.ts:53` and `diff $S/base/src/lib/server/files/fs/history.ts src/lib/server/files/fs/history.ts \| grep -c SAVES_KEPT` prints 0; not run with 51 saves, not verified |
| 22 | the key does not exist | tests 'saves a tab when its editor loses focus, formatting the document when the language says so' and 'saves every tab holding unsaved text when the page loses focus'; the press in the Files tree, the press into a Document frame and Cmd+Tab reach `blurred` and `pageBlurred` through `Editor.svelte` and `followPage`, which is the look's |
| 23 | `c23`: the close asks `Close this tab and lose its unsaved changes?`; the ui store has no `saveBeforeClose` (`c23-ui-has-saveBeforeClose` false) | tests 'under %s with a delay of %i saves the tab first: %s', 'leaves a tab whose save is refused unsaved, for the question to ask about' and the three rows of `tests/state/workbench/navigation/pages.test.ts`; the question's dialog is the look's |
| 24 | the key does not exist | test "writes nothing for a tab marked changed, and the reader's own Save shows the conflict" |
| 25 | the key does not exist | test 'writes nothing for a tab that is %s' (read-only, truncated, not UTF-8 text, at HEAD, at the index, untitled) |
| 26 | the key does not exist | test 'from off to after_delay saves the tabs that hold unsaved text at once' |
| 27 | `c27-options-keys` on base: `tabSize, insertSpaces, wordWrap, minimap, renderWhitespace, stickyScroll, languages, fitsTabSize, fitsWrap`: no autosave key; the G13 test fails at `tests/checks/config/config.test.ts:418` (57 names against 61) | `config.test.ts` 'words each wrong setting against behavior.yml from the catalog, and nothing for the shipped files': `sometimes`, `-5` and `1.5` each give the default (`off`, 1000) and one finding naming the key |
| 28 | not run on the dispatched tree | probe `c28` ($S/c28.txt): an `after_delay` save of `hub/paper/main.tex` calls the store's `saved` callback with `["hub","paper/main.tex"]`, which `src/lib/state/client/context.ts:471` wires to `latex.onSaved`; the build itself is the look's |
| 29 | `trimText` does not exist (`Cannot find module save-text.ts`) | `tests/data/helpers/files/save-text.test.ts` 'takes %s' (seven rows, the CRLF row keeps every carriage return) |
| 30 | `endText` does not exist | same file, describe 'endText' (nine rows: `abc`, CRLF `abc`, `abc\n\n\n`, `""`, `\n\n`, `abc\n  ` and the rest) |
| 31 | no keys | probe `c31-defaults` ($S/new-rules-probe.txt): `trim false, finalNewline false`; the trim and final-newline tests run only when the rule is on |
| 32 | no keys | probe `c32-md`: `trim false, finalNewline true`; `c32-py`: trim true; `c32-repo-py-final-newline-false`: the repository override gives `finalNewline false` |
| 33 | no keys | test 'keeps the whitespace before a kept place on its line and trims every other line' |
| 34 | no keys | not verified by a run: the save rewrites the text as smallest edits (`editsBetween`, `src/lib/data/prose/text-edits.ts`), which keeps the caret; the look decides |
| 35 | the G13 test fails at `config.test.ts:418` | `config.test.ts` rows for `editor.languages.cpp.trim_trailing_whitespace` and `editor.languages.python.final_newline`: one finding each naming the key, the field not read |
| 36 | no final newline step exists | probe `c36` ($S/c36.txt): trim, a format that appends `\n\n\n`, then final newline saves `typed\n` |
| 37 | `c37-41`: `latin.txt` status 200, file now 4 bytes (overwritten) | probe now status 403 `binary`, file 9006 bytes unchanged; test 'refuses a file holding %s, and leaves its bytes' (Latin-1 row); the pane under `source.not_text` is the look's |
| 38 | `c37-41`: `nul.txt` status 200, file now 4 bytes | probe now 403 `binary`, 10006 bytes unchanged; same test, NUL row |
| 39 | `c37-41`: `bom.txt` first bytes `65 64 69` (the BOM was dropped) | probe now `ef bb bf`; test 'keeps the byte order mark of a file that starts with one' |
| 40 | `c37-41`: `straddle.txt` 200 | still 200; test 'saves a file whose multi-byte character straddles byte 8,192, and an empty one' |
| 41 | `c37-41`: `empty.txt` 200 | still 200; same test; with `final_newline` on an empty text stays empty (`endText` row) |
| 42 | `c42`: BOM kept, Latin-1 refused 400 `binary`, NUL file status 200 and written | probe now: NUL file 400 `binary`; test `tests/routes/replace/lsp-edit.test.ts` 'refuses a file holding %s, and leaves its bytes' (fails on the unchanged tree for the NUL row, line 179 `expected 200 to be 400`) |
| 43 | section 3 | section 3 |
| 44 | `c44`: a restored draft holds `{text: typed, saved: old}` with no disk fact | tests 'marks a draft restored with unsaved text over %s' (three rows), 'shows the new text in a draft restored with no unsaved text', 'shows the Save of a draft restored with no base as the conflict, without a request' |
| 45 | the body carries no base, so no save could be refused | tests 'serializes the saves of one tab so each sends the hash the save ahead of it answered' and the delay-0 test of case 21 |
| 46 | no channel | test 'draws no change for the message of the tab own save, even ahead of the answer' |
| 47 | no channel | probe `c47-big`: a file over the text limit publishes a `stat:` signature, not a content hash, and `c47-big-after-append` shows it moves; the capped re-read in the page is not verified |
| 48 | no channel | probe `c48-root-dropped` after the fix: `{"a":{"hash":null},"big":{"hash":null}}`; test 'publishes null at the tick its root stops being served, and follows the file when it is served again'; probe `c48-save-root-dropped`: 403 `the path is outside the named root` |
| 49 | no channel | probe `c49`: page A's clean tab holds `saved from page B\n` and its dirty tab is `disk: changed`, one subscription |
| 50 | no channel | probe `c50`: with no write meanwhile a dirty and a clean tab stay `same`; the write-while-disconnected half rests on the test 'closes the poll when the last socket drops the name, and hands the next one a fresh hash' (a new subscriber's first message is the current hash) and is not run as a reconnect, so not verified as one |
| 51 | not run on the dispatched tree | the route half is the existing `localRefusal` (`src/lib/server/files/source.ts:160`); the autosave half is test 'does not try a refused save again until the reader types'; a save of a half-typed `config/behavior.yml` is not verified |
| 52 | no `unsaved` subject | probe `c4-saved-state-roundtrip`: `unsaved` and the id survive a reload; the left side is `/api/file/hub/a.md`, the right side the tab's draft; the drawing is the look's |
| 53 | no channel | test 'follows a file renamed under the tab, keeping its text and its mark and hearing the new file' (probe `c53-after-rename`: `disk: same`, text `typed\n`) |
| 54 | `c54`: 404 `the file is not there`, nothing written | probe now 409 with `refused: [{field: path, reason: folder}]`, the folder still there; test 'makes a file that is not there when its folder is in the root, and refuses a folder in its place'; the tab marked gone for a folder is not verified |
| 55 | no channel | tests 'moves with a tab pointed at another file: the old channel is dropped and the new one followed' and 'is followed by no untitled tab and no library tab' |
| 56 | no channel | test 'polls 200 names for one socket and 1,000 over the server, and no more' |
| 57 | no channel | tests 'is subscribed once for several tabs over one file, and dropped when the last one closes' and 'closes the poll when the last socket drops the name, and hands the next one a fresh hash' |
| 58 | `c23`: the Pages view and Open Editors close through a path that asks | `Pages.svelte`, `PagesReset.svelte`, `OpenEditors.svelte` (through `editor-closing.ts`) and `ActivityRail.svelte` call `saveBeforeClose` before the question; the state half is the `pages.test.ts` rows; the dialog is the look's |

## 3. D13a-3: the empty tab while a file is read

The words: `app.waiting` is no longer drawn by `Source.svelte` (`grep -n "app.waiting" $S/base/src/lib/views/sources/source/Source.svelte` finds line 438; `grep -rn "app.waiting" src` finds no use under `views/sources/source`). Until the draft loads the tab draws an empty pane.

The wait on the dispatched tree, measured with `$S/probe/time.test.ts` and a dev server:

- `loadConfig` over the real `config/` (`local.yml` is not read by it), 8 runs in ms: `[131, 77.9, 75.4, 81.8, 75.7, 72.3, 72.8, 72.6]`, and under load `[164.9, 94.1, 83.6, 86.9, 89, 92.9, 85.2, 104.5]`. `handleSourceInfo` itself: `[10.58, 0.24, 0.18, 0.14, 0.18, 0.13, 0.13, 0.12]`.
- Dev server on 127.0.0.1:8801, request header `sec-fetch-site: same-origin`, `curl -w %{time_total}`: `/api/file/hub/CONTEXT.md` 2.705 s on the first request (the dev server compiling), then 0.076 s and 0.073 s; `/api/source` 0.078 s to 0.125 s. A press makes three requests: the kind read (`readFileKind`), then `/api/file` and `/api/source` in parallel. Each runs `locals.config()`, which parsed every config file.
- Press-to-both-answers (kind read, then the two in parallel, one shell harness that includes two `python3` start-ups): 435, 443, 426 ms.
- The file measured was `hub/CONTEXT.md` (3,708 bytes), not a 130-byte file.

Hypotheses:

- H2 (each request parses every config file; falsified when `loadConfig` takes under 50 ms): not falsified. `loadConfig` takes 72 to 165 ms, three times per press.
- H3 (the read starts late; falsified when the time from the press to the first byte of the draft read is under 100 ms in a client test with stub reads): not tested. No client probe was run.
- H5 (a `spawnSync('ps')` holds the loop; falsified when no `ps` runs during the wait): one `ps` costs about 20 ms in a probe; whether one runs during a file open was not traced. Not settled, and 20 ms cannot account for seconds.

The fix, in `src/hooks.server.ts` (a path the brief names for it): `locals.config()` parses `config/` and holds the parse, keyed by the engine, with a stamp of the folder (path, inode, size, mtime and ctime of every file under it). A request takes the held parse while the stamp is the same and parses again once a file was added, removed or written. After it, on the same dev server: kind read 4.3 to 5.6 ms; the parallel pair, the slower of the two, 8.8 to 20.5 ms; the three in sequence 13 to 26 ms (`curl -w %{time_total}`, five runs). The harness figure of the whole chain went from 435 ms to 226 ms (the rest is the harness).

Proof of the fix: test `tests/server/root/hooks-server.test.ts` 'parses a config folder once for requests over it, and again once a file of it is written' fails on the unchanged `hooks.server.ts` at line 76 (`expected "loadConfig" to be called 1 times, but got 2 times`) and passes now. `DESIGN.md` line 261 and the comment at `src/lib/server/root/context.ts:226` say the new rule.

What is not shown: the 4 to 6 second wall time of the symptom did not reproduce in my runs (the server chain was about 225 ms before and about 15 ms after, plus a dev-only 2.7 s first request). The cache removes a measured 210 ms of server time per press; that it removes the reported 4 to 6 seconds is not shown. The 300 ms bound in a browser and on TEST is the look's measurement; if the wait is still there at the look, H3 and H5 are the unexplored hypotheses and the look's measurement comes back to this step as a repair round, as the brief says.

Dev servers: four `npx vite dev --port 8801` processes were started from this worktree, one at a time, each stopped with `kill <pid>` from its pid file (`$S/dev8801.pid`, `dev8801b.pid`, `dev8801c.pid`, `dev8801d.pid`); `ps -p` on each pid prints nothing now. Ports 8787 and 8790 were not used. The `vite dev` process on the main checkout (`/Users/axelfaes/workspace/research-hub/tools/oculus`, pid 7714) is not mine.

## 4. DONE and NOT DONE

| Part of the brief | State | Command that shows it |
|---|---|---|
| 1 Disk logic: hash on the channel, draft fields, conflict, Compare, Overwrite, Revert, deleted tab | DONE | `npx vitest run tests/state/sessions tests/server/files tests/routes/files` (passes within the 40-file run below) |
| 2 Server: base compare, second stat, hash in the answer, `create`, folder refusal, history from the compared bytes | DONE | `tests/routes/files/source.test.ts` and `history.test.ts` pass |
| 3 Autosave: off, after_delay, on_focus_change, close saves first | DONE (page events are the look's) | `tests/state/sessions/autosave.client.test.ts`, `tests/state/workbench/navigation/pages.test.ts` |
| 4 Trim, final newline, language and repository overrides, caret line kept | DONE (case 34 not verified) | `tests/data/helpers/files/save-text.test.ts`, probes `c31`, `c32`, `c36` |
| 5 Whole-file UTF-8 rule, kept BOM, `lsp-edit` | DONE | `source.test.ts` 'the bytes a save replaces', `lsp-edit.test.ts` 'the bytes an lsp-edit replaces' |
| 6 Code split: `state/sessions/source/` folder, `save/DiskNote.svelte`, folder counts | DONE | `ls src/lib/state/sessions \| wc -l` prints 10, `ls src/lib/state/sessions/source` 4, `ls src/lib/views/sources/source` 9, `ls src/lib/views/sources/source/save` 9; `wc -l` of `Source.svelte` 519, `Diff.svelte` 520; `tests/checks/tree/size.test.ts` and `boundaries.test.ts` pass in `npm run test:checks` |
| Config, words, docs (6.3, 6.4) | DONE | `config.test.ts` passes; `docs/files-and-search.md`, `docs/configuration.md`, `docs/window.md`, `HELP.md`, `DESIGN.md` edited |
| D13a-3 words and server cost | DONE | section 3 |
| D13a-3 the 4 to 6 s and the 300 ms bound | NOT DONE (not reproduced; browser time not measured) | section 3 |
| The on-screen halves of the look cases | NOT DONE (the look's) | none run |
| Cases 21, 34, 47 (page half), 51 (behavior.yml half), 54 (the gone mark for a folder) | NOT verified | none |

Checks, last run after the last change (`sh /Users/axelfaes/.claude-work/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, from `tools/oculus`, exit status 0):

```
test:quick: 107 changed file(s), from git since HEAD
test:quick: 108 test file(s), 10 essential
ok      ASCII gate (0.5 s)
ok      prettier (1.4 s): All matched files use Prettier code style!
ok      svelte-kit sync (1.7 s)
ok      eslint (5.6 s)
ok      svelte-check (5.4 s): 1791427138005 COMPLETED 432 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (21.7 s): Duration  18.22s (transform 21.83s, setup 0ms, import 34.32s, tests 36.44s, environment 248ms)
test:quick: 22.2 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
checks: 1 commands passed
```

- The ASCII gate (the perl command of `agents/spec.md:97` over `src tests config`, `local.yml` excluded): prints nothing, exit status 0. It is also the first line of `checks.sh`.
- `npx prettier --check .` prints `All matched files use Prettier code style!`; `npx eslint .` prints nothing; svelte-check prints `COMPLETED 432 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` (`checks.sh`), and `COMPLETED 3389 FILES 0 ERRORS 0 WARNINGS` with `--tsconfig ./tsconfig.json`.
- `npm run diagrams` run after the last import change; `docs/diagrams` is current (`npm run test:checks` passes the diagrams file).
- `npm run test:checks`: `Test Files 1 failed | 16 passed`, `Tests 2 failed | 241 passed`. The two failures are `tests/checks/config/integrity.test.ts` 'validates with no findings' and 'reads the portfolio deck with every named deck found'. `git -C ../.. ls-files deck` lists `deck/closing.md` and `ls ../../deck` says the folder is not in this worktree, so the real-hub rows cannot find the deck. They do not touch D28's files.
- `npx vitest run $(cat /tmp/d28tests.txt) tests/server/root tests/routes/files tests/routes/replace tests/server/files tests/state tests/shell`: `Test Files 40 passed (40)`, `Tests 283 passed (283)` (the 10 changed test files plus the folders around them).
- A plain `npx vitest run` ends `Test Files 3 failed | 155 passed`, `Tests 6 failed | 1213 passed`: the two integrity rows above, and `tests/checks/diagrams/diagrams.test.ts` and `tests/checks/imports/order.test.ts` rows that time out at the default 5000 ms under that run (`npx vitest run tests/checks/imports/order.test.ts` alone: 13 passed; the diagrams file takes 55 s a test and is run by `npm run test:checks`, which passes it).
- `checks.sh` ran to the end six times, each exit status 0. One earlier start from the worktree root did not run (`checks.sh` needs `package.json`, which the root of the worktree lacks).
- `sh utils/unused-exports.sh` against `$S/unused-base.txt` (`diff` output): the base run began with knip errors about `.svelte-kit/tsconfig.json` and a status-2 line; the counts `Unused exports (249)` and `Unused exported types (120)` are the same before and after. The only change in the lists is that `src/lib/state/sessions/source.svelte.ts: sourceInfoUrl, loadHeadFile, loadSourceReadonly` became `src/lib/state/sessions/source/draft.ts: sourceInfoUrl`.

## 5. Tests

New test files: `tests/data/helpers/files/save-text.test.ts` (G59), `tests/server/files/open-files.test.ts` (G2), `tests/state/sessions/autosave.client.test.ts` (G60), `tests/state/sessions/source-disk.client.test.ts` (G28), `tests/state/sessions/source-server.ts` (the fake server they share). New titles in existing files: `tests/routes/files/source.test.ts` (G8, G58), `tests/state/sessions/source.test.ts` (G28), `tests/state/workbench/navigation/pages.test.ts` (G28), `tests/checks/config/config.test.ts` (G13), `tests/routes/replace/lsp-edit.test.ts` (G58), `tests/server/root/hooks-server.test.ts` (G11). The titles are in section 10.

Failing lines on the unchanged tree (`cd $S/old && npx vitest run <files>`, output `$S/old-run.txt` and the rerun below):

- `tests/routes/files/source.test.ts`: ten rows fail: `:123`, `:137` (`expected 200 to be 409`), `:155`, `:169`, `:183` (`expected 200 to be 409`), `:193`, `:217` (twice, `expected 200 to be 403`), `:230` (`expected [ 101, 100, 105 ] to deeply equal [ 239, 187, 191 ]`), `:242`. The row 'a lone continuation byte' and the added `create: true` row of 'refuses a path outside the named root' pass on the unchanged tree.
- `tests/routes/files/history.test.ts:90`: `expected { ok: true } to deeply equal { ok: true, hash }`.
- `tests/checks/config/config.test.ts:418`: `expected [ 'calendar.days_ahead', ... (56) ] to deeply equal [ ... (60) ]`.
- `tests/checks/tree/boundaries.test.ts:556`: `expected [ Array(1) ] to deeply equal []` (the rows name `state/sessions/source/draft` and `data/helpers/files/save-text`, which do not exist there).
- `tests/state/workbench/navigation/pages.test.ts:64`: `TypeError: ui.registerSaveBeforeClose is not a function` (three rows).
- `tests/server/files/open-files.test.ts`, `tests/state/sessions/source.test.ts`, `tests/data/helpers/files/save-text.test.ts`, `tests/state/sessions/autosave.client.test.ts`, `tests/state/sessions/source-disk.client.test.ts`: the file does not load (`Cannot find module .../open-files.ts`, `.../source/draft.ts`, `.../save-text.ts`; `Failed to resolve import .../source/autosave.svelte.ts`, `.../source/source.svelte.ts`).
- `tests/server/root/hooks-server.test.ts:76`: `expected "loadConfig" to be called 1 times, but got 2 times`.
- `tests/routes/replace/lsp-edit.test.ts:179`: `expected 200 to be 400` (the NUL row; the Latin-1 row passes on the unchanged tree).

Every edit to an existing assertion:

- `tests/routes/files/source.test.ts` 'replaces the complete file through a temporary neighbour and atomic rename' (G9): before `expect(await response.json()).toEqual({ ok: true });`, after `toEqual({ ok: true, hash: createHash('sha256').update('whole replacement\n').digest('hex') })`.
- `tests/routes/files/history.test.ts` 'never copies the machine own config/local.yml' (the save under G9): before `expect(await answer.json()).toEqual({ ok: true });`, after `toEqual({ ok: true, hash: createHash('sha256').update('hub: /srv/x\n').digest('hex') })`.
- `tests/checks/tree/boundaries.test.ts`: the shell row `'state/sessions/source'` is `'state/sessions/source/draft'` and its comment (:157) says so; the state row gained `'data/helpers/files/save-text'` with a comment at :47.
- `tests/checks/config/config.test.ts`: the expected list of finding keys gained six names (`editor.autosave`, `editor.autosave_delay_ms`, `editor.final_newline`, `editor.languages.cpp.trim_trailing_whitespace`, `editor.languages.python.final_newline`, `editor.trim_trailing_whitespace`) and the wrong-settings fixture `tests/data/sources/config/wrong-settings.ts` gained the matching wrong values.
- `tests/state/sessions/source.test.ts` and `pages.test.ts`: imports and header comments only; their earlier cases are unchanged.

History-word grep over the lines this step adds (every added line of every changed file against `$S/base`, pattern `used to|formerly|previously|originally|no longer|was changed|renamed from|moved from|the old |legacy|earlier version|this step|D28|Z[0-9]{3}|brief|builder|package|bug|reverted|regress|dates`): two hits, both describing behaviour: `tests/state/sessions/source-disk.client.test.ts` 'the old channel is dropped and the new one followed' and `tests/state/sessions/source-server.ts` 'a save carrying a base the file no longer holds'. `// Revert: leave the draft clean once the reader typed.` in `tests/state/sessions/source.test.ts` is on the dispatched tree too (`grep -n "Revert:" $S/base/tests/state/sessions/source.test.ts` finds line 27).

## 6. Files

`git status --short -uall .` lists 107 paths under `tools/oculus` (the plan files are not counted). The table is `diff -rq` of `src`, `tests`, `config`, `docs` and the root files against `$S/base`, with the line count now and whether the brief's "Paths this step writes" covers the path. `src/lib/state/sessions/source/` is a new folder of four files.

| Path | Against base | Lines | Write list |
|---|---|---|---|
| `src/hooks.server.ts` | differs | 138 | OUTSIDE: D13a-3 fix, a path the brief names for it |
| `src/lib/data/helpers/editor.ts` | differs | 150 | in list |
| `src/lib/data/helpers/files/address.ts` | differs | 40 | OUTSIDE: the `source:` channel name builder and reader the page and the server both use |
| `src/lib/data/helpers/files/save-text.ts` | only in worktree | 69 | in list |
| `src/lib/data/helpers/files/text-kind.ts` | differs | 71 | in list |
| `src/lib/data/model/index.ts` | differs | 662 | OUTSIDE: the page-to-server `unsubscribe` message type |
| `src/lib/data/model/model-sessions.ts` | differs | 730 | in list |
| `src/lib/data/prose/text-edits.ts` | differs | 203 | in list |
| `src/lib/data/sources/config/editor-options.ts` | differs | 220 | in list |
| `src/lib/server/core/channels.ts` | differs | 240 | in list |
| `src/lib/server/core/file-bytes.ts` | only in worktree | 27 | in list |
| `src/lib/server/core/file-poll.ts` | differs | 107 | OUTSIDE: `pollFile` takes a function naming the path at each tick, so a renamed or dropped root stops the read |
| `src/lib/server/files/fs/history.ts` | differs | 372 | in list |
| `src/lib/server/files/fs/lsp-edit.ts` | differs | 143 | in list |
| `src/lib/server/files/fs/open-files.ts` | only in worktree | 221 | in list |
| `src/lib/server/files/source.ts` | differs | 345 | in list |
| `src/lib/server/root/context.ts` | differs | 789 | in list |
| `src/lib/server/root/process/serve.ts` | differs | 67 | in list |
| `src/lib/server/root/process/server-context.ts` | differs | 141 | in list |
| `src/lib/server/root/socket.ts` | differs | 248 | in list |
| `src/lib/shell/keys/rows/SymbolRows.svelte` | differs | 104 | in list (importer of the moved path) |
| `src/lib/shell/panes/PaneView.svelte` | differs | 512 | in list |
| `src/lib/shell/panes/strip/close-question.svelte.ts` | differs | 85 | in list |
| `src/lib/shell/rail/ActivityRail.svelte` | differs | 360 | OUTSIDE: the rail close of a tab saves first (case 58) |
| `src/lib/state/client/context.ts` | differs | 771 | in list |
| `src/lib/state/client/socket.svelte.ts` | differs | 454 | in list |
| `src/lib/state/client/writes.svelte.ts` | differs | 678 | OUTSIDE: the save answer carries `hash` through the write store |
| `src/lib/state/sessions/latex/actions.ts` | differs | 388 | in list (importer of the moved path) |
| `src/lib/state/sessions/source/autosave.svelte.ts` | only in worktree | 168 | in list |
| `src/lib/state/sessions/source/disk.svelte.ts` | only in worktree | 192 | in list |
| `src/lib/state/sessions/source/draft.ts` | only in worktree | 343 | in list |
| `src/lib/state/sessions/source/source.svelte.ts` | only in worktree | 704 | in list |
| `src/lib/state/sessions/source.svelte.ts` | only in base (deleted) | - | in list |
| `src/lib/state/shared/stores/shapes.ts` | differs | 394 | OUTSIDE: the `hash` field of the write answer |
| `src/lib/state/sources/fs-transport.ts` | differs | 468 | in list |
| `src/lib/state/sources/repositories/answers.ts` | differs | 347 | in list |
| `src/lib/state/sources/repositories/repositories.ts` | differs | 854 | in list |
| `src/lib/state/system/machine/debug/debug.svelte.ts` | differs | 751 | OUTSIDE: `saveDraft` returns whether the file holds the text (type) |
| `src/lib/state/workbench/navigation/editor-text.ts` | differs | 154 | OUTSIDE: `saveRulesOf`, the save rules of a tab (home chosen by the folder-order and boundary rules) |
| `src/lib/state/workbench/navigation/pages.ts` | differs | 522 | OUTSIDE: the close question after the save-first step (case 23, 58) |
| `src/lib/state/workbench/navigation/rail.ts` | differs | 119 | in list (importer of the moved path) |
| `src/lib/state/workbench/ui.svelte.ts` | differs | 757 | in list |
| `src/lib/ui/controls/editor/Editor.svelte` | differs | 517 | in list |
| `src/lib/ui/controls/editor/diff/DiffEditor.svelte` | differs | 491 | OUTSIDE: the conflict compare's editable right side |
| `src/lib/views/academic/present/acts/run.ts` | differs | 150 | in list (importer of the moved path) |
| `src/lib/views/feeds/linkedin/post-card.ts` | differs | 14 | in list (importer of the moved path) |
| `src/lib/views/sessions/session-list/Customizations.svelte` | differs | 248 | in list (importer of the moved path) |
| `src/lib/views/shared/explorer/opening.ts` | differs | 139 | in list (importer of the moved path) |
| `src/lib/views/shared/links/source-file.ts` | differs | 67 | in list (importer of the moved path) |
| `src/lib/views/sources/file/File.svelte` | differs | 489 | in list (importer of the moved path) |
| `src/lib/views/sources/files/control/editor-closing.ts` | differs | 46 | in list |
| `src/lib/views/sources/files/sections/OpenEditors.svelte` | differs | 287 | OUTSIDE: Open Editors' close saves first (case 58) |
| `src/lib/views/sources/repositories/diff/Diff.svelte` | differs | 520 | in list |
| `src/lib/views/sources/repositories/diff/DiffSection.svelte` | differs | 472 | OUTSIDE: the conflict compare's editable right side |
| `src/lib/views/sources/repositories/diff/diff-read.ts` | differs | 105 | in list |
| `src/lib/views/sources/source/Editor.svelte` | differs | 300 | in list |
| `src/lib/views/sources/source/Source.svelte` | differs | 519 | in list |
| `src/lib/views/sources/source/actions/BarActions.svelte` | differs | 149 | in list |
| `src/lib/views/sources/source/save/DiskNote.svelte` | only in worktree | 78 | in list |
| `src/lib/views/sources/source/save/SourceNote.svelte` | differs | 81 | in list |
| `src/lib/views/sources/source/save/locked-words.ts` | differs | 40 | in list |
| `src/lib/views/sources/source/save/tab-draft.svelte.ts` | differs | 78 | in list |
| `src/lib/views/sources/source/save/tab-save.svelte.ts` | differs | 51 | in list |
| `src/lib/views/sources/source/save/untitled-save.ts` | differs | 80 | OUTSIDE: `saveDraft` returns a boolean (type) |
| `src/lib/views/sources/source/status/library-tab.svelte.ts` | differs | 92 | in list (importer of the moved path) |
| `src/lib/views/sources/source/status/tab-file.svelte.ts` | differs | 94 | in list (importer of the moved path) |
| `src/lib/views/sources/source/status/tab-shown.ts` | differs | 80 | in list |
| `src/lib/views/sources/source/status/tab-state.ts` | differs | 37 | in list (importer of the moved path) |
| `src/lib/views/system/workbench/Pages.svelte` | differs | 394 | in list |
| `src/lib/views/system/workbench/PagesReset.svelte` | differs | 115 | OUTSIDE: the Pages view's reset close saves first (case 58) |
| `src/lib/views/system/workbench/editors/Origins.svelte` | differs | 46 | in list (importer of the moved path) |
| `src/lib/views/system/workbench/settings/EditLink.svelte` | differs | 24 | in list (importer of the moved path) |
| `src/lib/views/system/workbench/settings/Item.svelte` | differs | 330 | in list (importer of the moved path) |
| `src/lib/views/system/workbench/settings/List.svelte` | differs | 170 | in list (importer of the moved path) |
| `tests/checks/config/config.test.ts` | differs | 659 | in list |
| `tests/checks/tree/boundaries.test.ts` | differs | 748 | in list |
| `tests/data/helpers/files/save-text.test.ts` | only in worktree | 60 | in list |
| `tests/data/sources/config/wrong-settings.ts` | differs | 68 | OUTSIDE: the wrong values of the new keys (G13 rows) |
| `tests/routes/files/history.test.ts` | differs | 106 | OUTSIDE: one assertion gained `hash` (G9) |
| `tests/routes/files/source.test.ts` | differs | 245 | in list |
| `tests/routes/replace/lsp-edit.test.ts` | differs | 183 | OUTSIDE: the whole-file refusal of a language server's edit (G58) |
| `tests/server/files/open-files.test.ts` | only in worktree | 180 | in list |
| `tests/server/root/context-fixture.ts` | differs | 169 | OUTSIDE: the `openFiles` member of the server context |
| `tests/server/root/hooks-server.test.ts` | differs | 85 | OUTSIDE: the config parse is held until a file of config/ is written (D13a-3) |
| `tests/state/sessions/autosave.client.test.ts` | only in worktree | 282 | in list |
| `tests/state/sessions/source-disk.client.test.ts` | only in worktree | 75 | OUTSIDE: new test file under G28 |
| `tests/state/sessions/source-server.ts` | only in worktree | 128 | OUTSIDE: new test helper: the fake server |
| `tests/state/sessions/source.test.ts` | differs | 256 | in list |
| `tests/state/workbench/navigation/pages.test.ts` | differs | 118 | in list |
| `config/behavior.yml` | differs | 260 | in list |
| `config/catalogs/options.yml` | differs | 1331 | in list |
| `config/text/views/sources/source.yml` | differs | 129 | in list |
| `docs/configuration.md` | differs | 65 | in list |
| `docs/diagrams/channels.dot` | differs | 370 | in list |
| `docs/diagrams/channels.svg` | differs | 2048 | in list |
| `docs/diagrams/layer-server.dot` | differs | 156 | in list |
| `docs/diagrams/layer-server.svg` | differs | 764 | in list |
| `docs/diagrams/layer-state.dot` | differs | 170 | in list |
| `docs/diagrams/layer-state.svg` | differs | 838 | in list |
| `docs/diagrams/layer-views.dot` | differs | 179 | in list |
| `docs/diagrams/layer-views.svg` | differs | 809 | in list |
| `docs/diagrams/layers.dot` | differs | 90 | in list |
| `docs/diagrams/layers.svg` | differs | 493 | in list |
| `docs/files-and-search.md` | differs | 109 | in list |
| `docs/window.md` | differs | 82 | in list |
| `DESIGN.md` | differs | 576 | in list |
| `HELP.md` | differs | 185 | in list |


No path under `.scratch/`, `agents/guarded.md`, `plan.md` or the state file was written except this report. No file named `local.yml` was opened, printed or grepped.

## 7. Judgment calls

1. The save rules of a tab (`saveRulesOf`) live in `src/lib/state/workbench/navigation/editor-text.ts`, not in a file under `state/sessions/`. `state/sessions` may not import `state/workbench` (`tests/checks/imports/order.test.ts`), the rules need the resolved editor options, and the state row of `boundaries.test.ts` allows `data/helpers/files/save-text`.
2. `pollFile` (`src/lib/server/core/file-poll.ts`) takes a function that names the path at every tick, so a `source:` poll follows a root that was renamed or dropped and publishes null; `open-files.ts` keeps the resolved roots in memory and resolves them again on a `config` channel message and on a change of the saved workspaces file, because `loadConfig` costs 72 to 165 ms.
3. A `source:` channel for a file over the text limit publishes `stat:` plus the hash of the stat, so the server reads no byte of a 3 MB file (case 47).
4. The page-to-server `unsubscribe` message is typed `Unsubscription` in `src/lib/data/model/index.ts` and used by both `socket.ts` and `socket.svelte.ts`; the server acts on its `source:` names only.
5. `saveDraft` returns `Promise<boolean>` (the file holds the text), so the close paths know whether to ask. `debug.svelte.ts` and `untitled-save.ts` follow the type.
6. `OpenFiles` is one type; `socket.ts` takes `Pick<OpenFiles, 'subscribed' | 'unsubscribed' | 'remove'>`, so no second exported type exists for `knip` to list. `PER_SOCKET`, `PER_SERVER` and the autosave `Timers` type are not exported; the tests state 200 and 1,000 and take the timers' type from `createAutosave`.
7. The config parse cache is stamped by every file under `config/`, `local.yml` included (it is stat'ed, never opened by the cache). A write of `local.yml` therefore parses again; that costs one parse per write.
8. I added a row to `tests/routes/replace/lsp-edit.test.ts` for G58's `lsp-edit.ts` Code line, outside the path list, because the NUL file edit was written on the unchanged tree (probe `c42`) and no test held the refusal. I added a test to `tests/server/root/hooks-server.test.ts` (G11's test file) for the config parse cache, because a stale parse serves a wrong configuration to every route.

## 8. User-visible changes, before and after, for the look on TEST

| Where | Before | After |
|---|---|---|
| Source tab, file changed by another program | the tab kept its old text and saved over the new text | a clean tab takes the new text within a second; a dirty tab keeps its text and its unsaved mark and shows `The file changed on disk after this tab read it; your changes are kept, and Save is refused until you compare, overwrite or revert.` |
| Cmd+S on a changed file | overwrote the file | refused; the line reads `Failed to save 'a.md': The content of the file is newer. Please compare your version with the file contents or overwrite the content of the file with your changes.` with Compare, Overwrite and Revert |
| Compare | not there | a diff tab after the source tab, `a.md (in file) <-> a.md (in oculus): Resolve save conflict`, the right side editable, no Stage, Unstage or Revert Block |
| Revert File | took the text the tab last read | reads the file from disk |
| Deleted file | the strip drew a tab struck through, with `Deleted` in its tooltip, only when the Files tree knew the file was gone (`client.fs.gone`) | also when the tab's own disk fact says gone (`client.ui.fileGone`, `src/lib/shell/panes/PaneView.svelte:193`); a clean or dirty tab keeps its text and the line reads `The file was deleted on disk; Save writes it again.` |
| Open a file | `Waiting for the first snapshot` | an empty pane until the draft loads |
| Settings, Source editor | no save keys | `editor.autosave` (`off`, `after_delay`, `on_focus_change`; default `off`), `editor.autosave_delay_ms` (default 1000), `editor.trim_trailing_whitespace` and `editor.final_newline` (default false), and the two fields in a language record or a repository `.oculus/settings.yml` |
| Closing a dirty tab, Pages view, Open Editors, rail | asked | under `on_focus_change`, or `after_delay` of at most 1000 ms, saves first and closes without the question; a refused save keeps the tab and asks |
| A file with a NUL byte or invalid UTF-8 past the first 8,192 bytes | opened and could be saved over | opens read-only under `This file is not UTF-8 text throughout; it is shown read-only and nothing is saved over it.`; a save is refused `binary` (the `source.binary` sentence now says "not UTF-8 text throughout") |
| BOM file | the save dropped the BOM | the save keeps it |
| Save of a path that is now a folder | `the file is not there` | `Failed to save 'a.md': A folder is where this file was, so nothing was written.` |

Look on TEST (not run here): case 43 (press to text, with the number); 1 to 6, 8, 10, 11, 18, 22, 23, 26, 33, 34, 37, 39, 49, 50, 52, 53, 58 on screen.

## 9. Anything wrong or impossible in the brief

1. The brief says the G1 and G9 tests run and pass unchanged in what they assert. The two assertions that compare the whole answer with `{ ok: true }` cannot pass beside the brief's own rule that the answer carries `hash`; each gained the `hash` (section 5).
2. `checks.sh` cannot run from the worktree root (no `package.json` there); it runs from `tools/oculus`.
3. `tests/checks/config/integrity.test.ts` fails in this worktree because `deck/` is not checked out; it is not D28's.
4. A plain `npx vitest run` times out two files of `tests/checks` at 5000 ms; `npm run test:checks` is the run that carries their timeout.
5. The brief's H2 names two requests; a press makes three (the kind read as well).
6. The path list omits files the work reaches: the 22 paths marked OUTSIDE in section 6. Each is named with its reason; none is a separate concern.
7. The brief's folder counts hold: `src/lib/state/sessions` 10, `views/sources/source` 9, `views/sources/source/save` 9, `src/lib/server/files/fs` 10, `tests/server/files` 10 (`ls | wc -l`).

## 10. Doc text

For `guarded.md`. The "current line" is the line as the file holds it now; the replacement adds the paths and titles of this step. G2's Code line already names `open-files.ts`.

**G2 Code**

Current line:

```
  Code: `src/routes/api/` fs, ops, open, source, search, history, project-files, file/[root]; the `lsp:` channel: `src/lib/server/machine/lsp/uris.ts`, `src/lib/server/machine/lsp/library/read.ts` (the relay's read), `src/lib/server/machine/lsp/library/tokens.ts` and `src/lib/server/machine/lsp/library/rules.ts` (what may be named); the deck route `(docs)/deck` and the write route's `deck-slides` and `deck-edit` (`src/lib/server/edit/writes/config/deck/`); the page's edit a language server asks for: `src/lib/server/files/fs/lsp-edit.ts`, `src/lib/state/system/machine/lsp/edits.ts`; a `source:` channel, which is never polled for a path outside the roots: `src/lib/server/files/fs/open-files.ts`.
```

Replacement: no change.

**G2 Test**

Current line:

```
  Test: fs: `tests/server/files/fs.test.ts`, 'refuses a path that leaves the root, a root nothing names, and a file'; ops: `tests/server/files/ops.test.ts`, 'refuses a path that climbs out, a root not served and an empty root key (case 5)'; search: `tests/server/files/search.test.ts`, 'refuses a root outside the served list before any process starts'.; fs route: `tests/server/files/fs.test.ts`, 'refuses a path that leaves the root, a root nothing names, and a file'; ops replace: `tests/server/files/ops.test.ts`, 'refuses a path that climbs out, a root not served and an empty root key (case 5)'; open: `tests/routes/files/open.test.ts`, 'refuses a directory outside every configured root'; source: `tests/routes/files/source.test.ts`, 'refuses a path outside the named root'; search plan: `tests/server/files/search.test.ts`, 'refuses a root outside the served list before any process starts'; history: `tests/routes/files/history.test.ts`, 'refuses a path outside the root and a request without its two parameters'; project-files: `tests/routes/files/project-files.test.ts`, 'answers 404 for an id the hub does not hold'; file/[root]: `tests/routes/files/file.test.ts`, 'has nothing for %s'; lsp: `tests/server/machine/lsp/uris.test.ts`, describe 'a document address', the rows 'is refused for <page address>'; deck read: `tests/routes/docs/deck.test.ts`, 'refuses a root nothing serves, a path that climbs out of the root, a link and an absolute path'; deck read over drafts: `tests/routes/docs/deck.test.ts`, 'refuses a draft read without the token and one over a root nothing serves or a path that climbs out'; deck-slides: `tests/routes/edit/deck-slides.test.ts`, 'refuses what the file or the roots do not allow, and writes nothing'; deck-edit: `tests/server/edit/deck-acts.test.ts`, 'refuses a path outside the roots in every act, and writes nothing'.; library: `tests/server/machine/lsp/library.test.ts`, describe 'a library file' (one table, one row per refusal code of the read, per path rule and per message refusal), and `tests/server/machine/lsp/uris.test.ts`, its four library rows; language server edits: `tests/server/machine/lsp/uris.test.ts`, 'drops a workspace edit whose documentChanges name a file the mapper has no address for, and turns the entries of one it can'; `tests/routes/replace/lsp-edit.test.ts`, 'refuses a path that climbs out, a root not served, and a path under a dot or node_modules folder, and writes nothing (case 7)'; `tests/state/system/lsp/edits.test.ts`, 'refuses a library file, a file under node_modules or a dot folder, and a path outside', 'refuses an entry that creates, renames or deletes a file' and 'refuses an edit that names a file open in a tab of another page, whether or not a tab of this page holds it'.
```

Replacement:

```
  Test: fs: `tests/server/files/fs.test.ts`, 'refuses a path that leaves the root, a root nothing names, and a file'; ops: `tests/server/files/ops.test.ts`, 'refuses a path that climbs out, a root not served and an empty root key (case 5)'; search: `tests/server/files/search.test.ts`, 'refuses a root outside the served list before any process starts'.; fs route: `tests/server/files/fs.test.ts`, 'refuses a path that leaves the root, a root nothing names, and a file'; ops replace: `tests/server/files/ops.test.ts`, 'refuses a path that climbs out, a root not served and an empty root key (case 5)'; open: `tests/routes/files/open.test.ts`, 'refuses a directory outside every configured root'; source: `tests/routes/files/source.test.ts`, 'refuses a path outside the named root' (its body with `create: true` included); source channel: `tests/server/files/open-files.test.ts`, 'never polls or publishes a name out of the roots, a root nothing names or an empty path', 'publishes null for a file replaced by a link out of every root and reads nothing of its target', 'publishes null at the tick its root stops being served, and follows the file when it is served again'; search plan: `tests/server/files/search.test.ts`, 'refuses a root outside the served list before any process starts'; history: `tests/routes/files/history.test.ts`, 'refuses a path outside the root and a request without its two parameters'; project-files: `tests/routes/files/project-files.test.ts`, 'answers 404 for an id the hub does not hold'; file/[root]: `tests/routes/files/file.test.ts`, 'has nothing for %s'; lsp: `tests/server/machine/lsp/uris.test.ts`, describe 'a document address', the rows 'is refused for <page address>'; deck read: `tests/routes/docs/deck.test.ts`, 'refuses a root nothing serves, a path that climbs out of the root, a link and an absolute path'; deck read over drafts: `tests/routes/docs/deck.test.ts`, 'refuses a draft read without the token and one over a root nothing serves or a path that climbs out'; deck-slides: `tests/routes/edit/deck-slides.test.ts`, 'refuses what the file or the roots do not allow, and writes nothing'; deck-edit: `tests/server/edit/deck-acts.test.ts`, 'refuses a path outside the roots in every act, and writes nothing'.; library: `tests/server/machine/lsp/library.test.ts`, describe 'a library file' (one table, one row per refusal code of the read, per path rule and per message refusal), and `tests/server/machine/lsp/uris.test.ts`, its four library rows; language server edits: `tests/server/machine/lsp/uris.test.ts`, 'drops a workspace edit whose documentChanges name a file the mapper has no address for, and turns the entries of one it can'; `tests/routes/replace/lsp-edit.test.ts`, 'refuses a path that climbs out, a root not served, and a path under a dot or node_modules folder, and writes nothing (case 7)'; `tests/state/system/lsp/edits.test.ts`, 'refuses a library file, a file under node_modules or a dot folder, and a path outside', 'refuses an entry that creates, renames or deletes a file' and 'refuses an edit that names a file open in a tab of another page, whether or not a tab of this page holds it'.
```

**G8 Code**

Current line:

```
  Code: `src/lib/server/edit/writes.ts` and `writes/`, `src/lib/server/edit/writes/config/config-value.ts`, `src/lib/server/edit/writes/config/deck/` (`deck.ts` for `deck-slides`, `deck-acts.ts` and `deck-files.ts` for `deck-edit`); lsp-edit: `src/lib/server/files/fs/lsp-edit.ts` and the page's half, `src/lib/state/system/machine/lsp/edits.ts`; a file save refused when the file's bytes moved since the tab read them: `src/lib/server/files/source.ts`.
```

Replacement:

```
  Code: `src/lib/server/edit/writes.ts` and `writes/`, `src/lib/server/edit/writes/config/config-value.ts`, `src/lib/server/edit/writes/config/deck/` (`deck.ts` for `deck-slides`, `deck-acts.ts` and `deck-files.ts` for `deck-edit`); lsp-edit: `src/lib/server/files/fs/lsp-edit.ts` and the page's half, `src/lib/state/system/machine/lsp/edits.ts`; a file save refused when the file's bytes moved since the tab read them: `src/lib/server/files/source.ts` and `src/lib/server/core/file-bytes.ts` (the hash both sides compare by), and the page's half, `src/lib/state/sessions/source/source.svelte.ts` and `src/lib/state/sessions/source/disk.svelte.ts` (the base every save sends).
```

**G8 Test**

Current line:

```
  Test: `tests/server/edit/writes.test.ts`, 'writes the changed field and nothing else', 'ticks and reopens a line of a manifest', 'sets a status of the vocabulary and refuses one outside it', 'appends a new entry rendered from the file schema', 'scaffolds an idea folder with a manifest and a README'; `tests/server/edit/writes-collection.test.ts`, 'sets a field of the entry the id names', 'writes the entries in the order the identity values name', 'takes one entry out of its file, by the id the reader gave it'; `tests/server/edit/feeds.test.ts`, 'adds a dated LinkedIn idea with a safe slug and numbered collision suffix', 'promotes an idea past 01-A and moves its same-basename sidecar', 'adds a lead in schema order with date and status defaults', 'uses each feed identity and allows only its field', 'deletes leads and refuses deletion from the other feeds'; `tests/server/sessions/overrides.test.ts`, 'keeps the keys it was not given, and the entries of other sessions'; `tests/server/edit/deck-edit.test.ts`, 'replaces a list in place and keeps every comment around it'; deck-slides: `tests/routes/edit/deck-slides.test.ts`, 'moves a name across two lists and an entry of the order, each in one write that keeps every other line', 'refuses what the file or the roots do not allow, and writes nothing'; deck-edit: `tests/server/edit/deck-acts.test.ts`, 'changes the files each act names and no other byte, and refuses a request over a file that is not what the page read', 'copies a dropped image beside the slide and links it, under a free name, and refuses what is no image or no name', 'makes a deck in an existing folder with the title as the text of the file and refuses an empty title and a folder that holds a deck', 'makes a deck beside an outline file and leaves the file as it was'; `tests/server/edit/config-key.test.ts`, 'replaces the value and keeps every other byte, the comment on its line included'; `tests/server/edit/config-value.test.ts`, 'adds one item, removes one and swaps two, and keeps every other line', 'refuses a base the file no longer holds, with the sentence that it changed since it was read'.; through the write route: `tests/server/edit/writes.test.ts`, 'writes the changed field and nothing else', `tests/server/edit/deck-edit.test.ts`, 'replaces a list in place and keeps every comment around it', `tests/server/sessions/overrides.test.ts`, 'keeps the keys it was not given, and the entries of other sessions'; rail: `tests/routes/edit/rail.test.ts`, 'writes the list in its order and keeps every other line of the file'; roots: `tests/routes/edit/roots.test.ts`, 'appends the folder as an entry under a key made from its name, keeping every other line'; audit mute: `tests/routes/edit/audit-mute.test.ts`, 'parks one signature and keeps every other byte of the file'; config key: `tests/server/edit/config-key.test.ts`, 'replaces the value and keeps every other byte, the comment on its line included'; config value: `tests/server/edit/config-value.test.ts`, 'adds one item, removes one and swaps two, and keeps every other line', `tests/server/edit/config-value.test.ts`, 'refuses a base the file no longer holds, with the sentence that it changed since it was read'; `tests/server/edit/feeds.test.ts`, 'adds a Lit Watch entry in the order given and refuses one whose title or address is in the file'; an app's store: `tests/server/edit/app-store.test.ts`, 'writes the store of an app as the app-store kind'; lsp-edit: `tests/routes/replace/lsp-edit.test.ts`, 'refuses the whole edit when the second file is not the text the page read, and writes nothing to either (case 8)', 'writes the edits of two files, keeps a byte order mark and the line ends, and counts UTF-16 units'; the page's half: `tests/state/system/lsp/edits.test.ts`, 'does not overwrite a tab typed into while the edit waited, and writes nothing before it notices'.
```

Replacement:

```
  Test: `tests/server/edit/writes.test.ts`, 'writes the changed field and nothing else', 'ticks and reopens a line of a manifest', 'sets a status of the vocabulary and refuses one outside it', 'appends a new entry rendered from the file schema', 'scaffolds an idea folder with a manifest and a README'; `tests/server/edit/writes-collection.test.ts`, 'sets a field of the entry the id names', 'writes the entries in the order the identity values name', 'takes one entry out of its file, by the id the reader gave it'; `tests/server/edit/feeds.test.ts`, 'adds a dated LinkedIn idea with a safe slug and numbered collision suffix', 'promotes an idea past 01-A and moves its same-basename sidecar', 'adds a lead in schema order with date and status defaults', 'uses each feed identity and allows only its field', 'deletes leads and refuses deletion from the other feeds'; `tests/server/sessions/overrides.test.ts`, 'keeps the keys it was not given, and the entries of other sessions'; `tests/server/edit/deck-edit.test.ts`, 'replaces a list in place and keeps every comment around it'; deck-slides: `tests/routes/edit/deck-slides.test.ts`, 'moves a name across two lists and an entry of the order, each in one write that keeps every other line', 'refuses what the file or the roots do not allow, and writes nothing'; deck-edit: `tests/server/edit/deck-acts.test.ts`, 'changes the files each act names and no other byte, and refuses a request over a file that is not what the page read', 'copies a dropped image beside the slide and links it, under a free name, and refuses what is no image or no name', 'makes a deck in an existing folder with the title as the text of the file and refuses an empty title and a folder that holds a deck', 'makes a deck beside an outline file and leaves the file as it was'; `tests/server/edit/config-key.test.ts`, 'replaces the value and keeps every other byte, the comment on its line included'; `tests/server/edit/config-value.test.ts`, 'adds one item, removes one and swaps two, and keeps every other line', 'refuses a base the file no longer holds, with the sentence that it changed since it was read'.; through the write route: `tests/server/edit/writes.test.ts`, 'writes the changed field and nothing else', `tests/server/edit/deck-edit.test.ts`, 'replaces a list in place and keeps every comment around it', `tests/server/sessions/overrides.test.ts`, 'keeps the keys it was not given, and the entries of other sessions'; rail: `tests/routes/edit/rail.test.ts`, 'writes the list in its order and keeps every other line of the file'; roots: `tests/routes/edit/roots.test.ts`, 'appends the folder as an entry under a key made from its name, keeping every other line'; audit mute: `tests/routes/edit/audit-mute.test.ts`, 'parks one signature and keeps every other byte of the file'; config key: `tests/server/edit/config-key.test.ts`, 'replaces the value and keeps every other byte, the comment on its line included'; config value: `tests/server/edit/config-value.test.ts`, 'adds one item, removes one and swaps two, and keeps every other line', `tests/server/edit/config-value.test.ts`, 'refuses a base the file no longer holds, with the sentence that it changed since it was read'; `tests/server/edit/feeds.test.ts`, 'adds a Lit Watch entry in the order given and refuses one whose title or address is in the file'; an app's store: `tests/server/edit/app-store.test.ts`, 'writes the store of an app as the app-store kind'; lsp-edit: `tests/routes/replace/lsp-edit.test.ts`, 'refuses the whole edit when the second file is not the text the page read, and writes nothing to either (case 8)', 'writes the edits of two files, keeps a byte order mark and the line ends, and counts UTF-16 units'; the page's half: `tests/state/system/lsp/edits.test.ts`, 'does not overwrite a tab typed into while the edit waited, and writes nothing before it notices'; a file save: `tests/routes/files/source.test.ts`, 'refuses a save whose base differs from the hash of the file and writes nothing', 'writes a save whose base the file holds and answers the hash of the bytes written', 'refuses a save when a second stat right before the write differs from the first'; the page's half of a file save: `tests/state/sessions/source.test.ts`, 'refuses the save of a changed file on the base the tab read, and says the conflict', 'serializes the saves of one tab so each sends the hash the save ahead of it answered'.
```

**G28 Code**

Current line:

```
  Code: `src/lib/state/forms/`, `src/lib/state/sessions/source.svelte.ts`, `src/lib/state/sources/repositories/review-comment.ts`, `src/lib/shell/panes/strip/close-question.svelte.ts`, `src/lib/state/client/context.ts`, `src/lib/state/sessions/terminal/terminal-tabs.ts`, `src/lib/server/machine/pty/channel.ts`.
```

Replacement:

```
  Code: `src/lib/state/forms/`, `src/lib/state/sessions/source/source.svelte.ts` (the tab's text and its unsaved mark), `src/lib/state/sessions/source/draft.ts`, `src/lib/state/sessions/source/disk.svelte.ts` (a change of the file on disk), `src/lib/state/sessions/source/autosave.svelte.ts` (the save a close makes first), `src/lib/state/workbench/ui.svelte.ts` (`registerSaveBeforeClose`, `saveBeforeClose`), `src/lib/state/workbench/navigation/pages.ts` (`closeAsk`), `src/lib/views/system/workbench/Pages.svelte`, `src/lib/views/system/workbench/PagesReset.svelte`, `src/lib/views/sources/files/control/editor-closing.ts`, `src/lib/views/sources/files/sections/OpenEditors.svelte`, `src/lib/shell/rail/ActivityRail.svelte`, `src/lib/state/sources/repositories/review-comment.ts`, `src/lib/shell/panes/strip/close-question.svelte.ts`, `src/lib/state/client/context.ts`, `src/lib/state/sessions/terminal/terminal-tabs.ts`, `src/lib/server/machine/pty/channel.ts`.
```

**G28 Test**

Current line:

```
  Test: close question, unsaved text: `tests/shell/panes/strip/tab-menu.test.ts`, 'asks before Close Others closes a tab holding unsaved text, naming it, and No closes nothing'; close question, a running terminal: same file, 'asks about the terminal running a program among the tabs an item closes'.; form: `tests/state/forms/form-drafts.test.ts`, 'keeps a typed value and reads it back by instance and form', 'reads the drafts back out of the storage the ui store saved them to', 'registers the client own drafts with the close guard'; manifest editor: `tests/state/forms/manifest-draft.test.ts`, 'keeps an edit per instance and reports it unsaved while it differs', 'reads the edits back out of the storage the ui store saved them to', 'registers the client's own manifest draft with the close guard'; file editor: `tests/state/sessions/source.test.ts`, 'keeps the typed text when it is opened again', 'is unsaved once the reader types, which is what closing it asks about'; review comment box: `tests/state/sources/repositories/diff/comment-draft.client.test.ts`, 'closes keeping the text, and drops the text on Cancel'; close question for a tab, a pane, a page and a running terminal: `tests/shell/panes/strip/tab-menu.test.ts`, 'asks before Close Others closes a tab holding unsaved text, naming it, and No closes nothing', 'asks one question over a pane with unsaved text and a busy terminal, the text first', 'lists every instance of every pane of a page, in the tree's own order', `tests/shell/panes/strip/tab-menu.test.ts`, 'asks about the terminal running a program among the tabs an item closes'; terminals: `tests/state/client/terminal/terminal-close.test.ts`, 'names a terminal running a program, and not an idle shell', 'ends no terminal when it moves to another pane, to another page, or is split', 'ends no terminal when the layout is loaded again'.; page detach: `tests/server/machine/pty/channel.test.ts`, 'stops the delivery and leaves the tmux session alone'.
```

Replacement:

```
  Test: close question, unsaved text: `tests/shell/panes/strip/tab-menu.test.ts`, 'asks before Close Others closes a tab holding unsaved text, naming it, and No closes nothing'; close question, a running terminal: same file, 'asks about the terminal running a program among the tabs an item closes'.; form: `tests/state/forms/form-drafts.test.ts`, 'keeps a typed value and reads it back by instance and form', 'reads the drafts back out of the storage the ui store saved them to', 'registers the client own drafts with the close guard'; manifest editor: `tests/state/forms/manifest-draft.test.ts`, 'keeps an edit per instance and reports it unsaved while it differs', 'reads the edits back out of the storage the ui store saved them to', 'registers the client's own manifest draft with the close guard'; file editor: `tests/state/sessions/source.test.ts`, 'keeps the typed text when it is opened again', 'is unsaved once the reader types, which is what closing it asks about', 'takes the new text into a clean tab, with its edits, and keeps no unsaved mark', 'keeps the typed text of a dirty tab and marks it changed', 'follows one channel for two tabs over one file: the clean one reads, the dirty one is marked', 'marks a draft restored with unsaved text over %s'; review comment box: `tests/state/sources/repositories/diff/comment-draft.client.test.ts`, 'closes keeping the text, and drops the text on Cancel'; close under autosave: `tests/state/sessions/autosave.client.test.ts`, 'under %s with a delay of %i saves the tab first: %s', 'leaves a tab whose save is refused unsaved, for the question to ask about'; `tests/state/workbench/navigation/pages.test.ts`, 'asks nothing for a tab the save took, and answers no tab left unsaved', 'asks the unsaved-text question for a tab whose save was refused', 'asks how many go when several tabs close, naming only the tabs left unsaved'; close question for a tab, a pane, a page and a running terminal: `tests/shell/panes/strip/tab-menu.test.ts`, 'asks before Close Others closes a tab holding unsaved text, naming it, and No closes nothing', 'asks one question over a pane with unsaved text and a busy terminal, the text first', 'lists every instance of every pane of a page, in the tree's own order', `tests/shell/panes/strip/tab-menu.test.ts`, 'asks about the terminal running a program among the tabs an item closes'; terminals: `tests/state/client/terminal/terminal-close.test.ts`, 'names a terminal running a program, and not an idle shell', 'ends no terminal when it moves to another pane, to another page, or is split', 'ends no terminal when the layout is loaded again'.; page detach: `tests/server/machine/pty/channel.test.ts`, 'stops the delivery and leaves the tmux session alone'.
```

**G58 Code**

Current line:

```
  Code: `src/lib/server/files/source.ts`, `src/lib/server/files/fs/lsp-edit.ts`, the whole-file rule in `src/lib/data/helpers/files/text-kind.ts` and the server module under `src/lib/server/core/` that keeps the BOM.
```

Replacement:

```
  Code: `src/lib/server/files/source.ts`, `src/lib/server/files/fs/lsp-edit.ts`, the whole-file rule in `src/lib/data/helpers/files/text-kind.ts` and `src/lib/server/core/file-bytes.ts`, which keeps the BOM and hashes the bytes.
```

**G58 Test**

Current line:

```
  Test: written by D28, its file and titles named in D28's landing report.
```

Replacement:

```
  Test: `tests/routes/files/source.test.ts`, 'refuses a file holding %s, and leaves its bytes', 'keeps the byte order mark of a file that starts with one', 'saves a file whose multi-byte character straddles byte 8,192, and an empty one'; a language server's edit: `tests/routes/replace/lsp-edit.test.ts`, 'refuses a file holding %s, and leaves its bytes' (describe 'the bytes an lsp-edit replaces'), 'writes the edits of two files, keeps a byte order mark and the line ends, and counts UTF-16 units'.
```

**G59 Code**

Current line:

```
  Code: `trimText` and `endText` in `src/lib/data/helpers/files/save-text.ts` (D28).
```

Replacement:

```
  Code: `trimText` and `endText` in `src/lib/data/helpers/files/save-text.ts`; the order of trim, format and final newline in `saveSourceDraft` (`src/lib/state/sessions/source/source.svelte.ts`); the rules each tab resolves in `saveRulesOf` (`src/lib/state/workbench/navigation/editor-text.ts`).
```

**G59 Test**

Current line:

```
  Test: written by D28, one table over `trimText` and `endText`, its file and title named in D28's landing report.
```

Replacement:

```
  Test: `tests/data/helpers/files/save-text.test.ts`, describe 'trimText': 'takes %s', 'keeps the whitespace before a kept place on its line and trims every other line', 'takes the whitespace at the end of the line when the kept place is before it'; describe 'endText': '%s' (nine rows), 'keeps the line a kept place is on, and the lines before it', 'never changes a line ending that is there'.
```

**G60 Code**

Current line:

```
  Code: the autosave store D28 adds under `src/lib/state/sessions/source/`.
```

Replacement:

```
  Code: `src/lib/state/sessions/source/autosave.svelte.ts`, and the draft fields it reads, `src/lib/state/sessions/source/disk.svelte.ts` and `src/lib/state/sessions/source/draft.ts`.
```

**G60 Test**

Current line:

```
  Test: written by D28, its file and titles named in D28's landing report.
```

Replacement:

```
  Test: `tests/state/sessions/autosave.client.test.ts`: 'saves nothing under off, however long the reader waits', 'saves once, a delay after the last edit, and not before', 'starts the wait again at each edit, so typing every 500 ms for 3 s saves once', 'never formats the document, whatever the language says', 'saves each edit at a delay of 0, every save sending the hash the save ahead of it answered', 'saves a tab when its editor loses focus, formatting the document when the language says so', 'saves every tab holding unsaved text when the page loses focus', 'saves nothing for a blur under off', 'from off to after_delay saves the tabs that hold unsaved text at once', "writes nothing for a tab marked changed, and the reader's own Save shows the conflict", 'writes nothing for a tab that is %s', 'does not try a refused save again until the reader types', 'under %s with a delay of %i saves the tab first: %s', 'leaves a tab whose save is refused unsaved, for the question to ask about'.
```

**G11 Code (the added test sits under this entry; no change to the Code line)**

Current line:

```
  Code: `src/hooks.server.ts`.
```

Replacement: no change.

**G11 Test**

Current line:

```
  Test: `tests/server/root/hooks-server.test.ts`, 'reads it once for a page, whose title and load function share the read'.
```

Replacement:

```
  Test: `tests/server/root/hooks-server.test.ts`, 'reads it once for a page, whose title and load function share the read', 'parses a config folder once for requests over it, and again once a file of it is written'.
```

