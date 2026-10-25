Everything in the brief is done

## Open items of the state file, verbatim

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

## The cases' first run, on the unchanged tree

Cases 1 to 9 and 11 to 14 were run by one case-run program over scratch hubs planted under the system temporary directory, outside the tree, from the worktree's root, before any change: `W=$PWD npx tsx <scratchpad>/o73/cases.mts`. The program was kept in the session scratchpad only; its source:

```ts
// Case-run program of step O73: prints each case's result for its input over scratch hubs
// planted in a temporary folder; writes nothing into the worktree.
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const W = process.env.W as string;
const { engineDir, loadConfig } = await import(`${W}/src/lib/data/sources/config.ts`);
const { portfolioConfigFrom } = await import(`${W}/src/lib/data/index.ts`);
const { buildOneHub } = await import(`${W}/tests/fixtures/hubs/hub-build.ts`);
const { schemaFindings } = await import(`${W}/src/lib/data/sources/config/catalog/schema-findings.ts`);
const { vocabLists } = await import(`${W}/src/lib/data/snapshot/schema/lists.ts`);
const { VOCAB_FILE_KEYS } = await import(`${W}/src/lib/data/shapes/catalog-files/vocab.ts`);

const root = mkdtempSync(join(tmpdir(), 'o73-cases-'));
function plant(name: string, files: Record<string, string>): string {
    const hub = join(root, name);
    for (const [rel, body] of Object.entries(files)) {
        mkdirSync(join(hub, rel, '..'), { recursive: true });
        writeFileSync(join(hub, rel), body);
    }
    return hub;
}
function run(label: string, rows: string[], extra = ''): void {
    const hub = plant(label, { '.oculus/config.yml': `${extra}manifest_fields:\n${rows.map((r) => `  - ${r}`).join('\n')}\n` });
    const read = loadConfig(engineDir(), { hub });
    console.log(`== ${label}`);
    for (const f of read.findings) console.log(`  finding: ${f.file.replace(root, '<root>')} | ${f.key} | ${f.message}`);
    if (read.findings.length === 0) console.log('  findings: []');
    console.log(`  taken: ${JSON.stringify((read.config.manifest_fields as { field: string; from?: unknown }[]).map((r) => [r.field, r.from ?? null]))}`);
}
const row = (field: string, from: string): string => `{ field: ${field}, label: L, type: chips, section: Core, from: ${from} }`;
run('case1', [row('grant_id', 'nope')]);
run('case2', [row('g2', '[people, vocab.nope]')]);
run('case3', [row('a', 'vocab.stages'), row('b', '[people, projects]'), row('c', 'vocab.statuses.acknowledged')]);
run('case4', ['{ field: grant_id, label: Grant, type: text, section: Core, help: "The grant number." }']);
run('case5', [row('g5', '[nope, also_nope]')]);
run('case6', [row('title', 'nope')]);
run('case7', [row('g7', '3')]);
run('case11a', [row('fit', 'vocab.leads_fit')], 'leads_fit: { strong: "#16a34a", reach: "#9ca3af" }\n');
run('case11b', [row('fit', 'vocab.leads_fit')]);
run('case12', [row('g12', 'vocab.statuses.nope')]);
run('case13', [row('e1', '[]'), row('e2', '""'), row('e3', '[people, ""]')]);

const hub9 = plant('case9', {
    '.oculus/config.yml': `manifest_fields:\n  - ${row('grant_id', 'nope')}\n`,
    'projects/ideas/x/project.yml': 'title: X\ntier: research\nstage: nascent\ngrant_id: [a]\n'
});
const read9 = loadConfig(engineDir(), { hub: hub9 });
const { snapshot } = buildOneHub(hub9, portfolioConfigFrom(read9.config, read9.from));
console.log('== case9 (manifest findings on grant_id)');
for (const f of snapshot.findings.filter((one: { file: string; key: string }) => one.file === `${hub9}/projects/ideas/x/project.yml` && one.key.startsWith('grant_id')))
    console.log(`  ${f.key} | ${f.message}`);

const own = loadConfig(engineDir()).config;
console.log('== case8/14 schemaFindings on oculus own config');
console.log(`  ${JSON.stringify(schemaFindings(engineDir(), own))}`);
console.log(`  vocabLists holds statuses.acknowledged: ${Object.hasOwn(vocabLists(own, VOCAB_FILE_KEYS), 'statuses.acknowledged')}`);
```

Its output on the unchanged tree (the hub folder written as `<root>`):

