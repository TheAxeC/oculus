Brief check of Q84

Everything below was read on main at 85159a9e (`git log --oneline -1`). Nothing in the repository was changed. The only files written are in the scratch folder `.../scratchpad/Q84-check/`: `npm pack @tanstack/query-core@5.104.0`, extracted to `package/`, and one probe script, `turns.mjs`, run with node 24.21.

The brief cannot be dispatched as written. Six findings each stop it:
- An existing suite cannot pass unchanged: `tests/state/sessions/agents.test.ts:89-100` asserts two requests in flight at once, and its 5-microtask `settle()` is too short for query-core, which I measured.
- `fetchQuery`, which the brief names, is deprecated in 5.104.0, and `npm run lint` rejects deprecated calls.
- The cache listener runs synchronously, so decision 2 (the notify scheduler) rests on a wrong premise.
- A failed fetch marks the query invalidated, so a store whose query function throws would send a request on every read.
- Cases 5, 6, 8 and 17 cannot fail in this repository's test setup.
- Q84 shares `README.md` line 13, `context.ts`, `package.json` and `package-lock.json` with Q102, which is in flight.

## Names

- The brief does not name these test suites, which also exercise the ten stores:
  - `tests/views/sessions/sessions.test.ts:34-41` uses `transcripts.hold` and `forget`. It is also in Q102's paths.
  - `tests/views/sources/files/files.test.ts` (437-591), `tests/views/sources/file.test.ts` (95-248), `tests/views/sources/note.test.ts` (42-92) and `tests/views/boards/person.test.ts` (202-218) call `fs` with a stubbed fetch and window.
  - `tests/state/sources/fs-shape.test.ts:190-211` covers `fs.bump` and `fileVersion`.
  - `tests/state/client/client-state.test.ts:12-57` lists every key of `ClientState` and asserts the exact key set. If the query client becomes a key of the client object, that assertion changes. The brief does not say whether it does.
- `createAccounts` is listed among the constructors that gain the query client. It is not a fetch store; it only changes where it imports `postCommand` from.
- Documentation that goes false if a rule the brief does not list is dropped:
  - `DESIGN.md:319` describes fs's failed-round rule: asked once per round, and cleared by the Failed control.
  - The `DESIGN.md:192` paragraph lists the module-level state ("Three modules stay module-level..."). Calling `notifyManager.setScheduler` at module level writes a library's process-wide state, which the paragraph does not cover.
  - Head comments that describe a store's mechanism: `src/lib/server/root/watch/bookmarks.ts:4-5` (the fs round), `src/lib/views/sessions/transcript/Transcript.svelte:17-20`, `src/lib/views/boards/project/Latex.svelte:16-18`, `src/lib/state/client/writes.svelte.ts:347`. The ten store files' own head comments ("scheduled on a microtask") are in the paths list.
- Revert comments in tests name functions the rewrite removes: `fs.test.ts:480` and `504` (`loadBookmarks`), and `show-in-files.test.ts:547` (`readListing` / `askListing` / `loadListing`).
- `grep -rn "stores/post\|postCommand" src tests` shows only `accounts.svelte.ts:35`, `calendar.svelte.ts:17`, `inbox.svelte.ts:15` and `post.ts` itself; there is no test importer. `boundaries.test.ts` ALLOWED gives the state layer `state/**`, so an import of `../client/writes.svelte.ts` from those three files is allowed.

## The step line

- `plan.md:273` and Z56 (a) (`plan.md:538`, `orchestrator-state.md:153`) map to the brief as follows:
  - "Fetch stores keep their functions and return shapes" is item 3.
  - "Run on query-core directly" is items 1 to 3.
  - "One QueryClient built in createClientState" is item 2.
  - "Socket messages invalidating queries" is item 3 (the `afterReceive` listeners).
  - "A cache subscription waking the reading $derived" is item 2, first bullet.
  - "svelte-query not added" is under Libraries checked.
  - "Command stores keep their shape" is item 4, last sentence.
  - "post.ts folds into writes" is item 4.
- No part of the line or of Z56 (a) lacks an item.
- LA6 (a)'s "`createMutation` for the command stores" is superseded by Z56 (a). The brief correctly builds none.
- The line says "eleven" and the brief says ten files. See Declined to judge.

