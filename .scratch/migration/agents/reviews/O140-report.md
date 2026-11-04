Everything in the brief is done. One sentence outside the write list is not verified after the change: the count "ten of the pairs" in the `focus_lanes` comment (`config/catalogs/vocab.yml:181`), see "Anything in the brief that was wrong or impossible".

# O140 report: interview and offered drawn apart in every theme

## Open items of the state file (verbatim)

`.scratch/migration/orchestrator-state.md:164-168`, read with `sed -n 164,170p`:

```
## Open items (only what Axel must rule on; every report tells him these in plain words, decisions first, until he has ruled)

An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own.
```

The list holds no entry.

## The cases' first run, on the unchanged tree

Each was run before any file of the worktree changed (`git status --short` printed nothing and `diff -rq` of `src` and `config` against the base copy printed nothing).

- C1. `python3 -c "import yaml; v=yaml.safe_load(open('config/catalogs/vocab.yml')); ..."` printed `statuses.interview.color #7c3aed` and `position_stages Interview ['#7c3aed']`. The case-run program printed `C1 statuses.interview.color #7c3aed; position_stages Interview #7c3aed`. Result: both read `#7c3aed`, as the brief says.
- C2. The case-run program (source below) printed `C2 49 themes; 23 themes hold one; 89 measures under 10; 49 pairs under 10`, with `pink under 10 in 14 blocks: gruvbox nord tokyonight tokyostorm rosepine rosepinemoon everforest onedark oxocarbon kanagawa gruvboxlight rosepinedawn tokyolight everforestlight` and `teal under 10 in 17 blocks: macchiato frappe nord synthwave rosepine rosepinemoon everforest dracula onedark oxocarbon flexoki kanagawadragon solarized gruvboxlight rosepinedawn kanagawalotus flexokilight`. Result: the 31 blocks of the brief, and the brief's "49 pairs under 10" (a pair is one theme with two tokens; 89 counts the hue and the `-txt` measure apart). Every distance the brief quotes reproduces (gruvboxlight txt 4.8 from violet, nord 3.3 and txt 8.5, tokyonight 4.7, tokyolight 8.8, oxocarbon 9.3, kanagawa txt 8.2, macchiato 9.2, frappe 9.6, nord teal 6.9, oxocarbon teal 7.7, kanagawadragon 6.7 and txt 7.6, kanagawalotus txt 9.7, everforest 9.4, rosepinedawn txt 7.5, synthwave 5.3).
- C3. The program printed `themes whose pink or teal changed: 0` and `C3 1265 lane pairs read; 0 at 10 or more on the base and under 10 after`: no block was changed, so every pair reads the same before and after.
- C4. `diff <base copy>/src/lib/themes/rice/<f>.css src/lib/themes/rice/<f>.css` for the eight files printed `no difference` for each.
- C5. `npx vitest run tests/checks/look/contrast.test.ts --reporter=dot`: `Test Files  1 passed (1)`, `Tests  56 passed (56)`.

## DONE / NOT DONE

| Item | State | Proof (command, last line printed) |
| --- | --- | --- |
| 1. `interview` (:155) and the Interview row of `position_stages` (:205) take `#ec4899`, nothing else in `vocab.yml` changes | DONE | `diff <base>/config/catalogs/vocab.yml config/catalogs/vocab.yml` prints only `155c155` and `205c205`, each `#7c3aed` to `#ec4899` with the other keys and the alignment kept |
| 2. 14 pink and 17 teal blocks get a hue of their own; every pink and teal pair at 10 or more in all 49 themes, hue and `-txt` | DONE | case-run program: `C2 49 themes; 0 themes hold one; 0 measures under 10; 0 pairs under 10` |
| 2. Each `-lane` pair with teal-lane or pink-lane on one side at 10 or more on the base stays at 10 or more | DONE | case-run program: `C3 1265 lane pairs read; 0 at 10 or more on the base and under 10 after` |
| 2. No other token of any block changes | DONE | case-run program's "authored tokens that differ" section lists only `--c-pink` and `--c-teal` rows (31 rows over 23 themes, `themes whose pink or teal changed: 23`); C4 below |
| 2. Each new hue in the theme's own tone | DONE; in gruvboxlight the tone clause yields to the bars, as ruled in repair round 1 | per-block table below; judgment calls 4 and 5 |
| 3. Head comment of each changed file names where its added hues come from, rewrapped at 100 columns | DONE | `awk 'FNR<=12 && length($0)>100' src/lib/themes/rice/*.css` prints nothing; `tests/checks/source/comment-width.test.ts` ran in `npm run test:quick` (ok) |
| 4. The case-run program, in the scratch folder, `npx tsx`, writing nothing in the worktree | DONE | source and both runs below; `git status --short` after the runs lists only the nine changed files |
| Verify 1: the seven test files | DONE | `Test Files  7 passed (7)`, `Tests  210 passed | 2 skipped (212)` |
| Verify 2: `npm run diagrams`, then `npm run test:quick` once | DONE | `test:quick: 47.8 s; every command passed` |
| Verify 3: perl ASCII check of `vocab.yml` and `rice/*.css` | DONE | prints nothing, exit 0 |
| Verify 4: `yaml.safe_load` of `vocab.yml` | DONE | exit 0 |
| Verify 5: case-run program after the last change | DONE | `... 0 pairs under 10` |

The two skipped tests of verify 1 are the real-hub cases of `tests/checks/config/config-folder.test.ts` ("names a group of its own and a path under the hub for every document of the real hub" and "matches the real hub's own files to a schema each, read with no finding"), skipped with `OCULUS_TEST_HUB is not set` (`npx vitest run ... --reporter=verbose`).

`npm run test:quick` result lines:

```
test:quick: 9 changed file(s), from git since HEAD
test:quick: 10 test file(s)
ok      prettier (0.7 s): All matched files use Prettier code style!
ok      ASCII gate (0.8 s)
ok      svelte-kit sync (2.5 s)
ok      vitest (30.2 s): Duration  18.61s (transform 4.99s, setup 0ms, import 7.46s, tests 10.86s, environment 0ms)
ok      svelte-check (33.7 s): 1793743981491 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
ok      vitest checks (45.2 s): Duration  33.39s (transform 22.54s, setup 0ms, import 40.74s, tests 55.83s, environment 2ms)
test:quick: 47.8 s; every command passed
```

Runs of lists and suites: `npm run test:quick` once, `npm run diagrams` once right before it, no whole-suite command. Single-file vitest runs: the contrast test once for C5's first run, the seven-file list of verify 1 once, and one verbose run of three of those files to name the two skipped tests.

No test is added or changed.

`sh utils/unused-exports.sh` after the last change: `diff <base>/unused-exports.txt <its output>` prints nothing, so the step adds no line.

## The cases after the change

- C1. `python3 -c "import yaml; ..."` and the program: `C1 statuses.interview.color #ec4899; position_stages Interview #ec4899`. The program's status token list now reads `c-amber c-blue c-brass c-cyan c-green c-grey c-orange c-pink c-red c-sky c-slate c-teal c-violet`, `c-purple` replaced by `c-pink`, which is the set item 2 measures.
- C2. `C2 49 themes; 0 themes hold one; 0 measures under 10; 0 pairs under 10`.
- C3. `C3 1265 lane pairs read; 0 at 10 or more on the base and under 10 after`. The pairs read are every `--c-<tone>-lane` of the tones `vocab.yml`'s `palette:` names, against `pink-lane` and `teal-lane`, in the 23 changed blocks (judgment call 1).
- C4. `diff` of each of the eight files against the base copy, the hunks (`diff ... | grep -v '^[<>-]'`): catppuccin `1,2c1,3 84c85 143c144`; everforest `1,4c1,5 33c34 42c43 100c101`; flexoki `1,4c1,5 33c34 91c92`; gruvbox `1,3c1,4 39c40 83c84 92c93`; kanagawa `1,3c1,4 42c43 92c93 150c151`; rosepine `1,3c1,4 33c34 42c43 93c94 102c103 152c153 161c162`; singles `1,9c1,12 36c39 44c47 90c93 150c153 209c212 218c221 268c271 327c330 336c339`; tokyo `1,4c1,5 42c43 101c102 218c219`. Every changed line outside the head comment is a `--c-pink:` or `--c-teal:` line of a listed block: `diff ... | grep '^[<>]' | grep -v -- '--c-pink:\|--c-teal:'` leaves only head comment lines. The line numbers on the right are one higher (three in singles.css) than the brief's, because each rewrapped head comment is a line longer (three lines in singles.css).
- C5. `tests/checks/look/contrast.test.ts` in verify 1 passed (all seven files: `Test Files  7 passed (7)`).

## The case-run program

Kept at `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o140-builder/case-run.mts`, run from the worktree root with `npx tsx <that path>`. It reads the base copy and the worktree, and writes nothing. It uses the worktree's `parse.ts` and `derive.ts` for both trees (the step changes neither) and the worktree's `node_modules` for culori and yaml, since the base copy holds no `node_modules`.

