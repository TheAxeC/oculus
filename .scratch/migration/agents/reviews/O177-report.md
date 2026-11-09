Everything in the brief is done.

## Open items of the state file (verbatim, `awk '/^## Open items/{f=1;print;next} /^## /{if(f)exit} f' .scratch/migration/orchestrator-state.md`)

## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.

(The section holds no entry.)

## The cases' first run, on the unchanged trees

| Case | Result on the unchanged trees |
|---|---|
| C1 | `npx vitest run tests/data/shapes/catalog-files/vocab.test.ts tests/state/boards/board/board-rules.test.ts`: `Tests  125 passed (125)` |
| C2 | `OCULUS_TEST_HUB=<hub worktree> npx vitest run tests/checks/config/integrity.test.ts`: `Tests  14 passed (14)` |
| boards | `npx vitest run tests/data/sources/config/boards.test.ts`: `Tests  46 passed (46)` |
| C3 | `novel-math-primitives: stage exploring; chips [parked]; category in-flight; lane Backburner; on_map yes` and `ecg-af-fair: stage exploring; chips []; category in-flight; lane Run; on_map yes` |
| C4 | `synthetic-umbrella-parked (C4): stage umbrella; chips [parked]; category (no category); lane Backburner; on_map no`; the word is no stage yet, and the chip lane takes the project by the lane rule |
| C5 | `no Umbrella lane in focus_lanes on this tree`; `open-layout pairs 20; under 10 in at least one theme: 0`; `folded-only pairs 37; under 10 in at least one theme: 13`. The hue table reproduces the brief's premise: no hue has zero misses, and `blue: 3 misses: Build everforest 8.55; Build synthwave 9.44; Idea kanagawalotus 9.75` |
| C6 | `git status --short | wc -l` 0; `find projects/umbrella -type f | wc -l` 0; `find projects/active/novel-math-primitives -type f | wc -l` 8; `find projects/ideas/ecg-af-fair -type f | wc -l` 39 |
| C7 | `projects/active/novel-math-primitives/project.yml:3 stage: exploring`, `:10 chips: [parked]`, `present/main.md:12 'exploring; parked'`; `projects/ideas/ecg-af-fair/project.yml:2 stage: exploring`, `present/main.md:13 'exploring, concept note made'`. No README line holds either word |
| C8 | `docs/templates.md:564` and `:924-926`, `config/schemas/manifest-schema.yml:51` and `config/catalogs/vocab.yml:52` listed the stages or the deck order without the word |

The first run found no case the brief's own rules get wrong.

## DONE / NOT DONE

| Deliverable | State | Command and its output (last run, after the last change) |
|---|---|---|
| 1 `umbrella` in `stages:` | DONE | `config/catalogs/vocab.yml:66`; C3 prints `on_map yes`; C1 below reads the file with no finding |
| 2 `umbrella` in `categories:` | DONE | `vocab.yml:276`; C3 prints `category umbrella` |
| 3 `umbrella` in `deck_order:` | DONE | `vocab.yml:284`, before `idea`; the look at Present |
| 4 `umbrella` in `focus_clusters:` | DONE | `vocab.yml:180`, between `incubate` and `idea`; `tests/state/boards/board/board-rules.test.ts` case 5 expects the order |
| 5 `umbrella` in `focus_lanes:`, the hues, the comments | DONE | `vocab.yml:195`; C5 below; `open-layout pairs 21; under 10 in at least one theme: 0` |
| 6 pages and comments naming the word | DONE | C8 below |
| 7 tests brought up to the new lists, none added | DONE | the three test files pass; the table below lists each edit |
| 8 hub `scan:` row | DONE | `.oculus/config.yml`, `yaml.safe_load` below |
| 9 hub README, approach page, figure | DONE | diffs below; `python3 -c ... hubmap_svg() | cmp - hub-map.svg` printed `hub-map-identical` |
| 10 the two folders moved whole | DONE | C6 below |
| 11 the manifests | DONE | diffs below |
| 12 the decks | DONE | diffs below |
| 13 `related:` on sandpile-operator | DONE | diff below |
| C1 | DONE | `Tests  125 passed (125)` |
| C2 | DONE | `OCULUS_TEST_HUB=/Users/axelfaes/workspace/research-hub/.agents/worktrees/migration-O177 npx vitest run tests/checks/config/integrity.test.ts`: `Tests  14 passed (14)` |
| C3 | DONE | `novel-math-primitives: stage umbrella; chips []; category umbrella; lane Umbrella; on_map yes` and `ecg-af-fair: stage umbrella; chips []; category umbrella; lane Umbrella; on_map yes` |
| C4 | DONE | `synthetic-umbrella-parked (C4): stage umbrella; chips [parked]; category umbrella; lane Backburner; on_map yes` |
| C5 | DONE | see "The colours chosen" |
| C6 | DONE | see the quote below the table; `find projects/umbrella -type f | wc -l` prints `47` |
| C7 | DONE | `grep -rn -E "exploring|parked" projects/umbrella | wc -l` prints `0` |
| C8 | DONE | by reading: `docs/templates.md` deck order and stage list, `config/schemas/manifest-schema.yml:51`, `config/catalogs/vocab.yml:52`, the comment above `focus_lanes`, the comment above `focus_lane_tones`, `src/lib/themes/derive.ts`, `src/lib/state/boards/focus.ts:651` |
| Verify 1 | DONE | `npm run test:quick`: `test:quick: 116.4 s; every command passed` |
| Verify 2, boards | DONE | `npx vitest run tests/data/sources/config/boards.test.ts`: `Tests  46 passed (46)` |
| Verify 3, ASCII gate | DONE | the `perl` command of `agents/spec.md` printed no line of the tree |
| Verify 4, hub YAML | DONE | the `python3 -c "import yaml,sys;..."` of the brief printed nothing, `yaml-exit=0` |
| Verify 5, C6 | DONE | quoted below |

C6, `git status --short` in the hub worktree, grouped by `sed` and `uniq -c`:

```
   1  D "projects/ideas/ecg-af-fair/notes/presentations/FAIR2 UC.pptx"
   8  D projects/active/novel-math-primitives
  38  D projects/ideas/ecg-af-fair
   1  M .oculus/config.yml
   1  M docs/figures/gen_figures.py
   1  M docs/figures/hub-map.svg
   1  M docs/RESEARCH-APPROACH.md
   1  M projects/active/sandpile-operator/project.yml
   1  M README.md
   1 ?? projects/umbrella
```

