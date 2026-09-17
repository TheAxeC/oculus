# Step D22 refuter report (on .agents/worktrees/d22, base 91fb46cb)

## Verification (rerun by the reviewer)
All commands were run from `tools/oculus` in the worktree. The worktree's diff is still 17 files, 476 insertions and 58 deletions, plus 4 untracked files. The builder's report quotes 469/52, taken before its last comment rewraps.
- `npx vitest run --reporter=dot`: `Test Files 247 passed (247)`, `Tests 4149 passed (4149)`, exit 0. No timing test timed out.
- `npm run check`: `COMPLETED 1213 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `npm run lint`: exit 0.
- `npm run format:check`: `All matched files use Prettier code style!`.
- ASCII gate (the perl form): printed nothing, exit 0.
- `find src tests bin -type f | xargs wc -l | sort -n | tail -3`: `tests/state/layout.test.ts` 970 and `tests/state/board.test.ts` 980. `wc -l` gives `fs.svelte.ts` 809, `layout.svelte.ts` 930, `Files.svelte` 585, `fs.ts` 665.
- `npm run build`: exit 0.
- `npx playwright test` over show-in-files, files, files-forms and cards: `50 passed (1.3m)`. The first attempt found port 8792 in use by another run; it was retried after waiting, and nothing was signalled or deleted.

## 1. Spec
- **People folder (not done, premise wrong, confirmed).**
  - `config/sources.yml:41` reads people through `people_file`. The `collections:` list at `config/sources.yml:48-59` has no people entry, and a person's `folder` is drawn only at `src/lib/views/Person.svelte:192-213`.
  - Closing it touches:
    - `views/Person.svelte`: a control in the `data-block="folder"` section calling `layout.showInFiles(folder)`. `folder` is already hub-relative, read at `Person.svelte:55-56` with `HUB_ROOT`.
    - `config/text/views/person.yml`: a label and a tip.
    - `tests/views/person.test.ts`.
    - A browser case that writes a `folder:` value into the served copy. `demo/registries/people.yml:15` declares the field, but no demo entry carries a value.
  - Both `Person.svelte` and `person.yml` are outside decision 5's paths, so this is a stop to book.
- **Venue cards (not done, outside the paths, confirmed).**
  - `src/lib/views/venues/VenueCard.svelte:61-62` draws `venue.link` as an external "site" link, and the card has no `CardActions`.
  - Closing it touches:
    - `VenueCard.svelte`: a control fed by `hubPathsOf({ link: venue.link })`. The site link's `external: true` would also need to depend on the same rule.
    - The venues text group.
    - `tests/views/venues.test.ts`.
  - Every one of the 62 `link:` values in the real `registries/venues.yml` is a web address, so no venue would show the control today.
- **Other fields (checked).** Of the real hub's non-web `link`/`folder` values, all sit in funding (6), events (3), education (5) and applications (12). All four files are EntryCard collections, so each value gets the control.
- **Rulings on the builder's decisions:**
  - Stricter path rule (`isHubPath`, `state/collection.ts:260`): consistent with how `hrefOf` already treats the same field. Side effect: a bare `www.example.org` or `~/data/x` counts as a hub path and would show "not there". The real hub has no such value.
  - Fields named, not schema-driven (`fs.ts:337` `PATH_FIELDS`): `url` is left out, although `collection.ts:244-247` serves a hub-path `url` as a hub anchor. The real hub has no non-web `url` value.
  - Filter cleared (`fs.ts:344-349`): what was typed is lost, and the report says so. Confirmed in the browser (section 4).
  - Target selected, not opened: matches the brief ("expanded to it, selected").
  - Three instance keys (`reveal`, `revealed`, `revealing`): they are saved with the layout, so the outcome line survives a reload until a row is selected. The reload was not verified. `found` is in the stored vocabulary (`fs.ts:217,289`) but is never stored (`fs.ts:408`).
  - The four outcome kinds: fine.
  - Ask waiting while the workspaces load (`Files.svelte:154-156`): the ask also waits while the workspaces read failed (`saved.error !== ''`), with no line of its own. It is answered whenever a later read succeeds, which selects a row long after the press. Not verified in the browser.
- **Maximised pane (brief item 1 and decision 1 not met; the builder lists it as a sharp edge, not a decision).**
  - With the page's Files tab in a pane behind a maximised pane, the press opens a second Files tab (`openInto` looks only inside the maximised pane, `layout.svelte.ts:785-789`).
  - The brief says the page's existing Files tab is focused. Measured in section 4.

## 2. Proof
- **Node reverts** (my copy, one test file each). These went red:
  - `sameAsk` dropped: 3 failed.
  - Filter kept: 1.
  - `readListing` calls `loadListing` directly: 1.
  - Scheme rule `://` only: 1.
  - No-schema `shows` dropped: 1.
  - `lineOf` empty: 3.
  - ProjectCard control dropped: 2.
  - Walk through a file: 1.
  - Expanded replaced by the ancestors only: 1.
  - `askOf` accepts an empty root: 1.
  - `revealScrolled` clears always: 1.
  - `openView` given an id state: 3.
  - Offline check dropped: 1.
  - `revealed` kept on a new ask: 1.
