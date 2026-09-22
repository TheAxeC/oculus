// The finding formatter of data/helpers/finding-text.ts: the placeholder rule it shares with the
// client's t(), and the key-and-arguments form it writes for a key the catalog lacks, which is what
// keeps a broken sentence file from taking a reader down. Pure functions over literal catalogs.

import { describe, expect, it } from 'vitest';
import { fillPlaceholders, findingText } from '../../../src/lib/data/helpers/finding-text.ts';

const CATALOG = {
    'findings.test.two': '{0} names no {1}',
    'findings.test.twice': 'key {0} is now {1}: write the tags under {1}:',
    'findings.test.plain': 'is not a map of keys'
};

describe('fillPlaceholders', () => {
    it('puts each argument at its position, as often as the template names it', () => {
        expect(fillPlaceholders('key {0} is now {1}: under {1}:', ['program', 'pillar'])).toBe(
            'key program is now pillar: under pillar:'
        );
        expect(fillPlaceholders('{0} projects', [2])).toBe('2 projects');
    });

    it('leaves a placeholder with no argument as it is written', () => {
        expect(fillPlaceholders('{0} names no {1}', ['venue_id'])).toBe('venue_id names no {1}');
        expect(fillPlaceholders('{G.warn} {x} {}', ['unused'])).toBe('{G.warn} {x} {}');
    });

    it('reads an argument that is the empty string as an argument', () => {
        expect(fillPlaceholders('[{0}]', [''])).toBe('[]');
    });
});

describe('findingText', () => {
    it('answers the catalog sentence with its arguments in place', () => {
        expect(findingText(CATALOG, 'findings.test.two', 'venue_id', 'venue')).toBe(
            'venue_id names no venue'
        );
        expect(findingText(CATALOG, 'findings.test.twice', 'program', 'pillar')).toBe(
            'key program is now pillar: write the tags under pillar:'
        );
        expect(findingText(CATALOG, 'findings.test.plain')).toBe('is not a map of keys');
        expect(findingText(CATALOG, 'findings.test.two', 'related')).toBe('related names no {1}');
    });

    it('answers the key followed by its arguments when the catalog lacks the key, and never throws', () => {
        expect(findingText({}, 'findings.file.does_not_parse', 'Unexpected end at line 2')).toBe(
            'findings.file.does_not_parse Unexpected end at line 2'
        );
        expect(findingText({}, 'findings.config.defined_twice', 'palette', 'a.yml', 3)).toBe(
            'findings.config.defined_twice palette a.yml 3'
        );
        expect(findingText(CATALOG, 'findings.config.directory_missing')).toBe(
            'findings.config.directory_missing'
        );
        // An inherited property name is not a key of the catalog either.
        expect(findingText(CATALOG, 'constructor')).toBe('constructor');
    });
});
