// Layer 2, route tests. What the /api/write route does with the folders of the open workspace: Add
// Folder to Workspace appends `{ name, path }` to the `folders:` list of the open workspace file
// over its bytes with every other line kept, Remove Folder takes the entry out (and the `primary:`
// line with it when the entry is the primary), the order write moves entries, and the change log
// holds each write with an undo that puts the file back. An unsaved workspace is changed in the
// state file and nowhere else, and a file that does not parse is never written.
//
// The workspace file, the state and the folders added are under the system temporary directory,
// asserted to be inside it before anything is written. A hook loads the configuration once, since
// the first load costs more than a later one, so no case pays for it.
// @module-tag slow: its writes go through the whole configuration load, which runs past the
// default timeout under load.

import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { handleWrite, type WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { pathAsWritten } from '../../../src/lib/server/files/workspace/folders.ts';
import { openWorkspace } from '../../../src/lib/server/files/workspace/open.ts';
import { readState, writeState } from '../../../src/lib/server/files/workspace/state.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';
import { plantHub } from '../../fixtures/hubs/workspace.ts';
import { TOKEN, changesOf, request, target, warmConfig } from './write-fixture.ts';

test.beforeAll(warmConfig);

/** A folder that exists, named `name`, in a fresh temporary directory of its own. */
function folderNamed(name: string): string {
    const dir = join(scratchDir('oculus-added-'), name);
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    mkdirSync(dir);
    return realpathSync(dir);
}

/**
 * What a workspace file is made of: the comment above the key and the two entries, then primary.
 */
function fileText(hub: string, other: string): string {
    return [
        '# a comment above the key',
        'folders:',
        `  - { name: research-hub, path: ${hub} }`,
        `  - { name: claude, path: ${other} }`,
        'primary: research-hub',
        ''
    ].join('\n');
}

/** An open workspace file in a hub, the state naming it, and a target that writes through it. */
function opened(text: (hub: string, other: string) => string = fileText) {
    const hub = plantHub(folderNamed('hub'));
    const other = folderNamed('claude');
    const state = scratchDir('oculus-roots-state-');
    const file = join(hub, '.oculus', 'workspaces', 'work.yml');
    mkdirSync(join(hub, '.oculus', 'workspaces'), { recursive: true });
    writeFileSync(file, text(hub, other));
    writeState(state, { open: file, recent: [], unsaved: { folders: [] } });
    const base = target();
    const into = (): WriteTarget => ({ ...base, workspace: openWorkspace(state) });
    return { hub, other, state, file, into };
}

const send = (into: WriteTarget, body: unknown) => handleWrite(request(body), TOKEN, into);
const add = (into: WriteTarget, dir: string) => send(into, { kind: 'roots', action: 'add', dir });
const remove = (into: WriteTarget, key: string) =>
    send(into, { kind: 'roots', action: 'remove', key });
const order = (into: WriteTarget, keys: string[]) =>
    send(into, { kind: 'roots', action: 'order', keys });

describe('the folders write of an open workspace file', () => {
    it('appends the folder as an entry under a name made from its base name, keeping every other line', async () => {
        const world = opened();
        const before = readFileSync(world.file, 'utf8');
        const dir = folderNamed('thesis');
        const response = await add(world.into(), dir);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
            ok: true,
            changed: ['folders'],
            refused: [],
            id: 'thesis'
        });
        expect(readFileSync(world.file, 'utf8')).toBe(
            before.replace(
                'primary: research-hub',
                `  - { name: thesis, path: ${pathAsWritten(dir)} }\nprimary: research-hub`
            )
        );
        const [made] = changesOf(world.into());
        expect(made).toMatchObject({ kind: 'roots', undo: 'field' });
        expect((await send(world.into(), { kind: 'undo', at: made.at })).status).toBe(200);
        expect(readFileSync(world.file, 'utf8')).toBe(before);
    });

    it('takes the primary out with its entry, and the undo puts both back', async () => {
        const world = opened();
        const before = readFileSync(world.file, 'utf8');
        const response = await remove(world.into(), 'research-hub');
        expect(response.status).toBe(200);
        expect(readFileSync(world.file, 'utf8')).toBe(
            [
                '# a comment above the key',
                'folders:',
                `  - { name: claude, path: ${world.other} }`,
                ''
            ].join('\n')
        );
        const [removed] = changesOf(world.into());
        expect((await send(world.into(), { kind: 'undo', at: removed.at })).status).toBe(200);
        expect(readFileSync(world.file, 'utf8')).toBe(before);
    });

    it('moves the entries and nothing else when the names are a permutation, and refuses any other list', async () => {
        const world = opened();
        const before = readFileSync(world.file, 'utf8');
        expect((await order(world.into(), ['claude', 'research-hub'])).status).toBe(200);
        const [one, two] = before.split('\n').filter((line) => line.startsWith('  - {'));
        expect(readFileSync(world.file, 'utf8')).toBe(
            before.replace(`${one}\n${two}`, `${two}\n${one}`)
        );

        const kept = readFileSync(world.file, 'utf8');
        for (const names of [['claude'], ['claude', 'claude'], ['claude', 'thesis']]) {
            const refused = await order(world.into(), names);
            expect(refused.status, names.join()).toBe(400);
            expect(await refused.json(), names.join()).toEqual({ error: 'roots-changed' });
            expect(readFileSync(world.file, 'utf8'), names.join()).toBe(kept);
        }
    });

    it('keeps the repository_scan_depth of an entry through an add, the removal of another entry, an order and the undo of its own removal', async () => {
        const world = opened((hub, other) =>
            [
                'folders:',
                `  - { name: research-hub, path: ${hub}, repository_scan_depth: 2 }`,
                `  - { name: claude, path: ${other}, repository_scan_depth: -1 }`,
                ''
            ].join('\n')
        );
        const entry = (name: string): string =>
            readFileSync(world.file, 'utf8')
                .split('\n')
                .find((line) => line.includes(`name: ${name},`)) ?? '';
        const hubLine = entry('research-hub');
        const claudeLine = entry('claude');
        expect(hubLine).toContain('repository_scan_depth: 2');

        expect((await add(world.into(), folderNamed('thesis'))).status).toBe(200);
        expect(entry('research-hub')).toBe(hubLine);
        expect(entry('claude')).toBe(claudeLine);

        expect((await order(world.into(), ['thesis', 'claude', 'research-hub'])).status).toBe(200);
        expect(entry('research-hub')).toBe(hubLine);
        expect(entry('claude')).toBe(claudeLine);

        expect((await remove(world.into(), 'thesis')).status).toBe(200);
        expect(entry('claude')).toBe(claudeLine);

        const before = readFileSync(world.file, 'utf8');
        expect((await remove(world.into(), 'claude')).status).toBe(200);
        expect(readFileSync(world.file, 'utf8')).not.toContain('claude');
        const [removed] = changesOf(world.into());
        expect((await send(world.into(), { kind: 'undo', at: removed.at })).status).toBe(200);
        expect(readFileSync(world.file, 'utf8')).toBe(before);
    });

    it('refuses every change to a file that does not parse, with the file as it was', async () => {
        const world = opened(() => 'folders: [unclosed\n  - {\n');
        const before = readFileSync(world.file, 'utf8');
        const attempts = [
            await add(world.into(), folderNamed('thesis')),
            await remove(world.into(), 'research-hub'),
            await order(world.into(), ['a', 'b'])
        ];
        for (const answer of attempts) {
            expect(answer.status).toBe(400);
            expect(await answer.json()).toEqual({ error: 'unreadable', reason: world.file });
        }
        expect(readFileSync(world.file, 'utf8')).toBe(before);
        expect(changesOf(world.into())).toEqual([]);
    });

    it('refuses a rewrite that would drop a comment between two entries', async () => {
        const world = opened((hub, other) =>
            [
                'folders:',
                `  - { name: research-hub, path: ${hub} }`,
                '  # the second folder',
                `  - { name: claude, path: ${other} }`,
                ''
            ].join('\n')
        );
        const before = readFileSync(world.file, 'utf8');
        const answer = await add(world.into(), folderNamed('thesis'));
        expect(answer.status).toBe(400);
        expect(await answer.json()).toEqual({ error: 'invalid' });
        expect(readFileSync(world.file, 'utf8')).toBe(before);
    });
});

describe('the folders write of an unsaved workspace', () => {
    it('changes the state file alone', async () => {
        const hub = plantHub(folderNamed('hub'));
        const state = scratchDir('oculus-roots-state-');
        writeState(state, {
            open: null,
            recent: [],
            unsaved: { folders: [{ name: 'hub', path: hub }], primary: 'hub' }
        });
        const dir = folderNamed('thesis');
        const base = target();
        const response = await add({ ...base, workspace: openWorkspace(state) }, dir);
        expect(response.status).toBe(200);
        expect(readState(state).state.unsaved).toEqual({
            folders: [
                { name: 'hub', path: hub },
                { name: 'thesis', path: pathAsWritten(dir) }
            ],
            primary: 'hub'
        });
        const removed = await remove({ ...base, workspace: openWorkspace(state) }, 'hub');
        expect(removed.status).toBe(200);
        expect(readState(state).state.unsaved).toEqual({
            folders: [{ name: 'thesis', path: pathAsWritten(dir) }]
        });
    });
});
