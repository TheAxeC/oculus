# Brief check of D56 (the workbench)

Read on main at d29631c18 (`git log --oneline -3` prints `d29631c18 Land D53, unique views` first). Every claim below was produced by a command run in this session; the command is named with each one.

The defects that would most change the brief:
- The write list is missing files the build cannot do without: `kit/load.ts` (painting a VS Code code theme), `RailFoot.svelte` (the rail's foot), `ProjectCard.svelte` (the project's Show in Files), `problem-rows.ts` (Problems limited to a folder), `tex-root.svelte.ts` (the LaTeX root), `config/catalogs/options.yml` and `docs/files-and-search.md`.
- The G54 row and its "fails on the unchanged tree" proof cannot be written, because that test builds its rows from the config file.
- Item 8 states the opposite of DESIGN.md's unique-view rule for pages made from an arrangement.
- Case 9's clear control contradicts the tree.
- Problems' `scope` is a root key, not a folder.
- Repositories limited to "repositories inside the folder" lists nothing for every hub project.
- Three folders the step must add to already hold 10 items, and `layout.svelte.ts` is at 866 of 880 lines.

## Names

Command: `grep -rn` of each name over `src tests config docs DESIGN.md HELP.md README.md --exclude=local.yml`, plus targeted greps as named. Hits outside "Paths this step writes":

1. `code_theme` / `codeThemeIds`: `src/lib/server/edit/writes/config/config-sources.ts:49-50` and `src/lib/data/sources/config/catalog/schemas/engine.ts:63-64` both return `[CODE_TOKENS, ...codeThemeIds()]`.
   - If the builder widens `isCodeTheme` but not `codeThemeIds`, two things go wrong: the server refuses a `code_theme: vscode-dark-2026` written through the Settings config row, and the YAML schema marks it as wrong in the editor.
   - If the builder widens `codeThemeIds` itself, both files stay true. The brief does not say which.
2. `codeIds` in `src/lib/ui/controls/editor/kit/load.ts:256` (`bundledThemesInfo.map(...)`) and `paintNow` at `load.ts:382-428`:
   - `const id = known.has(code) ? code : ''`, then `ownRules(classes)`, where `classes` is the body's class string.
   - A VS Code class picked as the code theme is therefore painted as `tokens` with the UI theme's own rules.
   - Item 9 ("colours code ... with that theme's rules, whatever the UI theme") cannot be met without changing `load.ts`, or `look.ts`, which passes `document.body.className`. Neither is in the write list. This is false after the change unless the list is widened.
3. `config/catalogs/options.yml`:
   - `:146`: the `code_theme` help says "the id of any theme Shiki bundles ... An id Shiki does not bundle is reported as a finding". False after item 9.
   - `:992-994`: the rail editor's `page` is `from: arrangements`. Adding `workbench:` puts "workbench" in the Settings rail page picker.
   - `:1051`: the `arrangements` help "What each rail page is first made from". False after item 2.
   - The write list names only `glyphs.yml` under `config/catalogs/`.
4. `tests/checks/config/config.test.ts:609`:
   - It asserts the finding sentence "neither tokens nor the id of a Shiki theme" (from `config/text/findings.yml:33`).
   - It is made false by item 9. It is covered by the write list's "each existing test the change makes false", but it is G13's test (see Cases and checks).
5. The rail's foot:
   - `src/lib/shell/rail/RailFoot.svelte:2-3` (head comment "Bookmarks, Search and Update") is false after item 6.
   - RailFoot.svelte is where the foot buttons and the Bookmarks menu are drawn (`RailFoot.svelte:1-25`; `ActivityRail.svelte:315` `<RailFoot ...>`). It is not in the write list.
   - `ActivityRail.svelte:2-3` ("at the foot Bookmarks, Search and Update (RailFoot.svelte)") is in the head comment's first paragraph, which the brief forbids touching "shared with D50". `diff` of main against `.agents/worktrees/D50/.../ActivityRail.svelte` shows D50 does not change lines 1-30; its changes are at 53, 63-65 and 161-171. So the exclusion blocks a sentence the step makes false, with no overlap to protect.
