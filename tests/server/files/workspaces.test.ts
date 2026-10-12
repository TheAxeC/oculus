// What lib/server/files/fs.ts and server/files/workspace/actions.ts do to the workspace state on a
// write: Save Workspace As writes `.oculus/workspaces/<name>.yml` of the primary hub (else the
// first hub) with the open folders and primary and opens it, Switch Workspace opens another file
// and puts it first in the recent list, a recent file that is gone is refused and taken off the
// list, and a state file that is there and does not read is refused and left byte for byte as it
// was.
//
// Every file here is under the system temporary directory and every path written is asserted to be
// inside it first. Nothing reads or writes ~/.oculus.

import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { engineDir } from '../../../src/lib/data/places/engine-dir.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { handleFsWrite, ignoredCache } from '../../../src/lib/server/files/fs.ts';
import {
    readState,
    stateFileOf,
    writeState
} from '../../../src/lib/server/files/workspace/state.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { plantHub, workspaceOf } from '../../fixtures/hubs/workspace.ts';

const TOKEN = 'a-write-token';

/** A fresh directory under the temporary directory, asserted to be inside it. */
function fresh(): string {
    const dir = scratchDir('oculus-workspaces-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return dir;
}

/** One write of `action` over the workspace of the state folder `state`. */
async function write(
    state: string,
    action: Record<string, unknown>
): Promise<{ status: number; body: Record<string, unknown> }> {
    const host = '127.0.0.1:8791';
    const request = new Request(`http://${host}/api/fs`, {
        method: 'POST',
        headers: {
            host,
            origin: `http://${host}`,
            'content-type': 'application/json',
            'x-oculus-token': TOKEN
        },
        body: JSON.stringify(action)
    });
    const response = await handleFsWrite(request, TOKEN, {
        engine: engineDir(),
        workspace: workspaceOf(state),
        machine: { set: [], defaults: {}, values: {}, hubs: {} },
        bookmarks: null,
        notes: null,
        writes: fsWrites(),
        ignored: ignoredCache()
    });
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

/** An unsaved workspace in a fresh state folder: a hub as its primary and a plain folder. */
function unsaved(): { state: string; hub: string; notes: string } {
    const root = fresh();
    const hub = plantHub(join(root, 'research-hub'));
    const notes = join(root, 'notes');
    mkdirSync(notes);
    const state = join(root, 'state');
    mkdirSync(state);
    writeState(state, {
        open: null,
        recent: [],
        unsaved: {
            folders: [
                { name: 'research-hub', path: hub },
                { name: 'notes', path: notes }
            ],
            primary: 'research-hub'
        }
    });
    return { state, hub, notes };
}

const SAVE = { action: 'save-workspace', name: 'second' };
const SELECT = { action: 'select-workspace', path: '/nowhere/work.yml' };

/** The state files that do not read, with the body they hold (null for a folder at the path). */
const UNREADABLE: [string, string | null][] = [
    ['is not JSON', '{"open": '],
    ['is not a map', '["a", "list"]'],
    ['cannot be read', null]
];

describe('Save Workspace As', () => {
    it('writes the open folders and primary into a file of the primary hub and opens it', async () => {
        const world = unsaved();
        const done = await write(world.state, { action: 'save-workspace', name: 'lab' });
        expect(done.status).toBe(200);
        const file = join(world.hub, '.oculus', 'workspaces', 'lab.yml');
        expect(readFileSync(file, 'utf8')).toBe(
            [
                'folders:',
                `  - { name: research-hub, path: ${world.hub} }`,
                `  - { name: notes, path: ${world.notes} }`,
                'primary: research-hub',
                ''
            ].join('\n')
        );
        const state = readState(world.state).state;
        expect(state.open).toBe(file);
        expect(state.recent).toEqual([file]);
        expect(state.unsaved.folders).toEqual([]);
    });

    it('is refused with nothing written when the workspace lists no hub', async () => {
        const root = fresh();
        const notes = join(root, 'notes');
        mkdirSync(notes);
        const state = join(root, 'state');
        mkdirSync(state);
        writeState(state, {
            open: null,
            recent: [],
            unsaved: { folders: [{ name: 'notes', path: notes }] }
        });
        const before = readFileSync(stateFileOf(state), 'utf8');
        const refused = await write(state, SAVE);
        expect(refused).toEqual({ status: 400, body: { error: 'no-hub' } });
        expect(readFileSync(stateFileOf(state), 'utf8')).toBe(before);
    });

    it('is refused for a name that is held, empty, `..` or holds a slash', async () => {
        const world = unsaved();
        expect((await write(world.state, { action: 'save-workspace', name: 'lab' })).status).toBe(
            200
        );
        const held = join(world.hub, '.oculus', 'workspaces', 'lab.yml');
        const heldText = readFileSync(held, 'utf8');
        const again = await write(world.state, { action: 'save-workspace', name: 'lab' });
        expect(again).toEqual({ status: 400, body: { error: 'name-held' } });
        expect(readFileSync(held, 'utf8')).toBe(heldText);
        for (const name of ['', '..', 'a/b']) {
            const refused = await write(world.state, { action: 'save-workspace', name });
            expect(refused.status, JSON.stringify(name)).toBe(400);
            expect(refused.body.error, JSON.stringify(name)).toBe(
                name === '' ? 'no-name' : 'bad-name'
            );
        }
        expect(statSync(join(world.hub, '.oculus', 'workspaces')).isDirectory()).toBe(true);
    });
});

describe('Switch Workspace', () => {
    it('opens another workspace file and puts it first in the recent list', async () => {
        const world = unsaved();
        await write(world.state, { action: 'save-workspace', name: 'one' });
        const other = join(world.hub, '.oculus', 'workspaces', 'two.yml');
        writeFileSync(other, `folders:\n  - { name: notes, path: ${world.notes} }\n`);
        const first = join(world.hub, '.oculus', 'workspaces', 'one.yml');
        const moved = await write(world.state, { action: 'select-workspace', path: other });
        expect(moved.status).toBe(200);
        const state = readState(world.state).state;
        expect(state.open).toBe(other);
        expect(state.recent).toEqual([other, first]);
    });

    it('refuses a recent file that is gone and takes it off the list', async () => {
        const world = unsaved();
        await write(world.state, { action: 'save-workspace', name: 'one' });
        const file = join(world.hub, '.oculus', 'workspaces', 'one.yml');
        writeFileSync(file, 'folders: []\n');
        const gone = join(world.hub, '.oculus', 'workspaces', 'gone.yml');
        const state = readState(world.state).state;
        writeState(world.state, { ...state, recent: [gone, file] });
        const refused = await write(world.state, { action: 'select-workspace', path: gone });
        expect(refused).toEqual({ status: 400, body: { error: 'gone' } });
        expect(readState(world.state).state.recent).toEqual([file]);
    });
});

describe('a write over the state file', () => {
    it('refuses every action onto a state that does not read, leaving it as it is', async () => {
        for (const [what, action] of [
            ['saves a workspace', SAVE],
            ['switches workspace', SELECT]
        ] as const) {
            for (const [reason, body] of UNREADABLE) {
                const dir = fresh();
                const file = stateFileOf(dir);
                if (body === null) mkdirSync(file);
                else writeFileSync(file, body);
                const refused = await write(dir, action);
                const row = `${what}, a state that ${reason}`;
                expect(refused.status, row).toBe(400);
                expect(refused.body, row).toEqual({ error: 'unreadable', reason: file });
                expect(basename(file)).toBe('workspace.json');
                if (body === null) expect(statSync(file).isDirectory(), row).toBe(true);
                else expect(readFileSync(file, 'utf8'), row).toBe(body);
            }
        }
    });
});
