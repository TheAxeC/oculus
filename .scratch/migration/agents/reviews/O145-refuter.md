# Step O145 refuter report (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O145, base 3f0078305)

## Verification (rerun by the reviewer)

```
Brief check 1, `npm run diagrams && npm run docs:palette`: not run, because both write into the worktree. Their in-memory staleness tests were run instead:
  npx vitest run tests/checks/diagrams/palette.test.ts tests/checks/diagrams/diagrams.test.ts --testTimeout 0
  Test Files  2 passed (2) / Tests  48 passed (48)
Brief check 1, `npm run test:quick`: not run as a whole. Its parts were run one by one:
  npx prettier --check <every touched .ts/.svelte/.yml/.md file, docs/diagrams excluded>  -> All matched files use Prettier code style!
  npx eslint --no-warn-ignored <every touched .ts/.svelte file>                          -> prints nothing, exit 0
  npx svelte-check --threshold error  -> COMPLETED 4599 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
Brief check 2, the rules file's ASCII gate over src tests bin config  -> prints nothing, perl exit 0
  LC_ALL=C grep -n '[^ -~]' over every file in `git status --short` plus arrange/*  -> prints nothing
Brief check 3, as the brief writes it:
  npx vitest run tests/routes/edit/deck-slides.test.ts tests/server/core/changes.test.ts tests/server/edit/deck/deck-edit.test.ts tests/checks/config/config-folder.test.ts tests/checks/diagrams/palette.test.ts
  Test Files  1 failed | 4 passed (5) / Tests  1 failed | 51 passed | 2 skipped (54)
  the failure: tests/checks/diagrams/palette.test.ts "Error: Test timed out in 5000ms."; it passes with --testTimeout 0 (above), which is how package.json:16 runs tests/checks.
Brief check 4, C11's grep  -> prints nothing, exit 1
Brief check 5, wc -l: Present.svelte 515, Bar.svelte 108, acts/menu.ts 93, screen/keys.ts 80, state/life/present.ts 576, state/life/arrange.ts 533, arrange/arrange.svelte.ts 366, DeckForm 142, Group 226, KeyForm 98, Overview 243, RuleForm 166, Tile 148, GroupHead 274, writes.svelte.ts 870, bodies.ts 778, model-deck.ts 268
  ls -A | wc -l: present 10, present/arrange 7, state/life 10, views/academic 4; sh utils/folder-check.sh exit 0
Brief check 6, sh utils/unused-exports.sh > <scratch>/o145-review/unused.txt; diff ../O145-base/unused-exports.txt <that file>  -> nothing printed, exit 0
Brief check 7, git diff 3f0078305 of the two test files: only config-folder.test.ts:303 (the slides.yml line removed) and deck-slides.test.ts:297,301,303 (title, row, reason) changed.

The commands the builder's report quotes, rerun:
  the first-run reads on the base copy (C1 grep -c -> 0; C2 grep -> Present.svelte:435 ondrop={acts.dropped}; C6 -> nothing; C8 sed 437p -> {#if rows.length === 0 || deck === null}; C9 grep -c rule -> 0; C10 sed 250,252p -> return deck.title === '' ? deck.name : deck.title; C11 on the base copy -> 104 lines, 22 files; C12 -> lines 12,15,22,24 only; C16 sed 304,320p -> o sets overview with preventDefault from any target)  -> each the same as the report
  the plainText case-run, as `node --input-type=module -e` (nothing written):
    {"title":"Comparing tumors across patients with <i>no</i> template alignment","plainText":"Comparing tumors across patients with no template alignment"}
    {"title":"&lt;i&gt;no&lt;/i&gt; template","plainText":"<i>no</i> template"}
    {"title":"<i></i>","plainText":""}
    {"title":"Teaching a brain-computer interface from <i>other</i> people's brains","plainText":"Teaching a brain-computer interface from other people's brains"}
  npx vitest run tests/routes/git/zenodo.test.ts  -> Test Files 1 passed (1), Tests 51 passed (51), 25.72s (the report: 51 passed, 26.56 s)
  npx vitest run tests/checks/tree/duplication.test.ts tests/checks/source/comment-width.test.ts --testTimeout 0  -> Tests 20 passed (20)
  also run: tests/checks/tree/boundaries.test.ts tests/checks/tree/size.test.ts --testTimeout 0  -> Tests 21 passed (21)
  the history-word grep (git diff 3f0078305 -U0 ... | grep '^+' | grep -niE ...) and the same words over arrange.ts and arrange/*  -> hits at arrange.ts:102,178,301; arrange.svelte.ts:58,67,292; Group.svelte:10; KeyForm.svelte:8,10,54,62; HELP.md lines 266 and 331's bullet; each a place in a list or the order of two events. No hit in DeckForm.svelte or RuleForm.svelte. present.ts's "still paused" is at 553, a base line.
  grep for package ids and dates in arrange.ts and arrange/  -> nothing
  the report's test:quick totals (163 test files, 1831 passed, 253.9 s): not rerun.
  the report's "Present.svelte was 532 lines" with the key rule inline: it cannot be rerun on the final tree. Computed by reading instead: heldBack with GRID_KEYS and FIELDS takes keys.ts:15-36, 22 lines, and 515 + 22 = 537, which is over 520. The decision to move it to keys.ts stands.

Files written: one, /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o145-review/unused.txt (the output of unused-exports.sh). Vitest may also have written its own caches under the worktree's node_modules (not verified).
```

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. Tile.svelte:96-107 draws `Slide` in `Stage` inside `<div class="shot" inert>`, with the place and title in the `Card` under it. The tile keeps the tone edge (:65-68, :122-124), the current outline (:132-135), the cursor through `Card` (:103), the press (:71-75 and `ontitle`) and the ContextMenu (:78). The scaling is for the look.
- 2: violated, Spec 2 (a malformed `order:` entry puts slides under the wrong entries). Otherwise `overviewRuns` (arrange.ts:135-175) draws entries in order, groups at their `slides:` entry, at their first summary or grid entry, or at the end, with members known by the key prefix, title tiles and placeholders. The count is `members.length` (Group.svelte:114).
- 3: holds. `ruleSentence` (arrange.ts:495-515), RuleForm and KeyForm with Apply and Cancel, the `own` rule (Present.svelte:350), and Escape: KeyForm.svelte:50-59 with stopPropagation, then the deck's Escape on a later press. Behaviour 1 is a side effect of the key rule as written.
- 4: violated, Spec 1 (a member deck's drag carries its group's entry), Spec 3 (title tiles have no keyboard path) and Spec 4 (the hold has no bound).
- 5: holds. Overview.svelte:124-145 and DeckForm.svelte write through `setKeys`, then `send`, then `writeDeckSlides`'s `keys`.
- 6: holds. The folder, `slides.ts` and `slides.yml` are deleted, the strings live under `present.*`, and the Bar button and `onslides` are gone. `grep -rn "['\"]slides['\"]" src` finds only the YAML key `slides:` (deck.ts:124, deck-edit.ts:34). config-folder.test.ts passes.
- 7: holds. `deckLabel` is `deckWords(deck.title, deck.name)` (present.ts:254-266), and the case-run gives the plain title and `""` for `<i></i>`, so the name is used.
- 8: holds for the text. One HELP.md bullet ("Drag a deck's tile within its group to move it, or onto another group to move it there") is false while Spec 1 stands, and becomes true with its fix.

