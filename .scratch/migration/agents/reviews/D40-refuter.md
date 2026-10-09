# Step D40 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D40, base 9fd6c6eac)

Summary: four Behaviour defects and one Spec defect in the folder Fix All, the plan route and the words, plus Proof and Standards gaps. All of them are listed below with the item or case each one makes violated, partial or unmet.

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number. A finding in code keeps its `file:line`.

## Verification (rerun by the reviewer)

All commands were run from `tools/oculus` in the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, in the foreground.

```
$ npm run test:quick -- --base 9fd6c6eac          (exit 0)
test:quick: 79 changed file(s), from git since 9fd6c6eac
test:quick: 124 test file(s), 10 essential
        tests/routes/replace/writing-fix.test.ts: changed
        tests/server/machine/runs/lint/writing.test.ts: changed
ok      prettier (0.3 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      eslint (1.3 s)
ok      svelte-kit sync (1.6 s)
ok      svelte-check (5.0 s): 1791511140788 COMPLETED 440 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (28.5 s): Duration  25.41s (transform 25.55s, setup 0ms, import 41.36s, tests 58.23s, environment 281ms)
test:quick: 28.9 s (limit 45.0 s); every command passed
(an earlier run of the same command printed "test:quick: 51.9 s (limit 45.0 s); every command passed" and "over the time limit"; the time depends on machine load)

$ npx vitest run <file>   (each file alone)
lint-route.test.ts 10 passed | eslint-trust.test.ts 5 passed | lsp-edit.test.ts 8 passed
config.test.ts 31 passed | config-folder.test.ts 25 passed | settings.test.ts 73 passed
keys.test.ts 8 passed | writing.test.ts 12 passed | writing-fix.test.ts 12 passed
tests/checks/diagrams/diagrams.test.ts --testTimeout 0 --hookTimeout 0: 46 passed

$ npx vitest run <the two new files> in /private/tmp/claude-502/d40-builder/unchanged
  (its src/ is identical to D40-base: diff -rq printed nothing; both test files identical to the worktree's: cmp)
writing.test.ts: Failed Tests 12; AssertionError: expected { status: 400, ok: false } to deeply equal { status: 200, ok: true } at writing.test.ts:112:22; TypeError ... (reading 'close') at :37:52
writing-fix.test.ts: Failed Tests 12; AssertionError: expected 400 to be 200 at writing-fix.test.ts:82:31

$ npm run build                                    (build exit 0; only gitignored output written)
  ... and 1 more
See https://rolldown.rs/reference/InputOptions.checks#plugintimings for more details.
$ grep -rl "comment-worker" .svelte-kit/output build   -> no line
$ grep -n region .svelte-kit/output/server/chunks/comments.js -> regions lsp/choices.ts and writing/comments.ts
  (src/server.ts imports createServerContext from source, and comments.ts finds the worker through ownFolder(), as eslint.ts finds eslint-child.mjs)

ASCII gate perl over src tests config: 0 lines | LC_ALL=C grep over DESIGN.md HELP.md and the changed docs: 0 lines
sh utils/folder-check.sh: exit 0 | YAML safe_load over the five catalogs: exit 0
sh utils/unused-exports.sh: 364 lines, identical to the base list
grep -rn "Exclude<LintId, 'eslint'>" src: exit 1 (no line)
wc -l: ops.ts 858, settings.ts 858, model-machine.ts 786, markdown.ts 457, Tree.svelte 442; lint/writing/ holds 9 files

$ node /private/tmp/claude-502/d40-builder/final/cases.mjs   (exit 0; read first, it writes nothing)
diff against the builder's cases.out: IDENTICAL

case 41 (case41-final.mjs): {"found":2037,"checked":2028,"skipped":9,"marks":297,"markFiles":18,"wrapped":1074,"wrapFiles":208,"unplaced":0,"failed":0}
case 42: orchestrator-history.md 153 / 125.9 ms (report 143.1 / 121.1)
case 42 page.py (in memory, em dash planted on the last line): call 1 180 ms, call 2 83.6 ms, rows 995:em-dash, 10 ms timer ticks 15 and 6, worst lateness 2 ms; stats {"started":1,"loaded":["python"]}
case 25 (final/case25.mjs): no banned character {"ok":true,"rows":[]} worker stats {"started":0,"loaded":[]}; with a dash: rows 1, {"started":1,"loaded":["typescript"]}
case 44/45 (probe/case44.mjs): 44a started 1, loaded python and typescript once; 44b grammar failure with its reason, next request true; 44c superseded and already aborted -> stopped; 44d after close -> closed; 45a {"ok":true,"ranges":[],"cut":1}; 45b timeout, next answered, started 2

history-words grep over the added comment lines and test titles (3255 added lines): every hit is positional ("before any edit", "before a save", "before the thread is ended", "how many were written before it", the `before` field) or a guarded id (G1, G2, G3, G9, G71) in a test title. No history wording.

case 40: LINT_IDS line 634 holds 'writing' once; behavior.yml lint keys writing (193), writing_skip (198), writing_glyphs (213), each once; options.yml lint.writing 724, lint.writing_skip 757, lint.writing_glyphs 779, each once; config.test.ts 472-474; "lint-writing" in src: no line; 'writing-fix' at ops.ts:238 (shape) and file-ops.ts:183 and 347.
```

Reviewer probes (no file in the worktree touched; fixtures in my scratchpad, removed afterwards):

```
planFolder on a hub fixture with secrets/a.md and secrets/deep/b.yml, each holding an ellipsis:
folder "" -> [["docs/c.md",1,1]]
folder "secrets" -> [["secrets/a.md",1,1]]
folder "secrets/deep" -> [["secrets/deep/b.yml",1,1]]

planFolder on docs/ with a.md readable and b.md chmod 000:
planFolder threw: EACCES EACCES: permission denied, open '.../lockprobe/hub/docs/b.md'

planFolder on tools/oculus/config/catalogs (the worktree, default settings):
[["tools/oculus/config/catalogs/unimath.yml",0,"The file is too large to change here"]]
unimath ellipsis/dash count 0

YAML at a line start: "first\n<U+2026>continued\n" -> suggestion only; "k: first\n  <U+2026> continued\n" -> fix;
"<U+2026>\n", "a: 1\n<U+2026>\nb: 2\n", "- x\n<U+2026>\n" -> suggestion only
reparse: k: 'it''s' -> {"k":"it's"}; k: "say \"hi\"" -> {"k":"say \"hi\""}; k: first / ...continued -> {"k":"first ...continued"}

YAML reader cost (in process): 6000 lines, 160890 bytes, 12000 rows -> 631 ms; 8000 lines, 122890 bytes, half the quote fixes failing the reparse -> 1023 ms
```

