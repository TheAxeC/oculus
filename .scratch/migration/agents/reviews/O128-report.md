# O128 builder report: a category sets the order of its cards

Everything in the brief is done, as the cases ruling and repair round 1 amend it.

Repair round 1 (`agents/briefs/O128-round-1.md`) changed no code. It adds three things to this report:
- the editor's offer of `sort`, under "Host- or user-visible changes" (point 1);
- the reworded C18 (point 2);
- the two paths accepted into the step: `tests/checks/config/config-folder.test.ts` lines 723-728, and `docs/diagrams/writes.dot` with `writes.svg` (point 3).

The round's check, `npx vitest run tests/state/boards/board/board-rules.test.ts tests/checks/config/config-folder.test.ts`, ends `Test Files  2 passed (2)` and `Tests  126 passed | 2 skipped (128)`.

One premise of the first brief's Verify 3 does not hold: `npm run test:quick` does not select `tests/checks/imports/cycles.test.ts`. That check was run alone, and it passes.

## Open items of the state file

`.scratch/migration/orchestrator-state.md:165-167`, verbatim: "## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)" followed by "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own." The list holds no entry. The ruling books the question of whether `categoriesFindings` reaches a second hub as an open item outside this step; this step does not change that reach.

## The ruling carried

- Point 1, option (a):
  - C2 pins `gamma` and expects gamma, zeta, aardvark, beta, alpha.
  - C3 pins `alpha` and `beta` and expects beta, alpha, zeta, aardvark, gamma.
  - C12 is a guard row. C18 is a guard row no longer: repair round 1, point 2, takes that back, and C18 is a row of the case-run program (see the cases table).
- Point 2, option (B): a wrong `sort` is reported by the whole-file shape alone.
  - `categoryRow`'s `sort` in `src/lib/data/shapes/catalog-files/vocab.ts` is `categorySort`, `z.union([sortWord, z.array(sortWord)])`, where `sortWord` is `z.enum(['stage', 'year', 'title'])`.
  - `categoriesFindings`, `src/lib/data/sources/config/sections/boards.ts` and `src/lib/data/shapes/catalog-files.ts` are not changed, and no `owned` predicate is written.
  - `tests/data/sources/config/boards.test.ts` is not changed: `git status --short` does not list it.
  - C15 to C18 are shown by the case-run program.

## The cases' first run

The first run is on the unchanged code, with only the case rows written, using `npx vitest run tests/state/boards/board/board-rules.test.ts tests/data/sources/config/boards.test.ts --reporter=verbose`. Its last lines are `Test Files  1 failed | 1 passed (2)` and `Tests  8 failed | 121 passed (129)`. Each failing row stops at `tests/state/boards/board/board-rules.test.ts:424:23`, which is `expect(drawn).toEqual(row.sections);`. The diff lines are quoted as vitest printed them, `-` for expected and `+` for received.

The run after the change used the same command plus `tests/checks/imports/cycles.test.ts`, with `--reporter=verbose`. It ends `Test Files  3 passed (3)` and `Tests  136 passed (136)`. In the table, `<check mark>` stands for the vitest glyph and `<ellipsis>` for vitest's cut of a long title.

