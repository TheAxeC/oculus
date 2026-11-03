# Step O126 refuter report (on .agents/worktrees/migration-O126, base 936a411b2)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH npm run test:quick -- --base 936a411b2   (worktree root; exit 0)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.7 s)
ok      eslint (3.3 s)
ok      svelte-check (12.9 s): 1793702380505 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (22.3 s): Duration  7.27s (transform 8.25s, setup 0ms, import 21.82s, tests 184ms, environment 2ms)
ok      vitest slow (34.8 s): Duration  19.72s (transform 4.54s, setup 0ms, import 7.32s, tests 12.18s, environment 1ms)
ok      vitest checks (53.7 s): Duration  38.52s (transform 16.02s, setup 0ms, import 34.44s, tests 58.41s, environment 3ms)
test:quick: 56.6 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files

$ npx vitest run tests/views/sources/repositories/open-version.test.ts tests/checks/source/keys.test.ts tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts --reporter=dot
 Test Files  4 passed (4)
      Tests  37 passed (37)

$ grep -rn --exclude=local.yml 'ChangeGroups\|sec-h\|ch_tree' src config
(nothing; grep exit 1)

$ sh utils/unused-exports.sh  > scratch; diff ../O126-base/unused-exports.txt scratch
219a220
> src/lib/views/shared/changes/groups/change-menu.ts: CHANGE_OPEN_CHANGES, CHANGE_OPEN_HEAD, CHANGE_OPEN_FILE, CHANGE_STAGE, CHANGE_UNSTAGE, CHANGE_DISCARD, CHANGE_IGNORE, CHANGE_COMPARE_WORKSPACE, CHANGE_REVEAL
224d224
< src/lib/views/sources/repositories/menus/change-menu.ts: CHANGE_OPEN_CHANGES, CHANGE_OPEN_HEAD, CHANGE_OPEN_FILE, CHANGE_STAGE, CHANGE_UNSTAGE, CHANGE_DISCARD, CHANGE_IGNORE, CHANGE_COMPARE_WORKSPACE, CHANGE_REVEAL
(the same line under the moved path, as the report says)

$ sh utils/folder-check.sh
(no output; exit 0)

$ node utils/outside-paths.mjs /Users/axelfaes/workspace/oculus/.scratch/migration/agents/briefs/O126.md 936a411b2
.scratch/migration/agents/briefs/O126-cases.md
(exit 0. That file is untracked in the worktree and `cmp` with main's `.scratch/migration/agents/briefs/O126-cases.md` prints nothing, same size and mtime: the orchestrator's ruling file, not a builder write. Every other changed path is inside the write list.)

