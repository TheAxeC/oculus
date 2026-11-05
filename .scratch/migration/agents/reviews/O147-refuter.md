# Step O147 refuter report (on .agents/worktrees/migration-O147, base 9ad4eb6c6)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

There is no ADR folder in this repository (`ls docs/adr` printed `No such file or directory`), so no ADR governs the diff. The worktree's `git status --short` listed 35 paths before and after this review (32 modified, 3 untracked: the report copy, `acts/filter.svelte.ts`, `acts/presentation.svelte.ts`). The worktree's report copy and the main checkout's are identical (`cmp` printed SAME).

## Verification (rerun by the reviewer)

```
$ npm run test:quick -- --base 9ad4eb6c6        (worktree root, node v24.21.0)
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.5 s)
ok      eslint (13.9 s)
ok      svelte-check (18.3 s): 1793915045860 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (136.7 s): Duration  119.71s ...
ok      vitest checks (140.9 s): Duration  124.12s ...
ok      vitest slow (153.9 s): Duration  137.58s ...
test:quick: 156.6 s; every command passed

$ npm run diagrams && npm run docs:palette
  not run: both write files into the worktree. Their staleness checks were run in memory instead:
$ npx vitest run tests/checks/diagrams/diagrams.test.ts tests/checks/diagrams/palette.test.ts --testTimeout=120000
 Test Files  2 passed (2)
      Tests  48 passed (48)
  (run with the default 5 s timeout, the same three tests timed out at a load average near 9; they are timing, not content)

$ npx vitest run tests/data/sources/present.test.ts tests/server/desktop/window-guard.test.ts
 Test Files  2 passed (2)
      Tests  32 passed (32)
$ git diff --stat 9ad4eb6c6 -- tests/server/desktop/window-guard.test.ts
  (printed nothing)

$ git status --short | awk '{print $2}' | xargs env LC_ALL=C grep -n '[^ -~]'      -> nothing, exit 1
$ the rules file's perl ASCII gate over the same paths                             -> nothing, exit 0

$ wc -l (changed and added): Present.svelte 517, Bar.svelte 141, FilterBar.svelte 221, Group.svelte 246,
  Overview.svelte 259, print/+page.svelte 172, show/+page.svelte 309; modules: present.ts 771,
  present.svelte.ts 713, read.ts 709, bar.ts 599, arrange.ts 531, filter.svelte.ts 146,
  presentation.svelte.ts 72, export.ts 172 (every component <= 520, every module <= 880)
$ ls | wc -l: present/acts 7, present 10, state/life 10

$ sh utils/unused-exports.sh > <scratch>/ue-now.txt; diff .agents/worktrees/O147-base/unused-exports.txt <scratch>/ue-now.txt
  (no difference, exit 0)

$ history-word grep over the added comment lines and test titles (the report's form)
  8 hits, the same 8 lines the report quotes, each "before" as an order in a run or a list.

Commands the report quotes, rerun:
$ ROOT=<worktree> node cases.ts            -> identical to the builder's after-cases.txt (diff printed nothing);
  C10: keep=nope, [1], [""], 1025 keys -> 400 {"error":"invalid"} on GET and POST; 1024 keys and no keep -> 200;
  C6: filters "nope" and { stage: [1] } -> {}; { colour: [...], tier: [...] } -> { tier: [...] }
$ ROOT=<worktree> node client-cases.ts     -> identical to after-client.txt
$ collection-same.ts on the base copy and on the worktree, cmp -> SAME
$ basetest root (src, config, tests/fixtures linked to the base copy), the worktree's present.test.ts (cmp identical):
  x narrows every group of project decks to the kept projects, ... and marks each member
  AssertionError: no filter: expected [ [ ...(3) ], [ ...(2) ] ] to deeply equal [ [ ...(3) ], [ ...(2) ] ]
  Test Files  1 failed (1) / Tests  1 failed | 4 passed (5)
$ node -p "require('http').maxHeaderSize"   -> 16384
$ URLSearchParams length for 500 / 650 / 1024 keys of 16 chars -> 12527 / 16277 / 25627 (as the report says)
$ grep maxHeaderSize over src, vite.config.ts, package.json -> nothing, so the server keeps Node's 16384
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. The GET (`endpoint.ts:67-69`, `keepOf`) and POST (`postShape.keep`) take `keep` and answer 400 `{ error: 'invalid' }` for a bad one (cases.ts C10 rows); `keptMembers` (`groups.ts:202-205`) narrows only groups of project decks, a non-project member left out; `drawnOf` is used by `countOf`, `legendOf`, `summary` (rows and cards), the `{ slides: }` entry and `DeckGroup.count`; members carry `projectId` and `kept`, candidates `kept: true`; nested groups narrowed through the one reader context (test row "beta/gamma/one.md#0"); `DeckProject` and `kinds.ts` unchanged; the write route's two `readDeck` calls pass no `keep` (`deck.ts:212`, `deck-files.ts:143`).
- 2: holds. `filters` in `PresentState` with `.catch(() => ({}))` and `filtersOf`; `leftDeck` sets `filters: {}`; groups by `projectFilter` and `projectKeeps` exported from `collection/bar.ts`, layout Stage then status, tier, pillar, form; values from members matched by `deck.hub` and `bareId` (`present.ts` `filterGroupsOf`); `keepOf` is undefined while `portfolio()` is null, which is when `board()` is empty (`selectors.svelte.ts:364-367`); the query key `[KIND, root, path, keepKey(keep)]` serves the read, `prune` (`savedOf`) and `savedFrame`; the Overview reads `saved={filesDeck}`; C13 by the `moving` effect. See Behaviour 1 and 2 for costs that do not break the item's text.
- 3: holds. `FilterBar` props optional, search drawn only with `onsearch`, Mine only with `named && onmine`; the bar drawn only when `filterable(deck)`; "Filtered" line and Clear only while `filtering(filters)`; m and n by `deckTally`; strings in `present.yml`; the wiring in `acts/filter.svelte.ts` and `acts/presentation.svelte.ts`, `Present.svelte` at 517. See Standards 2 for the FilterBar head comment.
- 4: holds by reading. Tiles and counts from kept members (`arrange.ts` `decksOf`, `Group.svelte:135`); `deckStepped` swaps with the next kept member, hidden members in place (client-cases C7b rows); drops through the unchanged `deckDropped` on the file's list (C7 rows); `keep-asked`/`keep` in `messageShape`; `PresentLink.keep` read from saved state; the export's Web Lock `exportName`, 10 s hold, 5 s wait and `data-failed`. The open of the print tab after the lock is the risk in Proof 2.
- 5: holds; the Present paragraph of `docs/HELP.md`, `docs/templates.md`'s `present.yml` sentence and the head comments state the filter. Two rewrapped comments end a line short (Standards 1 and 2).
- 6: holds. One `it` of `tests/data/sources/present.test.ts` under G32 with three rows, its failing run on the unchanged tree reproduced above; no test for `parsePresentState` or the 400; `window-guard.test.ts` unchanged and passing.

Cases of the brief's "Cases":

- C1: met by reading and the client-cases run (groups Stage, Status, Tier, Form drawn from the members, Pillar absent with no pillar; no search box since `Bar.svelte` passes no `onsearch`; no "Filtered" line with no pick); the hub's own values and the scratch-hub `chips: [parked]` are the look's.
- C2: met: reader run "keep [alpha, gamma]" (slides, summary, grid, `{{first.count}}` 1, counts), client-cases "Overview tiles under Stage submitted" and "tally 2 of 5"; no write path exists from a pick (it calls `setInstanceState` only).
- C3: met by reading (`onclear: () => pick({})`, `filtering({})` false, `said` empty, `Bar.svelte:95` draws neither).
- C4: met: reader run "keep []" (counts 0, no rows, own slides drawn), client-cases "exploring:0*" and "tally 0 of 5".
- C5: met by reading (`filterable` false gives `bar()` null, `{#if filter !== null}` draws no FilterBar).
- C6: met: the `parsePresentState` rows above; `deck(ref, undefined)` returns PENDING and schedules nothing, `createDrawn` and the export skip on undefined.
- C7: met: client-cases C7 rows (the drop lands beside its target in `slides:`, hidden members in order).
- C7b: met: client-cases C7b rows.
- C8: met by reading (the audience page reads only after a `keep` with `at` 0, `sendKeep` on `keep-asked` from `audience`, the start effect resends on each change, `PresentLink.keep` reads the saved state while the pane is not drawn; the address unchanged and G47 passing); the windows themselves are the look's.
- C9: not verifiable here: whether `window.open` still opens the print tab after the Web Lock grant needs the look in a browser (Proof 2); the lock, the "already in progress" line, the 5 s wait and `print.ts:51`'s 60 s deadline read as the case expects.
- C10: met: the cases.ts C10 rows above.
- C11: met: reader rows (`talk` false in `first` under a filter, true in `plain` and with no filter).
- C12: met by reading (two kept lists are two keys; `savedOf` keeps a measure while any fresh answer of the deck under any key holds the slide).
- C13: met by reading (`filter.svelte.ts:108-123`).
- C14: met by reading (`leftDeck` sets `filters: {}`; `open()` writes `leftDeck`).
- C15: met: client-cases "tally ... of 5" with beta in both groups.

## 1. Spec

none

## 2. Proof

- `.scratch/migration/agents/reviews/O147-report.md`, "DONE / NOT DONE", Verify 1 row and the paragraph after the test:quick lines: "Two files were edited after the list ran: `src/lib/state/boards/structure/map-bar.ts` ... and `src/lib/state/life/present.svelte.ts` (`askDeck`, the saved deck read by POST under a kept list ...)"; what is wrong: the only verify-list run the report quotes is of a tree before the last change, and one of the two later edits changes how every filtered deck is read; the rules file ("Report": every count and run taken after the last change) asks for the list's lines from the final tree. The reviewer's run on the final tree printed `every command passed`, so no decision rests on the gap now; failure scenario: an orchestrator reading the report's Verify 1 row takes the quoted lines as the final tree's, though `askDeck` was never in a list run; verdict: none.
- `src/lib/views/academic/present/acts/export.ts:148-154`: "if (!(await holdExport(deps.ref, deps.keep, Date.now()))) { ... } if (deps.bridge === undefined) { deps.openTab(address);" with `openTab` being `window.open(address, '_blank', 'noopener')` (`Present.svelte:189`); what is wrong: the print tab now opens after an asynchronous Web Lock grant instead of inside the press. The report names this risk only in a judgment-call bullet ("Whether the browser still lets `window.open` run then ... is not verified"), and its first line's not-verified list names the PDF's pages, not this; the rules file ("The working rules", a risk you name) asks for it fixed or stated plainly and prominently. By reading, the grant is a few ms after the press, which Chrome's transient activation covers; a browser that ends activation at the first await would block the tab; failure scenario: a reader in such a browser presses Export, the pane says "The deck opened in a new tab", no tab opens, and the lock holds the deck's export for 10 s; verdict: C9 not verifiable (look owed).

## 3. Standards

- `src/lib/views/academic/present/arrange/Group.svelte:5`: "// with the names its `slides:` holds that match no deck and the decks" (74 columns, mid-sentence, next word "two" fits); what is wrong: the rules file ("What every package obeys", a comment edited by the step is rewrapped as a whole paragraph at 100 columns) is broken; failure scenario: a reader of the head comment meets a ragged break inside a sentence, and the next edit of the paragraph inherits it; verdict: item 5 holds, this is the standard alone.
- `src/lib/views/shared/forms/bar/FilterBar.svelte:11`: "// per group `line` names, in that order, each reading its picks" (68 columns, next word `("Form:` fits); what is wrong: the same rewrap rule; failure scenario: as above; verdict: none.
- `.scratch/migration/agents/reviews/O147-report.md`, "The cases' first run": "Scratch programs, all in `/private/tmp/.../scratchpad/o147/`: `cases.ts` ..., `client-cases.ts` ..., `collection-same.ts` ..."; what is wrong: the rules file ("What every package obeys", a case-run program "has its source and its output quoted in the report, so the reviewer can run it again") asks for the source in the report; the report gives paths in a session scratchpad only. They could be rerun here only because the reviewer's scratchpad is the same folder; failure scenario: a reviewer or landing session with another scratchpad cannot rerun C2, C4, C6, C7, C7b, C10, C11 or C15 and has only the report's word; verdict: none.

## 4. Behaviour

- `src/lib/views/academic/present/acts/filter.svelte.ts:91-94` with `acts/live.svelte.ts:46-61`: "const keep = $derived.by(() => { const ref = reads.ref(); return ref === null ? null : keepOf(ref, reads.filters()); });"; what is wrong: while a pick is held, `keptKeys` returns a new array on every recompute, and `keep` recomputes whenever the pane's saved state changes (`held` in `Present.svelte` is re-parsed on every slide move) or the snapshot is pushed. The drafted-deck effect reads `reads.keep()`, so each such change cancels and re-sends `POST /api/deck` with every draft; the presenting effect dedups by JSON, this one does not. The report does not state it; failure scenario: with a filter in force and a slide file open unsaved in a source tab, each arrow-key step through the deck sends one drafted-deck POST 50 ms later, and a step taken before the previous answer drops it; verdict: none.
- `src/lib/state/life/present.svelte.ts:337-339`: "return [KIND, ref.root, ref.path, keepKey(keep)];"; what is wrong: every distinct kept list a pane has asked under stays held for the page's life (the query client has `gcTime: Infinity` and nothing forgets these keys), each is marked on every deck push and scanned by `deckConcerned` and by `savedOf` in `prune`. The report says a filtered and a whole answer are held apart, not that they accumulate; failure scenario: a reader who tries thirty pick combinations on the portfolio deck holds thirty whole deck answers until a reload, and each files push walks all of them; verdict: none.

## Declined to judge

- The drawn bar (C1 on the hub, its fold into More), the windows of C8, the PDF pages and the tab open of C9, and the panes of C12 and C13 on screen: they need the look on landing, which a reviewer does not run.
- `npm run diagrams` and `npm run docs:palette` as commands: not run, since both write into the worktree; their in-memory staleness tests passed.
- The hub facts of the brief and C1 (no member project carries a status chip, the stage counts): not checked; the hub's files were not read.
- Whether a hub has more than 1024 projects that a filter keeps (the 400 the report names): not checked, for the same reason.
- Whether `svelte-kit sync` inside `test:quick` wrote under the ignored `.svelte-kit` folder: only `git status --short` was read (35 paths before and after); what git ignores would take `git check-ignore`.

Reviewer usage: a531dbf1711f69533, claude-opus-5-5, 297296 tokens, 94 tool uses, 19 min 37 s.

## Repair round 1, refuted

The round's delta: for each of the 34 paths of `migration-O147-round-1/files.txt`, `diff -q` against the worktree. Seven of them changed in the round: `docs/HELP.md`, `src/lib/state/life/present.svelte.ts`, `src/lib/views/academic/present/Present.svelte`, `acts/export.ts`, `acts/filter.svelte.ts`, `arrange/Group.svelte` and `views/shared/forms/bar/FilterBar.svelte`. The round changed no path outside `files.txt`. `git status --short` lists 36 paths before and after this review: 32 modified, plus 4 untracked (the two new `acts/` modules, and in `.scratch/` the report copy and `briefs/O147-round-1.md`, which `cmp` shows is the same as the main checkout's). The query client module is unchanged, and the round uses its existing `forget`. Every case-run program was recreated in the scratchpad's `O147-r1-review/` from the report's quoted source, and that folder was removed afterwards (`ls` of it printed `No such file or directory`).

