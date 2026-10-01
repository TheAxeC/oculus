NOT done as the brief words it: the cases' first run on the UNCHANGED tree was not taken, because the tree I received already carried the first builder's edits and I run no git command, so no unchanged tree exists in the worktree. The first run below is on the tree as found. What the brief wants it for (a new test fails without the change) is shown instead by 24 single-edit reverts of the source in a scratch copy outside the worktree, listed under check 4. Everything else in the brief is done.

## Open items of the state file, verbatim (orchestrator-state.md lines 145 to 156)

- Z187, the Files view's folder picker against "nothing outside a root served" (raised 2026-10-01 22:15 by X3a's brief check, finding 6.1, `agents/reviews/X3a-brief-check.md`). Z76 (a) rules both a folder picker for Add Folder to Workspace and, among the kept items, that nothing outside a root is served. A picker has to list folders outside every root, since the folder being added is not a root yet. Today nothing lists a folder outside a root; the token that would guard the new listing already lets its holder start a shell (`routes/api/(sessions)/terminal/+server.ts:13`, `handleTerminal(request, server.token, ...)`), so the listing reveals nothing a token holder cannot already read.
  - (a) The picker lists the names of folders under the home folder only, token-gated, folder names and no file and no content. For: VS Code's folder dialog starts at home; the folders a reader adds live there; nothing a token holder lacks. Against: the kept item becomes "no file content outside a root" instead of "nothing".
  - (b) The same, for any absolute folder, `/` included. For: a folder on another volume can be picked. Against: lists system folders no one adds as a root.
  - (c) No listing outside the roots: the picker browses only inside the served roots, and a folder outside them is added by typing its absolute path, checked to exist. For: the kept item stays word for word. Against: adding a new folder means typing its path, which the picker exists to spare; VS Code never asks for a typed path.
  - (d) No picker: the typed path of today stays. The lazy option: it drops the picker Z76 (a) rules.
  - Recommendation (a): the picker Z76 asks for, limited to the folders a root is ever added from, with nothing served that the token's shell cannot already reach. X3a waits on this ruling; its other brief-check findings are closed in automode (Z188).
- Z190, the shape of S4's new confirmed write for lists, key/value families and records (raised 2026-10-01 23:00 at /spec S4; Z168 left the shape to Axel). Today a Settings row writes one scalar: `{ kind: 'config-key', file, key, value }` (`state/client/writes.svelte.ts:371`), edited in place over the bytes and refused unless the edited file parses back with only that key changed, gives no new finding, and passes every reader (`server/edit/writes/config-key.ts:1-20`). Lists are already rewritten in place for the rail, the deck and the audit mute list through `setItems` (`server/edit/list-edit.ts:112`), the whole list's lines replaced and every other line kept.
  - (a) One new kind `{ kind: 'config-value', file, key, value, base }`: the editor sends the whole new list, map or record, and `base`, the value it started from; the server refuses when the file's value is no longer `base` (an edit made elsewhere meanwhile), rewrites only that key's lines over the bytes (`setItems` for a list, the same for a map's entries), and runs config-key's three checks before writing; undo through the change log as every write. For: one shape for the 7 lists, 5 key/value families and 15 records; VS Code's own list and object editors write the whole value to settings.json; reuses the in-place edit the rail already uses. Against: a whole value per save, so two tabs editing one list at once get a refusal instead of a merge.
  - (b) A kind per operation `{ kind: 'config-op', file, key, op: 'add' | 'set' | 'remove' | 'move', at, to, value }`. For: two edits of different items of one list both land. Against: four operations times three families, reorder and rename rules of its own, much more server code, and no counterpart in VS Code.
  - (c) `config-key` widened to take any value. For: no new kind. Against: its head comment and its scalar edit are for one value; the list and map edits are a different byte edit; Z168 asked for a new kind.
  - (d) No editors, the description and the link as today. The lazy option, which Z168 already declined.
  - Recommendation (a): the shape VS Code uses, one write for all three families, with `base` so a stale editor never overwrites an edit made meanwhile. S4 waits on this ruling.

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
2. `File.svelte` keeps the address it draws in a `$state` `src`, set at construction through `gate.due(...)` (a tab drawn hidden starts with an empty `src`, which draws the same "reading" fallback a file with no kind yet draws) and moved by one effect through `gate.due(addressed())`. A File tab opened in the background therefore draws nothing until first shown; the file kind is still read at once (`handOn`, one-shot, as the brief keeps it).
3. `scopedStore` in `context.ts` copies the function members of a recorded store when `wrap` is called, so a member a store replaces later is not followed. I did not verify that none of the ten replaces a member after construction; the doc comment of `scopedStore` (`context.ts:158-161`) states the behaviour.
4. The test "sends one request when the flag goes shown, hidden and shown inside one tick" is named an audit, since no plausible edit turns it red (check 4).

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
