# O131 report: the editor holds a one-text `multi` value to the field's words

Everything in the brief is done.

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md`, "Open items":

- Open item 647 (2026-11-03): the words of a hub other than the primary are held to the whole-file shape only, never to `vocabFindings` (`src/lib/data/sources/config/sections/vocab.ts`, run in `READER_FINDINGS` over the primary's merged config alone, as `categoriesFindings` was before O130), so in such a hub's `.oculus/config.yml` two stages carrying `new_idea`, a `focus_clusters` row whose `label` names no catalog word, or a Focus lane's `move_writes` naming a word the vocabulary lacks gives no finding, and the page passes over the value silently (O130's brief check, `agents/reviews/O130-brief-check.md`, check 6). (a) recommended: a new step that runs `vocabFindings` in `readOtherHub` over each other hub's merged config when its settings file sets a vocabulary key, its findings naming that file, as O130 does for `categories`; it makes findings appear for such a hub's wrong words. (b) no change, the lazy option: a second hub's wrong vocabulary flags and lanes stay silent.

## The cases' first run

Every case was run on the unchanged tree before any code change. C1 to C8 and C11 by the case-run program (source and both outputs below), first on the worktree while it was unchanged; the "before" output quoted below is the same program run again over the base copy (`TREE=/Users/axelfaes/workspace/oculus/.agents/worktrees/O131-base/ node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o131-builder/cases.mts`), whose output for every case is the same as that first run. C1 to C7 also by the new describe, written before the code change and run on the unchanged code. C9 and C10 by their tests. No case the brief's rules get wrong was found, so there was no stop.

Note on the base run: the base copy holds no `package.json`, so `engineDir()` (`src/lib/data/places/engine-dir.ts:19-27`) walks up to `/Users/axelfaes/workspace/oculus` and reads its `config/`, read only. `diff -rq --exclude=local.yml config .agents/worktrees/O131-base/config` from that folder printed nothing, exit 0, so the config read is the base's.

| Case | Checked by | First run on the unchanged tree | Brief's "before" |
| --- | --- | --- | --- |
| C1 `sort: [stage, nonsense]` | case-run; test row 1 | ours `["5: categories[0].sort[1] is nonsense, which is not one of stage, year, title"]`; editor `["5: Value is not accepted. Valid values: \"stage\", \"year\", \"title\"."]`; test passed | one problem: met |
| C2 `sort: nonsense` | case-run; test row 2 | ours `[]`; editor `[]`; completion at the end of `sort: nonsense` `[]`; test failed `expected [ [] ] to deeply equal [ [ '5:' ] ]` | none: met |
| C3 `sort: year` | case-run; test row 3 | ours `[]`; editor `[]`; completion at `sort: ` `[]`; test passed | none, no completion: met |
| C4 `sort: 'stage year'` | case-run; test row 4 | ours `[]`; editor `[]`; test failed `expected [ [] ] to deeply equal [ [ '5:' ] ]` | none: met |
| C5 `sort: [year, title]` | case-run; test row 5 | ours `[]`; editor `[]`; test passed | none: met |
| C6 board `tier` in `config/defaults/layout.yml` | case-run; test row 6 | `tier: nonsense` ours `[]` editor `[]`; `tier: research` ours `[]` editor `[]`; test failed `expected [ [], [] ] to deeply equal [ [ '4:' ], [] ]` | none for both: met |
| C7 `research_audit.skip_tiers` | case-run; test row 7 | `nonsense`, `[research, nonsense]`, `research` each ours `[]` editor `[]`; test failed `expected [ [], [], [] ] to deeply equal [ [ '2:' ], [ '2:' ], [] ]` | none for all: met |
| C8 `connections.failures` `for: ''` | case-run | ours `[]`; editor `[]`; the rule `{"kind":"choice","values":["cluster","git"]}` | none, rule refuses: met |
| C9 shipped config files | `npx vitest run tests/data/sources/config/catalog/options-schema.test.ts tests/checks/config/config-folder.test.ts tests/data/sources/config/catalog/options.test.ts --reporter=verbose` on the unchanged tree | ` <check mark> \|unit\| tests/checks/config/config-folder.test.ts > oculus's own config directory > passes every config file through the schema it is matched to 957ms` | passes: met |
| C10 Make Folder a Hub's file | the same run | ` <check mark> \|unit\| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a collections entry > passes the .oculus/config.yml Make Folder a Hub writes with every collection ticked 86ms` | passes: met |
| C11 theme row `class` | case-run over the workspace schema | `class: 'dark any text  at all'` ours `[]` editor `[]`; `class: nonsense` ours `[]` editor `[]` | none: met |

The first run of the tests, verbatim lines (the run of `npx vitest run tests/data/sources/config/catalog/options-schema.test.ts -t "the schema of a multi" --reporter=verbose` on the unchanged code, the check marks and crosses written by name):

```
 <check mark> |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of a list with a word outside the words on their lines 69ms
 <cross> |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of one text of a word outside the words on their lines 4ms
 <check mark> |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of one text of one of the words on their lines 0ms
 <cross> |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of one text of two words on their lines 1ms
 <check mark> |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of a list of the words on their lines 0ms
 <cross> |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of a board's tier in layout.yml on their lines 26ms
 <cross> |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of a research_audit value in a hub on their lines 1ms
 FAIL  |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of one text of a word outside the words on their lines
 FAIL  |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of one text of two words on their lines
AssertionError: expected [ [] ] to deeply equal [ [ '5:' ] ]
 FAIL  |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of a board's tier in layout.yml on their lines
AssertionError: expected [ [], [] ] to deeply equal [ [ '4:' ], [] ]
 FAIL  |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of a research_audit value in a hub on their lines
AssertionError: expected [ [], [], [] ] to deeply equal [ [ '2:' ], [ '2:' ], [] ]
 Test Files  1 failed (1)
      Tests  4 failed | 3 passed | 10 skipped (17)
```

Each failure points at `tests/data/sources/config/catalog/options-schema.test.ts:198:23`, the line `expect(found).toEqual(rows.map(([, lines]) => lines));`. The 10 skipped are the file's other describes, left out by `-t`.

Which row is a proof and which an audit: rows 2, 4, 6 and 7 (C2, C4, C6, C7) fail on the unchanged code and are the proof of the change. Rows 1, 3 and 5 (C1, C3, C5) pass before and after; they are audits of what the change keeps, and would still pass with the text branch taken out of `multiSchema`.

## The case-run program (item 4)

Source, `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o131-builder/cases.mts`, run from the worktree's root with node v24.21.0 as `node <path>` (after) and `TREE=/Users/axelfaes/workspace/oculus/.agents/worktrees/O131-base/ node <path>` (before). It writes nothing; its outputs were redirected to `before.txt` and `after.txt` beside it in the scratchpad.