```
$ npm run test:quick        (worktree root, node v24.21.0; uptime before: load 5.51 5.57 7.17)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (2.6 s)
ok      eslint (2.9 s)
ok      svelte-check (12.6 s): 1793918253589 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (131.1 s): Duration  116.42s (transform 56.28s, setup 0ms, import 181.16s, tests 269.17s, environment 8.83s)
ok      vitest checks (134.3 s): Duration  119.42s (transform 57.71s, setup 0ms, import 123.52s, tests 308.21s, environment 4ms)
ok      vitest slow (145.3 s): Duration  130.75s (transform 43.33s, setup 0ms, import 97.38s, tests 420.46s, environment 5ms)
test:quick: 148.1 s; every command passed
  (uptime after: load 13.68 9.56 8.58)

$ npm run diagrams && npm run docs:palette
  not run: both write into the worktree. Their staleness checks, in memory:
$ npx vitest run tests/checks/diagrams/ --testTimeout=120000 --reporter=dot
      Tests  48 passed (48)

$ npx vitest run tests/data/sources/present.test.ts tests/server/desktop/window-guard.test.ts --reporter=dot
 Test Files  2 passed (2)
      Tests  32 passed (32)
$ git diff --stat 9ad4eb6c6 -- tests/server/desktop/window-guard.test.ts
  (printed nothing)
$ git diff --stat 9ad4eb6c6 -- tests/data/sources/present.test.ts
 tests/data/sources/present.test.ts | 192 +++++++++++++++++++++++++++++++++++++
 1 file changed, 192 insertions(+)
$ cmp <round snapshot>/tests/data/sources/present.test.ts tests/data/sources/present.test.ts
  (no difference: the round changed no test)

$ the rules file's perl ASCII gate over src, tests, config (no bin folder: "ls: bin: No such file or directory")
  printed nothing, exit 0
$ git status --short | awk '{print $2}' | xargs env LC_ALL=C grep -n '[^ -~]'
  printed nothing, exit 1

$ wc -l (changed and added): Present.svelte 518, Overview.svelte 259, Group.svelte 246, FilterBar.svelte 221,
  print/+page.svelte 172, show/+page.svelte 309, Bar.svelte 141; present.ts 771, present.svelte.ts 742,
  read.ts 709, bar.ts 599, arrange.ts 531, model-deck.ts 289, map-bar.ts 252, groups.ts 219, export.ts 200,
  filter.svelte.ts 172, acts.svelte.ts 144, read.ts (server) 114, endpoint.ts 111, live.svelte.ts 74,
  presentation.svelte.ts 72 (every component <= 520, every module <= 880)
$ ls | wc -l: src/lib/views/academic/present 10, present/acts 7, src/lib/state/life 10

$ sh utils/unused-exports.sh > ue-now.txt; diff .agents/worktrees/O147-base/unused-exports.txt ue-now.txt
  diff exit 0; first line "Unused exports (226)"

$ grep of the round's names over src, tests, config (--exclude=local.yml), docs, README.md
  askedBy, exportTab, KeepReply: hits in their own files only (askedByte of transcript-routes.ts unrelated);
  holdExport, answerPrint: export.ts only; openTab: Present.svelte, acts.svelte.ts, export.ts, plus the unrelated
  CommandRows.svelte and reopenTab/openTabs; asking(: the store member at present.svelte.ts:460 and its calls
  at filter.svelte.ts:115, :119; the other hits are the question getters of other stores

$ history-word grep over the comment lines the round adds (from the round delta)
  4:+// worked out yet, before the first snapshot, asks for nothing. Each pane says which deck and list
  27:+// press, before the lock is asked for, so a press while the lock is held opens a tab and closes it
  37:+ * The browser tab's export. The print tab opens inside the press, before anything is awaited, so no
  42:+    // The channel listens before the page is opened, so the page's ask is never missed.
  each "before" is an order at run time

Commands the round's report quotes, rerun:
$ node wrap.cjs over the 13 paragraphs of item 3     -> each of the 13 lines "... wrapped", identical to the report
$ r1/export.case.svelte.ts (vitest, client runtime)  -> output identical to the report's item 2 block, line for line:
  browser tab, lock free, before the press handler returns:
    channel oculus-present-root=hub&path=deck listening
    tab opened at http://127.0.0.1:1/present/print?root=hub&path=deck
    lock oculus-present-export-root=hub&path=deck asked {"ifAvailable":true}
  browser tab, lock held by another export, after:
    lock refused: held by another export / channel closed / tab closed /
    said: An export of this deck is already in progress. / tab opener is null
  desktop app: lock asked first, channel listening only after "lock granted"
  Test Files  1 passed (1)
$ r1/filter.case.svelte.ts                           -> identical to the report's item 5 block:
  slide move under the filter: same array true | drafted-deck POSTs sent by it 0
  snapshot push under the filter: same array true | drafted-deck POSTs sent by it 0
  pick 3, Tier research: keep ["alpha","beta","delta"] | held ["whole","[\"alpha\",\"beta\",\"delta\"]"]
  Clear: keep null | held ["whole"]
  second pane gone: held ["whole"] / first pane gone: held ["whole"]
  Test Files  1 passed (1)
$ ROOT=<worktree> node cases.ts                      -> exit 0; cmp with the report's "cases after the change" block: identical (39 lines)
$ ROOT=<worktree> node client-cases.ts               -> exit 0; cmp with the report's block: identical (19 lines)
$ node collection-same.ts on the worktree and on O147-base -> cmp SAME; cmp with the report's quoted output: identical
$ npx vitest run tests/data/hubs/hub-portfolio.test.ts tests/server/machine/apps/tools/languages.test.ts --tagsFilter slow
  not run separately: both ran inside "vitest slow" of the test:quick above, which passed
$ ls <builder scratchpad>/o147 -> No such file or directory; ls /private/tmp | grep -c 'o147-' -> 0; ls $TMPDIR | grep -c 'o147-' -> 0
```

