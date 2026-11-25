# O190 report: the date a paper was submitted, on its cards

Everything in the brief is done.

One path outside the write list was changed: `docs/apps.md` line 416, the Apps guide's `projects` row, which gains `submitted?` (reason under "Files"). The run of `npm run test:quick` was stopped by the coordinator's instruction under ruling 777 (a) before it ended (details under "Runs").

## Open items of the state file, verbatim

The section "## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)" of `.scratch/migration/orchestrator-state.md` (lines 175-189) holds no item: only blank lines, then "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

## The cases' first run (unchanged tree)

Program: `.agents/scratch/cases.ts`, run with `TMPDIR=$S GIT_CEILING_DIRECTORIES=$S taskpolicy -b nice -n 19 npx tsx --tsconfig .agents/scratch/tsconfig.json .agents/scratch/cases.ts` (`S=.agents/scratch/tmp`). It plants a hub of synthetic manifests under `.agents/scratch/tmp`, builds it with `buildHubs` (so `normalise` and the manifest schema check run on the YAML text), then calls the fact function, the formatter, `laneFacts`, `laneItems` and `fieldValues` with `now` fixed at 2026-11-25 12:00 local time. Its source is quoted at the end of this report. On the unchanged tree `cardSubmitted` and `submittedWords` do not exist, which the program prints as "no fact function" and "no formatter"; the first run called `laneFacts` with four arguments and `{}` as the venues, and the venue lines and the decision-1 lines were not yet in the program.

First-run output, as printed:

```
case 1: project.submitted=undefined
  fact=no fact function
  words=no formatter
  laneFacts=[]
  findings=["submitted: key submitted is not declared by the schema of this file"]
case 2: project.submitted=undefined
  fact=no fact function
  words=no formatter
  laneFacts=[]
  findings=[]
case 3: project.submitted=undefined
  fact=no fact function
  words=no formatter
  laneFacts=[]
  findings=["submitted: key submitted is not declared by the schema of this file"]
case 4: project.submitted=undefined
  fact=no fact function
  words=no formatter
  laneFacts=[]
  findings=["submitted: key submitted is not declared by the schema of this file"]
case 5: project.submitted=undefined
  fact=no fact function
  words=no formatter
  laneFacts=[]
  findings=["submitted: key submitted is not declared by the schema of this file"]
case 6: project.submitted=undefined
  fact=no fact function
  words=no formatter
  laneFacts=[]
  findings=["submitted: key submitted is not declared by the schema of this file"]
case 7: project.submitted=undefined
  fact=no fact function
  words=no formatter
  laneFacts=[]
  findings=["submitted: key submitted is not declared by the schema of this file"]
case 8: project.submitted=undefined
  fact=no fact function
  words=no formatter
  laneFacts=[]
  findings=["submitted: key submitted is not declared by the schema of this file"]
case 9: fact=no fact function laneFacts=[]
case 10: fact=no fact function laneFacts=[]
case 11: review=Delta(d11), Alpha(a11), Beta(c11), Zeta(b11)
case 11 reversed input: review=Delta(d11), Alpha(a11), Beta(c11), Zeta(b11)
case 12: review=Alpha(a12), Zeta(z12)
case 12 reversed input: review=Zeta(z12), Alpha(a12)
case 13: review=Alpha(a13), Zeta(z13)
case 14: review=Alpha(a14), Beta(b14), Gamma(g14)
case 15: revise=Alpha(a15), Zeta(z15)
case 15: fact a15=no fact function fact z15=no fact function
case 16: idea=Alpha(a16), Mu(m16), Zeta(z16)
case 17: fieldValues.submitted=undefined
```

Cases 18 and 19, first run: `taskpolicy -b nice -n 19 npx vitest run --maxWorkers 2 --reporter verbose tests/checks/config/templates.test.ts tests/data/snapshot/normalise.test.ts`, with the test edit of item 9 in place and the source unchanged:

```
 x |unit| tests/data/snapshot/normalise.test.ts > normalise, the field mapping > fills a project from the manifest keys of the same meaning 25ms
 v |unit| tests/checks/config/templates.test.ts > docs/templates.md > shows every field of the manifest schema a file holds in the project.yml template 122ms
 FAIL  |unit| tests/data/snapshot/normalise.test.ts > normalise, the field mapping > fills a project from the manifest keys of the same meaning
- Expected
+ Received
-   "submitted": "2026-10-24",
 Test Files  1 failed | 1 passed (2)
      Tests  1 failed | 17 passed (18)
```

(`x` and `v` stand for the cross mark and check mark glyphs vitest prints.) The failing line of the changed test on the unchanged tree is `-   "submitted": "2026-10-24",`: the expected project carries `submitted` and the parsed one does not.

