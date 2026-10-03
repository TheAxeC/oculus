// Layer 3, view test. The file section of a project card mounted in Svelte's client runtime
// (tests/ui/frame/client-runtime.ts) over the fake document, where the effects of the card run: the
// record each card writes under its tab when it mounts, the late listing of a tab that was closed,
// and the listing a second ask superseded.
//
// The tree itself and the primitives around it are replaced by components that record the props
// they were handed, so what is asserted is what the card gives the tree. What this does NOT cover:
// the rows drawn, which are card-tree.test.ts, and a press, which needs a browser.

import { flushSync, mount, unmount } from 'svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CardDocs from '../../../../src/lib/views/shared/card/CardDocs.svelte';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { INSTANCE_KEY } from '../../../../src/lib/state/client/instance-context.ts';
import { STATE_KEY } from '../../../../src/lib/state/client/use.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { filesViewOf } from '../../../../src/lib/state/sources/fs.ts';
import type { BoardItem } from '../../../../src/lib/state/boards/board/index.ts';
import { json, settle } from '../../../fixtures/client.ts';
import { SNAPSHOT, item } from '../../../state/boards/board/board-fixture.ts';
import { domCase } from '../commands/commands-fixture.ts';

const { seen, nothing } = vi.hoisted(() => ({
    seen: { props: null as null | { rows: { root: string; path: string; name: string }[] } },
    nothing: () => undefined
}));

vi.mock('../../../../src/lib/views/shared/explorer/tree/Tree.svelte', () => ({
    default: (_anchor: unknown, props: NonNullable<typeof seen.props>) => {
        seen.props = props;
    }
}));
vi.mock('../../../../src/lib/ui/controls/ToolButton.svelte', () => ({ default: nothing }));
vi.mock('../../../../src/lib/ui/controls/text/Search.svelte', () => ({ default: nothing }));
vi.mock('../../../../src/lib/ui/frame/Empty.svelte', () => ({ default: nothing }));

setCatalog(textCatalog(loadConfig(engineDir()).config));

const state = domCase();

const ALPHA = 'projects/active/alpha';
const BRAVO = 'projects/manuscripts/bravo';

const ROOTS = {
    current: '',
    workspaces: [{ name: '', roots: [{ key: 'hub', dir: '/hub', fixed: true }] }],
    dropped: []
};

/** Every listing asked, by `root:path`, with the call that answers it. */
let listings: { key: string; answer: (entries: { name: string; kind: string }[]) => void }[] = [];

beforeEach(() => {
    seen.props = null;
    listings = [];
    vi.stubGlobal('fetch', (url: string) => {
        const at = new URL(url, 'http://oculus.test');
        const root = at.searchParams.get('root');
        if (root === null) return Promise.resolve(json(ROOTS));
        const key = `${root}:${at.searchParams.get('path') ?? ''}`;
        return new Promise<Response>((land) => {
            listings.push({
                key,
                answer: (entries) =>
                    land(json({ entries: entries.map((one) => ({ ...one, size: 1, mtime: 1 })) }))
            });
        });
    });
    state.client.entities.receive({ channel: 'portfolio', version: 1, payload: SNAPSHOT });
});

/** The card's files section mounted in a tab, in a fresh element of the fake document. */
function card(one: BoardItem, tab: string): ReturnType<typeof mount> {
    const app = mount(CardDocs, {
        target: state.root as unknown as Element,
        props: { item: one, onsaid: () => undefined, documents: false },
        context: new Map<unknown, unknown>([
            [STATE_KEY, state.client],
            [INSTANCE_KEY, () => tab]
        ])
    });
    flushSync();
    return app;
}

/** The records a tab's cards wrote, by key. */
const recordsOf = (tab: string): string[] => state.client.ui.instanceKeys(`${tab}#files:`).sort();

/** The workspace read, so the card knows which root holds its folder. */
async function workspaceRead(): Promise<void> {
    state.client.fs.workspaces();
    await settle();
}

