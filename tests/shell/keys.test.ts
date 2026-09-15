// Layer 3, shell test. Pure keyboard routing for the workbench: rail positions, timed chords, cursor directions,
// scrolling sequences, and the field and overlay guards, without mounting a DOM.

import { describe, expect, it } from 'vitest';
import {
    CHORD_MS,
    DOUBLE_G_MS,
    horizontalCursor,
    initialKeyState,
    resolveKey,
    rowCursor,
    type KeyContext,
    type KeyEventLike,
    type KeyState,
    type RailOrder
} from '../../src/lib/shell/keys.ts';

const order: RailOrder = {
    direct: ['focus', 'projects', 'archive'],
    all: ['focus', 'projects', 'funding', 'events', 'archive'],
    chords: {
        v: ['focus', 'projects', 'archive'],
        c: ['funding', 'events', 'doc:GUIDE.md'],
        m: ['sessions', 'terminal']
    }
};

const context: KeyContext = {
    currentView: 'focus',
    cursorActive: false,
    typing: false,
    paletteOpen: false,
    trayOpen: false,
    confirmOpen: false
};

function press(
    key: string,
    state: KeyState = initialKeyState(),
    now = 1000,
    changed: Partial<KeyContext> = {},
    event: Partial<KeyEventLike> = {}
) {
    return resolveKey({ key, ...event }, order, { ...context, ...changed }, state, now);
}

describe('digit and chord navigation', () => {
    it('asks for the page of a bare digit, whatever the rail holds', () => {
        expect(press('1').action).toEqual({ kind: 'page', index: 1 });
        expect(press('4').action).toEqual({ kind: 'page', index: 4 });
        expect(press('9').action).toEqual({ kind: 'page', index: 9 });
    });

    it('opens the rail view at the digit after the direct chord, and nothing past its end', () => {
        const started = press('v', initialKeyState(), 2000);
        expect(started.action).toBe(null);
        expect(press('1', started.state, 2000 + CHORD_MS - 1).action).toEqual({
            kind: 'open',
            view: 'focus'
        });
        const again = press('v', initialKeyState(), 2000);
        expect(press('4', again.state, 2100).action).toBe(null);
    });

    it('switches the focused pane tab on Ctrl and a digit, in a field or out of one', () => {
        expect(press('2', initialKeyState(), 1000, {}, { ctrlKey: true }).action).toEqual({
            kind: 'tab',
            index: 2
        });
        expect(
            press('2', initialKeyState(), 1000, { typing: true }, { ctrlKey: true }).action
        ).toEqual({ kind: 'tab', index: 2 });
    });

    it('leaves Cmd and a digit to the browser, and says nothing for a digit in a field', () => {
        expect(press('2', initialKeyState(), 1000, {}, { metaKey: true }).action).toBe(null);
        expect(
            press('2', initialKeyState(), 1000, {}, { ctrlKey: true, metaKey: true }).action
        ).toBe(null);
        expect(press('2', initialKeyState(), 1000, { typing: true }).action).toBe(null);
    });

    it('opens the numbered entry of a configured chord', () => {
        const started = press('c', initialKeyState(), 2000);
        expect(started.action).toBe(null);
        expect(press('2', started.state, 2000 + CHORD_MS - 1).action).toEqual({
            kind: 'open',
            view: 'events'
        });
    });

    it('opens the document a chord counts to after the views, as its own entry', () => {
        const started = press('c', initialKeyState(), 2000);
        expect(press('3', started.state, 2000 + CHORD_MS - 1).action).toEqual({
            kind: 'open',
            view: 'doc:GUIDE.md'
        });
    });

    it('lets a chord lapse and treats its digit as a page', () => {
        const started = press('m', initialKeyState(), 2000);
        expect(press('2', started.state, 2000 + CHORD_MS).action).toEqual({
            kind: 'page',
            index: 2
        });
    });

    it('does not start a chord for a letter absent from the rail config', () => {
        expect(press('x').state.chord).toBe('');
    });

    it('opens the numbered view of a live chord', () => {
        const started = press('c', initialKeyState(), 1000);
        expect(press('2', started.state, 1100).action).toEqual({
            kind: 'open',
            view: 'events'
        });
    });
});

describe('display-order cycling', () => {
    it('cycles forward and backward through direct and flyout views', () => {
        expect(press('Tab', initialKeyState(), 1000, { currentView: 'projects' }).action).toEqual({
            kind: 'open',
            view: 'funding'
        });
        expect(
            press('Tab', initialKeyState(), 1000, { currentView: 'focus' }, { shiftKey: true })
                .action
        ).toEqual({ kind: 'open', view: 'archive' });
    });

    it('starts at the applicable end when the current view is outside the rail', () => {
        expect(press('Tab', initialKeyState(), 1000, { currentView: 'detail' }).action).toEqual({
            kind: 'open',
            view: 'focus'
        });
        expect(
            press('Tab', initialKeyState(), 1000, { currentView: null }, { shiftKey: true }).action
        ).toEqual({ kind: 'open', view: 'archive' });
    });

    it.each([false, true])('cycles from the focused pane with shift=%s', (shiftKey) => {
        expect(
            press('Tab', initialKeyState(), 1000, { currentView: 'projects' }, { shiftKey }).action
        ).toEqual({
            kind: 'open',
            view: shiftKey ? 'focus' : 'funding'
        });
    });
});

