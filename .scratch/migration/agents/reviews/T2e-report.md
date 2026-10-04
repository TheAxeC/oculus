Everything in the brief is done.

## Open items

None.

## First read of the cases, on the unchanged tree

The base is a copy of the tree at the brief's head (113 test files, 18,887 lines in `tests/`, the numbers the brief gives). Each case below was run against it before any change.

- Workspaces file holding `{not json`, then an add-root: the route answered 200 `{"ok":true,"changed":["workspaces"],"refused":[]}` and the file afterwards held `{"current":"","workspaces":[{"name":"","roots":[{"key":"add",...}]}]}`. The unreadable file was replaced. A missing workspaces file: 200, file written.
- Overrides file holding `[]`, then `setFlag('s1','top',true)`: answered `{"changed":["top"],"refused":[],...}` and the file afterwards held `{"sessions":{"s1":{"top":true}}}`. The `[]` was replaced. A missing overrides file: written.
- Layout storage holding `oculus.layout.v1` = `garbage`: after `loadLayout` and `openPage`, `oculus.layout.unread` is undefined and `oculus.layout.v1` holds the default (test 'is kept under the unread key when the next change writes the default', failing run below). No `oculus.layout.v1` saved: no `oculus.layout.unread` is written (the test 'leaves the unread key empty for a layout that reads and for none saved' passes on the unchanged tree).
- Bookmarks file (item 10): `createEntry`, `writeEntry`, `removeEntry` and `reorderCollection` called with the reader's own file holding each of `{not yaml: [`, `just text`, an empty file, `- a\n- b\n` and `entries: [\n`: every call answered `{"found":false,"changed":[],"refused":[]}` and the file afterwards held its original bytes in all five cases. The writer refuses.
- The deletion cases of the brief's "Cases" list were read, not run: each file named was read whole before it was cut.

## DONE / NOT DONE

| Row | State | Command |
| --- | --- | --- |
| Items 1 and 2: the second test of each of the 34 pairs of the brief's table deleted, with the helpers and imports only they used | DONE | for the 23 rows whose file remains, `grep -F` of the Delete title in its file printed 0 lines; the other 11 rows were in the 8 files that are gone; for the 33 Keep titles `grep -F` in their files printed 1 line each (script run from `tools/oculus`) |
| Item 3: comment and DESIGN.md words naming deleted test files | DONE | stale-path search below prints nothing; it printed 28 hits on the unchanged tree |
| Item 4: `allow-duplication.txt` | DONE, no line changed | `tests/checks/tree/allow-duplication.txt` is byte-identical to the base copy and the duplication check passes |
| Item 7: workspaces file refuses | DONE | `tests/server/files/workspaces.test.ts` |
| Item 8: overrides file refuses | DONE | `tests/server/sessions/overrides.test.ts`, `tests/routes/edit/write.test.ts` |
| Item 9: unread layout kept aside | DONE | `tests/state/workbench/layout/saved/layout-unread.test.ts` |
| Item 10: bookmarks writer | DONE, it already refuses; no change | finding below |
| Item 11: tests, each failing on the unchanged tree | DONE | failing runs below |
| Unused exports | DONE | `sh utils/unused-exports.sh` prints 381 lines, `diff` against the unchanged tree's output prints nothing |
| ASCII gate of spec.md | DONE | the perl command prints nothing |
| History-word grep | DONE | below |

Stale-path search, from `tools/oculus`, prints nothing; `grep -rn "git-write.test.ts" src` prints nothing (exit 1):

    LC_ALL=C grep -rnoE 'tests/[A-Za-z0-9_./-]+\.test\.ts' src tests utils DESIGN.md README.md docs | (each path tested with [ -e ])

History words, grepped over every added or changed line of the changed comments, DESIGN.md and test titles (`grep -inE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands"`): no line.

Verify list, `npm run diagrams` then `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, exit 0, printed (the vite output of `npm run build`, between `$ npm run build` and `$ npm run format:check`, is not quoted):

```
$ npm test

> oculus@0.0.1 test
> vitest run --tagsFilter '!slow' --exclude 'tests/checks/**'


 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/T2e/tools/oculus


 Test Files  76 passed | 16 skipped (92)
      Tests  171 passed | 55 skipped (226)
   Start at  16:35:00
   Duration  19.26s (transform 12.14s, setup 0ms, import 60.89s, tests 7.76s, environment 44ms)

$ npm run test:checks

> oculus@0.0.1 test:checks
> vitest run tests/checks --tagsFilter '!slow' --testTimeout 0 --hookTimeout 0


 RUN  v4.1.11 /Users/axelfaes/workspace/research-hub/.agents/worktrees/T2e/tools/oculus


 Test Files  15 passed | 1 skipped (16)
      Tests  224 passed | 3 skipped (227)
   Start at  16:35:22
   Duration  33.74s (transform 16.94s, setup 0ms, import 53.08s, tests 56.87s, environment 3ms)

$ npm run check

> oculus@0.0.1 check
> svelte-kit sync && svelte-check --tsconfig ./tsconfig.json

1791124569472 START "/Users/axelfaes/workspace/research-hub/.agents/worktrees/T2e/tools/oculus"
1791124569485 COMPLETED 2772 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
[vite build output, lines 37 to 756 of the log, not quoted]