The 47 deleted paths are the 8 and the 39 of the first run. Every moved file other than the two manifests and the two decks compares equal to its `git show HEAD:` copy (a `cmp` loop over `find`, which printed no `DIFF` line).

Runs: the verify list ran twice. The first run was red on one line, a 5000 ms timeout of `tests/data/shapes/catalog-files/vocab.test.ts > ... words a form of a category label outside the six plural forms`, a file the step changes; that file then passed alone (`Tests  27 passed (27)`), and the list ran once more, green. No whole-suite command ran. Beyond the list I ran the folders `tests/data/shapes`, `tests/data/sources/config`, `tests/state/boards` and `tests/checks/look` once each by name, since the brief says the list does not reach `boards.test.ts` for a change to `vocab.yml`: `tests/checks/look` printed `Tests  56 passed (56)`.

`quick.mjs` prints no `verify-exit=` line (`grep -n verify-exit tests/tiers/quick.mjs` prints nothing); its verdict line is the one quoted. A green list does not cover the tests that reach no changed file, the build, or the lint of unchanged files, as it prints.

### Files changed in the oculus worktree

The base copy `/Users/axelfaes/workspace/oculus/.agents/worktrees/O177-base` holds only `unused-exports.txt`, so this table is made from `git diff --stat`, last line `11 files changed, 96 insertions(+), 86 deletions(-)`.

| Path | Added and removed lines | On the write list |
|---|---|---|
| `config/catalogs/vocab.yml` | 14 | yes |
| `config/schemas/manifest-schema.yml` | 2 | yes |
| `docs/templates.md` | 8 | yes |
| `src/lib/state/boards/focus.ts` | 30 | no: item 6's "any other a grep of the words finds"; one parenthesis of the doc comment of `waiting` named the Idea lane alone as the lane outside the awaiting box, and the paragraph is rewrapped; 791 lines, `wc -l` |
| `src/lib/themes/derive.ts` | 17 | yes |
| `src/lib/themes/rice/everforest.css` | 20 | yes |
| `src/lib/themes/rice/kanagawa.css` | 20 | yes |
| `src/lib/themes/rice/singles.css` | 26 | yes |
| `tests/data/shapes/catalog-files/vocab.test.ts` | 18 | yes |
| `tests/data/sources/config/boards.test.ts` | 26 | yes |
| `tests/state/boards/board/board-rules.test.ts` | 1 | yes |

### Edits to existing assertions (`git diff -U0 tests`, one row per changed line)

| File | Before | After |
|---|---|---|
| `vocab.test.ts` | (none) | helper `clustersWith` writes `'  - { key: umbrella, glyph: focus.ideas_glyph, muted: true, layout: full_width, sort: title }',` before the idea row; its doc comment says five clusters |
| `vocab.test.ts` | `categories[2].label` (two occurrences in one line) | `categories[3].label` |
| `vocab.test.ts` | `categories[2].label.several` (two in one line) | `categories[3].label.several` |
| `vocab.test.ts` | `['now', 'parked', 'idea']` | `['now', 'parked', 'umbrella', 'idea']` |
| `vocab.test.ts` | the lane table ends `['build', 'incubate'], ['idea', 'idea']` | `['build', 'incubate'], ['umbrella', 'umbrella'], ['idea', 'idea']` |
| `vocab.test.ts` | `focus_clusters.3.layout` (two in one line) | `focus_clusters.4.layout` |
| `vocab.test.ts` | `focus_clusters[3]` (the duplicate-row findings, two lines) | `focus_clusters[4]` |
| `vocab.test.ts` | `LEFT_OUT` ends `['build', 'incubate'], ['idea', 'idea']` | `['build', 'incubate'], ['umbrella', 'umbrella'], ['idea', 'idea']` |
| `vocab.test.ts` | `categories[7]` (two in one line) | `categories[8]` |
| `board-rules.test.ts` | `['later', 'columns', true], ['idea', 'full_width', true]` | `['later', 'columns', true], ['umbrella', 'full_width', true], ['idea', 'full_width', true]` |
| `boards.test.ts` | `categories[7]` on 11 lines, and `categories.7.key` on one line (the rows at about 223-244, 275-283, 292-293, 302-305) | `categories[8]`, `categories.8.key` |

No threshold, tolerance or predicate changed: each edit moves an expected index or adds the new row at its place in the shipped list. No allow list changed. The step adds no test.

For each changed test, its failing line on the unchanged tree, by reading and not by a run, since putting the old vocabulary under the new tests is banned by `agents/spec.md` ("Code is never deliberately broken"): every changed expectation fails at its `toEqual` on the unchanged tree, since there the row or the index it names does not exist. These are `vocab.test.ts` at the assertions of the `categories[3]` rows, of case 6 (`clusters(...)` returns three keys), of the lane table, of `focus_clusters[4]`, and of `LEFT_OUT`; `board-rules.test.ts` case 5 at its `clusters(config)` expectation; `boards.test.ts` at each `categories[8]` row. In the old form each of these failed on the new `vocab.yml` when run; that direction was observed.

### Greps the rules ask for

- The new word across the tree, `grep -rln --exclude=local.yml -i umbrella src tests config docs README.md`: `src/lib/state/boards/focus.ts`, `src/lib/themes/derive.ts`, `tests/state/boards/board/board-rules.test.ts`, `tests/data/shapes/catalog-files/vocab.test.ts`, `config/schemas/manifest-schema.yml`, `config/catalogs/vocab.yml`, `docs/templates.md`.
- Stage and deck lists, `grep -rn --exclude=local.yml -E 'nascent, scoping|exploring, in-prep|in-flight, released'` over `src tests config docs README.md`: the remaining hit naming the two idea stages without the word is `docs/templates.md:464`, see the judgment calls.
- History words over the added lines, `git diff -U0 | grep -E '^\+' | grep -i -E '\b(before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package)\b'`: two hits. The comment above `focus_lanes` says the glyph is "drawn before the lane's label", and `singles.css` says "the ones before it in place". Neither compares with an earlier state of the code; both are existing text in a rewrapped paragraph.
- No helper, type or schema is added, so no reuse grep applies. No TypeScript export is added. `sh utils/unused-exports.sh` compared with the base's list by `diff`: no line differs.
- ASCII over every touched file: `LC_ALL=C grep -n '[^ -~]'` printed nothing, exit 1. The ASCII gate's `find` also says `find: bin: No such file or directory`: this tree has no `bin` folder.
- `node_modules` gets no new dependency.

### Comments and pages re-read after the change

