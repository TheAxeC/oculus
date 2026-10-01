// The merge of an engine's config folder and the flattening of its text fragments, over a scratch
// engine folder the case writes and over maps built from JSON, whose `__proto__` key is an own key.
// The real config folder is never read here.

import { join } from 'node:path';
import { describe, expect } from 'vitest';
import {
    flattenText,
    loadConfig,
    textCatalog,
    usageTiers
} from '../../../../src/lib/data/sources/config.ts';
import { it, plantScratch, scratchDir } from '../../../fixtures/scratch.ts';

/** An engine folder holding the given files under its config folder. */
function engineWith(files: Record<string, string>): string {
    const planted = Object.entries(files).map(([name, body]): [string, string] => [
        join('config', name),
        body
    ]);
    return plantScratch('oculus-merge-', Object.fromEntries(planted));
}

describe('flattenText', () => {
    it('writes the nested keys dotted and numbers and booleans as text', () => {
        expect(flattenText({ a: 'x', b: 1, c: true, d: { e: 'f', g: 2.5 } })).toStrictEqual({
            a: 'x',
            b: '1',
            c: 'true',
            'd.e': 'f',
            'd.g': '2.5'
        });
    });

    it.each([
        [[], 'text catalog: root is not a map'],
        ['x', 'text catalog: root is not a map'],
        [{ a: [1] }, 'text catalog: a is not a map'],
        [{ a: { b: 'x', c: null } }, 'text catalog: a.c is not a map']
    ])('throws for %j', (node, sentence) => {
        expect(() => flattenText(node)).toThrow(sentence);
    });

    it('skips an own __proto__ key at every level', () => {
        expect(
            Object.keys(flattenText(JSON.parse('{"__proto__":{"a":"x"},"b":"y"}')))
        ).toStrictEqual(['b']);
        expect(
            Object.keys(flattenText(JSON.parse('{"a":{"__proto__":{"c":"x"},"d":"y"}}')))
        ).toStrictEqual(['a.d']);
    });

    it('skips an own __proto__ key holding text', () => {
        expect(Object.keys(flattenText(JSON.parse('{"__proto__":"x","b":"y"}')))).toStrictEqual([
            'b'
        ]);
    });

    it('skips an own __proto__ key holding text or a number below the top', () => {
        expect(flattenText(JSON.parse('{"a":{"__proto__":"x","b":"y"}}'))).toStrictEqual({
            'a.b': 'y'
        });
        expect(Object.keys(flattenText(JSON.parse('{"k":{"a":1,"__proto__":3}}')))).toStrictEqual([
            'k.a'
        ]);
    });
});

describe('usageTiers over an own __proto__ key', () => {
    it('refuses a __proto__ key holding a map, naming it', () => {
        const tiers: unknown = JSON.parse('{"__proto__":{"a":"x"},"b":"y"}');
        expect(() => usageTiers({ usage_tiers: tiers })).toThrow(
            'config/behavior.yml: usage_tiers.__proto__ must be a string'
        );
    });

    it('answers the map it was given when the __proto__ key holds text', () => {
        const tiers: unknown = JSON.parse('{"__proto__":"x","b":"y"}');
        expect(usageTiers({ usage_tiers: tiers })).toBe(tiers);
    });
});

describe('loadConfig', () => {
    it('merges the files in name order, a later file winning, and names the key read twice', () => {
        const dir = engineWith({ 'a.yml': 'x: 1\ny: 2\n', 'b.yml': 'y: 3\n' });
        const read = loadConfig(dir);
        expect(read.config).toStrictEqual({ x: 1, y: 3 });
        expect(read.findings).toStrictEqual([
            {
                file: join(dir, 'config', 'b.yml'),
                key: 'y',
                message: 'findings.config.defined_twice y a.yml b.yml'
            }
        ]);
    });

    it.each([['[]'], ['3'], ['x']])(
        'names a file holding %j as not a map and merges nothing',
        (body) => {
            const dir = engineWith({ 'a.yml': body, 'b.yml': 'k: 1\n' });
            const read = loadConfig(dir);
            expect(read.config).toStrictEqual({ k: 1 });
            expect(read.findings).toStrictEqual([
                { file: join(dir, 'config', 'a.yml'), key: '', message: 'findings.file.not_a_map' }
            ]);
        }
    );

    it('reads an empty file as no keys', () => {
        const dir = engineWith({ 'a.yml': '', 'b.yml': 'k: 1\n' });
        expect(loadConfig(dir)).toStrictEqual({ config: { k: 1 }, findings: [] });
    });

    it('names a file that does not parse by the first line of the parser', () => {
        const dir = engineWith({ 'a.yml': 'k: [\n' });
        const read = loadConfig(dir);
        expect(read.config).toStrictEqual({});
        expect(read.findings).toHaveLength(1);
        expect(read.findings[0].message.startsWith('findings.file.does_not_parse ')).toBe(true);
    });

    it('names a config folder that is not there', () => {
        const dir = scratchDir('oculus-merge-none-');
        expect(loadConfig(dir)).toStrictEqual({
            config: {},
            findings: [
                {
                    file: join(dir, 'config'),
                    key: '',
                    message: 'findings.config.directory_missing'
                }
            ]
        });
    });

    it('leaves the machine file out of the merge', () => {
        const dir = engineWith({ 'local.yml': 'port: 8791\n', 'a.yml': 'k: 1\n' });
        expect(loadConfig(dir)).toStrictEqual({ config: { k: 1 }, findings: [] });
    });

    it('flattens the text fragments into the catalog and names a fragment that is not a map', () => {
        const dir = engineWith({
            'text/one.yml': 'text:\n  k:\n    a: x\n',
            'text/two.yml': 'text: [1]\n'
        });
        const read = loadConfig(dir);
        expect(textCatalog(read.config)).toStrictEqual({ 'k.a': 'x' });
        expect(read.findings).toStrictEqual([
            {
                file: join(dir, 'config', 'text', 'two.yml'),
                key: 'text',
                message: 'findings.config.text_not_a_map root'
            }
        ]);
    });

    it('skips a top-level __proto__ key of a file, keeping the prototype and the other keys', () => {
        const dir = engineWith({ 'behavior.yml': '__proto__:\n  a: x\nb: y\n' });
        const read = loadConfig(dir);
        expect(Object.getPrototypeOf(read.config)).toBe(Object.prototype);
        expect('a' in read.config).toBe(false);
        expect(read.config.b).toBe('y');
        expect(Object.keys(read.config)).toStrictEqual(['b']);
        expect(read.findings).toStrictEqual([]);
    });
});
