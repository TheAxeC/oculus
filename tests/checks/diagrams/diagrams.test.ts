// The diagrams of docs/diagrams/ against the source they are drawn from.
//
// The first case runs utils/diagrams/diagrams.mjs's staleFiles() in memory over this tree and
// fails, naming every committed `.dot` and `.svg` that differs from what the source gives now, byte
// for byte; the second shows it does so for a source change, over a copy of the tree with one
// import and one publish added, and that the diagrams share one cache of parses: the engine's
// generation parses each file once for its imports and once for its code, the copy's the two
// changed files alone. The cases after them hand the readers a small source of their own and show
// that each finds what a change adds (a new import, a new channel, a new write module), that the
// overview and each layer's diagram count runtime imports and leave a type-only one out, and that
// what a reader cannot place or follow is drawn, with its file and line, in a group that says so.
// The last cases hold the rendered file to its colours, its edge titles and its standalone style.
//
// The copy of the tree is made under the system temporary directory and removed after the run;
// nothing else is written. What this does not cover is the Help view drawing a diagram.

import { appendFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import { codeOf } from '../../../utils/diagrams/code.mjs';
import {
    BOUNDARIES,
    NAMES,
    ORDERING,
    OUT,
    channelsDot,
    generate,
    halves,
    importsOf as drawnImports,
    labelledEdge,
    labelsAcross,
    layerDot,
    layersDot,
    readLayers,
    readOrder,
    readSources,
    renderSvg,
    staleFiles,
    writesDot
} from '../../../utils/diagrams/diagrams.mjs';
import { importsOf } from '../../../utils/diagrams/imports.mjs';
import { it } from '../../fixtures/scratch.ts';
import { CountedCache, ENGINE, copyOfTree, parsedSince } from './tree.ts';

// The two parsers wrapped in counters that call the real ones, so a case sees what was parsed.
vi.mock('../../../utils/diagrams/imports.mjs', async (original) =>
    (await import('./counted.ts')).counted(await original<Record<string, unknown>>(), 'importsOf')
);
vi.mock('../../../utils/diagrams/code.mjs', async (original) =>
    (await import('./counted.ts')).counted(await original<Record<string, unknown>>(), 'codeOf')
);

// The engine's drawings take seconds to generate, so the cases over them share one generation,
// made by the first of them that runs; a case that reads no engine drawing never waits for it. Its
// parses, and the paths each of PARSERS was called with during it, are kept for the file's cases.
const parses = new CountedCache<import('../../../utils/diagrams/parsed.mjs').Parsed>();
const PARSERS = [importsOf, codeOf];
const engineParsed: string[][] = [];
let engineGenerated: ReturnType<typeof generate> | null = null;
function engineDrawn(): ReturnType<typeof generate> {
    engineGenerated ??= (async () => {
        const from = PARSERS.map((one) => parsedSince(one, 0).length);
        const drawn = await generate(ENGINE, parses);
        engineParsed.push(...PARSERS.map((one, at) => parsedSince(one, from[at])));
        return drawn;
    })();
    return engineGenerated;
}

/** The layer rows the synthetic sources are placed by, the shape of the boundary test's own. */
const LAYERS = ['data', 'server', 'state', 'ui', 'views'];

/** The lines of one arrow that carries words, as the readers write it, joined for a search. */
function arrow(from: string, to: string, words: string, attrs = '', kind = ''): string {
    return labelledEdge(from, to, words, attrs, kind).join('\n');
}

/** A source map from path and text pairs, the shape readSources gives. */
function sources(files: Record<string, string>): Map<string, string> {
    return new Map(Object.entries(files));
}

describe('the committed diagrams', () => {
    it('are what the source gives now, each file byte for byte', async () => {
        expect(await staleFiles(ENGINE, await engineDrawn()), 'run npm run diagrams').toEqual([]);
    }, 60_000);

    it('are named stale, every one at once, when an import and a publish are added', async () => {
        await engineDrawn();
        const files = [...readSources(ENGINE).keys()].sort();
        expect([...parses.sets].sort()).toEqual(files);
        expect(engineParsed).toEqual([files, files]);
        const dir = copyOfTree();
        appendFileSync(join(dir, 'src/lib/ui/html.ts'), "import '../server/core/auth.ts';\n");
        appendFileSync(
            join(dir, 'src/lib/server/root/watch/git.ts'),
            "hub.publish('brandnew', {});\n"
        );
        const [sets, from] = [parses.sets.length, PARSERS.map((one) => parsedSince(one, 0).length)];
        const stale = await staleFiles(dir, undefined, parses);
        const changed = ['lib/server/root/watch/git.ts', 'lib/ui/html.ts'];
        expect(parses.sets.slice(sets).sort()).toEqual(changed);
        expect(PARSERS.map((one, at) => parsedSince(one, from[at]))).toEqual([changed, changed]);
        expect(stale).toEqual([
            `${OUT}/layers.dot`,
            `${OUT}/layers.svg`,
            `${OUT}/layer-ui.dot`,
            `${OUT}/layer-ui.svg`,
            `${OUT}/channels.dot`,
            `${OUT}/channels.svg`
        ]);
    }, 60_000);

    it('are the overview, one diagram per layer the order names, and the channels and writes', () => {
        const order = readOrder(readFileSync(join(ENGINE, ORDERING), 'utf8'));
        expect(NAMES).toEqual([
            'layers',
            ...[...order.keys()].map((layer) => `layer-${layer}`),
            'channels',
            'writes'
        ]);
    });

    it('reads the layer rows from the boundary test and refuses a test that names none', () => {
        const text = readFileSync(join(ENGINE, BOUNDARIES), 'utf8');
        expect(readLayers(text)).toContain('server/transcripts');
        expect(() => readLayers('const OTHER = [];')).toThrow(/declares no LAYERS list/);
    });

    it('reads the folder order the checks declare and refuses a file that declares none', () => {
        const text = readFileSync(join(ENGINE, ORDERING), 'utf8');
        expect(readOrder(text).get('ui')?.at(-1)).toBe('ui');
        expect(readOrder(text).get('server')?.[0]).toBe('server/root');
        expect(() => readOrder('const OTHER = {};')).toThrow(/declares no ORDER/);
    });

    it('reads imports with the one reader the import checks read them with', () => {
        // The diagrams and the checks both call utils/diagrams/imports.mjs, so they read alike.
        expect(drawnImports).toBe(importsOf);
    });
});

describe('the layer readers', () => {
    const base = {
        'lib/state/store.ts': "import { t } from '$lib/state/shared/words/text';\n",
        'lib/state/shared/words/text.ts': 'export const t = 1;\n',
        'lib/data/model.ts': 'export type Model = {};\n'
    };
    const ORDER = ['state', 'state/shared'];

    it('draws one arrow per pair of layers, labelled with its runtime imports', () => {
        const before = layersDot(sources(base), LAYERS);
        // The base's one import stays inside the state layer, which the overview does not draw.
        expect(before).not.toContain('-> "data"');
        const after = layersDot(
            sources({
                ...base,
                'lib/state/store.ts': `${base['lib/state/store.ts']}import { m } from '../data/model.ts';\n`,
                'lib/state/shared/words/text.ts':
                    "import { m } from '$lib/data/model';\nexport const t = 1;\n"
            }),
            LAYERS
        );
        expect(after).toContain(arrow('state', 'data', '2'));
    });

    it('leaves a type-only import out of every count', () => {
        const dot = layersDot(
            sources({ ...base, 'lib/ui/a.ts': "import type { Model } from '../data/model.ts';\n" }),
            LAYERS
        );
        // A type-only import leaves nothing behind in the compiled module, so it joins no layers.
        expect(dot).not.toContain('"ui to data"');
    });

    it('counts no import a comment names, above a type-only import or in a block', () => {
        const dot = layersDot(
            sources({
                ...base,
                'lib/ui/a.ts':
                    "// the shape is read as an import is.\nimport type { Model } from '../data/model.ts';\n/* import { m } from '../data/model.ts'; */\n"
            }),
            LAYERS
        );
        // Both statements in the comments are prose, and the one import is type-only.
        expect(dot).not.toContain('"ui to data"');
    });

    it('draws the entry loading the built app as its arrow to the routes, with no lost box', () => {
        const dot = layersDot(
            sources({
                ...base,
                'server.ts':
                    "const built = new URL('../build/handler.js', import.meta.url).href;\nconst { handler } = await import(built);\n",
                'routes/+page.svelte':
                    "<script>\n    import { t } from '$lib/state/shared/words/text';\n</script>\n"
            }),
            LAYERS
        );
        expect(dot).toContain(arrow('src', 'routes', '1'));
        // The built app is followed, so nothing is left for the dashed box of what is not.
        expect(dot).not.toContain('style=dashed');
    });

    it('names a module no layer row places that an import joins, in a group that says so', () => {
        const dot = layersDot(
            sources({
                ...base,
                'lib/state/uses.ts': "import { odd } from '../extra/odd.ts';\n",
                'lib/extra/odd.ts': 'export const odd = 1;\n'
            }),
            LAYERS
        );
        expect(dot).toMatch(/subgraph "cluster_not placed" \{\n[^}]*\[label="extra"\];/);
        expect(dot).toContain(arrow('state', 'not placed: extra', '1'));
    });

    it('draws no node that no import joins, an asset by its folder, and one entry node', () => {
        const dot = layersDot(
            sources({
                ...base,
                'lib/lonely.d.ts': 'declare const x: number;\n',
                'routes/+layout.svelte':
                    "<script>\n    import favicon from '$lib/assets/favicon.svg';\n    import { t } from '$lib/state/shared/words/text';\n</script>\n",
                'server.ts': "import { m } from './lib/data/model.ts';\n",
                'hooks.server.ts': "import { t } from './lib/state/shared/words/text.ts';\n"
            }),
            LAYERS
        );
        // The declaration file is imported by nothing and imports nothing, so no arrow reaches it.
        expect(dot).not.toContain('lonely');
        // The favicon is an image a page links to, drawn by its folder outside every layer.
        expect(dot).toContain('"files: assets" [label="assets"];');
        expect(dot).toContain(arrow('routes', 'files: assets', '1'));
        expect(dot).toContain('"src" [label="entry"];');
        expect(dot).toContain(arrow('src', 'data', '1'));
        expect(dot).toContain(arrow('src', 'state', '1'));
        // Nothing here is a module no rule places, so the group that names one is not drawn.
        expect(dot).not.toContain('cluster_not placed');
    });

    it('names an import it cannot follow with its file and line, joined to its own layer', () => {
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
        const dot = layersDot(
            sources({ ...base, 'lib/state/lazy.ts': 'const a = 1;\nawait import(`./x/${a}`);\n' }),
            LAYERS
        );
        expect(dot).toContain('label="src/lib/state/lazy.ts:2 import(`./x/${a}`)"');
    });

    it('draws an arrow to the layer a glob imports', () => {
        const dot = layersDot(
            sources({
                ...base,
                'routes/views.ts': "export const v = import.meta.glob('$lib/views/**/*.svelte');\n",
                'lib/views/a/A.svelte': '<p></p>\n'
            }),
            LAYERS
        );
        expect(dot).toContain(arrow('routes', 'views', '1'));
    });

    it('draws a layer folders top down in their order, their imports and what each reaches outside', () => {
        const dot = layerDot(
            sources({
                ...base,
                'lib/state/shared/words/text.ts':
                    "import { m } from '$lib/data/model';\nexport const t = 1;\n",
                'lib/ui/a.ts': "import { t } from '../state/shared/words/text.ts';\n"
            }),
            LAYERS,
            'state',
            ORDER
        );
        expect(dot).toContain(
            '"folder state" -> "folder state/shared" [style=invis, weight=10, minlen=2];'
        );
        expect(dot).toContain(
            halves(
                'folder state',
                'folder state to folder state/shared',
                'folder state/shared',
                '',
                'minlen=1, weight=10'
            ).join('\n')
        );
        const box = 'layer data from folder state/shared';
        expect(dot).toContain(
            halves(
                'folder state/shared',
                'folder state/shared to layer data',
                box,
                'style=dashed'
            ).join('\n')
        );
        expect(dot).toContain(`"${box}" [label="data", style=dashed];`);
        // An import into the layer from another is that layer's arrow to draw, not this one's.
        expect(dot).not.toContain('"layer ui');
    });
});

describe('the channel reader', () => {
    const base = {
        'lib/server/watch/w.ts': "hub.publish('old', {});\n",
        'lib/views/system/one/One.svelte': "<script>\nconst held = message('old');\n</script>\n"
    };

    it('finds a new channel, the module that publishes it and the view that reads it', () => {
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
        const dot = channelsDot(
            sources({
                ...base,
                'lib/views/system/two/Two.svelte': '<script>\nif (channel === NAME) {}\n</script>\n'
            })
        );
        expect(dot).toContain('label="src/lib/views/system/two/Two.svelte:2 channel === NAME"');
    });

    it('reads a literal case of a switch on the channel and names one that is not a literal', () => {
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
        const dot = channelsDot(
            sources({ ...base, 'lib/state/client/s.ts': 'socket.listen(handler);\n' })
        );
        expect(dot).toContain('label="src/lib/state/client/s.ts:1 .listen(handler)"');
    });

    it('names an entry of the connect list that is not a literal with its file and line', () => {
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
        '    if (!hasToken()) return json({}, { status: 403 });',
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
            arrow('lib/server/edit/fresh.ts', 'file on disk', 'writeFileSync', '', 'calls')
        );
        expect(after).toContain('"routes/api/write/+server.ts" -> "lib/server/edit/writes.ts"');
    });

    it('draws a call in a condition that answers 4xx as a refusal', () => {
        expect(writesDot(sources(base))).toContain(
            arrow(
                'lib/server/edit/writes.ts',
                'lib/server/core/auth.ts',
                'hasToken',
                'style=dashed',
                'refuses'
            )
        );
    });

    it('draws the call whose Response is handed back as a refusal, and no answer outside 4xx', () => {
        const handed = writes.replace(
            '    if (!hasToken()) return json({}, { status: 403 });',
            [
                '    const read = await hasToken(request, token);',
                '    if (read instanceof Response) return read;',
                '    if (isMap(2)) return json({}, { status: 500 });',
                '    if (isMap(3)) return json({ status: 404 });'
            ].join('\n')
        );
        const dot = writesDot(sources({ ...base, 'lib/server/edit/writes.ts': handed }));
        expect(dot).toContain(
            arrow(
                'lib/server/edit/writes.ts',
                'lib/server/core/auth.ts',
                'hasToken',
                'style=dashed',
                'refuses'
            )
        );
        // A 500, and a body that merely holds a status key, answer no refusal.
        expect(dot).not.toContain('lib/data/guards.ts');
    });

    it('draws the modules on a path to the disk and the checks a refusal calls, and no other', () => {
        const dot = writesDot(sources(base));
        expect(dot).toContain('"lib/server/core/auth.ts" [label="auth.ts"];');
        // The guard the write calls writes nothing and refuses nothing, so it is left out whole.
        expect(dot).not.toContain('lib/data/guards.ts');
        // The group the modules that write nothing were drawn in is gone with them.
        expect(dot).not.toContain('writes nothing');
    });

    it('follows a dispatch table to its writer and names the call it cannot follow', () => {
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
            arrow('lib/server/edit/old.ts', 'file on disk', 'writeFileSync', '', 'calls')
        );
    });

    it('follows a write through a namespace import of node:fs to the disk', () => {
        const dot = writesDot(
            sources({
                ...base,
                'lib/server/edit/old.ts':
                    "import * as fs from 'node:fs';\nexport function saveOld() {\n    fs.writeFileSync('x', 'y');\n}\n"
            })
        );
        expect(dot).toContain(
            arrow('lib/server/edit/old.ts', 'file on disk', 'writeFileSync', '', 'calls')
        );
    });

    it('names a re-export of a whole module with its file and line', () => {
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
        arrow('lib/server/edit/old.ts', 'file on disk', name, '', 'calls');

    it('follows a write through a local alias of a node:fs call to the disk', () => {
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
        const dot = withOld(
            "import { writeFileSync } from 'node:fs';\nexport const saveOld = writeFileSync;\n"
        );
        expect(dot).toContain('"lib/server/edit/writes.ts" -> "lib/server/edit/old.ts"');
        expect(dot).toContain(ONTO_DISK('writeFileSync'));
    });

    it('follows a function passed by name to a function of the module that calls it', () => {
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
            arrow('lib/server/edit/writes.ts', 'file on disk', 'rmSync, writeFileSync', '', 'calls')
        );
    });

    it('names a method call on an imported value with its file and line', () => {
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

describe('where the words of an arrow land', () => {
    // Four arrows as Graphviz drew them with the count as an edge label: in each pair the curve of
    // the second runs through the count of the first between any two of forty sample points.
    const SERVER = [
        '<svg>',
        `<g id="edge18" class="edge">
<title>folder server/edit&#45;&gt;folder server/files</title>
<path fill="none" stroke="currentColor" d="M388.99,-631.35C375.02,-625 358.84,-615.59 348,-602.8 336.2,-588.88 337.16,-582.17 334,-564.2 322.5,-498.75 312.21,-475.17 340,-414.8 344.03,-406.04 350.74,-397.87 357.22,-391.31"/>
<polygon fill="currentColor" stroke="currentColor" points="358.58,-392.92 361.45,-387.24 355.67,-389.89 358.58,-392.92"/>
<text fill="currentColor" xml:space="preserve" text-anchor="middle" x="326.8" y="-506.4" font-family="Helvetica,Arial,sans-serif" font-size="8.00">2</text>
</g>
`,
        `<g id="edge27" class="edge">
<title>folder server/machine&#45;&gt;folder server/core</title>
<path fill="none" stroke="currentColor" d="M388.65,-542.12C334.56,-520.49 222,-464.79 222,-376 222,-376 222,-376 222,-106.4 222,-34.43 478.05,-27.42 577.32,-27.4"/>
<polygon fill="currentColor" stroke="currentColor" points="577.24,-29.5 583.24,-27.41 577.24,-25.3 577.24,-29.5"/>
<text fill="currentColor" xml:space="preserve" text-anchor="middle" x="224" y="-283.4" font-family="Helvetica,Arial,sans-serif" font-size="8.00">4</text>
</g>
`,
        '</svg>'
    ].join('\n');
    const VIEWS = [
        '<svg>',
        `<g id="edge14" class="edge">
<title>folder views/boards&#45;&gt;layer ui</title>
<path fill="none" stroke="currentColor" stroke-dasharray="5,2" d="M92.47,-492.91C180.59,-501.18 416.51,-523.61 613,-545 628.99,-546.74 646.7,-548.81 661.63,-550.6"/>
<polygon fill="currentColor" stroke="currentColor" points="661.01,-552.64 667.22,-551.27 661.52,-548.47 661.01,-552.64"/>
<text fill="currentColor" xml:space="preserve" text-anchor="middle" x="433.63" y="-519.8" font-family="Helvetica,Arial,sans-serif" font-size="8.00">85</text>
</g>
`,
        `<g id="edge26" class="edge">
<title>folder views/sources&#45;&gt;layer state</title>
<path fill="none" stroke="currentColor" stroke-dasharray="5,2" d="M94.05,-223.13C140.87,-226.62 218.32,-234.37 243,-248.6 376.34,-325.49 320.04,-442.97 449,-527 476.36,-544.83 513.43,-551.37 540.26,-553.69"/>
<polygon fill="currentColor" stroke="currentColor" points="539.9,-555.77 546.04,-554.13 540.21,-551.58 539.9,-555.77"/>
<text fill="currentColor" xml:space="preserve" text-anchor="middle" x="356.32" y="-385.4" font-family="Helvetica,Arial,sans-serif" font-size="8.00">103</text>
</g>
`,
        '</svg>'
    ].join('\n');

    it('names a count a curve runs through, testing each segment of the curve exactly', () => {
        expect(labelsAcross(SERVER)).toEqual([
            'folder server/edit->folder server/files label 2 across folder server/machine->folder server/core'
        ]);
        expect(labelsAcross(VIEWS)).toEqual([
            'folder views/boards->layer ui label 85 across folder views/sources->layer state'
        ]);
    });

    it('takes the halves through a word node as its own when the names hold a colon', () => {
        const svg = [
            '<svg>',
            `<g id="node3" class="node">
<title>files: a to b</title>
<polygon fill="none" stroke="none" points="-10,-10 10,-10 10,10 -10,10 -10,-10"/>
<text fill="currentColor" xml:space="preserve" text-anchor="middle" x="0" y="2" font-family="Helvetica,Arial,sans-serif" font-size="8.00">4</text>
</g>`,
            `<g id="edge1" class="edge">
<title>files: a&#45;&gt;files: a to b</title>
<path fill="none" stroke="currentColor" d="M-40,0C-30,0 -20,0 -5,0"/>
</g>`,
            '</svg>'
        ].join('\n');
        // The half runs into the node it carries its count through, which is no crossing.
        expect(labelsAcross(svg)).toEqual([]);
    });

    it('names a count that lies wholly inside the head of another arrow', () => {
        const svg = [
            '<svg>',
            `<g id="edge1" class="edge">
<title>a&#45;&gt;b</title>
<path fill="none" stroke="currentColor" d="M-300,-300C-290,-300 -280,-300 -270,-300"/>
<text fill="currentColor" xml:space="preserve" text-anchor="middle" x="0" y="2" font-family="Helvetica,Arial,sans-serif" font-size="8.00">7</text>
</g>`,
            `<g id="edge2" class="edge">
<title>c&#45;&gt;d</title>
<path fill="none" stroke="currentColor" d="M300,300C290,300 280,300 270,300"/>
<polygon fill="currentColor" stroke="currentColor" points="-50,-50 50,-50 50,50 -50,50 -50,-50"/>
</g>`,
            '</svg>'
        ].join('\n');
        // The head's edges pass the count by, and the head covers it.
        expect(labelsAcross(svg)).toEqual(['a->b label 7 across c->d']);
    });

    it('reads a label node by the box Graphviz drew for it, the two halves through it its own', async () => {
        const dot = [
            'digraph g {',
            '    graph [rankdir=TB];',
            ...labelledEdge('a', 'b', '12'),
            ...labelledEdge('c', 'b', '3', 'style=dashed'),
            '}',
            ''
        ].join('\n');
        const svg = await renderSvg(dot);
        // Each arrow's two halves run through its own box and around the other's.
        expect(labelsAcross(svg)).toEqual([]);
        const moved = svg.replace(
            /(<title>a to b<\/title>\n<polygon[^>]* points=")[^"]+"/,
            (_, head: string) => `${head}-1000,-1000 1000,-1000 1000,1000 -1000,1000 -1000,-1000"`
        );
        // A box grown over the whole drawing sits across the other arrow's halves.
        expect(labelsAcross(moved)).toEqual([
            'a to b label 12 across c to b->b',
            'a to b label 12 across c->c to b'
        ]);
    }, 30_000);

    it('draws an arrow with words in two halves in its own style through a node of the words', () => {
        const lines = labelledEdge('x', 'y', '5', 'style=dashed', 'refuses');
        expect(lines[0]).toContain('"x to y (refuses)" [label="5", ');
        expect(lines[1]).toBe('    "x" -> "x to y (refuses)" [arrowhead=none, style=dashed];');
        expect(lines[2]).toBe('    "x to y (refuses)" -> "y" [style=dashed];');
    });

    it('are clear of every other arrow in every drawing the source gives', async () => {
        const drawn = await engineDrawn();
        expect(drawn.map((one) => one.name)).toEqual(NAMES);
        const crossed = drawn.flatMap((one) =>
            labelsAcross(one.svg).map((line) => `${one.name}: ${line}`)
        );
        // Each count and call list is a node on its arrow; the router keeps other arrows off it.
        expect(crossed).toEqual([]);
    }, 60_000);
});

describe('the rendered drawing', () => {
    it('has no colour of its own and nothing opaque behind it', async () => {
        const svg = await renderSvg(
            layersDot(sources({ 'lib/ui/a.ts': "import '../data/b';\n" }), LAYERS)
        );
        expect(svg).toContain('stroke="currentColor"');
        expect(svg).not.toMatch(/"(?:black|white)"/);
        expect(svg).not.toMatch(/<text (?![^>]*fill="currentColor")/);
        expect(svg).not.toContain('Generated by');
    }, 30_000);

    it('carries its own grey for a light and a dark viewer outside oculus', async () => {
        const svg = await renderSvg(layersDot(sources({ 'lib/ui/a.ts': '' }), LAYERS));
        expect(svg).toMatch(
            /^<svg[^>]*>\n<style>svg \{ color: #333333; \} @media \(prefers-color-scheme: dark\) \{ svg \{ color: #cccccc; background: #1e1e1e; \} \}<\/style>/
        );
    }, 30_000);

    it('carries the functions a write edge calls in the edge title, with no link around it', async () => {
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