$ npm run format:check

> oculus@0.0.1 format:check
> prettier --check .

Checking formatting...
All matched files use Prettier code style!
$ npm run lint

> oculus@0.0.1 lint
> eslint .

$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

The tagged-slow tests are outside `npm test`; every test file this step touches was also run whole, slow cases included: `npx vitest run tests/routes/edit tests/routes/files/fs.test.ts tests/routes/git tests/routes/machine tests/routes/replace/ops-replace.test.ts tests/routes/sessions/terminal.test.ts tests/server/core tests/server/machine/pty/sessions.test.ts tests/server/machine/commands/run.test.ts tests/server/sessions tests/server/files/workspaces.test.ts tests/state/workbench tests/data/sources/personal.test.ts tests/state/sources/repositories/diff/comment-draft.client.test.ts` printed `Test Files  27 passed (27)`, `Tests  61 passed (61)`.

## Tests deleted, per entry

Each row of the brief's table, the Delete column (the Keep column of each row is unchanged):

- G1, the write route: `server/core/auth.test.ts` 'refuses a write that carries no token'
- G1, the ops route: `routes/replace/preview.test.ts` 'refuses a preview posted without the write token and reads nothing'
- G2, the fs route: `routes/files/fs.test.ts` 'answers the config folder of the engine under the engine root, and nothing above it'
- G2, the ops route: `routes/replace/ops-replace.test.ts` 'refuses `binary`, `missing` and `outside` by file'
- G2, the search route: `data/helpers/search.test.ts` 'answers a plan with the refusal for a folder that climbs out'
- G7, the commands route: `routes/machine/commands.test.ts` 'saves a line that writes a placeholder inside quotes, after a backslash or in a comment'
- G7, the hpc route: `routes/machine/hpc.test.ts` 'returns 400 for a bad body or id'
- G7, the open route: `server/files/open-bin.test.ts` 'refuses anything but an https address, and runs no program for it'
- G8, a manifest field: `routes/edit/write.test.ts` 'writes the field and says what changed'
- G8, the deck lists: `routes/edit/write.test.ts` 'writes both lists into the deck file and keeps every other byte of it'
- G8, a session override: `routes/edit/write.test.ts` 'pins a session to the top of its group through the route, and takes it off'
- G8, a config key: `routes/edit/config-key.test.ts` 'answers what changed, writes the file and records the change as a setting'
- G8, a config value: `routes/edit/config-value.test.ts` 'answers what changed, writes the file and records the change as a setting'
- G8, the stale base: `routes/edit/config-value.test.ts` 'refuses the second of two writes of one key made at once with the same base'
- G9, the undo of a clear: `server/edit/yaml/yaml-edit-removed.test.ts` 'gives back every shape a clear takes text out in'
- G9, a save cut short: `server/core/json.test.ts` 'is left as it was, the old content with it, by a write under a file'
- G12, the rail list of `layout.yml`: `state/workbench/navigation/rail.test.ts` 'finds nothing wrong with the shipped rail list'
- G28, closing a tab with unsaved text: `state/workbench/navigation/pages.test.ts` 'keeps the unsaved question for one tab holding unsaved text'
- G28, closing a tab with a running terminal: `state/workbench/navigation/pages.test.ts` 'asks the busy question over one tab, naming the terminal and its program'
- G31, the approvals file: `routes/machine/commands.test.ts` 'answers the reason when the approvals file cannot be written over'
- G33, the eleven plain actions: `routes/git/git.test.ts` 'takes each plain action with no confirm'
- G33, stage: `routes/git/git.test.ts` 'takes a stage, which needs no confirm'
- G33, commit: `routes/git/git.test.ts` 'takes a commit that the page confirmed'
- G33, checkoutDetached: `routes/git/refs.test.ts` 'detaches HEAD at a confirmed hash'
- G33, createBranch: `routes/git/refs.test.ts` 'makes a branch and a tag at the start point the body names'
- G33, cherryPick and deleteBranch: `routes/git/refs.test.ts` 'cherry-picks a confirmed commit and deletes a confirmed merged branch'
- G33, deleteBranchAnyway: `routes/git/refs.test.ts` 'answers a branch git calls unmerged with the code not-merged, and deletes it on Delete Anyway'
- G33, trashUntracked: `routes/git/untracked.test.ts` 'moves a confirmed untracked file to the Trash'
- G33, ignore: `routes/git/untracked.test.ts` 'appends the path without a confirm and answers the file it wrote'
- G35, start: `server/machine/pty/sessions.test.ts` 'refuses a cwd that is not an absolute existing directory'
- G35, stop: `routes/sessions/terminal.test.ts` 'refuses the stop and the resize with a reason, and runs no tmux command'
- G35, steer and interrupt: `server/machine/pty/sessions.test.ts` 'steers with the text as bytes, then Enter, and interrupts with Escape'
- G35, resume: `server/machine/pty/sessions.test.ts` 'starts a resumed terminal in the session directory, with the resume as its command'
- G35, compose: `server/machine/pty/compose.test.ts` 'runs the agent with its picks, `--` and the prompt as one last word'

