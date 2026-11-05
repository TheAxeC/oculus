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