## Premises

These hold:
- The ten files, 2590 lines, one `queueMicrotask` each: `grep -rc queueMicrotask src/lib/state` and `wc -l`.
- `context.ts:141`, 163, 197, 198, 205-227, 228, 229, 230, 231, 243, 244.
- `socket.svelte.ts:256`, `entities.svelte.ts:47-57`.
- The four direct constructors in tests at the lines given.
- `post.ts` is 38 lines, `writes.svelte.ts` is 465 lines, and its private `post()` is at 118-125.
- `package.json:45`, `DESIGN.md:192`, `README.md:13`.
- `allow-duplication.txt:35-36`.
- Every store line cited for docs, files, latex, fs, agents, lines and transcript.
- The folder counts.
- The npm metadata: `npm view` prints 5.104.0, MIT, the three maintainers, modified 2026-09-26T03:56:42Z, and the package has no dependencies.
- `notifyManager.js:7` (the default is `systemSetTimeoutZero`) and `:109` (`setScheduler`).
- `retryer.js:107` (retry `isServer() ? 0 : 3`), `removable.js:26` (gcTime `isServer() ? Infinity : 3e5`) and `retryer.js:10` (networkMode defaults to online).

This differs: "changes ... older() (142-151)" points at `load`'s query and append. `older()` itself is at 123-127.

Behaviour rules of the stores that the brief does not list, read in the files:

- **docs**
  - An empty id, name or path returns `NOTHING` with no request (164, 173).
  - With no fetch function, `askedAt` is stamped so the key is never asked again in that store (236-238).
  - A mark covers keys still in flight with no answer yet (208).
  - A body that is not JSON replaces what is held and clears the file and the tag (248-255).
  - A 304 is kept only when something is held (246).
  - The tag is sent only when something is held (240).
- **files**
  - `invalidate(id)` deletes the held answer, so the id reads PENDING again with `loading` true (88-93). Query-core's invalidate keeps the data, so this must be `removeQueries` or `resetQueries`. Item 3's "invalidate or reset" leaves the choice open.
  - A JSON parse failure is caught and replaces what is held.
- **latex**
  - `invalidate` deletes the held answer, as in files.
  - `watch` ignores an empty id or terminal.
  - `settle` clears the stamp when the signature moved mid-flight (182-185).
  - `redraw` needs the previous answer, so the query function must read it before its result is written.
- **fs**
  - The failed round per whole-file key, with `retryWorkspaces`, `retryBookmarks` and `retryNotes` clearing it (263, 336-356). `fs.test.ts:595` covers it.
  - `readListing` joins the request in flight and answers even when a newer round began (442-454). `show-in-files.test.ts:547-575` covers it.
  - `readFileKind` shares one promise per key; a failed head read is held as the download (583-624).
  - `heldEntries` and `heldFileKind` answer without a request.
  - `otherForm` draws another toggle pair's answer while this one is on its way (403-413).
  - `relist(shown)` marks only keys already answered (418). The audit at `fs.test.ts:156` asserts that a relist during the first read sends no second request and holds `.env`.
  - A deleted note is never asked for or written again (`gone`, 726, 819).
  - `saveNote` seeds the held note (826).
  - `closeGoneForms` runs on a bookmarks answer only (666-683).
  - An empty root or path returns an empty non-loading answer.
  - The `files.read_offline` answer (452).
  - `bookmarks` follow `message.version > onDisk` only (368).
- **agents**
  - It asks only when nothing is held, so an error answer is never asked again (107).
  - It guards on fetch only, not on window.
  - `refreshCustomizations` sends a second request while the first is in flight (130-131).
- **changes**
  - `error()` does not ask.
  - `hold` sets `asked`.
  - An error keeps the rows (146).
  - `older()` while any request is in flight is dropped.
  - It guards on window inside `load` after `asked` is set, so a server-rendered store never asks again.
- **deposit and memories**
  - `reload` sends at once with no read, and is dropped while a request is in flight.
  - An error replaces what is held (`state: null`, `images: []`).
- **lines**
  - `recount` while a request is in flight sends nothing and leaves the state unchanged (118).
  - An error keeps the count (128-130).
