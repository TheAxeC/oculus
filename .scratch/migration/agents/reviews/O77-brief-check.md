# Step O77 brief check (on main at 1283d0ac)

The report of the fresh agent of the `spec` skill's "Steps / The brief check", on `agents/briefs/O77.md`. Pages are cited by section; code and grep hits by `file:line`. Every command ran in `~/workspace/oculus` on main at 1283d0ac (`git log --oneline -1`: "1283d0ac Land O75: the bar of a project board in two lines, its slices and section headings"; `git status --short`: only `.scratch/migration/orchestrator-state.md`, `plan.md` modified and `agents/briefs/O77.md` untracked).

## 1. Names

The write list is the brief's "Paths this step writes" (O77.md:87-128). Each grep below excludes those paths.

- `waitingLine`, `WaitingLine`, `toggleCard`, `.expanded`, `LINE_FACETS`, `FACETS`, `CollectionState`, `foldToggled`, `FoldKey`: `git grep -n -E "<name>" -- src tests config docs README.md ':!config/local.yml'` filtered to paths outside the write list: no hit for any of them.
- `openBeside`: same grep; hits outside the write list: `src/lib/state/sessions/latex/actions.ts:42`, `src/lib/state/sources/repositories/repositories.svelte.ts:238`, `src/lib/state/workbench/layout/open/show.ts:115`, `src/lib/views/academic/present/acts/run.ts:26` (each a structural type `(view, state?, page?, asker?) => string`), callers in `Present.svelte`, `acts.svelte.ts`, `lead-apply.ts:64`, `explorer/opening.ts:90`, `row-menu.ts:523`, `DatasetCard.svelte:92`, `Source.svelte:390`, `BarActions.svelte:91`, `latex-tab.svelte.ts:348`, `Catalogue.svelte:159`, `tests/views/shared/explorer/opening-apps.test.ts:72`, and the comments of `attention.ts:4,18,52-56,77,172`. An optional fifth parameter leaves every one of them true and type-correct.
- `CardActions`: hits outside the write list in `EntryCard.svelte:23,37,289`, `RegistryCard.svelte:11,81`, `DatasetCard.svelte:17,112`, `VenueCard.svelte:20,216`, `literature-card.ts:12`, `task-card.ts:12`, `Entry.svelte:54-55`. None is made false if `CardActions.svelte` is left alone; see finding 4.
- `ContextMenu` (15 files outside the list, for example `PaneBody.svelte:337`, `PaneStrip.svelte:215`, `StatusBar.svelte:205`, `TextBoxMenu.svelte:69`, `TerminalList.svelte:246`) and `MenuGroup` (`WorkbenchMenu.svelte:79`, `RepoItems.svelte:96`, `session-list.ts:96`, `SessionPicker.svelte:43`, `view-menu.ts:17`): an added optional `groups` prop leaves them true.
- Text keys: `git grep -n "under_review_at\|under_review_unset\|waiting_on\b\|blocked_external\|waitingLabel" -- src tests config docs README.md ':!config/local.yml'` printed `config/text/views/boards/project.yml:119,130-132` and `stats.ts:38-54` (in the list); `person.yml:29-30` `person.waiting_on` is a different key. `git grep -n "toggle_tip\|expand_glyph\|collapse_glyph\|more_actions\|more_glyph"` printed `FoldHead.svelte:52` (outside the list), which reads `project.card.expand_glyph`/`collapse_glyph`, so those two keys must stay; and `CardActions.svelte:167-168`, which reads `project.card.more_glyph` (`disclosure`) for all ten cards.
- The wording of the changed behaviours: `git grep -n -i "waiting line\|wait line\|under review at\|folder line\|folder path"` and `grep -rn -i "expand\|open card\|drawn open"` over source, docs and README, outside the list:
  - `config/catalogs/vocab.yml:90` and `src/lib/data/shapes/catalog-files/vocab.ts:142` ("which the wait line of a board card and of a lane card says"): still true, since the BLOCKED line says it.
  - `src/lib/state/boards/person.ts:35`: still true.
  - `src/lib/state/sources/files.svelte.ts:6` ("an opened card asks api/project-files"): still true of the project page's card.
  - Four hits are made false or partly false: findings 1 to 3 below, and `README.md:12`.

