REFUTE REPORT, step Q66 (oculus/migration), worktree /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q66, base d6359dcd. I changed no file in the worktree (`git status --short` prints the same 30 lines before and after my runs). My scratch copies are under the session scratchpad (q66rev-base, q66rev-mut).

## 1. Verification lines

`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams` printed the nine `.dot`/`.svg` pairs (layers, layer-data, layer-server, layer-state, layer-ui, layer-shell, layer-views, channels, writes) and exited 0. The tracked diff was identical before and after (25 modified tracked files, 5 untracked).

`checks.sh .scratch/migration/orchestrator-state.md` (first run): its output file was written by a second process too (a line `RUN v4.1.11 .../worktrees/Q35/tools/oculus` appears inside my Q66 output). I discard that run and quote the second run, written to a file name of my own:

```
$ npm test
> oculus@0.0.1 test
> vitest run --tagsFilter '!slow' --exclude 'tests/checks/**'
 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q66/tools/oculus
 ❯ |unit| tests/routes/edit/config-key.test.ts (14 tests | 2 failed) 38206ms
     × answers gone once the key has left the file or the file no longer parses 5596ms
     × lands two writes of different keys in a row, each record naming its key 6061ms
 FAIL  ... Error: Test timed out in 5000ms.
 Test Files  1 failed | 424 passed | 22 skipped (447)
      Tests  2 failed | 11112 passed | 619 skipped (11733)
checks: failed with exit 1: npm test
```

Both failures are 5000 ms timeouts in `tests/routes/edit/config-key.test.ts`, a file the step does not touch (load average 20.9 at the time, `uptime`). Rerun alone: `npx vitest run tests/routes/edit/config-key.test.ts` printed `1 failed | 13 passed` (again a timeout, load still high); with `--testTimeout 60000` (diagnostic only, nothing changed) that file and `tests/server/edit/config-key.test.ts` printed `Test Files 2 passed (2) / Tests 52 passed (52)`. In the first, discarded run the failing files were `tests/server/edit/config-key.test.ts` and `tests/server/git/autofetch.test.ts` (5000 ms timeouts). I did not get `autofetch.test.ts` to green; it is not a file the step changes. Named, not a finding.

Because checks.sh stops at its first failing command, I ran the rest one by one from `tools/oculus`:
- `npm run test:checks`: `Test Files  29 passed | 2 skipped (31)`, `Tests  442 passed | 9 skipped (451)`.
- `npm run check`: `COMPLETED 2960 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run build`: exit 0, `built in 12.72s`, `built in 29.97s`.
- `npm run format:check`: `All matched files use Prettier code style!`.
- `npm run lint`: no output.
- `LC_ALL=C grep -rna '[^ -~]' src tests`: no output. The spec's perl ASCII gate over `src tests config` printed nothing (`bin` does not exist in the worktree; find reported it).
- `sh utils/folder-check.sh`: exit 0.
- `grep -rln "provideTabState\|useShown\|shownGate" src` prints TabView.svelte, use.ts, Changes.svelte, Graph.svelte, Source.svelte, File.svelte, Diff.svelte and nothing else. `wc -l .../diff/Diff.svelte` prints `537`.

The report's quoted numbers reproduce: line counts (308, 433, 90, 298, 59, 235, 483, 456, 311, 741, 191, 178, 101, 37, 13), the four test files `Tests 53 passed (53)` in my mutation copy against the report's 90 for a wider set, `tests/shell/panes` holds 8 items. `Test Files 424 passed | 1 failed (447)` matches the report's 425/447 up to the timeout.

Reruns of the report's evidence, first run on the unchanged tree (see Spec S1): I rebuilt the unchanged source by reverse-applying `git diff d6359dcd -- tools/oculus/src` with `patch -R -p3` onto a scratch copy and kept the new tests. `npx vitest run tests/state/client/queries.test.ts tests/state/client/client-state.test.ts tests/shell/panes --reporter=verbose` there printed `Failed Tests 31`. The failure forms: `TypeError: queries.scoped is not a function` (14 queries.test.ts tests), `TypeError: shownGate is not a function` (6) and `TypeError: useShown is not a function` (2) in tab-view.test.ts, `TypeError: Cannot read properties of undefined (reading 'wrap')` (3 in client-state.test.ts plus 3 in tab-scope.client.test.ts), `AssertionError: expected [ '/api/memories' ] to deeply equal []` (tab-view "makes no request ... while hidden"), `AssertionError: expected [ 'tabScope' ] to deeply equal []` (client-state audit), and the two pre-existing client-state tests that list `STORES`. The one new test that passes on the unchanged tree is tab-view "makes the request for the same view when shown", which is the control case. On the changed tree the same four files print `Tests 53 passed (53)`.

