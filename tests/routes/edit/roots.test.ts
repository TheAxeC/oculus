// Layer 2, route tests. What the /api/write route does with the default workspace's folders: Add
// Folder to Workspace appends `{ key, dir }` to the `roots:` list of config/sources.yml over its
// bytes with every other line kept, and the change log holds each write with an undo that puts the
// list back.
//
// The sources file and the folders added are under the system temporary directory, asserted to be
// inside it before anything is written, so no case here writes the engine's own config/sources.yml.
//
// A hook loads the configuration once, since the first load costs more than a later one, so no case
// pays for it.
// @module-tag slow: its writes go through the whole configuration load, which runs past the
// default timeout under load.

import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { parse } from 'yaml';
import { handleWrite, type WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { dirAsWritten } from '../../../src/lib/server/edit/writes/config/roots.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';
import { TOKEN, changesOf, request, target, warmConfig } from './write-fixture.ts';

/** A sources.yml of the engine's shape, with the comments and the other keys the edit must keep. */
const SOURCES = `# Where the projects are.
scan:
  - { dir: projects/active, type: active }


# Roots the server may serve local files from.
roots:
  - { key: cathedra,    dir: ~/workspace/cathedra }
  - { key: game-engine, dir: ~/workspace/game-engine }


# The language each file name opens in.
languages:
  bash:          [.sh, .bash]
`;

/** A target whose sources.yml is a copy under the system temporary directory. */
function rootsTarget(body = SOURCES): WriteTarget {
    const into = target();
    const file = join(into.hub, 'sources.yml');
    expect(resolve(file).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    writeFileSync(file, body);
    return {
        ...into,
        sources: { file, held: { served: () => [], keys: () => ['hub', 'engine'] }, base: [] }
    };
}

function sourcesOf(into: WriteTarget): string {
    return readFileSync(into.sources?.file ?? '', 'utf8');
}

function rootsOf(into: WriteTarget): unknown {
    return (parse(sourcesOf(into)) as { roots: unknown }).roots;
}

/** A folder that exists, named `name`, in a fresh temporary directory of its own. */
function folderNamed(name: string): string {
    const dir = join(scratchDir('oculus-added-'), name);
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    mkdirSync(dir);
    return realpathSync(dir);
}

const send = (into: WriteTarget, body: unknown) => handleWrite(request(body), TOKEN, into);
const add = (into: WriteTarget, dir: string) => send(into, { kind: 'roots', action: 'add', dir });
const remove = (into: WriteTarget, key: string) =>
    send(into, { kind: 'roots', action: 'remove', key });
const order = (into: WriteTarget, keys: string[]) =>
    send(into, { kind: 'roots', action: 'order', keys });

/** The same list with a comment line between its two entries, which no rewrite may drop. */
const COMMENTED = SOURCES.replace(
    '  - { key: cathedra,    dir: ~/workspace/cathedra }\n',
    '  - { key: cathedra,    dir: ~/workspace/cathedra }\n  # the engine of the games\n'
);

/**
 * The hub layer's sources.yml of a target, which the roots of a hub that sets none are added to.
 */
function layerTarget(): WriteTarget {
    const into = target();
    const file = join(into.hub, '.oculus', 'config', 'sources.yml');
    return {
        ...into,
        sources: {
            file,
            held: { served: () => [], keys: () => ['hub', 'engine'] },
            base: [{ key: 'cathedra', dir: '~/workspace/cathedra' }]
        }
    };
}

test.beforeAll(warmConfig);

/**
 * The writes a list that names the keys wrongly is refused for, each with the file left as it was.
 */
const WRONG_KEYS: [string, string[]][] = [
    ['a key twice', ['cathedra', 'cathedra']],
    ['a key missing', ['cathedra']],
    ['a key the list does not hold', ['cathedra', 'game-engine', 'thesis']],
    ['a key in place of another', ['cathedra', 'thesis']]
];

describe('the roots write', () => {
    it('appends the folder as an entry under a key made from its name, keeping every other line', async () => {
        const into = rootsTarget();
        const dir = folderNamed('thesis');
        const response = await add(into, dir);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            changed: ['roots'],
            refused: [],
            id: 'thesis'
        });
        expect(rootsOf(into)).toEqual([
            { key: 'cathedra', dir: '~/workspace/cathedra' },
            { key: 'game-engine', dir: '~/workspace/game-engine' },
            { key: 'thesis', dir: dirAsWritten(dir) }
        ]);
        const written = sourcesOf(into);
        expect(written).toContain('# Where the projects are.\n');
        expect(written).toContain('# Roots the server may serve local files from.\n');
        expect(written).toContain('  - { key: cathedra,    dir: ~/workspace/cathedra }\n');
        expect(written).toContain('# The language each file name opens in.\n');
        expect(written).toContain('  bash:          [.sh, .bash]\n');

        // The order row: the keys name a permutation, and only the two entry lines change places.
        const ordered = rootsTarget();
        const reordered = await order(ordered, ['game-engine', 'cathedra']);
        expect(reordered.status, 'a permutation').toBe(200);
        expect(await reordered.json()).toMatchObject({ ok: true, changed: ['roots'] });
        expect(rootsOf(ordered)).toEqual([
            { key: 'game-engine', dir: '~/workspace/game-engine' },
            { key: 'cathedra', dir: '~/workspace/cathedra' }
        ]);
        expect(sourcesOf(ordered)).toBe(
            SOURCES.replace(
                '  - { key: cathedra,    dir: ~/workspace/cathedra }\n  - { key: game-engine, dir: ~/workspace/game-engine }\n',
                '  - { key: game-engine, dir: ~/workspace/game-engine }\n  - { key: cathedra,    dir: ~/workspace/cathedra }\n'
            )
        );

        // The refused-order rows: a list that names the keys wrongly writes nothing.
        for (const [row, keys] of WRONG_KEYS) {
            const wrong = rootsTarget();
            const refused = await order(wrong, keys);
            expect(refused.status, row).toBe(400);
            expect(await refused.json(), row).toEqual({ error: 'roots-changed' });
            expect(sourcesOf(wrong), row).toBe(SOURCES);
            expect(changesOf(wrong), row).toEqual([]);
        }

        // The comment-line rows: an add, a remove and an order over a list holding a comment line
        // between two entries are each refused `invalid`, with the file as it was.
        const commented = rootsTarget(COMMENTED);
        const answers: [string, Response][] = [
            ['an add', await add(commented, folderNamed('thesis'))],
            ['a remove', await remove(commented, 'cathedra')],
            ['an order', await order(commented, ['game-engine', 'cathedra'])]
        ];
        for (const [row, answer] of answers) {
            expect(answer.status, row).toBe(400);
            expect(await answer.json(), row).toEqual({ error: 'invalid' });
        }
        expect(sourcesOf(commented)).toBe(COMMENTED);
        expect(changesOf(commented)).toEqual([]);

        // The hub-layer row: an add for a hub that holds no layer file appends to the engine's list
        // in a new layer file, and the change records what the write made.
        const layered = layerTarget();
        expect(existsSync(join(layered.hub, '.oculus'))).toBe(false);
        const layerDir = folderNamed('thesis');
        expect((await add(layered, layerDir)).status).toBe(200);
        expect(rootsOf(layered)).toEqual([
            { key: 'cathedra', dir: '~/workspace/cathedra' },
            { key: 'thesis', dir: dirAsWritten(layerDir) }
        ]);
        const [made] = changesOf(layered);
        expect(made).toMatchObject({
            kind: 'roots',
            key: 'roots',
            file: '.oculus/config/sources.yml'
        });
        expect(made.created).toEqual(['.oculus', '.oculus/config', '.oculus/config/sources.yml']);
    });

    it('records the add and the remove, and the undo of each puts the list back', async () => {
        const into = rootsTarget();
        const dir = folderNamed('thesis');
        await add(into, dir);
        const [added] = changesOf(into);
        expect(added).toMatchObject({
            kind: 'roots',
            key: 'roots',
            field: 'roots',
            undo: 'field',
            before: [
                { key: 'cathedra', dir: '~/workspace/cathedra' },
                { key: 'game-engine', dir: '~/workspace/game-engine' }
            ]
        });
        const undoAdd = await send(into, { kind: 'undo', at: added.at });
        expect(undoAdd.status).toBe(200);
        expect(sourcesOf(into)).toBe(SOURCES);

        await remove(into, 'cathedra');
        const [removed] = changesOf(into);
        expect(removed).toMatchObject({ kind: 'roots', key: 'roots' });
        const undoRemove = await send(into, { kind: 'undo', at: removed.at });
        expect(undoRemove.status).toBe(200);
        expect(rootsOf(into)).toEqual([
            { key: 'cathedra', dir: '~/workspace/cathedra' },
            { key: 'game-engine', dir: '~/workspace/game-engine' }
        ]);
        expect(sourcesOf(into)).toContain('# Roots the server may serve local files from.\n');
        expect(sourcesOf(into)).toContain('  bash:          [.sh, .bash]\n');

        // The order row: the write is logged as a roots change, and its undo puts the list back.
        const ordered = rootsTarget();
        await order(ordered, ['game-engine', 'cathedra']);
        const [reorder] = changesOf(ordered);
        expect(reorder).toMatchObject({
            kind: 'roots',
            key: 'roots',
            field: 'roots',
            undo: 'field'
        });
        const undone = await send(ordered, { kind: 'undo', at: reorder.at });
        expect(undone.status).toBe(200);
        expect(sourcesOf(ordered)).toBe(SOURCES);

        // The hub-layer rows: the undo of an add that made the layer file removes the file and the
        // folders it made, and a remove from a layer file that holds the list is undone to the
        // list.
        const created = layerTarget();
        await add(created, folderNamed('thesis'));
        const [madeFile] = changesOf(created);
        expect((await send(created, { kind: 'undo', at: madeFile.at })).status).toBe(200);
        expect(existsSync(join(created.hub, '.oculus'))).toBe(false);

        const held = layerTarget();
        const heldFile = held.sources?.file ?? '';
        mkdirSync(join(held.hub, '.oculus', 'config'), { recursive: true });
        writeFileSync(
            heldFile,
            'roots:\n  - { key: cathedra, dir: ~/workspace/cathedra }\n  - { key: thesis, dir: ~/workspace/thesis }\n'
        );
        const heldBefore = sourcesOf(held);
        expect((await remove(held, 'thesis')).status).toBe(200);
        expect(rootsOf(held)).toEqual([{ key: 'cathedra', dir: '~/workspace/cathedra' }]);
        const [takenOut] = changesOf(held);
        expect(takenOut.created).toBeUndefined();
        expect((await send(held, { kind: 'undo', at: takenOut.at })).status).toBe(200);
        expect(sourcesOf(held)).toBe(heldBefore);
    });
});
