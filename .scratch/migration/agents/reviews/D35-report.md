# D35 report: every local.yml key live

Everything in the brief is done. One thing was not taken: a look at the status bar in a browser (section "Host- and user-visible changes"). The brief's verify list does not ask for it, and the host shown after a port change is covered by tests on the `config` payload and on the page module.

## Open items of the state file

`orchestrator-state.md`, section "Open items" (lines 139 to 151, read with `sed -n 139,151p`): the section holds only its two introductory lines and no entry. No open item is listed.

## The first run (handed back before items 9 to 17 were built)

Command for cases 1 to 25: `npx vitest run --reporter=dot tests/server/root tests/server/machine/hpc tests/server/machine/usage tests/server/accounts tests/server/edit/config-key.test.ts tests/data/sources/config tests/routes/sessions/hook.test.ts`.

- On the tree as applied, nothing loaded: `failed to load config from .../vite.config.ts ... [MISSING_EXPORT] "CADENCE_WORDS" is not exported by "src/lib/data/sources/config.ts"` (and `cadenceShape`), imported at `src/lib/server/machine/usage/refresh.ts:10`. Every case 1 to 25 was unrunnable there.
- With the two export names added: `Test Files 1 failed | 52 passed (53); Tests 55 failed | 822 passed (877)`. The 55 failures were all in `tests/server/edit/config-key.test.ts`, which called `writeConfigKey(engine, hub, file, key, value)` while main's source takes `(engine, file, key, value)`. Cases 1 to 21, 23, 24 and 25 passed in the other 52 files. Case 26's test went with item 9.

Cases 27 to 41, first run of `npx vitest run --reporter=dot tests/server/root/context-reload.test.ts` before any source change: `Tests 18 failed | 2 passed (20)`.

| Case | First run | Failure |
|---|---|---|
| 27 hub | fail | portfolio built 1 time, expected 2 |
| 28 accounts | fail | sessions built 1, expected 2 |
| 29 sessions_overrides, sessions_cache | fail | sessions built 1, expected 2 |
| 30 workspaces | fail | git built 1, expected 2 |
| 31 bookmarks | fail | bookmarks built 1, expected 2 |
| 32 claude_bin | fail | usage refresh built 1, expected 2 |
| 33 open_bin | fail | `context.opener` is the same function after the edit |
| 34 hpc_host | fail | the HPC `set` is never called |
| 35 port, context part | fail | the mover is never asked (`expected [] to deeply equal [ 8793 ]`) |
| 36 port refused | fail | no line logged |
| 37 notes, changes | fail | `context.local.notes` is undefined after the edit |
| 38 file that does not read | fail | the line is logged twice (once per read, not once per reason) |
| 39 hub and accounts | fail | builds 1, expected 2 |
| 40 edit after close | pass | audit: the unchanged tree returns early after `close()` |
| 41 equal values | pass | audit: the unchanged tree rebuilds nothing |
| 42 greps | fail | `grep -rn "takes effect when the server is started again" config HELP.md DESIGN.md src` printed 12 lines (`options.yml:593-615`); `grep -rn "loadLocalOrDefaults(" src \| wc -l` printed 11 |

Case 35's real-server and page parts were not written at the first run; they were written after the rulings (section "Rulings" below).

The first run found one wrong rule (case 35, the page following the server) and four gaps in the path list (A to D). The coordinator ruled on all four; the rulings are carried below.

## Rulings (file `agents/briefs/D35-cases.md`) and how each stands

