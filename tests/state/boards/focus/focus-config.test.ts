// Layer 4, test. The readers of state/boards/focus.ts that take a value of the merged config or of
// an entry: the status palette, the numeric settings, the lane and priority rows, the holding
// colour and the snooze value. Each row is an input of the wrong type or shape and the answer the
// reader gives it, so a change in how a reader tells a good value from a bad one shows here.

import { describe, expect, it } from 'vitest';
import { setVocab } from '../../../../src/lib/state/shared/words/tones.ts';
import {
    deadlineMet,
    flamesOf,
    holdingTone,
    lanes,
    priorities,
    setting,
    settled,
    snoozed,
    statusFlag,
    terminal,
    waiting,
    type Project
} from '../../../../src/lib/state/boards/focus.ts';
import type { Snapshot } from '../../../../src/lib/data/model/index.ts';

setVocab({ palette: { '#7c5cff': 'c-violet', '#0d9488': 'c-teal' } });

const NOW = Date.UTC(2026, 8, 11, 12);

/** A merged config holding the given value under `status_palette`. */
function palette(value: unknown): Record<string, unknown> {
    return { status_palette: value };
}

describe('the status palette flags', () => {
    const ownProto: unknown = JSON.parse('{"__proto__":{"terminal":true}}');
    const rows: [string, Record<string, unknown>, string, boolean][] = [
        ['a row that is a list', palette({ live: [] }), 'live', false],
        ['a palette that is a list', palette([]), 'live', false],
        ['a palette that is null', palette(null), 'live', false],
        ['a row that is null', palette({ live: null }), 'live', false],
        ['no palette at all', {}, 'live', false],
        ['a flag written as a word', palette({ live: { terminal: 'true' } }), 'live', false],
        ['a flag written as a number', palette({ live: { terminal: 1 } }), 'live', false],
        ['a status trimmed and lower-cased', palette({ live: { terminal: true } }), ' LIVE ', true],
        ['an empty status', palette({ '': { terminal: true } }), '  ', true],
        ['an inherited name', palette({}), 'constructor', false],
        ['the prototype name without an own key', palette({}), '__proto__', false],
        ['an own key named __proto__', palette(ownProto), '__proto__', true]
    ];

    it.each(rows)('answers %s', (_, config, status, expected) => {
        expect(statusFlag(config, status, 'terminal')).toBe(expected);
    });

    it('reads the terminal and deadline_met flags apart', () => {
        const config = palette({ done: { terminal: true }, sent: { deadline_met: true } });
        expect([terminal(config, 'done'), deadlineMet(config, 'done')]).toStrictEqual([
            true,
            false
        ]);
        expect([terminal(config, 'sent'), deadlineMet(config, 'sent')]).toStrictEqual([
            false,
            true
        ]);
        expect(deadlineMet(palette({ sent: { deadline_met: 'true' } }), 'sent')).toBe(false);
    });

    it('settles a project when any chip carries either flag', () => {
        const config = palette({ done: { terminal: true } });
        const held = (chips: string[]): Project => ({ chips }) as unknown as Project;
        expect(settled(held(['x', 'done']), config)).toBe(true);
        expect(settled(held(['x']), config)).toBe(false);
    });
});

describe('setting', () => {
    const rows: [string, unknown, number][] = [
        ['a number', 3, 3],
        ['zero', 0, 0],
        ['a negative number', -1, -1],
        ['a fraction', 2.5, 2.5],
        ['a number written as a string', '3', 90],
        ['NaN', NaN, 90],
        ['Infinity', Infinity, 90],
        ['minus Infinity', -Infinity, 90],
        ['null', null, 90],
        ['a list', [], 90],
        ['a map', {}, 90],
        ['true', true, 90]
    ];

    it.each(rows)('reads %s', (_, held, expected) => {
        expect(setting({ k: held }, 'k', 90)).toBe(expected);
    });

    it('gives the fallback for a key the config does not hold', () => {
        expect(setting({}, 'k', 90)).toBe(90);
    });
});

describe('lanes', () => {
    it('reads each row for its key, words, hue and cluster, and skips what is not a row', () => {
        const rows = [
            [],
            'x',
            null,
            3,
            { key: 3 },
            { key: '' },
            { key: 'a' },
            { key: 'b', label: 3, sub: 4, color: 5, cluster: 6 },
            { key: 'c', label: '', sub: 's', color: '#7c5cff', cluster: 'now' },
            { key: 'd', color: '#7C5CFF' },
            { key: 'e', color: '#nope' }
        ];
        expect(lanes({ focus_lanes: rows })).toStrictEqual([
            { key: 'a', label: 'a', sub: '', tone: 'grey', cluster: '' },
            { key: 'b', label: 'b', sub: '', tone: 'grey', cluster: '' },
            { key: 'c', label: 'c', sub: 's', tone: 'violet', cluster: 'now' },
            { key: 'd', label: 'd', sub: '', tone: 'violet', cluster: '' },
            { key: 'e', label: 'e', sub: '', tone: 'grey', cluster: '' }
        ]);
    });

    it('is empty for rows held as a map, as a string or not at all', () => {
        expect(lanes({ focus_lanes: { a: { key: 'a' } } })).toStrictEqual([]);
        expect(lanes({ focus_lanes: 'x' })).toStrictEqual([]);
        expect(lanes({})).toStrictEqual([]);
    });
});

