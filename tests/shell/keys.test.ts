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
    chords: { c: ['funding', 'events'], m: ['sessions', 'terminal'] }
};

const context: KeyContext = {
    currentView: 'focus',
    target: 'main',
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
    it('opens direct rail buttons by their one-based display position', () => {
        expect(press('1').action).toEqual({ kind: 'open', view: 'focus', target: 'main' });
        expect(press('3').action).toEqual({ kind: 'open', view: 'archive', target: 'main' });
        expect(press('4').action).toBe(null);
    });

    it('opens the numbered entry of a configured chord', () => {
        const started = press('c', initialKeyState(), 2000);
        expect(started.action).toBe(null);
        expect(press('2', started.state, 2000 + CHORD_MS - 1).action).toEqual({
            kind: 'open',
            view: 'events',
            target: 'main'
        });
    });

    it('lets a chord lapse and treats its digit as direct navigation', () => {
        const started = press('m', initialKeyState(), 2000);
        expect(press('2', started.state, 2000 + CHORD_MS).action).toEqual({
            kind: 'open',
            view: 'projects',
            target: 'main'
        });
    });

    it('does not start a chord for a letter absent from the rail config', () => {
        expect(press('x').state.chord).toBe('');
    });

    it('opens digits and chords in main even when the panel is focused', () => {
        expect(press('2', initialKeyState(), 1000, { target: 'panel' }).action).toEqual({
            kind: 'open',
            view: 'projects',
            target: 'main'
        });
        const started = press('c', initialKeyState(), 1000, { target: 'panel' });
        expect(press('2', started.state, 1100, { target: 'panel' }).action).toEqual({
            kind: 'open',
            view: 'events',
            target: 'main'
        });
    });
});

describe('display-order cycling', () => {
    it('cycles forward and backward through direct and flyout views', () => {
        expect(press('Tab', initialKeyState(), 1000, { currentView: 'projects' }).action).toEqual({
            kind: 'open',
            view: 'funding',
            target: 'main'
        });
        expect(
            press('Tab', initialKeyState(), 1000, { currentView: 'focus' }, { shiftKey: true })
                .action
        ).toEqual({ kind: 'open', view: 'archive', target: 'main' });
    });

    it('starts at the applicable end when the current view is outside the rail', () => {
        expect(press('Tab', initialKeyState(), 1000, { currentView: 'detail' }).action).toEqual({
            kind: 'open',
            view: 'focus',
            target: 'main'
        });
        expect(
            press('Tab', initialKeyState(), 1000, { currentView: null }, { shiftKey: true }).action
        ).toEqual({ kind: 'open', view: 'archive', target: 'main' });
    });

    it.each([false, true])('cycles in the focused panel with shift=%s', (shiftKey) => {
        expect(
            press(
                'Tab',
                initialKeyState(),
                1000,
                {
                    currentView: 'projects',
                    target: 'panel'
                },
                { shiftKey }
            ).action
        ).toEqual({
            kind: 'open',
            view: shiftKey ? 'focus' : 'funding',
            target: 'panel'
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
