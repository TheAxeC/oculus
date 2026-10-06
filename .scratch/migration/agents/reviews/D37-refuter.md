# Step D37 refuter report (on .agents/worktrees/D37, base 48841862f)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

```
$ sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md   (from .agents/worktrees/D37/tools/oculus)
ok      ASCII gate (0.5 s)
ok      prettier (1.7 s): All matched files use Prettier code style!
ok      svelte-kit sync (1.9 s)
ok      svelte-check (15.8 s): 1791155159516 COMPLETED 355 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (19.4 s)
ok      vitest (20.2 s): Duration  17.03s (transform 48.00s, setup 0ms, import 60.06s, tests 7.20s, environment 75ms)
test:quick: 20.8 s (limit 45.0 s); every command passed
checks: 1 commands passed

Guarded test files the report lists, each alone with `npx vitest run <file>`:
G3:  file-undo 9 passed, file 1, history 3, open 2, project-files 1, source 3, ops-replace 4, config-key 2,
     config-value 3, server/files/fs 1, ops-paste 5, ops 3, server/files/search 1, untracked/trash 2
G28: tab-menu 2, terminal-close 3, form-drafts 3, manifest-draft 3, state/sessions/source 2, comment-draft.client 1
G35: compose 4, terminal-actions 11, terminal-edit 1, terminal 4, commands/run 3, pty/channel 2, pty/sessions 1, pty/tmux 1
also: commands/placeholders 4 passed, routes/sessions/latex 1 passed
Every file: no failure.

Tree checks read for doubt (keys, comment-width, history, size, boundaries, duplication, cycles, order, diagrams,
config, config-folder): Test Files 11 passed (11), Tests 165 passed (165)

ASCII gate (spec.md's perl form over src tests config, local.yml excluded): prints nothing.
LC_ALL=C grep -c '[^ -~]' HELP.md DESIGN.md D37-report.md: 0, 0, 0
sh utils/unused-exports.sh, diff against D37-base/unused-exports.txt: no difference (header "Unused exports (257)")
grep -rnE "resumeRefusal|failed_roots|COMMAND_ACTIONS|capture_unlisted|server\.commands\.(no_file|no_selection|nul|source)"
  src tests config HELP.md DESIGN.md --exclude=local.yml: nothing, exit 1

node probe/first.mts (the builder's probe, rerun):
case1 first replace answer {"ok":true,"paths":["hub/a.txt"],"rereads":[{"root":"hub","path":"a.txt","hits":[{"line":1,"column":6,"length":6,"text":"zz x qzlook","at":5,"was":{"line":1,"at":9}}]}]} "zz x qzlook\n"
case1 second replace at the old place {"ok":false,"error":"changed","done":[],"failed":"hub/a.txt","rereads":[]}
case8/10 answer {"truncated":false,"total":1,"failed":[{"root":"claude","why":"timed-out","reason":"the search timed out"},{"root":"gone","why":"failed","reason":"rg: boom"}]}
node probe/page.mts (rerun): identical to the report's five lines, including
dismissed stays out [] [{"root":"hub","path":"a.txt","line":1,"at":5,"length":6}]

Red run, the builder's scratch copy `scratchpad/red` (base src, step's tests): npx vitest run terminal-actions.test.ts terminal.test.ts
  Tests 10 failed | 5 passed (15); failing lines as the report quotes them, e.g.
  AssertionError: expected undefined to deeply equal [ 'set-option', '-t', ...(3) ]
  AssertionError: expected 'e66dfa-shell' to be '841392-shell' // Object.is equality
  AssertionError: expected { error: 'id is not a session id' } to deeply equal { error: 'not-a-session' }

History-word grep with spec.md's own list (before, used to, no longer, still, always has been, always had, as before,
previously, the step adds, after this package) over added comment lines and test titles: 21 hits, each about runtime
state ("the place it had before the write", "a terminal tmux no longer has"); none is history.
```

`npm run diagrams` was not rerun (it writes into the worktree); `tests/checks/diagrams/diagrams.test.ts` passed over the committed diagrams.

## Verdicts

Items of the brief's "What to build":

