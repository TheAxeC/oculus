# Diagnosis: an open History does not show a write made after it opened

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. A diagnosis of the same step later is appended below under its own heading at the level of the title above, `# Diagnosis: <the symptom in a few words>`, which names its finding or quotes its part.

Diagnosis agent: a5e4e011ba391dc69, claude-opus-5-5 (read from its transcript after launch), 338,652 tokens, 117 tool uses, 31.8 min.

## Symptom

Part (3) of step D74's text, the one part of the step that asks for a cause to be found, in `tools/oculus/.scratch/migration/plan.md` (the line starting `- D74 `), word for word:

"Folded in at D64's landing look: the History view, while it is open, does not show a write made after it opened (an Add Configuration and an app's Write File appeared only after the view was reopened or the page reloaded); find why and end it, so a write shows in an open History as VS Code's Timeline shows a new entry."

## Where the probes run

A scratch copy, the detached worktree `/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.LfafA1/tree`, made from the main checkout at `HEAD` = `72b9538b5a42681ba56e19aa7a4a56990e10a457` with `git worktree add --detach "$tmp/tree" HEAD`. Nothing was applied. Dependencies: `npm ci` in the copy's `tools/oculus`, with Node from `$HOME/.nvm/versions/node/v24.21.0/bin`. Every command ran from the copy's `tools/oculus`.

Paths redirected under `$TMPDIR`: `HOME=/var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.LfafA1/home` on every vitest run. The hub, the change log, the local history and the app data folder of each case are scratch folders made by `tests/fixtures/scratch.ts` under the system temporary directory, and the fixture asserts that the log and its undo folder are inside them. No server was started and no port was opened. The page's `fetch`, `window`, `location` and `WebSocket` are stubs, and the WebSocket's other end is an in-process `Hub`.

No reviewer's finding is involved (`premise`), so there are no `git status` or `git diff` outputs to record.

## Red command

```
HOME=$tmp/home npx vitest run --project unit tests/state/sessions/changes-page.test.ts
```

The red command is a vitest file in the scratch copy that runs over the page's whole path:

- **Server side.** The change log is the one built by the server's own `target()` (`src/lib/server/edit/writes.ts:286-340`), which is handed `{ hub: new Hub(), fsWrites, opsWrites }` the way the server context hands it. The writes go through the server's writers:
  - `handleWrite`, which is POST /api/write, with a `manifest` write of `status.line`;
  - `runOps` with `{ trashReplaced: false, app: 'app:notes' }` over the apps' own write chain, which is what `src/lib/server/root/process/apps-hosts.ts:131-141` calls for an app's Write File;
  - `appendConfiguration`, which is Add Configuration.
- **Page side.** The client is built by `createClientState()` (`src/lib/state/client/context.ts`). Its socket store opens a fake WebSocket that carries the hub's frames to the page and the page's subscribe messages to `Hub.subscribe`. It connects the channel list that `src/routes/+page.svelte` passes to `connect([...])`, read from that file. GET /api/changes is answered by the real `handleChanges` over the same log.
- **Each case.** It opens the view (reads `changes.rows()` once and waits for `loading()` to be false), makes the write, then polls `rows()` every 10 ms for 1 s, the way the view's derived reads it, giving `open`. It then calls `changes.reload()` and polls again, giving `reread`. It asserts `{ open: true, reread: true }`.
- **Same source as the test.** The red command's three cases are the same as the three `it.each` rows of the test below, over the same world. Its source is the fixture plus those three rows, quoted under "Fix and test". The brief can carry the test's first case as the check.

Runs on the tree without the fix, in the form before the tightening (one read after a 200 ms settle):

```
### run 1
     <multiplication sign> shows a structured write through /api/write in the open view 644ms
     <multiplication sign> shows an app's Write File in the open view 598ms
     <multiplication sign> shows an Add Configuration in the open view 558ms
AssertionError: expected { open: false, reread: true } to deeply equal { open: true, reread: true }
AssertionError: expected { open: false, reread: true } to deeply equal { open: true, reread: true }
AssertionError: expected { open: false, reread: true } to deeply equal { open: true, reread: true }
      Tests  3 failed (3)
### run 2
     (the same three failures, the same three AssertionError lines)   Tests  3 failed (3)
### run 3
     (the same three failures, the same three AssertionError lines)   Tests  3 failed (3)
```

Parts of the reported symptom, with whether the red command catches each:

| Part of the symptom | Caught by the red command | Lines read, for a part not caught | Reproduced |
|---|---|---|---|
| "does not show a write made after it opened": a structured write | yes, `open: false` against `true` on every run | not applicable | yes, caught |
| "an app's Write File" | yes, `open: false` on every run | not applicable | yes, caught |
| "an Add Configuration" | yes, `open: false` on every run | not applicable | yes, caught |
| "appeared only after the view was reopened or the page reloaded" | yes, `reread: true` on every run after `changes.reload()`; a reopen and a page reload both end in a fresh read of the first page | not applicable | yes, caught |

Runs after the tightening. The single read after the settle was replaced by a poll of `rows()` every 10 ms for 1 s. A read of a held key that nothing marked asks the endpoint nothing (`queries.svelte.ts` `read`/`wants`), so this reads no more than the view's derived does.

```
### run 1
     <multiplication sign> shows a structured write through /api/write in the open view 1357ms
     <multiplication sign> shows an app's Write File in the open view 1314ms
     <multiplication sign> shows an Add Configuration in the open view 1325ms
AssertionError: expected { open: false, reread: true } to deeply equal { open: true, reread: true }   (x3)
      Tests  3 failed (3)
   Duration  7.42s
### run 2
     <multiplication sign> ... 1418ms / 1306ms / 1341ms, the same three AssertionError lines, Tests  3 failed (3), Duration  7.38s
### run 3
     <multiplication sign> ... 1334ms / 1323ms / 1803ms, the same three AssertionError lines, Tests  3 failed (3), Duration  7.56s
```

