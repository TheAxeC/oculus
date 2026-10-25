Everything in the brief is done. Not done in the worktree by its nature: the look on landing (no server or browser in this step), which the cases marked "by the look" wait for.

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md` line 163 onward, as it stands in this worktree:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

The list holds no entry. This step raises none.

## The cases' first run, on the unchanged tree (`git status --short` printed nothing)

- C1: `grep -n "expanded\|toggleCard\|ontoggle" src/lib/views/boards/projects/Projects.svelte` printed 165 `storedState(..., ['expanded', 'more'])`, 193-196 `toggleCard`, 248 `open={held.expanded.includes(item.id)}`, 254 `ontoggle={() => toggleCard(item.id)}`; `ProjectCard.svelte:303-304` `openTitle` called `openView('project', recordState(item.id, tab))`, a tab of the board's pane. Fails.
- C2: `opening.ts:187-189` `openBeside(view, state, page, asker)` called `openInto(view, state, true, page, false, asker)`: never a preview, no options. Fails.
- C3: `ProjectCard.svelte:225` `if (item.project.subtasks.length === 0)` and `:237` the same for follow-ups: Add Subtask and Add Follow-up offered only while the project had none. Fails for a project with subtasks.
- C4, C5: the card's glyphs (`ProjectCard.svelte` 158 pin, 166 copy, 173 chat, 180 folder, 187 show_in_files, 197 app_view, 205 expand/collapse, 217 present, 230 subtask, 242 followup, 252 edit, 261 deposit, 272/285 clone); `grep -n "menu_glyph\|ContextMenu" ProjectCard.svelte` printed nothing. No page icon, no menu in runs, no right-click menu. Fails.
- C6: `grep -n groups src/lib/ui/menu/ContextMenu.svelte` printed nothing (no `groups` prop); `CardActions.svelte` as on main. Holds for the other cards today.
- C7: `ProjectCard.svelte:45` imported `waitingLine`, `:126` called it, `:383` drew `<p class="waiting {wait.kind}">`; `stats.ts:30-57` one line, people over review over blocked, the review line `under_review_at`. `CardLinks.svelte` had no WAITING ON or BLOCKED line. Fails.
- C8: `ProjectCard.svelte:378` `<div class="folder">{workspaceFolder?.root ?? folder}</div>`; the facts row had no folder item. Fails.
- C9: `CardBrief.svelte:40-42` drew next as `firstSentence(project.next, CARD_NEXT)` in `.next`, muted small text. Fails.
- C10: `grep -n "column\|grid" CardDetails.svelte Project.svelte` printed only `Project.svelte:189 flex-direction: column`. No two columns. Fails.
- C11: `LaneCard.svelte` drew only `laneMarks` (status words); `Lanes.svelte:97-116` `waitLine` gave "Under review <venue>" for a stage with `pauses_countdown`. Fails.
- C12 to C17: `grep -n "toolbar\|filter\|hidden" Focus.svelte LaneHead.svelte FoldHead.svelte` printed no toolbar, no filter and no hidden count; `ls src/lib/state/boards` showed no filter module; `portfolio()` was read at `Focus.svelte:84`, `CommandCenter.svelte:47`, `Band.svelte:45`, `Lanes.svelte:68`. Fails.
- C18, C19: `presets.ts:261-276` `FACETS` had no `hub`; `filter-menu.ts:49` `LINE_FACETS` had no `hub`; `grep -n hubs collection.ts Collection.svelte` printed only `Collection.svelte:108` (`import rootOf`). No Hub list anywhere. C18 held trivially (nothing drawn); C19 fails.
- C20: `node c20.ts` running `parseBoardState({ mode: 'list', stale: true, expanded: [{ hub: 'hub-a', key: 'p1' }] }, 'short')` printed `{"mode":"list","search":"","filters":{},"expanded":["hub-a:p1"],"more":[],"labels":"short","stale":true,"dated":false,"mine":true,"folded":[]}`. Fails (`expanded` read).
- C21: `openBeside` never opened a preview; `Project.svelte` kept no preview tab on typing. Fails.
- C22: `npx vitest run tests/state/boards/board/board-rules.test.ts tests/state/boards/board/hub-facets.test.ts` printed `Test Files  2 passed (2)` and `Tests  85 passed (85)`.

## DONE / NOT DONE

The runs of cases 11 to 20 are one scratch script over a hand-made snapshot (six projects in hubs `hub-a` and `hub-b`, people `axel-faes` with `self: true`, `pirmani`, `peeters`, `student`, the venue `bspc` with `short: BSPC`, a `tasks` entry with no date, an `events` entry dated 2026-11-03 in `hub-b`, one live lead, a career value), run with `node` from the worktree: `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o77/cases.ts`, output in `cases.out` beside it. The projects: `p-sup` (lead `student`, supervisors you, tier personal, submitted, venue bspc), `p-lead` (you lead, research, exploring), `p-other` (lead `pirmani`, in-prep, waiting on `peeters`, deadline 2026-11-10), `p-collab` (lead `pirmani`, collaborators you, revision, deadline 2026-11-12, hub-b), `p-idea` (you lead, personal, nascent), `p-wait` (you lead, exploring, waiting on `pirmani`).

| Row | State | Proof (command or reading, output as printed) |
| --- | --- | --- |
| Item 1, no card opens in place | DONE | `grep -n "expanded\|toggleCard\|ontoggle" src/lib/views/boards/projects/Projects.svelte` prints only `344`, `352` `ontoggle={toggleFilter}` and `387` `ontoggle={() => toggleFold(section.key)}` (the bar's and the sections' folds); `BoardState` and its parser have no `expanded` (C20); `instance.ts` doc reworded |
| Item 2, Open project page beside, as a preview | DONE | `opening.ts` `openBeside(view, state, page, asker, options)` passes `options.preview` to `openInto`; `ProjectCard.svelte:303-310` `openPage` calls `openBeside('project', ..., { preview: true })`, `openTitle` calls it on a board and `openView` on the page; `Project.svelte` `typed()` on `oninput` calls `keepPreview` while the tab is a preview |
| Item 3, Add Subtask and Add Follow-up always offered | DONE | `ProjectCard.svelte:183-199` both actions always in `actions`; `:449-456` the forms drawn on a board card while adding |
| Item 4, actions: three icons, "...", menu in runs, right-click | DONE | `card-menu.ts` `ICONS = ['ask', 'workbench', 'page']`, `RUNS` open / add / rest; `ProjectCard.svelte:366-371` `ContextMenu groups={runs}`, `:416-428` `CardActions` with `stripActions` and `Menu` with `glyph={t('project.card.menu_glyph')}` and `groups={runs}`; `git diff --quiet HEAD -- src/lib/views/shared/card/CardActions.svelte src/lib/ui/menu/Menu.svelte` printed "CardActions and Menu unchanged" |
| Item 5, the closed card | DONE | `CardBrief.svelte` NEXT label and sentence (`next={!page}`); `CardLinks.svelte` WAITING ON (amber, `waitedOn`) and BLOCKED (red) before FUNDING; `CardFacts.svelte:87` a blocked chip red, the folder item last; no path line; `waitingLine` gone (check 4) |
| Item 6, the project page's two columns | DONE | `CardDetails.svelte` grid `repeat(auto-fit, minmax(min(320px, 100%), 1fr))`, left and right columns as the brief lists them, the subtasks and follow-ups at the foot of the right one; `CardBrief` draws no Next on the page |
| Item 7, the lane card's facts | DONE | C11 below; `Lanes.svelte` `waitLine` has no review branch |
| Item 8, the Focus filter | DONE | C12 to C17 below; `Focus.svelte:200-202` `choose()` writes `withFocusFilter(folds, next)` to the tab's instance state, and `foldToggled` keeps every other key (`focus.ts:596-602`) |
| Item 9, the Hub list | DONE | C18, C19 below |
| Item 10, the words | DONE | every added key has a reader and every removed key none: a `grep -rn "'<key>'" src` count per key printed 1 or more for each of the 31 added keys and 0 for `project.card.present`, `project.card.toggle_tip`, `project.helper.under_review_at`, `project.helper.under_review_unset`, `project.helper.waiting_on`; `tests/checks/source/keys.test.ts` passed inside test:quick's `vitest checks`; HELP and README rewritten (check 5) |
| Item 11, size | DONE | `Collection.svelte` 520, `ProjectCard.svelte` 507, largest new file `filter.ts` 408; `sh utils/folder-check.sh` exit 0; `allow-styling.ts` entries follow `ProjectCard.svelte:471`, `:478`, `:482` |
| C1 | DONE by reading; the look waits for landing | as item 1 and 2; Enter on the cursor presses `.title button` (`key-dom.ts:70`), which is `openTitle` |
| C2 | DONE by reading; the look waits | `openInto` hands the project view to `openOpened`; `landingFor` gives the pane of the newest project tab the page received, else a new pane split right of the board; `previewIn` of that pane is retargeted (`opening.ts`, `openOpened`); a kept tab is no preview tab, so the next project opens as a new preview tab there |
| C3 | DONE by reading; the look waits | item 3 |
| C4 | DONE by reading | `ProjectCard.svelte:232` the workbench action pushed only when `folders.served(hub)`, so the strip and the menu both lack it otherwise |
| C5 | DONE by reading; the look waits | item 4; Deposit only with `deposit`, which only `Project.svelte` passes |
| C6 | DONE by reading | CardActions and Menu unchanged (item 4 row); `ContextMenu.svelte`'s `groups` is optional and `offered` falls back to `shown.length > 0` without it |
| C7 | DONE by reading; the look waits for the scratch server | item 5 |
| C8 | DONE by reading; the look waits | `CardFacts.svelte` draws the folder item only for a project with a `folder` or a `workspaceFolder`, its press `onfolder` (the Folder action) |
| C9 | DONE by reading; the look waits | item 5 and 6 |
| C10 | DONE by reading; the look waits | item 6 |
| C11 | DONE | `p-sup (supervisor, personal, submitted at BSPC), self named: ["Supervisor","Personal","BSPC"]`; `p-lead (lead, research, exploring), self named: []`; `p-sup, no self named: ["Personal","BSPC"]`; the people wait line is `Lanes.svelte` `waitLine`, unchanged for people |
| C12 | DONE | `mine on`: lanes `push:[]`, lines `["p-collab","Talk","Postdoc call","Renew licence"]`, awaiting `["Pirmani:1"]`, hidden `command:1, awaiting:1, push:1`, `"hides":true,"mineHides":true`; `mine off`: `push:["p-other"]`, lines start `"p-other"`, awaiting `["Peeters:1","Pirmani:1"]`, every hidden count 0, `"hides":false` |
| C13 | DONE | `collaborator off`: `revise:[]`, lines `["p-other","Talk","Postdoc call","Renew licence"]`, `career: {"banner":"kept"}`, hidden `command:1, revise:1`; the lead line "Postdoc call" and the career stay |
| C14 | DONE | `personal off`: `review:[]`, `idea:[]`, lines `["p-other","p-collab","Talk","Postdoc call","Renew licence"]`, hidden `review:1, idea:1, awaiting:1` (p-sup's venue in the Awaiting box), band 0 |
| C15 | DONE | `mine on, every project yours`: every hidden count 0, `"hides":false,"mineHides":false`; FocusFilter draws the row disabled with `focus.mine_all` while `mineHides` is false |
| C16 | DONE | `mine on, roles [collaborator] saved, no self`: every project on its lane, every hidden count 0, `"mineHides":false`; FocusFilter draws Mine only and Role only while `named`; C11's third line shows no role mark without `self` |
| C17 | DONE by run and reading; the look waits | `saved state: {"folds":["tasks"],"filter":{"mine":false,"roles":["collaborator"],"tiers":["personal"],"hubs":["hub-b"]}}`, `read back: {"mine":false,"roles":["collaborator"],"tiers":["personal"],"hubs":["hub-b"]}`; a pick (`onSelect={one.pick}`) calls `onchange` and leaves `open` as it is, so the list stays open |
| C18 | DONE by run; the look on TEST waits | `hubList one hub: []`; Focus with saved `hubs:["hub-b"]` and one hub: every hidden count 0; `board appliedFilters({hub:[hub-b]}, named, []): {}`; board groups `["slice","role","year","funding","compute","reproduced","code","sessions"]` (no `hub`); collection `hubs: ["hub-b"]` saved, hubs off with one hub `[]` |
| C19 | DONE by run; the look waits for the scratch server | `hubList two hubs, hub-a primary: ["hub-a","hub-b"]`; board Hub group `["hub-a:2","hub-b:2"]`, under the slice filter `["in-flight/exploring"]` `["hub-a:2","hub-b:1"]`, with `hub-b` picked `["hub-a:2","hub-b:2"]`; `board pick hub-b keeps: ["p-b1","p-b2"]`; Focus with `hub-b` unticked: `revise:[]`, lines `["p-other","Postdoc call","Renew licence"]`, hidden `command:2, revise:1`; collection with `hub-b` unpressed keeps `["t1"]` |
| C20 | DONE | `parsed: {"mode":"cards","search":"","filters":{},"more":[],"labels":"short","stale":false,"dated":false,"mine":true,"folded":[]}`, `has expanded: false` |
| C21 | DONE by reading; the look waits | `Project.svelte` `typed()` keeps the preview on any `input` event in the tab; a kept tab is not taken by `previewIn`, so the next project opens as a new preview tab beside it |
| C22 | DONE | `npx vitest run tests/state/boards/board/board-rules.test.ts tests/state/boards/board/hub-facets.test.ts`: `Test Files  2 passed (2)`, `Tests  85 passed (85)`, exit 0; neither test file changed |
| Check 1, `npm run diagrams && npm run test:quick` | DONE | last run: `ok prettier`, `ok ASCII gate`, `ok svelte-kit sync`, `ok eslint`, `ok svelte-check (9.1 s): ... COMPLETED 543 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok vitest (27.6 s)`, `ok vitest slow (28.4 s)`, `ok vitest checks (45.8 s)`, `test:quick: 48.4 s; every command passed`, exit 0; 35 test files chosen; not covered by it: the tests that reach no changed file within two imports, the build, the lint of unchanged files |
| Check 2, G92 and G124 | DONE | as C22 |
| Check 3, unused exports | DONE | `diff .agents/worktrees/O77-base/unused-exports.txt <after>` printed only `< src/lib/state/boards/focus-lanes.ts: entryDeadline` / `> src/lib/state/boards/focus/focus-lanes.ts: entryDeadline` (the moved file) and `src/lib/state/boards/board/index.ts`'s line losing `WaitingLine`; no new unused export |
| Check 4, the grep | DONE | `git grep -n "expanded\|toggleCard\|waitingLine\|under_review_at\|under_review_unset\|helper.waiting_on\|toggle_tip" -- src config/text docs README.md ':!config/local.yml'` prints no hit of `toggleCard`, `waitingLine`, `under_review_at`, `under_review_unset`, `helper.waiting_on` or `toggle_tip`. Every hit is the word `expanded` in another sense: `aria-expanded` and the `expanded` prop of ToolButton, TreeItem, FoldLine, Disclosure and their callers; the Files and notes trees' open folders (`state/sources/explorer/...`, `views/shared/explorer/...`); a path with `~` expanded (`shapes.ts:312`, `fs.ts:91`, `roots.ts:28`, `folders.ts`, `paths.ts`); the LaTeX outline and calendar recurrences; `opening.ts` comments on a folded pane expanded; `composer.ts`, `Customizations.svelte`; `card.ts:68-70` and `CardLinks.svelte:135-179`, a tag kind drawn whole after its More; `LaneCard.svelte:143`, the move menu's `aria-expanded`. Over the new files (untracked, so outside `git grep`): `FocusFilter.svelte:208` `expanded={open}`, the ToolButton's popup state |
| Check 5, HELP sentences against the prose rules | DONE | read each changed sentence (`git diff HEAD --word-diff=plain -- docs/HELP.md README.md`): ASCII, no em dash, no quip, no "not X but Y"; one sentence of the lane card's wait line was reworded to "a submitted project's review is said only in the Awaiting box." No departure is left |

## Files, with line counts (`wc -l` after the last change)

Changed: `README.md` 115; `config/catalogs/vocab.yml` 261; `config/text/views/boards/collection.yml` 70; `config/text/views/boards/focus.yml` 147; `config/text/views/boards/project.yml` 164; `config/text/views/boards/projects.yml` 97; `docs/HELP.md` 570; `src/lib/data/sources/config/sections/focus.ts` 128 (its head comment names the moved file); `src/lib/server/files/project/project-files.ts` 260; `src/lib/state/boards/board/facets.ts` 330; `filter-menu.ts` 319; `index.ts` 73; `presets.ts` 463; `state.ts` 201; `stats.ts` 103; `src/lib/state/boards/collection.ts` 730; `focus.ts` 602; `ticker.ts` 622; `waiting.ts` 51; `src/lib/state/shared/page/hubs.ts` 59; `src/lib/state/workbench/layout/instance.ts` 343; `src/lib/state/workbench/layout/open/opening.ts` 527; `src/lib/ui/menu/ContextMenu.svelte` 184; `MenuList.svelte` 393; `menu-items.ts` 180; `src/lib/views/boards/collection/Collection.svelte` 520; `src/lib/views/boards/focus/Band.svelte` 310; `CommandCenter.svelte` 261; `CommandCenterView.svelte` 316; `Focus.svelte` 355; `Tasks.svelte` 157; `lanes/LaneCard.svelte` 206; `lanes/LaneHead.svelte` 107; `lanes/Lanes.svelte` 350; `src/lib/views/boards/project/Project.svelte` 233; `src/lib/views/boards/projects/FilterBar.svelte` 200; `Projects.svelte` 446; `src/lib/views/shared/card/project/CardBrief.svelte` 70; `CardDetails.svelte` 182; `CardFacts.svelte` 131; `CardLinks.svelte` 261; `ProjectCard.svelte` 507; `tests/checks/tree/allow-styling.ts` 99; `docs/diagrams/` as `npm run diagrams` wrote it.

New: `src/lib/state/boards/focus/filter.ts` 408 (the Focus filter's rule); `src/lib/views/boards/focus/FocusFilter.svelte` 282 (the Filter action); `src/lib/views/boards/collection/HubChips.svelte` 59 (the collection's Hub chips); `src/lib/views/shared/card/project/card-menu.ts` 69 (the strip's icons and the menu's runs).

Moved with `mv`: `src/lib/state/boards/focus-lanes.ts` to `src/lib/state/boards/focus/focus-lanes.ts` (264, content unchanged), since `src/lib/state/boards/` held 10 entries and the filter module would have made 11 (`sh utils/folder-check.sh` exits 0 after the move). Its importers `ticker.ts` and `Band.svelte`, the new `focus/filter.ts`, and the head comment of `src/lib/data/sources/config/sections/focus.ts` follow the new path.

Outside the brief's path list: `src/lib/state/shared/page/hubs.ts` (`hubList`, the one rule for which hubs a Hub list names, read by Focus, the project boards and the collection views), `src/lib/state/boards/ticker.ts` (the import path of the moved file), `src/lib/data/sources/config/sections/focus.ts` (a comment naming the moved file), and the moved file itself. `src/lib/state/workbench/layout.svelte.ts` is on the list and needed no change: it passes the type `Opening['openBeside']` (`:212`) and the function `opening.openBeside` (`:836`) through as they are, so the fifth parameter reaches every caller.

Not changed, though on the list: `config/options/catalogs/vocab.yml` (see the brief's errors), `config/text/views/shared/roles.yml` (Mine only reuses `roles.mine` and `roles.mine_tip`), `src/lib/views/shared/card/card.ts`, `src/lib/views/boards/projects/PickMenu.svelte`, `docs/data-map.md` (it names `facet_tones:` by its use, line 107, and lists no saved-state field the step changes).

## Judgment calls the brief left open

1. What a hidden count counts: the command center counts its dated, follow-up, subtask and snoozed lines, its venue-load rows and the projects its manifests-behind and on-no-lane rows name; the tasks section its lines; the Awaiting box the names it lists, each tally by its count; each lane and each band column its cards (`hiddenOf` in `state/boards/focus/filter.ts`).
2. Whether Mine only "would hide a record on the page" is measured over the whole page under the rest of the choice in force: `mineHides` is true when the page with Mine only hides more rows than the page without it (`focusPage`). Mine only is applied only then.
3. The command center and the tasks section are drawn when every row they had is hidden, so their "n hidden" can be read; the Awaiting box shows its own "n hidden" line the same way.
4. A venue's call line is hidden with its hub although the venues registry is kept whole in the filtered snapshot (`hubLines`), since the line carries the venue's hub in `root`.
5. A funding scheme of the band is filtered by role through the entry of the funding collection of its hub with the same id, and by its hub alone where that collection holds no such entry (`keepsScheme`).
6. The Filter button is drawn pressed while the filter hides at least one row, not merely while the choice differs from the start; so Mine only on a page where it hides nothing leaves the button unpressed.
7. A waited-on project in the Awaiting box is named from the whole portfolio (`known`), so a filter that hides the waited-on project does not turn its name into its bare key.
8. In `openInto`, a preview opened beside the tab being read lands in the preview tab of the pane the last open beside made, and never in the reading pane's own preview tab. This reaches only `openBeside` with `preview`, which only the project card passes; `openView` passes `beside` false and behaves as before. The project view itself goes through `openOpened`, which already handled `preview`. `openBeside` also passes `document` and `held` through, so the options mean what they mean to `openView`.
9. `ContextMenu.svelte`'s pick hands `onpick(id, event, group)` to every caller, `group` undefined for a choice of `items`; the other callers' handlers take two parameters and are unchanged.
10. The menu's rows use the new keys `project.menu.page` "Project Page", `workbench` "Workbench", `presentation` "Presentation", `subtask` "Subtask", `followup` "Follow-up", headings `project.menu.open` "Open" and `add` "Add", and the menu's name `project.menu.label` "Project actions"; Ask, Folder, Show in Files, Edit Manifest, Pin to Top / Unpin, Copy Context, Deposit and Clone keep the words their controls had. `project.card.present` lost its last reader and was removed.
11. The Filter list takes the keyboard focus when it opens (the Command root), so the arrows move and Enter picks at once; Escape and a press outside close it and give the focus back to the button.
12. `Collection.svelte`'s rule that stretches an entry card inside its reveal box named the card by the class `.slot`, which `ui/frame/toolbar/FoldRun.svelte` also declares, and `tests/checks/tree/boundaries.test.ts` failed on it on the base tree. The rule now names the card by its `data-entry` attribute (`.cards > :global([data-reveal] > [data-entry])`), the element it always meant, so the check passes with no allowance entry.
13. The BLOCKED line's label is the new key `project.card.blocked` "Blocked"; its red tag keeps the words of `project.helper.blocked_external`. WAITING ON's label is the new key `project.card.waiting_on` "Waiting on".

## What should look different, for the look on landing

TEST's workspace has one hub and no blocked card, so the WAITING ON / BLOCKED, Hub and two-hub cases need the scratch server the brief names.

- Project board card at rest: before, a card had an Expand control and could be drawn open with its blocks; a folder path line sat under the title. After, every card is closed; no Expand control; no path line; the facts row ends with the folder's name and the folder glyph (tip: the whole path; a press opens the folder); a chip carrying `blocked` is red; NEXT is a label in the ELI5 label's style with the first sentence at the ELI5's size and colour; no "under review at ..." line.
- Board card under the pointer: before, a strip of up to thirteen icons (pin, copy, ask, folder, files, workbench, expand, present, subtask, follow-up, edit, deposit, and clone or cloned-in). After, Ask, Open Workbench (only where the hub is served), Open project page (glyph `page`), then "..." (glyph `more`).
- The "..." menu and a right-click on the card (also Shift+F10 on a focused control of the card): a run headed Open (Project Page, Folder, Show in Files, Workbench, Presentation where there is a deck), a run headed Add (Subtask, Follow-up), a rule, then Ask, Edit Manifest, Pin to Top or Unpin, Copy Context, Deposit (project page only), Clone or the Cloned-in entry. Each row with its glyph. Before, there was no right-click menu on the card.
- Closed card lines with `waiting-on: [<person>, <project id>, unknown-key]` and a `blocked` chip: WAITING ON with three amber tags (the person opens the Person view, the project opens its page, unknown-key has no press) and BLOCKED with one red tag, both above FUNDING.
- The page beside: on Projects, a press on a title, on Open project page or Enter on the cursor opens the project page in a pane split right of the board as a preview tab; a second project from the board replaces it in that tab; typing in a subtask form of that page keeps the tab, and the next project opens as a new preview tab in the same pane. Before, the title opened the page as a tab of the board's own pane.
- Project page, wide pane: two columns, left STATUS, LATEST, NEXT (whole), RESULTS, OUTCOME, IDEAS / AVENUES, right REPRODUCED, DISSEMINATED IN, FILES, SUBTASKS, FOLLOW-UPS; no Next line under the ELI5; no Open project page action. At a pane of about 420 px the right column sits under the left (columns of at least 320 px, `CardDetails.svelte` `grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr))`).
- Focus lane card: after the status marks, a role mark (Supervisor, Collaborator or Other) on a project you do not lead, a tier mark on a non-research project, and the venue's short name at a stage with `placed`; no "Under review <venue>" line; people and blocked wait lines unchanged.
- Focus filter: a sliders glyph button in the Focus pane's header (tip "show only what the ticked roles, tiers and hubs hold"), pressed while rows are hidden. Its list: Mine only (ticked at the start; muted and disabled with the tip "Everything here is yours" where it would hide nothing), then headed Role (Lead, Supervisor, Collaborator), Tier (Research, Personal, Software) and, with more than one hub, Hub. The list stays open while rows are ticked and unticked.
- Hidden counts: "3 hidden" on the command center's and the tasks' heading rows, on each lane's and band column's header before its count, and in the Awaiting box, wherever the filter hides rows there.
- Hub list on a two-hub workspace: a Hub group button on the project board's bar after Venue, its list naming both hubs with counts; Hub chips with counts after the Role chips on a collection's bar, all pressed at the start; the Hub checklist in the Focus filter. On TEST (one hub) none of the three is drawn.

## What in the brief was wrong or impossible

1. `config/options/catalogs/vocab.yml` has no row per group of `facet_tones:` to add `hub` to: its entry (lines 191-199) describes the key and the value of any row generically (`fields: key: the filter group, such as form; value: ... control: hue`), so the new row `hub: grey-d` needs no options change.
2. `src/lib/state/workbench/layout.svelte.ts` needed no change to pass the fifth parameter on (lines 212 and 836 pass the type and the function through).
3. On the base tree `tests/checks/tree/boundaries.test.ts` already failed on `Collection.svelte`'s `.cards > :global([data-reveal] > .slot)` (base line 502; `FoldRun.svelte` declares `.slot` at base line 118). The test is chosen by `npm run test:quick` for this step's files, so it was fixed (judgment call 12).
4. Red on the base tree and still red, outside what `npm run test:quick` chooses for this step, not caused by it: `tests/checks/tree/duplication.test.ts` reports `Collection.svelte:436` / `Projects.svelte:366` (9 lines: the said line and the Empty message) and `Data.svelte:64` / `Venues.svelte:77` (6 lines); jscpd over the base copy reports the same clones at `Collection.svelte:421` / `Projects.svelte:361` and `Data.svelte:64` / `Venues.svelte:77` (saved at the scratchpad's `o77/jscpd-base-markup/jscpd-report.json` and `o77/jscpd-base-code/jscpd-report.json`). `tests/checks/source/comment-width.test.ts` reports six lines in files this step does not touch: `src/lib/state/client/writes.svelte.ts:632`, `src/lib/state/sources/explorer/view/card-tree.ts:4`, `src/lib/views/shared/card/feed/SaveToLiterature.svelte:89`, `tests/data/snapshot/reference-hub.ts:4`, `tests/server/desktop/app-theme-start.test.ts:309`, `tests/ui/controls/editor/kit/comment-rules.test.ts:166` (`git diff --quiet HEAD -- <file>` true for each). The clone between Collection and Projects is the only one in this step's files; ending it means a shared partial for the said line and the empty message, a different concern from this step, so it is reported here for the orchestrator to place. The full verify list at landing will show these reds.

## How many times the verify list ran

`npm run diagrams && npm run test:quick` ran twice. The first run failed only `vitest checks`, on the base tree's `boundaries.test.ts` finding (`views/boards/collection/Collection.svelte styles .slot of ui/frame/toolbar/FoldRun.svelte through .cards > :global([data-reveal] > .slot)`), every other command `ok`; after the change of judgment call 12 the second run printed `test:quick: 48.4 s; every command passed`, exit 0. The G92 and G124 run once after the second. No whole-suite command ran. Run alone, over the tree: `tests/checks/tree/duplication.test.ts`, `tests/checks/source/keys.test.ts`, `tests/checks/source/comment-width.test.ts`, `tests/checks/tree/size.test.ts` (passed) and `tests/checks/tree/boundaries.test.ts` (`Tests  11 passed (11)` after judgment call 12), the others with the results given above, plus `svelte-check` over the tree (0 errors, 0 warnings) and prettier and eslint over the changed files.

# Repair round 1

## Left undone, and one premise found wrong

Every item of `briefs/O77-round1.md` is built. One premise of item 5 holds only in a browser, and it is raised for a ruling:

- **Item 5 in the desktop app.** Item 5 leaves a right-click on a link or inside a selection of the card to the browser's menu, so Copy and Copy link address stay. That holds in a browser tab. In the desktop app Electron draws no menu of its own: `src/lib/shell/context-guard.ts:7-8` says "In the desktop app Electron draws no menu of its own at all, so the elements above show the menu oculus draws (a text box's, with the spelling suggestions at its top) or none", and `src/desktop/preload.cjs:9-10` says Electron emits no `context-menu` event for a right-click the page cancels. So in the desktop app (`npm run app`) a right-click on a link or a selection in a project card opens no menu at all: neither the card's menu, which `leftToBrowser` keeps away, nor a browser menu. This is by reading; no desktop run was made. Options:
  - (a) The card's menu gains a Copy row when the right-click lands inside a selection of the card and a Copy Link Address row when it lands on a link, both hosts the same, and `leftToBrowser` goes. Pros: the same menu in the browser and the desktop app, and the copy is still there. Cons: two new rows and their words, a user-visible shape nothing names yet.
  - (b) `leftToBrowser` applies only when the page has no desktop bridge (`desktopOf` of `state/shared/stores/desktop.ts`); in the desktop app the card's menu opens on a link and a selection too. Pros: small; every right-click in the desktop app opens a menu. Cons: no Copy and no Copy Link Address on the card in the desktop app; the two hosts differ.
  - (c) Leave it as built. Pros: nothing to change. Cons: in the desktop app a right-click on a card link or selection does nothing.
  - Recommended (a), a judgment: it is the only option under which both hosts keep the copy and open a menu. (c) is the lazy option.

## Items

| Item | State | Proof |
|---|---|---|
| 1 Band countdown (ruling 383) | DONE | `bandItem` (`src/lib/state/boards/focus/focus-lanes.ts:153-168`) sets `deadline` only when `!deadlineMet(words, status) && !closesDeadline(words, status)`, `words` being `wordsAt(entry)` = `wordsOf?.(rootOf(entry)) ?? config` (`:193`), passed in all three columns (`:202`, `:209`, `:214`). Run: "Item 1" of `r1.ts` below. HELP's Focus bullet gains "A band card whose status has met or closed its deadline, a status carrying `deadline_met` (`submitted`) or `closes_deadline` in its hub's words, shows no countdown." |
| 2 Mine only measured on the whole page | DONE | `focusPage` (`filter.ts:470-495`) builds `whole` once (`:478`), reads `mineWouldHide(snapshot, config, whole, scope)` (`:479`, the function at `:396-462`) and then `ruleOf(filter, scope, filter.mine && mineHides)` (`:480`). Run: "Item 2" of `r1.ts`. HELP: "Whether Mine only is offered is read on the whole page, with every role, tier and hub ticked: when it would hide nothing there it is drawn disabled, its tip saying everything here is yours, and is not applied; when it would hide something it applies together with the rest of the choice." |
| 3 `openInto` at its base text | DONE | `git diff 796273a8 -- src/lib/state/workbench/layout/open/opening.ts`, quoted below: the only hunks are the `openBeside` type and its function. |
| 4 `waitedOn` drops empty and repeated values | DONE | `waiting.ts:45` `const values = [...new Set(ids.map((id) => id.trim()).filter((id) => id !== ''))];`. Run: "Item 4" of `r1.ts`. The keyed each is `CardLinks.svelte:182` `{#each drawn as tag (tag.id)}`; the WAITING ON tags are `waiting.map((one) => ({ id: one.id, label: one.label }))` (`CardLinks.svelte:85`), `waiting` being `waitedOn(...)` (`ProjectCard.svelte:141`), so every key is a distinct non-empty value. |
| 5 A link or a selection keeps the browser's menu | DONE in a browser; the desktop app is the open item above | Read below. |
| 6 On a board, Add draws the form alone | DONE | Read below. |
| 7 HELP's landing sentence | DONE | Read below. |
| 8 `instance.ts` rewrap | DONE | `instance.ts:108-113` is one comment, its paragraph lines 109-112 of 99, 97, 99 and 63 characters (`awk 'NR>=106 && NR<=113 {print NR": "length": "$0}'`). |
| 9 Sentences the step made false | DONE | Read and grep below. |
| 10 One toggle rule | DONE | Grep and change below. |
| 11 The collection Hub rule as one function | DONE | `keptByHub` (`src/lib/state/boards/collection.ts:460-473`), called by `Collection.svelte:171`; cases 18 and 19 of `cases.ts` call it. Run below. |
| 12 The two copies | DONE | `npx vitest run tests/checks/tree/duplication.test.ts` inside the verify run below: part of "Test Files 7 passed (7)". |
| 13 The six comment lines | DONE | `npx vitest run tests/checks/source/comment-width.test.ts` inside the same run: part of "Test Files 7 passed (7)". |
| 14 The report's parts | DONE | The sections below. |

### Item 2, how many times `ticker` runs

`ticker` is called in one place of `filter.ts`, inside `sectionsOf`: `filter.ts:264` `week: ticker(snapshot, config, now, wordsOf),`. `focusPage` calls `sectionsOf` at `:478` (`const whole = sectionsOf(snapshot, config, now, scope.wordsOf, known);`) and at `:491` (`const made = sectionsOf(held, config, now, scope.wordsOf, known);`), the second after `:481` `if (!hidesAny(rule)) {`, whose branch returns `whole`. So one `focusPage` call runs `ticker` once when the choice hides nothing and twice when it hides something. `mineWouldHide` reads the records of `whole` and builds nothing.

### Item 5, by reading

The rule is in the card, not in `ContextMenu.svelte`: an `own` menu is also the text box's menu (`TextBoxMenu.svelte:2-4`), a tree row's and a terminal's, and those want their own menu on a selection or a link inside them, so it is not a rule every `own` menu wants.

- `card-menu.ts:73-86` `leftToBrowser`: `:77` `if (!event.isTrusted || (event.clientX === 0 && event.clientY === 0)) return;`, then `:78` `const link = target.closest('a[href]');`, the selection read as non-collapsed, anchored in the card and containing the target, and `:85` `if ((link !== null && card.contains(link)) || selected) event.stopPropagation();`. It is the `.slot` div's `oncontextmenu` (`ProjectCard.svelte:384-388`), inside the card's `ContextMenu` wrapper.
- A right-click on a link or inside a selection: the event stops at the slot, so the card's `ContextMenu.Trigger` handler `pointed` (`ContextMenu.svelte:118`) never hears it, and neither does the page's guard, a `document` listener (`routes/+page.svelte:289-296`) that would cancel the browser's menu outside a text box (`context-guard.ts:13`, `shouldCancel`). Svelte listens for delegated events on the mount target and on `document` (`node_modules/svelte/src/internal/client/render.js`, "Add the event listener to both the container and the document"); the stop is made while the event is at the container, so it never reaches `document`. The browser draws its own menu.
- The keyboard: the context menu key and Shift+F10 reach `keys` (`ContextMenu.svelte:136-141`), which raises an untrusted `contextmenu` at the control's edge (`openAtEdge`), which `leftToBrowser` lets through (`:77`); a browser's own key-raised right-click at (0, 0) is let through by the same line and raised again at the edge by `pointed` (`ContextMenu.svelte:126-129`). Unchanged.
- A text box inside the card: `TextInput` and `DateInput` wrap the box in `TextBoxMenu` (`TextInput.svelte:88`, `DateInput.svelte:64`), an `own` `ContextMenu` whose `pointed` stops the event (`ContextMenu.svelte:119` `if (own) event.stopPropagation();`) before it reaches the slot. Unchanged.
- The slot carries `<!-- svelte-ignore a11y_no_static_element_interactions -->` with a comment saying it is no control (`ProjectCard.svelte:381-383`), the form `Tabs.svelte:303` and `PaneBody.svelte:314` use; `svelte-check` printed the warning before it.

### Item 6, by reading

`Subtasks.svelte` and `Followups.svelte` take `formOnly?: boolean` ("Draw the add form alone, with no head and no line of the list: a card on a board, whose Add Subtask opens the form under the card's other lines", `Subtasks.svelte:60-64`). The block draws `lines`, `$derived(formOnly ? [] : subtasks)` (`Subtasks.svelte:78`; `Followups.svelte:79` over `notes`), in `{#if lines.length > 0 || adding}` (`:132`), `ListHead shown={lines.length > 0}` (`:135`) and the each over `lines`. With `formOnly` the block is drawn only while `adding` is true, as `ListHead`'s `{#if adding}` form alone. `ProjectCard.svelte:360` and `:371` pass `formOnly={!page}`; the board branch (`:464-468`) renders both blocks, which draw nothing until Add opens the form; the page branch (`:457-463`) renders them inside `CardDetails` with `formOnly` false, the whole list with its form. `EntryCard.svelte:308-323` passes no `formOnly` and is unchanged.

### Item 7, `landing.ts` read whole, and the HELP sentence

New sentence (`docs/HELP.md`, the project card bullet): "Its title, its Open project page action and Enter on the keyboard cursor open the project page beside the board as a preview tab. The page lands in the first of these that the page has: on a workbench, its documents pane; the pane holding the newest page or document opened on the page, while it is still there; an empty pane, an empty documents pane before an empty terminals pane; a pane holding only opened pages and documents; and else a new pane split right of the board. Apart from a workbench's documents pane, a pane holding a tool view, such as Files or Terminal, is not taken, and a locked pane and the board's own pane never are. A preview tab already in the pane the page lands in is replaced, so the next project opened from the board takes that preview tab."

Each clause and the lines it rests on (`src/lib/state/workbench/layout/open/landing.ts`):

- On a workbench, its documents pane: `:72-77` `if (workbench) { const marked = panes(tree).find(({ pane }) => pane.documents === true); if (marked !== undefined && marked.pane.locked !== true && !taken(marked.path)) { return { kind: 'pane', path: marked.path }; } }`, doc `:44` "on a workbench, its documents pane (the pane marked `documents`), whatever it holds".
- The pane holding the newest page or document opened on the page, while it is still there: `:78-83` the loop over `[...received].reverse()` with `allowed(pane, found.path)`; doc `:45-46`.
- The board's own pane: `:84-87` takes the reader's pane when it holds opened tabs, but `openOpened` passes the board's tab as the asker (`opening.ts:255-257`, `by = asker ?? (beside ? attention.active(host) ...)`), so `away` (`:66` `taken`) is the board's pane, which is also `reader` (`opening.ts:369`), and every step excludes it: `:67-71` `allowed`, `:74`, `:85`, `:88`. Doc `:52-54` "`away` ... is treated as locked in every step".
- An empty pane, an empty documents pane before an empty terminals pane: `:89-93`, `empties.find(({ pane }) => pane.keeps === undefined) ?? empties.at(0)`, comment `:89-90`.
- A pane holding only opened pages and documents: `:94-95` `all.find(({ pane }) => !holdsTool(pane, opened, got))`, `holdsTool` at `:20-31`; doc `:47-48`.
- Else a new pane split right of the board: `:96` `return { kind: 'split', path: away ?? reader };`; doc `:48-49`, `:54`.
- A pane holding a tool view is not taken, the workbench's documents pane apart: `:67-71` (`!holdsTool(...) || (samePath(path, reader) && holdsOpened(...))`) and `:94`; doc `:49-50`. The documents pane step at `:72-77` reads no `holdsTool`.
- A locked pane never: `:68`, `:74`, `:85`, `:88`; doc `:51-52`.
- A preview tab in the landing pane is replaced: `opening.ts:377-378` `const replaced = preview && landing.kind === 'pane' ? previewIn(paneAt(tree, landing.path)) : null;` and the retarget after it; the board's press passes `preview` (`openBeside`'s `options?.preview === true`, `opening.ts:202`).

