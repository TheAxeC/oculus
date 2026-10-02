// Layer 4, test. The workbench a page takes across a move of its server: the page that leaves
// writes the arrangement and the settings of this browser into the window name, and the page that
// arrives writes them into its own storage and clears the name. A window name that is anything
// else is left as it was.
//
// A plain object stands for the storage and for the window, so nothing here touches a browser.

import { describe, expect, it } from 'vitest';
import {
    CARRY_KEY,
    CARRY_MS,
    carryWorkbench,
    takeCarried
} from '../../../../../src/lib/state/workbench/layout/saved/carry.ts';
import { UI_KEY } from '../../../../../src/lib/state/workbench/ui.svelte.ts';
import { LAYOUT_KEY } from '../../../../../src/lib/state/workbench/layout/saved/storage.ts';

/** The origin the carry is written for and the moment it is written. */
const TO = 'http://localhost:8791';
const AT = 1_000_000;

/** A name holding `values` as `carryWorkbench` writes them for TO at AT. */
const named = (values: unknown): string =>
    JSON.stringify({ [CARRY_KEY]: { to: TO, at: AT, values } });

/** A storage that holds `values` and records what is written into it. */
function storage(values: Record<string, string> = {}) {
    const written: Record<string, string> = {};
    return {
        written,
        getItem: (key: string): string | null => values[key] ?? null,
        setItem: (key: string, value: string): void => {
            written[key] = value;
        }
    };
}

describe('the page that leaves', () => {
    it('writes the arrangement and the settings into the window name as one object', () => {
        const win = { name: '' };
        carryWorkbench(
            storage({ [LAYOUT_KEY]: 'layout-text', [UI_KEY]: 'ui-text', other: 'x' }),
            win,
            TO,
            AT
        );

        expect(win.name).toBe(named({ [LAYOUT_KEY]: 'layout-text', [UI_KEY]: 'ui-text' }));
    });

    it('leaves out a key the storage does not hold', () => {
        const win = { name: '' };
        carryWorkbench(storage({ [UI_KEY]: 'ui-text' }), win, TO, AT);

        expect(win.name).toBe(named({ [UI_KEY]: 'ui-text' }));
    });

    it('leaves the name as it was when there is nothing to carry', () => {
        const win = { name: 'a tab name' };
        carryWorkbench(storage(), win, TO, AT);

        expect(win.name).toBe('a tab name');
    });

    it('carries the key that reads and leaves the one that throws', () => {
        const win = { name: '' };
        const refusing = {
            getItem: (key: string): string | null => {
                if (key === LAYOUT_KEY) throw new Error('storage refused');
                return 'ui-text';
            }
        };
        carryWorkbench(refusing, win, TO, AT);

        expect(win.name).toBe(named({ [UI_KEY]: 'ui-text' }));
    });
});

describe('the page that arrives', () => {
    it('writes each carried value into its own storage key and clears the name', () => {
        const win = { name: '' };
        carryWorkbench(storage({ [LAYOUT_KEY]: 'layout-text', [UI_KEY]: 'ui-text' }), win, TO, AT);
        const arrived = storage();

        takeCarried(arrived, win, TO, AT + CARRY_MS);

        expect(arrived.written).toEqual({ [LAYOUT_KEY]: 'layout-text', [UI_KEY]: 'ui-text' });
        expect(win.name).toBe('');
    });

    it('writes only the keys it carries, and only the ones whose value is text', () => {
        const win = { name: named({ [LAYOUT_KEY]: 4, [UI_KEY]: 'ui-text', other: 'x' }) };
        const arrived = storage();

        takeCarried(arrived, win, TO, AT);

        expect(arrived.written).toEqual({ [UI_KEY]: 'ui-text' });
        expect(win.name).toBe('');
    });

    it.each([
        ['a tab name', 'a tab name'],
        ['an empty name', ''],
        ['JSON of another tool', JSON.stringify({ tool: { [LAYOUT_KEY]: 'x' } })],
        ['an array', JSON.stringify([CARRY_KEY])],
        ['a carry that is no object', JSON.stringify({ [CARRY_KEY]: 'x' })],
        [
            'a carry for another origin',
            JSON.stringify({
                [CARRY_KEY]: { to: 'http://evil.test', at: AT, values: { [UI_KEY]: 'x' } }
            })
        ],
        [
            'a carry with no time',
            JSON.stringify({ [CARRY_KEY]: { to: TO, values: { [UI_KEY]: 'x' } } })
        ],
        [
            'a carry written in the future',
            JSON.stringify({ [CARRY_KEY]: { to: TO, at: AT + 1, values: { [UI_KEY]: 'x' } } })
        ],
        [
            'a carry older than CARRY_MS',
            JSON.stringify({
                [CARRY_KEY]: { to: TO, at: AT - CARRY_MS - 1, values: { [UI_KEY]: 'x' } }
            })
        ],
        [
            'a carry whose values are no object',
            JSON.stringify({ [CARRY_KEY]: { to: TO, at: AT, values: 'x' } })
        ]
    ])('leaves %s as it was and writes nothing', (_label, name) => {
        const win = { name };
        const arrived = storage();

        takeCarried(arrived, win, TO, AT);

        expect(arrived.written).toEqual({});
        expect(win.name).toBe(name);
    });

    it('clears the name though the storage refuses the write', () => {
        const win = { name: named({ [UI_KEY]: 'ui-text' }) };
        const refusing = {
            setItem: (): void => {
                throw new Error('storage full');
            }
        };

        takeCarried(refusing, win, TO, AT);

        expect(win.name).toBe('');
    });
});
