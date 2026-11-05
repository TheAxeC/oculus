// Layer 1, data. The typed reader of the frame of present.yml's `defaults:`, the size in px every
// slide of a deck is laid out in unless the deck's own `deck.frame` sets one. Both sides read
// through settingReader (reader.ts) from the entries of options/present.yml, a wrong side being the
// entry's default and a problem naming its key. The entries travel with the frame as its rule, and
// `deckFrame` holds a deck's `deck.frame` to that rule, so the ranges are written once, in the
// options file, and the deck reader and the setting refuse the same values.

import { byKey, isMap } from '../../../helpers/guards.ts';
import type { DeckFrame } from '../../../model/index.ts';
import { catalogOf, type CatalogEntry } from '../catalog/options.ts';
import { valueProblem, type ValueProblem } from '../catalog/value-rule.ts';
import { noRule, settingReader, type SettingProblem } from './reader.ts';

/** The options file the frame's entries are in. */
const FILE = 'present.yml';

/** The two sides of a frame, in the order a finding names them. */
const SIDES = ['width', 'height'] as const;

type Side = (typeof SIDES)[number];

/** The frame of the setting, and the options entry each side of a deck's own frame is held to. */
export type FrameSetting = { frame: DeckFrame; rule: Record<Side, CatalogEntry> };

/**
 * What is wrong with a deck's `deck.frame`: it is no map, it holds a key that is no side, it lacks
 * a side, or a side's value is one its entry refuses.
 */
type FrameFault =
    | { kind: 'not-a-map' }
    | { kind: 'key'; key: string }
    | { kind: 'missing'; side: Side }
    | { kind: 'side'; side: Side; problem: Exclude<ValueProblem, { kind: 'empty' }> };

/** The entry of one side in the options catalog; throws when the catalog holds none. */
function entryOf(config: Record<string, unknown>, side: Side): CatalogEntry {
    const key = `defaults.frame.${side}`;
    const entries = byKey(catalogOf(config), FILE);
    const entry = entries === undefined ? undefined : byKey(entries, key);
    if (entry === undefined) throw noRule(key, FILE);
    return entry;
}

/** Read `defaults.frame`'s two sides, each its default when it is missing or wrong. */
export function frameSetting(
    config: Record<string, unknown>,
    problems: SettingProblem[] = []
): FrameSetting {
    const read = settingReader(config, problems, FILE);
    return {
        frame: {
            width: read.number('defaults.frame.width'),
            height: read.number('defaults.frame.height')
        },
        rule: { width: entryOf(config, 'width'), height: entryOf(config, 'height') }
    };
}

/**
 * A deck's own `deck.frame` read by the rule of the setting: the frame for a map of exactly a width
 * and a height that the rule takes, else the first thing wrong with it.
 */
export function deckFrame(
    value: unknown,
    rule: FrameSetting['rule']
): { frame: DeckFrame } | { fault: FrameFault } {
    if (!isMap(value)) return { fault: { kind: 'not-a-map' } };
    const key = Object.keys(value).find((one) => !(SIDES as readonly string[]).includes(one));
    if (key !== undefined) return { fault: { kind: 'key', key } };
    const sides: Record<Side, number> = { width: 0, height: 0 };
    for (const side of SIDES) {
        if (!Object.hasOwn(value, side)) return { fault: { kind: 'missing', side } };
        const held = value[side];
        const problem = valueProblem(rule[side], held);
        if (problem !== null) {
            return {
                fault:
                    problem.kind === 'empty'
                        ? { kind: 'missing', side }
                        : { kind: 'side', side, problem }
            };
        }
        // Both entries are number controls, and valueProblem refuses what is no finite number.
        sides[side] = held as number;
    }
    return { frame: sides };
}
