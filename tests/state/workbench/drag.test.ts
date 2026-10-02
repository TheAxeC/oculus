// The one drag in progress: the threshold that tells a click from a drag, what each kind of drop
// performs, and the geometry that turns a point inside a pane body into an edge.
//
// The store is handed a sink that records what it was asked to do, so nothing here touches the
// layout store or storage. There is no DOM in this suite either, which the store's own guard
// covers: a drag driven by calls runs exactly as one driven by the document's listeners.
//
// What this does NOT cover: the listeners themselves, the pointer that installs them, and anything
// drawn. A drag needs a DOM and is not run here.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    AT_END,
    THRESHOLD,
    edgeAt,
    markAt,
    withoutOwn,
    type DragSink
} from '../../../src/lib/state/workbench/drag.svelte.ts';
import { createClientState, type ClientState } from '../../fixtures/client.ts';
import { serialiseLayout } from '../../../src/lib/state/workbench/layout/index.ts';
import { engineDir, loadConfig, textCatalog } from '../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../src/lib/state/shared/words/text.ts';
import { fakeStorage, heldPages, pageAround, pane, split } from './layout/layout-fixture.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

let client: ClientState;
let cancel: ClientState['drag']['cancel'];
let dragging: ClientState['drag']['dragging'];
let end: ClientState['drag']['end'];
let hover: ClientState['drag']['hover'];
let move: ClientState['drag']['move'];
let setDragSink: ClientState['drag']['setDragSink'];
let start: ClientState['drag']['start'];
let startPage: ClientState['drag']['startPage'];
let startView: ClientState['drag']['startView'];

beforeEach(() => {
    client = createClientState();
    ({ cancel, dragging, end, hover, move, setDragSink, start, startPage, startView } =
        client.drag);
});

/** A sink that writes down what it was asked to perform, one line per call. */
function recorder(): DragSink & { calls: string[] } {
    const calls: string[] = [];
    return {
        calls,
        open: (view, state, page) => {
            calls.push(`open ${view} ${JSON.stringify(state ?? null)} on ${page ?? 'screen'}`);
            return `${view}-tab`;
        },
        holds: (path, id) => path.join(',') === '9' && id === 'catalogue-tab',
        away: (view, state, avoid, page) =>
            calls.push(
                `away ${view} ${JSON.stringify(state ?? null)} from ${avoid} on ${page ?? 'screen'}`
            ),
        transfer: (id, path, index) =>
            calls.push(`transfer ${id} to [${path.join(',')}] at ${index}`),
        split: (id, path, edge) => calls.push(`split ${id} to [${path.join(',')}] on ${edge}`),
        embed: (nested, path, edge, page) =>
            calls.push(`embed ${nested} in ${page} at [${path.join(',')}] on ${edge}`),
        float: (id, at) => calls.push(`float ${id} at ${at.x},${at.y}`)
    };
}

let sink = recorder();

beforeEach(() => {
    cancel();
    sink = recorder();
    setDragSink(sink);
});

/** A drag that is past the threshold, which is what every drop test starts from. */
function begin(id = 'a'): void {
    start(id, 'Projects', { x: 100, y: 100 });
    move({ x: 100 + THRESHOLD, y: 100 });
}

describe('the threshold', () => {
    it('draws nothing until the pointer has moved far enough', () => {
        start('a', 'Projects', { x: 100, y: 100 });
        expect(dragging()).toBe(null);
        move({ x: 103, y: 102 });
        expect(dragging()).toBe(null);
    });

    it('arms at the threshold and stays armed on the way back', () => {
        start('a', 'Projects', { x: 100, y: 100 });
        move({ x: 100, y: 100 + THRESHOLD });
        expect(dragging()).not.toBe(null);
        move({ x: 100, y: 100 });
        expect(dragging()?.point).toEqual({ x: 100, y: 100 });
    });

    it('performs nothing when a press that never moved is released over a drop', () => {
        start('a', 'Projects', { x: 100, y: 100 });
        hover({ kind: 'strip', path: [], index: 0 });
        end();
        expect(sink.calls).toEqual([]);
        expect(dragging()).toBe(null);
    });

    it('carries the tab it was started with', () => {
        begin('tab-1');
        expect(dragging()).toEqual({
            kind: 'tab',
            id: 'tab-1',
            label: 'Projects',
            point: { x: 106, y: 100 },
            drop: null,
            rect: null,
            refused: false,
            alt: false
        });
    });
});