### Item 9, the sentences and the grep

- `src/lib/state/sources/files.svelte.ts:1-2`: "The files of one project folder, fetched when the project page's card asks for them and held"; `:5-7`: "so a board of fifty projects carries none of them and the project page's card (views/shared/card/CardDocs.svelte, drawn by CardDetails on the page alone) asks api/project-files for the folder's files". `CardDocs` is drawn only by `CardDetails.svelte:114`, which `ProjectCard.svelte:458` draws under `{#if page}`.
- `Entry.svelte:374` and `Doc.svelte:309`: "the whole tab follows the card's folder name", as `Project.svelte:229`.
- The same sentence "follows the folder line" was in three more files the step made false, and they are fixed the same way, widening the path list by comments only: `Slides.svelte:433`, `Audit.svelte:351`, `History.svelte:483`.
- `Focus.svelte:20-28`: "The arithmetic is the pure functions of state/boards/focus.ts, state/boards/focus/filter.ts, state/feeds/feeds.ts and state/boards/career.ts; the markup is seven partials under views/boards/focus/ (Band, CareerPanel, CommandCenter, FocusFilter, Lanes, QuickAdd and Tasks)", the seven `.svelte` imports of `Focus.svelte:45-51`; the paragraph rewrapped.
- Grep, each of the round's changed names over `docs/`, `README.md`, `src` and `config` (`grep -rn "<name>" docs README.md src` and `grep -rn --exclude=local.yml "<name>" config`): "folder line", "six partials", "an opened card", "when a card is opened", `toggleTheme`, `hubsOff` and filter.ts's `toggled`: no hit. `formOnly`: `ProjectCard.svelte:23`, `:360`, `:371`, `Subtasks.svelte:11`, `:64`, `:74`, `:78`, `Followups.svelte:12`, `:65`, `:75`, `:79`. `keptByHub`: `collection.ts:466`, `Collection.svelte:62`, `:94`, `:171`. `SaidBody`: `Collection.svelte:63`, `:82`, `:442`, `:482`, `Projects.svelte:82`, `:369`, `:398`. `leftToBrowser`: `card-menu.ts:5`, `:73`, `ProjectCard.svelte:20`, `:53`, `:387`. `grep -rn "ThemeFacets\|toggled\b" docs README.md`: no hit.

