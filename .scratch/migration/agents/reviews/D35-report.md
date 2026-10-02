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
3. A completed port move rebuilds the portfolio watcher (`listeningOn`, `context.ts:718-723`: it sets `local.port`, `host` and `context.host`, then `rebuild({ ...rebuiltBy([]), portfolio: true })`), because the watcher takes the host as a start option and republishes the `config` channel with it. The announce before the move (`before()`) goes through the same function, so the page is told the new address while its socket is still open; a failed listen announces the old address again through it.
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

## Repair round 1

Everything in the round is done: items 1 to 11 of `agents/briefs/D35-round1.md` are built, each with a test whose failure without the fix is quoted below, and the full list passed. Not looked at in a browser: the page's navigation, the carry of the workbench through `window.name` and the status bar tooltip (the tests drive the page module and the storage functions with plain objects). The open items of the state file are unchanged from the section above (none).

### Per ruling

1. **A forwarded page sent to a dead address.** `followServer` (`src/lib/state/client/socket.svelte.ts:246-262`) navigates only when `portOf(location.href)` equals `portOf(reported)`, the port of the address the page holds (the first it received or the last it followed), and moves `reported` to the new address only when it navigates (`portOf`, `:77`). `addressAfterMove` still replaces only the port, so scheme and host name are the page's. The header comment (`:16-21`) says so. Tests in `tests/state/client/config-seed.test.ts`: `stays on a forwarded port through a move, since the port forwarded is not the new one` (page at `127.0.0.1:9000`, pushes 8790, 8791, 8792, no `location.assign`, window name untouched) and `stays on an https page whose forwarded host names the old port`.
2. **The layout and the "This browser" settings after a move (Z239).** New `src/lib/state/workbench/layout/saved/carry.ts` (65 lines): `carryWorkbench(storage, win)` writes what `localStorage` holds under `LAYOUT_KEY` and `UI_KEY` into `window.name` as `{"oculus.carry.v1": {"oculus.layout.v1": ..., "oculus.ui.v1": ...}}`, a key left out when the storage lacks it and the name untouched when nothing is carried; `takeCarried(storage, win)` writes each carried string into its own key and sets the name to `''` when the name parses to that object, and leaves any other name alone. `followServer` calls `carryWorkbench(localStorage, window)` before `location.assign` (`socket.svelte.ts:256`, inside a try so a page without storage still follows); `src/routes/+page.svelte:186` calls `takeCarried(localStorage, window)` before `loadUi` and `loadLayout`. The storage keys were already exported, so `storage.ts` and `ui.svelte.ts` are unchanged. Tests: `tests/state/workbench/layout/saved/layout-carry.test.ts` (12 cases: both values written as one object, a missing key left out, nothing to carry leaves the name, a storage that throws on read, the arriving page writes both and clears the name, a non-string value skipped, five names left alone and nothing written, the name cleared when the write throws), `config-seed.test.ts` `carries the arrangement and the settings in the window name before it goes` (the name is read at the moment of `assign`) and `goes without a window name when the storage holds nothing to carry`, and `tests/routes/page.test.ts` `takes what the previous address carried before it reads its saved workbench`. That last test reads `+page.svelte` as source, as the other cases of that file do because the mount runs only in a browser: it is an audit of the wiring order and of nothing else.
3. **A request in flight cut by a move.** `serverMover` (`src/lib/server/root/context.ts:293`) counts requests in flight (`server.on('request')` with the response's `close`), calls `server.close()` and `server.closeIdleConnections()` (`:340`), waits in `finishRequests` (`:309`, up to `graceMs`, 5000 by default, `MOVE_GRACE_MS` `:272`) for the count to reach 0 (`:341`), then `closeAllConnections()` and the listen. A request that started the move is one of the requests in flight. Tests in `tests/server/root/vite-plugin.test.ts`: `lets a request in flight finish, and serves the new port afterwards` (handler answers after 300 ms, the move called at 50 ms, status 200, body `late`, server on the new port), `ends a request still in flight when the grace period is over, and still moves` (`graceMs` 100, a handler that never answers, the fetch rejects, the server on the new port) and `ends an idle connection at once while a request in flight finishes` (a raw keep-alive socket closed while the slow request is pending). The last one is an audit of Node: `server.close()` already ends idle connections in Node 19 and later, so the test passes with the explicit `closeIdleConnections()` call removed.
4. **A throw inside the rebuild or the port settle.** `rebuild` (`context.ts:676`) builds each watcher through `tryStart` (`:660`). A watcher that cannot be built logs one line, `local.yml: <keys> cannot be applied, the <name> watcher cannot be built from it (<reason>); the value in force stays`, the changed keys it is built from (`keysBuilding`, `watch/local.ts:144`) go back to the value in force in `local`, and every watcher built from those keys is built again from that value; watchers of other keys stay as built. `reloadLocal` (`:796`) hands the read values to `apply` (`:818`) inside a try that logs `local.yml: a change could not be applied (<reason>)`. `settlePort` (`:760`) catches a throw of the move and logs `local.yml: port <n> was not applied (<reason>); the server stays on <old>`. Tests in `context-reload.test.ts`, describe `a change that cannot be applied`: one watcher constructor throws (hub and bookmarks changed in one write: one line naming `hub` and the `usageRefresh` watcher, `local.hub` and the portfolio, git and usage refresh built from the old hub, `local.bookmarks` and its watcher on the new file), the read of the configuration throws (one line), the move rejects (one line, then a later port is applied).
5. **Both listens failing.** After a failed listen on the new port, `serverMover` listens on the old port (`context.ts:345`); when that fails too it logs `the server could not listen on port <new> (<reason>) and could not listen on port <old> again (<reason>); it stops` in one line and calls `exit(1)` (`:350`), `exit` being `options.exit` or `process.exit`. Test: `logs both reasons in one line and exits with status 1 when neither port can be listened on`.
6. **The built entry's wiring.** New `src/lib/server/root/process/serve.ts` (49 lines): `serveContext(server, handler, makeContext, options)` makes the mover, builds the context with its move, carries it on every request with `carryingHandler`, attaches the socket on `/ws`, and closes socket and context on the server's `close` unless a move queued it. `src/server.ts` (61 lines) calls it with `createServerContext(parsed.engine, {}, portMove)`. `src/lib/server/root` held 10 items, so `args.ts` and `shutdown.ts` moved with the new file into `src/lib/server/root/process/` (nine items now; the tests were already under `tests/server/root/process/`); the imports of `src/server.ts` and of the two tests and the path in `DESIGN.md` (`server/root/process/args.ts`) follow, and `npm run diagrams` redrew `docs/diagrams/layer-server`. Tests in `tests/server/root/process/serve.test.ts` on a real `http.Server`: a request reaches the handler with the context; the context gets the move of its own server; a move closes neither context nor socket; a close outside a move closes both once. The shared server helpers (`freePort`, `listening`, `closeAll`) are `tests/server/root/process/server-fixture.ts`, used by this file and by `vite-plugin.test.ts`. `server-args.test.ts` keeps its source-text check of `createServerContext(parsed.engine, {}, portMove)`, now commented as an audit (the entry builds its context over the directory the arguments named); the wiring's behaviour is `serve.test.ts`.
7. **The push published inside `before()`.** `keeps a socket that was open, which carries the push made before the stop and the one after the move` (`vite-plugin.test.ts`) publishes a replayed push, then one inside `before()` and one after the move, and asserts both of the last two arrive on the open socket.
8. **Sentences made false.** `DESIGN.md:403` now says the watch reads every key of the file again, as the "Hot reload" paragraph does, and that the four account keys go to the routes and the pollers; `src/lib/server/accounts/connect/actions.ts:75-78` says `reload` reads the file again with every key and hands the account lists to the routes and the pollers and the other keys to what is built from them. Greps over `DESIGN.md`, `HELP.md`, `config` (`--exclude=local.yml`) and `src` for `started again`, `restart`, `read once`, `server starts`, `next start` and `at start` found no other sentence about `local.yml` made false (the hits are about other files, the app approvals, the terminals and the first load). `DESIGN.md:238`, `HELP.md:236` and the `port` description in `config/catalogs/options.yml` now say the page comes back with its layout and settings; `tests/views/system/help.test.ts` still holds `a changed \`port\` moves the server`.
9. **The key list stated twice.** `tests/server/root/context-reload.test.ts`, describe `the keys local.yml may carry`: for each of `LOCAL_KEYS` (16 cases) the camel-cased field is changed in a copy of `localDefaults` and `changedKeys` must report exactly that field.
10. **Citation.** Judgment call 3 above cites `listeningOn` at `context.ts:718-723`, its place in the final file (the ruling's `600-605` was its place in the reviewed file).
11. **Proof 4.** No change.

### Failure before the fix, pass after

Each row: the fix taken out by hand, the file run, the fix put back (`cmp` against a saved copy printed no difference).

| Test | With the fix taken out | Failed |
|---|---|---|
| forwarded page stays (2 cases) | the port condition removed from `followServer` | `stays on a forwarded port through a move ...`, `stays on an https page whose forwarded host names the old port` |
| the page carries before it goes | `carryWorkbench(localStorage, window)` removed | `carries the arrangement and the settings in the window name before it goes` |
| the page takes what is carried | `takeCarried(localStorage, window);` removed from `+page.svelte` | `takes what the previous address carried before it reads its saved workbench` (audit of source order) |
| name cleared | `win.name = '';` removed from `takeCarried` | 3 cases of `the page that arrives` |
| values written | `storage.setItem` removed | 3 cases of `the page that arrives` |
| foreign name left alone | `if (held === null) return;` replaced by one that clears the name | 6 cases, 3 of them the left-alone cases |
| name written | the `JSON.stringify` write removed from `carryWorkbench` | 9 cases of `layout-carry.test.ts` |
| request in flight | `await finishRequests();` removed (the old `closeAllConnections` at once) | `lets a request in flight finish ...` and `ends an idle connection at once while a request in flight finishes` |
| grace period | `graceMs` ignoring its option | `ends a request still in flight when the grace period is over ...` (timed out at 5021 ms) |
| both listens | `exit(1);` removed | `logs both reasons in one line and exits with status 1 ...` |
| `before()` push | `before();` removed from `serverMover` | `keeps a socket that was open ...` (5014 ms timeout), `answers on the new port ... tells the page before it stops`, `listens on the old port again ...` |
| throwing constructor | the catch of `tryStart` rethrowing | `says which keys and which watcher once ...` |
| unguarded apply | the try/catch of `reloadLocal` removed | `keeps answering and says why once when the read of the configuration throws` |
| unguarded settle | `throw error;` first in the catch of `settlePort` | `says why once and moves again for a later port when the move throws`, with an unhandled rejection |
| key list | `'workspaces'` removed from `FIELDS` | `reports workspaces when its value changes` and `builds the git watcher and the auto fetch again over a workspaces file written again` |
| mutation A | `if (mover.moving()) return;` removed from `serveContext` | `leaves the context and the socket open when a move stops the server` |
| mutation B | `carryingHandler(handler, context)` replaced by `(q, r) => handler(q, r)` | `hands the handler every request with the context on it` |

Two parts have no red run of their own: the logged sentence of the both-listens case (the case fails at `exit` first, and the sentence is asserted in the same case), and the idle-connection case, which is an audit of Node as item 3 says. The pass after each fix is the full list below.

### `tests/server/edit/config-key.test.ts`

The cases this step added are the describe `the bounds of the cadences, the day windows and the count`: 12 refusals and 4 writes. Run with `-t "bounds of the cadences"` they take 6.40 s of tests in one file run (the refusals 0.12 to 0.31 s each, the writes 0.43 to 1.25 s each, load average near 20); the whole file at the same time took 28 to 54 s. The 12 refusals now read one copy of the config folder made in `it.beforeAll` (a refusal leaves the file as it was, and every case asserts that), where each made its own copy (about 0.15 s each); the 4 writes keep a copy each. Main's copy of the file, copied to the session scratchpad without `local.yml` and run there, took 35.06 s and 27.26 s for its 38 cases; this tree's file took 31.34 s and 54.20 s for 54 cases in runs alternated with those, so the file's time follows the machine's load and not the added cases, whose share is about 6 s. The cases that timed out in full-list runs 1 to 3 below are cases main has (`refuses a key that is absent, empty, null, an alias, anchored, tagged or a block scalar`, `writes beside a file value that JSON cannot hold ...`, `refuses a value the reader of its block refuses ...`), at 7 to 9 s under a load average of 23 to 27. No timeout was lengthened.

### Before and after, rows this round changes

| Where | Before | After |
|---|---|---|
| The open page after a port change | goes to its own URL with the new port, from a page at any port | goes to its own URL with the new port when its own port is the port of the address it holds; its layout, tabs and "This browser" settings come across through `window.name` |
| A page reached through a forwarded port, open during a move | sent to the new port of its own host, which is not forwarded | stays where it is |
| `HELP.md:236` | "... a changed `port` moves the server and the open page follows it; ..." | "... a changed `port` moves the server and the open page follows it with its tabs, layout and settings as they were; ..." |
| Settings view, `port` description | "A change moves the server to the new port at once, and the page follows it." | "A change moves the server to the new port at once, and the page follows it with its layout and settings." |
| A request in flight when the port moves | ended with the connection | finishes, up to 5 s |
| Both listens failing | by reading the code: the first reason returned and the process stayed up with no listener | one log line with both reasons and the process exits with status 1 |
| A change that cannot be applied | by reading the code: no guard, so a throw reached the debounce timer or became an unhandled rejection | one log line, the value in force stays, the other keys are applied |

### Judgment calls of the round

- The carry replaces values already in the storage of the new origin, since the carried ones are the viewer's latest.
- `window.name` is overwritten at the page that leaves when there is something to carry, and cleared at the page that arrives; a tab the viewer or another tool had named loses that name once.
- When a key cannot be applied, the key goes back to its value in force for every watcher built from it, so `local` and the watchers agree; the failed watcher's old object stays closed in the set the context holds, and closing it again at shutdown is a second `close` of a watcher.
- The default `exit` of `serverMover` is `process.exit`, so a development server whose both listens fail also ends.
- The 5 s grace period is a constant (`MOVE_GRACE_MS`), not a key of `local.yml`.
- `src/lib/server/root/process/` takes `args.ts` and `shutdown.ts` with the new file because the folder held 10 items.

### Checks

Full-list runs of the round: 4 (`d35-r1-full1.txt` to `d35-r1-full4.txt` in the session scratchpad). Runs 1 to 3 stopped at `npm test` (runs 1 and 2) or at `npm run test:checks` (run 3, which passed `npm test`): runs 1 and 2 on `Test timed out in 5000ms` at load averages of 21 to 25 in `tests/server/edit/config-key.test.ts` (main's cases), `tests/routes/edit/config-key.test.ts` and `tests/server/git/autofetch.test.ts`, which this step does not change. Each file run again alone passed: `npx vitest run tests/routes/edit/config-key.test.ts tests/server/git/autofetch.test.ts tests/server/edit/config-key.test.ts` printed `Test Files 3 passed (3)`, `Tests 112 passed (112)`. Run 3 failed `test:checks` on three lines I fixed (two hundredth-column comment lines, and the same 11 lines held by `serve.test.ts` and `vite-plugin.test.ts`, now `server-fixture.ts`). Run 4 printed:

```
$ npm test
 Test Files  433 passed | 22 skipped (455)
      Tests  11350 passed | 621 skipped (11971)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  442 passed | 9 skipped (451)
$ npm run check
1790915521120 COMPLETED 2972 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
exit 0
```

After run 4: `grep -rn --exclude=local.yml "takes effect when the server is started again" config HELP.md DESIGN.md src | wc -l` prints `0`, `grep -rn "loadLocalOrDefaults(" src | wc -l` prints `11`, `grep -c "A change is read again at once." config/catalogs/options.yml` prints `15`, `grep -c "moves the server to the new port" config/catalogs/options.yml` prints `1`. `ls src/lib/server/root | wc -l` prints `9`.

### Files of the round, with line counts

`src/lib/server/root/context.ts` 875, `src/lib/server/root/process/serve.ts` 49 (new), `src/lib/server/root/process/args.ts` 66 and `shutdown.ts` 45 (moved), `src/server.ts` 61, `src/lib/server/root/watch/local.ts` 146, `src/lib/state/client/socket.svelte.ts` 337, `src/lib/state/workbench/layout/saved/carry.ts` 65 (new), `src/routes/+page.svelte` (one import, one call), `src/lib/server/accounts/connect/actions.ts` (one comment), `DESIGN.md`, `HELP.md`, `config/catalogs/options.yml`; tests: `tests/server/root/context-reload.test.ts` 833, `tests/server/root/vite-plugin.test.ts` 367, `tests/server/root/process/serve.test.ts` 87 (new), `server-fixture.ts` 41 (new), `server-args.test.ts` 139, `tests/state/client/config-seed.test.ts` 309, `tests/state/workbench/layout/saved/layout-carry.test.ts` 124 (new), `tests/routes/page.test.ts` 179, `tests/server/edit/config-key.test.ts` 715.

### Limits that remain

- A page asleep or disconnected during a move cannot follow it, and a hooks snippet copied with the old port keeps the old port (as in the first account).
- A response that streams for longer than 5 s when the port moves is ended at the end of the grace period.
- A page reached through a forwarded port stays at its origin after a move; whether the forward still reaches the server is the forward's, not the page's.
