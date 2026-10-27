# O95 refuter report

Usage: a2941302c62abd230, claude-opus-5-5, tokens not read (the completion notice is not in the session's context; the counts below are read from the agent's output file), 82 tool uses, 20 min 42 s

## Verification

All commands ran from `~/workspace/oculus/.agents/worktrees/migration-O95` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

Verify 1, `npm run diagrams && npm run docs:palette && npm run test:quick -- --base 046e0debc`. `diagrams` printed `docs/diagrams/layers.dot` through `docs/diagrams/writes.svg` (18 paths), `docs:palette` printed `docs/palette.md`. The md5 of `docs/diagrams/*` and `docs/palette.md` was `b8be385ab100cdb087295d9c735f39d4` before and after the run, and the md5 of `git status --short` was `20dd77b6324ec29c109527cf415056af` before and after. The two generators changed no file, so the committed diagrams and palette page are current. First run (load average 7.78 to 11.58):
```
test:quick: 30 changed file(s), from git since 046e0debc
test:quick: 158 test file(s)
ok      prettier (0.8 s): All matched files use Prettier code style!
ok      ASCII gate (1.8 s)
ok      svelte-kit sync (2.7 s)
ok      svelte-check (20.9 s): 1793124188359 COMPLETED 551 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (27.5 s)
FAILED  vitest (176.4 s)
<box drawings> Failed Tests 1 <box drawings>
Error: Test timed out in 5000ms.
 Test Files  1 failed | 108 passed | 33 skipped (142)
      Tests  1 failed | 1412 passed | 444 skipped (1857)
ok      vitest checks (197.2 s): Duration  184.72s (transform 62.38s, setup 0ms, import 221.87s, tests 460.96s, environment 6ms)
FAILED  vitest slow (263.2 s)
<box drawings> Failed Tests 2 <box drawings>
Error: Test timed out in 20000ms.
Error: Test timed out in 20000ms.
 Test Files  2 failed | 40 passed (42)
      Tests  2 failed | 442 passed | 183 skipped (627)
test:quick: 266.2 s; failed: vitest, vitest slow
```
My filter for that run dropped the lines that name the three timed-out tests, so I ran `npm run test:quick -- --base 046e0debc` once more and kept its whole output. Second run (load average 17.36 afterwards):
```
test:quick: 30 changed file(s), from git since 046e0debc
test:quick: 158 test file(s)
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.5 s)
ok      svelte-check (17.1 s): 1793124465567 COMPLETED 551 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (17.1 s)
ok      vitest (168.0 s): Duration  158.32s (transform 116.89s, setup 0ms, import 268.68s, tests 300.12s, environment 11.27s)
ok      vitest checks (179.2 s): Duration  169.15s (transform 68.52s, setup 0ms, import 258.70s, tests 381.20s, environment 5ms)
ok      vitest slow (256.4 s): Duration  246.80s (transform 17.07s, setup 0ms, import 141.60s, tests 836.18s, environment 12ms)
test:quick: 259.0 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
```
The run's list of picked tests includes `tests/state/boards/board/board-new-project.test.ts: changed`, `tests/state/boards/board/board-rules.test.ts: changed`, `tests/checks/diagrams/palette.test.ts: named for a changed file` and `tests/data/helpers/hub-names.test.ts: imports at depth 1`.

Verify 2, the ASCII gate over the 28 paths of `git status --short` other than the two briefs: `printf '%s\0' <files> | xargs -0 env LC_ALL=C perl -ne '...'` printed nothing; `ascii exit 0`.

Verify 3, `npx vitest run tests/state/boards/board/board-rules.test.ts`: `Test Files  1 passed (1)`, `Tests  85 passed (85)`. `npx vitest run tests/state/boards/board/board-new-project.test.ts --reporter=verbose`: `Test Files  1 passed (1)`, `Tests  33 passed (33)`, every row `<check mark>`. These include the 24 rows of 'New project on a board' (two of them "is offered on no Awaiting box's board, 'with self named'" and "'with no self'"), the eight table rows of "the Awaiting box's board > the board of the name for '<name>' takes exactly the projects it counts, each once", and "case 7: a venue name counts and holds only the projects the Focus filter keeps 1ms". The report's form, `npx vitest run tests/state/boards/board/board-new-project.test.ts tests/state/boards/board/board-rules.test.ts`: `Test Files  2 passed (2)`, `Tests  118 passed (118)`.