The builder's last list run failed on two timeouts, in `tests/data/hubs/hub-portfolio.test.ts` and `tests/server/machine/apps/tools/languages.test.ts`. Those timeouts were caused by machine load, not by the change. Both files ran inside "vitest slow" in the run above on the same tree, and passed. The round's changes reach neither file's subject (the deck export, the filter's kept list, the Present store and two head comments). The builder's run was at a load of 11.75, and this run's load rose from 5.5 to 13.7. By the rules file's "Verify before you report", such a failure is not the step's and is not a finding.

The builder's last list run started after the round's last edit, so the closure of the first review's Proof 1 reproduces. `export.ts` was last changed at 23:19:40 and the regenerated diagrams at 23:20:33 (`stat`). The svelte-check stamp in the builder's quoted run, 1793917270545, is 23:21:10 (`date -r 1793917270`).

### Verdicts

Items of the brief's "What to build":

- 1: holds. The round does not touch the reader, the route or the model. The `cases.ts` rerun matches the report, including the C10 rows (400 `{"error":"invalid"}` for `nope`, `[1]`, `[""]` and 1025 keys). The G32 test passes (32 passed).
- 2: holds.
  - `filter.svelte.ts:96-105` returns the same `keep` array while the keys are the same. The filter.case run shows the same array, and no drafted-deck POST, across a slide move and across a push.
  - `asking` (`present.svelte.ts:458-471`) forgets every answer held under a kept list that no pane reads under. After three picks and a Clear only `whole` is held, and a second pane's list stays held while that pane reads under it (filter.case run).
  - `savedFrame` (`:549-554`) falls back to the frame of any held answer of the deck. This serves item 2's "its audience window keeps its frame" once a pane's own list is no longer held, so it is inside the brief.
  - The pane's slide `ref` comes from `instance.state` (`Present.svelte:137`), which a slide move does not change, so the program's constant `REF` is representative.
