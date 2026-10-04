// Layer 1, data tests. The machine's own file, read from text the case writes: checkLocal over
// every shape of wrong value, in the order the reader refuses them. The real config/local.yml is
// never opened.

import { describe, expect } from 'vitest';
import { checkLocal } from '../../../../src/lib/data/sources/config.ts';
import { it } from '../../../fixtures/scratch.ts';

/** The sentence checkLocal gives for a text, which names the file as `local.yml`. */
const sentence = (text: string) => checkLocal(text);

describe('checkLocal', () => {
    it.each([
        ['[]', 'local.yml: expected a map of keys'],
        ['accounts: {}', 'local.yml: accounts must be a list'],
        ['accounts: [3]', 'local.yml: accounts[0] must be a map'],
        [
            'accounts: [{ tool: gemini, dir: d, label: a }]',
            'local.yml: accounts[0].tool must be claude or codex'
        ],
        [
            "accounts: [{ tool: claude, dir: '', label: a }]",
            'local.yml: accounts[0].dir must be a path'
        ],
        [
            "accounts: [{ tool: claude, dir: d, label: '' }]",
            'local.yml: accounts[0].label must be words'
        ],
        [
            'accounts: [{ tool: claude, dir: d, label: A b }, { tool: claude, dir: e, label: a-b }]',
            'local.yml: accounts[1].label duplicates a Claude label or reduced label: a-b'
        ],
        ['hub: 3\nport: x', 'local.yml: hub must be a path'],
        ['port: x', 'local.yml: port must be an integer'],
        ["hpc_host: ''", 'local.yml: hpc_host must be a non-empty string'],
        [
            'calendars: [{ provider: yahoo, label: a }]',
            'local.yml: calendars[0].provider must be google, microsoft or ics'
        ],
        [
            'calendars: [{ provider: ics, label: A }]',
            'local.yml: calendars[0].label must be lowercase letters, digits and dashes'
        ],
        [
            'calendars: [{ provider: ics, label: a }, { provider: ics, label: a }]',
            'local.yml: calendars[1].label repeats a for ics'
        ],
        [
            'mail: [{ provider: ics, label: a }]',
            'local.yml: mail[0].provider must be google or microsoft'
        ]
    ])('answers %j with the sentence it would throw', (text, expected) => {
        expect(sentence(text)).toBe(expected);
    });
});
