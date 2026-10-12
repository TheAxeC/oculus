# Step D64 refuter report (on .agents/worktrees/D64, base a9641a30b)

## Verification (rerun by the reviewer)

```
# all from .agents/worktrees/D64/tools/oculus, PATH with $HOME/.nvm/versions/node/v24.21.0/bin

npm run diagrams
  exit 0, 2:49.74 total; shasum docs/diagrams/* identical before and after (no file written)

npm run test:quick -- --base a9641a30b
  test:quick: 344 changed file(s), from git since a9641a30b
  173 test file(s), 10 essential
  ok ASCII gate (0.5 s) | ok prettier (0.7 s) | ok eslint (1.6 s) | ok svelte-kit sync (2.2 s)
  ok svelte-check (5.5 s): 486 FILES 0 ERRORS 0 WARNINGS
  ok vitest (49.3 s), Duration 44.44s
  test:quick: 49.9 s (limit 45.0 s); every command passed
  test:quick: over the time limit          (exit 0; quick.mjs:291 prints, quick.mjs:294 exits on command failure only)

npx vitest run tests/checks --testTimeout 0 --hookTimeout 0
  exit 1; Test Files 2 failed | 15 passed (17); Tests 2 failed | 264 passed (266)
  config-folder.test.ts:553  "expected any number of assertion, but got none"
  integrity.test.ts "the real hub > validates with no findings": 239 findings
    = 25 projects/**/project.yml, 55 registries/data.yml, 159 registries/venues.yml
  ls .agents/worktrees/D64/.oculus      -> No such file or directory (sparse checkout)
  main checkout: .oculus/config/{appearance,behavior,layout,sources}.yml, catalogs/vocab.yml;
                 .oculus/config/layout.yml:8 holds `docs:`; engine config/layout.yml:189 `docs: []`

ASCII gate: perl non-ASCII scan over `find src tests bin config -type f ! -name local.yml`   -> no output
LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md README.md docs/apps.md                           -> no output
sh utils/folder-check.sh                                                                      -> exit 0
grep -n "later step\|not yet built" DESIGN.md                                                 -> no output
ls src/lib/server/machine/lsp/relay.ts                                                        -> No such file
wc -l src/lib/server/machine/lsp/relay/*   -> relay-apps 323, relay-join 267, relay-life 173, relay-make 130,
     relay-options 65, relay-pages 163, relay-route 554, relay-server 340, relay-state 69, relay 115; total 2199
sh utils/unused-exports.sh vs D64-base unused-exports.txt -> 244 vs 243 lines, 118 vs 117 files; added
     apps/tools/streams.ts: BYTE_WINDOW, MESSAGE_WINDOW; lsp/relay/relay-apps.ts: AppStreamLike; folding/grammars
     names moved; removed stashUrl/worktreeDiffUrl, CommandSeverity (matches the report)
sizes: largest changed sources commands.svelte.ts 874, apps.svelte.ts 866, ops.ts 864 (<= 880); components <= 520

npx vitest run tests/server/machine/lsp tests/server/machine/apps tests/state/system/apps-tools \
    tests/state/sessions/terminal tests/server/machine/pty tests/routes/apps
  Test Files 54 passed (54); Tests 735 passed (735)
  untagged near the 0.7 s line: streams.test.ts "grants credit back only when the handler..." 729 ms;
  terminals.test.ts 50 MB case 741 ms

grep -rn "didSave" src                         -> only runner/tools/languages/providers.mjs:601
grep -rn "supportsPauseRequest" src            -> debug/app/capabilities.ts:30,64; model-debug.ts:91
grep -c supportsPauseRequest node_modules/@vscode/debugprotocol/lib/debugProtocol.d.ts -> 0
grep -rn "backpressure" src                    -> registered only in runner debug.mjs:77, languages/servers.mjs:155
grep -n "hosts-world\|host-runner.mjs\|runner-shell.mjs\|lsp/relay.ts" .scratch/migration/agents/guarded.md
  -> G1 line 8, G36 line 84, G63 line 159 name lsp/relay.ts; G75 line 50 names host/host-runner.mjs;
     G77 line 56 names host/runner-shell.mjs (both now under apps/host/runner/)
```