- **Browser reverts** (my copy, rebuilt for each). These went red:
  - `scrollIntoView` removed: `toBeInViewport() failed`.
  - `sameAsk` dropped: the superseded and after-close cases both red.
  - Roots not awaited (`Files.svelte:155`): 3 failed.
  - `selectRow` no longer clearing `revealed`: `toHaveCount failed`.
- `tests/state/show-in-files.test.ts:73-74` names the revert "open the view with openBeside". I applied it (`openBeside('files')` in `showInFiles`) and the file stays green, 27 passed. The builder's revert list does not include it.
- `src/lib/views/files/ShowPath.svelte:77-78`: removing the `revealScrolled` write leaves `show-in-files.spec.ts` green, 4 passed. Nothing proves that the ask is cleared after the scroll. If it were not cleared, the settled ask would keep re-running the scroll effect on every change to `rows` or the selection. That effect is not verified.
- In-flight, superseded and after-close are each proven in the browser: the held-listing spec, and the `sameAsk` revert turns both of those cases red.
- `tests/state/explorer.test.ts:55,185,193` are changed tests that name no revert (spec rule).

## 3. Standards
- `src/lib/views/files/refusal.ts:3-4` says "every code the endpoint refuses a workspace, a root or a note write with is named here". This is false: `handleFsWrite` (`src/lib/server/fs.ts:451-463`) also refuses with `origin`, `token`, `not-json` and `not-an-action`, which are not named.
- `src/lib/state/layout.svelte.ts:134-135`: "the Files tab of the page the reader is in is activated, or opened there when the page has none". False when a pane is maximised: a second tab is opened although the page has one (section 4).
- `config/glyphs.yml:147-149`: `show_in_files` sits directly under the pre-existing `# circled section numbers (inbox)` comment. That comment now reads as heading the new comment and glyph.
- `src/lib/state/fs.svelte.ts:99,401`: `OFFLINE = 'offline'` is a literal word. Through `files.reveal_unread` it would reach the outcome line; it cannot occur in a page, since `online()` is true there.
- `src/lib/state/fs.ts:311-337`: `hubPathsOf` and `PATH_FIELDS` are a card-field rule placed in the file browser's pure module. They import `collection.ts`, and the module's head comment (`fs.ts:1`, "what a name is, and what the tree draws") does not cover them. This is a cohesion note, not a failure.
- History in comments: none. `grep` over the added lines finds no package id or date; the dated names in tests are fixture folder names.
- Non-ASCII outside `config/glyphs.yml`: none (gate).
- File sizes: all under 1000; `Files.svelte` 585 is under about 600.
- Doc text:
  - The HELP.md line 85 text is given as "append". Line 85 is a table row, so it has to go inside the cell, before the closing `|`.
  - DESIGN.md:333 still lists the Files instance as keeping `expanded`, `selected`, `filter` and `collapsed`; the proposed new decision line does not amend it.
  - Otherwise the proposed lines match the code.

## 4. Behaviour
From my own served builds: the D22 copy and a base copy made by reversing the diff, both through the browser suite's serve helper on 8792, with probe specs and screenshots under `d22-review/shots`.
- **Project card on the Projects board** (1300x700):
  - Before: inline controls pin, copy, ask, folder, toggle, present, subtask, edit, with no More.
  - After: pin, copy, ask, folder, files, toggle, present, then More, so subtask and edit moved behind More.
  - Pressing opens Files on the page with `hub:projects/active/graph-bandits` selected, in the window, and `hub:`, `hub:projects`, `hub:projects/active` open, with no outcome line. Selection landed 344 ms after the press.
- **Project tab card:**
  - Before: pin, copy, ask, folder, present, subtask, edit, deposit.
  - After: the same with `files` after `folder`.
  - Pressing opens a Files tab beside Graph-Bandits with the project selected and its ancestors open.
