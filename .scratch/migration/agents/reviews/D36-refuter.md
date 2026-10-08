# Step D36 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D36, base 669ae7f08)

Summary: no item is violated outright on the server path, and every rerun case reproduced. Item 2 departs from the brief's ESLint approval wording, which asks for a key per repository over all of its config files, and the report mentions the change only as a judgment call. Item 5 has a behaviour defect: a linter with no answer is shown as "ran on this file". Two unchecked documentation links reach `window.open`. Fix All is enabled in a dirty tab, where pressing it does nothing. Six comment lines are left short, `DESIGN.md` gains a negation-contrast, and the quick list is over its time limit at 51.7 s against 45 s.

## Verification (rerun by the reviewer)

```
npm run diagrams                      -> exit 0; shasum of docs/diagrams before and after equal ("diagrams unchanged")
bash checks.sh                        -> exit 0
  ok ASCII gate (0.4 s)
  ok prettier (0.9 s): All matched files use Prettier code style!
  ok svelte-kit sync (11.9 s)
  ok eslint (22.8 s)
  ok svelte-check (26.0 s): 1791489201066 COMPLETED 439 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok vitest (51.1 s): Duration 38.42s (...)
  test:quick: 51.7 s (limit 45.0 s); every command passed
  test:quick: over the time limit
  checks: 1 commands passed
  (the quick list covered 120 test files, because data/model/index.ts changed and has many importers; D39's builder was running on the same machine)
npx vitest run tests/server/machine/runs/lint/   -> Test Files 3 passed (3), Tests 18 passed (18), 2.04 s (tests 1.80 s, each under 260 ms)
npm run test:checks                   -> Test Files 17 passed (17), Tests 248 passed (248)
folder-check                          -> exit 0
guarded entries, each test file run alone, all passed:
  channel 12, tab-menu 4, held-unsaved 1, terminal-close 3, manifest-draft 3, autosave.client 23, source-disk.client 4, source.test 25, comment-draft.client 1, pages 5, workspaces-real 2, served-roots.client 6, config-cache 3, config.test 31, config-folder 25, options 3, settings 70, approvals 7, compose 16, latex-approvals 19, svelte-trust 2, servers 6
unused-exports diff against D36-base/unused-exports.txt -> only TOOL_TIMEOUT_MS moved from tools.ts to program.ts
wc -l: relay.ts 853, settings.ts 845, server/root/context.ts 837, state/client/context.ts 837, Palette.svelte 520 (base 509), Source.svelte 494
perl ASCII scan of added files -> no output, exit 0; YAML parse of every changed config file -> "yaml ok"
grep -rn "command-marks\|commandMarks" src tests config docs HELP.md DESIGN.md README.md guarded.md plan.md -> no hits
grep "no lint panel" DESIGN.md -> exit 1
grep "from './tools.ts'" src -> only readCount at endpoint.ts:53
pgrep for chktex/ruff/shellcheck/eslint-child before and after my runs -> none
find hub for .ruff_cache, .eslint_d, config.marker, starts.txt -> none; nothing under projects/ newer than the brief
git status --short (worktree) -> 81 lines, unchanged from the start of the review
grep -c "not texlab's" D36-base/tools/oculus/DESIGN.md -> 0; the worktree's DESIGN.md:575 holds it
cmp tools/oculus/.scratch/migration/agents/reviews/D36-report.md against the worktree copy -> identical
case scripts rerun from scratchpad/cases/D36/ (each writes only under its own work folder):
  c1-4.mts   -> cases 1, 2, 4b, 4c, 5, 12, 24 as reported (the I001 rows come from the machine's user-level ruff configuration)
  c4-sc.mts  -> case 4 stand-in: SC2086, info, two edits
  c23.mts    -> no_config
  c9-31.mts  -> 9 stopped then ok, first pid dead; 13; 13a too_large; 14 timeout at 703 ms; 15 unreadable; 16; 18 403; 19 404 outside/outside/not_a_file/missing; 20 no x created; 24a rc path passed as one argument after -l; 30 off; 31 200 ok in 236 ms
  c4a-4b.mts -> real ESLint: CRLF, BOM, multi-line and fatal rows as reported
  c-decision9.mts -> TypeError: convertColumn is not a function (readers.ts:43 does not export it)
  reviewer's scratchpad/review-D36/decision9.mts (through the route) -> columns 47; 397 (and 1044); 309; 589; 345 (and 13), the report's five numbers
  c3-22.mts and c5-23.mts not run: they write __case3.ts and .svelte-kit/__case23.ts into the worktree
  reviewer's scratchpad/review-D36/case3.mts over existing files -> before approval not_approved; config files ["oculus/eslint.config.js"]; first lint 17810 ms; second file 23 ms; after revoke running []
```

## Verdicts

Items of the brief's "What to build":

