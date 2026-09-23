Everything in the brief is done.

Two things the orchestrator must know first:
- The whole browser suite has not been run over the final tree. It ran once mid-step: 277 passed and 16 failed, all 16 because they expected the old mount behaviour. Those 16 were fixed, and every spec this step adds or changes was run afterwards and passed. Specs this step did not touch were not rerun after the last source changes (Section.svelte, ignored.ts sending bare names, the filter case).
- The path list was widened. Item 4 (keep a tab mounted) makes hidden views reachable by keys and makes several comments false, so I edited files outside the brief's paths. They are listed under "Judgment calls", point 1.

## DONE / NOT DONE

| Item | State | Proof (command, then output) |
|---|---|---|
| 1. Hidden and ignored toggles | DONE | `npx vitest run tests/server/files/ignored.test.ts`: 9 passed. Revert-check over ignored.test.ts: every case red, 0 unproven. Browser cases in files-sections.spec.ts (toggles, re-read on flip, filter over toggled listing) are red under their reverts ("16 reverts, 0 unproven" for kept-tabs, session-tabs and files-sections). |
| 2. One bar in a source tab | DONE | source.test.ts "draws Save, Revert, Preview and the star on the pane bar in that order…" is red under revert `Source.svelte:117 => {#if false}`. source.spec.ts "…sit on the pane bar in one row, and the editor draws no bar" is red under the same revert. |
| 3. Dev server stale cache | DONE, as an audit | `package.json:7` is now `"dev": "vite dev --force"`. `npx vitest run tests/server/core/dev-server.test.ts`: 1 passed, 8.43s. The case is named "audits that…" because no revert turns it red (see "What item 3 found"). |
| 4. A tab stays mounted once shown | DONE | kept-tabs.spec.ts has 5 cases, all red under their reverts. Memory measured, see below. |
| 5. The two add controls always drawn | DONE | files-sections.spec.ts case is red under each of `Notes.svelte:73 => delete`, `Bookmarks.svelte:75 => delete` and `TreeItem.svelte:229` revert. |
| 6. Refresher words | DONE | usage.test.ts: 12 passed. The 4 new directives are red. |
| 7. A terminal and a transcript per tab | DONE | session-tabs.spec.ts: 5 cases, all red. sessions.test.ts fresh-tab case is red under `Terminal.svelte:112 => const fresh = false;`. |

