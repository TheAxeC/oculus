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

## Repair round 1, refuted

Ruling 1 is closed: adding a root's bookmark now undoes. Ruling 2 is only partly closed. When one write renames an entry and also changes another field, that write leaves two History rows. If the reader undoes the rename row first, the other row's undo answers `gone` and the file is not put back. The comment and the round report say the History undoes the newest record first. That is false: every record is its own row with its own Undo, and the reader can press them in any order.

The round also adds a new defect. In a write where the identity field is refused, the records of the other fields are now keyed by the empty text, so their undo answers `gone`. On the base the same write's undo answers 200.

```
$ npm run test:quick            (tools/oculus in the worktree)
test:quick: 29 changed file(s), from git since HEAD
test:quick: 45 test file(s), 10 essential
ok      ASCII gate (0.5 s)
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      eslint (1.4 s)
ok      svelte-kit sync (1.9 s)
ok      svelte-check (6.0 s): 1791724600264 COMPLETED 464 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (19.2 s): Duration  14.84s (transform 12.56s, setup 0ms, import 27.70s, tests 29.32s, environment 281ms)
test:quick: 19.7 s (limit 45.0 s); every command passed

$ wc -l <changed files>
503 server/edit/writes/entries.ts | 714 server/files/fs.ts | 139 server/files/fs/bookmarks.ts | 151 shell/rail/rail.ts | 106 view/bookmark-rows.ts | 167 view/reveal.ts | 470 state/sources/fs-transport.ts | 134 state/workbench/navigation/rail.ts | 60 control/bookmark-actions.ts | 115 explorer/opening.ts | 213 tree/FileRow.svelte | 631 tree/menu/row-menu.ts | 366 files/Files.svelte | 183 sections/Bookmarks.svelte | 139 config/text/ui.yml | 291 config/text/views/sources/files.yml | 466 HELP.md | 594 tests/routes/edit/undo/undo.test.ts | 451 tests/server/core/changes.test.ts
$ sh utils/folder-check.sh; echo "folder-check exit $?"
folder-check exit 0

$ npx vitest run tests/views/shared/explorer/opening-apps.test.ts
 Test Files  1 passed (1)
      Tests  10 passed (10)

$ sh utils/unused-exports.sh > $TMPDIR/d67r1-unused.txt; diff <(sort <base>/unused-exports.txt) <(sort $TMPDIR/d67r1-unused.txt) && echo IDENTICAL
361 lines
IDENTICAL

$ npx vitest run tests/server/core/changes.test.ts tests/routes/edit/undo/undo.test.ts
 Test Files  2 passed (2)
      Tests  46 passed (46)
(verbose: 'records a collection entry field, a new entry, a reorder and a deletion', 'takes a created entry out again and puts a deleted one back' and 'puts a collection entry field and a feed field back' each passed)

$ npm test
 Test Files  161 passed | 31 skipped (192)
      Tests  1498 passed | 258 skipped (1756)

Commands the round's section quotes, rerun in the same form:
$ grep -rn "bookmarkPlace" src tests config HELP.md DESIGN.md README.md docs      (prints nothing)
$ npx vitest run tests/checks/tree/boundaries.test.ts
 Test Files  1 passed (1)      Tests  11 passed (11)
$ sed -n 28p HELP.md
- Bookmarks at the foot of the rail is the star menu of `bookmarks.yml` in the hub's `.oculus` folder, which the Files view adds to and takes from; a press on a file bookmark opens the file in a tab, and a press on a folder or root bookmark shows its row in the Files view.
$ sed -n 14p config/text/views/sources/files.yml
        bookmark_missing_title: The path is gone, or its root is not in this workspace
$ grep -rn "bookmark_missing_title" src config tests
src/lib/shell/rail/rail.ts:31 | src/lib/views/sources/files/sections/Bookmarks.svelte:141 | config/text/views/sources/files.yml:14
$ LC_ALL=C grep -n '[^ -~]' entries.ts changes.test.ts undo.test.ts HELP.md reveal.ts files.yml      (prints nothing)
$ awk 'length>100' entries.ts
src/lib/server/edit/writes/entries.ts:186      (the base has it as line 185)
$ node -e "import('./utils/diagrams/diagrams.mjs').then(async m => console.log('stale:', JSON.stringify(await m.staleFiles(process.cwd()))))"
stale: []
$ npx vitest run tests/server/machine/lsp/adapters/markdown-created.test.ts
     x 'a file created after the first refere...' 30008ms | x 'a file moved after ...' 30005ms | x 'a folder moved after ...' 30002ms
Error: Test timed out in 30000ms.
 Test Files  1 failed (1)      Tests  3 failed (3)
$ diff -rq src/lib/server/machine <base>/src/lib/server/machine && echo "lsp server folder identical to base"
lsp server folder identical to base
(the test imports lsp/servers.ts, lsp/held/process.ts, lsp/relay.ts, ../lsp-fixture.ts and fixtures/scratch.ts; none of them is a changed file, so the round's change does not reach it)

Reviewer's probes (all under $TMPDIR/d67r1, run from tools/oculus with a vitest config whose include is the probe folder; the base runs use the base copy at $TMPDIR/d67rev/base, whose entries.ts is identical to D67-base's):
Earlier bookmark undo probe ($TMPDIR/d67rev/probes/undo.probe.ts) on the worktree:
CASE root top: add record => [{..."after":{"label":"st","root":"st"},"undo":"create"}]
CASE root top: undo of add answers => {"changed":["entries"]}
CASE root top: undo of rename answers => {"changed":["label"]}      file: "- label: st / root: st", no path line
r1.probe.ts on the tasks fixture of tests/routes/edit/write-fixture.ts, worktree | base:
A {title: 'Second task', status: 'done'} on 'Another task'; records newest first => [status key "Second task", title key "Second task"] | [status key "Another task", title key "Another task"]
A undo the title row first => 200 | 404;  then the status row => 404 | 404;  file back as before the write => false | false
A file now => "- title: \"Another task\" / status: done"
B {title: null, status: 'done'} => 200 {"changed":["status"],"refused":[{"field":"title","reason":"the identity field is what the entry is found by"}],"id":""} (both trees)
B status record key => "" | "Another task";  undo status => 404 {"error":"gone"} | 200 {"changed":["status"]};  file back => false | true
C {title: 2026, status: 'done'} => keys "2026" | "Another task"; undo status, then title => 200, 200 | 404, 404 (the title comes back unquoted, "- title: Another task", so the bytes differ)
D {title: 'Another task', status: 'done'} (identity unchanged) => one record, key "Another task"; undo 200, back true (both trees)
E {title: ' Another task ', status: 'done'} => keys " Another task " | "Another task"; undo newest then next => 200, 200, back true | 404, 404
F new entry {title: '2026', status: ''} => after {"title":"2026"} | {"title":"2026","status":""}; undo => 200, back true | 409
Case probes of the first review (rows, server, views), pointed at the worktree with bookmarkPlace replaced by placeOf from reveal.ts:
 Test Files  3 passed (3)      Tests  6 passed (6)
CASE 1 bookmarkRows st/"" folder => [{"label":"state","root":"st","path":"","view":"files","kind":"folder"}]; root "" => []; no root => []
CASE 2 markedKeys st/"" => ["st:"]; bookmarkRef st/"" => {"root":"st","path":""}; bookmarkRef path only => null; bookmarkAt(entry path "", st, "") => the entry
CASE 3 read, no path line and path: "" => fields.path "" kind folder; bookmarkKind folder / missing / missing / file
CASE 3 placeOf => ["st","st/a/b"]
CASE 4 first press: "- label: st / root: st" (no path line); second press => []; rename and move: no path line
CASE 5 markLabel => "st", "st"; taken label => "The bookmark was not written: an entry with that label is already in the file"
CASE 8 rail choices => ["mark:0","a file","st/a.txt"], ["mark:1","a folder","st/sub","folder"], ["mark:2","state","st","folder"], ["mark:3","gone","The path is gone, or its root is not in this workspace",null,true]
CASE 8 openBookmark calls => openView file st/a.txt; showInFiles("sub","st",true); showInFiles("","st",true); showInFiles("","xx",true)
CASE 6 root row menu => ... "Copy Relative Path","Add Bookmark","Remove Folder from Workspace" (bookmarked: "Remove Bookmark")
```

