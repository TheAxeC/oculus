# Diagnosis: Format Document's edit is not undone by Cmd+Z

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says.

## Symptom

"Cmd+Z after Format Document on a .tex file in the oculus source editor does not undo the format (D14's look, latex.formatter: tex-fmt), though typing is undone." Open item Z427, closed in automode (a): diagnosed on TEST (localhost:8790, tab 812137347) while D37 builds.

## Where the probes run

The symptom needs the running page, so the red command runs on TEST (localhost:8790, tab 812137347), served from the main checkout at ea41aa96c. `latex.formatter` is set to `tex-fmt` in `tools/oculus/config/behavior.yml` for the run and put back (hash before: e3bb8249). The scratch file is `zz-look-d37/probe.tex` at the hub root, removed at the cleanup. Probes change nothing on disk: each is a change made in the page's own JavaScript at run time and gone at a reload. The step's worktree is not touched. Paths redirected: none. Snapshots before: `~/.oculus/changes.jsonl` 00b23e5d (39 lines), `~/.oculus/workspaces.json` 1bf5d57a.

## Red command

On TEST: open a `.tex` file never opened before with one click in the Files tree (a preview tab), click into the editor (`document.activeElement` is `DIV.native-edit-context`), press Shift+Alt+F (Format Document), read `document.activeElement` and zoom the editor, press Cmd+Z and zoom again. Red is both parts of the symptom: the format stays after Cmd+Z, and the focus has left the editor.

- Run 1, `zz-look-d37/probe2.tex`: after the format the tab is kept (italic name gone, unsaved dot), the text is formatted, `document.activeElement` is `BODY.vscode-dark-modern`; after Cmd+Z the zoom still shows the formatted text. Red.
- Run 2, `probe3.tex`, the first edit a typed `x` instead of the format: `twox` shown, focus `BODY.vscode-dark-modern`. Red (the same focus loss on any first edit).
- Run 3, `probe4.tex`, typed `x`: the editor element found before the key is no longer in the document after it (`same editor element: false | old still in document: false`), focus `BODY`. Red.
- Run 4, `probe5.tex`, typed `x`: of the editor's 20 ancestors only the `.monaco-editor` element is gone; its host `.monaco` and every ancestor up to the workbench are kept. Red.
- Control, the tab already kept (`probe7.tex` after its first edit): typed `y`, Format, then Cmd+Z restores the unformatted text, focus stays `DIV.native-edit-context`, and no element is replaced. Green.

## Shrunk case

- The formatter is not needed: a typed first character gives the same focus loss and element replacement (runs 2 to 4).
- The language is not needed for the mechanism (it is the shared editor), though only LaTeX tabs format.
- What cannot be cut: the tab must be a preview tab, and the edit must be its first. On a kept tab the case is green.

## Hypotheses

1. If keeping the preview tab replaces the tab's instance object (`kept()`, `layout/open/preview.ts:57-60`), and the editor's model effect (`Editor.svelte:291-317`) depends on that object through the `model` prop, compiled in `Source.svelte` as `get instance() { return $$props.instance.id }`, then the effect tears down and makes a new model, losing the undo history and the focus; reading the name through `$derived` turns it green. Falsified if the effect's teardown is not on the stack at the replacement, or if a same-id instance copy does not re-run an effect reading the prop.
2. If the latex extension (`Source.svelte:204-210`) is made again and its effect rebuilds the editor, then the stack at the replacement names the extension effect (`Editor.svelte:378-382`). Falsified if the stack names another effect.
3. If `path` or the URI changes at the keep, the model effect re-runs on a real change. Falsified if the URI before and after is the same.
4. If the editor itself is made again (`build`, `Editor.svelte:189`), `editor.create` is on the stack. Falsified if it is not.

## Probes