- **transcript**
  - `forget` is exported and used by sessions.test.
  - An error keeps the turns. Offset is `from` in `catch` but the held offset on a non-OK answer (165-182).
  - `merge` mutates `tool.ok` in place on held turns (199-204). With query-core, a tail that patches results and adds no turn gives an answer deep-equal to the held one by reference, so structural sharing returns the old object and the patch is never seen. The query function must copy the turns before patching.
  - Today an in-flight load writes `held[id]` again after `forget`. `removeQueries` would drop that answer instead, which is a behaviour difference.

Decision 4 (a mark during a fetch asks again, in every store) changes observable behaviour. For deposit, memories, lines, changes and agents, today a reload, recount or refresh during a request is dropped; under decision 4 a second request follows. This conflicts with "keeps its observable behaviour".

## query-core

Read from `package/build/modern`, with probes in `turns.mjs`.

- **Default scheduler and `setScheduler`.** The default is `setTimeout(0)` and `setScheduler` exists, as the brief says. But `queryCache.notify` (`queryCache.js:191-197`) calls its listeners synchronously inside `batch`; only observer callbacks use `schedule`. The probe printed "listener ran synchronously on setQueryData: true" and "added event synchronous on build: true". The scheduler therefore has no effect on the cache subscription the helper uses, and decision 2 has no effect on the stores. Calling it writes query-core's process-wide state, against the rules file's "No globals". Recommendation: drop decision 2.
- **`state_unsafe_mutation` hazard.** Because the listener runs synchronously, `read()` must never create the query. `queryCache.build`, `fetchQuery`/`query` and `setQueryData` all fire "added" or "updated" on the caller's stack, which would bump the `$state` tick inside the `$derived`. `read()` has to use `queryCache.get(hash)` or `getQueryState`, which fire nothing (`queryClient.js:223-226`), and create the query only on the microtask. The brief does not state this. No unit test can catch it; see Cases, case 17.
- **Defaults.** Retry, gcTime and networkMode hold as stated. However `fetchQuery` and `query` set `retry = false` when unset (`queryClient.js:376`, `388`). The `isServer` constant (`utils.js:6`) is computed at import, and it is true under vitest's node environment even when a test stubs `window`. So in tests the defaults are already retry 0 and gcTime Infinity.
- **`invalidateQueries` with `refetchType: 'none'`.** It marks a query with no observer (`queryClient.js:304-309`). The probe printed "no-observer query invalidated: true".
- **Success clears the invalidated flag.** `successState` sets `isInvalidated: false` (`query.js`, "success" reducer). The probe printed "invalidated after success of fetch that was marked mid-flight: false". Item 2's re-ask rule is therefore needed. The helper has to record the mark itself, for example from the `invalidate` action event while `fetchStatus` is fetching.
- **A failed fetch marks the query invalidated.** The "error" reducer sets `isInvalidated: true`; the probe printed "invalidated after error: true status error". Under item 2's rule (invalidated and idle means fetch), any store whose query function throws sends a request on every read: the error event bumps the tick, the `$derived` runs again, and it fetches again. The brief does not say that query functions return error-shaped data rather than throw. Only docs' network error over a drawn document wants the re-ask (`docs.test.ts:410-439`).
- **Deduplication.** `fetch` on a query already fetching returns the retryer's promise (`query.js:298-303`). `cancelRefetch` cancels only when data is defined (line 299). The probe printed "requests after second query while in flight + invalidated: 1".
- **`fetchQuery` is deprecated.** `queryClient.js:384` says "@deprecated Use queryClient.query(options) instead", and so does the `.d.ts`. typescript-eslint 8.70.0's `strictTypeChecked`, which `eslint.config.js:41` uses, sets `@typescript-eslint/no-deprecated: 'error'`, and `npm run lint` is in the verify list (`orchestrator-state.md:12`). The brief should name `client.query(...)`.
- **`setQueryData` notifies the subscription**, synchronously (`queryClient.js:185-193`, setData, dispatch).
- **Structural sharing.** `replaceEqualDeep` returns the previous object for a deep-equal answer. The probe printed "same object after equal setQueryData: true". Case 10 is reachable.
- **`gcTime: Infinity` is accepted.** `isValidTimeout` excludes Infinity, so no GC timer is set. The probe printed "gcTime on query: Infinity".
- **Other facts the brief omits:**
  - `refetchOnWindowFocus` and `refetchOnReconnect` only act through observers, and through `mount()`, which nothing calls. They are harmless no-ops.
  - A query function returning `undefined` throws "data is undefined" (`query.js:388-390`).
  - A key that is not an array logs `console.error` in development (`query.js:311`).
  - `onlineManager` starts online and never reads `navigator.onLine` (`onlineManager.js`).

