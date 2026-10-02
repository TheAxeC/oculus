# Step X3a refuter report

Reviewer a6e768689ba25b71d, claude-sonnet-5-5, ordo-high, launched 2026-10-02 07:55; 297,143 tokens, 170 tool uses, 26.1 min, from its completion notice.


Reviewer: refuter. Worktree: /Users/axelfaes/workspace/research-hub/.agents/worktrees/X3a (tool at tools/oculus), base fab398d6. I changed no file in the worktree. `git status --short` printed the same output (md5 dc08c66d911e7ab610f5a682ff0a94b0) before and after `npm run diagrams`.

Commands outside my allowance: besides `git diff fab398d6` and `git status --short` I ran read-only `git show fab398d6:<path>`, `git ls-tree -r --name-only fab398d6` and `git grep -c ... fab398d6`, to read base text. None wrote anything. I also wrote scratch outputs under the session scratchpad and one list file under $TMPDIR.

## Verification lines

All runs from tools/oculus in the worktree, PATH prefix `$HOME/.nvm/versions/node/v24.21.0/bin`.

1. `npm run diagrams`: prints `> node utils/diagrams/diagrams.mjs` then the 18 `docs/diagrams/*.dot|svg` paths (layers, layer-data, layer-server, layer-state, layer-ui, layer-shell, layer-views, channels, writes); exit 0.
2. `sh ~/.claude/skills/land/templates/checks.sh .scratch/migration/orchestrator-state.md`, output in scratchpad `checks.out`. Printed lines, verbatim:
```
$ npm test
 Test Files  446 passed | 23 skipped (469)
      Tests  11514 passed | 631 skipped (12145)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  443 passed | 9 skipped (452)
$ npm run check
1790920772099 COMPLETED 3036 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
$ npm run format:check
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
EXIT 0
```
This matches the report's claim (446 / 11514 / 631; 29 / 443 / 9; 3036 files).
3. Brief verify 2: `python3 -c "import yaml; d=yaml.safe_load(open('config/catalogs/file-nesting.yml')); assert list(d)==['patterns']"` exit 0. Verify 3: `grep -rn "Each entry is a file under one of the roots" src` prints nothing (exit 1).
4. Report groups, from the builder's `groups.sh` run by me into `rv-groups.txt`, same form `npx vitest run --tagsFilter '!slow' <files>`. All 20 groups reproduce the report's numbers: G01 22, G02 8, G03 55, G04 71, G05 41, G06 39, G07 77, G08 37, G09 83, G12 27, G13 30, G14 `2 passed | 1 skipped; 49 passed | 10 skipped`, G15 48, G16 64, G17 6, G18 313, G21 44, G22 80, G27 85, G28 `3 passed | 2 skipped; 908 passed | 90 skipped`.
5. First run on the unchanged tree: `npx vitest run --tagsFilter '!slow' $(cat base-run-files.txt)` in scratchpad/x3a/base prints `Test Files  51 failed | 9 passed | 2 skipped (62)` and `Tests  179 failed | 1404 passed | 106 skipped (1689)`, as the report says. The copy has the same 832 files under src and config as `git ls-tree fab398d6`, and four sampled files are byte-equal to the base commit.
6. Slow run, NOT reproduced as the report states it. The report says `Test Files 6 passed | 21 skipped (27)`, `Tests 206 passed | 405 skipped (611)`. `npx vitest run --tagsFilter slow tests/server/files/ops.test.ts tests/server/core/git tests/server/git tests/routes/files tests/server/files` printed, first run, `Test Files  2 failed | 4 passed | 21 skipped (27)`, `Tests  3 failed | 203 passed | 405 skipped (611)`; second run `Tests  2 failed | 204 passed | 405 skipped (611)`. The failures are `Error: Test timed out in 5000ms` in `tests/server/git/git-ops.test.ts > ... routes each action to its own operation with its own fields` and `tests/server/core/git/git.test.ts > ... cuts every list it publishes at the cap` (plus one cascade failure in git-ops in the first run). Load average was 14.6 to 16.9 with other vitest processes running. `npx vitest run --tagsFilter slow tests/server/git/git-ops.test.ts tests/server/core/git/git.test.ts` alone printed `Test Files  2 passed (2)`, `Tests  82 passed (82)`. git-ops.test.ts is not touched by the step; git.test.ts was moved by it. spec.md says a timeout in git.test.ts is not the step's; I attribute nothing to the diff.