## No red command

not applicable

## Shrunk case

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| The channel between server and page: a log from `tests/routes/edit/write-fixture.ts` `targetOver` (no hub), and no socket | red on all three writes, `expected { open: false, reread: true }` | cut |
| The client wiring and the server writers: the store alone, `createChanges(createQueries())` over `handleChanges`, with one line appended through `logChanges` | red, `expected [] to deeply equal [ 'status.line' ]` | cut |
| The wait after the append: rows read right after it | red, `expected [] to deeply equal [ 'status.line' ]` | cut |
| The `window` stub | stopped in its setup before the append, `expected true to be false` on `loading()`: the store asks nothing outside a browser (`in-browser.ts`) | put back |
| The first read before the append: rows read only after it | green, 1 passed | put back |

The shrunk case as it stands: the log's store alone in a browser, with its first page read once over GET /api/changes from an empty log, and then one line appended through `logChanges`. A read of the rows after that holds `[]`.

## Hypotheses

The shrunk case is red with no view, no tab scope, no socket and no writer, so the cause lies between the append and the store's held page. That leaves four live hypotheses:

1. **No path carries an append to a page that holds the log.** If `logChanges` (`src/lib/server/core/changes.ts:382-392`) appends the line and announces nothing, and the store (`src/lib/state/sessions/changes.svelte.ts:156-207`, built at `context.ts:207` with the query client alone) hears nothing and re-asks only through its reader's own `reload`, `latest` or `older`, then announcing each append on a `changes` channel and marking the store's key on it turns the red command green. Falsified by: green with only one of the two halves, or still red with both.
2. **The server half alone.** If the page could already act on an announcement, then `logChanges` announcing on the hub turns the red command green. Falsified by: still red with only the server announcing.
3. **The client half alone.** If the server already sends a frame after a write that the store ignores, then the store listening on a `changes` channel (and the page subscribing it) turns the red command green. Falsified by: no hub frame between the write and the read (probe 1), and still red with only the client listening.
4. **The query client does not re-ask a marked key.** If the query client does not re-ask a held key that is marked out of date while a reader holds it, then neither half helps. Falsified by: green when both halves are in.

A fifth hypothesis, that the page's own write paths fail to reload the log after their answer, is set aside. An app's Write File is made by the app's host in the server process (`apps-hosts.ts:131-141`), so no page request answers it and a page-side reload cannot reach that part. Probe 4 turns every part green with no page-side reload. It got no probe of its own.

The reply to the hypotheses: none, no person present.

The second list: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 3 (and 1) | Probe 1, logging at the hub, with the tag `DIAG-5c1e`:<br>`src/lib/server/core/channels.ts` `publish(...)`: `+ console.log(\`DIAG-5c1e hub publish ${channel}\`);`<br>`send(...)`: `+ console.log(\`DIAG-5c1e hub send ${channel}\`);`<br>plus two tagged lines in the red command, `DIAG-5c1e write made` and `DIAG-5c1e settled` | For each of the three cases: `DIAG-5c1e write made`, then `DIAG-5c1e settled`, with no hub line between them. Still 3 failed. | 3 falsified: the writers and `logChanges` put no frame on the hub. This run had no watcher of the hub or the roots. `grep -rn "/api/changes\|'changes'" src/lib` on HEAD finds no channel that names the log. 1 still standing. |
| 2 | Probe 2, the server half: `ChangeLog` gains `hub?: { publish(...) }`, `append` returns the newest `at`, `logChanges` ends with `log.hub?.publish('changes', { at })`, and `target()` passes `hub: server.hub`. This is the server part of the fix diff below, without the `ChangesPayload` type. | `Tests  3 failed (3)`, each `expected { open: false, reread: true }`. Run on both forms of the red command. | 2 falsified. The page subscribes to no channel that carries the announcement (`+page.svelte:276-294`). |
| 3 | Probe 3, the client half: `createChanges(queries, entities)` with `entities.afterReceive((m) => { if (m.channel === 'changes') queries.mark(KEY, 'replace'); })`, `context.ts:207` passing `entities`, and `'changes'` added to the `connect([...])` list of `+page.svelte` | `Tests  3 failed (3)`, each `expected { open: false, reread: true }` | 3 falsified: the server sends nothing. |
| 1 | Probe 4, the change hypothesis 1 names: probe 2 and probe 3 together | `Tests  3 passed (3)` | 1 still standing, green with the change and red without it. 4 falsified. This probe broke the other input "an older page loaded" (see the table below): the read for the mark used the first-page fetcher, which replaces the rows. |

Each probe's change was undone after its run. `git status --short` in the copy listed only the untracked harness files after each undo.

## Cause

**Hypothesis 1.** The change log is a file that any process appends to, but nothing connects an append to a page that holds a copy:

- the append, `logChanges` (`src/lib/server/core/changes.ts:382-392`), writes the line and announces nothing;
- the store that holds the log for the History view, `createChanges` (`src/lib/state/sessions/changes.svelte.ts:156-207`), holds the first page in the query client under `staleTime: Infinity` (`src/lib/state/client/queries.svelte.ts:46-50`);
- the store asks again only when its own reader calls `reload`, `latest` or `older`. Those callers are the History view's undo, the Files tree after one of its own operations (`src/lib/views/shared/explorer/tree/Tree.svelte:255-259`) and the tree's keyed undo (`src/lib/views/shared/explorer/tree/control/keyed.ts:69-75`).

So a write made by a server route, an app's host or another page never reaches an open History until the view or the page is read afresh.

**Rule at the kind of value.** A held copy of the change log is a copy of a file that every writer appends to. It is read again whenever the log is appended to, whichever page, app host or server process made the append, and reading it again keeps the rows the reader loaded.