- 1: holds. `run` with its outcomes done, missing, timeout, overflow, stopped and failed lives in `src/lib/server/core/program.ts`, with `programPath`, `onPath` and `TOOL_TIMEOUT_MS`. The only remaining import of `tools.ts` is `readCount`, and the unused-exports diff shows only the move.
- 2: violated, Spec 1. The ESLint approval key and the held child are per configuration folder and per config file, where the brief asks for a key per repository over all of the repository's config files and one child per repository. The table, readers, fixes and runs otherwise hold; cases 1, 2, 4a to 4c, 9, 12 to 16 and 18 to 20 reproduced.
- 3: holds, with Behaviour 1. The store keeps holds, counters, bases and saves; `forgetOutside` and the reruns after approve and revoke are wired in `state/client/context.ts`.
- 4: holds, with Behaviour 2 and 3. `problem-marks.svelte.ts` replaces `command-marks`; `rowRange` draws exact ranges; `info` maps to Info; fixes are offered only when `fresh()`.
- 5: violated, Behaviour 1. A linter with no answer reads as ok.
- 6: holds. The `lint:` block is in `behavior.yml`, the eight entries are in `options.yml`, and the `settings.test.ts` and `config-folder.test.ts` additions are present; config.test 31, config-folder 25 and settings 70 pass.
- 7: holds, with Standards 5 and 6. DESIGN.md lines 23, 166, 185, 476 and 575, HELP.md:118 and the four docs pages are updated; "no lint panel" is gone.

Cases of the brief's "Cases":

- 1: met. Rerun of c1-4.
- 2: met. Rerun of c1-4.
- 3: met. Reviewer's case3.mts: not_approved before approval, one config file listed, first lint 17810 ms, second 23 ms, nothing running after revoke. eslint-trust tests at :40, :70 and :93 pass.
- 4: not verifiable. ShellCheck is not installed; the c4-sc stand-in gives SC2086, info, with two edits.
- 4a: met for the rows (c4a-4b gives multi-line ESLint ranges and the ChkTeX length). How the editor draws them is not verifiable without a page.
- 4b: met. c1-4 and decision9.mts give the UTF-16 column.
- 4c: met. c1-4 and c4a-4b give error rows with no code. `lint-fixes.ts` offers Disable and Show documentation only for rows with a code.
- 5: met. c1-4.
- 6: met by reading (`problem-marks.svelte.ts` maps info to Info). The Show Infos toggle is not run on a page.
- 7: met by reading (`forgetOutside` in the client context's roots follower). No client test covers it.
- 7a: met by reading. The run key is `${root}\n${real}\n${linter}`, and the store keys by canonical root. The nested-root re-keying is under Declined.
- 8: partial by reading. Lint once, no second lint and no lint of a restored dirty tab all hold, but the restored dirty tab shows its linter as "ran on this file" (Behaviour 1).
- 9: met. c9-31: the first run stopped and its pid dead, the second ok.
- 10: met by reading (`LintRuns.stopFile` on the release of the last hold). Not run on a page.
- 11: met by reading (per-page store in the client context). Not run with two pages.
- 12: met. c1-4 and c9-31 (ruff_path naming no file gives not found).
- 13: met. c9-31.
- 13a: met. c9-31 gives too_large.
- 14: met. c9-31 gives a timeout at 703 ms.
- 15: met. c9-31 gives unreadable for both programs.
- 16: met. c9-31; `routes.ts` reads "Unable to open" as failed.
- 17: met. eslint-life test at :124.
- 18: met. c9-31 gives 403; lint-route test at :36.
- 19: met. c9-31 gives 404 for each (judgment (d) below).
- 20: met. c9-31: no x created.
- 21: met by reading for the request (`linted` in Source.svelte). The status item still shows for an unserved root (Behaviour 1).
- 22: met. eslint-trust test at :40; case3.mts not_approved with no child running.
- 23: partial. c23 gives no_config and no run, but the ESLint item shows as ok until an answer arrives (Behaviour 1).
- 24: met. c1-4 for .zsh, .bib, .sty and .cls; `.slurm` maps to ShellCheck by reading. ShellCheck itself is under Declined.
- 24a: met. lint-route tests at :60 and :111; c9-31.
- 25: not verifiable. The single undo step and Undo need a page. The fix text is correct by reading of the ruff reader's edits.
- 26: met by reading (the disable comments in `lint-fixes.ts`). Not run on a page.
- 27: met by reading for the fix and the link, with Behaviour 2 (the href is not checked).
- 28: met by reading for the fresh case, with Behaviour 3 (dirty tab).
- 29: met by reading (`fresh()` requires `draft.loaded`, text equal to saved, and the lint hash equal to `draft.base`). Monaco refuses a stale versionId.
- 30: partial. c9-31 gives off and the next save lints, but an off linter's item shows as ok until an answer arrives (Behaviour 1).
- 31: met. c9-31 gives 200 ok in 236 ms.

## 1. Spec

- `src/lib/server/machine/runs/lint/routes.ts:221` (also :250 and :305): `const text = configText(config.folder, [{ path: config.file, hash: config.hash }]);`
  - What is wrong: the approval text covers the nearest `eslint.config.*` and its folder, and `eslint.ts` holds one child per configuration folder. Item 2 of the brief asks for a key over the repository's real path and all of the repository's config files, with one child per repository. The report states the change only as judgment call 3, never as a departure from item 2.
  - Failure scenario: in a repository with a root `eslint.config.js` and a nested one, the user is asked to approve twice and two Node children run. A change to the root config does not void the approval held for the nested folder.
  - Verdict: item 2 violated.

## 2. Proof

- `scratchpad/cases/D36/c-decision9.mts`:
  - What is wrong: the report cites this script for decision 9's five column numbers. On the final tree it fails with "TypeError: convertColumn is not a function", because `readers.ts:43` does not export the function. The numbers do reproduce through the route (reviewer's decision9.mts), so the evidence quoted was not taken on the tree as delivered.
  - Failure scenario: the orchestrator reruns the cited script and gets a throw.
  - Verdict: none.
