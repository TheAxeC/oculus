REFUTE REPORT, step Q66 (oculus/migration), worktree /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q66, base 8e5ca1de. I changed no file in the worktree (`git status --short` prints the same 30 lines before and after my runs). My scratch copies are under the session scratchpad (q66rev-base, q66rev-mut).

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

Reruns of the report's evidence, first run on the unchanged tree (see Spec S1): I rebuilt the unchanged source by reverse-applying `git diff 8e5ca1de -- tools/oculus/src` with `patch -R -p3` onto a scratch copy and kept the new tests. `npx vitest run tests/state/client/queries.test.ts tests/state/client/client-state.test.ts tests/shell/panes --reporter=verbose` there printed `Failed Tests 31`. The failure forms: `TypeError: queries.scoped is not a function` (14 queries.test.ts tests), `TypeError: shownGate is not a function` (6) and `TypeError: useShown is not a function` (2) in tab-view.test.ts, `TypeError: Cannot read properties of undefined (reading 'wrap')` (3 in client-state.test.ts plus 3 in tab-scope.client.test.ts), `AssertionError: expected [ '/api/memories' ] to deeply equal []` (tab-view "makes no request ... while hidden"), `AssertionError: expected [ 'tabScope' ] to deeply equal []` (client-state audit), and the two pre-existing client-state tests that list `STORES`. The one new test that passes on the unchanged tree is tab-view "makes the request for the same view when shown", which is the control case. On the changed tree the same four files print `Tests 53 passed (53)`.

I also ran three of the builder's single-edit reverts on a scratch copy of the worktree: removing `&& !hidden()` from `read` turned 8 tests red (the report says 8); `invalidate(key, false)` in `deferRefetch` turned only "wakes a reader outside the scope ..." red (the report names it); removing `if (!shown()) return false;` from `due` turned only "answers false while hidden and records nothing" red (the report names it). All three match.

## 2. Verdicts