```ts
// O140 case-run program. Reads the theme files and vocab.yml of the base copy and of the worktree,
// resolves the 49 themes of config/defaults/appearance.yml through parseBlocks, resolveTheme and
// deriveTokens, and prints with culori's differenceCiede2000: C1 (the two interview colours), C2
// (every pink and teal pair under 10 on the hue and on -txt, and the count), C3 (every -lane pair
// with pink-lane or teal-lane on one side, before and after, for each listed or changed block),
// and the authored tokens that differ between the two trees. Writes nothing.
// Run from the worktree root: npx tsx <this file>

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const WT = process.cwd();
const BASE = '/Users/axelfaes/workspace/oculus/.agents/worktrees/O140-base';

const { parseBlocks, resolveTheme } = await import(join(WT, 'src/lib/themes/parse.ts'));
const { deriveTokens } = await import(join(WT, 'src/lib/themes/derive.ts'));
const culori = await import(join(WT, 'node_modules/culori/src/index.js'));
const YAML = await import(join(WT, 'node_modules/yaml/dist/index.js'));

const de = culori.differenceCiede2000();
const toOklch = culori.converter('oklch');

const STATUS = ['red', 'amber', 'brass', 'orange', 'green', 'teal', 'cyan', 'sky', 'blue', 'violet', 'grey', 'slate', 'pink'];
const LISTED = {
    pink: ['gruvbox', 'gruvboxlight', 'everforest', 'everforestlight', 'nord', 'tokyonight', 'tokyostorm', 'tokyolight', 'oxocarbon', 'kanagawa', 'rosepine', 'rosepinemoon', 'rosepinedawn', 'onedark'],
    teal: ['rosepine', 'rosepinemoon', 'rosepinedawn', 'dracula', 'onedark', 'solarized', 'gruvboxlight', 'synthwave', 'flexoki', 'flexokilight', 'macchiato', 'frappe', 'nord', 'oxocarbon', 'kanagawadragon', 'kanagawalotus', 'everforest']
};

type Tree = { names: string[]; tokens: Record<string, Record<string, string>>; authored: Record<string, Record<string, string>>; vocab: any };

function load(root: string): Tree {
    const dir = join(root, 'src/lib/themes');
    const sheets = [
        readFileSync(join(dir, 'tokens.css'), 'utf8'),
        readFileSync(join(dir, 'themes.css'), 'utf8'),
        ...readdirSync(join(dir, 'rice')).filter((n) => n.endsWith('.css')).sort().map((n) => readFileSync(join(dir, 'rice', n), 'utf8')),
        readFileSync(join(dir, 'vscode.css'), 'utf8')
    ].join('\n');
    const blocks = parseBlocks(sheets);
    const rows = YAML.parse(readFileSync(join(root, 'config/defaults/appearance.yml'), 'utf8')).themes;
    const tree: Tree = { names: [], tokens: {}, authored: {}, vocab: YAML.parse(readFileSync(join(root, 'config/catalogs/vocab.yml'), 'utf8')) };
    for (const row of rows) {
        const classes: string = row.class ?? '';
        for (const word of classes.split(/\s+/).filter((w) => w !== '')) {
            if (!(word in blocks)) throw new Error(`${row.name}: class ${word} has no block`);
        }
        const theme = resolveTheme(blocks, classes);
        tree.names.push(row.name);
        tree.authored[row.name] = theme;
        tree.tokens[row.name] = { ...theme, ...deriveTokens(theme) };
    }
    return tree;
}

const d = (a?: string, b?: string): number => (a && b ? de(a, b) : NaN);
const f = (n: number): string => n.toFixed(1);

function pairs(tree: Tree): { theme: string; a: string; b: string; m: string; dist: number }[] {
    const out: { theme: string; a: string; b: string; m: string; dist: number }[] = [];
    for (const theme of tree.names) {
        const t = tree.tokens[theme];
        const seen = new Set<string>();
        for (const x of ['pink', 'teal']) {
            for (const y of STATUS) {
                if (y === x) continue;
                const key = [x, y].sort().join('|');
                if (seen.has(key)) continue;
                seen.add(key);
                for (const m of ['', '-txt']) {
                    const dist = d(t[`--c-${x}${m}`], t[`--c-${y}${m}`]);
                    if (!(dist >= 10)) out.push({ theme, a: x, b: y, m: m || 'hue', dist });
                }
            }
        }
    }
    return out;
}

function nearest(t: Record<string, string>, x: string, m: string): string {
    let best = Infinity;
    let who = '';
    for (const y of STATUS) {
        if (y === x) continue;
        const dist = d(t[`--c-${x}${m}`], t[`--c-${y}${m}`]);
        if (dist < best) {
            best = dist;
            who = y;
        }
    }
    return `${f(best)} (${who})`;
}

const base = load(BASE);
const wt = load(WT);

for (const [label, tree] of [['base', base], ['worktree', wt]] as const) {
    console.log(`=== ${label}`);
    const st = tree.vocab.statuses.interview.color;
    const row = tree.vocab.position_stages.find((r: any) => r.label === 'Interview');
    console.log(`C1 statuses.interview.color ${st}; position_stages Interview ${row?.color}`);
    const palette = tree.vocab.palette;
    const tokens = [...new Set(Object.values(tree.vocab.statuses).map((s: any) => palette[String(s.color).toLowerCase()] ?? s.color))].sort();
    console.log(`status tokens read from statuses: ${tokens.join(' ')}`);
    const under = pairs(tree);
    for (const p of under) console.log(`  under 10: ${p.theme} ${p.a}-${p.b} ${p.m} ${f(p.dist)}`);
    const themes = new Set(under.map((p) => p.theme));
    const distinct = new Set(under.map((p) => `${p.theme} ${p.a}-${p.b}`));
    for (const x of ['pink', 'teal']) {
        const blocks = [...new Set(under.filter((p) => p.a === x).map((p) => p.theme))];
        console.log(`  ${x} under 10 in ${blocks.length} blocks: ${blocks.join(' ')}`);
    }
    console.log(`C2 ${tree.names.length} themes; ${themes.size} themes hold one; ${under.length} measures under 10; ${distinct.size} pairs under 10`);
}

console.log('=== authored tokens that differ between base and worktree');
const changed = new Set<string>();
for (const theme of wt.names) {
    const a = base.authored[theme];
    const b = wt.authored[theme];
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) {
        if (a[k] !== b[k]) {
            console.log(`  ${theme} ${k}: ${a[k]} -> ${b[k]}`);
            if (k === '--c-pink' || k === '--c-teal') changed.add(theme);
        }
    }
}
console.log(`themes whose pink or teal changed: ${changed.size}`);

console.log('=== per listed or changed block: value, OKLCH L and C, nearest status token on hue and -txt');
const blocksOf = [...new Set([...LISTED.pink, ...LISTED.teal, ...changed])];
for (const theme of blocksOf) {
    const t = wt.tokens[theme];
    const statusLC = STATUS.filter((s) => s !== 'pink' && s !== 'teal' && s !== 'grey' && s !== 'slate').map((s) => toOklch(t[`--c-${s}`]));
    const ls = statusLC.map((c) => c.l);
    const cs = statusLC.map((c) => c.c);
    console.log(`${theme}: status hues L ${f(Math.min(...ls) * 100)}-${f(Math.max(...ls) * 100)} C ${Math.min(...cs).toFixed(3)}-${Math.max(...cs).toFixed(3)}`);
    for (const x of ['pink', 'teal']) {
        const ok = toOklch(t[`--c-${x}`]);
        const was = base.authored[theme][`--c-${x}`];
        const now = wt.authored[theme][`--c-${x}`];
        console.log(`  ${x} ${was}${was !== now ? ` -> ${now}` : ''} L ${f(ok.l * 100)} C ${ok.c.toFixed(3)} h ${f(ok.h ?? 0)}; nearest hue ${nearest(t, x, '')}; -txt ${t[`--c-${x}-txt`]} nearest ${nearest(t, x, '-txt')}`);
    }
}

console.log('=== C3 lane pairs with pink-lane or teal-lane on one side, before -> after, per listed or changed block');
const tones = [...new Set(Object.values(wt.vocab.palette as Record<string, string>).filter((v) => v.startsWith('c-')).map((v) => v.slice(2)))].sort();
let broken = 0;
let checked = 0;
for (const theme of blocksOf) {
    const b = base.tokens[theme];
    const a = wt.tokens[theme];
    for (const x of ['pink', 'teal']) {
        const cells: string[] = [];
        for (const y of tones) {
            if (y === x || (x === 'teal' && y === 'pink')) continue;
            const lane = `--c-${y}-lane`;
            if (!(lane in a) && !(lane in b)) continue;
            const before = d(b[`--c-${x}-lane`], b[lane]);
            const after = d(a[`--c-${x}-lane`], a[lane]);
            checked += 1;
            const bad = before >= 10 && !(after >= 10);
            if (bad) broken += 1;
            cells.push(`${y} ${f(before)}${f(before) !== f(after) ? `>${f(after)}` : ''}${bad ? ' BROKEN' : ''}`);
        }
        console.log(`  ${theme} ${x}-lane: ${cells.join(', ')}`);
    }
}
console.log(`C3 ${checked} lane pairs read; ${broken} at 10 or more on the base and under 10 after`);

console.log('=== lane pairs with pink-lane or teal-lane on one side under 10 in at least one of the 49 themes, base -> worktree');
let left = 0;
for (const x of ['pink', 'teal']) {
    for (const y of tones) {
        if (y === x || (x === 'teal' && y === 'pink')) continue;
        const under = (tree: Tree): string[] =>
            tree.names.filter((n) => {
                const t = tree.tokens[n];
                const lane = t[`--c-${y}-lane`];
                return lane !== undefined && !(d(t[`--c-${x}-lane`], lane) >= 10);
            });
        const was = under(base);
        const now = under(wt);
        if (was.length === 0 && now.length === 0) continue;
        if (was.length > 0 && now.length === 0) left += 1;
        console.log(`  ${x}-lane ${y}-lane: ${was.length} themes -> ${now.length} themes${was.length > 0 && now.length === 0 ? ' LEFT THE SET' : ''}`);
    }
}
console.log(`${left} pairs under 10 in some theme on the base are at 10 or more in every theme after`);
```

The last section (lines 171-189) was added after the first run, to measure the `focus_lanes` comment's count; the first run below is the program without it. Both runs are saved whole at `.../scratchpad/o140-builder/run-base-final.txt` (first, 310 lines) and `.../scratchpad/o140-builder/run-final.txt` (after, 280 lines). The program's `=== base` half reads the base copy, so every rerun reprints the first run's base half.

### First run, on the unchanged tree (`run-base-final.txt`)

The `=== base` and `=== worktree` halves were identical; the base half:

```
=== base
C1 statuses.interview.color #7c3aed; position_stages Interview #7c3aed
status tokens read from statuses: c-amber c-blue c-brass c-cyan c-green c-grey c-orange c-purple c-red c-sky c-slate c-teal c-violet
  under 10: macchiato teal-cyan hue 9.2
  under 10: macchiato teal-cyan -txt 9.2
  under 10: macchiato teal-sky hue 9.2
  under 10: macchiato teal-sky -txt 9.2
  under 10: frappe teal-cyan hue 9.6
  under 10: frappe teal-cyan -txt 9.6
  under 10: frappe teal-sky hue 9.6
  under 10: frappe teal-sky -txt 9.6
  under 10: gruvbox pink-violet hue 0.0
  under 10: gruvbox pink-violet -txt 0.0
  under 10: nord pink-red -txt 8.5
  under 10: nord pink-violet hue 3.3
  under 10: nord pink-violet -txt 2.4
  under 10: nord teal-cyan hue 6.9
  under 10: nord teal-cyan -txt 6.2
  under 10: nord teal-sky hue 6.9
  under 10: nord teal-sky -txt 6.2
  under 10: synthwave teal-cyan hue 0.0
  under 10: synthwave teal-cyan -txt 0.0
  under 10: synthwave teal-sky hue 0.0
  under 10: synthwave teal-sky -txt 0.0
  under 10: synthwave teal-blue hue 5.3
  under 10: synthwave teal-blue -txt 5.3
  under 10: tokyonight pink-red hue 4.7
  under 10: tokyonight pink-red -txt 4.7
  under 10: tokyostorm pink-red hue 4.7
  under 10: tokyostorm pink-red -txt 4.7
  under 10: rosepine pink-orange hue 0.0
  under 10: rosepine pink-orange -txt 0.0
  under 10: rosepine teal-green hue 0.0
  under 10: rosepine teal-green -txt 0.0
  under 10: rosepine teal-sky hue 0.0
  under 10: rosepine teal-sky -txt 0.0
  under 10: rosepinemoon pink-orange hue 0.0
  under 10: rosepinemoon pink-orange -txt 0.0
  under 10: rosepinemoon teal-green hue 0.0
  under 10: rosepinemoon teal-green -txt 0.0
  under 10: rosepinemoon teal-sky hue 0.0
  under 10: rosepinemoon teal-sky -txt 0.0
  under 10: everforest pink-violet hue 0.0
  under 10: everforest pink-violet -txt 0.0
  under 10: everforest teal-green hue 9.4
  under 10: everforest teal-green -txt 9.4
  under 10: dracula teal-cyan hue 0.0
  under 10: dracula teal-cyan -txt 0.0
  under 10: dracula teal-sky hue 0.0
  under 10: dracula teal-sky -txt 0.0
  under 10: onedark pink-red hue 0.0
  under 10: onedark pink-red -txt 0.0
  under 10: onedark teal-cyan hue 0.0
  under 10: onedark teal-cyan -txt 0.0
  under 10: oxocarbon pink-red hue 9.3
  under 10: oxocarbon pink-red -txt 7.8
  under 10: oxocarbon teal-cyan hue 7.7
  under 10: oxocarbon teal-cyan -txt 7.7
  under 10: flexoki teal-cyan hue 0.0
  under 10: flexoki teal-cyan -txt 0.0
  under 10: flexoki teal-sky hue 0.0
  under 10: flexoki teal-sky -txt 0.0
  under 10: kanagawa pink-red -txt 8.2
  under 10: kanagawadragon teal-cyan hue 6.7
  under 10: kanagawadragon teal-cyan -txt 6.7
  under 10: kanagawadragon teal-sky hue 6.7
  under 10: kanagawadragon teal-sky -txt 6.7
  under 10: kanagawadragon teal-blue hue 6.7
  under 10: kanagawadragon teal-blue -txt 6.7
  under 10: kanagawadragon teal-grey -txt 7.6
  under 10: kanagawadragon teal-slate -txt 7.6
  under 10: solarized teal-cyan hue 0.0
  under 10: solarized teal-cyan -txt 0.0
  under 10: gruvboxlight pink-violet -txt 4.8
  under 10: gruvboxlight teal-cyan hue 0.0
  under 10: gruvboxlight teal-cyan -txt 0.0
  under 10: rosepinedawn pink-orange hue 0.0
  under 10: rosepinedawn pink-orange -txt 0.0
  under 10: rosepinedawn teal-green hue 0.0
  under 10: rosepinedawn teal-green -txt 0.0
  under 10: rosepinedawn teal-cyan -txt 7.5
  under 10: rosepinedawn teal-sky -txt 7.5
  under 10: rosepinedawn teal-blue -txt 7.5
  under 10: tokyolight pink-violet hue 8.8
  under 10: tokyolight pink-violet -txt 7.3
  under 10: kanagawalotus teal-cyan -txt 9.7
  under 10: everforestlight pink-violet hue 0.0
  under 10: everforestlight pink-violet -txt 0.0
  under 10: flexokilight teal-cyan hue 0.0
  under 10: flexokilight teal-cyan -txt 0.0
  under 10: flexokilight teal-sky hue 0.0
  under 10: flexokilight teal-sky -txt 0.0
  pink under 10 in 14 blocks: gruvbox nord tokyonight tokyostorm rosepine rosepinemoon everforest onedark oxocarbon kanagawa gruvboxlight rosepinedawn tokyolight everforestlight
  teal under 10 in 17 blocks: macchiato frappe nord synthwave rosepine rosepinemoon everforest dracula onedark oxocarbon flexoki kanagawadragon solarized gruvboxlight rosepinedawn kanagawalotus flexokilight
C2 49 themes; 23 themes hold one; 89 measures under 10; 49 pairs under 10
=== authored tokens that differ between base and worktree
themes whose pink or teal changed: 0
=== per listed or changed block: value, OKLCH L and C, nearest status token on hue and -txt
gruvbox: status hues L 57.6-83.2 C 0.042-0.218
  pink #d3869b L 70.5 C 0.098 h 2.2; nearest hue 0.0 (violet); -txt #d3869b nearest 0.0 (violet)
  teal #8ec07c L 75.6 C 0.108 h 137.7; nearest hue 16.0 (cyan); -txt #8ec07c nearest 16.0 (cyan)
gruvboxlight: status hues L 43.7-61.8 C 0.082-0.179
  pink #b16286 L 59.7 C 0.111 h 352.2; nearest hue 12.6 (violet); -txt #954a6c nearest 4.8 (violet)
  teal #427b58 L 53.4 C 0.082 h 155.4; nearest hue 0.0 (cyan); -txt #3a6d4e nearest 0.0 (cyan)
everforest: status hues L 70.9-80.8 C 0.063-0.128
  pink #d699b6 L 75.0 C 0.082 h 349.2; nearest hue 0.0 (violet); -txt #d699b6 nearest 0.0 (violet)
  teal #83c092 L 75.4 C 0.091 h 151.4; nearest hue 9.4 (green); -txt #83c092 nearest 9.4 (green)
everforestlight: status hues L 63.4-74.7 C 0.112-0.200
  pink #df69ba L 68.7 C 0.174 h 341.0; nearest hue 0.0 (violet); -txt #b9278b nearest 0.0 (violet)
  teal #35a77c L 65.3 C 0.121 h 163.9; nearest hue 16.6 (grey); -txt #237053 nearest 14.0 (grey)
nord: status hues L 59.4-85.5 C 0.062-0.146
  pink #c295b8 L 72.3 C 0.072 h 334.3; nearest hue 3.3 (violet); -txt #d4b5cd nearest 2.4 (violet)
  teal #8fbcbb L 76.3 C 0.048 h 194.5; nearest hue 6.9 (cyan); -txt #9bc3c2 nearest 6.2 (cyan)
tokyonight: status hues L 71.9-82.0 C 0.105-0.159
  pink #ff75a0 L 73.7 C 0.172 h 2.7; nearest hue 4.7 (red); -txt #ff75a0 nearest 4.7 (red)
  teal #73daca L 82.2 C 0.100 h 182.5; nearest hue 22.1 (cyan); -txt #73daca nearest 22.1 (cyan)
tokyostorm: status hues L 71.9-82.0 C 0.105-0.159
  pink #ff75a0 L 73.7 C 0.172 h 2.7; nearest hue 4.7 (red); -txt #ff75a0 nearest 4.7 (red)
  teal #73daca L 82.2 C 0.100 h 182.5; nearest hue 22.1 (cyan); -txt #73daca nearest 22.1 (cyan)
tokyolight: status hues L 43.6-52.3 C 0.053-0.140
  pink #7b43ba L 51.1 C 0.180 h 302.0; nearest hue 8.8 (violet); -txt #7640b2 nearest 7.3 (violet)
  teal #33635c L 46.4 C 0.054 h 183.4; nearest hue 14.3 (cyan); -txt #33635c nearest 13.5 (cyan)
oxocarbon: status hues L 66.9-83.2 C 0.102-0.199
  pink #ff7eb6 L 75.6 C 0.167 h 354.5; nearest hue 9.3 (red); -txt #ff7eb6 nearest 7.8 (red)
  teal #08bdba L 72.2 C 0.123 h 192.7; nearest hue 7.7 (cyan); -txt #08bdba nearest 7.7 (cyan)
kanagawa: status hues L 55.9-83.3 C 0.064-0.167
  pink #d27e99 L 69.0 C 0.108 h 359.6; nearest hue 18.7 (violet); -txt #d4859e nearest 8.2 (red)
  teal #7aa89f L 69.6 C 0.051 h 181.3; nearest hue 13.6 (cyan); -txt #7aa89f nearest 13.6 (cyan)
rosepine: status hues L 52.8-84.3 C 0.054-0.156
  pink #ebbcba L 83.6 C 0.054 h 21.1; nearest hue 0.0 (orange); -txt #ebbcba nearest 0.0 (orange)
  teal #9ccfd8 L 82.2 C 0.054 h 209.6; nearest hue 0.0 (green); -txt #9ccfd8 nearest 0.0 (green)
rosepinemoon: status hues L 61.4-84.3 C 0.054-0.156
  pink #ea9a97 L 76.5 C 0.097 h 21.9; nearest hue 0.0 (orange); -txt #ea9a97 nearest 0.0 (orange)
  teal #9ccfd8 L 82.2 C 0.054 h 209.6; nearest hue 0.0 (green); -txt #9ccfd8 nearest 0.0 (green)
rosepinedawn: status hues L 49.1-75.5 C 0.066-0.146
  pink #d7827e L 69.6 C 0.106 h 23.0; nearest hue 0.0 (orange); -txt #b63e38 nearest 0.0 (orange)
  teal #56949f L 62.9 C 0.066 h 210.1; nearest hue 0.0 (green); -txt #406f77 nearest 0.0 (green)
onedark: status hues L 67.1-82.5 C 0.092-0.164
  pink #e06c75 L 67.1 C 0.145 h 17.0; nearest hue 0.0 (red); -txt #e37c84 nearest 0.0 (red)
  teal #56b6c2 L 72.3 C 0.092 h 206.3; nearest hue 0.0 (cyan); -txt #56b6c2 nearest 0.0 (cyan)
dracula: status hues L 56.0-95.5 C 0.080-0.220
  pink #ff79c6 L 75.5 C 0.183 h 346.8; nearest hue 18.2 (violet); -txt #ff79c6 nearest 18.2 (violet)
  teal #8be9fd L 88.3 C 0.093 h 212.8; nearest hue 0.0 (cyan); -txt #8be9fd nearest 0.0 (cyan)
solarized: status hues L 58.1-65.4 C 0.102-0.206
  pink #d33682 L 59.2 C 0.202 h 355.9; nearest hue 22.6 (red); -txt #e589b6 nearest 14.9 (red)
  teal #2aa198 L 64.4 C 0.102 h 187.4; nearest hue 0.0 (cyan); -txt #30b9ae nearest 0.0 (cyan)
synthwave: status hues L 66.4-89.2 C 0.088-0.221
  pink #ff7edb L 76.9 C 0.189 h 339.1; nearest hue 13.4 (violet); -txt #ff7edb nearest 12.8 (violet)
  teal #36f9f6 L 89.2 C 0.144 h 193.2; nearest hue 0.0 (cyan); -txt #36f9f6 nearest 0.0 (cyan)
flexoki: status hues L 59.7-73.5 C 0.100-0.169
  pink #ce5d97 L 63.5 C 0.156 h 350.5; nearest hue 21.6 (violet); -txt #d26ca1 nearest 18.9 (red)
  teal #3aa99f L 67.0 C 0.100 h 186.6; nearest hue 0.0 (cyan); -txt #3aa99f nearest 0.0 (cyan)
flexokilight: status hues L 45.4-63.3 C 0.086-0.165
  pink #a02f6f L 49.5 C 0.161 h 349.8; nearest hue 19.8 (violet); -txt #a02f6f nearest 19.8 (violet)
  teal #24837b L 55.4 C 0.086 h 186.7; nearest hue 0.0 (cyan); -txt #1d6a64 nearest 0.0 (cyan)
macchiato: status hues L 73.7-87.9 C 0.072-0.126
  pink #f5bde6 L 86.1 C 0.083 h 336.2; nearest hue 14.7 (violet); -txt #f5bde6 nearest 14.7 (violet)
  teal #8bd5ca L 82.1 C 0.076 h 184.1; nearest hue 9.2 (cyan); -txt #8bd5ca nearest 9.2 (cyan)
frappe: status hues L 71.7-84.4 C 0.059-0.124
  pink #f4b8e4 L 85.0 C 0.089 h 336.3; nearest hue 11.5 (violet); -txt #f4b8e4 nearest 11.5 (violet)
  teal #81c8be L 78.3 C 0.073 h 184.6; nearest hue 9.6 (cyan); -txt #81c8be nearest 9.6 (cyan)
kanagawadragon: status hues L 64.5-76.9 C 0.033-0.102
  pink #a292a3 L 67.9 C 0.031 h 324.1; nearest hue 11.2 (violet); -txt #a292a3 nearest 11.2 (violet)
  teal #8ea4a2 L 70.1 C 0.025 h 189.9; nearest hue 6.7 (cyan); -txt #8ea4a2 nearest 6.7 (cyan)
kanagawalotus: status hues L 46.3-73.0 C 0.058-0.171
  pink #b35b79 L 58.5 C 0.118 h 359.8; nearest hue 11.2 (red); -txt #954560 nearest 10.5 (red)
  teal #597b75 L 55.5 C 0.040 h 182.7; nearest hue 13.4 (cyan); -txt #47635e nearest 9.7 (cyan)
=== C3 lane pairs with pink-lane or teal-lane on one side, before -> after, per listed or changed block
C3 1265 lane pairs read; 0 at 10 or more on the base and under 10 after
```