The builder's "before the fix" runs were not reproduced by reverting anything. The base copy's runs of r1.probe.ts above are runs of the unchanged tree. They give the same answers the report quotes for the new rows: 409 for the created entry with an empty field, 404 for the rename, and records keyed "Another task".

### Verdicts

These are the verdicts for the whole diff since the base.

Items of the brief's "What to build":

- 1: holds.
  - `bookmark()` gives `path: ''` (`server/files/fs/bookmarks.ts:99`), and the case probes for cases 1 to 4 reproduce.
  - The writer still writes no `path` line after an add, a rename or a move (case 4 probe).
  - The round changes only what `createEntry` records, not what it writes.
- 2: holds.
  - The star, the root branch's bookmark group and the taken-label refusal are shown by the case 5 and case 6 probes.
  - The undo of adding a root's bookmark now answers `{"changed":["entries"]}` (bookmark undo probe).
- 3: holds.
  - `placeOf` gives `st` and `st/a/b` and is used by the rail hover (`rail.ts:31`) and the section (`Bookmarks.svelte:94`).
  - A press goes to `showInFiles('', root, true)` (case 8 probe).
- 4: holds.
  - HELP.md:28 and HELP.md:292, the SCAFFOLD comment, the `Files.svelte` head comment, `ui.yml:9`, `files.yml:14` and `files.yml:22` are all rewritten.
  - `grep bookmarkPlace` prints nothing.

