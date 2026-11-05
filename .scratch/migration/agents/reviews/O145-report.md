# O145 report: the deck arranged in the Overview and the Slides view retired

NOT done: `npm run test:quick` did not print `every command passed`. Its one red line is a 5000 ms timeout in `tests/routes/git/zenodo.test.ts` ("keeps the shipped auth and time limit under a hub that lays only the address"); that file passes alone (`npx vitest run tests/routes/git/zenodo.test.ts`: 51 passed, 26.56 s). Every other item of the brief is done. Five paths outside the brief's path list were written, each needed by an item of the brief (listed under "Anything in the brief that was wrong or impossible"). One hazard is unfixed and named under the judgment calls: after a write that changed the file, the arranging controls stay held until a push of the deck arrives, so with no push they stay held.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md` lines 165-167 in the worktree:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

The list holds no entry.

## The cases' first run (on the unchanged tree, before any change)

The first run was made in the worktree before the first edit; each check was run again on the unchanged base copy `.agents/worktrees/O145-base` (which holds `src`, `tests`, `config` and `utils`, no `docs`) for this report, with the same output. No case or rule of the brief was found wrong, so nothing was handed back.

| Case | Command or reading | Output on the unchanged tree |
|---|---|---|
| C1 | `grep -c "GroupHead\|doc.name\|startsWith" src/lib/views/academic/present/Overview.svelte`; read `Overview.svelte:35-62` | `0`; one `Card` per slide, no grouping, no header. The hub's `deck/present.yml` was not read (the hub is off-limits); its `order:` is taken from the brief. |
| C2, C3, C4, C5, C14, C15, C17, C19 | `grep -rn "draggable\|ondragstart\|ondrop\|writeDeckSlides" src/lib/views/academic/present` | one line, `Present.svelte:435: ondrop={acts.dropped}` (the image drop); no arranging write in the Present view. |
| C6 | `grep -rn "candidates" src/lib/views/academic/present` | nothing; the candidates were drawn only by the Slides view (`state/life/slides.ts:147-155`). |
| C7 | reading | not applicable: the Present view sends no arranging write. |
| C8 | `sed -n 437p src/lib/views/academic/present/Present.svelte` | `{#if rows.length === 0 \|\| deck === null}`: a deck with no slide draws `Empty`, never the Overview. |
| C9 | `grep -c "rule" config/text/views/academic/present.yml` | `0`; no rule sentence exists. The stage words were checked as vocabulary ids in `config/catalogs/vocab.yml`. |
| C10, C18 | `sed -n 250,252p src/lib/state/life/present.ts`, and the case-run program below | `return deck.title === '' ? deck.name : deck.title;` returns the markup as written and gives `deck.name` only for the empty string, so `<i></i>` gives `<i></i>`. |
| C11 | the grep of C11 | 114 lines over 27 files in the worktree at the first run (with `docs`); 104 lines over 22 files on the base copy, which has no `docs`. |
| C12 | `grep -n "Stage\|Slide\b\|inert" src/lib/views/academic/present/Overview.svelte` | only the type imports (`DeckSlide`, lines 12, 15, 22, 24): no tile draws its slide. |
| C13 | as C1 | no header, no rule, no Add tile. |
| C16 | `sed -n 304,320p src/lib/views/academic/present/Present.svelte` | `o` sets `overview: !grid` with `preventDefault` from any target; only Space checks `inControl`, so `p` and `o` typed in a field would act on the deck. |

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
| 1. `npm run diagrams && npm run docs:palette`, then `npm run test:quick` | NOT DONE (one timeout) | the diagrams and the palette regenerated (`docs/palette.md` and the eight diagram files changed, `git status --short docs`). `test:quick`: `50 changed file(s)`, `163 test file(s)`; `ok prettier`, `ok ASCII gate`, `ok svelte-kit sync`, `ok eslint (20.0 s)`, `ok svelte-check (23.6 s): ... 581 FILES 0 ERRORS 0 WARNINGS`, `FAILED vitest (169.5 s)` with `Test Files 1 failed \| 114 passed \| 34 skipped (149)`, `Tests 1 failed \| 1831 passed \| 482 skipped (2314)`, the failure `tests/routes/git/zenodo.test.ts > the Zenodo token > keeps the shipped auth and time limit under a hub that lays only the address: Error: Test timed out in 5000ms.`; `ok vitest checks (186.6 s)`, `ok vitest slow (250.2 s)`; `test:quick: 253.9 s; failed: vitest`. The file alone: 51 passed in 26.56 s. The test reads the shipped config (`loadConfig(engineDir())`) and touches no file of the step; the step changes the config only by the `present.yml` keys and the `section` glyph. |
| 2. ASCII gate of spec.md over `src tests bin config` | DONE | prints nothing but `find: bin: No such file or directory` (the tree has no `bin`); perl exit 0 |
| 2. `LC_ALL=C grep -n '[^ -~]'` over every touched file (the four `.svg` with `grep -c`) | DONE | nothing, exit 1; the `.svg` counts `0` each |
| 3. the five test files | DONE | the first four in one run: `Test Files 4 passed (4)`, `Tests 51 passed \| 2 skipped (53)`; `tests/checks/diagrams/palette.test.ts` with `--testTimeout 0` (as `package.json:16` runs the tree checks): `Test Files 1 passed (1)`, `Tests 1 passed (1)`. `tests/checks/tree/duplication.test.ts` and `tests/checks/source/comment-width.test.ts` also: `Test Files 2 passed (2)`, `Tests 20 passed (20)` |
| 4. C11's grep | DONE | prints nothing, exit 1 |
| 5. `wc -l` of every changed component and module | DONE | see "Files"; the largest are `Present.svelte` 515, `arrange.ts` 533 (module, limit 880), `writes.svelte.ts` 870 |
| 5. `ls -A` of the folders | DONE | `present/` 10, `present/arrange/` 7, `state/life/` 10, `views/academic/` 4 |
| 6. `sh utils/unused-exports.sh` against `O145-base/unused-exports.txt` | DONE | `diff` prints nothing, exit 0: the step adds no line (`withMove`, `landing` and `withCross`, which only `arrange.ts` calls, are module functions, not exports) |
| 7. no new test; the two tests' expected text | DONE | listed below |
| `npx prettier --check` and `npx eslint` over every touched source file | DONE | `All matched files use Prettier code style!`, eslint prints nothing |
| `npx svelte-check --threshold error` | DONE | `COMPLETED 4599 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| History words in the added or changed comment lines and test titles | DONE | below |

The two tests whose expected text changed, and nothing else in them:

- `tests/checks/config/config-folder.test.ts:303`: before, the list held `'views/academic/slides.yml',`; after, that line is gone.
- `tests/routes/edit/deck-slides.test.ts:297`: title before `refuses a key the view does not set, a value the key does not take, a base the file does not hold, and a group it does not have`; after `refuses a key the Overview does not set, a value ...` (the rest unchanged).
- `tests/routes/edit/deck-slides.test.ts:301`: row before `'a key the view does not set'`; after `'a key the Overview does not set'`.
- `tests/routes/edit/deck-slides.test.ts:303`: reason before `'deck.author is not a key the Slides view sets'`; after `"deck.author is not a key the Present view's Overview sets"`, the new text of `config/text/server.yml:147`.

The history-word grep: `git diff -U0 -- src tests config docs/HELP.md docs/templates.md | grep '^+' | grep -niE "\b(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands)\b"`, and the same words over the new files `state/life/arrange.ts` and `present/arrange/*`. Its hits after the rewording:

- `docs/HELP.md:266` "A saved page that names a view oculus no longer has": the sentence is the base's, unchanged except for `slides` taken out of the list; it describes what a saved layout naming a removed view does, which item 6 of the brief cites. Kept.
- `docs/HELP.md` bullet "drop it on a group to put it before or after that group", `arrange.ts:89` "the slide before it", `arrange.ts:165` `'before' | 'after'`, `arrange.ts:288` "The decks before the moved one's new place", `arrange.svelte.ts:49,58,283`, `Group.svelte:10`, `DeckForm.svelte:102` and `RuleForm.svelte:107` ("closes it before it reaches the deck"): each is a place in a list or the order of two events, not a comparison with an earlier state of the code. Kept.
- `present.ts:550` "still paused when not" is the base's line, not changed by the step.

The three "still" this step had written (`present.ts:253`, `Present.svelte:42`, `Present.svelte:348`) were reworded ("which draw the title with its markup", "closes the grid from a control too").

## Files, from `diff -rq` against the base copy

`diff -rq` of `src`, `tests`, `config` (`--exclude=local.yml`) and `utils` against `.agents/worktrees/O145-base`; `docs` from `git status --short`, since the base copy has no `docs`. Line counts `wc -l`, base then now.

| File | Lines |
|---|---|
| `src/lib/state/life/arrange.ts` (new) | 533 |
| `src/lib/views/academic/present/arrange/Overview.svelte` (moved from `present/Overview.svelte`, 94) | 243 |
| `src/lib/views/academic/present/arrange/Group.svelte` (new) | 226 |
| `src/lib/views/academic/present/arrange/RuleForm.svelte` (new) | 166 |
| `src/lib/views/academic/present/arrange/DeckForm.svelte` (new) | 142 |
| `src/lib/views/academic/present/arrange/KeyForm.svelte` (new) | 98 |
| `src/lib/views/academic/present/arrange/Tile.svelte` (new) | 148 |
| `src/lib/views/academic/present/arrange/arrange.svelte.ts` (new) | 366 |
| `src/lib/views/academic/present/Present.svelte` | 518 to 515 |
| `src/lib/views/academic/present/Bar.svelte` | 111 to 108 |
| `src/lib/views/academic/present/acts/menu.ts` | 36 to 93 |
| `src/lib/views/academic/present/screen/keys.ts` (outside the list) | 57 to 80 |
| `src/lib/state/life/present.ts` | 562 to 576 |
| `src/lib/ui/controls/heads/GroupHead.svelte` (beyond lines 63-67) | 264 to 274 |
| `src/lib/views/shared/card/pane-fold.ts` line 14 (outside the list) | 55 to 55 |
| `src/lib/views/system/history/History.svelte` (comment) | 492 to 492 |
| `src/lib/data/model/model-deck.ts` (comments) | 267 to 268 |
| `src/lib/data/sources/deck/read.ts` (comments) | 612 to 612 |
| `src/lib/data/sources/deck/spec.ts` (comments) | 223 to 223 |
| `src/lib/server/edit/deck-edit.ts` (comments) | 249 to 249 |
| `src/lib/server/edit/writes/bodies.ts` (comment) | 777 to 778 |
| `src/lib/server/edit/writes/config/lists/deck/deck-keys.ts` (comments) | 118 to 118 |
| `src/lib/server/edit/writes/config/lists/deck/deck.ts` (comments) | 299 to 299 |
| `src/lib/state/client/writes.svelte.ts` (comment) | 870 to 870 |
| `src/lib/views/academic/slides/` (deleted: `Slides.svelte` 513, `Order.svelte` 146, `Keys.svelte` 149, `GroupKeys.svelte` 157, `Steps.svelte` 68) | 1033 to 0 |
| `src/lib/state/life/slides.ts` (deleted) | 401 to 0 |
| `config/text/views/academic/slides.yml` (deleted) | 73 to 0 |
| `config/text/views/academic/present.yml` | 82 to 148 |
| `config/text/server.yml` line 147 | 634 to 634 |
| `config/catalogs/glyphs.yml` (outside the list) | 280 to 279 |
| `config/catalogs/icons.yml` (outside the list) | 279 to 278 |
| `tests/checks/config/config-folder.test.ts` line 303 | 850 to 849 |
| `tests/routes/edit/deck-slides.test.ts` lines 297-303 | 335 to 335 |
| `docs/HELP.md` lines 266 and 331 (331 is now a paragraph and 8 bullets) | `git diff --stat`: 12 lines |
| `docs/templates.md` line 30 | 1 line |
| `docs/palette.md` (regenerated) | the `\| Slides \| slides \|` row gone |
| `docs/diagrams/channels`, `layer-state`, `layer-views`, `layers` `.dot` and `.svg` (regenerated) | `git diff --stat`: 2 to 16 lines each |

Every edit was made with the Edit and Write tools, except one run of the project's formatter, `npx prettier --write` over `present/arrange/`, `state/life/arrange.ts` and `state/life/present.ts`, which rewrote the layout of `arrange/RuleForm.svelte` and `arrange/Tile.svelte` (both new in this step); the rules file may count that run as a script.

`src/lib/views/academic/present/acts/acts.svelte.ts`, on the path list, needed no change: the Overview takes `acts.act` and `acts.say` as they are.

## Judgment calls the brief left open

1. **Headers that do not fold.** `GroupHead.svelte` always drew its fold control and required `open` and `ontoggle`. It now takes both as optional: a group given no `ontoggle` draws no fold control and its body is open. Every other caller passes both and draws as before the step; the Overview's groups pass neither.
2. **Keys on a control.** `Present.svelte`'s `keys` returns for every key pressed on a control (`inControl`), except Escape, which closes the grid from a control unless the control or a form around it took it (`defaultPrevented`, or the form's `stopPropagation`). The full-screen rule that holds the page's own keys back moved, unchanged in effect, into `heldBack` in `screen/keys.ts`, so `Present.svelte` stays at 515 lines; a field keeps its keys in full screen too.
3. **Move Earlier and Move Later on a member deck** step the deck among the decks its group draws (named and found). The step names, in `slides:`, every found deck up to the new place and keeps a missing name in its slot (`deckStepped`); a drag dropped among the found decks names the deck at the end of `slides:`, as item 4 says.
4. **The busy hold, and the hazard it leaves.** After a write that changed the file, every arranging control is held until a deck arrives whose lists differ from the ones the write was made over (`arrange.svelte.ts`, `waiting`). This is what item 4 and decision 7 ask. If the push of the deck never arrives (the server's event stream drops), the controls stay disabled until the pane is reopened. Not fixed and not verified at a look; a time bound on the hold would end it, at the price of an act built on old bases, which the server refuses whole.
5. **The header's keyboard path.** A header's Move Earlier and Move Later are in its context menu, reached with Shift+F10 on its Edit Rule button. A placeholder tile is a menu button: Enter opens its menu (Move Earlier, Move Later).
6. **The rule sentence** joins its parts with `present.rule_comma` and `present.rule_and`; tier and stage words are the vocabulary ids as the file holds them (`nascent`, `scoping`), not translated labels.
7. **A form closes only on a successful Apply.** A refused or failed Apply leaves the form open with the reader's work and the status line saying why.
8. **Escape in a form's fields.** The two forms share one frame, `arrange/KeyForm.svelte`, with Apply, Cancel and the Escape rule. MultiSelect calls `preventDefault` on every Escape (`MultiSelect.svelte:154-159`, clearing its filter text), so the frame also listens in the capture phase: Escape in an input whose value is empty closes the form before the field sees it. In a MultiSelect with text typed, the first Escape clears the text and the second closes the form; in every other field or button one Escape closes it. MultiSelect itself is unchanged, since the workbench restores a maximized pane on an Escape nothing prevented (`shell/keys/workbench-keys.svelte.ts:194-201`), and changing the primitive would change that in every form that draws one.
11. **Shared parts of the Overview.** The work a form does on the keys (`createKeyWork`) and a form opened under its control, which gives the keyboard back to that control on closing (`createOpener`), are in `arrange.svelte.ts`; what every tile reads (the deck, a slide's place, the slide in force, the card cursor, the press) is one `TileView` (`state/life/arrange.ts`) that the Overview passes to its groups, so a slide tile is drawn by one call in both places. `tests/checks/tree/duplication.test.ts` asks for this.
9. **A latent assumption kept.** The Overview takes `deck.order[i]` as the entry whose `source.entry` is `i`, as `present.ts` `placedBy` already does. After a malformed `order:` entry that the reader drops, the two may differ by one. Not fixed: the reader's indexing is outside this step.
10. **Ids of title tiles** carry the group, the entry's place, the deck's place in the group and its name, so two found decks with one folder name give two cards.

## User-visible changes, for the look

Every case below is in the Present view on a scratch copy of the hub, the deck open, `O` pressed for the Overview.

- **C1.** Before: one card per slide in a flat grid, no headers. After: the deck's title and an Edit button on top; then tiles that draw their slides small, in `order:`: `title.md`, `engine.md`; the `pillars` header (count 7) and its decks' slides; the summary of pillars; `transition.md`; the `more` header and its decks' slides with `ecg-readable-substrate` and `hccnet-fl` among them; the summary of more; the grid slide, then the `ideas` header with one title tile per deck; `closing.md`. Each group ends in an Add tile; under each header one rule sentence.
- **C2.** Drag the `engine.md` tile onto the right half of the summary-of-pillars tile. After: the request (network panel) is one `deck-slides` write with `order.entries` holding `engine.md` after the summary's token, `order.base` the old order, `groups: []`; the Overview redraws with `engine.md` after the summary; History lists it.
- **C3.** Right-click the first `pillars` deck's tile, Move Later. After: one write of `pillars`'s `slides:` with the first two swapped, base the old list.
- **C4.** Drag a `pillars` deck's tile onto the `more` header. After: one write holding both groups, the deck gone from `pillars` and last in `more`.
- **C5.** Right-click a named `pillars` deck: Remove from Group is offered and writes `pillars` without it. A `more` deck found by discovery: no Remove from Group item.
- **C6.** The Add tile of `pillars`: a menu of its candidates by plain title; pick one and it is added at the end. A group with no candidates: the tile reads "No deck to add; the rule finds none the group does not hold" and opens nothing.
- **C7.** Change `present.yml` on disk after the Overview drew it, then Move Later. After: the status line shows the server's sentence, the file is unchanged, the Overview draws the file as it now is.
- **C8.** A `present.yml` that does not parse: `Empty` with the read's finding, no tile, no control, no request. A deck with one group, no deck in it and no slide: the Overview with that group's header (count 0), its rule sentence and its Add tile (before: `Empty`).
- **C12.** A slide with a link drawn in a tile: a press on the link shows that slide and closes the grid; the link does not open and takes no focus (Tab never stops inside the tile's slide).
- **C13.** An empty group with no `find`: header, "Shows the project decks it names.", Add tile.
- **C14.** The deck in two panes, both on the Overview; a move in one is drawn in both after the push.
- **C15.** An `order:` entry `{ slides: nosuch }`: a dashed placeholder tile reading `nosuch: ` and the reader's finding (`order_group_unknown`); Enter on it opens Move Earlier and Move Later, and Move Later moves it. A member of `ideas` moved by Move Later writes `ideas`'s `slides:` with the two swapped.
- **C16.** Edit Rule, then type `projects/*/*/present` in the folder field: the text is in the field, the grid stays open, the presenter screen does not start (before: `p` started it and `o` closed the grid). Escape in the field closes the form and the grid stays open; a second Escape closes the grid.
- **C17.** Press Move Later twice quickly on a `pillars` deck: after the first, the menu's items and the drags are disabled until the deck is pushed again; both moves land and the status line shows no refusal.
- **C18.** A deck titled `<i></i>`: the deck menu, the tab title and the Overview's title read its folder name. The Add tile of a group whose candidates include `ward-bttr-crosssubject` lists "Teaching a brain-computer interface from other people's brains", with no tags.
- **C19.** Drag a deck found by discovery in `more` onto the `pillars` header: one write of `pillars`'s `slides:` with it added; `more`'s list unchanged.
- **The Present toolbar** has no Slides button; a saved layout with a `slides` tab shows it as an unknown view.

## Anything in the brief that was wrong or impossible

The brief says "The step writes these paths and nothing else". Five paths outside the list were needed:

- `src/lib/views/academic/present/screen/keys.ts`: with item 3's key rule in place, `Present.svelte` was 532 lines (`wc -l`), over the 520 limit; the full-screen key rule moved into `heldBack` here, and `Present.svelte` is 515.
- `src/lib/ui/controls/heads/GroupHead.svelte` beyond lines 63-67: the base requires `open` and `ontoggle` and always draws `FoldControl` (`O145-base/.../GroupHead.svelte:90-91,158-161`), so a header that does not fold (item 4, decision 6) cannot be drawn with it unchanged.
- `config/catalogs/glyphs.yml` and `config/catalogs/icons.yml`: the glyph `section` was read only by `views.slides_glyph` of the deleted `slides.yml`; with it gone, `tests/checks/config/config-folder.test.ts` failed with "names a glyph only where the source or another config file reads it" (`expected [ 'section' ] to deeply equal []`). The `section` row is removed from both.
- `src/lib/views/shared/card/pane-fold.ts:14`: its head comment listed "Slides" among the views that fold through `stateFolds`; the brief's greps miss it (it says "Slides," with neither "view" nor a file name). "Slides, " is taken out.

`tests/checks/diagrams/palette.test.ts` times out at vitest's default 5000 ms when run as check 3 writes it; `package.json:16` runs the tree checks with `--testTimeout 0`, and it passes with that flag.
