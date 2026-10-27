# O92 refuter report: the collection's Add and bar, and the Map's bar

## Verification lines (verbatim)

Command, run from `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O92` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`, in the foreground: `npm run diagrams && npm run docs:palette && npm run test:quick -- --base a964e0170`. It exited 0. Afterwards `git status --short` listed the same 52 lines as before, so diagrams and palette reproduced the builder's committed files.

```
test:quick: 55 changed file(s), from git since a964e0170
test:quick: 31 test file(s)
ok      svelte-kit sync (3.0 s)
ok      prettier (3.0 s): All matched files use Prettier code style!
ok      ASCII gate (3.0 s)
ok      vitest slow (20.9 s): Duration  10.60s (transform 2.36s, setup 0ms, import 7.55s, tests 1.14s, environment 0ms)
ok      eslint (64.7 s)
ok      svelte-check (77.4 s): 1793101687245 COMPLETED 551 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (82.4 s): Duration  72.06s (transform 179.08s, setup 0ms, import 203.94s, tests 19.62s, environment 247ms)
ok      vitest checks (84.6 s): Duration  74.10s (transform 38.28s, setup 0ms, import 159.91s, tests 100.74s, environment 2ms)
test:quick: 87.8 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

The report quotes 54 changed files and I count 55. The extra file is the untracked report itself.

The other checks of "Verify before you report", rerun:

- **Verify 2, line counts.** `wc -l` of every changed or added file gives exactly the report's numbers. The largest are focus.ts 690, presets.ts 664, collection/index.ts 632, Projects.svelte 471 and Collection.svelte 469. No source file is over 880 and no component over 520.
- **Folder counts.** `ls <folder> | wc -l` gives views/shared/forms 10, views/shared/forms/bar 4, state/boards/structure 7, state/boards/collection 3, state/boards/board 10, data/shapes/boards 7, views/boards/collection 5, views/boards/projects 3, views/structure/map 4.
- **Verify 3, the six test files run alone.** `npx vitest run tests/views/shared/forms/entry-add.test.ts tests/state/forms/new-entry.test.ts tests/state/boards/board/hub-facets.test.ts tests/state/boards/board/board-rules.test.ts tests/state/boards/board/board-views.test.ts tests/state/forms/choices.test.ts`:
  ```
  Test Files  6 passed (6)
       Tests  168 passed (168)
  ```
- **Verify 4, unused exports.** `sh utils/unused-exports.sh` (exit 0), then a diff with `.agents/worktrees/O92-base/unused-exports.txt` (diff exit 1). Only removals, no new unused export:
  ```
  129c129
  < src/lib/state/boards/collection/index.ts: STATUS_FIELD, emptyCollectionState, kindOf, hasStatusField, statusValues
  ---
  > src/lib/state/boards/collection/index.ts: kindOf, hasStatusField, statusValues
  132c132
  < src/lib/state/boards/structure/graph.ts: stageCounts, lineCounts
  ---
  > src/lib/state/boards/structure/graph.ts: stageCounts
  ```
- **Verify 5, the stale-name grep** in the brief's form printed nothing (exit 1).
- **Verify 6, the history-id grep** printed nothing (exit 1).
- **Verify 7, the ASCII gate.** The perl form over `$(find src tests config -type f ! -name local.yml)` printed nothing (exit 0); `ls -d bin` answers "No such file or directory". `LC_ALL=C grep -n '[^ -~]'` over the report printed nothing (exit 1).
- **Commands the report quotes, rerun:**
  - eslint over every changed `.ts` and `.svelte` file: exit 0.
  - `npx tsc --noEmit -p .`: exit 0.
  - `npx prettier --check` over every changed file: "All matched files use Prettier code style!".
- **The case-run program.** I wrote its three files back from the report's quoted source into the scratchpad and ran it: `CASE_ROOT=<worktree> node --import ./register.mjs cases.mjs`, exit 0.
  - On the worktree, its output is byte-equal to the report's last run (`diff` exit 0).
  - On `.agents/worktrees/O92-base`, it is equal to the report's first run except for one added line, `case 37b: ... maps_to: line, value ""`. The report says row 37b was added after the first run.
  - I removed my copies afterwards.