```ts
// The case-run program of O131: prints, for each case, the problems oculus's checker gives and
// the diagnostics yaml-language-server gives against the schema the server serves the file with,
// and for C2 and C3 the completion at the value and the hover. It writes nothing.
import { join } from 'node:path';
import { createRequire } from 'node:module';
// TREE is the tree whose code is read: the step's worktree, or the base copy for the run before.
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O131/';
const R = process.env.TREE ?? W;
const require = createRequire(W + 'package.json');
const { getLanguageService } = require(
    W + 'node_modules/yaml-language-server/lib/umd/languageservice/yamlLanguageService.js'
);
const { TextDocument } = require(W + 'node_modules/vscode-languageserver-textdocument');
const { portfolioConfigFrom } = await import(R + 'src/lib/data/index.ts');
const { HUB_FILE } = await import(R + 'src/lib/data/helpers/hub-names.ts');
const { createChecker, checkDocument } = await import(R + 'src/lib/data/snapshot/schema/check.ts');
const { schemaFor } = await import(R + 'src/lib/data/snapshot/schema/set.ts');
const { engineDir, loadConfig } = await import(R + 'src/lib/data/sources/config.ts');
const { withOwnSchemas } = await import(R + 'src/lib/server/root/watch/build.ts');
const { buildOneHub } = await import(R + 'tests/fixtures/hubs/hub-build.ts');
const { DEMO_HUB } = await import(R + 'tests/fixtures/hubs/real-hub.ts');

const { config } = loadConfig(engineDir(), { hub: DEMO_HUB });
const portfolio = portfolioConfigFrom(config);
const checker = createChecker();
const dir = join(engineDir(), 'config');
const { schemas } = buildOneHub(DEMO_HUB, portfolio, 1, [], checker, { dir, held: [{ root: 'config', path: '' }] }, 'hub');
const hubSchemas = withOwnSchemas(schemas);
console.log('engineDir', engineDir());

const served = {
    hub: { set: hubSchemas, root: 'hub', rel: HUB_FILE },
    layout: { set: schemas, root: 'config', rel: 'defaults/layout.yml' },
    workspace: { set: schemas, root: 'hub', rel: '.oculus/workspaces/mine.yml' }
};
type Where = keyof typeof served;
const nameOf = (where: Where): string => {
    const one = served[where];
    const name = schemaFor(one.set, one.root, one.rel);
    if (name === undefined) throw new Error(`no schema for ${where}`);
    return name;
};
const schemaOf = (where: Where): unknown => JSON.parse(served[where].set.texts[nameOf(where)]);

let n = 0;
function service(where: Where) {
    const ls = getLanguageService({
        schemaRequestService: async () => '',
        workspaceContext: { resolveRelativePath: (p: string) => p },
        telemetry: { sendError() {}, send() {}, sendTrack() {} }
    });
    ls.configure({
        validate: true,
        hover: true,
        completion: true,
        yamlVersion: '1.2',
        schemas: [{ uri: `file:///s${++n}.json`, fileMatch: ['*.yml'], schema: schemaOf(where) }]
    });
    return ls;
}
const docOf = (text: string) => TextDocument.create(`file:///d${++n}.yml`, 'yaml', 1, text);

async function editor(where: Where, text: string): Promise<string[]> {
    const found = await service(where).doValidation(docOf(text), false);
    return found.map((d: any) => `${d.range.start.line + 1}: ${d.message}`);
}
async function completion(where: Where, text: string, line: number, character: number) {
    const found = await service(where).doComplete(docOf(text), { line, character }, false);
    return found.items.map((i: any) => i.label);
}
async function hover(where: Where, text: string, line: number, character: number) {
    const found = await service(where).doHover(docOf(text), { line, character });
    return found?.contents ?? null;
}
function ours(where: Where, text: string): string[] {
    const one = served[where];
    return checkDocument({ name: nameOf(where), file: one.rel, text }, one.set.texts, checker, portfolio.text).map(
        (o: any) => `${o.line ?? 0}: ${o.message}`
    );
}

const category = (sort: string) =>
    `categories:\n  - key: drafts\n    label: Drafts\n    color: '#888888'\n    sort: ${sort}\n`;
const board = (tier: string) => `boards:\n  - key: mine\n    label: Mine\n    tier: ${tier}\n`;
const skip = (tiers: string) => `research_audit:\n  skip_tiers: ${tiers}\n`;
const failure = (word: string) =>
    `connections:\n  failures:\n    - kind: Mine\n      for: ${word}\n      match: refused\n      fix: Sign in\n`;
const theme = (cls: string) =>
    `folders:\n  - { name: hub, path: . }\nprimary: hub\nsettings:\n  themes:\n    - name: mine\n      class: ${cls}\n`;

const cases: [string, Where, string][] = [
    ['C1 sort: [stage, nonsense]', 'hub', category('[stage, nonsense]')],
    ['C2 sort: nonsense', 'hub', category('nonsense')],
    ['C3 sort: year', 'hub', category('year')],
    ["C4 sort: 'stage year'", 'hub', category("'stage year'")],
    ['C5 sort: [year, title]', 'hub', category('[year, title]')],
    ['C6 tier: nonsense', 'layout', board('nonsense')],
    ['C6 tier: research', 'layout', board('research')],
    ['C7 skip_tiers: nonsense', 'hub', skip('nonsense')],
    ['C7 skip_tiers: [research, nonsense]', 'hub', skip('[research, nonsense]')],
    ['C7 skip_tiers: research', 'hub', skip('research')],
    ["C8 for: ''", 'hub', failure("''")],
    ["C11 class: 'dark any text  at all'", 'workspace', theme("'dark any text  at all'")],
    ['C11 class: nonsense', 'workspace', theme('nonsense')]
];
for (const [name, where, text] of cases) {
    console.log(`${name}  [${where}: ${nameOf(where)}]`);
    console.log(`    ours   ${JSON.stringify(ours(where, text))}`);
    console.log(`    editor ${JSON.stringify(await editor(where, text))}`);
}
// The value of `sort` is on line 5 (index 4), after `    sort: `, column 10.
for (const [name, value] of [
    ['C2', 'nonsense'],
    ['C3', 'year'],
    ['C3 empty', '']
]) {
    const text = category(value);
    const atEnd = await completion('hub', text, 4, 10 + value.length);
    console.log(`${name} completion at the end of 'sort: ${value}' ${JSON.stringify(atEnd)}`);
}
console.log(`C3 hover on sort ${JSON.stringify(await hover('hub', category('year'), 4, 5))}`);

