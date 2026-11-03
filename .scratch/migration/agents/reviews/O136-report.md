# O136 builder report: the editor holds a keyed family to the form its reader takes

NOT done: repair round 1 item 1, the editor's message in oculus's words, is handed back unbuilt. Built as ruled, the editor shows "boards must be a map, not a list" for `boards:` written as a text, a number or with no value yet, none of which is a list. The evidence and the options are in the section "Repair round 1". Items 2 to 5 of the round are done. The sections above "Repair round 1" are the first report, with their `file:line` figures and line counts taken again after the round's last change. One sentence of item 5 of the brief holds only in JSON Schema's words: yaml-language-server's message for a list where a map is taken is `Incorrect type. Expected "object".`, and for a map where a list is taken `Incorrect type. Expected "array".`; it names the JSON type, never the words "map" or "list" (section "Anything in the brief that was wrong").

## Open items of the state file, verbatim

From `.scratch/migration/orchestrator-state.md:194-198`:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

- None.
```

## The cases' first run (unchanged tree, before any change)

Command for C1 to C11 and C14 to C16: `npx tsx /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o136build/cases.mts` from the worktree root (the case-run program, source quoted below). Output on the unchanged tree:

```
C1 => []
C2 => []
C3 => []
C4 => []
C5 => []
C6 => []
C7 => []
C8 => []
C9 => []
C10 boards => []
C10 params => []
C10 counts => []
C10 links => []
C10 read_limits => []
C10 hub collections => []
C10 hub counts => []
C10 hub required_sections => []
C10 ws boards => []
C11 stages => ["2: stages must be a map, not a list"]
C11 categories => ["2: categories must be a list, not a map"]
C14 => []
C15 leads_fit value a list => ["2: leads_fit.strong must be a text, not a list"]
C15 leads_fit as list => ["2: leads_fit must be a map, not a list"]
C15 ws text as list => ["3: settings.text must be a map, not a list"]
C16 stages null => []
C16 categories removed => []
YLS C1 => []
YLS C6 => []
YLS C10 boards => []
YLS C10 hub collections => []
```

- C1 to C9: no problem each, as the brief says for "before".
- C10: no problem for each of its nine texts, as the brief says.
- C11: one problem each on line 2, as the brief says.
- C12: `npx vitest run tests/checks/config/config-folder.test.ts tests/data/sources/config/catalog/options-schema.test.ts --reporter=verbose` printed `<check mark> |unit| tests/checks/config/config-folder.test.ts > oculus's own config directory > passes every config file through the schema it is matched to 829ms`, totals `Test Files  2 passed (2)` / `Tests  46 passed | 2 skipped (48)`.
- C13: the same run printed `<check mark> |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a collections entry > passes the .oculus/config.yml Make Folder a Hub writes with every collection ticked 78ms`.
- C14: no problem, as the brief says.
- C15: the three problems on the lines and with the messages the brief gives.
- C16: no problem for either text, as the brief says.

No case of the brief's rules was found wrong by the first run, so no case was handed back and no ruling was needed.

## DONE / NOT DONE

| Item | State | Proof (command, output) |
| --- | --- | --- |
| 1. `familySchema` gives a keyed family one form | DONE | case-run after the change, rows C1 to C9 each one problem naming the form (output below); `npx vitest run tests/data/sources/config/catalog/options-schema.test.ts --reporter=verbose` last lines `Test Files  1 passed (1)` / `Tests  43 passed (43)` |
| 2. head comment, doc comment, inner comment; test head comment; grep of item 2 | DONE | the greps in "Greps" below; text of the comments in `options.ts:1-29`, `:304-312`, `:328-330`, test file `:16-24` |
| 3. `docs/HELP.md:570` sentence | DONE | `git diff --numstat` printed `1<tab>1<tab>docs/HELP.md`; the sentence is quoted in "Before and after" |
| 4. the test, describe 'the schema of a keyed family', and the `boardWith` rewrite | DONE | unchanged code: `Tests  9 failed | 16 passed | 18 skipped (43)` with `-t "the schema of a keyed family"`; after: every row passes (verbose run above) |
| 5. case-run of yaml-language-server for C1 and C6 | DONE, with the wording finding | `YLS C1 => ["2: Incorrect type. Expected \"object\"."]`, `YLS C6 => ["2: Incorrect type. Expected \"array\"."]` |
| Verify 1, the four test files | DONE | `npx vitest run tests/data/sources/config/catalog/options-schema.test.ts tests/checks/config/config-folder.test.ts tests/data/sources/config/catalog/options.test.ts tests/data/sources/config/workspace-layer.test.ts`: `Test Files  4 passed (4)` / `Tests  94 passed | 2 skipped (96)` |
| Verify 2, `npm run diagrams` then `npm run test:quick` | DONE | `test:quick: 57.7 s; every command passed` |
| Verify 3, character-set check | DONE | `LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' src/lib/data/sources/config/catalog/schemas/options.ts tests/data/sources/config/catalog/options-schema.test.ts docs/HELP.md docs/diagrams/layer-data.dot` printed nothing, `ascii exit 0`; the same over `docs/diagrams/layer-data.svg` printed nothing, `svg ascii exit 0` |
| Verify 4, unused exports | DONE | `sh utils/unused-exports.sh` into `<scratch>/o136build/unused-after.txt` (335 lines), `diff ../O136-base/unused-exports.txt <that file>` printed nothing, `diff exit 0` |
| Verify 5, each new or changed test run before and after | DONE | below |
| Verify 6, list items and sentences read | DONE | below |

### Verify 2, the result lines of `npm run test:quick`

```
test:quick: 5 changed file(s), from git since HEAD
test:quick: 13 test file(s)
ok      prettier (1.9 s): All matched files use Prettier code style!
ok      ASCII gate (2.0 s)
ok      svelte-kit sync (4.0 s)
ok      eslint (15.1 s)
ok      vitest (31.2 s): Duration  14.78s (transform 14.47s, setup 0ms, import 29.90s, tests 14.43s, environment 1ms)
ok      svelte-check (38.9 s): 1793727070320 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (53.4 s): Duration  36.74s (transform 26.41s, setup 0ms, import 46.52s, tests 61.58s, environment 3ms)
test:quick: 57.7 s; every command passed
```