**What shows it.** Probe 4 turns the red command green, and the red command is red without it. Each half alone stays red (probes 2 and 3).

**Places of the defect** (listed in "Operation and other inputs"):

- `logChanges` (changes.ts:382-392);
- `target()`, the one builder of every `ChangeLog` (writes.ts:326-333);
- `createChanges` (changes.svelte.ts:156);
- the store's construction (context.ts:207);
- the page's channel list (+page.svelte:276-294);
- the first-page read `page()` (changes.svelte.ts:132-154), which replaces the held rows.

Inputs not fixed: none. Places not fixed: none.

## Operation and other inputs

**The operation that goes wrong:** the append of the change log, `logChanges` in `src/lib/server/core/changes.ts:382-392`, with its other end, the held page of the client store `createChanges` in `src/lib/state/sessions/changes.svelte.ts:156-207`. The append changes the file the store holds a copy of and tells no holder of the copy.

**The rule, stated at the kind of value:** a held copy of the change log is read again whenever the log is appended to, by whichever writer, page, app host or server process made the append, and reading it again keeps what the reader loaded.

Places of the defect:

1. `src/lib/server/core/changes.ts:382-392` `logChanges` (and `append`, 345-376, which returns nothing): appends and announces nothing. Every writer of the log goes through it:
   - `src/lib/server/edit/writes.ts:691` and `:725`;
   - `src/lib/server/files/fs/ops.ts:584` (file operations, Write File, Add Configuration);
   - `src/lib/server/machine/lsp/choices.ts:105`;
   - `src/lib/server/machine/runs/schedules/routes.ts:279`;
   - `src/lib/server/machine/runs/commands/routes.ts:127` and `:141`.
2. `src/lib/server/edit/writes.ts:326-333` `target()`: the one place a `ChangeLog` is built. It builds the log without the hub, though `server.hub` is in hand (writes.ts:297). Every caller that gets a log passes the server with its hub:
   - `src/routes/api/write/+server.ts:18`;
   - `(files)/ops/+server.ts:31`;
   - `(machine)/debug/+server.ts:28`;
   - `(machine)/schedules/+server.ts:27`;
   - `api/commands/+server.ts:23`;
   - `(git)/changes/+server.ts:16`;
   - `src/lib/server/root/context.ts:310` and `:495`, which feed the apps' hosts and the app store.

   `src/lib/server/git/deposit/deposit.ts:209` passes no server, and so gets no log at all.
3. `src/lib/state/sessions/changes.svelte.ts:156`: `createChanges(queries)` takes no channel input and never marks its key on an append.
4. `src/lib/state/client/context.ts:207`: builds the store without the entities store.
5. `src/routes/+page.svelte:276-294`: the page subscribes to no channel that carries the log. It is the only `connect([...])` in `src`.
6. `src/lib/state/sessions/changes.svelte.ts:132-154` `page()`: a first-page read replaces the held rows. For a read made because of an append, that drops the older pages the reader loaded. This place was found with probe 4's change.

Each input below was run in `tests/state/sessions/history-live.test.ts` (part of the defect) or `history-other.test.ts` (not part of the defect).

| Other input | Why it reaches a place of the defect | Right result | Place at which it is wrong | Result on the tree without the fix | Result with the change of probe 4 | Class | Result after the fix |
|---|---|---|---|---|---|---|---|
| An older page loaded (55 lines, `older()`), then a structured write | places 1 and 3, and 6 when read again | the new row on top, 56 rows, the oldest `earlier-0` kept | 1 and 3; with probe 4 also 6 | wrong: `expected false to be true` (history-live.test.ts:46) | wrong: `expected [ 50, 'status.line', 'earlier-6' ] to deeply equal [ 56, 'status.line', 'earlier-0' ]` | part of the defect | right, passed |
| History in a hidden tab (`tabScope.wrap`), a write, then the tab shown | 1 and 3; a hidden tab's read asks nothing (`queries.svelte.ts` `read`/`hidden`) | the row shows once the tab is shown | 1, 3 | wrong: `expected false to be true` (:63) | right, passed | part of the defect | right, passed |
| The page not connected during the write, then connected again | 1, 3, 5 | the row shows after the reconnect | 1, 3, 5 | wrong: `expected false to be true` (:72) | right, passed | part of the defect | right, passed |
| An append that cuts the log to its window (`keep: 2`, 4 lines held) | 1, through the rewrite branch of `append` | the row shows | 1, 3 | wrong: `expected false to be true` (:81) | right, passed | part of the defect | right, passed |
| Two writes at once (a structured write and Write File) | 1, 3 | both rows show | 1, 3 | wrong: `expected false to be true` (:88) | right, passed | part of the defect | right, passed |
| A write made before the view opened | first read only | the row shows on the first read | none | right, passed | right, passed | not part of the defect | right, passed |
| The view's own undo reload with an older page loaded | `reload()`, the first-page fetcher | the undo's row on top, one page as the reload reads | none | right, passed | right, passed | not part of the defect | right, passed (the fix leaves `first` as it is) |
| A write that changed nothing | `logChanges` returns early with no records | rows unchanged (1), no request | none | right, passed (`[1, []]`) | right, passed | not part of the defect | right, passed |

Inputs reached by reading and not run on their own:

- a write made from another browser window: `Hub.publish` sends to every subscribed sink, channels.ts:157-165;
- an app's store update (`recordWrite` reached from `context.ts:495`);
- the LSP choice write (choices.ts:105), the schedule write (routes.ts:279) and the command writes (routes.ts:127, 141).

Each of them reaches place 1 through the same `logChanges` call.

## Fix and test

