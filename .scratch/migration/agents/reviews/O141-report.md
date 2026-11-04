# O141 builder report: handed back at item 3

NOT done: items 3 and 4, and cases C2 to C5 after a change. Seven pairs of headers that touch in the open layout are under 10 on the unchanged tree. The brief's three bars allow no recolour that fixes any one of them, so under item 3 ("If no palette tone meets the three bars for a pair, hand the pair back with the run before writing anything") I wrote nothing. Item 4 rewrites the comments to the final run, which needs item 3 settled first. No file of the worktree is changed apart from this report (`diff -rq` over `src tests utils config` against the base copy prints nothing).

## Open items of the state file, verbatim

`.scratch/migration/orchestrator-state.md:171-175`: the section "Open items (only what Axel must rule on; ...)" holds no entry. Its text is only the heading and the line "An entry leaves this list for the closed log the moment Axel rules on it. What a review or a look found and no brief covered is not an open item: it is folded into an existing step in `plan.md` (Z468), never booked as a step of its own."

## What is handed back, and why

The case-run program on the unchanged tree (run A below) finds 7 open-layout pairs under 10 in at least one theme:

| Pair | Themes under 10 |
| --- | --- |
| Funding-Jobs | kanagawalotus 4.9 |
| Funding-Run | kanagawalotus 5.7, solarized 8.9, gruvboxlight 9.3 |
| Jobs-Push | dracula 0.0, nord 6.5, kanagawadragon 7.2, vscode-tomorrow-night-blue 8.3, frappe 8.9 |
| Run-Push | rosepinedawn 6.9 |
| Run-Review | kanagawalotus 7.9 |
| Review-Scope | vscode-solarized-dark 6.8, kanagawadragon 7.2, kanagawalotus 7.7, vscode-tomorrow-night-blue 8.3, vscode-abyss 9.9 |
| Scope-Idea | kanagawadragon 6.2 |

Under item 3 only one of a pair's two headers may be recoloured, so the headers that may change are Funding, Jobs, Run, Push, Review, Scope and Idea. The search (run B) tries every set of these headers that holds one header of every failing pair, 31 sets of any size, and every assignment of a new tone. The candidates are the 29 `c-` tones of `palette:` whose `-lane` token exists in all 49 themes. **No assignment of any size meets the three bars** (`--- 0 assignments of N headers meet the three bars` for N = 1 to 7). Taken one at a time, no failing pair can be fixed either: with every other failing pair allowed to keep its base distance, each of the seven prints `0 assignments`.

The block for Funding-Jobs shows why, from run B's per-header lines:
- Funding cannot change. Each of its 28 other tones breaks bar 2 against a header that item 3 does not let me recolour: Blocked (crimson, indigo, magenta, mauve, pink, purple, red, red-s, rose, violet), Revise (amber, brass, honey, orange, red-d, red-t), Teaching (blue, cyan, cyan-d, green, green-d, lime, sky, teal) or Backburner (amber-s, grey, grey-d, slate). For example: `crimson: open under 10 []; bar 2 breaks [Funding-Blocked 48, Funding-Idea 1]`.
- With Funding left gold, every Jobs tone either leaves Funding-Jobs under 10 (`amber-s: open under 10 [Funding-Jobs 1, Jobs-Push 1]; bar 2 breaks []`, `slate: ... [Funding-Jobs 1, ...]`, `grey: ... [Funding-Jobs 1, ...]`, `orange: ... [Funding-Jobs 6]`) or breaks bar 2 against Blocked or Build (`crimson: open under 10 []; bar 2 breaks [Jobs-Blocked 48, Jobs-Idea 1]`, `red-s: ... bar 2 breaks [Jobs-Blocked 1]`, `teal: ... [Jobs-Build 49]`).

Bar 2 is what blocks, and its "an under-10 pair may not get closer" clause is not the only part that does:
- Run C uses a weaker bar 2 for information only: a collapsed-only pair at 10 or more stays at 10 or more, and the count does not grow. It also finds 0 assignments of every size.
- Run D drops bars 2 and 3 and keeps bar 1 alone, over the smallest sets (3 headers). It finds 36 assignments, every one of them Jobs and Run moved into the red family (crimson, pink, red, red-d, red-t, rose) and Scope cyan-d to teal (`Jobs grey-d->crimson, Run green->crimson, Scope cyan-d->teal; smallest open distance 10.1 (Review-Scope phosphor)`).
- Run B shows that each of these 36 breaks bar 2: Scope teal gives `bar 2 breaks [Teaching-Scope 49, Run-Scope 3]`, and Jobs and Run in reds break against Blocked.

Some failures come from the theme blocks themselves. dracula gives `--c-blue`, `--c-slate` and `--c-grey` the same value, `#6272a4` (`src/lib/themes/rice/singles.css:97,106,107`), and run A measures Jobs-Push (grey-d against blue) at 0.0 there. kanagawalotus puts gold and grey-d 4.9 apart. Under decision 3 of the brief no theme token may change, and `src/lib/themes/` is outside the paths list.