The report's account of the two `test:checks` failures: the conclusion (not caused by the step) is true. The step changed neither test, no hub data and none of the readers they call; both fail because the worktree has no hub `.oculus/` folder, so vocab is engine-only and `docs` is the engine's `[]`. The report's description is wrong in two places. It says the 239 findings are "every one a `project.yml`" (only 25 are; 55 are `registries/data.yml` and 159 are `registries/venues.yml` `venue_themes` keys), and it gives the cause as the hub copy's data instead of the missing `.oculus/` folder. No decision rests on the difference.

The report's account of `test:quick` over the limit (53.2 s for the builder, 49.9 s here) is true. The step's size causes it: 344 changed files select 173 test files. Every command passed, and quick.mjs exits 0 when only the time is over.

## Verdicts

What to build:
- 0 (relay split, prepare in relay-make.ts:51, heldOfRoot relay-route.ts:369, sizes): holds.
- 1 (streams with credit): violated in part. The oculus side never pauses the page's input (finding 4.3).
- 2 (DESIGN rows, `oculus/languages/*`): holds. The base row's "later step" is gone. The host-side `provide`/`documents` events the brief names have no use, because providers are an in-host server per item 5.
- 3 (languages joined, filenamePatterns with picomatch, first-line): holds.
- 4 (app servers in the relay, join, 30 s, 60 s, 4 restarts): violated in part. The join holds back oculus's own answer (finding 4.1).
- 5 (in-host providers and documents): violated in part. `onDidSaveTextDocument` never fires (finding 4.2).
- 6 (workspace API, scope, picomatch): violated. Private folders can be reached through an enclosing folder (finding 1.1), and the brief's named glob library was swapped for another (finding 1.2).
- 7 (debug adapters from apps): violated in part. Pause is never drawn (finding 1.3).
- 8 (tasks and problem matchers): holds, by tests (tasks.test.ts slow-tagged, matchers.client.test.ts).
- 9 (terminals, kind app, `@oculus-app`, stream terminals): holds.
- 10 (SCM): holds by tests and reading; the page side is for the look.
- 11 (decorations, propagate, frame merge): holds.
- 12 (menus list): holds as read (MENUS in reader.ts). Completeness against VS Code's page is declined, see below.
- 13 (inventory table): holds.
- 14 (docs): violated in part. docs/apps.md has false sentences (findings 1.1, 4.2, 3.3).
- 15 (tests and report): violated in part. No per-test titles, fixed sleeps, G1 rows that prove nothing (findings 2.1, 2.2, 1.4).

Cases:
- 1, 2, 3, 5, 6, 8, 9, 10, 11, 12, 13, 18, 19, 21: met (page-drawn parts of 1, 6 and 13 are for the look).
- 4: partial (finding 4.1).
- 7: partial. Pause is never drawn (finding 1.3); F5 and Add Configuration on the page are for the look.
- 14: met by tests plus the look.
- 15: met on the server side; the frame redraw is by reading.
- 16: met across host-end, terminals and debug-adapters tests.
- 17: met. The test exercises the host's credit accounting, not the Hub `backlog` path with a slow page (finding 2.5).
- 20: partial. A direct call on a file under `secrets/` is refused, but an enclosing folder's copy, rename or delete reaches it (finding 1.1).
- 22: met with a note. lifetime.test.ts changed beyond import paths: beforeEach/afterEach and `states()` moved into lsp-fixture.ts as `relaysMade()`/`states()`. The assertions are unchanged, and the report discloses the move.

## 1. Spec

**1.1 Private folders are reachable through an enclosing folder (item 6, case 20, docs/apps.md "What an app cannot do"). Verdict: item 6 violated, case 20 partial.**

src/lib/server/machine/apps/tools/workspace.ts:253-263
```ts
copy: (params) => {
    const from = file(params.uri);
    const to = file(params.target, true);
    ...
        if (lstatSync(from.real).isDirectory())
            cpSync(from.real, to.real, { recursive: true });
```
Also `rename` (workspace.ts:241-251, `renameSync(from.real, to.real)`) and `delete` (workspace.ts:227-240, `rmSync(target.real, { recursive: params.recursive, ... })`). The same holds for the file operations of `applyEdit` (workspace.ts:382-407).

