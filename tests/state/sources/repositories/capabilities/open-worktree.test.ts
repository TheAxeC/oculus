// Open Worktree in New Window against the real layout and appearance stores: the new window starts
// by reading the saved records, so a second client loads the storage as it stands at the moment
// the window is opened and must find the Files tab holding the reveal of the folder.
//
// The storage is a plain object, so no browser is involved. What this does NOT cover: the new
// window drawing the folder, which needs a browser.

import { beforeEach, describe, expect, it } from 'vitest';
import { openWorktree } from '../../../../../src/lib/state/sources/repositories/repositories.ts';
import { filesViewOf } from '../../../../../src/lib/state/sources/fs.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import { createClientState, type ClientState } from '../../../../fixtures/client.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const FOLDER = '.agents/worktrees/Q1';

/** A storage held in a plain object. */
function memory(): { held: Map<string, string>; storage: Storage } {
    const held = new Map<string, string>();
    const storage = {
        getItem: (key: string) => held.get(key) ?? null,
        setItem: (key: string, value: string) => void held.set(key, value)
    } as unknown as Storage;
    return { held, storage };
}

describe('Open Worktree in New Window', () => {
    let client: ClientState;
    let saved: ReturnType<typeof memory>;

    beforeEach(() => {
        client = createClientState();
        saved = memory();
        client.layout.loadLayout(saved.storage);
        client.ui.loadUi(saved.storage);
    });

    // Revert: in openWorktree of state/sources/repositories/repositories.ts, call openWindow before
    // showInFiles.
    it('has the Files reveal of the folder in the saved records when the window is opened', async () => {
        const seen: { calls: string[]; window: ClientState | null } = { calls: [], window: null };
        const answer = await openWorktree(FOLDER, true, {
            addRoot: () => Promise.resolve({ ok: true }),
            showInFiles: (path: string) => {
                seen.calls.push('files');
                return client.layout.showInFiles(path);
            },
            openWindow: () => {
                seen.calls.push('window');
                const copy = memory();
                for (const [key, value] of saved.held) copy.held.set(key, value);
                seen.window = createClientState();
                seen.window.layout.loadLayout(copy.storage);
                seen.window.ui.loadUi(copy.storage);
            },
            address: () => 'http://127.0.0.1:8787/'
        });
        expect(answer).toBe('');
        expect(seen.calls).toEqual(['files', 'window']);
        const id = seen.window?.layout.activeInstance()?.id ?? '';
        expect(id).not.toBe('');
        expect(seen.window?.layout.activeInstance()?.view).toBe('files');
        expect(filesViewOf(seen.window?.ui.instanceState(id)).reveal).toMatchObject({
            root: 'hub',
            path: FOLDER,
            settled: false
        });
    });
});