describe('the holding colour', () => {
    it('is the tone of a hex the palette holds and the unknown tone for anything else', () => {
        expect(holdingTone({ holding_color: '#0d9488' })).toBe('teal');
        expect(holdingTone({})).toBe('grey');
        expect(holdingTone({ holding_color: 3 })).toBe('grey');
        expect(holdingTone({ holding_color: '' })).toBe('grey');
        expect(holdingTone({ holding_color: ['#0d9488'] })).toBe('grey');
    });
});

describe('priorities and flames', () => {
    it('reads each row for its key, label and flame count', () => {
        const rows = [
            [],
            null,
            'x',
            { key: 3 },
            { key: '' },
            { key: 'a' },
            { key: 'b', label: 3, flames: '3' },
            { key: 'c', label: 'C', flames: NaN },
            { key: 'd', flames: Infinity },
            { key: 'e', flames: 2.5 },
            { key: 'f', flames: -1 },
            { key: 'g', flames: null }
        ];
        expect(priorities({ priority_levels: rows })).toStrictEqual([
            { key: 'a', label: 'a', flames: 0 },
            { key: 'b', label: 'b', flames: 0 },
            { key: 'c', label: 'C', flames: 0 },
            { key: 'd', label: 'd', flames: 0 },
            { key: 'e', label: 'e', flames: 2.5 },
            { key: 'f', label: 'f', flames: -1 },
            { key: 'g', label: 'g', flames: 0 }
        ]);
    });

    it('is empty for rows held as a map, as a string or not at all', () => {
        expect(priorities({ priority_levels: { a: { key: 'a' } } })).toStrictEqual([]);
        expect(priorities({ priority_levels: 'x' })).toStrictEqual([]);
        expect(priorities({})).toStrictEqual([]);
    });

    it('draws the flames of the level a project names and none otherwise', () => {
        const held = (priority?: string): Project => ({ priority }) as unknown as Project;
        const levels = (flames: unknown) => ({ priority_levels: [{ key: 'b', flames }] });
        expect(flamesOf(held('b'), levels(2))).toBe(2);
        expect(flamesOf(held('b'), levels('3'))).toBe(0);
        expect(flamesOf(held(undefined), levels(2))).toBe(0);
        expect(flamesOf(held('z'), levels(2))).toBe(0);
    });
});

describe('snoozed', () => {
    const rows: [string, unknown, boolean][] = [
        ['true', true, true],
        ['false', false, false],
        ['a number', 3, false],
        ['NaN', NaN, false],
        ['null', null, false],
        ['undefined', undefined, false],
        ['a list', [], false],
        ['a list of the word true', ['true'], false],
        ['a map', {}, false],
        ['the word true, padded and in capitals', ' TRUE ', true],
        ['the word yes', 'Yes', true],
        ['the digit one', '1', true],
        ['the word no', 'no', false],
        ['an empty string', '', false],
        ['a day after today', '2026-10-01', true],
        ['a day before today', '2026-09-01', false],
        ['today', '2026-09-11', false]
    ];

    it.each(rows)('reads %s', (_, value, expected) => {
        expect(snoozed(value, NOW)).toBe(expected);
    });
});

describe('the awaiting strip', () => {
    it('lists the applications whose status is the word applied, and no entry of another type', () => {
        const entry = (id: string, fields: Record<string, unknown>) => ({
            id,
            title: id,
            fields,
            file: '',
            index: 0
        });
        const held = {
            entities: {
                projects: {},
                venues: {},
                funding: {},
                career: null,
                collections: {
                    applications: {
                        id: 'applications',
                        title: '',
                        file: '',
                        entries: [
                            entry('a', { status: ' Applied ' }),
                            entry('b', { status: 3 }),
                            entry('c', { status: ['applied'] }),
                            entry('d', { status: 'APPLIED' }),
                            entry('e', {})
                        ]
                    }
                }
            }
        } as unknown as Snapshot;
        expect(waiting(held, {}, {}).applications).toStrictEqual(['a', 'd']);
    });
});