// The value rule (catalog/value-rule.ts) on the same values, each field's spec read from the
// catalog, its source's items the words the served schema holds.
const { readCatalog } = await import(R + 'src/lib/data/sources/config/catalog/options.ts');
const { valueProblem } = await import(R + 'src/lib/data/sources/config/catalog/value-rule.ts');
const { catalog } = readCatalog(portfolio.merged);
const field = (file: string, key: string, name: string) => catalog[file][key].fields[name];
const rules: [string, any, string[] | undefined, unknown][] = [
    ['C1', field('catalogs/vocab.yml', 'categories', 'sort'), undefined, ['stage', 'nonsense']],
    ['C2', field('catalogs/vocab.yml', 'categories', 'sort'), undefined, 'nonsense'],
    ['C3', field('catalogs/vocab.yml', 'categories', 'sort'), undefined, 'year'],
    ['C4', field('catalogs/vocab.yml', 'categories', 'sort'), undefined, 'stage year'],
    ['C5', field('catalogs/vocab.yml', 'categories', 'sort'), undefined, ['year', 'title']],
    ['C6', field('layout.yml', 'boards', 'tier'), ['research', 'personal', 'software'], 'nonsense'],
    ['C6', field('layout.yml', 'boards', 'tier'), ['research', 'personal', 'software'], 'research'],
    ['C7', field('catalogs/vocab.yml', 'research_audit', 'value'), ['research', 'personal', 'software'], 'nonsense'],
    ['C7', field('catalogs/vocab.yml', 'research_audit', 'value'), ['research', 'personal', 'software'], ['research', 'nonsense']],
    ['C7', field('catalogs/vocab.yml', 'research_audit', 'value'), ['research', 'personal', 'software'], 'research'],
    ['C8', field('behavior.yml', 'connections.failures', 'for'), undefined, ''],
    ['C11', field('appearance.yml', 'themes', 'class'), null as any, 'dark any text  at all']
];
for (const [name, spec, sourced, value] of rules) {
    console.log(`${name} rule ${JSON.stringify(value)} => ${JSON.stringify(valueProblem(spec, value, { sourced }))}`);
}
// The values the head comment names where the schema and the rule part.
const sortSpec = field('catalogs/vocab.yml', 'categories', 'sort');
console.log(`held word: rule ${JSON.stringify(valueProblem(sortSpec, 'nonsense', { held: ['nonsense'] }))}`);
const { optionsSchema } = await import(R + 'src/lib/data/sources/config/catalog/schemas/options.ts');
const bare = { control: 'multi', help: '' };
console.log(`no words: schema ${JSON.stringify(optionsSchema({ x: bare as any }, { merged: portfolio.merged, items: () => [] }).properties)}`);
console.log(`no words: rule "a" => ${JSON.stringify(valueProblem(bare as any, 'a', {}))}`);
console.log(`no words: rule ["a"] => ${JSON.stringify(valueProblem(bare as any, ['a'], {}))}`);
console.log(`no words: rule [] => ${JSON.stringify(valueProblem(bare as any, [], {}))}`);
const audit = catalog['catalogs/vocab.yml'].research_audit;
// readCatalog leaves a family's control unset; the family rule is the rule's `records` control.
for (const v of [{ skip_tiers: [['research']] }, { skip_tiers: ['research'] }, { skip_tiers: 'research' }]) {
    console.log(`family rule ${JSON.stringify(v)} => ${JSON.stringify(valueProblem({ ...audit, control: 'records' }, v, {}))}`);
}
for (const [name, where, text] of [
    ['list of lists skip_tiers: [[research]]', 'hub', skip('[[research]]')],
    ['stages as a map { words: [building] }', 'layout', `boards:\n  - key: mine\n    label: Mine\n    stages: { words: [building] }\n`],
    ['stages as a map { words: building }', 'layout', `boards:\n  - key: mine\n    label: Mine\n    stages: { words: building }\n`],
    ['stages as a map { words: nonsense }', 'layout', `boards:\n  - key: mine\n    label: Mine\n    stages: { words: nonsense }\n`],
    ['stages as rows [{ key: words, value: [building] }]', 'layout', `boards:\n  - key: mine\n    label: Mine\n    stages: [{ key: words, value: [building] }]\n`]
] as [string, Where, string][]) {
    console.log(`${name}`);
    console.log(`    ours   ${JSON.stringify(ours(where, text))}`);
    console.log(`    editor ${JSON.stringify(await editor(where, text))}`);
}
console.log('tier as the layout schema serves it', JSON.stringify((schemaOf('layout') as any).properties.boards.items.properties.tier));
```

Output before (base copy), exit 0:

```
engineDir /Users/axelfaes/workspace/oculus
C1 sort: [stage, nonsense]  [hub: hub-config]
    ours   ["5: categories[0].sort[1] is nonsense, which is not one of stage, year, title"]
    editor ["5: Value is not accepted. Valid values: \"stage\", \"year\", \"title\"."]
C2 sort: nonsense  [hub: hub-config]
    ours   []
    editor []
C3 sort: year  [hub: hub-config]
    ours   []
    editor []
C4 sort: 'stage year'  [hub: hub-config]
    ours   []
    editor []
C5 sort: [year, title]  [hub: hub-config]
    ours   []
    editor []
C6 tier: nonsense  [layout: config/layout]
    ours   []
    editor []
C6 tier: research  [layout: config/layout]
    ours   []
    editor []
C7 skip_tiers: nonsense  [hub: hub-config]
    ours   []
    editor []
C7 skip_tiers: [research, nonsense]  [hub: hub-config]
    ours   []
    editor []
C7 skip_tiers: research  [hub: hub-config]
    ours   []
    editor []
C8 for: ''  [hub: hub-config]
    ours   []
    editor []
C11 class: 'dark any text  at all'  [workspace: workspace]
    ours   []
    editor []
C11 class: nonsense  [workspace: workspace]
    ours   []
    editor []
C2 completion at the end of 'sort: nonsense' []
C3 completion at the end of 'sort: year' []
C3 empty completion at the end of 'sort: ' []
C3 hover on sort {"kind":"markdown","value":"orders the category's cards after the pinned projects, its words read left to right: stage by the stage order, year newest first with no year last, title by its letters; a row with none goes by stage, then title\n\nSource: [s33.json](file:///s33.json)"}
C1 rule ["stage","nonsense"] => {"kind":"choice","values":["stage","year","title"]}
C2 rule "nonsense" => {"kind":"choice","values":["stage","year","title"]}
C3 rule "year" => null
C4 rule "stage year" => {"kind":"choice","values":["stage","year","title"]}
C5 rule ["year","title"] => null
C6 rule "nonsense" => {"kind":"source","sources":["tiers"]}
C6 rule "research" => null
C7 rule "nonsense" => {"kind":"source","sources":["tiers"]}
C7 rule ["research","nonsense"] => {"kind":"source","sources":["tiers"]}
C7 rule "research" => null
C8 rule "" => {"kind":"choice","values":["cluster","git"]}
C11 rule "dark any text  at all" => {"kind":"words"}
held word: rule null
no words: schema {"x":{"type":["array","string"],"items":{"type":"string"}}}
no words: rule "a" => {"kind":"choice","values":[]}
no words: rule ["a"] => {"kind":"choice","values":[]}
no words: rule [] => null
family rule {"skip_tiers":[["research"]]} => {"kind":"pairs"}
family rule {"skip_tiers":["research"]} => null
family rule {"skip_tiers":"research"} => null
list of lists skip_tiers: [[research]]
    ours   []
    editor []
stages as a map { words: [building] }
    ours   []
    editor []
stages as a map { words: building }
    ours   []
    editor []
stages as a map { words: nonsense }
    ours   []
    editor []
stages as rows [{ key: words, value: [building] }]
    ours   ["4: boards[0].stages[0].value is [\"building\"], which is not a key of project_stages"]
    editor ["4: Value is not accepted. Valid values: \"nascent\", \"scoping\", \"de-risking\", \"exploring\", \"in-prep\", \"building\", \"submit-ready\", \"submitted\", \"revision\", \"accepted\", \"published\", \"released\", \"failed\", \"stopped\"."]
tier as the layout schema serves it {"type":["array","string"],"items":{"enum":["research","personal","software"]},"description":"the tier, or the list of tiers, whose projects the board takes"}
```

Output after (worktree), exit 0:

```
engineDir /Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O131
C1 sort: [stage, nonsense]  [hub: hub-config]
    ours   ["5: categories[0].sort does not fit the schema of this file"]
    editor ["5: Value is not accepted. Valid values: \"stage\", \"year\", \"title\"."]
C2 sort: nonsense  [hub: hub-config]
    ours   ["5: categories[0].sort does not fit the schema of this file"]
    editor ["5: Value is not accepted. Valid values: \"stage\", \"year\", \"title\"."]
C3 sort: year  [hub: hub-config]
    ours   []
    editor []
