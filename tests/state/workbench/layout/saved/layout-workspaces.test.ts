// Layer 2, client-state tests. The arrangement belongs to the open workspace: it is read once the
// workspace answer has named the workspace, saved per workspace, shown again when the workspace is
// opened again, carried to the file a Save As makes, and followed through the `storage` event of
// the open workspace's key only. Every case reads a fake storage and a fake event source.

import { describe, expect, it } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import {
    createStorage,
    serialiseLayout
} from '../../../../../src/lib/state/workbench/layout/index.ts';
import { createClientState } from '../../../../fixtures/client.ts';
import {
    fakeStorage,
    heldPages,
    pageAround,
    pane,
    layoutKey,
    unreadKey,
    UNSAVED
} from '../layout-fixture.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const A = '/hub/.oculus/workspaces/a.yml';
const B = '/hub/.oculus/workspaces/b.yml';

/** The labels of the pages the store shows. */
function labels(client: ReturnType<typeof createClientState>): string[] {
    return client.layout.pages().map((page) => page.label);
}

/** A storage that counts the keys it was asked to read. */
function counting() {
    const storage = fakeStorage();
    const read: string[] = [];
    return {
        ...storage,
        read,
        getItem: (key: string): string | null => {
            read.push(key);
            return storage.getItem(key);
        }
    };
}

/** A source of `storage` events a test fires by hand. */
function eventSource() {
    const heard: ((event: Event) => void)[] = [];
    return {
        addEventListener: (_: string, listener: (event: Event) => void) => heard.push(listener),
        removeEventListener: (_: string, listener: (event: Event) => void) => {
            heard.splice(heard.indexOf(listener), 1);
        },
        dispatchEvent: () => true,
        fire: (key: string) => {
            for (const listener of [...heard]) listener({ key } as unknown as Event);
        }
    };
}

describe('the arrangement of each workspace', () => {
    it('is saved and shown again for the workspace it was made in', () => {
        const client = createClientState();
        const storage = fakeStorage();
        client.layout.loadLayout(storage);
        client.layout.workspaceOpened(A);
        client.layout.openPage('In A');
        expect(client.layout.workspaceOpened(B)).toBe(false);
        expect(labels(client)).toEqual(['Page 1']);
        client.layout.openPage('In B');
        expect(client.layout.workspaceOpened(A)).toBe(true);
        expect(labels(client)).toEqual(['Page 1', 'In A']);
        expect(client.layout.workspaceOpened(B)).toBe(true);
        expect(labels(client)).toEqual(['Page 1', 'In B']);
        expect(Object.keys(storage.held).filter((key) => key.includes('workspace:'))).toEqual([
            layoutKey(A),
            layoutKey(B)
        ]);
    });

    it('is the default for a workspace that was never opened and is written at its first change', () => {
        const client = createClientState();
        const storage = fakeStorage(
            serialiseLayout(heldPages([pageAround('main', pane(['a']))])),
            A
        );
        client.layout.loadLayout(storage);
        expect(client.layout.workspaceOpened(B)).toBe(false);
        expect(layoutKey(B) in storage.held).toBe(false);
        client.layout.openPage('Extra');
        expect(storage.held[layoutKey(B)]).toContain('Extra');
        expect(storage.held[layoutKey(A)]).not.toContain('Extra');
    });

    it('is saved for the workspace left when a workspace is opened', () => {
        const client = createClientState();
        const storage = fakeStorage();
        client.layout.loadLayout(storage);
        client.layout.workspaceOpened(A);
        client.layout.openPage('In A');
        Reflect.deleteProperty(storage.held, layoutKey(A));
        client.layout.workspaceOpened(B);
        expect(storage.held[layoutKey(A)]).toContain('In A');
    });

    it('keeps an unreadable value of one workspace under that workspace unread key', () => {
        const client = createClientState();
        const storage = fakeStorage('garbage', B);
        client.layout.loadLayout(storage);
        client.layout.workspaceOpened(A);
        expect(unreadKey(B) in storage.held).toBe(false);
        client.layout.workspaceOpened(B);
        expect(storage.held[unreadKey(B)]).toBe('garbage');
        expect(unreadKey(A) in storage.held).toBe(false);
    });
});

