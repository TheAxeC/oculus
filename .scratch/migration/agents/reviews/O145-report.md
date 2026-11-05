# O145 report: the deck arranged in the Overview and the Slides view retired

NOT done: `npm run test:quick`, run once after the last change, did not print `every command passed`. 45 tests in 16 files timed out in it, while the machine ran at a load average of 15 to 18 from other work (a `python3 -u paper.py` run at 100 % CPU and Microsoft Defender at 82 %, neither started by this step); no test failed an assertion. Each of the 16 files passes alone with the time limit its tier uses (quoted under DONE / NOT DONE). Items 1 to 8 of repair round 1 are done, item 4 as the coordinator ruled on its hand-back. Six paths outside the brief's lists were written, `src/lib/server/edit/writes/config/lists/deck/deck-files.ts` among them, which the coordinator accepted as part of item 2.

## Repair round 1

The rulings are `.scratch/migration/agents/briefs/O145-round-1.md`, items 1 to 8, and the coordinator's ruling on the hand-back of item 4 (go, build it as ruled; `heldBack` kept as built; `deck-files.ts` accepted as part of item 2).

How many times the verify list ran in this round:

- One `test:quick` run was stopped before it finished, because comments were edited after it started; its output was not used.
- One full run followed the changes of items 1 to 8 except item 4.
- One full run followed the item 4 change, the last change of the round; that run is the one quoted under DONE / NOT DONE.
- The four test files of check 3 ran three times after code changes. The first run, before the item 4 change, gave `Test Files 1 failed | 3 passed (4)`, `Tests 1 failed | 50 passed | 2 skipped (53)`, and that failing test's name was not kept. Which test failed then is not verified. The second run, before the item 4 change, passed whole. The third run, after it, passed whole (`Tests 51 passed | 2 skipped (53)`), so the failure did not recur.

### Item 1: a member deck's drag, and the entry drag from the heading's strip

Change:

- `arrange/Group.svelte:103-104` keeps where the pointer last went down in the group (`grabbed`, set by `onpointerdown` on `GroupHead`, `:136`).
- `headDrag` (`Group.svelte:111-120`) starts the entry drag only when that place is inside the section's own heading strip, `:scope > h3`; a drag that began anywhere else in the section is cancelled with `preventDefault`.
- `arrange.svelte.ts` `start` (`:289-290`) and `end` (`:299-300`) call `event.stopPropagation()`, so a tile's `dragstart` and `dragend` never reach the section. The tiles' `ondragend` (`Group.svelte:99`, the `Overview.svelte` placeholder) pass the event.
- The `ideas` group is headed at the grid's token (`block.token` is the grid entry's token, `arrange.ts` `overviewRuns`), and goes through the same `headDrag`: a drag from its strip carries `{ kind: 'entry', token: <grid token> }`, a drag of one of its title tiles carries the deck.

Before (round 0, `Group.svelte:115-118` as the review quotes it): a deck tile's `dragstart` bubbled to the section, whose `ondragstart` called `arrange.start` with the group's entry and overwrote `carried`, so a drop of a `pillars` deck on the `more` heading moved the `pillars` entry in `order:`. After, by reading: the tile's `start` stops the event at the tile, `carried` holds `{ kind: 'deck', group, name }`, and `dropOnGroup` gives the two-group write of C4 and the one-group write of C19; a drop on another deck of the same group goes through `dropOnDeck` and writes the group's `slides:`.

The HELP.md bullet the review named (`docs/HELP.md:333`, "Drag a tile, a placeholder or a group's heading to move its entry of the order; drop it on a group to put it before or after that group.") is true as it stands.

### Item 2: the entry's place in the file's list

Change:

- `DeckOrderEntry` (`src/lib/data/model/model-deck.ts:227-234`) carries `entry: number` (the entry's index in the YAML list, `index` of `OrderEntry` from `spec.ts:177`) and `findings: string[]`.
- `read.ts` `orderOfDeck` (`:521-545`) sets `entry: entry.index` and `findings` from `raised.filter((one) => one.file === doc.file && one.key === entry.at)`: only findings of the deck's own `present.yml` at that entry. `spec.ts` needed no change.
- `arrange.ts` `overviewRuns` (`:132`) reads `placed.get(entry.entry)`, and `slidesByEntry` (`:88-96`) keys by `source.entry`, the same index. Group blocks take their slides from the same lookup. `findingAt` is `findingOf(entry)` (`:112-115`), reading `entry.findings`.
- The same off-by-one was in two more places that look up `order:` by a slide's `source.entry`: `present.ts` `placedBy` (`:390-395`, now `deck.order.find((one) => one.entry === source.entry)`) and the server's `deck-files.ts`, on the edit and the delete of a slide (`entryAt`, `:166-168`, used at `:179` and `:324`; the base read `open.spec.order.at(source.entry)` at `O145-base/.../deck-files.ts:170,315`). The coordinator accepted the `deck-files.ts` change as part of item 2.

The tests that cover `deck-files.ts`: its importers are `deck-undo.ts`, `deck-new.ts`, `deck.ts` and `deck-acts.ts` in its own folder (`grep -rln "deck/deck-files\|from './deck-files\|deck-files.ts'" src`); no test names it (`grep -rln "deck-files" tests` prints nothing); the tests that send a `deck-edit` write (`grep -rl "deck-edit" tests`) are `tests/server/core/changes.test.ts`, `tests/server/edit/deck/deck-acts.test.ts`, `tests/server/edit/deck/deck-edit.test.ts` and `tests/routes/edit/apps/app-gate.test.ts`, and `tests/routes/edit/undo/undo.test.ts` undoes deck writes. Each run after the last change, with no tag filter, so their slow tests ran too:

- `npx vitest run tests/server/edit/deck/deck-acts.test.ts`: `Test Files 1 passed (1)`, `Tests 7 passed (7)`.
- `npx vitest run tests/routes/edit/apps/app-gate.test.ts`: `Test Files 1 passed (1)`, `Tests 22 passed (22)`.
- `npx vitest run tests/routes/edit/undo/undo.test.ts`: `Test Files 1 passed (1)`, `Tests 40 passed (40)`.
- `changes.test.ts` and `deck-edit.test.ts` in the run of check 3: `Test Files 4 passed (4)`, `Tests 51 passed | 2 skipped (53)`.

The case, `order: [title.md, 42, engine.md, closing.md]`, by reading:

- `spec.ts:177-185`: `42` is not a string and not a map, so it raises `findings.deck.order_shape` at `order[1]` and is skipped. `doc.spec.order` holds title (`index` 0), engine (`index` 2), closing (`index` 3).
- Slides carry `source.entry` 0, 2 and 3 (`read.ts` sets it from `entry.index`).
- Before (round 0, `arrange.ts:148-149` as the review quotes it: `for (const [at, entry] of deck.order.entries()) { const slides = placed.get(at) ?? [];`): place 1 (engine) looked up key 1, found nothing and drew a placeholder naming the `order[1]` finding of `42`; place 2 (closing) looked up key 2 and drew engine's slides.
- After: title looks up 0, engine 2, closing 3, each its own slides; `42` is in no `DeckOrderEntry`, so no tile is drawn for it, and no entry's `findings` holds its `order[1]` finding, since no kept entry has `at` `order[1]`.

### Item 3: the title tile's keyboard path

Change: `arrange/Tile.svelte:110` gives the Card the `heading` snippet `titleMenu` (`:122-124`) for a title tile (`row === null`): a `Menu` button labelled with the deck's plain title (`words`), holding the tile's items, which for a deck of a group are Move Earlier, Move Later and, for a named deck, Remove from Group (`Group.svelte` `deckMenu`, `:75-83`). The card cursor's Enter presses the card's title button, which is this menu button. Before: a title tile held no focusable control; its acts were reached only by a right-click. After: Tab reaches the title button, Enter opens the menu, and Move Later on an `ideas` member writes `ideas`'s `slides:` (the second half of C15).

### Item 4: the hold on the files deck

What I read in the deck store before the change:

- The deck store reads a deck through `queries.read` (`src/lib/state/life/present.svelte.ts:238-246`). A `files` message that names the deck's folder (`deckConcerned`, `:191-210`, `:199`), and any `portfolio` or `config` message, marks the deck's queries `'wait'` (`:212-235`), and the query fetches `/api/deck` again (`load`, `:248-253`).
- The query client is TanStack query-core, made in `src/lib/state/client/queries/queries.svelte.ts:46-51` with no `structuralSharing` option. query-core keeps the old data when a new answer is deep-equal to it: `replaceData` (`node_modules/@tanstack/query-core/build/modern/utils.js:171-183`) returns `replaceEqualDeep(prevData, data)` unless `structuralSharing` is `false`, and `query.js:87` stores what it returns. `queries.read` hands out `state.data` as the cache holds it (`queries.svelte.ts:205-214`).
- So a push brings a new `Deck` object exactly when its answer differs from the one held. A push whose answer is deep-equal keeps the same object.

The change, in `src/lib/views/academic/present/arrange/arrange.svelte.ts` and `arrange/Overview.svelte`:

- `listsSignature` is removed from `state/life/arrange.ts`, since the hold was its only reader (`grep -rn "listsSignature" src tests docs` printed only `arrange.ts:37`, `arrange.svelte.ts:29` and `:77` before, and prints nothing after).
- `Reads` gains `files` (`arrange.svelte.ts:50-51`), the deck as the server read it from its files. The Overview passes `files: () => (ref === null ? null : deckOf(ref).deck)` (`Overview.svelte:66`), the same query `Present.svelte:133-134` reads as `filesDeck`. The deck drawn from a source tab's unsaved text (`deck`) is still the deck an act's lists are made over, and the hold never reads it.
- `send` (`arrange.svelte.ts:110-129`): `sending` holds the controls from the write until its answer. After an answer that changed the file (`arrangeWrote`), it keeps the files deck held at that moment (`over = reads.files()`, `:125`), sets `waiting` (`:126`) and starts the bound, `setTimeout(release, HOLD_MS)` with `HOLD_MS = 3000` (`:76`, `:127`). A refusal or a failure returns at `:124` and holds nothing.
- The effect at `:93-96` releases the hold at the first files deck that is not `over`: `if (waiting && now !== over) release();`. `release` (`:88-91`) clears the bound and `waiting`. The effect at `:97` clears the bound when the Overview is torn down.
- `busy` (`:99-101`) is `sending || waiting`.

Which of the two ends the hold, by reading:

- **The item's case, two summaries of one group swapped by Move Later.** The write changes `present.yml`, so the watcher's `files` message names the deck's folder and the deck's query is fetched again (`present.svelte.ts:199`, `:231-232`). The new answer holds the two summaries in the other order, with their different titles in `order` and their slides swapped in `slides`, so it is not deep-equal to the held one, and `replaceEqualDeep` gives a new `Deck` object. The push ends the hold, at the effect of `arrange.svelte.ts:93-96`. The order's tokens read by place are the same before and after the swap (`spec.ts` `orderTokens`, `:56-69`), which is why the signature hold never released in this case; the object comparison does not read the tokens.
- **The portfolio deck's C17, Move Later twice quickly on a `pillars` deck.** The first write changes `pillars`'s `slides:` in `deck/present.yml`; the pushed answer has another `slides` list and another member order for `pillars`, so it is a new object, and the push ends the hold. The second Move Later is then made over the pushed lists.
- In both cases the 3 s bound ends the hold instead when no push comes, or when the deck fetched again lands before the write's answer: `over` is then already that new object, and no further one arrives. Which of the two orders happens on a given run is not verified; the server's answer and the watcher's push are independent.

Judgment call 4 as an unfixed hazard is ended by this change.

### Item 5: the key rule

Change in `Present.svelte` `keys` (`:347-362`):

```ts
const control = inControl(event.target);
const typed = inField(event.target) && (event.key !== 'Escape' || event.defaultPrevented);
const pressed = control && event.key === ' ';
if (!typed && !pressed && deckKey(event)) return;
```

- `inField` (`screen/keys.ts:23-25`) is `FIELDS` (`:20`, `input, textarea, select, [contenteditable]`).
- In a field every key is the field's. Escape is the field's when the field took it (`defaultPrevented`); a form that stops it (`KeyForm.svelte`) keeps it from reaching `keys` at all; otherwise Escape closes the grid.
- On any other control the deck's keys act, and Space on a control is the control's.
- `heldBack` (`screen/keys.ts:35-43`) returns false for any key in a field (`inField`, `:39`), the card cursor's keys over the grid, Enter on a control or on the card under the cursor, and Space on a control; every other key is held back from the shell in full screen. Its `control` argument is `inControl` (`Present.svelte:359`), a button or a link as well as a field, so a button or a link keeps Enter and Space in full screen as on the base (`O145-base/src/lib/views/academic/present/Present.svelte:350-352`), and a field keeps every key. This replaces the round's "own means the same field rule", as the round-1 ruling on it says.

The head comment's key paragraph (`Present.svelte:34-44`) and the comment over `keys` (`:349-350`) are rewritten to this rule. C16 holds by reading: `p` and `o` typed in Edit Rule's folder field give `typed` true and reach no deck key; Escape in it is taken by `KeyForm.svelte`, which closes the form, and the grid stays open; a second Escape, on the Edit Rule button, closes the grid.

Before and after of a key, for the look:

- In a field: in Edit Rule's folder field, press `p`. Base: the presenter screen starts. Round 0: the letter is typed. Now: the letter is typed.
- On a button: with the focus on the Overview's Edit button (or any button of the deck), press ArrowRight. Base: the next slide is the slide in force. Round 0: nothing. Now: the next slide is the slide in force. Press Space on that button: in all three trees it presses the button.

### Item 6: the rule sentence's words

The grep for a vocabulary helper, `grep -rn "function vocabChoices\|vocabChoices(" src` on the round-0 tree, gave two: `src/lib/state/forms/schema.ts:238` (module-local) and `src/lib/state/life/arrange.ts:470`. They differed only in that the schema's handles a vocabulary held as a list and a `field` source as well as a map; one function is kept.

Change: `schema.ts` `vocabChoices` (`:239-245`) is exported, and its doc names the Overview as a reader. `arrange.ts` has no vocabulary helper. `ruleSentence(keys, group, choices)` (`arrange.ts:472-496`) names each tier, stage, form and status word by `choices(list)`'s label, else by its id. The Overview's `choices` (`Overview.svelte:90-93`) calls `vocabChoices(engine ?? {}, vocab)`, and `Group.svelte:166` and `RuleForm.svelte` take it as `FindChoices` (`arrange.ts:463`).

The grep after the change gives the one definition and its two callers:

```
src/lib/state/forms/schema.ts:239:export function vocabChoices(config: Record<string, unknown>, name: string): Choice[] {
src/lib/state/forms/schema.ts:402:        return vocabChoices(config, target.slice(VOCAB_PREFIX.length));
src/lib/views/academic/present/arrange/Overview.svelte:89:        return vocabChoices(engine ?? {}, vocab);
```

(The Overview's call is at `:92` after the item 4 change.) Before: the sentence read stage ids, `nascent, scoping`. After: their labels, `nascent (concept)` and `scoping (lit-check and framing)` (`config/catalogs/vocab.yml:64-65`).

### Item 7: the exports

`arrange.ts:30` is `export type { DeckKeys };`, the one of the three re-exported types that files import from `arrange.ts`. `OverviewRun` (`arrange.ts:81`), `DeckDrop` (`:232`) and `ArrangePlace` (`acts/menu.ts:54`) are local types. The grep, `grep -rn "ArrangePlace\|OverviewRun\|DeckDrop" src tests`, before the item 4 change (its line numbers in `arrange.ts` are 17 lower after it, since `listsSignature` was removed above them):

```
src/lib/state/life/arrange.ts:98:type OverviewRun = { kind: 'entries'; entries: EntryBlock[] } | GroupBlock;
src/lib/state/life/arrange.ts:135:export function overviewRuns(deck: Deck): OverviewRun[] {
src/lib/state/life/arrange.ts:142:    const runs: OverviewRun[] = [];
src/lib/state/life/arrange.ts:249:type DeckDrop = { lists: GroupList[] } | { already: true } | null;
src/lib/state/life/arrange.ts:269:): DeckDrop {
src/lib/views/academic/present/acts/menu.ts:54:type ArrangePlace = {
src/lib/views/academic/present/acts/menu.ts:65:export function arrangeMenu(place: ArrangePlace): MenuItem[] {
src/lib/views/academic/present/acts/menu.ts:89:    place: ArrangePlace | null
```

The importers of `DeckKeys` from `arrange.ts`, from `grep -rn "from '\$lib/state/life/arrange'" -B8 src | grep -E "DeckGroup|DeckOrderEntry|DeckKeys"`: `arrange/arrange.svelte.ts:32`, `arrange/DeckForm.svelte:24`, `arrange/RuleForm.svelte:27`. No file imports `DeckGroup` or `DeckOrderEntry` from `arrange.ts`. `sh utils/unused-exports.sh` after the last change, compared with the base's list: `diff` prints nothing, exit 0.

### Item 8: the report

The history-word lines, the verify count, the comments list and the helper greps are below and above. Judgment call 9 is removed, since item 2 ended it (`DeckOrderEntry.entry`, `placedBy` and `entryAt` all look up by the file's index). Judgment call 4 is rewritten, since item 4 ended the hazard it named.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md` lines 165-167 in the worktree:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

The list holds no entry.

## The cases' first run (on the unchanged tree, before any change)

The first run was made in the worktree before the first edit of the step; each check was run again on the unchanged base copy `.agents/worktrees/O145-base` (which holds `src`, `tests`, `config` and `utils`, no `docs`), with the same output. No case or rule of the brief was found wrong.

| Case | Command or reading | Output on the unchanged tree |
|---|---|---|
| C1 | `grep -c "GroupHead\|doc.name\|startsWith" src/lib/views/academic/present/Overview.svelte`; read `Overview.svelte:35-62` | `0`; one `Card` per slide, no grouping, no header. The hub's `deck/present.yml` was not read (the hub is off-limits); its `order:` is taken from the brief. |
| C2, C3, C4, C5, C14, C15, C17, C19 | `grep -rn "draggable\|ondragstart\|ondrop\|writeDeckSlides" src/lib/views/academic/present` | one line, `Present.svelte:435: ondrop={acts.dropped}` (the image drop); no arranging write in the Present view. |
| C6 | `grep -rn "candidates" src/lib/views/academic/present` | nothing; the candidates were drawn only by the Slides view (`state/life/slides.ts:147-155`). |
| C7 | reading | not applicable: the Present view sends no arranging write. |
| C8 | `sed -n 437p src/lib/views/academic/present/Present.svelte` | `{#if rows.length === 0 \|\| deck === null}`: a deck with no slide draws `Empty`, never the Overview. |
| C9 | `grep -c "rule" config/text/views/academic/present.yml` | `0`; no rule sentence exists. |
| C10, C18 | `sed -n 250,252p src/lib/state/life/present.ts`, and the case-run program below | `return deck.title === '' ? deck.name : deck.title;` returns the markup as written and gives `deck.name` only for the empty string, so `<i></i>` gives `<i></i>`. |
| C11 | the grep of C11 | 114 lines over 27 files in the worktree at the first run (with `docs`); 104 lines over 22 files on the base copy, which has no `docs`. |
| C12 | `grep -n "Stage\|Slide\b\|inert" src/lib/views/academic/present/Overview.svelte` | only the type imports (`DeckSlide`, lines 12, 15, 22, 24): no tile draws its slide. |
| C13 | as C1 | no header, no rule, no Add tile. |
| C16 | `sed -n 304,320p src/lib/views/academic/present/Present.svelte` | `o` sets `overview: !grid` with `preventDefault` from any target; only Space checks `inControl`, so `p` and `o` typed in a field act on the deck. |

The case-run program for C10 and C18, written in the scratchpad (outside the worktree) and deleted before this report; `deckLabel` could not be imported under node (`present.ts` reaches `$state` in `generation.svelte.ts`, `ReferenceError: $state is not defined`), so it was read instead:

```ts
// Case-run program for O145 C10 and C18: prints plainText of the case titles; deckLabel is read.
const { plainText } = await import(`${process.argv[2]}/src/lib/data/prose/literature.ts`);
for (const title of [
    'Comparing tumors across patients with <i>no</i> template alignment',
    '&lt;i&gt;no&lt;/i&gt; template',
    '<i></i>'
]) {
    console.log(JSON.stringify({ title, plainText: plainText(title) }));
}
```

Run as `node plain.mts /Users/axelfaes/workspace/oculus/.agents/worktrees/O145-base`:

```
{"title":"Comparing tumors across patients with <i>no</i> template alignment","plainText":"Comparing tumors across patients with no template alignment"}
{"title":"&lt;i&gt;no&lt;/i&gt; template","plainText":"<i>no</i> template"}
{"title":"<i></i>","plainText":""}
```

After the change `deckLabel` is `deckWords(deck.title, deck.name)` (`state/life/present.ts`), which returns `plainText(title)` and `name` when that is empty, so C10 gives the title without the tags, an entity stays text, and C18's `<i></i>` gives the folder name.

## DONE / NOT DONE

| Check | State | Output |
|---|---|---|
| 1. `npm run diagrams && npm run docs:palette`, then `npm run test:quick`, once after the last change | NOT DONE (45 timeouts) | `git status --short docs`: `M docs/HELP.md`, the eight `docs/diagrams/{channels,layer-state,layer-views,layers}.{dot,svg}`, `M docs/palette.md`, `M docs/templates.md`. `test:quick: 53 changed file(s)`, `166 test file(s)`; `ok prettier (1.7 s)`, `ok ASCII gate (1.8 s)`, `ok svelte-kit sync (3.7 s)`, `ok svelte-check (17.5 s): ... COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok eslint (18.3 s)`; `FAILED vitest (392.0 s)`: `Test Files 11 failed \| 107 passed \| 34 skipped (152)`, `Tests 22 failed \| 1865 passed \| 482 skipped (2369)`; `FAILED vitest checks (471.8 s)`: `Test Files 1 failed \| 13 passed (14)`, `Tests 1 failed \| 173 passed \| 9 skipped (183)`; `FAILED vitest slow (595.2 s)`: `Test Files 4 failed \| 40 passed (44)`, `Tests 22 failed \| 460 passed \| 195 skipped (677)`; `test:quick: 599.1 s; failed: vitest, vitest checks, vitest slow`; exit 1. Each failure's error is `Test timed out in 5000ms.` (vitest), `Test timed out in 20000ms.` (vitest slow), or, for the one check, `transport invoke timed out after 60000ms` while vite loaded `src/lib/views/academic/career/Career.svelte` for `src/routes/views.ts`. During the run `uptime` gave `load averages: 15.33 18.64 15.13`, and `ps -Ao pid,pcpu,etime,command -r` gave `python3 -u paper.py` at 100.0 % and `wdavdaemon` at 82.0 %. The failing tests are listed below. |
| 1. each failing file alone, with its tier's time limit | DONE | below: every one passes |
| 2. the ASCII gate of the rules file over `src tests bin config` | DONE | prints only `find: bin: No such file or directory` (the tree has no `bin`); perl exit 0 |
| 2. `LC_ALL=C grep -n '[^ -~]'` over every changed and new file (`git diff --name-only` plus the untracked files of `src tests config docs`; the four `.svg` with `grep -c`) | DONE | nothing, exit 1; each `.svg` `0` |
| 3. the four test files | DONE | `npx vitest run tests/routes/edit/deck-slides.test.ts tests/server/core/changes.test.ts tests/server/edit/deck/deck-edit.test.ts tests/checks/config/config-folder.test.ts`: `Test Files 4 passed (4)`, `Tests 51 passed \| 2 skipped (53)`, 26.39 s |
| 3. `tests/checks/diagrams/palette.test.ts` | DONE | `npx vitest run tests/checks/diagrams/palette.test.ts --testTimeout 0 --hookTimeout 0` (the checks tier's flags, `tests/tiers/quick.mjs:284-285`): `Test Files 1 passed (1)`, `Tests 1 passed (1)`, 24.36 s |
| 3. the tests over `deck-files.ts` | DONE | under item 2 of "Repair round 1" |
| 4. C11's grep | DONE | prints nothing, exit 1 |
| 5. `wc -l` of every changed component and module | DONE | see "Files"; the largest are `Present.svelte` 520 (component, limit 520), `writes.svelte.ts` 870, `schema.ts` 638, `read.ts` 625 (modules, limit 880) |
| 5. `ls -A` of the folders | DONE | `present/` 10, `present/arrange/` 7, `state/life/` 10; before the item 4 change, which adds no file, also `views/academic/` 4, `state/forms/` 10, `data/sources/deck/` 10, `data/model/` 10, `writes/config/lists/deck/` 6 |
| 6. `sh utils/unused-exports.sh` against `O145-base/unused-exports.txt` | DONE | script exit 0; `diff` prints nothing, exit 0 |
| 7. no new test; the two tests' expected text | DONE | listed below |
| prettier, eslint and svelte-check | DONE | the `ok` lines of `test:quick` above; over the four files of the item 4 change also `npx prettier --check` (`All matched files use Prettier code style!`), `npx eslint` (exit 0), `npx svelte-check --threshold error` (`COMPLETED 4599 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`) |
| history words in the added or changed comment lines and test titles | DONE | below |

The failing tests of that run, as it printed them:

- vitest, `Test timed out in 5000ms.`:
  - `tests/data/hubs/workspace-projects.test.ts` > a folder of the workspace that holds a project manifest > "is the scan's one project, with no finding, when the scan reads its manifest, the folder named directly"; "... the folder named through a link"; "is a project when it holds the hub and a manifest at its top, and the hub's projects are each read once"; "is the second hub's project alone when that hub's scan reads its manifest".
  - `tests/data/snapshot/relation-shapes.test.ts` > the relation fields of a manifest > "knows a field the hub adds to its form, and gives the unknown-key finding where no hub adds it".
  - `tests/routes/files/project-files.test.ts` > the project-files route > "answers 404 for an id the hub does not hold".
  - `tests/state/shared/hub-words.test.ts` > the words of each hub's records > "draws each hub's leads and entries in its own colours in a workspace with no primary"; "draws each hub's cards in its own stage words and orders and labels the stages of the slices from the union".
  - `tests/data/sources/config/boards.test.ts` > the category rows of a hub that is not the primary > "gives the findings of a form word the hub does not hold, ...", "... of no categories, ...", "... of a row with no key, ...", "... of a row naming a stage word the hub adds, ...", "... of a key in two rows, ...", "... of a categories that is no list, each naming its settings file".
  - `tests/state/boards/board/board-new-project.test.ts` > New project on a board > "reads the stage written and the boards that offer it in the chosen hub's words".
  - `tests/state/sessions/source/website-store.test.ts` > the tip of Write the website > "names the paths the settings give: a path of website.files.cv and no command".
  - `tests/data/sources/config/layers/manifest-fields.test.ts` > the fields a hub adds to the project form > "reads the added key of that hub's manifest with no finding, and another hub's as unknown"; "words a row whose foreign_key names no collection, projects or vocab list and leaves it out (G128)"; "holds a foreign_key to the vocab lists of the hub's own values, and words one that names nothing (G128)".
  - `tests/server/accounts/connect/git/routes.test.ts` > a saved token no git host row names > "is listed whose row names no credential address with its login and Sign out, and Sign out deletes its file (G135)".
  - `tests/server/machine/runs/schedules/record.test.ts` > the run record > "refuses a rename or a drop while the lock stays taken, committing nothing".
  - `tests/server/machine/runs/schedules/run.test.ts` > runEntry > "starts what a schedule runs, or refuses it with its word".
- vitest checks, `transport invoke timed out after 60000ms`: `tests/checks/diagrams/palette.test.ts` > the palette page > "is what the palette gives now".
- vitest slow, `Test timed out in 20000ms.`:
  - `tests/routes/hubs/hub-writes.test.ts`: "refuses a paper saved to Literature naming no hub in a workspace of two hubs and no primary, asking which, and writes no byte (G8)"; "writes the project into 'the hub its root names, and no byte o...' (G8)"; "writes the project into 'the primary, for a write that names n...' (G8)"; "refuses a new project for a hub no workspace folder carries, and writes nothing (G8)"; "finds no record of the second hub for an entry"; "finds no record of the second hub for a manifest field".
  - `tests/routes/sessions/website.test.ts` > a press of Write the website that is refused > "names the key of a path of website.files that cannot be used, asks no approval and writes nothing:" with "the CV out of the folder", "the website's own file out of the folder", "an absolute path whose joined folder is in the website", "a path through a link in the folder that points out of it", "a file that is a link to a file out of the folder", "the website's own file and the CV on one file", "an empty path".
  - `tests/data/hubs/hub-portfolio.test.ts` > the portfolio of several hubs > "is the primary hub as it is built alone, each record under its hub and its key, when the workspace lists one hub"; "holds every record of both hubs, each under the name of its hub's folder"; "names a record of the second hub in a relation pair only by ids of the second hub".
  - `tests/data/hubs/self.test.ts` > the user the key self names > "(case 1)", "(case 2)", "(case 27)", "(case 3)", "(case 4)", "(case 5)" (the full titles start "marks the primary person of the key", "marks the person of the one other hub", "names another hub's person as the portfolio chat's user", "marks the primary's person of a key another hub holds too", "marks nobody for a key two other hubs hold", "marks nobody for a key no hub holds").

Each failing file alone, after the run, with its tier's time limit (`tests/tiers/quick.mjs:268-286`: the unit tier `--tagsFilter '!slow'` at vitest's 5000 ms default, the slow tier `--tagsFilter slow --testTimeout 20000`, the checks tier `--testTimeout 0 --hookTimeout 0`); every run exit 0:

| File | Tier flags | Result |
|---|---|---|
| `tests/data/hubs/workspace-projects.test.ts` | `--tagsFilter '!slow'` | `Tests 5 passed (5)`, 5.56 s |
| `tests/data/snapshot/relation-shapes.test.ts` | `--tagsFilter '!slow'` | `Tests 12 passed (12)`, 2.22 s |
| `tests/routes/files/project-files.test.ts` | `--tagsFilter '!slow'` | `Tests 1 passed (1)`, 2.87 s |
| `tests/state/shared/hub-words.test.ts` | `--tagsFilter '!slow'` | `Tests 4 passed (4)`, 3.15 s |
| `tests/data/sources/config/boards.test.ts` | `--tagsFilter '!slow'` | `Tests 39 passed (39)`, 3.42 s |
| `tests/state/boards/board/board-new-project.test.ts` | `--tagsFilter '!slow'` | `Tests 31 passed (31)`, 3.27 s |
| `tests/state/sessions/source/website-store.test.ts` | `--tagsFilter '!slow'` | `Tests 7 passed (7)`, 2.90 s |
| `tests/data/sources/config/layers/manifest-fields.test.ts` | `--tagsFilter '!slow'` | `Tests 6 passed (6)`, 3.61 s |
| `tests/server/accounts/connect/git/routes.test.ts` | `--tagsFilter '!slow'` | `Tests 9 passed (9)`, 1.86 s |
| `tests/server/machine/runs/schedules/record.test.ts` | `--tagsFilter '!slow'` | `Tests 2 passed (2)`, 1.67 s |
| `tests/server/machine/runs/schedules/run.test.ts` | `--tagsFilter '!slow'` | `Tests 1 passed (1)`, 4.22 s |
| `tests/routes/hubs/hub-writes.test.ts` | `--tagsFilter slow --testTimeout 20000` | `Tests 47 passed (47)`, 53.59 s |
| `tests/routes/sessions/website.test.ts` | `--tagsFilter slow --testTimeout 20000` | `Tests 20 passed (20)`, 26.90 s |
| `tests/data/hubs/hub-portfolio.test.ts` | `--tagsFilter slow --testTimeout 20000` | `Tests 16 passed (16)`, 49.93 s |
| `tests/data/hubs/self.test.ts` | `--tagsFilter slow --testTimeout 20000` | `Tests 17 passed (17)`, 29.36 s |
| `tests/checks/diagrams/palette.test.ts` | `--testTimeout 0 --hookTimeout 0` | `Tests 1 passed (1)`, 24.36 s |

The unit runs alone do not pass `--no-isolate`, which the unit tier adds; they keep its time limit.

The two tests whose expected text changed, and nothing else in them:

- `tests/checks/config/config-folder.test.ts:303`: before, the list held `'views/academic/slides.yml',`; after, that line is gone.
- `tests/routes/edit/deck-slides.test.ts:297`: title before `refuses a key the view does not set, a value the key does not take, a base the file does not hold, and a group it does not have`; after `refuses a key the Overview does not set, a value ...` (the rest unchanged).
- `tests/routes/edit/deck-slides.test.ts:301`: row before `'a key the view does not set'`; after `'a key the Overview does not set'`.
- `tests/routes/edit/deck-slides.test.ts:303`: reason before `'deck.author is not a key the Slides view sets'`; after `"deck.author is not a key the Present view's Overview sets"`, the new text of `config/text/server.yml:147`.

## History words, as the tree has them now

The grep, after the last change: `git diff -U0 -- src tests config docs/HELP.md docs/templates.md | grep '^+' | grep -niE "\b(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands)\b"`, and `grep -nE "\b(before|used to|no longer|still|always has been|always had|as before|previously)\b"` over the new files `src/lib/state/life/arrange.ts` and `src/lib/views/academic/present/arrange/*`. The diff of the tracked `src`, `tests` and `config` files gives no hit. The hits:

- `docs/HELP.md:266` "A saved page that names a view oculus no longer has": the base's sentence, unchanged except for `slides` taken out of the list; it says what a saved layout naming a removed view does. Kept.
- `docs/HELP.md:333` "put it before or after that group": a place in the order. Kept.
- `src/lib/state/life/arrange.ts:86` "the entry of the slide before it", `:161` `'before' | 'after'`, `:284` "The decks before the moved one's new place": places in a list. Kept.
- `src/lib/views/academic/present/arrange/arrange.svelte.ts:63` "a drop before it from one after it", `:72` `'before'`, `:313` "an entry goes before or after the entry": places in a list. Kept.
- `src/lib/views/academic/present/arrange/Group.svelte:11` "goes before or after the entry the group is headed at": a place in a list. Kept.
- `src/lib/views/academic/present/arrange/KeyForm.svelte:9`, `:11`, `:55`, `:63` ("closes the form ... before the key reaches the deck", "before the field sees the key"): the order of two events. Kept.

Lines of the base that the step did not change and that hold one of the words: `present.ts:191` "no longer read", `:428` "before it writes", `:559` "still paused when not"; `read.ts:447,474` (`const before`); `deck-files.ts:9,104,109,116,314`; `schema.ts:99,185,427`.

## Comments and docs on the changed behaviour

Rewritten in this round:

- `Present.svelte` head comment, key paragraph (`:34-44`), and the comment over `keys` (`:349-350`).
- `screen/keys.ts` head comment (`:1-5`), `FIELDS` and `inField` (`:19-25`), `heldBack` (`:27-34`).
- `arrange/Tile.svelte` head comment (`:2-13`) and the comment over `titleMenu` (`:121`).
- `arrange/Group.svelte` head comment (`:2-16`), `grabbed` (`:103`), `headDrag` (`:106-110`).
- `arrange/arrange.svelte.ts` head comment, the paragraph on the hold (`:10-16`); the docs of `Reads.deck` and `Reads.files` (`:48-51`), `HOLD_MS` (`:75`), `waiting` and `over` (`:80-83`); `start`'s doc comment.
- `arrange/Overview.svelte` head comment, the sentence on the hold (`:14-17`); `engine` and `choices` (`:85-93`).
- `arrange/KeyForm.svelte` head comment, the sentence on when Apply is held (`:5-7`).
- `state/life/arrange.ts` `slidesByEntry` (`:83-87`), `findingOf` (`:108-111`), `FindChoices` (`:462`), `ruleSentence` (`:465-471`).
- `model-deck.ts` `DeckSlideSource` (`:105-112`) and `DeckOrderEntry` (`:216-226`).
- `read.ts` `orderOfDeck` (`:516-520`).
- `deck-files.ts` `entryAt` (`:160-165`).
- `present.ts` `placedBy`'s doc comment.
- `schema.ts` `vocabChoices` (`:231-237`).

True as it stands:

- `docs/HELP.md:331-339`, the Present paragraph and its eight bullets: the drag of a group's heading, a deck's drag within and across groups, Move Earlier and Move Later from the keyboard (now on a title tile too), and the title tile. It does not describe the hold.
- `docs/HELP.md:199-200`, the key table rows for Present (`F / P / O`, `Space / Shift+Space`).
- `state/life/arrange.ts` head comment.

## The greps made before each added helper or type

Over the base copy, `grep -rnw "deckWords\|heldBack\|createOpener\|createKeyWork\|TileView\|inField\|FindChoices\|entryAt\|findingOf" O145-base/src O145-base/tests`:

- `deckWords`, `createOpener`, `createKeyWork`, `TileView`, `inField`, `FindChoices`: no hit.
- `heldBack`: `src/lib/server/machine/lsp/adapters/yaml/hub-keys.ts:204` (`function heldBack(hit: Hit, graph: Graph, view: PageView): Refusal | null`, module-local, a rename refusal) and `machine.heldBack()` (`server/root/context.ts:169,775,810`, `server/root/process/context/machine.ts:8,59,113`, the held config keys): other concerns of the same name, none about keys.
- `entryAt`: `state/sessions/source/draft-entry.ts:13,152` and `data/helpers/files/yaml/collection-text.ts:454` (the line and column of an entry in a YAML text), `state/boards/focus/filter.ts:547` (module-local), `tests/routes/machine/cpp.test.ts:68` (test-local): none looks up an `OrderEntry` by its index. The new `entryAt` is module-local in `deck-files.ts`.
- `findingOf`: `tests/server/root/watch/website-watch.test.ts:82`, test-local. The new `findingOf` is module-local in `arrange.ts`.

For the item 4 change, which adds the module-local `HOLD_MS` and `release` in `arrange.svelte.ts` and no exported name: `grep -rn "structuralSharing\|setTimeout(release" O145-base/src` prints nothing (exit 1), so the base has no hold of this kind to reuse; in the worktree it prints only `arrange.svelte.ts:127`.

Greps for the same purpose under another name, on the base copy:

- A form handing the focus back to its control (`createOpener`): `grep -rn "querySelector('button')?.focus()"` gives only `views/boards/focus/FocusFilter.svelte:159`, inline in that component.
- The key form's work (`createKeyWork`): `grep -rln "keyShown\|withKey("` gives `server/edit/writes/apps/host-store.ts`, `state/life/slides.ts` and `views/academic/slides/Slides.svelte`; the last two are the retired Slides view, and host-store is the app store's server write.
- Plain words of a title (`deckWords`): `grep -rn "export function plainText"` gives `data/prose/literature.ts:24`, which `deckWords` calls, and `views/system/workbench/settings/said.ts:15`, a value's text.
- A key typed in a field (`inField`): `grep -rn "function typingIn"` gives `shell/keys/workbench-keys.svelte.ts:584`, a shell module whose rule also takes the code editor; the round names `FIELDS`, so `inField` reads it.
- The rule's vocabulary words (`FindChoices`): the `vocabChoices` grep under item 6.

## Files, from `diff -rq` against the base copy

`diff -rq --exclude=local.yml` of `src`, `tests`, `config` and `utils` against `.agents/worktrees/O145-base` (`utils` gives no difference); `docs` from `git status --short docs`, since the base copy has no `docs`. Line counts are from `wc -l`, base then now.

| File | Lines |
|---|---|
| `src/lib/state/life/arrange.ts` (new) | 514 |
| `src/lib/views/academic/present/arrange/Overview.svelte` (moved from `present/Overview.svelte`, 94) | 249 |
| `src/lib/views/academic/present/arrange/Group.svelte` (new) | 245 |
| `src/lib/views/academic/present/arrange/RuleForm.svelte` (new) | 167 |
| `src/lib/views/academic/present/arrange/DeckForm.svelte` (new) | 142 |
| `src/lib/views/academic/present/arrange/KeyForm.svelte` (new) | 99 |
| `src/lib/views/academic/present/arrange/Tile.svelte` (new) | 163 |
| `src/lib/views/academic/present/arrange/arrange.svelte.ts` (new) | 387 |
| `src/lib/views/academic/present/Present.svelte` | 518 to 520 |
| `src/lib/views/academic/present/Bar.svelte` | 111 to 108 |
| `src/lib/views/academic/present/acts/menu.ts` | 36 to 93 |
| `src/lib/views/academic/present/screen/keys.ts` (outside the first list) | 57 to 87 |
| `src/lib/state/life/present.ts` | 562 to 582 |
| `src/lib/state/forms/schema.ts` (item 6) | 637 to 638 |
| `src/lib/ui/controls/heads/GroupHead.svelte` (beyond lines 63-67) | 264 to 274 |
| `src/lib/views/shared/card/pane-fold.ts` line 14 (outside the first list) | 55 to 55 |
| `src/lib/views/system/history/History.svelte` (comment) | 492 to 492 |
| `src/lib/data/model/model-deck.ts` (item 2) | 267 to 276 |
| `src/lib/data/sources/deck/read.ts` (item 2) | 612 to 625 |
| `src/lib/data/sources/deck/spec.ts` (comments) | 223 to 223 |
| `src/lib/server/edit/deck-edit.ts` (comments) | 249 to 249 |
| `src/lib/server/edit/writes/bodies.ts` (comment) | 777 to 778 |
| `src/lib/server/edit/writes/config/lists/deck/deck-files.ts` (item 2, outside the widened list) | 455 to 464 |
| `src/lib/server/edit/writes/config/lists/deck/deck-keys.ts` (comments) | 118 to 118 |
| `src/lib/server/edit/writes/config/lists/deck/deck.ts` (comments) | 299 to 299 |
| `src/lib/state/client/writes.svelte.ts` (comment) | 870 to 870 |
| `src/lib/views/academic/slides/` (deleted: `Slides.svelte` 513, `Order.svelte` 146, `Keys.svelte` 149, `GroupKeys.svelte` 157, `Steps.svelte` 68) | 1033 to 0 |
| `src/lib/state/life/slides.ts` (deleted) | 401 to 0 |
| `config/text/views/academic/slides.yml` (deleted) | 73 to 0 |
| `config/text/views/academic/present.yml` | 82 to 148 |
| `config/text/server.yml` line 147 | 634 to 634 |
| `config/catalogs/glyphs.yml` (outside the first list) | 280 to 279 |
| `config/catalogs/icons.yml` (outside the first list) | 279 to 278 |
| `tests/checks/config/config-folder.test.ts` line 303 | 850 to 849 |
| `tests/routes/edit/deck-slides.test.ts` lines 297-303 | 335 to 335 |
| `docs/HELP.md` lines 266 and 331-339 | changed |
| `docs/templates.md` line 30 | changed |
| `docs/palette.md` (regenerated) | the `\| Slides \| slides \|` row gone |
| `docs/diagrams/channels`, `layer-state`, `layer-views`, `layers` `.dot` and `.svg` (regenerated) | changed |

Every edit was made with the Edit and Write tools, and the project's formatter, `npx prettier --write`, was run over the files of the step it reformats (`present/arrange/`, `state/life/arrange.ts`, `state/life/present.ts`, `data/sources/deck/read.ts`); the rules file may count that run as a script.

`src/lib/views/academic/present/acts/acts.svelte.ts`, on the path list, needed no change: the Overview takes `acts.act` and `acts.say` as they are.

## Judgment calls the brief left open

1. **Headers that do not fold.** `GroupHead.svelte` always drew its fold control and required `open` and `ontoggle`. It now takes both as optional: a group given no `ontoggle` draws no fold control and its body is open. Every other caller passes both and draws as on the base; the Overview's groups pass neither.
2. **Keys on a control.** The rule of item 5 of repair round 1: a field keeps every key, Escape too when it or its form took it; on a button or a link the deck's keys act and Space presses the control. The full-screen rule is in `heldBack` (`screen/keys.ts`), with its `control` argument a button or a link as well as a field, so Enter and Space on a full-screen button press it, as the round-1 ruling keeps it.
3. **Move Earlier and Move Later on a member deck** step the deck among the decks its group draws (named and found). The step names, in `slides:`, every found deck up to the new place and keeps a missing name in its slot (`deckStepped`); a drag dropped among the found decks names the deck at the end of `slides:`, as item 4 of the brief says.
4. **The busy hold.** From a write until its answer, and after an answer that changed the file until the first new files deck object or 3 s after the answer, every arranging control is held (`arrange.svelte.ts:88-101,124-127`). The bound is the only end when the deck fetched again lands before the write's answer, or when no push comes; an act made in that window over a deck the push has not yet reached is refused whole by the server, with nothing written, and the status line says why.
5. **The keyboard path to the arranging acts.** A heading's Move Earlier and Move Later are in its context menu, reached with Shift+F10 on its Edit Rule button. A placeholder tile is a menu button: Enter opens its menu (Move Earlier, Move Later). A title tile's title is a menu button holding Move Earlier, Move Later and, for a named deck, Remove from Group.
6. **The rule sentence** joins its parts with `present.rule_comma` and `present.rule_and`; each tier, stage, form and status word is its vocabulary label (`nascent (concept)`), or its id when the vocabulary has no label.
7. **A form closes only on a successful Apply.** A refused or failed Apply leaves the form open with the reader's work and the status line saying why.
8. **Escape in a form's fields.** The two forms share one frame, `arrange/KeyForm.svelte`, with Apply, Cancel and the Escape rule. MultiSelect calls `preventDefault` on every Escape (`MultiSelect.svelte:154-159`, clearing its filter text), so the frame also listens in the capture phase: Escape in an input whose value is empty closes the form before the field sees it. In a MultiSelect with text typed, the first Escape clears the text and the second closes the form; in every other field or button one Escape closes it. MultiSelect itself is unchanged, since the workbench restores a maximized pane on an Escape nothing prevented (`shell/keys/workbench-keys.svelte.ts:194-201`), and changing the primitive would change that in every form that draws one.
9. **Ids of title tiles** carry the group, the entry's place, the deck's place in the group and its name, so two found decks with one folder name give two cards.
10. **Shared parts of the Overview.** The work a form does on the keys (`createKeyWork`) and a form opened under its control, which gives the keyboard back to that control on closing (`createOpener`), are in `arrange.svelte.ts`; what every tile reads (the deck, a slide's place, the slide in force, the card cursor, the press) is one `TileView` (`state/life/arrange.ts`) that the Overview passes to its groups, so a slide tile is drawn by one call in both places. `tests/checks/tree/duplication.test.ts` asks for this.

## User-visible changes, for the look

Every case below is in the Present view on a scratch copy of the hub, the deck open, `O` pressed for the Overview.

- **C1.** Before: one card per slide in a flat grid, no headers. After: the deck's title and an Edit button on top; then tiles that draw their slides small, in `order:`: `title.md`, `engine.md`; the `pillars` header (count 7) and its decks' slides; the summary of pillars; `transition.md`; the `more` header and its decks' slides with `ecg-readable-substrate` and `hccnet-fl` among them; the summary of more; the grid slide, then the `ideas` header with one title tile per deck; `closing.md`. Each group ends in an Add tile; under each header one rule sentence, its words by their labels.
- **C2.** Drag the `engine.md` tile onto the right half of the summary-of-pillars tile. After: the request (network panel) is one `deck-slides` write with `order.entries` holding `engine.md` after the summary's token, `order.base` the old order, `groups: []`; the Overview redraws with `engine.md` after the summary; History lists it.
- **C3.** Right-click the first `pillars` deck's tile, Move Later. After: one write of `pillars`'s `slides:` with the first two swapped, base the old list.
- **C4.** Drag a `pillars` deck's tile onto the `more` header. After: one write holding both groups, the deck gone from `pillars` and last in `more`; `order:` is not written.
- **The heading's drag.** Drag the `pillars` heading by its strip onto the right half of the `transition.md` tile: one write of `order:` with `slides:pillars` after it. Press on the rule sentence or on the space between tiles and drag: nothing moves.
- **C5.** Right-click a named `pillars` deck: Remove from Group is offered and writes `pillars` without it. A `more` deck found by discovery: no Remove from Group item.
- **C6.** The Add tile of `pillars`: a menu of its candidates by plain title; pick one and it is added at the end. A group with no candidates: the tile reads "No deck to add; the rule finds none the group does not hold" and opens nothing.
- **C7.** Change `present.yml` on disk after the Overview drew it, then Move Later. After: the status line shows the server's sentence, the file is unchanged, the Overview draws the file as it now is.
- **C8.** A `present.yml` that does not parse: `Empty` with the read's finding, no tile, no control, no request. A deck with one group, no deck in it and no slide: the Overview with that group's header (count 0), its rule sentence and its Add tile (before: `Empty`).
- **A malformed entry.** A deck whose `order:` is `[title.md, 42, engine.md, closing.md]`: three tiles, title, engine and closing, each with its own slides; no tile for `42`.
- **C12.** A slide with a link drawn in a tile: a press on the link shows that slide and closes the grid; the link does not open and takes no focus (Tab never stops inside the tile's slide).
- **C13.** An empty group with no `find`: header, "Shows the project decks it names.", Add tile.
- **C14.** The deck in two panes, both on the Overview; a move in one is drawn in both after the push.
- **C15.** An `order:` entry `{ slides: nosuch }`: a dashed placeholder tile reading `nosuch: ` and the reader's finding (`order_group_unknown`); Enter on it opens Move Earlier and Move Later, and Move Later moves it. Tab to an `ideas` title tile's title, Enter: its menu with Move Earlier, Move Later and Remove from Group; Move Later writes `ideas`'s `slides:` with the two swapped.
- **C16.** Edit Rule, then type `projects/*/*/present` in the folder field: the text is in the field, the grid stays open, the presenter screen does not start (before: `p` started it and `o` closed the grid). Escape in the field closes the form and the grid stays open; a second Escape closes the grid.
- **A key on a button.** With the focus on the Overview's Edit button, ArrowRight makes the next slide the slide in force (its tile takes the hairline) and `o` closes the grid; Space presses the button.
- **C17.** Press Move Later twice quickly on a `pillars` deck: after the first, the menu's items and the drags are disabled until the deck is pushed again (at most 3 s after the answer); both moves land and the status line shows no refusal.
- **Two summaries of one group.** A deck with two summaries of one group with different titles: Move Later on the first summary writes the swap, and the arranging controls are free again once the deck is pushed, or 3 s after the answer at the latest (round 0: they stayed disabled until the pane was reopened).
- **C18.** A deck titled `<i></i>`: the deck menu, the tab title and the Overview's title read its folder name. The Add tile of a group whose candidates include `ward-bttr-crosssubject` lists "Teaching a brain-computer interface from other people's brains", with no tags.
- **C19.** Drag a deck found by discovery in `more` onto the `pillars` header: one write of `pillars`'s `slides:` with it added; `more`'s list unchanged.
- **The Present toolbar** has no Slides button; a saved layout with a `slides` tab shows it as an unknown view.

## Anything in the brief that was wrong or impossible

The brief says "The step writes these paths and nothing else". Six paths outside the lists were needed:

- `src/lib/views/academic/present/screen/keys.ts`: with the key rule in place, `Present.svelte` was over the 520 limit; the full-screen key rule moved into `heldBack` here, and `inField` sits beside `FIELDS`.
- `src/lib/ui/controls/heads/GroupHead.svelte` beyond lines 63-67: the base requires `open` and `ontoggle` and always draws `FoldControl` (`O145-base/.../GroupHead.svelte:90-91,158-161`), so a header that does not fold (item 4 of the brief, decision 6) cannot be drawn with it unchanged.
- `config/catalogs/glyphs.yml` and `config/catalogs/icons.yml`: the glyph `section` was read only by `views.slides_glyph` of the deleted `slides.yml`; with it gone, `tests/checks/config/config-folder.test.ts` failed with "names a glyph only where the source or another config file reads it" (`expected [ 'section' ] to deeply equal []`). The `section` row is removed from both.
- `src/lib/views/shared/card/pane-fold.ts:14`: its head comment listed "Slides" among the views that fold through `stateFolds`; the brief's greps miss it. "Slides, " is taken out.
- `src/lib/server/edit/writes/config/lists/deck/deck-files.ts`: it looked up a slide's `order:` entry by `source.entry` as a place among the kept entries (`O145-base/.../deck-files.ts:170,315`), the defect item 2 ends in the Overview, on the server's edit and delete of a slide; it now finds the entry by its index in the file (`entryAt`, `:166-168`). The coordinator accepted it as part of item 2.

`tests/checks/diagrams/palette.test.ts` times out at vitest's default 5000 ms when run as check 3 writes it; the checks tier runs it with `--testTimeout 0 --hookTimeout 0`, and it passes with those flags.
