# Step O111 refuter report (on .agents/worktrees/migration-O111, base e9e8cdd7e)

A page this report cites (the rules file, a standard, a skill's text) is named with its section, never with a line number, since a page's lines move and a section's name does not. A finding in code keeps its `file:line`.

The report is written in the rules file's character set. A character outside it in a quoted line is written by its name in angle brackets, such as `<tab>` or `<em dash>`.

## Verification (rerun by the reviewer)

```
$ npx vitest run tests/state/system/settings/fold.test.ts
 Test Files  1 passed (1)
      Tests  34 passed (34)

$ npm run diagrams   (exit 0; shasum of docs/diagrams/* the same before and after the run)
$ npm run test:quick -- --base e9e8cdd7e
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (2.2 s)
ok      eslint (2.5 s)
ok      svelte-check (9.2 s): 1793560002170 COMPLETED 577 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (27.6 s): Duration  16.83s (transform 31.46s, setup 0ms, import 59.61s, tests 1.52s, environment 3ms)
ok      vitest slow (31.8 s): Duration  20.83s (transform 12.66s, setup 0ms, import 18.28s, tests 6.41s, environment 0ms)
ok      vitest checks (44.7 s): Duration  33.74s (transform 12.96s, setup 0ms, import 27.14s, tests 54.13s, environment 2ms)
test:quick: 47.0 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files

$ LC_ALL=C grep -n '[^ -~]' <the 16 changed files of the report's table>
(prints nothing, exit 1)

$ grep over the new files for before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands
(prints nothing); over the added lines of `git diff e9e8cdd7e -- src config`: one line, search.ts "the groups and sections that still hold one"

$ grep -rnE "plainWords|headings\(\)|innerSpecs|innerForm" src tests docs
src/lib/views/shared/prose/rendered-headings.svelte.ts:33:        const list = deps.headings();

$ grep -rlE "\b(stepsKey|moveBy|searchDrawn|editedAfter|keptOpen|keptIn|queryWords|wordFound)\b" src
(nine files, every one a file of the step)

$ sh utils/unused-exports.sh | wc -l
337 (no line names a name the step added)

$ node --no-warnings <scratchpad>/case-run.mjs "$PWD"   (source retyped from the builder's report, with the builder's `$state` stub)
places by matches.ts [ 0, 2, 4, 6 ]
third matching entry 4 alpha 4 by 2
set    alpha 0 | x 1 | alpha 2 | x 3 | edited | x 5 | alpha 6 | x 7
move   alpha 0 | x 1 | alpha 2 | x 3 | x 5 | alpha 6 | alpha 4 | x 7
remove alpha 0 | x 1 | alpha 2 | x 3 | x 5 | alpha 6 | x 7

$ node --no-warnings <scratchpad>/case-run-latex.mjs "$PWD"   (source retyped from the builder's report)
form records one true cards 1
"alpha" lists [ '0.at:1', '0.symbols/0.items:2', '0.symbols:1', 'top:1' ] more 0
"e" lists [ '0.at:24', 'top:1' ] more 765
"@8" lists [ '0.at:1', 'top:1' ] more 0
"@modified" lists null more undefined
"zzzz" lists null more undefined
set    [ '0.at#1' ]
add    [ '0.at#2' ]
move   [ '0.at#2', '0.at#5', '5.at/0.x#1', '#5' ]
remove [ '1.at#0' ]

$ node --no-warnings <scratchpad>/probe.mjs "$PWD"   (the reviewer's own, reading only; quoted under Behaviour)
past-cap list: {"lists":{"0.a":[0,1,2,...,24],"":[0]},"more":8}
list of 5, query @modified, before Add folded? false
after Add, keptOpen writes {"query":"@modified"} list of 6 folded? true
row list of 5 to 6, plain query not found, folded? true
same with no query, folded? false
press under filter {"query":"@modified","searchFolds":{"words":"@modified","presses":{"entries:f:k":true}}} cleared {}

$ node --no-warnings <scratchpad>/probe-o111.mjs "$PWD"   (the reviewer's own, reading only)
no edit       {"lists":{"0.a":25,"":1},"more":9}
one edited    {"lists":{"0.a":25,"0.b":1,"":1},"more":8}
past cap with edited child {"lists":{"0.a":25,"1.n":1,"":2},"more":1}

$ wc -l src/lib/views/system/workbench/Settings.svelte src/lib/views/system/workbench/editors/Cards.svelte
     520 Settings.svelte (519 at the base, by `git show e9e8cdd7e:<path> | wc -l`)
     490 Cards.svelte (488 at the base)

$ git status --short | wc -l   (21 before and after the runs; `git diff e9e8cdd7e --stat`: 17 files changed, 361 insertions(+), 209 deletions(-))
```

The builder's report's quoted lines reproduce: `Tests  34 passed (34)`, `every command passed`, both case-runs line for line, the 337 lines after, the one-hit word grep. Timings differ only by the run. The run on the unchanged tree and the 337 at the base are not rerun; see "Declined to judge".

## Verdicts

Items of the brief's "What to build", in its numbering:

- 1: holds. `NestedCards.svelte` holds the nested branch under `Fold` with the field's name and its count; `single` (`familyForm(spec) === 'record'`) draws no fold of its own; `foldKey` keeps the part per row and path; `Fold.svelte` puts `foldKey` in the body id; `keptOpen` writes every list on the path under no query (`fold.ts:97-105`, called at `Editor.svelte:133`). What `NestedCards.svelte` does on a page goes to the look.
- 2: violated, Behaviour 2. `searchDrawn`, the cap per row, the real index in `idOf`, `path`, `data-card`, the `{#each}` key, `nameOf`, `labelOf`, `addField` and Show more off under a filter all hold by reading and by the 'picks the entries a search draws' table; the line of how many more match gives a wrong count where a list past the cap is drawn.
- 3: violated, Spec 3. Every rule of the item holds by reading and by the table except "A part reads the same rule, on the draft", which the rail list does not. `readQuery` is the one reader; `foundInside` now takes an unknown `@word`, which the brief asks for, and `search.ts`'s handling of `@modified`, `@id:` and an unknown `@word` is the same code moved. See also Behaviour 1 and Behaviour 3, which the item's text allows.
- 4: holds. `withFold` writes `searchFolds` under a query and `folds` under none; `isFolded` reads the press first; `withSettingsQuery` drops it when `queryWords` change, and both writers of the query (`Settings.svelte:397`, `palette-source.svelte.ts:116`) go through it; `Fold` is the one control for the row's entries, the Fields list, the nested list and the rail row; a press holds through a redraw and a reload since it is instance state; the probe's `press under filter` line and the fold table.
- 5: violated, Spec 1 and Spec 2. The rest holds: `hidden` on the `section`, the wrapper div and `GroupHead`, whose `{...attributes}` reaches its `<section>`; no CSS sets `display` on `.group`, `.section` or the wrapper; `.groups` is the flex parent and a hidden item takes no gap; `.section:not([hidden]) ~ .section` gives the first shown section no margin; `count` reads `keptIn`; no selector in `Item.svelte` or `List.svelte` depends on rows being siblings; the empty result draws what it drew (the Header's count, no list); `cards()` in `workbench-keys.svelte.ts:393-398` skips a hidden row by `checkVisibility`, and `reconcilePane` reads that list; `Settings.svelte` `visible` covers `follow`, `scrollTo` and `focusFirst`.
- 6: holds. `config/text/views/system/workbench.yml` has both keys beside `fold_fields`, in the file's form, each read by `Editor.svelte:188-190`.
- 7: holds for the comments the item lists, each read, and for `docs/HELP.md`'s Settings entry. `Settings.svelte`, which the item does not list, is Standards 1.

Cases of the brief's "Cases":

- 'folds' a part the query is found in, no press: met, row of that title, passes.
- 'folds' the same after a press that folds it, same query: met, row 'a press that folds it, same query: folded'.
- 'folds' that press, query changed: met.
- 'folds' that press, query A, then B, then A through `withSettingsQuery`: met.
- 'folds' that press, the same words in another case and spacing: met.
- 'folds' that press, query cleared: met.
- 'folds' a press under no query, then a search comes and goes: met.
- 'folds' a part the query is not found in, held open and held folded: met, two rows.
- 'folds' a query of filters alone over a part with a held fold: met.
- 'folds' a nested list of 6 entries, no held fold, and of 5: met, two rows.
- 'folds' a nested path's key against `entries`, `fields` and a list of the same name in another entry: met, five rows.
- 'picks' a flat list: met, 30 matches, 25 picked at their real places, `more` 5.
- 'picks' nested lists: met, 25 in all, `more` 15, real paths.
- 'picks' a query equal to `fields` or `kept`: met, and a match from a `kept` value.
- 'picks' `@8` over an entry holding `@8`; a filter query: met.
- 'picks' two words, one found: met.
- 'picks' an edited entry that no longer matches: met, titled 'an edited entry the query is not found in: drawn, uncounted', since spec.md bans the brief's wording in a title.
- 'picks' a Move over a hidden neighbour: met, Down and Up, `moveBy` then `applyEdit`.
- Case-run, an edit, a Move and a Remove on the third matching entry: met, rerun above; the first run on the unchanged tree is quoted in the report and is in the builder's transcript before its first edit under `src`.
- Look, first letter `e`: not verifiable, goes to the look.
- Look, Backspace and clearing: not verifiable, goes to the look; Spec 2 says clearing mounts `WorkspaceRows`.
- Look, opening Settings: not verifiable, goes to the look.
- Look, `latex_editing` folded with counts and `alpha`: not verifiable, goes to the look; `case-run-latex.mjs` gives the picks.
- Look, a press on each part under a search and after clearing: not verifiable, goes to the look.
- Look, an edit that stops the match, an Add, a Move and a Remove under a filter: not verifiable, goes to the look.

## 1. Spec

1. `src/lib/views/system/workbench/editors/Editor.svelte:118-120` and `:162`: "`draft === null ? null : searchDrawn(draft.cards, query, edited.entries)`" and "`searched={search !== null}`"; what is wrong: `Editor` does not know its row is hidden, so a row a query leaves out opens its `Fold` and mounts up to 25 cards, and item 5 says a keystroke changes attributes and mounts nothing. The row test needs every word and `@modified` (`search.ts:21-31`), while `searchDrawn` needs one plain word. The report leaves it as a limitation because `Control.svelte` is outside the write list. A brief's path list is a choice, and the rules file's "Where you work" says a path the step needs is named before hand-back; a limitation written instead of a fix is what spec.md's working rules call the lazy option. Failure scenario: Modified on, then type `e`: every row that is not Modified is hidden, and each hidden row with `e` in its entries mounts 25 cards, the cost the step set out to remove, spent on rows the reader cannot see. `alpha zzz` does the same in every row holding `alpha`. Verdict: item 5 violated.

2. `src/lib/views/system/workbench/Settings.svelte:456-458`: "`{#if scope.kind === 'workspace' && query === ''}`"; what is wrong: the first letter unmounts `WorkspaceRows` and clearing the query mounts it (its two rows and one text box per folder), against item 5, "clearing a search draws no row anew" in `List.svelte`'s own head comment and "a keystroke changes attributes and mounts nothing". The report's reason, "`Settings.svelte` is at 520 lines", does not stop the fix, since a `hidden` passed to `WorkspaceRows` keeps the same three lines there. Failure scenario: Workspace scope, a word typed and cleared: `WorkspaceRows` is built again at each clear, and a keystroke that takes the box from one letter to none mounts, which the look's clearing case is measured on. Verdict: item 5 violated.

3. `src/lib/views/system/workbench/settings/Item.svelte:121-124` and `:222`: "`return foundInside(settingsQuery(ui.instanceState(id)), partTexts(row, part));`" with "`<RailEditor {id} {row} searched={searched('entries')} />`"; what is wrong: item 3 says a part reads the same rule on the draft, and the rail list's fold reads the file's `row.value`, while `RailEditor` draws the list being typed. The report does not name this. Failure scenario: a rail row removed in an unsaved edit holds the only `alpha`; query `alpha`: the row's file value answers, the rail line unfolds, and no row on it holds the word. Conversely a word only in the rail draft leaves a row kept by its title folded. Verdict: item 3 violated.

4. Scripts, ruling "Unapproved builder scripts" in `plan.md`; the report's first lines: "changed once by a shell append (`cat >>`) and once by an inline `python3` program during the first run, and the case-run program in the scratchpad once by inline `python3`"; what is wrong: three programs no line of Rulings approves, and a fourth form the report does not name. From the builder's transcript (`~/.claude/projects/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/subagents/agent-ab16128813ec8407f.jsonl`):
   - `cat >> tests/state/system/settings/fold.test.ts`: wrote the helpers `item`, `holder`, `every`, `places`, the type `PickRow` and the whole `describe('picks the entries a search draws', ...)`.
   - inline `python3` on the same file: added the imports of `applyEdit`, `Draft`, `Card`, `moveBy`, `searchDrawn` and `Entry`, and changed the comment "The numbers from `from`" to "The numbers from 0".
   - inline `python3` on `<scratchpad>/case-run.mjs`: added the comment and the line `globalThis.$state = (value) => value;`.
   - not named in the report: `cat > $SP/case-run.mjs` by heredoc, sent twice, which created the case-run program; the rules file's "What every package obeys" counts a shell redirect that changes a file as a script.

   All four ran during the first run, before the first edit under `src`. The test file was then written whole by the Write tool and edited by the Edit tool, so none of those hunks stands as a script's output; the file was read whole here and holds the table above with `textOf` and the title the rules allow. The case-run is outside the diff. Failure scenario: a reader of the report takes it that only the two named programs wrote files and does not look for the third form. Verdict: none; closed by the ruling, breach to be recorded with the four commands.

## 2. Proof

1. `.scratch/migration/agents/reviews/O111-report.md` first line and DONE row 5: "Everything in the brief is done" and "| 5. Hidden rows stay mounted, ... | DONE, the look's |"; what is wrong: the same report's Limitations say a hidden row "can still draw its picks" and that `WorkspaceRows` "is still under `{#if query === ''}`", both inside item 5; the rules file's "Report" section forbids presenting partial work as complete, and a row with a known miss is NOT DONE. Failure scenario: the orchestrator reads the first line and DONE row and lands the step without Spec 1 and Spec 2. Verdict: item 5 violated.

2. `tests/state/system/settings/fold.test.ts`, rows 'that press, query changed: unfolded', 'that press, query A, then B, then A: unfolded', 'a nested list of 6 entries, no held fold: folded' and the rows of a press on a nested list that pass; the report: "Which rows prove a preserved behaviour and which a new one is read off this table"; what is wrong: these rows test behaviour the change adds (the drop of a press, a nested part) and they pass on the unchanged tree, because `isFolded` there ignores a press and takes any part. Verify 3 asks for a quoted failure for an added behaviour and a statement of which is which; the report leaves the reader to sort it. The 'A, B, A' row is judged by reading: it is the row that fails without the delete at `typed.ts:96`, since the words guard at `fold.ts:60` lets a press under the same words through. Failure scenario: a reader counts 17 rows as proved first-failing when four are. Verdict: none; the cases are met by the final run.

## 3. Standards

1. `src/lib/views/system/workbench/Settings.svelte:340` and the head at `:53-55`: "Whether the rail row is drawn, and whether the query alone would have hidden it." and "while that ask stands the rail row is drawn whatever the query"; the report's "`Settings.svelte` head | still true"; what is wrong: rule of the rules file's "What every package obeys", a sentence the change makes false is a defect. Every row is now mounted whatever the query, so "drawn" no longer says what `railDrawn` holds, which is that the row is in `found` and not hidden. Failure scenario: a reader of `railDrawn` takes it to be a mount and looks for a mount to wait on; `await tick()` in `showRail` now waits for an attribute. Verdict: none; item 7 does not list this file.

## 4. Behaviour

1. `src/lib/state/system/config/view/fold.ts:97-98`: "`if (queryWords(settingsQuery(state)) !== '') return mapOf(state);`"; what is wrong: a list that a query does not filter has no `searched` to keep it open, and an edit under the query now holds nothing open, so an Add from 5 to 6 folds the list under the reader, in the row's entries, in a nested list and in the rail list. At the base an edit kept the row's line open under a query too. The report's row "Settings, edit under a query | writes a kept fold | writes none" states the write and not what the reader sees. Failure scenario, from the probe: Modified on, a row of 5 entries, press Add: `list of 6 folded? true`, against `folded? false` with no query. The same with any word found in the row's title alone. The list closes, the new entry is not drawn, `Cards` is destroyed and the focus the Add asked for is lost. Item 1's reason ("so an Add from 5 to 6 does not fold the list under the reader") fails here. An open held in `searchFolds` writes no kept fold, so item 3 does not stand in its way. Verdict: none under the item's letter.

2. `src/lib/state/system/config/view/matches.ts:74-79`, `editors/Cards.svelte:149`, `editors/NestedCards.svelte:107`: "`walk.more += 1;`"; "`const places = $derived(search?.lists.get(stepsKey(path)));`"; "`searched={search?.lists.has(stepsKey(path)) ?? false}`"; what is wrong: a list whose matches all fall past the cap has no key in `lists`, so it is unfiltered and has its kept fold, while its matches are counted in `more`. The reader then sees one of these:
   - a list past 5 with no held fold: a folded line with its total, nothing saying it holds matches, and a press draws the whole list with PAGE, the matches among the rest;
   - a list of 5 or fewer, or one held open: the whole list on screen under the search, non-matches included, and the line counting entries that are on screen.

   Failure scenario, from the probe: a card with lists `a` of 30 and `b` of 3, all holding `alpha`: picks 25 of `a`, `b` open with its 3, and the line "8 more entries match this search" where 5 are off screen. Also from the probe: an entry past the cap holding an edited nested entry is drawn and counted (`"1.n":1, "":2, "more":1`). The report's judgment 5 names the folded case on `e` alone. Verdict: item 2 violated.

3. `src/lib/state/system/config/view/matches.ts:72-80`: "`let drawn = walk.edited.has(entryKey(path, index));`"; what is wrong: an edited entry is uncounted, as the brief asks, so it frees a pick, and the next match past the cap is picked, in another list if the cap had stopped there. The report does not state this. Failure scenario, from the probe: lists `a` of 25 and `b` of 9, all matching: `b` has no key; after one edit in `a`, `"0.b":1` and `more` 8. Typing in an entry of `a` unfolds `b`, which shows one entry; if the reader had pressed `b` open to read it whole, the list drops to that entry. Each further entry edited adds one more. Verdict: none.

## Declined to judge

- What only a page shows goes to the look: the six look cases; `hidden` on the `section` and the wrapper as drawn, and the spacing with the wrapper; the fold lines; a press on each part; the caret staying in an edited entry; the focus of an Add found by card id; `checkVisibility` on a hidden row in `visible` and `cards()`.
- Whether a keystroke still freezes the page: no timing or element count can be taken here. By reading: every mounted `Editor` walks its whole draft in `searchDrawn` on each change of query, with no stop at the cap since `more` needs the rest; each mounted `Fold` runs `isFolded` on each change of the tab's state; the only effect the step adds is one `$effect.pre` per `Editor` (`Editor.svelte:113`), which reads the words and writes `edited`. `Control.svelte`'s and `FieldControl.svelte`'s effects do not read the query. Whether that cost matters is the look's long-task observer.
- The run on the unchanged tree: it needs the tree at the base, which a read of the worktree does not give and which no copy under `.agents/worktrees` holds. The failures are read from the builder's transcript instead (`Tests  4 failed | 13 passed`, `Cannot find module`), before its first edit under `src`.
- The 337 lines of `unused-exports.sh` at the base, same reason; no decision rests on it, since no line of the run after names a name of the step.
- That the builder removed its case-run programs from the scratchpad: this review's own rerun wrote files of the same names into the same scratchpad, so it can no longer be told. No file of the worktree depends on them. This review wrote `case-run.mjs`, `case-run-latex.mjs`, `probe.mjs`, `probe-o111.mjs`, `unused.txt` and `o111.diff` there; `probe.mjs` and `unused.txt` may replace earlier scratch files of those names.
- The brief names no base copy though the state file's standing demand asks every brief to; that is the brief's and not the builder's, and the report says so.
- What git would track for `.scratch/migration/agents/reviews/O111-report.md` in the worktree: `git check-ignore` is outside the three commands. It shows as untracked in `git status --short`.

Reviewer usage: a672538fd7539b84e, claude-opus-5-5, 333002 tokens, 41 tool uses, 885.5 s.