Files deleted whole (each was the last test of its file): `tests/routes/replace/preview.test.ts`, `tests/data/helpers/search.test.ts`, `tests/server/files/open-bin.test.ts`, `tests/server/edit/yaml/yaml-edit-removed.test.ts` (and the then empty folder `tests/server/edit/yaml`), `tests/server/core/json.test.ts`, `tests/state/workbench/navigation/rail.test.ts`, `tests/routes/git/refs.test.ts`, `tests/server/machine/pty/compose.test.ts`. `tests/routes/git/request.ts` stays: `git.test.ts` and `untracked.test.ts` import it.

Helpers, constants and imports deleted with their tests (from `diff` of each file against the unchanged copy):

- `tests/routes/edit/write.test.ts`: import `parse` from `yaml`; `deckOf`, `deckTarget`, `overridesOf` from the fixture import.
- `tests/routes/files/fs.test.ts`: import `handleFs`, `ENGINE_ROOT`, `engineRoot`; helper `get`.
- `tests/routes/edit/config-value.test.ts`: constant `WAITING`.
- `tests/routes/machine/commands.test.ts`: helper `answer`.
- `tests/routes/git/untracked.test.ts`: imports `realpathSync`, `join`.
- `tests/server/core/auth.test.ts`: imports `TOKEN_HEADER`, `gatedBody`.
- `tests/server/machine/pty/sessions.test.ts`: imports `join`, `resizeArgs`, `resumeArgs`, `interruptTerminal`, `startArgs`, `it`/`scratchDir` from the scratch fixture, and the helpers and constants only the three deleted cases used.
- `tests/state/workbench/navigation/pages.test.ts`: import `setCatalog`, `t`.
- `tests/routes/replace/ops-replace.test.ts`, `tests/routes/git/git.test.ts`, `tests/routes/sessions/terminal.test.ts`, `tests/routes/machine/hpc.test.ts`, `tests/routes/edit/config-key.test.ts`: the locals and the head words of the deleted cases only.

No fixture export became unused: the unused-exports output equals the unchanged tree's.

## Items 7 to 10, files changed

- `src/lib/server/core/json.ts` (+24): new `readJsonChecked(path)`, answering `{ ok: true, value: undefined }` for a missing file, `{ ok: true, value }` for one that parses, and `{ ok: false, reason: 'is not JSON' | 'cannot be read' }`. `saved.ts` and `approvals.ts` (the files `load` of the saved commands file and the approvals file) call it instead of their own copy of the same read, with the same reasons.
- `src/lib/server/files/fs.ts` (+48 -10): `readSaved` keeps reading a broken file as nothing saved (the GET); a write goes through new `loadSaved(file, reserved)`, which answers the reason `<file name> <reason>: <path>` for a file that is not JSON, cannot be read, or is not the shape `foldSaved` (the former body of `readSaved`) reads. `act` answers it as `json({ error }, { status: 400, headers: NO_STORE })`, as the other refusals of POST /api/fs are answered. The file is not written. The page names the sentence through the fallback `files.refused_other` ("The server refused that: workspaces.json is not JSON: <path>"), since `refusal()` in `src/lib/state/sources/explorer/acts/refusal.ts` says any code it does not list with the code itself.
- `src/lib/server/sessions/overrides.ts` (+31 -7): new `load(file)` over `readJsonChecked`. `setFlag` and `setOverride` compute their change on an empty map when the file does not read, and when the change would write, answer `refused: [{ field, reason: '<file name> <reason>: <path>' }]` (one entry per field `setOverride` would have changed, `[...refused, ...]` keeping its own refusals) and write nothing. A change that changes nothing answers as before and writes nothing. `overrides()` and `hiddenIds()` still read a broken file as none.
- `src/lib/server/edit/writes.ts` (+1): the `setFlag` loop of the session write now pushes `outcome.refused` into the answer, as the `setOverride` branch already did.
- `src/lib/state/workbench/layout/saved/storage.ts` (+7): `export const UNREAD_KEY = 'oculus.layout.unread'`. `layout/index.ts` exports it. `layout.svelte.ts` (+9 -5): `loadLayout` copies a non-empty `LAYOUT_KEY` value that `parseLayout` answers `null` for under `UNREAD_KEY` through `storage.remember`, before anything writes `LAYOUT_KEY`; a later unreadable value replaces the copy; the `loadLayout` doc comment is re-wrapped whole.
- `docs/diagrams/writes.dot` and `writes.svg`: regenerated by `npm run diagrams` (a line number of `fs.ts` and the tooltip of the `overrides.ts` to `json.ts` edge). They are outside the paths the brief lists; the verify list requires the diagram run first.

Item 10, the bookmarks file. `collectionFile` (`src/lib/server/edit/writes/entries.ts:69-79`) returns the reader's own file for the key `bookmarks`. `readCollection` (`entries.ts:235-266`) reads it in a `try` (`:244-248`), parses it in a `try` (`:250-254`) and returns `null` when the parse throws or the result is not a map (`:255`). `writeEntry` (`:351`), `reorderCollection` (`:451`), `removeEntry` (`:481`) and `createEntry` (`:513`) each answer `{ found: false, changed: [], refused: [] }` on `null` before any `writeTextAtomic`. The first read above shows five unparseable or wrong-shape bodies left byte for byte. A file with no list is written only when it is the reader's own and parses (`:262-264`). No code changed. No test shows the refusal: `grep -rn "not yaml\|unparse\|does not parse" tests/routes/edit tests/server/edit` prints nothing and no test passes the reader's own file an unparseable body. Item 11 asks for a test only for a file items 7 to 10 change, so none was added.

