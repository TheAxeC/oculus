# S4 refutation (the Settings editor finished), worktree .agents/worktrees/S4, base 3c772d4c

Disclosure first: I ran one git command beyond the two allowed. `git show 3c772d4c:tools/oculus/src/lib/views/system/config/Config.svelte | grep -n "Chip\|chip"` is read-only and changed nothing, but the brief allowed only `git diff` and `git status --short`. After that I read base content only through `git diff 3c772d4c -- <path>`. I wrote probe files only under my scratchpad (`.../scratchpad/s4/`), and I made a scratch engine copy of `config/` there with `rsync --exclude local.yml`. I never opened, printed, grepped or hashed `local.yml`. As the brief asked, I ran `npm run diagrams` once in the worktree. It changed no byte (the md5 is equal before and after; see below).

## Verification lines (verbatim)

Command: `cd .agents/worktrees/S4/tools/oculus && PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH sh ~/.claude/skills/land/templates/checks.sh .../orchestrator-state.md`. It exited 0, at a load average of 4.68.

```
$ npm test
 Test Files  512 passed | 24 skipped (536)
      Tests  12858 passed | 639 skipped (13497)
   Duration  140.79s (transform 26.64s, setup 0ms, import 255.15s, tests 260.77s, environment 202ms)
$ npm run test:checks
 Test Files  29 passed | 2 skipped (31)
      Tests  446 passed | 9 skipped (455)
$ npm run check
1790967761831 COMPLETED 3163 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
✓ built in 4.71s
✓ built in 12.70s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

The commands the report quotes as evidence, rerun:
- Verify 2: `grep -rn "views/system/config\|group: 'info'" src tests` printed nothing (exit 1).
- Verify 3: `grep -c "page: info" config/layout.yml` printed `0`. `grep -n "^  info:" config/layout.yml` printed nothing (exit 1).
- Diagrams idempotence: `cat docs/diagrams/* | md5 -q` printed `34187e727c938f8e88e2fc869c7b81a8` both before and after `npm run diagrams` (exit 0). `git status --short | grep diagrams | wc -l` printed 12, the same 12 files as before the run.
- `colours.test.ts`, run alone:
  - In the worktree: `Tests 1 failed | 13 passed (14)`, failing on `lib/ui/controls/editor/DiffEditor.svelte: .diff-editor :global(.oculus-comment-add)::before` and `lib/views/sources/files/sections/OpenEditors.svelte: .dirty`.
  - In the builder's base copy (`scratchpad/s4-base/oculus`, which holds `views/system/config/Config.svelte` and no `block-edit.ts`): the same two lines, `1 failed | 13 passed`.
  - Neither file is in S4's diff. The claim reproduces.
- `yaml-edit.test.ts`, run alone in the worktree: `Tests 1 failed | 57 passed (58)`, failing on `side-projects/{gpu-game-boy,residual,scripted-os}/project.yml: status is not a map`. It passes inside the full `npm test` above. The report claims the unchanged-tree failure only for `colours.test.ts`, and says of `yaml-edit` "Not verified on the unchanged tree". Neither `yaml-edit.ts` nor its test is in the diff.
- Line counts (`wc -l`): these differ from the report: `editors/Cards.svelte` 181 (report 178), `editors-draft.test.ts` 492 (493), `editors-writer.test.ts` 433 (436). The other counts I checked match.
- First-run file `scratchpad/s4-first-run-2.txt` (19:02): it holds `Failed Tests 57` and 7 suites unloadable, as the report says.

## Item verdicts

1. **The `config-value` write: violated (partial), finding B2.** These parts hold, each with tests:
   - body, zod shape, dispatch and the client sender;
   - the refusals of `local.yml` (no read), the catalog, single values, rail and arrangements;
   - the unparsed, alias and tag refusals, the stale `base` refusal and reserved names;
   - read-back, `refusedBy` moved to `config-checks.ts`, the History record and undo.

   What does not hold: "a family takes the collection kind the file holds ... each record a map" is not enforced for map families. A probe wrote `nav_groups.help` as a list of records and it landed.
2. **The block rewrite: violated (substitute mechanism), finding SP1.** The byte guarantees hold: C1, C3, C5, C6, C26 and C27 pass. But the brief named the CST route (`Parser`, `Composer({ keepSourceTokens })`, `CST.setScalarValue`). The diff uses `parseDocument` node ranges and a hand-written scalar quoter (`block-render.ts`).
3. **The editors: violated (partial), findings B1 and ST4.** The drafts, forms, problems, in-flight handling, push handling, close handling and Reset all hold over state tests. Two parts fail:
   - a list row's refusal sentence is drawn twice;
   - `draftSlot` has a false doc comment and no reader.
4. **The table of contents below 700 px: holds** at the state level (`contents.test.ts`). The press, the scroll and Escape are for the look.
5. **Open-the-file action and the Texts group: holds** (C18, C19, `folders.test.ts`, `settings-editors.test.ts`).
6. **The Config view removed: violated (partial), finding ST1.** DESIGN.md:389, :391 and :399 still describe the Config view. The brief's own grep finds them.
7. **The merged rail item: holds.**
   - Rail: 11 buttons; `{ label: "System", glyph: sliders, page: views }` last, after Help.
   - `nav_groups.views` is `{ label: "System", glyph: settings, chord: y }`; `nav_groups.info` and `arrangements.info` are gone.
   - Arrangement: `[settings, account-setup]` left; on the right, `[catalogue, pages]` over `[status, findings, audit, history, gallery]` at 0.5/0.5.
   - Orders 0 to 8 match decision 3; `y1-y9` in `app.yml:12` and HELP.md:71; the `w` row is gone.
   - This matches Z169, Z171 and Z282. `processes` is not on this base, so the Z282 merge falls to the second landing.
8. **The saved `info` page carried over: holds** under the brief's text and the confirmed rulings. The cost in user state is under B3.

## Case verdicts

- C1 to C13: met. C4 and C8 are met under rulings R1 and R2.
- C14: partial. The state test keeps the draft and sets the sentence (`editors-writer.test.ts` "keeps the draft and draws the refusal under the row"), but a list row draws that sentence twice (B1). The look settles it.
- C15 to C34: met. C17 is met at state level, with the press and scroll left to the look. C18 is a preserved behaviour and passed on the base run. C21 to C25 are met under the confirmed readings.
- C35: met by "keeps the drafts of two keys apart, and never meets the typed text" (drafts live under the `editors` key, typed texts under `typed`). The separate "has an instance-state key of its own" test asserts over `draftSlot`, which is not the instance-state key (P1).
- C36: met.

## Spec

- **SP1. The block rewrite uses another mechanism than the one the brief named.**
  - Where: `src/lib/server/edit/block-edit.ts:25` `import { isAlias, isMap, isScalar, isSeq, parseDocument } from 'yaml';` and `block-render.ts:30-37` (`scalarText` with its own `plainOk` quoting rules).
  - What is wrong: the brief named `new Parser()`, `new Composer({ keepSourceTokens: true })` and `CST.setScalarValue` on the source token, and the rules file says a named library is used for what it names "rather than code written beside it". The diff writes its own quoting and two modules that are not in the write list (`block-render.ts`, `block-source.ts`).
  - Failure scenario: a string `plainOk` misjudges is caught by the read-back, so a valid edit is refused with `server.config_value.not_kept`. The file is not corrupted. Verdict: item 2.
- **SP2. Paths outside "Paths this step writes" are not marked in the report.**
  - The paths: `state/shared/stores/shapes.ts`, `state/shared/words/text.ts` (`hasText`), `state/sources/fs.svelte.ts`, `server/files/files.ts`, `state/sources/explorer/view/place.ts`, `ui/display/CodeText.svelte`, `views/shared/code/Code.svelte`, `data/prose/languages.ts`, `config/text/views/sources/file.yml`, `block-render.ts` and `block-source.ts`.
  - Most are comment rewrites the rename forces, which is legitimate. But the rules file asks the file table to mark each one with its reason, and it does not.
- **SP3. The `written` function merged out of `config-key` and `config-value`.**
  - `config-checks.ts` also took `optionOf`, `kept`, `copyOf`, `optionNow` and `refusing`, beyond the brief's `READERS`, `FINDERS` and `refusedBy`.
  - This is a DRY refactor the principles allow, and the report states it with its reason (the write diagram's free ports). `config-key`'s behaviour is preserved: its server and route tests are green in the full run.
  - I record this as a change no item names, with no defect found. No verdict.
- None of the rulings Axel reserved was taken. The `tab_rollup` question is raised as an open decision.

## Proof

- **P1. A test of a constant, titled as a behaviour.**
  - Where: `tests/state/system/settings/editors-writer.test.ts:357-366` "has an instance-state key of its own for a file and key". It asserts `draftSlot(...)` starts with `editor:`.
  - What is wrong: `draftSlot` is only the value of `data-draft` (`Editor.svelte:93`), which nothing reads. The instance-state separation is the `editors` and `typed` keys.
  - Failure scenario: remove the prefix and the separation still holds, or break the separation and this test still passes. It is an audit that is not titled "audits that". Verdict: C35, coverage carried by another test.
- **P2. Edits to existing assertions and allow lists are not all listed with their before and after.**
  - The report lists the chips floor (56 to 55) and the duplication re-key.
  - It does not list:
    - the two removals and one retitle in `allow-audits.txt`;
    - the new SOLID entry `'src/lib/views/system/workbench/Settings.svelte .contents.over'` in `tests/ui/theme/wall.test.ts:166`;
    - `config-folder.test.ts`'s predicate change (`pages.indexOf('views')).toBe(pages.indexOf('help') + 1)`, the chord list without `w`);
    - the rail count and label assertions in `settings.test.ts` and the rail and catalogue tests.
  - The chips floor itself is not a loosening to pass: the only `<Tag` the diff removes in `src` is `Config.svelte`'s `t('config.local_tag')`, and a count of plain `<Tag` elements in `src/lib` now gives 55.
  - The wall entry is an exemption, judged under ST5.
- **P3. The report's rename-grep row is not reproduced.**
  - The report: "Rename grep ... one hit, `settings-editors.test.ts:303`".
  - A search for `[Cc]onfig view` over DESIGN.md finds lines 389, 391 and 399. Verdict: item 6.
- **P4. A wrong statement in the badge before-and-after.**
  - The report: "only Audit and Hpc register badges".
  - `grep -rn "badge:" src/lib/views` also lists Calendar, Inbox, Leads, Personal, Projects and Repositories.
  - The conclusion still holds: Audit is the only view on the merged page with a badge, so the button shows the audit count before and after.
- **P5. First runs and line counts were taken before the last change.**
  - The base-tree run is `s4-first-run-2.txt` at 19:02. These test files were modified after it: `folders.test.ts` 20:31, `editors-writer.test.ts` 20:32, `editors-draft.test.ts` 20:39, `wall.test.ts` 19:19, `chips.test.ts` 19:24.
  - For the three suites whose module did not exist on the base, the outcome cannot differ. The new wall SOLID entry would fail on the base ("an entry that stops being needed fails"), and that failure is not quoted.
  - For the 7 unloadable suites there is no per-test failing line, only `Cannot find module`.
  - The line counts are stale as listed above.
- **P6.** Item 4's proof column cites `settings-editors.test.ts`, whose head comment says it does not cover the table of contents. The covering test is `contents.test.ts`.

## Standards

- **ST1. DESIGN.md sentences the diff makes false.**
  - :389 "...which `Source.svelte` draws for a file it may not write and the Config view draws for each configuration file..."
  - :391 "...what a save from the Config view writes..."
  - :399 "...the Config view draws it as the last card, with a tag saying it is this machine's own..."
  - Failure scenario: a reader of DESIGN.md looks for a view that no longer exists, and :399 contradicts Z170 (no card of `local.yml`). Verdict: item 6.
- **ST2. The builder ran git commands.** Its report lists `git status`, `git diff`, `git ls-files`, `git log` and `git show HEAD:...`. `agents/spec.md` ("Where you work") forbids every git command to a builder. None of them moves a ref or changes the working tree: `git status --short` shows no staged entries and only the step's own files. Nothing the tree depends on was changed by them.
- **ST3. The same helpers are written twice.**
  - `isPlain` at `config-value.ts:51` and `draft.ts:70`. `sameInOrder` at `config-value.ts:96` and `draft.ts:349`.
  - Two exported `flowText` with different behaviour: `server/edit/block-render.ts:40` and `state/system/config/editors/flow.ts:29`. One name, two functions.
  - `lodash-es` (`isPlainObject`, `isEqual`) is already a dependency, and the data layer is shared by both sides (`data/prose/languages.ts`).
  - No reuse grep is quoted in the report. The rules file says "a parser, a fold or a rule exists once".
- **ST4. `draftSlot` is an export with no reader and a false doc comment.**
  - Where: `state/system/config/editors/slots.ts:66-72` "The key a draft is known by in markup and in the writer".
  - The writer keys by `row.id` (`writer.ts:61,64`), and `data-draft` is read by no test, style or code (`grep -rn "draftSlot\|data-draft" src tests`).
- **ST5. A wallpaper check passed by exemption.**
  - Where: `tests/ui/theme/wall.test.ts:166-167` exempts the new overlay; `Settings.svelte:280-291` uses `.contents.over { ... background: var(--panel); z-index: 2; ... }`.
  - The tree's other overlays answer the rule with the popover fraction (`--wall-popover`: Prompt, QuickPick, FloatingList, FloatingBar, Confirm, Tooltip).
  - Failure scenario: over a wallpaper this one surface is drawn opaque where every other overlay is translucent, and the check no longer asks.
- **ST6.** `src/lib/state/client/context.ts:356-357` "A Settings tab holding text typed into a field and not yet written..." is now incomplete: `settingsTyped` also counts editor drafts (`typed.ts:81-83`).
- **ST7.** `config/layout.yml`: one of the two blank lines between the end of `arrangements:` and the floats comment is removed. It is cosmetic, and inconsistent with the file's other section breaks.
- No non-ASCII (the gate is green). Every new file opens with a head comment. All files are under their caps: the largest new source file is `draft.ts` at 357 lines; `saved.ts` is 643 and `fs.svelte.ts` 876. No comment carries history.

## Behaviour

- **B1. A list row draws its refusal sentence twice.**
  - Where: `views/system/workbench/settings/Item.svelte:104-105`

    ```
    const listed = row.control === 'list' ? editors.said(row) : null;
    if (listed !== null) found.push(said(listed));
    ```

    and `editors/Editor.svelte:109-111`

    ```
    {#if refusal !== null}
        <p class="problem" role="status">{said(refusal)}</p>
    {/if}
    ```

    Both sit in the same item, since `Control.svelte` draws `Editor` for every list it can edit.
  - Failure scenario: a refused Save, a refused Reset Setting, or the file-changed sentence after a push draws the same sentence twice under a list row (once red under the editor, once as the item's status line), and announces it twice through two `role="status"` elements. A family row draws it once. Verdict: item 3 and C14.
- **B2. The write accepts a wrong configuration.**
  - Where: `server/edit/writes/config/config-value.ts:165-176`. In `misfit`, an array is accepted for any map family:

    ```
    if (Array.isArray(item)) {
        for (const [at, record] of item.entries()) {
    ```

  - Probe (node over `writeConfigValue` on a scratch engine copy): writing `nav_groups` with `help: [{ label: Help, glyph: page, chord: h }]` returned `{"changed":["layout.yml:nav_groups"],"refused":[]}`, and the file then held `34:  help: [{ label: Help, glyph: page, chord: h }]`. No reader or finding refused it.
  - The editor cannot produce this value, but any client of `/api/write` can, and the brief says such a shape is refused (a map stays a map; only `tab_rollup` holds lists).
  - On the same path, `read_limits` with `next: { a: 1 }` was written as well. The brief puts no constraint on key/value values; no reader refuses it.
  - Verdict: item 1.
- **B3. Saved layouts after the merge, not stated in the before-and-after.**
  - Labels: a rail page is created with the rail entry's label (`layout.svelte.ts:462` `newPage(label, next, key)`), and `pageName` reads `page.label` (`navigation/pages.ts:35-37`). `migrate.ts` does not relabel. A browser with a saved layout, which is Axel's own and TEST's, keeps the merged page named "Views and Settings" in the Pages view, in page leaves and in pane menus, while the rail button reads "System".
  - Where the tabs land: the saved views page keeps its old arrangement (Views catalogue left, Settings and Account setup over Pages right). It has no pane holding `status`, so the five system views are appended to its last pane, the Pages pane. The shipped arrangement (Settings left, Views and Pages over the five system views) appears only after a reset.
  - What is lost: the info page's own splits, sizes and label; the state of the `config` tab (by the brief).
  - The look on TEST will see this.
- **B4. Unstated visible changes.**
  - A Settings tab holding an editor draft now counts as unsaved work (`context.ts:358-359` through `settingsTyped`), with whatever the unsaved marker or close prompt shows.
  - The table of contents overlay sits at `z-index: 2` with a solid panel and a shadow.
  - The toggle is drawn left of the search box.
  - The report states none of these three.
- **B5. What the user sees for an emptied `tab_rollup: {}`** (the builder's open decision; I state it and do not rule).
  - With `{}` held, `draftOf` (`draft.ts:144-161`) finds no list entries and draws the map-keyed records form. Its cards have the fields `key, label, keys, color` (the catalog's `['key', 'label', 'keys', 'color']`), with Add, and no way to give a key a list of records.
  - A Save of one card writes a map of single records. Probe: writing `{}` returned `changed`, and then writing `{ projects: { label: x, keys: [a], color: red } }` returned `changed` too, and the file held `{"projects":{"label":"x","keys":["a"],"color":"red"}}`. No reader refused it.
  - So the user does not merely see the wrong form once (the report's "Against" for option (b)): they can save a shape the boards' roll-up does not take. Not verified: what the boards then draw.

## Declined to judge

- Everything a DOM shows: the presses, focus, scrolling, the narrow overlay, Escape, the draw of the editors, B1's double sentence on screen, and B3's labels on Axel's saved layout. These are the orchestrator's look on the TEST page.
- Whether VS Code's narrow Settings editor draws a `list-tree` toggle. Checking needs VS Code's source, which I did not fetch.
- The Z282 placement of `processes`, which is the landing's merge.

Usage: not measured (about 75 tool calls, claude-opus-5-5).

## Repair round 1, refuted

S4, the Settings editor finished. Worktree `/Users/axelfaes/workspace/research-hub/.agents/worktrees/S4`, base 3c772d4c.

**What I touched outside the worktree.** I changed nothing in the worktree or the repository. The worktree's status still has the same 116 entries (`git status --short | wc -l`), and the same 51 files are newer than the round's start.

My scratchpad, `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad`, turned out to be shared with earlier agents of this session. It holds the builder's `s4-pre-r1/` and other agents' folders. Before I saw that, I wrote into a folder `base/` that already existed there (dated Oct 1) with `rsync` and `patch -R`, and I used plain file names at its top: `checks.txt`, `cv.bak`, `Item.bak`, `fold.bak`, `s4.patch`, `untracked.txt`, `patch.log`, `patch2.log`, `probe1.mjs`, `zz-pre.mjs`, `ref`, `rbase-path`. I don't know whether any of those names belonged to another agent; the orchestrator should not rely on them.

Everything I made myself is in `wt/` (a copy of the worktree's `tools/oculus`, my probes under `wt/oculus/probes/`), `eng/` (a scratch engine) and `rbase-<pid>/` (a clean base built from `git diff 3c772d4c`). No copy holds `local.yml`. I ran `npm run diagrams` twice in the worktree, as the brief asks; no byte changed.

## Verification lines (verbatim)

`checks.sh`, run from the worktree's `tools/oculus`, exit 0. The load average was 12.75 at the start and 5.46 at the end.

```
$ npm test
 Test Files  512 passed | 24 skipped (536)
      Tests  12876 passed | 639 skipped (13515)
   Duration  200.88s (transform 48.85s, setup 0ms, import 424.83s, tests 324.42s, environment 194ms)
$ npm run test:checks
 Test Files  30 passed | 2 skipped (32)
      Tests  450 passed | 9 skipped (459)
$ npm run check
1790974116075 COMPLETED 3165 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
$ npm run build
✓ built in 4.95s
✓ built in 12.13s
$ npm run format:check
All matched files use Prettier code style!
$ npm run lint
$ ! LC_ALL=C grep -rna '[^ -~]' src tests
checks: 7 commands passed
```

No test timed out, so nothing was rerun alone.

The other checks:
- **Verify 2.** `grep -rn "views/system/config\|group: 'info'" tools/oculus/src tools/oculus/tests` printed nothing (exit 1).
- **Verify 3.** `grep -c "page: info" tools/oculus/config/layout.yml` printed `0`. `grep -n "^  info:" ...` printed nothing (exit 1).
- **Diagrams.** `cat docs/diagrams/* | md5 -q` gave `af74857c972e9648d1815286719e7163` before, after the first `npm run diagrams` and after the second. This matches the report.
- **ASCII gate** of `spec.md` (the perl form): no hit (exit 0). It printed `bfs: error: bin: No such file or directory.` because `tools/oculus` has no `bin/`.
- **Report commands I reran:**
  - The rename grep gives the report's five hits: `retired.test.ts:1,3,12,28` and `settings-editors.test.ts:306`.
  - `sh utils/folder-check.sh` exits 0, and `saved/` holds 5 files.
  - `grep -rn "badge:" src/lib/views` gives the report's nine views.
  - Every line count in the report matches `wc -l` (28 files checked).
  - The B4 sentences match the code: `TabFace.svelte:89`, `PaneView.svelte:316`, `ui.yml:87-88`, `typed.ts:81-83`.
- **Failing lines on the unchanged tree.** I built a clean base (`patch -R` of `git diff 3c772d4c`, the new files removed, the 4 deleted files restored from the diff). I ran four test files there in their final form: `layout-saved`, `retired`, `guards` and `options-catalog` (with the base's own helper). 26 tests failed, and each failing line matches the report's quote.
- **The fixes taken out one at a time** (on my scratch copy):
  - Item's guard removed: "is drawn once, under the editor..." fails with `expected 2 to be 1`.
  - `wants_record` removed: both B2 tests fail on the sentence.
  - `alone` forced false: "puts the five system views..." and "keeps the id, the state and the active tab..." fail.

## Item verdicts (the whole diff since the base)

1. **The `config-value` write: holds**, with Behaviour findings R1 and R2 and Spec finding SP-1.
   - What holds: the body and its dispatch, the refusals, the base check, `misfit` per Z302, reserved names, the read-back, `refusedBy`, History and undo.
2. **The block rewrite: holds on the brief's mechanism.**
   - It now uses `new Parser()`, `new Composer({ keepSourceTokens: true })` and `CST.setScalarValue` (`block-edit.ts:62-67`, `:50-60`; `block-render.ts:39-60`).
   - Joining flow collections by hand is needed: `stringify` pads `{ }` and `[ ]` both or neither. My probe printed `"{ a: [ 1, 2 ], m: { x: 1 } }"` and `"{a: [1, 2], m: {x: 1}}"`.
   - Behaviour regression R1.
3. **The editors: holds**, with Behaviour finding R3.
4. **The table of contents below 700 px: holds** (`contents.test.ts`). The press, the scroll and Escape are for the look.
5. **Open-the-file action and the Catalogs and Texts groups: holds.**
6. **The Config view removed: holds.** DESIGN.md:389, :391, :399 and :405 no longer name it, and the rename grep finds no document hit.
7. **The merged rail item: holds.** The `processes` merge (Z282) falls to the second of D18 and S4 to land.
8. **The saved `info` page carried over: violated (partial), finding R4.** A saved views page whose maximised pane is the Pages pane makes the whole saved layout unreadable.

## Case verdicts

- **C1 to C13: met.** C4 and C8 are met under rulings R1 and R2 of `S4-cases.md`.
- **C14: met** for a row whose editor is drawn. R3 is a case outside its scenario.
- **C15 to C28: met.** C17 is met at the state level; the rest is for the look.
- **C29: met.** `yes` is written plain and reads back as the string (SP-1).
- **C30 to C34: met.**
- **C35: met** by `editors-writer.test.ts:341`, "keeps the drafts of two keys apart, and never meets the typed text...".
- **C36: met.**

## Ruling verdicts (`S4-round1.md`)

1. **SP1, the block rewrite: closed in part.**
   - What holds:
     - the mechanism is the brief's, and the hand quoter (`plainOk`, `scalarText`, `AMBIGUOUS`) is gone;
     - C1, C3, C5, C6, C26 and C27 are green;
     - the quoting test passes.
   - Two hand pieces are left:
     - `readsAs` with a `QUOTE_DOUBLE` fallback (needed: `setScalarValue` runs no schema, and my probe shows `null`, `012` and `true` written plain without it);
     - the flow join in `flowSource`.
   - Both are about the least hand code the library leaves. But `readsAs` checks a scalar parsed on its own, outside its place in the file, and `keyText` quotes keys as block keys inside flow maps. This loses two cases the code before the round wrote correctly (R1).
2. **SP2, paths outside the write list: closed in part.** The file table does not mark `src/lib/data/sources/config/catalog/options.ts` or `config/catalogs/options.yml`. Both are outside the brief's write list. Z302 brings them in, but they are not listed with that reason.
3. **SP3: closed.** It is under "Judgment calls".
4. **B5 / Z302, `holds: lists`: closed.**
   - The key is described in `options.yml:9` and in the `CatalogEntry` doc comment.
   - The check refuses `holds` on a leaf option, any word but `lists`, and `holds: lists` over a value that is not a map of lists. Its three cases fail with the base's helper (my run).
   - The editor draws the rollup form for `{}`.
   - My probe of the write: `tab_rollup` with `projects: { ... }` is refused with "Entry projects must be a list of records...", and the file is unchanged.
5. **P1, `draftSlot` removed: closed.** Neither `draftSlot` nor `data-draft` is in `src`. The new test "carries no draft attribute" is a finding (P-2).
6. **P2, edits to assertions and allow lists listed: closed.** The `allow-audits.txt`, `allow-duplication.txt` and chips-floor entries match `git diff`.
7. **P3, P4, P6, report corrections: closed.** All three reproduce.
8. **P5, first runs redone: closed.** I spot-checked 26 failing lines on my own clean base; all match.
9. **B2, wrong shapes accepted: closed in part.**
   - What holds: `nav_groups` with `help: [ ... ]` and `read_limits` with `next: { a: 1 }` are refused and nothing is written (my probe and the tests).
   - What does not: the reading "a scalar or a list of scalars in every key/value family" lets `read_limits` with `next: [1, 2]` and `deck.tag_tones` with `x: [a]` be written (R2).
10. **B1, a refusal drawn twice: closed in part.**
    - What holds: one element and one `role="status"` for a row with an editor (test, and my rerun without the fix).
    - What does not: the `drawsEditor` guard does not match when `Control.svelte` actually draws the editor (R3).
11. **ST1, DESIGN.md lines: closed.**
12. **B3, saved layouts after the merge: closed in part.**
    - What holds: the label, the new pane below Pages, and the tab state are as ruled.
    - What does not:
      - R4, the whole saved layout lost when the Pages pane is maximised;
      - P-1, the report's and a test title's claim that the active tab is kept;
      - P-3, the fixture is not the old shipped shape.
13. **ST5, the narrow overlay: closed.** `.contents.over` uses `color-mix(... var(--wall-popover) ...)`, and `wall.test.ts` has no diff against the base.
14. **B4, the before-and-after sentences: closed.**
15. **ST3, one definition each: closed.**
    - `grep -rnwE "isPlain|sameInOrder|flowText" src` shows one definition each: `sameInOrder` at `guards.ts:89` and `flowText` at `flow.ts:29`.
    - `isPlain` no longer occurs in `src`; `isMap` of `data/helpers/guards.ts` replaces both copies.
    - The server's version is now `flowSource`.
16. **ST4: closed** (same as 5).
17. **ST6, the `context.ts` comment: closed** (`context.ts:356-358`).
18. **ST7, the blank lines: closed.** `config/layout.yml` lines 111 and 112 are blank (`cat -e`).

## Spec

- **SP-1. `yes` and `no` are written plain, against item 1's text.**
  - Where: `block-render.ts:52-57`. My probe prints `"yes"  "yes"` and `"no"  "no"` for a value and `yes: 2` for an added key.
  - The brief's item 1 lists `yes` and `no` among the strings "written quoted". The CST route leaves that decision to the library. They read back as strings, because every reader of these files is the `yaml` library (`data/sources/config/merge.ts:8`, `local.ts:9`), and no Python reader of the oculus config was found.
  - The report does not name this departure.
  - Failure scenario: only a YAML 1.1 reader, which none of these files has today, would read `yes` as true.
  - Verdict: item 1, minor, no defect in behaviour.
- **SP-2. The file table misses two paths.** The "Paths outside" list does not name `src/lib/data/sources/config/catalog/options.ts` or `config/catalogs/options.yml`. Verdict: ruling 2, closed in part.

## Proof

- **P-1. "Keeps the active tab" is overstated.**
  - Where: the report, ruling 12: "its tabs are carried over by id, state and active tab". Also `layout-saved.test.ts`, "keeps the id, the state and the active tab of every info tab but config". `fold.ts:25-27` (`paneOf`) makes the first tab active.
  - Probe: an info page of one pane with `audit` active, folded. The new pane reads `["i-sta",[...]]`, so `status` is active and `audit` is not.
  - The test passes only because its fixture's active tab is the first one.
  - Failure scenario: a reader whose System page showed Audit finds Status shown after the upgrade.
  - Verdict: ruling 12.
- **P-2. A test of an absence, titled as a behaviour.**
  - Where: `settings-editors.test.ts:423-429`, "carries no draft attribute on the editor".
  - It asserts that a removed attribute nothing read is absent. Under `spec.md` line 60 it is an audit, and it is not titled "audits that".
  - The same holds for `tests/checks/source/retired.test.ts`. It greps document text, and the report presents it as the failing test for ruling 11.
  - Verdict: rulings 5 and 11, minor.
- **P-3. The "old shape" fixture is not the old shipped arrangement.**
  - Where: `layout-saved.test.ts:483-492`, `oldViewsRoot`: a row of `[settings, account-setup]` and `[catalogue, pages]`.
  - The shipped arrangement before the step was a row of `catalogue` and a column split 0.6/0.4 of `[settings, account-setup]` over `[pages]` (`config/layout.yml` in the base diff).
  - My probe on the real old shape, with no maximised pane, folds correctly, so this is a gap in coverage. It is also how R4 went unseen.
  - Verdict: ruling 12.

## Standards

- **ST-1. A 30000 ms limit covers a cost the test creates itself.**
  - Where: `tests/server/edit/yaml/block-edit.test.ts:126-131`, `{ timeout: 30000 }`. The case body calls `isListOption` (`:165-167`), which runs `catalogOf(loadConfig(engineDir()).config)` once per list block. `blocks()` has already loaded the same catalog.
  - The case took 779 ms alone in my run, not the "about two seconds" its comment says.
  - The fix that ends the cause is to load the catalog once (or pass it in). Raising the limit is a loosened tolerance under `spec.md` line 16.
  - The 30000 ms precedents the builder cites (`comment-width`, `history`, `readable`) are walks over the whole tree, which this case is not.
  - Failure scenario: none at runtime. A slow helper is hidden behind a raised limit.
  - Verdict: a widened tolerance.
- **ST-2. Wording that compares with an earlier state, in new comments and titles.**
  - Where:
    - `tests/checks/source/retired.test.ts:1` "The Config view is gone" and `:4` "describes a screen that no longer exists";
    - `layout-saved.test.ts:481` "a saved views page of the shape before the merge";
    - `settings-editors.test.ts:101` "...and no longer summarises the list as a count" (from the step's first round).
  - `spec.md` line 42 names these words in comments and test titles. A migration test can name the old shape without "before", for example "a saved views page holding no system view".
  - Verdict: minor.
- **Chips floor (56 to 55): holds.** The only plain `<Tag` removed is the Config view's.
- **Allow lists:** none was touched in the round. The SOLID entry of `wall.test.ts` is removed, so that file equals the base.
- **`options-findings.ts`:** it is a check of facts, run over the shipped tree as well, so it does not pass by leaving a path unread.

## Behaviour

- **R1. Two kinds of string the code before the round wrote are now refused.**
  - Where:
    - `block-render.ts:57`: `readsAs(token.source, value)` parses the scalar on its own;
    - `block-render.ts:64` `keyText` passes `scalarSource(key, false, undefined, true)`, which quotes keys as block keys, and `flowSource` uses it inside `{ }` (`:75`), as `rebuildFlow` does (`block-edit.ts:243`).
  - Probes (`setBlock`):
    - `w: [a, b]` with item 0 set to `"a\nb"` gives `w: [a\n\nb, b]`, which does not parse;
    - `m: { a: 1 }` given a key `x,y` gives `m: { a: 1, x,y: 2 }`, which reads back as `{a:1, x:null, y:2}`.
  - Through `writeConfigValue` on a scratch engine, the write is refused with "The edit would change more than this value...". It happens for `waiting_status` (a flow list) with a newline item, whether added or changed, for `audit_ignore: []` given one, and for `read_limits` (a flow map) given a key `a,b`.
  - The code before the round (`scratchpad/s4-pre-r1`, which holds `plainOk`) wrote all three correctly: `w: ["a\nb", b]` and `m: { a: 1, "x,y": 2 }`.
  - The editor can produce a newline string: a value or record field typed as `"a\nb"` reads to a newline through `readFlow`.
  - The file is never corrupted; the read-back refuses.
  - Failure scenario: such a Save is refused with a sentence that does not say why.
  - Verdict: ruling 1, closed in part. One way to close it: check the scalar inside its flow or key context, or write `QUOTE_DOUBLE` when the value holds a line break or the key is in a flow map and holds `,[]{}`.
- **R2. A list is accepted in key/value tables that hold single values.**
  - Where: `config-value.ts:57-60`, `isTableValue`, applied to every key/value family (`:169-170`).
  - Probe: `read_limits` with `next: [1, 2]` and `deck.tag_tones` with `x: [a]` both returned `changed` and were written. No reader refused either.
  - The catalog describes a list value only for `languages` (`options.yml:547`). The other five families' files hold scalars only.
  - A narrower rule is available and matches the brief's own rule for families ("the collection kind the file holds"): accept a list only where the file's own entries are lists, or mark `languages` in the catalog. The builder reported its reading, but the wrong-configuration class that B2 named stays open for the five scalar tables.
  - Verdict: ruling 9, closed in part.
- **R3. A refusal can be drawn nowhere, and a hidden draft keeps the tab marked unsaved.**
  - Where:
    - `editors/slots.ts:104-108`: `drawsEditor` is true when `savedDraft(...) !== undefined || draftOf(row) !== null`;
    - `settings/Control.svelte` (`const drawn = $derived(draftOf(row) !== null)`) draws `Editor` only when `draftOf(row) !== null` and the row is not missing.
  - So when a draft is held but the file's value no longer reads into one, the item does not draw the sentence and no editor is drawn.
  - Probe on my copy of `settings-editors.test.ts`:
    1. Save a `waiting_status` draft and have it refused.
    2. Keep the draft held.
    3. Push the file as `waiting_status: [one, 2]`.
    4. Render the item. It printed `editor drawn: false | refusal occurrences: 0 | draft still held: true`.
  - The held draft also keeps the tab counted as unsaved (`settingsTyped`, `typed.ts:82`), and no Discard is drawn to clear it.
  - Failure scenario: Axel hand-edits a list into a shape the editor does not draw while a refused draft is held. The refusal disappears, and closing the tab asks to lose unsaved changes he cannot see.
  - Verdict: ruling 10, closed in part. `drawsEditor` should be `draftOf(row) !== null`. A held draft over a row that draws no editor needs a way to end it.
- **R4. A maximised Pages pane makes the whole saved layout unreadable.**
  - Where: `fold.ts:61-64` wraps the pane holding `pages` in a new column split (`rewrite(next, under.path, below)`), and `workbench.focus` is left as it was. `parseLayout` then fails `checkPages` (`saved.ts`, `checkWorkbench`: "focus names ..., which is not a pane") and returns null.
  - Probe over the real old shape, a row of `[catalogue]` and a column of `[settings, account-setup]` over `[pages]`:
    - no maximised pane: folds correctly;
    - settings pane `[1, 0]` maximised: folds correctly;
    - pages pane `[1, 1]` maximised: `parseLayout returned null (whole saved layout refused)`.
  - `loadLayout` (`layout.svelte.ts:411-424`) then takes `defaultPages(first)`, and the next save overwrites the stored layout. Every page, tab and float the browser held is lost.
  - The same holds when the views page is a single pane holding `pages` and that pane is maximised (path `[]`).
  - Failure scenario: Axel's or TEST's browser opened with the Pages pane maximised on Views and Settings resets to the shipped pages on the first load after S4 lands.
  - Verdict: item 8, violated (partial), and ruling 12, closed in part. One way to close it: when the maximised pane is `under`, add `0` to the end of the focus path.

## Declined to judge

- **Everything a DOM shows** is the orchestrator's look on TEST: the editors drawn, the presses, focus, the narrow overlay and its toggle, Escape, the overlay's translucency over a wallpaper, and the System label and new pane on Axel's or TEST's saved layout. Check R4 there only on a copy of the layout, never on the real one.
- **The `processes` placement (Z282)**, which is the landing's merge.
- **Whether VS Code draws a `list-tree` toggle in its narrow Settings editor**: I did not fetch VS Code's source.

Usage: about 75 tool calls; tokens not measured (claude-opus-5-5).