| Case | Row (title) | First run | After the change |
|---|---|---|---|
| C1 | 'publications go pinned first, then by stage, then newest year, then title' | fails: `-       "beta",` / `        "alpha",` / `+       "beta",` (received zeta, aardvark, alpha, beta, gamma) | `<check mark> ... 'publications go pinned first, then by<ellipsis>' 0ms` |
| C2 | 'a pinned publication goes before every unpinned one' (gamma pinned) | fails: `-       "beta",` / `        "alpha",` / `+       "beta",` (received gamma, zeta, aardvark, alpha, beta) | `<check mark> ... 'a pinned publication goes before ever<ellipsis>' 0ms` |
| C3 | "two pinned publications go by the row's sort, before the unpinned ones" (alpha and beta pinned) | fails: `-       "beta",` / `        "alpha",` / `+       "beta",` (received alpha, beta, zeta, aardvark, gamma) | `<check mark> ... 'two pinned publications go by the row<ellipsis>' 0ms` |
| C4 | 'a row with no sort goes by stage, then title, whatever the year' | guard, passes: `<check mark> ... 'a row with no sort goes by stage, the<ellipsis>' 0ms` | `<check mark> ... 'a row with no sort goes by stage, the<ellipsis>' 0ms` |
| C5 | 'other outputs go by newest year at one stage' | fails: `-       "b-poster",` / `        "a-thesis",` / `+       "b-poster",` | `<check mark> ... 'other outputs go by newest year at on<ellipsis>' 0ms` |
| C6 | 'sort: [year] breaks a tie of years by stage' | fails: `-       "w",` / `        "y",` / `+       "w",` | `<check mark> ... 'sort: [year] breaks a tie of years by<ellipsis>' 0ms` |
| C7 | 'sort: [title] goes by title after the pinned card' | fails: `        "p",` / `-       "a",` / `        "b",` / `+       "a",` | `<check mark> ... 'sort: [title] goes by title after the<ellipsis>' 0ms` |
| C8 | 'sort: year, one word as a text, reads as the list of that word' | fails, same lines as C6 | `<check mark> ... 'sort: year, one word as a text, reads<ellipsis>' 0ms` |
| C9 | "sort: [] goes by the board's order" | guard, passes: `<check mark> ... 'sort: [] goes by the board\'s order' 0ms` | same line |
| C10 | "a publications row naming no sort goes by the board's order" | guard, passes: `<check mark> ... 'a publications row naming no sort goe<ellipsis>' 0ms` | same line |
| C11 | "leaves the board's items in the board's order, which a grid board draws" | guard, passes: `<check mark> ... leaves the board's items in the board's order, which a grid board draws 0ms` | same line |
| C12 | "a sort holding a word outside the three reads as no sort, the board's order" | guard, passes: `<check mark> ... 'a sort holding a word outside the thr<ellipsis>' 0ms` | same line |
| C13 | 'a year of 0 is a year, after a newer one and before no year' | fails: `-       "alpha",` / `        "a0",` / `+       "alpha",` | `<check mark> ... 'a year of 0 is a year, after a newer <ellipsis>' 0ms` |
| C14 | 'reads the shipped categories with no finding' (boards.test.ts, unchanged) | guard, passes: `<check mark> ... categoriesFindings > reads the shipped categories with no finding 1ms` | same line |
| C15 to C17 | the case-run program, `sort` values `[stage, nonsense]`, `3` and `null` | output "before" below: each is one unknown-key finding, because the unchanged shape takes no `sort` key | output "after" below: one finding each, in every place |
| C18 | the case-run program, `sort` values `year` and `[year, year]` | output "before" below: each is one unknown-key finding ("key categories.7.sort is not a key this file takes") in all three places, since the unchanged shape takes no `sort` at all, the right ones included | output "after" below: none for `year` and none for `[year, year]`, in all three places |
| C19 | the case-run program over oculus's file, the primary hub and a second hub | before and after below | before and after below |
| C20 | the documents, by reading | n/a | read; listed under "Comments and documents" |

C18, as repair round 1 point 2 words it: under point 2 of the cases ruling, C18 is a row of the case-run program.
- Its first run, on the unchanged tree, gives an unknown-key finding for every `sort`, the right ones included, since the unchanged `categoryRow` is a strict object without `sort`.
- Its run after the change prints no finding for `year` and none for `[year, year]`.
- The "guard" of the cases ruling's point 1 no longer applies to it.

Both outputs are quoted below.

### The case-run program (C15 to C19)

It runs as `node <scratchpad>/c19-case-run.ts <worktree>`, with PATH holding `/Users/axelfaes/.nvm/versions/node/v24.21.0/bin`. It writes only scratch hub folders under the system temp directory, checked to be inside it and removed in its `finally`. The program file has been removed from the scratchpad; the source below is the whole of it.

