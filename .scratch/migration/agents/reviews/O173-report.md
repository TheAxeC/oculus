Everything in the brief is done

## Open items of the state file, verbatim

None.

## The cases' first run (unchanged source; the tests added to the two test files first)

The commands, run with `TMPDIR` and `GIT_CEILING_DIRECTORIES` on `.agents/scratch/`: `npx vitest run tests/routes/docs/audit.test.ts --reporter=verbose --testTimeout 20000 -t "the required files of the audit|the shape of the audit setting"`, and `npx vitest run tests/server/edit/config-value.test.ts --reporter=verbose --testTimeout 20000 -t "a list or family written into the hub the write names"`. The 20000 is the time limit of `npm run test:slow`, since `config-value.test.ts` is tagged slow.

No case was found that the brief's rules get wrong.

| Case | How checked | Result on the unchanged source |
| --- | --- | --- |
| C1 | test `require a file 'of a project of a tier the words list<ellipsis>'` | red: `AssertionError: expected [ { <ellipsis>(8) } ] to deeply equal []`, the extra finding `"where": "audit.required_files.0.tiers"`, `tests/routes/docs/audit.test.ts:289` |
| C2 | test `require a file 'of no project with no tier under a wo<ellipsis>'` | red, the same shape finding |
| C3 | test `require a file 'of a project of another tier and of o<ellipsis>'` | red, the same shape finding |
| C4 | test `require a file 'only of a project meeting both the ti<ellipsis>'` | red, the same shape finding |
| C5 | test `name 'a list in place of a block' under tiers and run the next row of required_files` | green: the unchanged reader already names `audit.required_files.0.tiers`, a field it does not take; preserved behaviour, green before and after |
| C6 | test `require a file 'of no project of a tier skip_tiers na<ellipsis>'` | red, the same shape finding: the assertion is that the row raises neither a shape finding nor a file finding |
| C7 | the eight existing rows of `describe('the required files of the audit'` in the same verbose run | all `<check>` |
| C8 | reading `tests/tiers/quick.mjs:47,195,212` | a change under `src` chooses none of the three imports checks: `SCANNERS` was `['tests/checks/source/', 'tests/checks/tree/']` (`:47`), `scansSource` keeps a test whose path starts with one of them (`:195`), `chooseTests` runs them only when a changed path is under `SCANNED` (`:212`). A change under `docs/` alone chooses none, since `docs/` is not in `SCANNED` |
| C9 | only a page shows it | named for the look on landing |
| C10 | test `name 'a block naming flags' under tiers and run the next row of required_files` | green on the unchanged reader, same reason as C5 |
| C11 | row `a file only the projects of the tiers it names must hold, under audit` of `LAB_ROWS` | red: `tests/server/edit/config-value.test.ts:463` `expected [ [ { <ellipsis>(2) } ], [] ] to deeply equal [ [], <ellipsis>(1) ]`, the refusal `"Entry 1 has a field tiers that this setting does not describe"` |

Test files after the first run: `Tests  5 failed | 13 passed | 20 skipped (38)` for `audit.test.ts`, `Tests  1 failed | 6 passed | 17 skipped (24)` for `config-value.test.ts`.

## DONE / NOT DONE