The first run's 46 lane rows between the last two lines printed each pair once (before equal to after); their values are the "before" figures of every row of the run after the change, below, which reads the same base copy.

### Run after the last change (`run-r1-final.txt`)

The `=== base` half is the first run's base half above, line for line. The rest:

```
=== worktree
C1 statuses.interview.color #ec4899; position_stages Interview #ec4899
status tokens read from statuses: c-amber c-blue c-brass c-cyan c-green c-grey c-orange c-pink c-red c-sky c-slate c-teal c-violet
  pink under 10 in 0 blocks: 
  teal under 10 in 0 blocks: 
C2 49 themes; 0 themes hold one; 0 measures under 10; 0 pairs under 10
=== authored tokens that differ between base and worktree
  macchiato --c-teal: #8bd5ca -> #62d6c2
  frappe --c-teal: #81c8be -> #5ccbb6
  gruvbox --c-pink: #d3869b -> #f28ccf
  nord --c-teal: #8fbcbb -> #6fc2b0
  nord --c-pink: #c295b8 -> #f7a6d0
  synthwave --c-teal: #36f9f6 -> #20c9b4
  tokyonight --c-pink: #ff75a0 -> #ff7ac6
  tokyostorm --c-pink: #ff75a0 -> #ff7ac6
  rosepine --c-teal: #9ccfd8 -> #5ec2b3
  rosepine --c-pink: #ebbcba -> #fcb2cc
  rosepinemoon --c-teal: #9ccfd8 -> #5ec2b3
  rosepinemoon --c-pink: #ea9a97 -> #f4a6bf
  everforest --c-teal: #83c092 -> #7ccca0
  everforest --c-pink: #d699b6 -> #ffc0cf
  dracula --c-teal: #8be9fd -> #5ae6c4
  onedark --c-teal: #56b6c2 -> #4fc1a6
  onedark --c-pink: #e06c75 -> #f5a3b5
  oxocarbon --c-teal: #08bdba -> #009d9a
  oxocarbon --c-pink: #ff7eb6 -> #ffafd2
  flexoki --c-teal: #3aa99f -> #66c9a6
  kanagawa --c-pink: #d27e99 -> #e5a0b8
  kanagawadragon --c-teal: #8ea4a2 -> #6cb0a8
  solarized --c-teal: #2aa198 -> #26a67c
  gruvboxlight --c-teal: #427b58 -> #22aba2
  gruvboxlight --c-pink: #b16286 -> #c22d62
  rosepinedawn --c-teal: #56949f -> #2f8a7f
  rosepinedawn --c-pink: #d7827e -> #b4589a
  tokyolight --c-pink: #7b43ba -> #a83a8f
  kanagawalotus --c-teal: #597b75 -> #3d8a72
  everforestlight --c-pink: #df69ba -> #ab3560
  flexokilight --c-teal: #24837b -> #1b8b60
themes whose pink or teal changed: 23
=== per listed or changed block: value, OKLCH L and C, nearest status token on hue and -txt
gruvbox: status hues L 57.6-83.2 C 0.042-0.218
  pink #d3869b -> #f28ccf L 76.9 C 0.147 h 341.3; nearest hue 11.8 (violet); -txt #f28ccf nearest 11.8 (violet)
  teal #8ec07c L 75.6 C 0.108 h 137.7; nearest hue 16.0 (cyan); -txt #8ec07c nearest 16.0 (cyan)
gruvboxlight: status hues L 43.7-61.8 C 0.082-0.179
  pink #b16286 -> #c22d62 L 54.6 C 0.187 h 4.9; nearest hue 12.5 (violet); -txt #b92b5d nearest 11.6 (violet)
  teal #427b58 -> #22aba2 L 67.1 C 0.110 h 187.9; nearest hue 20.2 (cyan); -txt #166f69 nearest 10.9 (cyan)
everforest: status hues L 70.9-80.8 C 0.063-0.128
  pink #d699b6 -> #ffc0cf L 86.9 C 0.075 h 3.0; nearest hue 11.0 (violet); -txt #ffc0cf nearest 11.0 (violet)
  teal #83c092 -> #7ccca0 L 78.2 C 0.102 h 158.8; nearest hue 12.0 (cyan); -txt #7ccca0 nearest 12.0 (cyan)
everforestlight: status hues L 63.4-74.7 C 0.112-0.200
  pink #df69ba -> #ab3560 L 51.4 C 0.157 h 2.1; nearest hue 22.3 (violet); -txt #ab3560 nearest 10.3 (violet)
  teal #35a77c L 65.3 C 0.121 h 163.9; nearest hue 16.6 (grey); -txt #237053 nearest 14.0 (grey)
nord: status hues L 59.4-85.5 C 0.062-0.146
  pink #c295b8 -> #f7a6d0 L 81.6 C 0.108 h 347.4; nearest hue 13.1 (violet); -txt #f7a6d0 nearest 11.9 (red)
  teal #8fbcbb -> #6fc2b0 L 75.6 C 0.086 h 178.3; nearest hue 14.8 (cyan); -txt #84cbbb nearest 13.5 (cyan)
tokyonight: status hues L 71.9-82.0 C 0.105-0.159
  pink #ff75a0 -> #ff7ac6 L 75.6 C 0.182 h 346.9; nearest hue 12.7 (red); -txt #ff7ac6 nearest 12.7 (red)
  teal #73daca L 82.2 C 0.100 h 182.5; nearest hue 22.1 (cyan); -txt #73daca nearest 22.1 (cyan)
tokyostorm: status hues L 71.9-82.0 C 0.105-0.159
  pink #ff75a0 -> #ff7ac6 L 75.6 C 0.182 h 346.9; nearest hue 12.7 (red); -txt #ff7ac6 nearest 12.7 (red)
  teal #73daca L 82.2 C 0.100 h 182.5; nearest hue 22.1 (cyan); -txt #73daca nearest 22.1 (cyan)
tokyolight: status hues L 43.6-52.3 C 0.053-0.140
  pink #7b43ba -> #a83a8f L 53.4 C 0.173 h 337.9; nearest hue 16.5 (red); -txt #983482 nearest 15.1 (violet)
  teal #33635c L 46.4 C 0.054 h 183.4; nearest hue 14.3 (cyan); -txt #33635c nearest 13.5 (cyan)
oxocarbon: status hues L 66.9-83.2 C 0.102-0.199
  pink #ff7eb6 -> #ffafd2 L 84.0 C 0.103 h 351.7; nearest hue 19.3 (red); -txt #ffafd2 nearest 17.8 (red)
  teal #08bdba -> #009d9a L 62.9 C 0.108 h 192.4; nearest hue 17.0 (cyan); -txt #00a7a4 nearest 13.9 (cyan)
kanagawa: status hues L 55.9-83.3 C 0.064-0.167
  pink #d27e99 -> #e5a0b8 L 77.9 C 0.087 h 356.8; nearest hue 20.8 (violet); -txt #e5a0b8 nearest 11.4 (red)
  teal #7aa89f L 69.6 C 0.051 h 181.3; nearest hue 13.6 (cyan); -txt #7aa89f nearest 13.6 (cyan)
rosepine: status hues L 52.8-84.3 C 0.054-0.156
  pink #ebbcba -> #fcb2cc L 84.0 C 0.092 h 356.5; nearest hue 10.2 (orange); -txt #fcb2cc nearest 10.2 (orange)
  teal #9ccfd8 -> #5ec2b3 L 75.0 C 0.097 h 182.5; nearest hue 13.6 (green); -txt #5ec2b3 nearest 13.6 (green)
rosepinemoon: status hues L 61.4-84.3 C 0.054-0.156
  pink #ea9a97 -> #f4a6bf L 80.8 C 0.097 h 358.7; nearest hue 10.4 (orange); -txt #f4a6bf nearest 10.4 (orange)
  teal #9ccfd8 -> #5ec2b3 L 75.0 C 0.097 h 182.5; nearest hue 13.6 (green); -txt #5ec2b3 nearest 13.6 (green)
rosepinedawn: status hues L 49.1-75.5 C 0.066-0.146
  pink #d7827e -> #b4589a L 59.4 C 0.144 h 339.2; nearest hue 10.8 (red); -txt #a3498a nearest 10.8 (red)
  teal #56949f -> #2f8a7f L 57.7 C 0.086 h 183.9; nearest hue 11.9 (green); -txt #277369 nearest 10.2 (green)
onedark: status hues L 67.1-82.5 C 0.092-0.164
  pink #e06c75 -> #f5a3b5 L 80.1 C 0.099 h 5.2; nearest hue 14.9 (red); -txt #f5a3b5 nearest 11.1 (red)
  teal #56b6c2 -> #4fc1a6 L 73.8 C 0.111 h 174.8; nearest hue 14.8 (cyan); -txt #4fc1a6 nearest 14.8 (cyan)
dracula: status hues L 56.0-95.5 C 0.080-0.220
  pink #ff79c6 L 75.5 C 0.183 h 346.8; nearest hue 18.2 (violet); -txt #ff79c6 nearest 18.2 (violet)
  teal #8be9fd -> #5ae6c4 L 84.0 C 0.131 h 174.1; nearest hue 16.9 (green); -txt #5ae6c4 nearest 16.9 (green)
solarized: status hues L 58.1-65.4 C 0.102-0.206
  pink #d33682 L 59.2 C 0.202 h 355.9; nearest hue 22.6 (red); -txt #e589b6 nearest 14.9 (red)
  teal #2aa198 -> #26a67c L 64.8 C 0.125 h 165.5; nearest hue 10.7 (cyan); -txt #2bbe8e nearest 11.2 (cyan)
synthwave: status hues L 66.4-89.2 C 0.088-0.221
  pink #ff7edb L 76.9 C 0.189 h 339.1; nearest hue 13.4 (violet); -txt #ff7edb nearest 12.8 (violet)
  teal #36f9f6 -> #20c9b4 L 75.2 C 0.130 h 181.5; nearest hue 12.9 (cyan); -txt #20c9b4 nearest 12.9 (cyan)
flexoki: status hues L 59.7-73.5 C 0.100-0.169
  pink #ce5d97 L 63.5 C 0.156 h 350.5; nearest hue 21.6 (violet); -txt #d26ca1 nearest 18.9 (red)
  teal #3aa99f -> #66c9a6 L 76.6 C 0.107 h 168.1; nearest hue 12.0 (cyan); -txt #66c9a6 nearest 12.0 (cyan)
flexokilight: status hues L 45.4-63.3 C 0.086-0.165
  pink #a02f6f L 49.5 C 0.161 h 349.8; nearest hue 19.8 (violet); -txt #a02f6f nearest 19.8 (violet)
  teal #24837b -> #1b8b60 L 56.6 C 0.117 h 161.5; nearest hue 11.9 (cyan); -txt #16714e nearest 10.9 (cyan)
macchiato: status hues L 73.7-87.9 C 0.072-0.126
  pink #f5bde6 L 86.1 C 0.083 h 336.2; nearest hue 14.7 (violet); -txt #f5bde6 nearest 14.7 (violet)
  teal #8bd5ca -> #62d6c2 L 80.3 C 0.110 h 180.4; nearest hue 13.7 (cyan); -txt #62d6c2 nearest 13.7 (cyan)
frappe: status hues L 71.7-84.4 C 0.059-0.124
  pink #f4b8e4 L 85.0 C 0.089 h 336.3; nearest hue 11.5 (violet); -txt #f4b8e4 nearest 11.5 (violet)
  teal #81c8be -> #5ccbb6 L 77.2 C 0.107 h 179.1; nearest hue 14.7 (cyan); -txt #5ccbb6 nearest 14.7 (cyan)
kanagawadragon: status hues L 64.5-76.9 C 0.033-0.102
  pink #a292a3 L 67.9 C 0.031 h 324.1; nearest hue 11.2 (violet); -txt #a292a3 nearest 11.2 (violet)
  teal #8ea4a2 -> #6cb0a8 L 71.0 C 0.070 h 186.2; nearest hue 11.9 (green); -txt #6cb0a8 nearest 11.9 (green)
kanagawalotus: status hues L 46.3-73.0 C 0.058-0.171
  pink #b35b79 L 58.5 C 0.118 h 359.8; nearest hue 11.2 (red); -txt #954560 nearest 10.5 (red)
  teal #597b75 -> #3d8a72 L 57.8 C 0.085 h 170.1; nearest hue 14.8 (green); -txt #2d6654 nearest 12.6 (green)
=== C3 lane pairs with pink-lane or teal-lane on one side, before -> after, per listed or changed block
  gruvbox pink-lane: amber 30.9>39.5, amber-s 26.2>33.9, blue 34.0>31.6, brass 30.0>39.4, crimson 13.5>17.7, cyan 30.0>26.1, cyan-d 38.0>36.3, gold 27.6>36.7, green 35.6>45.1, green-d 33.6>42.9, grey 17.3>20.4, grey-d 19.3>23.1, honey 28.9>37.8, indigo 30.0>26.1, lime 35.6>45.1, magenta 0.0>8.4, mauve 0.0>8.4, orange 23.4>31.5, purple 6.8>10.4, red 16.3>22.2, red-d 18.0>23.8, red-s 19.1>25.4, red-t 10.5>16.9, rose 14.0>14.2, sky 30.0>26.1, slate 23.0>26.4, teal 38.0>43.3, violet 0.0>8.4
  gruvbox teal-lane: amber 21.2, amber-s 26.0, blue 18.3, brass 19.9, crimson 43.9, cyan 11.7, cyan-d 25.7, gold 21.4, green 13.0, green-d 13.6, grey 20.5, grey-d 23.9, honey 24.7, indigo 11.7, lime 13.0, magenta 38.0, mauve 38.0, orange 30.8, purple 41.3, red 40.7, red-d 42.5, red-s 39.6, red-t 36.8, rose 48.5, sky 11.7, slate 27.8, violet 38.0
  gruvboxlight pink-lane: amber 23.1>29.9, amber-s 25.8>33.1, blue 36.8>41.9, brass 23.1>29.9, crimson 15.3>11.3, cyan 34.1>39.9, cyan-d 34.1>39.9, gold 23.1>29.9, green 28.3>35.9, green-d 28.3>35.9, grey 19.7>26.1, grey-d 19.7>26.1, honey 23.1>29.9, indigo 5.5>7.1, lime 28.3>35.9, magenta 5.5>7.1, mauve 0.0>8.8, orange 16.5>19.5, purple 5.5>7.1, red 15.3>11.3, red-d 15.3>11.3, red-s 25.8>33.1, red-t 15.3>11.3, rose 0.0>8.8, sky 36.8>41.9, slate 19.7>26.1, teal 34.1>47.0, violet 5.5>7.1
  gruvboxlight teal-lane: amber 20.0>28.2, amber-s 18.4>22.3, blue 11.0>10.3, brass 20.0>28.2, crimson 37.9>46.3, cyan 0.0>11.1, cyan-d 0.0>11.1, gold 20.0>28.2, green 12.7>22.0, green-d 12.7>22.0, grey 13.6>21.3, grey-d 13.6>21.3, honey 20.0>28.2, indigo 36.3>42.5, lime 12.7>22.0, magenta 36.3>42.5, mauve 34.1>40.0, orange 28.5>36.8, purple 36.3>42.5, red 37.9>46.3, red-d 37.9>46.3, red-s 18.4>22.3, red-t 37.9>46.3, rose 34.1>40.0, sky 11.0>10.3, slate 13.6>21.3, violet 36.3>42.5
  everforest pink-lane: amber 24.4>22.0, amber-s 25.4>31.1, blue 29.8>31.4, brass 24.4>22.0, crimson 9.6>13.1, cyan 29.8>31.4, cyan-d 29.8>31.4, gold 24.4>22.0, green 33.7>32.4, green-d 33.7>32.4, grey 20.8>23.8, grey-d 20.8>23.8, honey 24.4>22.0, indigo 0.0>7.9, lime 33.7>32.4, magenta 0.0>7.9, mauve 0.0>7.9, orange 14.1>13.9, purple 0.0>7.9, red 9.6>13.1, red-d 9.6>13.1, red-s 25.4>31.1, red-t 9.6>13.1, rose 0.0>7.9, sky 29.8>31.4, slate 20.8>23.8, teal 36.6>37.5, violet 0.0>7.9
  everforest teal-lane: amber 18.0>19.7, amber-s 25.1>27.1, blue 8.4>8.6, brass 18.0>19.7, crimson 39.5>41.4, cyan 8.4>8.6, cyan-d 8.4>8.6, gold 18.0>19.7, green 6.6>8.7, green-d 6.6>8.7, grey 13.8>15.8, grey-d 13.8>15.8, honey 18.0>19.7, indigo 36.6>33.9, lime 6.6>8.7, magenta 36.6>33.9, mauve 36.6>33.9, orange 31.4>33.2, purple 36.6>33.9, red 39.5>41.4, red-d 39.5>41.4, red-s 25.1>27.1, red-t 39.5>41.4, rose 36.6>33.9, sky 8.4>8.6, slate 13.8>15.8, violet 36.6>33.9
  everforestlight pink-lane: amber 41.6>36.5, amber-s 31.3>31.8, blue 34.3>38.4, brass 41.6>36.5, crimson 15.9>11.3, cyan 34.3>38.4, cyan-d 34.3>38.4, gold 41.6>36.5, green 47.1>42.0, green-d 47.1>42.0, grey 32.2>30.8, grey-d 32.2>30.8, honey 41.6>36.5, indigo 0.0>9.7, lime 47.1>42.0, magenta 0.0>9.7, mauve 0.0>9.7, orange 29.7>24.8, purple 0.0>9.7, red 15.9>11.3, red-d 15.9>11.3, red-s 31.3>31.8, red-t 15.9>11.3, rose 0.0>9.7, sky 34.3>38.4, slate 32.2>30.8, teal 46.7>45.2, violet 0.0>9.7
  everforestlight teal-lane: amber 26.2, amber-s 19.8, blue 18.9, brass 26.2, crimson 43.1, cyan 18.9, cyan-d 18.9, gold 26.2, green 18.2, green-d 18.2, grey 14.2, grey-d 14.2, honey 26.2, indigo 46.7, lime 18.2, magenta 46.7, mauve 46.7, orange 33.1, purple 46.7, red 43.1, red-d 43.1, red-s 19.8, red-t 43.1, rose 46.7, sky 18.9, slate 14.2, violet 46.7
  nord pink-lane: amber 26.3>27.1, amber-s 23.8>30.1, blue 17.4>24.2, brass 34.9>36.8, crimson 19.4>20.0, cyan 23.9>28.1, cyan-d 29.4>36.3, gold 26.8>28.7, green 25.9>35.5, green-d 25.9>36.4, grey 13.1>18.5, grey-d 15.5>22.7, honey 34.3>35.5, indigo 16.5>22.3, lime 25.7>34.3, magenta 2.3>9.8, mauve 2.3>9.8, orange 13.1>14.5, purple 5.2>12.2, red 12.4>14.7, red-d 13.5>17.1, red-s 20.1>26.5, red-t 7.0>8.9, rose 18.1>19.3, sky 23.9>28.1, slate 19.4>26.8, teal 23.5>33.5, violet 2.3>9.8
  nord teal-lane: amber 19.9>22.0, amber-s 23.4>25.7, blue 15.8>20.4, brass 27.7>27.5, crimson 35.6>40.9, cyan 3.9>10.0, cyan-d 15.9>17.6, gold 19.8>21.4, green 11.8>10.2, green-d 12.5>10.7, grey 10.2>16.6, grey-d 16.1>20.8, honey 30.0>30.8, indigo 10.6>16.5, lime 11.8>11.0, magenta 22.4>28.7, mauve 22.4>28.7, orange 29.7>33.6, purple 24.3>30.2, red 33.0>40.0, red-d 33.2>40.1, red-s 29.8>34.6, red-t 28.4>36.0, rose 30.4>35.9, sky 3.9>10.0, slate 20.6>24.4, violet 22.4>28.7
  tokyonight pink-lane: amber 27.5>31.6, amber-s 28.0>27.7, blue 25.6>23.2, brass 27.5>31.6, crimson 3.0>8.5, cyan 35.5>32.2, cyan-d 35.5>32.2, gold 27.5>31.6, green 45.2>48.3, green-d 45.2>48.3, grey 23.6>22.3, grey-d 23.6>22.3, honey 27.5>31.6, indigo 25.6>23.2, lime 45.2>48.3, magenta 17.1>13.3, mauve 15.5>12.7, orange 20.3>25.0, purple 17.1>13.3, red 3.0>8.5, red-d 3.0>8.5, red-s 28.0>27.7, red-t 3.0>8.5, rose 0.0>5.7, sky 35.5>32.2, slate 23.6>22.3, teal 39.3>34.8, violet 17.1>13.3
  tokyonight teal-lane: amber 27.3, amber-s 33.5, blue 23.8, brass 27.3, crimson 41.4, cyan 14.8, cyan-d 14.8, gold 27.3, green 17.2, green-d 17.2, grey 28.9, grey-d 28.9, honey 27.3, indigo 23.8, lime 17.2, magenta 28.2, mauve 28.8, orange 34.8, purple 28.2, red 41.4, red-d 41.4, red-s 33.5, red-t 41.4, rose 39.3, sky 14.8, slate 28.9, violet 28.2
  tokyostorm pink-lane: amber 27.2>30.6, amber-s 25.8>25.1, blue 25.5>23.0, brass 27.2>30.6, crimson 3.1>8.2, cyan 34.4>31.2, cyan-d 34.4>31.2, gold 27.2>30.6, green 45.8>48.3, green-d 45.8>48.3, grey 21.7>20.1, grey-d 21.7>20.1, honey 27.2>30.6, indigo 17.1>13.4, lime 45.8>48.3, magenta 17.1>13.4, mauve 15.6>12.7, orange 20.4>24.6, purple 17.1>13.4, red 3.1>8.2, red-d 3.1>8.2, red-s 25.8>25.1, red-t 3.1>8.2, rose 0.0>5.4, sky 34.4>31.2, slate 21.7>20.1, teal 39.0>34.4, violet 17.1>13.4
  tokyostorm teal-lane: amber 27.3, amber-s 31.8, blue 23.2, brass 27.3, crimson 41.4, cyan 15.0, cyan-d 15.0, gold 27.3, green 17.5, green-d 17.5, grey 26.1, grey-d 26.1, honey 27.3, indigo 27.1, lime 17.5, magenta 27.1, mauve 27.8, orange 34.8, purple 27.1, red 41.4, red-d 41.4, red-s 31.8, red-t 41.4, rose 39.0, sky 15.0, slate 26.1, violet 27.1
  tokyolight pink-lane: amber 35.0>32.1, amber-s 23.1>24.2, blue 13.8>22.6, brass 28.0>26.6, crimson 16.0>11.0, cyan 23.7>32.6, cyan-d 17.8>26.6, gold 35.0>32.1, green 35.9>44.0, green-d 23.6>25.3, grey 17.2>19.2, grey-d 17.2>19.2, honey 28.0>26.6, indigo 13.8>22.6, lime 35.9>44.0, magenta 0.0>9.0, mauve 5.4>10.4, orange 26.9>22.9, purple 5.4>10.4, red 16.0>11.0, red-d 16.0>11.0, red-s 23.1>24.2, red-t 16.0>11.0, rose 16.0>11.0, sky 23.7>32.6, slate 17.2>19.2, teal 23.6>25.3, violet 5.4>10.4
  tokyolight teal-lane: amber 21.4, amber-s 17.9, blue 17.6, brass 14.6, crimson 28.6, cyan 8.4, cyan-d 10.1, gold 21.4, green 14.1, green-d 0.0, grey 13.1, grey-d 13.1, honey 14.6, indigo 17.6, lime 14.1, magenta 23.6, mauve 23.3, orange 25.4, purple 23.3, red 28.6, red-d 28.6, red-s 17.9, red-t 28.6, rose 28.6, sky 8.4, slate 13.1, violet 23.3
  oxocarbon pink-lane: amber 41.5>36.2, amber-s 27.9>28.6, blue 26.1>23.1, brass 41.5>36.2, crimson 6.0>13.7, cyan 44.1>43.3, cyan-d 44.1>43.3, gold 41.5>36.2, green 51.8>45.6, green-d 51.8>45.6, grey 22.5>20.2, grey-d 22.5>20.2, honey 41.5>36.2, indigo 35.9>32.8, lime 51.8>45.6, magenta 0.0>8.1, mauve 15.1>14.5, orange 27.1>25.7, purple 15.1>14.5, red 6.0>13.7, red-d 6.0>13.7, red-s 27.9>28.6, red-t 6.0>13.7, rose 0.0>8.1, sky 34.2>31.1, slate 22.5>20.2, teal 44.2>43.2, violet 15.1>14.5
  oxocarbon teal-lane: amber 32.9>33.4, amber-s 26.2>22.2, blue 22.6>22.7, brass 32.9>33.4, crimson 45.2>42.1, cyan 5.5>10.7, cyan-d 5.5>10.7, gold 32.9>33.4, green 16.6>17.1, green-d 16.6>17.1, grey 20.4>18.7, grey-d 20.4>18.7, honey 32.9>33.4, indigo 17.7>18.1, lime 16.6>17.1, magenta 44.2>42.2, mauve 30.8>30.2, orange 38.8>38.0, purple 30.8>30.2, red 45.2>42.1, red-d 45.2>42.1, red-s 26.2>22.2, red-t 45.2>42.1, rose 44.2>42.2, sky 16.2>18.1, slate 20.4>18.7, violet 30.8>30.2
  kanagawa pink-lane: amber 22.7>21.2, amber-s 21.9>24.8, blue 20.4>19.1, brass 25.8>22.9, crimson 12.3>17.2, cyan 29.2>27.1, cyan-d 29.2>27.1, gold 25.8>22.9, green 38.7>36.6, green-d 38.7>36.6, grey 18.1>19.0, grey-d 18.1>19.0, honey 25.8>22.9, indigo 11.9>12.8, lime 38.7>36.6, magenta 0.0>6.0, mauve 0.0>6.0, orange 19.3>17.9, purple 11.9>12.8, red 12.3>17.2, red-d 12.3>17.2, red-s 21.9>24.8, red-t 12.3>17.2, rose 0.0>6.0, sky 29.2>27.1, slate 18.1>19.0, teal 28.7>27.9, violet 11.9>12.8
  kanagawa teal-lane: amber 23.7, amber-s 22.8, blue 16.6, brass 21.2, crimson 33.0, cyan 7.7, cyan-d 7.7, gold 21.2, green 15.2, green-d 15.2, grey 14.0, grey-d 14.0, honey 21.2, indigo 22.2, lime 15.2, magenta 28.7, mauve 28.7, orange 29.0, purple 22.2, red 33.0, red-d 33.0, red-s 22.8, red-t 33.0, rose 28.7, sky 7.7, slate 14.0, violet 22.2
  rosepine pink-lane: amber 17.5>23.7, amber-s 29.2>29.6, blue 29.6>32.0, brass 17.5>23.7, crimson 14.4>11.0, cyan 29.6>32.0, cyan-d 29.6>32.0, gold 17.5>23.7, green 24.4>27.5, green-d 24.4>27.5, grey 19.3>19.9, grey-d 19.3>19.9, honey 17.5>23.7, indigo 12.8>10.5, lime 26.1>32.9, magenta 14.4>11.0, mauve 12.8>10.5, orange 0.0>6.4, purple 12.8>10.5, red 14.4>11.0, red-d 14.4>11.0, red-s 29.2>29.6, red-t 14.4>11.0, rose 0.0>6.4, sky 24.4>27.5, slate 19.3>19.9, teal 24.4>36.6, violet 12.8>10.5
  rosepine teal-lane: amber 25.1>28.2, amber-s 31.2>33.0, blue 17.0>17.9, brass 25.1>28.2, crimson 32.0>38.2, cyan 17.0>17.9, cyan-d 17.0>17.9, gold 25.1>28.2, green 0.0>11.0, green-d 0.0>11.0, grey 22.3>26.6, grey-d 22.3>26.6, honey 25.1>28.2, indigo 19.7>27.4, lime 15.3>12.4, magenta 32.0>38.2, mauve 19.7>27.4, orange 24.4>35.3, purple 19.7>27.4, red 32.0>38.2, red-d 32.0>38.2, red-s 31.2>33.0, red-t 32.0>38.2, rose 24.4>35.3, sky 0.0>11.0, slate 22.3>26.6, violet 19.7>27.4
  rosepinemoon pink-lane: amber 18.8>22.9, amber-s 24.8>25.6, blue 31.5>30.6, brass 18.8>22.9, crimson 8.2>9.0, cyan 31.5>30.6, cyan-d 31.5>30.6, gold 18.8>22.9, green 29.0>26.8, green-d 29.0>26.8, grey 15.5>14.6, grey-d 15.5>14.6, honey 18.8>22.9, indigo 14.6>10.5, lime 29.0>26.8, magenta 8.2>9.0, mauve 14.6>10.5, orange 0.0>5.8, purple 14.6>10.5, red 8.2>9.0, red-d 8.2>9.0, red-s 24.8>25.6, red-t 8.2>9.0, rose 0.0>5.8, sky 29.0>26.8, slate 15.5>14.6, teal 29.0>35.7, violet 14.6>10.5
  rosepinemoon teal-lane: amber 24.9>28.5, amber-s 29.1>31.3, blue 13.3>14.4, brass 24.9>28.5, crimson 31.1>37.4, cyan 13.3>14.4, cyan-d 13.3>14.4, gold 24.9>28.5, green 0.0>10.8, green-d 0.0>10.8, grey 18.3>24.3, grey-d 18.3>24.3, honey 24.9>28.5, indigo 18.2>26.1, lime 0.0>10.8, magenta 31.1>37.4, mauve 18.2>26.1, orange 29.0>39.1, purple 18.2>26.1, red 31.1>37.4, red-d 31.1>37.4, red-s 29.1>31.3, red-t 31.1>37.4, rose 29.0>39.1, sky 0.0>10.8, slate 18.3>24.3, violet 18.2>26.1
  rosepinedawn pink-lane: amber 18.3>32.8, amber-s 15.6>22.7, blue 32.7>29.5, brass 18.3>32.8, crimson 6.9>7.0, cyan 32.7>29.5, cyan-d 32.7>29.5, gold 18.3>32.8, green 29.5>29.1, green-d 29.5>29.1, grey 15.0>14.2, grey-d 15.0>14.2, honey 18.3>32.8, indigo 14.0>10.3, lime 29.5>29.1, magenta 6.9>7.0, mauve 14.0>10.3, orange 0.0>13.3, purple 14.0>10.3, red 6.9>7.0, red-d 6.9>7.0, red-s 15.6>22.7, red-t 6.9>7.0, rose 0.0>13.3, sky 32.7>29.5, slate 15.0>14.2, teal 29.5>34.0, violet 14.0>10.3
  rosepinedawn teal-lane: amber 27.2>28.2, amber-s 16.5>21.2, blue 6.9>10.7, brass 27.2>28.2, crimson 31.4>37.5, cyan 6.9>10.7, cyan-d 6.9>10.7, gold 27.2>28.2, green 0.0>6.9, green-d 0.0>6.9, grey 16.6>21.8, grey-d 16.6>21.8, honey 27.2>28.2, indigo 21.4>26.7, lime 0.0>6.9, magenta 31.4>37.5, mauve 21.4>26.7, orange 29.5>35.4, purple 21.4>26.7, red 31.4>37.5, red-d 31.4>37.5, red-s 16.5>21.2, red-t 31.4>37.5, rose 29.5>35.4, sky 6.9>10.7, slate 16.6>21.8, violet 21.4>26.7
  onedark pink-lane: amber 18.2>18.3, amber-s 25.2>26.9, blue 32.8>29.0, brass 26.5>24.4, crimson 6.6>15.7, cyan 41.7>38.2, cyan-d 41.7>38.2, gold 26.5>24.4, green 39.7>37.8, green-d 39.7>37.8, grey 23.2>23.5, grey-d 23.2>23.5, honey 26.5>24.4, indigo 17.2>14.9, lime 39.7>37.8, magenta 17.2>14.9, mauve 17.2>14.9, orange 18.2>18.3, purple 17.2>14.9, red 0.0>10.0, red-d 6.6>15.7, red-s 25.2>26.9, red-t 0.0>10.0, rose 0.0>10.0, sky 32.8>29.0, slate 23.2>23.5, teal 41.7>41.3, violet 17.2>14.9
  onedark teal-lane: amber 27.7>28.8, amber-s 22.7>27.2, blue 12.0>20.5, brass 26.1>24.4, crimson 43.0>42.8, cyan 0.0>9.5, cyan-d 0.0>9.5, gold 26.1>24.4, green 19.5>12.4, green-d 19.5>12.4, grey 19.2>24.1, grey-d 19.2>24.1, honey 26.1>24.4, indigo 26.8>32.6, lime 19.5>12.4, magenta 26.8>32.6, mauve 26.8>32.6, orange 27.7>28.8, purple 26.8>32.6, red 41.7>43.5, red-d 43.0>42.8, red-s 22.7>27.2, red-t 41.7>43.5, rose 41.7>43.5, sky 12.0>20.5, slate 19.2>24.1, violet 26.8>32.6
  dracula pink-lane: amber 31.2, amber-s 25.0, blue 21.9, brass 47.4, crimson 16.4, cyan 34.9, cyan-d 34.9, gold 47.4, green 60.7, green-d 60.7, grey 21.9, grey-d 21.9, honey 47.4, indigo 12.7, lime 60.7, magenta 0.0, mauve 0.0, orange 31.2, purple 12.7, red 16.4, red-d 16.4, red-s 25.0, red-t 16.4, rose 0.0, sky 34.9, slate 21.9, teal 34.9>39.5, violet 12.7
  dracula teal-lane: amber 30.6>31.2, amber-s 31.4>34.4, blue 25.5>30.5, brass 27.8>20.6, crimson 45.2>48.9, cyan 0.0>13.7, cyan-d 0.0>13.7, gold 27.8>20.6, green 27.7>14.3, green-d 27.7>14.3, grey 25.5>30.5, grey-d 25.5>30.5, honey 27.8>20.6, indigo 24.1>32.8, lime 27.7>14.3, magenta 34.9>39.5, mauve 34.9>39.5, orange 30.6>31.2, purple 24.1>32.8, red 45.2>48.9, red-d 45.2>48.9, red-s 31.4>34.4, red-t 45.2>48.9, rose 34.9>39.5, sky 0.0>13.7, slate 25.5>30.5, violet 24.1>32.8
  solarized pink-lane: amber 47.2, amber-s 31.3, blue 33.6, brass 47.2, crimson 15.3, cyan 38.6, cyan-d 38.6, gold 47.2, green 54.6, green-d 54.6, grey 28.1, grey-d 28.1, honey 47.2, indigo 22.8, lime 54.6, magenta 0.0, mauve 0.0, orange 25.0, purple 22.8, red 15.3, red-d 15.3, red-s 31.3, red-t 15.3, rose 0.0, sky 33.6, slate 28.1, teal 38.6>40.2, violet 22.8
  solarized teal-lane: amber 27.2>23.0, amber-s 16.5>20.9, blue 17.0>24.1, brass 27.2>23.0, crimson 43.3>46.8, cyan 0.0>7.5, cyan-d 0.0>7.5, gold 27.2>23.0, green 24.9>18.6, green-d 24.9>18.6, grey 11.5>16.5, grey-d 11.5>16.5, honey 27.2>23.0, indigo 23.0>28.4, lime 24.9>18.6, magenta 38.6>40.2, mauve 38.6>40.2, orange 36.6>37.8, purple 23.0>28.4, red 43.3>46.8, red-d 43.3>46.8, red-s 16.5>20.9, red-t 43.3>46.8, rose 38.6>40.2, sky 17.0>24.1, slate 11.5>16.5, violet 23.0>28.4
  synthwave pink-lane: amber 26.0, amber-s 21.8, blue 41.9, brass 49.6, crimson 18.3, cyan 40.6, cyan-d 40.6, gold 49.6, green 37.2, green-d 37.2, grey 16.7, grey-d 16.7, honey 49.6, indigo 9.0, lime 37.2, magenta 0.0, mauve 8.7, orange 30.1, purple 9.0, red 18.3, red-d 18.3, red-s 21.8, red-t 18.3, rose 0.0, sky 40.6, slate 16.7, teal 40.6>36.7, violet 9.0
  synthwave teal-lane: amber 33.1>33.8, amber-s 41.9>36.2, blue 3.7>9.4, brass 35.0>32.7, crimson 57.0>51.2, cyan 0.0>9.8, cyan-d 0.0>9.8, gold 35.0>32.7, green 11.6>11.0, green-d 11.6>11.0, grey 30.2>27.2, grey-d 30.2>27.2, honey 35.0>32.7, indigo 36.2>32.9, lime 11.6>11.0, magenta 40.6>36.7, mauve 35.0>33.3, orange 40.7>38.6, purple 36.2>32.9, red 57.0>51.2, red-d 57.0>51.2, red-s 41.9>36.2, red-t 57.0>51.2, rose 40.6>36.7, sky 0.0>9.8, slate 30.2>27.2, violet 36.2>32.9
  flexoki pink-lane: amber 39.0, amber-s 25.8, blue 29.6, brass 39.0, crimson 16.2, cyan 38.4, cyan-d 38.4, gold 39.0, green 41.9, green-d 41.9, grey 23.0, grey-d 23.0, honey 39.0, indigo 15.3, lime 41.9, magenta 0.0, mauve 15.3, orange 24.9, purple 15.3, red 15.4, red-d 16.2, red-s 25.8, red-t 15.4, rose 0.0, sky 38.4, slate 23.0, teal 38.4>46.6, violet 15.3
  flexoki teal-lane: amber 28.9>26.3, amber-s 24.4>28.8, blue 18.9>24.8, brass 28.9>26.3, crimson 42.3>44.8, cyan 0.0>7.6, cyan-d 0.0>7.6, gold 28.9>26.3, green 19.4>16.9, green-d 19.4>16.9, grey 18.0>20.2, grey-d 18.0>20.2, honey 28.9>26.3, indigo 28.0>30.8, lime 19.4>16.9, magenta 38.4>46.6, mauve 28.0>30.8, orange 35.6>36.1, purple 28.0>30.8, red 41.1>43.1, red-d 42.3>44.8, red-s 24.4>28.8, red-t 41.1>43.1, rose 38.4>46.6, sky 0.0>7.6, slate 18.0>20.2, violet 28.0>30.8
  flexokilight pink-lane: amber 38.5, amber-s 30.8, blue 29.0, brass 38.5, crimson 13.5, cyan 36.3, cyan-d 36.3, gold 38.5, green 43.1, green-d 43.1, grey 25.2, grey-d 25.2, honey 38.5, indigo 12.4, lime 43.1, magenta 0.0, mauve 12.4, orange 24.4, purple 12.4, red 13.5, red-d 13.0, red-s 30.8, red-t 13.5, rose 0.0, sky 36.3, slate 25.2, teal 36.3>46.0, violet 12.4
  flexokilight teal-lane: amber 25.3>23.3, amber-s 20.1>21.5, blue 18.6>24.7, brass 25.3>23.3, crimson 38.9>40.9, cyan 0.0>6.2, cyan-d 0.0>6.2, gold 25.3>23.3, green 18.7>14.9, green-d 18.7>14.9, grey 15.9>18.2, grey-d 15.9>18.2, honey 25.3>23.3, indigo 29.1>31.9, lime 18.7>14.9, magenta 36.3>46.0, mauve 29.1>31.9, orange 32.3>32.9, purple 29.1>31.9, red 38.9>40.9, red-d 38.2>40.0, red-s 20.1>21.5, red-t 38.9>40.9, rose 36.3>46.0, sky 0.0>6.2, slate 15.9>18.2, violet 29.1>31.9
  macchiato pink-lane: amber 18.0, amber-s 28.0, blue 17.1, brass 23.3, crimson 12.1, cyan 26.9, cyan-d 24.9, gold 23.3, green 30.2, green-d 30.2, grey 17.7, grey-d 17.7, honey 23.3, indigo 11.5, lime 30.2, magenta 0.0, mauve 7.6, orange 18.0, purple 9.8, red 12.1, red-d 10.1, red-s 28.0, red-t 10.1, rose 7.6, sky 26.9, slate 17.7, teal 29.0>33.5, violet 9.8
  macchiato teal-lane: amber 30.5>34.1, amber-s 30.7>32.5, blue 19.6>22.3, brass 20.4>23.3, crimson 36.7>42.2, cyan 5.7>10.0, cyan-d 10.8>14.2, gold 20.4>23.3, green 12.9>12.5, green-d 12.9>12.5, grey 21.3>24.2, grey-d 21.3>24.2, honey 20.4>23.3, indigo 20.6>23.8, lime 12.9>12.5, magenta 29.0>33.5, mauve 28.8>35.2, orange 30.5>34.1, purple 24.5>28.2, red 36.7>42.2, red-d 36.0>41.8, red-s 30.7>32.5, red-t 36.0>41.8, rose 28.8>35.2, sky 5.7>10.0, slate 21.3>24.2, violet 24.5>28.2
  frappe pink-lane: amber 18.0, amber-s 27.0, blue 16.8, brass 24.7, crimson 13.7, cyan 25.2, cyan-d 24.3, gold 24.7, green 38.3, green-d 38.3, grey 17.8, grey-d 17.8, honey 24.7, indigo 10.7, lime 38.3, magenta 0.0, mauve 8.1, orange 18.0, purple 7.7, red 13.7, red-d 10.1, red-s 27.0, red-t 10.1, rose 8.1, sky 25.2, slate 17.8, teal 29.1>33.6, violet 7.7
  frappe teal-lane: amber 30.9>34.7, amber-s 27.1>29.5, blue 19.0>22.2, brass 20.4>23.0, crimson 37.3>43.1, cyan 6.7>11.4, cyan-d 9.8>14.0, gold 20.4>23.0, green 13.9>13.3, green-d 13.9>13.3, grey 19.3>22.8, grey-d 19.3>22.8, honey 20.4>23.0, indigo 20.7>24.4, lime 13.9>13.3, magenta 29.1>33.6, mauve 29.5>36.0, orange 30.9>34.7, purple 25.3>29.2, red 37.3>43.1, red-d 35.3>41.3, red-s 27.1>29.5, red-t 35.3>41.3, rose 29.5>36.0, sky 6.7>11.4, slate 19.3>22.8, violet 25.3>29.2
  kanagawadragon pink-lane: amber 16.6, amber-s 17.6, blue 12.0, brass 16.6, crimson 13.6, cyan 12.0, cyan-d 12.0, gold 16.6, green 21.3, green-d 18.4, grey 10.3, grey-d 10.3, honey 16.6, indigo 7.0, lime 18.4, magenta 0.0, mauve 6.5, orange 11.0, purple 6.5, red 13.6, red-d 13.6, red-s 17.6, red-t 13.6, rose 0.0, sky 12.0, slate 10.3, teal 13.1>22.0, violet 6.5
  kanagawadragon teal-lane: amber 12.7>18.0, amber-s 18.3>22.8, blue 4.1>10.2, brass 12.7>18.0, crimson 25.4>34.6, cyan 4.1>10.2, cyan-d 4.1>10.2, gold 12.7>18.0, green 7.6, green-d 7.1>10.3, grey 6.5>13.0, grey-d 6.5>13.0, honey 12.7>18.0, indigo 8.9>15.4, lime 7.1>10.3, magenta 13.1>22.0, mauve 9.0>15.7, orange 15.5>23.3, purple 9.0>15.7, red 25.4>34.6, red-d 25.4>34.6, red-s 18.3>22.8, red-t 25.4>34.6, rose 13.1>22.0, sky 4.1>10.2, slate 6.5>13.0, violet 9.0>15.7
  kanagawalotus pink-lane: amber 26.2, amber-s 26.5, blue 23.2, brass 20.9, crimson 5.9, cyan 32.5, cyan-d 26.9, gold 24.2, green 29.2, green-d 30.2, grey 22.4, grey-d 22.4, honey 20.9, indigo 16.0, lime 30.2, magenta 0.0, mauve 12.9, orange 20.5, purple 11.9, red 5.9, red-d 7.2, red-s 26.5, red-t 5.9, rose 0.0, sky 27.6, slate 22.4, teal 29.3>35.3, violet 11.9
  kanagawalotus teal-lane: amber 21.7>24.6, amber-s 14.3>16.5, blue 12.2>16.4, brass 11.2>15.6, crimson 31.9>37.8, cyan 7.1>7.9, cyan-d 3.7>9.4, gold 9.6>13.2, green 7.6>8.8, green-d 6.7>7.4, grey 7.2>12.8, grey-d 7.2>12.8, honey 11.2>15.6, indigo 21.3>25.9, lime 6.7>7.4, magenta 29.3>35.3, mauve 15.6>21.9, orange 22.2>26.5, purple 22.4>29.2, red 31.9>37.8, red-d 31.0>37.0, red-s 14.3>16.5, red-t 31.9>37.8, rose 29.3>35.3, sky 10.8>13.6, slate 7.2>12.8, violet 22.4>29.2
C3 1265 lane pairs read; 0 at 10 or more on the base and under 10 after
=== lane pairs with pink-lane or teal-lane on one side under 10 in at least one of the 49 themes, base -> worktree
  pink-lane crimson-lane: 16 themes -> 13 themes
  pink-lane indigo-lane: 6 themes -> 6 themes
  pink-lane magenta-lane: 23 themes -> 23 themes
  pink-lane mauve-lane: 37 themes -> 36 themes
  pink-lane orange-lane: 3 themes -> 2 themes
  pink-lane purple-lane: 12 themes -> 9 themes
  pink-lane red-lane: 8 themes -> 6 themes
  pink-lane red-d-lane: 9 themes -> 6 themes
  pink-lane red-t-lane: 10 themes -> 8 themes
  pink-lane rose-lane: 45 themes -> 44 themes
  pink-lane violet-lane: 12 themes -> 11 themes
  teal-lane blue-lane: 4 themes -> 2 themes
  teal-lane cyan-lane: 30 themes -> 24 themes
  teal-lane cyan-d-lane: 18 themes -> 12 themes
  teal-lane gold-lane: 1 themes -> 0 themes LEFT THE SET
  teal-lane green-lane: 6 themes -> 4 themes
  teal-lane green-d-lane: 8 themes -> 5 themes
  teal-lane grey-lane: 2 themes -> 0 themes LEFT THE SET
  teal-lane grey-d-lane: 2 themes -> 0 themes LEFT THE SET
  teal-lane indigo-lane: 1 themes -> 0 themes LEFT THE SET
  teal-lane lime-lane: 5 themes -> 3 themes
  teal-lane mauve-lane: 1 themes -> 0 themes LEFT THE SET
  teal-lane purple-lane: 1 themes -> 0 themes LEFT THE SET
  teal-lane sky-lane: 16 themes -> 10 themes
  teal-lane slate-lane: 2 themes -> 0 themes LEFT THE SET
  teal-lane violet-lane: 1 themes -> 0 themes LEFT THE SET
8 pairs under 10 in some theme on the base are at 10 or more in every theme after
```