## Cases and checks

Each case can be written in this setup (vitest, node, fetch stubs, `createClientState`, render to string) except as noted:

- **Case 5 is an audit.** It cannot fail from reverting `retry: false`: `query()` defaults retry to false, and `isServer` is true in vitest. To catch the request loop above it must read again after the error, settle, and assert one request.
- **Case 6 is an audit.** It cannot fail from reverting `gcTime`: gcTime defaults to Infinity when `isServer` is true. To be red on the revert it needs `environmentManager.setIsServer(() => false)`, restored afterwards.
- **Case 8 cannot fail as written.** `navigator.onLine` is never read. It needs `onlineManager.setOnline(false)`, restored afterwards.
- **Case 11 cannot pass under item 2 as written.** Two requests in flight at once are impossible with deduplication plus re-ask-after-settle. `query.js:299` does not cancel while there is no data, so the store needs an explicit `client.cancelQueries` before the new fetch.
- **Case 12 cannot be arranged** (an older answer arriving after a newer one), for the same reason. Under the serialised design the older answer is written, shown, and then replaced. That breaks fs's promise that "a listing fetched before a removal cannot reappear after it" (fs.svelte.ts:773-775) for a moment.
- **Case 17 cannot be written.** No test mounts a component: `grep -rln "flushSync\|effect.root\|mount(" tests` prints nothing, and there is no `.svelte.ts` under `tests/`. Vitest compiles runes for the server, which has no reactivity and no `state_unsafe_mutation`. Only the look on TEST can see it.
- **Cases 1-4, 7, 9, 10, 13-16, 18 and 19 can be written.** Case 18 fits the existing `tests/state/client/writes.test.ts`.

The claim that the existing suites pass unchanged is false for these:

- **`tests/state/sessions/agents.test.ts`.** Its `settle()` is five `await Promise.resolve()` (24-26). The probe measured 4 microtask turns from the fetch answer to held state for today's pattern, against 6 turns to query-core's success event, before any helper overhead. The assertions after `settle()` at 53-58 and 77-83 would read PENDING. Its case at 89-100 also asserts `asked` has length 2 while the first request is out.
- **At risk, not red by necessity:**
  - `tests/state/sources/fs.test.ts:156`, if relist marks the in-flight key. The re-ask reuses a consumed Response, `listingAnswer` catches the "body used" error, and `entries` becomes `[]`.
  - `tests/state/client/client-state.test.ts:57`, if the query client joins `ClientState`.
  - `tests/state/system/lines.test.ts:81`, if a recount before the microtask counts as a mark during a fetch.

## The question

- Every existing suite and every case is behavioural, and the brief itself says most pass on today's tree. None fails when a store keeps its own record, its own in-flight set or its own `queueMicrotask`. Case 19 passes trivially today.
- No check in the brief proves the goal: no store has its own record, in-flight set or `queueMicrotask`. It needs fact checks in the verify list, for example:
  - `grep -rn queueMicrotask src/lib/state` prints only `client/queries.svelte.ts`;
  - `grep -n "inflight\|new Set<string>()" ` over the ten files prints nothing that holds requests;
  - each of the ten files imports the helper.
- Cases 5, 6 and 8 pass without their defaults, as shown above.

## Implied inputs

Each with its expected result:

- **An empty id, name, path or root.** `NOTHING` or the non-loading empty answer, no query created, no request.
- **Odd characters in a key.** `hashKey` is JSON.stringify, so they are fine. The key must be an array, or development builds log `console.error`.
- **A query function that would return `undefined`**, for example on the no-fetch path. Never called; the guard answers first.
- **A store read during `showing`'s release or `forget` while the fetch is in flight.** The query is removed, the fetch is cancelled silently, the late answer is dropped, and the next read fetches from 0. Today the late answer comes back into `held`.
- **A `hold` while that key's fetch is in flight.** The value reads at once, and the fetch's answer then overwrites it, as today.
- **A reconnect's fresh channel message with a lower version** (`entities.svelte.ts:49-50` passes it on). docs treats it as a gap and marks everything. files and latex invalidate. fs bookmarks ignore it (`version > onDisk`), as today.
- **An invalidation of a key never read, or read but whose microtask has not yet built the query.** A no-op; the first fetch reads fresh anyway.
- **Two client states.** Separate caches. The notify scheduler, if kept, is shared by both.
- **An abort signal.** A cancel through `removeQueries` or `cancelQueries` aborts the controller. If the store passes `signal` to fetch, the request is aborted. docs' `tagOf(init)` is unaffected.
- **A thrown query function.** An error state plus invalidated, with a request per read unless the store returns error-shaped data.
- **A reload, recount or refresh while in flight.** Today one request; under decision 4, two. The brief must pick one.
- **A transcript tail that only patches tool results.** The patched turns must be visible, which needs copies rather than in-place mutation.
- **New clones among the ten rewritten stores.** `duplication.test.ts` (8 lines, 50 tokens) fails on any clone not in the allow list.

## Folder limit

Counted with `git ls-files <dir> | sed | awk | sort -u | wc -l`:

| Folder | Items | New file from Q84 |
|---|---|---|
| `src/lib/state/client` | 8 | `queries.svelte.ts`, making 9 |
| `src/lib/state/shared/stores` | 3 | none (one file deleted, making 2) |
| `tests/state/client` | 7 | `queries.test.ts`, making 8 |
| `tests/state/system` | 7 | none |
| `tests/state/sessions` | 10 | none |
| `tests/state/sources` | 10 | none |
| `tests/fixtures` | 10 | none |
| `tests/checks/tree` | 10 | none |
| `src/lib/state/{life,sessions,sources,system}` | 10 each | none |
| `src/lib/state/feeds` | 9 | none |

No new file lands in a full folder. Line limits: `fs.svelte.ts` is at 881 of 1000; `writes.svelte.ts` at 465 gains about 25 lines.

## Buildable

- **Item 1** is buildable, subject to the README line 13 clash with Q102 under Shared paths.
- **Item 2 is not buildable as written.** It needs:
  - `client.query` in place of the deprecated `fetchQuery`;
  - `read()` never building the query, since cache events are synchronous;
  - a rule on how errors are held: returned data or thrown, and which errors re-ask;
  - how a mark during a fetch is detected, since success clears the flag;
  - decision 2 dropped, or justified against "No globals";
  - array keys.
- **Item 3 is not buildable as written.** It needs:
  - the cancel semantics for agents' refresh and fs's rounds (cases 11 and 12, `agents.test.ts:89`);
  - `removeQueries` for files and latex `invalidate` and transcript `forget`;
  - the fs rules listed under Premises;
  - copies in transcript's `merge`;
  - a ruling on decision 4 for stores that drop a re-ask today;
  - a ruling on `agents.test.ts`'s 5-microtask `settle` (changing that helper is not an assertion change, but the brief forbids it).
- **Items 4 and 5** are buildable.
- **Item 6** is buildable once `DESIGN.md:319` and the module-level sentence in 192 are added to it.

## Shared paths

- **With D13c:**
  - `DESIGN.md`: D13c changes lines 85, 169 and 289; Q84 changes the paragraph at 192. Different paragraphs.
  - `docs/diagrams/`: both regenerate it.
