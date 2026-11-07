# Brief check: O167, the shell's controls hold one behaviour, at main 56a1fff1ec37a6087f12a257198942226d364912

Before the numbered checks, the three findings that most change what the builder would do:
- F3.10: item 7 as written would drop every hub repository from quick open.
- F4.1: most cases the brief calls "a test" have no entry in `agents/guarded.md`. Under the rules file the builder must stop on each of them.
- F3.1 and F5.16: items 1 and 16 can pass without reaching the step line's goal.

## 1. Names

F1.1 `views.listing` (item 4). Command: `git grep -n "views\.listing\b\|'views.listing'\|listing: Projects" -- src tests config docs README.md ':!config/local.yml'`. It finds only paths in the write list: `config/text/views/boards/project.yml:193` and `Listing.svelte:7,81`. A second grep finds a hit outside the write list. `sed -n 1,40p docs/palette.md` prints line 26, `| Projects | listing |`. That page is generated: `utils/diagrams/palette.mjs:31` has `export const PAGE = 'docs/palette.md'`, and `tests/checks/diagrams/palette.test.ts` checks it. The label change makes the line false, and `npm run docs:palette` (`package.json:24`) rewrites it. The write list omits `docs/palette.md`.

F1.2 The generated diagrams. Item 6 adds imports (a removed-record store read by lists), and so do item 5 (`focusQuietly` in `FocusFilter` and `PickMenu`) and others. `npm run diagrams` runs before each verify list, and an import change across folders rewrites `docs/diagrams/*.dot` and `*.svg`. Command: `grep -n 'docs/diagrams\|palette.md' agents/briefs/O16*.md`. The write lists of O161, O164 and O166 carry "the generated diagrams `docs/diagrams/*.dot` and `*.svg` if `npm run diagrams` changes them" (`O166.md:104`). O167's write list does not.

F1.3 `groupGlyph` (item 1). Command: `git grep -n 'groupGlyph' -- src tests docs README.md`. It has a second caller outside the write list: `src/lib/views/system/workbench/Catalogue.svelte:259 glyph={groupGlyph(section)}` (the Views view). If the builder changes `groupGlyph` in `catalogue.ts`, the Views view's headings change too, against item 1's "group_glyph stays ... everywhere else it is read". The brief never names this caller.

F1.4 `group_glyph` text that describes the heading glyph. Command: `git grep -c 'group_glyph' -- . ':!config/local.yml' ':!.scratch'`. Outside the write list it lists `config/options/layout.yml:27-29` (help: "the glyph of the page's group heading in the view catalogue, one that no view of the group carries"), `src/lib/data/sources/config/rail.ts:14-18`, `config/text/views/system/workbench.yml:142-147` and `config/text/findings.yml:63`. These stay true as long as only the submenu changes. The options help does not mention the submenu.

F1.5 `present.counter` (item 19 writes `present.yml:25`). Command: `git grep -l -E "present.counter"`. It finds `src/lib/views/academic/present/presenter/Presenter.svelte:85`, outside the write list, which draws the same counter. Any change to the key's text reaches the presenter screen. The presenter can also read "0 / 0" while a deck loads, and the brief does not mention it.

F1.6 `row-reverse` (item 3). Command: `git grep -l row-reverse`. In this step's scope the only hit is `StatusBar.svelte`. Its CSS comment at `StatusBar.svelte:409-412` ("its markup written reversed (flex-direction: row-reverse draws the first item at the right)") becomes false. The brief names only the comment at `:38-40`.

F1.7 Five catalogue keys whose text changes (`filter_tip`, `field_find*`, `settings_origin_*`, `settings_refused`, `settings_scope_saved`). Command: `git grep -l -E "<key>" -- src tests config docs README.md`. No hit lies outside the write list, apart from the readers `origins.ts`, `Origins.svelte` and `messages.ts`, whose code does not change.

## 2. The step line

The step line is `plan.md:1724`. Each of its parts maps to an item: Open View to 1, "this is me" to 2, the status bar to 3, "Projects" to 4, the tips to 5, removed rows to 6, quick open to 7, the Settings search to 8, Save and Save All to 9, a refused value to 10, the unsaved count to 11, emptying a row with no key to 12, Cmd+S to 13, card actions to 14, pane halving to 15, "#" to 16, Present at text size 1.5 to 17, the Find form to 18, and the counter to 19. No part is left without a requirement. Three parts are narrowed or widened:

F2.1 "a removed or deleted row leaves the list at once" is cut down to three kinds: a collection entry, a bookmark and a schedule. The brief gives no reading that these are the only rows the looks saw, or the only remove paths that wait for a re-read.

F2.2 Item 11 goes further than the line. The line asks that a refused or empty value leave no dot or count while the header says "No unsaved change". Item 11 also makes the header count valid typed text that has not been sent yet. That changes what the header means, and Decisions does not list it.

F2.3 The ruling line is at `plan.md:3647`, not 3646. Command: `grep -n '^- Look flaws' plan.md` prints `3647:- Look flaws (2026-11-07): ...`.

## 3. Premises

Each line reference was printed with `awk 'NR>=a&&NR<=b'` on the named file. Every reference matches the tree except those listed below. That includes the line given for the ruling: the brief says 3646, `grep -n` prints 3647.

F3.1 Premise 1 lists five rail entries whose glyph differs from `group_glyph`. There are six. `config/defaults/layout.yml:10` reads `{ label: "Focus", glyph: compass, page: focus, chord: f, group_glyph: focus }`. Item 1 ("each rail page's group with the rail button's own glyph") therefore also changes the Focus heading from `focus` to `compass`, which C1 and the step line do not name.

F3.2 Premise 1 leaves out why the two glyphs differ. Command: `bash -c 'for g in pillar venue poster question sliders compass; do git grep -nE "glyph: ?[\x27\"]?${g}..." ...'`. Each rail glyph is the glyph of a view inside its own group:
- `pillars.yml:23 pillars_glyph: pillar`, with `Pillars.svelte:8 group: 'pillars'`
- `venues.yml:87 venues_glyph: venue`, with `Venues.svelte:8 group: 'registries'`
- `present.yml:152 present_glyph: poster`, with `Present.svelte:9 group: 'present'`
- `help.yml:57 help_glyph: question`, with `Help.svelte:12 group: 'help'`
- `workbench.yml:9 settings_glyph: sliders`
- `focus.yml:147 focus_glyph: compass`

After item 1, each submenu heading carries the same glyph as one of its entries. `layout.yml:8` gives exactly that as the reason `group_glyph` exists: "so the heading does not read as one of its entries". Item 1 also says the comment is "made true of the submenu". Both cannot hold at once. This is a clash between the look flaw and a documented design rule, and it is for the orchestrator to raise. It is not a builder's choice.

F3.3 Premise 2's cause does not reproduce by reading. `ToolButton.svelte:207-209` `.tool:hover:not(:disabled) { border-color: var(--accent); }` and `:434-438` `.tool.active { border-color: var(--accent); background: var(--accent); ... }` set the same border colour. The hover rule sets nothing else, so an active button under the pointer computes the same border and ground with or without the hover rule. C2 ("on the unchanged tree the hover rule applies over the active one") therefore cannot fail on the unchanged tree. Other possible sources are not ruled out: the tooltip (`Person.svelte:217 title={selfTip}`), or the time between the press and `isSelf` turning true (`Person.svelte:167`).

F3.4 Premise 3 says the rule is at `StatusBar.svelte:419-421`. The `.group[data-status-group='right']` rule is at 420-423. The comments at `:34-35` and `:381-383` already say a focused item is scrolled into view, and an `overflow-x: auto` box is a scroll container that the browser scrolls on focus. "No code scrolls a focused item" is true. Whether that is the cause of the look flaw is not shown.

F3.5 Premise 5 says `focus.yml:100` should begin with a capital "as every other tip there does". That is false. Command: `grep -n '_tip:' config/text/views/boards/focus.yml` prints `128: remove_followup_tip: delete the note` and `129: remove_task_tip: delete this entry; asks first`. Both begin in lower case. Across `config/text`, 63 `_tip:` lines begin lower case and 53 upper case (`git grep -nE '_tip: [a-z]' -- config/text | wc -l`).

F3.6 Premise 6. `src/lib/state/sources/fs.svelte.ts` is 898 lines long (`wc -l`), and `utils/size-allow.txt` holds no allow line. The rules file's limit is 880, and the size check refuses 900 (`tests/checks/tree/size.test.ts:28`). Any line the step adds there needs a split by concern into new files, and those are outside the write list. Two more files are close to their limits: `writes.svelte.ts` at 870 of 880, and `ToolButton.svelte` at 518 of a 520-line component limit.

