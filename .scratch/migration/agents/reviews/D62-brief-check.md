# Step D62 brief check (on main at 93b91637a)

This checks the working copy of `tools/oculus/.scratch/migration/agents/briefs/D62.md` (263 lines, untracked: `git status --short tools/oculus/.scratch/` prints `?? .../briefs/D62.md`). Nothing was written or edited. Every git command was read-only. `local.yml` was excluded from every grep.

**Summary.** The brief should not be dispatched as it stands. Five findings are blocking:

1. The step line's part (4), `open({ file })` opening the way the Files view does (a PDF in the PDF viewer), has no item in "What to build".
2. The split of the server's apps folder in item 14 breaks the imports of 13 files outside the paths, two of them D60's.
3. The host's store write and the server-side refusals for a disabled app live in `src/lib/server/edit/writes/apps/`, which is outside the paths.
4. A host file can import files the approval hash never covered, so code that was never approved can run.
5. Nothing fixes the content type of the file-read route under the app's address. An `.html` or `.svg` file from the hub could be drawn as a document on oculus's own origin, outside the sandbox.

Further:

- Several user-visible choices have no ruling.
- Open item 46 is not booked anywhere: `grep -n 'item 46' plan.md orchestrator-state.md` prints nothing, and the state file's Open items section says "None."

## 1. Names

- **Keep approved for root apps.**
  - Command: `git grep -n -i 'machine apps only\|keep_approved\|keep approved' -- . ':!**/local.yml' ':!.scratch'`, plus `git grep -n keep -- tests/routes/apps ...`.
  - Each hit the change makes false is inside the paths:
    - DESIGN.md:417
    - docs/apps.md:50 and docs/apps.md:345 ("use Keep approved while I edit for a machine app you are editing")
    - HELP.md:389 ("a root app cannot be kept"), in the apps part
    - the routes.ts:99 comment
    - `tests/routes/apps/approve.test.ts:133` ('a machine app kept on request, and a root app refused the keep')
  - Item 13 names only DESIGN 417, so HELP.md:389 and docs/apps.md:345 should be added to its list.
- **`open` as source text.** Command: `grep -n 'source text\|as source' DESIGN.md docs/apps.md HELP.md README.md`, and a sentence split of DESIGN.md lines 405 and 407.
  - Hits: DESIGN.md:399, DESIGN.md:405 ("open in the source tab as source text, as every file `open` names does"), DESIGN.md:407 ("the page opens the source tab only on `ok`"), docs/apps.md:196 and docs/apps.md:259. All are in the paths.
  - Item 13 names 399 and 405 but not 407, and 407 becomes false.
- **"No process and no server code".** Command: `git grep -n -i 'no process\|server code\|starts no program\|no program started'`.
  - DESIGN.md:421 and docs/apps.md:196 and :259 are in the paths.
  - `src/lib/views/system/machine/processes/Processes.svelte:20` ("the view signals no process itself") is in the paths. Its head comment must be rewritten once Stop and Restart of hosts are added.
- **Rate limits.** Command: `git grep -n -i 'writes_per_min\|opens_per_min\|per frame'`. Hits outside the paths that the change makes false:
  - `config/behavior.yml:304`: "Writes, `setStore` included, that pass per frame per minute." Item 5 counts host store updates per host.
  - `config/behavior.yml:306`: "Calls of `open` that pass per frame per minute." Decision 6 counts `commands.run` too.
  - `config/catalogs/options.yml:939` and `:947`: the Settings help, with the same two sentences.
  - docs/apps.md:215, :248 and :249 are in the paths and also become false.
- **The Processes view and the new channel.** Command: `git grep -n -i 'processes' -- HELP.md README.md docs DESIGN.md config/text`. Hits outside the paths:
  - `HELP.md:213`: the `processes` row, "What oculus started itself in tmux and the local processes the configured patterns match." It becomes false once app hosts are listed.
  - `HELP.md:250`: "Processes: a process is listed when its program ... Stop on a terminal's row asks first". This leaves out the hosts' group, output, Stop and Restart.
  - `DESIGN.md:122`: the channel list of the socket. It needs the new host-rows channel, and line 122 is outside the brief's DESIGN ranges.
  - docs/apps.md:115 and :265 (the closed channels) and `config/text/findings.yml:255` (the reason a closed channel carries) are in the paths.