- **A. Case 35 and item 12, when the page follows the server.** Option 3. `src/lib/state/client/socket.svelte.ts`, `installConfig` and `seedConfig` call `followServer(host)`: the page keeps the first `host.address` it received and, on a later payload with a different address, assigns `addressAfterMove(location.href, address)`, the page's own URL with the port replaced and the host name, path, query and hash kept (`socket.svelte.ts:233-241`, `:63`). A page loaded after a move, a page opened at `localhost` and a forwarded page never navigate; a page open during a move does. Tests: `tests/state/client/config-seed.test.ts`, describe "the page follows a server that moves" (follow once, a page loaded after the move stays, `localhost` stays, forwarded port stays, first address taken from the seed). Option 1 (the rule as written) was the lazy option and regresses every page opened at `localhost`.
- **B. `data/sources/config.ts`** joins the paths for the two exports `CADENCE_WORDS` and `cadenceShape` only. `diff` against main prints exactly those two lines (63 and 64); the `loadLocalOrDefaults` re-export is main's.
- **C. The built server.** `serverMover(server)` is exported from `src/lib/server/root/context.ts` beside `LISTEN_HOST` and `hostInfo`, returning `{ move, moving }` with `PortMove = (port, before) => Promise<string | null>`. Both `vite-plugin.ts` and `src/server.ts` use it, so a changed `port` moves the server under `npm run dev` and under the built entry.
- **D. Folders and sizes.** `tests/server/root/process/` holds `server-args.test.ts` and `shutdown.test.ts` (imports adjusted); `tests/server/root/context-reload.test.ts` holds the reload cases. `ls tests/server/root | wc -l` prints 10.
- **Decisions that stand as listed in the hand-back:** the refusal lines for 8787 and for a port outside 1 to 65535, both before the probe; moves one at a time with the latest wanted port winning; a context closed during a move changing nothing; the old address announced again when the listen fails after `before()`; the server's `close` handler ignoring the event while a move runs; `hpc_host` through `liveSettings`; a rebuilt portfolio watcher republishing the `config` channel with the new `host`.

## DONE / NOT DONE

All rows are DONE. The commands were run from `tools/oculus` in the worktree with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

| Item | State | Command and output |
|---|---|---|
| 1 to 8, 10 to 17 (build) | DONE | The tests below and the full list |
| 9 start-value part removed | DONE | `cmp` loop below |
| Verify 1, full list | DONE | `npm run diagrams`, then `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`: last run printed `checks: 7 commands passed`, exit 0 |
| Verify 2, scoped tests | DONE | covered by `npm test` of the full list (it runs every file but `tests/checks/**` and slow-tagged ones): `Test Files 431 passed \| 22 skipped (453)`, `Tests 11307 passed \| 621 skipped (11928)` |
| Verify 3 | DONE | `grep -rn "takes effect when the server is started again" config HELP.md DESIGN.md src \| wc -l` prints `0` |
| Verify 4 | DONE | `grep -rn "loadLocalOrDefaults(" src \| wc -l` prints `11` |
| Verify 5 | DONE | `grep -c "A change is read again at once." config/catalogs/options.yml` prints `15`; `grep -c "moves the server to the new port" config/catalogs/options.yml` prints `1` |
| Verify 6 | DONE | below |
| Verify 7 | DONE | below |

### Full-list runs: 6

Files of the runs: `checks1.txt`, `checks2.txt`, `checks3.txt`, `d35-full5.txt`, `d35-full6.txt`, `d35-full7.txt` in the session scratchpad. Runs 1 to 5 stopped at `npm test`. Every failure in them is a `Test timed out in 5000ms` while the machine's load average was 17 to 23 (other builders running): `tests/server/edit/config-key.test.ts` (a file I changed) and `tests/routes/edit/config-key.test.ts` in run 5, and in run 6 also `tests/server/git/autofetch.test.ts` and the Monaco key-binding test, which I did not change. Rerun alone, `npx vitest run tests/server/edit/config-key.test.ts tests/routes/edit/config-key.test.ts` prints `Test Files 2 passed (2)`, `Tests 68 passed (68)`; `tests/server/git/autofetch.test.ts` passed alone (44 of 44) at the earlier timeout. Run 7 is the pass. The lines it printed:

```
$ npm test
 Test Files  431 passed | 22 skipped (453)
      Tests  11307 passed | 621 skipped (11928)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
exit 0
```