Per case, unchanged tree: cases 1 to 10 show no fact and no key (the parsed project has no `submitted`, and every manifest that writes the key gets the finding "key submitted is not declared by the schema of this file"); case 11 gives D, A, C, B (title order after the dated card); case 12 keeps the input order (equal deadlines compare 0); case 13 gives Alpha, Zeta; case 14 gives Alpha, Beta, Gamma (title order, the dated card not first); case 15 gives Alpha, Zeta (title order); case 16 gives title order; case 17 gives `undefined`; case 18 fails as quoted; case 19 passes.

No case of the brief's own rules turned out wrong, so the build went ahead without a hand-back.

## Cases after the change

Same program, after the last change, `exit=0`, output as printed:

```
case 1: project.submitted="2026-10-24"
  fact={"date":"2026-10-24","days":32}
  words={"label":"submitted 2026-10-24 | 32d","tip":"Submitted: 2026-10-24, 32 days ago"}
  laneFacts=[{"kind":"submitted","submitted":{"date":"2026-10-24","days":32}}]
  findings=[]
case 2: project.submitted=undefined
  fact=null
  words=no formatter
  laneFacts=[]
  findings=[]
case 3: project.submitted="2026-11-26"
  fact={"date":"2026-11-26"}
  words={"label":"submitted 2026-11-26","tip":"Submitted: 2026-11-26"}
  laneFacts=[{"kind":"submitted","submitted":{"date":"2026-11-26"}}]
  findings=[]
case 4: project.submitted="2026-11-25"
  fact={"date":"2026-11-25","days":0}
  words={"label":"submitted 2026-11-25 | 0d","tip":"Submitted: 2026-11-25, 0 days ago"}
  laneFacts=[{"kind":"submitted","submitted":{"date":"2026-11-25","days":0}}]
  findings=[]
case 5: project.submitted="soon"
  fact=null
  words=no formatter
  laneFacts=[]
  findings=["submitted: submitted is soon, which is not a day written YYYY-MM-DD"]
case 6: project.submitted="2026-10-24T10:00:00+02:00"
  fact=null
  words=no formatter
  laneFacts=[]
  findings=["submitted: submitted is 2026-10-24T10:00:00+02:00, which is not a day written YYYY-MM-DD"]
case 7: project.submitted="2026-10-24"
  fact={"date":"2026-10-24","days":32}
  words={"label":"submitted 2026-10-24 | 32d","tip":"Submitted: 2026-10-24, 32 days ago"}
  laneFacts=[{"kind":"submitted","submitted":{"date":"2026-10-24","days":32}}]
  findings=[]
case 8: project.submitted="2026-10-24"
  fact=null
  words=no formatter
  laneFacts=[]
  findings=[]
case 1 with a venue: laneFacts=[{"kind":"submitted","submitted":{"date":"2026-10-24","days":32}},{"kind":"venue","label":"BSPC","whole":"Signal Processing"}]
case 2 with a venue: laneFacts=[{"kind":"venue","label":"BSPC","whole":"Signal Processing"}]
case 9: fact={"date":"2026-10-24","days":32} laneFacts=[{"kind":"submitted","submitted":{"date":"2026-10-24","days":32}}]
case 10: fact=null laneFacts=[]
case 11: review=Delta(d11), Zeta(b11), Alpha(a11), Beta(c11)
case 11 reversed input: review=Delta(d11), Zeta(b11), Alpha(a11), Beta(c11)
case 12: review=Zeta(z12), Alpha(a12)
case 12 reversed input: review=Zeta(z12), Alpha(a12)
case 13: review=Alpha(a13), Zeta(z13)
case 14: review=Gamma(g14), Alpha(a14), Beta(b14)
case 15: revise=Zeta(z15), Alpha(a15)
case 15: fact a15=null fact z15=null
case 16: idea=Alpha(a16), Mu(m16), Zeta(z16)
case 17: fieldValues.submitted="2026-10-24"
decision 1, 2026-10-24: {"label":"submitted 2026-10-24 | 32d","tip":"Submitted: 2026-10-24, 32 days ago"}
decision 1, 2026-11-19: {"label":"submitted 2026-11-19 | 6d","tip":"Submitted: 2026-11-19, 6 days ago"}
decision 1, 2026-11-04: {"label":"submitted 2026-11-04 | 21d","tip":"Submitted: 2026-11-04, 21 days ago"}
decision 1, 2026-10-22: {"label":"submitted 2026-10-22 | 34d","tip":"Submitted: 2026-10-22, 34 days ago"}
decision 1, 2026-11-26: {"label":"submitted 2026-11-26","tip":"Submitted: 2026-11-26"}
```