In the lane rows a cell `x a>b` reads "a on the base, b after"; a single number is unchanged. The program compares the unrounded CIEDE2000 with 10 and prints it rounded to one decimal. A pair under 10 on the base (onedark pink-lane against red, 0.0, now printed 10.0) is outside the C3 bar whatever its value after.

## Each changed block: old and new value, smallest distance to a status token

From the per-block tables of the two runs above (nearest status token, hue / `-txt`).

| Block | Token | Old | New | Before: hue / txt | After: hue / txt |
| --- | --- | --- | --- | --- | --- |
| gruvbox | pink | #d3869b | #f28ccf | 0.0 violet / 0.0 violet | 11.8 violet / 11.8 violet |
| gruvboxlight | pink | #b16286 | #c22d62 | 12.6 violet / 4.8 violet | 12.5 violet / 11.6 violet |
| gruvboxlight | teal | #427b58 | #22aba2 | 0.0 cyan / 0.0 cyan | 20.2 cyan / 10.9 cyan |
| everforest | pink | #d699b6 | #ffc0cf | 0.0 violet / 0.0 violet | 11.0 violet / 11.0 violet |
| everforest | teal | #83c092 | #7ccca0 | 9.4 green / 9.4 green | 12.0 cyan / 12.0 cyan |
| everforestlight | pink | #df69ba | #ab3560 | 0.0 violet / 0.0 violet | 22.3 violet / 10.3 violet |
| nord | pink | #c295b8 | #f7a6d0 | 3.3 violet / 2.4 violet | 13.1 violet / 11.9 red |
| nord | teal | #8fbcbb | #6fc2b0 | 6.9 cyan / 6.2 cyan | 14.8 cyan / 13.5 cyan |
| tokyonight | pink | #ff75a0 | #ff7ac6 | 4.7 red / 4.7 red | 12.7 red / 12.7 red |
| tokyostorm | pink | #ff75a0 | #ff7ac6 | 4.7 red / 4.7 red | 12.7 red / 12.7 red |
| tokyolight | pink | #7b43ba | #a83a8f | 8.8 violet / 7.3 violet | 16.5 red / 15.1 violet |
| oxocarbon | pink | #ff7eb6 | #ffafd2 | 9.3 red / 7.8 red | 19.3 red / 17.8 red |
| oxocarbon | teal | #08bdba | #009d9a | 7.7 cyan / 7.7 cyan | 17.0 cyan / 13.9 cyan |
| kanagawa | pink | #d27e99 | #e5a0b8 | 18.7 violet / 8.2 red | 20.8 violet / 11.4 red |
| kanagawadragon | teal | #8ea4a2 | #6cb0a8 | 6.7 cyan / 6.7 cyan | 11.9 green / 11.9 green |
| kanagawalotus | teal | #597b75 | #3d8a72 | 13.4 cyan / 9.7 cyan | 14.8 green / 12.6 green |
| rosepine | pink | #ebbcba | #fcb2cc | 0.0 orange / 0.0 orange | 10.2 orange / 10.2 orange |
| rosepine | teal | #9ccfd8 | #5ec2b3 | 0.0 green / 0.0 green | 13.6 green / 13.6 green |
| rosepinemoon | pink | #ea9a97 | #f4a6bf | 0.0 orange / 0.0 orange | 10.4 orange / 10.4 orange |
| rosepinemoon | teal | #9ccfd8 | #5ec2b3 | 0.0 green / 0.0 green | 13.6 green / 13.6 green |
| rosepinedawn | pink | #d7827e | #b4589a | 0.0 orange / 0.0 orange | 10.8 red / 10.8 red |
| rosepinedawn | teal | #56949f | #2f8a7f | 0.0 green / 0.0 green | 11.9 green / 10.2 green |
| onedark | pink | #e06c75 | #f5a3b5 | 0.0 red / 0.0 red | 14.9 red / 11.1 red |
| onedark | teal | #56b6c2 | #4fc1a6 | 0.0 cyan / 0.0 cyan | 14.8 cyan / 14.8 cyan |
| dracula | teal | #8be9fd | #5ae6c4 | 0.0 cyan / 0.0 cyan | 16.9 green / 16.9 green |
| solarized | teal | #2aa198 | #26a67c | 0.0 cyan / 0.0 cyan | 10.7 cyan / 11.2 cyan |
| synthwave | teal | #36f9f6 | #20c9b4 | 0.0 cyan / 0.0 cyan | 12.9 cyan / 12.9 cyan |
| flexoki | teal | #3aa99f | #66c9a6 | 0.0 cyan / 0.0 cyan | 12.0 cyan / 12.0 cyan |
| flexokilight | teal | #24837b | #1b8b60 | 0.0 cyan / 0.0 cyan | 11.9 cyan / 10.9 cyan |
| macchiato | teal | #8bd5ca | #62d6c2 | 9.2 cyan / 9.2 cyan | 13.7 cyan / 13.7 cyan |
| frappe | teal | #81c8be | #5ccbb6 | 9.6 cyan / 9.6 cyan | 14.7 cyan / 14.7 cyan |