6. Show in Files:
   - `config/text/views/boards/project.yml:109` is read by `src/lib/views/shared/card/ProjectCard.svelte:165-171` (`id: 'files'`, `showFolderInFiles`), not by `Project.svelte`. `Project.svelte:47,129` draws `ProjectCard`.
   - So "a toolbar action beside Show in Files" on the project view lives in ProjectCard.svelte. That file is outside the write list and is also the Projects board's card (`grep -rln ProjectCard src/lib`: Projects.svelte, Project.svelte, Subtasks.svelte).
   - Other folder offers item 5 does not name: `VenueCard.svelte:84-91` (a venue link that is a hub path, which may be a folder) and `state/sources/repositories/worktrees.ts:59` (`showInFiles('', key)` on an opened worktree root). These are relevant because decision 2 reads the line as "beside each Show in Files offered on a folder".
7. The row menu: `docs/files-and-search.md:43` enumerates every item of the folder and root menus. Adding "Open in New Files" makes that enumeration incomplete. The file is not in the write list, and item 10 does not name it.
8. Problems `scope`: `src/lib/views/sources/search/problem-rows.ts:92` filters `filter.scope === '' || row.root === filter.scope`, so `scope` is a root key and cannot limit to a path inside a root. Item 3's "Problems scoped to it (`scope`)" needs `problem-rows.ts`, which is outside the write list.
9. The LaTeX root: `src/lib/views/academic/latex/tex-root.svelte.ts:4-5,78-80` holds `{ root, path, main }`. A `{ root, path }` with no main "names that folder's first main file", which pins the tab and stops it following the editor. tex-root.svelte.ts is outside the write list.
10. Search `under`:
    - `Query.svelte:118-128` draws the line `search.in_folder` ("In {0}/{1}") and the clear control `search.clear_scope` ("Search the whole root", `config/text/views/sources/search.yml:85,101`).
    - Query.svelte is outside the write list. Item 3 needs this line copied into Repositories and SessionList, not edited, so this is only a reading point.
11. `LAYOUT_VERSION`: hits only in `model.ts:149`, `layout/index.ts:6`, `saved/saved.ts:28,488,533,563` and `layout-saved.test.ts:10,71`. All are inside the write list. No literal version in another test: `grep -rln "version: 6\|version: 5\|FLOATS_VERSION"` over tests and src prints only `model.ts` and `saved.ts`.
12. `Page.rail` readers (`grep -rln "\.rail\b" src/lib`):
    - Outside the write list: `views/system/workbench/Pages.svelte`, `Catalogue.svelte`, `RailEditor.svelte`, `shell/rail/RailPages.svelte`, `shell/rail/rail.ts`, `server/edit/writes/config/config-write.ts`, `data/sources/config/catalog/options.ts`.
    - Whether a workbench page sets `rail: 'workbench'` decides what Reset all pages does. `navigation/pages.ts:243-259`: "the saved pages carrying a key no button carries, removed". The brief does not say.
13. The word "workbench" already names other things, in 250 files (`grep -rlw -i workbench ... | wc -l` prints 250):
    - the type of one page's tree (`model.ts:83-87`, `Page.workbench`);
    - the shell as a whole (DESIGN.md:68 and 176, `shell/Workbench.svelte`);
    - the text group `workbench.*` (`config/text/views/system/workbench.yml:1`);
    - DESIGN.md:474: "the workbench is one of several pages".
    The brief adds "the workbench page" as a page kind without saying how code and docs keep the two meanings apart. There is no glossary (`ls docs` shows none). A naming decision is owed.
14. The Reset label: the same action on a rail page is worded "Reset to its arrangement" (`config/text/ui.yml:69`, `views/system/workbench.yml:71`). The plan names "Reset layout" for the workbench, which gives one action two names.

## The step line

Command: `sed -n 725p plan.md`. Each part of the line, with the item that serves it:

- A page that belongs to one folder `{root, path}` of a project, a funding or education entry, a side project or any folder: items 1 and 5.
- Opened from a project: item 5 (the project view only; see Names 6).
- Opened from an entry page: item 5.
- Opened from Show in Files: item 5 and decision 2.
- Opened from the Files view's folder menu (Open in New Files): item 5.
- Switched to when already open: items 1 and 5, case 3.
- The left pane holds Files, Search, Repositories, LaTeX and Problems limited to the folder, and the sessions working inside it: items 2 and 3. Item 2 lets the builder choose "panes of a column", which conflicts with the line's singular "left pane".
- Right pane is the documents pane, with the item's own page first: items 2 and 4.
- A picked session's Transcript and Timeline open there: item 4.
- Named by the item's name, else the folder's: item 1.
- Listed under one Workbenches rail button that switches and closes: item 6.
- Keeps its layout by folder and restores it: item 7.
- Reset layout in its menu: item 7.
- The Explorer page stays: item 1.
- A unique view goes to the workbench holding it: item 8.
- A restored layout makes no copy of a unique view: item 8.
- The Code theme menu and `code_theme:` take the 19 VS Code themes by class name, listed before Shiki's, so any UI theme can colour code as VS Code does: item 9.
- "after D47 and D52, which it opens": an ordering note. The brief does not quote it.
  - `queue.md` lists D47 landed at acece2a09 and D52 at cd31fd9a3.
  - It is served by items 4 and 5 through the entry page and the session views.

Every part of the line has a requirement. Item 10 (the docs) serves no part of the line; it is a rules-file requirement.

## Premises

Each claim of "What is on the tree" was rerun:

1. `model.ts:95-100` Page, `:131` Pages, `:72` PageLeaf, `:149` `LAYOUT_VERSION = 6`: hold (`grep -n "export type Page \|..."`). `grep -n "folder\|root" model.ts` shows no page field: holds.
2. `LAYOUT_KEY` at `storage.ts:27`: wrong line. `grep -n LAYOUT_KEY` prints `storage.ts:28:export const LAYOUT_KEY = 'oculus.layout.v1';`. `saved.ts:9-20` describes the shape: holds (9-21).
3. G29 `guarded.md:74-76`, G31 `:80-82`, G54 `:188-190`, G12 `:155-157`: hold (`grep -n` and `sed -n`).
   - G12's "rail list ... in config.test.ts": `grep -n "\brail\b\|readRail" tests/checks/config/config.test.ts` finds no rail case, only `:189` `layoutFile`. "Held whole" reads as the whole file's check.
4. `layout.yml:9-21` rail and `:45` arrangements: hold. `rail.ts:21` RailEntry: holds.
   - `parseArrangement` at `arrangement.ts:72`: wrong line. `grep -n "export function parseArrangement"` prints `79:`; 71-78 is its doc comment.
5. The rail's foot at `ActivityRail.svelte:3, :182`: the lines hold, but the foot is drawn in `RailFoot.svelte` (Names 5).
6. Files `:53-58` `top`, Search `:244` `under`, Problems `:92` `scope`, Latex `:19-27`: the lines hold.
   - Problems' `scope` is a root key only (Names 8).
   - LaTeX's state lives in `tex-root.svelte.ts` (Names 9).
   - "`grep -n "under\|scope\|folder"` over Repositories and SessionList finds none" is false for Repositories: the grep prints 9 lines (3, 19, 20, 24, 31, 49, 114, 129, 165), all comments or unrelated. It holds for SessionList (no output). The substance holds: neither has a folder field.
7. `sessionsForProject` at `selectors.svelte.ts:139`: that line is the type; the function is at `:515`. Holds.
   - It matches `session.area` or `session.cwd` inside the folder (`:515-520`), so a session filed into the folder by its area while working elsewhere is listed. Case 8's "a session working elsewhere is not listed" does not hold for that session.
   - It takes an absolute folder; Entry builds one from `hubRoot()` only (`Entry.svelte:113-116`).
8. The openers:
   - `ProjectCard.svelte:251`, `Collection.svelte:315`, `project.yml:109`, `personal.yml:11`, `Personal.svelte:106`, `collection.yml:36`, `folder-files.yml:5`, `ui.yml:104`, `row-menu.ts:75` and `:287`: each line holds (`sed -n`).
   - Show in Files on the project view is ProjectCard's (Names 6).
   - "`grep -n -i "new files" config/text src/lib -r` finds nothing" is false: it prints `src/lib/server/edit/writes/config/deck/deck-new.ts:4` (unrelated: "as new files").
