# Brief check of O66 (the Gallery draws every word grouped by its list, one table row per hue; the no-venue finding text)

Main's head: `git log --oneline -1` printed `7ab9536a Stop O60 at its /spec on the display languages' contribution point`, which is the base the brief names. The plan has no section headed "Goal": `grep -n "^## \|^# \|Goal" .scratch/migration/plan.md` printed only `1:# Plan: migration (cockpit to oculus)`, `5:## Steps, in execution order`, `1125:## Could run in parallel`, `1138:## Rulings`, `2604:## Agents` and `3137:## Blocked, and by what`. I took the goal as the opening paragraph ("Execution ledger for `tools/oculus/DESIGN.md`") together with O66's step line (plan.md:751) and open item 276 (plan.md:2558; orchestrator-state.md:216).

Three findings stop the build as the brief stands: 1.1 (a new module-level value in `tones.ts` makes `boundaries.test.ts` red), 4.4 (no `node` or ordinary `vitest` one-off can load `tones.ts`) and 8.3 (the finding text clashes with ruling 300 (4)).

## 1. Names

`git grep -n "<name>" -- . ':!config/local.yml' ':!.scratch'` was run for each name, leaving out the three files the step writes whole. Hits:

- `Gallery.svelte`: none.
- `gallery.yml`: `tests/checks/config/config-folder.test.ts:311`. This lists the file name, which the step does not change, so the line stays true.
- `views/system/audit.yml`: `tests/checks/config/config-folder.test.ts:309`. Same: a file name, unchanged, stays true.
- `msg_no_venue`: `src/lib/server/content/audit/projects.ts:221` (`...sentence('audit.msg_no_venue')`). The key stays and only its text changes, so this stays true.
- `col_chip`, `col_count`, `group_stages|group_forms|group_chips`: no hit outside the write list.
- `setVocab`: `src/lib/data/sources/config/catalogs.ts:69` (comment), `src/lib/state/client/socket.svelte.ts:48,381`, `src/lib/state/shared/page/install.ts:16,36`, `tests/shell/rail/rail-fixture.ts:14,32`. The signature is unchanged and none of these is made false.
- `chipKeys`: `src/lib/state/boards/board/facets.ts:12,105`. Kept true by item 1 bullet 3 and case 7.
- `chipsByTone`: none.
- `CHIPS` / `ROWS` (`git grep -n -w "CHIPS\|ROWS" -- src tests config docs README.md utils`): many hits, every one a separate local constant in another file (for example `src/lib/state/sessions/terminal/pty/pty-io.ts:22 export const ROWS = 24;` and `src/lib/views/boards/deposit/Deposit.svelte:66`). None is affected.
- `words/tones` / `tones.ts`: about 40 import lines and comment references, for example `src/lib/data/sources/config/catalogs.ts:31` ("the words of the stages, forms and chips state/shared/words/tones.ts reads") and `src/lib/state/client/context.ts:11`. They stay true, with one exception:

  1.1 `tests/checks/tree/boundaries.test.ts:487-493`, the `FROZEN` allow list of module-level bindings:
  ```
  'lib/state/shared/words/tones.ts:palette', ... 'lib/state/shared/words/tones.ts:legend', ... 'lib/state/shared/words/tones.ts:dataAccess',
  ```
  The check at `:436-441` flags any `^(?:export )?let (\w+)\b` in a `lib/state/` file that `FROZEN` does not name. Decision 4 (brief:84) puts the lists in "a second installed value beside `legend`", which means a new module-level `let` in `tones.ts`. That makes `boundaries.test.ts` (guarded entry G16, guarded.md:358, which `test:quick` runs) red, unless `FROZEN` gains the new name. `tests/checks/tree/boundaries.test.ts` is not in "Paths this step writes".

  There are two ways out:
  - (a) Add `tests/checks/tree/boundaries.test.ts` to the paths, for the one `FROZEN` row. Under spec.md:61 that edit to an allow list is reported with its before and after.
  - (b) Keep the lists inside the existing `legend` binding, for example by making it an object that holds the map and the lists. That means rewording decision 4.

  Under the standing demand that a brief check never widens a step (orchestrator-state.md, "A brief check never widens a step"), (a) is a decision for the orchestrator or Axel, not for this check.

  1.2 The brief never names the new export of `tones.ts`, so it cannot be grepped here, and the builder chooses a public name with nothing to check it against.

  1.3 The ledger (`.scratch`) holds old mentions, for example `.scratch/migration/agents/reviews/O28b.md:41` ("venue_id on published/submitted"). These are records, not documents of the tree, and the change does not make them false in any way that needs a fix.