What the orchestrator or Axel decides (my judgment on each option, nothing chosen):
1. Fix the cause in the theme blocks: a step whose paths include the rice and VS Code theme sheets, which separates the aliased hues (dracula's blue, slate, grey and grey-d, kanagawalotus's gold and grey-d, and the others in the table) until the open pairs reach 10, then re-runs this program. This ends the cause, and it is the option I recommend. Its cost is a change to authored theme colours, which a look has to read in each theme it touches.
2. Recolour under bar 1 alone (one of run D's 36 assignments). This needs a ruling that drops bar 2. It puts Jobs and Run in the red family beside Blocked and Scope in the same teal as Teaching and Build, so collapsed layouts get pairs at 0.0. I do not recommend it.
3. Rewrite the three comments to the measured state (7 open-layout pairs under 10, 19 collapsed-only pairs under 10) and change no colour. This is the lazy option: the comments become true and the headers stay too close.

## The cases' first run, on the unchanged tree

- C1. Run A: `C1/C2 open pairs under 10 in at least one theme: 7` and `C1 collapsed-only pairs under 10 in at least one theme: 19`, with every pair, its smallest distance and every theme under 10 listed (quoted below). 128 layouts, 20 open-layout pairs, 37 collapsed-only pairs.
- C2. Run A on the unchanged tree prints 7 open-layout pairs under 10, which the bar requires to be 0 after a change. No change was made, so C2 after a change is not run.
- C3. Run A, base against worktree with identical trees: `C3 1813 collapsed-only measures read; 0 break item 3's second bar; collapsed-only pairs under 10: base 19, worktree 19`. Holds trivially; no change was made.
- C4. A read of the current sentences against run A. `vocab.yml:181` says the open-layout pairs differ by 10 or more under every theme, which is false (7 pairs, table above). It says "ten of the pairs that touch only in such a layout are below 10", and run A counts 19. Of the pairs it names, these hold: Build and Teaching (teal in every theme: `Teaching-Build: min 0.0 (light); under 10 in 49`), Backburner and Jobs (`Jobs-Backburner: ... under 10 in 49`, 0.0 in 25 themes), Funding and Revise (`under 10 in 41`), and Blocked above the Idea lane in mocha and everforest (`Blocked-Idea: min 6.0 (mocha); under 10 in 2: mocha 6.0, everforest 9.6`). The doc at `derive.ts:83-89` makes the same false open-layout claim. `vocab.yml:213` says "follow the Idea lane above them", which is false as the brief says: the band is drawn above the lanes (`config/defaults/behavior.yml:50`). None of the three is rewritten (item 4 not done).
- C5. `diff` of `config/catalogs/vocab.yml` and of `src/lib/themes/derive.ts` against the base copy prints nothing (exit 0 each).
- C6. `npx vitest run tests/checks/look/contrast.test.ts tests/data/shapes/catalog-files/vocab.test.ts tests/checks/config/config-folder.test.ts --reporter=dot`: `Test Files  3 passed (3)`, `Tests  108 passed | 2 skipped (110)`.
- C7. Run A's chosen layouts. Band Funding Jobs with every cluster open: `Funding-Run, Funding-Push, Jobs-Push, Jobs-Revise` among the touching pairs, so the left band header meets now columns 1 and 2 and the right meets columns 2 and 3. Band Funding alone: `Funding-Run, Funding-Push, Funding-Revise`. Band Jobs Teaching and band Funding Teaching are printed alike.
- C8. Band of three with every cluster folded: `touching: Funding-Jobs, Jobs-Teaching, Funding-Idea, Jobs-Idea, Teaching-Idea`. Band Jobs alone with every cluster folded: `touching: Jobs-Idea`.
- C9. `Band.svelte:141` draws a column when `stages.length + gone > 0`, so a column whose cards the filter hid is drawn. The program models each column as drawn or not drawn, independent of why: `C9 layouts in which Funding is drawn: 64 of 128` (Jobs and Teaching alike), and no layout treats a drawn column as missing.
- C10. Run A's tone table: every lane hex maps through `palette:` to a `c-` tone and no lane maps to `muted`. Each band value is a tone name the palette holds (`Funding: gold -> c-gold -> gold; --c-gold-lane in 49 of 49`, `Jobs: grey-d -> c-grey-d -> grey-d`, `Teaching: teal -> c-teal -> teal`). Every one of the 13 headers has its `-lane` token in 49 of 49 themes.

## DONE / NOT DONE

| Deliverable | State | Proof |
| --- | --- | --- |
| Item 1, layout model confirmed | DONE | Read of `Focus.svelte`, `Band.svelte`, `Lanes.svelte`, `GroupHead.svelte`, `behavior.yml:50` (section below) |
| Item 2, case-run program | DONE | `npx tsx <scratch>/case-run.mts`: exit 0, last line `open-layout measures that moved: 0` |
| Item 3, recolour | NOT DONE, handed back | Run B: `--- 0 assignments of 7 headers meet the three bars` |
| Item 4, comment rewrite | NOT DONE, waits on item 3 | no edit; `diff` of both files against the base prints nothing |
| Verify 1, three test files | passes on the unchanged tree | `Tests  108 passed | 2 skipped (110)` |
| Verify 2, `npm run diagrams` and `npm run test:quick` | NOT RUN | the step changed no file, so the list has nothing of the step's to check |
| Verify 3, ASCII perl over the two files | prints nothing | `perl exit 0`, no output |
| Verify 4, `yaml.safe_load` | exit 0 | `yaml exit 0` |
| Verify 5, C2 and C3 after the last change | NOT DONE | no change was made |

Runs of the list: 0. Whole-suite commands: none. `sh utils/unused-exports.sh`: not run, since no source file changed. Tests added or changed: none.

## The cases after the change

None: no change was made.

## The layout model as confirmed

Item 1's model holds against the code:
- Section order: `config/defaults/behavior.yml:50` `sections: [command_center, tasks, quick_add, awaiting, band, lanes]`, drawn in that order by `Focus.svelte:314-396`, so the band comes directly above the lanes.
- Band: three columns drawn by one snippet in the order Funding, Jobs, Teaching (`Band.svelte:164-189`). A column is drawn when `stages.length + gone > 0` (`:141`). The band itself is drawn only when `anything` (`:160`) and folds as a whole (`:161`, key `band`). Grid `repeat(auto-fit, minmax(min(290px, 100%), 1fr))` with `gap: 8px` (`:197-201`). auto-fit collapses empty tracks, so k drawn columns split the width into k.
- Clusters: `Lanes.svelte:267-306` draws the `focus_clusters` in order (`clusters`, `state/boards/focus.ts:103`). The lanes of a `columns` cluster go in `focus_lanes` order (`lanesIn`, `focus.ts:752`) in the same auto-fit grid (`Lanes.svelte:311-315`), so 3 lanes split the width into 3. The `full_width` cluster's lane gets a grid of its own, `.lanes.one`, one column (`:317-319`).
- Folding: a folded group's body is `hidden="until-found"` (`GroupHead.svelte:173`), so a folded cluster draws no lane header.
- Header surface: `LaneHead.svelte:40,67` paints `--c-<tone>-lane`. Lane tones come from `toneOf(row.color)` (`focus.ts:290`) and band tones from `namedTone` (`Band.svelte:83-87`, `tones.ts:207-212`).

Pairs, from run A: 20 open-layout pairs and 37 collapsed-only pairs (each listed in run A with its smallest distance). Open: Funding-Jobs, Funding-Run, Jobs-Teaching, Jobs-Push, Teaching-Revise, Run-Push, Run-Review, Push-Revise, Push-Blocked, Revise-Backburner, Review-Blocked, Review-Scope, Blocked-Backburner, Blocked-De-risk, Backburner-Build, Scope-De-risk, Scope-Idea, De-risk-Build, De-risk-Idea, Build-Idea.

## The case-run program and every run

Source: `/private/tmp/claude-502/-Users-axelfaes-workspace-research-hub/be0ac0d7-a551-4911-a072-9f76e1bbe399/scratchpad/o141-builder/case-run.mts`, 508 lines. It reads the base copy and the worktree, imports `parse.ts` and `derive.ts` from the worktree for both trees (the step changes no code in either), and prints only. The modes:
- No argument: C1, C3, C7 to C10.
- `--search`: the joint search under the brief's bars, the per-header listing and the per-pair search.
- `--search --cross-only` and `--search --open-only`: informational searches under weaker bars. They are labelled in their output as not the brief's bars, and the open-only run reads only the smallest sets of headers, so its lines for 4 to 7 headers say nothing.
- `--candidates <key>`: one header at a time against the base.

Every output is in the same folder: `A-plain.txt` (174 lines), `B-search.txt` (403), `C-cross-only.txt` (403), `D-open-only.txt` (428), `E-candidates.txt` (224, the seven headers; `grep -c "MEETS ALL"` prints 0). The first 174 lines of B equal A (`diff` printed nothing). Run from the worktree root with `PATH=/Users/axelfaes/.nvm/versions/node/v24.21.0/bin:$PATH npx tsx <source> [mode] > <file>`; every run exited 0.

```ts
// O141 case-run program. Reads the theme sheets, config/defaults/appearance.yml and
// config/catalogs/vocab.yml of the base copy and of the worktree, resolves the 49 themes through
// parseBlocks, resolveTheme and deriveTokens, builds every Focus layout of the three-column model
// (band columns drawn or not, each columns cluster and each full-width lane folded or not), and
// measures every pair of headers that touches in a layout on their -lane surfaces with culori's
// differenceCiede2000. Prints only; writes nothing.
// Run from the worktree root: npx tsx <this file> [--candidates <header key>]

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const WT = process.cwd();
const BASE = '/Users/axelfaes/workspace/oculus/.agents/worktrees/O141-base';

const { parseBlocks, resolveTheme } = await import(join(WT, 'src/lib/themes/parse.ts'));
const { deriveTokens } = await import(join(WT, 'src/lib/themes/derive.ts'));
const culori = await import(join(WT, 'node_modules/culori/src/index.js'));
const YAML = await import(join(WT, 'node_modules/yaml/dist/index.js'));

const de = culori.differenceCiede2000();
const LINE = 10;
const UNKNOWN_TONE = 'grey';
const TONE = /^[a-z][a-z0-9-]*$/;
const BAND = ['funding', 'jobs', 'teaching'] as const;
const BAND_LABEL: Record<string, string> = { funding: 'Funding', jobs: 'Jobs', teaching: 'Teaching' };

type Header = { id: string; label: string; written: string; token: string; tone: string };
type Row = { kind: string; headers: string[] };
type Tree = {
    names: string[];
    tokens: Record<string, Record<string, string>>;
    vocab: any;
    headers: Record<string, Header>;
    order: string[];
    clusterRows: { key: string; lanes: string[] }[];
    wideLanes: string[];
};

function load(root: string): Tree {
    const dir = join(root, 'src/lib/themes');
    const sheets = [
        readFileSync(join(dir, 'tokens.css'), 'utf8'),
        readFileSync(join(dir, 'themes.css'), 'utf8'),
        ...readdirSync(join(dir, 'rice'))
            .filter((n) => n.endsWith('.css'))
            .sort()
            .map((n) => readFileSync(join(dir, 'rice', n), 'utf8')),
        readFileSync(join(dir, 'vscode.css'), 'utf8')
    ].join('\n');
    const blocks = parseBlocks(sheets);
    const rows = YAML.parse(readFileSync(join(root, 'config/defaults/appearance.yml'), 'utf8')).themes;
    const vocab = YAML.parse(readFileSync(join(root, 'config/catalogs/vocab.yml'), 'utf8'));
    const palette: Record<string, string> = vocab.palette;
    const tree: Tree = { names: [], tokens: {}, vocab, headers: {}, order: [], clusterRows: [], wideLanes: [] };
    for (const row of rows) {
        const classes: string = row.class ?? '';
        for (const word of classes.split(/\s+/).filter((w) => w !== '')) {
            if (!(word in blocks)) throw new Error(`${row.name}: class ${word} has no block`);
        }
        const theme = resolveTheme(blocks, classes);
        tree.names.push(row.name);
        tree.tokens[row.name] = { ...theme, ...deriveTokens(theme) };
    }
    // tones.ts toneOf: palette maps the hex (trimmed, lower case) to a token; a c- token's hue is
    // the tone, anything else the unknown tone.
    for (const lane of vocab.focus_lanes) {
        const token = palette[String(lane.color).trim().toLowerCase()] ?? '(not in palette)';
        const tone = token.startsWith('c-') && TONE.test(token.slice(2)) ? token.slice(2) : UNKNOWN_TONE;
        tree.headers[lane.key] = { id: lane.key, label: lane.label, written: lane.color, token, tone };
    }
    // tones.ts namedTone: a tone name whose c-<name> the palette holds, the unknown tone otherwise.
    for (const key of BAND) {
        const name = String(vocab.focus_lane_tones[key] ?? '').trim();
        const held = TONE.test(name) && Object.values(palette).includes(`c-${name}`);
        tree.headers[key] = {
            id: key,
            label: BAND_LABEL[key],
            written: name,
            token: held ? `c-${name}` : '(not held by the palette)',
            tone: held ? name : UNKNOWN_TONE
        };
    }
    for (const cluster of vocab.focus_clusters) {
        const lanes = vocab.focus_lanes.filter((l: any) => l.cluster === cluster.key).map((l: any) => l.key);
        if (cluster.layout === 'columns') tree.clusterRows.push({ key: cluster.key, lanes });
        else tree.wideLanes.push(...lanes);
    }
    tree.order = [...BAND, ...vocab.focus_lanes.map((l: any) => l.key)];
    return tree;
}

/** The rows a layout draws, top to bottom: the band, then the clusters, then the full-width lanes. */
function layoutRows(tree: Tree, band: string[], foldedClusters: Set<string>, foldedWide: Set<string>): Row[] {
    const rows: Row[] = [];
    if (band.length > 0) rows.push({ kind: 'band', headers: band });
    for (const c of tree.clusterRows) if (!foldedClusters.has(c.key)) rows.push({ kind: c.key, headers: c.lanes });
    for (const w of tree.wideLanes) if (!foldedWide.has(w)) rows.push({ kind: `wide:${w}`, headers: [w] });
    return rows;
}

const pairKey = (a: string, b: string, order: string[]): string =>
    order.indexOf(a) < order.indexOf(b) ? `${a}|${b}` : `${b}|${a}`;

/**
 * The touching pairs of a layout. In a row of n headers, header i spans [i/n, (i+1)/n] of the width;
 * neighbours in a row touch, and headers of consecutive drawn rows touch when their spans overlap
 * by more than a shared edge (the grids keep an 8 px gap). Compared in integers: [i/n,(i+1)/n] and
 * [j/m,(j+1)/m] overlap when i*m < (j+1)*n and j*n < (i+1)*m.
 */
function touching(rows: Row[], order: string[]): Set<string> {
    const out = new Set<string>();
    for (const row of rows) {
        for (let i = 0; i + 1 < row.headers.length; i += 1) out.add(pairKey(row.headers[i], row.headers[i + 1], order));
    }
    for (let r = 0; r + 1 < rows.length; r += 1) {
        const up = rows[r].headers;
        const down = rows[r + 1].headers;
        const n = up.length;
        const m = down.length;
        for (let i = 0; i < n; i += 1) {
            for (let j = 0; j < m; j += 1) {
                if (i * m < (j + 1) * n && j * n < (i + 1) * m) out.add(pairKey(up[i], down[j], order));
            }
        }
    }
    return out;
}

function subsets<T>(items: readonly T[]): T[][] {
    const out: T[][] = [];
    for (let mask = 0; mask < 1 << items.length; mask += 1) out.push(items.filter((_, i) => mask & (1 << i)));
    return out;
}

type Layout = { band: string[]; folded: string[]; rows: Row[]; pairs: Set<string> };

function layouts(tree: Tree): Layout[] {
    const out: Layout[] = [];
    const foldables = [...tree.clusterRows.map((c) => c.key), ...tree.wideLanes.map((w) => `wide:${w}`)];
    for (const band of subsets(BAND)) {
        for (const folded of subsets(foldables)) {
            const clusters = new Set(folded.filter((f) => !f.startsWith('wide:')));
            const wide = new Set(folded.filter((f) => f.startsWith('wide:')).map((f) => f.slice(5)));
            const rows = layoutRows(tree, band, clusters, wide);
            out.push({ band, folded, rows, pairs: touching(rows, tree.order) });
        }
    }
    return out;
}

const f = (n: number): string => (Number.isNaN(n) ? 'MISSING' : n.toFixed(1));

function distance(tree: Tree, theme: string, a: string, b: string): number {
    const t = tree.tokens[theme];
    const x = t[`--c-${tree.headers[a].tone}-lane`];
    const y = t[`--c-${tree.headers[b].tone}-lane`];
    return x && y ? de(x, y) : NaN;
}

const name = (tree: Tree, pair: string): string =>
    pair
        .split('|')
        .map((h) => tree.headers[h].label)
        .join('-');

function classify(tree: Tree): { open: string[]; collapsed: string[]; all: Layout[] } {
    const all = layouts(tree);
    const openLayout = all.find((l) => l.band.length === 3 && l.folded.length === 0)!;
    const open = [...openLayout.pairs];
    const union = new Set<string>();
    for (const l of all) for (const p of l.pairs) union.add(p);
    const collapsed = [...union].filter((p) => !openLayout.pairs.has(p));
    const byOrder = (p: string, q: string): number => {
        const [a1, b1] = p.split('|').map((h) => tree.order.indexOf(h));
        const [a2, b2] = q.split('|').map((h) => tree.order.indexOf(h));
        return a1 - a2 || b1 - b2;
    };
    return { open: open.sort(byOrder), collapsed: collapsed.sort(byOrder), all };
}

function under(tree: Tree, pair: string): { theme: string; dist: number }[] {
    const [a, b] = pair.split('|');
    return tree.names
        .map((theme) => ({ theme, dist: distance(tree, theme, a, b) }))
        .filter((x) => !(x.dist >= LINE))
        .sort((p, q) => p.dist - q.dist);
}

function smallest(tree: Tree, pair: string): { theme: string; dist: number } {
    const [a, b] = pair.split('|');
    let best = { theme: '', dist: Infinity };
    for (const theme of tree.names) {
        const dist = distance(tree, theme, a, b);
        if (Number.isNaN(dist)) return { theme, dist };
        if (dist < best.dist) best = { theme, dist };
    }
    return best;
}

function report(label: string, tree: Tree): void {
    console.log(`=== ${label}: ${tree.names.length} themes`);
    console.log('C10 the tone each header resolves to (written value -> palette token -> tone; the -lane token present in how many themes):');
    for (const id of tree.order) {
        const h = tree.headers[id];
        const present = tree.names.filter((n) => tree.tokens[n][`--c-${h.tone}-lane`] !== undefined).length;
        console.log(`  ${h.label}: ${h.written} -> ${h.token} -> ${h.tone}; --c-${h.tone}-lane in ${present} of ${tree.names.length}`);
    }
    const { open, collapsed, all } = classify(tree);
    console.log(`layouts built: ${all.length}; open-layout pairs: ${open.length}; collapsed-only pairs: ${collapsed.length}`);
    for (const [kind, list] of [['open', open], ['collapsed-only', collapsed]] as const) {
        console.log(`--- ${kind} pairs, smallest distance over the 49 themes, and every theme under 10:`);
        let count = 0;
        for (const pair of list) {
            const low = smallest(tree, pair);
            const hits = under(tree, pair);
            if (hits.length > 0) count += 1;
            console.log(
                `  ${name(tree, pair)}: min ${f(low.dist)} (${low.theme})${hits.length > 0 ? `; under 10 in ${hits.length}: ${hits.map((x) => `${x.theme} ${f(x.dist)}`).join(', ')}` : ''}`
            );
        }
        console.log(`${kind === 'open' ? 'C1/C2' : 'C1'} ${kind} pairs under 10 in at least one theme: ${count}`);
    }
}

function show(tree: Tree, label: string, l: Layout): void {
    const rows = l.rows.map((r) => `[${r.headers.map((h) => tree.headers[h].label).join(' ')}]`).join(' / ');
    console.log(`  ${label}: rows ${rows}`);
    console.log(`    touching: ${[...l.pairs].map((p) => name(tree, p)).join(', ')}`);
}

const base = load(BASE);
const wt = load(WT);

report('base', base);
report('worktree', wt);

console.log('=== C7, C8, C9: chosen layouts of the worktree model');
const all = layouts(wt);
const pick = (band: string[], folded: string[]): Layout =>
    all.find((l) => l.band.join() === band.join() && l.folded.slice().sort().join() === folded.slice().sort().join())!;
show(wt, 'C7 band Funding Jobs, every cluster open', pick(['funding', 'jobs'], []));
show(wt, 'C7 band Jobs Teaching, every cluster open', pick(['jobs', 'teaching'], []));
show(wt, 'C7 band Funding Teaching, every cluster open', pick(['funding', 'teaching'], []));
show(wt, 'C7 band Funding alone, every cluster open', pick(['funding'], []));
show(wt, 'C8 band of three, every cluster folded', pick(['funding', 'jobs', 'teaching'], ['now', 'parked', 'incubate']));
show(wt, 'C8 band Jobs alone, every cluster folded', pick(['jobs'], ['now', 'parked', 'incubate']));
for (const col of BAND) {
    const holding = all.filter((l) => l.band.includes(col)).length;
    console.log(`C9 layouts in which ${BAND_LABEL[col]} is drawn: ${holding} of ${all.length}`);
}
const ideaFold = all.filter((l) => l.folded.some((x) => x.startsWith('wide:')));
const withoutIdeaFold = new Set<string>();
for (const l of all) if (!l.folded.some((x) => x.startsWith('wide:'))) for (const p of l.pairs) withoutIdeaFold.add(p);
const onlyByIdeaFold = new Set<string>();
for (const l of ideaFold) for (const p of l.pairs) if (!withoutIdeaFold.has(p)) onlyByIdeaFold.add(p);
console.log(`pairs that only a folded Idea lane brings together: ${onlyByIdeaFold.size}`);

console.log('=== C3: every pair other than the open-layout ones, base -> worktree, in each theme');
{
    const { open, collapsed } = classify(wt);
    let read = 0;
    let broken = 0;
    for (const pair of collapsed) {
        const [a, b] = pair.split('|');
        for (const theme of wt.names) {
            const before = distance(base, theme, a, b);
            const after = distance(wt, theme, a, b);
            read += 1;
            const bad = before >= LINE ? !(after >= LINE) : !(after >= before);
            if (bad) {
                broken += 1;
                console.log(`  FAILS ${name(wt, pair)} ${theme}: ${f(before)} -> ${f(after)}`);
            }
            if (f(before) !== f(after)) console.log(`  moved ${name(wt, pair)} ${theme}: ${f(before)} -> ${f(after)}`);
        }
    }
    const count = (tree: Tree): number => collapsed.filter((p) => under(tree, p).length > 0).length;
    console.log(`C3 ${read} collapsed-only measures read; ${broken} break item 3's second bar; collapsed-only pairs under 10: base ${count(base)}, worktree ${count(wt)}`);
    let openMoved = 0;
    for (const pair of open) {
        const [a, b] = pair.split('|');
        for (const theme of wt.names) {
            const before = distance(base, theme, a, b);
            const after = distance(wt, theme, a, b);
            if (f(before) !== f(after)) {
                openMoved += 1;
                console.log(`  open moved ${name(wt, pair)} ${theme}: ${f(before)} -> ${f(after)}`);
            }
        }
    }
    console.log(`open-layout measures that moved: ${openMoved}`);
}