Verification list, run from the worktree:
1. `npx vitest run --reporter=dot`: `Test Files 276 passed (276)`, `Tests 4474 passed (4474)`.
2. `npm run check`: `COMPLETED 1291 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
3. `npm run build`: exit 0.
4. `npm run format:check`: `All matched files use Prettier code style!`
5. `npm run lint`: exit 0.
6. The perl ASCII gate printed nothing (`| wc -l` gave 0).
7. `sh bin/size-check.sh`: exit 0. `sh bin/folder-check.sh`: exit 0.
8. After `npm run build`, `npx playwright test` over:
   - tests/browser/workbench: `87 passed (2.7m)`.
   - files-sections, source, files-forms, files, show-in-files, appearance, keyboard, tinted, views and changes: `89 passed (2.2m)`. The one ✘ printed there is the existing `test.fail()` case at files-forms.spec.ts:632, which counts as passed.
9. `node bin/revert-check.mjs`:
   - Node test files: `49 reverts, 1 unproven, 248 unchecked`. The one line marked GREEN was the old ignored.ts:32 directive. That case was rewritten, and a rerun over ignored.test.ts gave every case red.
   - Browser files: `44 reverts, 3 unproven` on the first run. The 3 unproven said "the case did not run", while another run held port 8792. A rerun of those three files gave `16 reverts, 0 unproven, 4 unchecked`.
   - Unchecked cases are existing cases with no directive.
10. `ls -d $TMPDIR/oculus-* | wc -l`: 7015 before, 7015 after.

## Item 4 memory (ten open tabs in one pane)

The script was a scratch Playwright script run against `node tests/browser/helpers/serve.ts`, with CDP `HeapProfiler.collectGarbage`, `Runtime.getHeapUsage` and `Memory.getDOMCounters`. It ran three times on each build. "Before" is the same tree with the original PaneView.svelte put back and rebuilt. The tabs were Status, Focus, Projects, Coauthor, Archive, Pillars, Domains, Map, Lit Watch and Position Leads, each shown once.

| | JS heap used | DOM nodes | JS listeners | Views mounted |
|---|---|---|---|---|
| Before (only the active tab mounted) | 10.23–10.25 MB | 4023 | 216 | 1 |
| After (keep-alive) | 14.45–14.47 MB | 13164 | 683 | 10 |

So ten mounted tabs cost about 4.2 MB of heap, 9,141 more DOM nodes and 467 more listeners. There is no cap. Hidden views keep their effects and subscriptions running (for example a hidden Terminal's pty stream and a Transcript's follow). CPU cost was not measured.

## What item 3 found

- I could not reproduce a stale state that `--force` fixes.
- In Chrome, fresh servers, and servers restarted under an open tab, served compiled CSS with and without `--force`: the layout `<style>` parsed to 2 rules and the body font was system-ui.
- What did reproduce was requesting the layout's style module (`/src/routes/+layout.svelte?svelte&type=style&lang.css`) before the layout component itself. That answer is the raw `.svelte` source, and `vite-plugin-svelte:load` logged "failed to load virtual css module". The server keeps that raw answer until it restarts, even after the component is compiled. A fresh `vite dev --force` does exactly the same.
- So `--force` does not prevent the one failure I did reproduce. Whether this is the white page Axel saw is not verified.
- The test runs in a copy of the engine with its own node_modules folder of links, so `--force` never rebuilds the checkout's cache under a running dev server.

## Judgment calls the brief did not cover (each reversible)

1. **Paths widened.** Reason and file for each:
   - Hidden views must not take keys: `shell/keys/key-dom.ts` (search, cursor and scroll now act only inside the shown view), `boards/focus/QuickAdd.svelte` and `shared/forms/NewIdeaForm.svelte` (Escape acts only when the form is visible).
   - Comments the change made false: `state/client/instance-context.ts`, `state/forms/form-drafts.svelte.ts`, `boards/editor/Editor.svelte`, `sources/note/Note.svelte`.
   - Session opens that now name their session: `shared/card/CardSessions.svelte`.
   - Test helpers: `helpers/rail.ts` gains `SHOWN_VIEW`; `helpers/hub.ts` gains `writeTranscript`, which changes.spec.ts now shares.
   - Allow lists: `tests/checks/tree/allow-negatives.ts` and `allow-duplication.txt`.
2. **Allow lists.**
   - allow-negatives: 3 entries removed, because their absence assertions are gone.
   - allow-duplication: the 3 `d731d44fc2e5` entries are removed, because the shared section head is folded into the new `sections/Section.svelte`.
   - allow-duplication, one entry re-recorded: the existing Bookmarks/Notes closing-tag clone (`edef7239e57a`) now carries mark `33b85f55f7fb`. The same pair and the same 8 closing lines are allowed as before; only `</TreeSection>` became `</Section>`. Please look at this line.
3. **Terminal.**
   - A tab opened with no state (from the rail) still follows the rail's selection, and the pin control is kept.
   - The `new terminal` tab carries `{ id: <uuid> }` so it is a separate tab and shows the start form.
   - A start makes the started terminal that tab's own (`{ session, label: <kind> }`) and no longer moves the rail selection, so one terminal is not drawn in two tabs.
   - The other terminal openers (resume, UpdateTray, ProjectCard, Latex, DatasetCard) are unchanged: they select and open the following tab.
4. **CardSessions** keeps its "only when no session view is open" rule, and now names the session it opens.
5. **Refresher wording.**
   - Stale line: now `ok, figures fetched at {0}; Claude Code renews them after five minutes`.
   - New keys: `refresher_ok_last` for when the cadence has not arrived yet, and `refresher_ok_bare` for before any refresh time exists.
   - `refresher_running` is removed.
6. **Toggles** show their words (`hidden files`, `ignored files`), not glyph-only controls.
7. **Listing while loading.** A folder under a pair of toggles not yet answered shows another pair's held listing until its own answer lands. `relist(pair)` re-reads every folder held under that pair, in all tabs.
8. **check-ignore gets bare names.** A trailing slash on a linked folder makes git refuse the whole run ("pathspec … is beyond a symbolic link"). A link to a folder is therefore a file to git, so a `linked/` pattern does not hide it.
9. **Answer shapes moved.** `Listing`, `FileText` and the other answer shapes, plus the `NO_*` defaults, moved from fs.svelte.ts to fs-transport.ts to keep fs.svelte.ts under 900 lines (now 883). They are re-exported under the same names.
10. **Source bar.** Save, Revert and Preview draw only while the editor is drawn. The saved/failed word comes after the star and the program button.

## Before and after, for the look

- **Files view header**
  - Before: workspace menu and `+ root`.
  - After: plus `hidden files` and `ignored files` toggles, both off. To check: turn on hidden, and dotfiles, `.git` and `node_modules` appear. With ignored off, gitignored entries (for example under the hub, `.agents/worktrees`) are gone; turn it on and they return.
- **Files, Notes and Bookmarks heads:** `+ note` and `+ bookmark` are now drawn at full strength with the pointer elsewhere. Root and row controls still show only on hover. The Workspaces head is unchanged.
- **Source tab (README.md)**
  - Before: star in the pane bar, then a second row with Save, Revert and Preview.
  - After: one bar reading Save, Revert, Preview, star, then the program button if there is one, then the saved word.
- **Any pane:** switch away from a tab and back. The view comes back exactly as left (scroll, open forms, editor) and nothing reloads.
- **Usage card:** before `refresher: running`; after `refresher: ok, last HH:MM, next HH:MM`.
- **Terminal tab:** a `new terminal` control opens another Terminal tab showing the start form.
- **Session list:** the Transcript item on two sessions gives two tabs, each named after its session. The detail view's transcript button and a card's session press open tabs named after the session.

## Files changed (+added / −removed)

New:
- src/lib/server/files/fs/ignored.ts (79)
- src/lib/shell/panes/TabView.svelte (52)
- src/lib/views/sources/files/sections/Section.svelte (61)
- tests/browser/workbench/kept-tabs.spec.ts (134)
- tests/browser/workbench/session-tabs.spec.ts (152)
- tests/server/core/dev-server.test.ts (182)
- tests/server/files/ignored.test.ts (211)

Changed, config and package:
- config/text/views/sessions/terminal.yml +2/−0
- config/text/views/sources/files.yml +4/−0
- config/text/views/sources/source.yml +0/−1
- config/text/views/system/usage.yml +4/−2
- package.json +1/−1

Changed, src:
- server/files/fs.ts +62/−16
- shell/keys/key-dom.ts +19/−6
- shell/panes/PaneView.svelte +31/−21
- state/client/instance-context.ts +5/−6
- state/forms/form-drafts.svelte.ts +7/−7
- state/sources/fs-transport.ts +127/−5
- state/sources/fs.svelte.ts +95/−108
- state/sources/fs.ts +73/−25
- ui/tree/TreeItem.svelte +9/−3
- ui/tree/TreeSection.svelte +18/−1
- views/boards/editor/Editor.svelte +2/−2
- views/boards/focus/QuickAdd.svelte +6/−3
- views/sessions/session-detail/SessionDetail.svelte +3/−2
- views/sessions/session-list/SessionList.svelte +2/−1
- views/sessions/terminal/Terminal.svelte +44/−6
- views/shared/card/CardSessions.svelte +6/−2
- views/shared/forms/NewIdeaForm.svelte +5/−2
- views/sources/files/Files.svelte +45/−40 (536 lines)
- views/sources/files/sections/Bookmarks.svelte +11/−15
- views/sources/files/sections/Notes.svelte +10/−14
- views/sources/files/sections/Workspaces.svelte +6/−16
- views/sources/files/tree/Controls.svelte +24/−6
- views/sources/files/tree/ShowPath.svelte +3/−1
- views/sources/note/Note.svelte +4/−3
- views/sources/source/Editor.svelte +7/−50
- views/sources/source/Source.svelte +37/−17
- views/system/usage/Usage.svelte +23/−2

Changed, tests:
- browser/helpers/forms.ts +4/−3
- browser/helpers/hub.ts +40/−0
- browser/helpers/rail.ts +7/−0
- browser/shell/appearance.spec.ts +2/−2
- browser/shell/keyboard.spec.ts +3/−3
- browser/shell/tinted.spec.ts +2/−2
- browser/shell/views.spec.ts +6/−6
- browser/sources/files-forms.spec.ts +13/−13
- browser/sources/files-sections.spec.ts +122/−1, plus the filter case
- browser/sources/files.spec.ts +3/−3
- browser/sources/show-in-files.spec.ts +1/−1
- browser/sources/source.spec.ts +41/−5
- browser/views/changes.spec.ts +3/−27
- browser/workbench/unsaved-forms.spec.ts +12/−11
- checks/tree/allow-duplication.txt +1/−4
- checks/tree/allow-negatives.ts +0/−3
- checks/tree/duplication.test.ts +1/−1
- routes/files/fs.test.ts +22/−17
- server/files/fs.test.ts +14/−0
- shell/keys/key-dom.test.ts +25/−8
- state/sources/explorer.test.ts +23/−2
- state/sources/fs-shape.test.ts +16/−0
- state/sources/fs.test.ts +86/−7
- views/sessions/sessions.test.ts +12/−0
- views/sources/files/files.test.ts +2/−2
- views/sources/source.test.ts +39/−16
- views/system/usage.test.ts +43/−6
- views/whole/type-scale.test.ts +3/−2

Existing revert directives whose target lines moved were re-pointed to the same line text; these are the one-line changes in files.spec, show-in-files, views.spec, files-forms, duplication.test, explorer, fs.test and files.test.

## Doc text

**DESIGN.md:114** (`**Git.** Exactly nine read-only command forms …`). Append after "list arguments only.":
> The file browser runs one more read-only form of its own, outside that module: `git -C <folder> check-ignore --stdin -z` in `server/files/fs/ignored.ts`, one run per listed folder with a five-second timeout, which leaves out of a listing what the repository ignores unless the request carries `ignored=1`; a folder in no repository, a missing git or a failed run leaves out nothing.

**DESIGN.md:140** (`… The shell renders the layout tree and mounts whatever view instance a pane names. …`). Replace that sentence with:
> The shell renders the layout tree and mounts the view of every tab a pane has shown, the active one drawn and the rest hidden (`shell/panes/TabView.svelte`), until the tab closes or leaves the pane; a tab never shown mounts nothing, and there is no cap.

**DESIGN.md:244**, in the sentence `A source tab over a Markdown file splits under its toolbar …` and `the toolbar's toggle decides …`:
- Replace "its toolbar" with "the pane's bar".
- Replace "the toolbar's toggle" with "the bar's Preview toggle".
- Add: "Save, Revert, Preview and the file's star share that one row, then the program button; the editor draws no bar of its own."