- **The runtime dependencies.** `README.md:15` lists every runtime dependency with its licence and its use. It lacks `@napi-rs/keyring`. Its `vscode-jsonrpc` entry, "frames the messages between the relay and a language server", becomes incomplete. README.md is outside the paths.
- **The split of `src/lib/server/machine/apps/` (item 14).** Command: `git grep -l "machine/apps/" -- src tests | grep -v '^src/lib/server/machine/apps/'`. These importers are outside the paths, and moving a file breaks each of them:
  - `src/lib/server/edit/writes.ts:46-47`. This is a D60 path.
  - `src/lib/server/edit/writes/apps/gate.ts:21-22`
  - `src/lib/server/edit/writes/apps/store.ts:19-20`
  - `src/lib/server/edit/writes/hubs.ts:17`. This is a D60 path, and D60 changes hubs.ts:16, the adjacent line.
  - `src/lib/server/edit/writes/undo.ts:24`
  - `src/lib/server/root/watch/own-schemas.ts:14` (the `appShape` import that the editor's JSON Schema of item 1 depends on)
  - `src/routes/+page.server.ts:2`
  - `tests/routes/edit/app-gate.test.ts:14`
  - `tests/server/edit/app-store.test.ts:13`
  - `tests/server/root/context-fixture.ts:8`
  - The paths `src/routes/api/(apps)/...`, `src/routes/apps/...`, `tests/routes/apps/...`, `tests/server/machine/apps/...` and `src/lib/server/root/watch/apps.ts` are inside the paths.
- **The names `files` and `AppRow`.** `src/lib/data/model/index.ts:280` already holds `files: number;` (the count of recorded files), set at `scan.ts:165`. Item 1 says "`AppRow` carries the new keys' values" (brief line 40). A `files` field for the manifest key collides with it. `files` is also an open channel (`src/lib/data/helpers/files/apps.ts:78`, `words.ts:17` `apps.read.files`).
- **`appShape` keys and the method and handler counts.** `docs/apps.md:24` ("the nine keys"), :66 and :78, `methods.ts:1` and :171, `tests/state/system/apps/methods.test.ts:1` and `oculus.js:11` all become false. All are inside the paths.
- **`appPolicy` and `script-src`.** `DESIGN.md:345` (the literal policy) and `tests/routes/apps/app-files.test.ts:81` (``includes(`script-src ${base} `)``) are inside the paths. DESIGN.md:345 is not named in item 13's list.
- **`CLOSED_CHANNELS`.** `src/lib/data/helpers/files/apps.ts:84` and `:99` are in the paths, and the finding words are at `config/text/findings.yml:255`. No hit outside the paths.
- **The approvals file and `approveApp`/`revokeApp`.** `src/lib/server/machine/approvals/approvals.ts:289`, :302 and :323 are in the paths. No other caller changes.

Findings:

1. Brief line 87 (item 14) and lines 152-180 (the paths). The split of the apps folder rewrites the imports of the ten files listed above, which are outside the paths. Two of them are D60's: writes.ts, and hubs.ts:17, whose hunk sits next to D60's hubs.ts:16 hunk. Change: either keep `held.ts`, `store.ts` and `manifest.ts` at their current paths and move only files nothing outside imports, or add the importers to the paths and record the hubs.ts adjacency in `shared_paths`.
2. Lines 152-180. `config/behavior.yml:304` and `:306` and `config/catalogs/options.yml:939` and `:947` become false through decision 6 and item 5's "per host". Add them to the paths, or keep the per-frame meaning and give the host its own count.
3. Lines 152-180 and item 13 (line 85). `HELP.md:213`, `HELP.md:250`, `DESIGN.md:122` and `README.md:15` become false or incomplete and are outside the paths. None of them is a D60 or D61 hunk: D60 changes HELP 169 and 452, D61 changes HELP 35, 58, 83 and 219. Add them to the paths.
4. Line 85 (item 13). Name DESIGN.md:345 and :407, docs/apps.md:345 and HELP.md:389 among the sentences to rewrite.
5. Line 40. Name the `AppRow` field for the manifest's `files` (for example `fileFolders`), since `AppRow.files` already holds a number (index.ts:280).

## 2. The step line

The step line is plan.md:747, with Step 0 bullets at plan.md:748-752. The rulings are at plan.md:1718 and 1732-1738.

- **(1) The host script, run as a process after the reader approved its exact files, asking again after a change or a `git pull`.** Covered by item 5 Start, item 5 "Only approved code runs", and item 3.
  - "Exact files" is not met. A host can `import` files outside the recorded set: a dot-led file, a link, `../x.js`, or a `node_modules` above the folder. `record.ts:3-5` leaves links and dot-led files out of the hash.
  - See section 6, item 1.
- **(1) The protocol between the host, the frame and oculus.** Covered by item 7 (host side) and item 9 (frame side).
- **(1) File read and write, processes, network, watchers, state and secret storage through the host.** The host has these natively (item 5), and the store and secrets through items 5 and 8. Item 13 does not say that docs/apps.md tells an app builder the host does file writes, processes, network and watchers with Node's own modules.
- **(1) The keyring: `@napi-rs/keyring` 2.1.0.** Covered by item 8. `npm view @napi-rs/keyring@2.1.0` printed version 2.1.0 and license MIT. Its `index.d.ts` from the tarball has `setSecret(Uint8Array)`, `getSecret()`, `deleteCredential()`, `EntryOptions.linux.store: 'secret-service' | 'keyutils'` and `findCredentials(service)`.
- **(2) Scoped reads from the frame.** Covered by items 1 and 9.
- **(2) "The panel saying when an app both reads files and has `connects`".** No requirement. Item 2 (line 42) lists the host warning, the `files` folders, "stores secrets" and `depends`. It never says that an app holding `files`, or a root app (which reads its own root), that also has `connects` gets that sentence.
- **(2) App commands.** Covered by item 9's `commands.run`.
- **(3) WebAssembly.** Covered by item 4.
- **(4) `open({ file })` opening a file as the Files view does, a PDF in oculus's PDF viewer.** No item of "What to build":
  - only premise line 18, item 13's documents and case 29 mention it;
  - the code to change is `src/lib/state/system/apps/apps.svelte.ts:324-326` (`openFile` always opens `'source'`);
  - `tabForKind` sits in `state/workbench`, above `state/system` in `tests/checks/imports/order.ts:60-70`, so the apps store cannot import it. The tab choice has to come in through the view's `MountOptions` (the views layer may import `$lib/state/workbench/layout`) or through a new `AppsDeps` member set in `state/client/context.ts`.
- **(5) Keep for root apps, and the documents.** Covered by items 3 and 13.
- **Ruling 40** (secrets deleted on Remove, the count in the question). Covered by item 12, Remove.
- **Ruling 41.** Covered by item 8. Line 66 cites "44 (7)", but ruling 44 has six parts; the UTF-8 and bytes rule is ruling 42 (7).
- **Ruling 42 (1)-(5), (7).** Covered by items 1, 5, 7, 8 and 9.
- **Ruling 43 (the protocol designed against every row of D63 and D64).** Partly met; see below.
- **Ruling 44 (1)-(6).** Covered by items 5 and 9.
- **Rulings "Apps enable and disable" and 45 (1)-(5).** Covered by items 6, 11 and 12, with 45 (1) and (4) held back as open item 46.

**Ruling 43 against D63 and D64.** D63's line is plan.md:753, D64's plan.md:754, and the inventory is plan.md:1718. Rows the item 7 table cannot carry without a new method or a changed meaning:

- **A host telling oculus that a registered contribution changed.** Needed for:
  - a status bar item's text or tooltip;
  - a tree view's refresh (VS Code's `onDidChangeTreeData`);
  - source control resource groups changing;
  - `onDidChangeFileDecorations`.

  The table has `oculus/register` and `oculus/unregister` and no update or changed notification, and it does not say whether a second `register` with the same id updates the contribution.