| Place | State |
|---|---|
| `config/catalogs/vocab.yml` head of `stages:` | rewritten |
| `config/catalogs/vocab.yml` head of `focus_clusters:` | still true |
| `config/catalogs/vocab.yml` head of `focus_lanes:` | rewritten |
| `config/catalogs/vocab.yml` head of `focus_lane_tones:` | rewritten |
| `config/catalogs/vocab.yml` head of `categories:` and of `deck_order:` | still true |
| `src/lib/themes/derive.ts` doc comment of `LANE_SHARE` | rewritten |
| `src/lib/state/boards/focus.ts` doc comment of `waiting` | rewritten |
| `src/lib/state/boards/focus.ts:516-518`, doc comment of `unplaced` | still true: `umbrella` carries neither `live` nor `idea` |
| `src/lib/views/boards/focus/lanes/Lanes.svelte` head comment | still true |
| `src/lib/themes/rice/everforest.css`, `kanagawa.css`, `singles.css` head comments | rewritten |
| `docs/templates.md` deck order and stage list | rewritten |
| `docs/HELP.md:102`, `docs/data-map.md:377`, `docs/decks.md:126` and `:131` | still true, not written |

### Case-run programs (both lived in `.agents/scratch/`, printed only, and are gone)

`case-c3-c4.mts`, run as `node .agents/scratch/case-c3-c4.mts <hub worktree> projects/umbrella/novel-math-primitives projects/umbrella/ecg-af-fair`:

```ts
// Case-run program of O177, C3 and C4. Prints only. Run from the oculus worktree root:
// node .agents/scratch/case-c3-c4.mts <hub worktree> <project folder>...
// The state modules hold Svelte runes; plain Node has none, so `$state` is an identity here.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';

Object.assign(globalThis, { $state: <T,>(value: T): T => value });
const { engineDir, loadConfig } = await import('../../src/lib/data/sources/config.ts');
const { categoriesOf, categoryOf } = await import('../../src/lib/data/shapes/boards/categories.ts');
const { lanes, laneItems } = await import('../../src/lib/state/boards/focus.ts');
const { wordFlag } = await import('../../src/lib/data/shapes/vocab-keys.ts');
const { fixtureProject } = await import('../../tests/fixtures/entities-fixture.ts');

const hub = process.argv[2];
const { config } = loadConfig(engineDir());
const categories = categoriesOf(config);
const board = lanes(config);

function row(id: string, stage: string, chips: string[]): void {
    const project = fixtureProject({ id, title: id, folder: id, file: `${id}/project.yml`, tier: 'research', lead: ['axel-faes'], stage, chips });
    const items = laneItems([project], board, config);
    const lane = board.filter((one) => (items[one.key] ?? []).length > 0).map((one) => one.label).join(',') || '(no lane)';
    const category = categoryOf({ stage }, categories, config)?.key ?? '(no category)';
    const onMap = wordFlag(config, 'stages', stage, 'on_map') ? 'yes' : 'no';
    console.log(`${id}: stage ${stage}; chips [${chips.join(', ')}]; category ${category}; lane ${lane}; on_map ${onMap}`);
}

for (const path of process.argv.slice(3)) {
    const manifest = YAML.parse(readFileSync(join(hub, path, 'project.yml'), 'utf8'));
    row(manifest.id, manifest.stage, manifest.status?.chips ?? []);
}
row('synthetic-umbrella-parked (C4)', 'umbrella', ['parked']);
```

`case-c5.mts`, run as `node .agents/scratch/case-c5.mts`, with `--hues` for the table of the first run and `--try <hue>...` for the comparison of hues:

```ts
// Case-run program of O177, C5. Prints only. Run from the oculus worktree root:
// node .agents/scratch/case-c5.mts [--hues]
// Reads the theme sheets with the repository's parseBlocks, resolveTheme and deriveTokens, and
// measures -lane surfaces with culori's differenceCiede2000.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { differenceCiede2000 } from 'culori';
import { parseBlocks, resolveTheme } from '../../src/lib/themes/parse.ts';
import { deriveTokens } from '../../src/lib/themes/derive.ts';

const de = differenceCiede2000();
const LINE = 10;
const BAND = ['funding', 'jobs', 'teaching'];
const BAND_LABEL: Record<string, string> = { funding: 'Funding', jobs: 'Jobs', teaching: 'Teaching' };

function load(root: string) {
    const dir = join(root, 'src/lib/themes');
    const sheets = [
        readFileSync(join(dir, 'tokens.css'), 'utf8'),
        readFileSync(join(dir, 'themes.css'), 'utf8'),
        ...readdirSync(join(dir, 'rice')).filter((n) => n.endsWith('.css')).sort().map((n) => readFileSync(join(dir, 'rice', n), 'utf8')),
        readFileSync(join(dir, 'vscode.css'), 'utf8')
    ].join('\n');
    const blocks = parseBlocks(sheets);
    const rows = YAML.parse(readFileSync(join(root, 'config/defaults/appearance.yml'), 'utf8')).themes;
    const vocab = YAML.parse(readFileSync(join(root, 'config/catalogs/vocab.yml'), 'utf8'));
    const palette: Record<string, string> = vocab.palette;
    const tokens: Record<string, Record<string, string>> = {};
    const names: string[] = [];
    for (const row of rows) {
        const theme = resolveTheme(blocks, row.class ?? '');
        names.push(row.name);
        tokens[row.name] = { ...theme, ...deriveTokens(theme) };
    }
    const tone: Record<string, string> = {};
    const label: Record<string, string> = { ...BAND_LABEL };
    for (const lane of vocab.focus_lanes) {
        tone[lane.key] = palette[String(lane.color).toLowerCase()].slice(2);
        label[lane.key] = lane.label;
    }
    for (const key of BAND) tone[key] = vocab.focus_lane_tones[key];
    const columns = vocab.focus_clusters.filter((c: any) => c.layout === 'columns').map((c: any) => ({ key: c.key, lanes: vocab.focus_lanes.filter((l: any) => l.cluster === c.key).map((l: any) => l.key) }));
    const wide = vocab.focus_clusters.filter((c: any) => c.layout === 'full_width').flatMap((c: any) => vocab.focus_lanes.filter((l: any) => l.cluster === c.key).map((l: any) => l.key));
    const statuses = [...new Set(Object.values(vocab.statuses).map((s: any) => palette[String(s.color).toLowerCase()] ?? '').filter((t: string) => t.startsWith('c-')).map((t: string) => t.slice(2)))] as string[];
    const hues = [...new Set(Object.values(palette).filter((v) => v.startsWith('c-')).map((v) => v.slice(2)))].filter((h) => names.every((n) => tokens[n][`--c-${h}-lane`] !== undefined)).sort();
    return { names, tokens, tone, label, columns, wide, statuses, hues, order: [...BAND, ...vocab.focus_lanes.map((l: any) => l.key)] };
}

type Tree = ReturnType<typeof load>;

function distance(t: Tree, theme: string, x: string, y: string): number {
    return de(t.tokens[theme][`--c-${x}-lane`], t.tokens[theme][`--c-${y}-lane`]);
}
function panel(t: Tree, theme: string, x: string): number {
    return de(t.tokens[theme][`--c-${x}-lane`], t.tokens[theme]['--panel'] ?? t.tokens[theme]['--bg']);
}
function lowest(t: Tree, x: string, y: string): { d: number; theme: string } {
    let best = { d: Infinity, theme: '' };
    for (const theme of t.names) {
        const d = distance(t, theme, x, y);
        if (d < best.d) best = { d, theme };
    }
    return best;
}
function under(t: Tree, x: string, y: string): string[] {
    return t.names.map((theme) => ({ theme, d: distance(t, theme, x, y) })).filter((c) => !(c.d >= LINE)).sort((a, b) => a.d - b.d).map((c) => `${c.theme} ${c.d.toFixed(2)}`);
}

function subsets<T>(items: T[]): T[][] {
    const out: T[][] = [];
    for (let mask = 0; mask < 1 << items.length; mask += 1) out.push(items.filter((_, i) => mask & (1 << i)));
    return out;
}
const pairKey = (t: Tree, a: string, b: string) => (t.order.indexOf(a) < t.order.indexOf(b) ? `${a}|${b}` : `${b}|${a}`);
function touching(t: Tree, rows: string[][]): Set<string> {
    const out = new Set<string>();
    for (const row of rows) for (let i = 0; i + 1 < row.length; i += 1) out.add(pairKey(t, row[i], row[i + 1]));
    for (let r = 0; r + 1 < rows.length; r += 1) {
        const up = rows[r];
        const down = rows[r + 1];
        for (let i = 0; i < up.length; i += 1) for (let j = 0; j < down.length; j += 1) {
            if (i * down.length < (j + 1) * up.length && j * up.length < (i + 1) * down.length) out.add(pairKey(t, up[i], down[j]));
        }
    }
    return out;
}
function classify(t: Tree) {
    const foldable = [...t.columns.map((c) => c.key), ...t.wide.map((w) => `wide:${w}`)];
    const open = touching(t, [BAND, ...t.columns.map((c) => c.lanes), ...t.wide.map((w) => [w])]);
    const every = new Set<string>();
    for (const band of subsets(BAND)) for (const folded of subsets(foldable)) {
        const rows: string[][] = [];
        if (band.length > 0) rows.push(band);
        for (const c of t.columns) if (!folded.includes(c.key)) rows.push(c.lanes);
        for (const w of t.wide) if (!folded.includes(`wide:${w}`)) rows.push([w]);
        for (const p of touching(t, rows)) every.add(p);
    }
    return { open: [...open], folded: [...every].filter((p) => !open.has(p)) };
}

const tree = load(process.cwd());
console.log(`themes: ${tree.names.length}; statuses: ${tree.statuses.join(' ')}`);
const neighbours = ['scope', 'derisk', 'build', 'idea'];

if (process.argv.includes('--hues')) {
    for (const hue of tree.hues) {
        const misses: string[] = [];
        for (const n of neighbours) for (const m of under(tree, hue, tree.tone[n])) misses.push(`${tree.label[n]} ${m}`);
        for (const theme of tree.names) {
            const p = panel(tree, theme, hue);
            if (!(p >= LINE)) misses.push(`panel ${theme} ${p.toFixed(2)}`);
        }
        console.log(`${hue}: ${misses.length} misses${misses.length ? ': ' + misses.join('; ') : ''}`);
    }
}

if (tree.tone.umbrella === undefined) {
    console.log('no Umbrella lane in focus_lanes on this tree');
} else {
    const u = tree.tone.umbrella;
    console.log(`Umbrella tone: ${u}`);
    for (const n of neighbours) {
        const low = lowest(tree, u, tree.tone[n]);
        console.log(`Umbrella against ${tree.label[n]}: lowest ${low.d.toFixed(2)} in ${low.theme}`);
    }
    let least = { d: Infinity, theme: '' };
    for (const theme of tree.names) {
        const d = panel(tree, theme, u);
        if (d < least.d) least = { d, theme };
    }
    console.log(`Umbrella surface against the panel: lowest ${least.d.toFixed(2)} in ${least.theme}`);
}

if (tree.tone.umbrella !== undefined) {
    const u = tree.tone.umbrella;
    for (const k of ['review', 'blocked', 'backburner', 'run', 'push', 'revise', 'funding', 'jobs', 'teaching']) {
        const low = lowest(tree, u, tree.tone[k]);
        const hits = under(tree, u, tree.tone[k]);
        console.log(`folded: Umbrella against ${tree.label[k]}: lowest ${low.d.toFixed(2)} in ${low.theme}; under 10 in ${hits.length}`);
    }
    for (const theme of ['synthwave', 'everforest', 'kanagawalotus']) {
        const t = tree.tokens[theme];
        let hue = { d: Infinity, s: '' };
        let txt = { d: Infinity, s: '' };
        for (const s of tree.statuses) {
            if (s === u) continue;
            const a = de(t[`--c-${u}`], t[`--c-${s}`]);
            const b = de(t[`--c-${u}-txt`], t[`--c-${s}-txt`]);
            if (a < hue.d) hue = { d: a, s };
            if (b < txt.d) txt = { d: b, s };
        }
        console.log(`status: ${theme} --c-${u} ${t[`--c-${u}`]}: nearest status on the hue ${hue.s} ${hue.d.toFixed(2)}; on -txt ${txt.s} ${txt.d.toFixed(2)}`);
    }
}

const { open, folded } = classify(tree);
const name = (p: string) => p.split('|').map((k) => tree.label[k]).join(' and ');
let openUnder = 0;
for (const p of open) {
    const [a, b] = p.split('|');
    const hits = under(tree, tree.tone[a], tree.tone[b]);
    if (hits.length > 0) {
        openUnder += 1;
        console.log(`OPEN under 10: ${name(p)} in ${hits.length}: ${hits.join(', ')}`);
    }
}
console.log(`open-layout pairs ${open.length}; under 10 in at least one theme: ${openUnder}`);
let foldedUnder = 0;
for (const p of folded) {
    const [a, b] = p.split('|');
    const hits = under(tree, tree.tone[a], tree.tone[b]);
    if (hits.length > 0) {
        foldedUnder += 1;
        console.log(`folded-only under 10: ${name(p)} in ${hits.length}: ${hits.length > 8 ? hits.slice(0, 8).join(', ') + ', ...' : hits.join(', ')}`);
    }
}
console.log(`folded-only pairs ${folded.length}; under 10 in at least one theme: ${foldedUnder}`);

// --pick: for each theme where the Umbrella tone misses a neighbour or the panel, the nearest
// colour to the theme's own value that holds every measure at 10.5 or more.
if (process.argv.includes('--pick')) {
    const culori = await import('culori');
    const toOklch = culori.converter('oklch');
    const u = tree.tone.umbrella;
    const token = `--c-${u}`;
    const dir = join(process.cwd(), 'src/lib/themes');
    const sheets = [readFileSync(join(dir, 'tokens.css'), 'utf8'), readFileSync(join(dir, 'themes.css'), 'utf8'), ...readdirSync(join(dir, 'rice')).filter((n) => n.endsWith('.css')).sort().map((n) => readFileSync(join(dir, 'rice', n), 'utf8')), readFileSync(join(dir, 'vscode.css'), 'utf8')].join('\n');
    const blocks = parseBlocks(sheets);
    const rows = YAML.parse(readFileSync(join(process.cwd(), 'config/defaults/appearance.yml'), 'utf8')).themes;
    for (const row of rows) {
        const theme = row.name;
        const misses = neighbours.filter((n) => !(distance(tree, theme, u, tree.tone[n]) >= LINE));
        const missesPanel = !(panel(tree, theme, u) >= LINE);
        if (misses.length === 0 && !missesPanel) continue;
        const authored = resolveTheme(blocks, row.class ?? '');
        const base = authored[token];
        const own = (row.class ?? '').split(/\s+/).filter((w: string) => w !== '' && w !== 'rice').flatMap((w: string) => Object.values(blocks[w] ?? {}));
        const pool = new Set<string>(own.filter((v: string) => /^#[0-9a-f]{6}$/i.test(v)).map((v: string) => v.toLowerCase()));
        const lch = toOklch(base)!;
        for (let l = 15; l <= 97; l += 1) for (const c of [0.6, 0.8, 1, 1.2, 1.4]) for (const h of [-20, -10, 0, 10, 20]) {
            const colour = { mode: 'oklch' as const, l: l / 100, c: lch.c * c, h: (lch.h ?? 0) + h };
            if (culori.displayable(colour)) pool.add(culori.formatHex(colour));
        }
        const others = ['scope', 'derisk', 'build', 'idea'].map((n) => tree.tone[n]);
        let found: { hex: string; d: number; worst: number } | null = null;
        for (const hex of pool) {
            const next = { ...authored, [token]: hex };
            const derived = { ...next, ...deriveTokens(next) };
            const lane = derived[`${token}-lane`];
            const measures: number[] = [de(lane, derived['--panel'] ?? derived['--bg'])];
            for (const o of others) measures.push(de(lane, derived[`--c-${o}-lane`]));
            for (const s of tree.statuses) {
                if (s === u) continue;
                measures.push(de(derived[token], derived[`--c-${s}`]));
                measures.push(de(derived[`${token}-txt`], derived[`--c-${s}-txt`]));
            }
            const worst = Math.min(...measures);
            if (!(worst >= 10.5)) continue;
            const d = de(base, hex);
            if (found === null || d < found.d) found = { hex, d, worst };
        }
        console.log(`pick ${theme} ${token} ${base}: misses ${misses.map((n) => tree.label[n]).join(', ')}${missesPanel ? ' panel' : ''}; ${found ? `${found.hex}, ${found.d.toFixed(2)} from the theme's value, worst measure ${found.worst.toFixed(2)}` : 'NO CANDIDATE'}`);
    }
}

// --try <hue>...: what each hue gives the Umbrella lane: its open misses, the folded-only pairs
// under 10, and, for each theme it misses in, the nearest colour holding 10.5 on every open pair
// of every lane drawn in that hue, the panel, and every status token on the hue and on -txt.
const tryAt = process.argv.indexOf('--try');
if (tryAt > 0) {
    const culori = await import('culori');
    const toOklch = culori.converter('oklch');
    const dir = join(process.cwd(), 'src/lib/themes');
    const sheets = [readFileSync(join(dir, 'tokens.css'), 'utf8'), readFileSync(join(dir, 'themes.css'), 'utf8'), ...readdirSync(join(dir, 'rice')).filter((n) => n.endsWith('.css')).sort().map((n) => readFileSync(join(dir, 'rice', n), 'utf8')), readFileSync(join(dir, 'vscode.css'), 'utf8')].join('\n');
    const blocks = parseBlocks(sheets);
    const rows = YAML.parse(readFileSync(join(process.cwd(), 'config/defaults/appearance.yml'), 'utf8')).themes;
    for (const hue of process.argv.slice(tryAt + 1)) {
        const t: Tree = { ...tree, tone: { ...tree.tone, umbrella: hue } };
        const { open: op, folded: fo } = classify(t);
        const openPairs = op.map((p) => p.split('|')).filter(([a, b]) => t.tone[a] === hue || t.tone[b] === hue);
        const missing = new Set<string>();
        for (const [a, b] of openPairs) for (const m of under(t, t.tone[a], t.tone[b])) missing.add(m.split(' ')[0]);
        for (const theme of t.names) if (!(panel(t, theme, hue) >= LINE)) missing.add(theme);
        const foldedHits = fo.filter((p) => p.includes('umbrella')).map((p) => { const [a, b] = p.split('|'); return `${t.label[a]}-${t.label[b]} ${under(t, t.tone[a], t.tone[b]).length}`; }).filter((s) => !s.endsWith(' 0'));
        console.log(`try ${hue}: themes missing ${missing.size}: ${[...missing].join(', ')}; folded under 10: ${foldedHits.join(', ') || 'none'}`);
        const token = `--c-${hue}`;
        for (const row of rows) {
            if (!missing.has(row.name)) continue;
            const authored = resolveTheme(blocks, row.class ?? '');
            const base = authored[token];
            const own = (row.class ?? '').split(/\s+/).filter((w: string) => w !== '' && w !== 'rice').flatMap((w: string) => Object.values(blocks[w] ?? {}));
            const pool = new Set<string>(own.filter((v: string) => /^#[0-9a-f]{6}$/i.test(v)).map((v: string) => v.toLowerCase()));
            const lch = toOklch(base)!;
            for (let l = 15; l <= 97; l += 1) for (const c of [0.6, 0.8, 1, 1.2, 1.4]) for (const h of [-20, -10, 0, 10, 20]) {
                const colour = { mode: 'oklch' as const, l: l / 100, c: lch.c * c, h: (lch.h ?? 0) + h };
                if (culori.displayable(colour)) pool.add(culori.formatHex(colour));
            }
            let found: { hex: string; d: number; worst: number } | null = null;
            for (const hex of pool) {
                const next = { ...authored, [token]: hex };
                const derived = { ...next, ...deriveTokens(next) };
                const measures: number[] = [de(derived[`${token}-lane`], derived['--panel'] ?? derived['--bg'])];
                for (const [a, b] of openPairs) measures.push(de(derived[`--c-${t.tone[a]}-lane`], derived[`--c-${t.tone[b]}-lane`]));
                for (const s of t.statuses) {
                    if (s === hue) continue;
                    measures.push(de(derived[token], derived[`--c-${s}`]));
                    measures.push(de(derived[`${token}-txt`], derived[`--c-${s}-txt`]));
                }
                const worst = Math.min(...measures);
                if (!(worst >= 10.5)) continue;
                // Ruling 672's second bar: a folded-only pair of a lane already drawn in this hue
                // that is at 10 or more stays there, and one under 10 gets no worse.
                const broken = fo.some((p) => {
                    const [a, b] = p.split('|');
                    if (a === 'umbrella' || b === 'umbrella') return false;
                    if (t.tone[a] !== hue && t.tone[b] !== hue) return false;
                    const before = de(t.tokens[row.name][`--c-${t.tone[a]}-lane`], t.tokens[row.name][`--c-${t.tone[b]}-lane`]);
                    const after = de(derived[`--c-${t.tone[a]}-lane`], derived[`--c-${t.tone[b]}-lane`]);
                    return before >= LINE ? !(after >= LINE) : !(after >= before);
                });
                if (broken) continue;
                const d = de(base, hex);
                if (found === null || d < found.d) found = { hex, d, worst };
            }
            console.log(`  ${row.name} ${base}: ${found ? `${found.hex}, ${found.d.toFixed(2)} away, worst ${found.worst.toFixed(2)}` : 'NO CANDIDATE'}`);
        }
    }
}
```

