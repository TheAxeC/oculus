NOT done as the brief words it: the cases' first run on the UNCHANGED tree was not taken, because the tree I received already carried the first builder's edits and I run no git command, so no unchanged tree exists in the worktree. The first run below is on the tree as found. What the brief wants it for (a new test fails without the change) is shown instead by 24 single-edit reverts of the source in a scratch copy outside the worktree, listed under check 4. Everything else in the brief is done.

## Open items of the state file, verbatim

none

## The cases' first run, on the tree as found

Command: `npx vitest run tests/state/client/queries.test.ts tests/state/client/client-state.test.ts tests/shell/panes --reporter=verbose` from `tools/oculus` in the worktree, before I changed any file. Result: 8 test files, 89 tests passed, 0 failed. Cases 1 to 15 are covered by these tests, all green on the tree as found:

| Case | Test (file) | First run |
|---|---|---|
| 1 | queries.test.ts "schedules nothing for a key with nothing held, and asks once in a shown scope" | passed |
| 2 | "answers a marked key as held and refreshing, and asks when read outside the scope" | passed |
| 3 | "does not ask the scope whether it is shown for a key that wants nothing" | passed |
| 4 | "nests: ..." and "keeps a hidden outer scope hidden after a shown inner scope returns or throws" | passed |
| 5 | "marks a held key on refetch and asks nothing, and a read outside the scope then asks once" | passed |
| 6 | "builds no query and asks nothing on refetch of a key with nothing held" | passed |
| 7 | "records a wait, not the again it was given, for a request that is out" | passed |
| 8 | "keeps the again a live caller recorded when a hidden refetch comes after it" | passed |
| 9 | "asks once for two readers of one key, the live one, ..." | passed |
| 10 | "audit: leaves peek, fetch, hold and mark as they are in no scope" | passed |
| 11 | client-state.test.ts "audit: replaces exactly the ten stores handed the query client and no other" and "asks nothing from a hidden copy for a listing or a transcript, and once each from the original" | passed |
| 12 | tab-view.test.ts "shownGate" (6 tests) | passed |
| 13 | tab-view.test.ts "a tab view" (4 tests) | passed |
| 14 | tab-scope.client.test.ts (a), (b), (c) | passed |
| 15 | queries.test.ts "sends a read scheduled while shown after the scope turns hidden, once", "sends one request when the flag goes shown, hidden and shown inside one tick"; client-state.test.ts "follows the flag it was given: asks when shown, and only marks once it answers false for good" | passed |

No case was found that the brief's rules get wrong, so nothing was handed back before changing code. Case 24 by reading: `grep -n "queries\.\(read\|refetch\)\|await \|async " ` over the ten store files shows no function of the ten that awaits and then calls `queries.read` or `queries.refetch`; every `await` in them precedes only `fetch`, `peek`, `hold`, `mark` or `queries.fetch` (`fs.svelte.ts:427-437`, `:522-527`, `:553-557`, `:677-728`), which a hidden scope does not alter. So no case was handed back for 24. Case 26: `grep -rn "PaneView\|SplitView\|PageLeaf" src/lib/views` printed nothing (exit 1) when I ran it. Cases 16 to 20 are the orchestrator's look.

A file `q66-base-run.txt` that the first builder left in the scratchpad shows the new tests failing on a base copy of the source (`queries.scoped is not a function`, `shownGate is not a function`, `Cannot read properties of undefined (reading 'wrap')`). I did not rely on it: that copy's `src` had since been overwritten with the worktree's edits.

## DONE / NOT DONE

Full-list runs: 2. Run 1 stopped at its second command, `npm run test:checks`, on `tests/checks/source/comment-width.test.ts`: two comment lines of mine over 100 columns (`tests/shell/panes/tab-scope.client.test.ts:1`, `tests/state/client/queries.test.ts:706`). Both lines are shortened, that test file rerun alone passed (`Tests 2 passed (2)`), `npm run diagrams` rerun, and run 2 passed in full.