// The joint search of item 3, on the base: every set of headers that holds one header of each
// open-layout pair under 10 (each such pair needs one of its two headers recoloured, since the
// tones are fixed per theme), of any size, and for each set every assignment of a new tone
// from the palette's c- tones present in all 49 themes, kept when the three bars hold. Bar 3
// follows from bar 2 (no pair crosses the 10 line downward), and is checked anyway.
if (process.argv.includes('--search')) {
    const palette: Record<string, string> = base.vocab.palette;
    const tones = [...new Set(Object.values(palette).filter((v) => v.startsWith('c-')).map((v) => v.slice(2)))]
        .filter((tone) => base.names.every((n) => base.tokens[n][`--c-${tone}-lane`] !== undefined))
        .sort();
    console.log(`=== search: ${tones.length} tones present in every theme: ${tones.join(' ')}`);
    const cache = new Map<string, number>();
    const dt = (theme: string, x: string, y: string): number => {
        const key = `${theme}|${x}|${y}`;
        let v = cache.get(key);
        if (v === undefined) {
            const t = base.tokens[theme];
            v = de(t[`--c-${x}-lane`], t[`--c-${y}-lane`]);
            cache.set(key, v);
        }
        return v;
    };
    const { open, collapsed } = classify(base);
    const failing = open.filter((p) => under(base, p).length > 0).map((p) => p.split('|'));
    const pool = [...new Set(failing.flat())].sort((a, b) => base.order.indexOf(a) - base.order.indexOf(b));
    const covers = subsets(pool).filter((s) => failing.every(([a, b]) => s.includes(a) || s.includes(b)));
    const minSize = Math.min(...covers.map((s) => s.length));
    console.log(`headers of the failing pairs: ${pool.map((h) => base.headers[h].label).join(' ')}; covers of any size: ${covers.length}; smallest ${minSize}`);
    const baseDist = new Map<string, number>();
    for (const p of [...open, ...collapsed]) {
        const [a, b] = p.split('|');
        for (const theme of base.names) baseDist.set(`${p}|${theme}`, distance(base, theme, a, b));
    }
    const openSet = new Set(open);
    // --cross-only is not item 3's second bar: it measures, for the hand-back, what a bar that only
    // keeps a pair at 10 or more from falling under 10 (and the count from growing) would allow.
    const CROSS_ONLY = process.argv.includes('--cross-only');
    // --open-only drops bars 2 and 3 altogether, for the same purpose: whether recolouring the
    // headers of the failing pairs can put every open-layout pair at 10 or more at all.
    const OPEN_ONLY = process.argv.includes('--open-only');
    const baseCollapsedCount = collapsed.filter((p) => under(base, p).length > 0).length;
    console.log(`joint search bar 2: ${OPEN_ONLY ? 'NONE, bar 1 alone (not the brief bars; information for the hand-back)' : CROSS_ONLY ?'CROSS-ONLY (not the brief bar; information for the hand-back)' : "item 3's second bar as the brief gives it"}`);
    type Found = { cover: string[]; tones: Record<string, string>; worstOpen: number; worstPair: string };
    const found: Found[] = [];
    // Without bar 2 nothing prunes the search, so the open-only run reads the smallest covers.
    for (const cover of OPEN_ONLY ? covers.filter((s) => s.length === minSize) : covers) {
        const assign: Record<string, string> = {};
        const toneOfHeader = (h: string): string | undefined => (cover.includes(h) ? assign[h] : base.headers[h].tone);
        const okPair = (p: string): boolean => {
            const [a, b] = p.split('|');
            const x = toneOfHeader(a);
            const y = toneOfHeader(b);
            if (x === undefined || y === undefined) return true;
            for (const theme of base.names) {
                const after = dt(theme, x, y);
                if (openSet.has(p)) {
                    if (!(after >= LINE)) return false;
                } else if (!OPEN_ONLY) {
                    const before = baseDist.get(`${p}|${theme}`)!;
                    if (before >= LINE ? !(after >= LINE) : CROSS_ONLY ? false : !(after >= before)) return false;
                }
            }
            return true;
        };
        const touched = (h: string): string[] => [...open, ...collapsed].filter((p) => p.split('|').includes(h));
        const step = (i: number): void => {
            if (i === cover.length) {
                if (CROSS_ONLY) {
                    const left = collapsed.filter((p) => {
                        const [a, b] = p.split('|');
                        return base.names.some((theme) => !(dt(theme, toneOfHeader(a)!, toneOfHeader(b)!) >= LINE));
                    }).length;
                    if (left > baseCollapsedCount) return;
                }
                let worstOpen = Infinity;
                let worstPair = '';
                for (const p of open) {
                    const [a, b] = p.split('|');
                    for (const theme of base.names) {
                        const v = dt(theme, toneOfHeader(a)!, toneOfHeader(b)!);
                        if (v < worstOpen) {
                            worstOpen = v;
                            worstPair = `${name(base, p)} ${theme}`;
                        }
                    }
                }
                found.push({ cover, tones: { ...assign }, worstOpen, worstPair });
                return;
            }
            const h = cover[i];
            for (const tone of tones) {
                if (tone === base.headers[h].tone) continue;
                assign[h] = tone;
                if (touched(h).every(okPair)) step(i + 1);
                delete assign[h];
            }
        };
        step(0);
    }
    // What stops each header alone: every tone it could take with every other header unchanged,
    // the open-layout pairs of that header left under 10 and the pairs of that header whose
    // distance would break bar 2, each with the number of themes it breaks in.
    console.log('--- each failing header alone, every other header unchanged');
    for (const h of pool) {
        console.log(`  ${base.headers[h].label} (now ${base.headers[h].tone}):`);
        let clean = 0;
        for (const tone of tones) {
            if (tone === base.headers[h].tone) continue;
            const openLeft: string[] = [];
            const breaks: string[] = [];
            for (const p of [...open, ...collapsed]) {
                const [a, b] = p.split('|');
                if (a !== h && b !== h) continue;
                const other = a === h ? b : a;
                let n = 0;
                for (const theme of base.names) {
                    const after = dt(theme, tone, base.headers[other].tone);
                    const before = baseDist.get(`${p}|${theme}`)!;
                    if (openSet.has(p) ? !(after >= LINE) : before >= LINE ? !(after >= LINE) : !(after >= before)) n += 1;
                }
                if (n > 0) (openSet.has(p) ? openLeft : breaks).push(`${name(base, p)} ${n}`);
            }
            if (openLeft.length === 0 && breaks.length === 0) clean += 1;
            console.log(`    ${tone}: open under 10 [${openLeft.join(', ')}]; bar 2 breaks [${breaks.join(', ')}]`);
        }
        console.log(`    tones that clear every pair of ${base.headers[h].label} alone: ${clean}`);
    }
    // Each failing pair on its own: every set of headers of the failing pairs that holds one of the
    // pair's two headers, and every assignment of new tones to it, kept when the pair is at 10 or
    // more in every theme, every open-layout pair at 10 or more on the base stays there, every
    // other failing open-layout pair keeps at least its base distance, and every collapsed-only
    // pair meets bar 2.
    console.log('--- each failing open-layout pair on its own');
    for (const [pa, pb] of failing) {
        const target = pairKey(pa, pb, base.order);
        let count = 0;
        let best: { worst: number; text: string } = { worst: -Infinity, text: '' };
        for (const cover of subsets(pool).filter((s) => s.includes(pa) || s.includes(pb))) {
            const assign: Record<string, string> = {};
            const toneOfHeader = (h: string): string | undefined => (cover.includes(h) ? assign[h] : base.headers[h].tone);
            const okPair = (p: string): boolean => {
                const [a, b] = p.split('|');
                const x = toneOfHeader(a);
                const y = toneOfHeader(b);
                if (x === undefined || y === undefined) return true;
                for (const theme of base.names) {
                    const after = dt(theme, x, y);
                    const before = baseDist.get(`${p}|${theme}`)!;
                    if (p === target) {
                        if (!(after >= LINE)) return false;
                    } else if (before >= LINE ? !(after >= LINE) : !(after >= before)) return false;
                }
                return true;
            };
            const touched = (h: string): string[] => [...open, ...collapsed].filter((p) => p.split('|').includes(h));
            const step = (i: number): void => {
                if (i === cover.length) {
                    count += 1;
                    let worst = Infinity;
                    for (const theme of base.names) worst = Math.min(worst, dt(theme, toneOfHeader(pa)!, toneOfHeader(pb)!));
                    if (worst > best.worst) {
                        best = { worst, text: cover.map((h) => `${base.headers[h].label} ${base.headers[h].tone}->${assign[h]}`).join(', ') };
                    }
                    return;
                }
                const h = cover[i];
                for (const tone of tones) {
                    if (tone === base.headers[h].tone) continue;
                    assign[h] = tone;
                    if (touched(h).every(okPair)) step(i + 1);
                    delete assign[h];
                }
            };
            step(0);
        }
        console.log(`  ${name(base, target)}: ${count} assignments${count > 0 ? `; best ${best.text}, smallest distance ${f(best.worst)}` : ''}`);
    }
    const bySize = (n: number): Found[] => found.filter((x) => x.cover.length === n).sort((a, b) => b.worstOpen - a.worstOpen);
    for (let n = 1; n <= pool.length; n += 1) {
        const list = bySize(n);
        console.log(`--- ${list.length} assignments of ${n} headers meet the three bars`);
        for (const x of list.slice(0, 25)) {
            console.log(`  ${x.cover.map((h) => `${base.headers[h].label} ${base.headers[h].tone}->${x.tones[h]}`).join(', ')}; smallest open distance ${f(x.worstOpen)} (${x.worstPair})`);
        }
    }
}

