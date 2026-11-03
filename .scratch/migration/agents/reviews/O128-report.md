# O128 builder report: handed back before any code change

NOT done: items 1 to 6 of "What to build" are not built, and no file under `src`, `config` or `docs` is changed. The step is handed back after the first run of every case, as the brief's "Cases" paragraph and the dispatch prompt require, for two things the first run showed: four cases the brief classes as new-behaviour rows pass on the unchanged tree (C2, C3, C12, C18), and item 4's premise that a second hub's rows reach the checks the same way for every field does not hold under item 4's own route. The case rows are written in the two test files and stay there for the build.

## Open items of the state file

`.scratch/migration/orchestrator-state.md:165-167`, verbatim: "## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)" followed by "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own." The list holds no entry.

## What is handed back

### 1. C2, C3, C12 and C18 pass on the unchanged tree, though the brief does not name them guard rows

The rule (brief line 40): "A row that asserts a new behaviour is written first, run on the unchanged code and its failing line quoted ... A guard row asserts what holds today and must keep holding (C4, C9, C10, C11, C14)". C2, C3, C12 and C18 are not in that guard list, so each must fail first, and none does. Result of the first run (`npx vitest run tests/state/boards/board/board-rules.test.ts tests/data/sources/config/boards.test.ts --reporter=verbose`, glyphs written by name):

```
<check mark> |unit| tests/state/boards/board/board-rules.test.ts > the card sections > 'a pinned publication goes before ever<ellipsis>' 0ms
<check mark> |unit| tests/state/boards/board/board-rules.test.ts > the card sections > 'two pinned publications go by the row<ellipsis>' 0ms
<check mark> |unit| tests/state/boards/board/board-rules.test.ts > the card sections > 'a sort holding a word outside the thr<ellipsis>' 0ms
<check mark> |unit| tests/data/sources/config/boards.test.ts > categoriesFindings > words the added rows [{"key":"x","label":"x","color":"#16a34a","stages":{"words":["building"]},"sort":["year","year"]}] 1ms
<check mark> |unit| tests/data/sources/config/boards.test.ts > categoriesFindings > words the added rows [{"key":"x","label":"x","color":"#16a34a","stages":{"words":["building"]},"sort":"year"}] 1ms
```

Why, by reading `compare` (`src/lib/state/boards/board/items.ts:180-187`, pinned, then stage, then title):

- C2 (alpha pinned): today's order is alpha, then zeta (accepted), then the published cards by title, aardvark, beta, gamma; that is the expected alpha, zeta, aardvark, beta, gamma.
- C3 (alpha and gamma pinned): today's pinned group is alpha, gamma by title, the same as by `[stage, year, title]` (alpha 2016, gamma no year); the rest is zeta, aardvark, beta by today's order too. C3 therefore passes on a build that orders the pinned group by the board's order instead of the row's `sort`, which is the reading the brief check's implied input 4 names and C3 was added to exclude.
- C12 (`sort: [stage, nonsense]` reads as no sort) and C18 (`[year, year]` and `year` give no finding) assert what any value of `sort` gives today, since nothing reads the key.

Options:

- (a) Change the data of C2 and C3 so each fails first and tells the two pinned-group readings apart, and name C12 and C18 guard rows (first run passing, quoted before and after). C2 pins `gamma` instead of `alpha`: expected gamma, zeta, aardvark, beta, alpha (today gamma, zeta, aardvark, alpha, beta). C3 pins `alpha` and `beta`: expected beta, alpha, zeta, aardvark, gamma (today alpha, beta, zeta, aardvark, gamma). Pros: every new-behaviour row fails first; C3 then fails a build that orders the pinned group by the board's order. Cons: two rows' data differ from the brief's text.
- (b) Name C2, C3, C12 and C18 guard rows and keep their data. Pros: no change of data. Cons: C3 keeps passing a build that orders the pinned group wrongly; C2 and C3 assert nothing today's code does not already do. This is the lazy option.

Recommendation: (a), since it is the one under which C2 and C3 test what they are named for.

### 2. A second hub's rows reach the whole-file shape check and not `categoriesFindings`, so item 4's route leaves a second hub's wrong `sort` with no finding

