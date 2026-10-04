// Layer 2, client-state tests. The preview tab: the tab a single click opens, which the next single
// click in the same pane is pointed at instead of opening a second one, and the four things that
// keep it.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { panes, type Instance } from '../../../../../src/lib/state/workbench/layout/index.ts';
import {
    parseLayout,
    serialiseLayout
} from '../../../../../src/lib/state/workbench/layout/index.ts';
import { createClientState, type ClientState } from '../../../../fixtures/client.ts';
import { noop } from '../../../../fixtures/doubles.ts';

let client: ClientState;
let apply: ClientState['layout']['apply'];
let keepPreview: ClientState['layout']['keepPreview'];
let layout: ClientState['layout']['layout'];
let openView: ClientState['layout']['openView'];
let splitInstance: ClientState['layout']['splitInstance'];
let transferInstance: ClientState['layout']['transferInstance'];

beforeEach(() => {
    client = createClientState();
    ({ apply, keepPreview, layout, openView, splitInstance, transferInstance } = client.layout);
    client.ui.loadUi({ getItem: () => null, setItem: noop });
    apply({ root: { kind: 'pane', tabs: [], active: '' } });
});

afterEach(() => vi.unstubAllGlobals());

/** Every tab of the page's tree, in the order the strip draws them. */
function tabs(): Instance[] {
    return panes(layout()).flatMap(({ pane }) => pane.tabs);
}

/** One file's state, which is what the file browser hands a source tab. */
function file(path: string): Record<string, string> {
    return { root: 'hub', path, label: path };
}