```
== case1
  findings: []
  taken: [["grant_id","nope"]]
== case2
  findings: []
  taken: [["g2",["people","vocab.nope"]]]
== case3
  findings: []
  taken: [["a","vocab.stages"],["b",["people","projects"]],["c","vocab.statuses.acknowledged"]]
== case4
  findings: []
  taken: [["grant_id",null]]
== case5
  findings: []
  taken: [["g5",["nope","also_nope"]]]
== case6
  finding: <root>/case6/.oculus/config.yml | manifest_fields.0.field | manifest_fields.0.field names title, a field oculus's project form already has; the row is left out
  taken: []
== case7
  finding: <root>/case7/.oculus/config.yml | manifest_fields.0.from | manifest_fields.0.from is not a value a field of the project form takes; the row is left out
  taken: []
== case11a
  findings: []
  taken: [["fit","vocab.leads_fit"]]
== case11b
  findings: []
  taken: [["fit","vocab.leads_fit"]]
== case12
  findings: []
  taken: [["g12","vocab.statuses.nope"]]
== case13
  findings: []
  taken: [["e1",[]],["e2",""],["e3",["people",""]]]
== case9 (manifest findings on grant_id)
  grant_id[0] | grant_id[0] is a, which is not a key of nope
== case8/14 schemaFindings on oculus own config
  []
  vocabLists holds statuses.acknowledged: true
```

Each case on the unchanged tree:

1. `from: nope`: no finding, the row taken (`case1`: `findings: []`, `taken: [["grant_id","nope"]]`).
2. `from: [people, vocab.nope]`: no finding, the row taken (`case2`).
3. `vocab.stages`, `[people, projects]`, `vocab.statuses.acknowledged`: no finding, each taken (`case3`), as the case expects before and after.
4. The `GRANT` row with no `from`: no finding, taken (`case4`). The three existing rows of the describe pass on the unchanged tree: `npx vitest run tests/data/sources/config/layers/manifest-fields.test.ts tests/data/sources/config/layers/agents.test.ts tests/data/sources/config/layers/catalogs.test.ts tests/data/sources/config/layers/hub-vocab.test.ts --reporter=dot` printed `Test Files  4 passed (4)` / `Tests  29 passed (29)`.
5. `from: [nope, also_nope]`: no finding, taken (`case5`).
6. `{ field: title, ..., from: nope }`: only `manifest_field_held` at `manifest_fields.0.field` (`case6`), as the case expects before and after.
7. `from: 3`: only `manifest_field_shape` at `manifest_fields.0.from` (`case7`), as the case expects before and after.
8. oculus's own schema files: `schemaFindings(engineDir(), own)` printed `[]`; the vitest run of the tests that reach `schemaFindings` (case 4's run above: agents, catalogs, hub-vocab through `readerFindings`) passed.
9. A manifest `grant_id: [a]` under the row `from: nope`: one finding on the manifest, `grant_id[0] | grant_id[0] is a, which is not a key of nope`.
10. By reading: `config/options/schemas/manifest-schema.yml:4`, `config/schemas/manifest-schema.yml:86`, `docs/HELP.md:524`, `docs/templates.md:305-310`, the head comment `hub-layer.ts:10-13` and the doc comments of `readManifestFields` (`hub-layer.ts:345-352`) and `mergeHub` name no `from` kind; `config/schemas/manifest-schema.yml:86` named three kinds (a field the form has, a section it lacks, a widget it does not draw).
11. A hub setting `leads_fit` with a row `from: vocab.leads_fit`: no finding, taken (`case11a`); the same row in a hub without `leads_fit`: no finding, taken (`case11b`).
12. `from: vocab.statuses.nope`: no finding, taken (`case12`).
13. `from: []`, `from: ""`, `from: [people, ""]`: no finding, each taken (`case13`).
14. `vocabLists` over oculus's own merged config holds `statuses.acknowledged` (`true`), and `schemaFindings` printed `[]` (no `bad_from`).

No case was found that the brief's rules get wrong.

The new test rows of item 5 (and cases 11 to 13, item "Cases" last paragraph) were written into `tests/data/sources/config/layers/manifest-fields.test.ts` and run on the unchanged code before any code change, `npx vitest run tests/data/sources/config/layers/manifest-fields.test.ts --reporter=verbose`:

```
 <check mark> |unit| tests/data/sources/config/layers/manifest-fields.test.ts > the fields a hub adds to the project form > draws the added field after oculus's fields of its section in that hub's form only 551ms
 <check mark> |unit| tests/data/sources/config/layers/manifest-fields.test.ts > the fields a hub adds to the project form > reads the added key of that hub's manifest with no finding, and another hub's as unknown 1382ms
 <check mark> |unit| tests/data/sources/config/layers/manifest-fields.test.ts > the fields a hub adds to the project form > words each row the form cannot take and leaves it out 750ms
 <multiplication sign> |unit| tests/data/sources/config/layers/manifest-fields.test.ts > the fields a hub adds to the project form > words a row whose from names no registry, projects or vocab list and leaves it out 921ms
   <rightwards arrow> expected [] to deeply equal [ <horizontal ellipsis>(2) ]
 <multiplication sign> |unit| tests/data/sources/config/layers/manifest-fields.test.ts > the fields a hub adds to the project form > holds a from to the vocab lists of the hub's own values, and words one that names nothing 960ms
   <rightwards arrow> expected [] to deeply equal [ <horizontal ellipsis>(4) ]
<horizontal line extension><horizontal line extension><horizontal line extension><horizontal line extension><horizontal line extension><horizontal line extension><horizontal line extension> Failed Tests 2 <horizontal line extension><horizontal line extension><horizontal line extension><horizontal line extension><horizontal line extension><horizontal line extension><horizontal line extension>
AssertionError: expected [] to deeply equal [ <horizontal ellipsis>(2) ]
- Expected
+ Received
- [
-   "/scratch/lab/.oculus/config.yml | manifest_fields.0.from | manifest_fields.0.from names nope, which is no registry, projects or vocab list; the row is left out",
-   "/scratch/lab/.oculus/config.yml | manifest_fields.1.from | manifest_fields.1.from names vocab.nope, which is no registry, projects or vocab list; the row is left out",
- ]
+ []
AssertionError: expected [] to deeply equal [ <horizontal ellipsis>(4) ]
- Expected
+ Received
- [
-   "/scratch/lab/.oculus/config.yml | manifest_fields.1.from | manifest_fields.1.from names vocab.statuses.nope, which is no registry, projects or vocab list; the row is left out",
-   "/scratch/lab/.oculus/config.yml | manifest_fields.2.from | manifest_fields.2.from names no list; the row is left out",
-   "/scratch/lab/.oculus/config.yml | manifest_fields.3.from | manifest_fields.3.from names no list; the row is left out",
-   "/scratch/lab/.oculus/config.yml | manifest_fields.4.from | manifest_fields.4.from names no list; the row is left out",
- ]
+ []
 Test Files  1 failed (1)
      Tests  2 failed | 3 passed (5)
```

## DONE / NOT DONE

| Item | State | Command | Output (last line of the run that proves it) |
| --- | --- | --- | --- |
| 1 `namesList(source, merged)` in `static.ts`, used by `schemaFileProblems` | DONE | case run (case 8/14) after the change | `[]` and `vocabLists holds statuses.acknowledged: true` |
| 2 the check of a hub's row after the hub's values are laid in, index kept, row taken out | DONE | case run after the change; `npx vitest run tests/data/sources/config/layers/manifest-fields.test.ts` | `Tests  5 passed (5)` |
| 3 the two sentences in `findings.yml` after `manifest_field_shape` | DONE | `grep -n "manifest_field_from" config/text/findings.yml` | `142:            manifest_field_from_none: '{0} names no list; the row is left out'` |
| 4 the four sentences name the new kind | DONE | reading; `git diff` of the four files | quoted under "host- or user-visible changes" |
| 5 the new G128 row, failing on the unchanged tree | DONE | the verbose run above (before), the same file after | before `Tests  2 failed / 3 passed (5)`; after `Tests  5 passed (5)` |
| Verify 1 `npm run diagrams && npm run test:quick` | DONE | run once after the last change | `test:quick: 58.9 s; every command passed` |
| Verify 2 the G128 test file passes | DONE | `npx vitest run tests/data/sources/config/layers/manifest-fields.test.ts --reporter=verbose` | `Tests  5 passed (5)` |
| Verify 3 the new row fails on the unchanged tree, the three existing rows pass before and after | DONE | the runs above | before: 3 passed, 2 failed; after: 5 passed |
| Verify 4 each changed sentence read against the prose rules | DONE | reading | see "Judgment calls" item 7 |
| unused exports compared with the base | DONE | `sh utils/unused-exports.sh > <scratchpad>/unused-after.txt; diff .../O73-base/unused-exports.txt <scratchpad>/unused-after.txt` | no output, `diff exit 0`: the step adds no line |
| history words in added comments and test titles | DONE | `git diff -U0 -- src tests config docs \| grep '^+' \| grep -v '^+++' \| grep -niE "before\|used to\|no longer\|still\|always has been\|always had\|as before\|previously\|the step adds\|after this\|O73\|ruling\|20[0-9][0-9]-"` | no output (`grep exit 1`) |
| ASCII over every touched file | DONE | `LC_ALL=C grep -n '[^ -~]'` over the eight files of the write list | no output (`ascii exit 1`); the ASCII gate of test:quick `ok` |

