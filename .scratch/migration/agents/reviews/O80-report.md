NOT done: none of the step is built. The step is handed back before any code change, because case 17 asks for a finding the brief's rules cannot give: `boardsFindings` (data layer) is to report a board key equal to a view id a module registers, and the data and server layers have no source of those ids. Every case's first run on the unchanged tree is below. No file outside this report changed (`git status --short` in the worktree prints nothing besides this file).

## Open items of the state file, verbatim

- 415 (2026-10-26, O79's /spec, ruling 398; kind 3, since option (b) replaces the name ruling 398 gives): ruling 398 has a reference show the target's field flagged `label: true`. `label:` is already a key of a schema field, the words drawn over it: `SchemaField.label?: string` (`src/lib/data/model/model-collections.ts:101`), written as text in `config/schemas/manifest-schema.yml` (every field, e.g. `venue: { label: "Venue", ... }`) and in the hub's schemas (`venues.yml:14` `label: "Venue name"`, `:16` `label: "Short name"`, `leads.yml:55` `label: "Title"`). The field a venue reference would show is `short`, which carries `label: "Short name"`, so it cannot hold both. (a) the words of a field move from `label:` to a new key `heading:`, written once in every file that has them (oculus's schemas and options description, `docs/templates.md`, the hub's data files), and `label: true` is the flag as ruled. Pros: ruling 398's name stands and each key has one meaning. Cons: a second rename across every schema in the same step, touching each `manifest-schema.yml` field. (b) the flag is named `display: true` and `label:` keeps the words. Pros: no rename; the flag is new and has no users. Cons: replaces the name ruling 398 gives. (c) `label:` takes either words or `true`. Cons: the shown field loses its words ("Short name" drawn as "short"), and one key has two meanings a finding cannot tell apart. Recommended (b), a judgment: it costs one new key against a rename of a key in every schema, and the ruled behaviour is unchanged. (c) is the lazy option.
- 416 (2026-10-26, O79's /spec, ruling 398; kind 6, the options are not ranked by a written rule): ruling 398 shows the target's one flagged field. Today a venue choice shows `short`, else `name`, and a project choice `short`, else `title` (`src/lib/state/forms/schema.ts:298`, `:303`). In the hub, 47 of the 76 venues have no `short` and 20 of the 114 projects have none (`python3` over `venues.yml`; `grep -q '^short:'` over every `project.yml`). One flag cannot say "short, else the full name". (a) one flagged field per target, set on the field every entry fills (venues `name`, projects `title`). Pros: one flag as ruled, never empty. Cons: pickers and chips show full names where they show short ones today ("IEEE Trans. Medical Imaging (TMI)" for TMI, a project's whole title in a Related chip). (b) the flag carries a rank (`display: 1` on `short`, `display: 2` on `name`; with 415 (a), `label: 1` and `label: 2`): the first filled field by rank is shown. Pros: every choice reads as it does today, any number of fallbacks, no position in a list carries meaning. Cons: the flag is a number, not `true`. (c) one flagged field, and an entry whose flagged field is empty shown by its primary key. Cons: 47 venues shown by an id such as `patternrec` or `tbme`. Recommended (b), a judgment: it keeps today's choices readable for every entry. (c) is the lazy option.
- 423 (2026-10-26, O80's brief check, `agents/reviews/O80-brief-check.md` check 1; kind 6, the options are not ranked by a written rule; no step of the plan names it, so O80 is built without it). Two board readers give the order of `boards:` a meaning. A project page draws the card of "the first board of `boards` that takes it", and of the first board when none does (`boardItemOf`, `src/lib/state/client/selectors.svelte.ts:482-503`); the card's sections come from that board, and a project is on every board whose keys it meets (G124). A role's row of the track record opens "the first key of the merged `boards:` whose `role` holds the role" (`roleBoard`, `src/lib/state/boards/career.ts:108-121`). Reordering the boards in Settings changes which card a project page draws and which board a role opens. (a) A `boards:` entry flag `project_page: true`, set on oculus's Projects board, names the board whose card the project page draws; none or two flagged is a finding; and two boards holding one role is a finding, the row then opening none. Pros: one written choice, the order means only the drawing order. Cons: every project page draws the one board's sections, so a Software project's page shows the research board's sections. (b) The project page draws the card of the board of the project's own tier and the user's role on it, that is, the board whose `tier:` and `role:` both match; a project two such boards take, or none, is a finding and its page draws the fallback card of no board's sections; the role rule as in (a). Pros: each project's page matches the board it belongs to. Cons: more rules, and a project matching two boards gets a finding where today it opens silently. (c) The order kept as the rule and written in `layout.yml`'s comment as the board that wins. Cons: a position in a list carries the meaning, which the step line of O80 ends for every other board reader. (c) is the lazy option.

## The case handed back: case 17

- The case: "A `boards:` key `focus` (a view a module registers): a finding naming the board; no second Focus view. Tests, 'boardsFindings' and 'the board views'."
- The rule of the brief: item 1, "A board key equal to a view id a module registers or to a collection key is a finding naming the board, and that board is not registered", with the test in `tests/data/sources/config/boards.test.ts` 'boardsFindings' (G116).
- The rules of the code it meets:
  - The view ids a module registers exist only in the routes layer: `grep -rn "import.meta.glob" src` prints `src/routes/views.ts:58` (`viewModules = import.meta.glob('$lib/views/**/*.svelte', { eager: true })`) and three theme or editor globs, nothing in `src/lib/data` or `src/lib/server`.
  - `boardsFindings` is in `src/lib/data/sources/config/sections/boards.ts` and runs from `READER_FINDINGS` (`src/lib/data/sources/config/sections/findings.ts:47`), which the server runs (`src/lib/server/root/process/context/findings.ts:24`, `src/lib/server/edit/writes/config/config-checks.ts:76`). The boundary table allows `data: ['data/**']` and `server: ['server/**', 'data/**']` (`tests/checks/tree/boundaries.test.ts:346-347`), so neither may import `src/routes` or `src/lib/views`.
  - The settings editor's `views` source is filled on the page from the registry (`src/lib/state/system/config/editors/sources.ts:57-58`, "The ids of the views the registry holds", and `:172-173`), which is the one place the code lists module view ids, and it is client state.
  - The data layer knows only the registry view ids (`REGISTRY_VIEWS`, `src/lib/data/helpers/hub-names.ts:130-137`: data, venues, pillars, domains, leads, radar), which back the existing collection finding `findings.collections.view_id` (`config/text/findings.yml:21`). `focus` is not among them.
  - The conventions of the brief forbid writing a view id in code ("No config word, hub key or view id is written in code"), so a list of oculus's own view ids in the data layer is ruled out.
  - The client's config payload carries no `from` map (`ConfigPayload`, `src/lib/data/model/index.ts:267-277`), so a finding made on the page cannot name the file the `boards:` value came from (the workspace file or `config/defaults/layout.yml`), and the page has no source of config findings of its own (`allFindings`, `src/lib/state/workbench/navigation/status.ts:413-419`, joins the snapshot's, the config payload's and the apps' findings).
- The result on the unchanged tree (`findings-cases.mjs` below): "case 17, a board keyed focus: (no new finding)"; "case 17 (collection key), a board keyed venues: (no new finding)".
- What can be built under the rules: the board left out of the registration when its key is a module view id (in `src/routes/views.ts`, as `registerCollections` leaves out such a collection key at `:93-101`), and a finding in `boardsFindings` for a board key equal to a `collections:` key or to a registry view id of `REGISTRY_VIEWS`, both of which the data layer reads. The finding for a module view id is the part with no source.
- Options for the ruling:
  - (a) The finding is given for a board key equal to a collection key or a registry view id, and a board keyed as a module view id is left out of the registration with no finding, as a collection keyed `debug` or `files` is today (`src/routes/views.ts:85-86`). Pros: no new mechanism; boards and collections follow one rule. Cons: a board keyed `focus` disappears with nothing in the Findings view saying why. This is the lazy option: it drops the finding the case asks for.
  - (b) The page makes the finding: the board-views function is handed the module view ids (the routes layer has them) and returns a finding for each clash, the config payload gains the `from` map so the finding names the right file, and `allFindings` takes the page's config findings as a fourth source. Pros: the case as written, and the same finding for a collection keyed as a module view id becomes possible. Cons: a wire-format change (a new field on the config payload) and a new kind of finding source, both user-visible shapes no ruling names; the test of the finding moves from 'boardsFindings' (G116) to 'the board views' (G124).
  - (c) The module view ids are written into config (for example a list beside `arrangements:`), which `boardsFindings` reads. Cons: a second list of the views to keep in step with the modules by hand; a module added without its row gives no finding.
  - Recommended (b), a judgment: it is the one that gives the reader the finding the case describes, at the cost of one payload field. (a) is the lazy option.

## The cases' first run, on the unchanged tree

Each program is quoted in full in "The case-run programs" below. The tests of item 10 are not written yet, so their failing lines are not quoted; that waits for the ruling on case 17.

1. `node case1.mjs` (output `case1-before.txt`, quoted in full below). The six boards come from `Projects.svelte` (`projects` 1 to `software` 6, group `projects`), labels Projects, Supervision, Coauthor, Archive, Personal, Software, glyphs focus, teaching, author, archived, spark, code; cards 7, 10, 10, 3, 0, 3; rail counts 4, 4, 4, 0, 0, 0, all in `#16a34a`; pane titles the same words as the labels. Clusters: now (glyph now, "Now: do these", not muted, run, push, revise), parked (no glyph, "Parked / on hold", muted, review, blocked, backburner), incubate (glyph idea, "Incubation: idea to project", muted, scope, derisk, build), idea (glyph idea, heading Idea, muted, full width). Awaiting box: one venue (Journal of Machine Learning Research, 1), blocked 1, one application. Sections: CareerPanel > CommandCenter > Tasks > QuickAdd > said > awaiting > Band > Empty > Lanes. Lane moves from `exploring` and from `in-prep` onto each of the ten lanes as printed. New idea stage `nascent`; New project offered on every board except archive, tier research on projects, supervision, coauthor and archive, personal and software on theirs; a write naming no tier writes `research`. Task status `todo`, application status `not-applied`, lead status `open`, decline `declined`, apply `applied`, `dismissed` held back by the declined toggle `true`, project deadlines category `paper`. Glyphs: cross-links active, published, idea; ticker overdue, followup, pin. Category colours in-review `#0ea5e9`, in-flight `#16a34a` (rail), idea `#7c5cff`, publications `#db2777`, other-outputs `#9333ea`, released `#0d9488`, dead-ends `#9ca3af`.
2. Read and run. `Projects.svelte` registers the six ids it names (case 1 output, first block); a `boards:` entry `theses` with `label:` and `glyph:` gives no seventh view and two findings: `findings-cases.mjs`, "case 2/3, a seventh board theses with label and glyph: <oculus>/config/defaults/layout.yml [boards.theses.label] boards.theses.label is not a field a board takes; it is not read" and the same for `glyph`.
3. `findings-cases.mjs`: "case 3, the board projects with no label (oculus has no label anywhere): (no new finding)". The pane title is `lookup(\`views.${preset.id}\`)` (`Projects.svelte:224`).
4. `findings-cases.mjs`: project_boards on no entry, true on Projects and Registries, and `yes` on Projects: each "(no new finding)".
5. `findings-cases.mjs`: "<hub>/later/.oculus/config.yml [focus_clusters] key focus_clusters is not one the hub's settings file takes; it is not applied"; "lanes read: run:now, wait:later, far:nowhere, bare:; drawn clusters: now=[run] parked=[] incubate=[] idea=[]". The lanes `wait`, `far` and `bare` are read and drawn by no cluster, with no finding. The options catalog's `cluster` field is the fixed choice `options: [now, parked, incubate, idea]` (`config/options/catalogs/vocab.yml:157-160`), so Settings does not offer `later`.
6. `findings-cases.mjs`: "<hub>/grid/.oculus/config.yml [focus_clusters] key focus_clusters is not one the hub's settings file takes; it is not applied".
7. `findings-cases.mjs`: "[tiers.research.default] key tiers.research.default is not a key this file takes" and the same for `tiers.personal.default`. `case1.mjs`: "write naming no tier: written tier=research refused=[]".
8. `misc-cases.mjs`: "coauthor tier ["research","personal"]: offered=true tier the form writes=research"; "coauthor tier ["personal","software"]: offered=true tier the form writes=personal".
9. `misc-cases.mjs`: `hubsTaking(['lab','other'], 'hub')` gives ["lab","other"], and the Add's hub field starts on `hubs[0].id` (`entry-add.ts:83`), so `lab` is chosen; with the primary holding it ["hub","lab"]; one non-primary hub ["lab"]. `NewIdeaForm.svelte:72` takes `hubs.at(0)`. `writtenFile` of a `new-entry` and of a `literature-save` naming no hub, two hubs, no primary: {"root":"lab",...}, the first hub, and no refusal.
10. `misc-cases.mjs`: "at exploring onto push: {"stage":"in-prep"}"; "at in-prep onto push: null". `findings-cases.mjs`: `move_writes` is "not a key this file takes".
11. `findings-cases.mjs`: both rows give only "key focus_lanes.1.move_writes is not a key this file takes".
12. `findings-cases.mjs`: `default_task` on todo and doing, and `lead_applied` on applied and closed: "(no new finding)". `misc-cases.mjs`: the task is written with `"status":"todo"`; the apply control writes `applied`.
13. `findings-cases.mjs`: a category row with no `color` (publications): "(no new finding)".
14. `findings-cases.mjs`: `rail_color` "#2563eb" and `rail_color: 3`: each "key rail_color is not one the hub's settings file takes; it is not applied". `misc-cases.mjs`: "rail_color "#2563eb", rail count colour: #16a34a".
15. `misc-cases.mjs`: "Focus.svelte reads the config focus.sections: false"; the `focus:` keys of the merged config are stale_lag_days, refresh_stale_days, deadline_horizon_days, leads_horizon_days, conf_horizon_months, venue_conc_warn, linkedin_cadence_days, applications_open, education_open, applications_sent. The sections are drawn in the markup order case 1 prints.
16. `OCULUS_TEST_HUB=$HOME/workspace/research-hub npx vitest run tests/checks/config/config-folder.test.ts`: "Test Files 1 passed (1)", "Tests 30 passed (30)". With `--reporter=verbose` the real hub's rows ran: "names a group of its own and a path under the hub for every document of the real hub 169ms" and "matches the real hub's own files to a schema each, read with no finding 846ms".
17. The case handed back, above. `findings-cases.mjs`: "(no new finding)" for a board keyed `focus` and for one keyed `venues`.
18. Read. The Settings boards editor offers the board key as a fixed choice, `control: choice`, `options: [projects, supervision, coauthor, archive, personal, software]` (`config/options/layout.yml:128-131`), so a Settings save cannot add `theses`; the views are registered from `Projects.svelte` alone, so no save adds one.

## DONE / NOT DONE

| Row | State | Proof |
| --- | --- | --- |
| First run of every case on the unchanged tree | DONE | the section above |
| Items 1 to 10 of "What to build" | NOT DONE | handed back on case 17; `git status --short` prints only this report |
| Tests of item 10, their failing and passing runs | NOT DONE | not written |
| Verify checks 1 to 6, 8 and 9 | NOT DONE | run after the change, which is not made |

## Files with line counts

No source, config, doc or test file changed; `diff -rq` against the base copy is not run because nothing outside this report was written (`git status --short` prints nothing else).

## Judgment calls left open by the brief, found before the change

These are not hand-backs; they are settled by the rules and listed so the brief can name the paths when it is revised.

- `src/lib/state/boards/board/` holds 10 items (`ls src/lib/state/boards/board/ | wc -l` prints 10), so the new module of item 1 does not fit there without a split of the folder. The plan is to put the board-views function in `presets.ts`, which already reads `boards:`, or to split the folder by concern if the function does not belong there.
- "the form's Add stays off until one is picked" needs the Prompt primitive to refuse a yes while a choice field is empty: `src/lib/ui/forms/Prompt.svelte` draws the yes button with no disabled state and `src/lib/ui/forms/prompt.ts` has no such flag. Both are outside the write list and the change needs them.
- The refusal "asking which hub" for a write naming no hub is the server's: `homeOf` and `homeOfLiterature` in `src/lib/server/edit/writes/hubs.ts:188-222` fall back to the first hub; `write-files.ts` only names the file for the unsaved-tab check. The server file is outside the write list and the change needs it, with its rows in `tests/server/edit/hub-writes.test.ts` and `tests/state/forms/new-entry.test.ts:111`.
- Case 18 needs the boards `key` field of `config/options/layout.yml:128-131` to stop being a fixed choice of six; the plan is a text control.

## Host- or user-visible changes for the look on landing

None: nothing is built.

## Anything in the brief that was wrong or impossible

Case 17's finding for a module view id, with the evidence in "The case handed back" above.

## The case-run programs

All live in the scratchpad folder `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o80`, run with `PATH=$HOME/.nvm/versions/node/v24.21.0/bin:$PATH node <file>`; they are removed before this report is handed back. `case1.mjs` writes new manifests only into a copy of the demo hub under `$TMPDIR`, removed at its end.

### shim.mjs (the Svelte runes as plain values, so a `.svelte.ts` store imports under Node)

```js
const id = (v) => v;
globalThis.$state = Object.assign(id, { raw: id, snapshot: id });
globalThis.$derived = Object.assign(id, { by: (f) => f() });
globalThis.$effect = Object.assign(() => {}, { pre: () => {}, root: (f) => f() });
```

### snap.mjs (the demo hub's first build, as tests/data/hubs/hubs-fixture.ts `watchedOnce` makes it)

```js
import './shim.mjs';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O80/';
const { engineDir, loadConfig } = await import(W + 'src/lib/data/sources/config.ts');
const { Hub } = await import(W + 'src/lib/server/core/channels.ts');
const { watchPortfolio } = await import(W + 'src/lib/server/root/watch/portfolio/portfolio.ts');
const { writeState } = await import(W + 'src/lib/server/files/workspace/state.ts');
const { openWorkspace } = await import(W + 'src/lib/server/files/workspace/open.ts');
export async function demoSnapshot() {
    const base = mkdtempSync(join(process.env.TMPDIR, 'o80-case-'));
    const hub = join(base, 'hub');
    cpSync(join(W, 'tests/fixtures/hubs/demo'), hub, { recursive: true });
    const state = join(base, 'state');
    writeState(state, { open: null, recent: [], unsaved: { folders: [{ name: 'hub', path: hub }], primary: 'hub' } });
    const workspace = { stateFolder: state, open: () => openWorkspace(state), subscribe: () => () => {}, changed: () => {}, close: () => {} };
    const channels = new Hub();
    const watcher = watchPortfolio(channels, { engine: engineDir(), icons: { set: {} }, host: { name: 'test', address: '127.0.0.1' }, open: () => workspace.open(), settings: (dir) => loadConfig(engineDir(), { hub: dir }), defaults: () => loadConfig(engineDir()), problems: () => [] }, { debounce: 20 });
    watcher.close();
    const snapshot = channels.latest('portfolio')?.payload;
    const config = loadConfig(engineDir(), { hub });
    return { snapshot, config, hub, cleanup: () => rmSync(base, { recursive: true, force: true }) };
}
if (process.argv[2] === 'probe') { const s = await demoSnapshot(); console.log(Object.keys(s.snapshot ?? {}), Object.keys(s.snapshot?.entities?.projects ?? {}).length, Object.keys(s.config)); s.cleanup(); }
```

### case1.mjs

```js
// Case 1 of O80: oculus's own config over a copy of the demo fixture hub. Prints each fact the case
// names. Run: node case1.mjs (from this folder, Node 24). Reads the worktree; writes only into a
// copy of the demo hub under $TMPDIR, removed at the end.
import './shim.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { demoSnapshot } from './snap.mjs';
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O80/';
const src = (p) => W + 'src/lib/' + p;
const { textCatalog } = await import(src('data/sources/config.ts'));
const { portfolioConfigFrom } = await import(src('data/index.ts'));
const text = await import(src('state/shared/words/text.ts'));
const focus = await import(src('state/boards/focus.ts'));
const presets = await import(src('state/boards/board/presets.ts'));
const { boardItems, takeContextOf } = await import(src('state/boards/board/items.ts'));
const { offersNewProject } = await import(src('state/boards/board/new-project.ts'));
const { selfIds } = await import(src('state/boards/board/team.ts'));
const { personNames } = await import(src('state/boards/person.ts'));
const { categoriesOf, railCount } = await import(src('data/shapes/boards/categories.ts'));
const leads = await import(src('data/accounts/leads.ts'));
const { applicationFromLead } = await import(src('state/feeds/lead-application.ts'));
const { addTask } = await import(src('state/forms/new-entry.ts'));
const { tickerCategories } = await import(src('state/boards/ticker.ts'));
const { flaggedCollections } = await import(src('data/helpers/hub-names.ts'));
const { createIdea } = await import(src('server/edit/writes/manifest.ts'));
const ticker = await import(src('state/boards/board/ticker-lines.ts'));

const { snapshot, config: loaded, hub, cleanup } = await demoSnapshot();
const config = loaded.config;
text.setCatalog(textCatalog(config));
const say = (...a) => console.log(...a);
const vocab = () => config;

say('== boards (registrations read from Projects.svelte)');
const projectsSource = readFileSync(W + 'src/lib/views/boards/projects/Projects.svelte', 'utf8');
const regs = [...projectsSource.matchAll(/boardRegistration\('([a-z-]+)', (\d+)\)/g)].map((m) => [m[1], Number(m[2])]);
const group = /group: '([a-z]+)'/.exec(projectsSource)?.[1];
for (const [id, order] of regs) {
    const preset = presets.presetFor(id, config, vocab);
    const items = boardItems(snapshot, preset);
    const rail = railCount(items.map((one) => one.project), preset.categories, preset.config, (h) => preset.words(h).config);
    say(`${id}: label=${text.t(`views.${id}`)} glyph=${text.t(`views.${id}_glyph`)} order=${order} group=${group} cards=${items.length} rail=${rail.count} colour=${rail.color} title=${text.lookup(`views.${id}`)}`);
}
const railEntry = config.rail.find((one) => one.page === 'projects');
say('rail entry projects:', JSON.stringify(railEntry));

say('== Focus clusters (as Lanes.svelte draws them)');
const board = focus.lanes(config);
const items = focus.laneItems(Object.values(snapshot.entities.projects), board, config);
for (const cluster of focus.CLUSTERS) {
    const head = cluster === 'now' ? [text.t('focus.now_glyph'), text.t('focus.cluster_now')] : cluster === 'parked' ? ['', text.t('focus.cluster_parked')] : [text.t('focus.ideas_glyph'), text.t('focus.cluster_incubate')];
    say(`${cluster}: glyph=${head[0] || '(none)'} heading=${head[1]} muted=${cluster !== 'now'} layout=columns lanes=${focus.lanesIn(board, cluster).map((l) => l.key).join(',')}`);
}
for (const lane of focus.lanesIn(board, focus.IDEA)) {
    say(`idea: glyph=${text.t('focus.ideas_glyph')} heading=${lane.label} muted=true layout=full_width lane=${lane.key} order=${(items[lane.key] ?? []).map((p) => p.title).join(' | ')}`);
}
for (const lane of board) say(`  lane ${lane.key}: ${(items[lane.key] ?? []).map((p) => `${p.title}@${p.deadline ?? ''}`).join(' | ')}`);

say('== awaiting box');
const wait = focus.waiting(snapshot, config, personNames(snapshot));
say(JSON.stringify(wait));

say('== Focus sections (markup order of Focus.svelte)');
const focusSource = readFileSync(W + 'src/lib/views/boards/focus/Focus.svelte', 'utf8').split('</script>').at(-1);
const marks = [...focusSource.matchAll(/<(CareerPanel|CommandCenter|Tasks|QuickAdd|Band|Empty|Lanes)\b|\{#if said !== ''\}|class="waitroll"/g)].map((m) => m[1] ?? (m[0].includes('said') ? 'said' : 'awaiting'));
say(marks.join(' > '));

say('== lane moves');
const base = Object.values(snapshot.entities.projects)[0];
for (const stage of ['exploring', 'in-prep']) {
    const project = { ...base, stage, chips: [] };
    for (const lane of board) {
        say(`from ${stage} onto ${lane.key}: movable=${focus.hubMovable(project, lane, vocab)} writes=${JSON.stringify(focus.hubMoveOnto(project, lane, vocab))}`);
    }
}

say('== new records');
// The demo hub names no folder for new projects; the case gives one per tier inside its scan folders.
const portfolio = { ...portfolioConfigFrom(config, loaded.from), newProjectDir: { research: 'projects/ideas', personal: 'projects/ideas', software: 'projects/software' } };
for (const [id] of regs) {
    const preset = presets.presetFor(id, config, vocab);
    const offered = offersNewProject(preset.rule, takeContextOf(preset, selfIds(snapshot)));
    const tier = preset.rule.tiers?.at(0);
    const fields = { id: `case-${id}`, title: `Case ${id}`, eli5: 'x', ...(tier === undefined ? {} : { tier }) };
    const out = createIdea(hub, portfolio, fields);
    const file = out.changed.find((one) => one.endsWith('project.yml'));
    const path = file === undefined ? undefined : file.startsWith('/') ? file : join(hub, file);
    const manifest = path !== undefined && existsSync(path) ? readFileSync(path, 'utf8') : '';
    say(`New project on ${id}: offered=${offered} form tier=${tier} written tier=${/tier: (.*)/.exec(manifest)?.[1]} stage=${/stage: (.*)/.exec(manifest)?.[1]} refused=${JSON.stringify(out.refused)}`);
}
const untiered = createIdea(hub, portfolio, { id: 'case-untiered', title: 'Case untiered', eli5: 'x' });
const untieredFile = untiered.changed.find((one) => one.endsWith('project.yml'));
const untieredText = untieredFile === undefined ? '' : readFileSync(untieredFile.startsWith('/') ? untieredFile : join(hub, untieredFile), 'utf8');
say(`write naming no tier: written tier=${/tier: (.*)/.exec(untieredText)?.[1]} refused=${JSON.stringify(untiered.refused)}`);
const tasks = flaggedCollections(snapshot.entities.collections, 'tasks');
let taskFields = null;
await addTask('Case task', tasks, 'hub', config, async (_c, fields) => { taskFields = fields; return { ok: true, refused: [], id: 'x' }; });
say('new task status:', taskFields?.status);
say('new application status:', applicationFromLead({ title: 'Lead', status: 'open' }, config).status);
say('new lead status (openWord):', leads.openWord(config));
say('decline writes:', leads.declinedWord(config), '| apply writes:', leads.appliedWord(config));
say('dismissed held back by the declined toggle:', leads.isLeadDeclined(config, 'dismissed'));
say('project deadlines category:', tickerCategories(config).find((one) => one.manifests)?.key);

say('== glyphs');
const cross = readFileSync(W + 'src/lib/views/shared/links/CrossLinks.svelte', 'utf8');
say('cross-links:', [...cross.matchAll(/return '([a-z]+)';/g)].map((m) => m[1]).join(','));
say('ticker:', JSON.stringify(ticker.GLYPHS));

say('== categories');
for (const one of categoriesOf(config)) say(`${one.key}: ${one.color}${one.rail ? ' (rail)' : ''}`);
cleanup();
```

Output (`case1-before.txt`):

```
== boards (registrations read from Projects.svelte)
projects: label=Projects glyph=focus order=1 group=projects cards=7 rail=4 colour=#16a34a title=Projects
supervision: label=Supervision glyph=teaching order=2 group=projects cards=10 rail=4 colour=#16a34a title=Supervision
coauthor: label=Coauthor glyph=author order=3 group=projects cards=10 rail=4 colour=#16a34a title=Coauthor
archive: label=Archive glyph=archived order=4 group=projects cards=3 rail=0 colour=#16a34a title=Archive
personal: label=Personal glyph=spark order=5 group=projects cards=0 rail=0 colour=#16a34a title=Personal
software: label=Software glyph=code order=6 group=projects cards=3 rail=0 colour=#16a34a title=Software
rail entry projects: {"label":"Projects","glyph":"paper","page":"projects","chord":"p","group_glyph":"paper"}
== Focus clusters (as Lanes.svelte draws them)
now: glyph=now heading=Now: do these muted=false layout=columns lanes=run,push,revise
parked: glyph=(none) heading=Parked / on hold muted=true layout=columns lanes=review,blocked,backburner
incubate: glyph=idea heading=Incubation: idea to project muted=true layout=columns lanes=scope,derisk,build
idea: glyph=idea heading=Idea muted=true layout=full_width lane=idea order=Sketched tensor decompositions for streaming data
  lane run: 
  lane push: Transfer learning across graph domains@2026-09-10 | Bandit algorithms over evolving graphs@
  lane revise: Low-rank streaming anomaly detection@2026-08-15
  lane review: Robust representation learning under distribution shift@
  lane blocked: Sparse attention with learned routing@
  lane backburner: 
  lane scope: Drift-aware clustering for non-stationary streams@
  lane derisk: 
  lane build: 
  lane idea: Sketched tensor decompositions for streaming data@
== awaiting box
{"people":[],"venues":[{"label":"Journal of Machine Learning Research","count":1}],"blocked":1,"grants":[],"applications":["Assistant Professor, ML"]}
== Focus sections (markup order of Focus.svelte)
CareerPanel > CommandCenter > Tasks > QuickAdd > said > awaiting > Band > Empty > Lanes
== lane moves
from exploring onto run: movable=true writes=null
from exploring onto push: movable=true writes={"stage":"in-prep"}
from exploring onto revise: movable=true writes={"stage":"revision"}
from exploring onto review: movable=true writes={"stage":"submitted"}
from exploring onto blocked: movable=true writes={"status.chips":["blocked"]}
from exploring onto backburner: movable=true writes={"status.chips":["parked"]}
from exploring onto scope: movable=true writes={"stage":"scoping"}
from exploring onto derisk: movable=true writes={"stage":"de-risking"}
from exploring onto build: movable=true writes={"stage":"building"}
from exploring onto idea: movable=true writes={"stage":"nascent"}
from in-prep onto run: movable=true writes={"stage":"exploring"}
from in-prep onto push: movable=true writes=null
from in-prep onto revise: movable=true writes={"stage":"revision"}
from in-prep onto review: movable=true writes={"stage":"submitted"}
from in-prep onto blocked: movable=true writes={"status.chips":["blocked"]}
from in-prep onto backburner: movable=true writes={"status.chips":["parked"]}
from in-prep onto scope: movable=true writes={"stage":"scoping"}
from in-prep onto derisk: movable=true writes={"stage":"de-risking"}
from in-prep onto build: movable=true writes={"stage":"building"}
from in-prep onto idea: movable=true writes={"stage":"nascent"}
== new records
New project on projects: offered=true form tier=research written tier=research stage=nascent refused=[]
New project on supervision: offered=true form tier=research written tier=research stage=nascent refused=[]
New project on coauthor: offered=true form tier=research written tier=research stage=nascent refused=[]
New project on archive: offered=false form tier=research written tier=research stage=nascent refused=[]
New project on personal: offered=true form tier=personal written tier=personal stage=nascent refused=[]
New project on software: offered=true form tier=software written tier=software stage=nascent refused=[]
write naming no tier: written tier=research refused=[]
new task status: todo
new application status: not-applied
new lead status (openWord): open
decline writes: declined | apply writes: applied
dismissed held back by the declined toggle: true
project deadlines category: paper
== glyphs
cross-links: active,published,idea
ticker: {"overdue":"overdue","followup":"followup","subtask":"pin"}
== categories
in-review: #0ea5e9
in-flight: #16a34a (rail)
idea: #7c5cff
publications: #db2777
other-outputs: #9333ea
released: #0d9488
dead-ends: #9ca3af
```

The "lane run" and "lane backburner" lines end in a space in the output, as printed.

### findings-cases.mjs

```js
// The config findings of the O80 cases 3 to 7, 11 to 14 and 17: each case's config, through
// loadConfig (a hub's .oculus/config.yml in a temporary folder for a hub key) or through the readers
// of READER_FINDINGS over oculus's merged config with the case's value laid on it (a layout key), and
// the findings it gives that oculus's own config does not. Run: node findings-cases.mjs.
import './shim.mjs';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O80/src/lib/';
const { engineDir, loadConfig } = await import(W + 'data/sources/config.ts');
const { READER_FINDINGS } = await import(W + 'data/sources/config/sections/findings.ts');
const engine = engineDir();
const base = loadConfig(engine);
const readers = (where, config) => READER_FINDINGS.flatMap((find) => find(where, config));
const known = new Set([...base.findings, ...readers({ engine, hub: null, from: base.from }, base.config)].map((f) => f.message));
const fresh = (list) => list.filter((f) => !known.has(f.message)).map((f) => `  ${f.file.replace(engine, '<oculus>').replace(/.*o80-hub-[^/]+/, '<hub>')} [${f.key}] ${f.message}`);
const temp = mkdtempSync(join(process.env.TMPDIR, 'o80-hub-'));

/** The new findings of a hub whose .oculus/config.yml is `yaml`, and the merged config. */
function hubCase(name, yaml) {
    const hub = join(temp, name);
    mkdirSync(join(hub, '.oculus'), { recursive: true });
    writeFileSync(join(hub, '.oculus', 'config.yml'), yaml);
    const loaded = loadConfig(engine, { hub });
    const found = fresh([...loaded.findings, ...readers({ engine, hub, from: loaded.from }, loaded.config)]);
    return { found, config: loaded.config };
}

/** The new findings of oculus's merged config with `change` laid on it. */
function layoutCase(change) {
    const config = { ...structuredClone(base.config), ...change(structuredClone(base.config)) };
    return { found: fresh(readers({ engine, hub: null, from: base.from }, config)), config };
}

function show(label, result) {
    console.log(`${label}:`);
    console.log(result.found.length === 0 ? '  (no new finding)' : result.found.join('\n'));
}

const boards = (c) => c.boards;
show('case 3, the board projects with no label (oculus has no label anywhere)', layoutCase((c) => ({ boards: { ...boards(c), projects: { ...boards(c).projects } } })));
show('case 2/3, a seventh board theses with label and glyph', layoutCase((c) => ({ boards: { ...boards(c), theses: { tier: 'research', label: 'views.projects', glyph: 'views.projects_glyph' } } })));
show('case 17, a board keyed focus', layoutCase((c) => ({ boards: { ...boards(c), focus: { tier: 'research' } } })));
show('case 17 (collection key), a board keyed venues', layoutCase((c) => ({ boards: { ...boards(c), venues: { tier: 'research' } } })));
const rail = (c, flag) => c.rail.map((one, at) => (flag(one, at) ? { ...one, project_boards: flag(one, at) } : one));
show('case 4, project_boards on no entry (oculus as it is)', layoutCase(() => ({})));
show('case 4, project_boards true on Projects and Registries', layoutCase((c) => ({ rail: rail(c, (one) => (one.page === 'projects' || one.page === 'registries' ? true : undefined)) })));
show('case 4, project_boards: yes on Projects', layoutCase((c) => ({ rail: rail(c, (one) => (one.page === 'projects' ? 'yes' : undefined)) })));
const lanes = (extra) => `focus_lanes:\n  - { key: run, label: Run, icon: live, sub: x, color: "#16a34a", cluster: now, stages: [exploring] }\n${extra}`;
const later = hubCase('later', `focus_clusters:\n  - { key: now, label: focus.cluster_now, glyph: focus.now_glyph, muted: false, layout: columns, awaiting: true }\n  - { key: later, label: focus.cluster_parked, muted: true, layout: columns }\n${lanes('  - { key: wait, label: Wait, icon: live, sub: x, color: "#16a34a", cluster: later, stages: [submitted] }\n  - { key: far, label: Far, icon: live, sub: x, color: "#16a34a", cluster: nowhere, stages: [scoping] }\n  - { key: bare, label: Bare, icon: live, sub: x, color: "#16a34a", stages: [building] }\n')}`);
show('case 5, focus_clusters with later, lanes naming later, nowhere and none', later);
const { lanes: readLanes, lanesIn, CLUSTERS } = await import(W + 'state/boards/focus.ts');
const drawn = readLanes(later.config);
console.log(`  lanes read: ${drawn.map((l) => `${l.key}:${l.cluster}`).join(', ')}; drawn clusters: ${[...CLUSTERS, 'idea'].map((c) => `${c}=[${lanesIn(drawn, c).map((l) => l.key)}]`).join(' ')}`);
show('case 6, a focus_clusters row with layout: grid', hubCase('grid', 'focus_clusters:\n  - { key: now, label: focus.cluster_now, muted: false, layout: grid }\n'));
show('case 7, two tiers with default: true', hubCase('tiers', 'tiers:\n  research: { label: Research, unmarked: true, default: true }\n  personal: { label: Personal, default: true }\n'));
show('case 10, the push lane with move_writes submit-ready', hubCase('push', lanes('  - { key: push, label: Push, icon: draft, sub: x, color: "#2563eb", cluster: now, stages: [in-prep, submit-ready], move_writes: { stage: submit-ready } }\n')));
show('case 11, stages [scoping] with move_writes stage building', hubCase('wrong-stage', lanes('  - { key: scope, label: Scope, icon: compass, sub: x, color: "#0e7490", cluster: incubate, stages: [scoping], move_writes: { stage: building } }\n')));
show('case 11, stages [scoping] with move_writes chip blocked', hubCase('wrong-kind', lanes('  - { key: scope, label: Scope, icon: compass, sub: x, color: "#0e7490", cluster: incubate, stages: [scoping], move_writes: { chip: blocked } }\n')));
show('case 12, default_task on todo (oculus) and doing (hub)', hubCase('tasks', 'statuses:\n  doing: { color: "#16a34a", default_task: true }\n'));
show('case 12, lead_applied on applied (oculus) and closed (hub)', hubCase('applied', 'lead_statuses:\n  closed: { lead_closed: true, lead_applied: true }\n'));
show('case 13, a category row with no color', layoutCase((c) => ({ categories: c.categories.map((row) => (row.key === 'publications' ? { ...row, color: undefined } : row)) })));
show('case 14, a hub setting rail_color "#2563eb"', hubCase('rail-blue', 'rail_color: "#2563eb"\n'));
show('case 14, a hub setting rail_color: 3', hubCase('rail-three', 'rail_color: 3\n'));
rmSync(temp, { recursive: true, force: true });
```

Output (`findings-before.txt`):

```
case 3, the board projects with no label (oculus has no label anywhere):
  (no new finding)
case 2/3, a seventh board theses with label and glyph:
  <oculus>/config/defaults/layout.yml [boards.theses.label] boards.theses.label is not a field a board takes; it is not read
  <oculus>/config/defaults/layout.yml [boards.theses.glyph] boards.theses.glyph is not a field a board takes; it is not read
case 17, a board keyed focus:
  (no new finding)
case 17 (collection key), a board keyed venues:
  (no new finding)
case 4, project_boards on no entry (oculus as it is):
  (no new finding)
case 4, project_boards true on Projects and Registries:
  (no new finding)
case 4, project_boards: yes on Projects:
  (no new finding)
case 5, focus_clusters with later, lanes naming later, nowhere and none:
  <hub>/later/.oculus/config.yml [focus_clusters] key focus_clusters is not one the hub's settings file takes; it is not applied
  lanes read: run:now, wait:later, far:nowhere, bare:; drawn clusters: now=[run] parked=[] incubate=[] idea=[]
case 6, a focus_clusters row with layout: grid:
  <hub>/grid/.oculus/config.yml [focus_clusters] key focus_clusters is not one the hub's settings file takes; it is not applied
case 7, two tiers with default: true:
  <hub>/tiers/.oculus/config.yml [tiers.research.default] key tiers.research.default is not a key this file takes
  <hub>/tiers/.oculus/config.yml [tiers.personal.default] key tiers.personal.default is not a key this file takes
case 10, the push lane with move_writes submit-ready:
  <hub>/push/.oculus/config.yml [focus_lanes.1.move_writes] key focus_lanes.1.move_writes is not a key this file takes
case 11, stages [scoping] with move_writes stage building:
  <hub>/wrong-stage/.oculus/config.yml [focus_lanes.1.move_writes] key focus_lanes.1.move_writes is not a key this file takes
case 11, stages [scoping] with move_writes chip blocked:
  <hub>/wrong-kind/.oculus/config.yml [focus_lanes.1.move_writes] key focus_lanes.1.move_writes is not a key this file takes
case 12, default_task on todo (oculus) and doing (hub):
  (no new finding)
case 12, lead_applied on applied (oculus) and closed (hub):
  (no new finding)
case 13, a category row with no color:
  (no new finding)
case 14, a hub setting rail_color "#2563eb":
  <hub>/rail-blue/.oculus/config.yml [rail_color] key rail_color is not one the hub's settings file takes; it is not applied
case 14, a hub setting rail_color: 3:
  <hub>/rail-three/.oculus/config.yml [rail_color] key rail_color is not one the hub's settings file takes; it is not applied
```

### misc-cases.mjs

```js
// The O80 cases 8, 9, 10, 12 (the readers), 14 (the rail count) and 15 on the tree as it stands.
// Run: node misc-cases.mjs. Reads the worktree and writes nothing.
import './shim.mjs';
import { readFileSync } from 'node:fs';
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O80/';
const src = (p) => W + 'src/lib/' + p;
const { engineDir, loadConfig, textCatalog } = await import(src('data/sources/config.ts'));
const text = await import(src('state/shared/words/text.ts'));
const presets = await import(src('state/boards/board/presets.ts'));
const { takeContextOf } = await import(src('state/boards/board/items.ts'));
const { offersNewProject } = await import(src('state/boards/board/new-project.ts'));
const focus = await import(src('state/boards/focus.ts'));
const { hubsTaking } = await import(src('state/shared/page/hubs.ts'));
const { writtenFile } = await import(src('state/sessions/source/write-files.ts'));
const { addTask } = await import(src('state/forms/new-entry.ts'));
const leads = await import(src('data/accounts/leads.ts'));
const { categoriesOf, railCount } = await import(src('data/shapes/boards/categories.ts'));
const base = loadConfig(engineDir()).config;
text.setCatalog(textCatalog(base));
const say = (...a) => console.log(...a);

say('== case 8');
for (const tiers of [['research', 'personal'], ['personal', 'software']]) {
    const config = { ...base, boards: { ...base.boards, coauthor: { ...base.boards.coauthor, tier: tiers } } };
    const preset = presets.presetFor('coauthor', config);
    const offered = offersNewProject(preset.rule, takeContextOf(preset, new Set()));
    say(`coauthor tier ${JSON.stringify(tiers)}: offered=${offered} tier the form writes=${preset.rule.tiers?.at(0)}`);
}

say('== case 9');
say('two hubs, primary hub holds none of them (lab, other hold it):', JSON.stringify(hubsTaking(['lab', 'other'], 'hub')));
say('two hubs, primary holds it:', JSON.stringify(hubsTaking(['lab', 'hub'], 'hub')));
say('one hub, not the primary:', JSON.stringify(hubsTaking(['lab'], 'hub')));
const formSource = readFileSync(W + 'src/lib/views/shared/forms/NewIdeaForm.svelte', 'utf8');
say('NewIdeaForm hub:', /const hub = \$derived\((.*)\);/.exec(formSource)?.[1]);
const addSource = readFileSync(W + 'src/lib/views/shared/forms/entry/entry-add.ts', 'utf8');
say('entry-add hubAsk value:', /const value = (.*);/.exec(addSource)?.[1]);
const look = { primary: () => null, hubs: () => ['lab', 'other'], workspaceFile: () => null, projectManifest: () => null, collectionFile: (hub, name) => ({ root: hub, path: `${name}.yml` }), registryKey: () => 'literature', feeds: () => null, changeFile: () => null, unsavedUnknown: () => false };
say('write-files new-entry, no root, two hubs, no primary:', JSON.stringify(writtenFile({ kind: 'new-entry', collection: 'tasks' }, base, look)));
say('write-files literature-save, no root, two hubs, no primary:', JSON.stringify(writtenFile({ kind: 'literature-save' }, base, look)));

say('== case 10');
const pushLanes = base.focus_lanes.map((lane) => (lane.key === 'push' ? { ...lane, move_writes: { stage: 'submit-ready' } } : lane));
const pushed = { ...base, focus_lanes: pushLanes };
const lane = focus.lanes(pushed).find((one) => one.key === 'push');
for (const stage of ['exploring', 'in-prep']) {
    const project = { id: 'hub/x', root: 'hub', title: 'x', stage, chips: [], waitingOn: [] };
    say(`at ${stage} onto push: ${JSON.stringify(focus.hubMoveOnto(project, lane, () => pushed))}`);
}

say('== case 12');
const twoTasks = { ...base, statuses: { ...base.statuses, doing: { ...base.statuses.doing, default_task: true } } };
let fields = null;
const tasks = [{ id: 'hub/tasks', root: 'hub', key: 'tasks', tasks: true, schema: [{ field: 'key', type: 'text' }, { field: 'title', type: 'text' }], entries: [] }];
const answer = await addTask('A task', tasks, 'hub', twoTasks, async (_c, made) => { fields = made; return { ok: true, refused: [], id: 'hub/tasks/a-task' }; });
say('default_task on todo and doing, the task written with:', JSON.stringify(fields), JSON.stringify(answer.said));
const twoApplied = { ...base, lead_statuses: { ...base.lead_statuses, closed: { lead_closed: true, lead_applied: true } } };
say('lead_applied on applied and closed, the apply control writes:', leads.appliedWord(twoApplied));

say('== case 14');
const blue = { ...base, rail_color: '#2563eb' };
say('rail_color "#2563eb", rail count colour:', railCount([], categoriesOf(blue), blue).color);

say('== case 15');
say('Focus.svelte reads the config focus.sections:', /focus\??\.sections|\.focus\b.*sections/.test(readFileSync(W + 'src/lib/views/boards/focus/Focus.svelte', 'utf8')));
say('behavior.yml focus keys:', Object.keys(base.focus ?? {}).join(', '));
```

Output (`misc-before.txt`):

```
== case 8
coauthor tier ["research","personal"]: offered=true tier the form writes=research
coauthor tier ["personal","software"]: offered=true tier the form writes=personal
== case 9
two hubs, primary hub holds none of them (lab, other hold it): ["lab","other"]
two hubs, primary holds it: ["hub","lab"]
one hub, not the primary: ["lab"]
NewIdeaForm hub: picked === '' ? (hubs.at(0) ?? '') : picked
entry-add hubAsk value: hubs.some((one) => one.id === chosen) ? (chosen ?? '') : hubs[0].id
write-files new-entry, no root, two hubs, no primary: {"root":"lab","path":"tasks.yml"}
write-files literature-save, no root, two hubs, no primary: {"root":"lab","path":"literature.yml"}
== case 10
at exploring onto push: {"stage":"in-prep"}
at in-prep onto push: null
== case 12
default_task on todo and doing, the task written with: {"key":"a-task","title":"A task","status":"todo"} ""
lead_applied on applied and closed, the apply control writes: applied
== case 14
rail_color "#2563eb", rail count colour: #16a34a
== case 15
Focus.svelte reads the config focus.sections: false
behavior.yml focus keys: stale_lag_days, refresh_stale_days, deadline_horizon_days, leads_horizon_days, conf_horizon_months, venue_conc_warn, linkedin_cadence_days, applications_open, education_open, applications_sent
```

## How many times the verify list ran, and whole-suite commands

- The verify list (`npm run diagrams && npm run test:quick`): 0 runs, since no change is made.
- Whole-suite command: one. `npx vitest run --dir <scratchpad>/o80 --project unit`, started to run a case-run file from the scratchpad, ran the unit project's test files of the worktree, on the unchanged tree; it was stopped before it ended and printed no summary. It wrote nothing in the worktree (`git status --short` printed nothing after it).
- Other test runs: `OCULUS_TEST_HUB=$HOME/workspace/research-hub npx vitest run tests/checks/config/config-folder.test.ts`, twice (case 16, once with the dot reporter and once with `--reporter=verbose` for the real-hub row names).
