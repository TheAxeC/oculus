# Landing of step O72

Position: the migration plan (oculus), step O72, the closest-word hint bounded; next: the landing of O73.

## Open items (verbatim from the state file)

- 357 (2026-10-25, step O74, the career banner as command-center rows): ruling 346 (a) makes every line of the banner a command-center row, "glyph, words, tail, buttons under the pointer, a press opening that entry of the career file", and names neither which buttons a career row carries nor what a press on a Track record row opens, which is no entry of the career file (its counts are worked out from the projects and the funding file). On the tree today the banner's lines have no press and no buttons (`src/lib/views/boards/focus/career/CareerPanel.svelte`); a command-center row's press opens the record it names (a project's tab, a collection's view) and its buttons under the pointer write to it (done, snooze, a status), in `views/boards/focus/rows.ts`. The career file `.oculus/data/academic/career.yml` holds `goal`, `milestone` with `milestone_date`, the `situation` facts and the `order` tasks, and the banner already edits it in place with its Edit form. How a row would look, unfolded, the pointer on ORDER OF WORK's first row:
  ```
  v [focus] Career                                              [Edit]
  NEXT                              | SITUATION
  [cal] FWO Senior        2026-11-17, in 23 days | [i] PhD   May 2023, KU Leuven ...
  GOAL                              | [i] Now   Postdoc, U Twente ...
  [flag] Assistant professor / ...  | TRACK RECORD
  ORDER OF WORK                     | [book] Lead       3 journal, 1 conference
  [list] ERC Starting Grant  Oct 2027 [Edit] | [book] Funding obtained   1
  ```
  (a) A press on a row of the file (Next, Goal, a Situation fact, an Order of work task) opens the career file in an editor tab at that entry's line; under the pointer each such row carries one button, Edit, which opens the banner's own form on that section. A Track record role row opens that role's board (Lead to Projects, Supervisor to Supervision, Collaborator to Coauthor), the Funding obtained row opens the Funding view, and these rows carry no button, since nothing of them is written in the career file. Pro: the same split as the command center, a press opens the record and a button changes it; every row goes somewhere. Con: opening the file at a line needs the line of each entry, read from the file's text, which the career model does not carry today. (b) A press on a row of the file opens the banner's own form on that section, and under the pointer one button, Open in file, opens the career file in an editor tab at that entry's line; the Track record rows as in (a). Pro: the form, which checks the file's schema, is the first thing a press reaches. Con: a press edits where every command-center press opens. Recommended (a), for the same split as the command center. The lazy option is rows with no press and no button, which ruling 346 (a) does not allow.
- 360 (2026-10-25, step O76, the Off-pillar note; `agents/reviews/O76-brief-check.md` finding 8.1): ruling 349 (b) adds "Off-pillar lines carry no counts." to the Off-pillar note, and the sentence is false: every registry card, an off-pillar one included, draws a "<n> projects" tag in its title row (`src/lib/views/shared/forms/registry/RegistryCard.svelte:79`); only the row "<n> in flight, <n> total, tier tags" is left out on an off-pillar card (`LineCard.svelte:74`).
  ```
  Off-pillar / archival
  Deliberately outside the current programme, ... rather than reading as an orphan. <sentence>
  +--------------------------------------------------+
  | Service work                     [3 projects]    |   <- this tag is drawn today
  | (no "in flight / total / tiers" row)             |
  +--------------------------------------------------+
  ```
  (a) The sentence becomes "Off-pillar lines carry no in-flight or venue-tier counts." Pros: true of what the card draws; the "3 projects" tag a reader uses stays; one line in `pillars.yml`, no new path. Cons: changes the words you ruled. (b) The sentence stays as ruled and an off-pillar card stops drawing its "<n> projects" tag. Pros: your words kept. Cons: a count a reader uses goes; `RegistryCard.svelte` joins the step's paths and gains a flag for muted cards. (c) The sentence is left out. Pros: nothing false is said. Cons: a reader is not told why an off-pillar card has no in-flight row. Recommended (a), a judgment: it says what the card shows and costs nothing. The lazy option is keeping the sentence as ruled with no change to the card, which ships a false sentence. O76 is not dispatched until you rule.