The quick list's lines:

```
test:quick: 12 changed file(s), from git since HEAD
test:quick: 1 test file(s)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.3 s)
ok      vitest (15.0 s): Duration  5.96s (transform 1.64s, setup 0ms, import 4.18s, tests 1.67s, environment 0ms)
ok      eslint (36.5 s)
ok      svelte-check (56.5 s): 1792924999686 COMPLETED 537 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
test:quick: 58.9 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            the build, the lint of unchanged files
```

The cases after the last code change, `W=$PWD npx tsx <scratchpad>/o73/cases.mts`:

```
== case1
  finding: <root>/case1/.oculus/config.yml | manifest_fields.0.from | manifest_fields.0.from names nope, which is no registry, projects or vocab list; the row is left out
  taken: []
== case2
  finding: <root>/case2/.oculus/config.yml | manifest_fields.0.from | manifest_fields.0.from names vocab.nope, which is no registry, projects or vocab list; the row is left out
  taken: []
== case3
  findings: []
  taken: [["a","vocab.stages"],["b",["people","projects"]],["c","vocab.statuses.acknowledged"]]
== case4
  findings: []
  taken: [["grant_id",null]]
== case5
  finding: <root>/case5/.oculus/config.yml | manifest_fields.0.from | manifest_fields.0.from names nope, which is no registry, projects or vocab list; the row is left out
  taken: []
== case6
  finding: <root>/case6/.oculus/config.yml | manifest_fields.0.field | manifest_fields.0.field names title, a field oculus's project form already has; the row is left out
  taken: []
== case7
  finding: <root>/case7/.oculus/config.yml | manifest_fields.0.from | manifest_fields.0.from is not a value a field of the project form takes; the row is left out
  taken: []
== case11a
  findings: []
  taken: [["fit","vocab.leads_fit"]]
== case11b
  finding: <root>/case11b/.oculus/config.yml | manifest_fields.0.from | manifest_fields.0.from names vocab.leads_fit, which is no registry, projects or vocab list; the row is left out
  taken: []
== case12
  finding: <root>/case12/.oculus/config.yml | manifest_fields.0.from | manifest_fields.0.from names vocab.statuses.nope, which is no registry, projects or vocab list; the row is left out
  taken: []
== case13
  finding: <root>/case13/.oculus/config.yml | manifest_fields.0.from | manifest_fields.0.from names no list; the row is left out
  finding: <root>/case13/.oculus/config.yml | manifest_fields.1.from | manifest_fields.1.from names no list; the row is left out
  finding: <root>/case13/.oculus/config.yml | manifest_fields.2.from | manifest_fields.2.from names no list; the row is left out
  taken: []
== case9 (manifest findings on grant_id)
  grant_id | key grant_id is not declared by the schema of this file
== case8/14 schemaFindings on oculus own config
  []
  vocabLists holds statuses.acknowledged: true
```

Each case after the change: 1 one finding at `manifest_fields.0.from` naming `nope`, row out; 2 one finding naming `vocab.nope`, row out; 3 no finding, three rows taken; 4 no finding, taken; 5 one finding naming `nope`, the first; 6 only `manifest_field_held`; 7 only `manifest_field_shape` at `manifest_fields.0.from`; 8 and 14 `schemaFindings` `[]` as before, and `npx vitest run tests/data/sources/config/layers/agents.test.ts tests/data/sources/config/layers/catalogs.test.ts tests/data/sources/config/layers/hub-vocab.test.ts --reporter=dot` printed `Test Files  3 passed (3)` / `Tests  26 passed (26)`; 9 the manifest's finding is now `grant_id | key grant_id is not declared by the schema of this file`; 11 `leads_fit` set: no finding, taken; not set: the `manifest_field_from` finding naming `vocab.leads_fit`, row out; 12 the finding naming `vocab.statuses.nope`, row out; 13 three `manifest_field_from_none` findings at `manifest_fields.0.from`, `.1.from`, `.2.from`, every row out.

