# O167 refuter report

Usage: a05cffdf23941c5e1, claude-opus-5-5, 316753 tokens, 103 tool uses, 21.0 min.

## Verification

Run from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O167`.

1. `npm run diagrams` and `npm run docs:palette` rewrote their outputs. Afterwards `git diff 2d28fe2ac --stat | tail -1` printed the same ` 76 files changed, 1202 insertions(+), 1054 deletions(-)` as before the run, and `git status --short | wc -l` printed 81 as before, so the committed outputs already matched. `npm run test:quick`:
```
test:quick: 83 changed file(s), from git since HEAD
test:quick: 89 test file(s)
ok      prettier (6.8 s): All matched files use Prettier code style!
ok      ASCII gate (7.4 s)
ok      svelte-kit sync (10.5 s)
ok      eslint (6.7 s)
ok      svelte-check (29.6 s): 1794097812147 COMPLETED 590 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
FAILED  vitest (195.9 s)
 FAIL  |unit| tests/routes/files/file-undo.test.ts > what an operation records > keeps the content of a trashed file of 1 KB, and none of a folder or a file over 5 MB
 FAIL  |unit| tests/state/sources/clone-after.test.ts > Open after a clone while the unsaved workspace holds folders > Don't Save drops the folders and leaves the clone alone
 Test Files  2 failed | 66 passed | 8 skipped (76)
      Tests  2 failed | 949 passed | 56 skipped (1007)
ok      vitest checks (252.2 s): Duration  217.67s (transform 150.78s, setup 0ms, import 247.32s, tests 586.00s, environment 4ms)
FAILED  vitest slow (260.3 s)
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > holds every record of both hubs, each under the name of its hub's folder
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > names a record of the second hub in a relation pair only by ids of the second hub
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > reports the findings each hub gives, the second hub own naming its files
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > resolves a reference of the second hub in the primary hub when the primary alone holds the key
 FAIL  |unit| tests/routes/edit/rail.test.ts > the rail write > records the change, and the undo puts the workspace file back byte for byte
 FAIL  |unit| tests/routes/edit/rail.test.ts > the rail write > is refused with the no-workspace-file sentence for the unsaved workspace
 Test Files  2 failed | 7 passed (9)
      Tests  6 failed | 50 passed | 13 skipped (69)