```ts
// Case-run program of O128 C15 to C19. It only prints: for each `sort` value of an added
// category row, the findings on `categories` that oculus's file, the primary hub's merged rows and
// a second hub's rows (readOtherHub, which the config payload publishes) give, with the findings
// of categoriesFindings over the first two. Its scratch hub folders live under the system temp
// directory, are checked to be inside it and are removed at the end.
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

type Said = { key: string; message: string };
type Loaded = { config: Record<string, unknown>; findings: Said[] };

const TREE = process.argv[2];
const { engineDir, loadConfig, textCatalog } = await import(`${TREE}/src/lib/data/sources/config.ts`);
const { categoriesFindings } = await import(`${TREE}/src/lib/data/sources/config/sections/boards.ts`);
const { readOtherHub } = await import(`${TREE}/src/lib/data/index.ts`);

const VALUES = ['[stage, nonsense]', '3', 'null', 'year', '[year, year]'];
const ROW = (sort: string): string =>
    `  - { key: x, label: x, color: "#16a34a", stages: { words: [building] }, sort: ${sort} }`;

const engine = engineDir();
const base = readFileSync(join(engine, 'config', 'catalogs', 'vocab.yml'), 'utf8');
const at = base.indexOf('\n', base.indexOf('  - { key: dead-ends,'));

/** The findings on `categories` of a load, then those of categoriesFindings over its config. */
function said(loaded: Loaded, check: boolean): string[] {
    const shape = loaded.findings
        .filter((one) => one.key.startsWith('categories'))
        .map((one) => `shape: ${one.key}: ${one.message}`);
    const rows: Said[] = check
        ? categoriesFindings(loaded.config, () => 'vocab.yml', textCatalog(loaded.config))
        : [];
    return [...shape, ...rows.map((one) => `categoriesFindings: ${one.key}: ${one.message}`)];
}

const temp = mkdtempSync(join(tmpdir(), 'o128-c19-'));
if (!resolve(temp).startsWith(resolve(tmpdir()))) throw new Error('scratch outside the temp dir');
try {
    VALUES.forEach((value, index) => {
        console.log(`sort: ${value}`);
        const text = `${base.slice(0, at)}\n${ROW(value)}${base.slice(at)}`;
        const own: Loaded = loadConfig(engine, {
            instead: { layer: 'engine', name: 'catalogs/vocab.yml', text }
        });
        console.log(`  oculus's file: ${JSON.stringify(said(own, true))}`);
        const hub = join(temp, `hub-${String(index)}`);
        mkdirSync(join(hub, '.oculus'), { recursive: true });
        writeFileSync(join(hub, '.oculus', 'config.yml'), `categories:\n${ROW(value)}\n`);
        console.log(`  primary hub: ${JSON.stringify(said(loadConfig(engine, { hub }), true))}`);
        const second = readOtherHub({ key: 'second', dir: hub }, loadConfig(engine, { hub, other: 'second' }));
        console.log(`  second hub (readOtherHub): ${JSON.stringify(said(second, false))}`);
    });
} finally {
    rmSync(temp, { recursive: true, force: true });
}
```

Before the change (exit 0):

```
sort: [stage, nonsense]
  oculus's file: ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
  primary hub: ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
  second hub (readOtherHub): ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
sort: 3
  oculus's file: ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
  primary hub: ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
  second hub (readOtherHub): ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
sort: null
  oculus's file: ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
  primary hub: ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
  second hub (readOtherHub): ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
sort: year
  oculus's file: ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
  primary hub: ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
  second hub (readOtherHub): ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
sort: [year, year]
  oculus's file: ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
  primary hub: ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
  second hub (readOtherHub): ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
```

After the change (exit 0):

```
sort: [stage, nonsense]
  oculus's file: ["shape: categories.7.sort: categories.7.sort is not a value this key takes"]
  primary hub: ["shape: categories.7.sort: categories.7.sort is not a value this key takes"]
  second hub (readOtherHub): ["shape: categories.7.sort: categories.7.sort is not a value this key takes"]
sort: 3
  oculus's file: ["shape: categories.7.sort: categories.7.sort is not a value this key takes"]
  primary hub: ["shape: categories.7.sort: categories.7.sort is not a value this key takes"]
  second hub (readOtherHub): ["shape: categories.7.sort: categories.7.sort is not a value this key takes"]