| Case | Expected by the brief | Result after the change |
|------|------------------------|-------------------------|
| 1 | 2026-10-24, 32 days, first in `laneFacts`, label `submitted 2026-10-24 \| 32d` | met; "case 1 with a venue" puts it before the venue |
| 2 | no fact, `laneFacts` as unchanged | met: `[]` on both runs |
| 3 | date with no days, label `submitted 2026-11-26` | met |
| 4 | 0 days, label `submitted 2026-11-25 \| 0d`, plural tip for 0 | met: tip "0 days ago" (the `other` form) |
| 5 | no fact, `not_a_date` names the field | met |
| 6 | no fact, `not_a_date` names the field | met |
| 7 | as case 1 | met |
| 8 | no fact | met |
| 9 | fact given in the hub's own words | met |
| 10 | no fact | met |
| 11 | D, B, A, C | met: Delta, Zeta, Alpha, Beta, from either input order |
| 12 | Zeta, Alpha | met, from either input order |
| 13 | Alpha, Zeta | met |
| 14 | title order, after every dated card | met: Gamma (dated) then Alpha, Beta |
| 15 | older first, no fact | met |
| 16 | title order | met |
| 17 | `submitted: '2026-10-24'` | met |
| 18 | G32 row carries it | met (test run below) |
| 19 | templates test passes | met (test run below) |

