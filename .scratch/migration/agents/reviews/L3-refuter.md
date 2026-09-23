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
