# Step Q66 brief check (on main at 64275504)

Check of `tools/oculus/.scratch/migration/agents/briefs/Q66.md`. Nothing in the repository was written. All commands were run from `/Users/axelfaes/workspace/research-hub/tools/oculus` unless a path says otherwise.

The brief cannot be built as written, for four reasons detailed below:
- `ClientState` has no `queries` member, so `scopedState` cannot call `state.queries.scoped` (3.1).
- `shell/panes/TabView.svelte` may not import `state/client/tab-scope` under the boundary check (8.7.1).
- Four views re-read on every `git` push through a direct `fetch(`, outside the query helper, so the ten-store gate leaves them working while hidden (8.6).
- The unit suite cannot prove the catch-up on show, since it compiles to Svelte's server build and renders to a string (5.1).

## 1. Names

- `scoped`: `grep -rn "\bscoped\b\|scopedState\|tab-scope" src tests DESIGN.md HELP.md README.md docs` prints 15 hits, all the English word about CSS or themes (for example `src/lib/ui/frame/FloatingList.svelte:76`, `DESIGN.md:368`). None is an identifier, so there is no collision.
- `scopedState`, `tab-scope`: the same grep finds no hit.
- `provideState`: `grep -rn "provideState" src tests DESIGN.md HELP.md README.md docs` prints `src/lib/state/client/use.ts:19` (the definition), `src/routes/+page.svelte:31` and `:43`.
- `Queries` type: `grep -rn ": Queries\b\|as Queries\|satisfies Queries" tests src` prints only the ten `createX(queries: Queries)` signatures and `queries.svelte.ts:38`. No test builds a fake `Queries`, so adding `scoped` breaks none.
- `STATE_KEY`: `src/lib/views/shared/prose/Markdown.svelte:52` reads the key with `getContext` directly. Under a `TabView` it gets the scoped copy; nothing becomes false.

Findings:

1. `src/lib/state/client/use.ts:16-17` says of `provideState`: "Provide one client's stores to everything the root renders. Called by the page and by nothing else." A second call in `TabView` makes that false. Lines 1-2 ("the root provides the object ... and everything below it reads that key") become incomplete. `use.ts` is not in "Paths this step writes". Add `use.ts` to the paths with the comment correction.
2. `DESIGN.md:192` is the paragraph that describes the fetch-and-hold stores: "read from Svelte's context by everything below it (`useState` ...)" and "a read schedules its request on a microtask, a socket message marks the answers it concerns as stale". Both sentences become incomplete under a hidden scope. The brief's item 6 names the "### Client state" paragraph instead (`DESIGN.md:150-152`), which does not mention the query helper at all (`sed -n 150,152p DESIGN.md`). Item 6 and the paths should name line 192.
3. Store comments the change makes false for a hidden tab, while the brief says "no store module is changed":
   - `src/lib/state/system/docs.svelte.ts:20-21`: "A marked document is asked for again on the next call for it, which is the tab still being drawn".
   - `src/lib/state/sources/fs.svelte.ts:11`: "A write marks everything held, which is what makes the next render ask again".
   - `src/lib/state/sessions/transcript.svelte.ts:122-126`: the doc comment of `follow`, "Read what has been appended since the last read".
   - `src/lib/state/sources/files.svelte.ts:75-76`: "a call made after the `files` version moved asks again".
   The rules file ("What every package obeys", the grep-after-a-change bullet) calls a head comment the change makes false a defect of the change. The brief should either add these four files to the paths for their comments only, or state why each sentence still holds.
4. `src/lib/state/client/context.ts:5-6` ("The root provides the object through Svelte's context ... every view, shell component and route reads it from there") is the same case as finding 1, and `context.ts` must be written anyway (see 3.1).

## 2. The step line

