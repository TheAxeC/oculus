// The server's path containment and real-path helpers (src/lib/server/core/paths.ts), which every
// route, write and read that takes a path from a request checks it with.
//
// `inside` admits the folder itself and everything below it, `below` admits only what lies strictly
// below it, and both resolve first, so a `..` that walks out of the folder is refused and a
// sibling whose name starts with the folder's is not inside it. `realPath` answers null for a path
// with nothing behind it and follows a symbolic link to where it points. Every file here is made
// under the system temporary directory.
// @module-tag slow: its cases time out or fail on a loaded machine, so npm test leaves it out.

import { mkdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { realpathSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect } from 'vitest';
import { below, inside, realPath } from '../../../src/lib/server/core/paths.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';
import { treeFiles } from '../../checks/walk.ts';

describe('inside', () => {
    it('admits the folder itself and a path below it', () => {
        expect(inside('/a/b', '/a')).toBe(true);
        expect(inside('/a', '/a')).toBe(true);
    });

    it('refuses a sibling that shares the prefix and a path that walks out', () => {
        expect(inside('/ab', '/a')).toBe(false);
        expect(inside('/a/../b', '/a')).toBe(false);
    });

    it('holds only the root itself for a folder of the root', () => {
        expect(inside('/', '/')).toBe(true);
        expect(inside('/Users/x', '/')).toBe(false);
    });
});

describe('below', () => {
    it('admits a path strictly below the folder and not the folder itself', () => {
        expect(below('/a/b', '/a')).toBe(true);
        expect(below('/a', '/a')).toBe(false);
        expect(below('/a/', '/a')).toBe(false);
        expect(below('/', '/')).toBe(false);
        expect(below('/x', '/')).toBe(false);
    });

    it('refuses a sibling that shares the prefix and a path that walks out', () => {
        expect(below('/ab', '/a')).toBe(false);
        expect(below('/a/b/../../c', '/a')).toBe(false);
    });
});

describe('realPath', () => {
    it('is null for a path with nothing behind it', () => {
        const dir = scratchDir('oculus-paths-test-');
        expect(realPath(join(dir, 'missing'))).toBe(null);
    });

    it('follows a symbolic link to its target', () => {
        const dir = scratchDir('oculus-paths-test-');
        const target = join(dir, 'target');
        mkdirSync(target);
        writeFileSync(join(target, 'f.txt'), 'x');
        const link = join(dir, 'link');
        symlinkSync(target, link);
        expect(realPath(link)).toBe(realpathSync(target));
        expect(realPath(join(link, 'f.txt'))).toBe(join(realpathSync(target), 'f.txt'));
    });
});

// An audit over the source text, not coverage: the copies the shared helpers replaced are gone
// from src, so a new one shows here rather than in a later duplication pass. Four functions still
// match the pattern and are listed by name: the shared `inside` itself, the manifest-path rule
// `insideHub` (which calls `below`), and two that test no path at all, a calendar event inside a
// time window and a merge conflict holding a line. Any new match, a new containment copy or a new
// function named `inside...`, turns this red until the list is read again. The yaml library's own
// `isMap` is imported under another name wherever it is used, in src and in bin, so `isMap` is the
// guard everywhere.
describe('the copies the shared helpers replaced', () => {
    const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
    const SRC = join(ROOT, 'src');
    const COPIES =
        /isRecord|isFieldMap|function inside|insideRepo|function real\(|function localDay|function basename/;

    function files(dir: string): string[] {
        return treeFiles(dir).map((rel) => join(dir, rel));
    }

    it('are written nowhere under src, and the four named matches are all that remain', () => {
        const found = files(SRC).flatMap((file) =>
            readFileSync(file, 'utf8')
                .split('\n')
                .map((line) => ({ file, line }))
                .filter((one) => COPIES.test(one.line))
                .map((one) => `${one.file.slice(SRC.length + 1)}: ${one.line.trim()}`)
        );
        expect(found.sort()).toEqual([
            'lib/server/accounts/calendar/ics.ts: function inside(start: ICAL.Time, end: ICAL.Time, window: Window): boolean {',
            'lib/server/core/paths.ts: export function inside(path: string, dir: string): boolean {',
            'lib/server/edit/writes/manifest.ts: export function insideHub(hub: string, config: PortfolioConfig, file: string): boolean {',
            'lib/views/sources/repositories/merge/MergeSide.svelte: function inside(line: number): SideConflict | undefined {'
        ]);
    });

    it("leave `isMap` to the guard: no file imports the yaml library's test under that name", () => {
        const yamlMap = /import \{[^}]*\bisMap\b(?! as )[^}]*\} from 'yaml'/;
        const found = [...files(SRC), ...files(join(ROOT, 'bin'))].filter((file) =>
            yamlMap.test(readFileSync(file, 'utf8'))
        );
        expect(found.map((file) => file.slice(ROOT.length + 1))).toEqual([]);
    });
});