The test is `tests/state/sessions/history-live.test.ts` with its helper `tests/state/sessions/history-live-fixture.ts`. It has one case for each reported write (the shrunk case, through every writer) and one for each other input that is part of the defect.

Test, run on the tree without the fix:

```
$ HOME=$tmp/home npx vitest run --project unit tests/state/sessions/history-live.test.ts
 FAIL  |unit| tests/state/sessions/history-live.test.ts > a write made while History is open > shows a structured write through /api/write in the open view
 FAIL  |unit| tests/state/sessions/history-live.test.ts > a write made while History is open > shows an app's Write File in the open view
 FAIL  |unit| tests/state/sessions/history-live.test.ts > a write made while History is open > shows an Add Configuration in the open view
AssertionError: expected false to be true // Object.is equality
 <heavy right-pointing angle quotation mark ornament> tests/state/sessions/history-live.test.ts:36:66
 FAIL  ... > shows the write on top and keeps the older page the reader loaded
AssertionError: expected false to be true // Object.is equality
 <heavy right-pointing angle quotation mark ornament> tests/state/sessions/history-live.test.ts:46:74
 FAIL  ... > shows a write made while its tab was hidden once the tab is shown
AssertionError: expected false to be true // Object.is equality
 <heavy right-pointing angle quotation mark ornament> tests/state/sessions/history-live.test.ts:63:69
 FAIL  ... > shows a write made while the page was not connected once it connects again
AssertionError: expected false to be true // Object.is equality
 <heavy right-pointing angle quotation mark ornament> tests/state/sessions/history-live.test.ts:72:74
 FAIL  ... > shows a write whose append cut the log to its window
AssertionError: expected false to be true // Object.is equality
 <heavy right-pointing angle quotation mark ornament> tests/state/sessions/history-live.test.ts:81:74
 FAIL  ... > shows two writes made at once
AssertionError: expected false to be true // Object.is equality
 <heavy right-pointing angle quotation mark ornament> tests/state/sessions/history-live.test.ts:88:74
      Tests  8 failed (8)
```

The three `it.each` rows share one assertion line, :36. Vitest printed it once for the three FAIL lines.

Places the fix covers:

- **Places 1 and 2, one change at the source of every log.**
  - `ChangeLog` gains `hub?: Pick<Hub, 'publish'>`.
  - `append` returns the newest `at` from both its branches.
  - `logChanges` publishes `changes` with `{ at }` after the lines are on disk. `publish` rather than `send` is used so that a page that subscribes again hears of the newest append.
  - `target()` passes `hub: server.hub`.
  - `ChangesPayload` is declared in `data/model`.
- **Places 3 and 4.**
  - `createChanges(queries, entities)` hears the `changes` channel through `entities.afterReceive` and reads its payload through `payloadOf`.
  - It asks nothing when it holds no log yet, when it already holds a row that new, or outside a browser.
  - Otherwise it calls `queries.refetch(KEY, newer, 'again')`, which follows a request already out (an `older()` page included).
  - `context.ts` passes `entities`.
  - The payload is typed in `Payloads` and checked in `payloadShapes`.
- **Place 5.** `'changes'` is added to the page's `connect([...])`.
- **Place 6.** The announced read uses its own fetcher `newer`, which puts the fresh first page in front of the held rows when the page reaches the newest held row (`ahead`). The first-page fetcher `first`, used by the first read, `reload` and `latest`, is unchanged, so the inputs that are not part of the defect read as before.

Fix:

```
--- a/tools/oculus/src/lib/data/model/index.ts
+++ b/tools/oculus/src/lib/data/model/index.ts
@@ -227,6 +227,12 @@ export type Jump = {
     column?: number;
 };
 
+/**
+ * The payload of the `changes` channel: the moment of the newest record the change log holds,
+ * published after each append, so a page holding the log reads it again.
+ */
+export type ChangesPayload = { at: string };
+
 /** The message a page sends to ask for a jump. */
--- a/tools/oculus/src/lib/server/core/changes.ts
+++ b/tools/oculus/src/lib/server/core/changes.ts
@@ -25,6 +25,10 @@
 // that record is read back.
 //
+// Each append is announced on the hub's `changes` channel with the moment of its newest record,
+// after the lines are on disk, so a page holding the log reads it again and finds them; the channel
+// keeps its newest message, so a page that connects again after a write hears of it.
+//
 // A record whose values are too large for a line (an app's store) holds their byte sizes as
@@ -37,6 +41,8 @@ import { dirname, join } from 'node:path';
 import { chained, writeTextAtomic } from './json.ts';
 import type { FsWrites } from './json.ts';
+import type { Hub } from './channels.ts';
+import type { ChangesPayload } from '../../data/model/index.ts';
@@ -154,6 +160,8 @@ export type ChangeLog = {
     /** The folder the values of a record's `kept` are written to, one `<at>.json` each. */
     undoDir?: string;
+    /** The server's channels, on which each append is announced as the `changes` channel. */
+    hub?: Pick<Hub, 'publish'>;
 };
@@ -337,12 +345,12 @@
 /**
- * Append the records of one write, behind the chain. The stamp rises past the last line's, so two
- * records of one request and two requests in one millisecond each get their own moment; the file is
- * rewritten to `keep` lines once it has grown past twice that, so a rewrite is rare and the read
- * never walks an unbounded file.
+ * Append the records of one write, behind the chain, and answer the moment of the last one. The
+ * stamp rises past the last line's, so two records of one request and two requests in one
+ * millisecond each get their own moment; the file is rewritten to `keep` lines once it has grown
+ * past twice that, so a rewrite is rare and the read never walks an unbounded file.
  */
-function append(log: ChangeLog, kind: string, records: ChangeRecord[], undoes?: string): void {
+function append(log: ChangeLog, kind: string, records: ChangeRecord[], undoes?: string): string {
@@ -370,14 +378,18 @@
         writeTextAtomic(log.file, `${kept.join('\n')}\n`, MODE);
-        return;
+    } else {
+        appendFileSync(log.file, `${closing}${written.join('\n')}\n`, {
+            encoding: 'utf8',
+            mode: MODE
+        });
     }
-    appendFileSync(log.file, `${closing}${written.join('\n')}\n`, { encoding: 'utf8', mode: MODE });
+    return new Date(moment - 1).toISOString();
 }
 
 /**
- * Record what one write changed. A write that changed nothing, and a request whose target names no
- * log, write nothing at all.
+ * Record what one write changed, and announce it on the log's hub. A write that changed nothing,
+ * and a request whose target names no log, write and announce nothing at all.
  */
@@ -388,7 +400,8 @@ export async function logChanges(
-    await chained(log.writes, () => append(log, kind, records, undoes));
+    const at = await chained(log.writes, () => append(log, kind, records, undoes));
+    log.hub?.publish('changes', { at } satisfies ChangesPayload);
 }
--- a/tools/oculus/src/lib/server/edit/writes.ts
+++ b/tools/oculus/src/lib/server/edit/writes.ts
@@ -329,7 +329,8 @@ export function target(
                       writes: server.fsWrites,
-                      undoDir: join(appData, '.undo')
+                      undoDir: join(appData, '.undo'),
+                      hub: server.hub
                   },
--- a/tools/oculus/src/lib/state/client/context.ts
+++ b/tools/oculus/src/lib/state/client/context.ts
@@ -204,7 +204,7 @@
-    const changes = withQueries('changes', createChanges(queries));
+    const changes = withQueries('changes', createChanges(queries, entities));
--- a/tools/oculus/src/lib/state/client/shapes/payloads.ts
+++ b/tools/oculus/src/lib/state/client/shapes/payloads.ts
@@ -269,6 +269,7 @@
     jump: jumpShape,
+    changes: z.object({ at: z.string().min(1) }),
     'app-hosts': appHostsShape,
--- a/tools/oculus/src/lib/state/sessions/changes.svelte.ts
+++ b/tools/oculus/src/lib/state/sessions/changes.svelte.ts
@@ -7,6 +7,12 @@
 // server/core/changes.ts holds the same shape on its own side.
 //
+// The server announces each append on the `changes` channel with the moment of the newest record.
+// A store that holds the log and has no row that new reads the first page again, and puts it in
+// front of the rows it holds when the page reaches the newest of them, so a write made by any page,
+// an app's host or the server shows in an open History at once and the older pages the reader
+// loaded stay. While a request is out, the read again follows it.
+//
@@ -23,7 +29,7 @@
-import type { Fetcher, Queries } from '../shared/stores/shapes.ts';
+import type { EntitiesStore, Fetcher, Queries } from '../shared/stores/shapes.ts';
@@ -124,6 +130,22 @@ const KEY = ['changes'];
+/**
+ * The first page read again in front of the rows held: the rows the page does not reach follow it
+ * when the page holds the newest row held, and the page alone stands when it does not, since rows
+ * would then be missing between the two.
+ */
+function ahead(fresh: Held, held: Held | undefined): Held {
+    const rows = held?.rows ?? [];
+    const oldest = fresh.rows.at(-1)?.at;
+    if (fresh.error !== '' || oldest === undefined || rows.length === 0) return fresh;
+    if (!fresh.rows.some((row) => row.at === rows[0].at)) return fresh;
+    const behind = rows.filter((row) => row.at < oldest);
+    return behind.length === 0
+        ? fresh
+        : { ...fresh, rows: [...fresh.rows, ...behind], more: held?.more ?? false };
+}
+
@@ -153,9 +175,23 @@
-export function createChanges(queries: Queries): ChangesStore {
+export function createChanges(queries: Queries, entities: EntitiesStore): ChangesStore {
     const first: Fetcher<Held> = (held) => page(held);
 
+    /** The first page read again in front of the rows held, for an announced append. */
+    const newer: Fetcher<Held> = async (held) => ahead(await page(held), held);
+
+    // An append the store already holds the row of, and a log the store has not read, ask nothing:
+    // the first read of the log reads the newest page.
+    entities.afterReceive((message) => {
+        const said = entities.payloadOf(message, 'changes');
+        const held = queries.peek<Held>(KEY).data;
+        if (said === null || held === undefined || !inBrowser()) return;
+        const newest = held.rows.at(0)?.at;
+        if (newest !== undefined && newest >= said.at) return;
+        queries.refetch(KEY, newer, 'again');
+    });
+
--- a/tools/oculus/src/lib/state/shared/stores/shapes.ts
+++ b/tools/oculus/src/lib/state/shared/stores/shapes.ts
@@ -25,6 +25,7 @@ import type {
     Jump,
+    ChangesPayload,
     Message,
@@ -52,6 +53,7 @@ export type Payloads = {
     jump: Jump;
+    changes: ChangesPayload;
     'app-hosts': AppHostsPayload;
--- a/tools/oculus/src/routes/+page.svelte
+++ b/tools/oculus/src/routes/+page.svelte
@@ -290,7 +290,8 @@
             'debug-console',
-            'jump'
+            'jump',
+            'changes'
         ]);
```

`git diff --stat` in the copy: 8 files changed, 75 insertions(+), 15 deletions(-). Sizes after the fix (`wc -l`): changes.svelte.ts 244 lines, changes.ts 419 lines.

For `premise`, the test's source as written (`tests/state/sessions/history-live.test.ts`):