- 364 (2026-10-25, step O75, its paths; `agents/reviews/O75-brief-check.md` Names findings 1 to 5 and Implied input 6; ruling Brief check scope, a widening of the step's paths). Three parts, each a set of files the step needs that its paths do not hold. (1) Sentences the step makes false outside its paths: the category and stage facets named in `src/lib/data/shapes/boards/categories.ts:4`, `config/catalogs/vocab.yml:52` and `:214`, `docs/HELP.md:523` and the title of `tests/state/shared/hub-words.test.ts:80`; the board statistics in `config/catalogs/vocab.yml:91`, `src/lib/data/shapes/catalog-files/vocab.ts:143` and `:280`, `config/options/catalogs/vocab.yml:18` and `config/options/behavior.yml:170`; the Authors column in `src/lib/state/boards/board/team.ts:4` and `items.ts:4`; Mine only drawn only where it changes the board in `config/catalogs/vocab.yml:206`. (a) The paths widen to these lines and the step makes each true. Pros: no false sentence ships; each is a line of text. Cons: 13 more places in the step. (b) Left as they are. Cons: 13 sentences that say what the board no longer does. Recommended (a); (b) is the lazy option. (2) The stage flag `submit_ready`: once the totals line goes (ruling 351 (a)), nothing reads it (`stats.ts:85` is its only reader; no hub file writes it). (a) The flag is removed: its line on the `submit-ready` stage in `config/catalogs/vocab.yml:71`, its description at `:60`, `src/lib/data/shapes/catalog-files/vocab.ts:118` and `config/options/catalogs/vocab.yml:57-58`. Pros: the vocabulary holds no flag that decides nothing. Cons: a hub that wrote it later would get an unknown-key finding. (b) The flag kept with no reader, its three descriptions rewritten to say it decides nothing. Cons: a setting that does nothing. Recommended (a); (b) is the lazy option. (3) A picked pillar in its own colour, which ruling 348 (a) names: a board item's pillar tag carries no colour today (`BoardTag`, built in `src/lib/state/boards/board/items.ts`). (a) The paths widen to `items.ts` and `BoardTag`'s type, so a pillar with a `color` is drawn in it when picked. Pros: the ruling is carried out whole. Cons: one more file; no pillar of this hub writes a `color` today, so nothing changes on screen until one does. (b) Picked pillars drawn in More's cyan. Cons: against ruling 348 (a). Recommended (a); (b) is the lazy option. O75 is not dispatched until you rule.


## Agents stopped (Steps 1)

`ListAgents` after the stops listed no subagent: the builder ab21545866a2563dc and the reviewer a903c2d8114d64f0e had already ended (TaskStop answered "No task found" for each).

## NOT DONE

Nothing of the step. The new finding sentences were not seen on TEST, since the hub has no finding.

## What landed

9 paths, from base b254d6ac, the whole range (wip commit e2f71780), applied in the gate worktree on top of e6488c25 and then on main; `git diff --cached` of main equal under `cmp` to the gate's: SAME.

- `closestWord` (`src/lib/data/shapes/vocab-keys.ts`) names a word only within `Math.floor(word.length / 2)` edits.
- `validate.ts`'s `wordHint` tells an empty list, no word near and a near word apart; the stage, collection-status and lead-status findings gain `stage_unknown`, `status_unknown` and `lead_status_unknown` (`config/text/findings.yml`).
- `config/catalogs/vocab.yml:101` and `:158`, `config/options/catalogs/vocab.yml:18`, `docs/HELP.md:519` and `docs/data-map.md:199` state the bound.
- G56's `schema-rules.test.ts` gains three status rows and a stage table; G126's `hub-vocab.test.ts:77` expects `stage "nascent" is not a word of the stages list`.

Before and after: a stage or status far from every word of its list read "... the closest word is failed" for `nascent`; it now reads "stage "nascent" is not a word of the stages list".

## Verification

In the gate worktree, `npm run diagrams && npm run test:quick`:

```
ok      prettier (2.4 s): All matched files use Prettier code style!
ok      ASCII gate (2.9 s)
ok      svelte-kit sync (18.8 s)
ok      vitest (64.1 s)
ok      vitest slow (71.4 s)
ok      svelte-check (74.6 s): 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (85.6 s)
ok      vitest checks (93.2 s)
test:quick: 112.2 s; every command passed
```

`npm run diagrams` changed nothing.

## Found, and fixed at landing

- The comment of `StatusSaid` (`validate.ts:232`) said "the closest word if any"; it now says the second argument is the hint of its list (refutation Standards 1).
- The builder ran the verify list three times, one run beyond "Token discipline" (refutation Standards 2); no code to change.

## The look

On TEST, the Findings view reads "No findings: every id resolves and every status is in the vocabulary." The new sentences cannot show on this hub; they are read from the case runs of the builder's report and the review.

## Agents

Brief check a4dd23ef439ad4f70, 144903 tokens, 33 tool uses, 5 min 55 s; builder ab21545866a2563dc, 203471 tokens, 58 tool uses, 18 min 56 s; reviewer a903c2d8114d64f0e, 181670 tokens, 35 tool uses, 7 min 51 s; all claude-opus-5-5. The builder's first report passed its bar but for the extra verify run; no repair round was sent; one fix at landing.

## Next

The landing of O73; O75 waits on open item 364, O76 on 360, O74 on 357; O77 after O75.
