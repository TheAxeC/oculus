# O90 report: the board bar's Waiting on filter

Everything in the brief is done. Cases 17, 18 and 19 are looks on landing; the builder runs no page, so their proof is the look.

## Open items of the state file, verbatim

`sed -n 166,169p .scratch/migration/orchestrator-state.md` prints the heading and its one paragraph, and no entry under it:

> ## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)
>
> An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

Open items: none.

## The cases' first run (unchanged tree, before any change)

Cases 1-8 and 10-16 were run by the case-run program `o90-cases.mts` in the session scratchpad (source at the end of this report), with `npx tsx <scratchpad>/o90-cases.mts <tree> <scratchpad>`. The first run was taken on the unchanged worktree before any edit; the program's final form (which installs the shipped words with `setVocab` so a group's hue reads its palette tone, and prints the Venue group's tone beside the Waiting on group's) was run again on the base copy `.agents/worktrees/O90-base`, the unchanged tree. Its output, whole:

```
case 1: {} "(no waitingWords)" ["projects","blocked","dated","warnAt","venues"]
case 2: ["p1","p2","p3"] ["p1","p2","p3"] ["p1","p2","p3"]
case 3: undefined
case 4: ["p1","p2","p3"] ["p1","p2","p3"]
case 5: undefined
case 6: undefined " approval"
case 7: {"waitingOn":["hub:amir"," amir ",""]} {"waitedOn":[{"id":"hub:amir","label":"Amir Haeri","kind":"person"},{"id":"amir","label":"amir","kind":"none"}]} {} undefined {}
case 8: {} {} ["e1","e2"]
case 10: ["year","funding","compute","reproduced","code","sessions"] "(no waitingWords)"
case 11a: undefined
case 11b: [{"value":"other","label":"other","count":2},{"value":"methods","label":"methods","count":1}]
case 12a: undefined
case 12b: undefined
case 13: {} {"stale":true,"dated":true,"mine":false} {} {}
case 14: ["p1","p3"]
case 15: ["year","venue","hub","funding","compute","reproduced","code","sessions"] ["form","status","role","year","domain","venue","hub"] "Code" "(no group)" {"venueTone":"amber"}
case 16: undefined
```

The run on the unchanged worktree before the edits printed the same lines but for case 15, which ended `"Code" "(no group)"` with no venue tone printed.

Per case, on the unchanged tree:

1. `stats()` has no `waiting` key (keys `projects, blocked, dated, warnAt, venues`), and `waitingWords` does not exist.
2. `{ waiting: true }` keeps all three projects: the quick filter is ignored.
3. `facets` has no `waiting` facet (`undefined`).
4. `{ waiting: ['btfno'] }` and `{ waiting: ['amir', 'btfno'] }` keep all three: the facet is ignored.
5. No `waiting` facet.
6. No facet; `waitingLabel('IRB: approval', {}, {})` gives `" approval"`.
7. Built snapshot: `Project.waitingOn` is `["hub:amir", " amir ", ""]`; `waitedOn` gives two entries, the person and `amir` as a value no record holds; the item has no `waiting`; no facet; no count. This reproduces the brief's premise (item 8 of "What is on the tree").
8. `item.waiting` absent, no count, the toggle keeps both projects.
9. The G92 test, its two changed lines run on the unchanged code (`npx vitest run tests/state/boards/board/hub-facets.test.ts --reporter=verbose`):
   ```
    x |unit| tests/state/boards/board/hub-facets.test.ts > the group lists on a workspace of two hubs > lists a value both hubs name once, counted over both 4ms
      -> expected undefined to deeply equal [ { value: 'amir', <ellipsis>(2) } ]
    x |unit| tests/state/boards/board/hub-facets.test.ts > the group lists on a workspace of two hubs > keeps both hubs' projects under a filter on that value 1ms
      -> expected [ 'one', 'look-hub2:two', 'three' ] to deeply equal [ 'one', 'look-hub2:two' ]
         Tests  2 failed | 1 passed (3)
   ```
   (`x` stands for `<multiplication sign>` and `->` for `<rightwards arrow>` in the printed lines.) The failing lines are `tests/state/boards/board/hub-facets.test.ts:53` and `:63`.
