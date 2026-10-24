# O66 report: the Gallery draws every word of `stages`, `forms` and `chips` grouped by its list and one table row per hue; the no-venue finding names the project's stage

Everything in the brief is done.

## Open items of the state file, verbatim

- 309 (2026-10-24, O60's /spec, ruling 297 (1) against an app contribution point oculus already reads): ruling 297 (1) (a) names the app contribution point that adds a display language `languages`, each entry `{ id, label, path }`. `contributes.languages` is already an app contribution point: VS Code's point for a programming language, each entry `{ id, aliases?, extensions?, filenames?, filenamePatterns?, firstLine?, configuration?, icon? }` (`docs/apps.md:195`, read by `src/lib/server/machine/apps/read/contributes/reader-tools.ts:86`), which gives the editor a language with no code (`docs/apps.md:513-515`). One key cannot hold both kinds of entry, so the point cannot be built under the name ruling 297 gives it. Nothing else of ruling 297 changes: `en` shipped and the default, the workspace setting `settings: { language: <id> }` (a key apart from the reader's option `languages:`, the extension-to-language map of `config/defaults/sources.yml:81`), the English word for a key the language lacks, a finding for a key oculus lacks, and `settings: text:` laid over the chosen language. (a) VS Code's own point for a display language, `localizations`, in VS Code's shape: each entry `{ languageId, languageName, localizedLanguageName?, translations: [{ id: oculus, path }] }`, the path a folder of files with the keys of `config/text/`, and `settings: { language: <languageId> }` choosing one. Pros: the name and the shape VS Code gives a language pack, as the rule that VS Code parity is exhaustive asks; `languages` keeps meaning a programming language. Cons: `translations` is a list whose one id oculus reads is `oculus`, so an entry is longer than ruling 297's. (b) an oculus name, `displayLanguages`, each entry `{ id, label, path }` as ruling 297 wrote it. Pros: ruling 297's entry unchanged. Cons: a point VS Code does not have, beside the one VS Code has for the same job. (c) the display languages under `languages`, and VS Code's programming-language point renamed. Pros: ruling 297's words kept whole. Cons: every app that registers a programming language breaks, and the point no longer matches VS Code's. Recommended: (a), VS Code's name and shape for the job. (b) is the lazy option: it keeps the ruled entry by inventing a name instead of taking VS Code's point. Left for Axel: the choice is between the name ruling 297 gave and the VS Code parity rule, a clash between two of his rulings. Part (2), raised 2026-10-24 on Axel's question whether the workspace setting also follows VS Code: VS Code has no display-language setting in `settings.json`; its Configure Display Language command writes the choice into the runtime arguments file `argv.json`, and its command line takes `--locale` (code.visualstudio.com/docs/configure/locales). `localizations` is only what a language pack contributes. (a) the workspace setting is named `locale`, its value the `languageId` of an installed `localizations` entry, kept in the workspace file where ruling 297 puts it. Pros: VS Code's word for the choice, and no clash with `language`, which oculus's settings already use for a programming language (`editor.languages`, `config/options/behavior.yml:311`). Cons: changes the key name ruling 297 gave. (b) `settings: { language: <id> }` as ruling 297 says. Cons: one word for two things in the same settings. Recommended (a); (b) is the lazy option.
- 318 (2026-10-24, O63's brief check, ruling Brief check scope; `agents/reviews/O63-brief-check.md`; parts (1) and (2) ruled (a) by Axel, part (3) open): the hub's rewrite under the keys as briefed gives 15 findings today's code does not, and each is false under the hub's own layout (the hub `README.md`, "Project layout and tiers": coauthor work lives under `projects/coauthor/**` at any stage and carries `project.yml` and whatever content it has). Thirteen come from Z980's row `{ stages: { words: [published] }, folder: projects/archive/published }`: the twelve published projects under `projects/coauthor/published/` and `projects/archive/phd/phd-thesis`, each filed where the hub's layout puts it. One comes from decision 4 (the Data section asked at every stage): `projects/coauthor/published/2025/pfl-ms-npj` holds `datasets: [msbase]` and has no `README.md`, which a coauthor project need not have. One comes from decision 2 (a heading matched as a whole line): `projects/manuscripts/raw-pls` has the section `## Data + reproduction`. (a) three changes, each for the reason its finding is false: a `stage_folders` row takes a list `folders:` of the folders its stages may lie under (the hub writes `projects/archive/published`, `projects/coauthor` and `projects/archive/phd`); a `required_files` or `required_sections` row takes an optional `folders:` naming the folders whose projects it applies to (the hub's `## Data` row leaves out `projects/coauthor`); a heading matches a line of the same level that is the heading or starts with it and a space, so `## Data + reproduction` holds `## Data` while `## Database` and `### Data notes` do not. Pros: each rule states the hub's real convention, and the move adds no false finding. Cons: two row keys and a wider heading match. (b) the keys as briefed and the hub's data changed to pass: the coauthor folders moved or their findings muted, the raw-pls heading renamed. Cons: the hub's layout bent to fit the check. (c) the keys as briefed and the 15 findings left showing. Cons: 15 false findings. Recommended (a); (c) is the lazy option. The earlier option of this part, a `stages` block on `required_sections`, is withdrawn: it kept the old findings by an accident of stage rather than for the reason they are false, and it did not reach raw-pls.
- 319 (2026-10-24, O68's brief check, finding 6.4, a finding whose fix widens the step, ruling Brief check scope; `agents/reviews/O68-brief-check.md`): Z982, an automode choice, makes the career file's `milestone` a map `{ title, date }`, declared in the file's `schema:` as `records`. The career editor edits an empty `records` field as a list (`src/lib/state/forms/record-values.ts:80-87`, `shapeOf`), so on a career file with no milestone the Edit control saves `milestone: [{ title, date }]`, which the card reads as no milestone. (a) two plain keys in place of Z982's map: `milestone` stays the text it is today (`type: text`) and a new key `milestone_date` of `type: date` holds its day. Pros: the editor already edits a text and a date field, one shape, the hub file gains one line, no path beyond O68. Cons: two keys for one milestone. (b) a new schema flag (proposed `single: true`) for a `records` field that holds one record as a map, read by `shapeOf` and `src/lib/data/snapshot/schema/record.ts` and documented in `docs/templates.md`. Pros: keeps the map. Cons: a new schema key and four paths beyond O68. (c) the card also reads a one-item list as the milestone. Cons: one key with two shapes. (d) leave it. Cons: the editor cannot create a milestone the card shows. Recommended (a); (d) is the lazy option.

## The cases' first run (unchanged tree, base 5b866adf)

Cases 5 to 11 ran as a case-run program, `<scratch>/cases.test.ts` with its own config `<scratch>/vc.mts`, `<scratch>` being `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o66`, run from the worktree root with `npx vitest run --config <scratch>/vc.mts --reporter=verbose`. The folder is deleted (`ls <scratch>`: "No such file or directory"). The program prints and asserts nothing. Its source:

```ts
import { it } from 'vitest';
import * as tones from '$W/src/lib/state/shared/words/tones.ts';
import { engineDir, loadConfig, textCatalog } from '$W/src/lib/data/sources/config.ts';
import { auditRules, collector, signatureOf } from '$W/src/lib/server/content/audit/rules.ts';
import { gaps } from '$W/src/lib/server/content/audit/projects.ts';
import { holdersOf } from '$W/src/lib/data/helpers/hub-names.ts';
import { fixtureProject } from '$W/tests/fixtures/entities-fixture.ts';

const hubs = { primary: null, lists: {} };
const { config } = loadConfig(engineDir());
const catalog = textCatalog(config);
const lists = (): unknown =>
    typeof (tones as Record<string, unknown>).legendLists === 'function'
        ? (tones as unknown as { legendLists: () => unknown }).legendLists()
        : 'legendLists is not exported';
const show = (label: string, value: unknown): void => console.log(label, JSON.stringify(value));

function audit(cfg: Record<string, unknown>, stage: string) {
    const project = fixtureProject({
        id: 'hub:p', root: 'hub', tier: 'research', stage, title: 'P',
        folder: 'projects/p', file: 'projects/p/project.yml'
    });
    const { found, add } = collector(catalog, 'hub', true);
    gaps(
        {
            hub: '/nonexistent-o66-hub', root: 'hub', primary: true, projects: [project],
            collections: [], held: holdersOf([project]), self: new Set<string>(),
            rules: auditRules(cfg), catalog
        },
        add
    );
    return found
        .filter((one) => one.where === 'venue')
        .map((one) => ({ message: one.message, signature: one.signature }));
}

it('cases 5 to 11', () => {
    tones.setVocab({ stages: { a: { label: 'A' }, b: { label: 'B' } }, forms: {} }, hubs);
    show('case 5 legendLists:', lists());

    tones.setVocab(config, hubs);
    tones.setVocab({ stages: { q: { label: 'Q' } }, chips: { r: { label: 'R' } } }, hubs);
    show('case 6 legendLists:', lists());

    tones.setVocab(
        {
            palette: { '#16a34a': 'c-green' },
            stages: { x: { label: 'stage x', icon: 'green', color: '#16a34a' } },
            chips: { x: { label: 'chip x', icon: 'done' } }
        },
        hubs
    );
    show('case 7 legendLists:', lists());
    show('case 7 chipKeys:', tones.chipKeys());
    show('case 7 chipsByTone:', tones.chipsByTone(tones.chipKeys()));
    show('case 7 chipLabel(x), chipGlyphName(x):', [tones.chipLabel('x'), tones.chipGlyphName('x')]);

    tones.setVocab(
        JSON.parse('{"stages":{"s":{"label":"S"},"__proto__":{"label":"P"}},"forms":{"journal":true,"poster":{"label":"Poster"}}}'),
        hubs
    );
    show('case 8 legendLists:', lists());

    tones.setVocab(config, hubs);
    const keys = tones.chipKeys();
    show('case 9 chipKeys (' + keys.length + '):', keys);
    show('cases 1 to 3 legendLists under the shipped vocabulary:', lists());
    show(
        'case 3 chipsByTone(chipKeys()):',
        tones.chipsByTone(keys).map((row) => [row.tone, tones.chipLabel(row.key), row.count])
    );

    const today = signatureOf('projects/p', 'venue', 'data', 'audit.msg_no_venue', []);
    console.log('case 10 signature today (key, no argument):', today);
    for (const stage of ['in-prep', 'submit-ready', 'submitted', 'revision', 'published', 'building']) {
        show('case 10 ' + stage + ':', audit(config, stage));
    }

    const wip = { ...config, stages: { wip: { placed: true } } };
    show('case 11 wip:', audit(wip, 'wip'));
});
```

`$W` stands for `/Users/axelfaes/workspace/oculus/.agents/worktrees/migration-O66` (the heredoc expanded it). The config:

```ts
import { svelte } from '$W/node_modules/@sveltejs/vite-plugin-svelte/src/index.js';
import { defineConfig } from '$W/node_modules/vitest/dist/config.js';
export default defineConfig({
    root: '$W',
    plugins: [svelte()],
    test: { dir: '<scratch>', include: ['<scratch>/cases.test.ts'], environment: 'node' }
});
```

First run, on the unchanged tree, as printed:

```
case 5 legendLists: "legendLists is not exported"
case 6 legendLists: "legendLists is not exported"
case 7 legendLists: "legendLists is not exported"
case 7 chipKeys: ["x"]
case 7 chipsByTone: [{"tone":"green","key":"x","count":1}]
case 7 chipLabel(x), chipGlyphName(x): ["chip x","done"]
case 8 legendLists: "legendLists is not exported"
case 9 chipKeys (25): ["nascent","scoping","de-risking","exploring","in-prep","building","submit-ready","submitted","revision","published","released","failed","stopped","journal","conference","thesis","abstract","poster","tech-report","blocked","parked","results-in","admin-prep","numbers-to-run","ai-tells"]
cases 1 to 3 legendLists under the shipped vocabulary: "legendLists is not exported"
case 3 chipsByTone(chipKeys()): [["violet","nascent (concept)",1],["cyan","scoping (lit-check and framing)",1],["green","de-risking (feasibility experiment)",2],["honey","exploring",1],["gold","in preparation",1],["brass","building",1],["orange","submit-ready",1],["sky","submitted / under review",1],["amber","major revision (back with the authors)",1],["teal","released",1],["red","failed (no-go or disproved)",1],["grey","stopped (dropped or abandoned)",13]]
case 10 signature today (key, no argument): 2d217e014818
case 10 in-prep: [{"message":"published/submitted but no venue (no venue renders on the card)","signature":"2d217e014818"}]
case 10 submit-ready: [{"message":"published/submitted but no venue (no venue renders on the card)","signature":"2d217e014818"}]
case 10 submitted: [{"message":"published/submitted but no venue (no venue renders on the card)","signature":"2d217e014818"}]
case 10 revision: [{"message":"published/submitted but no venue (no venue renders on the card)","signature":"2d217e014818"}]
case 10 published: [{"message":"published/submitted but no venue (no venue renders on the card)","signature":"2d217e014818"}]
case 10 building: []
case 11 wip: [{"message":"published/submitted but no venue (no venue renders on the card)","signature":"2d217e014818"}]
      Tests  1 passed (1)
```

Per case on the unchanged tree:

1. By reading `Gallery.svelte` at the base: `chips` is `chipKeys().slice(0, CHIPS)` with `CHIPS = 12` (`:57`, `:60-69`), so with the 25 keys of case 9 the Chips section draws `nascent` to `failed`, one outline row and one filled row, no group heading, no form, no chip, not `stopped`. Expected after: three groups. Not met at the base.
2. By reading: `tagRow()` (`:110-116`) draws the same 12 words as tags in one row. Not met at the base.
3. By reading: `rows` is `chipsByTone(chipKeys()).slice(0, ROWS)` with `ROWS = 8` (`:72-76`), so the table draws violet, cyan, green, honey, gold, brass, orange, sky (the first 8 rows of the case 3 print above), green drawn "de-risking (feasibility experiment)" counting 2, no grey row. Not met at the base.
4. By reading: `shown` (`:94-100`) keeps a row whose tone or first word's label holds `grey`; none of the 8 rows does, so the search `grey` draws no row. Not met at the base.
5. `legendLists is not exported`. Not met at the base.
6. `legendLists is not exported`. Not met at the base.
7. `legendLists` not exported; `chipKeys()` lists `x` once, `chipsByTone` counts it once, `chipLabel('x')` and `chipGlyphName('x')` give the later list's `chip x` and `done`. The helper half already holds; the `legendLists` half is not met at the base.
8. `legendLists is not exported`. Not met at the base.
9. 25 words in the order stages, forms, chips. Holds at the base.
10. Each of the five `placed` stages gives one finding with the old sentence and the signature `2d217e014818` (sha1 over the key and no argument); `building` gives none. The sentence is not met at the base; the signature is the one to keep.
11. The finding reads the old sentence. Not met at the base.

No case is one the brief's own rules get wrong; nothing was handed back.

## DONE / NOT DONE

| Item | State | Proof (command, output after the last change) |
| --- | --- | --- |
| 1. `tones.ts` keeps each list inside `legend`, `legendLists()` exported, helpers unchanged, `FROZEN` unchanged | DONE | case run below, cases 5 to 9; `git diff --stat` shows no change to `tests/checks/tree/boundaries.test.ts`; `npx vitest run ... tests/checks/tree/boundaries.test.ts ...`: `Test Files  5 passed (5)` |
| 2. The Gallery draws every word grouped by list, one table row per hue | DONE | by reading (cases 1 to 4 below); look on landing |
| 3. `gallery.yml`: `group_stages`, `group_forms`, `group_chips`, `col_chip: Word`, `col_count: Words` | DONE | `git diff config/text/views/system/gallery.yml` (quoted under the visible changes); `npx vitest run tests/checks/source/keys.test.ts tests/checks/config/config-folder.test.ts`: `Tests  39 passed \| 2 skipped (41)` |
| 4. The no-venue finding names the stage, `signed: []` | DONE | case run, cases 10 and 11 |
| Case 1 | DONE | by reading; look on landing |
| Case 2 | DONE | by reading; look on landing |
| Case 3 | DONE | by reading and the case run's `chipsByTone` print; look on landing |
| Case 4 | DONE | by reading; look on landing |
| Cases 5 to 11 | DONE | case run below |
| Check 1, `npm run test:quick` | DONE | `test:quick: 22.0 s; every command passed` |
| Check 2, character-set check | DONE | prints nothing, `charset exit 1` (grep found no line) |
| Check 3, `grep -n "CHIPS\|ROWS" .../Gallery.svelte` | DONE | prints nothing, exit 1 |
| Check 4, `grep -n "slice(0," .../Gallery.svelte` | DONE | `99:    const leading = $derived(rows.slice(0, 3));` and `195:                        {#each chips.slice(0, 2) as chip (chip.key)}` |
| Check 5, `grep -n "msg_no_venue" config/text/views/system/audit.yml` | DONE | `42:        msg_no_venue: at the stage {0}, which carries a venue, but no venue` |
| Check 6, unused exports | DONE | `diff .agents/worktrees/O66-base/unused-exports.txt <the run's output>` prints nothing, exit 0: no line added |
| Check 7, comments read | DONE | listed under "Comments read" |

The final case run, after the last change, as printed:

```
case 5 legendLists: [{"list":"stages","keys":["a","b"]}]
case 6 legendLists: [{"list":"stages","keys":["q"]},{"list":"chips","keys":["r"]}]
case 7 legendLists: [{"list":"stages","keys":["x"]},{"list":"chips","keys":["x"]}]
case 7 chipKeys: ["x"]
case 7 chipsByTone: [{"tone":"green","key":"x","count":1}]
case 7 chipLabel(x), chipGlyphName(x): ["chip x","done"]
case 8 legendLists: [{"list":"stages","keys":["s"]},{"list":"forms","keys":["poster"]}]
case 9 chipKeys (25): ["nascent","scoping","de-risking","exploring","in-prep","building","submit-ready","submitted","revision","published","released","failed","stopped","journal","conference","thesis","abstract","poster","tech-report","blocked","parked","results-in","admin-prep","numbers-to-run","ai-tells"]
cases 1 to 3 legendLists under the shipped vocabulary: [{"list":"stages","keys":["nascent","scoping","de-risking","exploring","in-prep","building","submit-ready","submitted","revision","published","released","failed","stopped"]},{"list":"forms","keys":["journal","conference","thesis","abstract","poster","tech-report"]},{"list":"chips","keys":["blocked","parked","results-in","admin-prep","numbers-to-run","ai-tells"]}]
case 3 chipsByTone(chipKeys()): [["violet","nascent (concept)",1],["cyan","scoping (lit-check and framing)",1],["green","de-risking (feasibility experiment)",2],["honey","exploring",1],["gold","in preparation",1],["brass","building",1],["orange","submit-ready",1],["sky","submitted / under review",1],["amber","major revision (back with the authors)",1],["teal","released",1],["red","failed (no-go or disproved)",1],["grey","stopped (dropped or abandoned)",13]]
case 10 signature today (key, no argument): 2d217e014818
case 10 in-prep: [{"message":"at the stage in preparation, which carries a venue, but no venue","signature":"2d217e014818"}]
case 10 submit-ready: [{"message":"at the stage submit-ready, which carries a venue, but no venue","signature":"2d217e014818"}]
case 10 submitted: [{"message":"at the stage submitted / under review, which carries a venue, but no venue","signature":"2d217e014818"}]
case 10 revision: [{"message":"at the stage major revision (back with the authors), which carries a venue, but no venue","signature":"2d217e014818"}]
case 10 published: [{"message":"at the stage published, which carries a venue, but no venue","signature":"2d217e014818"}]
case 10 building: []
case 11 wip: [{"message":"at the stage wip, which carries a venue, but no venue","signature":"2d217e014818"}]
      Tests  1 passed (1)
```

Cases 1 to 4 after the change, by reading `src/lib/views/system/gallery/Gallery.svelte`:

1. `groups` (`:78-84`) maps `legendLists()` to one group per list, its `heading` from `heading()` (`:71-75`, the literal `t('gallery.group_stages')`, `t('gallery.group_forms')`, `t('gallery.group_chips')`) and its words in the list's order. The Chips section (`:225-236`) draws, per group, `<h4>` with the heading, then `chipRow(group.words, false)` when the form is not Filled and `chipRow(group.words, true)` when it is not Outline. Under the shipped vocabulary `legendLists()` gives 13, 6 and 6 words (the "cases 1 to 3" line), `stopped`, `journal` and `ai-tells` among them, so Both draws 25 outline and 25 filled chips under Stages, Forms and Chips.
2. The Tags section (`:242-249`) draws the same `groups`, a heading and `tagRow(group.words)` each: 25 tags in three groups.
3. `rows` (`:90-96`) is `chipsByTone(chipKeys())` with no slice: the 12 rows of the `chipsByTone` line, green "de-risking (feasibility experiment)" 2, grey "stopped (dropped or abandoned)" 13. The table (`<Table {columns} rows={shown} ...>`) draws `shown`, which with an empty search is every row.
4. `shown` (`:117-123`, unchanged) keeps a row whose tone or first word's label holds the needle; of the 12 rows only the tone `grey` holds `grey`, and no label in the `chipsByTone` line holds it, so one row.

Case 5's Gallery half: `legendLists()` returns no row for an empty list, so `groups` has one entry and the `{#each groups ...}` blocks draw one heading, Stages. Case 7's Gallery half: `legendLists()` holds `x` in the stages and the chips rows, each group draws it once, and `sample('x')` reads `chipLabel` and `chipGlyphName`, which give the later list's `chip x` and `done`.

## Runs of the verify list and whole-suite commands

`npm run diagrams && npm run test:quick` ran three times. The first was red on svelte-check, a file the step changed: `ERROR "src/lib/views/system/gallery/Gallery.svelte" 131:25 "Cannot find name 'Sample'."` and the same at 139:26 (a type declared in the instance script is not in scope for a top-level snippet's parameter); the type was moved into the module script and the second run was green. The third ran after the last change, which rewrote two comments (the Gallery head comment and the comment over `signed: []`) after the second run; its last line is `test:quick: 22.0 s; every command passed`. No whole-suite command ran. Single files run while working: `npx vitest run tests/routes/docs/audit.test.ts tests/state/boards/board/board-rules.test.ts tests/state/boards/board/hub-facets.test.ts tests/checks/tree/boundaries.test.ts tests/checks/source/keys.test.ts` (`Tests  107 passed (107)`) and `npx vitest run tests/checks/source/keys.test.ts tests/checks/config/config-folder.test.ts` (`Tests  39 passed | 2 skipped (41)`).

The step adds or changes no test.

## Files

From `git status --short`, `git diff --numstat` and `wc -l` after the last change (the base copy holds no `docs/`, so the `diff -rq` against it lists the six source and config files and `git diff --stat` the rest):

| File | Lines | Change | In the write list |
| --- | --- | --- | --- |
| `src/lib/state/shared/words/tones.ts` | 318 | +44 -17 | yes |
| `src/lib/views/system/gallery/Gallery.svelte` | 363 | +80 -40 | yes |
| `config/text/views/system/gallery.yml` | 42 | +5 -2 | yes |
| `config/text/views/system/audit.yml` | 75 | +1 -1, line 42 only | yes, lines 42-42 |
| `src/lib/server/content/audit/rules.ts` | 376 | +18 -1 | yes |
| `src/lib/server/content/audit/projects.ts` | 542 | +3 -1 | yes |
| `docs/diagrams/layer-server.dot`, `layer-server.svg`, `layers.dot`, `layers.svg` | 1 line each | an edge count 47 to 48 and 519 to 520 | no: written by `npm run diagrams`, which `spec.md` runs before each run of the list, for the new import of `data/shapes/shapes.ts` in `rules.ts` |
| `.scratch/migration/agents/reviews/O66-report.md` | this file | new | yes |

## Judgment calls the brief left open

1. A group heading is an `<h4>` under the section's `<h3>`, styled `margin: 12px 0 6px`, `font-size: var(--fs-xs)`, `font-weight: 600`, no colour, and `h3 + h4 { margin-top: 0 }` so the first group sits under the section heading as the rows did. The `h3` rule is unchanged.
2. In the Chips section each group draws its outline row and its filled row under its own heading (Stages outline, Stages filled, Forms outline, ...), rather than all outline rows then all filled rows.
3. The Meters and the Ticker read one derived `leading = rows.slice(0, 3)`, and `most` is taken over `leading`, so the fills are today's: today `most` over the first 8 rows is 2, now over the first 3 it is 2 (counts 1, 1, 2 in the case run).
4. `legendLists()` returns a fresh copy of each row and its keys per call, so a caller cannot change the installed legend; `chipKeys()` also returns a fresh array.
5. The `__proto__` filter moved from `setVocab` into `legendRows`, so each list drops it before its keys are kept; the word map is built from the same rows, so `chipKeys()` is unchanged (case 9).
6. `AuditRules.stageLabel` is a function `(stage) => string`, built by `stageLabelOf(config)` called where `placedStages` is built, so the fallback to the word lives in one place. It reads the row with `byKey` and the label with the existing `filledText` (`src/lib/data/shapes/shapes.ts:51`); a label that is not a string, or is empty, gives the word.
7. The `Sample` type of the Gallery sits in the module script, with a comment saying why.

## Host- and user-visible changes, before and after (for the look on TEST)

The Gallery view (System page, Gallery), Chip form segment on Both, search empty:

- Chips section. Before: two rows, 12 outline then 12 filled chips, `nascent` to `failed`, no heading. After: three headings, Stages, Forms, Chips, in `--fs-xs` weight 600 in the text colour; under Stages 13 outline and 13 filled chips (`stopped` last), under Forms 6 and 6 (`journal article` to `tech report (not peer-reviewed)`), under Chips 6 and 6 (`blocked (external)` to `AI-writing tells`). Outline shows only the outline rows; Filled only the filled rows.
- Tags section. Before: one row of 12 tags. After: the same three headings, 13, 6 and 6 tags.
- Table. Before: 8 rows, violet to sky, columns Tone, Chip, Chips. After: 12 rows, violet, cyan, green, honey, gold, brass, orange, sky, amber, teal, red, grey; columns Tone, Word, Words; green row "de-risking (feasibility experiment)" 2, grey row "stopped (dropped or abandoned)" 13. Search `grey`: one row, grey (before: none).
- Meters and Ticker. Unchanged: violet, cyan, green; the meters filled half, half and full.
- First card's two chips and the toned card's tone: unchanged (`nascent (concept)`, `scoping (lit-check and framing)`; violet).

The audit (Findings and Audit views), a project at a `placed` stage with no `venue`:

- Before: `published/submitted but no venue (no venue renders on the card)`.
- After: `at the stage <label>, which carries a venue, but no venue`, for example `at the stage submitted / under review, which carries a venue, but no venue`. The signature is the same as before (`2d217e014818` for the scratch project in the case run, before and after), so a muted finding stays muted.

The catalog diff:

```
-        col_chip: Chip
-        col_count: Chips
+        col_chip: Word
+        col_count: Words
+        group_chips: Chips
+        group_forms: Forms
+        group_stages: Stages
-        msg_no_venue: published/submitted but no venue (no venue renders on the card)
+        msg_no_venue: at the stage {0}, which carries a venue, but no venue
```

## Other checks the rules file asks for

- Reuse grep before writing the new helper and field: `grep -rn "stageLabel\|stage_label\|stageLabels" src tests` printed nothing; `filledText` and `byKey` are reused. `grep -rn "legendRows\|legendLists\|legend\.\|byKey(legend" src tests` outside `tones.ts` named only `ui/controls/editor/kit/lsp/semantic.ts` and `server/machine/lsp/held/held.ts`, which read an LSP token legend, another thing.
- Name grep after the change: `grep -rn "chipsByTone\|chipKeys\|legendLists\|LegendList" src tests docs README.md config --exclude=local.yml` (outside `docs/diagrams`) names `tones.ts`, `facets.ts:12,105` (unchanged, its order kept by case 9) and the Gallery.
- New keys: `group_stages`, `group_forms`, `group_chips` each occur once in `gallery.yml` and once in `Gallery.svelte` (`grep -rn "group_stages\|group_forms\|group_chips" src config tests --exclude=local.yml`); `stageLabel` collides with no field of `AuditRules`. No asynchronous path: a later `setVocab` replaces the whole `legend` value (case 6).
- History-word grep over the added comment lines (`git diff -U0 -- src | grep '^+' | grep -E "//|\*|<!--" | grep -iE "before|used to|no longer|still|..."`) prints one line, `+ * rather than throwing: a half-read config still renders a page.`, the existing sentence of `setVocab`'s comment rewrapped; its `still` means "even so", not a comparison with an earlier state.
- Line width: `awk 'length > 100 && !/eslint-disable/'` over the four changed source files prints nothing.

## Comments read

Each new or changed comment, read against `spec.md`'s rules on comments and prose; none departs from them:

- `tones.ts`: `LISTS`, `LegendList`, `Installed`, `legendRows` (one sentence added), `setVocab` (paragraph rewritten and rewrapped), `legendLists`.
- `rules.ts`: `AuditRules.stageLabel`, `stageLabelOf`.
- `projects.ts`: the line over `signed: []`.
- `Gallery.svelte`: the head comment's second paragraph, `Sample`, `sample`, `heading`, `groups`, `chips`, `rows`, `leading`, `most`.

Documents and comments that describe the changed behaviour: `tones.ts` `chipKeys` ("still true"), `chipsByTone` ("still true"), `chipTone` ("still true"); `Gallery.svelte` the Tags section's markup comment ("still true"); `rules.ts` `Raised` ("still true"); `config/catalogs/vocab.yml:57`, "`placed`: a stage that has a venue, so the audit asks for one." ("still true"); `docs/HELP.md:252`, "Every UI primitive with sample data." ("still true"). `docs/HELP.md` gains no bullet: the step changes what the Gallery shows and what a finding says, not what a user does.

## Limitations and sharp edges

- The Gallery's groups, headings and table rows need a DOM to be seen; they are checked by reading and are owed the look on TEST.
- The table's Word column draws the first word of each hue as a chip in that hue, as before; a hue's first word is a stage for every row of the shipped vocabulary, since stages come first in `chipKeys()`.
- A word in two lists keeps one label and one glyph, the later list's, in both groups (case 7), as the word map already did.

## Wrong or impossible in the brief

Nothing.