### Item 10, the toggle

`grep -rn "function toggle\w*\|const toggle\w* = " src` lists, among others: `src/lib/state/sessions/folds.ts:121:export function toggled<T>(list: readonly T[], one: T): T[] {` ("A list with one entry taken out when it holds it and put in when it does not"), `src/lib/views/shared/latex/opened.ts:5:export function toggled(list: readonly string[], id: string): string[] {`, `src/lib/state/sources/explorer/view/place.ts:190:export function toggleExpanded(`, `src/lib/state/sources/repositories/repositories.ts:215:export function toggleFolded(`, `src/lib/state/shared/words/themes.ts:101:export function toggledThemes(`. The generic one already exported for state and views is `folds.ts`'s `toggled<T>`, which `SessionList.svelte:63` imports. `filter.ts`'s `toggled` is deleted; `FocusFilter.svelte:25` and `HubChips.svelte:11` import `toggled` from `$lib/state/sessions/folds`, and `HubChips`' `toggle` is `onchange(toggled(off, hub))`. The same list job is written five times more across the tree (the hits above); folding those is a different concern from this step and is not done here.

### Item 12, the two copies

Grep first, before the change: `grep -rln 'class="said"' src` listed 33 files, none a shared partial for a board's said line and empty message (`shell/panes/strip/StripSaid.svelte` is the strip's red refusal line, a shell partial); `grep -rln "said !== ''" src/lib/views/shared src/lib/ui` lists form partials only. The said line and the empty message become `src/lib/views/shared/writes/SaidBody.svelte` (46 lines; `views/shared/` holds 10 items and `views/shared/writes/` now 4): the line a write answered on a `Surface` while it holds words, then `Empty` with `message` and `glyph` when `empty`, else `children`. `Collection.svelte:442-482` and `Projects.svelte:369-398` draw it; their own `.said` rules and the `Empty` and `Surface` imports `Collection` no longer uses go. The Data and Venues copy was the six-line `write` plus `toggleTheme` pair. The partial of that job already exists, `src/lib/views/shared/forms/ThemeFacets.svelte`, drawn by both views alone (`grep -rn "ThemeFacets" src`), so it takes the toggle: its `ontoggle(theme)` becomes `onchange(off)`, called with `toggledThemes(off, facet.theme)`, and each view passes `onchange={(off: string[]) => write({ off })}`; no new partial.