## Item verdicts

1. The prompt's multi-pick: **holds**. `prompt.ts`: `PromptField.picked`, `PickWords`, `act(values, picked)`, `answered`. `Prompt.svelte` draws `MultiSelect` and reads `answered`. Only `hubField` (entry-add.ts:174) marks a prompt field required, and it has choices, so a required typed line is not affected by the new rule.
2. The Add asks each field by its type: **holds**. Cases 1-7 and 32-36 reproduce. Case 37 is wrong in the brief (finding S3).
3. The shared bar: **holds, with findings S1 and S2**. The partials are moved. `PickMenu.svelte` differs from the base only in the head-comment hunks 2-8 and 19-20. `FilterBar` takes the brief's props.
4. The collection's bar as the board's: **holds**. Cases 8-16 and 38 reproduce. `FieldFilters.svelte` and `HubChips.svelte` are deleted. Their keys are removed from `collection.yml`, except `filters`, which the new bar reads.
5. The collection's list: **holds**. Case 17 reproduces. `EntryList.svelte` sits over `Table`, `fittedColumns` drops columns, the title is kept, and Reveal works in list mode. The card move acts only in cards mode (Collection.svelte:316).
6. The Map's bar as the board's: **holds, with finding S5**. Cases 18-25 and 39-42 reproduce, and `Controls.svelte` is deleted.
7. The Tier facet: **holds**. Cases 43 and 44 reproduce. `facet_tones` gains `tier: indigo`, and `board.facet_tier` is in key order.
8. The words and the help: **holds, with finding St8**. HELP.md:275, 277, 305, 306 and 313 are rewritten, and `lists.ts:2` too. `map.yml`, `collection.yml` and `projects.yml` are ordered as the brief says.
9. The tests (G134): **holds, with finding S4**. The new rows are in `entry-add.test.ts`. The report quotes their failing run on the unchanged tree (6 failed, 8 passed), and the file passes now.

## Case verdicts

- 1-7: **met**. My rerun shows the same lines as the report's last run: fields in schema order, the picks and multi-picks, the body, Lead left empty for no user or a user the choices do not hold, radar, venues, and the hub asked last.
- 8-17: **met**, same check.
- 18-25: **met**, same check.
- 26-31: **not verifiable here.** They are settled by the look on localhost:8790 at landing, in the views and states the report lists under "The looks on landing": Tasks Add, Tasks or Talks & Events bar, Literature bar, a collection in List mode, the Map, and a project board.
- 32: **met**.
- 33: **met by reading.** `AddAsk.svelte:23-24`, `48-49` and `72-73` keep the typed values in `typed` and the picks in `kept` on a refusal and hand both back. The press part is settled by look 26. See P1.
- 34-36: **met**.
- 37: **unmet as written**, because the brief is wrong (S3). The optional `maps_to` is not asked, which is what item 2 and ruling 471 say.
- 38-44: **met**.
- 45: **not verifiable here.** It is settled by the look at landing: the Lead track record board's More holds Tier with each tier its projects are at, and the Projects board's Tier lists Research alone.

## Spec

**S1. SliceLine takes a different handler than the brief names.** `src/lib/views/shared/forms/bar/SliceLine.svelte:56-66`:

```
words: (shown: number, total: number) => string;
...
onfilters: (filters: Record<string, string[]>) => void;
```

- **What is wrong:** item 3 names `ontoggle`, `onslices` and `onclear`. The builder built one `onfilters` that hands back the whole filters a press leaves, and added a `label` prop (judgment call 9: the duplication check refused the three repeated handlers).
- **Effect today:** none. A slice press gives `withPick`, a category gives `withPicks` and Clear all gives `{}`, the same records the base board wrote.
- **Failure scenario:** a later caller that must keep a key of `filters` across Clear all cannot do it from inside the partial.
- **For the orchestrator:** accept or reject the substitute.

