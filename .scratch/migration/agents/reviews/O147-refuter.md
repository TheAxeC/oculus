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
