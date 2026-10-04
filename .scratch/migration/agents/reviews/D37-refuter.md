# Step D37 refuter report (on .agents/worktrees/D37, base ed0e6de58)

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