describe('performing a drop', () => {
    it('moves the tab into a strip at the index it was hovered at', () => {
        begin();
        hover({ kind: 'strip', path: [1, 0], index: 2 });
        end();
        expect(sink.calls).toEqual(['transfer a to [1,0] at 2']);
    });

    it('moves the tab to the end of the strip for a drop in the middle of a body', () => {
        begin();
        hover({ kind: 'centre', path: [0] }, { x: 0, y: 0, width: 10, height: 10 });
        end();
        expect(sink.calls).toEqual([`transfer a to [0] at ${AT_END}`]);
    });

    it('splits the pane for a drop on an edge', () => {
        begin();
        hover({ kind: 'edge', path: [], edge: 'bottom' });
        end();
        expect(sink.calls).toEqual(['split a to [] on bottom']);
    });

    it('performs one operation and only one, and forgets the drag', () => {
        begin();
        hover({ kind: 'strip', path: [], index: 0 });
        hover({ kind: 'edge', path: [], edge: 'left' });
        end();
        end();
        expect(sink.calls).toEqual(['split a to [] on left']);
        expect(dragging()).toBe(null);
    });

    it('performs nothing when the pointer came up over nothing', () => {
        begin();
        hover({ kind: 'strip', path: [], index: 1 });
        hover(null);
        end();
        expect(sink.calls).toEqual([]);
    });

    it('performs nothing when the drag was called off', () => {
        begin();
        hover({ kind: 'edge', path: [], edge: 'right' });
        cancel();
        expect(dragging()).toBe(null);
        end();
        expect(sink.calls).toEqual([]);
    });

    it('holds the body a drop is over, for whatever draws the indicator', () => {
        begin();
        const rect = { x: 20, y: 30, width: 400, height: 200 };
        hover({ kind: 'edge', path: [1], edge: 'top' }, rect);
        expect(dragging()?.rect).toEqual(rect);
    });

    it('ignores a hover and a move when no drag was started', () => {
        hover({ kind: 'strip', path: [], index: 0 });
        move({ x: 500, y: 500 });
        expect(dragging()).toBe(null);
        end();
        expect(sink.calls).toEqual([]);
    });
});

describe('a page carried out of the strip', () => {
    it('is armed at once, since the gesture that starts it already crossed the threshold', () => {
        startPage('page-2', 'Reading', { x: 100, y: 100 });
        expect(dragging()?.id).toBe('page-2');
        expect(dragging()?.kind).toBe('page');
    });

    it('lands on an edge, and shows the page there', () => {
        startPage('page-2', 'Reading', { x: 100, y: 100 });
        hover({ kind: 'edge', path: [1, 0], edge: 'right', page: 'page-1' });
        end();
        expect(sink.calls).toEqual(['embed page-2 in page-1 at [1,0] on right']);
    });

    it('lands nowhere else: a page has no tab to put in a strip or at the end of one', () => {
        startPage('page-2', 'Reading', { x: 100, y: 100 });
        hover({ kind: 'strip', path: [], index: 0, page: 'page-1' });
        expect(dragging()?.drop).toBe(null);
        hover({ kind: 'centre', path: [], page: 'page-1' });
        expect(dragging()?.drop).toBe(null);
        end();
        expect(sink.calls).toEqual([]);
    });
});