## Case runs

### `r1.ts`, this round's program (items 1, 2 and 4), whole source

Saved at the scratchpad's `o77/r1.ts`, run as `node r1.ts` with Node v24.21.0.

```ts
// Scratch runs of the O77 repair round 1 cases (items 1, 2 and 4). Not a test; printed output only.
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O77';
// The words module keeps a rune; outside Svelte a plain value stands in for it.
(globalThis as any).$state = (value: unknown) => value;
const { engineDir, loadConfig, textCatalog } = await import(`${W}/src/lib/data/sources/config.ts`);
const { setCatalog } = await import(`${W}/src/lib/state/shared/words/text.ts`);
const { collectionLanes } = await import(`${W}/src/lib/state/boards/focus/focus-lanes.ts`);
const { focusPage, focusFilter } = await import(`${W}/src/lib/state/boards/focus/filter.ts`);
const { waitedOn } = await import(`${W}/src/lib/state/boards/waiting.ts`);
const { NO_FEEDS, fixtureProject } = await import(`${W}/tests/fixtures/entities-fixture.ts`);

const { config: CONFIG } = loadConfig(engineDir());
setCatalog(textCatalog(CONFIG));
const NOW = Date.parse('2026-10-25T12:00:00Z');
const SELF = 'axel-faes';
const ME = new Set([SELF]);
const out = (name: string, value: unknown) => console.log(`${name}: ${JSON.stringify(value)}`);

// hub-b's words make `active` close its deadline; hub-c's take `deadline_met` off `submitted`.
const statuses = CONFIG.statuses as Record<string, Record<string, unknown>>;
const HUB_B = { ...CONFIG, statuses: { ...statuses, active: { ...statuses.active, closes_deadline: true } } };
const HUB_C = { ...CONFIG, statuses: { ...statuses, submitted: { color: statuses.submitted.color } } };
const WORDS: Record<string, Record<string, unknown>> = { 'hub-b': HUB_B, 'hub-c': HUB_C };
const wordsOf = (hub?: string) => (hub !== undefined && WORDS[hub] !== undefined ? WORDS[hub] : CONFIG);

const E = (id: string, root: string, fields: Record<string, unknown>, file: string, index: number) => ({
    id, title: id, fields: { title: id, ...fields }, file, index, root
});
const C = (key: string, root: string, entries: unknown[]) => ({
    id: root === 'hub-a' ? key : `${root}:${key}`, title: key, file: `/${root}/${key}.yml`, root, entries
});

function snap(projects: unknown[], collections: Record<string, unknown>): any {
    return {
        version: 1,
        entities: {
            projects: Object.fromEntries(projects.map((one: any) => [one.id, one])),
            venues: {}, pillars: {}, domains: {}, funding: {}, organisations: {}, resources: {}, datasets: {},
            people: {
                [SELF]: { id: SELF, name: 'Axel', self: true },
                pirmani: { id: 'pirmani', name: 'Pirmani' },
                student: { id: 'student', name: 'Student' }
            },
            collections,
            feeds: { ...NO_FEEDS },
            career: { banner: 'kept' }
        },
        relations: { projectRelated: [], projectVenue: [] },
        findings: []
    };
}

console.log('--- Item 1 band countdown (collectionLanes)');
const PAST = '2026-09-01';
const band = collectionLanes(
    snap([], {
        funding: C('funding', 'hub-a', [
            E('f-submitted', 'hub-a', { status: 'submitted', deadline: PAST }, '/hub-a/funding.yml', 0),
            E('f-in-prep', 'hub-a', { status: 'in-prep', deadline: PAST }, '/hub-a/funding.yml', 1)
        ]),
        'hub-c:funding': C('funding', 'hub-c', [
            E('f-submitted-c', 'hub-c', { status: 'submitted', deadline: PAST }, '/hub-c/funding.yml', 0)
        ]),
        applications: C('applications', 'hub-a', [
            E('a-active-a', 'hub-a', { status: 'active', deadline: '2026-12-01' }, '/hub-a/applications.yml', 0)
        ]),
        'hub-b:applications': C('applications', 'hub-b', [
            E('a-active-b', 'hub-b', { status: 'active', deadline: '2026-12-01' }, '/hub-b/applications.yml', 0)
        ])
    }),
    CONFIG,
    wordsOf
);
const card = (one: any) => `${one.id}@${one.root} deadline=${one.deadline ?? '(none)'}`;
for (const stage of band.funding) out(`funding stage ${stage.label}`, stage.items.map(card));
out('applications', band.applications.map(card));
out('hub-b active closes_deadline', (HUB_B.statuses as any).active);
out('hub-c submitted', (HUB_C.statuses as any).submitted);

console.log('--- Item 2 Mine only measured on the whole page (Spec 3)');
const P = (id: string, over: Record<string, unknown>) =>
    fixtureProject({ id, title: id, folder: id, file: `${id}/project.yml`, root: 'hub-a', ...over });
// Every project that names people but not you is of tier personal.
const spec3 = snap(
    [
        P('p-mine', { lead: [SELF], tier: 'research', stage: 'exploring' }),
        P('p-theirs-1', { lead: ['pirmani'], tier: 'personal', stage: 'exploring' }),
        P('p-theirs-2', { lead: ['student'], tier: 'personal', stage: 'in-prep' })
    ],
    {}
);
const page = (s: any, filter: any) =>
    focusPage(s, CONFIG, NOW, filter, { self: ME, hubs: [], wordsOf: () => CONFIG });
const lanes = (p: any) =>
    Object.fromEntries(
        Object.entries(p.sections.lanes)
            .filter(([, v]: any) => v.length > 0)
            .map(([k, v]: any) => [k, v.map((one: any) => one.id)])
    );
const summary = (p: any) => ({ lanes: lanes(p), mineHides: p.mineHides, hides: p.hides, hidden: p.hidden });
out('Personal unticked, Mine only on', summary(page(spec3, { mine: true, roles: [], tiers: ['personal'], hubs: [] })));
out('Personal unticked, Mine only off', summary(page(spec3, { mine: false, roles: [], tiers: ['personal'], hubs: [] })));
out('Personal ticked, Mine only on', summary(page(spec3, { mine: true, roles: [], tiers: [], hubs: [] })));
out('nothing chosen, Mine only off', summary(page(spec3, { mine: false, roles: [], tiers: [], hubs: [] })));

console.log('--- Item 2 case 15 (every row yours)');
const mineAll = snap(
    [
        P('p-sup', { lead: ['student'], supervisors: [SELF], tier: 'personal', stage: 'submitted' }),
        P('p-lead', { lead: [SELF], tier: 'research', stage: 'exploring' }),
        P('p-collab', { lead: ['pirmani'], collaborators: [SELF], tier: 'research', stage: 'revision', deadline: '2026-11-12' }),
        P('p-idea', { lead: [SELF], tier: 'personal', stage: 'nascent' })
    ],
    {
        tasks: C('tasks', 'hub-a', [E('t1', 'hub-a', {}, '/hub-a/tasks.yml', 0)])
    }
);
out('mine on, every project yours', summary(page(mineAll, focusFilter({}))));

console.log('--- Item 4 waitedOn');
const people = { pirmani: 'Pirmani' };
out('[pirmani, pirmani]', waitedOn(['pirmani', 'pirmani'], people, {}));
out('["", pirmani]', waitedOn(['', 'pirmani'], people, {}));
out('[a, b]', waitedOn(['a', 'b'], people, {}));
```