test:quick: 271.3 s; failed: vitest, vitest slow
```
   Each red file rerun alone:
   - `npx vitest run tests/routes/files/file-undo.test.ts tests/state/sources/clone-after.test.ts --reporter dot` printed `Test Files  2 passed (2)` and `Tests  19 passed (19)`.
   - `npx vitest run tests/data/hubs/hub-portfolio.test.ts tests/routes/edit/rail.test.ts --tagsFilter slow --testTimeout 20000 --reporter dot` printed `Test Files  2 passed (2)`, `Tests  21 passed (21)` and `Duration  45.13s`.
   - The same two slow files at the default 5000 ms printed `Error: Test timed out in 5000ms.` twice.

   The step changes none of these four files.
2. ASCII gate of the rules file over the 79 changed and new files (list built from `git diff 2d28fe2ac --name-only --diff-filter=d` plus the untracked files, `.scratch` left out, `.svg` kept): it printed nothing, `exit=0`.
3. The test files run alone:
   - `npx vitest run tests/state/system/settings/row-writer.test.ts` printed `Test Files  1 passed (1)` and `Tests  13 passed (13)`.
   - `npx vitest run tests/server/files/nested-names.test.ts` printed `Test Files  1 passed (1)` and `Tests  1 passed (1)`.
4. `sh utils/unused-exports.sh` then `diff` against `.agents/worktrees/O167-base/unused-exports.txt`: `exit=0`, `diff exit=0`. The step adds no line.
5. `wc -l` of the changed files. Largest sources: `879 src/lib/state/client/context.ts`, `877 src/lib/state/client/writes.svelte.ts`, `873 src/lib/state/workbench/layout.svelte.ts`, `849 src/lib/state/sources/fs.svelte.ts`. Largest components: `519 src/lib/ui/controls/ToolButton.svelte`, `519 src/lib/shell/panes/PaneView.svelte`. `sh utils/folder-check.sh` printed `folder-check exit=0`.
6. The brief's catalog grep: `grep -nE '^\s+settings_[a-z_]+: ' config/text/views/system/workbench.yml | grep -vE "[.?!]['\"]?$"` prints 44 lines. They are the labels (`settings_glyph`, `settings_clear`, the `settings_heading_*` lines, `settings_found*`, `settings_where`, and others) and the eight `settings_origin_*` fragments. None of the brief's item-10 messages is among them.
7. `node utils/outside-paths.mjs .scratch/migration/agents/briefs/O167.md .agents/worktrees/O167-base` printed `git does not know the base: .agents/worktrees/O167-base`. Run again with the base commit, `node utils/outside-paths.mjs .scratch/migration/agents/briefs/O167.md 2d28fe2ac`, it printed `exit=0` and 46 paths. Read against the brief, the round-0 rulings and the report's "Paths written outside" section, every path is accounted for except `src/lib/state/workbench/layout.svelte.ts` (finding S5). The others fall into four groups:
   - ruling paths;
   - the ten generated diagram files (on the list as a glob);
   - the report's named extras;
   - `.scratch/migration/agents/briefs/O167-cases.md`, which is the orchestrator's file.

## Verdicts

What to build:
1. Holds. `open-view.svelte.ts` `groups()` maps each rail page's group to `railPages(config)` entry `glyph`. `readGroups` keys rail groups by `entry.page` (`catalogue.ts:285`), so the match is exact. `groupGlyph` and `Catalogue.svelte` are unchanged. The comment at `layout.yml:8` says both.
2. Holds. `Person.svelte` `marking` and `pressedSelf`. `setSelf` answers `answer.ok && answer.refused.length === 0` (`ui.svelte.ts`). `.tool:not(.active):hover` and `.tool.bare:not(.active):hover` are in `ToolButton.svelte` (519 lines). The rice rules after line 208 set `border: 0`, so the higher specificity changes nothing there.
3. Holds. `row-reverse` is removed. The new markup order equals the old drawn order for the right group, SourceItems, LanguageItems and AppItems (checked item by item against the base markup). `onfocusin` calls `scrollIntoView({ block: 'nearest', inline: 'nearest' })`.
4. Holds. `project.yml:193` `listing: Project set` and `docs/palette.md:26` `| Project set | listing |`. `Listing.svelte:81` reads the same key.
5. Holds. Both components use `menuClosing` (`menu-items.ts:124-160`). `focus.yml:100` begins with a capital and ends with a full stop.
6. Violated, one clause: S3, B3.
7. Holds. `unignored` in `search.ts`, with credentials passed by `search-routes.ts` and `+server.ts`.
8. Holds by reading: `.found` wraps, and `.field` has `flex: 1 1 12em; min-width: 12em`.
9. Holds by reading: `compact` is removed, and `.said` is always drawn with `min-height: 1lh`.
10. Holds by reading and by the row-writer run: `invalid` reaches TextInput, NumberInput, TextArea and SuggestInput; `oneStop` is in `said.ts`; `unstopped` is in `write.ts`.
11. Holds by reading: `refusedFields` and `markRefused` are runtime state of the ui store, and `settingsTyped` skips refused and empty text.
12. Holds as the brief words it. The brief's premise is wrong (S4) and the result is a user-visible change the report does not state (B1).
13. Violated: S1. Not built, as the report's first line says.
14. Holds for "never under the buttons". Its new comment is false on the first hover (T4, B2).
15. Holds by reading: `landingFor` takes `PaneRoom`, and `opening.ts` `roomOf` uses 320 px times `textScale()`.
16. Holds: `.empty:not(.error):not(.glyphed)::before`. `Cluster.svelte:136` and `Login.svelte:120` are `<Empty error>`.
17. Holds: `max-height: var(--viewbar-max, 50%)`, set only by `Present.svelte`.
18. Holds by reading. The scroll mechanism is a standards finding (T3).
19. Holds: `counted` is null while `deck === null` or the deck is missing or unreadable. On a switch, `keep` is undefined while the new deck loads (`filter.svelte.ts:99-100`), which sets `live` to null (`live.svelte.ts:51-53`), so no old count shows. Presenter is drawn only when `shown !== null` (`Present.svelte:408-415`).

Cases:
- C1: met by reading. The drawn glyphs are settled at the look.
- C2: met by reading; the look settles it.
- C3: met by reading; the look settles it.
- C4: met. Grep and `npm run docs:palette` reproduce it.
- C5: met by reading; the look settles it.
- C6: partial (B3, S3). Collection, bookmark and schedule rows leave on success by reading. A schedule re-added by another hand can stay hidden.
- C7: met. My run of the row passes. The report quotes the failure on the unchanged tree.
- C8: met by reading the CSS; the look settles the measure.
- C9: met by reading; the orchestrator's measure at the look settles it.
- C10: met by reading and by the G96 rows. The catalog grep claim in the report is not reproduced (P1).
- C11: met by reading; the look settles it.
- C12: met for the rows as written. The changed choice behaviour has no row (P3).
- C13: unmet (S1).
- C14: met by reading, with the first-hover reflow (B2).
- C15: met by reading; the look settles it.
- C16: met by reading.
- C17: met by reading.
- C18: met by grep and reading; the look settles it.
- C19: met by reading.

## Spec

- S1. Item 13 not built. The place is the report's first line and its C13 row; no file of the key path was changed. Ruling 9 of `briefs/O167-cases.md` says "Item 13, Cmd+S on More actions, is built in this run ... fix it there". The case-run programs reproduce no defect under jsdom, and no cause or fix is delivered.
  - Failure scenario: in the browser, a staged change with the focus on a setting's More actions button, then Cmd+S. The ruling's symptom (nothing written, no "Saved into") stays as it is on main.
  - Verdict: item 13 violated, C13 unmet.
- S2. Unapproved script. The place is `src/lib/views/boards/person/Person.svelte`, the `selfTip` return, which the report says it changed with:
  ```
  sed -i '' "s/        return isSelf ? t('person.self_held_tip'/        return pressedSelf ? t('person.self_held_tip'/" src/lib/views/boards/person/Person.svelte
  ```
  No line of plan.md's Rulings approves it, and the brief forbids scripts. Ruling "Unapproved builder scripts" applies: the breach is recorded and the hunk is read. Read against item 2, the hunk is the one the item needs:
  ```
  return pressedSelf
      ? t('person.self_held_tip', title)
      : t('person.self_tip', title, personKey);
  ```
  - Failure scenario: none in the code. The breach is procedural.
  - Verdict: item 2, which still holds.
- S3. Substitute mechanism for item 6's forgetting. The place is `src/lib/state/forms/settled.svelte.ts` `stands`/`forgetRemoved`:
  ```
  return versionOf(key) < away.at + BUILDS_KEPT;
  ```
  The brief names the shape: "held removed records ... forgotten when the snapshot no longer holds the record". The diff forgets after two builds instead. The report gives "would need `context.ts` (ruling 1 keeps it)" as the reason, yet `context.ts` is edited for item 11 in the same diff.
  - Failure scenario: a delete is answered after the rebuilt snapshot v+1 already arrived, so `at` is v+1. The entry is then put back by another window or by a file edit, which arrives as v+2. Its card stays hidden until v+3.
  - Verdict: item 6 violated (one clause), C6 partial.
- S4. A premise of "What is on the tree" does not reproduce. The place is brief item 12: "a choice is refused silently (`:753-758`)". On the base, `git show 2d28fe2ac:src/lib/state/system/config/editors/fields.ts` lines 757-758 read:
  ```
  if (input !== '') return { write: true, value: input };
  return emptyIsValue(spec) ? { write: true, value: '' } : { write: false };
  ```
  So a choice (and a path, file or folder box) whose option carries `empty:` writes `''`. Examples: `config/options/behavior.yml:243` `clusters.key_type` `empty: no key type`, `layout.yml:59` `direct_chord`, `appearance.yml:38` and `:120`. The builder built item 12 over every kind without naming this.
  - Failure scenario: see B1.
  - Verdict: item 12, which holds as the brief words it.
- S5. Ruling 6 not fully followed in the report. Ruling 6 says "The builder names in its report the files this touches ... and each is added to the path list". `src/lib/state/workbench/layout.svelte.ts` (the `measurePane` plumbing, +3 lines) is named neither in the item 15 row nor in "Paths written outside"; it is in the file table only. Ruling 6 also says the width map is "keyed by pane id". The diff keys it by page id and path (`opening.ts` `paneKey`), since `Pane` has no id (`model.ts:62-72`), and the report does not state this departure.
  - Failure scenario: a reader of the ledger. The orchestrator checking the path list against the ruling does not learn that `layout.svelte.ts` was touched or that the key differs from the ruling.
  - Verdict: item 15, which holds.
- S6. Runs of the verify list beyond the rule. The place is the report, Verification 1, "Run 1" to "Run 4". The rules file allows one more run after fixing a red line in a changed file, and none for a red line in an unchanged file. Run 2 was red only in `hub-portfolio.test.ts`, which the step does not change. Runs 3 and 4 followed.
  - Failure scenario: none in the code. The cost is tokens.
  - Verdict: none.
- S7. Paths substituted for the brief's named path. The brief names the new file `src/lib/state/sources/bookmarks.svelte.ts` and the path `src/lib/ui/frame/Card.svelte`. The diff has `src/lib/state/sources/fs-parts/{bookmarks.svelte.ts,history.ts}` (`fs-history.ts` moved), and `src/lib/ui/frame/card/{Card.svelte,card-room.ts}` with seven importers or comments rewritten. The report names both, with reasons the folder count confirms: `src/lib/state/sources` and `src/lib/ui/frame` each hold 10 items.
  - Failure scenario: none. This is a decision the orchestrator confirms.
  - Verdict: items 6 and 14.

## Proof

- P1. Unreproduced claim. The place is the report, item 10's DONE row: the grep "prints only the `settings_origin_*` fragments". Verification 6 above shows 44 lines, mostly labels and headings.
  - Failure scenario: a reader trusting the row believes every non-fragment Settings key ends with a stop. The real evidence is that the brief's listed messages no longer appear.
  - Verdict: C10 (still met by my reading of the listed keys).
- P2. Passing runs on the unchanged tree are stated, not quoted. The report says 'is said until it is withdrawn ...' passes on the unchanged tree, that nested-names rows 1 and 3 pass, and that the C12 rows with a key held pass. No output line is quoted for any of them.
  - Failure scenario: none observed. The claim cannot be checked from the report.
  - Verdict: C10, C12, C7.
- P3. The C12 table does not exercise the choice behaviour the change alters. The place is `tests/state/system/settings/row-writer.test.ts`, the row `{ control: 'choice', own: false, held: undefined, said: null }`. `controlRow` builds an entry with no `empty`, so the base already answers `{ write: false }`. The row passes with or without the `unset` branch. No row covers a choice or path with `empty:`, the one input where `fields.ts`'s new `if (!own && input.trim() === '') return { write: false, unset: true };` changes the outcome from writing `''`.
  - Failure scenario: B1's regression passes this test.
  - Verdict: C12.
- P4. Verify 1 is red. `npm run test:quick` printed `failed: vitest, vitest slow` in my run, and the builder's run 4 printed `failed: vitest slow`. All four red files pass alone (Verification 1). `hub-portfolio.test.ts` and `rail.test.ts` import changed files, so they are tests the step can influence. Whether they time out on the base under the same load is not settled (Declined).
  - Failure scenario: the landing list may go red on load-dependent timeouts.
  - Verdict: none of the items.

## Standards

- T1. A shared fallback object is not frozen, which breaks the rules file's "a shared fallback object handed to callers is frozen or built per call". The place is `src/lib/state/workbench/layout/open/landing.ts`, near the top:
  ```
  const ANY_ROOM: PaneRoom = { fits: () => true, width: () => Number.POSITIVE_INFINITY };
  ```
  - Failure scenario: a caller that assigns `room.fits = ...` on the default it was handed changes every later default landing in the process.
  - Verdict: item 15.
- T2. The same rule. The place is `src/lib/state/workbench/ui.svelte.ts` `createUi`:
  ```
  const noneRefused: ReadonlySet<string> = new Set();
  ```
  One mutable `Set` is handed to every `refusedFields` read of instances with no refusal.
  - Failure scenario: a caller casting and adding to it marks a field refused for every such tab.
  - Verdict: item 11.
- T3. A view reaches into another component's markup and repeats its value, which breaks the principle of low coupling. The place is `src/lib/views/academic/present/arrange/RuleForm.svelte` `uncover`:
  ```
  const strip = form.closest('section')?.querySelector(':scope > h3');
  ...
  strip.getBoundingClientRect().bottom + 8 - label.getBoundingClientRect().top;
  ```
  It depends on `GroupHead.svelte` drawing `<section>` then `<h3 class="strip">` and on its `margin: 0 0 8px` (`GroupHead.svelte:219-226`). GroupHead.svelte was on the write list.
  - Failure scenario: a change of GroupHead's markup or margin silently stops the uncovering, or scrolls by the wrong amount, with no check failing.
  - Verdict: item 18.
- T4. A sentence the diff writes into a head comment is false. The place is `src/lib/ui/frame/card/Card.svelte`, the added head paragraph: "The room is kept while the controls are not drawn too, so the title does not move when they appear". The same goes for the existing meta-row comment, "the card's height is the same with them and without". `CardActions.svelte` calls `lay` only `if (drawn)`, so `room` is 0 until the controls are first drawn.
  - Failure scenario: see B2.
  - Verdict: item 14.
- T5. A write inside a read path. The place is `src/lib/state/system/machine/schedules/schedule.svelte.ts` `leavesOut`:
  ```
  if (now !== one.seen && (one.name === '' || !now.some(same))) one.live = false;
  ```
  `rows()` and `none()` mutate the removal list while reading, so the result depends on whether a read ran at every payload.
  - Failure scenario: see B3.
  - Verdict: item 6.
- T6. A stale path in the ledger, which is the orchestrator's to fix. `.scratch/migration/agents/guarded.md:363` still names `src/lib/state/sources/fs-history.ts`, now `fs-parts/history.ts`. The report names it.
  - Verdict: none.

## Behaviour

- B1. A user-visible change the report does not state. In a scope whose file holds no key for a choice, path, file or folder row with `empty:`, picking the empty option now writes nothing. `Control.svelte` `pick` calls `writer.submit(row, textOf(''))`, and `commitValue` returns `{ write: false, unset: true }` because `own` is false.
  - Before: `{ write: true, value: '' }` was staged and saved.
  - After: nothing is staged and nothing is said.
  - Scenario: the This machine or Primary hub scope, with no `clusters.key_type` in its file (shipped `ed25519`). Picking "no key type", which the help documents as "Set empty, it makes no key", silently keeps `ed25519`. The same holds for `direct_chord` "no prefix" and `wallpaper.show`.
  - The report's before/after row for item 12 names only number, path, text and long.
  - Verdict: item 12 (S4, P3).
- B2. The card title reflows on the first hover of each card. The report says the opposite ("the title does not move when the pointer comes").
  - Before: the controls lay over the title, as the flaw.
  - After: on the first hover the actions draw, `lay` sets `--card-room`, and the title's `padding-right` jumps from 0 to the actions' width. A long title rewraps under the pointer and the card may grow by a line, which moves the rows under it. From then on, the room stays at rest.
  - Scenario: a Career board with long titles; move the pointer onto a card for the first time.
  - Verdict: item 14, C14 (T4).
- B3. A schedule re-added by another hand can stay hidden. A removal ends only when a read of `rows()` or `none()` sees a payload without the name. `savedAgain` clears it only for a save made in this window.
  - Scenario: window A deletes "nightly"; its schedules view is not drawn while the file without "nightly" arrives. Window B then saves a new "nightly". In window A the new entry stays hidden until a reload.
  - Verdict: item 6, C6.

## Declined to judge

- Whether `hub-portfolio.test.ts`, `rail.test.ts`, `file-undo.test.ts` and `clone-after.test.ts` also time out on the base under the same load. The base copy has no `node_modules` and holds no runnable tree, and running the base on main is outside my commands. A gate run of `npm run test:quick` on main at 2d28fe2ac, beside the same load, would settle it.
- The cause of item 13. Reading and the report's jsdom programs do not settle it; only the look at landing in the browser and in the desktop app shows the symptom.
- Whether the builder edited other files by script. Only the transcript of the builder's session shows its commands, and I read none.
- The cost of the added `git check-ignore` process in each names request of quick open. No measurement was taken; a timed run of `runNames` over a workspace with nested repositories, before and after the change, would settle it.
- The drawn results of every case checked "at the look". I start no server and open no page.
- The failing runs on the unchanged tree quoted for C7, C10 and C12. They need the base tree run with dependencies, and I do not revert code. I read the quoted output only.

## Repair round 1, refuted

All commands ran from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O167`.