Findings:
1. `src/lib/state/workbench/layout/instance.ts:109-111`, the doc of `storedState`: "each field of `lists` that lists records (the cards drawn open or whole, the pillars a map draws)". Once `Projects.svelte:165` stops passing `'expanded'`, no view keeps a list of cards drawn open. The sentence becomes false, and the file is outside the write list. Failure scenario: the builder obeys the write list and leaves a false doc comment, which the rules file ("What every package obeys", the grep-and-carry rule) counts as a defect of the change; the reviewer then raises it against the brief's own path list.
2. `src/lib/state/boards/waiting.ts:1-3`: "the strip, the card helper line and the lane cards read one rule". Item 5 removes the card helper line and draws WAITING ON "as the TEAM line draws a person" and "as the RELATED line draws a project". Those lines name people through `personNames` and projects through `CardLinks`' related labels, not through `waitingLabel`. The comment becomes false, and two naming rules for a waited-on project appear. `waiting.ts` is outside the write list.
3. `src/lib/server/files/project/project-files.ts:1` ("for the finder on an expanded card") names a board state the step removes; it is partly false afterwards and outside the list. `README.md:12` ("Each project is a card with its status, venue, next action and subtasks") stops being true of the board card, which loses STATUS and the subtasks block.
4. Paths the brief's own items need but its write list omits:
   - (a) `src/lib/views/boards/focus/CommandCenterView.svelte:186` draws the command center's heading (`FoldHead`), and `src/lib/views/boards/focus/lanes/LaneHead.svelte` draws every lane and band heading (`Lanes.svelte:193`, `Band.svelte:113,133`). Item 8 puts "3 hidden" on each section's heading line.
   - (b) `src/lib/ui/menu/MenuOpener.svelte` draws the opener (`Menu.svelte:20`: "The button that opens the list, in each of its looks, is MenuOpener.svelte"). The write list names only `Menu.svelte` for the pressed look.
   - (c) `src/lib/views/shared/card/CardActions.svelte`, which case 6 expects may change ("empty or limited to an addition").
   - (d) `config/catalogs/vocab.yml:194-207` `facet_tones` and `config/options/catalogs/vocab.yml:191`. Every facet has a tone row there, and a `hub` facet without one is drawn in the unknown tone (`filter-menu.ts:75-84`).
   - (e) `config/catalogs/glyphs.yml` and `config/catalogs/icons.yml`. They hold no `filter` glyph (`grep -n "filter\|funnel"` printed nothing), and the brief names none for the Filter action.

   Failure scenario: the builder either writes outside the list (a finding against it) or leaves a ruled part unbuilt or grey.
5. `project.card.more_glyph` is shared through `CardActions.svelte:168` by all ten cards. The brief asks for a "..." opener without naming its glyph key. Changing that key's value to `more` (`glyphs.yml:172`, "...") changes the opener of the nine cards the brief says keep their controls.
6. `tests/checks/tree/allow-styling.ts:59-78` lists ProjectCard's `.slot > :global(...)` rules by selector. A changed slot or a two-column rule reaching into `Card.svelte`'s body would need an entry in this file, which is outside the list. This is a risk and was not verified.

## 2. The step line