- Probe 1 (in-page, tag DIAG-7a3c): `Node.prototype.appendChild`, `insertBefore`, `removeChild` and `Element.prototype.remove` wrapped in the page to log a stack whenever a `.monaco-editor` element is added or removed; `probe7.tex` opened fresh and `x` typed. Output:
  ```
  DIAG-7a3c remove d5e860bf-.../zz-look-d37/probe7.tex <- at ui/controls/editor/Editor.svelte:304:65  (StandaloneEditor._detachModel <- setModel <- execute_effect_teardown)
  DIAG-7a3c append  <- at $effect (ui/controls/editor/Editor.svelte:296:8)
  ```
  The model effect's teardown (`made.setModel(null)`, `created.dispose()`) and its re-run (`createModel`) are the replacement; the URI is the same (hypothesis 3 falsified); no `editor.create` and no extension effect on the stack (hypotheses 2 and 4 falsified). Hypothesis 1 standing.
- Probe 2 (compile): `svelte/compiler` on `Source.svelte` gives `get instance() { return $$props.instance.id; }` and on `source/Editor.svelte` gives `get model() { return instance(); }`, so a read of the name reads the instance object's signal. Hypothesis 1 standing.
- Probe 3 (scratch copy at main's head, `$TMPDIR/diagnose.v1gZON/tree`, client runtime of vitest): the same props shape, an effect reading the name, the instance replaced by a same-id copy as `kept()` does. Without the change: `DIAG-7a3c wrapped=false runs before keep=1 after keep=2` (red). With the change, the name read through `const named = $derived(props.model)`: the run count stays 1 (green). Diff of the change: `- void props.model;` `+ void named;` with `const named = $derived(props.model);`. Undone with the scratch copy's removal.

## Cause

Keeping a preview tab (a first keystroke, a Format Document, a double click) replaces the tab's instance object with a same-id copy without the preview flag (`kept()`, `src/lib/state/workbench/layout/open/preview.ts:57-60`). The source tab hands the editor its model name as `instance.id`, which Svelte compiles to a getter over the instance object, so the editor's model effect (`src/lib/ui/controls/editor/Editor.svelte:291-317`) depends on the object and re-runs: its teardown sets no model and disposes the model, and its body makes a new one from the text. The new model has no undo history, and Monaco's detach removes the focused input, so the focus goes to the body. Cmd+Z after a format that was the tab's first edit therefore undoes nothing; on a tab already kept it works. Shown by probe 1 (the teardown on the stack, the URI unchanged) and probe 3 (red without the change, green with it).

## Fix

In `Editor.svelte`, the model effect depends on the values that name the model, never on the objects they are read from: `const named = $derived(name)` and `const filed = $derived(path)` read in the effect in place of `name` and `path` (`modelUri(loaded.monaco, named, filed)`), so the model is made again only when the tab is pointed at another file, as the effect's comment says. The same holds for any other effect of `Editor.svelte` that reads a prop given as a member of an object.

## Test

The fix's test is a client-runtime test (`*.client.test.ts`, `tests/ui/frame/client-runtime.ts`) at the place: the editor's model effect with a fake kit, the instance replaced by a same-id copy, asserting the model is not made again, red on the tree without the fix. Its failure on the unchanged tree is quoted in D37's repair round report. Where a fake kit cannot reach the effect, the builder writes that under "No test reaches it" with the reason, and the look at D37's landing is the check: Format Document, then Cmd+Z, on a preview tab.

## Handed over

Joins D37 as a repair round (the closure of the open item on Format Document's undo, automode (a)). The red command above is the round's check at the look.

# Diagnosis: Open File on a Replace Preview opens nothing

Every quoted command output carries `<REDACTED>` in place of the value of a secret in it, as the rules file's rule on secrets in quoted command output says. No output quoted here held one. vitest's pass and fail marks are written `PASS` and `FAIL`.

## Symptom

"In the Search view, search `qzlook` (Every root), Replace field open and empty; click the hit of `side-projects/look-d37/messy.json` (hub root). The Replace Preview opens as a tab in the documents pane (`repositories-diff` with root `hub`, path `side-projects/look-d37/messy.json`, staged false, worktree false). Clicking its bar's Open File button (`DiffBar.svelte`, `onopen={() => repositories.openFile(held.root, held.path, openLine())}` at `src/lib/views/sources/repositories/diff/Diff.svelte:362`) opens nothing: no tab is added on any page (the saved layout holds no `source` instance for messy.json after two clicks), and no sentence is visible. Opening a file from the Files view works on the same page." Found on TEST (localhost:8790, main's working tree with D37's change staged) at D37's landing; run with no person present.

## Where the probes run

Two scratch copies under `$TMPDIR/diagnose.Kzioer`, made from the main checkout, removed at the cleanup:

- `tree`: `git worktree add --detach "$tmp/tree" HEAD` (04833d093), then `git -C /Users/axelfaes/workspace/research-hub diff --cached --binary 48841862f > "$tmp/step.diff"` (1874940 bytes) applied inside it with `git apply --3way --allow-empty "$tmp/step.diff"` (every file applied cleanly; whitespace warnings only). `npm ci` run in `tree/tools/oculus`.
- `base`: `git worktree add --detach "$tmp/base" 48841862f`, nothing applied; its `node_modules` is a link to the `tree` copy's (`diff -q` of the two `package-lock.json` printed nothing).

`diff -rq` of `src`, `tests` and `config` (local.yml excluded) between the main checkout and `tree` prints two files: `src/lib/server/files/fs/replace.ts` (an unstaged change in main to `written()`, the replace write's region check) and `src/lib/ui/controls/editor/Editor.svelte` (comment rewrapping). Neither is on the code path of Open File. Paths redirected: none (the probes are vitest runs in the copies; no server, no browser, no port).

## Red command

A vitest file at the place the press lands, `tests/zz-diag/open-file.test.ts` in `tree`, run with `npx vitest run --project unit --silent=false --reporter=verbose tests/zz-diag/open-file.test.ts`. It builds the Replace Preview's subject as the Search view builds it (`previewSubject` with the hit's file `{ root: 'hub', path: 'side-projects/look-d37/messy.json' }`), turns it into the pane's held state as `Diff.svelte:114` reads it (`heldDiff(diffState(subject, label))`), and presses Open File as `Diff.svelte:362` does (`store.openFile(held.root, held.path, 1)`) on `createRepositories` with a recording layout and the served roots the page holds (`hub` at the hub folder, `engine`, `workspace`, a configured root; `fs.ts:284-291`, `files.ts:233`). The real text catalog is installed (`setCatalog(textCatalog(loadConfig(engineDir()).config))`, as `tests/state/sessions/source.test.ts:21-22` does). It asserts the first part of the symptom (a `source` view opened for the file) and prints the second (what was said, and under which key). A second case, the control, presses Open File as a Source Control diff does, with the repository's folder as the root.

```ts
const subject = previewSubject(
    { root: 'hub', path: 'side-projects/look-d37/messy.json', hits: [{ line: 1, at: 0 }] },
    { query: { q: 'qzlook', word: false, case: false, regex: false, under: '' }, replace: '', preserve: false },
    1
);
const held = heldDiff(diffState(subject, 'messy.json'));
const answered = store.openFile(held.root, held.path, 1);
expect(opened).toEqual([{ view: 'source', state: { root: 'hub', path: 'side-projects/look-d37/messy.json', label: 'messy.json', line: 1 } }]);
```

Runs 1 to 3 (the same three lines each time):

```
DIAG-b41e held.root=hub answered=false opened=[] outcome(hub)="No served folder holds side-projects/look-d37/messy.json, so it cannot open in a tab."
DIAG-b41e control answered=true opened=[{"view":"source","state":{"root":"hub","path":"side-projects/look-d37/messy.json","label":"messy.json","line":1}}]
FAIL |unit| tests/zz-diag/open-file.test.ts > DIAG-b41e Open File of a Replace Preview of a hub file opens a source tab
PASS |unit| tests/zz-diag/open-file.test.ts > DIAG-b41e control: Open File of a Source Control diff (root = repository folder) opens
AssertionError: expected [] to deeply equal [ { view: 'source', state: { ...(4) } } ]
      Tests  1 failed | 1 passed (2)
```

Both parts of the symptom are on it: nothing is opened (`opened=[]`), and the refusal sentence is said under the key `hub` (part two is placed by probe 3 below). The tightening is in the command as built: no server, no file system write, no clock, no network; a run takes 748 ms (`Duration 748ms` of the first run).

## No red command

Not applicable.

## Shrunk case

`tests/zz-diag/shrink.test.ts`, each cut run alone through the same press (`npx vitest run --project unit --silent=false tests/zz-diag/shrink.test.ts`):

| Cut | Result of the red command after it | Kept or put back |
|---|---|---|
| The `replace` field (a plain diff subject, root `hub`) | `RED (nothing opened)` | cut |
| The line (`undefined`) | `RED (nothing opened)` | cut |
| The served list, to the `hub` root alone | `RED (nothing opened)` | cut |
| The path, to a top-level `README.md` | `RED (nothing opened)` | cut |
| The `hub` key, for another served key (`cathedra`) | `RED (nothing opened)` | cut |
| The served key, for the folder it names (`/home/u/workspace/research-hub`) | `green (source)` | put back |

The shrunk case, as it stands: Open File pressed on a diff pane whose `root` is a served root's key. The Replace Preview, the hit's line, the other served roots and the path are not needed; the key is.

## Hypotheses

1. If `openFile` reads `root` as a repository's folder (`tabOfFile` joins root and path into one path and looks for the served folder holding it, `src/lib/state/sources/repositories/file-git.ts:85-90`), while a Replace Preview's subject carries the served root's key the search answer names its file by (`previewSubject`, `src/lib/state/sources/repositories/replace-preview.ts`, from `previewHit`, `src/lib/state/sources/search/search.svelte.ts:319-334`), then `hub/side-projects/look-d37/messy.json` is held by no served folder, the press is refused, and opening the tab with a served key as the tab's own root turns the red command green. Falsified by: the red command still red with that one change.
2. If D37's change made the preview's Open File fail (D37 changes `openDiff` and `ViewOpener.openBeside` in `repositories.svelte.ts` to carry the asking instance), then the red command is green on 48841862f without D37. Falsified by: the red command red on the base copy.
3. If the refusal is said under the key `hub` and no view reads the repositories store's sentence under that key, then the second part of the symptom (no sentence visible) follows from the first. Falsified by: a view that draws `repositories.outcome` of a diff pane's root, or of a served key.

No other cause is live: the red output shows `layout.openView` is never called (`opened=[]`), so the layout's landing, the source view and the saved layout are not reached; the shrink shows the root's vocabulary alone decides red and green.

The reply to the hypotheses: none, no person present.

The second list: not needed.

## Probes

| Hypothesis rank | The one change, as a diff | The run | Result |
|---|---|---|---|
| 1 | In `tree`, `repositories.svelte.ts:273`: `- const tab = tabOfFile(access.served(), { root, path });` `+ const tab = access.served().some((one) => one.key === root) ? { root, path } : tabOfFile(access.served(), { root, path });` | `DIAG-b41e held.root=hub answered=true opened=[{"view":"source","state":{"root":"hub","path":"side-projects/look-d37/messy.json","label":"messy.json","line":1}}] outcome(hub)=""`, `Tests  2 passed (2)`; undone, `diff -q` against the saved original printed nothing | still standing |
| 2 | The same red command run in `base` (48841862f, no D37 diff), no other change | `DIAG-b41e held.root=hub answered=false opened=[] outcome(hub)="No served folder holds side-projects/look-d37/messy.json, so it cannot open in a tab."`, `FAIL ... DIAG-b41e Open File of a Replace Preview of a hub file opens a source tab`, `AssertionError: expected [] to deeply equal [ { view: 'source', state: { ...(4) } } ]` | falsified |
| 3 | No change: `grep -rn -e 'outcome(' src/lib/views src/lib/shell`, and `grep -n -e 'outcome' Diff.svelte DiffBar.svelte` | `src/lib/views/sessions/changes/Changes.svelte:60: ... repositories.outcome(workspace)` and `src/lib/views/sources/repositories/Repo.svelte:102: ... repositories.outcome(root)` (a session's workspace folder, and the repository row's folder from `Repositories.svelte:423`); nothing in `Diff.svelte` or `DiffBar.svelte` | still standing |

For probe 2, `diff -q` between `base` and `tree` of `file-git.ts`, `replace-preview.ts`, `repositories.ts`, `Diff.svelte` and `DiffBar.svelte` printed `same` for each; `repositories.svelte.ts` differs only by D37's `openDiff`/`openBeside` hunks (read from `step.diff`), and the base's `previewHit` (`search.svelte.ts:301-316` at 48841862f) hands `found.file` to `previewSubject` as D37's does.

## Cause

The diff pane's root has two vocabularies. A diff read through the git routes (a change, a commit, a stash, a worktree, a group) names its repository by folder; a diff read through the file routes names its file by the served root's key: the Replace Preview (`previewSubject`), Compare with Selected (`openComparison`, `src/lib/state/workbench/navigation/pages.ts:404-416`, from a Files row's `{ root: row.root, path }`) and a Timeline copy from the local history (`Timeline.svelte:113-116`, `root: file.root`). Diff.svelte's Open File, in the bar (`Diff.svelte:362`) and in each file's header (`Diff.svelte:436-440`), hands `held.root` to `repositories.openFile`, which reads it as a folder only (`repositories.svelte.ts:270-281`, through `tabOfFile`). With the key `hub`, `joinPath('hub', path)` is a relative path no served folder holds, so `openFile` opens nothing and says "No served folder holds ..., so it cannot open in a tab." under the key `hub`, which no view draws: `Repo.svelte:102` draws the sentence of a repository's folder and `Changes.svelte:60` that of a session's workspace, and the diff pane draws none. Shown by probe 1 (the red command green with the served key opening as the tab's own root, red without it) and probe 3. The same press fails the same way on a comparison of two files and on a Timeline copy (the cases table under "Fix and test").

Base answer: the defect is on main without D37. The red command is red on 48841862f (probe 2) with the same output as on main with D37 staged, and D37's diff changes none of the files on the path except `repositories.svelte.ts`, where it changes `openDiff` and `openBeside` only. D37 did not cause it. The Replace Preview's Open File is not an item of D37's brief (`agents/briefs/D37.md` S1 to S3 name the replace's hits, the cut note and where the preview lands).

## Fix and test

Test, run on the tree without the fix. Under the rules file's test rule (`agents/spec.md:57`: a test exists only as the test of one entry of `agents/guarded.md`, a builder writes no other test, and a new entry needs Axel's yes), no committed test is written: no entry of `agents/guarded.md` covers what a diff pane's Open File opens (G1 to G35 read: none names `repositories.svelte.ts`, `file-git.ts` or the diff pane), views have no entry and the look on TEST covers them (`guarded.md:3`), and the failure loses no work, breaks no installation and accepts no wrong configuration. The check that stands for it is the red command above, red without the fix and green with it, and the look at the landing. Should Axel add an entry for it, the test is the cases table below, at the store (`createRepositories`), one row per diff kind; its runs here, `npx vitest run --project unit --silent=false --reporter=verbose tests/zz-diag/kinds.test.ts`, without the fix:

```
FAIL |unit| tests/zz-diag/kinds.test.ts > DIAG-b41e replace preview: Open File opens the file
FAIL |unit| tests/zz-diag/kinds.test.ts > DIAG-b41e compare with selected: Open File opens the file
FAIL |unit| tests/zz-diag/kinds.test.ts > DIAG-b41e local history copy: Open File opens the file
PASS |unit| tests/zz-diag/kinds.test.ts > DIAG-b41e repository diff: Open File opens the file
      Tests  3 failed | 1 passed (4)
```

Fix, in `src/lib/state/sources/repositories/repositories.svelte.ts`: one rule for what a root names, used by `openFile` and `revealFile`; a served root's key names the tab's root itself, and a repository's folder resolves as before. Diff.svelte and every other caller are unchanged.

```diff
--- a/tools/oculus/src/lib/state/sources/repositories/repositories.svelte.ts
+++ b/tools/oculus/src/lib/state/sources/repositories/repositories.svelte.ts
@@ -19,7 +19,7 @@
 import { BRANCH_NOT_MERGED } from '../../../data/model/index.ts';
 import { diffState, plannedPath, repositoriesViewOf, type DiffSubject } from './repositories.ts';
 import { isFolderPath, withoutClosedCommits } from './change-tree.ts';
-import { headTabState, tabOfFile, type ServedRoot } from './file-git.ts';
+import { headTabState, tabOfFile, type ServedRoot, type TabFile } from './file-git.ts';
 import type { PatchMode } from './diff/diff-patch.ts';
 import type { SendOptions, WritesStore } from '../../shared/stores/shapes.ts';
 import { t } from '../../shared/words/text.ts';
@@ -138,11 +138,15 @@
     openCompare: (root: string, from: string, to: string) => void;
     /** Open a linked worktree's file against the main worktree's in a diff pane. */
     compareWorkspace: (root: string, path: string) => void;
-    /** Open a repository's file in a source tab, at a line when one is given. */
+    /**
+     * Open a file in a source tab, at a line when one is given. `root` is a repository's folder or
+     * a served root's key, as a diff pane read through the file routes names it (a Replace
+     * Preview, a comparison of two files, a file against a copy in its local history).
+     */
     openFile: (root: string, path: string, line?: number) => boolean;
     /**
-     * Show a repository's file in the Files view, under the served root holding it most closely,
-     * answering whether one does.
+     * Show a file in the Files view, answering whether a served root holds it: `root` is read as
+     * openFile reads it.
      */
     revealFile: (root: string, path: string) => boolean;
     /** Open the three-way merge editor over one conflicted path. */
@@ -265,12 +269,22 @@
 
     function openMerge(root: string, path: string): void {
         layout.openBeside(MERGE_VIEW, { id: `merge:${root}:${path}`, root, path, label: path });
+    }
+
+    /**
+     * The tab a file opens in: a served root's key names the tab's root itself, and a repository's
+     * folder opens under the served root holding the file most closely, or nowhere when none does.
+     */
+    function tabOf(root: string, path: string): TabFile | null {
+        const served = access.served();
+        if (served.some((one) => one.key === root)) return { root, path };
+        return tabOfFile(served, { root, path });
     }
 
     function openFile(root: string, path: string, line?: number): boolean {
         // A folder (an untracked directory) has no source tab; the Files view shows it.
         if (isFolderPath(path)) return revealFile(root, path);
-        const tab = tabOfFile(access.served(), { root, path });
+        const tab = tabOf(root, path);
         if (tab === null) {
             say(root, t('repositories.open_unserved', path));
             return false;
@@ -281,7 +295,7 @@
     }
 
     function revealFile(root: string, path: string): boolean {
-        const tab = tabOfFile(access.served(), { root, path });
+        const tab = tabOf(root, path);
         if (tab === null) {
             say(root, t('repositories.reveal_unserved', path));
             return false;
```