- Report, history-word check: the grep the report quotes uses a narrower word list than the spec's.
  - What is wrong: the report's check covers fewer words than the rule. My grep with the spec's list found only temporal or state uses, so nothing is hidden, but the quoted check does not prove the rule.
  - Verdict: none.
- Report, DONE table: rows are shortened with "(...)" where the spec asks for verbatim lines.
  - Verdict: none.
- Report, proposed G36 text: it names "`lint.eslint` switched off" as guarded, and no test row covers that switch.
  - What is wrong: the `built` hook ends every child when `lint.eslint` is false (`server/root/context.ts`), but eslint-life's tests at :70 to :124 do not exercise it.
  - Failure scenario: a later change drops the hook, and the guarded entry still reads as covered.
  - Verdict: none.

## 3. Standards

1. Comment lines are left short inside a sentence, breaking the spec's 100-column rewrap rule:
   - `src/lib/server/data/approvals.ts:22`: "it stood. The file is private"
   - `src/lib/server/machine/lsp/relay.ts:27`: "folders) is told"
   - `src/lib/state/.../editor-status.svelte.ts:7`: "when it unmounts. The"
   - `src/lib/views/.../extension.ts:4-5`: "on disk beside" and "whatever its language"
   - `src/lib/shell/.../LanguageItems.svelte:5`: "// The server's"
   - `src/lib/shell/.../Palette.svelte:42`: "`:eslint-config` lists the ESLint configuration of the tab's file"

   Failure scenario: a reader meets a broken paragraph, and the next rewrap pass touches unrelated lines. Verdict: none.