sort: null
  oculus's file: ["shape: categories.7.sort: categories.7.sort is not a value this key takes"]
  primary hub: ["shape: categories.7.sort: categories.7.sort is not a value this key takes"]
  second hub (readOtherHub): ["shape: categories.7.sort: categories.7.sort is not a value this key takes"]
sort: year
  oculus's file: []
  primary hub: []
  second hub (readOtherHub): []
sort: [year, year]
  oculus's file: []
  primary hub: []
  second hub (readOtherHub): []
```

Each wrong value gives one finding in each of the three places, from the shape alone; `categoriesFindings` gives none. The shipped rows, which now carry `sort: [stage, year, title]`, give no finding: every run loads them, and the `year` runs print `[]`.

## DONE / NOT DONE

| Deliverable | State | Proof, last line of the final run |
|---|---|---|
| Item 1, the key and its reading (`categoriesOf`, `Category.sort`) | DONE | `npx vitest run tests/state/boards/board/board-rules.test.ts tests/data/sources/config/boards.test.ts tests/checks/imports/cycles.test.ts --reporter=verbose`: `Tests  136 passed (136)` (C1 to C13) |
| Item 2, the order inside a section, the comparison in `presets.ts` | DONE | same run, and `npx vitest run tests/checks/imports/cycles.test.ts --reporter=verbose`: `<check mark> ... holds no cycle 3768ms`, `Tests  7 passed (7)` |
| Item 3, oculus's rows | DONE | `git diff config/catalogs/vocab.yml`: `sort: [stage, year, title]` on `publications` and `other-outputs` only |
| Item 4 as ruled, one shape finding per wrong value | DONE | the case-run program's output after the change, above |
| Item 5, the shape and the Settings help | DONE | `categorySort` in `vocab.ts`; the `sort` field of `config/options/catalogs/vocab.yml`, `control: multi`, `options: [stage, year, title]`; config-folder check `<check mark> ... describes every flag of stages, forms, chips, statuses, lead_statuses and tiers and every key of a roles and categories row in the schema of vocab.yml 410ms` |
| Item 6, the documents and comments | DONE | read; see "Comments and documents" |
| Verify 1 | DONE | the first run (`Tests  8 failed | 121 passed (129)`) and the run after (`Tests  136 passed (136)`) |
| Verify 2 | DONE | the program's two outputs, above |
| Verify 3, `npm run diagrams` and `npm run test:quick` | DONE | `test:quick: 53.8 s; every command passed`; the checks it printed: `ok      prettier`, `ok      ASCII gate`, `ok      svelte-kit sync`, `ok      svelte-check (12.4 s): ... 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`, `ok      eslint`, `ok      vitest slow`, `ok      vitest`, `ok      vitest checks` |
| Verify 4, unused exports | DONE | no line added: `diff ../O128-base/unused-exports.txt <output>` prints nothing (exit 0) |
| Verify 5, the grep of item 6 | DONE | below |
| Verify 6, prose and history read | DONE | below |

### Runs of the list

`npm run test:quick` ran three times. No whole-suite command ran.

1. The first run (`test:quick: 0.9 s; failed: svelte-kit sync, prettier, eslint, vitest, vitest slow, vitest checks`) found no `node_modules` in the worktree, for example `spawn .../migration-O128/node_modules/.bin/prettier ENOENT`.
   - The worktree's `node_modules` was then made a `cp -cR` clone of main's. That is the gate's convention (`orchestrator-state.md:111`). The clone is ignored by `.gitignore:1`, and `git status --short --ignored node_modules` prints `!! node_modules/`.
2. The second run had one red line, `FAILED  vitest checks`, in `tests/checks/config/config-folder.test.ts:728`: `expected [ ... ] to have a length of 34 but got 35`. That check counts the described keys of the vocabulary rows, and the step adds one, `categories.sort`.
   - The count was changed, the file was rerun alone (`Tests  28 passed | 2 skipped (30)`), and then `npm run diagrams` and the list ran once more.
3. The third run printed `every command passed`.

Verify 3 asks for `tests/checks/imports/cycles.test.ts` among the checks the list runs. The list's file selection does not include it: the third run lists 21 test files, none under `tests/checks/imports`, and its own line `not covered: tests that reach no changed file within the import depth, other than the checks under tests/checks/source and tests/checks/tree` says why. It was run alone, after the last change to `src`, and passes (quoted above).

### Unused exports

`sh utils/unused-exports.sh` stops with "knip is not installed in .../migration-O128/node_modules; run npm install" while the worktree has no `node_modules`. The script's own command, `node_modules/.bin/knip --production --include exports,types --reporter compact --no-progress`, was therefore run from the worktree's root with main's knip binary (`/Users/axelfaes/workspace/oculus/node_modules/.bin/knip`), before the clone. It exits 1, which is knip's exit for findings, and `diff .agents/worktrees/O128-base/unused-exports.txt <output>` prints nothing.

The step adds four exports, and each has an importer outside its file:
- `categorySort` (vocab.ts), imported by categories.ts.
- `CardSort` (categories.ts), imported by presets.ts.
- `BOARD_SORT` and `compareCards` (presets.ts), imported by items.ts and facets.ts.

## Terms

`docs/glossary.md` does not exist (`ls docs/glossary.md` prints "No such file or directory").

## Files

From `git status --short` and `wc -l`. `git diff --stat` totals 14 files changed, 374 insertions(+), 111 deletions(-).

| File | Lines | In the write list |
|---|---|---|
| `src/lib/data/shapes/boards/categories.ts` | 158 | yes |
| `src/lib/data/shapes/catalog-files/vocab.ts` | 547 | yes. The edits are above `categoryRow` (the new `sortWord` and `categorySort`) and inside it, the range 309-328 moved by the lines added |
| `src/lib/state/boards/board/presets.ts` | 717 | yes |
| `src/lib/state/boards/board/items.ts` | 243 | yes |
| `src/lib/state/boards/board/facets.ts` | 362 | yes |
| `src/lib/views/boards/projects/Projects.svelte` | 487 | yes. The comment paragraph at 76-89 was rewrapped whole, so two lines past 85 changed, as `spec.md:45` requires |
| `config/catalogs/vocab.yml` | 307 | yes (lines 262 and 269-270) |
| `config/options/catalogs/vocab.yml` | 417 | yes (lines 321 and 337-340) |
| `docs/HELP.md` | 617 | yes (line 307) |
| `docs/templates.md` | 1907 | yes (lines 445-454) |
| `tests/state/boards/board/board-rules.test.ts` | 822 | yes |
| `tests/checks/config/config-folder.test.ts` | 850 | yes, lines 723-728, accepted into the step's paths by repair round 1 point 3. The step adds a described key, and this check's count of the described keys follows it |
| `docs/diagrams/writes.dot`, `docs/diagrams/writes.svg` | 1573, 5294 | yes, accepted into the step's paths by repair round 1 point 3. Generated by `npm run diagrams`: the writes diagram labels write sites in `vocab.ts` by line number (for example `vocab.ts:311` became `vocab.ts:320`), and those lines moved. `layers.dot` and `layer-views.dot`, which the brief named, did not change |
| `.scratch/migration/agents/reviews/O128-report.md` | this report | yes |

`.scratch/migration/agents/briefs/O128-cases.md` and `.scratch/migration/agents/briefs/O128-round-1.md` are untracked in the worktree. They are the orchestrator's files, not this step's.

## Edits to existing assertions

From `git diff -U0` of the two changed test files, one row per removed line:

| File | Before | After |
|---|---|---|
| `tests/checks/config/config-folder.test.ts:726` (comment) | `// flags (`unmarked`, `default`), the 3 keys of a roles row and the 5 keys of a categories` | `// flags (`unmarked`, `default`), the 3 keys of a roles row and the 6 keys of a categories` |
| `tests/checks/config/config-folder.test.ts:728` | `expect(keys).toHaveLength(34);` | `expect(keys).toHaveLength(35);` |
| `tests/state/boards/board/board-rules.test.ts` (import) | `import type { AuditFinding, Pillar } from ...` | `import type { AuditFinding, Pillar, Project } from ...` |
| same, 'the card sections' | `it.each([` | `it.each<SectionRow>([` |
| same, 'the card sections' | `const preset = presetFor(row.board, CONFIG);` | `const preset = presetFor(row.board, row.config ?? CONFIG);` |

