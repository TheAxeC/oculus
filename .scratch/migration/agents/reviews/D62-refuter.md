# Step D62 refuter report (on /Users/axelfaes/workspace/research-hub/.agents/worktrees/D62, base 398537672)

A page this report cites (the rules file, a standard, a skill's text) is named by its section, not by a line number. A finding in code keeps its `file:line`. Every command below ran from `tools/oculus` in the worktree, with node from `$HOME/.nvm/versions/node/v24.21.0/bin`.

## Verification (rerun by the reviewer)

```
npm run test:quick -- --base 398537672
test:quick: 144 changed file(s), from git since 398537672
test:quick: 137 test file(s), 10 essential
ok      prettier (0.4 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      eslint (1.3 s)
ok      svelte-kit sync (1.8 s)
ok      svelte-check (5.4 s): 1791670735235 COMPLETED 464 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (29.4 s): Duration  25.44s (transform 27.87s, setup 0ms, import 49.94s, tests 43.85s, environment 259ms)
test:quick: 29.9 s (limit 45.0 s); every command passed
exit 0
(An earlier run in this review had every line ok but took 46.4 s: "test:quick: 46.4 s (limit 45.0 s); every command passed" / "test:quick: over the time limit". The report's 143 changed files against the 144 here is the report file itself, which the brief places in the worktree.)

LC_ALL=C grep -n '[^ -~]' over the 132 added or changed files (git status --short | xargs)
(prints nothing)

npx vitest run tests/server/machine/apps/host-runner.test.ts      Tests  11 passed (11)
npx vitest run tests/server/machine/apps/manifest.test.ts         Tests  68 passed (68)
npx vitest run <app-gate.test.ts>                                 Tests  20 passed (20)
npx vitest run tests/server/root/eslint-switch.test.ts            Tests  1 passed (1)

sh utils/unused-exports.sh, compared with .agents/worktrees/D62-base/tools/oculus/unused-exports.txt
added lines: read/state.ts: DEFAULT_KEY; row-menu.ts: ROW_ADD_APP (inside the ROW_* line); flows.ts: AppAsk. The same three the report quotes.

wc -l: context.ts 878, settings.ts 872, host/manager.ts 623, AppFrame.svelte 318, ApprovalPanel.svelte 184, Catalogue.svelte 384 (all at or under 880 / 520)
sh utils/folder-check.sh: exit 0
ls src/lib/server/machine/apps: host manage reach read routes secrets serve store

The three test:checks tests the builder could not pass:
npx vitest run tests/checks/config/config-folder.test.ts tests/checks/config/integrity.test.ts
  'reads the roots of sources.yml without a finding' passed
  'names a group of its own and a path under the hub for every document' passed
  'validates with no findings' passed
  Test Files  2 passed (2) / Tests  33 passed (33)
(ls -d .agents/worktrees/D62/.oculus/config now answers the folder; it is dated Oct 11 00:01. The report's "fail in this worktree" no longer holds.)
npm run test:checks: Test Files  17 passed (17) / Tests  271 passed (271)

The 20 non-slow test files the report lists, in one run (including opening.client.test.ts and opening-apps.test.ts):
Test Files  20 passed (20) / Tests  431 passed (431)  (matches the report's 411 + 20)

The penpal proxy check (penpal 8.0.1, createRemoteProxy in node_modules/penpal/dist/penpal.mjs:180 is `new Proxy(Object.create(null), { get, apply })`, no ownKeys trap):
node -e "...const remote = new Proxy(Object.create(null),{get(t,k){...return function(){}}}); console.log('direct:', typeof remote.getTheme); const page={...remote, fs:{}}; console.log('after spread:', typeof page.getTheme, Object.keys(page));"
direct: function
after spread: undefined [ 'fs' ]
```

Not run: `utils/outside-paths.mjs`, which runs `git rev-parse` and `git ls-files`, which this review's git limit forbids. I compared the changed paths with the write list by hand from `git status --short`.

## Verdicts

Items of the brief's "What to build":

- 1 (manifest): holds. The five keys are in `read/manifest.ts`, each with a finding in `findings.yml`. The cases 1 to 6 rows of `manifest-host.test.ts` pass in the test:quick run. The wording of case 6 is in Spec 6.
- 2 (approval panel): holds by reading. `ApprovalPanel.svelte` draws `host_line`, `files_line`, `secrets_line`, `depends_line` and `send_line` from `apps.yml`. How it looks is for the look on landing.
- 3 (keep approved for root apps): holds. `routes/routes.ts` no longer refuses keep for a root app. The `approve.test.ts` and `manifest-host.test.ts` rows pass.
- 4 (WebAssembly): holds. `serve/address.ts` script-src is `${base} ${shared} 'wasm-unsafe-eval'` and has no other change. The `app-files.test.ts` row passes.
- 5 (the host): violated, Behaviour 3. Start, the argument array, the environment, deactivate then SIGTERM then SIGKILL, and Restart all hold (host-runner 11 passed, host-manager rows). The dev reload stop does not hold: the old context's hosts are not stopped before the new context runs hosts.
- 6 (activation): holds. `host/triggers.ts` uses picomatch through `globTest`, skips dot folders and `node_modules`, and is capped by `scan_entries`. The host-manager rows pass.
- 7 (protocol): holds. `vscode-jsonrpc` `createMessageConnection` is used on both ends. DESIGN.md's protocol table holds every method. `grep -cF '$/cancelRequest' DESIGN.md` gives 1 and `grep -cF '$/progress' DESIGN.md` gives 1.
- 8 (secrets): holds on macOS by reading and by `secrets.test.ts` (15 rows). The Linux store selection is under Declined to judge.
- 9 (the frame's new methods): violated, Behaviour 1. `oculus.js` loses every flat method, so `connect()` throws for every app.
- 10 (Processes view): holds by reading `AppHosts.svelte`, `Processes.svelte` and `processes.yml`. The look is for landing.
- 11 (one app using another): violated, Spec 1. On Remove, the dependency's host stops before its dependents' hosts. Disable and revoke follow the order the item gives.
- 12 (managing apps): holds, except Remove's stop order (Spec 1). `apps.json` read and write, workspaces, add, remove and the unparsable-file refusal match the item; `manage.test.ts` and `app-manage.test.ts` pass.
- 13 (documents): holds with one stale line, Spec 5. `docs/apps.md` documents the five keys (lines 38 to 42), the host (252 onward), the frame methods table (234 to 241) and the limits (328). DESIGN.md and HELP.md say Keep approved holds for root apps.
- 14 (size and folders): holds. The eight subfolders, `folder-check.sh` exit 0, the `wc -l` above, and no old import path remains (the grep for the old paths printed nothing).

Cases:

- 1: met, `manifest-host.test.ts` host rows.
- 2: met, `manifest-host.test.ts` files rows.
- 3: met, `manifest-host.test.ts` 'a root key holding a slash'.
- 4: met, `manifest-host.test.ts` secrets rows.
- 5: met, `manifest-host.test.ts` activation rows.
- 6: partial. The refusals and the offered `depends: [absent]` are met. The line says "waits for the app {0}, which cannot run" and does not say the dependency is missing. See Spec 6.
- 7: met, `host-manager.test.ts` start rows, including the G7 argument with spaces and `$(x)`.
- 8: met, `host-manager.test.ts` rows for an unapproved app, a disabled app and a changed kept app.
- 9: met for disable, revoke, change, remove and close in `host-manager.test.ts` and `host-runner.test.ts`. The dev reload part of item 5 is in Behaviour 3.
- 10: met on the server side, `host-manager.test.ts` Restart row. The tab line is not verifiable end to end while Behaviour 1 stands.
- 11: met, `host-runner.test.ts`.
- 12: met, `host-runner.test.ts`.
- 13: partial. The server and page sides are met (`host-manager.test.ts`, `methods.test.ts`, `app-manage.test.ts`). `oculus.host.request` from a frame is unmet, Behaviour 1.
- 14: partial. `hostTargets` and the `app-messages` publish are met (`rules.test.ts`, `host-manager.test.ts`). The frame's `onHost` is reached only if `connect()` completes, Behaviour 1.
- 15: partial. The host store rows and `app-store.test.ts` are met. The frame `getStore` and `setStore` half is unmet, Behaviour 1.
- 16: met, `host-manager.test.ts` 31st update row.
- 17: met, `host-manager.test.ts` dependency rows (4).
- 18: met, `host-manager.test.ts` glob row.
- 19: met, `host-manager.test.ts` language row.
- 20: partial. The route and the page's address are met (`app-fs.test.ts` 21 rows, `methods.test.ts` 15 rows). `oculus.fs.readFile` from a frame is unmet, Behaviour 1.
- 21: partial, as case 20.
- 22: partial. The route streams from the fd (`app-fs.test.ts` 300 MB row). The frame call is unmet, Behaviour 1.
- 23: partial, as case 20.
- 24: met for a wrong key, an unapproved app and a disabled app (`app-fs.test.ts`). A dot-led path segment answers `closed`, as item 9 and case 20 say; case 24 says the empty 404. The brief's two texts disagree, and the builder followed item 9.
- 25: partial. `commands.test.ts` and `methods.test.ts` are met. `oculus.commands.run` from a frame is unmet, Behaviour 1.
- 26: partial. `secrets.test.ts` and `methods.test.ts` are met. The frame calls are unmet, Behaviour 1.
- 27: met on the server, `app-manage.test.ts` 'answers the secrets of the app in the header alone'. The frame call is unmet, Behaviour 1.
- 28: met, `secrets.test.ts` unavailable row.
- 29: met by the reading the report quotes (`AppFrame.svelte:141-142`, `tabForKind`) and the opening test run (20 files, 431 passed). The frame's `open` is lost with the rest, Behaviour 1.
- 30: met, `approve.test.ts` and `manifest-host.test.ts` keep rows.
- 31: met, `app-files.test.ts` policy row.
- 32: met on the server and the page state (`manage.test.ts`, `host-manager.test.ts`, `app-fs.test.ts`, `app-files.test.ts`, `flows.test.ts`, `app-badges.test.ts`). "Enable: the frame draws" fails at `connect()`, Behaviour 1.
- 33: met, `manage.test.ts` unparsable-file rows.
- 34: met for the count, the trash, the secrets and the revoke (`manage.test.ts`, `app-manage.test.ts`, `flows.test.ts`). The host stop order on Remove is Spec 1.
- 35: met, `manage.test.ts` add rows, `app-manage.test.ts`, `add-app.test.ts` (7 rows), `flows.test.ts`.
- 36: met, `manage.test.ts` workspace rows and the `host-manager.test.ts` workspace row.
- 37: met, `host-runner.test.ts` import refusal rows (6).
- 38: met, `host-manager.test.ts` 601st and 11th rows.
- 39: met for Disable and revoke (`manage.test.ts`, `host-manager.test.ts`, `flows.test.ts`).
- 40: met, `manage.test.ts` and `flows.test.ts` keyring-unavailable rows.
- 41: met, `host-manager.test.ts` SIGTERM, output cap and `scan_entries` rows.
- 42: met, `manifest.test.ts` closed-channel rows (68 passed) and the `host-manager.test.ts` publish row.
- 43: met, `manifest-host.test.ts` and the `host-manager.test.ts` waiting row.

## 1. Spec

- 1. `src/lib/server/machine/apps/manage/remove.ts:103`: `await deps.hosts.stop(app.id);`. What is wrong: `AppHosts.stop` (`host/manager.ts:221`, "Stop the host of an app; its dependents keep running.") calls `#stop(entry, {})`. With no `dependents` option, `#stopDependents` does not run, so the removed app's host stops first. The dependents are only written as disabled in `apps.json` at lines 94 to 100. Their hosts stop later, when `apps.reread()` in `routes/manage.ts:71` triggers reconcile. Item 11 and ruling 46 (8) ask for "the dependency's host last". Failure scenario: app `a` depends on `base`, and the reader removes `base` with yes. `base`'s host is stopped and trashed while `a`'s host is still running. `a`'s `apps.get('base')` calls during that window answer `host_down`. `a`'s `deactivate` runs after its dependency is already gone, so it cannot use `base` to settle. Verdict: item 11 violated; case 34 partial on order.
- 2. `src/lib/server/root/process/apps-hosts.ts:104`: `void hosts.close();`. The defect is under Behaviour 3. It also leaves item 5's sentence "A server context made again by a dev hot reload stops the old context's hosts first, so no host runs twice" unbuilt. Verdict: item 5 violated.
- 3. The channel list in DESIGN.md (the socket's channel list) and `apps.svelte.ts`: a second new channel, `app-messages`, carries host-to-page messages. The brief names one new channel, `app-hosts` (ruling 46 (13)). `app-messages` is a wire shape the brief does not name. The standing spec's "No silent design decisions" lists a wire format among the shapes to raise. None of the report's 11 judgment calls (lines 698 to 711) names it, and the report raises no open item for it. Failure scenario: the orchestrator lands a channel whose name, payload shape and closed-to-apps status Axel never ruled on, and later steps build on it. Verdict: none on an item. It is a decision to raise.
- 4. Brief item 9 against case 24: item 9 and case 20 say a dot-led segment of the path answers `closed`; case 24 says the empty 404. The builder followed item 9 (`app-fs.test.ts`). This is a defect of the brief, for the orchestrator to rule on. Verdict: case 24 met as item 9 reads.
- 5. `docs/apps.md:421`: "read the panel and approve again; use Keep approved while I edit for a machine app you are editing". What is wrong: item 13 asks that Keep approved for root apps be documented and that each sentence the step makes false be dropped. This troubleshooting row still limits the advice to machine apps, while line 59 of the same page, DESIGN.md:422 and HELP.md:393 say both kinds offer it. Failure scenario: a reader editing a root app reads the troubleshooting table and concludes they must approve after every save. Verdict: item 13, minor.
- 6. `config/text/views/apps/apps.yml:88`: `host_wait_dependency: 'The program of this app waits for the app {0}, which cannot run.'` (and the same wording at `processes.yml:35`). Case 6 asks that the host "says the dependency is missing". The one line covers missing, refused, disabled and unapproved alike, so a missing dependency is never named as missing. Failure scenario: a reader with a typo in `depends` is told `x` "cannot run" and looks for a broken app that does not exist. Verdict: case 6 partial.

## 2. Proof

- 1. Report, first line: "Everything in the brief is done." against the report's own verify row 7: "not verified: no separate pass of that reading was made, and no departure is named". A required verify step was not done, yet the opening line says everything is done. The rules file's "Reports state the end state" requires an undone part to be stated first. Failure scenario: the orchestrator reads the first line and skips the sentence-length and list-item read that nobody did. Verdict: none on an item. Verify item 7 is not done.
- 2. Report, opening "Not verified: three tests of `npm run test:checks` fail in this worktree because the hub folder `.oculus/config` is not in it". On my rerun the three tests pass (33 of 33 in their two files, 271 of 271 in test:checks), and the folder now exists in the worktree. The claim was true when written, and the state has changed since. Failure scenario: none for the code. The orchestrator should not book these three as open.
- 3. Report, "Failing line on the unchanged tree" section: most first-run lines are "Cannot find module" import failures. The kept-root-app row and the two closed-channel rows of `manifest.test.ts` were judged by reading (report line 914) and were not run on the base. This is a light proof that each new row tests its own behaviour, and it is disclosed. Verdict: none.
- 4. Report judgment call 7: "The context's `close()` calls `hosts.stop()` ... so a restart of the dev server stops its hosts the same way as the built server". `context.ts:582` calls `hosts.stop()`, and that is `apps-hosts.ts:101-105`, which does `void hosts.close()`. The stop is started and not awaited, so "the same way" holds for starting the stop, not for its end. Verdict: see Behaviour 3.
- 5. Report judgment call 10: "`Verdict` in `host/plan.ts` is a union of four members (no host, disabled, approval, cycle)". `host/plan.ts:16-26` has six members: ok, nohost, disabled, approval, cycle and dependency. Minor. Verdict: none.

## 3. Standards

- 1. Report "Accidental git commands": "Five git commands were run by accident, all read-only (four reads of repository state, one `git diff --no-index` of two empty paths)". The standing spec's "Where you work" says "You never run a git command, read-only ones included ... not `diff`, `diff --stat`, `log`, `show`, `status`, `ls-files`, `rev-parse` ...". The report discloses the five commands but does not name four of them. My `git status --short` and `git diff 398537672 --stat` show only the step's files changed. Nothing in the tree changed through git. Failure scenario: none in the tree. The breach is real, and the four unnamed commands cannot be checked against the list. Verdict: none on an item. It is a breach of the spec.
- 2. `read/state.ts: DEFAULT_KEY`, `row-menu.ts: ROW_ADD_APP`, `flows.ts: AppAsk`, each kept exported for tests alone (report lines 268 to 270). The standing spec's SOLID/YAGNI rule says an export "with no importer outside its own file and its tests is removed or made local". Failure scenario: three exports with no production caller widen the module surface the next step must keep. Verdict: none, minor. (For `ROW_ADD_APP`, the sibling `ROW_*` names are already on the base's list, so the form matches the file's existing pattern.)
- 3. `config/text/views/system/machine/processes.yml:44`: a blank line added after `host_stop_question`. It is the only blank line inside the map in that file (`grep -n '^$'` prints only 44). Minor. Verdict: none.
- 4. Paths outside the write list without a reason in the report: `tests/views/shared/explorer/add-app.test.ts` and `tests/views/system/workbench/app-badges.test.ts` are new files. The report's paths-outside-the-list section (around line 697) does not mark them, while the standing spec says the file table marks each path outside the write list with its reason. The other outside paths (`core/json.ts`, `settings.ts`, `writes.svelte.ts`, `shapes.ts`, `server-context.ts`, `apps-hosts.ts`, `server.yml`, `glyphs.yml`, `icons.yml`, `limiter.ts`, `README.md`, `keys.test.ts`, `boundaries.test.ts`, `settings.test.ts`, `entities-fixture.ts`, `eslint-switch.test.ts`) are listed with reasons. Verdict: none, minor.

The two widened checks, judged by reading:

- `tests/checks/tree/boundaries.test.ts`, the `data/helpers/run/limiter` row: acceptable. The row uses the check's own mechanism for a pure helper that the page and the server share, and its reason sentence says so. The limiter moved out of `state/system/apps/limits.ts` so that the server's host manager and the page count with one implementation. Two copies would fail `duplication.test.ts`. The row adds no path beyond that one module. Not a finding.
- `tests/checks/source/keys.test.ts`, `fixtureApp({ name: 'off', disabled: true })`: acceptable. It reaches `apps.disabled_mark` through registration metadata, as the existing `draft` and `kept` fixtures reach `unapproved_mark` and `editing_mark`. No predicate or threshold is loosened. Not a finding.

## 4. Behaviour

- 1. CRITICAL. `src/lib/server/machine/apps/serve/oculus.js:168-169` and `:225-226`: `return { ...page, fs: {...}, commands: {...}, secrets: {...}, host: {...} };` and `const page = nested(await link({ messenger, methods }).promise); paint(await page.getTheme());`. What is wrong: `page` is penpal 8.0.1's remote proxy, `new Proxy(Object.create(null), { get, apply })` (`node_modules/penpal/dist/penpal.mjs:180`). It has no own keys and no `ownKeys` trap, so the spread copies nothing. The `node -e` check above prints `direct: function` and `after spread: undefined [ 'fs' ]`. After `nested()`, `page.getTheme`, `read`, `write`, `open`, `key`, `getState`, `setState`, `getStore`, `setStore` and every other flat method is undefined. `fetched()` keeps the raw proxy in its closure, so only the `fs` calls would still reach the page. `paint(await page.getTheme())` throws a TypeError, so `connect()` rejects for every app, the existing apps on main included. No test runs `oculus.js` (`grep -rln 'serve/oculus' tests` prints nothing), which is why every suite is green. Where the report should have stated it: judgment call 1 describes the nesting as working. Failure scenario: any approved app opened after this step lands. Its `oculus.connect()` rejects with "page.getTheme is not a function", and the app draws nothing and reads nothing. A fix within the step: build the nested object from the proxy by name (for example `const flat = (name) => (...args) => page[name](...args)` for each method the page exposes), and add a test that loads `oculus.js` against a penpal pair. Verdict: item 9 violated; cases 13, 14, 15, 20 to 23, 25 to 27 and 32 partial on the frame side.
- 2. `host/manager.ts` (the row publish): each published `app-hosts` row carries the host's whole kept output (up to `host_output_kb`, 256 KB by default), and each output flush republishes after 250 ms. A chatty host makes every Processes subscriber receive up to 256 KB per row four times a second. The report does not name this cost. Verdict: none. Not measured; see Declined to judge.
- 3. `src/lib/server/root/process/apps-hosts.ts:101-105`: `stop: () => { offRead(); offStores(); void hosts.close(); }`, called from the synchronous `close()` at `context.ts:582`, which `serve.ts:46-50` runs on the server's `close` event. What is wrong: `hosts.close()` sends `deactivate`, waits up to `apps.host_stop_seconds` (5 s), then SIGTERM, then SIGKILL 2 s later, but nothing waits for it. Under the Vite plugin (`vite-plugin.ts:66`, `wireServer` per `configureServer`), a server restart makes the new context and runs its `hosts.reconcile()` while the old hosts are still stopping. Item 5 says the new context "stops the old context's hosts first, so no host runs twice". The report's judgment call 7 says "not tested" for a second context while the first is open, and takes the matter no further. Failure scenario: an app with `onStartupFinished`, and the reader edits `vite.config.ts` in dev. For up to 7 seconds, two hosts of the same app run and both write the same store file through two separate store queues. Verdict: item 5 violated, Spec 2.

## Declined to judge

- The Linux store selection: `secrets/secrets.ts` uses `findCredentialsAsync(service)` for count and clear, and that call takes no `{ linux: { store } }` option, unlike the `AsyncEntry` calls. On a Linux machine with both keyutils and Secret Service, the count could read a different store from the one the entries were written to. This cannot be run on macOS. A run on Linux with both stores present would settle it.
- Every view behaviour (the approval panel, the Processes group, the catalogue's disabled mark, the tab's ended line with Restart). These are for the look on landing, and this review starts no app.
- Whether `vscode-jsonrpc`'s lazy `require` calls inside the runner pass the `registerHooks` resolve guard on every path. The host-runner tests (11 passed) cover the common path; a host that uses cancellation and progress would settle it.
- Whether matching the `commands.run` press by repo and command name (`afterPress`) races with a press of the same command by the reader at the same moment. Settling it needs a timing test that this review did not run.
- The cost of whole-output row publishes (Behaviour 2) and of the unmemoized DFS in `cyclesOf` (`host/plan.ts`) on a large `depends` graph. Neither was measured, and a measurement would settle both.
- Whether `app-messages` should exist as a separate channel or ride `app-hosts`. That is Axel's call (Spec 3).
- Brief case 24 against item 9 on dot-led paths. That is the orchestrator's ruling (Spec 4).

Reviewer usage: a7d94dafa7d50c3a1, claude-opus-5-5, 114,844 tokens, 113 tool uses, 19.9 minutes.

## Repair round 1, refuted

**Not closed: item 3 of the round (old hosts stopped before a dev reload starts new ones).** The handover the builder added does not carry over a real Vite restart, because Vite rebuilds the plugin, and with it the handover object, on every restart. Item 5 of the brief therefore still breaks, as the first review's Behaviour 3 found. Spec 1 below has the details. The other 13 round items are closed, apart from the minor findings below.

Every command ran from `tools/oculus` in `.agents/worktrees/D62`. Node is v24.21.0.

**How the round's delta was read.** I took the base files from `git diff 398537672`, reversed onto the worktree; the 11 deleted files came from the base copy. I applied `agents/reviews/D62-before-round1.patch` to those base files in a scratch folder. That rebuilt the 132 files as they stood when the round was sent. I then diffed each one against the worktree. 42 files changed in the round: 41 of them, plus `src/lib/server/root/vite-plugin.ts`, which the patch does not contain. I ran no git command other than `git diff 398537672` and `git status --short`.

```
npm run test:quick -- --base 398537672
test:quick: 149 changed file(s), from git since 398537672
test:quick: 140 test file(s), 10 essential
ok      ASCII gate (1.0 s)
ok      prettier (2.5 s): All matched files use Prettier code style!
ok      eslint (1.9 s)
ok      svelte-kit sync (2.8 s)
ok      svelte-check (7.2 s): 1791676667712 COMPLETED 464 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (38.6 s): Duration  32.51s (transform 31.91s, setup 0ms, import 59.64s, tests 60.53s, environment 304ms)
test:quick: 39.6 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
exit 0
(two more runs: "test:quick: 31.2 s (limit 45.0 s); every command passed" and "test:quick: 32.9 s (limit 45.0 s); every command passed")

npm run test:checks
 Test Files  17 passed (17)
      Tests  271 passed (271)
exit 0

npx vitest run oculus-frame.test.ts manage.test.ts host-manager.test.ts app-manage.test.ts host-output.test.ts apps-handover.test.ts
 Test Files  6 passed (6)
      Tests  76 passed (76)
npx vitest run host-runner.test.ts eslint-switch.test.ts manifest.test.ts app-gate.test.ts
 Test Files  4 passed (4)
      Tests  100 passed (100)
--reporter verbose: oculus-frame 4 tests 51, 24, 25, 25 ms; host-output 3 tests 0-1 ms; apps-handover 'hands each context the promise of the hosts of the one before it' 961ms

sh utils/unused-exports.sh (exit 0), diffed with .agents/worktrees/D62-base/tools/oculus/unused-exports.txt
81c81
< src/lib/server/machine/apps/oculus.js: connect
---
> src/lib/server/machine/apps/serve/oculus.js: connect

sh utils/folder-check.sh: no output, exit 0 (src/lib/state/system/apps holds 10 items)

wc -l: context.ts 880, model-machine.ts 862, host/manager.ts 652, row-menu.ts 632, AppFrame.svelte 319, AppHosts.svelte 173, Processes.svelte 125, apps-hosts.ts 138, vite-plugin.ts 93, oculus.js 275, manage.ts 158; every source file at or under 880, every component at or under 520

LC_ALL=C grep -c '[^ -~]' over the 138 added or changed files listed by git status --short: no file above 0

Commands the round section quotes, rerun:
grep -n "app-messages" DESIGN.md docs/apps.md  -> DESIGN.md:122, :380, :469, :471, docs/apps.md:136 (as claimed)
grep -n "Keep approved while I edit" docs/apps.md -> 59, 421; line 421 ends "use Keep approved while I edit for an app you are editing" (as claimed)
sed -n 17,31p src/lib/server/machine/apps/host/plan.ts -> six members ok, nohost, disabled, approval, cycle, dependency; dependency carries approval and absent (as claimed)
npx prettier --check DESIGN.md docs/apps.md HELP.md README.md -> All matched files use Prettier code style!
LC_ALL=C grep -c '[^ -~]' DESIGN.md docs/apps.md HELP.md -> 0, 0, 0
sed -n 40,46p processes.yml; grep -n '^$' processes.yml -> no blank line (as claimed)
npx vitest run tests/server/machine/apps/manifest.test.ts -> Tests  68 passed (68)
Per-file counts claimed (oculus-frame 4, manage 17, host-manager 35, app-manage 16, host-output 3, apps-handover 1) add up to the 76 above.
```

Not run:
- `npm run diagrams`. It writes `docs/diagrams/`, and this review changes no file.
- The new tests of items 3 and 5 on the tree as it stood before the round. That would bring back the code under test in order to watch a test fail, which this review's limits forbid. Those tests are judged by reading, under Proof 1.

### Verdicts

Items of D62.md "What to build", for the whole diff since the base:

- 1 (manifest): holds. The five keys are in `read/manifest.ts`; `manifest-host.test.ts` and `manifest.test.ts` pass (68 rows in manifest.test.ts). The case-6 wording is now in place (case 6 below).
- 2 (approval panel): holds by reading `ApprovalPanel.svelte` (184 lines). How it looks is left to the look.
- 3 (keep approved for root apps): holds. `approve.test.ts` and the `manifest-host.test.ts` keep rows pass, and `docs/apps.md:421` is now true.
- 4 (WebAssembly): holds. `serve/address.ts` script-src gains `'wasm-unsafe-eval'` and nothing else; the `app-files.test.ts` policy row passes.
- 5 (the host): violated, Spec 1. The dev-reload sentence of the item fails under a real Vite restart. Everything else in the item holds: start, argument array, environment, the deactivate, SIGTERM, SIGKILL sequence, Restart and the output limits (host-runner, host-manager and manage pass). The output now reaches the Processes view by the `app-host` route (Z789 (a)).
- 6 (activation): holds; host-manager glob, language and scan_entries rows pass.
- 7 (protocol): holds. Not touched by the round, and the DESIGN.md table is unchanged in substance.
- 8 (secrets): holds on macOS (`secrets.test.ts`). The Linux store selection is under Declined to judge.
- 9 (frame methods): holds. `flat(page)` (`serve/oculus.js:174-180`) builds one function per name in `METHODS` (`:152-168`). `oculus-frame.test.ts` 'hands the app a function for every method the page builds' asserts that the flat keys of the connected object, sorted, equal the keys of `createMethods`, sorted. That is the list equality the round brief asks for, and it passes. Another test carries `getTheme`, `read`, `getStore`, `fs.readFile`, `commands.run` and `host.request` to the page's handlers with their arguments and answers; it passes.
- 10 (Processes view): holds by reading `AppHosts.svelte` and `Processes.svelte`. The output pane reads through `createOutputReader`, and the look remains for landing.
- 11 (one app using another): holds. `remove.ts:103` calls `stop(app.id, { dependentsFirst: true })`, which runs `#stopDependents` before the app's own `process.stop()` (`host/manager.ts:449-466`). `manage.test.ts` 'stops the host of an app that depends on it first and its own host last' expects `['a', 'base', 'trash']` and passes.
- 12 (managing apps): holds; manage, app-manage, flows, add-app and app-badges pass.
- 13 (documents): violated in one sentence, `DESIGN.md:438` on the dev reload, which is false while Spec 1 stands. Everything else holds: `app-messages` is in DESIGN.md:469 and docs/apps.md:136 with its payload; `app-hosts` carries `outputBytes`; `host_wait_missing` is in docs/apps.md:274 and :432; the troubleshooting row reads as it should. Standards 6 has a smaller wording point.
- 14 (size and folders): holds. folder-check exits 0, `context.ts` is at exactly 880, and no file is over its limit.

Cases:

- 1 to 5: met (`manifest-host.test.ts`).
- 6: met. `host-manager.test.ts` 'says a dependency that no app provides is missing, and one that is refused, disabled or unapproved is not' expects `absent: ['missing', 'nonesuch']` and `dependency` for the other three, and passes.
- 7, 8: met (host-manager start rows, the G7 argument row, the unapproved, disabled and changed-kept rows).
- 9: partial. Disable, revoke, change, remove and close are met (host-manager, host-runner). The dev-reload part is unmet under a real Vite restart, Spec 1.
- 10: met on the server (the Restart row). The tab line is read in `AppFrame.svelte`; how it is drawn is for the look.
- 11, 12: met (`host-runner.test.ts`).
- 13: met. host-manager and methods cover the server and page; `oculus-frame.test.ts` covers the frame's `host.request`. The `host_down` rows pass.
- 14: met. `hostTargets` (`rules.test.ts`), the `app-messages` publish (host-manager) and the frame's `onHost` (`oculus.js`, the `onHost` handler in `connect`) are read and run. The page-to-frame direction is not run by `oculus-frame.test.ts` (Declined to judge).
- 15: met. The host store rows, `app-store.test.ts`, and the frame's `getStore` through `oculus-frame.test.ts`; `setStore` goes through the same flat path, by reading.
- 16 to 19: met (host-manager).
- 20 to 23: met. `app-fs.test.ts` and `methods.test.ts`; the frame's `fs.readFile` through `oculus-frame.test.ts`.
- 24: met under Z788 (a). A dot-led segment answers `closed`, and the report notes the ruling in its case-24 row.
- 25: met (`commands.test.ts`, `methods.test.ts`, the frame's `commands.run` in `oculus-frame.test.ts`).
- 26, 27, 28: met (`secrets.test.ts`, `methods.test.ts`, the `app-manage.test.ts` header row). The frame's `secrets.*` follow the nested path, by reading `oculus.js:219-224`.
- 29: met (the `opening` tests, and `AppFrame.svelte` through `tabForKind`).
- 30, 31: met.
- 32: met on the server and page state. "The frame draws" is for the look; it is no longer blocked by `connect()`.
- 33: met.
- 34: met, the stop order now included (`manage.test.ts` row above).
- 35 to 43: met as in the first report. Row 38 is the `messages_per_min` row; 41 the output cap row, now read through `hosts.output`; 42 the closed-channel rows.

### Findings

**Spec**

- 1. Item 3 of the round, the dev-reload handover (closure claimed, not reproduced by reading).
  - Where:
    - `src/lib/server/root/vite-plugin.ts:56`: `const handover: HostsHandover = { until: Promise.resolve() };`, made inside `oculusViteServer`.
    - `vite.config.ts:92`: `const development = oculusViteServer(engineDir(), { out: folders.adapter });`, called inside the `defineConfig(({ mode }) => ...)` function.
  - What is wrong: a dev server restart under Vite 8.3.0 loads the configuration again, so every restart makes a new plugin and a new `handover`. The chain in `node_modules/vite/dist/node/chunks/node.js`:
    - `restartServer` calls `_createServer(inlineConfig, ...)` (line 24707).
    - That calls `resolveConfig`, which calls `loadConfigFromFile` (line 36906).
    - That calls `configExport(configEnv)` (line 37307). This runs the config function again, so `oculusViteServer` runs again.
  - Result: the new context's `handover.until` is a promise that has already settled. The promise the old context's `stop` resolves sits on the old, dropped object.
  - The round brief's premise does not hold. It said the handover would travel through "the object that already carries state from one `configureServer` call to the next (`vite-plugin.ts`, `process/serve.ts`)". In fact, one closure of `oculusViteServer` serves exactly one server's `configureServer`.
  - The two new tests share one handover between two contexts they build by hand, which Vite never does: `host-manager.test.ts:184` and `apps-handover.test.ts:36`. The head comment of `apps-handover.test.ts` says it does not cover Vite's restart. Under Proof, these tests would still pass with the dev-reload behaviour absent in the real run.
  - Also false while this stands: `DESIGN.md:438` ("held by the Vite plugin for all its contexts ... so no host of one app runs twice"), the report's judgment call 7, and the report's first line.
  - Failure scenario: an app with `activation: [onStartupFinished]` and a running host. The reader edits a file `vite.config.ts` imports, such as `src/lib/server/root/context.ts`, and Vite restarts. Vite builds the new server, and so the new context, before it closes the old one. The new `AppHosts` holds only for one microtask and then starts the host. The old host only gets `oculus/deactivate` when the old server closes, and then up to `host_stop_seconds` plus 2 s. For up to 7 s two hosts of the app run and write one store file through two store queues. This is the first review's Behaviour 3, unchanged.
  - What a fix needs: something that outlives a reload of the configuration. Under the rules file's ban on globals, that is a record outside the process's memory, for example a per-app lock or pid record that the runner holds and the next start waits on. That record is a new file shape (under `~/.oculus` or the temporary folder), so it is a decision for the orchestrator, or for Axel if it is user-visible.
  - Verdict: item 5 violated; item 13 violated in the DESIGN.md:438 sentence; case 9 partial.

**Proof**

- 1. The failing runs for items 3 and 5.
  - Where: the report's "Repair round 1", items 3 and 5, and the round section's opening line ("for item 3 the failing run quoted is the same tests with the new option left out, ... for item 5 no failing run exists").
  - Item 3: the "before" runs are of temporary copies, `tests/server/machine/apps/tmp-before.test.ts` and `tests/server/root/tmp-handover.test.ts`, built "with the new option left out". That is a run with the behaviour removed, which the rules file's "What every package obeys" forbids ("no run with the behaviour removed"). It is also not the tests in their after-change form on the tree as it stood. Those copies are no longer in the tree (`git status --short` lists neither).
    - By reading, `host-manager.test.ts:184` in its after-change form would run on the tree before the round, since the extra `after` option is simply ignored there. It would fail at `early: []`. That run is the one the brief asks for, and it is not quoted.
  - Item 5: no failure is quoted for `host-manager.test.ts` 'carries the size of the output in its row and none of the text...', for `app-manage.test.ts` 'answers the kept output of the host of the view...', or for the three `host-output.test.ts` tests. By reading:
    - The host-manager row would fail before the round (`outputBytes` absent, so `counted` is 0 rather than 26, and `hasOutputField` is true).
    - The app-manage row would get 400 from the old `commandShape`.
    - `host-output.test.ts` fails on import (`createOutputReader` does not exist).
    - So these read as real tests of their behaviour, not audits. The missing quoted failure is the gap.
  - The G1 row 'app-host output answers 403' guards a behaviour that is preserved, since `tokenedBody` comes first; its pass before the round is not quoted.
  - Failure scenario: the orchestrator books the item 3 tests as proof of the dev-reload fix, but the only red run shown came from a removed-behaviour copy; the real path is broken (Spec 1).
  - Verdict: none on its own (Spec 1 carries item 5).
- 2. The report's first line, "Everything in the brief and in the 14 items of repair round 1 is done, and no item is open", is false while Spec 1 stands. Failure scenario: a reader of the first line lands item 3 as closed. Verdict: see Spec 1.
- 3. The report's verbatim quote of test:quick (round section, under "The verify list of the round") prints `test:quick: not covered: tests outside the selection, tests/checks, slow tests,` twice. Three reruns print it once. The quote is not verbatim; no decision rests on it.

**Standards**

- 1. Git commands in the round.
  - What happened: "Accidental git commands" names three run in this round, `git diff --stat`, `git status` and `git --version`. The round brief said "you run no git command of any kind, read-only ones included", and the rules file says so under "Where you work". The build's count is now six; the report adds `git mv` with no arguments.
  - The report names all nine and declines to write the "none in this round" sentence the round brief asked for, which is correct. The breach itself stands.
  - No effect on the tree: `git status --short` lists only the step's paths.
  - Failure scenario: none in the code; it is a breach of the spec the orchestrator should record.
  - Verdict: none.
- 2. Tests without a guarded entry.
  - What is wrong: the rules file's "What every package obeys" says a test exists only as the test of one `agents/guarded.md` entry, a builder writes no other test, and a test exists only for behaviour whose failure costs something.
    - The three `tests/state/system/apps/host-output.test.ts` tests were not asked for by the round brief and have no entry. Their failure costs nothing in that sense: the output pane shows stale lines.
    - The `host-manager.test.ts` row 'carries the size of the output in its row and none of the text...' was asked for by round item 5, but no entry names it. Its guarantee is a bandwidth shape (Z789), not one that fits G49 or G75.
    - The `app-manage.test.ts` row 'answers the kept output...' is placed under G49. G49 is "an app reaches only what its approval names", and this row does not test that.
  - Failure scenario: three tests and two rows land with no entry, against the one-entry rule.
  - Disposition is the orchestrator's: name an entry, or ask Axel for one, for the two rows the round brief asked for; remove `host-output.test.ts`. Verdict: none.
- 3. Fixed sleeps in new tests.
  - Where: `tests/server/machine/apps/oculus-frame.test.ts:122` `await new Promise((resolve) => setTimeout(resolve, 20));` in `afterEach`, and `tests/server/machine/apps/host-manager.test.ts:204` `await new Promise((resolve) => setTimeout(resolve, 0));`.
  - What is wrong: the rules file says "A test waits on a signal (an event, a promise, a fake clock), never on a fixed sleep or a wall-clock margin". Six base test files already sleep this way; that is precedent, not a waiver.
  - Failure scenario: on a loaded machine, penpal's teardown comes after 20 ms. The globals are then unstubbed with the teardown still pending, and a later file sees a broken `window`. The builder's run 1 shows the same kind of leak: 11 `bar-actions.test.ts` failures from a left stub.
  - Verdict: none.
- 4. File-scope mutables in new tests: `oculus-frame.test.ts:45` `let script: ... | null = null;` and `apps-handover.test.ts:22` `const live: ServerContext[] = [];`. The rules file's no-globals rule says it "holds in test fixtures and helpers too". The base tree has 14 such lines in tests. Minor. Verdict: none.
- 5. The `apps-handover.test.ts` test took 961 ms in this review's run and is not tagged slow. The rules file says "A test runs in well under a second; one that cannot ... is tagged slow." Failure scenario: test:quick's 45 s limit gets nearer on loaded runs (the builder saw 46.9 s and 50.5 s). Verdict: none.
- 6. Public names and the docs.
  - Undocumented names: the `oculus` object an app gets now also holds `fsAddress`, `commandsRun`, `secretsGet`, `secretsStore`, `secretsDelete` and `hostRequest` as flat functions beside `fs`, `commands`, `secrets` and `host` (`serve/oculus.js:152-168`, `:205`). `grep -n "fsAddress\|commandsRun\|secretsGet\|hostRequest" docs/apps.md DESIGN.md` prints nothing. This follows round item 1's wording, "every flat method of the object `createMethods` returns", so the disposition is the orchestrator's: either document the six names in `docs/apps.md`, or leave them off the app's object and compare the test against the flat keys minus those six.
  - `DESIGN.md:438` says the view asks "again after each row update while it stays open". `createOutputReader` (`state/system/apps/manage.ts`) asks again only when `outputBytes` changed; `docs/apps.md:271` describes it correctly ("whenever the output has grown").
  - The head comment of `src/routes/api/(apps)/app-host/+server.ts:1` still names only "the page's Stop and Restart", without Output.
  - Failure scenario: an app builder calls `oculus.fsAddress` and depends on a name the docs never promised.
  - Verdict: none.

**Behaviour**

- 1. The dev restart still runs two hosts of one app, as Spec 1 says. The report says the dev reload is "shown by tests and by reading only" and marks it closed, with no before and after for the restart that still runs two hosts. Verdict: item 5 violated (Spec 1).

The other visible changes of the round are stated in the report's "Visible changes" items 2 and 4: the Processes output read from the server when it is opened, and the "not installed" line. Remove's stop order is a server ordering with no new visible state.

**The points the brief asked to be judged**

- Item 1: `flat(page)` reaches every method of `createMethods`, and the test asserts the list equality (Verdict 9).
- Items 3 and 5 evidence: Proof 1.
- Item 3, file-scope mutables: `HostsHandover` adds no new file-scope mutable. `handover` is a `const` inside `oculusViteServer` (`vite-plugin.ts:56`) and `#holding` is an instance field (`host/manager.ts:123`). That same placement is why it does not survive a restart (Spec 1).
- Item 5, the `output` action: it is under the token and the same refusals. `handleHostPost` runs `tokenedBody` before it parses the command (`routes/host.ts`, start of `handleHostPost`), and an unknown view answers 404 `missing` as Stop and Restart do. A frame cannot send it: frame calls go through the page's `hostRequest`, which posts `action: 'request'`. The 403 row passes.
- The git commands: Standards 1.
- The two new tests with no guarded entry: Standards 2.

### Declined to judge

- The Linux keyring store selection (`findCredentialsAsync` takes no `{ linux: { store } }`). It cannot be run on macOS; a Linux machine with both keyutils and Secret Service would settle it.
- The page-to-frame direction of the bridge (`onChannel`, `onTheme`, `onStore`, `onHost` called by the page into a real sandboxed iframe). `oculus-frame.test.ts` runs only frame-to-page calls over a fake shared window. The look on landing settles it.
- How every view looks: the "not installed" line in a tab and a Processes row, the output pane read from the route, the disabled mark, the approval panel. These are for the look on TEST.
- Whether Vite 8.3.0's restart closes the old HTTP server, and so runs `context.close()`, before or after the new context's first host start: the order is read from `restartServer`, not run. Spec 1 holds either way, because the handover object is new on each restart.
- `npm run diagrams` was not rerun, because it writes files. The diagram files the round changed (`channels`, `layer-views`, `layers`, `.dot` and `.svg`) were not regenerated to compare.
- The cost of the unmemoized `cyclesOf` walk in `host/plan.ts` on a large `depends` graph, which was not measured.

Reviewer usage: a0fa01e25cf725e2b, claude-opus-5-5, 272,184 tokens, 67 tool uses, 18.0 minutes.

## Closed

The run over repair round 1 is the last run; its findings go to landing, none back to the builder. The first run's findings are closed by the round as the run over it states, except Spec 2 and Behaviour 3, closed at landing with the round run's Spec 1.

- Round run Spec 1, first run Spec 2 and Behaviour 3, round run Behaviour 1 (a dev restart runs two hosts of one app): fixed at landing. Vite 8.3.0's `restartServer` makes the next server with a new plugin, then awaits `server._closeServer('restart')`, which awaits every plugin's `closeServer` hook after the old HTTP server closed, and only then listens on the next server. The plugin (`src/lib/server/root/vite-plugin.ts`) now holds the context it served and its `closeServer` hook awaits `served.hosts.close()`; each context gets `ready`, a promise that settles when its own server listens, and `AppHosts` starts no host before it (`after: options.ready` in `process/apps-hosts.ts`). `HostsHandover` is removed. `tests/server/root/vite-restart.test.ts` drives two real plugins over real HTTP servers in Vite's order and asserts `['old hosts stopped', 'old server closed', 'next hosts may start']`; it passes on main and, written against D62's tree before the fix, failed with "TypeError: next.ready(...).then is not a function". `DESIGN.md`'s sentence on the restart says how it holds.
- Round run Proof 1 (no failing run on the unchanged tree for items 3 and 5): item 3's tests are replaced by the landing's restart test, whose failing run is quoted above; item 5's tests are removed (Standards 2 below).
- Round run Proof 2 (the report's first line): stands as a statement of the builder's report; the landing report states the end state.
- Round run Proof 3 (a doubled line in a verbatim quote): noted; no decision rests on it.
- Round run Standards 1 (nine git commands across the build, three in the round, all read-only): recorded in the booking; the tree shows no effect.
- Round run Standards 2 (tests with no guarded entry): `tests/state/system/apps/host-output.test.ts`, the host-manager row 'carries the size of the output in its row and none of the text...' and the app-manage row 'answers the kept output...' are removed, since a stale output pane costs nothing the rules file names. Every other new test of the step is named under exactly one entry of `agents/guarded.md` (G1, G2, G7, G9, G10, G13, G31, G49, and the new G75 and G76), the add-app tests under G10 and `appsSettings` under G13.
- Round run Standards 3 (fixed sleeps): the host-manager row waits on deferred promises, and `oculus-frame.test.ts`'s `pair()` returns a `finish()` that waits until both ends removed their `message` listeners from the shared window before it unstubs.
- Round run Standards 4 (file-scope mutables): `oculus-frame.test.ts`'s `script` cache is removed and the script is loaded fresh in each case; `live` went with `apps-handover.test.ts`.
- Round run Standards 5 (a 961 ms test not tagged slow): closed with Spec 1, the file removed.
- Round run Standards 6 (public names): `oculus.js` hands an app only the nine names `read`, `getTheme`, `getState`, `setState`, `getStore`, `setStore`, `write`, `open` and `key` beside `fs`, `commands`, `secrets` and `host`; the six flat names the page builds for those groups are no longer on the app's object. `oculus-frame.test.ts` asserts that the flat keys equal the page's keys minus those six and that the six are all page keys. `DESIGN.md` says "whenever the output has grown", and the head comment of `src/routes/api/(apps)/app-host/+server.ts` names the read of a host's output.
- First run declined point, the Linux store of `findCredentialsAsync`: no defect. Every entry is pinned to `secret-service`, which throws when that store is absent, and `findCredentialsAsync` with no option reads the Secret Service first and falls back to the kernel keyring only when the Secret Service is absent (`node_modules/@napi-rs/keyring/index.d.ts:218-223`), when no entry can have been written.
- Round run declined point, the page-to-frame direction: the look ran a real sandboxed frame in Chrome; `getTheme`, `host.request` and the theme paint at connect were seen working. A call from the page into the frame (`onChannel`, `onTheme`, `onStore`, `onHost`) was not exercised in the look.
- The other declined points (`vscode-jsonrpc`'s lazy `require` paths, a `commands.run` press racing a reader's press, the cost of `cyclesOf` on a large graph): not checked at landing; none is a finding.
