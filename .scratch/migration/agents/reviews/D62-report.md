Everything in the brief is done. Not verified: three tests of `npm run test:checks` fail in this worktree because the hub folder `.oculus/config` is not in it (`ls -d .../D62/.oculus/config` answers `No such file or directory`, the main checkout has it): `config-folder.test.ts` 'reads the roots of sources.yml without a finding' and 'names a group of its own and a path under the hub for every document', and `integrity.test.ts` 'validates with no findings'. They are not run on a tree that has the folder.

# D62 report: apps, the host, the bridge and app management

## Open items of the state file, verbatim

The worktree's `tools/oculus/.scratch/migration/orchestrator-state.md` lines 140 to 144:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
>
> None.

## The cases ruling this step ran under

The coordinator's cases ruling (round 0), `agents/briefs/D62-cases.md`, quoted whole. The runner is `src/lib/server/machine/apps/host/host-runner.mjs`, started as `join(ownFolder(), ...)`, and its guard is `module.registerHooks({ resolve })` in the runner's own thread; `tests/server/machine/apps/host-runner.test.ts` has a row for a static import, a dynamic `import()` and a `require` through `createRequire`.

> # D62: the cases ruling (round 0)
>
> The builder's first run handed back two places where the brief's rules get a case wrong, before any change. Both fixes stay inside the step's part. The builder resumes at once and builds the whole brief under these two rulings; everything else in the brief stands.
>
> ## 1. The import guard uses `module.registerHooks`
>
> Item 5's "Only approved code runs" names `module.register` of `node:module` with a `resolve` hook. That hook runs on a separate loader thread and does not see a `require` made through `createRequire`, so the brief's own sentence "A dynamic `import()` and a `require` made through `createRequire` meet the same hook" cannot hold with it.
>
> Checked on Node v24.21.0, the Node that Electron 44.5.1 runs (`ELECTRON_RUN_AS_NODE=1 node_modules/.bin/electron -e "console.log(process.versions.node, typeof require('node:module').registerHooks)"` prints `24.21.0 function`), with a host file that does a dynamic `import()` of an unrecorded file, a `createRequire` `require` of an unrecorded file and an import of `node:fs`:
>
> - `module.register` with a `resolve` hook: `{"dyn":"refused...","req":"loaded","node":"loaded"}`.
> - `module.registerHooks({ resolve })`: `{"dyn":"refused...","req":"refused...","node":"loaded"}`.
>
> Ruling: the runner installs the guard with `module.registerHooks({ resolve })` of `node:module`, in the runner's own thread, before it imports the host file. The hook resolves through `next`, then refuses every `file:` URL whose real path is not one of the app's recorded files, with an error that names the refused file and the rule; `node:` built-ins pass. The set of recorded real paths is held in the hook's closure, passed to the runner by the server at start. Static `import`, dynamic `import()` and `require` through `createRequire` all meet this hook, and case tests cover each of the three. `module.register` is not used.
>
> ## 2. The runner is the tree file of item 5; decision 10 is dropped
>
> Item 5 says the runner is `host-runner.mjs` in the apps folder's host subfolder, started from `ownFolder()` as `eslint-child.mjs` is (`src/lib/server/machine/runs/lint/eslint.ts:45`, `ownFolder()` at `src/lib/server/machine/lsp/servers.ts:401`, which walks up from the module to the folder holding `package.json`; `comment-worker.mjs` is started the same way at `src/lib/server/machine/runs/lint/writing/comments.ts:113`). Decision 10 says the runner is written at server start to a 0700 folder of the OS temporary folder and removed at close, on the premise that a build has no `src` on disk. That premise is false for this tree: the lint child and the comment worker already run from `src` through `ownFolder()` in every build oculus runs. The two texts contradict each other.
>
> Ruling: follow item 5. The runner is `src/lib/server/machine/apps/host/host-runner.mjs`, started as `join(ownFolder(), 'src/lib/server/machine/apps/host/host-runner.mjs')`. Decision 10 is dropped: no temporary folder, no write of the runner at start, no removal at close, and no test of either.

## The cases' first run