What the cards draw (cases 1 to 4 on a board card and a lane card, the Review lane's order on screen) is proved only at the look on landing; see "Before and after".

## DONE / NOT DONE

| Item | State | Proof (command, output as printed) |
|------|-------|-------------------------------------|
| 1 The key: schema field, `Project.submitted`, `normalise`, `fieldValues` | DONE | case program: case 1 `project.submitted="2026-10-24"`, cases 5/6 `not a day written YYYY-MM-DD`, case 17 `fieldValues.submitted="2026-10-24"`; `config/schemas/manifest-schema.yml:77`, `src/lib/data/model/model-entities.ts:485-489`, `src/lib/data/snapshot/normalise.ts:291`, `src/lib/state/forms/schema.ts:481` |
| 2 The fact: `cardSubmitted` in `focus.ts` | DONE | case program cases 1-10 as above; `src/lib/state/boards/focus.ts:636` |
| 3 The words once: `submittedWords` in `card.ts`, strings under `project.card` | DONE | case program "words=" lines and decision-1 lines; `src/lib/views/shared/card/card.ts:250`, `config/text/views/boards/project.yml:132-138` |
| 4 Drawn on a board card | DONE (by reading and the type check; the look on landing is its proof) | `npm run check`: `COMPLETED 4687 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| 5 Drawn on a lane card: `laneFacts(..., now)`, kind `submitted`, `FACT_GLYPHS`, `factTip` | DONE (lane facts by run; the drawing by the look on landing) | case program "laneFacts=" lines; `npm run check` as above |
| 6 The lane order and its five sentences | DONE | case program cases 11-16; the five sentences at `focus.ts:86-89`, `focus.ts:433-437`, `config/catalogs/vocab.yml:176`, `config/options/catalogs/vocab.yml:163`, `vocab.ts:126` |
| 7 The flag's three descriptions | DONE | `config/catalogs/vocab.yml:60`, `config/options/catalogs/vocab.yml:58`, `vocab.ts:178` (read in the diff) |
| 8 The template line | DONE | `docs/templates.md:1239`; templates test below |
| 9 G32's test carries `submitted` | DONE | unchanged-tree run failed as quoted; after: `v ... fills a project from the manifest keys of the same meaning 2ms` |
| 10 Doc text | DONE | section "Doc text" below |
| Verify 1: `npm run diagrams` | DONE | `diagrams exit=0`; it rewrote `docs/diagrams/layer-state.dot/.svg` and `layers.dot/.svg` (one edge count each, 113 to 114 and 585 to 586, the new import of `data/helpers/dates.ts` by `focus.ts`) |
| Verify 1: prettier | DONE | `npx prettier --check <17 changed files>`: `Checking formatting...` / `All matched files use Prettier code style!` |
| Verify 1: eslint | DONE | `npx eslint <11 changed .ts/.svelte files>`: no output, `eslint exit=0` |
| Verify 1: `npm run check` | DONE | `check exit=0`; `1795612332123 COMPLETED 4687 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS` |
| Verify 2: the two test files | DONE | `npx vitest run tests/checks/config/templates.test.ts tests/data/snapshot/normalise.test.ts --maxWorkers 2 --reporter verbose`: `Test Files  2 passed (2)` / `Tests  18 passed (18)` |
| Verify 3: ASCII check | DONE | `git diff --name-only \| grep -v '^.scratch' \| xargs env LC_ALL=C perl -ne 'print "$ARGV:$.\n" if /[^\x20-\x7E\n]/; close ARGV if eof'`: no output, `perl exit=0` |
| Verify 4: sizes | DONE | `wc -l`: focus.ts 875, card.ts 279, model-entities.ts 852, normalise.ts 714, schema.ts 639, vocab.ts 613, CardFacts.svelte 176, ProjectCard.svelte 458, Lanes.svelte 380, LaneCard.svelte 366 |
| Verify 5: changed test on the unchanged tree, then after | DONE | quoted above: red before (`-   "submitted": "2026-10-24",`), green after. It is a proof: the row fails without `submitted: str(manifest.submitted)`, as the unchanged-tree run showed |
| Verify 6: list items and sentence length | DONE | see "Sentences and list items" |
| History-word grep | DONE | see "Conventions checks" |
| Unused exports | DONE | `sh utils/unused-exports.sh`: the lines for the changed files are `src/lib/data/snapshot/normalise.ts: collectionViews, ENTITY_KINDS`, `src/lib/views/shared/card/card.ts: SESSION_VIEWS, SHOWN`, `src/lib/data/model/model-entities.ts: Chip`, names the step did not add; `cardSubmitted`, `Submitted` and `submittedWords` are not listed (each has an importer) |

## Runs

- `npm run test:quick`: started once, together with `npm run diagrams`, after the build. It printed `ok ASCII gate (2.2 s)`, `ok prettier (2.5 s): All matched files use Prettier code style!`, `ok svelte-kit sync (9.5 s)` and `ok eslint (196.5 s)`; its vitest runs and svelte-check had not ended when the coordinator, under ruling 777 (a), told me to stop it. I killed `npm run test:quick` (pid 92509), `tests/tiers/quick.mjs` (94541), its three vitest runs (95841, 95842, 95843) with their workers, and svelte-check (95845) with its `tsc` (96504); the log ends `exit=143`, and `ps` then listed no process of the worktree. It was not run again. No test result of it is used in this report.
- The last round of checks the updated spec and brief name ran once, after the last change: `npm run diagrams`, the two test files, prettier, eslint, `npm run check`, the perl ASCII check.
- Whole-suite commands: none other than that one stopped `npm run test:quick`.
- Other runs: the two test files once on the unchanged source (with the test edit) and once after the change before the final round; the case program on the unchanged tree once and after the change three times, the last after the last change.

## Files

From `git diff --numstat` (lines added / removed, then `wc -l` for source files):

| File | +/- | Lines | Write list |
|------|-----|-------|------------|
| config/catalogs/vocab.yml | 2/2 | 346 | yes (lines 60 and 176) |
| config/options/catalogs/vocab.yml | 2/2 | 485 | yes (lines 58 and 163) |
| config/schemas/manifest-schema.yml | 1/0 | 137 | yes |
| config/text/views/boards/project.yml | 7/0 | 203 | yes |
| docs/apps.md | 1/1 | 861 | no: the `projects` row of the Apps guide lists every `Project` field an app reads, and the new `submitted?` field made it incomplete; the spec says a step writes what an app builder meets into `docs/apps.md` and a sentence the change makes false is a defect |
| docs/diagrams/layer-state.dot, .svg; layers.dot, .svg | 1/1 each | generated | yes (written by `npm run diagrams`) |
| docs/templates.md | 1/0 | 2226 | yes |
| src/lib/data/model/model-entities.ts | 5/0 | 852 | yes |
| src/lib/data/shapes/catalog-files/vocab.ts | 2/2 | 613 | yes |
| src/lib/data/snapshot/normalise.ts | 1/0 | 714 | yes |
| src/lib/state/boards/focus.ts | 75/15 | 875 | yes |
| src/lib/state/forms/schema.ts | 1/0 | 639 | yes |
| src/lib/views/boards/focus/lanes/LaneCard.svelte | 22/9 | 366 | yes |
| src/lib/views/boards/focus/lanes/Lanes.svelte | 1/1 | 380 | yes |
| src/lib/views/shared/card/card.ts | 26/5 | 279 | yes |
| src/lib/views/shared/card/project/CardFacts.svelte | 26/8 | 176 | yes |
| src/lib/views/shared/card/project/ProjectCard.svelte | 12/8 | 458 | yes |
| tests/data/snapshot/normalise.test.ts | 2/0 | 400 | yes |
| .scratch/migration/agents/reviews/O190-report.md | new | - | yes |

`git status` also shows `.scratch/migration/agents/spec.md` and `.scratch/migration/agents/briefs/O190.md` as modified: the coordinator copied the updated files into the worktree; I did not edit them. No file was split. No script changed a file; the only tool that rewrote tracked files besides Edit and Write was `npx prettier --write` over the changed files (it reformatted `CardFacts.svelte` and `ProjectCard.svelte` markup) and `npm run diagrams`.

Edits to existing assertions: `tests/data/snapshot/normalise.test.ts` gains two lines, `submitted: '2026-10-24',` in the fixture after `deadline: '2026-11-17',` (line 85) and in the expected project after `deadline: '2026-11-17',` (line 326). No existing line of a test, allow list or predicate changed.

## The code, in short

```ts
// focus.ts
export type LaneFact =
    | { kind: 'year' | 'role' | 'tier' | 'venue'; label: string; whole: string }
    | { kind: 'submitted'; submitted: Submitted };
export type Submitted = { date: string; days?: number };

function submittedDay(project: Pick<Project, 'submitted'>): string | undefined {
    const date = project.submitted;
    return date !== undefined && ISO_DATE.test(date) ? date : undefined;
}

export function cardSubmitted(project, words, now): Submitted | undefined {
    const date = submittedDay(project);
    if (date === undefined || !hasWord(words, 'stages', 'pauses_countdown', project.stage)) {
        return undefined;
    }
    const until = daysUntil(date, now);
    return until === null || until > 0 ? { date } : { date, days: Math.abs(until) };
}

function laneOrder(a: Project, b: Project): number {
    return (
        presentFirst(a.deadline ?? '', b.deadline ?? '') ||
        presentFirst(submittedDay(a) ?? '', submittedDay(b) ?? '') ||
        titleOrder(a, b)
    );
}
```

```yaml
# config/text/views/boards/project.yml, under project.card
submitted: submitted {0}
submitted_ago:
    one: 'Submitted: {0}, {1} day ago'
    other: 'Submitted: {0}, {1} days ago'
submitted_days: submitted {0} | {1}d
submitted_glyph: stale
submitted_tip: 'Submitted: {0}'
```

## Judgment calls the brief left open (each reversible)

1. Names: `cardSubmitted` (beside `cardYear`), the type `Submitted`, the private `submittedDay` and `presentFirst` in `focus.ts`; `submittedWords` in `card.ts`; the catalog keys `project.card.submitted`, `submitted_days`, `submitted_tip`, `submitted_ago` (plural map), `submitted_glyph`.
2. `LaneFact` became a union: the four old kinds keep `label` and `whole`, and the kind `submitted` carries the `Submitted` value, since `focus.ts` holds no words and the label is made by `submittedWords`. `LaneCard.svelte` gains a local `factLabel`.
3. `laneFacts` takes `now` as its last parameter, after `venues`.
4. A value that passes `ISO_DATE` but names no calendar day `Date.parse` reads (such as `2026-13-01`, `Date.parse` gives NaN, checked with `node -e`) gives the date with no days, as the deadline badge shows such a date alone. `2026-02-30` passes `Date.parse` (it reads as 2 March), so it gets days, as decision 4 says.
5. The value is tested as written, untrimmed, the same test the schema check applies; ` 2026-10-24` with a leading space gives no fact, and the schema check names it.
6. Equal deadlines with no `submitted` on either now sort by title; the unchanged `laneOrder` returned 0 there and kept the input order (case 12 reversed input on the first run). The brief's order ("then title") asks for this.
7. On the board card, the tag sits right after the chips and right before the year, inside the same `Tooltip` and `Tag` form as the year.
8. The help words of the schema field say "While the stage is submitted"; the code reads the flag `pauses_countdown`, which only `submitted` carries in oculus's words.

## Keys and paths checked

- The manifest key `submitted`: absent (`submitted:` with no value) passes the schema (`type: ['string','null']`, `record.ts:191`) and gives no fact; empty text gives the `not_a_date` finding and no fact (by reading `record.ts:191`, not run); a duplicate key is the existing duplicate-key finding (`run.ts` `duplicateKeys`, by reading, not run); it is a different namespace from the stage word `submitted`.
- The catalog keys: `grep -n submitted config/text/views/boards/project.yml` shows only the five new keys; each is named literally in `card.ts`, `CardFacts.svelte` or `LaneCard.svelte`.
- The lane fact key `fact:submitted` is unique on a card, since `laneFacts` pushes the kind at most once.
- No asynchronous path: every new function is pure; `CardFacts.svelte` recomputes the fact through `$derived.by` when `now` changes.

## Before and after (for the look on landing)

- Projects board (and every board that draws `ProjectCard.svelte`), a card at stage `submitted` with `submitted: 2026-10-24`, today 2026-11-25: before, the facts row draws no submitted tag; after, it draws a tag with the hourglass glyph (`stale`) and `submitted 2026-10-24 | 32d` right after the chips and before the year, its hover tip `Submitted: 2026-10-24, 32 days ago`. A date after today draws `submitted 2026-11-26` with the tip `Submitted: 2026-11-26`; today draws `| 0d` and `0 days ago`.
- Focus board, Review lane, the same card: before, its tags after the marks start with the year, role, tier or venue; after, the submitted tag comes first among the facts, same label, glyph and tip.
- Focus board, Review lane order: before, cards of no deadline were in title order; after, they are ordered by `submitted`, oldest first, then the undated cards in title order, after every card with a deadline. Cards of the same deadline follow the same rule.
- Revise lane: cards that carry `submitted` are ordered by it as well, and draw no submitted tag.
- Idea and Umbrella lanes: unchanged, title order.
- Project form (Edit Manifest), Dates section: a new field "Submitted", a date input, between Deadline and Follow-ups, opened with the manifest's value.
- Settings help of a stage's `pauses_countdown` toggle and of a cluster's `sort` gain the new words.
- Look in Oculus Light and one dark theme, on a hub copy holding the twelve dates the ruling writes.

## Anything in the brief wrong or impossible

- The brief's case-run program is to be run with `npx tsx`. `tsx` resolves neither the `$lib` alias (the worktree has no `.svelte-kit` folder at that point) nor Svelte runes (`generation.svelte.ts` holds `$state` at module level). The program therefore runs with a scratch `tsconfig.json` mapping `$lib` to `src/lib`, and sets `$state` and `$derived` on `globalThis` as identity functions before its dynamic imports. Both live only in `.agents/scratch`, now removed; the reviewer recreates them from the source below.
- `docs/apps.md` was outside the write list and needed the field (see "Files").

## Limitations and sharp edges

- The drawing on both cards is proved only by reading, the type check and the look on landing; no unit test covers `cardSubmitted`, `laneFacts`, `laneOrder` or `submittedWords`, since no guarded entry covers them (the brief says no other test is written).
- The tip for 1 day ("1 day ago", the `one` form) was not run; only 0, 6, 21, 32 and 34 days were.
- `focus.ts` is at 875 lines, 5 under the 880 limit; the next step that adds to it will need to split it.
- The `pauses_countdown` description in `config/catalogs/vocab.yml:60` and `vocab.ts:178` now names the manifest key `submitted`, so the flag's description mentions a manifest field.

## Conventions checks

- History words: `git diff -U0 -- src config docs/templates.md docs/apps.md tests | grep '^+' | grep -i -E "\b(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|O[0-9]+|20[0-9]{2}-[0-9]{2}-[0-9]{2})\b"` prints five hits: the `focus_clusters` comment's existing words "drawn before it", the `laneOrder` doc "a project with a day before one without", the `presentFirst` doc "a value before none" (all three an order, not history), and the two `submitted: '2026-10-24',` lines of the test fixture (test data, not a comment or title). No test title was added or changed.
- Grep of the changed names across `src`, `tests`, `config`, `docs`, `README.md`: `laneFacts` and `LaneFact` are used only in `focus.ts`, `Lanes.svelte` and `LaneCard.svelte`, all updated; `CardFacts` has one caller, `ProjectCard.svelte:394`, updated; `grep -rn -i 'then title\|by deadline'` finds the lane-order sentence only at the five places, all rewritten (the other hits are the board's own order, "stage, then title", a different rule).
- Helper grep before writing: `grep -rn 'ISO_DATE.test\|isIsoDate\|isDay('` found no shared helper for "a day written YYYY-MM-DD", only inline `ISO_DATE.test` at five call sites, so `submittedDay` uses `ISO_DATE.test` the same way.
- Head and doc comments re-read: `focus.ts` head comment (rewritten), `Cluster` doc (rewritten), `laneItems` doc (rewritten), `laneOrder` doc (rewritten), `laneFacts` doc (rewritten), `LaneFact` doc (rewritten), `pausesCountdown` doc (still true), `cardYear` doc (still true); `card.ts` head comment (rewritten), `deadline` and `dueBadge` docs (still true); `CardFacts.svelte` head comment and the `words` doc (rewritten); `ProjectCard.svelte` head comment and the `now` prop doc (rewritten); `LaneCard.svelte` head comment, the `facts` prop doc and the `factTip` doc (rewritten); `Lanes.svelte` head comment (still true: "its facts (state/boards/focus.ts `laneFacts`)"); `docs/templates.md` lines 715-719 on `focus_clusters` (still true: it names `sort: title` only); `docs/HELP.md` line 102 (still true; addition proposed below); `docs/data-map.md:383` (now incomplete; replacement below).

## Sentences and list items

Each new comment and help sentence states one rule. Three run long because they carry a full rule in one place: the `cardSubmitted` doc (the condition, the exceptions and how the flag is read), the `laneOrder` doc (three keys of the order with their tie rules) and the `LaneCard.svelte` head-comment sentence listing the facts in order, which was one long sentence and stays one list in its own form. The catalog strings follow the existing `project.card` forms (`'{0}d'`, `'Kind: {0}'`, `one:`/`other:` maps).

## Doc text (for `docs/data-map.md` and `docs/HELP.md`; this step does not write them)

`docs/data-map.md`, current line (`grep -n '`deadline`, `snooze`' docs/data-map.md`):

```
383:| `deadline`, `snooze` | the next deadline, and the day before which the project stays off the ticker |
```

Replacement:

```
| `deadline`, `submitted`, `snooze` | the next deadline, the day the paper was last submitted to the venue that holds it now (drawn with the days since on its cards while the stage carries `pauses_countdown`), and the day before which the project stays off the ticker |
```

`docs/HELP.md`, the line a new one follows (`grep -n -F -- '- A project sits on the lane of `focus_lanes`' docs/HELP.md`):

```
102:- A project sits on the lane of `focus_lanes` whose `stages` holds its `stage`, or on Blocked or Backburner when its `status.chips` carry `blocked` or `parked`. Dropping a card on a lane writes what the lane's `move_writes` names: the stage, or the chip.
```

New line after it:

```
- A lane's cards go by deadline, then by the manifest's `submitted` day, the oldest first, then by title; a cluster with `sort: title` orders them by title alone. A card at a stage that carries `pauses_countdown` (submitted) draws its `submitted` day with the days since it.
```

## The case-run program (removed before this report)

`.agents/scratch/tsconfig.json`:

```json
{
    "compilerOptions": {
        "module": "esnext",
        "moduleResolution": "bundler",
        "target": "es2022",
        "allowImportingTsExtensions": true,
        "baseUrl": "../..",
        "paths": { "$lib": ["src/lib"], "$lib/*": ["src/lib/*"] }
    }
}
```

`.agents/scratch/cases.ts`, as of the final run:

```ts
// Case-run program of step O190: prints the result of each case of the brief for its input. It
// writes only a planted hub under .agents/scratch/tmp, which it removes at the end. Svelte runes
// are stood in for by identity functions so the client-state modules load under tsx.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';

const runes = globalThis as Record<string, unknown>;
runes.$state = (value: unknown) => value;
runes.$derived = (value: unknown) => value;

const WT = resolve(import.meta.dirname, '../..');
const SCRATCH = join(WT, '.agents/scratch/tmp');

const { engineDir, loadConfig, textCatalog } = await import(`${WT}/src/lib/data/sources/config.ts`);
const { portfolioConfigFrom } = await import(`${WT}/src/lib/data/index.ts`);
const { createChecker } = await import(`${WT}/src/lib/data/snapshot/schema/check.ts`);
const { folderGlobs } = await import(`${WT}/src/lib/data/sources/documents/folder-globs.ts`);
const { buildHubs } = await import(`${WT}/src/lib/server/root/watch/build.ts`);
const focus = await import(`${WT}/src/lib/state/boards/focus.ts`);
const { fieldValues } = await import(`${WT}/src/lib/state/forms/schema.ts`);
const { setCatalog } = await import(`${WT}/src/lib/state/shared/words/text.ts`);
const card = await import(`${WT}/src/lib/views/shared/card/card.ts`);

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
const CONFIG = portfolioConfigFrom(config);

/** 2026-11-25 12:00 local time. */
const NOW = new Date(2026, 10, 25, 12, 0, 0).getTime();

const MANIFESTS: Record<string, string> = {
    c1: 'title: C1\ntier: research\nstage: submitted\nsubmitted: 2026-10-24\n',
    c2: 'title: C2\ntier: research\nstage: submitted\n',
    c3: 'title: C3\ntier: research\nstage: submitted\nsubmitted: 2026-11-26\n',
    c4: 'title: C4\ntier: research\nstage: submitted\nsubmitted: 2026-11-25\n',
    c5: 'title: C5\ntier: research\nstage: submitted\nsubmitted: soon\n',
    c6: 'title: C6\ntier: research\nstage: submitted\nsubmitted: 2026-10-24T10:00:00+02:00\n',
    c7: "title: C7\ntier: research\nstage: submitted\nsubmitted: '2026-10-24'\n",
    c8: 'title: C8\ntier: research\nstage: revision\nsubmitted: 2026-10-24\n',
    a11: 'title: Alpha\ntier: research\nstage: submitted\nsubmitted: 2026-11-19\n',
    b11: 'title: Zeta\ntier: research\nstage: submitted\nsubmitted: 2026-10-22\n',
    c11: 'title: Beta\ntier: research\nstage: submitted\n',
    d11: 'title: Delta\ntier: research\nstage: submitted\ndeadline: 2026-12-01\n',
    a12: 'title: Alpha\ntier: research\nstage: submitted\ndeadline: 2026-12-01\nsubmitted: 2026-11-19\n',
    z12: 'title: Zeta\ntier: research\nstage: submitted\ndeadline: 2026-12-01\nsubmitted: 2026-10-22\n',
    z13: 'title: Zeta\ntier: research\nstage: submitted\nsubmitted: 2026-10-24\n',
    a13: 'title: Alpha\ntier: research\nstage: submitted\nsubmitted: 2026-10-24\n',
    b14: 'title: Beta\ntier: research\nstage: submitted\nsubmitted: soon\n',
    a14: 'title: Alpha\ntier: research\nstage: submitted\n',
    g14: 'title: Gamma\ntier: research\nstage: submitted\nsubmitted: 2026-11-19\n',
    a15: 'title: Alpha\ntier: research\nstage: revision\nsubmitted: 2026-11-19\n',
    z15: 'title: Zeta\ntier: research\nstage: revision\nsubmitted: 2026-10-22\n',
    z16: 'title: Zeta\ntier: research\nstage: nascent\nsubmitted: 2026-10-22\n',
    a16: 'title: Alpha\ntier: research\nstage: nascent\nsubmitted: 2026-11-19\n',
    m16: 'title: Mu\ntier: research\nstage: nascent\n'
};

const planned = join(SCRATCH, 'hub-');
if (!resolve(planned).startsWith(resolve(SCRATCH) + sep)) throw new Error('not in scratch');
mkdirSync(SCRATCH, { recursive: true });
const hub = mkdtempSync(planned);
for (const [id, text] of Object.entries(MANIFESTS)) {
    const dir = join(hub, 'projects/active', id);
    if (!resolve(dir).startsWith(resolve(hub) + sep)) throw new Error('not in hub');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'project.yml'), text);
}