`case-c5.mts` also carries the `--pick` mode above, which `--try` supersedes; the three hues in the sheets are the output of `--try blue`.

## Per hub file, every changed line, before and after

`.oculus/config.yml` (`git diff -U0`), added after `- { dir: projects/ideas }`:

```
+  # Projects that are the administrative parents of other projects.
+  - { dir: projects/umbrella }
```

`README.md`:

```
+projects/umbrella/<id>/     project.yml | README.md | present/present.yml
+| umbrella | `projects/umbrella/<id>/` | `project.yml` + `README.md` + `present/present.yml` |
```

and on the bullet about moves, this sentence is added before "A move is a folder move": "A project that is the administrative parent of other projects moves to `projects/umbrella/<id>/` at `stage: umbrella`."

`docs/RESEARCH-APPROACH.md` (`git diff -U0 --word-diff=porcelain`): `+umbrella,` after "nascent, scoping," in the sentence "The stage is one of", and `` +`umbrella/`, `` after `` `ideas/`, `` in the list of folders holding projects directly.

`docs/figures/gen_figures.py`, in `hubmap_svg` and the constant above it:

```
-MAP_W, MAP_H = 900, 596
+MAP_W, MAP_H = 900, 625
+        ("projects/umbrella/", "stage umbrella: the administrative parents of other projects"),
-    out.append(f'<rect x="30" y="258" ...
+    out.append(f'<rect x="30" y="287" ...
-    out.append(text(44, 280, "Folders and stages agree:", 12.5, LEFT, "700"))
+    out.append(text(44, 309, "Folders and stages agree:", 12.5, LEFT, "700"))
-    out.append(text(206, 280, "a project at stage published lies under projects/archive/published,", 12, INK))
+    out.append(text(206, 309, "a project at stage published lies under projects/archive/published,", 12, INK))
-    out.append(text(44, 299, "projects/archive/phd or projects/coauthor; the Audit view reports one that does not.",
+    out.append(text(44, 328, "projects/archive/phd or projects/coauthor; the Audit view reports one that does not.",
-    out.append(text(30, 340, "SOURCES OF TRUTH: each fact has exactly one owner, never duplicated", 11, MUTED, "700"))
+    out.append(text(30, 369, "SOURCES OF TRUTH: each fact has exactly one owner, never duplicated", 11, MUTED, "700"))
-        y = 354 + (i // cols) * 72
+        y = 383 + (i // cols) * 72
-    out.append(text(30, 580, "The registry files are in .oculus/data/. Anything written twice is a bug: CONTEXT.md orients, "
+    out.append(text(30, 609, "The registry files are in .oculus/data/. Anything written twice is a bug: CONTEXT.md orients, "
```