- "a tab the pane hides takes no re-read": items 1 to 3, for the ten stores only. No item covers the views that re-read by a direct `fetch(` (see 8.6).
- "and follows nothing until it is shown": item 1 (`refetch`) and item 4 (the Transcript's `follow`). No item covers the two other follows in the tree: `Diff.svelte:202` ("A file's own diff follows the repository") and `Source.svelte:202-203` ("The gutter follows the repository and the file on disk").
- "then catches up once": item 4.
- "a Terminal keeps its stream so no output is lost": item 5.
- Axel's ruling "(a) ... defers its re-reads and its follow until it is shown again, and then catches up once, while a Terminal keeps its stream": same mapping, same gap.
- "(after L3)": `grep -n "L3 " .scratch/migration/plan.md` shows line 150 ticked.

Findings:

1. "takes no re-read" and "follows nothing" have no item for re-reads outside the query helper. 8.6 lists the four effect-driven ones with file and line. The brief should either widen "What to build" to cover them, or carry a ruling from Axel that the step is the ten stores only. The Q65 open item measured only Files and Transcript, but the plan line is general.

## 3. Premises

- PaneView draws `TabView` at 448-453: `sed -n 440,456p src/lib/shell/panes/PaneView.svelte` shows `{#each kept ...}` at 448 and `<TabView {instance} registration={found} shown={instance.id === active} />` at 451. Matches.
- `TabView.svelte` hides with `hidden={!shown}`: line 34. Matches.
- Q65 round 1 item 9: `Q65-report.md:280-294`, table rows "Files, one bookmark written in the minute, hidden (two runs) | 9 / 9 ... 4 / 4" and "Transcript, same, hidden | 127 | 24 | 25". Matches.
- `grep -rn "useState()" src/lib | wc -l` prints `129`. Matches.
- The ten files: the brief's `grep ... | uniq -c` prints ten files (memories 2, agents 1, changes 4, latex 3, transcript 3, files 2, fs 22, deposit 2, docs 2, lines 1). Matches. `context.ts:145` builds `queries` and `:266` is the last hand-over. Matches.
- `queries.read` at `queries.svelte.ts:175-184`. Matches.
- `grep -rn "queries\.refetch" src/lib` prints seven lines in six files (changes twice). Matches.
- `terminals.svelte.ts:846-851` holds `socket.listen(channel, ...)` to `socket.subscribe([channel])` inside `subscribePty` (function opens at 844). Matches.
- `tests/state/client/queries.test.ts` exists. `DESIGN.md:158` holds the sentence. Matches.
- No ADR folder: `ls tools/oculus/docs/adr docs/adr` prints "No such file or directory" twice. Matches.
- `src/lib/state/client` holds nine files: `ls` prints nine. Matches.
- Verify count: the state file's `verify:` block lists seven commands. Matches "checks: 7 commands passed".

Findings:

1. Item 2 says `scopedState` runs the original "inside `state.queries.scoped(shown, ...)`". `ClientState` has no `queries` member: `context.ts:92-137` lists the type with none, `context.ts:145` holds `queries` as a local, and the returned object at `314-354` leaves it out. The step must add `queries` to `ClientState` or hand it to `TabView` another way, and `context.ts` is not in the paths. Adding the member also turns `tests/state/client/client-state.test.ts:59` red (`expect(Object.keys(client).sort()).toEqual([...STORES].sort())`), so that file's `STORES` list needs the edit too. The brief should name `context.ts` and `client-state.test.ts` in the paths and state the shape (a `queries` member on the client object is reachable by every view, which is a design choice to name under "Decisions").
2. Item 1 says `peek`, `fetch`, `hold` and `mark` stay ungated because "an awaited `fetch` is a handler's call, which a hidden tab cannot make". Two effects call it:
   - `src/lib/views/sources/file/File.svelte:139-145`: an `$effect` calls `handOn` inside `untrack`, which awaits `readFileKind` (`fs.svelte.ts:449`, `queries.fetch`).
   - `src/lib/views/sources/files/tree/ShowPath.svelte:73-88`: an `$effect` calls `readListing` (`fs.svelte.ts:346`, `queries.fetch`) inside `untrack`.
   The premise should be corrected, and the brief should say what these two do in a hidden tab (see 6.3).
3. `plan.md` has no "Goal" heading (`grep -n "Goal" plan.md` finds only step lines). The goal used below is the one the dispatch states.

## 4. Cases and checks

- Cases 1, 2, 4 to 9, 16, 19: helper-level calls with a stub fetch, as `tests/state/client/queries.test.ts` already does. Consistent with the rules file.
- Cases 3, 10, 13, 14, 15, 17, 18: inconsistent, see findings 1 and 2.
- Case 11: buildable only as two string renders of `TabView` (see finding 1).
- Case 12: see 5.4.
- Case 20: a list in the report, no test. Consistent.
- Verify 1 and 2: consistent with "Token discipline".
- Verify 3: see finding 4.

Findings:

1. The rules file ("What every package obeys": "A behaviour that needs a DOM (a press, a focus, an effect) is seen at the look on landing. The unit suite renders to a string") rules out several cases as written:
   - Case 10, "pressing that tab causes one": a press. Also, a pane in a string render mounts only its active tab, because `PaneView.svelte:149-154` fills `seen` in an `$effect` and `kept` (`:157`) is the active tab plus `seen`. A hidden kept tab cannot exist in a string render of `PaneView`.
   - Case 13: `follow` is called from an `$effect` (`Transcript.svelte:72-75`), which a string render never runs.
   - Case 14: the terminal grid subscribes in an effect and needs xterm in a DOM.
   - Case 3: "a `$derived` that read through it runs again". Tests run with `environment: 'node'` (`vite.config.ts:31`), and `svelte` resolves to `./src/index-server.js` by default (`node_modules/svelte/package.json:23-28`), whose `derived` is a plain function with no dependency tracking (`node_modules/svelte/src/internal/server/index.js:495-511`). `queries.test.ts:6-7` says the same: "What this does NOT cover: a store read inside a `$derived` on a mounted page, which needs a DOM and is seen at the look on landing."
   - Cases 15, 17, 18: a mount, an unmount and a drag.
   The brief should split the cases into unit cases (helper calls, and `TabView` rendered once with `shown: false` and once with `shown: true` over one client) and named look items for the landing. Each look item needs the view, the state and the request count expected in the network panel.
2. The intro says "cases 10, 11 and 13 to 15 render components", and the paths say "`tests/shell/` and `tests/views/` the tests of cases 10, 11 and 13 to 19". Cases 16 and 19 are helper-level and cases 17 and 18 need a DOM. The two sentences should agree, case by case.
3. Folder limit ("at most ten tracked items in a folder"). Counted with `git ls-files -co --exclude-standard`: `tests/views` holds 10, `tests/views/sessions` 10, `tests/views/sources` 10, `tests/views/sources/files` 4, `tests/shell` 6, `tests/shell/panes` 4, `tests/state/client` 8. A new file for the Transcript or Terminal case cannot go in `tests/views/sessions`, and none can go in `tests/views` itself. The brief should name each test file: new ones in `tests/shell/panes/`, `tests/views/sources/files/` and at most two in `tests/state/client/`, and existing files (`tests/views/sessions/sessions.test.ts`) where a folder is full.
4. "each new test naming the revert that turns it red" (Conventions and Verify 3) sits beside the rules file's "there is no browser suite and no revert directive, and a step adds neither". The tree's form is a prose comment (`tests/shell/workbench.test.ts:300`, `tests/state/client/queries.test.ts:59`). The brief should say "a prose `// Revert:` comment as in `queries.test.ts`, no directive".
5. The rules file asks that "every asynchronous path is exercised in flight, after close, and superseded by a later one". In flight is case 16 and after close is case 17. Superseded has no case: a tab hidden between `schedule` and its microtask (`queries.svelte.ts:164-172`), and a tab shown, hidden and shown again inside one tick.

## 5. The question

Could each pass without the goal being reached?

- Cases 1, 2: no. They fail with the gate out of `read`.
- Case 3: yes. In the server build a second call with `shown` true passes whether or not `shown()` makes a client `$derived` depend on it (finding 1).
- Case 4: yes. It passes with a quiet mark, which leaves a shown reader of the same key stale (finding 2).
- Case 5: no.
- Cases 6, 7, 8: they assert preserved or structural behaviour; no for what they claim.
- Case 9: yes in part. It passes for `fs` while another store's functions are unwrapped; case 12 is meant to close that and does not (finding 4).
- Cases 10, 11, 13: yes. In a string render with no stubbed `window`, `inBrowser()` is false (`src/lib/state/shared/stores/in-browser.ts`), so no fetch is ever scheduled, with or without the gate. They prove the gate only when the case stubs `window` and also asserts that the same render with `shown: true` does fetch.
- Case 14: yes. At store level `subscribePty` is unchanged code and passes on the unchanged tree; it says nothing about a terminal drawn at no size (finding 5).
- Cases 15 to 19: 16 and 19 no; 15, 17, 18 cannot be run in the unit suite.
- The check on the step's line (the seven verify commands): yes. All seven pass with the four direct-fetch views still re-reading while hidden (8.6).
- Item 1 (`scoped`): yes, see findings 1 and 2.
- Item 2 (`scopedState`): yes, see finding 4 and 8.1.
- Item 3 (`TabView`): yes, the boundary check refuses the import (8.7.1), and the catch-up has no unit proof.
- Item 4: it is the statement of the goal; its proof is the look.
- Item 5: yes, finding 5.
- Item 6 (docs): yes, it names the wrong DESIGN paragraph (1.2).

Findings:

1. "Then catches up once" has no proof in the unit suite. A wrapper that read `shown` once at mount, or a store read made inside `untrack`, would pass every case and never catch up. The brief should make the catch-up a named look item with counts: Files with four folders open, hidden, one bookmark written, then shown gives 4 listing requests; Transcript hidden for three appended lines, then shown, gives 1 tail request.
2. Decision 3 ("A hidden `refetch` marks quietly as `wait` does") contradicts item 4 ("A key read by a shown tab and by a hidden one is asked once, by the shown one"). `transcript.svelte.ts:128-137` keeps `marks[id]` per store, not per tab. With two Transcript tabs on one session, one hidden and one shown, the first effect to run consumes the stamp (`:132-133`). If the hidden tab's runs first, its `refetch` is gated; with a quiet mark the shown tab's `turnsFor` derived is not woken, its own `follow` returns at `:132`, and the shown transcript stays stale. The hidden `refetch` must mark with readers woken (`invalidate(key, true)`, `queries.svelte.ts:97-105`), so the shown reader's next read asks. The brief needs a case: "`refetch` in a hidden scope while a live reader holds the same key: the fetcher is called once, without a further call from the hidden side".
3. Item 1 makes `read` call `shown()` on every call. Every derived of a tab that reads one of the ten stores then re-runs on each hide and each show, and store functions that answer fresh arrays (`Files.svelte:180-187`, `treeRows`) redraw the view twice per tab switch. `TabView.svelte:3-4` promises "nothing is built again". Calling `shown()` only where `read` would otherwise schedule (`options.enabled && wants(state)`, `queries.svelte.ts:179`) gives the same catch-up, since a later mark bumps the key's tick and the re-run then reaches `shown()`. The brief should either specify that, or name the cost and have it measured at the look.
4. Case 12 cannot do what it says. "Calling each through a hidden scope" needs arguments per function, and most read functions return early on an empty argument (`fs.svelte.ts:294`, `transcript.svelte.ts:113`, `deposit.svelte.ts:90`, `files.svelte.ts:80`, `latex.svelte.ts:94`, `docs.svelte.ts:151`), so a store missing from the list schedules nothing and passes. Reading `context.ts` as text is an audit under the rules file. A form that computes the fact: `createClientState` records the stores it hands `queries` to (the list lives where the hand-over is, `context.ts:167-266`), and `scopedState` wraps that list.
5. Item 5 builds nothing and case 14 proves nothing about a hidden tab. Q65's report says a running Terminal hidden was not measured (`Q65-report.md:223`, `:294`). "No output is lost" should be a look item: start a terminal, hide its tab, write output, show the tab, and the lines are there.

## 6. Implied inputs

Missing from "Cases", each with the result it should have:

1. `refetch` in a hidden scope while a fetch of the key is out and `waiting` already holds `again` from a live caller (`queries.svelte.ts:210-213`): the hidden call must not downgrade `again` to `wait`. One request follows the landing, as today.
2. A socket mark with `again` (`docs.svelte.ts:198`) while the fetch a tab started before it was hidden is out: `settled` schedules the next fetch with no reader check (`queries.svelte.ts:156-157`). Expected result to state: one more request goes out for a key whose only reader is hidden, or `settled` marks instead; the brief picks one.
3. An awaited `fetch` from an effect of a hidden tab (`File.svelte:139-145`, `ShowPath.svelte:73-88`): ungated as the brief stands. Expected result to state: it asks, since the caller awaits the answer, with the occasions named (a hidden File tab whose file changes, a reveal asked of a hidden Files tab).
4. A hidden tab whose subject changes while hidden (the rail's Transcript tab follows the selected session): the read of the new key asks nothing until shown, then asks once; the old session's turns are still dropped by `showing`'s release (`transcript.svelte.ts:162-171`).
5. An unwrapped store that calls one of the ten: `repositories` is handed `fs.workspaces` (`context.ts:270-271`), so a call from a hidden Repositories tab reads with no scope and is live. The callers are handlers (`repositories.svelte.ts:225`, `:236`). Expected: live, stated.
6. A wrapped store that calls another wrapped store's original: `latex` is handed the page's `fs` (`context.ts:251`) and calls `fs.bump` (`latex.svelte.ts:163`) after an await. Expected: a read made synchronously inside a wrapped call is gated by the dynamic scope; anything after an await runs with no scope.
7. A handler that awaits a write and then calls `reload` after its tab was hidden (`Deposit.svelte:125-132`, `Memories.svelte:180-188`, `History.svelte:98-104`): gated, the key marked, one request when shown.
8. `changes.older` gated in a hidden scope (`changes.svelte.ts:146-150`): the next live read asks with the first-page fetcher, so the older page is not fetched. Expected result to state; the only caller is a press (`History.svelte:170`).
9. The page root's own reads stay live: `+page.svelte:47`, `:109`, `:160` read `fs.workspaces` and `fs.bookmarks`. After one bookmark write with a hidden Files tab, the bookmarks and workspaces requests still go; case 11's "no listing request" should say so, so the look's count is not read as a failure.
10. A folded pane: `SplitView.svelte:4` draws a collapsed child through another snippet, so its views are unmounted, not hidden. Expected: nothing to gate, stated.

## 7. ADRs

- `tools/oculus/docs/adr`: does not exist. `docs/adr` at the repository root: does not exist. `ls tools/oculus/docs/adr docs/adr` prints "No such file or directory" for both; `tools/oculus/docs` holds `diagrams` only. The state file's configuration block has no `adr:` key. No record.

Findings: none.

## 8. The design against the code

### 8.1 Reads that escape the wrapper

- Views are drawn only by `TabView`: `grep -rn "\.component\b" src/lib src/routes` prints `TabView.svelte:31` and `src/routes/views.ts:60` (a comparison). No `mount(` or `hydrate(` of a component exists in `src` (the four `mount(` hits are local functions and Monaco zone calls).
- No store is passed as a prop: `grep -rnE "client=\{|\{client\}|fs=\{|docs=\{" src/lib/views src/lib/shell` prints nothing.
- `selectors` is built from `entities`, `layout` and `selection` (`context.ts:277`) and reads none of the ten.
- The ten stores are flat: each returns an object literal of functions (`fs.svelte.ts:677-710`, `transcript.svelte.ts:196`, `docs.svelte.ts:277`, `latex.svelte.ts:204`, `files.svelte.ts:142`, `changes.svelte.ts:152`, `agents.svelte.ts:136-142`, `deposit.svelte.ts:112`, `memories.svelte.ts:127`, `lines.svelte.ts:149`). `fs.notes` is a function, not a nested store; one level of wrapping reaches every function.
- Outside a tab, the ten are read by the page root only: `+page.svelte:47` (`fs.bookmarks`, `fs.workspaces`). That is decision 4.

Findings:

1. Store-to-store captures at construction: `latex` holds the page's `fs` (`context.ts:251`) and `repositories` holds `fs.workspaces` (`context.ts:270-271`). See 6.5 and 6.6 for what each does; the brief should state both.

### 8.2 What a store function does besides reads

- Getters: `grep -rnE "get \w+\(\)"` over the ten files prints nothing. No `$state` proxy is returned; `fs`'s `written` rune (`fs.svelte.ts:248`) is read through `fileVersion`.
- Functions answering functions: `transcripts.showing` answers a release function (`transcript.svelte.ts:154-172`) that calls `queries.forget`, which the gate leaves alone.
- Identity: `grep -rnE "(===|!==)\s*(fs|docs|files|latex|deposit|memories|lines|changes|agents|transcripts)\.\w+"` over `src` prints nothing. `fs.shiftForms` is `forms.shift` itself (`fs.svelte.ts:705`); a wrapper around it changes nothing a caller compares.
- Async functions whose later part calls `read` or `refetch`: none. `fs.act`, `noteAct`, `saveNote` and `bookmarkWrite` call `mark` and `hold` after their await (`fs.svelte.ts:621-675`); `latex.load` calls `fs.bump` (`latex.svelte.ts:136`, `163`). `readListing` and `readFileKind` reach `queries.fetch` before any await.

Findings: none beyond 6.1 and 6.8.

### 8.3 Svelte's context and the `shown` dependency

- `setContext` under the same key in a child is legal and shadows for the subtree only: `node_modules/svelte/src/internal/shared/context.js:52` gives each component `new Map(parent's map)` on first use, and `client/context.js:138` sets the key on that copy. `TabView` already does this for the instance key (`TabView.svelte:29`). `useState()` evaluated as the argument reads the parent's value before the set.
- `() => shown` with `shown` from `$props()` (`TabView.svelte:27`) reads the prop's signal at call time, so a call inside a descendant's `$derived`, template expression or `$effect` registers it. This is read from the Svelte source, not run: the suite has no DOM (see "Declined to judge").

Findings: none.

### 8.4 Callers of `read` outside a reactive context

- The read functions are called in `$derived` values or template expressions at every site found (`Memories.svelte:58`, `Help.svelte:44`, `Transcript.svelte:53`, `Deposit.svelte:65`, `Doc.svelte:63`, `Files.svelte:165`, `:180-187`, `:201`, `:226`, `Sections.svelte:76-78`, `Person.svelte:68`, `Search.svelte:53`, `Composer.svelte:81`, `:88`, `:100`, `Customizations.svelte:49-58`, `AttachPicker.svelte:28`, `:37`, `BookmarkStar.svelte:30`, `CustomizationView.svelte:54`, `Config.svelte:107` as `{@const}`).
- `Customizations.svelte:89` calls `workspaces()` in a handler; no catch-up is needed there.
- `untrack` sites that touch the ten: `Sections.svelte:80-86` calls the three `retry*` functions (`peek` and `mark`, ungated), and `File.svelte:144` and `ShowPath.svelte:84` call the awaited reads (3.2).

Findings: none for `read`. The two `untrack` sites with `fetch` are 3.2.

### 8.5 The seven `refetch` calls, and "as `wait` does"

- From an effect: `transcript.svelte.ts:136` (`follow`), called at `Transcript.svelte:72-75`. This is the only one a hidden tab makes on its own.
- From a handler, after an await: `memories.svelte.ts:124` (`Memories.svelte:188`), `deposit.svelte.ts:109` (`Deposit.svelte:132`), `changes.svelte.ts:142` (`History.svelte:104`).
- From a press: `changes.svelte.ts:149` (`History.svelte:170`), `lines.svelte.ts:146` (`LineCounts.svelte:89`), `agents.svelte.ts:113` (`Customizations.svelte:117`).

Findings:

1. "Marks the key as `wait` does, without waking readers" is not defined in `queries.svelte.ts`. `wait` has two behaviours and both wake readers: with a fetch out, `refetch` sets `waiting` (`:210-213`) and `settled` later calls `invalidate(key, true)` (`:154-155`); with none out, `markOne` calls `invalidate(key, true)` (`:235`). The only path that wakes no reader is `invalidate(key, false)` (`:97-105`), used for `leaveStale` (`:158-160`). The brief should say which calls the hidden `refetch` makes: with a fetch out, `waiting.set(hash, 'wait')` unless it holds `again`; with none out, `invalidate(key, true)` when the key has a query, and no `schedule`. Waking is required by 5.2.

### 8.6 Requests a hidden tab makes outside the query helper

Re-reads on a channel push, from an effect, which the ruling covers and the brief does not:

1. `src/lib/views/sessions/changes/Changes.svelte:72-83` calls `load`, which fetches `/api/git?root=` at `:90`, on every state the `git` channel sends.
2. `src/lib/views/sources/repositories/diff/Diff.svelte:203-213` calls `load` (`fetch(diffUrl(state))` at `:161`) on every new repository state.
3. `src/lib/views/sources/source/Source.svelte:204-215` calls `readGutter`, whose `readOne` fetches at `:220` (the gutter marks and the blame), on every repository state and every save.
4. `src/lib/views/sources/repositories/graph/Graph.svelte:117-129` calls `load(0)` (`fetch(graphUrl(root, skip))` at `:181`) whenever the head, branch, ahead, behind, tags or branches move.

A page with several source tabs or diffs kept hidden re-reads each of them on every git push; this is the same cost Q65 measured for Files, on a channel that moves more often. The brief's "No view and no store module is changed" excludes them. Either the step gates them (a `shown` value a view can read, provided by `TabView` beside the instance, with each effect returning early while hidden and running once when shown), or Axel rules that they are a later step, booked.

One-shot reads on a change of subject, not re-reads (the ruling does not name them):

- `Merge.svelte:99-104` (`:110`), `CommitFiles.svelte` (`:50`), `Diagram.svelte:57-60` (`:40`), `Source.svelte:283-289` into `source.svelte.ts:117` and `:133`, `File.svelte:139-145`.

No request while hidden:

- `terminals`: the list comes in the `sessions` payload; `pty-io.ts:71` (`readBusy`) runs for a close question (`terminals.svelte.ts:800`).
- `hpc.svelte.ts:49`: a posted command from a press. `feeds`: pushed. `search.svelte.ts:101`: a typed query.
- Timers: `Agents.svelte:66` moves a clock value each second and makes no request; `repositories.ts:223-241` writes instance state; `Reveal.svelte:23`, `ProjectCard.svelte:255`, `Terminal.svelte:288`, `TerminalGrid.svelte:381` are UI timers. This is the list case 20 asks the builder for.

### 8.7 Tree checks the change would turn red

1. `tests/checks/tree/boundaries.test.ts:95-110`: the shell's allowed imports name `state/client/context`, `state/client/use` and `state/client/instance-context`. `matches` (`:164-170`) is exact, so `TabView.svelte` importing `$lib/state/client/tab-scope` is reported as "shell/panes/TabView.svelte imports state/client/tab-scope". Options for the brief: put the call behind a function of `state/client/use.ts`, which the shell may already import (for example `provideTabState(shown)`, with `use.ts` added to the paths); or add a row to the check, which widens a rule and is the orchestrator's decision to state, with `boundaries.test.ts` in the paths.
2. `tests/state/client/client-state.test.ts:59` goes red if `ClientState` gains `queries` (3.1).
3. `findShellStores` (`boundaries.test.ts:305-318`) flags `client.<name>` and a destructuring of `useState()` in a shell file for any store outside `SHELL_STORES` (`:283-293`). `provideState(scopedState(useState(), () => shown))` passes; a `TabView` that wrote `client.queries` would not.
4. Folder limit: `src/lib/state/client` goes from 9 to 10, which passes and leaves no room; `tests/state/client` holds 8, so at most two new test files (4.3).
5. Module-level state (`boundaries.test.ts:226-234`): the current scope must be a variable inside `createQueries`, not a module-level `let`; an exported list written as a non-empty array literal passes the pattern. The brief says "`createQueries()` gains", which fits; it should say "held inside `createQueries`" outright, since the rules file's "No globals" is what a module-level `let` would break.
6. Comment width (`comment-width.test.ts:21`, 100) and file size (`size.test.ts:30-31`, 900 and 540): no file the step writes is near either line (`queries.svelte.ts` 263, `TabView.svelte` 53). Duplication: not judged (see below).

## Declined to judge

- Whether vitest compiles `.svelte.ts` for the server in this project: read from `vite.config.ts:31` and Svelte's export map, not run. A run would need a new test file, which this check may not write.
- The `shown` dependency of 8.3 in a browser: read from Svelte's source; no DOM is available and no browser was opened.
- The duplication check (`tests/checks/tree/duplication.test.ts`): whether the new tests would clone existing stubs depends on code not yet written.
- Whether gating the four direct-fetch views belongs in Q66 or a step of its own: Axel's call; 8.6 gives the evidence.
- Whether a `queries` member on the client object is acceptable as a shape: the orchestrator's decision to state in the brief.
- How a maximised pane draws the panes behind it: `Workbench.svelte:126` says it "is drawn alone"; not read further.
- Path overlap with Q35, which is on the same queue set and touches the session views: not part of the template's checks.
- The full suite and `checks.sh`: not run, by the dispatch's limits.

Agent usage: claude-opus-5-5, about 245,000 tokens, 34 tool uses, minutes not measured.


Usage, from the completion notice: claude-opus-5-5 (agent afc0e98be07417e0e), 257,261 tokens, 47 tool uses, 565,766 ms.

## What follows from it

Q66 waits for X3d's landing: the step must also gate the re-reads four views make through a direct `fetch` (section 8.6), and two of them, `diff/Diff.svelte` and `graph/Graph.svelte`, are files X3d rewrites, so the later landing would be a hand merge of their load effects. The brief this check read is not kept; `/spec` writes it again from main's head after X3d lands, with this report's findings as its premises: the scope handed to the tab through `state/client/use.ts` (the boundary check refuses another import), the stores handed the query helper recorded where they are built, a hidden `refetch` waking the key's readers, `shown()` read only where a read would schedule, a `shown` reader for the four direct-fetch effects, the unit cases as helper calls and the catch-up and the Terminal as look items with request counts.
