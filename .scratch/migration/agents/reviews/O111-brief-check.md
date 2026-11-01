# Brief check of O111

Base: the brief was read on f63c790f5; main's head is now 45f825fc0. `git log --oneline f63c790f5..HEAD` prints four ledger commits (Prepare and Launch of O110 and O112). `git diff --stat f63c790f5 HEAD -- src config docs tests package.json` prints nothing, so every premise reads the same tree.

Findings marked BLOCKS need a change to the brief before dispatch. All element and time estimates are arithmetic from the brief's own measurements and are labelled as judgment.

## Names

Commands:
- `grep -rln "isFolded\|heldFold\|withFold\|foundInside\|partTexts\|FoldPart\|settings/Fold\|from './Fold\|Fold.svelte" src tests docs config --exclude=local.yml`
- `grep -rn "data-fold\|data-folded\|fold_entries\|fold_entry\|fold_field\|settings_fields\|\.folds\b\|folds:" src tests config docs README.md --exclude=local.yml`
- `grep -rn "Cards.svelte\|<Cards\|Editor.svelte\|editors/Fold\|./Fold.svelte\|<Fold$\|<Fold " src tests docs config README.md --exclude=local.yml`
- `grep -rn "SEARCH_DRAWN" src tests config docs README.md --exclude=local.yml` prints nothing, so the new name collides with nothing.

The names the step changes are `isFolded` (needs the query), `withFold`, `heldFold`, `FoldPart`, `foldKey` (widened for a nested path), and `Fold`'s props. Hits outside "Paths this step writes":

| Hit | Does the change make it false? |
|---|---|
| `src/lib/state/system/config/search.ts:16,47` (`partTexts`) | No, unless `partTexts` changes signature. |
| `search.ts:5-6` "(view/fold.ts, which unfolds the part it is found in)" | No. |
| `src/lib/ui/tree/row/FoldLine.svelte:5-6` | No. |
| `settings/Control.svelte:6,33`, `settings/other-rows/ClusterRows.svelte:3,19,69` | No. ClusterRows inherits the new behaviour through `Editor`, unlisted but correct. |
| `src/lib/shell/panes/leaf/FoldedPane.svelte:55,63` `data-fold` | No. It is the same attribute name with a different meaning. A nested value of `data-fold` does not reach it. |
| `tests/state/system/settings/collection-fields.test.ts:9`, `tests/state/system/config/sparse-card.test.ts:20` (name `Cards.svelte` in a comment) | No. |
| `tests/state/system/settings/editor-saved.test.ts:187` `'data-editor='` | No; Editor's root attribute is unchanged. |
| `.scratch/migration/agents/guarded.md:223` (G138 Code names `Cards.svelte`) | No. It means G138's test must run. `test:quick` reaches it through `sparse-card.test.ts:20`; the brief does not name it. |
| `docs/HELP.md:298` "A search never folds or unfolds a group" | No. It supports the group-head finding under Cases and checks. |
| `docs/HELP.md:148` "a Settings card" | No. |

Hits inside the write list that item 4 does not name:
- `RailEditor.svelte:13-15` "an edit keeps the line unfolded", and `:75`.
- `Cards.svelte:31-33` (the PAGE paragraph) and `:18-20`. Both need rewriting for the filter. Spec's "after changing what code does" rule covers them, but item 4's list reads as complete.

A hole in the names: `typed.ts` (`withSettingsQuery`, read with `sed -n 1,75p`) or `Settings.svelte` `setQuery` is where a press "dropped when the query changes" (Decision 3) is dropped, and neither is in the write list. A compare on read in `fold.ts` stays inside the list but revives the press on query A, then B, then A, which contradicts item 3. See Implied inputs 12.

## The step line

Command: `grep -n "O111 Settings" .scratch/migration/plan.md`.

| Part of the step line | Requirement |
|---|---|
| `latex_editing` and every other row's long entries are drawn only when opened | Item 1, plus the existing row fold. |
| under a search only the entries that match are drawn | Item 2. |
| so a first keystroke no longer freezes the page | Cases 9 and 10. |
| a part the search unfolds is opened when the search finds it and the reader's press then wins | Item 3. |
| which `isFolded` refuses today | Item 3 and cases 1 to 4. |