```ts
// Layer 2, client state test. A write made while the History view is open shows in its rows
// without the view being opened again, as VS Code's Timeline shows a new entry: the server
// announces each append to the change log on the `changes` channel, and the store of the log reads
// the newest page again when it hears one, keeping the older rows the reader loaded.
//
// The world is tests/state/sessions/history-live-fixture.ts: the server's own target, writers and
// channel hub on one side, the page's own client and socket store on the other.
//
// What this does NOT cover: what History.svelte draws of the rows, which is seen on screen.

import { afterEach, describe, expect, vi } from 'vitest';
import { PAGE } from '../../../src/lib/server/core/changes.ts';
import { it } from '../../fixtures/scratch.ts';
import {
    PAGE_CHANNELS,
    addConfiguration,
    held,
    lines,
    opened,
    structured,
    world,
    writeFile
} from './history-live-fixture.ts';

afterEach(() => vi.unstubAllGlobals());

describe('a write made while History is open', () => {
    it.each([
        ['a structured write through /api/write', structured, 'status.line'],
        ["an app's Write File", writeFile, 'write-file'],
        ['an Add Configuration', addConfiguration, 'add-configuration']
    ])('shows %s in the open view', async (_name, write, field) => {
        const w = world();
        expect(await opened(w)).toBe(0);
        await write(w);
        expect(await held(field, () => w.client.changes.rows())).toBe(true);
    });

    it('shows the write on top and keeps the older page the reader loaded', async () => {
        const w = world();
        await lines(w, PAGE + 5);
        expect(await opened(w)).toBe(PAGE);
        w.client.changes.older();
        await vi.waitFor(() => expect(w.client.changes.rows()).toHaveLength(PAGE + 5));
        await structured(w);
        expect(await held('status.line', () => w.client.changes.rows())).toBe(true);
        const rows = w.client.changes.rows();
        expect([rows.length, rows[0].field, rows.at(-1)?.field]).toEqual([
            PAGE + 6,
            'status.line',
            'earlier-0'
        ]);
    });

    it('shows a write made while its tab was hidden once the tab is shown', async () => {
        const w = world();
        let shown = true;
        const tab = w.client.tabScope.wrap(w.client, () => shown);
        expect(await opened(w, tab.changes)).toBe(0);
        shown = false;
        await structured(w);
        shown = true;
        expect(await held('status.line', () => tab.changes.rows())).toBe(true);
    });

    it('shows a write made while the page was not connected once it connects again', async () => {
        const w = world();
        expect(await opened(w)).toBe(0);
        w.client.socket.disconnect();
        await structured(w);
        w.client.socket.connect(PAGE_CHANNELS);
        expect(await held('status.line', () => w.client.changes.rows())).toBe(true);
    });

    it('shows a write whose append cut the log to its window', async () => {
        const w = world();
        w.log.keep = 2;
        await lines(w, 4);
        expect(await opened(w)).toBe(4);
        await structured(w);
        expect(await held('status.line', () => w.client.changes.rows())).toBe(true);
    });

    it('shows two writes made at once', async () => {
        const w = world();
        expect(await opened(w)).toBe(0);
        await Promise.all([structured(w), writeFile(w)]);
        expect(await held('status.line', () => w.client.changes.rows())).toBe(true);
        expect(await held('write-file', () => w.client.changes.rows())).toBe(true);
    });
});
```

The helper (`tests/state/sessions/history-live-fixture.ts`):