**DESIGN.md:267**, three edits:
- Replace "since after a tab switch the view's `instance` prop reads the tab the pane shows now" with "since the answer may land after the tab closed or the form was reopened".
- Replace "The pane puts the reader of the instance it mounts into a component context" with "Each tab view a pane mounts puts the reader of its instance into a component context".
- Replace "so a browser whose tab is not shown, or a page drawing none, is closed with the rest" with "so a browser in a tab never shown, or on a page drawing none, is closed with the rest".

**DESIGN.md:268**, four edits:
- "the row's controls (transparent until the row is hovered or holds the focus, …)" becomes "the row's controls (transparent until the row is hovered or holds the focus, except a section head given `showActions`, which the Notes and Bookmarks heads are, drawn at full strength always; …)".
- "The Files view's header carries the workspace menu and the add-root control, so both exist in every state." becomes "The Files view's header carries the workspace menu, the add-root control and the two toggles `hidden files` and `ignored files`, so all exist in every state."
- "Its instance keeps `expanded`, …" gains ", `hidden` and `ignored` (both false by default, sent as `hidden=1` and `ignored=1` on each listing, each pair of them a listing of its own in the fs store, and a flip re-reads every folder held under the pair it names through `relist`)".
- "The filter walks every listing already read" becomes "The filter walks every listing already read under the tab's toggles".