- **A host reading a declared setting** (`getConfiguration`). Needed for D63's "settings shown in the Settings view". `oculus/event` covers a change, but no host-to-oculus read exists.
- **How a host subscribes to the events `oculus/event` delivers.** No subscribe method, and `register` with an event kind is not stated.
- **A host running a command** (`commands.executeCommand`), part of the inventory's "commands" row. Not in the table.
- **The terminal stream's resize and control messages.** `oculus/stream/data` carries bytes or messages, but resize for a terminal a host runs (D64) is not stated.
- **The page protocol.** Ruling 43 says "host and page protocol". D63's step line says "its host or frame drives". The brief writes no page-side (penpal) table for D63 and D64:
  - quick pick, input box, notifications and progress from a frame;
  - a contribution registered by a frame;
  - a custom editor frame loading and saving its document (the frame has no `fs.writeFile`);
  - view visibility events.

Findings:

1. Line 42 (item 2). Add: "an app that reads files (a machine app with `files`, or any root app) and has `connects` is told so on the panel, in plain words from `apps.yml`".
2. "What to build" lacks the step line's part (4). Add an item that has `open({ file })` choose the tab as the Files view does. The kind comes from `fileType` and `tabForKind`, and `holds` keeps apps-folder files as source. Say which side wires it, either `MountOptions` from `src/lib/views/apps/frame/` or an `AppsDeps` member. The first stays inside the paths, the second needs `state/client/context.ts` around line 791-802, which D60's hunks (lines 23-296) do not touch.
3. Line 60-64 (item 7). Add these to the DESIGN table:
   - a host-to-oculus contribution update or change notification;
   - a host-to-oculus settings read;
   - a host-to-oculus subscribe;
   - a host-to-oculus command execution;
   - stream control (resize);
   - a page-side table of the frame methods D63 and D64 need.

   Otherwise D63 and D64 must change the protocol's meaning, against ruling 43.
4. Line 66. "44 (7)" should be "42 (7)".

## 3. Premises

