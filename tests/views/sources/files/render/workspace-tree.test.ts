// Layer 3, view test. The Files view over a stubbed server, as the server renders it: the workspace
// header with its four title actions over three top-level folders and no Workspaces section, and a
// tab rooted at a folder, which draws the `..` row and no header.
//
// `fetch` and `window` are stubs; the roots and the listings are fixtures. What this does NOT
// cover: the fetches against a real server (tests/routes/files/fs.test.ts), the look (a browser),
// and pressing a control or a key, which no server rendering runs.

import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import Files from '../../../../../src/lib/views/sources/files/Files.svelte';
import { installRealText } from '../../../shared/real-text.ts';
import { instance } from '../files-instance.ts';
import { clientContext, createClientState, type ClientState } from '../../../../fixtures/client.ts';
import { between } from '../../../shared/pane-parts.ts';

installRealText();

const ROOTS = JSON.stringify({
    current: '',
    workspaces: [
        {
            name: '',
            roots: [
                { key: 'hub', dir: '/hub', fixed: true },
                { key: 'engine', dir: '/hub/tools/oculus/config', fixed: true },
                { key: 'notes', dir: '/home/notes', fixed: false }
            ]
        }
    ],
    dropped: []
});

const LISTINGS: Record<string, unknown[]> = {
    'hub:': [{ name: 'projects', kind: 'dir', size: 0, mtime: 1 }],
    'hub:projects': [
        { name: 'alpha', kind: 'dir', size: 0, mtime: 1 },
        { name: 'one.md', kind: 'file', size: 4, mtime: 1 }
    ],
    'hub:projects/alpha': [{ name: 'a.md', kind: 'file', size: 4, mtime: 1 }],
    'engine:': [{ name: 'behavior.yml', kind: 'file', size: 4, mtime: 1 }],
    'notes:': [{ name: 'n.txt', kind: 'file', size: 4, mtime: 1 }]
};

function json(body: string): Response {
    return new Response(body, { status: 200, headers: { 'content-type': 'application/json' } });
}

/** Let the store's scheduled requests run and their answers land. */
async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
}

/** A client whose roots and listings are read from the fixtures, with the listings asked for. */
async function loaded(listed: string[]): Promise<ClientState> {
    vi.stubGlobal('window', {});
    vi.stubGlobal('fetch', (url: string) => {
        const at = new URL(url, 'http://oculus.test');
        const root = at.searchParams.get('root');
        if (root === null) return Promise.resolve(json(ROOTS));
        const key = `${root}:${at.searchParams.get('path') ?? ''}`;
        return Promise.resolve(json(JSON.stringify({ entries: LISTINGS[key] ?? [] })));
    });
    const fresh = createClientState();
    fresh.fs.workspaces();
    await settle();
    for (const key of listed) {
        const at = key.indexOf(':');
        fresh.fs.listing(key.slice(0, at), key.slice(at + 1));
    }
    await settle();
    return fresh;
}

afterEach(() => {
    vi.unstubAllGlobals();
});

/** The row keys of a rendering, in the order they are drawn. */
function rowKeys(body: string): string[] {
    return [...body.matchAll(/data-fs-row="([^"]*)"/g)].map((one) => one[1]);
}

describe('the workspace as the explorer heads it', () => {
    // Revert: draw the roots without the header row, or the Workspaces section again.
    it('draws the header row with its four actions, three folder rows and no Workspaces section', async () => {
        const fresh = await loaded(['hub:', 'engine:', 'notes:']);
        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });
        const header = between(body, 'aria-label="Roots and folders"', '<ul class="rows"');

        expect(header).toContain('aria-label="Configured roots"');
        for (const action of [
            'New File...',
            'New Folder...',
            'Refresh Explorer',
            'Collapse Folders in Explorer'
        ]) {
            expect(header).toContain(`aria-label="${action}"`);
        }
        expect(rowKeys(body)).toEqual(['hub:', 'engine:', 'notes:']);
        // the Workspaces section is not drawn in the body of a Files tab
        expect(body).not.toContain('data-fs-workspaces');
        // no heading of any section by that name is left in the tab
        expect(body).not.toContain('Workspaces');
    });

    // Revert: leave the header in the tree of a rooted tab.
    it('draws a rooted tab from its folder with the `..` row above and no header', async () => {
        const fresh = await loaded(['hub:', 'hub:projects', 'hub:projects/alpha']);
        fresh.ui.setInstanceState('files-one', {
            top: { root: 'hub', path: 'projects/alpha' },
            expanded: ['hub:projects/alpha']
        });
        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        // a tab rooted at a folder has no explorer header to carry the icons
        expect(body).not.toContain('aria-label="New File..."');
        // refresh sits in the same header, which this tab does not draw
        expect(body).not.toContain('aria-label="Refresh Explorer"');
        // the row above the head is the folder one level up, drawn as `..`
        expect(rowKeys(body)).toEqual([
            'hub:projects',
            'hub:projects/alpha',
            'hub:projects/alpha/a.md'
        ]);
        expect(body.replace(/<!--.*?-->/g, '')).toMatch(/class="name[^"]*">\.\.</);
        expect(body).toContain('a.md');
        // a file beside the rooted folder in its parent is not listed under it
        expect(body).not.toContain('one.md');
    });

    // Revert: draw the `..` row at the top of the root.
    it('draws no `..` row when the tab is rooted at the top of its root', async () => {
        const fresh = await loaded(['hub:']);
        fresh.ui.setInstanceState('files-one', {
            top: { root: 'hub', path: '' },
            expanded: ['hub:']
        });
        const { body } = render(Files, {
            context: clientContext(fresh),
            props: { instance: instance() }
        });

        expect(body).not.toMatch(/>\.\.</);
        // a tab at the top of its root has no header either
        expect(body).not.toContain('aria-label="New File..."');
    });
});
