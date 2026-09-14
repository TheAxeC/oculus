// The one drag in progress: the threshold that tells a click from a drag, what each kind of drop
// performs, and the geometry that turns a point inside a pane body into an edge.
//
// The store is handed a sink that records what it was asked to do, so nothing here touches the
// layout store or storage. There is no DOM in this suite either, which the store's own guard
// covers: a drag driven by calls runs exactly as one driven by the document's listeners.
//
// What this does NOT cover: the listeners themselves, the pointer that installs them, and anything
// drawn. A drag is exercised in a browser after this package lands.

import { beforeEach, describe, expect, it } from 'vitest';
import {
    AT_END,
    THRESHOLD,
    edgeAt,
    markAt,
    withoutOwn,
    type DragSink
} from '../../src/lib/state/drag.svelte.ts';
import { createClientState, type ClientState } from '../client.ts';

let client: ClientState;
let cancel: ClientState['drag']['cancel'];
let dragging: ClientState['drag']['dragging'];
let end: ClientState['drag']['end'];
let hover: ClientState['drag']['hover'];
let move: ClientState['drag']['move'];
let setDragSink: ClientState['drag']['setDragSink'];
let start: ClientState['drag']['start'];

beforeEach(() => {
    client = createClientState();
    ({ cancel, dragging, end, hover, move, setDragSink, start } = client.drag);
});

/** A sink that writes down what it was asked to perform, one line per call. */
function recorder(): DragSink & { calls: string[] } {
    const calls: string[] = [];
    return {
        calls,
        transfer: (id, target, path, index) =>
            calls.push(`transfer ${id} to ${target} [${path.join(',')}] at ${index}`),
        split: (id, target, path, edge) =>
            calls.push(`split ${id} to ${target} [${path.join(',')}] on ${edge}`)
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
    start(id, 'main', 'Projects', { x: 100, y: 100 });
    move({ x: 100 + THRESHOLD, y: 100 });
}

describe('the threshold', () => {
    it('draws nothing until the pointer has moved far enough', () => {
        start('a', 'main', 'Projects', { x: 100, y: 100 });
        expect(dragging()).toBe(null);
        move({ x: 103, y: 102 });
        expect(dragging()).toBe(null);
    });

    it('arms at the threshold and stays armed on the way back', () => {
        start('a', 'main', 'Projects', { x: 100, y: 100 });
        move({ x: 100, y: 100 + THRESHOLD });
        expect(dragging()).not.toBe(null);
        move({ x: 100, y: 100 });
        expect(dragging()?.point).toEqual({ x: 100, y: 100 });
    });

    it('performs nothing when a press that never moved is released over a drop', () => {
        start('a', 'main', 'Projects', { x: 100, y: 100 });
        hover({ kind: 'strip', target: 'panel', path: [], index: 0 });
        end();
        expect(sink.calls).toEqual([]);
        expect(dragging()).toBe(null);
    });

    it('carries the tab it was started with', () => {
        begin('tab-1');
        expect(dragging()).toEqual({
            id: 'tab-1',
            label: 'Projects',
            target: 'main',
            point: { x: 106, y: 100 },
            drop: null,
            rect: null
        });
    });
});

describe('performing a drop', () => {
    it('moves the tab into a strip at the index it was hovered at', () => {
        begin();
        hover({ kind: 'strip', target: 'panel', path: [1, 0], index: 2 });
        end();
        expect(sink.calls).toEqual(['transfer a to panel [1,0] at 2']);
    });

    it('moves the tab to the end of the strip for a drop in the middle of a body', () => {
        begin();
        hover({ kind: 'centre', target: 'main', path: [0] }, { x: 0, y: 0, width: 10, height: 10 });
        end();
        expect(sink.calls).toEqual([`transfer a to main [0] at ${AT_END}`]);
    });

    it('splits the pane for a drop on an edge', () => {
        begin();
        hover({ kind: 'edge', target: 'main', path: [], edge: 'bottom' });
        end();
        expect(sink.calls).toEqual(['split a to main [] on bottom']);
    });

    it('performs one operation and only one, and forgets the drag', () => {
        begin();
        hover({ kind: 'strip', target: 'main', path: [], index: 0 });
        hover({ kind: 'edge', target: 'panel', path: [], edge: 'left' });
        end();
        end();
        expect(sink.calls).toEqual(['split a to panel [] on left']);
        expect(dragging()).toBe(null);
    });

    it('performs nothing when the pointer came up over nothing', () => {
        begin();
        hover({ kind: 'strip', target: 'main', path: [], index: 1 });
        hover(null);
        end();
        expect(sink.calls).toEqual([]);
    });

    it('performs nothing when the drag was called off', () => {
        begin();
        hover({ kind: 'edge', target: 'main', path: [], edge: 'right' });
        cancel();
        expect(dragging()).toBe(null);
        end();
        expect(sink.calls).toEqual([]);
    });

    it('holds the body a drop is over, for whatever draws the indicator', () => {
        begin();
        const rect = { x: 20, y: 30, width: 400, height: 200 };
        hover({ kind: 'edge', target: 'main', path: [1], edge: 'top' }, rect);
        expect(dragging()?.rect).toEqual(rect);
    });

    it('ignores a hover and a move when no drag was started', () => {
        hover({ kind: 'strip', target: 'main', path: [], index: 0 });
        move({ x: 500, y: 500 });
        expect(dragging()).toBe(null);
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