**HELP.md:86** (`… The view's header carries the workspace menu and the add-root control. …`). Replace that sentence with:
> The view's header carries the workspace menu, the add-root control and two toggles, off until pressed and kept per tab: `hidden files` lists dotfiles and the `node_modules`, `__pycache__` and `.git` folders, and `ignored files` lists what git ignores in a repository.

Also replace "Under a filter over the folders already read" with "Under a filter over the folders already read, as the toggles list them". Also, after "then the Bookmarks, Notes and Workspaces sections.", add: "The Notes and Bookmarks heads draw their add control at all times."

**HELP.md:101–103**, replace the three rows' descriptions:
- `session-detail`: "One session in a tab of its own: what it is doing, its model, its workspace and its controls."
- `terminal`: "A terminal running Claude, Codex or a shell inside tmux. The bar's `new terminal` control opens another Terminal tab, which starts a terminal of its own; a tab keeps the terminal it started or was opened on."
- `transcript`: "One session's turns as they were written, one tab per session."

**HELP.md:111** (usage row). Append: "Each Claude account's refresher reads `ok, last HH:MM, next HH:MM`, the next at `usage_refresh_min` of `behavior.yml`, and `refreshing` only while a refresh runs."

**HELP.md:191** (`` `npm run dev` runs it in development; …``). Replace with:
> `npm run dev` runs it in development, rebuilding vite's dependency cache as it starts;