Commands the report quotes, rerun:
$ grep -rhn -- '--line:' src/lib/themes/ | grep -v '#[0-9a-fA-F]\{6\};'
(nothing; exit 1, as the report says)
$ git diff 936a411b2 --stat -- src/lib/ui/tree/TreeItem.svelte src/lib/views/sessions/session-detail/SessionDetail.svelte src/lib/views/shared/explorer/sections/Section.svelte config/text/views/sessions/session-list.yml
(nothing: all four unchanged, as the report says)
$ grep -rnE "sessions\.<key>\b" src tests | wc -l, per removed key
clear_glyph 0, clear_title 0, rename_glyph 0, rename_label 0, rename_placeholder 0, rename_tip 0, resume_label 0, ch_tree 0
kept or added, over src: resume_unknown 1, resume_live 2, pin_tip 1, f_cwd 1, details_session 1, details_model 1, details_usage 1
$ wc -l of the changed files (worktree, base)
change-tree.ts 378 (331); GroupHead.svelte 252 (253); Customizations.svelte 316 (312); SessionList.svelte 502 (467); SessionWorkspace.svelte 263 (260); TerminalRows.svelte 158 (151); session-list.ts 223 (222); pane-fold.ts 55 (53); SessionSection.svelte 88 (56); SessionSections.svelte 148 (157); session-sections.ts 86 (56); Changes.svelte 76 (359); Repo.svelte 391 (446); changes.yml 115 (116); session-detail.yml 43 (47)
(every count in the report's file table reproduces)
$ diff of each moved file against its base copy
ChangeRow.svelte: head comment rewritten; `session` and `mark` props; openChange given `session` at :122 and :170; `.mark` span and rule. FolderRow.svelte: head comment; `level` and `depth` props in place of `3 + row.depth` / `2 + row.depth`. picking.ts, change-menu.ts: head comment and import paths only. SharedMark.svelte: identical (diff exit 0).
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds for what is drawn: `SessionList.svelte:453` draws `<div class="divider">` after the list's TreeView and before SessionSections/Customizations, `:481-488` `margin: 0 -12px -1px; z-index: 1; background: var(--line)`, so one full-width line covers the first head's inset line; the mechanism differs from the cases ruling, Spec 1.
- 2: holds: `SessionWorkspace.svelte:203-221` and `TerminalRows.svelte:120-137` TreeItem level 2 depth 1, `expanded`, `count` with `badge`, folder `title`, press `fold.toggle`; rows level 3 depth 2, drawn only while open; `.fold` lost `scroll-padding-top` and its comment is fitted; head comments of both files, `session-list.ts:6-11`, `GroupHead.svelte:57`, `pane-fold.ts:1-9` made true.
- 3: holds: `views/shared/changes/groups/` holds GroupList, ChangeRow, FolderRow, picking, change-menu, change-picks (6 items); `Changes.svelte` keeps its TreeSection around `GroupList level={2} depth={1}`; cut warning at `depth + 1` (`GroupList.svelte:241-243`, equal to the base `depth={2}`); selection moved whole into `change-picks.svelte.ts`, used by `Repo.svelte:125` and `ChangesSection.svelte:77`; `changeGroupRows` in `change-tree.ts` used by `repositoryKeyRows`; `ChangeRow` takes `mark` and `session`; both test paths follow. G104's Code line (`.scratch/migration/agents/guarded.md:357`) still names `src/lib/views/sources/repositories/menus/change-menu.ts`; the brief leaves that rewrite to the orchestrator at landing.
- 4: violated in one clause, Spec 2 (a readable repository with no change draws no badge); every other bullet holds: Touched and The repository group rows (`ChangesTouched.svelte:52-63`, `ChangesRepository.svelte:141-154`), GroupList at level 3 depth 2 under the branch line, field and commit box (`ChangesRepo.svelte:86-115`), the mode control on the Changes head through `more` (`ChangesSection.svelte:97-115`), folds in `folded` under `changes:*` ids (`changes-folds.ts`), key rows with parents and `open` (`SessionSection.svelte`), one TreeView per section, ChangeGroups and change-actions deleted, `ch_tree` removed.
- 5: holds: three group rows (`DetailsBody.svelte:94-105`), facts at level 3 depth 2 with the value in TreeItem's `detail` snippet, `li title` the whole value, empty facts filtered (`detail-facts.ts:198-204`), meter in the context row, Rename/Pin/Resume/Open the transcript on the head through `more` (`DetailsSection.svelte:168-210`), outcome row at the top, catalog keys removed and added as the item says, `resume_unknown`/`resume_live` kept, `TreeItem.svelte` unchanged.
- 6: holds: `Customizations.svelte:234-243` level 2 depth 1 `badge`; findings, items and the none row at depth 2.
- 7: holds: `docs/HELP.md:295`, `:340`, `:341` rewritten; `README.md:16,25` still true; one sentence of `:341` is wider than the ruling, Standards 2.

Cases of the brief's "Cases":

- C1: met by reading (`SessionList.svelte:453,481-488`; every TreeSection `.section` has `border-top` at its top edge, `TreeSection.svelte:97-102`, and the first child of `.sections` and of `.customize` is that section; `--line` is opaque in every shipped theme and an app theme's alpha is composited over `--panel`, `vscode-map.ts` head comment); the drawing is settled at the look.
- C2: met by reading (`SessionWorkspace.svelte:203-221`; folds in the tab's `folded`, `pane-fold.ts`).
- C3: met by reading (`TerminalRows.svelte:120-137`).
- C4: met by reading (no sticky element left in the fold; `.fold` keeps `max-height` and `overflow` only); the scroll is settled at the look.
- C5: met: the four test files pass after with only their paths changed (the two one-line diffs); `Changes.svelte` draws the same TreeSection and GroupList draws the base markup at the same levels; the dedup of picked ids is ruling 4 of the cases ruling.
- C6: met by reading (`ChangesTouched.svelte:59` badge, `changesRows` drops the files while folded; fold id names no session).
- C7: met by reading (`count={files.length > 0 ? files.length : undefined}`, the empty row under it).
- C8: met by reading (repository badge `changeCount`, GroupList rows, ChangeRow controls, ContextMenu, `createChangePicks` for Cmd presses and Shift+Down).
- C9: met by reading (`ChangesRepo.svelte` hands `mark`, `ChangeRow.svelte:175-177`; `SharedMark.svelte` identical to its base copy).
- C10: met by reading (`ChangesRepository.svelte:128-138,183-190`, no badge since `readable === null`).
- C11: met by reading (`keep({ mode })` writes the Session tab's `ui.instanceState(owner)`, not the Repositories view's).
- C12: partial by reading: groups, one row per fact with a value, ended pid left out, meter in the context row, TreeItem unchanged all hold; "no line wraps at the pane's width of 300 px" is not verifiable here, settled at the look.
- C13: met by reading, under the cases ruling's C13 sentence (`title-field.ts` `escapeCloses` acts only on an Escape whose target is inside its own box; one `titleField` in `SessionList.svelte:168`; `titleToWrite` clears on an empty text; `onleave` a no-op in both fields).
- C14: met by reading (`pinGroups`, `pin`, `write`).
- C15: met by reading (`armed` keyed by `record.id`, `disabled={record.live}`, `title={resumeWords}`); whether a disabled ToolButton shows its tooltip is settled at the look.
- C16: met by reading (`SessionDetail.svelte:79` passes no `fields`; folds through its own pane's instance context; mode and picks under its own instance id).
- C17: met by reading (the `body.rice` rule on `.sections` and on `.list` covers every row by inheritance; TreeItem sets a face only on count, end and badge, as before); the face is settled at the look.
- C18: met by reading (`changesViewOf` defaults; `usePaneFold.open` is `!includes`).
- C19: met by reading (`ChangeRow.svelte:122,170` pass `session`).
- C20: met by reading (fold ids prefixed `changes:` and `details:`; `foldOfRow` and `groupOfRow` return null for any other id; `includes` folds a twice-written id once).
- C21: met by reading (`z.enum(...).catch('list')`; `new Set` in `changesViewOf` and in `change-picks.svelte.ts:49-50`; undrawn ids filtered).
- C22: met by reading (GroupList's merge branch: error tone, no ContextMenu, list in tree mode).
- C23: met by reading (`GroupList.svelte:241-243`).
- C24: met by reading (`linked` in GroupList passed to every ChangeRow).
- C25: met by reading (one TreeView per section; the branch menu, field and commit box in `li.lines`, no key row).
- C26: met by reading (`SessionDetail.svelte` unchanged; the divider lives in SessionList only).
- C27: met by reading (`Customizations.svelte:234-284`).

## 1. Spec

- `src/lib/views/sessions/session-list/SessionList.svelte:481-488`: ".divider { position: relative; z-index: 1; flex: none; height: 1px; margin: 0 -12px -1px; background: var(--line); }"; what is wrong: the cases ruling item 1 names the shape "In the Sessions tab, that first head drops its own top border, so one line stands there"; the build keeps that border and paints a full-width line over it, a substitute mechanism. The report names the departure and its reason, which reproduces: `tests/checks/tree/boundaries.test.ts:301-320` `findPrimitiveStyling` refuses any `:global(...)` rule in a view that names a class a `ui/` component declares, and `.section` is TreeSection's own; dropping the border needs a prop on `src/lib/ui/tree/TreeSection.svelte`, outside the write list. failure scenario: none in any shipped or converted theme, since `--line` is always opaque; the two differ only where a background is not painted while a border is (a forced-colours rendering), where the inset head line would show and the full-width line would not. verdict: none; item 1 holds for what is drawn. The orchestrator decides whether the covered line stands or TreeSection gets the prop the ruling's shape needs.
- `src/lib/views/shared/sessions/sections/changes/ChangesRepository.svelte:148`: "count={count > 0 ? count : undefined}"; what is wrong: item 4 bullet 2 gives The repository "its count the number of files in its change groups as a badge while it is readable and no badge while it is not", and decision 8 says it counts "as every other group row counts its rows"; a readable repository with no change draws no badge, while its own Changed group row right under it draws "0" (`GroupList.svelte:304` `count={group.entries.length}`). failure scenario: a session whose repository is clean shows The repository with no badge and Changed with a "0" badge beneath it, and the reader cannot tell a clean repository from one not yet read without opening the row; verdict: item 4 violated in that clause.

## 2. Proof

- `.scratch/migration/agents/reviews/O126-report.md`, "Judgment calls the brief left open": "A group row with nothing to count shows no badge (Touched with no file, the repository with no change), as Repositories' groups do."; what is wrong: the claim does not reproduce: Repositories' empty Changed group row draws "0" as a badge (`GroupList.svelte:304`, `TreeItem.svelte:245-246` draws the count whenever it is not undefined), and Repositories' Changes head draws `count={total}` with `badge` even at 0 (`Changes.svelte` TreeSection). The orchestrator's acceptance of the repository row's missing badge (Spec 2) rests on this reason. failure scenario: the orchestrator reads the judgment as matching the Repositories look and keeps it; verdict: item 4, with Spec 2.

## 3. Standards

- `src/lib/views/shared/sessions/sections/title-field.ts:9`: "Escape is read on the document in capture phase, ahead of any other listener on the page"; what is wrong: a head comment the code makes false (rules file, "What every package obeys", the rule that a sentence a change makes false is a defect): a window capture listener runs before any document listener (`src/lib/shell/panes/PaneBody.svelte:144,225,268`), and a document capture listener added earlier runs first too (`src/lib/ui/menu/Tooltip.svelte:204`, `src/lib/views/sessions/terminal/list/kill-arm.svelte.ts:97`). failure scenario: a reader debugging an Escape that both closes the field and ends an armed keep in PaneBody trusts the comment and looks elsewhere.
- `docs/HELP.md:341`: "Rename opens the title row's value as a field that answers as the list's does, and opening one of the two fields closes the other."; what is wrong: the cases ruling item 2 makes the coordination "within one tab"; the bullet is the Session bullet, which covers a Session tab too, where Details' field stands alone. failure scenario: a user with the Sessions tab's list field open renames in a Session tab and expects the list field to close, and it stays open.
- `src/lib/views/shared/sessions/sections/SessionSections.svelte:14-15`, `src/lib/views/shared/changes/groups/ChangeRow.svelte:15-16`, `src/lib/views/shared/changes/groups/GroupList.svelte:3-4`: "(views/shared/explorer/sections/" / "list-drag.svelte.ts)", "state/sources/repositories/" / "repositories.ts's statusStyle()", "(views/sources/repositories/changes/" / "Changes.svelte)"; what is wrong: a path is broken across two comment lines, so the grep the rules file's name rule relies on ("After changing a name ... grep it across src, tests, config, docs") misses it; the base kept `views/shared/explorer/sections/list-drag.svelte.ts` whole on one line. failure scenario: a later step that moves `list-drag.svelte.ts` greps `explorer/sections/list-drag` and leaves SessionSections.svelte's head comment naming the old place.
- `.scratch/migration/agents/reviews/O126-report.md`, "How point 1 is built" and the paragraph under Verify 1: "failed on the rule `.divider + :global(.sections > :first-child .section)` until it went" and "The first run failed on comment lines past column 100 ..., on "this session" in two head comments ..., and on the divider rule styling `.section` ...; all three were fixed"; what is wrong: the rules file's "The working rules" says a report states the end state with no narration of wrong turns taken and backed out; the run count is required, the account of what the first run failed on is not. failure scenario: the orchestrator reading the landing material takes the narrated failures for open defects and spends a read confirming they are gone.

## 4. Behaviour

- `src/lib/views/shared/sessions/sections/details/DetailsSection.svelte:71-82`: "let typed = $state(''); ... let outcome = $state(''); ... let armed = $state(''); const now = Date.now();"; what is wrong: these now live in DetailsSection, which stays mounted while the Details section is closed (`SessionSections.svelte:77-84` draws it for every `details` entry of the order), where the base held them in DetailsBody inside the section's body, which a closed section unmounts (`SessionSection.svelte:7`; the base DetailsBody head comment: "It is drawn while the section is open, so a title typed and not written, and a resume asked once, are gone when the section closes."). An armed Resume, the outcome row and the typed title now survive a close and reopen, and `now` is fixed at the tab's mount rather than refreshed by a reopen. The report's "Visible changes" does not state it. failure scenario: the reader presses Resume once on an ended session, closes Details, reopens it later and presses Resume, taking it for the first press, and the agent runs at once; a Sessions tab left open past midnight shows a session started after midnight with the date form "11-04 00:30" in its started row where today's form is "00:30", and closing and reopening Details no longer corrects it.

## Declined to judge

- The drawn result of C1, C4, C12 (no wrap at 300 px), C15 (tooltip of a disabled ToolButton), C17 and the rest of the visual cases: a builder and a reviewer run no page; settled at the look on landing on a scratch server.
- Whether the builder ran the verify list exactly twice: settled by its transcript (`grep -c 'test:quick' ~/.claude/projects/-Users-axelfaes-workspace-oculus/<session>/subagents/agent-a60c985f78f84ef3c.jsonl`), which a reviewer does not read.
- G104's Code line in `.scratch/migration/agents/guarded.md:357` still names the old `menus/change-menu.ts` path: the brief gives that rewrite to the orchestrator at landing.
- How the step's lines of `GroupHead.svelte` and `docs/HELP.md` merge with O125's at landing: settled by the cherry-pick in the gate.

Reviewer usage: a5a6eef1ec6ba505c, claude-opus-5-5, 304410 tokens, 92 tool uses, 13 min 50 s.

## Repair round 1, refuted

```
$ shasum docs/diagrams/* > scratch; PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams   (worktree root)
(lists every docs/diagrams/*.dot and *.svg; shasum before and after compare equal: "diagrams unchanged")

$ PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH npm run test:quick   (worktree root, run once)
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.3 s)
ok      eslint (2.5 s)
ok      svelte-check (8.8 s): 1793704211049 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (16.1 s): Duration  5.83s (transform 6.71s, setup 0ms, import 15.79s, tests 151ms, environment 1ms)
ok      vitest slow (24.5 s): Duration  14.19s (transform 3.48s, setup 0ms, import 5.41s, tests 8.63s, environment 0ms)
ok      vitest checks (41.6 s): Duration  31.09s (transform 12.73s, setup 0ms, import 27.18s, tests 43.21s, environment 2ms)
test:quick: 44.2 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
(the changed set is git's diff since HEAD plus the untracked files, tests/tiers/quick.mjs:99-103, so TreeSection.svelte and Section.svelte are in it)

$ npx vitest run tests/views/sources/repositories/open-version.test.ts tests/checks/source/keys.test.ts tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts   (as the brief gives it, three runs, whole output kept)
run 1, exit 0, the whole output:
 RUN  v4.1.11 /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O126

 Test Files  4 passed (4)
      Tests  37 passed (37)
   Start at  12:11:07
   Duration  21.82s (transform 11.47s, setup 0ms, import 21.97s, tests 10.80s, environment 1ms)
run 2, exit 0:  Test Files  4 passed (4) /      Tests  37 passed (37)
run 3, exit 0:  Test Files  4 passed (4) /      Tests  37 passed (37)
(no run failed, so no failing test to quote)

$ grep -rn --exclude=local.yml 'ChangeGroups\|sec-h\|ch_tree' src config
(nothing; exit 1)

$ sh utils/unused-exports.sh > scratch; diff ../O126-base/unused-exports.txt scratch
219a220
> src/lib/views/shared/changes/groups/change-menu.ts: CHANGE_OPEN_CHANGES, CHANGE_OPEN_HEAD, CHANGE_OPEN_FILE, CHANGE_STAGE, CHANGE_UNSTAGE, CHANGE_DISCARD, CHANGE_IGNORE, CHANGE_COMPARE_WORKSPACE, CHANGE_REVEAL
224d224
< src/lib/views/sources/repositories/menus/change-menu.ts: CHANGE_OPEN_CHANGES, CHANGE_OPEN_HEAD, CHANGE_OPEN_FILE, CHANGE_STAGE, CHANGE_UNSTAGE, CHANGE_DISCARD, CHANGE_IGNORE, CHANGE_COMPARE_WORKSPACE, CHANGE_REVEAL

$ sh utils/folder-check.sh
(no output; exit 0)

$ LC_ALL=C perl -ne '<the spec.md ASCII gate>' $(find src tests bin config -type f ! -name local.yml)
find: bin: No such file or directory
(no line printed; exit 0)

Round item 6's grep, over the 36 added or modified files of the step (src, tests, config, docs/HELP.md, diagrams left out):
$ xargs grep -n '/$' < files | wc -l
421
$ xargs grep -n '/$' < files | grep -vE '\*/$|//$'
(nothing; exit 1)

Commands the report quotes, rerun:
$ wc -l, now (base) -- every count of the round's file table reproduces:
TreeSection.svelte 123 (112); Section.svelte 79 (75); SessionSection.svelte 92 (56); SessionSections.svelte 161 (157); ChangesSection.svelte 155 (new); ChangesRepository.svelte 195 (new); detail-facts.ts 271 (new); DetailsSection.svelte 196 (new); DetailsBody.svelte 271 (new); title-field.ts 47 (new); SessionList.svelte 500 (467); Customizations.svelte 321 (312); ChangeRow.svelte 335 (new); GroupList.svelte 366 (new); docs/HELP.md 617 (617)
$ grep -n 'z-index' src/lib/views/sessions/session-list/SessionList.svelte
(nothing; exit 1)
$ git diff --stat 936a411b2 -- src/lib/ui/tree/TreeItem.svelte src/lib/views/sessions/session-detail/SessionDetail.svelte config/text/views/sessions/session-list.yml
(nothing)
$ ls <folder> | wc -l
sections 8; sections/changes 6; sections/details 3; shared/changes 6; shared/changes/groups 6
$ grep -rnE "sessions\.<key>\b" src tests | wc -l, per key
clear_glyph 0, clear_title 0, rename_glyph 0, rename_label 0, rename_placeholder 0, rename_tip 0, resume_label 0, ch_tree 0; resume_unknown 1, resume_live 2, pin_tip 1, f_cwd 1, details_session 1, details_model 1, details_usage 1
$ grep -rn 'change-actions\|ChangeActions' src tests docs README.md
(nothing; exit 1)
$ sed -n of each file:line the round's table cites
DetailsBody.svelte:70 `let typed = $state('');`, :73 `let outcome`, :79 `let armed`, :82 `const now = Date.now();`, :124 `onMount(() => {`; SessionList.svelte:456 `<SessionSections ... divided />`, :458 `<Customizations owner={instance.id} divided={followed === null} />`, :481-486 `.divider { flex: none; height: 1px; margin: 0 -12px; background: var(--line); }`; Customizations.svelte:46, :49, :174 `noTopLine={divided}`; TreeSection.svelte:52, :72, :77 `<div class="section" class:bare={noTopLine}>`, :111-113 `.section.bare { border-top: none; }`; Section.svelte:41, :58, :63; SessionSection.svelte:50, :66, :87; ChangesSection.svelte:55, :58, :131; DetailsSection.svelte:183; ChangesRepository.svelte:62 `const count = $derived(readable === null ? undefined : changeCount(readable));`, :150 `{count}`; ChangesTouched.svelte:59 `count={files.length > 0 ? files.length : undefined}`; boundaries.test.ts:472-479 `it('lets no view or shell component style a primitive own class', ...)`. All as the report says.
$ git diff 936a411b2 -- config/text/views/sessions/session-detail.yml config/text/views/sessions/changes.yml
(the keys removed, added and `f_cwd: folder` exactly as the report's Catalog paragraph lists)

The round's delta: diff -u of each files.txt path's snapshot copy against the worktree changes 13 files (docs/HELP.md:341, Customizations.svelte, SessionList.svelte, ChangeRow.svelte, GroupList.svelte, ChangesRepository.svelte, ChangesSection.svelte, detail-facts.ts, DetailsBody.svelte, DetailsSection.svelte, SessionSection.svelte, SessionSections.svelte, title-field.ts) plus the diagram counts; outside files.txt the round changes src/lib/ui/tree/TreeSection.svelte and src/lib/views/shared/explorer/sections/Section.svelte (each now differs from the base only by the `noTopLine` prop, the `bare` class and rule, and one head-comment sentence).
```

### Verdicts

Items of the brief's "What to build", over the whole diff since the base:

- 1: holds. `SessionList.svelte:454` draws `<div class="divider">` after the list's TreeView, :481-486 a plain in-flow 1 px `--line` line reaching through the body's 12 px side padding. The first head under it drops its own top border through `TreeSection.svelte` `noTopLine` (:52, :72, :77, :111-113), handed on by `Section.svelte:63` and `SessionSection.svelte:87`. Exactly one line in each order: `sectionOrder` always returns all four ids (`session-sections.ts:37-40`), `SessionSections.svelte:86-137` has a branch for each id and draws all four unconditionally, and `underLine` (:80-82) gives `noTopLine` to `order[0]` only. The other heads, Customizations after the sections included, keep their inset border. With Customizations alone, `divided={followed === null}` makes its TreeSection bare (`Customizations.svelte:174`). Nothing stands between the divider and the first `.section`; the only border on a head is `.section`'s (`TreeItem.svelte:293,297` are the drag indicators' inset shadows). A Session tab passes neither prop (`SessionDetail.svelte:79`).
- 2: holds. `SessionWorkspace.svelte:204-215` and `TerminalRows.svelte:121-131` draw TreeItem rows at level 2, depth 1, with `expanded`, `count` and `badge`, the folder as `title`, and a press calling `fold.toggle`; their rows are drawn only while open. Head comments, `GroupHead.svelte:57` and `pane-fold.ts` are as the first report found.
- 3: holds, as the first report found. The round changes only the head comments of `ChangeRow.svelte:11-17` and `GroupList.svelte:1-13`. G104's Code line is the orchestrator's at landing.
- 4: holds. The repository row's `count` is `undefined` while the repository is not readable and `changeCount(readable)` otherwise, 0 included (`ChangesRepository.svelte:62,150`). TreeItem draws any count that is not undefined (`TreeItem.svelte:245-246`), so a clean repository shows "0", the same as Repositories' Changed group (`GroupList.svelte:304`). Touched keeps no badge with no file (`ChangesTouched.svelte:59`). The rest is as the first report found.
- 5: holds. The groups, fact rows, outcome row and head controls are as before. `typed`, `outcome`, `armed` and `now` now live in `DetailsBody.svelte:70-82`, which a closed section unmounts.
- 6: holds (`Customizations.svelte:234-246`: level 2, depth 1, `badge`).
- 7: holds. `docs/HELP.md:295`, :340 and :341 are true of the code; `README.md` is unchanged. One head comment of the step is false, Standards 1.

Cases of the brief's "Cases":

- C1: met by reading (item 1 above; the cases ruling's shape: the first head drops its border, one full-width line). The drawing itself is settled at the look.
- C2: met by reading (`SessionWorkspace.svelte:204-215`; the fold is kept in the tab's `folded`).
- C3: met by reading (`TerminalRows.svelte:121-131`).
- C4: met by reading (`.fold` keeps only `max-height` and `overflow`, `SessionList.svelte:472-475`). The scroll is settled at the look.
- C5: met. The four test files pass in all three reruns; each test file changed only its path; `Changes.svelte:55-66` keeps its TreeSection around `GroupList` at level 2, depth 1.
- C6: met by reading (`ChangesTouched.svelte:52-63`).
- C7: met by reading (`ChangesTouched.svelte:59`; the empty row under it at depth 2).
- C8: met by reading. The repository badge is `changeCount` (3 for 1 changed and 2 untracked). The groups are GroupList at level 3, depth 2, and the selection comes from `createChangePicks`.
- C9: met by reading (the `mark` snippet; `SharedMark` unchanged).
- C10: met by reading (no badge while `readable === null`; the shape's message under the row).
- C11: met by reading (`ChangesSection.svelte:99-115`, `keep({ mode })` in the Session tab's own state).
- C12: not verifiable for "no line wraps at the pane's width of 300 px", which only a page shows. Every other clause is met by reading: the groups, one row per fact with a value (`detail-facts.ts:199-206`), the ended pid left out (:137), the meter in the context row, `.value` set to `white-space: nowrap` with an ellipsis, `TreeItem.svelte` unchanged.
- C13: met by reading, under the cases ruling's C13 sentence. `titleToWrite` clears on empty text; `escapeCloses` acts only on a target inside its box; `onleave` does nothing; one `titleField` in SessionList is handed to Details as `fields`. Closing Details now also closes Details' field (`DetailsBody.svelte` onMount cleanup).
- C14: met by reading (`pinGroups`, `detail-facts.ts:255-271`; the pick goes through `act` to `body.pin`, then `write` and the outcome row).
- C15: met by reading. `armed` is keyed by `record.id`, `resumeWords` takes the confirm words with `record.cwd` while armed, and `disabled={record.live}` with the `resume_live` tooltip. Whether a disabled ToolButton shows its tooltip is settled at the look.
- C16: met by reading (`SessionDetail.svelte:79` passes no `fields` and no `divided`; folds, mode and picks are its own).
- C17: met by reading (the `body.rice` rules on `.sections` and `.list` are unchanged).
- C18: met by reading (the `changesViewOf` defaults; `usePaneFold.open`).
- C19: met by reading (`ChangeRow.svelte` passes `session` to `openChange`).
- C20: met by reading (fold ids under `changes:` and `details:`; `groupOfRow` and `foldOfRow` return null for any other id).
- C21: met by reading (`.catch('list')`; `new Set` in `changesViewOf` and `change-picks.svelte.ts`; ids of rows no longer drawn are filtered out).
- C22: met by reading (GroupList's merge branch).
- C23: met by reading (`GroupList.svelte:241-243`, `depth={depth + 1}`).
- C24: met by reading (`linked` is passed to every ChangeRow).
- C25: met by reading (one TreeView per section; the branch menu, the new-branch field and the commit box are in an `li` that is no key row).
- C26: met by reading (`SessionDetail.svelte` unchanged; the divider is only in SessionList).
- C27: met by reading (`Customizations.svelte:234-246`, with the findings and items at depth 2).

Round items:

- 1: holds. The shape is the one the cases ruling item 1 names (item 1 above). There is no negative margin and no `z-index` (`grep -n 'z-index'` prints nothing; `margin: 0 -12px`). The TreeSection prop defaults to the border drawn. The comments at `SessionList.svelte:33-39` and :478-480 are true. boundaries.test.ts and size.test.ts pass (verify 2).
- 2: holds. The badge shows "0" when the repository is clean and no badge when it is not readable (`ChangesRepository.svelte:62,150`). The judgment call is rewritten with `GroupList.svelte:304` and `TreeItem.svelte:245-246` (report, "Judgment calls", second bullet).
- 3: holds. `typed`, `outcome`, `armed` and `now` are in `DetailsBody.svelte:70-82`. Its onMount hands `DetailsActions` to the section, and its cleanup hands `null` and calls `setField(null)` when the field is Details'. Both head comments say where each lives and that a close drops them (`DetailsSection.svelte:12-19`, `DetailsBody.svelte:18-23`). The `detailRows` read with `now: 0` is sound: `stamp` returns '' only when the date is null, whatever `now` is (`format.ts:58-72`).
  - Rename, Pin and Resume on a closed Details. At the base, Details had no head controls (`git show 936a411b2:.../SessionSections.svelte`, its Details `SessionSection` takes no `more`). The Pin select, the title field and Resume were in the body (`git show 936a411b2:.../DetailsBody.svelte:14-16,236,246`), so they could be reached only with Details open.
  - In the round-1 snapshot, Rename opened a closed Details (`if (!open) ontoggle();`), and Pin and Resume acted with it left closed.
  - Now all three open it first, through `act` (`DetailsSection.svelte:96-103`).
  - Neither round item 3 nor brief item 5 asks for this. It follows from item 3, because what the three act on now exists only while the body is drawn. The report lists it as a judgment call, in its Visible changes and in `HELP.md:341` (Behaviour 1).
- 4: holds at `title-field.ts:9-11`. The function doc comment at :22-23 still states the claim the round removed from :9 (Standards 1).
- 5: holds (`docs/HELP.md:341`: "In the Sessions tab, opening Details' field closes the list's and opening the list's closes Details'; a Session tab's Details field stands alone.").
- 6: holds. `SessionSections.svelte:14-15`, `ChangeRow.svelte:11-13` and `GroupList.svelte:2-4` keep each path whole, and the filtered grep prints nothing.
- 7: holds for the two places it names: "How point 1 is built" (report line 22) and the Verify 1 paragraph (line 94) state the end state and the run count. One narrated earlier state remains in the round section (Standards 2).

### 1. Spec

none

### 2. Proof

none. One of the builder's five verify 2 runs printed `1 failed`. In this review's three runs of the same command no test failed, so the red does not reproduce.

### 3. Standards

- 1. `src/lib/views/shared/sessions/sections/title-field.ts:22-23`: " * What the box around a title field carries: Escape pressed while the focus is inside the box / * closes the field through `close`, and nothing else on the page sees that key."
  - What is wrong: this is a sentence the code makes false (rules file, "What every package obeys", the rule that a sentence a change makes false is a defect). The listener is a document capture listener that calls `stopPropagation` (:29-34). Window capture listeners run before it and see the key: `PaneBody.svelte:144` `window.addEventListener('keydown', typed, true)` ends an armed keep on any key. `stopPropagation` does not stop other capture listeners on the document either, such as `Tooltip.svelte:204` and `kill-arm.svelte.ts:97`. Round item 4 removed the same claim from :9 and asked that no order be named against window or other capture listeners; :23 still makes it.
  - Failure scenario: a reader works out why an Escape in the title field also ends an armed keep in PaneBody. The doc comment says nothing else sees the key, so they look elsewhere.
  - Verdict: none.
- 2. `.scratch/migration/agents/reviews/O126-report.md:204`: "After round 0 they were held by `DetailsSection.svelte`, which stays mounted while closed, so they outlived a close. After round 1 they are held by `DetailsBody.svelte` again".
  - What is wrong: the rules file, "The working rules", says a report states the end state with no narration of wrong turns taken and backed out. Round item 3 asks for the before (the base) and the after. The round-0 state in between is the builder's own backed-out turn.
  - Failure scenario: the orchestrator reading the landing material takes the round-0 state for something that might still hold and spends a read confirming it is gone.
  - Verdict: none.

### 4. Behaviour

- 1. `src/lib/views/shared/sessions/sections/details/DetailsSection.svelte:96-103`: "async function act(run: (body: DetailsActions) => void): Promise<void> { if (!open) { ontoggle(); await tick(); } if (actions !== null) run(actions); }", used by Pin (:111-113) and Resume (`onclick={() => void act((body) => void body.resume())}`).
  - What is wrong: this is a new visible behaviour no round item asks for. A Pin pick or a Resume press on a closed Details head now opens the section, which is written to the tab's `closed` state through `ontoggle`. In the round-1 snapshot only Rename did this. The report surfaces it under "Judgment calls the brief left open" (fifth bullet), in "Visible changes" (last bullet) and in `HELP.md:341`, so the decision is not silent. It is listed here for the orchestrator to keep or reverse.
  - Failure scenario: a reader keeps Details closed to keep Changes near the list and pins the session from the head. Details opens and stays open after a reload, and Changes moves down the pane.
  - Verdict: none.

### Declined to judge

- Whether `actions` is set by the time `act`'s `await tick()` resolves after `ontoggle()` on a closed Details. If it is not, a Pin pick or a Resume press on a closed Details does nothing. This needs Svelte's client runtime with a DOM. It is settled at the look: close Details, pick an area from Pin, and see the outcome row say saved.
- The drawn result of C1 (one line, edge to edge, in each section order and with Customizations alone), C4, C12 (no wrap at 300 px), C15 (the tooltip of a disabled ToolButton), C17 and the other visual cases. A reviewer runs no page (spec.md:65), so these are settled at the look on landing.
- The cause of the builder's one red run of verify 2: its output was not kept, and three reruns here passed.
- How many times the builder ran `npm run test:quick` in the round. That is settled by its transcript, which a reviewer does not read.
- G104's Code line in `.scratch/migration/agents/guarded.md`: the brief gives that rewrite to the orchestrator at landing.
- How the step's lines of `GroupHead.svelte` and `docs/HELP.md` merge with O125's: settled by the cherry-pick in the gate.

Reviewer usage: ac782cca5d8c0891d, claude-opus-5-5, 209552 tokens, 45 tool uses, 9 min 28 s.

## Closed

- The first run's findings (Spec 1-2, Proof 1, Standards 1-4, Behaviour 1): closed in repair round 1, as the run over round 1 gives (round items 1-7 hold).
- Round 1, Standards 1 (`title-field.ts:22-23`): fixed at landing; the doc comment says the key goes no further down to the field's own handlers or up to any bubbling listener, naming no order against window or other capture listeners.
- Round 1, Standards 2 (`O126-report.md:204`): fixed at landing; the sentence gives the base and the end state only.
- Round 1, Behaviour 1 (Rename, Pin and Resume on a closed Details open it first): kept. The three act on state that exists only while the body is drawn, and opening the section shows the outcome row their write answers in; the report, its Visible changes and `docs/HELP.md:341` state it. The point the reviewer declined (whether the body hands its actions in before `act` runs) is settled at the look: a Pin pick on a closed Details.
- G104's Code line in `agents/guarded.md:357` names `src/lib/views/shared/changes/groups/change-menu.ts`, the file's path after the move.