| Item | State | Proof |
| --- | --- | --- |
| 1 `tiers` field of `FILE_FIELDS`, `wordBlock` without flags | DONE | `src/lib/server/content/audit/setting.ts:123` (`tiersBlock`), `:129`; C5 and C10 green in Verify 2: `Tests  62 passed (62)` |
| 2 `AuditRules.tiers`, `tierMeets`, `requiredFiles` | DONE | `rules.ts:57` and `:169` (`tiers: config.tiers`), `projects.ts:268`, `:283`; C1, C2, C3, C4, C6 green in Verify 2: `Tests  62 passed (62)` |
| 3 the field and help in `behavior.yml` | DONE | `config/options/behavior.yml:27` and the `tiers` field after `stages`; C11 green in Verify 2: `Tests  62 passed (62)` |
| 4 `docs/templates.md` | DONE | read at `:291-295` and the example row after `:306`; prettier via the verify list |
| 5 comments | DONE | `setting.ts:24-27`, `projects.ts:273-277`, `words.ts:1-10`, `words.ts:79`, the verify 3 grep below |
| 6 `tests/checks/imports/` joins `SCANNERS` | DONE | `tests/tiers/quick.mjs:48`, comments at `:11` and `:32`, the log lines `:308-310`; C8 proven by the test list of the final run: `tests/checks/imports/augments.test.ts: scans the source text of a changed file`, the same line for `cycles.test.ts` and `order.test.ts` (lines 26-28 of the list's output) |
| 7 tests | DONE | the first run above; green after the change in Verify 2, `Test Files  2 passed (2)`, `Tests  62 passed (62)` |
| C9 | DONE by reading; its proof is the look on landing (only a page shows it) | the look on landing: Settings, heading Boards, section Audit checks, option `audit.required_files`: a row's fields hold a `tiers` control after `stages`; its Words and Not words lists offer `research`, `personal` and `software`. `FieldControl.svelte:261` draws the four lists of `BLOCK_LISTS` for every block, so the Flags and Not flags lists are drawn with no words to offer |
| Verify 1 | DONE | `npm run test:quick -- <the nine paths>`, with `TMPDIR` unset, after `npm run diagrams`: output quoted below; ends `test:quick: 141.9 s; every command passed` |
| Verify 2 | DONE | `npx vitest run tests/routes/docs/audit.test.ts tests/server/edit/config-value.test.ts --reporter=dot` with `TMPDIR` unset: `Test Files  2 passed (2)`, `Tests  62 passed (62)`, zero timeouts |
| Verify 3 | DONE | the list below |
| Verify 4 | DONE | every new test ran on the unchanged source (the table above) and after the change, in Verify 2: `Tests  62 passed (62)`; C5 and C10 are behaviour the change preserves, green in both; the others are behaviour it adds, red on the unchanged source |
| Verify 5 | DONE | every new list item and sentence read against the standards page; departures: none |

Verify 1 output (the list's lines, cut at the first 180 columns):

```
test:quick: 9 changed file(s), from the given paths
test:quick: 31 test file(s)
        tests/checks/imports/augments.test.ts: scans the source text of a changed file
        tests/checks/imports/cycles.test.ts: scans the source text of a changed file
        tests/checks/imports/order.test.ts: scans the source text of a changed file
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (3.0 s)
ok      eslint (17.0 s)
ok      svelte-check (17.1 s): 1794181065789 COMPLETED 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (80.3 s): Duration  60.33s (transform 35.51s, setup 0ms, import 96.88s, tests 132.83s, environment 5ms)
ok      vitest slow (122.4 s): Duration  102.13s (transform 61.23s, setup 0ms, import 105.22s, tests 180.04s, environment 2ms)
ok      vitest checks (138.9 s): Duration  117.31s (transform 36.46s, setup 0ms, import 76.56s, tests 258.56s, environment 4ms)
test:quick: 141.9 s; every command passed
test:quick: not covered: tests that reach no changed file within the import depth,
            other than the checks under tests/checks/source, tests/checks/tree and
            tests/checks/imports, which run for any change under src, tests or
            utils; the build, the lint of unchanged files
```

Full-list runs: 2. The first was red on svelte-check alone (`tests/routes/docs/audit.test.ts:289`, the inferred type of the table's `files`, the table then given a declared type, now `TiersCase`); `svelte-check` was rerun alone (`COMPLETED 4648 FILES 0 ERRORS 0 WARNINGS`) and the list run once more, the run quoted. No whole-suite command was run.

Verify 3, `grep -rn` of each pattern across `src`, `tests`, `docs` and `config` (with `--exclude=local.yml`), each hit by location with the judgment (the `.svg` and `.dot` diagram files are generated and left out of this list):

- `required_files`, true: `src/lib/server/root/watch/portfolio/audited.ts:9`, `src/lib/data/shapes/hub-keys.ts:46`, `src/lib/data/model/index.ts:355`, `src/lib/data/helpers/hub-names.ts:763`, `src/lib/views/system/findings/AuditSection.svelte:6`, `tests/routes/docs/audit.test.ts:123,140,153,170,187,205,299,699,708,753,755,760,771`, `tests/server/edit/config-value.test.ts:436,443`, `docs/data-map.md:117`, `config/defaults/behavior.yml:28,30`, `src/lib/server/content/audit/setting.ts:2,10,60,124,156`, `docs/templates.md:301,306`. Corrected: `setting.ts:25` (the row's comment), `projects.ts:273`, `docs/templates.md:291`, `config/options/behavior.yml:24` (the option's help at `:27`).
- `stageMeets`, true: `projects.ts:263,282,371`.
- `blockHolds`, true: `projects.ts:27,264,269`, `rules.ts:50,55`, `boards/takes.ts:19,150,151,152`, `boards/categories.ts:21,128,129`, `boards/words.ts:81` (its doc comment corrected at `:79`).
- `word block`, true: `projects.ts:262,267`, `setting.ts:119` (new), `rules.ts:49`, `config-fit.ts:62,219`, `config-value.ts:8`, `system/config/rows.ts:200`, `editors/draft.ts:4,6,16`, `editors/offers.ts:81`, `editors/fields.ts:10,148,153,347,413`, `catalog-files/vocab.ts:294,298`, `catalog-files/options.ts:21,37`, `catalog-words.ts:101`, `boards/takes.ts:3`, `boards/words.ts:21`, `settings/reader.ts:67`, `merge/hub-layer.ts:85,138,196,197,243`, `value-rule.ts:11,64,188`, `schemas/options.ts:14,161`, `catalog/options.ts:175,185,463,813`, `Editor.svelte:2,4`, `FieldControl.svelte:250`, `config/options/appearance.yml:10`. `catalog-files/vocab.ts:298-301` says the `stages` of a row is a `wordBlock`, which holds; the row's `tiers` is the flagless form named at `setting.ts:119`. Corrected: `boards/words.ts:1`, `docs/templates.md:292,293`.
- `SCANNERS`, true: `tests/tiers/quick.mjs:50,196,202`. Corrected: `:48`.
- `tests/checks/tree`, true: `tests/checks/tree/allow-duplication.txt:9,10`, `tests/checks/tree/layer-rows.ts:2`, `tests/checks/imports/order.ts:22`. Corrected: `tests/tiers/quick.mjs:11,32,48,308`.

The words grep over added comment lines and test titles (`git diff -U0 ... | grep -iE "\b(before|used to|no longer|still|...)\b"` over the nine paths): no line printed.

`LC_ALL=C grep -n '[^ -~]'` over the nine changed files: nothing printed. `sh utils/unused-exports.sh` after the last change compared with the base copy's `unused-exports.txt` by `diff`: no difference, exit 0. No export was added.

## The terms

`docs/glossary.md` is not in this checkout (`ls docs/glossary.md` fails), so there is no term of it to add, change or use.

## The files

From `diff -rq <base copy> <worktree>` over `src`, `tests`, `config` and `docs`, with line counts from `wc -l` and `git diff --numstat` (added, removed):

| Path | Lines now | Diff |
| --- | --- | --- |
| `src/lib/server/content/audit/setting.ts` | 184 | +19 -2 |
| `src/lib/server/content/audit/projects.ts` | 598 | +8 -2 |
| `src/lib/server/content/audit/rules.ts` | 373 | +6 -0 |
| `src/lib/data/shapes/boards/words.ts` | 100 | +10 -9 |
| `config/options/behavior.yml` | 1628 | +5 -1 |
| `docs/templates.md` | 1942 | +4 -2 |
| `tests/routes/docs/audit.test.ts` | 790 | +91 -0 |
| `tests/server/edit/config-value.test.ts` | 526 | +21 -0 |
| `tests/data/sources/config/layers/layers-fixture.ts` (added to the write list by the round brief) | 65 | +8 -4 |
| `tests/tiers/quick.mjs` | 311 | +20 -19 |
| `docs/diagrams/writes.dot` | outside the write list | +2 -2 |
| `docs/diagrams/writes.svg` | outside the write list | +5 -5 |
| `.scratch/migration/agents/reviews/O173-report.md` | this report | |

The two diagram files are generated: `npm run diagrams`, which the rules file says runs right before each run of the list, moved the node's label `src/lib/data/shapes/boards/words.ts:26` to `:27` because the head comment of `words.ts` grew by one line. The diff of the step names them as outside the write list for that reason.

Every edit to an existing assertion, allow list or predicate: `tests/tiers/quick.mjs:48` `SCANNERS` (before `['tests/checks/source/', 'tests/checks/tree/']`, after the same with `'tests/checks/imports/'`, as item 6 asks). No existing assertion or row was changed. The added rows and helper are in the diffs of the two test files; `tests/server/edit/config-value.test.ts` gains one row of `LAB_ROWS`, `findingsNaming`, the imports `Finding` and `readerFindings`, and one added assertion in the `it.each` of that describe, `expect(findingsNaming(made.into.engine, made.lab, key)).toEqual([])`. G125 names the describes of the audit test (`.scratch/migration/agents/guarded.md:191`) and the `LAB_ROWS` describe is named at `:75`, so every new row belongs to an entry.

Head comments and doc comments of the functions touched, each read after the change: `setting.ts` head comment (still true), `RequiredFile` (rewritten), `tierMeets` (new), `requiredFiles` (rewritten), `AuditRules.tiers` (new), `words.ts` head comment and `blockHolds` (rewritten), `quick.mjs` head comment and the `SCANNERS` comment (rewritten and still true of the three folders), `docs/templates.md:291-295` (rewritten). `docs/HELP.md`, `docs/data-map.md` and `docs/decks.md` hold nothing the change makes false: `grep -n "required_files" docs/HELP.md docs/decks.md` is empty and `docs/data-map.md:117` names no field of a row.

## Judgment calls the brief left open

- The name `tiersBlock` for the flagless `wordBlock` in `setting.ts:123`, a local constant.
- The two new test tables use `it.each` rows rather than separate `it`s, as the rules file's test rule asks where a unit has several outcomes; the first assertion of the table (no finding scoped to the settings file) makes C2 and C6 red on the unchanged reader, where a row naming `tiers` is off because the reader names it a problem.
- `findingsNaming` in `config-value.test.ts` runs the readers the write's own refusal runs (`config-checks.ts:88`), through `readerFindings`, and asserts on every row of `LAB_ROWS`, so the new row's "no finding of the config channel names it" is checked over the merged config rather than the write's refusal alone.

## Host- or user-visible changes, before and after

- Settings, option `audit.required_files`: a row gains the field `tiers`, words control, drawn from the tiers. Before, a row naming `tiers` written through the form or the config-value route was refused ("Entry 1 has a field tiers that this setting does not describe"). After, it is taken and stored. The form draws Flags and Not flags for every word block, with no words offered here, at the look on landing.
- The audit: a row of `audit.required_files` in a hub's `.oculus/config.yml` naming `tiers` was the problem `audit.required_files.<n>.tiers`, its row off. After, it holds the row to the projects whose tier meets it; a project with no tier meets a block naming only `not_words`, a project of a tier `research_audit.skip_tiers` names is held to no row, and a `tiers` value not of the flagless block's shape is the same problem as before.
- The help of `audit.required_files` names `tiers`, and `docs/templates.md` describes it, with the example row.
- `npm run test:quick` chooses the checks under `tests/checks/imports/` for any change under `src`, `tests` or `utils`, and its last lines name the folder.

## Anything in the brief wrong or impossible

Nothing wrong was found by a run. One line depends on a file absent from the tree: the terms section asks for `docs/glossary.md`, and `ls docs/glossary.md` fails, so that section says there is none.

## Doc text

`grep -n` of `.scratch/migration/agents/guarded.md:189`:

```
189:- G125. The audit holds a hub to the conventions its own `audit:` setting names, and to none it does not name: a file a `required_files` row requires when every key the row names holds (the stage, the folder in the project, the hub folders), a heading a `required_sections` row requires when the manifest key it names holds a value, and a hub project at a stage a `stage_folders` row names kept under one of its folders; a project of a tier `research_audit.skip_tiers` names is held to none, a project of a workspace repository to no row naming hub folders, a hub without `audit:` gets none of these findings, and a part of `audit:` that is not of its shape is a finding and is off while the rest runs. For the primary hub whose `website.folder` names a folder, the audit builds the website's three generated files in memory and compares each with the file on disk at the path `website.files` gives, by parsed value, the order of the sections, of the entries and of a links list counted and the order of the keys inside an entry not: a file that differs is one finding naming the file and the first place it differs at, offering Write the website; a title or a `cv:` value of the website's own file raises nothing; a folder that is not there is one finding naming it, an empty `website.folder` gives none, a user who is not known is one finding and no file is compared, a path of `website.files` that is empty, absolute, comes to no place under the website's folder or names the file of another key is one finding naming the key and its value with none of the four files read, the watch list leaves such a path out, and a change on disk to any of the three raises or clears its finding without a restart.
```

Replacement for that line (the only change is the parenthesis, naming the tier):

```
- G125. The audit holds a hub to the conventions its own `audit:` setting names, and to none it does not name: a file a `required_files` row requires when every key the row names holds (the stage, the tier, the folder in the project, the hub folders), a heading a `required_sections` row requires when the manifest key it names holds a value, and a hub project at a stage a `stage_folders` row names kept under one of its folders; a project of a tier `research_audit.skip_tiers` names is held to none, a project of a workspace repository to no row naming hub folders, a hub without `audit:` gets none of these findings, and a part of `audit:` that is not of its shape is a finding and is off while the rest runs. For the primary hub whose `website.folder` names a folder, the audit builds the website's three generated files in memory and compares each with the file on disk at the path `website.files` gives, by parsed value, the order of the sections, of the entries and of a links list counted and the order of the keys inside an entry not: a file that differs is one finding naming the file and the first place it differs at, offering Write the website; a title or a `cv:` value of the website's own file raises nothing; a folder that is not there is one finding naming it, an empty `website.folder` gives none, a user who is not known is one finding and no file is compared, a path of `website.files` that is empty, absolute, comes to no place under the website's folder or names the file of another key is one finding naming the key and its value with none of the four files read, the watch list leaves such a path out, and a change on disk to any of the three raises or clears its finding without a restart.
```

## Repair round 1

Everything in the round brief is done. Every line number and count above is taken after this round's last change.

### Item 1, the comment above `tiersBlock` (Standards 1)

`src/lib/server/content/audit/setting.ts:118-122` now reads: "A word block of the tiers: `words` and `not_words`. `FLAG_SOURCES` names no list of flags for `tiers`, so the form offers no flag on such a block and the config check refuses one (schemas/options.ts), and a block naming flags is not of this shape." The code at `:123` is unchanged.

### Item 2, one copy of the findings helper (Standards 2)

`readerFindings` in `tests/data/sources/config/layers/layers-fixture.ts:48-55` takes `read: Pick<ReturnType<typeof loadConfig>, 'config' | 'from'>`, `hub` and a third argument `engine: string = engineDir()`. `findingsNaming` in `tests/server/edit/config-value.test.ts:375-380` calls `readerFindings(read, dir, engine)`; the file's import of `READER_FINDINGS` is gone. The callers in `tests/data/shapes/catalog-files/vocab.test.ts` and `tests/data/sources/config/layers/{agents,hub-vocab,catalogs}.test.ts` are unchanged and pass: `npx vitest run tests/server/edit/config-value.test.ts tests/routes/docs/audit.test.ts tests/data/shapes/catalog-files/vocab.test.ts tests/data/sources/config/layers --reporter=dot --testTimeout 20000` printed `Test Files  8 passed (8)`, `Tests  152 passed (152)`.

The local type of the table in `tests/routes/docs/audit.test.ts` is named `TiersCase`, since the grep below shows `TierRow` is the exported type of a venue's tiers in `src/lib/state/boards/structure/lines.ts:47`, a different thing. `grep -rn -- <name> src tests`:

```
== tierMeets
src/lib/server/content/audit/projects.ts:268:function tierMeets(input: AuditInput, project: Project, block: WordBlock | undefined): boolean {
src/lib/server/content/audit/projects.ts:283:            if (!tierMeets(input, project, row.tiers)) continue;
== tiersBlock
src/lib/server/content/audit/setting.ts:123:const tiersBlock = wordBlock.omit({ flags: true, not_flags: true });
src/lib/server/content/audit/setting.ts:129:    tiers: tiersBlock,
== TierRow
src/lib/state/boards/structure/lines.ts:47:export type TierRow = {
src/lib/state/boards/structure/lines.ts:60:export type TierCount = TierRow & { count: number };
src/lib/state/boards/structure/lines.ts:111:    tiers: TierRow[],
src/lib/state/boards/structure/lines.ts:310:    .transform((row): TierRow => ({
src/lib/state/boards/structure/lines.ts:325:export function venueTiers(value: unknown): TierRow[] {
src/lib/views/shared/card/record/registry/LineCard.svelte:37:        type TierRow,
src/lib/views/shared/card/record/registry/LineCard.svelte:49:        tiers: TierRow[];
== TiersCase
tests/routes/docs/audit.test.ts:235:    type TiersCase = {
tests/routes/docs/audit.test.ts:244:    it.each<TiersCase>([
== findingsNaming
tests/server/edit/config-value.test.ts:375:function findingsNaming(engine: string, dir: string, key: string): Finding[] {
tests/server/edit/config-value.test.ts:465:            expect(findingsNaming(made.into.engine, made.lab, key)).toEqual([]);
== wordBlock.omit
src/lib/server/content/audit/setting.ts:123:const tiersBlock = wordBlock.omit({ flags: true, not_flags: true });
== READER_FINDINGS.flatMap
tests/data/sources/config/layers/layers-fixture.ts:54:    return READER_FINDINGS.flatMap((reader) => reader(where, read.config));
```

The key call of `tierMeets` and `tiersBlock` has no earlier copy: `blockHolds(block, wordList(project.tier), ...)` is the one call of its kind on a tier, beside `stageMeets`' on a stage.

### Item 3, the key `tiers` empty, duplicated or colliding (Standards 3)

No code changed for this item. Each form was run through `hubAuditSetting`, `blockHolds` and the config channel's findings by the case-run program below, after the last change.

| Form in a row | What the code does |
| --- | --- |
| `tiers: {}` | Taken, no problem. It places no condition: the row holds for every tier and for a project with no tier, as a row with no `tiers`. |
| `tiers: { words: [] }` | Taken, no problem and no finding. The row holds for no project, so it asks nothing of anyone, the same as `stages: { words: [] }`. |
| `tiers: null` | The problem `audit.required_files.0.tiers`, the row off, the other rows running. |
| A tier word no vocabulary row holds (`tiers: { words: [nosuch] }`) | Written by hand in the hub's file: taken, no problem and no finding of the config channel, and the row holds for no project, as a stage word no vocabulary row holds does under `stages`. Written through Settings or the config-value route: refused as a word outside the list `from` names, by reading `src/lib/data/sources/config/catalog/value-rule.ts:200-201`, and the form offers only the tiers there are. |
| `tiers` named twice in one row | The YAML reader refuses a repeated key, so the hub's whole `.oculus/config.yml` does not parse. `hubAuditValue` (`setting.ts`) catches that and gives no `audit:` value: no row, no problem and every check of the setting off for that hub. The config channel carries the one finding `does not parse: Map keys must be unique at line 3, column 51:`. |
| Colliding with a configured or reserved key | A row's keys are looked up in `FILE_FIELDS` with `Object.hasOwn` (`setting.ts`, `rowsOf`), one namespace per row, so `tiers` collides with no other field; the top-level vocabulary `tiers:` is another place and is only read as the map a block is held against. |

The program, `.agents/scratch/tiers-cases.mjs`, run with `TMPDIR` and `GIT_CEILING_DIRECTORIES` on `.agents/scratch/` and removed before this report:

```
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { hubAuditSetting } from '../../src/lib/server/content/audit/setting.ts';
import { blockHolds, wordList } from '../../src/lib/data/shapes/boards/words.ts';
import { engineDir, loadConfig } from '../../src/lib/data/sources/config.ts';
import { READER_FINDINGS } from '../../src/lib/data/sources/config/sections/findings.ts';

const CASES = {
    'tiers: {}': '{ file: A.md, tiers: {} }',
    'tiers: { words: [] }': '{ file: A.md, tiers: { words: [] } }',
    'stages: { words: [] }': '{ file: A.md, stages: { words: [] } }',
    'tiers: null': '{ file: A.md, tiers: null }',
    'tiers: { words: [nosuch] }': '{ file: A.md, tiers: { words: [nosuch] } }',
    'tiers named twice in one row':
        '{ file: A.md, tiers: { words: [research] }, tiers: { words: [software] } }'
};

const engine = engineDir();
const scratch = join(import.meta.dirname, 'hubs');
mkdirSync(scratch, { recursive: true });

for (const [name, row] of Object.entries(CASES)) {
    const hub = mkdtempSync(join(scratch, 'hub-'));
    mkdirSync(join(hub, '.oculus'));
    writeFileSync(join(hub, '.oculus', 'config.yml'), `audit:\n  required_files:\n    - ${row}\n`);
    const setting = hubAuditSetting(hub);
    console.log(`== ${name}`);
    console.log('rows:', JSON.stringify(setting.requiredFiles));
    console.log('problems:', JSON.stringify(setting.problems));
    const kept = setting.requiredFiles[0];
    const block = kept?.tiers ?? kept?.stages;
    if (block !== undefined) {
        for (const tier of ['research', 'software', undefined]) {
            console.log(`holds for ${tier}:`, blockHolds(block, wordList(tier), {}));
        }
    }
    const read = loadConfig(engine, { hub });
    const where = { engine, hub, from: read.from };
    const named = [...read.findings, ...READER_FINDINGS.flatMap((find) => find(where, read.config))]
        .filter((one) => one.key.startsWith('audit') || one.file.endsWith('.oculus/config.yml'))
        .map((one) => `${one.key} | ${one.message}`);
    console.log('config channel:', JSON.stringify(named));
}
```

Its output:

```
== tiers: {}
rows: [{"file":"A.md","tiers":{}}]
problems: []
holds for research: true
holds for software: true
holds for undefined: true
config channel: []
== tiers: { words: [] }
rows: [{"file":"A.md","tiers":{"words":[]}}]
problems: []
holds for research: false
holds for software: false
holds for undefined: false
config channel: []
== stages: { words: [] }
rows: [{"file":"A.md","stages":{"words":[]}}]
problems: []
holds for research: false
holds for software: false
holds for undefined: false
config channel: []
== tiers: null
rows: []
problems: ["audit.required_files.0.tiers"]
config channel: []
== tiers: { words: [nosuch] }
rows: [{"file":"A.md","tiers":{"words":["nosuch"]}}]
problems: []
holds for research: false
holds for software: false
holds for undefined: false
config channel: []
== tiers named twice in one row
rows: []
problems: []
config channel: [" | does not parse: Map keys must be unique at line 3, column 51:"]
```

### The verify lines of this round

`npm run diagrams`, then, with `TMPDIR` unset, `npm run test:quick -- <the nine paths> tests/data/sources/config/layers/layers-fixture.ts`, one full-list run this round:

```
test:quick: 10 changed file(s), from the given paths
test:quick: 35 test file(s)
        tests/checks/imports/augments.test.ts: scans the source text of a changed file
        tests/checks/imports/cycles.test.ts: scans the source text of a changed file
        tests/checks/imports/order.test.ts: scans the source text of a changed file
ok      prettier (1.1 s): All matched files use Prettier code style!
ok      ASCII gate (1.2 s)
ok      svelte-kit sync (2.7 s)
ok      eslint (13.1 s)
ok      svelte-check (44.8 s): 1794182444582 COMPLETED 591 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest (109.0 s): Duration  93.69s (transform 115.09s, setup 0ms, import 198.59s, tests 162.01s, environment 7ms)
ok      vitest slow (126.6 s): Duration  111.04s (transform 55.76s, setup 0ms, import 97.71s, tests 220.59s, environment 1ms)
ok      vitest checks (132.0 s): Duration  116.60s (transform 40.94s, setup 0ms, import 87.23s, tests 304.93s, environment 3ms)
test:quick: 134.7 s; every command passed
```

Verify 2, `npx vitest run tests/routes/docs/audit.test.ts tests/server/edit/config-value.test.ts --reporter=dot` with `TMPDIR` unset: `Test Files  2 passed (2)`, `Tests  62 passed (62)`, zero timeouts.

`LC_ALL=C grep -n '[^ -~]'` over the ten changed files printed nothing. The history-words grep over the added lines of the ten files printed nothing. `sh utils/unused-exports.sh` compared by `diff` with the base's `unused-exports.txt`: exit 0, no difference; `readerFindings` is a test fixture and no export was added. The diagram files are still the two named above (`git status --short docs/diagrams`: `writes.dot`, `writes.svg`). No test was added or removed this round; the edits to existing test code are `findingsNaming`'s body and the import in `tests/server/edit/config-value.test.ts`, and the signature of `readerFindings`, none of them an assertion, allow list or predicate.