const portfolio = { ...CONFIG, scan: [{ dir: 'projects/active' }] };
const primary = { key: 'hub', dir: hub, portfolio, workspace: null };
const read = { primary, others: [], config: portfolio, order: ['hub'], self: '' };
const { snapshot } = buildHubs(read, 0, createChecker(), null, folderGlobs());
const projects = snapshot.entities.projects;
const P = (id: string) => projects[`hub:${id}`];

const factFn = focus.cardSubmitted as undefined | ((p: unknown, w: unknown, n: number) => unknown);
const words = config;
const fact = (project: unknown, using: Record<string, unknown> = words) =>
    factFn === undefined ? 'no fact function' : JSON.stringify(factFn(project, using, NOW) ?? null);
const wordsOf = (fact: unknown) => {
    const fmt = card.submittedWords as undefined | ((f: unknown) => unknown);
    if (fmt === undefined || fact === undefined) return 'no formatter';
    return JSON.stringify(fmt(fact));
};
const VENUES = { 'hub:bspc': { id: 'hub:bspc', name: 'Signal Processing', short: 'BSPC' } };
const facts = (project: unknown, using: Record<string, unknown> = words) =>
    JSON.stringify(focus.laneFacts(project, using, new Set(), VENUES, NOW));
const findingsOf = (id: string) =>
    JSON.stringify(
        snapshot.findings
            .filter((one: { file: string }) => one.file.includes(`/${id}/`))
            .map((one: { key: string; message: string }) => `${one.key}: ${one.message}`)
    );

