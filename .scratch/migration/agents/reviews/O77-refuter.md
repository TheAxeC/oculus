# Step O77 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O77, base 796273a8)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams && npm run test:quick   (worktree root)
test:quick: 56 changed file(s), from git since HEAD
test:quick: 35 test file(s)
ok      prettier (0.4 s): All matched files use Prettier code style!
ok      ASCII gate (0.5 s)
ok      svelte-kit sync (2.0 s)
ok      eslint (1.9 s)
ok      svelte-check (7.6 s): 1792956842562 COMPLETED 543 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (24.0 s): Duration  17.14s (transform 25.32s, setup 0ms, import 46.13s, tests 10.43s, environment 376ms)
ok      vitest slow (24.1 s): Duration  17.16s (...)
ok      vitest checks (40.2 s): Duration  33.14s (...)
test:quick: 42.4 s; every command passed
exit 0
(git status --short printed 55 entries before and after the run: npm run diagrams changed nothing)

$ npx vitest run tests/state/boards/board/board-rules.test.ts tests/state/boards/board/hub-facets.test.ts
 Test Files  2 passed (2)
      Tests  85 passed (85)

$ sh utils/unused-exports.sh > <scratch>/unused.txt; diff .agents/worktrees/O77-base/unused-exports.txt <scratch>/unused.txt
129c129
< src/lib/state/boards/focus-lanes.ts: entryDeadline
---
> src/lib/state/boards/focus/focus-lanes.ts: entryDeadline
283c283
< src/lib/state/boards/board/index.ts: BoardColumn, FacetValue, LabelMode, SessionsOf, VenueCount, WaitingLine
---
> src/lib/state/boards/board/index.ts: BoardColumn, FacetValue, LabelMode, SessionsOf, VenueCount
(no new unused export)