Runs of the list: `npm run diagrams` once, `npm run test:quick` once. No whole-suite command was run.

A red line in a file the step does not change: the first run of verify 1 after the change printed `<multiplication sign> names a glyph only where the source or another config file reads it 12514ms` in `tests/checks/config/config-folder.test.ts` (the test took 1299ms on the unchanged tree). Rerun alone, `npx vitest run tests/checks/config/config-folder.test.ts -t "names a glyph only where"`: `Test Files  1 passed (1)` / `Tests  1 passed | 29 skipped (30)`. Verify 1 was then run whole once more after the last change, green, as quoted in the table.

### Verify 5, the tests before and after

- The describe 'the schema of a keyed family' is G13's test, one table `FAMILIES`, one row per text (C1 to C9, C10's nine texts, C11's two, C15's three, C16's two), each read through one reader, comparing each problem's line and the form its message names (`placed`: the line, and "must be a map", "must be a list" or null).
- Run on the unchanged code, `npx vitest run tests/data/sources/config/catalog/options-schema.test.ts -t "the schema of a keyed family" --reporter=verbose`: the nine rows of C1 to C9 failed, the sixteen audit rows passed, `Tests  9 failed | 16 passed | 18 skipped (43)`. The failing line of the first row, as printed:

```
 FAIL  |unit| tests/data/sources/config/catalog/options-schema.test.ts > the schema of a keyed family > places the problems of boards as a list in layout.yml on their lines
AssertionError: expected [] to deeply equal [ [ '2:', 'must be a map' ] ]
 <heavy right-pointing angle> tests/data/sources/config/catalog/options-schema.test.ts:354:40
```