10. `filterGroups` holds no `waiting` group; no `waitingWords`.
11. (a) no `waiting` facet; (b) with `quick: { waiting: true }` the Domain counts are taken over all three projects (`other` 2, `methods` 1): the toggle is ignored.
12. No `waiting` group for a picked `ghost` or a picked `amir`.
13. `parseBoardState` gives no `waiting` field for `{ waiting: true }`, `{}` or `emptyBoardState()`; the other fields read as given.
14. `{ dated: true, waiting: true }` keeps `p1` and `p3`, the deadline toggle alone.
15. No `waiting` group or line facet; `facetHeading('waiting')` gives `Code` (the fallback line).
16. No facet.
17. Look on landing. View: a project board on localhost:8790 holding bt-operator-theory (waiting on amir-haeri and btfno). Should be seen: after `deadline <n>` a chip `waiting 1` with the waiting glyph; pressing it leaves bt-operator-theory alone and line 2 reads "1 of <n> shown"; the Waiting on button lists BT-FNO, then Maryam Amir Haeri, each at 1, with red dots; picking either keeps the project. The track record's board (a role row of the Career banner's Track record) draws the toggle and the group too.
18. Look on landing. View: a project board in a narrow pane on 8790, a workspace of one hub (no Hub group). Should be seen: the group buttons fold into More last first, Waiting on first, then Venue; More then lists Waiting on under a red heading.
19. Look on landing. View: a board none of whose projects waits. Should be seen: no Waiting on button, the toggle reads `waiting 0`.

No case was found wrong by the brief's rules.

## DONE / NOT DONE

| Item | State | Proof (command, output) |
| --- | --- | --- |
| 1. `BoardItem.waiting` built in `itemOf`; ProjectCard reads `item.waiting` | DONE | case 7 last run: `{"itemWaiting":[{"id":"hub:amir","label":"Amir Haeri","kind":"person"}]}`; `grep -n "personNames\|waitedOn" src/lib/views/shared/card/project/ProjectCard.svelte` prints nothing; the card's line is a look on landing |
| 2. `waitingValue`; `waitingLabel` names a value neither holds as written; merge reads values trimmed | DONE | case 6: `[{"value":"IRB: approval","label":"IRB: approval","count":1}] "IRB: approval"`; case 7: `{"waitingOn":["hub:amir"]}` ... `{"statsWaiting":1}` |
| 3. The `waiting` facet in `FACETS` and `LINE_FACETS` after Venue, its records, order and heading | DONE | case 3: `[{"value":"amir","label":"Amir Haeri","count":2},{"value":"btfno","label":"BT-FNO","count":1}]`; case 5: Ann before Zed; case 15: `["year","venue","waiting","hub",...]`, `["form","status","role","year","domain","venue","waiting","hub"] "Waiting on"`; case 16: `[{"value":"btfno","label":"BT-FNO","count":2}]` |
| 4. The toggle: `BoardState.waiting`, `QuickFilters.waiting`, `BoardStats.waiting`, `waitingWords`, the Chip, `quick` in Projects.svelte | DONE | case 1: `{"waiting":2} "waiting 2"`; case 2: `["p1","p2"] ["p1","p2","p3"] ["p1","p2","p3"]`; case 8: `{"itemWaiting":[]} {"statsWaiting":0} []`; case 11b: Domain `other` 1, `methods` 1; case 13: `{"waitingTrue":true} {"waitingYes":false,"stale":true,"dated":true,"mine":false} {"empty":false} {"emptyBoardState":false}`; case 14: `["p1"]`; the Chip is a look on landing |
| 5. The words and the hue | DONE | `grep -rn "facet_waiting\|quick_waiting" config src --exclude=local.yml`: `config/text/views/boards/projects.yml:38`, `:67`, `:68` and their three readers; case 15: tone `"red"` beside `{"venueTone":"amber"}` |
| 6. Comments and help | DONE | head-comment list below; `docs/HELP.md:306` and `:308` rewritten (`git diff docs/HELP.md`: 2 lines changed) |
| 7. The G92 test | DONE | first run above (2 failed); after: `npx vitest run tests/state/boards/board/hub-facets.test.ts --reporter=verbose` prints the three cases with `<check mark>` and `Tests  3 passed (3)` |
| Cases 10-12 | DONE | case 10: `["year","funding","compute","reproduced","code","sessions"] "waiting 0"`; case 11a: `amir` 1, `btfno` 0; case 12a: `["ghost","ghost",0,true]` after the held values; case 12b: `[["amir","amir",0,true]]` |
| Cases 17-19 | look on landing | the views and states above |
| Verify 1: `npm run diagrams && npm run docs:palette && npm run test:quick -- --base 9f55cd701`, once | DONE | exit 0; lines quoted below |
| Verify 2: sizes | DONE | `wc -l` below: largest source file `presets.ts` 625, largest component `Projects.svelte` 455 |
| Verify 3: G92 and G124 tests alone after the change | DONE | `npx vitest run tests/state/boards/board/hub-facets.test.ts tests/state/boards/board/board-rules.test.ts tests/state/boards/board/board-views.test.ts tests/state/boards/board/items.test.ts --reporter=dot`: `Test Files  4 passed (4)`, `Tests  118 passed (118)` |
| Verify 4: unused exports | DONE | `sh utils/unused-exports.sh > <scratchpad>/o90-unused.txt; diff .agents/worktrees/O90-base/unused-exports.txt <scratchpad>/o90-unused.txt` prints nothing, exit 0: no line added or removed |
| Verify 5: history-word grep | DONE | `grep -rn 'Z10[0-9][0-9]\|ruling 4[0-9][0-9]\|\bO9[0-9]\b' src config docs tests --exclude=local.yml` prints nothing, exit 1 |
| Verify 6: ASCII gate | DONE | the perl gate of `spec.md` over every changed file but the two generated `.svg` files prints nothing; `LC_ALL=C grep -c '[^ -~]'` over `docs/diagrams/layers.svg` and `layer-views.svg` gives `0` and `0`; `LC_ALL=C grep -n '[^ -~]'` over this report prints nothing |
| Folder check | DONE | `sh utils/folder-check.sh` prints nothing, exit 0 |