Cases of the brief's "Cases":

- C1: met by reading (`overviewRuns` against the portfolio `order:` as the brief gives it). The drawing is for the look.
- C2: met by reading. `entryDropped` gives `[title, slides:pillars, summary:pillars, engine.md, ...]`, `send({ order: { base, entries } })`, and `groups` is `change.groups ?? []`.
- C3: met by reading. With all seven named and none missing, `deckStepped` gives the first two swapped, with base `held.slides`.
- C4: unmet, Spec 1.
- C5: met by reading. `removable: one.named` (Group.svelte:78) and `withTick(..., false)`.
- C6: met by reading. The candidates are mapped through `deckWords`, and the Menu is `waiting` with the `arrange_add_none` label when there are none.
- C7: met by reading. `arrangeLine` returns `refused[0].reason`, and `arrangeWrote` false sets no hold.
- C8: met by reading. Present.svelte:433 shows `Empty` only for no deck, or no slide with no order and no group; `arrangeable` refuses when `keys === null`.
- C9: met by reading, with the stage words as the vocabulary ids the file holds (judgment call 6).
- C10: met (the case-run and arrange's use of `deckWords`).
- C11: met (the grep prints nothing).
- C12: not verifiable by reading alone. The code makes the shot `inert` and the tile's click calls `onpick` unless the target is the Card's button. The look settles it.
- C13: met by reading. `rule_named`, header count 0, and the Add tile is `waiting`.
- C14: met by reading (both panes draw from the store's deck). The look settles the redraw.
- C15: met by reading. `{ slides: nosuch }` falls to an entry block with `findingAt`, and Move Later goes through `entryStepped`; an `ideas` member's Move Later goes through `deckStepped`. The keyboard gap is under item 4.
- C16: met by reading. In an input, `own` holds; Escape is taken by KeyForm with stopPropagation; the focus goes back to Edit Rule, and the next Escape closes the grid.
- C17: met by reading on the portfolio deck. `sending` and then `waiting` disable the menu items, the drags and the Add tile until the pushed deck's lists differ.
- C18: met (the case-run gives "Teaching a brain-computer interface from other people's brains", and `deckWords` returns the name for an empty plain title).
- C19: unmet, Spec 1.

The paths outside the brief's path list, each judged against the item that needed it:

- `screen/keys.ts` is needed by item 3 and the size rule. Present.svelte would be 537 lines with `heldBack` inline, which is over 520. keys.ts is the helper that already holds the slide keys.
- `GroupHead.svelte` beyond lines 63-67 is needed by item 4 and decision 6. The base requires `open` and `ontoggle` and always draws `FoldControl`. The change makes both optional, defaults `open` to true, and leaves every other caller unchanged (svelte-check: 0 errors).
- `glyphs.yml` and `icons.yml` are needed by item 6. The `section` glyph was read only by `views.slides_glyph` of the deleted slides.yml; `grep -rnE ":\s*section\s*$" config` and `grep -rnE "glyph=\{?['\"]section" src` now print nothing.
- `pane-fold.ts:14` is needed by item 8. Its comment named "Slides" among the views that fold through `stateFolds`.

The one `npx prettier --write` run over the builder's own new files and `present.ts`: not a finding. The rules file asks a builder to run the pinned formatter on what it wrote ("run `npm run format` on what you wrote"). The script rule covers ad hoc programs (python3, node, perl, sed -i, awk, redirects). The present.ts diff holds only the step's change.

The zenodo timeout: the step's diff does not reach the failing case through any code the step changed. zenodo.test.ts:17 imports `data/model/index.ts`, which re-exports `model-deck.ts` (index.ts:475, :609). That is depth 2, and quick.mjs:44 sets RELATED_DEPTH = 2, which is why test:quick chose the file. The step changed only comments in model-deck.ts. The case calls `loadConfig(engineDir())` (zenodo.test.ts:424), which reads every file of `config/` (merge.ts:171-176), the step's YAML among them, as data only. The file passes alone (51 passed). The rules file's Verify section says this is not the step's.

## 1. Spec

- `src/lib/views/academic/present/arrange/Group.svelte:115-118`: "draggable={block.token !== null && !busy && !rule.open()} ondragstart={(event: DragEvent) => { if (block.token !== null) arrange.start(event, { kind: 'entry', token: block.token }); }}"
  - What is wrong:
    - GroupHead spreads these onto its `<section>` (GroupHead.svelte:160-161), and that section holds the group's body, its deck tiles included.
    - `dragstart` is not a delegated event in Svelte 5.57.1 (node_modules/svelte/src/utils.js:110-134), so it bubbles natively from a deck tile to that section.
    - The tile's handler runs first and sets `carried` to the deck (arrange.svelte.ts:270-278). The section's handler then runs `arrange.start` again and overwrites `carried` with `{ kind: 'entry', token: 'slides:<group>' }`. Neither handler stops propagation.
    - Item 4 asks that a member deck's drag moves the deck within its group or into another group.
  - Failure scenario:
    - For C4, drag a `pillars` deck tile onto the `more` header. `overGroup` takes an entry whose token differs (arrange.svelte.ts:295-298). `dropOnGroup` calls `moveEntry('slides:pillars', 'slides:more', side)`. The result is one `order:` write that moves the whole `pillars` group; no group list changes.
    - A drag within a group is taken by no target (`overDeck` returns for an entry, and the group's own token is refused), so nothing happens.
    - C19 is the same.
    - The same holds for `ideas`, whose header token is the grid's.
    - Only a group drawn at the end (`token` null) drags its decks correctly.
  - Fix: stop the deck drag's `dragstart` (and `dragend`) from reaching the section, or have the section's handler start only for a drag that begins on the strip.
  - Verdict: item 4 violated; C4 and C19 unmet.

- `src/lib/state/life/arrange.ts:104-112` and `:148-149`: "entry = slide.source?.entry ?? entry;" ... "for (const [at, entry] of deck.order.entries()) { const slides = placed.get(at) ?? [];"
  - What is wrong:
    - `source.entry` is the entry's index in the YAML list. spec.ts:177 sets `index` from `value.entries()`, read.ts:347, 385-386 and 465 copy it, and spec.ts:182-185 and 205 drop an entry that is malformed.
    - `at` is the entry's place in `deck.order`, which read.ts:516-531 builds from `doc.spec.order` after those drops.
    - `findingAt` (arrange.ts:128-131) looks up `order[${at}]` by the same position. It also filters `deck.findings` by key alone, never by the deck's own file, so another file's `order[N]` finding can name a placeholder. Whether member decks' findings reach `deck.findings` is not verified.
    - Item 2 asks the Overview to draw the entries of `order:` in order, each with its own slides.
  - Failure scenario:
    - Take `order: [title.md, 42, engine.md, closing.md]`. The reader drops `42` with `order_shape`.
    - `deck.order` places title, engine and closing at 0, 1 and 2, while the slides carry entry 0, 2 and 3.
    - `engine.md` is drawn as a placeholder named with `42`'s `order_shape` finding.
    - `closing.md`'s place draws engine's slides, and a drag of those tiles moves `closing.md`.
    - closing's own slides are not drawn at all.
  - The report keeps this as judgment call 9 ("Not fixed: the reader's indexing is outside this step"). That defers work inside the step, since `overviewRuns` is the step's own new code.
  - Fix: carry the YAML index on `DeckOrderEntry` (read.ts `orderOfDeck`, model-deck.ts), key `slidesByEntry` and `findingAt` by it, and match the finding's file to the deck's own `present.yml`.
  - Verdict: item 2 violated for a deck with a malformed `order:` entry.

- `src/lib/views/academic/present/arrange/Tile.svelte:63` and `:103`: "const onpress = $derived(row === null ? undefined : () => view.onpick(row.key));" ... "<Card id={card} cursor={card === view.cursor} title={words} level={4} ontitle={onpress}>"
  - What is wrong:
    - For a title tile (`row === null`), `Card` draws no title button (Card.svelte:108-114 draws `<button class="open">` only with `ontitle`). The tile then holds no focusable element.
    - ContextMenu opens from the keyboard only on the menu key or Shift+F10 on a control inside it (ContextMenu.svelte:135-139).
    - The card cursor's keys move and activate but open no menu (data/helpers/keys/oculus/resolve.ts:360-374).
    - Item 4 and decision 2 make Move Earlier and Move Later the keyboard path for every tile's drag.
  - Failure scenario:
    - The nine `ideas` decks of the portfolio deck, and any member whose `present.yml` is empty or unreadable, are drawn as title tiles.
    - On those tiles, Move Earlier, Move Later and Remove from Group can only be reached by a right-click. A keyboard user cannot reorder `ideas` (the second half of C15 by keyboard).
  - Fix: give a title tile a focusable control (for example a `Menu` button holding its arranging items, as the placeholder has).
  - Verdict: item 4 violated (the keyboard path).

- `src/lib/views/academic/present/arrange/arrange.svelte.ts:79-82` and `:110-113`: "if (waiting !== null && deck !== null && signature(deck) !== waiting) waiting = null;" ... "waiting = now !== null && signature(now) !== made ? null : made;"
  - What is wrong:
    - Item 4 holds the controls "from a write until its answer and the next push of the deck", and decision 7 says the same.
    - The code holds them instead until a deck arrives whose groups, order tokens and keys differ from the ones the write was made over. Such a deck may never come.
    - The hold has no bound, and the report names it as unfixed (judgment call 4). It is a defect inside the step's part.
  - Failure scenarios:
    - (a) A deck with two summaries of one group with different titles (tokens `summary:pillars` and `summary:pillars~2`, spec.ts:56-68). Move Later on the first swaps them in the file, and the reread names them by place again, so the tokens and the signature are the old ones. Line 112 then keeps `waiting = made`, line 81 never clears it, and every arranging control stays disabled until the pane remounts.
    - (b) A present.yml with unsaved text in a source tab of the same page. The Overview arranges the live deck read over that draft (Present.svelte:141-147, acts/live.svelte.ts), whose lists do not change with the disk.
    - (c) No `files` push for the deck, for example when the event stream drops.
  - Fix:
    - Hold on the files deck (`answer.deck` of `deckOf(ref)`), not the live deck.
    - Record the files deck object the write was made over, and end the hold at the answer or at the first files deck after it that is not that object. Whether every push replaces the object is not verified.
    - For a push that never comes, end the hold when the pane's next read of the deck answers, or at a bound. An act made after the bound on old bases is refused whole by the server and writes nothing.
  - Verdict: item 4 violated (decision 7 holds the controls longer than it says). C17 is met on the portfolio deck.

## 2. Proof

- `.scratch/migration/agents/reviews/O145-report.md`, history-word section: "`arrange.ts:89` ... `arrange.ts:165` ... `arrange.ts:288`, `arrange.svelte.ts:49,58,283`, `Group.svelte:10`, `DeckForm.svelte:102` and `RuleForm.svelte:107`" and "`present.ts:550`"
  - What is wrong: the rerun grep gives arrange.ts:102, 178 and 301; arrange.svelte.ts:58, 67 and 292; KeyForm.svelte:8, 10, 54 and 62; no hit in DeckForm.svelte or RuleForm.svelte; and present.ts:553. The rules file's Report rule takes every `file:line` after the last change. No decision rests on these lines.
  - Failure scenario: a reader checks each hit at the cited line and finds other text.
  - Verdict: none.

- O145-report.md, first line: "Every other item of the brief is done."
  - What is wrong: Spec 1, 2, 3 and 4 leave items 2 and 4 short. The report's before-and-after rows for C4 and C19 describe a result the code does not give.
  - Failure scenario: at landing, the look reads C4 against "one write holding both groups" and finds an order move.
  - Verdict: C4 and C19 unmet (Spec 1).

## 3. Standards

- `src/lib/state/life/arrange.ts:30`, `:98`, `:249` and `src/lib/views/academic/present/acts/menu.ts` (`ArrangePlace`): "export type { DeckGroup, DeckKeys, DeckOrderEntry };", "export type OverviewRun", "export type DeckDrop", "export type ArrangePlace"
  - What is wrong:
    - `grep -rlw` finds `OverviewRun` and `DeckDrop` only in arrange.ts and `ArrangePlace` only in menu.ts.
    - `grep -rnw "DeckGroup\|DeckOrderEntry" src/lib/views src/lib/state` (arrange.ts and present.ts excluded) prints nothing, so those two re-exports have no importer.
    - The rules file's principles say an export with no importer outside its own file and its tests is removed or made local.
    - The report's check 6 rests on unused-exports.sh, which lists no types.
  - Failure scenario: a reader takes these for a public surface of the module and keeps them alive.
  - Verdict: none.

- O145-report.md as a whole:
  - What is wrong:
    - It does not state how many times the list ran (rules file, "Token discipline").
    - It does not list the head comments, doc comments and docs paragraphs that describe the changed behaviour as "still true" or "rewritten" (rules file, "What every package obeys").
    - It quotes no grep made before writing a helper or type (`deckWords`, `heldBack`, `createOpener`, `createKeyWork`, `TileView`; rules file, "The principles every package is judged on").
  - Failure scenario: the orchestrator cannot tell from the report whether an existing helper was reused, or which documents were re-read.
  - Verdict: none.

## 4. Behaviour

- `src/lib/views/academic/present/Present.svelte:350-351`: "const own = inControl(event.target) && (event.key !== 'Escape' || event.defaultPrevented); if (!own && deckKey(event)) return;"
  - What is wrong:
    - The rule holds for every control in the Present box, outside the Overview too: the presenter screen's Pause, Resume and Reset buttons (presenter/Presenter.svelte:80-86, ToolButtons that keep the focus after a press), and a link or a `summary` in the slide on screen (CONTROLS, keys.ts:9-10).
    - The base moved on every move key from any target except Space on a control (O145-base Present.svelte:304-309), and it took `o`, `f` and `p` from any target.
    - Now a move key, or `o`, `f` or `p`, pressed with the focus on such a control does nothing. In full screen, `heldBack` (keys.ts:28-36) also prevents its default.
    - In the grid, the arrows pressed on a tile's title button go to the shell's card cursor instead of moving the current slide.
    - The report's before-and-after list does not name any of this. Judgment call 2 states the rule only.
  - Failure scenario: a presenter presses Pause on the presenter screen, then the clicker's PageDown. The target is the Pause button, so `own` holds, the deck does not advance, and it stays stuck until the presenter clicks the slide.
  - Brief item 3 dictates the rule as written ("returns when `inControl(event.target)` holds, for every key it takes"). Only C16 needs fields to keep their keys, and keys.ts:19 already has that set (`FIELDS`). A narrower rule ends both problems: a field keeps every key, and any other control keeps Space and Enter as in the base.
  - The orchestrator rules on which rule to keep.
  - Verdict: item 3 holds as written; this is a user-visible change outside the step's part that the report did not name.

## Declined to judge

- The look cases: the tiles' scaling (item 1), C12's `inert` press, C14's redraw in two panes, and decision 4's opening time on the portfolio deck. None can be settled by reading alone. The code is described under each verdict.
- Whether the rule sentence should use the vocabulary labels instead of the ids the file holds (C9, judgment call 6). The brief's wording allows either, so it is the orchestrator's call.
- The failing line of each changed test on the unchanged tree. Producing it would mean running a changed test against a copy, which the user's no-breakage rule bars. Read instead: both expected-text edits match the new `config/text/server.yml:147` and the deleted file.
- The deck's and the rule's forms take the file's current value as each key's base when Apply runs (arrange.ts:387-393). The logic is unchanged from the base's `slides.ts:312-322`, so an edit made in another pane while a form is open is overwritten without a refusal. It is not judged as this step's defect.
- The report's whole `test:quick` totals were not rerun. No decision rests on them beyond the zenodo line, judged above.

Reviewer usage: a5bb0bc8f6d579102, claude-opus-5-5, 305450 tokens, 105 tool uses, 25 min 12 s.

## Repair round 1, refuted (on /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O145, base 3f0078305)

```
Brief check 1, `npm run diagrams && npm run docs:palette`: not run, because both write into the worktree. Their staleness tests were run instead:
  npx vitest run tests/checks/diagrams/palette.test.ts tests/checks/diagrams/diagrams.test.ts --testTimeout 0
  Test Files  2 passed (2) / Tests  48 passed (48)
Brief check 1, `npm run test:quick`: not run as a whole. Its parts, rerun one by one:
  npx prettier --check <every changed and new file, docs/diagrams excluded>  -> All matched files use Prettier code style!
  npx eslint --no-warn-ignored <every changed and new .ts/.svelte file>     -> eslint exit 0
  npx svelte-check --threshold error  -> COMPLETED 4599 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  the vitest tiers: not rerun as a whole. A sample of the files the report says timed out in its run, each alone at its tier's limit (uptime at the start: load averages 5.29 9.90 10.54):
    npx vitest run tests/data/hubs/workspace-projects.test.ts --tagsFilter '!slow'          -> Tests 5 passed (5), 5.29s
    npx vitest run tests/data/sources/config/boards.test.ts --tagsFilter '!slow'            -> Tests 39 passed (39), 3.50s
    npx vitest run tests/server/machine/runs/schedules/run.test.ts --tagsFilter '!slow'     -> Tests 1 passed (1), 9.98s
    npx vitest run tests/data/hubs/self.test.ts --tagsFilter slow --testTimeout 20000       -> Tests 17 passed (17), 28.24s
Brief check 2, the rules file's ASCII gate (perl) over src tests bin config  -> prints nothing, perl exit 0
  LC_ALL=C grep -rn '[^ -~]' over the 37 changed and new paths of `git status --short` (deleted paths and .scratch excluded)  -> grep exit 1, nothing printed
  LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/reviews/O145-report.md  -> exit 1, nothing printed
Brief check 3, as the brief writes it:
  npx vitest run tests/routes/edit/deck-slides.test.ts tests/server/core/changes.test.ts tests/server/edit/deck/deck-edit.test.ts tests/checks/config/config-folder.test.ts tests/checks/diagrams/palette.test.ts
  Test Files  1 failed | 4 passed (5) / Tests  1 failed | 51 passed | 2 skipped (54)
  the failure: FAIL |unit| tests/checks/diagrams/palette.test.ts > the palette page > is what the palette gives now, "Error: Test timed out in 5000ms."; it passes with --testTimeout 0 (above).
Brief check 4, C11's grep  -> prints nothing, exit 1
Brief check 5, wc -l: Present.svelte 520, Bar.svelte 108, acts/menu.ts 93, screen/keys.ts 87, state/life/present.ts 582, state/life/arrange.ts 514, arrange/arrange.svelte.ts 387, DeckForm 142, Group 245, KeyForm 99, Overview 249, RuleForm 167, Tile 163, GroupHead 274, writes.svelte.ts 870, bodies.ts 778, model-deck.ts 276, read.ts 625, schema.ts 638, deck-files.ts 464
  ls -A | wc -l: present 10, present/arrange 7, state/life 10, views/academic 4, state/forms 10, data/sources/deck 10, data/model 10, writes/config/lists/deck 6; sh utils/folder-check.sh exit 0
Brief check 6, sh utils/unused-exports.sh > <scratch>/o145-review-r1/unused.txt (exit 0); diff ../O145-base/unused-exports.txt <that file>  -> nothing printed, exit 0
Brief check 7, git diff 3f0078305 -- tests: 2 files, 3 insertions, 4 deletions: config-folder.test.ts loses 'views/academic/slides.yml'; deck-slides.test.ts title "a key the Overview does not set", row 'a key the Overview does not set', reason "deck.author is not a key the Present view's Overview sets". Nothing else.

The commands the report quotes as evidence, rerun:
  npx vitest run tests/server/edit/deck/deck-acts.test.ts   -> Test Files 1 passed (1), Tests 7 passed (7)     (report: 7 passed)
  npx vitest run tests/routes/edit/apps/app-gate.test.ts    -> Test Files 1 passed (1), Tests 22 passed (22)   (report: 22 passed)
  npx vitest run tests/routes/edit/undo/undo.test.ts        -> Test Files 1 passed (1), Tests 40 passed (40)   (report: 40 passed)
  also run, since read.ts changed in code: tests/data/sources/present.test.ts -> Tests 4 passed (4); tests/routes/docs/deck.test.ts -> Tests 4 passed (4)
  the history-word grep (git diff 3f0078305 -U0 ... | grep '^+' | grep -niE ..., and the same words over arrange.ts and arrange/*)  -> HELP.md "no longer has" and "before or after that group"; arrange.ts:86,161,284; arrange.svelte.ts:63,72,313; Group.svelte:11; KeyForm.svelte:9,11,55,63. The same lines as the report, each a place in a list or the order of two events.
  grep for package ids and dates in arrange.ts and arrange/*  -> nothing, exit 1
  item 6's grep for vocabChoices  -> schema.ts:239 (the definition), schema.ts:402, Overview.svelte:92 (report: the same, with :92 after item 4)
  item 7: grep -rlw for each exported type of arrange.ts, menu.ts and arrange.svelte.ts  -> every one has an importer outside its file (DeckKeys: DeckForm, RuleForm, arrange.svelte.ts; OverviewRun, DeckDrop and ArrangePlace are no longer exported)
  item 4's reads: query-core utils.js:171-183 replaceData returns replaceEqualDeep(prevData, data) unless structuralSharing is false; query.js:87 setData stores it; queries.svelte.ts:47-51 sets no structuralSharing; present.svelte.ts:237-246 deck(ref) returns the query's data  -> as the report says
  the report's file line counts  -> each the same as my wc -l above
  the report's whole test:quick totals (45 timeouts in 16 files): not rerun.

Files written: one, /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o145-review-r1/unused.txt (the output of unused-exports.sh). The harness moved my foreground run of undo.test.ts to the background after 180 s and wrote its output to /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/tasks/bsw0j0j5y.output; it ended with exit 0 before this report. Vitest may also have written its caches under the worktree's node_modules (not verified).
```

### Verdicts

Items of the brief's "What to build", for the whole diff since the base:

- 1: holds. Tile.svelte:100-104 draws `Slide` in `Stage` inside `<div class="shot" inert>`, with the place and title in the `Card` under it. The tile keeps the tone edge, the current outline, the cursor through `Card`, the press (`pressed`, `ontitle`) and the ContextMenu. The scaling is for the look.
- 2: holds. `overviewRuns` (arrange.ts) now looks up slides by `entry.entry`, the YAML index (`placed.get(entry.entry)`). read.ts `orderOfDeck` sets `entry: entry.index` and `findings` filtered by `one.file === doc.file && one.key === entry.at`. For `order: [title.md, 42, engine.md, closing.md]`, title, engine and closing look up 0, 2 and 3, and no kept entry has `at` `order[1]`. Groups at their `slides:` entry, at their first summary or grid, or at the end; members by the key prefix; title tiles and placeholders; the count is `members.length`.
- 3: partial, Behaviour 1. A key typed in the DeckForm's tag-tone field (a bits-ui Select trigger, a `<button>`) is not kept by the field. The rule sentence, RuleForm, DeckForm and KeyForm with Apply and Cancel, the field rule and Escape otherwise hold.
- 4: holds. Spec 1 is closed (`start` and `end` stop propagation; `headDrag` starts the entry only from the strip). Spec 3 is closed (the title tile's menu button). Spec 4 is closed (the hold reads the files deck and has a 3 s bound). Disabling, the status line, Remove from Group, Add, missing and conflict tags and `plainText` labels are as in round 0.
- 5: holds. Overview.svelte:130-151 and DeckForm write through `setKeys`, then `send`, then `writeDeckSlides`'s `keys`.
- 6: holds. The Slides folder, `slides.ts` and `slides.yml` are deleted, the Bar button and `onslides` are gone, and config-folder.test.ts passes.
- 7: holds. `deckLabel` goes through `deckWords`. The round did not touch it.
- 8: holds. The C11 grep prints nothing. Both HELP.md drag bullets (333, 334) are true by my reading of the drag path below.

Cases of the brief's "Cases":

- C1: met by reading (`overviewRuns` against the portfolio `order:` as the brief gives it). The drawing is for the look.
- C2: met by reading. The tile's `dragstart` goes to `start` (entry) and stops at the tile. The drop goes through `dropOnEntry`, then `moveEntry`, then `entryDropped`, then `send({ order: { base, entries } })`, and `groups` is `change.groups ?? []`.
- C3: met by reading (`deckStepped`, base `held.slides`).
- C4: met by reading. The pillars tile's `dragstart` calls `start(event, { kind: 'deck', group: 'pillars', name })`, which runs `event.stopPropagation()` (arrange.svelte.ts:290), so the section never sees it. Over the `more` header, `overGroup` takes a deck. `dropOnGroup` calls `moveDeck('pillars', name, 'more', null, 'after')`, and `deckDropped` gives `withCross`: two GroupLists in one `send({ groups })`.
- C5: met by reading (`removable: one.named`).
- C6: met by reading (the candidates go through `deckWords`; the Menu is `waiting` with `arrange_add_none` when there are none).
- C7: met by reading (`arrangeLine` gives the refusal's reason; `arrangeWrote` false holds nothing).
- C8: met by reading, as in round 0.
- C9: met by reading, with the labels round item 6 rules: `ruleSentence(keys, group, choices)` gives "nascent (concept), scoping (lit-check and framing), de-risking (feasibility experiment) and exploring" (vocab.yml:64-67).
- C10: met (the case-run of round 0, and `deckWords`; unchanged this round).
- C11: met (the grep prints nothing).
- C12: not verifiable by reading alone. The look settles it (the shot is `inert`).
- C13: met by reading.
- C14: met by reading. Each pane draws from the store's deck, and each pane's hold is its own. The look settles the redraw.
- C15: met by reading. `{ slides: nosuch }` is a placeholder whose `findingOf(entry)` reads the entry's own `order_group_unknown` (raised with `raiseFor(doc.file)` at `entry.at`, read.ts:378/455), and Move Later goes through `entryStepped`. An `ideas` title tile now has a Menu button (Tile.svelte:122-124) holding Move Earlier, Move Later and Remove from Group, reached by Tab, with `deckStepped` for Move Later.
- C16: met by reading. In the folder field (TextInput, an `input`), `typed` holds, so `p` and `o` reach no deck key. Escape is taken by KeyForm with stopPropagation.
- C17: met by reading. `sending` holds the controls, then `waiting` holds them until the files deck object changes (the pushed answer differs, so replaceEqualDeep gives a new object) or 3 s pass. Which of the two ends a given run is for the look.
- C18: met (round 0's case-run; unchanged).
- C19: met by reading. `dropOnGroup` calls `moveDeck('more', x, 'pillars', null, 'after')`. Since `more.slides` does not include x, `deckDropped` returns pillars' list alone.

Round items:

- 1, closed.
  - `Group.svelte:136-137` records `grabbed` on pointerdown, and `headDrag` (`:111-120`) starts the entry only when `grabbed` is inside `:scope > h3`. GroupHead's `h3.strip` is a direct child of the section (GroupHead.svelte:166).
  - `start` and `end` call `stopPropagation`. `dragstart` and `dragend` are not in Svelte 5.57.1's delegated list (node_modules/svelte/src/utils.js:110-134), so the native stop reaches the section.
  - Drag within a group: `overDeck` and `dropOnDeck` stop propagation and call `moveDeck(name, x, name, onto, side)`.
  - Group header strip: carries `{ kind: 'entry', token }`. On a tile in another group, `overDeck` returns without stopping, `overGroup` takes it and `dropOnGroup` calls `moveEntry`. The `ideas` header carries the grid's token the same way.
  - A non-draggable tile in a group (busy, or no source) no longer drags its group: `headDrag` cancels.
- 2, closed. `DeckOrderEntry.entry` and `findings` (model-deck.ts:227-234), `orderOfDeck` (read.ts:521-545), `slidesByEntry` and `findingOf`. Findings come only from the deck's own file and its own `order[N]`. The same lookup is fixed in `placedBy` (present.ts:390-395) and `entryAt` (deck-files.ts:166-168, used at :179 and :324). The deck-files change is the accepted ruling. Its covering tests pass (deck-acts 7, app-gate 22, undo 40, deck-edit and changes in check 3).
- 3, closed. Tile.svelte:110 passes the `titleMenu` snippet as the Card heading for a title tile: a `Menu` labelled with `words` (the deck's `deckWords` title, arrange.ts `decksOf`), holding `deckMenu`'s items. key-dom.ts:70 presses `.title button`, which is that button.
- 4, closed as ruled.
  - The hold reads `files: () => deckOf(ref).deck` (Overview.svelte:66). `over` is taken at the answer (arrange.svelte.ts:125), and the effect releases at the first `now !== over` (:93-96) or at `HOLD_MS = 3000` (:76, :127). A refusal or failure returns at :124 and holds nothing. The teardown clears the timer (:97).
  - `listsSignature` is gone: grep over src, tests, docs and config prints no hit.
  - The two-summaries case ends by the push by reading: the swapped titles make the answer differ, so it is a new object. It ends by the bound when the push lands before the answer.
- 5, closed as ruled, with Behaviour 1.
  - Present.svelte:349-361: `typed` is `inField(...) && (key !== 'Escape' || defaultPrevented)`, and `pressed` is `control && key === ' '`. On a presenter-screen button, PageDown now moves (the round-0 finding is closed). On a link, the deck's keys act as on the base (O145-base Present.svelte:304-361).
  - `heldBack`'s `control` is `inControl`, as the added ruling keeps it.
  - The head comment (:34-44) and the comment over `keys` are rewritten. C16 holds.
- 6, closed. There is one `vocabChoices`, in schema.ts:239, now exported. For a map vocabulary it gives the same `{id, label}` the removed arrange.ts copy gave, since `vocabSource('stages')` is `{ key: 'stages' }` and `byKey` reads `config.stages`. `ruleSentence` takes `choices`.
- 7, closed. `export type { DeckKeys }` alone remains. `OverviewRun`, `DeckDrop` and `ArrangePlace` are local. unused-exports diff prints nothing.
- 8, closed, with Proof 1 (one HELP.md bullet misquoted). The file:line of the history words match my rerun, and the verify count is stated. The comments list, the helper greps and judgment calls 4 and 9 are present.

Added rulings:

- The hold on the files deck: closed (round item 4 above).
- `heldBack`'s `control` kept as a button or a link keeping Enter and Space in full screen, with a field keeping every key: closed. keys.ts:35-43 returns false for `inField`, for the grid keys, for Enter on a control or under the cursor, and for Space on a control.
- `entryAt` in deck-files.ts accepted as part of item 2: closed. Its tests pass as above.

No finding is closed by removing a check. `listsSignature` was the hold's only reader, and the hold it fed is replaced by the ruled one. No fix reaches past its finding beyond the accepted `placedBy` and `entryAt` lookups of the same defect.

### Findings

Spec: none.

Proof:

- Proof 1. `.scratch/migration/agents/reviews/O145-report.md`, Repair round 1, item 1: "The HELP.md bullet the review named (`docs/HELP.md:333`, "Drag a tile, a placeholder or a group's heading to move its entry of the order; ...") is true as it stands."
  - What is wrong: the review named the bullet "Drag a deck's tile within its group to move it, or onto another group to move it there", which is `docs/HELP.md:334` (grep -n prints 333 and 334 as two bullets). The report rereads the neighbouring bullet. Both are true by my reading of the drag path, so no decision rests on it.
  - Failure scenario: the orchestrator takes the deck-drag bullet as reread when the report checked another one.
  - Verdict: none.

Standards:

- Standards 1. `src/lib/views/academic/present/arrange/KeyForm.svelte:25`, `RuleForm.svelte:41`, `DeckForm.svelte:33`: "/** True while a write is in flight, which holds Apply. */". Also `Overview.svelte:14-15`: "From a write until the server sends the deck read again after it, or a bound after the answer, every arranging control is held."
  - What is wrong:
    - `busy` is `arrange.busy()`, which is `sending || waiting`. It stays true after the answer, until the files deck changes or 3 s pass. KeyForm's head comment, rewritten this round (:5-7), says so; the prop doc beside it and the two in RuleForm and DeckForm say "while a write is in flight".
    - The Overview sentence says every write holds until the push or the bound. A refused or failed write holds nothing after its answer (arrange.svelte.ts:124).
    - Rules file, "What every package obeys": after changing what code does, the doc comments that describe it are re-read and made true.
  - Failure scenario: a reader of RuleForm sees Apply disabled after the status line reported a write and, from the prop doc, looks for a write still in flight. A reader of Overview expects a refusal to hold the controls for up to 3 s.
  - Verdict: none.

Behaviour:

- Behaviour 1. `src/lib/views/academic/present/Present.svelte:352-355` with `screen/keys.ts:20`: "const typed = inField(event.target) && (event.key !== 'Escape' || event.defaultPrevented); const pressed = control && event.key === ' '; if (!typed && !pressed && deckKey(event)) return;" with "const FIELDS = 'input, textarea, select, [contenteditable]';"
  - What is wrong:
    - DeckForm's tag-tone field is `HueSelect` (DeckForm.svelte:88). It is a bits-ui Select drawn by FieldSelect.svelte:59-75 as a `<button class="select oculus-field">` with the trigger's role (bits-ui Select.Trigger). That is not in FIELDS, so a key on it is a key on a control and the deck's keys act.
    - bits-ui's closed trigger reads a letter as type-ahead and ArrowDown/ArrowUp as open (node_modules/bits-ui/dist/bits/select/select.svelte.js:650-664). It does not stop the event, and FieldSelect's `triggerKeys` (trigger-keys.ts) only filters modifier keys. The key then reaches the box's `keys`.
    - In round 0, `inControl` kept every key on any control, so this field kept its keys. Brief item 3 asks that a key typed in a field inside the Overview stays with the field. Round item 5 narrows "field" to FIELDS, which leaves this field out; its intent is that only a field needs every key.
    - The report's before and after for a key on a field and a key on a button does not name this field.
  - Failure scenario:
    - Open the Overview, press Edit, focus the tone field of a tag and type `o` to jump to orange (vocab.yml has c-orange, c-pink, c-purple). The grid closes (`write({ overview: !grid })`), the DeckForm unmounts and its unsaved work is lost.
    - Typing `p` for pink or purple starts the presenter screen, and `f` toggles full screen.
    - ArrowDown on the closed trigger opens its list and also moves the slide in force.
  - Fix within the ruling's intent: count a select trigger as a field, for example `[role="combobox"]` added to FIELDS, or the trigger's keys kept from the box. This is the orchestrator's call, since FIELDS is the ruling's text.
  - Verdict: item 3 partial.

### Declined to judge

- The look cases, which reading alone cannot settle:
  - C12's `inert` press.
  - C14's redraw in two panes.
  - The tiles' scaling (item 1).
  - Decision 4's opening time on the portfolio deck.
  - Which end of the hold, the push or the 3 s bound, ends C17 and the two-summaries case on a given run. The code takes the push only when it lands after the answer (`over = reads.files()` at arrange.svelte.ts:125); the order of the answer and the push is not fixed by the code.
- Whether a drag that starts on a title tile's title or on a placeholder drags the tile. Both are bits-ui menu triggers, which open the menu on pointerdown (node_modules/bits-ui/dist/bits/menu/menu.svelte.js:1428-1439). The rest of the tile drags. The look settles it.
- Whether Enter under the card cursor on a title tile opens its menu once. The shell clicks `.title button` (key-dom.ts:70) and bits-ui's trigger also handles Enter on keydown. The look settles it.
- The whole `test:quick` was not rerun. Four of the sixteen files the report lists as timed out pass alone at their tier's limit (above). The rules file's Verify section does not count a timeout in a file the step does not change against the step, and the list runs again at landing.

Reviewer usage: a4a02238582c1777c, claude-opus-5-5, 263945 tokens, 88 tool uses, 21 min 43 s.

## Closed

The findings of the run over the last round are not sent to the builder; each is closed at landing.

- Repair round 1, Behaviour 1 (a key on the tag-tone select reaches the deck's keys): fixed at landing, inside item 3 and round item 5's intent that a field keeps every key: `[role="combobox"]` added to `FIELDS` in `src/lib/views/academic/present/screen/keys.ts`, so a select trigger counts as a field, with the doc line over it naming it.
- Repair round 1, Standards 1 (doc comments of the hold): fixed at landing: the `busy` prop docs of `KeyForm.svelte:25`, `RuleForm.svelte:41` and `DeckForm.svelte:33`, and the sentence of `Overview.svelte:14-15`, rewritten to the hold as built (a write until its answer, and after a write that changed the file until the next push or the bound; a refusal or a failure holds nothing).
- Repair round 1, Proof 1 (the report reread the neighbouring HELP.md bullet): no change; the reviewer reads both bullets, `docs/HELP.md:333` and `:334`, as true, and no decision rests on it.
- First run, every finding: closed in round 1, as the round's verdicts above give them.