What to build:
1. Scope in the query helper: holds. `scope` is a local of `createQueries` (`queries.svelte.ts:72-73`), `scoped` restores in a `finally` (`:107-116`), `read` checks `!hidden()` after `options.enabled && wants(state)` (`:206`), `refetch` has the `drop` return before the hidden branch and `deferRefetch` (`:232-252`) follows the three rules, `peek/fetch/hold/mark/forget/entries/settled` untouched, `Queries` type has `scoped`.
2. The tab's copy of the stores: holds. `withQueries` is used at exactly the ten hand-overs, `queried` and `tabScope` are locals of `createClientState`, `TabScopeStore` is exported from `context.ts`. See Spec S2 for an unrequested restructure of the `createFs` call.
3. The tab provides it: holds. `SHOWN_KEY`, `provideTabState`, `useShown`, `shownGate` with `due/note/clear` as specified; `use.ts` comments are true.
4. TabView: holds. `provideTabState(() => shown)` after `provideInstance`; head comment says what a hidden view does.
5. The five direct re-reads: holds as a diff (each gates through one `shownGate(useShown())`; every reset path calls `clear()`: Changes `:69`, Source `:224`, Graph `:169`; Diff's subject effect calls `note` and the follow effect uses the gate; File sets `src` in an effect). Nothing tests the wiring (see Spec S3, Behaviour B1).
6. Terminal: holds. No file under `terminals.svelte.ts` or the terminal views is in `git diff 8e5ca1de --stat`.
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

# Repair round 1, refuted

Step Q66, worktree /Users/axelfaes/workspace/research-hub/.agents/worktrees/Q66, base 8e5ca1de. I edited no file in the worktree. `git status --short` printed 30 lines before and after my runs. `npm run diagrams` and `npm run build` rewrote only the regenerated diagrams and the ignored `build/` and `.svelte-kit/`. My scratch copies (`mut`, `base`) and outputs are in /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/q66r1/. The scratch copies symlink the worktree's `node_modules`, so vitest may have written its cache there.

## 1. Verification lines

`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams` exited 0 and printed the nine `.dot` and `.svg` pairs.

`checks.sh .scratch/migration/orchestrator-state.md` printed this (load average 21 to 24 on the machine):
```
$ npm test
> oculus@0.0.1 test
> vitest run --tagsFilter '!slow' --exclude 'tests/checks/**'
 ❯ |unit| tests/server/edit/config-key.test.ts (38 tests | 2 failed) 59814ms
     × refuses what is not a finite number for a number option 5530ms
     × refuses a value the reader of its block refuses, with that reader's sentence 5144ms
 Test Files  1 failed | 424 passed | 22 skipped (447)
      Tests  2 failed | 11115 passed | 619 skipped (11736)
checks: failed with exit 1: npm test
```
The line `checks: 7 commands passed` was not printed in my run. Both failures are 5000 ms timeouts in `tests/server/edit/config-key.test.ts`, which the step does not change (`git diff 8e5ca1de --stat -- tools/oculus/tests/server` prints nothing). I named them and did not count the run as a pass of the list.
- `npx vitest run tests/server/edit/config-key.test.ts` alone: `Tests 4 failed | 34 passed (38)`, all `Test timed out in 5000ms`, at load 23.
- `tests/server/git/autofetch.test.ts` alone: `Tests 44 passed (44)`. In a three-file run with `transcripts.test.ts` and `config-key.test.ts` it printed one 5328 ms timeout, "fetches a clone whose path holds a space".
- I did not get `config-key.test.ts` to green. It is not a file the step changes.

Because `checks.sh` stops at its first failing command, I ran the other six commands one by one from `tools/oculus`:
- `npm run test:checks`: `Test Files  29 passed | 2 skipped (31)`, `Tests  442 passed | 9 skipped (451)`, exit 0.
- `npm run check`: `COMPLETED 2960 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, exit 0.
- `npm run build`: exit 0, `built in 14.69s` and `built in 48.20s`.
- `npm run format:check`: `All matched files use Prettier code style!`.
- `npm run lint`: exit 0, no output.
- `! LC_ALL=C grep -rna '[^ -~]' src tests`: exit 0, no output.
- The spec's perl ASCII gate over `src tests config`: no output.
- `sh utils/folder-check.sh`: exit 0.
- `wc -l`: File.svelte 330, Diff.svelte 537.
- `grep -rn "provideTabState\|useShown\|shownGate" src` hits only TabView.svelte (2), use.ts (4), Changes, File, Diff, Graph and Source.svelte (2 each).

## Rerun of the round's evidence

- `npx vitest run tests/checks/tree/duplication.test.ts tests/shell/panes/tab-view.test.ts`: `Test Files 2 passed (2)`, `Tests 31 passed (31)`. This matches the report.
- The three new File tests, each with the fix taken out on the scratch copy `mut`. The baseline there is `Tests 13 passed (13)`. Each mutation reproduces the report's failure:
  - `{#if src === ''}`: `× draws the loading line, not "No file chosen", for a File tab that names a file and is hidden`, `Tests 1 failed | 12 passed (13)`.
  - A shown tab starting with `undrawn()`: `× draws the picture of a File tab that is shown`, `1 failed | 12 passed`.
  - The first branch replaced by `{#if false}`: `× draws "No file chosen" for a File tab that names no file`, `1 failed | 12 passed`.
- The B1 fix taken out on the scratch copy: `type`, `known`, `openable`, `alt`, the download name and the second `ProgramButton` read from live `path` and `root`. The result is `Tests 13 passed (13)`, so no test covers B1. The report says so ("No test ... seen at the look").
- Ruling 3: `git diff 8e5ca1de --word-diff` over `latex.svelte.ts`, `fs.svelte.ts` and `docs.svelte.ts` shows only the intended clause insertions and the re-wrapping, with no word lost. The rewrapped paragraphs have lines of at most 99 columns. `npx prettier --check` on the three files passes. `tests/checks/source/comment-width.test.ts` passes (`Tests 2 passed (2)`).
- Ruling 4: the main checkout's `orchestrator-state.md` "Open items" section (`:197-203`) holds only its intro text, so the report's "none" is true.
- Rulings 6 and 7. I reverse-applied `git diff 8e5ca1de -- tools/oculus/src` onto a scratch copy and kept the new tests. `queries.test.ts`, `client-state.test.ts` and `tests/shell/panes` gave `Tests 32 failed | 61 passed (93)`. That is the first report's 31 plus the new hidden-File test.
- The `taken()`/`undrawn()` move. With both functions placed above `function read` in a scratch copy, `duplication.test.ts` fails: `File.svelte:142 and Source.svelte:305 hold the same 9 lines (2c052d077c43)` and `Note.svelte:105 and Source.svelte:302 hold the same 9 lines (edea524db3b6)`, `Tests 2 failed | 16 passed (18)`. The report's claim reproduces.

## 2. Verdicts, whole diff since the base

What to build:
1. Scope in the query helper: holds.
2. The tab's copy of the stores: holds.
   - Brief decision 3 (the Decisions section) and the report's decision 3 name a risk: no store of the ten replaces a member after construction. I checked it. `grep` for `Object.assign` or `this.` over the ten store files and for assignments to their members in `state/client/*.ts` finds none. A probe test on the scratch copy printed `NONFN []`: every member of the ten is a plain function, with no accessor and no snapshotted primitive.
3. The tab provides it: holds.
4. TabView: holds.
5. The five direct re-reads: holds as a diff. After round 1 the File part (address, root and path moving together through `due([root, path, version])`) holds by reading. Nothing tests the wiring of the five views (see Proof P1).
6. Terminal: holds. No terminal file is in the diff.
7. Docs: holds.
8. Tests: holds. The helpers `scope-watch.svelte.ts` and `ShownProbe.svelte` and the `fsForms` local were kept by ruling 5.

Cases:
- 1 to 15: met. The tests exist and pass on the changed tree. 32 are red on the reverse-patched source, with the error forms the first report quoted.
- 16 to 20: not verifiable here (look items).
- 21: not verifiable (no test).
- 22, 23, 25: not re-judged by me. The first report's verdicts stand and I did not reproduce them.
- 24: the store-member part I re-checked (above). The seven `queries.refetch` call sites are unchanged. I did not re-read them for an await before the call.
- 26: met. `grep -rn "PaneView\|SplitView\|PageLeaf" src/lib/views` prints nothing.

## 3. Findings

### Spec
None in the round. Judged as asked:
- **latex.svelte.ts reflow.** Lines 9-16 of the head comment are rewrapped around the clause the brief already names (`latex.svelte.ts:12`). The words are unchanged (word diff), the file is on the brief's path list, and no ruling named it. Verdict: accepted, comment only, same cause as ruling 3.
- **`taken()` and `undrawn()` below `handOn` (`File.svelte:169-177`).** This is placement only. It adds no exemption: `allow-duplication.txt` and `duplication.test.ts` are unchanged. Placing the functions above `read` fails the held-clone fingerprint, as shown above. Verdict: accepted.

### Proof
- **P1, B1 has no test.** `File.svelte:112-127` and `:237-264` are checked only by reading (see the B1 variant above, 13/13 green). The report states this. Failure scenario: someone restores a live `path` read in the markup and no test fails. Verdict: the look must include a File tab changing file in a shown pane (picture to PDF, and picture to picture) with the network panel open.
- **P2, wording of the new-test evidence.** The report says each of the three new tests was "run with its fix taken out". That holds only for "draws the loading line ...". The other two ("draws the picture of a File tab that is shown", "draws No file chosen for a File tab that names no file") pass without the change: both pass on the reverse-patched base, and both pass on the code before the round's change. They fail only under the wrong variants the report describes (`undrawn()` at start, `{#if false}`). Verdict: they are guards against over-correction, not tests of the added behaviour. The report's sentence should say so.

### Standards
- **S1, residual live reads in File.svelte.**
  - Lines 96 (`title`), 129 (`size`), 206 and 214 (`BookmarkStar` and the header `ProgramButton`, which take `{root} {path}`) and 230 (`data-root`, `data-path`) still read live `root`/`path`/`instance.state`.
  - I found no reader of File's `data-root` or `data-path`. The grep hits are other views' own attributes and their tests.
  - `size` (live) is drawn beside `extensionOf(drawn.path)` at `:255`, and the header `ProgramButton` is gated by `openable` (drawn) but acts on the live `root`/`path`.
  - Failure scenario: for one pass the "other" line pairs the new file's size with the old extension, and the header program control is offered for the old file's extension but acts on the new path.
  - Effects flush in a microtask before paint, and a hidden tab cannot be pressed. No address is paired, and no request is made. Verdict: low, outside the ruling's named list; the orchestrator's call whether to draw `size` and the header controls from `drawn` too.
- **S2, report duplication.** Decisions 1 and 5 in the report both describe the same two helper files. Cosmetic.
- **S3, a claim I could not confirm.** The report's ruling 3 says the latex paragraph had "a 53-column line before 'The push that finds it gone'". I find no such line in the base diff or the current file, and no pre-round tree was recorded. The remaining 63-column line (`What makes it stale ...`) is base text, followed by a token that cannot fit in 100 columns. Not verified, no consequence.
- No comment carries a package id or a date (grep over added lines for ids and years prints nothing). ASCII, formatting, folder limit and file sizes all pass.

### Behaviour
- **B1 closure.** By reading `File.svelte:112-264`, no render pass pairs one file's kind, name, `known` or address with another's, apart from the live reads listed in S1:
  - `src`, `type`, `known`, `openable`, the `alt`, the `unreadable` comparison, the download `href` and name, the "other" extension and the body `ProgramButton` all come from `drawn`.
  - `drawn` is one `$state` holding `{src, root, path}`, written together at `:112` and in the effect at `:180`.
  - `heldFileKind(drawn.root, drawn.path)` still updates: `fs.svelte.ts:505-509` calls `queries.peek(kindKey(root, path))`, and `peek` tracks the key's tick (`queries.svelte.ts:215-219`). When the kind of the drawn file is learned, `known` re-derives. When only the live file's kind is learned (a hidden tab), `known` does not change, and the show then reads it from the cache with no request.
  - Not run in a browser.
- **B2, hidden-first path.** The loading line for a hidden File tab that names a file (ruling 2) is reached only through `TabView` first running with `shown` false. `PaneBody.svelte:56-65` mounts a view only for the active or an already-seen tab, so the path is unreachable in the product today. The report's decision 2 now describes the code correctly.
- No other user-visible change is unstated.

## 4. Declined to judge
- Look items 16 to 20 and case 21: they need the browser and the orchestrator's Chrome.
- B1 in a mounted File tab, and the timing of the five views' effects, the `clear()` on reset paths and the wiring of the five views: no DOM here, and nothing in the unit suite covers them.
- Cases 22, 23 and 25: not re-read.
- Whether the full list prints `checks: 7 commands passed` on an idle machine. In my run `npm test` ended on 5000 ms timeouts in untouched files; the other six commands passed one by one.
- The report's "full-list runs this round: 2" and its first-run failure list (autofetch, config-key, transcripts, duplication.test.ts): no logs were recorded, so I cannot confirm them.
- Whether a shared derived outside the ten stores can cache a read suppressed under a hidden scope. I did not enumerate view-level or selector derived values.

## 5. Usage
Not measured by me; I have no counter. About 45 tool calls. The long runs were `checks.sh` (463 s of tests), two further config-key runs of 107 s and 60 s, six vitest mutation runs of 50 to 80 s each on the scratch copy, and the build, all under load average 18 to 24.

Usage from the completion notice: claude-sonnet-5-5, 210,648 tokens, 50 tool uses, 46.0 min.

## Closed

First run (closed by repair round 1, `agents/briefs/Q66-round1.md`): B1 by the `drawn` state in `File.svelte` (checked by reading by the round's reviewer; no unit test can mount it); P2 by the none and loading branches and their tests; T2 by the reflowed comments; T1 by the report's open items reading "none"; S2 kept as decisions; S1 and P1 closed by the reviewer's reconstruction of the first run (31 red on the unchanged source); S3 and B2 to the look.

Run over round 1 (never sent to the builder; each closed at landing):
- Proof P1, B1 has no test: the look on TEST changes a shown File tab's file from a picture to a PDF and from a picture to a picture with the network panel open.
- Proof P2, two of the three new tests pass without the round's change: the booking says they guard the loading branch against over-correction and test no added behaviour.
- Standards S1, the live reads left in `File.svelte` (`title`, `size`, the header `BookmarkStar` and `ProgramButton`, `data-root`, `data-path`): kept. The header controls act on the tab's own file, which is the live path; the one pass in which `size` or the header control's gate follows the other file ends when the effect flushes, before the browser paints, and asks for no address.
- Standards S2, the report names the two helper files twice: no change; the booking lists them once.
- Standards S3, a line count in the report not reproduced: no decision rests on it; no change.
- Behaviour B1, B2: as the reviewer read them; the look covers B1.
