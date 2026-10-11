# Step D67 refuter report (on .agents/worktrees/D67, base c8b4da890)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The main finding is Behaviour 1. History cannot undo adding a root's bookmark: the undo answers `moved`. The HELP.md sentence this diff rewrote says "History undoes them", and guarded entry G9 promises that every write's undo puts the file back. Neither holds for this new write. The other findings are wording and reuse defects. Every item of "What to build" holds as its text reads.

## Verification (rerun by the reviewer)

```
$ npm run test:quick            (tools/oculus in the worktree)
test:quick: 25 changed file(s), from git since HEAD
test:quick: 44 test file(s), 10 essential
ok      prettier (0.3 s): All matched files use Prettier code style!
ok      ASCII gate (0.4 s)
ok      eslint (1.4 s)
ok      svelte-kit sync (1.8 s)
ok      svelte-check (5.3 s): 1791721764719 COMPLETED 464 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (21.3 s): Duration  17.01s (transform 25.53s, setup 0ms, import 38.13s, tests 24.92s, environment 218ms)
test:quick: 21.7 s (limit 45.0 s); every command passed
test:quick: not covered: tests outside the selection, tests/checks, slow tests, build, lint of unchanged files; npm run test:landing runs them

$ wc -l <changed files>
714 src/lib/server/files/fs.ts | 139 server/files/fs/bookmarks.ts | 154 shell/rail/rail.ts | 114 state/sources/explorer/view/bookmark-rows.ts | 470 state/sources/fs-transport.ts | 134 state/workbench/navigation/rail.ts | 60 views/shared/explorer/control/bookmark-actions.ts | 115 views/shared/explorer/opening.ts | 213 tree/FileRow.svelte | 631 tree/menu/row-menu.ts | 366 views/sources/files/Files.svelte | 183 files/sections/Bookmarks.svelte | 139 config/text/ui.yml | 291 config/text/views/sources/files.yml | 466 HELP.md
$ sh utils/folder-check.sh; echo "folder-check exit $?"
folder-check exit 0

$ npx vitest run tests/views/shared/explorer/opening-apps.test.ts
 Test Files  1 passed (1)
      Tests  10 passed (10)
$ git diff c8b4da890 -- tests          (prints nothing: test files unchanged)

$ sh utils/unused-exports.sh > $TMPDIR/d67-unused.txt; diff <base>/unused-exports.txt $TMPDIR/d67-unused.txt && echo IDENTICAL
361 / 361 lines
IDENTICAL

Extra read-only checks (not in the brief's list):
$ npx vitest run tests/checks/tree/boundaries.test.ts
 Test Files  1 passed (1)      Tests  11 passed (11)
$ node -e "import('./utils/diagrams/diagrams.mjs').then(async m => console.log('stale:', JSON.stringify(await m.staleFiles(process.cwd()))))"
stale: []          (the committed diagrams match the source; tests/checks/diagrams/diagrams.test.ts itself timed out at its 5 s limit after about 130 s per test on this loaded machine, a file the step does not change)
Diagram sample read: writes.dot, layer-state.dot, layers.dot, layer-views.dot. The changes are a count +1 for state/workbench -> state/sources (the re-export), a count +1 for views/sources -> state (Bookmarks.svelte's import), +1 for views -> state, and fs.ts:236 -> fs.ts:237 (the head comment grew one line).

The builder's probes, found at /private/tmp/claude-502/.../scratchpad/d67/ (vitest.d67.config.mjs, rows.probe.ts, server.probe.ts, views.probe.ts), read, then run in the same form:
$ D67_OUT=$TMPDIR/d67-rev-out.txt npx vitest run --config <S>/vitest.d67.config.mjs --root <worktree>/tools/oculus <S>/rows.probe.ts <S>/server.probe.ts <S>/views.probe.ts
 Test Files  3 passed (3)      Tests  6 passed (6)
CASE 1 bookmarkRows st/"" folder => [{"label":"state","root":"st","path":"","view":"files","kind":"folder"}]
CASE 1 bookmarkRows root "" path "" => []          CASE 1 bookmarkRows no root => []
CASE 2 markedKeys st/"" => ["st:"]   CASE 2 bookmarkRef st/"" => {"root":"st","path":""}   CASE 2 bookmarkRef path only => null
CASE 2 bookmarkAt(entry path "", st, "") => {...the entry...}
CASE 5 markLabel({st,'',st}, []) => "st"           CASE 5 markLabel({st,'',st}, ['st']) => "st"
CASE 3 read, no path line => [{"fields":{"path":"","label":"state","root":"st"},"kind":"folder"}]
CASE 3 read, path: "" => [{"fields":{"path":"","label":"state","root":"st"},"kind":"folder"}]
CASE 3 bookmarkKind: served over a folder "folder"; not served "missing"; folder gone "missing"; st/a.txt "file"
CASE 4 after the first press: "- label: st / root: st" (no path line); entries read back [{"path":"","label":"st","root":"st"}]
CASE 4 entries after the second press => []        CASE 4 answers => [{"note":""},{"note":""}]
CASE 4 rename st -> state and move above other => {"refused":[],"found":true} each; file holds "- label: state / root: st", no path line
CASE 5 root row pressed while the label st is taken => [{"note":"The bookmark was not written: an entry with that label is already in the file"}]
CASE 8 rail choices => ["mark:0","a file","st/a.txt",null,null], ["mark:1","a folder","st/sub","folder",null], ["mark:2","state","st","folder",null], ["mark:3","gone","The path is not on this machine any more",null,true]
CASE 8 openBookmark calls => openView file st/a.txt; showInFiles("sub","st",true); showInFiles("","st",true); showInFiles("","xx",true)
CASE 6 root row menu => ... "Copy Path","Copy Relative Path","Add Bookmark","Remove Folder from Workspace" (bookmarked: "Remove Bookmark" in its place)

First run on the unchanged tree, reproduced: a copy of the base under $TMPDIR/d67rev/base (the worktree's node_modules, vite.config.ts, package.json, tsconfig.json and .svelte-kit linked or copied in), with the probes' paths pointed at it:
CASE 1 bookmarkRows st/"" folder => []
CASE 2 bookmarkAt(entry no path field, st, "") => null
CASE 5 markLabel({st,'',st}, ['st']) => ""
CASE 3 read, no path line => [{"fields":{"label":"state","root":"st"},"kind":"missing"}]; bookmarkKind st served over a folder => "missing"
CASE 4 second press: entries still [{"label":"st","root":"st"}]; answers [{"note":""},{"note":"The bookmark was not written: a new entry needs a label"}]
CASE 5 taken label => "The bookmark was not written: a new entry needs a label"
CASE 8 (views probe without bookmarkPlace): file and folder rows, rail choices and openBookmark calls equal to the worktree's run; the root row's menu has no bookmark item.

Reviewer's own probe ($TMPDIR/d67rev/probes/undo.probe.ts: createEntry, removeEntry and writeEntry with undoChange on a scratch bookmarks.yml under $TMPDIR, run in the worktree):
CASE root top: add record => [{"key":"st","field":"entries","before":null,"after":{"label":"st","root":"st","path":""},"undo":"create"}]
CASE root top: undo of add answers => {"error":"moved"}
CASE root top: entries after undo of add => [...,{"path":"","label":"st","root":"st"}]   (the bookmark stays)
CASE file: undo of add answers => {"changed":["entries"]}      (a file bookmark's add undoes)
CASE root top: undo of remove answers => {"changed":["entries"]}; file holds "- label: st / root: st" again
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `bookmark()` gives `path: ''` (`server/files/fs/bookmarks.ts:99`). `bookmarkKind` answers folder or missing (case 3 run). `bookmarkRows` keeps the entry, `markedKeys` gives `st:` and `bookmarkAt` finds the entry (cases 1, 2 and 4 runs). The writer is unchanged: the file has no `path` line after the add, the rename or the reorder (case 4 run). An entry with no root names nothing (case 1 run).
- 2: holds as its text reads. `FileRow.svelte:123` draws the star when `row.up !== true`. `row-menu.ts:253` passes `bookmarked` for a root. `row-menu.ts:428` puts the `bookmark` group in the root branch (case 6 menu run). A press adds, and a second press removes (case 4 run). A taken root key gives the root key as the label, and the server refuses it with that refusal said (case 5 run). The History undo of that add is refused: see Behaviour 1.
- 3: holds. `bookmarkPlace` gives the root alone (`bookmark-rows.ts:102`), used at `Bookmarks.svelte:94` and `rail.ts:34`. The folder glyph comes from kind `folder`. A press goes to `showInFiles('', root, true)` from the rail (`RailFoot.svelte:54-56`, view `files`) and from the section (`opening.ts:102`). `resolveReveal` with the empty path answers `found` and selects and opens the root's row (`reveal.ts:69-87`, read). The drawn result is the look's.
- 4: holds for the four named places: HELP.md:292, the SCAFFOLD comment, the `Files.svelte` head comment, `ui.yml:9` and `files.yml:22`. The sentence HELP.md:292 now holds is false for undoing a root's bookmark (Behaviour 1). HELP.md:28 and a catalog line are left untrue (Standards 2 and 3).

Cases of the brief's "Cases":

- 1: met. Probe run, quoted above.
- 2: met. Probe run, quoted above.
- 3: met. Probe run over scratch files, quoted above.
- 4: met. Probe run with the real `bookmarkActions(...).bookmark` and the server writers: add, remove, rename and reorder, with no `path` line kept.
- 5: met. `markLabel` gives `"st"` with `['st']` (`""` on the base), and the write is refused as a taken label with the words said.
- 6: not verifiable here except the menu part, which is met. The menu run shows Add Bookmark and Remove Bookmark on the root branch. The rail hover run shows the root alone with the folder glyph. The drawn star, the drawn rows and a press with the root collapsed or a sub-folder shown are settled by the look on TEST.
- 7: not verifiable here except its run-able part, which is met. The rail choice for a missing root is disabled. The section draws `kind === 'missing'` muted and struck through (`Bookmarks.svelte:90-95`, read). The drawn result is settled by the look on TEST with a root removed from the workspace.
- 8: met. The file and folder rows, rail choices and `openBookmark` calls are equal on the base copy and in the worktree. `bookmarkKind` gives file and folder on both trees.
- 9: met. Ten passed, and the test file is unchanged.
- 10: not verifiable here. By reading, the star depends only on `row.up`, so the hub and config root rows get it like any root. The look on TEST settles it.
- 11: not verifiable here. The kind depends on `oculus-state` being among `into.fixed` plus the saved workspace's added roots (`server/files/fs.ts:479-482`). The look at landing settles it, after the orchestrator adds the root and the entry.

## 1. Spec

None. The three paths outside the write list (`server/files/fs.ts` and `state/sources/fs-transport.ts` comment only, `state/workbench/navigation/rail.ts` one re-export) are named in the report before the hand-back.

- The re-export follows the precedent in the same file (`export { sourceTabState }` and `export type { BookmarkRow as Bookmark }`), and the boundaries check passes.
- Judgment call 6 gives the head row of a tab rooted at a folder Add Bookmark and Remove Bookmark in its menu. This follows from item 2's text, since every depth-0 row takes the root branch (`row-menu.ts:236`). That row's star was already drawn on the base. The report states the change.

## 2. Proof

None. Every quoted command and probe was rerun and reproduced, on the worktree and on a base copy.

## 3. Standards

- 1. `src/lib/state/sources/explorer/view/bookmark-rows.ts:98-104`. Quoted hunk: `export function bookmarkPlace(root: string, path: string): string { return path === '' ? root : `${root}/${path}`; }`.
  - What is wrong: the rule already exists as `placeOf` in `state/sources/explorer/view/reveal.ts:148-150` (`row.path === '' ? row.root : t('files.reveal_place', row.root, row.path)`), with the catalog line `reveal_place: '{0}/{1}'` (`config/text/views/sources/files.yml:232`).
  - The new helper is a second copy, and it builds the reader-visible text from a literal template instead of the catalog line. This breaks two rules of the rules file, `agents/spec.md`: "The principles every package is judged on" (a rule exists once and is reused; grep before writing a helper) and "What every package obeys" (every user-facing string comes from a catalog).
  - The builder's grep (`root}/\${`) could not find a rule kept in a catalog line.
  - Failure scenario: a change to `files.reveal_place` (another separator, a localised form) changes the Files view's reveal line but not the Bookmarks rows or the rail hover, so the same place reads two ways.
  - Fix inside the write list: export one place rule from `reveal.ts` or `bookmark-rows.ts` that uses `t('files.reveal_place', ...)`, and use it in all three places.
- 2. `HELP.md:28`. Quoted text: "Bookmarks at the foot of the rail is the star menu of `bookmarks.yml` ..., each bookmark opened as a tab of its own."
  - What is wrong: a folder bookmark, and now a root's bookmark, opens by showing a row in the Files view (`RailFoot.svelte:54-56`), not as a tab of its own. The sentence was already false for folders, and the diff extends that to roots.
  - The report lists HELP.md:28 as "still true". The rules file, `agents/spec.md` "What every package obeys", says a sentence describing the changed behaviour is rewritten.
  - Failure scenario: a reader who bookmarks `~/.oculus` expects a new tab and gets the Files view's root row selected.
- 3. `config/text/views/sources/files.yml:14`. Quoted text: `bookmark_missing_title: The path is not on this machine any more`.
  - What is wrong: case 11 makes a root's bookmark under an unserved root a designed state (a switch to a workspace without `oculus-state`). The rail and the section then say the path is not on this machine, while `~/.oculus` is there. The report judges the line "still true" for a missing root.
  - The line was already false for a file bookmark whose root was dropped from the workspace.
  - Failure scenario: after a workspace switch, the reader reads that `~/.oculus` is gone from the machine.

## 4. Behaviour

- 1. `src/lib/views/shared/explorer/control/bookmark-actions.ts:42`, with `src/lib/server/edit/writes/entries.ts` (createEntry's record, `after: values`). Quoted hunk: `? await client.fs.addBookmark({ label, root: row.root, path: row.path })`.
  - What is wrong: for a root's row this sends `path: ''`. `createEntry` records `after: {"label":"st","root":"st","path":""}`, while the file holds `{label: st, root: st}`, because the renderer drops the empty field. `undoChange` compares the two with `same()` (`core/changes.ts:183`), whose key counts differ, and answers `{"error":"moved"}` (reviewer's undo probe, quoted above). A file bookmark's add undoes with `{"changed":["entries"]}`, and a root's bookmark removal undoes correctly.
  - So History cannot undo adding a root's bookmark. HELP.md:292, which the diff rewrote, says "History undoes them", and G9 in `agents/guarded.md` says "Each write is logged, and its undo puts the file back".
  - The report names this only as "read, not run ... Not verified by a run" under limitations. The rules file asks that a risk named be fixed, or said plainly and prominently to be unfixed, with a check that would fail if the risk were real; that check could be run at unit level, as shown here.
  - Failure scenario: the reader stars the hub's root row, opens History and presses Undo on that write. The History view says "The file has changed since this write, so it was left alone." and the bookmark stays.
  - Fix options:
    - (a) `bookmark-actions.ts` sends `{ label, root }` with no `path` key for a root's row. This is inside the write list and matches Z816's stored form.
    - (b) `createEntry` records the values it actually wrote, the empty fields dropped. This ends the cause for every collection that is given an empty field, but it is outside the write list and under G9's code.
  - Recommendation: (b), since it removes the mismatch where it starts; (a) is the narrower fix. Either needs the undo case run again.

## Declined to judge

- What is drawn on the page in cases 6, 7, 10 and 11 (the star, the rows, a press with the root collapsed or with a sub-folder shown, the struck-through row): the reviewer runs no page. The look on TEST settles them.
- Whether "the Files view shows a sub-folder" in case 6 means the page's unrooted Files tab with a sub-folder selected or a tab rooted at a folder. `showInFiles` asks the page's unrooted Files tab (`show.ts:49-57`). This is for the orchestrator and the look to decide.
- History undo of a bookmark rename answers `{"error":"gone"}` for a file bookmark too (reviewer's probe `rename.probe.ts`), so it is not caused by D67. It still makes HELP.md:292's "History undoes them" untrue for renames. It is outside this step's change and goes to the orchestrator's judgment.
- The full diagram check could not finish under its own 5 s timeout on this machine. The in-memory `staleFiles` run answered `[]`.

Reviewer usage: a11a9c46a17c44a11, claude-opus-5-5, 235,203 tokens, 84 tool uses, 21.0 min.