- "on a project board a card no longer opens in place": item 1.
- "its open control opens the project page in the pane beside the board, the next project opened replacing it there": item 2, with decisions 1 and 2.
- "Add Subtask and Add Follow-up still open their form on the card": item 3.
- "the project page's card sets its blocks in two columns (... left; ... right, under the left in a narrow pane)": item 6. The left column is changed: NEXT is moved out (decision 6) and OUTCOME is added (decision 5).
- "the first sentence of `next` growing into the whole `next` in place so NEXT is said once": items 5 and 6, and decision 6.
- "under the pointer three icons (Ask, Open Workbench, Open project page)": item 4. Ruling 352 says "Open project page" with the page glyph; the brief names no glyph.
- "a '...' menu, also on a right-click of the card, listing every action in words with the icon it has today, grouped Open (...), Add (...), Edit Manifest, Pin to Top, Copy Context, and Deposit where the card has it": item 4.
- "Next drawn as the ELI5 is": item 5.
- "the review waiting line ... not drawn": item 5.
- "WAITING ON line above FUNDING ... as the TEAM line draws one, in amber": item 5.
- "BLOCKED line in red and the facts row's blocked chip red": item 5.
- "the folder's name with a folder glyph at the end of the facts row ...; the folder path line not drawn": item 5.
- "Lead, the lane, the stage chip, the VENUE line and the other labelled lines as now": item 5.
- "after O75": premise (O75 is at 1283d0ac).
- Ruling 378 (lane card role, tier, venue, HELP Focus line): item 7.
- Ruling 379 (Filter action; Mine only, Role, Tier; instance state; whole page; hidden counts; pressed): item 8.
- Ruling 380 (Hub list on Focus, board `FACETS`, collection views; drawn only with more than one hub): item 9.
- "(the Expand all / Collapse all button of 354) is not drawn" (ruling 352): premise, O77.md:17. `git grep -n -i "expand_all\|collapse_all\|expandAll\|collapseAll" -- src config` shows no board hit.

Findings:
1. The page glyph of ruling 352 ("becomes 'Open project page' with the page glyph", state file closed item 352) is not in item 4 or any case. `glyphs.yml:128` holds `page`. Failure scenario: the builder picks another glyph, and the look passes it because nothing says which glyph to expect.
2. The left column. The step line and ruling 352 list "STATUS, LATEST, NEXT, RESULTS, IDEAS / AVENUES". Item 6 and decision 6 move NEXT out of the column into the brief line and put OUTCOME after RESULTS. Both readings fit "grows in place". The brief records it as a decision, but it departs from the ruled list, which is the orchestrator's to confirm before dispatch rather than the builder's to defend.
3. Ruling 380 and item 9 say the Hub list starts "all ticked", but on the board the same item makes it "a group of `FACETS` ... counted like the others". A `FACETS` group starts with nothing picked, and a pick keeps (case 18: "a pick of one keeps that hub's projects"). Item 9's lead sentence contradicts its own board bullet and case 18. Failure scenario: the builder draws the board's Hub values pre-picked, and every hub is filtered in from the start; or the reviewer cannot tell which form the brief asked for.
4. Ruling 353 says the menu lists "every action". Decision 4 adds Clone and Cloned-in "since the menu lists every action", but item 4 and case 5 leave Ask and Open project page out of the menu. The rule the brief gives for Clone would put them in.
5. Item 4 names the menu rows "Workbench", "Presentation", "Subtask", "Follow-up" under the headings Open and Add. Today's labels are "Open Workbench", "Open presentation", "Add Subtask", "Add Follow-up" (`config/text/views/boards/project.yml:5,8,92,126`). The brief does not say whether the rows take new short keys or today's words.

## 3. Premises

- Line 11, the rulings and their closed texts: `grep -n -E "^- (Open item (352|353|354|356|378|379|380)|...)" plan.md` printed lines 2707-2725. The state file's closed items hold 352, 353, 356, "356 (2), redone", 378, 379 and 380 (`sed -n 170,526p orchestrator-state.md`). Matches.
- Line 12, the card's size and importers: `wc -l` gives 473. `git grep -n "ProjectCard" -- src | grep -i import` gives `Project.svelte:55` and `Projects.svelte:76`. Matches.
- Line 12, the action order and conditions: they match `ProjectCard.svelte:152-293`. The range differs: the brief says `:155-299`.
- Line 12, `git grep -ln CardActions -- src`: the nine files listed plus `ProjectCard.svelte`. Matches.
- Line 13: `openTitle` is at `ProjectCard.svelte:303-305`, not `:307-309`. `key-dom.ts:70` reads `'.title button, [data-card-toggle]'`, which matches.
- Line 14, the closed card's order: it matches `ProjectCard.svelte:378-412`. The range differs: the brief says `:385-424`.
- Line 14, `waitingLine`: it is at `stats.ts:30-57`. `git grep -n waitingLine -- src tests` gives `index.ts:61`, `stats.ts:30` and `ProjectCard.svelte:45,126`. Matches.
- Line 15, CardBrief, CardDetails, CardLinks and CardFacts: matches the files (`CardBrief.svelte:39-43`, `CardDetails.svelte:54-107`, `CardLinks.svelte:61-98`, `CardFacts.svelte:46-83`).
- Line 16: `stats.ts:53` is `anyWord(config, 'chips', 'blocked', ...)`. Matches.
- Line 17, Projects.svelte:
  - 441 lines; `:165` is `storedState(..., ['expanded', 'more'])`; `:248-254` match.
  - `toggleCard` runs from `:193` to `:198` (the brief says `:193-197`).
  - `grep -n "glyph=" Projects.svelte` gives add, cards, list, full_titles, sliders. Matches.
