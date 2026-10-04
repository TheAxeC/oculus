// Layer 1, data tests. File nesting (data/helpers/files/nesting.ts) over the shipped defaults of
// config/catalogs/file-nesting.yml: which names of one folder are drawn under which, the patterns
// the reader drops while it keeps the rest, and the finding each drop gives, in its catalog
// sentence and on its key (data/sources/config/catalog/nesting.ts).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { engineDir, loadConfig, nestingFindings } from '../../../../src/lib/data/sources/config.ts';
import { nestNames, readNesting } from '../../../../src/lib/data/helpers/files/nesting.ts';

const SHIPPED = parse(
    readFileSync(join(engineDir(), 'config', 'catalogs', 'file-nesting.yml'), 'utf8')
) as Record<string, unknown>;

const nested = (names: string[], config: Record<string, unknown> = SHIPPED, folder = 'src') =>
    Object.fromEntries(nestNames(names, readNesting(config).rules, folder));

describe('the shipped patterns', () => {
    it('nests a lock file under package.json, and the js and d.ts of a ts file under it', () => {
        expect(
            nested(['index.d.ts', 'index.js', 'index.ts', 'package-lock.json', 'package.json'])
        ).toEqual({
            'package.json': ['package-lock.json'],
            'index.ts': ['index.d.ts', 'index.js']
        });
    });

    it('nests nothing when no file names another', () => {
        expect(nested(['a.ts', 'b.ts', 'README.md'])).toEqual({});
    });

    it('reads tsconfig.*.json with the star as any text', () => {
        expect(nested(['tsconfig.json', 'tsconfig.app.json', 'tsconfig.json.bak'])).toEqual({
            'tsconfig.json': ['tsconfig.app.json']
        });
    });

    it('nests the map and the minified file under the js file', () => {
        expect(nested(['app.js', 'app.js.map', 'app.min.js', 'other.js.map'])).toEqual({
            'app.js': ['app.js.map', 'app.min.js']
        });
    });

    it('puts a file under one parent only', () => {
        const config = { patterns: { '*.a': ['${capture}.c'], '*.b': ['${capture}.c'] } };
        expect(nested(['x.a', 'x.b', 'x.c'], config)).toEqual({ 'x.a': ['x.c'] });
    });

    it('does not loop on patterns that name each other', () => {
        const config = { patterns: { '*.a': ['${capture}.b'], '*.b': ['${capture}.a'] } };
        expect(nested(['x.a', 'x.b'], config)).toEqual({ 'x.a': ['x.b'] });
    });

    it('reads basename, extname and dirname', () => {
        const config = {
            patterns: { '*.md': ['${basename}.${extname}.bak', '${dirname}.txt'] }
        };
        expect(nested(['notes.md', 'notes.md.bak', 'src.txt'], config)).toEqual({
            'notes.md': ['notes.md.bak', 'src.txt']
        });
    });

    it('treats the regular expression characters of a name as themselves', () => {
        const config = { patterns: { 'a+b.(x)': ['a+b.[y]'] } };
        expect(nested(['a+b.(x)', 'a+b.[y]', 'aab.y'], config)).toEqual({
            'a+b.(x)': ['a+b.[y]']
        });
    });
});

describe('the reader', () => {
    // Revert: let childrenOf split a text value on commas again in nesting.ts.
    it('refuses a text value, a list of numbers, an empty entry and an empty list, keeping the rest', () => {
        const read = readNesting({
            patterns: {
                '': ['x'],
                'a/b': ['x'],
                'ok.ts': ['${capture}.js'],
                'text.ts': '${capture}.js, ${capture}.map',
                'bad.ts': [1, 2],
                'blank.ts': ['a.js', ' '],
                'none.ts': []
            }
        });
        expect(read.rules).toEqual([{ key: 'ok.ts', children: ['${capture}.js'] }]);
        expect(read.drops).toEqual([
            { kind: 'key', key: '' },
            { kind: 'key', key: 'a/b' },
            { kind: 'value', key: 'text.ts' },
            { kind: 'value', key: 'bad.ts' },
            { kind: 'value', key: 'blank.ts' },
            { kind: 'value', key: 'none.ts' }
        ]);
    });

    it('takes a list of texts as the children', () => {
        expect(readNesting({ patterns: { 'a.ts': ['a.js', ' a.map '] } }).rules).toEqual([
            { key: 'a.ts', children: ['a.js', 'a.map'] }
        ]);
    });

    it('reads no rule from an absent key and one drop from a value that is no map', () => {
        expect(readNesting({})).toEqual({ rules: [], drops: [] });
        expect(readNesting({ patterns: ['x'] })).toEqual({
            rules: [],
            drops: [{ kind: 'not-a-map' }]
        });
    });
});

describe('the findings', () => {
    const ENGINE = engineDir();
    const FILE = join(ENGINE, 'config', 'catalogs', 'file-nesting.yml');
    const { text } = loadConfig(ENGINE).config;

    it('says nothing for the shipped patterns', () => {
        expect(nestingFindings(ENGINE, loadConfig(ENGINE).config)).toEqual([]);
    });

    it('says each dropped pattern in the sentence of its kind, on its own key', () => {
        const patterns = { 'a/b': ['x'], 'ok.ts': ['${capture}.js'], 'text.ts': '${capture}.js' };
        expect(nestingFindings(ENGINE, { text, patterns })).toEqual([
            {
                file: FILE,
                key: 'patterns.a/b',
                message:
                    'pattern a/b has no usable parent name (empty, or holding a slash); the pattern is not read'
            },
            {
                file: FILE,
                key: 'patterns.text.ts',
                message:
                    'pattern text.ts does not name its nested files as a list of non-empty texts; the pattern is not read'
            }
        ]);
    });

    it('says a value that is no map on the key patterns', () => {
        const [finding] = nestingFindings(ENGINE, { text, patterns: ['x'] });
        expect(finding.key).toBe('patterns');
        expect(finding.message).toBe(
            'patterns is not a map of parent name to the names nested under it; no file is nested'
        );
        expect(finding.file).toBe(FILE);
    });
});