// The candidate search of item 3: every tone a header could take under item 3's value forms, with
// whether the three bars of item 3 hold against the base when that header alone takes it.
const at = process.argv.indexOf('--candidates');
if (at > 0) {
    const id = process.argv[at + 1];
    const palette: Record<string, string> = base.vocab.palette;
    const tones = [...new Set(Object.values(palette).filter((v) => v.startsWith('c-')).map((v) => v.slice(2)))].sort();
    const { open, collapsed } = classify(base);
    const baseCount = collapsed.filter((p) => under(base, p).length > 0).length;
    console.log(`=== candidates for ${base.headers[id].label} (now ${base.headers[id].tone})`);
    for (const tone of tones) {
        const trial: Tree = { ...base, headers: { ...base.headers, [id]: { ...base.headers[id], tone } } };
        const present = trial.names.every((n) => trial.tokens[n][`--c-${tone}-lane`] !== undefined);
        const openUnder = open.filter((p) => under(trial, p).length > 0);
        let bar2 = 0;
        for (const pair of collapsed) {
            const [a, b] = pair.split('|');
            for (const theme of trial.names) {
                const before = distance(base, theme, a, b);
                const after = distance(trial, theme, a, b);
                if (before >= LINE ? !(after >= LINE) : !(after >= before)) bar2 += 1;
            }
        }
        const count = collapsed.filter((p) => under(trial, p).length > 0).length;
        const ok = present && openUnder.length === 0 && bar2 === 0 && count <= baseCount;
        console.log(`  ${tone}: in every theme ${present}; open under 10 ${openUnder.map((p) => name(trial, p)).join(' ') || 'none'}; bar 2 breaks ${bar2}; collapsed-only under 10 ${count} (base ${baseCount})${ok ? ' MEETS ALL' : ''}`);
    }
}
```

### Run A, no argument (`A-plain.txt`)

Lines 2-77 (the base) and 79-154 (the worktree) are identical (`diff <(sed -n 2,77p) <(sed -n 79,154p)` printed nothing), so the worktree half is not repeated here. The base half, the open-pair block and the collapsed-only counts:

```
=== base: 49 themes
C10 the tone each header resolves to (written value -> palette token -> tone; the -lane token present in how many themes):
  Funding: gold -> c-gold -> gold; --c-gold-lane in 49 of 49
  Jobs: grey-d -> c-grey-d -> grey-d; --c-grey-d-lane in 49 of 49
  Teaching: teal -> c-teal -> teal; --c-teal-lane in 49 of 49
  Run: #16a34a -> c-green -> green; --c-green-lane in 49 of 49
  Push: #2563eb -> c-blue -> blue; --c-blue-lane in 49 of 49
  Revise: #b45309 -> c-amber -> amber; --c-amber-lane in 49 of 49
  Review: #475569 -> c-slate -> slate; --c-slate-lane in 49 of 49
  Blocked: #dc2626 -> c-red -> red; --c-red-lane in 49 of 49
  Backburner: #9ca3af -> c-grey -> grey; --c-grey-lane in 49 of 49
  Scope: #0e7490 -> c-cyan-d -> cyan-d; --c-cyan-d-lane in 49 of 49
  De-risk: #f59e0b -> c-honey -> honey; --c-honey-lane in 49 of 49
  Build: #0d9488 -> c-teal -> teal; --c-teal-lane in 49 of 49
  Idea: #b5638a -> c-mauve -> mauve; --c-mauve-lane in 49 of 49