Verify 4, `wc -l`: hub-names.ts 823, takes.ts 192, board/index.ts 86, presets.ts 713, ticker-lines.ts 176, focus.ts 763, focus/filter.ts 730, focus-lanes.ts 309, ticker.ts 692, Band.svelte 308, CommandCenter.svelte 289, Focus.svelte 474, Tasks.svelte 210, rows.ts 504, Projects.svelte 516, board-rules.test.ts 664, board-new-project.test.ts 362, focus.yml 166, projects.yml 111. All are within the limits. Every count matches the report's table, and the base counts I checked (831, 182, 84, 176, 309, 205, 862, 164, 107) match the report's Base column.

Verify 5, `grep -n "open the Funding view, a conference call opens the Venues view" docs/HELP.md`: no output, `grep exit 1`.

Verify 8, `sh utils/unused-exports.sh` against `.agents/worktrees/O95-base/unused-exports.txt`: `diff` printed nothing, `diff exit 0`.

Verify 9, `git diff -U0 046e0debc -- src config tests docs/HELP.md` added lines grepped for history words. The only hits are the HELP paragraph, the parameter `now` and "in force now" / "counts now" in the present sense. The untracked new test file, grepped on its own, has the titles `'case 8: ...'` (two rows) and `'case 26: ...'`, which were moved unchanged, and the new title `'case 7: a venue name counts ...'` at `:353` (finding T2).

