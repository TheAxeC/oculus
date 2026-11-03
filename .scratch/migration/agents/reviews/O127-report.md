# O127 report: a card shows the year a paper appeared

Everything in the brief is done. C10 and the drawn tags of C1, C2 and C9 are settled at the look on landing (spec.md:65), as the brief says.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md` lines 180-184 (`sed -n '180,186p'`):

- Open item 642 (2026-11-03, O127's brief check, a finding whose fix widens the step, ruling Brief check scope; `agents/reviews/O127-brief-check.md`): a year typed through the manifest form into a manifest that has none is written as the text `'2025'` (`src/lib/server/edit/writes/manifest.ts:218-220` writes a number only where the field already holds one), and `normalise.ts:278` reads `year` with `z.number()`, so such a year reaches neither the boards' year filter (`takes.ts:94`) nor O127's year tag. No manifest of the hub holds a year as text today. O127 goes on without it and draws the year as `normalise.ts` gives it. (a) Recommended, a judgment: `normalise.ts` reads `year` as a whole number from a whole number or a text of digits alone, and as nothing otherwise, the schema giving `year` as text "as a whole number" (`manifest-schema.yml:60`), with rows in the snapshot test G32 names; carried by O127 in its repair round. (b) The manifest form writes the year field as a number whatever it holds; cons: a year typed by hand into the file as `'2025'` still reads as nothing. (c) No change; the lazy option.

## The cases' first run

### The case-run program

`/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o127-cases.mjs`, in the scratchpad, outside the diff. It imports `src/lib/state/boards/focus.ts` of the tree it is given, reads oculus's words from `config/catalogs/vocab.yml` and the card's words from `config/text/views/boards/project.yml`, and prints, for each input, what `cardYear` (the item 1 function) gives, the tag and tip the board card draws from it (the catalog's `year_glyph` and `year_tip` with the year in `{0}`), and what `laneFacts` gives. The `--import` shim gives the one rune `focus.ts` reaches (`state/shared/words/generation.svelte.ts:23`, `$state`) a plain value, so the state module loads under Node.

Run: `node --import 'data:text/javascript,globalThis.$state=(v)=>v' o127-cases.mjs /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O127` from the scratchpad, PATH including `/Users/axelfaes/.nvm/versions/node/v24.21.0/bin`.

```js
// Case-run program of O127 (C1 to C9). Prints only. Run from anywhere:
//   node --import 'data:text/javascript,globalThis.$state=(v)=>v' o127-cases.mjs <worktree>
// The --import shim gives the one rune focus.ts reaches (state/shared/words/generation.svelte.ts)
// a plain value, so the state module loads under Node without Svelte's compiler.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const root = process.argv[2];
const require = createRequire(join(root, 'package.json'));
const YAML = require('yaml');
const focus = await import(join(root, 'src/lib/state/boards/focus.ts'));

const vocab = YAML.parse(readFileSync(join(root, 'config/catalogs/vocab.yml'), 'utf8'));
const card = YAML.parse(readFileSync(join(root, 'config/text/views/boards/project.yml'), 'utf8'))
    .text.project.card;
const tipOf = (year) =>
    card.year_tip === undefined ? '(no year_tip key)' : card.year_tip.replace('{0}', String(year));
const rule = focus.cardYear;

function project(fields) {
    return { id: 'p', root: 'research-hub', title: 'P', chips: [], ...fields };
}

function show(name, p, words) {
    const year = rule === undefined ? '(no function cardYear)' : String(rule(p, words));
    const facts = focus.laneFacts(p, words, new Set(), {});
    const line = [
        `${name}: stage=${String(p.stage)} year=${String(p.year)}`,
        `rule -> ${year}`,
        rule !== undefined && rule(p, words) !== undefined
            ? `tag "${String(rule(p, words))}" glyph=${String(card.year_glyph)} tip "${tipOf(rule(p, words))}"`
            : 'no tag',
        `laneFacts -> ${JSON.stringify(facts)}`
    ];
    console.log(line.join(' | '));
}