Item 4 says: "whatever it shows, that reach is the same for every field of a second hub's rows and is not changed in this step." The run shows what the reach is, and under item 4's `owned` route it would not be the same for `sort` as for `stages`.

The path, by reading: the portfolio watcher reads each hub other than the primary with `readOtherHub` (`src/lib/server/root/watch/portfolio/portfolio.ts:607-611`), whose `findings` are that hub's own `loadConfig` findings (`src/lib/data/index.ts:628-649`), the whole-file shape issues among them; the config payload publishes them beside the primary's and runs `readerFindings`, `categoriesFindings` among them, on the primary's config alone:

```
        findings: [
            ...findings,
            ...others.flatMap((one) => one.findings),
            ...readerFindings({ engine: paths.engine, hub: primaryDir, from }, config),
```

(`src/lib/server/root/watch/portfolio/payload.ts:88-91`.) The case-run program below, on the unchanged tree, prints for a second hub:

```
  second hub, sort: [stage, nonsense], readOtherHub findings: ["categories.7.sort: key categories.7.sort is not a key this file takes"]
  second hub, sort: 3, readOtherHub findings: ["categories.7.sort: key categories.7.sort is not a key this file takes"]
  second hub, stages: 3, readOtherHub findings: ["categories.7.stages: categories.7.stages must be a map"]
  second hub, stages: { words: [nonsense] }, readOtherHub findings: []
```

So today a second hub's rows reach the shape check (a value of the wrong kind is a finding: `stages: 3`) and no reader check (a word outside the vocabulary is none: `stages: { words: [nonsense] }`). Item 4 has the vocabulary file's `owned` claim every `categories.<n>.sort` path, so the shape gives nothing for `sort` on any hub, and `categoriesFindings` never runs on a second hub: a second hub's `sort: 3`, `sort: null` and `sort: [stage, nonsense]` would give no finding anywhere and be read as no `sort`, while its `stages: 3` keeps its finding. That is a wrong value made silent by the step. Building item 4 as written leaves that defect; fixing it needs a path outside the write list, or a change to item 4.

Options:

- (A) Build item 4 as written and also run `categoriesFindings` over each other hub's merged config, in `readOtherHub` (`src/lib/data/index.ts:628-650`, outside the paths), its findings naming that hub's settings file. Pros: one finding per wrong `sort` on every hub, worded with the three words; it also gives a second hub's wrong `stages` and `forms` words the finding they lack today. Cons: widens the paths by `src/lib/data/index.ts` and the guarded entry that covers `readOtherHub`; changes the reach of every field of a second hub's rows, which item 4 says this step does not change; a second hub's findings would then also hold oculus's own rows' findings once per hub (they give none today, by the shipped-rows case).
- (B) Leave a wrong `sort` to the whole-file shape alone, as the Focus clusters' `sort` is (`src/lib/data/shapes/catalog-files/vocab.ts:122-127`): no `owned` predicate and no `sort` check in `categoriesFindings`. Pros: one finding per wrong value on every hub with the reach of every other field unchanged; no new predicate. Cons: against item 4 and G124's Test line, so C15 to C17 move from `categoriesFindings` to the shape; the shape's wording for a refused union is `findings.config.shape_other` ("{0} is not a value this key takes", `config/text/findings.yml:178`), which does not name the three words (the issue code zod gives for the union is not run).
- (C) Build item 4 as written and accept that a second hub's wrong `sort` gives no finding. Pros: no change of paths. Cons: a wrong value of a second hub is read as none with nothing said; this is the lazy option.

Recommendation: (A), since it ends the cause for `sort` and for the categories' word blocks of a second hub alike, and keeps the one finding item 4 words; the pre-existing gap for `stages` and `forms` words is the same defect as the one the step would create for `sort`. What would settle it against (A) is a ruling that a second hub's reader findings are a different concern from this step.

## The cases' first run