Output (exit 0):

```
--- Item 1 band countdown (collectionLanes)
funding stage In prep: ["f-in-prep@hub-a deadline=2026-09-01"]
funding stage Submitted: ["f-submitted-c@hub-c deadline=2026-09-01","f-submitted@hub-a deadline=(none)"]
applications: ["a-active-a@hub-a deadline=2026-12-01","a-active-b@hub-b deadline=(none)"]
hub-b active closes_deadline: {"color":"#16a34a","closes_deadline":true}
hub-c submitted: {"color":"#b45309"}
--- Item 2 Mine only measured on the whole page (Spec 3)
Personal unticked, Mine only on: {"lanes":{"run":["p-mine"]},"mineHides":true,"hides":true,"hidden":{"command":0,"tasks":0,"awaiting":0,"lanes":{"run":1,"push":1,"revise":0,"review":0,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}}}
Personal unticked, Mine only off: {"lanes":{"run":["p-mine"]},"mineHides":true,"hides":true,"hidden":{"command":0,"tasks":0,"awaiting":0,"lanes":{"run":1,"push":1,"revise":0,"review":0,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}}}
Personal ticked, Mine only on: {"lanes":{"run":["p-mine"]},"mineHides":true,"hides":true,"hidden":{"command":0,"tasks":0,"awaiting":0,"lanes":{"run":1,"push":1,"revise":0,"review":0,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}}}
nothing chosen, Mine only off: {"lanes":{"run":["p-mine","p-theirs-1"],"push":["p-theirs-2"]},"mineHides":true,"hides":false,"hidden":{"command":0,"tasks":0,"awaiting":0,"lanes":{"run":0,"push":0,"revise":0,"review":0,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}}}
--- Item 2 case 15 (every row yours)
mine on, every project yours: {"lanes":{"run":["p-lead"],"revise":["p-collab"],"review":["p-sup"],"idea":["p-idea"]},"mineHides":false,"hides":false,"hidden":{"command":0,"tasks":0,"awaiting":0,"lanes":{"run":0,"push":0,"revise":0,"review":0,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}}}
--- Item 4 waitedOn
[pirmani, pirmani]: [{"id":"pirmani","label":"Pirmani","kind":"person"}]
["", pirmani]: [{"id":"pirmani","label":"Pirmani","kind":"person"}]
[a, b]: [{"id":"a","label":"a","kind":"none"},{"id":"b","label":"b","kind":"none"}]
```

Item 1 reads: the `submitted` funding entry of hub-a with a past deadline has no deadline; the `in-prep` one keeps it; the hub-b applications entry whose status carries `closes_deadline` in hub-b's words has none, while the same status in hub-a keeps it; hub-c, whose words take `deadline_met` off `submitted`, gets its countdown back for its own entry only. Item 2 reads: under the Spec 3 scenario Mine only is offered (`mineHides: true`) with Personal unticked, and with it on the two projects of others are hidden whatever Personal says; case 15 gives `mineHides: false`.

