// Layer 1, data tests. The finding formatter of data/helpers/finding-text.ts: the placeholder rule
// it shares with the client's t(), and the key-and-arguments form it writes for a key the catalog
// lacks, which is what keeps a broken sentence file from taking a reader down. Pure functions over
// literal catalogs.

import { describe, expect, it } from 'vitest';
import { fillPlaceholders, findingText } from '../../../src/lib/data/helpers/finding-text.ts';

const CATALOG = {
    'findings.test.two': '{0} names no {1}',
    'findings.test.twice': 'key {0} is now {1}: write the tags under {1}:',
    'findings.test.plain': 'is not a map of keys'
};

describe('fillPlaceholders', () => {
    it.each([
        [
            'each argument at its position, as often as the template names it',
            'key {0} is now {1}: under {1}:',
            ['program', 'pillar'],
            'key program is now pillar: under pillar:'
        ],
        ['a number', '{0} projects', [2], '2 projects'],
        [
            'a placeholder with no argument',
            '{0} names no {1}',
            ['venue_id'],
            'venue_id names no {1}'
        ],
        ['a word or nothing in braces', '{G.warn} {x} {}', ['unused'], '{G.warn} {x} {}'],
        ['an argument that is the empty string', '[{0}]', [''], '[]']
    ])('fills %s', (_row, template, args, filled) => {
        expect(fillPlaceholders(template, args)).toBe(filled);
    });
});

describe('findingText', () => {
    it.each([
        ['two arguments', 'findings.test.two', ['venue_id', 'venue'], 'venue_id names no venue'],
        [
            'an argument named twice',
            'findings.test.twice',
            ['program', 'pillar'],
            'key program is now pillar: write the tags under pillar:'
        ],
        ['no argument', 'findings.test.plain', [], 'is not a map of keys'],
        ['a missing argument', 'findings.test.two', ['related'], 'related names no {1}']
    ])(
        'answers the catalog sentence for %s with the arguments in place',
        (_row, key, args, text) => {
            expect(findingText(CATALOG, key, ...args)).toBe(text);
        }
    );

    it.each([
        [
            'one argument',
            'findings.file.does_not_parse',
            ['Unexpected end at line 2'],
            'findings.file.does_not_parse Unexpected end at line 2'
        ],
        [
            'three arguments, one a number',
            'findings.config.defined_twice',
            ['palette', 'a.yml', 3],
            'findings.config.defined_twice palette a.yml 3'
        ],
        [
            'no argument',
            'findings.config.directory_missing',
            [],
            'findings.config.directory_missing'
        ],
        ['a name inherited from Object', 'constructor', [], 'constructor']
    ])(
        'answers the key followed by its arguments for %s, a key the catalog lacks, and never throws',
        (_row, key, args, text) => {
            expect(findingText(CATALOG, key, ...args)).toBe(text);
        }
    );
});