Every part has a requirement. Three parts are met only in part:
- **"Every other row's long entries."** Item 1 reaches only lists past FOLD_AFTER inside Cards. In `agents` and `workbench` the only lists over 5 are `.claude.lists.mode.values` (6), `.claude.lists.effort.values` (6) and `.root.children[0].view` (7) (inline `yaml.safe_load` walk). The brief names 2,147 and 1,264 elements for these rows; nearly all of them stay drawn at first draw.
- **"Only the entries that match."** The rail row and the Fields list are not filtered. `RailEditor.svelte:175` draws all 13 rows (`yaml.safe_load`, `len(rail)` prints 13), and Item.svelte:209 draws all fields. Item 2 does not say this is intended.
- **"Every keystroke."** See the cost finding under The question.

The Rulings line "O110 to O114" (`plan.md:3387`) rules only on questions 4 and 5. It carries nothing for O111 beyond the booking.

## Premises

| Fact in "What is on the tree" | Recheck | Result |
|---|---|---|
| 4251 ms, 92,599; 2106 ms, 41,891 | Cannot be rerun | Not counted. |
| Per-row counts | Cannot be rerun | Not counted. |
| `latex_editing` five keys, "the lists `at` (66), `environments` (53), `chords` (2) and `symbols` (10)" | Inline `yaml.safe_load`; `config/options/catalogs/latex.yml` | DIFFERS in kind for `chords`. Counts hold. |
| `symbols` nests lists one level further | `yaml.safe_load` | Holds: 10 groups, 648 items. |
| `Editor.svelte:142`, FOLD_AFTER 5, `foldedAtFirst`, `Cards.svelte:251` | `cat -n` | Hold. |
| `isFolded` starts `if (searched) return false` | `fold.ts:70` | Holds. |
| A press writes the held fold and shows nothing | `Fold.svelte:55-57` | Holds. |
| `Fold.svelte`'s head comment, `fold.ts`'s head comment | `Fold.svelte:10-12`, `fold.ts:10-12` | Hold. |
| `Item.svelte` states that behaviour | `Item.svelte:26-28` and `:115` | Weaker: the head says only "folds and unfolds"; `:115` says "which unfolds it". |
| `Fold.svelte` draws nothing folded; `GroupHead.svelte:133` | `cat -n`, `grep -n until-found -r src` | Hold. |
| `RailEditor.svelte:169` | `cat -n` | Holds. |
| `workbench.yml:53` | `grep -n fold_entries` | Holds; the group is at `:12`. |
| `tests/state/system/settings/` holds the state tests | `ls` | Holds: 9 items, so `fold.test.ts` makes 10, at the limit. |
| `grep -rln "isFolded" tests` prints nothing | Run | Holds. |
| `docs/adr` does not exist | `ls docs` | Holds. |

Differences:
- **`chords` is not a list of 2.** It is `holds: record`, a map with `text` (11) and `math` (7), drawn as one card with `single` true, each key a nested map. Under item 1 it either shows "1 entry" or has no Fold. The brief decides neither. See Implied inputs 13.
- **Item 4's "the matching lines of `docs/HELP.md`" do not exist.** `grep -n -i "folded\|unfold\|disclosure\|fold line\|fold " docs/HELP.md` hits only lines 298, 310, 311, 331, 340 and 525, none about Settings parts. The Settings entry, line 350, says nothing of folds; it ends "Search takes `@modified` and `@id:`." So this is new text.

Premises the brief omits and the build depends on:
- `Cards.svelte:133-138`, PAGE and Show more.
- `Cards.svelte:146-147`, the Add focus is found by DOM position, `Array.from(all).at(at)`.
- `Editor.svelte:112-115` and `RailEditor.svelte:108-112`, an edit writes the kept fold.
- `Editor.svelte:99-101`, `searched` reads the file's `row`, not the draft.

## Cases and checks

**BLOCKS. The four page cases break spec.md.**
- Spec line 65: "A builder runs no page: it starts no scratch oculus for a browser and drives no headless browser, whatever a brief says." Its row "names the look on landing as its proof."
- Spec also says nothing in a brief overrides it.
- The cases "A query of one letter...", "Opening Settings...", "An edit to the third matching entry..." and "The fold line of a group head..." ask for a scratch-server run the report quotes. Line 46 asks for their first run before any change, and "Conventions" gives the server recipe.
- Change: reword each as a look with the view, the state and what should be seen, or as a unit-level run. The third can be a case-run over the selecting function and `applyEdit`. Move the measurements to the orchestrator's look.

