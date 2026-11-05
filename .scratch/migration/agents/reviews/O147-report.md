# O147 report: the Present view's filter bar

Everything in the brief is done. Not verified: the cases that need the app in a browser (the bar drawn in the hub's portfolio deck for C1, the PDF's pages for C9, the audience window for C8, the panes of C12 and C13 on screen). The rules file lets the builder start no browser, so each of those cases was checked on the code, the reader, the route and the pane's pure rules; the look-ready before and after is in the section on visible changes below.

## Open items of the state file, verbatim

## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

## The cases' first run, on the unchanged tree

Scratch programs, all in `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o147/`: `cases.ts` (reader, route, `parsePresentState`, run as `ROOT=<tree> node cases.ts`), `client-cases.ts` (the pane's rules over a read deck and board items made by `boardItems` from the board test fixture), `collection-same.ts` (the collection bar, printed for two trees). Each writes only into a directory under the system temporary directory and removes it. The base copy is `.agents/worktrees/O147-base`.

Base run of `cases.ts` (`ROOT=.agents/worktrees/O147-base node cases.ts`), saved as `base-cases.txt`. The deck has groups `first` (alpha, beta and the non-project deck talk; candidate gamma), `second` (beta, gamma) and `plain` (talk only); the order draws `first`, a summary of `first`, a grid of `second` and `plain`.

```
C2/C11/C15 reader, no keep:
  slides title.md#0 alpha/main.md#0 beta/one.md#0 beta/one.md#1 talk/one.md#0 summary:first grid:second talk/one.md#0~2
  title lede 4 slides. | legend ["heart","brain"]
  summary rows alpha,beta,Talk
  grid cards beta,gamma
  group first count 4 members [["alpha",null,null],["beta",null,null],["talk",null,null]] candidates [["gamma",null,null]]
  group second count 3 members [["beta",null,null],["gamma",null,null]] candidates [["alpha",null,null]]
  group plain count 1 members [["talk",null,null]] candidates []
C2/C11/C15 reader, keep [alpha, gamma]:
  (the same seven lines as with no keep)
C4 reader, keep []:
  (the same seven lines as with no keep)
C10 GET no keep: 200 deck with 8 slides
C10 GET keep=nope: 200 deck with 8 slides
C10 GET keep=[1]: 200 deck with 8 slides
C10 GET keep=[""]: 200 deck with 8 slides
C10 GET keep of 1025 keys: 200 deck with 8 slides
C10 GET keep of 1024 keys: 200 deck with 8 slides
C10 GET keep=[] (nothing kept): 200 deck with 8 slides
C10 POST keep "nope": 200 deck with 8 slides
C10 POST keep [1]: 200 deck with 8 slides
C10 POST keep 1025 keys: 200 deck with 8 slides
C10 POST no keep: 200 deck with 8 slides
C6 parsePresentState({ filters: { stage: ["submitted"] } }): {"slide":"","overview":false,"recent":[]}
C6 parsePresentState({ filters: "nope" }): {"slide":"","overview":false,"recent":[]}
C6 parsePresentState({ filters: { stage: [1] } }): {"slide":"","overview":false,"recent":[]}
C6 parsePresentState({ filters: { colour: ["red"], tier: ["research"] } }): {"slide":"","overview":false,"recent":[]}
```

Base readings, command `cd .agents/worktrees/O147-base && grep ...` as named per case:

- C1. `grep -rn 'FilterBar\|filters\|keep' src/lib/views/academic/present src/routes/present` prints no FilterBar and no `filters`; its 19 hits are the word "keep" or "keeps" in comments and the key helper `keepTab` (Present.svelte:24, :43, :85, :358, markup.ts:6, screen/Stage.svelte:5, screen/keys.ts:2, :20, :26, :36, :37, :50, parts/Words.svelte:35, arrange/arrange.svelte.ts:14, arrange/Tile.svelte:173, Panel.svelte:98, show/+page.svelte:9, :18, :116). The pane draws no filter bar, so no group, no Status group and no "Filtered" line exist.
- C2. No pick exists (C1). At reader level the base reads the same deck under any keep (the run above: `keep [alpha, gamma]` gives count 4 and every member). The Overview's tiles are every member (`arrange.ts:100`, `group.members.map`), the group count is every member (`Group.svelte:134`, `count={block.group.members.length}`).
- C3. No Clear: base `Bar.svelte` (108 lines) holds the deck menu, the step buttons, Overview, Present, Presenter, Export, the status line and the counter only.
- C4. The run above: `keep []` reads the whole deck.
- C5. No bar in any deck (C1).
- C6. The run above: `parsePresentState` drops `filters` in every row.
- C7. `deckDropped` (`arrange.ts:246-280`) writes `into.slides` with the dropped name placed beside `onto` in the file's list; every member is drawn, so nothing is hidden.
- C7b. `deckStepped` (`arrange.ts:288-305`) moves the deck one place among every member: `const drawn = group.members.map((one) => one.name); const next = withMove(drawn, name, drawn.indexOf(name) + by);`.
- C8. The audience page reads `readDeck(ref, data.token)` (`show/+page.svelte:127`); `messageShape` holds the kinds slide, changed, end, left, opened, move, closed only (`present.ts:527-533`); the address is `audienceAddress(ref)`, `?root=&path=`.
- C9. The print page reads `readDeck(...)` with the root and path of its address and the token (`print/+page.svelte:79`); `grep -n 'locks\|exportName' src/lib/views/academic/present/acts/export.ts src/lib/state/life/present.ts` prints nothing, so no export lock exists and a second press opens a second export. `src/desktop/windows/print.ts:51`: `const deadline = Date.now() + (options.wait ?? READY_WAIT_MS);`, 60 s from before the load.
- C10. The run above: every `keep` row answers 200.
- C11. The run above: the non-project member talk is in every read.
- C12. `grep -n '\[KIND, ' src/lib/state/life/present.svelte.ts` prints `:273 queries.read([KIND, ref.root, ref.path], ...)`, `:339 queries.peek<DeckAnswer>([KIND, one.root, one.path])`, `:419 queries.peek<DeckAnswer>([KIND, ref.root, ref.path])`: one query per deck, so two panes on one deck read one answer.
- C13. `indexOf` and `slideAt` (`present.ts`) draw the first slide for a key the deck does not hold, and the pane's saved `slide` keeps the old key.
- C14. Base `leftDeck` returns `{ ...held, slide: '', overview: false, recent: ... }`; `PresentState` holds no `filters`.
- C15. No count of decks exists on the base (C1).

The G32 test's failing run on the unchanged tree: the worktree's `tests/data/sources/present.test.ts` (`cmp` with the worktree's file: identical) in a scratch root whose `src`, `config` and `tests/fixtures` are links to the base copy, run from that root as `./node_modules/.bin/vitest run --root "$PWD" --config "$PWD/vitest.config.mjs" tests/data/sources/present.test.ts`. Its lines, with the glyphs vitest prints written in ASCII:

```
 > tests/data/sources/present.test.ts (5 tests | 1 failed) 740ms
     x narrows every group of project decks to the kept projects, in the slides, counts, summary, grid, legend and nested groups, and marks each member 236ms
 FAIL  tests/data/sources/present.test.ts > the deck reader > narrows every group of project decks to the kept projects, in the slides, counts, summary, grid, legend and nested groups, and marks each member
AssertionError: no filter: expected [ [ ...(3) ], [ ...(2) ] ] to deeply equal [ [ ...(3) ], [ ...(2) ] ]
- Expected
+ Received
  [
    [
      [
        "alpha",
-       "alpha",
-       true,
+       undefined,
+       undefined,
      ],
      [
        "beta",
-       "beta",
-       true,
+       undefined,
+       undefined,
      ],
      [
        "talk",
        undefined,
-       true,
+       undefined,
      ],
    ],
    [
      [
        "alpha",
-       "alpha",
-       true,
+       undefined,
+       undefined,
      ],
      [
-       "gamma",
        "gamma",
-       true,
+       undefined,
+       undefined,
      ],
    ],
  ]
 > tests/data/sources/present.test.ts:417:15
 Test Files  1 failed (1)
      Tests  1 failed | 4 passed (5)
```

The base answer's members carry neither `projectId` nor `kept`, so the first row (no filter) fails at line 417; the narrowing rows are not reached, and the base reader ignores `keep` (`base-cases.txt` above).

## The cases after the change

`ROOT=.agents/worktrees/migration-O147 node cases.ts`:

```
C2/C11/C15 reader, no keep:
  slides title.md#0 alpha/main.md#0 beta/one.md#0 beta/one.md#1 talk/one.md#0 summary:first grid:second talk/one.md#0~2
  title lede 4 slides. | legend ["heart","brain"]
  summary rows alpha,beta,Talk
  grid cards beta,gamma
  group first count 4 members [["alpha","alpha",true],["beta","beta",true],["talk",null,true]] candidates [["gamma","gamma",true]]
  group second count 3 members [["beta","beta",true],["gamma","gamma",true]] candidates [["alpha","alpha",true]]
  group plain count 1 members [["talk",null,true]] candidates []
C2/C11/C15 reader, keep [alpha, gamma]:
  slides title.md#0 alpha/main.md#0 summary:first grid:second talk/one.md#0
  title lede 1 slides. | legend ["heart"]
  summary rows alpha
  grid cards gamma
  group first count 1 members [["alpha","alpha",true],["beta","beta",false],["talk",null,false]] candidates [["gamma","gamma",true]]
  group second count 1 members [["beta","beta",false],["gamma","gamma",true]] candidates [["alpha","alpha",true]]
  group plain count 1 members [["talk",null,true]] candidates []
C4 reader, keep []:
  slides title.md#0 summary:first grid:second talk/one.md#0
  title lede 0 slides. | legend []
  summary rows 
  grid cards 
  group first count 0 members [["alpha","alpha",false],["beta","beta",false],["talk",null,false]] candidates [["gamma","gamma",true]]
  group second count 0 members [["beta","beta",false],["gamma","gamma",false]] candidates [["alpha","alpha",true]]
  group plain count 1 members [["talk",null,true]] candidates []
C10 GET no keep: 200 deck with 8 slides
C10 GET keep=nope: 400 {"error":"invalid"}
C10 GET keep=[1]: 400 {"error":"invalid"}
C10 GET keep=[""]: 400 {"error":"invalid"}
C10 GET keep of 1025 keys: 400 {"error":"invalid"}
C10 GET keep of 1024 keys: 200 deck with 8 slides
C10 GET keep=[] (nothing kept): 200 deck with 8 slides
C10 POST keep "nope": 400 {"error":"invalid"}
C10 POST keep [1]: 400 {"error":"invalid"}
C10 POST keep 1025 keys: 400 {"error":"invalid"}
C10 POST no keep: 200 deck with 8 slides
C6 parsePresentState({ filters: { stage: ["submitted"] } }): {"slide":"","overview":false,"recent":[],"filters":{"stage":["submitted"]}}
C6 parsePresentState({ filters: "nope" }): {"slide":"","overview":false,"recent":[],"filters":{}}
C6 parsePresentState({ filters: { stage: [1] } }): {"slide":"","overview":false,"recent":[],"filters":{}}
C6 parsePresentState({ filters: { colour: ["red"], tier: ["research"] } }): {"slide":"","overview":false,"recent":[],"filters":{"tier":["research"]}}
```

The `plain` group (talk only, no project deck) is not narrowed under a filter (C11, decision 4); talk is left out of `first` under a filter. In the C10 rows the route's source holds no projects, so the 200 for `keep=[]` is a deck with no group of project decks.

`ROOT=.agents/worktrees/migration-O147 node client-cases.ts` (deck groups `first` = alpha, beta, talk, gamma, delta and `second` = beta, gamma; board items of the hub `hub`: alpha submitted research journal, beta nascent research, gamma submitted software with chip parked, delta accepted research, and `other:alpha` of the hub `other`):

```
board items beta alpha gamma other:alpha delta
C1 groups, no pick: stage[nascent:1 submitted:2 accepted:1] status[parked:1] tier[research:3 software:1] form[journal:1]
C2 groups, Stage submitted: stage[nascent:1 submitted:2* accepted:1] status[parked:1] tier[research:1 software:1] form[journal:1]
C4 groups, Stage exploring (no member): stage[nascent:1 submitted:2 accepted:1 exploring:0*] status[parked:0] tier[research:0 software:0] form[journal:0]
kept list for no pick: null | tally 5 of 5 | first alpha,beta,talk,gamma,delta | second beta,gamma
kept list for Stage submitted: ["alpha","gamma"] | tally 2 of 5 | first alpha,gamma | second gamma
kept list for Stage submitted, Tier research: ["alpha"] | tally 1 of 5 | first alpha | second 
kept list for Status parked: ["gamma"] | tally 1 of 5 | first gamma | second gamma
kept list for Stage exploring: [] | tally 0 of 5 | first  | second 
C7b slides: ["alpha","beta","talk","gamma","delta"]
C7b alpha later: ["gamma","beta","talk","alpha","delta"]
C7b gamma earlier: ["gamma","beta","talk","alpha","delta"]
C7b gamma later (last kept): null
C7b alpha earlier (first kept): null
no filter, alpha later: ["beta","alpha","talk","gamma","delta"]
no filter, delta earlier: ["alpha","beta","talk","delta","gamma"]
C7 alpha dropped after gamma: {"lists":[{"group":"first","base":["alpha","beta","talk","gamma","delta"],"slides":["beta","talk","gamma","alpha","delta"]}]}
C7 gamma dropped before alpha: {"lists":[{"group":"first","base":["alpha","beta","talk","gamma","delta"],"slides":["gamma","alpha","beta","talk","delta"]}]}
Overview tiles under Stage submitted: first[alpha,gamma] second[gamma]
```

Read with the brief: the groups come in the order Stage, Status, Tier, Form (Pillar draws no group, since no item has a pillar); counts over the other groups' picks (C2: Tier counts only the submitted projects); a picked value no member holds is listed at 0 (C4, `exploring:0*`); `other:alpha` is counted nowhere, since it is of another hub; m counts beta once though it is in two groups (C15, `of 5`); a step passes the next kept tile and the hidden beta and talk keep their places (C7b); a drop goes beside its target in the file's list with the hidden decks in order (C7).

- C3. `filter.svelte.ts` `onclear: () => pick({})` writes `filters: {}`; `filtering({})` is false, so the kept list is null (the whole deck, the query key's last part empty) and `said` is the empty string, so `Bar.svelte` draws neither the line nor Clear.
- C5. `filterable(deck)` (present.ts) is false for a deck with no group whose members or candidates carry a `projectId`; `filter.bar()` is then null and `Bar.svelte` draws no `FilterBar` (`{#if filter !== null}`), so no room is kept.
- C6 (no request with an empty `keep` before the board items): `keepOf` in `filter.svelte.ts` returns undefined while `portfolio()` is null with picks held; `selectors.board` is empty exactly then (`src/lib/state/client/selectors.svelte.ts:366`, `return snapshot === null ? [] : boardItems(snapshot, preset, sessionsOf);`). `deck(ref, undefined)` returns PENDING with no query (`present.svelte.ts` `deck`), `createDrawn` skips the POST (`live.svelte.ts`, `keep === undefined`), and the export does nothing (`acts.svelte.ts`, `keep === undefined`).
- C8. The kept list reaches the audience page over `presentName(ref)` (code reading; not run in a browser): see the asynchronous paths below. `audienceAddress` and `printAddress` are unchanged, and `npx vitest run tests/data/sources/present.test.ts tests/server/desktop/window-guard.test.ts` passes (quoted in the table).
- C9. Code reading: `exportPdf` takes the lock `exportName(ref)` with `ifAvailable: true` before it opens the tab or asks the host; a second press while it is held says `present.export_running`. The print page waits `KEEP_WAIT_MS` = 5000 ms for the answer, then sets `data-failed`; `print.ts:51` starts its 60 s deadline before the load, so the page's failure arrives about 55 s before the host's timeout.
- C12. The query key is `[KIND, root, path, keepKey(keep)]` in `deck` (the read), `savedOf` (`prune`) and `savedFrame`; two panes with different filters hold two entries. `prune` keeps a measure while any fresh saved answer of the deck under any kept list, or any pane's drawn deck, holds the slide (`savedOf`).
- C13. `filter.svelte.ts`: a pick sets `moving`; once the answer under the new kept list is in (`loading` false), a slide key the new deck does not hold is replaced by that deck's first slide's key, and a key it holds is left alone.
- C14. `leftDeck` sets `filters: {}` (`present.ts`), and `open()` in Present.svelte writes `leftDeck(held, ref, target)`.

`collection-same.ts`, the collection bar with six pick rows on both trees: `ROOT=.agents/worktrees/O147-base node collection-same.ts > coll-base.txt; ROOT=.agents/worktrees/migration-O147 node collection-same.ts > coll-after.txt; cmp coll-base.txt coll-after.txt && echo SAME` prints `SAME`, so the layout-driven `projectRules` and `projectGroups` give the collection's Projects section as the base does. No test file covers `collectionBar` (`grep -rln 'collectionBar\|mapBar\|stageGroup' tests` prints nothing).

## DONE / NOT DONE

| Item | State | Check and its output |
| --- | --- | --- |
| 1 Reader narrowing, route `keep`, 400 | DONE | `cases.ts` after run above; G32 test passes |
| 2 Pane filter state, rules, keys, Overview query, slide kept | DONE | `client-cases.ts`, C6 rows, code readings C12, C13 |
| 3 Bar, FilterBar optional search and Mine, strings, Present.svelte size | DONE | `wc -l` below: Present.svelte 517 |
| 4 Overview, presenter, audience, PDF | DONE | `client-cases.ts` C7, C7b; code readings C8, C9; not run in a browser |
| 5 Docs | DONE | head comments section below |
| 6 G32 test, window guard unchanged | DONE | failing base run above; passes below |
| Verify 1: `npm run diagrams && npm run docs:palette`, then `npm run test:quick` | DONE, two red lines in files the step does not change, each rerun alone green | see below |
| Verify 2: named tests, window-guard diff | DONE | `Test Files  2 passed (2)`, `Tests  32 passed (32)`; `git diff --stat HEAD -- tests/server/desktop/window-guard.test.ts` prints nothing |
| Verify 3: ASCII gate, grep form | DONE | both print nothing |
| Verify 4: line and folder counts | DONE | below |
| Verify 5: unused exports | DONE | `diff .agents/worktrees/O147-base/unused-exports.txt <after>` prints nothing, `Unused exports (226)` |
| Verify 6: name greps | DONE | judgment calls section |
| Verify 7: history-word grep | DONE | judgment calls section |

`npm run diagrams` regenerated `docs/diagrams/channels.{dot,svg}`, `layer-state.{dot,svg}`, `layer-views.{dot,svg}`, `layers.{dot,svg}`; `npm run docs:palette` left `docs/palette.md` unchanged (`git status --short` does not list it). The non-layout changes in the diagrams (the edges and the edge-label nodes of each `.dot` compared with `git show HEAD:`): `layer-state.dot` gains the edge `folder state/life to folder state/boards` (label 2) and `folder state/life to layer data` goes from 26 to 27; `layer-views.dot` `folder views/academic to folder views/shared` 17 to 18 and `folder views/academic to layer state` 82 to 89; `layers.dot` `state to data` 545 to 546 and `views to state` 1552 to 1559; `channels.dot` gains the edge `"ch portfolio" -> "views/academic/present"` (the filter reads `entities.portfolio()`).

`npm run test:quick`, run once, its lines:

```
test:quick: 34 changed file(s), from git since HEAD
test:quick: 131 test file(s)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.9 s)
ok      eslint (23.2 s)
ok      svelte-check (66.8 s): 1793913366613 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (238.8 s): Duration  211.25s (transform 94.12s, setup 0ms, import 211.63s, tests 537.66s, environment 11ms)
FAILED  vitest (241.6 s)
 FAIL  |unit| tests/data/hubs/website-files.test.ts [ tests/data/hubs/website-files.test.ts ]
Error: Hook timed out in 10000ms.
 Test Files  1 failed | 104 passed | 13 skipped (118)
      Tests  1714 passed | 241 skipped (1955)
FAILED  vitest slow (254.5 s)
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > keeps a primary-hub id that begins with the name of a hub folder and a colon as a record of the primary, with no finding
Error: Test timed out in 20000ms.
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > a workspace of several hubs, every record under its hub and its key > gives a key two hubs hold two records, each project naming its own hub record, each shown by the key (C1)
Error: Test timed out in 20000ms.
 Test Files  1 failed | 20 passed (21)
      Tests  2 failed | 198 passed | 186 skipped (386)
test:quick: 257.6 s; failed: vitest, vitest slow
```

The list did not print `every command passed`. The three red lines are timeouts in two files the step does not change, run while another step's builder ran tests on the same machine. Each rerun alone:

- `npx vitest run tests/data/hubs/website-files.test.ts`: `Test Files  1 passed (1)`, `Tests  41 passed (41)`.
- `npx vitest run tests/data/hubs/hub-portfolio.test.ts --tagsFilter slow --testTimeout 20000`: `Test Files  1 passed (1)`, `Tests  16 passed (16)`.

Two files were edited after the list ran: `src/lib/state/boards/structure/map-bar.ts` (its head comment names the Present filter as a user of `stageGroup`) and `src/lib/state/life/present.svelte.ts` (`askDeck`, the saved deck read by POST under a kept list; see the brief's errors below). Their checks, each run on the final tree: `npx prettier --check` of both, `All matched files use Prettier code style!`; `npx eslint` of both, no output; the perl ASCII gate of both, no output; `npx svelte-check --tsconfig ./tsconfig.json --output machine`, `COMPLETED 4605 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`; `npx vitest run tests/checks/source tests/checks/tree tests/checks/diagrams tests/checks/imports tests/routes/docs/deck.test.ts tests/data/sources/present.test.ts tests/server/desktop/window-guard.test.ts --testTimeout 0 --hookTimeout 0`, `Test Files  17 passed (17)`, `Tests  191 passed (191)`; `sh utils/unused-exports.sh` against the base list, no difference. The list was run once; no whole-suite command was run.

## Files, from `diff -rq` against the base copy, with line counts (base, after)

`diff -rq .agents/worktrees/O147-base . -x node_modules -x .svelte-kit -x .git -x .scratch` lists these as differing or only in the worktree (the base copy holds `src`, `tests` and `config`; `docs` counts are from `git show HEAD:`):

| File | Base | After |
| --- | --- | --- |
| config/text/views/academic/present.yml | 150 | 157 |
| src/lib/data/model/model-deck.ts | 281 | 289 |
| src/lib/data/sources/deck/groups.ts | 195 | 219 |
| src/lib/data/sources/deck/read.ts | 675 | 709 |
| src/lib/server/content/deck/endpoint.ts | 79 | 111 |
| src/lib/server/content/deck/read.ts | 106 | 114 |
| src/lib/state/boards/collection/bar.ts | 534 | 599 |
| src/lib/state/boards/structure/map-bar.ts (outside the write list: `STAGE_FACET` was module-private and the brief has the filter use the Map's Stage group id) | 251 | 252 |
| src/lib/state/life/arrange.ts | 514 | 531 |
| src/lib/state/life/present.svelte.ts | 582 | 713 |
| src/lib/state/life/present.ts | 592 | 771 |
| src/lib/views/academic/present/acts/acts.svelte.ts | 138 | 144 |
| src/lib/views/academic/present/acts/export.ts | 108 | 172 |
| src/lib/views/academic/present/acts/filter.svelte.ts | new | 146 |
| src/lib/views/academic/present/acts/live.svelte.ts | 69 | 74 |
| src/lib/views/academic/present/acts/presentation.svelte.ts (what moves out of Present.svelte) | new | 72 |
| src/lib/views/academic/present/arrange/Group.svelte | 245 | 246 |
| src/lib/views/academic/present/arrange/Overview.svelte | 250 | 259 |
| src/lib/views/academic/present/Bar.svelte | 108 | 141 |
| src/lib/views/academic/present/Present.svelte | 520 | 517 |
| src/lib/views/shared/forms/bar/FilterBar.svelte | 213 | 221 |
| src/routes/present/print/+page.svelte | 160 | 172 |
| src/routes/present/show/+page.svelte | 291 | 309 |
| tests/data/sources/present.test.ts | 307 | 499 |
| docs/HELP.md | 632 | 632 |
| docs/templates.md | 1930 | 1930 |
| docs/diagrams/channels, layer-state, layer-views, layers (.dot, .svg) | regenerated | regenerated |

Every component is at or under 520 and every module at or under 880. `ls src/lib/views/academic/present/acts | wc -l` prints 7; `ls src/lib/views/academic/present | wc -l` prints 10 (no file added there). `kinds.ts`, `+server.ts`, `arrange.svelte.ts` and `Presenter.svelte` needed no change: the route passes the body and query to `endpoint.ts`, the moves already write `base: held.slides` whole, and the presenter draws the deck Present.svelte hands it.

## Edits to existing assertions in tests

None. `git diff --stat HEAD -- tests/data/sources/present.test.ts` prints `1 file changed, 192 insertions(+)`; the new `it` is added and no line of an existing one changes.

## Judgment calls, with the greps

Before each new name, `cd .agents/worktrees/O147-base && grep -rn --exclude=local.yml -w <name> src tests config | wc -l`: `keptMembers` 0, `ofProjects` 0, `ProjectLayout` 0, `projectFilter` 0, `projectKeeps` 0, `sectionLayout` 0, `DeckFilters` 0, `FILTER_GROUPS` 0, `filterable` 0, `deckTally` 0, `deckHub` 0, `filterGroupsOf` 0, `keptKeys` 0, `exportKeep` 0, `FilterLine` 0, `PaneFilter` 0, `createFilter` 0, `createPresentation` 0, `holdExport` 0, `answerPrint` 0, `EXPORT_HOLD_MS` 0, `KEEP_WAIT_MS` 0, `MAX_KEEP` 0, `keepShape` 0, `keepOf` 0, `keepKey` 0, `savedOf` 0, `askDeck` (added after the list; 0 in the base by the same grep form). Three names have base hits: `filtering` 22 (a parameter and prose words, no export of that name); `type Keep` 1 (a private type in `state/system/machine/lsp/edits.ts:148`, not exported); `exportName` 2 (an exported function of `server/sessions/transcript-routes.ts:210`, the transcript download's file name, in the server layer; no module imports both, so they never meet; reported as a name collision across layers). `DeckAnswer` 13 is the store's own type, now exported.

- The pane's hub: `deckHub` mirrors the server's rule in `server/content/deck/read.ts` (a hub root is its own hub, else the primary hub), from `fs.roots()` and `fs.primary()`, since the kept list cannot depend on the answer it keys.
- The kept list is the bare keys of every board item of the deck's hub that the picks keep, as the brief says, sorted and each once so one filter gives one query key; it is not cut to the deck's members, which only the answer knows. The groups' values are listed from the deck's member projects (C1 rows: `other:alpha` and no non-member is counted).
- `keep-asked` carries `from` (`audience` or `print`), a field the brief does not name, so the presenting pane answers only the audience page and the exporting pane only the print page.
- The presenting pane's `keep` carries `at: 0`; the export's carries the press time; the audience page takes only `at === 0` and the print page only `at > 0`. The brief names `at` only for the export's answer.
- While the deck under a new kept list is read, the pane draws the answer it last drew for the same deck (`filter.svelte.ts`, `last`), marked loading. Without it, a pick blanks the pane, and the presenting effect `rows.length === 0` ends a running presentation.
- C13 writes the first slide's key of the filtered deck (not the empty key), so a later Clear leaves the pane on the slide on screen.
- `FilterBar` draws the search when `onsearch` is given and Mine when `named` and `onmine` are; `room()` subtracts the search's width and its gap only when it is drawn.
- `parsePresentState` drops an unknown group key and keeps each pick once.
- The saved deck under a kept list is read by POST with no drafts (`askDeck`), the GET only for the whole deck; reason in the brief's errors below. GET `keep` stays as item 1 asks and is what C10 checks.
- The Web Lock is taken before `window.open` on the browser path, so the tab opens after one asynchronous turn of the press. Whether the browser still lets `window.open` run then (the press's transient activation) is not verified: no browser was started.
- `deckStepped` swaps the deck with the next kept member in the direction of the step, then applies the existing naming of the decks before the new place; with no filter the next kept member is the neighbour, and the no-filter rows of `client-cases.ts` give the base's one-place move.

History-word grep over the comment lines and test titles added or changed (`git diff -U0 -- src tests docs config ':!docs/diagrams'` plus the two new files, lines starting `//`, `*`, `/*`, `<!--` or holding `it(`, grepped for `before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|a package id|a date`):

```
10:+// before any filter, and keeps of it the members whose project's key the filter holds, a member
14:+/** Whether a group holds project decks: a member or a candidate, before any filter, is one. */
120:+ * the two keep their places. The decks before the moved one's new place, and every deck named
128:+// list cannot be worked out yet, before the first snapshot, asks for nothing.
254:+ * The audience page, when it opens, and the print page, before it reads the deck, ask which
294:+            // The channel listens before the page is opened, so the page's ask is never missed.
324:+     * drawn, the toggles and, where More holds groups of its own, More, each with a gap before the
327:+    // before it reads the deck the page asks over the deck's channel which projects the filter
```

The same grep over the lines `docs/HELP.md` and `docs/templates.md` gain, with `now ` added to the words, prints nothing.

Each hit is "before" as an order in a run or in a list (a member before a filter applies, a deck before a place, a read before the first snapshot, a gap before a control), none a comparison with an earlier state of the code. `tests/checks/source/history.test.ts` passes on the final tree.

## Ids, keys and messages, and the asynchronous paths

- `keep` (GET parameter, POST field): an array of 1 to 1024 non-empty strings or `[]`; `[]` keeps nothing (C4); absent is no filter; duplicates and unknown keys keep nothing extra (G32 row "beta and gamma kept, a key no project has and a duplicate"). Base `endpoint.ts` reads no `keep`, so nothing collides.
- `filters` in `PresentState`: other views keep their own `filters` in their own instance state (Collection, Map); a pane's state is its own, so the key does not meet theirs. Malformed reads as `{}` (C6).
- `projectId`, `kept` on `DeckMember`: `grep -rnw projectId src` on the base prints nothing; `kept:` on the base model is only `AppRow.kept` (`model/index.ts:339`), another type.
- Message kinds `keep-asked`, `keep`: the base kinds are slide, changed, end, left, opened, move, closed (`present.ts:527-533`); no collision.
- Lock name `oculus-present-export-<root=..&path=..>`; `presentName` is `oculus-present-<root=..&path=..>`. A `deckQuery` always starts with `root=`, so no deck's present name equals another deck's export name.
- Strings, all under `present` in `config/text/views/academic/present.yml`: `export_running`, `filter`, `filter_clear`, `filter_clear_tip`, `filtered`, `filtered_one`, `print_unanswered`. `grep -rn --exclude=local.yml -E '^\s+(export_running|filter|filter_clear|filter_clear_tip|filtered|filtered_one|print_unanswered):' config/text` finds each once in `present.yml` (lines 52, 85 to 89, 122); its other hits are `filter:` in `system/history.yml`, `sessions/session-list.yml`, `boards/focus.yml`, `sources/venues.yml`, `sources/files.yml` and `sources/search.yml`, and `filter_clear:` in `boards/projects.yml` (group `board`), each in a group of its own file, none in `present`. No value is empty. Readers (`grep -rn` over `src`): `export.ts` (`export_running`), `Bar.svelte` (`filter`, `filter_clear`, `filter_clear_tip`), `filter.svelte.ts` (`filtered`, `filtered_one`), `print/+page.svelte` (`print_unanswered`). `tests/checks/source/keys.test.ts` and `catalog-file-keys.test.ts` pass.

Asynchronous paths, by reading the code:

- A filter changed while a deck answer is in flight: the new kept list is a new query key, and the old answer lands under its own key. The pane draws the last answer of the deck until the new one is in, then checks the slide (C13). A drafted read in flight is dropped by `live.svelte.ts` (`current = false` in the effect's cleanup).
- An audience window opened before the pane answers: the page reads nothing until a `keep` with `at === 0` arrives. The presenting store answers `keep-asked` with `sendKeep`, which sends nothing while the link's list is undefined. The effect in `start` sends the list once it is known and at each change, deduplicated by its JSON. The first send at `start` comes before the window has loaded and is lost; the page's own ask covers that. The audience page drops a read answered after a later read was asked (`reads` counter).
- A print page whose pane closed: the answering channel belongs to the page that pressed Export, so a closed component still answers. A closed window or tab closes the channel and frees the lock. The print page then hears no answer, and after 5 s sets `data-failed` and says "The deck could not be read: no Present pane said within 5 s which projects its filter keeps, so the deck is not printed". A print address opened by hand fails the same way.
- Two exports of one deck: the second press, from any pane of any window of the origin, finds the lock held (`ifAvailable: true` grants null) and says "An export of this deck is already in progress." The lock frees when the print page has been answered, or after 10 s.

## Visible changes, before and after

- C1. Before: the Present pane's bar is the toolbar only. After: for the hub's portfolio deck a second line under the toolbar holds group buttons Stage, Status (only when a member project carries a status chip), Tier, Pillar and Form, each with values and counts as on a board, and no search box and no Mine only. To look: open the portfolio deck; in the scratch hub copy give one member project `chips: [parked]` and see Status with `parked 1`, then put the manifest back.
- C2. Before: no pick. After: pick Stage `submitted`. The Overview's group tiles and each group's count are the submitted members only; the summary and grid slides list only them; a slide with `{{group.count}}` reads the kept slides' number; the toolbar reads "Filtered: n of m decks". `git status` in the scratch hub copy shows no change.
- C3. After: Clear, beside the "Filtered" line, makes the deck whole again; the line and Clear go; the pane's saved state holds `filters: {}`.
- C4. After: a saved pick of a stage no member holds shows that value at 0. Every group of project decks is empty, its summary and grid have no row, the line reads "Filtered: 0 of m decks", and the deck's own slides draw.
- C5. Before and after: a deck opened from Files with no project deck in its groups, or with no group, has no filter line and no "Filtered" line.
- C6. After: reload the page. The picks are as left. Before the first snapshot the pane shows "Reading the deck ..." and sends no deck request; a saved `filters: "nope"` reads as no filter.
- C7. After, with a filter in force: drag a kept tile beside another kept tile. The group's `slides:` in `present.yml` gains the tile beside its target, and the hidden members keep their order.
- C7b. After: Move Later on a kept tile swaps it with the next kept tile; the hidden members between keep their places in `slides:`.
- C8. Before: the audience window draws the whole deck. After: with a filter in force, the presenter screen and the audience window draw the filtered deck. A pick changed while presenting reaches the audience window. An audience window reloaded while another workbench page is shown draws the filtered deck. The address bar reads `/present/show?root=..&path=..` only.
- C9. Before: Export opens the print tab of the whole deck. After: in a browser tab, Export with a filter in force prints the filtered slides from `/present/print?root=..&path=..`. A second Export of the same deck within 10 s, or before the print tab has asked, says "An export of this deck is already in progress." A print address opened by hand says it could not be read after 5 s.
- C12. Before: two panes on one deck read one answer. After: two panes on one deck with different picks each draw their own. A slide measured too tall in one pane keeps its Too tall mark while the other pane's deck lacks that slide.
- C13. After: a pick that removes the slide on screen puts the pane on the filtered deck's first slide; a pick that keeps it leaves the pane on it.
- C14. After: with picks held, open another deck from the deck menu; it opens with no filter, and the pane's saved state holds `filters: {}`.

## Head comments, doc comments and docs

- `src/lib/data/sources/deck/groups.ts` head: rewritten (narrowing paragraph); `ofProjects`, `keptMembers`: new.
- `src/lib/data/sources/deck/read.ts` head: rewritten (filter paragraph); `groupsOfDeck` doc: rewritten.
- `src/lib/data/model/model-deck.ts` `DeckMember.projectId`, `kept`, `DeckGroup.members`, `count`: rewritten.
- `src/lib/server/content/deck/read.ts` head and `readDeck` doc: rewritten.
- `src/lib/server/content/deck/endpoint.ts` head: rewritten.
- `src/routes/api/(docs)/deck/+server.ts` head: true as it stands.
- `src/lib/state/boards/collection/bar.ts` head: rewritten (paragraph on `ProjectLayout`); `projectRules`, `categoryGroup`, `projectGroups` docs: rewritten.
- `src/lib/state/boards/structure/map-bar.ts` head and `STAGE_FACET` doc: rewritten.
- `src/lib/state/life/present.ts` head and the `messageShape`, `exportName` docs: rewritten.
- `src/lib/state/life/present.svelte.ts` head: rewritten.
- `src/lib/state/life/arrange.ts` head, `decksOf`, `deckStepped`: rewritten.
- `src/lib/views/academic/present/Present.svelte` head: rewritten.
- `src/lib/views/academic/present/Bar.svelte` head: rewritten.
- `acts/export.ts` head: rewritten.
- `acts/live.svelte.ts` head: rewritten.
- `acts/acts.svelte.ts` head: true as it stands.
- `acts/filter.svelte.ts`, `acts/presentation.svelte.ts`: new.
- `arrange/Overview.svelte` head: rewritten.
- `arrange/Group.svelte` head: rewritten.
- `arrange/arrange.svelte.ts` head: true as it stands.
- `presenter/Presenter.svelte` head: true as it stands.
- `views/shared/forms/bar/FilterBar.svelte` head: rewritten.
- `routes/present/print/+page.svelte` head: rewritten.
- `routes/present/show/+page.svelte` head: rewritten.
- `docs/HELP.md` Present paragraph: rewritten; its Overview move bullet: rewritten.
- `docs/templates.md` `present.yml` section: rewritten.

## What in the brief was wrong or impossible

- The pane's saved deck by GET with `keep` (item 2, decision 2) breaks inside the brief's own bound. `node -p "require('http').maxHeaderSize"` prints `16384`. A GET query of 1024 keys of 16 characters is 25627 bytes (`URLSearchParams({root:'hub',path:'deck',keep:JSON.stringify(keys)}).toString().length`); 500 keys are 12527 bytes and 650 keys 16277 bytes (the same command with 500 and 650). So the request line passes Node's header limit a little above 650 such keys, well under 1024. The pane, the drafted read and the routes' `readDeck` therefore send a kept list by POST with no drafts (`askDeck` in `present.svelte.ts`), which the brief's POST already defines as the same read. GET keeps its `keep` parameter, refused and accepted as item 1 says (C10). A 431 over HTTP was not run; the limit and the lengths are measured as quoted.
- A filter that keeps more than 1024 projects of the hub makes the route answer 400, and the pane says "The deck could not be read: invalid". This is the brief's bound (decision 2). How many projects the hub holds was not verified, since the builder reads nothing of the hub.
- C1's facts about the hub's member projects (no status chip; the stage counts) were not verified for the same reason.
- The brief names `projectGroups` of `collection/bar.ts` as an example of what to export rather than copy. `projectGroups` takes a `left` function built from the collection's own entries, so the reusable exports are `projectFilter` (the groups over any board items) and `projectKeeps` (the keep rule), both over a `ProjectLayout`, with `projectGroups` kept private and the collection running through the same layout code (`collection-same.ts` prints `SAME`).

## Repair round 1

The five items of `agents/briefs/O147-round-1.md` are all done. The last `npm run test:quick` run did not print `every command passed`. Its two red tests are timeouts in two test files this round does not touch, and both files pass when run alone; item 1 quotes all of this. The browser look for C9 (a real print tab opening in a browser) still needs a browser, so it was not taken; item 2 shows the order of the calls with a case-run program.

Files this round changed:

| File | Before the round | After |
| --- | --- | --- |
| `src/lib/views/academic/present/acts/export.ts` | 172 | 200 |
| `src/lib/views/academic/present/acts/filter.svelte.ts` | 146 | 172 |
| `src/lib/state/life/present.svelte.ts` | 713 | 742 |
| `src/lib/views/academic/present/Present.svelte` (named by the round brief) | 517 | 518 |
| `src/lib/views/academic/present/arrange/Group.svelte` | 246 | 246 |
| `src/lib/views/shared/forms/bar/FilterBar.svelte` | 221 | 221 |
| `docs/HELP.md` | 632 | 632 |
| `docs/diagrams/*` | regenerated by `npm run diagrams` | regenerated |

The query client module (`src/lib/state/client/queries/queries.svelte.ts`) is unchanged. It already has `forget(key)`, which removes every query under a key (`client.removeQueries`) along with its scheduled fetch and its marks, so no new function was added.

### 1. The verify list, run on the final tree

`npm run diagrams && npm run docs:palette` exited 0, and then `npm run test:quick` ran. The list ran twice in this round. The first run came before the last edit, the rename of a type in `export.ts` described in item 2, and printed `test:quick: 184.6 s; every command passed`. That run is not quoted as the step's. The run after the last change printed these lines:

```
test:quick: 36 changed file(s), from git since HEAD
test:quick: 131 test file(s)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.6 s)
ok      eslint (18.6 s)
ok      svelte-check (18.7 s): 1793917270545 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (190.4 s): Duration  168.44s (transform 73.87s, setup 0ms, import 250.73s, tests 405.94s, environment 9.02s)
ok      vitest checks (202.5 s): Duration  179.84s (transform 95.67s, setup 0ms, import 193.04s, tests 458.48s, environment 5ms)
FAILED  vitest slow (249.8 s)
 FAIL  |unit| tests/data/hubs/hub-portfolio.test.ts > the portfolio of several hubs > reads a field of a second-hub entry that names a record as the key its file holds (G32)
Error: Test timed out in 20000ms.
 FAIL  |unit| tests/server/machine/apps/tools/languages.test.ts > several servers of one language > join their answers the way VS Code joins them: the first declaring server defines, hovers join, a slow one is cancelled after 2 s
Error: Test timed out in 40000ms.
 Test Files  2 failed | 19 passed (21)
      Tests  2 failed | 198 passed | 186 skipped (386)
test:quick: 252.6 s; failed: vitest slow
```

Both red tests timed out, in files this round does not change. `uptime` printed a load average of 11.75 13.38 10.29 just after the run. The same two files run alone right after, `npx vitest run tests/data/hubs/hub-portfolio.test.ts tests/server/machine/apps/tools/languages.test.ts --tagsFilter slow`, printed `Test Files  2 passed (2)` and `Tests  31 passed (31)`.

The other verify checks, run after the last change:

- **Named tests.** `npx vitest run tests/data/sources/present.test.ts tests/server/desktop/window-guard.test.ts` printed `Test Files  2 passed (2)` and `Tests  32 passed (32)`. `git diff --stat HEAD -- tests/server/desktop/window-guard.test.ts` prints nothing. `git diff --stat HEAD -- tests/data/sources/present.test.ts` prints `1 file changed, 192 insertions(+)`, so the round edited no test.
- **ASCII gate.** The rules file's gate over `src`, `tests` and `config` printed nothing (exit 0); `find` reports that there is no `bin` folder. `LC_ALL=C grep -n '[^ -~]'` over the seven files the round touched printed nothing (exit 1).
- **Line counts and folder sizes.** The counts are in the table above: every module is at or under 880 lines and every component at or under 520. `ls src/lib/views/academic/present/acts | wc -l` prints 7, and the round added no file.
- **Unused exports.** `sh utils/unused-exports.sh` against `.agents/worktrees/O147-base/unused-exports.txt`: no difference, `Unused exports (226)`.
- **Names.** Each name the round changed or added was grepped over `src`, `tests`, `config`, `docs` and `README.md`:
  - `askedBy` and `exportTab` have hits only in their own files.
  - `asking`, the new Present store member, has hits in `filter.svelte.ts` and `present.svelte.ts`. Its other hits are unrelated: the word in prose, the `asking` field of `ui/controls/editor/kit/lsp/transport/edits.ts`, and the `asking` question variable of `acts/acts.svelte.ts`, a different module that does not destructure the store's member.
  - `openTab` now returns `Window | null`. It is set in `Present.svelte:190`, passed through `acts.svelte.ts:33, :96` and called at `export.ts:160`; the `openTab` of `CommandRows.svelte` is an unrelated local function.
  - `PrintAnswer`, the name I first gave the new type in `export.ts`, is already exported by `state/shared/stores/desktop.ts` for the host's print answer, which `export.ts` itself receives from `bridge.printPdf`. So the type is named `KeepReply` instead (0 hits before it was added).
- **History-word grep.** The grep over the comment lines the step adds (round 1 included) gives five hits, each "before" describing an order at run time:

```
5:+// worked out yet, before the first snapshot, asks for nothing. Each pane says which deck and list
86:+// press, before the lock is asked for, so a press while the lock is held opens a tab and closes it
103:+ * The browser tab's export. The print tab opens inside the press, before anything is awaited, so no
108:+    // The channel listens before the page is opened, so the page's ask is never missed.
131:+     * drawn, the toggles and, where More holds groups of its own, More, each with a gap before the
```

### 2. The print tab opens inside the press

**What changed:**
- `acts/export.ts`:
  - `exportPdf` hands the browser path to a new private `exportTab`.
  - `exportTab` first starts `answerPrint`, so the channel that answers the print page's `keep-asked` is listening, then calls `deps.openTab(address)` and sets the returned window's `opener` to null. It awaits nothing before these calls.
  - Only after that does it take the export lock. When another export holds the lock, `exportTab` stops the answer (which closes its channel), closes the tab and says `present.export_running`. Otherwise it says `present.export_opened`.
  - `answerPrint` now returns `KeepReply` (`{ answered, stop }`).
  - `holdExport(ref, answer)` takes a function that it calls once the lock is granted.
- The desktop path keeps its order: the lock first, then the channel inside the grant, then `bridge.printPdf`.
- `ExportDeps.openTab` is now `(address: string) => Window | null`.
- `Present.svelte:190` opens the tab with `window.open(address, '_blank')`, with no `noopener`, so the handle comes back and `exportTab` cuts `opener`.
- The 10 s hold, the print page's 5 s wait and its failure line are unchanged.
- The `export.ts` head comment is rewritten to state the browser order. `HELP.md`'s export sentence gains "(in a browser, the tab it opened closes again)".

**Check:** `r1/export.case.svelte.ts`, whose source is quoted under item 4. It runs the tree's `exportPdf` and prints what happened before `exportPdf` returned to its caller, which is the synchronous part of the press with no await resolved yet. In the browser path the channel and `window.open` both come before the lock request:

```
browser tab, lock free, before the press handler returns:
  channel oculus-present-root=hub&path=deck listening
  tab opened at http://127.0.0.1:1/present/print?root=hub&path=deck
  lock oculus-present-export-root=hub&path=deck asked {"ifAvailable":true}
browser tab, lock free, after:
  lock granted
  said: The deck opened in a new tab; the browser's print dialog saves it as a PDF.
  tab opener is null
browser tab, lock held by another export, before the press handler returns:
  channel oculus-present-root=hub&path=deck listening
  tab opened at http://127.0.0.1:1/present/print?root=hub&path=deck
  lock oculus-present-export-root=hub&path=deck asked {"ifAvailable":true}
browser tab, lock held by another export, after:
  lock refused: held by another export
  channel closed
  tab closed
  said: An export of this deck is already in progress.
  tab opener is null
desktop app, lock free, before the press handler returns:
  lock oculus-present-export-root=hub&path=deck asked {"ifAvailable":true}
desktop app, lock free, after:
  lock granted
  channel oculus-present-root=hub&path=deck listening
  said: Making the PDF...
  host asked to print
  said: The PDF could not be made.
desktop app, lock held by another export, before the press handler returns:
  lock oculus-present-export-root=hub&path=deck asked {"ifAvailable":true}
desktop app, lock held by another export, after:
  lock refused: held by another export
  said: An export of this deck is already in progress.
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

The call chain from the press to `window.open` awaits nothing:
- `acts.svelte.ts` `exportDeck` calls `void exportPdf({...})` with no await before it.
- `exportPdf` runs `new URL(...)` and `await exportTab(...)`; the await comes after `exportTab` has made its synchronous calls.
- `exportTab` calls `answerPrint`, then `deps.openTab`, then `holdExport`, whose first await is the lock.

Two things are not verified, since no browser was started:
- whether a browser's popup rule treats this call as inside the press;
- whether `window.open(address, '_blank')` without `noopener` gives a handle in every browser the workbench runs in.

### 3. The head comments rewrapped whole

**What changed:**
- `arrange/Group.svelte`: the head paragraph at lines 2 to 8 is rewrapped at 100 columns, words unchanged.
- `views/shared/forms/bar/FilterBar.svelte`: the head paragraph at lines 2 to 16 is rewrapped the same way.
- The same rule was applied to every comment paragraph this round wrote or edited: the head paragraphs of `acts/export.ts`, `acts/filter.svelte.ts` and `state/life/present.svelte.ts`, and the doc comments of `answerPrint`, `holdExport`, `exportTab`, the filter's `keep`, its `asking` effects, the store's `asking`, `savedOf` and `savedFrame`. The `present.svelte.ts` head paragraph had two lines that a word from the next line fitted on, and it is rewrapped whole.

**Check:** `wrap.cjs`, whose source is quoted under item 4. It prints `wrapped` for each paragraph whose lines equal a greedy 100-column wrap of its own words. It was run over every paragraph named above after the last change (from `scratchpad/wrap.cjs`, which was then removed) and printed:

```
src/lib/state/life/present.svelte.ts:4-14 wrapped
src/lib/state/life/present.svelte.ts:189-192 wrapped
src/lib/state/life/present.svelte.ts:424-428 wrapped
src/lib/state/life/present.svelte.ts:545-547 wrapped
src/lib/views/academic/present/acts/export.ts:9-17 wrapped
src/lib/views/academic/present/acts/export.ts:106-107 wrapped
src/lib/views/academic/present/acts/export.ts:131-133 wrapped
src/lib/views/academic/present/acts/export.ts:153-156 wrapped
src/lib/views/academic/present/acts/filter.svelte.ts:8-13 wrapped
src/lib/views/academic/present/acts/filter.svelte.ts:97-98 wrapped
src/lib/views/academic/present/acts/filter.svelte.ts:108-110 wrapped
src/lib/views/academic/present/arrange/Group.svelte:2-8 wrapped
src/lib/views/shared/forms/bar/FilterBar.svelte:2-16 wrapped
```

### 4. The case-run programs, quoted

Every program of this step ran from `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o147/`. That folder, with the scratch roots `basetest/` and `r1/` (each holding only a link `node_modules -> /Users/axelfaes/workspace/oculus/node_modules`), was removed before this report was written:
- `rm -rf` of the folder ran, and `ls` of it then printed `No such file or directory`.
- `/Users/axelfaes/workspace/oculus/node_modules/vitest`, `svelte` and `@sveltejs/vite-plugin-svelte` are still there.
- `ls /private/tmp | grep -c 'o147-'` prints 0.

The three programs of the first run were run again on the final tree:
- `cases.ts`: output identical to the output quoted in "The cases after the change" (`cmp` with the saved after-run printed no difference).
- `client-cases.ts`: output identical to the output quoted there.
- `collection-same.ts`: identical on the base copy and the worktree (`cmp` prints SAME).

`runes.ts`, which the three plain-Node programs import first:

```ts
// The Svelte runes a .svelte.ts module of the tree calls while it loads, as plain values, so the
// case-run program can import the pure state modules under Node.
const runes = globalThis as Record<string, unknown>;
runes.$state = (value: unknown) => value;
runes.$derived = (value: unknown) => value;
```

`cases.ts`, run as `ROOT=<tree> node cases.ts`:

```ts
// Case-run program of O147: prints the result of cases C2, C4, C6, C10, C11 and C15 at the level
// of the reader, the route and the pane's state parser, for the tree named by ROOT. It writes only
// into a directory under the system temporary directory, which it removes at the end.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

await import("./runes.ts");
const ROOT = process.env.ROOT ?? '';
const src = (path: string) => join(ROOT, 'src', path);

const { engineDir, frameSetting, loadConfig, textCatalog } = await import(
    src('lib/data/sources/config.ts')
);
const { createReader } = await import(src('lib/data/sources/deck/read.ts'));
const { handleDeck, handleDeckDrafts } = await import(src('lib/server/content/deck/endpoint.ts'));
const { portfolioConfigFrom } = await import(src('lib/data/index.ts'));
const { mintToken } = await import(src('lib/server/core/auth.ts'));
const { parsePresentState } = await import(src('lib/state/life/present.ts'));

const dir = mkdtempSync(join(tmpdir(), 'o147-cases-'));
function plant(files: Record<string, string>): void {
    for (const [path, text] of Object.entries(files)) {
        mkdirSync(dirname(join(dir, path)), { recursive: true });
        writeFileSync(join(dir, path), text);
    }
}

plant({
    'projects/m/alpha/present/present.yml': 'deck: { title: Alpha }\norder: [main.md]\n',
    'projects/m/alpha/present/main.md':
        '---\nkind: project\ntitle: Alpha\nmechanism: M\nheadline: H\n---\n',
    'projects/m/beta/present/present.yml': 'deck: { title: Beta }\norder: [one.md]\n',
    'projects/m/beta/present/one.md': '# Beta one\n\n---\n\n# Beta two\n',
    'projects/m/gamma/present/present.yml': 'deck: { title: Gamma }\norder: [one.md]\n',
    'projects/m/gamma/present/one.md': '# Gamma\n',
    'talks/talk/present.yml': 'deck: { title: Talk }\norder: [one.md]\n',
    'talks/talk/one.md': '# Talk\n',
    'deck/present.yml': [
        'deck: { title: Portfolio }',
        'groups:',
        '    first:',
        '        find: { folders: [projects/*/*/present, talks/*] }',
        '        slides: [alpha, beta, talk]',
        '    second:',
        '        find: { folders: projects/*/*/present }',
        '        slides: [beta, gamma]',
        '    plain:',
        '        find: { folders: talks/* }',
        '        slides: [talk]',
        'order:',
        '    - title.md',
        '    - { slides: first }',
        '    - { kind: summary, of: first, title: Overview }',
        '    - { kind: grid, of: second, title: Grid }',
        '    - { slides: plain }'
    ].join('\n'),
    'deck/title.md': '---\nkind: title\nlegend: first\n---\n# Portfolio\n\n{{first.count}} slides.\n'
});

const config = loadConfig(engineDir()).config;
const project = (id: string, stage: string, domain: string) => ({
    id,
    file: `projects/m/${id}/project.yml`,
    folder: `projects/m/${id}`,
    tier: 'research',
    chips: [],
    short: id,
    title: id,
    stage,
    domain
});
function read(keep?: string[]) {
    const reader = createReader({
        hub: { key: 'hub', dir },
        projects: [
            project('alpha', 'submitted', 'heart'),
            project('beta', 'nascent', 'brain'),
            project('gamma', 'submitted', 'brain')
        ],
        domains: ['heart', 'brain'],
        tagTones: {},
        frame: frameSetting(config),
        catalog: textCatalog(config),
        ...(keep === undefined ? {} : { keep: new Set(keep) })
    });
    return reader.read({ key: 'hub', dir }, 'deck');
}
function show(label: string, deck: ReturnType<typeof read>): void {
    const title = deck.slides[0];
    console.log(`${label}:`);
    console.log('  slides', deck.slides.map((one: { key: string }) => one.key).join(' '));
    console.log('  title lede', title?.kind === 'title' ? title.lede : '', '| legend', JSON.stringify(title?.legend));
    for (const one of deck.slides) {
        if (one.kind === 'summary') console.log('  summary rows', one.rows.map((row: { project: string }) => row.project).join(','));
        if (one.kind === 'grid') console.log('  grid cards', one.cards.map((card: { name: string }) => card.name).join(','));
    }
    for (const group of deck.groups) {
        console.log(
            `  group ${group.name} count ${group.count} members`,
            JSON.stringify(group.members.map((m: Record<string, unknown>) => [m.name, m.projectId, m.kept])),
            'candidates',
            JSON.stringify(group.candidates.map((m: Record<string, unknown>) => [m.name, m.projectId, m.kept]))
        );
    }
}
show('C2/C11/C15 reader, no keep', read());
show('C2/C11/C15 reader, keep [alpha, gamma]', read(['alpha', 'gamma']));
show('C4 reader, keep []', read([]));

const source = {
    roots: [{ key: 'hub', dir }],
    primary: { key: 'hub', dir },
    config: portfolioConfigFrom(config),
    projects: []
};
const token = mintToken();
const ask = async (query: string) => {
    const answer = handleDeck(
        new Request(`http://127.0.0.1:1/api/deck?root=hub&path=deck${query}`, {
            headers: { 'x-oculus-token': token }
        }),
        token,
        source
    );
    const body = await answer.json();
    return `${answer.status} ${'error' in body ? JSON.stringify(body) : `deck with ${body.slides.length} slides`}`;
};
const post = async (keep: unknown) => {
    const answer = await handleDeckDrafts(
        new Request('http://127.0.0.1:1/api/deck', {
            method: 'POST',
            headers: { 'x-oculus-token': token, 'content-type': 'application/json' },
            body: JSON.stringify({ root: 'hub', path: 'deck', drafts: [], keep })
        }),
        token,
        source
    );
    const body = await answer.json();
    return `${answer.status} ${'error' in body ? JSON.stringify(body) : `deck with ${body.slides.length} slides`}`;
};
const many = JSON.stringify(Array.from({ length: 1025 }, (_, at) => `k${at}`));
console.log('C10 GET no keep:', await ask(''));
console.log('C10 GET keep=nope:', await ask('&keep=nope'));
console.log('C10 GET keep=[1]:', await ask(`&keep=${encodeURIComponent('[1]')}`));
console.log('C10 GET keep=[""]:', await ask(`&keep=${encodeURIComponent('[""]')}`));
console.log('C10 GET keep of 1025 keys:', await ask(`&keep=${encodeURIComponent(many)}`));
console.log('C10 GET keep of 1024 keys:', await ask(`&keep=${encodeURIComponent(JSON.stringify(JSON.parse(many).slice(0, 1024)))}`));
console.log('C10 GET keep=[] (nothing kept):', await ask(`&keep=${encodeURIComponent('[]')}`));
console.log('C10 POST keep "nope":', await post('nope'));
console.log('C10 POST keep [1]:', await post([1]));
console.log('C10 POST keep 1025 keys:', await post(JSON.parse(many)));
console.log('C10 POST no keep:', await post(undefined));

console.log('C6 parsePresentState({ filters: { stage: ["submitted"] } }):', JSON.stringify(parsePresentState({ filters: { stage: ['submitted'] } })));
console.log('C6 parsePresentState({ filters: "nope" }):', JSON.stringify(parsePresentState({ filters: 'nope' })));
console.log('C6 parsePresentState({ filters: { stage: [1] } }):', JSON.stringify(parsePresentState({ filters: { stage: [1] } })));
console.log('C6 parsePresentState({ filters: { colour: ["red"], tier: ["research"] } }):', JSON.stringify(parsePresentState({ filters: { colour: ['red'], tier: ['research'] } })));

rmSync(dir, { recursive: true, force: true });
```

`client-cases.ts`, run as `ROOT=<tree> node client-cases.ts`:

```ts
// Case-run program of O147 for the pane's rules over a read deck: the bar's groups (C1), the kept
// list (C2, C4, the hub match), the n of m line (C2, C4, C15) and the moves under a filter (C7,
// C7b). It reads the tree named by ROOT and writes only into a directory under the system
// temporary directory, which it removes at the end.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

await import('./runes.ts');
const ROOT = process.env.ROOT ?? '';
const at = (path: string) => join(ROOT, path);

const { engineDir, frameSetting, loadConfig, textCatalog } = await import(
    at('src/lib/data/sources/config.ts')
);
const { createReader } = await import(at('src/lib/data/sources/deck/read.ts'));
const { setCatalog } = await import(at('src/lib/state/shared/words/text.ts'));
const { boardItems, mapPreset } = await import(at('src/lib/state/boards/board/index.ts'));
const { project, snapshotOf, CONFIG } = await import(
    at('tests/state/boards/board/board-fixture.ts')
);
const present = await import(at('src/lib/state/life/present.ts'));
const arrange = await import(at('src/lib/state/life/arrange.ts'));

setCatalog(textCatalog(CONFIG));
const { setVocab } = await import(at('src/lib/state/shared/words/tones.ts'));
const { hubVocabs } = await import(at('src/lib/data/index.ts'));
setVocab(hubVocabs({ primary: null, folders: [], own: CONFIG }, null, []));

const dir = mkdtempSync(join(tmpdir(), 'o147-client-'));
function plant(files: Record<string, string>): void {
    for (const [path, text] of Object.entries(files)) {
        mkdirSync(dirname(join(dir, path)), { recursive: true });
        writeFileSync(join(dir, path), text);
    }
}
plant({
    'projects/m/alpha/present/present.yml': 'deck: { title: Alpha }\norder: [one.md]\n',
    'projects/m/alpha/present/one.md': '# Alpha\n',
    'projects/m/beta/present/present.yml': 'deck: { title: Beta }\norder: [one.md]\n',
    'projects/m/beta/present/one.md': '# Beta\n',
    'projects/m/gamma/present/present.yml': 'deck: { title: Gamma }\norder: [one.md]\n',
    'projects/m/gamma/present/one.md': '# Gamma\n',
    'projects/m/delta/present/present.yml': 'deck: { title: Delta }\norder: [one.md]\n',
    'projects/m/delta/present/one.md': '# Delta\n',
    'talks/talk/present.yml': 'deck: { title: Talk }\norder: [one.md]\n',
    'talks/talk/one.md': '# Talk\n',
    'deck/present.yml': [
        'deck: { title: Portfolio }',
        'groups:',
        '    first:',
        '        find: { folders: [projects/*/*/present, talks/*] }',
        '        slides: [alpha, beta, talk, gamma, delta]',
        '    second:',
        '        find: { folders: projects/*/*/present }',
        '        slides: [beta, gamma]',
        'order: [title.md, { slides: first }, { slides: second }]'
    ].join('\n'),
    'deck/title.md': '# Portfolio\n'
});

const config = loadConfig(engineDir()).config;
const deckProject = (id: string) => ({
    id,
    file: `projects/m/${id}/project.yml`,
    folder: `projects/m/${id}`,
    tier: 'research',
    chips: [],
    short: id,
    title: id
});
function read(keep: string[] | null) {
    return createReader({
        hub: { key: 'hub', dir },
        projects: ['alpha', 'beta', 'gamma', 'delta'].map(deckProject),
        domains: [],
        tagTones: {},
        frame: frameSetting(config),
        catalog: textCatalog(config),
        ...(keep === null ? {} : { keep: new Set(keep) })
    }).read({ key: 'hub', dir }, 'deck');
}

// The board items: the four projects of the hub `hub`, and a project of the hub `other` whose key
// is alpha too, which no member may match.
const preset = mapPreset(CONFIG);
const items = boardItems(
    snapshotOf([
        project('alpha', { root: 'hub', tier: 'research', stage: 'submitted', form: 'journal' }),
        project('beta', { root: 'hub', tier: 'research', stage: 'nascent' }),
        project('gamma', { root: 'hub', tier: 'software', stage: 'submitted', chips: ['parked'] }),
        project('delta', { root: 'hub', tier: 'research', stage: 'accepted' }),
        { ...project('other:alpha', { root: 'other', tier: 'research', stage: 'submitted' }) }
    ]),
    preset
);
console.log('board items', items.map((one: { id: string }) => one.id).join(' '));

const whole = read(null);
const groupsLine = (filters: Record<string, string[]>) =>
    present
        .filterGroupsOf(whole, items, filters, preset)
        .map(
            (group: { id: string; items: { id: string; count: number; active: boolean }[] }) =>
                `${group.id}[${group.items.map((one) => `${one.id}:${one.count}${one.active ? '*' : ''}`).join(' ')}]`
        )
        .join(' ');
console.log('C1 groups, no pick:', groupsLine({}));
console.log('C2 groups, Stage submitted:', groupsLine({ stage: ['submitted'] }));
console.log('C4 groups, Stage exploring (no member):', groupsLine({ stage: ['exploring'] }));

const hub = present.deckHub({ root: 'hub', path: 'deck' }, [{ key: 'hub', hub: true }], 'hub');
for (const [label, filters] of [
    ['no pick', {}],
    ['Stage submitted', { stage: ['submitted'] }],
    ['Stage submitted, Tier research', { stage: ['submitted'], tier: ['research'] }],
    ['Status parked', { status: ['parked'] }],
    ['Stage exploring', { stage: ['exploring'] }]
] as [string, Record<string, string[]>][]) {
    const keep = present.keptKeys(items, hub, filters, preset);
    const deck = read(keep);
    const tally = present.deckTally(deck);
    console.log(
        `kept list for ${label}:`,
        JSON.stringify(keep),
        `| tally ${tally.kept} of ${tally.total}`,
        '| first',
        deck.groups[0].members.filter((one: { kept: boolean }) => one.kept).map((one: { name: string }) => one.name).join(','),
        '| second',
        deck.groups[1].members.filter((one: { kept: boolean }) => one.kept).map((one: { name: string }) => one.name).join(',')
    );
}

// C7b: Move Earlier and Move Later of a kept tile under Stage submitted (alpha and gamma kept in
// first, whose slides: are alpha, beta, talk, gamma, delta).
const filtered = read(present.keptKeys(items, hub, { stage: ['submitted'] }, preset));
const first = filtered.groups[0];
console.log('C7b slides:', JSON.stringify(first.slides));
console.log('C7b alpha later:', JSON.stringify(arrange.deckStepped(first, 'alpha', 1)));
console.log('C7b gamma earlier:', JSON.stringify(arrange.deckStepped(first, 'gamma', -1)));
console.log('C7b gamma later (last kept):', JSON.stringify(arrange.deckStepped(first, 'gamma', 1)));
console.log('C7b alpha earlier (first kept):', JSON.stringify(arrange.deckStepped(first, 'alpha', -1)));
const unfiltered = read(null).groups[0];
console.log('no filter, alpha later:', JSON.stringify(arrange.deckStepped(unfiltered, 'alpha', 1)));
console.log('no filter, delta earlier:', JSON.stringify(arrange.deckStepped(unfiltered, 'delta', -1)));
// C7: a kept tile dropped after another kept tile, in its own group.
console.log('C7 alpha dropped after gamma:', JSON.stringify(arrange.deckDropped(first, first, 'alpha', 'gamma', 'after')));
console.log('C7 gamma dropped before alpha:', JSON.stringify(arrange.deckDropped(first, first, 'gamma', 'alpha', 'before')));
const runs = arrange.overviewRuns(filtered).filter((one: { kind: string }) => one.kind === 'group');
console.log('Overview tiles under Stage submitted:', runs.map((one: { group: { name: string }; decks: { name: string }[] }) => `${one.group.name}[${one.decks.map((deck) => deck.name).join(',')}]`).join(' '));

rmSync(dir, { recursive: true, force: true });
```

`collection-same.ts`, run as `ROOT=<tree> node collection-same.ts` on the base copy and on the worktree, with the two outputs compared by `cmp`:

```ts
// Prints the collection bar (state/boards/collection/bar.ts `collectionBar`) of the tree named by
// ROOT for fixed inputs, so the outputs of two trees can be compared line for line. It reads and
// writes no file.

await import('./runes.ts');
const ROOT = process.env.ROOT ?? '';
const at = (path: string) => `${ROOT}/${path}`;
const { setCatalog } = await import(at('src/lib/state/shared/words/text.ts'));
const { setVocab } = await import(at('src/lib/state/shared/words/tones.ts'));
const { hubVocabs } = await import(at('src/lib/data/index.ts'));
const { textCatalog } = await import(at('src/lib/data/sources/config.ts'));
const { boardItems, mapPreset } = await import(at('src/lib/state/boards/board/index.ts'));
const { collectionBar } = await import(at('src/lib/state/boards/collection/bar.ts'));
const { project, snapshotOf, CONFIG, SELF } = await import(
    at('tests/state/boards/board/board-fixture.ts')
);

setCatalog(textCatalog(CONFIG));
setVocab(hubVocabs({ primary: null, folders: [], own: CONFIG }, null, []));

const preset = mapPreset(CONFIG);
const items = boardItems(
    snapshotOf([
        project('p1', { tier: 'research', stage: 'submitted', form: 'journal', lead: [SELF] }),
        project('p2', { tier: 'research', stage: 'nascent', chips: ['parked'] }),
        project('p3', { tier: 'software', stage: 'accepted', form: 'conference' })
    ]),
    preset
);
const byId = new Map(items.map((one: { id: string }) => [one.id, one]));
const entries = ['e1', 'e2', 'e3'].map((id, index) => ({
    id,
    title: id,
    fields: { status: index === 0 ? 'open' : 'closed' },
    file: '/x/collection.yml',
    index
}));
const strip: Record<string, string[]> = { e1: ['p1', 'p2'], e2: ['p3'], e3: [] };
for (const [label, filters, self] of [
    ['no pick, nobody', {}, new Set<string>()],
    ['no pick, self', {}, new Set([SELF])],
    ['stage submitted', { project_stage: ['submitted'] }, new Set([SELF])],
    ['tier software', { project_tier: ['software'] }, new Set<string>()],
    ['category and form', { project_category: ['in-review'], project_form: ['journal'] }, new Set([SELF])],
    ['a gone stage', { project_stage: ['exploring'] }, new Set<string>()]
] as [string, Record<string, string[]>, Set<string>][]) {
    const bar = collectionBar({
        entries,
        schemas: [undefined],
        filters,
        search: '',
        mine: false,
        config: CONFIG,
        self,
        hubs: [],
        noFunding: 0,
        strips: {
            of: (entry: { id: string }) => strip[entry.id].map((id) => byId.get(id)),
            unfunded: [],
            preset
        }
    });
    console.log(label, JSON.stringify({
        groups: bar.groups.map((group: { id: string; items: { id: string; count: number; active: boolean }[] }) => [group.id, group.items.map((one) => [one.id, one.count, one.active])]),
        line: bar.line,
        section: bar.section,
        keeps: entries.map((entry) => bar.keeps(entry)),
        strip: entries.map((entry) => strip[entry.id].filter((id) => bar.strip(byId.get(id))))
    }));
}
```

Its output, identical on both trees:

```
no pick, nobody {"groups":[["project_category",[["in-review",1,false],["idea",1,false],["publications",1,false]]],["project_stage",[["nascent",1,false],["submitted",1,false],["accepted",1,false]]],["project_form",[["journal",1,false],["conference",1,false]]],["project_tier",[["research",2,false],["software",1,false]]]],"line":[],"section":{"heading":"Projects","ids":["project_category","project_stage","project_form","project_tier"]},"keeps":[true,true,true],"strip":[["p1","p2"],["p3"],[]]}
no pick, self {"groups":[["project_category",[["in-review",1,false],["idea",1,false],["publications",1,false]]],["project_stage",[["nascent",1,false],["submitted",1,false],["accepted",1,false]]],["project_form",[["journal",1,false],["conference",1,false]]],["project_tier",[["research",2,false],["software",1,false]]],["project_role",[["lead",1,false],["supervisor",0,false],["collaborator",0,false],["other",0,false]]]],"line":[],"section":{"heading":"Projects","ids":["project_category","project_stage","project_form","project_tier","project_role"]},"keeps":[true,true,true],"strip":[["p1","p2"],["p3"],[]]}
stage submitted {"groups":[["project_category",[["in-review",1,false],["idea",0,false],["publications",0,false]]],["project_stage",[["nascent",1,false],["submitted",1,true],["accepted",1,false]]],["project_form",[["journal",1,false],["conference",0,false]]],["project_tier",[["research",1,false],["software",0,false]]],["project_role",[["lead",1,false],["supervisor",0,false],["collaborator",0,false],["other",0,false]]]],"line":[],"section":{"heading":"Projects","ids":["project_category","project_stage","project_form","project_tier","project_role"]},"keeps":[true,false,false],"strip":[["p1"],[],[]]}
tier software {"groups":[["project_category",[["in-review",0,false],["idea",0,false],["publications",1,false]]],["project_stage",[["nascent",0,false],["submitted",0,false],["accepted",1,false]]],["project_form",[["journal",0,false],["conference",1,false]]],["project_tier",[["research",2,false],["software",1,true]]]],"line":[],"section":{"heading":"Projects","ids":["project_category","project_stage","project_form","project_tier"]},"keeps":[false,true,false],"strip":[[],["p3"],[]]}
category and form {"groups":[["project_category",[["in-review",1,true],["idea",0,false],["publications",0,false]]],["project_stage",[["nascent",0,false],["submitted",1,false],["accepted",0,false]]],["project_form",[["journal",1,true],["conference",0,false]]],["project_tier",[["research",1,false],["software",0,false]]],["project_role",[["lead",1,false],["supervisor",0,false],["collaborator",0,false],["other",0,false]]]],"line":[],"section":{"heading":"Projects","ids":["project_category","project_stage","project_form","project_tier","project_role"]},"keeps":[true,false,false],"strip":[["p1"],[],[]]}
a gone stage {"groups":[["project_category",[["in-review",0,false],["idea",0,false],["publications",0,false]]],["project_stage",[["nascent",1,false],["submitted",1,false],["accepted",1,false],["exploring",0,true]]],["project_form",[["journal",0,false],["conference",0,false]]],["project_tier",[["research",0,false],["software",0,false]]]],"line":[],"section":{"heading":"Projects","ids":["project_category","project_stage","project_form","project_tier"]},"keeps":[false,false,false],"strip":[[],[],[]]}
```

`basetest/vitest.config.mjs`, the configuration of the G32 test's run on the unchanged tree (the scratch root's `src`, `config` and `tests/fixtures` were links to the base copy, and its `tests/data/sources/present.test.ts` was the worktree's):

```js
export default { test: { include: ['tests/**/*.test.ts'] } };
```

`wrap.cjs`, the item 3 check, run as `node wrap.cjs <file> <line>...` from the worktree root:

```js
// Prints the comment paragraph that holds a line of a file, wrapped greedily at 100 columns with
// its prefix kept, and says whether the file's lines are already so wrapped. It reads one file and
// writes nothing. Usage: node wrap.cjs <file> <line>...
const fs = require('fs');
const [file, ...at] = process.argv.slice(2);
const lines = fs.readFileSync(file, 'utf8').split('\n');
const prefixOf = (line) => (line.match(/^(\s*(?:\/\/|\*|<!--)?\s?)/) ?? [''])[0];
const bodyOf = (line, prefix) => line.slice(prefix.length).trim();
for (const one of at) {
    const n = Number(one) - 1;
    const prefix = prefixOf(lines[n]);
    const inPara = (i) =>
        i >= 0 && i < lines.length && prefixOf(lines[i]) === prefix && bodyOf(lines[i], prefix) !== '';
    let start = n;
    while (inPara(start - 1)) start -= 1;
    let end = n;
    while (inPara(end + 1)) end += 1;
    const words = lines.slice(start, end + 1).map((l) => bodyOf(l, prefix)).join(' ').split(/\s+/);
    const out = [];
    let cur = '';
    for (const w of words) {
        const next = cur === '' ? prefix + w : `${cur} ${w}`;
        if (next.length > 100 && cur !== '') {
            out.push(cur);
            cur = prefix + w;
        } else cur = next;
    }
    out.push(cur);
    const same = out.join('\n') === lines.slice(start, end + 1).join('\n');
    console.log(`${file}:${start + 1}-${end + 1} ${same ? 'wrapped' : 'NOT wrapped'}`);
    if (!same) console.log(out.join('\n'));
}
```

`r1/vitest.config.mjs`, the configuration both round-1 programs ran under. Each ran from `r1/` as `ROOT=/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O147 ./node_modules/.bin/vitest run --root "$PWD" --config "$PWD/vitest.config.mjs" --silent=false --disableConsoleIntercept <program>`:

```js
// The configuration the round's case-run programs run under: the tree named by ROOT, compiled by
// the Svelte plugin and resolved with the browser's conditions, in the client runtime the tree's
// *.client.test.ts files run in, so effects run and flushSync flushes.
import { svelte } from '@sveltejs/vite-plugin-svelte';

const ROOT = process.env.ROOT;

export default {
    plugins: [svelte()],
    resolve: {
        alias: { $lib: `${ROOT}/src/lib`, $tests: `${ROOT}/tests` },
        conditions: ['browser']
    },
    test: {
        include: ['*.case.svelte.ts'],
        environment: `${ROOT}/tests/ui/frame/client-runtime.ts`,
        server: { deps: { inline: [/svelte/] } }
    }
};
```

`r1/export.case.svelte.ts` (its output is quoted under item 2):

```ts
// Case-run program of O147 round 1, item 2: the tree's `exportPdf` (acts/export.ts) with the page's
// BroadcastChannel, Web Locks and window recorded in order. For each path it prints what happened
// before the call returned to the press (the synchronous part, before any await resolved) and what
// happened after. It reads and writes no file.

import { it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '$lib/data/sources/config';
import { setCatalog } from '$lib/state/shared/words/text';
import { exportPdf } from '$lib/views/academic/present/acts/export';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const events: string[] = [];
class Channel {
    onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
    constructor(name: string) {
        events.push(`channel ${name} listening`);
    }
    postMessage(): void {}
    close(): void {
        events.push('channel closed');
    }
}
globalThis.BroadcastChannel = Channel as never;
(globalThis as Record<string, unknown>).window = { location: { origin: 'http://127.0.0.1:1' } };

/** Whether the next lock request finds the deck's export held by another export. */
let busy = false;
Object.defineProperty(globalThis.navigator, 'locks', {
    configurable: true,
    value: {
        request: (name: string, options: unknown, held: (lock: unknown) => unknown) => {
            events.push(`lock ${name} asked ${JSON.stringify(options)}`);
            return Promise.resolve().then(() => {
                events.push(busy ? 'lock refused: held by another export' : 'lock granted');
                return held(busy ? null : { name });
            });
        }
    }
});

function deps(bridge: unknown) {
    return {
        ref: { root: 'hub', path: 'deck' },
        deck: { name: 'deck' } as never,
        keep: ['alpha'],
        frame: { width: 1280, height: 720 } as never,
        bridge: bridge as never,
        upload: (() => Promise.resolve({ ok: true })) as never,
        openTab: (address: string) => {
            events.push(`tab opened at ${address}`);
            const tab = {
                opener: 'the pane' as unknown,
                close: () => events.push('tab closed')
            };
            setTimeout(() => events.push(`tab opener is ${String(tab.opener)}`));
            return tab as never;
        },
        say: (line: string) => events.push(`said: ${line}`),
        ask: () => undefined
    };
}

async function run(label: string, bridge: unknown): Promise<void> {
    events.length = 0;
    const done = exportPdf(deps(bridge));
    console.log(`${label}, before the press handler returns:`);
    for (const one of events) console.log(`  ${one}`);
    const sync = events.length;
    await done;
    await new Promise((rest) => setTimeout(rest, 10));
    console.log(`${label}, after:`);
    for (const one of events.slice(sync)) console.log(`  ${one}`);
}

it('runs the cases', async () => {
    busy = false;
    await run('browser tab, lock free', undefined);
    busy = true;
    await run('browser tab, lock held by another export', undefined);
    const bridge = {
        printPdf: () => {
            events.push('host asked to print');
            return Promise.resolve({ ok: false, error: 'failed' });
        }
    };
    busy = false;
    await run('desktop app, lock free', bridge);
    busy = true;
    await run('desktop app, lock held by another export', bridge);
});
```

`r1/filter.case.svelte.ts` (its output is quoted under item 5):

```ts
// Case-run program of O147 round 1, item 5: one Present pane drawn from the tree's own filter
// (acts/filter.svelte.ts), drafted deck (acts/live.svelte.ts) and Present store
// (state/life/present.svelte.ts) over the tree's query client, with the deck route answered by
// the tree's deck reader. It prints whether the kept list stays the same array across a slide move
// and a snapshot push under a filter, how many drafted-deck POSTs each sends, and the kept lists
// the query client holds answers under after each of three picks and a Clear. It writes only into
// a directory under the system temporary directory, which it removes at the end.

import { flushSync } from 'svelte';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { it, vi } from 'vitest';
import { engineDir, frameSetting, loadConfig, textCatalog } from '$lib/data/sources/config';
import { createReader } from '$lib/data/sources/deck/read';
import { hubVocabs } from '$lib/data/index';
import { boardItems, mapPreset } from '$lib/state/boards/board/index';
import { createQueries } from '$lib/state/client/queries/queries.svelte';
import { createPresent } from '$lib/state/life/present.svelte';
import { parsePresentState } from '$lib/state/life/present';
import { setCatalog } from '$lib/state/shared/words/text';
import { setVocab } from '$lib/state/shared/words/tones';
import { project, snapshotOf, CONFIG } from '$tests/state/boards/board/board-fixture';

const fake = vi.hoisted(() => ({ value: null as unknown }));
vi.mock('$lib/state/client/use', () => ({ useState: () => fake.value }));
const { createFilter } = await import('$lib/views/academic/present/acts/filter.svelte');
const { createDrawn } = await import('$lib/views/academic/present/acts/live.svelte');

const dir = mkdtempSync(join(tmpdir(), 'o147-r1-'));
for (const [path, text] of Object.entries({
    'projects/m/alpha/present/present.yml': 'deck: { title: Alpha }\norder: [one.md]\n',
    'projects/m/alpha/present/one.md': '# Alpha\n',
    'projects/m/beta/present/present.yml': 'deck: { title: Beta }\norder: [one.md]\n',
    'projects/m/beta/present/one.md': '# Beta\n',
    'projects/m/gamma/present/present.yml': 'deck: { title: Gamma }\norder: [one.md]\n',
    'projects/m/gamma/present/one.md': '# Gamma\n',
    'projects/m/delta/present/present.yml': 'deck: { title: Delta }\norder: [one.md]\n',
    'projects/m/delta/present/one.md': '# Delta\n',
    'deck/present.yml': [
        'deck: { title: Portfolio }',
        'groups:',
        '    first:',
        '        find: { folders: projects/*/*/present }',
        '        slides: [alpha, beta, gamma, delta]',
        'order: [title.md, { slides: first }]'
    ].join('\n'),
    'deck/title.md': '# Portfolio\n'
})) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
}

const config = loadConfig(engineDir()).config;
setCatalog(textCatalog(config));
setVocab(hubVocabs({ primary: null, folders: [], own: CONFIG }, null, []));
const deckProject = (id: string) => ({
    id,
    file: `projects/m/${id}/project.yml`,
    folder: `projects/m/${id}`,
    tier: 'research',
    chips: [],
    short: id,
    title: id
});
function read(keep: string[] | null) {
    return createReader({
        hub: { key: 'hub', dir },
        projects: ['alpha', 'beta', 'gamma', 'delta'].map(deckProject),
        domains: [],
        tagTones: {},
        frame: frameSetting(config),
        catalog: textCatalog(config),
        ...(keep === null ? {} : { keep: new Set(keep) })
    }).read({ key: 'hub', dir }, 'deck');
}

/** Every request the pane makes of the deck route. */
const calls: { method: string; keep: string[] | null; drafts: number }[] = [];
globalThis.fetch = (async (_url: string, init?: RequestInit) => {
    const body = init?.method === 'POST' ? JSON.parse(String(init.body)) : {};
    const keep = (body.keep ?? null) as string[] | null;
    calls.push({ method: init?.method ?? 'GET', keep, drafts: (body.drafts ?? []).length });
    return new Response(JSON.stringify(read(keep)), {
        status: 200,
        headers: { 'content-type': 'application/json' }
    });
}) as typeof fetch;

const queries = createQueries();
const entities = { afterReceive: () => undefined, config: () => null, portfolio: () => null };
const present = createPresent(
    entities as never,
    queries,
    () => 'token',
    () => [{ key: 'hub', dir, hub: true }] as never,
    () => 'hub'
);

const preset = mapPreset(CONFIG);
const projects = [
    project('alpha', { root: 'hub', tier: 'research', stage: 'submitted' }),
    project('beta', { root: 'hub', tier: 'research', stage: 'nascent' }),
    project('gamma', { root: 'hub', tier: 'software', stage: 'submitted' }),
    project('delta', { root: 'hub', tier: 'research', stage: 'accepted' })
];
/** The snapshot's version; a push makes every board item anew. */
const pushes = $state({ n: 0 });
const saved = $state({ value: { slide: '', filters: {} } as unknown });
fake.value = {
    entities: { portfolio: () => ({}) },
    fs: { primary: () => 'hub', roots: () => [{ key: 'hub', hub: true }] },
    present,
    selectors: {
        board: () => {
            void pushes.n;
            return boardItems(snapshotOf(projects), preset);
        },
        configMap: () => CONFIG
    },
    ui: { instanceState: () => saved.value }
};

const REF = { root: 'hub', path: 'deck' };
const DRAFTS = [{ root: 'hub', path: 'deck/title.md', text: '# Portfolio, unsaved\n' }];
const rest = () => new Promise((done) => setTimeout(done, 150));
const held = () =>
    queries.entries(['deck']).map((one) => (one.key[3] === '' ? 'whole' : String(one.key[3])));
const drafted = () => calls.filter((one) => one.drafts > 0).length;

/** A second pane on the same deck, which holds Tier software throughout. */
const other = $state({ value: { slide: '', filters: { tier: ['software'] } } as unknown });

it('runs the cases', async () => {
    let filter: ReturnType<typeof createFilter> | undefined;
    const stop = $effect.root(() => {
        const state = $derived(parsePresentState(saved.value));
        filter = createFilter({
            ref: () => REF,
            instance: () => 'pane',
            filters: () => state.filters,
            slide: () => state.slide,
            write: (changes) => {
                saved.value = { ...state, ...changes };
            }
        });
        const pane = filter;
        const drawn = createDrawn({
            ref: () => REF,
            instance: () => 'pane',
            presented: () => false,
            drafts: () => DRAFTS,
            keep: pane.keep,
            files: () => pane.answer()?.deck ?? null
        });
        $effect(() => {
            pane.bar();
            drawn();
        });
    });
    const pane = filter!;
    let second: (() => void) | undefined;
    const settle = async (): Promise<void> => {
        flushSync();
        await rest();
        flushSync();
        await rest();
        flushSync();
    };
    const toggle = async (group: string, value: string): Promise<void> => {
        pane.bar()!.ontoggle(group, value);
        await settle();
    };
    await settle();
    console.log('no pick: keep', JSON.stringify(pane.keep()), '| held', JSON.stringify(held()));
    console.log('drafted-deck POSTs so far', drafted());

    const picked = drafted();
    await toggle('stage', 'submitted');
    console.log('pick 1, Stage submitted: keep', JSON.stringify(pane.keep()), '| held', JSON.stringify(held()));
    console.log('drafted-deck POSTs sent by pick 1', drafted() - picked);
    const before = pane.keep();
    const posts = drafted();
    saved.value = { ...parsePresentState(saved.value), slide: 'first/alpha/one.md#0' };
    await settle();
    console.log(
        'slide move under the filter: same array',
        pane.keep() === before,
        '| drafted-deck POSTs sent by it',
        drafted() - posts
    );
    const pushed = drafted();
    pushes.n += 1;
    await settle();
    console.log(
        'snapshot push under the filter: same array',
        pane.keep() === before,
        '| drafted-deck POSTs sent by it',
        drafted() - pushed
    );

    await toggle('tier', 'research');
    console.log('pick 2, Stage submitted and Tier research: keep', JSON.stringify(pane.keep()), '| held', JSON.stringify(held()));
    await toggle('stage', 'submitted');
    console.log('pick 3, Tier research: keep', JSON.stringify(pane.keep()), '| held', JSON.stringify(held()));
    pane.bar()!.onclear();
    await settle();
    console.log('Clear: keep', JSON.stringify(pane.keep()), '| held', JSON.stringify(held()));

    // A second pane holding Tier software, then the first pane picking and clearing again.
    second = $effect.root(() => {
        const state = $derived(parsePresentState(other.value));
        const b = createFilter({
            ref: () => REF,
            instance: () => 'second',
            filters: () => state.filters,
            slide: () => state.slide,
            write: () => undefined
        });
        $effect(() => {
            b.answer();
        });
    });
    await settle();
    console.log('second pane on Tier software: held', JSON.stringify(held()));
    await toggle('stage', 'submitted');
    console.log('first pane picks Stage submitted: held', JSON.stringify(held()));
    pane.bar()!.onclear();
    await settle();
    console.log('first pane clears: held', JSON.stringify(held()));
    second();
    flushSync();
    console.log('second pane gone: held', JSON.stringify(held()));
    stop();
    flushSync();
    console.log('first pane gone: held', JSON.stringify(held()));
    rmSync(dir, { recursive: true, force: true });
});
```

### 5. One kept list per filter, and no answer held for a filter no pane asks for

**What changed:**
- `acts/filter.svelte.ts`:
  - The `keep` derived keeps its last array in `kept` and returns that same array while the new list has the same JSON, so a recompute that gives the same keys leaves what reads `keep` alone.
  - `Reads` gains `instance`, and `Present.svelte` passes `instance: () => instance.id`.
  - A new effect tells the store the deck and list the pane reads under (`asking(pane, ref, keep)`, called inside `untrack`). A second effect's teardown tells the store that the pane reads nothing once it is gone.
  - The head paragraph is rewritten.
- `state/life/present.svelte.ts`:
  - `PresentStore` gains `asking(pane, ref, keep)`. It records the query key each pane reads under (`askedBy`). It drops every held deck answer whose kept part is not the whole deck's and that no pane reads under, using the query client's existing `forget`. When one was dropped it calls `prune(null)`, so the slide measures follow the answers that remain.
  - `savedFrame` falls back to the frame of any held answer of the same deck, since a filter does not change a deck's frame. An audience window opened for a pane whose own list is not held therefore still opens at the deck's frame.
  - The head paragraph and the `savedOf` doc comment are rewritten to say which answers are held.

**Check:** `r1/filter.case.svelte.ts`, whose source is quoted under item 4. It drives the tree's own `createFilter`, `createDrawn`, `createPresent` and `createQueries` in Svelte's client runtime, with the deck route answered by the tree's reader, and prints:

```
no pick: keep null | held ["whole"]
drafted-deck POSTs so far 1
pick 1, Stage submitted: keep ["alpha","gamma"] | held ["whole","[\"alpha\",\"gamma\"]"]
drafted-deck POSTs sent by pick 1 1
slide move under the filter: same array true | drafted-deck POSTs sent by it 0
snapshot push under the filter: same array true | drafted-deck POSTs sent by it 0
pick 2, Stage submitted and Tier research: keep ["alpha"] | held ["whole","[\"alpha\"]"]
pick 3, Tier research: keep ["alpha","beta","delta"] | held ["whole","[\"alpha\",\"beta\",\"delta\"]"]
Clear: keep null | held ["whole"]
second pane on Tier software: held ["whole","[\"gamma\"]"]
first pane picks Stage submitted: held ["whole","[\"gamma\"]","[\"alpha\",\"gamma\"]"]
first pane clears: held ["whole","[\"gamma\"]"]
second pane gone: held ["whole"]
first pane gone: held ["whole"]
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

What the output shows:
- The drafted deck is sent once at the start and once for a pick.
- Under a filter, a slide move and a snapshot push keep the same array and send no drafted-deck POST.
- After three different picks and a Clear, only the whole deck's answer is held.
- A second pane's list stays held while the second pane reads under it, and is dropped when that pane goes.
- The whole deck's answer stays.

Runs on the tree before this round's changes were not taken; for the before state, the refuter's reading of `filter.svelte.ts:91-94` and `present.svelte.ts:337-339` stands.

### Sharp edges

- **When a list is dropped.** A kept list is dropped as soon as its pane picks another list or the pane's component is destroyed.
  - Hidden tabs stay mounted (`state/client/queries/tab-scope.ts` scopes the reads of a hidden, mounted tab), so a tab switch does not drop a list.
  - A pane whose component is destroyed and drawn again reads its filtered deck again, and shows "Reading the deck" until that answer is in.
  - Going back to a list a pane had picked earlier also reads it again. While that read is out, the pane draws its last answer (`last` in `filter.svelte.ts`).
- **A blocked popup.** In a browser that blocks the popup, `window.open` gives null. Export then still takes the lock and says "The deck opened in a new tab", and the lock holds for up to 10 s. The order before this round had the same result; no item of the round covers it.