- Line 18: `Project.svelte` is 223 lines. Matches.
- Line 19, `openBeside`: the signature at `opening.ts:187-189` and `OpenOptions.preview` at `:54-57` match. `layout.svelte.ts:212` and `:836` match.
- Line 20, Focus: 282 lines. The `portfolio()` reads are at `CommandCenter.svelte:47`, `Band.svelte:45` and `Lanes.svelte:68`; `Focus.svelte` derives `week` and `strip` from its own read; `Pane.svelte:27-28` has `toolbar`; `Person.svelte:177` uses it. Matches.
- Line 21: `TickerItem` at `ticker-lines.ts:59-88` carries `id`, `entry`, `target` and `root`. Matches.
- Line 22, LaneCard: the parts are at `LaneCard.svelte:82-110`. The `placed: true` stages are at `vocab.yml:68,70,71,72,73`. Matches.
- Line 23, Mine only:
  - `isMine` is at `roles.ts:88-95`; `board.mine_all` "Every project here is yours" is at `projects.yml:43`; `FilterBar.svelte:140` matches.
  - `roles:` is at `vocab.yml:222-226` and `tiers:` at `:211-214`. Matches.
- Line 24: `FACETS` is at `presets.ts:261` and `LINE_FACETS` at `filter-menu.ts:49`. G92 and G124 are at `guarded.md:287,183`. Matches.
- Line 25: `Collection.svelte` is 505 lines; the bar is at `:384-404`. `CollectionState` is declared at `collection.ts:103`; lines 127-160 hold `emptyCollectionState` and `parseCollectionState`. The facts match; the cited range is off.
- Line 26: `fs-transport.ts:238-248` and `edits.ts:325` match.
- Line 27, the menus: `MenuGroup` is at `menu-items.ts:92` and `grouped` at `:79-85`. `ContextMenu.svelte` takes `items`, `read` and `lead`, and no `groups`. `grep -n pressed Menu.svelte` finds no pressed look. Matches.
- Line 28: HELP lines 272, 287, 288, 290, 291 and 295 start as the brief says. Matches.
- Line 29: `git grep -ln "ProjectCard\|CardActions\|waitingLine\|parseCollectionState\|openBeside" -- tests` printed `tests/checks/tree/allow-styling.ts` and `tests/views/shared/explorer/opening-apps.test.ts`. The brief says "only `opening-apps.test.ts`"; the allow list is a second hit (see Names finding 6).