describe('card cursor routing and geometry', () => {
    it.each([
        ['j', 'left'],
        ['ArrowLeft', 'left'],
        ['k', 'right'],
        ['ArrowRight', 'right'],
        ['i', 'up'],
        ['ArrowUp', 'up'],
        ['o', 'down'],
        ['ArrowDown', 'down']
    ] as const)('routes %s to %s', (key, direction) => {
        expect(press(key).action).toEqual({ kind: 'cursor', direction });
    });

    it('starts at the first card and clamps horizontal moves at both ends', () => {
        expect(horizontalCursor(-1, 3, -1)).toBe(0);
        expect(horizontalCursor(0, 3, -1)).toBe(0);
        expect(horizontalCursor(2, 3, 1)).toBe(2);
        expect(horizontalCursor(-1, 0, 1)).toBe(-1);
    });

    it('moves to the horizontally nearest card on a further geometric row', () => {
        const rects = [
            { top: 0, left: 0 },
            { top: 0, left: 100 },
            { top: 80, left: 10 },
            { top: 80, left: 120 }
        ];
        expect(rowCursor(rects, 1, 1)).toBe(3);
        expect(rowCursor(rects, 3, -1)).toBe(1);
        expect(rowCursor(rects, -1, 1)).toBe(0);
    });

    it('activates and clears only when a cursor exists', () => {
        expect(press('Enter', initialKeyState(), 1000, { cursorActive: true }).action).toEqual({
            kind: 'activate'
        });
        expect(press('Enter').action).toBe(null);
        expect(press('Escape', initialKeyState(), 1000, { cursorActive: true }).action).toEqual({
            kind: 'clear-cursor'
        });
    });
});

describe('search, scroll, and sheet routing', () => {
    it('routes search, bottom, and the keyboard sheet', () => {
        expect(press('/').action).toEqual({ kind: 'search' });
        expect(press('G').action).toEqual({ kind: 'scroll', edge: 'bottom' });
        expect(press('?').action).toEqual({ kind: 'sheet' });
    });

    it('routes the second g within the strict half-second window to the top', () => {
        const first = press('g', initialKeyState(), 2000);
        expect(first.action).toBe(null);
        expect(press('g', first.state, 2000 + DOUBLE_G_MS - 1).action).toEqual({
            kind: 'scroll',
            edge: 'top'
        });
        expect(press('g', first.state, 2000 + DOUBLE_G_MS).action).toBe(null);
    });
});

describe('shortcut guards', () => {
    it.each([
        { typing: true },
        { paletteOpen: true },
        { trayOpen: true },
        { confirmOpen: true }
    ] satisfies Partial<KeyContext>[])(
        'does nothing under the $typing$paletteOpen$trayOpen$confirmOpen guard',
        (guard) => {
            expect(press('/', initialKeyState(), 1000, guard).action).toBe(null);
        }
    );

    it.each([
        { metaKey: true },
        { ctrlKey: true },
        { altKey: true }
    ] satisfies Partial<KeyEventLike>[])(
        'does nothing while a blocking modifier is held',
        (modifier) => {
            expect(press('/', initialKeyState(), 1000, {}, modifier).action).toBe(null);
        }
    );

    it('does nothing after a child keyboard handler consumed the event', () => {
        expect(press('/', initialKeyState(), 1000, {}, { defaultPrevented: true }).action).toBe(
            null
        );
    });
});

describe('carrying the card under the cursor', () => {
    it('asks for a move left on J and right on K while a cursor is held', () => {
        expect(press('J', initialKeyState(), 1000, { cursorActive: true }).action).toEqual({
            kind: 'move',
            direction: 'left'
        });
        expect(press('K', initialKeyState(), 1000, { cursorActive: true }).action).toEqual({
            kind: 'move',
            direction: 'right'
        });
    });

    it('asks for nothing while no cursor is held, so a stray shift moves no entry', () => {
        expect(press('J').action).toBe(null);
        expect(press('K').action).toBe(null);
    });

    it('leaves the unshifted keys as cursor moves', () => {
        expect(press('j', initialKeyState(), 1000, { cursorActive: true }).action).toEqual({
            kind: 'cursor',
            direction: 'left'
        });
        expect(press('k', initialKeyState(), 1000, { cursorActive: true }).action).toEqual({
            kind: 'cursor',
            direction: 'right'
        });
    });

    it('says nothing while a field is being typed in or an overlay is open', () => {
        expect(
            press('J', initialKeyState(), 1000, { cursorActive: true, typing: true }).action
        ).toBe(null);
        expect(
            press('K', initialKeyState(), 1000, { cursorActive: true, paletteOpen: true }).action
        ).toBe(null);
    });
});