The 34 to 35 change is the exact count of keys the schema now describes. The key `categories.sort` is new, and the next line of the check asserts that it has a description. No threshold was loosened.

## Comments and documents (item 6, C20, Verify 5 and 6)

Grep commands:
- `grep -rn "cardSections" src tests config docs README.md --exclude=local.yml`
- `grep -rn "sort" config docs README.md --exclude=local.yml` narrowed to categories, sections and cards
- `grep -rn "order given\|sort by the stage\|stage order, then\|pinned first" src/lib/state/boards src/lib/views/boards src/lib/data/shapes/boards docs/HELP.md docs/apps.md`

Hits, each judged:

- `items.ts:7-9` head comment: rewritten.
- `items.ts:183`, the doc of `compare`: rewritten. `compare` now calls `compareCards(left, right, BOARD_SORT, order)`.
- `facets.ts:11-15` head comment: rewritten.
- `facets.ts:338-344`, the doc of `cardSections`: rewritten.
- `facets.ts:343` "the cards in no row keep the order given": true.
- `presets.ts:12-15` head comment: rewritten.
- `presets.ts`, the docs of `BOARD_SORT`, `byWord` and `compareCards`: new.
- `categories.ts:7-8` head comment: rewritten.
- `categories.ts`, the doc of `Category.sort` and of `sortOf`: new.
- `vocab.ts`, the docs of `sortWord`, `categorySort` and the `sort` description: new.
- `Projects.svelte:82-85`: rewritten.
- `Projects.svelte:120,226`, `index.ts:51` and `board-rules.test.ts:50,420`: code, not made false.
- `config/catalogs/vocab.yml:262` comment: rewritten.
- `config/options/catalogs/vocab.yml:321` help and the new `sort` field: rewritten and new.
- `docs/HELP.md:307`: rewritten.
- `docs/HELP.md:296` ("drawing as board cards, in sections by `categories:`"): still true. The Awaiting tab's sections take the new order, which HELP.md:307 now says.
- `docs/templates.md:445-454`: rewritten. The example row names `sort: [title]`, and "replaces oculus's row of that key whole, its `sort` included".
- `docs/data-map.md:117`: still true.
- `config/catalogs/vocab.yml:171`, `docs/templates.md:469`, `docs/HELP.md:296` and `config/options/catalogs/vocab.yml:159`: the Focus clusters' `sort`, not made false.
- `focus.ts:739`, `ticker.ts:627,654`, `structure/lines.ts:263`, `collection/registration.ts:38` and `HELP.md:475`: other orders, not made false.
- `cross-links.ts:265-270` (the project strip groups "as a project board's sections are" and orders by id): still true. The step does not change it, as the brief says.
- `presets.ts`, the doc of `BoardPreset.categories` ("which the board's sections and its slices are drawn by"): still true.
- `awaitingPreset`'s doc ("Its sections are the rows of `categories:` of every hub's words"): still true.