- **With Q102:**
  - `README.md` line 13: Q102 adds `@xterm/addon-serialize` and Q84 adds `@tanstack/query-core`. It is the same line.
  - `package.json` and `package-lock.json`: both `npm install` a runtime dependency.
  - `src/lib/state/client/context.ts`: Q102 changes the terminals and layout wiring (around 170-196); Q84 adds the query client and store arguments at 163-244.
  - `DESIGN.md` (Q102's Terminal text, around 273).
  - `docs/diagrams/`.
  - The `tests/state/sessions/` suites: Q102 lists that folder's tests, and Q84 adds cases to its agents, changes, latex and transcript suites.
  - `tests/views/sessions/sessions.test.ts`: Q102 lists it, and Q84 exercises it but does not list it.
  - `latex.svelte.ts` reads `terminals.terminals()`, which Q102's `terminals.svelte.ts` changes.
- The rules file says a brief sharing a path with an in-flight brief is not dispatched. The state file's `shared_paths` entry (line 54) covers only D13c and Q102.

## Declined to judge

- Whether the audit's "11 caches" counts the fs sub-caches or an eleventh store. No other `src/lib/state` module has the pattern: `source`, `search`, `hpc`, `usage-refresh`, `accounts`, `inbox` and `calendar` are command or instance-state modules.
- Whether Svelte 5.57's proxy creating a tick source inside a `$derived` on first read is safe. That needs the look on TEST.
- The exact number of extra microtasks the finished helper adds beyond the 6 measured for bare query-core.

## Usage

claude-opus-5-5 (the transcript's message.model), 63 tool uses, 261,106 tokens, 11.3 min (675,946 ms), from its completion notice.

## Closed

Every finding is closed in the brief `agents/briefs/Q84.md`:

- The existing suites: the brief allows two changes to an existing test, the constructor and a wait helper such as `agents.test.ts`'s `settle()`, each named in the report; `agents.test.ts:89-100`'s two requests in flight are kept by the helper's `replace` (cancel and fetch again), case 11.
- `fetchQuery` deprecated: item 2 names `client.query(...)`, and case 21 greps that `fetchQuery` is absent.
- Synchronous cache events: decision 2 on the notify scheduler is dropped (nothing module-wide is set); item 2 says `read` never builds, fetches or writes on the caller's stack and builds the query only on the microtask.
- A failed fetch invalidates: item 2 and decision 2 say a query function answers errors as data and never throws; case 5 reads three times after an error and counts one request.
- Cases 5, 6 and 8: made red on their reverts through `environmentManager.setIsServer(() => false)` and `onlineManager.setOnline(false)`, restored after; case 17 is a look item at landing, since no test mounts a component.
- Cases 11 and 12: `replace` cancels the fetch in flight for `agents`' refresh and `fs`' newer rounds (decision 5).
- Decision 4 against "keeps its observable behaviour": `mark(key, 'again' | 'drop')`, each store using what it does today; cases 14, 15 and 17 check the drops.
- The behaviour rules not listed: added to "What is on the tree" with their lines and required by item 3.
- `removeQueries` for `files.invalidate`, `latex.invalidate`, `transcript.forget` and the release: item 2's `forget`; the late answer after a forget is decision 6, stated.
- The transcript's in-place `merge`: item 3 requires copies; case 13 checks a patch-only tail.
- Tests not named: added to "What is on the tree" and the paths; `ClientState` gains no key (decision 7), so `client-state.test.ts` stays.
- `createAccounts` removed from the constructors that gain the query client.
- Docs and comments: `DESIGN.md:319` kept true; the head comments outside the ten files and the three revert comments are in item 6 and the paths.
- The goal's facts: case 21 greps them.
- Implied inputs: empty keys (case 20), a hold during a fetch (case 9), odd characters and array keys (item 2), `undefined` answers (item 2), a reconnect's lower version (the listeners follow today's rules, item 3), two client states (case 19), new clones (item 3: into the helper, no allow-list row).
- Shared paths with Q102: `README.md` line 13 (one sentence naming each dependency, both added by hand), `package.json` and `package-lock.json` (`npm install` run again on main), `context.ts` (Q102 around 170-196, Q84 at the store constructors), `DESIGN.md` (different paragraphs), `docs/diagrams/` (regenerated), `tests/views/sessions/sessions.test.ts` (Q102 its audits at 352-362, Q84 no assertion); `latex.svelte.ts` reads `terminals.terminals()`, which Q102 keeps. Judged a simple merge and written in the dispatch entry's `shared_paths:`. The rules file's disjoint-paths sentence is open item Z71.
- "Eleven": the brief's premise correction stands (ten files, `fs` holding several caches).