## 2. The step line

Step line, plan.md:751: "the Gallery draws every word of `stages`, `forms` and `chips` of `config/catalogs/vocab.yml`, grouped by its list, and its table one row per hue, in place of the first 12 words and 8 hues; the audit finding `msg_no_venue` says "at a venue stage (in prep or later) but no venue" (the key `venue` by ruling 282, after O67), matching the `placed` flag it fires on; after O55 (ruling 276)".

How each part of the line maps to the brief:

| Part of the step line | Where "What to build" serves it |
|---|---|
| draws every word of the three lists | item 2 bullets 2 and 3, with item 1 |
| grouped by its list | item 1 (lists kept), item 2 bullets 2 and 3, item 3 (`group_*` keys) |
| table one row per hue | item 2 bullet 4 |
| in place of the first 12 words and 8 hues | item 2 bullet 1 |
| `msg_no_venue` says "..." | item 4 |
| the key `venue` by ruling 282, after O67 | a premise (brief:11), not a requirement; `src/lib/data/snapshot/normalise.ts:276` reads `venueId: str(manifest.venue)` |
| matching the `placed` flag | item 4's text, read by case 6; no requirement checks the match itself (see 8.3) |
| after O55 | ordering; plan.md:699 shows O55 ticked |

Findings:

- 2.1 No part of the line is missing from "What to build".
- 2.2 Requirements that serve no part of the line directly:
  - item 3's `col_chip: Word` / `col_count: Words`: a user-visible rewording that follows from the table counting every word (decision 2).
  - item 2 bullet 5 (first card, toned card, Meters, Ticker keep reading the first rows) and item 1 bullet 3 (helpers keep their behaviour): these keep existing behaviour.
  - item 1 bullet 4 and item 2 bullet 6 (comments): required by spec.md:71.

  Each is justified. None widens the line.

## 3. Premises

Commands rerun on main at 7ab9536a:

- 3.1 `ls docs/adr` printed "ls: docs/adr: No such file or directory". Matches.
- 3.2 `wc -l` printed 323 for `Gallery.svelte` and 291 for `tones.ts`. Matches.
- 3.3 Gallery line numbers, read with `cat -n`:
  - `:57-58` CHIPS/ROWS, `:60-69` chips, `:72-76` rows, `:171`, `:227`, `:267` and head comment `:14-25` all match.
  - Off by a line or more:
    - Chips section: the brief says `:199-212`; it is at 199-211.
    - Tags section: the brief says `:214-222`; it is at 213-221.
    - Toned card's tone: the brief says `:180`; it is `:181` (`tone={rows[0]?.tone}`).
    - `shown`: the brief says `:89-95`; it is at 94-100.
    - The table: the brief says `:247`; it is at `:243` (`<Table {columns} rows={shown} ...>`).
- 3.4 `tones.ts` line numbers:
  - `setVocab` `:94` matches.
  - The legend install: the brief says `:107-112`; it is at 106-111.
  - `chipKeys`: the brief says `:259`; it is at `:261`.
  - `chipTone`: the brief says `:269`; it is at `:271`.
  - `chipsByTone`: the brief says `:278`; it is at `:280`.
  - The read ranges `:85-115` and `:250-291` still cover all of them.
- 3.5 `grep -rn "chipKeys\|chipsByTone" src tests` printed `tones.ts:261`, `tones.ts:280`, `facets.ts:12`, `facets.ts:105`, and `Gallery.svelte:46,48,61,73`. Matches: `chipsByTone` is read only by the Gallery.
- 3.6 The vocabulary. A `yaml.safe_load` read of `config/catalogs/vocab.yml` printed:
  - 13 stages: `nascent`, `scoping`, `de-risking`, `exploring`, `in-prep`, `building`, `submit-ready`, `submitted`, `revision`, `published`, `released`, `failed`, `stopped`.
  - 6 forms: `journal`, `conference`, `thesis`, `abstract`, `poster`, `tech-report`.
  - 6 chips: `blocked`, `parked`, `results-in`, `admin-prep`, `numbers-to-run`, `ai-tells`.
  - `dup set() set() set()`: no word is in two lists.

  Matches.
