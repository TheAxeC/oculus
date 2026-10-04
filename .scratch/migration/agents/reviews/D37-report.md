# D37 builder report

## NOT done, not verified

Everything in the brief is built. What is not verified, in those words:

- The look cases (11, 12, 13, 14, 15, 16, 17, 19, 20, 21, 22, 24, 25, 26, 27, 28, 29, 30, 32) need a browser, and this builder runs none. They are verified by `npm run check`, by the tests listed below where a guarded entry covers them, and by reading the code; their look is the orchestrator's.
- Case 32 (the Search view in a float): the landing excludes the asker's pane in the page tree (`landing.ts`, `opening.ts`), and an asker in a float names no pane of that tree, so the preview lands as for any asker outside the tree. Not verified in a float.
- The wiring of `replaceHits` in `search.svelte.ts` (re-read hits put in place, focus, preview moved on) has no test: no guarded entry covers it. Its pure parts (`applyRereads`, `focusAfter`) were run in a probe (`probe/page.mts` in the scratchpad; output below) and the server side by `ops-replace.test.ts`; the store itself ran under `npm run check` only.
- `test:quick` took 59.3 s on its first run after the code was complete, with other agents running on the machine; the run quoted below, after the last change, took 40.7 s.

## Open items of the state file (verbatim)

```
- None.
```

(`tools/oculus/.scratch/migration/orchestrator-state.md`, section "Open items", line 147.)

## The cases' first run, on the unchanged tree

Method: the cases the G35 tests cover (15, 18, 33, 35) by the red run of those tests on the base source; cases 1, 8 and 10 by a probe over the base server modules with real ripgrep, run before any change (its script is `probe/first.mts`); every other case by reading the base code. No case was found wrong under the brief's rules, so the builder did not stop.

| Case | Result on the unchanged tree |
|---|---|
| 1 | Replace on the first hit writes `zz x qzlook`. The page then keeps the second hit at `at: 9` (`search.svelte.ts:374`, `without(...)` removes only the written hits), and a Replace on it is refused. Probe: second replace at the old place answers `{"ok":false,"error":"changed","done":[],"failed":"hub/a.txt"}`. |
| 2 | The preview request after the first Replace carries the stale `at: 9`; the server leaves a named match that is no longer there unreplaced, so the preview draws no replacement for it. By reading `replace.ts` `previewReplace`. |
| 3 | Search `a`, replace `aa`, file `a b`: the written file's hits are dropped from the list; the new matches are not listed. By reading `without`. |
| 4 | The file leaves the list and the focus moves with `rowAfter`. Holds. |
| 5 | A dismissed hit is in no list, so it cannot return; the other hits keep stale places. Holds apart from the stale places of case 1. |
| 6 | Every written file leaves the list; none is read again. |
| 7 | A refused answer drops the `done` files' hits, none is read again; the refused file keeps its hits. |
| 8 | Probe over `runSearch` with one root timed out and one answering: `truncated: true`. The count line shows the cap note. Wrong cause: `search.ts:390-402` sets `truncated` on a timeout. |
| 9 | The cap note and the capped sentence follow `truncated`. Holds. |
| 10 | Probe: the failed root is named in `failed` with ripgrep's text (`rg: boom`); the page says `search.failed_roots` ("No answer from {0}.") with the root names only, no reason, no timeout kind. |
| 11 | Reading `opening.ts` `openBeside` and `landing.ts`: the landing has no asker, so the preview can land in the Search tab's own pane. |
| 12 | Lands in the documents pane. Holds. |
| 13 | The second preview lands in the pane of the first. Holds. |
| 14 | Lands via `openBeside` with no asker. Holds. |
| 15 | Red run (`builds one main file with latexmk in the manuscript folder`: `expected undefined to deeply equal [ 'set-option', '-t', ... ]`) and reading base `sessions.ts`: the build is a plain shell session with no kept pane (no `remain-on-exit`), the name option is set by a later tmux call after `new-session`, so a latexmk that exits at once can end the session first. |
| 16 | The terminal shows output while it runs; when latexmk ends the session is gone and the output with it. The mark is `listed` (id present), so it ends when the id leaves the list. |
| 17 | The mark ends when the terminal leaves the list; same code as 16. |
| 18 | Red run (`a resize of a terminal tmux no longer has`: `expected { Object (error) } to deeply equal { error: 'terminal-ended' }`): the refusal carries tmux's raw text, and by reading base `terminals.svelte.ts` a refused resize is said nowhere. |
| 19 | `finish` calls `queries.fetch`, which returns what is held when it is fresh, so the folder read after the build can come from the held state (`latex.svelte.ts:346-433`). |
| 20 | The folder state is held and not marked on opening; the view shows the held mains. |
| 21 | The `files` message does not mark a LaTeX state. |
| 22 | No request, as no message marks anything. Holds. |
| 23 | The button says "1 problems" (`problem_counts`, `latex.yml:29`, `Main.svelte:152`). |
| 24 | `menuOf` reads only the project commands; a folder never expanded holds no listing, so the menu has no Open LaTeX. |
| 25 | No Open LaTeX. Holds. |
| 26 | Open LaTeX on a `.tex` file. Holds. |
| 27 | `latex-widget.ts:117` sets `max-width:100%` on an image added before it loads, so the box is sized around an empty image. |
| 28 | Same cause as 27; the cap `max-height:300px` holds. |
| 29 | The box is added before the load; a path that does not load leaves an empty box. |
| 30 | The box is added at once; no wait exists to cancel. |
| 31 | By reading the base `startLatex` (`routes.ts`): it starts a plain shell terminal with no `task` mark, so the terminal is no task terminal and Run Again, which the page offers only on a task terminal, is not offered on it. |
| 32 | Not verified (see above). Base code: the landing has no asker at all. |
| 33 | Each build of a main starts a new terminal: the new test `builds again in the terminal it kept` fails on the base source with `expected '9b1fb6-shell' to be '2ec833-shell'`. |
| 34 | By reading the base `commands.svelte.ts`: diagnostics are read from every terminal with a task mark; the base build has none, so the error shows once, at the log's marker. After the change the build is a task terminal, and `ranCommand` keeps it out of the diagnostics. |
| 35 | Red run (`a fork of an id that is no session`): the route answers `{ error: 'id is not a session id' }`, a text of the server's own, shown as it is. |