layouts built: 128; open-layout pairs: 20; collapsed-only pairs: 37
--- open pairs, smallest distance over the 49 themes, and every theme under 10:
  Funding-Jobs: min 4.9 (kanagawalotus); under 10 in 1: kanagawalotus 4.9
  Funding-Run: min 5.7 (kanagawalotus); under 10 in 3: kanagawalotus 5.7, solarized 8.9, gruvboxlight 9.3
  Jobs-Teaching: min 10.1 (phosphor)
  Jobs-Push: min 0.0 (dracula); under 10 in 5: dracula 0.0, nord 6.5, kanagawadragon 7.2, vscode-tomorrow-night-blue 8.3, frappe 8.9
  Teaching-Revise: min 18.0 (kanagawadragon)
  Run-Push: min 6.9 (rosepinedawn); under 10 in 1: rosepinedawn 6.9
  Run-Review: min 7.9 (kanagawalotus); under 10 in 1: kanagawalotus 7.9
  Push-Revise: min 15.2 (kanagawadragon)
  Push-Blocked: min 23.1 (tokyolight)
  Revise-Backburner: min 11.1 (phosphoramber)
  Review-Blocked: min 12.7 (rosepinedawn)
  Review-Scope: min 6.8 (vscode-solarized-dark); under 10 in 5: vscode-solarized-dark 6.8, kanagawadragon 7.2, kanagawalotus 7.7, vscode-tomorrow-night-blue 8.3, vscode-abyss 9.9
  Blocked-Backburner: min 12.7 (rosepinedawn)
  Blocked-De-risk: min 17.0 (tokyolight)
  Backburner-Build: min 10.1 (phosphor)
  Scope-De-risk: min 12.1 (kanagawalotus)
  Scope-Idea: min 6.2 (kanagawadragon); under 10 in 1: kanagawadragon 6.2
  De-risk-Build: min 14.6 (tokyolight)
  De-risk-Idea: min 13.8 (kanagawalotus)
  Build-Idea: min 15.7 (kanagawadragon)