- **Funding card with `link: "funding"`** (schema given a `link` field in the served copy):
  - Before: pin, edit, subtask.
  - After: pin, edit, subtask, `files:funding`.
  - Pressing selects `hub:funding` with `hub:` open and no line.
- **Events card with `link: "network"`:**
  - Before: pin, edit, subtask.
  - After: adds `files:network`.
  - Pressing selects `hub:network`.
- **Missing path `network/gone/deck.html`:** `hub:network` is selected and the line reads "hub/network/gone/deck.html is not there; hub/network, the nearest folder on its way, is selected."
- **Path under `..`:**
  - `../outside/secret.txt` gets a control. Pressing selects `hub:` with the line "hub/../outside/secret.txt is not there; hub, the nearest folder on its way, is selected." No request left the root.
  - `network/../funding/funding.yml` names a file that exists, yet it selects `hub:network` and says it "is not there". This is intended by the comment at `fs.ts:315-318`, but it is a false statement to the reader.
- **Maximised pane** (Projects left, Files split to the right, then Projects maximised):
  - Unmaximised, the press reuses the right pane's Files tab.
  - Maximised, the press opens a second Files tab inside the maximised pane.
  - After Restore panes, the page has two Files tabs: `[["Status","Projects","Files"],["Files"]]`.
- **Files view with a filter typed when an ask arrives:**
  - Files visible in a split pane with `zzq` typed: the box becomes empty, the tree shows the project selected, and typing `graph` afterwards filters normally.
  - Files hidden behind Projects in the same pane with `zzq` typed: after the press the box is empty and the row is selected.
- **Unexplained miss:** in one of 8 runs of the split sequence, the Files tab showed no selection and no open ancestors 800 ms after the press. I did not dump the instance record in that run. Seven later runs, three of them the identical full probe with record dumps, each selected the row within 116-180 ms. The cause is not determined.

## Not checked
- The outcome line and a pending ask surviving a page reload.
- An ask arriving while the workspaces read has failed.
- Keyboard focus after the press. The builder reports it stays on the card control; the screenshot shows the focus ring on the pressed control, but it was not tested with the keyboard.
- The no-schema card control in a browser (node only).
- Education and applications cards in a browser; they use the same EntryCard path as funding and events.
- Terminal (rice) themes drawing the `[@]` stand-in.

Reviewer usage: about 75 tool uses, about 25 minutes of wall time (17:36 to 18:01).

