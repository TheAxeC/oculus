// What lib/server/files/fs.ts and server/files/workspace/actions.ts do to the workspace state on a
// write: Save Workspace As writes `.oculus/workspaces/<name>.yml` of the primary hub (else the
// first hub) with the open folders and primary and opens it, New Workspace writes the same file
// with no folder, Close Workspace leaves the open file for the unsaved workspace with no folder and
// leaves the file as it is, Switch Workspace opens another file and puts it first in the recent
// list, a recent file that is gone is refused and taken off the list, and a state file that is
// there and does not read is refused and left byte for byte as it was.
//
// Every file here is under the system temporary directory and every path written is asserted to be
// inside it first. Nothing reads or writes ~/.oculus.

import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import {
    readState,
    stateFileOf,
    writeState
} from '../../../../src/lib/server/files/workspace/state.ts';
import { openWorkspace } from '../../../../src/lib/server/files/workspace/open.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { plantHub, writeFs } from '../../../fixtures/hubs/workspace.ts';

/** A fresh directory under the temporary directory, asserted to be inside it. */
function fresh(): string {
    const dir = scratchDir('oculus-workspaces-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return dir;
}

const write = writeFs;

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

    it('writes the repository_scan_depth of each entry of an open workspace file into the new file', async () => {
        const world = unsaved();
        const file = join(world.hub, '.oculus', 'workspaces', 'first.yml');
        mkdirSync(join(world.hub, '.oculus', 'workspaces'), { recursive: true });
        writeFileSync(
            file,
            [
                'folders:',
                `  - { name: research-hub, path: ${world.hub} }`,
                `  - { name: notes, path: ${world.notes}, repository_scan_depth: -1 }`,
                'primary: research-hub',
                ''
            ].join('\n')
        );
        writeState(world.state, { open: file, recent: [file], unsaved: { folders: [] } });
        const done = await write(world.state, { action: 'save-workspace', name: 'copy' });
        expect(done.status).toBe(200);
        expect(readFileSync(join(world.hub, '.oculus', 'workspaces', 'copy.yml'), 'utf8')).toBe(
            [
                'folders:',
                `  - { name: research-hub, path: ${world.hub} }`,
                `  - { name: notes, path: ${world.notes}, repository_scan_depth: -1 }`,
                'primary: research-hub',
                ''
            ].join('\n')
        );
    });

    it('writes a repository_scan_depth that is not a whole number as it was written, and the new file gives the same finding', async () => {
        const world = unsaved();
        const file = join(world.hub, '.oculus', 'workspaces', 'first.yml');
        mkdirSync(join(world.hub, '.oculus', 'workspaces'), { recursive: true });
        writeFileSync(
            file,
            [
                'folders:',
                `  - { name: research-hub, path: ${world.hub} }`,
                `  - { name: notes, path: ${world.notes}, repository_scan_depth: abc }`,
                'primary: research-hub',
                ''
            ].join('\n')
        );
        writeState(world.state, { open: file, recent: [file], unsaved: { folders: [] } });
        const done = await write(world.state, { action: 'save-workspace', name: 'copy' });
        expect(done.status).toBe(200);
        const copy = join(world.hub, '.oculus', 'workspaces', 'copy.yml');
        expect(readFileSync(copy, 'utf8')).toContain(
            `  - { name: notes, path: ${world.notes}, repository_scan_depth: abc }`
        );
        expect(openWorkspace(world.state).findings.map((one) => [one.key, one.id])).toEqual([
            ['notes', 'findings.workspace.bad_scan_depth']
        ]);
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

describe('Close Workspace', () => {
    it('leaves the open workspace file for the unsaved workspace with no folder, the file as it was', async () => {
        const world = unsaved();
        await write(world.state, { action: 'save-workspace', name: 'one' });
        const file = join(world.hub, '.oculus', 'workspaces', 'one.yml');
        const before = readFileSync(file, 'utf8');
        const closed = await write(world.state, { action: 'close-workspace' });
        expect(closed.status).toBe(200);
        const state = readState(world.state).state;
        expect(state.open).toBeNull();
        expect(state.unsaved).toEqual({ folders: [] });
        expect(state.recent).toEqual([file]);
        expect(readFileSync(file, 'utf8')).toBe(before);
    });
});

describe('New Workspace', () => {
    it('writes folders: [] into the primary hub and opens the file', async () => {
        const world = unsaved();
        const made = await write(world.state, { action: 'new-workspace', name: 'lab2' });
        expect(made.status).toBe(200);
        const file = join(world.hub, '.oculus', 'workspaces', 'lab2.yml');
        expect(readFileSync(file, 'utf8')).toBe('folders: []\n');
        const state = readState(world.state).state;
        expect(state.open).toBe(file);
        expect(state.recent).toEqual([file]);
        expect(state.unsaved.folders).toEqual([
            { name: 'research-hub', path: world.hub },
            { name: 'notes', path: world.notes }
        ]);
    });

    it('writes into the first hub when the workspace has no primary', async () => {
        const world = unsaved();
        writeState(world.state, {
            open: null,
            recent: [],
            unsaved: {
                folders: [
                    { name: 'notes', path: world.notes },
                    { name: 'research-hub', path: world.hub }
                ]
            }
        });
        const made = await write(world.state, { action: 'new-workspace', name: 'lab2' });
        expect(made.status).toBe(200);
        expect(readFileSync(join(world.hub, '.oculus', 'workspaces', 'lab2.yml'), 'utf8')).toBe(
            'folders: []\n'
        );
    });

    it('is refused, writing nothing, for a held name, a bad name, no hub and a folder that cannot be written', async () => {
        const world = unsaved();
        const origin = readState(world.state).state;
        await write(world.state, { action: 'new-workspace', name: 'lab2' });
        // The new workspace holds no folder, so a second make is asked from the workspace it left.
        writeState(world.state, origin);
        const folder = join(world.hub, '.oculus', 'workspaces');
        const file = join(folder, 'lab2.yml');
        const state = readFileSync(stateFileOf(world.state), 'utf8');
        const refusals: [string, string][] = [
            ['lab2', 'name-held'],
            ['', 'no-name'],
            ['..', 'bad-name'],
            ['a/b', 'bad-name']
        ];
        for (const [name, error] of refusals) {
            const refused = await write(world.state, { action: 'new-workspace', name });
            expect(refused, JSON.stringify(name)).toEqual({ status: 400, body: { error } });
        }
        expect(readdirSync(folder)).toEqual(['lab2.yml']);
        expect(readFileSync(file, 'utf8')).toBe('folders: []\n');
        expect(readFileSync(stateFileOf(world.state), 'utf8')).toBe(state);

        const root = fresh();
        const notes = join(root, 'notes');
        mkdirSync(notes);
        const bare = join(root, 'state');
        mkdirSync(bare);
        writeState(bare, {
            open: null,
            recent: [],
            unsaved: { folders: [{ name: 'notes', path: notes }] }
        });
        const noHub = await write(bare, { action: 'new-workspace', name: 'lab2' });
        expect(noHub).toEqual({ status: 400, body: { error: 'no-hub' } });

        const blocked = unsaved();
        writeFileSync(join(blocked.hub, '.oculus', 'workspaces'), 'not a folder');
        const stuck = await write(blocked.state, { action: 'new-workspace', name: 'lab2' });
        expect(stuck).toEqual({ status: 400, body: { error: 'unwritable' } });
        expect(readState(blocked.state).state.open).toBeNull();
    });
});

describe('a write over the state file', () => {
    it('refuses every action onto a state that does not read, leaving it as it is', async () => {
        for (const [what, action] of [
            ['saves a workspace', SAVE],
            ['makes a workspace', { action: 'new-workspace', name: 'second' }],
            ['closes the workspace', { action: 'close-workspace' }],
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