describe('a view carried out of the catalogue', () => {
    /** A view's drag past the threshold. */
    function carry(view: string, state?: unknown): void {
        startView(view, state, 'Help', { x: 100, y: 100 });
        move({ x: 100 + THRESHOLD, y: 100 });
    }

    it('opens the view on the page it was dropped on, then moves that tab into the strip', () => {
        carry('help');
        expect(dragging()?.kind).toBe('view');
        hover({ kind: 'strip', path: [1], index: 2, page: 'views' });
        end();
        expect(sink.calls).toEqual(['open help null on views', 'transfer help-tab to [1] at 2']);
    });

    it('opens a document with its state and splits the pane for a drop on an edge', () => {
        carry('doc', { path: 'a.md' });
        hover({ kind: 'edge', path: [0], edge: 'bottom' });
        end();
        expect(sink.calls).toEqual([
            'open doc {"path":"a.md"} on screen',
            'split doc-tab to [0] on bottom'
        ]);
    });

    it('performs nothing before the threshold, so the press stays a click', () => {
        startView('help', undefined, 'Help', { x: 100, y: 100 });
        expect(dragging()).toBe(null);
        hover({ kind: 'centre', path: [] });
        end();
        expect(sink.calls).toEqual([]);
    });

    it('opens nothing when the page it was dropped on is gone', () => {
        setDragSink({ ...sink, open: () => '' });
        carry('help');
        hover({ kind: 'centre', path: [] });
        end();
        expect(sink.calls).toEqual([]);
    });
});

describe('a place the drag cannot land', () => {
    it('holds a refusal while the pointer is over it, and drops it when the pointer leaves', () => {
        startPage('page-2', 'Reading', { x: 100, y: 100 });
        hover(null, null, true);
        expect(dragging()?.refused).toBe(true);
        expect(dragging()?.drop).toBe(null);
        hover(null);
        expect(dragging()?.refused).toBe(false);
    });

    it('is never refused while a drop is hovered, and performs nothing when the pointer is up', () => {
        startPage('page-2', 'Reading', { x: 100, y: 100 });
        hover({ kind: 'edge', path: [], edge: 'left', page: 'page-1' }, null, true);
        expect(dragging()?.refused).toBe(false);
        hover(null, null, true);
        end();
        expect(sink.calls).toEqual([]);
    });
});

describe('the index a strip drew and the index a move wants', () => {
    // A strip of [a, b, c] with b being dragged: the four places the pointer can be are drawn as
    // 0, 1, 2 and 3, and moveInstance counts against [a, c], where they are 0, 1, 1 and 2.
    it('drops the dragged tab out of the count it is measured against', () => {
        expect([0, 1, 2, 3].map((index) => withoutOwn(index, 1))).toEqual([0, 1, 1, 2]);
    });

    it('leaves an index alone when the strip does not hold the dragged tab', () => {
        expect([0, 1, 2].map((index) => withoutOwn(index, -1))).toEqual([0, 1, 2]);
    });

    it('draws the mark back where the tabs are, at the near side of the dragged one', () => {
        expect([0, 1, 2].map((index) => markAt(index, 1))).toEqual([0, 1, 3]);
        expect([0, 1, 2].map((index) => markAt(index, -1))).toEqual([0, 1, 2]);
    });

    it('is its own inverse everywhere the two places are not the same place', () => {
        for (const own of [0, 1, 2]) {
            for (const drawn of [0, 1, 2, 3]) {
                if (drawn === own + 1) continue;
                expect(markAt(withoutOwn(drawn, own), own)).toBe(drawn);
            }
        }
    });
});

