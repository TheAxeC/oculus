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