```
$ git status --short | md5            (before the generators)
25b0b69eaa34aeacf889d169f1336460
$ npm run diagrams                     (last lines)
docs/diagrams/channels.dot
docs/diagrams/channels.svg
docs/diagrams/writes.dot
docs/diagrams/writes.svg
$ npm run docs:palette                 (last lines)
> node utils/diagrams/palette.mjs
docs/palette.md
$ git status --short | md5            (after both)
25b0b69eaa34aeacf889d169f1336460
$ git diff 2d28fe2ac --stat | tail -1  (before and after, the same)
 81 files changed, 1445 insertions(+), 1076 deletions(-)
   -> neither generator changed a file.

$ pgrep -fl "vitest|svelte-check"
(nothing; exit=1)
$ npm run test:quick
test:quick: 89 changed file(s), from git since HEAD
test:quick: 89 test file(s)
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.4 s)
ok      eslint (2.9 s)
ok      svelte-check (11.4 s): 1794100865540 COMPLETED 590 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (88.4 s): Duration  74.53s (transform 95.14s, setup 0ms, import 224.81s, tests 56.41s, environment 3.09s)
ok      vitest checks (112.1 s): Duration  98.15s (transform 59.01s, setup 0ms, import 100.06s, tests 265.22s, environment 3ms)
ok      vitest slow (118.5 s): Duration  104.81s (transform 46.45s, setup 0ms, import 90.38s, tests 260.20s, environment 3ms)
test:quick: 121.0 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,

$ (git diff 2d28fe2ac --name-only --diff-filter=d; find src/lib/state/sources/fs-parts src/lib/ui/frame/card -type f; echo src/lib/views/system/workbench/editors/InlineItems.svelte) | grep -v '^\.scratch' | sort -u | xargs -0 (NUL-joined) env LC_ALL=C perl -ne '<the rules file's ASCII gate>'
82 files; printed nothing; exit=0   (.svg files included, config accent rule applied)

$ sh utils/unused-exports.sh 2>&1 | diff ../O167-base/unused-exports.txt -
(nothing); exit=0

$ node utils/outside-paths.mjs .scratch/migration/agents/briefs/O167.md 2d28fe2ac   (51 lines, exit=0)
.scratch/migration/agents/briefs/O167-cases.md
.scratch/migration/agents/briefs/O167-round1.md
.scratch/migration/agents/guarded.md
.scratch/migration/agents/spec.md
docs/diagrams/layer-server.dot
docs/diagrams/layer-server.svg
docs/diagrams/layer-shell.dot
docs/diagrams/layer-shell.svg
docs/diagrams/layer-state.dot
docs/diagrams/layer-state.svg
docs/diagrams/layer-views.dot
docs/diagrams/layer-views.svg
docs/diagrams/layers.dot
docs/diagrams/layers.svg
src/lib/server/files/search/search-routes.ts
src/lib/shell/panes/PaneView.svelte
src/lib/shell/panes/pane-view.ts
src/lib/shell/status/AppItems.svelte
src/lib/shell/status/LanguageItems.svelte
src/lib/shell/status/SourceItems.svelte
src/lib/state/client/context.ts
src/lib/state/forms/page-entry.ts
src/lib/state/sources/explorer/sections/timeline-state.svelte.ts
src/lib/state/sources/fs-history.ts
src/lib/state/sources/fs-parts/bookmarks.svelte.ts
src/lib/state/sources/fs-parts/history.ts
src/lib/state/system/config/messages.ts
src/lib/state/workbench/layout.svelte.ts
src/lib/state/workbench/ui.svelte.ts
src/lib/ui/forms/NumberInput.svelte
src/lib/ui/forms/TextArea.svelte
src/lib/ui/forms/choice/SuggestInput.svelte
src/lib/ui/frame/card/Card.svelte
src/lib/ui/frame/card/card-room.ts
src/lib/views/academic/career/CareerCard.svelte
src/lib/views/academic/present/arrange/Tile.svelte
src/lib/views/boards/collection/Collection.svelte
src/lib/views/boards/focus/lanes/LaneCard.svelte
src/lib/views/shared/card/record/RecordCard.svelte
src/lib/views/system/machine/usage/Usage.svelte
src/lib/views/system/status/Gallery.svelte
src/lib/views/system/status/Status.svelte
src/lib/views/system/workbench/editors/FieldControl.svelte
src/lib/views/system/workbench/editors/InlineItems.svelte
src/lib/views/system/workbench/settings/other-rows/WallpaperPicker.svelte
src/lib/views/system/workbench/settings/said.ts
src/routes/api/(files)/search/+server.ts
tests/state/client/created-ids.test.ts
tests/state/forms/page-entry.test.ts
tests/state/sources/settings-readers.test.ts
tests/state/system/schedule-lines.test.ts
   -> read against the brief, round-0 rulings 1 to 6 and round 1's list and ruling 6 (the accepted moves): the ledger copies are the orchestrator's (diff of the worktree's spec.md, guarded.md, O167-cases.md, O167-round1.md and O167-report.md against the main checkout's prints nothing for each); the paths no list holds are in finding R1-S3.

Commands the round's report quotes as evidence:
$ npx vitest run tests/state/forms/page-entry.test.ts tests/state/system/schedule-lines.test.ts tests/state/system/settings/row-writer.test.ts tests/server/files/nested-names.test.ts
 Test Files  4 passed (4)
      Tests  53 passed (53)
   (the report's three-file run prints 52; nested-names adds 1)
$ grep -nE '^\s+settings_[a-z_]+: ' config/text/views/system/workbench.yml | grep -vE "[.?!]['\"]?$" | wc -l
      43
   (the report's 43 reproduces; workbench.yml is unchanged by round 1, so the first refuter's 44 was the miscount)
$ wc -l of the 15 files of the round's table: context.ts 880, settled.svelte.ts 174, page-entry.ts 532, schedule.svelte.ts 818, fields.ts 786, write.ts 167, Card.svelte 364, CardActions.svelte 397, landing.ts 126, ui.svelte.ts 604, RuleForm.svelte 195, GroupHead.svelte 277, page-entry.test.ts 461, schedule-lines.test.ts 134, row-writer.test.ts 285   (all as the report says)
$ sh utils/folder-check.sh; echo $?
0
$ grep -n "section\|h3\|8px" src/lib/views/academic/present/arrange/RuleForm.svelte
(nothing, as the report says)
$ LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/reviews/O167-report.md
(nothing)
$ ls <session scratchpad> | grep -iE "nested-names|row-writer|SourceItems|LanguageItems|StatusBar|li_head|o167"
O167-d1.diff  O167-d2.diff  O167-d3.diff  o167-files.txt  o167-now.txt  O167-paths.txt  o167-unused.txt
   (none of the six copies the report says it removed; the files listed are the orchestrator's, in the same folder)
$ git diff 2d28fe2ac --name-only | grep -E "Workbench.svelte|workbench-keys|keys/oculus/resolve.ts|source-keys|menu-template|Gear.svelte|ui/menu/Menu.svelte|close-hooks"
(nothing; exit=1)
$ git status --short | md5   (after every rerun)
25b0b69eaa34aeacf889d169f1336460
```