The verify list's summary lines, verbatim from `<scratchpad>/o90-verify.log`:

```
test:quick: 21 changed file(s), from git since 9f55cd701
test:quick: 25 test file(s)
ok      prettier (3.6 s): All matched files use Prettier code style!
ok      ASCII gate (3.6 s)
ok      svelte-kit sync (8.5 s)
ok      eslint (44.6 s)
ok      svelte-check (62.9 s): 1793091775363 COMPLETED 552 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (73.2 s): Duration  63.69s (transform 58.97s, setup 0ms, import 160.57s, tests 64.28s, environment 3ms)
ok      vitest (74.3 s): Duration  65.31s (transform 97.12s, setup 0ms, import 168.72s, tests 31.52s, environment 4ms)
test:quick: 83.1 s; every command passed
```

The list ran once. No whole-suite command was run.

## Commands that wrote a file other than through Edit or Write

- `npx prettier --write` over the 14 changed source and test files: it printed `(unchanged)` for each and changed nothing.
- `npm run diagrams`: rewrote `docs/diagrams/layers.dot`, `layers.svg`, `layer-views.dot`, `layer-views.svg` (the views-to-state import count 1443 to 1441 and views/shared-to-state 394 to 392, the two imports ProjectCard.svelte dropped).
- `npm run docs:palette`: rewrote `docs/palette.md` with the same bytes (`git status --short` does not list it).
- The case-run program planted and removed its hub under the scratchpad (`ls -d <scratchpad>/o90-hub-*` finds none).
- One stray read-only command, `git -C /dev/null status`, was run during the base-copy case run; it failed, printed nothing and changed nothing. It is outside the git commands `spec.md` allows.

## Files with line counts

From `diff -rq .agents/worktrees/O90-base/<folder> <folder>` over `src tests utils config`, plus `git status --short` for `docs/`; `wc -l` after the last change, `git diff --numstat` added/removed:

| File | Lines | +/- | In the write list |
| --- | --- | --- | --- |
| `src/lib/state/boards/waiting.ts` | 67 | 18/7 | yes |
| `src/lib/data/snapshot/hubs/merge.ts` | 394 | 11/3 | yes (lines 153-163) |
| `src/lib/views/shared/card/project/ProjectCard.svelte` | 429 | 1/9 | yes, and one line outside 45-130: the `<CardLinks ... />` call (base line 382, now 374) passes `waiting={item.waiting}`, since the local `waiting` it passed is gone |
| `src/lib/views/shared/card/project/CardLinks.svelte` | 252 | 3/3 | yes (lines 10-15) |
| `src/lib/state/boards/board/presets.ts` | 625 | 18/1 | yes, and one line outside 117-280: `import type { WaitedOn } from '../waiting.ts';` at line 29, which the new field's type needs |
| `src/lib/state/boards/board/state.ts` | 214 | 15/2 | yes |
| `src/lib/state/boards/board/facets.ts` | 341 | 25/14 | yes |
| `src/lib/state/boards/board/filter-menu.ts` | 329 | 13/3 | yes |
| `src/lib/state/boards/board/stats.ts` | 115 | 12/8 | yes (lines 21-70) |
| `src/lib/state/boards/board/items.ts` | 244 | 2/0 | yes |
| `src/lib/state/boards/board/index.ts` | 82 | 2/1 | yes |
| `src/lib/views/boards/projects/FilterBar.svelte` | 211 | 19/8 | yes |
| `src/lib/views/boards/projects/Projects.svelte` | 455 | 4/2 | yes (lines 62-65, 177) |
| `config/text/views/boards/projects.yml` | 106 | 3/0 | yes |
| `config/catalogs/vocab.yml` | 306 | 1/0 | yes (line 237) |
| `docs/HELP.md` | not counted | 2/2 | yes (lines 306, 308) |
| `tests/state/boards/board/hub-facets.test.ts` | 91 | 15/7 | yes |
| `docs/diagrams/layers.dot`, `layers.svg`, `layer-views.dot`, `layer-views.svg` | generated | 1/1 each | yes (`npm run diagrams`) |
| `.scratch/migration/agents/reviews/O90-report.md` | this file | new | yes |