Rulings of the round brief:

- Ruling 1: holds.
  - `createEntry` records the parsed rendered block (`entries.ts:482-493`).
  - Root bookmark: undo of add answers `changed` (probe).
  - Tasks with `status: ''`: the undo row at `undo.test.ts:264-271` passes, and the base answers 409 (probe F).
- Ruling 2: violated, partly. The single-field rename and its undo of the undo hold (`undo.test.ts:340-354`, root bookmark probe). Two cases fail:
  - A write that renames and changes another field is put back only when the reader undoes the rows newest first (Spec 1).
  - The round's keying breaks the undo of a write whose identity is refused (Behaviour 1).
- Ruling 3: holds. `bookmarkPlace` is removed. `placeOf` is exported once (`reveal.ts:152`) and used in all three places. The boundaries check passes.
- Ruling 4: holds. `sed -n 28p HELP.md`, quoted above.
- Ruling 5: holds. `files.yml:14`, quoted above, is used at `rail.ts:31` and `Bookmarks.svelte:141`.

Cases of the brief's "Cases":

- 1: met. Case probe, quoted above.
- 2: met. Case probe, quoted above.
- 3: met. Case probe, quoted above.
- 4: met. Case probe: add, remove, rename and reorder leave no `path` line. The undo of the add and of the rename answer `changed`.
- 5: met. Case probe.
- 6: not verifiable, except the menu part, which is met (case 6 probe), and the hover, which is the root alone (case 8 probe). What the page draws, and a press with the root collapsed or with a sub-folder shown, are settled by the look on TEST.
- 7: not verifiable, except the rail choice of a missing root. That choice is disabled and carries the new words (case 8 probe). The struck-through row is settled by the look on TEST with a root removed from the workspace.
- 8: met. Case probe: file and folder rows, rail choices and `openBookmark` calls.
- 9: met. 10 passed, and `git diff c8b4da890 -- tests` shows only the two G9 files.
- 10: not verifiable. The look on TEST settles it.
- 11: not verifiable. The look at landing settles it, after the orchestrator adds the root `oculus-state` and the entry.

### 1. Spec