Runs after the fix, in `tree`:

```
$ npx vitest run --project unit --silent=false --reporter=verbose tests/zz-diag/open-file.test.ts tests/zz-diag/kinds.test.ts
DIAG-b41e held.root=hub answered=true opened=[{"view":"source","state":{"root":"hub","path":"side-projects/look-d37/messy.json","label":"messy.json","line":1}}] outcome(hub)=""
DIAG-b41e control answered=true opened=[{"view":"source","state":{"root":"hub","path":"side-projects/look-d37/messy.json","label":"messy.json","line":1}}]
PASS |unit| tests/zz-diag/open-file.test.ts > DIAG-b41e Open File of a Replace Preview of a hub file opens a source tab
PASS |unit| tests/zz-diag/open-file.test.ts > DIAG-b41e control: Open File of a Source Control diff (root = repository folder) opens
DIAG-b41e replace preview: opened=[{"view":"source","state":{"root":"hub","path":"side-projects/look-d37/messy.json","label":"messy.json","line":3}}] said=""
DIAG-b41e compare with selected: opened=[{"view":"source","state":{"root":"hub","path":"side-projects/look-d37/messy.json","label":"messy.json","line":3}}] said=""
DIAG-b41e local history copy: opened=[{"view":"source","state":{"root":"hub","path":"side-projects/look-d37/messy.json","label":"messy.json","line":3}}] said=""
DIAG-b41e repository diff: opened=[{"view":"source","state":{"root":"hub","path":"side-projects/look-d37/messy.json","label":"messy.json","line":3}}] said=""
PASS |unit| tests/zz-diag/kinds.test.ts > DIAG-b41e replace preview: Open File opens the file
PASS |unit| tests/zz-diag/kinds.test.ts > DIAG-b41e compare with selected: Open File opens the file
PASS |unit| tests/zz-diag/kinds.test.ts > DIAG-b41e local history copy: Open File opens the file
PASS |unit| tests/zz-diag/kinds.test.ts > DIAG-b41e repository diff: Open File opens the file
      Tests  6 passed (6)
```