All on the unchanged code, with only the case rows written. Command: `npx vitest run tests/state/boards/board/board-rules.test.ts tests/data/sources/config/boards.test.ts --reporter=verbose`; last lines: `Test Files  2 failed (2)` and `Tests  9 failed | 125 passed (134)`. Each failing row stops at `tests/state/boards/board/board-rules.test.ts:424:23` (`expect(drawn).toEqual(row.sections);`) or `tests/data/sources/config/boards.test.ts:258:51` (`expect(categoriesSaid(withRows(...rows))).toEqual(expected);`). This is the run after `npx prettier --write` on the two test files; the code under test is unchanged.

| Case | Row | First run | Failing line or passing run |
|---|---|---|---|
| C1 | 'publications go pinned first, then by stage, then newest year, then title' | fails | `- "beta",` / `+ "beta",` after `"alpha"`: received zeta, aardvark, alpha, beta, gamma |
| C2 | 'a pinned publication goes before every unpinned one' | passes | handed back, item 1 above |
| C3 | "two pinned publications go by the row's sort, before the unpinned ones" | passes | handed back, item 1 above |
| C4 | 'a row with no sort goes by stage, then title, whatever the year' | passes (guard) | `<check mark> ... the card sections > 'a row with no sort goes by stage, the<ellipsis>' 0ms` |
| C5 | 'other outputs go by newest year at one stage' | fails | `- "b-poster",` then `"a-thesis",` then `+ "b-poster",`: received a-thesis, b-poster |
| C6 | 'sort: [year] breaks a tie of years by stage' | fails | `- "w",` then `"y",` then `+ "w",`: received y, w, x |
| C7 | 'sort: [title] goes by title after the pinned card' | fails | `"p",` then `- "a",` then `"b",` then `+ "a",`: received p, b, a |
| C8 | 'sort: year, one word as a text, reads as the list of that word' | fails | as C6: received y, w, x |
| C9 | "sort: [] goes by the board's order" | passes (guard) | `<check mark> ... the card sections > 'sort: [] goes by the board\'s order' 0ms` |
| C10 | "a publications row naming no sort goes by the board's order" | passes (guard) | `<check mark> ... the card sections > 'a publications row naming no sort goe<ellipsis>' 0ms` |
| C11 | "leaves the board's items in the board's order, which a grid board draws" | passes (guard) | `<check mark> ... the card sections > leaves the board's items in the board's order, which a grid board draws 0ms` |
| C12 | "a sort holding a word outside the three reads as no sort, the board's order" | passes | handed back, item 1 above |
| C13 | 'a year of 0 is a year, after a newer one and before no year' | fails | `- "alpha",` then `"a0",` then `+ "alpha",`: received a0, alpha, gamma |
| C14 | 'reads the shipped categories with no finding' | passes (guard) | `<check mark> ... categoriesFindings > reads the shipped categories with no finding 1ms` |
| C15 | 'words the added rows' with `sort: ["stage","nonsense"]` | fails | `- "categories[7].sort: categories[7].sort must be one of stage, year, title; it is not read",` / `+ []` |
| C16 | 'words the added rows' with `sort: 3` | fails | `- "categories[7].sort: categories[7].sort must be a list of words; it is not read",` / `+ []` |
| C17 | 'words the added rows' with `sort: null` | fails | as C16 |
| C18 | 'words the added rows' with `sort: ["year","year"]` and with `sort: "year"` | passes | handed back, item 1 above |
| C19 | the case-run program below | run | output below: every value gives one unknown-key shape finding and no `categoriesFindings` finding, `year` included |
| C20 | reading of the documents | not run | nothing is written yet |

The expected results of C1 to C18 are right under items 1 and 4, worked by hand from oculus's stage order (`config/catalogs/vocab.yml:64-77`, `accepted` before `published`); only the classification of C2, C3, C12 and C18 is handed back.

### C19, the case-run program

Run as `node <scratchpad>/c19-case-run.ts <worktree>` with PATH holding `/Users/axelfaes/.nvm/versions/node/v24.21.0/bin`. It writes only two scratch hub folders under the system temp directory, checked to be inside it and removed in its `finally`. Its source:

```ts
// Case-run program of O128 C19. It only prints: for each `sort` value, the findings about the
// categories that oculus's file, a primary hub's merged rows and a second hub's rows give, and,
// beside them, what a second hub's wrong `stages` gives. Its scratch hub folders live under
// the system temp directory and are removed at the end.
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const TREE = process.argv[2];
const { engineDir, loadConfig, textCatalog } = await import(`${TREE}/src/lib/data/sources/config.ts`);
const { categoriesFindings } = await import(`${TREE}/src/lib/data/sources/config/sections/boards.ts`);
const { readOtherHub } = await import(`${TREE}/src/lib/data/index.ts`);

const VALUES = ['[stage, nonsense]', '3', 'null', 'year'];
const ROW = (sort: string): string =>
    `  - { key: x, label: x, color: "#16a34a", stages: { words: [building] }, sort: ${sort} }`;

const engine = engineDir();
const base = readFileSync(join(engine, 'config', 'catalogs', 'vocab.yml'), 'utf8');
const anchor = '  - { key: dead-ends,';
const at = base.indexOf('\n', base.indexOf(anchor));

/** The findings of a load and of the categories check over its config, those on `categories`. */
function said(loaded: { config: Record<string, unknown>; findings: { key: string; message: string }[] }): string[] {
    const shape = loaded.findings
        .filter((one) => one.key.startsWith('categories'))
        .map((one) => `shape: ${one.key}: ${one.message}`);
    const check = categoriesFindings(loaded.config, () => 'vocab.yml', textCatalog(loaded.config)).map(
        (one: { key: string; message: string }) => `categoriesFindings: ${one.key}: ${one.message}`
    );
    return [...shape, ...check];
}

const temp = mkdtempSync(join(tmpdir(), 'o128-c19-'));
if (!resolve(temp).startsWith(resolve(tmpdir()))) throw new Error('scratch outside the temp dir');
try {
    for (const value of VALUES) {
        console.log(`sort: ${value}`);
        const text = `${base.slice(0, at)}\n${ROW(value)}${base.slice(at)}`;
        const own = loadConfig(engine, { instead: { layer: 'engine', name: 'catalogs/vocab.yml', text } });
        console.log(`  oculus's file: ${JSON.stringify(said(own))}`);
        const hub = join(temp, `hub-${String(VALUES.indexOf(value))}`);
        mkdirSync(join(hub, '.oculus'), { recursive: true });
        writeFileSync(join(hub, '.oculus', 'config.yml'), `categories:\n${ROW(value)}\n`);
        console.log(`  primary hub: ${JSON.stringify(said(loadConfig(engine, { hub })))}`);
        second(hub, `sort: ${value}`);
    }
    for (const [name, block] of [
        ['stages: 3', 'stages: 3'],
        ['stages: { words: [nonsense] }', 'stages: { words: [nonsense] }']
    ]) {
        const hub = join(temp, `hub-${name.length}`);
        mkdirSync(join(hub, '.oculus'), { recursive: true });
        writeFileSync(
            join(hub, '.oculus', 'config.yml'),
            `categories:\n  - { key: x, label: x, color: "#16a34a", ${block} }\n`
        );
        second(hub, name);
    }
} finally {
    rmSync(temp, { recursive: true, force: true });
}

/**
 * A second hub's rows: the findings on `categories` that readOtherHub carries, which the config
 * payload publishes beside the primary's (server/root/watch/portfolio/payload.ts), and whether
 * categoriesFindings runs on them there (it runs on the primary's config alone).
 */
function second(hub: string, name: string): void {
    const loaded = loadConfig(engine, { hub, other: 'second' });
    const carried = readOtherHub({ key: 'second', dir: hub }, loaded)
        .findings.filter((one: { key: string }) => one.key.startsWith('categories'))
        .map((one: { key: string; message: string }) => `${one.key}: ${one.message}`);
    console.log(`  second hub, ${name}, readOtherHub findings: ${JSON.stringify(carried)}`);
}
```

Its output on the unchanged tree (exit 0; afterwards no `o128-` folder is left in the temp directory):

```
sort: [stage, nonsense]
  oculus's file: ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
  primary hub: ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
  second hub, sort: [stage, nonsense], readOtherHub findings: ["categories.7.sort: key categories.7.sort is not a key this file takes"]
sort: 3
  oculus's file: ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
  primary hub: ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
  second hub, sort: 3, readOtherHub findings: ["categories.7.sort: key categories.7.sort is not a key this file takes"]