- **1. A rename written with other fields is not put back in every order.**
  - Place: `src/lib/server/edit/writes/entries.ts:297-312`.
  - Quoted hunk:
    ```
    // ... The identity record is appended first: the
    // history undoes the newest record first, so the other fields go back while the entry is
    // listed under the new value, and the identity goes back last.
    const keyed = held.ident in writing ? scalar(writing[held.ident]) : value;
    const records: ChangeRecord[] = [...out.changed]
        .sort((one, other) => Number(other === held.ident) - Number(one === held.ident))
    ```
  - What is wrong:
    - Ruling 2 requires that "the undo of a rename, alone or with other fields in the same write, puts the file back as it was before the write".
    - The fix makes that hold only when the reader undoes the write's records newest first. Nothing makes the reader do that:
      - every record is its own History row with its own Undo control (`views/system/history/History.svelte:211-219`);
      - a press undoes that one row by its `at` (`History.svelte:169-176`);
      - the server takes any `at` (`server/edit/writes.ts:633-636`).
    - Probe A on the worktree: the title row's undo answers 200, then the status row's answers 404. The file is left as `title: "Another task"` with `status: done`, which is not the text before the write.
    - The builder states this only as a limitation ("Read from `undo.ts` (`valueNow`), not run"). The report still opens with "Everything in the round is done", and its "Visible changes" says "A multi-field write is undone record by record, newest first", which the History view does not enforce.
    - The round brief allows the fix in how the undo of a `field` record finds its entry (`undo.ts`, `changes.ts`). For example, each record of a rename could carry both identities, and `valueNow` and `collectionUndo` could try the identity after the write and then the one before it. That would end the dependence on order. A limitation was written in its place.
  - Failure scenario:
    - An app sends one `entry` write `{ title: 'Second task', status: 'done' }` for "Another task".
    - The reader opens History, presses Undo on the title row (the rename the reader wants taken back), then Undo on the status row.
    - The status row says "What this write addressed is no longer in the hub." and becomes unpressable. The entry keeps `status: done`.
  - Verdict: ruling 2 violated (partial).

### 2. Proof

- **1. No test fails without the sort that puts the identity record first.**
  - Place: `tests/server/core/changes.test.ts:242-253` and `tests/routes/edit/undo/undo.test.ts:356-367`.
  - Quoted hunk: `fields: { title: 'A renamed task', status: 'done' }` and `fields: { title: 'Second task', status: 'done' }`, each followed by an assertion that the newest two records are `status`, then `title`.
  - What is wrong:
    - Both rows list the identity field first in the request.
    - `setEntryFields` walks `Object.entries(fields)` in request order (`server/edit/entry-edit/entries.ts:59`), so `out.changed` is already `['title', 'status']`.
    - Both order assertions, and the newest-first undo, pass with the `.sort(...)` at `entries.ts:304` taken out.
    - The sort only matters for a request that lists another field before the identity, such as `{ status, title }`. No row sends one.
  - Failure scenario: a later edit drops or inverts the sort. A `{ status: 'done', title: 'X' }` write then records the title newest, and the newest-first undo answers `gone` on the status row. The suite stays green.
- **2. One "before the fix" failure is paraphrased.**
  - Place: the report's "Repair round 1", "New test rows".
  - Quoted text: "the rename records keyed `"Another task"` where `"A renamed task"` was expected, for both the `status` and the `title` record".
  - What is wrong: this is a paraphrase where the rules file asks for the failing line quoted ("What every package obeys": the report quotes, for each test the step adds or changes, its failing line on the unchanged tree). The claim itself reproduces: the base copy's probe A and C records are keyed "Another task".
  - Failure scenario: a reader of the report cannot check from it which assertion failed or with what output.

### 3. Standards

- **1. The new comment states two things that are false.**
  - Place: `src/lib/server/edit/writes/entries.ts:297-301`.
  - Quoted hunk: "every record of the write is keyed by the value after it. The identity record is appended first: the history undoes the newest record first".
  - What is wrong:
    - The History view undoes whichever row is pressed (Spec 1), so "the history undoes the newest record first" is false.
    - When the identity field is refused, the records are keyed by the value sent, not by the value after the write (Behaviour 1).
    - This breaks the rules file's rule that a comment says what the code does ("What every package obeys", the rule on sentences a change makes false).
  - Failure scenario: a maintainer reads that the History orders undos. They build on that, for example by adding another multi-record write, and do not see that History lets the reader press any row.
- **2. Two comment blocks are stacked with no separator.**
  - Place: `src/lib/server/edit/writes/entries.ts:294-301`.
  - Quoted hunk: `// ... reading the file again.` directly followed by `// A write that changes the identity field leaves the entry listed under the new value, and the`.
  - What is wrong:
    - The existing comment and the new one form one `//` run with no blank `//` line between them, so the first block's short last line reads as a break inside one paragraph.
    - The tree separates comment paragraphs with a blank `//` line (the head of the same file, `entries.ts:1-19`).
    - The rules file asks for an edited comment to be rewrapped as a whole paragraph ("What every package obeys").
  - Failure scenario: a reader takes the two blocks as one paragraph about how the record is made, and misses that the second states a separate rule about the key.