for (const id of ['c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8']) {
    const project = P(id);
    const given = factFn === undefined ? undefined : factFn(project, words, NOW);
    console.log(`case ${id.slice(1)}: project.submitted=${JSON.stringify(project.submitted)}`);
    console.log(`  fact=${fact(project)}`);
    console.log(`  words=${wordsOf(given)}`);
    console.log(`  laneFacts=${facts(project)}`);
    console.log(`  findings=${findingsOf(id)}`);
}

console.log(`case 1 with a venue: laneFacts=${facts({ ...P('c1'), venueId: 'hub:bspc' })}`);
console.log(`case 2 with a venue: laneFacts=${facts({ ...P('c2'), venueId: 'hub:bspc' })}`);

const stages = config.stages as Record<string, Record<string, unknown>>;
const ownWords = {
    ...config,
    stages: { ...stages, 'under-review': { label: 'under review', pauses_countdown: true } }
};
const c9 = { ...P('c1'), stage: 'under-review' };
console.log(`case 9: fact=${fact(c9, ownWords)} laneFacts=${facts(c9, ownWords)}`);

const flagless = Object.fromEntries(
    Object.entries(stages).map(([key, row]) => {
        const { pauses_countdown: _, ...rest } = row;
        return [key, rest];
    })
);
const noFlag = { ...config, stages: flagless };
console.log(`case 10: fact=${fact(P('c1'), noFlag)} laneFacts=${facts(P('c1'), noFlag)}`);