- 1: violated, Spec 1 (a dismissed hit on a line the write changed stays out). The re-read itself holds: the probe rerun gives the re-read hit at `at: 5` with `was: {line 1, at 9}`.
- 2: holds. The probe rerun gives `truncated: false` with one root timed out (`search.ts:482-487`); the catalog lines are `root_timed_out` and `root_failed`; there is one line per root (`Results.svelte:157-163`).
- 3: holds by reading. `landing.ts` treats `away` as locked in every step and splits to the right of it; `opening.ts` passes the asker; `repositories.svelte.ts:262` passes it only from the Search store. The look is owed.
- 4: violated, Spec 2 (change 6's "a build first seen already ended ends at once" is not built). The task terminal, the joined options, the respawn in place and the refusal words hold, shown by the G35 tests and the red run.
- 5: holds. `finish` calls `queries.refetch(..., 'again')` (latex.svelte.ts).
- 6: holds by reading. `Rows.svelte` calls `reread` on mount; `filesMoved` marks by root, by gap and when roots are not yet read; a bookmarks message marks nothing.
- 7: holds by reading: `problem`/`problems` are chosen by the total, and so are `error_one`/`errors_many` and `warning_one`/`warnings_many`.
- 8: holds by reading. `menuOf` reads the listing when it is not held, rebuilds from both answers and leaves the menu on a failed read.
- 9: holds by reading: `decode()` before the append, a failed decode gives null, `max-width:458px`.
- 10: violated, Standards 1 to 4 and the documentation half of Spec 1.

Cases of the brief's "Cases":

- 1: met. The probe rerun shows the second hit re-read at its new place; a Replace at that place is the request the page now sends.
- 2: met by reading. `replaceHits` calls `previewHit(id, focus)` on the answer after `applyRereads`, so the preview names the re-read hit.
- 3: met by reading. Both new matches of `aa b` touch the written region, so neither gets `was` (`replace.ts` `rereadFile`), and `applyRereads` keeps both.
- 4: met by reading. A file whose re-read has no hit is left out (`hits.ts` `applyRereads`), and `focusAfter` walks from `rowAfter`'s row.
- 5: met. The dismissed hit is on a different line, so its `was` maps it (probe "dismissed stays out").
- 6: met by reading. Every written file gets a `Reread`, and the count line comes from `replaceDone` as before.
- 7: met by reading. The refused answer carries `rereads` of the files done (`replace.ts:426-428`); the refused file is in neither list.
- 8: met (probe rerun: `truncated: false`; `replaceAsk` reads `truncated` only).
- 9: met by reading (`folded.truncated || outcome.stopped` still sets it).
- 10: met (`search.root_failed`: "No answer from {0}: ripgrep could not search it.").
- 11: met by reading (`away` excluded in the `received` loop, the `here` step and `all`; split at `away`). The look is owed.
- 12: met by reading (the documents pane step is unchanged).
- 13: met by reading (the first preview's pane is the newest `received` and holds no tool).
- 14: met by reading (the Repositories view calls `openDiff` with no asker, so `away` is null).
- 15: partial. The test shows the task terminal and the options in one invocation. Whether the build mark ends is not given, Spec 2. The output after the end needs the look.
- 16: met by reading. A push with `exit` set ends a build seen running. The look is owed.
- 17: partial, Spec 2.
- 18: met. The server answers `terminal-ended` (red, then green in the refusal table), and `terminals.svelte.ts` `resizeTerminal` says it on the owning tab. The bar needs the look.
- 19: met by reading (`finish` uses `refetch` with `'again'`).
- 20: met by reading (`Rows.svelte` effect, then `reread` marks the held state).
- 21: met by reading (`filesMoved` with `holds(root, joinPath(base.dir, data.dir))`).
- 22: met by reading. The one exception is the first `files` message a page hears, which counts as a gap and marks every held state, as the brief's gap rule and `docs.svelte.ts` do.
- 23: met by reading (`Main.svelte` `errorsSaid`/`warningsSaid` and the label chosen by the total).
- 24, 25, 26: met by reading (`picks.svelte.ts` `menuOf` and `rowFacts` over `heldEntries ?? listingRead`).
- 27, 28: met by reading. The look is owed.
- 29: met by reading (`decode()` rejects, so `previewOf` gives null).
- 30: met by reading (`show` drops an answer whose `turn` moved).
- 31: met (`builds again in the terminal it kept` reruns a latex terminal with `rerun`).
- 32: met by reading. `attention.touched()` always gives a page, and a float's instance is not in that page's tree, so `away` is null and the preview lands on the page.
- 33: met (the same test: one start, then one respawn per ended build).
- 34: met by reading (`commands.svelte.ts` `ranCommand` in `note`, `readEnded` and the listed set).
- 35: met (the refusal table answers `not-a-session`, and `terminal-words.ts` gives its catalog sentence).

## 1. Spec

- `src/lib/state/sources/search/hits.ts:126-132`: "const out = was === undefined ? undefined : mine.find((one) => one.line === was.line && one.at === was.at); if (out !== undefined) { records = [...records, { ...out, line: hit.line, at: hit.at, length: hit.length }]; continue; }"
  - What is wrong: a dismissed hit stays out whenever its match bytes were untouched, even when the write changed its line. The brief's item 1 says "one whose line the write changed comes back", decision 2 says "this keeps it while its line is unchanged", and change 2 ends "a hit on a changed line comes back". The code follows only change 2's first clause.
  - The documents state the brief's rule, so they are false against the code: `HELP.md:181` "a hit you dismissed stays out while its line is as it was, and comes back when the replace changed its line", `DESIGN.md:131` "a hit on a line the write changed comes back", and the doc comment at `hits.ts:96` "a dismissed hit whose line the write changed has no such partner".
  - Change 1's definition of `was` (its match sits on text the write did not change) is what makes the two readings differ. The orchestrator rules which one the brief meant; either the code or the three texts change.
  - Failure scenario: `qzlook x qzlook`; dismiss the second hit, then Replace the first. The line now reads `zz x qzlook`, and the dismissed hit stays out (the builder's own probe, rerun: "dismissed stays out [] [...]"). A reader of HELP.md expects it back.
  - Verdict: item 1 violated, item 10 violated.
- `src/lib/state/sessions/latex.svelte.ts:706`: "mine.running = live(answer.id); watch(target, answer.id); return answer;"
  - What is wrong: change 6 asks that "a build first seen already ended ends at once". Here a terminal first seen already ended only gets `running = false`. `confirm`, and so `finish`, is reached only from the `sessions` handler on a new version (`latex.svelte.ts:357-372`), so nothing ends the build when no further push comes.
  - Failure scenario 1 (found by reading): Build on an up-to-date main whose kept build terminal last ended with exit 0. The server respawns, and latexmk exits at once, before the list read that `options.refresh()` starts. The channel's list signature (`channel.ts:551-560`: id, name, title, icon, color, task, exit, with no pid) is then unchanged, so no `sessions` push comes.
  - Failure scenario 2 (found by reading): a push that already shows the new terminal ended arrives while the POST is out. The handler skips it (`one.terminal === null`).
  - In both scenarios the row says `building` until an unrelated `sessions` push. Meanwhile `underway()` is true (`!one.running`), so build-on-save only sets `again` and starts nothing for that main. The `answer.terminal` record the server sends carries `exit` and could end it at once.
  - Verdict: item 4 violated, cases 15 and 17 partial.
- Report, "Files outside the brief's write list": the new `src/lib/server/machine/pty/refusal.ts` is outside the write list (the brief names only a client module beside `answers.ts`), and the list does not name it.
  - The report also lists `run.ts`, `model-sessions.ts`, `file-ops.ts`, `model-search.ts`, state `search.ts`, `ops.svelte.ts`, `commands.svelte.ts`, `pty-io.ts`, `answers.ts` and `terminal.yml` as outside, though the write list holds all of them.
  - Judged: `refusal.ts`, `placeholders.ts`, `resolve.ts`, `server.yml`, `model/index.ts`, `terminal-payloads.ts`, `SessionList.svelte` and `SessionDetail.svelte` are each needed by change 8 or 9.
  - Failure scenario: the orchestrator checks the diff against the write list from the report and misses the server module that every terminal refusal now passes through.
  - Verdict: none.

## 2. Proof

- Report, DONE table, rows 3, 5, 6, 7, 8 and 9: "DONE | `finish` uses `queries.refetch(..., 'again')`", "DONE | `Rows.svelte`, `latex.svelte.ts` `reread` and the `files` handler", and the like.
  - What is wrong: spec.md "Report" says each DONE row quotes the last line of the run that proves it, and a DOM-dependent row names the look as its proof. These rows cite code locations, with no run and no look.
  - Failure scenario: the orchestrator reads them as proven and does not put cases 16, 19 to 22 and 24 to 30 on the landing look's list.
  - Verdict: none.
- Report, the whole: spec.md "What every package obeys" requires, for every id or key the step introduces, a statement of the empty, duplicated and colliding cases, and for every asynchronous path, the in-flight, after-close and superseded cases. The report has no such section.
  - The ids and keys are the `TERMINAL_REFUSALS` words, `dismissed`, `rereads`, the `latex` source and the catalog keys.
  - The asynchronous paths are the row menu's listing read landing after the menu closed, the picture `decode()` superseded, and a re-read answer after the tab closed.
  - By reading, each case is handled: the word lists of `OPS_REFUSALS`, `LATEX_REFUSALS` and `TERMINAL_REFUSALS` do not overlap; `replaceHits` returns on `!open(id)`; `show` drops a stale `turn`.
  - Failure scenario: a later step changes one of these paths with no record of what this step decided for it.
  - Verdict: none.

## 3. Standards

- `DESIGN.md:151`: "a refusal of a project command's action of the terminal route is the server's sentence, which names the command, the placeholder or the cycle that stops the run".
  - What is wrong: the diff makes this false. Those refusals are now words with `names`, said through `terminal-words.ts` (`run.ts`, `resolve.ts`, `placeholders.ts`, `pty-io.ts`). spec.md "What every package obeys" counts a sentence a change makes false as a defect. The report's stale-phrase grep searched "server's own sentence", which does not match this wording.
  - Failure scenario: a developer reading DESIGN.md adds a new command refusal as an English sentence on the server, and the page shows it raw.
  - Verdict: item 10 violated.
- `HELP.md:33` and `DESIGN.md:378`: "It lands, in this order: ... in the pane you are in, when that pane already holds such tabs; ... otherwise in a new pane split off to the right of the pane you are in".
  - What is wrong: `landingFor` now also takes `away`, the asking tool view's pane, which no step takes and which the split is made beside. The general landing rule on both pages lists no such exception, and the report's still-true list does not name either paragraph.
  - Failure scenario: a reader in the Search tab's pane, which holds opened tabs, expects a diff opened from Search to land there by HELP.md:33. HELP.md:181 says otherwise.
  - Verdict: item 10 violated.
- `src/lib/server/machine/pty/edit.ts:5-7`: "an ended terminal or a session oculus did not start is refused with a sentence and no command is run for it".
  - What is wrong: `listedTerminal` now throws `TerminalRefused` with a word (`edit.ts:40-43`). The head comment is made false and was not rewritten.
  - Failure scenario: a reader of the module adds a check that throws an English sentence, which `refusalFor` turns into `bad-terminal`.
  - Verdict: item 10 violated.
- Comments edited without being rewrapped as one paragraph at 100 columns (spec.md "What every package obeys"):
  - `src/lib/state/sessions/latex.svelte.ts:41` ("// says `building`", 18 columns, followed by a 97-column line);
  - `src/lib/ui/controls/editor/kit/latex/latex-widget.ts:12` ("// drawn as its name. The widget is removed", 43 columns);
  - `src/lib/views/shared/explorer/tree/menu/row-menu.ts:170` (86 columns, "holds or the menu read, ..., and the") and `:218` ("(picks.svelte.ts). A folder: New File... and", 47 columns);
  - `latex.svelte.ts:544` (91 columns, where the next word fits).
  - `tests/checks/source/comment-width.test.ts` passes, since it reads the maximum width only.
  - Failure scenario: the next editor of these paragraphs finds lines broken mid-sentence, the tell the rule exists to prevent.
  - Verdict: item 10 violated.

## 4. Behaviour

- `src/lib/server/machine/pty/routes.ts:424`: "if ('error' in found) return refusal('bad-terminal');"
  - What is wrong: before the change, the LaTeX action answered `resolveRootPath`'s own word (`outside` or `missing`), and the page said "It is not there any more." or "It is not inside a served root." It now says "The terminal request was not valid."
  - In the same way, a start whose session ended before it was listed (`sessions.ts:624`) now says "The terminal has ended." where it said that the terminal did not start.
  - The report states only "tmux's or a validator's text -> a catalog sentence". It does not give this before and after, and the look has no line to read it against.
  - Failure scenario: a LaTeX view open on a folder that was deleted; Build says the request was not valid instead of that the folder is gone.
  - Verdict: none.
- `src/lib/server/machine/commands/run.ts:79`: "if (typeof name !== 'string' || name === '') return refusal('command-unknown');"
  - What is wrong: `command-unknown` is sent without `names`, and `terminal-words.ts` fills `{0}` with the empty string.
  - Failure scenario: a `command` action with an empty name. The page shows " is not a command of this repository.", a sentence with no subject. Before, it showed the server's "name must be a command name".
  - Verdict: none.
- `src/lib/server/files/fs/replace.ts:342` and `:432`: "reread: await rereadFile(...)" and "rereads.push(outcome.reread)".
  - What is wrong: every written file now costs one more ripgrep process, run sequentially inside the request, before the answer.
  - The report states no cost and took no measurement. spec.md's working rules say every claim about cost names its command or says "not verified", and a host-visible change is stated with its before and after.
  - Failure scenario: a Replace All over a few hundred files takes visibly longer, and the look has nothing to read it against. Not measured here.
  - Verdict: none.

## Declined to judge

- Every DOM-dependent case: what the Terminal tab shows after latexmk ends, the resize refusal on the bar, the preview's pane on TEST, the picture box size and the menu item appearing. No browser runs in this review; the landing look settles them.
- Whether failure scenario 1 under Spec 2 occurs on Axel's machine. It depends on whether an unrelated `sessions` push arrives soon, which frequent transcript updates may hide. A look at case 15 with a kept, up-to-date build terminal settles it.
- The report's "Open items of the state file (verbatim): None.": the state file now holds Z443, raised at X3e's /spec. When it was written relative to the builder's read cannot be told from a read.
- The Format Document undo defect (LaTeX defect 4): its absence from the diff is not counted. It is the orchestrator's repair round from `agents/reviews/D37-diagnosis.md`.
- `tests/server/machine/pty/sessions.test.ts` against real tmux: it passed, and a joined `new-session ; set-option` against a session whose command exits at once was not probed on a private tmux socket.
- The builder's counts (11 red tests on the unchanged tree against the reviewer's 10 over two of the three files; "257 entries"): no decision rests on them.

Reviewer usage: ordo-high on claude-opus-5-5 (a69f261fc8c1776c5), 316,568 tokens, 89 tool uses, 18.8 min.

## Repair round 1, refuted

Reviewer of D37 over repair round 1, on `.agents/worktrees/D37`, base 48841862f. Nothing in the worktree or the ledger was changed. Probes ran on scratch copies under the session scratchpad (`rv37/tree` for the worktree with one fix taken out at a time, `rv37/base` for the base `src`). One stray copy this review made in `/tmp/x/` (`channel.ts`) was removed, and `/tmp/x/ctx-new.txt`, which was there before, was left alone.

Open items of the state file (`orchestrator-state.md`, "Open items"): "- None."

```
$ sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md   (from .agents/worktrees/D37/tools/oculus; run twice, both green)
test:quick: 62 changed file(s), from git since HEAD          (59 modified in `git diff 48841862f` + refusal.ts, terminal-words.ts, the report)
ok      ASCII gate (0.4 s)
ok      prettier (1.7 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.0 s)
ok      vitest (35.9 s): Duration  31.27s (transform 91.97s, setup 0ms, import 107.67s, tests 15.79s, environment 183ms)
ok      svelte-check (35.6 s): 1791157921138 COMPLETED 355 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (40.1 s)
test:quick: 40.6 s (limit 45.0 s); every command passed
checks: 1 commands passed
(second run: test:quick: 29.9 s (limit 45.0 s); every command passed / checks: 1 commands passed)

Guarded test files the report lists, each alone with `npx vitest run <file>`, all green:
file-undo 9, file 1, history 3, open 2, project-files 1, source 3, ops-replace 4, compose 4, latex 1,
terminal-actions 13, terminal-edit 1, terminal 4, config-key 2, config-value 3, server/files/fs 1, ops-paste 5,
ops 3, server/files/search 1, untracked/trash 2, placeholders 4, commands/run 6, pty/channel 3, pty/sessions 1,
pty/tmux 1, tab-menu 2, terminal-close 3, form-drafts 3, manifest-draft 3, state/sessions/source 2,
comment-draft.client 1

npx vitest run tests/checks: Test Files 16 passed (16), Tests 227 passed (227)
ASCII gate (spec.md's perl form over src tests config, local.yml excluded): prints nothing
LC_ALL=C grep -c '[^ -~]' HELP.md DESIGN.md D37-report.md: 0, 0, 0
sh utils/unused-exports.sh vs D37-base/unused-exports.txt: no difference ("Unused exports (257)")

Builder's probes, rerun (node 24.21.0):
probe/first.mts  case1 first replace answer {"ok":true,...,"hits":[{"line":1,...,"text":"zz x qzlook","at":5,"was":{"line":1,"at":9,"edited":true}}]}]} "zz x qzlook\n"
                 case8/10 answer {"truncated":false,"total":1,"failed":[{"root":"claude","why":"timed-out",...},{"root":"gone","why":"failed","reason":"rg: boom"}]}
probe/lines.mts  line 1 hit has "edited":true; line 2 {"line":2,"at":6} and line 3 {"line":3,"at":0} have none
probe/page.mts   edited line, dismissed hit listed again [[5]] []
                 other line, dismissed hit stays out [[[1,5]]] [{"root":"hub","path":"a.txt","line":2,"at":6,"length":6}]
probe/words.mts  in more than one set: [] / terminal word count 18

Red runs on rv37/tree, one fix taken out at a time:
channel.ts without `one.pid` in the signature:  AssertionError: expected 1 to be 2 // Object.is equality; Tests 1 failed | 2 passed (3)
replace.ts with `edited` forced false:          AssertionError: expected { status: 200, ...(1) } to deeply equal { status: 200, ...(1) }; Tests 1 failed | 3 passed (4)
routes.ts:424 back to 'bad-terminal', sessions.ts:624 back to 'terminal-ended':
  AssertionError: expected { error: 'terminal-ended' } to deeply equal { error: 'terminal-not-started' }
  AssertionError: expected { error: 'bad-terminal' } to deeply equal { error: 'outside' }; Tests 2 failed | 11 passed (13)
run.ts:79 back to 'command-unknown':           AssertionError: expected { error: 'command-unknown' } to deeply equal { error: 'bad-terminal' }; Tests 3 failed | 3 passed (6)
restored: Tests 19 passed (19)

Item 10, probe/cost.mts (200 files, one match each, Replace All through replaceFiles, 5 runs, ms):
rv37/base   2109 2895 2090 2100 2112  mean 2261 sd 354
worktree    3296 2842 2893 2462 2601  mean 2819 sd 320     (1.25 x)
rv37/base   1816 1774 1964 1589 2024  mean 1833 sd 171
worktree    2666 2719 2547 2714 2569  mean 2643 sd 81      (1.44 x)
(builder: 1.58 x and 1.54 x; under twice the base in both runs)

Item 11, the builder's scratch probes (scratchpad/ed/tests/probe), rerun:
model.client.test.ts > without: AssertionError: expected { before: 1, after: 2 } to deeply equal { before: 1, after: 1 }
model.client.test.ts > with: passes
mount.client.test.ts: ReferenceError: window is not defined, at svelte/src/internal/client/dom/operations.js:43 ($window = window) inside svelte's own mount()

My probe, rv37/empty.mts (a replace whose replace text is empty):
first deleted  " x qzlook\n" [[1,3,{"line":1,"at":9}]]                 <- no `edited` though the line changed
second deleted "qzlook x \n" [[1,0,{"line":1,"at":0,"edited":true}]]
second -> zz   "qzlook x zz\n" [[1,0,{"line":1,"at":0,"edited":true}]]
first deleted, no newline " x qzlook" [[1,3,{"line":1,"at":9}]]        <- no `edited`

History-word grep (spec.md's list) over added comment lines and test titles: 27 hits, each about runtime state ("before the write", "still running", "a terminal tmux no longer has"); none is history.
```

### Verdicts

Round items (`agents/briefs/D37-round1.md`):

- R1: violated, finding 1. A dismissed hit comes back when a non-empty replacement or a deletion at the end of the line changes its line (probes above, `applyRereads` drops the record). A deletion at the start of the line leaves the hit without `edited`, so the dismissed hit stays out.
- R2: holds. `run()` ends a build whose start answer carries a numeric `exit` through `finish` (`latex.svelte.ts:711-713`). A build not seen running is checked again with `confirm` (`:714-715`). `confirm` and `live` treat `exit !== null` as ended. The server half (`channel.ts` `#took` with `one.pid`) was seen red and green above. The page half is proved by reading, and the look at case 15 with a kept build terminal is still owed.
- R3: holds. "Files outside the write list" names `refusal.ts` with its reason and no longer lists files the write list holds.
- R4: partial, finding 2. Each row quotes a run or names a look, but the case numbers on rows 3 and 5 to 9 are off. Case 23 is named in no row and in no look list of the report.
- R5: holds. The section covers `TERMINAL_REFUSALS`, `dismissed`, `rereads`, the `latex` source, the catalog keys and the three async paths. I read `replaceHits` (`!open(id)` after the await, the `current` generation check), `latex-widget.ts` `show` (`turn`) and `menuOf`, and they agree with it.
- R6: holds. `DESIGN.md:151`, `HELP.md:33`, `DESIGN.md:378` and the `edit.ts:5-7` head comment now say what the code does. The stale-phrase grep I ran (server's sentence, refused with a sentence, left the terminals list, failed_roots, raw text) leaves only true hits.
- R7: holds for the paragraphs the round names. Finding 4 is a new comment of this round that is not wrapped at 100.
- R8: holds. `routes.ts:424` answers `refusal(found.error)`, and `sessions.ts:624` throws `terminal-not-started` with its catalog sentence (`terminal.yml:60`). The page says `outside` and `missing` through `refusedAnswer`, which checks the file words first. Red and green reproduced above, and the report gives the before and after.
- R9: holds. `run.ts:79` answers `bad-terminal`. Red and green reproduced, and the report gives the before and after.
- R10: holds. The cost was reproduced at 1.25 x and 1.44 x, under twice the base.
- R11: holds by reading, and no test reaches it. With `named` and `filed` as `$derived`, an instance replaced by a copy with the same id re-runs the derived, which returns an equal string. The model effect (`Editor.svelte:298-323`) then tracks only `kit`, `editor`, `named` and `filed`, so it no longer re-runs. The builder's reproduction is red without the change and green with it.
  - Other effects of `Editor.svelte`: `path`, `language`, `indent` and `extension` come from `$derived` values of `Source.svelte` (`:153`, `:199-210`). On the keep they re-derive to equal strings, or to an `indent` object that only re-runs `applyIndent`, which does no harm.
  - "No test reaches it", judged against the diagnose skill's rule ("a place no test can reach the defect as it occurs ... with the reason"): the reason holds. Svelte's own `mount` reads `window` in `init_operations` (rerun above), the `client-runtime` environment provides no DOM (`tests/ui/frame/client-runtime.ts`), and the model effect runs only after `build` has a bound host element. No entry of `agents/guarded.md` covers `ui/controls/editor/`. Whether the editor keeps its input across the keep (Q120) is stated as not verified, and the look is named.

Items of `agents/briefs/D37.md` "What to build", over the whole diff since the base:

- 1: violated, finding 1. The re-read, `was`, focus and preview hold (probes; `replaceHits` `focusAfter` and `previewHit`).
- 2: holds (probe `truncated:false` with `why`; `search.root_timed_out` and `search.root_failed`).
- 3: holds by reading (`landing.ts` `away`, `opening.ts`, `repositories.svelte.ts` passes the asker from Search only). The look is owed.
- 4: holds. Task terminal, joined options, respawn in place and the refusal words: G35 tests green and the red runs above. Change 6 is now built (R2).
- 5: holds (`finish` calls `queries.refetch(..., 'again')`).
- 6: holds by reading (`Rows.svelte` `reread` on mount; `filesMoved` by root, by gap and when no roots are read).
- 7: holds by reading (`problem`/`problems`, `error_one`/`errors_many`, `warning_one`/`warnings_many`).
- 8: holds by reading (`menuOf` reads the listing, rebuilds from both answers, and a failed read changes nothing).
- 9: holds by reading (`decode()` before the widget is added, `max-width:458px`, a `turn` that moved drops the answer).
- 10: holds (R6). HELP.md:181's rule on dismissed hits is the rule the brief states; the code misses it in the case of finding 1.

Cases:

- 1, 2: met (probe first.mts; `previewHit` after `applyRereads`).
- 3, 4, 6, 7: met by reading (`rereadFile` gives no `was` to a match the write touched; a file with no hit leaves; every written file gets a `Reread`; a refused answer carries the `done` files' rereads).
- 5: met (probe "other line, dismissed hit stays out").
- 8, 10: met (probe); 9: met by reading.
- 11 to 14: met by reading; the look is owed.
- 15: met by reading and by test (a task terminal, the options in the `new-session` invocation, an answer whose `exit` is set ends the mark). The output after the end needs the look.
- 16, 17: met by reading (a push or the answer with `exit` set ends the build; `confirm` reads the list again). The look is owed.
- 18: met for the server's word `terminal-ended` (test). The bar needs the look, and no look list of the report names it (finding 2).
- 19 to 22: met by reading.
- 23: met by reading (`Main.svelte`). No look list of the report names it (finding 2).
- 24 to 30: met by reading; the look is owed for 24, 27 and 28.
- 31, 33, 35: met (terminal-actions tests).
- 32: met by reading; the look is owed.
- 34: met by reading (`ranCommand` is false for `source: 'latex'`).

### Findings

1. **Spec.** `src/lib/server/files/fs/replace.ts:363-367`.
   - The hunk: `function written(...) { return regions.some((one) => one.from === one.to ? start < one.from && one.from < end : one.from < end && one.to > start); }`
   - What is wrong: R1's closure holds only for writes that leave text on the line. A replace with empty replace text deletes a match at the start of a line, which is a zero-length region at `from === start`. The strict `start < one.from` takes that region off the line, so the other hit on the line gets `was` with no `edited`. The same happens for a deletion at the end of a last line that has no newline (`one.from === end`).
   - Probe `rv37/empty.mts`: `" x qzlook\n" [[1,3,{"line":1,"at":9}]]`.
   - Failure scenario: a file with `qzlook x qzlook`, searched for `qzlook` with an empty replace text. Dismiss the second hit, then Replace the first. The line now reads ` x qzlook`, and the dismissed hit stays out. HELP.md:181 ("comes back when the replace changed its line"), DESIGN.md:131 and the brief's item 1 say it comes back.
   - Verdict: item 1 violated, R1 violated.
   - The fix is small and inside the brief: count a zero-length region at the line's start, and at the end of a line without a newline, as on the line, with a probe row for an empty replacement.
2. **Proof.** `agents/reviews/D37-report.md`, the "DONE / NOT DONE" rows 3 and 5 to 9, and the opening "NOT done, not verified" list.
   - The hunks: "7 (L5) singular | ... look: case 24 (`1 problem`, `1 error, 1 warning`)", "8 (L6) ... looks: cases 25 to 27", "9 (L7) ... looks: cases 28 to 30", "6 (L3) ... looks: cases 19 to 22", "5 (L2) ... look: case 16", "3 (S3) ... cases 11 to 14 (... a float)", and "The look cases (11 to 17, 19 to 22, 24 to 30, 32 ...)".
   - What is wrong: the rows name the wrong cases.
     - The singular is case 23, and row 7 names case 24.
     - L6 is cases 24 to 26.
     - L7 is cases 27 to 30.
     - L2 is cases 17 and 19.
     - L3 is cases 20 to 22.
     - The float is case 32.
     - Case 23 and the bar of case 18 are in no look list of the report. The round brief's own list for R4 ("24 to 30") also leaves out 23.
   - Failure scenario: the orchestrator builds the landing look from these rows and never checks that the problems button says "1 problem", which no test covers.
   - Verdict: R4 partial.
   - Disposition: the orchestrator's look list at landing adds case 23 and the bar of case 18.
3. **Standards.** `tests/server/machine/pty/channel.test.ts:145-183` ('changes when a task terminal ends with the status it had, in a process run again'). The same holds for the other tests this step added: `tests/server/machine/commands/run.test.ts:157` ('a command action that names no command'), `tests/routes/sessions/terminal-actions.test.ts:158` ('builds again in the terminal it kept, and cleans in another') and `:202` (the 'POST /api/terminal, a refusal' table).
   - What is wrong: spec.md "What every package obeys" says a test exists only as the test of an entry of `agents/guarded.md`, named there by file and title. `grep -n -o -e "names no command" -e "a refusal'" -e "builds again in the terminal it kept" -e "changes when a task terminal ends" agents/guarded.md` finds nothing (exit 1).
   - Brief change 14 authorizes cases of items 4 and 9 in G35's test files, which covers the refusal table, the kept-terminal test and the empty command name. The pid-in-signature test belongs to no entry's text: G35 is "acts only on the terminal it names" and G28's channel test is the page detach. The builder named the channel test and the `ops-replace` change as needing a `guarded.md` line, and did not name the other three.
   - Failure scenario: a later step deletes or rewrites these tests as unowned, or a reviewer cannot tell which entry each one guards.
   - Verdict: none.
   - Disposition: the orchestrator's booking in `guarded.md` at landing. The channel test's entry is a judgment for the orchestrator, or for Axel if it needs a new entry.
4. **Standards.** `src/lib/ui/controls/editor/Editor.svelte:289-292`, the comment this round added ("// The values that name the model, held as values: ... (a tab instance's id) ...").
   - What is wrong: spec.md "What every package obeys" asks for a paragraph wrapped at 100 columns. Lines 289 (96 columns), 290 (93) and 291 (96) each end before a next word that fits ("(a", "object", "the"). The comment-width check passes because it reads the maximum only.
   - Failure scenario: the next editor of the paragraph finds it wrapped short of the rule.
   - Verdict: none. A rewrap at landing.
5. **Behaviour.** `src/lib/server/machine/pty/channel.ts:551-562`, `one.pid` added to the list signature.
   - This change is outside the write list and goes beyond R2's text. It is needed for R2: without it, a kept build run again that ends before the next poll with the same status gives no push (red above).
   - Its effect on each `sessions` push consumer, by reading:
     - `terminals.svelte.ts`: same ids, nothing closes.
     - `notice-sources.ts` `sessionsHeard`: posts by key, so there are no repeats.
     - The server's `sessions` watch: one more broadcast per respawn.
     - `commands.svelte.ts` `readEnded` (`:633-639`, keyed by `pid`): it now captures again the output of a project command whose Run Again or Restart ended between two polls with the same status. Before, its command diagnostics stayed those of the previous run until an unrelated push.
   - What is wrong: the report states the effect for LaTeX builds only. "Host- and user-visible changes" has no line for project command diagnostics, and the look has nothing to read it against.
   - Failure scenario: a reader sees a command's problems change after a fast rerun, and the landing report cannot say whether that was intended.
   - Verdict: none. One line in the landing report.

No finding is a check removed to close a finding. The changed `ops-replace` assertion adds `edited: true`, which makes the check stricter, not looser.

### Declined to judge

- Every DOM case is for the look, since no browser ran in this review: the Terminal tab after latexmk ends, the resize refusal on the bar, the preview's pane, the picture size, the menu item, "1 problem", and Format Document then Cmd+Z on a preview tab, with the caret after the keep (Q120).
- Whether R2's page half ends the mark on Axel's machine when latexmk ends between two polls. This was read, not run. Case 15 with a kept, up-to-date build terminal at the look settles it.
- A joined `new-session ; set-option` against a session whose command exits at once, on a private tmux socket. It was not probed; `sessions.test.ts` passed.
- The cost figures depend on machine load (other builders were running). Both runs here and both of the builder's are under twice the base. No decision rests on the exact ratio.

Reviewer usage: ordo-high on claude-opus-5-5 (a45d0e7de5d8174e5).
### Closed

- Finding 1: fixed at landing on main (small, inside the brief): `replace.ts` `written` counts a zero-length region at a line's start, and at the end of a last line with no newline, as on the line.
- Finding 2: the landing look adds case 23 and the bar of case 18, with every case the report routes to the look.
- Finding 3: the four tests are named under G35 in `agents/guarded.md` at landing, the channel test with them as the test of the respawned build's push.
- Finding 4: rewrapped at landing.
- Finding 5: the landing report states the effect on project command diagnostics.
