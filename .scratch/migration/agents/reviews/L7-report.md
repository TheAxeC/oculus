NOT done: verification check 1 is red. In the one full run, `npx vitest run --reporter=dot` ended with "Test Files 2 failed | 343 passed (345) / Tests 1 failed | 5421 passed (5422)". The two files are `tests/server/git/git-ops.test.ts` and `tests/checks/source/history.test.ts`. Neither file is one this step changes, and both pass when run alone. I could not find the cause inside the files this step changes, so I stopped there. I did not run the whole suite a second time. Everything else in the brief is built.

Open items of the state file: the prompt did not include them, so none are repeated here.

## DONE / NOT DONE

| # | Item or check | State | Proof (command, output) |
|---|---|---|---|
| 1 | Rail: eleven buttons, ruled order, Incoming (`email` glyph), System keeps key `info` | DONE | `config/layout.yml:9-20`; `tests/state/workbench/navigation/arrangement.test.ts` "draws the eleven buttons in the ruled order..." passes (run of the 20 changed test files: 20 passed, 569 passed) |
| 2 | Arrangements as the table says | DONE | `layout.yml` `arrangements:`; arrangement.test "makes every page as the rulings lay it out, pane by pane" passes; coverage script below exits 0 |
| 3 | Groups are the pages, every group has a letter, `isChorded` reads the chord, HELP key table | DONE | `layout.yml nav_groups`; `catalogue.ts:82` (`section.label !== null && section.chord !== undefined`); catalogue.test "puts a group that names a letter under its own chord whatever its size" and "counts the real keys: every page under its own letter, the direct chord counting none" pass; HELP.md key table and `config/text/app.yml` key sheet list f m p e s c l r t y w |
| 4 | Where an opened tab lands | DONE | `layout/open/landing.ts:37` `landingFor`; `opening.ts:93` sends a group-less view to `openOpened` (`:169`); `context.ts:253` `registerOpened`; `tests/state/workbench/layout/open/landing.test.ts` (13 cases) passes |
| 5 | Empty pane | DONE | `arrangement.ts:65` (`[]` makes `emptyPane()`); `PaneView.svelte:383` draws `ui.pane_empty`; arrangement.test "makes a pane naming an empty list an empty pane" passes |
| 6 | Reset all and reset one page | DONE | `navigation/pages.ts:105` `resetPlan`, `:126` `resetAsk`; `layout.svelte.ts:521` `resetPage`, `:542` `resetPages`; `PagesReset.svelte` in `Settings.svelte:36`; rail menu `rail.ts:103` `railMenu` answered in `ActivityRail.svelte`; Pages row `Pages.svelte:251`; `tests/state/workbench/layout/pages.test.ts:453-527` and `navigation/pages.test.ts:141-190` pass |
| 7 | Leads `applied` opens the prefilled Applications add form; lead set applied after the add is written | DONE | `LeadCard.svelte:117`; `Leads.svelte:113` `toApplication`; `views/feeds/leads/application.ts:25`; `state/feeds/lead-application.ts:29` `addFromLead`; `Collection.svelte:283` `onadd={leadAdd}`; `tests/state/feeds/lead-application.test.ts` and `tests/views/feeds/leads.test.ts` pass |
| 7a | One `decline` control; toggle hides declined and dismissed; `showDeclined` reads a saved `showDismissed` | DONE | `data/accounts/leads.ts:45` `isLeadDeclined`; `state/feeds/leads.ts:161`; `LeadCard.svelte:120`; `leads.yml` `show_declined`/`hide_declined`. The grep of the old names over src, tests, config, HELP, DESIGN and README leaves only the kept `DISMISSED` constant, the `showDismissed` fallback, their tests, and the unrelated `radar.ts` `isDismissed` |
| 8 | Account setup a tab of Views and Settings, still opened from the Inbox and Calendar lists | DONE | `layout.yml` views pane `[settings, account-setup]`; registration `group: 'views'`; `tests/views/personal/account-setup.test.ts` passes |
| 9 | HELP.md and DESIGN.md | DONE | HELP: the rail, pages, chords, landing, empty pane, both resets, leads row. DESIGN: folders paragraph (:81), pages, "Opened views land beside the tools", Present, Memories, Search, Repositories, Calendar, leads. The grep for `Info/more|GROUP_MAX|four entries|small groups|feeds group|personal group|sources group|boards group|academic life group|sectionSize` over DESIGN, HELP and README prints nothing stale |
| 10 | Unit tests listed in the brief | DONE | all 20 changed or added test files: "Test Files 20 passed (20) / Tests 569 passed (569)" |
| 11 | tests/browser restored; no `// revert:` line | DONE | `diff -r .../L7-base/tools/oculus/tests/browser tests/browser` prints nothing (exit 0); the directive grep over all 97 changed files prints nothing (exit 1). 227 directive lines were deleted from 20 test files, then `npx prettier --write` was run over them |
| V1 | `npx vitest run --reporter=dot` | NOT DONE (red) | tail of the output, verbatim: `Test Files  2 failed \| 343 passed (345)` / `Tests  1 failed \| 5421 passed (5422)`. The only frame shown was `tests/checks/source/history.test.ts` with its caret on the `it(` line 145, which is how a timeout is framed. Vitest's results cache (`node_modules/.vite/vitest/.../results.json`) recorded `tests/server/git/git-ops.test.ts` failed after 58511 ms. Run alone: `npx vitest run tests/checks/source/history.test.ts` gives 3 passed; `npx vitest run tests/server/git/git-ops.test.ts` gives 37 passed. Not verified: the actual failure message of git-ops in the full run, since only the tail was captured |
| V2 | `npm run check` | DONE | `COMPLETED 1523 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| V3 | `npm run build` | DONE | exit 0 |
| V4 | `npm run format:check` | DONE | `All matched files use Prettier code style!` |
| V5 | `npm run lint` | DONE | exit 0 |
| V6 | ASCII gate of the rules file | DONE | prints nothing |
| V7 | `sh bin/size-check.sh`, `sh bin/folder-check.sh` | DONE | both exit 0 |
| V8 | `npm run diagrams` twice | DONE | the second run changed nothing (`diff -r` of a copy taken after run 1 against docs/diagrams prints nothing); layers, layer-shell, layer-state and layer-views differ from base |
| V9 | directive grep and browser diff | DONE | see row 11 |
| V10 | `ls -d $TMPDIR/oculus-* \| wc -l` | DONE | 1 before, 1 after |

## Coverage script

The script is `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/coverage.mjs`, run as `node coverage.mjs <worktree>/tools/oculus`. It reads from the source text, separately from the unit test:
- every `<script module>` registration's id and group under `src/lib/views`;
- the three `boardRegistration` calls;
- the Collection placements over `config/sources.yml`;
- `docs:`.

It then walks every rail arrangement. Output: 49 rows `ok <id> group=<g> pages=<g>` (the group equals the page), and `two files group=explorer pages=sessions,explorer`. It ends with `entries 50, not on exactly one page (bar the Files second instance) 0, tabs that are no entry: []`, exit 0. The same check is a unit case: arrangement.test "puts every view with a place, every collection and every hub document on exactly one page" (`toHaveLength(50)`, only `files` twice, on `['sessions','explorer']`).

## Files changed (lines now, +added -removed)

**Config and docs:**
- `config/layout.yml` 180 (+66 -36)
- `config/text/app.yml` 65 (+1 -1)
- `config/text/ui.yml` 64 (+2)
- `config/text/views/feeds/leads.yml` 32 (+5 -6)
- `config/text/views/system/workbench.yml` 58 (+10)
- `HELP.md` 297
- `DESIGN.md` 321 (+10 -2)

**State:**
- `src/lib/state/workbench/layout.svelte.ts` 638 (+88 -2)
- `layout/open/opening.ts` 238 (+79 -5)
- `layout/open/landing.ts` 59 (new)
- `layout/open/attention.ts` 181 (+29 -3)
- `layout/index.ts` (+1)
- `navigation/pages.ts` 149 (+55)
- `navigation/catalogue.ts` 262 (+11 -21)
- `navigation/arrangement.ts` 83 (+5 -2)
- `state/client/context.ts` 293 (+4)
- `state/boards/collection.ts` 802 (+7)
- `state/feeds/leads.ts` 183 (+15 -13)
- `state/feeds/lead-application.ts` 39 (new)
- `data/accounts/leads.ts` 53 (+12 -8)

**Shell:**
- `shell/panes/PaneView.svelte` 456 (+17)
- `shell/rail/ActivityRail.svelte` 344 (+47 -5)
- `RailPages.svelte` 291 (+7 -12)
- `rail.ts` 155 (+17 -2)

**Views:**
- `Leads.svelte` 358 (+91 -21)
- `LeadCard.svelte` 224 (+12 -19)
- `leads/application.ts` 34 (new)
- `Collection.svelte` 419 (+30 -6)
- `Pages.svelte` 334 (+43 -8)
- `PagesReset.svelte` 82 (new)
- `Settings.svelte` 49 (+10 -6)
- `Catalogue.svelte` (+3 -4)
- 32 other view files: registration group, order and head comment only, 1 to 5 lines each

**Tests:**
- new: `tests/state/workbench/layout/open/landing.test.ts` 201, `tests/state/feeds/lead-application.test.ts` 66, `tests/shell/rail/shipped-rail.ts` 33
- changed: config-folder, rail-config, rail, leads (state and view), layout-fixture, layout-parts, pages (layout and navigation), arrangement, catalogue (state and view), rail (navigation), registry, account-setup, memories, audit, settings, type-scale
- `tests/checks/tree/allow-audits.txt` (1 case renamed) and `allow-duplication.txt` (4 entries whose duplication no longer exists removed)
- `docs/diagrams/*` regenerated

**Outside the brief's path list:**
- `src/lib/shell/panes/PaneView.svelte`: the empty pane's line has to be drawn by the pane.
- `src/lib/state/client/context.ts`: wires the registry's "no group" rule into the layout store.
- `src/lib/state/boards/collection.ts`: the `lead` key of the Applications tab's state.
- `docs/diagrams/`: output of `npm run diagrams`.

## Judgment calls the orchestrator may reverse
1. **Landing order.** The order is:
   1. the pane holding the page's newest received on-demand tab;
   2. the reader's pane, when it already holds on-demand tabs;
   3. an empty pane;
   4. a pane holding only on-demand tabs;
   5. a new pane split to the right of the reader's.

   Steps 2 and 4 go beyond the brief's list. Step 4 stands in for the received list, which is not saved, after a reload; without it a reload would split a fresh pane beside an existing documents pane. The ruling's "last-used pane holding such tabs" covers both steps.
2. **Where the prefill lives.** The prefilled values go into the Applications tab's form drafts (`<id>#forms`, the record EntryForm reads). The lead's title goes into the tab's instance state (`lead`). The brief says the whole prefill travels in instance state; drafts are what the form reads, they survive a reload, and they count as unsaved text.
3. **Replace confirm.** If the Applications add form already holds typed text, `leads.action.to_application_replace` asks before the lead replaces it.
4. **Split sizes.** The brief gave none for focus, incoming and explorer; I chose `[0.7,0.3]`, `[0.6,0.4]` and `[0.4,0.6]`.
5. **Group heading glyphs.** One per group, none carried by a view of that group: focus, live, paper, email, folder, scout, book, venue_dist, conference, info, settings.
6. **Page name on reset.** A reset page takes the button's words as its name.
7. **Rail menu.** Reset appears only once the button's page has been made.
8. **Reset all with nothing to do.** The control is disabled, with a line saying there is nothing to reset.
9. **Unsaved tabs on reset.** The one reset confirm counts them ("{0} tabs on them hold unsaved changes, which the reset loses"). There is no separate close question per tab.
10. **Direct chord.** `v` now counts no view, since every group has its own letter.

## Before and after, for the look
- **Rail.** Before: 13 buttons with Feeds, Calendar, Inbox and "Info/more". After: 11 buttons in the ruled order, Incoming new, System at the old Info position; digits 1 to 9 reach Focus through Present.
- **Each rail page.** The first press on a page not yet saved shows the table's layout. On Explorer, the right pane reads "Files and documents you open on this page appear here."
- **Landing.** On Projects, opening a project card opens a pane to the right; the next project lands in that pane, and the board pane never receives it. On Explorer, a file clicked in Files lands in the empty right pane.
- **Rail right-click.** A made page shows Hide, Reset to its arrangement, Settings. The confirm names the page.
- **Pages view.** Rows of rail pages carry "Reset to its arrangement"; Page 1 and TEST rows do not.
- **Settings.** A new "Pages" section with "Reset all pages". Its confirm lists "Rebuilt: ..." and "Removed: ..."; a saved Feeds, Calendar or Inbox page is listed as removed.
- **Views catalogue.** Eleven headings, one per page. The key sheet (`?`) lists f, m, p, e, s, c, l, r, t, y, w and v.
- **Position Leads.** An open lead shows `applied` and `decline`; `dismiss` is gone. Pressing `applied` opens Applications beside the leads with title, sub, url, deadline and status "not applied" filled in. Saving writes the entry and then sets the lead to applied; both writes appear in History. Cancel leaves the lead open. The toolbar toggle reads "Show declined (n)".

## Wrong, impossible or left
- `tests/state/workbench/navigation/rail.test.ts:6` says each case's "revert names the line", and `tests/views/whole/type-scale.test.ts:338-339` names `bin/revert-check/revert-check.mjs`. Both lines come from the base and describe revert-check, which Q93 removes. I left them to avoid colliding with Q93's edit of the same files; they are false once the directives are gone.
- `tests/state/feeds/radar.test.ts:104` still holds a `// revert:` line. It is not a file this step changes, so it is Q93's.
- The `feeds/position-leads.yml` schema (the dismiss option) is hub data for the orchestrator at landing, as the brief says.
- These behaviours are not covered by a unit test; they need a DOM and are left to the look:
  - a lead add answered after its Applications form closed or was refilled (the title is captured when the save starts, so the lead that was saved is the one marked);
  - the rail and Pages confirms opening;
  - the empty-pane line being drawn.
- The unit suite failure is in row V1 above.


## Repair round 1 (the builder's report, 2026-09-28)

Everything in the round is done.

| # | Item | State | Where | Proving command |
|---|---|---|---|---|
| 1 | Z18: a Help group (key `help`, label Help, chord `h`), which is no page | DONE | See the detail below this table. | `npx vitest run tests/checks/config/config-folder.test.ts` gives 26 passed. It includes "keys every catalogue group by the rail page it holds, in rail order, Help after System", which asserts that `arrangements` has no `help`, and the chord list f m p e s c l r t y h w. |
| 2 | The keyless-entries case replaced | DONE | `tests/views/system/workbench/catalogue.test.ts:66` "draws a key beside every entry of every group, System y1 to y6 and Help h1 to h5". It checks key count equals entry count for every drawn group, and that the headings are the rail labels with Help after System. `tests/state/workbench/navigation/catalogue.test.ts:234,260` and the chord list: `y` is status to gallery, `h` is help, memories and the three docs; `Help:h:page` in the glyph list. | the verify run below; both files also ran alone, passed |
| 3 | A reset asks each unsaved tab, one at a time, after the reset confirm; a no ends it with nothing changed | DONE | See the detail below this table. | `npx vitest run tests/state/workbench/layout/pages.test.ts tests/state/workbench/navigation/pages.test.ts` gives 61 passed |
| 4 | The Leads to Applications work moved into state, with its cases | DONE | See the detail below this table. | `npx vitest run tests/state/feeds/lead-application.test.ts tests/views/feeds/leads.test.ts` gives 25 passed |
| 5 | The false comments | DONE | `rail.test.ts:6` now reads "Nothing here renders; every case is over a pure function." `src/lib/shell/Workbench.svelte:84-85`: the direct chord counts "views no catalogue group holds". `type-scale.test.ts:339`: the reference to `bin/revert-check/revert-check.mjs` is gone, and the comment now says what turns the case red. | read of the lines |
| 6 | Judgment calls kept as built | DONE | no change | none |

**Item 1 detail:**
- `config/layout.yml:35` `help: { label: "Help", glyph: page, chord: h }`, after `info`. The `page` glyph is carried by no view of the group: help is `question`, memories is `memories`, doc is `book`.
- The three `docs:` entries have `group: help` (`:179-181`).
- `Help.svelte:10` and `Memories.svelte:10` have `group: 'help'` (orders 0 and 1).
- `arrangements.info` is unchanged; the System group keeps status, findings, audit, history, config and gallery.
- HELP.md: `:67` is `y1-y6`, `:68` is `h1-h5`, and a sentence in the rail paragraph names the Help group. The key sheet in `config/text/app.yml` has the same rows.
- DESIGN.md: the `:81` folders paragraph, the chord list and the Memories paragraph.
- `catalogue.ts` head comment.

**Item 3 detail:**
- `src/lib/state/workbench/navigation/pages.ts:156` `questionFor`: an asker over a held question.
- `pages.ts:181` `resetAfterAsking`: the reset question first. Then, for each tab of the pages rebuilt or removed where `closeQuestion([id], unsaved)` is `'dirty'`, it asks `ui.tab_close_dirty`. A no returns false before `act` runs.
- `resetAsk` no longer takes or counts unsaved tabs, and `workbench.reset_unsaved` is removed from `config/text/views/system/workbench.yml`.
- The three reset surfaces call it: `ActivityRail.svelte`, `Pages.svelte` and `PagesReset.svelte`. All three draw the held question through the new primitive `src/lib/ui/controls/HeldQuestion.svelte`.
- Cases in `tests/state/workbench/layout/pages.test.ts`:
  - `:546` "asks each unsaved tab of a reset, one at a time, after the reset question": two unsaved tabs, each asked, reset runs.
  - `:581` "leaves every page as it was when the second unsaved tab is answered no": pages JSON unchanged, the tab's state kept.
- `navigation/pages.test.ts` has a case for `questionFor`.

**Item 4 detail:**
- `src/lib/state/feeds/lead-application.ts` now holds `applicationFromLead`, `holdsTyped`, `prefillFromLead` (`:87`), `addFromLead`, `leadAddFor` (`:136`, which clears `lead` once the entry is written) and `closeAddForm` (`:157`).
- `views/feeds/leads/application.ts` is removed.
- `Leads.svelte:129` calls `prefillFromLead`; `Collection.svelte:156` calls `leadAddFor` and `:288` calls `closeAddForm`.
- Cases in `tests/state/feeds/lead-application.test.ts`:
  - `:148` the prefill clears the drafts, sets each field by its schema kind, sets `adding` and names the lead;
  - `:197` a written entry writes the lead applied and clears `lead`;
  - `:211` a refused add writes nothing to the lead;
  - `:221` a cancel writes nothing to the lead.

## Judgment calls this round (reversible)
- A tab's unsaved-text question shows the page's name as its second line, since the tab itself is not on screen.
- `tests/views/system/help.test.ts` "names every catalogue group that has a chord" and "writes down every letter a catalogue group is reached by" required every letter's row to read `x1-x9`. They now accept `x1-x9`, or `x1-xn` where n is that group's exact entry count below nine. The ruled `y1-y6` and `h1-h5` rows need this. A row claiming a range other than those two still fails.
- The lead's title is kept untrimmed in the tab's state, as the file holds it. That is the id `LeadCard`'s own status write uses.
- `HeldQuestion.svelte` is the 10th item in `ui/controls`, which is at the folder limit. It is listed in `type-scale.test.ts`'s pass-through audit and in DESIGN.md beside `CloseQuestion`.
- `tests/views/system/help.test.ts` is now a changed file, so its 8 `// revert:` lines were deleted and prettier was run.

## Report corrections
- `landing.test.ts` has 14 cases (`grep -c "it(" tests/state/workbench/layout/open/landing.test.ts` gives 14).
- The first round deleted 159 `// revert:` lines over 15 files. This round deleted 8 more, in `tests/views/system/help.test.ts`.

**Before and after, for the look, additionally:**
- A page already saved in the browser keeps its layout until its Reset or Reset all is pressed, so a browser with saved pages sees the new layouts only after a reset.
- An applied lead no longer offers decline.
- Declined leads are hidden by default, behind the toggle.
- `applied` is shown on declined and expired leads too, and saving its form sets them `applied`.
- The catalogue shows a Help heading after System, with h1 to h5.
- A reset over unsaved tabs asks one confirm per tab after the reset confirm.

## Verify, from `.agents/worktrees/L7/tools/oculus`
`sh /Users/axelfaes/.claude-work/skills/land/templates/verify.sh /Users/axelfaes/workspace/research-hub/tools/oculus/.scratch/migration/orchestrator-state.md` exits 0. Lines it printed:
```
 Test Files  345 passed (345)
      Tests  5432 passed (5432)
1790558355436 COMPLETED 1523 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
✓ built in 1.41s
✓ built in 5.19s
All matched files use Prettier code style!
verify: 6 commands passed
```
The runner was run more than once in this round. Only the run quoted above is on the final tree. The earlier runs went red on defects of this round's own changes: HeldQuestion missing from the pass-through audit, the help key-table checks, a lint error in HeldQuestion, and the help.test directive lines. Each is fixed, and each fixed file was run alone before this last run. Under load, one earlier run's full suite also had `tests/checks/tree/scratch.test.ts` time out at 5475 ms; it passed alone and in the final run.

Other checks:
- The `// revert:` grep over all 101 files the step changes or adds prints nothing (exit 1).
- `diff -r .../L7-base/tools/oculus/tests/browser tests/browser` prints nothing (exit 0).
- `sh bin/size-check.sh` and `sh bin/folder-check.sh` both exit 0.
- `npm run diagrams` twice: the second run changed nothing (`diff -r` of a copy taken after run 1 prints nothing).
- `ls -d $TMPDIR/oculus-* | wc -l` gives 1, the same as before.
