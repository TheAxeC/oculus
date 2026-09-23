Verification (run from /Users/axelfaes/workspace/research-hub/.agents/worktrees/L3/tools/oculus, Node v24.21.0):
- `ls -d $TMPDIR/oculus-* | wc -l` before: `7015`
- `npx vitest run --reporter=dot`: `Test Files  1 failed | 289 passed (290)` / `Tests  1 failed | 4587 passed (4588)`; the one failure is `tests/views/system/help.test.ts > the manual itself > names every view the rail lists, by its id` (`expected [ 'catalogue', 'pages', 'settings' ] to deeply equal []`), the expected HELP.md failure. The scratch.test timeout the report names did not happen in my run.
- `npm run check`: `COMPLETED 1326 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run build`: `build exit 0`
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: `lint exit 0`
- perl ASCII gate: no output, `perl exit 0`
- `sh bin/size-check.sh`: `size exit 0`; `sh bin/folder-check.sh`: `folder exit 0`
- `lsof -iTCP:8792 -sTCP:LISTEN`: nothing listening (exit 1), so I ran the whole suite. `npx playwright test`: `321 passed (7.8m)`, exit 0
- `node bin/revert-check.mjs tests/browser/shell/settings.spec.ts`: `4 reverts, 0 unproven, 0 unchecked`, all 4 red
- `node bin/revert-check.mjs tests/browser/workbench/pages.spec.ts tests/browser/shell/keyboard.spec.ts tests/browser/shell/views.spec.ts tests/browser/shell/rail.spec.ts`: `14 reverts, 0 unproven, 16 unchecked`. Every brief-listed case is red under its revert. The 16 unchecked are cases the step did not add.
- `node bin/revert-check.mjs tests/state/workbench/navigation/*.test.ts tests/views/system/workbench/*.test.ts tests/routes/edit/rail.test.ts tests/server/files/bookmarks-move.test.ts`: `102 reverts, 0 unproven, 0 unchecked`
- `md5 config/layout.yml` before and after every run: `feaf696c5feb094874e80fc2e6211cd1` both times. `md5 ~/.oculus/bookmarks.yml`: `6bf9f6f0bfe27704f81c2da09f0493a2` both times. So the served runs did not touch the worktree's layout.yml or the real bookmarks file.
- `ls -d $TMPDIR/oculus-* | wc -l` after: `7015`
- The report's counts are reproduced: check 1326 files, 321 browser passes, tmp 7015 to 7015, 4588 node cases.

## Spec

1. The one-time bookmark move makes the server rewrite a tracked file. `src/lib/server/core/context.ts:258-279` calls `moveLayoutBookmarks(layoutFile(engine), ...)`. After the move, `src/lib/server/files/fs/bookmarks.ts:226` runs `writeTextAtomic(layout, edited)` on the checkout's own `config/layout.yml`. `config/layout.yml:154-158` keeps the key, with the comment "The server reads this key once at its start, moves each entry ... and then takes the key and this comment out of the file."
   - The brief says "`layout.yml`'s `bookmarks:` goes". In the diff it stays; the program removes it.
   - Consequences, from reading the code: Axel's server on main dirties main's tracked `layout.yml` on its first start after landing. From then on `tests/checks/config/config-folder.test.ts` fails on that machine ("holds exactly the expected top-level keys" and "reads each file on its own", since `EXPECTED` still lists `bookmarks`). The builder states this. The suite is then green or red depending on whether the server has run.
   - The layout.yml edit and the two bookmark adds (`createEntry(...)` called with no change log) do not reach History, so neither can be undone there.
   - This is a premise conflict inside the ruling: the key "goes", yet a server read of the old key is the carrier. It is for Axel, not for the builder to settle. Two forms remove the key in this commit instead: (a) the orchestrator runs the move once at landing, or (b) the move reads the old entries from the base commit's text. It must be booked.