- 3.7 Hues. The same Python read (stage `color`, else `statuses` `color`, through `palette`, else grey) printed 12 rows: violet nascent 1, cyan scoping 1, green de-risking 2, honey exploring 1, gold in-prep 1, brass building 1, orange submit-ready 1, sky submitted 1, amber revision 1, teal released 1, red failed 1, grey stopped 13. Matches the brief's order and counts.
- 3.8 `audit.yml:42`: `grep -n msg_no_venue` printed `config/text/views/system/audit.yml:42:        msg_no_venue: published/submitted but no venue (no venue renders on the card)`. The finding is raised at `projects.ts:211-223`, confirmed with `grep -n "" ... | sed -n 209,224p`. Matches.
- 3.9 `grep -n "placed: true" config/catalogs/vocab.yml` printed lines 69 (`in-prep`), 71 (`submit-ready`), 72 (`submitted`), 73 (`revision`) and 74 (`published`). These are the five stages; line 70 (`building`) does not carry the flag. Matches.
- 3.10 `grep -rn "no_venue\|no venue" tests` printed nothing (exit 1). `grep -rn --exclude=local.yml "msg_no_venue\|gallery" ~/workspace/research-hub/.oculus` printed nothing (exit 1). Matches.
- 3.11 `grep -rln "gallery" tests` printed only `tests/checks/config/config-folder.test.ts`, at line 311. guarded.md has 0 hits for `gallery`, `tones.ts`, `setVocab`, `chipKeys`, `no_venue` and `audit/projects`. Matches.

  Not in the brief: guarded.md:269-271, entry G92, names `facets` in `src/lib/state/boards/board/facets.ts`, the reader of `chipKeys`, with its test `tests/state/boards/board/hub-facets.test.ts`. That test imports `facets.ts`, which imports `tones.ts`, so it is depth 2. `tests/tiers/quick.mjs:40` has `RELATED_DEPTH = 2`, so `test:quick` runs it.
- 3.12 O63 audit.yml line numbers `:13`, `:18`, `:46`, `:48`, `:55-58`, `:68-75`, read one by one: all match. O63's brief, line 17, says "`msg_no_venue` (`:42`) is O66's and is left as it is". But O63's path list names `config/text/views/system/audit.yml` whole (O63.md:103). The O66 dispatch row in orchestrator-state.md (lines 30-32: `- step: O66 / landing: preparing / brief_check: ...`) carries no `shared_paths:`, although spec.md:98 says the orchestrator writes that judgment there. This is a gap in the state file, not in the brief.
- 3.13 The verify list. orchestrator-state.md:6-7 reads `verify:` `- npm run test:quick`, and the brief's verify item 1 is `npm run test:quick`. Matches.
- 3.14 Not stated by the brief and material: the Gallery's `most` (`Gallery.svelte:102`, `rows.reduce((top, row) => Math.max(top, row.count), 1)`) is the maximum over the rows that are kept. Today those are the 8 rows violet to sky, so the maximum is 2. With 12 rows it becomes 13 (grey). See 5.6 and 6.3.
- 3.15 The smallest font token is `--fs-xs`: `grep -rn -o "\-\-fs-[a-z0-9]*:" src/lib/themes/*.css` lists xs, sm, md, lg, xl, 2xl and 3xl. The h3 already uses `font-size: var(--fs-xs)` (`Gallery.svelte:296`). So the Conventions option "the Gallery's `h3` look one size down" (brief:103) has no token to use. See 4.6.

## 4. Cases and checks

