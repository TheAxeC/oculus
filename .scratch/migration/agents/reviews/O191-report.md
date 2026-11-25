# O191 report: a value for none in the board filters

Everything in the brief is done.

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md` lines 174-188 (`sed -n 174,188p`): the heading, then blank lines and no entry, then the closing paragraph:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

The list holds no entry.

## The cases' first run (unchanged tree)

Every case ran through `boardItems` over a snapshot made by `snapshotOf` of `tests/state/boards/board/board-fixture.ts`, with the text catalog (`setCatalog(CATALOG)`) and the shipped vocabulary (`setVocab({ lists: {}, own: CONFIG, order: [] })`) loaded. The projects' links were passed through the build's own normaliser, `linked` of `src/lib/data/snapshot/normalise-parts/links.ts:143`, so a domain, venue, pillar or dataset key no registry holds is dropped as a real build drops it. The board cases read the Projects board's whole filter, `boardFilter` (`filter-menu.ts`), which is what the board and the Present view draw. The program and its config are quoted at the end of this report.

Command, from the worktree root:

```
TMPDIR=$PWD/.agents/scratch GIT_CEILING_DIRECTORIES=$PWD/.agents/scratch taskpolicy -b nice -n 19 npx vitest run --config .agents/scratch/vitest.cases.config.ts --root . 2>&1 | grep -v PLUGIN | grep -E "^case|Error|error|FAIL|passed|failed"
```

Each row is `[words, count, picked]`, with the share as a fourth item where the choice carries one; "no group" means `filterGroups` drew no group for that facet. Output on the unchanged tree, as printed:

```
case 1 list: [["blocked (external)",1,false]]
case 1 shown under No situation: []
case 2 shown: ["blocked"]
case 3 values: [["d-ecg",["ecg"]],["d-none",[]],["d-unknown",[]]]
case 3 list: [["ecg",1,false]]
case 3 shown under No domain: []
case 4 list: [["Amir",1,false]]
case 4 shown under Not waiting: []
case 5 venue list: [["BSPC",1,false,1]]
case 5 venue values: [["v-bspc",["bspc"]],["v-none",[]],["v-unknown",[]]]
case 5 pillar list: [["Pillar One",1,false]]
case 5 pillar values: [["p-none",[]],["p-one",["p1"]],["p-unknown",[]]]
case 5 dataset list: [["mimic",1,false]]
case 5 dataset values: [["s-mimic",["mimic"]],["s-none",[]],["s-unknown",[]]]
case 6 list: [["journal article",1,false]]
case 7 list: [["blocked (external)",1,false],["parked (not being worked)",1,false]]
case 8 domain list: [["ecg",1,false],["__none__",0,true]]
case 8 situation list: [["blocked (external)",0,true]]
case 8 shown: []
case 9 groups drawn: ["role","year","tier","funding","compute","reproduced","code","sessions"]
case 9 form group: "no group"
case 9 form group, No form picked: [["__none__",0,true]]
case 9 year group: [["No year",2,false]]
case 9 year group, No year picked: [["No year",2,true]]
case 10 venue list: [["BSPC",2,false,1],["CBM",1,false,0.5]]
case 11 year: [["2025",1,false],["No year",1,false]]
case 11 funding: [["zonmw",1,false],["No funding",1,false]]
case 11 compute: [["UTwente HPC",1,false],["unset",1,false]]
case 11 code: [["deposited",1,false],["no code",1,false]]
case 12 values: [["hub",[]],["tier",[]],["role",[]]]
case 12 facets: [["role",[["lead",0],["supervisor",0],["collaborator",0],["other",0]]]]
case 13 form: [["journal article",1,false]]
case 13 pillar: [["Pillar One",1,false]]
case 14 domain: [["ecg",2,false],["__none__",0,true]]
case 14 shown: []
case 15 shown: []
case 15 waiting: [["Amir",1,false],["__none__",0,true]]
case 16 kept: []
case 16 pillar group: [["Pillar One",1,false],["__none__",0,true]]
case 16 graph connected=false: []
case 16 graph connected=true: []
case 17 values: [["odd",["zzz-chip"],["zzz-form"]],["plain",["parked"],["journal"]]]
case 17 situation: [["parked (not being worked)",1,false]]
case 17 form: [["journal article",1,false]]
case 17 shown under No situation: []
case 17 shown under No form: []
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

By case, on the unchanged tree:

1. Situation, a project with no chip beside a blocked one: the list is `blocked (external)` alone, and a pick of the value for none keeps no project.
2. Situation picked `blocked` and the value for none: only `blocked` is shown.
3. Domain, no domain, an unregistered domain and `ecg`: the first two carry no value, the list is `ecg` alone, a pick of the value for none keeps none.
4. Waiting on: the list is `Amir` alone, a pick of the value for none keeps none.
5. Venue, Pillar, Datasets: each lists the named value alone; a project with no value and one naming an unregistered key carry no value.
6. Form: the list is `journal article` alone.
7. Every project has a chip: the list is the two chips, no row for none.
8. The value for none of Domain picked with Situation `blocked`: the Domain row of the value for none reads `__none__` at 0 and the board shows nothing.
9. A board with no form and no year: no Form group, and with the value for none of Form picked a group with the one row `__none__`; the Year group is drawn with `No year` as its only row.
10. Venue: the bars are scaled over the named venues; no row for none exists.
11. Year, Funding, Compute and Code: `No year`, `No funding`, `unset`, `no code` beside the named values.
12. Hub, Tier and Role on a project with no tier and no user marked: no value under any of the three.
13. A collection page's Projects section: Form lists `journal article` alone, Pillar lists `Pillar One` alone.
14. A saved pick of the value for none of Domain over a board where every project has a domain: the row reads `__none__` at 0, no project shown.
15. Waiting toggle with the value for none of Waiting on picked: no project shown, the row reads `__none__` at 0.
16. The Map with the value for none of Pillar picked: the bar keeps no project and the graph is empty.
17. An unknown chip and an unknown form: listed under no value, and not under the value for none.
18. G92's test on the unchanged tree, `npx vitest run tests/state/boards/board/hub-facets.test.ts --maxWorkers 2 --reporter=verbose` (`<check mark>` is vitest's U+2713):