The teal of the themes not listed for teal (gruvbox, tokyonight, kanagawa and the others) and the pink of the themes not listed for pink keep their values, and the final run's C2 line shows they still clear 10 against the new pink and teal.

## Files changed

`diff -rq` of the base copy's `src` and `config` against the worktree (with `--exclude=local.yml`) lists these nine files and no other; `git status --short` lists the same nine. Line counts by `wc -l` on both trees and `diff | grep -c`:

| File | Lines (base to now) | Added / removed | In the write list |
| --- | --- | --- | --- |
| `config/catalogs/vocab.yml` | 311 to 311 | 2 / 2 | yes (155, 205) |
| `src/lib/themes/rice/catppuccin.css` | 231 to 232 | 5 / 4 | yes (head comment one line longer) |
| `src/lib/themes/rice/everforest.css` | 121 to 122 | 8 / 7 | yes (head comment one line longer) |
| `src/lib/themes/rice/flexoki.css` | 121 to 122 | 7 / 6 | yes (head comment one line longer) |
| `src/lib/themes/rice/gruvbox.css` | 113 to 114 | 7 / 6 | yes (head comment one line longer) |
| `src/lib/themes/rice/kanagawa.css` | 180 to 181 | 7 / 6 | yes (head comment one line longer) |
| `src/lib/themes/rice/rosepine.css` | 183 to 184 | 10 / 9 | yes (head comment one line longer) |
| `src/lib/themes/rice/singles.css` | 357 to 360 | 21 / 18 | yes (head comment three lines longer) |
| `src/lib/themes/rice/tokyo.css` | 239 to 240 | 8 / 7 | yes (head comment one line longer) |
| `.scratch/migration/agents/reviews/O140-report.md` | new | | yes |