**BLOCKS. No `guarded.md` entry covers `fold.ts`.**
- `grep -n -i "fold\.ts\|Fold\b\|config/view\|editors/draft\|Settings editor" .scratch/migration/agents/guarded.md` shows no such entry. G138 at `:222-224` covers sparse cards and G96 covers saved rows.
- Spec: "A test exists only as the test of one entry of `agents/guarded.md`... A step that needs a new entry stops and asks Axel for it, and writes no test until he has ruled."
- The brief marks eight cases "A test.", lists `fold.test.ts` in the write list and makes it Verify item 1, while lines 48 and 51 say a case becomes a test only when the rule calls for it. `grep -n "guarded" .scratch/migration/agents/briefs/O111.md` prints nothing. O110's brief records the widening of G90 under an open item, Decision 3.
- Change: book a ruling for a new or widened entry before dispatch. Or turn the eight into case-run rows and drop `fold.test.ts`, which is the weaker choice, since an edit landing on the wrong entry loses work.

**The group-head case checks a place the step does not change.**
- `GroupHead.svelte` and `pane-fold.ts` are not in the write list.
- `List.svelte:102-103` reads `fold.open` and `fold.toggle`, neither of which reads the query. HELP:298 says a search never folds a group. Item 3's list does not name a group.
- The case passes on the unchanged tree. Replace it with presses on a row's entries, its Fields list, a nested list and the rail row.

Others:
- Case 5 says "kept as before". Spec bars 'as before' in a test title, so the builder must not copy it.
- Verify 2 omits `npm run diagrams`, and Verify 4 uses the older grep form. Spec governs both.
- The write list holds `.scratch/.../O111-report.md`, while spec says "You never edit anything under `.scratch/`". This is the template's practice (O110 has the same line).

**Paths.**
- `Cards.svelte` is 488 lines (`wc -l`) against 520, and this step adds a Fold, a filter, a count line and props. In my judgment it passes 520. Spec then requires a split into a new file, which the write list forbids. Name the file now.
- "Read" omits files the step writes or needs: `RailEditor.svelte`, `workbench.yml`, `docs/HELP.md`, `typed.ts`, `draft.ts` (`Step`, `Edit`, `moved`) and `fields.ts` (`Card`, `cardsOf`, `drawsCards`). Spec item 2 says to read "the files the brief lists, and only those."

