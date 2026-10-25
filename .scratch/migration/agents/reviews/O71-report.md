# O71 report: the priority removed

Everything in the brief is done, under the round 0 cases ruling (`agents/briefs/O71-cases.md`). Two things are left to landing:
- `docs/HELP.md:517` is not written; its new text is under "Doc text" below.
- G126's sentence in `agents/guarded.md` is the orchestrator's to rewrite.

## Open items of the state file, verbatim

These are quoted from the worktree's copy of `.scratch/migration/orchestrator-state.md`, section "Open items". That copy does not hold open item 342, which the round 0 ruling books (the missing finding for a hub `manifest_fields:` row whose `from` names no list).

- 337 (2026-10-25, O60's builder's report, the breach it records; `agents/spec.md`'s rule that a builder writes no script the brief does not build): O60's builder aaf9969093ea82a29 wrote three helper scripts the brief does not build and no ruling approves, in the session's scratch folder outside the tree: `wrap.py` and `wrap2.py`, which rewrapped the comment paragraphs of the changed files at 100 columns, and `greps.sh`, which runs the brief's four reader greps over a tree and gave the report's counts of 68 reader files on the base and 85 on the worktree. (a) record it, and use nothing they printed as evidence: every rewrapped comment is judged by the reviewers' and the orchestrator's own reading of the diff, and the reader coverage by the reviewer's own greps, as open item 330 ruled for O63. Pros: the step keeps its work and no evidence rests on an unapproved script. Cons: none found. (b) send the rewraps back in the repair round to be redone by hand. Pros: no edit a script made stays. Cons: the same text again, at the cost of a round, when a read already judges each paragraph. Recommended (a); (b) is not the lazy option but costs a round for no change in the text. Left for Axel: `refute`'s Finding dispositions send an unapproved script to the user.
- 340 (2026-10-25, O60's look at landing, item 3 of `agents/briefs/O60.md`): the unknown-stage finding names the closest word of the hub's stages at any distance (`closestWord`, `src/lib/data/shapes/vocab-keys.ts:272`), as a collection entry's status finding does (`src/lib/data/snapshot/validate.ts:234`). Over the look's copy of the hub with `stages: { nascent: null }`, each of the 18 manifests at `nascent` reads 'stage "nascent" is not a word of the stages list; the closest word is failed', which points the reader at a stage that means the opposite. (a) both findings name the closest word only when it is within half the word's length in edits, rounded down, and otherwise end after 'is not a word of the stages list' (or of the statuses). Pros: no hint that misleads. Cons: a word mistyped beyond that distance gets no hint. (b) keep both as built. Pros: no change. Cons: the misleading hint on every word removed or far off. Recommended (a); (b) is the lazy option. Left for Axel: it changes the collection status finding too, which is outside O60's line, so it needs a step, and no step is scheduled without his word.

## The cases: first run, ruling, and run after the change

### How the runs were made

Cases 1, 2, 3, 6, 9, 10 and 11 were run by a case-run program, `cases.case.ts`, with a config file, `vitest.case.mts`. Both sat in the session scratchpad (`/private/tmp/claude-502/.../scratchpad/o71/`), outside the tree, and both were removed before this report.
- The program runs under vitest because `src/lib/state/forms/schema.ts` imports `.svelte.ts` modules. Under plain node the import fails with "ReferenceError: $state is not defined".
- Each case copies `tests/fixtures/hubs/demo` into the scratch folder, then calls `readHub` and `builtHub` of `src/lib/data/index.ts`; `builtHub` calls `runSchemas`.
- Writes go through `writeManifest` (`src/lib/server/edit/writes/manifest.ts:377`).

Command, the same for both runs:

`SCRATCH=<scratch>/o71/run<n> npx vitest run --config <scratch>/o71/vitest.case.mts --project case --reporter=verbose`

Config source:

```
// Scratch config of the O71 case-run program: the worktree's own config, with one project that runs
// the case file in the scratch folder, so the svelte plugin compiles the state modules it imports.
import base from '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O71/vite.config.ts';
export default async (env: { mode: string; command: string }) => {
    const config: any = await (base as any)(env);
    config.test.projects = [
        { extends: true, test: { name: 'case', environment: 'node', dir: '<scratch>/o71', include: ['**/*.case.ts'], globals: true, testTimeout: 120000, expect: { requireAssertions: false } } }
    ];
    return config;
};
```

Program source:

```
// Case-run program of O71: prints the result of cases 1, 2, 3, 6, 9, 10 and 11 over copies of the
// demo fixture in a scratch folder. Writes nothing into the worktree.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
const W = process.env.W ?? '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O71';
const SCRATCH = process.env.SCRATCH!;
it("O71 cases", async () => {
const { portfolioConfigFrom, readHub, builtHub } = await import(W + '/src/lib/data/index.ts');
const { engineDir, loadConfig } = await import(W + '/src/lib/data/sources/config.ts');
const { createChecker } = await import(W + '/src/lib/data/snapshot/schema/check.ts');
const { writeManifest } = await import(W + '/src/lib/server/edit/writes/manifest.ts');
const { formFields, fieldValues } = await import(W + '/src/lib/state/forms/schema.ts');
const { schemaFindings } = await import(W + '/src/lib/data/sources/config/catalog/schema-findings.ts');

const DEMO = join(W, 'tests/fixtures/hubs/demo');
const BANDITS = 'projects/active/graph-bandits/project.yml';
function copy(name: string): string {
    const dir = mkdtempSync(join(SCRATCH, `o71-${name}-`));
    cpSync(DEMO, dir, { recursive: true });
    return dir;
}
function build(hub: string) {
    const read = loadConfig(engineDir(), { hub });
    const config = portfolioConfigFrom(read.config, read.from);
    const r = readHub(hub, config, [], 'demo');
    const out = builtHub(r, { version: 0, checker: createChecker(), engine: null, workspace: null, others: {} });
    return { read, config, snapshot: out.snapshot };
}
const prio = (s: string) => /priorit/i.test(s);
const rel = (hub: string, f: string) => f.replace(hub + '/', '');

// Case 1: the demo hub unchanged.
{
    const hub = copy('c1');
    const { snapshot } = build(hub);
    const ps = Object.values(snapshot.entities.projects) as any[];
    console.log('case 1: projects', ps.length, '| with a priority value', ps.filter((p) => 'priority' in p).length,
        '| findings naming priority', snapshot.findings.filter((f: any) => prio(f.key) || prio(f.message)).length);
}
// Case 2: one manifest writes priority: high.
{
    const hub = copy('c2');
    appendFileSync(join(hub, BANDITS), 'priority: high\n');
    const { snapshot } = build(hub);
    const fs = snapshot.findings.filter((f: any) => prio(f.key) || prio(f.message));
    for (const f of fs) console.log('case 2: finding', rel(hub, f.file), '|', f.key, '|', f.message);
    if (fs.length === 0) console.log('case 2: no finding names priority');
    const p = (Object.values(snapshot.entities.projects) as any[]).find((one) => one.id.endsWith('graph-bandits'));
    console.log('case 2: graph-bandits priority value', JSON.stringify(p?.priority));
}
// Case 2, control: a key the schema does not name, on the same manifest.
{
    const hub = copy('c2c');
    appendFileSync(join(hub, BANDITS), 'no_such_key: high\n');
    const { snapshot } = build(hub);
    for (const f of snapshot.findings.filter((one: any) => /no_such_key/.test(one.key + one.message)))
        console.log('case 2 control: finding', rel(hub, f.file), '|', f.key, '|', f.message);
}
// Case 3: the hub's settings file sets priority_levels.
{
    const hub = copy('c3');
    appendFileSync(join(hub, '.oculus/config.yml'), '\npriority_levels:\n  - { key: urgent, label: Urgent, flames: 4 }\n');
    const read = loadConfig(engineDir(), { hub });
    const fs = read.findings.filter((f: any) => prio(f.key) || prio(f.message));
    for (const f of fs) console.log('case 3: finding', rel(hub, f.file), '|', f.key, '|', f.message);
    if (fs.length === 0) console.log('case 3: no finding names priority_levels');
    console.log('case 3: merged priority_levels', JSON.stringify(read.config.priority_levels));
}
// Case 6: the form's Core fields.
{
    const read = loadConfig(engineDir(), {});
    const core = formFields(read.config).filter((f: any) => f.section === 'Core').map((f: any) => f.field);
    console.log('case 6: Core fields', core.join(','));
}
// Case 9: a write naming priority, with a value and as a clear.
{
    const hub = copy('c9');
    const { config } = build(hub);
    for (const given of [{ priority: 'high' }, { priority: null }]) {
        const before = readFileSync(join(hub, BANDITS), 'utf8');
        const out = writeManifest(hub, config, 'graph-bandits', given);
        const after = readFileSync(join(hub, BANDITS), 'utf8');
        console.log('case 9:', JSON.stringify(given), '| changed', JSON.stringify(out.changed), '| refused', JSON.stringify(out.refused),
            '| file unchanged by this write', after === before, '| file holds a priority line', /^priority:/m.test(after));
    }
}
// Case 10: the form saved over a manifest holding priority: high.
{
    const hub = copy('c10');
    appendFileSync(join(hub, BANDITS), 'priority: high\n');
    const { config, snapshot } = build(hub);
    const p = (Object.values(snapshot.entities.projects) as any[]).find((one) => one.id.endsWith('graph-bandits'));
    console.log('case 10: the form opens with a priority value', 'priority' in fieldValues(p, () => false),
        '| the form draws a priority field', formFields(config.merged).some((f: any) => f.field === 'priority'));
    const out = writeManifest(hub, config, 'graph-bandits', { 'status.line': 'Saved by the form.' });
    const text = readFileSync(join(hub, BANDITS), 'utf8');
    console.log('case 10: save of status.line | changed', JSON.stringify(out.changed), '| refused', JSON.stringify(out.refused),
        '| priority line kept', text.includes('priority: high\n'));
    const { snapshot: again } = build(hub);
    for (const f of again.findings.filter((one: any) => prio(one.key) || prio(one.message)))
        console.log('case 10: finding after the save', rel(hub, f.file), '|', f.key, '|', f.message);
}
// Case 11: a hub's manifest_fields row naming priority, and one with from: vocab.priority_levels.
{
    for (const row of [
        '  - { field: priority, label: Priority, type: text, section: Core, help: "The hub\'s own priority." }',
        '  - { field: urgency, label: Urgency, type: select, from: vocab.priority_levels, section: Core, help: "How urgent." }',
        '  - { field: urgency, label: Urgency, type: select, from: vocab.no_such_list, section: Core, help: "How urgent." }'
    ]) {
        const hub = copy('c11');
        appendFileSync(join(hub, '.oculus/config.yml'), `\nmanifest_fields:\n${row}\n`);
        const read = loadConfig(engineDir(), { hub });
        const fs = read.findings.filter((f: any) => f.key.startsWith('manifest_fields'));
        const name = row.includes('no_such_list') ? 'from vocab.no_such_list' : row.includes('urgency') ? 'from vocab.priority_levels' : 'field priority';
        for (const f of fs) console.log('case 11:', name, '| finding', rel(hub, f.file), '|', f.key, '|', f.message);
        if (fs.length === 0) console.log('case 11:', name, '| no finding');
        const added = formFields(read.config).filter((f: any) => f.field === 'priority' || f.field === 'urgency')
            .map((f: any) => `${f.field}:${f.type}:${JSON.stringify(f.from ?? null)}`);
        console.log('case 11:', name, '| form fields', added.join(' '));
        for (const f of schemaFindings(engineDir(), read.config).filter((one: any) => /urgency|priority/.test(one.key + one.message)))
            console.log('case 11:', name, '| schema-file finding', f.file.replace(W + '/', ''), '|', f.key, '|', f.message);
        const { snapshot } = build(hub);
        for (const f of snapshot.findings.filter((one: any) => /urgency|priority/.test(one.key + one.message)))
            console.log('case 11:', name, '| build finding', rel(hub, f.file), '|', f.key, '|', f.message);
    }
}
});
```

### First run, on the unchanged tree (bc4fce66)

```
case 1: projects 13 | with a priority value 0 | findings naming priority 0
case 2: no finding names priority
case 2: graph-bandits priority value "high"
case 2 control: finding projects/active/graph-bandits/project.yml | no_such_key | key no_such_key is not declared by the schema of this file
case 3: finding .oculus/config.yml | priority_levels | key priority_levels is not one the hub's settings file takes; it is not applied
case 3: merged priority_levels [{"key":"high","label":"High","flames":3},{"key":"med","label":"Med","flames":2},{"key":"low","label":"Low","flames":1}]
case 6: Core fields id,tier,stage,form,short,title,status.chips,status.line,priority,pin,venue,links,tags,year
case 9: {"priority":"high"} | changed ["priority"] | refused [] | file unchanged by this write false | file holds a priority line true
case 9: {"priority":null} | changed ["priority"] | refused [] | file unchanged by this write false | file holds a priority line false
case 10: the form opens with a priority value true | the form draws a priority field true
case 10: save of status.line | changed ["status.line"] | refused [] | priority line kept true
case 11: field priority | finding .oculus/config.yml | manifest_fields.0.field | manifest_fields.0.field names priority, a field oculus's project form already has; the row is left out
case 11: field priority | form fields priority:select:"vocab.priority_levels"
case 11: from vocab.priority_levels | no finding
case 11: from vocab.priority_levels | form fields priority:select:"vocab.priority_levels" urgency:select:"vocab.priority_levels"
case 11: from vocab.no_such_list | no finding
case 11: from vocab.no_such_list | form fields priority:select:"vocab.priority_levels" urgency:select:"vocab.no_such_list"
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

The cases this program does not run were checked on the unchanged tree as follows.

- **Case 1, the card.** Read in `LaneCard.svelte:92-103`: every card draws the flame badge. An unset priority still draws one faint flame: `Lanes.svelte:181-182` gives `Math.max(flamesOf(...), 1)`, and `.flames.unset` sets opacity 0.22.
- **Case 4.** The verify item 2 test files gave "Test Files 7 passed (7)" and "Tests 179 passed | 2 skipped (181)". The 2 skipped are the real-hub cases ("OCULUS_TEST_HUB is not set").
- **Case 5.** Read in `Lanes.svelte:123-144`: `menuFor` lists the movable lanes, then each level of `priorities(config)` with the id `prio:<key>`, then `{ id: 'prio:', label: t('focus.priority_none') }`.
- **Case 7.**
  - The first grep printed 39 lines over 14 files: `docs/HELP.md` 1, `focus.ts` 8, `Lanes.svelte` 9, `LaneCard.svelte` 6, and the rest one to three each.
  - The second grep printed the two `fire` rows: `glyphs.yml:157` and `icons.yml:156`.
  - The third grep printed 73 lines.
- **Case 8.** Read in `LaneCard.svelte`: the badge's `ToolButton` (`:93-102`, accessible name `project.priority ?? t('focus.set_priority')`) comes before the name button (`:113-115`). The badge is a card's first tab stop.

### The case the brief got wrong, and the orchestrator's ruling

- **The case.** Case 11, second half. It expected a row with `from: vocab.priority_levels` to get "the finding a `from` naming no vocab key gives".
- **What the first run shows.**
  - A hub `manifest_fields:` row whose `from` names a list `vocab.yml` does not hold gets no finding: see the `vocab.no_such_list` row above.
  - No finding kind exists for it. `config/text/findings.yml:135-140` has `manifest_field_none`, `_held`, `_repeated`, `_section`, `_type` and `_shape`.
  - The schema-file check does not reach it: `schemaFileProblems` (`src/lib/data/snapshot/schema/static.ts:45-63`) reads `merged.manifest_schema` alone.
  - The build does not report it: `runSchemas` (`src/lib/data/snapshot/schema/run.ts:243-252`) never turns the manifest context's problems into findings.
  - G128 promises none.
- **The rule.** The brief's Cases section: a case the brief's own rules get wrong is handed back before any code changes.
- **The ruling (round 0, `agents/briefs/O71-cases.md`).**
  1. Case 11's second half reads: a row with `from: vocab.priority_levels` is read like every row whose `from` names no vocab list, with no finding, as such a row gets today. The step adds no code for it. The missing finding is booked as open item 342 for Axel.
  2. Case 7's first grep keeps its one hit, `docs/HELP.md:517`, until landing applies the Doc text.

### Run after the change

The same command, after the last change:

```
case 1: projects 13 | with a priority value 0 | findings naming priority 0
case 2: finding projects/active/graph-bandits/project.yml | priority | key priority is not declared by the schema of this file
case 2: graph-bandits priority value undefined
case 2 control: finding projects/active/graph-bandits/project.yml | no_such_key | key no_such_key is not declared by the schema of this file
case 3: finding .oculus/config.yml | priority_levels | key priority_levels is not one the hub's settings file takes; it is not applied
case 3: merged priority_levels undefined
case 6: Core fields id,tier,stage,form,short,title,status.chips,status.line,pin,venue,links,tags,year
case 9: {"priority":"high"} | changed [] | refused [{"field":"priority","reason":"the manifest schema does not name the field"}] | file unchanged by this write true | file holds a priority line false
case 9: {"priority":null} | changed [] | refused [{"field":"priority","reason":"the manifest schema does not name the field"}] | file unchanged by this write true | file holds a priority line false
case 10: the form opens with a priority value false | the form draws a priority field false
case 10: save of status.line | changed ["status.line"] | refused [] | priority line kept true
case 10: finding after the save projects/active/graph-bandits/project.yml | priority | key priority is not declared by the schema of this file
case 11: field priority | no finding
case 11: field priority | form fields priority:text:null
case 11: from vocab.priority_levels | no finding
case 11: from vocab.priority_levels | form fields urgency:select:"vocab.priority_levels"
case 11: from vocab.no_such_list | no finding
case 11: from vocab.no_such_list | form fields urgency:select:"vocab.no_such_list"
 Test Files  1 passed (1)
      Tests  1 passed (1)
```

- The message of case 2 and case 10 is `findings.schema.not_declared` (`config/text/findings.yml:260`: "key {0} is not declared by the schema of this file").
- Case 9's refusal is `server.manifest_write.not_in_schema` (`config/text/server.yml:468`: "the manifest schema does not name the field").
- In case 9, nothing is written, and a clear (`{priority: null}`) is refused too. A manifest holding the line is cleaned in the YAML editor.

## DONE / NOT DONE

| Item | State | Proof (command, output) |
|---|---|---|
| 1. The manifest field goes | DONE | Case-run program: case 6 "Core fields ...,status.line,pin,..."; case 2 "key priority is not declared by the schema of this file" and value `undefined`. |
| 2. `priority_levels` goes; the hub-keys comments state every list | DONE | Case 7 first grep: only `docs/HELP.md:517` (Doc text). `config-folder.test.ts` passes (verify 2 run below). |
| 3. Flames, menu section and click cycle go; head comments state what holds; the name is a card's first tab stop | DONE | Case 7 greps below; svelte-check "0 ERRORS 0 WARNINGS"; read in `LaneCard.svelte`: the name `ToolButton` is the first control in `.card-h`. The look on landing is the proof for what is drawn. |
| 4. The words and the glyph go | DONE | `grep -rn -w "fire" config/catalogs` prints nothing. The first grep has no `fire_glyph`, `set_priority` or `priority_none`. |
| 5. The tests follow | DONE | `git diff tests/`: `normalise.test.ts` loses `priority: 7` and the expected `priority: 'high'`, and keeps the `priority: 'high'` input; `config-folder.test.ts` loses `'priority_levels',`. The verify 2 run passes. |
| 6. The documents follow | DONE | `git diff docs/templates.md docs/data-map.md docs/apps.md`: one line removed from each of the first two, and `` `priority?`, `` dropped from `apps.md:402`. HELP.md is under "Doc text". |
| Cases 1 to 11 | DONE | The two runs above. Cases 5 and 8 by reading, and at the look. |
| Verify 1: `npm run diagrams && npm run test:quick`, once | DONE | Last line "test:quick: 253.2 s; every command passed"; lines quoted below. |
| Verify 2: the seven guarded test files | DONE | Before the change: "Test Files 7 passed (7)", "Tests 179 passed \| 2 skipped (181)". After the change: "Test Files 7 passed (7)", "Tests 179 passed \| 2 skipped (181)". |
| Verify 3: case 7 greps | DONE | Below. |
| Verify 4: `sh utils/unused-exports.sh` against the base | DONE | `diff .agents/worktrees/O71-base/unused-exports.txt <after>` printed nothing, exit 0. The step added no line; base 343 lines. |
| Verify 5: each changed test run before and after | DONE | The verify 2 runs, as listed above. |
| Verify 6: prose of changed comments and docs | DONE | Read, below. |
| ASCII | DONE | `LC_ALL=C grep -n '[^ -~]'` over every changed file printed nothing (exit 1); the list's "ok ASCII gate (0.7 s)". |

The verify list run, the lines it printed after the per-file list:

```
ok      prettier (0.6 s): All matched files use Prettier code style!
ok      ASCII gate (0.7 s)
ok      svelte-kit sync (1.9 s)
ok      eslint (84.2 s)
ok      svelte-check (93.2 s): 1792896922744 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (139.3 s): Duration  128.59s (transform 82.22s, setup 0ms, import 219.47s, tests 261.57s, environment 2ms)
ok      vitest (212.0 s): Duration  203.06s (transform 197.50s, setup 0ms, import 454.69s, tests 257.35s, environment 45.13s)
ok      vitest slow (251.2 s): Duration  242.36s (transform 17.55s, setup 0ms, import 235.81s, tests 713.59s, environment 12ms)
test:quick: 253.2 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
```

Test runs:
- The list ran once.
- I ran no whole-suite command.
- The other vitest runs:
  - the seven guarded files, twice, once on the unchanged tree and once after the change;
  - the case-run program, under `--project case` of the scratch config, which only includes the scratch `*.case.ts` file: four first-run passes while the program was being completed, then one run after the change.

Case 7 greps after the change:

```
$ grep -rn "priority_levels\|flamesOf\|nextPriority\|fire_glyph\|set_priority\|priority_none\|cyclePriority\|prioritiesShape\|oncycle" src config tests docs --exclude=local.yml
docs/HELP.md:517:- A hub sets its own words in its `.oculus/config.yml` under the keys of `vocab.yml` (every list but `priority_levels`), each laid over oculus's by its shape. [the rest of the line is unchanged and not quoted]
$ grep -rn -w "fire" config/catalogs
(nothing)
$ grep -n -i "priority\|flame" <the twelve files of case 7>
docs/apps.md:191:| `customEditors` | list | `viewType`, `displayName`, `selector` (list of `{ filenamePattern }`), `priority?` (`default` or `option`), `entry` |
docs/apps.md:260:A host calls `oculus.window.createStatusBarItem(id, alignment, priority)`; a page calls `register('statusItem', id, { alignment, priority })` and then `changed('statusItem', id, fields)`. Fields: `text`, `tooltip`, `command`, `name`, `backgroundColor` (warning or error), `accessibilityInformation`. The reader can hide an item from the bar's menu.
```

Two wider greps check that nothing of the project priority is left. `grep -rn -i "flame" src config tests docs README.md --exclude=local.yml` prints nothing. `grep -rn -i "\.priority\b\|priority:\|flames\|'priority'\|Priority\b" src config tests docs README.md --exclude=local.yml` prints only:
- the editor's language priority;
- the status-bar item priority;
- the custom editor priority;
- the SCM priority;
- the SLURM job priority;
- `career.test.ts`'s prose;
- `normalise.test.ts:95`, the input the row keeps by decision 4.

## Files changed

`git diff --numstat`, as added and removed lines:

| File | + | - |
|---|---|---|
| config/catalogs/glyphs.yml | 0 | 1 |
| config/catalogs/icons.yml | 0 | 1 |
| config/catalogs/vocab.yml | 1 | 8 |
| config/options/catalogs/vocab.yml | 1 | 1 |
| config/schemas/manifest-schema.yml | 5 | 7 |
| config/text/views/boards/focus.yml | 0 | 3 |
| docs/apps.md | 1 | 1 |
| docs/data-map.md | 0 | 1 |
| docs/templates.md | 0 | 1 |
| docs/diagrams/layer-views.dot, .svg; layers.dot, .svg; writes.dot, .svg | regenerated by `npm run diagrams` | |
| src/lib/data/helpers/hub-names.ts | 2 | 2 |
| src/lib/data/model/model-entities.ts | 0 | 5 |
| src/lib/data/shapes/catalog-files/vocab.ts | 3 | 8 |
| src/lib/data/snapshot/normalise.ts | 0 | 1 |
| src/lib/data/sources/config/merge/in-place.ts | 2 | 2 |
| src/lib/state/boards/focus.ts | 2 | 51 |
| src/lib/state/forms/schema.ts | 0 | 1 |
| src/lib/views/boards/focus/lanes/LaneCard.svelte | 14 | 50 |
| src/lib/views/boards/focus/lanes/Lanes.svelte | 13 | 49 |
| tests/checks/config/config-folder.test.ts | 0 | 1 |
| tests/data/snapshot/normalise.test.ts | 0 | 2 |
| .scratch/migration/agents/reviews/O71-report.md | this report | |

The sizes after the change (`wc -l`):

| File | Lines |
|---|---|
| `focus.ts` | 544 |
| `Lanes.svelte` | 343 |
| `LaneCard.svelte` | 194 |
| `vocab.ts` | 360 |

The hunks are inside the brief's line ranges (`git diff -U0`), with one exception: `config/catalogs/vocab.yml` `@@ -185,7 +184,0 @@` covers 185-191. Line 191 is a blank line, one past the range 185-190 (judgment call 1). The other hunks:

| File | Hunks |
|---|---|
| `focus.ts` | 1-2, 72-78, 185-214, 553-564 |
| `vocab.ts` | 4-6, 18, 309-312 |
| `Lanes.svelte` | 5-9, 29, 38, 41, 75, 124-183, 244-248 |
| `focus.yml` | 89, 104, 109 |
| `glyphs.yml` | 157 |
| `icons.yml` | 156 |

Every hunk sits apart from O69's and O70's lines. Lines 183-184 of `vocab.yml` are unchanged between this hunk and O70's 171-182, and `Lanes.svelte`'s 227-243 are unchanged between O70's 226 and this step's 244.

Edits to existing assertions and allow lists, from `git diff tests/`:

| File | Before | After |
|---|---|---|
| `tests/checks/config/config-folder.test.ts:222` (`EXPECTED['catalogs/vocab.yml']`, read by 'holds exactly the expected top-level keys, and no more' and 'reads each file on its own and finds its own keys there and nowhere else') | `'priority_levels',` | removed |
| `tests/data/snapshot/normalise.test.ts:262` (the expected object of 'fills a project from the manifest keys of the same meaning') | `priority: 'high',` | removed |
| `tests/data/snapshot/normalise.test.ts:127` (beta's input manifest) | `priority: 7,` | removed |

The failing line of each changed test on the unchanged tree was not run. Running it would mean putting the changed test over the unchanged code under test, which is a revert of that code, and the no-breakage rule bans it. By reading, these are the lines that fail on the unchanged tree:
- In `normalise.test.ts`, the assertion `expect(alpha).toEqual({` (`:252`). On the unchanged tree `normalise.ts:258` puts `priority: 'high'` into alpha, and `toEqual` refuses the extra key.
- In `config-folder.test.ts`, `expect(Object.keys(parsed).sort()).toEqual([...keys].sort())` (`:799`) and `expect(Object.keys(config).sort()).toEqual(expected)` (`:375`). On the unchanged tree `vocab.yml` holds `priority_levels`.

The step adds no test.

## Judgment calls the brief left open (each reversible)

1. **`vocab.yml` blank line.** The deletion in `config/catalogs/vocab.yml` takes the blank line 191 as well as 185-190, so two blank lines still separate the lane rows from the funding stages, as everywhere else in the file. Keeping exactly 185-190 would leave three blank lines.
2. **Move menu ids.** The menu's item ids are the lane keys, with no `lane:` prefix, since every item is now a lane. `choose(project, key)` finds the lane by key. `grep -rn "'lane:\|\`lane:\|\"lane:\|prio:" src tests` printed nothing before the change, so no other reader of the prefixed ids exists.
3. **Style comment.** `LaneCard.svelte` keeps a style comment above `.name`: "The name is a plain button, inside the box below that draws its look." This is item 3's comment that names what is a button now.
4. **`LaneCard.svelte` head comment.** The reason it is not `ui/frame/Card.svelte` now reads: "it is a drag handle whose first line is one row of the tree's height, which is a different thing from the titled box with a meta row and a body that a board of projects draws."
   - The first half is true by `.card { cursor: grab }`, `draggable="true"` and `.card-h { min-height: calc(var(--tree-row) ...) }`.
   - The second half is true by `ui/frame/Card.svelte`'s head: "A card-surface box with a title, a meta row under it, a body and an optional footer".
5. **The `flames` field.** It goes from the shared `keyed` row shape of `vocab.ts`, which also shapes `venue_tiers` and `radar_buckets`. A row there writing `flames:` is now refused by that strict shape.
   - No shipped row writes it: `grep -rn flames config` prints nothing.
   - No hub settings file writes it: `grep -n -i "flames\|priority" ~/workspace/research-hub/.oculus/config.yml` and `grep -rln "flames:" ~/workspace/*/.oculus/config.yml` both print nothing.
6. **`in-place.ts`.** The comment says the shapes are "every key of the file". A comparison of `vocab.yml`'s top-level keys with the keys of `VOCAB_SHAPES` printed one line, `> leads_fit`. That is the hub-only key the same comment names.

## Host- and user-visible changes, before and after (for the look on TEST)

- **Focus view, a project lane card (any card in Run, Push and the other lanes).**
  - Before: a flame badge at the card's leading edge, before the status marks. It showed one to three flames, or one faint flame when no priority was set, and a press cycled the priority.
  - After: no badge. The card starts with its status marks, then its name, with the badge's place given back to the row.
- **Focus view, a card's move menu ("Move to").**
  - Before: the lanes, then High, Med, Low and "No priority".
  - After: the lanes alone, the card's own lane marked. A pick of a lane moves the card, as it did.
- **Keyboard on a lane card.**
  - Before: Tab reached the "set priority" badge (or "high", "med", "low") first.
  - After: Tab reaches the card's name button first, then the hub chip where one is drawn, then the move menu.
- **Project form (editor), Core section.**
  - Before: a "Priority" select between "Status line" and "Pin to top".
  - After: no Priority field.
- **A manifest still writing `priority:`.**
  - Before: read, with no finding.
  - After: the finding "key priority is not declared by the schema of this file", and the YAML editor marks the key. A write naming `priority`, a clear included, is refused with "the manifest schema does not name the field".
- **A hub's `manifest_fields:` row naming `priority`.**
  - Before: refused as "a field oculus's project form already has".
  - After: accepted as that hub's own field.
- **A hub's `.oculus/config.yml` setting `priority_levels:`.** The same finding as before ("not one the hub's settings file takes").
- **Apps.** The `portfolio` payload's projects carry no `priority`, and `docs/apps.md:402` no longer lists it.

## Anything in the brief that was wrong or impossible

- **Case 11, second half.** Ruled in round 0, as above. A row whose `from` names no vocab list gets no finding anywhere, so a `from: vocab.priority_levels` row gets none either. The missing finding is open item 342.
- **Failing lines of the changed tests.** The rule `spec.md` "Report" asks for "its failing line on the unchanged tree" for each changed test. For this step that means putting the changed tests over the unchanged code under test, which the no-breakage rule bans. The failing lines are given by reading under "Files changed".
- **The diagrams.** `docs/diagrams/writes.dot` and `.svg` carry `vocab.ts` line numbers. O70 also changes `vocab.ts` (27-62), so at landing those two diagram files will differ from each step's own run. They are regenerated by the `npm run diagrams` that comes before the list.

## Prose check (verify 6)

Each changed sentence was read against `spec.md`'s prose rules: plain, ASCII, no em dash, no 'not X but Y', and no history words.
- Every comment paragraph edited in a `.ts` or `.svelte` file is rewrapped whole at 100 columns, measured with `awk '{print length}'`. The longest is 100, and no line inside a sentence ends short except where the next word would pass 100.
- The `.yml` head comments are one line per paragraph. The `manifest-schema.yml` `from:` paragraph is a hash-comment block, and it was rewrapped whole at 100.
- The history-word grep over every added line (`git diff -U0 | grep "^+" | grep -i -E "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O[0-9]+|20[0-9][0-9]-"`) printed one hit. It is `config/catalogs/vocab.yml:4`'s existing clause "A word a hub's values no longer give". That clause describes a word a hub's settings take out at run time, says nothing about the code's history, and is not text this step wrote.
- Departures from the rules found: none.

Head comments and doc comments of the functions touched:
- `focus.ts` head: rewritten. Its other paragraphs are still true.
- `Lanes.svelte` head: rewritten.
- `menuFor` and `choose` doc comments: rewritten.
- `LaneCard.svelte` head: rewritten. The `items` prop doc is rewritten, and its style comment is replaced by the one on `.name`.
- `vocab.ts` head, the `in-place.ts` `VOCAB_SHAPES` doc and `hub-names.ts`'s `HUB_LIST` doc: rewritten.
- `config/catalogs/vocab.yml:4` and `config/options/catalogs/vocab.yml:3`: rewritten. Line 3's "Every list of catalogs/vocab.yml a hub sets, described once" is still true.
- `manifest-schema.yml` `from:` paragraph: rewritten.
- `fieldValues` doc (`forms/schema.ts`) and `normalise.ts`: still true.
- `docs/templates.md`, `docs/data-map.md` and `docs/apps.md`: rewritten at the named lines.
- `docs/HELP.md`: `grep -n -i priorit docs/HELP.md` prints only `:517`, the Doc text below. No bullet describes the flames or the priority entries of the move menu.

## Limitations and sharp edges

- **The look.** The card's drawing, its tab order and the menu are checked by reading and by svelte-check. No page was run, so the look on TEST is the proof.
- **A select whose `from` names no list.** A hub row `from: vocab.priority_levels` (or any unknown list) gives no finding, as on the unchanged tree. What the form's select draws for such a row was not verified. This is open item 342's concern.
- **A manifest that still writes `priority:`.** It can be cleaned only in the YAML editor, since a write naming the field, a clear included, is refused. No manifest of the hub holds the key: `find ~/workspace/research-hub -name project.yml -not -path "*/node_modules/*" | xargs grep -ln "^priority:"` printed nothing (exit 1) after the change.

## Doc text

The current line, as `grep -n "but \`priority_levels\`" docs/HELP.md` prints it. Its text after "shape." is long, unchanged, and not quoted here:

```
517:- A hub sets its own words in its `.oculus/config.yml` under the keys of `vocab.yml` (every list but `priority_levels`), each laid over oculus's by its shape. A map (`palette`, ...
```

The replacement, decision 5. The parenthesis " (every list but `priority_levels`)" is removed, and the rest of the line stays byte for byte:

```
517:- A hub sets its own words in its `.oculus/config.yml` under the keys of `vocab.yml`, each laid over oculus's by its shape. A map (`palette`, ...
```

As a literal edit, replace " (every list but `priority_levels`)," with "," in `docs/HELP.md:517`.
