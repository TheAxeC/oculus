// Layer 1, data tests. The options catalog reader, over a catalog of every wrong type, and the
// findings over an entry it cannot read. Compared whole.

import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { catalogOf } from '../../../../../src/lib/data/sources/config/catalog/options.ts';
import { optionFindings } from '../../../../../src/lib/data/sources/config/catalog/option-findings.ts';
import { engineDir, loadConfig } from '../../../../../src/lib/data/sources/config.ts';

describe('catalogOf', () => {
    it.each([[{ options: 'x' }]])('answers an empty catalog for %j', (config) => {
        expect(catalogOf(config)).toStrictEqual({});
    });
});

describe('optionFindings', () => {
    const WORDS = loadConfig(engineDir()).config.text;
    const ENGINE = '/engine';
    const FILE = join(ENGINE, 'config', 'catalogs', 'options.yml');

    /** The entry every row starts from, a text option under a heading the vocabulary holds. */
    const SOUND = {
        description: 'A sound entry.',
        heading: 'editor',
        control: 'text',
        default: ''
    };

    /** A config whose catalog holds one entry of behavior.yml under the key `probe`. */
    function holding(entry: Record<string, unknown>): Record<string, unknown> {
        return { text: WORDS, options: { 'behavior.yml': { probe: entry } } };
    }

    const { heading: _heading, ...HEADLESS } = SOUND;

    // Each row fails when optionFindings leaves its entry out, or when catalogOf passes an unknown
    // control, source, missing heading or inverted range through unchanged.
    it('names the key of each entry it cannot read and reads its control as text', () => {
        const rows: [Record<string, unknown>, string, string, string][] = [
            [{ ...SOUND, control: 'colours' }, 'behavior.yml:probe', 'text', 'editor'],
            [
                { ...SOUND, control: 'choice', values_from: 'planets' },
                'behavior.yml:probe',
                'text',
                'editor'
            ],
            [{ ...SOUND, control: 'choice' }, 'behavior.yml:probe', 'text', 'editor'],
            [
                {
                    description: 'A family.',
                    heading: 'editor',
                    fields: { name: { control: 'text' } }
                },
                'behavior.yml:probe.name',
                'text',
                'editor'
            ],
            [HEADLESS, 'behavior.yml:probe', 'text', 'unheaded'],
            [{ ...SOUND, heading: 'kitchen' }, 'behavior.yml:probe', 'text', 'unheaded'],
            [
                { ...SOUND, control: 'number', default: 3, min: 5, max: 1 },
                'behavior.yml:probe',
                'text',
                'editor'
            ]
        ];
        for (const [entry, key, control, heading] of rows) {
            const config = holding(entry);
            const found = optionFindings(ENGINE, config);
            expect(found.map((one) => [one.file, one.key])).toEqual([[FILE, key]]);
            const read = catalogOf(config)['behavior.yml'].probe;
            const field = read.fields?.name;
            expect((field ?? read).control).toBe(control);
            expect(read.heading).toBe(heading);
        }
    });
});
