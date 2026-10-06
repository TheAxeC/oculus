# E4 refuter report

E4 review (refute), worktree /Users/axelfaes/workspace/research-hub/.agents/worktrees/E4, base b811d87d5. I made no edits to the worktree, the main checkout or the ledger, and invoked no skill or agent. Scratch files are in my scratchpad only. The one headless Chrome I ran used a scratch profile under my scratchpad. It was stopped and the profile removed: the follow-up `ps` shows no Chrome process and `ls -a` of that folder lists only `x.html`. I sent no curl and touched neither port 8787 nor 8790.

**Bottom line.** The step is not acceptable as built. Five problems decide it:
- **Item 6 is broken (C38).** The Document view's new link handler can never act.
- **Item 10 is broken (C64).** A defect is written into DESIGN.md as if it were the intended behaviour.
- **DESIGN.md misses corrections the brief required:** `not_json` (item 8 / Decision 17), `roots` (Decision 7) and `processes` (Decision 8).
- **Two design departures are not reported:** the policy's `<origin>` became `<host>`, and two finding keys were added (`list_shape`, `file_unreadable`).
- **The tests do not follow the one-table-per-unit rule.**

## 1. Verification lines, verbatim

`bash ~/.claude-work/skills/land/templates/checks.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md`, run from tools/oculus in the worktree, exit 0:
```
$ npm run test:quick
test:quick: 133 changed file(s), from git since HEAD
test:quick: 91 test file(s), 10 essential
        tests/checks/config/config-folder.test.ts: changed, run by npm run test:checks or test:slow
        tests/checks/config/config.test.ts: changed, run by npm run test:checks or test:slow
        tests/checks/source/keys.test.ts: changed, run by npm run test:checks or test:slow
        tests/checks/tree/boundaries.test.ts: changed, run by npm run test:checks or test:slow
ok      prettier (8.0 s): All matched files use Prettier code style!
ok      ASCII gate (8.5 s)
ok      svelte-kit sync (27.7 s)
ok      eslint (58.4 s)
ok      svelte-check (49.3 s): 1791233521314 COMPLETED 378 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (70.9 s): Duration  50.30s (transform 107.29s, setup 0ms, import 143.48s, tests 43.17s, environment 513ms)
test:quick: 79.0 s (limit 45.0 s); every command passed
test:quick: over the time limit
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
exit 0
```
No test timed out, so no test was rerun alone.

**Tree checks**, `npx vitest run tests/checks --tagsFilter '!slow' --testTimeout 0 --hookTimeout 0 --reporter=dot`, exit 0:
```
 Test Files  15 passed | 1 skipped (16)
      Tests  226 passed | 3 skipped (229)
```

**The report's commands, rerun:**
- The 16 test files of the report's DONE row 6 (`npx vitest run --reporter=verbose tests/routes/apps ... tests/server/machine/apps/manifest.test.ts`), exit 0: `Test Files  16 passed (16)`, `Tests  371 passed (371)`. This matches the report.
- `npm ls penpal`: `penpal@8.0.1`. Matches.
- `sh utils/folder-check.sh`: `folder-check exit 0`. Matches.
- `sh utils/unused-exports.sh` diffed against `.agents/worktrees/E4-base/unused-exports.txt`: the same five hunks the report quotes (`Unused exports (257)`, `app-gate.ts: APP_HEADER, KIND_HEADER`, `oculus.js: connect`, and `allowedOrigin` and `typeOf` leaving the list).
- `wc -l`: context.ts 767, writes.ts 620, model/index.ts 582, +page.svelte 236, AppFrame.svelte 251, ApprovalPanel.svelte 152. Matches.
- The ASCII gate perl over `src tests config` (excluding local.yml) printed nothing, exit 0. `LC_ALL=C grep -n '[^ -~]' DESIGN.md HELP.md` printed nothing.
- `node $S/runs/vrun.mjs $S/runs/registry.ts` and `.../state.ts`: both outputs are byte-identical to the builder's `registry.out` and `state.out` (`diff` printed `registry-identical`, `state-identical`).
- `node $S/runs/watch.mjs`, exit 0. Every line matches except timings and one hash, which follows the file's mtime:
  - `C22 row appeared after 2042 ms` (the builder had 2019 ms)
  - `C29 ... after 1986 ms`
  - `C52 300 KB file: bytes 307211 version fc32bda519446ec6 expected sha16 of <size>:<mtimeMs> fc32bda519446ec6`
  - `C91 close() right after an event: pushes before 6 after 3 s 6 (difference 0)`
- `node $S/c100/run.mjs`: `resolved: file:///Users/axelfaes/workspace/research-hub/.agents/worktrees/E4/tools/oculus/node_modules/penpal/dist/penpal.mjs`.
- **M2, rechecked by parsing the builder's net logs** (my script `scratchpad/dnscheck.py`). Both `net-m124-control.json` and `net-m124-frame.json` hold `HOST_RESOLVER_MANAGER_REQUEST`, `HOST_RESOLVER_MANAGER_JOB` and 3 `DNS_TRANSACTION` events for `e4-probe.test`. The resolution is real in both runs. The report's "mentions: 14" count alone did not show that.
- **M4, rechecked the same way.** Events naming `127.0.0.1:9444`:
  - control: `URL_REQUEST` events (`HTTP_TRANSACTION_SEND_REQUEST_HEADERS` 2, `URL_REQUEST_START_JOB` 2)
  - frame: only `TCP_CONNECT`, `SOCKET_POOL_CONNECT_JOB_CREATED` and `HTTP_STREAM_JOB_CONTROLLER`, and no `URL_REQUEST`. See Proof P2 for what this does not show.

## 2. Verdicts

### Per item of "What to build"
1. **Holds.** It has three defects: B4 (the manifest is read twice), S2 (two finding keys added without saying so) and S7 (the header names are written twice).
2. **Holds.** The watch run reproduced: C22, C29, C52, C91 and C96's store line.
3. **Holds.** The registry run reproduced. `keys.test.ts` registers the apps fixture, and the tree checks pass.
4. **Holds by run** (C24 and C26 reproduced). The tab drawing is a look.
5. **Holds in behaviour, with a departure (S1).** The policy is built from a scheme-less `<host>`, not the item's `<origin>`. The justification is true: `node_modules/@sveltejs/adapter-node/files/handler.js:210` defaults the protocol to `'https'`. But it is not flagged as a decision.
6. **Violated.** `Document.svelte:141` never matches a link inside the frame (B1). The frame's `color-scheme` is set once and does not follow the theme (B2).
7. **Holds**, except B3: a root app's `git` part and `files` notices are computed against a folder from another workspace when a root key repeats.
8. **Code holds; the section part is violated.** DESIGN.md's list of refusal words lacks `not_json` (S3).
9. **Code holds; the section part is violated.** DESIGN.md's Closed write list lacks `roots` (S4, Decision 7).
10. **Violated.** C64: `open({ file })` that adds a pane rejects `CONNECTION_DESTROYED`. DESIGN.md:327 now states that defect as the design (S5).
11. **Holds.**
12. **Holds for every caller I enumerated:** rooted-tree.svelte.ts:97, row-menu.ts:405, read-again.ts:39, opening.ts:81/103/114/131, File.svelte:185 and +page.svelte:177. The page-side rule picks the wrong folder when a root key repeats across workspaces (B3).
13. **Catalogs hold:** apps.yml has `read` with 11 keys, `write` with 15, `read_root` with git and files, and `refused_not_json: not_json`. findings.yml `carries` holds apps, pty, processes, inbox, calendar, sessions and usage. The section part is violated: DESIGN.md:339's carries list lacks `processes` (S4, Decision 8).
14. **Holds for M1 to M3.** M4's frame-run evidence is indirect (P2).

### Per case
- **C1 to C18: met.** Each is a row or test of manifest.test.ts, and all 371 tests pass in my rerun. C3's parse row asserts only `toContain('does not parse')`.
- **C19: met.** Reproduced: `app:notes`, `app:cathedra/notes`, `app:ordo/notes`.
- **C20: met.** Covered by M, AF and AG.
- **C21: met.** Reproduced: `C21 built-in focus registration is the one registerAll made: true`.
- **C22: met.** Rerun shows 2042 ms.
- **C23: not verifiable** (look). Reading supports it: AppFrame.svelte:185 passes `changed`.
- **C24: met for the registry** (reproduced: `tabs closed: []`). The tab drawing is a look.
- **C25: not verifiable** (look).
- **C26: met** (reproduced).
- **C27: met** (reproduced: `4 -> 4 | tabs closed: []`).
- **C28: not verifiable** (look).
- **C29: met** (rerun 1986 ms).
- **C30 to C34: met** by AF tests.
- **C35: met by the AF test table.** The curl and `cmp` run was not rerun (curl is forbidden to me).
- **C36: met.**
- **C37: not verifiable by me** (curl forbidden). Reading hooks.server.ts:102 supports it.
- **C38: unmet by reading and by a Chrome check of the construct** (B1).
- **C39, C40: not verifiable** (look).
- **C41: met by the ME test.** The browser run was not rerun.
- **C42: met** (reproduced).
- **C43: not verifiable** (browser run not rerun).
- **C44: not verifiable** (look).
- **C45: not verifiable** (browser run and look).
- **C46, C47: look.**
- **C101: unmet by reading** (B2). The look will show it.
- **C48: met by the ME tests.** The tabs.mjs run was not rerun.
- **C49 to C51: met** (ST and CH tests).
- **C52: met** (rerun).
- **C53: met by the AS tests.** The 403 server run was not rerun.
- **C54 to C56: met.**
- **C57: not verifiable** (server run). Reading app-store.ts:53 and writes.ts supports it.
- **C58 to C60: met.**
- **C61: ME rows met.** The Confirm itself is a look.
- **C62, C63: met.**
- **C64: unmet** (S5).
- **C65 to C70: met** by the AO tests.
- **C71: answers met.** The tab run was not rerun.
- **C72 to C77: met.**
- **C78: not verifiable** (server runs). The AP keep row is met.
- **C79: met.**
- **C80: look.**
- **C81: met** (FT and OA).
- **C82 to C84: met.**
- **C85: n.a.** A3 is not on main.
- **C86: met by the ME test.** The brief asked for a run.
- **C87: partial.** There is an OA test and a reading of read-again.ts:39, but no run as the brief asks.
- **C88: met** for the functions (OA). The rest is a look.
- **C89: met** (FT).
- **C90: met** (reproduced).
- **C91: partial.** The run uses a real clock, and the brief asks for a fake clock. It reproduced on the real clock.
- **C92: not verifiable** (server run).
- **C93 to C95: met.**
- **C96: met** (M, AF, and the rerun store line).
- **C97: met.**
- **C98: met** by reading the inside-path asserts.
- **C99: met.** config.test.ts passes inside my tree-checks run. The view is a look.
- **C100: partial.** import.meta.resolve resolves in a Vite SSR loader with `configFile: false` over a scratch probe module, not the route under the project's config. The dev server look is pending.

