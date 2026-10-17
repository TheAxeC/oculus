// Layer 4, test. What the reader is asked after a repository was cloned and what each answer writes
// (state/sources/clone/clone-after.svelte.ts), over the real writes of the server: Open makes the
// clone the only folder of the unsaved workspace and closes an open workspace file without touching
// it, an unsaved workspace holding folders asks Save, Don't Save or Cancel first, Save writes the
// folders as a workspace file under the name given, an unsaved workspace with no folder asks
// nothing, and Add to Workspace adds the folder as Add Folder to Workspace does. While no folder of
// the unsaved workspace is a hub the question offers Save as unavailable, since the workspace file
// has nowhere to be kept, and Save then does nothing.
//
// The workspace, the state and the clone are under the system temporary directory, asserted to be
// inside it before anything is written. The notices the store posts are collected and read.

import { mkdirSync, readFileSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { handleWrite, type WriteTarget } from '../../../src/lib/server/edit/writes.ts';
import { openWorkspace } from '../../../src/lib/server/files/workspace/open.ts';
import { readState, writeState } from '../../../src/lib/server/files/workspace/state.ts';
import type { WriteAnswer } from '../../../src/lib/state/shared/stores/shapes.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import {
    createCloneAfter,
    type CloneAfterFs
} from '../../../src/lib/state/sources/clone/clone-after.svelte.ts';
import type { WorkspacesState } from '../../../src/lib/state/sources/fs-transport.ts';
import { plantHub, writeFs } from '../../fixtures/hubs/workspace.ts';
import { scratchDir, test } from '../../fixtures/scratch.ts';
import { TOKEN, request, target, warmConfig } from '../../routes/edit/write-fixture.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));
test.beforeAll(warmConfig);

/** A folder that exists, named `name`, in a fresh temporary directory of its own. */
function folderNamed(name: string): string {
    const dir = join(scratchDir('oculus-clone-after-'), name);
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    mkdirSync(dir);
    return realpathSync(dir);
}

/** The store over the real writes of a state folder, and the notices it posted. */
function world(setup: (hub: string, notes: string, clone: string) => object) {
    const hub = plantHub(folderNamed('research-hub'));
    const notes = folderNamed('notes');
    const clone = folderNamed('repo');
    const state = scratchDir('oculus-clone-after-state-');
    writeState(state, setup(hub, notes, clone) as never);
    const base = target();
    const into = (): WriteTarget => ({ ...base, workspace: openWorkspace(state) });

    async function fsWrite(action: Record<string, unknown>): Promise<WriteAnswer> {
        const done = await writeFs(state, action);
        return { ok: done.status === 200, changed: [], refused: [], ...done.body };
    }

    const fs: CloneAfterFs = {
        addRoot: async (dir) => {
            const response = await handleWrite(
                request({ kind: 'roots', action: 'add', dir }),
                TOKEN,
                into()
            );
            const body = (await response.json()) as Record<string, unknown>;
            return {
                ok: response.status === 200,
                changed: [],
                refused: [],
                ...body
            };
        },
        closeWorkspace: () => fsWrite({ action: 'close-workspace' }),
        saveWorkspace: (name) => fsWrite({ action: 'save-workspace', name }),
        workspacesNow: () => {
            const open = openWorkspace(state);
            return Promise.resolve({
                open: open.file === null ? null : { path: open.file, name: open.name },
                folders: open.roots.map((root) => ({ key: root.key, dir: root.dir, hub: root.hub }))
            } as unknown as WorkspacesState);
        }
    };
    const said: string[] = [];
    const after = createCloneAfter(fs, { post: (message) => (said.push(message), 0) });
    return { hub, notes, clone, state, after, said, now: () => openWorkspace(state) };
}

/** The directories of the folders of the workspace, in order. */
const dirs = (open: ReturnType<typeof openWorkspace>): string[] =>
    open.folders.map((one) => one.dir);

const unsaved = (...folders: string[]) => ({
    open: null,
    recent: [],
    unsaved: { folders: folders.map((path) => ({ name: path.split('/').at(-1), path })) }
});

describe('Open after a clone', () => {
    test('closes an open workspace file, leaves its bytes, and holds the clone as the only folder', async () => {
        const w = world((hub, notes) => {
            const file = join(hub, '.oculus', 'workspaces', 'work.yml');
            mkdirSync(join(hub, '.oculus', 'workspaces'), { recursive: true });
            writeFileSync(
                file,
                `folders:\n  - { name: research-hub, path: ${hub} }\n  - { name: notes, path: ${notes} }\nprimary: research-hub\n`
            );
            return { open: file, recent: [file], unsaved: { folders: [] } };
        });
        const file = w.now().file ?? '';
        expect(file).not.toBe('');
        const before = readFileSync(file, 'utf8');
        w.after.ask(w.clone);
        expect(w.after.asking()).toEqual({ step: 'after', dir: w.clone });
        await w.after.open();
        expect(w.after.asking()).toBeNull();
        expect(readFileSync(file, 'utf8')).toBe(before);
        expect(readState(w.state).state.open).toBeNull();
        expect(dirs(w.now())).toEqual([w.clone]);
        expect(w.now().roots.map((root) => root.dir)).toEqual([w.clone]);
        expect(w.said).toEqual([]);
    });
});