## Verdicts

Items of the brief's "What to build":

- 1: holds. The branch is at `routes.ts:416-422`. A failure answers `failed` with a reason, and `ProcessLinter` is unchanged (`linters.ts:25`). The added `if (held.signal.aborted)` at `routes.ts:431` now applies to every linter. The page drops a superseded answer by its counter (`lint.svelte.ts:143`), so nothing visible changes. The report does not mention this change.
- 2: holds, with Standards findings S3 and S4. The folder holds 9 files. The context makes the comment thread at `context.ts:277` and closes it at `:579`, and `+server.ts:30-32` passes it. My reruns of 44 and 45 show one worker for two languages, `closed` after close, and a new worker after a timeout.
- 3: holds (`model-machine.ts:649` on; `comments.ts` maps `.tsx` to `tsx` and `.jsx` to `jsx`).
- 4: holds (cases 11-15, 21-27, 34, 48, 49 as rerun).
- 5: holds (cases 1-10, 28-31, 46; case 41 gives 0 unplaced).
- 6: holds (cases 16-19, 26, 27, 33, 37, 47). `globTest` is in `data/helpers/search/glob.ts`, and `problem-rows.ts:13` imports it through the `state/` re-export.
- 7: holds (`settings.ts:553-579`; settings.test.ts passes 73).
- 8: holds (`lint-fixes.ts:237`).
- 9: holds (`problem-sources.ts:35`).
- 10: holds by reading. `writing` never answers `not_found`, and `keys.test.ts` leaves `writing` out with `eslint`. The status item on screen is the look's.
- 11: violated, Spec S1 (the join's title).
- 12: violated, Standards S2 (the `lsp-edit.ts` head comment is left untrue; the report calls it kept true).
- 13: violated, Standards S5 and S6 (one test outside G71's text; three route tests no guarded entry names in the Doc text).
- 14: violated, Behaviour B1, B2 and B3, and Proof P1 for case 51.

Cases of the brief's "Cases":

- 1-12: met, cases.mjs rerun, identical output. 1: off, then with `[]` one row over 7-9. 6: the join is a `fix`. 12: three arrow rows, each with `->` and ` to `, as the cases ruling says.
- 13: met for the route half (two `curly-quote` fixes to `'`). The page half is not verifiable here; the look settles it.
- 14: met.
- 15: met for the route half (spaced, three suggestions, Fix All changes nothing). The page half is not verifiable here.
- 16-18: met.
- 19: met. 0 rows; with glyphs `[]`, one `arrow` row with no fix. The worker is skipped by `endOfLastBanned(text, arrows=false)`, which answers 0 (`writing.ts:59-65`, `:80-81`).
- 20: met, two spaced `en-dash` rows on line 95 with suggestions, as ruled.
- 21: met for the route half (2 rows; Fix All changes only `/* e... */`) and by G71's test. The squiggles on screen are not verifiable here.
- 22, 22b, 23, 24: met (cases.mjs and writing.test.ts).
- 25: met (`started: 0`).
- 26, 27, 28, 29: met.
- 30: met for the route half (nbsp fix and join touch; the result is `abc  def`). The page half is not verifiable here.
- 31-35: met.
- 36: met for the route half: `off`, and `row-menu.ts` disables the item while `lint.writing` is off. The greyed item on screen is not verifiable here.
- 37: met (37a marked, 37b and 37c `off`).
- 38: met by reading: `routes.ts` refuses with 400 `not_taken`, and `.json` is not in `LINT_EXTENSIONS.writing`. The script's "0 row(s)" line ran the reader, not the route.
- 39: not verifiable here. `fresh()` is unchanged; the look settles it.
- 40: met (greps above).
- 41: met (rerun counts equal the brief's).
- 42: met (rerun above; the event loop stays free with 2 ms lateness).
- 43, 44, 45, 46, 47: met.
- 48: met by my reruns: escapes `''` and `\"`, the reparses above, and a column-0 continuation gives a suggestion only. Proof P2: the report's own 48c shows a fix and says the opposite, and no reparse is quoted.
- 49: met.
- 50: met (writing-fix.test.ts:65 and :93). The test never plans from inside `secrets`; see B1.
- 51: unmet, Proof P1.
- 52: met for the route half (writing-fix.test.ts:128). "No dialog opens" is not verifiable here.
- 53: partial. "Not in the POST and not written" is met by writing-fix.test.ts:162 and `fixing.svelte.ts:58-70`. The unticked and disabled unsaved row and the button text are met by reading (`fixing.svelte.ts:82-84`, `WritingFixDialog.svelte:30-31`, files.yml `writing_fix_button: Fix {0} Files`). The drawn dialog is not verifiable here.
- 54: met (writing-fix.test.ts:140, :162).
- 55: met (writing-fix.test.ts:191, :202, :233, :261, :284).

## 1. Spec

- S1. `config/text/views/sources/source.yml:38`: `writing_fix_join: 'Join the lines into one'`.
  - What is wrong: item 11 dictates the join's fix title as `Join the paragraph's lines`. The builder used other words and did not report the change. The title appears in the lightbulb, in Quick Fix and in every join row (cases.out shows `fix "Join the lines into one"`).
  - Failure scenario: at the look, the orchestrator checks the lightbulb against the brief's title and finds different words that no report line explains.
  - Verdict: item 11 violated.

## 2. Proof

- P1. Case 51 has no run. See `tests/routes/replace/writing-fix.test.ts:7-10` ("the plan's own check of a result that fails to parse, which no file the reader accepts can reach") and the report's "Anything in the brief that was wrong or impossible" ("Case 51 cannot be built as a fixture").
  - What is wrong: the claim that the branch cannot be reached is not demonstrated, and `checkedResult` (`folder.ts:96-115`) has never run on a failing input. That branch is what turns a failed reparse into a disabled row. It can be exercised without a new test: run a probe that calls the check with a crafted text and edits (export it, or reach it through a scratch import), or show by a quoted run that the reader's checks (`sameValue`, `shapeOfText`) and the plan's check are the same predicate over the same edits.
  - Decision resting on it: whether the folder write can ever receive a file whose fixes break its structure.
  - Failure scenario: a YAML file whose first-fix-per-row subset differs from the set `yaml.ts` validated reaches the check. If that check has a defect, the file is offered ticked.
  - Verdict: case 51 unmet.
- P2. The report's "Judgment calls the brief left open", the YAML bullet: "A plain scalar continued on a line that starts with an ellipsis, and an ellipsis at the start of a line outside quotes, get no fix (case 48)."
  - What is wrong: the report's own case 48c run (`k: first\n  <U+2026>continued`) shows `fix "Replace the ellipsis character with three periods"`. My probe shows a fix for an indented continuation and a suggestion only at column 0. The code is right: the reparse is `{"k":"first ...continued"}`, and only a column-0 `...` is a document end. The report's sentence is wrong, and the fixture it quotes does not test the case's "no fix" half. Case 48's "each fix's reparse is quoted" is also not in the report.
  - Failure scenario: the orchestrator reads that indented continuations get no fix and judges case 48 from a run that shows the opposite.
  - Verdict: case 48 stays met on my reruns.
- P3. The report's "Judgment calls", the worker bullet: "A line over 2000 characters ends the reading there and reports `cut` (case 45); the reason shown is the catalog line `lint.writing_reason_*`."
  - What is wrong: nothing reads `cut`. `writing.ts:80-97` uses only `read.ranges`, and the catalog has no `writing_reason_*` key for a cut line (`source.yml:58-61`: closed, ended, grammar, timeout). No reason is shown for a cut line. The file answers `ok` with the comments after the long line unmarked.
  - Failure scenario: the orchestrator believes the user is told when a minified line stopped the comment reading. The user is not told.
  - Verdict: none (item 2 asks only that the report state it).

## 3. Standards

- S2. `src/lib/server/files/fs/lsp-edit.ts:21`: "Each file is then written once: its copy is kept in the local history first (kind `lsp-edit`),".
  - What is wrong: the copy kind is now the operation's name (`keepCopy(scope.history, one.real, operation)`, and the head's own lines 4-5). The sentence is false for `writing-fix`. Item 12 names this head comment, and the report lists `lsp-edit.ts` under "Head comments read and kept true".
  - Failure scenario: a reader looking for a folder Fix All's copies looks under `lsp-edit` and does not find them.
  - Verdict: item 12 violated.
- S3. `src/lib/server/machine/runs/lint/writing/comments.ts:121`: `stats(): CommentStats {`.
  - What is wrong: no file in `src` or `tests` calls it (`grep -rn "stats()" src tests` finds only an unrelated comment in `Stats.svelte`). Only the builder's scratch probes `case42.mjs` and `case44.mjs` call it. This breaks the rules file, "The principles every package is judged on" (YAGNI; nothing built for a need the plan does not name). `unused-exports.sh` does not see methods, so the check did not flag it.
  - Failure scenario: the method stays in the source as an API that only a deleted scratch folder uses.
  - Verdict: item 2 holds; this is a defect of form.
- S4. `src/lib/server/machine/runs/lint/writing/comments.ts:74-78` and `:185`: `{ ok: true; ranges: CommentRange[]; cut: number }`.
  - What is wrong: `cut` is carried from the worker to the client and dropped (`writing.ts:80-97`). Under the same principle it is unused data. Either it reaches a reason (see P3) or it goes.
  - Failure scenario: as P3.
  - Verdict: none.
- S5. `tests/server/machine/runs/lint/writing.test.ts:227`: `it('marks the curly quotes of a Markdown file and a YAML fix keeps the value (case 13, 48)'`.
  - What is wrong: the rules file, "What every package obeys", says a test exists only as the test of one guarded entry and that "A builder writes no other test". G71's text is about where a mark and its fix fall. This test checks the fix's text and YAML escaping, which G71 does not state. The brief lists G71's test as cases 21-24, 26, 27, 33, 43, 46, 47 (and 22b by ruling). Cases 13 and 48 are run cases, not test cases. The builder's G71 Doc text names this test anyway.
  - Failure scenario: a guarded entry whose test covers a behaviour its text does not state; a later change to the escape form fails G71.
  - Verdict: item 13 violated.
- S6. `tests/routes/replace/writing-fix.test.ts:65` ('lists the files with an automatic fix, each with its hash and count, and no other file'), `:128` ('refuses a folder with 2,001 files the rules take and names the count') and `:284` ('refuses a file whose bytes changed after the plan, and a file named twice, and writes nothing').
  - What is wrong: the report's "Doc text for agents/guarded.md" names, under G1, G2, G3 and G9, every other test of this file, but not these three. The rules file requires each test to be named by file and title under its entry.
  - Failure scenario: after landing, three tests belong to no guarded entry and fail the next audit of `guarded.md`.
  - Verdict: item 13 violated.

## 4. Behaviour

- B1. `src/lib/server/machine/runs/lint/writing/folder.ts:189` (`const taken = filesUnder(folder.real, withheld)...`) with `:136` (`!under(full, withheld)`), and `routes.ts` `folderOf`.
  - What is wrong: the withheld folders are checked only for subfolders the walk meets. Neither the route nor the plan checks the folder the walk starts at. My probe planned `secrets` and `secrets/deep` and the plan read and answered `secrets/a.md` and `secrets/deep/b.yml`, each with a count and edits. Item 14 says the walk never enters the hub's `secrets` folder or `~/.oculus`. The Files view does not hide `secrets` (no `privateFolders` use under `views/` or the tree), so the menu item is offered on that row. The write refuses these files as `outside`, so nothing is written. Their text is still read by the server, and their names and fix positions are sent to the page.
  - Failure scenario: the reader picks "Fix All Writing Problems in Folder..." on `secrets`. The dialog lists the secret files ticked. "Fix N Files" then fails `outside` one file at a time.
  - Verdict: item 14 violated.
- B2. `folder.ts:158-161`: `if (statSync(real).size > SAVE_MAX_BYTES) {...} const bytes = readFileSync(real);`.
  - What is wrong: no try/catch, and `folder()` in `routes.ts` has `try/finally` with no catch. One unreadable file under the folder (mode 000), or one removed between the walk and the read, makes `planFolder` throw. My probe: `planFolder threw: EACCES`. The whole plan fails with a server error, with no per-file reason, where item 14 lists a file the plan could not take as disabled with its reason.
  - Failure scenario: a folder holding one locked file can never be planned; the dialog shows the generic failure sentence.
  - Verdict: item 14 violated.
- B3. `folder.ts:158-160`: the size refusal comes before the file is read.
  - What is wrong: every taken file over 256 KiB (`SAVE_MAX_BYTES`, `history.ts:47`) is answered as a refused row with `count: 0`, whether or not it holds a fix. Item 14 says files with no fix are left out of the answer. My probe on `tools/oculus/config/catalogs` answered `unimath.yml` (273835 bytes, 0 banned characters) as `"The file is too large to change here"`.
  - Failure scenario: a folder Fix All on the hub root or on `tools/oculus` shows a disabled `unimath.yml` row that has nothing to fix.
  - Verdict: item 14 violated.

## Declined to judge

- The page halves of cases 13, 15, 21, 30, 36, 39, 52 and 53 and the dialog as drawn. A read and a rerun cannot show what is drawn; the look at landing settles it.
- `npm run diagrams`. I did not run it because it writes tracked files. `tests/checks/diagrams/diagrams.test.ts` passes (46), which says the committed diagrams match the tree.
- The hand merge with D39 (the report's "Landing after D39", in `lsp-edit.ts` and `ops.ts`). D39 is not on this base, so the merge cannot be checked here.
- Whether about 1 s of event-loop hold on a pathological 123 KB YAML (my probe above) is acceptable for a tab's lint, which runs the YAML reader in the route's process. This is a design call against decision 4. Real hub files measured in case 41 and case 42 stay far below it.
- `comment-worker.mjs` holds `highlighter`, `grammars` and `queue` at module level (`:38`, `:41`, `:110`). This is per-thread state in the worker's own module graph, which the rules file's "No globals" does not plainly cover. Two edge cases in it are unmeasured. A rejected `createHighlighter` stays rejected for that worker's life. A throw inside `answer` leaves `queue` rejected, so later requests wait for the 5 s timeout and a new worker. I did not provoke either.

Reviewer usage: agent id see completion notice, claude-opus-5-5, tokens see completion notice, tool uses see completion notice, minutes see completion notice.

## Repair round 1, refuted

Reviewer of D40 (`oculus/migration`) over repair round 1. Worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D40`, base 9fd6c6eac. The round's delta is `diff -ru` of `.agents/worktrees/D40-round0/tools/oculus` against the worktree's `tools/oculus` (node_modules, .svelte-kit, build, .scratch and local.yml excluded). It lists the nine files the builder names, and nothing else changed.

Three findings need a decision before landing:
- **R1-B1:** on this machine's case-insensitive file system, the round's private-folder refusal and the `writing-fix` write's `outside` refusal both let through a path written in another letter case. A file under `secrets/` was planned and then written.
- **R1-B2:** item 5's change removed every size bound on what the folder plan reads. A 20 MB Markdown file held the server's event loop for 405 s and took the process to a 1040 MB peak; round 0 refused the same file in 20 ms.
- **R1-Sp1:** the G3 title the round dictated says the writing rules never read a file under `secrets`. The tab lint reads one.

```
(all from tools/oculus in the worktree, PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH, foreground)

$ npm run test:quick -- --base 9fd6c6eac          (exit 0)
test:quick: 79 changed file(s), from git since 9fd6c6eac
test:quick: 124 test file(s), 10 essential
        tests/routes/replace/writing-fix.test.ts: changed
        tests/server/machine/runs/lint/writing.test.ts: changed
ok      prettier (0.4 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      svelte-kit sync (1.6 s)
ok      eslint (1.4 s)
ok      svelte-check (5.1 s): 1791514193051 COMPLETED 440 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (26.8 s): Duration  23.33s (transform 28.57s, setup 0ms, import 44.04s, tests 47.22s, environment 314ms)
test:quick: 27.2 s (limit 45.0 s); every command passed
(a first run of the same command printed "test:quick: 48.4 s (limit 45.0 s); every command passed" and "test:quick: over the time limit"; the time depends on machine load)

$ sh ~/.claude/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md
checks: 1 commands passed
checks exit 0

$ npx vitest run <file>   (each file alone)
lint-route.test.ts      Tests  10 passed (10)
eslint-trust.test.ts    Tests  5 passed (5)
lsp-edit.test.ts        Tests  8 passed (8)
config.test.ts          Tests  31 passed (31)
config-folder.test.ts   Tests  25 passed (25)
settings.test.ts        Tests  73 passed (73)
keys.test.ts            Tests  8 passed (8)
writing.test.ts         Tests  11 passed (11)
writing-fix.test.ts     Tests  11 passed (11)
tests/checks/diagrams/diagrams.test.ts --testTimeout 0 --hookTimeout 0: Tests  46 passed (46)

$ npx vitest run tests/routes/replace/writing-fix.test.ts   (in the builder's $TMPDIR/d40r1/unchanged: diff -rq of its src and config against D40-round0 prints nothing; its test file is cmp-identical to the worktree's)
     x refuses a start folder that is, or lies under, the hub's secrets folder (G3) 142ms
AssertionError: expected { path: 'secrets', status: 200, ...(1) } to deeply equal { path: 'secrets', status: 200, ...(1) }
-   "ok": false,
+   "ok": true,
      Tests  1 failed | 10 passed (11)

$ npm run build                     build exit 0 (only gitignored output written)
  ... and 1 more
See https://rolldown.rs/reference/InputOptions.checks#plugintimings for more details.
$ grep -rl "comment-worker" .svelte-kit/output build    -> no line (exit 1); .svelte-kit/output/server/chunks/ holds comments.js

ASCII gate perl over src tests config: 0 lines, exit 0
LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md docs/configuration.md docs/files-and-search.md docs/views.md: exit 1 (no line)
sh utils/folder-check.sh: exit 0
sh utils/unused-exports.sh: exit 0, 364 lines, sorted list identical to .agents/worktrees/D40-base/tools/oculus/unused-exports.txt
python3 yaml.safe_load over behavior.yml options.yml source.yml history.yml files.yml: exit 0
grep -rn "Exclude<LintId, 'eslint'>" src: exit 1 (no line); grep -rn "lint-writing\|'writing'\|writing-fix" src: 39 lines
history-words grep over the round's added lines: 3 hits of "before" (lsp-edit.ts "done before it", comment-worker.mjs "found before that line", folder.ts "before any file is listed"), all positional; 1 guarded id (G3) in a test title
wc -l: comment-worker.mjs 114, comments.ts 197, folder.ts 220, lsp-edit.ts 159, source.yml 201, writing-fix.test.ts 289, writing.test.ts 224, files-and-search.md 138, DESIGN.md 579

Commands the round's report quotes, rerun:
$ node plan-probe.mjs   (items 3, 4, 5; builder's $TMPDIR/d40r1)
B1 folder "" -> [["docs/c.md",1,null]]
B1 folder "secrets" -> {"refused":"The writing rules do not read a private folder"}
B1 folder "secrets/deep" -> {"refused":"The writing rules do not read a private folder"}
B2 docs with a.md readable and b.md mode 000 -> [["docs/a.md",1,null],["docs/b.md",0,"The file could not be read"]]
B3 tools/oculus/config/catalogs -> []
B3 a 300 KB file with a fix and one without -> [["with-fix.md",0,"The file is too large to change here"]]
$ OC=$TMPDIR/d40r1/unchanged node plan-probe.mjs   (before)
B1 folder "secrets" -> [["secrets/a.md",1,null]]  | B2 -> planFolder threw: EACCES ...
B3 tools/oculus/config/catalogs -> [["config/catalogs/unimath.yml",0,"The file is too large to change here"]]
B3 a 300 KB file ... -> [["no-fix.md",0,"..."],["with-fix.md",0,"..."]]

$ node checked-probe.mjs   (item 6, case 51; diff -r of its cp1/src against the worktree's src prints only "99c99 < export function checkedResult(")
YAML  k: first -> k: second (value changes)    "The changes would change the value the file holds"
YAML  k: first -> k: "first" (value the same)   null
MD    text -> # text (paragraph becomes heading) "Joining the lines would change how a block is laid out"
MD    a<ellipsis>b -> a...b (same blocks)        null
edit past the end of the text                    "The changes do not apply to the file as it is now"

$ grep -rn 'stats()\|CommentStats\|#loaded\|#started' src tests   (item 7) -> only src/lib/views/boards/projects/Stats.svelte:6 (unrelated comment)
$ grep -rn '\bcut\b' src/lib/server/machine/runs/lint/writing -> comment-worker.mjs:18 "cut back", markdown.ts:3 "cut off"

$ node thread-probe.mjs after <worktree> <worktree>   (items 7, 8; cases 44, 45)
after 44a two languages together: {"ok":true,...} {"ok":true,...}
after 44a worker log: start | load python | load typescript
after 45a a 3000-char line before a comment: {"ok":true,"ranges":[{"from":0,"to":10,"docstring":false}]}
after 44d after close: {"ok":false,"failure":{"kind":"closed"}}
after 44c aborted signal: {"ok":false,"failure":{"kind":"stopped"}}
after 44b unknown grammar: {"ok":false,"failure":{"kind":"grammar","detail":"Language `no-such-language` is not included in this bundle. ..."}}
after 44b next request: {"ok":true,...}
after 45b a request held past the limit: {"ok":false,"failure":{"kind":"timeout"}}
after 45b next request: {"ok":true,...}   | after 45b worker starts: 2
after item 8 a throw inside answer: {"ok":false,"failure":{"kind":"grammar","detail":"text.matchAll is not a function or its return value is not iterable"}}
after item 8 next request: {"ok":true,"ranges":[{"from":0,"to":5,"docstring":false}]}
after item 8 a rejected createHighlighter: {"ok":false,"failure":{"kind":"grammar","detail":"highlighter creation fails"}}
after item 8 next request: {"ok":true,"ranges":[{"from":0,"to":5,"docstring":false}]}
(before, on $TMPDIR/d40r1/unchanged: the throw answered kind "ended"; the request after a rejected createHighlighter answered the same failure again)

$ node final/cases.mjs   -> output identical to the builder's cases.out (diff prints nothing); case 13: two curly-quote rows on 7:362 and 7:398, each fix "'", Fix All changes 1 line
$ node final/case48.mjs  -> 48a k: 'it''s' parses to {"k":"it's"}; 48b k: "say \"hi\"" parses to {"k":"say \"hi\""}; 48c "k: first\n  ...continued" parses to {"k":"first ...continued"}; 48d 1 row, 0 fix edits
$ node y48.mjs (mine)    -> "first\n<U+2026>continued\n" [ellipsis, suggestion]; "<U+2026>continued\n" [suggestion]; "k: first\n  <U+2026>continued\n" [fix]; "a: 1\n<U+2026>\nb: 2\n" [suggestion]
$ QUOTED_OUT=... npx vitest run tests/routes/replace/zz-quoted-runs.test.ts   (builder's $TMPDIR/d40r1/fin; diff -rq of its src against the worktree's prints nothing)   Tests 2 passed
case 52 plan of many/ (2001 files): {"ok":false,"reason":"The folder holds 2001 files the writing rules read, and at most 2000 are read at once; choose a smaller folder"}
case 55 b.md changed after the plan: {"ok":false,"error":"changed","done":[],"failed":"hub/b.md"}   (a.md and b.md unchanged)
case 55 a.md named twice: {"ok":false,"error":"not-an-action"}   (a.md unchanged)
$ node final/case41-final.mjs -> {"found":2037,"checked":2028,"skipped":9,"marks":297,"markFiles":18,"wrapped":1074,"wrapFiles":208,"unplaced":0,"failed":0}
$ node probe/case42.mjs -> orchestrator-history.md 141.1 / 119.6 ms; page.py call 1 214.1 ms, call 2 88.2 ms, rows 995:em-dash, worst lateness 3 ms and 2 ms; worker starts 1
$ node final/case25.mjs -> no banned character: {"ok":true,"rows":[]} worker starts 0; with a dash: rows 1 worker starts 1

Reviewer probes (fixtures under my scratchpad only, removed after each run):
$ node case-secrets.mjs  (POST /api/lint action folder on a fixture hub holding secrets/a.md)
plan "secrets" -> 200 {"ok":false,"reason":"The writing rules do not read a private folder"}
plan "SECRETS" -> 200 {"ok":true,"files":[{"path":"SECRETS/a.md","hash":"928f4d0d...","count":1,"edits":[...]
plan "secrets/../secrets" -> 200 {"ok":false,"reason":"The writing rules do not read a private folder"}
$ node write-secrets.mjs  (the plan, then POST /api/ops writing-fix with its edits)
plan SECRETS -> true [["SECRETS/a.md",1]]
write secrets/a.md -> 400 {"ok":false,"error":"outside","done":[],"failed":"hub/secrets/a.md"} | file now "x<U+2026>\n"
write SECRETS/a.md -> 200 {"ok":true,"paths":["hub/SECRETS/a.md"]} | file now "x...\n"
$ node tab-secrets.mjs  (POST /api/lint action lint, linter writing, on secrets/a.md)
tab lint of secrets/a.md -> 200 {"ok":true,"rows":[{"line":1,"column":2,...,"code":"ellipsis",...
$ node big.mjs  (planFolder over docs/ holding big.md, Markdown "a line ... broken\nacross two lines of text\n\n" repeated, and small.md with one ellipsis)
worktree, 20 MB: plan 405072 ms, timer ticks 1, worst lateness 405057 ms, rss before 188 MB, peak 1040 MB
round 0 copy, 20 MB: plan 20 ms, timer ticks 0, worst lateness 0 ms, rss before 184 MB, peak 186 MB
worktree, 0.25 / 0.5 / 1 / 2 MB: plan 103 / 193 / 597 / 1325 ms, worst lateness 88 / 178 / 582 / 1310 ms, peak 210 / 216 / 310 / 371 MB
buffer.constants.MAX_STRING_LENGTH 536870888
$ node mesen.mjs  (planFolder over a copy of scotoma's tools/mesen/.../Mesen.yml, 33,736,532 bytes, no banned character)
worktree: plan 55 ms, peak rss 263 MB []    | round 0 copy: plan 2 ms, peak 145 MB [["tools/Mesen.yml",0,"The file is too large to change here"]]
worktree, a 20,000-line slice (4,258,258 bytes) + one "# see <U+2026>" line: plan 2734 ms, peak rss 818 MB
$ node queue.mjs  (a raw Worker on the worktree's comment-worker.mjs, sent null, then a valid request)
error event: Cannot read properties of null (reading 'id')
exit 1
(the valid request got no answer)
```

### Verdicts

Items of the brief's "What to build", for the whole diff since 9fd6c6eac:

- 1: holds. The writing branch of `routes.ts` `lint()` is unchanged by the round, and `lint-route.test.ts` passes (10 tests).
- 2: holds. The probes of cases 44 and 45 reproduce, as do item 8's two faults. Finding R1-Sp2 is about how item 8 was built and makes no item violated.
- 3: holds, unchanged by the round. `cases.mjs` output is identical.
- 4: holds. Cases 11 to 15, 21 to 27, 34, 48 and 49 reproduce.
- 5: holds. Cases 1 to 10, 28 to 31 and 46 reproduce, and case 41 gives 0 unplaced.
- 6: holds. Cases 16 to 19, 26, 27, 33, 37 and 47 reproduce.
- 7: holds. `settings.test.ts` passes 73.
- 8: holds. `lint-fixes.ts` is unchanged by the round.
- 9: holds. `problem-sources.ts` is unchanged.
- 10: holds by reading, as round 0 found. The status item on screen is for the look.
- 11: holds. `source.yml:38` reads `writing_fix_join: "Join the paragraph's lines"`, and every join row of `cases.mjs` carries that title.
- 12: violated, Standards R1-S2. The `lsp-edit.ts` head comment is now true.
- 13: violated, Spec R1-Sp1 (the G3 title against the tab lint and against R1-B1). Every test left in the two files is named under an entry in the Doc text.
- 14: violated, Behaviour R1-B1 (both private-folder refusals compare letter case). Behaviour R1-B2 (the unbounded read) stands beside it.

Cases of the brief's "Cases":

- 1 to 12: met. `cases.mjs` rerun, output identical, every join titled "Join the paragraph's lines".
- 13: met for the route half (two `curly-quote` fixes to `'`, Fix All changes the one line). The page half is not verifiable here; the look settles it.
- 14: met.
- 15: met for the route half. The page half is not verifiable here.
- 16 to 20: met.
- 21: met for the route half and by G71's test. The squiggles are not verifiable here.
- 22, 22b, 23, 24: met (`cases.mjs`, `writing.test.ts`).
- 25: met (`worker starts 0`).
- 26 to 29: met.
- 30: met for the route half. The page half is not verifiable here.
- 31 to 35: met.
- 36: met for the route half. The greyed menu item is not verifiable here.
- 37: met.
- 38: met by reading, unchanged since round 0.
- 39: not verifiable here. `fresh()` is unchanged; the look settles it.
- 40: met. The keys `writing_folder_private` and `writing_folder_unread` are each once in `source.yml`, and `keys.test.ts` passes.
- 41, 42: met (rerun above).
- 43, 44, 45, 46, 47: met.
- 48: met. The escapes and reparses are as above. A continuation at column 0 and a line-start ellipsis at column 0 get a suggestion only; an indented continuation gets the fix.
- 49: met.
- 50: met. G3's row 'lists the files with an automatic fix...' passes, and a walk from the root never enters `secrets`, whatever letter case the request uses.
- 51: met, by the reparse probe above.
- 52: met for the route half (the quoted run reproduces). "No dialog opens" is not verifiable here.
- 53: met for the store half. `fixing.svelte.ts` and the views and state files are unchanged since round 0: `diff -ru` against round 0 lists only the nine files. I did not rerun the builder's scratch test for it. The drawn dialog is not verifiable here.
- 54: met (the two G9 rows pass).
- 55: partial, Behaviour R1-B1. The refusal rows with the folder spelled as on disk pass, and the `changed` and named-twice runs reproduce. A file under `secrets/` named as `SECRETS/a.md` is written.

### Findings

- **R1-B1 (Behaviour).**
  - Where: `src/lib/server/machine/runs/lint/writing/folder.ts:197` (`if (under(folder.real, withheld)) {`), and `src/lib/server/files/fs/lsp-edit.ts:71-74` with `ops.ts:745` (`isPrivate: (real) => inFolders(real, privateFolders(into.hub ?? null, homedir()))`).
  - What is wrong: `resolveRootPath` returns the path through `realpathSync`, which keeps the request's letter case. `under` (`server/core/paths.ts:38-45`) resolves only the folder side with the operating system's own resolution (`realPath(folder, true)`), so `.../hub/SECRETS` is not inside `.../hub/secrets`. On this machine's case-insensitive file system, my probe planned `SECRETS` and got `secrets/a.md` back as `SECRETS/a.md` with its hash and edits. The write of `SECRETS/a.md` then answered `{"ok":true}` and changed the file under the hub's secrets folder. Spelled `secrets/a.md`, the same write is refused as `outside`.
  - What the brief asks: item 14 refuses, as `outside`, a file in a private folder. Round item 3 refuses a start folder that is, or lies under, one. The widened G3 says no such file is read or written by the writing rules.
  - Main's D39 check, which the report's merge plan keeps for both operations, is the same call (`main lsp-edit.ts:70`: `under(found.path, scope.withheld)`), so the bypass survives the merge. I read that line; I did not run it on main.
  - Failure scenario: a request carrying the page's token that names `SECRETS/x.md` (from a script, or any client that does not take the tree's spelling) reads and rewrites a file under `secrets/`. The Files view itself sends the spelling it lists, so the page alone does not produce such a request.
  - Verdict: item 14 violated, case 55 partial.

- **R1-B2 (Behaviour).** Item 5's change reads every file under the folder, of any size, into memory and runs the reader in the route's process.
  - Where: `folder.ts:161-174`, from `let bytes: Buffer; try { bytes = readFileSync(real); } catch {...}` through `if (bytes.length > SAVE_MAX_BYTES) { return refusal(...) }`.
  - What is wrong: round 0 refused a file over `SAVE_MAX_BYTES` by `statSync` before reading it. The round removed that bound and put no other in its place. Every taken file is now read whole, converted to a string and run through the Markdown or YAML reader on the event loop. The size check comes only after the reader has run.
  - Measured on the worktree:
    - a 20 MB wrapped-paragraph Markdown file held the event loop 405 s (one timer tick in the whole run) and raised peak memory from 188 MB to 1040 MB; round 0 refused it in 20 ms;
    - a 4.26 MB YAML holding one ellipsis took 2734 ms and an 818 MB peak;
    - scotoma's real `Mesen.yml` (33.7 MB, no banned character) took 55 ms, since `yamlMarks` returns before parsing when it finds no marks. With one banned character it would parse the whole 33.7 MB file at least twice. I did not run that on this memory-limited machine.
  - A further risk, found by reading and not run: `bytes.toString('utf8')` at `folder.ts:168` sits outside the `try`. A text file longer than `buffer.constants.MAX_STRING_LENGTH` (536870888 characters) and under the 2 GiB `readFileSync` limit would throw there and take the whole plan down with a server error.
  - What the brief and the tree say: neither item 14 nor the rules file names a byte bound for the plan. Item 14 caps only the count (2,000 files), and the write keeps 256 KiB through `readChecked`. The brief's decision 4 keeps Markdown and YAML in the route's process on the premise of the measured cost ("62 ms on the largest file"). The tree's own convention is to stat before reading and not read a file over the read limit: `TEXT_LIMIT` (2 MiB, `data/file-ops.ts:34`) in `lsp/library/read.ts:52-55`, and DESIGN's open-files poll, which hashes "the stat for a file over the read limit".
  - This is a finding closed by removing a check rather than by fixing what it guarded. B3 asked that a large file with no fix be left out; the round removed the read bound altogether. The report's "Visible changes" does not state the new cost.
  - Failure scenario: a folder Fix All on a repository that holds a large generated `.md` or `.yml` (scotoma holds the 33.7 MB `Mesen.yml`; game-engine holds 0.7 to 1.9 MB `CMakeConfigureLog.yaml` files under `build/`) stops every other request to the oculus server for seconds or minutes and raises its memory by hundreds of MB.
  - Verdict: none on item 14's text. The defect stands on its own, and R1-S2 is the false sentence it causes.

- **R1-Sp1 (Spec).** The G3 title the round dictated is false for the tab lint.
  - Where: the report's "Doc text for agents/guarded.md", G3: "no file under the hub's `secrets` folder or `~/.oculus` is given to the YAML language server, read by the writing rules or written by them".
  - What is wrong: the round's item 3 dictated that wording, but `routes.ts` `lint()` checks no private folder. My probe linted `secrets/a.md` with `linter: 'writing'` and got `200 {"ok":true,"rows":[... "code":"ellipsis" ...]}`. The page's lint store runs every linter on any tab it can open, and the source route serves files under `secrets`. With R1-B1, the "written by them" half also fails on a case-insensitive file system. No G3 row covers the tab path.
  - Failure scenario: the orchestrator books G3 as stated, and a reader of `guarded.md` trusts that opening `secrets/notes.md` keeps the writing rules out of it. The server reads it on every open and save.
  - The choice between making the lint route answer `off` for a file in a private folder and narrowing the title to the folder Fix All belongs to the orchestrator.
  - Verdict: item 13 violated.

- **R1-Sp2 (Spec, with the report's Proof claim).**
  - Where: `comment-worker.mjs:100-114`. `answer` holds the `try`, and the queue (`queue = queue.then(async () => parentPort?.postMessage(await answer(request)))`) has no catch.
  - What the ruling and the report say: round item 8 says "the queue catches it and answers that request `{ id, error }`". The report says "`answer` is total ... the queue is never left rejected".
  - What the probe showed: a message whose own read throws inside the catch (`null`) rejects the queue. The thread then dies on the unhandled rejection (`error event: Cannot read properties of null (reading 'id')`, `exit 1`), and the next message gets no answer from that thread.
  - `HeldComments` sends only `{ id, language, text }` and recovers through `ended` and a new thread, so the visible outcome the ruling wanted holds for every request the server makes. No decision rests on the difference.
  - Failure scenario: a later change that posts a field `answer` does not expect ends the thread, where the ruling's shape would have answered it `{ id, error }`.
  - Verdict: none.

- **R1-S1 (Standards).**
  - Where: `tests/server/machine/runs/lint/writing.test.ts:7-8`: "Banned characters are escapes in this file: the em dash, the en dash, the ellipsis, the arrow, the curly quotes and the no-break space."
  - What is wrong: the round deleted `LQ` and `RQ`, the file's only curly quotes. The file now holds `—`, `–`, `…` and `→` only (grep above). The no-break space was already absent in round 0.
  - Rule: `agents/spec.md`, "What every package obeys", says a sentence in a head comment that the change makes false is a defect.
  - Failure scenario: a maintainer looking for the curly-quote case in G71's file is told it is there; it is now a quoted run.
  - Verdict: none.

- **R1-S2 (Standards).**
  - Where: `DESIGN.md:166` ("... in a worker thread the server context holds and closes, so a large file never holds the route's event loop") and `docs/files-and-search.md:91` ("... in a thread of its own, so a large file does not hold the server").
  - What is wrong: after the round, the folder plan runs the in-process Markdown and YAML reader on a file of any size. R1-B2 measured a 405 s hold for a 20 MB Markdown file; round 0 refused that file before reading it. Item 12 names `DESIGN.md:166`.
  - Failure scenario: a reader of DESIGN or the guide picks a folder Fix All over a repository with a large generated YAML, expecting the server to stay responsive, and it freezes.
  - Verdict: item 12 violated.

- **R1-S3 (Standards).**
  - Where: `src/lib/server/machine/runs/lint/writing/comments.ts:69`: "Why a request gave no ranges. `detail` is the grammar's own line for `grammar`."
  - What is wrong: after item 8, any throw inside `answer` is answered as kind `grammar`. The probe's detail is `text.matchAll is not a function or its return value is not iterable`, a line from the worker's own code, not from a grammar. The catalog line (`writing_reason_grammar`: "The comments of the file cannot be read: {0}") stays correct.
  - Failure scenario: a maintainer reading a `grammar` failure looks in Shiki's grammar for a defect that is in `rangesOf`.
  - Verdict: none.

No closure was made by removing a check other than R1-B2. No change in the delta reaches beyond the ten rulings. Every closure the report claims reproduced under my rerun; R1-Sp2 covers the one sentence of the report that a probe contradicts.

### Declined to judge

- `npm run diagrams` was not run, because it writes tracked files and I change nothing. `tests/checks/diagrams/diagrams.test.ts` passes (46), so the committed diagrams match the tree.
- The page halves of cases 13, 15, 21, 30, 36, 39, 52 and 53, and the dialog as drawn. A read and a rerun cannot show what is drawn; the look settles it.
- The builder's case 53 scratch test (`zz-scratch-fixing.test.ts`) was not rerun. It has to be placed inside a tree, and the round changed none of the files it covers.
- R1-B2 at full size: the 33.7 MB `Mesen.yml` with a banned character, and a text file over 536870888 characters. On this memory-limited machine I measured the 4.26 MB slice instead and judged the string-length throw by reading.
- Whether the bound for R1-B2 should be `TEXT_LIMIT`, `SAVE_MAX_BYTES` or another figure, and whether a file over it is left out or listed refused. That is the orchestrator's call against item 14's "files with no fix are left out".
- The hand merge with D39. D39 is not on this base. I read only main's `lsp-edit.ts:70` for R1-B1.
- `npm run test:landing`, which is the orchestrator's at landing.

Reviewer usage: agent id see completion notice, claude-opus-5-5, tokens see completion notice, tool uses see completion notice, minutes see completion notice.

### Closed (at landing)

Each finding of the review over round 1, fixed on main at D40's landing in the gate `.agents/worktrees/gate`; none was sent back to the builder.

- R1-B1, fixed: `under` (`server/core/paths.ts`) also compares the target's real path in the operating system's own spelling (`realPath(real, true)`), so `SECRETS` is inside `secrets` on a case-insensitive file system, for the folder plan's start-folder refusal and for the `lsp-edit` and `writing-fix` write alike (D39's `under(found.path, scope.withheld)` check, which the merge keeps for both operations; D40's `Scope.isPrivate` removed). Test: `tests/routes/replace/writing-fix.test.ts`, 'refuses the secrets folder named in another letter case, to the plan and the write (G3)', skipped where `SECRETS` does not resolve (a case-sensitive file system).
- R1-B2, fixed: the folder plan stats each file first and leaves out a file over the read limit (`TEXT_LIMIT`, 2 MB) unread; a file over the `writing-fix` copy limit (`copyLimit('writing-fix')`, 256 KB) is never given to the Markdown or YAML reader, only searched for the characters (`holdsBanned` in `writing.ts`), and is listed refused with `writing_folder_large` when it holds one and left out when not; the read and its `toString` sit inside the `try`, a throw answering `writing_folder_unread`.
- R1-Sp1, fixed in the G3 title: "... read by the writing rules' folder Fix All or written by the writing rules, whatever letter case names it." The tab lint of a file under `secrets` reads the file the page already shows, which G3 does not cover.
- R1-Sp2, fixed: the request queue in `comment-worker.mjs` ends in `.catch(() => undefined)`, so a message that is not a request gets no answer and the requests after it are answered; its head comment says so.
- R1-S1, fixed: the head of `tests/server/machine/runs/lint/writing.test.ts` names the em dash, the en dash, the ellipsis and the arrow.
- R1-S2, fixed with R1-B2: `DESIGN.md:166` says a large code file never holds the event loop and that the folder Fix All gives the readers no file over 256 KB and reads no file over 2 MB; `docs/files-and-search.md` says the same.
- R1-S3, fixed: `CommentFailure`'s `detail` in `comments.ts` is the thread's first line of why the request failed, a grammar that could not be loaded among them.
- The merge with D39, at the cherry-pick: a `writing-fix` file between 256 KB and 5 MB would have been written with no History copy under D39's raised `lsp-edit` limit; `plan` in `lsp-edit.ts` takes the operation's limit from `copyLimit(operation)` (`history.ts`) for the read and the size check.
- The look, on the 8796 scratch oculus: the folder dialog's Fix button stretched across the row beside Cancel (the primary button's tooltip wrapper fills its box); `WritingFixDialog.svelte` puts the button in a box of its own (`.confirm`, `flex: none`), so it is as wide as its words.
