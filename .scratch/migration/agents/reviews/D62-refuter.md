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