describe('Open after a clone while the unsaved workspace holds folders', () => {
    test("asks Save, Don't Save or Cancel, and Cancel leaves both folders", async () => {
        const w = world((hub, notes) => unsaved(hub, notes));
        w.after.ask(w.clone);
        await w.after.open();
        expect(w.after.asking()).toEqual({ step: 'leave', dir: w.clone, savable: true });
        w.after.cancel();
        expect(w.after.asking()).toBeNull();
        expect(dirs(w.now())).toEqual([w.hub, w.notes]);
    });

    test("Don't Save drops the folders and leaves the clone alone", async () => {
        const w = world((hub, notes) => unsaved(hub, notes));
        w.after.ask(w.clone);
        await w.after.open();
        await w.after.dontSave();
        expect(w.after.asking()).toBeNull();
        expect(dirs(w.now())).toEqual([w.clone]);
        expect(readdirSync(join(w.hub, '.oculus'))).toEqual(['config.yml']);
    });

    test('Save with a name writes the two folders as that workspace file and opens the clone', async () => {
        const w = world((hub, notes) => unsaved(hub, notes));
        w.after.ask(w.clone);
        await w.after.open();
        w.after.save();
        expect(w.after.asking()).toEqual({ step: 'name', dir: w.clone, said: '' });
        await w.after.named('lab');
        expect(w.after.asking()).toBeNull();
        const saved = join(w.hub, '.oculus', 'workspaces', 'lab.yml');
        expect(readFileSync(saved, 'utf8')).toBe(
            `folders:\n  - { name: research-hub, path: ${w.hub} }\n  - { name: notes, path: ${w.notes} }\n`
        );
        expect(readState(w.state).state.open).toBeNull();
        expect(readState(w.state).state.recent).toEqual([saved]);
        expect(dirs(w.now())).toEqual([w.clone]);
    });

    test('a name the workspace refuses is said in the question and leaves both folders', async () => {
        const w = world((hub, notes) => unsaved(hub, notes));
        w.after.ask(w.clone);
        await w.after.open();
        w.after.save();
        await w.after.named('');
        const held = w.after.asking();
        expect(held?.step).toBe('name');
        expect(held !== null && 'said' in held ? held.said : '').not.toBe('');
        expect(dirs(w.now())).toEqual([w.hub, w.notes]);
        expect(readdirSync(join(w.hub, '.oculus'))).toEqual(['config.yml']);
    });

    test('a name the reader cancels cancels the whole Open and leaves both folders', async () => {
        const w = world((hub, notes) => unsaved(hub, notes));
        w.after.ask(w.clone);
        await w.after.open();
        w.after.save();
        w.after.cancel();
        expect(w.after.asking()).toBeNull();
        expect(dirs(w.now())).toEqual([w.hub, w.notes]);
        expect(readdirSync(join(w.hub, '.oculus'))).toEqual(['config.yml']);
    });
});

describe('Open after a clone while no folder of the unsaved workspace is a hub', () => {
    test('asks with Save unavailable, and Save does nothing', async () => {
        const w = world((_hub, notes) => unsaved(notes));
        w.after.ask(w.clone);
        await w.after.open();
        expect(w.after.asking()).toEqual({ step: 'leave', dir: w.clone, savable: false });
        w.after.save();
        expect(w.after.asking()).toEqual({ step: 'leave', dir: w.clone, savable: false });
    });
});

describe('Open after a clone while the unsaved workspace holds no folder', () => {
    test('asks nothing and holds the clone as the one folder', async () => {
        const w = world(() => unsaved());
        w.after.ask(w.clone);
        await w.after.open();
        expect(w.after.asking()).toBeNull();
        expect(dirs(w.now())).toEqual([w.clone]);
    });
});

describe('Add to Workspace after a clone', () => {
    test('adds the folder to the workspace and keeps the others', async () => {
        const w = world((hub, notes) => unsaved(hub, notes));
        w.after.ask(w.clone);
        await w.after.add();
        expect(w.after.asking()).toBeNull();
        expect(dirs(w.now())).toEqual([w.hub, w.notes, w.clone]);
    });

    test('says a folder the workspace holds is skipped and adds nothing', async () => {
        const w = world((hub, notes, clone) => unsaved(hub, notes, clone));
        w.after.ask(w.clone);
        await w.after.add();
        expect(dirs(w.now())).toEqual([w.hub, w.notes, w.clone]);
        expect(w.said).toHaveLength(1);
        expect(w.said[0]).toContain(w.clone);
    });

    test('does nothing when the question was closed without an answer', async () => {
        const w = world((hub, notes) => unsaved(hub, notes));
        w.after.ask(w.clone);
        w.after.cancel();
        await w.after.add();
        await w.after.open();
        expect(dirs(w.now())).toEqual([w.hub, w.notes]);
    });
});