`npm run check` also printed `COMPLETED 2967 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` when run alone.

### Verify 6, byte comparison with main

`cmp` of each file item 9 lists against `/Users/axelfaes/workspace/research-hub/tools/oculus/<path>`: the 27 source and test files and the 7 route files (`src/routes/api/write`, `(git)/deposit`, `(git)/changes`, `(docs)/docs`, `(docs)/wallpaper`, `(docs)/memories`, `(files)/project-files`) print `same`, 34 files, with two differences, both required by other items:

- `src/lib/data/sources/config.ts`: `diff` prints `63,64d62 < CADENCE_WORDS, < cadenceShape,` (ruling B).
- `tests/views/system/help.test.ts`: item 9 lists it as main's, but main's copy asserts the sentences item 14 removes from `HELP.md:236` (`toContain('read once when the server starts')` and `toContain('read again on every write')`). The worktree's copy asserts the new sentences (`read again whenever it changes`, `a changed \`port\` moves the server`). The brief is impossible as written here: the HELP sentence and the test that reads it cannot both be main's. The path is widened and reported.

### Verify 7, each test fails without its behaviour

- **Cases 27 to 39 and the port moves:** the first-run table above, run on the tree with no source change behind the tests (`Tests 18 failed | 2 passed (20)`).
- **Mover tests in `vite-plugin.test.ts`:** `grep -c serverMover /Users/axelfaes/workspace/research-hub/tools/oculus/src/lib/server/root/context.ts` prints `0`; the tests import `serverMover` and cannot load on main's `context.ts`.
- **Page tests** (`config-seed.test.ts`), with the `location.assign` call replaced by `void moved` in `socket.svelte.ts`: `FAIL goes to its own address on the new port when a later push reports another address, once` and `FAIL takes the first address from the configuration the page was built from`; `Tests 2 failed | 26 passed (28)`. The three tests that assert no navigation (loaded after the move, `localhost`, forwarded port) pass with the call removed: they are audits of the guard (they would fail only if `followServer` navigated wrongly), and their value is in the combination with the two above.
- **Case 40 (edit after close), mark audit:** with `if (closed) return;` removed from `reloadLocal`, `FAIL builds nothing and says nothing for an edit after the context is closed`; `1 failed | 19 passed (20)`. A real test.
- **Case 41 (equal values), mark audit:** with every key counted as changed, `FAIL builds nothing again for a file whose values equal the ones in force (an audit)` fails among at least 14 failures (the list was cut at 14 lines). A real test.
- **Port move not made:** with `else void settlePort();` replaced by `else void 0;`, 7 tests fail (`publishes the new address before the server moves`, `keeps the server and says why once for a port in use`, `refuses 8787 and a port outside 1 to 65535`, `puts the old address back when the server could not listen`, `takes the later port when a second edit arrives`, `changes nothing and says nothing when the context is closed while the move is in flight`, `keeps the server and says so once when this process cannot move its port`).
- **No rebuild:** with `rebuild(rebuiltBy(changed));` removed, 8 tests fail (cases 27 to 32, 38 and 39).
- **The terminal starts in the new hub:** the assertion reads `run.context.local`, the object the terminal route reads (`expect(run.context.local).toBe(held)` in the test, and the route's `server.local`).
- **Tests of preserved behaviour** (Z166/Z174 live behaviour keys, the pollers' setters, the bounds): these pass after the change; they are files from the applied patches, run in the full list above. They were not run on the unchanged tree: the unchanged tree is main, which has none of those files.

The audits restored the files: `cmp` of `context.ts` and `socket.svelte.ts` against their saved copies printed no difference and the script printed `restored` before the last full list was run.

## Files and line counts

| File | Lines |
|---|---|
| `src/lib/server/root/context.ts` | 743 |
| `src/lib/server/root/live-settings.ts` | 224 |
| `src/lib/server/root/watch/local.ts` | 141 |
| `src/lib/server/root/vite-plugin.ts` | 92 |
| `src/server.ts` | 80 |
| `src/lib/state/client/socket.svelte.ts` | 318 |
| `src/lib/data/sources/config.ts` | 74 |
| `tests/server/root/context-reload.test.ts` (new) | 741 |
| `tests/server/root/vite-plugin.test.ts` | 280 |
| `tests/state/client/config-seed.test.ts` | 262 |
| `tests/server/root/process/server-args.test.ts` (moved) | 137 |
| `tests/server/root/process/shutdown.test.ts` (moved) | 65 |
| `tests/views/system/help.test.ts` | 355 |

Also changed, no line count taken: `config/catalogs/options.yml` (15 descriptions end with the new sentence; `port` has its own), `DESIGN.md` (the "Hot reload" paragraph on `local.yml`), `HELP.md:236`, `tests/server/edit/config-key.test.ts` (main's four-argument `writeConfigKey`), `tests/server/root/context.test.ts`, `tests/server/root/context-fixture.ts`, and the files of the applied patches listed in the brief ("The patch as applied"). `docs/diagrams/layer-server.dot` and `.svg` are regenerated by `npm run diagrams`.

## What was built

- **`watch/local.ts`:** the one debounced watch on the config folder, now for every key. `changedKeys(held, next)` compares each key with `isDeepStrictEqual`. `rebuiltBy(changed)` maps keys to watchers: `hub` to portfolio, usage refresh and git; `accounts` to sessions and usage refresh; `sessionsCache` and `sessionsOverrides` to sessions; `workspaces` to git; `bookmarks` to bookmarks; `claudeBin` to usage refresh. Sessions or usage refresh imply usage; git implies auto fetch.
- **`context.ts`:** `createServerContext(engine, replacements, portMove?)`. `reloadLocal` re-reads the file; on a read failure it logs `the machine's own configuration is not read again: <reason>` once per distinct reason and keeps every value. Otherwise it replaces the `local` object's contents in place (routes that hold the object follow with the next request), says the document findings again on a `hub` change, rebuilds the watchers the changed keys name (close the old, start the new, reverse-order close and forward-order start), replaces the opener on `openBin`, calls `hostChanged` on `hpcHost`, sets the calendar and mail accounts, then settles the port.
- **Port move:** probe `127.0.0.1:<port>`; `before()` publishes the new host on the `config` channel over the still-open sockets; `server.close()`, `closeAllConnections()`, `listen(newPort)`. Upgraded WebSockets survive `closeAllConnections`. The server's `close` event is ignored while `mover.moving()`. If the listen fails after `before()`, the old address is announced again.
- **`live-settings.ts`:** `hostChanged()` and `held()`; `current.slurm.host` is `hpcHost() ?? pushedHost`.
- **Refusals** (one line each, once per distinct sentence): `local.yml: port <n> cannot be used (<reason>); the server stays on <old>`, with reasons `it belongs to the cockpit` (8787), `a port is a whole number from 1 to 65535`, `this process cannot move its server`, `the port is in use`, `a move is in progress`, `the server is not listening`.

## Judgment calls the brief left open

1. The refusal sentences and their reasons (above), including the refusal of 0 and of values above 65535, which `portShape` accepts and which `listen(0)` would turn into a random port.
2. `hpc_host` is an `attempt('hpc_host', ...)` group inside `liveSettings`, run on a change of the key, so a poller error follows the existing `attempt` logging.
3. A completed port move rebuilds the portfolio watcher (`listeningOn`, `context.ts:599-604`: it sets `local.port`, `host` and `context.host`, then `rebuild({ ...rebuiltBy([]), portfolio: true })`), because the watcher takes the host as a start option and republishes the `config` channel with it. The announce before the move (`before()`) goes through the same function, so the page is told the new address while its socket is still open; a failed listen announces the old address again through it.
4. A hub edit and a port edit in one write build the portfolio watcher twice: once for the hub (`reloadLocal`), once when the move completes. A hub edit together with an accounts edit builds each affected watcher once (case 39).
5. `context.local` is replaced in place with `Reflect.deleteProperty` and `Object.assign`, so every route and watcher holding the object sees the new values; `port` is kept as the port in force until the move completes.
6. `src/server.ts` keeps its request-listener form: `server.on('request', carryingHandler(handler, context))` with the context created after the server and the mover.
7. `tests/views/system/help.test.ts` is outside item 9's list and differs from main (see Verify 6).
8. The mover tests live in `vite-plugin.test.ts` (real servers on ephemeral ports) so that `context-reload.test.ts` stays under 900 lines.
9. The host rides the `config` channel (`ConfigPayload.host`), not the portfolio payload, as the first run found it does in `watch/portfolio.ts`; the brief's decision 3 says "the portfolio payload".

## Host- and user-visible changes, before and after

| Where | Before | After |
|---|---|---|
| Settings view, `local.yml` descriptions (`options.yml`) | 15 descriptions ended "A change takes effect when the server is started again."; `port` said so too | 15 end "A change is read again at once."; `port` ends "A change moves the server to the new port at once, and the page follows it." |
| `HELP.md:236` | "The whole file is read once when the server starts, and `hub`, `sessions_overrides`, `bookmarks` and `changes` are read again on every write ... an edit to `port`, `hpc_host` ... holds from the next start." | "The file is read again whenever it changes, from the page or by hand, and every key holds at once; a changed `port` moves the server and the open page follows it; a file that does not read keeps the values in force and says why once." |
| `DESIGN.md`, "Hot reload" | `local.yml` keys read at start, some per request | read again whenever it changes, per-key rebuilds, port move, a bad file keeps the values |
| Status bar host chip after a port change (`StatusBar.svelte:94`, tooltip `host_tip` with `status.host.address`) | a `port` edit held from the next start (`HELP.md` before) | the `config` payload carries the new `host` before the server moves, so the tooltip names the new address once the page has taken it; the page also goes to the new port (next row). Not looked at in a browser: not verified there |
| The open page after a port change | not verified on main (a `port` edit took effect only at the next start, per `HELP.md` before) | goes to its own URL with the new port; a page opened at `localhost` or behind a port forward does not navigate unless the server's address changed while it was open |
| A `local.yml` that does not read | not verified (not measured on main) | every key keeps its value; the reason is logged once per distinct reason (cases 38 and the `the machine's own configuration is not read again:` line) |

## Limits that remain

- A page asleep or disconnected during a move cannot follow it; it has no payload carrying the new address, so it does not navigate (by construction of `followServer`; not exercised in a browser). A page loaded after the move is correct.
- A hooks snippet copied with the old port keeps pointing at the old port.
- A hub edit and a port edit in one write build the portfolio watcher twice (judgment call 4).
- A `port` that is refused (in use, 8787, out of range) leaves `local.yml` naming a port the server is not on; the sentence is logged and the move is tried again at the next write of the file.
- The status bar and the page navigation are covered by tests on the payload and the page module, not by a browser look.

## Anything in the brief that was wrong or impossible

- Case 35 and item 12 as written regress every page opened at `localhost` (evidence: `hostInfo` always returns `http://127.0.0.1:<port>`, `context.ts`; the server admits other host names, `DESIGN.md:146`). Ruled A.
- Item 12 named only `vite-plugin.ts`; `src/server.ts` also listens. Ruled C.
- Item 9 lists `tests/views/system/help.test.ts` and `data/sources/config.ts` as main's; the first cannot be (it asserts the sentence item 14 removes), the second must carry two exports for the kept readers. Ruled B for the second.
- The folder limit and the 900-line cap forced `tests/server/root/process/` and a separate test file. Ruled D.

## Disclosure

During the first phase I ran one read-only `git status --short` on the main checkout. It changed nothing. No git command was run after it.
