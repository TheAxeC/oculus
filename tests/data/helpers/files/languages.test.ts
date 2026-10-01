// Layer 1, data test. The one map from a file name to the language the editor colours it in:
// `languages:` of config/sources.yml read by `languageMap`, and the entries and languages it drops.
// The tracked file is read from disk for the cases that hold it to the code window's registry;
// every hand-edited map is a plain object handed to the reader, so nothing is written anywhere.
//
// What this does NOT cover: how a name is matched against the map (tests/state/sources/fs/) and
// the sentences a drop is reported in (tests/data/sources/config/languages.test.ts).

import { describe, expect, it } from 'vitest';
import { languageMap, readLanguages } from '../../../../src/lib/data/helpers/files/languages.ts';
import { registered } from '../../../../src/lib/data/prose/languages.ts';
import { engineDir, loadConfig } from '../../../../src/lib/data/sources/config.ts';

const TRACKED = loadConfig(engineDir()).config;

/** The map a config holding these `languages:` reads as. */
function mapOf(languages: unknown): ReadonlyMap<string, string> {
    return languageMap({ languages });
}

describe('the tracked map', () => {
    it('names every language the code window registers and no other, and drops nothing', () => {
        const { map, drops } = readLanguages(TRACKED);
        expect(drops).toEqual([]);
        expect([...new Set(map.values())].sort()).toEqual([...registered()].sort());
    });

    it('lists one language per entry of the file, every ending lowercased and claimed once', () => {
        const languages = TRACKED.languages as Record<string, string[]>;
        const endings = Object.values(languages).flat();
        expect(endings.map((ending) => ending.toLowerCase())).toEqual(endings);
        expect(new Set(endings).size).toBe(endings.length);
        expect(languageMap(TRACKED).size).toBe(endings.length);
    });

    it('leaves Wren and Graphviz to plain text', () => {
        const map = languageMap(TRACKED);
        for (const ending of ['.wren', '.dot', '.gv']) expect(map.has(ending)).toBe(false);
    });

    it('is built once per read, as a Map that holds nothing an object inherits', () => {
        const map = languageMap(TRACKED);
        expect(map).toBeInstanceOf(Map);
        for (const key of ['constructor', 'toString', '__proto__', 'hasOwnProperty']) {
            expect(map.get(key)).toBeUndefined();
        }
    });
});

describe('the reader of a hand-edited map', () => {
    it('reads an extension and a whole name, both lowercased', () => {
        const map = mapOf({ python: ['.PY', '.pyi'], makefile: ['Makefile', '.mk'] });
        expect([...map]).toEqual([
            ['.py', 'python'],
            ['.pyi', 'python'],
            ['makefile', 'makefile'],
            ['.mk', 'makefile']
        ]);
    });

    it('answers an empty map and no drop for a config without the key', () => {
        expect(readLanguages({})).toEqual({ map: new Map(), drops: [] });
    });

    it.each([
        ['a list', ['python']],
        ['text', 'python'],
        ['a number', 3],
        ['null', null]
    ])('answers an empty map and one drop for a key that is %s', (_label, value) => {
        const { map, drops } = readLanguages({ languages: value });
        expect(map.size).toBe(0);
        expect(drops).toEqual([{ kind: 'not-a-map' }]);
    });

    it('drops the language whose value is not a list and keeps the others', () => {
        const { map, drops } = readLanguages({
            languages: { python: '.py', bash: ['.sh'], r: { x: 1 }, css: null }
        });
        expect([...map]).toEqual([['.sh', 'bash']]);
        expect(drops).toEqual([
            { kind: 'not-a-list', language: 'python' },
            { kind: 'not-a-list', language: 'r' },
            { kind: 'not-a-list', language: 'css' }
        ]);
    });

    it('drops an entry that is not text, is empty, holds a slash or has a second dot', () => {
        const { map, drops } = readLanguages({
            languages: {
                python: ['.py', '.tar.gz', 'src/Makefile', '', 3, null, ['.x'], '.', '..'],
                cpp: ['.c++', 'cmakelists.txt.in']
            }
        });
        expect([...map]).toEqual([
            ['.py', 'python'],
            ['.c++', 'cpp'],
            ['cmakelists.txt.in', 'cpp']
        ]);
        expect(drops.map((drop) => drop.kind === 'ending' && drop.entry)).toEqual([
            '.tar.gz',
            'src/Makefile',
            '',
            '3',
            'null',
            '[".x"]',
            '.',
            '..'
        ]);
    });

    it('drops a language the editor does not colour, and names are the editor lowercase ones', () => {
        const { map, drops } = readLanguages({
            languages: { cobol: ['.cbl'], Python: ['.py'], python: ['.pyw'] }
        });
        expect([...map]).toEqual([['.pyw', 'python']]);
        expect(drops).toEqual([
            { kind: 'unknown', language: 'cobol' },
            { kind: 'unknown', language: 'Python' }
        ]);
    });

    it('keeps the first language in file order for an ending two claim, compared lowercased', () => {
        const { map, drops } = readLanguages({
            languages: {
                c: ['.h', '.i'],
                cpp: ['.H', '.hpp'],
                fortran: ['.f90'],
                'fortran-fixed': ['.F90']
            }
        });
        expect(map.get('.h')).toBe('c');
        expect(map.get('.hpp')).toBe('cpp');
        expect(map.get('.f90')).toBe('fortran');
        expect(drops).toEqual([
            { kind: 'claimed', ending: '.h', first: 'c', second: 'cpp' },
            { kind: 'claimed', ending: '.f90', first: 'fortran', second: 'fortran-fixed' }
        ]);
    });

    it('reads an ending listed twice under one language as one claim', () => {
        const { map, drops } = readLanguages({ languages: { python: ['.py', '.py'] } });
        expect([...map]).toEqual([['.py', 'python']]);
        expect(drops).toEqual([]);
    });

    it('skips a key __proto__, leaving the prototype of the map and of every object untouched', () => {
        const held = JSON.parse('{"__proto__": [".proto"], "python": [".py"]}') as unknown;
        const { map, drops } = readLanguages({ languages: held });
        expect([...map]).toEqual([['.py', 'python']]);
        expect(drops).toEqual([{ kind: 'unknown', language: '__proto__' }]);
        expect(Object.getPrototypeOf(map)).toBe(Map.prototype);
        expect(Object.getPrototypeOf({})).toBe(Object.prototype);
        expect(({} as Record<string, unknown>).proto).toBeUndefined();
    });

    it('reads the registry the code window paints with as the languages it accepts', () => {
        const everything = Object.fromEntries(registered().map((name) => [name, [`.${name}x`]]));
        const { map, drops } = readLanguages({ languages: everything });
        expect(drops).toEqual([]);
        expect(map.size).toBe(registered().length);
    });
});
