NOT done: everything in "What to build" (items 1 to 9). The first run found cases the brief's rules get wrong (cases 18 and 26 under item 6's rule, and case 28 under premise 13), so the step stopped before any change to the tree, as the builder prompt and the brief's Cases section require. No file of the tree is changed; the only file written in the worktree is this report.

# O81 report: the first run, and the cases handed back

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md:191-195`:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- none.
```

## The cases the brief's rules get wrong (for a ruling before any code changes)

### 1. Cases 18 and 26 under item 6's rule for the record board

The rule (item 6): "Its preset is made by a pure function beside `presetFor` from the role and the merged config and words: the rule takes the role and nothing else, its sections are the record rows only, and its projects are the board's projects whose category is a record row ... Its New project answer comes from G124's rule unchanged ... the record take is read by `offersNewProject` the way it is read by the board's items, with no exception written for the record board." Item 6 also asks: "While no `self` is named, it draws no project and the board's empty message".

What the code reads: the board's items are `boardItems` (`src/lib/state/boards/board/items.ts:213-223`), which keep a project when `boardTakes(preset.rule, project, context)` holds (`items.ts:221`); the board's New project answer is the selector's `offersOfNewProjects(preset.rule, context, hub)` (`src/lib/state/client/selectors.svelte.ts:799-804`), which builds the new project and asks `boardTakes(rule, project, ...)` (`src/lib/state/boards/board/new-project.ts:122`). Both read `preset.rule` and nothing else of the preset. A `BoardRule` holds `tiers`, `roles`, `stages`, `chips`, `forms`, `hub` and `match` (`src/lib/data/shapes/boards/takes.ts:20-28`), and `boardTakes` applies `roles` only while a `self` is named (`takes.ts:136-139`, head comment `takes.ts:5-6`: "`role:` is applied only when the workspace names a `self`").

The result, on the unchanged tree (case-run program below, its output lines):

```
case 18 offersNewProject(rule taking lead only): true
case 26 projects of a rule taking lead, with no self: 115
```

So a preset whose rule "takes the role and nothing else" offers New project (case 18 says it draws none) and, with no `self`, takes 115 of the scratch hub's projects (case 26 says no project). The cases hold only when the record take is inside the `BoardRule` and read by `boardTakes`, which is a change to `src/lib/data/shapes/boards/takes.ts`, the Code line of G124 and outside the step's "Paths this step writes", and which contradicts "the rule takes the role and nothing else".

Options:

- A (recommended): `BoardRule` gains one field, `record: string[] | null`, the keys of the record rows of `categories:`. `boardRuleOf` gives `null` for every row of `boards:` (no key of `boards:` reads it, so no config key is added and no board of `boards:` changes). The record preset sets `roles: [<role>]`, `record: <the union's record row keys>` and every other field `null`. `boardTakes`, when `record` is set, takes a project only when its category (`categoryOf` under its own hub's words, as `trackRecord` reads it, `career.ts:80-84`) is one of those keys and its role for the user (`projectRole` over the user's ids, as `trackRecord` reads it) is one of `roles`; with no `self` no project has a role, so none is taken. `items.ts` and `new-project.ts` stay unchanged, so New project is answered by G124's rule unchanged: the new project at the `new_idea` stage is in the `idea` row, no record row, and is not taken. `takes.ts` joins the write list (its type, `boardRuleOf`, `boardTakes` and its head comment); G124's text needs no change, since the record key is no key a `boards:` row names.
- B: the record board's projects filtered after `boardItems` in the view or the selector, and New project hidden by a check of the view id. This is the exception item 6 forbids, and the board's items and its New project answer would read the record take two ways. It is the lazy option: it costs less now and leaves the record take outside the one rule every board is read by.

### 2. Case 28 under premise 13

The rule (premise 13 and case 28): "A collection view of a key a module view holds is left out with its finding too (`views.ts:155-163`)"; case 28: "A `collections:` entry keyed with the record view's id: the collection view is left out with its existing finding, the record view unchanged."

What the code does: `registerCollections` (`src/routes/views.ts:162-164`) drops an entry whose key is a module view's id by `given.views.filter((entry) => !builtIn.has(entry.key))`, with no finding. The only finding on a collection's key, `findings.collections.view_id` (`config/text/findings.yml:21`, raised at `src/lib/data/helpers/hub-names.ts:415-421`), is given only for the id of a registry's view (`takesRegistryView`, `hub-names.ts:151-153`, over `REGISTRY_VIEWS` at `:130-137`: data, venues, pillars, domains, leads, radar).

The result, on the unchanged tree (`case28.case.ts` below):

```
case 28 collectionListFindings of an entry keyed debug: []
case 28 collectionListFindings of an entry keyed track_record: []
case 28 collectionListFindings of an entry keyed venues: ["config.yml | collections[0].key | the key venues is the id of one of oculus's own views; the collection gets no card-list view"]
```

So no existing finding names a `collections:` entry keyed with a module view's id (`debug` today, `track_record` after the step); such an entry is left out silently.

Options:

- A (recommended): a finding for a `collections:` entry whose key a module view's id holds, given where the entry is left out (`registerCollections`, through `registry.refuse` as `registerBoards` gives `findings.config.boards_view`), with a new finding word in `config/text/findings.yml`. It is a user-visible sentence the brief does not name, so its words are the orchestrator's to approve; it ends the silent drop for every module id, `track_record` among them. Paths outside the write list: `src/routes/views.ts:146-175` (`registerCollections`) and `config/text/findings.yml`. One fact to settle with it: `registerBoards` already calls `registry.refuse(given.findings)` (`views.ts:122`); the registry's `refuse` (`src/lib/state/workbench/navigation/registry.ts:308`) would be read for whether a second caller replaces the first one's findings.
- B: case 28 holds with no finding: the collection view is left out silently, as every module id is today, and the record view is unchanged; the case's words "with its existing finding" are dropped. It is the lazy option: it costs nothing and leaves a reader who names a collection after a built-in view with no word saying why it has no card list.

### 3. A visible consequence to rule with item 4 (no stop by itself)

Case 13 asks that the venue form offer journal, conference, thesis and meeting. Once `venue_categories` holds rows, the form's choices read each row's `label` (`src/lib/state/forms/schema.ts:174-178`, `choiceShape`), so the select will draw "Journals", "Conferences", "Theses" and "Meetings" (the section words) where it draws "journal", "conference", "thesis", "meeting" today (first run: `case 13 choicesFor: [{"id":"journal","label":"journal"},...]`); the value written stays the key. Options: keep it (the row's label is what every keyed list offers, as `venue_tiers` does), or give the rows a second word for the form. Recommendation: keep it, since a second word is a new field the ruling did not name; the look on landing then checks the venue form.

## The cases' first run, on the unchanged tree (base 335db1c9, no change made)

Every run line below is from `before.case.ts` (output `before.out`) unless it names `case28.case.ts`; the source of both is under "The case-run programs".

1. Board section heading. Read: `src/lib/views/boards/projects/Projects.svelte:379-388` draws `<div class="heading"><FoldHead title=... name=... open={!folded.has(section.key)} ontoggle=... tone=... count={section.items.length} /></div>`; `FoldHead.svelte:65-67` draws the count as `<Chip label={String(count)} {tone} />`, the title in bold (`:98-105`). The fold is kept in the board state's `folded` (`Projects.svelte:209-216`). Today the count is a badge, not plain text at `--fs-sm`. The look on landing.
2. Focus clusters. Run: `case 2/3 foldOpen({"closed":["cluster:now"]}, career): true`, `command: true`, `tasks: true`, `cluster:now: false`, `cluster:parked: true`, `band: true`; `case 2 foldToggled({}, cluster:now): {"closed":["cluster:now"]}`. The fold functions answer any string, but nothing calls them with a cluster key: `Lanes.svelte:238-247` heads each cluster with `<summary>` in a `<details class="cluster" ... open>` (`:253`, `:266`), no count, no memory, and `Focus.svelte:310-318` hands `Lanes` no fold.
3. The band. Run: `case 3 foldToggled({}, band): {"closed":["band"]}`; read: `Band.svelte:130-133` `<details class="cluster" open><summary><Surface inline>{t('focus.cards_group')}</Surface></summary>`, no count, no memory; `Focus.svelte:304` hands `Band` no fold.
4. A saved `{ closed: ['career'] }`. Run: `case 4 foldOpen({"closed":["career"]}, career): false`, `command: true`, `tasks: true`, `cluster:now: true`, `lane:idea: true`, `band: true`.
5. A hub cluster keyed `career`. Run: `case 5 exports of focus.ts naming a fold: ["foldOpen","foldToggled"]`: no function makes a grouping's fold key today; a cluster keyed `career` has no fold of its own.
6. Find-in-page in a folded cluster. Read: the clusters are native `<details>` (`Lanes.svelte:253`, `:266`), which the browser opens on a find-in-page match; no `hidden="until-found"` or `beforematch` there (`grep -n "until-found\|beforematch"` over `Lanes.svelte` and `Band.svelte` prints nothing; `CareerPanel.svelte:207-208` holds the pair). The look on landing.
7. Venues on the scratch hub. Run: `case 7 hub venues by category: {"conference":27,"journal":46,"thesis":2,"meeting":1}`; `case 7 venuesByCategory: {"journals":46,"conferences":27}`; `case 7 hub venue_categories: ["journal","conference","thesis","meeting"]`. Theses and Meetings are drawn nowhere.
8. A `workshop` venue and one with no category. Run: `case 8 venuesByCategory: {"journals":["j1"],"conferences":[]}`: `w1` and `n1` are in no section.
9. A hub's rows `[ { key: conference, label: Conferences, ribbon: true }, { key: journal, label: Journals } ]`. Run: `case 9 findings: ["/scratch/lab/.oculus/config.yml | venue_categories.0 | venue_categories.0 must be a text","/scratch/lab/.oculus/config.yml | venue_categories.1 | venue_categories.1 must be a text"]`; `case 9 config.venue_categories: [{"key":"conference","label":"Conferences","ribbon":true},{"key":"journal","label":"Journals"}]`; `case 9 vocabKeys: ["conference","journal"]`. The Venues view reads no config today (`venuesByCategory` writes the two words in code, `venues.ts:181-186`).
10. A bare word `[journal]`. Run: `case 10 findings: []`; `case 10 config.venue_categories: ["journal"]`; `case 10 vocabKeys: ["journal"]`.
11. A row with no label, and `ribbon: yes`. Run: `case 11 no label findings: ["/scratch/lab/.oculus/config.yml | venue_categories.0 | venue_categories.0 must be a text"]`; `case 11 ribbon yes findings: ["/scratch/lab/.oculus/config.yml | venue_categories.0 | venue_categories.0 must be a text"]` (today every row is refused as no text, the field not named).
12. Venues state. Run: `case 12 parseVenuesState({ journalsOpen: false }): {"search":"","off":[],"journalsOpen":false,"conferencesOpen":true}`; `case 12 parseVenuesState({ folded: [thesis] }): {"search":"","off":[],"journalsOpen":true,"conferencesOpen":true}` (no `folded` today).
13. The venue form's category options. Run: `case 13 choicesFor: [{"id":"journal","label":"journal"},{"id":"conference","label":"conference"},{"id":"thesis","label":"thesis"},{"id":"meeting","label":"meeting"}]`.
14. The track record on the scratch hub with `self: axel-faes`. Run: `case 14 self ids: ["axel-faes"]`; `case 14 trackRecord: {"roles":[{"key":"lead","label":"Lead","lines":[{"key":"in-review","label":"in review","count":9},{"key":"in-flight","label":"in flight","count":16},{"key":"publications","label":"publications","count":10},{"key":"other-outputs","label":"other outputs","count":9}]},{"key":"supervisor","label":"Supervisor","lines":[{"key":"in-review","label":"in review","count":4},{"key":"in-flight","label":"in flight","count":0},{"key":"publications","label":"publications","count":0},{"key":"other-outputs","label":"other outputs","count":0}]},{"key":"collaborator","label":"Collaborator","lines":[{"key":"in-review","label":"in review","count":1},{"key":"in-flight","label":"in flight","count":2},{"key":"publications","label":"publications","count":6},{"key":"other-outputs","label":"other outputs","count":6}]}],"funding":1}`; `case 14 record-board functions of presets.ts: []` (no record preset or board today).
15. A project led by the user in no record row. Run: `case 15 a nascent project of the hub: {"id":"asthma-geo-tensor","stage":"nascent","lead":["axel-faes"]}`; at `nascent` it is in the `idea` row, which carries no `record: true` (`config/catalogs/vocab.yml` `categories`), so `trackRecord` counts it in no line. No record board exists to hold it.
16. Second press on the Lead row. Read: today a role row opens `openView(target.view)` (`CareerPanel.svelte:166`) with the board `roleBoard` gives, so Lead opens the Projects board: `case 21/22 targets: {"career:role:lead":{"kind":"view","view":"projects"},...}`. The look on landing.
17. Search and facets on a record board. Read: a board's writes go to the UI instance-state map (`Projects.svelte:174-176`, `setInstanceState(instance.id, storedState(...))`), the opener's state to the layout's `instance.state` (premise 14). No record board exists today. The look on landing.
18. No New project, no counts, not listed. Run: `case 18/19/20 registry view track_record: null` (no record view today); `case 18 offersNewProject(rule taking lead only): true` (see "The cases the brief's rules get wrong", 1).
19. A `boards:` row keyed `track_record`. Run: `case 19 pageBoards(boards: { track_record }): {"views":["track_record"],"findings":[]}`: today the board is registered and no finding is given.
20. Two pushes. Run: `case 20 after a push holding track_record: "track_record"`; `case 20 after a push without it: null`.
21. A role no board takes. Run: `case 21/22 rows: [{"id":"career:role:lead","plain":false},{"id":"career:role:ghost","plain":true},{"id":"career:funding","plain":false}]`: the role `ghost` is a plain row that opens nothing.
22. Funding obtained. Run: `case 21/22 targets: {"career:role:lead":{"kind":"view","view":"projects"},"career:funding":{"kind":"view","view":"funding"}}`.
23. Career, Command center, Tasks headings. Read: `grep -rn "FoldHead" src` gives `CareerPanel.svelte:46,196`, `CommandCenterView.svelte:18,200`, `Tasks.svelte:18,87`, `Projects.svelte:53,75,380`. The look on landing.
24. Two hubs naming `journal`. Run: `case 24 unionWords: [{"key":"journal","label":"Journals"},{"key":"journal","label":"Journal papers","ribbon":true}]` (two rows today).
25. A list naming `journal` twice and a row with key `''`. Run: `case 25 findings: [... venue_categories.0 must be a text, ... venue_categories.1 must be a text, ... venue_categories.2 must be a text]`; `case 25 vocabKeys: ["journal","journal",""]`.
26. No `self`. Run: `case 26 trackRecord with no self: null`; `case 26 projects of a rule taking lead, with no self: 115` (see "The cases the brief's rules get wrong", 1).
27. A record tab with no `id`. No record view exists today (`case 18/19/20 registry view track_record: null`). The look on landing.
28. A `collections:` entry keyed `track_record`. Run: `case 28 collection view track_record registered: "track_record"` (today the collection view is registered under that id); `case28.case.ts`: no finding for `debug` or `track_record`, `findings.collections.view_id` for `venues` only (see "The cases the brief's rules get wrong", 2).
29. Settings on `venue_categories`. Run: `case 29 options entry: [["catalogs/vocab.yml",{"help":"The categories a venue's category takes, in the order the Venues view offers them. A hub's list replaces oculus's whole.","control":"list","default":["journal","conference","thesis","meeting"],"section":"Vocabulary","heading":"boards"}]]`; the write of four rows through `writeConfigValue` into my own copy of the scratch hub's settings: `case 29 write outcome: {"changed":[],"refused":[{"field":"catalogs/vocab.yml:venue_categories","reason":"venue_categories.0 must be a text"}]}`; read back: `case 29 read back venue_categories: ["journal","conference","thesis","meeting"]`, `case 29 read back findings naming venue_categories: []`.

The two tests the step changes, run on the unchanged tree:

- `npx vitest run tests/data/sources/config/layers/hub-vocab.test.ts -t "replaces the lists whose order is their meaning whole" --reporter=verbose`: `replaces the lists whose order is their meaning whole 205ms`, `Tests  1 passed | 15 skipped (16)`. The row passes with the bare word.
- `npx vitest run tests/state/boards/board/board-rules.test.ts -t "New project on a board" --reporter=verbose`: 17 rows of the describe pass, `Tests  17 passed | 84 skipped (101)`. The record board's row cannot run on the base: no record preset exists (`case 14 record-board functions of presets.ts: []`).

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| First run of every case on the unchanged tree | DONE | `npx vitest run --config <scratch>/o81-cases/caserun.config.mts --disableConsoleIntercept`: `Test Files  1 passed (1)`; `case28.case.ts`: `Test Files  1 passed (1)` |
| Items 1 to 9 | NOT DONE | stopped before any change for the cases above; `git status --short` in the worktree printed nothing before this report was written |
| Verify checks 1 to 11 | NOT DONE | not run: no change was made |

## Files

No file of the tree is changed. Written in the worktree: this report only. Written under the scratchpad (`/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o81-cases/`):

- `caserun.config.mts`: the vitest config of the case-run programs (the worktree's vite config with one node project whose files are this folder's `*.case.ts`).
- `before.case.ts`, `case28.case.ts`: the case-run programs.
- `before.out`, `case28.out`: their output, by shell redirect.
- `hub-vocab-before.out`, `board-rules-before.out`: the output of the two test runs above, by shell redirect.
- `hub29/`: case 29's own copy of the scratch hub's `.oculus/config.yml` and `.oculus/data/` (no `local.yml` in it: `find ... -name local.yml | wc -l` printed 0), made with `cp`; the write into it was refused, so nothing was written there; the folder is removed (`rm -rf`) and is not there now.

## The case-run programs

### `caserun.config.mts`

```ts
// Case-run config of O81: the worktree's own vite config with its three test projects replaced by
// one node project whose only files are the case-run files of this folder. Each case prints and
// asserts nothing, so requireAssertions is off.
import base from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/vite.config.ts';

const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81';
const S =
    '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o81-cases';

type Made = Record<string, unknown> & { test: Record<string, unknown> };

export default async (env: { mode: string; command: string }) => {
    const made = (await (base as unknown as (one: unknown) => Promise<Made> | Made)(env)) as Made;
    const { projects: _projects, ...test } = made.test;
    return {
        ...made,
        root: W,
        test: {
            ...test,
            name: 'caserun',
            environment: 'node',
            testTimeout: 120000,
            expect: { requireAssertions: false },
            include: [`${S}/*.case.ts`]
        }
    };
};
```

### `before.case.ts`

The file is at the path above, unchanged since its run; its cases, in order: the fold calls of cases 2 to 5 (`focus.foldOpen`, `focus.foldToggled`, the exports of `focus.ts` matching `/fold|group/i`); case 7 over the scratch hub built by `buildOneHub(HUB, portfolioConfigFrom(loadConfig(engineDir(), { hub: HUB, workspace: { file, text: 'folders: []\nsettings:\n  self: axel-faes\n' } }).config))`, the workspace given as text so no workspace file is read; case 8 over three synthetic venues; cases 9, 10, 11 and 25 through `withHub` of `layers-fixture.ts` with `findingLines`, the merged value and `vocabKeys`; case 12 over `parseVenuesState`; case 13 over `choicesFor({ field: 'category', type: 'select', from: 'vocab.venue_categories' }, null, OCULUS, '')`; cases 14 and 15 over `trackRecord` and `selfIds` of that snapshot; case 18 over `offersNewProject` of the Projects preset's rule with `roles: ['lead']` and every other field null, user `me`; cases 19, 20 and 28 over `createClientState`, `registerAll`, `registerCollections`, `pageBoards` and `registerBoards`; cases 21 and 22 over `careerRows` with `boardOf: (role) => career.roleBoard(OCULUS, role, () => true)` and the roles `lead` and `ghost`; case 24 over `unionWords`; case 26 over the scratch hub built with `folders: []` and no `self`, `trackRecord` and `boardItems` with the rule of case 18; case 29 over `catalogOf(OCULUS)` and `writeConfigValue(ENGINE, 'catalogs/vocab.yml', 'venue_categories', <four rows>, <value in force>, { hub: <hub29> })`, then `loadLayers` to read back. The full text:

```ts
// Case-run of O81's cases on the unchanged tree, run from the scratchpad over the worktree by
// absolute paths: prints each case's result, asserts nothing, writes nothing.
import { it } from 'vitest';
import type {
    Project,
    Snapshot,
    Venue
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/model/index.ts';
import { portfolioConfigFrom } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/index.ts';
import {
    engineDir,
    loadConfig,
    textCatalog,
    unplacedGroup
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/sources/config.ts';
import { catalogOf } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/sources/config/catalog/options.ts';
import { unionWords, vocabKeys } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/shapes/vocab-keys.ts';
import { collectionViews } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/snapshot/normalise.ts';
import * as focus from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/boards/focus.ts';
import * as career from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/boards/career.ts';
import * as presets from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/boards/board/presets.ts';
import { boardItems, takeContextOf } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/boards/board/items.ts';
import { offersNewProject } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/boards/board/new-project.ts';
import { selfIds } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/boards/board/team.ts';
import * as venues from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/sources/registries/venues.ts';
import { choicesFor } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/forms/schema.ts';
import { setCatalog } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/shared/words/text.ts';
import { setVocab, vocabOf } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/state/shared/words/tones.ts';
import { careerRows } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/views/boards/focus/career/career-rows.ts';
import {
    pageBoards,
    registerAll,
    registerBoards,
    registerCollections
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/routes/views.ts';
import { createClientState } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/tests/fixtures/client.ts';
import { fixtureProject } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/tests/fixtures/entities-fixture.ts';
import { writeConfigValue } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/server/edit/writes/config/config-value.ts';
import { loadLayers } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/server/edit/writes/config/config-place.ts';
import { buildOneHub } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/tests/fixtures/hubs/hub-build.ts';
import {
    findingLines,
    withHub
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/tests/data/sources/config/layers/layers-fixture.ts';

const HUB =
    '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o81-hub';
/** Case 29's own copy of the scratch hub's settings, the one place the run writes. */
const HUB29 =
    '/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o81-cases/hub29';
const ENGINE = engineDir();
const OCULUS = loadConfig(ENGINE).config;
setCatalog(textCatalog(OCULUS));
setVocab({ primary: null, lists: {}, order: [], own: OCULUS });

const say = (name: string, value: unknown): void => console.log(`${name}: ${JSON.stringify(value)}`);

/** The scratch hub read with its workspace's `self`, given as text so no workspace file is read. */
function scratchHub(self: boolean): { config: Record<string, unknown>; snapshot: Snapshot } {
    const read = loadConfig(ENGINE, {
        hub: HUB,
        workspace: {
            file: `${HUB}/.oculus/workspaces/research-hub.yml`,
            text: self ? 'folders: []\nsettings:\n  self: axel-faes\n' : 'folders: []\n'
        }
    });
    const snapshot = buildOneHub(HUB, portfolioConfigFrom(read.config)).snapshot;
    return { config: read.config, snapshot };
}

function venue(id: string, category: string | undefined): Venue {
    return { id, name: id, themes: [], ...(category === undefined ? {} : { category }) } as Venue;
}

it('O81 first run', () => {
    // Cases 2 to 5: the Focus folds.
    const saved = { closed: ['cluster:now'] };
    for (const key of ['career', 'command', 'tasks', 'cluster:now', 'cluster:parked', 'band']) {
        say(`case 2/3 foldOpen(${JSON.stringify(saved)}, ${key})`, focus.foldOpen(saved, key as never));
    }
    say('case 2 foldToggled({}, cluster:now)', focus.foldToggled({}, 'cluster:now' as never));
    say('case 3 foldToggled({}, band)', focus.foldToggled({}, 'band' as never));
    const old = { closed: ['career'] };
    for (const key of ['career', 'command', 'tasks', 'cluster:now', 'lane:idea', 'band']) {
        say(`case 4 foldOpen(${JSON.stringify(old)}, ${key})`, focus.foldOpen(old, key as never));
    }
    say(
        'case 5 exports of focus.ts naming a fold',
        Object.keys(focus).filter((name) => /fold|group/i.test(name))
    );

    // Case 7: the scratch hub's venues by the section function.
    const withSelf = scratchHub(true);
    const hubVenues = Object.values(withSelf.snapshot.entities.venues);
    const counts: Record<string, number> = {};
    for (const one of hubVenues) counts[one.category ?? '(none)'] = (counts[one.category ?? '(none)'] ?? 0) + 1;
    say('case 7 hub venues by category', counts);
    const split = venues.venuesByCategory(hubVenues);
    say('case 7 venuesByCategory', { journals: split.journals.length, conferences: split.conferences.length });
    say('case 7 hub venue_categories', withSelf.config.venue_categories);

    // Case 8: a workshop venue and one with no category.
    const odd = [venue('j1', 'journal'), venue('w1', 'workshop'), venue('n1', undefined)];
    const oddSplit = venues.venuesByCategory(odd);
    say('case 8 venuesByCategory', {
        journals: oddSplit.journals.map((one) => one.id),
        conferences: oddSplit.conferences.map((one) => one.id)
    });

    // Cases 9, 10, 11, 25: a hub's venue_categories through the merge.
    const hubs: [string, string][] = [
        ['case 9', 'venue_categories: [ { key: conference, label: Conferences, ribbon: true }, { key: journal, label: Journals } ]'],
        ['case 10', 'venue_categories: [journal]'],
        ['case 11 no label', 'venue_categories: [ { key: journal } ]'],
        ['case 11 ribbon yes', 'venue_categories: [ { key: journal, label: Journals, ribbon: yes } ]'],
        ['case 25', "venue_categories: [ { key: journal, label: Journals }, { key: journal, label: Again }, { key: '', label: Empty } ]"]
    ];
    for (const [name, text] of hubs) {
        const read = withHub(`${text}\n`);
        say(`${name} findings`, findingLines(read.findings));
        say(`${name} config.venue_categories`, read.config.venue_categories);
        say(`${name} vocabKeys`, vocabKeys(read.config.venue_categories));
    }

    // Case 12: a saved Venues state.
    say('case 12 parseVenuesState({ journalsOpen: false })', venues.parseVenuesState({ journalsOpen: false }));
    say('case 12 parseVenuesState({ folded: [thesis] })', venues.parseVenuesState({ folded: ['thesis'] }));

    // Case 13: the venue form's category options.
    const field = { field: 'category', type: 'select', from: 'vocab.venue_categories' } as never;
    say('case 13 choicesFor', choicesFor(field, null, OCULUS, ''));

    // Cases 14, 15: the track record on the scratch hub.
    const record = career.trackRecord(withSelf.snapshot, withSelf.config);
    say('case 14 self ids', [...selfIds(withSelf.snapshot)]);
    say('case 14 trackRecord', record);
    say('case 14 record-board functions of presets.ts', Object.keys(presets).filter((name) => /record/i.test(name)));
    const sample = Object.values(withSelf.snapshot.entities.projects).find((one) => one.stage === 'nascent' && one.lead.length > 0);
    say('case 15 a nascent project of the hub', sample === undefined ? null : { id: sample.id, stage: sample.stage, lead: sample.lead });

    // Case 18: G124's rule over a rule that takes the role lead and nothing else.
    const rolePreset = presets.presetFor('projects', OCULUS, () => OCULUS);
    const leadOnly = { ...rolePreset.rule, tiers: null, roles: ['lead'], stages: null, chips: null, forms: null, hub: null, match: null };
    const context = takeContextOf(rolePreset, new Set(['me']));
    say('case 18 offersNewProject(rule taking lead only)', offersNewProject(leadOnly, context));

    // Cases 19, 20, 28: the registry.
    const client = createClientState();
    registerAll(client.registry);
    const collections = collectionViews(OCULUS, unplacedGroup(OCULUS));
    registerCollections(client.registry, collections);
    say('case 18/19/20 registry view track_record', client.registry.viewFor('track_record') ?? null);
    const source = { boards: { track_record: { label: 'views.board_glyph', role: 'lead' } }, group: 'projects', file: 'layout.yml' };
    const taken = pageBoards(source, textCatalog(OCULUS), collections);
    say('case 19 pageBoards(boards: { track_record })', { views: taken.views.map((one) => one.id), findings: taken.findings });
    registerBoards(client.registry, taken);
    say('case 20 after a push holding track_record', client.registry.viewFor('track_record')?.id ?? null);
    registerBoards(client.registry, pageBoards({ ...source, boards: { projects: { role: 'lead' } } }, textCatalog(OCULUS), collections));
    say('case 20 after a push without it', client.registry.viewFor('track_record')?.id ?? null);
    const withCollection = collectionViews(
        { ...OCULUS, collections: [...((OCULUS.collections as unknown[]) ?? []), { key: 'track_record', file: 'x.yml', label: 'X' }] },
        unplacedGroup(OCULUS)
    );
    const second = createClientState();
    registerAll(second.registry);
    registerCollections(second.registry, withCollection);
    say('case 28 collection view track_record registered', second.registry.viewFor('track_record')?.id ?? null);

    // Cases 21, 22: the career rows.
    const base = { title: 'c', situation: [], order: [], sections: {} };
    const rows = careerRows({
        career: base,
        now: Date.parse('2026-10-26'),
        record: {
            roles: [
                { key: 'lead', label: 'Lead', lines: [{ key: 'in-review', label: 'in review', count: 1 }] },
                { key: 'ghost', label: 'Ghost', lines: [{ key: 'in-review', label: 'in review', count: 1 }] }
            ],
            funding: 2
        },
        editable: false,
        boardOf: (role) => career.roleBoard(OCULUS, role, () => true),
        funding: 'funding'
    });
    say('case 21/22 targets', rows.targets);
    say('case 21/22 rows', rows.groups.flatMap((group) => group.rows.map((row) => ({ id: row.id, plain: row.plain ?? false }))));

    // Case 24: the union of two hubs naming journal.
    const union = unionWords([
        { venue_categories: [{ key: 'journal', label: 'Journals' }] },
        { venue_categories: [{ key: 'journal', label: 'Journal papers', ribbon: true }] }
    ]);
    say('case 24 unionWords', union.venue_categories);

    // Case 26: no self.
    const noSelf = scratchHub(false);
    say('case 26 trackRecord with no self', career.trackRecord(noSelf.snapshot, noSelf.config));
    say('case 26 projects of a rule taking lead, with no self', boardItems(noSelf.snapshot, { ...rolePreset, rule: leadOnly }, () => 'none').length);

    // Case 29: the options catalog over the key.
    const entries = catalogOf(OCULUS);
    const found = Object.entries(entries).flatMap(([file, keys]) =>
        Object.hasOwn(keys, 'venue_categories') ? [[file, keys.venue_categories]] : []
    );
    say('case 29 options entry', found);
    const rowsValue = [
        { key: 'journal', label: 'Journals' },
        { key: 'conference', label: 'Conferences', ribbon: true },
        { key: 'thesis', label: 'Theses' },
        { key: 'meeting', label: 'Meetings' }
    ];
    const layers = { hub: HUB29 };
    const before = loadLayers(ENGINE, layers).config.venue_categories;
    const outcome = writeConfigValue(ENGINE, 'catalogs/vocab.yml', 'venue_categories', rowsValue, before, layers);
    say('case 29 write outcome', { changed: outcome.changed, refused: outcome.refused });
    const back = loadLayers(ENGINE, layers);
    say('case 29 read back venue_categories', back.config.venue_categories);
    say('case 29 read back findings naming venue_categories', findingLines(back.findings).filter((one) => one.includes('venue_categories')));

    // Case 28: what a `collections:` entry keyed with a module view's id gives.
    const debug = withHub('collections:\n  - { key: debug, file: notes/x.yml }\n');
    say('case 28 findings of a collections entry keyed debug', findingLines(debug.findings));
    void ({} as Project);
});
```

What it printed (`before.out`, the `case` lines and the summary; the program's last case 28 line reads the merge's findings only, which do not hold the reader of `view_id`, so case 28 rests on `case28.case.ts`):

```
case 2/3 foldOpen({"closed":["cluster:now"]}, career): true
case 2/3 foldOpen({"closed":["cluster:now"]}, command): true
case 2/3 foldOpen({"closed":["cluster:now"]}, tasks): true
case 2/3 foldOpen({"closed":["cluster:now"]}, cluster:now): false
case 2/3 foldOpen({"closed":["cluster:now"]}, cluster:parked): true
case 2/3 foldOpen({"closed":["cluster:now"]}, band): true
case 2 foldToggled({}, cluster:now): {"closed":["cluster:now"]}
case 3 foldToggled({}, band): {"closed":["band"]}
case 4 foldOpen({"closed":["career"]}, career): false
case 4 foldOpen({"closed":["career"]}, command): true
case 4 foldOpen({"closed":["career"]}, tasks): true
case 4 foldOpen({"closed":["career"]}, cluster:now): true
case 4 foldOpen({"closed":["career"]}, lane:idea): true
case 4 foldOpen({"closed":["career"]}, band): true
case 5 exports of focus.ts naming a fold: ["foldOpen","foldToggled"]
case 7 hub venues by category: {"conference":27,"journal":46,"thesis":2,"meeting":1}
case 7 venuesByCategory: {"journals":46,"conferences":27}
case 7 hub venue_categories: ["journal","conference","thesis","meeting"]
case 8 venuesByCategory: {"journals":["j1"],"conferences":[]}
case 9 findings: ["/scratch/lab/.oculus/config.yml | venue_categories.0 | venue_categories.0 must be a text","/scratch/lab/.oculus/config.yml | venue_categories.1 | venue_categories.1 must be a text"]
case 9 config.venue_categories: [{"key":"conference","label":"Conferences","ribbon":true},{"key":"journal","label":"Journals"}]
case 9 vocabKeys: ["conference","journal"]
case 10 findings: []
case 10 config.venue_categories: ["journal"]
case 10 vocabKeys: ["journal"]
case 11 no label findings: ["/scratch/lab/.oculus/config.yml | venue_categories.0 | venue_categories.0 must be a text"]
case 11 no label config.venue_categories: [{"key":"journal"}]
case 11 no label vocabKeys: ["journal"]
case 11 ribbon yes findings: ["/scratch/lab/.oculus/config.yml | venue_categories.0 | venue_categories.0 must be a text"]
case 11 ribbon yes config.venue_categories: [{"key":"journal","label":"Journals","ribbon":"yes"}]
case 11 ribbon yes vocabKeys: ["journal"]
case 25 findings: ["/scratch/lab/.oculus/config.yml | venue_categories.0 | venue_categories.0 must be a text","/scratch/lab/.oculus/config.yml | venue_categories.1 | venue_categories.1 must be a text","/scratch/lab/.oculus/config.yml | venue_categories.2 | venue_categories.2 must be a text"]
case 25 config.venue_categories: [{"key":"journal","label":"Journals"},{"key":"journal","label":"Again"},{"key":"","label":"Empty"}]
case 25 vocabKeys: ["journal","journal",""]
case 12 parseVenuesState({ journalsOpen: false }): {"search":"","off":[],"journalsOpen":false,"conferencesOpen":true}
case 12 parseVenuesState({ folded: [thesis] }): {"search":"","off":[],"journalsOpen":true,"conferencesOpen":true}
case 13 choicesFor: [{"id":"journal","label":"journal"},{"id":"conference","label":"conference"},{"id":"thesis","label":"thesis"},{"id":"meeting","label":"meeting"}]
case 14 self ids: ["axel-faes"]
case 14 trackRecord: (quoted whole under case 14 above)
case 14 record-board functions of presets.ts: []
case 15 a nascent project of the hub: {"id":"asthma-geo-tensor","stage":"nascent","lead":["axel-faes"]}
case 18 offersNewProject(rule taking lead only): true
case 18/19/20 registry view track_record: null
case 19 pageBoards(boards: { track_record }): {"views":["track_record"],"findings":[]}
case 20 after a push holding track_record: "track_record"
case 20 after a push without it: null
case 28 collection view track_record registered: "track_record"
case 21/22 targets: {"career:role:lead":{"kind":"view","view":"projects"},"career:funding":{"kind":"view","view":"funding"}}
case 21/22 rows: [{"id":"career:role:lead","plain":false},{"id":"career:role:ghost","plain":true},{"id":"career:funding","plain":false}]
case 24 unionWords: [{"key":"journal","label":"Journals"},{"key":"journal","label":"Journal papers","ribbon":true}]
case 26 trackRecord with no self: null
case 26 projects of a rule taking lead, with no self: 115
case 29 options entry: [["catalogs/vocab.yml",{"help":"The categories a venue's category takes, in the order the Venues view offers them. A hub's list replaces oculus's whole.","control":"list","default":["journal","conference","thesis","meeting"],"section":"Vocabulary","heading":"boards"}]]
case 29 write outcome: {"changed":[],"refused":[{"field":"catalogs/vocab.yml:venue_categories","reason":"venue_categories.0 must be a text"}]}
case 29 read back venue_categories: ["journal","conference","thesis","meeting"]
case 29 read back findings naming venue_categories: []
case 28 findings of a collections entry keyed debug: []
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

### `case28.case.ts`

```ts
// Case-run of O81's case 28 on the unchanged tree: the findings of a `collections:` list
// (collectionListFindings, the reader of findings.collections.view_id) holding an entry keyed with
// the id of a module's view (`debug`, Debug.svelte's) and, beside it, one keyed with a registry's
// view (`venues`). Prints, asserts nothing, writes nothing.
import { it } from 'vitest';
import {
    engineDir,
    loadConfig,
    textCatalog
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/sources/config.ts';
import {
    collectionListFindings,
    listWords
} from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/src/lib/data/sources/collections.ts';
import { findingLines } from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O81/tests/data/sources/config/layers/layers-fixture.ts';

it('O81 case 28 first run', () => {
    const config = loadConfig(engineDir()).config;
    for (const key of ['debug', 'track_record', 'venues']) {
        const list = [{ key, file: 'notes/x.yml' }];
        const found = collectionListFindings(list, listWords(config), 'config.yml', textCatalog(config));
        console.log(`case 28 collectionListFindings of an entry keyed ${key}: ${JSON.stringify(findingLines(found))}`);
    }
});
```

What it printed (`case28.out`):

```
case 28 collectionListFindings of an entry keyed debug: []
case 28 collectionListFindings of an entry keyed track_record: []
case 28 collectionListFindings of an entry keyed venues: ["config.yml | collections[0].key | the key venues is the id of one of oculus's own views; the collection gets no card-list view"]
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

Both programs ran with `npx vitest run --config <scratch>/o81-cases/caserun.config.mts --disableConsoleIntercept [<file>]` from the worktree's root, `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH`.

## Runs of the verify list and whole-suite commands

The verify list (`npm run diagrams && npm run test:quick`) ran 0 times, since no change was made. No whole-suite command ran (`npm test`, `npm run test:checks`, `npm run test:landing`, `npm run test:slow`, or `npx vitest run` with no file named: none). Test files run: `tests/data/sources/config/layers/hub-vocab.test.ts` (one row) and `tests/state/boards/board/board-rules.test.ts` (the describe 'New project on a board'), once each, on the unchanged tree.

## What resumes the step

A ruling on 1 (cases 18 and 26: the record take inside `BoardRule`, with `takes.ts` added to the write list, or another mechanism) and on 2 (case 28: a new finding, its words and the paths it takes, or no finding), and, with item 4, on 3 (the venue form's option words). With those, the build runs items 1 to 9 against all 29 cases.