```ts
// Layer 4, test helper. The world the History view's live rows are tested in: the server's own
// change log and writers on one side, the page's own client on the other, joined by the channels.
//
// Server side: the change log is the one the server's `target()` (server/edit/writes.ts) builds,
// handed a channel hub (server/core/channels.ts) as the server's context hands it, over a scratch
// hub whose every path is asserted to be under the system temporary directory. The writes go
// through the server's writers over that log: a structured write through handleWrite (POST
// /api/write), an app's Write File through runOps with the app named over the apps' own write chain
// (server/root/process/apps-hosts.ts), and Add Configuration through appendConfiguration (POST
// /api/debug).
//
// Page side: the client is built through its own wiring (state/client/context.ts). Its socket store
// opens a WebSocket whose other end is the hub, and subscribes to the channels
// src/routes/+page.svelte connects, read from that file so the world follows the page. GET
// /api/changes is answered by the real handler over the same log.

import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { expect, vi } from 'vitest';
import { createClientState, type ClientState } from '../../../src/lib/state/client/context.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import type { LocalConfig } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import { handleChanges, logChanges, type ChangeLog } from '../../../src/lib/server/core/changes.ts';
import { Hub, type Sink } from '../../../src/lib/server/core/channels.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { mintToken } from '../../../src/lib/server/core/auth.ts';
import { handleWrite, target, type WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { runOps, type OpsTarget } from '../../../src/lib/server/files/fs/ops.ts';
import { appendConfiguration } from '../../../src/lib/server/machine/debug/launch/write.ts';
import type { OpenWorkspace } from '../../../src/lib/server/files/workspace/open.ts';
import { scratchDir } from '../../fixtures/scratch.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const TOKEN = mintToken();
const HOST = '127.0.0.1:8796';
const MANIFEST =
    'id: alpha\ntier: projects\ntype: active\ntitle: "A title"\nstatus:\n  line: "the line"\n';

/** The channels src/routes/+page.svelte connects, read from its `connect([...])` call. */
export const PAGE_CHANNELS = [
    ...(
        /connect\(\[([^\]]*)\]\)/.exec(
            readFileSync(join(import.meta.dirname, '../../../src/routes/+page.svelte'), 'utf8')
        )?.[1] ?? ''
    ).matchAll(/'([^']+)'/g)
].map((one) => one[1]);

export type World = {
    client: ClientState;
    into: WriteTarget;
    log: ChangeLog;
    ops: OpsTarget;
    hub: string;
};

/** A WebSocket whose other end is the hub: what the page subscribes to, the hub sends it. */
function fakeSocket(server: Hub): unknown {
    return class FakeSocket extends EventTarget {
        static OPEN = 1;
        readyState = 0;
        readonly #sink: Sink;
        constructor() {
            super();
            this.#sink = {
                send: (text) => {
                    const event = new Event('message') as Event & { data: string };
                    event.data = text;
                    this.dispatchEvent(event);
                    return Promise.resolve();
                },
                close: () => undefined
            };
            setTimeout(() => {
                this.readyState = 1;
                this.dispatchEvent(new Event('open'));
            }, 0);
        }
        send(text: string): void {
            const sent = JSON.parse(text) as { type: string; channels: string[] };
            if (sent.type === 'subscribe') server.subscribe(this.#sink, sent.channels);
        }
        close(): void {
            this.readyState = 3;
            server.remove(this.#sink);
            this.dispatchEvent(new Event('close'));
        }
    };
}

/** A scratch hub, its log and its writers, and a page connected to them. */
export function world(): World {
    const hub = realpathSync(scratchDir('oculus-history-live-'));
    const folder = join(hub, 'projects', 'manuscripts', 'alpha');
    mkdirSync(folder, { recursive: true });
    writeFileSync(join(folder, 'project.yml'), MANIFEST);
    writeFileSync(join(hub, 'a.txt'), 'hello\n');
    const roots = [{ key: 'hub', dir: hub }];
    const open: OpenWorkspace = {
        file: null,
        name: '',
        hub: '',
        folders: [],
        primary: 'hub',
        primaryDir: hub,
        hubs: [{ name: 'hub', dir: hub }],
        roots,
        findings: [],
        unreadable: null,
        recent: [],
        available: [],
        stateFile: join(hub, 'state.yml'),
        stateFolder: hub
    };
    const local = {
        changes: join(hub, 'changes.jsonl'),
        history: join(hub, 'history')
    } as LocalConfig;
    const channels = new Hub();
    const server = { hub: channels, fsWrites: fsWrites(), opsWrites: fsWrites() };
    const merged = loadConfig(engineDir()).config;
    const into = target(engineDir(), merged, { open, local }, server, join(hub, 'app-data'));
    const log = into.changes;
    if (log === undefined) throw new Error('the target carries no change log');
    for (const path of [log.file, log.undoDir ?? hub]) {
        expect(resolve(path).startsWith(resolve(hub) + sep)).toBe(true);
    }
    const ops: OpsTarget = {
        roots,
        writes: server.opsWrites,
        changes: log,
        history: join(hub, 'history'),
        home: hub
    };
    vi.stubGlobal('fetch', (url: string) => {
        if (url.startsWith('/api/changes')) {
            return Promise.resolve(handleChanges(new Request(`http://${HOST}${url}`), log));
        }
        return Promise.resolve(new Response('{}', { status: 200 }));
    });
    const client = createClientState();
    // The page's own `window`, `location` and `WebSocket`; stubbed after the client is built, since
    // the build follows a real page's events.
    vi.stubGlobal('window', {});
    vi.stubGlobal('location', { host: HOST, href: `http://${HOST}/` });
    vi.stubGlobal('WebSocket', fakeSocket(channels));
    client.socket.connect(PAGE_CHANNELS);
    return { client, into, log, ops, hub };
}

/** Lines in the log before the view opens, each one manifest record of its own. */
export async function lines(w: World, count: number): Promise<void> {
    for (let at = 0; at < count; at += 1) {
        await logChanges(w.log, 'manifest', [
            {
                file: '/x/a.yml',
                key: 'a',
                field: `earlier-${at}`,
                before: 0,
                after: 1,
                undo: 'none'
            }
        ]);
    }
}

/** Open the view: read the rows once, as History.svelte's first render does, and wait for them. */
export async function opened(w: World, rows = w.client.changes): Promise<number> {
    await vi.waitFor(() => expect(w.client.socket.status()).toBe('open'));
    rows.rows();
    await vi.waitFor(() => expect(rows.loading()).toBe(false));
    return rows.rows().length;
}

/**
 * Whether the rows hold a row of the field within a second, read as the open view reads them: the
 * view's derived reads `rows()` again whenever the query it reads changes, and a read of a held
 * key that nothing marked asks the endpoint nothing, so a read every 10 ms reads no more than the
 * view.
 */
export async function held(
    field: string,
    rows: () => { field: string }[],
    timeout = 1000
): Promise<boolean> {
    try {
        await vi.waitFor(() => expect(rows().some((row) => row.field === field)).toBe(true), {
            timeout,
            interval: 10
        });
        return true;
    } catch {
        return false;
    }
}

/** A structured write of one manifest field through POST /api/write. */
export async function structured(w: World): Promise<void> {
    const response = await handleWrite(
        new Request(`http://${HOST}/api/write`, {
            method: 'POST',
            headers: {
                host: HOST,
                origin: `http://${HOST}`,
                'sec-fetch-site': 'same-origin',
                'content-type': 'application/json',
                'x-oculus-token': TOKEN
            },
            body: JSON.stringify({
                kind: 'manifest',
                id: 'alpha',
                fields: { 'status.line': 'a new line' }
            })
        }),
        TOKEN,
        w.into
    );
    expect(response.status).toBe(200);
}

/** An app's Write File: an upload over a file of the root, made by the app's host. */
export async function writeFile(w: World): Promise<void> {
    const answer = await runOps(
        w.ops,
        {
            op: 'upload',
            root: 'hub',
            path: '',
            name: 'a.txt',
            data: Buffer.from('changed\n', 'utf8').toString('base64'),
            replace: true
        },
        { trashReplaced: false, app: 'app:notes' }
    );
    expect(answer.ok).toBe(true);
}