describe('the preview tab', () => {
    it('is replaced in place by the next preview open, keeping its position in the strip', () => {
        const kept = openView('status');
        const first = openView('source', file('a.py'), undefined, { preview: true });
        const second = openView('source', file('b.py'), undefined, { preview: true });

        expect(second).toBe(first);
        expect(tabs().map((tab) => tab.id)).toEqual([kept, first]);
        expect(tabs().at(-1)?.state).toEqual(file('b.py'));
        expect(tabs().at(-1)?.preview).toBe(true);
    });

    it('is retargeted across views, so a preview of a picture becomes a preview of a file', () => {
        const first = openView('source', file('a.py'), undefined, { preview: true });
        const second = openView('file', file('plot.png'), undefined, { preview: true });

        expect(second).toBe(first);
        expect(tabs()).toHaveLength(1);
        expect(tabs()[0].view).toBe('file');
    });

    it('opens beside a kept tab rather than replacing it', () => {
        const first = openView('source', file('a.py'));
        const second = openView('source', file('b.py'), undefined, { preview: true });

        expect(second).not.toBe(first);
        expect(tabs().map((tab) => tab.preview)).toEqual([undefined, true]);
    });

    it('takes the state of the view it becomes with it, and keeps none of the one it was', () => {
        const first = openView('source', file('a.py'), undefined, { preview: true });
        client.ui.setInstanceState(first, { text: 'what a.py holds', loaded: true });
        openView('source', file('b.py'), undefined, { preview: true });

        // The tab keeps its id, so a draft left under it would be read as the next file's.
        expect(client.ui.instanceState(first)).toBeUndefined();
    });

    it("throws away the first file's read when it lands after the tab was pointed at the second", async () => {
        // The first read is held back until the second has landed, which is the order a fast second
        // click makes: the tab must end with the second file's text, and stay with it.
        const { promise: firstBody, resolve: releaseFirst } = Promise.withResolvers<string>();
        vi.stubGlobal('fetch', (url: string) =>
            url.startsWith('/api/source')
                ? Promise.resolve(
                      new Response(JSON.stringify({ ok: true, readonly: false }), {
                          headers: { 'content-type': 'application/json' }
                      })
                  )
                : url.endsWith('/a.py')
                  ? firstBody.then((body) => new Response(body))
                  : Promise.resolve(new Response('print("b")\n'))
        );
        const tab = openView('source', file('a.py'), undefined, { preview: true });
        const first = client.source.loadSourceDraft(tab, 'hub', 'a.py');

        const again = openView('source', file('b.py'), undefined, { preview: true });
        expect(again).toBe(tab);
        await client.source.loadSourceDraft(tab, 'hub', 'b.py');
        expect(client.source.sourceDraft(tab).text).toBe('print("b")\n');

        releaseFirst('print("a")\n');
        await first;
        expect(client.source.sourceDraft(tab).text).toBe('print("b")\n');
        expect(client.source.sourceDraft(tab).saved).toBe('print("b")\n');
        // The read of the file the tab holds is done, so it is not asked for again.
        await client.source.loadSourceDraft(tab, 'hub', 'b.py');
        expect(client.source.sourceDraft(tab).text).toBe('print("b")\n');
    });

    it('is kept when the same file is asked for a second time, which is the double click', () => {
        const first = openView('source', file('a.py'), undefined, { preview: true });
        const again = openView('source', file('a.py'), undefined, { preview: true });

        expect(again).toBe(first);
        expect(tabs()).toHaveLength(1);
        // The two clicks of a double click are one open and then the same file again, so the tab is
        // kept even where the first click took the file browser off the screen.
        expect(tabs()[0].preview).toBeUndefined();
    });

    it('activates a kept tab of the same file rather than replacing the preview', () => {
        const kept = openView('source', file('a.py'));
        const preview = openView('source', file('b.py'), undefined, { preview: true });
        const again = openView('source', file('a.py'), undefined, { preview: true });

        expect(again).toBe(kept);
        expect(tabs().map((tab) => tab.id)).toEqual([kept, preview]);
        expect(tabs().map((tab) => tab.preview)).toEqual([undefined, true]);
        expect(tabs().at(-1)?.state).toEqual(file('b.py'));
    });

    it('is kept by the double click, and the tab after it opens beside it', () => {
        const first = openView('source', file('a.py'), undefined, { preview: true });
        keepPreview(first);
        expect(tabs()[0].preview).toBeUndefined();

        const second = openView('source', file('b.py'), undefined, { preview: true });
        expect(second).not.toBe(first);
        expect(tabs().map((tab) => tab.preview)).toEqual([undefined, true]);
    });

    it('is kept by a drag of the tab into another pane', () => {
        const kept = openView('status');
        splitInstance(kept, [], 'right');
        const preview = openView('source', file('a.py'), undefined, { preview: true });
        transferInstance(preview, [0], 0);

        expect(panes(layout())[0].pane.tabs.map((tab) => tab.id)).toContain(preview);
        expect(tabs().every((tab) => tab.preview === undefined)).toBe(true);
    });

    it('is kept by a split of the pane it sits in', () => {
        openView('status');
        const preview = openView('source', file('a.py'), undefined, { preview: true });
        splitInstance(preview, [], 'right');

        expect(panes(layout())).toHaveLength(2);
        expect(tabs().every((tab) => tab.preview === undefined)).toBe(true);
    });

    it('changes nothing when a tab that is kept is kept again, or the id names none', () => {
        const kept = openView('status');
        const before = layout();
        keepPreview(kept);
        keepPreview('no-such-instance');

        expect(layout()).toEqual(before);
    });

    it('survives a reload, so a reader who left one open finds the tab as it was', () => {
        openView('source', file('a.py'), undefined, { preview: true });
        const written = serialiseLayout({
            pages: client.layout.pages(),
            current: client.layout.currentPage().id,
            floats: []
        });
        const read = parseLayout(written, 'One');

        expect(read).not.toBeNull();
        const restored = read === null ? [] : panes(read.pages[0].workbench.root)[0].pane.tabs;
        expect(restored.map((tab) => tab.preview)).toEqual([true]);
    });

    it('reads a saved tab that carries no field as one that is kept', () => {
        const envelope = {
            version: 4,
            pages: [
                {
                    id: 'page-one',
                    label: 'One',
                    workbench: {
                        root: {
                            kind: 'pane',
                            tabs: [{ id: 'old', view: 'status', state: {} }],
                            active: 'old'
                        }
                    }
                }
            ],
            current: 'page-one',
            floats: []
        };
        const read = parseLayout(envelope, 'One');

        expect(read).not.toBeNull();
        expect(read === null ? [] : panes(read.pages[0].workbench.root)[0].pane.tabs).toEqual([
            { id: 'old', view: 'status', state: {} }
        ]);
    });
});
