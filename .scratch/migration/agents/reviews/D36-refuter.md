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