```
 <check mark> |unit| tests/state/boards/board/hub-facets.test.ts > the group lists on a workspace of two hubs > lists a value both hubs name once, counted over both 4ms
 <check mark> |unit| tests/state/boards/board/hub-facets.test.ts > the group lists on a workspace of two hubs > keeps both hubs' projects under a filter on that value 0ms
 <check mark> |unit| tests/state/boards/board/hub-facets.test.ts > the group lists on a workspace of two hubs > counts that value over both hubs' projects another facet's value leaves 57ms
 Test Files  1 passed (1)
      Tests  3 passed (3)
```

No case is one the brief's rules get wrong: every first-run result is the behaviour the brief's premises describe for the unchanged tree, and every case's ruled result follows from items 1 to 7 without a conflict with another rule. No ruling was needed.

## The cases after the change

The same command after the last change prints, as printed (the run before the last comment edits printed the same lines: `diff .agents/scratch/after-run.txt .agents/scratch/final-run.txt` printed `identical`):

```
case 1 list: [["blocked (external)",1,false],["No situation",1,false]]
case 1 shown under No situation: ["none-chip"]
case 2 shown: ["blocked","none-chip"]
case 3 values: [["d-ecg",["ecg"]],["d-none",["__none__"]],["d-unknown",["__none__"]]]
case 3 list: [["ecg",1,false],["No domain",2,false]]
case 3 shown under No domain: ["d-none","d-unknown"]
case 4 list: [["Amir",1,false],["Not waiting",1,false]]
case 4 shown under Not waiting: ["w-none"]
case 5 venue list: [["BSPC",1,false,1],["No venue",2,false]]
case 5 venue values: [["v-bspc",["bspc"]],["v-none",["__none__"]],["v-unknown",["__none__"]]]
case 5 pillar list: [["Pillar One",1,false],["No pillar",2,false]]
case 5 pillar values: [["p-none",["__none__"]],["p-one",["p1"]],["p-unknown",["__none__"]]]
case 5 dataset list: [["mimic",1,false],["No dataset",2,false]]
case 5 dataset values: [["s-mimic",["mimic"]],["s-none",["__none__"]],["s-unknown",["__none__"]]]
case 6 list: [["journal article",1,false],["No form",1,false]]
case 7 list: [["blocked (external)",1,false],["parked (not being worked)",1,false]]
case 8 domain list: [["ecg",1,false],["No domain",1,true]]
case 8 situation list: [["blocked (external)",1,true],["No situation",1,false]]
case 8 shown: ["a-none-blocked"]
case 9 groups drawn: ["role","tier","reproduced","sessions"]
case 9 form group: "no group"
case 9 form group, No form picked: [["No form",2,true]]
case 9 year group: "no group"
case 9 year group, No year picked: [["No year",2,true]]
case 10 venue list: [["BSPC",2,false,1],["CBM",1,false,0.5],["No venue",3,false]]
case 11 year: [["2025",1,false],["No year",1,false]]
case 11 funding: [["zonmw",1,false],["No funding",1,false]]
case 11 compute: [["UTwente HPC",1,false],["unset",1,false]]
case 11 code: [["deposited",1,false],["no code",1,false]]
case 12 values: [["hub",[]],["tier",[]],["role",[]]]
case 12 facets: [["role",[["lead",0],["supervisor",0],["collaborator",0],["other",0]]]]
case 13 form: [["journal article",1,false],["No form",1,false]]
case 13 pillar: [["Pillar One",1,false],["No pillar",1,false]]
case 14 domain: [["ecg",2,false],["No domain",0,true]]
case 14 shown: []
case 15 shown: []
case 15 waiting: [["Amir",1,false],["Not waiting",0,true]]
case 16 kept: ["bare"]
case 16 pillar group: [["Pillar One",1,false],["No pillar",1,true]]
case 16 graph connected=false: [["project","bare"]]
case 16 graph connected=true: []
case 17 values: [["odd",["zzz-chip"],["zzz-form"]],["plain",["parked"],["journal"]]]
case 17 situation: [["parked (not being worked)",1,false]]
case 17 form: [["journal article",1,false]]
case 17 shown under No situation: []
case 17 shown under No form: []
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

Read against the cases: 1 the list is `blocked` then `No situation`, the pick keeps `none-chip` and drops `blocked`; 2 both stay; 3 the no-domain and the unregistered-domain projects carry `__none__` and show under `No domain`, the list `ecg` then `No domain`; 4 `Amir` then `Not waiting`, the pick keeps only `w-none`; 5 the named value then `No venue`, `No pillar`, `No dataset`, an unregistered key giving the value for none; 6 `journal article` then `No form`; 7 no `No situation` row; 8 the Domain list is counted over the two blocked projects (`ecg` 1, `No domain` 1) and `No domain` counts as any value (Situation counted over the two no-domain projects: `blocked` 1, `No situation` 1); 9 no Form group and no Year group, each drawn with its one row while its value for none is picked; 10 `No venue` at the largest count (3) carries no share, BSPC 1 and CBM 0.5; 11 unchanged words and values; 12 no value for none under Hub, Tier or Role, the Tier facet offers nothing for a project with no tier; 13 Form ends with `No form`, Pillar with `No pillar`; 14 `No domain` at 0 with its words, no project shown; 15 no project shown, `Not waiting` at 0; 16 the Map's bar keeps `bare`, the graph draws no pillar node, and with Connected only the graph is empty; 17 the unknown chip and form are under no listed value and not under the value for none; 18 below.

## DONE / NOT DONE

| Item | State | Proof (command and the last line it printed) |
| --- | --- | --- |
| 1. `facetValues` gives `[NONE]` for the seven facets, head comment rewritten | DONE | cases 1, 3, 4, 5, 6 after the change; `state.ts:47` `orNone`, `state.ts:51-74`; case run last line `Tests  1 passed (1)` |
| 2. `orderValues` lists Situation and Form named values then `NONE` | DONE | `facets.ts:152-155`; case 1 `[["blocked (external)",1,false],["No situation",1,false]]`, case 6 `[["journal article",1,false],["No form",1,false]]` |
| 3. `valueLabel` words from seven new `board:` keys, in key order | DONE | `filter-menu.ts:128-146`, `projects.yml:64-72`; cases 1 to 6 print the ruled words; `tests/checks/source/keys.test.ts` passed (row below) |
| 4. `filterGroups` draws no group for the value for none alone unless it is picked, all eleven facets | DONE | `filter-menu.ts:209`; case 9 `["role","tier","reproduced","sessions"]`, `[["No form",2,true]]`, `[["No year",2,true]]`; case 13 and 16 through the collection and the Map |
| 5. `choicesOf`: no share for No venue, `most` over named venues | DONE | `filter-menu.ts:165-175`; case 10 `[["BSPC",2,false,1],["CBM",1,false,0.5],["No venue",3,false]]` |
| 6. A pick of the value for none narrows and counts | DONE | cases 1, 2, 3, 4, 8, 14, 15 after the change |
| 7. `presets.ts` head comment of `NONE` names every facet | DONE | `presets.ts:44-47` |
| 8. Sentences the change makes false carried | DONE | greps in "Names and sentences" below |
| Verify 1: `npm run diagrams` exits 0 | DONE | `exit 0`; it printed the 18 files of `docs/diagrams/` listed below, and `git status --short docs` printed nothing, so none changed |
| Verify 1: the brief's vitest command | DONE | see the two runs below: hub-facets and board-rules passed in the first; the three tree checks timed out at 5000 ms and passed alone under `--testTimeout 0 --hookTimeout 0`, `Tests  19 passed (19)` |
| Verify 1: `npx prettier --check` over the changed files | DONE | `All matched files use Prettier code style!`, exit 0 |
| Verify 1: `npx eslint` over the changed files | DONE | the four `.ts` files: no output, exit 0; the YAML file: `0:0  warning  File ignored because no matching configuration was supplied` (eslint.config.js holds no configuration for YAML) |
| Verify 1: `npm run check` | DONE | `1795627400461 COMPLETED 4687 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, exit 0 |
| Verify 1: the character-set check | DONE | printed nothing, `exit 0` |
| Verify 2: `sh utils/unused-exports.sh` against the base list | DONE | 336 lines, the base 336; `diff` printed nothing, `diff exit 0`: no added line |
| Verify 3: cases 1 to 17 | DONE | the run above, `Tests  1 passed (1)` |
| Verify 4: `wc -l` under the size limit | DONE | `263 state.ts`, `366 facets.ts`, `444 filter-menu.ts`, `728 presets.ts` (limit 880) |
| Verify 5 / case 18: G92's test before and after | DONE | before: quoted above, `Tests  3 passed (3)`; after: quoted below, `Tests  3 passed (3)` |