| Line | Brief says | Command | Now |
|---|---|---|---|
| 13 | 10 items, line counts | `ls ... \| wc -l`, `wc -l` | 10; 114/59/363/150/131/95/173/250/156/106: holds |
| 14 | 8 files, counts | `wc -l src/lib/state/system/apps/*` | 429/123/42/30/323/137/137/75: holds |
| 15 | appShape 59-73, key_unknown 276-278, head 3-5 | `sed -n` | holds |
| 16 | penpal :104, methods 92-102, oculus.js 123-134 and :115, bridge 18-22 | `grep -n` | holds |
| 17 | appPolicy 88-103, :93, .wasm :44 | `sed -n` | holds (`fileHeaders` also sends `access-control-allow-origin: *`, address.ts:112) |
| 18 | methods.ts:258-313, apps.md:196, tabForKind 140-154, file-type 24,61 | `sed -n` | holds |
| 19 | routes.ts:123, scan.ts:148, DESIGN 417, apps.md:50 | `sed -n` | holds |
| 20 | approvals 357 lines; 302, 323, 289 | `wc`, `grep -n` | holds |
| 21 | run.ts:100; pty/routes.ts:448 calls `runCommand` | `grep -n` | run.ts:100 holds. routes.ts:448 is `if (message.action === 'command')`, and :449 calls `startCommand` (run.ts:150), which calls `runCommand` at run.ts:154 |
| 22 | context.ts:266, servers.ts:303; "under the desktop app it runs as Node with `ELECTRON_RUN_AS_NODE=1` (build.ts:22-24)"; 872 lines | `sed -n`, `git grep -n RUN_AS_NODE` | First two and the line count hold. build.ts:22-24 is the desktop's `vite build` spawn. The server under the desktop app is an Electron `utilityProcess` (`src/desktop/server/process.ts:77`). The only `ELECTRON_RUN_AS_NODE` in `src` is build.ts:24, so no process the server spawns (language servers, the ESLint child) sets it |
| 23 | jsonrpc :117, trash :113, ops.ts:50, picomatch :105, napi 0 | `grep -n`, `grep -c` | holds |
| 24 | picker route; picker.ts:27, :159 | `ls`, `sed -n` | holds (:27 is the head comment, :159 the code) |
| 25 | Processes 106, ProcessTable 190, head comment | `wc`, `sed` | holds |
| 26 | Catalogue 329, 9 items, apps.yml 74 | `wc`, `ls \| wc -l` | holds (D61 adds `Workbenches.svelte` there, which makes 10) |
| 27 | index.ts 269-295, 673 lines | `grep -n`, `wc` | holds; `AppRow.files: number` at :280 is not mentioned |
| 28 | roots.ts:1-14 | `sed -n` | holds |

Findings:

1. Line 22. The desktop premise is wrong as cited. Replace it with: the server under the desktop app is a `utilityProcess` (`process.ts:77`, README.md:9); no spawn in the server sets `ELECTRON_RUN_AS_NODE` (`git grep -n RUN_AS_NODE` hits only build.ts:24). Add a quoted run that starts the runner under Electron's own binary with the variable set, since case 7 checks only the argument array.
2. Line 21. Write "`startCommand` (run.ts:150), which the terminal route's `command` action calls at pty/routes.ts:449, calls `runCommand` at run.ts:154".
3. Lines 11-28 omit a premise that decides the design:
   - The tree already runs a Node child of oculus's own text under `process.execPath`: `src/lib/server/machine/runs/lint/eslint-child.mjs`, started at `eslint.ts:45` as `join(ownFolder(), 'src/lib/server/machine/runs/lint/eslint-child.mjs')`.
   - Its head comment says it "must start the same way from `vite dev`, from the built server and from the desktop app". It sends the plugins' standard output to standard error and ends when its standard input closes.
   - Decision 10's reason (line 193, "an adapter-node build has no `src` on disk") is contradicted by that file. `ownFolder()` (servers.ts:401) walks up to the checkout's `package.json`, and the desktop forks `join(checkout, 'src', 'server.ts')` (app.ts:225).
   - Add the premise, add `eslint.ts` and `eslint-child.mjs` to "Read", and rewrite decision 10, or drop it and run the runner from the tree as the ESLint child is run (spec.md, "The principles": reuse what exists).
4. Line 27 omits `files: number` at index.ts:280; see Names, finding 5.

## 4. Cases and checks

- Cases 1-6 (the manifest). Consistent with G49's text, a manifest refused before approval.
- Cases 7-19 (the host). The header at line 106 says "the host manager's tests under G49 and G7".
  - Case 7 fits G7's text, a value passed as an argument.
  - Case 8 fits G49 ("an app reaches only what its approval names"), and in kind G55, which the brief does not name.
  - Cases 9-19 cover lifecycle, output, protocol, store, dependencies and activation. No entry's text covers them. G36, the analogue for language servers, is specific to language servers.
  - spec.md ("What every package obeys": "A test exists only as the test of one entry ... A step that needs a new entry stops and asks Axel") forbids tests for them without a new entry.
- Case 9, "the process ends within 7 seconds". This is a wall-clock margin, against spec.md ("A test waits on a signal ..., never on a fixed sleep or a wall-clock margin; a check that something did not happen advances a fake clock past the deadline").
- Case 10, "not started again". A non-occurrence; it needs a fake clock under the same rule.
- Cases 20-31, header line 121, "G1 for each new route".
  - The file-read route under `/apps/<name>/<key>/<dot segment>/` is requested by the frame, which holds no write token.
  - G1 ("refuses a request without the page's token") cannot apply to it. Its guard is the address key (G49).
- Case 20 against case 24, both on a path with a dot-led segment. Case 20 wants `'projects/.git/config'` to answer `closed`; case 24 wants "a path with a dot-led segment: the empty 404". One input, two results.
- Case 22, "the page's memory never holds them". Not checkable at unit level, and spec.md ("A behaviour that needs a DOM ... is seen at the look") gives no unit form. A case the route can be held to is "answers a file stream, never a buffered body", plus a look.
- Case 31. The policy-string assertion follows the existing G49 test (`app-files.test.ts:81`). The compile itself is only seen at the look.
- Cases 32-35. Consistent with G31, G10 and G1, but:
  - G31's text names its record files ("The saved commands, approvals, workspaces, notes order, session overrides and schedule record files") and its Code line; `~/.oculus/apps.json` is neither;
  - G10's Code line is the ops route, `ops.ts` and `file-changes.ts`, and Remove is a new unit there.
