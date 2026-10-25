# O69 builder report: the bar of a project board reworked (state after repair round 1)

Everything in the brief and in repair round 1 is done. Four things the orchestrator acts on: (1) `facetValues` moved from `facets.ts` to `state.ts` to keep the import graph free of cycles, so G92's Code line in `agents/guarded.md` (which names `facetValues` in `facets.ts`) needs the orchestrator's edit, as the round's "Not sent" says; (2) three files outside the brief's write list and the round's widening were changed, each because the step or the round made a line false or a helper duplicate: `config/catalogs/vocab.yml:213`, the head comment `tests/state/boards/board/hub-facets.test.ts:1-9`, and `src/lib/state/boards/board/items.ts` (G124's code: its board sort now calls the shared `stageRank`, see "Repair round 1", item 5); (3) one whole-suite command ran in the first build (`npx vitest run --dir <scratchpad> --project unit`, stopped after about three minutes; "Test runs"), and none in the round; (4) the state file holds a new open item 342 since the first report.

## Open items of the state file (verbatim, main ledger `.scratch/migration/orchestrator-state.md:192-194`)

- 337 (2026-10-25, O60's builder's report, the breach it records; `agents/spec.md`'s rule that a builder writes no script the brief does not build): O60's builder aaf9969093ea82a29 wrote three helper scripts the brief does not build and no ruling approves, in the session's scratch folder outside the tree: `wrap.py` and `wrap2.py`, which rewrapped the comment paragraphs of the changed files at 100 columns, and `greps.sh`, which runs the brief's four reader greps over a tree and gave the report's counts of 68 reader files on the base and 85 on the worktree. (a) record it, and use nothing they printed as evidence: every rewrapped comment is judged by the reviewers' and the orchestrator's own reading of the diff, and the reader coverage by the reviewer's own greps, as open item 330 ruled for O63. Pros: the step keeps its work and no evidence rests on an unapproved script. Cons: none found. (b) send the rewraps back in the repair round to be redone by hand. Pros: no edit a script made stays. Cons: the same text again, at the cost of a round, when a read already judges each paragraph. Recommended (a); (b) is not the lazy option but costs a round for no change in the text. Left for Axel: `refute`'s Finding dispositions send an unapproved script to the user.
- 340 (2026-10-25, O60's look at landing, item 3 of `agents/briefs/O60.md`): the unknown-stage finding names the closest word of the hub's stages at any distance (`closestWord`, `src/lib/data/shapes/vocab-keys.ts:272`), as a collection entry's status finding does (`src/lib/data/snapshot/validate.ts:234`). Over the look's copy of the hub with `stages: { nascent: null }`, each of the 18 manifests at `nascent` reads 'stage "nascent" is not a word of the stages list; the closest word is failed', which points the reader at a stage that means the opposite. (a) both findings name the closest word only when it is within half the word's length in edits, rounded down, and otherwise end after 'is not a word of the stages list' (or of the statuses). Pros: no hint that misleads. Cons: a word mistyped beyond that distance gets no hint. (b) keep both as built. Pros: no change. Cons: the misleading hint on every word removed or far off. Recommended (a); (b) is the lazy option. Left for Axel: it changes the collection status finding too, which is outside O60's line, so it needs a step, and no step is scheduled without his word.
- 342 (2026-10-25, O71's first run, case 11): a hub `manifest_fields:` row whose `from` names a list that `vocab.yml`, the registries or `projects` do not hold gets no finding, from `loadConfig`, the schema-file check or the build (`config/text/findings.yml:135-140` holds no such kind; `runSchemas` turns no problem of the manifest schema's context into a finding, `src/lib/data/snapshot/schema/run.ts:243-252`), so nothing tells the hub its row names no list. (a) a step that gives such a row a finding naming the hub's file and the row's `from`, with G128's text extended and its row in `manifest-fields.test.ts`. (b) leave it. Recommended (a); (b) is the lazy option. It is a new step and needs Axel's word.

## Repair round 1

The round's brief is `agents/briefs/O69-round1.md`, answering `agents/reviews/O69-refuter.md`. Its widening of the path list, used: `tests/state/shared/hub-words.test.ts` (items 1 and 2) and `tests/state/boards/board/hub-facets.test.ts` beyond its fixture (item 3). One file beyond both: `src/lib/state/boards/board/items.ts` (item 5).

1. **G127's test checks `stageLabel`.** Done. `tests/state/shared/hub-words.test.ts`, the row that installs `lab` and `home` (now `:77`), gains, after its `chipLabel` lines (`:103-106`):

   ```ts
   expect(stageLabel('exploring')).toBe('Experimenting');
   expect(stageLabel('exploring', 'lab')).toBe('Experimenting');
   expect(stageLabel('exploring', 'home')).toBe('exploring');
   expect(stageLabel('trialling')).toBe('Trialling');
   ```

   Case 17 needs its own install, so it is its own row of the same test (`:109-116`):

   ```ts
   it("labels a stage by its row of stages where the hub's chips list the same word", () => {
       const lab = hubWith('chips: { exploring: { label: "a chip word", icon: red } }\n');
       install([{ name: 'lab', dir: lab }], 'lab');
       expect(chipLabel('exploring', 'lab')).toBe('a chip word');
       expect(stageLabel('exploring', 'lab')).toBe('exploring');
       expect(chipLabel('exploring')).toBe('a chip word');
       expect(stageLabel('exploring')).toBe('exploring');
   });
   ```

   The test's head comment gains the sentence "A stage reads by the label of its row of `stages` (`stageLabel`), also where a hub's `chips` list the same word." and is rewrapped at 100 columns. Run after the change (`npx vitest run tests/state/shared/hub-words.test.ts tests/state/boards/board/hub-facets.test.ts --reporter=verbose`):

   ```
   (passed) |unit| tests/state/shared/hub-words.test.ts > the words of each hub's records > draws each hub's cards in its own stage words and orders and labels the stage facet from the union 345ms
   (passed) |unit| tests/state/shared/hub-words.test.ts > the words of each hub's records > labels a stage by its row of stages where the hub's chips list the same word 164ms
   ```

   On the unchanged tree these rows cannot pass: `stageLabel` does not exist there. Run in the base replica (below), both fail at the first `stageLabel` call: `TypeError: stageLabel is not a function` at `tests/state/shared/hub-words.test.ts:103:16` and `:113:16` (`Tests  2 failed | 2 passed (4)`).

2. **The row's title.** Done. The row at `hub-words.test.ts:77` is now titled "draws each hub's cards in its own stage words and orders and labels the stage facet from the union"; it names no board buttons, which the step removes. Its assertions check the stage tones, `preset.stageOrder` (the stage facet's order) and the labels.

3. **G92's test with a filter in force.** Done. `tests/state/boards/board/hub-facets.test.ts:55-79`, the row "counts that value over both hubs' projects another facet's value leaves": four projects, `one` (primary hub, `zonmw`), `two` (`look-hub2`, `zonmw`), `three` (`look-hub2`, `fwo`) and `four` (`look-hub2`, `fwo`, domain `other`); the first three at the shared domain `methods`. It calls `facets(items, PRESET, false, { filters: { funding: ['zonmw'] }, search: '' })` and asserts the domain values `[{ value: 'methods', label: 'methods', count: 2 }, { value: 'other', label: 'other', count: 0 }]` (the shared domain counted over one project of each hub, and `other` still listed at 0, so the values are the whole board's) and the funding values `[['fwo', 2], ['zonmw', 2]]` (the facet in force counted over the whole board, both values listed). The head comment (`:1-9`) gains the sentence on counts under another facet's value. After the change: `(passed) ... > counts that value over both hubs' projects another facet's value leaves 7ms`. On the base replica: fails at `tests/state/boards/board/hub-facets.test.ts:71:32` with domain counts `3` and `1` received where `2` and `0` are expected (`Tests  1 failed | 2 passed (3)`), since the base counts ignore the filters.

4. **Comments rewrapped.** Done, words unchanged. Each named paragraph was rewritten whole at 100 columns. The new text of each paragraph was written by hand as an old/new pair and applied by an inline `python3` heredoc that asserted each old text occurs once and that the words of old and new are equal (ignoring the `*` and `//` comment marks); no file was left. The line widths after (`awk '{print NR, length}'`):
   - `presets.ts:190-193`: 95, 98, 98, 21 (the last line ends the paragraph).
   - `tones.ts:117-123`: 99, 98, 95, 96, 99, 99, 17.
   - `facets.ts:1-4`: 100, 95, 98, 47.
   - `facets.ts:130-136` (the doc comment of `facets`, which held `:137-138` before): 97, 100, 94, 96, 99, 99, 14.
   - `filter-menu.ts:133-138`: 98, 98, 100, 99, 98, 55.
   - `FilterBar.svelte:8-10`: 98, 100, 94.
   Each line short of 100 ends where the next word would not fit, read line by line. The two test head comments changed in this round were wrapped the same way.

5. **The reuse greps.** Each a grep of `src` and `tests` for the name and its key call, run from the worktree root after the last change:

   `stageLabel` (`grep -rn "\bstageLabel\b" src tests`), name:
   ```
   src/lib/server/content/audit/projects.ts:196:                ...sentence('audit.msg_no_venue', rules.stageLabel(project.stage)),
   src/lib/server/content/audit/publications.ts:254:    const published = [...rules.publicStages].map((one) => `"${rules.stageLabel(one)}"`).join(', ');
   src/lib/server/content/audit/publications.ts:273:                ? sentence('audit.msg_site_negative', rules.stageLabel(stage), shown)
   src/lib/server/content/audit/publications.ts:274:                : sentence('audit.msg_site_deadend', rules.stageLabel(stage), shown, published)),
   src/lib/server/content/audit/rules.ts:46:    stageLabel: (stage: string) => string;
   src/lib/server/content/audit/rules.ts:161:        stageLabel: stageLabelOf(config),
   src/lib/state/shared/words/tones.ts:245:export function stageLabel(stage: string, hub?: string): string {
   src/lib/state/boards/board/facets.ts:15:import { chipKeys, chipLabel, domainLabel, stageLabel } from '../../shared/words/tones.ts';
   src/lib/state/boards/board/facets.ts:55:    if (facet === 'stage') return stageLabel(value);
   ```
   plus the test lines of item 1. Key call (`grep -rn "stageLabels" src tests`): only `tones.ts:68`, `:141`, `:246`. The audit's `stageLabelOf` (`rules.ts:127-133`) is server code under `src/lib/server/`, which client state cannot import, and reads the `stages` rows of the one config it is given, not each hub's words; none of the hits is a client function giving a stage's label by hub.

   `byStage` (`grep -rn "\bbyStage\b" src tests`):
   ```
   src/lib/state/boards/board/items.ts:174:    const byStage = stageRank(left.project.stage, order) - stageRank(right.project.stage, order);
   src/lib/state/boards/board/items.ts:175:    if (byStage !== 0) return byStage;
   src/lib/data/shapes/catalog-files/vocab.ts:59:        const byStage = (row.stages ?? []).length > 0;
   src/lib/data/shapes/catalog-files/vocab.ts:61:        return byStage !== byChip;
   ```
   The grep showed that the first build's `byStage` in `facets.ts` computed the same rank as the local `rank` of `compare` in `items.ts` (lines 170-180 at `add19ad5`, `git show add19ad5:src/lib/state/boards/board/items.ts`): `order.indexOf(stage)`, an unknown stage after every known one. Both now call one exported `stageRank` in `presets.ts:261`, beside `FACETS`:
   ```ts
   export function stageRank(stage: string | undefined, order: readonly string[]): number {
       const at = stage === undefined ? -1 : order.indexOf(stage);
       return at < 0 ? order.length : at;
   }
   ```
   `facets.ts:89` sorts the stage values by it; `items.ts:174` keeps its local name `byStage` for the difference, as at the base. The `vocab.ts` hits are a boolean of another meaning. Key call (`grep -rn "order\.indexOf\|stageOrder\.indexOf" src`): `presets.ts:262` (the shared rank) and eight ranks over other things (`build.ts:188`, `notes.ts:188`, `literature/merge.ts:151` (sources), `files-view.ts:142`, `terminal-list.ts:162`, `Collection.svelte:282`, `:300`, `Controls.svelte:93`), none over stages. `grep -rn "\bstageRank\b" src tests`: `facets.ts:22`, `:89`, `items.ts:25`, `:174`, `presets.ts:261`.

   `without` (`grep -rn "function without\|const without\|without = " src tests`): 45 lines; the ones named `without` exactly are `entries.ts:168` (a record without edit fields), `audit-mute.ts:37` (a list without one signature), `overrides.ts:100` (a record without one key, server code), `slides.ts:147`, `characters.ts:283` (ranges), `draft.ts:202` (a list without one index), `clangd.svelte.ts:28` (a record without one instance, a closure), `hits.ts:60` (search files), `SessionList.svelte:191`, `facets.ts:123` (mine), a parameter default `shell.svelte.ts:272`, and three test-local constants (`scm.test.ts:150`, `hooks-server.test.ts:552`, `write.test.ts:153`). Two have the same shape (a record less one key): `overrides.ts:100`, under `src/lib/server/`, which client state cannot import, and `clangd.svelte.ts:28`, a closure inside another function, which nothing can import. None of the hits is an exported client helper that drops a key from a record.

   `offersMine` (`grep -rn "\boffersMine\b" src tests`):
   ```
   src/lib/state/boards/board/index.ts:60:    offersMine,
   src/lib/state/boards/board/state.ts:102:export function offersMine(items: BoardItem[], named: boolean): boolean {
   src/lib/state/boards/board/presets.ts:193:     * `offersMine`).
   src/lib/views/boards/projects/Projects.svelte:81:        offersMine,
   src/lib/views/boards/projects/Projects.svelte:119:    const mineShown = $derived(offersMine(items, named));
   ```
   Key call (`grep -rn "!item\.mine\|item\.mine)" src tests`): `state.ts:86` (the Mine only filter of `applyFilters`) and `state.ts:103` (`offersMine`); nothing else asks whether a project is one Mine only drops.

   `InForce` (`grep -rn "\bInForce\b" src tests`):
   ```
   src/lib/state/boards/board/facets.ts:120:type InForce = { filters: Record<string, string[]>; search: string; quick?: QuickFilters };
   src/lib/state/boards/board/facets.ts:142:    inForce?: InForce
   ```
   The grep finds no other type of the name; `filtersInForce` (`filter-menu.ts:160`) is a function that counts the values in force, not this shape.

The base replica of items 1 and 3: built in the scratchpad from the worktree with every changed `src` and `config` file taken from `add19ad5` and the round's two test files kept as changed, then the two files run, then removed:

```
WT=<worktree>; R=<scratchpad>/o69-base; mkdir -p $R && cd $WT && rsync -a --exclude 'config/local.yml' src tests config utils package.json tsconfig.json vite.config.ts .npmrc $R/ && rsync -a .svelte-kit $R/ && ln -s $WT/node_modules $R/node_modules && for f in $(git diff --name-only -- src config tests | grep -v '^tests/'); do git show add19ad5:$f > $R/$f; done && rm $R/src/lib/views/boards/projects/FilterBar.svelte
cd $R && npx vitest run tests/state/boards/board/hub-facets.test.ts
cd $R && npx vitest run tests/state/shared/hub-words.test.ts
rm -rf <scratchpad>/o69-base
```

`ls -d <scratchpad>/o69-base` after: `No such file or directory`. Outputs as quoted under items 1 and 3.

## The cases' first run (unchanged tree, before any change)

The state cases were run by a case-run program in the session scratchpad, outside the tree, through a scratch vitest config that loads the worktree's `vite.config.ts` and points `test.dir` at the scratchpad (source of both quoted at the end). The command, from the worktree root:

`PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH npx vitest run --config <scratchpad>/o69/vitest.config.mts --silent=false --reporter=verbose | grep '^CASE'`

`npx vitest list --config <scratchpad>/o69/vitest.config.mts` listed only the scratch file before the program ran. A function the step adds is read through the module namespace and printed as absent on the unchanged tree. Output on the unchanged tree, as printed:

```
CASE 1: stage group: no stage group; bar stage chips: in-prep 4 | submitted 6; FACETS[0]=category
CASE 2: shown 10; stage group: no stage group; funding group: zonmw 3 | fwo 1 | No funding 6
CASE 3: stage in-prep picked, funding group: zonmw 3 | fwo 1 | No funding 6
CASE 4: chips: filterChips absent; after removing Stage: chips filterChips absent, stage group no stage group; after Clear all: filters {} chips filterChips absent search 'needle'
CASE 5: parsed hiddenStages=["submitted"]; shown 4 of 10; next write holds hiddenStages: true
CASE 6: parsed filters={}; shown 10; chips: filterChips absent; after remove shown 10
CASE 7: all mine, self named: Mine only drawn offersMine absent (today: drawn while named = true); one not mine: drawn offersMine absent (today: drawn while named = true), shown with mine on 3 of 4
CASE 8: no self: Mine only drawn offersMine absent (today: drawn while named = false); role group: no role group
CASE 10: domain group, no filter: methods 3; with funding zonmw: methods 3; kept one,look-hub2:two,look-hub2:three
CASE 11: primary relabels: no stage group
CASE 11: primary keeps oculus's word, lab relabels: no stage group
CASE 17: hub chips list 'exploring' as 'a chip word': no stage group; stageLabel: absent; chipLabel: a chip word
CASE 12: facetValues(blank, 'stage')=[]; stage group: no stage group; shown with in-prep picked 11 of 11
CASE 14: search 'needle': no stage group; stale: no stage group; deadline: no stage group; Mine only: no stage group
CASE 14: board where Mine only is not drawn (rule true), saved mine true: no stage group, shown 9 of 10
CASE 15: no projects: groups (none); chips filterChips absent; Mine only drawn offersMine absent (today: drawn while named = true)
CASE 16: no self, saved role lead: chips filterChips absent; shown 0; after remove 10
CASE 18: domain group, whole board: a 6 | b 4; after in-prep pick: a 6 | b 4
```

The first run's "all mine" board of cases 7 and 14 held one project with `mine: false` (a fixture slip in the program, fixed for the final run by mapping every project to `mine: true`). On the unchanged tree it changes nothing the lines say: case 7 reads that Mine only is drawn whenever a `self` is named, and case 14's second line shows today's board hiding the one project a saved `mine: true` leaves out.

Per case, on the unchanged tree:

1. No Stage group; the bar draws two chips `in-prep 4` and `submitted 6` (the stage key, not its label). FACETS starts with `category`.
2. No Stage group, and a `stage` filter is ignored (`stage` is no facet): 10 shown. Funding counts ignore the filters: `zonmw 3`.
3. `fwo 1`: the counts ignore every filter, so no 0 appears.
4. No chips function; the view draws no chips line (read: `Projects.svelte:333-388` holds no such line).
5. `hiddenStages` is read and applied: 4 of 10 shown, and the next write stores `hiddenStages`.
6. `filters: { stage: [...] }` is dropped by `parseBoardState` (`stage` not in `FACETS`): 10 shown, no chip.
7. The Mine only chip is drawn whenever a `self` is named (`Projects.svelte:364-371`), whatever the projects.
8. No self: no Mine only chip, no Role group.
10. The domain counts over both hubs (`methods 3`), and ignore the funding filter (`methods 3`).
11, 17. No Stage group; `chipLabel('exploring')` reads the chip's label `a chip word` where a hub's `chips` lists a stage word.
12. A project with `stage: ''` gives no stage value (no facet); the stage filter is ignored, 11 of 11 shown.
14. No Stage group to count; a saved `mine: true` applies on every board with a `self`.
15. No groups; Mine only drawn with a `self`.
16. A saved `role: ['lead']` with no `self` empties the board (0 shown) with no chip and no menu row to undo it.
18. The domain counts ignore the pick (`a 6 | b 4`).

View cases, read on the unchanged tree: 4 and 13: `Chip.svelte` has no remove control (`grep -rln "onremove\|removable" src/lib/ui` printed nothing). 9 and 19: the header (`Projects.svelte:305-331`) holds New project, Expand all and Collapse; Cards/List is `ModeSwitch` and Short/Full a `Segment` in the bar (`:380-386`). 15: the bar draws its stage chips from `stageCounts(items)`, none for an empty board; the header buttons are drawn.

Guarded tests on the unchanged tree: `npx vitest run tests/state/boards/board/hub-facets.test.ts tests/state/boards/board/board-rules.test.ts` printed `Test Files  2 passed (2)` / `Tests  84 passed (84)`.

No case is one the brief's own rules get wrong. One wording difference, not a rule conflict: case 4 writes the funding chip as `Funding: none`, while item 4 has the chip read the label `valueLabel` gives, which for the funding facet's none value is the catalog's `board.no_funding`, "No funding". The chip follows item 4: `Funding: No funding`.

## The cases after the change (final run, same command)

Run again after the round's last change, with the case program's copy in `<scratchpad>/o69/` (`npx vitest list` listed only its one test first): the 18 `CASE` lines are identical to the ones below (`diff` of the two printed nothing).

```
CASE 1: stage group: in preparation 4 | submitted / under review 6; bar stage chips: stageCounts absent; FACETS[0]=stage
CASE 2: shown 4; stage group: in preparation 4 [x] | submitted / under review 6; funding group: zonmw 1 | fwo 0 | No funding 3
CASE 3: stage in-prep picked, funding group: zonmw 1 | fwo 0 | No funding 3
CASE 4: chips: Stage: in preparation {Remove Stage: in preparation} ; Funding: No funding {Remove Funding: No funding}; after removing Stage: chips Funding: No funding {Remove Funding: No funding}, stage group in preparation 1 | submitted / under review 0; after Clear all: filters {} chips (none) search 'needle'
CASE 5: parsed hiddenStages=undefined; shown 10 of 10; next write holds hiddenStages: false
CASE 6: parsed filters={"stage":["retired-stage"]}; shown 0; chips: Stage: retired-stage {Remove Stage: retired-stage}; after remove shown 10
CASE 7: all mine, self named: Mine only drawn false; one not mine: drawn true, shown with mine on 3 of 4
CASE 8: no self: Mine only drawn false; role group: no role group
CASE 10: domain group, no filter: methods 3; with funding zonmw: methods 2; kept one,look-hub2:two,look-hub2:three
CASE 11: primary relabels: exploring (home words) 1 | lab only stage 1
CASE 11: primary keeps oculus's word, lab relabels: exploring 1 | lab only stage 1
CASE 17: hub chips list 'exploring' as 'a chip word': exploring 1; stageLabel: exploring; chipLabel: a chip word
CASE 12: facetValues(blank, 'stage')=[]; stage group: in preparation 4 | submitted / under review 6; shown with in-prep picked 4 of 11
CASE 14: search 'needle': in preparation 2 | submitted / under review 1; stale: in preparation 1 | submitted / under review 0; deadline: in preparation 1 | submitted / under review 0; Mine only: in preparation 3 | submitted / under review 6
CASE 14: board where Mine only is not drawn (rule false), saved mine true: in preparation 4 | submitted / under review 6, shown 10 of 10
CASE 15: no projects: groups (none); chips (none); Mine only drawn false
CASE 16: no self, saved role lead: chips Role: Lead {Remove Role: Lead}; shown 0; after remove 10
CASE 18: domain group, whole board: a 6 | b 4; after in-prep pick: a 0 | b 4
```

The fixture: ten projects, four at `in-prep` (p0 to p3, domain `b`; p0 funded `zonmw`; p0 and p1 match the search `needle`; p1 stale; p2 dated; p3 `mine: false`) and six at `submitted` (s0 to s5, domain `a`; s0 and s1 funded `zonmw`, s2 `fwo`; s0 matches `needle`). In case 4 the board's search is `needle`, so the Stage counts after removing the stage pick read over p0 and p1 with funding none (p1 only) and s0 with `zonmw` (none): `in preparation 1 | submitted / under review 0`.

Per case, the result against the brief:

1. Met: the Stage group lists `in preparation 4` then `submitted / under review 6`; no stage chips (`stageCounts` gone).
2. Met: 4 shown; the Stage group keeps `4` and `6` under its own pick; the Funding value held by 3 projects, 1 at `in-prep`, reads `1`.
3. Met: `fwo 0` in its place.
4. Met for the state part (chips in menu order, words, removal leaves Funding and the Stage group unticked, Clear all empties the filters and the search `needle` stays). The view part (the chips line and Clear all drawn) is read in `FilterBar.svelte` and is for the look.
5. Met: no `hiddenStages` read, every stage shown, the next write (`storedState({ ...held, ... })`) holds no `hiddenStages`.
6. Met: the chip `Stage: retired-stage`, 0 shown (the view draws `board.empty` for `shown.length === 0`, `Projects.svelte:377`), removal brings the 10 back.
7. Met: no Mine only where every project is kept by it; drawn where one is not, filtering 3 of 4. G124's row "case 2: Mine only hides a project naming others, and shows it when off" passes unchanged (`npx vitest run tests/state/boards/board/board-rules.test.ts -t "case 2: Mine only" --reporter=verbose`: `Tests  1 passed | 81 skipped (82)`).
8. Met: no Mine only, no Role group.
9. View case: read in `Projects.svelte` `tools` (New project, Expand all, Collapse, Cards, List, Full titles, each a `bare` ToolButton with a glyph, so its label is its tooltip and accessible name, `ToolButton.svelte:52-53`); for the look.
10. Met: `methods 3` over both hubs; with funding `zonmw` in force, `methods 2` (one project of each hub); a filter on `methods` keeps both hubs' projects. G92's test passes (below).
11. Met: the primary's label where it holds the word (`exploring (home words)`), oculus's where the primary keeps oculus's row, and the other hub's label for a word only it holds (`lab only stage`).
12. Met: `[]`, no none row, not shown under a stage pick (4 of 11).
13. View case: the remove control is a native `<button>` with no `tabindex`, so Tab reaches it and Enter or Space presses it; Clear all is a ToolButton; for the look.
14. Met: the search leaves `in preparation 2`; stale, deadline and Mine only each lower the other facets' counts by what they remove; on a board where Mine only is not drawn, a saved `mine: true` leaves the counts and the board (10 of 10) unchanged.
15. Met: no groups, no chips, no Mine only; the header buttons are drawn unconditionally (read) and the board draws `board.empty`.
16. Met: the chip `Role: Lead` (the role's label), 0 shown, removal brings the 10 back.
17. Met: the Stage value reads `exploring` (the stages row), where `chipLabel` gives `a chip word`.
18. Met: domain keeps `a` before `b` by the whole board's counts after the pick (`a 0 | b 4`).
19. View case: `setMode` writes only when the mode differs (`if (held.mode !== mode) write({ mode })`), so a press on Cards in card mode changes nothing and Cards stays pressed; on a `cards: grid` board the header is the same and `held.mode` decides the table (`Projects.svelte:378`) or, in card mode, the grid (`:384`); for the look.

## DONE / NOT DONE

| Item | State | Proof |
|---|---|---|
| 1 Stage facet first, labelled by `stageLabel`, no value for an empty stage, heading `board.facet_stage` | DONE | cases 1, 11, 12, 17 above; round item 1 |
| 2 Stage chips, `toggleStage`, `hiddenStages`, `stageCounts`, `StageCount`, `board.stage_toggle_tip` removed | DONE | verify 4 grep below; case 5 |
| 3 Counts over the other filters, by `facets` with an optional last argument; fixture gains `stageOrder: []` | DONE | cases 2, 3, 10, 14, 18; round item 3; verify 2 |
| 4 Chips with remove control and Clear all; `filterChips` in `filter-menu.ts`; `Chip` `onremove`/`removeLabel` | DONE | cases 4, 6, 16; view read, look on landing |
| 5 Mine only drawn and applied only where it changes the board (`offersMine` in `state.ts`) | DONE | cases 7, 14, 15 |
| 6 Cards, List, Full titles in the header; `ModeSwitch.svelte` deleted; keys removed; glyph `full_titles` | DONE | verify 4 grep; view read, look on landing |
| 7 Bar moved into `FilterBar.svelte`, files under limits | DONE | verify 5 |
| 8 Words that state the bar made true | DONE | list under "Comments and documents" |
| Round 1 item 1 `stageLabel` in G127's test | DONE | "Repair round 1", item 1 |
| Round 1 item 2 the row's title | DONE | "Repair round 1", item 2 |
| Round 1 item 3 G92's row with a filter in force | DONE | "Repair round 1", item 3 |
| Round 1 item 4 rewraps | DONE | "Repair round 1", item 4 (widths) |
| Round 1 item 5 reuse greps quoted | DONE | "Repair round 1", item 5 |
| Verify 1 `npm run diagrams && npm run test:quick` | DONE | `test:quick: 61.5 s; every command passed` |
| Verify 2 guarded tests | DONE | `Test Files  3 passed (3)` / `Tests  89 passed (89)` |
| Verify 3 unused exports against the base | DONE | no line added (below) |
| Verify 4 the grep | DONE | prints only `graph.ts`'s own `stageCounts` |
| Verify 5 line counts | DONE | below |
| Verify 6 new or changed tests run before and after | DONE | the round's extended row and two new rows fail on the base replica and pass after; "Repair round 1", items 1 and 3 |
| Verify 7 prose read | DONE | below |

Verify 1, the lines `npm run test:quick` printed (run once in the round, after `npm run diagrams`, which exited 0, and after the round's last change to the tree):

```
test:quick: 30 changed file(s), from git since HEAD
test:quick: 11 test file(s)
        tests/state/boards/board/hub-facets.test.ts: changed
        tests/state/shared/hub-words.test.ts: changed
        tests/checks/source/keys.test.ts: imports at depth 1
        tests/data/hubs/workspace-projects.test.ts: imports at depth 1
        tests/state/boards/board/board-rules.test.ts: imports at depth 1
        tests/state/boards/board/items.test.ts: imports at depth 1
        tests/state/boards/map-forces.test.ts: imports at depth 2
        tests/state/sessions/terminal/moved-pane-screen.test.ts: imports at depth 2
        tests/state/workbench/count-row.test.ts: imports at depth 2
        tests/views/shared/forms/entry-add.test.ts: imports at depth 2
        tests/views/sources/bar-actions.test.ts: imports at depth 2
ok      prettier (2.8 s): All matched files use Prettier code style!
ok      svelte-kit sync (2.9 s)
ok      ASCII gate (3.0 s)
ok      vitest (45.9 s): Duration  38.54s (transform 54.49s, setup 0ms, import 61.88s, tests 7.12s, environment 3ms)
ok      eslint (56.0 s)
ok      svelte-check (57.2 s): 1792898698430 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (58.5 s): Duration  50.93s (transform 15.61s, setup 0ms, import 49.40s, tests 1.37s, environment 0ms)
test:quick: 61.5 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
```

`items.test.ts` (G124's board sort, which now calls `stageRank`) and `board-rules.test.ts` are among the 11 files and passed.

Verify 2, after the change: `npx vitest run tests/state/shared/hub-words.test.ts tests/state/boards/board/hub-facets.test.ts tests/state/boards/board/board-rules.test.ts` printed `Test Files  3 passed (3)` / `Tests  89 passed (89)`. The verbose run of the first two files lists all seven rows passed (`Tests  7 passed (7)`).

Verify 3: `sh utils/unused-exports.sh` diffed against `O69-base/unused-exports.txt` prints two changed lines and no added line:

```
126c126
< src/lib/state/boards/board/index.ts: FACETS, NONE, venueText, facetValues, facetHeading, filtersInForce, valueLabel, emptyBoardState
---
> src/lib/state/boards/board/index.ts: FACETS, NONE, venueText, facetHeading, filtersInForce, valueLabel, emptyBoardState, facetValues
284c284
< src/lib/state/boards/board/index.ts: BoardColumn, Facet, FacetValue, LabelMode, QuickFilters, SessionsOf, StageCount, VenueCount, FilterChoice, FilterGroup, WaitingLine
---
> src/lib/state/boards/board/index.ts: BoardColumn, Facet, FacetValue, LabelMode, SessionsOf, VenueCount, FilterChoice, WaitingLine
```

Line 126 lists the same names in another order (`facetValues` is re-exported from `state.ts`, so it is printed last). Line 284 loses `QuickFilters` (read by `Projects.svelte`), `StageCount` (deleted) and `FilterGroup` (read by `FilterBar.svelte`). The new exports `stageLabel`, `facetLabel`, `filterChips`, `InForceChip`, `offersMine` and `stageRank` each have an importer outside their file.

Verify 4: `grep -rn "hiddenStages\|stageCounts\|StageCount\|toggleStage\|stage_toggle_tip\|ModeSwitch\|view_cards_glyph\|view_list_glyph\|helper.short\|helper.full\|board.labels\|Aa toggle" src tests config docs --exclude=local.yml` prints:

```
src/lib/state/boards/structure/graph.ts:320:export function stageCounts(graph: Graph): Record<string, number> {
src/lib/state/boards/structure/graph.ts:375:    const counted = stageCounts(drawn);
src/lib/state/boards/structure/graph.ts:376:    const names = Object.keys(stageCounts(base));
```

The YAML keys `labels:`, `view:`, `view_cards_glyph:`, `view_list_glyph:`, `stage_toggle_tip:` (`projects.yml`) and `short:`, `full:` (`project.yml` `helper`) are removed (`git diff config/text`), and `keys.test.ts` passed inside verify 1.

Verify 5, `wc -l` after the last change: `Projects.svelte` 466, `FilterBar.svelte` 114, `Chip.svelte` 248 (limit 520); `facets.ts` 191, `filter-menu.ts` 168, `state.ts` 170, `presets.ts` 418, `items.ts` 234, `stats.ts` 149, `index.ts` 63, `tones.ts` 384 (limit 880). `ls src/lib/state/boards/board | wc -l` prints 10.

ASCII: the spec's perl gate (`perl -ne 'print ... if /[^\x00-\x7F]/'`) over every changed file but the regenerated `.svg`, `FilterBar.svelte` and this report printed nothing.

## Test runs

- `npm run test:quick` ran twice in all: once in the first build and once in the round, each after `npm run diagrams` and after that pass's last change.
- Whole-suite command, once, in the first build: to find a way to run the case program from the scratchpad, I ran `npx vitest run --dir <scratchpad>/o69 --project unit`. The `unit` project's `include` is relative to the root, so it ran the tree's unit tests (its output shows the scratch-repository rebase tests of the suite) until I killed it after about three minutes; it reported no result. `git status --short` after it printed nothing, so it left no file in the worktree. Every later case run used the scratch config, checked first with `vitest list`, which listed only the scratch file. No whole-suite command ran in the round.
- First build, single files: `tests/checks/source/keys.test.ts`, `tests/checks/imports/cycles.test.ts`, `tests/checks/tree/boundaries.test.ts`, `tests/state/shared/hub-words.test.ts`, `tests/checks/config/config.test.ts`, `tests/data/sources/config/layers/catalogs.test.ts` in one run, where `cycles.test.ts` and `boundaries.test.ts` timed out at vitest's default 5 s (those checks run with `--testTimeout 0` under `npm run test:checks`); rerun alone with `--testTimeout 0`: `Test Files  2 passed (2)` / `Tests  18 passed (18)`. The four others passed in the first run.
- First build: `npx eslint` over the changed source files printed nothing; `npx svelte-check --tsconfig ./tsconfig.json --threshold error` printed `COMPLETED 4289 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`.
- Round: the four files covering the round's changes (`hub-words.test.ts`, `hub-facets.test.ts`, `board-rules.test.ts`, `items.test.ts`) in one run, all passed (91 tests); the two new-row files on the base replica (failures quoted under "Repair round 1"); the three named files of verify 2.

## Files changed (`git diff --numstat`, added and removed lines; `FilterBar.svelte` is new)

| File | + | - | In the write list |
|---|---|---|---|
| `config/catalogs/glyphs.yml` | 1 | 0 | yes (row after `list`) |
| `config/catalogs/icons.yml` | 1 | 0 | yes (row after `list`) |
| `config/catalogs/vocab.yml` | 2 | 2 | line 52 yes; line 213 no, see below |
| `config/defaults/layout.yml` | 1 | 1 | yes (line 226) |
| `config/options/layout.yml` | 1 | 1 | yes (line 236) |
| `config/text/views/boards/project.yml` | 0 | 2 | yes |
| `config/text/views/boards/projects.yml` | 5 | 5 | yes |
| `docs/HELP.md` | 7 | 2 | yes (290 with five bullets after it, 518) |
| `docs/diagrams/layer-state.dot`, `.svg` | 1, 1 | 1, 1 | yes (regenerated) |
| `docs/diagrams/layer-views.dot`, `.svg` | 5, 5 | 5, 5 | yes (regenerated) |
| `docs/diagrams/layers.dot`, `.svg` | 2, 2 | 2, 2 | yes (regenerated) |
| `src/lib/state/boards/board/facets.ts` | 62 | 45 | yes |
| `src/lib/state/boards/board/filter-menu.ts` | 44 | 6 | yes |
| `src/lib/state/boards/board/index.ts` | 13 | 5 | yes |
| `src/lib/state/boards/board/items.ts` | 2 | 5 | no, see below |
| `src/lib/state/boards/board/presets.ts` | 15 | 15 | yes |
| `src/lib/state/boards/board/state.ts` | 55 | 11 | yes |
| `src/lib/state/boards/board/stats.ts` | 3 | 30 | yes |
| `src/lib/state/shared/words/tones.ts` | 21 | 8 | yes |
| `src/lib/ui/controls/Chip.svelte` | 59 | 8 | yes |
| `src/lib/views/boards/projects/Projects.svelte` | 78 | 109 | yes |
| `src/lib/views/boards/projects/FilterBar.svelte` | 114 (new) | 0 | yes |
| `src/lib/views/shared/card/ModeSwitch.svelte` | 0 | 29 (deleted) | yes |
| `tests/state/boards/board/hub-facets.test.ts` | 33 | 5 | fixture line 38 yes (brief); the row of round item 3 yes (round's widening); head comment no, see below |
| `tests/state/shared/hub-words.test.ts` | 20 | 4 | yes (round's widening, items 1 and 2) |

Outside the write list and the round's widening, each needed by the step or the round:

- `config/catalogs/vocab.yml:213` (the head comment of `roles`): it said a board draws "a Mine only toggle", which item 5 makes false for a project board where the toggle would change nothing. It now adds "a project board draws the toggle only where one of its projects is one the toggle does not keep". O71 writes lines 4 and 183-190 of this file, so the lines are apart.
- `tests/state/boards/board/hub-facets.test.ts:1-9` (head comment): it named `facetValues` in `facets.ts`; it now says `facets` counts "over the values state.ts's facetValues reads", and gains the sentence for the round's row.
- `src/lib/state/boards/board/items.ts:25`, `:174` (G124's code, `compare`, the board's sort): its local `rank` was the same function as the first build's `byStage` in `facets.ts`; round item 5's reuse grep found it, and both now call `stageRank` (`presets.ts:261`). The sort is unchanged in what it computes (pinned first, then the stage's place in `order` with an unknown stage last, then the title); `items.test.ts` and `board-rules.test.ts` passed in verify 1 and in the round's file run.

## Judgment calls the brief left open (each reversible)

1. `facetValues` lives in `state.ts`. Item 3 has `facets` (in `facets.ts`) call `applyFilters` (in `state.ts`), and `state.ts` imported `facetValues` from `facets.ts`; both at once is a runtime import cycle, which `tests/checks/imports/cycles.test.ts` refuses. With `facetValues` in `state.ts`, `facets.ts` imports `state.ts` and nothing imports back. `index.ts` re-exports it from `state.ts`, so the facade is unchanged. G92's Code line in `agents/guarded.md:288` ("`facets` and `facetValues` in `src/lib/state/boards/board/facets.ts`") is wrong about `facetValues` and needs the orchestrator's edit; the other choice, `applyFilters` moved into `facets.ts`, would make its "`applyFilters` in state.ts" wrong instead.
2. The label of a chip for a value the board does not offer is `facetLabel`'s, exported from `facets.ts` with its resource map made optional. It is the value itself where the config names nothing (`Stage: retired-stage`), the role's label for a role (case 16: `Role: Lead`), and through `valueLabel` the catalog word for the none values (`Year: No year`, not `Year: __none__`). Item 4's "the stored value itself" read literally would print the internal `__none__` and the role key, and case 16 asks for the role's label.
3. The chip type is named `InForceChip`, since `src/lib/state/boards/collection.ts:490` has a local `FilterChip` type of another shape.
4. The remove control is a native `<button>` inside `Chip.svelte` (a `ui/` primitive, as `TabFace.svelte`'s close button is), with the `dismiss` glyph, a `Tooltip` and `aria-label` from `removeLabel`; its box gives the 16 px icon back the room over the 11 px line as the chip's own glyph does, the accent on hover and on keyboard focus.
5. Clear all is a `small` ToolButton (text with the `clear_all` glyph) after the chips. The chips line is a box `flex: 1 0 100%` inside the pane's wrapping `.viewbar`, so it starts its own line under the controls.
6. A press on Cards or List while that mode is in force writes nothing (`setMode` compares first). Full titles writes `labels: 'full'` or `'short'`.
7. The counting reuses the result of every filter for a facet with no value picked, and runs `applyFilters` once more without that facet's values for each facet that has one.
8. `facets` takes `{ filters, search, quick? }` as its last argument through a local type `InForce` (not exported).
9. The stage values of the menu and the board's sort share one rank, `stageRank`, exported from `presets.ts` beside `FACETS` (both callers already import `presets.ts`, so no import is added across files that did not have one).

## Host- or user-visible changes, before and after (for the look on TEST)

- A project board's bar, any board with projects at several stages. Before: one chip per stage (`in-prep 4`, `submitted 6`) after the Mine only chip, then the Cards/List segment and the Short/Full segment. After: the bar holds the search, Filter, stale, deadline and, where it changes the board, Mine only; no stage chips and no segments.
- The Filter menu. Before: Category first, no Stage group. After: the Stage group first, headed "Stage", its values by their labels (`in preparation 4`, `submitted / under review 6`) in the order of `stages`. Pick a stage and open the menu again: the Stage group's counts stay, every other facet's counts drop to the projects at that stage, and a value with none left reads 0 in its place.
- Pick Stage `in-prep` and Funding none. After: under the bar a line with `Stage: in preparation x`, `Funding: No funding x` and a Clear all button; hover on an x reads `Remove Stage: in preparation`; Tab reaches each x and Clear all, Enter or Space on an x takes that value out; Clear all takes both out, the search stays, and the line goes.
- Mine only. Before: drawn on every board while a `self` is named. After: on the Projects board, where every project names the user, it is not drawn and a saved `mine: false` changes nothing; on Coauthor, where a project names others, it is drawn and filters.
- The pane's header. Before: New project (where offered), Expand all, Collapse. After: those, then Cards, List and Full titles as icon buttons with tooltips "Cards", "List", "Full titles"; Cards pressed in card mode, List in list mode, Full titles pressed while full titles are drawn (Lucide `whole-word`, `Aa` under a terminal theme). A press on List draws the table; on a `cards: grid` board Cards draws the grid. On a narrow pane the header's overflow menu holds the buttons that do not fit; whether it draws the pressed state there is not verified.
- A board saved with stages switched off now shows every stage once.
- The Settings help of `label_mode` reads "The Full titles button in the board's header overrides it for the viewer".

## Comments and documents

Each changed sentence was read against `spec.md`'s prose rules: plain sentences, no history, comments rewrapped as paragraphs at 100 columns (the paragraphs the refutation named are rewrapped in round item 4), and `HELP.md` as one line per bullet. Departure: `HELP.md:290` stays one long bullet, as it was, with the Mine only sentence rewritten in place; the five new bullets after it are short.

Rewritten: the head comment of `Projects.svelte`; the head comments of `facets.ts`, `state.ts`, `filter-menu.ts`, `stats.ts:1`, `Chip.svelte` (first paragraph and the toggle paragraph); the doc comments of `facets`, `facetLabel`, `applyFilters`, `BoardState.mine`, `QuickFilters`, `FACETS`, `installed` in `tones.ts`; `docs/HELP.md:290` and the bullets after it, `:523` (was 518); `vocab.yml:52`, `:213`; `config/defaults/layout.yml:226`; `config/options/layout.yml:236`; the head comments of `hub-facets.test.ts` and `hub-words.test.ts`.

Still true, read after the change: the doc comments of `parseBoardState`, `emptyBoardState`, `isStale`, `filterGroups`, `valueLabel`, `facetHeading`, `filtersInForce`, `filterLabel`, `cardSections`, `orderValues`, `chipLabel`; `presets.ts`'s head comment; `tones.ts`'s head comment; the comment of `compare` in `items.ts` ("Pinned first, then the config's stage order, then the title."); `src/lib/state/client/selectors.svelte.ts:180` (a `self` is still needed for Mine only); `Pane.svelte:10-13`; `docs/apps.md` and `README.md` name no part of the bar (`grep -n -i "facet\|filter menu" docs/apps.md README.md` printed nothing).

New sentences added: `stageLabel`, `stageRank`, `InForce`, `without`, `filterChips`, `InForceChip`, `offersMine`, `facetValues`'s doc comment, the comment on the stage order inside `facets`, the `Chip` props `onremove` and `removeLabel` and the `.remove` style comment, the `FilterBar.svelte` head comment, props and style comment, the `mineShown`, `offered`, `counted` and `setMode` comments in `Projects.svelte`, the sentences the round adds to the two test head comments.

History-word grep over every added line and `FilterBar.svelte` (`git diff -U0 | grep '^+'` plus the new file, `grep -i "before\|used to\|no longer\|still\|always has been\|always had\|as before\|previously\|the step adds\|after this package lands\|O69\|O7[01]"`), three hits, none history:

```
+ * everything is still the board saying what its one value is, and the reader can read it. The role
+ * projects, read before any filter, is one Mine only does not keep. On any other board it would
+       back the room it takes over the 11 px line, as the glyph before the label is, and the accent
```

The first is an existing sentence of `facets`'s doc comment, rewrapped ("still" means "even so"); the second is `offersMine` (the order of reading); the third is `Chip.svelte` (a position).

Names grep after the change (`grep -rn -i "stage button\|stage toggle\|stage chip\|title length\|Short/Full\|Cards/List\|short or full" src tests config docs README.md --exclude=local.yml --exclude-dir=diagrams`): the card's stage chip (`presets.ts:107`), the Map's stage chips (`graph.ts:7`, `Legend.svelte:11`, drawn by the Map's own bar, `src/lib/views/structure/map/Controls.svelte:9`), the Present slide's stage chips (`Project.svelte:2`) and `Projects.svelte:34` "a short or full title", each still true.

## Ids, keys and paths in flight

- The facet key `stage`: one entry of `FACETS`, no other facet of that name; a saved `filters.stage` was dropped at the base and is read now (case 6).
- Text keys `board.facet_stage`, `board.filter_chip`, `board.filter_clear`, `board.filter_remove`, `board.full_titles`: each once in the `board` group of `projects.yml`, each read (`keys.test.ts` passed in verify 1). Glyph name `full_titles`: one row in each catalog.
- The chips' each-key is facet and value joined by a newline; a value is in a facet's list once, since a pick toggles it.
- The exported name `stageRank`: one definition (`presets.ts:261`), two callers (`facets.ts:89`, `items.ts:174`).
- No asynchronous path is added.

## Wrong or impossible in the brief

- Item 3 and G92's Code line together ask for an import cycle; resolved by judgment call 1, and G92's Code line needs the orchestrator's edit.
- Case 4's example word `Funding: none` is the catalog's `No funding`, as item 4's rule gives.

## Limits and sharp edges

- Not verified: whether the header's overflow menu draws Cards, List or Full titles as pressed when they overflow.
- The counts run `applyFilters` once per facet with a value picked, over every project of the board; with 13 facets the cost is at most 14 passes over the board's projects per state change. Not measured.
- The remove control's look at the terminal themes (the chip's bracket rule draws `[` and `]` around the whole chip, the x inside) is for the look.
- Item 3's counting uses the search, stale, deadline and Mine only only as the view hands them; the view hands Mine only as `mineShown && held.mine`.
- Tests: the round extends one row and adds one under G127 (`hub-words.test.ts`) and adds one under G92 (`hub-facets.test.ts`). No entry of `agents/guarded.md` covers `filterChips` or `offersMine`, so neither has a test; their behaviour is shown by cases 4, 6, 7, 14, 15 and 16 of the case program.

## The case-run program of the first build (scratchpad)

The folder `<scratchpad>/o69/` holds now the reviewer's copy of these two files (refutation line 83); I leave it. The round ran it once, read only, after its last change ("The cases after the change"); the round's rows are tests in the tree.

`<scratchpad>/o69/vitest.config.mts`:

```
import base from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O69/vite.config.ts';
export default async (env: { command: string; mode: string }) => {
    const config = await (base as unknown as (e: unknown) => Promise<Record<string, any>>)(env);
    return {
        ...config,
        root: '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O69',
        test: { ...config.test, projects: undefined, dir: '<scratchpad>/o69', include: ['tests/*.test.ts'] }
    };
};
```

`<scratchpad>/o69/tests/o69-cases.test.ts`:

```
// Case-run program of step O69: prints each case's result over the board's state functions. It
// runs on the unchanged tree and on the changed one: a function the step adds is read through the
// module's namespace and reported as absent where the tree has none.

import { expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O69/src/lib/data/sources/config.ts';
import { setCatalog } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O69/src/lib/state/shared/words/text.ts';
import * as tones from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O69/src/lib/state/shared/words/tones.ts';
import * as board from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O69/src/lib/state/boards/board/index.ts';
import * as stateMod from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O69/src/lib/state/boards/board/state.ts';
import * as menuMod from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O69/src/lib/state/boards/board/filter-menu.ts';
import { storedState } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O69/src/lib/state/workbench/layout/instance.ts';

const { config: CONFIG } = loadConfig(engineDir());
setCatalog(textCatalog(CONFIG));
const OWN = (CONFIG as Record<string, unknown>);
const any = board as unknown as Record<string, any>;
const st = stateMod as unknown as Record<string, any>;
const mn = menuMod as unknown as Record<string, any>;
const tn = tones as unknown as Record<string, any>;

type Opt = { stage?: string; funding?: string[]; domain?: string; search?: string; stale?: boolean; dated?: boolean; mine?: boolean; root?: string; role?: string };
function item(id: string, o: Opt): any {
    const key = (one: string): string => (o.root === undefined ? one : `${o.root}:${one}`);
    return {
        id: key(id),
        project: { id: key(id), stage: o.stage, staleDays: o.stale === true ? 30 : undefined, deadline: o.dated === true ? '2026-12-01' : undefined, ...(o.root === undefined ? {} : { root: o.root }) },
        category: '', role: o.role ?? '', year: '', lead: false, mine: o.mine ?? true,
        domain: o.domain === undefined ? null : { id: key(o.domain), label: o.domain, tone: '' },
        pillars: [], datasets: [], chips: [], compute: [], reproduced: false, code: '', sessions: 'none',
        funding: (o.funding ?? []).map((f) => ({ id: key(f), label: f, tone: '' })),
        haystack: o.search ?? ''
    };
}
const PRESET = board.presetFor('projects', CONFIG);
const NONE = board.NONE;

function setOwn(): void {
    tn.setVocab({ primary: null, lists: {}, order: [], own: OWN });
}
setOwn();

/** The ten projects of case 1: four at in-prep, six at submitted. */
function ten(): any[] {
    const out: any[] = [];
    for (let i = 0; i < 4; i += 1) out.push(item(`p${i}`, { stage: 'in-prep', funding: i === 0 ? ['zonmw'] : [], domain: 'b', search: i < 2 ? 'needle' : '', stale: i === 1, dated: i === 2, mine: i !== 3 }));
    for (let i = 0; i < 6; i += 1) out.push(item(`s${i}`, { stage: 'submitted', funding: i < 2 ? ['zonmw'] : i === 2 ? ['fwo'] : [], domain: 'a', search: i === 0 ? 'needle' : '', mine: true }));
    return out;
}
type InForce = { filters: Record<string, string[]>; search: string; quick: Record<string, unknown> };
const none = (): InForce => ({ filters: {}, search: '', quick: {} });
function offered(items: any[], inForce: InForce, named = false): any[] {
    return (board.facets as any)(items, PRESET, named, inForce);
}
function group(items: any[], inForce: InForce, key: string, named = false): string {
    const groups = board.filterGroups(offered(items, inForce, named), inForce.filters, PRESET);
    const found = groups.find((one) => one.id === key);
    return found === undefined ? `no ${key} group` : found.items.map((one) => `${one.label}${one.active ? ' [x]' : ''}`).join(' | ');
}
function shown(items: any[], inForce: InForce): number {
    return board.applyFilters(items, inForce.filters, inForce.search, inForce.quick as any).length;
}
function chips(inForce: InForce, named = false, items: any[] = ten()): string {
    if (typeof mn.filterChips !== 'function') return 'filterChips absent';
    const list = mn.filterChips(offered(items, inForce, named), inForce.filters, PRESET) as { label: string; remove: string }[];
    return list.length === 0 ? '(none)' : list.map((one) => `${one.label} {${one.remove}}`).join(' ; ');
}
const stageChips = (items: any[]): string => (typeof any.stageCounts === 'function' ? any.stageCounts(items, PRESET.stageOrder).map((one: any) => `${one.stage} ${one.count}`).join(' | ') : 'stageCounts absent');
const mineRule = (items: any[], named: boolean): string => (typeof st.offersMine === 'function' ? String(st.offersMine(items, named)) : `offersMine absent (today: drawn while named = ${named})`);
const line = (n: string, text: string): void => console.log(`CASE ${n}: ${text}`);

it('runs every case', () => {
    const items = ten();
    line('1', `stage group: ${group(items, none(), 'stage')}; bar stage chips: ${stageChips(items)}; FACETS[0]=${board.FACETS[0]}`);

    const c2: InForce = { filters: { stage: ['in-prep'] }, search: '', quick: {} };
    line('2', `shown ${shown(items, c2)}; stage group: ${group(items, c2, 'stage')}; funding group: ${group(items, c2, 'funding')}`);

    line('3', `stage in-prep picked, funding group: ${group(items, c2, 'funding')}`);

    const c4: InForce = { filters: { stage: ['in-prep'], funding: [NONE] }, search: 'needle', quick: {} };
    const c4a: InForce = { filters: { funding: [NONE] }, search: 'needle', quick: {} };
    const c4b: InForce = { filters: {}, search: 'needle', quick: {} };
    line('4', `chips: ${chips(c4)}; after removing Stage: chips ${chips(c4a)}, stage group ${group(items, c4a, 'stage')}; after Clear all: filters ${JSON.stringify(c4b.filters)} chips ${chips(c4b)} search '${c4b.search}'`);

    const held5 = board.parseBoardState({ hiddenStages: ['submitted'], filters: {} }, 'short', offered(items, none()), PRESET.categories.map((one) => one.key)) as any;
    const quick5 = { hiddenStages: held5.hiddenStages };
    const next5 = storedState({ ...held5, search: 'x' }, ['expanded', 'more']);
    line('5', `parsed hiddenStages=${JSON.stringify(held5.hiddenStages)}; shown ${board.applyFilters(items, held5.filters, '', quick5 as any).length} of 10; next write holds hiddenStages: ${'hiddenStages' in next5}`);

    const held6 = board.parseBoardState({ filters: { stage: ['retired-stage'] } }, 'short', offered(items, none()), PRESET.categories.map((one) => one.key));
    const c6: InForce = { filters: held6.filters, search: '', quick: {} };
    line('6', `parsed filters=${JSON.stringify(held6.filters)}; shown ${shown(items, c6)}; chips: ${chips(c6)}; after remove shown ${shown(items, none())}`);

    const allMine = ten().map((one) => ({ ...one, mine: true }));
    const coauthor = [...ten().slice(0, 3), item('other', { stage: 'submitted', mine: false })];
    line('7', `all mine, self named: Mine only drawn ${mineRule(allMine, true)}; one not mine: drawn ${mineRule(coauthor, true)}, shown with mine on ${board.applyFilters(coauthor, {}, '', { mine: true }).length} of ${coauthor.length}`);

    line('8', `no self: Mine only drawn ${mineRule(coauthor, false)}; role group: ${group(items, none(), 'role', false)}`);

    const hubs = [item('one', { stage: 'in-prep', domain: 'methods', funding: ['zonmw'] }), item('two', { stage: 'submitted', domain: 'methods', root: 'look-hub2', funding: ['zonmw'] }), item('three', { stage: 'submitted', domain: 'methods', root: 'look-hub2' })];
    const c10: InForce = { filters: { funding: ['zonmw'] }, search: '', quick: {} };
    line('10', `domain group, no filter: ${group(hubs, none(), 'domain')}; with funding zonmw: ${group(hubs, c10, 'domain')}; kept ${board.applyFilters(hubs, { domain: ['methods'] }, '').map((one) => one.id).join(',')}`);

    const relabel = (label: string, extra: Record<string, unknown> = {}): Record<string, unknown> => ({ ...OWN, stages: { ...(OWN.stages as Record<string, unknown>), exploring: { ...((OWN.stages as Record<string, any>).exploring), label }, ...extra } });
    const hubVocab = (words: Record<string, unknown>): Record<string, unknown> => ({ words, domains: {}, venue_themes: [], data_themes: [], collections: [] });
    const explorer = [item('e1', { stage: 'exploring' }), item('e2', { stage: 'lab-only' })];
    const lab = relabel('exploring (lab words)', { 'lab-only': { label: 'lab only stage', icon: 'white', color: '#7c5cff' } });
    tn.setVocab({ primary: 'home', lists: { home: hubVocab(relabel('exploring (home words)')), lab: hubVocab(lab) }, order: ['home', 'lab'], own: OWN });
    line('11', `primary relabels: ${group(explorer, none(), 'stage')}`);
    tn.setVocab({ primary: 'home', lists: { home: hubVocab(OWN), lab: hubVocab(lab) }, order: ['home', 'lab'], own: OWN });
    line('11', `primary keeps oculus's word, lab relabels: ${group(explorer, none(), 'stage')}`);
    tn.setVocab({ primary: null, lists: { home: hubVocab({ ...OWN, chips: { ...(OWN.chips as Record<string, unknown>), exploring: { label: 'a chip word', icon: 'red' } } }) }, order: ['home'], own: OWN });
    line('17', `hub chips list 'exploring' as 'a chip word': ${group([item('e1', { stage: 'exploring' })], none(), 'stage')}; stageLabel: ${typeof tn.stageLabel === 'function' ? tn.stageLabel('exploring') : 'absent'}; chipLabel: ${tones.chipLabel('exploring')}`);
    setOwn();

    const blank = [...ten(), item('blank', { stage: '' })];
    const f12 = typeof any.facetValues === 'function' ? JSON.stringify(any.facetValues(blank.at(-1), 'stage')) : 'facetValues absent';
    line('12', `facetValues(blank, 'stage')=${f12}; stage group: ${group(blank, none(), 'stage')}; shown with in-prep picked ${shown(blank, c2)} of ${blank.length}`);

    const c14s: InForce = { filters: {}, search: 'needle', quick: {} };
    const c14st: InForce = { filters: {}, search: '', quick: { stale: true } };
    const c14d: InForce = { filters: {}, search: '', quick: { dated: true } };
    const c14m: InForce = { filters: {}, search: '', quick: { mine: true } };
    line('14', `search 'needle': ${group(items, c14s, 'stage')}; stale: ${group(items, c14st, 'stage')}; deadline: ${group(items, c14d, 'stage')}; Mine only: ${group(items, c14m, 'stage')}`);
    const allMineRule = typeof st.offersMine === 'function' ? st.offersMine(allMine, true) : true;
    const c14n: InForce = { filters: {}, search: '', quick: { mine: allMineRule && true } };
    line('14', `board where Mine only is not drawn (rule ${String(allMineRule)}), saved mine true: ${group(allMine, c14n, 'stage')}, shown ${shown(allMine, c14n)} of ${allMine.length}`);

    line('15', `no projects: groups ${board.filterGroups(offered([], none()), {}, PRESET).map((one) => one.id).join(',') || '(none)'}; chips ${chips(none(), false, [])}; Mine only drawn ${mineRule([], true)}`);

    const c16: InForce = { filters: { role: ['lead'] }, search: '', quick: {} };
    line('16', `no self, saved role lead: chips ${chips(c16)}; shown ${shown(items, c16)}; after remove ${shown(items, none())}`);

    const c18: InForce = { filters: { stage: ['in-prep'] }, search: '', quick: {} };
    line('18', `domain group, whole board: ${group(items, none(), 'domain')}; after in-prep pick: ${group(items, c18, 'domain')}`);
    expect(true).toBe(true);
});
```