`docs/figures/hub-map.svg`: 87 lines before, 90 after (`git diff --stat`: 79 insertions, 76 deletions), written with the Write tool from the text `hubmap_svg()` printed, and `cmp` of that function's output against the file prints `hub-map-identical`. No other figure is written. Line by line, from a `difflib` read of `git show HEAD:` against the file:

- Lines 1 and 2: the `viewBox` and the `height` go from 596 to 625.
- A row is added at y 75: a `rect` height 24, the text `projects/umbrella/` at x 44, y 92, and the text `stage umbrella: the administrative parents of other projects` at x 250, y 92.
- The rows `projects/active/`, `projects/manuscripts/`, `projects/software/`, `projects/coauthor/`, `projects/archive/` and `side-projects/` go down one row, 29 units, with text and `rect` (`y` 75, 104, 133, 162, 191, 220 to 104, 133, 162, 191, 220, 249; text `y` 92, 121, 150, 179, 208, 237 to 121, 150, 179, 208, 237, 266).
- Every element from the "Folders and stages agree" box to the last line goes down 29 units and changes in nothing else: box `y` 258 to 287; texts 280 to 309, 299 to 328; heading 340 to 369; owner cards `rect` 354, 426, 498 to 383, 455, 527; their fact lines 374, 388, 446, 460, 518, 532 to 403, 417, 475, 489, 547, 561; their owner lines 406, 478, 550 to 435, 507, 579; the closing text 580 to 609.