The round's delta, read: `diff -u` of each snapshot path against the worktree changed `context.ts`, `page-entry.ts`, `settled.svelte.ts`, `fields.ts`, `write.ts` (head comment only), `schedule.svelte.ts`, `landing.ts`, `ui.svelte.ts`, `RuleForm.svelte`, `CardActions.svelte`, `ui/frame/card/Card.svelte` and `row-writer.test.ts`; the paths changed now that `files.txt` does not list are `GroupHead.svelte`, `tests/state/forms/page-entry.test.ts` and `tests/state/system/schedule-lines.test.ts`. `docs/adr` does not exist (the brief), so no ADR governs the diff.

### Verdicts

Items of the brief's "What to build", over the whole diff since the base:

- 1: holds. `open-view.svelte.ts:97-100` gives a rail page's group row `page.glyph` from `railPages(config)`; `groupGlyph` keeps its other caller; `layout.yml:8` says both.
- 2: holds. `ToolButton.svelte:208` and `:429` `.tool:not(.active):hover`, `.tool.bare:not(.active):hover`; `Person.svelte` `pressedSelf` from the press until the portfolio or a refusal (unchanged by round 1).
- 3: holds. `grep -n row-reverse StatusBar.svelte` prints nothing; `StatusBar.svelte:210` `scrollIntoView({ block: 'nearest', inline: 'nearest' })`.
- 4: holds. `project.yml:193` `listing: Project set`; `docs/palette.md:26` `| Project set | listing |`, unchanged by a fresh `npm run docs:palette`.
- 5: holds. `menuClosing` at `FocusFilter.svelte:150` and `PickMenu.svelte:93`; `focus.yml:100` "Show only what the ticked roles, tiers, pillars and hubs hold."
- 6: holds. Collections: `settled.svelte.ts:158-171` (`remove` holds only while `shows()`, `heard` ends a removal at a snapshot without the entry), `page-entry.ts:487-492`, `context.ts:180` `entities.afterReceive(settled.heard)`, read by `Collection.svelte:145`. Schedules: `schedule.svelte.ts:440-478`, the removal ended in `afterReceive` as the payload arrives, `rows()` only reads. The six new rows pass in my run. Proof R1-P1 and Behaviour R1-B2 bear on it without making it violated.
- 7: holds. `nested-names.test.ts` passes in my run (unchanged by round 1).
- 8: holds by reading. `Header.svelte:115-121` `min-width: 12em`, `flex: 1 1 12em`.
- 9: holds by reading. `ScopeBar.svelte:144-155` draws both buttons without `compact`; `<p class="said">` at `:157` is always drawn.
- 10: holds. The row-writer rows pass; the catalog grep prints 43 lines, none of them one of item 10's messages.
- 11: holds by reading. `rail.ts:124` `settingsTyped(state, tab.refusedFields(id))`; `ui.svelte.ts:524-526`.
- 12: holds. `fields.ts:745` `if (!own && input.trim() === '' && !emptyIsValue(spec)) return { write: false, unset: true };`; the four `empty:` rows of `row-writer.test.ts:165-168` pass.
- 13: violated, R1-S1.
- 14: holds by reading: `Card.svelte:165`, `:185`, `:191` (`--card-at-rest-seen`) and `CardActions.svelte:293`, `:388-391` lay a control that lies over the title out unseen at rest, so the room is told at the first draw. Ruling 3's clause that the head comments are true is not met: R1-T2. The cost of the change: R1-B1.
- 15: holds by reading. `landing.ts:29-32` `Object.freeze`; widths under `paneKey(host, path)` (`opening.ts`).
- 16: holds. `Empty.svelte:130` `.empty:not(.error):not(.glyphed)::before`.
- 17: holds. `Pane.svelte:222` `max-height: var(--viewbar-max, 50%)`; only `Present.svelte:368` sets it.
- 18: holds by reading. `present.yml:58-67` capitalised; `RuleForm.svelte:168-171` `scroll-margin-top: calc(var(--group-strip, 0px) + var(--group-strip-gap, 0px))` with `scrollIntoView({ block: 'nearest' })`; `GroupHead.svelte:206`, `:232`. A comment misplaces the property: R1-T3.
- 19: holds (unchanged by round 1). `Bar.svelte` `count: number | null`, the counter drawn only for a number.