C4 sort: 'stage year'  [hub: hub-config]
    ours   ["5: categories[0].sort does not fit the schema of this file"]
    editor ["5: Value is not accepted. Valid values: \"stage\", \"year\", \"title\"."]
C5 sort: [year, title]  [hub: hub-config]
    ours   []
    editor []
C6 tier: nonsense  [layout: config/layout]
    ours   ["4: boards[0].tier does not fit the schema of this file"]
    editor ["4: Value is not accepted. Valid values: \"research\", \"personal\", \"software\"."]
C6 tier: research  [layout: config/layout]
    ours   []
    editor []
C7 skip_tiers: nonsense  [hub: hub-config]
    ours   ["2: research_audit.skip_tiers does not fit the schema of this file"]
    editor ["2: Value is not accepted. Valid values: \"research\", \"personal\", \"software\"."]
C7 skip_tiers: [research, nonsense]  [hub: hub-config]
    ours   ["2: research_audit.skip_tiers does not fit the schema of this file"]
    editor ["2: Value is not accepted. Valid values: \"research\", \"personal\", \"software\"."]
C7 skip_tiers: research  [hub: hub-config]
    ours   []
    editor []
C8 for: ''  [hub: hub-config]
    ours   ["4: connections.failures[0].for does not fit the schema of this file"]
    editor ["4: Value is not accepted. Valid values: \"cluster\", \"git\"."]
C11 class: 'dark any text  at all'  [workspace: workspace]
    ours   []
    editor []
C11 class: nonsense  [workspace: workspace]
    ours   []
    editor []
C2 completion at the end of 'sort: nonsense' ["stage","year","title"]
C3 completion at the end of 'sort: year' ["stage","year","title"]
C3 empty completion at the end of 'sort: ' ["stage","year","title"]
C3 hover on sort {"kind":"markdown","value":"orders the category's cards after the pinned projects, its words read left to right: stage by the stage order, year newest first with no year last, title by its letters; a row with none goes by stage, then title\n\nAllowed Values:\n\n* `year`\n* `stage`\n* `title`\n\nSource: [s33.json](file:///s33.json)"}
C1 rule ["stage","nonsense"] => {"kind":"choice","values":["stage","year","title"]}
C2 rule "nonsense" => {"kind":"choice","values":["stage","year","title"]}
C3 rule "year" => null
C4 rule "stage year" => {"kind":"choice","values":["stage","year","title"]}
C5 rule ["year","title"] => null
C6 rule "nonsense" => {"kind":"source","sources":["tiers"]}
C6 rule "research" => null
C7 rule "nonsense" => {"kind":"source","sources":["tiers"]}
C7 rule ["research","nonsense"] => {"kind":"source","sources":["tiers"]}
C7 rule "research" => null
C8 rule "" => {"kind":"choice","values":["cluster","git"]}
C11 rule "dark any text  at all" => {"kind":"words"}
held word: rule null
no words: schema {"x":{"type":["array","string"],"items":{"type":"string"}}}
no words: rule "a" => {"kind":"choice","values":[]}
no words: rule ["a"] => {"kind":"choice","values":[]}
no words: rule [] => null
family rule {"skip_tiers":[["research"]]} => {"kind":"pairs"}
family rule {"skip_tiers":["research"]} => null
family rule {"skip_tiers":"research"} => null
list of lists skip_tiers: [[research]]
    ours   []
    editor []
stages as a map { words: [building] }
    ours   []
    editor []
stages as a map { words: building }
    ours   []
    editor []
stages as a map { words: nonsense }
    ours   ["4: boards[0].stages.words does not fit the schema of this file"]
    editor ["4: Value is not accepted. Valid values: \"nascent\", \"scoping\", \"de-risking\", \"exploring\", \"in-prep\", \"building\", \"submit-ready\", \"submitted\", \"revision\", \"accepted\", \"published\", \"released\", \"failed\", \"stopped\"."]
stages as rows [{ key: words, value: [building] }]
    ours   ["4: boards[0].stages[0].value is [\"building\"], which is not a key of project_stages"]
    editor ["4: Value is not accepted. Valid values: \"nascent\", \"scoping\", \"de-risking\", \"exploring\", \"in-prep\", \"building\", \"submit-ready\", \"submitted\", \"revision\", \"accepted\", \"published\", \"released\", \"failed\", \"stopped\"."]