`projects/umbrella/novel-math-primitives/project.yml`, against `git show HEAD:projects/active/novel-math-primitives/project.yml`:

```
3c3
< stage: exploring
---
> stage: umbrella
10c10
<   chips: [parked]
---
>   chips: []
```

`projects/umbrella/novel-math-primitives/present/main.md`:

```
12c12
<   - { label: 'Stage', value: 'exploring; parked' }
---
>   - { label: 'Stage', value: 'umbrella' }
```

`projects/umbrella/ecg-af-fair/project.yml`:

```
2c2
< stage: exploring
---
> stage: umbrella
```

`projects/umbrella/ecg-af-fair/present/main.md`:

```
13c13
<   - { label: 'Stage', value: 'exploring, concept note made' }
---
>   - { label: 'Stage', value: 'umbrella, concept note made' }
23c23
< headline: 'Idea: choose a direction, then reproduce the published CNN'
---
> headline: 'Choose a direction, then reproduce the published CNN'
```

`projects/active/sandpile-operator/project.yml`, line 9 added after `pillars: [hcc]`:

```
+related: [novel-math-primitives]
```

## The colours chosen, with the numbers of C5

The stage, the category and the lane are drawn in `#2563eb`, which the palette maps to `c-blue`. Three theme blocks get a `--c-blue` of their own:

| Theme block | Sheet | Before | After | Nearest status token on the hue | On `-txt` |
|---|---|---|---|---|---|
| `body.synthwave` | `rice/singles.css` | `#03edf9` | `#61e2f9` | sky 10.85 | sky 10.85 |
| `body.everforest` | `rice/everforest.css` | `#7fbbb3` | `#87e3e3` | sky 10.52 | sky 10.52 |
| `body.kanagawalotus` | `rice/kanagawa.css` | `#4d699b` | `#324088` | violet 11.40 | sky 11.21 |

Each hue is the nearest to the theme's own among the hexes of its block and the OKLCH grid the head comments name, with every measure at 10.5 or more, and with the second bar of Rulings "Open item 672" held for the Push lane, which shares the hue. `vscode.css` needs no hue, so the converter is untouched.

C5, last run, `node .agents/scratch/case-c5.mts`:

```
themes: 49; statuses: amber blue sky violet orange cyan green brass grey red slate pink teal
Umbrella tone: blue
Umbrella against Scope: lowest 23.05 in tokyolight
Umbrella against De-risk: lowest 14.04 in kanagawadragon
Umbrella against Build: lowest 10.42 in gruvboxlight
Umbrella against Idea: lowest 11.17 in kanagawadragon
Umbrella surface against the panel: lowest 13.88 in dracula
folded: Umbrella against Review: lowest 0.00 in dracula; under 10 in 3
folded: Umbrella against Blocked: lowest 20.88 in nord; under 10 in 0
folded: Umbrella against Backburner: lowest 0.00 in dracula; under 10 in 2
folded: Umbrella against Run: lowest 12.03 in rosepinedawn; under 10 in 0
folded: Umbrella against Push: lowest 0.00 in light; under 10 in 49
folded: Umbrella against Revise: lowest 14.04 in kanagawadragon; under 10 in 0
folded: Umbrella against Funding: lowest 14.04 in kanagawadragon; under 10 in 0
folded: Umbrella against Jobs: lowest 10.08 in macchiato; under 10 in 0
folded: Umbrella against Teaching: lowest 10.42 in gruvboxlight; under 10 in 0
status: synthwave --c-blue #61e2f9: nearest status on the hue sky 10.85; on -txt sky 10.85
status: everforest --c-blue #87e3e3: nearest status on the hue sky 10.52; on -txt sky 10.52
status: kanagawalotus --c-blue #324088: nearest status on the hue violet 11.40; on -txt sky 11.21
open-layout pairs 21; under 10 in at least one theme: 0
folded-only under 10: Review and Umbrella in 3: dracula 0.00, vscode-tomorrow-night-blue 5.95, vscode-solarized-dark 8.88
folded-only under 10: Backburner and Umbrella in 2: dracula 0.00, vscode-tomorrow-night-blue 7.30
folded-only under 10: Push and Umbrella in 49: light 0.00, dark 0.00, vscode-dark-modern 0.00, vscode-light-modern 0.00, vscode-light-2026 0.00, vscode-light-plus 0.00, vscode-light-visual-studio 0.00, vscode-quiet-light 0.00, ...
folded-only under 10: Review and Idea in 3: rosepinedawn 4.88, kanagawadragon 7.35, rosepinemoon 9.12
folded-only under 10: Blocked and Idea in 1: mocha 6.05
folded-only under 10: Backburner and Idea in 3: rosepinedawn 4.88, kanagawadragon 7.35, rosepinemoon 9.12
folded-only under 10: Funding and Revise in 41: tokyoneon 0.00, tokyonight 0.00, tokyostorm 0.00, rosepine 0.00, rosepinemoon 0.00, everforest 0.00, oxocarbon 0.00, flexoki 0.00, ...
folded-only under 10: Funding and De-risk in 32: macchiato 0.00, frappe 0.00, synthwave 0.00, tokyoneon 0.00, tokyonight 0.00, tokyostorm 0.00, rosepine 0.00, rosepinemoon 0.00, ...
folded-only under 10: Jobs and Review in 47: macchiato 0.00, frappe 0.00, synthwave 0.00, tokyoneon 0.00, tokyonight 0.00, tokyostorm 0.00, rosepine 0.00, rosepinemoon 0.00, ...
folded-only under 10: Jobs and Backburner in 45: macchiato 0.00, frappe 0.00, synthwave 0.00, tokyoneon 0.00, tokyonight 0.00, tokyostorm 0.00, rosepine 0.00, rosepinemoon 0.00, ...
folded-only under 10: Jobs and De-risk in 1: kanagawalotus 4.48
folded-only under 10: Jobs and Idea in 3: rosepinedawn 4.88, kanagawadragon 7.35, rosepinemoon 9.12
folded-only under 10: Teaching and Run in 4: rosepinedawn 6.93, kanagawadragon 7.65, everforest 8.74, kanagawalotus 8.85
folded-only under 10: Teaching and Build in 49: light 0.00, dark 0.00, vscode-dark-modern 0.00, vscode-light-modern 0.00, vscode-light-2026 0.00, vscode-light-plus 0.00, vscode-light-visual-studio 0.00, vscode-quiet-light 0.00, ...
folded-only pairs 49; under 10 in at least one theme: 14
```