Commands the report quotes, rerun:
- `grep -rn "awaitingTake\|awaitingPreset\|awaitingTab" src` in O95-base: no output, `exit 1`.
- `grep -n "pageView" src/lib/views/boards/focus/*.svelte src/lib/views/boards/focus/rows.ts` in O95-base: no output, `exit 1`.
- `git show 046e0debc:docs/palette.md | grep -n "track_record\|awaiting"`: `28:| Track record | track_record |`.
- `npx vitest run tests/checks/diagrams/palette.test.ts --testTimeout 0 --reporter=verbose`, run in the worktree (no node_modules in the base copy): `<check mark> |unit| tests/checks/diagrams/palette.test.ts > the palette page > is what the palette gives now 13272ms`, `Tests  1 passed (1)`.
- `npm run check`: `1793125028116 COMPLETED 4344 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- `grep -rn flaggedEntries src tests docs utils config` (local.yml excluded): no output, `exit 1`.
- The open items quote: `diff` of `sed -n 171,225p .scratch/migration/orchestrator-state.md` against the report's lines 19-73 printed nothing, `diff exit 0`.
- `grep -n "^- Open item 49[4-7]" .scratch/migration/plan.md` in the worktree: lines 2971, 2972, 2973, 2974.
- `grep -n "513" .scratch/migration/orchestrator-state.md`: one hit, `411:- 309 (2026-10-24, ...`.
- `ps -ax -o pid,command | grep migration-O95`: no builder process.
- `diff` of the moved describe, base `board-rules.test.ts:606-791` against the new file's `:49-241`: the only differences are the added row "is offered on no Awaiting box's board" (`21a22,29`) and one trailing blank line (`186d193`). The describe moved whole.

## Verdicts

Items:
1. The Awaiting box's names are buttons: violated (B1). Each name is a `ToolButton plain` (`Focus.svelte:376-381`); the separator is the catalog word `focus.wait_join`; the count stays in the name (`boardName`); a grant with no funding collection is plain text (`entryName`, `press: null`); an empty title shows the id; the hub suffix is shown only for a non-primary hub while `hubList` names more than one hub. The violation: two awaiting entries that share an id within one collection give two names with one `{#each}` key, and Svelte throws instead of drawing the box.
2. The transient board: holds. `AWAITING_VIEW = 'awaiting_board'` is registered in the `registration` list (`Projects.svelte:16-33`) with `listed: false` and no count hooks; `registerBoards` keeps every own registration through `definitions(drawer.registration)` (`views.ts:130-131`). The tab state is `{ id, row, name, label, filter }`, as the cases ruling (a) gives (`filter.ts` `AwaitingTab`). Mine only is set from `filter.mine` on each press. The no-state message is `board.awaiting_none`. The take is recomputed from `portfolio()` through `focusPage` (`awaitingTake`). The `BoardRule.ids` key is null on every row (`takes.ts` `boardRuleOf`), so the board offers no New project (test row).
3. A ticker row naming a collection entry opens its page: holds. This is read from `rows.ts` `entryPage`, `venuePage`, `linePage` and `openLine`, from `CommandCenter.svelte` `pick` and `pickAttention`, from `Tasks.svelte` `pick`, and from the `entry` that `ticker.ts:508` now gives a scheme's subtask line. An unresolved line falls back to `openView(line.entry)`.
4. A band card opens its entry's page: holds (`Band.svelte` `openEntry`, which falls back to the collection's view).
5. The words and the page: holds. HELP:294 is rewritten, the comments item 5 lists are changed, and `docs/palette.md:29` reads `| Awaiting | awaiting_board |`. A comment outside item 5's list is now incomplete: T1.
6. The test of G124: violated (P1). The rows exist and pass, but the report gives no run of any row on the unchanged tree.

The deletion of `flaggedEntries` from `src/lib/data/helpers/hub-names.ts`, outside the paths: not a finding. `waiting()` needs each application's collection, which `flaggedEntries` drops; it was the only caller (base grep: `focus.ts:20`, `:613`); and the rules file requires an export left without a caller to be removed. The report names the path at its top, as the rules file asks. G131's test `tests/data/helpers/hub-names.test.ts` ran in test:quick and passed. The landing must add the path to the step's paths.

Cases:
1. Met for the take and for no New project (rows 'the venue BSPC' and "is offered on no Awaiting box's board"). The tab, its title, the absence of a count and the second press are look parts, not verifiable here; read against the diff they match.
2. Met (row 'no venue' takes `['c']`). The title "Under review: (venue unset)" is a look part, not verifiable; `nameWords` gives it.
3. Met (row 'the person Maryam').
4. Met (row 'the project Bee').
5. Met (row 'a waited-on value naming neither ...').
6. Met (row 'Blocked, ...', the third project at `published`, per the cases ruling 3).
7. Met (table row with `tiers: ['software']`, and the 'case 7:' row asserting count 1 and ids `['a']`).
8. Met for the take (`takes: ['a']`). The count is left to ruling 513.
9. Not verifiable (look); read against the diff, `openBoard` writes `mine: filter.mine` and the take uses the carried filter.
10. Not verifiable (look); read against the diff, `openView` restates the existing tab with the same state `id` (`opening.ts:263-268`).
11. Not verifiable (look); read against the diff, `awaitingTabOf` returns null, the take is `[]` and the message is `board.awaiting_none`.
12. Not verifiable (look); read against the diff, the take is a `$derived` over `portfolio()`.
13. Not verifiable (look); read against the diff the behaviour is built, but B1 breaks the box for entries sharing an id.
14. Not verifiable (look); read against the diff, consistent.
15. Not verifiable (look); read against the diff the behaviour is built. The report's before state for a scheme's subtask line is wrong (B2).
16. Not verifiable (look); consistent.
17. Not verifiable (look); consistent.
18. Not verifiable (look); `entryPage` passes `home.registry` to `pageView`, which gives the person page for `people`.
19. Not verifiable (look); consistent (`venuePage` null, `fundingKey` undefined).
20. Met (run): palette.test.ts passed, and `docs/palette.md:29` lists the view.

## Spec

S1. A script was written for the step with no approval, and it stood in for the tests' first run. Place: report `.scratch/migration/agents/reviews/O95-report.md:77`, "Cases 1 to 8 were run on the unchanged tree ... by a case-run program in the session scratchpad loaded through Vite with the Svelte plugin ... Command `node o95-run.mjs ...`. The program and its loader are removed." The brief (`O95.md:111`) says: "No script is written for this step ... Any other script needs the user's approval of what it computes, quoted from a line of `plan.md`'s Rulings". `grep -n "O95" .scratch/migration/plan.md | grep -i "script\|program"` printed nothing, and choices Z1050 and Z1052 approve paths only. Brief `:75` also says: "No prototype script stands in for such a test." What is wrong: the first run of cases 1 to 8 is the output of a program the reviewer cannot rerun, written without approval. Failure scenario: a case whose row was written wrongly, for example one that would pass on the base, is never caught, because no row ever ran on the base.

S2. The verify list ran twice. Place: report `:126`, "A run of the same command just before it, with the machine at load average 12 to 14 ..., timed out 11 tests in `file-undo.test.ts`, `clone-after.test.ts`, ..., none an assertion". The rules file says a red line in a file the step does not change "is rerun alone and named with that run in the report, and the list is not run again for it", and the report states how many times the list ran. The report reruns the files alone, as required, but also counts a second whole run of the list after them, and it never states the number of runs in plain words. Failure scenario: the cost the rules file caps is spent twice, and the review cannot tell from the report whether the quoted green run is the first after the last change.

## Proof

P1. "Each row runs on the unchanged tree first and fails there" is claimed with no quoted failure. Place: report `:91`, "So every row of the new describe ... and the new row 'is offered on no Awaiting box's board' fails on the unchanged tree: the file's imports `awaitingPreset`, `awaitingTab` and `awaitingTake` do not exist there". The DONE table (`:128`) repeats this under Verify 3, which asks for "each new row was run on the unchanged tree first, its failure quoted". What is wrong: the failure is inferred from missing imports; no vitest run of the rows on the base is quoted. The rows themselves, read in full (`board-new-project.test.ts:288-361`), would fail without the behaviour: without the `ids` check in `boardTakes`, `boardItems` takes every project and New project is offered. Only the first-run evidence is missing. Failure scenario: as in S1.

## Standards

T1. A comment the diff makes incomplete. Place: `src/routes/views.ts:117-119`, "The views the component registers as its own (the track record's board) are no board of `boards:` and stay registered." The component now registers two own views (`Projects.svelte:16-33`, `RECORD_VIEW` and `AWAITING_VIEW`), and the parenthesis names one. `views.ts` is on the step's paths. Failure scenario: a reader of `registerBoards` concludes that only the track record's board survives a push of `boards:` and treats `awaiting_board` as a board the push drops.

T2. A test title names a brief's case number. Place: `tests/state/boards/board/board-new-project.test.ts:353`, `it('case 7: a venue name counts and holds only the projects the Focus filter keeps', ...)`. Verify 9 bars "a step or item number", and the rules file applies the history rule to test titles. "case 7" points at O95's brief, which a reader of the test does not have. The tree has the same form in earlier titles (`board-rules.test.ts:98-107` at the base, "case 1, a lead at revision" and so on), so the orchestrator may rule the form acceptable. Failure scenario: a later reader looks for "case 7" and finds no case list in the repository.

## Behaviour

B1. The Awaiting box throws when two awaited entries share a key. Place: `src/lib/views/boards/focus/Focus.svelte:224-226`, with the keyed loop at `:376`:
```
            // Two collections of one hub may each hold an entry of one key.
            key: `${entry.collection ?? ''}:${entry.id}`,
...
>{#each row.names as name, at (name.key)}
```
Entries of one collection that share a primary key value, or that have none (`entryIdOf` returns `''`, `model-collections.ts:155-157`, and `hubId` makes it `<hub>:`), are kept in the snapshot. Duplicate keys are only a finding (`duplicateKeys`, `schema/lists.ts:223-247`, `findings.schema.duplicate_key`). Svelte 5.57.1 throws `each_key_duplicate` in dev and in prod (`node_modules/svelte/src/internal/client/dom/blocks/each.js:355-361`). On the base, the names were one `join(', ')` string with no keyed loop. The Collection view keys its rows by `${rootOf(entry)}:${entry.index}` (`Collection.svelte:422`) for this reason. Failure scenario: a job applications file flagged `awaiting` holds two entries at `submitted` with the same key, or a collection with no primary key holds two such entries; opening Focus throws in the awaiting box's render, where the base drew "Title, Title" or "Title (2)". The same holds for two funding schemes of one key in one hub.

B2. A funding scheme's subtask lines: the before/after is misstated and incomplete. Place: `src/lib/state/boards/ticker.ts:508`, `{ entry: key, ...rootMark(scheme) },`, and in the report `:193` and `:176`. Before (base), the line carried no `entry`, so `opens(line)` (`rows.ts:289-291`) was false and its name was plain text; the report's own first run says so (`:107`, "a press on it opened nothing"). The "Before and after" section (`:193`) instead lists "a follow-up or subtask line of an entry or a scheme" under the command center with "before, the collection's view". These are Tasks-section lines. The hub-filter effect is stated only in "Judgment calls" (`:176`), with no view or state to look at. With the change, `hubLines` (`filter.ts:400-411`) hides these lines when their hub is unticked, and that section's "N hidden" count, which `hiddenOf` computes, now includes them. Failure scenario: the look at landing checks the wrong section against the wrong before state, and the change in the Tasks heading's hidden count under the Hub filter is never looked at.

B3. Two entries of one title: the change is not in the before/after. Place: `Focus.svelte:252`, `:257` (`strip.applications.map(entryName)`, `strip.grants.map(entryName)`), replacing `countedNames`. Before: "Title (2)". After: "Title, Title", two buttons. Brief decision 5 names this change, but the report's "Before and after" case 13 line (`:192`) says only "before, plain titles". Failure scenario: the look at landing does not set up two awaited entries of one title, so the visible change in the box's words goes unchecked. B1 lies on the same path when the two entries also share a key.

B4. Name wrapping: stated without a state to look at. Place: report `:177`, "A long name now wraps as one element between names, where the plain text could break inside a name (`overflow-wrap: anywhere`)". A `ToolButton` is `inline-flex` (`ToolButton.svelte`, `.tool`), so each name is now one atomic box on the line. The "Before and after" section mentions only the hover. Failure scenario: in a narrow Focus pane, a long venue or person name now moves whole to the next line, or wraps inside its own box. The look is not told to narrow the pane, so the change is not seen at landing.

## Declined to judge

- Ruling 513 (a), the distinct-project count of the Awaiting box's tallies: not part of this build; it is ruled for the builder's repair round 1.
- `node o95-run.mjs /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O95`: the report says the program was removed, so it cannot be rerun.
- The report's `npm run test:quick -- <the 21 changed files>`: the report does not list the 21 paths, so the same form cannot be rerun. The `--base 046e0debc` form was run instead (above).
- The report's `npx eslint <the files>`: the files are not listed. eslint passed inside test:quick.
- The report's single-file reruns of the six timed-out files: not rerun, since my second test:quick run passed every test. The names of the three tests that timed out in my first run were not captured.
- palette.test.ts on the base: the base copy holds no node_modules or docs. Settling it would take a checkout of 046e0debc, which needs a git command outside the three allowed.
- Whether the builder's first run of the list came after its last change: only the builder's transcript would settle it.
- Whether a funding scheme's id (`funding()`, `normalise.ts:479`, the registry key or else the title) equals the id of its entry in the hub's funding collection (`entryIdOf`, the primary key). If they differ for a scheme, a grant name and a funding line fall back to plain text or the Funding view. The look at landing (cases 13 and 14) on the real hub, or a fixture with both, would settle it.
- Look cases 9 to 19: they need the running server, which this review does not start.

## Repair round 1, refuted

Step O95, worktree `.agents/worktrees/migration-O95`, base `046e0debc`, round snapshot `.agents/worktrees/migration-O95-round-1/`.

The round changed four of the paths in `files.txt`: `docs/HELP.md` (line 294), `src/lib/state/boards/focus.ts`, `src/lib/views/boards/focus/Focus.svelte` and `tests/state/boards/board/board-new-project.test.ts`. It also changed one path that `files.txt` does not list: `src/routes/views.ts`, which has one comment hunk in `git diff 046e0debc`. The worktree's `.scratch/migration/agents/briefs/O95.md` differs from the base, but `diff` against main's copy printed nothing, so it is the orchestrator's copy and is not part of the builder's diff.

The rules file names no output filter. The Verify 1 output below was taken from the run's log with `grep -E "^(ok|FAILED|test:quick)|Test Files|Tests  "`.

```
(worktree root, PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH)
cat docs/diagrams/* docs/palette.md | md5   -> dbf14e9405177d509318526dbeaa55a5 (before and after Verify 1)
git status --short | md5                    -> dbc57e201a6f9c0bce3d2d1bbd6d143b (before and after Verify 1)

Verify 1: npm run diagrams && npm run docs:palette && npm run test:quick -- src/lib/state/boards/focus.ts src/lib/views/boards/focus/Focus.svelte src/routes/views.ts tests/state/boards/board/board-new-project.test.ts docs/HELP.md
exit 0
test:quick: 5 changed file(s), from the given paths
test:quick: 16 test file(s)
ok      prettier (1.7 s): All matched files use Prettier code style!
ok      ASCII gate (2.2 s)
ok      svelte-kit sync (4.2 s)
ok      eslint (19.4 s)
ok      svelte-check (34.2 s): 1793132407343 COMPLETED 551 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (80.4 s): Duration  71.44s (transform 128.38s, setup 0ms, import 150.44s, tests 7.38s, environment 2ms)
ok      vitest checks (83.1 s): Duration  73.97s (transform 44.98s, setup 0ms, import 158.30s, tests 101.95s, environment 3ms)
test:quick: 87.3 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
(the picked files include board-new-project.test.ts: changed, board-rules.test.ts: imports at depth 1, keys.test.ts, comment-width.test.ts, history.test.ts, size.test.ts)

Verify 2: printf '%s\0' <the five files> | xargs -0 env LC_ALL=C perl -ne '...'
(no output)  ascii exit 0

Verify 3: npx vitest run tests/state/boards/board/board-new-project.test.ts tests/state/boards/board/board-rules.test.ts
 Test Files  2 passed (2)
      Tests  119 passed (119)
npx vitest run tests/state/boards/board/board-rules.test.ts
 Test Files  1 passed (1)
      Tests  85 passed (85)

Verify 4: wc -l
     766 src/lib/state/boards/focus.ts
     468 src/lib/views/boards/focus/Focus.svelte
     348 src/routes/views.ts
     369 tests/state/boards/board/board-new-project.test.ts
     587 docs/HELP.md

Verify 5: grep -n "open the Funding view, a conference call opens the Venues view" docs/HELP.md
(no output)  verify5 exit 1

Verify 8: sh utils/unused-exports.sh > <scratchpad>/ue.txt; diff ../O95-base/unused-exports.txt <scratchpad>/ue.txt
(no output)  diff exit 0

Verify 9: git diff -U0 046e0debc -- focus.ts Focus.svelte views.ts | added lines | grep -iwE 'before|used to|no longer|still|previously|anymore|formerly|was|were|old|O9[0-9]|step|item [0-9]|20[0-9][0-9]-|replaced|instead|ruling|reverted|case [0-9]'
(no output)  history grep -w exit 1
(without -w the same grep hits only "holds"/"holding", e.g. "+ * the portfolio, when the snapshot holds only the projects a filter keeps, and from the")
grep -n "case [0-9]" tests/state/boards/board/board-new-project.test.ts
102:            name: 'case 8: several tiers with the default among them write the default',
108:            name: 'case 8: several tiers without the default offer no New project',
178:    ])('case 26: with self naming the primary kim, $name', (row) => {
(all three moved unchanged from board-rules.test.ts; line 353 now reads 'a venue name counts and holds only the projects the Focus filter keeps')

Round report, item 1 "after": npx vitest run tests/state/boards/board/board-new-project.test.ts -t "counts that project once"
 Test Files  1 passed (1)
      Tests  1 passed | 33 skipped (34)

Round report, item 2: grep -n "key" src/lib/views/boards/focus/Focus.svelte
36 (fold comment), 73 and 279 (keyOf), 235/240/245/250/255 (row keys), 283-284 (fold), 367 and 369 (row.key), 388 and 404 (fold): no name key is left.
```

### Verdicts

Items of "What to build", for the whole diff since the base:

- 1: holds. The B1 finding is closed: `Focus.svelte:370` reads `{#each row.names as name, at (at)}`, and `BoxName` is `{ text: string; press: (() => void) | null }`. `boardName`, `entryName` and the Blocked name no longer give a key, and the "Two collections of one hub..." comment is gone. Read in `Focus.svelte:170-262`, the names are still `ToolButton plain`, the count is still in the name, a grant whose hub has no funding collection is still plain text, and an empty title still shows the id.
- 2: holds. `Projects.svelte:19-36` registers `AWAITING_VIEW` with `listed: false`. `filter.ts` has `awaitingTab` with `id` `${row}:${name}`, `awaitingTabOf` (null for a state that does not parse) and `awaitingTake`, which computes over `focusPage`. `views.ts` `registerBoards` keeps the own registrations. The config words are at `projects.yml:4-5` and `:97-98`, and `docs/palette.md:29` lists the view.
- 3: holds, read from `rows.ts` `entryPage`, `venuePage`, `linePage` and `openLine`, and from `Tasks.svelte` `pick`. The round did not change these.
- 4: holds, read from `Band.svelte` `openEntry`. The round did not change it.
- 5: holds. The `HELP.md:294` sentence and the `waiting` and `tallies` comments match ruling 513. The `views.ts` comment now names both views (T1). Standards finding 1 below is about the rewrap and does not falsify any sentence.
- 6: holds under ruling 523 (a). The rows are judged by reading. Every row of the describe "the Awaiting box's board" imports `awaitingTab`, `awaitingTake` and `awaitingPreset`, which do not exist at the base. The new count row asserts `count: 1`; the round report quotes it failing with `count: 2` on the tree before the change. The booking records that cases 1 to 8 have no run on the base.

Cases:

- 1: met. Row 'the venue BSPC' takes `['a','b']`, and row "is offered on no Awaiting box's board" checks that no New project is offered. The tab, its title and the second press are left to the look.
- 2: met. Row 'no venue' takes `['c']`. The title is left to the look.
- 3: met (row 'the person Maryam').
- 4: met (row 'the project Bee').
- 5: met (row 'a waited-on value naming neither ...').
- 6: met (row 'Blocked, ...', with project `c` at `published`).
- 7: met (the table row with `tiers: ['software']`, and the row at `:353` that asserts count 1 and ids `['a']`).
- 8: met. The table row 'the person Maryam, whom one project names twice' takes `['a']`, and the new row 'a person one project names twice counts that project once' expects `[{ label: 'Maryam', count: 1, ids: ['a'] }]`, which ruling 513 (a) asks for.
- 9 to 12: not verifiable (look). Read against the diff, `openBoard` writes `mine: filter.mine`, the take is recomputed from `portfolio()`, and `awaitingTabOf` returns null and the board draws `board.awaiting_none`.
- 13: not verifiable (look). Read against the diff the behaviour is consistent, and the duplicate-key throw (B1) is closed.
- 14 to 19: not verifiable (look). Read against the diff, consistent.
- 20: met (run). The md5 of `docs/palette.md` was unchanged by `npm run docs:palette`, `docs/palette.md:29` reads `| Awaiting | awaiting_board |`, and `palette.test.ts` is among the checks that test:quick ran green.

### Findings

**1. Spec**

none

**2. Proof**

- `.scratch/migration/agents/reviews/O95-report.md`, the sections "Files with line counts", "What in the brief was wrong or impossible", "The ruling this build follows" item 5 and "The cases' first run" case 8.
  - Quoted: "| `src/lib/state/boards/focus.ts` | 690 | 763 |", "| `src/lib/views/boards/focus/Focus.svelte` | 395 | 474 |", "| `tests/state/boards/board/board-new-project.test.ts` | new | 362 |", "`src/routes/views.ts` and `tests/state/boards/board/board-fixture.ts` are on the paths and needed no change", "The tally's count is unchanged by this step (open item 513, booked on main)", and "The count 2 is unchanged by the step (ruling 5) and no row asserts it".
  - What is wrong: after the round these statements are false. `wc -l` gives 766, 468 and 369. `views.ts` is changed (`git diff 046e0debc -- src/routes/views.ts`, one hunk) and is missing from the file table. The count is now changed, and a row asserts it.
  - The rules file (Working rules, "A report states the end state ... Every count, line count ... is taken after your last change; a figure from before it is taken again or removed") and its "Where you work" rule (the file table holds every changed path) both require these to be corrected. The "## Repair round 1" section gives the new counts for the five files, but the earlier text that contradicts it was left in place.
  - Failure scenario: a landing booking or `G124` text built from the report's file table and judgment sections names `views.ts` as unchanged, says the tally count is unchanged, and carries the stale line counts.
  - Verdict: none (report text only).

**3. Standards**

- Comment rewrap at 100 columns, in two places:
  - `src/routes/views.ts:119-120`: " * the component registers as its own (the track record's board and the Awaiting board) are no" (94 columns), followed by " * board of `boards:` and stay registered. ...". The next word "board" would bring the line to exactly 100.
  - `src/lib/state/boards/focus.ts:637-638`: " * the portfolio, when the snapshot holds only the projects a filter keeps, and from the" (88 columns), followed by " * snapshot's own projects without it.". "snapshot's" would fit at 99. The same paragraph's `:628` (97 columns, "... drawn by waiting.ts.") could also take the next word "A".
  - What is wrong: the rules file ("What every package obeys": "A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short") and round item 3 ("Rewrap the edited paragraph as a whole at 100 columns") require each line to be filled before breaking. The round report says both paragraphs were "rewrapped at 100 columns". `tests/checks/source/comment-width.test.ts` checks only for lines over 100, so its green result does not cover this.
  - Failure scenario: a reader sees a short line in the middle of a sentence, which the convention exists to prevent. Each fix is a one-word move.
  - Verdict: none (item 5 holds; this is a convention breach to fix at landing).

**4. Behaviour**

- `src/lib/state/focus/filter.ts:491-500` and `:530`, `awaitingTotal`, which sums `one.count` over `strip.people` and `strip.venues`, used for `hidden.awaiting`. The box heading draws it through `t('focus.hidden', ...)` at `Focus.svelte:361-363`.
  - What is wrong: ruling 513's change also changes the Awaiting box's "N hidden" heading. A project whose `waiting-on:` names one person twice and which the Focus filter hides used to add 2 to the hidden count and now adds 1. The report's "Before and after" states only the name change ("before, "Maryam (2)". After, "Maryam"") and does not mention the hidden count.
  - Failure scenario: at the look on landing nobody hides such a project under the Focus filter, so the heading going from "2 hidden" to "1 hidden" is never checked.
  - Verdict: none (a missing before/after line).
- `O95-report.md`, "Before and after", the bullet "Awaiting box, one project whose `waiting-on:` names one person twice (round 1, item 1): ... A Needs-attention venue line: before, the Venues view at the venue; after, the venue's page. A project's follow-up line: ... A venue id naming no registry venue, or a scheme in a hub with no funding collection: the collection's view, unchanged."
  - What is wrong: the lines for the command center's Needs-attention venue line, the project follow-up line and the unresolved line (cases 14, 15 and 19) now sit inside the Awaiting box bullet for item 1.
  - Failure scenario: someone working through the bullets at the look looks for those three lines in the Awaiting box instead of the command center and skips them.
  - Verdict: none.

### Declined to judge

- The round report's "before the change" run of the new row (`count: 2`). Reproducing it would mean taking the change out of the tree, which the brief and the rules file forbid. The row was read instead: it asserts `count: 1`, and the per-value `countUnder` of the snapshot copy would give 2.
- Runs of cases 1 to 8 on the base. Ruling 523 (a) sets them aside, and they would need a checkout of `046e0debc` (`git worktree add` or `git checkout`), outside the three allowed git commands.
- The worktree's change to `.scratch/migration/agents/briefs/O95.md`. It equals main's copy, so it is the orchestrator's sync, and whether the landing's cherry-pick carries it is the orchestrator's decision.
- Look cases 9 to 19 and the before/after lines for B2, B3 and B4. They need the running server at the look on landing.
- Whether the builder's single round run of Verify 1 came after its last edit. Only the builder's transcript would settle it. The tree I ran on passes the same command.

Reviewer usage: a93342c9c8025f2d6, claude-opus-5-5, 193784 tokens, 49 tool uses, 7 min 48 s