describe('the drop zones of a body', () => {
    const rect = { x: 0, y: 0, width: 400, height: 200 };

    it('gives the outer quarter of each side to that side', () => {
        expect(edgeAt(rect, { x: 10, y: 100 })).toBe('left');
        expect(edgeAt(rect, { x: 390, y: 100 })).toBe('right');
        expect(edgeAt(rect, { x: 200, y: 10 })).toBe('top');
        expect(edgeAt(rect, { x: 200, y: 190 })).toBe('bottom');
    });

    it('gives the middle to no side at all', () => {
        expect(edgeAt(rect, { x: 200, y: 100 })).toBe(null);
        expect(edgeAt(rect, { x: 120, y: 60 })).toBe(null);
    });

    it('gives a corner to the side it is nearer', () => {
        expect(edgeAt(rect, { x: 4, y: 20 })).toBe('left');
        expect(edgeAt(rect, { x: 40, y: 2 })).toBe('top');
        expect(edgeAt(rect, { x: 398, y: 198 })).toBe('right');
    });

    it('measures against where the body sits in the window', () => {
        const moved = { x: 1000, y: 500, width: 400, height: 200 };
        expect(edgeAt(moved, { x: 1010, y: 600 })).toBe('left');
        expect(edgeAt(moved, { x: 1200, y: 600 })).toBe(null);
    });

    it('says nothing about a body with no size', () => {
        expect(edgeAt({ x: 0, y: 0, width: 0, height: 0 }, { x: 0, y: 0 })).toBe(null);
    });
});

describe('a tab dragged with Alt held', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('floats on drop at the pointer, wherever the pointer was released', () => {
        begin();
        move({ x: 500, y: 300 }, true);
        hover({ kind: 'centre', path: [0] }, { x: 0, y: 0, width: 10, height: 10 });
        end();
        expect(sink.calls).toEqual(['float a at 500,300']);
    });

    it('floats over no drop at all, and over a strip or an edge', () => {
        begin();
        move({ x: 40, y: 50 }, true);
        end();
        begin('b');
        move({ x: 60, y: 70 }, true);
        hover({ kind: 'strip', path: [1], index: 0 });
        end();
        begin('c');
        move({ x: 80, y: 90 }, true);
        hover({ kind: 'edge', path: [], edge: 'left' });
        end();
        expect(sink.calls).toEqual(['float a at 40,50', 'float b at 60,70', 'float c at 80,90']);
    });

    it('is a plain drop when Alt is let go before the pointer comes up', () => {
        begin();
        move({ x: 500, y: 300 }, true);
        move({ x: 510, y: 300 }, false);
        hover({ kind: 'strip', path: [1], index: 0 });
        end();
        expect(sink.calls).toEqual(['transfer a to [1] at 0']);
    });

    it('tells whatever draws the outline that the drag floats', () => {
        begin();
        expect(dragging()?.alt).toBe(false);
        move({ x: 500, y: 300 }, true);
        expect(dragging()?.alt).toBe(true);
    });

    it('performs nothing when the press never moved, Alt or not', () => {
        start('a', 'Projects', { x: 100, y: 100 });
        move({ x: 101, y: 100 }, true);
        end();
        expect(sink.calls).toEqual([]);
    });

    it('floats no page and no view: Alt means nothing to them', () => {
        startPage('page-2', 'Reading', { x: 100, y: 100 });
        move({ x: 300, y: 300 }, true);
        hover({ kind: 'edge', path: [], edge: 'left', page: 'page-1' });
        end();
        expect(sink.calls).toEqual(['embed page-2 in page-1 at [] on left']);
    });

    it('puts the tab in a new free float at the pointer through the store, and cleans the pane it left', () => {
        vi.stubGlobal('window', { innerWidth: 1000, innerHeight: 800 });
        setDragSink(null);
        const held = heldPages([
            pageAround('main', split('row', [0.5, 0.5], [pane(['a']), pane(['b'])]))
        ]);
        client.layout.loadLayout(fakeStorage(serialiseLayout(held)));
        start('b', 'b', { x: 600, y: 200 });
        move({ x: 700, y: 400 }, true);
        hover({ kind: 'centre', path: [0], page: 'main' }, { x: 0, y: 0, width: 10, height: 10 });
        end();
        expect(client.layout.floats()).toHaveLength(1);
        expect(client.layout.floats()[0].pane.tabs.map((tab) => tab.id)).toEqual(['b']);
        expect(client.layout.floats()[0].place).toEqual({
            kind: 'free',
            x: 0.7,
            y: 0.5,
            w: 0.3,
            h: 0.4
        });
        expect(client.layout.layout()).toEqual(pane(['a']));
    });
});
