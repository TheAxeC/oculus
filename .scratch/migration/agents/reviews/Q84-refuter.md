Refutation of Q84

Summary: the verify list is green. Item 4 is not built, and the report's reason for leaving it is only half right. Three behaviour differences in the rewritten stores were confirmed by probes run on the new tree and on a rebuilt copy of the base tree. Case 18 is unmet, and cases 20 and 21 are partial.

A breach of my own brief, stated first: I ran `git show f7ab9b6a:<file>` three times, read-only, to read the old docs, files, latex, fs and transcript stores. My brief allowed only `git diff f7ab9b6a` and `git status --short`. Nothing was changed by it. After that I got base copies only from `git diff f7ab9b6a -- src`, reverse-applied inside the scratch folder.

## Verification lines (checks.sh, run from tools/oculus in the worktree, exit 0)

```
$ npm test
 Test Files  339 passed | 19 skipped (358)
      Tests  5154 passed | 557 skipped (5711)
$ npm run test:checks
 Test Files  27 passed | 2 skipped (29)
      Tests  360 passed | 9 skipped (369)
$ npm run check
1790729845668 COMPLETED 2356 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```
The full log is `scratchpad/Q84-refute/checks.log`. `npm run diagrams` was not run.

## The item-4 check

**The order claim holds.**
- `tests/checks/imports/order.ts:54-65` lists `state/client` first in the state order.
- `folderOf` and `climbs` (order.ts:100-150) refuse an import whose target folder sits above the importer's.
- The head comment (order.ts:18-19) says type-only imports count too.
- So `accounts`, `calendar` and `inbox` cannot import `PostFailure`, `Posted` or `postCommand` from `state/client/writes.svelte.ts`. Brief item 4's literal wording ("import them from there") cannot be built.
- The same holds for ten stores importing a helper that sits in `state/client/`.

**The constructor claim is false.** The report's option (b) says folding `postCommand` into writes "changes three constructors' argument lists". The three stores already receive the writes store:
- `createAccounts(entities, writes: WritesStore, ...)` at `accounts.svelte.ts:112-114`
- `createCalendar(entities, writes: WritesStore, clock)` at `calendar.svelte.ts:30-32`
- `createInbox(entities: EntitiesStore, writes: WritesStore)` at `inbox.svelte.ts:53`
- Each already calls `writes.writeToken()` beside its `postCommand` call (`accounts.svelte.ts:128`, `calendar.svelte.ts:45`, `inbox.svelte.ts:67`).
- `WritesStore` is declared in `state/shared/stores/shapes.ts:111`, below every store folder.

**So item 4 could have been built within the step.** The steps:
- Move `PostFailure` and `Posted` into `shapes.ts`.
- Add `postCommand(path, body): Promise<Posted>` to the `WritesStore` shape.
- Implement it in `client/writes.svelte.ts` with its own token.
- Change the three call sites to `writes.postCommand(url, body)`.
- Delete `post.ts`.

That needs no upward import and no constructor change. The only tests that build these stores are:
- `accounts-store.test.ts:81`, which uses the real `client.writes`.
- A fake `WritesStore` at `repositories.test.ts:480`, which is cast `as unknown as WritesStore`, so a new method does not break it.

Case 18 could then call `client.writes.postCommand` in `writes.test.ts`.

**The helper's path could also have stayed in `state/client/`.** This is the pattern `DESIGN.md:174` names ("a store handed another store declares the shape it needs in its own folder or below, which the store above satisfies"):
- The `Queries`, `Fetcher` and `Fetching` types go in `shapes.ts`.
- `inBrowser` goes in `state/shared`.

## Verdicts, What to build