- 3: holds. In the round, `FilterBar.svelte` changes only its head comment. `Present.svelte` is 518 lines.
- 4: holds.
  - The export case run shows the browser path's order: channel, then `window.open`, then the lock request, all before the press handler returns. A refused lock closes the tab and says "An export of this deck is already in progress".
  - The desktop path keeps its order (the lock first, then the channel inside the grant).
  - The 10 s hold, the 5 s wait and `data-failed` are unchanged.
  - See Behaviour 1 for a race between two exports, and Standards 2 for a blocked tab.
- 5: holds. `wrap.cjs` prints "wrapped" for the 13 paragraphs, `Group.svelte:2-8` and `FilterBar.svelte:2-16` among them. The `export.ts` head comment states the browser order. `HELP.md`'s export sentence adds "(in a browser, the tab it opened closes again)".
- 6: holds. `present.test.ts` is unchanged in the round (`cmp`) and passes. `window-guard.test.ts` shows no diff since the base.

Cases of the brief's "Cases":

- C1: met by reading and the client-cases rerun, which matches the report. The hub's own values and the `chips: [parked]` look are for the look on landing.
- C2: met, by the `cases.ts` rows "keep [alpha, gamma]" and the client-cases "Overview tiles" and "tally" rows, both matching the report. No write path comes from a pick.
- C3: met: the filter.case "Clear: keep null | held [\"whole\"]", plus the reading of `onclear`.
- C4: met: the `cases.ts` "keep []" rows and the client-cases "tally 0 of 5".
- C5: met by reading: `filterable` false gives no bar.
- C6: met: the `cases.ts` `parsePresentState` rows. `keep` undefined asks nothing, and `asking` with undefined only removes the pane's entry.
- C7: met: the client-cases C7 rows.
- C7b: met: the client-cases C7b rows.
- C8: met by reading, unchanged in the round. The windows themselves are for the look.
- C9: not verifiable here, beyond the parts below. Whether a real browser's popup rule lets the open through, and the PDF's pages, need the look in a browser. The order of the open before the first await, the "already in progress" line, the 5 s wait and `print.ts`'s 60 s deadline are met by the export case run and by reading.
- C10: met: the `cases.ts` C10 rows.
- C11: met: the `cases.ts` rows (the talk deck left out under a filter, shown without one).
- C12: met. The filter.case run shows two panes' lists held apart: "first pane picks Stage submitted: held [\"whole\",\"[\\\"gamma\\\"]\",\"[\\\"alpha\\\",\\\"gamma\\\"]\"]". `prune(null)` keeps a measure that any held answer, or any pane's drawn deck, still holds.
- C13: met by reading (`filter.svelte.ts`, the `moving` effect), unchanged in the round.
- C14: met by reading: `leftDeck` sets `filters: {}`.
- C15: met: the client-cases "tally ... of 5" with beta in both groups.

