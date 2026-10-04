// Layer 1, data tests. The client-safe path helpers of data/helpers/files/paths.ts, over `/` paths
// as the page holds them.
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
    it.each([
        ['a folder with a trailing slash', 'a/b/', 'b'],
        ['a bare name', 'b', 'b'],
        ['an empty path', '', ''],
        ['an absolute path', '/a/b/c.ts', 'c.ts']
    ])('names %s by its last non-empty segment', (_row, path, name) => {
        expect(nameOf(path)).toBe(name);
    });
});

describe('trimSlash', () => {
    it.each([
        ['one trailing slash', '/r/', '/r'],
        ['two trailing slashes', '/r//', '/r'],
        ['none', '/r', '/r'],
        ['the root', '/', '/']
    ])('drops %s and keeps the root', (_row, path, trimmed) => {
        expect(trimSlash(path)).toBe(trimmed);
    });
});

describe('joinPath', () => {
    it.each([
        ['the root folder', '/', 'work/a.txt', '/work/a.txt'],
        ['a folder with a trailing slash', '/r/', 'a', '/r/a'],
        ['a folder with a nested path', '/r', 'a/b', '/r/a/b'],
        ['an empty path', '/r', '', '/r'],
        ['an empty path under a trailing slash', '/r/', '', '/r'],
        ['an empty path under the root folder', '/', '', '/']
    ])('joins by one slash for %s', (_row, folder, path, joined) => {
        expect(joinPath(folder, path)).toBe(joined);
    });
});

describe('pathUnder', () => {
    it.each([
        ['a target below the folder', '/r/', '/r/x/y', 'x/y'],
        ['the folder itself', '/r', '/r', ''],
        ['the folder with a trailing slash', '/r', '/r/', ''],
        ['a sibling sharing the prefix', '/r', '/rx', null],
        ['a target above the folder', '/r', '/', null],
        ['a target when the folder is empty', '', '/r', null],
        ['the root when the folder is empty', '', '/', null],
        ['an empty target when the folder is empty', '', '', null],
        ['a target below the root folder', '/', '/r/x', 'r/x'],
        ['the root folder itself', '/', '/', '']
    ])('reads %s as its path below the folder or null', (_row, folder, target, under) => {
        expect(pathUnder(folder, target)).toBe(under);
    });
});

describe('deepestHolding', () => {
    const FOLDERS = [{ dir: '/r' }, { dir: '/r/sub' }];

    it.each([
        ['the deeper folder', '/r/sub/f', 1, 'f'],
        ['the shallower folder', '/r/g', 0, 'g']
    ])('picks %s for the folder that holds the target most deeply', (_row, target, at, path) => {
        expect(deepestHolding(FOLDERS, (one) => one.dir, target)).toEqual({
            item: FOLDERS[at],
            path
        });
    });

    it('is null when no folder holds the target', () => {
        expect(deepestHolding(FOLDERS, (one) => one.dir, '/elsewhere')).toBe(null);
        expect(deepestHolding([], (one: { dir: string }) => one.dir, '/r')).toBe(null);
    });
});