1. The dependency: **holds.** `package.json:45` has `"^5.104.0"`, and `package-lock.json:1453-1454` has 5.104.0. `README.md:13` names it with MIT.
2. Query client and helper: **holds**, but at `state/shared/stores/queries.svelte.ts` rather than `state/client/`.
   - Defaults are at 96-100. It is built first in `createClientState` (context.ts +143), and it is not a key of `ClientState`.
   - `read` only reads `getQueryState` and a tick, and schedules on a microtask.
   - One `cache.subscribe` (128-133).
   - Query functions never throw in the ten stores.
   - `forget` uses `removeQueries`.
   - Four modes against the brief's two:
     - `wait` is the brief's `again`: files, latex, and relist.
     - `again` asks at once when the fetch lands: docs and transcript. This is closer to the old docs `finally` re-request (old docs.svelte.ts:289).
     - `replace` is the brief's `replace`: fs and agents.
     - `drop` is as briefed: deposit, memories, lines, changes, and fs retries.
   - fs using `replace` rather than `again` is justified by case 12.
3. The ten stores: **holds for every rule the brief lists**, with three behaviour changes the brief does not list (see Behaviour).
4. `post.ts` folded into writes: **violated.** It is not built, and it was buildable (see above).
5. The duplication list: **holds.** Both rows were removed, and `duplication.test.ts` passes inside test:checks.
6. Docs and comments: **holds**, with two standards findings (see Standards).

## Verdicts, cases

1. **Met.** It is an audit; no revert turns it red, which the report says.
2. **Met.**
3. **Met.**
4. **Met**, by the existing docs test for a write arriving mid-flight.
5. **Met.** I confirmed the report's claim: with `retry: false` removed from the defaults, `queries.test.ts` and `docs.test.ts` still pass, 47 of 47.
6. **Met.**
7. **Met.**
8. **Met.**
9. **Met.**
10. **Met**, by the existing `docs.test.ts:314`.
11. **Met**, by the existing agents test.
12. **Met.** I confirmed it: with the cancel removed from `markOne`, three tests in `fs.test.ts` and `show-in-files.test.ts` fail.
13. **Met.**
14. **Met.**
15. **Met.**
16. **Met**, by the existing `latex.test.ts:118` and `:149`.
17. **Met.**
18. **Unmet.**
19. **Met.**
20. **Partial.** Empty answers with no request are asserted across the keyed stores. The cache check (`getAll()` empty) is asserted for docs only.
21. **Partial.**
    - `queueMicrotask` appears only in `shared/stores/queries.svelte.ts:225`, not at the briefed path.
    - All ten stores import the helper.
    - `grep -rn "stores/post" src tests` prints four files, not nothing.
    - `fetchQuery` is absent.

The first run on the unchanged tree is **not verifiable**, since the tree has changed.

## Existing tests changed

`grep "^-[^-]"` over `git diff f7ab9b6a -- tests/` removes only the following. No assertion, stub or expected value changed.
- The two allow-list rows.
- The agents `settle()` helper and its doc line (the wait helper the brief allows).
- The constructor lines of agents, changes and lines.
- Two import lines.
- Five revert comments.

## Findings

**Spec**
- `src/lib/state/life/accounts.svelte.ts:35`, `calendar.svelte.ts:17`, `inbox.svelte.ts:15` (`import { postCommand } from '../shared/stores/post.ts'`): item 4 is not built. The report's Q84-R1 option (b) states a false cost ("changes three constructors' argument lists"). With the options misdescribed, Axel could rule (a) and keep `post.ts` when the fold costs no constructor change. Case 18 is unmet with it.
- `src/lib/state/shared/stores/queries.svelte.ts:1`: the helper was moved out of the briefed `state/client/`. The `DESIGN.md:174` shapes pattern would have kept it there. This is a reversible choice for the orchestrator, not a defect in the code.

**Proof**
- None beyond cases 18, 20 and 21 above.
- The red runs I repeated reproduced: the cancel revert and the `retry: false` revert.