- The other eight failing rows on the unchanged code: params as a list in behavior.yml, counts as a list in layout.yml, links as a map in behavior.yml, read_limits as a list in behavior.yml, collections as a map in a hub, counts as a list in a hub, audit.required_sections as a map in a hub, settings.boards as a list in a workspace file; each printed `<multiplication sign>` in that run. They are the proof of item 1.
- The rows of C10, C11, C15 and C16 are audits of what the change keeps: they pass on the unchanged code and after it, and would pass with the change taken out.
- After the change every row passes (the verbose run quoted in the DONE table, `Tests  43 passed (43)`).
- The describe 'the schema of a multi': on the unchanged tree with the old `boardWith`, `<check mark> ... places the problems of a board's tier in layout.yml on their lines 27ms`; on the unchanged code with the new `boardWith`, `-t "the schema of a multi"`: the same row passed, `Tests  8 passed | 10 skipped (18)`; after the change it passed again (`<check mark> ... places the problems of a board's tier in layout.yml on their lines 12ms`).
- The edit made to the test file after its run on the unchanged code: only comments (the doc comment of `FAMILIES` split onto three lines, a doc comment on `MAP` and `LIST`, the file's head comment); checked by reading.

### Verify 6, the list items and sentences

- `docs/HELP.md:570` keeps one bullet; the added sentence is one sentence of 29 words with no list inside it.
- The head comment paragraph of `options.ts:24-29` is two sentences; the doc comment of `familySchema` is three; the inner comment two. Each is plain prose with no em dash and no 'not X but Y' construction. No departure from the rules file's prose rules was found.

## Edits to existing test lines (diff of the test file against the base copy)

`diff ../O136-base/tests/data/sources/config/catalog/options-schema.test.ts tests/data/sources/config/catalog/options-schema.test.ts` printed the hunks `16c16,24`, `157c165`, `159c167` and `214a223,366` (the last one only adds lines). The changed existing lines:

| Line (base) | Before | After |
| --- | --- | --- |
| 16 | `// separated by single spaces, and a doubled space is a problem on its line.` | the same sentence followed by the new sentences of the head comment (lines 16-24) |
| 157 | `/** A `boards:` list of one board whose `tier`, on line 4, is `tier`. */` | `/** A `boards:` map of one board, `mine`, whose `tier`, on line 4, is `tier`. */` |
| 159 | ``return `boards:\n  - key: mine\n    label: Mine\n    tier: ${tier}\n`;`` | ``return `boards:\n  mine:\n    label: Mine\n    tier: ${tier}\n`;`` |

No assertion, allow list or predicate was edited; rows 188-189 of 'the schema of a multi' keep their expected lines `['4:']` and `[]`.

## The case-run program

Source, `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o136build/cases.mts` (it only prints; nothing of it is in the step's diff):

```ts
// Case-run of step O136: prints the problems of each case's text against the schema the server
// serves, and the yaml-language-server diagnostics of C1 and C6. Prints only; writes nothing.
const R = '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O136';
const { createRequire } = await import('node:module');
const require = createRequire(R + '/package.json');
const { portfolioConfigFrom } = await import(R + '/src/lib/data/index.ts');
const { HUB_FILE } = await import(R + '/src/lib/data/helpers/hub-names.ts');
const { checkDocument, createChecker } = await import(R + '/src/lib/data/snapshot/schema/check.ts');
const { schemaFor, schemaAddress, schemaTextAt } = await import(R + '/src/lib/data/snapshot/schema/set.ts');
const { engineDir, loadConfig } = await import(R + '/src/lib/data/sources/config.ts');
const { withOwnSchemas } = await import(R + '/src/lib/server/root/watch/build.ts');
const { buildOneHub } = await import(R + '/tests/fixtures/hubs/hub-build.ts');
const { DEMO_HUB } = await import(R + '/tests/fixtures/hubs/real-hub.ts');
const { join } = await import('node:path');
const { config } = loadConfig(engineDir(), { hub: DEMO_HUB });
const portfolio = portfolioConfigFrom(config);
const checker = createChecker();
const dir = join(engineDir(), 'config');
const { schemas } = buildOneHub(DEMO_HUB, portfolio, 1, [], checker, { dir, held: [{ root: 'config', path: '' }] }, 'hub');
const hubSchemas = withOwnSchemas(schemas);
const probs = (set: any, root: string, rel: string, text: string) => {
    const name = schemaFor(set, root, rel);
    if (!name) return ['NO SCHEMA'];
    return checkDocument({ name, file: rel, text }, set.texts, checker, portfolio.text).map((o: any) => (o.line ?? 0) + ': ' + o.message);
};
const W = '.oculus/workspaces/w.yml';
const L = 'defaults/layout.yml';
const B = 'defaults/behavior.yml';
const cases: [string, any, string, string, string][] = [
    ['C1', schemas, 'config', L, 'boards:\n  - { key: b, label: B }\n'],
    ['C2', schemas, 'config', B, 'literature:\n  sources:\n    - key: x\n      params:\n        - { key: q, value: v }\n'],
    ['C3', schemas, 'config', L, 'counts:\n  - { key: projects, tab: true }\n'],
    ['C4', schemas, 'config', B, "links:\n  doi: { address: 'https://doi.org/{id|path}' }\n"],
    ['C5', schemas, 'config', B, 'read_limits:\n  - { key: next, value: 300 }\n'],
    ['C6', hubSchemas, 'hub', HUB_FILE, 'collections:\n  notes: { file: .oculus/data/notes.yml }\n'],
    ['C7', hubSchemas, 'hub', HUB_FILE, 'counts:\n  - { key: projects, tab: true }\n'],
    ['C8', hubSchemas, 'hub', HUB_FILE, 'audit:\n  required_sections:\n    x: { file: README.md, heading: Results, folders: [] }\n'],
    ['C9', schemas, 'hub', W, 'settings:\n  boards:\n    - { key: b, label: B }\n'],
    ['C10 boards', schemas, 'config', L, 'boards:\n  b: { label: B }\n'],
    ['C10 params', schemas, 'config', B, 'literature:\n  sources:\n    - key: x\n      params: { q: v }\n'],
    ['C10 counts', schemas, 'config', L, 'counts:\n  projects: { tab: true }\n'],
    ['C10 links', schemas, 'config', B, "links:\n  - { key: doi, address: 'https://doi.org/{id|path}' }\n"],
    ['C10 read_limits', schemas, 'config', B, 'read_limits:\n  next: 300\n'],
    ['C10 hub collections', hubSchemas, 'hub', HUB_FILE, 'collections:\n  - { key: notes, file: .oculus/data/notes.yml }\n'],
    ['C10 hub counts', hubSchemas, 'hub', HUB_FILE, 'counts:\n  projects: { tab: true }\n'],
    ['C10 hub required_sections', hubSchemas, 'hub', HUB_FILE, 'audit:\n  required_sections:\n    - { file: README.md, heading: Results, key: status.line, folders: [] }\n'],
    ['C10 ws boards', schemas, 'hub', W, 'settings:\n  boards:\n    b: { label: B }\n'],
    ['C11 stages', hubSchemas, 'hub', HUB_FILE, 'stages:\n  - { key: drafting, label: Drafting }\n'],
    ['C11 categories', hubSchemas, 'hub', HUB_FILE, 'categories:\n  x: { label: X }\n'],
    ['C14', schemas, 'hub', W, 'settings:\n  boards: { projects: null }\n'],
    ['C15 leads_fit value a list', hubSchemas, 'hub', HUB_FILE, 'leads_fit:\n  strong: [a, b]\n'],
    ['C15 leads_fit as list', hubSchemas, 'hub', HUB_FILE, 'leads_fit:\n  - { key: strong, value: green }\n'],
    ['C15 ws text as list', schemas, 'hub', W, 'settings:\n  text:\n    - { key: a.b, value: x }\n'],
    ['C16 stages null', hubSchemas, 'hub', HUB_FILE, 'stages:\n  drafting: null\n'],
    ['C16 categories removed', hubSchemas, 'hub', HUB_FILE, 'categories:\n  - { key: x, removed: true }\n']
];
for (const [label, set, root, rel, text] of cases) console.log(label, '=>', JSON.stringify(probs(set, root, rel, text)));

// Item 5: the editor's own validator over the served schema.
const { getLanguageService } = require('yaml-language-server/out/server/src/languageservice/yamlLanguageService.js');
const { TextDocument } = require('vscode-languageserver-textdocument');
let seen = 0;
async function editorMarks(set: any, root: string, rel: string, text: string): Promise<string[]> {
    const name = schemaFor(set, root, rel);
    if (!name) return ['NO SCHEMA'];
    const uri = schemaAddress(name);
    const service = getLanguageService({
        schemaRequestService: (asked: string) => {
            const held = schemaTextAt(set, asked);
            return held === undefined ? Promise.reject(new Error('no schema ' + asked)) : Promise.resolve(held);
        },
        workspaceContext: { resolveRelativePath: (path: string) => path },
        // The service reports a failed validation only to its telemetry; print it.
        telemetry: { send() {}, sendTrack() {}, sendError: (what: string, err: unknown) => console.log('YLS ERROR', what, String(err)) }
    });
    // As oculus answers `custom/schema/request` (lsp/adapters/yaml/requests.ts): the address of the
    // schema that governs the file, whose text the schema request service then returns.
    service.configure({ validate: true, hover: false, completion: false, yamlVersion: '1.2', schemas: [] });
    service.registerCustomSchemaProvider(() => Promise.resolve(uri));
    // The service caches a parsed document by its address and version, so each text gets its own.
    seen += 1;
    const doc = TextDocument.create(`file:///case/${seen}/${rel}`, 'yaml', 1, text);
    const found = await service.doValidation(doc, false);
    return found.map((one: any) => `${one.range.start.line + 1}: ${one.message}`);
}
console.log('YLS C1 =>', JSON.stringify(await editorMarks(schemas, 'config', L, cases[0][4])));
console.log('YLS C6 =>', JSON.stringify(await editorMarks(hubSchemas, 'hub', HUB_FILE, cases[5][4])));
console.log('YLS C10 boards =>', JSON.stringify(await editorMarks(schemas, 'config', L, cases[9][4])));
console.log('YLS C10 hub collections =>', JSON.stringify(await editorMarks(hubSchemas, 'hub', HUB_FILE, cases[14][4])));
// A control: a key no schema declares is marked, so an empty list above is the schema's answer.
console.log('YLS control layout =>', JSON.stringify(await editorMarks(schemas, 'config', L, 'nonesuch: 1\n')));
console.log('YLS control hub =>', JSON.stringify(await editorMarks(hubSchemas, 'hub', HUB_FILE, 'nonesuch: 1\n')));
```

The program drives yaml-language-server's language service (`out/server/src/languageservice/yamlLanguageService.js`, version 1.24.0) in-process, handed the schema the way oculus's adapter hands it (a custom schema provider that names `oculus-schema:/<name>.json`, whose text `schemaTextAt` of the served set gives). It does not start the server process over stdio. The first run's output on the unchanged tree is quoted in "The cases' first run"; the two control lines were added after that run.

Output after the last change:

```
C1 => ["2: boards must be a map, not a list"]
C2 => ["5: literature.sources[0].params must be a map, not a list"]
C3 => ["2: counts must be a map, not a list"]
C4 => ["2: links must be a list, not a map"]
C5 => ["2: read_limits must be a map, not a list"]
C6 => ["2: collections must be a list, not a map"]
C7 => ["2: counts must be a map, not a list"]
C8 => ["3: audit.required_sections must be a list, not a map"]
C9 => ["3: settings.boards must be a map, not a list"]
C10 boards => []
C10 params => []
C10 counts => []
C10 links => []
C10 read_limits => []
C10 hub collections => []
C10 hub counts => []
C10 hub required_sections => []
C10 ws boards => []
C11 stages => ["2: stages must be a map, not a list"]
C11 categories => ["2: categories must be a list, not a map"]
C14 => []
C15 leads_fit value a list => ["2: leads_fit.strong must be a text, not a list"]
C15 leads_fit as list => ["2: leads_fit must be a map, not a list"]
C15 ws text as list => ["3: settings.text must be a map, not a list"]
C16 stages null => []
C16 categories removed => []
YLS C1 => ["2: Incorrect type. Expected \"object\"."]
YLS C6 => ["2: Incorrect type. Expected \"array\"."]
YLS C10 boards => []
YLS C10 hub collections => []
YLS control layout => ["1: Property nonesuch is not allowed."]
YLS control hub => ["1: Property nonesuch is not allowed."]
```

Every case after the change gives the brief's expected result: C1 to C9 one problem on the named line, naming the form; C10, C14 and C16 none; C11 and C15 the same problems as before. C12 and C13 pass after (verify 1, `Tests  94 passed | 2 skipped (96)`, which runs both).

## Greps

- Item 2, `grep -rn "familySchema" src docs tests config --exclude=local.yml`: only `options.ts:313`, `:351`, `:399`.
- `grep -rn "two forms" src docs config tests --exclude=local.yml`: `MenuList.svelte:89`, `lsp/uris.ts:1`, `words/format.ts:109`, `life/calendar.ts:7`, `latex-target.ts:3`, `terminal-tabs.ts:57`, `model-calendar.ts:12`, `tests/server/machine/lsp/uris.test.ts:1,118`. All other subjects; none made false. No hit in `options.ts` remains.
- `grep -rni "keyed famil" src docs config tests --exclude=local.yml`: `options.ts:24`, `:26`, `:306`, `:307`, `:329`, the test file `:16`, `:238`, `:364`, and `references.ts:13`, all written by this step.
- `grep -rni "list of rows" src docs config tests --exclude=local.yml`: `manifest.ts:147,224`, `actions.ts:194`, `forms/schema.ts:171`, `career-view.ts:83`, `in-place.ts:8,42,256`, `engine.ts:15,138`, `list-drag.svelte.ts:171`, `AuditSection.svelte:30`, `manifest-schema.yml:13`, `findings.yml:76,81`, `config.test.ts:716,757`, `served-roots.client.test.ts:111`. `engine.ts:15` and `:138` describe `withShapes`, which is unchanged and still true; `in-place.ts` describes the merge, still true; the others are other subjects.
- An extra grep for sentences saying a family takes either form, `grep -rni "list or a map\|map or a list\|either form\|both forms" src docs config tests README.md --exclude=local.yml`: no hit describes a keyed family's schema form (`config-value.ts:157` describes the write, `NestedCards.svelte:4` the card drawing, the rest other subjects).
- Reuse, before writing a map predicate, `grep -rn "export function isMap\|export const isMap\|export function isRecord\|export function isPlainObject" src`: `src/lib/data/helpers/guards.ts:20` `isMap`, which `options.ts` now imports; no helper was written.
- History words over the added lines, `git diff -U0 -- src tests docs | grep '^+' | grep -v '^+++' | grep -niE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O1[0-9][0-9]|20[0-9][0-9]-"`: no hit, `exit 1`.

Comments and documents re-read after the change:
- `options.ts` head comment (lines 1-29): rewritten (the keyed-family clause of the paragraph on where the schema and the rule part removed; a paragraph of its own added at lines 24-29). Lines 1-9 and 11-22 otherwise still true.
- `familySchema` doc comment (`options.ts:304-312`): rewritten. The inner comment (`:328-330`): rewritten.
- `references.ts` head comment (lines 11-15): rewritten in repair round 1.
- `ownSchema`, `fieldSchema`, `withOverrides`, `entrySchema` doc comments: still true.
- `engine.ts` head comment (lines 8-17) and the doc comments of `shapedSchema`, `shapeKeys`, `withShapes`, `hubConfigSchema`, `workspaceSchema`: still true.
- `docs/HELP.md:570`: rewritten (one sentence added). `README.md:27`: still true.
- `options-schema.test.ts` head comment: rewritten (sentences added for the new describe).

## Files

From `git status --short` and `diff -rq` of `src`, `tests`, `docs`, `config` (`-x local.yml`) and `utils` against `../O136-base/`:

| File | Lines now | Changed (`git diff --numstat`) | In the write list |
| --- | --- | --- | --- |
| `src/lib/data/sources/config/catalog/schemas/options.ts` | 464 | +29 -14 | yes |
| `tests/data/sources/config/catalog/options-schema.test.ts` | 368 | +155 -3 | yes |
| `src/lib/data/sources/config/catalog/schemas/references.ts` | 174 | +4 -2 | yes, widened by repair round 1 item 2 |
| `docs/HELP.md` | 618 | +1 -1, line 570 only | yes |
| `docs/diagrams/layer-data.dot` | | +1 -1 (`folder data/sources to folder data/helpers` label 86 to 87, from the new import of `helpers/guards.ts`) | yes, by `npm run diagrams` |
| `docs/diagrams/layer-data.svg` | | +1 -1 | yes, by `npm run diagrams` |
| `.scratch/migration/agents/reviews/O136-report.md` | | this report | yes |

No file under `config` or `utils` changed.

## The change in code

```ts
function familySchema(
    entry: CatalogEntry,
    lists: OptionLists,
    defs: Definitions,
    loose = false,
    shipped?: unknown
): JsonSchema {
    const fields = entry.fields ?? {};
    if (entry.holds === 'record') return recordSchema(fields, lists, defs, loose);
    const keyed = 'key' in fields;
    if (loose && !keyed) return recordSchema(fields, lists, defs, true);
    const pairs = isPairs(fields);
    if (!keyed || (!pairs && !isMap(shipped))) {
        return { type: 'array', items: recordSchema(fields, lists, defs, loose) };
    }
    ...
    const schema: JsonSchema = { type: 'object', additionalProperties: member };
```

and in `entrySchema`: `familySchema(entry, lists, defs, OWN_READER.includes(path), entry.default)`. `ownSchema`'s call is unchanged and passes no default.

## Judgment calls the brief left open (each reversible)

1. The default reaches `familySchema` as a fifth optional parameter, `shipped`, passed by `entrySchema` as `entry.default`; `ownSchema` passes none.
2. A keyed family field that is not a key/value family (none exists on the tree) gets no default and so is a list of rows, the form `familyProblem` reads such a field in (`value-rule.ts:271-272`). The doc comment of `familySchema` says so.
3. The map form carries no `items` and the list form no `additionalProperties`. `recordSchema` of the full fields is not built for a map; a described record its fields name is still registered through the member's fields. The order of `definitions` in a served schema text may differ from the base; their content does not.
4. The new table holds the audit rows (C10, C11, C15, C16) in the same describe as C1 to C9, one row per text, and compares the form for every row through one function `placed`; the form is null for a problem that names neither "must be a map" nor "must be a list" (C15's `leads_fit.strong must be a text, not a list`).
5. The workspace rows of the test read `.oculus/workspaces/mine.yml` through the file's existing `inWorkspace` reader, the same schema rule as the brief's `w.yml`; the case-run program uses `w.yml`.
6. The HELP sentence's wording: "A family written as a list of rows where its file takes a map, or as a map where its file takes a list, is marked."
7. C14 and the C15 and C16 audits are case-run lines, and C15 and C16 are also test rows; C14 has no test row, as the brief says.

## Before and after, what a user sees

- The editor (yaml-language-server over the served schema), from the case-run of item 5:
  - `config/defaults/layout.yml` with `boards:\n  - { key: b, label: B }\n`: before, no mark; after, a mark on line 2, `Incorrect type. Expected "object".`
  - a hub's `.oculus/config.yml` with `collections:\n  notes: { file: .oculus/data/notes.yml }\n`: before, no mark; after, a mark on line 2, `Incorrect type. Expected "array".`
  - the same families in their reader's form: no mark, before and after.
- The look at landing: open, on a scratch server started from this step's checkout, a hub's `.oculus/config.yml` in the editor and write `collections:` as a map of one entry, and `config/defaults/layout.yml` with `boards:` as a list of one row. Each should show a warning squiggle on the line of the first key or row with the messages above, where the unchanged tree shows none; `collections:` as a list and `boards:` as a map should show none.
- Completion, from the case-run's `COMPLETE` lines (yaml-language-server's `doComplete` at a cursor in a row or entry, the program run with `O136_ROOT` set to the base copy for before and with no `O136_ROOT` for after; output quoted in "Repair round 1"):
  - in `config/defaults/layout.yml`, on a row of `boards:` written as a list, completion offered the 13 board fields and `key` before and offers nothing after;
  - in a hub's `.oculus/config.yml`, on an entry of `collections:` written as a map, completion offered the 17 entry fields before and offers nothing after;
  - in the reader's form (`boards:` as a map, `collections:` as a list) completion is the same before and after: the 13 board fields, and the 17 entry fields and `key`.
- Hover in a family written in the form its reader refuses is not verified.
- The Settings view and the Findings view are unchanged: the Settings view reads the catalog, and the hub check (`run.ts`) checks only manifests and hub data files against a schema.

## Anything in the brief that was wrong or impossible

- Item 5 says "the message for a list where a map is taken names the map, and the message for a map where a list is taken names the list". The run shows yaml-language-server's own wording, `Incorrect type. Expected "object".` and `Incorrect type. Expected "array".` (the case-run output above). It names the JSON Schema type, which is the map and the list in JSON Schema's words, never the words "map" or "list". Making it say "map" or "list" would need a custom message keyword in the served schema, which the checker's `ANNOTATIONS` (`src/lib/data/snapshot/schema/json.ts`) would also have to declare; that is outside the step's paths and a user-visible wording the brief does not name, so it was not built. The oculus checker's own message (`problemsOf`) does name the form: `2: boards must be a map, not a list`.

## Limitations and sharp edges

- A hub or workspace file that today writes a family in the form its reader refuses will now show an editor mark where it showed none. That is the step's purpose; whether the real hub's files hold such a text was not checked (the hub's folders are not read by this step), not verified.
- The case-run drives the language service in-process, not the server binary over stdio; the validator and schema resolution are the same module the server uses, but the server's own settings handshake is not exercised.
- Completion on a row or entry of a family written in the form its reader refuses offers nothing after the change (measured, "Before and after"); hover there is not verified.

## Repair round 1

NOT done: item 1 is handed back unbuilt, for the reason and with the options below. Items 2, 3, 4 and 5 are done.

| Item | State | Proof |
| --- | --- | --- |
| 1. `errorMessage` on the family's form, worded from `findings.schema.type` | NOT DONE, handed back | the run quoted under "Item 1" |
| 2. `references.ts:11-13` rewritten | DONE | `diff ../O136-base/src/lib/data/sources/config/catalog/schemas/references.ts src/lib/data/sources/config/catalog/schemas/references.ts`, quoted below |
| 3. the test's head comment says what the rows give | DONE | test file lines 21-24, quoted below |
| 4. completion before and after in the report | DONE | "Before and after, what a user sees" and "Limitations"; `COMPLETE` lines quoted below |
| 5. every `file:line` and line count taken again | DONE | the greps quoted below; the first report's figures corrected in place |
| Verify, the brief's four test files | DONE | `Test Files  4 passed (4)` / `Tests  94 passed | 2 skipped (96)` |
| Verify, `npm run diagrams` then `npm run test:quick` | DONE | `test:quick: 138.5 s; every command passed` |
| Verify, character-set check over the changed files | DONE | printed nothing, `ascii exit 0` |
| Verify, unused exports | DONE | `diff ../O136-base/unused-exports.txt <scratch>/o136build/unused-r1.txt` printed nothing, `unused diff 0` |

### Item 1: why it is handed back

The ruled change was built in full: `OptionLists` carrying `text: config.text` from `engineSchemas`, the key path of each family (with `settings.` for a workspace file and the field's name for a family field), `inForm` putting `errorMessage: findingText(lists.text, 'findings.schema.type', key, <form>, <other form>)` on the map form and the list form `familySchema` returns, and `errorMessage` added to `ANNOTATIONS`. With that build in the tree, the case-run printed, for C1 to C9, the messages the ruling asks for:

```
YLS C1 => ["2: boards must be a map, not a list"]
YLS C2 => ["5: params must be a map, not a list"]
YLS C6 => ["2: collections must be a list, not a map"]
YLS C8 => ["3: audit.required_sections must be a list, not a map"]
YLS C9 => ["3: settings.boards must be a map, not a list"]
```

and, for a family written as a value of neither form, the same message, which is false for each of them (oculus's checker first, the editor after `|`):

```
boards a text => ["1: boards must be a map, not a string"] | YLS => ["1: boards must be a map, not a list"]
boards a number => ["1: boards must be a map, not a number"] | YLS => ["1: boards must be a map, not a list"]
boards empty => ["1: boards must be a map, not null"] | YLS => ["1: boards must be a map, not a list"]
hub collections empty => ["1: collections must be a list, not null"] | YLS => ["1: collections must be a list, not a map"]
```

The cause is in yaml-language-server: it shows a schema's `errorMessage` for every value whose type the schema refuses (`node_modules/yaml-language-server/out/server/src/languageservice/parser/schemaValidation/baseValidator.js:432` and `:444`, `message: schema.errorMessage || ...`), and the ruled change puts the message on the node whose `type` refuses a text, a number and null as well as the other form. `boards:` with no value yet is what the editor holds while a user types a family's first row, so the false message would show at every new family.

The build was taken out, so no part of item 1 is in the tree: `diff ../O136-base/src/lib/data/sources/config/catalog/schemas/engine.ts src/lib/data/sources/config/catalog/schemas/engine.ts` and the same for `src/lib/data/snapshot/schema/json.ts` print nothing (`engine diff 0`, `json diff 0`), and `options.ts` holds the first report's change alone (`git diff --numstat`: `29<tab>14<tab>src/lib/data/sources/config/catalog/schemas/options.ts`).

The options for the orchestrator:

- A. The message on the branch of the other form alone. `familySchema` returns a conditional schema: `{ if: { type: <other form> }, then: { type: <form>, errorMessage }, else: { type: <form>, <items or additionalProperties and properties> } }`. A value of the other form gets the ruled sentence; a text, a number or null fails `else` and keeps yaml-language-server's `Incorrect type. Expected "object".`; oculus's checker words the `then` and `else` type errors as it does today and drops the `if` error (`check.ts`, `case 'if': return null`). The structural keywords must sit inside `else` beside its `type`: with them at the schema's top and no `type` there, ajv in strict mode logs a warning for each one at every build (a build of that shape printed, among many, `strict mode: missing type "object" for keyword "additionalProperties" at "#/properties/boards" (strictTypes)`). So every reader of a family's served schema changes with it: `withOverrides` (`options.ts`), and `shapedSchema` and the `text` branch of `withShapes` (`engine.ts`), which read and set `items`, `additionalProperties`, `properties` and `type` at the top; and completion inside a family, which reads the branch, needs its before and after measured again. Pros: the sentence the ruling asks for, shown only where it is true, and oculus's checker unchanged. Cons: a larger change to the served schema of every family than the ruling names, in three functions across two files.
- B. The ruled change as written. Pros: small. Cons: the false message above, at every family a user starts to type. This is the lazy option.
- C. No message of oculus's own: the editor keeps `Incorrect type. Expected "object".` and `Incorrect type. Expected "array".`, true for every wrong value. Pros: nothing changes. Cons: the message names the JSON type, not oculus's words. It costs nothing to do and leaves the finding Spec 1 open.

Recommendation: A, since it is the one option whose message is both oculus's words and true for every value; it needs a ruling because it changes the structure of every served family schema beyond what item 1 names.

### Item 2

```
12,13c12,15
< // from its `key` to a record, a list or one value), so what the editor checks and what the index
< // follows are the same places.
---
> // from its `key` to a record, a list or one value), so for a family written in the form its reader
> // takes, what the editor checks and what the index follows are the same places. A keyed family
> // written in the other form is followed by the index through its fields all the same, while the
> // editor marks the family and checks none of its fields.
```

### Item 3

The test's head comment, lines 20-24 after the change:

```
// one problem on the line of its first row or key, whose message names the form. A family written
// in the form its reader takes, a hub's word set to null and a hub's row marked `removed: true`
// give no problem. A key/value family with no default (`leads_fit`, `text`) is held to a map: a
// value of it written as a list gives the problem of its value, a text where a list is written, and
// no form problem, and the family written as a list gives the form problem.
```

The ruling's words "gives the problem of its value ... and no form problem" are true of `leads_fit: { strong: [a, b] }` alone; the rows `leads_fit` as a list and `settings.text` as a list give the form problem (`C15 leads_fit as list => ["2: leads_fit must be a map, not a list"]`), so the sentence names both.

### Item 4

`npx tsx /private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o136build/cases.mts`, run with `O136_ROOT=/Users/axelfaes/workspace/oculus/.agents/worktrees/O136-base` (before):

```
COMPLETE layout boards list row => cards,chips,columns,forms,glyph,hub,key,label,label_mode,match,role,search,stages,tier
COMPLETE layout boards map row => cards,chips,columns,forms,glyph,hub,label,label_mode,match,role,search,stages,tier
COMPLETE hub collections list row => about,awaiting,band_positions,band_teaching,dissemination,dissemination_skip,file,glyph,group,key,label,lead_applications,open_badge,order,primary_key,registry,tasks,ticker
COMPLETE hub collections map row => about,awaiting,band_positions,band_teaching,dissemination,dissemination_skip,file,glyph,group,label,lead_applications,open_badge,order,primary_key,registry,tasks,ticker
```

and with no `O136_ROOT` (after, the worktree after the round's last change):

```
COMPLETE layout boards list row => (none)
COMPLETE layout boards map row => cards,chips,columns,forms,glyph,hub,label,label_mode,match,role,search,stages,tier
COMPLETE hub collections list row => about,awaiting,band_positions,band_teaching,dissemination,dissemination_skip,file,glyph,group,key,label,lead_applications,open_badge,order,primary_key,registry,tasks,ticker
COMPLETE hub collections map row => (none)
```

The same run after the round, the editor's and the checker's lines (C1 to C9 as the first report gives them, the editor's own wording):

```
YLS C1 => ["2: Incorrect type. Expected \"object\"."]
YLS C2 => ["5: Incorrect type. Expected \"object\"."]
YLS C3 => ["2: Incorrect type. Expected \"object\"."]
YLS C4 => ["2: Incorrect type. Expected \"array\"."]
YLS C5 => ["2: Incorrect type. Expected \"object\"."]
YLS C6 => ["2: Incorrect type. Expected \"array\"."]
YLS C7 => ["2: Incorrect type. Expected \"object\"."]
YLS C8 => ["3: Incorrect type. Expected \"array\"."]
YLS C9 => ["3: Incorrect type. Expected \"object\"."]
YLS C10 boards => [] (and the other eight C10 texts, each [])
YLS C11 stages => ["2: Incorrect type. Expected \"object\"."]
YLS C11 categories => ["2: Incorrect type. Expected \"array\"."]
YLS C14 => []
YLS C15 leads_fit value a list => ["2: Incorrect type. Expected \"string | null\"."]
YLS C15 leads_fit as list => ["2: Incorrect type. Expected \"object\"."]
YLS C15 ws text as list => ["3: Incorrect type. Expected \"object\"."]
YLS C16 stages null => []
YLS C16 categories removed => []
boards a text => ["1: boards must be a map, not a string"] | YLS => ["1: Incorrect type. Expected \"object\"."]
boards a number => ["1: boards must be a map, not a number"] | YLS => ["1: Incorrect type. Expected \"object\"."]
boards empty => ["1: boards must be a map, not null"] | YLS => ["1: Incorrect type. Expected \"object\"."]
hub collections empty => ["1: collections must be a list, not null"] | YLS => ["1: Incorrect type. Expected \"array\"."]
YLS control layout => ["1: Property nonesuch is not allowed."]
YLS control hub => ["1: Property nonesuch is not allowed."]
```

The checker's lines C1 to C16 of that run are those of the first report's "Output after the last change", line for line.

The program changed this round in three places, each only printing: `R` reads `process.env.O136_ROOT` first (`const R = process.env.O136_ROOT ?? '/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O136';`); the editor's lines run over every case (`for (const [label, set, root, rel, text] of cases) console.log('YLS', label, '=>', JSON.stringify(await editorMarks(set, root, rel, text)));`) in place of the four lines for C1, C6 and two C10 texts; and two blocks were added:

```ts
// A family written as a value of neither form: a text, a number and nothing.
const others: [string, any, string, string, string][] = [
    ['boards a text', schemas, 'config', L, 'boards: mine\n'],
    ['boards a number', schemas, 'config', L, 'boards: 3\n'],
    ['boards empty', schemas, 'config', L, 'boards:\n'],
    ['hub collections empty', hubSchemas, 'hub', HUB_FILE, 'collections:\n']
];
for (const [label, set, root, rel, text] of others) {
    console.log(label, '=>', JSON.stringify(probs(set, root, rel, text)), '| YLS =>', JSON.stringify(await editorMarks(set, root, rel, text)));
}

// Item 4 of the repair round: the completion labels at a cursor inside a family's row or entry.
async function editorCompletion(set: any, root: string, rel: string, text: string, line: number, character: number): Promise<string> {
    const name = schemaFor(set, root, rel);
    if (!name) return 'NO SCHEMA';
    const uri = schemaAddress(name);
    const service = getLanguageService({
        schemaRequestService: (asked: string) => {
            const held = schemaTextAt(set, asked);
            return held === undefined ? Promise.reject(new Error('no schema ' + asked)) : Promise.resolve(held);
        },
        workspaceContext: { resolveRelativePath: (path: string) => path },
        telemetry: { send() {}, sendTrack() {}, sendError: (what: string, err: unknown) => console.log('YLS ERROR', what, String(err)) }
    });
    service.configure({ validate: true, hover: false, completion: true, yamlVersion: '1.2', schemas: [] });
    service.registerCustomSchemaProvider(() => Promise.resolve(uri));
    seen += 1;
    const doc = TextDocument.create(`file:///case/${seen}/${rel}`, 'yaml', 1, text);
    const found = await service.doComplete(doc, { line, character }, false);
    const labels = found.items.map((one: any) => one.label).sort();
    return labels.length === 0 ? '(none)' : labels.join(',');
}
console.log('COMPLETE layout boards list row =>', await editorCompletion(schemas, 'config', L, 'boards:\n  - \n', 1, 4));
console.log('COMPLETE layout boards map row =>', await editorCompletion(schemas, 'config', L, 'boards:\n  b:\n    \n', 2, 4));
console.log('COMPLETE hub collections list row =>', await editorCompletion(hubSchemas, 'hub', HUB_FILE, 'collections:\n  - \n', 1, 4));
console.log('COMPLETE hub collections map row =>', await editorCompletion(hubSchemas, 'hub', HUB_FILE, 'collections:\n  notes:\n    \n', 2, 4));
```

### Item 5

Taken after the round's last change:
- `grep -rn "familySchema" src docs tests config --exclude=local.yml`: `options.ts:313`, `:351`, `:399`.
- `grep -rni "keyed famil" src docs config tests --exclude=local.yml`: `references.ts:13`, `options.ts:24`, `:26`, `:306`, `:307`, `:329`, test file `:16`, `:238`, `:364`.
- `familySchema`'s doc comment `options.ts:304-312`, its inner comment `:328-330`, the head comment's keyed-family paragraph `:24-29`; the test's `boardWith` at `:165-168`, `placed` at `:229`, `FAMILIES` at `:241`, the describe at `:364`; `docs/HELP.md:570`.
- The first report's figures were corrected in place: the DONE row of item 2, the test file's diff hunks (`16c16,24`, `157c165`, `159c167`, `214a223,366`), the head comment's lines (16-24), the "Greps" lines, the comments re-read list and the file table. The failing-line quote `options-schema.test.ts:354:40` is the output of the run on the unchanged code as printed then, and stays as printed.

### Runs

- The brief's four test files: `npx vitest run tests/data/sources/config/catalog/options-schema.test.ts tests/checks/config/config-folder.test.ts tests/data/sources/config/catalog/options.test.ts tests/data/sources/config/workspace-layer.test.ts`: `Test Files  4 passed (4)` / `Tests  94 passed | 2 skipped (96)` (`uptime` before: `load averages: 6.08 9.09 8.64`; after: `6.64 8.95 8.61`).
- `npm run diagrams` once, then `npm run test:quick` once (`uptime` before: `load averages: 7.22 9.00 8.63`; after: `15.37 12.02 9.92`):

```
ok      prettier (1.7 s): All matched files use Prettier code style!
ok      ASCII gate (1.8 s)
ok      svelte-kit sync (4.1 s)
ok      eslint (22.6 s)
ok      svelte-check (62.2 s): 1793729956484 COMPLETED 582 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (94.6 s): Duration  67.92s (transform 73.11s, setup 0ms, import 129.22s, tests 135.13s, environment 3.81s)
ok      vitest checks (119.0 s): Duration  92.05s (transform 56.53s, setup 0ms, import 108.79s, tests 188.22s, environment 4ms)
ok      vitest slow (134.2 s): Duration  107.57s (transform 18.30s, setup 0ms, import 48.40s, tests 161.42s, environment 3ms)
test:quick: 138.5 s; every command passed
```

- A second `npm run test:quick` was started by mistake in the command that ran the character-set check (`npm run test:quick 2>&1 >/dev/null | head -0`); `head` refused its argument (`head: illegal line count -- 0`), the output went nowhere, and whether that run went to its end is not verified. `ps -ef | grep -E "quick.mjs|vitest" | grep migration-O136` afterwards printed nothing, so nothing of it is still running. It is a run of the list beyond the one the rules file allows.
- No red line in a file the step does not change.
- Character set: `LC_ALL=C perl -ne 'print "$ARGV:$.:$_" if /[^\x20-\x7E\n]/; close ARGV if eof' src/lib/data/sources/config/catalog/schemas/options.ts src/lib/data/sources/config/catalog/schemas/references.ts tests/data/sources/config/catalog/options-schema.test.ts docs/HELP.md docs/diagrams/layer-data.dot docs/diagrams/layer-data.svg` printed nothing, `ascii exit 0`.
- Unused exports: `sh utils/unused-exports.sh` into `<scratch>/o136build/unused-r1.txt`, `diff ../O136-base/unused-exports.txt` that file printed nothing, `unused diff 0`.
- History words over the added lines, the reviewer's grep with "keep": `git diff -U0 -- src tests docs/HELP.md | grep '^+' | grep -v '^+++' | grep -niE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|keep|O1[0-9][0-9]|20[0-9][0-9]-"` printed nothing, `history exit 1`.

### Files after the round

`git status --short` and `git diff --numstat`:

| File | Lines now | Changed against the base |
| --- | --- | --- |
| `src/lib/data/sources/config/catalog/schemas/options.ts` | 464 | +29 -14 |
| `src/lib/data/sources/config/catalog/schemas/references.ts` | 174 | +4 -2 |
| `tests/data/sources/config/catalog/options-schema.test.ts` | 368 | +155 -3 |
| `docs/HELP.md` | 618 | +1 -1 |
| `docs/diagrams/layer-data.dot` | | +1 -1 |
| `docs/diagrams/layer-data.svg` | | +1 -1 |

`engine.ts` and `json.ts` are unchanged against the base (`engine diff 0`, `json diff 0`).