## 3. Findings

### Spec

**S1. The policy uses `<host>` where the section and item 5 rule `<origin>`, and the report does not say so.**
- **Place:** DESIGN.md:298 and :301; src/lib/server/machine/apps/address.ts:101; src/lib/server/machine/apps/serve.ts:148.
- **Hunk:**
  ```
  -... form-action 'none'; frame-ancestors <origin>
  +... form-action 'none'; frame-ancestors <host>
  ```
  and `const host = url.host;`
- **What is wrong:** A ruled shape in the section was changed. `grep -c -- '<host>' E4-report.md` prints 0, and "Judgment calls the brief left open" does not list it.
- **Failure scenario:** The orchestrator lands a policy shape Axel never saw. If `ORIGIN` or `PROTOCOL_HEADER` is ever set, the reasoning in the address.ts:72-77 comment no longer describes the server.

**S2. Two finding keys, `list_shape` and `file_unreadable`, are added to the section and to findings.yml without being reported.**
- **Place:** DESIGN.md:274; config/text/findings.yml.
- **What is wrong:** These are a user-visible vocabulary the brief does not name. `git show b811d87d5:tools/oculus/DESIGN.md | grep -c list_shape` gives 0, and `grep -c 'list_shape\|file_unreadable' E4-report.md` gives 0. The rules require no silent design decision.
- **Failure scenario:** Findings keys Axel never ruled reach the Findings view.

**S3. DESIGN.md's list of refusal words lacks `not_json`, and still words `not_declared` as reads only.**
- **Place:** DESIGN.md:319.
- **Hunk:** "The words: `not_declared` (a channel not in `reads`), `closed`, `too_large`, `rate`, `declined` ..."
- **What is wrong:** Item 8 says "the section's list of words gains it". Decision 17 says the list says that an undeclared write kind rejects `not_declared`. `grep -n not_json DESIGN.md` prints nothing.
- **Failure scenario:** An app author reading the section does not know `not_json` exists, or that `write` rejects `not_declared`.

**S4. DESIGN.md misses `roots` in the Closed write list (Decision 7) and `processes` in the carries list (Decision 8).**
- **Place:** DESIGN.md:325, "Closed: `undo`, ... `session`, ..., and `deck`, ..." with no `roots`. DESIGN.md:339, "`findings.apps.carries.<channel>` for `apps`, `pty`, `inbox`, `calendar`, `sessions` and `usage`". The closed-channel sentence at :321 also names only `apps` and `pty`.
- **What is wrong:** The code closes both: data/helpers/files/apps.ts:80 `const CLOSED_CHANNELS = ['apps', 'pty', 'processes']`, and `roots` is in the closed write set. The section does not say so.
- **Failure scenario:** The section and the code disagree. A later step that treats the section as the contract reopens `roots` or `processes`.