## Judgment calls the brief left open (each reversible)

1. `merge.ts` reads each `waiting-on` value trimmed, and also leaves an empty one out and keeps a value listed again once, at its first place. The brief asks for the trim and says a project waiting on `[amir, ' amir ']` "holds one person"; with the trim alone `Project.waitingOn` would hold `hub:amir` twice, and the Focus strip (`focus.ts:607-609`, which iterates `project.waitingOn` without `waitedOn`) would count the person twice and count an empty value under the empty name. The dedupe and the empty-value drop end both there. A consequence: the project form (`state/forms/schema.ts:440`, `fieldValues`) now shows such a manifest's values trimmed and once, so a save from the form writes them that way.
2. `facetValues(item, 'waiting')` gives each value once (`new Set`), and the `waiting` record reader keeps the first entry of an item for a value, so a project naming one key of two hubs (`hub:amir` and `look-hub2:amir`) counts once in the row.
3. `waitingValue` trims a value that names neither, as the brief's item 2 says; `waitedOn` has trimmed it already, so the trim only matters for a `WaitedOn` built elsewhere.
4. The new `BoardState` doc reads "only the projects waiting on someone or something", the tip's words.
5. The toggle sits after the deadline toggle and before Mine only, as the brief places it; it is drawn on every project board, the track record's included, since FilterBar has one set of toggles.

## Host- or user-visible changes, view by view (before and after, for the look)

- Project boards (every key of `boards:`) and the track record's board, bar line 1. Before: search, stale, `deadline <n>`, Mine only, then Form, Situation, Role, Year, Domain, Venue, Hub. After: a chip `waiting <n>` with the waiting glyph right after `deadline <n>`, tip "only the projects waiting on someone or something", pressed state saved with the board's instance state as `waiting`; a group button "Waiting on" after Venue and before Hub, listing each waited-on person by name, each project by short name or title, and each value that names neither as written, ordered by count then by those words, dots and picked fill red; More's section heading for it red when folded in. Pressing the chip keeps only the projects that wait; the group counts and every other group's counts are taken under it; line 2's count reads "<n> of <m> shown" while it hides cards.
- A narrow pane: the group buttons fold into More last first, so Waiting on folds before Venue and after Hub.
- Project card, WAITING ON line. Before: a value that names neither was drawn by `keyOf`, so `IRB: approval` read ` approval`; a manifest `[amir, ' amir ']` drew two tags. After: drawn as written (`IRB: approval`); one tag for the person.
- Focus strip and lane cards: a value that names neither is named as written (same `waitingLabel`); a duplicated or untrimmed value is counted once (judgment call 1).
- The project form (Editor) for a manifest with untrimmed or repeated `waiting-on` values shows them trimmed and once.

## Changed lines of existing assertions, allow lists and predicates

From `git diff tests/state/boards/board/hub-facets.test.ts` (the one changed test file; no allow list changed):

| File:line | Before | After |
| --- | --- | --- |
| `hub-facets.test.ts:53` (added) | none | `expect(rows('waiting')).toEqual([{ value: 'amir', label: 'Amir', count: 2 }]);` |
| `hub-facets.test.ts:57-62` (base `:54`) | `const kept = applyFilters(ITEMS, { domain: ['methods'], compute: ['utwente'] }, '');` | `const other: BoardItem = { ...item('three'), waiting: [{ id: 'zed', label: 'Zed', kind: 'person' }] };` then `const filters = { domain: ['methods'], compute: ['utwente'], waiting: ['amir'] };` and `const kept = applyFilters([...ITEMS, other], filters, '');` |
| `hub-facets.test.ts:39` (fixture, added) | none | `waiting: [{ id: key('amir'), label: 'Amir', kind: 'person' }],` |