Cases:

- C1: met by reading; the look settles the drawn glyphs.
- C2: met by reading; the look settles it.
- C3: met by reading; the look settles it.
- C4: met; grep and a fresh `npm run docs:palette` reproduce it.
- C5: met by reading; the look settles it.
- C6: met. The page-entry rows (before the snapshot without the entry, after it, put back by another hand) and the schedule rows (through a read that holds it, saved again by another hand, answered after the read) pass in my run. A refused delete keeps the row by reading (`schedule.svelte.ts:774-778` only on `answer.ok`; `deleteEntry` records on success); two hubs by the hub-qualified id in `entryKey`. The collection wiring has no test: R1-P1.
- C7: met; my run passes, and the report quotes the row's failure on the unchanged tree.
- C8: met by reading the CSS; the look settles the measure.
- C9: met by reading; the orchestrator's measure at the look settles it.
- C10: met; the row-writer rows pass and the grep's 43 lines reproduce.
- C11: met by reading; the look settles it.
- C12: met; the table with the four `empty:` rows passes, and its failing diff on the step's earlier tree is quoted.
- C13: unmet, R1-S1.
- C14: met by reading; the look at the first hover of a Career card with a long title settles it.
- C15: met by reading; the look settles it.
- C16: met by reading.
- C17: met by reading.
- C18: met by grep and reading; the look settles it.
- C19: met by reading.