The red run of the G35 tests on the unchanged tree (`g35-red.txt`, repeated below on a scratch copy of the base source with the changed tests) failed 11 tests.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1 (S1) replace reads written files' hits | DONE | `ops-replace.test.ts` asserts `rereads` with `was`; probe `first.mts` case 1 (below); `probe/page.mts` for `applyRereads`/`focusAfter` |
| 2 (S2) only the cap truncates, root reasons | DONE | probe `first.mts` case 8/10 (below) |
| 3 (S3) preview beside the Search view | DONE (look not taken) | `npm run check`; `landing.ts`, `opening.ts` |
| 4 (L1) build as task terminal, every refusal a word | DONE | G35 tests |
| 5 (L2) read after a build | DONE | `finish` uses `queries.refetch(..., 'again')` |
| 6 (L3) read on opening and on a change | DONE | `Rows.svelte`, `latex.svelte.ts` `reread` and the `files` handler |
| 7 (L5) singular | DONE | `latex.yml` `problem`, `error_one`, `warning_one` |
| 8 (L6) Open LaTeX on a never-expanded folder | DONE | `picks.svelte.ts` `menuOf` |
| 9 (L7) picture | DONE | `latex-widget.ts` |
| 10 Docs | DONE | `HELP.md`, `DESIGN.md`, head comments (list below) |
| Defect (4) of the LaTeX list, Format Document undo | NOT MINE (the brief names it as another step's) | none |

### Probe output after the change (`probe/first.mts` over the worktree's server modules, real ripgrep)

```
case1 first replace answer {"ok":true,"paths":["hub/a.txt"],"rereads":[{"root":"hub","path":"a.txt","hits":[{"line":1,"column":6,"length":6,"text":"zz x qzlook","at":5,"was":{"line":1,"at":9}}]}]} "zz x qzlook\n"
case1 second replace at the old place {"ok":false,"error":"changed","done":[],"failed":"hub/a.txt","rereads":[]}
case8/10 answer {"truncated":false,"total":1,"failed":[{"root":"claude","why":"timed-out","reason":"the search timed out"},{"root":"gone","why":"failed","reason":"rg: boom"}]}
```

`probe/page.mts` (page-side functions):

```
[{"root":"hub","path":"a.txt","hits":[{"line":1,"at":5,"column":6,"length":6,"text":"qzlook x qzlook"}]}]
focus hit:hub:a.txt:1:5 expected hit:hub:a.txt:1:5
dismissed stays out [] [{"root":"hub","path":"a.txt","line":1,"at":5,"length":6}]
new hit [[3]] []
failed [{"root":"hub","path":"a.txt","hits":[],"rereadFailed":true}] []
```

### Verify list

Runs of the verify list after the last change: 1 (`npm run diagrams` then `npm run test:quick`).

```
ok      ASCII gate (0.6 s)
ok      prettier (1.2 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.5 s)
ok      eslint (30.4 s)
ok      vitest (38.9 s): Duration  33.89s (transform 60.15s, setup 0ms, import 121.07s, tests 13.24s, environment 95ms)
ok      svelte-check (37.9 s): 1791154652147 COMPLETED 355 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 40.7 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
```

Guarded test files, each run alone with `npx vitest run <file>` after the last code change (`scratchpad/guarded-run.txt`); every one printed `Test Files  1 passed (1)`:

- G3 (files and ops routes): `tests/routes/files/file-undo.test.ts` 9 passed, `file.test.ts` 1, `history.test.ts` 3, `open.test.ts` 2, `project-files.test.ts` 1, `source.test.ts` 3, `tests/routes/replace/ops-replace.test.ts` 4, `tests/server/edit/config-key.test.ts` 2, `config-value.test.ts` 3, `tests/server/files/fs.test.ts` 1, `ops-paste.test.ts` 5, `ops.test.ts` 3, `search.test.ts` 1, `tests/server/git/untracked/trash.test.ts` 2.
- G28: `tests/shell/panes/strip/tab-menu.test.ts` 2, `tests/state/client/terminal/terminal-close.test.ts` 3, `tests/state/forms/form-drafts.test.ts` 3, `manifest-draft.test.ts` 3, `tests/state/sessions/source.test.ts` 2, `tests/state/sources/repositories/diff/comment-draft.client.test.ts` 1.
- G35: `tests/routes/sessions/compose.test.ts` 4, `terminal-actions.test.ts` 11, `terminal-edit.test.ts` 1, `terminal.test.ts` 4, `tests/server/machine/commands/run.test.ts` 3, `tests/server/machine/pty/channel.test.ts` 2, `sessions.test.ts` 1, `tmux.test.ts` 1.

ASCII gate over `src tests config` (the brief's command; `bin` does not exist in this tree and `find` reports it): prints nothing. `HELP.md` and `DESIGN.md`: no byte outside printable ASCII.

`sh utils/unused-exports.sh` against `D37-base/unused-exports.txt`: `diff` prints nothing (257 entries on both sides). Exports added during the work and made unexported or unlisted before this run: `wordOf` (now module-private in `refusal.ts`) and `JobSource` (now module-private in `model-sessions.ts`, no longer re-exported from `data/model/index.ts`).

## Files (diff -rq against the base copy; line counts base -> now)

Source:

```
313 -> 326  src/lib/data/file-ops.ts
511 -> 518  src/lib/data/model/index.ts
58 -> 65  src/lib/data/model/model-search.ts
802 -> 834  src/lib/data/model/model-sessions.ts
379 -> 458  src/lib/server/files/fs/replace.ts
493 -> 493  src/lib/server/files/search.ts
104 -> 102  src/lib/server/machine/commands/placeholders.ts
46 -> 51  src/lib/server/machine/commands/resolve.ts
177 -> 169  src/lib/server/machine/commands/run.ts
158 -> 159  src/lib/server/machine/pty/edit.ts
611 -> 628  src/lib/server/machine/pty/routes.ts
762 -> 790  src/lib/server/machine/pty/sessions.ts
new -> 68  src/lib/server/machine/pty/refusal.ts
744 -> 800  src/lib/state/sessions/latex.svelte.ts
719 -> 726  src/lib/state/sessions/terminal/commands.svelte.ts
197 -> 195  src/lib/state/sessions/terminal/pty/pty-io.ts
68 -> 68  src/lib/state/sessions/terminal/terminal-payloads.ts
819 -> 815  src/lib/state/sessions/terminals.svelte.ts
135 -> 143  src/lib/state/shared/answers/answers.ts
new -> 53  src/lib/state/shared/answers/terminal-words.ts
616 -> 636  src/lib/state/sources/explorer/ops.svelte.ts
476 -> 479  src/lib/state/sources/repositories/repositories.svelte.ts
181 -> 290  src/lib/state/sources/search/hits.ts
458 -> 491  src/lib/state/sources/search/search.svelte.ts
251 -> 292  src/lib/state/sources/search/search.ts
67 -> 74  src/lib/state/workbench/layout/open/landing.ts
299 -> 319  src/lib/state/workbench/layout/open/opening.ts
222 -> 235  src/lib/ui/controls/editor/kit/latex/latex-widget.ts
500 -> 499  src/lib/views/sessions/session-detail/SessionDetail.svelte
319 -> 319  src/lib/views/sessions/session-list/SessionList.svelte
189 -> 205  src/lib/views/shared/explorer/tree/control/picks.svelte.ts
496 -> 500  src/lib/views/shared/explorer/tree/menu/row-menu.ts
206 -> 212  src/lib/views/shared/latex/Main.svelte
37 -> 47  src/lib/views/shared/latex/Rows.svelte
322 -> 329  src/lib/views/sources/search/Results.svelte
```

Tests and fixtures: `tests/routes/replace/ops-replace.test.ts` 118 -> 140, `tests/routes/sessions/compose.test.ts` 172 -> 173, `terminal-actions.test.ts` 218 -> 321, `terminal-fixture.ts` 190 -> 210, `terminal.test.ts` 146 -> 151, `tests/server/machine/commands/placeholders.test.ts` 111 -> 106.

Config: `config/text/server.yml` 69 -> 64, `config/text/views/academic/latex.yml` 50 -> 55, `config/text/views/sessions/terminal.yml` 80 -> 95, `config/text/views/sources/search.yml` 90 -> 92.

Docs: `HELP.md` (348 lines) and `DESIGN.md` (435 lines) in the worktree; the base copy does not carry them, so no base count.

Limits: largest source file `terminals.svelte.ts` 815 (limit 880), `model-sessions.ts` 834; largest component `SessionDetail.svelte` 499 (limit 520). Folder item counts: `server/machine/pty` 10 (limit 10), `state/shared/answers` 2.

### Files outside the brief's write list, with the reason

- `src/lib/server/machine/commands/resolve.ts`, `placeholders.ts`, `run.ts`: their refusals were sentences of the server's catalog; item 4's "every refusal a word" reaches them through `fillPlaceholders` and `resolveChain`. `server.yml` lost the five `commands.*` keys they used.
- `src/lib/data/model/model-sessions.ts`, `index.ts`, `src/lib/state/sessions/terminal/terminal-payloads.ts`: the `latex` job source and the `TERMINAL_REFUSALS` words; without `terminal-payloads.ts` accepting `latex` the page would have dropped the row.
- `src/lib/state/sessions/terminal/pty/pty-io.ts`, `src/lib/state/shared/answers/answers.ts` and the new `terminal-words.ts`, `SessionList.svelte`, `SessionDetail.svelte`, `config/text/views/sessions/terminal.yml`: the page says a catalog sentence for each terminal word.
- `src/lib/state/sessions/terminal/commands.svelte.ts`: `ranCommand` keeps a latex job out of command diagnostics (case 34).
- `src/lib/state/system/docs.svelte.ts` is imported (`holds`), not changed.
- `src/lib/state/sources/explorer/ops.svelte.ts`: the replace outcome carries `rereads`.
- `src/lib/data/file-ops.ts`, `model-search.ts`, `search.ts` (state): the shapes of `rereads`, `SearchFailure.why` and `dismissed`.

## Judgment calls

1. A kept LaTeX build that is still running is answered unchanged by the server (nothing restarts); one that has ended is run again with `respawn-pane -k` in that terminal, with the command built now.
2. The page's `building` means a terminal seen listed with `exit === null`; a push that shows an old `exit` is settled by the fresh `readListed` in `confirm`.
3. A write's re-read is capped at `REREAD_MAX = 2000` hits per file; a file with more is reported as a failed re-read, so its row says "Search again to see this file's hits."
4. A validator error of the terminal route (a field of the wrong type) is the word `bad-terminal`; its field text no longer reaches the page. The sentences of the route no longer carry field detail.
5. A failed tmux call is `terminal-ended` when the terminal is no longer listed and `terminal-failed` when it still is.
6. `latex.problem_counts` is `'{0}, {1}'`, built from `error_one`/`errors_many` and `warning_one`/`warnings_many`; the disclosure label is `problem` when the total is 1.
7. A `files` message with no root marks nothing; a gap, or a root list not yet read, marks every held LaTeX state (brief change 10).
8. `Rows.svelte` carries one `eslint-disable-next-line @typescript-eslint/no-unused-expressions` (the read of `folder` is the effect's dependency), as `TreeView.svelte` and `TreeItem.svelte` carry theirs.

## Host- and user-visible changes (before -> after)

- Search, after a Replace: the hits left in a written file keep the old line and place and the next Replace is refused `changed` -> they are read from the file as written; each keeps what the reader dismissed; a failed read shows "Search again to see this file's hits." under the file.
- Search, a root that ran out of time: the cap note shows and the root is named with the others as "No answer from {roots}." -> no cap note; one line per failed root: "{root} ran out of time." or "No answer from {root}: ripgrep could not search it."
- Replace Preview: may land in the Search tab's own pane (by reading base `landing.ts`) -> lands outside it (a new pane to its right when no other pane takes it).
- LaTeX build and clean: a plain shell terminal that vanishes with latexmk -> a task terminal that stays with its output and exit status, rerun in place by the next build of that main; Run Again works on it.
- Terminal route refusals: tmux's or a validator's text -> a catalog sentence; a refused resize is said on the owning tab's bar.
- LaTeX view: the folder state is read again on opening and on a `files` message under its root, and the read after a build reaches the server.
- Problems button: "1 problems" -> "1 problem"; counts "1 error, 1 warning".
- Row menu of a never-expanded folder: no Open LaTeX -> Open LaTeX when the folder holds a `.tex` file.
- Picture hover: an empty box -> the picture within 458 by 300 px; no box when it does not load.

## Still true / rewritten

Rewritten: `HELP.md` (the LaTeX paragraph: terminals stay, `1 problem`, folder read on opening and on change, hover picture; the Search paragraph: hits after a Replace, failed roots lines, preview placement), `DESIGN.md` (Search paragraph: `failed` with `why`, `rereads`, preview landing; the pty bridge paragraph: refusal words, options in the `new-session` invocation; the LaTeX paragraph: task terminal, end of a build, reads on opening and on change); head comments of `search.svelte.ts`, `hits.ts`, `search.ts` (state), `file-ops.ts`, `replace.ts`, `latex.svelte.ts`, `landing.ts`, `opening.ts`, `routes.ts` (pty), `refusal.ts`, `answers.ts`, `commands.svelte.ts`, `latex-widget.ts`, `picks.svelte.ts`; the doc comment of `runSearch` and the comments of `row-menu.ts`; the doc comments of `TerminalJob`, `Terminal.task`, `Terminal.job` and `StartRequest.task`.

Read and left as they were (still true): the head comments of `server/files/search.ts`, `Results.svelte` and `Main.svelte`, and the `HELP.md` paragraph on the replace text rules.

The stale-phrase grep over `src tests HELP.md README.md DESIGN.md` for "left the (terminals) list" and "server's own sentence": the matches that described the old behaviour (`latex.svelte.ts` `Stop waiting once the terminal has ended`, `sessions.ts` task doc comment, `terminals.svelte.ts` refusal doc comment, `model-sessions.ts` task comments) were rewritten; the remaining matches are about tooltips, mail and a view's account list.

## Brief items that were wrong or impossible

- The launch prompt named `npm run diagnostics`; the coordinator corrected it to `npm run diagrams`, which ran.
- Case 34 has no guarded entry, so it has no test; its proof is `ranCommand` in `commands.svelte.ts` and the look.
- `HELP.md` and `DESIGN.md` are absent from the base copy, so their line counts have no base column.
- Nothing else in the brief was found wrong or impossible.

## Tests added or changed

Added (G35, `tests/routes/sessions/terminal-actions.test.ts`):

- `builds again in the terminal it kept, and cleans in another`. Failing line on the unchanged tree: `AssertionError: expected '9b1fb6-shell' to be '2ec833-shell' // Object.is equality`. Scratch copy with the behaviour removed (the base source with the changed tests, `scratchpad/red`): the same failure.
- `POST /api/terminal, a refusal` (7 cases). Failing lines on the unchanged tree:
  - `a body that is no map`: `expected { error: 'the body is not an action' } to deeply equal { error: 'not-an-action' }`
  - `an action that is none`: `expected { Object (error) } to deeply equal { error: 'not-an-action' }`
  - `an input to a session oculus did not start`: `... { error: 'not-ours' }`
  - `a fork of an id that is no session`: `expected { error: 'id is not a session id' } to deeply equal { error: 'not-a-session' }`
  - `a start with a size that is no number`: `... { error: 'bad-terminal' }`
  - `a rename of a terminal the list does not hold`: `... { error: 'terminal-ended' }`
  - `a resize of a terminal tmux no longer has`: `... { error: 'terminal-ended' }`

Changed existing assertions (before -> after):

- `terminal-actions.test.ts` `builds one main file with latexmk in the manuscript folder`: `expect(started[started.length - 1]).toBe(<latexmk line>)` -> `expect(lineOf(started)).toEqual([<latexmk line>])`; the folder expectation is held in a variable; new assertions: `remain-on-exit on`, the `@oculus_task` JSON `{ repo: folder, name, source: 'latex' }` and `@oculus_name` ride in the `new-session` invocation, and no separate `set-option` call. Unchanged tree: `expected undefined to deeply equal [ 'set-option', '-t', ... ]`.
- `terminal-actions.test.ts` (line ~314): `expect(started[started.length - 1]).toBe(expected)` -> `expect(lineOf(started)).toEqual([expected])`, and `not.toContain("'-p'")` on `lineOf(started)[0]`.
- `terminal.test.ts` `starts the terminal in the record cwd, with the tool resume command and the title`: `expect(started.slice(started.indexOf('--') + 1)).toEqual([...])` -> `expect(lineOf(started)).toEqual([...])`; `driver.calls.filter(set-option).map(args => args[3])` equal to `['@oculus_name', '@oculus_resumes']` -> the same names read from `joinedCommands(started)` plus `expect(driver.calls.filter((args) => args[0] === 'set-option')).toEqual([])`. Unchanged tree: `expected [] to deeply equal [ '@oculus_name', '@oculus_resumes' ]`.
- `terminal.test.ts` line ~146: `expect(started[started.length - 1]).toBe("python3 tools/data/redownload.py 'mimic-iv'")` -> `expect(lineOf(started)).toEqual([...])`.
- `compose.test.ts`: `argv: started.slice(started.indexOf('--') + 1)` -> `argv: lineOf(started)`.
- `terminal-fixture.ts`: adds `joinedCommands` and `lineOf`; the tmux stand-in reads `new-session` and `set-option` from each command of a joined invocation, not only from calls of their own.
- `ops-replace.test.ts` `replaces the second of two matches on one line and leaves the first`: `toEqual({ status: 200, body: { ok: true, paths: ['hub/a.txt'] } })` -> the body also holds `rereads` with the written file's one hit (`line: 1, column: 1, length: 3, text: 'foo bar', at: 0, was: { line: 1, at: 0 }`). Unchanged tree: the received body lacks `rereads`; with the `was` assignment removed from `replace.ts` on a scratch copy (`scratchpad/red2`) the test fails with `- "was": { "at": 0, "line": 1 }`.
- `placeholders.test.ts`: the `CATALOG` constant and its fourth argument are removed (the function returns words now); every assertion stays.

No assertion was loosened.

## History-word grep on added comments and test titles

`grep -inE '\b(previously|formerly|used to|no longer|instead of|reverted|legacy|old |fixed|bug|regress|originally|until recently)\b'` over the added lines of the src, tests and config diff: the matches are the ordinary words "before", "again", "was" and "no longer" in sentences about the data (for example "the place it had before the write", "a terminal tmux no longer has"); none says when a line was written, what was tried or what bug came before it.

## Grep quote after renames

`grep -rnE "resumeRefusal|failed_roots|COMMAND_ACTIONS|capture_unlisted|server\.commands\.(no_file|no_selection|nul|source)" src tests config HELP.md DESIGN.md --exclude=local.yml` prints nothing (exit status 1). `configFor` still appears in the route options of `terminal`, `commands` and `chat`; only `CommandRunOptions.configFor` was removed.