The first run of every case on the unchanged tree was handed back before any change, and is quoted below as it was handed back (section 3 is the first run of cases 1 to 43; sections 1 and 2 are the two places the brief's rules gave a wrong result, which the cases ruling above answers).

> ## 1. The rule that gives the wrong result (needs your ruling)
>
> **Rule.** Item 5 ("Only approved code runs") says the runner installs a Node module hook (`module.register` of `node:module`, its `resolve` hook) and that "a dynamic `import()` and a `require` made through `createRequire` meet the same hook". Ruling 46 (4) and the G75 text rest on it.
>
> **Result.** With `module.register`, `import()` is refused and `createRequire(...)(<file outside the folder>)` is NOT refused. A host could therefore load an unapproved file by `require`, which is the escape the hook exists to close.
>
> Probe: `$S/probe`, where `S=/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad`. Node v24.21.0. The hook throws for any resolved `file:` URL containing `/outside/`. The host does `await import('../outside/o.js')`, then `createRequire(import.meta.url)('../outside/c.cjs')`, then `import('node:fs')`.
>
> ```
> $ node run-register.mjs     (module.register('./hook.mjs', import.meta.url))
> {"dyn":"refused: refused file:///private/tmp/claude-502/-Users-axelfaes-works","req":"loaded","node":"loaded"}
> $ node hook-sync.mjs        (module.registerHooks({ resolve }))
> {"dyn":"refused: refused file:///private/tmp/claude-502/-Users-axelfaes-works","req":"refused: refused file:///private/tmp/claude-502/-Users-axelfaes-works","node":"loaded"}
> ```
>
> **Recommendation.** Use `module.registerHooks({ resolve })` (in-thread, synchronous; present in Node 24.21 and so in Electron 44's Node). It refuses `import`, `import()` and `require`/`createRequire`, and it needs no `data` hand-over because the recorded-file set is a closure. This is a different API from the one the brief names, so I will not substitute it without your ruling.
>
> The lazy option is keeping `module.register` and documenting `require` as a limit. Cases 37 and G75 would then pass while the stated guarantee does not hold.

> ## 2. A second contradiction inside the brief (also needs a ruling)
>
> - Item 5 says the runner "is started from `ownFolder()` as `eslint-child.mjs` is (`eslint.ts:45`)".
> - Decision 10 says the runner "is written at server start to a 0700 folder of the OS temporary folder ... since an adapter-node build has no `src` on disk".
>
> The tree contradicts decision 10's premise:
> - `eslint.ts:45` runs `join(ownFolder(), 'src/lib/server/machine/runs/lint/eslint-child.mjs')` in the built server too.
> - `comments.ts:113` does the same for `comment-worker.mjs`.
> - `src/desktop/package.ts` writes a stub that imports the checkout's `src/desktop/main.ts`, so `src` is always on disk.
>
> **Recommendation.** Follow item 5: `src/lib/server/machine/apps/host/host-runner.mjs`, started from `ownFolder()`. Drop decision 10: no temp folder, no write at start, no removal at close. Writing a runner into the temp folder at start would add a second executable path that an item-5 reading does not need.

> ## 3. First run of every case on the unchanged tree
>
> Command for cases 1-6, 24, 30, 31, 42, 43 and the method-name probes: `npx vitest run tests/firstrun` in the scratch copy `$S/first`.
> - It is the base tree with `node_modules` linked.
> - `config/local.yml` is excluded from the copy.
> - The test file is `$S/first/tests/firstrun/first.test.ts`.
> - It calls the real `scanApps`, `serveApp`, `appPolicy`, `handleApprovePost` and `createMethods`.
> - Its output is in `$S/d62-firstrun.txt`.
>
> **Manifest (cases 1-6, 43)**
>
> Every `host`, `files`, `secrets`, `activation` and `depends` key is refused as unknown (`appShape` is a `z.strictObject` of nine keys). The folder is not offered, so no case that expects "offered" can pass.
>
> | Case | Input | First-run result |
> |---|---|---|
> | 1 | `host: host.mjs` (file present) | not offered; `the key host is not one this oculus reads, so the folder is not an app` |
> | 1 | `host.ts`, `../x.js`, `.h/x.js`, `missing.js` | same finding for each; none checked by its own rule |
> | 2 | `files: [hub/projects]`, `[engine]`, `[nosuchroot/x]` (machine app), `[hub/projects]` (root app) | all refused `key files is not one this oculus reads`; none checked by its own rule |
> | 3 | `files: [my/repo/src]` | refused, unknown key `files` |
> | 4 | `secrets: true`, `secrets: yes` | both refused, unknown key `secrets` |
> | 5 | `activation: [onStartupFinished]` with `host`; `[onBoot]` | both refused, unknown keys `host` and `activation` |
> | 6 | `depends: [base]` | refused, unknown key `depends` |
> | 43 | `files: [hub/x]` on a root app | refused, unknown key `files` (right outcome, wrong reason) |
> | 43 | `activation: [onTab]` without `host` | refused, unknown key `activation` (right outcome, wrong reason) |
> | 43 | `depends: [base]` unapproved | refused, unknown key `depends`; expected "offered, host waiting, row naming `base`" |
>
> **Host (cases 7-19)**
>
> No host manager exists: the apps folder has no file matching `host|runner`, and `host/host-runner.mjs` does not exist. An app with `host` is refused as in case 1, so no app with a host can be approved, enabled or started. Results:
> - Cases 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19: not built; each unrunnable on this tree.
> - Case 13: the page's methods are `read,getTheme,getState,setState,getStore,setStore,write,open,key`; `host` is absent.
> - Case 15: `store.update` has no code (the store is written by the frame's `setStore` only).
>
> **Frame methods (cases 20-31)**
>
> - Cases 20, 21, 22, 23: `createMethods(...)` has no `fs`, `readFile`, `readDirectory` or `stat`.
> - Case 24 (vacuous pass): `serveApp` for `/apps/notes/<right key>/.fs/hub/projects/a.md` answers `404` with an empty body, and a wrong key answers `404`. The route does not exist; a dot-led segment already fails `pathSegmentsOpen`.
> - Case 25: no `commands` method.
> - Cases 26, 27, 28: no `secrets` method; `@napi-rs/keyring` is not in `package.json`.
> - Case 29 (read): `apps.svelte.ts:324-326` calls `deps.layout.openView('source', ...)` for every file, so a PDF opens as source. `tabForKind` (`instance.ts:140-154`) would give `file` for kind `pdf` but the apps store never calls it.
> - Case 30: `handleApprovePost` with `keep: true` on `app:one/notes` answered `status 400 body {"error":"keep"} kept=[]`; expected approved and kept.
> - Case 31: `script-src h/apps/n/k/ h/apps/-/ | holds wasm-unsafe-eval=false`.
>
> **Management (cases 32-43)**
>
> `grep -rIl` over `src config tests package.json docs DESIGN.md HELP.md`, excluding `local.yml`, gives 0 files for each of: `apps.json`, `host_stop_seconds`, `messages_per_min`, `host_output_kb`, `scan_entries`, `app-hosts`, `host_down`, `wasm-unsafe-eval`, `napi-rs`, `Add as App`.
>
> | Case | First-run result |
> |---|---|
> | 32 | no disable state, no `~/.oculus/apps.json`, no disabled mark; not built |
> | 33 | no `apps.json` reader; not built |
> | 34 | no Remove route or action; `ls src/routes/api/(apps)` holds app-open, app-store, approve only |
> | 35 | no Add route, no `Add as App` item in `row-menu.ts` or `files.yml`; not built |
> | 36 | no per-workspace state; not built |
> | 37-41 | no host, no runner, no `messages_per_min` / `host_stop_seconds` / `host_output_kb` / `scan_entries`; not built |
> | 42 (vacuous pass) | `reads: [app-hosts]` is refused as `reads names app-hosts, which is no channel an app can read` (`channel_unknown`), not as a closed channel; `reads: [processes]` gives the closed wording, which is the form the case needs |

> ## 4. Other findings to carry into the build (no ruling needed)
>
> - Cases 24 and 42 pass on the unchanged tree for a reason other than the one they test. Their tests will assert the new route's answers (correct key, unapproved, disabled, dot-led path) and the closed-channel wording.
> - The `@napi-rs/keyring` 2.1.0 API in the brief matches its published `index.d.ts`. I unpacked the tarball in scratchpad and installed nothing. It has `Entry.setSecret(Uint8Array)`, `getSecret(): Array<number> | null`, `deleteCredential()`, `findCredentials(service)` returning `{ account, password }`, and `EntryOptions.linux.store: 'secret-service' | 'keyutils'`.
> - Item 1's reader needs two inputs it lacks today: the shown root keys, for `files` entries, and `closed_paths`. I will add both to `ManifestInput` from `ScanInput.roots` and the config. This is internal.

### Where each case is kept

| Case | First run on the unchanged tree | Kept as |
|---|---|---|
| 1 | host.mjs, host.ts, ../x.js, .h/x.js, missing.js | `manifest-host.test.ts`: host.mjs with the file present; the host host.ts; the host ../x.js; the host .h/x.js; a host file that is missing |
| 2 | files, five entries and a root app | `manifest-host.test.ts`: files naming a folder of a shown root; files naming engine; files naming hub/secrets; files naming hub/.git; files naming hub/a//b; files naming a root that is not shown; files on a root app |
| 3 | files my/repo/src | `manifest-host.test.ts`: a root key holding a slash, with files naming a folder under it |
| 4 | secrets true, yes | `manifest-host.test.ts`: secrets true; secrets yes; secrets 1 |
| 5 | activation with host, onBoot | `manifest-host.test.ts`: two events of a host; an event no host reads; an event with nothing after its colon; activation without a host; an event written twice; a host without activation is activated by a tab |
| 6 | depends base | `manifest-host.test.ts`: depends naming another app; depends naming an app that is not there; depends with an upper-case name; depends naming the app itself; a dependency written twice |
| 7 | no host manager exists | `host-manager.test.ts`: starts the host of an app only while it may run, once, as a program with an argument array > an approved, enabled app with a tab drawn |
| 8 | unrunnable | `host-manager.test.ts`: the same group, rows for an unapproved app, a disabled app, a kept app whose files differ, an app that names no host |
| 9 | unrunnable | `host-manager.test.ts`: stops the host when its app is disabled, revoked, changed or removed, the workspace changes, and at close (7 rows); `host-runner.test.ts`: answers a thrown error as refused with its message, and leaves no process after close |
| 10 | unrunnable | `host-manager.test.ts`: does not start again a host that ended by itself, and starts it once on Restart |
| 11 | unrunnable | `host-runner.test.ts`: keeps the messages working when the host logs at import and in activate, and keeps the lines |
| 12 | unrunnable | `host-runner.test.ts`: ends a host file that has no activate; ends a host file that throws in activate |
| 13 | page methods lack host | `host-manager.test.ts`: answers a request of a tab from the host, and a refusal as its word (3 rows); `methods.test.ts`: the host request rows; `app-manage.test.ts`: answers not_declared to a host request of an app with no host |
| 14 | unrunnable | `host-manager.test.ts`: sends what the host says to the page on app-messages (3 rows); `rules.test.ts` (3 rows) |
| 15 | store.update has no code | `host-manager.test.ts`: keeps the store of the app by key for its host (3 rows); `tests/server/edit/app-store.test.ts`: the 4 host update rows |
| 16 | unrunnable | `host-manager.test.ts`: rejects the 31st update of a minute with rate |
| 17 | unrunnable | `host-manager.test.ts`: starts the dependencies of a host first and lets it call their API (4 rows) |
| 18 | unrunnable | `host-manager.test.ts`: starts a host at the first of its events > starts for a file the glob matches in a shown root, and not for one only inside node_modules or .git |
| 19 | unrunnable | `host-manager.test.ts`: starts for a source tab of a file of the language, and for the first drawn tab |
| 20 | no fs methods | `app-fs.test.ts` (21 rows) and `methods.test.ts`: the 'an address for' rows (15 rows) |
| 21 | no fs methods | `app-fs.test.ts`: a root app reading its own root, and the root of another; `methods.test.ts`: an address for a root app reading its own root, and another root |
| 22 | no fs methods | `app-fs.test.ts`: a file of 300 MB, answered as a stream with its length and no buffer made of it |
| 23 | no fs methods | `app-fs.test.ts`: a listing of a folder, which leaves out a dot-led name and a folder closed_paths names |
| 24 | vacuous pass: 404 because the route does not exist | `app-fs.test.ts`: a wrong key; a dot-led root key; no root key; a read with no path; an app that is not approved; an app that is disabled, each the empty 404 |
| 25 | no commands method | `commands.test.ts` (7 rows); `methods.test.ts`: a command the page ran with the outcome ok, declined, missing, failed |
| 26 | no secrets method | `secrets.test.ts` (15 rows); `methods.test.ts`: a secret of an app that did not declare secrets; a store, a get and a delete of an app that declared them |
| 27 | no secrets method | `app-manage.test.ts`: answers the secrets of the app in the header alone, and none of another app |
| 28 | no secrets method | `secrets.test.ts`: rejects a store with the one line of the catalog when the keyring cannot be used |
| 29 | PDF opens as source | No test is kept. Checked by reading `src/lib/views/apps/frame/AppFrame.svelte:141-142` (`tabFor` is `tabForKind(typeOfFile(path).kind, root, path, undefined, apps.holds)`) and by the run `npx vitest run tests/views/shared/explorer/opening.client.test.ts tests/views/shared/explorer/opening-apps.test.ts`: `Tests  20 passed (20)` |
| 30 | keep refused for a root app, 400 keep | `approve.test.ts`: a machine app and a root app both kept on request; `manifest-host.test.ts`: stays approved when a file other than app.yml changes, and is asked again when app.yml changes |
| 31 | script-src without wasm-unsafe-eval | `app-files.test.ts`: the policy, which lets an app compile its own wasm in script-src alone |
| 32 | not built | `manage.test.ts` (disable, workspace, dependents rows); `host-manager.test.ts`: when the app is disabled; `app-fs.test.ts` and `app-files.test.ts`: an app that is disabled; `flows.test.ts`; `app-badges.test.ts` |
| 33 | not built | `manage.test.ts`: reads every app as disabled from a file that does not parse, names the file, refuses a change and leaves it; reads the apps as the file says once it is put right |
| 34 | not built | `manage.test.ts`: removes a machine app with its store and its secrets (5 rows); `app-manage.test.ts`: says what a removal does, then removes the folder; `flows.test.ts`: offers a root app, which has no Remove |
| 35 | not built | `manage.test.ts`: adds an app by copying a folder (6 rows); `app-manage.test.ts`: copies the folder as an unapproved app; `add-app.test.ts` (7 rows); `flows.test.ts`: the add rows |
| 36 | not built | `manage.test.ts`: disables in the current workspace only, and enables in a workspace what the machine disabled; `host-manager.test.ts`: when the workspace changes to one that disables it |
| 37 | not built | `host-runner.test.ts`: refuses every import of a file outside the recorded files of the app, whichever way it is asked (6 rows) |
| 38 | not built | `host-manager.test.ts`: drops the 601st call of a minute and rejects it with rate; drops the 11th call with apps.messages_per_min 10 and rejects it with rate |
| 39 | not built | `manage.test.ts`: disables the apps that depend on an app when the reader says yes, and stops their hosts (2 rows); `host-manager.test.ts`: stops notes when the approval of base is revoked, and its row says base stopped it; `flows.test.ts`: asks naming the apps that depend on it |
| 40 | not built | `manage.test.ts`: goes ahead when the keyring cannot be read, the question saying the secrets could not be counted; `flows.test.ts`: says the secrets could not be counted; tells the reader when the secrets of a removed app could not be deleted |
| 41 | not built | `host-manager.test.ts`: sends SIGTERM when deactivate does not settle in apps.host_stop_seconds, then SIGKILL 2 s later; keeps at most apps.host_output_kb of the last lines; reads at most apps.scan_entries entries of a root |
| 42 | vacuous pass: refused as channel_unknown | `manifest.test.ts`: a read of the app-hosts channel; a read of the app-messages channel; `host-manager.test.ts`: publishes a row for the running host that the Processes view draws |
| 43 | unknown keys refused | `manifest-host.test.ts`: files on a root app; activation without a host; `host-manager.test.ts`: leaves an app offered with its host waiting, the row naming a dependency that is not approved |

## DONE / NOT DONE

All commands run from `tools/oculus` in the worktree with node from `$HOME/.nvm/versions/node/v24.21.0/bin`.

### The verify list

| # | Check | Result |
|---|---|---|
| 1 | `npm run test:quick -- --base 398537672` after the last change | exit 0; every line below as printed |
| 2 | `LC_ALL=C grep -n '[^ -~]'` over the 132 files the step adds or changes (diagram SVGs included) | prints nothing; grep exit status 1 (no match). The ASCII gate line of test:quick is in row 1 |
| 3 | each slow test file alone with `npx vitest run <file>` | `host-runner.test.ts` `Tests  11 passed (11)`; `manifest.test.ts` `Tests  68 passed (68)`; `app-gate.test.ts` `Tests  20 passed (20)`; `eslint-switch.test.ts` `Tests  1 passed (1)` |
| 4 | `sh utils/unused-exports.sh` against the base's `unused-exports.txt` | the diff is below, each line with what was done |
| 5 | `wc -l` and `sh utils/folder-check.sh` | no source file over 880, no component over 520 (largest: `src/lib/server/root/context.ts` 878, `src/lib/data/sources/config/settings.ts` 872, `src/lib/server/machine/apps/host/manager.ts` 623); `folder-check.sh` exit 0; `src/lib/server/machine/apps/` holds 8 items |
| 6 | each new or changed test on the unchanged tree and after the change | the section "Failing line on the unchanged tree" and the counts below |
| 7 | each new or changed list item and sentence read against the standards pages' rules on list items and sentence length | not verified: no separate pass of that reading was made, and no departure is named; the one-line-per-paragraph rule of `agents/spec.md:54` was followed in writing and is not checked by a command |

The lines of test:quick (the last command, `npm run test:quick -- --base 398537672`):

```
test:quick: 143 changed file(s), from git since 398537672
test:quick: 137 test file(s), 10 essential
ok      prettier (0.5 s): All matched files use Prettier code style!
ok      ASCII gate (0.6 s)
ok      eslint (1.5 s)
ok      svelte-kit sync (2.1 s)
ok      svelte-check (5.4 s): 1791668720955 COMPLETED 464 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (30.3 s): Duration  25.68s (transform 27.13s, setup 0ms, import 49.10s, tests 45.53s, environment 242ms)
test:quick: 30.9 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
```

Counts of each new or changed test file, each run alone with `npx vitest run <file>` after the last change:

- `tests/data/sources/config/settings.test.ts`: `Tests  74 passed (74)`
- `tests/routes/apps/app-files.test.ts`: `Tests  27 passed (27)`
- `tests/routes/apps/app-fs.test.ts`: `Tests  21 passed (21)`
- `tests/routes/apps/app-manage.test.ts`: `Tests  14 passed (14)`
- `tests/routes/apps/app-open.test.ts`: `Tests  37 passed (37)`
- `tests/routes/apps/app-store.test.ts`: `Tests  8 passed (8)`
- `tests/routes/apps/approve.test.ts`: `Tests  10 passed (10)`
- `tests/routes/edit/app-gate.test.ts`: `Tests  20 passed (20)`
- `tests/server/edit/app-store.test.ts`: `Tests  15 passed (15)`
- `tests/server/machine/apps/host-manager.test.ts`: `Tests  32 passed (32)`
- `tests/server/machine/apps/host-runner.test.ts`: `Tests  11 passed (11)`
- `tests/server/machine/apps/manage.test.ts`: `Tests  16 passed (16)`
- `tests/server/machine/apps/manifest-host.test.ts`: `Tests  29 passed (29)`
- `tests/server/machine/apps/manifest.test.ts`: `Tests  68 passed (68)`
- `tests/server/machine/apps/secrets.test.ts`: `Tests  15 passed (15)`
- `tests/server/root/eslint-switch.test.ts`: `Tests  1 passed (1)`
- `tests/state/system/apps/commands.test.ts`: `Tests  7 passed (7)`
- `tests/state/system/apps/flows.test.ts`: `Tests  16 passed (16)`
- `tests/state/system/apps/methods.test.ts`: `Tests  75 passed (75)`
- `tests/state/system/apps/rules.test.ts`: `Tests  3 passed (3)`
- `tests/views/shared/explorer/add-app.test.ts`: `Tests  7 passed (7)`
- `tests/views/system/workbench/app-badges.test.ts`: `Tests  5 passed (5)`

`npm run test:checks`: `Test Files  2 failed | 15 passed (17)`, `Tests  3 failed | 268 passed (271)`; the three failures are the three named in the first line. `npx svelte-check --threshold error --output machine`: `COMPLETED 464 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` (the line in test:quick above).

`sh utils/unused-exports.sh` against the base, lines the step added or changed:

```
1c1
< Unused exports (246)
---
> Unused exports (247)
81c81,82
< src/lib/server/machine/apps/oculus.js: connect
---
> src/lib/server/machine/apps/read/state.ts: DEFAULT_KEY
> src/lib/server/machine/apps/serve/oculus.js: connect
238c239
< src/lib/views/shared/explorer/tree/menu/row-menu.ts: ROW_OPEN_SIDE, ROW_OPEN_PROGRAM, ROW_REVEAL, ROW_TERMINAL, ROW_FIND, ROW_DOWNLOAD, ROW_COPY_PATH, ROW_COPY_RELATIVE, ROW_ADD_ROOT, ROW_REMOVE_ROOT, ROW_PREVIEW, ROW_DECK, ROW_RUN, rowPaths, shellFolder
---
> src/lib/views/shared/explorer/tree/menu/row-menu.ts: ROW_OPEN_SIDE, ROW_OPEN_PROGRAM, ROW_REVEAL, ROW_TERMINAL, ROW_FIND, ROW_DOWNLOAD, ROW_COPY_PATH, ROW_COPY_RELATIVE, ROW_ADD_ROOT, ROW_REMOVE_ROOT, ROW_PREVIEW, ROW_DECK, ROW_ADD_APP, ROW_RUN, rowPaths, shellFolder
248c249
< Unused exported types (117)
---
> Unused exported types (118)
336a338
> src/lib/state/system/apps/flows.ts: AppAsk
```

- `src/lib/server/machine/apps/read/state.ts: DEFAULT_KEY`: the key the default workspace has in `apps.json`; `manifest-fixture.ts`, `manage.test.ts` and `apps-fixture.ts` import it to name the default workspace. Kept exported for those tests; the other lines moved with the file or are the same as the base's.
- `src/lib/views/shared/explorer/tree/menu/row-menu.ts: ROW_ADD_APP`: the same form as the `ROW_*` names beside it, imported by `add-app.test.ts`.
- `src/lib/state/system/apps/flows.ts: AppAsk`: the question type the flows hand to `ask`, imported by `flows.test.ts`.
- `src/lib/server/machine/apps/serve/oculus.js: connect` is the base's `oculus.js: connect` at its new path.

### The items of "What to build"

| # | Item | Evidence (commands above) |
|---|---|---|
| 1 | The manifest: `host`, `files`, `secrets`, `activation`, `depends`, and the `AppRow` fields | `manifest-host.test.ts` and `manifest.test.ts` pass; `src/lib/server/machine/apps/read/manifest.ts` |
| 2 | The approval panel texts | `ApprovalPanel.svelte` is checked by `svelte-check`, `eslint` and the keys check (`tests/checks/source/keys.test.ts` passes: every catalog key has a reader); no test draws the component, and the look is not taken (no browser may be started) |
| 3 | Keep approved for root apps | `approve.test.ts` 'a machine app and a root app both kept on request'; `manifest-host.test.ts` kept row |
| 4 | WebAssembly policy and `open({ file })` as the Files view opens it | `app-files.test.ts` wasm row; case 29 reading and run in the case table |
| 5 | The host: start, approved code only, runner, connection object, store, stop, end, output | `host-manager.test.ts`, `host-runner.test.ts` (slow, alone), `app-store.test.ts` |
| 6 | Activation events | `host-manager.test.ts` 'starts a host at the first of its events' (4 rows) |
| 7 | The protocol, the method table in DESIGN.md | `host-manager.test.ts`, `host-runner.test.ts`; DESIGN.md "Apps added while oculus runs" holds the tables, with `oculus/register` and the page-side table written for D63 and D64 and not built |
| 8 | Secrets through `@napi-rs/keyring` 2.1.0 | `secrets.test.ts`; `package.json:64` `"@napi-rs/keyring": "2.1.0"` |
| 9 | The frame's new methods and `onHost` | `methods.test.ts`, `app-fs.test.ts`, `commands.test.ts`, `rules.test.ts` |
| 10 | The Processes view group for app hosts | `host-manager.test.ts` 'publishes a row for the running host that the Processes view draws'; `AppHosts.svelte` and `Processes.svelte` by `svelte-check` and `eslint` only; the look is not taken |
| 11 | One app using another | `host-manager.test.ts` 'starts the dependencies of a host first and lets it call their API' (4 rows) |
| 12 | Managing apps: disable and enable, remove, add | `manage.test.ts`, `app-manage.test.ts`, `flows.test.ts`, `add-app.test.ts`, `app-badges.test.ts`; `Catalogue.svelte` and `AppFrame.svelte` by `svelte-check` and `eslint` only |
| 13 | The documents | `docs/apps.md`, `DESIGN.md`, `HELP.md`, `README.md`, `docs/diagrams/` written by `npm run diagrams` (`tests/checks` diagrams test passes) |
| 14 | Size and folders | `ls src/lib/server/machine/apps` prints `host manage reach read routes secrets serve store`; `grep -rnE "machine/apps/(held|scan|manifest|serve|routes|address|open|record|store|oculus)(\.ts|\.js|')"` over `src tests utils docs DESIGN.md HELP.md README.md config` prints nothing; `folder-check.sh` exit 0 |

NOT DONE: nothing of the 14 items. Not taken: a look at any view (the brief forbids starting the app, Electron or a browser), so every "before and after" below is from the code and the config, not from sight.

## Rows for `agents/guarded.md`

Each row lists the tests the step adds under the entry (file and title, as `npx vitest list` prints them). A row of a table test is a title.

**G1.** Each new route that writes, runs or opens something refuses a request without the page's token (app-manage, app-add, app-host, app-secrets).
- `tests/routes/apps/app-manage.test.ts` (4 new rows or titles)
  - refuses a request without the write token, before it reads or changes anything > app-manage answers 403 and leaves the record alone
  - refuses a request without the write token, before it reads or changes anything > app-add answers 403 and leaves the record alone
  - refuses a request without the write token, before it reads or changes anything > app-host answers 403 and leaves the record alone
  - refuses a request without the write token, before it reads or changes anything > app-secrets answers 403 and leaves the record alone

**G2.** A path outside the configured roots is refused: the fs read route and the page's own check before it.
- `tests/routes/apps/app-fs.test.ts` (21 new rows or titles)
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > a file inside a declared folder, with its bytes and the headers that keep it from being drawn
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > a file outside the declared folders, refused not_declared as plain text
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > an escaped dot segment that climbs out of the declared folder, refused not_declared as plain text
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > a path under a dot-led folder, refused closed as plain text
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > a dot-led file, refused closed as plain text
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > a path of a folder closed_paths names, refused closed as plain text
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > a link inside the folder to a file outside the root, refused closed as plain text
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > the engine root, refused closed as plain text
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > a file that is not there, refused missing as plain text
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > a root that is not shown, refused missing as plain text
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > a root app reading its own root, and the root of another
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > a listing of a folder, which leaves out a dot-led name and a folder closed_paths names
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > a listing of a folder over apps.scan_entries, which answers the names it read first
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > a stat of a file and of a folder, with the type, the times and the size
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > a file of 300 MB, answered as a stream with its length and no buffer made of it
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > a wrong key, with the empty 404
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > a dot-led root key, with the empty 404
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > no root key, with the empty 404
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > a read with no path, with the empty 404
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > an app that is not approved, with the empty 404
  - answers a read of a root only for an app that may read it, and an empty 404 otherwise > an app that is disabled, with the empty 404 even under its key
- `tests/state/system/apps/methods.test.ts` (15 new rows or titles)
  - refuses an open target or a write by the page's own checks before any request > an address for a read of a file inside a declared folder, answered the address
  - refuses an open target or a write by the page's own checks before any request > an address for a listing of a declared folder, answered the address
  - refuses an open target or a write by the page's own checks before any request > an address for a stat of a declared folder, answered the address
  - refuses an open target or a write by the page's own checks before any request > an address for a file outside the declared folders, answered not_declared
  - refuses an open target or a write by the page's own checks before any request > an address for a path that climbs out of the declared folder, answered closed
  - refuses an open target or a write by the page's own checks before any request > an address for a path under a dot-led folder, answered closed
  - refuses an open target or a write by the page's own checks before any request > an address for a path of a closed folder, answered closed
  - refuses an open target or a write by the page's own checks before any request > an address for the engine root, answered closed
  - refuses an open target or a write by the page's own checks before any request > an address for a root that is not shown, answered missing
  - refuses an open target or a write by the page's own checks before any request > an address for an operation that is none of the three, answered closed
  - refuses an open target or a write by the page's own checks before any request > an address for a path that is not text, answered closed
  - refuses an open target or a write by the page's own checks before any request > an address for a root app reading its own root, answered the address
  - refuses an open target or a write by the page's own checks before any request > an address for a root app reading another root, answered closed
  - refuses an open target or a write by the page's own checks before any request > an address for an app that is disabled, answered closed
  - refuses an open target or a write by the page's own checks before any request > an address for an app with no address key, answered closed

**G7.** A value that reaches a command is passed as an argument: the host is started with an argument array, in a folder whose name holds spaces and `$(x)`.
- `tests/server/machine/apps/host-manager.test.ts` (1 new rows or titles)
  - starts the host of an app only while it may run, once, as a program with an argument array > an approved, enabled app with a tab drawn: one process, an argument array, the app folder

**G9.** Each write is logged and its undo puts the file back: a host's store update is recorded in the change log as the app-store kind.
- `tests/server/edit/app-store.test.ts` (4 new rows or titles)
  - writes the store of an app as the app-store kind > a host update of one key, which keeps the other keys, and is recorded
  - writes the store of an app as the app-store kind > a host update of undefined, which deletes the key and keeps the rest
  - writes the store of an app as the app-store kind > a host update over a store file that holds 5, which leaves a map holding the one key
  - writes the store of an app as the app-store kind > a host update over the limit, answered too_large with the store as it was, and an empty key refused

**G10.** A file operation does what it names: Remove sends the app's folder and store file to the system trash and moves nothing when the trash refuses.
- `tests/server/machine/apps/manage.test.ts` (5 new rows or titles)
  - removes a machine app with its store and its secrets, after the reader says yes > counts the secrets for the question and changes nothing until yes
  - removes a machine app with its store and its secrets, after the reader says yes > moves the folder and the store file to the trash, deletes both secrets and revokes the approval
  - removes a machine app with its store and its secrets, after the reader says yes > goes ahead when the keyring cannot be read, the question saying the secrets could not be counted
  - removes a machine app with its store and its secrets, after the reader says yes > names the apps that depend on it and refuses until they are disabled with yes
  - removes a machine app with its store and its secrets, after the reader says yes > refuses a root app, and a file apps.json that does not read, changing nothing
- `tests/routes/apps/app-manage.test.ts` (2 new rows or titles)
  - disables, enables and removes a machine app through app-manage > says what a removal does, then removes the folder, the store and both secrets, and revokes the approval
  - disables, enables and removes a machine app through app-manage > removes nothing while the apps that depend on the app are enabled and the reader has not said yes

**G31.** A record file that does not read is never overwritten: `~/.oculus/apps.json`.
- `tests/server/machine/apps/manage.test.ts` (4 new rows or titles)
  - keeps the disabled apps in apps.json, machine-wide and per workspace > reads every app as disabled from a file that does not parse, names the file, refuses a change and leaves it
  - keeps the disabled apps in apps.json, machine-wide and per workspace > reads the apps as the file says once it is put right
  - keeps the disabled apps in apps.json, machine-wide and per workspace > disables in the current workspace only, and enables in a workspace what the machine disabled
  - removes a machine app with its store and its secrets, after the reader says yes > refuses a root app, and a file apps.json that does not read, changing nothing

**G49.** An app reaches only what its approval names: the manifest keys, the kept approval of a root app, the wasm policy, the frame's fs, commands, secrets and host methods, the disabled standing, and the host that starts only while the app may run.
- `tests/server/machine/apps/manifest-host.test.ts` (29 new rows or titles)
  - reads the keys of a host in a manifest > host.mjs with the file present
  - reads the keys of a host in a manifest > the host host.ts
  - reads the keys of a host in a manifest > the host ../x.js
  - reads the keys of a host in a manifest > the host .h/x.js
  - reads the keys of a host in a manifest > a host file that is missing
  - reads the keys of a host in a manifest > files naming a folder of a shown root
  - reads the keys of a host in a manifest > files naming engine
  - reads the keys of a host in a manifest > files naming hub/secrets
  - reads the keys of a host in a manifest > files naming hub/.git
  - reads the keys of a host in a manifest > files naming hub/a//b
  - reads the keys of a host in a manifest > files naming a root that is not shown
  - reads the keys of a host in a manifest > files on a root app
  - reads the keys of a host in a manifest > secrets true
  - reads the keys of a host in a manifest > secrets yes
  - reads the keys of a host in a manifest > secrets 1
  - reads the keys of a host in a manifest > two events of a host
  - reads the keys of a host in a manifest > an event no host reads
  - reads the keys of a host in a manifest > an event with nothing after its colon
  - reads the keys of a host in a manifest > activation without a host
  - reads the keys of a host in a manifest > an event written twice
  - reads the keys of a host in a manifest > depends naming another app
  - reads the keys of a host in a manifest > depends naming an app that is not there
  - reads the keys of a host in a manifest > depends with an upper-case name
  - reads the keys of a host in a manifest > depends naming the app itself
  - reads the keys of a host in a manifest > a dependency written twice
  - reads the keys of a host in a manifest > the row of a host app carries its host, folders, secrets, events and dependencies
  - reads the keys of a host in a manifest > a host without activation is activated by a tab
  - reads the keys of a host in a manifest > a root key holding a slash, with files naming a folder under it
  - keeps a root app approved while its files are edited > stays approved when a file other than app.yml changes, and is asked again when app.yml changes
- `tests/server/machine/apps/manifest.test.ts` (2 new rows or titles)
  - reads each apps folder to its rows and its findings > a read of the app-hosts channel
  - reads each apps folder to its rows and its findings > a read of the app-messages channel
- `tests/routes/apps/app-files.test.ts` (1 new rows or titles)
  - answers an app file only while every condition holds, and an empty 404 otherwise > the policy, which lets an app compile its own wasm in script-src alone
- `tests/routes/apps/approve.test.ts` (1 new rows or titles)
  - approves only the hash the reader was shown, and revokes by folder > a machine app and a root app both kept on request
- `tests/state/system/apps/methods.test.ts` (10 new rows or titles)
  - refuses an open target or a write by the page's own checks before any request > a command the page ran with the outcome ok, answered resolved
  - refuses an open target or a write by the page's own checks before any request > a command the page ran with the outcome declined, answered declined
  - refuses an open target or a write by the page's own checks before any request > a command the page ran with the outcome missing, answered missing
  - refuses an open target or a write by the page's own checks before any request > a command the page ran with the outcome failed, answered failed:0
  - refuses an open target or a write by the page's own checks before any request > a word the server refuses with, which the app is rejected with
  - refuses an open target or a write by the page's own checks before any request > a request that got no answer, rejected failed:0
  - refuses an open target or a write by the page's own checks before any request > a host request of an app with no host, answered not_declared before any request
  - refuses an open target or a write by the page's own checks before any request > a host request with params that are not JSON, refused before any request
  - refuses an open target or a write by the page's own checks before any request > a host request, sent with its method and params and answered with the value
  - refuses an open target or a write by the page's own checks before any request > a host that cannot start, rejected host_down
- `tests/state/system/apps/commands.test.ts` (7 new rows or titles)
  - runs the command of an app root and settles with how the press ended > a press that ends started settles ok
  - runs the command of an app root and settles with how the press ended > a press that ends dropped settles declined
  - runs the command of an app root and settles with how the press ended > a press that ends refused settles failed
  - runs the command of an app root and settles with how the press ended > presses the command of the hub for a machine app and of its own root for a root app
  - runs the command of an app root and settles with how the press ended > answers missing for a name the commands file does not hold and presses nothing
  - runs the command of an app root and settles with how the press ended > answers missing for a command saved through the form and presses nothing
  - runs the command of an app root and settles with how the press ended > answers missing for a root the file browser does not show and presses nothing
- `tests/state/system/apps/rules.test.ts` (3 new rows or titles)
  - sends a message from an app host to the frames of that app > reaches only the named tab when the message names one
  - sends a message from an app host to the frames of that app > reaches every open tab of the app, and none of another app, when it names none
  - sends a message from an app host to the frames of that app > reaches nothing when the named tab belongs to another app
- `tests/state/system/apps/flows.test.ts` (16 new rows or titles)
  - offers the choices an app allows and asks before a disable or a removal that reaches more > offers an enabled machine app: {"name":"notes","root":"","title":"Notes","description":"","glyph":"app_view","folder":"/apps/notes","entry":"index.html","reads":[],"writes":[],"connects":[],"host":"","readFolders":[],"secrets":false,"activation":["onTab"],"depends":[],"disabled":false,"machineDisabled":false,"workspaceState":"","files":1,"bytes":10,"hash":"a","approved":true,"hashApproved":true,"kept":false,"key":"k","storeBytes":0,"storeVersion":"","storeFile":""}
  - offers the choices an app allows and asks before a disable or a removal that reaches more > offers a machine app disabled machine-wide: {"name":"notes","root":"","title":"Notes","description":"","glyph":"app_view","folder":"/apps/notes","entry":"index.html","reads":[],"writes":[],"connects":[],"host":"","readFolders":[],"secrets":false,"activation":["onTab"],"depends":[],"disabled":true,"machineDisabled":true,"workspaceState":"","files":1,"bytes":10,"hash":"a","approved":true,"hashApproved":true,"kept":false,"key":"k","storeBytes":0,"storeVersion":"","storeFile":""}
  - offers the choices an app allows and asks before a disable or a removal that reaches more > offers a machine app disabled in this workspace only: {"name":"notes","root":"","title":"Notes","description":"","glyph":"app_view","folder":"/apps/notes","entry":"index.html","reads":[],"writes":[],"connects":[],"host":"","readFolders":[],"secrets":false,"activation":["onTab"],"depends":[],"disabled":true,"machineDisabled":false,"workspaceState":"disabled","files":1,"bytes":10,"hash":"a","approved":true,"hashApproved":true,"kept":false,"key":"k","storeBytes":0,"storeVersion":"","storeFile":""}
  - offers the choices an app allows and asks before a disable or a removal that reaches more > offers a root app, which has no Remove: {"name":"notes","root":"one","title":"Notes","description":"","glyph":"app_view","folder":"/apps/notes","entry":"index.html","reads":[],"writes":[],"connects":[],"host":"","readFolders":[],"secrets":false,"activation":["onTab"],"depends":[],"disabled":false,"machineDisabled":false,"workspaceState":"","files":1,"bytes":10,"hash":"a","approved":true,"hashApproved":true,"kept":false,"key":"k","storeBytes":0,"storeVersion":"","storeFile":""}
  - offers the choices an app allows and asks before a disable or a removal that reaches more > disables at once when nothing depends on the app and asks nothing
  - offers the choices an app allows and asks before a disable or a removal that reaches more > asks naming the apps that depend on it, and sends the request again with cascade on yes only
  - offers the choices an app allows and asks before a disable or a removal that reaches more > says how many secrets a removal deletes and what it moves to the Trash
  - offers the choices an app allows and asks before a disable or a removal that reaches more > says the secrets could not be counted when the keyring cannot be read, and still asks
  - offers the choices an app allows and asks before a disable or a removal that reaches more > removes with cascade when the question named dependents and the reader said yes, and sends nothing on no
  - offers the choices an app allows and asks before a disable or a removal that reaches more > tells the reader when the secrets of a removed app could not be deleted
  - adds an app from a folder the reader chose, and says why when it cannot > says the panel is not available, naming Add as App, and copies nothing
  - adds an app from a folder the reader chose, and says why when it cannot > sends the folder the panel returned to app-add and names the app that was added
  - adds an app from a folder the reader chose, and says why when it cannot > says the sentence of no_manifest when the server refuses the folder
  - adds an app from a folder the reader chose, and says why when it cannot > says the sentence of name when the server refuses the folder
  - adds an app from a folder the reader chose, and says why when it cannot > says the sentence of exists when the server refuses the folder
  - adds an app from a folder the reader chose, and says why when it cannot > says the sentence of too_large when the server refuses the folder
- `tests/views/shared/explorer/add-app.test.ts` (7 new rows or titles)
  - offers Add as App on a folder that holds an app.yml > a folder holding app.yml: the item is offered
  - offers Add as App on a folder that holds an app.yml > a root holding app.yml: the item is offered
  - offers Add as App on a folder that holds an app.yml > a folder holding no app.yml: the item is not offered
  - offers Add as App on a folder that holds an app.yml > a folder whose listing is not held: the item is not offered
  - offers Add as App on a folder that holds an app.yml > a file named app.yml: the item is not offered
  - offers Add as App on a folder that holds an app.yml > the up row: the item is not offered
  - offers Add as App on a folder that holds an app.yml > hands the absolute folder to the app store when the item is picked
- `tests/views/system/workbench/app-badges.test.ts` (5 new rows or titles)
  - marks an app by its standing > disabled
  - marks an app by its standing > disabled and not approved
  - marks an app by its standing > not approved
  - marks an app by its standing > kept approved
  - marks an app by its standing > approved
- `tests/server/machine/apps/host-manager.test.ts` (8 new rows or titles)
  - starts the host of an app only while it may run, once, as a program with an argument array > an approved, enabled app with a tab drawn: one process, an argument array, the app folder
  - starts the host of an app only while it may run, once, as a program with an argument array > an unapproved app, which no tab starts
  - starts the host of an app only while it may run, once, as a program with an argument array > a disabled app, which no tab starts
  - starts the host of an app only while it may run, once, as a program with an argument array > a kept app whose files differ from the approved hash, which waits for an approval
  - starts the host of an app only while it may run, once, as a program with an argument array > an app that names no host, which has nothing to start
  - answers a request of a tab from the host, and a refusal as its word > hands the handler the method, the params and that tab, and the frame its answer
  - answers a request of a tab from the host, and a refusal as its word > answers not_declared for an app with no host, and host_down for a host that cannot start
  - answers a request of a tab from the host, and a refusal as its word > answers host_down for a request in flight when the host is stopped

**G75.** An app's host runs only from its approved, enabled, unchanged files, and stops when they change, when the app is disabled, revoked or removed, and when the server ends.
- `tests/server/machine/apps/host-manager.test.ts` (32 new rows or titles)
  - starts the host of an app only while it may run, once, as a program with an argument array > an approved, enabled app with a tab drawn: one process, an argument array, the app folder
  - starts the host of an app only while it may run, once, as a program with an argument array > an unapproved app, which no tab starts
  - starts the host of an app only while it may run, once, as a program with an argument array > a disabled app, which no tab starts
  - starts the host of an app only while it may run, once, as a program with an argument array > a kept app whose files differ from the approved hash, which waits for an approval
  - starts the host of an app only while it may run, once, as a program with an argument array > an app that names no host, which has nothing to start
  - stops the host when its app is disabled, revoked, changed or removed, the workspace changes, and at close > when the app is disabled: deactivate is called once, then the process ends
  - stops the host when its app is disabled, revoked, changed or removed, the workspace changes, and at close > when the workspace changes to one that disables it: deactivate is called once, then the process ends
  - stops the host when its app is disabled, revoked, changed or removed, the workspace changes, and at close > when the approval is revoked: deactivate is called once, then the process ends
  - stops the host when its app is disabled, revoked, changed or removed, the workspace changes, and at close > when its files change: deactivate is called once, then the process ends
  - stops the host when its app is disabled, revoked, changed or removed, the workspace changes, and at close > when the app is removed: deactivate is called once, then the process ends
  - stops the host when its app is disabled, revoked, changed or removed, the workspace changes, and at close > ends every host at close, dependents first
  - stops the host when its app is disabled, revoked, changed or removed, the workspace changes, and at close > sends SIGTERM when deactivate does not settle in apps.host_stop_seconds, then SIGKILL 2 s later
  - does not start again a host that ended by itself, and starts it once on Restart > shows the exit code in the row and its output, offers Restart and starts one process
  - answers a request of a tab from the host, and a refusal as its word > hands the handler the method, the params and that tab, and the frame its answer
  - answers a request of a tab from the host, and a refusal as its word > answers not_declared for an app with no host, and host_down for a host that cannot start
  - answers a request of a tab from the host, and a refusal as its word > answers host_down for a request in flight when the host is stopped
  - sends what the host says to the page on app-messages, to one tab or to every tab of the app > carries the tab when one is named and an empty tab otherwise
  - sends what the host says to the page on app-messages, to one tab or to every tab of the app > drops the 601st call of a minute and rejects it with rate
  - sends what the host says to the page on app-messages, to one tab or to every tab of the app > drops the 11th call with apps.messages_per_min 10 and rejects it with rate
  - keeps the store of the app by key for its host, and tells it what a frame changed > reads back an update, lists keys, deletes with undefined and counts 30 updates a minute
  - keeps the store of the app by key for its host, and tells it what a frame changed > rejects the 31st update of a minute with rate
  - keeps the store of the app by key for its host, and tells it what a frame changed > calls the host's onDidChange with the keys a frame changed, and not for its own update
  - starts the dependencies of a host first and lets it call their API > starts base before notes, lists base API and reaches its function with JSON arguments
  - starts the dependencies of a host first and lets it call their API > starts neither host of two that depend on each other, and both rows say why
  - starts the dependencies of a host first and lets it call their API > leaves an app offered with its host waiting, the row naming a dependency that is not approved
  - starts the dependencies of a host first and lets it call their API > stops notes when the approval of base is revoked, and its row says base stopped it
  - starts a host at the first of its events > starts for a file the glob matches in a shown root, and not for one only inside node_modules or .git
  - starts a host at the first of its events > reads at most apps.scan_entries entries of a root, so a match past them starts nothing
  - starts a host at the first of its events > starts for a source tab of a file of the language, and for the first drawn tab
  - starts a host at the first of its events > starts at once for onStartupFinished once the apps are read
  - keeps the output of a host and publishes the rows on app-hosts > keeps at most apps.host_output_kb of the last lines
  - keeps the output of a host and publishes the rows on app-hosts > publishes a row for the running host that the Processes view draws
- `tests/server/machine/apps/host-runner.test.ts` (11 new rows or titles)
  - refuses every import of a file outside the recorded files of the app, whichever way it is asked > a static import of a file outside the folder ends the host with the refused file in its output
  - refuses every import of a file outside the recorded files of the app, whichever way it is asked > a dynamic import() of a file outside the folder ends the host with the refused file in its output
  - refuses every import of a file outside the recorded files of the app, whichever way it is asked > a require of a file outside the folder made through createRequire ends the host with the refused file in its output
  - refuses every import of a file outside the recorded files of the app, whichever way it is asked > a package of a node_modules above the folder ends the host with the refused file in its output
  - refuses every import of a file outside the recorded files of the app, whichever way it is asked > refuses a link of the folder to a file outside it and a dot-led file of the folder
  - refuses every import of a file outside the recorded files of the app, whichever way it is asked > loads a node built-in, a file of its own folder and a package inside its own folder
  - runs a host file under the runner and ends it with the manager > keeps the messages working when the host logs at import and in activate, and keeps the lines
  - runs a host file under the runner and ends it with the manager > ends a host file that has no activate, with the error in its output
  - runs a host file under the runner and ends it with the manager > ends a host file that throws in activate, with the error in its output
  - runs a host file under the runner and ends it with the manager > answers a thrown error as refused with its message, and leaves no process after close
  - runs a host file under the runner and ends it with the manager > calls deactivate of the host file before the process ends
- `tests/server/machine/apps/manage.test.ts` (2 new rows or titles)
  - disables the apps that depend on an app when the reader says yes, and stops their hosts > refuses to disable base while a depends on it, naming a, and changes nothing
  - disables the apps that depend on an app when the reader says yes, and stops their hosts > disables both on yes, a first, and ends both hosts
- `tests/routes/apps/app-manage.test.ts` (1 new rows or titles)
  - answers a frame's call to its host and its secrets under its own app header > stops and restarts a host by the view in the body and answers a view it does not hold with 404

**G76.** A secret's value never leaves the keyring: no log, change record, channel, file or report holds it.
- `tests/server/machine/apps/secrets.test.ts` (15 new rows or titles)
  - answers a secret only to an app that declared secrets, from its own entries > refuses every call of an app that did not declare secrets with not_declared and reads no keyring
  - answers a secret only to an app that declared secrets, from its own entries > keeps an entry under the service oculus-app:<view id> and the account of its key
  - answers a secret only to an app that declared secrets, from its own entries > lists and clears one app's entries without reaching another app's service
  - takes a key of 1 to 64 letters, digits, dots, underscores and hyphens and a value of 2048 bytes at most > refuses a key holding a space with a b
  - takes a key of 1 to 64 letters, digits, dots, underscores and hyphens and a value of 2048 bytes at most > refuses a key of 65 characters with kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk
  - takes a key of 1 to 64 letters, digits, dots, underscores and hyphens and a value of 2048 bytes at most > refuses an empty key with 
  - takes a key of 1 to 64 letters, digits, dots, underscores and hyphens and a value of 2048 bytes at most > refuses a key that is not text with 5
  - takes a key of 1 to 64 letters, digits, dots, underscores and hyphens and a value of 2048 bytes at most > refuses a value that is not text with k
  - takes a key of 1 to 64 letters, digits, dots, underscores and hyphens and a value of 2048 bytes at most > refuses a value of 2049 bytes with k
  - takes a key of 1 to 64 letters, digits, dots, underscores and hyphens and a value of 2048 bytes at most > refuses a value of 1025 two-byte letters with k
  - takes a key of 1 to 64 letters, digits, dots, underscores and hyphens and a value of 2048 bytes at most > stores a key of 64 characters and reads it back whole
  - takes a key of 1 to 64 letters, digits, dots, underscores and hyphens and a value of 2048 bytes at most > stores 2048 bytes of ASCII and reads it back whole
  - takes a key of 1 to 64 letters, digits, dots, underscores and hyphens and a value of 2048 bytes at most > stores 1024 two-byte letters, which are 2048 bytes and reads it back whole
  - says the keyring is not available without the value, and writes the value nowhere else > rejects a store with the one line of the catalog when the keyring cannot be used
  - says the keyring is not available without the value, and writes the value nowhere else > leaves the value out of every channel, every record and every file a host and a store touch
- `tests/state/system/apps/methods.test.ts` (2 new rows or titles)
  - refuses an open target or a write by the page's own checks before any request > a secret of an app that did not declare secrets, answered not_declared before any request
  - refuses an open target or a write by the page's own checks before any request > a store, a get and a delete of an app that declared them, each sent to the server with its key
- `tests/routes/apps/app-manage.test.ts` (2 new rows or titles)
  - refuses a request without the write token, before it reads or changes anything > app-secrets answers 403 and leaves the record alone
  - answers a frame's call to its host and its secrets under its own app header > answers the secrets of the app in the header alone, and none of another app

## Files with line counts

Counted with `wc -l` after the last change. The diagram files under `docs/diagrams/` (6 `.dot` and 6 `.svg`) are written by `npm run diagrams`.


**Added**

- 31 `src/lib/data/helpers/run/limiter.ts`
- 68 `src/lib/server/edit/writes/apps/host-store.ts`
- 124 `src/lib/server/machine/apps/host/connection.ts`
- 133 `src/lib/server/machine/apps/host/handlers.ts`
- 213 `src/lib/server/machine/apps/host/host-runner.mjs`
- 623 `src/lib/server/machine/apps/host/manager.ts`
- 62 `src/lib/server/machine/apps/host/output.ts`
- 69 `src/lib/server/machine/apps/host/plan.ts`
- 195 `src/lib/server/machine/apps/host/process.ts`
- 88 `src/lib/server/machine/apps/host/triggers.ts`
- 29 `src/lib/server/machine/apps/host/verify.ts`
- 90 `src/lib/server/machine/apps/manage/add.ts`
- 80 `src/lib/server/machine/apps/manage/enable.ts`
- 118 `src/lib/server/machine/apps/manage/remove.ts`
- 240 `src/lib/server/machine/apps/reach/fs.ts`
- 154 `src/lib/server/machine/apps/reach/open.ts`
- 53 `src/lib/server/machine/apps/read/activation.ts`
- 59 `src/lib/server/machine/apps/read/held.ts`
- 523 `src/lib/server/machine/apps/read/manifest.ts`
- 95 `src/lib/server/machine/apps/read/record.ts`
- 276 `src/lib/server/machine/apps/read/scan.ts`
- 150 `src/lib/server/machine/apps/read/state.ts`
- 98 `src/lib/server/machine/apps/routes/host.ts`
- 119 `src/lib/server/machine/apps/routes/manage.ts`
- 219 `src/lib/server/machine/apps/routes/routes.ts`
- 165 `src/lib/server/machine/apps/secrets/secrets.ts`
- 114 `src/lib/server/machine/apps/serve/address.ts`
- 239 `src/lib/server/machine/apps/serve/oculus.js`
- 186 `src/lib/server/machine/apps/serve/serve.ts`
- 106 `src/lib/server/machine/apps/store/store.ts`
- 122 `src/lib/server/root/process/apps-hosts.ts`
- 54 `src/lib/state/system/apps/commands.ts`
- 179 `src/lib/state/system/apps/flows.ts`
- 98 `src/lib/state/system/apps/manage.ts`
- 153 `src/lib/views/system/machine/processes/AppHosts.svelte`
- 14 `src/routes/api/(apps)/app-add/+server.ts`
- 14 `src/routes/api/(apps)/app-host/+server.ts`
- 14 `src/routes/api/(apps)/app-manage/+server.ts`
- 14 `src/routes/api/(apps)/app-secrets/+server.ts`
- 314 `tests/routes/apps/app-fs.test.ts`
- 312 `tests/routes/apps/app-manage.test.ts`
- 560 `tests/server/machine/apps/host-manager.test.ts`
- 186 `tests/server/machine/apps/host-runner.test.ts`
- 71 `tests/server/machine/apps/hosts-fixture.ts`
- 370 `tests/server/machine/apps/hosts-world.ts`
- 390 `tests/server/machine/apps/manage.test.ts`
- 113 `tests/server/machine/apps/manifest-fixture.ts`
- 237 `tests/server/machine/apps/manifest-host.test.ts`
- 141 `tests/server/machine/apps/secrets.test.ts`
- 85 `tests/state/system/apps/commands.test.ts`
- 214 `tests/state/system/apps/flows.test.ts`
- 30 `tests/state/system/apps/rules.test.ts`
- 95 `tests/views/shared/explorer/add-app.test.ts`
- 41 `tests/views/system/workbench/app-badges.test.ts`

**Changed**

- 323 `config/behavior.yml`
- 276 `config/catalogs/glyphs.yml`
- 275 `config/catalogs/icons.yml`
- 1507 `config/catalogs/options.yml`
- 286 `config/text/findings.yml`
- 331 `config/text/server.yml`
- 119 `config/text/views/apps/apps.yml`
- 291 `config/text/views/sources/files.yml`
- 52 `config/text/views/system/machine/processes.yml`
- 643 `DESIGN.md`
- 433 `docs/apps.md`
- 465 `HELP.md`
- 9548 `package-lock.json`
- 127 `package.json`
- 48 `README.md`
- 259 `src/lib/data/helpers/files/apps.ts`
- 711 `src/lib/data/model/index.ts`
- 857 `src/lib/data/model/model-machine.ts`
- 872 `src/lib/data/sources/config/settings.ts`
- 174 `src/lib/server/core/json.ts`
- 765 `src/lib/server/edit/writes.ts`
- 126 `src/lib/server/edit/writes/apps/gate.ts`
- 113 `src/lib/server/edit/writes/apps/store.ts`
- 192 `src/lib/server/edit/writes/hubs.ts`
- 540 `src/lib/server/edit/writes/undo.ts`
- 343 `src/lib/server/machine/approvals/approvals.ts`
- 878 `src/lib/server/root/context.ts`
- 162 `src/lib/server/root/process/server-context.ts`
- 459 `src/lib/server/root/watch/apps.ts`
- 33 `src/lib/server/root/watch/own-schemas.ts`
- 742 `src/lib/state/client/context.ts`
- 116 `src/lib/state/client/entities.svelte.ts`
- 214 `src/lib/state/client/shapes/payloads.ts`
- 740 `src/lib/state/client/writes.svelte.ts`
- 396 `src/lib/state/shared/stores/shapes.ts`
- 550 `src/lib/state/system/apps/apps.svelte.ts`
- 133 `src/lib/state/system/apps/bridge.ts`
- 438 `src/lib/state/system/apps/methods.ts`
- 151 `src/lib/state/system/apps/rules.ts`
- 318 `src/lib/views/apps/frame/AppFrame.svelte`
- 184 `src/lib/views/apps/frame/ApprovalPanel.svelte`
- 256 `src/lib/views/shared/explorer/tree/control/picks.svelte.ts`
- 632 `src/lib/views/shared/explorer/tree/menu/row-menu.ts`
- 124 `src/lib/views/system/machine/processes/Processes.svelte`
- 384 `src/lib/views/system/workbench/Catalogue.svelte`
- 55 `src/routes/+page.server.ts`
- 13 `src/routes/api/(apps)/app-open/+server.ts`
- 13 `src/routes/api/(apps)/app-store/+server.ts`
- 14 `src/routes/api/(apps)/approve/+server.ts`
- 41 `src/routes/apps/[...path]/+server.ts`
- 147 `src/routes/views.ts`
- 577 `tests/checks/source/keys.test.ts`
- 775 `tests/checks/tree/boundaries.test.ts`
- 778 `tests/data/sources/config/settings.test.ts`
- 105 `tests/fixtures/entities-fixture.ts`
- 351 `tests/routes/apps/app-files.test.ts`
- 205 `tests/routes/apps/app-open.test.ts`
- 88 `tests/routes/apps/app-store.test.ts`
- 239 `tests/routes/apps/approve.test.ts`
- 167 `tests/routes/apps/apps-fixture.ts`
- 261 `tests/routes/edit/app-gate.test.ts`
- 304 `tests/server/edit/app-store.test.ts`
- 658 `tests/server/machine/apps/manifest.test.ts`
- 201 `tests/server/root/context-fixture.ts`
- 155 `tests/server/root/eslint-switch.test.ts`
- 737 `tests/state/system/apps/methods.test.ts`

**Moved (the base path no longer exists; the new path is in "Added")**

- `src/lib/server/machine/apps/address.ts`
- `src/lib/server/machine/apps/held.ts`
- `src/lib/server/machine/apps/manifest.ts`
- `src/lib/server/machine/apps/oculus.js`
- `src/lib/server/machine/apps/open.ts`
- `src/lib/server/machine/apps/record.ts`
- `src/lib/server/machine/apps/routes.ts`
- `src/lib/server/machine/apps/scan.ts`
- `src/lib/server/machine/apps/serve.ts`
- `src/lib/server/machine/apps/store.ts`
- `src/lib/state/system/apps/limits.ts`

Files the step changed that the brief's "Paths this step writes" does not name, each because the change could not be made without it: `src/lib/server/core/json.ts` (`writePrivateJson`, the one private write that `approvals.ts` and `read/state.ts` share, so no write is held twice), `src/lib/data/sources/config/settings.ts` (the four new `apps.*` keys), `src/lib/state/shared/stores/shapes.ts` and `src/lib/state/client/writes.svelte.ts` (the `app-hosts` payload and the headers of `postCommand`), `src/lib/server/root/process/server-context.ts` and `src/lib/server/root/process/apps-hosts.ts` (the hosts and the secrets on the context), `config/text/server.yml`, `config/catalogs/glyphs.yml` and `config/catalogs/icons.yml` (the host's sentences, the disabled glyph), `README.md`, `tests/fixtures/entities-fixture.ts`, `tests/data/sources/config/settings.test.ts`, `tests/server/root/eslint-switch.test.ts`, `tests/checks/tree/boundaries.test.ts` and `tests/checks/source/keys.test.ts`.

## Judgment calls

1. **The frame's nested names.** The page answers flat methods (`fsAddress`, `commandsRun`, `secretsGet`, `secretsStore`, `secretsDelete`, `hostRequest`); `serve/oculus.js` nests them as `oculus.fs.readFile`, `readDirectory`, `stat`, `oculus.commands.run`, `oculus.secrets.get`, `store`, `delete` and `oculus.host.request`. `fs` is a fetch of the address `fsAddress` answers, so the bytes never pass through Penpal. Penpal 8.0.1 carries flat names, which is why the client nests them.
2. **`hostTargets`** in `src/lib/state/system/apps/rules.ts` picks the frames a host message reaches (the named tab, or every tab of the app), so `rules.test.ts` tests the rule without a store.
3. **`commands.ts`** (moved from `state/client/app-commands.ts` to `state/system/apps/commands.ts`) takes its dependencies as a structural type, because `state/system` may not import `state/client`; `client/context.ts` imports it.
4. **`src/lib/server/root/process/apps-hosts.ts`** holds the composition of the hosts, so `context.ts` stays at 878 lines and `src/lib/server/root/` stays at 10 items or fewer (`folder-check.sh` exit 0).
5. **`tests/server/root/eslint-switch.test.ts`** is changed (an `inertApps` stand-in that lets the hosts register their listeners), a path the brief does not list. The context now starts the hosts, and the test builds a context.
6. **The row `data/helpers/run/limiter` in the state row of `tests/checks/tree/boundaries.test.ts`.** The limiter (sliding window per frame or host) moved from `state/system/apps/limits.ts` to `data/helpers/run/limiter.ts` because the server's host manager counts the same limits and `server` may import `data/**` and not `state/**`; two copies would be a rule written twice (`duplication.test.ts`). `state` may import `data/helpers/run/limiter` only through that row, which is the row's own mechanism for a pure helper both sides use (the comment above the rows names each such helper and why). Without the row, `state` and `server` would each hold a copy of the limiter, which `duplication.test.ts` refuses. This widens a check's allow list, in a file outside the brief's path list, and is for the orchestrator to read.
7. **No process-wide registry of hosts.** The context's `close()` calls `hosts.stop()` (`src/lib/server/root/context.ts`), which `wireServer` runs on the server's `close` event, so a restart of the dev server stops its hosts the same way as the built server; `DESIGN.md` says so. A second context started in the same process while the first is still open (not something the entries do) would run a second set of hosts: not tested.
8. **The `app_disabled` glyph** has the stand-in `[-]` (the stand-in rule allows one to three printable ASCII characters), the icon `ban`, and is named by the constant `DISABLED_GLYPH` in `src/routes/views.ts` so the glyph check finds its reader.
9. **`manifest.test.ts` is split** into `manifest.test.ts` (66 rows plus the two closed-channel rows, slow), `manifest-host.test.ts` (the host keys and the kept root app) and `manifest-fixture.ts` (the shared reader helpers), because the one file reached 895 lines against the 880 of the standing spec.
10. **`Verdict` in `host/plan.ts`** is a union of four members (no host, disabled, approval, cycle) so the manager's branches are exhaustive.
11. **`writePrivateJson`** in `src/lib/server/core/json.ts` is the one write of a 0600 JSON file in a 0700 folder with a read-back; `approvals.ts` and `read/state.ts` both call it.

## Visible changes, before and after

For the look on landing (not taken here; each is from the code and the config).

1. **Views catalogue (the Workbench Views list), Apps group.** Before: one row per app, with a lock (not approved) or an edit mark (kept approved). After: a disabled app has the glyph `app_disabled` (`[-]` in a terminal) and the words 'This app is disabled'; the right-click menu of an app lists its two existing open items, then Disable, Disable (Workspace), Enable, Enable (Workspace) as the app's standing allows, and Remove for a machine app; the group ends with 'Add app from folder', drawn when the group holds no app too; the disabled app's words are 'This app is disabled'. State to put it in: one enabled machine app, one disabled in this workspace, one root app.
2. **An app's tab.** Before: the frame, the approval panel while not approved. After: a disabled app draws 'This app is disabled, so it reads, writes and runs nothing.' with an Enable button instead of its frame; an app whose host ended draws a line above the frame, 'The program of this app ended with exit code 0.' or 'The program of this app was ended by the signal 0.', with Restart; a host that waits shows 'The program of this app waits for you to approve its changed files.' with Approve, or the sentence that names the app it waits for. State: an app with `host`, killed from the Processes view.
3. **Approval panel.** Before: channels read and written, origins, Approve and Keep approved (machine apps only). After: for an app with `host`, 'Run a program on this machine, with your rights, which can read and write your files and reach any address. The program is the file 0.'; for `files`, 'Read the files in 0.'; for `secrets`, 'Store secrets in the keyring of this machine.'; for `depends`, 'Need the apps 0, whose programs start first.'; Keep approved is offered to root apps too; Disable, Enable and Remove (machine app) beside Approve.
4. **Processes view.** Before: the process table. After: a group 'App programs' with a row per host: app title (root key for a root app), pid, start time, state, Stop behind the question 'Stop the program of 0? It is asked to finish, then ended.', Restart for an ended host, and the host's output. State: a running host.
5. **Files view.** Before: a folder's right-click menu without app items. After: 'Add as App' on a folder or root of a shown root whose listing holds an `app.yml` (not on a file, not on the up row, not on a folder without it).
6. **`open({ file })` from an app.** Before: every file opened as source text. After: the tab of the file's kind as the Files view chooses it (a PDF in the file view), a file of an apps folder still as source.
7. **Settings, App limits.** New keys in `config/behavior.yml` `apps:` with their option entries: `messages_per_min` 600, `host_output_kb` 256, `host_stop_seconds` 5, `scan_entries` 10000.
8. **Errors and words.** The host's own sentences (activation failed, refused import, stream broken, the keyring not available) are in `config/text/server.yml`; the app words are in `config/text/views/apps/apps.yml`.

## Anything wrong in the brief

1. **Item 5, `module.register`.** It does not see a `require` made through `createRequire`; ruled to `module.registerHooks` (the cases ruling).
2. **Decision 10 against item 5.** The two texts contradict each other; ruled to follow item 5 and drop decision 10.
3. **Cases 24 and 42 pass on the unchanged tree** for another reason than the one they test (an empty 404 because the route does not exist; `app-hosts` refused as `channel_unknown`). Their tests now assert the route's answers and the closed-channel wording.
4. **The path list omits files the step has to change** (listed under "Files with line counts"), among them two checks (`boundaries.test.ts`, `keys.test.ts`).
5. **Verify item 1 gives `npm run test:quick` a limit of 45.0 s.** One run printed `test:quick: over the time limit` at 51.8 s (exit 0, every command passed) while the machine was loaded; the next run took 30.9 s.
6. **Verify item 6 cannot run a moved module's tests on the unchanged tree** when the test imports the module at its new path; those fail on import there. The base's own copy of each such test passes on the base tree (below).

## Edits to existing assertions

- `tests/routes/apps/approve.test.ts`, row 'a machine app and a root app both kept on request' (before 'a machine app kept on request, and a root app refused the keep'): before, the root app was refused `[400, { error: 'keep' }, false]`; now `rootKept: [200, ['app:one/notes'], true]`, because item 3 lets a root app be kept.
- `tests/data/sources/config/settings.test.ts`: the expected `apps` settings gain `messagesPerMin`, `hostOutputKb`, `hostStopSeconds` and `scanEntries`, and the pushed keys gain `apps.messages_per_min`, `apps.host_output_kb`, `apps.host_stop_seconds` and `apps.scan_entries` (before 9 fields and 9 keys of the block, now 13 fields).
- `tests/server/root/eslint-switch.test.ts`: `watchApps: () => inert()` is now `() => inertApps()` (see judgment call 5).
- `tests/state/system/apps/methods.test.ts`: the context stand-in gains `runCommand`, `secrets`, `host` and `rootKeys`; no existing assertion changed.
- `tests/routes/apps/app-files.test.ts`, `app-open.test.ts`, `app-store.test.ts`, `tests/routes/edit/app-gate.test.ts`, `tests/server/edit/app-store.test.ts`: import paths and head comments only, plus the new rows named under G49 and G9.
- `tests/server/machine/apps/manifest.test.ts`: the helpers moved to `manifest-fixture.ts`; the existing rows are unchanged.
- `tests/checks/tree/boundaries.test.ts` gains the row `data/helpers/run/limiter` in the state row and its sentence; `tests/checks/source/keys.test.ts` registers a disabled app so `apps.disabled_mark` has a reader.

## Failing line on the unchanged tree

Each new or changed test file was copied to a copy of the base tree (`D62-base`, with `node_modules` linked, `config/local.yml` not copied) and run alone with `npx vitest run <file>`; the first failing line of each is below, as printed, except that vitest's arrow and ellipsis characters are written in ASCII (`>` and `...`) because the report is an ASCII file.

```
=== tests/routes/apps/app-fs.test.ts
Test Files  1 failed (1)
Tests  no tests
FAIL  |unit| tests/routes/apps/app-fs.test.ts [ tests/routes/apps/app-fs.test.ts ]
Error: Cannot find module '../../../src/lib/server/machine/apps/read/held.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tests/routes/apps/app-fs.test.ts
> tests/routes/apps/app-fs.test.ts:13:1
=== tests/routes/apps/app-manage.test.ts
Test Files  1 failed (1)
Tests  no tests
FAIL  |unit| tests/routes/apps/app-manage.test.ts [ tests/routes/apps/app-manage.test.ts ]
Error: Cannot find module '../../../src/lib/server/machine/apps/routes/host.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tests/routes/apps/app-manage.test.ts
> tests/routes/apps/app-manage.test.ts:17:1
=== tests/server/machine/apps/host-manager.test.ts
Test Files  1 failed (1)
Tests  no tests
FAIL  |unit| tests/server/machine/apps/host-manager.test.ts [ tests/server/machine/apps/host-manager.test.ts ]
Error: Cannot find module '../../../src/lib/server/machine/apps/read/scan.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tests/routes/apps/apps-fixture.ts
> tests/routes/apps/apps-fixture.ts:12:1
=== tests/server/machine/apps/host-runner.test.ts
Test Files  1 failed (1)
Tests  no tests
FAIL  |unit| tests/server/machine/apps/host-runner.test.ts [ tests/server/machine/apps/host-runner.test.ts ]
Error: Cannot find module '../../../src/lib/server/machine/apps/read/scan.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tests/routes/apps/apps-fixture.ts
> tests/routes/apps/apps-fixture.ts:12:1
=== tests/server/machine/apps/manage.test.ts
Test Files  1 failed (1)
Tests  no tests
FAIL  |unit| tests/server/machine/apps/manage.test.ts [ tests/server/machine/apps/manage.test.ts ]
Error: Cannot find module '../../../../src/lib/server/machine/apps/manage/add.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tests/server/machine/apps/manage.test.ts
> tests/server/machine/apps/manage.test.ts:27:1
=== tests/server/machine/apps/secrets.test.ts
Test Files  1 failed (1)
Tests  no tests
FAIL  |unit| tests/server/machine/apps/secrets.test.ts [ tests/server/machine/apps/secrets.test.ts ]
Error: Cannot find module '../../../../src/lib/server/machine/apps/read/held.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tests/server/machine/apps/secrets.test.ts
> tests/server/machine/apps/secrets.test.ts:12:1
=== tests/state/system/apps/commands.test.ts
Test Files  1 failed (1)
Tests  no tests
FAIL  |unit| tests/state/system/apps/commands.test.ts [ tests/state/system/apps/commands.test.ts ]
Error: Cannot find module '../../../../src/lib/state/system/apps/commands.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tests/state/system/apps/commands.test.ts
> tests/state/system/apps/commands.test.ts:10:1
=== tests/state/system/apps/flows.test.ts
Test Files  1 failed (1)
Tests  no tests
FAIL  |unit| tests/state/system/apps/flows.test.ts [ tests/state/system/apps/flows.test.ts ]
Error: Cannot find module '../../../../src/lib/state/system/apps/flows.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tests/state/system/apps/flows.test.ts
> tests/state/system/apps/flows.test.ts:13:1
=== tests/state/system/apps/rules.test.ts
Test Files  1 failed (1)
Tests  3 failed (3)
FAIL  |unit| tests/state/system/apps/rules.test.ts > sends a message from an app host to the frames of that app > reaches only the named tab when the message names one
FAIL  |unit| tests/state/system/apps/rules.test.ts > sends a message from an app host to the frames of that app > reaches every open tab of the app, and none of another app, when it names none
TypeError: hostTargets is not a function
> tests/state/system/apps/rules.test.ts:20:16
=== tests/views/shared/explorer/add-app.test.ts
Test Files  1 failed (1)
Tests  3 failed | 4 passed (7)
FAIL  |unit| tests/views/shared/explorer/add-app.test.ts > offers Add as App on a folder that holds an app.yml > a folder holding app.yml: the item is offered { root: 'hub', path: 'tools/board', name: 'board', kind: 'dir', size: +0, depth: 1, open: false }
FAIL  |unit| tests/views/shared/explorer/add-app.test.ts > offers Add as App on a folder that holds an app.yml > a root holding app.yml: the item is offered { root: 'hub', path: '', name: 'board', kind: 'dir', size: +0, depth: +0, open: false }
AssertionError: expected false to be true // Object.is equality
> tests/views/shared/explorer/add-app.test.ts:66:63
=== tests/views/system/workbench/app-badges.test.ts
Test Files  1 failed (1)
Tests  2 failed | 3 passed (5)
FAIL  |unit| tests/views/system/workbench/app-badges.test.ts > marks an app by its standing > disabled: glyph { disabled: true }
FAIL  |unit| tests/views/system/workbench/app-badges.test.ts > marks an app by its standing > disabled and not approved: glyph { disabled: true, approved: false }
AssertionError: expected '' to be 'app_disabled' // Object.is equality
> tests/views/system/workbench/app-badges.test.ts:38:29
=== tests/checks/source/keys.test.ts
Test Files  1 passed (1)
Tests  8 passed (8)
=== tests/checks/tree/boundaries.test.ts
Test Files  1 passed (1)
Tests  11 passed (11)
=== tests/data/sources/config/settings.test.ts
Test Files  1 failed (1)
Tests  4 failed | 70 passed (74)
FAIL  |unit| tests/data/sources/config/settings.test.ts > appsSettings > reads a limit that is missing, which answers the entry default and no problem
FAIL  |unit| tests/data/sources/config/settings.test.ts > appsSettings > reads a limit below its minimum
AssertionError: expected { value: { ...(9) }, problems: [] } to strictly equal { value: { ...(13) }, problems: [] }
> tests/data/sources/config/settings.test.ts:756:27
=== tests/routes/apps/app-files.test.ts
Test Files  1 failed (1)
Tests  no tests
FAIL  |unit| tests/routes/apps/app-files.test.ts [ tests/routes/apps/app-files.test.ts ]
Error: Cannot find module '../../../src/lib/server/machine/apps/serve/address.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tests/routes/apps/app-files.test.ts
> tests/routes/apps/app-files.test.ts:12:1
=== tests/routes/apps/app-open.test.ts
Test Files  1 failed (1)
Tests  no tests
FAIL  |unit| tests/routes/apps/app-open.test.ts [ tests/routes/apps/app-open.test.ts ]
Error: Cannot find module '../../../src/lib/server/machine/apps/read/held.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tests/routes/apps/app-open.test.ts
> tests/routes/apps/app-open.test.ts:12:1
=== tests/routes/apps/app-store.test.ts
Test Files  1 failed (1)
Tests  no tests
FAIL  |unit| tests/routes/apps/app-store.test.ts [ tests/routes/apps/app-store.test.ts ]
Error: Cannot find module '../../../src/lib/server/machine/apps/routes/routes.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tests/routes/apps/app-store.test.ts
> tests/routes/apps/app-store.test.ts:13:1
=== tests/routes/apps/approve.test.ts
Test Files  1 failed (1)
Tests  no tests
FAIL  |unit| tests/routes/apps/approve.test.ts [ tests/routes/apps/approve.test.ts ]
Error: Cannot find module '../../../src/lib/server/machine/apps/read/held.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tests/routes/apps/approve.test.ts
> tests/routes/apps/approve.test.ts:13:1
=== tests/routes/edit/app-gate.test.ts
Test Files  1 failed (1)
Tests  no tests
FAIL  |unit| tests/routes/edit/app-gate.test.ts [ tests/routes/edit/app-gate.test.ts ]
Error: Cannot find module '../../../src/lib/server/machine/apps/read/scan.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tests/routes/apps/apps-fixture.ts
> tests/routes/apps/apps-fixture.ts:12:1
=== tests/server/edit/app-store.test.ts
Test Files  1 failed (1)
Tests  no tests
FAIL  |unit| tests/server/edit/app-store.test.ts [ tests/server/edit/app-store.test.ts ]
Error: Cannot find module '../../../src/lib/server/edit/writes/apps/host-store.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tests/server/edit/app-store.test.ts
> tests/server/edit/app-store.test.ts:16:1
=== tests/server/machine/apps/manifest.test.ts
Test Files  1 failed (1)
Tests  no tests
FAIL  |unit| tests/server/machine/apps/manifest.test.ts [ tests/server/machine/apps/manifest.test.ts ]
Error: Cannot find module '../../../../src/lib/server/machine/apps/serve/address.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tests/server/machine/apps/manifest.test.ts
> tests/server/machine/apps/manifest.test.ts:14:1
=== tests/server/root/eslint-switch.test.ts
Test Files  1 failed (1)
Tests  no tests
FAIL  |unit| tests/server/root/eslint-switch.test.ts [ tests/server/root/eslint-switch.test.ts ]
Error: Cannot find module '../../../src/lib/server/machine/apps/read/held.ts' imported from /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/baserun/tests/server/root/eslint-switch.test.ts
> tests/server/root/eslint-switch.test.ts:26:1
=== tests/state/system/apps/methods.test.ts
Test Files  1 failed (1)
Tests  28 failed | 47 passed (75)
FAIL  |unit| tests/state/system/apps/methods.test.ts > refuses an open target or a write by the page's own checks before any request > an address for a read of a file inside a declared folder, answered the address
FAIL  |unit| tests/state/system/apps/methods.test.ts > refuses an open target or a write by the page's own checks before any request > an address for a listing of a declared folder, answered the address
TypeError: methods.fsAddress is not a function
> tests/state/system/apps/methods.test.ts:258:9
```

The two files whose titles changed last (`add-app.test.ts`, `app-badges.test.ts`) and the manifest files, run the same way after their last change:

```
== tests/views/shared/explorer/add-app.test.ts
 FAIL  |unit| tests/views/shared/explorer/add-app.test.ts > offers Add as App on a folder that holds an app.yml > a folder holding app.yml: the item is offered
 FAIL  |unit| tests/views/shared/explorer/add-app.test.ts > offers Add as App on a folder that holds an app.yml > a root holding app.yml: the item is offered
AssertionError: expected false to be true // Object.is equality
 > tests/views/shared/explorer/add-app.test.ts:86:63
      Tests  3 failed | 4 passed (7)
== tests/views/system/workbench/app-badges.test.ts
 FAIL  |unit| tests/views/system/workbench/app-badges.test.ts > marks an app by its standing > disabled
AssertionError: expected '' to be 'app_disabled' // Object.is equality
 > tests/views/system/workbench/app-badges.test.ts:38:29
      Tests  2 failed | 3 passed (5)
== tests/server/machine/apps/manifest-host.test.ts
Error: Cannot find module '../../../../src/lib/server/machine/apps/read/scan.ts' imported from .../baserun/tests/server/machine/apps/manifest-fixture.ts
 > tests/server/machine/apps/manifest-fixture.ts:9:1
== tests/server/machine/apps/manifest.test.ts
Error: Cannot find module '../../../../src/lib/server/machine/apps/serve/address.ts' imported from .../baserun/tests/server/machine/apps/manifest.test.ts
 > tests/server/machine/apps/manifest.test.ts:14:1
```

Notes on that list:

- A test that imports a module at its new path fails on import on the unchanged tree. For the rows that preserve behaviour, the base's own copy of the file passes on the base tree: `manifest.test.ts` `Tests  66 passed (66)`, `app-files.test.ts` 26, `app-open.test.ts` 37, `app-store.test.ts` (routes) 8, `approve.test.ts` 10, `app-gate.test.ts` 20, `tests/server/edit/app-store.test.ts` 11, `eslint-switch.test.ts` 1, `methods.test.ts` 47, `settings.test.ts` 74; after the change the same files pass with the counts in the list above.
- The rows added to `manifest.test.ts` for `reads: [app-hosts]` and `reads: [app-messages]` cannot run on the base tree (the file fails on import); by the first run, case 42, the base refuses `reads: [app-hosts]` as `channel_unknown`, not with the closed wording the row expects.
- The kept root app row of `manifest-host.test.ts` is checked on the base tree by reading: `src/lib/server/machine/apps/scan.ts:148` there is `const kept = root === '' && keptHash === manifestHash;`, so a root app is never kept, and the row's expected `[[true, true], [false, false]]` gives `[[false, false], [false, false]]`. It was not run there.
- `tests/checks/source/keys.test.ts` and `tests/checks/tree/boundaries.test.ts` pass on the unchanged tree (8 and 11 tests); they are changed to carry the new reader and the new row, not to test new behaviour.
- A test that would still pass with the behaviour taken out of the code is an audit and not a proof: `app-badges.test.ts` 'approved' and the rows of `add-app.test.ts` that expect no item pass on the unchanged tree and are audits of what stays unchanged.

## Number of full-list runs

`npm run test:quick -- --base 398537672` ran 9 times: the first failed only the ASCII gate (a non-ASCII letter in `secrets.test.ts`), and 8 passed. After the third run the changes were the fixes the checks in `tests/checks` called for (comment width, the layer boundary, the process-wide state check, the duplicated blocks, the glyph stand-in), the split of `manifest.test.ts`, two closed-channel rows and one kept-app row in the manifest tests, the removal of `storeKeys` and `storeValue` from `src`, and test titles; the last run is the one quoted above. One of the eight passing runs printed `over the time limit` (51.8 s).

`tests/checks/source/comment-width.test.ts` failed once in a combined run of `tests/checks/source` and `tests/checks/tree`; its output was not kept and it did not fail again: it passed alone, in the next combined run and in `npm run test:checks` (final run above). The cause is not known.

## Accidental git commands

Five git commands were run by accident, all read-only (four reads of repository state, one `git diff --no-index` of two empty paths); `npm run test:quick` runs git itself, as it is allowed to. Nothing was changed through git.