The rewrapped head comments push every later line down, so the token lines sit one line (three in singles.css) below the line numbers of the write list; no line outside the head comments and the listed blocks' `--c-pink` and `--c-teal` lines changes (C4).

Every edit was made with the Edit and Write tools, except the section "Repair round 1" of this report, which a shell heredoc appended; no program other than the case-run program was written. `awk 'length($0)>100{print FILENAME": "FNR}' src/lib/themes/rice/*.css` prints nothing.

## Judgment calls the brief left open

1. The `-lane` pairs C3 reads are `pink-lane` and `teal-lane` against the lane of every tone that `vocab.yml`'s `palette:` names (the tones a config colour, and so a header, can be drawn in: 31 tones, counted with `python3 -c "import yaml;p=yaml.safe_load(open('config/catalogs/vocab.yml'))['palette'];print(len({v[2:] for v in p.values() if str(v).startswith('c-')}))"`, among them crimson, mauve, rose, red-t, cyan-d and grey-d). The pairs a Focus header can draw are a subset, so this is the wider of the readings; the code and scm hues, which no header draws, are left out.
2. A "pair under 10" counts one theme with two tokens once, under 10 on the hue or on `-txt`, which reproduces the brief's 49 on the base; the program also prints the 89 measures.
3. Every new hue is oculus's own except Oxocarbon's teal and pink, which are IBM Carbon's teal 50 (`#009d9a`) and magenta 30 (`#ffafd2`). Both values were read from `@carbon/colors` (`https://unpkg.com/@carbon/colors@11.20.0/lib/index.js`: `var teal50 = '#009d9a';`, `var magenta30 = '#ffafd2';`). The `singles.css` head comment says in a sentence of its own that Oxocarbon's own teal and pink, Carbon's teal 40 and magenta 40, are replaced by Carbon's teal 50 and magenta 30.
4. Gruvbox Light's teal is `#06a596` (OKLCH L 64.9, C 0.114, h 183.5), set at landing: the darkest teal found within the theme's status chroma range (C 0.082 or more) that meets every bar of item 2, C2 and C3 (`O140-refuter.md`, "Repair round 1, refuted", S3). The case-run program in the gate prints for it `nearest hue 17.7 (cyan); -txt #047369 nearest 10.1 (cyan)`, the teal-lane against the blue lane 10.4, C2 0 pairs under 10 and C3 0 pairs broken. The text below is the round's account of `#22aba2`, the value before landing. No teal of C 0.08 or more inside the theme's L range (43.7 to 61.8) meets the bars; low-chroma teals there do (the most saturated `#5b8e87`, C 0.056): the reviewer's read-only grid search through `parseBlocks`, `resolveTheme` and `deriveTokens` with the same bars (`O140-refuter.md`, S1) found at L 40 to 62 and C 0.08 to 0.20, hue 150 to 220, one passing value, `#005725` (h 150, a green), and the darkest passing teal at L 67, `#22aba2`. The case-run program confirms it: with `#22aba2`, C2 prints 0 pairs under 10 and C3 0 pairs broken, the nearest status token is 20.2 (cyan) on the hue and 10.9 (cyan) on `-txt` (`#166f69`), and the teal-lane against the blue lane is 10.3. A darker value of the same hue, `#20a8a0` (L 66.2), takes that lane pair to 9.8 (`blue 11.0>9.8 BROKEN`, `C3 1265 lane pairs read; 2 at 10 or more on the base and under 10 after`), so it is not taken.
5. Oxocarbon's teal `#009d9a` (Carbon teal 50, L 62.9) is darker than the theme's other status hues (L 66.9 to 83.2), and derive.ts lifts its `-txt` slightly to `#00a7a4`. Oxocarbon's teal and pink are Carbon's teal 50 and magenta 30 because they are hues of IBM Carbon, the system Oxocarbon is drawn from.
6. Tokyo Night and Tokyo Night Storm share one pink, `#ff7ac6`, as the two blocks share their other hues.
7. Saturation: Gruvbox Light's pink (OKLCH C 0.187) sits a little above the theme's status range (up to 0.179) and Tokyo Night Light's pink (C 0.173) above its range (up to 0.140); the pink it replaces there, `#7b43ba`, was C 0.180. Everforest's pink `#ffc0cf` (L 86.9) is a pale pink above the theme's L range (70.9 to 80.8), which is light on a dark ground.
8. Margins: several new values clear 10 by little (rosepine pink 10.2 from orange, rosepinedawn teal `-txt` 10.2, everforestlight pink `-txt` 10.3, rosepinemoon pink 10.4, gruvboxlight teal `-txt` 10.9 and lane against blue 10.3, solarized teal 10.7). They meet the bar; a later change to a neighbouring hue of those themes can take them under it.