The 14 pairs are the ones the comments now list, in `vocab.yml` above `focus_lanes` and in `derive.ts`. The comment above `focus_lane_tones` lists the band pairs among them. Three of the 14 are new with the lane: Push above the Umbrella lane in all 49, Review above it in dracula, vscode-tomorrow-night-blue and vscode-solarized-dark, and Backburner above it in dracula and vscode-tomorrow-night-blue. Two pairs the comments listed are at 10 or more with the new hues and have left the lists: Teaching and Push in everforest and synthwave, and Push above the Idea lane in kanagawalotus.

`--try` for the hues compared, the number of themes each misses, and what each gives when a cluster is folded:

| Hue | Themes that need a hue of their own | Folded-only pairs with the lane under 10 | Largest move from a theme's own colour |
|---|---|---|---|
| blue | 3: everforest, synthwave, kanagawalotus | Push 49, Review 3, Backburner 2 (Teaching 2 before the overrides) | 13.53 |
| lime | 5: solarized, gruvboxlight, kanagawalotus, rosepinedawn, everforest | Run 30, Teaching 3, Review 2, Backburner 2, Revise 2, Funding 2, Jobs 2 | 26.90 |
| orange | 8 | Revise 32, Funding 6, Blocked 5 | 10.51 |
| sky | 11 | Push 11 and others | 30.88 |
| cyan-d | 13 | Review 7 and others | 30.88 |
| indigo | 14 | Review 6 and others | 22.95 |
| violet, purple | 21 | | 22.95, 21.05 |
| magenta | 24 | | 19.74 |
| cyan | 25, nine of them VS Code themes, whose sheet is generated | | 30.88 |

## Before and after of each view a reader sees changed

All of these are the orchestrator's look, on a scratch server pointed at the hub worktree.

| View | State to put it in | Before | After |
|---|---|---|---|
| Focus board | every cluster open | No Umbrella section; ecg-af-fair on Run; novel-math-primitives on Backburner | A full-width section headed Umbrella in blue, with its count, the `focus.ideas_glyph` head glyph, the lane's `folder` icon and the sub "administrative parents of other projects", between Incubation and Idea, holding those two projects sorted by title; Run and Backburner each lose one |
| Focus board | the Awaiting box | counts Run and Backburner lanes | the two projects are on a lane of a cluster with no `awaiting`, so the box counts neither |
| Focus board | synthwave, everforest, kanagawalotus | Push and Umbrella | Push's header and every use of `--c-blue` are drawn in the new hue |
| Focus board | Parked and Incubation folded | | the Umbrella section stands under Push in the same blue |
| Projects board | with the hub worktree | no umbrella pill; rail count includes the two; in-flight section holds them | a pill and section "umbrellas" with count 2, before "ideas"; the rail count is lower by 2 and in-flight is lower by 2 |
| Pillars and Domains | a card whose only members are these two | | stays awake, since `umbrella` carries `on_map`; the in-flight count and tier strip of a card lose them, since the stage carries no `live` |
| Present | the deck order, and each project's Stage spec | decks in in-flight; `exploring; parked`, `exploring, concept note made`, headline "Idea: choose..." | decks in the Umbrella category before Idea; `umbrella`, `umbrella, concept note made`, headline "Choose..." |
| Project form | the Stage field | | `umbrella (parent of other projects)` offered after scoping, the help names it |
| Funding tab, audit | novel-math-primitives | a project at a `live` stage | no longer one, by the flag's rule at `vocab.yml:54`; not run, for the look |
| Help of RESEARCH-APPROACH | the hub map figure | seven rows | eight rows, with the row `projects/umbrella/` |

## Every judgment call, each a decision the orchestrator may reverse

1. The hue is `blue`, `#2563eb`, for the lane, the stage and the category. It needs the fewest themes changed (3) with the smallest moves; the cost is the same colour as Push when Parked and Incubation are both folded, written into the comments. Lime is the alternative among hues no lane uses, and it needs 5 themes, two of them moved by 25 or more into dark greens.
2. Rulings "Open item 672"'s second bar was applied to the Push lane's folded pairs in the three themes, since the blue moved there is also Push's. The brief states only the first bar.
3. The icon of the stage and of the lane is `folder`, a key of `glyphs.yml`; there is no glyph named for umbrella, and `glyphs.yml` is not on the write list.
4. The lane's `sub` is "administrative parents of other projects".
5. `scan:` carries the row directly after `projects/ideas`.
6. `docs/templates.md:464` is unchanged: it is the example row of a hub's own `idea` category, and adding the word would make the example wrong.
7. The figure's eighth row needs room, so the box, the owner cards and the closing text move down 29 units and `MAP_H` goes to 625. The row's note says "stage umbrella" where the other rows say "tier ...", since a tier does not name these projects.
8. The first letter of ecg-af-fair's headline is capitalised where "Idea: " came off.
9. The stage line in the comment above `stages:` says the word "is of no group", since it carries neither `idea`, `live` nor `terminal`.

## Anything in the brief that was wrong or impossible, with the evidence

- The base copy is no tree: `ls -la /Users/axelfaes/workspace/oculus/.agents/worktrees/O177-base` lists only `unused-exports.txt`. The file table and the test-edit table are from `git diff`, which `agents/spec.md` allows.
- `tests/data/sources/config/boards.test.ts` holds one more line that the new row moves, `categories.7.key`, beside the 12 lines naming `categories[7]`. `tests/data/shapes/catalog-files/vocab.test.ts` holds index lines outside the three ranges the brief names: `categories[2]` twice, the case 6 key list, `focus_clusters.3` and `[3]` in two tests, and `categories[7]` at one line. Each is on the write list and is brought up to the new lists.
- `agents/spec.md` asks for each changed test's failing line on the unchanged tree and bans running a test with the behaviour removed. The failing lines above are by reading.
- `tests/tiers/quick.mjs` prints no `verify-exit=`, see above.

Limitations I know of:

- Any hub with no project at `stage: umbrella` draws an empty Umbrella section, as it draws an empty Idea section, since a `full_width` cluster's lanes are drawn whatever they hold (`Lanes.svelte`, the `:else` of the `columns` branch). Not run; for the look.
- A hub that replaces `focus_clusters` or `focus_lanes` whole, or that holds its own `categories` rows, gets a finding or no Umbrella row by the existing rules; the hub of this step overrides none of them.
- The Umbrella lane takes moves: a card dropped on it writes `stage: umbrella`, as the brief's `move_writes` says.
- The three changed `--c-blue` values also redraw the status chips using `blue` in those three themes.
- The two projects' `status.line`, `next` and `latest` are left as they were, as the brief says.