| # | Deliverable | Proof | Status |
|---|---|---|---|
| 1 | `scoped` in `createQueries`, the scope a local of `createQueries`, restored in a `finally`; `read` and `refetch` gated; `peek`, `fetch`, `hold`, `mark`, `forget`, `entries` and `settled` untouched; `Queries` type | `queries.svelte.ts:72-73, 99-116, 202-211, 232-262`; `shapes.ts:262-298`; queries.test.ts "a read and a refetch inside a hidden scope" (16 tests) pass | DONE |
| 2 | `tabScope` member, `TabScopeStore` exported, ten hand-overs recorded through `withQueries`, list local to `createClientState` | `context.ts:96-104, 158-179, 187-197, 380-389`; client-state.test.ts audit test passes | DONE |
| 3 | `SHOWN_KEY`, `provideTabState`, `useShown`, `shownGate`; comments true | `use.ts:1-90`; tab-view.test.ts passes | DONE |
| 4 | `TabView` calls `provideTabState(() => shown)`; head comment says what a hidden view does | `TabView.svelte:2-9, 36` | DONE |
| 5 | Five views gate through one `shownGate(useShown())` each, resets call `clear()`, Diff's subject effect calls `note` | `Changes.svelte:41, 69, 72`; `Diff.svelte:102, 228, 243, 246`; `Source.svelte:211, 224, 227`; `Graph.svelte:124, 169, 172`; `File.svelte:97, 110, 165` | DONE |
| 6 | Terminal unchanged | no file under `terminals.svelte.ts` or the terminal views is among the files I touched | DONE |
| 7 | Docs: `DESIGN.md:194` sentence; every comment the brief names | `DESIGN.md:194` quoted in the file; comments at `docs.svelte.ts:20,164,263`, `fs.svelte.ts:11`, `transcript.svelte.ts:161`, `files.svelte.ts:13-15,93`, `latex.svelte.ts:12,141`, `shapes.ts:266,278`, `queries.svelte.ts:15-24`, `PaneBody.svelte:8-9` read and true for a hidden tab | DONE |
| 8 | Tests: `queries.test.ts` (new describe, 16 tests), `client-state.test.ts` (`STORES` has `tabScope`, new describe, 3 tests), `tab-view.test.ts` (10), `tab-scope.client.test.ts` (3) with `scope-watch.svelte.ts` and `ShownProbe.svelte` helpers | `npx vitest run tests/state/client/queries.test.ts tests/shell/panes tests/state/client/client-state.test.ts` prints `Tests 90 passed (90)` | DONE |

Verify list, from `tools/oculus` in the worktree:

1. `PATH=... npm run diagrams` printed the nine diagram pairs and exited 0 (`diagrams=0`). Then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md` (run 2) printed, in order: `$ npm test` (`Test Files  425 passed | 22 skipped (447)`, `Tests  11114 passed | 619 skipped (11733)`), `$ npm run test:checks` (`Test Files  29 passed | 2 skipped (31)`, `Tests  442 passed | 9 skipped (451)`), `$ npm run check` (`COMPLETED 2960 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`), `$ npm run build` (`built in 17.65s`, `built in 30.88s`), `$ npm run format:check` (`All matched files use Prettier code style!`), `$ npm run lint` (no output), `$ ! LC_ALL=C grep -rna '[^ -~]' src tests` (no output), and the last line `checks: 7 commands passed`; exit 0.
2. Full-list runs: 2 (the first failed as above).
3. `grep -rln "provideTabState\|useShown\|shownGate" src` prints `TabView.svelte`, `use.ts`, `Changes.svelte`, `File.svelte`, `Source.svelte`, `Diff.svelte`, `Graph.svelte` and nothing else. `wc -l src/lib/views/sources/repositories/diff/Diff.svelte` prints `537`.
4. Each new test fails without its change. Method: a scratch copy of the tree outside the worktree (the scratchpad's `q66-base`, its `src` and `tests` synced from the worktree before each run), one edit of the source per run, the four test files run. Edits and the tests they turned red:
   - read without `!hidden()` (M1): 8 tests red, among them the case 1, 2, 4, 9, 13 and 14 (a) tests;
   - hidden refetch invalidates with `hear` false (M2): tab-scope "wakes a reader outside the scope ..." (case 14 b);
   - `waiting` set to `wait` without the `again` test (M3): "keeps the again a live caller recorded ...";
   - `waiting` set to the given mode in a hidden scope (M4): the same test and "records a wait, not the again it was given ...";
   - scope asked before `wants` (M5, and M23 for the copy): "does not ask the scope whether it is shown ..." and the case 14 (c) test;
   - `finally` sets the scope to null (M6): "keeps a hidden outer scope hidden ...";
   - `clear` keeps the values (M7), `due` does not record (M10), `note` records nothing (M11), `due` records while hidden (M21), `due` forgets while hidden (M22): the matching `shownGate` test each;
   - `provideTabState` not called by `TabView` (M8): "makes no request ... while hidden" and "gives the view the flag it was handed ...";
   - `provideTabState` without the state test (M20): "renders with no client state above it";
   - `useShown` default false (M24): "gives the view the flag it was handed ...";
   - the copy always shown (M12): 4 tests red, cases 11, 13, 14 (a), 15;
   - scope restored only when null (M13): 8 tests red;
   - the scope asked again inside the microtask (M14): "sends a read scheduled while shown after the scope turns hidden, once";
   - hidden branch of `refetch` removed (M15): 6 tests red (cases 5, 6, 7, 8, 9, 15);
   - `fetchers` set before the hidden branch (M27): "asks again with the live reader query function, not the one a hidden refetch was given".
   Not turned red by any single edit I could find, stated as audits: case 11's name list (named an audit by the brief); queries.test.ts "audit: leaves peek, fetch, hold and mark ..."; "audit: sends one request when the flag goes shown, hidden and shown inside one tick" (query-core joins a request already out and the microtask runs a schedule once, so removing the pending-schedule test (M18) or having a hidden read drop the schedule (M17) leaves one request; its Revert comment says so). Removing the `getQueryState(key) !== undefined` guard in `deferRefetch` (M16) turns no test red: without the guard a hidden refetch of a key with nothing held only bumps a tick, and no query is built, so the guard is a no-op in effect and no test can tell.
5. `sh utils/folder-check.sh` exit 0 (`folder=0`). The ASCII gate (the perl form of spec.md) over `src tests config` prints nothing. `npm run format:check` passes (above).

## Files changed (line counts now)

`src/lib/state/client/queries.svelte.ts` 308, `context.ts` 433, `use.ts` 90; `src/lib/state/shared/stores/shapes.ts` 298; `src/lib/shell/panes/TabView.svelte` 59, `PaneBody.svelte` (comment); views `Changes.svelte` 235, `Diff.svelte` 537, `Source.svelte` 483, `Graph.svelte` 456, `File.svelte` 311; comments in `docs.svelte.ts`, `fs.svelte.ts`, `transcript.svelte.ts`, `files.svelte.ts`, `latex.svelte.ts`; `DESIGN.md` line 194; `docs/diagrams` (channels, layer-shell, layers, regenerated by `npm run diagrams`); tests `queries.test.ts` 741, `client-state.test.ts` 191, new `tab-view.test.ts` 178, `tab-scope.client.test.ts` 101, `scope-watch.svelte.ts` 37, `ShownProbe.svelte` 13. `tests/shell/panes` holds 8 items.

## Decisions the brief did not cover (each reversible)

1. Two test helper files sit beside the two new tests in `tests/shell/panes`: `scope-watch.svelte.ts` (a `$state` flag and a `$derived` counter, since a rune compiles only in a `.svelte.ts` file) and `ShownProbe.svelte` (a view that draws `useShown()`). The brief names `watch.svelte.ts` of the explorer tests as the pattern; it observes a store read, and these cases need a flag as state and a run counter, so a helper of the folder's own is used.
2. `File.svelte` holds the address it draws together with the root and the path it was taken for, in one `$state` (`drawn`, `File.svelte:112`). A tab drawn shown starts at the file's address; a tab drawn hidden starts with none, draws the `file.loading` line while its file is not drawn, and draws `file.none` only when the tab names no file (`root === '' || path === ''`, `File.svelte:231`). The file kind is still read at once (`handOn`, one-shot, as the brief keeps it).
3. `scopedStore` in `context.ts` copies the function members of a recorded store when `wrap` is called, so a member a store replaces later is not followed. I did not verify that none of the ten replaces a member after construction; the doc comment of `scopedStore` (`context.ts:158-161`) states the behaviour.
4. The test "sends one request when the flag goes shown, hidden and shown inside one tick" is named an audit, since no plausible edit turns it red (check 4).
5. `tests/shell/panes/scope-watch.svelte.ts` and `tests/shell/panes/ShownProbe.svelte` are the two helpers decision 1 describes: a rune compiles only in a `.svelte.ts` file, and a view that draws `useShown()` and reads no store lets `TabView` be rendered with and without a client above it.
6. The `fsForms` local of `state/client/context.ts:278` is the object `createFs` takes (`context.ts:300`); it is a local so that the `withQueries('fs', createFs(...))` hand-over stays one expression.

## Limitations and sharp edges

- The five views' effects (gate, catch-up, `clear`) have no automated test: they need a DOM, and spec.md assigns them to the look. Only `shownGate` itself and the store copy are tested. Look items 16 to 20 are unverified by me.
- A socket `again` mark on a document only hidden tabs read still takes one request while hidden (brief decision 7, unchanged).
- Stores outside the ten that call one of the ten through their own reference are not scoped: `latex` (given the page's `fs`), `repositories` (given `fs.workspaces`, case 22), `explorer` (given `fs`). Their reads from a hidden tab's view are live. `explorer` uses `fs` in `ops.svelte.ts:231, 244, 256-257` (handlers), and `latex` calls only `fs.bump` (`latex.svelte.ts:203`, when a build lands); both are writes or marks, not reads in a derived. Not verified: `repositories` beyond the brief's case 22 statement.
- `explorer.svelte.ts` `bookmarksNow`/`relistFolder` and the stores' `mark` calls after an await run in no scope by design (they mark, which a scope does not alter).

## Before and after for the look (TEST page, the orchestrator)

Counts are what the code now predicts, read from the source, not measured in a browser; the "before" lines restate the brief's description of main.

- Item 16, Files with four folders open, its tab hidden behind another tab of the pane, one bookmark written: before (as the brief describes it, not measured by me), the hidden tab re-lists its four folders. After: 0 listing requests while hidden (the page root's own requests still go); shown, 4 listing requests, then 0.
- Item 17, Transcript of a running session hidden while 3 lines are appended: before, a tail request per `lastActivity` change (up to 3). After: 0 while hidden; shown, 1 tail request and the 3 lines drawn.
- Item 18, hidden over a commit made in a terminal: Source tab (blame off) 0 gutter requests while hidden then 1 on show (2 with blame on); Diff tab 0 then 1; Graph 0 then 1; Changes panel 0 then 1; a File tab holding a LaTeX build's PDF, hidden over a build: 0 PDF requests while hidden, 1 when shown. Each shown again with nothing changed: 0.
- Item 19, a Terminal running `for i in 1 2 3; do echo $i; sleep 1; done` hidden at once, shown after 4 s: the three lines are there (nothing in the terminal code changed; the stream is subscribed whether or not the tab is shown, `terminals.svelte.ts:823-831`). Not run by me.
- Item 20, switching between two tabs of a pane with nothing changed: 0 requests either way (`read` asks the scope only for a key that needs an answer; each gate sees equal values by identity).
- Item 21, a hidden Transcript whose session changes while hidden: nothing asked until shown, then once; `showing`'s release still drops the old session's turns (not exercised by a test; I did not re-read `showing` for this, so the release is not verified).

## Anything in the brief that was wrong or impossible

- "Fails on the unchanged tree" (verify item 4) could not be run on an unchanged tree in this worktree without git; replaced by the reverts above.
- The brief's case 15 phrase "a hidden `refetch` only marks, and no request goes" for a closed tab is covered by client-state.test.ts "follows the flag it was given ..." (shown flips to false, `reload` marks, one more request only from the original).
- Svelte's server `render()` builds the markup when `.body` is read, so `expect(() => render(...)).not.toThrow()` cannot fail; the test of case 13's "throws nothing" reads `.body` inside the call.

## Repair round 1

Full-list runs this round: 2. Run 1 (`sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`) stopped at `$ npm test` with 4 failures in 3 files this round does not touch, all 5000 ms timeouts on a machine at load average 20 to 26: `tests/server/git/autofetch.test.ts` (2), `tests/server/edit/config-key.test.ts` (1), `tests/server/sessions/stores/transcripts.test.ts` (1). Run alone, `autofetch.test.ts` and `transcripts.test.ts` passed (`Test Files 1 failed | 2 passed (3)` for the three files together, the failure being `config-key.test.ts`); `config-key.test.ts` run alone timed out three times on one test and passed in run 2 of the full list. I ran the other six commands one by one after run 1: `npm run test:checks` failed in `tests/checks/tree/duplication.test.ts` (details under ruling 1), the rest passed. Run 2, after that fix, passed in full.

**Ruling 1 (B1).** `src/lib/views/sources/file/File.svelte:105-112`: `drawn`, one `$state` holding `{ src, root, path }`, replaces `src`; it is written together at its first value (`gate.due(addressed()) ? taken() : undrawn()`) and in the effect (`File.svelte:180`, `drawn = taken()`). `src` is `$derived(drawn.src)` (`:113`); `type` is `typeOfFile(drawn.path)` (`:114`); `known` reads `heldFileKind(drawn.root, drawn.path)` (`:117`); `openable` uses `drawn.path` (`:127`); the picture's `alt`, the unreadable message, the other-file line, the download name and the second `ProgramButton` draw from `drawn.path` and `drawn.root` (`:237-264`). `unreadable`'s comparison is with `src`, which is `drawn.src`. The root is held with the path because the file kind is keyed by both. Before: `type` followed the live `path` while `src` moved in the effect, so a shown tab whose file changed from a picture to a PDF built the frame with the picture's address for one pass. After: the kind, the name and the address all come from `drawn`, so a pass draws the old file whole and the next pass the new file whole. No test: the unit suite renders to a string and a `*.client.test.ts` has no DOM, so a change of file in a mounted tab is seen at the look (picture to PDF in one File tab: no frame with the picture's address). `taken()` and `undrawn()` sit below `handOn` (`File.svelte:170-177`) and not above `read`: above `read` the 9-line window it shares with `Source.svelte` and `Note.svelte` is one line longer than the 8 `tests/checks/tree/duplication.test.ts` tolerates (`npx vitest run tests/checks/tree/duplication.test.ts tests/shell/panes/tab-view.test.ts`: `Tests 31 passed (31)`).

**Ruling 2 (P2).** `File.svelte:231-234`: `{#if src === '' && (root === '' || path === '')}` draws `file.none`, `{:else if src === ''}` draws `file.loading`. Decision 2 above states this. Three tests in `tests/shell/panes/tab-view.test.ts` (new, "a tab view" describe), each run with its fix taken out by hand and put back (`npx vitest run tests/shell/panes/tab-view.test.ts`):
- "draws the loading line, not \"No file chosen\", for a File tab that names a file and is hidden". Fix out (the condition back to `{#if src === ''}`): `x draws the loading line, not "No file chosen", for a File tab that names a file and is hidden`, `Tests 1 failed | 12 passed (13)`. Fix back: `Tests 13 passed (13)`.
- "draws the picture of a File tab that is shown". Fix out (a shown tab starting with `undrawn()`): `x draws the picture of a File tab that is shown`, `Tests 1 failed | 12 passed (13)`. Fix back: passes.
- "draws \"No file chosen\" for a File tab that names no file". Fix out (the first branch replaced by `{#if false}`): `x draws "No file chosen" for a File tab that names no file`, `Tests 1 failed | 12 passed (13)`. Fix back: passes.
`File.svelte` is 330 lines.

**Ruling 3 (T2).** The head-comment paragraphs are reflowed to the width the rest of each file uses (lines of at most 99 columns, filled): `src/lib/state/sources/fs.svelte.ts:11-18` ("Nothing polls." to "looking at one line of it.") and `src/lib/state/system/docs.svelte.ts:20-26` ("A marked document is asked for again" to "reloads no figure."). The same raggedness was in the paragraph at `src/lib/state/sessions/latex.svelte.ts:9-16` ("What makes it stale ...", a 53-column line before "The push that finds it gone"); the same cause, so I reflowed it too. `npx prettier --check` on the three files passes, and the full list's comment-width test (`tests/checks/source/comment-width.test.ts`) passes in run 2.

**Ruling 4 (T1).** The section "Open items of the state file, verbatim" above now reads `none`, as the main checkout's `.scratch/migration/orchestrator-state.md` reads (its "Open items" section holds only the intro sentence).

**Ruling 5 (S2).** Decisions 1, 5 and 6 above list `scope-watch.svelte.ts`, `ShownProbe.svelte` and the `fsForms` local with their reasons. No code change.

**Rulings 6 and 7.** Nothing to change.

**Checks, run 2 (verbatim lines from `checks.sh`, after `npm run diagrams` exited 0):**

```
$ npm test
 Test Files  425 passed | 22 skipped (447)
      Tests  11117 passed | 619 skipped (11736)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
1790904012330 COMPLETED 2960 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
✓ built in 21.20s
✓ built in 1m 16s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

`sh utils/folder-check.sh` exit 0. Not covered by anything run: the picture-to-PDF change of file in a mounted File tab (look).