**S2. A project-board behaviour change that no item asks for.** `SliceLine.svelte:187-188`:

```
onpick={(_category: string, value: string) =>
    onfilters(withPick(filters, facet, value))}
```

- **What is wrong:** item 3 says the board's behaviour does not change.
- **The base defect is real.** At the base, `SliceLine.svelte` passed `onpick={ontoggle}`, and `sliceChoices` gives each folded group the id `group.key`, so a pick in the "+<n>" list wrote `filters[<category key>]` and picked no slice (`git show a964e0170:src/lib/state/boards/board/filter-menu.ts`, the end of `sliceChoices`).
- **Disclosure:** the fix is in judgment call 13 and in "Visible changes" with its before and after.
- **For the orchestrator:** recommend keeping it as a fix of delivered work (spec.md:95). Look 31 checks it.

**S3. Case 37 contradicts item 2 and ruling 471.**

- Item 2 asks only the primary key, the fields marked `required: true` and the three people fields. So the optional radar `maps_to` is not asked, and case 37 cannot be met.
- The builder was right on the substance. But the brief says a wrong case is handed back before any code changes. The builder added row 37b to the case-run program mid-build and raised the point only in the final report.
- **For the orchestrator:** a correction to the brief. The built behaviour matches the ruling.

**S4. Premise 17 does not reproduce.**

- `grep -o "[^;]*entry-add.test.ts[^;]*" .scratch/migration/agents/guarded.md` prints two hits:
  ```
   the hub an Add writes to: `tests/views/shared/forms/entry-add.test.ts`, every row
   `tests/views/shared/forms/entry-add.test.ts`, describe 'the page an Add opens'
  ```
  Both are in G8 (`guarded.md:72`). The base has the same two lines (`git show a964e0170:.scratch/migration/agents/guarded.md | grep -c entry-add` gives 2).
- After the step, the file's head comment cites G134 alone, while the old rows' titles still end "(G8)" and G8's Test line still names the file.
- **Failure scenario:** two entries claim the same rows, against spec.md:59 ("one entry"), once G134 is added at landing with "every row".
- **For the orchestrator:** decide at landing which entry keeps the 'the hub an Add writes to' rows and the 'the page an Add opens' describe, and make the titles and the head comment agree.

**S5. `map.filters` is kept although item 6 names it for removal.** `config/text/views/structure/map.yml:12`, `filters: Map filters`, read by `Map.svelte` as `label={t('map.filters')}`. Item 6 says "the words the Map no longer draws are removed ... (`map.filters` and `map.line_glyph` among them)". The builder reuses it as line 1's accessible name (judgment call 8) and adds `map.slices`, `collection.slices` and `collection.title_column`, none of which the brief names. These are low-impact words; the orchestrator accepts or reverses.

**S6. Paths written outside the brief's list.** Every one is listed in the report with its reason:

- `tiers.ts` and `focus.ts`, to avoid an import cycle;
- `roles.ts` (`role`);
- the options help in `config/options/catalogs/vocab.yml`;
- `NoFundingCard.svelte`;
- `glyphs.yml` and `icons.yml` (the orphan `square_filled`);
- `table-rows.ts`, `BoardList.svelte`, `ModeButtons.svelte` and `state.ts:216-244`, for the duplication check;
- the head comments of `presets.ts` and `filter-menu.ts`.

One range is not named: `presets.ts` `mapPreset` at lines 580-615, past the listed 500-580. Each of these widenings is internal and changes nothing a user sees beyond the step's own items.

## Proof

**P1. The report's reading for case 33 does not match the code.** The report says the box keeps `kept = { values, picked }` and hands back `kept.values[at]`. The code holds `let typed = $state<string[] | null>(null);` and `let kept = $state<string[][] | null>(null);` (`AddAsk.svelte:23-24`), and sets `typed = values; kept = picked;` (`:72-73`). The behaviour it claims holds; the quoted reading is not the code.