The red command is the original case (the Replace Preview of `side-projects/look-d37/messy.json` under `hub`), so its green run above is also the unshrunk case's. Checks of the fixed copy: `npx prettier --check` on the file: "All matched files use Prettier code style!"; `npx eslint` on the file: exit 0, no output; `npm run check`: "COMPLETED 2777 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS"; the tests that build the whole client state (`tab-menu`, `keys`, `manifest-draft`, `form-drafts`, `source`, `layout-unread`) with `boundaries.test.ts`: "Test Files 7 passed (7), Tests 32 passed (32)"; `size.test.ts` after the probe folder was removed: "Tests 10 passed (10)" (the file is 493 lines). HELP.md:209 ("Open File opens the file at the change the pane is at") is made true for the three kinds by the fix and needs no change; the head comment of `repositories.svelte.ts` and the comment at `src/lib/state/client/context.ts:351-352` stay true.

What the fix leaves as it is, read in the code: a served root's key from `config/sources.yml` may be any non-empty text (`rootShape`, `files.ts:131-134`), so a key written as the absolute path of another repository's folder would be read as that key; keys the page adds hold no `/` (`rootKey`, `fs.ts:310-320`). A refusal of a diff pane's Open File (a repository file no served root holds) is still said only where Repo.svelte or Changes.svelte draws it, never in the pane; with the fix no file-route diff reaches that refusal, and a git-route diff's refusal is drawn on its repository's row.

No test reaches it: not applicable. No test is written: no entry of `agents/guarded.md` covers it and a new entry needs Axel's yes (`agents/spec.md:57`); the failure costs no lost work, installation or configuration.

## Cleanup

```
$ grep -rn -e 'DIAG-b41e' $tmp/tree/tools/oculus/src $tmp/tree/tools/oculus/tests $tmp/base/tools/oculus/src $tmp/base/tools/oculus/tests
(no output, exit 1)
```

The probe files (`tests/zz-diag/` in both copies) were removed before that grep; both copies were removed with `git worktree remove --force` from the main checkout. Nothing in the main checkout was changed but this record. The red command run again on the original case is carried by the landing's look: Open File on the Replace Preview of `side-projects/look-d37/messy.json`.

## Handed over

To the orchestrator at D37's landing, as found at a look. The defect is older than D37 and outside D37's brief; the fix is the one change to `repositories.svelte.ts` above, with no test unless Axel adds an entry to `agents/guarded.md`, and the look at the landing is its check.
