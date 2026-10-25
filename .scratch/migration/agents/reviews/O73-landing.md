# O73 landing

Position: roadmap entry the cockpit-to-oculus migration (`plan.md`), step 273 of 399, O73 (a hub `manifest_fields:` row whose `from` names no list gets a finding); next: O75, O76 and O74, each on Axel's ruling (open items 364, 360, 357), then O77.

## Open items, verbatim

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

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

## The check of Steps 1

TaskStop on the builder a1fc7a1e8c9959398 and on the reviewer ac642df4d4c103114 printed "No task found" for each; ListAgents listed only the three peer sessions, none of this step's agents.

## NOT DONE

Nothing of the step.

## What landed

O73 is on main in the commit that carries this report, from base 77f949b5, the whole range (one wip commit fde7b660), 12 paths. Checked in the gate worktree on top of 5a47cae5 (`npm run diagrams && npm run test:quick`): "test:quick: 59.2 s; every command passed" (ASCII gate, prettier, svelte-kit sync, vitest, svelte-check 0 errors 0 warnings, eslint). On main, `git diff --cached` equals the gate's under `cmp`: SAME. `config/text/findings.yml` and `docs/HELP.md`, also changed by O72, merged with no conflict.

- `namesList` (`src/lib/data/snapshot/schema/static.ts`): a `from` source names a list when it is `projects`, a registry, or a list `vocabLists` reads from the merged configuration; `schemaFileProblems` uses it.
- `rowsNamingLists` (`src/lib/data/sources/config/merge/hub-layer.ts`): after the hub's values are laid in, a `manifest_fields` row whose `from` holds a source that names no list is taken out with a finding keyed `manifest_fields.<i>.from` in the hub's file: "... names <source>, which is no registry, projects or vocab list; the row is left out", or "... names no list; the row is left out" for an empty `from`.
- The sentences of both `manifest-schema.yml` files, `docs/HELP.md:524` and `docs/templates.md:309-311` name the new kind; G128's test gains the new row; `docs/diagrams/layer-data.*` and `writes.*` are regenerated for the new import.
- Before, such a row was kept and its field offered no choices; now it is a finding and the row is left out.

## What was found

- Premise correction: the brief cited `config/schemas/manifest-schema.yml:16` as a `vocab.<key>.<field>` source of oculus's schema files; that line is a comment (refutation Spec 1). The builder's work is unaffected.
- Fixes at landing: the `mergeHub` doc comment rewrapped at 100 columns (Standards 1); the `rowsNamingLists` doc comment and the head comment of `manifest-fields.test.ts` in plain wording (Standards 2); the builder's two scratch folders `o73-cases-SdAENf` and `o73-cases-emAgV5` in the system temporary folder listed and removed (Standards 3); G128's sentence in `agents/guarded.md` extended as the brief dictates.
- The builder's first report passed its bar: the review found every item holding and every case met; no repair round.
- The look, on 8790: the System page's Findings view reads "No findings: every id resolves and every status is in the vocabulary." The hub sets no `manifest_fields:` row, so the new finding is not visible there; it is read from the case runs of the report and the review.

## Usage

- Brief check a29e38315e43e1a49: 174594 tokens, 42 tool uses, 7 min 6 s, claude-opus-5-5.
- Builder a1fc7a1e8c9959398: 199079 tokens, 50 tool uses, 10 min 4 s, claude-opus-5-5.
- Reviewer ac642df4d4c103114: 181154 tokens, 43 tool uses, 8 min 42 s, claude-opus-5-5.

## Next

O75, O76 and O74 wait on Axel's rulings on 364, 360 and 357; O77 after O75.