**HELP.md** (general, after line 65 or in the workbench section). Add:
> Switching tabs keeps each tab's view as it was left: a pane keeps the view of every tab it has shown until that tab closes.

# Repair round 1

Repair round 1 for Q65: all twelve findings are fixed as ruled or answered with measurements.

Two things need the orchestrator's attention:
- **Terminal in item 9 is not fully measured.** In the served layer, starting a shell behind a real, isolated tmux fails. The page gets `400 {"error":"the terminal did not start: 91f787-shell"}`, even though the tmux sessions exist and `listTerminals()` finds them when I run it by hand with the same PATH. I did not find the cause. Only an idle Terminal tab (no terminal started) was measured.
- **The `check-ignore` run is now synchronous.** Routing it through `git.ts` means it uses that module's one `spawnSync` call site. A listing on a slow mount can now block the server for up to the 5 s timeout, the same as the other git reads.

## What each finding came to

**1. Style module requested before its component: fixed.**
- Fix: new `src/lib/server/core/style-first.ts`, registered as the first plugin in `vite.config.ts:15`. Before the Svelte plugin answers a `?svelte&type=style` id, it has the asking environment run `transformRequest` on the parent component, so the compiled CSS exists.
- `this.load({ id })` does not work for this: `vite-plugin-svelte:load` still logged "failed to load virtual css module" with it.
- `tests/server/core/dev-server.test.ts` has two cases:
  - Client path: `npm run dev` in an engine copy, style module requested first, then again after the component.
  - SSR path: a middleware-mode server calling `ssrLoadModule('/src/routes/+layout.svelte?inline&svelte&type=style&lang.css')` first.
  - Raw is told from compiled by "starts with `<script` or holds a `<style` tag", not by `scrollbar-width`.
- Before the fix both cases failed (`AssertionError: expected true to be false`, twice). After it: `Tests 2 passed (2)`. `node bin/revert-check.mjs tests/server/core/dev-server.test.ts` gives `2 reverts, 0 unproven, 0 unchecked`, red under `vite.config.ts:15 => delete`.
- `--force` is dropped, because no case shows it is needed. `package.json:7` is back to `"dev": "vite dev"`.

**2. A confirm in a hidden tab no longer blocks the workbench keys.**
- `workbench-keys.svelte.ts:69` and `:124` now call `dialogShown()`. It counts only an `[role="alertdialog"]` not inside a `[data-tab-view][hidden]`.
- New case in `kept-tabs.spec.ts`: remove-root confirm open, Ctrl+1, then Ctrl+] must cycle. It is red under `workbench-keys.svelte.ts:239 => (one) => one !== null`.
- The node fake document in `tests/shell/keys/workbench-keys.test.ts` now answers `querySelectorAll`.

**3. Tab-switch cases.**
- New helper `reloadAndShow` in `tests/browser/helpers/forms.ts`.
- Cases that claim state lives in the instance now reload instead of switching. Each is red under `ui.svelte.ts:252 => delete` (the storage write) or its existing `fs.ts` line revert:
  - files-forms: the root form (renamed "…after a reload"), the refused root, the bookmark outcome line.
  - unsaved-forms: the card's edit form, the manifest editor, the Venues add form.
  - source.spec: the unsaved edit.
  - Two cases that already reloaded now also carry the storage directive.
- Cases whose claim is the switch itself keep the switch:
  - "a root added while the tab is switched away": red under `Files.svelte:299 => delete`.
  - "a bookmark added while …": red under `Files.svelte:363 => delete`.
  - "an add form whose tab was switched away…": red under its existing `form-drafts.svelte.ts:273` directive.
- Browser revert-check over kept-tabs, files-forms, unsaved-forms, source and map: every changed case red. The one unproven case, the existing Map case, is covered under item 5.