History words: `git diff -U0 src tests config docs | grep '^+'`, grepped for the words `spec.md:44` lists, plus package ids and dates. It finds five lines, each with "before":
- the `sort` description in vocab.ts ("the ties of the words before it")
- the `compareCards` doc ("a pinned project ... before an unpinned one", "the words before it leave")
- three test titles ('goes before every unpinned one', 'before the unpinned ones', 'before no year')

Each "before" names an order of words or cards, not an earlier state of the code, so none is a history word.

Plain prose: each new or changed comment, doc sentence and test title was read against `spec.md:21`. None holds a quip, an em dash or a "not X but Y" construction.

Width: each edited comment paragraph ends no line short of 100 columns inside a sentence (`awk 'length > 100'` over the edited comment lines prints none of them). The `comment-width` check of the list passed. The example row at `docs/templates.md:453` is 115 columns, one YAML flow line like the other example lines of that file (line 443 is 103).

ASCII: the gate of `spec.md:103`, run over `src tests config`, prints nothing. The `find` reports `bin: No such file or directory`, since the tree has no `bin`. The added lines of `docs/HELP.md` and `docs/templates.md` hold no character outside ASCII (`grep -c '[^ -~]'` prints 0).

## Judgment calls

- The words of `sort` live once, in `vocab.ts` as `sortWord`, and the reader reads `sort` through the same `categorySort` shape (`readAs`). The reader and the shape therefore refuse the same values, which is the pattern `catalog-files.ts:7-9` states. `CardSort` is the string branch of that shape's type. The options catalog lists the three words again, as every catalog field with `options:` does.
- `compare` in `items.ts` stays, as a one-line call of `compareCards(left, right, BOARD_SORT, order)`. The brief names it and it keeps the board's order, so `boardItems` reads the same.
- A section's words are `[...row.sort, ...BOARD_SORT]`. With `sort: [stage, year, title]` the trailing `stage` and `title` are compared again; they can only break no further tie, which costs nothing.
- `sortOf` keeps the first place of a repeated word (`new Set`).
- The `sort` field's Settings help and its schema description say "title by its letters" for `localeCompare`.

