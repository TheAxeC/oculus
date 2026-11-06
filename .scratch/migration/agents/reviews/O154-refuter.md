# Step O154 refuter report (on .agents/worktrees/migration-O154, base a6e95bf72)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npm run diagrams && npm run docs:palette        (worktree root, Node 24.21.0)
... docs/diagrams/writes.svg
> oculus@1.0.0 docs:palette
> node utils/diagrams/palette.mjs
docs/palette.md
md5 of docs/diagrams/* and docs/*.md before and after: fcde7b6dcd513de97d51cadfb121ace2 both times (the regeneration changed no file)

$ npm run test:quick -- --base a6e95bf72
test:quick: 25 changed file(s), from git since a6e95bf72
test:quick: 31 test file(s)
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.1 s)
ok      eslint (2.6 s)
ok      svelte-check (9.4 s): 1793963593598 COMPLETED 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest slow (43.2 s): Duration  31.32s (transform 15.25s, setup 0ms, import 20.11s, tests 11.05s, environment 0ms)
ok      vitest (45.9 s): Duration  34.96s (transform 48.65s, setup 0ms, import 96.30s, tests 19.93s, environment 278ms)
ok      vitest checks (61.0 s): Duration  49.76s (transform 31.36s, setup 0ms, import 65.77s, tests 126.08s, environment 3ms)
test:quick: 63.3 s; every command passed

$ npx vitest run --reporter=dot tests/state/boards/board/board-rules.test.ts tests/state/boards/board/board-views.test.ts tests/state/boards/board/hub-facets.test.ts tests/checks/imports/cycles.test.ts tests/data/sources/present.test.ts
 Test Files  5 passed (5)
      Tests  120 passed (120)

$ grep -rn --exclude=local.yml "FILTER_GROUPS\|FILTER_FACETS\|FILTER_LAYOUT\|keptKeys\|filterGroupsOf\|deckTally\|DeckFilters\|FilterLine\|projectFilter\|projectKeeps\|present\.filter\|Filtered:\|Pillar and Form" src tests config docs README.md
c15a exit=1 (no output)
$ grep -n "filtered\|filter_clear\|^        filter:" config/text/views/academic/present.yml
c15b exit=1 (no output)
$ grep -n "Present" src/lib/views/shared/forms/bar/FilterBar.svelte src/lib/views/shared/forms/bar/SliceLine.svelte src/lib/state/boards/structure/map-bar.ts
src/lib/views/shared/forms/bar/FilterBar.svelte:2:    // Layer 3, shared view partial of the project boards and the Present view, through the shared
src/lib/views/shared/forms/bar/SliceLine.svelte:2:    // Layer 3, shared view partial of the project boards and the Present view, through the shared
(both true: each line is drawn for the Present view through BoardBar.svelte)

$ LC_ALL=C perl -ne '<the rules file's gate>' $(find src tests bin config -type f ! -name local.yml)
find: bin: No such file or directory
gate exit=0 (no output)
$ the same perl check over every changed file, BoardBar.svelte, the six diagram files and the report
touched exit=0 (no output)

$ wc -l (changed files)
416 filter-menu.ts | 85 index.ts | 563 collection/bar.ts | 251 map-bar.ts | 749 present.ts | 756 present.svelte.ts | 103 BoardBar.svelte | 219 FilterBar.svelte | 253 SliceLine.svelte | 387 Projects.svelte | 196 acts/filter.svelte.ts | 142 Bar.svelte | 462 Present.svelte | 158 present.yml
(every component at or under 520, every source file under 880)

$ sh utils/folder-check.sh
exit=0 (src/lib/views/shared/forms/bar holds 5 items; src/lib/state/boards/board holds 10, as on the base copy)

$ sh utils/unused-exports.sh 2>/dev/null | diff ../O154-base/unused-exports.txt -
1c1
< Unused exports (226)
---
> Unused exports (225)
124,125c124
< src/lib/state/boards/board/index.ts: FACETS, NONE, venueText, facetHeading, valueLabel, emptyBoardState, facetValues
< src/lib/state/boards/board/state.ts: emptyBoardState
---
> src/lib/state/boards/board/index.ts: FACETS, NONE, venueText, facetHeading, valueLabel, facetValues
(no line added; equal to the report's quote)

$ history-word grep over the added lines of `git diff -U0 a6e95bf72 -- src config docs` plus BoardBar.svelte (before, used to, no longer, still, always has been, always had, as before, previously, the step adds, after this package lands, a step id, a date)
8 hits, all "before any filter" or "before that answer": each says which projects a count is over or when a read happens; none is history.

$ diff -rq over src, config, tests, utils against ../O154-base
13 changed files and "Only in migration-O154/src/lib/views/shared/forms/bar: BoardBar.svelte"; tests and utils unchanged.

Case-run program of the report, rerun (the report's after.test.ts, same fixture and calls, run inline with `node --input-type=module -e`, rune stubs on globalThis, writing no file):
C2 members: ["a","b","c"]
C2 deck: {"mine":true,"named":true,"heldFilters":{},"heldMine":true,"search":"","groups":["year:2026=2","tier:research=2","funding:__none__=2","compute:__none__=2","reproduced:0=2","code:__none__=2","sessions:none=2"],"shown":["a","c"]}
C2 board of the same projects equal: true
C2 stats over members: {"projects":3,"blocked":0,"dated":1,"waiting":0,"warnAt":4,"venues":[]}
C2 kept list with Mine only on: ["a","c"]
C2 kept list with Mine only off: null
C3 search beta: ["b"]
C4 stale toggle, lag 4: ["c"]
C5 no person marked: mine false named false kept null
C5 every member the users: mine false kept null
C12 function: {"mine":true,"named":true,"heldFilters":{"tier":["research"]},"heldMine":true,"search":"","groups":[...same seven...],"shown":["a","c"]}
C12 parsePresentState: {"search":"","stale":false,"dated":false,"waiting":false,"mine":true,"filters":{"tier":["research"],"slice":["gone/idea"]},"slide":"s2","overview":false,"recent":[],"facts":true}
C13 hub group: [["hub",2],["hub2",0]]
C20 Mine only, no member the users: kept [] shown 0 of 3
C20 a pick no member carries: kept [] groups ["tier:research=3,nothing=0"]
C9 leftDeck: {"search":"","stale":false,"dated":false,"waiting":false,"mine":true,"filters":{},"slide":"","overview":false,"recent":[{"root":"hub","path":"one"}],"facts":false}
(every line equal to the report's)

First-run base lines, rerun the same way against ../O154-base/src:
C1 base groups: ["stage","tier"]
C5 base keptKeys with no pick: null
C12 base O147 parse: {"stage":["idea"],"tier":["research"]}
(equal to the report's)

Premise spot checks on the base copy: Projects.svelte 487, present.ts 812, filter.svelte.ts 172, Present.svelte 461, Bar.svelte 158 lines; STAGE_FACET imported only by present.ts outside map-bar.ts; projectFilter/projectKeeps only in collection/bar.ts and present.ts; no test names parsePresentState, leftDeck or keptKeys; state/boards/board holds 10 items. All reproduce. No docs/adr folder and no `adr` key in plan.yaml.
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `boardFilter` and `BoardFilter` in `filter-menu.ts`, exported through `index.ts`; `Projects.svelte:177-181` reads it and computes none of the chain; its arguments are the base's (`selfNamed()`, `hubs`, `instanceState(instance.id)`, `lag`, `preset.labels` inside), so the board's and the Awaiting tab's answer is the base chain's call for call (G124 and G92 files green).
- 2: holds. `src/lib/views/shared/forms/bar/BoardBar.svelte` draws FilterBar (search, the three chips, Mine only, groups, LINE_FACETS, badges, withPick toggles) and SliceLine (slices, counted, shown, `stats.projects`, `shownWords`, Clear all) with the base snippets' props and texts; `Projects.svelte:329` and `Bar.svelte` draw it.
- 3: holds. `PresentState = PresentBar & {...}`, `parsePresentState` spreads `barFields(parseBoardState(value))`, so every write through `parsePresentState` or `{ ...held, ...changes }` keeps the six fields; `leftDeck` spreads `barFields(emptyBoardState())`; stage key dropped by `FACETS`, slice and compute values checked in `boardFilter` (rerun C12).
- 4: holds. `memberItems` matches `projectId` to board items of `deck.hub` by `rootOf`/`bareId`, one item per project, members from the whole answer (the C13 ruling's planned build); stats over members; no bar while `work` is null or undefined (`Bar.svelte` `{#if filter !== null}`).
- 5: holds. `shownKeys` (null when all shown, sorted unique keys, `[]` for none); `keepFor` and `keep` are both `keepOf(worked(instance, ref))` (see C10); `undefined` while the whole answer loads or `portfolio()` is null; `answer` returns PENDING while keep is undefined and `last` is null; the slide rule effect runs on each change of the kept list. The rule also runs on the first resolution at open (report decision 5), which keeps "the slide on screen" true when a later widening comes.
- 6: holds. C15 greps print nothing; `deckHub` (used only by the removed wiring) removed; `STAGE_FACET` local in `map-bar.ts`; `ProjectLayout` kept unexported for the collection's own bar, `category` non-null since `sectionLayout` always sets it; Bar.svelte's line, Clear, CSS and `FilterLine` gone; the five present.yml keys gone.
- 7: holds. The head comments named in item 7 are rewritten and the report lists each as rewritten or true as it stands; `docs/templates.md`, `docs/decks.md` "The filter" (heading unchanged) and the HELP.md Present bullet say what item 7 lists. The edits at `docs/decks.md:131` and `docs/HELP.md:334` are outside the write list's line ranges but inside its files; both sentences became false under the board's rules (the search, the toggles and Mine only narrow without a pick), the rules file makes such a sentence a defect of the change and the brief's last write-list sentence covers it, and the report names both with the reason. Not a finding.

Cases of the brief's "Cases":

- C1: met by reading (BoardBar under the toolbar, board texts, base drew only the five groups, rerun `C1 base groups`); the drawn bar is for the look.
- C2: met. Same function and same component for both; side-by-side reading of `Projects.svelte` and `filter.svelte.ts` `worked`/`bar` gives the same argument calls and props; rerun `C2 board of the same projects equal: true`.
- C3: met (rerun `C3 search beta: ["b"]`; deck read under `shownKeys`); look for the field.
- C4: met (rerun `C4 stale toggle, lag 4: ["c"]`; chips write `stale`, `dated`, `waiting`).
- C5: met (rerun: Mine only applies and narrows to ["a","c"]; all-mine `mine false kept null`; unnamed `named false`; FilterBar draws Mine only and Role only while `named`).
- C6: met by reading (SliceLine's slice and label presses and Clear all are the board's, `onfilters` writes `filters` only, leaving search and toggles).
- C7: met (`shown={filter.shown.length}`, `total={stats.projects}`, `shownWords`; members one per project, rerun `C2 members: ["a","b","c"]` for a deck with `a` in two groups).
- C8: met by reading (`worked` null for a non-filterable deck, `bar` null, Bar.svelte draws nothing).
- C9: met (rerun `C9 leftDeck`; every write is `setInstanceState`; no write route is called by the bar).
- C10: met by reading (`keepFor = keepOf(worked(instance, ref))`, pane `keep = keepOf(work)` with `work = worked(reads.instance(), reads.ref())`; presentation link, export and live read these unchanged).
- C11: met by reading (keep undefined until the whole answer and snapshot are in, `deck()` gives PENDING for undefined, `last` null on a fresh mount; the audience is told nothing while keep is undefined, `present.svelte.ts` `sendKeep`; export refuses on undefined, `acts.svelte.ts:89`).
- C12: met (rerun `C12 function`: stage and stale slice dropped, tier kept, Mine only on).
- C13: met under the cases ruling (rerun `C13 hub group: [["hub",2],["hub2",0]]`; `memberItems` excludes `hub2:a`, rerun `C2 members`).
- C14: met (G124 and G92 test files green; the board's call sites read equal to the base chain).
- C15: met (greps above).
- C16: met by reading (`Present.svelte` write `{ ...held, ...changes }` with `held = parsePresentState(...)`, `screen/box.ts` through it, `presentation.svelte.ts:68` through `parsePresentState`).
- C17: met by reading (whole answer never dropped: `asking` skips `key[3] === keepKey(null)`, `present.svelte.ts` `asking`; `gcTime: Infinity`, `queries.svelte.ts:49`; the link's effect root reads `keepFor` reactively).
- C18: met by reading (`deckOf(ref, null)` gives PENDING, loading true, for a deck not read, so `worked` is undefined; print page wait unchanged).
- C19: met (rerun `C2 members` leaves `talk-x` out; null draws it; a list drops it on the server, `groups.ts` `keptMembers`).
- C20: met (rerun `kept [] shown 0 of 3` and the unheld pick at 0; slide rule writes the first slide).
- C21: met by reading (one query key per kept list; `answer` reads only the current key and draws `last` while it is pending).
- C22: met by reading (the bar is the Pane's `bar` snippet; keys are bound to the box at `Present.svelte:371`); look for the field.
- C23: met by reading (a mark rereads the whole answer, `work` and `keep` follow, the `previous`/`moving` effect fires on the changed list).
- C24: met by reading (each pane's `worked` reads its own `instanceState(instance)`; the print page is answered by the exporting pane's channel).
- C25: met by reading (`mine: z.boolean().catch(true)` in `boardStateShape`).
- C26: met by reading (the Awaiting tab goes through the same `boardFilter` call with `awaitingPreset` items; G124 green).

## 1. Spec

- `.scratch/migration/agents/reviews/O154-report.md`, "Limitations, sharp edges and helper programs": "I used two print-only helper programs in the scratchpad: `wrap.py`, which printed a paragraph wrapped at 100 columns, and `short.py`, which printed comment lines that end short. They changed no file"; what is wrong: two scripts written for the step that the brief does not build under "What to build" and no line of `plan.md`'s Rulings approves; the rules file ("What every package obeys", the case-run paragraph) allows a case-run program and says any other script needs the approval the brief names, and this brief names none. Their output shaped the comment rewraps of the rewritten head comments (item 7); the files themselves were changed with Edit and Write by the builder's statement, and the reviewer cannot see the scripts, which are deleted. The standing ruling "Unapproved builder scripts" (`plan.md` Rulings) covers programs that edited files; whether it also closes print-only programs is the orchestrator's reading; failure scenario: a builder's own program decides the wrapping of comment paragraphs that land with no approved source to rerun, so a reviewer can judge the result only by reading it (the comment-width check and prettier passed over it in the rerun); verdict: no item made violated, since the rewrapped comments read correctly and the comment-width check is green.

## 2. Proof

none

## 3. Standards

none

## 4. Behaviour

none. The report gives before and after for each change named in the request: Mine only on by default (C5, C11 "Before, the whole deck was drawn, since the base had no Mine only", "Decision 3, visible"); the slide rule at open (decision 5: the pane may write its first slide's key on open, "the base wrote nothing on open"; the drawn slide is the same, since `slideAt` falls back to the first slide, `present.ts:337`); the loss of the "Filtered" line and its Clear (C1 before: the five group buttons; after: the two board lines, "The toolbar no longer holds the 'Filtered: ...' line or the Clear button"; C6 says Clear all leaves the search and toggles).

## Declined to judge

- The drawn bar, the field's key handling, the loading state on reload, the audience window with the tab hidden and the two Projects boards on screen (C1, C3, C5, C6, C8, C11, C14, C17, C22, C26): the reviewer runs no page; the look at landing settles them against the report's "Before and after".
- The report's statement that the verify list ran once and no whole-suite command ran: it rests on the builder's transcript, which the reviewer does not read.
- The report's C15 first-run count ("the first grep printed 58 lines") on the base: the base copy holds no `docs` or `README.md`, and `git show` per path over the whole tree was not run; no decision rests on the count.
- What `wrap.py` and `short.py` held and printed: both are deleted (`ls` of `scratchpad/wrap` and `scratchpad/caserun`: No such file or directory).
- The doubled deck-route reads for a narrowed pane (report limitation): not measured by the builder, and a measurement needs a running page.

Reviewer usage: a40ee61bf8428979b, claude-opus-5-5, 269077 tokens, 74 tool uses, 16.5 min.

## Repair round 1, refuted

```
Round delta: for each of the 23 paths of ../migration-O154-round-1/files.txt, diff -u snapshot vs worktree
23 of 23 "same", no DIFF, none missing
$ git diff a6e95bf72 --stat | tail -1
 22 files changed, 371 insertions(+), 484 deletions(-)

$ npm run diagrams; npm run docs:palette   (md5 of docs/diagrams/* docs/*.md before and after: 47ea99e1cdee69325c58e3b8cb6e050a both times)

$ npm run test:quick -- --base a6e95bf72      (run 1, O156 running beside it)
 Test Files  1 failed | 15 passed | 1 skipped (17)
      Tests  1 failed | 340 passed | 3 skipped (344)
test:quick: 261.1 s; failed: vitest
$ npm run test:quick -- --base a6e95bf72      (run 2, no file changed between the runs)
ok      prettier (11.3 s) | ok ASCII gate (11.9 s) | ok svelte-kit sync (17.2 s) | ok eslint (16.6 s)
ok      svelte-check (46.9 s): 584 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (143.4 s) | ok vitest slow (154.3 s) | ok vitest checks (178.6 s)
test:quick: 198.3 s; every command passed

$ npx vitest run --reporter=dot <the five brief test files>
 FAIL  |unit| tests/checks/imports/cycles.test.ts > the runtime import graph of src > holds no cycle
 Tests  1 failed | 119 passed (120)
$ npx vitest run tests/checks/imports/cycles.test.ts
 Tests  7 passed (7)
$ npx vitest run --reporter=dot <the same five files>
 Tests  120 passed (120)

C15 greps: c15a exit=1, c15b exit=1, the third prints FilterBar.svelte:2 and SliceLine.svelte:2 (both true)
ASCII gate over the tree and over the 27 touched paths: exit 0
wc -l: every component at or under 520, every source file under 880
unused-exports: 226 to 225, no line added | folder-check exit=0
history-word grep: 11 hits, none history

Transcript checks (agent-acf1b0553e05d698a.jsonl): wrap.py and short.py sources and the twelve runs equal the report's "Programs"; the 16 paragraphs equal their runs' output but present.svelte.ts:9 ("keeps" printed, "shows" in the file); round 1 calls (11:27:01 to 11:33:32): reads, the verify list once, Edit of the report only.
Other inline programs of the first build, none named in the report: 10:29:38 python3 edit of scratchpad/caserun/base.test.ts (inserts a setCatalog import and call); 10:57:00, 10:58:09, 11:01:48, 11:02:01 python3 prints of the transcript; 11:02:33 python3 - "$T" > scratchpad/caserun/base-src.txt.
base.test.ts as written at 10:28:46, run at 10:29:00: "Tests 5 failed" (text key not in the text catalog: board.section_other); after the python3 edit, 10:29:38: "Tests 5 passed (5)" with the quoted lines. The report's quoted base.test.ts equals the 10:28:46 Write, with no setCatalog.
```

### Verdicts

Items 1 to 7: hold, over the whole diff since the base (the round changed no file of the step).

Cases C1 to C26: met, as the first run gave them; C13 under the cases ruling.

### Findings

- Spec. Builder transcript at 10:29:38, 10:57:00, 10:58:09, 11:01:48, 11:02:01 and 11:02:33 (first build); the report's "Programs" section names only `wrap.py` and `short.py`. Six inline `python3` programs the brief does not build and no Rulings line approves: the first edited the case-run program `scratchpad/caserun/base.test.ts`; the other five printed parts of the builder's transcript, the last by a redirect into `scratchpad/caserun/base-src.txt`, whose text became the report's quoted `base.test.ts`. They fall under the standing ruling "Unapproved builder scripts". Failure scenario: the orchestrator reads only the hunks the "Programs" section lists and does not learn that a program edited the first-run case program. Verdict: none.
- Proof. `O154-report.md`, "The cases' first run", the quoted `base.test.ts`: the quote is the file as written at 10:28:46, which failed all five tests; the quoted output came from the 10:29:38 run, after the python3 edit inserted the `setCatalog` import and call. The quoted program does not print the quoted lines. Failure scenario: a reader who runs the quoted `base.test.ts` against the base gets five failures in place of the quoted first-run lines. Verdict: no case made partial; the changed-tree results come from `after.test.ts`, quoted as written and run.
- Standards. `src/lib/state/boards/board/filter-menu.ts:15-16`: "It lives in this file because it calls facets.ts and state.ts, and facets.ts imports state.ts, so a home in either would make an import cycle." The stated cause gives a cycle for a home in `state.ts` but not for `facets.ts`; the cycle there comes from `filterGroups`, which lives in this file, which imports `facets.ts`. Failure scenario: a maintainer checks the stated cause, finds no cycle for `facets.ts`, moves `boardFilter` there and meets the red cycle check with a comment that does not explain it. Verdict: none.

### Declined to judge

- The red lines of the first `test:quick` run and of the first five-file run (`cycles.test.ts > holds no cycle`): the error text was cut by the reviewer's filters; no file changed between the runs, and the cycle check passed alone and the second runs passed. The reviewer's judgment is load from O156's suite beside it, not verified; the landing's own run of the list gives a further reading.
- The drawn bar and the states for the look (C1, C3, C5, C6, C8, C11, C14, C17, C22, C26): no page was run.
- The disposition of the six python3 programs: the orchestrator's.
- The first-run lines of the corrected `base.test.ts`: not rerun, since a rerun needs a written file.

Reviewer usage: a94ce92d3cbedacf9, claude-opus-5-5, 247816 tokens, 70 tool uses, 20.0 min.

## Closed

- First run, Spec 1 (`wrap.py`, `short.py`): closed under the standing ruling "Unapproved builder scripts"; round 1 listed both programs, their twelve runs and the 16 paragraphs they shaped, and the orchestrator read each paragraph in the diff and keeps it; the breach is recorded in the booking.
- Over round 1, Spec (six inline `python3` programs): closed under the same ruling. None wrote a file of the worktree: the first edited the scratchpad case-run program and the others printed the transcript, one by a redirect into the scratchpad. The breach is recorded in the booking with each program, and the only text of theirs that reached the step is the report's quote, corrected at landing (next item).
- Over round 1, Proof (the quoted `base.test.ts`): fixed at landing in the report, where the quote gains the import and the call the python3 edit inserted, word for word from the transcript.
- Over round 1, Standards (`filter-menu.ts:15-16`): fixed at landing; the comment names the cause: `boardFilter` calls `filterGroups` of this file, which imports `facets.ts` and `state.ts`, so a home in either would import this file back and make a cycle.