**Missing cases.**
- Under a query with the part not found in it: folded, even when held open or short (item 2's "stays folded"). No case covers this, and today's `isFolded` gives held ?? first.
- Filtered Move and filtered Remove.
- The "how many more match" line, and the absence of Show more under a filter.

## The question

Could each pass without the goal being reached?

Cases:
1. Found, no press: yes. It passes on the unchanged tree and only guards.
2. Press folds: yes. A pure `isFolded` passes with `Fold.svelte` never wired to it.
3. Press, then query changed: yes, same reason. It also passes for a compare on read that revives the press on A, B, A.
4. Press, then query cleared: yes, same reason as 2.
5. Press under no query: yes, it is preserved behaviour.
6. 6 and 5 entries: yes. It passes with `Cards.svelte` drawing no Fold at all, and nothing proves "at every depth".
7. Key collision: yes for the DOM. `Fold.svelte:43`'s body id `fold-${id}-${part}-${row}` also needs the path, and `aria-controls` depends on it.
8. Selection: yes. It passes while `Cards.svelte` uses the filtered position for `idOf`, `aimed`, the labels or `path`.
9. One letter, BLOCKS:
   - It can pass falsely, since a scratch HOME has no real hub and the brief's numbers come from 8790. The case names no hub or folder to serve.
   - It can also not pass at all, because the cap is per list. 25 per list multiplies through nesting. `symbols` draws 10 groups times 25 items.
   - An inline `yaml.safe_load` count of drawn field boxes for `latex_editing` at the cap gives a 936, e 978, i 950, s 846, t 984, x 391.
   - At the brief's 29,968 elements per 2,342 inputs that is about 12,500 elements for "e" (about 9,960 at 29,968 per 2,943 boxes, my count of all boxes), one row alone, against a limit of 6,000.
   - The old path added 50,708 elements in 4251 ms, 11.9 per ms, so 200 ms is about 2,400 elements (judgment, a rate from the old path).
   - Change: a cap per row, or nested lists folded under a search until pressed.
10. Opening and clearing, BLOCKS:
    - "Beyond the first draw" exempts the largest cost, so a slow first draw passes.
    - The limit looks unreachable. 41,891 - 29,968 = 11,923 outside `latex_editing`, and 8,512 even with `agents` and `workbench` wholly gone. Those rows barely fold (see The step line), and every other row is under 500 and has no list the step folds.
    - 6,000 needs about 5,900 fewer elements from rows the step does not change. In my judgment clearing lands near 11,000.
    - Set the limit from a measurement or add work that draws rows on demand. The first run on the page would settle it.
11. Edit third match: yes. Move, Remove, Add and an edit that stops the entry matching are not covered.
12. Group head: yes, it passes on the unchanged tree.

The step's check is "no longer freezes". It could pass for the first keystroke alone. Backspace and widening are not cases, though the goal says every keystroke.

Items:
- **Item 1:** yes. The reachable proof is the pure fold rule, and depth is seen only at the look.
- **Item 2:** yes. Its cost sentence, "the search over the texts plus the entries drawn", is not what the code does. A query that puts rows back remounts `Item` (`List.svelte:139`). Each remount runs `draftOf` over the whole value at `Item.svelte:86` and `:134`, `Control.svelte:114` and `Editor.svelte:76`, and `draftValue` at `Editor.svelte:80`, folded or not, including the 6053-entry Text row. Not measured. Clearing can exceed 200 ms with no list drawn.
- **Item 3:** yes for the Fields list, the rail row and nested lists, since the only proof is pure.
- **Item 4:** yes. It lists four comments and "matching lines" that do not exist.

## Implied inputs

Each is missing from the brief. The expected result is my recommendation, a judgment.

1. **Typing in a filtered entry until it stops matching** (query `alpha`, edit to `alph`). This happens on any edit; the input is destroyed under the caret. Expected: an entry the reader is editing stays drawn while the query stands.
2. **A draft that differs from the file.** `Editor.svelte:99-101` and `search.ts:47` read `row.value`, and `draft` is what is drawn (`:76`). An edit that removes the word leaves "found in" true with no match; a word only in the draft stays folded. Expected: filter and fold under the query read the draft, and no empty open list is drawn.
3. **Add under a filter.** The new entry is empty, so it does not match. `Cards.svelte:146-147` finds it by DOM position, so focus is lost and the reader types nowhere. Expected: the added entry is drawn last and takes the focus.
4. **Add taking a nested list from 5 to 6 with no held fold.** `Editor.svelte:112-115` holds only `entries`, so the list folds under the reader. Editor's head comment states this rule for the row. Expected: the same for every nested path, read from the edit's `path`.
5. **An edit under a search.** `Editor.svelte:113-114` and `RailEditor.svelte:110-111` write the kept fold, so clearing leaves a long list open, against "clearing the query brings the kept folds back". Expected: an edit under a query does not write the kept fold.
6. **Move in a filtered list with a hidden neighbour.** With `by: 1` nothing visibly moves. `moved` in `draft.ts` takes any integer `by`. Expected: state one. I recommend moving past the next drawn entry. `disabled` at `Cards.svelte:320,327` uses the real ends. A Remove needs only the real index.
7. **A query of filters alone, `@modified` or `@id:x`.** `foundInside` returns false with no plain word, so under item 2 every list folds, including the Modified rows the reader asked for. Expected: no plain word means no filter and the kept folds stand.
8. **`@8` or `@.`.** `plainWords` (`fold.ts:102-107`) drops every `@` word, while `search.ts:36` keeps an unknown `@word` as a word. `at` entries have prefixes such as `@.` and `@8`, so the row answers and its list stays folded. This is the step's own row. `plainWords` and `readQuery` are two readers of one query (G21). Expected: `@8` draws the entry.
9. **A query equal to a field name, and reuse of `entryTexts`.**
   - `entryTexts` counts every map key (`fold.ts:80`), so `name` or `body` is found in every record, or the list opens with no value match if the card match reads values only.
   - Run on a `Card`, it also matches `fields`, `kept` and `order` (`fields.ts:66-72`).
   - Expected: one rule for list and entry, the card's own keys never match, and `kept` and `unread` values do.
10. **Multi-word queries.** `answers` needs every word; `foundInside` needs some. With `latex alpha`, "every" over an entry draws nothing. Expected: "some", as `foundInside`.
11. **A press unfolding a list the query is not found in.** Item 2 says matches only, and there are none. Expected: the whole list with PAGE and Show more. Under a filter, Show more is not drawn; `Cards.svelte:138,365` reads `cards.length`.
12. **Query A, B, A; `a` and `a ` ; `a` and `A`.** Expected: A, B, A does not revive the press, and the same words keep it. This needs a write at the query change. See Names.
13. **`single` cards.** Item 1 says "list or map". Expected: a record has no Fold of its own (a count of 1 says nothing) and its maps fold, so `chords` shows `text` 11 and `math` 7, both folded.
14. **`sparse` cards.** `addField` and the Select label use `at`, so they need the real index. Match reads held fields only. Expected: Add field works on a filtered card.
15. **A `pairs` map.** Match includes `key`. A key being typed is input 1. Nested Cards gets no `ordered`, so Move stands. The real index is the card's place. Expected: as a list.
16. **A slot list.** `Cards.svelte:184` indexes `slots[at]`, so a filtered position names the wrong slot. `grep -rn "slots" config/options config/defaults --exclude=local.yml` hits only a comment, so no shipped row has one. Expected: real index.
17. **The other large rows.** See The step line and case 10.
18. **The card cursor.** `reconcilePane` (`workbench-keys.svelte.ts`) clears a held cursor when its card is folded or filtered out; it does not come back. `idOf` (`Cards.svelte:160`) needs the real index or the cursor lands on another entry. Expected: real index in `data-card`, the `{#each}` key at `:237` and `path` at `:261`; say the clearing is intended.
19. **Table of contents and reveal.** `scrollTo` and `unfold` target groups and sections only, so nothing there changes. The rail reveal keeps a query that matches the row, and item 2 then folds a rail list the reader held open, while the view was asked to show it. Expected: a kept row (`keep`) shows its kept fold.
20. **Nested fold keys by place.** `Step` is `{ index, field }`, so after Move or Remove of a parent a held fold passes to another entry. Expected: state it. Follow the entry, or accept this as a stated limit.
21. **Unsaved work under a fold.** The draft is in instance state, and the `unsaved` line, problems and Discard stay outside `Fold` (`Editor.svelte:166-193`), so nothing is lost. `FieldControl.svelte:143-147` holds local state: an Add person write out while its list folds drops the pick, since `drawn` goes false. A problem naming a hidden entry cannot be reached until the search is cleared. Expected: name both as accepted, or unfold on a problem.

## ADRs

`ls docs/adr 2>/dev/null` prints nothing and `ls docs` lists no `adr`. None.

## Dictated text

The brief dictates no text. It names the constant `SEARCH_DRAWN` and gives no words for any file, including the "how many more match" line.

## Declined to judge

- The page measurements, which cannot be rerun.
- Whether 200 ms is reachable by any design, which needs a page.
- The cost of `draftOf` and `draftValue` on remount, not measured.
- Whether 25 is the right cap, apart from its multiplication through nesting.
- The saved-state key for a press under a query: the brief gives none and spec makes it a reportable shape. Its name is for the orchestrator.
- Whether a Move or a fold-key rule should follow VS Code, which I did not check.

Usage: ae05ac84921af52fa, claude-opus-5-5, 228725 tokens, 32 tool uses, 566.1 s

## Closed

- The page cases: moved to the look, named with view, state and target; unit cases stand for the rest.
- No guarded entry: Z1090 books a new entry.
- Group-head case: removed; item 3 names the parts.
- The cost through nesting and the unreachable limit: the design changed: the cap of 25 is per row, and a row the query drops stays mounted and hidden.
- Cards.svelte's size: the nested branch moves to `editors/NestedCards.svelte`.
- Names, read list, HELP, comment lists: corrected.
- Implied inputs 1 to 21: each decided in the brief's What to build or stated limits. Input 19: a part not found keeps its kept fold.