const all = focus.lanes(config);
const lane = (ids: string[], key: string) =>
    (focus.laneItems(ids.map(P), all, config)[key] as { title: string; id: string }[])
        .map((one) => `${one.title}(${one.id.slice(4)})`)
        .join(', ');
console.log(`case 11: review=${lane(['a11', 'b11', 'c11', 'd11'], 'review')}`);
console.log(`case 11 reversed input: review=${lane(['d11', 'c11', 'b11', 'a11'], 'review')}`);
console.log(`case 12: review=${lane(['a12', 'z12'], 'review')}`);
console.log(`case 12 reversed input: review=${lane(['z12', 'a12'], 'review')}`);
console.log(`case 13: review=${lane(['z13', 'a13'], 'review')}`);
console.log(`case 14: review=${lane(['b14', 'a14', 'g14'], 'review')}`);
console.log(`case 15: revise=${lane(['a15', 'z15'], 'revise')}`);
console.log(`case 15: fact a15=${fact(P('a15'))} fact z15=${fact(P('z15'))}`);
console.log(`case 16: idea=${lane(['z16', 'a16', 'm16'], 'idea')}`);
console.log(
    `case 17: fieldValues.submitted=${JSON.stringify(fieldValues(P('c1'), () => false).submitted)}`
);

for (const date of ['2026-10-24', '2026-11-19', '2026-11-04', '2026-10-22', '2026-11-26']) {
    const given = factFn === undefined ? undefined : factFn({ ...P('c1'), submitted: date }, words, NOW);
    console.log(`decision 1, ${date}: ${wordsOf(given)}`);
}

rmSync(SCRATCH, { recursive: true, force: true });
```