### Findings

**Spec.** None.

**Proof.** None. Every closure the round claims reproduces in this rerun: the list run on the final tree, the export order, the 13 rewraps, the quoted programs and the held lists.

**Standards.**

- **Standards 1: the verify list ran twice.** Place: `.scratch/migration/agents/reviews/O147-report.md`, "Repair round 1", item 1: "The list ran twice in this round. The first run came before the last edit, the rename of a type in `export.ts`". What is wrong: the rules file ("Token discipline") says the list runs once after the last change, and calls a run of the list beyond what that paragraph allows a finding of the review. The first run was of a tree that was not final, and the rename that followed it was not a red line's fix. Failure scenario: with up to six workers on the machine, every extra list run adds about four minutes of full load, which is what made two other suites time out in the builder's second run. Verdict: none.
- **Standards 2: a blocked tab is reported as opened, and the fix was not made.** Place: `src/lib/views/academic/present/acts/export.ts:160-168`, quoted: `const tab = deps.openTab(address); if (tab !== null) tab.opener = null; if (!(await holdExport(deps.ref, () => print.answered))) { ... } deps.say(t('present.export_opened'));`. The report's "Sharp edges" names the defect: in a browser that blocks the popup, `window.open` gives null; Export then still takes the lock and says "The deck opened in a new tab", and the lock holds for up to 10 s. What is wrong: the rules file ("The working rules", never the lazy option: a limitation written instead of a fix) is broken. The round keeps the window handle (`window.open(address, '_blank')`, `Present.svelte:190`), so the null of a blocked tab is now known at this line. The fix is small and inside item 4: on a null tab, stop the answer, take no lock and say a line of `present.yml`. Failure scenario: a reader whose browser blocks pop-ups presses Export; the pane says the deck opened in a new tab, no tab is there, and a second press within 10 s says an export is already in progress. Verdict: none; the fix is small and can be made at landing.