The runs, verbatim.

The brief's vitest command, once:

```
TMPDIR=$PWD/.agents/scratch GIT_CEILING_DIRECTORIES=$PWD/.agents/scratch taskpolicy -b nice -n 19 npx vitest run tests/state/boards/board/hub-facets.test.ts tests/state/boards/board/board-rules.test.ts tests/checks/source/keys.test.ts tests/checks/source/history.test.ts tests/checks/source/comment-width.test.ts --maxWorkers 2
```

Its summary lines, as printed (`<multiplication sign>` is vitest's cross mark U+00D7):

```
     <multiplication sign> ends by the hundredth column everywhere under src, tests and utils 19479ms
     <multiplication sign> names no package id, date or session in any comment 49865ms
     <multiplication sign> has a reader for every catalog key 16889ms
 FAIL  |unit| tests/checks/source/comment-width.test.ts > a comment line > ends by the hundredth column everywhere under src, tests and utils
Error: Test timed out in 5000ms.
 FAIL  |unit| tests/checks/source/history.test.ts > no history in code > names no package id, date or session in any comment
Error: Test timed out in 5000ms.
 FAIL  |unit| tests/checks/source/keys.test.ts > text keys > has a reader for every catalog key
Error: Test timed out in 5000ms.
 Test Files  3 failed | 2 passed (5)
      Tests  3 failed | 117 passed (120)
```

The two files that passed are `hub-facets.test.ts` and `board-rules.test.ts`. The three failures are time-outs of the tree checks under `tests/checks`, files the step does not change, which `npm run test:checks` runs with no time limit (`package.json:16`, `vitest run tests/checks --testTimeout 0 --hookTimeout 0`). They were rerun alone, once, with that same setting:

```
TMPDIR=$PWD/.agents/scratch GIT_CEILING_DIRECTORIES=$PWD/.agents/scratch taskpolicy -b nice -n 19 npx vitest run tests/checks/source/keys.test.ts tests/checks/source/history.test.ts tests/checks/source/comment-width.test.ts --maxWorkers 2 --testTimeout 0 --hookTimeout 0
```

```
 Test Files  3 passed (3)
      Tests  19 passed (19)
```

G92's test after the change, `npx vitest run tests/state/boards/board/hub-facets.test.ts --maxWorkers 2 --reporter=verbose` (`<check mark>` is U+2713):

```
 <check mark> |unit| tests/state/boards/board/hub-facets.test.ts > the group lists on a workspace of two hubs > lists a value both hubs name once, counted over both 4ms
 <check mark> |unit| tests/state/boards/board/hub-facets.test.ts > the group lists on a workspace of two hubs > keeps both hubs' projects under a filter on that value 0ms
 <check mark> |unit| tests/state/boards/board/hub-facets.test.ts > the group lists on a workspace of two hubs > counts that value over both hubs' projects another facet's value leaves 24ms
 Test Files  1 passed (1)
      Tests  3 passed (3)
```

`npm run diagrams` printed, after `> oculus@1.1.0 diagrams` and `> node utils/diagrams/diagrams.mjs`: `docs/diagrams/layers.dot`, `layers.svg`, `layer-data.dot`, `layer-data.svg`, `layer-server.dot`, `layer-server.svg`, `layer-state.dot`, `layer-state.svg`, `layer-ui.dot`, `layer-ui.svg`, `layer-shell.dot`, `layer-shell.svg`, `layer-views.dot`, `layer-views.svg`, `channels.dot`, `channels.svg`, `writes.dot`, `writes.svg`, each under `docs/diagrams/`. It rewrote no file's content: `git status --short docs` printed nothing.

The character-set check, as the brief gives it:

```
printf '%s\0' src/lib/state/boards/board/state.ts src/lib/state/boards/board/facets.ts src/lib/state/boards/board/filter-menu.ts src/lib/state/boards/board/presets.ts config/text/views/boards/projects.yml | xargs -0 env LC_ALL=C perl -ne 'print "$ARGV:$.\n" if /[^\x20-\x7E\n]/; close ARGV if eof'; echo "exit $?"
exit 0
```

Runs of the last round: `npm run diagrams` twice in a row right before the checks (the second to keep its whole output), the brief's vitest command once, the three tree checks once alone, prettier, eslint, the type check, the character-set check and `utils/unused-exports.sh` once each, G92's test once after the change, the case program once after the last change. No whole-suite command was run: no `npm run test:quick`, `npm test`, `npm run test:checks`, `npm run test:landing` or `npx vitest run` with no file named.

This step adds and changes no test.

## Files, from `diff -rq` against the base copy

`diff -rq /Users/axelfaes/workspace/oculus/.agents/worktrees/O191-base/<d> <d>` over `src`, `config`, `docs`, `tests`, `utils` and `assets`, and `diff -q` over the root files, list exactly these; `git diff --stat` gives the counts:

| File | Lines now (`wc -l`) | `git diff --stat` | In the write list |
| --- | --- | --- | --- |
| `src/lib/state/boards/board/state.ts` | 263 | 40 (+26 -14) | yes |
| `src/lib/state/boards/board/facets.ts` | 366 | 20 (+13 -7) | yes |
| `src/lib/state/boards/board/filter-menu.ts` | 444 | 47 (+39 -8) | yes |
| `src/lib/state/boards/board/presets.ts` | 728 | 5 (+4 -1) | yes, line 44; that one line became four (`presets.ts:44-47`), since the sentence naming every facet does not fit 100 columns |
| `config/text/views/boards/projects.yml` | 126 | 7 (+7) | yes |
| `.scratch/migration/agents/reviews/O191-report.md` | this file | new | yes |

`git diff --stat` total: `5 files changed, 85 insertions(+), 34 deletions(-)`.

## What changed, in code

`state.ts:47-74`:

```ts
const orNone = (values: string[]): string[] => (values.length === 0 ? [NONE] : values);
...
case 'form':
    return [item.project.form ?? NONE];
case 'domain':
    return [item.domain === null ? NONE : keyOf(item.domain.id)];
case 'venue':
    return [item.venue === null ? NONE : keyOf(item.venue.id)];
case 'waiting':
    return orNone([...new Set(item.waiting.map(waitingValue))]);
case 'pillar':
    return orNone(ids(item.pillars));
case 'funding':
    return orNone(ids(item.funding));
case 'dataset':
    return orNone(ids(item.datasets));
case 'status':
    return orNone(item.project.chips);
case 'compute':
    return orNone(ids(item.compute));
```

`facets.ts:151-155`:

```ts
// The chips and the forms in the order of their lists, and the value for none last.
const listedThenNone = (listed: string[]): string[] =>
    has(NONE) ? [...listed.filter(has), NONE] : listed.filter(has);
if (facet === 'status') return listedThenNone(chipKeys());
if (facet === 'form') return listedThenNone(formOrder());
```

`filter-menu.ts:128-146`, `165-175`, `208-209`:

```ts
function noneWords(facet: string): string | undefined {
    if (facet === 'form') return t('board.no_form');
    if (facet === 'status') return t('board.no_situation');
    ...
    if (facet === 'compute') return t('board.compute_none');
    return undefined;
}

export function valueLabel(facet: string, value: FacetValue): string {
    const none = value.value === NONE ? noneWords(facet) : undefined;
    if (none !== undefined) return none;
    if (facet === 'code') return codeLabel(value.value);
    ...

const named = values.filter((one) => one.value !== NONE);
const most = Math.max(1, ...named.map((one) => one.count));
...
if (facet === 'venue' && value.value !== NONE) choice.share = value.count / most;

// No value, or the value for none alone and not picked: the facet draws no group.
if (values.every((one) => one.value === NONE) && !picked.includes(NONE)) return [];
```

`projects.yml:64-72`: `no_dataset: No dataset`, `no_domain: No domain`, `no_form: No form`, `no_funding: No funding`, `no_pillar: No pillar`, `no_situation: No situation`, `no_venue: No venue`, `no_waiting: Not waiting`, `no_year: No year`.

## Names and sentences (item 8)

Phrase grep: `grep -rn --exclude=local.yml -i "no value\b\|draws no group\|under no value" src tests config docs README.md`, the `facetValues` head comment left out. Hits in board code: `filter-menu.ts:185` and `filter-menu.ts:205` (the new rule's own sentence and comment) and `src/lib/state/boards/collection/bar.ts:314` "A group with no value is not drawn." (still true: `projectGroups` drops a group with no row; a group of the value for none alone is now not returned by `filterGroups` either, which the sentence does not deny). Every other hit is another module's own use of the words "no value" (config writes, schedules, decks, the Settings view, tests of those), none about a board facet.

Name grep: `grep -rn --exclude=local.yml "facetValues\|valueLabel\|choicesOf\|orderValues\|filterGroups\|noneWords\|__none__\|no_year\|no_funding\|compute_none\|No year\|No funding\|No venue\|No domain\|No pillar\|No dataset\|No form\|No situation\|Not waiting" src tests config docs README.md`, the four changed board files and `index.ts` left out. Hits that name the changed code: `src/lib/state/boards/structure/map-bar.ts:27,172` and `src/lib/state/boards/collection/bar.ts:23,46,58,272,350` (callers of `filterGroups` and `facetValues`; their sentences still true), `tests/state/boards/board/hub-facets.test.ts:2` (still true), `src/lib/data/snapshot/normalise.ts:446` (`RESERVED_RESOURCE_KEYS = ['__none__', ...]`, see limitations). The other hits are same-named functions of other modules (`choicesOf` of `state/system/machine/hpc/submit.ts:95` and `state/system/apps/shell/show/strip.ts:65`, `orderValues` of `server/edit/deck-edit.ts:87`, `filterGroups` of `views/sessions/session-list/session-list.ts:172`, `choicesOfLanguage`) and the collection's own No funding card and catalog keys (`collection.no_funding`), which this step does not touch.

Head and doc comments of what the step touched, re-read:

- `state.ts:1-3` file head: still true. `facetValues` doc `state.ts:29-44`: rewritten. `applyFilters` doc: still true. `parseBoardState` doc: still true.
- `facets.ts:1-16` file head: still true. `facetLabel` doc: still true. `countValues`: still true. `orderValues` doc "The values of one facet, in the order its list gives them.": still true. `facets` doc `facets.ts:263-278`: rewritten (a facet whose one value is the value for none is offered and its group drawn only while it is picked).
- `filter-menu.ts:1-20` file head: still true. `FilterChoice.share` doc `filter-menu.ts:57-60`: rewritten. `valueLabel` doc: still true. `noneWords`: new. `choicesOf` doc: rewritten. `filterGroups` doc `filter-menu.ts:180-191`: rewritten. `boardFilter` doc: still true.
- `presets.ts:44-47` (`NONE`): rewritten. `FacetValue` and `Facet` docs (`presets.ts:213-220`): still true.
- `collection/bar.ts:1-28` head: still true. `map-bar.ts` `mapBar`: still true. `graph.ts:266-273` `filterGraph` doc ("the pillars picked keep their own pillar nodes"): still true; a pick of `__none__` keeps no pillar node, case 16.
- `docs/HELP.md:105`, `:372`, `:472` (the Filter list, the collection's Projects section, a deck's Projects board filter): still true.

History grep over every added line: `git diff -U0 -- src config | grep "^+" | grep -v "^+++" | grep -n -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands|\bO[0-9]+|\bQ[0-9]+|\bD[0-9]+|20[0-9][0-9]-"` printed one line: `67:+ * pillar, a funding scheme, a dataset or a resource no registry holds is dropped before the board`. Judged: it states the order in which the build drops a key and the board reads the item, no history.

Every edited comment is a whole paragraph wrapped at 100 columns: each block was compared with a greedy 100-column wrap of its own words, and `tests/checks/source/comment-width.test.ts` passed in the rerun above.

## Judgment calls the brief left open

1. The rule of item 4 is written over the value `NONE`, not over a list of the eleven facets: a group whose values, offered and picked, are all `__none__` and none of them picked is not drawn, whatever its facet. The five facets that have no value for none (Role, Tier, Hub, Reproduced, Sessions) can carry `__none__` only from a word written `__none__` in a manifest, which the brief's grep finds nowhere.
2. The words of every value for none of the board's own catalog are in one function, `noneWords` (`filter-menu.ts:128`), Compute's `board.compute_none` among them; Code's value for none takes its words from `codeLabel` (`tones.ts`), the branch of `valueLabel` that reads every Code value. The output for Year, Funding, Compute and Code is the same (case 11).
3. Funding and Compute go through the same `orNone` helper as the seven (`state.ts:70`, `state.ts:76`); their values are the same as on the base (case 11).
4. In `orderValues`, Situation and Form list the value for none last only when a project of the board carries it (`has(NONE)`), as Year and the general branch do.
5. `presets.ts` line 44, one line in the write list, became four lines, since a one-line comment naming the eleven cases is over 100 columns.

## Host- and user-visible changes, before and after

What the look should be put in and what should differ. A builder runs no page, so each is proved by the case runs above and by the look on landing.

- Projects board (Research), bar line 1 and More: before, Form, Situation, Domain, Venue, Waiting on, Pillar and Datasets listed only named values, and Year, Funding, Compute and Code were drawn even where their only row was the value for none. After, each of the seven lists its value for none last, by the words `No form`, `No situation`, `No domain`, `No venue`, `Not waiting`, `No pillar`, `No dataset`, wherever a project lacks the field; a pick of it narrows the cards to those projects and the group button reads, for instance, "Situation: No situation". Any of the eleven facets whose only row would be its value for none is not drawn. Look: open Projects, open each of those groups; pick `No venue` and see the Venue list's bars: the named venues scaled against the largest named venue, no bar on the `No venue` row.
- Personal board: no project has a form or datasets (brief's per-tier count), so no Form and no Datasets group is drawn before or after; any of Year, Funding, Compute or Code whose only value on that board is the value for none disappears from the bar after the change. Not verified on the real hub here (the builder does not read the hub); the look on landing shows it.
- Software board: no project has a form or a `waiting-on`, so no Form and no Waiting on group before or after; the same rule as above for Year, Funding, Compute and Code. Not verified on the real hub here.
- Present view (a deck whose groups hold project decks): it reads `boardFilter`, so its bar changes exactly as the Projects board's. Look: open such a deck's Present view and the same groups.
- The Map's bar and graph: the Map's groups (Form, Situation, Year, Domain, Venue, Pillar, and in More the rest) change as the board's. With `No pillar` picked, the bar keeps the projects with no pillar, the graph draws them with no pillar node, and with Connected only on as well the graph is empty (case 16). Look: open the Map, pick `No pillar` in the Pillar group, then turn on Connected only in the Show group.
- A collection page's Projects section (in More, on a collection whose cards draw a project strip, such as Funding): Form and Pillar end with `No form` and `No pillar` where a strip project lacks them, and a pick of one narrows the strips (case 13); a Form or Pillar group whose only row would be its value for none is not drawn.
- A saved pick of a value for none that no project carries any more is listed at 0 with its words (`No domain`, case 14), where the base drew such a row as `__none__`.
- Unchanged: the red badge of the Situation button, the Waiting quick toggle, the Awaiting box's links, the group order of the bar, and the files of the Map, the Present view and the collection bar.

## Wrong or impossible in the brief

- The brief's vitest command puts three tree checks under `tests/checks` beside two unit files without the time limit the repository gives the tree checks (`package.json:16`, `--testTimeout 0 --hookTimeout 0`); under background priority on this machine each of the three timed out at vitest's default 5000 ms. Rerun alone with the repository's own `test:checks` setting, all three pass (quoted above). No time limit of the repository was changed.
- Nothing else in the brief turned out wrong: every premise line read on the tree as the brief states it (`state.ts:38-79`, `presets.ts:44-45`, `filter-menu.ts:120-191`, `facets.ts:141-185`, `projects.yml:64-65`, `links.ts:81-89` within `relations`, `collection/bar.ts:78,272,350`, `map-bar.ts:172`, `graph.ts:269-288`).

## Limitations, sharp edges, scripts

- `__none__` is reserved only as a resource key (`src/lib/data/snapshot/normalise.ts:446`). A domain, venue, pillar, dataset or funding key, a chip or a form written `__none__` would merge with the value for none; the brief's grep finds none in the hub and keeps no case for it. Reserving the key in the other registries is outside this step's paths.
- A `No venue` row carries no `share`, so `PickMenu.svelte:130-131` draws no bar on it beside rows that have one; how that row lines up with the bars is for the look.
- The saved board state keeps a pick of `__none__` under the seven facets as written; a pick of the value for none of Situation, Form, Domain, Venue, Waiting on, Pillar or Datasets saved before this step could not have been made from the bar, so none is expected in a saved layout.
- The case program reached the board code through a scratch vitest config (`.agents/scratch/vitest.cases.config.ts`, quoted below), since `src` runs Svelte runes that plain Node cannot. It printed only; both files were removed before this report.
- Two other things ran that are scripts under the rules file: a `sed -i` that changed one line of a scratch smoke program, `.agents/scratch/smoke.case.ts` (removed, never part of the diff), and `.agents/scratch/wrap.mjs`, a Node program that printed a greedy 100-column wrap of a comment's words, which the comment edits were then made from with the Edit tool; it changed no file. Neither had an approval in the brief. Source of `wrap.mjs`:

```js
const text = process.argv[2]; const prefix = process.argv[3] ?? ' * ';
const words = text.split(' '); let line = prefix.trimEnd() === '' ? '' : prefix; const out = []; line = prefix;
for (const w of words) { if ((line + w).length > 100 && line !== prefix) { out.push(line.trimEnd()); line = prefix + w + ' '; } else line += w + ' '; }
out.push(line.trimEnd()); console.log(out.join('\n'));
```

- Nothing of the builder's is still running; `.agents/scratch/` was emptied before the hand-back.

## Doc text

None. `grep -n -i "situation\|waiting on\|facet\|filter group\|share bar\|venue bar\|draws no\|More holds\|value for none\|no chip\|bar.*venue" docs/HELP.md docs/data-map.md docs/apps.md README.md` and `grep -n -i "filter\|bar\b\|group" docs/HELP.md` find no sentence that states a facet's values for an empty field or which groups the bar draws; the lines found (`HELP.md:99`, `:105`, `:110`, `:112`, `:372`, `:444`, `:472`, `data-map.md:95`) stay true.

## The case-run program

`.agents/scratch/vitest.cases.config.ts`:

```ts
// Scratch config: runs the O191 case-run program with the repository's own plugins.
import base from '../../vite.config.ts';
import { defineConfig } from 'vitest/config';
export default defineConfig(async (env) => {
    const made = await (base as (e: typeof env) => Record<string, any>)(env);
    return {
        ...made,
        test: {
            ...made.test,
            projects: undefined,
            environment: 'node',
            include: ['.agents/scratch/**/*.case.ts'],
            expect: { requireAssertions: false },
            maxWorkers: 1
        }
    };
});
```

`.agents/scratch/o191.case.ts`:

```ts
// Case-run program for O191: prints the result of each case of the brief, asserts nothing.
import { it } from 'vitest';
import type { Project, Snapshot } from '../../src/lib/data/model/index.ts';
import { linked } from '../../src/lib/data/snapshot/normalise-parts/links.ts';
import { setCatalog } from '../../src/lib/state/shared/words/text.ts';
import { setVocab } from '../../src/lib/state/shared/words/tones.ts';
import {
    NONE,
    boardFilter,
    boardItems,
    facetValues,
    facets,
    filterGroups,
    mapPreset,
    presetFor,
    type BoardItem,
    type FilterGroup
} from '../../src/lib/state/boards/board/index.ts';
import { collectionBar } from '../../src/lib/state/boards/collection/bar.ts';
import { mapBar } from '../../src/lib/state/boards/structure/map-bar.ts';
import { buildGraph } from '../../src/lib/state/boards/structure/graph.ts';
import {
    CATALOG,
    CONFIG,
    MINE,
    SELF,
    project,
    snapshotOf
} from '../../tests/state/boards/board/board-fixture.ts';

setCatalog(CATALOG);
// The shipped vocabulary as oculus's own words, with no hub: chips, forms and stages.
setVocab({ lists: {}, own: CONFIG, order: [] });

const out = (name: string, value: unknown): void => {
    process.stdout.write(`${name}: ${JSON.stringify(value)}\n`);
};

/** A research project the user leads at exploring, on the Projects board. */
const P = (id: string, over: Partial<Project> = {}): Project =>
    project(id, { tier: 'research', lead: [SELF], stage: 'exploring', ...over });

const VENUES = {
    bspc: { id: 'bspc', name: 'Biomedical Signal Processing and Control', short: 'BSPC' },
    cbm: { id: 'cbm', name: 'Computers in Biology and Medicine', short: 'CBM' }
};
const PILLARS = {
    p1: { id: 'p1', title: 'Pillar One', color: '#16a34a', fundingIds: [], projectIds: [] }
};
const RESOURCES = {
    utwente: { id: 'utwente', name: 'UTwente HPC', kind: 'cluster', links: [], order: 1 }
};
const PEOPLE = {
    [SELF]: { id: SELF, name: 'Axel', self: true },
    amir: { id: 'amir', name: 'Amir' }
};

/**
 * A snapshot as snapshotOf builds it, the registries above filled, the projects' links normalised
 * by the build's own rule (links.ts `linked`), so a key no registry holds is dropped as it is in a
 * real build.
 */
function snap(projects: Project[]): Snapshot {
    const base = snapshotOf(projects);
    const known = {
        projects: new Set(projects.map((one) => one.id)),
        people: new Set(Object.keys(PEOPLE)),
        venues: new Set(Object.keys(VENUES)),
        funding: new Set(['zonmw']),
        datasets: new Set(['mimic']),
        pillars: new Set(Object.keys(PILLARS)),
        domains: new Set(['ecg']),
        resources: new Set(Object.keys(RESOURCES)),
        organisations: new Set<string>()
    };
    const pillars = Object.values(PILLARS).map((one) => ({ ...one, projectIds: [] }));
    linked(
        {
            projects,
            datasets: [],
            pillars: pillars as never,
            domains: [],
            schemes: [],
            people: [],
            organisations: []
        },
        known
    );
    return {
        ...base,
        entities: {
            ...base.entities,
            venues: VENUES,
            pillars: Object.fromEntries(pillars.map((one) => [one.id, one])),
            resources: RESOURCES,
            people: PEOPLE
        }
    } as unknown as Snapshot;
}

const BOARD = presetFor('projects', CONFIG);

/** The Projects board's filter over the projects with the saved state `saved`. */
function board(projects: Project[], saved: unknown = {}) {
    const items = boardItems(snap(projects), BOARD);
    return boardFilter(items, BOARD, true, [], saved, null);
}

/** One group's rows as [words, count, picked, share], or 'no group'. */
function rows(groups: FilterGroup[], id: string): unknown {
    const group = groups.find((one) => one.id === id);
    if (group === undefined) return 'no group';
    return group.items.map((one) =>
        one.share === undefined
            ? [one.label, one.count, one.active]
            : [one.label, one.count, one.active, one.share]
    );
}

const ids = (items: BoardItem[]): string[] => items.map((one) => one.id);

it('the cases of O191', () => {
    // Case 1
    {
        const two = [P('none-chip'), P('blocked', { chips: ['blocked'] })];
        out('case 1 list', rows(board(two).groups, 'status'));
        out('case 1 shown under No situation', ids(board(two, { filters: { status: [NONE] } }).shown));
    }
    // Case 2
    {
        const two = [P('none-chip'), P('blocked', { chips: ['blocked'] })];
        const made = board(two, { filters: { status: ['blocked', NONE] } });
        out('case 2 shown', ids(made.shown));
    }
    // Case 3
    {
        const three = [
            P('d-none'),
            P('d-unknown', { domainIds: ['nowhere'] }),
            P('d-ecg', { domainIds: ['ecg'] })
        ];
        const items = boardItems(snap(three), BOARD);
        out('case 3 values', items.map((one) => [one.id, facetValues(one, 'domain')]));
        const made = boardFilter(items, BOARD, true, [], {}, null);
        out('case 3 list', rows(made.groups, 'domain'));
        out('case 3 shown under No domain', ids(boardFilter(items, BOARD, true, [], { filters: { domain: [NONE] } }, null).shown));
    }
    // Case 4
    {
        const two = [P('w-none'), P('w-amir', { waitingOn: ['amir'] })];
        out('case 4 list', rows(board(two).groups, 'waiting'));
        out('case 4 shown under Not waiting', ids(board(two, { filters: { waiting: [NONE] } }).shown));
    }
    // Case 5
    {
        const venue = [P('v-none'), P('v-bspc', { venueId: 'bspc' }), P('v-unknown', { venueId: 'nowhere' })];
        const pillar = [P('p-none'), P('p-one', { pillarIds: ['p1'] }), P('p-unknown', { pillarIds: ['nowhere'] })];
        const dataset = [P('s-none'), P('s-mimic', { datasetIds: ['mimic'] }), P('s-unknown', { datasetIds: ['nowhere'] })];
        out('case 5 venue list', rows(board(venue).groups, 'venue'));
        out('case 5 venue values', boardItems(snap(venue), BOARD).map((one) => [one.id, facetValues(one, 'venue')]));
        out('case 5 pillar list', rows(board(pillar).groups, 'pillar'));
        out('case 5 pillar values', boardItems(snap(pillar), BOARD).map((one) => [one.id, facetValues(one, 'pillar')]));
        out('case 5 dataset list', rows(board(dataset).groups, 'dataset'));
        out('case 5 dataset values', boardItems(snap(dataset), BOARD).map((one) => [one.id, facetValues(one, 'dataset')]));
    }
    // Case 6
    {
        const two = [P('f-none'), P('f-journal', { form: 'journal' })];
        out('case 6 list', rows(board(two).groups, 'form'));
    }
    // Case 7
    {
        const two = [P('a', { chips: ['blocked'] }), P('b', { chips: ['parked'] })];
        out('case 7 list', rows(board(two).groups, 'status'));
    }
    // Case 8
    {
        const three = [
            P('a-none-blocked', { chips: ['blocked'] }),
            P('b-none-nochip'),
            P('c-ecg-blocked', { domainIds: ['ecg'], chips: ['blocked'] })
        ];
        const made = board(three, { filters: { status: ['blocked'], domain: [NONE] } });
        out('case 8 domain list', rows(made.groups, 'domain'));
        out('case 8 situation list', rows(made.groups, 'status'));
        out('case 8 shown', ids(made.shown));
    }
    // Case 9
    {
        const two = [P('a'), P('b')];
        const plain = board(two);
        out('case 9 groups drawn', plain.groups.map((one) => one.id));
        out('case 9 form group', rows(plain.groups, 'form'));
        out('case 9 form group, No form picked', rows(board(two, { filters: { form: [NONE] } }).groups, 'form'));
        out('case 9 year group', rows(plain.groups, 'year'));
        out('case 9 year group, No year picked', rows(board(two, { filters: { year: [NONE] } }).groups, 'year'));
    }
    // Case 10
    {
        const six = [
            P('n1'),
            P('n2'),
            P('n3'),
            P('b1', { venueId: 'bspc' }),
            P('b2', { venueId: 'bspc' }),
            P('c1', { venueId: 'cbm' })
        ];
        out('case 10 venue list', rows(board(six).groups, 'venue'));
    }
    // Case 11
    {
        const two = [
            P('full', {
                year: 2025,
                fundingIds: ['zonmw'],
                resourceIds: ['utwente'],
                codeAvailability: { status: 'deposited' } as never
            }),
            P('empty')
        ];
        const groups = board(two).groups;
        for (const id of ['year', 'funding', 'compute', 'code']) out(`case 11 ${id}`, rows(groups, id));
    }
    // Case 12
    {
        const preset = mapPreset(CONFIG);
        const items = boardItems(snapshotOf([project('no-tier', { tier: undefined, stage: 'exploring' })], false), preset);
        const one = items[0];
        out('case 12 values', ['hub', 'tier', 'role'].map((facet) => [facet, facetValues(one, facet)]));
        out('case 12 facets', facets(items, preset, true).filter((one) => ['hub', 'tier', 'role'].includes(one.key)).map((one) => [one.key, one.values.map((value) => [value.value, value.count])]));
    }
    // Case 13
    {
        const preset = mapPreset(CONFIG);
        const items = boardItems(snap([P('bare'), P('both', { form: 'journal', pillarIds: ['p1'] })]), preset);
        const entry = { id: 'e1', title: 'E1', fields: { title: 'E1' }, file: '/x.yml', index: 0 };
        const bar = collectionBar({
            entries: [entry],
            schemas: [[{ field: 'title', type: 'text' }]],
            filters: {},
            search: '',
            mine: false,
            config: CONFIG,
            self: MINE,
            hubs: [],
            noFunding: 0,
            strips: { of: () => items, unfunded: [], preset }
        });
        out('case 13 form', rows(bar.groups, 'project_form'));
        out('case 13 pillar', rows(bar.groups, 'project_pillar'));
    }
    // Case 14
    {
        const two = [P('a', { domainIds: ['ecg'] }), P('b', { domainIds: ['ecg'] })];
        const made = board(two, { filters: { domain: [NONE] } });
        out('case 14 domain', rows(made.groups, 'domain'));
        out('case 14 shown', ids(made.shown));
    }
    // Case 15
    {
        const two = [P('w-none'), P('w-amir', { waitingOn: ['amir'] })];
        const made = board(two, { waiting: true, filters: { waiting: [NONE] } });
        out('case 15 shown', ids(made.shown));
        out('case 15 waiting', rows(made.groups, 'waiting'));
    }
    // Case 16
    {
        const preset = mapPreset(CONFIG);
        const snapshot = snap([P('bare'), P('lined', { pillarIds: ['p1'] })]);
        const items = boardItems(snapshot, preset);
        const made = mapBar({
            items,
            preset,
            filters: { pillar: [NONE] },
            search: '',
            mine: false,
            named: true,
            hubs: [],
            config: CONFIG
        });
        out('case 16 kept', ids(made.kept));
        out('case 16 pillar group', rows(made.groups, 'pillar'));
        for (const connected of [false, true]) {
            const graph = buildGraph(snapshot, CONFIG, {
                projects: new Set(made.kept.map((one) => one.project.id)),
                pillars: [NONE],
                connected
            });
            out(`case 16 graph connected=${String(connected)}`, graph.nodes.map((one) => [one.kind, one.entityId]));
        }
    }
    // Case 17
    {
        const two = [P('odd', { chips: ['zzz-chip'], form: 'zzz-form' }), P('plain', { chips: ['parked'], form: 'journal' })];
        const items = boardItems(snap(two), BOARD);
        out('case 17 values', items.map((one) => [one.id, facetValues(one, 'status'), facetValues(one, 'form')]));
        const made = boardFilter(items, BOARD, true, [], {}, null);
        out('case 17 situation', rows(made.groups, 'status'));
        out('case 17 form', rows(made.groups, 'form'));
        out('case 17 shown under No situation', ids(boardFilter(items, BOARD, true, [], { filters: { status: [NONE] } }, null).shown));
        out('case 17 shown under No form', ids(boardFilter(items, BOARD, true, [], { filters: { form: [NONE] } }, null).shown));
    }
    out('filterGroups exported', typeof filterGroups);
});
```
