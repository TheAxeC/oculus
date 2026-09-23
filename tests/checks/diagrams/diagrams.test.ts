// The three diagrams of docs/diagrams/ against the source they are drawn from.
//
// The first case runs bin/diagrams.mjs's staleFiles() in memory over this tree and fails, naming
// every committed `.dot` and `.svg` that differs from what the source gives now, byte for byte; the
// second shows it does so for a source change, over a copy of the tree with one import and one
// publish added. The cases after them hand the three readers a small source of their own and show
// that each finds what a change adds (a new import, a new channel, a new write module), and that
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
    OUT,
    channelsDot,
    layersDot,
    readLayers,
    renderSvg,
    staleFiles,
    writesDot
} from '../../../bin/diagrams.mjs';
import { scratchDir, sweepScratch } from '../../fixtures/scratch.ts';

afterAll(sweepScratch);

const ENGINE = resolve(fileURLToPath(import.meta.url), '..', '..', '..', '..');

/** The layer rows the synthetic sources are placed by, the shape of the boundary test's own. */
const LAYERS = ['data', 'server', 'state', 'ui', 'views'];

/** A source map from path and text pairs, the shape readSources gives. */
function sources(files: Record<string, string>): Map<string, string> {
    return new Map(Object.entries(files));
}

/** A copy of what the generator reads (src, the boundary test, the committed diagrams). */
function copyOfTree(): string {
    const dir = scratchDir('oculus-diagrams-tree-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    for (const part of ['src', BOUNDARIES, OUT]) {
        mkdirSync(dirname(join(dir, part)), { recursive: true });
        cpSync(join(ENGINE, part), join(dir, part), { recursive: true });
    }
    return dir;
}

describe('the committed diagrams', () => {
    it('are what the source gives now, each file byte for byte', async () => {
        // revert: bin/diagrams.mjs:175 => `    node [shape=ellipse];`,
        expect(await staleFiles(ENGINE), 'run node bin/diagrams.mjs').toEqual([]);
    }, 60_000);

    it('are named stale, every one at once, when an import and a publish are added', async () => {
        // revert: bin/diagrams.mjs:879 => if (!existsSync(path)) stale.push(file);
        const dir = copyOfTree();
        appendFileSync(join(dir, 'src/lib/ui/html.ts'), "import '../server/core/auth.ts';\n");
        appendFileSync(join(dir, 'src/lib/server/watch/git.ts'), "hub.publish('brandnew', {});\n");
        expect(await staleFiles(dir)).toEqual([
            `${OUT}/layers.dot`,
            `${OUT}/layers.svg`,
            `${OUT}/channels.dot`,
            `${OUT}/channels.svg`
        ]);
    }, 60_000);

    it('reads the layer rows from the boundary test and refuses a test that names none', () => {
        // revert: bin/diagrams.mjs:113 => if (found === null) return [];
        const text = readFileSync(join(ENGINE, BOUNDARIES), 'utf8');
        expect(readLayers(text)).toContain('server/transcripts');
        expect(() => readLayers('const OTHER = [];')).toThrow(/declares no LAYERS list/);
    });
});

describe('the layer reader', () => {
    const base = {
        'lib/state/store.ts': "import { t } from '$lib/state/words/text';\n",
        'lib/state/words/text.ts': 'export const t = 1;\n',
        'lib/data/model.ts': 'export type Model = {};\n'
    };

    it('draws an edge for a new import between two folders', () => {
        // revert: bin/diagrams.mjs:275 => if (false) edges.add(`${quote(from.node)} -> ${quote(to.node)};`);
        const before = layersDot(sources(base), LAYERS);
        expect(before).not.toContain('"state" -> "data"');
        const after = layersDot(
            sources({
                ...base,
                'lib/state/store.ts': `${base['lib/state/store.ts']}import type { Model } from '../data/model.ts';\n`
            }),
            LAYERS
        );
        expect(after).toContain('"state" -> "data";');
        expect(after).toContain('"state" -> "state/words";');
    });

    it('names a module no layer row places, in a group that says so', () => {
        // revert: bin/diagrams.mjs:228 => if (layer === undefined) return { layer: 'data', node: 'data' };
        const dot = layersDot(sources({ ...base, 'lib/extra/odd.ts': 'export {};\n' }), LAYERS);
        expect(dot).toMatch(/subgraph "cluster_not placed" \{\n[^}]*"extra";/);
    });

    it('names an import it cannot follow with its file and line', () => {
        // revert: bin/diagrams.mjs:258 => for (const match of plain.matchAll(/(?!)/g)) {
        const dot = layersDot(
            sources({ ...base, 'lib/state/lazy.ts': 'const x = 1;\nawait import(where);\n' }),
            LAYERS
        );
        expect(dot).toMatch(
            /subgraph "cluster_not placed" \{[^}]*label="src\/lib\/state\/lazy\.ts:2 import\(where\)"/
        );
    });

    it('names an import through a template literal with its file and line', () => {
        // revert: bin/diagrams.mjs:258 => for (const match of plain.matchAll(/(?<![\w$.])import\s*\(\s*(?!['"`])([^)]*)\)/g)) {
        const dot = layersDot(
            sources({ ...base, 'lib/state/lazy.ts': 'const a = 1;\nawait import(`./x/${a}`);\n' }),
            LAYERS
        );
        expect(dot).toContain('label="src/lib/state/lazy.ts:2 import(`./x/${a}`)"');
    });

    it('draws an edge to the folder a glob imports', () => {
        // revert: bin/diagrams.mjs:264 => for (const match of text.matchAll(/(?!)/g)) {
        const dot = layersDot(
            sources({
                ...base,
                'routes/views.ts': "export const v = import.meta.glob('$lib/views/**/*.svelte');\n",
                'lib/views/a/A.svelte': '<p></p>\n'
            }),
            LAYERS
        );
        expect(dot).toContain('"routes" -> "views";');
    });
});