I also ran three of the builder's single-edit reverts on a scratch copy of the worktree: removing `&& !hidden()` from `read` turned 8 tests red (the report says 8); `invalidate(key, false)` in `deferRefetch` turned only "wakes a reader outside the scope ..." red (the report names it); removing `if (!shown()) return false;` from `due` turned only "answers false while hidden and records nothing" red (the report names it). All three match.

## 2. Verdicts

What to build:
1. Scope in the query helper: holds. `scope` is a local of `createQueries` (`queries.svelte.ts:72-73`), `scoped` restores in a `finally` (`:107-116`), `read` checks `!hidden()` after `options.enabled && wants(state)` (`:206`), `refetch` has the `drop` return before the hidden branch and `deferRefetch` (`:232-252`) follows the three rules, `peek/fetch/hold/mark/forget/entries/settled` untouched, `Queries` type has `scoped`.
2. The tab's copy of the stores: holds. `withQueries` is used at exactly the ten hand-overs, `queried` and `tabScope` are locals of `createClientState`, `TabScopeStore` is exported from `context.ts`. See Spec S2 for an unrequested restructure of the `createFs` call.
3. The tab provides it: holds. `SHOWN_KEY`, `provideTabState`, `useShown`, `shownGate` with `due/note/clear` as specified; `use.ts` comments are true.
4. TabView: holds. `provideTabState(() => shown)` after `provideInstance`; head comment says what a hidden view does.
5. The five direct re-reads: holds as a diff (each gates through one `shownGate(useShown())`; every reset path calls `clear()`: Changes `:69`, Source `:224`, Graph `:169`; Diff's subject effect calls `note` and the follow effect uses the gate; File sets `src` in an effect). Nothing tests the wiring (see Spec S3, Behaviour B1).
6. Terminal: holds. No file under `terminals.svelte.ts` or the terminal views is in `git diff d6359dcd --stat`.
7. Docs: holds. `DESIGN.md:194` carries the sentence; every comment the brief names is changed (hunks read); `PaneBody.svelte`, `TabView.svelte`, `use.ts`, `context.ts`, `queries.svelte.ts` heads are true for a hidden tab. No other sentence in `src`, `config`, `HELP.md`, `DESIGN.md`, `README.md` is made false (grep of "hidden tab|neither builds|fetched again|still being drawn|re-read" over those; the hits I read are either changed or unrelated, e.g. `views/structure/map/Graph.svelte:161`).
8. Tests: holds. `queries.test.ts` new describe (14 tests), `client-state.test.ts` (`STORES` has `tabScope`, 3 new tests), `tab-view.test.ts` (10), `tab-scope.client.test.ts` (3), each with a prose `// Revert:` comment, no directive. Two helper files outside the brief's path list (see S2).

Cases:
1 met. 2 met. 3 met. 4 met. 5 met. 6 met. 7 met. 8 met. 9 met. 10 met (named an audit in the test). 11 met (the name list is an audit, named so). 12 met. 13 met (hidden: no request, shown: `/api/memories`; `useShown()` default true; no state above throws nothing, `.body` read inside the call). 14 (a), (b), (c) met. 15 met (scheduled-then-hidden, shown/hidden/shown inside one tick named an audit, closed-tab copy only marks).
For 1 to 15, "met" means the test exists, passes on the changed tree and fails on the unchanged source in my rebuilt copy; the "first run on the unchanged tree" the brief asks the builder for was not taken by the builder (S1).
16, 17, 18, 19, 20: not verifiable here (look items for the orchestrator).
21: not verifiable (no test; the report says `showing`'s release was not re-read).
22: met by reading (`context.ts:322` `served: () => fs.workspaces()...` uses the original `fs`; no test).
23: met via cases 5 and 14 (a).
24: met. I read the seven `queries.refetch` callers on the base source (`transcript.follow`, `agents.refreshCustomizations`, `memories.reload`, `lines.recount`, `deposit.reload`, `changes.reload`, `changes.older`): all synchronous, none after an `await`; the `queries.read` callers are synchronous reads; the `await`s in `fs.svelte.ts` (lines 456 to 727) precede only `fetch`/`writes.send`. None of the ten stores contains `$derived` or `$effect` (grep over the ten files).
25: met (stated; `changes.older` reached only from `History.svelte`, not re-checked by me).
26: met. `grep -rn "PaneView\|SplitView\|PageLeaf" src/lib/views` prints nothing on the unchanged source; `TabView` is the only user of `registration.component` and the only `<TabView` (grep over `src/lib/shell`).

## 3. Findings

### Spec

S1. First run on the unchanged tree not taken (partial). Place: report, "The cases' first run, on the tree as found". The hunk: "Result: 8 test files, 89 tests passed, 0 failed ... all green on the tree as found". A first run on a tree that already carries the change cannot show a test red. The brief (cases paragraph, verify item 4) requires each new test to fail on the unchanged tree with the failure quoted. Failure scenario: a reader trusts "fails without the change" with no failure text in the report. Verdict: the method gap is the builder's, but its substitute holds up: the 24 single-edit reverts are a stronger per-line check than a base run, and the three I reran reproduced as reported. Closed by the reconstruction in section 1 (31 red on the unchanged source, with the error text). The orchestrator may paste that failure list into the booking. Not sent back.

S2. Changes no item asks for. (a) `context.ts`, the `createFs` call was restructured: the inline object argument became `const fsForms = {...}` (also re-indented, the `.map((tab) => ({ id, forms }))` hunk is split over lines) so that `withQueries('fs', createFs(writes, fsForms, entities, queries))` fits. The brief names one local helper at each hand-over, not a move of the argument. Failure scenario: a merge conflict at landing with any other step that edits the `fs` hand-over block in `context.ts`; behaviour is unchanged. (b) Two new files outside "Paths this step writes": `tests/shell/panes/scope-watch.svelte.ts` (37 lines) and `tests/shell/panes/ShownProbe.svelte` (13 lines). The report lists both as a decision (rune compile needs `.svelte.ts`; the brief's `watch.svelte.ts` observes a store read and these cases need a flag and a run counter). Folder-check passes (8 items). Verdict: accept both as reversible decisions; (a) is the orchestrator's call.

S3. The wiring of the five gated views is checked by no test. Place: `Changes.svelte:72`, `Diff.svelte:243-246`, `Source.svelte:227`, `Graph.svelte:172`, `File.svelte:110,165`. No test file renders them with a gate: `tab-view.test.ts` draws `Memories` and `ShownProbe` only. Removing any one `gate.due(...)` call, or a `gate.clear()` on a reset path, turns no test red. The brief assigns these to look items 16 to 18 and the spec sends DOM behaviour to the look, and `shownGate` itself is tested. Failure scenario: a missing `clear()` (the session A, session B unreadable, session A case the brief names) is found only by the orchestrator's look, and only if the look does that sequence. Verdict: not a violation of the brief; listed so the look includes the reset sequence for Changes, Source and Graph.

### Proof

P1. "Seen failing first" quotes no failure. Place: report check 4: "Each new test fails without its change ... 8 tests red, among them ...". It names test titles per revert and no failure text; it points to a scratchpad file `q66-base-run.txt` that it says it did not rely on. Verdict: the claim reproduces (section 1) but the report did not quote it; same closure as S1.

P2. A statement in the report about behaviour is false. Place: report, decision 2: a File tab drawn hidden "starts with an empty `src`, which draws the same 'reading' fallback a file with no kind yet draws". Quote of the code: `File.svelte:216-217` `{#if src === ''} <Empty message={t('file.none')} ...` and `config/text/views/sources/file.yml:10` `none: No file chosen. Open one from the Files view.`; the "reading" text is `file.loading`, drawn at `:246` for `known === null`. Failure scenario: a File tab mounted hidden would say "No file chosen" while holding a file. This path is unreachable today, because `PaneBody.svelte:62-65` mounts a view only for the active tab or one already seen, so `TabView` first runs with `shown` true; which also makes the `: ''` branch of `let src = $state(untrack(() => (gate.due(addressed()) ? address : '')))` (`File.svelte:110`) dead in practice. Verdict: correct the sentence in the report; no code change needed.

No test asserts a known defect; no threshold is widened; no check is passed by copying or exempting; no file-scope mutable added (`scope`, `queried` and `last` are closure locals; `let heard` in `Diff.svelte` is per component instance); the `audit:` tests (peek/fetch/hold/mark; shown-hidden-shown inside a tick; case 11 list) are named audits, and a test over source text or a constant is absent.

### Standards

T1. The report's "Open items of the state file, verbatim (orchestrator-state.md lines 145 to 156)" is stale. It quotes Z187 and Z190 as open. In the main checkout, `tools/oculus/.scratch/migration/orchestrator-state.md` has an empty "Open items" section (`:169-183`), and Z187 and Z190 are ruled (`:237`, `:240`). The builder read the worktree's older copy. Failure scenario: the saved report opens with two rulings Axel already gave. Verdict: the orchestrator replaces that section when it saves the report.

T2. Cosmetic: after the clause insertions, two comment paragraphs have a ragged short line: `fs.svelte.ts` lines 11-13 ("... ask once when it is shown; a" then "// bookmark is written ...") and `docs.svelte.ts` ("... the entity tag of the held" then "// answer, a 304 ..."). `tests/checks/source/comment-width.test.ts` passes (it checks the 100 limit only). Not a rule breach.

No comment carries a package id or date (grep over added lines of src, tests and DESIGN.md for `[QODXLRSUZ][0-9]+` and `2026` printed nothing). ASCII gate clean. Folders under the limit. No new dependency (`package.json` not in the diff). No file over the limits (largest `queries.test.ts` 741, `Diff.svelte` 537 of 540). Diagram and DESIGN.md changes are the regenerated line numbers and one sentence.

### Behaviour

B1. `File.svelte` now draws from a `$state` `src` that an effect moves (`:110`, `:164-166`), where it was a `$derived` that moved in the same render pass. Failure scenario (not run in a browser): in a shown File tab whose file changes from an image to a PDF, the first render pass already has `type.kind === 'pdf'` (derived from `path`) while `src` still holds the old image address, so `<iframe class="frame" {title} {src}>` (`:232`) is created with the old address and the effect then writes the new one: one request for the old bytes that was not made before. The brief prescribes an effect that sets a `$state`, so this follows the brief; the report's before/after does not mention it. Verdict: put "change a File tab's file between an image and a PDF, watch the network panel" into the look list.

B2. The report states request counts for look items 16 to 20 as predicted from the source and says so; item 19 "Not run by me"; item 21 "not verified". Nothing else user-visible is unstated: hidden tabs of Files, Transcript, Source, Diff, Graph, Changes and File no longer update until shown, which is the ruled change (`plan.md:544`).

## 4. Declined to judge

- Look items 16 to 20 (network counts on TEST, Terminal output after 4 s): they need the browser and the orchestrator's Chrome.
- Case 21 (subject change while hidden, `showing` release) and the effect timing of the five views: no test and no browser here.
- Whether a shared `$derived` outside the ten stores could cache a read suppressed under a hidden tab's scope and so starve a shown tab. I checked that the ten stores hold no `$derived`/`$effect` and that outside `context.ts` only `context.ts:322` calls a store of the ten through its original reference. I did not enumerate every view-level or `selectors` derived, so the absence of such a case is not verified.
- The other 21 of the builder's 24 reverts: I reran three and they matched; the rest are not rerun.
- `tests/server/git/autofetch.test.ts`: seen failing only on a 5000 ms timeout in the discarded first run, not rerun to green, not a file the step changes.
- Whether the full list passes on an idle machine: `npm test` here ended on timeouts in untouched files; `test:checks`, `check`, `build`, `format:check`, `lint` and the ASCII gate were run one by one and passed, but `checks.sh` itself did not print `checks: 7 commands passed` in my run.

## 5. Usage

Not measured by me (no counter available to this agent). About 45 tool calls; the longest were two 6 to 8 minute `checks.sh` runs and the 2 minute test:checks run, under machine load average about 20.

Usage from the completion notice: claude-sonnet-5-5, 197,616 tokens, 55 tool uses, 43.5 min.
