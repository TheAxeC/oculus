// Layer 2, client-state tests. The session a diff pane was opened for: the part of the pane's id it
// makes, how a saved pane state reads it, and how the Changes view's rows carry it into the diff
// they open. A pane opened from the Repositories view has no session, and its id names the side,
// root and path alone.
//
// The store is exercised with a recording layout, so nothing here opens a tab or reaches git.

import { describe, expect, it } from 'vitest';
import {
    diffState,
    heldDiff,
    type DiffSubject
} from '../../../../../src/lib/state/sources/repositories/repositories.ts';
import {
    createRepositories,
    DIFF_VIEW,
    MERGE_VIEW
} from '../../../../../src/lib/state/sources/repositories/repositories.svelte.ts';
import type { LayoutStore } from '../../../../../src/lib/state/workbench/layout.svelte.ts';
import type { TerminalsStore } from '../../../../../src/lib/state/sessions/terminals.svelte.ts';
import type { WritesStore } from '../../../../../src/lib/state/client/writes.svelte.ts';

const FILE: DiffSubject = { root: '/hub', path: 'src/a.ts', staged: false, worktree: false };

describe('the id of a diff opened for a session', () => {
    it('puts the session after the side, so the same file is two tabs: one from Repositories, one from a session', () => {
        const plain = diffState(FILE, 'a.ts').id;
        const own = diffState({ ...FILE, session: 's-1' }, 'a.ts').id;
        expect(plain).toBe('changed:/hub:src/a.ts');
        expect(own).toBe('changed@s-1:/hub:src/a.ts');
        expect(own).not.toBe(plain);
    });

    it('gives two sessions two ids, and a staged and a changed diff of one session two ids', () => {
        const one = diffState({ ...FILE, session: 's-1' }, 'a.ts').id;
        const two = diffState({ ...FILE, session: 's-2' }, 'a.ts').id;
        const staged = diffState({ ...FILE, staged: true, session: 's-1' }, 'a.ts').id;
        expect(new Set([one, two, staged]).size).toBe(3);
        expect(staged).toBe('staged@s-1:/hub:src/a.ts');
    });

    it('gives an empty session the id of no session', () => {
        expect(diffState({ ...FILE, session: '' }, 'a.ts').id).toBe(diffState(FILE, 'a.ts').id);
    });

    it('gives a file named like a path plus a session another id than that path opened for the session', () => {
        const named = diffState({ ...FILE, path: 'a.ts:s-1' }, 'a.ts:s-1').id;
        const opened = diffState({ ...FILE, path: 'a.ts', session: 's-1' }, 'a.ts').id;
        expect(named).toBe('changed:/hub:a.ts:s-1');
        expect(opened).toBe('changed@s-1:/hub:a.ts');
        expect(named).not.toBe(opened);
    });

    it('gives a session named like a side or a root the id of its own place', () => {
        const ids = ['changed', 'staged', '/hub', ''].map(
            (session) => diffState({ ...FILE, session }, 'a.ts').id
        );
        expect(new Set(ids).size).toBe(4);
        expect(ids[0]).toBe('changed@changed:/hub:src/a.ts');
    });

    it('gives every kind of diff of one file, with a session where it takes one, an id of its own', () => {
        const kinds: Partial<DiffSubject>[] = [
            {},
            { staged: true },
            { session: 's-1' },
            { staged: true, session: 's-1' },
            { session: 'abc', commit: 'abc' },
            { session: 'stash@{0}', stash: 'stash@{0}' },
            { worktree: true },
            { against: { root: '/hub', path: 'b.ts' } },
            { group: 'staged' }
        ];
        const ids = kinds.map((over) => diffState({ ...FILE, ...over }, 'x').id);
        expect(new Set(ids).size).toBe(kinds.length);
    });

    it('takes no session into the id of a commit, a stash, a worktree, a compare or a group diff', () => {
        const others: Partial<DiffSubject>[] = [
            { commit: 'abc' },
            { stash: 'stash@{0}' },
            { worktree: true },
            { against: { root: '/hub', path: 'b.ts' } },
            { group: 'staged' }
        ];
        for (const over of others) {
            const without = diffState({ ...FILE, ...over }, 'x').id;
            expect(diffState({ ...FILE, ...over, session: 's-1' }, 'x').id).toBe(without);
        }
    });
});

describe('the session a saved pane state names', () => {
    const saved = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
        id: 'changed@s-1:/hub:src/a.ts',
        label: 'a.ts',
        root: '/hub',
        path: 'src/a.ts',
        staged: false,
        worktree: false,
        ...over
    });

    it('reads a session that is not a string as none, so the pane has the id of no session', () => {
        const held = heldDiff(saved({ session: 4 }));
        expect(held.session).toBe('');
        expect(held.path).toBe('src/a.ts');
        expect(diffState(held, held.label).id).toBe('changed:/hub:src/a.ts');
    });
});

/** A store over a layout that records what it is asked to open. */
function harness() {
    const opened: { view: string; state: unknown; beside: boolean }[] = [];
    const record = (view: string, state: unknown, beside: boolean): string => {
        opened.push({ view, state, beside });
        return 'one';
    };
    const layout = {
        openView: (view: string, state?: unknown) => record(view, state, false),
        openBeside: (view: string, state?: unknown) => record(view, state, true),
        showInFiles: () => 'one'
    } as unknown as LayoutStore;
    const access = {
        served: () => [{ key: 'hub', dir: '/hub' }],
        instanceState: () => undefined,
        setInstanceState: () => undefined
    };
    const store = createRepositories({} as WritesStore, {} as TerminalsStore, layout, access);
    return { store, opened };
}

describe('the diff a Changes row opens', () => {
    it('is the session own tab: the id carries the session and the state holds it', () => {
        const { store, opened } = harness();
        store.openChange('/hub', 'changed', 'src/a.ts', 's-1');
        store.openChange('/hub', 'staged', 'src/a.ts', 's-1');
        expect(opened.map((one) => [one.view, one.beside])).toEqual([
            [DIFF_VIEW, true],
            [DIFF_VIEW, true]
        ]);
        expect(opened[0].state).toMatchObject({
            id: 'changed@s-1:/hub:src/a.ts',
            session: 's-1',
            staged: false
        });
        expect(opened[1].state).toMatchObject({ id: 'staged@s-1:/hub:src/a.ts', staged: true });
    });

    it('opens the Repositories diff of the same file under the id of no session', () => {
        const { store, opened } = harness();
        store.openChange('/hub', 'changed', 'src/a.ts');
        store.openChange('/hub', 'changed', 'src/a.ts', 's-1');
        const ids = opened.map((one) => (one.state as { id: string }).id);
        expect(ids).toEqual(['changed:/hub:src/a.ts', 'changed@s-1:/hub:src/a.ts']);
    });

    it('opens the merge editor for a conflict and the file for an untracked path, whatever the session', () => {
        const { store, opened } = harness();
        store.openChange('/hub', 'merge', 'c.txt', 's-1');
        store.openChange('/hub', 'untracked', 'new/u.txt', 's-1');
        expect(opened.map((one) => [one.view, one.beside])).toEqual([
            [MERGE_VIEW, true],
            ['source', false]
        ]);
        expect(opened[0].state).toEqual({
            id: 'merge:/hub:c.txt',
            root: '/hub',
            path: 'c.txt',
            label: 'c.txt'
        });
        expect(opened[1].state).toEqual({ root: 'hub', path: 'new/u.txt', label: 'u.txt' });
    });
});