**Behaviour.**

- **Behaviour 1: a refused export can answer another export's print page.** Place: `src/lib/views/academic/present/acts/export.ts:158-163`, quoted: `async function exportTab(deps: ExportDeps, address: string): Promise<void> { const print = answerPrint(deps.ref, deps.keep, Date.now()); const tab = deps.openTab(address); ... if (!(await holdExport(deps.ref, () => print.answered))) { print.stop();`. What is wrong: in the browser path, a press now opens its channel before it knows whether it gets the deck's export. Until the Web Lock refuses it, that channel answers any print page's `keep-asked` with this pane's kept list and an `at` above 0. `exportKeep` (`present.svelte.ts:278-281`) takes the first `keep` with `at > 0` that it hears. In the first build only the lock holder's channel existed (`answerPrint` was opened inside the grant). The report's asynchronous paths do not restate "two exports of one deck" for the new order. Failure scenario: pane A (Stage submitted) and pane B (Tier software) show the portfolio deck in two browser windows; A presses Export, and A's print tab loads and posts `keep-asked`; if B presses Export in the few milliseconds its lock request takes to be refused, and A's ask arrives then, both channels answer, and A's PDF can hold B's slides with no line saying so. Small fix, inside item 4: the browser path's channel holds its reply until the lock is granted and drops it on refusal, and the open stays inside the press. Verdict: none (the race is rare, and C9 holds in every other ordering).

