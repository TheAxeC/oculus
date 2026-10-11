# Diagnosis: markdown-created.test.ts times out on main at a08fdfacd

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. None of the outputs below held a secret. `/Users/axelfaes` is written `~` in the quoted output.

Diagnosis agent: ae9dcf77a17c614d7, served claude-opus-5-5, 237,400 tokens, 82 tool uses, 32.0 min.

**Not done or open, first:**
- The fix is not applied anywhere except the scratch copy, which is now removed. The hand-over is the diff under "Fix and test", as the brief asked.
- Whether Axel's running app (pid 8751, the vite dev server from main's `tools/oculus`, started 12:05) fails to start Markdown and YAML servers right now is not verified. Its exact launch lines are verified refused (see Cause). Checking the app itself would need its server output, and the brief forbids touching it.
- My vitest runs, which went through the prescribed node_modules link, wrote caches into the gate worktree's `node_modules`. Five paths there changed after 15:54: `.vite-temp`, `.vite/vitest/<hash>/results.json` and `_svelte_metadata.json`. Other suites on the machine share that folder, so whether my runs wrote them is not verified. Nothing was restored there.
- My logging tag `DIAG-7c3e` is not unique. It already appears in five committed records under `tools/oculus/.scratch/migration/agents/reviews/` (D20, D33, Q109, X3d, X3e). No line of mine remains: the grep over src, tests, config, utils and DESIGN.md printed nothing.

## Symptom

"tests/server/machine/lsp/adapters/markdown-created.test.ts times out (3 of 3 rows, "Test timed out in 30000ms") on main at a08fdfacd, with and without D67's staged change, run alone with `npx vitest run tests/server/machine/lsp/adapters/markdown-created.test.ts` from tools/oculus; the same file passed in D66's landing (`npm run test:landing`, 39a0205e5, 13:45 today); the sibling markdown-requests.test.ts passes 30 of 30."

## Where the probes run

- **Scratch copy:** `$TMPDIR/diagnose.1OVga6/tree`, made from the main checkout with `git worktree add --detach "$tmp/tree" a08fdfacd`. HEAD read back as `a08fdfacd341b3264e77d7334efb5ceb08ec3bb6`.
- **Nothing applied:** D67's change is not involved.
- **node_modules:** `$tmp/tree/tools/oculus/node_modules` was a symlink to `/Users/axelfaes/workspace/research-hub/.agents/worktrees/gate/tools/oculus/node_modules`, as the brief prescribed. Two exceptions, both in the scratch copy: probe 4, and the regression checks after the fix, used an APFS clone (`cp -Rc`) instead.
- **Node:** `$HOME/.nvm/versions/node/v24.21.0/bin` on PATH, `node --version` printed `v24.21.0`. There is no `timeout` binary on this machine, so each run was bounded with `perl -e "alarm shift; exec @ARGV" <seconds> ...`.
- **Paths redirected under `$TMPDIR`:** none. The red command reads no home path. The test's scratch roots come from `tests/fixtures/scratch.ts` under `os.tmpdir()`.
- **Rules file:** `tools/oculus/.scratch/migration/agents/spec.md`, which `.agents/plan.yaml` `rules:` names. `tools/oculus/CLAUDE.md` does not exist (`wc -l` printed "No such file or directory").

## Red command

```
cd $tmp/tree/tools/oculus && npx vitest run tests/server/machine/lsp/adapters/markdown-created.test.ts
```

Runs (three in a row, 15:55 to 16:00), the output of each quoted:

```
=== run 1 15:55:18
 ❯ |unit| tests/server/machine/lsp/adapters/markdown-created.test.ts (3 tests | 3 failed) 90023ms
     × 'a file created after the first refere…' 30005ms
     × 'a file moved after the first referenc…' 30004ms
     × 'a folder moved after the first refere…' 30004ms
Error: Test timed out in 30000ms.
 ❯ tests/server/machine/lsp/adapters/markdown-created.test.ts:242:18
 Test Files  1 failed (1)
      Tests  3 failed (3)
   Duration  90.80s (transform 384ms, setup 0ms, import 687ms, tests 90.02s, environment 0ms)
exit 1
=== run 2 15:56:53
 ❯ |unit| tests/server/machine/lsp/adapters/markdown-created.test.ts (3 tests | 3 failed) 90025ms
     × 'a file created after the first refere…' 30005ms
     × 'a file moved after the first referenc…' 30007ms
     × 'a folder moved after the first refere…' 30005ms
Error: Test timed out in 30000ms.
      Tests  3 failed (3)
   Duration  91.21s
exit 1
=== run 3 15:58:27
 ❯ |unit| tests/server/machine/lsp/adapters/markdown-created.test.ts (3 tests | 3 failed) 90039ms
     × 'a file created after the first refere…' 30008ms
     × 'a file moved after the first referenc…' 30007ms
     × 'a folder moved after the first refere…' 30005ms
Error: Test timed out in 30000ms.
      Tests  3 failed (3)
   Duration  90.79s
exit 1
```

The tightening put phase markers tagged `DIAG-7c3e` at each await of the row, in the scratch copy of the test: after the first references, after the disk change, after each wait inside `learned`, and after `learned`. Runs after the tightening:

```
$ npx vitest run tests/server/machine/lsp/adapters/markdown-created.test.ts -t "a file created"
DIAG-7c3e first references sent
DIAG-7c3e first references answered
DIAG-7c3e disk changed
     × 'a file created after the first refere…' 30008ms
      Tests  1 failed | 2 skipped (3)

$ npx vitest run tests/server/machine/lsp/adapters/markdown-created.test.ts      (all rows)
(each of the three rows) DIAG-7c3e first references sent / first references answered / disk changed
     × 'a file created after the first refere…' 30007ms
     × 'a file moved after the first referenc…' 30004ms
     × 'a folder moved after the first refere…' 30005ms
      Tests  3 failed (3)
```

Each row stops at the first wait in `learned` (markdown-created.test.ts:155): no `markdown/fs/readFile` of the file at its new path ever comes from the server. No `read 1 of` line was printed.

The tightened red command is the shrink copy described below: row 1 only, with a 15 s race on `page.learned('README.md')`. Run with `DIAG_CUT=` and no cut, three times: `DIAG-7c3e result timeout`, `Tests  1 failed (1)`, each run.

## No red command

Not applicable.

