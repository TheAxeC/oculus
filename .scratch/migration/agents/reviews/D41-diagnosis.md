# Diagnosis: D41 case 34, Shift+F12 on a Markdown heading finds no references

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. A diagnosis of the same step later is appended below under its own heading at the level of the title above, `# Diagnosis: <the symptom in a few words>`, which names its finding or quotes its part.

Diagnosis agent: aa704af05fb1f06d9, claude-opus-5-5, 328,374 tokens, 139 tool uses, 42.6 min

## Symptom

From `tools/oculus/.scratch/migration/plan.md`, D41, the line "Step 0, /land at main ce33afd33 (2026-10-09)":

"The look on the 8796 scratch oculus failed case 34: in `side-projects/looktest/docs/DATA.md` (scratch files, removed), Shift+F12 and the context menu's Go to References on the heading `## Intro` answer "No references found for 'Intro'" although `side-projects/looktest/README.md` links to it as `[sec](docs/DATA.md#intro)`, and after Restart Language Server the same; the cause is not known. Seen working in the same look: the Markdown server ready in the status bar, the missing link `docs/missing.md` marked, F12 on `docs/DATA.md#intro` opening `DATA.md` at `## Intro`, the Outline of `DATA.md` from the server, F12 on the missing link opening nothing."

From the orchestrator's prompt: DATA.md held `# Data`, `Text.`, `## Intro`, `More.`; README.md held `See [data](docs/DATA.md) and [sec](docs/DATA.md#intro) and [gone](docs/missing.md).`; both files were created in the hub root after the server process had started; README.md was open in a tab beside DATA.md. The brief's case 34 (`agents/briefs/D41.md`, "Cases"): "Shift+F12 on a heading lists the links to it".

## Where the probes run

A scratch copy at `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.4DKGy1/tree` (called `$D/tree` below), a detached worktree made from the main checkout at HEAD e80952001 ("Take D41 back at its landing"), with `git diff --binary 53fa9b002 D41` (378665 bytes, commits b952f6a72 and ce1eafcc8) applied by `git apply --3way --allow-empty`: 91 paths changed (21 added, 69 modified, 1 renamed), no conflict (`git diff --name-only --diff-filter=U` and a grep for conflict markers over `tools/oculus/src` and `tools/oculus/tests` printed nothing). `npm install` in `$D/tree/tools/oculus` ("added 557 packages"), node v24.21.0. The paths redirected under `$TMPDIR`: HOME (`$D/home`); ORDO_STABLE and ORDO_SKILL_DIRS not needed (no skill or pinned checkout is touched). The step's worktree `.agents/worktrees/D41`, the gate and the main checkout were not changed.

For a finding of a reviewer's report: not applicable (a red line).

## Red command

From `$D/tree/tools/oculus`:

```
HOME=$D/home OC=$PWD node --experimental-strip-types --no-warnings $D/probe/red2.ts
```

`$D/probe/red2.ts` (outside the tree) drives the real relay (`createRelay` of the copy, real child process) with the real Markdown server 0.5.0 over a fresh scratch root under `$TMPDIR`. It opens `diag-other.md`, asks `textDocument/references` on its heading (which makes the server build its workspace link cache), then writes `side-projects/looktest/README.md` and `side-projects/looktest/docs/DATA.md` with the look's texts, waits 1000 ms, opens DATA.md only, and asks `textDocument/references` on `## Intro` (line 4) with `includeDeclaration: false`, which is Monaco's second ask when the first returns two locations. It prints GREEN and exits 0 when README.md's link is listed, RED and exits 1 when the answer is empty. Environment switches used by the shrink: `WARM` (refs, rename, symbol, none), `SUB`, `WAIT`, `OPEN_README`, `README_TEXT`, `DATA_TEXT`/`LINE`, `EARLY` (data or readme written before the warm-up). Its body:

```ts
await request('initialize', { capabilities: {} });
send({ jsonrpc: '2.0', method: 'initialized', params: {} });
didOpen('diag-other.md', '# Other\n');
const other = { textDocument: { uri: page('diag-other.md') }, position: { line: 0, character: 3 } };
if (WARM === 'refs') await request('textDocument/references', { ...other, context: { includeDeclaration: true } });
else if (WARM === 'rename') await request('textDocument/rename', { ...other, newName: 'Other' });
else if (WARM === 'symbol') await request('workspace/symbol', { query: 'x', root: 'hub' });
else await request('textDocument/documentSymbol', { textDocument: { uri: page('diag-other.md') } });
if (process.env.EARLY !== 'readme') put(P('README.md'), README);
if (process.env.EARLY !== 'data') put(P('docs/DATA.md'), DATA);
await new Promise((r) => setTimeout(r, WAIT));
if (OPEN_README) didOpen(P('README.md'), README);
didOpen(P('docs/DATA.md'), DATA);
const refs = await request('textDocument/references', { textDocument: { uri: page(P('docs/DATA.md')) }, position: { line: LINE, character: 4 }, context: { includeDeclaration: false } });
```

Runs, with the output of each quoted:

```
run 1: WARM=refs SUB=side-projects/looktest WAIT=1000 OPEN_README=0 references: []
       RED: no reference to the heading from README.md
       exit=1
run 2: WARM=refs SUB=side-projects/looktest WAIT=1000 OPEN_README=0 references: []
       RED: no reference to the heading from README.md
       exit=1
run 3: WARM=refs SUB=side-projects/looktest WAIT=1000 OPEN_README=0 references: []
       RED: no reference to the heading from README.md
       exit=1
```

The order the brief asked to pin down, both files written before the server starts and after it, before the red command existed in the form above:

- Relay level (`$D/probe/red.ts`, the same relay, no workspace-wide request before the files are written), scratch root: `ORDER=before OPEN_README=0`, `before 1`, `after 0`, `after 1`, each `references: ["side-projects/looktest/docs/DATA.md:4","side-projects/looktest/README.md:0"]`, GREEN, exit 0.
- Relay level with the full hub copy `$D/tree` as the root: the same four, each GREEN, answered after 3474, 2511, 3807 and 6354 ms from the first open.
- Relay level over the real hub, read only (`$D/probe/hubref.ts`, `TARGET=tools/oculus/docs/window.md HEADING='## The rail' EXPECT=tools/oculus/HELP.md`, nothing written): `heading line 12, answered in 16512 ms`, `references: ["tools/oculus/docs/window.md:12","tools/oculus/HELP.md:16"] (2)`, GREEN. The walk alone (`markdownFiles` of `adapters/markdown/places.ts`) over the real hub: `files 717 in 37831 ms; under side-projects: 3`.
- The page's transport (`LspTransport` of `kit/lsp/transport.ts`) wired to the real relay in a scratch vitest file, with Monaco's two asks and its rule that drops a location of the asking model holding the caret: `before`/`after` with README registered or not, each "the editor would list" README's location; with the link cache built first (`after-warm`) and README not registered: `first ask ... "result":[{"uri":"inmemory://model/1","range":{"start":{"line":4,"character":0},"end":{"line":4,"character":8}}}]`, "the editor would list []", the test failed. With README registered: the link listed. With a Restart (`{ oculus: 'restart', root: 'hub' }`) after the red ask: `before restart {...,"result":[{"uri":"inmemory://model/1",...}]}` (red), then after the restart the link listed, README registered or not.

So the empty answer needs the server's workspace link cache to have been built before README.md was written. Two parts of the look are not reproduced: in every run where README.md is open on the server the link is listed, and in every run a Restart brings the link back. What would settle them: whether README.md's tab had its editor registered with the Markdown server at the Shift+F12 (an editor that is not mounted sends no `didOpen`), and the Markdown server's Output during the look's run after Restart. Not verified.

Runs after the tightening (no subfolder, README holding only the one link), with the output of each quoted:

```
HOME=$D/home OC=$PWD SUB= README_TEXT='[sec](docs/DATA.md#intro)
' node --experimental-strip-types --no-warnings $D/probe/red2.ts
WARM=refs SUB=(root) WAIT=1000 OPEN_README=0 references: [] RED: no reference to the heading from README.md exit=1
WARM=refs SUB=(root) WAIT=1000 OPEN_README=0 references: [] RED: no reference to the heading from README.md exit=1
```