### `cases.ts`, the first build's program, whole source as it now stands

Cases 18 and 19 call `keptByHub` (item 11). Saved at the scratchpad's `o77/cases.ts`, run as `node cases.ts`.

```ts
// Scratch runs of the O77 cases over a hand-made snapshot. Not a test; printed output only.
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O77';
// The words module keeps a rune; outside Svelte a plain value stands in for it.
(globalThis as any).$state = (value: unknown) => value;
const { engineDir, loadConfig, textCatalog } = await import(`${W}/src/lib/data/sources/config.ts`);
const { setCatalog } = await import(`${W}/src/lib/state/shared/words/text.ts`);
const { laneFacts } = await import(`${W}/src/lib/state/boards/focus.ts`);
const { focusPage, focusFilter, withFocusFilter, filterLists } = await import(
    `${W}/src/lib/state/boards/focus/filter.ts`
);
const { hubList } = await import(`${W}/src/lib/state/shared/page/hubs.ts`);
const board = await import(`${W}/src/lib/state/boards/board/index.ts`);
const { keptByHub, parseCollectionState } = await import(`${W}/src/lib/state/boards/collection.ts`);
const { NO_FEEDS, fixtureProject } = await import(`${W}/tests/fixtures/entities-fixture.ts`);

const { config: CONFIG } = loadConfig(engineDir());
setCatalog(textCatalog(CONFIG));
const wordsOf = () => CONFIG;
const NOW = Date.parse('2026-10-25T12:00:00Z');
const SELF = 'axel-faes';
const ME = new Set([SELF]);
const NOBODY = new Set<string>();

const P = (id: string, over: Record<string, unknown>) =>
    fixtureProject({ id, title: id, folder: id, file: `${id}/project.yml`, root: 'hub-a', ...over });

const projects = [
    P('p-sup', { lead: ['student'], supervisors: [SELF], tier: 'personal', stage: 'submitted', venueId: 'bspc' }),
    P('p-lead', { lead: [SELF], tier: 'research', stage: 'exploring' }),
    P('p-other', { lead: ['pirmani'], tier: 'research', stage: 'in-prep', waitingOn: ['peeters'], deadline: '2026-11-10' }),
    P('p-collab', { lead: ['pirmani'], collaborators: [SELF], tier: 'research', stage: 'revision', deadline: '2026-11-12', root: 'hub-b' }),
    P('p-idea', { lead: [SELF], tier: 'personal', stage: 'nascent' }),
    P('p-wait', { lead: [SELF], tier: 'research', stage: 'exploring', waitingOn: ['pirmani'] })
];

function snap(list: unknown[], self = true): any {
    const people: Record<string, unknown> = {
        pirmani: { id: 'pirmani', name: 'Pirmani' },
        peeters: { id: 'peeters', name: 'Peeters' },
        student: { id: 'student', name: 'Student' }
    };
    if (self) people[SELF] = { id: SELF, name: 'Axel', self: true };
    return {
        version: 1,
        entities: {
            projects: Object.fromEntries(list.map((one: any) => [one.id, one])),
            venues: { bspc: { id: 'bspc', name: 'Biomedical Signal Processing and Control', short: 'BSPC', root: 'hub-a' } },
            pillars: {}, domains: {}, funding: {}, people, organisations: {}, resources: {}, datasets: {},
            collections: {
                tasks: {
                    id: 'tasks', title: 'Tasks', file: '/x/tasks.yml', root: 'hub-a',
                    entries: [{ id: 't1', title: 'Renew licence', fields: { title: 'Renew licence' }, file: '/x/tasks.yml', index: 0, root: 'hub-a' }]
                },
                events: {
                    id: 'events', title: 'Events', file: '/x/events.yml', root: 'hub-b',
                    entries: [{ id: 'e1', title: 'Talk', fields: { title: 'Talk', date: '2026-11-03' }, file: '/x/events.yml', index: 0, root: 'hub-b' }]
                }
            },
            feeds: { ...NO_FEEDS, leads: [{ title: 'Postdoc call', deadline: '2026-11-01', status: 'open', fit: null, root: 'hub-a' }] },
            career: { banner: 'kept' }
        },
        relations: { projectRelated: [], projectVenue: [] },
        findings: []
    };
}

const out = (name: string, value: unknown) => console.log(`${name}: ${JSON.stringify(value)}`);
const byId = (id: string) => projects.find((one) => one.id === id)!;
const venues = snap(projects).entities.venues;

console.log('--- C11 laneFacts');
out('p-sup (supervisor, personal, submitted at BSPC), self named', laneFacts(byId('p-sup'), CONFIG, ME, venues));
out('p-lead (lead, research, exploring), self named', laneFacts(byId('p-lead'), CONFIG, ME, venues));
out('p-sup, no self named', laneFacts(byId('p-sup'), CONFIG, NOBODY, venues));

const page = (s: any, filter: any, self = ME, hubs: string[] = []) =>
    focusPage(s, CONFIG, NOW, filter, { self, hubs, wordsOf });
const summary = (p: any) => ({
    lanes: Object.fromEntries(Object.entries(p.sections.lanes).map(([k, v]: any) => [k, v.map((one: any) => one.id)])),
    lines: [...p.sections.week.overdue, ...p.sections.week.deadlines, ...p.sections.week.tasks].map((one: any) => one.label),
    awaitingPeople: p.sections.strip.people.map((one: any) => `${one.label}:${one.count}`),
    career: p.snapshot.entities.career,
    hidden: p.hidden,
    hides: p.hides,
    mineHides: p.mineHides
});

console.log('--- C12 Mine only on, then off');
const all = snap(projects);
out('start filter of an empty tab state', focusFilter({}));
out('mine on', summary(page(all, focusFilter({}))));
out('mine off', summary(page(all, { mine: false, roles: [], tiers: [], hubs: [] })));

console.log('--- C13 Collaborator unticked (Mine only off)');
out('lists', filterLists(CONFIG));
out('collaborator off', summary(page(all, { mine: false, roles: ['collaborator'], tiers: [], hubs: [] })));

console.log('--- C14 Personal unticked under Tier');
out('personal off', summary(page(all, { mine: false, roles: [], tiers: ['personal'], hubs: [] })));

console.log('--- C15 a page where Mine only hides nothing');
const mineAll = snap(projects.filter((one) => one.id !== 'p-other'));
out('mine on, every project yours', summary(page(mineAll, focusFilter({}))));

console.log('--- C16 no self named');
const noSelf = snap(projects, false);
out('mine on, roles [collaborator] saved, no self', summary(page(noSelf, { mine: true, roles: ['collaborator'], tiers: [], hubs: [] }, NOBODY)));

console.log('--- C17 the choice in the instance state');
const saved = withFocusFilter({ folds: ['tasks'] }, { mine: false, roles: ['collaborator'], tiers: ['personal'], hubs: ['hub-b'] });
out('saved state', saved);
out('read back', focusFilter(JSON.parse(JSON.stringify(saved))));

console.log('--- C18 one hub');
const oneHub = [{ key: 'hub-a', hub: true as const }, { key: 'notes' }];
out('hubList one hub', hubList(oneHub, 'hub-a'));
out('focus with a saved hub choice, one hub', summary(page(all, { mine: false, roles: [], tiers: [], hubs: ['hub-b'] }, ME, hubList(oneHub, 'hub-a'))).hidden);
out('board appliedFilters({hub:[hub-b]}, named, [])', board.appliedFilters({ hub: ['hub-b'] }, true, []));
const preset = board.presetFor('projects', CONFIG);
// The Projects board takes research projects you lead: two in hub-a, two in hub-b.
const boardSnap = snap([
    ...projects,
    P('p-b1', { lead: [SELF], tier: 'research', stage: 'exploring', root: 'hub-b' }),
    P('p-b2', { lead: [SELF], tier: 'research', stage: 'in-prep', root: 'hub-b' })
]);
const items = board.boardItems(boardSnap, preset);
out('board items', items.map((one: any) => `${one.project.id}@${one.project.root}:${one.project.stage}`));
out('board facets, one hub: groups', board.facets(items, preset, true, undefined, []).map((one: any) => one.key));
const held1 = parseCollectionState({ hubs: ['hub-b'] });
out('collection state hubs', held1.hubs);
const entriesOne = Object.values(snap(projects).entities.collections).flatMap((one: any) => one.entries);
out('collection keptByHub with one hub, hub-b saved unpressed', keptByHub(entriesOne, held1.hubs, hubList(oneHub, 'hub-a')).map((one: any) => one.id));

console.log('--- C19 two hubs');
const twoHubs = [{ key: 'hub-b', hub: true as const }, { key: 'hub-a', hub: true as const }];
const hubs = hubList(twoHubs, 'hub-a');
out('hubList two hubs, hub-a primary', hubs);
const hubFacet = (filters: Record<string, string[]>) =>
    board.facets(items, preset, true, { filters, search: '' }, hubs).find((one: any) => one.key === 'hub');
out('board Hub group, no filter', hubFacet({})?.values.map((one: any) => `${one.value}:${one.count}`));
const slices = board.facets(items, preset, true, undefined, hubs).find((one: any) => one.key === 'slice').values.map((one: any) => one.value);
out('board slice values', slices);
const exploring = slices.filter((one: string) => one.endsWith('/exploring'));
out(`board Hub group, slice filter ${JSON.stringify(exploring)}`, hubFacet({ slice: exploring })?.values.map((one: any) => `${one.value}:${one.count}`));
out('board hub-b pick and the Hub group still counts hub-a', hubFacet({ hub: ['hub-b'] })?.values.map((one: any) => `${one.value}:${one.count}`));
out('board pick hub-b keeps', board.applyFilters(items, board.appliedFilters({ hub: ['hub-b'] }, true, hubs), '').map((one: any) => one.project.id));
out('focus hub-b unticked', summary(page(all, { mine: false, roles: [], tiers: [], hubs: ['hub-b'] }, ME, hubs)));
const tasks = Object.values(all.entities.collections).flatMap((one: any) => one.entries);
out('collection keptByHub, hub-b unpressed', keptByHub(tasks, parseCollectionState({ hubs: ['hub-b'] }).hubs, hubs).map((one: any) => one.id));

console.log('--- C20 board state with expanded');
const read = board.parseBoardState({ mode: 'cards', expanded: ['p1'], more: [] }, 'short');
out('parsed', read);
out('has expanded', 'expanded' in read);
```

Output (exit 0):