The expectation of the second test (`['one', 'look-hub2:two']`) is unchanged. Both changed tests fail on the unchanged tree (case 9 above) and pass after.

## Head comments and doc comments of the changed files

- `waiting.ts` head comment: rewritten (names the board's Waiting on group); `waitingLabel` doc: rewritten (a value neither holds as written); `WaitedOn`, `waitedOn` docs: still true; `waitingValue` doc: new.
- `merge.ts` head comment: still true; the comment at the `waitingOn` line: rewritten.
- `ProjectCard.svelte` head comment: still true.
- `CardLinks.svelte` head comment: rewritten at lines 10-15 (drawn as written with no press).
- `presets.ts` head comment: still true; `BoardItem.waiting`, `BoardState.waiting`, `BoardStats.waiting`, `QuickFilters.waiting` docs: new; `QuickFilters` doc: rewritten; `FACETS` doc: still true (it names no facet by name).
- `state.ts` head comment: still true; `facetValues` and `applyFilters` docs: rewritten; `emptyBoardState`, `boardStateShape`, `parseBoardState` docs: still true.
- `facets.ts` head comment: rewritten; `facetLabel` doc: rewritten; the `orderValues` comment: rewritten; `facets` doc: still true.
- `filter-menu.ts` head comment: rewritten; `LINE_FACETS`, `facetHeading`, `filterGroups` docs: still true; `waitingWords` doc: new.
- `stats.ts` head comment: still true; `stats` doc: rewritten.
- `items.ts` head comment: still true; `itemOf` doc: still true.
- `index.ts` head comment: still true.
- `FilterBar.svelte` head comment: rewritten.
- `Projects.svelte` second script's head comment: rewritten at lines 62-65 (Hub after Venue and Waiting on).
- `hub-facets.test.ts` head comment and `item()` doc: rewritten.
- `docs/HELP.md:294` (a card's waiting line) and `:296` (a value that names neither "is shown as written"): still true, the second now true of the code as well.
- `src/lib/data/model/model-entities.ts:381-384` (`Project.waitingOn` doc, outside the write list) says an entry is "a key of the people registry or the id of another project, and nothing else"; that was already untrue of a value that names neither, and this step does not change it.

The history-word grep over the comment lines and test titles the step added or changed (`git diff -U0 | grep "^+" | grep -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package lands"`) has two hits, `docs/HELP.md:308` "taken over the board's projects before any filter" and `stats.ts:27` "before any filter, so they say what the board is"; each says the counts are taken ahead of the filter, not an earlier state of the code.

The grep for the names changed, `grep -rn "facet_tones\|LINE_FACETS\|\bFACETS\b" src config tests docs README.md --exclude=local.yml`, finds the facet lists only in the files changed and the generic `facet_tones` readers (`hub-keys.ts:31`, `catalog-files/vocab.ts:450`, `merge/in-place.ts:92`, `hub-names.ts:730`, `config-folder.test.ts:235`, `docs/templates.md:251-253`, `docs/data-map.md:110`), none of which lists the facets by key. `grep -rn "waitingLabel\|waitedOn\|waitingOn" src` finds the other readers: `focus.ts:607-609`, `Lanes.svelte:132`, `person.ts:111-112`, `referrers.ts:79`, `schema.ts:440`; each reads the merged values, now trimmed and once.

## Ids and keys introduced

- The facet key `waiting` and the saved-state field `waiting`: both named by the brief; the facet key collides with no other facet (`FACETS`), and the saved field is a separate key of the board's instance state from `filters.waiting`.
- The text keys `board.facet_waiting`, `board.quick_waiting`, `board.quick_waiting_tip`: one definition each (`grep` above), each with one reader; `tests/checks/source/keys.test.ts` and `catalog-file-keys.test.ts` ran in the list and passed.
- An empty waiting value never becomes a facet value (case 8). A value written as the literal `__none__` would read as the facet's NONE value and sort last; no hub value is known to be that word.
- No asynchronous path is added.

## Anything in the brief wrong or impossible

Nothing. The premises the cases rest on reproduced on the unchanged tree (case 6 `" approval"`, case 7 two `waitedOn` entries for one person).

## Limitations and sharp edges

- The search (`haystack`) does not read the waited-on names; the brief does not ask for it.
- A person and a project of one key share a row (the brief's decision 1).
- `validate.ts:203-213` (`checkWaitingOn`) reads the manifest's raw values, so a manifest value ` amir ` is still compared untrimmed there; it only checks a project waiting on itself.

## The case-run program, source and output

Source, `<scratchpad>/o90-cases.mts` (the scratchpad of this session), run as `npx tsx <scratchpad>/o90-cases.mts <tree root> <scratchpad>`:

```ts
// Case-run program for O90: prints the result of cases 1-8 and 10-16 over the tree given as the
// first argument (the worktree root). Writes nothing into the tree; case 7 plants a hub in a
// directory under the scratchpad and removes it before it ends.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// The one rune the words modules hold (generation.svelte.ts) read as a plain value outside Svelte.
(globalThis as any).$state = (value: unknown) => value;

const root = process.argv[2];
const scratch = process.argv[3];
const at = (path: string): string => join(root, path);

const { engineDir, loadConfig, textCatalog } = await import(at('src/lib/data/sources/config.ts'));
const { portfolioConfigFrom } = await import(at('src/lib/data/index.ts'));
const { createChecker } = await import(at('src/lib/data/snapshot/schema/check.ts'));
const { buildHubs } = await import(at('src/lib/server/root/watch/build.ts'));
const { setCatalog } = await import(at('src/lib/state/shared/words/text.ts'));
const board = await import(at('src/lib/state/boards/board/index.ts'));
const menu = await import(at('src/lib/state/boards/board/filter-menu.ts'));
const waiting = await import(at('src/lib/state/boards/waiting.ts'));
const { NO_FEEDS, fixtureProject } = await import(at('tests/fixtures/entities-fixture.ts'));

const { setVocab } = await import(at('src/lib/state/shared/words/tones.ts'));
const { hubVocabs } = await import(at('src/lib/data/index.ts'));

const { config } = loadConfig(engineDir());
setCatalog(textCatalog(config));
// The shipped words installed as the page installs them, so a facet's hue reads its palette tone.
setVocab(hubVocabs({ primary: null, folders: [], own: config }, null, []));
const preset = board.presetFor('projects', config);

type Over = Record<string, unknown>;
function proj(id: string, over: Over = {}): any {
    return fixtureProject({
        id,
        title: id,
        folder: id,
        file: `${id}/project.yml`,
        tier: 'research',
        stage: 'exploring',
        ...over
    });
}

/** A snapshot of the projects, the people and the other projects (`extra`) given. */
function snap(projects: any[], people: Record<string, string>, extra: any[] = [], venues = {}): any {
    return {
        version: 1,
        entities: {
            projects: Object.fromEntries([...projects, ...extra].map((one) => [one.id, one])),
            venues,
            pillars: {},
            domains: {},
            funding: {},
            people: Object.fromEntries(
                Object.entries(people).map(([id, name]) => [id, { id, name }])
            ),
            organisations: {},
            resources: {},
            collections: {},
            datasets: {},
            feeds: NO_FEEDS,
            career: null
        },
        relations: { projectRelated: [], projectVenue: [] },
        findings: []
    };
}

const itemsOf = (s: any, projects: any[]): any[] =>
    projects.map((p) => board.boardItemFor(s, p, preset));
const ids = (items: any[]): string[] => items.map((one) => one.id);
const row = (found: any[], key: string): unknown => found.find((f) => f.key === key)?.values;
const words = (stats: any): string =>
    typeof menu.waitingWords === 'function' ? menu.waitingWords(stats) : '(no waitingWords)';
const show = (n: number | string, ...parts: unknown[]): void =>
    console.log(`case ${n}:`, ...parts.map((one) => JSON.stringify(one)));

// The board of cases 1-4, 10, 11 and 14.
const btfno = proj('btfno', { short: 'BT-FNO', title: 'Block-term FNO' });
const p1 = proj('p1', { waitingOn: ['amir'], domainIds: ['methods'], deadline: '2026-12-01' });
const p2 = proj('p2', { waitingOn: ['amir', 'btfno'], domainIds: ['other'] });
const p3 = proj('p3', { domainIds: ['other'], deadline: '2026-12-01' });
const s1 = snap([p1, p2, p3], { amir: 'Amir Haeri' }, [btfno]);
const items1 = itemsOf(s1, [p1, p2, p3]);
const stats1 = board.stats(items1, {}, config);

show(1, { waiting: stats1.waiting }, words(stats1), Object.keys(stats1));
show(
    2,
    ids(board.applyFilters(items1, {}, '', { waiting: true })),
    ids(board.applyFilters(items1, {}, '', { waiting: false })),
    ids(board.applyFilters(items1, {}, '', {}))
);
show(3, row(board.facets(items1, preset), 'waiting'));
show(
    4,
    ids(board.applyFilters(items1, { waiting: ['btfno'] }, '')),
    ids(board.applyFilters(items1, { waiting: ['amir', 'btfno'] }, ''))
);

const q1 = proj('q1', { waitingOn: ['a-zed'] });
const q2 = proj('q2', { waitingOn: ['b-ann'] });
const s5 = snap([q1, q2], { 'a-zed': 'Zed', 'b-ann': 'Ann' });
show(5, row(board.facets(itemsOf(s5, [q1, q2]), preset), 'waiting'));

const r1 = proj('r1', { waitingOn: ['IRB: approval'] });
const s6 = snap([r1], {});
show(
    6,
    row(board.facets(itemsOf(s6, [r1]), preset), 'waiting'),
    waiting.waitingLabel('IRB: approval', {}, {})
);

// Case 7, through a built snapshot: a hub planted in the scratchpad, read and merged.
const hub = mkdtempSync(join(scratch, 'o90-hub-'));
const plant = (path: string, text: string): void => {
    mkdirSync(dirname(join(hub, path)), { recursive: true });
    writeFileSync(join(hub, path), text);
};
try {
    plant(
        '.oculus/data/people/people.yml',
        [
            'schema:',
            '  - { field: key, type: text, primary_key: true, required: true }',
            '  - { field: name, type: text, display: 1, required: true }',
            'entries:',
            '  - key: "amir"',
            '    name: "Amir Haeri"',
            ''
        ].join('\n')
    );
    plant(
        'projects/ideas/mine/project.yml',
        "title: Mine\ntier: research\nstage: exploring\nwaiting-on: [amir, ' amir ', '']\n"
    );
    const portfolio = { ...portfolioConfigFrom(config), scan: [{ dir: 'projects/ideas' }] };
    const primary = { key: 'hub', dir: hub, portfolio, workspace: null };
    const read = { primary, others: [], config: portfolio, order: ['hub'], self: '' };
    const { snapshot } = buildHubs(read, 0, createChecker(), null);
    const project = snapshot.entities.projects['hub:mine'];
    const built = board.boardItems(snapshot, preset).filter((one: any) => one.id === 'hub:mine');
    const names = board.boardItemFor(snapshot, project, preset);
    show(
        7,
        { waitingOn: project.waitingOn },
        { waitedOn: waiting.waitedOn(project.waitingOn, { 'hub:amir': 'Amir Haeri' }, {}) },
        { itemWaiting: names.waiting },
        row(board.facets(built, preset), 'waiting'),
        { statsWaiting: board.stats(built, {}, config).waiting }
    );
} finally {
    rmSync(hub, { recursive: true, force: true });
}

const e1 = proj('e1', { waitingOn: ['', '  '] });
const e2 = proj('e2');
const s8 = snap([e1, e2], {});
const items8 = itemsOf(s8, [e1, e2]);
show(
    8,
    { itemWaiting: items8[0].waiting },
    { statsWaiting: board.stats(items8, {}, config).waiting },
    ids(board.applyFilters(items8, {}, '', { waiting: true }))
);

const n1 = proj('n1');
const s10 = snap([n1], {});
const items10 = itemsOf(s10, [n1]);
const groups10 = board.filterGroups(board.facets(items10, preset), {}, preset, false);
const stats10 = board.stats(items10, {}, config);
show(10, groups10.map((g: any) => g.id), words(stats10));

const filters11 = { domain: ['methods'] };
show(
    '11a',
    row(board.facets(items1, preset, false, { filters: filters11, search: '' }), 'waiting')
);
show(
    '11b',
    row(
        board.facets(items1, preset, false, { filters: {}, search: '', quick: { waiting: true } }),
        'domain'
    )
);

const counted12 = board.facets(items1, preset);
const ghost = board
    .filterGroups(counted12, { waiting: ['ghost'] }, preset, false)
    .find((g: any) => g.id === 'waiting');
show('12a', ghost?.items.map((one: any) => [one.id, one.label, one.count, one.active]));
const counted12b = board.facets(items10, preset);
const gone = board
    .filterGroups(counted12b, { waiting: ['amir'] }, preset, false)
    .find((g: any) => g.id === 'waiting');
show('12b', gone?.items.map((one: any) => [one.id, one.label, one.count, one.active]));

const full = board.parseBoardState({ waiting: true }).waiting;
const wrong = board.parseBoardState({ waiting: 'yes', stale: true, dated: true, mine: false });
show(
    13,
    { waitingTrue: full },
    { waitingYes: wrong.waiting, stale: wrong.stale, dated: wrong.dated, mine: wrong.mine },
    { empty: board.parseBoardState({}).waiting },
    { emptyBoardState: board.emptyBoardState().waiting }
);

show(14, ids(board.applyFilters(items1, {}, '', { dated: true, waiting: true })));

const venue = { id: 'bspc', name: 'Biomed Signal Proc', short: 'BSPC' };
const v1 = proj('v1', { waitingOn: ['amir'], venueId: 'bspc' });
const s15 = snap([v1], { amir: 'Amir Haeri' }, [], { bspc: venue });
const items15 = itemsOf(s15, [v1]);
const hubs = ['hub', 'look-hub2'];
const groups15 = board.filterGroups(board.facets(items15, preset, false, undefined, hubs), {}, preset, false, hubs);
show(
    15,
    groups15.map((g: any) => g.id),
    board.LINE_FACETS,
    menu.facetHeading('waiting'),
    groups15.find((g: any) => g.id === 'waiting')?.tone ?? '(no group)',
    { venueTone: groups15.find((g: any) => g.id === 'venue')?.tone }
);

// Case 16: the primary's project waits on btfno, the second hub's on its own project btfno.
const own = proj('btfno', { short: 'BT-FNO', title: 'Block-term FNO' });
const other = proj('look-hub2:btfno', { short: 'BT-FNO', title: 'Block-term FNO', root: 'look-hub2' });
const h1 = proj('h1', { waitingOn: ['btfno'] });
const h2 = proj('look-hub2:h2', { waitingOn: ['look-hub2:btfno'], root: 'look-hub2' });
const s16 = snap([h1, h2], {}, [own, other]);
show(16, row(board.facets(itemsOf(s16, [h1, h2]), preset), 'waiting'));
```

First run: the output in "The cases' first run" above (base copy, unchanged tree).

Last run, on the worktree after the last change (`<scratchpad>/o90-after-run.txt`), whole:

```
case 1: {"waiting":2} "waiting 2" ["projects","blocked","dated","waiting","warnAt","venues"]
case 2: ["p1","p2"] ["p1","p2","p3"] ["p1","p2","p3"]
case 3: [{"value":"amir","label":"Amir Haeri","count":2},{"value":"btfno","label":"BT-FNO","count":1}]
case 4: ["p2"] ["p1","p2"]
case 5: [{"value":"b-ann","label":"Ann","count":1},{"value":"a-zed","label":"Zed","count":1}]
case 6: [{"value":"IRB: approval","label":"IRB: approval","count":1}] "IRB: approval"
case 7: {"waitingOn":["hub:amir"]} {"waitedOn":[{"id":"hub:amir","label":"Amir Haeri","kind":"person"}]} {"itemWaiting":[{"id":"hub:amir","label":"Amir Haeri","kind":"person"}]} [{"value":"amir","label":"Amir Haeri","count":1}] {"statsWaiting":1}
case 8: {"itemWaiting":[]} {"statsWaiting":0} []
case 10: ["year","funding","compute","reproduced","code","sessions"] "waiting 0"
case 11a: [{"value":"amir","label":"Amir Haeri","count":1},{"value":"btfno","label":"BT-FNO","count":0}]
case 11b: [{"value":"other","label":"other","count":1},{"value":"methods","label":"methods","count":1}]
case 12a: [["amir","Amir Haeri",2,false],["btfno","BT-FNO",1,false],["ghost","ghost",0,true]]
case 12b: [["amir","amir",0,true]]
case 13: {"waitingTrue":true} {"waitingYes":false,"stale":true,"dated":true,"mine":false} {"empty":false} {"emptyBoardState":false}
case 14: ["p1"]
case 15: ["year","venue","waiting","hub","funding","compute","reproduced","code","sessions"] ["form","status","role","year","domain","venue","waiting","hub"] "Waiting on" "red" {"venueTone":"amber"}
case 16: [{"value":"btfno","label":"BT-FNO","count":2}]
```

Nothing of the builder's is still running.