Findings:
1. Line 19 describes `openBeside` as "opens a new pane right of the pane activated last, and the pane the last beside-open made takes the next view as a new tab". That is the tool-view branch of `openInto` (`opening.ts:286-316`). `project` is registered with `group: ''` (`Project.svelte:9`), which `context.ts:721` makes an opened-for-something view. So `openInto` hands it to `openOpened` at `opening.ts:241` (with `away` the board's pane, `:242`, `:356`), and `landingFor` decides where it lands (`landing.ts:57-97`). In order, that is: the received tab's pane, the reader's pane when it holds opened tabs, any empty pane (`:92`), any pane holding no tool (`:94`), and only then a split right of the board (`:96`). The brief's read list gives `opening.ts` lines 40-300 only, and `openOpened` (`:318-385`) and `landing.ts` are not on it. Failure scenario: the builder reasons from the wrong branch, and cases 1 and 2 are judged against behaviour the code does not have.
2. Line 26 says "a project of a workspace folder that is no hub carries that folder's name". That holds only in a workspace with no primary (`hub-names.ts:12-13`; `index.ts:672-674`: "with a primary such a folder's records are the primary's"). Axel's workspace has a primary (`research-hub.yml:14`, `primary: research-hub`) and eight folders that are projects and not hubs (a `[ -f .oculus/config.yml ]` loop over its folders found one hub; cathedra, game-engine, ordo, oculus, theaxec.github.io, scotoma, officium and youtube-downloader hold `.oculus/project.yml`). Item 9's rule "A record of a workspace folder that is no hub is kept by the Hub list whatever is ticked" therefore cannot be keyed on `root`, which names the primary for those records. Failure scenario: unticking the primary hub hides the repository projects that item 9 says stay.
3. Line ranges that do not match: `ProjectCard.svelte` `:155-299` (now 152-293), `:307-309` (now 303-305), `:385-424` (now 378-412), `Projects.svelte` `:193-197` (now 193-198), `CollectionState` `collection.ts:127-160` (declared at 103). Line 29's "only `opening-apps.test.ts`" omits `allow-styling.ts`.

## 4. Cases and checks

- Cases 1, 3, 5, 7, 8, 9, 10, 16 and 17 (reading and the look): consistent with "What every package obeys" (a builder runs no page; the look on landing is the proof).
- Cases 11-15, 18 and 19 (a run the report quotes): consistent with the case-run rule.
- Case 20 runs the tests of G92 and G124, whose code (`facets.ts`, `state.ts`, `presets.ts`) the step changes: consistent with the test rule (`spec.md`, "What every package obeys", a test exists only as the test of a `guarded.md` entry).
- No case asks for a new test, so the test rule holds.
- Case 4: consistent.

Findings:
1. Case 2 has the builder check by "reading `openInto`". For the project view the path is `openOpened` and `landingFor` (Premises finding 1). `landing.ts` is a file the step does not change, and its expected result ("while no pane is beside it makes one") is not what `landingFor` does when the page holds an empty pane or a pane with no tool view (`landing.ts:92-95`). Failure scenario: the builder either reports case 2 as failing on the unchanged tree and stops, or edits landing rules outside the write list to make it true.
2. Case 6 asks the builder to check `CardActions.svelte` with `git diff <base>`. That file is outside the write list, a place the step should not change. It also contemplates "an addition those cards do not pass", which the write list does not allow.
3. The Report section (O77.md:184) and the write list (O77.md:128) have the builder write `.scratch/migration/agents/reviews/O77-report.md`. The rules file's "Where you work" says "You never edit anything under `.scratch/`." The same instruction stands in O70, O74 and O75 and in the `spec` template, so this is a standing clash between the rules file and the brief template. It is named here and was not decided.

## 5. The question

The plan's goal for this step is the step line's behaviour: the board card, the project page beside it, the closed card's lines, the lane card's facts, the Focus filter and the Hub list, each working on the page.

- Cases 1, 3, 5, 9 and 10: no. The look on landing shows the card, the menu and the columns.
- Case 2: yes. It is checked by reading the wrong function against an expectation `landingFor` does not meet (Cases finding 1).
- Case 4: no.
- Case 6: no.
- Case 7: yes for BLOCKED. The state file's 356 (2) text counts "0 cards of the Projects board" with a blocked chip, so on TEST the BLOCKED line and the red chip rest on reading alone.
- Case 8: no.
- Case 11: no. A run of the mark picker plus the look.
- Case 12: no. Run plus look.
- Cases 13, 14 and 15: yes. Each is "a run the report quotes" of the pure module only, with no look. The sections could ignore the module (the Band or the Awaiting box not filtered by Tier, the "n hidden" count missing) and the runs still pass.
- Case 16: no.
- Case 17: no.
- Case 18: yes. The workspace TEST runs on has one hub (the loop above), so the Hub group, the Focus Hub list and the collection Hub chips are never drawn at the look. Pure-function runs pass with the bar and the chips unwired.
- Case 19: yes in part. A parser run shows `expanded` is dropped. It cannot show "every card closed", which is the view's behaviour.
- Case 20: yes. G92's and G124's tables hold no row for a Hub facet, so they pass without it.
- Verify 1 (`npm run diagrams && npm run test:quick`): yes. No test reaches the views, the Focus filter or the Hub chips.
- Verify 2: yes, as case 20.
- Verify 3 (unused exports): hygiene, and does not bear on the goal.
- Verify 4 (`git grep -n "expanded\|toggleCard\|waitingLine\|under_review_at"`): yes for its purpose. It omits `under_review_unset`, `project.helper.waiting_on` and `project.card.toggle_tip`, which also lose their reader. The orphan-key check catches them at `test:quick`, but the brief's grep does not.
- Items 1 to 11 of "What to build": each rests on the look on landing. Item 9 cannot be seen on TEST (one hub), and item 5's BLOCKED cannot be seen there (no blocked card).

Findings: case 2; case 7 (BLOCKED); cases 13, 14 and 15; case 18; case 19; case 20 and verify 2 with respect to the Hub facet; verify 4's missing keys; item 9 and item 5's BLOCKED with no look on data that shows them. Failure scenario for all of them: the reviewer accepts runs of pure functions as proof of a page that was never seen in the state that exercises it.

## 6. Implied inputs

Findings (each missing from "Cases", with the expected result it should state):
1. A workspace whose people file has no `self: true`. `roleOf` returns `other` for every record that names people (`roles.ts:56-65`), and `isMine` keeps only records naming no one (`roles.ts:88-95`). `vocab.yml:221` says "With no `self`, no role is read", and the project boards draw Mine only and Role only while a `self` is named (`state.ts:100-120`, `offersMine`). Expected: on Focus, Mine only and Role are not drawn (or are drawn disabled) and are not applied, and no lane card draws a role mark. Cost: Mine only on at the start would hide most of the Focus page, and every lane card would read "Other".
2. A Hub choice saved while the workspace had two hubs, read after it has one: an unticked hub on Focus or a collection view, or `filters.hub` on a board. The list is not drawn, but the saved choice still hides. Expected: the Hub choice applies only while the list is drawn, as `appliedFilters` drops a role filter with no `self` (`state.ts:100-112`). Cost: records hidden with no control to bring them back.
3. A press on a card whose project is already the beside pane's preview tab. `openOpened` keeps it (`opening.ts:352`, `keepPreview`), so the next project opens a new tab instead of replacing it. Expected: say whether a second press activates without keeping. Item 2 says only "activates it".
4. A project page in the preview tab with a subtask or follow-up form half typed. The next project from the board retargets that tab and clears its instance state (`opening.ts:366-368`), on the assumption that "A preview tab never holds an unsaved edit, since typing into one keeps it" (`:275`). That assumption holds for source tabs, not for this form. Expected: typing into the page's form keeps the tab, or the replace asks. Cost: lost typing.
5. A board in a floated window. `isPage(held)` is false, so the project page opens as a tab of the float (`opening.ts:237-243`). Expected: state it.
6. A board in a maximised pane. `openOpened` gives the maximised pane back (`opening.ts:362`). Expected: state it.
7. A `waiting-on:` value that resolves to no person and no project, or is empty. `waitingLabel` draws its key (`waiting.ts:23`); RELATED draws an unheld id as a tag with no press (`CardLinks.svelte:113-117`). Expected: an amber tag of the key with no press. An empty value draws nothing.
8. A project with no folder (`folder: ''` and no `workspaceFolder`). Expected: no folder item at the end of the facts row.
9. A workspace with a primary and folders that are not hubs (Axel's, Premises finding 2), and a workspace with no primary. Expected: say how a repository project's hub is read for the Hub list (`workspaceFolder`, not `root`) so item 9's keep rule holds in both.
10. A board whose rule names one `hub:` in a workspace of two hubs. Expected: the Hub group with one value drawn, or not drawn.
11. The Focus filter hiding every project. `Focus.svelte` draws `focus.none` only when `board.length === 0 || projects.length === 0`. Expected: say whether the page shows the empty message, or lanes with "n hidden".
12. A pick in the Filter menu. `Menu.svelte:13-15` closes the list on a pick, so unticking three roles takes three openings, while the board's group lists stay open on a pick (HELP:292). Expected: say whether the Filter menu stays open on a pick.
13. A submitted project with a venue on Focus. The lane card's wait line already says the venue (`Lanes.svelte:107-114`), and the new venue mark says it again. Case 11 uses exactly this card and does not state what the wait line shows.
14. The saved shapes of the Focus filter in the tab's instance state, of the collection's Hub chips (a `CollectionState` field), and of the board's `hub` filter key. They are saved with the layout under `~/.oculus`, and the brief names none of them. The rules file's "No silent design decisions" lists "a key in a saved record under `~/.oculus`" as a user-visible shape. Expected: the brief names the keys, or the builder reports them as decisions.
15. The 15 other `ContextMenu` users (`git grep -l "ContextMenu.svelte" -- src | wc -l`: 33 including imports; 15 views and shells listed in Names) after `groups` is added. Expected: they draw as before. No case says so. Low cost.

## 7. ADRs

- `ls docs/adr`: "ls: docs/adr: No such file or directory". No record.

Findings: none.

## 8. Dictated text

`LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O77.md` printed nothing: the brief is ASCII. No em dash, and no dash used as punctuation (`grep -n " - \| -- "` hits only nested bullet markers and `-- src` git arguments).

- "Everything here is yours" (`focus.mine_all`): `grep -n "Everything here is yours" O77.md`, line 49. Holds.
- "3 hidden" / "<n> hidden": `grep -n "hidden\"\|<n> hidden" O77.md`, lines 53 and 75. Holds.
- "Open project page": `grep -n "Open project page" O77.md`, lines 34, 36, 64 and 67. Holds (the ruling's words).
- "...": `grep -n '"\.\.\."' O77.md`, lines 36, 67 and 68. Holds; it is three ASCII dots.
- WAITING ON and BLOCKED: `grep -n "WAITING ON\|BLOCKED" O77.md`, lines 40, 41, 70 and 138. Holds.
- Headings Open and Add, and rows "Folder, Show in Files, Workbench, Presentation", "Subtask, Follow-up", "Edit Manifest, Pin to Top (or Unpin), Copy Context, Deposit", "Clone or the Cloned-in entry": `grep -n "Show in Files" O77.md`, lines 36 and 68. Holds. Which words the rows read is ambiguous (step line finding 5).
- The BLOCKED line's words, "with the words `project.helper.blocked_external` says today" ("blocked (external)", `project.yml:119`): `grep -n "blocked_external" O77.md`, line 41. Holds.
- "under review at ...", quoted only to name the line that goes: `grep -n "under review at" O77.md`, line 39. Holds.

Findings: none.

## Declined to judge

- `plan.md` has no section headed Goal (`grep -n "^## " plan.md`: Steps, Could run in parallel, Rulings, Agents, Blocked); its top paragraph names the ledger's purpose. The goal used in section 5 is the step line's behaviour.
- Whether decision 6 (NEXT out of the left column) and decision 5 (OUTCOME kept) are readings of ruling 352 or departures from it. That is Axel's call; it is raised in section 2.
- The casing of "Open project page" (sentence case) against its sibling labels "Open Workbench", "Show in Files" and "Edit Manifest" (title case). The words are Axel's ruling; a uniform casing is his call.
- The BLOCKED line reading "BLOCKED blocked (external)" beside a red "blocked (external)" chip, which says the same fact three times. It follows rulings 356 (2), redone, and the brief's choice of words; whether to shorten the words is Axel's call.
- The base output `.agents/worktrees/O77-base/unused-exports.txt` named in verify 3 does not exist yet (`ls .agents/worktrees/` lists only `gate`). The `spec` skill makes the worktree after this check, so it was not checked.
- Whether G92's table needs a row for the new Hub facet under the test rule's "one row per input that gives a different outcome". The entry's text speaks of values shared across hubs, and the brief says no row; this is the orchestrator's call.

Agent usage: a0e953361e2056991, claude-opus-5-5, 297500 tokens, 106 tool uses, 13 min 50 s.

## Closed

- Names 1 (`instance.ts:109-111`): item 1 rewords the doc of `storedState`; the path is in the write list.
- Names 2 (`waiting.ts:1-3`): item 5 names every waited-on value by `waitingLabel` and rewords the head comment; decision 6; the path is in the write list.
- Names 3 (`project-files.ts:1`, `README.md:12`): item 10 rewords both; both are in the write list.
- Names 4 (a) to (e): `CommandCenterView.svelte`, `LaneHead.svelte`, the `facet_tones` rows of `vocab.yml` and its options file are in the write list; the Filter action uses `sliders`, an existing glyph, and the board's `PickMenu.svelte` list, so no glyph file, `MenuOpener.svelte` or `Menu.svelte` changes; `CardActions.svelte` stays unchanged (item 4, case 6).
- Names 5: the "..." opener reads a new key `project.card.menu_glyph` (`more`), so `project.card.more_glyph` is untouched (item 4, decision 5).
- Names 6: `tests/checks/tree/allow-styling.ts` lines 55-80 are in the write list, and item 11 says its entries follow the card's lines.
- Step line 1: item 4 and case 4 name the glyph `page`.
- Step line 2: ruled by Axel, open item 381 (a): item 6 and case 10 follow the ruled column with OUTCOME after RESULTS, and the first-sentence line is not drawn on the page.
- Step line 3: item 9 says the board's Hub group starts with nothing picked, like every group, which keeps every hub; decision 11.
- Step line 4: Ask and Open project page are in the menu (item 4, case 5, decision 4).
- Step line 5: the row words are new keys in the words ruling 353 gives (item 4).
- Premises 1: the `openBeside` premise rewritten to `openInto`, `openOpened` and `landingFor`, with `preview` passed into `openOpened` (item 2); `landing.ts` and `opening.ts` lines 40-400 are on the read list.
- Premises 2: a record's hub is its `root`, a non-hub folder's project being the primary's in a workspace with a primary (premise and item 9); the exception for non-hub folders is gone.
- Premises 3: the line ranges corrected; `allow-styling.ts` named.
- Cases 1 (case 2): case 2 rewritten to `landingFor`'s behaviour, checked by reading `openInto`, `openOpened` and `landingFor`.
- Cases 2 (case 6): case 6 checks by reading the unchanged `CardActions.svelte` and the `ContextMenu.svelte` diff.
- Cases 3 (the report under `.scratch/`): not changed; the builder's report path in the worktree's copy of the ledger is the one ledger file `plan-orchestration` allows a builder to write ("The builder").
- The question (cases 2, 7, 13 to 15, 18 to 20, verify 4): the look on landing runs on a scratch server with a workspace of two hubs and a project at each waiting state (case 7); cases 13, 14, 18 and 19 add the look; case 20 adds the board's draw; verify 4 greps the other keys that lose their reader.
- Implied inputs 1: case 16 and item 8 (no `self`: Mine only and Role not drawn or applied, no role mark).
- Implied inputs 2: item 9 (a saved hub choice applies only while the list is drawn) and case 18.
- Implied inputs 3: item 2 and decision 2 (a second press activates and keeps the tab).
- Implied inputs 4: item 2 (typing in the page keeps its tab) and case 21.
- Implied inputs 5 and 6 (a float, a maximised pane): item 2 places the page where `openOpened` and `landingFor` do, which handles both as they do for every view opened for something.
- Implied inputs 7: item 5 and case 7 (a value that names nothing is a tag of its key with no press).
- Implied inputs 8: item 5 and case 8 (no folder, no folder item).
- Implied inputs 9: premise and item 9 (`root`).
- Implied inputs 10: the Hub group is a facet, drawn with the values the board's projects hold, under item 9's rule of more than one hub in the workspace.
- Implied inputs 11: item 8 (lanes drawn with their counts; `focus.none` for a portfolio with no projects).
- Implied inputs 12: item 8 and decision 14 (the list stays open on a pick), case 17.
- Implied inputs 13: ruled by Axel, open item 382 (a): item 7 and case 11 (no review wait line on a lane card).
- Implied inputs 14: decision 13 names the saved keys.
- Implied inputs 15: case 6 covers the other `ContextMenu` users.