### Declined to judge

- **The look.** Whether a real browser's popup rule treats the open as inside the press, whether `window.open(address, '_blank')` returns a handle in every browser the workbench runs in, the PDF's pages, the windows of C8, C1 on the hub and the panes of C12 and C13 on screen all need the look on landing, which a reviewer does not run.
- **The diagram commands.** `npm run diagrams` and `npm run docs:palette` were not run as commands, since both write into the worktree. Their in-memory staleness checks passed (48 tests), and the diagram files compare equal to the round snapshot.
- **A pane remounted under the same instance id.** When a pane is destroyed and drawn again under that id, the order of the old component's `asking(pane, null, undefined)` teardown and the new component's `asking` effect was not settled by reading. A client-runtime run that mounts and destroys two filters under one id would settle it. The wrong order would cost one extra read, with the pane drawing `last` meanwhile.
- **The hub facts.** The brief's hub facts for C1 (no member project carries a status chip; the stage counts) and whether a hub's filter can keep more than 1024 projects were not checked, since the hub's files were not read.
- **What git ignores.** Whether `svelte-kit sync` inside `test:quick` wrote only under ignored folders was not checked; that would take `git check-ignore`. `git status --short` listed 36 paths before and after.

Reviewer usage: a1ab16e604f88d09e, claude-opus-5-5, 226514 tokens, 64 tool uses, 14 min 55 s.