2. A fresh browser opens on "Page 1" (the Status view), which no rail button owns, and digit 1 does not return there. The brief does not settle this. The builder reports it as a judgment call, not as an open item. It is a user-visible choice: book it for Axel. The alternative is a fresh browser opening on the first rail page.
3. The status bar words differ from the ruled items, and the reason is test convenience ("so they do not clash with other controls' accessible names"). `config/text/views/system/workbench.yml`:
   - `status_live: 'live agents: {0}'` counts live sessions (`StatusBar.svelte:56`, `records.filter(record.live)`) and opens `session-list`. oculus has an `agents` view, so "agents" names a different thing.
   - `status_unsaved: 'unwritten tabs: {0}'` cycles a synonym: the same file has `pages_unsaved: unsaved`, and tabs are named with `ui.tab_unsaved`.
   - The ruling said "live sessions count" and "unsaved tabs count". Book this for Axel, or use the ruled words and make the selectors exact.
4. Rail badges are gone. At base, `ActivityRail.svelte:141-153` drew `badgeOf` per view, including the sessions waiting count. Now only the catalogue draws them (`Catalogue.svelte:41`). The brief did not rule this. It removes a live signal from the always-visible surface. The builder lists it as open item 5; it needs booking.
5. Page reordering is gone. The page move keys were ruled out, but the strip's drag reorder went too, with no reorder in the Pages view. This is minor, since the rail order comes from Settings, and it is reported (open item 6). Book it with the others.
6. The catalogue opens a view into the page it sits on. `tests/browser/shell/views.spec.ts:57` asserts "The Help tab joined the catalogue's own pane, on the page the catalogue is on". Pressing a view in the catalogue therefore fills the Views and Settings page itself. That is the literal reading of "opened into the current page from there". The other reading, the page the reader came from, was not raised. Flag it for Axel's look.

## Proof

1. The Settings view rail case checks the label and the file, but the glyph is never checked against glyphs.yml on the client. `src/lib/state/workbench/navigation/rail.ts:34` calls `readRail(config.rail, arrangementKeys(arrangements))` with no glyph list, so an entry with an unknown glyph is still drawn. Meanwhile `railFindings` reports `findings.rail.glyph_unknown`: "...names a glyph glyphs.yml does not hold; it is not drawn". The finding sentence is false. `data/sources/config/rail.ts:3` "One rule, so the three agree" is false for glyphs. No case exercises a hand-edited unknown glyph on the page.
2. `tests/checks/tree/allow-duplication.txt` gains one allowance for new code: `src/lib/shell/panes/PaneView.svelte src/lib/views/system/workbench/Pages.svelte 3ed93ba68ad5 the same 8 lines at 374 and 236`. It is the Confirm block, moved over from the deleted PageStrip entry. It is an exemption carried forward rather than folded, so it counts as a loosening to name.
3. `tests/checks/tree/boundaries.test.ts:88` adds `'state/workbench/navigation/**'` to the shell row and `:109` adds `'data/sources/config/rail'` to the state row. Both widenings are explained in the head comment; I list them as changed allow lists.
4. There is no browser case for the CRT or glyph-mode toggles in their new home. `grep -rn "crt_on" tests/browser` finds nothing. The node test `tests/views/system/workbench/settings.test.ts` renders them to a string only. The brief lists only "changes the theme", so this is not a miss against the brief. The controls moved and nothing presses them in a DOM.
5. No test asserts a known defect. None of the removed thresholds (strip scroll, page-strip surface, foot drawing counts) was loosened: each went with the code it covered. `foot drawings` changed from `>= 9` to `toHaveLength(2)`, which is tighter.

## Standards

1. Three copies of one parser, against spec "a parser ... exists once". Each coerces a rail list to rows of three strings:
   - `railDraft` in `src/lib/state/workbench/navigation/rail.ts:48-60`
   - `railLists` in `src/lib/server/edit/writes/rail.ts:40-51`
   - `railRows` in `src/lib/server/edit/writes/undo.ts:169-179`

   `data/sources/config/rail.ts` is the shared module for this.
