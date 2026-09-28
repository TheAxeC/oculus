// The client-safe path helpers of data/helpers/files/paths.ts, over `/` paths as the page holds
// them.
//
// `nameOf` is the last non-empty segment, so a folder written with a trailing slash is still named;
// `trimSlash` drops the trailing slashes a folder may be written with; `joinPath` joins a folder
// and a path below it by one slash, the root folder included; `pathUnder` is the path of a target
// below a folder, empty for the folder itself and null for anything outside it, a sibling whose
// name starts with the folder's included; `deepestHolding` picks, among items with folders, the one
// whose folder holds a target most deeply.

import { describe, expect, it } from 'vitest';
import {
    deepestHolding,
    joinPath,
    nameOf,
    pathUnder,
    trimSlash
} from '../../../../src/lib/data/helpers/files/paths.ts';

describe('nameOf', () => {
    it('is the last non-empty segment', () => {
        expect(nameOf('a/b/')).toBe('b');
        expect(nameOf('b')).toBe('b');
        expect(nameOf('')).toBe('');
        expect(nameOf('/a/b/c.ts')).toBe('c.ts');
    });
});

describe('trimSlash', () => {
    it('drops the trailing slashes and keeps the root', () => {
        expect(trimSlash('/r/')).toBe('/r');
        expect(trimSlash('/r//')).toBe('/r');
        expect(trimSlash('/r')).toBe('/r');
        expect(trimSlash('/')).toBe('/');
    });
});

describe('joinPath', () => {
    it('joins by one slash, the root folder and a trailing slash included', () => {
        expect(joinPath('/', 'work/a.txt')).toBe('/work/a.txt');
        expect(joinPath('/r/', 'a')).toBe('/r/a');
        expect(joinPath('/r', 'a/b')).toBe('/r/a/b');
    });

    it('is the folder itself for an empty path', () => {
        expect(joinPath('/r', '')).toBe('/r');
        expect(joinPath('/r/', '')).toBe('/r');
        expect(joinPath('/', '')).toBe('/');
    });
});

describe('pathUnder', () => {
    it('is the path below the folder, or empty for the folder itself', () => {
        expect(pathUnder('/r/', '/r/x/y')).toBe('x/y');
        expect(pathUnder('/r', '/r')).toBe('');
        expect(pathUnder('/r', '/r/')).toBe('');
    });

    it('is null outside the folder, a sibling sharing the prefix included', () => {
        expect(pathUnder('/r', '/rx')).toBe(null);
        expect(pathUnder('/r', '/')).toBe(null);
    });

    it('is null for every target when the folder is empty', () => {
        expect(pathUnder('', '/r')).toBe(null);
        expect(pathUnder('', '/')).toBe(null);
        expect(pathUnder('', '')).toBe(null);
    });

    it('holds everything absolute under the root folder', () => {
        expect(pathUnder('/', '/r/x')).toBe('r/x');
        expect(pathUnder('/', '/')).toBe('');
    });
});

describe('deepestHolding', () => {
    const FOLDERS = [{ dir: '/r' }, { dir: '/r/sub' }];

    it('picks the item whose folder holds the target most deeply', () => {
        expect(deepestHolding(FOLDERS, (one) => one.dir, '/r/sub/f')).toEqual({
            item: FOLDERS[1],
            path: 'f'
        });
        expect(deepestHolding(FOLDERS, (one) => one.dir, '/r/g')).toEqual({
            item: FOLDERS[0],
            path: 'g'
        });
    });

    it('is null when no folder holds the target', () => {
        expect(deepestHolding(FOLDERS, (one) => one.dir, '/elsewhere')).toBe(null);
        expect(deepestHolding([], (one: { dir: string }) => one.dir, '/r')).toBe(null);
    });
});
