// Layer 3, view test. The file section of a project card, as the server renders it: the record
// each card keeps its tree under, and the finder box asking for no project files while it is
// empty. How the tree draws is seen at the look.
//
// `fetch` and `window` are stubs; the roots, the listings and the portfolio are fixtures. What this
// does NOT cover: a press on a row, a key, a drag or a menu, which need a DOM and are seen at the
// look; the record written when the card mounts and the listings that land after a close, which are
// card-tree.client.test.ts.

import { render } from 'svelte/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CardDocs from '../../../../src/lib/views/shared/card/CardDocs.svelte';
import { INSTANCE_KEY } from '../../../../src/lib/state/client/instance-context.ts';
import type { BoardItem } from '../../../../src/lib/state/boards/board/index.ts';
import { installRealText } from '../real-text.ts';
import { noop } from '../../../fixtures/doubles.ts';
import {
    clientContext,
    createClientState,
    json,
    settle,
    type ClientState
} from '../../../fixtures/client.ts';
import { SNAPSHOT, item } from '../../../state/boards/board/board-fixture.ts';

installRealText();

const TAB = 'tab-1';
const ALPHA = 'projects/active/alpha';
const BRAVO = 'projects/manuscripts/bravo';

/** The workspace: the hub, and one folder the reader added. */
function roots(extra: { key: string; dir: string; fixed: boolean }[] = []): object {
    return {
        current: '',
        workspaces: [
            {
                name: '',
                roots: [
                    { key: 'hub', dir: '/hub', fixed: true },
                    { key: 'notes', dir: '/home/notes', fixed: false },
                    ...extra
                ]
            }
        ],
        dropped: []
    };
}

const LISTINGS: Record<string, unknown[]> = {
    [`hub:${ALPHA}`]: [
        { name: 'code', kind: 'dir', size: 0, mtime: 1 },
        { name: 'README.md', kind: 'file', size: 4, mtime: 1 },
        { name: 'project.yml', kind: 'file', size: 4, mtime: 1 }
    ],
    [`hub:${ALPHA}/code`]: [{ name: 'run.py', kind: 'file', size: 4, mtime: 1 }],
    [`hub:${BRAVO}`]: [{ name: 'main.tex', kind: 'file', size: 4, mtime: 1 }],
    'alpha:': [{ name: 'inside.md', kind: 'file', size: 4, mtime: 1 }]
};

/** The files the project listing answers for a card, the most recent first. */
const PROJECT_ROWS = [
    { path: 'drafts/report.docx', size: 2048, mtime: 3 },
    { path: 'notes.md', size: 10, mtime: 2 },
    { path: 'old/report-draft.txt', size: 3072, mtime: 1 }
];

/** Every address the stub was asked, in order. */
let asked: string[] = [];

let client: ClientState;

/** A client over the roots given, with the listings named read and the portfolio received. */
async function loaded(listed: string[], held: object = roots()): Promise<void> {
    vi.stubGlobal('window', {});
    asked = [];
    vi.stubGlobal('fetch', (url: string) => {
        asked.push(url);
        const at = new URL(url, 'http://oculus.test');
        if (at.pathname === '/api/project-files') {
            const answer = { rows: PROJECT_ROWS, truncated: false, folder: ALPHA };
            return Promise.resolve(json(answer));
        }
        const root = at.searchParams.get('root');
        if (root === null) return Promise.resolve(json(held));
        const key = `${root}:${at.searchParams.get('path') ?? ''}`;
        return Promise.resolve(json({ entries: LISTINGS[key] ?? [] }));
    });
    client = createClientState();
    client.entities.receive({ channel: 'portfolio', version: 1, payload: SNAPSHOT });
    client.fs.workspaces();
    await settle();
    for (const key of listed) {
        const at = key.indexOf(':');
        client.fs.listing(key.slice(0, at), key.slice(at + 1));
    }
    await settle();
}

beforeEach(() => {
    asked = [];
});

afterEach(() => {
    vi.unstubAllGlobals();
});