$ grep -rn "expanded\|toggleCard\|waitingLine\|under_review_at\|under_review_unset\|helper.waiting_on\|toggle_tip" src config/text docs README.md --exclude=local.yml | grep -v "^docs/diagrams/"
(plain grep in place of the brief's git grep, since this review runs no git command but the three named)
184 lines; every one is the word `expanded` in another sense (aria-expanded, the ToolButton/TreeItem/FoldLine prop, the explorer's open folders, a `~` expanded in a path, CardLinks' tag kinds drawn whole, FocusFilter.svelte:209 `expanded={open}`)
$ grep -rn "toggleCard\|waitingLine\|under_review_at\|under_review_unset\|helper.waiting_on\|toggle_tip" src config/text docs README.md tests --exclude=local.yml | grep -v "^docs/diagrams/" | wc -l
0

$ ASCII gate of the rules file over every path of git status --short, the new folder, the report, HELP.md, README.md
(prints nothing; only "Can't open src/lib/state/boards/focus-lanes.ts", the deleted file)

Commands the report quotes as evidence:

$ node <scratchpad>/o77/cases.ts   (from the worktree)
exit 0; output compared with the builder's cases.out: SAME (diff printed nothing). Lines as quoted in the report, e.g.
p-sup (supervisor, personal, submitted at BSPC), self named: ["Supervisor","Personal","BSPC"]
p-lead (lead, research, exploring), self named: []
p-sup, no self named: ["Personal","BSPC"]
mine on: ... "hidden":{"command":1,"tasks":0,"awaiting":1,"lanes":{...,"push":1,...}},"hides":true,"mineHides":true
mine on, every project yours: ... "hides":false,"mineHides":false
board Hub group, slice filter ["in-flight/exploring"]: ["hub-a:2","hub-b:1"]
board pick hub-b keeps: ["p-b1","p-b2"]
collection hub-b unpressed keeps: ["t1"]
parsed: {"mode":"cards","search":"","filters":{},"more":[],"labels":"short","stale":false,"dated":false,"mine":true,"folded":[]}
has expanded: false

$ node <scratchpad>/o77/c20.ts   (now, on the changed tree)
{"mode":"list","search":"","filters":{},"more":[],"labels":"short","stale":true,"dated":false,"mine":true,"folded":[]}

$ npx vitest run tests/checks/tree/duplication.test.ts tests/checks/source/comment-width.test.ts tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts tests/checks/source/keys.test.ts
 FAIL tests/checks/source/comment-width.test.ts: writes.svelte.ts:632, card-tree.ts:4, SaveToLiterature.svelte:89, reference-hub.ts:4, app-theme-start.test.ts:309, comment-rules.test.ts:166 (none of them in git status)
 FAIL tests/checks/tree/duplication.test.ts: "Collection.svelte:436 and Projects.svelte:366 hold the same 9 lines (f4adec91945b)", "Data.svelte:64 and Venues.svelte:77 hold the same 6 lines (c9d225dfd7c8)"
 Test Files  2 failed | 3 passed (5)
      Tests  2 failed | 49 passed (51)
(the report's quotes of these reds reproduce; boundaries, size and keys pass)

Line counts the report gives: wc -l Collection.svelte 520, ProjectCard.svelte 507, filter.ts 408, FocusFilter.svelte 282, HubChips.svelte 59, card-menu.ts 69: as reported. 31 added catalog keys: counted from the diff (collection 2, focus 9, project 19, projects 1): as reported. ls src/lib/state/boards on the base copy: 10 entries, as the report says.
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `presets.ts`, `state.ts` and `Projects.svelte` carry no `expanded`; the zod object drops an old key (c20.ts run above); `instance.ts` doc reworded. Its rewrap is Standards 1.
- 2: holds. `openBeside` takes `OpenOptions` and passes `preview`; the card's `openPage` passes `{ preview: true }`; the project view goes through `openOpened` and `landingFor` with the board as asker; `Project.svelte:271` keeps the tab on `input`. The extra `openInto` branch is Spec 1; the replaced non-project preview tab is Behaviour 1.
- 3: holds. Subtask and Follow-up are always in `actions` (`ProjectCard.svelte:183-199`) and drawn on a board card while adding (`:468-475`). What it draws is Behaviour 5.
- 4: holds. `card-menu.ts` `ICONS` and `RUNS` as the brief orders them; `Menu` with `project.card.menu_glyph`; `ContextMenu` with `groups` and `own` around the card; `CardActions.svelte` and `Menu.svelte` are not in git status.
- 5: violated, Standards 2 (a repeated `waiting-on:` value throws in the keyed each of `CardLinks.svelte:180`). Everything else holds: NEXT in the ELI5 style, no review line, WAITING ON and BLOCKED before FUNDING, the blocked chip red, the folder at the end of the facts row, `waitingLine` gone.
- 6: holds. `CardDetails.svelte` two columns in the ruled order with OUTCOME after RESULTS, the subtasks and follow-ups at the foot of the right column, `next={!page}`; columns stack below about 660 px.
- 7: holds. `laneFacts` (`focus.ts:435-464`) output reproduced; the review branch of `waitLine` removed; the HELP Focus line says so.
- 8: holds. `filter.ts` and `FocusFilter.svelte`, the saved `filter` key, the hidden counts on FoldHead, LaneHead and the Awaiting box, the sections handed their records. The Mine only measure is Spec 3; the head comment of `Focus.svelte` is Standards 4.
- 9: holds. `hubList` (`hubs.ts`), the `hub` facet in `FACETS` and `LINE_FACETS`, `facet_tones.hub: grey-d`, `HubChips.svelte` and `CollectionState.hubs`, each applied only while more than one hub is listed. The options file needs no row; the report's premise correction 1 holds by reading `config/options/catalogs/vocab.yml:191-199`.
- 10: holds. The new keys have readers (keys.test passes), the removed keys have none, and HELP and README are rewritten. Sentences elsewhere that the step makes false are Standards 3 and Standards 4; the HELP landing sentence is Standards 5.
- 11: holds. Every file is at or under its limit (Collection.svelte at exactly 520), the new partials and modules each have a head comment, and the `allow-styling.ts` entries now cite `ProjectCard.svelte:471/478/482`, which `sed` confirms. Its listing is Proof 3.

Cases of the brief's "Cases":

- 1: met by reading (`Projects.svelte` passes no `open`/`ontoggle`; the title, Open project page and `key-dom.ts:70` `.title button` all reach `openPage`). The look on landing remains.
- 2: met by reading `openInto` (`opening.ts:269-271`), `openOpened` (`:354-391`) and `landingFor` (`landing.ts:57-97`); the look remains.
- 3: met by reading. What it draws is Behaviour 5.
- 4: met by reading (`ProjectCard.svelte:232` pushes workbench only when served; `stripActions` and `menuRuns` both read `actions`).
- 5: met by reading (both menus get `groups={runs}`); Shift+F10 waits on the look.
- 6: met by reading (CardActions unchanged; `ContextMenu.svelte` `groups` optional, `offered` falls back to `shown.length > 0`).
- 7: met by reading; the scratch-server look remains. The repeated-value crash is Standards 2.
- 8: met by reading (`CardFacts.svelte:51-56`, `:106-112`).
- 9: met by reading (`CardBrief.svelte` `.said`; `next={!page}`; CardDetails' NEXT holds the whole `next`).
- 10: not verifiable here. The look at a wide pane and at about 420 px would settle it.
- 11: met. My run of cases.ts reproduces `["Supervisor","Personal","BSPC"]`, `[]` and, without self, `["Personal","BSPC"]`. The people wait line is met by reading `Lanes.svelte:107-116`.
- 12: met (run reproduced: p-other off its lane, its line and Peeters hidden, `command:1, awaiting:1, push:1`).
- 13: met (run reproduced; the events entry "Talk" and the lead stay; the banner reads the whole portfolio, `Focus.svelte:33`).
- 14: met (run reproduced: `review:1, idea:1`, entries and leads kept).
- 15: met (run reproduced: `"mineHides":false`; `FocusFilter.svelte:78-79`).
- 16: met (run reproduced; `FocusFilter.svelte:69` and `:85` require `named`).
- 17: met by run and reading (read back equal; `onSelect` leaves `open`); the look remains.
- 18: met. The board and Focus parts were run; the collection part is met by reading `Collection.svelte:166` (Proof 2).
- 19: partial. The board and Focus parts were run and reproduced. The collection part of the run filters with a copy of the rule written in the script, not with `Collection.svelte`'s code (Proof 2).
- 20: met (cases.ts and c20.ts reruns: no `expanded`).
- 21: met by reading (`Project.svelte:116-118`, `openOpened` taking `previewIn` only of a preview tab); the look remains.
- 22: met (85 of 85; neither file in git status).

## 1. Spec

- Spec 1. `src/lib/state/workbench/layout/open/opening.ts:291-301`: "const aside = beside && inside === null && isPage(held); ... const target = aside ? stack : path; const replaced = preview && target !== null ? previewIn(paneAt(tree, target)) : null;". What is wrong: no item asks for this. Item 2 asks for `preview` to be passed into `openOpened`, which the project view takes (`opening.ts:269-271`). The new branch runs only for an `openBeside` of a tool view with `preview`, and no caller makes that call. The two callers of `openBeside` with options are the project card (`ProjectCard.svelte:304`, a `project` view, so `openOpened`) and `latex-tab.svelte.ts:348` (no options). The pass-through of `document` and `held` (`:204-206`) has no caller either. The report's judgment call 8 says so itself ("The project view itself goes through `openOpened`"). Failure scenario: a maintainer reads the moved `aside`/`stack` lines and the new comment as the path the board's page takes, and edits `openInto` to change how the project page lands. Nothing changes, because the page goes through `openOpened`. Verdict: none; item 2 still holds.
- Spec 2. `src/lib/state/boards/focus/focus-lanes.ts`, moved from `src/lib/state/boards/focus-lanes.ts`. What is wrong: the move is needed: the base folder held 10 items, so the filter module could not go there, and the brief's path line "`src/lib/state/boards/` a new module" would have broken the ten-item rule. The report gives this in its files section, not under "What in the brief was wrong", and it does not name the move as a dependency. Ruling 383, ruled for O77's repair round 1, names `src/lib/state/boards/focus-lanes.ts:153-164` and says "`focus-lanes.ts` added to its paths". That path is in `plan.md` Rulings (Open item 383) and in the main checkout's state file, closed item 383. Failure scenario: the round 1 brief is written from ruling 383's path, and the builder finds no file at `src/lib/state/boards/focus-lanes.ts` (`bandItem` is now at `focus/focus-lanes.ts`). Verdict: none.
- Spec 3. `src/lib/state/boards/focus/filter.ts:393-401`: "const mineHides = hiddenTotal(minedHidden) > hiddenTotal(restHidden); const applied = filter.mine && mineHides;". What is wrong: decision 2 measures "would Mine only hide anything" under the rest of the choice in force. The project boards measure it before any filter (`offersMine`, `state.ts`, "read before any filter"). Ruling 379 asks for the Focus filter to use "the same switch, words, `isMine` rule and starting state" as the boards. This is a reading the ruling allows, but it differs from the boards' rule, and the tip can then be false. Failure scenario: every project that names people but not you is of tier personal, and Personal is unticked. Mine only is drawn disabled with the tip "Everything here is yours" while such projects exist. Tick Personal again and Mine only turns on and hides them. Verdict: none; item 8 holds.
- The files written outside the brief's path list, judged:
  - `src/lib/state/shared/page/hubs.ts` (`hubList`) is the one rule three views read, placed beside `hubsTaking`. It stays.
  - The move of `focus-lanes.ts` and its follow-on changes stay. The content is unchanged except the import paths (`diff` of the two files). The importers are `ticker.ts:38`, `Band.svelte:27` and `filter.ts:41`, and `sections/focus.ts:5` names the new path. `grep -rn focus-lanes src tests docs README.md config` finds no stale hit. The dependency on ruling 383 is Spec 2.
  - The `Collection.svelte:517` change from `.slot` to `[data-entry]` stays. On the base tree, `FoldRun.svelte:118` declares `.slot`, so `findPrimitiveStyling` (`boundaries.test.ts:631-648`) reports the base rule. `Reveal.svelte`'s only child is `EntryCard.svelte:257-258`, which carries both `class="slot"` and `data-entry`, so the new selector reaches the same element. It is in a file the step writes anyway.
- The builder's 13 decisions, judged:
  - Inside the brief or a ruling: 1 (what a hidden count counts), 3 (sections drawn while every row is hidden), 4 (a venue call line hidden with its hub, item 9 "every row that carries a hub"), 5 (funding schemes through their entry), 6 (pressed while something is hidden, item 8's words), 7 (waited-on projects named from the whole portfolio), 9 (the `group` argument of `onpick`, which comes with the `groups` item 4 asks for), 10 (the words of ruling 353, and removing `project.card.present`, which item 10 asks for), 11 (the focus moving into the list), 12 (the `[data-entry]` selector, above) and 13 (the BLOCKED and WAITING ON labels).
  - Decision 2 is a reading the ruling allows that differs from the boards' rule (Spec 3).
  - Decision 8 takes a change no item asks for (Spec 1).
  - None takes a choice reserved for Axel.
- Premise check of "What is on the tree": the line counts (473, 441, 223, 282, 505), `opening.ts:187-189`, `layout.svelte.ts:212/836`, `key-dom.ts:70` and `Projects.svelte:165/193/254` reproduce on the base copy. The `allow-styling.ts` entries cited `ProjectCard.svelte:392/399/403` on the base, while the rules stood at 425/432/436 (`git show 796273a8:...ProjectCard.svelte | grep -n :global`). So the brief's "those entries follow the card's lines" was already untrue on the base. The report does not say so (Proof 3).

## 2. Proof

- Proof 1. `.scratch/migration/agents/reviews/O77-report.md`, DONE / NOT DONE preamble: "run with `node` from the worktree: `/private/tmp/.../scratchpad/o77/cases.ts`, output in `cases.out` beside it". What is wrong: the rules file ("A case of the brief may be run by a case-run program ... has its source and its output quoted in the report") asks for the source and the output in the report. The report gives a path only, and C20's first run names a `c20.ts` with no path and no source. I read both from the scratchpad, and they reproduce. Failure scenario: once the session scratchpad is cleared, a reader of the report cannot rerun or check any of cases 11 to 20. Verdict: none.
- Proof 2. `<scratchpad>/o77/cases.ts:131` and `:147-149`: "held1.hubs.filter((one: string) => hubList(oneHub, 'hub-a').includes(one))" and "tasks.filter((entry: any) => !off.includes(entry.root))". What is wrong: the report's C18 and C19 rows for the collection view ("collection hubsOff with one hub ... []", "collection hub-b unpressed keeps: ["t1"]") come from a copy of `Collection.svelte:166` and `:174` written in the script. They do not run the view's rule. The script would print the same with the view's `.filter((entry) => !hubsOff.includes(rootOf(entry)))` taken out. Failure scenario: if Collection.svelte read `held.hubs` unfiltered, a workspace that drops to one hub would keep hiding entries, and the quoted run would still print `[]`. Verdict: case 19 partial; case 18's collection part rests on reading.
- Proof 3. `tests/checks/tree/allow-styling.ts:61-77` (five `why` strings, 399 to 478, 403 to 482, 392 to 471). What is wrong: the rules file asks for every edit to an allow list to be listed "with its before and after, made from a `diff` ... one row per changed line". The report has one sentence ("`allow-styling.ts` entries follow `ProjectCard.svelte:471`, `:478`, `:482`"), no rows, and does not say the base numbers were already wrong. I checked the edit by reading: only the `why` text changes and no `line` key changes, so nothing is exempted. Failure scenario: the orchestrator, reading the report alone, cannot tell whether an allow entry was added or widened. Verdict: none.

## 3. Standards

- Standards 1. `src/lib/state/workbench/layout/instance.ts:110-111`: " * field of `lists` that lists records (the cards whose description is drawn whole, the pillars a" / " * map draws),". What is wrong: the rules file ("A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short") is broken: a 14-column line sits inside the sentence. Failure scenario: the comment-width rule's reader meets a ragged paragraph and takes it for unfinished text. Verdict: none.
- Standards 2. `src/lib/views/shared/card/project/CardLinks.svelte:180`, "{#each drawn as tag (tag.id)}", fed by `waitedOn` (`waiting.ts:979-994`, one entry per value, no de-duplication); `normalise.ts:264` `waitingOn: strings(manifest['waiting-on'])` keeps repeats. What is wrong: the rules file asks for "Every id or key a step introduces is checked empty, duplicated ...". The WAITING ON tags key on the waited-on id, and the report states no such check. Svelte's `each_key_duplicate` (`node_modules/svelte/src/internal/client/errors.js:136-147`) throws in dev and in production. Failure scenario: a manifest with `waiting-on: [pirmani, pirmani]` makes the card throw on render, so that card, and with it the board or the project page, fails to draw. Before the step the value was joined into one string and drew. An empty value `waiting-on: [""]` draws an empty amber tag. Verdict: item 5 violated.
- Standards 3. `src/lib/state/sources/files.svelte.ts:1` and `:6`: "The files of one project folder, fetched when a card is opened and held" and "an opened card asks api/project-files for its own". What is wrong: the rules file says "A sentence in a document or a head comment that the change makes false is a defect of the change". No card opens any more; only the project page's card reads the folder. The brief listed `project-files.ts:1` for the same sentence, and the step reworded that one but not this one. Failure scenario: a maintainer looking for where a board card asks for its files looks for an open-card path that no longer exists. Verdict: none.
- Standards 4. Comments the step makes false:
  - `src/lib/views/boards/entry/Entry.svelte:374` "the whole tab follows the folder line, as the board does" and `src/lib/views/sources/doc/Doc.svelte:309` "the whole tab follows the folder line, as the boards do". The board card has no folder line now. The step reworded the same comment in `Project.svelte:229` and `Projects.svelte:441-442` but not these two.
  - `src/lib/views/boards/focus/Focus.svelte:20-22`, "the markup is six partials under views/boards/focus/". FocusFilter.svelte is a seventh, and the arithmetic list there omits `state/boards/focus/filter.ts`.
  - What is wrong: the same rules file rule as Standards 3. Failure scenario: a reader of the Focus head comment counts six partials and misses the Filter action's file. Verdict: none.
- Standards 5. `docs/HELP.md:197`: "open the project page beside the board, as a preview tab of the pane next to the board, or of a new pane split right of it when no pane is beside it". What is wrong: `landingFor` (`landing.ts:57-97`) takes, in order:
  - on a workbench, its documents pane;
  - the pane of the newest received tab;
  - an empty pane anywhere;
  - a pane holding no tool view anywhere;
  - only then a split.
  A pane beside the board that holds a tool view (Files, Terminal) is never taken. Failure scenario: with the layout [Board | Files], a reader expects the page in the Files pane next to the board; a new pane is split instead. With [Editor | Board], the page lands in the editor pane on the left, and on a workbench page in its documents pane. Verdict: none.
- Standards 6. The report's rule-required parts that are missing:
  - No grep of the added comments for the history words. My grep finds only "before" in a place or order sense and "still" meaning "even so" (MenuList.svelte:27, menu-items.ts:91, Band.svelte:12, LaneHead.svelte:4, LaneHead.svelte:34, filter.ts:192), so nothing to fix.
  - No "still true / rewritten" list for the head and doc comments of the functions touched.
  - No grep for existing helpers before writing `hubList`, `waitedOn`, `tierWords` and `toggled`.
  - No line saying the step adds or changes no test.
  - `git grep` was run for check 4, a git command the rules file's "Where you work" section does not allow, though the brief's check 4 named it. The disagreement was not reported.
  - The duplication the reuse grep would have caught: `HubChips.svelte:35-37` `toggle` repeats `toggled` (`filter.ts:69-71`), which the same step added.
  - What is wrong: the rules file's "What every package obeys" and "The principles every package is judged on" ask for each of these. Failure scenario: the review cannot see from the report that the comments and the helper names were checked, and the two copies of the toggle rule can drift. Verdict: none.

## 4. Behaviour

- Behaviour 1. `src/lib/state/workbench/layout/open/opening.ts:375-389` (in `openOpened`, `previewIn(paneAt(tree, landing.path))`), reached from `ProjectCard.svelte:304`. What is wrong: the report's "The page beside" says "a second project from the board replaces it in that tab". It does not say that the preview tab of any other view in the landing pane is replaced too. Failure scenario: a single click on a file in Files opens it as a preview tab in the editor pane beside the board. A press on a card's title then turns that file's tab into the project page, and the file preview is gone. On a workbench page the documents pane's preview tab is taken the same way. Before, the title opened the page as a tab of the board's own pane and touched no other tab. Verdict: none.
- Behaviour 2. `src/lib/views/boards/focus/CommandCenter.svelte:47-56` (`attention(snapshot, ...)` over `page.snapshot`) and `filter.ts:343` (venue load). What is wrong: the report does not state that Focus's venue-load warning and the Awaiting box counts are now taken over the projects the filter keeps. Nor does it state that a Focus tab with no saved filter now starts with Mine only applied. Failure scenario: a venue with 5 live projects, 2 of which name people but not you, and a warning of 4. Before, Focus drew the "BSPC: 5" warning row. After, a fresh Focus tab hides the two, the venue counts 3, the warning row is gone and "1 hidden" shows. The Projects board's Venue mark, counted before any filter, still warns. The look on TEST should name what a fresh Focus tab hides there. Verdict: none.
- Behaviour 3. `src/lib/views/boards/project/Project.svelte:135-141` with `card-menu.ts:24`. What is wrong: the report's "Project page" lines say only "no Open project page action". Before, the project page's card showed every icon under the pointer (pin, copy, ask, folder, files, workbench, present, subtask/follow-up where none, edit, deposit, clone). After, it shows Ask and Open Workbench only, and Edit Manifest, Deposit, Pin and the rest move into "...". Failure scenario: the look on landing checks the page's strip against the report, finds two icons, and cannot tell whether that was meant. Verdict: none.
- Behaviour 4. `src/lib/views/shared/card/project/ProjectCard.svelte:366-371` (`<ContextMenu ... own>` around the whole card). What is wrong: the report says "Before, there was no right-click menu on the card". It does not say what the right-click no longer gives. Text boxes keep their own menu (`TextBoxMenu.svelte`, `own`), but a link or selected text on the card now opens the project menu and not the browser's. Failure scenario: a reader selects a sentence of the ELI5 or right-clicks a web address in its links to copy it. They get Open / Add / Ask ... and no Copy or "Copy link address". On the project page this covers the FILES finder and the subtask rows too. Verdict: none.
- Behaviour 5. `src/lib/views/shared/card/project/ProjectCard.svelte:468-471` (`{#if addingSubtask} {@render subtasks()}`). What is wrong: the report's C3 row says "the forms drawn on a board card while adding". `Subtasks.svelte` draws its whole block: the open count, every row with its buttons, then the form. Failure scenario: on a board card of a project with eight subtasks, Add Subtask grows the card by eight rows and the form, where the look expects a one-line form. Verdict: none.

## Declined to judge

- Everything a page shows (cases 1 to 10, 17, 19 and 21 by the look; the menus' rules, the pressed Filter button, the two columns at about 420 px, Shift+F10 on the card): no browser is used in this review.
- Whether `tests/checks/tree/duplication.test.ts`'s Collection/Projects clone is red on the base tree. The base copy holds no `node_modules`, so the test cannot run there. The builder's jscpd output over the base copy (`o77/jscpd-base-markup/jscpd-report.json`) lists `Collection.svelte 421` and `Projects.svelte 361`, 10 lines, which is consistent with the claim. Whether the clone is ended in this step, since both files are the step's, or placed elsewhere is the orchestrator's call. The same holds for the comment-width reds in six files that are not in git status.
- The cost of `focusPage`, which builds the ticker, the awaiting box, the band and the lanes up to three times (whole, rest, with Mine only) on every snapshot change and every minute tick, where the base built each once. The brief lists no benchmark, so it was not measured.
- A workspace with no primary hub and several hubs, where a project of a non-hub folder carries the folder's own name as `root` (`hub-names.ts:12-13`). Not run.
- Ruling 383 (the band's countdown) belongs to repair round 1 and is not judged here.
- Whether the report's open-items section matches the main checkout: both state files' open-items lists are empty (`grep -n "^## Open items" -A6` on each), so nothing to judge.

Reviewer usage: a88a9c6ce833fcaca, claude-opus-5-5, 355179 tokens, 92 tool uses, 17 min 7 s.

## Repair round 1, refuted

Worktree `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O77`, base `796273a8`. The round's delta is built from `migration-O77-round-1/files.txt` (55 paths) plus the 19 paths changed since that list was written. 17 of those 19 are source files. The other two are the untracked ledger copies `.scratch/migration/agents/briefs/O77-round1.md` (the same as main's copy, `diff` printed nothing) and the report.

```
$ PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npm run diagrams && npm run test:quick   (worktree root)
diagrams-exit 0
ok      prettier (1.9 s): All matched files use Prettier code style!
ok      ASCII gate (2.1 s)
ok      svelte-kit sync (12.3 s)
ok      vitest slow (39.1 s): Duration  26.84s (transform 11.95s, setup 0ms, import 37.82s, tests 29.98s, environment 1ms)
ok      eslint (54.2 s)
ok      svelte-check (60.2 s): 1792960070463 COMPLETED 544 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (64.1 s): Duration  52.36s (transform 136.05s, setup 0ms, import 166.02s, tests 23.67s, environment 1.25s)
ok      vitest checks (74.8 s): Duration  63.09s (transform 63.10s, setup 0ms, import 146.57s, tests 78.17s, environment 1ms)
test:quick: 87.4 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
(git status --short before and after the run: diff printed nothing; npm run diagrams changed nothing)

$ npx vitest run tests/state/boards/board/board-rules.test.ts tests/state/boards/board/hub-facets.test.ts tests/checks/tree/duplication.test.ts tests/checks/source/comment-width.test.ts tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts tests/checks/source/keys.test.ts
 Test Files  7 passed (7)
      Tests  136 passed (136)

$ sh utils/unused-exports.sh > <scratch>/r1rev-unused.txt; diff .agents/worktrees/O77-base/unused-exports.txt <scratch>/r1rev-unused.txt
129c129
< src/lib/state/boards/focus-lanes.ts: entryDeadline
---
> src/lib/state/boards/focus/focus-lanes.ts: entryDeadline
283c283
< src/lib/state/boards/board/index.ts: BoardColumn, FacetValue, LabelMode, SessionsOf, VenueCount, WaitingLine
---
> src/lib/state/boards/board/index.ts: BoardColumn, FacetValue, LabelMode, SessionsOf, VenueCount
(no new unused export)

$ grep -rn --exclude=local.yml "expanded\|toggleCard\|waitingLine\|under_review_at\|under_review_unset\|helper.waiting_on\|toggle_tip" src config/text docs README.md | grep -v "^docs/diagrams/" | wc -l
184
$ grep -rn --exclude=local.yml "toggleCard\|waitingLine\|under_review_at\|under_review_unset\|helper.waiting_on\|toggle_tip" src config/text docs README.md tests | grep -v "^docs/diagrams/"
(nothing)
(every remaining hit is "expanded" in another sense: ui/tree, ToolButton, explorer, `~` expanded in a path, CardLinks.svelte:135-179 and card.ts:68-70 tag kinds drawn whole, Customizations.svelte, composer.ts, opening.ts folded panes)

$ the ASCII gate of agents/spec.md (perl form) over the 74 files of git status --short (the focus/ folder expanded, the report included)
perl-exit 0, nothing printed

Commands the report quotes as evidence:

$ node <scratchpad>/o77/r1.ts; node <scratchpad>/o77/cases.ts; node <scratchpad>/o77/c20.ts   (from the worktree)
r1 exit 0, r1 SAME; cases exit 0, cases SAME; c20 exit 0, c20 SAME   (diff against the builder's .out files printed nothing)
(the sources and outputs quoted in O77-report.md lines 218-341, 347-363, 373-526, 532-571, 577-579 equal the files: diff printed nothing for each)
e.g. funding stage Submitted: ["f-submitted-c@hub-c deadline=2026-09-01","f-submitted@hub-a deadline=(none)"]
     applications: ["a-active-a@hub-a deadline=2026-12-01","a-active-b@hub-b deadline=(none)"]
     Personal unticked, Mine only on: {"lanes":{"run":["p-mine"]},"mineHides":true,"hides":true,...}
     mine on, every project yours: {...,"mineHides":false,"hides":false,...}
     [pirmani, pirmani]: [{"id":"pirmani","label":"Pirmani","kind":"person"}]
     collection keptByHub, hub-b unpressed: ["t1"]

$ git diff 796273a8 -- src/lib/state/workbench/layout/open/opening.ts
two hunks, the openBeside type (@@ -74,9 +74,15 @@) and its function (@@ -183,9 +189,17 @@), identical to the report's quote

$ npx vitest run tests/checks/source/comment-width.test.ts      (passes; also inside the 7-file run)
$ sh utils/folder-check.sh                                       exit 0, no output
$ awk 'NR>=106 && NR<=113 {print NR": "length}' instance.ts      109: 99, 110: 97, 111: 99, 112: 63 (as reported)
$ diff <(git show 796273a8:tests/checks/tree/allow-styling.ts) tests/checks/tree/allow-styling.ts
five `why` lines 61, 65, 69, 73, 77: 399->490, 403->494, 399->490, 392->483, 403->494; no `line` key changed
$ grep -n ":global(.card" ProjectCard.svelte                      483, 490, 494; on the base (git show): 425, 432, 436
$ word-sequence compare of the removed and added comment lines of the six item-13 files   same-words for all six
```

### Verdicts

Items of the brief's "What to build", over the whole diff since the base:

- 1: holds. The c20.ts rerun reads `expanded: [...]` with no `expanded` and no error. `instance.ts:108-113` is now one paragraph.
- 2: holds. `openBeside` passes `preview` only, and `openInto` is back to its base text (the git diff quoted above). HELP's landing sentence now follows `landingFor` (`landing.ts:72-96`). Its wording is Standards R2.
- 3: holds. On a board, Add Subtask and Add Follow-up draw the form alone (`formOnly={!page}`, `ProjectCard.svelte:360`, `:371`).
- 4: holds, except for links and selections. Round item 5 now takes a right-click on a link or a selection away from the card's menu; see Spec R1.
- 5: holds. The repeated-key crash (refutation Standards 2) is ended by `waitedOn` (`waiting.ts:45`, r1 run). The keyed each is `CardLinks.svelte:182` `(tag.id)` over the values that `waitedOn` has de-duplicated.
- 6: holds.
- 7: holds.
- 8: holds. Mine only is now measured on the whole page (round item 2).
- 9: holds. The collection view's rule is `keptByHub` (`collection.ts:466`).
- 10: holds for the keys and for HELP's items 1 to 9. HELP gained no sentence for round item 5's change (Standards R1).
- 11: holds. `ProjectCard.svelte` is 519 lines, `Collection.svelte` 513, `filter.ts` 495 (`wc -l`), and the size test passes. The allow-styling entries cite 483, 490 and 494, where the rules now stand.

Cases of the brief's "Cases":

- 1: met by reading. The look on landing is still to come.
- 2: met by reading `openInto`, `openOpened` and `landingFor`. The look is still to come.
- 3: met by reading. The form is now drawn alone on a board card (`Subtasks.svelte:78`, `:132`, `:135`; `ListHead.svelte:49`, `:66`).
- 4: met by reading.
- 5: met by reading for a right-click on the card away from links and selections. Shift+F10 waits on the look. Where `leftToBrowser` now leaves the right-click to the browser, see Behaviour R1.
- 6: met by reading. `CardActions.svelte` is unchanged, and the only `ContextMenu.svelte` change is the optional `groups`.
- 7: met by reading and by the r1 `waitedOn` run (a repeated value and an empty value each give one tag). The scratch-server look is still to come.
- 8: met by reading.
- 9: met by reading.
- 10: not verifiable here. The look at a wide pane and at about 420 px would settle it.
- 11: met. The cases.ts rerun is unchanged (`["Supervisor","Personal","BSPC"]`, `[]`, `["Personal","BSPC"]`).
- 12: met (cases.ts rerun: `command:1, awaiting:1, push:1`).
- 13: met (rerun).
- 14: met (rerun).
- 15: met (cases.ts and r1 reruns: `"mineHides":false`).
- 16: met (rerun).
- 17: met by run and by reading. The look is still to come.
- 18: met. The collection part now runs `keptByHub`: `["t1","e1"]` with one hub.
- 19: met. `keptByHub` with hub-b unpressed gives `["t1"]`, and `Collection.svelte:171` calls the same function.
- 20: met (reruns).
- 21: met by reading. The look is still to come.
- 22: met. Both files pass and neither is in git status.

Items of the round brief:

- 1: holds. `focus-lanes.ts:153-168` and `:193`, called in all three columns (`:202`, `:209`, `:214`). The r1 run reproduces, and the HELP Focus bullet gained the line. What the look should see is Behaviour R3.
- 2: holds. `focusPage` (`filter.ts:478`, `:479`, `:481`, `:491`) runs `ticker` once when the choice hides nothing (the branch at `:481` returns `whole`) and twice when it hides something. The r1 run reproduces both of the brief's cases. By reading, `mineWouldHide` (`:406-462`) covers every record the sections draw. This holds because `waiting()` counts lane projects only (`focus.ts:500-502`), and the ticker targets carry the bare collection key and the entry's `root` (`ticker.ts:275`, `:374`, `:397`, `:459`; `rootMark`, `ticker-lines.ts:95-98`).
- 3: holds (the git diff quoted above).
- 4: holds (r1 run; `CardLinks.svelte:85`, `:182`).
- 5: violated. Spec R1, Standards R1, Behaviour R1, Behaviour R2.
- 6: holds. One prop, `formOnly`, on each block. The page branch passes `false`, and `EntryCard.svelte` is untouched.
- 7: holds. Each clause of the sentence matches `landing.ts:43-96`. Its wording is Standards R2.
- 8: holds (awk line lengths above).
- 9: holds. `files.svelte.ts:1-7`, `Entry.svelte:374`, `Doc.svelte:309` and `Focus.svelte:20-28` are reworded, and the Focus head comment counts the seven `.svelte` imports at `:45-51`. Slides, Audit and History are judged under Spec.
- 10: holds as written. Judged under Standards R3.
- 11: holds (cases.ts calls `keptByHub`; run reproduced).
- 12: holds (duplication.test.ts passes). The 8 px gap is Spec R2.
- 13: holds (comment-width.test.ts passes; no word changed in any of the six files).
- 14: holds. Every listed part is in the report: the sources and outputs, the allow-styling rows, the history-word grep, the still-true list, the helper greps, the no-test line, the git grep note and the three look entries.

### Findings

**Spec**

- Spec R1. `src/lib/views/shared/card/project/card-menu.ts:73-87` with `ProjectCard.svelte:384-388`:

  ```
  "if ((link !== null && card.contains(link)) || selected) event.stopPropagation();"
  "oncontextmenu={leftToBrowser}"
  ```

  What is wrong: round item 5 rests on a premise that does not hold, and the change clashes with an established rule without raising the clash.
  - The premise: a right-click on a link or a selection "keeps the browser's menu, so Copy and Copy link address stay". On the base tree there was no browser menu on a project card to keep. Nothing on the card's path held a right-click menu: `git show 796273a8:` of ProjectCard, Projects, Project, Card, CardBrief and CardLinks each count 0 `contextmenu`, and `PaneBody.svelte:337` wraps an empty pane only. So the page-wide guard (`routes/+page.svelte:291-296`, `context-guard.ts:20-25` `shouldCancel`) cancelled the browser's menu. A link or a selection is not in `KEEPS` (`context-guard.ts:13`, `'input, textarea, [contenteditable], .monaco-editor, [data-terminal]'`).
  - The clash: `context-guard.ts:2-4` says the page cancels the browser's menu everywhere a right-click has no oculus menu "so the browser's Back, Reload and Inspect never appear over the page's chrome". `leftToBrowser` stops the event at the slot. Delegated `contextmenu` (Svelte `render.js:231-237`; bits-ui's trigger handler is a spread prop, so it is delegated too) then never reaches the document listener. The browser's whole menu is let onto the card by a second mechanism beside `KEEPS`.
  - The builder's open item raises the desktop half only. It says "That holds in a browser tab", which repeats the false premise.

  Failure scenario: in a browser tab, a right-click on a card's web address shows Back, Reload and Inspect over the board. That is the menu the page rule exists to keep away, and neither the base nor the first build ever showed it. Axel would choose among the builder's options (a) to (c) on the belief that the browser's Copy was there before.

  Verdict: round item 5 violated.

- Spec R2. `src/lib/views/shared/writes/SaidBody.svelte:41-42`, `".said { margin: 0 0 8px;"`, which replaces `Collection.svelte`'s own `margin: 0 0 6px` (base, `git show 796273a8:...Collection.svelte`, line 482). What is wrong: Z1007 rules the two copies ended "the effect is internal only". The merged partial changes the collection view's gap under the said line from 6 px to 8 px. The report lists this under the look, but not as a decision the orchestrator may reverse (spec.md, "No silent design decisions"). Failure scenario: the look at landing reads Z1007 as "nothing visible changes" and passes over the 2 px move, or takes it for a regression. Verdict: none; round item 12 holds.

- The files changed beyond the round's path list, each judged:
  - `Slides.svelte:433`, `Audit.svelte:351`, `History.svelte:483`: these held the same false sentence as item 9 ("follows the folder line"), now "the card's folder name". The folder name is the card's monospace text (`CardFacts.svelte:116-125`). They stay, under spec.md "A sentence ... that the change makes false is a defect of the change".
  - `FocusFilter.svelte`, `HubChips.svelte`: item 10's import changes. They stay.
  - `collection.ts` (`keptByHub`): item 11 asks for a function in `src/lib/state/`. It stays.
  - `ThemeFacets.svelte`: the existing partial of item 12's Data/Venues job (`grep -rn ThemeFacets src`: drawn by Data and Venues only). It now calls `toggledThemes` and hands `onchange(off)`, with no visible change. It stays.
  - `tests/checks/tree/allow-styling.ts`: Proof R1.

**Proof**

- Proof R1. `tests/checks/tree/allow-styling.ts:61`, `:65`, `:69`, `:73`, `:77` (an allow-list edit, listed as required). In the round, the five `why` strings change from 478/482/478/471/482 to 490/494/490/483/494 (round delta). Since the base they change from 399/403/399/392/403 (diff above). No `line` key changes, so no rule is exempted or widened, and the cited lines are where the rules stand (`grep -n ":global(.card"`: 483, 490, 494). The report gives the rows from the diff and says the base numbers were already wrong (425/432/436 on the base). Judged, with no defect. Failure scenario: none. Verdict: none.

- No other claim of the round's report fails to reproduce. Every run and grep it quotes gives what it says (verification block). The one exception is its sentence about the browser's menu in item 5, which is Spec R1.

**Standards**

- Standards R1. Sentences that item 5 makes false or leaves short:
  - `src/lib/shell/context-guard.ts:2-6`: "The page cancels the browser's own context menu everywhere a right-click has no menu of oculus's ... It leaves the browser's menu where that menu is the control's own: a text input, a textarea, a contenteditable element ..., the code editor ..., and the terminal grid".
  - `card-menu.ts:66-68`: "so Copy and Copy link address stay".
  - `ProjectCard.svelte:19-20`: "but on a link or a text selection, which keep the browser's menu".
  - `docs/HELP.md:289`: "Its menu, and the menu a right-click or Shift+F10 opens on the card, lists every action".

  What is wrong: spec.md, "What every package obeys", says a sentence in a document or a head comment that the change makes false is a defect of the change, and a step writes what a user does into `docs/HELP.md`. The guard's head comment no longer lists every place the browser's menu stays. "Stay" and "keep" claim a menu that never existed (Spec R1). HELP says nothing about a right-click on a link or a selection. Failure scenario: a maintainer reads `context-guard.ts` as the whole right-click rule, adds a menu to the card's text, and never learns that a card handler takes the event before the guard. A reader right-clicks a link expecting the card's menu as HELP says. Verdict: round item 5 violated.

- Standards R2. `docs/HELP.md:289`: "The page lands in the first of these that the page has: on a workbench, its documents pane; the pane holding the newest page or document opened on the page, while it is still there;". What is wrong: "page" names the project page and the oculus page within one sentence, three times (spec.md, Prose: plain, name the actual thing). Failure scenario: a reader takes "that the page has" and "opened on the page" for the project page, and cannot tell which panes the list ranges over. Verdict: none.

- Standards R3. `HubChips.svelte:11` and `FocusFilter.svelte:25`, `"import { toggled } from '$lib/state/sessions/folds';"`. What is wrong: round item 10 is met to the letter (one existing helper reused, quoted grep). Its home is the session views' module, whose head comment (`folds.ts:1-6`) names only session folds, so the Focus filter and the collection Hub chips now import session state for a generic list toggle (spec.md, "The principles every package is judged on", low coupling). In the same round, `ThemeFacets.svelte:33` calls `toggledThemes` (`themes.ts:101`), the same rule written again. The report's grep also lists `latex/opened.ts:5`, and `grep -rn "export function toggled" src` adds `groups.ts:479`. So the "one toggle rule" of item 10's title holds for two callers only. Failure scenario: a change to how a checklist toggles is made in `folds.ts` for the session list and reaches the Focus filter and the collection chips unasked, while Data and Venues keep the other copy. Verdict: none.

**Behaviour**

- Behaviour R1. `card-menu.ts:80-84`:

  ```
  "const selected = selection !== null && !selection.isCollapsed && card.contains(selection.anchorNode) && selection.containsNode(target, true);"
  ```

  What is wrong: `containsNode(node, true)` is true for any node the selection's range intersects, an ancestor of the selection included. So the rule is not "the pointer inside a text selection". Failure scenario: select a word of the ELI5, then right-click the card's blank area inside the element that holds the ELI5 paragraph (the card's body box). In a browser that gives the browser's menu, and in the desktop app nothing, where the card's menu was asked for. Verdict: round item 5 violated.

- Behaviour R2. `O77-report.md`, "What the look on landing should see": "A right-click on a link or inside a text selection of a project card in a browser tab: the browser's menu (Copy, Copy link address); elsewhere on the card the card's menu. In the desktop app the same right-click opens no menu". What is wrong: the bullet gives no before. Read from `context-guard.ts`, `+page.svelte:291-296` and the base files counted in Spec R1, a right-click on a link and on a selection in a project card behaves like this:

  | When | Browser tab | Desktop app (`npm run app`) |
  |---|---|---|
  | Base tree, before the step | No menu: the guard cancels the browser's menu | No menu: the guard cancels, and no `context-menu` handler is in `src/desktop` (`grep -rn "context-menu" src/desktop`: only the comment at `preload.cjs:9`) |
  | First build | The card's menu | The card's menu |
  | Now | The browser's whole menu: Copy and Copy Link Address, with Back, Reload, Inspect and the rest | No menu, as on the base |

  Failure scenario: the look checks Copy on a link and passes it as kept, when it is a menu the page never drew before. Verdict: round item 5 violated.

- Behaviour R3. `focus-lanes.ts:162-164` under the shipped words. `config/defaults/behavior.yml:73` `education_open: [ongoing]` and `config/catalogs/vocab.yml:136` `ongoing: { ..., closes_deadline: true, ... }`. The Submitted funding stage holds `submitted, under-review` (`vocab.yml:187`), both `deadline_met`. What is wrong: the look line gives the rule ("a card whose status is `submitted` or `under-review`, or carries `closes_deadline` ... shows no countdown and sorts as an undated card"). It does not say what that draws on oculus's own words:
  - every Teaching card loses its countdown, since the column takes `ongoing` entries alone;
  - every card under Funding's Submitted stage loses its countdown;
  - those cards now sort after the dated ones, by title (`bandOrder`, `:144-151`);
  - Positions (`applications_open: [active]`, no flag) and In prep and Planned keep theirs.

  This is what ruling 383 (a) asks for. Failure scenario: the look on TEST finds a Teaching column with no countdown at all and cannot tell whether that was meant. Verdict: none; round item 1 holds.

### Declined to judge

- What a page shows: cases 1 to 10, 17, 19 and 21, the form alone on a board card, the band without its countdown, the 8 px gap, and the right-click on a link or a selection in each host. No browser is used in this review. The two-host table in Behaviour R2 is from reading only. A right-click on a card's web address and on a selected ELI5 sentence, on TEST and in `npm run app`, would settle it.
- Round item 5's outcome is Axel's call. The builder's options (a) to (c) were written on the premise that a browser menu was kept, and Spec R1 shows it was not. One more option exists, beside them: drop `leftToBrowser` and keep the first build's card menu everywhere on the card. In neither host does that lose a menu the base had. Choosing among these is Axel's. Whether a link or a selection on a card should have Copy at all is a user-visible shape nothing names yet.
- Whether Axel meant ruling 383 to clear every Teaching countdown under the shipped words (Behaviour R3): his call. The code does what the ruling says.
- `mineWouldHide`'s record classes other than lane projects (ticker lines of entries and schemes, band cards, Awaiting grants and applications) were checked by reading only. The round brief named two cases, and neither run reaches them. A case-run over a snapshot where only a role-field collection entry or a funding scheme of others is drawn would settle it. I wrote no program, since this review edits no file.
- Ending the other copies of the toggle rule (`toggledThemes`, `latex/opened.ts`, `groups.ts`): outside this round's paths; the orchestrator's call whether to book it.
- The cost of `focusPage` and of the two `Subtasks`/`Followups` components now mounted on every board card: not measured, since no benchmark is run.
- Any fact only another git command would give: none was needed.

Reviewer usage: a386cef4a5e53c123, claude-opus-5-5, 301674 tokens, 70 tool uses, 13 min 56 s.