### 1. Spec

- R1-S1. Report, first line and DONE row 13: "NOT done: item 13 (C13, Cmd+S with the focus on a setting's More actions button)". What is wrong: no key-path file changed (the grep of `git diff 2d28fe2ac --name-only` for the item-13 files prints nothing). Round-0 ruling 9 says item 13 "is built in this run". The round brief takes it out of round 1, since the browser half did not reproduce in the orchestrator's run on main. Failure scenario: in the desktop app, a staged change with the focus on More actions and Cmd+S, or File > Save. If the symptom is real there, nothing is written and nothing is said, and no code of this step addresses it. Verdict: item 13 violated, C13 unmet. The landing look in the desktop app decides it.
- R1-S2. Report, Ruling 8: "the six copies (...) were removed with `rm` in this round; `ls` of each now prints "No such file or directory"", and "Read-only `python3 -I` programs over this builder's transcript changed no file". What is wrong: line 5 of the round brief says "Nothing is written outside the worktree, the session scratchpad included", and the rules file's "Where you work" says the same. Deleting files in the session scratchpad is a write outside the worktree, and no ruling asked the builder to do it. My `ls | grep` shows the six names gone. The inline `python3` programs are scripts written for the step, and no line of `plan.md` Rulings approves them (brief, "No script is written for this step"). The standing ruling "Unapproved builder scripts" covers them, and the report says they changed no file (not verifiable without the transcript). Failure scenario: the orchestrator keeps its own O167 files (`O167-d1.diff`, `o167-files.txt` and others) in that same scratchpad folder. A builder that runs `rm` there by name can remove one of them, and nothing in the worktree's diff records it. Verdict: none of the items. The breach is procedural.
- R1-S3. Paths and line ranges that neither the brief, the round-0 rulings nor round 1 lists. These are `src/lib/ui/forms/NumberInput.svelte`, `src/lib/state/system/config/messages.ts`, `src/lib/views/system/workbench/settings/said.ts`, `src/lib/views/system/workbench/settings/other-rows/WallpaperPicker.svelte`, `tests/state/client/created-ids.test.ts` and `tests/state/sources/settings-readers.test.ts`. The out-of-range lines are `ScopeBar.svelte` base lines 6-8, outside 130-230, and `Bar.svelte` hunks `@@ -6,4`, `@@ -69,0`, `@@ -96 +103`, `@@ -104 +111` and `@@ -110 +117`, outside line 113 and ruling 7's 26-60. The `Bar.svelte` hunk at `:110` is
  ```
  -        disabled={count === 0}
  +        disabled={slideless}
  ```
  inside the Export button block. The round-1 ruling 6 acceptance covers the moves and their importers. The other paths are not covered. What is wrong: brief line 145 says "a fix that needs another file is handed back with the reason before the report". These paths are named only in the report's "Paths written outside" section. The `Bar.svelte` lines are described there as "lines 1-10 and 75". Failure scenario: O170, not yet in flight, moves "the export line at `Bar.svelte:112`" (state file, open item 717). Its /spec compares against O167's brief, "line 113", and sees no shared lines. O167 has changed `:104-:110` of the same button block, so O170's cherry-pick meets a conflict that its `shared_paths:` does not name. Verdict: none of the items. The acceptance is the orchestrator's.