F3.7 Premise 6 says the removed records are "read by the same lists". `settled.svelte.ts` is imported only by `context.ts`, `client-state.ts`, `writes.svelte.ts`, `Editor.svelte`, `editor-target.ts` and `Entry.svelte` (`git grep -ln "forms/settled" -- src`). Its readers are entry and project pages (`page-entry.ts:305,339,421,432`, `editor-target.ts:115`). The bookmark list (`fs.svelte.ts`, re-read through `invalidate()` at `:747-749`) and the schedule rows (`schedule.svelte.ts:421-423`, from the server's payload) read nothing from `settled`. So "read by the same lists" is false for two of the three kinds. The mechanism the brief prescribes does not fit them.

F3.8 Premise 10 says `workbench.yml:270-278` holds five messages without a full stop. Command: `grep -nE '^\s+settings_[a-z_]+: ' config/text/views/system/workbench.yml | grep -vE "[.?!]['\"]?$"`. Inside 270-278, lines 273 (`settings_origin_skipped`) and 274 (`settings_origin_unread`) also lack one. Outside that range, these Settings messages lack one as well:
- `settings_failed` (203), `settings_wallpaper_failed` (205), `settings_list_failed` (231) and `settings_hub_failed` (247)
- `settings_origin_also` (264), `_field` (265), `_key` (266), `_language` (267), `_map` (268) and `_none` (269)
- `settings_unparsed` (286) and `settings_unreadable` (287)

The `settings_origin_*` lines are fragments put into `{2}` of `settings_origin_skipped` and `settings_origin_unread` (`origins.ts:36-60,87,104`). The brief's five give a full stop to `_repeat`, `_unnamed` and `_value` and leave `_key`, `_language`, `_field` and `_map`, from the same `switch`, without one. `settings_refused: 'Not written: {0}'` fills `{0}` with the server's reasons joined by "; " (`write.ts:41`). If a reason already ends in a full stop, the message ends in "..".

F3.9 Premise 11 is incomplete. The Settings tab's dot comes from three sources: `settingsTyped`; the rail draft in `settingsUnsaved` (`rail.ts:120`); and `Settings.svelte:223-225`, `ui.registerUnsaved((id) => id === instance.id && scopes.changes.files().length > 0)`, which counts staged changes of every scope. The status bar counts tabs, not changes (`pages.ts:224-227` "How many tabs ... hold text no save has taken"). So "the three read one count" (item 11) cannot hold literally. A tab with three staged changes reads 3 in the header and 1 in the status bar.

F3.10 Premise 7 and item 7. The comment the brief cites, `search.ts:33-37`, says the nested runs exist for repositories the root's ignore rules name: "the root's run leaves the repository out whenever the root's ignore rules name it, as a hub's exclude file names every repository inside the hub, and its files are then answered from the repository's run alone". `src/lib/server/git/clone/exclude.ts:162` writes one exclude line for each repository inside a hub. Item 7's rule is "a nested repository found under a path the parent's ignore rules ignore (`git check-ignore`...) is not listed". `git check-ignore` reports every such hub repository as ignored, so the rule removes the files of every hub repository from quick open. The working rule has to tell a repository named by its own path apart from one under an ignored folder; `.agents/worktrees` matches `.agents/*` in oculus's `.gitignore`. C7's control case, "a nested repository not ignored is still listed", does not cover the common hub case.

F3.11 Premise 12 places the empty message at `fields.ts:760`. That line is the `number` control only. A `text` or `long` box that is emptied writes `''` as a value (`fields.ts:739-745`), a path box goes through `pathTrouble`, and a choice is refused silently (`:753-758`). `commitValue(spec, input, lists, held)` does not receive whether the row holds a key. `write.ts:35` passes `row.value`, which may be a default.

F3.12 Premise 16 says Live HPC's error boxes draw through the `# ` rule. That is true, but neither box draws a glyph: `Cluster.svelte:136 <Empty error message={failureMessage(data)}>` and `Login.svelte:120 <Empty error message={reason} />`. Item 16 keeps `# ` exactly where no glyph is drawn, so the Live HPC boxes the step line names stay unchanged (see F5.16).

F3.13 Premise 17 implies the bars sit in `Pane.svelte`'s `.viewbar` (`max-height: 50%`, `Pane.svelte:221`), a `ui/` primitive shared by every view. `Pane.svelte` is not in the write list, so item 17's "at most a third" cannot be set from the Present view's own scoped CSS without it.

F3.14 Premise 18 omits labels of the same form. `RuleForm.svelte:118-121` draws a `Checkbox` labelled `present.field_discover`, which reads "takes the decks it finds beyond the ones it names" (`present.yml:58`, lower case), with `field_discover_none` at :59. Both are outside the write range "lines 25 and 60-75", and item 18's list leaves them out. The Find form would still mix its casing.

F3.15 "No other step in flight has a brief yet" is no longer true. `stat` shows `O169.md` written at 21:30:05, after `O167.md` at 21:27:12. Its write list holds `src/lib/views/system/workbench/settings/scopes/ScopeBar.svelte lines 55-70`, and O167 writes that file whole. O170's line (`plan.md:1728`, "the Present toolbar keeps its buttons in one order") will very likely write `Bar.svelte` and `Present.svelte`. That is a judgment; O170 has no brief yet. The shared paths need the orchestrator's `shared_paths:` judgment.

F3.16 Premise 13 says `Settings.svelte:215-220`. The `registerTabSave` effect is at 217-222. `scopes.svelte.ts` is given with no path; it is `src/lib/views/system/workbench/settings/scopes/scopes.svelte.ts`.

## 4. Cases and checks

F4.1 The rules file says: "A test exists only as the test of one entry of `agents/guarded.md` ... A builder writes no other test. A step that needs a new entry stops and asks Axel." The brief never names `guarded.md` or an entry. `grep -c` over `guarded.md` finds no entry naming the units of these cases:
- `open-view` (C1), `ToolButton` (C2), `StatusBar` (C3), `Listing` (C4)
- `Tooltip`, `FocusFilter` and `PickMenu` (C5); `settled` (C6)
- `landing.ts` / `landingFor` (C15), `Empty` (C16), `Present` (C19)

`guarded.md:3` says "Views have no entry: the look on TEST covers them". Entries that could cover some cases do exist: G88 (`guarded.md:308`, quick open) for C7, and possibly G96 (`:332`, Settings rows) for C10 to C12. The brief's line "the cases above marked 'a test' are ones whose failure costs something ..., so they are tests" contradicts the rules file. As briefed, the builder would have to stop on C1 to C6, C9, C13, C15, C16 and C19.

F4.2 Several cases need a DOM or test a label, class or constant. The rules file says such assertions are "not written" and the look is their proof:
- C2, "a test of the ToolButton classes"
- C3, "a test of the DOM order and the focusin handler"
- C4, "a test of the labels"
- C5, "a test with the menus in the DOM"
- C9, "a test of the labels"
- C13, a key press on a focused bits-ui trigger
- C16, "a test of the class"

F4.3 C2 checks a computed result that is the same on the unchanged tree (F3.3), so it shows nothing.

F4.4 C16 checks "an error box with a glyph". The Live HPC error boxes the step line names have none (F3.12), so C16 checks a place that does not hold the reported flaw.

F4.5 C13 requires "a test that fails" on the unchanged tree, yet the brief cannot name the cause. If the cause is in the DOM key path, no unit test can fail. The rules file also forbids the builder to run a page. The brief should say what the builder does when the cause cannot be reached without a DOM.

F4.6 C18's "scrolled under the strip, no label lies under it" cannot be met by the mechanism item 18 dictates. `scroll-margin-top` affects only scrolling into view, and top padding moves the start position only. Content scrolled past a sticky strip with `z-index: 2` (`GroupHead.svelte:219-222`) still lies under it.

F4.7 Verify item 2 uses `LC_ALL=C grep -n '[^ -~]'`. The rules file says the `perl` ASCII gate "replaces the `grep '[^ -~]'` form wherever a brief or a check names it".

F4.8 The rules file expects the brief to name the worktree, the base copy and the base for `sh utils/unused-exports.sh`. The brief names none of the three (`grep -n 'worktree\|base copy\|unused-exports' briefs/O167.md` finds only report-path and verify lines). Those may be filled in at dispatch.

## 5. The question

Can each case, check and item pass without the goal being reached?

- C1 and item 1: yes. They pass while the Focus heading also changes unannounced (F3.1), and while the heading reads as one of its entries (F3.2).
- C2 and item 2: yes. The check passes on the unchanged tree (F3.3), and the look Axel saw may come from the tooltip or from the time before `isSelf` turns true.
- C3 and item 3: a DOM-order assertion can pass while Tab still walks wrongly, for example if `AppItems side="right"` is left out of the reordered DOM. Only the look settles it.
- C4 and item 4: a label test can pass while `docs/palette.md:26` still says "Projects" (F1.1).
- C5 and item 5: a check of Escape only passes while `onCloseAutoFocus` that always calls `focusQuietly` pulls the focus back after the reader Tabs away or presses outside. `menu-items.ts:150-159` guards that case with `away`, and item 5's dictated form does not.
- C6 and item 6: yes. Store tests can pass while the board lists, the bookmark list and the schedule rows read none of the new store (F3.7).
- C7 and item 7: yes. The C7 fixture passes while every hub repository named in the hub's exclude file is dropped from quick open (F3.10).
- C8 and item 8: no, as long as the look measures at 360 px at text sizes 1 and 1.5.
- C9 and item 9: a label test passes without the "Saved into" line keeping its room. The orchestrator's measurement at the look is the only real check.
- C10 and item 10: yes. It passes with five messages fixed while a dozen other Settings messages lack a full stop (F3.8), or end in ".." (F3.8).
- C11 and item 11: yes. "One count" cannot hold across a tab count and a change count (F3.9), so a test can pass on whichever pair it picks.
- C12 and item 12: yes. A test of the `number` control passes while emptying a `text` row with no key writes `''` (F3.11).
- C13 and item 13: a unit test of `saveTab` can pass while the key, pressed on the trigger, never reaches it. Only a test that runs the cause the first run names, or the look, settles it.
- C14 and item 14: a padding equal to "the actions' width" needs that width. The number of buttons varies (`strip` per card), so a fixed padding can pass on Career cards and fail on a card with more actions.
- C15 and item 15: yes. `landingFor` holds no pixel widths and no text size, and the fallback "the one the landing rules pick as the reader" is usually the asker's own pane, which is treated as locked (`landing.ts:66`), so a test can pass by landing over the board.
- C16 and item 16: yes. Live HPC's error box still draws "# ".
- C17 and item 17: no, if the look measures it. The CSS needs `Pane.svelte` (F3.13), which is not in the write list.
- C18 and item 18: yes. The grep passes while `field_discover` stays lower case (F3.14), and the strip still covers labels (F4.6).
- C19 and item 19: no, as long as the test includes a deck still loading. The presenter's counter (F1.5) is not covered.

## 6. Implied inputs

F6.1 Hub repositories named in the hub's exclude file (item 7): they stay listed in quick open by their own runs. A worktree under `.agents/worktrees`, matched by `.agents/*`, is not listed.

F6.2 Closing a menu or popover by a press outside or by Tab (item 5): the focus stays where the reader put it, no tip opens, and the focus is not pulled back to the trigger.

F6.3 A refused write (item 6): stated in the brief. Implied but not stated:
- A delete whose id is added again before the next read: the row comes back.
- When a removed record is forgotten: once the snapshot no longer holds it, matching `BUILDS_KEPT` in `settled.svelte.ts:22`.
- Two hubs holding the same collection and id: only the row of the hub written to goes.

F6.4 A row whose value in force comes from another scope or a default, with no key in the scope on screen (item 12): emptying it writes nothing and shows no message. Covered for every control kind (`text`, `long`, `path`, `number`, `choice`), not only `number`.

F6.5 Text size 1.5 in Settings (items 8 and 9): the 12em field and the words on Save and Save All wrap the bar without overlap, and the "Saved into" line keeps the same reserved height at both text sizes.

F6.6 The rice theme with brackets on and off:
- Item 10: under rice, `field.css:49-50` already draws `body.rice .oculus-field[aria-invalid='true']`, and the mark shows in both forms.
- Item 2: with brackets on, `.tool` has `border: 0` (`ToolButton.svelte:473-478`), and only colour separates the pressed look.
- Item 9: with brackets on, "[Save]" and "[Save All]" are drawn.

F6.7 A float, which is one pane, and a workbench page with a documents pane (item 15): the record lands in the float, or in the documents pane, and never splits. Text size 1.5 multiplies the 320 px of Decision 4. A window resized after opening needs no handling.

F6.8 A pane of one (item 15): the record splits it as today (C15 states it). The case where the asker's pane is also the reader pane is not stated. Expected: the record lands in another pane that is not the asker's, or splits when there is none.

F6.9 The desktop app (item 13): Cmd+S there may come through the app menu's `save` command (`src/desktop/windows/menu-template.ts:191`) and not through the window keydown. Expected: the same save with the focus on More actions.

F6.10 A status bar with hidden items, app items on the right (`AppItems side="right"`), or no bell (item 3): the drawn order and Tab order still agree.

F6.11 A touch device, `(hover: none)` (item 14): actions are drawn at rest, in flow (`CardActions.svelte:330-331`). The new title padding applies only where the actions are drawn over the title.

F6.12 A deck that failed to load, and a deck switch while the previous deck is still loading (item 19): the counter draws nothing until the new deck has loaded, never the old deck's count.

## 7. ADRs

`ls docs/adr` prints `ls: docs/adr: No such file or directory`, and `ls docs` lists `apps.md data-map.md decks.md diagrams HELP.md licenses palette.md templates.md third-party.md`. No ADR exists, so none is touched.

## 8. Dictated text

- `grep -n '"Project set"' briefs/O167.md` finds lines 41, 63 and 139. "Project set" for `project.yml:193` holds the rules. Decision 2's reason ("said in the words the view's own tab already carries when opened from a card") does not match: a set tab carries the set's own label (for example `pillars.archival`), not "Project set".
- `grep -n 'begins with a capital' briefs/O167.md` finds lines 42 and 64, for `focus.yml:100`. The brief's Conventions ask for "a full stop at the end of a sentence". The tip "Show only what the ticked roles, tiers, pillars and hubs hold" is an imperative sentence, and the brief asks only for the capital. The brief's reason, "as every other tip there does", is false (F3.5).
- `grep -n 'Folders {0}' briefs/O167.md` finds line 55. The labels `Find`, `Folders {0} finds decks in`, `Forms`, `Stages`, `Status chips`, `Tiers`, `Title` and `Tag tones` hold sentence case. The list leaves out `field_discover` and `field_discover_none` of the same form (F3.14). `Tag tones` (`present.yml:76`) is already capitalised and lies outside the write range.
- `grep -n '"Save" and "Save All"' briefs/O167.md` finds line 46. These are existing labels: `workbench.yml:104 scope_save: Save` and `desktop.yml:66 save_all: Save All`. Item 9 reuses them, so the brief introduces no new words. "Save All" is title case, against the Conventions' "sentence case", but it is the shared desktop menu label.
- `grep -n 'ends with a full stop' briefs/O167.md` finds lines 47 and 69. The rule holds; the scope given ("the five") is wrong (F3.8).

## Declined to judge

- The cause of item 13 (Cmd+S on More actions). Reading `bits-ui/dist/bits/menu/menu.svelte.js:1449-1460` shows that the trigger's `onkeydown` prevents the default only for Space, Enter and ArrowDown, and no oculus handler near the gear calls `preventDefault` on Cmd+S. Reading does not settle the cause beyond that.
- Whether 320 px times the text size (Decision 4) and one third of the pane (Decision 5) are the right values. Both are design judgments for the orchestrator.
- What Axel meant by "draws each view with the rail's icon" on the step line: the group headings, as the brief reads it, or something else. F3.2 shows that the brief's reading clashes with `layout.yml:8`.

Agent usage: ae8f0a511f47d2697, claude-opus-5-5, 241334 tokens, 80 tool uses, 11.1 min.

## Closed

Every finding is closed by a change to the brief; none needs a ruling.

- F1.1: `docs/palette.md` added to the write list; item 4 and C4 run `npm run docs:palette`.
- F1.2: the generated diagrams added to the write list; verify 1 runs `npm run diagrams`.
- F1.3, F1.4, F3.2: the premise now says a group row opens its own submenu (`open-view.svelte.ts:95-102`), so it never shares a list with its views, and names the catalogue's heading (`Catalogue.svelte:259`) as where the reason of `layout.yml:8` applies. Item 1 takes the rail glyph in `open-view.svelte.ts` only, leaves `groupGlyph` and the catalogue unchanged, and has the comment at `layout.yml:8` say where each glyph is used; `catalogue.ts` left the write list. Checked by reading `open-view.svelte.ts:88-108`: the group's `items` are a nested submenu. No clash with the rule remains, since the rule is about a heading drawn over its entries in one list.
- F1.5: item 19 and C19 cover the presenter's counter; `Presenter.svelte` added to the write list.
- F1.6: item 3 names the comments at `:34-35`, `:38-40`, `:381-383` and `:409-412`.
- F1.7: none to close.
- F2.1: item 6 keeps the three kinds the looks saw and adds the implied inputs of F6.3.
- F2.2, F3.9: item 11 is narrowed to the line: refused or empty typed text is not counted by `settingsTyped`; the header keeps its meaning; "one count" is gone.
- F2.3, F3.16: line numbers corrected (3647; `Settings.svelte:217-222`; the path of `scopes.svelte.ts`).
- F3.1: Focus added to item 1 and C1 (`compass` / `focus`).
- F3.3, F4.3: the premise names the cause read from `Person.svelte:162-167, 211-219`: the button stays unpressed and enabled between the press and the portfolio's arrival, so the hover look shows; item 2 draws it pressed from the press (Decision 6); C2 is checked by reading and the look.
- F3.4: the line numbers corrected and the comments named.
- F3.5: the false reason removed; the premise gives the counts and says the step line asks the capital; item 5 adds the full stop the Conventions ask.
- F3.6: item 6 moves the bookmark code into `src/lib/state/sources/bookmarks.svelte.ts` (new, in the write list) so `fs.svelte.ts` ends under 880; the sizes of `writes.svelte.ts`, `index.ts` and `ToolButton.svelte` are named, and verify 5 checks every limit.
- F3.7: item 6 gives each kind its own mechanism: removed collection records in `settled.svelte.ts` read by the collection's row builder (`src/lib/state/boards/collection/index.ts`, added to the write list); the bookmark list and the schedule rows drop the row on the success answer.
- F3.8: item 10 covers every Settings message without a full stop, the fragments' composed sentences and the ".." case; `origins.ts` (`src/lib/state/system/config/editors/origins.ts`) added to the write list.
- F3.10, F6.1: item 7's rule leaves out a nested repository only when a folder between the parent's root and the repository is ignored, the repository's own path not counted, so a hub repository named in the exclude file stays listed; C7 holds both fixtures.
- F3.11, F6.4: item 12 covers every control kind and tells `commitValue` whether the row holds a key.
- F3.12, F4.4: item 16 and Decision 7: no "# " in an error box, so Live HPC's boxes lose it; C16 checks a Live HPC box.
- F3.13: item 17 sets the limit through a value `Pane.svelte` reads with today's default; `Pane.svelte` added to the write list.
- F3.14: item 18 and the write range cover `field_discover` and `field_discover_none` (`present.yml` lines 58-76).
- F3.15: the shared files section names O169's `ScopeBar.svelte` lines 55-70, disjoint from this step's lines 130-230, and says O170 compares its own paths.
- F4.1, F4.2, F4.5: the cases are mapped to `guarded.md`: C7 is a row of G88's test, C10 and C12 rows of G96's row-writer test where `write.ts` decides the outcome; every other case is checked by reading and the look; no new entry is needed. C13's first run is the reading of the key path.
- F4.6: C18 asks that at rest no label lies under the strip; the dictated mechanism is removed.
- F4.7: verify 2 is the rules file's perl gate.
- F4.8: the worktree, the base copy and the `unused-exports.sh` comparison are named.
- F5 (the question): each yes is closed by the item changes above; C3, C9 and C14 rest on the look, which the report's look rows describe.
- F6.2: item 5 keeps the focus where the reader put it after a press outside or a Tab away.
- F6.3: item 6 states the three implied inputs.
- F6.5, F6.6: items 8 and 9 hold at both text sizes; item 9 names the bracket form; item 10's mark under rice is named in the premise.
- F6.7, F6.8: item 15 lands in a pane other than the asker's and keeps a float and a documents pane as today.
- F6.9: item 13 and C13 cover the desktop menu's save; `menu-template.ts` and the key-path files added to the write list, changed only as the cause needs.
- F6.10: C3 covers app items, hidden items and no bell.
- F6.11: item 14 keeps `hover: none` as today.
- F6.12: item 19 and C19 cover a failed load and a deck switch.
- Dictated text: Decision 2's false reason removed; `focus.yml:100` given its full stop; the Find form list gains `field_discover`; "Save" and "Save All" are the existing labels; the full-stop scope corrected (F3.8). Each dictated line now in the brief was read against the rules file: "Project set" (`grep -n '"Project set"'`, holds), "Takes the decks it finds beyond the ones it names" (holds), the label list of item 18 (holds).
