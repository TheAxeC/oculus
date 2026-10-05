# E4 refuter report

E4 review (refute), worktree /Users/axelfaes/workspace/research-hub/.agents/worktrees/E4, base ba20f682b. I made no edits to the worktree, the main checkout or the ledger, and invoked no skill or agent. Scratch files are in my scratchpad only. The one headless Chrome I ran used a scratch profile under my scratchpad. It was stopped and the profile removed: the follow-up `ps` shows no Chrome process and `ls -a` of that folder lists only `x.html`. I sent no curl and touched neither port 8787 nor 8790.

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
- **What is wrong:** These are a user-visible vocabulary the brief does not name. `git show ba20f682b:tools/oculus/DESIGN.md | grep -c list_shape` gives 0, and `grep -c 'list_shape\|file_unreadable' E4-report.md` gives 0. The rules require no silent design decision.
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

**Lines added:** 2484 in new test files (`cat ... | wc -l`) plus 345 in changed test files (`git diff --numstat ba20f682b -- tests`: added 345, deleted 20). That is 2829 added test lines.

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
