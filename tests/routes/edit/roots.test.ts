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

import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
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
        sources: { file, held: { served: () => [], keys: () => ['hub', 'engine'] } }
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

test.beforeAll(warmConfig);

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
    });
});