Each run takes a few seconds.

## No red command

Not applicable.

## Shrunk case

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| The page's transport and Monaco's asks (relay level only) | RED, `references: []` (runs 1 to 3) | cut |
| The subfolder `side-projects/looktest` (`SUB=`) | RED, `WARM=refs SUB=(root) ... references: []` | cut |
| README's links `[data]` and `[gone]` (`README_TEXT='[sec](docs/DATA.md#intro)'`) | RED, `references: []` | cut |
| The 1000 ms wait after writing (`WAIT=3000`, `WAIT=0`) | RED both, `references: []` | cut |
| DATA.md written after the warm-up (`EARLY=data`, DATA.md written before it) | RED, `references: []` | cut |
| DATA.md's blank lines (`DATA_TEXT` without them, `LINE=2`) | RED with `WARM=refs`, GREEN with `WARM=none`, as with them | cut |
| The references request before the files (`WARM=none`, a documentSymbol only) | GREEN, `references: ["side-projects/looktest/README.md:0"]` | put back |
| The same with `workspace/symbol` (`WARM=symbol`) | GREEN, `references: ["side-projects/looktest/README.md:0"]` | put back (references kept) |
| The same with `textDocument/rename` (`WARM=rename`) | RED, `references: []` | either request holds the red |
| README.md not open on the server (`OPEN_README=1`) | GREEN, `references: ["README.md:0"]` | put back |
| README.md written after the warm-up (`EARLY=readme`, README.md written before it) | GREEN, `references: ["README.md:0"]` | put back |

The shrunk case, as it stands: a Markdown server whose workspace link cache has been built by a references or rename request; a Markdown file (README.md) holding a link to a heading written on disk after that and not opened on the server; references asked on the heading.

## Hypotheses

1. If the relay never sends the server a notice that README.md was created (the root watch of `held/held.ts` and its file-event match `entryFiles` in `held/watch.ts` let the event go), then sending the notice turns the red command green. Falsified by: a tagged log at the root watch's `changed` callback showing a `workspace/didChangeWatchedFiles` with README.md, type 1 (created), sent before the ask.
2. If the relay's notice names README.md by an address the server does not match against the address its link resolution uses (`/var` against `/private/var`, encoding), then sending the address the server's own walk gives turns the red command green. Falsified by: the server listing the link once it takes the notice under the address the relay sends (the rank 3 probe green).
3. If the Markdown server 0.5.0 drops a `workspace/didChangeWatchedFiles` Created notice for a file it has not read before (`node_modules/vscode-markdown-languageserver/dist/node/workerMain.js:25030-25038`: the Created branch acts only `if (entry)`, an entry of its document cache), while its link cache (`MdWorkspaceInfoCache`) reads the workspace once, at its first use, and then follows only those events, then letting the Created branch take a file it has not read turns the red command green. Falsified by: the red command still red with that one change.

All three explain every row of the shrink equally (red after a references or rename, green with README open or written first); they are ranked by the cost of their probe.

The reply to the hypotheses, or "none, no person present": none, no person present.

The second list, when every hypothesis was falsified, in the same form: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 | `src/lib/server/machine/lsp/held/held.ts`, in `#rootWatch`'s `changed:` before `this.notify({`: `+ console.error('DIAG-7c41 didChangeWatchedFiles', JSON.stringify(changes)) ??` | `DIAG-7c41 didChangeWatchedFiles [{"uri":"file:///private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diag-md-root-y0kNQD/README.md","type":1},{"uri":"file:///private/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diag-md-root-y0kNQD/docs/DATA.md","type":1}]` then `WARM=refs SUB=(root) WAIT=1000 OPEN_README=0 references: []`, `RED`, exit=1 | falsified: the relay sends the Created notice for README.md before the ask. Undone: the file copied back from the saved original; `diff` against `git show D41:tools/oculus/src/lib/server/machine/lsp/held/held.ts` printed nothing ("held.ts back to the step's text"). |
| 2 | none of its own; read from the rank 1 log (the relay sends `file:///private/var/...`, the real path, as the walk's `pathToFileURL(real)` in `adapters/markdown/requests.ts:57-58` does) and decided by the rank 3 run | the rank 3 probe's runs: the link listed under the address the relay sends | falsified |
| 3 | `$D/tree/tools/oculus/node_modules/vscode-markdown-languageserver/dist/node/workerMain.js:25032`, in the `FileChangeType.Created` case: `-                if (entry) {` `+                if (true) {` | three runs, each `WARM=refs SUB=(root) WAIT=1000 OPEN_README=0 references: ["README.md:0"] GREEN: the link in README.md is listed exit=0`; after the undo (`cmp` with the saved copy: "restored"): `WARM=refs SUB=(root) WAIT=1000 OPEN_README=0 references: [] RED: no reference to the heading from README.md exit=1` | still standing |

## Cause

Hypothesis 3. The Markdown server 0.5.0 takes a `workspace/didChangeWatchedFiles` Created notice only for a file already in its document cache (`workerMain.js:25030-25038`, the code of `vscode-markdown-languageserver`'s `VsCodeClientWorkspace`), and its workspace link cache, which references, rename, prepareRename, definition and the file-rename edit share (`createLanguageService`, `createWorkspaceLinkCache`), reads the workspace's files once, at its first workspace-wide request (`#ensureInit` / `#populateCache`), and after that learns of a file only by those events or by a `didOpen`. The relay does send the Created notice for a new Markdown file (round 1 item 4, `held.ts` `#rootWatch`, rank 1 probe), but the server drops it, so a Markdown file written on disk after the server's first references or rename stays out of every workspace-wide answer until a tab opens it or the server restarts. The probe that shows it: the red command green with the Created branch taking an unread file, and red without that change (rank 3 row). 0.5.0 is the latest published version (`npm view vscode-markdown-languageserver versions time.modified --json`: last entry `"0.5.0"`, `"time.modified": "2026-07-16T15:49:59.011Z"`).

Not explained by this cause, from the look: the empty answer with README.md "open in a tab beside DATA.md" and after Restart Language Server. In the harness both give the link (Red command section). If README.md's editor was not mounted, the cause accounts for the first Shift+F12; a Restart starts a fresh server whose first references reads the whole root again, which listed the link in every run, over the real hub as well (16512 ms). Not verified for the look.

Not verified by a run, and following from the same server branch: a Markdown file moved or renamed in the Files view arrives at its new path as a Created notice of a file the server has not read, so after the first workspace-wide request the moved file's links would be missing from references and from a later link rewrite until it is opened.

## Fix and test

Test, run on the tree without the fix:

No test file is kept. The rules file says a test exists only as the test of one entry of `agents/guarded.md`, and a step that needs a new entry stops and asks Axel (`agents/spec.md:57`). No entry covers what the Markdown server answers over the workspace. The check needs the real server process, so it would also be tagged slow (same line). The check is the red command, run on the copy with the fix's two files put back to the step's text:

```
without the fix:
WARM=refs SUB=(root) WAIT=1000 OPEN_README=0 references: [] RED: no reference to the heading from README.md exit=1
```

Fix (in the scratch copy only; diffs against the step's files):

```diff
--- src/lib/server/machine/lsp/held/held.ts (the step's text)
+++ src/lib/server/machine/lsp/held/held.ts
@@ -143,6 +143,8 @@
     #now: () => number;
     #progress = new Map<string, boolean>();
     #watch: RootWatch | null = null;
+    /** The notices of changed files in flight, told to the server in the order the disk gave. */
+    #telling: Promise<void> = Promise.resolve();
     /** The paths the server asked to have watched one by one, made with the first. */
     #followed: Followed | null = null;
@@ -500,17 +502,28 @@
         this.#watch ??= new RootWatch({
             root: this.root.real,
             open: (real) => this.docs.has(docKey(pathToFileURL(real).href)),
-            changed: (changes: FileChange[]) =>
-                this.notify({
-                    jsonrpc: '2.0',
-                    method: 'workspace/didChangeWatchedFiles',
-                    params: { changes }
-                }),
+            changed: (changes: FileChange[]) => {
+                this.#telling = this.#telling.then(() => this.#tellChanged(changes));
+            },
             watchFolder: this.#host.watchFolder
         });
         return this.#watch;
     }
 
+    /**
+     * Tell the server the files that changed on disk. A server that takes a created file only
+     * once it has read it (the entry's `introduce`) is asked first to read each created one.
+     */
+    async #tellChanged(changes: FileChange[]): Promise<void> {
+        const asks = this.entry.introduce?.(changes) ?? [];
+        await Promise.all(asks.map((ask) => this.call(ask.method, ask.params)));
+        this.notify({
+            jsonrpc: '2.0',
+            method: 'workspace/didChangeWatchedFiles',
+            params: { changes }
+        });
+    }
+
--- src/lib/server/machine/lsp/servers.ts (the step's text)
+++ src/lib/server/machine/lsp/servers.ts
@@ -209,6 +209,13 @@
      * server keeps the files it read until it hears they changed.
      */
     fileEvents?: () => string[];
+    /**
+     * The requests that make the server read the files a change of the disk created, asked before
+     * it is told of the change: the Markdown server takes a created file only once it holds it.
+     */
+    introduce?(
+        changes: readonly { uri: string; type: number }[]
+    ): { method: string; params: unknown }[];
     /** Whether a file is kept from the server: it is never put on one. */
@@ -785,6 +792,13 @@
         pulls: true,
         fileEvents: () => extensions().map((extension) => `**/*.${extension}`),
+        introduce: (changes) =>
+            changes
+                .filter((change) => change.type === 1)
+                .map((change) => ({
+                    method: 'markdown/resolveLinkTarget',
+                    params: { linkText: '#oculus-read', uri: change.uri }
+                })),
         refuses: (real, roots) => isMachineFile(real, roots) || isPrivateFile(real, roots),
```

How it works: for each created Markdown file, the relay first asks the server `markdown/resolveLinkTarget` for a heading link into that file. The server resolves it through `openMarkdownDocument` (`workerMain.js:22739`, `#resolveInternalLinkTarget`), which reads the file through the relay's `markdown/fs/readFile` and puts it in the server's document cache. The relay then sends the Created notice, which the server now takes, so the file goes into its link cache. `call` never rejects and answers null when the server ends (`held/requests/calls.ts:20-34, 46-50`), so the chain of notices cannot stall. A created file under a private folder is not told (`entryFiles`), and the relay refuses its read either way (`places.ts`).

What `/spec` decides, since the fix depends on it:

- The fix depends on how 0.5.0 behaves inside: a resolve with a fragment reads the target file. A later server version could change that.
- Two other ways reach the same cause. A `didOpen` with the disk text, then the Created notice, then a `didClose`: its `didClose` must wait until the server has read the file, or the server deletes the entry (`workerMain.js` `onDidClose`, `isDetached`). A patch of the server package: an edit of a dependency, for Axel to rule on.
- `servers.ts` is 878 lines with the fix (`wc -l`), 2 under the 880 line the brief's verify item 3 sets.

Runs after the fix:

```
the red command, three runs (shrunk form):
WARM=refs SUB=(root) WAIT=1000 OPEN_README=0 references: ["README.md:0"] GREEN: the link in README.md is listed exit=0
WARM=refs SUB=(root) WAIT=1000 OPEN_README=0 references: ["README.md:0"] GREEN: the link in README.md is listed exit=0
WARM=refs SUB=(root) WAIT=1000 OPEN_README=0 references: ["README.md:0"] GREEN: the link in README.md is listed exit=0

the original, unshrunk case (relay level, the look's texts in side-projects/looktest):
WARM=refs SUB=side-projects/looktest WAIT=1000 OPEN_README=0 references: ["side-projects/looktest/README.md:0"] GREEN: the link in README.md is listed exit=0
WARM=rename SUB=side-projects/looktest WAIT=1000 OPEN_README=0 references: ["side-projects/looktest/README.md:0"] GREEN: the link in README.md is listed exit=0

the original case through the page's transport (after-warm, README not registered), and the other orders:
Tests  1 passed (1)  ORDER=after-warm OPEN_README=0 RESTART=0 the editor would list [{"uri":"inmemory://peek/1","range":{"start":{"line":0,"character":35},"end":{"line":0,"character":53}}}]
Tests  1 passed (1)  ORDER=after-warm OPEN_README=1 RESTART=0 the editor would list [{"uri":"inmemory://model/2",...}]
Tests  1 passed (1)  ORDER=after-warm OPEN_README=0 RESTART=1 the editor would list [{"uri":"inmemory://peek/1",...}]
Tests  1 passed (1)  ORDER=before OPEN_README=0 RESTART=0 the editor would list [{"uri":"inmemory://peek/1",...}]
Tests  1 passed (1)  ORDER=after OPEN_README=0 RESTART=0 the editor would list [{"uri":"inmemory://peek/1",...}]

HOME=$D/home npx vitest run --project unit tests/server/machine/lsp --reporter=dot
 Test Files  11 passed (11)
      Tests  172 passed (172)

npx prettier --check src/lib/server/machine/lsp/held/held.ts src/lib/server/machine/lsp/servers.ts
All matched files use Prettier code style!
npx eslint src/lib/server/machine/lsp/held/held.ts src/lib/server/machine/lsp/servers.ts
eslint exit=0
npx tsc --noEmit -p tsconfig.json (after svelte-kit sync): exit 2, 3 lines, all TS2614 on `*.svelte` imports in views/boards and views/shared, none in held.ts or servers.ts (plain tsc, not the project's svelte-check)
```

No test reaches it: not applicable. No test is written: the rules file allows a test only as the test of a guarded entry (`agents/spec.md:57`), and no entry covers the Markdown server's workspace answers. A new entry, or a row added to G36, is Axel's ruling. The red command above is ready to become that test as a slow-tagged relay test.

## Cleanup

```
$ grep -rn "DIAG-7c41" $D/tree --exclude-dir=node_modules --exclude=local.yml
(lines only in tools/oculus/.scratch/migration/agents/reviews/D33-diagnosis.md, 910-918, 973-974, 1759-1767, 1801, 1817, 1823,
 and tools/oculus/.scratch/migration/agents/reviews/O30-diagnosis.md, 397, 401, 509; no line under src, tests or any other path)
```

The tag `DIAG-7c41` was not unique to this diagnosis: the committed records of D33 and O30 already hold it. This diagnosis added one tagged line (rank 1 probe, `held.ts`). It was undone before the grep, and `diff` against the step's `held.ts` printed nothing. The other tagged lines were in the scratch vitest file `tests/diag/page-refs.test.ts`, which was removed (`rm -rf tests/diag`) before the grep. The server package in the copy was unchanged at the end (`cmp ... workerMain.js.orig`: "server package unchanged").

```
$ git worktree remove --force "$D/tree"        # from the main checkout
worktree removed
$ rm -rf "$D" $TMPDIR/diag-md-root-*
$ ls -d /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.4DKGy1
ls: ...: No such file or directory
$ ls $TMPDIR | grep -c "^diag-md-root-"
0
$ git -C /Users/axelfaes/workspace/research-hub worktree list | grep -c "diagnose.4DKGy1"
0
```

The scratch copy, the redirected home `$D/home`, the harness files under `$D/probe` and every scratch root are gone. No credential or `.env` file was copied. The red command on the original case is carried by `/spec` into the step's new brief as its check (the harness source is quoted under "Red command").

Notes for the orchestrator (Steps 20 and 23):

- The cause, the fix and this record's path go into D41's Step 0.
- Not reproduced from the look: the empty answer with README.md open beside DATA.md, and after Restart Language Server. The cause above does not explain them. What would settle them is under "Red command".
- A kept test of this needs a guarded entry, Axel's ruling (`agents/spec.md:57`).
- The fix's dependence on how the server behaves inside, and the two other ways, are under "Fix and test".
- Not verified: files moved in the Files view are hit by the same cause (under "Cause").