C1/C2 open pairs under 10 in at least one theme: 7
--- collapsed-only pairs, smallest distance over the 49 themes, and every theme under 10:
  Funding-Teaching: min 13.2 (kanagawalotus)
  Funding-Push: min 15.2 (kanagawadragon)
  Funding-Revise: min 0.0 (tokyoneon); under 10 in 41: tokyoneon 0.0, tokyonight 0.0, tokyostorm 0.0, rosepine 0.0, rosepinemoon 0.0, everforest 0.0, oxocarbon 0.0, flexoki 0.0, kanagawadragon 0.0, solarized 0.0, latte 0.0, gruvboxlight 0.0, rosepinedawn 0.0, tokyolight 0.0, everforestlight 0.0, flexokilight 0.0, vscode-red 4.7, nord 5.2, phosphoramber 5.6, light 6.5, vscode-light-modern 6.5, vscode-light-2026 6.5, vscode-light-plus 6.5, vscode-light-visual-studio 6.5, vscode-light-high-contrast 6.5, vscode-quiet-light 6.5, vscode-dark-modern 6.5, vscode-solarized-light 6.6, kanagawa 6.7, vscode-dark-2026 6.8, vscode-kimbie-dark 6.9, vscode-monokai 7.1, gruvbox 7.1, vscode-dark-high-contrast 7.2, vscode-dark-plus 7.3, vscode-dark-visual-studio 7.3, vscode-monokai-dimmed 7.3, dark 8.0, vscode-abyss 8.0, vscode-solarized-dark 8.9, onedark 9.2
  Funding-Review: min 4.9 (kanagawalotus); under 10 in 1: kanagawalotus 4.9
  Funding-Blocked: min 13.6 (vscode-red)
  Funding-Backburner: min 4.9 (kanagawalotus); under 10 in 1: kanagawalotus 4.9
  Funding-Scope: min 11.5 (kanagawalotus)
  Funding-De-risk: min 0.0 (macchiato); under 10 in 33: macchiato 0.0, frappe 0.0, synthwave 0.0, tokyoneon 0.0, tokyonight 0.0, tokyostorm 0.0, rosepine 0.0, rosepinemoon 0.0, everforest 0.0, dracula 0.0, onedark 0.0, oxocarbon 0.0, flexoki 0.0, phosphor 0.0, phosphoramber 0.0, kanagawa 0.0, kanagawadragon 0.0, solarized 0.0, latte 0.0, gruvboxlight 0.0, rosepinedawn 0.0, everforestlight 0.0, flexokilight 0.0, kanagawalotus 3.3, gruvbox 4.4, tokyolight 8.4, vscode-solarized-light 9.6, light 9.8, vscode-light-modern 9.8, vscode-light-2026 9.8, vscode-light-plus 9.8, vscode-light-visual-studio 9.8, vscode-light-high-contrast 9.8
  Funding-Build: min 13.2 (kanagawalotus)
  Funding-Idea: min 15.5 (macchiato)
  Jobs-Run: min 7.9 (kanagawalotus); under 10 in 1: kanagawalotus 7.9
  Jobs-Revise: min 11.1 (phosphoramber)
  Jobs-Review: min 0.0 (macchiato); under 10 in 49: macchiato 0.0, frappe 0.0, synthwave 0.0, tokyoneon 0.0, tokyonight 0.0, tokyostorm 0.0, rosepine 0.0, rosepinemoon 0.0, everforest 0.0, dracula 0.0, onedark 0.0, oxocarbon 0.0, flexoki 0.0, phosphor 0.0, phosphoramber 0.0, kanagawa 0.0, kanagawadragon 0.0, solarized 0.0, latte 0.0, gruvboxlight 0.0, rosepinedawn 0.0, tokyolight 0.0, kanagawalotus 0.0, everforestlight 0.0, flexokilight 0.0, light 4.5, vscode-light-modern 4.5, vscode-light-2026 4.5, vscode-light-plus 4.5, vscode-light-visual-studio 4.5, vscode-light-high-contrast 4.5, vscode-quiet-light 4.6, vscode-solarized-dark 4.8, vscode-solarized-light 5.0, vscode-tomorrow-night-blue 5.1, vscode-dark-2026 5.2, vscode-abyss 5.2, vscode-dark-high-contrast 5.3, vscode-dark-modern 5.3, vscode-red 5.3, mocha 5.4, dark 5.4, vscode-dark-plus 5.4, vscode-dark-visual-studio 5.4, vscode-monokai-dimmed 5.4, gruvbox 5.5, vscode-monokai 5.5, nord 5.6, vscode-kimbie-dark 5.7
  Jobs-Blocked: min 12.7 (rosepinedawn)
  Jobs-Backburner: min 0.0 (macchiato); under 10 in 49: macchiato 0.0, frappe 0.0, synthwave 0.0, tokyoneon 0.0, tokyonight 0.0, tokyostorm 0.0, rosepine 0.0, rosepinemoon 0.0, everforest 0.0, dracula 0.0, onedark 0.0, oxocarbon 0.0, flexoki 0.0, phosphor 0.0, phosphoramber 0.0, kanagawa 0.0, kanagawadragon 0.0, solarized 0.0, latte 0.0, gruvboxlight 0.0, rosepinedawn 0.0, tokyolight 0.0, kanagawalotus 0.0, everforestlight 0.0, flexokilight 0.0, vscode-solarized-light 6.2, light 6.3, vscode-light-modern 6.3, vscode-light-2026 6.3, vscode-light-plus 6.3, vscode-light-visual-studio 6.3, vscode-light-high-contrast 6.3, vscode-quiet-light 6.5, vscode-dark-high-contrast 8.1, vscode-red 8.1, vscode-abyss 8.2, dark 8.4, vscode-tomorrow-night-blue 8.4, vscode-kimbie-dark 8.5, vscode-dark-plus 8.5, vscode-dark-visual-studio 8.5, vscode-monokai-dimmed 8.5, mocha 8.5, vscode-monokai 8.5, gruvbox 8.6, vscode-dark-2026 8.6, vscode-dark-modern 8.7, vscode-solarized-dark 8.8, nord 9.0
  Jobs-Scope: min 6.4 (vscode-solarized-dark); under 10 in 5: vscode-solarized-dark 6.4, vscode-tomorrow-night-blue 7.0, kanagawadragon 7.2, kanagawalotus 7.7, vscode-abyss 9.7
  Jobs-De-risk: min 4.5 (kanagawalotus); under 10 in 1: kanagawalotus 4.5
  Jobs-Build: min 10.1 (phosphor)
  Jobs-Idea: min 4.9 (rosepinedawn); under 10 in 3: rosepinedawn 4.9, kanagawadragon 7.3, rosepinemoon 9.1
  Teaching-Run: min 6.9 (rosepinedawn); under 10 in 4: rosepinedawn 6.9, kanagawadragon 7.6, everforest 8.7, kanagawalotus 8.8
  Teaching-Push: min 8.6 (everforest); under 10 in 2: everforest 8.6, synthwave 9.4
  Teaching-Review: min 10.1 (phosphor)
  Teaching-Blocked: min 28.6 (tokyolight)
  Teaching-Backburner: min 10.1 (phosphor)
  Teaching-Scope: min 6.2 (flexokilight); under 10 in 12: flexokilight 6.2, phosphoramber 6.9, phosphor 7.0, solarized 7.5, flexoki 7.6, kanagawa 7.7, everforest 8.6, kanagawalotus 9.4, vscode-solarized-light 9.5, onedark 9.5, latte 9.7, synthwave 9.8
  Teaching-De-risk: min 14.6 (tokyolight)
  Teaching-Build: min 0.0 (light); under 10 in 49: (every theme, 0.0)
  Teaching-Idea: min 15.7 (kanagawadragon)
  Run-Scope: min 6.9 (rosepinedawn); under 10 in 1: rosepinedawn 6.9
  Run-Idea: min 16.4 (kanagawadragon)
  Push-De-risk: min 15.2 (kanagawadragon)
  Push-Idea: min 6.2 (kanagawadragon); under 10 in 2: kanagawadragon 6.2, kanagawalotus 9.8
  Revise-Build: min 18.0 (kanagawadragon)
  Revise-Idea: min 11.6 (frappe)
  Review-Idea: min 4.9 (rosepinedawn); under 10 in 3: rosepinedawn 4.9, kanagawadragon 7.3, rosepinemoon 9.1
  Blocked-Idea: min 6.0 (mocha); under 10 in 2: mocha 6.0, everforest 9.6
  Backburner-Idea: min 4.9 (rosepinedawn); under 10 in 3: rosepinedawn 4.9, kanagawadragon 7.3, rosepinemoon 9.1
