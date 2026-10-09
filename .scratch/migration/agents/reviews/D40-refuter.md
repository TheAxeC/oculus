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