sort: null
  oculus's file: ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
  primary hub: ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
  second hub, sort: null, readOtherHub findings: ["categories.7.sort: key categories.7.sort is not a key this file takes"]
sort: year
  oculus's file: ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
  primary hub: ["shape: categories.7.sort: key categories.7.sort is not a key this file takes"]
  second hub, sort: year, readOtherHub findings: ["categories.7.sort: key categories.7.sort is not a key this file takes"]
  second hub, stages: 3, readOtherHub findings: ["categories.7.stages: categories.7.stages must be a map"]
  second hub, stages: { words: [nonsense] }, readOtherHub findings: []
```

The program file is removed from the scratchpad before this report; the source above is the whole of it.

## DONE / NOT DONE

| Deliverable | State | Proof |
|---|---|---|
| The cases' first run, C1 to C18 | DONE | the vitest run above: `Tests  9 failed | 125 passed (134)` |
| The case-run program's first run, C19 | DONE | its output above |
| Items 1 to 6 | NOT DONE | handed back before any code change; `git status --short` prints only ` M tests/data/sources/config/boards.test.ts` and ` M tests/state/boards/board/board-rules.test.ts` |
| Verify 1, the run after the change | NOT DONE | no change made |
| Verify 2, the case-run program after the change | NOT DONE | no change made |
| Verify 3, `npm run diagrams` and `npm run test:quick` | NOT DONE | not run; the list ran 0 times and no whole-suite command ran |
| Verify 4, `sh utils/unused-exports.sh` | NOT DONE | not run, no export added |
| Verify 5, the grep of item 6 | NOT DONE | no change to carry |
| Verify 6, the prose read of new text | NOT DONE for code and docs; the test titles added are listed below |

## Terms

`docs/glossary.md` does not exist (`ls docs/glossary.md` prints "No such file or directory").

## Files

| File | Lines (`wc -l`) | In the write list |
|---|---|---|
| `tests/state/boards/board/board-rules.test.ts` | 822 | yes |
| `tests/data/sources/config/boards.test.ts` | 266 | yes |
| `.scratch/migration/agents/reviews/O128-report.md` | this report | yes |

`git diff --stat` on the two test files: 180 insertions, 4 deletions, after `npx prettier --write` on them. The rows added: in 'the card sections', the twelve rows of C1 to C10, C12 and C13 in its table and the `it` of C11, with the helpers `filed`, `papers`, `YEARS`, `publicationsSort` and the type `SectionRow`; in 'categoriesFindings', the five rows of C15 to C18 in the table 'words the added rows %j', with the row `SORTED`. Test titles added, read for history words ('before', 'used to', 'no longer', 'still', 'previously' and the rest of `spec.md:44`): none holds one.

## Edits to existing assertions

None. The lines of existing test code changed (`git diff -U0` on the two files): `it.each([` became `it.each<SectionRow>([` in 'the card sections'; `const preset = presetFor(row.board, CONFIG);` became `const preset = presetFor(row.board, row.config ?? CONFIG);`; the closing `]` of the last row of 'words the added rows %j' became `],` with the new rows after it; and the import line gained `Project`. No `expect` line changed.

## Judgment calls

- C11 is an `it` of its own in 'the card sections' rather than a row of its table, since it asserts `boardItems`' order and not the sections.
- The design for the build, not yet applied: the reader of `sort` built from the shape's own union in `vocab.ts` (the pattern `catalog-files.ts:7-9` names), the comparison of each word and the pinned-first order in `presets.ts`, `compare` in `items.ts` calling it with `[stage, title]`.

## Host- or user-visible changes

None yet.

## Wrong or impossible in the brief

- C2, C3, C12 and C18 cannot fail first, so the brief's rule for new-behaviour rows cannot be met for them, and C3 cannot tell the pinned-group readings apart (item 1 above, with the run).
- Item 4's premise "that reach is the same for every field of a second hub's rows and is not changed in this step" does not hold under item 4's route: the step would make a second hub's wrong `sort` give no finding while its wrong-kind `stages` keeps one (item 2 above, with the run and `payload.ts:88-91`).