What is wrong: `file()` judges only the named top path through `scope.resolve`. Nothing walks the tree under that path for a private folder (another listed hub's `secrets/`, `.oculus/local.yml`, or a state path that `local.yml` places).

Failure scenario: the workspace lists `~/workspace` and `~/workspace/research-hub`. An app calls `workspace.fs.copy(file:///.../research-hub, file:///.../copy, { recursive })`, and `secrets/` is copied to `copy/secrets/`. A later `readFile` of `copy/secrets/...` is allowed, because that path is not a private folder. A recursive `delete` or a `rename` of the enclosing folder removes or moves the secrets in the same way.

This breaks brief item 6 ("A private folder is never read or written through this API") and docs/apps.md:908, which says `fs.*` answers `closed` for a real path in a private folder.

**1.2 The glob library named in the brief was replaced (item 6, "Libraries checked"). Verdict: item 6 violated.**

workspace.ts:26 `import { matchesGlob } from 'node:path';`, used at workspace.ts:284 (findFiles) and :435 (file watchers). The brief names picomatch 4.0.7 for filenamePatterns, findFiles and file watchers. Only filenamePatterns use it (data/helpers/files/apps/tools/languages.ts:38; relay-apps.ts:117). The runner also adds a hand-written glob (runner/tools/languages/glob.mjs) for document selectors, beside the existing picomatch wrapper `data/helpers/search/glob.ts`.

Failure scenario: a pattern that picomatch and `matchesGlob` read differently (dot files, brace sets, `**` edge cases) matches one way in a selector and another way in `findFiles` or a watcher. The report does not raise the swap as a decision.

There is a second defect in the same code. workspace.ts:304
```ts
if (entry.name !== 'node_modules' || params.exclude === undefined) {
```
This walks `node_modules` when `exclude` is undefined and skips it when `exclude` is given or null. VS Code's `findFiles` does the reverse: undefined applies the default excludes, and null applies none. An app that calls `findFiles('**/*.md')` gets every file under `node_modules`, up to WALK_LIMIT, and can hit the limit before reaching its real files.

**1.3 Pause reads a key the protocol does not define (item 7, case 7). Verdict: item 7 violated in part, case 7 partial.**

src/lib/server/machine/debug/app/capabilities.ts:30,64
```ts
supportsPauseRequest: z.boolean().optional(),
...
pause: caps.supportsPauseRequest === true,
```
`grep -c supportsPauseRequest node_modules/@vscode/debugprotocol/lib/debugProtocol.d.ts` gives 0. DAP has no pause capability; `pause` is always available. Pause is therefore never drawn for any real adapter.

The brief's case 7 premise (every button drawn from a capability) is wrong for Pause. That is a premise found wrong, which goes to the orchestrator. The builder instead put a key of its own in its place (model-debug.ts:91 says so). The report's "Against the brief, nothing was found wrong" (its closing section) contradicts its own judgment-calls entry.

**1.4 The report does not have the shape item 15 asks for. Verdict: item 15 violated in part.**
- The brief: "The report lists, per entry, each test title added, renamed and deleted." The report gives files and `it` counts per entry (its "Tests per guarded entry" table), not titles.
- The history-word grep that spec.md "What every package obeys" asks for is summarised, not quoted.
- "Code-line changes each entry needs" lists G1/G36/G63 (`lsp/relay.ts`) and the additions to G75/G77. It omits that G75's Code line (guarded.md:50, `host/host-runner.mjs`) and G77's (guarded.md:56, `host/runner-shell.mjs`) name files this step moved to `apps/host/runner/`. Those two lines go stale at landing unless the orchestrator rewrites them.

## 2. Proof

**2.1 Fixed sleeps and wall-clock waits in the new tests (spec.md: a test waits on a signal, and a did-not-happen check advances a fake clock). Verdict: item 15 violated in part.**
- streams.test.ts:57 `settle` (5 ms) and the loop at :110
- terminals/terminals.test.ts:26-31 `until` polling, and :201 a 300 ms wait that `heldAt` depends on
- languages.test.ts:108, 148, 228, 281, 283, 310, 334, 358, 409, 421, 449, 508, 512
- decorations.test.ts:50, 82, 92, 107, 116, 185, 214
- workspace.test.ts:228, 292, 296
- scm.test.ts:97, 308, 314
- debug-adapters.test.ts:135, 526
- tasks.test.ts:105
- terminals-scope.test.ts:131
- terminals-tmux.test.ts:57
- host-end.test.ts:35
- world/debug-app.ts:148

Failure scenario: languages.test.ts:108 waits 1500 ms, then counts `initialize` calls. On a loaded machine the count is taken before the restart and the case fails, or a missing restart is not seen. streams.test.ts and terminals.test.ts are not slow-tagged yet run at 729 ms and 741 ms per case (verbose run above).

**2.2 The G1 rows prove nothing new.** The four `app-host decorate/scm/file/terminal` rows in tests/routes/apps/app-manage.test.ts pass on the unchanged tree too, and the report says so: they hit a generic token guard. They would still pass with the new actions removed, so they are no evidence for those actions.

**2.3 Checks were widened to let the step pass.** tests/checks/tree/boundaries.test.ts FROZEN gains three entries: `lib/ui/controls/editor/kit/languages/apps.svelte.ts:held`, `:signature` and `:version`. The ui ALLOWED list gains `data/helpers/files/apps/tools/language-kit` (boundaries.test.ts:191, 215). The builder reports both with reasons; they are still exemptions for the orchestrator to accept or refuse.

**2.4 Module-level mutable state the check does not see.** lsp/relay/relay-apps.ts:92
```ts
const infos = new WeakMap<ServerEntry, AppServerInfo>();
```
This map is written in `AppEntries.all()`. The FROZEN regex (boundaries.test.ts:400) matches `new (?:Map|Set)\b` only, so the check passes because it does not read `WeakMap`. That breaks spec.md "No globals". runner/tools/children.mjs:5-6 (`const held = new Set(); let hooked = false;`) is runner-process state in an `.mjs` file the check does not scan.

**2.5 Case 17's test measures the scripted host's own credit accounting** through the `double.streams.onOutput` gate. The Hub `backlog` path (`backlog`/`#released` added in channels.ts) with a real slow page is not exercised; it is met by reading only.

**2.6 First runs.** The report gives the first run of cases 2-5, 9, 11, 13 and 15-19 as "module absent / missing api" readings, not runs. The builder's scratch notes.md "First run" section holds the reader runs (key_unknown, plaintext languageOf, launch.yml refusal, `commands.yml` "must be text", createShell keys, 419 tests). Minor.

**2.7 The test:checks account is inaccurate** as described under Verification. No decision rests on it.

**2.8 No tests for the page-side Monaco converters.** The report's closing section says `languageConfiguration`, the app grammars skip, the status `languageName`, the `gone` handling in `lsp.svelte.ts` and the page's F5 have no test, because no guarded entry names them. That is the spec's rule, not a deferral. They rest on reading and on the look.

## 3. Standards

**3.1 Exported only for tests.** `apps/tools/streams.ts:29-30 BYTE_WINDOW, MESSAGE_WINDOW` and `lsp/relay/relay-apps.ts:51 AppStreamLike` are the three new unused-exports lines. spec.md says an export with no importer outside its file and tests is removed or made local.

**3.2 Duplicated stream logic.** runner/streams.mjs:17-18 repeats the two windows, and the stream protocol is written twice (streams.ts and runner/streams.mjs). The runner cannot import TypeScript, so this is an accepted constraint; it is noted so a later change edits both.

**3.3 A false sentence in docs/apps.md (item 14).** docs/apps.md:517: "A write first keeps the file it replaces in the local history ... and then writes through the chain a language server's edit uses, so a tab that holds the file follows." `workspace.fs.writeFile` (workspace.ts:198-215) calls `writeBytesAtomic` directly. Only `applyEdit` goes through `scope.env.edit`. A tab holding a file the app wrote with `fs.writeFile` does not follow by that chain.

## 4. Behaviour

**4.1 The join holds back oculus's own answer (item 4, case 4).** lsp/relay/relay-join.ts:237-242
```ts
export function complete(join: Join, late: boolean): boolean {
    if (join.parts.every((part) => part.answered)) return true;
    return (
        late && join.parts.every((part) => part.answered || appInfo(part.held.entry) !== undefined)
    );
}
```
Before the bound, every part must answer. A hover or completion on a document that an app server also serves therefore waits up to JOIN_MS (2 s) for the app server, even when oculus's own server answered at once. The brief says "oculus's own server's answers are never delayed". If the brief's "waits at most 2 s for the slower servers" was meant to allow this, the two sentences clash and the orchestrator should rule. Either way, the report does not state this before and after.

**4.2 `onDidSaveTextDocument` never fires (item 5, docs/apps.md:514).** runner/tools/languages/providers.mjs:601 waits for `textDocument/didSave`, but nothing in src sends one: the page client sends none and the relay makes none (grep above). An app that formats or lints on save never runs. docs/apps.md:514 lists the event as working.

**4.3 Oculus does not pause the page's input (item 1).** The oculus-side `StreamHub` never registers `backpressure()` (grep: only runner debug.mjs:77 and servers.mjs:155 do), so `this.#pause?.()` at streams.ts:315/322 is a no-op on the oculus side.

Failure scenario: a page that sends LSP messages to a slow app server faster than credit returns queues up to HELD_MESSAGES 4096, and then the stream is closed with `stream_full` (streams.ts:306-316). The language feature dies. Stream-terminal input through `sendBytes` (streams.ts:318-323) queues without a bound.

**4.4 Not stated with before and after.** Host processes are now spawned `detached: true` in a process group of their own, and the whole group gets SIGKILL when the host ends (host/process.ts diff). The report mentions this only as a judgment call. It is a behaviour change for any app that starts children.

**4.5 Pause is never drawn for real adapters** (finding 1.3).

## Declined to judge

- Whether MENUS is complete against VS Code's contribution-points page (not fetched).
- Page-only behaviours for the look: the grid, Repositories sections, Files rows, the editor kit, F5 and Add Configuration.
- Whether each of the 21 `languageOf` callers reads the joined map; I sampled selectors and apps-hosts only.
- The brief-check closures (D64-brief-check.md not read in detail).
- A second-build comparison (none configured).
- A full read of about 26k new lines. I read the streams, stream-terminals, channel/channels diffs, relay-apps/join/route/server, workspace/scope, capabilities, sessions, routes and the docs sections named above, and sampled the rest.
- Whether the `StreamHub.#closed` set's growth per stream id for the host's life matters in practice.

Reviewer usage: agent id not known to the reviewer; served model claude-opus-5-5; tokens not known to the reviewer; tool uses about 65; minutes not measured.

## Repair round 1, refuted (on .agents/worktrees/D64, base a9641a30b; the tree before the round is agents/reviews/D64-before-round1.patch)

### Verification lines (rerun by the reviewer, from the worktree's tools/oculus, node v24.21.0)

- `npm run diagrams`: exit 0, real 287.31 s; `shasum docs/diagrams/*` the same before and after.
- `npm run test:quick -- --base a9641a30b`: exit 0. "test:quick: 364 changed file(s), from git since a9641a30b"; "test:quick: 181 test file(s), 10 essential"; ok ASCII gate (1.1 s); ok prettier (1.7 s); ok svelte-kit sync (3.8 s); ok eslint (2.8 s); ok svelte-check (12.1 s): "486 FILES 0 ERRORS 0 WARNINGS"; ok vitest (72.6 s): Duration 62.21s; "test:quick: 74.0 s (limit 45.0 s); every command passed"; "test:quick: over the time limit".
- `npx vitest run tests/checks --testTimeout 0 --hookTimeout 0`: exit 1. "Test Files 2 failed | 15 passed (17)"; "Tests 2 failed | 264 passed (266)"; Duration 371.49s. The two failures (config-folder.test.ts "names a group of its own and a path under the hub for every document", integrity.test.ts "the real hub > validates with no findings") are the ones the first review explained: the worktree has no hub `.oculus/`.
- ASCII gate over `find src tests bin config -type f ! -name local.yml`: nothing printed; `LC_ALL=C grep -n '[^ -~]'` over DESIGN.md, HELP.md, README.md, docs/apps.md and the report: nothing.
- `sh utils/folder-check.sh`: exit 0.
- `sh utils/unused-exports.sh` against the base's list: no name added; every difference is one the report lists (stashUrl and worktreeDiffUrl left repositories.ts; kit/folding.ts and kit/grammars.ts moved to kit/languages/; CommandSeverity left index.ts and model-sessions.ts).
- Verbose run of the test files the round changed (apps/tools, app-manage, the debug route, debug-toolbar, lsp/versions, languages-join, show-focus, page-commands, host-commands, apps/manifest, pty/channel, flows, ops-replace, tests/server/machine/lsp) with `--testTimeout 60000`: "Test Files 41 passed (41)", "Tests 521 passed (521)", Duration 23.20s. The measured lines match the report (1048576 / 52428800 bytes; 1024 / 102400 bytes; "the host was sent 13 of 10000 didChange messages before it took any; the stream held at most 499 (window 16, bound 4096); 10000 arrived"). Every case at or above 300 ms is in a slow-tagged file or a file the round did not change, except terminals.test.ts's 50 MB case at about 300 ms, under 0.7 s.
- The report's evidence, rerun: `grep -rn supportsPauseRequest src tests DESIGN.md HELP.md docs | wc -l` gives 0; glob.mjs is gone and `find tests -name 'glob*'` prints nothing; `grep -rn "glob.mjs\|workspace-writes\|files/fs/replace.ts\|later step\|not yet built"` prints nothing; `APP_OPTION = '@oculus_app'` at pty/sessions.ts:78; `matchesGlob` only in lsp/held/watch.ts and data/snapshot/schema/set.ts, both at the base and outside findFiles and the watchers; `ls src/lib/server/machine/lsp/relay.ts` gives "No such file"; the largest relay file is relay-route at 563 lines; the largest source file is terminals.svelte.ts at 878 lines and the largest component TerminalGrid.svelte at 520.
- The builder's probe `node r1probe.mjs` against the base's runner-shell.mjs printed "api keys: commands, window, workspace" and each TypeError the report's Cases table quotes.
- The builder's first runs on the base, read from scratchpad/r1out: before-workspace 12 failed | 10 passed; before-debug-toolbar 2 failed; before-debug 2 failed | 2 passed; before-languages-join 1 failed | 2 passed; before-versions 5 failed | 4 passed; before-terminals-page 1 failed | 2 passed; before-server-backpressure 1 failed; before-terminals-tmux 1 failed | 2 passed; before-languages 4 failed | 11 passed; before-show-focus.client 1 failed; app-manage on the base 9 failed | 14 passed, the four app-host rows failing with 400 "action must be ...".
- No DOM: node_modules has no jsdom, happy-dom or @testing-library.

### Verdicts on the rulings of repair round 1

1. Holds. apps/tools/workspace/writes.ts sends every write through `ToolsEnv.ops` to `runOps` (writeFile an `upload` with `replace`; createDirectory a `create`; delete a `delete`, or `trash` with useTrash; rename a `rename`, a move `paste`, or both; copy a copy `paste`, then a rename when the target has another name). `#whole` (writes.ts:88-92) refuses `closed` through `scope.holdsClosed`. The tests read correctly. The Files view's upload changed with this ruling (see Behaviour); the app-id sentence is under Standards.
2. Holds. findFiles, the watchers, relay-apps `selects` and filenamePatterns match through `globTest` (picomatch, `{dot: true, basename: !glob.includes('/')}`); providers.mjs keeps its own copy because the runner cannot import TypeScript (accepted at finding 3.2); `exclude` follows VS Code.
3. Holds, with a finding under Spec: supportsPauseRequest removed; Pause drawn for every adapter while the session runs; Pause sends `{threadId: run.thread}` (session/controls.ts:77), whose id is wrong before any stop.
4. Holds (report lines 134-195, the history-word grep at line 259, the Code-line changes at line 197).
5. Holds: waits on events through `until` helpers; did-not-happen checks with `vi.useFakeTimers` and manualClock; timings quoted.
6. Holds: the four app-host rows send each action with and without the token; each fails on the base with 400 "action must be ...".
7. Holds (no change asked).
8. Holds: `entry.app` replaces the WeakMap; `createChildren()` replaces the module state of children.mjs; findGlobalState matches `new WeakMap` and `new WeakSet`; the checks pass. host-runner.mjs's module variables were at the base, in a file the check does not scan.
9. Holds: terminals-page.test.ts through the Hub's backlog with a slow page.
10. Holds.
11. Holds.
12. Holds.
13. Holds.
14. Holds: didSave through `source.onSaved`; the relay calls saveDocument for each server that declared save; the case fires `onDidSaveTextDocument` once.
15. Partly met, see Proof and Behaviour: backpressure registered as `stdin.pause()`/`resume()`, sendBytes bounded on both sides, stream-terminal input ends at 8 MiB; messages beyond the window and bound wait unbounded in the writer's queue and the paused PassThrough; the case measures only `stream.held()` (peak 499 while about 9,500 wait outside it).
16. Holds in code; DESIGN.md:438 states the before and after as the ruling asked (see Standards).
17. Holds: launch/write.ts through runOps; both rows tested.
18. Holds.
19. Holds.
20. Holds.
21. Holds: `stop()` unregisters and waits for `gone`, with a 7000 ms fallback; held/process sends shutdown, then exit.
22. The code does what the ruling asks, by reading (`showTerminal(id, label, preserveFocus = true)` sets `focus.id = preserveFocus ? null : id`; TerminalGrid focuses when `focusAsked() === id`; the runner passes `preserveFocus === true`). The report's "no DOM" is true; the focused element is a page behaviour for the look at landing.

### Verdicts for the whole diff since a9641a30b

Items: 0 holds; 1 violated in part (ruling 15); 2 holds; 3 holds; 4 holds; 5 holds; 6 holds; 7 violated in part (the Pause thread id); 8 to 11 hold; 12 holds as read (completeness against VS Code declined); 13 holds; 14 violated in part (the app-id sentences and DESIGN.md's history wording); 15 holds apart from the missing visible-changes section.

Cases: met 1, 2, 3, 4, 5, 6, 8 to 16 and 18 to 22, the page-drawn parts left to the look; 7 partial (the Pause thread id; F5 and Add Configuration left to the look); 17 met for the terminal stream and the Hub backlog, ruling 15's server variant partial.

### Findings

- **Spec 1. Pause sends thread 1, which may not be a running thread.** src/lib/server/machine/debug/session/controls.ts:77 `await this.#core.ask(run, 'pause', { threadId: run.thread });` with session/types.ts:113 `thread: THREAD` and wire.ts:27 `export const THREAD = 1;`. `run.thread` is set only from a stopped event (session.ts:528); the client sends no `threads` request. Failure scenario: an adapter whose thread ids do not start at 1, launched without stopOnEntry: Pause sends threadId 1 and nothing pauses. The test uses an adapter that stopped on thread 1 first.
- **Proof 1. Ruling 15's bound is measured only inside the stream.** lsp/relay/relay-apps.ts's backpressure and server-backpressure.test.ts's measure over `stream.held()`. With the PassThrough paused, the vscode-jsonrpc StreamMessageWriter keeps queueing and the page's websocket is not paused, so about 9,500 messages wait in oculus with no bound (the report's judgment (i), line 822, says so and marks the ruling DONE). Failure scenario: a page that keeps sending to an app server whose handler is stuck grows oculus's memory without limit.
- **Standards 1. App writes are not recorded with the app's id.** docs/apps.md:517 "is listed in History with the app's id and can be undone there"; DESIGN.md:553 "recorded in the change log with the app's id"; the report's Documents table. `recordNote` (src/lib/server/files/fs/ops.ts:632-635) sets no `app`; `ChangeRecord.app` (core/changes.ts:130) is never passed. Failure scenario: a reader looks in History for an app's writes and finds them unattributed.
- **Standards 2. History wording in DESIGN.md.** DESIGN.md:438 ("before, the host shared the server's group ..."), :551 ("before, no server was sent it"), :553 ("before, these writes bypassed the chain ..."). Line 438 follows ruling 16, which clashes with the no-history rule; 551 and 553 go beyond their rulings.
- **Behaviour 1. The report has no visible-changes section** (brief D64.md:199). Unstated with before and after, view and state: Pause drawn for `rite_dap` with the notice "pause is not supported: arm a breakpoint instead"; a Files-view upload that replaces a file keeps the old bytes and Undo writes them back; Add Configuration in History with Undo; didSave to oculus's own servers only when they declare save; findFiles' and the watchers' glob reading through picomatch.
- **Behaviour 2 (minor). Add Configuration creates `.oculus` before it validates** (debug/launch/write.ts): a refused append leaves an empty `.oculus` folder and a History "create" entry.
- **Behaviour 3 (minor). holdsClosed reads only the deepest root's closed paths**: a root nested in another root's folder could skip the outer root's closed_paths.

### Declined to judge

- Completeness of the menus against VS Code's page.
- Page-only behaviours, left to the look: the focused element after `show(true)` and `show(false)`; the grid; the Repositories sections; the Files rows; the editor kit; F5 and Add Configuration on the page.
- A comparison against a second build.
- A full read of the about 26,000-line diff (the round's delta read in full, the rest sampled).
- Whether the debug-toolbar test fits its guarded.md entry.

Reviewer usage: a1edcdaede4530b7c, claude-opus-5-5, 94,747 tokens, 112 tool uses, 26.9 min.