C1 collapsed-only pairs under 10 in at least one theme: 19
```

The Teaching-Build line is shortened above: the file lists all 49 themes by name, each at 0.0. Run A's tail:

```
=== C7, C8, C9: chosen layouts of the worktree model
  C7 band Funding Jobs, every cluster open: rows [Funding Jobs] / [Run Push Revise] / [Review Blocked Backburner] / [Scope De-risk Build] / [Idea]
    touching: Funding-Jobs, Run-Push, Push-Revise, Review-Blocked, Blocked-Backburner, Scope-De-risk, De-risk-Build, Funding-Run, Funding-Push, Jobs-Push, Jobs-Revise, Run-Review, Push-Blocked, Revise-Backburner, Review-Scope, Blocked-De-risk, Backburner-Build, Scope-Idea, De-risk-Idea, Build-Idea
  C7 band Jobs Teaching, every cluster open: rows [Jobs Teaching] / [Run Push Revise] / [Review Blocked Backburner] / [Scope De-risk Build] / [Idea]
    touching: Jobs-Teaching, Run-Push, Push-Revise, Review-Blocked, Blocked-Backburner, Scope-De-risk, De-risk-Build, Jobs-Run, Jobs-Push, Teaching-Push, Teaching-Revise, Run-Review, Push-Blocked, Revise-Backburner, Review-Scope, Blocked-De-risk, Backburner-Build, Scope-Idea, De-risk-Idea, Build-Idea
  C7 band Funding Teaching, every cluster open: rows [Funding Teaching] / [Run Push Revise] / [Review Blocked Backburner] / [Scope De-risk Build] / [Idea]
    touching: Funding-Teaching, Run-Push, Push-Revise, Review-Blocked, Blocked-Backburner, Scope-De-risk, De-risk-Build, Funding-Run, Funding-Push, Teaching-Push, Teaching-Revise, Run-Review, Push-Blocked, Revise-Backburner, Review-Scope, Blocked-De-risk, Backburner-Build, Scope-Idea, De-risk-Idea, Build-Idea
  C7 band Funding alone, every cluster open: rows [Funding] / [Run Push Revise] / [Review Blocked Backburner] / [Scope De-risk Build] / [Idea]
    touching: Run-Push, Push-Revise, Review-Blocked, Blocked-Backburner, Scope-De-risk, De-risk-Build, Funding-Run, Funding-Push, Funding-Revise, Run-Review, Push-Blocked, Revise-Backburner, Review-Scope, Blocked-De-risk, Backburner-Build, Scope-Idea, De-risk-Idea, Build-Idea
  C8 band of three, every cluster folded: rows [Funding Jobs Teaching] / [Idea]
    touching: Funding-Jobs, Jobs-Teaching, Funding-Idea, Jobs-Idea, Teaching-Idea
  C8 band Jobs alone, every cluster folded: rows [Jobs] / [Idea]
    touching: Jobs-Idea
C9 layouts in which Funding is drawn: 64 of 128
C9 layouts in which Jobs is drawn: 64 of 128
C9 layouts in which Teaching is drawn: 64 of 128
pairs that only a folded Idea lane brings together: 0
=== C3: every pair other than the open-layout ones, base -> worktree, in each theme
C3 1813 collapsed-only measures read; 0 break item 3's second bar; collapsed-only pairs under 10: base 19, worktree 19
open-layout measures that moved: 0
```

### Run B, `--search` (`B-search.txt`, lines 175-403)

```
=== search: 29 tones present in every theme: amber amber-s blue brass crimson cyan cyan-d gold green green-d grey grey-d honey indigo lime magenta mauve orange pink purple red red-d red-s red-t rose sky slate teal violet
headers of the failing pairs: Funding Jobs Run Push Review Scope Idea; covers of any size: 31; smallest 3
joint search bar 2: item 3's second bar as the brief gives it
--- each failing header alone, every other header unchanged
```

The per-header block follows, 30 lines per header, each ending `tones that clear every pair of <header> alone: 0` for all seven. The Jobs block in full:

```
  Jobs (now grey-d):
    amber: open under 10 [Funding-Jobs 41]; bar 2 breaks [Jobs-Run 2, Jobs-Revise 49, Jobs-Blocked 1, Jobs-De-risk 20]
    amber-s: open under 10 [Funding-Jobs 1, Jobs-Push 1]; bar 2 breaks []
    blue: open under 10 [Jobs-Teaching 2, Jobs-Push 49]; bar 2 breaks [Jobs-Run 1, Jobs-Scope 11, Jobs-Build 2, Jobs-Idea 2]
    brass: open under 10 [Funding-Jobs 35]; bar 2 breaks [Jobs-Run 2, Jobs-Revise 20, Jobs-De-risk 49]
    crimson: open under 10 []; bar 2 breaks [Jobs-Blocked 48, Jobs-Idea 1]
    cyan: open under 10 [Jobs-Teaching 24, Jobs-Push 8]; bar 2 breaks [Jobs-Run 1, Jobs-Scope 46, Jobs-Build 24, Jobs-Idea 1]
    cyan-d: open under 10 [Jobs-Teaching 12, Jobs-Push 13]; bar 2 breaks [Jobs-Run 1, Jobs-Scope 49, Jobs-Build 12, Jobs-Idea 1]
    gold: open under 10 [Funding-Jobs 49]; bar 2 breaks [Jobs-Run 3, Jobs-Revise 41, Jobs-De-risk 33]
    green: open under 10 [Funding-Jobs 3, Jobs-Teaching 4, Jobs-Push 1]; bar 2 breaks [Jobs-Run 49, Jobs-Revise 2, Jobs-Scope 1, Jobs-De-risk 2, Jobs-Build 4]
    green-d: open under 10 [Funding-Jobs 3, Jobs-Teaching 5, Jobs-Push 1]; bar 2 breaks [Jobs-Run 48, Jobs-Revise 2, Jobs-Scope 1, Jobs-De-risk 2, Jobs-Build 5]
    grey: open under 10 [Funding-Jobs 1, Jobs-Push 4]; bar 2 breaks [Jobs-Backburner 24]
    honey: open under 10 [Funding-Jobs 33]; bar 2 breaks [Jobs-Run 2, Jobs-Revise 20, Jobs-De-risk 49]
    indigo: open under 10 [Jobs-Push 35]; bar 2 breaks [Jobs-Blocked 1, Jobs-Backburner 1, Jobs-Scope 2, Jobs-Idea 14]
    lime: open under 10 [Funding-Jobs 3, Jobs-Teaching 3, Jobs-Push 1]; bar 2 breaks [Jobs-Run 30, Jobs-Revise 2, Jobs-Scope 1, Jobs-De-risk 2, Jobs-Build 3]
    magenta: open under 10 [Jobs-Push 1]; bar 2 breaks [Jobs-Blocked 7, Jobs-Idea 18]
    mauve: open under 10 [Jobs-Push 2]; bar 2 breaks [Jobs-Blocked 2, Jobs-Scope 1, Jobs-Idea 49]
    orange: open under 10 [Funding-Jobs 6]; bar 2 breaks [Jobs-Revise 32, Jobs-Blocked 5, Jobs-De-risk 5]
    pink: open under 10 []; bar 2 breaks [Jobs-Blocked 6, Jobs-Idea 36]
    purple: open under 10 [Jobs-Push 4]; bar 2 breaks [Jobs-Blocked 1, Jobs-Scope 1, Jobs-Idea 21]
    red: open under 10 []; bar 2 breaks [Jobs-Revise 1, Jobs-Blocked 49, Jobs-Idea 2]
    red-d: open under 10 []; bar 2 breaks [Jobs-Revise 2, Jobs-Blocked 49, Jobs-Idea 4]
    red-s: open under 10 [Jobs-Push 1]; bar 2 breaks [Jobs-Blocked 1]
    red-t: open under 10 []; bar 2 breaks [Jobs-Revise 1, Jobs-Blocked 27, Jobs-Idea 5]
    rose: open under 10 []; bar 2 breaks [Jobs-Blocked 9, Jobs-Idea 24]
    sky: open under 10 [Jobs-Teaching 10, Jobs-Push 10]; bar 2 breaks [Jobs-Run 3, Jobs-Scope 24, Jobs-Build 10, Jobs-Idea 1]
    slate: open under 10 [Funding-Jobs 1, Jobs-Push 5]; bar 2 breaks [Jobs-Review 24]
    teal: open under 10 [Jobs-Teaching 49, Jobs-Push 2]; bar 2 breaks [Jobs-Run 3, Jobs-Scope 11, Jobs-Build 49]
    violet: open under 10 [Jobs-Push 16]; bar 2 breaks [Jobs-Blocked 1, Jobs-Scope 1, Jobs-Idea 21]
    tones that clear every pair of Jobs alone: 0