/** Add Configuration: a configuration appended to the root's `.oculus/launch.yml`. */
export async function addConfiguration(w: World): Promise<void> {
    const added = await appendConfiguration(w.ops, w.hub, {
        name: 'Run',
        type: 'node',
        request: 'launch'
    });
    expect(added.ok).toBe(true);
}
```

Runs after the fix:

```
$ HOME=$tmp/home npx vitest run --project unit tests/state/sessions/history-live.test.ts --reporter verbose
 <check mark> ... > shows a structured write through /api/write in the open view 330ms
 <check mark> ... > shows an app's Write File in the open view 293ms
 <check mark> ... > shows an Add Configuration in the open view 291ms
 <check mark> ... > shows the write on top and keeps the older page the reader loaded 359ms
 <check mark> ... > shows a write made while its tab was hidden once the tab is shown 279ms
 <check mark> ... > shows a write made while the page was not connected once it connects again 317ms
 <check mark> ... > shows a write whose append cut the log to its window 306ms
 <check mark> ... > shows two writes made at once 425ms
      Tests  8 passed (8)
$ HOME=$tmp/home npx vitest run --project unit tests/state/sessions/changes-page.test.ts --reporter verbose   (the red command, which is also the original, unshrunk case)
 <check mark> ... > shows a structured write through /api/write in the open view 361ms
 <check mark> ... > shows an app's Write File in the open view 313ms
 <check mark> ... > shows an Add Configuration in the open view 279ms
      Tests  3 passed (3)
$ HOME=$tmp/home npx vitest run --project unit tests/state/sessions/history-other.test.ts --reporter verbose   (the inputs not part of the defect)
 <check mark> ... > shows a write made before the view opened, on the first read 309ms
 <check mark> ... > shows the view's own undo after its reload, one page as the reload reads 364ms
 <check mark> ... > holds the rows it had for a write that changed nothing, and asks nothing 482ms
      Tests  3 passed (3)
$ HOME=$tmp/home npx vitest run <the history tests, tests/server/core/changes.test.ts, tests/routes/edit/undo, tests/routes/files/file-undo.test.ts, tests/server/machine/apps/tools/workspace.test.ts, tests/routes/machine/debug.test.ts, tests/state/client, tests/state/sessions/changes-file.test.ts>
 Test Files  11 passed (11)
      Tests  111 passed (111)
$ npx eslint <the 8 changed files> tests/state/sessions/   -> no output
$ npm run check   -> COMPLETED ... 0 ERRORS
$ npm run test:quick (over the fix with the harness files)   -> prettier ok, ASCII gate ok, svelte-check ok (489 files, 0 errors), vitest ok; eslint then named two lines (changes.svelte.ts `held.rows[0]?.at`, and the red command file), both changed, eslint rerun clean
```

The other inputs that are part of the defect are the test's own cases, so their runs after the fix are the first block. The other inputs that are not part of the defect are the third block.

**For the session and the brief.** These come from this diagnosis and decide how the fix is built:

- **A test with no `agents/guarded.md` entry.** `agents/spec.md:58` lets a builder write a test only as the test of an entry. G9 ("Each write is logged, and its undo puts the file back", guarded.md:67-69) names `src/lib/server/core/changes.ts` but not the client store or the channel. The test above needs G9 widened, or a new entry. Either is Axel's ruling before the builder writes it.
- **A new wire shape.** The fix adds a `changes` channel with the payload `{ at: string }` (`ChangesPayload`). `agents/spec.md:18` counts a wire format as a user-visible shape that the brief must name. `src/lib/data/helpers/files/apps/apps.ts` classes a channel it does not name as `unknown`, which closes it to apps, so the log stays closed to apps.
- **The fixture reads `+page.svelte` as text** to find the page's channel list. A reviewer may read that as an assertion over source text. The alternative is a module (for example `src/lib/state/client/channels.ts`) that exports the list, which both `+page.svelte` and the fixture import. I recommend the module. The builder or the session decides.
- **Timing.** Each test case takes about 300 ms when green. The red side waits out a 1 s `vi.waitFor` deadline, so the file takes about 10 s red and about 2.6 s green. `agents/spec.md:58` asks for a test to run in well under a second, and tags one that cannot as slow. The builder judges which applies.
- **Documents the builder updates** under `agents/spec.md:69`:
  - the change-log paragraph of `DESIGN.md:156`, which should say that each append is announced on the `changes` channel and that an open History reads it again;
  - the `history` row of `HELP.md:215`, or a bullet near it, which should say that a write shows in an open History at once.

  The head comments of `changes.ts` and `changes.svelte.ts` are already in the fix.

No test reaches it: not applicable. No test is written: not applicable.

## Cleanup

```
$ grep -rn "DIAG-5c1e" tools/oculus/src tools/oculus/tests      (in the scratch copy, after every probe was undone)
(no output, exit 1)
```

The tag `DIAG-5c1e` is not unique to this diagnosis. The same tag is in the committed record `tools/oculus/.scratch/migration/agents/reviews/X3f-diagnosis.md:915-949`, so a grep of the whole tree hits that file. There are no hits in `src` or `tests`.

The scratch copy was removed with `git worktree remove --force /var/folders/7r/49ks4w4558vcr57tvb9svmph0000gp/T/diagnose.LfafA1/tree`, run from the main checkout. `$tmp` was then deleted with everything in it:

- the scratch home;
- the copies of the original files used to undo the probes, and the probe diffs;
- the run logs;
- the harness files `changes-live.test.ts` and `changes-shrink.test.ts`.

`git worktree list | grep -c diagnose.LfafA1` prints 0. No credential or `.env` file was copied. The scratch hubs the cases made were swept by `tests/fixtures/scratch.ts`, and no `oculus-history-*` folder is left in `$TMPDIR`.

No file of the main checkout was changed. Its `git status --short` lists only the orchestrator's own ledger files and `agents/briefs/D74.md`.

Carried by the brief as its check.