## Item 11, the new tests and their failing runs on the unchanged tree

The unchanged-tree runs were made in the copy of the base with `node_modules` linked and the new test file copied in.

1. `tests/server/files/workspaces.test.ts`, 'writes a missing file and refuses one that does not read, leaving it as is': a missing file is written (200, `current` is `second`), then a table of `{"current": ` (is not JSON), `["a", "list"]` (is not the shape) and a folder in the file's place (cannot be read), each answered 400 with `<file name> <reason>: <path>` and left as it was. Failing run: `AssertionError: expected 200 to be 400 // Object.is equality`, `- 400`, `+ 200`.
2. `tests/server/sessions/overrides.test.ts`, 'writes a missing file and refuses one it cannot read, leaving it as it was': a missing file is written, then the same three-row table for `setOverride` (both fields refused, no records) and `setHidden` (one refusal), each file left as it was. Failing run: `AssertionError: expected [ 'area', 'title' ] to deeply equal []` at `expect(pinned.changed).toEqual([])`.
3. `tests/routes/edit/write.test.ts`, 'answers a session write over an overrides file it cannot read with the refusal': the session write through `handleWrite` answers `refused: [{ field: 'hidden', reason: 'sessions.json is not JSON: <path>' }]` and leaves the file. Failing run on the unchanged tree: `AssertionError: expected [ 'hidden' ] to deeply equal []`. Failing run with `overrides.ts` changed and the one line of `writes.ts` not: `AssertionError: expected [] to deeply equal [ { field: 'hidden', ... } ]`, `+ []`.
4. `tests/server/core/json-checked.test.ts`, 'answers each state of the file': missing, valid, not JSON, a folder. Failing run: `TypeError: readJsonChecked is not a function`.
5. `tests/state/workbench/layout/saved/layout-unread.test.ts`: 'is kept under the unread key when the next change writes the default', 'replaces the kept value with a later unreadable one', 'leaves the unread key empty for a layout that reads and for none saved'. Failing runs: `AssertionError: expected undefined to be '{"version": 99, garbage'` and `AssertionError: expected undefined to be 'first garbage'`; the third passes on the unchanged tree, as the first read shows, and guards the two no-copy cases.

All five pass after the change (`npx vitest run` on each file, and in the verify list above). The refusals of `saved.ts` and `approvals.ts` stay covered by their kept tests (`tests/server/machine/approvals/approvals.test.ts` 'reads a file that is not JSON as empty and refuses a write over it, leaving it'), which pass (`npx vitest run tests/server/machine/approvals tests/server/machine/commands`: `Test Files  3 passed (3)`, `Tests  5 passed (5)`). The duplication check ran (`npx vitest run tests/checks/tree`: `Test Files  3 passed (3)`).

## Comment and DESIGN.md changes (item 3)

DESIGN.md: lines 181, 223 (two places), 227 and 425 lost the words naming `tests/checks/diagrams/readable.test.ts`, `tests/checks/look/lane-distance.test.ts`, `tests/views/whole/type-scale.test.ts` and `tests/views/whole/chips.test.ts` (`diff` of the unchanged copy against the tree: 4 lines changed, each a whole paragraph line, so the full lines are not repeated here). The paragraph at :223 now says "ahead of any theme being applied" where it said "before a theme is applied".

Head comments of kept test files: 

```
--- tests/routes/edit/config-value.test.ts (head)
-// Layer 2, route tests. What the /api/write route does with a config-value write: a list or a
-// family written into a scratch engine's file and its record in the change log, the undo through
-// the same writer, and two writes of one key at once.
+// Layer 2, route tests. What the /api/write route does with a config-value write: the undo through
+// the same writer.
-// look's, and the render of the bytes (tests/server/edit/yaml/block-edit.test.ts).
+// look's.
--- tests/routes/machine/commands.test.ts (head)
-// /api/ before a route sees it (tests/server/root/hooks-server.test.ts), and the page's store
-// (tests/state/sessions/terminal/commands.test.ts).
-//
-// A case that takes 100 ms or more in a run of its own is tagged slow; the others run in npm test.
+// /api/ ahead of a route seeing it (tests/server/root/hooks-server.test.ts).
--- tests/routes/edit/config-key.test.ts (head)
-// Layer 2, route tests. What the /api/write route does with a config-key write: the setting written
-// into a scratch engine's file and its record in the change log, the undo through the same writer.
+// Layer 2, route tests. What the /api/write route does with a config-key write: the undo through
+// the same writer.

```

Source and test comment lines, as `diff -u` of the unchanged copy (`-`) against the tree (`+`):