The row index is the hub's index when an earlier row was left out by an earlier check, run by a second case-run program, `W=$PWD npx tsx <scratchpad>/o73/index.mts`:

```ts
// Case-run program: a row left out by an earlier check before a row with a bad `from`.
const W = process.env.W as string;
const { engineDir, loadConfig } = await import(`${W}/src/lib/data/sources/config.ts`);
const text = 'manifest_fields:\n  - { field: title, label: T, type: text, section: Core }\n  - { field: g, label: G, type: chips, section: Core, from: nope }\n';
const read = loadConfig(engineDir(), { hub: '/scratch/lab', instead: { layer: 'hub', name: '.oculus/config.yml', text } });
for (const f of read.findings) console.log(`${f.key} | ${f.message}`);
console.log(JSON.stringify(read.config.manifest_fields));
```

```
manifest_fields.0.field | manifest_fields.0.field names title, a field oculus's project form already has; the row is left out
manifest_fields.1.from | manifest_fields.1.from names nope, which is no registry, projects or vocab list; the row is left out
[]
```

Case 10, by reading after the change: the head comment `hub-layer.ts:10-15`, the doc comment of `readManifestFields` (`hub-layer.ts:350-358`), the new doc comment of `rowsNamingLists` (`hub-layer.ts:436-443`) and the doc comment of `mergeHub` (`hub-layer.ts:468-482`) each match the code (the check runs after `dropRemovedWords`, `hub-layer.ts:576-578`); the four sentences of item 4 each name the new kind.

The grep before writing the helper, `grep -rn "namesList" src tests`, printed only `namesListed` in `src/lib/views/shared/explorer/tree/menu/row-ops.ts` (lines 292, 332, 346), a different name, so `namesList` was free. The rule it holds is the local `lists` of `schemaFileProblems`, moved into it and reused there.

The comments and documents that describe the behaviour, each re-read after the change: head comment of `hub-layer.ts`, rewritten; doc comments of `readManifestFields` and `mergeHub`, rewritten; doc comment of `rowsNamingLists`, new; doc comment of `namesList`, new; head comment of `static.ts` and doc comment of `schemaFileProblems`, still true; head comment of `schema-findings.ts`, still true; head comment of `lists.ts` (a field no row carries as `true` naming no list), still true; head comment of `manifest.ts`, still true; doc comment of `withManifestFields` (`src/lib/data/shapes/vocab-keys.ts:283-290`), still true (it describes the rows it drops itself); `src/lib/data/helpers/hub-names.ts:356-364`, still true; `docs/data-map.md:80` and `:116` and `docs/templates.md:39`, still true; `docs/HELP.md:524`, the `config.yml` template comment of `docs/templates.md`, `config/options/schemas/manifest-schema.yml:4` and `config/schemas/manifest-schema.yml:86`, rewritten; the head comment of the test file, rewritten.

## Files with line counts (`git diff --numstat`, added / removed)

| File | + | - | In the write list |
| --- | --- | --- | --- |
| `src/lib/data/snapshot/schema/static.ts` (87 lines) | 15 | 8 | yes |
| `src/lib/data/sources/config/merge/hub-layer.ts` (579 lines) | 62 | 17 | yes |
| `config/text/findings.yml` (lines 141-142) | 2 | 0 | yes |
| `config/schemas/manifest-schema.yml` (line 86) | 1 | 1 | yes |
| `config/options/schemas/manifest-schema.yml` (line 4) | 1 | 1 | yes |
| `docs/HELP.md` (line 524) | 1 | 1 | yes |
| `docs/templates.md` (lines 305-311) | 3 | 2 | yes, the comment block grew by one line, to 311 |
| `tests/data/sources/config/layers/manifest-fields.test.ts` (151 lines) | 63 | 2 | yes |
| `docs/diagrams/layer-data.dot`, `docs/diagrams/layer-data.svg` | 2 / 2 | 2 / 2 | no: written by `npm run diagrams`, which the verify list requires right before test:quick; `data/sources` to `data/snapshot` imports went from 10 to 11 (the new import of `static.ts` in `hub-layer.ts`) and `data/snapshot` to `data/shapes` from 14 to 13 (`static.ts` no longer imports `vocab-keys.ts`) |
| `docs/diagrams/writes.dot`, `docs/diagrams/writes.svg` | 796 / 1620 | 773 / 1558 | no: written by `npm run diagrams`; the write chain reaches `hub-layer.ts`, so `static.ts` and a call at `static.ts:46` it cannot follow are drawn in it, and every later part moves down a row |