## Repair round 1, refuted
```
Delta: the round-1 tree rebuilt from scratchpad/d22-round1 (tracked.patch over the base, untracked.tar) and diffed against the worktree. 22 files changed: glyphs.yml, files.yml, person.yml, venues.yml, collection.ts, fs.svelte.ts, fs.ts, layout.svelte.ts, Files.svelte, Person.svelte, EntryCard.svelte, ShowPath.svelte, refusal.ts, ProjectCard.svelte (comment rewrap), VenueCard.svelte, and 7 test files. Whole diff: 24 files, 623 insertions, 64 deletions, plus 4 untracked files.

From tools/oculus in the worktree:
npx vitest run --reporter=dot            Test Files 247 passed (247), Tests 4157 passed (4157). No timeouts.
npm run check                            COMPLETED 1213 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
npm run lint                             exit 0
npm run format:check                     All matched files use Prettier code style!
ASCII gate (perl form)                   printed nothing, exit 0
find ... | xargs wc -l | sort -n | tail -3   tests/state/layout.test.ts 970, tests/state/board.test.ts 980. Also: collection.ts 787, layout.svelte.ts 941, Files.svelte 592, fs.ts 645, fs.svelte.ts 807.
npm run build                            exit 0
npx playwright test show-in-files, files, files-forms, cards, person, venues-themes   56 passed (1.4m). The first attempt found the lock held by pid 73156; I waited for the port to be free and signalled nothing.

Node reverts (my clone, one test file each):
  restorePanes dropped                              show-in-files.test.ts: 1 failed
  restorePanes whenever a pane is maximised         show-in-files.test.ts: 31 passed (stays green)
  showInFiles uses openBeside                       show-in-files.test.ts: 1 failed
  url taken out of PATH_FIELDS                      show-in-files.test.ts: 1 failed
  normalisePath keeps `..`                          show-in-files.test.ts: 3 failed
  hubPathsOf `..` checks dropped                    show-in-files.test.ts: 1 failed
  revealAsked uses the raw path                     show-in-files.test.ts: 2 failed
  rootsUnread answers no-root                       show-in-files.test.ts: 1 failed
  no-roots line dropped from lineOf                 files.test.ts: 1 failed
  Person ToolButton removed                         person.test.ts: 1 failed
  Person showInFiles call dropped                   person.test.ts: 9 passed (only the browser covers it)
  venue site link always external                   venues.test.ts: 1 failed
  venue site href is the raw link                   venues.test.ts: 1 failed
  filesViewOf without `revealed`                    explorer.test.ts: 1 failed
Node probe tests/probe/maximised-two-files.test.ts (my clone): a Files tab on the left pane, Projects split right and maximised, a second Files tab opened inside the maximised pane, then showInFiles('funding'): focus null (panes restored), ask written to the left Files tab, not the one in the maximised pane. 1 failed.

Browser reverts (my clone, rebuilt before each, show-in-files.spec.ts -g the named case):
  restorePanes dropped                  1 failed: toHaveCount
  roots-failed effect disabled          1 failed: toHaveText
  Person showInFiles call dropped       1 failed: toHaveAttribute
  revealScrolled write dropped          1 failed: expect(received).toBeNull()
  rebuilt clean afterwards: exit 0

Browser probes (my clone's build, served by tests/browser/serve.ts on 8792, spec tests/browser/zz-probe-review2.spec.ts, screenshots in d22-review2/shots):
  venue with link "network/../funding/funding.yml": site href /api/file/hub/funding/funding.yml, target null; Show in Files selects hub:funding/funding.yml with no line.
  venue with link "projects/active/streaming-anomaly/README.md": pressing site navigates the tab to /api/file/hub/projects/active/streaming-anomaly/README.md. The app is gone: 0 rail buttons, the raw file text is on screen (venue-site-click.png).
  maximised pane already holding a Files tab: layout before the press [["Projects","Files"]] (maximised); after the press [["Status","Files"],["Projects","Files"]].
  failed workspaces read: the line reads "hub/projects/active/graph-bandits cannot be shown: the file browser could not read its roots (boom)." After unroute and reload the tree draws and the same line is still shown (line count 1, roots-failed-reload.png). The next press clears it.
  funding card with link "network/../funding/funding.yml": control files:funding/funding.yml; pressing selects hub:funding/funding.yml with no line. The card's own link href is /api/file/hub/network/../funding/funding.yml.
  person folder: covered by the builder's case (passed in the suite run, red under the call-dropped revert).
```
- `src/lib/state/layout.svelte.ts:858-868` (ruling 3 closure). `held = findView(tree, 'files', null)` takes the first Files tab in pane order, and `restorePanes(page)` runs whenever that one tab is not in the maximised pane. So a maximised pane that already shows a Files tab is restored anyway when the page has another Files tab earlier in pane order, and the ask goes to the hidden tab. The node probe and the browser probe both reproduce this (after the press, `[["Status","Files"],["Projects","Files"]]`). This changes a layout the reader set up. The round-1 code used the Files tab inside the maximised pane here, so this is new in the round. A second Files tab inside a maximised pane is what the rail's Files button already opens there. Behaviour.
- `tests/state/show-in-files.test.ts:123-142` (ruling 3 proof). The check is fitted to its one revert. Changing the condition to restore whenever any pane is maximised leaves the file green (31 passed). No test covers a maximised pane that holds a Files tab and must stay maximised. Proof.
- `src/lib/views/venues/VenueCard.svelte:76-81` (ruling 2). For a hub path, the site link gets `hrefOf(linkPath)` and `external: false`, so the anchor has no `target` and opens `/api/file/...` in the oculus tab itself. In the browser probe, pressing "site" on a venue whose link is a Markdown file replaces the app with the raw file. The collection card opens the same kind of link with `target="_blank"` (`EntryCard.svelte:358`). The ruling asked for the control. The first report only said `external` should depend on the path rule, not that the link should open in this tab. The proposed HELP.md line 81 text ("opens it in this tab") writes this behaviour into the manual. `tests/views/venues.test.ts:625` asserts `not.toContain('target="_blank"')`, which locks the defect in as the expected result. Behaviour, Proof.
- `src/lib/views/files/ShowPath.svelte:46-51` with `src/lib/state/fs.ts:356-363` (ruling 6). Reproduced: the no-roots line is shown at once and `reveal` is null. The `no-roots` outcome is saved with the instance, though. After a reload whose roots read succeeds, the view still says "the file browser could not read its roots (boom)" over a tree that is drawn. That sentence is false on screen until a row is selected or a new ask is made. The builder lists the stale line as a known limit. The `no-roots` kind added in this round makes it a false statement rather than an old outcome. The browser case at `tests/browser/show-in-files.spec.ts:281-287` reloads and asserts the tree without asserting the line. Behaviour.
- `src/lib/state/collection.ts:269-281` (ruling 4, `normalisePath`). Trailing slashes, repeated slashes, `.` segments and `a//../b` all come out as one path, and my probes and the node cases agree. Rulings 4's closures reproduce: `network/../funding/funding.yml` selects `hub:funding/funding.yml` with no line (browser), and `../outside` gets no control (node). The card's own anchor still uses the raw value (`/api/file/hub/network/../funding/funding.yml`), which is unchanged from the base and outside the ruling. No finding.
- `src/lib/state/collection.ts:285` (ruling 5, `url` in `PATH_FIELDS`). `url` is a path field on every collection, including `code` (`registries/repos.yml`), whose `url` is always a web address. `isHubPath` counts a scheme-less address (`github.com/x`, `www.example.org`) as a hub path, so such a value would get a Show in Files control and a "not there" line. The real hub has none today: 0 non-http `url` values in funding (3), applications (23) and repos (20), by my grep. Not visible today. Behaviour, recorded as a risk.
- `src/lib/views/Person.svelte:196-207` (ruling 1). The control is drawn for any non-empty `folder` without `hubPathsOf`, so a folder climbing above the hub still gets one. The proposed HELP.md line 85 text says "a value that climbs above the hub gets no control", which is false for the Person folder. Standards (Doc text).
- `tests/browser/show-in-files.spec.ts:1-10`. The head comment lists what the file covers and says it does not cover "a people card". It does not mention the Person folder case, the maximised pane case or the failed roots read that the round added. Standards.
- `src/lib/state/layout.svelte.ts` is at 941 lines, 59 under the limit. `spec.md`: "A file approaching it is split by concern." This round added 11 lines. Standards.
- `src/lib/views/Files.svelte` 592 and `src/lib/state/collection.ts` 787: under the limits. No finding.
- Closures that reproduce, with no finding: ruling 7 (the ask cleared after the scroll: red under its revert; the openBeside revert now red; explorer reverts named and red), ruling 8 (the `refusal.ts` comment matches the codes in `server/fs.ts`; the glyph comment order is back to the base's; `OFFLINE` replaced by `files.read_offline`), and the unexplained miss (not rerun with --repeat-each; its case passed in the suite).
- Environment: the machine's data volume was full during this run (as little as 382 MiB free, by `df -h`). One node-revert pass died with ENOSPC and was rerun after the clone's file was restored from the worktree; the clone's `src` matches the worktree's (`diff -rq` empty).

Reviewer usage: about 50 tool uses, about 20 minutes of wall time (18:33 to 18:53).

## Closed at landing

- `layout.svelte.ts` showInFiles, a maximised pane restored when another Files tab comes first in pane order: closed. The panes are restored only when the maximised pane holds no Files tab (`!shown.tabs.some((tab) => tab.view === 'files')`), so `openView` uses the Files tab inside it. `tests/state/show-in-files.test.ts` "keeps a maximised pane that holds a Files tab of its own and shows the path there" is red with the new condition dropped (1 failed of 32) and with the reviewer's "restore whenever a pane is maximised" revert.
- The ruling 3 proof fitted to its revert: closed by the same case.
- `VenueCard.svelte`, the site link of a hub path opening in the oculus tab: closed. The site link is `external: true` for every link, so a hub file opens in a tab of its own as on a collection card; `tests/views/venues.test.ts` now expects `target="_blank"` for the hub path and is red with `external: false` (2 failed of 16).
- `ShowPath.svelte`, the no-roots line still shown after a reload whose roots read: closed. An effect clears a `no-roots` outcome once the roots are read without an error; `tests/browser/show-in-files.spec.ts` "an ask made while the roots could not be read..." asserts `[data-fs-revealed]` is gone after the reload, red with the effect removed.
- `collection.ts` `url` as a path field on collections whose `url` is always a web address, a scheme-less address counted as a hub path: not visible in the hub today (0 such values); booked as Q50.
- `Person.svelte`, a folder above the hub given the control: closed. The folder goes through `hubPathsOf({ folder }).at(0)` and the control is drawn only for a hub path; `tests/views/person.test.ts` "offers no Show in Files for a folder that climbs above the hub" is red with the gate dropped (1 failed of 10).
- `tests/browser/show-in-files.spec.ts` head comment: closed, rewritten to the cases the file holds.
- `layout.svelte.ts` near the size limit (942 lines after landing): booked as Q51, split by concern.