2. `tests/server/machine/runs/lint/lint-fixture.ts:218`: `export async function until(condition: () => boolean, ms = 5000)`, a loop with `setTimeout(resolve, 25)`, used by eslint-life.
   - What is wrong: the spec says a test waits on a signal, never on a wall-clock margin.
   - Failure scenario: on a loaded machine (this review ran beside D39's builder) the 5 s margin can expire and the test fails without a defect.
   - Verdict: none.
3. `tests/server/machine/runs/lint/lint-fixture.ts:160`: `if (files[0].includes('hang')) await new Promise(() => undefined);`, with `hang.js` planted at :191 and described at :173.
   - What is wrong: no test lints a `hang` file (the test files have no hits for "hang" in that sense), so this is dead fixture code.
   - Verdict: none.
4. Builder conduct: the report discloses `git status` and `git -C /nonexistent status`.
   - What is wrong: the spec says a builder runs no git command. Both were read-only and left nothing behind.
   - Verdict: none.
5. `DESIGN.md:575`: "the ChkTeX findings of a LaTeX tab are the linter's, not texlab's".
   - What is wrong: this is negation-contrast phrasing, banned by the hub CLAUDE.md "Writing docs" section and the writing-docs rules. The base copy has 0 hits, so the step added it.
   - Verdict: none.
6. `docs/` Linters pages: the switches are described as "on or off" while the keys take `true` and `false`.
   - Failure scenario: a user writes `lint.ruff: off`. The validation refuses it, or YAML 1.1 reads it as false; the docs do not tell the user which.
   - Verdict: none.

## 4. Behaviour

1. `src/lib/state/system/machine/lint/lint.svelte.ts:233`: `status: held?.slots[linter]?.status ?? { state: 'ok' }`
   - What is wrong: a linter with no answer is reported as ok, and `LanguageItems.svelte` draws it as "Ruff" or "ESLint" with the tooltip "ran on this file". The report does not state this.
   - Failure scenarios:
     - A restored dirty tab is never linted but shows the linter as having run.
     - A tab before its first answer shows the same.
     - A tab of an unserved root shows the same.
     - A linter switched off, or ESLint with no config, shows its item until an answer arrives, and in a restored dirty tab it shows indefinitely.
   - Verdict: item 5 violated; cases 8, 23 and 30 partial.
2. `src/lib/views/sources/source/language/lint-fixes.ts:363`: `if (typeof href === 'string') window.open(href, '_blank', 'noopener,noreferrer');`, and `src/lib/views/sources/search/Problems.svelte:184`: `if (row.href !== undefined) window.open(row.href, '_blank', 'noopener,noreferrer');`
   - What is wrong: ESLint's `meta.docs.url` comes from repository plugin code and is passed to `window.open` with no check of the scheme. The tree already has a check, `webAddress` in `state/system/apps/methods.ts:122`, which these calls do not use. The report does not mention it.
   - Failure scenario: an approved repository's plugin sets `meta.docs.url` to a `javascript:` or `file:` address, and Show documentation opens it.
   - Verdict: case 27 met with this finding.
3. `src/lib/views/sources/source/language/lint-fixes.ts:338` (`if (!fresh(client, instance, file, linter)) return;`) and :415 (`disabled: !rows.some(`)
   - What is wrong: Fix All is listed as enabled whenever the linter's rows have fixes, including in a dirty tab. Pressing it there returns silently, and the report does not state this.
   - Failure scenario: the user edits a Python file, picks "Ruff: Fix All Auto-fixable Problems" and nothing happens, with no reason shown.
   - Verdict: case 28 met with this finding.

On the orchestrator's points:

- (a) Every path outside the brief's write list is needed and sits where the folder and layer rules put it, including `ApprovalAsk.svelte`, which the duplication test forced, and `palette-open.ts`.
- (b) The `boundaries.test.ts` and `config-folder.test.ts` widenings are correct extensions with the `lsp` precedent; the keys are compared after sorting.
- (c) The rename is clean (the grep above has no hits).
- (d) 404 holds. It matches the LaTeX endpoint (`endpoint.ts:220-223`), and the brief named no status; source and open answer 403.
- (e) The approval covers the one config file and its folder. Imports of that config are not hashed, which matches the Svelte precedent (`config-files.ts`); the per-repository question is Spec 1.
- (f) The `lint:` group in `source.yml` holds: it is declared once, and multi-group files have precedent in `search.yml`; `views/sources` is full at 10.
- (g) By reading, each ESLint test would fail without the behaviour it guards. The reconcile test calls `reconcile()` directly, as the lsp precedent does.
- (h) Command rows never carry `info` or an end, so their markers are unchanged.
- (i) A fix is offered only when `fresh()` holds; the dirty-tab Fix All is Behaviour 3.
- (j) No leftover processes or caches; the two git invocations are Standards 4.
- (k) The step's own tests take 1.8 s. The quick list's 51.7 s comes from the import fan-out of `data/model/index.ts` and the machine being shared, but the list is over its limit and the report quotes 30.0 s.

## Declined to judge

- Real ShellCheck output for cases 4 and 24: ShellCheck is not installed.
- Page looks for cases 4a, 6 and 25 to 28 (markers, the status item's tone, the code link, undo): seeing them needs the app, which the brief forbids starting.
- ChkTeX's syntax for suppressing several warnings on one line: not settled by a read; a run of real ChkTeX over such a line would settle it.
- A cold ESLint start under load passing `LINT_LIMIT_MS` (30 s), which would make every first lint time out: my cold start took 17.8 s on a shared machine; timing on a slower machine would settle it.
- Whether a `javascript:` href runs under `noopener` in Chromium or Electron: it needs the app.
- Re-keying when a nested served root is added while rows are held, and a served root set below the repository root, for ESLint config lookup: not covered by a test and not run.

Reviewer usage: agent id not given to me, claude-opus-5-5, tokens not known to me, tool uses not known to me, minutes not verified.

## Repair round 1, refuted

On `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D36`, base 669ae7f08. I read the round's delta from `D36-round0/tools/oculus` to `D36/tools/oculus` against the whole diff since the base: `git diff 669ae7f08 --stat` reports 72 files changed, 1046 insertions(+), 426 deletions(-). My own `diff -rq` over the two copies lists the same 28 files as `d36-r1.diff`. All runs below were made from `.agents/worktrees/D36/tools/oculus` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. The worktree's `git status --short` was the same before and after my runs (84 lines, compared with `diff`).

```
npm run diagrams                              -> exit 0; shasum of the 18 files in docs/diagrams before and after: "diagrams unchanged"
sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md
  ok      prettier (0.5 s): All matched files use Prettier code style!
  ok      ASCII gate (0.5 s)
  ok      svelte-kit sync (2.1 s)
  ok      eslint (5.8 s)
  ok      svelte-check (9.4 s): 1791494531198 COMPLETED 439 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest (34.4 s): Duration  30.47s (transform 48.77s, setup 0ms, import 64.88s, tests 52.74s, environment 272ms)
  test:quick: 35.2 s (limit 45.0 s); every command passed
  checks: 1 commands passed                     (exit 0)
npm run test:quick -- --base 669ae7f08 (the reviewer's form)
  test:quick: 97 changed file(s), from git since 669ae7f08
  test:quick: 121 test file(s), 10 essential
  ok      vitest (25.7 s): Duration  22.33s (...)
  test:quick: 26.2 s (limit 45.0 s); every command passed      (exit 0)
npx vitest run tests/server/machine/runs/lint/ tests/server/root/eslint-switch.test.ts --reporter=verbose
  Test Files  4 passed (4)
       Tests  21 passed (21)          (lint-route 9, eslint-life 7, eslint-trust 4, eslint-switch 1)
  ... ends every held ESLint child from the hook the portfolio watcher runs 1024ms
npx vitest run tests/server/root/eslint-switch.test.ts, run alone twice: 1037ms, 1091ms
npm run test:checks                           -> Test Files  17 passed (17)  Tests  248 passed (248)
each file alone, "Test Files 1 passed (1)" for every one, with this many tests:
  channel 12, tab-menu 4, held-unsaved 1, terminal-close 3, manifest-draft 3, autosave.client 23, source-disk.client 4,
  source 25, comment-draft.client 1, pages 5, served-roots.client 6, workspaces-real 2, config-cache 3, config 31,
  config-folder 25, options 3, settings 70, approvals 7, compose 16, latex-approvals 19, servers 6, svelte-trust (slow) 2,
  normalise 1, resources 1, docs 2, feeds 1, manifests 1, personal 2, present 4, methods 47
config-cache.test.ts verbose: its three tests take 19 ms, 4 ms and 4 ms
wc -l of changed sources: largest relay.ts 852, settings.ts 845, server/root/context.ts 839, state/client/context.ts 837; Palette.svelte 520
sh utils/folder-check.sh                      -> exit 0
diff D36-base/.../unused-exports.txt <now>    -> "39d38 < src/lib/server/content/latex/tools.ts: TOOL_TIMEOUT_MS" / "47a47 > src/lib/server/core/program.ts: TOOL_TIMEOUT_MS"
ASCII gate (the spec's perl form over src tests config) -> no output, exit 0; LC_ALL=C grep -c over DESIGN.md HELP.md docs/*.md -> no file with a hit
yaml.safe_load of the 8 changed config files  -> "yaml ok 8"
grep -rn "from './tools.ts'" src/lib/server/content/latex -> endpoint.ts:53:import { readCount } from './tools.ts';
grep -rn "no lint panel" DESIGN.md HELP.md docs -> exit 1
find for .ruff_cache and .eslint_d under cases/work and the worktree -> none
pgrep -fl "ruff|chktex|shellcheck|eslint|d36r1" after my runs -> exit 1
The builder's scripts, rerun from $TMPDIR/d36r1/cases (each writes only under cases/work):
  r1-docs.mts:  ruff url javascript:alert(1) {"code":"F401","href":null}
                ruff url file:///etc/passwd {"code":"F401","href":null}
                ruff url https://docs.astral.sh/ruff/rules/unused-import {"code":"F401","href":"https://docs.astral.sh/ruff/rules/unused-import"}
                eslint docs javascript:alert(1) {"code":"no-undef","href":null}
                eslint docs file:///etc/passwd {"code":"no-undef","href":null}
                eslint docs https://eslint.org/docs/rules/no-undef {"code":"no-undef","href":"https://eslint.org/docs/rules/no-undef"}
  r1-case12.mts: both {"ok":false,"state":"not_found"}
  r1-d9.mts:    routeColumns 47; 397,1044; 33,70,82,309,332; 589; 13,345 (the report's five numbers)
  r1-shellcheck.mts (ShellCheck 0.11.0): case4 a.sh SC2086 info, column 6 to 8, two edits; b.sh SC1073/SC1072 error; c.sh SC2164 warning;
                d.sh "column":11,"endColumn":13; case24 .slurm SC2086; x.zsh, x.bib, x.sty, x.cls {"status":400,"body":{"ok":false,"error":"not_taken"}}; case5 clean {"ok":true,"rows":[]}
  r1-eslint.mts: case3 not_approved before; first lint {"ok":true,"rows":0,"ms":5979}; second {"ok":true,"rows":0,"ms":24};
                case22 running before [] and after revoke []; case23 mathconfig.js no_config, .eslintrc only no_config, gen/out.js rows [], control ["no-var"]
  c1-4, c4a-4b, c23: identical to the builder's out2-*.txt once hashes are masked
  c9-31: identical except for a pid, a scratch folder name and case14's ms (705 against 702)
ChkTeX, on $TMPDIR/d36r1/chk/a.tex with -wall -n22 -n30 -e16 -q -I0: lines 3, 4, 6 and 7 warn, and line 5 ("% chktex 12 chktex 2") prints nothing;
  the same file with that comment removed: line 5 prints 12 and 2
```

Not rerun: the four kept test files in `$TMPDIR/d36r1/proof` and `proof0` (see "Declined to judge").

### Verdicts

These are for the whole diff since the base. Items of the brief's "What to build":

- 1: holds. `run` and its answers live in `core/program.ts`. The only remaining import of `tools.ts` is `readCount`. The unused-exports diff shows only the move of `TOOL_TIMEOUT_MS`.
- 2: violated, Behaviour R1-1. The `:eslint-config` list says that no configuration applies to a tab whose linters have not answered. The rest holds:
  - the readers keep only http and https documentation addresses (r1-docs);
  - the approval is per configuration folder (Z740, `eslint-trust.test.ts:110`);
  - cases 9 and 12 to 20 reproduce.
- 3: holds. `statuses` (`lint.svelte.ts:228-235`) answers only linters with a slot status. Holds, saves, counters and `forgetOutside` are unchanged.
- 4: holds. `problem-marks.svelte.ts:73`, `lint-fixes.ts:315` and `:365` pass every address through `webAddress`. Fix All is disabled unless `fresh()` holds (`lint-fixes.ts:418-424`).
- 5: holds. `LanguageItems.svelte` draws only items for answered linters; `off` and `no_config` draw nothing. The words are in `statusbar.yml:134-141`.
- 6: holds. settings 70, config 31 and config-folder 25 pass.
- 7: holds:
  - `DESIGN.md:575` reads "come from the ChkTeX linter";
  - `docs/files-and-search.md` and `docs/configuration.md:13` say `true` or `false`;
  - the per-folder approval sentence is in `DESIGN.md:166` and `docs/files-and-search.md:93`;
  - the "no lint panel" grep exits 1.

Cases:

- 1: met (c1-4 rerun).
- 2: met (c1-4 rerun).
- 3: met. r1-eslint: first lint 5979 ms, second 24 ms. eslint-trust passes.
- 4: met with the real ShellCheck 0.11.0 (r1-shellcheck).
- 4a: met for the rows (c4a-4b). The drawing needs the look.
- 4b: met (c1-4, c4a-4b).
- 4c: met (c1-4, c4a-4b; `lint-fixes.ts:285`).
- 5: met (c1-4; r1-shellcheck case5).
- 6: met by reading (`problem-marks.svelte.ts:71`). The look covers Show Infos.
- 7: met by reading (`state/client/context.ts:618`). served-roots.client: 6 passed.
- 7a: met by reading (`canonical`, `lint.svelte.ts:101-108`).
- 8: met by reading. A restored dirty tab is not linted and has no status.
- 9: met (c9-31 rerun: the first pid is dead after the second run).
- 10: met by reading (`release` and `forget`).
- 11: met by reading (the store is per page).
- 12: met (r1-case12 rerun).
- 13: met (c9-31).
- 13a: met (c9-31).
- 14: met (c9-31, timeout at 705 ms).
- 15: met (c9-31).
- 16: met (c9-31).
- 17: met (`eslint-life.test.ts:128`).
- 18: met (lint-route, c9-31).
- 19: met (lint-route, c9-31).
- 20: met (c9-31: x_created false).
- 21: met by reading. An unserved root has no status and no actions.
- 22: met (eslint-trust 4 passed; r1-eslint).
- 23: met (r1-eslint; `no_config` draws no item).
- 24: met (r1-shellcheck).
- 24a: met (lint-route, c9-31).
- 25: not verifiable here. The undo step needs the look.
- 26: met by reading (`lint-fixes.ts`). The look covers the drawn result.
- 27: met by reading and r1-docs. The look covers the click.
- 28: met by reading (`lint-fixes.ts:418-424`). The look covers the disabled state.
- 29: met by reading (`fresh`, `lint-fixes.ts:55-67`).
- 30: met (c9-31 `off`; settings.test). `lintItem` draws nothing for `off`.
- 31: met (c9-31: 200 ok in 233 ms).

### Findings

The ten rulings, one by one:

- Rulings 1 to 9 are closed by fixes, not by removing a check, and my reruns reproduce each claimed closure.
- Ruling 1 reaches beyond its finding into the `:eslint-config` list (R1-1).
- Ruling 7 also gained a test row, `eslint-trust.test.ts:110`. It falls under G55's guarantee and the report states it.
- Ruling 10 holds except for one false row in the look table (R1-2).

#### 1. Spec

- R1-7. File: `tools/oculus/.scratch/migration/agents/reviews/D36-report.md` in the worktree. `git status --short` shows `?? tools/oculus/.scratch/migration/agents/reviews/D36-report.md`, and its first line is `# D36 report: linters (ChkTeX, ruff, ESLint, ShellCheck)`.
  - What is wrong: the worktree still holds the round-0 report, and `cmp` with main's copy says "differ: char 13, line 1". The builder's report says it should not land.
  - Failure scenario: the landing's wip commit takes the whole worktree, and the cherry-pick replaces main's round-1 report with the superseded round-0 one.
  - Verdict: none.

#### 2. Proof

- R1-6. Place: the report's "Doc text" for G36, which adds "when the approval it started under changes or is taken back".
  - What is wrong: the G36 Test line it proposes lists eslint-life and eslint-switch. No row there tests the end on a revoke. That row is `eslint-trust.test.ts:93`, 'ends the child when the approval is taken back', listed under G55 only.
  - Failure scenario: a reader of G36 finds no G36 test for the revoke end. A later change to G55's rows leaves G36 claiming a guarantee it lists no test for.
  - Fix at landing: add that title to G36's Test line.
  - Verdict: none.

#### 3. Standards

- R1-3. File: `tests/server/root/eslint-switch.test.ts:86`, the test 'ends every held ESLint child from the hook the portfolio watcher runs'.
  - What is wrong: the test takes 1024 ms, 1037 ms and 1091 ms (verbose runs above) and has no `// @module-tag slow`. `agents/spec.md`, "What every package obeys", says: "A test runs in well under a second; one that cannot (a real process, a timer, a network wait) is tagged slow." For comparison, `config-cache.test.ts` reaches the same context in 4 to 19 ms.
  - Failure scenario: the test runs in `test:quick` and `npm test` whenever a file it imports changes. With six builders on the machine it can pass vitest's 5 s timeout and fail with no defect.
  - Fix at landing: tag it slow.
  - Verdict: none (ruling 5's row itself holds).
- R1-4. File: `src/lib/data/hub-address.ts:4-9`, "One rule, imported by both layers: the collection card runs it ... and the Audit runs it ...". Also `tests/checks/tree/boundaries.test.ts:90-92`, which gives the collection card and the Audit as the readers of `data/hub-address`.
  - What is wrong: the file now also holds `webAddress`. Its readers are `state/system/apps/methods.ts:16`, `server/machine/runs/lint/readers.ts:19`, and three views through `lint-model.ts:6`. The head comment paragraph and the boundaries comment still name one rule and its two readers. The spec's rule asks that head comments of touched code be read against the change.
  - Failure scenario: someone who changes `webAddress` reads the head comment and expects only the card and the Audit to depend on the file, so they miss the app opener and the linter links.
  - Verdict: none.
- R1-5. The report's "Commands outside the brief's allowance": "`pkill -f nothing` once by mistake".
  - What is wrong: `pkill -f` signals every process of the user whose command line contains the pattern. `agents/spec.md`, "Where you work", says never to signal the process that holds 8787 or any pid in `~/.claude/sessions/`, and a pattern kill cannot exclude them. The later `pgrep -fl nothing` cannot show whether a process was killed.
  - Failure scenario: any process of Axel's, or another agent's, whose argv contains "nothing" receives SIGTERM.
  - Verdict: none.

#### 4. Behaviour

- R1-1. Place: `src/lib/views/sources/source/Source.svelte:364-370`:
  - `const items = client.lint.statuses(root, path).map(...)`
  - `return items.length === 0 ? undefined : { at: place, items };`
  - Read with `src/lib/shell/keys/palette-modes.ts:44-49`: `return parsed?.name === 'eslint-config' && linters !== undefined ? linters.at : null;`
  - What is wrong: since ruling 1, `statuses` is empty until a linter answers, so `status.linters` is undefined. `lintConfigOf` then answers null, and `LintConfigRows.svelte` shows `app.palette.eslint_config_none`, which reads "No ESLint configuration applies to the file of the source tab." In round 0 the placeholder `ok` kept `linters.at` defined, so the list found the file before any answer. The report does not state this change.
  - Failure scenario:
    - A `.ts` tab restored with unsaved text in an unapproved repository: `:eslint-config` says no configuration applies, and the user cannot approve until the file is saved.
    - A clean `.ts` tab in an approved repository during ESLint's cold start (5979 ms in my rerun, 17 s measured in the brief): the list says no configuration applies and cannot take the approval back.
    - Once any answer has arrived, including `not_approved`, the list works.
  - Small fix at landing: return `{ at: place, items }` whenever `client.lint.keyOf(root, path)` is not null. `LanguageItems` already draws nothing for an empty `items`.
  - Verdict: item 2 violated.
- R1-2. Place: the report's look table, the row "a tab before its first answer, a restored tab with unsaved text, a tab of an unserved root, a switched-off linter | n/a | no linter item at all; "Linters: Run Again" is still in the tab's actions".
  - What is wrong: for a tab of an unserved root, `canonical` answers null (`lint.svelte.ts:101-108`) and `lintActions` returns `[]` at `lint-fixes.ts:404`, so Run Again is not listed. Round 0 listed it there. The code is right, but the report states the wrong after-state and leaves out the change.
  - Failure scenario: at the look, Run Again is missing from an unserved-root tab, and that is booked as a defect.
  - Verdict: none.

### On the orchestrator's points

1. **`webAddress` moved to `src/lib/data/hub-address.ts`.** The home holds. `data/hub-address` is already on the state layer's allow list (`boundaries.test.ts:265`), and the server may import any of `data/`. The file's concern is telling web addresses from hub paths. Views reach the check through the `lint-model.ts` re-export, which the layer rules require.
   - Every caller uses the moved function: `methods.ts:16` and `:284`, `readers.ts:19` and `:133`, `lint-fixes.ts:315` and `:365`, `Problems.svelte:153`, `:172`, `:185` and `:375`, `problem-marks.svelte.ts:73`. No copy is left (grep).
   - `methods.test.ts` is byte-identical to the base (`diff` prints nothing). Its rows drive `methods.open` with `javascript:`, `file:`, user and password, and over-2048 addresses into the same function, and 47 pass.
   - The head comment is stale (R1-4).
2. **The injected `exited(pid)` option and `createEslints`.** They are the size the job needs. `exited` is one optional callback beside `clock`, called after `#lost` on the child's `exit` (`eslint.ts:142-145`). `createEslints` follows the existing factory pattern (`createRelay`, `createDebug`). Production passes only `{ roots }` (`context.ts:276-281`), and `exited` falls back to a no-op (`eslint.ts:256`). Nothing extra reaches production.
3. **Would `eslint-switch.test.ts` fail without `eslint.endAll()`?** Yes, by reading. After `lint.eslint` is set to `false` and `built?.()` runs, `expect(context.eslint.running()).toEqual([])` would see `[repo]`, and `await exits.gone(pid)` would never settle. The first `built?.()` with `true` also asserts `[repo]`, so an unconditional end would fail too. Its time is R1-3.
4. **The hang row of `eslint-life.test.ts`.** It proves both points. `armed(LIMIT_MS)` waits for the lint's timer, the clock passes it, and the lint answers `timeout`. `await gone(hung)` settles only on that pid's exit event, so a child that was only forgotten would hang the test. `starts(dir)` reaching 2 and `alive(newest(dir))` show that the next lint starts a new child.
5. **The readers of `statuses`.**
   - Status bar (`LanguageItems.svelte:149-203`): behaves.
   - Fix All (`lint-fixes.ts:396-427`): behaves. It is listed only for `ok` and enabled only when fresh.
   - `tab-asks`: a pass-through, behaves.
   - Run Again: listed whenever `keyOf` is not null, which includes a held file with no answer.
   - `:eslint-config` through `lintConfigOf`: works for a `not_approved` file once its first answer has arrived. It does not find a file with no answer yet, and says "No ESLint configuration applies" (R1-1).
6. **The four kept test files.** The tree holds none of them. `find tests -name lint.test.ts -o -name lint-actions.test.ts` finds nothing. The kept `eslint-trust.test.ts`, `lint-route.test.ts` and `lint-fixture.ts` differ from the tree's by exactly the documentation-address rows and stand-in. What else proves each ruling:
   - Ruling 2 is proven on the tree by the r1-docs run, which I reran, plus reading of the view-side checks.
   - Rulings 1 and 3 are proven only by reading and by the report's runs of those off-tree files, which I did not rerun. On the tree they rest on the look.
   - Open item 17 holds this.
7. **`ls -la ~/.oculus` and `pkill -f nothing`.** The listing breaks no rule of `agents/spec.md` or the brief: both forbid only approvals files under `~/.oculus`, and the listing wrote nothing. `pkill -f nothing` is R1-5.
8. **The Doc text for `agents/guarded.md`.**
   - The line numbers are right: G1 at 7, G2 at 10, G7 at 25, G55 at 37 and G36 at 65 (grep).
   - Every quoted title exists verbatim in the verbose run above. That covers the G2 and G7 `%s` tables, the four G55 rows including the nested one, the seven G36 rows and the switch row.
   - The Code lines name the files that hold each behaviour: `routes.ts`, `linters.ts`, `eslint.ts`, `eslint-child.mjs` and `context.ts`'s `built` hook.
   - One mismatch: G36's text claims the revoke end with no G36 test listed for it (R1-6).
9. **Test titles carrying `(G1)` and the like.** These are within the rule. `agents/spec.md` bans package ids (O17, Q14, D19c), dates and the listed comparison words. A G-id names a standing guarantee, not a package, session or date. The base already uses the form in a head comment (`tests/state/system/lsp/edits.test.ts:2` and `:4`). This round puts it into test titles for the first time (six titles).

### Declined to judge

- The kept tests for rulings 1 and 3 (`$TMPDIR/d36r1/proof`, `proof0`): not rerun. Their `node_modules` is a link to the worktree's, so vitest would write its cache through it outside that folder.
- Anything only a page shows: the markers' ranges, the Info marker and Show Infos, the warning tone, the code link, undo as one step, Fix All's disabled state on screen, and the `:eslint-config` empty sentence on screen. These need the app, which this review may not start.
- Whether `pkill -f nothing` signalled any process: no record exists to settle it.
- `eslint-switch.test.ts` under parallel load: timed only alone and in a four-file run (1.0 to 1.1 s).

Reviewer usage: agent id not known to me, claude-opus-5-5, tokens not known to me, about 75 tool uses counted from my own calls, minutes not verified.

### Closed

The findings of the run over round 1, each with its disposition at landing (none is sent to the builder):

- R1-1 (the `:eslint-config` list before a linter's first answer): fixed at landing; `Source.svelte` publishes `linters` with its `at` whenever the lint store names the file, with an empty item list until an answer.
- R1-2 (the report's look table, Run Again on an unserved root): no code change; the landing note states the after-state, no Run Again for a tab of an unserved root.
- R1-3 (`eslint-switch.test.ts` over a second): fixed at landing, the file tagged slow.
- R1-4 (`hub-address.ts` head comment and the `boundaries.test.ts` comment naming two readers): fixed at landing.
- R1-5 (`pkill -f nothing`): a conduct slip of the builder, reported to Axel at landing; nothing to change in the tree.
- R1-6 (G36's Test line missing the revoke row): fixed at landing in `agents/guarded.md`.
- R1-7 (the worktree's round-0 report): closed by the landing script, which leaves the ledger root out of the worktree's commit; main keeps the round-1 report.
- Also fixed at landing from the orchestrator's read of the delta: the code span `{ id, messages, docs }` split across two comment lines in `eslint-child.mjs`. Open item 17's two rows (`agents/reviews/D36-item17-tests.patch`) applied, as Axel ruled.

- Fixed at landing from the gate's first run of `test:landing` (`test:checks` red, 2 of 248): the `boundaries.test.ts` comment the R1-4 fix rewrote ran past the hundredth column (G23), rewrapped; and `config/layout.yml`'s `nav_groups` no longer followed the rail order after commit 02a09980e moved Sessions after Incoming on main (G13's 'keys every catalogue group by the rail page it holds, in rail order'), its `sessions` group moved after `incoming` with its chord `m` kept.
- Fixed at landing from the look on the 8796 scratch oculus: the first edit in a preview tab pins it, its editor is mounted again, and the lint store's release forgot the file's answers while the hold that followed came from a tab with unsaved text and linted nothing, so the marks and the status item were gone until the next save even after an undo. The last release now forgets the file after the current task (`setTimeout` 0 in `release`, `hold` keeping a file whose forget is pending), so a remount keeps the answers; checked on the page with `b.sh` (a preview tab, one character typed and undone: the ShellCheck mark and item stay).
