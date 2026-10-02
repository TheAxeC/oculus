// Layer 3, shell test. The arithmetic of the float layer: the style a float is drawn with, the grid
// tracks the docked floats leave the body, how a move and a resize change a free float's fractions,
// the edge a release docks on, and the depths the floats and the drag layer are drawn at. All pure;
// the gesture itself (interactjs on a pointer) needs a DOM and is seen at the look.

import { describe, expect, it } from 'vitest';
import {
    BASE_DEPTH,
    SNAP_PX,
    bodyTracks,
    depthOf,
    dockedSize,
    dragDepth,
    floatStyle,
    movePlace,
    outlineAt,
    raised,
    resizePlace,
    snapEdge,
    stackOf
} from '../../../src/lib/shell/panes/floats/float-geometry.ts';
import { FLOAT_MIN } from '../../../src/lib/state/workbench/layout/index.ts';
import { floating } from '../../state/workbench/layout/layout-fixture.ts';

const FREE = { kind: 'free', x: 0.1, y: 0.2, w: 0.3, h: 0.4 } as const;

describe('the style a float is drawn with', () => {
    it('places a free float by its fractions of the window and gives it the float border', () => {
        const style = floatStyle(FREE);
        expect(style).toContain('left: 10vw');
        expect(style).toContain('top: 20vh');
        expect(style).toContain('width: 30vw');
        expect(style).toContain('height: 40vh');
        expect(style).toContain('border: 1px solid var(--float-border)');
    });

    it('gives a docked float the border and no position of its own', () => {
        const style = floatStyle({ kind: 'dock', edge: 'right', size: 0.3 });
        expect(style).toContain('border: 1px solid var(--float-border)');
        expect(style).not.toContain('left:');
    });
});

describe('the tracks the docked floats leave the body', () => {
    const left = floating('l', ['a'], { kind: 'dock', edge: 'left', size: 0.25 });
    const right = floating('r', ['b'], { kind: 'dock', edge: 'right', size: 0.3 });
    const bottom = floating('b', ['c'], { kind: 'dock', edge: 'bottom', size: 0.4 });

    it('leaves one column for the area when nothing is docked', () => {
        expect(bodyTracks([floating('f', ['x'], FREE)])).toBe(
            'grid-template-columns: auto 0 minmax(0, 1fr) 0; grid-template-rows: minmax(0, 1fr) 0'
        );
    });

    it('takes the width of a left and a right dock and the height of a bottom one', () => {
        expect(bodyTracks([left, right, bottom])).toBe(
            'grid-template-columns: auto 25vw minmax(0, 1fr) 30vw; grid-template-rows: minmax(0, 1fr) 40vh'
        );
    });
});

describe('moving a free float', () => {
    it('moves it by the fractions of the window the pointer travelled', () => {
        const next = movePlace(FREE, 0.1, -0.1);
        expect(next.x).toBeCloseTo(0.2);
        expect(next.y).toBeCloseTo(0.1);
        expect([next.w, next.h]).toEqual([FREE.w, FREE.h]);
    });

    it('stops it at the window edges, keeping its size', () => {
        expect(movePlace(FREE, 2, 2)).toEqual({ ...FREE, x: 0.7, y: 0.6 });
        expect(movePlace(FREE, -2, -2)).toEqual({ ...FREE, x: 0, y: 0 });
    });
});

describe('resizing a free float', () => {
    const none = { left: false, right: false, top: false, bottom: false };

    it('moves the right and bottom edges and keeps the origin', () => {
        const next = resizePlace(FREE, { ...none, right: true, bottom: true }, 0.1, 0.1);
        expect([next.x, next.y]).toEqual([0.1, 0.2]);
        expect(next.w).toBeCloseTo(0.4);
        expect(next.h).toBeCloseTo(0.5);
    });

    it('moves the left and top edges so the opposite edges stay put', () => {
        const next = resizePlace(FREE, { ...none, left: true, top: true }, 0.05, 0.05);
        expect(next.x).toBeCloseTo(0.15);
        expect(next.w).toBeCloseTo(0.25);
        expect(next.y).toBeCloseTo(0.25);
        expect(next.h).toBeCloseTo(0.35);
        expect(next.x + next.w).toBeCloseTo(0.4);
    });

    it('stops at the least size without moving the opposite edge', () => {
        const next = resizePlace(FREE, { ...none, left: true }, 5, 0);
        expect(next.w).toBeCloseTo(FLOAT_MIN);
        expect(next.x + next.w).toBeCloseTo(0.4);
    });

    it('stops at the window', () => {
        const next = resizePlace(FREE, { ...none, right: true, bottom: true }, 5, 5);
        expect(next.x + next.w).toBeCloseTo(1);
        expect(next.y + next.h).toBeCloseTo(1);
    });
});