### 2. Proof

- R1-P1. `src/lib/state/client/context.ts:180`: `entities.afterReceive(settled.heard);`. What is wrong: this line is the only place a collection removal ends in the running app, and no test reaches it. The page-entry rows call `settled.heard()` by hand (`tests/state/forms/page-entry.test.ts:452-457`), so read against the test they pass with the line taken out. The schedule rows use the real `createEntities`, so the schedules' wiring is covered. Failure scenario: a later edit drops the line or moves it before `createSettled`, and every deleted collection entry then stays hidden until a reload, including one put back by another hand. The suite stays green. Verdict: none of the items. C6 holds by reading the line.
- R1-P2. Report, the first build's "Verify before you report" item 6: the history-word grep "prints only words of order or state ("drops its row ... before the bookmarks are read again", "the snapshot may still show it", "the file read again no longer holds it")". What is wrong: `grep -rn "may still show\|file read again no longer" src tests` prints nothing after round 1, so the quoted output is not the tree's. Round 1's added comment lines and test titles get no quoted grep, which the rules file's "What every package obeys" asks for before each report. My grep of round 1's added lines for the listed words gives 19 hits. Examples are `settled.svelte.ts` "until a snapshot that no longer holds the entry arrives, and no longer", `schedule.svelte.ts` "whose entry the last read of the file still holds" and the test title "through a read that still holds it". Each hit is about the state of a snapshot or a read, and none names an earlier form of the code. Failure scenario: a reader trusts the quoted grep as the end state and does not check round 1's comments. Verdict: none.
- R1-P3. Report, round 1's ASCII gate: `xargs -0 perl -ne 'print "$ARGV:$.: $_" if /[^\x00-\x7F]/; close ARGV if eof'`, over files with `.svg` left out. What is wrong: this is not the rules file's gate, which tests `[^\x20-\x7E\n]` and reads `.svg` too. The builder's pattern passes a tab or a control byte. My run of the rules-file form over the 82 changed files, `.svg` included, prints nothing, so no file is affected. Failure scenario: a tab or a stray control byte in a changed file passes the builder's check. Verdict: none.
- R1-P4. Report, Ruling 1, the failing run on the step's earlier tree: `TypeError: settled.heard is not a function` for all three page-entry rows. What is wrong: the failure shows that the new API is missing, and it does not show that the earlier removal rule gives a wrong row. By reading, rows 2 and 3 would also fail under the two-build rule (`versionOf(key) < away.at + BUILDS_KEPT` holds the removal across the next snapshot), so the rows test the behaviour. Failure scenario: none in the code. Verdict: none.

### 3. Standards