2. The diff makes a user-visible string false: `config/text/views/system/config.yml:8` `desc_layout: 'How things are arranged: the rail groups, the hub documents, ..., the saved arrangements.'` The file is in the step's paths (`config/text/`) and was not changed.
3. The diff makes head comments and comments false, and neither the diff nor the report carries them (spec: "A sentence in a document or a head comment that the change makes false is a defect of the change"; grep `rail opens|flyout|rail badge|rail group|in the rail`):
   - `src/lib/state/workbench/rail-badges.svelte.ts:1` "Reactive rail badges": the rail draws none now.
   - `src/lib/ui/menu/Menu.svelte:44` "the rail opens a view where a view lands, and in a pane beside it when shift ...": it is the catalogue now.
   - `src/lib/ui/controls/ToolButton.svelte:252` "A toggle in the rail that is on" and `src/lib/themes/derive.ts:231` "a pressed toggle in the rail": the toggles are in Settings.
   - `src/lib/server/content/docs.ts:11` and `:275` "offers in the rail"; `src/lib/views/sources/doc/Doc.svelte:2` "opens from its group in the rail".
   - "in the sessions flyout" in the view registration heads of `Transcript.svelte:2`, `Agents.svelte:2`, `Terminal.svelte:2`, `SessionDetail.svelte:2` and `Timeline.svelte:2`.
   - `Files.svelte:2` and `Repositories.svelte:2` "the rail's Sources section"; `Data.svelte:2` "in the rail"; `Project.svelte:2`, `Deposit.svelte:2` and `Person.svelte:3` "not listed in the rail".
   - `src/lib/state/workbench/layout.svelte.ts:208` "the mark saying where the rail opens a ...".
   - `src/lib/data/accounts/leads.ts:5` and `tests/checks/tree/boundaries.test.ts:40` "its rail badge"; `src/lib/views/feeds/inbox/Inbox.svelte:2`, `Calendar.svelte:3` and `src/lib/state/life/calendar.ts:63` "rail badge".
   - `src/lib/views/registry.ts:48` "the rail group that owns this view".
   - The case name `tests/shell/workbench.test.ts:803` "draws the strip of the one pane the rail opens into".

   Some of these files are outside the paths. Those should at least have been listed in the report with the reason they were not carried.
4. The Doc text is incomplete. These lines are made false and are not in it:
   - `HELP.md:36` "the one pane the rail opens a view into" and "a folded pane the rail opens into" (only the page-strip sentences of that line are covered)
   - `HELP.md:123` "Five views are opened for something rather than listed in the rail"
   - `DESIGN.md:71` "A view's rail group is its folder"
   - `DESIGN.md:243` "(shift-click on the rail, ...": the rail no longer opens beside
   - `DESIGN.md:262` "the Position Leads view, its rail badge"
   - `DESIGN.md:286` "so one pane strip says where the rail opens a view"

   The Doc text entries that are given read correct against the code.
5. A new string with a spaced hyphen standing in for a dash (prose rule): `config/text/views/system/workbench.yml` `catalogue_key: '{0} - press {1}'`. It copies the older `ui.page_shortcut`, which the new rail hint also uses.
6. `src/lib/server/edit/list-edit.ts:16-19`, the head comment is hard-broken mid-sentence: "for the deck's two lists,\n// server/edit/writes/audit-mute.ts ...".
7. The status bar is shell chrome placed under `src/lib/views/system/workbench/StatusBar.svelte`. It is not registered and is imported by name from `src/routes/+page.svelte:9`, then handed to the shell as a snippet. That keeps inside the boundary test's letter, since routes are not checked. It is a structural choice the report does not name as one.
8. The write `writes/rail.ts` itself follows the write chain rules: it reparses its result (`kept`, `rail.ts:69-75`), refuses on mismatch, records `before`/`after` for undo, has History kind `kind_rail`, and uses `writeFileSync` as its siblings `deck.ts:98` and `audit-mute.ts:84` do. The layout.yml edit in `moveLayoutBookmarks` also reparses (`keptWithout`), but it bypasses the change log (Spec 1).

## Behaviour

1. Not stated in the report:
   - The rail landmark's accessible name changed from "Views" to "Pages" (`config/text/ui.yml` `rail: Pages`).
   - Shift-click on the rail no longer opens a view beside; that moved to the catalogue.
   - The rail's hover words are now "{label} - press {n}" per page.
   - A catalogue press opens the view on the Views and Settings page itself (Spec 6).
   - The Config view's layout description is unchanged and now false (Standards 2).