```
--- src/lib/data/sources/config/catalog/options.ts
 
 /**
  * The catalog held by the merged config's `options` key, and an empty one when the key is missing
- * or is not a map. The shape inside is not checked here: the check in
- * tests/checks/config/options-catalog.test.ts fails a catalog that does not match the types above,
- * so a reader may rely on them.
+ * or is not a map. The shape inside is not checked here.
  */
 export function catalogOf(config: Record<string, unknown>): Catalog {
     return readOr(catalogShape, config.options, {});
--- src/lib/server/core/git/compare.ts
 // Open File (HEAD) and Compare with Workspace: a file as HEAD or the index holds it, the files and
 // the two sides of a file between a ref and a commit, the refs a picker offers, and the base a
 // branch is compared against. state.ts, reads.ts and files.ts hold the state of a workspace and the
-// rest of the reads; every module of this folder reaches git through run.ts's one call site, and
-// tests/server/core/git/compare-gate.test.ts holds this one to its list.
+// rest of the reads; every module of this folder reaches git through run.ts's one call site.
 //
 // DESIGN.md, "Git": exactly these read-only commands run here, besides those run.ts lists.
 //
--- src/lib/server/core/git/run.ts
 // name through GIT_LITERAL_PATHSPECS=1, so a `*` in a name matches itself.
 //
 // Nothing here may ever change a repository. Every writing subcommand belongs to Axel alone, and a
-// dashboard watcher must never be the thing that runs one. tests/server/core/git/git.test.ts holds
-// two gates over that: the folder's sources but compare.ts name no writing subcommand, and the
-// suite records every argument vector the process runs and asserts the whole suite ran only the
-// commands above, `for-each-ref`, `worktree`, `symbolic-ref`, `check-ignore`, `ls-files`, `remote`,
-// `config` and `rev-parse` only as the vectors written here. compare.ts lists its own forms in its
-// head, and tests/server/core/git/compare-gate.test.ts holds it to them.
+// dashboard watcher must never be the thing that runs one. compare.ts lists its own forms in its
+// head.
 //
 // A repository on a slow mount must not stall a watcher, so the one call site takes a list argument
 // (never a shell string), carries a timeout, and collapses any failure into the empty shape with a
--- src/lib/server/git/deposit-git.ts
 //     gh repo edit <owner/repo> --description ... --homepage ... --add-topic ...
 //     gh repo edit <owner/repo> --default-branch main
 //
-// This module exists rather than growing git-write.ts because git-write.ts's gate
-// (tests/server/git/git-write.test.ts) asserts that the force option appears nowhere in that file,
-// and the snapshot mode of DESIGN.md's step 6 needs it exactly once. Here it appears at one call
-// site, `forcePushSnapshot`, and tests/server/git/deposit.test.ts asserts that count.
+// This module exists rather than growing git-write.ts because the force option appears nowhere in
+// that file, and the snapshot mode of DESIGN.md's step 6 needs it exactly once. Here it appears at
+// one call site, `forcePushSnapshot`.
 //
 // Every operation answers `{ ok, output, error }` and never throws. Nothing here is reachable from
 // a watcher, a timer or the socket: the one caller is server/git/deposit.ts, itself reached only
 export type GitRunner = (args: string[], timeout: number) => Promise<Outcome>;
 
 /**
- * Every git subcommand this module may run. tests/server/git/deposit.test.ts asserts no other ran.
+ * Every git subcommand this module may run.
  */
 export const SUBCOMMANDS = [
     'add',
 /**
  * The snapshot of DESIGN.md's step 6, kept as a second button: the orphan commit replaces the
  * remote's `main` outright, so the history that was there is gone. This is the one call in oculus
- * that forces a push, and tests/server/git/deposit.test.ts asserts the option appears once in this
- * file.
+ * that forces a push.
  */
 export function forcePushSnapshot(at: Where): Promise<Outcome> {
     return pushCmd(at, ['--force', 'origin', 'HEAD:main']);
--- src/lib/server/git/git-message.ts
 // config/behavior.yml, read through a schema, with a default when the key is missing or malformed.
 // Empty means the CLI's own default model, so nothing is passed.
 //
-// The diff and the subprocess are both options with real defaults, which is what lets
-// tests/server/git/git-write.test.ts exercise this without a `claude` on the machine ever being
-// run.
+// The diff and the subprocess are both options with real defaults.
 
 import { execFile } from 'node:child_process';
 import { z } from 'zod';
--- src/lib/server/git/git-write.ts
 // Layer 2, server. The writing half of git, kept apart from server/core/git/ on purpose.
 //
-// DESIGN.md, "Git": the read-only module runs only its enumerated read-only commands and a test
-// asserts that its source names no writing subcommand at all. Every write therefore lives here, and
-// this module's own gate is the opposite one: tests/server/git/git-write.test.ts enumerates the
-// subcommands it may run, asserts each appears at exactly one call site, and watches every argument
-// vector the suite ran.
+// DESIGN.md, "Git": the read-only module runs only its enumerated read-only commands. Every write
+// therefore lives here.
 //
 //     git -C <root> add [-u] -- <paths | .>
 //     git -C <root> apply --cached [--reverse] --recount -    (the patch on standard input)
 /**
  * Push the current branch to its upstream. A branch with no upstream is refused with that as the
  * reason, before anything is sent: `--set-upstream` decides where a branch lives, and that decision
- * is Axel's at a terminal rather than a side effect of a button. This push never forces: the gate
- * in tests/server/git/git-write.test.ts asserts that the force option of git appears nowhere in
- * this file.
+ * is Axel's at a terminal rather than a side effect of a button. This push never forces.
  */
 export async function push(root: string, roots: string[] = allowedRoots()): Promise<Outcome> {
     if (!permitted(root, roots)) return failed('that directory is not a workspace oculus knows');
--- src/lib/server/root/hooks.ts
 /**
  * One hook body turned into the event the store keeps, or null when it does not carry a
  * hook_event_name this route knows or a session_id to key the store on. Pure over its two
- * arguments, which is what lets tests/server/root/hooks.test.ts cover each of its outcomes without
- * a request.
+ * arguments.
  */
 export function handleHook(body: unknown, now: number): HookEvent | null {
     const parsed = hookBodyShape.safeParse(body);
--- src/lib/state/life/present.ts
 // of it would let the view and the write disagree about what a key is. What is here is the typed
 // Deck the config map reads into, and the words and the hue each placed entry is drawn with.
 //
-// Nothing here reads a store or a file: the caller hands in the config map and the projects, which
-// is what makes every case of tests/state/life/present.test.ts a plain call. The one thing it
-// reaches for is the tone catalog, because a colour the deck writes as a hex is painted as the
-// palette hue that hex stands for, which is what keeps every pair on a slide inside the set
-// contrast.test.ts measures.
+// Nothing here reads a store or a file: the caller hands in the config map and the projects. The
+// one thing it reaches for is the tone catalog, because a colour the deck writes as a hex is
+// painted as the palette hue that hex stands for, which is what keeps every pair on a slide inside
+// the set contrast.test.ts measures.
 
 import { decodeHTML } from 'entities';
 import { z } from 'zod';
--- src/lib/state/sessions/changes.svelte.ts
     /** Ask for the page before the oldest row now held. */
     older: () => void;
     /**
-     * Put rows in by hand. The view does not call it; tests/views/system/history.test.ts does,
-     * because there is no fetch in a server-rendered test and a view with nothing held draws its
-     * first line and stops.
+     * Put rows in by hand. The view does not call it.
      */
     hold: (rows: Change[], more?: boolean) => void;
 };
--- src/lib/state/sessions/transcript.svelte.ts
     }
 
     /**
-     * Put turns in as though they had been fetched. The one caller is
-     * tests/views/sessions/sessions.test.ts, which renders on the server where no fetch runs;
-     * nothing in the application calls it.
+     * Put turns in as though they had been fetched. Nothing in the application calls it.
      */
     function hold(id: string, turns: Turn[], offset = 0): void {
         const held: TurnsState = { turns, offset, pending: false, error: '' };
--- src/lib/state/shared/words/text.ts
 /**
  * The catalog entry for a dotted key, with no interpolation. It exists for the keys that are named
  * by data rather than by a call site: the label and glyph keys a view hands the registry.
- * tests/checks/source/keys.test.ts can only check a literal key, so that family is checked instead
- * by tests/state/workbench/navigation/registry.test.ts, and this throws on a missing key exactly as
- * t() does.
+ * tests/checks/source/keys.test.ts can only check a literal key, and this throws on a missing key
+ * exactly as t() does.
  */
 function catalogEntry(key: string): string {
     configGeneration();
--- src/lib/state/shared/words/tones.ts
 // Layer 2, client state. The config's colours as tones. A tone is the hue part of a palette token:
 // the config says a status is `#7c5cff`, `palette:` says that hex is the token `c-violet`, and the
 // tone is `violet`, which a component turns into `--c-violet`, `--c-violet-txt` and