```
--- C11 laneFacts
p-sup (supervisor, personal, submitted at BSPC), self named: ["Supervisor","Personal","BSPC"]
p-lead (lead, research, exploring), self named: []
p-sup, no self named: ["Personal","BSPC"]
--- C12 Mine only on, then off
start filter of an empty tab state: {"mine":true,"roles":[],"tiers":[],"hubs":[]}
mine on: {"lanes":{"run":["p-lead","p-wait"],"push":[],"revise":["p-collab"],"review":["p-sup"],"blocked":[],"backburner":[],"scope":[],"derisk":[],"build":[],"idea":["p-idea"]},"lines":["p-collab","Talk","Postdoc call","Renew licence"],"awaitingPeople":["Pirmani:1"],"career":{"banner":"kept"},"hidden":{"command":1,"tasks":0,"awaiting":1,"lanes":{"run":0,"push":1,"revise":0,"review":0,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}},"hides":true,"mineHides":true}
mine off: {"lanes":{"run":["p-lead","p-wait"],"push":["p-other"],"revise":["p-collab"],"review":["p-sup"],"blocked":[],"backburner":[],"scope":[],"derisk":[],"build":[],"idea":["p-idea"]},"lines":["p-other","p-collab","Talk","Postdoc call","Renew licence"],"awaitingPeople":["Peeters:1","Pirmani:1"],"career":{"banner":"kept"},"hidden":{"command":0,"tasks":0,"awaiting":0,"lanes":{"run":0,"push":0,"revise":0,"review":0,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}},"hides":false,"mineHides":true}
--- C13 Collaborator unticked (Mine only off)
lists: {"roles":[{"key":"lead","label":"Lead"},{"key":"supervisor","label":"Supervisor"},{"key":"collaborator","label":"Collaborator"}],"tiers":[{"key":"research","label":"Research"},{"key":"personal","label":"Personal"},{"key":"software","label":"Software"}]}
collaborator off: {"lanes":{"run":["p-lead","p-wait"],"push":["p-other"],"revise":[],"review":["p-sup"],"blocked":[],"backburner":[],"scope":[],"derisk":[],"build":[],"idea":["p-idea"]},"lines":["p-other","Talk","Postdoc call","Renew licence"],"awaitingPeople":["Peeters:1","Pirmani:1"],"career":{"banner":"kept"},"hidden":{"command":1,"tasks":0,"awaiting":0,"lanes":{"run":0,"push":0,"revise":1,"review":0,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}},"hides":true,"mineHides":true}
--- C14 Personal unticked under Tier
personal off: {"lanes":{"run":["p-lead","p-wait"],"push":["p-other"],"revise":["p-collab"],"review":[],"blocked":[],"backburner":[],"scope":[],"derisk":[],"build":[],"idea":[]},"lines":["p-other","p-collab","Talk","Postdoc call","Renew licence"],"awaitingPeople":["Peeters:1","Pirmani:1"],"career":{"banner":"kept"},"hidden":{"command":0,"tasks":0,"awaiting":1,"lanes":{"run":0,"push":0,"revise":0,"review":1,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":1},"band":{"funding":0,"jobs":0,"teaching":0}},"hides":true,"mineHides":true}
--- C15 a page where Mine only hides nothing
mine on, every project yours: {"lanes":{"run":["p-lead","p-wait"],"push":[],"revise":["p-collab"],"review":["p-sup"],"blocked":[],"backburner":[],"scope":[],"derisk":[],"build":[],"idea":["p-idea"]},"lines":["p-collab","Talk","Postdoc call","Renew licence"],"awaitingPeople":["Pirmani:1"],"career":{"banner":"kept"},"hidden":{"command":0,"tasks":0,"awaiting":0,"lanes":{"run":0,"push":0,"revise":0,"review":0,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}},"hides":false,"mineHides":false}
--- C16 no self named
mine on, roles [collaborator] saved, no self: {"lanes":{"run":["p-lead","p-wait"],"push":["p-other"],"revise":["p-collab"],"review":["p-sup"],"blocked":[],"backburner":[],"scope":[],"derisk":[],"build":[],"idea":["p-idea"]},"lines":["p-other","p-collab","Talk","Postdoc call","Renew licence"],"awaitingPeople":["Peeters:1","Pirmani:1"],"career":{"banner":"kept"},"hidden":{"command":0,"tasks":0,"awaiting":0,"lanes":{"run":0,"push":0,"revise":0,"review":0,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}},"hides":false,"mineHides":false}
--- C17 the choice in the instance state
saved state: {"folds":["tasks"],"filter":{"mine":false,"roles":["collaborator"],"tiers":["personal"],"hubs":["hub-b"]}}
read back: {"mine":false,"roles":["collaborator"],"tiers":["personal"],"hubs":["hub-b"]}
--- C18 one hub
hubList one hub: []
focus with a saved hub choice, one hub: {"command":0,"tasks":0,"awaiting":0,"lanes":{"run":0,"push":0,"revise":0,"review":0,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}}
board appliedFilters({hub:[hub-b]}, named, []): {}
board items: ["p-b1@hub-b:exploring","p-lead@hub-a:exploring","p-wait@hub-a:exploring","p-b2@hub-b:in-prep"]
board facets, one hub: groups: ["slice","role","year","funding","compute","reproduced","code","sessions"]
collection state hubs: ["hub-b"]
collection keptByHub with one hub, hub-b saved unpressed: ["t1","e1"]
--- C19 two hubs
hubList two hubs, hub-a primary: ["hub-a","hub-b"]
board Hub group, no filter: ["hub-a:2","hub-b:2"]
board slice values: ["in-flight/exploring","in-flight/in-prep"]
board Hub group, slice filter ["in-flight/exploring"]: ["hub-a:2","hub-b:1"]
board hub-b pick and the Hub group still counts hub-a: ["hub-a:2","hub-b:2"]
board pick hub-b keeps: ["p-b1","p-b2"]
focus hub-b unticked: {"lanes":{"run":["p-lead","p-wait"],"push":["p-other"],"revise":[],"review":["p-sup"],"blocked":[],"backburner":[],"scope":[],"derisk":[],"build":[],"idea":["p-idea"]},"lines":["p-other","Postdoc call","Renew licence"],"awaitingPeople":["Peeters:1","Pirmani:1"],"career":{"banner":"kept"},"hidden":{"command":2,"tasks":0,"awaiting":0,"lanes":{"run":0,"push":0,"revise":1,"review":0,"blocked":0,"backburner":0,"scope":0,"derisk":0,"build":0,"idea":0},"band":{"funding":0,"jobs":0,"teaching":0}},"hides":true,"mineHides":true}
collection keptByHub, hub-b unpressed: ["t1"]
--- C20 board state with expanded
parsed: {"mode":"cards","search":"","filters":{},"more":[],"labels":"short","stale":false,"dated":false,"mine":true,"folded":[]}
has expanded: false
```

### `c20.ts`, whole source

```ts
import { parseBoardState } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O77/src/lib/state/boards/board/state.ts';
const read = parseBoardState({ mode: 'list', stale: true, expanded: [{ hub: 'hub-a', key: 'p1' }] }, 'short');
console.log(JSON.stringify(read));
```

Output (exit 0):

```
{"mode":"list","search":"","filters":{},"more":[],"labels":"short","stale":true,"dated":false,"mine":true,"folded":[]}
```

### Item 3, `git diff 796273a8 -- src/lib/state/workbench/layout/open/opening.ts`

```
@@ -74,9 +74,15 @@ export type Opening = {
     /**
      * `asker` is the instance of the tool view the view is opened for: a view opened for something
      * lands outside that instance's pane (landing.ts), so the asked view opens beside the one that
-     * asked and never over it.
+     * asked and never over it. Of `options` it reads `preview` alone, as openView reads it.
      */
-    openBeside: (view: ViewId, state?: unknown, page?: string, asker?: string) => string;
+    openBeside: (
+        view: ViewId,
+        state?: unknown,
+        page?: string,
+        asker?: string,
+        options?: OpenOptions
+    ) => string;
@@ -183,9 +189,17 @@ export function createOpening(
      * activates it, and a maximised pane takes the view itself, since a new pane beside it would be
      * one nobody can see. The pane being read never takes the view: a view opened for something
      * lands where landingFor puts a view the tab being read asked for, beside that tab's pane.
+     * `preview` is the one option of `options` it reads: with it, the view lands as the preview tab
+     * of the pane it lands in, as openView's preview does.
      */
-    function openBeside(view: ViewId, state?: unknown, page?: string, asker?: string): string {
-        return openInto(view, state, true, page, false, asker);
+    function openBeside(
+        view: ViewId,
+        state?: unknown,
+        page?: string,
+        asker?: string,
+        options?: OpenOptions
+    ): string {
+        return openInto(view, state, true, page, options?.preview === true, asker);
     }
```

## Item 14, the report's other parts

### `tests/checks/tree/allow-styling.ts`

`diff <(git show 796273a8:tests/checks/tree/allow-styling.ts) tests/checks/tree/allow-styling.ts`, the five `why` strings of the `ProjectCard.svelte` entries (the `line` keys are unchanged):

| Line | Before | After |
|---|---|---|
| 61 | `ProjectCard.svelte:399` | `ProjectCard.svelte:490` |
| 65 | `ProjectCard.svelte:403` | `ProjectCard.svelte:494` |
| 69 | `ProjectCard.svelte:399` | `ProjectCard.svelte:490` |
| 73 | `ProjectCard.svelte:392` | `ProjectCard.svelte:483` |
| 77 | `ProjectCard.svelte:403` | `ProjectCard.svelte:494` |

The base numbers were already wrong: on the base tree the three rules stood at 425, 432 and 436 (`git show 796273a8:src/lib/views/shared/card/project/ProjectCard.svelte | grep -n ":global(.card"` prints `425: .slot > :global(.card) {`, `432: .slot > :global(.card > .bar) {`, `436: .slot > :global(.card .title) {`) while the entries said 392, 399 and 403. They now say where the rules stand (`grep -n ":global(.card" src/lib/views/shared/card/project/ProjectCard.svelte`: `483`, `490`, `494`). The check reads the `line` key; the `why` text is a reason, which `boundaries.test.ts:846` checks only for being one (`isReason`).

### History words

`git diff 796273a8 -- src tests` added lines plus the new files (`src/lib/state/boards/focus/*.ts`, `HubChips.svelte`, `FocusFilter.svelte`, `card-menu.ts`, `SaidBody.svelte`), 2471 lines, comment lines and test titles grepped for `previously|formerly|used to|no longer|anymore|was|were|revert(ed)?|legacy|old|older|earlier|originally|new|now|still|before|after|until|replaced|removed|renamed|moved|fixed|bug|O77|step|package|session|round`. Every hit is a place, an order or the running page, none the code's history: "after" and "before" of order (`MenuList.svelte` "after another group", `LaneHead.svelte` "said before the count", `ThemeFacets.svelte` "off after each press", `HubChips.svelte` "after the Role chips"); "still" meaning "even so" (`filter.ts` "still reads its venue", `card-menu.ts` "still opens the card's menu"); "now" and "earlier" of the running page, not of the code (`collection.ts:470` "a hub saved unpressed that is no chip now hides nothing", `Projects.svelte:51` "a hub picked earlier narrows nothing", `Band.svelte` "a column that had cards before the filter"); "new" of a new choice or a new tab (`Focus.svelte` "Keep a new choice of the filter"). The step adds no test title.

### Head and doc comments of the touched functions: still true, or rewritten