2. Stated only as a judgment call, not as a before/after: a fresh browser lands on an unowned "Page 1", with no rail button active (Spec 2).
3. Axel's existing saved pages carry no rail key. A rail button adopts a keyless page whose name equals its label (`layout.svelte.ts:264-272`), so his old "Sessions" page becomes the Sessions button's page, and any other page he named e.g. "Focus" is taken over silently. The report states the rule (open item 4) but not what it does to his saved layout on first load.

## Not checked

- I did not look at the change on screen in Axel's browser; that is the orchestrator's step.
- I did not run revert-check over the other changed browser specs or the changed node files outside the four new node groups. The report's 100-revert full run is not reproduced.
- The docs/diagrams regeneration (`node bin/diagrams.mjs`) was not rerun or compared.
- `RailEditor.svelte`, `Catalogue.svelte` and `navigation/catalogue.ts` were read only where the cases touch them, not line by line.
- The race between a hand edit of `layout.yml` and a rail write in flight (no stale-base check in `writeRail`) is not exercised by me. It matches the deck and audit writes.

## Usage

About 205k tokens of context and 40 tool calls. Wall time was dominated by the full browser run (7.8 min) and three revert-check runs (about 1 to 6 min each).

# Repair round 1, refuted

Verification (run from /Users/axelfaes/workspace/research-hub/.agents/worktrees/L3/tools/oculus, Node v24.21.0):
- `ls -d $TMPDIR/oculus-* | wc -l` before: `7015`
- `npx vitest run --reporter=dot`: `Test Files  1 failed | 289 passed (290)` / `Tests  2 failed | 4585 passed (4587)`. Both failures are in tests/views/system/help.test.ts. One is "names every view the catalogue lists, by its id". The other is "describes every configuration file in the words the Config view shows" (`expected [ 'layout.yml' ] to deeply equal []`). Both are the HELP.md failures the report expects.
- `npm run check`: `COMPLETED 1328 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`
- `npm run build`: `build exit 0`
- `npm run format:check`: `All matched files use Prettier code style!`
- `npm run lint`: `lint exit 0`
- perl ASCII gate: no output, `perl exit 0`
- `sh bin/size-check.sh`: `size exit 0`. `sh bin/folder-check.sh`: `folder exit 0`
- `lsof -iTCP:8792 -sTCP:LISTEN`: nothing (exit 1). `npx playwright test`: `327 passed (6.7m)`
- HELP.md Doc text: I applied every HELP.md entry of the round's Doc text to a copy of the tree under $TMPDIR, then ran `npx vitest run --reporter=dot tests/views/system/help.test.ts tests/checks` there: `Test Files  24 passed | 1 skipped (25)` / `Tests  293 passed | 9 skipped (302)`. The copy is deleted.
- `node bin/revert-check.mjs tests/state/workbench/navigation/status.test.ts tests/shell/status/status-bar.test.ts tests/state/workbench/navigation/pages.test.ts tests/state/workbench/layout/pages.test.ts tests/shell/rail/rail.test.ts tests/state/workbench/navigation/rail.test.ts`: `52 reverts, 0 unproven, 28 unchecked`. The 28 unchecked are older layout/pages.test cases.
- `node bin/revert-check.mjs tests/browser/shell/settings.spec.ts tests/browser/shell/views.spec.ts tests/browser/workbench/pages.spec.ts tests/browser/shell/rail.spec.ts tests/browser/shell/shell-defects.spec.ts`: `25 reverts, 0 unproven, 35 unchecked`. Every case the round names is red under its revert: fresh start `Workbench.svelte:148`, badges `ActivityRail.svelte:253`, catalogue `Catalogue.svelte:95` and `:87`, glyph `navigation/rail.ts:36`, CRT `Appearance.svelte:94`, glyphs `Appearance.svelte:112`, status `StatusBar.svelte:48` and `:31`, bookmarks `ActivityRail.svelte:273`.
- `md5 config/layout.yml` gave `25a258cca122047c256e054379fdf5dd` and `md5 ~/.oculus/bookmarks.yml` gave `6bf9f6f0bfe27704f81c2da09f0493a2`, both the same before and after every run.
- `git diff 138afb83 --stat -- src/lib/server/core/context.ts src/lib/server/files/fs/bookmarks.ts` prints nothing: both files are back to base. `grep -rn "layoutFile\|layout\.yml" src/lib/server` shows the only writer of layout.yml is `writeRail` (`writes.ts:467`, `undo.ts:225`), the Settings save and its undo. So the server never writes layout.yml on its own.
- `ls -d $TMPDIR/oculus-* | wc -l` after: `7015`

