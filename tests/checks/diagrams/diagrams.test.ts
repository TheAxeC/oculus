// The diagrams of docs/diagrams/ against the source they are drawn from.
//
// The first case runs bin/diagrams/diagrams.mjs's staleFiles() in memory over this tree and fails,
// naming every committed `.dot` and `.svg` that differs from what the source gives now, byte for
// byte; the second shows it does so for a source change, over a copy of the tree with one import
// and one publish added. The cases after them hand the readers a small source of their own and show
// that each finds what a change adds (a new import, a new channel, a new write module), that the
// overview and each layer's diagram count runtime imports and leave a type-only one out, and that
// what a reader cannot place or follow is drawn, with its file and line, in a group that says so.
// The last cases hold the rendered file to its colours, its edge titles and its standalone style.
//
// The copy of the tree is made under the system temporary directory and removed after the run;
// nothing else is written. What this does not cover is the Help view drawing a diagram, which
// tests/browser/workbench/system.spec.ts does.

import { appendFileSync, cpSync, mkdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import {
    BOUNDARIES,
    NAMES,
    ORDERING,
    OUT,
    RUNTIME,
    channelsDot,
    layerDot,
    layersDot,
    readLayers,
    readOrder,
    renderSvg,
    staleFiles,
    writesDot
} from '../../../bin/diagrams/diagrams.mjs';
import { STATEMENT } from '../imports/graph.ts';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const ENGINE = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..');

/** The layer rows the synthetic sources are placed by, the shape of the boundary test's own. */
const LAYERS = ['data', 'server', 'state', 'ui', 'views'];

/** A source map from path and text pairs, the shape readSources gives. */
function sources(files: Record<string, string>): Map<string, string> {
    return new Map(Object.entries(files));
}

/** A copy of what the generator reads (src, the boundary test, the order, the diagrams). */
function copyOfTree(): string {
    const dir = scratchDir('oculus-diagrams-tree-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    for (const part of ['src', BOUNDARIES, ORDERING, OUT]) {
        mkdirSync(dirname(join(dir, part)), { recursive: true });
        cpSync(join(ENGINE, part), join(dir, part), { recursive: true });
    }
    return dir;
}

describe('the committed diagrams', () => {
    it('are what the source gives now, each file byte for byte', async () => {
        // revert: bin/diagrams/source.mjs:160 => `    node [shape=ellipse];`,
        expect(await staleFiles(ENGINE), 'run npm run diagrams').toEqual([]);
    }, 60_000);

    it('are named stale, every one at once, when an import and a publish are added', async () => {
        // revert: bin/diagrams/diagrams.mjs:151 => if (!existsSync(path)) stale.push(file);
        const dir = copyOfTree();
        appendFileSync(join(dir, 'src/lib/ui/html.ts'), "import '../server/core/auth.ts';\n");
        appendFileSync(
            join(dir, 'src/lib/server/root/watch/git.ts'),
            "hub.publish('brandnew', {});\n"
        );
        expect(await staleFiles(dir)).toEqual([
            `${OUT}/layers.dot`,
            `${OUT}/layers.svg`,
            `${OUT}/layer-ui.dot`,
            `${OUT}/layer-ui.svg`,
            `${OUT}/channels.dot`,
            `${OUT}/channels.svg`
        ]);
    }, 60_000);

    it('are the overview, one diagram per layer the order names, and the channels and writes', () => {
        // revert: bin/diagrams/diagrams.mjs:54 => ...LAYER_NAMES.slice(1).map((layer) => `layer-${layer}`),
        const order = readOrder(readFileSync(join(ENGINE, ORDERING), 'utf8'));
        expect(NAMES).toEqual([
            'layers',
            ...[...order.keys()].map((layer) => `layer-${layer}`),
            'channels',
            'writes'
        ]);
    });

    it('reads the layer rows from the boundary test and refuses a test that names none', () => {
        // revert: bin/diagrams/source.mjs:77 => if (found === null) return [];
        const text = readFileSync(join(ENGINE, BOUNDARIES), 'utf8');
        expect(readLayers(text)).toContain('server/transcripts');
        expect(() => readLayers('const OTHER = [];')).toThrow(/declares no LAYERS list/);
    });

    it('reads the folder order the checks declare and refuses a file that declares none', () => {
        // revert: bin/diagrams/source.mjs:91 => if (found === null) return new Map();
        const text = readFileSync(join(ENGINE, ORDERING), 'utf8');
        expect(readOrder(text).get('ui')?.at(-1)).toBe('ui');
        expect(readOrder(text).get('server')?.[0]).toBe('server/root');
        expect(() => readOrder('const OTHER = {};')).toThrow(/declares no ORDER/);
    });

    it('reads imports with the one pattern the import checks read them with', () => {
        // revert: bin/diagrams/source.mjs:34 => /(?:^|[\s;])(?:from|import)\s*\(?\s*['"]([^'"]+)['"]/g;
        expect(RUNTIME.source).toBe(STATEMENT.source);
        expect(RUNTIME.flags).toBe(STATEMENT.flags);
    });
});

describe('the layer readers', () => {
    const base = {
        'lib/state/store.ts': "import { t } from '$lib/state/words/text';\n",
        'lib/state/words/text.ts': 'export const t = 1;\n',
        'lib/data/model.ts': 'export type Model = {};\n'
    };
    const ORDER = ['state', 'state/words'];

    it('draws one arrow per pair of layers, labelled with its runtime imports', () => {
        // revert: bin/diagrams/graphs.mjs:103 => edges.set(`${a}\n${b}`, 1);
        const before = layersDot(sources(base), LAYERS);
        // The base's one import stays inside the state layer, which the overview does not draw.
        expect(before).not.toContain('-> "data"');
        const after = layersDot(
            sources({
                ...base,
                'lib/state/store.ts': `${base['lib/state/store.ts']}import { m } from '../data/model.ts';\n`,
                'lib/state/words/text.ts':
                    "import { m } from '$lib/data/model';\nexport const t = 1;\n"
            }),
            LAYERS
        );
        expect(after).toContain('"state" -> "data" [label="2"];');
    });

    it('leaves a type-only import out of every count', () => {
        // revert: bin/diagrams/graphs.mjs:116 => if (false) continue;
        const dot = layersDot(
            sources({ ...base, 'lib/ui/a.ts': "import type { Model } from '../data/model.ts';\n" }),
            LAYERS
        );
        // A type-only import leaves nothing behind in the compiled module, so it joins no layers.
        expect(dot).not.toContain('"ui" -> "data"');
    });

    it('names a module no layer row places that an import joins, in a group that says so', () => {
        // revert: bin/diagrams/graphs.mjs:52 => if (layer === undefined) return { layer: 'data', node: 'data' };
        const dot = layersDot(
            sources({
                ...base,
                'lib/state/uses.ts': "import { odd } from '../extra/odd.ts';\n",
                'lib/extra/odd.ts': 'export const odd = 1;\n'
            }),
            LAYERS
        );
        expect(dot).toMatch(/subgraph "cluster_not placed" \{\n[^}]*\[label="extra"\];/);
        expect(dot).toContain('"state" -> "not placed: extra" [label="1"];');
    });

    it('draws no node that no import joins, an asset outside every layer, and one entry node', () => {
        // revert: bin/diagrams/graphs.mjs:154 => const nodes = new Set([...sources.keys()].map(end).filter((one) => one !== null));
        // revert: bin/diagrams/graphs.mjs:148 => return `${astrayPrefix}${path.split('/')[1]}`;
        const dot = layersDot(
            sources({
                ...base,
                'lib/lonely.d.ts': 'declare const x: number;\n',
                'routes/+layout.svelte':
                    "<script>\n    import favicon from '$lib/assets/favicon.svg';\n    import { t } from '$lib/state/words/text';\n</script>\n",
                'server.ts': "import { m } from './lib/data/model.ts';\n",
                'hooks.server.ts': "import { t } from './lib/state/words/text.ts';\n"
            }),
            LAYERS
        );
        // The declaration file is imported by nothing and imports nothing, so no arrow reaches it.
        expect(dot).not.toContain('lonely');
        // The favicon is an image a page links to, not a module of any layer.
        expect(dot).not.toContain('assets');
        expect(dot).toContain('"src" [label="entry"];');
        expect(dot).toContain('"src" -> "data" [label="1"];');
        expect(dot).toContain('"src" -> "state" [label="1"];');
        // Nothing here is a module no rule places, so the group that names one is not drawn.
        expect(dot).not.toContain('cluster_not placed');
    });

    it('names an import it cannot follow with its file and line, joined to its own layer', () => {
        // revert: bin/diagrams/graphs.mjs:107 => for (const match of plain.matchAll(/(?!)/g)) {
        // revert: bin/diagrams/graphs.mjs:173 => lines.push('');
        const dot = layersDot(
            sources({ ...base, 'lib/state/lazy.ts': 'const x = 1;\nawait import(where);\n' }),
            LAYERS
        );
        expect(dot).toContain(
            '"? src/lib/state/lazy.ts:2" [label="src/lib/state/lazy.ts:2 import(where)", style=dashed];'
        );
        expect(dot).toContain('"state" -> "? src/lib/state/lazy.ts:2" [style=dashed];');
        // The import is no module a layer row fails to place, so the group that names one is not
        // drawn for it.
        expect(dot).not.toContain('cluster_not placed');
    });

    it('names an import through a template literal with its file and line', () => {
        // revert: bin/diagrams/graphs.mjs:107 => for (const match of plain.matchAll(/(?<![\w$.])import\s*\(\s*(?!['"`])([^)]*)\)/g)) {
        const dot = layersDot(
            sources({ ...base, 'lib/state/lazy.ts': 'const a = 1;\nawait import(`./x/${a}`);\n' }),
            LAYERS
        );
        expect(dot).toContain('label="src/lib/state/lazy.ts:2 import(`./x/${a}`)"');
    });

    it('draws an arrow to the layer a glob imports', () => {
        // revert: bin/diagrams/graphs.mjs:111 => for (const match of text.matchAll(/(?!)/g)) {
        const dot = layersDot(
            sources({
                ...base,
                'routes/views.ts': "export const v = import.meta.glob('$lib/views/**/*.svelte');\n",
                'lib/views/a/A.svelte': '<p></p>\n'
            }),
            LAYERS
        );
        expect(dot).toContain('"routes" -> "views" [label="1"];');
    });

    it('draws a layer folders top down in their order, their imports and what each reaches outside', () => {
        // revert: bin/diagrams/graphs.mjs:212 => const [above, below] = [order[at], order[at - 1]].map((one) => quote(`folder ${one}`));
        const dot = layerDot(
            sources({
                ...base,
                'lib/state/words/text.ts':
                    "import { m } from '$lib/data/model';\nexport const t = 1;\n",
                'lib/ui/a.ts': "import { t } from '../state/words/text.ts';\n"
            }),
            LAYERS,
            'state',
            ORDER
        );
        expect(dot).toContain('"folder state" -> "folder state/words" [style=invis, weight=10];');
        expect(dot).toContain('"folder state" -> "folder state/words" [label="1"];');
        expect(dot).toContain(
            '"folder state/words" -> "layer data" [label="1", style=dashed, constraint=false];'
        );
        expect(dot).toContain('"layer data" [label="data", style=dashed];');
        // An import into the layer from another is that layer's arrow to draw, not this one's.
        expect(dot).not.toContain('"layer ui"');
    });
});

describe('the channel reader', () => {
    const base = {
        'lib/server/watch/w.ts': "hub.publish('old', {});\n",
        'lib/views/system/one/One.svelte': "<script>\nconst held = message('old');\n</script>\n"
    };

    it('finds a new channel, the module that publishes it and the view that reads it', () => {
        // revert: bin/diagrams/graphs.mjs:384 => for (const match of text.matchAll(/\.publishes\(\s*('[^']*'|\w+\([^)]*\)|[^,)]+)/g)) {
        const before = channelsDot(sources(base));
        expect(before).not.toContain('ch fresh');
        const after = channelsDot(
            sources({
                ...base,
                'lib/server/watch/w.ts': "hub.publish('old', {});\nhub.publish('fresh', {});\n",
                'lib/views/system/one/Part.svelte':
                    '<script>\nconst { entities: { fresh } } = useState();\n</script>\n',
                'lib/state/client/entities.svelte.ts':
                    "const x = {\n    fresh: () => (payload('fresh') as X | undefined) ?? null\n};\n"
            })
        );
        expect(after).toContain('"server/watch/w" -> "ch fresh";');
        expect(after).toContain('"ch fresh" -> "views/system/one";');
        expect(after).toContain('"ch old" -> "views/system/one";');
    });

    it('names a publish it cannot follow with its file and line', () => {
        // revert: bin/diagrams/graphs.mjs:394 => continue;
        const dot = channelsDot(
            sources({
                ...base,
                'lib/server/watch/w.ts': 'const a = 1;\nhub.publish(nameOf(x), {});\n'
            })
        );
        expect(dot).toMatch(
            /subgraph "cluster_lost" \{[^}]*label="src\/lib\/server\/watch\/w\.ts:2 publish\(nameOf\(x\)\)"/
        );
    });

    it('names a read through a channel that is not a literal with its file and line', () => {
        // revert: bin/diagrams/graphs.mjs:315 => delete
        const dot = channelsDot(
            sources({
                ...base,
                'lib/views/system/two/Two.svelte':
                    "<script>\nconst which = 'old';\nconst held = message(which);\n</script>\n"
            })
        );
        expect(dot).toMatch(
            /subgraph "cluster_lost" \{[^}]*label="src\/lib\/views\/system\/two\/Two\.svelte:3 message\(which\)"/
        );
        expect(dot).toContain('-> "views/system/two";');
    });

    it('names a comparison with a channel that is not a literal with its file and line', () => {
        // revert: bin/diagrams/graphs.mjs:319 => delete
        const dot = channelsDot(
            sources({
                ...base,
                'lib/views/system/two/Two.svelte': '<script>\nif (channel === NAME) {}\n</script>\n'
            })
        );
        expect(dot).toContain('label="src/lib/views/system/two/Two.svelte:2 channel === NAME"');
    });

    it('reads a literal case of a switch on the channel and names one that is not a literal', () => {
        // revert: bin/diagrams/graphs.mjs:325 => delete
        const dot = channelsDot(
            sources({
                ...base,
                'lib/views/system/two/Two.svelte':
                    "<script>\nswitch (channel) { case 'old': break; case OTHER: break; }\n</script>\n"
            })
        );
        expect(dot).toContain('"ch old" -> "views/system/two";');
        expect(dot).toContain('label="src/lib/views/system/two/Two.svelte:2 case OTHER"');
    });

    it('names a listen with no naming function with its file and line', () => {
        // revert: bin/diagrams/graphs.mjs:339 => delete
        const dot = channelsDot(
            sources({ ...base, 'lib/state/client/s.ts': 'socket.listen(handler);\n' })
        );
        expect(dot).toContain('label="src/lib/state/client/s.ts:1 .listen(handler)"');
    });

    it('names an entry of the connect list that is not a literal with its file and line', () => {
        // revert: bin/diagrams/graphs.mjs:346 => else if (false)
        const dot = channelsDot(
            sources({ ...base, 'lib/state/client/s.ts': "connect(['old', which]);\n" })
        );
        expect(dot).toContain('"ch old" -> "state/client/s" [style=dashed];');
        expect(dot).toContain('label="src/lib/state/client/s.ts:1 connect(which)"');
    });
});

describe('the write reader', () => {
    const route =
        "import { handleWrite } from '$lib/server/edit/writes';\nexport const POST = () => handleWrite();\n";
    const writes = [
        "import { hasToken } from '../core/auth.ts';",
        "import { saveOld } from './old.ts';",
        "import { isMap } from '../../data/guards.ts';",
        'export function handleWrite() {',
        '    if (!hasToken()) return json(403, {});',
        '    if (isMap(1)) saveOld();',
        '}',
        ''
    ].join('\n');
    const disk = (name: string) =>
        `import { writeFileSync } from 'node:fs';\nexport function ${name}() {\n    writeFileSync('x', 'y');\n}\n`;
    const base = {
        'routes/api/write/+server.ts': route,
        'lib/server/edit/writes.ts': writes,
        'lib/server/core/auth.ts': 'export function hasToken() {\n    return true;\n}\n',
        'lib/server/edit/old.ts': disk('saveOld'),
        'lib/data/guards.ts': 'export function isMap(x) {\n    return x;\n}\n'
    };

    it('follows the route to a new write module and on to the disk', () => {
        // revert: bin/diagrams/writes.mjs:376 => if (false) edge(path, DISK, real);
        const before = writesDot(sources(base));
        expect(before).not.toContain('lib/server/edit/fresh.ts');
        const after = writesDot(
            sources({
                ...base,
                'lib/server/edit/writes.ts': writes
                    .replace(
                        "import { saveOld } from './old.ts';",
                        "import { saveOld } from './old.ts';\nimport { saveFresh } from './fresh.ts';"
                    )
                    .replace('    if (isMap(1)) saveOld();', '    saveOld();\n    saveFresh();'),
                'lib/server/edit/fresh.ts': disk('saveFresh')
            })
        );
        expect(after).toContain('"lib/server/edit/writes.ts" -> "lib/server/edit/fresh.ts"');
        expect(after).toContain(
            '"lib/server/edit/fresh.ts" -> "file on disk" [label="writeFileSync"];'
        );
        expect(after).toContain('"routes/api/write/+server.ts" -> "lib/server/edit/writes.ts"');
    });

    it('draws a call in a condition that answers 4xx as a refusal', () => {
        // revert: bin/diagrams/writes.mjs:379 => if (held.imports.names.has(name)) follow(name, 'calls');
        expect(writesDot(sources(base))).toContain(
            '"lib/server/edit/writes.ts" -> "lib/server/core/auth.ts" [label="hasToken", style=dashed];'
        );
    });

    it('draws the modules on a path to the disk and the checks a refusal calls, and no other', () => {
        // revert: bin/diagrams/writes.mjs:406 => if (path === DISK || path.startsWith('? ')) continue;
        const dot = writesDot(sources(base));
        expect(dot).toContain('"lib/server/core/auth.ts" [label="auth.ts"];');
        // The guard the write calls writes nothing and refuses nothing, so it is left out whole.
        expect(dot).not.toContain('lib/data/guards.ts');
        // The group the modules that write nothing were drawn in is gone with them.
        expect(dot).not.toContain('writes nothing');
    });

    it('follows a dispatch table to its writer and names the call it cannot follow', () => {
        // revert: bin/diagrams/writes.mjs:157 => const COMPUTED = /(?!)/g;
        const dot = writesDot(
            sources({
                ...base,
                'lib/server/edit/writes.ts': [
                    "import { HANDLERS } from './table.ts';",
                    'export function handleWrite(kind) {',
                    '    return HANDLERS[kind]();',
                    '}',
                    ''
                ].join('\n'),
                'lib/server/edit/table.ts':
                    "import { saveOld } from './old.ts';\nexport const HANDLERS = { old: saveOld };\n"
            })
        );
        expect(dot).toMatch(
            /subgraph "cluster_lost" \{[^}]*label="src\/lib\/server\/edit\/writes\.ts:3 HANDLERS\[kind\]\("/
        );
        expect(dot).toContain(
            '"lib/server/edit/table.ts" -> "lib/server/edit/old.ts" [tooltip="saveOld", style=dotted];'
        );
        expect(dot).toContain(
            '"lib/server/edit/old.ts" -> "file on disk" [label="writeFileSync"];'
        );
    });

    it('follows a write through a namespace import of node:fs to the disk', () => {
        // revert: bin/diagrams/writes.mjs:350 => if (false) edge(path, DISK, name);
        const dot = writesDot(
            sources({
                ...base,
                'lib/server/edit/old.ts':
                    "import * as fs from 'node:fs';\nexport function saveOld() {\n    fs.writeFileSync('x', 'y');\n}\n"
            })
        );
        expect(dot).toContain(
            '"lib/server/edit/old.ts" -> "file on disk" [label="writeFileSync"];'
        );
    });

    it('names a re-export of a whole module with its file and line', () => {
        // revert: bin/diagrams/writes.mjs:190 => for (const match of text.matchAll(/(?!)/g)) {
        const dot = writesDot(
            sources({
                ...base,
                'lib/server/edit/writes.ts':
                    "import { saveOld } from './all.ts';\nexport function handleWrite() {\n    saveOld();\n}\n",
                'lib/server/edit/all.ts': "export * from './old.ts';\n"
            })
        );
        expect(dot).toContain('label="src/lib/server/edit/all.ts:1 export * from \'./old.ts\'"');
    });

    /** The one write module of `base` with its text replaced. */
    const withOld = (text: string) =>
        writesDot(sources({ ...base, 'lib/server/edit/old.ts': text }));
    const ONTO_DISK = (name: string) =>
        `"lib/server/edit/old.ts" -> "file on disk" [label="${name}"];`;

    it('follows a write through a local alias of a node:fs call to the disk', () => {
        // revert: bin/diagrams/writes.mjs:323 => const callee = site.name;
        const dot = withOld(
            [
                "import { writeFile } from 'node:fs';",
                'export function saveOld() {',
                '    const w = writeFile;',
                "    w('x', 'y');",
                '}',
                ''
            ].join('\n')
        );
        expect(dot).toContain(ONTO_DISK('writeFile'));
    });

    it('follows a write through a destructured member of node:fs and a module-level alias', () => {
        // revert: bin/diagrams/calls.mjs:148 => delete
        // revert: bin/diagrams/writes.mjs:186 => delete
        const dot = withOld(
            [
                "import * as fs from 'node:fs';",
                "import { rmSync } from 'node:fs';",
                'const drop = rmSync;',
                'export function saveOld() {',
                '    const { appendFileSync: add } = fs;',
                "    add('x', 'y');",
                "    drop('x');",
                '}',
                ''
            ].join('\n')
        );
        expect(dot).toContain(ONTO_DISK('appendFileSync, rmSync'));
    });

    it('follows an imported name that is a module-level alias of a node:fs call to the disk', () => {
        // revert: bin/diagrams/writes.mjs:335 => delete
        const dot = withOld(
            "import { writeFileSync } from 'node:fs';\nexport const saveOld = writeFileSync;\n"
        );
        expect(dot).toContain('"lib/server/edit/writes.ts" -> "lib/server/edit/old.ts"');
        expect(dot).toContain(ONTO_DISK('writeFileSync'));
    });

    it('follows a function passed by name to a function of the module that calls it', () => {
        // revert: bin/diagrams/writes.mjs:330 => delete
        const dot = withOld(
            [
                "import { writeFileSync } from 'node:fs';",
                'function locked(write: (path: string, text: string) => void, path: string) {',
                "    write(path, 'y');",
                '}',
                'export function saveOld() {',
                "    locked(writeFileSync, 'x');",
                '}',
                ''
            ].join('\n')
        );
        expect(dot).toContain(ONTO_DISK('writeFileSync'));
    });

    it('follows a passed function through an alias and a second function of the module', () => {
        // revert: bin/diagrams/writes.mjs:279 => delete
        const dot = withOld(
            [
                "import { copyFileSync, renameSync, writeFileSync } from 'node:fs';",
                'function inner(step) {',
                '    const run = step;',
                "    run('x', 'y');",
                '}',
                'function outer(step) {',
                '    inner(step);',
                '}',
                '/** Keeps its argument and never calls it, so what it is handed is not a write. */',
                'function keep(step) {',
                '    return [step];',
                '}',
                'export function saveOld() {',
                '    outer(renameSync);',
                '    keep(copyFileSync);',
                '    keep(writeFileSync);',
                '}',
                ''
            ].join('\n')
        );
        expect(dot).toContain(ONTO_DISK('renameSync'));
        expect(dot).not.toContain('copyFileSync');
        expect(dot).not.toContain('writeFileSync');
    });

    it('draws an imported function passed to a function of the module that calls it as a call', () => {
        // revert: bin/diagrams/writes.mjs:274 => delete
        const dot = writesDot(
            sources({
                ...base,
                'lib/server/edit/writes.ts': [
                    "import { saveOld } from './old.ts';",
                    'function run(step) {',
                    '    step();',
                    '}',
                    'export function handleWrite() {',
                    '    run(saveOld);',
                    '}',
                    ''
                ].join('\n')
            })
        );
        expect(dot).toContain(
            '"lib/server/edit/writes.ts" -> "lib/server/edit/old.ts" [tooltip="saveOld"];'
        );
        expect(dot).toContain(ONTO_DISK('writeFileSync'));
    });

    it('follows a function passed by name to a function of another module that calls it', () => {
        // revert: bin/diagrams/writes.mjs:325 => const target = held.decls.has(callee) ? { path, name: callee } : null;
        // revert: bin/diagrams/writes.mjs:236 => return null;
        const dot = writesDot(
            sources({
                ...base,
                'lib/server/edit/writes.ts': [
                    "import { writeFileSync, rmSync } from 'node:fs';",
                    "import { locked } from './lock.ts';",
                    "import * as guard from './guard.ts';",
                    'export function handleWrite() {',
                    "    locked(writeFileSync, 'x');",
                    "    guard.run(rmSync, 'x');",
                    '}',
                    ''
                ].join('\n'),
                'lib/server/edit/lock.ts': [
                    "import { inner } from './inner.ts';",
                    'export function locked(write, path) {',
                    '    inner(write, path);',
                    '}',
                    ''
                ].join('\n'),
                'lib/server/edit/inner.ts': 'export function inner(step, at) {\n    step(at);\n}\n',
                'lib/server/edit/guard.ts': 'export function run(step, at) {\n    step(at);\n}\n'
            })
        );
        // The write happens with the route's own node:fs names, passed on through two modules.
        expect(dot).toContain(
            '"lib/server/edit/writes.ts" -> "file on disk" [label="rmSync, writeFileSync"];'
        );
    });

    it('names a method call on an imported value with its file and line', () => {
        // revert: bin/diagrams/writes.mjs:357 => } else if (false) {
        const dot = writesDot(
            sources({
                ...base,
                'lib/server/edit/writes.ts':
                    "import { RULE } from './rule.ts';\nexport function handleWrite() {\n    RULE.test('x');\n}\n",
                'lib/server/edit/rule.ts': 'export const RULE = /x/;\n'
            })
        );
        expect(dot).toContain('label="src/lib/server/edit/writes.ts:3 RULE.test("');
    });
});

describe('the rendered drawing', () => {
    it('has no colour of its own and nothing opaque behind it', async () => {
        // revert: bin/diagrams/diagrams.mjs:103 => .replace(/(stroke|fill)="none"/g, '$1="currentColor"')
        const svg = await renderSvg(
            layersDot(sources({ 'lib/ui/a.ts': "import '../data/b';\n" }), LAYERS)
        );
        expect(svg).toContain('stroke="currentColor"');
        expect(svg).not.toMatch(/"(?:black|white)"/);
        expect(svg).not.toMatch(/<text (?![^>]*fill="currentColor")/);
        expect(svg).not.toContain('Generated by');
    }, 30_000);

    it('carries its own grey for a light and a dark viewer outside oculus', async () => {
        // revert: bin/diagrams/diagrams.mjs:97 => delete
        const svg = await renderSvg(layersDot(sources({ 'lib/ui/a.ts': '' }), LAYERS));
        expect(svg).toMatch(
            /^<svg[^>]*>\n<style>svg \{ color: #333333; \} @media \(prefers-color-scheme: dark\) \{ svg \{ color: #cccccc; background: #1e1e1e; \} \}<\/style>/
        );
    }, 30_000);

    it('carries the functions a write edge calls in the edge title, with no link around it', async () => {
        // revert: bin/diagrams/diagrams.mjs:99 => /(?!)/g,
        const svg = await renderSvg(
            writesDot(
                sources({
                    'routes/api/write/+server.ts':
                        "import { save, load } from '$lib/server/edit/writes';\nexport const POST = () => save(load());\n",
                    'lib/server/edit/writes.ts':
                        "import { writeFileSync } from 'node:fs';\nexport function save() {\n    writeFileSync('x', 'y');\n}\nexport function load() {\n    return 1;\n}\n"
                })
            )
        );
        expect(svg).toContain(
            '<title>routes/api/write/+server.ts&#45;&gt;lib/server/edit/writes.ts: load, save</title>'
        );
        expect(svg).not.toContain('<a ');
    }, 30_000);
});
