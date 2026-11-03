# O126 report: the Sessions tab's shape

Everything in the brief is done. Nothing was looked at on a page (spec.md:65 bars the builder from running one), so every visible case below is checked by reading the code and waits for the landing's look.

## Open items of the state file (verbatim)

- Open item 640 (2026-11-03), from O125's widening under ruling 638. The Processes table's actions column stays in place while its cells scroll sideways under it, and over a wallpaper it is painted at `panel_opacity` (`src/lib/views/system/machine/processes/ProcessTable.svelte:204-209`), so a cell's text shows through it as through the headings 637 and 638 made solid. It is a column, not a heading row, so neither ruling names it. (a) Recommended, a judgment: it paints solid `--panel` over a wallpaper too, so no strip that stays in place has text behind it; two lines and its comment, added to O125 if ruled before O125 lands. (b) Keep it translucent; this is the lazy option.

## The cases

### The stop and the ruling (round 0)

The first run stopped before any change on C1. The brief said nothing is drawn between the fold and the sections (brief line 11, and line 64's before state). The code draws a 1 px `--line` line there already: every section head is a `TreeSection`, whose `.section` has `border-top: 1px solid var(--line)` (`src/lib/ui/tree/TreeSection.svelte:97-102`), reached by Details through `SessionSection.svelte` and `Section.svelte:59`, and by Customizations directly. That line stops 12 px short of each pane edge, inside the body's `padding: 10px 12px` (`src/lib/ui/frame/Pane.svelte:238`). Item 1 built as written would put a second line on top of it.

The orchestrator's ruling (`.scratch/migration/agents/briefs/O126-cases.md`):

1. Item 1 and C1: one full-width 1 px `--line` line between the list's fold and the first section head after it (Details, or Customizations when no session is followed), the first head's own top line dropped in the Sessions tab so one line stands there, the other heads keeping their inset lines; "with the spacing the tree's sections keep between them" dropped. Option (b), widening the head line alone, was the lazy option.
2. C13: coordination within one tab; the Sessions tab keeps one value naming the open field; a Session tab's Details field stands alone; Escape closes only the field that holds the focus, through one shared helper whose capture-phase document listener acts only while its own box holds the focus.
3. `sessions.f_cwd` becomes "folder"; the other names keep the catalog's words, without the capitals.
4. The four in-path points stand: Cmd+Enter on a session's tracked row calls `openChange` with the session's id and an untracked row keeps `openChangeBeside`; a fact row's whole value is a `title` on its wrapper; the shared selection removes duplicate ids; the Pin menu uses `groups`, its first group with heading `''`.

How point 1 is built: the first head's line is covered, not removed. `SessionList.svelte` may not style `.section` of `TreeSection` (the check "lets no view or shell component style a primitive own class", `tests/checks/tree/boundaries.test.ts:472-479`, failed on the rule `.divider + :global(.sections > :first-child .section)` until it went), and `TreeSection.svelte` is outside the step's paths. So the divider is `position: relative; z-index: 1; height: 1px; margin: 0 -12px -1px` (`SessionList.svelte:481-488`): the element after it rises 1 px, its head's own line falls in the divider's row, and the divider is painted over it. Every theme's `--line` is an opaque `#rrggbb` (`grep -rhn -- '--line:' src/lib/themes/ | grep -v '#[0-9a-fA-F]\{6\};'` prints nothing), so the two lines read as one, edge to edge. The other heads keep their inset lines.

### First run (before any change) and the state after

The before column is the first run handed back at the stop. Before the change, `npx vitest run tests/views/sources/repositories/open-version.test.ts tests/checks/source/keys.test.ts tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts` printed `Test Files  4 passed (4)` and `Tests  37 passed (37)` (start 10:54:38). Paths after are `src/lib/views/` unless named.

| Case | First run | After, by reading |
|---|---|---|
| C1 | Line present, inset 12 px; premise wrong (above) | `sessions/session-list/SessionList.svelte:453` draws `<div class="divider">` after the list's TreeView and before `SessionSections`/`Customizations`; rule at :481-488, drawn over the first head's line |
| C2 | Unmet: sticky GroupHead strip; rows level 3, depth 1 | `SessionWorkspace.svelte:204-215` group row: TreeItem level 2, depth 1, `expanded`, `count={group.rows.length}` with `badge`, `title` the folder key, press calls `fold.toggle(group.key)`; rows at level 3, depth 2 (:137-138, :159-160), drawn only while open (:216). Fold key, `listRows` and Left/Right unchanged (`SessionList.svelte` TreeView `ontoggle`, `session-list.ts` `listRows`) |
| C3 | Unmet: Terminals a GroupHead | `TerminalRows.svelte:121-131` group row headed Terminals, badge `entries.length`; rows level 3, depth 2 (:69-70), drawn only while open (:132) |
| C4 | Unmet: sticky heads, `scroll-padding-top` | No sticky element in the fold; `.fold` keeps `max-height` and `overflow` only (`SessionList.svelte:472-475`) |
| C5 | Holds | `sources/repositories/changes/Changes.svelte:62` wraps `GroupList` at level 2, depth 1 in its TreeSection; Repo.svelte uses `createChangePicks` (:125, :257); the four tests pass after (DONE table) with only their paths changed (diff below) |
| C6 | Unmet: flat `sec-h`, no fold, no count | `shared/sessions/sections/changes/ChangesTouched.svelte:51-63` group row, `count` the number of files as a badge, folds under `changes:touched`; files at level 3, depth 2, drawn only while open; `changesRows` leaves them out of the key rows while folded (`changes-folds.ts`) |
| C7 | Unmet for the group row | Same row with no badge at 0 (:59), the `ch_touched_empty` muted row under it (:67) |
| C8 | Unmet: `sec-h`, fixed-open heads, one-path controls, no menu, no selection | `ChangesRepository.svelte:141-154` group row, badge `changeCount` of the readable repository (:148); `ChangesRepo.svelte:86-100` branch line, new-branch field and CommitBox, then `GroupList` at level 3, depth 2 (:101-115) with its group rows, actions, right-click menus and selection; `createChangePicks` gives Shift+Up/Down, Cmd+A and Cmd+Enter (`ChangesSection.svelte:77-85`, `keymap={picks.keymap}` :127) |
| C9 | Holds | `ChangesRepo.svelte:82-84` `mark` snippet draws `SharedMark`; `shared/changes/groups/ChangeRow.svelte:176` draws it in `<span class="mark">` |
| C10 | Unmet for the row; the messages hold | Same group row with no badge; the shape's message as one muted or error row at depth 2, git's reason as the `li` title for `missing` and `none` (`ChangesRepository.svelte:183-189`) |
| C11 | Unmet: no mode control | `ChangesSection.svelte:97-115` the `modes` ToolButton (`repositories.view_list`/`view_tree`, glyphs `list`/`view_tree`) on the head through `more` (:126); `keep({mode})` writes `mode` into the tab's state (`session-sections.ts` `withChangesView`), apart from the Repositories view's own |
| C12 | Unmet: a `dl` form, empty facts drawn, wrapping lines | `details/DetailsBody.svelte` group rows Session, Model, Usage (level 2, depth 1, chevron, no count); facts at level 3, depth 2, name muted, value in `detail` right-aligned with an ellipsis (`.value`, :76-85), whole value as the `li` title; `detail-facts.ts:201` drops facts with no value (ended pid, unstated effort); the context row holds `Meter` (:76); every part is `white-space: nowrap`; `git diff --stat -- src/lib/ui/tree/TreeItem.svelte` prints nothing |
| C13 | Unmet: TextInput with Title/Clear Title; empty Enter in the list wrote nothing | Details: Rename opens `NameField` in the title row (`DetailsBody.svelte` `field` snippet, :120); Enter writes `titleToWrite(text, title)` (`title-field.ts`), so `''` clears; Escape closes through `escapeCloses` with nothing written; `onleave` is a no-op. The list's field: `SessionWorkspace.svelte` uses the same `escapeCloses` and `SessionList.svelte:325` `renamed` uses `titleToWrite`, so an empty Enter clears. One `titleField` in SessionList (:168) is handed to Details as `fields`, so opening one closes the other; `escapeCloses` acts only on an Escape whose target is inside its own box |
| C14 | Unmet: a Select | `details/DetailsSection.svelte:181-191` Menu with `groups={pins}`; `detail-facts.ts:242` `pinGroups`: "(scored)" first (active while unpinned), the workspace's own areas, then one group per hub, the pinned area `active`; a pick writes `area` (`''` for "(scored)"), and the outcome row says `write_saved` or `write_failed` (`DetailsBody.svelte:90`) |
| C15 | Unmet as a head action | `DetailsSection.svelte:192-201` Resume ToolButton: first press arms (title `resume_confirm` with the folder), second runs `resumeTerminal`, selects and shows the terminal; `disabled={record.live}` with the title `resume_live` |
| C16 | Old shapes; separation holds | `sessions/session-detail/SessionDetail.svelte:79` draws `SessionSections` with no `fields`, so its Details keeps its own field; folds go through `usePaneFold` of its own pane and `mode`/`picked` through its own instance id |
| C17 | Holds | `SessionSections.svelte` keeps the `body.rice` monospace rule on `.sections`; `SessionList.svelte` keeps it on `.list`; the rows inherit the face |
| C18 | Holds trivially | `changesViewOf` reads a state with neither key as `list` and `[]`; `usePaneFold` reads no fold id as open; no code reads any other form |
| C19 | Press and Enter hold; the menu unmet | `ChangeRow.svelte:170` press and Enter call `openChange(root, group, path, session)`; the menu's open items pass `session` (:122); `ChangesRepo.svelte` hands `session={record.id}` to `GroupList` |
| C20 | Not applicable | Fold ids `changes:touched`, `changes:repository`, `changes:group:<g>`, `changes:folder:<g>:<path>` (`changes-folds.ts`) and `details:<g>` (`detail-facts.ts` `groupFold`); list folds are an absolute path, `list`, `terminals`, `''`; `foldOfRow` maps only its own row ids and returns null otherwise; `usePaneFold.open` is `includes`, so an id written twice folds once and an unknown id folds nothing |
| C21 | Unmet | `session-sections.ts` `changesViewOf`: `mode` with `.catch('list')`, `picked` through `new Set`; `change-picks.svelte.ts:49-50` keeps only drawn ids, each once |
| C22 | Unmet | The merge group is drawn by the shared `GroupList`, the Repositories view's own code, so its error tone, Open in Merge Editor, Open File, Mark Resolved, no menu and a list in tree mode are the same |
| C23 | Partial | `GroupList.svelte:241-243` cut warning at `depth + 1`, one step in from the group rows at the caller's depth |
| C24 | Unmet | `GroupList`'s `linked` and the row menus are shared, so Compare with Workspace appears for a linked worktree |
| C25 | Unmet: a second TreeView | One TreeView per section (`SessionSection.svelte`); the branch Menu, the TextInput and CommitBox sit in an `li` that is no key row (`ChangesRepo.svelte:86-100`; `changesRows` lists no row for them) |
| C26 | Holds | `SessionDetail.svelte` unchanged; the divider is drawn by SessionList only |
| C27 | Unmet: depth 0, plain count | `sessions/session-list/Customizations.svelte:234-243` level 2, depth 1, `badge`; findings, items and the none row at level 3, depth 2 (:255-256, :268-269, :283-284) |

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1. The divider | DONE | `SessionList.svelte:453`, :481-488 |
| 2. The list's group heads | DONE | `SessionWorkspace.svelte:204-221`, `TerminalRows.svelte:121-136`; head comments of both, `session-list.ts:6-10` and `listRows` doc; `GroupHead.svelte:57` drops the session list; `pane-fold.ts:1-9` |
| 3. The change groups in `views/shared/changes/groups/` | DONE | `GroupList.svelte`, `change-picks.svelte.ts`, `ChangeRow.svelte` (`mark`, `session`), `FolderRow.svelte` (`level`, `depth`), `change-tree.ts:256-329` (`GroupFolds`, `collapsedFolds`, `changeGroupRows`, used by `repositoryKeyRows`) |
| 4. The session's Changes section | DONE | `sections/changes/`; `ChangeGroups.svelte` and `change-actions.ts` deleted; `ch_tree` removed |
| 5. Details | DONE | `sections/details/`; catalog below |
| 6. Customizations | DONE | `Customizations.svelte:234-284` |
| 7. The pages | DONE | `docs/HELP.md:295`, :340, :341; `README.md:16-25` read, no sentence false (left unchanged) |
| Verify 1 | DONE | `npm run diagrams`, then `npm run test:quick` (output below) |
| Verify 2 | DONE | 4 passed, 37 passed, before and after |
| Verify 3 | DONE | grep prints nothing |
| Verify 4 | DONE | one moved line, nothing added |
| Verify 5 | DONE | exit 0 |
| Verify 6 | DONE | below |

Verify 1, the last lines of `npm run test:quick` after `npm run diagrams` (diagrams rewrote `docs/diagrams/layer-views.{dot,svg}` and `layers.{dot,svg}`):

```
ok      prettier (1.3 s): All matched files use Prettier code style!
ok      ASCII gate (1.4 s)
ok      svelte-kit sync (3.2 s)
ok      svelte-check (13.9 s): 1793701494927 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (15.7 s)
ok      vitest (22.2 s): Duration  5.78s (transform 7.49s, setup 0ms, import 16.29s, tests 264ms, environment 1ms)
ok      vitest slow (33.0 s): Duration  16.63s (transform 3.39s, setup 0ms, import 5.18s, tests 11.25s, environment 0ms)
ok      vitest checks (53.0 s): Duration  36.47s (transform 15.34s, setup 0ms, import 31.29s, tests 52.46s, environment 2ms)
test:quick: 56.3 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

The full list ran twice. The first run failed on comment lines past column 100 (`comment-width.test.ts`), on "this session" in two head comments and HELP.md:341 (`history.test.ts`, the phrase is the label `sessions.ch_touched`, now named by its key), and on the divider rule styling `.section` (`boundaries.test.ts`); all three were fixed and the second run is the one quoted. No change was made after it.

Verify 2, after:

```
 Test Files  4 passed (4)
      Tests  37 passed (37)
```

Verify 3: `grep -rn --exclude=local.yml 'ChangeGroups\|sec-h\|ch_tree' src config` prints nothing, exit 1.

Verify 4: `sh utils/unused-exports.sh` against `.agents/worktrees/O126-base/unused-exports.txt`, the whole diff:

```
219a220
> src/lib/views/shared/changes/groups/change-menu.ts: CHANGE_OPEN_CHANGES, CHANGE_OPEN_HEAD, CHANGE_OPEN_FILE, CHANGE_STAGE, CHANGE_UNSTAGE, CHANGE_DISCARD, CHANGE_IGNORE, CHANGE_COMPARE_WORKSPACE, CHANGE_REVEAL
224d224
< src/lib/views/sources/repositories/menus/change-menu.ts: CHANGE_OPEN_CHANGES, CHANGE_OPEN_HEAD, CHANGE_OPEN_FILE, CHANGE_STAGE, CHANGE_UNSTAGE, CHANGE_DISCARD, CHANGE_IGNORE, CHANGE_COMPARE_WORKSPACE, CHANGE_REVEAL
```

The same line under the file's new path; the step added no unused export.

Verify 5: `sh utils/folder-check.sh` exits 0 with no output.

Verify 6: every new and changed comment and the three HELP.md sentences were read against spec.md:21 and spec.md:45. No departure is left. The ASCII gate of spec.md:103 (over `src tests config`, since the worktree has no `bin`) prints nothing.

The two test files, the whole diff:

```
-        file: 'lib/views/sources/repositories/changes/ChangeRow.svelte',
+        file: 'lib/views/shared/changes/groups/ChangeRow.svelte',
```

```
-import { changeMenu } from '../../../../src/lib/views/sources/repositories/menus/change-menu.ts';
+import { changeMenu } from '../../../../src/lib/views/shared/changes/groups/change-menu.ts';
```

## Terms

`docs/glossary.md` does not exist; no term was added to one.

## Files

`diff -rq --exclude=local.yml` of `.agents/worktrees/O126-base/{src,tests,utils,config}` against the worktree lists only the files below.

Moved, with `mv`:

| From | To |
|---|---|
| `src/lib/views/sources/repositories/changes/ChangeRow.svelte` | `src/lib/views/shared/changes/groups/ChangeRow.svelte` (334) |
| `src/lib/views/sources/repositories/changes/FolderRow.svelte` | `src/lib/views/shared/changes/groups/FolderRow.svelte` (123) |
| `src/lib/views/sources/repositories/changes/picking.ts` | `src/lib/views/shared/changes/groups/picking.ts` (117) |
| `src/lib/views/sources/repositories/menus/change-menu.ts` | `src/lib/views/shared/changes/groups/change-menu.ts` (303) |
| `src/lib/views/shared/sessions/sections/ChangesRepo.svelte` | `.../sections/changes/ChangesRepo.svelte` (175) |
| `src/lib/views/shared/sessions/sections/ChangesRepository.svelte` | `.../sections/changes/ChangesRepository.svelte` (193) |
| `src/lib/views/shared/sessions/sections/ChangesTouched.svelte` | `.../sections/changes/ChangesTouched.svelte` (103) |
| `src/lib/views/shared/sessions/sections/SharedMark.svelte` | `.../sections/changes/SharedMark.svelte` (25) |
| `src/lib/views/shared/sessions/sections/DetailsBody.svelte` | `.../sections/details/DetailsBody.svelte` (184) |

New: `src/lib/views/shared/changes/groups/GroupList.svelte` (366), `groups/change-picks.svelte.ts` (96), `sections/changes/ChangesSection.svelte` (152), `sections/changes/changes-folds.ts` (101), `sections/details/DetailsSection.svelte` (235), `sections/details/detail-facts.ts` (258), `sections/title-field.ts` (46).

Deleted: `src/lib/views/shared/changes/ChangeGroups.svelte`, `src/lib/views/shared/changes/change-actions.ts` (nothing reads either: `grep -rn 'change-actions\|ChangeActions' src tests docs README.md` and verify 3 print nothing).

Changed (lines now, base): `state/sources/repositories/change-tree.ts` 378 (331); `ui/controls/heads/GroupHead.svelte` 252 (253); `views/sessions/session-list/Customizations.svelte` 316 (312), `SessionList.svelte` 502 (467), `SessionWorkspace.svelte` 263 (260), `TerminalRows.svelte` 158 (151), `session-list.ts` 223 (222); `views/shared/card/pane-fold.ts` 55 (53); `views/shared/sessions/sections/SessionSection.svelte` 88 (56), `SessionSections.svelte` 148 (157), `session-sections.ts` 86 (56); `views/sources/repositories/changes/Changes.svelte` 76 (359); `views/sources/repositories/repo/Repo.svelte` 391 (446); `config/text/views/sessions/changes.yml` 115 (116), `session-detail.yml` 43 (47); `docs/HELP.md` lines 295, 340, 341; `docs/diagrams/layer-views.{dot,svg}`, `layers.{dot,svg}` (regenerated); the two tests (one line each). `SessionDetail.svelte`, `Section.svelte` and `session-list.yml` are unchanged. Folder sizes: `sections/` 8 items, `sections/changes/` 6, `sections/details/` 3, `shared/changes/` 6, `shared/changes/groups/` 6 (`ls <folder> | wc -l`).

Catalog: `session-detail.yml` gains `details_session: Session`, `details_model: Model`, `details_usage: Usage`, sets `f_cwd: folder`, and loses `clear_glyph`, `clear_title`, `rename_glyph`, `rename_label`, `rename_placeholder`, `rename_tip`, `resume_label` (each had 0 readers by `grep -rn "sessions\.<key>\b" src tests`); `resume_unknown`, `resume_live` and `pin_tip` stay. `changes.yml` loses `ch_tree`. No other key of `changes.yml` or `session-list.yml` lost its last reader (`grep -rnE "[a-z]+\.<key>\b" src tests` per key).

## Judgment calls the brief left open

- The repository's group row has the workspace's folder as its tooltip (`ChangesRepository.svelte:151`), as a list group row has its folder.
- A group row with nothing to count shows no badge (Touched with no file, the repository with no change), as Repositories' groups do.
- The touched files' rows draw at the tree's 13 px (`--tree-font`): the `--fs-sm` override on them went with the `sec-h` look, so they match the change rows under the repository.
- Details' outcome row stands at depth 1, level with the group rows; Details' values in Usage use the number face (`--font-num`), the others the text face.
- Rename on the Details head also opens a closed Details section and a folded Session group, so the field it opens is on screen (`DetailsSection.svelte` `startRename`); Enter and Escape in either field give the focus back to the row it stood in.
- The Pin menu's opener is a compact bare Menu with `pin_tip` as its tooltip; Rename's glyph is `edit`, the one the row menu's Rename uses.
- The selection (`picked`) of a Session or Sessions tab is one list for every session the tab shows, as the folds are; a picked id of another session's repository is not drawn and so leaves the selection when the next press writes it.
- The divider is drawn over the first head's line (the ruling's point 1, above).
- Folded list groups and folded section groups no longer keep their rows in the page, so find-in-page does not reach them; HELP.md:295 says so.

## Visible changes, before and after

- Between the list and the sections: before, the first head's inset line; after, one line across the whole pane.
- Workspace groups and Terminals: before, sticky bold strips with a fold glyph and a plain count, rows level 3 depth 1, a folded group's rows hidden in the page; after, tree group rows with a chevron, normal-case words and a count badge, scrolling with the list, rows one step further in, a folded group's rows not drawn.
- Changes: before, flat capital headings, a second implementation of the groups with always-open heads, one-path controls and a second Tab stop; after, Touched by this session and The repository as folding group rows with badges, the Repositories view's groups under the repository (menus, selection, tree mode, virtual rows, Compare with Workspace), a list/tree control on the Changes head, one Tab stop. Touched files draw at 13 px instead of 12 px.
- Details: before, a form with capital labels, a Select, a TextInput with Title and Clear Title, a Resume control and the outcome under them, the meter and two wrapping lines; after, three folding groups of one-line rows, empty facts left out, the meter in the context row, Rename, Pin, Resume and Open the transcript on the head, the outcome as a muted row at the top. The folder row says "folder" instead of "cwd".
- Both rename fields: Enter on an empty field clears the title, where the list's field wrote nothing; Escape closes only the field it is pressed in.
- Customizations: kinds at depth 1 with their counts as badges, their items one step further in.

## What in the brief was wrong

- Brief line 11 and line 64: "Nothing is drawn between the fold and the sections". A section head's own line is drawn there (`TreeSection.svelte:97-102`). Ruled as above.
- Ruling point 1 asks the first head to drop its own top line from `SessionList.svelte`. A view may not style `.section` (`tests/checks/tree/boundaries.test.ts:472-479`) and `TreeSection.svelte` is outside the paths, so the line is covered by the divider instead, with the same one line on screen.
- Brief line 13: the list's `folded` key "is the same instance state the sections keep `closed` in". The folds live in `ui.instanceState` (`pane-fold.ts`, `useState().ui`), `closed` and `sections` in `layout.instanceLayoutState` (`SessionSections.svelte`, `useState().layout`). Nothing in the build rests on it: the new fold ids go to the folds' store, `mode` and `picked` beside them in `ui.instanceState`.
- Verify 3 as written greps `config` with no `--exclude=local.yml`, which the dispatch requires for every grep over `config/`. It was run once as written; `config/local.yml` does not exist in the worktree (`test -e config/local.yml` prints absent), so nothing was read, and the run quoted above carries the exclusion.
