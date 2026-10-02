// Layer 3, view test. What the keys of the Files tree do on the focused row, through the key
// handler of views/sources/files/tree/control/keyed.ts: Escape after Cut empties the clipboard,
// Cmd+Z and Shift+Cmd+Z take the newest file operation and the newest undo back, the undo of a
// delete asks first, and a rename started by Enter or F2 on a compacted row acts on the segment
// the cursor is on.
//
// The client is the real one with its change log and its undo replaced by recorders; the
// questions are a call that answers yes or no. What this does NOT cover: the keydown that reaches
// the handler (a browser; the chords that name the actions are asserted here against the keymap)
// and the name input drawn after a rename is started
// (tests/views/sources/files/menu/files-naming.test.ts).

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { engineDir, loadConfig, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../../src/lib/state/shared/words/text.ts';
import type { Change } from '../../../../../src/lib/state/sessions/changes.svelte.ts';
import type { FileRecord } from '../../../../../src/lib/state/sources/explorer/acts/undo.ts';
import { filesKeymap } from '../../../../../src/lib/state/sources/explorer/acts/keys.ts';
import { patchedFilesView, type TreeRow } from '../../../../../src/lib/state/sources/fs.ts';
import { boundAction } from '../../../../../src/lib/ui/tree/tree-keys.ts';
import { createKeyed } from '../../../../../src/lib/views/sources/files/tree/control/keyed.ts';
import { createPicks } from '../../../../../src/lib/views/sources/files/tree/control/picks.svelte.ts';
import { viewAccess } from '../../../../../src/lib/views/sources/files/tree/control/view-access.ts';
import { createClientState, type ClientState } from '../../../../fixtures/client.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const OWNER = 'files-1';

const file = (path: string): TreeRow => ({
    root: 'hub',
    path,
    name: path.slice(path.lastIndexOf('/') + 1),
    kind: 'file',
    size: 1,
    depth: 1,
    open: false
});

/** The row `a / b / c`: three folders drawn as one, standing at `a/b/c`. */
const CHAIN: TreeRow = {
    root: 'hub',
    path: 'a/b/c',
    name: 'c',
    kind: 'dir',
    size: 0,
    depth: 1,
    open: true,
    chain: [
        { name: 'a', path: 'a' },
        { name: 'b', path: 'a/b' },
        { name: 'c', path: 'a/b/c' }
    ]
};

/** A record of the change log for a file operation. */
const record = (at: string, field: string, undoes?: string): Change => ({
    at,
    kind: 'files',
    file: '/r/hub/x',
    key: 'files',
    field,
    before: [],
    after: [],
    undo: 'file',
    ...(undoes === undefined ? {} : { undoes })
});

/** A key press as the handler reads it: the handler touches only the target. */
const press = (): KeyboardEvent => ({ target: null }) as unknown as KeyboardEvent;

let client: ClientState;
let log: Change[];
let answers: boolean;
const asked: unknown[] = [];
const undone: FileRecord[] = [];

/** The handler over the rows now drawn, with the pieces a case watches. */
function handler(drawn: TreeRow[]) {
    const view = viewAccess(client, () => OWNER);
    const spy = {
        ...client,
        explorer: {
            ...client.explorer,
            undoFile: vi.fn((change: FileRecord) => {
                undone.push(change);
                return Promise.resolve({ ok: true, changed: ['files'], refused: [] });
            })
        },
        changes: {
            ...client.changes,
            latest: () => Promise.resolve(log),
            reload: vi.fn()
        }
    };
    const asking = {
        ask: vi.fn((question: unknown) => {
            asked.push(question);
            return Promise.resolve(answers);
        })
    };
    const picks = createPicks({
        client: spy,
        view,
        asking: {
            ...asking,
            asked: () => null,
            answered: () => undefined,
            choose: () => Promise.resolve([]),
            chosen: () => undefined
        },
        rows: () => drawn,
        roots: () => [{ key: 'hub', dir: '/r/hub', fixed: true }],
        fixed: () => [],
        addable: () => false,
        addRoot: () => undefined,
        removeRoot: () => undefined,
        hints: {},
        isSelected: () => false,
        select: () => undefined
    });
    const keyed = createKeyed({
        client: spy,
        view,
        asking,
        picks,
        rowOf: (id) => drawn.find((row) => `${row.root}:${row.path}` === id),
        drawn: () => drawn,
        roots: () => [{ key: 'hub', dir: '/r/hub', fixed: true }],
        onopen: () => undefined,
        ontoggle: () => undefined,
        onup: () => undefined
    });
    return { keyed, view, picks, spy, asking };
}

beforeEach(() => {
    client = createClientState();
    log = [];
    answers = true;
    asked.length = 0;
    undone.length = 0;
    client.ui.setInstanceState(OWNER, patchedFilesView(undefined, {}));
});

describe('Escape after Cut', () => {
    const cutting = filesKeymap(true).find((one) => one.code === 'Escape');

    // Revert: remove the `cancel-cut` branch of keyed.ts, so Escape leaves the cut in place.
    it('audits that Escape empties a Cut clipboard and leaves the key to the page with none', () => {
        const { keyed } = handler([file('a.txt')]);
        expect(cutting?.action).toBe('cancel-cut');

        client.explorer.cut([{ root: 'hub', path: 'a.txt' }]);
        expect(client.explorer.clipboard()?.mode).toBe('cut');
        expect(keyed('cancel-cut', 'hub:a.txt', press())).toBe(true);
        expect(client.explorer.clipboard()).toBeNull();

        client.explorer.copy([{ root: 'hub', path: 'a.txt' }]);
        expect(keyed('cancel-cut', 'hub:a.txt', press())).toBe(false);
        expect(client.explorer.clipboard()?.mode).toBe('copy');
    });
});

describe('Cmd+Z and Shift+Cmd+Z', () => {
    const chord = (shift: boolean): string | null =>
        boundAction(filesKeymap(true), {
            code: 'KeyZ',
            meta: true,
            ctrl: false,
            alt: false,
            shift
        });

    // Revert: take the `undo` and `redo` plans out of keyed.ts's branches.
    it('audits that the chords reach undone() and take the newest operation, then that undo, back', async () => {
        log = [record('3', 'rename'), record('2', 'create')];
        expect(chord(false)).toBe('undo');
        expect(chord(true)).toBe('redo');
        const { keyed, spy } = handler([file('a.txt')]);

        keyed(chord(false) ?? '', 'hub:a.txt', press());
        await vi.waitFor(() => expect(undone.map((one) => one.at)).toEqual(['3']));
        expect(spy.changes.reload).toHaveBeenCalled();

        // the undo of 3 is now the newest record, so Shift+Cmd+Z takes that one back
        log = [record('4', 'rename', '3'), record('3', 'rename'), record('2', 'create')];
        keyed(chord(true) ?? '', 'hub:a.txt', press());
        await vi.waitFor(() => expect(undone.map((one) => one.at)).toEqual(['3', '4']));
    });

    // Revert: skip the question for a delete in undone().
    it('audits that the undo of a delete or a trash asks first and does nothing on a no', async () => {
        log = [record('2', 'delete')];
        answers = false;
        const { keyed } = handler([file('a.txt')]);

        keyed('undo', 'hub:a.txt', press());
        await vi.waitFor(() => expect(asked).toEqual([{ kind: 'undo-delete' }]));
        await Promise.resolve();
        expect(undone).toEqual([]);

        answers = true;
        keyed('undo', 'hub:a.txt', press());
        await vi.waitFor(() => expect(undone.map((one) => one.at)).toEqual(['2']));
        expect(asked).toHaveLength(2);
    });

    // Revert: ask for every undo, not only the undo of a delete.
    it('audits that the undo of a create and every redo go without a question', async () => {
        log = [record('2', 'create')];
        const { keyed } = handler([file('a.txt')]);

        keyed('undo', 'hub:a.txt', press());
        await vi.waitFor(() => expect(undone).toHaveLength(1));
        expect(asked).toEqual([]);

        log = [record('3', 'delete', '2'), record('2', 'delete')];
        keyed('redo', 'hub:a.txt', press());
        await vi.waitFor(() => expect(undone).toHaveLength(2));
        expect(asked).toEqual([]);
    });
});

describe('a rename started on a compacted row', () => {
    // Revert: act on the row in keyed.ts instead of cursorOf(found), the segment under the cursor.
    it('audits that renames the folder of the segment the cursor is on', () => {
        const { keyed, view } = handler([CHAIN]);
        view.patch({ selected: { root: 'hub', path: 'a/b' } });

        expect(keyed('rename', 'hub:a/b/c', press())).toBe(true);

        expect(view.now().naming).toEqual({ mode: 'rename', root: 'hub', path: 'a/b' });
    });

    // Revert: leave the cursor out of cursorOf, so the row's own last folder is renamed.
    it('audits that renames the last folder when the cursor is on the row itself', () => {
        const { keyed, view } = handler([CHAIN]);
        view.patch({ selected: { root: 'hub', path: 'a/b/c' } });

        keyed('rename', 'hub:a/b/c', press());

        expect(view.now().naming).toEqual({ mode: 'rename', root: 'hub', path: 'a/b/c' });
    });
});