- **3. The fallback in `createEntry` has no input that reaches it.**
  - Place: `src/lib/server/edit/writes/entries.ts:482-493`.
  - Quoted hunk: `const written: unknown = Array.isArray(rendered) ? (rendered as unknown[])[0] : undefined;` ... `after: isMap(written) ? written : values,`.
  - What is wrong:
    - `block` is never empty at this point, since `block === ''` returns earlier at `entries.ts:466`.
    - `renderEntry` always writes its first line as `  - <name>: <value>` (`server/edit/entry-edit/render.ts:43`). The parse is therefore always a list whose first item is a map, and the `values` branch is never taken.
    - That is code larger than its job (rules file, "The principles every package is judged on": nothing is built for a need the plan does not name).
    - If the branch were ever reached, it would record the values sent, which is exactly what ruling 1 removed.
  - Failure scenario: a reader believes some create records the values sent. They keep or extend this branch, and an undo answering `moved` comes back unnoticed.
- **4. The builder ran `npm run test:slow`.**
  - Place: the report's "Repair round 1", "Checks", item 6.
  - Quoted text: "`npm run test:slow`: `Test Files  1 failed | 39 passed | 152 skipped (192)`".
  - What is wrong:
    - The rules file says "a step never runs `npm run test:slow`" ("What every package obeys"). A slow test the step needs is run alone with `npx vitest run <file>`, as was done for `changes.test.ts`.
    - The one failure it found, `tests/server/machine/lsp/adapters/markdown-created.test.ts`, reproduces when run alone (3 timeouts at 30000 ms). No changed file reaches it: `src/lib/server/machine` is identical to the base, and none of its imports changed. It is not counted against the step.
  - Failure scenario: a whole slow suite that spawns language servers runs on a machine shared with other steps' runs. The report then carries a failure the rules say nobody investigates.

### 4. Behaviour

- **1. A write whose identity field is refused now leaves undo records that cannot be undone.**
  - Place: `src/lib/server/edit/writes/entries.ts:302`.
  - Quoted hunk: `const keyed = held.ident in writing ? scalar(writing[held.ident]) : value;`.
  - What is wrong:
    - The key is taken from the request, not from what was written.
    - When the request carries the identity field and `setEntryFields` refuses it, the file keeps the old identity (`server/edit/entry-edit/entries.ts:74-77`). That happens for a `null`, which passes `typeRefusal`, or for a refusal from `applyEntryField`.
    - Every other record of the write is nonetheless keyed by `scalar(null)`, the empty text, or by the refused value.
    - Probe B, `{ title: null, status: 'done' }`:
      - worktree: the status record has key `""`, and its undo answers 404 `{"error":"gone"}`;
      - base: key `"Another task"`, undo answers 200 and the file is back.
    - The report states no such change. The key should follow `out.changed.includes(held.ident)` and the value `setEntryFields` wrote.
    - The page's own callers do not send this today: `InPlace.svelte:66` sends one field, and the other `writeEntry` callers send no identity alongside other fields. An app's `entry` write and any other client of `POST /api/write` can.
  - Failure scenario: an app clears an entry's title and sets its status in one write. The title is refused and the status is written. The reader's Undo of the status row in History says "What this write addressed is no longer in the hub." and the status stays.
  - Verdict: ruling 2 violated (partial), with Spec 1.

### Declined to judge

- What the page draws for cases 6, 7, 10 and 11, the rail hover with the new words, and the History rows and their Undo controls: the reviewer runs no page. The look on TEST settles them.
- Probe C, a rename to a number, puts the identity back as `title: Another task` where the file had `title: "Another task"`, so the file is not byte for byte as before. This is the field writer's choice of quoting for a node that held a number, and the round did not change that writer. Whether ruling 2's "puts the file back as it was" asks for bytes or for values is for the orchestrator.
- Whether `markdown-created.test.ts` also fails on the base: it was not run there. The rules file says a failure in a file the step does not change is not rerun or investigated.
- The name `placeOf`: the ruling left the name to the builder. Several other exported functions in the tree carry the same name (for example `state/shared/page/hubs.ts:8` and `state/system/config/rows.ts:126`). Whether that matters is the orchestrator's call; no standard on the rules page addresses it.