describe('the workspace answer', () => {
    it('reads no key and writes none before it has come', () => {
        const client = createClientState();
        const storage = counting();
        client.layout.loadLayout(storage);
        client.layout.workspaceAnswered({ loading: true, error: '', open: null });
        client.layout.openPage('Early');
        expect(storage.read).toEqual([]);
        expect(storage.held).toEqual({});
        expect(client.layout.loaded()).toBe(false);
    });

    it('names the workspace by the real path of the open file', () => {
        const client = createClientState();
        const storage = fakeStorage(
            serialiseLayout(heldPages([pageAround('main', pane(['a']))])),
            A
        );
        client.layout.loadLayout(storage);
        client.layout.workspaceAnswered({ loading: false, error: '', open: { real: A } });
        expect(client.layout.pages().map((page) => page.id)).toEqual(['main']);
        expect(client.layout.loaded()).toBe(true);
    });

    it('names the unsaved workspace when the first answer failed or no file is open', () => {
        for (const answer of [
            { loading: false, error: 'down', open: null },
            { loading: false, error: '', open: null }
        ]) {
            const client = createClientState();
            const storage = fakeStorage(
                serialiseLayout(heldPages([pageAround('main', pane(['a']))])),
                UNSAVED
            );
            client.layout.loadLayout(storage);
            client.layout.workspaceAnswered(answer);
            expect(client.layout.pages().map((page) => page.id)).toEqual(['main']);
        }
    });

    it('keeps the workspace the page is in when a later answer failed', () => {
        const client = createClientState();
        const storage = fakeStorage();
        client.layout.loadLayout(storage);
        client.layout.workspaceAnswered({ loading: false, error: '', open: { real: A } });
        client.layout.openPage('In A');
        client.layout.workspaceAnswered({ loading: false, error: 'down', open: null });
        client.layout.openPage('Still A');
        expect(storage.held[layoutKey(A)]).toContain('Still A');
        expect(layoutKey(UNSAVED) in storage.held).toBe(false);
    });
});

describe('Save As', () => {
    it('shows the pages it leaves in the new file and saves them under both workspaces', () => {
        const client = createClientState();
        const storage = fakeStorage();
        client.layout.loadLayout(storage);
        client.layout.workspaceOpened(UNSAVED);
        client.layout.openPage('Made before');
        client.layout.workspaceCarried(A);
        expect(labels(client)).toEqual(['Page 1', 'Made before']);
        expect(client.layout.workspaceOpened(A)).toBe(true);
        expect(storage.held[layoutKey(A)]).toContain('Made before');
        expect(storage.held[layoutKey(UNSAVED)]).toContain('Made before');
        client.layout.openPage('After');
        expect(storage.held[layoutKey(A)]).toContain('After');
        expect(storage.held[layoutKey(UNSAVED)]).not.toContain('After');
    });
});

describe('the storage event', () => {
    it('is heard for the key of the open workspace and for no other', () => {
        const client = createClientState();
        const storage = fakeStorage();
        const source = eventSource();
        client.layout.loadLayout(storage, source);
        client.layout.workspaceOpened(A);
        const elsewhere = serialiseLayout(heldPages([pageAround('main', pane(['x']))]));
        storage.held[layoutKey(A)] = elsewhere;
        storage.held[layoutKey(B)] = elsewhere;
        source.fire(layoutKey(B));
        expect(client.layout.pages().map((page) => page.id)).not.toContain('main');
        source.fire(layoutKey(A));
        expect(client.layout.pages().map((page) => page.id)).toEqual(['main']);
        client.layout.workspaceOpened(B);
        storage.held[layoutKey(A)] = serialiseLayout(heldPages([pageAround('other', pane(['y']))]));
        source.fire(layoutKey(A));
        expect(client.layout.pages().map((page) => page.id)).toEqual(['main']);
    });
});

describe('the turn of the desktop host', () => {
    it('is asked for the key of the workspace a save is made under, from the envelope read there', () => {
        const asked: { key: string; from: string | null }[] = [];
        const held: Record<string, string> = {};
        const storage = createStorage((key, next, from) => {
            asked.push({ key, from });
            return { admitted: true };
        });
        storage.attach({
            getItem: (key) => held[key] ?? null,
            setItem: (key, value) => {
                held[key] = value;
            }
        });
        const pages = heldPages([pageAround('main', pane(['a']))]);
        storage.write(pages);
        expect(asked).toEqual([]);
        storage.select(A);
        storage.write(pages);
        storage.writeFor(B, pages);
        const text = serialiseLayout(pages);
        expect(asked).toEqual([
            { key: layoutKey(A), from: null },
            { key: layoutKey(B), from: null }
        ]);
        storage.write(pages);
        expect(asked.at(-1)).toEqual({ key: layoutKey(A), from: text });
    });
});