## Spec

1. The move of the two manuals is now a manual landing step, and nothing books it.
   - After the round, no code moves `layout.yml`'s two bookmarks into a machine's bookmarks file. The key is deleted from `config/layout.yml` (the removed hunk ran from `-# The old home of two bookmarks...` to `-  - { label: "game-engine manual", ... }`). The only copy of the two entries left is the test fixture `tests/browser/helpers/serve.ts:209-235`.
   - `grep -n "cathedra\|game-engine" ~/.oculus/bookmarks.yml` prints nothing, so Axel's real file does not hold them.
   - The report's "Next" says "At landing: copy the two manuals into this machine's `~/.oculus/bookmarks.yml`". But `grep -n -i "manual.*bookmarks\|bookmarks.yml" orchestrator-state.md plan.md` finds no booking of that step.
   - Plan.md:151 rules that "The two `layout.yml` bookmarks move into the bookmarks file". Unless the copy is booked and done at landing, the two manuals leave Axel's rail. This is the premise conflict of the first review's Spec 1, closed as its option (a), and it holds only if the landing does the copy.
2. The catalogue's target is "the page on screen before the current one" (`layout.svelte.ts:100-103`, `savePages` sets `previous = store.current.current`). It is not "the page the reader was on before the Views and Settings page".
   - The two agree only while the catalogue sits on the Views and Settings page.
   - If Axel moves the Catalogue tab onto one of his own pages, a press there switches away from that page to whichever page was shown before it (`Catalogue.svelte:80-88`, `showTarget`).
   - The ruling says "the page the reader was on before switching to Views and Settings". The first HELP.md:15 replacement sentence says the same. No case covers the catalogue on any other page. This is from reading the code, not a run.

## Proof

1. The badges browser case proves less than its name. `tests/browser/workbench/pages.spec.ts:35-69` loops over five views, keeps those whose catalogue badge starts with a digit, and asserts only `expect(counted.length).toBeGreaterThan(0)`. It passes when one of the five rail buttons draws a badge. Tab order is proven only by the node cases (`tests/state/workbench/navigation/pages.test.ts:117`, `tests/shell/rail/rail.test.ts:151`).
2. `openDoc`'s `showTarget()` call (`Catalogue.svelte:102`) is under no revert. Both catalogue cases press a view. No case presses a document entry, and none presses shift on the first-rail-page fallback.
3. `bootFresh()` does not assert what a fresh browser draws before the rail list arrives. I ran a probe spec in a scratch copy: a MutationObserver over the `role="tab"` names under `bootFresh()`. It printed `SEEN ["","Status","Focus"]`. A browser with no saved layout first mounts the default Page 1 with the Status view, then replaces it with Focus once the config push lands (see Behaviour 1). With boot() seeding a Status page, every other spec starts past this point, so the flash is covered nowhere.
4. The report's Doc text quotes its current line in full only for HELP.md 7, 13, 15, 23, 32, 44, 50, 65, 161 and DESIGN.md 59. Every other entry quotes a fragment:
   - HELP.md 17 (by its opening words), 35, 36, 71, 123 and 169
   - DESIGN.md 46, 60, 71, 75, 149, 158, 160, 191, 193, 237, 243, 244, 245, 251, 256, 262, 267, 278 and 286

   I checked each quoted fragment against `sed -n` of the worktree's HELP.md and DESIGN.md. Each is present verbatim, and every HELP.md replacement applies (my scratch script asserted each one).

## Standards