## Shrunk case

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| Rows 2 and 3 (`-t "a file created"`) | red: `× 'a file created after the first refere…' 30008ms` | cut |
| The language server and the relay, `RootWatch` alone over a scratch root (`register('a', ['**/*.md'])`, README.md written) | green: `Tests  1 passed (1)` | put back |
| `RootWatch` too: a bare recursive `fs.watch` in plain node, three runs | green each: `events [["change","diag-7c3e-zjPdk6"],["rename","README.md"]]`, `exit 0` | put back |
| `docs/DATA.md` written (`DIAG_CUT=data`) | red without the fix: `DIAG-7c3e result timeout`. Green with the fix: `Tests  1 passed (1)` | cut |
| `docs/DATA.md` opened by the page (`DIAG_CUT=opendata`) | red without the fix. Green with the fix: `Tests  1 passed (1)` | cut |
| `warm.md` opened by the page (`DIAG_CUT=openwarm`) | red without the fix. Also red with the fix: `DIAG-7c3e exit 0 null`, `result timeout`. That is a different red, the server running and never asked to read | put back |
| The first references (`DIAG_CUT=firstref`) | red without the fix. Also red with the fix: `DIAG-7c3e exit 0 null`, `result timeout`. A different red | put back |
| `data,opendata` together, without the fix, three runs | red each, for the symptom's reason: `DIAG-7c3e exit 1 null`, `code: 'ERR_ACCESS_DENIED'`, `resource: '~/workspace/research-hub/.agents/worktrees/gate/tools/oculus/node_modules/vscode-markdown-languageserver/dist/node/workerMain.js'`, `DIAG-7c3e result timeout`, `Duration 15.78s` / `15.81s` / `15.70s` | cut |
| Stage cut: relay, vitest and test replaced by the Markdown launch line run bare, with an `initialize` sent. Command: `node --permission --allow-fs-read=<oculus>/node_modules <oculus>/node_modules/vscode-markdown-languageserver/dist/node/workerMain.js --stdio`, where `<oculus>/node_modules` is the link | red, three runs: `ERR_ACCESS_DENIED`, `resource: '~/.../gate/tools/oculus/node_modules/vscode-markdown-languageserver/dist/node/workerMain.js'` | cut |
| The link, in the same line: allow path and script named by the real path | green, three runs: `"id":1,"result"` | put back |
| The `--permission --allow-fs-read=...` flags, in the same line (main's paths, script through the link) | green, three runs: `"id":1,"result"` | put back |

The shrunk case as it stands: `node --permission --allow-fs-read=<X>/node_modules <X>/node_modules/<server script> --stdio`, where `<X>/node_modules` is a symbolic link to a folder elsewhere. Both the permission flag and the link are needed for the red.

## Hypotheses

1. If the real Markdown server process does not start or exits at once in this environment, then a change that lets it start turns the red command green. Falsified by: the child still running at the end of the wait, with no exit logged.
2. If the server runs but never asks to watch files (no `client/registerCapability` for `workspace/didChangeWatchedFiles`, no `markdown/fs/watcher/create`), then a registration turns it green. Falsified by: such a registration on the wire, or a `workspace/didChangeWatchedFiles` sent to the server.
3. If the relay's root watch is registered but its `fs.watch` delivers no event inside the test process, then events delivered turn it green. Falsified by: the relay's `RootWatch` `changed` callback firing for README.md, seen as the `didChangeWatchedFiles` the test waits on.
4. If the change reaches the relay but `introduceMarkdown`'s `markdown/resolveLinkTarget` is not sent, or the server does not read on it, then sending it turns it green. Falsified by: the server's `markdown/fs/readFile` of README.md after the change.

The reply to the hypotheses: none, no person present.

The second list: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 (logging) | In the spawn wrapper of the shrink copy: `+ console.error('DIAG-7c3e spawn', command, JSON.stringify(args), options.cwd, child.pid);` `+ child.on('exit', (code, signal) => console.error('DIAG-7c3e exit', code, signal));` plus the child's stderr (whole, printed at exit) | `DIAG-7c3e spawn ~/.nvm/versions/node/v24.21.0/bin/node ["--permission","--allow-fs-read=/private/var/.../diagnose.1OVga6/tree/tools/oculus/node_modules","/private/var/.../tree/tools/oculus/node_modules/vscode-markdown-languageserver/dist/node/workerMain.js","--stdio"] ...` then `DIAG-7c3e exit 1 null DIAG-7c3e stderr whole: ... Error: Access to this API has been restricted. Use --allow-fs-read to manage permissions. at Object.readFileSync (node:fs:483:20) at defaultLoadImpl (node:internal/modules/cjs/loader:1243:17) ... code: 'ERR_ACCESS_DENIED', permission: 'FileSystemRead', resource: '~/workspace/research-hub/.agents/worktrees/gate/tools/oculus/node_modules/vscode-markdown-languageserver/dist/node/workerMain.js'` then `DIAG-7c3e result timeout`. The fully cut case (`data,opendata,openwarm,firstref`) printed no spawn line: with no document opened the relay starts no server | still standing: the server exits 1 at start, refused the read of its own script at its real path |
| 1 (the change it names, flag only) | `servers.ts`: both `['--permission', `--allow-fs-read=${join(options.oculus, 'node_modules')}`]` replaced by a helper giving `--allow-fs-read=${realpathSync(modules)}`, with the script still named through the link | Red command: `Tests  3 failed (3)`, `Duration 90.74s`. Shrink with stderr: `--allow-fs-read=~/workspace/research-hub/.agents/worktrees/gate/tools/oculus/node_modules`, then `Error: Access to this API has been restricted ... at Object.realpathSync (node:fs:2886:37) at toRealPath (node:internal/modules/helpers:67:13) at Module._findPath ... code: 'ERR_ACCESS_DENIED', resource: '/private/var/.../tree/tools/oculus/node_modules'` | still standing. The change was incomplete: node now refuses the `stat` of the link itself while resolving the script named through it |
| 1 (the change it names, whole) | The diff under "Fix and test" in `servers.ts`: `ownModules` names `node_modules` by its real path for the script and the flag | Red command: `Test Files  1 passed (1)`, `Tests  3 passed (3)`, `Duration  1.57s` | still standing: green with the change, red without it |
| 1 (the environment side, base code) | `$tmp/tree/tools/oculus/node_modules` replaced by an APFS clone (`cp -Rc`) of the gate's folder, a real directory. `git diff --stat` empty | Red command: `Tests  3 passed (3)`, `Duration  1.67s` | still standing: green with a real `node_modules`, red with the link |
| 2, 3, 4 (no change of their own) | Read from the green run of probe 3. `learned` resolves only after the server's `markdown/fs/readFile` of the file (4), a `workspace/didChangeWatchedFiles` to the server for it (3, from the `RootWatch` `changed` callback) and a second read. That notice is sent only when a watch is registered (2) | All three rows `✓` in 286-308 ms each, three runs | 2, 3, 4 falsified: once the server runs, registration, watch, notice and introduction all work |

Each probe was undone after its run: the file restored from its base copy and checked with `cmp` or `git diff --quiet` against it, and the link put back after probe 4 (`stat` printed `Symbolic Link node_modules -> .../gate/tools/oculus/node_modules`).

## Cause

Node's permission model checks every file read against the file's real path. Two launches in `src/lib/server/machine/lsp/servers.ts` build their command lines through `<oculus>/node_modules`: the Markdown server (servers.ts:782) and the YAML server (servers.ts:669), both via `packaged`, servers.ts:427. Each names that folder both as the allowed read path and as the folder of the server's script: `--permission --allow-fs-read=<oculus>/node_modules <oculus>/node_modules/<package>/<script> --stdio`.

When `<oculus>/node_modules` is a symbolic link, node resolves the script to its real path under the link's target. That path is outside the allowed folder, so the server dies at start:

```
ERR_ACCESS_DENIED, permission 'FileSystemRead', resource ~/workspace/research-hub/.agents/worktrees/gate/tools/oculus/node_modules/vscode-markdown-languageserver/dist/node/workerMain.js
exit 1
```

The relay keeps no server for the root. The test's first wait, for the server's `markdown/fs/readFile` of the created or moved file, never resolves, and each row times out at 30 s.

**The environment change that made it appear:**

```
$ stat -f "birth=%SB mtime=%Sm type=%HT %N -> %Y" -t "%F %T" tools/oculus/node_modules      (main checkout)
birth=2026-10-11 15:30:47 mtime=2026-10-11 15:30:47 type=Symbolic Link tools/oculus/node_modules -> /Users/axelfaes/workspace/research-hub/.agents/worktrees/gate/tools/oculus/node_modules
```

- Main's `tools/oculus/node_modules` became a link to the gate worktree's folder at 15:30:47, after the 13:45 pass.
- The gate's own `node_modules` is a real directory: `birth=2026-10-07 21:17:43 type=Directory`.
- The worktrees are linked the same way: D63 since 14:00:12, D67 since 15:30:35.
- `git status --porcelain -- tools/oculus/node_modules` prints `?? tools/oculus/node_modules`. A link escapes the `.gitignore` pattern `node_modules/`, which matches directories only.
- What main held at 13:45 is not verified. The clone probe shows a real directory makes the base code green.

**What did not change:**
- `git diff --stat 39a0205e5 a08fdfacd -- tools/oculus ':!tools/oculus/.scratch'` printed nothing.
- The installed language-server packages match the lock: `vscode-markdown-languageserver` 0.5.0, `vscode-markdown-languageservice` 0.5.0, `vscode-languageserver` 9.0.1, `vscode-jsonrpc` 9.0.3. Their folders date from 2026-10-09 15:20:53.

**Why markdown-requests.test.ts passes:** it starts no server process (its head comment, markdown-requests.test.ts:7-8: "No server process runs"), so it never reaches the launch.

**Both servers fail on main's own launch lines.** Run as bare processes with an `initialize` sent, reading files only:

```
--- vscode-markdown-languageserver/dist/node/workerMain.js
ERR_ACCESS_DENIED
resource: '~/workspace/research-hub/.agents/worktrees/gate/tools/oculus/node_modules/vscode-markdown-languageserver/dist/node/workerMain.js'
--- yaml-language-server/bin/yaml-language-server
ERR_ACCESS_DENIED
resource: '~/workspace/research-hub/.agents/worktrees/gate/tools/oculus/node_modules/yaml-language-server/bin/yaml-language-server'
```

With the allow path and the script under the real path, the YAML server answers: `{"jsonrpc":"2.0","id":1,"result":{"serverInfo":{"name":"yaml-language-server","version":"1.24.0"},...`.

`ps -o pid,lstart,command -p 8751` printed `8751 Sun Oct 11 12:05:10 2026 node ~/workspace/research-hub/tools/oculus/node_modules/.bin/vite dev`, and `lsof -a -p 8751 -d cwd` printed `~/workspace/research-hub/tools/oculus`. Every Markdown or YAML server that app starts after 15:30 gets these refused launch lines. That the app shows the failure now is not verified.

## Fix and test

The failure costs something: on any checkout whose `node_modules` is a link, the Markdown and YAML servers never start in the app, and the landing's slow suite goes red. The test is one row added to the guarded launch test `tests/server/machine/lsp/servers.test.ts`, which `agents/guarded.md:26-27` names for `servers.ts`. A linked `node_modules` is an input that gives a different outcome, so this is a row of that existing test, not a new entry. The red command (`markdown-created.test.ts`) also goes red without the fix, but only on a checkout whose `node_modules` is a link. The new row covers the defect on any checkout.

Test, run on the tree without the fix (servers.ts at the base, `cmp` printed "servers.ts is the base"):

```
$ npx vitest run tests/server/machine/lsp/servers.test.ts --reporter=verbose
 ✓ ... 'starts each server and the interprete…' 12ms
 ✓ ... 'starts texlab by its absolute path wi…' 214ms
 ✓ ... 'links latex and kpsewhich to the prog…' 336ms
 ✓ ... 'finds pyright under oculus\'s own fol…' 0ms
 ✓ ... 'gives pyright its script, the YAML se…' 0ms
 × ... 'names a node_modules that is a link b…' 5ms
AssertionError: expected [ '--permission', …(3) ] to deeply equal [ '--permission', …(3) ]
- Expected
+ Received
  [
    "--permission",
-   "--allow-fs-read=/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-modules-dszFQb",
-   "/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-modules-dszFQb/yaml-language-server/bin/yaml-language-server",
+   "--allow-fs-read=/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-own-M1dWAE/node_modules",
+   "/private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/oculus-own-M1dWAE/node_modules/yaml-language-server/bin/yaml-language-server",
    "--stdio",
  ]
 ❯ steps tests/server/machine/lsp/servers.test.ts:220:63
      Tests  1 failed | 6 passed (7)
```

Fix, made in the scratch copy only (`git diff -- tools/oculus` of the scratch tree):

```diff
--- a/tools/oculus/src/lib/server/machine/lsp/servers.ts
+++ b/tools/oculus/src/lib/server/machine/lsp/servers.ts
@@ -33,7 +33,7 @@
-import { existsSync } from 'node:fs';
+import { existsSync, realpathSync } from 'node:fs';
@@ -424,7 +424,7 @@ function packaged(
     const exists = options.exists ?? existsSync;
-    const script = join(options.oculus, 'node_modules', ...entry);
+    const script = join(ownModules(options), ...entry);
@@ -435,6 +435,15 @@ function packaged(
         : null;
 }
 
+/**
+ * Oculus's own `node_modules` by its real path when it is there: node's permission model checks a
+ * read against the real path, so a linked folder is named by where it leads, script and flag alike.
+ */
+function ownModules(options: ServersOptions): string {
+    const modules = join(options.oculus, 'node_modules');
+    return existsSync(modules) ? realpathSync(modules) : modules;
+}
+
 /** The pyright entry, from the `pyright` package under oculus's own folder. */
@@ -666,7 +675,7 @@ function yaml(options: ServersOptions): ServerEntry {
-                ['--permission', `--allow-fs-read=${join(options.oculus, 'node_modules')}`]
+                ['--permission', `--allow-fs-read=${ownModules(options)}`]
@@ -779,7 +788,7 @@ function markdown(options: ServersOptions): ServerEntry {
-                ['--permission', `--allow-fs-read=${join(options.oculus, 'node_modules')}`]
+                ['--permission', `--allow-fs-read=${ownModules(options)}`]

--- a/tools/oculus/tests/server/machine/lsp/servers.test.ts
+++ b/tools/oculus/tests/server/machine/lsp/servers.test.ts
@@ -9,6 +9,7 @@ import {
     realpathSync,
+    symlinkSync,
     writeFileSync
 } from 'node:fs';
@@ -197,6 +198,39 @@ const ROWS: Row[] = [
+    {
+        name: 'names a node_modules that is a link by its real path, in the permission flag and the script of the YAML and Markdown servers',
+        steps: () => {
+            const modules = realpathSync(scratchDir('oculus-modules-'));
+            const oculus = realpathSync(scratchDir('oculus-own-'));
+            symlinkSync(modules, join(oculus, 'node_modules'));
+            const servers = createServers({
+                oculus,
+                node: '/a node',
+                exists: () => true,
+                latex: () => shippedLatex()
+            });
+            const setup = {
+                root: AWKWARD,
+                interpreter: null,
+                interpreterPrefixes: [],
+                databaseFolder: `/lsp/${AWKWARD}/build`,
+                fallbackFlags: []
+            };
+            expect(servers.forId('yaml').launch(setup)?.args).toEqual([
+                '--permission',
+                `--allow-fs-read=${modules}`,
+                join(modules, 'yaml-language-server', 'bin', 'yaml-language-server'),
+                '--stdio'
+            ]);
+            expect(servers.forId('markdown').launch(setup)?.args).toEqual([
+                '--permission',
+                `--allow-fs-read=${modules}`,
+                join(modules, 'vscode-markdown-languageserver', 'dist', 'node', 'workerMain.js'),
+                '--stdio'
+            ]);
+        }
+    },
```

DESIGN.md:633 (one line). The fix makes its text `--permission --allow-fs-read=<oculus>/node_modules` inexact, so this exact substring changes:
- **old:** ``permission model (`--permission --allow-fs-read=<oculus>/node_modules`), so``
- **new:** ``permission model (`--permission --allow-fs-read=<oculus>/node_modules`, the folder and the server's script named by their real path, since node checks a read against the real path and would refuse a server its own script through a linked `node_modules`), so``

Why `ownModules` keeps a missing folder as given: `realpathSync` throws on a path that is not there. The `ownFolder` doc comment (servers.ts:396-399) says "a missing package is the server's `not_found` and never a failed start", and `packaged` returns null for a missing script. Keeping the path as given preserves that. It also keeps the two existing rows that use a non-existent `/oculus` and `/oculus dir` unchanged. It does not silence the symptom: with the folder present, the path is always resolved.

Runs after the fix:

```
$ npx vitest run tests/server/machine/lsp/servers.test.ts --reporter=verbose         (node_modules the link)
 ✓ ... 'names a node_modules that is a link b…' 1ms
 Test Files  1 passed (1)
      Tests  7 passed (7)

$ npx vitest run tests/server/machine/lsp/adapters/markdown-created.test.ts --reporter=verbose   (the red command and the original unshrunk case; node_modules the link; three runs)
 ✓ ... 'a file created after the first refere…' 308ms
 ✓ ... 'a file moved after the first referenc…' 292ms
 ✓ ... 'a folder moved after the first refere…' 286ms
      Tests  3 passed (3)
   Duration  1.63s / 1.61s / 1.64s

shrunk case (shrink copy, no cut), with the fix:   Tests  1 passed (1)
```

Regression checks with the fix, run against an APFS clone of `node_modules` so they wrote nothing under the gate:
- `npx eslint src/lib/server/machine/lsp/servers.ts tests/server/machine/lsp/servers.test.ts`: `eslint exit 0`.
- `npx prettier --check` on the same two files: `All matched files use Prettier code style!`.
- `npx vitest run tests/checks/tree/size.test.ts`: `Tests  10 passed (10)`. The first run failed with `tests holds 11 items` from my own throwaway file in `tests/`. That file was removed, and the run above is after its removal.
- `npx vitest run tests/server/machine/lsp` (slow included): `Test Files  13 passed (13)`, `Tests  177 passed (177)`.
- `npx svelte-check --tsconfig ./tsconfig.json --threshold error`: `COMPLETED 3695 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `LC_ALL=C grep -n '[^ -~]'` over the two changed files printed nothing. `LC_ALL=C grep -c '[^ -~]' DESIGN.md` printed `0`.
- A grep of the added lines for the history words of the rules file (before, used to, no longer, still, ...) printed nothing.
- No line of servers.ts is over 100 columns.

`wc -l src/lib/server/machine/lsp/servers.ts` prints `880`, exactly the rules file's limit ("at or under 880"). The next change that adds a line to servers.ts must split the file.

No test reaches it: not applicable. No test is written: not applicable.

**Where the fix belongs:**
- The code change goes in `tools/oculus/src/lib/server/machine/lsp/servers.ts`, the code that builds the launches.
- The row goes in `tools/oculus/tests/server/machine/lsp/servers.test.ts`.
- The sentence goes in `tools/oculus/DESIGN.md:633`.
- The orchestrator books the new row's title under the "language servers" test of `agents/guarded.md:27`, since that file names each test by file and title.
- None of these paths is in D67's staged change: main's `git status` lists none of them. So the fix is outside D67's brief and lands on main as its own change.

**The other option is the lazy one.** Making main's `node_modules` a real directory again would turn this test green on main. It would leave the defect in every linked worktree (D63, D67) and in any install whose `node_modules` is a link.

## Cleanup

```
$ grep -rn "DIAG-7c3e" tools/oculus/src tools/oculus/tests tools/oculus/config tools/oculus/utils tools/oculus/DESIGN.md      (scratch tree, before its removal)
grep exit 1   (no output)
$ git status --porcelain     (scratch tree, before its removal)
 M tools/oculus/DESIGN.md
 M tools/oculus/src/lib/server/machine/lsp/servers.ts
 M tools/oculus/tests/server/machine/lsp/servers.test.ts
$ git grep -l "DIAG-7c3e"    (committed files holding the tag, none mine)
  tools/oculus/.scratch/migration/agents/reviews/D20-diagnosis.md
  tools/oculus/.scratch/migration/agents/reviews/D33-diagnosis.md
  tools/oculus/.scratch/migration/agents/reviews/Q109-diagnosis.md
  tools/oculus/.scratch/migration/agents/reviews/X3d-diagnosis.md
  tools/oculus/.scratch/migration/agents/reviews/X3e-diagnosis-unreadable.md
```

What was removed:
- The two throwaway probe files: `tests/diag-7c3e-rootwatch.test.ts` and `tests/server/machine/lsp/adapters/diag-7c3e-shrink.test.ts`.
- The four temporary folders the harnesses made: `$TMPDIR/diag-7c3e-8zofNi`, `-p6d4UT`, `-U6O7eJ` and `-zjPdk6`. `find "$TMPDIR" -maxdepth 1 -name 'diag-7c3e-*' | wc -l` prints `0`.
- The scratch worktree, with `git worktree remove --force "$tmp/tree"` from the main checkout ("worktree removed"). Its `node_modules` was the clone, a real directory, checked with `stat` before removal, so the gate's folder was not reached.
- All of `$tmp`, holding the harness, the logs, the base copies, the probe diffs and the template copy: `test -e` printed "scratch folder gone".
- `/tmp/dummy_unused`, the log file of the first run's command. It was written outside `$TMPDIR` and removed by the same command: `ls` printed "No such file or directory".

What is left as it was:
- `git worktree list` shows main, D63, D67 and gate only.
- The gate's `vscode-markdown-languageserver/dist/node/workerMain.js` is present.
- Main's `git status --porcelain` lists the same files as at the session start, and none of servers.ts, servers.test.ts or DESIGN.md.
- `pgrep -fl "diagnose.1OVga6|diag-7c3e"` printed nothing (exit 1): no process of mine is running.

The red command on the original case is carried by the hand-over. It is green with the fix (three runs above) and red without it on a checkout whose `node_modules` is a link.

The cause to book: Node's permission model refuses the Markdown and YAML servers their own scripts when oculus's `node_modules` is a link, because servers.ts names it by the link path. The red command is `npx vitest run tests/server/machine/lsp/adapters/markdown-created.test.ts` on main, whose `node_modules` has been a link to the gate's folder since 15:30:47. The fix's test is the row 'names a node_modules that is a link by its real path, in the permission flag and the script of the YAML and Markdown servers' in `tests/server/machine/lsp/servers.test.ts`.