/** The files section of one card, drawn in a tab. */
function section(one: BoardItem): string {
    const context = clientContext(client);
    context.set(INSTANCE_KEY, () => TAB);
    return render(CardDocs, {
        context,
        props: { item: one, onsaid: noop, documents: false }
    }).body;
}

/** The row keys of a rendering, in the order they are drawn. */
function rowKeys(body: string): string[] {
    return [...body.matchAll(/data-fs-row="([^"]*)"/g)].map((one) => one[1]);
}

/** The key of the record one card keeps its tree under. */
const recordOf = (project: string): string => `${TAB}#files:${project}`;

describe('the tree of a project card', () => {
    // Revert: draw the card's tree from the project tab's own record.
    it('opens the head of a card whose record is not saved yet, and a saved record decides after', async () => {
        await loaded([`hub:${ALPHA}`, `hub:${ALPHA}/code`]);
        expect(rowKeys(section(item('alpha')))).toContain(`hub:${ALPHA}/code`);

        client.ui.setInstanceState(recordOf('alpha'), {
            expanded: [`hub:${ALPHA}`, `hub:${ALPHA}/code`]
        });
        expect(rowKeys(section(item('alpha')))).toContain(`hub:${ALPHA}/code/run.py`);

        client.ui.setInstanceState(recordOf('alpha'), { expanded: [] });
        expect(rowKeys(section(item('alpha')))).toEqual([`hub:${ALPHA}`]);
    });

    // Revert: key every card of a tab by the tab alone.
    it('keeps a record for each card of a tab, so one card closed leaves another open', async () => {
        await loaded([`hub:${ALPHA}`, `hub:${BRAVO}`]);
        client.ui.setInstanceState(recordOf('alpha'), { expanded: [] });

        const closed = rowKeys(section(item('alpha')));
        const open = rowKeys(section(item('bravo')));

        expect(closed).toEqual([`hub:${ALPHA}`]);
        expect(open).toEqual([`hub:${BRAVO}`, `hub:${BRAVO}/main.tex`]);
    });

    // Revert: read a record of the wrong shape as the saved state of the tab.
    it('reads a record of the wrong shape as an empty tree and leaves the other records as they were', async () => {
        await loaded([`hub:${ALPHA}`]);
        const other = { expanded: [`hub:${ALPHA}`, `hub:${ALPHA}/code`] };
        client.ui.setInstanceState(recordOf('alpha'), 'not a record');
        client.ui.setInstanceState(recordOf('beta'), other);
        client.ui.setInstanceState(TAB, { id: 'alpha', doc: 'README.md' });

        const body = section(item('alpha'));

        expect(rowKeys(body)).toEqual([`hub:${ALPHA}`]);
        expect(client.ui.instanceState(recordOf('beta'))).toEqual(other);
        expect(client.ui.instanceState(TAB)).toEqual({ id: 'alpha', doc: 'README.md' });
    });

    // Revert: take the tab's own record for the card's tree.
    it('leaves the tab record of a project view as it was, whatever its card draws', async () => {
        await loaded([`hub:${ALPHA}`]);
        const held = { id: 'alpha', doc: 'README.md' };
        client.ui.setInstanceState(TAB, held);

        expect(rowKeys(section(item('alpha')))[0]).toBe(`hub:${ALPHA}`);

        expect(client.ui.instanceState(TAB)).toEqual(held);
    });
});

describe('the finder box of a project card', () => {
    // Revert: call files(item.id) whatever the box holds.
    it('asks for no project files while the box is empty', async () => {
        await loaded([`hub:${ALPHA}`]);
        asked = [];

        section(item('alpha'));
        await settle();

        expect(asked.filter((url) => url.startsWith('/api/project-files'))).toEqual([]);
    });

    it('asks for no project files while the box holds only spaces, and draws the head open', async () => {
        await loaded([`hub:${ALPHA}`]);
        client.ui.setInstanceState(recordOf('alpha'), { filter: '   ' });
        asked = [];

        const body = section(item('alpha'));
        await settle();

        expect(asked.filter((url) => url.startsWith('/api/project-files'))).toEqual([]);
        // The record holds the finder text and no open folders, so the head is drawn open.
        expect(rowKeys(body)).toContain(`hub:${ALPHA}/README.md`);
    });
});