Reviewer usage: acdd14ebdba111a0a, claude-opus-5-5, 244,556 tokens, 87 tool uses, 15.4 min.

Files read or run against: `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D67/tools/oculus/src/lib/server/edit/writes/entries.ts`, `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D67/tools/oculus/src/lib/server/edit/writes/undo.ts`, `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D67/tools/oculus/src/lib/views/system/history/History.svelte`, `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D67/tools/oculus/tests/routes/edit/undo/undo.test.ts`, `/Users/axelfaes/workspace/research-hub/.agents/worktrees/D67/tools/oculus/tests/server/core/changes.test.ts`. Reviewer probes are in `$TMPDIR/d67r1/` (`probes/r1.probe.ts`, `cases/*.probe.ts`), outside the worktree.

## Closed (the orchestrator, at landing, 2026-10-11)

First review, closed in repair round 1 (`agents/briefs/D67-round1.md`):
- Behaviour 1, the undo of adding a root's bookmark answered `moved`: `createEntry` records the entry as the rendered block holds it (ruling 1); the run over the round reproduces `{"changed":["entries"]}`.
- Standards 1, `bookmarkPlace` copied `placeOf`: removed, `placeOf` exported once and used in the three places (ruling 3).
- Standards 2, HELP.md:28: rewritten (ruling 4).
- Standards 3, `files.bookmark_missing_title`: reworded (ruling 5).
- Declined to judge, the undo of a rename answered `gone`: taken into the round as ruling 2.

Run over repair round 1, fixed on main at landing (the rounds are over, so none goes back to the builder):
- Spec 1, a rename written with other fields was put back only in one order: each record of a write that renamed the entry is keyed by the identity the write gave it and carries the identity before it as `was` (`ChangeRecord.was`, `server/core/changes.ts`); `renamedEntry` in `server/edit/writes/undo.ts` finds the entry under the key, else under `was`, for the value check and for the write back, so the records undo in any order. The identity-first sort is removed. A record logged before the change has no `was` and keeps its old answer (no migration code).
- Behaviour 1, a write whose identity is refused keyed its other records by the empty text: the key is the written identity only when `out.changed` holds the identity field, else the identity before the write.
- Proof 1, no row sent the identity after another field: the `changes.test.ts` row sends `{ status, title }` and asserts each record's `key` and `was`; the `undo.test.ts` row undoes the rename's records rename first, then the other field, and adds the refused-identity write and its undo. The run over the round shows the code before this fix failing both new orders (its probes A and B: 404 `gone`); after it, `npx vitest run tests/server/core/changes.test.ts tests/routes/edit/undo/undo.test.ts`: `Test Files 2 passed (2)`, `Tests 46 passed (46)`.
- Proof 2, the round report paraphrased one failing line: the builder's report stands as written; the failure it paraphrases is reproduced by the reviewer's base-copy run quoted in the run over the round.
- Standards 1 and 2, the false and stacked comments above `records` in `writeEntry`: one paragraph that says what the code does.
- Standards 3, the unreachable `values` fallback in `createEntry`: removed; the record is `z.tuple([mapShape])` read of the rendered block.
- Standards 4, the builder ran `npm run test:slow`: no change; the failing file `tests/server/machine/lsp/adapters/markdown-created.test.ts` is reached by no changed file (the reviewer's `diff -rq` of `src/lib/server/machine` against the base); at landing it timed out on main with and without D67, because main's `node_modules` had become a link (`agents/reviews/D67-diagnosis.md`, open item 55); with a real `node_modules` the tree with D67 applied passes `npm run test:slow` (40 files, 258 tests).
- Declined to judge, a rename to a number puts the identity back unquoted: the field writer's quoting, which the step does not change; the value is put back.
- Declined to judge, the name `placeOf` shared with other modules: each is module-local or imported by path; no change.