**4. `check-ignore` now runs through `server/git/git.ts`.**
- New export `ignoredIn(root, names, timeout = TIMEOUT_MS)` goes through `run()`, the module's one call site, which gained an `input` parameter. It keeps the 5 s timeout and returns nothing ignored on any failure.
- `fs/ignored.ts` is deleted. `listShown` and `handleFs` are synchronous again, so `tests/routes/files/fs.test.ts` matches base.
- `git.test.ts`:
  - `check-ignore` is added to `ALLOWED`, `PINNED` and `PINNED_SOURCE`.
  - New case "names the entries the repository ignores, and leaves it as it was", red under `git.ts:145`.
  - The source-vector gate is renamed "…pinned five…" and is red under `git.ts:217`.
  - The whole-file gate is renamed "audits that nothing but those commands ran over this whole file…". It fails when run alone even without a revert (`vitest -t` gave `1 failed`), so no revert-check run of it can prove anything.

**5. Map labels: the defect was real and is fixed.**
- New case in `map.spec.ts`: Map shown, switch to Status, grow the text six steps, switch back, no drawn labels overlap. Before the fix it failed with `+ "project::tensor-sketch line::graphs"`.
- Fix: `onShown()` in `views/structure/map/labels.ts` uses a ResizeObserver that measures only when the drawing comes back from width 0. Graph calls `$effect(() => onShown(svg, measure))`.
- It fires only on the way back from zero, so the existing "labels after the text grows" case stays red under its own revert (`Graph.svelte:126`).
- Proof: `node bin/revert-check.mjs tests/browser/views/map.spec.ts` gives `2 reverts, 0 unproven`.
- One earlier run of `map.spec.ts` had "a pressed type chip…" time out at 30 s. After that: `--repeat-each=3` gave `15 passed`, and the final whole suite passed.

**6.** `form-drafts.svelte.ts` comment rewritten. It now says the form may be in a tab never shown, on a page not drawn, or drawn anew since the save went, while the request is still out.

**7.** The finding's comment in `ignored.ts` is gone with the file. The comments I rewrapped are in `fs.ts`, `labels.ts` and the spec headers. The comment-width check passes (part of `Tests 4475 passed`).

**8. Reverts for the two unchecked cases.**
- `usage.test.ts` "renders the refreshing … only then" is red under `Usage.svelte:155 => if (refresher.state !== 'down') {`.
- `source.test.ts` "draws the highlight mirror … no control row" is red under `Editor.svelte:144 => <div role="toolbar"></div><div class="row" bind:this={box}>`.

**9. What a hidden tab keeps doing: one minute each, shown against hidden.**
- Setup: a scratch Playwright/CDP script against the served build. Page ms are CDP `TaskDuration`. Server CPU is `ps` time of the server process. `check-ignore` runs were counted by a logging `git` wrapper.

| Tab | Page task ms | HTTP requests | Socket frames | Server CPU s | `check-ignore` runs |
|---|---|---|---|---|---|
| Files, 4 folders open, quiet minute, shown | 31 | 0 | 1 | 0.05 | 0 |
| Files, same, hidden | 43 | 0 | 1 | 0.05 | 0 |
| Files, one bookmark written in the minute, shown | 77 | 9 | 3 | 0.49 | 4 |
| Files, one bookmark written in the minute, hidden (two runs) | 80 / 77 | 9 / 9 | 2 / 3 | 0.44 / 0.42 | 4 / 4 |
| Transcript, a line appended every 5 s, shown | 211 | 24 | 25 | 1.28 | 0 |
| Transcript, same, hidden | 127 | 24 | 25 | 1.19 | 0 |
| Terminal, idle with no terminal | 30 | 0 | 1 | 0.07 | 0 |

- A hidden tab does the same network and server work as a shown one. A hidden Files tab re-reads every open folder, with one `check-ignore` each, on every write that moves the store's round.
- A running Terminal was not measured (see the top of this report). I removed my isolated tmux server and its socket folder afterwards.

**10. Changes a reader sees, before and after.**
- Starting a terminal: before, a start from the Terminal form also selected the new terminal in the rail. After, the terminal becomes that tab's own and the rail selection is left as it was.
- Stale refresher line: before `refresher: running, figures fetched at HH:MM; Claude Code renews them after five minutes`. After `refresher: ok, figures fetched at HH:MM; Claude Code renews them after five minutes`.
- Tab switches: before, switching tabs threw away an open confirm, an open form's component state and any scroll position. After, all three survive the switch and are there when the tab is shown again (for example the Files remove-root confirm).