show('C1', project({ stage: 'accepted', year: 2026 }), vocab);
show('C2', project({ stage: 'published', year: 2016 }), vocab);
show('C3', project({ stage: 'submitted', year: 2026 }), vocab);
show('C4a', project({ stage: 'revision', year: 2025 }), vocab);
show('C4b', project({ stage: 'in-prep', year: 2025 }), vocab);
for (const stage of ['released', 'failed', 'stopped']) {
    show(`C5 ${stage} with`, project({ stage, year: 2024 }), vocab);
    show(`C5 ${stage} without`, project({ stage }), vocab);
}
show('C6', project({ stage: 'published', tier: 'research' }), vocab);
show('C6 with year', project({ stage: 'published', tier: 'research', year: 2025 }), vocab);
const ownStage = { ...vocab, stages: { ...vocab.stages, appeared: { terminal: true, public: true } } };
show('C7 own stage', project({ stage: 'appeared', year: 2023 }), ownStage);
const { public: _dropped, ...noPublic } = vocab.stages.published;
const hubNoPublic = { ...vocab, stages: { ...vocab.stages, published: noPublic } };
show('C7 published without public', project({ stage: 'published', year: 2023 }), hubNoPublic);
show('C8', project({ year: 2025 }), vocab);
const doneLane = {
    key: 'done',
    label: 'Done',
    icon: 'done',
    cluster: 'now',
    stages: ['published'],
    move_writes: { stage: 'published' }
};
const laneHub = { ...vocab, focus_lanes: [...vocab.focus_lanes, doneLane] };
const p9 = project({ stage: 'published', year: 2025, tier: 'paper' });
console.log(`C9 lane of the hub with a published lane: ${String(focus.projectLane(p9, () => laneHub)?.key)}`);
show('C9', p9, laneHub);
console.log(`C9 lane with oculus's lanes: ${String(focus.projectLane(p9, () => vocab)?.key)}`);
for (const stage of Object.keys(vocab.stages)) {
    const lane = focus.projectLane(project({ stage }), () => vocab)?.key;
    const year = rule === undefined ? '(no function)' : String(rule(project({ stage, year: 2025 }), vocab));
    console.log(`C9 oculus lanes: ${stage} -> lane ${String(lane)}, rule ${year}`);
}
```

### First run, on the unchanged tree (base 0e374c303, before any change)

```
C1: stage=accepted year=2026 | rule -> (no function cardYear) | no tag | laneFacts -> []
C2: stage=published year=2016 | rule -> (no function cardYear) | no tag | laneFacts -> []
C3: stage=submitted year=2026 | rule -> (no function cardYear) | no tag | laneFacts -> []
C4a: stage=revision year=2025 | rule -> (no function cardYear) | no tag | laneFacts -> []
C4b: stage=in-prep year=2025 | rule -> (no function cardYear) | no tag | laneFacts -> []
C5 released with: stage=released year=2024 | rule -> (no function cardYear) | no tag | laneFacts -> []
C5 released without: stage=released year=undefined | rule -> (no function cardYear) | no tag | laneFacts -> []
C5 failed with: stage=failed year=2024 | rule -> (no function cardYear) | no tag | laneFacts -> []
C5 failed without: stage=failed year=undefined | rule -> (no function cardYear) | no tag | laneFacts -> []
C5 stopped with: stage=stopped year=2024 | rule -> (no function cardYear) | no tag | laneFacts -> []
C5 stopped without: stage=stopped year=undefined | rule -> (no function cardYear) | no tag | laneFacts -> []
C6: stage=published year=undefined | rule -> (no function cardYear) | no tag | laneFacts -> []
C6 with year: stage=published year=2025 | rule -> (no function cardYear) | no tag | laneFacts -> []
C7 own stage: stage=appeared year=2023 | rule -> (no function cardYear) | no tag | laneFacts -> []
C7 published without public: stage=published year=2023 | rule -> (no function cardYear) | no tag | laneFacts -> []
C8: stage=undefined year=2025 | rule -> (no function cardYear) | no tag | laneFacts -> []
C9 lane of the hub with a published lane: done
C9: stage=published year=2025 | rule -> (no function cardYear) | no tag | laneFacts -> [{"kind":"tier","label":"paper","whole":"paper"}]
C9 lane with oculus's lanes: undefined
C9 oculus lanes: nascent -> lane idea, rule (no function)
C9 oculus lanes: scoping -> lane scope, rule (no function)
C9 oculus lanes: de-risking -> lane derisk, rule (no function)
C9 oculus lanes: exploring -> lane run, rule (no function)
C9 oculus lanes: in-prep -> lane push, rule (no function)
C9 oculus lanes: building -> lane build, rule (no function)
C9 oculus lanes: submit-ready -> lane push, rule (no function)
C9 oculus lanes: submitted -> lane review, rule (no function)
C9 oculus lanes: revision -> lane revise, rule (no function)
C9 oculus lanes: accepted -> lane undefined, rule (no function)
C9 oculus lanes: published -> lane undefined, rule (no function)
C9 oculus lanes: released -> lane undefined, rule (no function)
C9 oculus lanes: failed -> lane undefined, rule (no function)
C9 oculus lanes: stopped -> lane undefined, rule (no function)
```

### Second run, after the last change

```
C1: stage=accepted year=2026 | rule -> 2026 | tag "2026" glyph=calendar tip "Year: 2026" | laneFacts -> [{"kind":"year","label":"2026","whole":"2026"}]
C2: stage=published year=2016 | rule -> 2016 | tag "2016" glyph=calendar tip "Year: 2016" | laneFacts -> [{"kind":"year","label":"2016","whole":"2016"}]
C3: stage=submitted year=2026 | rule -> undefined | no tag | laneFacts -> []
C4a: stage=revision year=2025 | rule -> undefined | no tag | laneFacts -> []
C4b: stage=in-prep year=2025 | rule -> undefined | no tag | laneFacts -> []
C5 released with: stage=released year=2024 | rule -> undefined | no tag | laneFacts -> []
C5 released without: stage=released year=undefined | rule -> undefined | no tag | laneFacts -> []
C5 failed with: stage=failed year=2024 | rule -> undefined | no tag | laneFacts -> []
C5 failed without: stage=failed year=undefined | rule -> undefined | no tag | laneFacts -> []
C5 stopped with: stage=stopped year=2024 | rule -> undefined | no tag | laneFacts -> []
C5 stopped without: stage=stopped year=undefined | rule -> undefined | no tag | laneFacts -> []
C6: stage=published year=undefined | rule -> undefined | no tag | laneFacts -> []
C6 with year: stage=published year=2025 | rule -> 2025 | tag "2025" glyph=calendar tip "Year: 2025" | laneFacts -> [{"kind":"year","label":"2025","whole":"2025"}]
C7 own stage: stage=appeared year=2023 | rule -> 2023 | tag "2023" glyph=calendar tip "Year: 2023" | laneFacts -> [{"kind":"year","label":"2023","whole":"2023"}]
C7 published without public: stage=published year=2023 | rule -> undefined | no tag | laneFacts -> []
C8: stage=undefined year=2025 | rule -> undefined | no tag | laneFacts -> []
C9 lane of the hub with a published lane: done
C9: stage=published year=2025 | rule -> 2025 | tag "2025" glyph=calendar tip "Year: 2025" | laneFacts -> [{"kind":"year","label":"2025","whole":"2025"},{"kind":"tier","label":"paper","whole":"paper"}]
C9 lane with oculus's lanes: undefined
C9 oculus lanes: nascent -> lane idea, rule undefined
C9 oculus lanes: scoping -> lane scope, rule undefined
C9 oculus lanes: de-risking -> lane derisk, rule undefined
C9 oculus lanes: exploring -> lane run, rule undefined
C9 oculus lanes: in-prep -> lane push, rule undefined
C9 oculus lanes: building -> lane build, rule undefined
C9 oculus lanes: submit-ready -> lane push, rule undefined
C9 oculus lanes: submitted -> lane review, rule undefined
C9 oculus lanes: revision -> lane revise, rule undefined
C9 oculus lanes: accepted -> lane undefined, rule 2025
C9 oculus lanes: published -> lane undefined, rule 2025
C9 oculus lanes: released -> lane undefined, rule undefined
C9 oculus lanes: failed -> lane undefined, rule undefined
C9 oculus lanes: stopped -> lane undefined, rule undefined
```

### Each case

- C1. First run: no function, `laneFacts` gives `[]`. After: rule gives 2026, tag "2026", glyph `calendar`, tip "Year: 2026". The tag's place after the chips and before the code status is the markup at `CardFacts.svelte:105-109` (between the chips' `{#each}` ending at line 104 and `{#if item.code !== ''}` at line 110), read; the drawn tag is the look on landing (the Projects board, a card of `projects/archive/published/2026/hccnet-fl`).
- C2. First run: no function. After: 2016, tip "Year: 2016".
- C3. First run: no function. After: nothing (`submitted` carries `public` without `terminal`, `vocab.yml:71`).
- C4. First run: no function. After: nothing for `revision` and `in-prep` (both carry `public` without `terminal`, `vocab.yml:68,72`).
- C5. First run: no function. After: nothing for `released`, `failed` and `stopped`, with and without a year (`terminal` without `public`, `vocab.yml:75-77`).
- C6. First run: no function. After: nothing, `laneFacts` gives `[]`; the row's other facts are untouched, since the only markup the step adds to `CardFacts.svelte` is the `{#if year !== undefined}` block at lines 105-109 (`git diff` of the file), which draws nothing when the rule gives none.
- C7. First run: no function. After: a hub stage `appeared` carrying both flags gives 2023; a hub whose `published` lacks `public` gives nothing. The function reads the `words` it is handed; `CardFacts.svelte:72` hands it `words`, which is `vocabOf(hub)` (line 58), the words of the project's own hub (`hub` is `rootOf(item.project)`, line 52), and `Lanes.svelte:234` hands `laneFacts` `wordsAt(project)`.
- C8. First run: no function. After: nothing (`hasWord` gives false for an undefined word, `vocab-keys.ts:128`).
- C9. First run: the published project sits on the hub's `done` lane, `laneFacts` gives only the tier. After: `laneFacts` gives the year fact first, label "2025", then the tier; the program prints tip "Year: 2025" and glyph `calendar` from the catalog keys `LaneCard.svelte:114,122` read. With oculus's lanes no `accepted` or `published` project sits on any lane (the last block of both runs), so no lane card draws a year. The drawn tag on a lane card is the look on landing, under a hub whose `focus_lanes` lists `published`.
- C10. By reading: `ProjectCard.svelte:366` draws `CardFacts` for every card; `ProjectCards.svelte:9` imports `ProjectCard`, used by `Person.svelte:64` and `Listing.svelte:30`; `Project.svelte:63` imports `ProjectCard` for the project page. The Archival listing groups by the stages with `dead` (`Listing.svelte:106-119`, `failed` and `stopped`, `vocab.yml:76-77`), whose rule gives nothing (C5). The drawn result is the look on landing.
- C11. By reading, after the change: `docs/HELP.md:296` names the year among a lane card's tags after the marks and before the role; `docs/HELP.md:298` names it in the top row after the chips and before the code status; `vocab.yml:55` and `:59` and `vocab.ts`'s `terminal` (line 154) and `public` (line 169) descriptions say a card draws the year at a stage that carries both flags; the head comments of `CardFacts.svelte` (lines 2-9), `ProjectCard.svelte` (lines 2-8), `LaneCard.svelte` (lines 9-17) and `focus.ts` (lines 1-4) name the year in the order drawn. First run, on the base: none of them names a year (`grep -rn -i "year"` over the base copy's `focus.ts`, `CardFacts.svelte`, `ProjectCard.svelte` and `LaneCard.svelte` printed nothing; `grep -c "year"` over the base copy's `vocab.ts` printed `0`; `git show HEAD:docs/HELP.md | awk 'NR==296 || NR==298' | grep -c "Year:"` printed `0`; `git show HEAD:config/catalogs/vocab.yml | awk 'NR==55 || NR==59' | grep -c "year"` printed `0`).

No case was wrong under the brief's rules.

## DONE / NOT DONE

| Deliverable | State | Proof |
| --- | --- | --- |
| 1. The rule, `cardYear` in `focus.ts` beside `laneFacts`, with `hasWord`, doc comment, head comment | DONE | `focus.ts:586-602` (function and doc comment), `focus.ts:1-4` (head comment); case run after: C1 `rule -> 2026`, C3 `rule -> undefined`, C7 own stage `rule -> 2023` |
| 2. The board card's year tag, its place, the two head comments | DONE | `CardFacts.svelte:105-109`; `CardFacts.svelte:2-9`, `ProjectCard.svelte:2-8`; case run C1 `tag "2026" glyph=calendar tip "Year: 2026"`; drawn tag at the look on landing |
| 3. The lane card's year fact, first among the facts, `FACT_GLYPHS`, `factTip`, doc and head comments | DONE | `focus.ts:584` (`LaneFact` kinds), `focus.ts:620-624`, `LaneCard.svelte:114,122`; case run C9 `laneFacts -> [{"kind":"year","label":"2025","whole":"2025"},{"kind":"tier",...` (quoted whole in the second run above); drawn tag at the look on landing |
| 4. The words `year_glyph: calendar`, `year_tip: 'Year: {0}'` | DONE | `config/text/views/boards/project.yml:146-147`; case run prints `glyph=calendar tip "Year: 2026"` from them |
| 5. The flags' descriptions | DONE | `config/catalogs/vocab.yml:55,59`, `vocab.ts:154,169` (`git diff`) |
| 6. The page | DONE | `docs/HELP.md:296,298` (`git diff -U0 docs/HELP.md` hunks `@@ -296 +296 @@` and `@@ -298 +298 @@`) |
| Verify 1: `npm run diagrams` then `npm run test:quick`, once | DONE | last line: `test:quick: 56.5 s; every command passed` (lines below) |
| Verify 2: the case-run program before and after | DONE | both outputs above |
| Verify 3: `sh utils/unused-exports.sh` against the base | DONE | `diff .agents/worktrees/O127-base/unused-exports.txt <after>` printed nothing, `diff exit 0`: the step added no line |
| Verify 4: comments and doc sentences read against spec.md:21 and spec.md:45 | DONE | read; no departure (section below) |
| ASCII gate | DONE | the spec.md:103 perl gate over `src tests config` piped to `wc -l` printed `0` (`find: bin: No such file or directory`: the tree has no `bin`); `LC_ALL=C grep -n '[^ -~]'` over the eight changed files piped to `wc -l` printed `0` |

The last lines of `npm run test:quick` (run once, after `npm run diagrams`):

```
test:quick: 8 changed file(s), from git since HEAD
test:quick: 13 test file(s)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (0.9 s)
ok      svelte-kit sync (3.0 s)
ok      eslint (14.7 s)
ok      vitest (33.8 s): Duration  16.72s (transform 17.82s, setup 0ms, import 34.98s, tests 8.67s, environment 1ms)
ok      svelte-check (39.5 s): 1793703615336 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (53.3 s): Duration  36.13s (transform 25.82s, setup 0ms, import 46.43s, tests 59.12s, environment 3ms)
test:quick: 56.5 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source and tests/checks/tree,
            which run for any change under src, tests or utils; the build, the lint
            of unchanged files
```

The 13 test files it ran: `tests/data/shapes/catalog-files/vocab.test.ts`, `tests/state/boards/board/board-new-project.test.ts`, `tests/state/boards/board/board-rules.test.ts`, `tests/data/sources/collections.test.ts`, and under `tests/checks/`: `source/catalog-file-keys`, `source/comment-width`, `source/history`, `source/html-sites`, `source/keys`, `source/strip-types`, `tree/boundaries`, `tree/duplication`, `tree/size`.

Runs: the verify list once; no whole-suite command; no single test file run on its own.

The step adds and changes no test (spec.md:60: no entry of `agents/guarded.md` names these files, `grep -n "laneFacts\|focus.ts\|CardFacts\|LaneCard" .scratch/migration/agents/guarded.md` printed nothing). No existing assertion, allow list or predicate was edited (`diff -rq` against the base copy lists no file under `tests`).

## The terms

`docs/glossary.md` does not exist (`ls docs/glossary.md` prints "No such file or directory").

## Files changed

From `diff -rq .agents/worktrees/O127-base/<dir> .agents/worktrees/migration-O127/<dir>` over `src tests utils config`, with `git diff --numstat` for `docs` (the base copy holds no `docs`):

| File | Added / removed | Lines now | In the write list |
| --- | --- | --- | --- |
| `src/lib/state/boards/focus.ts` | 30 / 3 | 791 | yes |
| `src/lib/views/shared/card/project/CardFacts.svelte` | 17 / 5 | 150 | yes |
| `src/lib/views/shared/card/project/ProjectCard.svelte` | 5 / 4 | 430 | yes, lines 2-7; the rewrapped paragraph is now lines 2-8 |
| `src/lib/views/boards/focus/lanes/LaneCard.svelte` | 7 / 4 | 319 | yes |
| `src/lib/data/shapes/catalog-files/vocab.ts` | 2 / 2 | 533 | yes, lines 154 and 169 |
| `config/catalogs/vocab.yml` | 2 / 2 | 307 | yes, lines 55 and 59 |
| `config/text/views/boards/project.yml` | 2 / 0 | 196 | yes |
| `docs/HELP.md` | 2 / 2 | 617 | yes, lines 296 and 298 |
| `.scratch/migration/agents/reviews/O127-report.md` | new | this file | yes |

`npm run diagrams` changed none of `docs/diagrams/layers.dot`, `layers.svg`, `layer-views.dot` or `layer-views.svg` (`git status --short` after it lists no file under `docs/diagrams`): the step adds no import between modules, since `CardFacts.svelte` already imported `focus.ts`.

Sizes: `focus.ts` 791 is under 880; the components are under 520 (`wc -l`).

## Greps

- Names (spec.md:72): `grep -rn "laneFacts\|LaneFact\b\|cardYear\|year_glyph\|year_tip" src tests docs README.md` and the same over `config` with `--exclude=local.yml` give hits only in `focus.ts`, `CardFacts.svelte`, `LaneCard.svelte`, `Lanes.svelte` and `project.yml`. `Lanes.svelte:13-15` names "its facts (state/boards/focus.ts `laneFacts`)", still true. No test names `laneFacts` or `LaneFact`.
- Existing helper (spec.md:89): `grep -rn "year" src/lib/state/boards/focus.ts` on the base gave nothing; the rule reuses `hasWord` (`vocab-keys.ts:122-129`). No other helper reads a year at a stage (`grep -rn 'year' src/lib/views/shared/card` on the base gives only `feed/RadarCard.svelte`, as the brief says).
- History words (spec.md:44): `git diff -U0 | grep '^+' | grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O1[0-9][0-9]|20[0-9][0-9]-[0-9][0-9]"` hits only the two whole `docs/HELP.md` lines, each a one-line paragraph that the diff shows whole. The hits are words of their existing text: `grep -o -i -E` over the two lines prints `ked: a follow-up with its Not before date, a subtask wit` and `there last, while that tab is still open; an empty pane`, and line 298 also holds "an empty documents pane before an empty terminals pane"; each describes the page as it is drawn. The sentences the step added hold none of these words. The comment lines and doc comments the step added or changed hold none.
- Comment width (spec.md:45): every comment paragraph the step edited was rewrapped whole at 100 columns; `tests/checks/source/comment-width.test.ts` passed inside the run above. An awk read of the changed files for a next line whose first word would fit on the line above shows hits only in paragraphs the step did not edit (`focus.ts:154,460,582`, `ProjectCard.svelte:26`, `LaneCard.svelte:4,99`).

## Comments and doc sentences read against spec.md:21 and :45

Read each: `focus.ts:1-4`, `:580-583` (unchanged), `:586-594`, `:605-612`; `CardFacts.svelte:2-9`, `:54-57`, `:71`; `ProjectCard.svelte:2-8`; `LaneCard.svelte:9-17`, `:58-61`, `:120`; `vocab.yml:55,59`; `vocab.ts:154,169`; `docs/HELP.md:296,298`. Plain, ASCII, no em dash, no 'not X but Y' construction, each edited paragraph rewrapped whole. No departure.

Comments and documents re-read after the change (spec.md:72): `focus.ts` head comment rewritten; `cardYear` doc comment new; `laneFacts` doc comment rewritten; `LaneFact` doc comment still true; `CardFacts.svelte` head comment and the `words` doc comment rewritten; `ProjectCard.svelte` head paragraph rewritten; `LaneCard.svelte` head paragraph, `facts` prop doc and `factTip` doc rewritten, `FACT_GLYPHS` doc ("The glyph of each kind of fact.") still true; `Lanes.svelte:13-15` still true; `card.ts:1-3` still true (it holds the glyph helpers of the facts whose glyph a hub's words name; the year's glyph, like the code status's, comes from the catalog); `docs/HELP.md:296,298` rewritten; `vocab.yml:55,59` and `vocab.ts:154,169` rewritten. `docs/apps.md` describes no card fact (`grep -rln "compute resource" docs README.md src config --exclude=local.yml` gives `docs/HELP.md`, `card.ts` and `CardFacts.svelte` only).

## Judgment calls the brief left open (each reversible)

1. The function is named `cardYear(project: Pick<Project, 'stage' | 'year'>, words): number | undefined`. It gives the number; each card turns it into words (`String(year)` for the tag's label, the number itself into `t('project.card.year_tip', year)`, which takes a number, `text.ts:72`).
2. The doc comment of `cardYear` gives the brief's reason and one more clause: a stage that closes the work without making it public names no paper that appeared, which is why `terminal` alone does not draw a year.
3. The `words` doc comment of `CardFacts.svelte` (lines 54-57) now says those words also decide at which stages the year is drawn, since the year reads them.
4. The `factTip` doc example became `"Year: 2025", "Role: Supervisor"`: the three examples with `"Venue: ..."` do not fit one 100-column line.
5. The `terminal` description in `vocab.ts:154` is now a double-quoted string, since its new sentence holds an apostrophe (prettier's choice for the file).
6. The HELP sentence for the lane card says why the year is on no lane with oculus's lanes ("since an accepted or published project sits on none").
7. The lane fact's key in `LaneCard.svelte` is `fact:year`, from `fact:${fact.kind}` (line 154); the kinds are distinct, so it collides with no other tag's key, and `laneFacts` gives at most one year fact.

## Host- and user-visible changes, before and after

- The project card (Projects board, project page, Awaiting tabs, Person page, Listing pages): before, the top row drew Lead, lane, form and chips, code, Reproduced, compute, folder. After, a project at `accepted` or `published` whose manifest gives a whole-number `year` draws a tag with the calendar glyph and the year ("2026") after its chips and before its code status, tip "Year: 2026" on hover. Look on landing: the Projects board with a published project such as `bachelor-network-ids` (2016) and an accepted one such as `hccnet-fl` (2026), and a submitted one such as `raw-pls`, which draws no year; the Archival listing, which draws none.
- The Focus lane card: with oculus's lanes, no change (no lane holds an accepted or published project). Under a hub whose `focus_lanes` lists `published`, a published card draws the year tag first after its marks, before the role, tier and venue, tip "Year: 2025". The look can show this only with such a hub's lanes; none of the workspace's hubs names `focus_lanes` (the brief's premise), so the look on landing sees the board card and only confirms that no lane card draws a year.
- The flag descriptions, shown wherever the vocabulary schema's descriptions are shown, and the Help page lines 296 and 298, carry the new sentences.

## Wrong or impossible in the brief

Nothing. One premise to note: the brief lists the four diagrams as written by `npm run diagrams`; the run changed none of them (above), so the landing's merge with O126 has no diagram of O127's to take.

## Limitations and sharp edges

- A year written as text (`year: '2025'`) draws nothing, since `normalise.ts:278` reads it as nothing: open item 642, outside the step as the brief says.
- `normalise.ts` reads any number as the year (`z.number()`), so a manifest with a fraction, a zero or a negative year at a published stage draws it as written ("2025.5"). No manifest of the hub holds one (the brief's premise, not run again here: the step reads no hub data). Whether `z.number()` takes `Infinity` is not verified.
- The lane card draws the year only under a hub's own lanes that list a done stage; with oculus's lanes the lane-card half of the step draws nothing (case run, last block).
- The case-run program loads `focus.ts` under Node with a one-line `$state` shim for `generation.svelte.ts`; the drawn cards themselves are the look on landing.
- The step left nothing running.