## What a reader sees, before and after (for the look on landing)

The default light theme, the dark theme and the VS Code themes keep `--c-pink` `#ec4899` and `--c-teal` `#0d9488` from `tokens.css` (`grep -n -- '--c-pink:\|--c-teal:' src/lib/themes/tokens.css src/lib/themes/themes.css` prints only `tokens.css:40` and `:48`; `grep -c -- '--c-pink\|--c-teal' src/lib/themes/vscode.css` prints 0).

- Applications view, an application at `interview`: its status chip and its edge were drawn in `c-purple` (`#7c3aed` in the default) and are now drawn in `c-pink` (`#ec4899` in the default, and in a VS Code theme). In each changed pink theme the pink is the new value of the table above; in a theme whose pink did not change (mocha, latte, dracula, solarized, synthwave, flexoki and the others) the interview chip takes that theme's existing pink. An application at `offered` keeps `c-teal`, whose value changes only in the 17 teal blocks.
- Focus board, Job applications column: the Interview stack's edge (`Band.svelte:147` sets `--stage`, `:254` draws `border-left: 3px solid var(--stage, var(--line))`) moves from purple to pink, and its label stays muted (the `.stage` rule, `Band.svelte:240-247`, `color: var(--muted-txt, var(--muted))`). It sits beside Active (green), Applied (cyan) and Offered (teal) (`position_stages`, `vocab.yml:203-206`); in every one of the 49 themes Interview and Offered read apart from each other and from Applied and Active, by the C2 bar.
- Build lane header (Focus board, the `incubate` cluster, `vocab.yml:191`, `#0d9488`, which `palette:` maps to `c-teal`) and the Teaching column header (`focus_lane_tones: teaching: teal`, `vocab.yml:214`): drawn in `--c-teal-lane`, which changes in the 17 teal blocks; the Tasks section's left edge (`Tasks.svelte:185`, `--c-teal`), the domain filter group (`facet_tones: domain: teal`) and the Career view's references bars (`career-view.ts:43`) change with it.
- Career view's profile bars (`career-view.ts:44`, tone `pink`) and the form filter group (`facet_tones: form: pink`) change in the 14 pink blocks.
- Every other user of `--c-teal`, each drawn in the default theme and a VS Code theme in `#0d9488` before and after (neither sets a teal of its own, so both read `tokens.css:40`), and in each theme whose teal changed in the old teal before and the new teal after (the table below):
  - the `released` project stage chip (`config/catalogs/vocab.yml:75`, `#0d9488`) and the `released` category (`:275`);
  - the `strong` venue tier chip (`:302`);
  - the colours that cycle through `HUES` (`src/lib/ui/display/hues.ts:10`, `['blue', 'green', 'amber', 'violet', 'red', 'teal']`): the sixth colour of the calendar (`Calendar.svelte:48`, `:172`) and every sixth lane of the git graph (`graph/Lanes.svelte:37`, `var(--c-${HUES[lane % HUES.length]}-txt)`);
  - the merge editor's current header, current content and overview ruler (`src/lib/ui/controls/editor/kit/theme/colours.ts:521-523`, `--c-teal` at 80, 33 and 80);
  - inbox info items (`src/lib/state/feeds/inbox.ts:67`);
  - the recover view's present state (`src/lib/state/system/machine/recover-words.ts:139`);
  - the session timeline's tool turns (`src/lib/views/shared/sessions/sections/TimelineTurns.svelte:41`);
  - the domain facet (`facet_tones: domain: teal`, `vocab.yml:232`), the Career view's references bars (`career-view.ts:43`) and the Focus Tasks edge (`Tasks.svelte:185`);
  - the Usage view's account tier tag (`src/lib/views/system/machine/usage/Usage.svelte:205`, `tone="teal"`, drawn in `--c-teal-txt` through `Tag.svelte:33`).

  | Theme | Teal before | Teal after |
  | --- | --- | --- |
  | default (light, dark) | #0d9488 | #0d9488 |
  | VS Code themes | #0d9488 | #0d9488 |
  | macchiato | #8bd5ca | #62d6c2 |
  | frappe | #81c8be | #5ccbb6 |
  | everforest | #83c092 | #7ccca0 |
  | flexoki | #3aa99f | #66c9a6 |
  | flexokilight | #24837b | #1b8b60 |
  | gruvboxlight | #427b58 | #06a596 |
  | kanagawadragon | #8ea4a2 | #6cb0a8 |
  | kanagawalotus | #597b75 | #3d8a72 |
  | rosepine | #9ccfd8 | #5ec2b3 |
  | rosepinemoon | #9ccfd8 | #5ec2b3 |
  | rosepinedawn | #56949f | #2f8a7f |
  | nord | #8fbcbb | #6fc2b0 |
  | dracula | #8be9fd | #5ae6c4 |
  | solarized | #2aa198 | #26a67c |
  | onedark | #56b6c2 | #4fc1a6 |
  | synthwave | #36f9f6 | #20c9b4 |
  | oxocarbon | #08bdba | #009d9a |

  The values are the authored `--c-teal` rows of the case-run program's "authored tokens that differ" section; a user drawn through `-txt` or `-lane` takes the value derive.ts derives from them.