-// `--on-c-violet`. Nothing outside this module reads a hex, so no component carries one and the
-// colour gate in tests/ui/theme/colours.test.ts can insist on that.
+// `--on-c-violet`. Nothing outside this module reads a hex, so no component carries one.
 //
 // The maps are installed the way the text catalog and the glyph vocabulary are: the server ships
 // them as the page's data at first load, and every later edit of config/catalogs/vocab.yml arrives
--- src/lib/state/system/config/config-files.ts
 /**
  * The machine's own file inside the config folder. It is the client's half of the name
  * data/sources/config.ts leaves out of the merge, since nothing client-side may import a server
- * module; tests/state/system/config-files.test.ts holds the two to one another.
+ * module.
  */
 export const LOCAL_NAME = 'local.yml';
 
--- src/lib/state/system/deposit.svelte.ts
     }
 
     /**
-     * Put a state in by hand. The panel does not call it; tests/views/boards/deposit.test.ts does,
-     * because there is no fetch in a server-rendered test and a panel with nothing held renders its
-     * first line and stops.
+     * Put a state in by hand. The panel does not call it.
      */
     function hold(id: string, state: MirrorState | null, error = ''): void {
         const held: Held = { state, error, loading: false };
--- src/lib/state/workbench/navigation/registry.ts
 // A registration's label, glyph and badge mark words are catalog keys rather than words: the label
 // reads through t() at the call site that draws it, the glyph key's value is a name in
 // config/catalogs/glyphs.yml, and the mark words are what a badge that is a mark says on hover. A
-// view is therefore renamed or re-iconed in config, and
-// tests/state/workbench/navigation/registry.test.ts checks that the keys resolve, which is the gate
-// tests/checks/source/keys.test.ts cannot give a key that comes from data.
+// view is therefore renamed or re-iconed in config.
 
 import type { Component } from 'svelte';
 import type { Instance, ViewId } from '../layout/index.ts';
     /**
      * A text-catalog key whose value says in words what the badge's mark means, which is the
      * badge's hover words when it is a mark and no count. A registration with `badgeGlyph` names
-     * one; a mark drawn without it is hovered by the view's name alone, and
-     * tests/state/workbench/rail-badges.test.ts fails on a registration that lacks it.
+     * one; a mark drawn without it is hovered by the view's name alone.
      */
     badgeMark?: string;
     /** A hue name from state/shared/words/tones.ts; absent keeps the accent badge. */
--- src/lib/themes/derive.ts
  * How much of a hue a lane header's surface carries, the rest being the panel. At half, with every
  * Focus cluster open and every band column drawn, the headers drawn next to each other, stacked in
  * a column and beside the full-width Ideas lane stay a CIEDE2000 of 10 apart under every theme in
- * the colours config/catalogs/vocab.yml gives them, which tests/checks/look/lane-distance.test.ts
- * holds. A smaller share folds those neighbours into one colour in a theme that gives two hues near
- * values.
+ * the colours config/catalogs/vocab.yml gives them. A smaller share folds those neighbours into one
+ * colour in a theme that gives two hues near values.
  */
 const LANE_SHARE = 0.5;
 
--- src/lib/ui/controls/editor/kit/colours.ts
 //
 // A value is a token, or a token and a two-digit alpha where VS Code's default is translucent; the
 // theme builder (theme.ts) reads the token off the body and appends the alpha. A key VS Code's
-// themes leave unset is named too, since a key left out would still paint Monaco's default
-// wherever one exists: a border or a fill VS Code leaves unset is transparent here, and a text
-// colour it leaves unset takes the ink the text would inherit. A text colour is a token's `-txt`
-// form, which themes/derive.ts nudges until it reads on every surface, as every text of the page
-// is painted. The keys are the installed
-// package's own, read from its `registerColor` calls by tests/ui/controls/editor/kit/theme.test.ts,
-// which turns red on a key this map misses or names in excess.
+// themes leave unset is named too, since a key left out would paint Monaco's default wherever one
+// exists: a border or a fill VS Code leaves unset is transparent here, and a text colour it leaves
+// unset takes the ink the text would inherit. A text colour is a token's `-txt` form, which
+// themes/derive.ts nudges until it reads on every surface, as every text of the page is painted.
+// The keys are the installed package's own.
 
 /** Monaco's colour key to the token it is painted from, with an alpha where one is written. */
 export const COLOURS: Record<string, string> = {
--- src/lib/ui/tabs/TabFace.svelte
     /**
      * The theme token pair a count badge is drawn from, or nothing for a badge that takes the
      * accent. It is written here rather than beside the strip's arithmetic because the token names
-     * are built from a hue, and tests/ui/theme/colours.test.ts reads a built token name through the
-     * component that sets it.
+     * are built from a hue.
      */
     function badgeStyle(tone: string | undefined): string | undefined {
         return tone === undefined
--- tests/data/sources/personal.test.ts
 // Covered: the hub tier's reading and each field of the manifest read into a SideProject with its
 // finding.
 // Not covered: which roots of the file browser are handed to the reader (the hub under another
-// key, a second key or a link to one directory, the engine's config folder, `~`), which is
-// personalRoots in tests/server/root/watch/portfolio/personal-roots.test.ts, the watcher
-// (tests/server/root/watch/portfolio/) and the card on screen
-// (tests/views/boards/personal.test.ts).
+// key, a second key or a link to one directory, the engine's config folder, `~`).
 
 import { join } from 'node:path';
 import { describe, expect } from 'vitest';
--- tests/server/machine/commands/run.test.ts
 // chain runs in, and the Rerun and Restart of the task terminal it left. handleTerminal is called
 // with a tmux double that keeps every argument vector and runs nothing, a scratch repository, and a
 // scratch home.
-//
-// What this does NOT cover: the page asking the reader
-// (tests/state/sessions/terminal/commands.test.ts).
 
 import { afterEach, beforeEach, describe, expect } from 'vitest';
 import { it, test } from '../../../fixtures/scratch.ts';
--- tests/state/sources/repositories/diff/comment-draft.client.test.ts
 // registers effects: where the box is and what it keeps when it closes. Every dependency of a send
 // is a fake, so no terminal or clipboard is reached.
 //
-// It does not cover the markup that draws the box
-// (tests/views/sources/repositories/diff/diff-pane.test.ts) or the box inside Monaco's overlay,
-// which the look does.
+// It does not cover the markup that draws the box or the box inside Monaco's overlay, which the
+// look does.
 
 import { flushSync } from 'svelte';
 import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

```

Beyond the lines the brief names, the repeat of the search ran after the deletions and these hits were treated the same way: `src/lib/server/git/deposit-git.ts` lines 71 and 252 (a clause that `deposit.test.ts` asserts the force option count and the subcommand list; `grep -rn "SUBCOMMANDS\|forcePushSnapshot" tests` prints nothing). Three phrases in re-wrapped comment paragraphs that matched the history-word grep ("still paint", "before a route sees it", "before a theme is applied") were reworded to "paint", "ahead of a route seeing it" and "ahead of any theme being applied".

## Changes that are not deletions, with their reason

- Items 7 to 9 and their tests, above.
- `readJsonChecked` in `json.ts`, used by `saved.ts`, `approvals.ts`, `fs.ts` and `overrides.ts`: one reading of "missing, not JSON, cannot be read" in place of the copy in `saved.ts` and `approvals.ts` and a third and fourth copy.
- Re-wraps of comment paragraphs that lost words (`options.ts`, `derive.ts`, `colours.ts`, `present.ts`, `registry.ts`, `deposit-git.ts`, `git-write.ts`, `run.ts`, `layout.svelte.ts` doc comment); no word added.
- `tests/routes/edit/config-key.test.ts`, `config-value.test.ts`, `commands.test.ts` head comments lost the words describing deleted cases, including the sentence that tagged-slow cases run outside `npm test` in `commands.test.ts`, whose only slow case was deleted.
- `docs/diagrams/writes.dot` and `writes.svg`: regenerated.

## Counts of `tests/`, before and after

From `tools/oculus`, unchanged tree against this tree:

| What | Before | After |
| --- | --- | --- |
| test files (`find tests -name '*.test.ts'`) | 113 | 108 |
| lines of test files | 14,886 | 14,251 |
| lines of all files in `tests/` (`find tests -type f -exec cat {+} | wc -l`) | 18,887 | 18,252 |
| files of all kinds in `tests/` | 165 | 160 |
| `it`/`test` calls (`grep -hE "^\s*(it|test)(\.each)?\("`) | 433 | 406 |

108 = 113 - 8 files deleted + 3 files added (`workspaces.test.ts`, `json-checked.test.ts`, `layout-unread.test.ts`).

Files changed, `diff -rq` of the unchanged copy against the tree, with lines added and removed: 

```
DESIGN.md +4 -4
docs/diagrams/writes.dot +3 -3
docs/diagrams/writes.svg +7 -7
src/lib/data/sources/config/catalog/options.ts +1 -3
src/lib/server/core/git/compare.ts +1 -2
src/lib/server/core/git/run.ts +2 -6
src/lib/server/core/json.ts +24 -0
src/lib/server/edit/writes.ts +1 -0
src/lib/server/files/fs.ts +48 -10
src/lib/server/git/deposit-git.ts +5 -7
src/lib/server/git/git-message.ts +1 -3
src/lib/server/git/git-write.ts +3 -8
src/lib/server/machine/approvals/approvals.ts +7 -13
src/lib/server/machine/commands/saved.ts +7 -14
src/lib/server/root/hooks.ts +1 -2
src/lib/server/sessions/overrides.ts +31 -7
src/lib/state/life/present.ts +4 -5
src/lib/state/sessions/changes.svelte.ts +1 -3
src/lib/state/sessions/transcript.svelte.ts +1 -3
src/lib/state/shared/words/text.ts +2 -3
src/lib/state/shared/words/tones.ts +1 -2
src/lib/state/system/config/config-files.ts +1 -1
src/lib/state/system/deposit.svelte.ts +1 -3
src/lib/state/workbench/layout/index.ts +1 -1
src/lib/state/workbench/layout/saved/storage.ts +7 -0
src/lib/state/workbench/layout.svelte.ts +9 -5
src/lib/state/workbench/navigation/registry.ts +2 -5
src/lib/themes/derive.ts +2 -3
src/lib/ui/controls/editor/kit/colours.ts +5 -7
src/lib/ui/tabs/TabFace.svelte +1 -2
tests/data/sources/personal.test.ts +1 -4
tests/routes/edit/config-key.test.ts +2 -29
tests/routes/edit/config-value.test.ts +3 -49
tests/routes/edit/write.test.ts +13 -55
tests/routes/files/fs.test.ts +3 -51
tests/routes/git/git.test.ts +0 -55
tests/routes/git/untracked.test.ts +3 -32
tests/routes/machine/commands.test.ts +1 -38
tests/routes/machine/hpc.test.ts +0 -6
tests/routes/replace/ops-replace.test.ts +1 -18
tests/routes/sessions/terminal.test.ts +2 -19
tests/server/core/auth.test.ts +1 -9
tests/server/machine/commands/run.test.ts +0 -3
tests/server/machine/pty/sessions.test.ts +3 -58
tests/server/sessions/overrides.test.ts +36 -3
tests/state/sources/repositories/diff/comment-draft.client.test.ts +2 -3
tests/state/workbench/navigation/pages.test.ts +1 -15
```

New: `tests/server/core/json-checked.test.ts`, `tests/server/files/workspaces.test.ts`, `tests/state/workbench/layout/saved/layout-unread.test.ts`. Deleted: the 8 files above.

## Things the brief got wrong, and rule notes

- The brief's "35 listed pairs" is 34 rows in its table; all 34 are done.
- `agents/guarded.md` is the orchestrator's: the deleted tests above, per entry, are what it removes at landing.
- One read-only `git status` was run once by mistake; no git state changed.
- The tests of items 7 and 8 are a table inside one `it`: a loop over three unreadable bodies, each row one outcome, after the missing-file case.
