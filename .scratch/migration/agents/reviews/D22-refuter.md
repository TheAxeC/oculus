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