tier as the layout schema serves it {"anyOf":[{"type":"string","enum":["research","personal","software"]},{"type":"array","items":{"enum":["research","personal","software"]}}],"description":"the tier, or the list of tiers, whose projects the board takes"}
```

After the change a wrong word in either form gives a message that opens `Value is not accepted. Valid values:` and names the field's words; no diagnostic in the after output says the value must be a list.

## DONE / NOT DONE

| Item | State | Proof (command and its line) |
| --- | --- | --- |
| 1. `multiSchema` gives form B for a non-`joined` multi with held words; any text or texts while not held; `joined` one text of words separated by single spaces (repair round 1) | DONE | case-run after: `tier as the layout schema serves it {"anyOf":[{"type":"string","enum":["research","personal","software"]},{"type":"array","items":{"enum":["research","personal","software"]}}],"description":"the tier, or the list of tiers, whose projects the board takes"}`; `no words: schema {"x":{"type":["array","string"],"items":{"type":"string"}}}`; C11 after round 1: `ours` and `editor` each one problem on line 7 for `'dark  contrast'`; the map keyed by its picking field: `stages as a map { words: nonsense }` gives one problem after, none before; the `holds: lists` family: C7 rows |
| 2. Doc comment of `multiSchema`, head comment of `options.ts`, head comment of `options-schema.test.ts`; grep of `multiSchema`, "one text of words", "joined by spaces" | DONE | `grep -rn --exclude=local.yml -e "multiSchema" -e "one text of words" -e "joined by spaces" src docs config tests README.md` prints `src/lib/server/sessions/stores/turns.ts:228: * list is taken whenever it holds a string, joined by spaces, even when that joins to nothing, and` (a session store's text, unrelated, still true), `src/lib/data/sources/config/catalog/schemas/options.ts:122:function multiSchema(spec: FieldSpec, lists: OptionLists): JsonSchema {` and `src/lib/data/sources/config/catalog/schemas/options.ts:178:            return multiSchema(spec, lists);` |
| 3. The describe 'the schema of a multi', one row per case C1 to C7 | DONE | first run above; after: `npx vitest run tests/data/sources/config/catalog/options-schema.test.ts tests/checks/config/config-folder.test.ts tests/data/sources/config/catalog/options.test.ts --reporter=verbose` shows all seven rows with `<check mark>`, last lines `Test Files  3 passed (3)` / `Tests  60 passed \| 2 skipped (62)` |
| 4. The case-run program, before and after, C1 to C8, completion for C2 and C3 | DONE | source and both outputs above, each run exit 0 |
| C9 | DONE | the verify run 1: `<check mark> \|unit\| tests/checks/config/config-folder.test.ts > oculus's own config directory > passes every config file through the schema it is matched to 783ms` |
| C10 | DONE | the verify run 1: `<check mark> \|unit\| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a collections entry > passes the .oculus/config.yml Make Folder a Hub writes with every collection ticked 90ms` |
| Verify 1 | DONE | `Test Files  3 passed (3)`; `Tests  60 passed \| 2 skipped (62)`; `Duration  25.07s (transform 14.64s, setup 0ms, import 21.42s, tests 13.59s, environment 1ms)`. The 2 skipped: `config-folder: the cases over a real hub skipped, since OCULUS_TEST_HUB is not set` |
| Verify 2 `npm run test:quick` once, after `npm run diagrams` | DONE | exit 0; lines below |
| Verify 3 the ASCII gate (perl form) | DONE | printed no line, exit 0; find wrote `find: bin: No such file or directory` to stderr, since the tree has no `bin` folder |
| Verify 4 each new test run on the unchanged tree and after | DONE | first run and after run above |
| Verify 5 list items and sentence length | DONE | see "Sentences read against the standards" below |
| `sh utils/unused-exports.sh` against the base | DONE | `diff ../O131-base/unused-exports.txt <output>` printed nothing, exit 0: the step adds no line |

The result lines of `npm run test:quick` (run once):

```
test:quick: 2 changed file(s), from git since HEAD
test:quick: 13 test file(s)
ok      prettier (0.9 s): All matched files use Prettier code style!
ok      ASCII gate (1.0 s)
ok      svelte-kit sync (2.5 s)
ok      eslint (13.0 s)
ok      vitest (27.7 s): Duration  12.71s (transform 11.66s, setup 0ms, import 25.93s, tests 8.10s, environment 2ms)
ok      svelte-check (37.3 s): 1793719634324 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (50.1 s): Duration  35.01s (transform 23.70s, setup 0ms, import 45.39s, tests 57.04s, environment 2ms)
test:quick: 52.8 s; every command passed
```

Its 13 test files include `options-schema.test.ts` (changed), `options.test.ts` (named for a changed file), `tests/data/sources/config/boards.test.ts` and `tests/state/boards/board/board-rules.test.ts` (imports at depth 2), and the checks under `tests/checks/source` and `tests/checks/tree` that scan a changed file. Its own "not covered" line: tests that reach no changed file within the import depth, the build, the lint of unchanged files. `npm run diagrams` rewrote no tracked file (`git status --short` afterwards lists only the two changed files). No whole-suite command was run; the list ran once.

## Files

`git diff c0f69529b --numstat` after repair round 1 lists three files, `docs/HELP.md` added to the write list by the round:

| File | Lines now | `git diff --numstat` |
| --- | --- | --- |
| `src/lib/data/sources/config/catalog/schemas/options.ts` | 455 | 36 added, 8 removed |
| `tests/data/sources/config/catalog/options-schema.test.ts` | 216 | 78 added, 7 removed |
| `docs/HELP.md` | 617 | 1 added, 1 removed |
| `.scratch/migration/agents/reviews/O131-report.md` | this report | new |

The test file's removed lines are the head comment's lines 5 to 11, rewrapped as one paragraph with the new sentence; no existing assertion, allow list or predicate is changed (`diff` of the file against the base copy lists only those comment lines on its `<` side).

## The code

```ts
function multiSchema(spec: FieldSpec, lists: OptionLists): JsonSchema {
    if (spec.joined === true) return { type: 'string', pattern: JOINED_FORM };
    const words = pickedSources(spec) === undefined ? wordsOf(spec, lists) : null;
    if (words === null || words.length === 0) {
        return { type: ['array', 'string'], items: { type: 'string' } };
    }
    return {
        anyOf: [
            { type: 'string', enum: words },
            { type: 'array', items: { enum: words } }
        ]
    };
}
```

## Comments and documents read

- `options.ts` head comment (lines 11-22): rewritten. It names the multi among what the schema holds and the four kinds of value where the schema and the rule part, each run in the case-run: a word outside the words that the file holds (`held word: rule null`, while C2 is refused after), a multi with no words (`no words: schema {"x":{"type":["array","string"],"items":{"type":"string"}}}`, any text or texts; the rule `{"kind":"choice","values":[]}` for `"a"` and `["a"]`), a `joined` text with a doubled space (C11: schema none, rule `{"kind":"words"}`), a list of lists in `research_audit` (`family rule {"skip_tiers":[["research"]]} => {"kind":"pairs"}`, schema none).
- `multiSchema` doc comment: rewritten.
- `options-schema.test.ts` head comment: rewritten, one sentence added for the new describe.
- `pickedByKey`, `familySchema`, `choiceSchema`, `wordsOf` doc comments in `options.ts`: still true.
- `check.ts` head comment and `surfaced` doc comment: still true.
- `value-rule.ts` `multiProblem` doc comment: still true (file not changed).
- `config/options/appearance.yml:10-11` (the multi and `joined: true` descriptions) and `src/lib/data/shapes/catalog-files/options.ts:57` ('true writes a multi as one text, its words separated by spaces.'): still true.
- `docs/HELP.md:570` ("In a YAML file the editor checks, Ctrl+Space completes the keys, each with its description: the options of the defaults files, a workspace file's `settings:`, a hub's `config.yml` and `local.yml`, the catalogs, the schemas and the hub's data files."): repair round 1 adds the sentence "A value of a choice or a multi whose words oculus holds is completed from them, and a word outside them is marked."

History-word grep over the added lines: `git diff -U0 | grep '^+' | grep -v '^+++' | grep -inE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O1[0-9][0-9]|20[0-9][0-9]-"` printed nothing, exit 1.

Reuse grep before the test helpers: `grep -rn -E "function (categoryWith|boardWith|auditWith)|const (inHub|inLayout|MULTIS) " src tests` (outside the test file) finds only three unrelated local variables named `inHub` (`src/lib/server/content/audit/projects.ts:578`, `tests/data/snapshot/reference-hub.ts:298`, `tests/routes/docs/docs.test.ts:61`); no helper that builds these texts exists.

## Sentences read against the standards

The standards page is `spec.md`, whose prose rule is plain ASCII with no em dashes, no quips and no 'not X but Y' construction; it gives no sentence-length or list-item rule. The head comment's last sentence holds the four kinds of value in one sentence split by semicolons, since each is one value with what the schema and the rule do to it; it is the longest new sentence. Each comment paragraph was rewrapped whole at 100 columns (the `comment-width` check in test:quick passed).

## Judgment calls the brief left open

1. The test's table has one row per case, each row a list of texts with the lines their problems are on, so C6 (two texts) and C7 (three texts) are one row each; the comparison is the problems' line prefixes (`'5:'`), which carries the count and the line.
2. The test texts write the row in block form, so the multi's line (5, 4, 2) differs from the line of the row or the list that holds it.
3. The head comment names each kind of value where the schema and the rule part, with no count; after repair round 1 the `joined` spacing is not one of them, since the schema holds it to the rule's form.
4. The `joined` check moved to the top of `multiSchema`; internal.
5. `docs/HELP.md:570` carries one sentence on the completion and the marks of a choice's or a multi's value (repair round 1).

## Host- or user-visible changes, before and after

For the look on landing: open a hub's `.oculus/config.yml` (or `config/defaults/layout.yml`) in a Source tab on a scratch server, and write a category row with `sort: nonsense`.

- Marks of a one-text multi: before, `sort: nonsense`, `sort: 'stage year'`, a board's `tier: nonsense`, `research_audit.skip_tiers: nonsense` and `skip_tiers: [research, nonsense]`, and `connections.failures` `for: ''` had no mark. After, each has the mark `Value is not accepted. Valid values: "stage", "year", "title".` (with each field's own words) on its line. A list with a wrong word (`sort: [stage, nonsense]`) has the same mark before and after.
- A word of a board's `stages: { words: nonsense }` (the map keyed by its picking field): before no mark, after the mark listing the 14 stages.
- Completion at a multi's text position: before, Ctrl+Space at `sort: `, at the end of `sort: year` and at the end of `sort: nonsense` offered nothing; after it offers `stage`, `year`, `title`.
- Hover on `sort` in oculus's editor: before, the help line alone; after, the help line, then `Allowed Values:` with the three words; the language service puts the word written first, so `sort: year` lists `year`, `stage`, `title` and `sort: nonsense` lists `title`, `stage`, `year`. Oculus sends `hoverSchemaSource: false` (`src/lib/server/machine/lsp/adapters/yaml/settings.ts:14`), so no source line shows before or after; the `Source: [s33.json](file:///s33.json)` line in the case-run's hover output comes from the language service's default (`hoverSchemaSource ?? true`, `node_modules/yaml-language-server/lib/umd/languageservice/services/yamlHover.js:72`), which the program does not set.
- A theme row's `class` in a workspace file's `settings:` (`.oculus/workspaces/<name>.yml`, `settings: { themes: [ { name: mine, class: 'dark  contrast' } ] }`): before, a doubled, leading or trailing space had no mark; after, the mark `String does not match the pattern of "^$|^[^ ]+( [^ ]+)*$".` on its line, and oculus's checker gives the same text a finding (repair round 1).
- `check.ts`'s sentence for a wrong word of a list multi changes from `categories[0].sort[1] is nonsense, which is not one of stage, year, title` to `categories[0].sort does not fit the schema of this file`, and the same sentence is given for a one-text wrong word; the brief's premise (line 18) says that sentence reaches no reader of a config file outside the two tests, and test:quick passed with no test asserting the old sentence.