**11. Rail and palette opens.** Opening Transcript or Session from the rail or the palette still carries no state. It shares one tab that follows the selected session, which is kept as it was. This is the same as the Terminal tab opened from the rail. Every in-view open (session list, session detail, project card) names its session and gets a tab of its own.

**12.** Measured with `wc -l`: `885 src/lib/state/sources/fs.svelte.ts`. Other files: `Files.svelte` 536, `Graph.svelte` 536, `git.ts` 487.

## Verification over the final tree
- `npx vitest run --reporter=dot`: `Test Files 276 passed (276)`, `Tests 4475 passed (4475)`.
- `npm run check`: `0 ERRORS 0 WARNINGS`.
- `npm run build`: exit 0. `npm run format:check`: `All matched files use Prettier code style!` `npm run lint`: exit 0.
- ASCII gate prints nothing. `size-check`: exit 0. `folder-check`: exit 0.
- Whole browser suite `npx playwright test`: `308 passed (6.7m)`. The one ✘ printed is the existing `test.fail()` case at `files-forms.spec.ts:633`.
- Revert-check:
  - Node (dev-server, ignored, server fs, git, workbench-keys, usage, source, negatives, duplication): `39 reverts, 0 unproven`.
  - Browser (kept-tabs, files-forms, unsaved-forms, source): all red.
  - Map: `2 reverts, 0 unproven`.
- `ls -d $TMPDIR/oculus-* | wc -l`: 7015 before and 7015 after.

## Files changed this round (+ added / − removed, against base)
- New: `src/lib/server/core/style-first.ts` (43).
- Deleted: `src/lib/server/files/fs/ignored.ts`.
- `package.json`: back to base.
- `vite.config.ts` +5/−1
- `src/lib/server/git/git.ts` +30/−3
- `src/lib/server/files/fs.ts` +66/−15
- `src/lib/shell/keys/workbench-keys.svelte.ts` +13/−2
- `src/lib/state/forms/form-drafts.svelte.ts` +10/−10
- `src/lib/views/structure/map/Graph.svelte` +4/−0
- `src/lib/views/structure/map/labels.ts` +15/−0
- Tests:
  - `tests/server/core/dev-server.test.ts` (231 lines)
  - `tests/server/files/ignored.test.ts` (185 lines)
  - `tests/server/git/git.test.ts` +24/−5
  - `tests/shell/keys/workbench-keys.test.ts` +6/−3
  - `tests/browser/helpers/forms.ts` +19/−4
  - `tests/browser/sources/files-forms.spec.ts` +28/−27
  - `tests/browser/workbench/unsaved-forms.spec.ts` +21/−22
  - `tests/browser/sources/source.spec.ts` +42/−7
  - `tests/browser/views/map.spec.ts` +21/−1
  - `tests/browser/workbench/kept-tabs.spec.ts` (159 lines)
  - `tests/checks/tree/allow-negatives.ts` +0/−5 (five stale entries)
  - `tests/views/system/usage.test.ts` +44/−6
  - `tests/views/sources/source.test.ts` +40/−16
  - `tests/views/whole/type-scale.test.ts` +4/−3
- `tests/routes/files/fs.test.ts` is back to base.

## Doc text that changed from round 0
- **DESIGN.md:114.** Replace my round-0 "append" with these edits to the paragraph:
  - "Exactly nine read-only command forms over eight subcommands (" becomes "Exactly ten read-only command forms over nine subcommands (".
  - Add "`check-ignore --stdin -z`" to the list.
  - After "list arguments only.", add: "The file browser's listing asks the same call site which of a folder's entries the repository ignores (`ignoredIn`), and a failure leaves out nothing."
  - "`branch`, `symbolic-ref` and `worktree`, which have writing forms, and `rev-parse`" becomes "`branch`, `symbolic-ref` and `worktree`, which have writing forms, `rev-parse` and `check-ignore`".
- **HELP.md:191.** Drop the earlier replacement. `npm run dev` is unchanged. Instead add after that sentence: "In development a component's stylesheet is always served compiled, whichever the page asks for first."
- **DESIGN.md, the Shell or Map text.** Add: "A view kept hidden draws at no size; the Map measures its labels again when its drawing comes back to a size (`onShown` in `views/structure/map/labels.ts`)."
- Every other Doc text line from round 0 stands.
