# Step O169 refuter report (on .agents/worktrees/migration-O169, base 32585f1f1)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ node utils/outside-paths.mjs /Users/axelfaes/workspace/oculus/.scratch/migration/agents/briefs/O169.md 32585f1f1   (worktree root)
docs/diagrams/layer-state.dot
docs/diagrams/layer-state.svg
docs/diagrams/layer-views.dot
docs/diagrams/layer-views.svg
docs/diagrams/layers.dot
docs/diagrams/layers.svg
exit 0
(the six are the brief's prose entry "the generated diagrams `docs/diagrams/*.dot` and `*.svg` if `npm run diagrams` changes them", which the script does not parse)

Verify 1: npm run diagrams, then npm run test:quick -- --base 32585f1f1
git diff 32585f1f1 --stat | tail -1 after diagrams: 24 files changed, 549 insertions(+), 350 deletions(-)   (git status --short: the same 24 paths plus the report, nothing new)
test:quick: 25 changed file(s), from git since 32585f1f1
test:quick: 110 test file(s)
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (3.7 s)
ok      eslint (4.6 s)
ok      svelte-check (16.5 s): 1794088553355 COMPLETED 589 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (110.2 s): Duration  91.78s (transform 64.44s, setup 0ms, import 200.08s, tests 155.21s, environment 4.85s)
FAILED  vitest checks (130.6 s)
ok      vitest slow (182.0 s): Duration  163.60s (transform 33.51s, setup 0ms, import 111.70s, tests 533.91s, environment 8ms)
test:quick: 185.8 s; failed: vitest checks
  FAIL  |unit| tests/checks/imports/order.test.ts > the folder order of each layer > holds the state folders
  + "state/forms/referrers.ts:20 imports state/system/config/rows.ts (state/system, above state/forms)",
  Test Files  1 failed | 9 passed (10)
       Tests  1 failed | 90 passed (91)

Verify 2: LC_ALL=C perl -ne '...' over the 21 changed text files and the report
ascii exit 0   (printed nothing; the three .svg files also print nothing)

Verify 3: npx vitest run tests/routes/sessions/terminal-actions.test.ts
 Test Files  1 passed (1)
      Tests  38 passed (38)

Verify 4: sh utils/unused-exports.sh > scratch; diff .agents/worktrees/O169-base/unused-exports.txt scratch
unused exit 0
diff exit 0   (no line added)

Verify 5: read (see Standards 6).

Commands the report quotes, rerun (case programs from the shared scratchpad .../scratchpad/cases/, node v24.21.0):
node c1.ts <worktree>
primary hub, card (hub:tasks): started, seed first line "Task: Write the report"
second hub, card (lab:tasks): started, seed first line "Task: Order the parts"
primary hub, ticker (tasks): started, seed first line "Task: Write the report"
second hub, ticker (tasks): started, seed first line "Task: Order the parts"
removed task, card (hub:tasks): refused task-unknown
removed task, ticker (tasks): refused task-unknown
node c2.ts <worktree>
ssh line then fatal: line "ssh: Could not resolve hostname git.example: nodename nor servname provided, or not known. Could not read from remote repository."
two ssh lines then fatal: line "ssh: connect to host b port 22: Connection refused. Could not read from remote repository."
fatal line only: line "Could not read from remote repository."
a row matches: line "git@github.com: Permission denied (publickey)." kind "Git key refused"
node c3.ts <worktree>
named by slurm.resource and two projects: Referred to by Alpha, Project beta, Slurm: Resource. The references stay in their files and show as findings.
    Named by tag: The setting Slurm: Resource
named by two projects alone: Referred to by Alpha, Project beta. The references stay in their files and show as findings.
node c4.ts <worktree>
oculus: repo "/Users/axelfaes/workspace/oculus"; sent ["GET /api/cpp?repo=%2FUsers%2Faxelfaes%2Fworkspace%2Foculus","POST /api/cpp {\"repo\":\"/Users/axelfaes/workspace/oculus\",\"at\":null,\"changes\":{\"name\":\"x\"}}"]
gone: no call; said "The folder of gone does not exist."; sent []
node c4-server.ts <worktree> <worktree> oculus <worktree>
oculus: {"error":"repo must be an absolute path"}
/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O169: {"repo":"/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O169"}
node c5.ts <worktree>
new terminal, tmux says "socket path too long": 400 {"error":"terminal-not-started","names":["socket path too long"]}
    drawn: The terminal did not start: socket path too long.
new terminal, tmux says "server exited unexpectedly.": 400 {"error":"terminal-not-started","names":["server exited unexpectedly"]}
    drawn: The terminal did not start: server exited unexpectedly.
new terminal, tmux timed out (TmuxSilence): 400 {"error":"terminal-not-started","names":["tmux did not answer within 0.2 s"]}
    drawn: The terminal did not start: tmux did not answer within 0.2 s.
new terminal, tmux failed saying nothing (TmuxSilence): 400 {"error":"terminal-not-started","names":["tmux failed without saying why"]}
    drawn: The terminal did not start: tmux failed without saying why.
steer of a terminal that ended, tmux fails: 400 {"error":"terminal-ended"}
    drawn: The terminal has ended.
resize of an unlisted id: 400 {"error":"terminal-ended"}
    drawn: The terminal has ended.

First run on the unchanged tree, reproduced on the base copy .agents/worktrees/O169-base (node resolves the main checkout's node_modules from there):
c1: both card rows "refused task-unknown", both ticker rows "started", both removed rows "refused task-unknown"
c2: all three non-row cases line "Could not read from remote repository."; a row matches: kind "Git key refused"
c3: "Referred to by Alpha, Project beta, slurm.resource. ..."; "Named by tag: The setting slurm.resource"
c4: oculus: repo "oculus"; sent ["GET /api/cpp?repo=oculus",...]; gone: repo "gone"; sent [...]
c4-server: oculus: {"error":"repo must be an absolute path"}
c5: every row 400 {"error":"terminal-ended"}, drawn "The terminal has ended."

grep -n "^        host_" config/text/views/system/machine/hpc.yml
49:        host_none: The cluster {0} has no host.
50:        host_no_cluster: The settings of this hub name no cluster (slurm.resource in .oculus/config.yml).
51:        host_not_cluster: '{0} is not a cluster.'
52:        host_not_read: The resources registry is not read yet.
53:        host_not_listed: '{0} is not a cluster of slurm.resource in .oculus/config.yml.'
54:        host_unknown: '{0} names no resource.'
55:        host_unusable: The host of the cluster {0} is not a usable ssh alias, DNS name or address.

git diff 32585f1f1 --stat -- tests
(nothing; exit 0)

git diff 32585f1f1 -U0 -- src config | grep '^+' | grep -inE "before|used to|no longer|still|..."
four hits, the same four the report judges: refusal.ts "still there ... no longer has" (the terminal's state at the request), task-start.ts "the hub's name before it" (place in text), Confirm.svelte "before the confirm" (order), Cluster.svelte "empty before `ssh -G` answered" (kept wording). None is history.

wc -l of the 18 changed source and text files: every count equals the report's file table.
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `seedFacts` (`task-start.ts:58-68`) passes `splitHubId(ref.collection, [named.root]).id`, and c1 starts the card's `hub:tasks` and `lab:tasks` and the ticker's bare `tasks`, while a removed task stays `task-unknown`. `sameTask` compares `collectionKey(a) === collectionKey(b)` (`opening.svelte.ts:241-251`), checked by reading.
- 2: holds. The join is made in `fetchFailureOf` alone (`state.ts:194-198`). `gitsReason` is unchanged. c2 gives the brief's exact C2 line, the last of two ssh lines, git's line alone, and the row's line.
- 3: violated. The setting label's import turns the verify list red (Standards 1). "With one cluster, it is chosen" is not built (Spec 1). The select sits in a caller snippet where the brief named a select inside Confirm (Spec 2).
- 4: holds. `cppRepo` (`cpp-form.ts:616-620`) and `CppRows.svelte` `repo()`. c4 sends the absolute folder for both read and write, and makes no call and says "The folder of gone does not exist." for `real: ''`. c4-server accepts the path and refuses the bare key.
- 5: holds. `routes.ts:521` passes `message.action`, `refusalFor` answers `terminal-not-started` with `error.said` for the start actions, and `tmuxFailureWords` gives `silenceWords` for a `TmuxSilence`. c5 shows every expected line with no argument of the call, and terminal-actions passes 38/38 unchanged. The three comments the item names are now true. A fourth comment outside the item is made false (Standards 2).
- 6: holds. The grep above shows lines 49 to 55 each ending with a full stop and opening with a capital, or with `{0}` (a key).
- 7: holds by reading. `failed` (`Cluster.svelte:96`) is the box's own test, and `resolution` is '' for an `error` resolution while `failed`. The drawn result is owed to the look.
- 8: holds by reading. `marksShape` (`fs-transport.ts:230-241`) now keeps `git`. `folderShape` carries `marks` to `FsRoot`. `reposOf` (`scope.ts:61-62`) reads `ground.folders` alone. The drawn result is owed to the look.

Cases of the brief's "Cases":

- C1: met. The c1 run shows both hubs started from the card and from the ticker, and the removed task refused. `sameTask` is met by reading. Starting a session is owed to the look.
- C2: met, by the c2 run (all four inputs).
- C3: partial. The select with both clusters, the second chosen, and the no-pick state with Submit off are met by reading and owed to the look. The ask and the tag naming "Slurm: Resource", and the two projects named as today, are met by the c3 run. The code that gives the label fails the folder order check, so this half cannot land as built (Standards 1).
- C4: met, by the c4 and c4-server runs.
- C5: met. The c5 run covers both tmux texts, the TmuxSilence timeout and the silent failure, the ended terminal and the resize. terminal-actions passes 38/38, and `git diff 32585f1f1 --stat -- tests` is empty.
- C6: met, by the grep.
- C7: met by reading. One cause drawn on a failed resolution, and the grey line kept on a resolution that succeeded. The drawn result is owed to the look.
- C8: met by reading `marksShape`, `folderShape` and `reposOf`. The scope list is owed to the look.

## 1. Spec

- `src/lib/views/sources/source/actions/SubmitBox.svelte:47`, with `submit-job.svelte.ts:198-206`: "empty={box.picked === null ? '' : undefined}" and "picked: null, ... if (choices.picked !== null) await pick(choices.picked);".
  - What is wrong: item 3 says "with one cluster, it is chosen". The brief check raised this as F6.3, "One cluster only", and the brief's closure records it as stated. As built, a box that offers one cluster opens with the blank choice and Submit off unless the server already picked that cluster. The server picks only when the project's `compute:` names exactly one cluster (`src/lib/server/machine/hpc/submit.ts:319`).
  - The report reads the clause as "a box with one cluster picked shows it chosen", which repeats "the picked one chosen" earlier in the same item. It marks 3a DONE and leaves the other reading as "Not built" in judgment call 2, out of its first line.
  - Failure scenario: a hub whose `slurm.resource` lists one cluster, and a project whose `compute:` names none. Submit Job opens a box with a blank select and a disabled Submit, and the reader must pick the only choice.
  - The fix needs `submit-job.svelte.ts` `press()` (pick `choices.clusters[0]` when the list holds one cluster and `choices.picked` is null) or the server's `picked`. Both are outside the write list.
  - Verdict: item 3 violated.
- `src/lib/ui/controls/confirm/Confirm.svelte:59-60, 101-105`: "pick?: Snippet;" and "{@render pick()}".
  - What is wrong: item 3 names the shape "`Confirm.svelte` gains an optional select drawn above its buttons, through `Select.svelte`". The diff gives Confirm a caller-drawn snippet, and `SubmitBox.svelte` draws `Select` inside it, because the folder order refuses a `ui/controls` import of `ui/forms`.
  - The rules file's "Read first" item 1 says that where the brief and the code's own rules disagree, the builder stops and reports, and does not pick a side. The builder picked a side and reported it afterwards (judgment call 1, "Wrong or impossible").
  - Failure scenario: the orchestrator reads item 3 as built to its named shape. Confirm owns no select, every later caller that wants one draws `Select` itself, and nothing in Confirm keeps that pick to the select primitive.
  - Verdict: none on its own. The user-visible result matches the item. The orchestrator accepts the snippet shape or rules otherwise.
- Brief, "What is on the tree", item 4: "A served root's `dir` may be written with `~` (the server expands it, `src/lib/server/files/roots.ts:31-32`, `uris.ts:76`)".
  - What is wrong: the premise does not reproduce for the value the client holds. `workspacesAnswer` sends `dir: one.dir` (`src/lib/server/files/fs.ts:419`). `WorkspaceFolder.dir` is documented as "The path with a leading `~` expanded" (`src/lib/server/files/workspace/folders.ts`, the field's doc comment), and `path` holds the written form. The defect was the root key alone.
  - Failure scenario: a reader of the brief or the code adds `~` handling on the client that the answer never needs.
  - Verdict: none (item 4 holds).

## 2. Proof

none

## 3. Standards

- `src/lib/state/forms/referrers.ts:20`: "import { titleOf } from '../system/config/rows.ts';".
  - What is wrong: the folder order of the state layer (`tests/checks/imports/order.ts`: `state/system` above `state/forms`), enforced by `tests/checks/imports/order.test.ts`, is broken. Verify 1 is red on exactly this line, as rerun above.
  - The generated `docs/diagrams/layer-state.dot` carries the upward edge `"folder state/forms to folder state/system" [label="1"...]`. It goes away once the import is fixed and `npm run diagrams` runs again.
  - The fix the report names moves `titleOf` and its private `wordOf` out of `src/lib/state/system/config/rows.ts` to a folder at or below `state/forms`, and changes the imports in `rows.ts`, `src/lib/state/system/config/other-rows/app-rows.ts` and `referrers.ts`. All three are outside the write list, so the path list has to be widened.
  - Failure scenario: landing as built puts a red tree check on main, and the item 3 label cannot land.
  - Verdict: item 3 violated, C3 partial.
- `src/lib/data/model/machine/model-machine.ts:304-308`: "and the page says the sentence the catalog holds for it (state/shared/answers/terminal-words.ts); an engine's own text (tmux's, a validator's) never reaches the page."
  - What is wrong: the rules file ("What every package obeys", the rule on a name changed or a behaviour changed) says a sentence in a head comment that the change makes false is a defect of the change. After item 5, tmux's first line reaches the page inside `refused_terminal_not_started_cause`. The file is outside the write list, and the report names it NOT DONE.
  - Failure scenario: a maintainer reads `TERMINAL_REFUSALS`' doc comment, believes no tmux text ever reaches the page, and adds a name that carries raw engine text, or removes the quoting `refusal.ts` now does.
  - Verdict: none (item 5's named comments are true).
- `.scratch/migration/agents/reviews/O169-report.md`, "The cases' first run": "Each case-run program lives in the scratchpad (`.../scratchpad/cases/`)".
  - What is wrong: the rules file ("What every package obeys", the case-run program rule) and the brief's "Cases" require each case-run program to have its source quoted in the report. No source is quoted, and the path is elided.
  - Failure scenario: a reviewer or orchestrator in another session, or after the scratchpad is cleared, cannot rerun C1, C2, C3, C4 or C5. This review could rerun them only because it shares the builder's session scratchpad.
  - Verdict: none.
- Report, "DONE / NOT DONE", the "Verify-list runs" paragraph: "Verify-list runs: three. The first was stopped before it finished, because a rename (`failedWords` to `tmuxFailureWords`) followed it."
  - What is wrong: the rules file's "Token discipline" allows one run after the last change, and one more after a red line in a changed file. A run started before the last change is "a run of the list beyond what this paragraph allows" and is named there as a finding of the review.
  - Failure scenario: one extra list of about 3 to 5 minutes, run while up to six steps' suites share the machine.
  - Verdict: none.
- `src/lib/state/system/machine/lsp/clangd/cpp-form.ts:608`: "type ServedFolder = { key: string; dir: string; real?: string };".
  - What is wrong: the rules file ("The principles every package is judged on", reuse before writing a helper, type or schema, with the grep quoted) asks for reuse. `FsRoot` (`src/lib/state/sources/explorer/view/place.ts:58-72`, reachable from `state/system` under the folder order) already declares these three fields with these meanings, and the report's "Greps" section quotes no grep for the new type.
  - Failure scenario: `FsRoot`'s `real` or `dir` changes meaning or type, and `cppRepo` keeps compiling against its own copy while it reads the wrong field.
  - Verdict: none.
- `src/lib/ui/controls/confirm/Confirm.svelte:17-19`: "a select of ui/forms/choice/Select.svelte, so the choices read as one question and not as one button each".
  - What is wrong: the rules file's prose rule ("The working rules that bind every package", Prose) bans the negation-contrast construction and asks for the thing to be stated directly.
  - Failure scenario: the comment carries the tell the prose rule exists to keep out, and a writing review flags it at landing.
  - Verdict: none.

## 4. Behaviour

- `src/lib/ui/controls/confirm/Confirm.svelte:85-89` with `SubmitBox.svelte:33-46`: "onopen={() => (focus === 'cancel' || refused ? no : yes)?.focus()}" and "{#snippet pick()} <Select ...".
  - What is wrong: the Submit box opens with Submit off whenever no cluster is picked, so the keyboard starts on Cancel. The cluster choice is now a select drawn before Cancel, reached with Shift+Tab. Before, the cluster buttons sat between Cancel and Submit, reached with Tab.
  - The tab order is now select, Cancel, Submit, where it was Cancel, cluster buttons, Submit. The report's "User-visible changes" row for the Submit Job box names no focus or tab-stop change. The rules file (the look rule) counts focus and tab stops as visible.
  - Failure scenario: a keyboard reader opens the box, presses Tab from Cancel expecting the clusters, lands on Submit (disabled) and then wraps. The look checks only what the report tells it to look for.
  - Verdict: none.

## Declined to judge

- Every drawn result is owed to the look at landing on the scratch server, since a page is outside what a read and a rerun can show here:
  - the Submit box's select (two clusters with the second picked, no pick with Submit off, the blank choice gone after a pick, the focus at open);
  - the delete ask and the "Named by" tag reading "Slurm: Resource";
  - the palette's compile database rows with Add and Edit, and the missing-folder line;
  - the terminal bar's "The terminal did not start: ..." line;
  - Live HPC's host lines, and the grey resolution line hidden or kept in both states;
  - the Settings scope bar offering Repository;
  - the explorer's make menu change the report states;
  - the status bar's fetch tip.
- Whether a failed `ssh -G` resolution ever says something the error box does not. The brief's Decision 4 ("drops the grey line only when it repeats the box's cause") and item 7's text ("while the error box is drawn and the resolution failed, the grey line is not drawn") differ. The diff follows item 7, and the report states the gap as a limitation. Settling whether information is lost needs a poll against a real cluster, which no run here may make.
- Real tmux's stderr wording for a socket path over the limit. No real tmux runs in a review. c5 stubs the text.
- `fork` added to the start actions beyond the brief's seven (judgment call 4), and the `compose` action answering "did not start" for a tmux failure of the keys typed after `startTerminal` succeeded (`routes.ts:316`). Both follow the item's rule literally, and whether either is wanted is the orchestrator's call.
- Whether G32 (`referrersOf`), G38 (`task-start.ts`) or G109 (the folder shape of `fs-transport.ts`) need a row for the outcomes this step adds. The brief rules that no test is written, the report names the entries, and only the orchestrator or the user can rule on a new row under the test rule.

Reviewer usage: ae4637ee51aa87981, claude-opus-5-5, 247221 tokens, 84 tool uses, 14.9 min.

## Repair round 1, refuted

```
$ pgrep -fl 'vitest|svelte-check'   (before the first run: O167's verify list was running, so the related files ran alone first)
$ prettier --check over the 28 changed non-diagram files
All matched files use Prettier code style!
$ eslint --no-warn-ignored over the changed src files
eslint exit 0
$ npx vitest run tests/checks/source tests/checks/tree tests/checks/imports tests/checks/diagrams --testTimeout 0 --hookTimeout 0 --reporter=dot
 Test Files  14 passed (14)
      Tests  155 passed (155)
$ pgrep -fl 'vitest|svelte-check' | wc -l   (later)
       0
$ npm run diagrams
diagrams exit 0   (md5 of docs/diagrams/* before and after: 485fe5fbc53aaf6d352bc9a879d12e98 both)
$ TMPDIR=<scratchpad> npm run test:quick -- --base 32585f1f1
ok      prettier, ASCII gate, svelte-kit sync, eslint
ok      svelte-check (13.0 s): 589 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (139.0 s)
ok      vitest checks (156.7 s)
FAILED  vitest slow (400.6 s)
 Test Files  6 failed | 41 passed (47)
      Tests  15 failed | 406 passed | 246 skipped (667)
(every failure comes from the scratchpad TMPDIR the review must use, in files the step does not change: agent-pane, pane-screen, sessions, apps/tools/tasks, terminals-tmux, "error connecting to <scratchpad>/.../server.sock (File name too long)" or the time limits behind it; tests/routes/edit/roots.test.ts, the scratchpad path holds the word "claude". The builder's time-limit failures in website-files, zenodo and hub-portfolio did not come back.)
Verify 2: the ASCII gate over the 31 changed paths plus the report: ascii exit 0 (printed nothing)
Verify 3: npx vitest run tests/routes/sessions/terminal-actions.test.ts: Tests 38 passed (38)
Verify 4: sh utils/unused-exports.sh against .agents/worktrees/O169-base/unused-exports.txt: diff exit 0 (no line added)
$ node utils/outside-paths.mjs .scratch/migration/agents/briefs/O169.md 32585f1f1
.scratch/migration/agents/briefs/O169-round1.md, the eight docs/diagrams layer files, src/lib/data/model/machine/model-machine.ts, src/lib/state/shared/words/key-titles.ts, src/lib/state/system/config/other-rows/app-rows.ts, src/lib/state/system/config/rows.ts, src/lib/views/sources/source/actions/submit-job.svelte.ts
(the round file is the orchestrator's; the diagrams are the brief's glob entry; the four src files are on the round's list; key-titles.ts is ruling 1's departure)
$ sh utils/folder-check.sh: exit 0; ls src/lib/data/helpers | wc -l: 10; src/lib/state/shared/words: 10 items, 9 at the base
Commands the round's report quotes, rerun: the layer-state.dot grep, the titleOf/wordOf grep over docs and README, the ServedFolder grep and the "and not as" grep each exit 1; the eleven files' line counts equal the report's table; the six case-run sources compare equal to their files; c1 to c5 give the outputs the report quotes; c5 over the base copy gives terminal-ended for both C9 rows.
$ npx vitest run <website-files, zenodo, hub-portfolio, workspace-projects, clone-after>: 3 to 7 time-limit failures in hub-portfolio's slow-tagged cases under 5000 ms; with --tagsFilter slow --testTimeout 20000: Tests 16 passed (16). No decision rests on it.
$ the 18 related test files: 17 passed, agent-pane's real-tmux cases fail on the scratchpad socket path; the 28 unit files importing a changed module: 25 passed, agent-pane, pane-screen and sessions fail on the scratchpad socket path.
```

### Verdicts

- Items 1 to 8: hold (1 by the c1 run and `sameTask`; 2 by c2; 3 by the folder-order check, layer-state.dot and c3; 4 by c4 and c4-server; 5 by c5, terminal-actions 38/38 and C9; 6 by the c6 grep; 7 and 8 by reading). Drawn results are owed to the look.
- C1 to C8: met (C3, C7 and C8 by reading for what only a page shows, owed to the look). C9 (round): met; the base copy answers terminal-ended for both rows.
- Rulings 1 to 9: hold. Ruling 1's place is where the concern lives (state/shared/words holds the small conversions to words the state layer and the views share, is last in the state order, so state/system and state/forms may import it; folder-check exits 0; the folder now holds ten items). Ruling 2's comment is rewritten but not wholly true (Standards 2). Ruling 7's `options.refresh?.()` moved into `finally`, which is right since the terminal exists.
- No finding was closed by removing a check: `git diff 32585f1f1 --stat -- tests` is empty.

### Findings

- Spec: none.
- Proof: none. The run-alone command's "124 passed" did not reproduce (time limits in hub-portfolio's slow cases under 5000 ms), in a file the step does not change; no decision rests on it.
- Standards 1. `src/lib/server/machine/pty/refusal.ts:11-13`: "// there: a terminal tmux no longer has has ended, and any other failure is the terminal's own. The / // page says the sentence the catalog / // holds for the word (state/shared/answers/terminal-words.ts)."; what is wrong: the rewritten head comment is not rewrapped as a paragraph at 100 columns, so line 12 ends short inside a sentence (rules file, comment wrapping); failure scenario: a reader meets a broken line in the middle of a sentence; verdict: none.
- Standards 2. `src/lib/data/model/machine/model-machine.ts:305-308`: "the page says the sentence the catalog holds for each name ... For `terminal-not-started` that sentence carries the first line of tmux's own error as its cause, the one name the server sends with it;"; what is wrong: the catalog holds one sentence per word, filled with the names (`terminalSentence`, terminal-words.ts:35-38), not one per name; and `terminal-not-started` carries tmux's line only when a failed tmux call raised it, since sessions.ts:662 and apps/tools/run/tasks.ts:532 throw it with no name and `refusalFor` sends `[]` for an empty `said` (refusal.ts:101); failure scenario: a maintainer reads one catalog sentence per name, or adds a thrower of `terminal-not-started` believing its one name is always tmux's line; verdict: none (item 5 holds).
- Behaviour: none.

### Declined to judge

- Every drawn result, owed to the look: the Submit box (the select, no pick with Submit off, a one-cluster box opening chosen, the keyboard on the select with two clusters and no pick, on Cancel with one picked); the delete ask and the "Named by" tag reading "Slurm: Resource"; the palette's compile database rows and missing-folder line; the terminal bar's "The terminal did not start: ..." line; Live HPC's host lines and the grey resolution line; the Settings scope bar offering Repository; the explorer's make menu; the status bar's fetch tip.
- agent-pane, pane-screen, sessions, apps/tools/tasks, terminals-tmux and routes/edit/roots tests could not run green under the review's TMPDIR (socket path limit; the word "claude" in the path); none is a file the step changes, and the base was not run for comparison.
- Real tmux's wording when a composed terminal's typed prompt fails, and for a socket path too long; c5 stubs the runner.
- Git commands beyond the three allowed: none run by hand.

Reviewer usage: a577595af5f86cb89, claude-opus-5-5, 219573 tokens, 65 tool uses, 24.2 min.

## Closed (the orchestrator's disposition of every finding above, appended before /land)

- First run, Spec, `SubmitBox.svelte:47` with `submit-job.svelte.ts:198-206` (one cluster not chosen): closed in the round, ruling 3, `submit-job.svelte.ts:207-209`; c3 "one cluster, no server pick" picks utwente with Submit on.
- First run, Spec, `Confirm.svelte:59-60, 101-105` (the select a caller's snippet): closed in the round, ruling 4, the snippet shape stands by the folder order and Confirm's head comment names it (`Confirm.svelte:17-21`).
- First run, Standards, `referrers.ts:20` (the folder order): closed in the round, ruling 1, `titleOf` and `wordOf` in `src/lib/state/shared/words/key-titles.ts`, not the ruled `src/lib/data/helpers/key-titles.ts`, since that folder holds ten items; the new place is where the concern lives (round review, ruling 1); folder-check exits 0 and the upward edge is gone from layer-state.dot.
- First run, Standards, `model-machine.ts:304-308` (a false comment): closed in the round, ruling 2; its remaining defect is round Standards 2, fixed at landing.
- First run, Standards, the report's case-run programs not quoted: closed in the round, ruling 9; the six sources compare equal to their files.
- First run, Standards, `cpp-form.ts:608` (`ServedFolder`): closed in the round, ruling 8, `Pick<FsRoot, 'key' | 'dir' | 'real'>`; the ServedFolder grep exits 1.
- First run, Standards, `Confirm.svelte:17-19` (a negation contrast): closed in the round, ruling 5; the "and not as" grep exits 1.
- First run, Behaviour, `Confirm.svelte:85-89` with `SubmitBox.svelte:33-46` (focus and tab order): closed in the round, ruling 6, `focus` takes `pick` and SubmitBox passes it with no cluster picked; the focus itself is checked at the look.
- First run, Declined to judge, `routes.ts:316` (a failure after a composed terminal started): closed in the round, ruling 7, `heldRefusal`; C9 answers terminal-failed or terminal-ended, the base copy terminal-ended for both.
- Round 1, Standards 1, `refusal.ts:11-13`: fixed at landing, the head comment's paragraph rewrapped at 100 columns with its words unchanged.
- Round 1, Standards 2, `model-machine.ts:305-308`: fixed at landing, the comment says the catalog holds one sentence per word, filled with the names it is about, and that `terminal-not-started` carries the first line of tmux's own error as its one name when a failed tmux call raised it, and no name otherwise.