## Anything in the brief that was wrong or impossible

Nothing in the brief turned out wrong. Two points beside it:

- Decision 4 said a `joined` multi gets no rule over its text since its words come from a source the schema never holds. That reason covers the words and not the spacing, which the rule refuses without any source (C11 rule run: `"dark any text  at all" => {"kind":"words"}`). Repair round 1 reversed the decision: the schema holds the text to the joined form `^$|^[^ ]+( [^ ]+)*$`.
- The brief cites `familyProblem` for the list of lists. `valueProblem` reaches it only for an entry whose control is `records`; `readCatalog` leaves the `research_audit` entry's control unset, so the program runs it as `{ ...audit, control: 'records' }` (`family rule {"skip_tiers":[["research"]]} => {"kind":"pairs"}`). The Settings write's own path to it (`config-fit.ts` `familyProblem`) was not run.

## Limitations and sharp edges

- A word outside the words that the file already holds is marked by the editor while the Settings write takes it (`held word: rule null`); this held for a list before and now holds for one text as well. The schema has no list of the held words.
- The rows form of a board's word block, `stages: [{ key: words, value: [building] }]`, is marked before and after (`boards[0].stages[0].value is ["building"], which is not a key of project_stages`), because `pickedRules` (`options.ts:211-226`) holds such a row's `value` to `enum` of the words, which a list fails. The change does not touch it: it is the family's rows form, which the board reader refuses anyway (`blockOf` in `src/lib/data/shapes/boards/words.ts:33` reads a map only, and `mapFindings` at `src/lib/data/sources/config/sections/boards.ts:84` gives a finding for a value that is no map).
- A multi with no words, and an empty list for any multi (`no words: rule [] => null`), are taken by the schema; the rule refuses every word of a multi with no words.
- `connections.failures` `for: []` passes both the schema and the rule; its help line says an empty list is a finding, which neither reads (not run beyond the rule's `[] => null` for a bare multi).
- The case-run program calls yaml-language-server's language service from the worktree's `node_modules` with validation, hover and completion on and YAML 1.2, as `YAML_SETTINGS` in `src/lib/server/machine/lsp/adapters/yaml/settings.ts` sets them, and leaves `hoverSchemaSource` at the service's default `true` where `YAML_SETTINGS` sets it false; it does not run the server process oculus starts, so the look on landing is the proof of what the editor shows.
- The base run read `/Users/axelfaes/workspace/oculus/config/` and `node_modules` of the main checkout through `engineDir()` and module resolution, read only; that config is identical to the base copy's (`diff -rq` exit 0).

## Repair round 1

Every item of `agents/briefs/O131-round-1.md` is done. The sections above state the end state after the round.

### Item 1: a `joined` multi is held to the rule's spacing

The rule and the pattern over the seven texts, run before the pattern was written into the code, by the round's case-run program (source below), lines verbatim with the tab written `<tab>`:

```
"" rule null schema takes
"dark" rule null schema takes
"dark contrast" rule null schema takes
" dark" rule {"kind":"words"} schema refuses
"dark " rule {"kind":"words"} schema refuses
"dark  contrast" rule {"kind":"words"} schema refuses
"dark<tab>contrast" rule null schema takes
```

The rule and the pattern agree on every row, so the round's pattern was kept unchanged. Code (`src/lib/data/sources/config/catalog/schemas/options.ts:114-130`):

```ts
/**
 * The form of a `joined` multi's text as the value rule reads it: the empty text, or words
 * separated by single spaces, with no space before the first or after the last.
 */
const JOINED_FORM = '^$|^[^ ]+( [^ ]+)*$';

/**
 * A multi: one of its words alone or a list of them, as the value rule reads a multi that is not
 * `joined`, the text first so the editor's message for a wrong word lists the words. A word outside
 * them is refused even where the file already holds it, which the rule takes only from the Settings
 * write. While its words are not held (its picking field names the source, or the build does not
 * hold a source it names) it is one text or a list of texts, and so is a multi with no words, whose
 * every word the rule refuses. A `joined` multi is one text of words separated by single spaces,
 * any words, since its one field draws from a source the schema never holds.
 */
function multiSchema(spec: FieldSpec, lists: OptionLists): JsonSchema {
    if (spec.joined === true) return { type: 'string', pattern: JOINED_FORM };
```

The new test row of describe 'the schema of a multi', "a theme's joined class in a workspace file", reads a workspace file whose `settings:` theme row has `class: 'dark contrast'` (no problem) and `class: 'dark  contrast'` (one problem, line 7), through a new reader `inWorkspace` (`problemsOf(schemas, 'hub', '.oculus/workspaces/mine.yml', text)`) and a new text builder `themeWith`. Its run on the code before this round's change (`npx vitest run tests/data/sources/config/catalog/options-schema.test.ts -t "the schema of a multi" --reporter=verbose`), verbatim:

```
 <cross> |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of a theme's joined class in a workspace file on their lines 62ms
   <right arrow> expected [ [], [] ] to deeply equal [ [], [ '7:' ] ]
 FAIL  |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of a theme's joined class in a workspace file on their lines
AssertionError: expected [ [], [] ] to deeply equal [ [], [ '7:' ] ]
      Tests  1 failed | 7 passed | 10 skipped (18)
```

The failure pointed at `options-schema.test.ts:213:23`, the `expect` line of the describe, now line 214 since the head comment gained a line after that run. The row is the proof of item 1: its second text fails on the code before the change. Its first text (`'dark contrast'`) is an audit, passing before and after. The row was not edited after that run except by the head comment above it.

C11 by the brief's case-run program after the round (`node /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o131-builder/cases.mts` from the worktree's root, exit 0), the only lines that differ from its "Output after (worktree)" above:

```
C11 class: 'dark any text  at all'  [workspace: workspace]
    ours   ["7: settings.themes[0].class is dark any text  at all, which does not match the form ^$|^[^ ]+( [^ ]+)*$"]
    editor ["7: String does not match the pattern of \"^$|^[^ ]+( [^ ]+)*$\"."]
```

`C11 class: nonsense` still gives `ours []` and `editor []`: the words stay any text.

### Item 2: the head comment and the doc comment

- `options.ts` head comment (lines 11-24): rewritten. It says a choice drawn from a source only the page holds is any text, a multi drawn from one is one text or a list of texts, and a `joined` one is one text of words separated by single spaces. The sentence on where the schema and the rule part gives no count, drops the `joined` spacing, and names four kinds, each run by the round's program or the brief's: a word outside the words that the file holds (`held word: rule null`), a multi with no words, a list of lists in a `holds: lists` map (`family rule {"skip_tiers":[["research"]]} => {"kind":"pairs"}`, schema none), and a keyed family in the wrong one of its two forms.
- The last kind covers both directions, since the round's program found the second: `layout boards as a map: rule {"kind":"records"} schema []` (a list of rows written as a map) beside the review's `layout stages as rows of one text: rule {"kind":"pairs"} schema []` (a map from a key to a value written as a list of rows). The clause says "is taken here when its rows or values fit their fields", since the schema still holds the rows' and values' fields in the wrong form: `layout stages as rows` with `value: [building]` gives a problem from the rows' picking rule, and `layout boards as a map, a wrong tier` gives `2: boards.mine.tier does not fit the schema of this file`. In a hub's `.oculus/config.yml` the vocabulary's whole-file shapes hold the form (`research_audit as rows: rule {"kind":"pairs"} schema ["2: research_audit must be a map, not a list"]`, `categories as a map: rule {"kind":"records"} schema ["2: categories must be a list, not a map"]`); the head comment speaks of the schema `options.ts` makes.
- `multiSchema` doc comment: rewritten to item 1 ("A `joined` multi is one text of words separated by single spaces, any words, since its one field draws from a source the schema never holds."). A doc comment for `JOINED_FORM` is added.
- `options-schema.test.ts` head comment: one sentence added for the new row ("A theme's `joined` class in a workspace file's `settings:` takes words separated by single spaces, and a doubled space is a problem on its line."), the paragraph rewrapped.

### Item 3: `docs/HELP.md:570`

One clause added at the end of the bullet, on its one line: "A value of a choice or a multi whose words oculus holds is completed from them, and a word outside them is marked." The words "whose words oculus holds" are there because a choice or a multi drawn from a source only the page holds is any text, with no completion and no mark (`C11 class: nonsense` gives none).

### Item 4: the hover bullet

Corrected in place in "Host- or user-visible changes, before and after": oculus's editor shows the help line alone before and the help line with `Allowed Values:` after, with no source line in either, since oculus sends `hoverSchemaSource: false` (`src/lib/server/machine/lsp/adapters/yaml/settings.ts:14`) and the source line comes from `hoverSchemaSource ?? true` (`yamlHover.js:72`). The limitation bullet on the case-run program now names that it leaves `hoverSchemaSource` at that default.

### The round's case-run program

`/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o131-builder/round1.mts`, run from the worktree's root as `node <path>`, exit 0, writing nothing:

```ts
// The case-run program of O131's repair round 1: the value rule and the joined multi's pattern
// schema over the seven texts the round names, side by side. It writes nothing.
import { createRequire } from 'node:module';
const W = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O131/';
const require = createRequire(W + 'package.json');
const Ajv = require(W + 'node_modules/ajv');
const { valueProblem } = await import(W + 'src/lib/data/sources/config/catalog/value-rule.ts');
const spec = { control: 'multi', joined: true, from: 'theme_classes', help: '' };
const schema = { type: 'string', pattern: '^$|^[^ ]+( [^ ]+)*$' };
const validate = new Ajv().compile(schema);
const shown = (text: string) => JSON.stringify(text).replaceAll('\\t', '<tab>');
// A family in the form the rule reads and in the other one, by the rule (its `records` control,
// which readCatalog leaves unset) and by oculus's checker over the schema served to a hub's file.
const { join } = await import('node:path');
const { portfolioConfigFrom } = await import(W + 'src/lib/data/index.ts');
const { HUB_FILE } = await import(W + 'src/lib/data/helpers/hub-names.ts');
const { createChecker, checkDocument } = await import(W + 'src/lib/data/snapshot/schema/check.ts');
const { schemaFor } = await import(W + 'src/lib/data/snapshot/schema/set.ts');
const { engineDir, loadConfig } = await import(W + 'src/lib/data/sources/config.ts');
const { withOwnSchemas } = await import(W + 'src/lib/server/root/watch/build.ts');
const { buildOneHub } = await import(W + 'tests/fixtures/hubs/hub-build.ts');
const { DEMO_HUB } = await import(W + 'tests/fixtures/hubs/real-hub.ts');
const { readCatalog } = await import(W + 'src/lib/data/sources/config/catalog/options.ts');
const { config } = loadConfig(engineDir(), { hub: DEMO_HUB });
const portfolio = portfolioConfigFrom(config);
const checker = createChecker();
const built = buildOneHub(DEMO_HUB, portfolio, 1, [], checker, { dir: join(engineDir(), 'config'), held: [{ root: 'config', path: '' }] }, 'hub');
const hub = withOwnSchemas(built.schemas);
const hubName = schemaFor(hub, 'hub', HUB_FILE)!;
const ours = (text: string) =>
    checkDocument({ name: hubName, file: HUB_FILE, text }, hub.texts, checker, portfolio.text).map((o: any) => `${o.line}: ${o.message}`);
const { catalog } = readCatalog(portfolio.merged);
const vocab = catalog['catalogs/vocab.yml'];
const families: [string, any, unknown, string][] = [
    ['research_audit as a map', vocab.research_audit, { skip_tiers: ['research'] }, 'research_audit:\n  skip_tiers: [research]\n'],
    ['research_audit as rows', vocab.research_audit, [{ key: 'skip_tiers', value: ['research'] }], 'research_audit:\n  - { key: skip_tiers, value: [research] }\n'],
    ['categories as rows', vocab.categories, [{ key: 'drafts', label: 'Drafts' }], 'categories:\n  - { key: drafts, label: Drafts }\n'],
    ['categories as a map', vocab.categories, { drafts: { label: 'Drafts' } }, 'categories:\n  drafts: { label: Drafts }\n']
];
for (const [name, entry, value, text] of families) {
    const rule = JSON.stringify(valueProblem({ ...entry, control: 'records' }, value, {}));
    console.log(`${name}: rule ${rule} schema ${JSON.stringify(ours(text))}`);
}
// The same in config/defaults/layout.yml, whose schema is the options catalog's alone.
const layoutName = schemaFor(built.schemas, 'config', 'defaults/layout.yml')!;
const inLayout = (text: string) =>
    checkDocument({ name: layoutName, file: 'defaults/layout.yml', text }, built.schemas.texts, checker, portfolio.text).map((o: any) => `${o.line}: ${o.message}`);
const layout = catalog['layout.yml'];
const stages = layout.boards.fields.stages;
const layoutFamilies: [string, any, unknown, string][] = [
    ['boards as rows', layout.boards, [{ key: 'mine', label: 'Mine' }], 'boards:\n  - { key: mine, label: Mine }\n'],
    ['boards as a map', layout.boards, { mine: { label: 'Mine' } }, 'boards:\n  mine: { label: Mine }\n'],
    ['stages as a map', stages, { words: ['building'] }, 'boards:\n  - { key: mine, label: Mine, stages: { words: [building] } }\n'],
    ['stages as rows', stages, [{ key: 'words', value: ['building'] }], 'boards:\n  - { key: mine, label: Mine, stages: [{ key: words, value: [building] }] }\n'],
    ['stages as rows of one text', stages, [{ key: 'words', value: 'building' }], 'boards:\n  - { key: mine, label: Mine, stages: [{ key: words, value: building }] }\n'],
    ['boards as a map, a wrong tier', layout.boards, { mine: { label: 'Mine', tier: 'nonsense' } }, 'boards:\n  mine: { label: Mine, tier: nonsense }\n']
];
for (const [name, entry, value, text] of layoutFamilies) {
    const rule = JSON.stringify(valueProblem({ ...entry, control: 'records' }, value, {}));
    console.log(`layout ${name}: rule ${rule} schema ${JSON.stringify(inLayout(text))}`);
}
for (const text of ['', 'dark', 'dark contrast', ' dark', 'dark ', 'dark  contrast', 'dark\tcontrast']) {
    const rule = JSON.stringify(valueProblem(spec as any, text, {}));
    console.log(`${shown(text)} rule ${rule} schema ${validate(text) ? 'takes' : 'refuses'}`);
}
```