## Host- or user-visible changes

- Projects board and Archive board, list mode and card mode, plus the Awaiting box's tab. Inside the "publications" and "other outputs" sections the cards now go pinned first, then stage (accepted before published), then newest year, then title, with no year last. Before, the order was pinned, stage, title.
  - Example: two published journal papers, 2016 "alpha" and 2025 "beta". Before, alpha came above beta; now beta comes above alpha.
  - The other sections, and a board with `cards: grid`, are unchanged.
  - The list mode's table keeps this order until a header is pressed.
- Settings, Vocabulary, `categories`: each row gains a `sort` field, a multi-pick of stage, year and title, with its help line. The entry's help gains one sentence.
- A `sort` of the wrong word or kind, in oculus's file, the primary hub's `.oculus/config.yml` or another hub's, is one finding on the config channel: "categories.<n>.sort is not a value this key takes". Before, any `sort` key was the finding "key categories.<n>.sort is not a key this file takes".
- **The editor's offer of `sort` (repair round 1, point 1).** The vocabulary file's schema serves the editor. In `config/catalogs/vocab.yml`, and in a hub's `.oculus/config.yml`, the editor now offers `sort` on a category row with the words `stage`, `year` and `title` and the key's description. At the base, it marked any `sort` as an unknown key.
  - Before, at the base, for `config/catalogs/vocab.yml` (`git show 8ae9afb82:src/lib/data/shapes/catalog-files/vocab.ts`, lines 308-328): `const categoryRow = z.strictObject({` with the keys `key`, `label`, `color`, `stages`, `forms`, `rail` and `archival` and no `sort`, so `sort` was a key the strict row refuses.
  - Before, at the base, for a hub's `.oculus/config.yml` (`git show 8ae9afb82:config/options/catalogs/vocab.yml`, lines 330-342): the `categories` entry's fields end `forms:`, `rail:`, `archival:`, with no `sort:`.
  - After: the printing-only program below builds the editor's schemas as `tests/checks/config/config-folder.test.ts` does, reading the demo hub of `tests/fixtures` only.
  - The two after-schemas differ in one respect. For a hub's file the editor's schema comes from the options catalog's `multi` field, `{"type":["array","string"],"items":{"enum":[...]}}`, which holds the three words only for a list.
    - By the JSON Schema rule that `items` applies to arrays alone, a one-word text there such as `sort: nonsense` would not be marked by the editor. Not verified: no editor or checker run was made for it.
    - The whole-file shape, `z.enum` over the three words, refuses such a text. That is by reading `categorySort`; the case-run program ran `3` and `[stage, nonsense]` on a hub's rows, not `nonsense` as a text.
    - This is how the options catalog turns every `multi` field into a schema, and this round changes no code.

Program `<scratchpad>/o128-editor-schema.ts`, run as `node <scratchpad>/o128-editor-schema.ts <worktree>`. It is printing only, and has been removed from the scratchpad after its run:

```ts
// Printing-only program of O128 repair round 1, point 1. It builds the schemas the editor is served
// for one hub, as tests/checks/config/config-folder.test.ts builds them (the demo hub of
// tests/fixtures, read only), and prints what the schema of config/catalogs/vocab.yml and the
// schema of a hub's .oculus/config.yml give for a category row: its `sort` and whether the row
// takes other keys.
import { join } from 'node:path';

const TREE = process.argv[2];
const { engineDir, loadConfig } = await import(`${TREE}/src/lib/data/sources/config.ts`);
const { portfolioConfigFrom } = await import(`${TREE}/src/lib/data/index.ts`);
const { buildOneHub } = await import(`${TREE}/tests/fixtures/hubs/hub-build.ts`);
const { createChecker } = await import(`${TREE}/src/lib/data/snapshot/schema/check.ts`);
const { schemaFor } = await import(`${TREE}/src/lib/data/snapshot/schema/set.ts`);
const { HUB_FILE } = await import(`${TREE}/src/lib/data/helpers/hub-names.ts`);

type Node = { properties?: Record<string, Node>; items?: Node; additionalProperties?: unknown };

const hub = join(engineDir(), 'tests', 'fixtures', 'hubs', 'demo');
const { config } = loadConfig(engineDir(), { hub });
const { schemas } = buildOneHub(
    hub,
    portfolioConfigFrom(config),
    1,
    [],
    createChecker(),
    { dir: join(engineDir(), 'config'), held: [{ root: 'config', path: '' }] },
    'hub'
);

for (const [root, rel] of [
    ['config', 'catalogs/vocab.yml'],
    ['hub', HUB_FILE]
]) {
    const name = schemaFor(schemas, root, rel);
    const schema = JSON.parse(name === undefined ? '{}' : schemas.texts[name]) as Node;
    const row = schema.properties?.categories?.items;
    console.log(`${root} ${rel}, schema ${String(name)}`);
    console.log(`  row keys: ${JSON.stringify(Object.keys(row?.properties ?? {}))}`);
    console.log(`  row additionalProperties: ${JSON.stringify(row?.additionalProperties)}`);
    console.log(`  sort: ${JSON.stringify(row?.properties?.sort ?? null)}`);
}
```

Its output after the change (exit 0):

```
config catalogs/vocab.yml, schema catalogs/vocab
  row keys: ["key","label","color","stages","forms","sort","rail","archival"]
  row additionalProperties: false
  sort: {"description":"The order of the category's cards after the pinned ones, its words read left to right, each breaking the ties of the words before it: stage by the stage order, year newest first with no year last, title by its letters; with none the cards go by stage, then title.","anyOf":[{"type":"string","enum":["stage","year","title"]},{"type":"array","items":{"type":"string","enum":["stage","year","title"]}}]}
hub .oculus/config.yml, schema hub-config
  row keys: ["key","label","color","stages","forms","sort","rail","archival","removed"]
  row additionalProperties: false
  sort: {"type":["array","string"],"items":{"enum":["stage","year","title"]},"description":"orders the category's cards after the pinned projects, its words read left to right: stage by the stage order, year newest first with no year last, title by its letters; a row with none goes by stage, then title"}
```

- The look on landing: open the Archive board on a hub whose publications include papers of different years at one stage, and compare the order inside "publications" with the order above. Then open the Settings row of `categories` and check the `sort` multi-pick shows the three words.

## Wrong or impossible in the brief

- Verify 3: `npm run test:quick` does not select `tests/checks/imports/cycles.test.ts` for this change. It reports its 21 files, and the file is not among them. The check was run alone and passes.
- Verify 4: `sh utils/unused-exports.sh` cannot run in a worktree without `node_modules` (its message is quoted above). The same knip command was run with main's binary.
- The worktree had no `node_modules`, so the list cannot run there as dispatched. The clone made here is one any reviewer rerunning the list needs too.
- The cases of the hand-back, as ruled in `agents/briefs/O128-cases.md`, are applied.
- C18's guard status: its values give a finding on the unchanged tree, because the unchanged shape takes no `sort` key at all. Its first run therefore cannot pass. The run is quoted above, before and after.