**P2. A file-scope mutable object is handed to callers.** `src/lib/state/boards/structure/graph.ts:54`:

```
const SHOW_DEFAULT: GraphShow = { projects: true, pillars: true, team: false };
```

It is used as `.catch(SHOW_DEFAULT)` (graph.ts:383), so `parseMapState` returns that one object.

- **Probe (a scratchpad run of graph.ts):** `parseMapState({}).show === parseMapState({ show: 'x' }).show` prints `true`, and `Object.isFrozen` prints `false`.
- **Collection state:** `parseCollectionState(null)` now falls to `collectionStateShape.parse({})` (collection/index.ts:136). A probe shows that `filters` and `more` are shared across calls for null input, where the base built them per call (`emptyCollectionState`; the base probe prints `null: picked shared false more shared false`).
- **The rule:** spec.md:87, "a shared fallback object handed to callers is frozen or built per call".
- **Failure scenario:** no view writes them in place today (`toggleShow`, `toggleMore` and `withPick` build new values). Any later `held.show.team = true` would change the default of every fresh Map instance.

No other Proof finding. The failing run of the G134 rows on the unchanged tree is quoted. No existing assertion changed: I read the test diff, which changes only the head comment and the stub. Reading each G134 row, every one fails without the behaviour it tests.

## Standards

**St1. Edits made by programs (spec.md:65), disclosed by the builder.** The breach is 12 inline `python3` edits, 2 `cat >>` appends (`table-rows.ts`, `state.ts`) and `rewrap.py` run 3 times.

- The builder's transcript (`agent-afca7f28cc1fce52c.jsonl`) shows these commands at the timestamps the report gives (11:13:40 to 11:31:26). It also shows two read-only `python3` runs (10:42:45, 10:48:17) that only print, which the report does not list.
- Every hunk in the files those programs touched is read in this review: `Map.svelte`, `FilterBar.svelte`, `Collection.svelte`, `map-bar.ts`, `board/index.ts`, `presets.ts`, `graph.ts`, `prompt.ts`, `glyphs.yml`, `icons.yml`, `collection/bar.ts`, `SliceLine.svelte`, `table-rows.ts`, `BoardList.svelte`, `EntryList.svelte`, `state.ts`, `Projects.svelte`, `AddAsk.svelte`, `PickMenu.svelte`.
- Apart from the findings here, I found no hunk against the brief.
- This falls under the standing ruling "Unapproved builder scripts".

**St2. Git commands outside spec.md:33, not in the report.** The transcript shows:

- `git log --oneline -3` (10:29:00);
- `git grep -n "entryRoles" HEAD -- src | head` (11:17:32);
- `git grep -n "square_filled" HEAD | head` (11:24:28).

All are reads and none changed state, but `log` and `grep` are outside the three allowed forms.

**St3. Greps spec.md requires are missing from the report.**

- **History words (spec.md:44).** The report has no grep of added comment lines and test titles for the history words. My grep of the added lines (`git diff a964e0170 -- src tests config | grep "^+" | grep -in "\bbefore\b\|used to\|no longer\|\bstill\b\|always has been\|always had\|as before\|previously\|the step adds\|after this package"`) prints nothing. So there is no defect, only the missing quote.
- **Changed names (spec.md:71).** Only Verify 5 is quoted, no grep for the removed exports. My grep for `applyCollectionFilters|keptByHub|fieldFilters|FILTER_CHIPS_MOST|changedPicks|emptyCollectionState|presentFilter|archiveStatuses|stageFilters|lineFilters|lineCounts` over src, tests, docs, config and README.md finds no stale hit.
- **Helper reuse (spec.md:88).** Not quoted for `withPick`, `withPicks`, `fittedColumns` or `facetToneIn`.
- **New ids (spec.md:72).** The report states nothing about collisions or async paths. The new ids are the group ids `role`, `hub` and `field:<f>`, the facet `status`, `:title`, `stage`, and the Show items `projects`, `pillars`, `team` and `connected`. The new async path is the hub re-ask. By my reading the `field:` prefix and the `:title` key cannot collide with a schema field, and the re-ask returns before any write.