describe('the edge a release docks on', () => {
    const area = { left: 50, right: 1000, bottom: 760 };

    it('names the edge the pointer is within the margin of', () => {
        expect(SNAP_PX).toBe(24);
        expect(snapEdge({ x: 60, y: 300 }, area)).toBe('left');
        expect(snapEdge({ x: 990, y: 300 }, area)).toBe('right');
        expect(snapEdge({ x: 500, y: 750 }, area)).toBe('bottom');
    });

    it('names none further in, and none exactly one margin away', () => {
        expect(snapEdge({ x: 500, y: 300 }, area)).toBeNull();
        expect(snapEdge({ x: 50 + SNAP_PX + 1, y: 300 }, area)).toBeNull();
    });

    it('takes the left edge before the bottom one in a corner', () => {
        expect(snapEdge({ x: 52, y: 755 }, area)).toBe('left');
    });
});

describe('the size a dock takes from a drag of its sash', () => {
    it('grows a left dock by the way the pointer went, as a fraction of the window width', () => {
        expect(dockedSize('left', 0.3, 100, 1000)).toBeCloseTo(0.4);
        expect(dockedSize('left', 0.3, -100, 1000)).toBeCloseTo(0.2);
    });

    it('grows a right or a bottom dock by the pointer going back toward the origin', () => {
        expect(dockedSize('right', 0.3, -100, 1000)).toBeCloseTo(0.4);
        expect(dockedSize('bottom', 0.3, 80, 800)).toBeCloseTo(0.2);
    });

    it('stops at the least and the most size, and keeps the size when the window has no extent', () => {
        expect(dockedSize('left', 0.3, 5000, 1000)).toBe(0.6);
        expect(dockedSize('left', 0.3, -5000, 1000)).toBe(FLOAT_MIN);
        expect(dockedSize('left', 0.3, 100, 0)).toBe(0.3);
    });
});

describe('the outline a tab dragged with Alt held floats as', () => {
    it('takes the starting size with its corner at the pointer', () => {
        expect(outlineAt({ x: 100, y: 50 }, { width: 1000, height: 800 })).toEqual({
            x: 100,
            y: 50,
            width: 300,
            height: 320
        });
    });

    it('is kept inside the window', () => {
        expect(outlineAt({ x: 990, y: 790 }, { width: 1000, height: 800 })).toEqual({
            x: 700,
            y: 480,
            width: 300,
            height: 320
        });
        expect(outlineAt({ x: -5, y: -5 }, { width: 1000, height: 800 })).toMatchObject({
            x: 0,
            y: 0
        });
    });
});

describe('the depth the floats and the drag layer are drawn at', () => {
    const ids = (count: number): string[] => Array.from({ length: count }, (_, i) => `f${i}`);

    it('drops the ids of floats that no longer exist, keeping the order of the rest', () => {
        expect(stackOf(['gone', 'b', 'a', 'also-gone'], ['a', 'b', 'c'])).toEqual(['b', 'a', 'c']);
    });

    it('puts a float the order has not met in front of the ones it has', () => {
        expect(stackOf([], ['a', 'b'])).toEqual(['a', 'b']);
        expect(stackOf(['b'], ['a', 'b', 'c'])).toEqual(['b', 'a', 'c']);
    });

    it('draws a float made after a press in front of the float pressed', () => {
        // Revert: stackOf putting the floats the order has not met behind the pressed ones.
        const stack = stackOf(raised([], ['a'], 'a'), ['a', 'new']);
        expect(depthOf(stack, 'new')).toBeGreaterThan(depthOf(stack, 'a'));
    });

    it('puts the pressed float last, and leaves the stack alone for an id that is not free', () => {
        expect(raised(['a', 'b'], ['a', 'b', 'c'], 'a')).toEqual(['b', 'c', 'a']);
        expect(raised(['a', 'gone'], ['a', 'b'], 'b')).toEqual(['a', 'b']);
        expect(raised(['a'], ['a', 'b'], 'docked')).toEqual(['a', 'b']);
    });

    it('gives each float a depth one above the float behind it, from BASE_DEPTH', () => {
        const stack = stackOf(['b'], ['a', 'b', 'c']);
        expect(stack.map((id) => depthOf(stack, id))).toEqual([
            BASE_DEPTH,
            BASE_DEPTH + 1,
            BASE_DEPTH + 2
        ]);
        expect(depthOf(stack, 'unknown')).toBe(BASE_DEPTH);
    });

    it('does not count a removed float in the depth of the ones left', () => {
        const order = ['a', 'b', 'c'];
        const stack = stackOf(order, ['a', 'c']);
        expect(depthOf(stack, 'c')).toBe(BASE_DEPTH + 1);
    });

    it.each([1, 7, 20])('puts the drag layer above the front of %i free floats', (count) => {
        const free = ids(count);
        const stack = raised([], free, free[0]);
        const front = Math.max(...stack.map((id) => depthOf(stack, id)));
        expect(dragDepth(count)).toBeGreaterThan(front);
    });
});