- 4.1 Case 3 gets the drawn text wrong. It says "the green row's first word `de-risking` ("de-risking" label)". The table's chip column draws `chipLabel(row.key)` (`Gallery.svelte:75` and `:156`), and the label in `vocab.yml:66` is "de-risking (feasibility experiment)". Likewise the grey row draws "stopped (dropped or abandoned)" (`vocab.yml:77`). The case's expected text should name the labels.
- 4.2 Case 6 asks the builder to check a place the step does not change: it is checked by reading `projects.ts:211-223`, which the step leaves alone. Its second half (a `nascent` project gets no finding "as today") concerns unchanged code entirely.
- 4.3 Case 7 checks `facets.ts:105`, a place the step does not change. Its subject, `chipKeys()` in `tones.ts`, is changed code, so the regression read is legitimate.
- 4.4 Cases 5 and 7 cannot be run the way the brief says ("a `node` or `vitest` one-off over `tones.ts`").
  - Plain node fails. `node --input-type=module -e "import('./src/lib/state/shared/words/tones.ts')..."` printed `ERR ReferenceError $state is not defined`, because `tones.ts` imports `generation.svelte.ts`, which holds `$state({ generation: 0 })` (line 23).
  - Plain vitest does not see a scratchpad file. The unit project includes only `tests/**/*.test.ts` (`vite.config.ts:511-515`).
  - What can work: a case-run program under spec.md:65, with its own vitest config in the scratchpad, as `.scratch/migration/agents/reviews/D13a-report.md:44` did (`npx vitest run --config <scratch>/probe/vc.mts`). The brief should say so. Otherwise the builder either cannot run the case, or puts a file under `tests/`, which breaks brief:77.
- 4.5 Case 5's second half ("the Gallery then draws one group, Stages, and no empty Forms or Chips heading") is a drawn result. A run over `tones.ts` cannot show it; under spec.md:64 and :66 it is checked by reading and at the look. The brief assigns the whole case to a run.
- 4.6 Conventions (brief:103) leaves a user-visible choice open to the builder: the h3 look one size down, or a plain label line. The first option is impossible without a new font token (3.15). Under spec.md:18 the brief should settle the look.
- 4.7 Cases 1-4 being checked by reading and the look agrees with spec.md:64. The note that no case is a test agrees with spec.md:59. The first-run instruction and the stop rule agree with the rules file.
- 4.8 The brief does not tell the builder that the three group headings must be read as literal `t('gallery.group_stages')` and so on. `tests/checks/source/keys.test.ts:1-3` holds that "every catalog key is reached by a literal, registration metadata, or one documented computed lookup". A computed `` t(`gallery.group_${list}`) `` would leave the three keys as orphans and turn that check red, unless `COMPUTED_PREFIXES` (`keys.test.ts:200`) gains a row, and that file is outside the paths.

## 5. The question (could it pass without the goal being reached?)

The goal here is: the Gallery shows every word, grouped by its list, with one table row per hue, and the no-venue finding's text matches the stages it fires on.

- 5.1 Case 1: yes. It is checked only by reading and the look under the shipped 25 words, and the only grep is verify item 3, which matches the names `CHIPS` and `ROWS`. A Gallery that still caps the words with a renamed constant or a literal (`slice(0, 30)`) would pass the case and the grep. The reviewer's reading of item 2 bullet 1 is the only guard.
- 5.2 Case 2: yes, for the same reason as 5.1.
- 5.3 Case 3: yes, for the same reason: a cap of 12 under any other name passes. It does fail today: the table shows 8 rows.
- 5.4 Case 4: no. On the unchanged tree the search `grey` finds no row (grey is not among the first 8), so the case tells the two apart.
- 5.5 Case 5: no, for the export half: the export must exist and leave out an empty list. The Gallery half is the same as 5.1.
- 5.6 Case 6: no, for the text. Verify item 4 prints the line and case 6 reads it. Its "matching the `placed` flag" half has the weakness in 8.3.
- 5.7 Case 7: yes. It passes on the unchanged tree. It is a regression guard and does not test the goal.
- 5.8 The step line names no check of its own (plan.md:751 has none), so there is nothing to judge.
- 5.9 Item 1: yes. The export could exist and be unused. Item 2 is what connects it, and knip (verify item 5) would flag an export nothing imports.
- 5.10 Item 2: yes, as in 5.1. Bullet 5 can also be met while the Meters change visibly: they keep reading `rows.slice(0, 3)`, but their value `row.count / most` changes, because `most` goes from 2 to 13 (3.14). Today's fills are 0.5, 0.5 and 1.0; after the change they are 1/13, 1/13 and 2/13. No case and no part of the report's "before and after" list (brief:127) names the Meters, so the look would not be asked to check them.
- 5.11 Item 3: no. The keys check (4.8) fails if a key is added and not read as a literal.
- 5.12 Item 4: no, for the words. See 8.3 for whether those words meet the plan's later ruling.

## 6. Implied inputs

Inputs missing from "Cases" that have happened or whose wrong answer would cost something, each with the result to expect:

- 6.1 A config push. `setVocab` runs again on every edit of `vocab.yml` (`socket.svelte.ts:381`), so this happens on every vocabulary edit. Expected: after a second `setVocab` with a different vocabulary, the new export returns only the second config's lists, nothing appended, and a Gallery reading it draws again, because it reads `configGeneration()`.
- 6.2 A word in two lists, for example a hub vocabulary with `submitted` as both a stage and a chip. The shipped vocabulary has none (3.6), and the hub's `.oculus` sets no `stages:`, `forms:` or `chips:`: `grep -rln --exclude=local.yml "^stages:\|^forms:\|^chips:\|^  stages:\|^palette:" ~/workspace/research-hub/.oculus` printed nothing (exit 1). Expected, which the brief should state:
  - The word appears in both groups, each drawn with `legend`'s later-list label and glyph.
  - `chipKeys()` lists it once.
  - The table counts it once, because it runs over `chipKeys()` as today, not over the groups joined together. That stops the counts from adding up to more than the vocabulary has.
- 6.3 The Meters under the shipped vocabulary (see 5.10). Expected: the brief must say whether `most` is taken over all 12 rows (fills 1/13, 1/13, 2/13) or kept over the rows the Meters show. Either way it is a visible change, and the report's "before and after" should list it.
- 6.4 A list row that `legendRows` drops, for example `journal: true`, which is not a map row (`readAs(legendRowShape, row)` returns null, `tones.ts:80-81`). Expected: the new export lists the same words `legend` holds, so the word is left out of its group too, and `__proto__` is left out as at `tones.ts:109`.
- 6.5 A project at `building` (or `released`, `failed`, `stopped`) with no `venue`. These stages come after `in-prep` in `vocab.yml` order but carry no `placed`. Expected: no finding, since `rules.placedStages` decides (`projects.ts:213`). Such projects exist in the hub; the stage `building` is in use (plan.md ruling 281). The text "(in prep or later)" suggests otherwise, so the case pins down the behaviour the text has to match.

## 7. ADRs

- 7.1 `ls docs/adr` printed "ls: docs/adr: No such file or directory". There is no ADR folder, so no record applies and nothing in the brief contradicts one.

## 8. Dictated text

- 8.1 `grep -n "group_stages: Stages"` finds brief:35: `group_stages: Stages`, `group_forms: Forms`, `group_chips: Chips`. Holds.
  - They are ASCII and plain words.
  - "kept in the file's alphabetical order" is possible: they go between `form_outline` (gallery.yml:25) and `meter` (:26).
  - spec.md "What every package obeys" (:50, a group in one file) holds: the keys join the `gallery` group in `gallery.yml`.
- 8.2 `grep -n "col_chip. reads .Word"` finds brief:35: `col_chip` reads `Word`, `col_count` reads `Words`. Holds (spec.md:21 prose).
- 8.3 `grep -n "msg_no_venue: at a venue stage"` finds brief:39: `msg_no_venue: at a venue stage (in prep or later) but no venue`.
  - Against spec.md this holds: ASCII, no em dash, plain (:21). Its indent inside the list fence is 3 + 8 spaces, which is the 8 spaces of `audit.yml`.
  - Its words are fixed by a ruling of the user: open item 276 (a) (plan.md:2558), with `venue_id` to `venue` by ruling 282 as the step line reads it.
  - It clashes with a later ruling of the user, open item 300 (4) (plan.md:2584, 2026-10-24): "the audit's finding texts (`config/text/views/system/audit.yml`) say what the setting found in words true for any hub". "(in prep or later)" names oculus's shipped stage `in-prep` and relies on the shipped order of the stages. In a hub whose stages differ, it is not true.
  - Even under the shipped vocabulary, "or later" covers `building`, `released`, `failed` and `stopped`, which do not carry `placed` (6.5). The text is true for every project the finding actually fires on, but it does not state the `placed` set the step line asks it to match.
  - This is a clash between two rulings of Axel's. Under the automode demand in orchestrator-state.md it is not decided in automode. It goes to Axel as an open item.