1. Comments and case names the step makes false, not carried by item 8:
   - `tests/browser/helpers/rail.ts:152-153` (added in this step, `git diff 138afb83`): "which shows it at once as the strip of pages once did". This is history in a comment.
   - `tests/browser/workbench/pages.spec.ts:9`: "gives every test a context of its own, so each test starts on the first rail page." Six cases of that file call `boot()`, which starts on the seeded Status page (`grep -c "await boot(page)"` gives 6). Only one calls `bootFresh()`.
   - `tests/browser/shell/shell-defects.spec.ts:469`, case name "a tab activated from the rail is brought in whole..." The case opens the view through `openView`, the palette. The rail no longer activates a view's tab.
   - `tests/browser/workbench/kept-tabs.spec.ts:104-105`: "rather than a view opened from the rail, since walking the rail's menus presses Escape". The rail has no menus now.
   - `tests/browser/sources/view-source.spec.ts:2`: "it is opened from the rail on the demo hub". Line 16 opens it with `openView(page, 'radar', ...)`.
   - `tests/state/workbench/layout/pages.test.ts:251`, case name "...when that was the last in the strip": there is no page strip.
2. `src/lib/state/workbench/navigation/status.ts` holds the status bar's socket, usage, HPC and session words. That is not navigation. It sits in `navigation/` because that folder is what the shell's boundary row admits (`'state/workbench/navigation/**'`, widened in 67ad42f3). "Boundary rows unchanged" is true only because the module was placed under the glob the first delivery widened for the rail and the catalogue. The report does not name this placement as a structural choice.
3. The three shortcut strings now read "{0}, key {1}" (`config/text/ui.yml` `page_shortcut`, `workbench.yml` `catalogue_key`). No finding against them. `grep` over `config/text` finds no other " - " pattern in the round's strings.

The removed checks, judged:
- The Menu's `rail`, `stacked` and beside looks, and `menuPlacement` with its two "Menu placement" cases: dead code, not a guard.
  - Every remaining `<Menu` caller with `compact` passes `placement="down"`: PaneView, CardActions, SessionWorkspace, TerminalRows and files/tree/Controls.
  - `beside` was `compact && placement !== 'down'`, so no caller reached it.
  - Tooltip's `block` prop is still used by `TreeItem.svelte:217`.
- The config-folder case "names a root of its own for every bookmark, and a path under it" went with the key it read. No closure hides a defect.
- The 36 added `exact: true` lookups (`git diff 67ad42f3 -- tests/browser | grep -c "^+.*exact: true"`; 34 are Save or saved-message lookups) tighten matching. None was loosened. A Save button with a longer accessible name would turn them red, not green.

## Behaviour

1. A fresh browser flashes the Status page. The probe above shows the Status tab drawn and mounted before the Focus page replaces it (`SEEN ["","Status","Focus"]`). The Status view mounts and is torn down on every first load. Also, if the reader presses anything that saves (for example New page, or a tab close) before the config push lands, `fresh` is cleared (`layout.svelte.ts:390`) and the browser stays on the unowned "Page 1". That rule is stated, but the window in which it can happen is not.
2. The catalogue target when the Catalogue tab lives on another page: see Spec 2.
3. Before a rail page is made, its button draws the badges of the arrangement's views (`navigation/pages.ts` `railPageViews`). But the first press may adopt an existing keyless page named after the label (`layout.svelte.ts:270` onward), whose views differ, for example Axel's older "Sessions" page. From then on the badges change to that page's views. The report states the adoption rule and the before-first-press reading separately, not this interaction.
4. Shift-press and the fallback: a shift-press after a load straight onto Views and Settings makes the first rail page, shows it and opens beside there. I read this from `Catalogue.svelte:80-97`; no run covers it (Proof 2).
5. Status words: "server: up / down / waiting", "usage: ...", "HPC: ...", "live sessions: N", "unsaved tabs: N" (`config/text/views/system/workbench.yml`). The last two are the ruled words. The socket item says "server". The ruling names the socket state, not a word, so this is not a finding.

## Not checked