**St4. The verify list ran three times** (transcript 11:21:52 red, 11:34:02 green, 11:36:40 green after two head-comment edits). Spec.md:26 allows one more run only after a red one. This is disclosed and minor.

**St5. Repeated code and types (spec.md:88).**

- `EntryList.svelte:82-92` `cellWords` repeats the value reading of `collection/bar.ts:96-103` `fieldWords`: a list or one value, strings and numbers trimmed, empties dropped.
- `EntryColumn` (`collection/index.ts`, `{ key; label; shown }`) and `ListedColumn` (`table-rows.ts:53`) are the same type.

**St6. A head comment marked "still true" does not name the new function.** `table-rows.ts:1-3`: "The table's contract and its ordering: what one column declares, and how rows are sorted by one of them." The file now also holds `fittedColumns`, the column fitting both lists read. The report marks it still true (spec.md:71).

**St7. A shipped default object** (P2, spec.md:87).

**St8. A sentence outside the paths that the step makes partly false.** `docs/data-map.md:110`:

```
facet_tones:              # the colour of each filter group of a project board's bar (by word)
```

The step rewrote the same sentence in `config/catalogs/vocab.yml:222` and the options help to name the collection's bar and the Map's, since both now read `facet_tones`. The brief forbids touching data-map.md, and the report does not name the line (spec.md:35, 71). For the orchestrator at landing.

## Behaviour

**B1. The Map drops projects with no stage under a Stage pick.** At the base, `filterGraph` kept them under any stage filter ("A project whose manifest names no stage is outside the stage filter"). Now `stageKeeps` (map-bar.ts:113-114) drops them once any stage is picked. The brief's rule asks for this. The report's Map "before and after" does not state it; HELP.md:313 does.

**B2. Saved tabs reopen unfiltered.** A Collection tab saved with hidden statuses, picks, ranges or Hub chips, and a Map tab saved with stages, lines, "+ team" or "+ archived", reopens with no filter. Case 16 and case 25 rule this, and it follows from decision 13. The report's "Visible changes" does not list it.

**B3. A Map Pillar pick now narrows the projects.**

- **Before:** a line chip took only the line nodes out, and projects stayed unless Connected was on.
- **After:** only that pillar's projects and pillar nodes are drawn, every hub's.

The report's before reads only "stages and pillars filtered by chips".

**B4. Collections with no status field now draw a second line.** People and Organisations show a line 2 with the count and Clear all, where the base drew no status label and no count. The report does not state this.

**B5. The Map's empty case changed.** `Map.svelte` now shows `map.empty_filtered` when `items.length > 0 && graph.nodes.length === 0`, where the base tested `base.nodes.length > 0`.

- **Before:** a portfolio whose projects all sit at terminal stages drew an empty graph.
- **After:** it reads "Nothing is left under these filters. Take a pick out, or press Clear all."

The report does not state this.

## Declined to judge

- **The looks (cases 26-31 and 45)** and every DOM behaviour: folding into More and into "+<n>", MultiSelect focus and Tab order inside the prompt, the Columns `Menu`, Reveal scrolling a row, and PickMenu drawing or not drawing the Show group's heading. No page is run in a review. The look at landing settles them.
- **The report's account of the first red run** (duplication, comment-width and config-folder checks). It describes a state that no longer exists, and no decision rests on it.
- **Whether `rewrap.py` changed no words.** The pre-rewrap text is gone. `comment-width.test.ts` passes, and the rewrapped paragraphs read correctly.
- **The time the Map's Show counts cost.** `showGroup` builds four graphs per change; this was not measured.
- **The history of the builder's scratchpad.** I checked only that `rewrap.py`, `first-run.txt`, `last-run.txt` and `last-run-2.txt` are absent (`ls`); the caserun folder holds other steps' files.

Agent usage: a30959dfc24838389, claude-opus-5-5, 336845 tokens, 85 tool uses, 19 min 18 s.
