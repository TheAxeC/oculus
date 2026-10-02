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