describe('the records the cards of a tab write', () => {
    it('audits that each card writes a record of its own with its head open, and the tab record stays', async () => {
        await workspaceRead();
        const held = { id: 'alpha', doc: 'README.md' };
        state.client.ui.setInstanceState('tab-1', held);

        const first = card(item('alpha'), 'tab-1');
        const second = card(item('bravo'), 'tab-1');
        await settle();
        flushSync();

        expect(recordsOf('tab-1')).toEqual(['tab-1#files:alpha', 'tab-1#files:bravo']);
        expect(filesViewOf(state.client.ui.instanceState('tab-1#files:alpha')).expanded).toEqual([
            `hub:${ALPHA}`
        ]);
        expect(filesViewOf(state.client.ui.instanceState('tab-1#files:bravo')).expanded).toEqual([
            `hub:${BRAVO}`
        ]);
        expect(state.client.ui.instanceState('tab-1')).toEqual(held);
        void unmount(first);
        void unmount(second);
    });

    it('audits that the same project in two tabs keeps a record in each', async () => {
        await workspaceRead();

        const one = card(item('alpha'), 'tab-1');
        const two = card(item('alpha'), 'tab-2');
        await settle();

        expect(recordsOf('tab-1')).toEqual(['tab-1#files:alpha']);
        expect(recordsOf('tab-2')).toEqual(['tab-2#files:alpha']);
        void unmount(one);
        void unmount(two);
    });

    it('audits that a record saved before keeps its open folders when the card mounts again', async () => {
        await workspaceRead();
        const saved = { expanded: [`hub:${ALPHA}`, `hub:${ALPHA}/code`] };
        state.client.ui.setInstanceState('tab-1#files:alpha', saved);

        const app = card(item('alpha'), 'tab-1');
        await settle();

        expect(state.client.ui.instanceState('tab-1#files:alpha')).toEqual(saved);
        void unmount(app);
    });
});

describe('the listing of a tab that was closed', () => {
    // Red when the seed effect of ProjectTree.svelte reads the record with tracking: the close
    // then re-seeds the record it cleared.
    it('audits that a listing landing after the close writes nothing into the cleared record', async () => {
        const tab = state.client.layout.openView('files', {});
        await workspaceRead();
        const app = card(item('alpha'), tab);
        await settle();
        expect(recordsOf(tab)).toEqual([`${tab}#files:alpha`]);
        const out = listings.find((one) => one.key === `hub:${ALPHA}`);
        expect(out).toBeDefined();

        state.client.layout.closeInstance(tab);
        expect(recordsOf(tab)).toEqual([]);
        out?.answer([{ name: 'README.md', kind: 'file' }]);
        await settle();
        flushSync();

        expect(recordsOf(tab)).toEqual([]);
        void unmount(app);
    });
});

describe('the selection a late listing changes', () => {
    const picked = { root: 'hub', path: `${ALPHA}/README.md` };

    /** A tab whose card tree record holds a selected row, the listing of its folder in flight. */
    async function selectedCard(): Promise<{
        tab: string;
        app: ReturnType<typeof mount>;
        out: (typeof listings)[number];
    }> {
        const tab = state.client.layout.openView('files', {});
        await workspaceRead();
        state.client.ui.setInstanceState(`${tab}#files:alpha`, {
            expanded: [`hub:${ALPHA}`],
            selected: picked,
            selection: [],
            anchor: picked
        });
        const app = card(item('alpha'), tab);
        await settle();
        const out = listings.find((one) => one.key === `hub:${ALPHA}`);
        if (out === undefined) throw new Error('the card asked for no listing of the project');
        return { tab, app, out };
    }

    it('audits that a selected row the late listing no longer holds is dropped in the record of an open tab', async () => {
        const { tab, app, out } = await selectedCard();
        out.answer([{ name: 'other.md', kind: 'file' }]);
        await settle();
        flushSync();

        const view = filesViewOf(state.client.ui.instanceState(`${tab}#files:alpha`));
        expect(view.selected).toBeNull();
        void unmount(app);
    });
});

describe('a second listing of the project folder', () => {
    // Red when a mark no longer cancels the ask it supersedes (markOne in queries.svelte.ts).
    it('audits that the later answer is the one the tree is given', async () => {
        await workspaceRead();
        const app = card(item('alpha'), 'tab-1');
        await settle();
        flushSync();
        const first = listings.filter((one) => one.key === `hub:${ALPHA}`);
        expect(first).toHaveLength(1);

        state.client.fs.invalidate();
        await settle();
        const second = listings.filter((one) => one.key === `hub:${ALPHA}`);
        expect(second).toHaveLength(2);
        second[1].answer([{ name: 'new.md', kind: 'file' }]);
        await settle();
        first[0].answer([{ name: 'old.md', kind: 'file' }]);
        await settle();
        flushSync();

        const names = (seen.props?.rows ?? []).map((row) => row.name);
        expect(names).toContain('new.md');
        // The first ask was superseded, so its answer arriving last must not be the one drawn.
        expect(names).not.toContain('old.md');
        void unmount(app);
    });
});