**S5. C64's defect is written into the design as the behaviour, and item 10 is not met.**
- **Place:** DESIGN.md:327.
- **Hunk:** "When `open` adds a pane to a page that held one, the pane holding the app that asked is drawn again (measured in Chrome: the iframe element is replaced), so that app loads again and the call it made rejects with penpal's `CONNECTION_DESTROYED`"
- **What is wrong:** The section's contract is that `open` "resolves once it has". The build breaks it and rewrites the contract to match. The report's ruling item 1 recommends (c) "booked as a step of its own with (a) standing". Option (a) is the one the report itself calls lazy. Option (b) (land an app's `open` as a tab in its own pane) is inside this step's files.
- **Failure scenario:** Every app that calls `open({ file })` from a page with a single pane is reloaded, loses its in-memory state, and receives a rejection for an open that succeeded.

**S6. An unasked change to the Repositories store.**
- **Place:** src/lib/state/client/context.ts:364-369.
- **Hunk:**
  ```
  +        served: () => {
  +            const held = fs.workspaces();
  +            const current = held.workspaces.filter((workspace) => workspace.name === held.current);
  +            const others = held.workspaces.filter((workspace) => workspace.name !== held.current);
  +            return [...current, ...others].flatMap((workspace) => workspace.roots);
  +        },
  ```
- **What is wrong:** No item of the brief asks for it, and the report does not mention it. `grep -n "createRepositories\|current workspace first" E4-report.md` prints nothing, and the Files row for this file gives no reason.
- **Failure scenario:** The Repositories views now resolve a repeated root key to a different folder than before, with no review of that change.

### Proof

**P1. The report has no table of edits to existing assertions, allow lists and fixtures (spec.md:59).**
- **Place:**
  - tests/checks/config/config.test.ts:375-378: `const WORDS = { text: ..., apps: { closed_paths: ['secrets'] } };`. This changes the fixture of every existing behaviorFindings test.
  - tests/checks/tree/boundaries.test.ts: `ALLOWED.state` gains `'data/helpers/files/apps'`.
  - tests/checks/config/config-folder.test.ts: `'apps'` and `'views/apps/apps.yml'`.
  - tests/checks/imports/order.ts: `'views/apps'`.
- **What is wrong:** The spec requires one before/after row per changed line, made from a diff against the base copy. `grep -n "existing assertion\|allow list" E4-report.md` finds no such table.
- **Failure scenario:** A loosened fixture would pass review unseen.

**P2. M4's frame result rests on a click the probe never recorded.**
- **Place:** `$S/meas/out-m124-frame.txt`: `page at 4.6 s: {"csp":[],"rtc":"gathering=gathering","download":"not clicked","bridge":"stored"}`, then `page after 12 s: undefined`.
- **What is wrong:** `$S/apps/probe/probe.js` clicks only after 3 s plus the bridge plus a 1.5 s sleep. The 4.6 s read comes before the click, and the 12 s read failed. The only sign that the click happened is a preconnect on 9444 about 4.7 s after the first STUN datagram. "No request leaves" is shown by the absence of a `URL_REQUEST` (my net-log parse), but the probe's own output does not show the click. The report states the result without this caveat.
- **Failure scenario:** If the click never ran in the frame, `allow-downloads` stays in the sandbox on a measurement that did not measure the download.

**P3. "Judgment calls" leaves out choices that were made.** The `<host>` policy, `list_shape`, `file_unreadable`, the Repositories `served` reorder, the config.test.ts fixture, and the extra local.test and file.test cases are all missing from it.

### Standards

**T1. The step does not write one table per unit with the brief's titles.**
- **Place:** each new test file (titles in section 4).
- **What is wrong:** The brief (E4.md:241-260) names one table title per unit and says "No other test is written". spec.md:57 says one test per unit, as a table. Instead:
  - manifest.test.ts holds 1 table plus 18 separate its.
  - app-files.test.ts holds 17 tests.
  - methods.test.ts holds 15.
  - None of the new files uses its brief title. For example the brief's 'reads each apps folder to its rows and its findings' became the describe 'reading each apps folder to its rows and its findings' with `it.each('reads %s')`.
  - local.test.ts adds an it beyond the one checkLocal row asked: :118 'reads apps_dir under the home folder, against the engine, as written, or leaves it absent'.
  - file.test.ts adds 'keeps the type of a page when the route is given no apps folder' (:102) beside its table.
- **Failure scenario:** guarded.md cannot name these tests by the brief's titles. The suite grows past the entry rule.

**T2. A fixed sleep where the spec asks for a fake clock.**
- **Place:** tests/state/system/apps/methods.test.ts:289.
- **Hunk:** `await new Promise((resolve) => setTimeout(resolve, 20));`
- **What is wrong:** spec.md:64 says a test waits on a signal or a fake clock, never a fixed sleep. This test checks that something did not happen after 20 ms of wall time.
- **Failure scenario:** On a loaded machine the check passes for the wrong reason, or never exercises the path.

**T3. The 405 branch of the store and open routes is dead code, and its tests cost nothing if they fail.**
- **Place:** src/lib/server/machine/apps/routes.ts:141 and :152.
- **Hunk:** `if (request.method !== 'GET' && request.method !== 'HEAD') return refuse('method', 405);`
- **What is wrong:** `src/routes/api/(apps)/app-store/+server.ts` and `app-open/+server.ts` export only `GET`, so SvelteKit answers a POST with 405 itself and the branch never runs. The tests 'answers a POST with 405' (app-store.test.ts:66 and app-open.test.ts) exercise only that dead branch.
- **Failure scenario:** The tests stay green whatever the branch does.

**T4. The security parameter `holds` is optional.**
- **Place:** src/lib/views/shared/explorer/opening.ts:32, :46 and :60.
- **Hunk:** `holds?: ClientState['apps']['holds'];` and `if (holds?.(root, path) === true)`.
- **What is wrong:** Every caller passes it today. But an Opener or tabForKind call that omits it silently skips the apps-folder rule, and the type system does not catch the omission.
- **Failure scenario:** A future opener opens an app's page in the Document view.

**T5. The header names are written twice.**
- **Place:** app-gate.ts:46-47 exports `APP_HEADER` and `KIND_HEADER`, used only by tests. state/client/writes.svelte.ts:491 writes the literals `'x-oculus-app'` and `'x-oculus-write-kind'`.
- **What is wrong:** The report says the state layer cannot import a server module. But the shared pure module data/helpers/files/apps.ts, which both sides import (Decision 1), could hold them.
- **Failure scenario:** The two copies drift, and every app write is refused 403.

**T6. A broken comment wrap.**
- **Place:** tests/data/sources/config/settings.test.ts:5.
- **Hunk:** `// folders). Each reader is run over a` followed by a full-width line.
- **What is wrong:** The comment's wrapping was left broken after an edit.

**T7. HELP.md says something false about root apps.**
- **Place:** HELP.md:205.
- **Hunk:** "A root app is offered fewer channels than a machine app: ... and it cannot ask for the app store as a write."
- **What is wrong:** No app can ask for `app-store`. It is `write_closed` for every app (DESIGN.md:274).
- **Failure scenario:** A reader concludes that a machine app may declare `app-store`.

**T8. DESIGN.md mis-states where the `refused:` reason comes from.**
- **Place:** DESIGN.md:319, "`refused:<reason>` (the server refused a store write, and the word the write route answers in `error` follows the colon)".
- **What is wrong:** An unwritable store is answered with 200 and `refused:[{field:'store',reason:'unwritable'}]`, and methods.ts:159 reads `refused[0].reason`, not `error`. Separately, `refused:kind` comes from any write's 403, not only a store write.

### Behaviour

**B1. The Document view's link handler never acts. Case C38 fails.**
- **Place:** src/lib/views/sources/document/Document.svelte:141.
- **Hunk:** `const link = event.target instanceof Element ? event.target.closest('a[href]') : null;`
- **What is wrong:** The click comes from the frame's document, whose `Element` is a different realm. Checked in headless Chrome with a srcdoc frame (scratchpad/realm/x.html): `target instanceof Element: false | instanceof frame Element: true`. So `link` is always null and the handler returns.
- **Failure scenario:** A manual's link to `https://example.org` still replaces the page inside the Document frame, which carries oculus's origin, exactly what item 6 was meant to stop.

**B2. The frame's `color-scheme` does not follow the theme. Case C101 fails.**
- **Place:** src/lib/views/apps/frame/AppFrame.svelte:213.
- **Hunk:** `style:color-scheme={getComputedStyle(document.body).colorScheme}`
- **What is wrong:** The expression reads no reactive state. Inside `{#key `${src}:${reloads}`}` it is evaluated once per mount. (Read, not run.)
- **Failure scenario:** After a theme change, the frame's form controls and scrollbars keep the old scheme until the app reloads.

**B3. Page-side rules resolve a root key across every workspace; the server uses only the current one.**
- **Place:** src/lib/state/client/context.ts:466 `served: () => fs.workspaces().workspaces.flatMap((workspace) => workspace.roots)`, used by apps.svelte.ts:176 (`dir`), :202 (`shown`) and :295 (`holds`).
- **What is wrong:** The server's roots are the current workspace's only (`addedRoots`, server/files/fs.ts:299-302, calls `workspaceRoots(..., saved.current)`). instance.ts:6-7 says a root key can name another folder in another workspace. When it does and the current workspace is not first in the list, `find` returns the other workspace's folder. (Read, not run.)
- **Failure scenario:**
  - A root app's `read('git')` gets `{}`.
  - Its `files` notices are dropped.
  - `holds` answers false, so an app's `index.html` opens in the Document view. The server's text/plain nosniff answer still keeps it from running.
  - "Open folder" shows the wrong folder.
  - S6 fixed this ordering for Repositories but not here.

**B4. The manifest is read twice, so the shown permissions and the approved hash can come from different bytes.**
- **Place:** src/lib/server/machine/apps/scan.ts:120-137.
- **Hunk:** `readManifest({ file: manifestFile, ... })` parses one read of app.yml, then `const bytes = readFileSync(manifestFile); ... hash = hashApp(folder, name, bytes, walk.files);` reads it again.
- **What is wrong:** If app.yml changes between the two reads, the row's `reads`, `writes` and `connects` come from bytes A and `hash` from bytes B.
- **Failure scenario:** The panel shows A's permissions. Approve sends hash B, which the route accepts as current. After the next scan the app runs with B's permissions, which the reader never saw. The window is narrow, but it breaks G49's "an approval is taken only for the hash the reader was shown". Passing the bytes into readManifest ends it.

**B5. Lesser defects:**
- store-cache.ts:77 and :81: a failed request or any status other than 200 or 404 (a 500, a 403) rejects `missing`. DESIGN.md:319 defines `missing` as an app removed or refused, so an app treats a transient server error as its store being gone.
- AppFrame.svelte:100-110: a second `confirm` while one is open overwrites `asking` and `closing`, so the first `write`'s promise never settles.

## 4. Tests the diff adds

None of the titles below is named in guarded.md. G49 and G50 say "written by E4, its files and titles named in agents/briefs/E4.md". The brief names one title per unit, and none of the new titles equals it. Each is therefore "not named" (finding T1). The closest entry is given for each file.

**manifest.test.ts** (G49, manifest reader). describe 'reading each apps folder to its rows and its findings':
- it.each 'reads %s'
- 'draws a glyph that is not offered as the default glyph and an offered one as itself'
- 'reads the first row of a valid manifest as unapproved with no key'
- 'offers 501 files or more than 20 MB as no app, with one finding'
- 'takes the first folder for a name two folders both claim'
- 'records neither a symbolic link nor a dot-led file, and the hash ignores both'
- 'reads an apps folder that is a link out of its root as one finding and no app'
- 'gives one folder reached through two roots to the first and marks the second'
- 'reads an apps_dir that is a root apps folder as machine apps and marks the root'
- 'names three folders `notes` by three ids, finding keys and approvals'
- 'sets the address key of an approved row from its id and hash'
- 'names a root key holding a space in the id'
- 'reads a root app reading the inbox as no app, with the sentence naming a root app'
- 'names an app `focus` by the id app:focus, which no built-in view takes'
- 'reads a manifest that cannot be read as one finding naming the file'
- 'names a root key holding a slash in the id and the finding key'
- 'names the engine folder as no root of apps'
- 'names an apps_dir that is a file in one finding'

**app-files.test.ts** (G49, `src/routes/apps/`). describe 'answering an app file':
- 'answers an approved app file with its type, the open headers and the policy'
- 'answers a HEAD request with the status and headers of the GET and no body'
- it.each 'answers an empty 404 for %s'
- 'answers an empty 404 to an app that is not approved'
- 'answers an empty 404 to the key of another app'
- 'answers an empty 404 to a method other than GET and HEAD and to another host'
- 'stops answering a file whose bytes changed, and answers once the app is approved again'
- 'stops answering a file rewritten to the same size with its mtime put back'
- 'keeps answering a file that was only touched, since the hash is the approved one'
- 'answers an empty 404 for a recorded file that cannot be read'
- 'does not reach the sibling folder `notes-old` by any path of `notes`'
- 'answers a root app at its root address and a root key holding a slash encoded'
- 'answers no app of the root `engine` or of a root that is not shown'
- it.each 'serves a .%s file as %s'
- it.each 'answers the shared file %s with %i and no policy'
- 'answers no shared file to a POST or to a host that is not this machine'

**approve.test.ts** (G49 and G1, approve route):
- describe 'approving an app':
  - 'approves the hash the reader was shown and sets the key before it answers'
  - 'refuses a hash that is not the current one with 409 changed and writes nothing'
  - 'refuses a request without the write token with 403 and writes nothing' (G1's named title is 'refuses a request without the write token')
  - it.each 'answers $row with $status and writes nothing'
  - 'keeps a machine app approved on request and refuses to keep a root app'
  - 'revokes by folder and empties the key before it answers'
  - 'refuses an approval over a file that is not JSON and leaves it as it was'
- describe 'approving two apps with the same files in two roots':
  - 'holds one entry per folder, replaces only the folder approved again, and revokes one'

**app-store.test.ts, route** (G49). describe 'answering the store of an app':
- 'answers the version and the value of a held row'
- 'answers a null value and an empty version for an app with no store file'
- 'answers the null value for a file that does not parse and for one over the limit'
- it.each 'answers $row with $status'
- 'answers a POST with 405'

**app-open.test.ts** (G49). describe 'answering whether an app may have a file opened':
- it.each 'answers %s with %s'
- 'answers closed for a path in the config folder without a stat, a real path or a read'
- 'answers every file target closed while closed_paths is absent'
- 'answers closed for an empty path before it reads the disk'
- it.each 'answers $row with $status'
- 'answers a POST with 405'

**app-gate.test.ts** (G49, app gate):
- describe 'judging a write that comes from an app frame':
  - it.each 'lets through %s'
  - it.each 'refuses %s'
  - 'refuses every app header when the target holds no apps'
- describe 'the write endpoint under an app header':
  - 'writes an open kind and records the view id of the app that sent it'
  - 'records a root app by its view id with the root key unescaped'
  - 'writes a store as the app store and records it under the app'
  - it.each 'answers 403 kind for %s and writes nothing'
  - 'answers 403 kind to an app header from a target that holds no apps'

**methods.test.ts** (G49, page methods). describe 'judging an app call before any request':
- it.each 'answers an open of %s with %s'
- 'opens the view, the project and the file of an accepted target and no other'
- it.each 'answers a file the server says is %s with %s and opens nothing'
- 'asks nothing of the server for a path the page refuses'
- 'answers every file target closed while closed_paths is absent'
- 'refuses the 31st open in a minute with rate and the 1st again after the window'
- 'refuses a write the manifest does not declare without a request'
- 'sends a declared write and asks the reader first for a kind that deletes'
- 'rejects declined and sends nothing when the reader says no'
- it.each 'rejects %s with %s'
- 'refuses the 31st write in a minute with rate, setStore counting among them'
- it.each 'rejects setState and setStore of %s as not JSON and sends nothing'
- 'rejects a state over the limit and a store over the limit as too_large'
- 'refuses a read of a channel the manifest does not declare with not_declared'
- 'settles nothing for a call whose frame was destroyed while it waited'

**store-cache.test.ts** (G50). describe 'holding the stores of the apps':
- 'fetches once for two readers asking at the same time and holds the answer'
- 'drops an answer a push contradicted while it was in flight and fetches once more'
- 'waits for the next push when the store is newer than the row, then asks again'
- 'stops waiting for a push after the wait and tries again'
- 'rejects missing for a 404 while the row is gone and drops it when a push brings the row back'
- it.each 'rejects missing for %s'
- 'rejects missing for an app the rows do not hold'
- 'tells the tabs of a mounted app when its store version moved, and not otherwise'

**opening-apps.test.ts** (G49, tab choice). describe 'opening a file of an apps folder':
- it.each 'opens %s in the %s view from the tab choice'
- 'opens a page of an app as source text whatever kind the first bytes give'
- 'opens a page of an app as source text when it is pressed and when it is pressed with a key'
- 'opens a page of an app as source text beside the pane being read'
- 'opens a bookmark of a page of an app as source text and of another page as a document'
- 'opens a bookmark of a text file of an app as source text and not as the file view'
- 'opens a page held by a path through a link to the apps folder as source text'
- 'draws the rail bookmark of a file of an app with the source view'
- 'opens a page through openPage, which the project, card, entry and README openers call as source text in an apps folder'

**tests/server/edit/app-store.test.ts** (G8). describe 'writing the store of an app':
- 'makes the folder and the file on the first write, with the file private to the machine'
- 'tells the apps watcher after a store that changed and not after one that did not'
- 'answers one record naming the app, the field store, byte sizes and both values'
- 'records through the endpoint with the sizes and keeps the values in the undo folder'
- 'writes nothing and records nothing for a value equal to the file with its keys in another order'
- 'refuses a value over the limit as too_large and makes no file'
- it.each 'goes ahead when the file %s, which holds no value to compare'
- 'refuses a store folder that is a link out of the base as outside and writes nothing'
- 'writes a root app store inside the root and a machine app store inside the data folder'
- 'answers unwritable for a target that holds no apps'

**Changed files:**
- file.test.ts (G49, file route): describe 'serving a file of an apps folder', it.each 'answers %s with the type %s', and 'keeps the type of a page when the route is given no apps folder'. The brief names 'answers a file of an apps folder as plain text with nosniff'.
- changes.test.ts (G9): describe 'what a store write leaves in the undo folder', it 'keeps the values of a record outside its line and deletes them when the record leaves the window'.
- undo.test.ts (G9): 'puts an app store back to the value before, and refuses it once the store has moved or the kept values are gone'.
- settings.test.ts (G13): describe 'appsSettings' with 'answers each limit the entry default when it is missing, and no problem', 'answers the entry default and one problem for a limit below its minimum or not a number', 'answers a limit that is set', it.each 'reads closed_paths of %s', 'words the closed_paths finding with the key and the file' and 'throws for a catalog with no entry for an apps limit'. The six its follow the other describes of that file.
- local.test.ts (G13): checkLocal row `['apps_dir: 3', 'local.yml: apps_dir must be a path']`, plus it 'reads apps_dir under the home folder, against the engine, as written, or leaves it absent', which is not asked for.
- approvals.test.ts (G31): 'reads a file that is not JSON as no approved app and refuses an app approval or revoke over it'.
- keys.test.ts (G24): the fixture only, no title.

**Tests whose failure costs nothing:** 'answers a POST with 405' in app-store.test.ts and app-open.test.ts (T3).

**Lines added:** 2484 in new test files (`cat ... | wc -l`) plus 345 in changed test files (`git diff --numstat b811d87d5 -- tests`: added 345, deleted 20). That is 2829 added test lines.

## 5. Breakage code

None found. I grepped the diff and the untracked files for mutation, injection, fault, revert and process.env switches; the only hits were the word "default". The builder's `$S/bin/baserun.sh` runs the new test files on an unchanged copy of the base tree. It changes no code, which the spec allows.

## 6. Declined to judge

- **C35, C37, C53's 403 run, C57, C78, C81's curl, C92 and C95's curl.** Each needs a running scratch server and HTTP requests. My rules forbid curl, so I did not start the scratch server to send requests another way. Reading the code supports each of them.
- **C41, C43, C45, C48 tabs and C64/C71 open-files (the browser runs).** These need the scratch server and headless Chrome driving the page. Not rerun, for the same reason.
- **Whether `frame-src 'self'` on `/` keeps the File view's PDF frame working.** It is a look; I did not verify it.
- **Whether `sendFromApp` setting `state.error` (writes.svelte.ts, `exchange`) draws the page's own write error banner when an app's write is refused.** It is a look; I did not verify it.

## 7. Usage

Agent id: not available to me. Served model: claude-opus-5-5. Tokens: about 642,000 by the context counter (15,000,000 at start, 14,358,198 now). Tool uses and minutes: not verified, because the count spans a context compaction.

Usage: a4f365f02f4be4d29, claude-opus-5-5, 291,670 tokens, 164 tool uses, 25.1 min.

# Repair round 1, refuted

The round is not clean, and one new item is not done. Item 17 (the tests) is partial. Item 18 (M4) is partial, as the builder's report says. E4.md item 3's second effect on `data.apps` is not built, although DESIGN.md:278 describes it. Every other round item holds on my reruns. Z593 and Z594 are small enough to fix at landing. Z595 is not; it needs the extra round or a ruling on its shape.

Nothing was changed in the worktree, ledger or config. My scratch server is stopped: `lsof -i :8797` and `pgrep` both printed nothing.

## Verify lines (my rerun, from the worktree's tools/oculus)

`bash ~/.claude-work/skills/land/templates/checks.sh .../orchestrator-state.md` exited 0:
```
test:quick: 143 changed file(s), from git since HEAD
test:quick: 91 test file(s), 10 essential
ok      prettier (0.4 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      svelte-kit sync (1.5 s)
ok      eslint (1.9 s)
ok      svelte-check (6.6 s): 1791240251948 COMPLETED 380 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (15.7 s): Duration  12.49s
test:quick: 16.2 s (limit 45.0 s); every command passed
checks: 1 commands passed
```

Other reruns:
- **Tree checks** (`npm run test:checks`): exit 0, `Test Files 15 passed | 1 skipped (16)`, `Tests 226 passed | 3 skipped (229)`.
- **The new and changed test files on their own:** 17 files passed, 382 tests.
- **Small checks:**
  - penpal is 8.0.1.
  - The folder check exits 0.
  - Unused exports go from 255 to 256. The one added is `src/lib/server/machine/apps/oculus.js: connect`; `allowedOrigin` and `typeOf` drop out.
  - The ASCII gate printed nothing.
  - No source file is over 880 lines and no component is over 520.

What these do not cover: the look of any theme, the curl-dependent cases, and the M1 to M4 measurements (see Declined to judge).

## Runs

- **C64**, on my scratch oculus, port 8797, scratch profile: `open(...) -> resolved`. Panes went from 2 to 3. A mark set in the app's memory before the call was unchanged after it (`same document (mark unchanged): true`). `framesInsidePanes 0`.
- **C38**: a press on a manual's outside link called `window.open` (recorded) and the frame's location did not change. A press on an inside link navigated the frame.
- **Item 1, layout probe**: the app's in-memory mark was unchanged after each of these:
  - Maximise, then Restore panes;
  - switching away to another page, where the frame had `display: none`, and switching back, where it had `display: block`;
  - Split tab to the right.
- **Document view frame**: the mark was kept after Split tab downwards. The pane count did not change in that run, so this is partial evidence for that frame.
- **PDF frame**: not run live (see Declined to judge).

## Verdicts, round brief items 1 to 19

1. **Holds.** Since round 1, every frame is drawn by `src/lib/shell/frames/FrameLayer.svelte`, keyed by tab id, outside `{#key page.id}`, after the status bar in `Workbench.svelte`. That covers the app, the Document view and the File view's PDF. A pane draws only `ui/tabs/FrameSlot.svelte`. `TabFrames.set` keeps the held spec while kind, view, src, title, key and colorScheme are equal. Nothing in a layout change touches the `{#each frames.ids() as id (id)}{#key spec.key}` block, so no layout change moves or recreates an iframe. A frame is removed when its tab's instance leaves (`instanceView(id) !== specOf(id)?.view`) or when its key changes (`${src}:${run.reloads}`, a deliberate reload). DESIGN.md:327 now says `open` "resolves once the tab is open". The residual risks are listed under Behaviour.
2. **Holds.** DESIGN.md:298 and :301 use `<host>` and give the adapter-node reason (`handler.js:210`).
3. **Holds.** DESIGN.md:274 names `list_shape` and `file_unreadable`, and `config/text/findings.yml:192-193` holds both.
4. **Holds.** DESIGN.md:319 lists `not_json` and says an undeclared write rejects `not_declared`.
5. **Holds.** DESIGN.md:325 names `roots`; :321 and :339 name `processes`. These match `CLOSED_CHANNELS = ['apps', 'pty', 'processes']` at `data/helpers/files/apps.ts:84` and `findings.yml:210`.
6. **Holds.** DESIGN.md:319 gives the source of `refused` (the `reason` of a 200's `refused` list, `methods.ts:159`) and the 403 `kind`.
7. **Holds.** The clause is gone from HELP.md:205.
8. **Holds.** `Document.svelte:146-160` finds the link with `typeof target?.closest === 'function'`, and C38 passes (Runs).
9. **Holds for the code.** `AppFrame.svelte:98-113` sets `scheme` in a rAF after `ui.theme()`, `wallpaper()`, `crt()` and `textScale()` change, and the spec carries `colorScheme: scheme`. The look does not change yet, because no theme declares `color-scheme`. That is Z593.
10. **Holds.** `context.ts:340` `servedRoots = () => fs.roots()`, used at :371 (Repositories), :437 (commands) and :468 (apps). The commands use at :437 goes beyond the places the item names; the builder disclosed it.
11. **Holds.** `manifest.ts:221` makes the single `readFileSync`. `ManifestRead.bytes` carries the bytes, and scan.ts hashes `read.bytes`.
12. **Holds.**
    - `store-cache.ts`: a 404 continues the loop and ends `missing`; any other non-200 rejects `failed:<status>`; no answer rejects `failed:0`; a store that moved under all five tries rejects `failed:0`.
    - A second `confirm` waits in a queue (`ask` and `showFirst` in `apps.svelte.ts`), and `endQuestions` answers no on destroy, so no write's promise is left unsettled.
13. **Holds.** `grep -n 405 src/lib/server/machine/apps/routes.ts` prints nothing, and the two 405 tests are gone. DESIGN.md:323 says SvelteKit answers 405.
14. **Holds.** `holds` is required at `opening.ts:32`, :47 and :61. The one other caller, `read-again.ts:39`, passes it.
15. **Holds.** `APP_HEADER` and `KIND_HEADER` are at `data/helpers/files/apps.ts:48-49`, and app-gate.ts and writes.svelte.ts:28/491 import them.
16. **Holds.**
17. **Partial.** See Standards S2 and the test list.
18. **Partial.** See Proof P1.
19. **Done.** The P1 table and the judgment calls are in the report. I checked the table rows against the four files the item names: `config.test.ts:368-378` (the `WORDS` constant gains `apps.closed_paths`), `tests/checks/imports/order.ts` (`shell/frames` and `views/apps`), and `tests/fixtures/kinds.ts` (adds `APP_STORE`, a fixture edit). `boundaries.test.ts` and `config-folder.test.ts` show as `M` in `git status`.

## Verdicts, E4.md "What to build" 1 to 14

- **Items 1, 2, 4 to 13: hold.** The tables pass under checks.sh, and C38 and C64 pass live. Item 6's frame is now drawn by the frame layer, with the same sandbox, `allow=""`, referrer policy and colour scheme (`FrameLayer.svelte:159`).
- **Item 3: not done in one part.** Its text says `+page.svelte` registers "from one effect for every push of `apps` and from a second effect on `data.apps`". Only the first effect exists. `grep -n "data\.apps" src/routes/+page.svelte` gives only :72, which is inside the one-time `untrack` block. See Spec S1.
- **Item 14: holds** for M1 to M3 as written. For M4, see P1.

## Verdicts per case

- **C38 and C64:** pass, from my live runs.
- **Cases the tables hold:** pass, since vitest is green. Which table holds which case is under Test list.
- **Cases I did not run:** listed under Declined to judge.

## Findings

### Spec

- **S1. `src/routes/+page.svelte:66-75`, together with DESIGN.md:278.**
  - What the doc says: DESIGN.md:278 reads "a second effect reads `data.apps`, as the token's effect reads `data.token` (`+page.svelte:78-80`), and registers and seeds again whenever a load hands new page data".
  - What the code does: `data.apps` is read once, inside `untrack(() => { ... seedApps({ rows, findings, folders }, version); registerApps(client.registry, rows); })`, and there is no effect on it. E4.md item 3 asks for one.
  - Failure: a write meets a 403, and `invalidateAll` (`writes.svelte.ts:530-531`) runs the load again with new `data.apps`. The page does not seed or register them, and keeps the old rows until the next `apps` push. In the usual case the 403 comes from a restarted server, the socket reconnects, `seededApps` resets to -1 (`socket.svelte.ts:225`) and the next push repairs the rows. So the visible gap is short, but the doc states behaviour that is not built.
  - Landing size: small. One `$effect` that reads `data.apps` and calls `seedApps` and `registerApps` inside `untrack`, placed beside the token effect at :79.
- **S2. Stale line anchors in DESIGN.md:**
  - :335 cites `Document.svelte:192` for "the Document view's frame carries oculus's origin". That line now reads `() => instance.id,`. The `sandbox="allow-same-origin allow-scripts"` is at `FrameLayer.svelte:172`.
  - :337 cites `Workbench.svelte:290` for `svelte:window`, which is now at :299.
  - Failure: a reader following either anchor lands on the wrong code. Fixing this means editing the two anchors at landing.

### Proof

- **P1. M4 rerun, item 18.** In the control runs the probe records its own click:
  - m4r1-control: `"click":"returned undefined"`, the click at 1791238552419 and the first 9444 line 2 ms later;
  - m4r2-control: `"click":"returned undefined"`, 3 ms later.

  In the two frame runs the probe's record stops at `"click":"about to click"`, and no "returned" line was captured (`meas/m4r1-frame.out`, `meas/m4r2-frame.out`). The result there rests on the net log alone: `127.0.0.1:9444: preconnects 1, URL_REQUESTs 0, request headers sent 0` in both runs, plus a `tcp 9444 connection` at +8 ms and +3 ms, which is the preconnect. So the frame side does not meet "the probe recording its own click (the time it clicked and what the click returned)". The conclusion in DESIGN.md:337 (the policy stops the request; a preconnect goes out) is consistent with the net log. What would settle it: a frame run whose probe record shows the return of the click, read before the net log.

### Standards

- **T1. The builder ran two git commands**, as its own round report states. `agents/spec.md` says "You never run a git command", and the round brief repeats it at line 5. Neither command shows in the tree as a change, but this is a rule break the orchestrator records.
- **T2. Item 17 is partial: the tables hold rows beyond the cases each brief line lists** (E4.md:241-258).
  - `methods.test.ts` (43 rows; the brief names C60, C62's rate, C63, C72) also holds:
    - 'a declared write, sent, with the reader asked first for a kind that deletes';
    - 'a write the reader declines, rejected declined with nothing sent';
    - 'a state over the limit and a store over the limit, rejected too_large';
    - 'a read of a channel the manifest does not declare, refused not_declared';
    - 'a call whose frame was destroyed while it waited, which settles nothing'.
  - `store-cache.test.ts` (12 rows; the brief names C54) also holds the rows for a store newer than the row (2), a 404 while the row is gone, a 404 on every try, no answer, an error status, a store changed under every try, an app the rows do not hold, and a store version told to the tabs.
  - `settings.test.ts`'s `describe('appsSettings')` is one `it.each` of 17 rows, where E4.md:256 and round item 17 say "one case (C74's finding, C82)".
  - The manifest (67 rows), app-open (39), app-gate (26), app-files (29) and approve (11) tables are each larger than their case lists' input counts. I did not map those row by row.

  Several of the extra store-cache rows prove round item 12's new outcomes (`failed:<status>`, `missing` only for a 404). Item 17's "every other test the diff adds is deleted" makes no exception for them. Whether rows that prove a round item stay is the orchestrator's ruling, since the two items pull against each other.
- **T3. The app-store table's title contains "405"** ("answers a held row's store, and 400, 404 or 405 for every other request"), but no row gives 405, because round item 13 removed the branches. The conflict is between E4.md's verbatim title and item 13. The title stays as briefed, and no row can exercise "405". The orchestrator rules on the title.
- **History words in added comments** (`grep` over every added comment line for before / used to / no longer / still / previously): every hit uses "before" in its time-order sense. No hit is a history note.
- **Fixed sleeps:** none left. `methods.test.ts:362` uses `vi.useFakeTimers()` with `advanceTimersByTimeAsync(1000)` at :377, and `store-cache.test.ts:67` and :143 do the same. The one `Date.now()` is `app-files.test.ts:208`, which builds a future mtime and does not wait.

### Behaviour

Item 1 holds, with these consequences of the frame layer to weigh:

- **B1. Tab order and the accessibility tree.** `FrameLayer` is placed after `StatusBar` in `Workbench.svelte`. Every frame sits last in the DOM, so Tab from a pane's controls reaches the frame only after the status bar, and screen readers announce it outside its pane.
- **B2. Stacking and clipping.** The `.frame{position:fixed}` element has zIndex 0 for a frame in a pane and the float's depth plus one in a float (float depths doubled in `float-geometry.ts`). A z-auto positioned element inside a pane paints under it, and neither pane nor float `overflow` clips it. Tooltip (z 80), Modal (60 to 70) and the floating list (70) sit above it, by `grep -rn z-index src/lib/ui`. Anything in a pane that relies on overlapping the frame area without a z-index will be covered. I did not see a case of this in my runs.
- **B3. A rAF loop reads layout every frame** (`place()` in FrameLayer) for every drawn frame. The cost is not measured.
- **B4. Spec swaps.** A new AppFrame instance starts with `scheme = ''` and sets it one frame later. The spec changes only in `colorScheme`, which is not part of the frame's `{#key}`, so the frame is restyled, not reloaded. A frame is dropped, and the app reloads, if `apps.ready()` turns false while it is drawn (the spec becomes null). This is in line with the brief, but it is a reload path outside a deliberate reload.
- **B5. The shield.** While the keep layer is up, `PaneBody.svelte` shields only the active tab's frame. During a sash drag every frame gets `pointer-events:none` (`body.sashing .frame`).

## Test list (by file and title, with guarded entry)

- `tests/server/machine/apps/manifest.test.ts:694` 'reads each apps folder to its rows and its findings': G49, named E4.md:243.
- `tests/routes/apps/app-files.test.ts:321` 'answers an app file only while every condition holds, and an empty 404 otherwise': G49, E4.md:244.
- `tests/routes/apps/approve.test.ts`:
  - :223 'approves only the hash the reader was shown, and revokes by folder': G49, E4.md:245;
  - :229 'refuses a request without the write token': G1, E4.md:246.
- `tests/routes/apps/app-store.test.ts:32` "answers a held row's store, and 400, 404 or 405 for every other request": G49, E4.md:247.
- `tests/routes/apps/app-open.test.ts:204` 'answers closed, missing or ok in the order of the checks, and reads no hidden file first': G49, E4.md:248.
- `tests/routes/edit/app-gate.test.ts:244` 'refuses a write whose matched kind is not the open kind its header names': G49, E4.md:249.
- `tests/state/system/apps/methods.test.ts:387` "refuses an open target or a write by the page's own checks before any request": G49, E4.md:250.
- `tests/views/shared/explorer/opening-apps.test.ts:183` 'opens a file of an apps folder as source text, whichever opener asks': G49, E4.md:251.
- `tests/routes/files/file.test.ts` 'answers a file of an apps folder as plain text with nosniff' (5 rows): G49, E4.md:252.
- `tests/state/system/apps/store-cache.test.ts:252` 'drops an answer a later push contradicts and fetches once more': G50, E4.md:253.
- `tests/server/edit/app-store.test.ts:238` 'writes the store of an app as the app-store kind': G8, E4.md:254. The brief names the file and cases but no title.
- `tests/server/core/changes.test.ts` describe 'what a store write leaves in the undo folder', it 'keeps the values of a record outside its line and deletes them when the record leaves the window': G9, E4.md:255 ("one case"; no title named).
- `tests/routes/edit/undo/undo.test.ts`, it 'puts an app store back to the value before, and refuses it once the store has moved or the kept values are gone': G9, E4.md:255 (no title named).
- `tests/data/sources/config/settings.test.ts` `describe('appsSettings')`, one `it.each` of 17 rows: G13, E4.md:256 (see T2).
- `tests/data/sources/config/local.test.ts`, row `['apps_dir: 3', 'local.yml: apps_dir must be a path']`: G13, E4.md:256.
- `tests/server/machine/approvals/approvals.test.ts`, it 'reads a file that is not JSON as no approved app and refuses an app approval or revoke over it': G31, E4.md:257 (no title named).
- **Fixture or allow-list edits only, adding no case:**
  - `tests/checks/source/keys.test.ts` (G24, E4.md:258);
  - `opening.client.test.ts` (`holds: () => false`, from item 14);
  - `tests/fixtures/kinds.ts`, `entities-fixture.ts`, `context-fixture.ts`, `config.test.ts`'s `WORDS`, `order.ts`, `boundaries.test.ts`, `config-folder.test.ts`.

## Z593 to Z595, at landing

- **Z593: small, fix at landing.** Add `color-scheme: dark` to the 13 dark theme classes in `src/lib/themes/themes.css`:

  | Class | Line |
  |---|---|
  | `body.dark` | :11 |
  | `body.vscode-dark-modern` | :40 |
  | `body.mocha` | :101 |
  | `body.gruvbox` | :147 |
  | `body.nord` | :193 |
  | `body.tokyonight` | :239 |
  | `body.rosepine` | :293 |
  | `body.everforest` | :347 |
  | `body.dracula` | :401 |
  | `body.solarized` | :509 |
  | `body.kanagawa` | :563 |
  | `body.synthwave` | :671 |
  | `body.tokyoneon` | :725 |

  The light ones are the base (no class), `vscode-light-modern` :73, `latte` :455 and `gruvboxlight` :617 (`config/appearance.yml:10-26`, and each class's `--bg`). `AppFrame.svelte:108` already reads `getComputedStyle(document.body).colorScheme`.

  The change reaches beyond app frames: every native control and scrollbar on the page turns dark, and `Calendar.svelte:313` (`color-scheme: inherit`) follows. The look check therefore covers the page as well as an app frame, in one dark theme and one light theme.
- **Z594: small, fix at landing.** Add an `onblur` to the `<svelte:window>` at `Workbench.svelte:299-303`, with its handler in `shell/keys/workbench-keys.svelte.ts` beside `paneFocused` (:434) and `frameSlot`. When `document.activeElement` is an `iframe[data-frame-of]`, the handler dispatches a bubbling `focusin` on its slot. That runs `PaneView.svelte`'s `entered()` (:168-171, `touchPane` plus `activateInstance`) through the pane's `onfocusin` at :415, and `rememberPane` through the window's `onfocusin`. This is the same pattern the forwarded keys already use when they are dispatched on the slot. About 15 lines. Not verified live.
- **Z595: not small; send it to the extra round, or rule on its shape first.**
  - Wire shape: `open` today takes only `{ view }`, `{ project }` and `{ file }` (`methods.ts:254-298`). An outside link needs a new target form, and its key name is not settled by the ruling.
  - Files: `oculus.js` (a click listener on outside links), `methods.ts` (the new branch with its checks), `apps.svelte.ts` (`window.open` with `noopener`), the DESIGN.md section (:327 and :337), the `apps.yml` words, and new rows in the methods table.
  - G49 concern: `oculus.js` runs in the app's own realm, so the app can call this path itself. The page cannot trust a "user pressed a link" signal sent over the bridge. An app with `connects: []` could then put anything it read into a URL opened as a browser tab, a channel the policy does not see. Closing it needs a page-side Confirm that shows the address, which adds a question and its words. That is more than a landing fix.

## Breakage code

None. I grepped the tracked diff and every untracked file (`xargs -0 grep`) for mutation, revert, inject and similar patterns; the only hits were "default" and "defaultApprovalsPath". The builder's scratch scripts that I read copy test files into a base tree and run them there. None of them edits source.

## Declined to judge

- **M1 to M3 reruns:** they need a static server with no policy, a STUN or TCP listener and Chrome net logging. I read the builder's outputs (`meas/`) and did not repeat them.
- **The curl-dependent cases (C35, C37, C53's 403, C57, C78, C92, C95):** the task forbids curl. Where a table holds them, they are covered there.
- **The PDF frame, live:** it is not run. The code path is the same `{#each}{#key}` block as the app frame, with `key: ''`.
- **Tooltips and menus over frames, live:** judged only from the z-index values.
- **Z594 behaviour:** not run.
- **`npm run diagrams`:** it writes files. The tree checks cover staleness, and they pass.
- **The look of any theme:** not judged.

## Usage

claude-opus-5-5, about 475,000 tokens.

# Repair round 2, refuted

Five findings need a fix before E4 lands. Two of them are security holes in the new `open({ url })`:
- **The whole address is not shown.** The Confirm does not show a long address whole.
- **The Confirm takes the keyboard.** It focuses its own Confirm button, so the reader's next Enter, typed into the app, opens the address.

The other three:
- **Item 2 (Z593), the dark themes.** It was built as briefed, but native controls inside an app frame still stay light in a dark theme. An app that sets no colour scheme of its own now gets an opaque white background. In the light themes an app follows the operating system's dark mode, not the oculus theme.
- **Item 3 (Z594), frame focus.** A press in a frame activates its pane only when the focus comes from the page. A press from one frame into another frame changes nothing.
- **Item 7 (Z600), the dropped rows.** The 52 rows were dropped as round 2's item 7 says, and every row I sampled duplicates an outcome another row still gives. But plan.md's text of Z600 also says the brief's case list is the least a table holds. About 15 cases that E4.md lists no longer have a row. That conflict is the orchestrator's to rule on.

Every verify command is green. I changed nothing in the worktree, the ledger or config. My scratch oculus on port 8799 is stopped (`lsof -nP -iTCP:8799 -sTCP:LISTEN` printed nothing), and no headless Chrome of mine is left running.

## 1. Verify lines (rerun from the worktree's `tools/oculus`)

`bash ~/.claude-work/skills/land/templates/checks.sh .../orchestrator-state.md` exited 0. Output of the second run, which I captured with its exit code:
```
$ npm run test:quick
test:quick: 144 changed file(s), from git since HEAD
test:quick: 91 test file(s), 10 essential
ok      prettier (0.5 s): All matched files use Prettier code style!
ok      ASCII gate (0.5 s)
ok      svelte-kit sync (1.6 s)
ok      eslint (1.6 s)
ok      svelte-check (6.2 s): 1791243278470 COMPLETED 380 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (16.2 s): Duration  13.38s (transform 12.72s, setup 0ms, import 26.52s, tests 24.99s, environment 130ms)
test:quick: 16.9 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests,
            build, lint of unchanged files; npm run test:landing runs them
checks: 1 commands passed
```
The first run, under load, printed `test:quick: 54.2 s (limit 45.0 s); every command passed` and `test:quick: over the time limit`, then `checks: 1 commands passed`.

`npm run test:checks` exited 0: `Test Files  15 passed | 1 skipped (16)`, `Tests  226 passed | 3 skipped (229)`.

## 2. The report's evidence, rerun

- **The nine Z600 files** (`npx vitest run` with the JSON reporter): 242 tests passed out of 242, as the report says.
  - Tests per file: manifest 55, app-files 23, app-open 30, app-gate 17, methods 42, approve 10, app-store 7, file.test.ts 5, settings.test.ts 53.
  - Rows per table: `appsSettings` 13, the file route's apps table 4, the G1 approve table 1.
  - Against the round-1 reviewer's counts, the drops match the report's 12, 6, 3, 9, 9, 6 (and 5 added), 1, 4 and 2.
- **P1, the M4 net logs.** `python3 $S/cdp/netpre.py` gives:
  - on `net-m4r1-frame.json` and `net-m4r2-frame.json`: `127.0.0.1:9444: preconnects 1, URL_REQUESTs 0, request headers sent 0`;
  - on the two control logs: `preconnects 2, URL_REQUESTs 2, request headers sent 2`. So the counter does see a request when one is sent.
- **Z593 run.** `$S/runs/c101z.out` holds two more columns than the report quotes, `sameDocument` and `appSeesDark`. `appSeesDark` is `true` on every line, in the light themes too. See Proof P1.
- **Z599 and Z594 runs.** I reran both behaviours on my own scratch oculus (port 8799, own engine, home and state under my scratchpad `rv2/`, headless Chrome on a scratch profile over a pipe). The results are under Behaviour.

## 3. Verdicts, round 2 items

1. **Z599, `open({ url })`: built, two security findings.** The code holds what the item asks:
   - `methods.ts:121-132`: an `http:` or `https:` address of at most 2048 characters with no user name or password; anything else rejects `closed`.
   - `methods.ts:301-312`: the call counts toward the open limit first (`opens.take()` at `:277`), then the Confirm, then `declined` on a no.
   - `apps.svelte.ts:313`: `window.open(address, '_blank', 'noopener,noreferrer')`.
   - `oculus.js:74-95, :132-137`: the link listener.
   - The Confirm words are in `apps.yml:67`; DESIGN.md :327, :337 and :339 and HELP.md:209 are updated.
   - The five rows are in the methods table.
   - Behaviour B1 and B2 below are the defects.
2. **Z593: built as briefed, behaviour not reached.** Thirteen dark classes carry `color-scheme: dark` (`themes.css:14 ... :740`). The four light ones carry none. See Behaviour B3.
3. **Z594: partial.** `Workbench.svelte:302` and `workbench-keys.svelte.ts:439-448` work from the page into a frame. They do not work from one frame into another. See Behaviour B4.
4. **S1: holds.** The second effect is at `+page.svelte:83-92`. One small point is under Behaviour B5.
5. **S2: holds.**
   - `FrameLayer.svelte:172` is the sandbox line, and `Workbench.svelte:299-304` is the `<svelte:window>`.
   - The new DESIGN.md:278 anchor `+page.svelte:84-92` starts inside the comment. See Spec S3.
6. **Z601: holds.** `app-store.test.ts:32` has the new title. E4.md:247 still carries the old one; see Spec S2.
7. **Z600: holds as round 2's item 7 words it; it conflicts with plan.md's Z600 text.** See section 6.2 and Spec S1.
8. **P1 (M4): holds.** The report states the net-log result and it was not rerun, as the item says. My recount matches.

## 4. Verdicts, E4.md items 1 to 15 (the whole diff)

- **1, the manifest and where an app lives: holds.** The table is green. Some case inputs from E4.md are no longer rows (Spec S1).
- **2, the watcher: holds.** Round 2 did not change it.
- **3, the first frame: holds.**
- **4, an app added, changed or removed: holds**, for the look.
- **5, serving: holds.**
- **6, the frame: holds**, with Z593's effects (B3). DESIGN.md:306 says "The frame element paints nothing", which is now false in a dark theme for an app that sets no colour scheme.
- **7, the bridge: holds.**
- **8, what an app keeps: holds.**
- **9, writes: holds.** B2's keyboard hole applies to the write Confirm too.
- **10, `open`: holds for the view, project and file targets; `{ url }` is partial** (B1, B2).
- **11, approval: holds.**
- **12, reading an app's files: holds.**
- **13, words and settings: holds.**
- **14, the measurements: holds** (P1 recount).
- **15, the look:** the orchestrator's, at landing. Section 6.3 lists what it must cover.

**Cases:**
- **Met by the green tables:** the G49, G50, G8, G9, G13 and G31 cases.
- **Partial under plan.md's Z600 text** (a listed input with no row): C4, C7, C11, C12, C20 (the space key's id in the manifest table and its header in the gate table), C31, C32, C35, C48, C53, C63, C65, C71 and C73.
- **Partial, from my runs:** C61 (B2) and C101 (B3).
- **C38 and C64:** met in the round-1 reviewer's live runs; round 2 did not touch that code.
- **C85:** open until A3 lands.

## 5. Z599 security, answered point by point

My run is `node rv2/url.mjs`, which calls `window.run.open` from inside the app and reads the Confirm.

| Address | Confirm `detail` | Outcome |
|---|---|---|
| 210 characters, no spaces | the whole text | `scrollWidth` 1080, `clientWidth` 480: runs past the box and off a 1400 px viewport (`rv2/url210.png`) |
| 1520 characters | the whole text | `scrollWidth` 9306, `clientWidth` 480 |
| `https://user:pw@...`, `https://:p@...` | no dialog | `closed` |
| `javascript:alert(1)`, `data:text/html,hi` | no dialog | `closed` |
| over 2048 characters | no dialog | `closed` |
| Cyrillic host `https://<Cyrillic e, U+0435>xample.org/` | `https://xn--xample-2of.org/` | punycode shown |
| `https://ex%61mple.org/` | `https://example.org/` | decoded host shown |
| a right-to-left override in the path | `https://example.org/%E2%80%AEgnp.exe` | percent-encoded |
| `http://localhost:8799/api/file/hub/README.md` | that address | asks |

- The page shows `parsed.href` and opens that same string, so what is shown is what is opened.
- `noopener` and `noreferrer` are set (`apps.svelte.ts:313`).
- The rate limit counts every `{ url }` call, including refused and declined ones, since `opens.take()` runs before the shape is judged.

**The bridge's link rule.**
- `ownAddress()` cuts the address after `/apps/<name>/<key>/`, or `/apps/@<root>/<name>/<key>/` for a root app. The URL parser folds `..` and `%2e%2e` segments, so a climb out of the app's folder becomes an outside address.
- A link to another oculus path is outside and goes through the Confirm. Opened by `window.open` from the page, such a tab is same-origin, so the request guard admits it.
- I read every GET route under `src/routes/api`. Each is a read; the two OAuth callbacks are already unguarded and are protected by their minted `state`.
- What such a tab shows reaches only the reader, never the app, because the tab has no opener.
- So the rule is sound once B1 and B2 are fixed.
- Gaps that end in `apps.load_failed`, as the brief allows:
  - SVG `xlink:href` links and `<area>` links;
  - a press before the handshake resolves;
  - a link whose click the app stops with `stopPropagation`.

## 6. Particular checks

### 6.1 Closures

- No check was removed in place of a fix, apart from the Z600 drops, which a ruling ordered.
- One fix reaches past its finding: `themes.css:1-8`'s head comment was reworded ("token values unchanged"). The wording is accurate, so this is not a defect.
- The two `.scratch` files that show modified in the worktree (`briefs/E4.md`, `spec.md`) are the orchestrator's no-breakage edits. They must stay out of the landing commit.

### 6.2 Z600: one sampled row per file

For each file, the dropped row and the row that still gives the same outcome by the same decision:
- **manifest:** `-x`, `@x`. The kept `Notes`, `a/b` and 41-character rows hit the same regex, `^[a-z][a-z0-9-]{0,39}$`.
- **app-files:** a link inside the folder. The kept "another path of no record" row gives the same 404; links are left out of the recorded list at scan time, and manifest row `:416` still covers that.
- **approve:** the G1 wrong token. The kept no-token row goes through the same `tokenedBody` comparison.
- **app-open:** `.ssh/id_ed25519`. The kept `.env` row hits the same dot-led segment clause. The parameter given twice is the same `once()` expression as absent (`routes.ts:134-137`, `all.length === 1`).
- **app-gate:** a kind header naming another open kind. The kept "body of another kind" row hits the same `named !== kind` clause (`app-gate.ts:120`).
- **methods:** `document`. It takes the same `unlisted` branch as the kept `terminal` row.
- **file.test.ts:** an app's script. It is in an apps folder, so `text/plain`, like the kept page row.
- **settings:** `closed_paths` not a list. Same `!Array.isArray` clause as the missing key (`settings.ts:362`).
- **app-store:** `view` given twice. The same `once()` as no view.

Every sample holds.

### 6.3 What Z593's look must check

Dark theme on TEST, then a light theme. Each line names the place to look:
- **Scrollbars:**
  - everywhere none is styled (only `Tabs`, `GlyphList`, `SuggestInput`, `HueSelect` and `RailList` style theirs): the Files tree, the editor, Markdown, Findings, History, Settings;
  - the terminal's scrollbar;
  - the scratch app frame's scrollbars.
- **Native controls:**
  - `ui/forms/Checkbox.svelte:53`;
  - `ui/forms/DateInput.svelte:31`, with its date picker opened;
  - `ui/forms/choice/Select.svelte:37`, with its dropdown opened;
  - `ui/forms/TextArea.svelte:79`;
  - the option box of `ui/controls/Confirm.svelte:58`;
  - the Calendar view (`Calendar.svelte:313` uses `color-scheme: inherit`).
- **Text inputs:** autofill backgrounds, caret and selection colours, and default focus rings.
- **The Document view** on a manual with no background or scheme of its own. By the same browser rule as B3 it should now draw on an opaque white backdrop in a dark theme; I inferred this and did not run it.
- **The File view's PDF frame.**
- **An app frame:** one with no `color-scheme` (opaque white in a dark theme, B3) and one that declares `light dark`.
- **The light themes on a Mac set to dark mode:** an app or manual that declares `light dark` renders dark (B3).

### 6.4 Tests and `guarded.md`

All added tables sit under the titles E4.md names. `guarded.md` does not yet name them by file and title: G49 (:36) and G50 (:100) point at E4.md, and G1 :9, G8 :42, G9 :45 and G31 :70 name none of E4's tests. This is landing work (Spec S2).

### 6.5 Breakage code

None.
- `grep -i -E "mutat|revert|inject|sabotag|stryker|\bfault\b|breakage|deliberately broken"` over every added line of the tracked diff and every untracked file printed nothing (9139 lines).
- Over the builder's scratch scripts, the one hit is a `MutationObserver` in `debug-open2.mjs`, which only counts removed frames.

## 7. Findings

### Spec

- **S1. Z600's text against round 2's item 7.**
  - plan.md:1332 says a table keeps every row with a different outcome, "the brief's case list being the least it holds".
  - Round 2's item 7 kept only the dropping half, and the builder followed the round brief.
  - These listed inputs no longer have a row (`grep` over the six files prints nothing for each):
    - C65: `.ssh/id_ed25519`, `.oculus/approvals.json`, `a/.git/config`, `/etc/hosts`;
    - C71: the binary file and the `.docx`;
    - C4: `-x`, `@x`;
    - C7: `.a/index.html`, `a//b.html`;
    - C12: `https://h.org/p`, `?q=1`, `ftp://h.org`;
    - C11: `rail`, `session`;
    - C20: the space key's id (manifest) and header (gate);
    - C31: another app's key;
    - C32: `%2e%2e`;
    - C35: POST and a foreign Host for the shared files;
    - C53 and C73: a parameter given twice;
    - C63: `document`, `file`, `source`, `project`;
    - C48: `Date`.
  - **Failure scenario:** a later change that, say, decodes the path before the segment rule has no row on the inputs E4.md chose to guard G49 with.
  - **Options:**
    - (a) Restore those inputs, as rows or as extra inputs in the rows that kept their sibling. About 25 inputs across manifest, app-files, app-open, app-gate, methods and app-store. Test-only, a medium landing fix.
    - (b) Accept the drops and record that E4.md's case list was narrowed. This is the lazy option.
  - **Recommendation:** (a), since plan.md's text of the ruling says so.
- **S2. Test titles for `guarded.md` at landing.** E4.md:247 still names the app-store title with "405". The landing writes G49's Test line (:36) with each file and title of section 6.4, G50's (:100) with store-cache, and these:
  - G1 :9: `approve.test.ts` 'refuses a request without the write token';
  - G8 :42: `tests/server/edit/app-store.test.ts` 'writes the store of an app as the app-store kind';
  - G9 :45:
    - `changes.test.ts` 'keeps the values of a record outside its line and deletes them when the record leaves the window';
    - `undo.test.ts` 'puts an app store back to the value before, and refuses it once the store has moved or the kept values are gone';
  - G31 :70: `approvals.test.ts` 'reads a file that is not JSON as no approved app and refuses an app approval or revoke over it'.

  Small: ledger text only.
- **S3. Sentences the code does not hold.**
  - DESIGN.md:327 says the Confirm "shows the whole address on its own line", and HELP.md:209 says "oculus shows ... the whole address". Both are false until B1 is fixed.
  - DESIGN.md:306, "The frame element paints nothing", is false in a dark theme for an app with no colour scheme (B3).
  - DESIGN.md:278 cites `+page.svelte:84-92`; the effect with its comment is :83-92.
  - The comment at `+page.svelte:83-85`, "a seed older than the rows already held is ignored", is half true (B5).
  - Small landing fixes, after B1, B3 and B5.

### Proof

- **P1. The Z593 run quote drops two columns** that `$S/runs/c101z.out` holds, `sameDocument` and `appSeesDark`. `appSeesDark` is `true` in "light" and "vscode-light-modern", which contradicts the report's reading that "a light theme [gives] normal for both" settles C101.
  - **Failure scenario:** the orchestrator accepts C101 from an edited quote that hides the defect.
  - Small: correct the report's quote when booking.
- **P2. The Z599 run read the Confirm's `detail` from the DOM**, its `textContent`, not from what the reader can see. That is how "the whole address on its own line" passed while a 210-character address runs off the screen (B1).
- **P3. The Z594 run covers only a press from the page into a frame.** Its row is reported DONE although a press from one frame into another fails (B4).

### Standards

- Nothing beyond Spec S2 and the two orchestrator files of section 6.1.
- My grep of round 2's added comments and test titles for the history words of `agents/spec.md:36` found only time-order "before".

### Behaviour

- **B1. The Confirm cuts off a long address.**
  - **Where:** `ui/controls/Confirm.svelte:97-102`. `.detail` has `white-space: pre-line` and no wrap rule; `.box` is `max-width: 30rem`.
  - **Run:** a 210-character address measures `scrollWidth` 1080 against `clientWidth` 480 and runs off the right edge of a 1400 px window (`rv2/url210.png`).
  - **Failure scenario:** an app builds `https://site/?q=<what it read>`. The reader sees the start of the address, confirms, and the data leaves in the part they never saw. This defeats Z599's stated guarantee.
  - **Fix:** `overflow-wrap: anywhere;` in `.detail`, one line. It also helps every other Confirm with a long detail. Small, landing fix.
- **B2. The Confirm takes the keyboard from the reader.**
  - **Where:** `ui/controls/Confirm.svelte:50`, `onopen={() => yes?.focus()}`.
  - **Run** (`node rv2/kj.mjs`): the reader types "ab" in the app's field; the app calls `open({ url: 'https://example.org/leak?d=secret' })`. The page's focus moves to `BUTTON "Confirm" in dialog: true`; the next Enter resolves the call and opens `https://example.org/leak?d=secret`.
  - **Failure scenario:** an app watches its own key presses and asks just before the reader presses Enter. The same applies to the write Confirms (`delete-entry` and the others).
  - **Fix options:**
    - (a) An app's question focuses Cancel. That is a `focus` prop on `Confirm.svelte`, passed through `views/shared/writes/AskConfirm.svelte:29-36` and `ask.ts`, set in `AppFrame.svelte:157-166`. About 10 lines.
    - (b) The Confirm button ignores presses for a moment after the dialog opens.
    - Leaving it is the lazy option.
  - **Recommendation:** (a). It changes which control holds the keyboard, which is a user-visible shape, so it is an automode decision. Small to medium at landing.
- **B3. Z593 does not reach the app's controls, and light themes follow the operating system.**
  - **Run** (`node rv2/cs.mjs` and `cs2.mjs`, a scratch app with a checkbox, a select and a text field):
    - **dark theme:** the frame's scheme is `dark`, the app's root scheme is `normal`, `appSeesDark` is true, and the app is drawn on an opaque white backdrop with light controls (`rv2/cs-dark.png`). The light theme leaves the backdrop transparent (`cs-light.png`).
    - **light theme:** the frame's scheme is `normal` and `appSeesDark` is `true`. With the frame set to `light`, `appSeesDark` is `false`, so Chrome hands the frame element's scheme to the app's `prefers-color-scheme`.
    - **an app that sets `light dark` in a dark theme:** dark controls and white text.
  - **Failure scenarios:**
    - In every dark theme an app with no scheme of its own shows a white slab with light controls, so the defect Z593 names stays.
    - On a Mac in dark mode, an app or manual that follows `prefers-color-scheme` draws dark inside a light oculus theme.
  - **Fix:**
    - `color-scheme: light` on the base `body` rule at `themes/tokens.css:218`. This goes against round 2's item 2 ("the light ones get none"), so it needs a ruling.
    - `oculus.js` `paint()` (:56-62) sets `root.style.colorScheme = 'light dark'`, so an app follows the frame unless it sets its own scheme. Visible to app authors, so it needs a ruling.
    - DESIGN.md:306 says both.
  - Small at landing, two lines and a sentence, once ruled.
- **B4. A press in one frame after another does not move the active pane.**
  - **Where:** `workbench-keys.svelte.ts:439-448` hears only the window's `blur`, which does not fire when the focus moves from one frame to another.
  - **Run** (`node rv2/ff.mjs`, two app frames in two panes): a press in Probe zed activates its pane. A following press in Probe scheme moves `document.activeElement` to that iframe, but the active pane stays Probe zed.
  - **Failure scenario:** an app beside a manual or another app. The reader works in the second frame while the pane chords act on the first.
  - **Fix:** in `FrameLayer.svelte`'s animation-frame loop (:64-99), compare `document.activeElement` with the last one seen and raise the same `focusin` on the new frame's slot. About 8 lines. Small, landing fix.
- **B5. The second effect can register rows older than the ones held.**
  - **Where:** `+page.svelte:86-92`. When `seedApps` drops a seed older than the held rows (`entities.svelte.ts:40`), the effect still calls `registerApps(client.registry, rows)` with the load's rows. The registry then shows them until the next `apps` push.
  - **Failure scenario:** the window between a load and a newer push. It is narrow and the next push repairs it.
  - **Fix:** call `registerApps(client.registry, appRows())` after the seed. One line, small.

## 8. Declined to judge

- **The Document view and PDF frames in a dark theme.** I inferred them from the app-frame run and did not run them; they are for the look.
- **A frame in a floating window.**
- **Axel's server and TEST.** I did not touch them.
- **M1 to M3 reruns.** I read the builder's outputs and recounted only M4.
- **The curl-dependent cases.** The task forbids curl; where a table holds one, the table covers it.
- **The look of every theme.**
- **`npm run diagrams`.** It writes files; the tree checks passed.
- **Round 2's delta alone.** No snapshot of round 1 exists, so I judged round 2's files against the base.

## 9. Usage

claude-opus-5-5. My token count is not visible to me: about 330,000, not verified.

## Closed

Every finding of the run over round 2, the last round, is fixed at E4's landing on main, since each is small and inside the brief; none goes to the builder.

- S1: the 14 cases' inputs restored to their tables (Z602).
- S2: `guarded.md` names E4's tests by file and title for G1, G8, G9, G31, G49 and G50; E4.md:247's title follows Z601.
- S3: DESIGN.md:278, :306 and :327, HELP.md:209 and the comment at `+page.svelte:83-85` made true after B1, B3 and B5.
- P1: the booking quotes `c101z.out` whole, `appSeesDark` included; C101 is judged on the run after B3's fix.
- P2: the run after B1's fix measures the Confirm's detail as drawn (`scrollWidth` against `clientWidth`).
- P3: the run after B4's fix covers a press from one frame into another.
- B1: `overflow-wrap: anywhere` on the Confirm's detail.
- B2: an app's Confirm opens with the keyboard on Cancel (Z603).
- B3: `color-scheme: light` on the base body and `light dark` on an app's root from `oculus.js` (Z604).
- B4: `FrameLayer.svelte`'s frame loop raises `focusin` on the slot of a frame that newly holds the focus.
- B5: the second effect registers `appRows()` after the seed.