`.scratch/migration/agents/reviews/O73-report.md` is this report.

## Judgment calls the brief left open

1. Cases 11 to 13 are a second row of the describe, `holds a from to the vocab lists of the hub's own values, and words one that names nothing`, a table of two hubs (one setting `leads_fit` with the rows `vocab.leads_fit`, `vocab.statuses.nope`, `[]`, `""`, `[people, ""]`; one without it with the row `vocab.leads_fit`), beside the row of item 5, since item 5's hub must give exactly two findings.
2. `readManifestFields` returns `TakenRow` (`{ index, row, from }`), `from` being the parsed `read.data.from`, so the later check reads a typed `from` with no second parse; the row laid into the config is the raw row, as it was.
3. The check is `rowsNamingLists` in `hub-layer.ts`, called after `dropRemovedWords` and writing `config.manifest_fields` with `setAt`; `from['manifest_fields']` stays the hub's file even when every row is taken out, as with the earlier checks.
4. `namesList` calls `vocabLists(merged, VOCAB_FILE_KEYS)` on each call; its cost was not measured. It runs once per `from` source of oculus's three schema files and of a hub's rows.
5. `vocab.` (the prefix alone) names no list, since `vocabLists` has no empty key; it gets the `manifest_field_from` sentence naming `vocab.`.
6. `config/schemas/manifest-schema.yml:86` now reads: "A row with no field, a row naming a field the form already has or an earlier row names, a section the form lacks or a widget the form does not draw, a row its shape refuses otherwise, and a row whose `from` names no registry, `projects` or vocab list are each a finding, and the row is left out."
7. Prose read against the rules: the new sentences are ASCII, with no em dash and no 'not X but Y'. One sentence of the doc comment of `rowsNamingLists` is heavy to read ("A row whose `from`, or a source of whose `from` list, names no registry, `projects` or vocab list (`namesList`) is a finding ..."); it is correct and is left as written.

## Host- or user-visible changes, before and after

- A hub's `.oculus/config.yml` row `- { field: grant_id, label: Grant, type: chips, section: Core, from: nope }`. Before: no finding; the field is drawn in the hub's project form with no choices, and a manifest `grant_id: [a]` gets `grant_id[0] is a, which is not a key of nope`. After: the finding `<hub>/.oculus/config.yml | manifest_fields.0.from | manifest_fields.0.from names nope, which is no registry, projects or vocab list; the row is left out`; the field is not in the form, and the manifest's `grant_id` gets `key grant_id is not declared by the schema of this file`.
- A row with `from: []`, `from: ""` or `from: [people, ""]`. Before: no finding, the row taken (and a manifest value under `from: []` named an empty source). After: `manifest_fields.<i>.from names no list; the row is left out`, the row out.
- A row with `from: vocab.leads_fit` in a hub that sets `leads_fit`: taken with no finding, before and after.
- The look on landing: the Problems view (or the config findings) of a hub with such a row shows the new finding on the hub's `.oculus/config.yml`; the project form of that hub's projects (a project's Edit form) has no `grant_id` field; Settings' help for `manifest_fields` (the options description from `config/options/schemas/manifest-schema.yml`) names the new kind.
- `docs/HELP.md:524`, the `config.yml` template comment in `docs/templates.md` (what a new hub's settings file gets) and the two config comments name the new kind.

## Anything in the brief that was wrong or impossible

- Case 8 names "the tests that import `static.ts` or `schema-findings.ts`": no test imports either (`grep -rln "schemaFindings\|schemaFileProblems\|static.ts\|schema-findings\|bad_from" tests` printed nothing). The run used the tests that reach `schemaFindings` through `readerFindings` (`tests/data/sources/config/layers/layers-fixture.ts` importing `READER_FINDINGS`): agents, catalogs and hub-vocab, before and after.
- `docs/templates.md` lines 305-310: the rewritten comment takes one more line, so the block ends at 311.
- The four `docs/diagrams/` files are outside the write list; `npm run diagrams`, which the brief's verify command runs, writes them.
- The brief names no base copy folder of the tree; `/Users/axelfaes/workspace/oculus/.agents/worktrees/O73-base` holds only `unused-exports.txt`, so the file table is made from `git diff --numstat`.

## Runs of the verify list and whole-suite commands

The verify list (`npm run diagrams && npm run test:quick`) ran once, after the last change. No whole-suite command was run.