## Item verdicts (build items 1 to 22)

| # | Verdict | Finding |
|---|---|---|
| 1 workspace header | holds | |
| 2 folder picker | holds | |
| 3 switching and saving workspaces | holds (the "reserved" name does not exist, see premises) | |
| 4 default workspace folders | holds | |
| 5 multi-select | holds | P1 on the test |
| 6 drag and drop | holds (cross-root clause: premise wrong) | S3 |
| 7 keys | holds | P4 |
| 8 git decorations | holds | |
| 9 file nesting | violated (catalog values are strings, brief says lists) | S1 |
| 10 compact folders | holds | P4 |
| 11 fuzzy toggle | holds | |
| 12 Open Editors | holds | P4 |
| 13 Outline | holds | |
| 14 Timeline and local history | violated (`history` "read at every request") | B1 |
| 15 Show in Files and Open Folder | violated (`showInFiles` type changed, L4 files edited) | S2 |
| 16 folder bookmarks | holds | |
| 17 Seti on light themes | holds | |
| 18 the look | not applicable (gate is the orchestrator's look) | |
| 19 fixed defaults said | violated (HELP.md names a refusal that does not exist) | T3 |
| 20 words | holds for placement; wording against VS Code not verified | |
| 21 file operations in History with undo | holds | P4 |
| 22 delete setting | holds | |

## Case verdicts (cases 1 to 28)

| Case | Verdict | Finding |
|---|---|---|
| 1 | met | |
| 2 | met | P5 (script constants asserted, panel never run) |
| 3 | partial | P2 |
| 4 | partial | P2 |
| 5 | partial | P3 |
| 6 | partial | P1 |
| 7 | met | |
| 8 | partial (last clause as written unmet, replaced by a one-move test) | S3 |
| 9 | met | |
| 10 | partial | P4 |
| 11 | met | |
| 12 | partial | P4 |
| 13 | met | S1 for the shape |
| 14 | partial | P4 |
| 15 | met | |
| 16 | partial | P4 |
| 17 | met | |
| 18 | met | |
| 19 | met | |
| 20 | met | |
| 21 | partial | P4 |
| 22 | met | |
| 23 | met | |
| 24 | met | |
| 25 | partial | P4 |
| 26 | met | |
| 27 | partial | P4 |
| 28 | met | |

## 1. Spec

**S1. The nesting catalog holds comma-separated strings, not lists (item 9, case 13).**
config/catalogs/file-nesting.yml, lines 2 to 8:
```
patterns:
    '*.ts': '${capture}.js'
    '*.js': '${capture}.js.map, ${capture}.min.js, ${capture}.d.ts'
    'package.json': 'package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb, bun.lock'
```
Brief item 9 and decision 5 (Z203) say "a map from a parent pattern to the list of its children's patterns". The reader accepts both (`data/helpers/files/nesting.ts`, `data/sources/config/catalog/nesting.ts` say "a text or a list of texts"), so nothing breaks. The six keys equal VS Code 1.137.0's default (checked with `grep -o` on the installed `workbench.desktop.main.js`, where the default values are strings). The report does not list the shape as a decision, and spec.md requires an unnamed user-visible shape to be reported. Failure scenario: Axel edits the catalog expecting the ruled list shape, or the next step that writes this file assumes lists. This is a user-visible shape for the orchestrator to rule: keep VS Code's text form, or convert to the ruled lists.

**S2. Source files outside the path list, two of them L4's, undisclosed; `showInFiles` type changed (item 15).**
Brief line 43: L4 writes `state/workbench/layout.svelte.ts` and `shell/Workbench.svelte`, "This step writes none of L4's files except routes/+page.svelte". Brief item 15 and line 37: `layout.svelte.ts`'s `showInFiles` "keeps its type". Brief line 127: a path outside the list is "reported before it is written". The report's outside-the-list table (report lines 131 to 146) names only test files. Source files changed outside the path list and absent from the report:
- src/lib/state/workbench/layout.svelte.ts:175 `showInFiles: (path: string, root?: string, open?: boolean) => string;` and :177 `showFolderInFiles: (path: string, root?: string) => string;`
- src/lib/shell/Workbench.svelte:57, :124, :211 (a `paletteRequested` effect)
- src/lib/state/workbench/ui.svelte.ts:170, :366 (`requestPalette`)
- src/lib/state/client/context.ts:285
- src/lib/state/sessions/changes.svelte.ts:58, :176 (`latest`)
- src/lib/state/sessions/source.svelte.ts:317 (`source.saved_without_copy`)
- src/lib/views/shared/card/ProjectCard.svelte:155, src/lib/views/boards/person/Person.svelte:221
- src/lib/data/file-ops.ts (+45 lines: `FILES_KIND`, `FileStamp`, `savedUrl`)
- src/lib/ui/controls/Confirm.svelte, ui/menu/MenuList.svelte, ui/menu/menu-items.ts
- import and comment-only edits in server/git/*, server/machine/*, server/root/watch/*, server/core/fetch-period.ts, Changes.svelte, Diff.svelte, Graph.svelte
Each edit is needed by an item (the palette request, the folder tab, the hint place, the checkbox). The defect is that two L4 files and a type the brief fixed were changed without the report-before-write the brief requires. Failure scenario: L4 lands first or is in flight, and the cherry-pick of X3a conflicts in layout.svelte.ts and Workbench.svelte. Whether these paths conflict with L4 or any other in-flight step (Q88c, D18) I did not verify: no read of those worktrees. The imports of `server/core/git.ts`, `ui/tree/VirtualRows.svelte` and the config catalog modules that this step moved are stale in any worktree based on the old tree.

**S3. A premise the brief gets wrong was built around, not handed back first (item 6, case 8).**
Brief line 79: "A case the brief's rules get wrong is handed back before any code changes." The report states the two wrong premises only at lines 169 to 172, after the build. Both premises are wrong as the report says (below). The effect is a user-visible behaviour the orchestrator should rule: a cross-root drop moves the source (one `paste` in `mode: 'move'`, one `move` record) and trashes nothing. Case 8's last clause as written ("a copy and a trash of the source") is unmet; the replacement test is tests/state/sources/explorer/acts/store.test.ts:128 to 134 ("moves between two roots in one paste").

### Premises
- No reserved workspace name: confirmed. Base `saveWorkspace` refuses only `no-name` and `name-held` (read from base `server/files/fs.ts`); the new `refusalLine` (palette.ts) maps those two plus a generic line. Brief item 3 and case 5 name a refusal that cannot be built.
- A cross-root drop is one move, not a copy and a trash: confirmed. Base `moveItem` in `server/files/fs/ops.ts` is `rename`, with copy plus remove only on EXDEV, and the base `paste` with `mode: 'move'` across roots goes through it. Nothing is sent to the Trash.
- A third premise not reported: brief item 17 and case 24 name `--text`. `grep -c "^\s*--text:"` over themes/tokens.css and themes.css prints 0, `--ink` exists once; derive.ts uses `effective['--ink']`. The implementation is right; the brief's token name is wrong.

### Moves outside the path list
Judged one by one against the folder limit (ten tracked items), which the brief states and which `npm run test:checks` passed:
- core/git split into `server/core/git/{run,state,reads,files,parse}.ts`: required by the brief ("split before the form is added"). 26 moved files checked as true moves (small diffs).
- config catalog readers to `data/sources/config/catalog/`: brief says "split the folder first" for the nesting loader; justified. `agents.ts`, `options.ts` moved with it; the only edits are paths.
- config writes to `server/edit/writes/config/` with the new dispatcher `config-write.ts`: `server/edit/writes` had room for one file (brief line 42: 9); `roots.ts` and `file-undo.ts` need two. Justified. The dispatcher replaces four inline branches of `handleWrite`.
- yaml edit tests to `tests/server/edit/yaml/`: `tests/server/edit` is at ten; brief line 123 says "split first". Justified.
- tree list primitives to `ui/tree/list/` (`VirtualRows.svelte`, `virtual.ts`): `ui/tree` is at ten and `item-props.ts` is added. Justified; callers' imports updated (Changes.svelte).
- Files view `header/` and `tree/menu/` folders: `views/sources/files/tree` is at ten. Justified.
- Core/git and ui/tree/list moves enlarge the merge surface for other in-flight steps (see S2); not a defect of the step.

## 2. Proof

**P1. The "three files" delete test asserts four names, one of them twice (case 6).**
tests/views/sources/files/menu/row-actions.test.ts:252, 270 to 296:
```
acting: (one) => [row('f1'), row('f2'), row('dirty.md'), one],
...
it('audits that asks once for the three files and sends one trash with all three paths', ...
    names: ['f1', 'f2', 'dirty.md', 'f1'],
    files: 4,
```
and the trash call is asserted with `f1` twice. The fake `acting` appends the pressed row to a list that already holds it, and the expected values encode the doubled row. Case 6 ("asks once naming the three, the ops write gets three paths") is not pinned: a fix that deduplicates the acted rows makes this test fail, and a regression that sends three paths and one extra is green. The real `rowsActed` (selection.test.ts) is tested separately and does not duplicate.

**P2. The default-workspace removal rule has no test (cases 3 and 4).**
src/lib/state/sources/fs-transport.ts:84 to 92 (`fixedRootKeys(roots, following, removable)`, `!removable.includes(one.key)`) and `configuredRootKeys` :99, used at src/lib/views/sources/files/Files.svelte:206 to 209 (`current.name === '' ? configuredRootKeys(configMap()) : null`). tests/state/sources/fs/fs-shape.test.ts:313 and :317 call only `fixedRootKeys(roots)` and `fixedRootKeys(roots, true)`; no test calls the `removable` argument or `configuredRootKeys`. Replacing the `removable` branch with `one.fixed` leaves every suite green, and then in the default workspace the roots of sources.yml lose Remove Folder from Workspace (the hub and `config/` keep it away either way). The write itself is covered (tests/routes/edit/roots.test.ts, `root-fixed`), and `rowFacts(...)` takes the list as an argument (row-actions.test.ts:196). Case 4's named-workspace add and remove write `workspaces.json` through unchanged code and no test of this step exercises it.

**P3. `:workspace-save` refusals are tested as word mapping only (case 5).**
tests/shell/keys/palette-workspaces.test.ts:177 to 189 asserts `refusalLine('no-name')` and `refusalLine('name-held')`; :156 to 160 asserts the post body for a good name. No test sends an empty or a taken name through the command and sees the refusal drawn. `window.location` undefined (:173) is the whole "no navigation" evidence.

**P4. Glue and presses without a test, where the ledger says DONE.** The report lists key presses as unrun in general; these case clauses specifically have no test:
- case 10: Enter on a Bookmarks, Notes, Open Editors, Outline or Timeline row opens it (grep "Enter" over tests/views/sources/files/sections finds none; the Repositories tree is covered only by `keyRoute('Enter', bare, false)` giving `machine`, tree-keys.test.ts:202); Escape after Cut clearing the cut is tested for `keyPlan` only, and the handler `tree/control/keyed.ts` has no test.
- case 12: the ignored row drawn in the muted colour (server marking and decoration fold are tested; no render asserts the muted class).
- case 14: Left on a compacted row, type-ahead on the last segment, a press on segment `b` (`rowStanding` finds the row, rows.test.ts "finds the compacted row that holds a segment").
- case 16: Close on an Open Editors row (sections.test.ts header says presses are not covered).
- case 21: a second Show in Files of the same folder activates the same tab. `showFolderInFiles` (show-in-files.ts:56) is reached by one call in store.test.ts:273 (`openFolder`); no test calls it twice or through ProjectCard.
- case 25: the undo of a delete asks first, and Cmd+Z / Shift+Cmd+Z, live in `keyed.ts` `undone()`; the pieces (`undoPlan`, `askedWords`, `undoFile`) are tested, the glue is not.
- case 27: the rename started from a compacted segment (the report says so).
Failure scenario for case 10: removing `Enter` from a section's open handler passes the suite.

**P5. Audits not labelled as audits.** tests/server/files/picker.test.ts:111 to 117 asserts substrings of the `PICKER_SCRIPT` constant; the script is never run (the brief forbids opening a panel, so this is the most that can be done, but spec.md calls an assertion over a constant an audit and the report does not say so).

**P6. Fixture key.** tests/views/sources/files/render/workspace-tree.test.ts:26 gives the engine root the key `config`; the real key is `ENGINE_ROOT = 'engine'` (src/lib/server/files/files.ts:242). The rendering does not depend on it; the fixture is not the server's data.

## 3. Standards

**T1. A banner comment was merged into a sentence.** src/lib/data/model/model-sessions.ts:318 to 320:
```
// ------------------------------------------------------------------ git The read-only git state of
// a workspace, as server/core/git/state.ts produces it and the `git` channel carries it. JSON-safe
// like everything above.
```
The file's other banners are a rule line plus a title on its own line; this one now reads as a sentence that begins mid-banner. The edit was needed to update a path; a formatter pass reflowed it. Fix: restore the banner line and put the sentence below it.

**T2. The builder ran git commands.** spec.md:32: "You never run a git command. Not `add`, not `commit`, not `stash`, not `checkout`, not `status`." The report (lines 177 to 179) counts status 5, diff 17, show 6, rev-parse 1, all read-only. The report states it as a fact; the rule is unqualified.

**T3. HELP.md states a refusal that does not exist (item 19).** HELP.md:111 (the `files` row):
"`:workspace-save <name>` saves the folders in force under the name and says why when the name is empty, taken or reserved"
No reserved name exists (the builder's own finding, report line 170). spec.md: "A sentence in a document ... that the change makes false is a defect of the change." Failure scenario: a reader looks for the reserved-name refusal. Also, the same HELP paragraph for `local.yml` says `history` is re-read like `hub`, `bookmarks` and `changes` (see B1).

Checks that came back clean (commands run by me):
- ASCII over the added lines of config, DESIGN.md and HELP.md: `git diff fab398d6 -U0 -- config DESIGN.md HELP.md | grep '^+' | LC_ALL=C grep -n '[^ -~]'` prints nothing; src and tests by checks.sh; the new `file-nesting.yml` has no non-ASCII.
- Every new src and config .ts and .svelte file has a "Layer" head comment (PaletteRow.svelte has it at line 22, after its module script); no raw `<button>`, `<input>`, `<select>` or `<textarea>`, no literal `aria-label`, `title` or `placeholder` strings, no `globalThis` and no module-level `let` or `var` in the new svelte and ts files.
- Comment lines over 100 columns added by the diff: none. History words in new comments ("no longer", "previously", package ids): only present-state uses.
- Boundary allow-list widening in tests/checks/tree/boundaries.test.ts (`data/helpers/files/nesting`, `data/sources/config/settings`, `data/sources/config/catalog/options`, shell stores `explorer` and `fs`): each has a stated reason in the file, the shell stores are what brief item 3 asks for, and `state/.../acts/confirm.ts:7` re-exports `confirmDelete` from the data reader. I judge them justified. The comment blocks around them were reflowed by the formatter, which makes the diff larger than the change.
- allow-duplication.txt and allow-styling.ts: the entries were re-keyed to moved paths and lines with the same hashes; nothing was added.
- Case 28 list: every modified existing test file in `git diff fab398d6 --name-status -M -- tests` is named in the report's tables (checked file by file, including the brace forms `options-{findings,walk}` and `settings/{fixture,rows,search}`).

## 4. Behaviour

**B1. The `history` folder is read from a startup snapshot in four routes, while the write path reads it fresh (item 14).**
Brief item 14: the key is "read at every request". The routes:
```
src/routes/api/(files)/history/+server.ts:18  locals.server.local.history ?? defaultHistoryDir()
src/routes/api/(files)/ops/+server.ts:29, :39 (handleCompare and handleOps)
src/routes/api/(files)/source/+server.ts:30
```
`locals.server.local` is built once, `const local = make.loadLocal(engine);` (src/lib/server/root/context.ts:219), and `reloadAccounts` (context.ts about :423 to :432) refreshes only `calendars`, `calendarDir`, `mail`, `mailDir`. The write path reads fresh: src/lib/server/edit/writes.ts:228 `const local = loadLocalOrDefaults(engine);` and :247 `local.history,` (the undo's file target). Failure scenario: Axel edits `history:` in `config/local.yml` while the server runs, then trashes a file and presses Cmd+Z. The trash keeps the copy in the old folder (ops route, snapshot); the undo looks for it in the new folder (write route, fresh) and refuses. HELP.md's `local.yml` paragraph says an edit to `history` holds "from the next such call", which is false in this tree. The existing keys `bookmarks`, `workspaces`, `notes` follow the same snapshot pattern in the routes, so the mismatch is the step's wording ("read at every request") against the code it copied. D35 ("every configuration file live", landed on main per the recent log) may make `server.local` live; I did not verify whether D35's reload copies a key added to `LOCAL_KEYS` by this step.

**B2. Delete copies are never pruned.** src/lib/server/files/fs/history.ts:138 `const old = saves.filter((one) => one.kind === 'save').slice(0, -SAVES_KEPT);`, removal at :144; the only other removal is `forgetCopy` (:218 to 227), called when a copy is used. A delete keeps a file up to `DELETE_MAX_BYTES` (5 MB, :42) with no count and no total cap. Failure scenario: a 4 MB file deleted and recreated 100 times leaves 400 MB under `~/.oculus/history` that no setting removes unless each delete is undone. The brief gives no cap for delete copies, so the bound is a decision; the report does not name it.

## Declined to judge

- Item 18 and the "Before and after" list: no browser; the report makes no measured claim. The 22 px row, 8 px indent, letter margin, drop tint and hover actions are the orchestrator's look.
- Whether the English in `files.yml` and `history.yml` equals VS Code's: not compared.
- Files I judged from the diff and their tests rather than whole-file reads in this session: Timeline.svelte, OpenEditors.svelte, Outline.svelte, outline.ts, WorkspaceHeader.svelte, FileRow.svelte, row-ops.ts, row-menu.ts, picks.svelte.ts, place.ts, files-view.ts, forms.ts, reveal.ts, decorations.ts, compact.ts. A defect in them that no test reaches would not appear above.
- The macOS folder panel and `osascript` script: not run (brief rule).
- Interaction with in-flight L4, Q88c and D18: not read.

## Usage

Tokens, tool uses and minutes: not measured. The session was continued after a context summary, so I have no total I can state from a command.

