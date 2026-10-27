# O96 refuter report
Usage: aba0d8dc3c0d0853c, claude-opus-5-5, 239441 tokens, 74 tool uses, 16 min 44 s

## Verification

All commands were run from `~/workspace/oculus/.agents/worktrees/migration-O96` with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`. The rules file names no output filter, so each output was saved to a scratch file and grepped for its result lines.

Verify 1. `npm run test:quick -- --base 909f79d53` (load 6.54 at the start, 13.26 at the end). I did not run `npm run diagrams` because it writes files; see "Declined to judge" for the read-only check I ran in its place.
```
test:quick: 24 changed file(s), from git since 909f79d53
test:quick: 53 test file(s)
ok      ASCII gate (0.9 s)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      svelte-kit sync (7.6 s)
ok      eslint (24.9 s)
ok      svelte-check (47.7 s): 1793123989896 COMPLETED 551 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (95.4 s): Duration  85.94s (...)
ok      vitest slow (102.7 s): Duration  93.68s (...)
ok      vitest (111.5 s): Duration  102.55s (...)
test:quick: 119.3 s; every command passed
```
The read-only replacement for `npm run diagrams` was `npx vitest run tests/checks/diagrams/diagrams.test.ts`.
- First run alone: `Tests  4 failed | 43 passed (47)`.
- Second run alone, load 19.30: `Tests  3 failed | 44 passed (47)`, each failure `Error: Test timed out in 5000ms.`
- Then `npx vitest run tests/checks/diagrams/diagrams.test.ts --testTimeout 180000 -t "each file byte for byte"`: `Test Files  1 passed (1)`, `Tests  1 passed | 46 skipped (47)`.
- The committed diagrams therefore match the source. The failures were timeouts under load.

Verify 2. The ASCII gate over the 21 changed files other than the svg ones (the paths from `git diff --name-only -z 909f79d53`): printed nothing, `ascii exit=0`. The same perl check over `O96-report.md`: printed nothing, exit 0.

Verify 3.
- `grep -rn "in-flight'\|'ideas'\|'done'" src/lib/state/boards/structure/cross-links.ts src/lib/views/shared/links/CrossLinks.svelte`: printed nothing, `exit=1`.
- `grep -rn "xlink_" src config --exclude=local.yml`: printed nothing, `exit=1`.

Verify 4. `wc -l` of the changed .ts and .svelte files:
```
537 vocab.ts | 335 vocab-keys.ts | 532 bar.ts | 355 cross-links.ts | 251 map-bar.ts | 84 Disclosure.svelte | 511 Collection.svelte | 58 NoFundingCard.svelte | 252 CardLinks.svelte | 361 RecordCard.svelte | 213 FilterBar.svelte | 321 PickMenu.svelte | 338 EntryCard.svelte | 201 CrossLinks.svelte
```
Every file is within its limit: 880 for a source file, 520 for a component (Collection.svelte, the largest component, is 511).

Verify 5. The builder's case-run program, `npx vitest run --config <scratchpad>/caserun/case.config.mts --root $PWD final`:
- It printed `exit=0`, `Test Files  1 passed (1)`.
- `diff` of its `case` lines against the builder's `caserun/final-out.txt` printed nothing (`SAME-AS-BUILDER-OUT`).
- `diff` against the report's quoted output printed nothing (`SAME-AS-REPORT`).
- The `tests/final.test.ts` in the scratchpad is byte-identical to the source quoted in the report (`diff` printed nothing, `SAME`).

Selected lines from my run:
```
case 1: [in review 1 colour=#0ea5e9: a-sub@submitted] [in flight 2 colour=#16a34a: b-exp@exploring,c-exp@exploring] [idea 1 colour=#7c5cff: d-nas@nascent] [publications 1 colour=#db2777: e-pub@published]
case 4: [in review 1 colour=#0ea5e9 WARN: blk-sub@submitted] [in flight 1 colour=#16a34a: ok-exp@exploring] | [idea 1 colour=#7c5cff WARN: blk-nas@nascent]
case 7: [failed 1: dead1@failed] [stopped 1: dead2@stopped]
case 17: [other 1 colour=none: nostage@]
case 8: line=[field:funder] section="Projects" [project_category,project_stage,project_form,project_tier,project_pillar] shown=4/4 kept=[S1,S2,S3,S4] card=true
case 8 (view with no strip): line=[field:funder] section=none shown=4/4 kept=[S1,S2,S3,S4] card=false
case 9: ... shown=1/4 kept=[S1] card=true
case 10   project_stage "Stage" {nascent=0, exploring=0, building=0, submitted / under review=1*, published=1}
case 12: project_pillar "Pillar" {Pillar L=1, gone=0*} ... shown=0/4 kept=[] card=false
case 13: shown=1/2 kept=[ann]
case 18: project_category "Category" {in review=1, in flight=1, idea=1, publications=1}
case 21: field:funder "funder" {nwo=2, fwo=0}
case 24: Category idea ... card=false No funding strip=[] No funding slice count={"value":"no-funding","label":"No funding","count":0}
case 26 both hubs: [in review 2 colour=#0ea5e9: a:sub@submitted,b:sub@submitted] [idea 2 colour=#7c5cff: a:nas@nascent,b:nas@nascent]
```

Verify 7. `sh utils/unused-exports.sh > <scratch>/o96-rev-unused.txt` (exit 0), then `diff ../O96-base/unused-exports.txt <scratch>/o96-rev-unused.txt`: printed nothing, `diff exit=0`.

Verify 8. `git diff -U0 909f79d53 -- src config docs/HELP.md | grep '^+' | grep -inE "O[0-9]{2}|Q[0-9]{2}|20[0-9]{2}-|before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|anymore|formerly|instead of|now\b|as now"` hit three lines, none of them history:
- HELP.md:296, "while that tab is still open": text the step did not change.
- PickMenu "parts the run from the groups before it": a place on the page.
- CrossLinks "draws it before its groups": a place on the page.

Verify 9. `grep -n "cross-link group\|groups under none" config/catalogs/vocab.yml config/options/catalogs/vocab.yml src/lib/data/shapes/catalog-files/vocab.ts src/lib/views/shared/card/project/CardLinks.svelte`: printed nothing, `exit=1`.

Commands the builder's report quotes as evidence, rerun in the same form:
- `npx vitest run --project unit --tagsFilter slow --testTimeout 120000 tests/data/hubs/hub-portfolio.test.ts` (load 19.20): `Test Files  1 passed (1)`, `Tests  16 passed (16)`, `Duration  63.34s`. This agrees with the report's 16 of 16.
- `npx vitest run tests/checks/tree/boundaries.test.ts tests/state/forms/choices.test.ts tests/server/machine/lsp/choices.test.ts`: `Test Files  3 passed (3)`, `Tests  25 passed (25)`. Two files are named `choices.test.ts`; the report's "11 passed" for each alone was not separated out.
- Premises of the brief, checked on the base copy:
  - `wc -l` gives 268, 198, 469, 300, 249, 70, 334 and 360, as the brief says.
  - `groupOf` is at :168 and `groupProjects` at :184.
  - `grep -rn "xlink_"` on the base hits only `CrossLinks.svelte` and `project.yml:162-168`.
  - `ls -d docs/adr docs/glossary.md` answers "No such file or directory" for both.
  - Every premise I checked reproduced.
- `git status --short` after all my runs: 24 entries (23 ` M` and the untracked report), the same as at the start.

## Verdicts

Items of "What to build":
- 1, `groupProjects` by `categories:`: holds. It produces one group per row in the rows' order, leaves archival rows out, puts "other" last, sets the warning on any group holding a blocked project and names no category key in code. Evidence: the `cross-links.ts` diff and cases 1 to 4, 15 to 17, 25 and 26.
- 1, CrossLinks heading in the row's colour through a `tone` prop on Disclosure, `xlink_*` removed, no glyph on a category head, Archival heads kept: holds. Evidence: `Disclosure.svelte:15-27`, `CrossLinks.svelte:57-68,77-79`, Verify 3.
- 1, every strip that `groupProjects` draws changes, and the Lit Watch id set changes only by the archival and no-row rule: holds. ProjectCard and RadarCard call `groupProjects` unchanged (`ProjectCard.svelte:123`, `RadarCard.svelte:122`).
- 2, Projects section in More with its six groups, ids `project_*`, counts of distinct projects, picks narrowing strips and hiding emptied entries and the No funding card, list mode, the entry's page drawing the whole strip, Clear all: holds. Evidence:
  - `bar.ts` diff and cases 8 to 13 and 18 to 24.
  - `Entry.svelte:308` passes no `keeps`.
  - SliceLine's Clear all calls `onfilters({})` (`SliceLine.svelte:199`), shown while any filter has a value (`:86`).
- 2, one optional prop on `FilterBar` and on `PickMenu`, their other callers unchanged: holds (`section?` at `FilterBar.svelte:60-61` and `PickMenu.svelte:50-51`).
- 2, `stageGroup` exported from `map-bar.ts` and used with no keep-live rule: holds (`map-bar.ts:128`; `bar.ts` `projectGroups` gives no stage rule).
- 3, HELP.md 277, 296 and 301, the head comments, and the false sentences in vocab.yml, the options catalog, vocab.ts and CardLinks: holds. Verify 9 is clean, and the word diff shows each line rewritten. A rewrap defect in two of the edited comments is T1.

Cases:
1 met; 2 met; 3 met; 4 met; 5 met; 6 met; 7 met; 8 met; 9 met; 10 met; 11 met; 12 met; 13 met.
14 met by reading (`Entry.svelte:308`, no `keeps`).
15 met; 16 met (colour none in the run; the look is named).
17 met: the project is drawn under "other". It also gets an empty stage tag (B1).
18 met; 19 met; 20 met; 21 met.
22 met: `shown` feeds both the list and the cards (`Collection.svelte:212-217,455`).
23 met; 24 met; 25 met.
26 met. In the case-run program, `wordsOf()` with no hub returns the primary config instead of a real union. The code reaches the same `wordsOf()` that gives `BoardPreset.categories` its rows, so the order matches a board's by construction.

## Spec

S1. A whole-suite command ran during the step.
- Place: the report, section "Check 1": "One whole-suite command ran by mistake: `npx vitest run --project unit --dir <scratchpad>` ignored `--dir` and ran the unit project; it was stopped part way after about 300 s".
- What is wrong: the rules file's token discipline says a whole-suite command "is a finding of the review".
- Failure scenario: about 300 s of a full unit-suite run on a machine already at load 20 or more, which raises the chance of the timeouts other suites see. It gave no result the step uses.

Judged, no finding: `src/lib/data/shapes/vocab-keys.ts:146`, `export function wordNumber(` changed to `function wordNumber(`.
- `grep -rn "wordNumber"` on the base finds the only outside caller at `cross-links.ts:10,169`.
- On the worktree it finds only `vocab-keys.ts:146,171`.
- With `groupOf` gone, the rules file's unused-export rule requires the export to be removed or made local.
- The report names the path outside the write list with its reason, as the rules file asks.
- The doc comment of `wordNumber` ("a stage's place in the Archival band") is still true.

## Proof

none

## Standards

T1. Two edited comment paragraphs are not rewrapped at 100 columns. The rules file says "A comment edited by the step is rewrapped as a whole paragraph at 100 columns, so no line inside a sentence ends short."
- `src/lib/views/shared/card/record/RecordCard.svelte:24`, 79 columns:
  ```
  // per role), then the kind's own `foot`. A kind that draws the dated lines
  // inside a block of its own, the project page's right column, hands `details`, which is given
  ```
  `:26` ("them. A kind that hands `deleting` has the question before a delete", 74 columns) is in the same paragraph.
- `src/lib/state/boards/structure/cross-links.ts:3`, 85 columns, while the next word "organisation" fits:
  ```
  // out and the projects in no row last as "other": one strip for a funding scheme, an
  ```
- How they were found: an awk pass over the changed files for comment lines whose next word would fit within 100 columns. It found only these two edited places, plus `vocab-keys.ts:5`, which the step did not edit.
- Failure scenario: a reader of the head comment meets lines broken mid-sentence. This is the hard-wrap pattern the prose standard bans.

T2. A construct in `groupProjects` is harder to read than its job needs.
- Place: `src/lib/state/boards/structure/cross-links.ts`, inside `groupProjects`:
  ```
  ...[''].flatMap((key) => held.get(key) ?? [])
  ```
- What is wrong: this spreads a one-element literal array to append the "other" group when it exists. A plain `const other = held.get(''); ... ...(other === undefined ? [] : [other])` says the same thing directly.
- Failure scenario: a maintainer reading the group order has to work out that the third spread is the "other" group. The head comment names "other" last, but the code does not say so at that line.

Judged, no finding: `tests/checks/tree/allow-styling.ts:25,29,33` cite `CrossLinks.svelte:169` and `:163`.
- On the base copy the rules are at `:187` and `:181` (`grep -n ":global(.label)\|:global(.tip)"` on `../O96-base`). On the worktree they are at `:190` and `:184`.
- The citations were already false before the step. The diff moved the lines by 3 but did not make the citations false, and the `line:` keys the check matches are unchanged.

Judged still true: `ProjectCard.svelte:25` and `RadarCard.svelte:11,154` ("those the strip groups under none"). The strip still puts the archival projects in no group.

Judged, no finding: `config/options/catalogs/vocab.yml:29` now reads "the idea group and the Focus board's unplaced projects". The only reader of the `idea` flag is `src/lib/state/boards/focus.ts:491` (`grep -rn "'idea'" src`). The sentence is loose but not false.

## Behaviour

B1. A project with no stage now draws an empty stage tag in the "other" group.
- Place: `src/lib/views/shared/links/CrossLinks.svelte:94-98`, together with `cross-links.ts` `stageOf` (`project.stage ?? ''`) and `membersByStage`:
  ```
  {#each membersByStage(group) as kind (kind.stage)}
      <div class="kind" data-project-kind={kind.stage}>
          {#if group.stage === undefined}
              <Tag label={kind.stage} />
  ```
- What is wrong: before the step, a stageless project was in no group (`groupOf('')` returned null). Now it lands under "other" (case 17), and its stage nesting draws `<Tag label="" />`.
- Failure scenario: a manifest with no `stage:` on a funding scheme's strip. Opening "other" draws an empty tag before the project. Under the terminal theme with brackets on, `Tag.svelte`'s `::before` and `::after` rules render it as "[ ]".
- The report's case 17 row and its "Visible changes" list do not mention it.

B2. Visible changes the report's "Visible changes" section does not state with a before and after:
- The warning mark is no longer limited to the in-flight group. Before: a blocked project at `nascent` gave no warning. After: the idea group carries it, and a blocked project at `submitted` puts it on the "in review" group (case 4).
- Under a Projects pick, the entry groups' counts (case 21), line 2's status slice counts, and the No funding slice's count (case 24, `count:0`) change.
- These appear only as case results. The landing look reads its list from "Visible changes", so these states are not named for it.
- Failure scenario: the look at landing checks the strip groups and More but not a blocked idea's warning, or a slice count under a Category pick.

## Declined to judge

- `npm run diagrams`: not run, because it writes `docs/diagrams/*` and this review changes no file. In its place I ran the in-memory staleness check, `tests/checks/diagrams/diagrams.test.ts`, alone. It timed out under load twice, then passed with `--testTimeout 180000 -t "each file byte for byte"` (quoted above).
- The builder's first run on the unchanged tree (`npx vitest run --config <scratchpad>/caserun/case.config.mts --root $PWD first`): not rerun. `first.test.ts` imports from the worktree, which now holds the change, and the base copy has no installed tree to run it from.
- The builder's quoted `git diff -U0 -- src config docs/HELP.md | grep ...` (Check 8) without a base revision: not run in that form, since it is `git diff` without `909f79d53`. I ran the same grep over `git diff -U0 909f79d53` (Verify 8 above).
- The colour of each group heading, the "Projects" heading and rule in More, cards hidden in cards and list mode, and the empty tag of B1 under each theme: only a page shows these. They are for the look at landing.
- Whether `docs/HELP.md` and the head comments match what the look shows: by reading only.