- Nothing was looked at on screen in Axel's Chrome. How the rail badges fit on a 98 px button when a page holds several counted views (Info/more, Academic Life) was not seen.
- revert-check was not rerun over the other 13 browser specs the round changed (board, collection, focus-buttons, boot, icons, keyboard, files-forms, files, history, layout, nested, tabs, unsaved-forms), nor over the round's other changed node files. The report's 84-revert and 176-revert runs are not reproduced.
- The DESIGN.md Doc text was not applied to a copy. Nothing tests DESIGN.md, and its entries were checked by reading them against the code.
- `node bin/diagrams.mjs` was not rerun to compare the regenerated docs/diagrams.
- `RailEditor.svelte` and `Pages.svelte` were read only where the round's delta touches them.

## Usage

About 150k tokens of context and 45 tool calls. The wall time went mostly to the full browser run (6.7 min), the browser revert-check (about 10 min), the node suite (84 s) and the scratch help run (53 s).

## Closed

The first run's findings, closed in repair round 1 (`agents/reviews/L3-report.md`, "# Repair round 1") unless named otherwise:

- Spec 1, the server rewriting the tracked `config/layout.yml`: the move and its call are removed and the key is gone from the file; the two manuals were copied into this machine's `~/.oculus/bookmarks.yml` at landing.
- Spec 2, a fresh browser on a page no button owns: it starts on the first rail page.
- Spec 3, status words chosen for the tests: "unsaved tabs" and "live sessions", as ruled, with exact selectors.
- Spec 4 and Spec 6, the rail badges and the catalogue's target: ruled by Axel, both (a), built as items 12 and 13.
- Spec 5, page reordering gone: kept, stated.
- Proof 1 and Standards 1, three rail parsers and an unknown glyph drawn: one parser with the glyph check, cases for both.
- Proof 2, the Confirm block exempted: folded into `ui/controls/CloseQuestion.svelte`, the allowance removed.
- Proof 3, the boundary widenings: kept, explained.
- Proof 4, the CRT and glyph toggles unpressed: browser cases for both.
- Standards 2, 3, 6, false strings and comments: reworded; the lines left on purpose are listed in the round's report.
- Standards 4, incomplete Doc text: completed.
- Standards 5, a spaced hyphen as a dash: reworded to "{0}, key {1}".
- Standards 7, the status bar placed as a view: moved under `src/lib/shell/status/`.
- Behaviour 1 and 3: before and after stated in the round's report.

The run over repair round 1, closed at landing on 2026-09-23:

- Spec 1, the two manuals' move unbooked: done at landing; `~/.oculus/bookmarks.yml` lists `settings.json`, `cathedra manual` and `game-engine manual`, parsed back with yaml, the file as it was kept in the session's scratchpad.
- Spec 2, the catalogue's target read as the page before the current one: a press opens on the previous page only when the catalogue sits on its own rail page, whose arrangement holds it (`onCataloguePage` in `state/workbench/navigation/catalogue.ts`, `nodeHolds` reading the arrangement under its `root`); a catalogue moved onto another page opens on that page. Node cases and a browser case, each red under its revert.
- Proof 1, the badge case passing on one counted view: it also checks the Projects button's badges in tab order and that the badge row sits under its button.
- Proof 2, the document entry and the shift fallback unpressed: a browser case for each, red under its revert.
- Proof 3 and Behaviour 1, a fresh browser mounting the Status page before Focus: the shell draws no page while a browser with no saved layout waits for the rail list (`configured` from the page, `startingFresh` and `keepDefaultPage` in the layout store); a browser case records every tab drawn from the first paint and finds no Status tab; node cases for the wait.
- Proof 4, Doc text quoting fragments: every fragment was present verbatim and applied; no change needed.
- Standards 1, six stale comments and case names: reworded.
- Standards 2, the status words module under `navigation/`: kept; `state/workbench/` holds ten items, so a module of its own there would break the folder rule.
- Behaviour 3, badges changing after a page is adopted: stated in the landing report.
- Found at landing, in the look: the rail badges sat over the button's name ("Projects" hidden under 52 16 25); they are now a row of their own under the button, and the badge case asserts it, red under its revert.
