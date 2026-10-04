// Layer 1, data tests. config/catalogs/agents.yml read by data/sources/config/catalog/agents.ts:
// every refusal names the line it is on and leaves the rest of the file read.

import { describe, expect, it } from 'vitest';
import { parseAgents, passable } from '../../../src/lib/data/sources/config/catalog/agents.ts';

/** One agent's catalog text with one picker, its lines numbered from 1 as the file's are. */
function one(agent: string, list: string[]): string {
    return ['agents:', `    ${agent}:`, '        label: Probe', '        lists:', ...list].join(
        '\n'
    );
}

/** A picker body under `lists:`, its values one per line. */
function picker(flag: string, fallback: string, values: string[]): string[] {
    return [
        '            probe:',
        '                label: Probe',
        `                flag: ${flag}`,
        `                default: ${fallback}`,
        '                values:',
        ...values.map((value) => `                    - ${value}`)
    ];
}

describe('a refusal in the agents catalog', () => {
    it('refuses a value that would read as an option, or holds whitespace or a control character', () => {
        const text = one(
            'claude',
            picker('--model', 'a', [
                '{ id: a, label: A, pass: opus }',
                '{ id: b, label: B, pass: --yolo }',
                "{ id: c, label: C, pass: 'two words' }",
                '{ id: d, label: D, pass: "tab\\there" }',
                "{ id: e, label: E, pass: '' }"
            ])
        );
        const read = parseAgents(text);
        expect(read.findings.map((finding) => [finding.line, finding.why])).toEqual([
            [11, 'value'],
            [12, 'value'],
            [13, 'value'],
            [14, 'value']
        ]);
        expect(read.agents[0].lists[0].values.map((value) => value.id)).toEqual(['a']);
        expect(passable('opus')).toBe(true);
        expect(passable('-x')).toBe(false);
        expect(passable('a\u0000b')).toBe(false);
    });
});