- Case 29, second half (an apps-folder file as source text). It checks behaviour of `tabForKind`, which the step does not change, but it goes through the changed wiring. Acceptable.
- Verify list.
  - Item 1, `npm run test:quick`, matches the state file's `verify:` block.
  - Item 2 uses `LC_ALL=C grep -n '[^ -~]'`. spec.md's paragraph "The ASCII gate" says the perl form "replaces the `grep '[^ -~]'` form wherever a brief or a check names it".
  - spec.md "Where you work" requires the brief to name the worktree and the base copy. D62 names neither. D61's brief does, at its line 7.
  - Item 4's base path (`.../scratchpad/D62-base/...`) is the orchestrator's session scratchpad, not `.agents/worktrees/D62-base` as for D60 and D61, and it does not exist yet (`ls` prints "No such file or directory").

Findings:

1. Line 106. Say per case which are kept tests and under which entry:
   - case 7 under G7, case 8 under G49;
   - cases 9-19 as quoted runs;
   - or raise an open item for a new entry ("an app's host runs only from its approved, enabled, unchanged files and ends with them and with the server") as spec.md requires.
2. Line 107 (case 9) and line 110 (case 10). Replace "within 7 seconds" and "not started again" with fake-clock forms: "after the fake clock passes 5 s then 2 s, SIGTERM then SIGKILL were sent and the child's exit event fired", and "with the clock advanced past any restart delay, the spawn count stays 1".
3. Line 121. Say "G1 for the secrets, host-request, commands and management routes; the file-read route under the app address is keyed by the address key (G49) and takes no token".
4. Lines 122 and 126. Settle the dot-led case. For example, case 24 is "a dot-led segment in the address part before the root key", and case 20's in-path `.git` answers `closed`.
5. Line 124 (case 22). Restate it as "the route's answer is a stream of the file, read in chunks; the page method never fetches the route", with the look naming the 300 MB read.
6. Lines 135-139. Name the entry text each management test extends (`apps.json` in G31's list, Remove as a G10 unit), or raise them with finding 1.
7. Line 238 (verify item 2). Use the perl ASCII gate of spec.md "The ASCII gate".
8. Line 233. Add "You work in the worktree `.agents/worktrees/D62`; the base copy is `.agents/worktrees/D62-base/tools/oculus/`", and point verify item 4 at that base copy.

## 5. The question

Could each pass without the goal being reached?

- **Cases 1-6.** No.
- **Case 7.** Yes. A fake spawn passes while the real `process.execPath` inside the desktop app's utility process does not start the runner. Nothing runs the runner under Electron.
- **Case 8.** Yes. It passes while an approved host imports a dot-led file, a linked file or a `../` file that the hash never covered, so unapproved code runs and changes without asking.
- **Case 9.** Yes. A graceful close passes while a server killed by SIGKILL, or a lost desktop utility process, leaves every host running. The runner is never told to end when its standard input closes, which `eslint-child.mjs` does.
- **Cases 10-14.** No.
- **Case 15.** Yes. It passes while a host `update` racing a frame `setStore` loses one write: a read-modify-write with no serialisation per store file.
- **Case 16.** No.
- **Case 17.** No.
- **Cases 18-19.** No.
- **Case 20.** No, if run against the route. Yes, if run against a page-side check alone, since the frame fetches the route directly. Name the route's test.
- **Case 22.** Yes, as written (see section 4).
- **Cases 23-24.** No.
- **Case 25.** Yes. It passes while a command the reader saved through the form (`source: 'saved'`, which `runCommand` runs without a question, run.ts:125-126) is started by an app with no question. The case uses a `commands.yml` command only.
- **Cases 26-27.** No.
- **Case 28.** Yes. A fake keyring passes while the real N-API module fails to load in the built server or under Electron. No quoted run uses the real module.
- **Case 29.** Yes. `methods.test.ts` uses a fake `openFile`, so it passes while `apps.svelte.ts:324-326` still opens `'source'`.
- **Case 30.** No.
- **Case 31.** Yes. The string passes while no app can compile wasm. It is only proved at the look.
- **Cases 32, 34 and 35.** No.
- **Case 33.** No, but the result chosen fails open: a disabled app comes back enabled and its host starts when the file is damaged.
- **Step line check.** Yes, for parts (2)-panel and (4); see section 2.
- **Item 1.** No.
- **Item 2.** Yes: the files-plus-`connects` sentence is missing.
- **Item 3.** No.
- **Item 4.** As case 31.
- **Item 5.** Yes, for "Only approved code runs" (the imports and the time between the hash check and `import()`) and for Stop (a crash).
- **Item 6.** No.
- **Item 7.** Yes. The table can be written while D63 and D64 still need new semantics (section 2).
- **Item 8.** Yes, as case 28.
- **Item 9 (fs).** Yes. The route can serve `.html` typed and unsandboxed (section 6, item 2).
- **Item 9 (`commands.run`).** Yes, as case 25.
- **Item 10.** No.
- **Item 11.** No.
- **Item 12 (Disable).** Its server list omits the write gate and the store route (`edit/writes/apps/gate.ts`, `store.ts`), which are outside the paths. It passes while a disabled app's write would land, though no frame is drawn.
- **Item 12 (Remove).** Yes. It passes with the keyring unavailable, leaving the secrets orphaned.
- **Item 12 (Add).** Yes. A 10 GB folder is copied whole.
- **Item 13.** No, apart from the missed lines in section 1.
- **Item 14.** No.

Findings: each "yes" above. The changes to the brief are in sections 4 and 6.

## 6. Implied inputs

None of the following is stated under "Cases". Each has the expected result it should have.

1. **A host importing a file outside its recorded files.** Examples: `import './.lib/x.js'`, a link, `../x.js`, a `node_modules` above the app folder, or a file changed between the hash check and `import()`. Expected: the runner registers a Node module resolve or load hook that refuses any `file:` URL not among the recorded files of the approved hash, and the hash is taken again right before the spawn. Otherwise "exact files" (step line (1)) does not hold.
2. **A URL of the file-read route for an `.html` or `.svg` file of a root, opened as a document.** This can happen by the frame navigating itself (same origin, so `frame-src 'self'` allows it), by a link, or by a direct visit. Expected: served as `application/octet-stream` with `nosniff` and the app's `sandbox` policy, never typed. A typed answer runs hub HTML unsandboxed on oculus's origin, where the page's write token is in reach (compare DESIGN.md:419 for apps-folder files, and G5).
3. **The server killed (SIGKILL) or the desktop utility process lost while hosts run.** Expected: each runner ends when its standard input closes, as `eslint-child.mjs` does. No host is left running.
4. **The server context recreated by a dev hot reload while hosts run.** Expected: the old manager's hosts are stopped, and no host runs twice.
5. **Two activation events at once** (two tabs drawn together, `onTab` with `onLanguage`), and an activation during the 5 s or 2 s stop. Expected: one process; an activation during a stop starts one host after the old one has exited.
6. **A `host.request` or `apps.call` in flight when the host stops.** Expected: it rejects `failed:0`. A tab closed with a request in flight never settles, as `never()` does (methods.ts).
7. **A host flooding.** Expected:
   - megabytes on standard error keep only the last 1000 lines and 256 KB, with bounded server memory;
   - `sendToPage` called thousands of times a second is rate-limited or dropped, since nothing counts it;
   - a native write to file descriptor 1 that bypasses the redirection corrupts the stream, so the host is stopped with a line naming the broken stream.
8. **A host `update` and a frame `setStore` at the same moment.** Expected: writes are serialised per store file, so both land. The push keeps G50 (no tab receives a store value older than one it has seen).
9. **The keyring unavailable during Remove, or `secrets.get` and `delete` with no store.** Expected: Remove says so in its question and refuses, or removes the app while telling the reader the secrets remain. `get` and `delete` reject with the same line as `store`.
10. **`secrets.get` of an absent key, and the refusal word for a bad key or a value over 2048 bytes.** Expected: `undefined`, and a named word (for example `too_large` for size, `refused:<reason>` for the key). Case 26 says only "refused".
11. **Counting an app's secrets for the Remove question.** `findCredentials(service)` returns each secret's value (`index.d.ts`: `Credential { account, password }`). Expected: values are discarded at once, never logged, and the count is taken without a pinned Linux store, since `findCredentials` takes no options.
12. **Empty, duplicated and colliding keys and ids**, which spec.md ("What every package obeys": "Every id or key a step introduces is checked empty, duplicated, and colliding") and orchestrator-state.md (the "Briefs and repair briefs" demand) require as acceptance items. Expected:
    - `files` holding one entry twice, or `hub` beside `hub/projects`: one finding, or both kept by a stated rule;
    - `store.update('')`;
    - `onRequest` with method `''`;
    - `apps.get('')`;
    - the new channel's name against the existing channel names;
    - a `workspaceContains:` glob holding `..` or an absolute path: refused, or never matching outside the root.
13. **Add from a folder over `apps.max_files` or `max_mb`, or holding a link loop.** Expected: refused `too_large` before any byte is copied. The same for the apps folder inside the chosen folder, or the chosen folder inside the apps folder: refused, nothing copied.
14. **Add whose copy is cut short** (a full disk). Expected: the copy is made in a temporary folder and renamed, so no partial app folder is ever scanned.
15. **Add with a name that a refused folder or a plain folder already holds** in the apps folder. Case 35 covers only "a name a machine app holds". Expected: refused and nothing overwritten.
16. **Remove of a machine app whose folder entry is a link.** Expected: the link goes to the trash, never its target, as `ops.ts`'s head comment says of a trash.
17. **A dependency disabled, revoked or removed while a depending host runs.** Expected: a stated result, either the dependent's `apps.get` calls reject `failed:0` or the dependent stops too.
18. **`commands.run(name)` naming a command saved through the form** (`source: 'saved'`, which runs without a question). Expected: `missing`, since only the root's `commands.yml` is named.
19. **Approve offered on the tab or Processes row of a kept app waiting on changed files** (line 50). Expected: Approve opens the approval panel showing the hash, never approves directly. G49: "an approval is taken only for the hash the reader was shown".
20. **`~/.oculus/apps.json` written by two Disables at once.** Expected: both land (a lock, or one queue).
21. **A root key renamed.** The secrets service is `oculus-app:<view id>`, and a root app's view id holds its root key. Expected: a stated result (the secrets orphaned, or moved).
22. **A FIFO, socket or device file given to `readFile`, or a folder of a million entries given to `readDirectory`.** Expected: refused without opening the FIFO (no hang), and a cap on the entries listed.

Findings: items 1-22 above are missing from "Cases". Items 1, 2, 3, 8 and 18 carry a security or data-loss cost and belong in "What to build" as well.

## 7. ADRs

- `ls tools/oculus/docs/adr` prints "No such file or directory". No record.

Findings: none.

## 8. Dictated text

Command: `grep -n 'stores secrets\|Disable (Workspace)\|Add app from folder\|Restart\|oculus-app:\|version: 1' D62.md`. `LC_ALL=C grep -n '[^ -~]' D62.md` prints nothing.

- "stores secrets" (line 42): holds. These are ruling 41's words.
- "Disable", "Disable (Workspace)", "Enable", "Enable (Workspace)" (line 81): hold. These are ruling 45's words.
- "Add app from folder" (lines 83, 139, 194): holds. Ruling 45.
- "Restart" (lines 55, 110), "Stop" (line 54), "Remove" (line 82), "Approve" (line 50): hold. These are labels from rulings 44 and 45.
- `{ version: 1, disabled: [<view id>, ...] }` (line 81) and `oculus-app:<view id>` (line 66) are record formats, not prose. They are judged under "Declined to judge" below.

Findings: none.

## Declined to judge

User-visible choices the brief takes that no ruling of plan.md fixes. Each needs a ruling, or a booked self-rule entry in plan.md's Rulings as Z778-Z786 were; none of decisions 1-11 is booked there (`grep -n '^- Z78[7-9]\|^- Z79' plan.md` prints nothing). The template's "Decisions taken" says "a user-visible one went to the user before this brief was written".

1. **The record shape of `~/.oculus/apps.json`**, `{ version: 1, disabled: [...] }` (line 81). Ruling 45 names the file only. spec.md lists "a key in a saved record under `~/.oculus`" as user-visible.
2. **What a damaged `apps.json` means** (line 137, case 33): every app reads as enabled. This fails open, and a disabled app's host starts. It needs a ruling on fail-open against fail-closed.
3. **The return shapes of `oculus.fs`** (line 69, decision 2): `Uint8Array`, `[name, type]` pairs, `{ type, ctime, mtime, size }` and VS Code's `FileType` numbers. Ruling 42 (3) names the methods only, and these shapes are app-builder API.
4. **The refusal words of the new methods** (lines 32 and 72, decision 1). Ruling 41 fixes `not_declared` for secrets only. Using `failed:0` for "a host that cannot start" reuses a word documented as "no answer" (docs/apps.md:219).
5. **Counting rules** (line 53, decision 6). Host store updates are counted per host under `writes_per_min`, and `commands.run` under `opens_per_min`. This changes the meaning of two config keys (config/behavior.yml:304 and :306, options.yml:939 and :947). Ruling 41 covers secrets only.
6. **The name of the new closed channel for host rows** (item 10, line 76). Not named in the brief. It appears in docs/apps.md's list of closed channels, which app builders read.
7. **Activation semantics** (line 58, decision 8):
   - the scope of `workspaceContains` (own root against every shown root);
   - the cap of 10,000 entries;
   - leaving out dot folders and `node_modules`;
   - the language-id vocabulary of `onLanguage:<id>`.

   Ruling 45 (2) names the event names only.
8. **`activation` without `host` refusing the app, and a missing dependency leaving the folder offered** (lines 38-39).
9. **Constants with no config key**: host output of 1000 lines and 256 KB (decision 7), and stop times of 5 s and 2 s (decision 9). spec.md: "A value that has a config key ... is read from the config". These have none, and whether they should is a choice.
10. **The secrets service named by view id** (line 66). Ruling 40 says `oculus-app:<app id>`. For a root app the view id holds the root key (see section 6, item 21).
11. **The copy rules of Add app from folder** (decision 11) and the drawing of a removed app's tabs as the unknown view (line 82).
12. **Open item 46** is not booked. The brief reserves it (lines 89-94), but `grep -n 'item 46' plan.md orchestrator-state.md` prints nothing, and orchestrator-state.md's Open items says "None.".
13. **New or extended guarded entries for the host's lifecycle and for secret values never leaving the keyring.** No entry's text covers them (G3 covers `local.yml` and the secrets folder only). spec.md requires Axel's yes for a new entry. This is a candidate open item, not judged here.
14. **Claims not verified.**
    - "its N-API binary loads under Node and under Electron's Node alike" (line 199). Only the package's version, licence and type definitions were read from the registry. Nothing was loaded.
    - Whether `process.execPath` with `ELECTRON_RUN_AS_NODE=1` starts as Node inside a `utilityProcess` was not run. The rules of this check forbid starting Electron.
15. **The steps in flight.** Each D62 path was compared with D60's and D61's briefs and their worktrees (`git -C <wt> status --short`, `git -C <wt> diff -U0 <file> | grep '^@@'`):
    - **`src/lib/data/model/index.ts`.** D60 changes 42-45 and 382-545 (and adds `model-deck.ts` and `accounts/`). D62 changes 260-295, and after D60 its range moves by about 3 lines. No overlap.
    - **`config/text/findings.yml`.** D60 changes 31-35 and 58-62; D62's `findings.apps` group is at 225 and below. No overlap.
    - **`docs/apps.md`.** D60 changes line 125, a row of the Channel payloads table; D62 writes the whole file. Overlap only if D62 edits that table row; the brief should leave line 125 to D60.
    - **`HELP.md`.** D60 changes 169 and 452; D61 changes 35, 58, 83 and 219. D62's apps part is 386-392. No overlap. HELP.md:213 and :214, if added, are not adjacent to D61's insertion at 219.
    - **`DESIGN.md`.** D60 changes 558 and 593; D61 changes 476 and 578. D62 changes 166 and 268-432. No overlap. Line 122, if added, is free.
    - **`docs/diagrams/`.** Generated by all three and redrawn at each landing.
    - **`src/lib/views/system/workbench/`.** D61 adds `Workbenches.svelte`, which makes 10 items; D62 changes `Catalogue.svelte` only. No overlap.
    - **`src/lib/server/edit/writes.ts` and `writes/hubs.ts`.** These are D60 paths, which D62's item 14 split would touch (section 1). writes.ts:46-47 is not next to D60's hunk at 64. hubs.ts:17 is next to D60's hunk at 16, so a cherry-pick conflict is likely.
    - **`src/lib/state/client/context.ts`.** D60's hunks are 23-296. If D62 needs `AppsDeps` additions for `commands.run` (the terminal post and the approval question live in `state/sessions/terminal/commands.svelte.ts`, above `state/system` in the import order) or for the tab choice of `open`, its hunk is at 791-802. No overlap, but the brief's line 180 forbids the file. `postTerminal` cannot be imported from `state/system/apps` under `tests/checks/imports/order.ts`, so `commands.run` most likely needs that `AppsDeps` member. The brief should say so and take lines 791-802 as a shared path.

Agent usage: a852246ff3fc11d90, claude-opus-5-5, 273100 tokens, 100 tool uses, 15m 3s.

## Closed

The brief was rewritten from this report; the draft is kept in the session scratchpad until open item 46 is ruled, and the brief is written again from it then. Closed in the draft:

- Names 1: item 14 keeps `held.ts`, `store.ts`, `scan.ts` and `manifest.ts` in place, so no importer outside the folder changes. Names 2 and 3: the config sentences, HELP.md 213, 250 and 389, DESIGN.md 122, 345 and 407, docs/apps.md 345 and README.md 15 are named in item 13. Names 5: the field is `readFolders`.
- Step line 1: item 2 gains the files-and-connects sentence. Step line 2: a new part under item 4 has `open({ file })` choose the tab through the frame view's mount options. Step line 3: item 7 gains `oculus/changed`, `oculus/settings/get`, `oculus/subscribe`, `oculus/unsubscribe`, `oculus/commands/execute`, `oculus/stream/control` and the page-side table. Step line 4: the citation is 42 (7).
- Premises 1 to 4: the desktop's `utilityProcess`, the `startCommand` chain, the ESLint child as the runner's model (decision 10 replaced by a tree file started from `ownFolder()`), and `AppRow.files` are premises.
- Cases 3 to 8: G1 named for the token routes only; the dot-led cases split by place; case 22 restated as a streamed body; the perl ASCII gate; the worktree and base copy named. Cases 1, 2 and 6 wait on open item 46 (12) and (11).
- Implied inputs 2 to 8, 10 to 16, 18 to 20, 22: written into items 5, 8, 9 and 12 (octet-stream with nosniff and the sandbox policy; stdin close ends the runner; hot reload; one process per activation burst; serialised store writes; the broken stream; `findCredentials` values dropped; empty and colliding keys; Add size, nesting, temporary copy and name checks; a linked folder trashed as a link; saved commands unreachable; Approve opens the panel; chained `apps.json` writes; FIFOs refused). Inputs 1, 9, 17 and 21, and the user-visible choices under "Declined to judge" 1 to 13, are open item 46.

- After the check (2026-10-10): the brief is written with open item 46's rulings in place of the section that held it, and its premises are checked again on main at 856f2ba34 after D60 landed (the importers of the apps folder, `AppRow`'s lines, `createApps` in `state/client/context.ts`, the channel shapes in `state/client/shapes/`). Lines dictated after the check, each held against `agents/spec.md`: the G75 sentence "An app's host runs only from its approved, enabled, unchanged files, and stops when they change, when the app is disabled, revoked or removed, and when the server ends." (holds); the G76 sentence "A secret's value never leaves the keyring: no log, change record, channel, file or report holds it." (holds); the menu label "Add as App" (holds, a title-case action label as the Files menu's others); the words "per frame or host" and "calls of `open` or `commands.run`" for the two limits' sentences (hold). The step is not checked a second time.