- Rewritten in the step: `facets` (`board/facets.ts`, the hub facet), `filterGroups` (`filter-menu.ts`, the hub group), `appliedFilters` (`board/state.ts`, the hub values), `waiting` (`focus.ts`, `known`), `grouped` (`menu-items.ts`, a group with no heading), `openBeside` and its type (`opening.ts`), `bandItem` (`focus/focus-lanes.ts`), `ContextMenu.svelte` (head, `groups`, `onpick`, `offered`, `pick`), `MenuList.svelte` (head), `Subtasks.svelte` and `Followups.svelte` (head, `formOnly`), `ThemeFacets.svelte` (head, `onchange`), `ProjectCard.svelte` (head), `Collection.svelte` (head), `Focus.svelte` (head), `card-tree.ts`, `files.svelte.ts` and `project-files.ts` (heads), `stats.ts` (head), `hubs.ts` (head), `waiting.ts` (head), `data/sources/config/sections/focus.ts` (head).
- New with their own doc: `hubList`, `tierWords`, `laneFacts`, `waitedOn`, `WaitedOn`, `keptByHub`, `stripActions`, `menuRuns`, `leftToBrowser`, `pickAction`, every function of `focus/filter.ts`, `HubChips.svelte`, `FocusFilter.svelte`, `SaidBody.svelte`.
- Read and still true, unchanged: `facetHeading` ("A facet's heading. The keys are literal so tests/checks/source/keys.test.ts can see every one of them"), `facetValues` (it names the slice, Situation and Form cases and says nothing false of the hub case), `applyFilters` ("Apply facet, text, stale, dated and Mine only controls to board items"), `emptyBoardState`, `parseBoardState` (it names no `expanded`), `emptyCollectionState`, `parseCollectionState`, `collectionLanes` (the band's stacking; the countdown rule is `bandItem`'s), `BandItem` (`deadline?` carries no doc), `instanceNumber` and `storedState` (`instance.ts`, the latter rewrapped, no word changed), `newIdea` (`writes.svelte.ts`, rewrapped, no word changed).

### Helper greps

- `hubList`: `grep -rn "export function hub\w*\|export function \w*Hubs\w*(" src/lib/state src/lib/data` lists `hubsTaking` (`hubs.ts:33`, which `hubList` calls), `hubFileTarget`, `hubFileText`, `hubMovable`, `hubMoveOnto`, `hubPathsOf`, `graphHubs`, `hubDomainsOf`, `hubVocabOf`: none lists the workspace's hubs for a filter.
- `waitedOn`: `grep -rn "export function \w*[wW]ait\w*(" src/lib` lists `noteWait`, `waitsOnReader`, `waitOf`, `waitingOf`, `waiting` (`focus.ts:478`), `waitingLabel` (`waiting.ts:15`, which `waitedOn` calls) and `groupWaits`: none gives each value with its kind.
- `tierWords`: `grep -rn "words.tiers\|config.tiers\|\.tiers)" src/lib` lists `manifest.ts:624`, `new-project.ts:81` and `data/index.ts:124`, `:210`, each `vocabKeys(...tiers)` for the keys alone; `grep -rn "tierLabel\|'tiers'" src/lib/state src/lib/data src/lib/views` finds no tier-label reader (`tierLabel` there is a usage account's field).
- The toggle: item 10 above.

### The step's tests

The step adds or changes no test. It changes three test files' comments (item 13, no word changed) and `tests/checks/tree/allow-styling.ts`'s five `why` strings (above).

### Check 4 of the first brief

The first build ran `git grep` for the brief's check 4, a git command `agents/spec.md` does not allow (only `git status`, `git diff` and `git show`). This round runs plain `grep` in its place: `grep -rn --exclude=local.yml "expanded\|toggleCard\|waitingLine\|under_review_at\|under_review_unset\|helper.waiting_on\|toggle_tip" src config/text docs README.md` prints 184 lines, and `grep -c "toggleCard\|waitingLine\|under_review_at\|under_review_unset\|helper.waiting_on\|toggle_tip"` over them prints 0. Every hit is `expanded` in another sense: the tree, disclosure and fold controls (`ui/tree/*`, `ToolButton.svelte`, `Disclosure.svelte`, `FoldLine.svelte`, `FoldHead.svelte`), the Files and notes trees (`state/sources/explorer/*`, `views/shared/explorer/*`, `notes-section.svelte.ts`), paths with `~` expanded (`folders.ts`, `paths.ts`), `opening.ts`'s folded panes, `composer.ts`, `Customizations.svelte`, `theme.ts`, the repository views, Search, LaTeX and settings views, `card.ts:68-70` and `CardLinks.svelte:135-179` (a tag kind drawn whole after its More), `LaneCard.svelte:143` (`aria-expanded`), `FocusFilter.svelte:210` (`expanded={open}`), `Venues.svelte:119`, `:157`, `Audit.svelte:214` and `History.svelte:305` (Disclosure props).

## What the look on landing should see, added by this round

- Board card, Add Subtask or Add Follow-up on a project that already has subtasks or notes: before, the card drew the whole list with its head and the form; after, the form alone under the card's other lines. The project page draws the whole list with its form, as before.
- Band (Funding, Positions, Teaching): before, a card whose status is `submitted` or `under-review`, or carries `closes_deadline`, counted down to its deadline; after, it shows no countdown and sorts as an undated card.
- Focus Filter, Mine only: before this round, measured under the rest of the choice, so with Personal unticked on a workspace where every project of others is personal it was drawn disabled; after, it is offered whenever it would hide a row of the whole page, and applies with the rest of the choice.
- The venue-load row and the Awaiting counts of Focus: before the step, counted over the whole portfolio; after, over the records the filter keeps.
- A fresh Focus tab: before the step there was no filter; after, it starts with Mine only on, which hides the projects whose `lead:`, `collaborators:` and `supervisors:` name people but not you, their ticker lines and Awaiting rows, and the collection entries of a file whose `schema:` declares one of those fields and that name others only. A project naming no one stays.
- The project page's card under the pointer: before the step, the full strip of up to thirteen icons; after, Ask and Open Workbench (where the hub is served), then "..." holding every other action.
- A right-click on a link or inside a text selection of a project card in a browser tab: the browser's menu (Copy, Copy link address); elsewhere on the card the card's menu. In the desktop app the same right-click opens no menu (the open item at the top).
- The page beside, which the first report's bullet gave as "a pane split right of the board": it lands where HELP's sentence (item 7) says, so on [Board | Files] a new pane is split right of the board, on [Editor | Board] the editor's pane takes it as a preview tab, and on a workbench its documents pane.
- The collection view's said line: its gap under it is 8 px, as the project boards', where it was 6 px (`SaidBody.svelte`'s `.said { margin: 0 0 8px; }`).

## Verification, run once after the last change

- `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams && npm run test:quick`: the diagrams rewrote `docs/diagrams/*.dot` and `*.svg`; `test:quick` printed `ok ASCII gate`, `ok prettier ... All matched files use Prettier code style!`, `ok svelte-kit sync`, `ok eslint`, `ok vitest slow`, `ok svelte-check ... 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok vitest`, `ok vitest checks`, `test:quick: 81.4 s; every command passed`, exit 0. It does not cover tests that reach no changed file within its import depth, the build, or the lint of unchanged files (its own last line).
- `npx vitest run tests/state/boards/board/board-rules.test.ts tests/state/boards/board/hub-facets.test.ts tests/checks/tree/duplication.test.ts tests/checks/source/comment-width.test.ts tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts tests/checks/source/keys.test.ts`: `Test Files 7 passed (7)`, `Tests 136 passed (136)`, exit 0.
- `sh utils/unused-exports.sh` compared with `diff .agents/worktrees/O77-base/unused-exports.txt <output>`: `129c129 < src/lib/state/boards/focus-lanes.ts: entryDeadline > src/lib/state/boards/focus/focus-lanes.ts: entryDeadline` (the moved file) and `283c283`, `board/index.ts`'s line losing `WaitingLine`; no new unused export.
- `sh utils/folder-check.sh`: no output, exit 0.
- The removed keys with plain `grep -rn`: the check 4 section above.
- Characters: `LC_ALL=C grep -nP '[^\x00-\x7F]'` over every file changed this round printed nothing; over this report, after it was written, the same (below).
- Also run on the round's files: `npx prettier --check` ("All matched files use Prettier code style!") and `npx eslint` (exit 0, no output). No whole-suite command ran.

## Files changed in this round, with line counts (`wc -l` after the last change)

| File | Lines | Items |
|---|---|---|
| `src/lib/state/boards/focus/focus-lanes.ts` | 270 | 1 |
| `src/lib/state/boards/focus/filter.ts` | 495 | 2, 10 |
| `src/lib/state/workbench/layout/open/opening.ts` | 515 | 3 |
| `src/lib/state/boards/waiting.ts` | 56 | 4 |
| `src/lib/views/shared/card/project/card-menu.ts` | 92 | 5 |
| `src/lib/views/shared/card/project/ProjectCard.svelte` | 519 | 5, 6 |
| `src/lib/views/shared/forms/dated/Subtasks.svelte` | 311 | 6 |
| `src/lib/views/shared/forms/dated/Followups.svelte` | 234 | 6 |
| `docs/HELP.md` | 570 | 1, 2, 6, 7 |
| `src/lib/state/workbench/layout/instance.ts` | 342 | 8 |
| `src/lib/state/sources/files.svelte.ts` | 159 | 9 |
| `src/lib/views/boards/entry/Entry.svelte` | 378 | 9 |
| `src/lib/views/sources/doc/Doc.svelte` | 313 | 9 |
| `src/lib/views/boards/focus/Focus.svelte` | 357 | 9 |
| `src/lib/views/academic/slides/Slides.svelte` | 437 | 9 |
| `src/lib/views/system/audit/Audit.svelte` | 355 | 9 |
| `src/lib/views/system/history/History.svelte` | 487 | 9 |
| `src/lib/views/boards/focus/FocusFilter.svelte` | 283 | 10 |
| `src/lib/views/boards/collection/HubChips.svelte` | 60 | 10 |
| `src/lib/state/boards/collection.ts` | 745 | 11 |
| `src/lib/views/boards/collection/Collection.svelte` | 513 | 11, 12 |
| `src/lib/views/shared/writes/SaidBody.svelte` (new) | 46 | 12 |
| `src/lib/views/boards/projects/Projects.svelte` | 440 | 12 |
| `src/lib/views/shared/forms/ThemeFacets.svelte` | 53 | 12 |
| `src/lib/views/sources/data/Data.svelte` | 140 | 12 |
| `src/lib/views/sources/venues/Venues.svelte` | 224 | 12 |
| `src/lib/state/client/writes.svelte.ts` | 859 | 13 |
| `src/lib/state/sources/explorer/view/card-tree.ts` | 44 | 13 |
| `src/lib/views/shared/card/feed/SaveToLiterature.svelte` | 162 | 13 |
| `tests/data/snapshot/reference-hub.ts` | 348 | 13 |
| `tests/server/desktop/app-theme-start.test.ts` | 490 | 13 |
| `tests/ui/controls/editor/kit/comment-rules.test.ts` | 206 | 13 |
| `tests/checks/tree/allow-styling.ts` | 99 | the card's rule lines |
| `docs/diagrams/layers.dot`, `layer-state.dot`, `layer-views.dot` and their `.svg` | 101, 173, 189 | written by `npm run diagrams` |

The paths beyond the round's list: `Slides.svelte`, `Audit.svelte` and `History.svelte` (comments only, the same false sentence as item 9's), `FocusFilter.svelte` and `HubChips.svelte` (item 10's imports), `collection.ts` (item 11's function), `ThemeFacets.svelte` (item 12, the existing partial of the Data and Venues copy) and `tests/checks/tree/allow-styling.ts` (the card's rule lines moved).