describe('the channel reader', () => {
    const base = {
        'lib/server/watch/w.ts': "hub.publish('old', {});\n",
        'lib/views/system/one/One.svelte': "<script>\nconst held = message('old');\n</script>\n"
    };

    it('finds a new channel, the module that publishes it and the view that reads it', () => {
        // revert: bin/diagrams.mjs:449 => for (const match of text.matchAll(/\.publishes\(\s*('[^']*'|\w+\([^)]*\)|[^,)]+)/g)) {
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
        // revert: bin/diagrams.mjs:459 => continue;
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
        // revert: bin/diagrams.mjs:373 => delete
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
        // revert: bin/diagrams.mjs:384 => delete
        const dot = channelsDot(
            sources({
                ...base,
                'lib/views/system/two/Two.svelte': '<script>\nif (channel === NAME) {}\n</script>\n'
            })
        );
        expect(dot).toContain('label="src/lib/views/system/two/Two.svelte:2 channel === NAME"');
    });

    it('reads a literal case of a switch on the channel and names one that is not a literal', () => {
        // revert: bin/diagrams.mjs:390 => delete
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
        // revert: bin/diagrams.mjs:404 => delete
        const dot = channelsDot(
            sources({ ...base, 'lib/state/client/s.ts': 'socket.listen(handler);\n' })
        );
        expect(dot).toContain('label="src/lib/state/client/s.ts:1 .listen(handler)"');
    });

    it('names an entry of the connect list that is not a literal with its file and line', () => {
        // revert: bin/diagrams.mjs:411 => else if (false)
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
        // revert: bin/diagrams.mjs:709 => if (false) edge(path, DISK, real);
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
        // revert: bin/diagrams.mjs:712 => if (held.imports.names.has(name)) follow(name, 'calls');
        expect(writesDot(sources(base))).toContain(
            '"lib/server/edit/writes.ts" -> "lib/server/core/auth.ts" [label="hasToken", style=dashed];'
        );
    });

    it('draws every module it reaches, the ones that write nothing in a group that says so', () => {
        // revert: bin/diagrams.mjs:749 => const folder = posix.dirname(path); if (!writing.has(path)) continue;
        const dot = writesDot(sources(base));
        expect(dot).toMatch(
            /subgraph "cluster_reached, writes nothing" \{[^}]*"lib\/data\/guards\.ts" \[label="data\/guards\.ts"\];[^}]*"lib\/server\/core\/auth\.ts"/
        );
        expect(dot).toContain(
            '"lib/server/edit/writes.ts" -> "lib/data/guards.ts" [tooltip="isMap"];'
        );
    });

    it('follows a dispatch table to its writer and names the call it cannot follow', () => {
        // revert: bin/diagrams.mjs:612 => const COMPUTED = /(?!)/g;
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
        // revert: bin/diagrams.mjs:725 => if (false) edge(path, DISK, match[2]);
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
        // revert: bin/diagrams.mjs:640 => for (const match of text.matchAll(/(?!)/g)) {
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

    it('names a method call on an imported value with its file and line', () => {
        // revert: bin/diagrams.mjs:732 => } else if (false) {
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
        // revert: bin/diagrams.mjs:837 => .replace(/(stroke|fill)="none"/g, '$1="currentColor"')
        const svg = await renderSvg(
            layersDot(sources({ 'lib/ui/a.ts': "import '../data/b';\n" }), LAYERS)
        );
        expect(svg).toContain('stroke="currentColor"');
        expect(svg).not.toMatch(/"(?:black|white)"/);
        expect(svg).not.toMatch(/<text (?![^>]*fill="currentColor")/);
        expect(svg).not.toContain('Generated by');
    }, 30_000);

    it('carries its own grey for a light and a dark viewer outside oculus', async () => {
        // revert: bin/diagrams.mjs:831 => delete
        const svg = await renderSvg(layersDot(sources({ 'lib/ui/a.ts': '' }), LAYERS));
        expect(svg).toMatch(
            /^<svg[^>]*>\n<style>svg \{ color: #333333; \} @media \(prefers-color-scheme: dark\) \{ svg \{ color: #cccccc; background: #1e1e1e; \} \}<\/style>/
        );
    }, 30_000);

    it('carries the functions a write edge calls in the edge title, with no link around it', async () => {
        // revert: bin/diagrams.mjs:833 => /(?!)/g,
        const svg = await renderSvg(
            writesDot(
                sources({
                    'routes/api/write/+server.ts':
                        "import { save, load } from '$lib/server/edit/writes';\nexport const POST = () => save(load());\n",
                    'lib/server/edit/writes.ts':
                        'export function save() {\n    return 1;\n}\nexport function load() {\n    return 1;\n}\n'
                })
            )
        );
        expect(svg).toContain(
            '<title>routes/api/write/+server.ts&#45;&gt;lib/server/edit/writes.ts: load, save</title>'
        );
        expect(svg).not.toContain('<a ');
    }, 30_000);
});