```

The Funding lines that the hand-back cites:

```
    amber-s: open under 10 [Funding-Jobs 6]; bar 2 breaks [Funding-Push 1, Funding-Review 6, Funding-Backburner 6]
    crimson: open under 10 []; bar 2 breaks [Funding-Blocked 48, Funding-Idea 1]
    grey: open under 10 [Funding-Jobs 49, Funding-Run 1]; bar 2 breaks [Funding-Push 4, Funding-Review 25, Funding-Backburner 49, Funding-Scope 2, Funding-Idea 3]
    magenta: open under 10 []; bar 2 breaks [Funding-Push 1, Funding-Blocked 7, Funding-Idea 18]
    orange: open under 10 []; bar 2 breaks [Funding-Revise 25, Funding-Blocked 5]
    pink: open under 10 []; bar 2 breaks [Funding-Blocked 6, Funding-Idea 36]
    red: open under 10 []; bar 2 breaks [Funding-Blocked 49, Funding-Idea 2]
    red-d: open under 10 []; bar 2 breaks [Funding-Revise 1, Funding-Blocked 49, Funding-Idea 4]
    red-s: open under 10 [Funding-Jobs 6]; bar 2 breaks [Funding-Push 1, Funding-Review 6, Funding-Blocked 1, Funding-Backburner 6]
    red-t: open under 10 []; bar 2 breaks [Funding-Revise 1, Funding-Blocked 27, Funding-Idea 5]
    rose: open under 10 []; bar 2 breaks [Funding-Blocked 9, Funding-Idea 24]
    slate: open under 10 [Funding-Jobs 49, Funding-Run 1]; bar 2 breaks [Funding-Push 5, Funding-Review 49, Funding-Backburner 25, Funding-Scope 5, Funding-Idea 3]
```

Run B's tail:

```
--- each failing open-layout pair on its own
  Funding-Jobs: 0 assignments
  Funding-Run: 0 assignments
  Jobs-Push: 0 assignments
  Run-Push: 0 assignments
  Run-Review: 0 assignments
  Review-Scope: 0 assignments
  Scope-Idea: 0 assignments
--- 0 assignments of 1 headers meet the three bars
--- 0 assignments of 2 headers meet the three bars
--- 0 assignments of 3 headers meet the three bars
--- 0 assignments of 4 headers meet the three bars
--- 0 assignments of 5 headers meet the three bars
--- 0 assignments of 6 headers meet the three bars
--- 0 assignments of 7 headers meet the three bars
```

### Run C, `--search --cross-only` (`C-cross-only.txt`)

`joint search bar 2: CROSS-ONLY (not the brief bar; information for the hand-back)`, then `--- 0 assignments of N headers meet the three bars` for N = 1 to 7. Its per-header and per-pair blocks use the brief's bar 2 and equal run B's.

### Run D, `--search --open-only` (`D-open-only.txt`)

`joint search bar 2: NONE, bar 1 alone (not the brief bars; information for the hand-back)`. Only the three-header sets are searched: `--- 0 assignments of 1 headers`, `--- 0 assignments of 2 headers`, `--- 36 assignments of 3 headers meet the three bars`, and the lines for 4 to 7 are 0 because those sets were not searched. Of the 25 printed lines, all have `Scope cyan-d->teal` (`grep -c` prints 25). Jobs takes crimson, pink, red or red-d (6 lines each) or red-t (1); Run takes crimson (5) or pink, red, red-d, red-t or rose (4 each). The best smallest open distance is 10.1 (Review-Scope, phosphor).

### Run E, `--candidates <key>` for the seven headers (`E-candidates.txt`)

One line per tone for each header, with the three bars applied to that header alone. `grep -c "MEETS ALL"` prints 0.

## Each colour changed

None.

## Files

| Path | Lines | In the write list |
| --- | --- | --- |
| `.scratch/migration/agents/reviews/O141-report.md` | this file | yes |

`diff -rq` over `src tests utils config` against `/Users/axelfaes/workspace/oculus/.agents/worktrees/O141-base` (excluding `local.yml`) prints nothing.

## Judgment calls the brief left open

1. "Side by side in one row" is read as neighbours: columns 1 and 2, and 2 and 3, of a three-header row. Columns 1 and 3, with one header between them, do not touch. This decides whether Run-Revise, Review-Backburner, Scope-Build and the band's outer pair count as touching.
2. The Idea lane's own fold (`groupFold('lane', 'idea')`) is one more dimension of the layouts (128 instead of 64). It adds no pair: `pairs that only a folded Idea lane brings together: 0`.
3. A folded band (key `band`) draws the same headers as a band with no column drawn, so it is not a separate layout.
4. The model holds at any width of three tracks or more. auto-fit collapses the empty tracks, so a wider pane changes no span.
5. The candidate tones are the palette's `c-` tones whose `-lane` exists in all 49 themes (29). The tint tones amber-s, red-s and red-t are among them. Leaving them out would only shrink the search, and none of them meets the bars.
6. Both trees use the worktree's `parse.ts` and `derive.ts`. The step changes no code in either file, and only the doc lines of `derive.ts` are in its paths.

## Host- or user-visible changes

None. No colour or comment changed, so nothing differs on the Focus board in any theme.

## What in the brief was wrong or impossible

- Item 3 cannot be met under its three bars (run B, and the Funding-Jobs proof above).
- The open-layout claim at `vocab.yml:181` and `derive.ts:83-89` is false on the tree: 7 pairs are under 10 (run A). The comment's count of collapsed-only pairs under 10, "ten", is 19 on the run.
- Decision 4 of the brief expects the 10 line to leave room for a recolour. The run shows it leaves none: even the weaker cross-only bar (run C) allows no assignment.
- Two premises reproduce: `grep -rn -i 'ciede\|10 apart\|LANE_SHARE\|distance rule\|neighbouring header' docs src config tests utils --exclude=local.yml` finds only `derive.ts:86,90,313` and `vocab.yml:181,213`; and every header's tone resolves as item 3 says (C10).