- R1-T1. `tests/state/forms/page-entry.test.ts:420` `describe('an entry of a collection a write removed', ...)` and `tests/state/system/schedule-lines.test.ts:79` `describe('a schedule a delete took', ...)`. What is wrong: the rules file's "What every package obeys" says "A test exists only as the test of one entry of `agents/guarded.md`, and `agents/guarded.md` names it there by file and title ... A step that needs a new entry stops and asks Axel for it". `guarded.md` names `page-entry.test.ts` only for 'pageDraftTarget', 'pageOf', 'pageNamed' and two single titles (lines 85 and 276). It names `schedule-lines.test.ts` only for 'the Schedules section of the tray' (G91, line 319). No entry's Code line names `settled.svelte.ts` or the schedules' removals (`grep -n "settled\|createPages\|Collection.svelte"` over guarded.md prints none; G91's Code is `unread`). Round 1's ruling 1 orders these rows, and the rules file says "Nothing in a brief overrides anything here". Failure scenario: the next step that changes `settled.svelte.ts` finds no entry naming these tests and deletes them as tests outside the catalogue, or keeps them without the catalogue gate. Verdict: none of the items. The round brief and the rules file clash here, and the orchestrator settles it, either by an entry under Axel's ruling or as an open item.
- R1-T2. `src/lib/views/shared/card/record/CardActions.svelte:246-248`: "Until the element is first laid out only its own box and the line are watched, so a card at rest whose element shares the chips' line reads no layout". The head comment at `:52-55` says the same. What is wrong: before the first measure, `:259` and `:270` set `over = line.children.length > 1; alone = !over;`, so `class:lying={over || alone}` (`:293`) is true for every card. Under `hover: hover`, `.actions.lying { display: flex; ... }` (`:388-391`) lays every card's element out at rest. The first ResizeObserver then sees a size, sets `drawnOnce`, runs `measure()` and starts `watch()`, and this happens also for a card whose element ends up sharing the chips' line. Round 1's ruling 3 asks that the head comments of `Card.svelte` and `CardActions.svelte` be "true as written". Failure scenario: a reader trusts the comment that a card at rest reads no layout, and does not look for the per-card cost in R1-B1. Verdict: ruling 3's comment clause unmet. Item 14 holds.
- R1-T3. `src/lib/views/academic/present/arrange/RuleForm.svelte:167`: "ui/controls/heads/GroupHead.svelte sets both on its body". `:18` reads "read from the body's `--group-strip` and `--group-strip-gap`", and `GroupHead.svelte:25` reads "It also tells them the space under a strip", where "It" is the body. What is wrong: `--group-strip-gap: 8px` is set on `.group`, the section (`GroupHead.svelte:206`), and the body only inherits it. `--group-strip` is the one set on the body (`style:--group-strip`). Failure scenario: a reader who changes the body's style to change the gap a nested group or the rule form reads finds no such property there. Verdict: none.

### 4. Behaviour

- R1-B1. `src/lib/views/shared/card/record/CardActions.svelte:293` and `:388-391` with the effect at `:215-283`. What is wrong: on a screen that hovers, every card drawn through `CardActions.svelte` now runs `measure()` at mount and starts `watch()` (R1-T2). Before round 1, only a card hovered once did. `watch()` observes the line, each child and every clipping ancestor. It also adds `up.addEventListener('scroll', wanted, { passive: true })` (`:240`) on each clipping ancestor. So each scroll of a pane's body runs `measure()` once for every card in it, and each run calls `getComputedStyle` on every ancestor (`visibleRight`), `inner(line)` and `getBoundingClientRect` on each sibling and control. The report's judgment call says "the cost is one measure per such card at its first draw". That is not what the code does, and no timing was taken. Failure scenario: a board of a few hundred record cards (Projects, a Literature feed). Each scroll event of its pane runs a few hundred measures with ancestor walks, which before round 1 ran only for cards already hovered. Verdict: none of the items. Item 14's behaviour holds. The cost is unmeasured and misdescribed, and a timed scroll over such a board before and after round 1 would settle it.
- R1-B2. `src/lib/state/forms/settled.svelte.ts:158-171` and `src/lib/state/system/machine/schedules/schedule.svelte.ts:464-468`. What is wrong: a removal now has no bound. It ends only when a snapshot or payload without the entry arrives. If the entry is put back before any such snapshot is built, the removal stands until a reload. Two cases do this: another window or a file edit re-adds the collection entry inside the portfolio rebuild's quiet window, which `bookmarks.ts:35` names, so one snapshot holds both changes; or another window saves a schedule under the same name before this window receives a read without it. Before round 1, the two-build rule ended a collection removal two builds later. Ruling 1 orders this shape ("a removal stands until a snapshot that does not hold the record has arrived, and no longer"), and the report states the shape but not this case. Failure scenario: window A deletes Tasks entry "a", and window B adds "a" back within the rebuild's quiet window. In window A, "a" stays out of the Tasks list until a reload. Verdict: none of the items. The case follows from the ruling and is for the orchestrator to weigh. Whether the portfolio rebuild coalesces the two writes was not run.

### Declined to judge

- The failing runs on the step's earlier tree quoted for ruling 1's six rows and ruling 2's rows. The snapshot holds `src`, `tests`, `config` and `docs` with no `node_modules`, and running the rows there would mean putting the earlier code back under the tests, which I do not do. I read the quoted output against the code (R1-P4).
- Whether the six scratchpad copies were identical to the base before they were removed, and whether the builder ran any other program this round. The copies are gone, and only the builder's transcript shows its commands.
- Every case checked "at the look": the first hover of a Career card (C14), the rule form under the strip (C18), Cmd+S in the browser and the desktop app (C13) and the rest. I start no server and open no page.
- Whether `scrollIntoView` in `RuleForm.svelte:81` scrolls an ancestor other than the pane's body. It scrolls every scrollable ancestor, and only a page shows whether one of them moves. The look at landing settles it.
- The cost in R1-B1 and the coalescing in R1-B2. Neither was measured or run. A timed scroll over a large board, and two windows writing within the rebuild's quiet window, would settle them.

Reviewer usage: a992c66873d23d525, claude-opus-5-5, 244257 tokens, 68 tool uses, 13.1 min.