## Closed

- First review, Proof 1, Proof 2, Standards 1 to 3, Behaviour 1 and 2: sent in repair round 1 (`agents/briefs/O147-round-1.md`) and closed there; the run over the round reproduces each closure.
- Round 1, Standards 1 (the verify list ran twice in the round): a breach of the rules file's "Token discipline" by the builder, recorded in the booking; nothing in the tree to change, and the list ran once on the landed tree at landing.
- Round 1, Standards 2 (a blocked tab reported as opened): fixed at landing in `src/lib/views/academic/present/acts/export.ts`: a null tab stops the answer, takes no lock and says `present.export_blocked` ("The browser blocked the print tab; allow pop-ups for this page and press Export again.", new in `config/text/views/academic/present.yml`); the Present paragraph of `docs/HELP.md` says so.
- Round 1, Behaviour 1 (a refused export can answer another export's print page): fixed at landing in `export.ts`: `answerPrint` answers only after `grant`, which `holdExport` calls once the lock is granted, an ask heard before it answered at the grant; on both paths, so a press the lock refuses never answers a print page.
- Round 1, declined to judge, the look: taken at landing on 8797 (the filter bar, a pick, a slide step under the pick, Clear); pressing Export in the browser was not done, so whether a real browser's popup rule lets the tab open is not verified.
- Round 1, declined to judge, a pane remounted under the same instance id: not settled; the reviewer's reading gives one extra read of the deck at most, with the pane drawing its last answer meanwhile, and no wrong slide.
- Round 1, declined to judge, the hub facts and what git ignores: the look drew the scratch hub's deck with its groups; `git status --short` on main after the landing names no file outside the commit.