- Themes to put the board in: one VS Code theme (no change besides interview purple to pink), gruvboxlight (teal `#06a596`, judgment call 4), oxocarbon (teal `#009d9a`, judgment call 5), rosepine (its base pink equals its orange and its base teal equals its green and sky, all now apart), everforestlight (pink `#ab3560` against the red `#f85552`, `everforest.css:77`), and any other changed theme of the table.

## Re-read of the text that describes the behaviour

- `src/lib/themes/derive.ts:83-89` (`LANE_SHARE`) and the `focus_lanes` sentence at `config/catalogs/vocab.yml:181`: C3 shows that no `-lane` pair with teal-lane or pink-lane on one side that was at 10 or more on the base is under 10 after (`C3 1265 lane pairs read; 0 at 10 or more on the base and under 10 after`). It does not show either comment true over 49 themes: pairs with neither teal nor pink on one side were not measured. Some teal-lane pairs under 10 on the base are at 10 or more after, among them `kanagawadragon` teal-lane against grey-d (6.5 to 13.0) and `kanagawalotus` teal-lane against grey-d (7.2 to 12.8), which are Teaching against Jobs on the open board. The full list, read from the final run's C3 rows (before under 10, after printed 10.0 or more):
  - teal-lane: gruvboxlight cyan, cyan-d; nord cyan, sky (both printed 10.0); oxocarbon cyan, cyan-d; rosepine green, green-d, sky; rosepinemoon green, green-d, lime, sky; rosepinedawn blue, cyan, cyan-d, sky; dracula cyan, cyan-d, sky; macchiato cyan, sky (both printed 10.0); frappe cyan, cyan-d, sky; kanagawadragon blue, cyan, cyan-d, green-d, grey, grey-d, indigo, lime, mauve, purple, sky, slate, violet; kanagawalotus gold, grey, grey-d, slate.
  - pink-lane: gruvbox purple; everforest crimson, red, red-d, red-t; nord purple; tokyolight mauve, purple, violet; oxocarbon crimson, red, red-d, red-t; rosepinedawn orange, rose; onedark crimson, red-d, and red, red-t, rose (the last three printed 10.0).

  A pair printed 10.0 is rounded to one decimal, so whether its unrounded value reaches 10 is not shown by these rows. The named examples of the `vocab.yml:181` comment ("Build and Teaching, which share teal in every theme") hold, and its count "ten of the pairs" is not verified, see the next section.
- Each of the eight theme files' head comment: rewritten (item 3).
- `docs/HELP.md`, `docs/templates.md`: no status colour named (`grep -n -i 'pink\|teal\|interview\|offered\|purple'` over `docs/HELP.md docs/templates.md` hits only commented config examples, the `status` options of a template and the status words of the Awaiting box; `docs/palette.md` names no pink, teal, interview or offered); still true.
- `grep -rn -i '7c3aed' src tests docs README.md config --exclude=local.yml` hits `tokens.css:46` (`--c-purple`), `tokens.css:93` (`--c-graph-remote`), test fixtures with their own colours, `vocab.yml:40` (`palette:`), `vocab.yml:301` (the `flagship` venue tier) and `docs/templates.md` examples; none is the interview colour, so nothing else carries the change.
- History words: `git diff -U0 | grep '^[+-]' | grep -iE "before|used to|no longer|still|always has been|always had|as before|previously|the step adds|after this package|O1[0-9][0-9]|20[0-9][0-9]-"` prints nothing.
- No id, key, export or asynchronous path is added.

## Anything in the brief that was wrong or impossible

- Not verified: the count in `vocab.yml:181`, "ten of the pairs that touch only in such a layout are below 10 under at least one theme". The case-run program's last section shows 8 teal-lane pairs that were under 10 in at least one theme on the base and are at 10 or more in every theme after: teal against gold, grey, grey-d, indigo, mauve, purple, slate and violet. Among them, teal/gold is Teaching against Funding and teal/grey-d Teaching against Jobs (`focus_lane_tones`, `vocab.yml:214`), and teal/grey is Build against Backburner, teal/slate Build against Review and teal/mauve Build against the Idea lane (the lane colours of `vocab.yml:186`, `:188` and `:192`, which `palette:` maps to `c-slate`, `c-grey` and `c-mauve`). If any of those is one of the ten collapsed-layout pairs the comment counts, the count is now too high. The only enumeration of those pairs in the ledger is the 17-theme one of `agents/reviews/Q41-report.md:730-739`; by that list the teal pairs among the ten are build/teaching, scope/teaching (teal/cyan-d, under 10 in 12 themes after), push/teaching (teal/blue, 2 themes after) and run/teaching (teal/green, 4 themes after), all still under 10 in at least one theme, so by that list the count stands. The 49-theme enumeration behind the current sentence is not in the tree, so the sentence is not verified after the change, and the line is outside the step's write list (`vocab.yml` lines 155 and 205 only). A re-run of the collapsed-layout enumeration over the 49 themes settles it.
- The write list's line numbers for the theme files are the base's; the rewrapped head comments are a line longer (three in singles.css), so the token lines moved down by that much (C4 above).
- No other premise of the brief failed: every distance and block list it quotes reproduces in the first run.

## Repair round 1

Every item of `agents/briefs/O140-round-1.md` is done.

1. Spec S1. `src/lib/themes/rice/gruvbox.css:84`, `body.gruvboxlight`'s `--c-teal`, is `#22aba2` (it was `#2cb6ae`). No teal of C 0.08 or more inside Gruvbox Light's L range (43.7 to 61.8) meets the bars. The evidence is the reviewer's probe (`O140-refuter.md`, S1): at L 40 to 62, C 0.08 to 0.20 and hue 150 to 220 the one passing value is `#005725`, a green at h 150, and the darkest passing teal is `#22aba2` at L 67. The case-run program confirms `#22aba2` (`.../scratchpad/o140-builder/run-r1-22aba2.txt`, the same output as the final run below):
   ```
   C2 49 themes; 0 themes hold one; 0 measures under 10; 0 pairs under 10
     teal #427b58 -> #22aba2 L 67.1 C 0.110 h 187.9; nearest hue 20.2 (cyan); -txt #166f69 nearest 10.9 (cyan)
     gruvboxlight teal-lane: ... blue 11.0>10.3, ... sky 11.0>10.3, ...
   C3 1265 lane pairs read; 0 at 10 or more on the base and under 10 after
   ```
   A darker value of the same hue fails C3 (`.../o140-builder/run-r1-20a8a0.txt`):
   ```
   C2 49 themes; 0 themes hold one; 0 measures under 10; 0 pairs under 10
     teal #427b58 -> #20a8a0 L 66.2 C 0.109 h 188.6; nearest hue 19.7 (cyan); -txt #146c66 nearest 10.8 (cyan)
   blue 11.0>9.8 BROKEN
   C3 1265 lane pairs read; 2 at 10 or more on the base and under 10 after
   ```
   The value taken is `#22aba2`. Judgment call 4, the per-block table, the quoted final run and the visible-change section now say so.
2. Spec S2 and Behaviour B2. The section "What a reader sees, before and after" now lists every other user of `--c-teal` with its file and line: the `released` stage and category, the `strong` venue tier, `HUES` with its calendar and git-graph readers, the merge editor's three colours, inbox info items, the recover view's present state, the session timeline's tool turns, the domain facet, the Career references bars and the Focus Tasks edge. Each user is drawn in the before and after teal of the table that follows the list: the default and VS Code themes, and the 17 themes whose teal changed.
3. Proof P1. The "Re-read" section now says what C3 shows and what it does not. No `-lane` pair with teal-lane or pink-lane on one side that was at 10 or more on the base is under 10 after. The section lists the pairs that were under 10 on the base and are at 10 or more after, `kanagawadragon` and `kanagawalotus` teal-lane against grey-d among them. It no longer calls `derive.ts:83-89` or the `vocab.yml:181` sentence true over 49 themes, since pairs with neither teal nor pink on one side were not measured.
4. Proof P2. Judgment call 5 now says Oxocarbon's teal and pink are Carbon's teal 50 and magenta 30 because they are hues of the system Oxocarbon is drawn from. The claim that lighter teals fail C3 is removed.
5. Standards. `src/lib/themes/rice/singles.css:5-12`: the "so" clause now governs the warning hues only. A sentence of its own follows it, "Its own teal and pink, Carbon's teal 40 and magenta 40, are replaced by Carbon's teal 50 and magenta 30, which read apart from its cyan and red." The comment stays one paragraph of 12 lines, filled greedily at 100 columns. Line 8 is exactly 100 columns. `awk 'length($0)>100{print FILENAME": "FNR}' src/lib/themes/rice/*.css` prints nothing.
6. Behaviour B1. The visible-change section now says that the Interview stack's edge (`Band.svelte:147`, `:254`) moves from purple to pink, and that its label stays muted (the `.stage` rule, `Band.svelte:240-247`, `color: var(--muted-txt, var(--muted))`).

### Runs after the last change, from the worktree root

- Brief check 1, the seven test files (`.../o140-builder/r1-verify1.txt`): `Test Files  7 passed (7)`, `Tests  210 passed | 2 skipped (212)`. The two skipped tests are the real-hub cases of `config-folder` (`it.skipIf(!REAL.asked)`, `config-folder.test.ts:643`, `:819`).
- Brief check 2, `npm run diagrams`: exit 0. `git status --short` afterwards lists the same nine modified files, plus the untracked round brief, the review and this report. `npm run test:quick`, run once (`.../o140-builder/r1-quick.txt`):
  ```
  ok      prettier (0.8 s): All matched files use Prettier code style!
  ok      ASCII gate (0.9 s)
  ok      svelte-kit sync (2.3 s)
  ok      svelte-check (9.2 s): 1793746034622 COMPLETED 581 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS
  ok      vitest (25.0 s): Duration  14.21s (transform 1.72s, setup 0ms, import 3.31s, tests 10.78s, environment 0ms)
  ok      vitest checks (45.9 s): Duration  35.01s (transform 14.98s, setup 0ms, import 29.26s, tests 50.17s, environment 2ms)
  test:quick: 48.3 s; every command passed
  ```
- Brief check 3: `LC_ALL=C perl -ne 'print "$ARGV:$.: $_" if /[^\x20-\x7E\n]/; close ARGV if eof' config/catalogs/vocab.yml src/lib/themes/rice/*.css` printed nothing (exit 0).
- Brief check 4: `python3 -c "import yaml; yaml.safe_load(open('config/catalogs/vocab.yml'))"` exit 0.
- Brief check 5, the case-run program (`.../o140-builder/run-r1-final.txt`, 280 lines). `diff` against the earlier final run (`run-final.txt`) shows only the gruvboxlight teal lines (126, 141) and the gruvboxlight lane rows (208, 209). Its result lines:
  ```
  C2 49 themes; 0 themes hold one; 0 measures under 10; 0 pairs under 10
  themes whose pink or teal changed: 23
  C3 1265 lane pairs read; 0 at 10 or more on the base and under 10 after
  8 pairs under 10 in some theme on the base are at 10 or more in every theme after
  ```
- The unused-exports compare: `diff <(sh utils/unused-exports.sh) ../O140-base/unused-exports.txt` exit 0, no difference.
- The history-word grep over `git diff -U0` printed nothing (exit 1).

No check came back red. No test was added or changed, and no program other than the case-run program was written.

### Files with line counts after the round

The round changed two files of the worktree besides this report. The nine-file table above stands with the same counts:
- `src/lib/themes/rice/gruvbox.css`: 113 lines on the base, 114 now, +7/-6 against the base.
- `src/lib/themes/rice/singles.css`: 357 lines on the base, 360 now, +21/-18 against the base. Its hunks are the same as before: `1,9c1,12`, then one `--c-pink`/`--c-teal` line per hunk.

`git diff --stat`: `9 files changed, 75 insertions(+), 65 deletions(-)`.