Its output after the round's last change:

```
research_audit as a map: rule null schema []
research_audit as rows: rule {"kind":"pairs"} schema ["2: research_audit must be a map, not a list"]
categories as rows: rule null schema []
categories as a map: rule {"kind":"records"} schema ["2: categories must be a list, not a map"]
layout boards as rows: rule null schema []
layout boards as a map: rule {"kind":"records"} schema []
layout stages as a map: rule null schema []
layout stages as rows: rule {"kind":"pairs"} schema ["2: boards[0].stages[0].value is [\"building\"], which is not a key of project_stages"]
layout stages as rows of one text: rule {"kind":"pairs"} schema []
layout boards as a map, a wrong tier: rule {"kind":"records"} schema ["2: boards.mine.tier does not fit the schema of this file"]
"" rule null schema takes
"dark" rule null schema takes
"dark contrast" rule null schema takes
" dark" rule {"kind":"words"} schema refuses
"dark " rule {"kind":"words"} schema refuses
"dark  contrast" rule {"kind":"words"} schema refuses
"dark<tab>contrast" rule null schema takes
```

### The round's checks, after the last change

| Check | Result |
| --- | --- |
| Brief check 1, `npx vitest run tests/data/sources/config/catalog/options-schema.test.ts tests/checks/config/config-folder.test.ts tests/data/sources/config/catalog/options.test.ts --reporter=verbose` | `Test Files  3 passed (3)`; `Tests  61 passed \| 2 skipped (63)`; `Duration  26.02s (transform 13.83s, setup 0ms, import 21.02s, tests 15.12s, environment 1ms)`; among its lines ` <check mark> \|unit\| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a multi > places the problems of a theme's joined class in a workspace file on their lines 67ms`, ` <check mark> \|unit\| tests/checks/config/config-folder.test.ts > oculus's own config directory > passes every config file through the schema it is matched to 887ms` (C9) and ` <check mark> \|unit\| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a collections entry > passes the .oculus/config.yml Make Folder a Hub writes with every collection ticked 101ms` (C10) |
| Brief check 2, `npm run diagrams` then `npm run test:quick` | exit 0, lines below |
| Brief check 3 and the round's ASCII gate, the perl form over `find src tests config -type f ! -name local.yml` and `docs/HELP.md` | printed nothing, exit 0 |
| Brief check 4 | the new row's run before the change is quoted above; after, it passes |
| Brief check 5 | the new sentences are read below |
| Unused exports, `sh utils/unused-exports.sh` compared with `../O131-base/unused-exports.txt` | `diff` printed nothing, exit 0; `JOINED_FORM` is not exported |
| Item 2's grep with `JOINED_FORM` added, `grep -rn --exclude=local.yml -e "multiSchema" -e "one text of words" -e "joined by spaces" -e "JOINED_FORM" src docs config tests README.md` | `turns.ts:228` (unrelated, still true), `options.ts:18`, `:118`, `:126`, `:129`, `:130`, `:185`, all of this step |
| History-word grep over the added lines | one hit, `+ * separated by single spaces, with no space before the first or after the last.`: "before" is a place in the text there, not a time; judged no defect |

`npm run test:quick` after the last change, its result lines:

```
test:quick: 6 changed file(s), from git since HEAD
test:quick: 13 test file(s)
ok      prettier (1.0 s): All matched files use Prettier code style!
ok      ASCII gate (1.1 s)
ok      svelte-kit sync (2.6 s)
ok      svelte-check (10.6 s): 1793721131632 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      eslint (10.8 s)
ok      vitest (23.1 s): Duration  10.54s (transform 10.21s, setup 0ms, import 19.80s, tests 7.59s, environment 2ms)
ok      vitest checks (49.1 s): Duration  36.28s (transform 15.00s, setup 0ms, import 30.85s, tests 51.26s, environment 3ms)
test:quick: 51.9 s; every command passed
```

The list ran twice in this round, each after `npm run diagrams`, the second after the last change; brief check 1 ran twice as well. No whole-suite command was run. `npm run diagrams` rewrote no tracked file (`git status --short` lists no path under `docs/diagrams`).

### Sentences read against the standards

The rules file gives no sentence-length or list-item rule. The head comment's last sentence is longer than the round 0 one: it holds four kinds of value, each with what the schema and the rule do, split by semicolons, and the last kind holds its two directions after a comma. The HELP clause is one sentence on the bullet's one line, with no hard wrap. Each comment paragraph is rewrapped whole at 100 columns (`comment-width` passed in test:quick).

### Files after the round

| File | Lines now | `git diff --numstat` against the base |
| --- | --- | --- |
| `src/lib/data/sources/config/catalog/schemas/options.ts` | 455 | 36 added, 8 removed |
| `tests/data/sources/config/catalog/options-schema.test.ts` | 216 | 78 added, 7 removed |
| `docs/HELP.md` | 617 | 1 added, 1 removed (line 570, in the round's widened write list) |

`git status --short` also lists `.scratch/migration/agents/briefs/O131-round-1.md` and `.scratch/migration/agents/reviews/O131-refuter.md` as untracked: the orchestrator's copies, not written by me.

### Judgment calls of the round

1. The head comment's last kind names both directions of a keyed family in the wrong form, since the round's program found that a list of rows written as a map (`boards` in layout.yml) is also taken by the schema and refused by the rule; naming only the direction the review found would leave the list of kinds incomplete in a sentence that no longer gives a count.
2. The HELP clause reads "whose words oculus holds", so it stays true of a choice or a multi drawn from a source only the page holds.
3. The test file's head comment gains one sentence for the new row, as item 2 of the brief asked of the describe.
4. A wrong `joined` text is worded by the editor as `String does not match the pattern of "^$|^[^ ]+( [^ ]+)*$".` and by `check.ts` as `settings.themes[0].class is dark any text  at all, which does not match the form ^$|^[^ ]+( [^ ]+)*$`. Both show the pattern itself rather than words saying a doubled, leading or trailing space is refused. The round asked for no message of its own, and no catalog key was added.
