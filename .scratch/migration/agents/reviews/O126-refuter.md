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