**Standards**
- The builder ran two `git diff` commands against `spec.md:32` ("You never run a git command"). The report discloses them. They changed nothing.
- `src/lib/state/client/writes.svelte.ts:347-348` breaks a comment mid-sentence: `"...rather than carried\n     * here. An action that can lose\n     * work carries \`confirm: true\`..."`. It reads as a hand edit that was not rewrapped.
- `DESIGN.md:174` and `HELP.md:260` describe `state/shared/stores/` as "the shapes of the stores other stores are handed, types only", and `tests/checks/imports/order.ts:12` says "the shapes of the shared stores in `stores/`". The step put a stateful runtime module there, which the ten stores and `context.ts` import. `shell.ts` and `post.ts` had already made "types only" inexact, and this makes it further from true. The rule that a change grepping a name updates every sentence it makes false (spec.md:57) is not met.

**Behaviour** (each confirmed by `scratchpad/Q84-refute/copy/tests/probe/probe.test.ts`, run on the new tree and on a base copy rebuilt by `patch -R` of `git diff f7ab9b6a -- src`)
- **latex re-asks on a repeated `sessions` version.** `latex.svelte.ts:79-82` has `if (message.channel !== 'sessions') return; for (const id of waiting.keys()) queries.mark([KIND, id], 'wait');`. `entities.receive` passes an equal version on (`entities.svelte.ts:50` drops only a lower one). The old store compared the `T:version` signature and did not ask. Probe: requests went from 2 to 3 on the new tree and stayed 2 to 2 on the base. Failure scenario: a resent sessions message at the same version during a build sends one more `/api/latex` request per waiting project. Fix: skip a version already heard, as `files.svelte.ts:69` does.
- **saveNote no longer re-reads a note the page never read.** `fs.svelte.ts:650-660`: `queries.hold([...NOTE, id], saved)` on a key with no query builds a fresh query that is not stale, so the note is never asked for. The old store set `notes[id]` with no round, so the next `note(id)` fetched it. Probe:
  - New tree: requests `["POST /api/fs"]`, and the note reads `{"body":"typed","modified":1790730140957}`, the client clock.
  - Base tree: requests `["POST /api/fs","GET /api/fs?note=n1"]`, and the note reads `{"body":"disk","modified":42}`.
  - Failure scenario: a note saved before any tab read it shows the browser's time as its modified time, and never the disk's text and time until the next notes mark.
  - Fix: mark the key after the hold whether or not a query existed, for example `queries.mark([...NOTE, id], 'drop')` after the hold.
- **docs forgets the file of an error answer on a network error.** `docs.svelte.ts:244` has `return failure(held, error instanceof Error ? error.message : String(error));`, and `failure` defaults `file = ''`. The old catch left `files[key]` as it was (old docs.svelte.ts:274-283). Probe: after a 500 naming `/r/a/README.md` followed by a network error, a `files` message for `/other` asks again on the new tree (requests 2 to 3) and not on the base (2 to 2). Failure scenario: while the server is unreachable, every `files` message for any root re-asks for such a document. Fix: pass `held?.file ?? ''` in that branch.
- `forget`, `files.invalidate` and `latex.invalidate` now drop an in-flight answer, as decision 6 says. `grep -rn "invalidate" src/lib` shows no application caller of `files.invalidate` or `latex.invalidate`, so only tests reach the change.

## Declined to judge

- Whether `track()` creating a `$state` source inside a `$derived` on first read is safe in Svelte 5.57. It needs the look on TEST, and the old stores used the same pattern.
- Whether `queries.fetch` building the query on the caller's stack (`queries.svelte.ts:249-255`, which fires cache events and a `ticks` write synchronously) is always safe. Its callers today are `$effect`s under `untrack` and handlers: `File.svelte:131`, `ShowPath.svelte:83`, `opening.ts:48/56`. None is a `$derived`, so I found no failing path. A future caller inside a derived would raise `state_unsafe_mutation`, and the head comment at 17-19 does not say this.
- The builder's red runs other than the two I repeated. I did not rerun them.

Scratch files, all under `scratchpad/Q84-refute/`: `checks.log`, `src.patch`, `copy/` (the new tree plus `tests/probe/probe.test.ts`) and `base/` (the rebuilt base tree plus the same probe). Nothing in the worktree was changed.