- 8.4 `grep -n "head comment says what the Gallery draws now"` finds brief:34. The dictated content, "every word of the three lists grouped by its list, and one table row per hue; a word added to any of the three lists of `config/catalogs/vocab.yml` appears with nothing written in the file", holds. It has no comparison words of the kind spec.md:44 bans. The word "now" is the brief's framing, outside the dictated content.
- 8.5 `grep -n "group headings read"` finds brief:81 (`Stages`, `Forms`, `Chips`), and `grep -n "column headings read"` finds brief:82 (`Word`, `Words`). Both hold; they are the same words as 8.1 and 8.2.
- 8.6 `LC_ALL=C grep -n '[^ -~]' .scratch/migration/agents/briefs/O66.md` printed nothing (exit 1): the brief is ASCII throughout.

## Declined to judge

- O68, which is in flight (orchestrator-state.md dispatch), has no brief: `ls .scratch/migration/agents/briefs/` shows no O68 file. So whether it also changes `tones.ts` or the Gallery could not be checked.
- I did not judge whether a group heading "Chips" under a section heading "Chips" reads well (decision 1). That is a judgment of wording, and no rule in spec.md decides it.
- I did not run knip (`utils/unused-exports.sh`) or any test: the brief check changes nothing, and the base file `.agents/worktrees/O66-base/unused-exports.txt` does not exist before `/spec` creates the worktree.

Usage: a305e49b6053a0d6b, claude-opus-5-5, 184842 tokens, 50 tool uses, 7 min 4 s

## Closed

The step stopped at this check on finding 8.3 (open item 317), and the brief was removed as the stop requires. Each other finding is closed by the change below, applied when /spec writes the brief again after the ruling.

- 1.1: decision 4 rewritten: the lists live inside the existing `legend` binding of `tones.ts` (one installed value holding the word map and the lists), so no new module-level `let` is added and `FROZEN` in `tests/checks/tree/boundaries.test.ts` is untouched.
- 1.2: the new export is named `legendLists()`.
- 1.3: no change; ledger records.
- 3.3, 3.4: the line numbers corrected to the tree (Chips `:199-211`, Tags `:213-221`, toned card `:181`, `shown` `:94-100`, table `:243`; legend install `:106-111`, `chipKeys` `:261`, `chipTone` `:271`, `chipsByTone` `:280`).
- 3.11: G92's test `tests/state/boards/board/hub-facets.test.ts` named under "What is on the tree" as the test that runs over `chipKeys` through `facets.ts`; case 7 keeps its order.
- 3.12: `shared_paths` with O63 for `config/text/views/system/audit.yml` written in the dispatch entry when the step is prepared.
- 3.14, 5.10, 6.3: the Meters keep today's fills: `most` is taken over the rows the Meters draw, and the report's before and after names the Meters.
- 4.1: case 3 names the drawn labels, "de-risking (feasibility experiment)" counting 2 and "stopped (dropped or abandoned)" counting 13.
- 4.2: case 6 reads the new text against the five `placed` stages; the unchanged `nascent` half is removed.
- 4.4: cases 5 and 7 run as a case-run program with its own vitest config in a scratch folder outside the tree (`npx vitest run --config <scratch>/vc.mts`), as `spec.md` allows; nothing is added under `tests/`.
- 4.5: case 5 split: the export by the run, the Gallery's groups by reading and at the look.
- 4.6: the group heading is a plain label line in `--fs-xs`, weight 600, with no colour set; the `h3` look is not changed.
- 4.8: "What to build" requires each group heading to be read as a literal `t('gallery.group_stages')`, `t('gallery.group_forms')`, `t('gallery.group_chips')`.
- 5.1 to 5.3: verify gains `grep -n "slice(0," src/lib/views/system/gallery/Gallery.svelte`, printing only the first card's two chips and the Meters' and Ticker's three rows.
- 6.1: a case: a second `setVocab` with another vocabulary; `legendLists()` returns only the second config's lists.
- 6.2: a case: a word in two lists appears in both groups with the later list's label and glyph, `chipKeys()` lists it once, and the table counts it once.
- 6.4: a case: a row `legendRows` drops (`journal: true`) and `__proto__` are left out of their group.
- 6.5: case 6 adds a project at `building` with no `venue`: no finding.
- 8.3: open item 317, ruled (a) by Axel on 2026-10-24: the step's line in `plan.md` carries the ruled text and the tag `(ruling 317)`; the brief's item 4 dictates the ruled line, passes the stage's label from a new label of `AuditRules` with `signed: []`, and adds `rules.ts` and `projects.ts` to the paths; cases 10 and 11 check it.
- 3.12: no step is in flight when the step is prepared again, so no `shared_paths` is written.