9. `withoutHeld` `pages.ts:213`, `createClaims` `:182`, `showHeld` `opening.ts:380`: hold. The characterisation is incomplete (Cases and checks 3).
10. `appearance.yml:86-87`, `code-themes.ts:31-33`, `themes.ts:29-36`: hold.
    - The python command prints `19`, and the keys run from `vscode-light-2026` to `vscode-light-high-contrast`: holds.
    - `theme.ts:24-29`: the comment and import hold; `ownRules` is at `:198`.
    - Unsaid in the brief: `ownRules` is called only from `load.ts` with the body classes (`grep -rln ownRules src tests` prints `load.ts` and `theme.ts`).
11. "The steps in flight: D41 and D50": holds (`queue.md:1-3`). The shared paths are incomplete:
    - D50 writes the head comment of `views/sources/files/Files.svelte`; the diff with D50's worktree shows lines 43-49 changed. D50 also writes `docs/window.md` 25 and 29, DESIGN.md lines and `HELP.md:170` (`agents/briefs/D50.md:154,157`).
    - D41 writes `DESIGN.md` 23, 166, 503, 575 and 576, and `docs/views.md` 73 with its Audit section (`agents/briefs/D41.md:286,288`).
    - D56 writes all of these files.
12. Not on the brief's list, and material:
    - D49 is queued (`queue.md:6`, "waits for D41 and D50"). Its line (`plan.md:715`) removes `docs/window.md` and `docs/views.md` and folds them into HELP.md. Item 10 writes new sections into both.
    - `git ls-tree` counts 10 tracked items in `layout/`, `layout/open/`, `navigation/` and `state/workbench/`. Any new file there needs a split.
    - `wc -l`: `layout.svelte.ts` 866, `context.ts` 861 (D41 adds lines), `Repositories.svelte` 499 of 520, `ProjectCard.svelte` 495, `EntryCard.svelte` 486.
    - The brief names neither the worktree path nor the base copy folder (`grep -n -i "worktree\|base copy\|D56-base"` shows only verify item 6's `unused-exports.txt` path). spec.md:31-32 has the brief name both.

## Cases and checks

1. G54's row (item 2, case 2, verify 4):
   - `tests/checks/config/arrangements.test.ts:16-18` is `it.each(Object.keys(arrangements))`, read from the shipped config. Adding `workbench:` to layout.yml adds the row by itself.
   - "Add its row to G54's test" has nothing to edit.
   - Verify 4's "the new row failing on the unchanged tree" is impossible: the row does not exist on the unchanged tree.
2. G29's row: the test is one `it` over a version 3 envelope (`layout-saved.test.ts:27-38`). A row means turning it into a table under the same title. That is consistent with spec.md:57.
3. G13 covers case 18:
   - G13's Code is "the config readers under `src/lib/data/sources/config/`", which includes `themes.ts`. Its test list ends with `tests/checks/config/config.test.ts`, whose `:601-638` hold the `code_theme` rows.
   - The brief says only G29 and G54 cover a case.
   - The VS Code input gives the same outcome as a Shiki id, so it may need no new row. The finding-sentence row must change.
4. G28 covers the closing:
   - G28 (`guarded.md:58-60`) covers closing a page that holds unsaved text or a running terminal. Its Code names `ActivityRail.svelte`, `state/client/context.ts`, `navigation/pages.ts` (`closeAsk`) and `Pages.svelte`.
   - The step changes the first two, and case 10's and item 6's ask is G28's behaviour.
   - The brief neither names G28 nor runs its tests.
   - Whether the new menu file joins G28's Code line is an entry question (see the guarded.md judgment at the end).
5. G70 (`guarded.md:40-42`) names `views/sources/search/Problems.svelte`, which the step changes. Its tests (`eslint-trust.test.ts`, `lint-route.test.ts`) are not in verify item 2.
6. G12 covers `config/` and `config/catalogs/`. Its test `tests/checks/config/config-folder.test.ts` is not in verify item 2, though the step changes `config/text/` and `layout.yml`.
7. Case 9 ("its clear control widens the search to every root") contradicts the tree:
   - The clear control sets `under: ''` (`Search.svelte:244`) and is worded "Search the whole root".
   - For a workbench of a root itself (`path: ''`), `under` is empty and no line is drawn (`Query.svelte:118`).
8. Case 5 points at item 4, which the tree already settles: `Personal.svelte:113-116,157` `ontitle` opens `openSourceFile` of the manifest (`manifestTarget`), so the documents pane shows the side project's `project.yml` in a source tab. The README branch of item 4 is never reached.
9. Case 7 ("named by the root's label"): a root is `{ key, dir }` (`files/files.ts:46`, `config/sources.yml:92-98`), with no label. The existing rooted Files tab names a root by its key (`open/show.ts:75`).
10. Item 8 ("as `withoutHeld` does for a page made from its arrangement") mis-states the tree:
    - `pages.ts:208-212`: `withoutHeld` is "A page made from the default".
    - A page made from an arrangement (`withPage`, `:230-236`) moves a held unique view in through `createClaims`.
    - DESIGN.md:481 states the same rule.
11. Cases against the rules file: none breaks spec.md's test rules.
    - The cases that only a page shows (1, 10, 18, 19) are left to the look, as spec.md:58-63 has it.
    - Cases 17, 18, 21 and 22 compare with "as today", which is reading.
12. The report asks about places the step does not change:
    - Report part "Each paragraph and head comment 'What is on the tree' lists, marked still true or rewritten" covers `Collection.svelte`, `ProjectCard.svelte`, `selectors.svelte.ts`, `opening.ts`, `rail.ts`, `arrangement.ts`, `guarded.md` and `layout-unread.test.ts`.
    - "Rewritten" there would be outside the write list, and `guarded.md` is the orchestrator's (spec.md:35).
    - The report path `tools/oculus/.scratch/migration/agents/reviews/D56-report.md` is under `.scratch/`, which spec.md:35 says a builder never edits. Earlier briefs (D50) do the same.

## The question

Could each case and item pass without the goal being reached? The goal is the part of the plan's goal this step delivers: a folder-bound page that a reader works in, limited to its folder, plus VS Code code themes.

- Case 1: yes. A scratch run through `createClientState` sees instance-state fields (`top`, `under`, `scope`, folder) but not whether a view filters by them. Problems' `scope` cannot express a path, and Repositories "inside it" shows nothing for a hub project. Only the look, or a reading of each view's filter, settles it.
- Case 2: yes. G54's test checks only that the named views are known, so an arrangement missing `session-list` passes. Case 1 covers the content.
- Case 3: partly. It passes with identity per opener; no case opens the same folder from two openers (project view, then folder menu).
- Cases 4 and 5: no for case 4. Case 5's expected result is unresolved (case 8 of the previous section).
- Case 6: no.
- Case 7: yes. The "root's label" does not exist, so any name passes.
- Case 8: yes. The area branch of `sessionsForProject` is not exercised.
- Case 9: its expected result is wrong, so a correct build fails it.
- Case 10: no.
- Case 11: no for the tabs. Yes for a Terminal tab: the kept layout restores the tab with terminals that the close ended, and the case does not say what is expected.
- Case 12: no.
- Case 13: no.
- Case 14: no.
- Case 15: no.
- Case 16: no.
- Case 17: no.
- Case 18: yes. "No finding" passes from `isCodeTheme` alone while `load.ts` still paints `tokens`. The painting half is a look the builder cannot make pass inside the write list.
- Case 19: yes. A pick kept after a reload passes while the editor never paints with it.
- Case 20: no.
- Case 21: no.
- Case 22: no.
- Item 1: no, with case 3.
- Item 2: no.
- Item 3: yes, for Problems (root-only scope), LaTeX (pins to a first main file) and Repositories (folder inside a repository).
- Item 4: no.
- Item 5: yes. FolderFiles alone passes while VenueCard and Worktrees, other folder offers of Show in Files, have no action. The project view's action needs ProjectCard.
- Item 6: no, except that RailFoot is outside the write list.
- Item 7: yes, for Reset all pages, which the item does not cover.
- Item 8: no.
- Item 9: yes. The finding, the menu and the store can all pass while no editor paints with the VS Code rules.
- Item 10: yes. The four named docs pass while `docs/files-and-search.md:43` and `options.yml:146,1051` stay false.
- The step line has no check of its own (`sed -n 725p plan.md` names none), so there is no line-level check to ask about.

## Implied inputs

Each with the expected result to add as a case:

1. A `rail:` entry `page: workbench`, offered by the Settings rail picker from `options.yml:994`:
   - Today `readRail` refuses it as `page_unknown` (`rail.ts:98-99`). After the change it is accepted and makes a folderless "workbench" rail page.
   - Expected, per Z756 (a) "no `rail:` key": a finding naming the entry, and no button.
   - Item 2's sentence ("keeps refusing ... only if it already refuses one today") is circular: it refuses today only because the key is absent.
2. Reset all pages while workbenches are open:
   - Expected result unstated. Either they are removed, if they carry `rail`, or kept as pages "you made yourself".
   - The kept layouts are kept or dropped; a unique view in a workbench moves out to the rail page whose arrangement names it.
   - Cost: workbenches silently removed.
3. A kept-workbench entry in a saved envelope that does not read (a malformed tree):
   - Expected: that entry is dropped and the pages are kept, as a float that does not add up is dropped (`saved.ts` head comment).
   - The alternative, refusing the whole envelope under G31, loses every page.
4. The same folder opened from two openers with different items (project view, then folder menu on the project folder):
   - Expected: switch to the open page, keeping the first item's name.
5. A folder inside a git repository, which is every hub project folder:
   - Repositories "listing only the repositories inside it" lists none. Expected result unstated: none, or the enclosing repository.
6. LaTeX in a folder with no main file, or several:
   - Expected: no root, or the first. Following the active editor is lost once pinned.
7. Search in a workbench of a root itself (`path: ''`): no "limited to" line and no clear control. The expected result should be said.
8. Rename of a workbench page from the Pages view: kept on the next open or not.
9. Reset layout on a workbench whose tabs hold unsaved text or a running terminal:
   - Expected: asks first, as Reset of a rail page does (`reset_page_confirm`, PagesReset.svelte).
   - Spec.md:18 lists a destructive action without confirmation as a user-visible shape.
10. Kept layouts filling localStorage, given decision 5's "no cap":
    - A full storage refuses the layout write (DESIGN.md:474), so the whole layout stops saving.
    - Expected: measured and bounded, or a kept layout dropped before the pages are refused.
11. Two browser tabs of one browser (one localStorage) closing two workbenches at once: both kept layouts survive. Case 20 covers two browsers only.
12. A VS Code class in `vscode-rules.json` that the reader removed from `themes:`: the label in the Code theme menu is unstated. Item 9 labels "as the UI theme menu labels it", from `appearance.yml` `themes:` labels.
13. Shiki's `dark-plus`, `light-plus`, `monokai`, `red`, `solarized-dark` and `solarized-light` sit beside `vscode-dark-plus` and the others:
    - Two near-identical entries in one menu.
    - There is no id collision: `head node_modules/@shikijs/themes/dist/index.mjs` lists no `vscode-` id.
14. New in a workbench's sessions list: the composer goes to "the page's Terminal tab" (`SessionList.svelte:15-20`), and the workbench arrangement has none.

## ADRs

`ls docs/adr` prints "No such file or directory". `grep -n adr .agents/plan.yaml` prints nothing. DESIGN.md "Decisions taken" (`:451` on) governs:

1. "Pages" (`:474`): the saved layout is the pages, the current page and the floats. Item 7 extends it, and item 10 has DESIGN name the kept layouts. No contradiction.
2. "Unique views" (`:481`): "the builds from the config take a held instance in ... `withPage`, `rebuiltPage`, ... so a rail page holds every view its arrangement names".
   - Item 8 has a workbench made from its arrangement leave a held unique view out.
   - The plan line asks only that a restored layout "makes no copy", so leaving out is allowed for a restored layout.
   - For a fresh arrangement build, and for Reset layout (which would naturally use `rebuiltPage` and move a view in), the brief departs from the recorded decision without saying so, and gives `withoutHeld` as the precedent, which it is not (Cases and checks 10).
3. "The editor primitive reads the computed tokens" (`:522`): the code theme changes the TextMate rules alone, and the source tab, diff and merge editors paint with it. Item 9 matches it.
4. "The rail is VS Code's activity bar" (`:552`) and the "Opened views land beside the tools" decision: no contradiction.

## Dictated text

`grep -n 'Open in New Files\|Open Workbench\|limited to\|Reset layout\|Workbenches' agents/briefs/D56.md`:

1. "Open in New Files" (lines 9, 32, 48, 95): holds against the rules file (ASCII, from the catalogue). The words name a Files tab while the item opens a page, but they are dictated by the plan line.
2. "Open Workbench" (line 95): holds. Not named by any ruling (see the last part).
3. "limited to <folder>" (line 30) and "limited to" (line 85): hold against the rules. They are quoted as the line "Search and Problems draw", but those lines read "In {0}/{1}" (`search.yml:101`) and "{0}" (`search.yml:24`). The dictated words contradict the instruction to draw "the same" line.
4. "Reset layout" (lines 34, 54, 97): holds against the rules. It is a second name for "Reset to its arrangement" (`ui.yml:69`); the plan line dictates it.
5. "Workbenches" (lines 9, 33, 37, 52): holds.

The brief dictates no other file text. The comment above `arrangements:` (item 2) is given as content, not as words. The quoted report strings ("Everything in the brief is done", "no glossary", "still true", "rewritten") are report text.

## Whether a new guarded.md entry is needed, and shapes the rulings do not name

- **guarded.md:** no new entry is strictly needed if the workbench close and Reset layout go through the existing `closeAsk` (`navigation/pages.ts`). G28 then covers them, and G29 and G31 cover the envelope.
  - A close path of the new menu file's own would add a unit to G28's Code line, which is an entry change for Axel. The brief should route it through `closeAsk` and say so.
  - No entry guards a saved envelope of the current version being read back with its kept workbenches (G29 is earlier versions only). If losing kept layouts on reload is judged costly, that is a new entry and a stop.
- **User-visible shapes the plan's rulings (Z756, ruling 30, Additions item 12, D53 before D56) do not name:**
  1. Tabs of one pane versus panes of a column, left to the builder.
  2. Decision 3's "Open Workbench".
  3. Decision 4, one workbench per root and path.
  4. Decision 5, no cap and no expiry.
  5. Decision 1 (the side project's page, which is its `project.yml`).
  6. The action on ProjectCard, which shows it on the Projects board too.
  7. Reset all pages' treatment of workbenches.
  8. Whether Reset layout asks first.
  9. The new "limited to" line and clear control on Repositories and the sessions list. Z756 (b) names only the fields.
  10. The `readRail` stance on `page: workbench`.
  11. Leaving out versus moving in a held unique view for a fresh workbench.
  12. The dark and light grouping of the VS Code entries in the Code theme menu.
  13. The double meaning of "workbench" (Names 13).
  14. Z756 (b) says LaTeX gets "a new folder field", while item 3 gives LaTeX the folder "as its root". The brief and the ruling disagree on LaTeX.

## Declined to judge

1. What "the workbench as proposed" (Additions item 12) contained beyond the plan line. `grep -rn -i "workbench as proposed\|proposed workbench"` over `plan.md`, `orchestrator-history.md`, `orchestrator-state.md` and `queue.md` finds only the ruling itself, so I could not read the proposal.
2. Whether `VenueCard`'s link is a folder for any real venue. That needs the hub's data, which this check does not read.
3. Whether the D49 and D56 order should change. That is the orchestrator's scheduling call; I only name the overlap.

Usage: ab76aa6336c81ae1d, claude-opus-5-5, 269,002 tokens, 103 tool uses, 13.1 min.
