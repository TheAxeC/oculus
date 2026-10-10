// Layer 4, data test. The `hub: true` mark of a `roots:` entry as readRoots reads it
// (lib/server/files/files.ts): a mark that cannot be honoured is a finding that names the root, and
// the root is then read as a plain root, so a wrong value never builds a second hub.
//
// Every directory is made under the system temporary directory by scratchDir, and the entries are
// handed to readRoots as a list, so nothing reads a hub or the checkout.

import { mkdirSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { readRoots } from '../../../src/lib/server/files/files.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';

/** The merged engine settings, which hold the finding sentences readRoots words a finding with. */
let settings: Record<string, unknown> = {};

test.beforeAll(() => {
    settings = loadConfig(engineDir()).config;
});

/** What a list of entries reads as: the roots with their mark, and each finding by its root. */
function read(
    entries: unknown[],
    first: string
): { roots: [string, boolean][]; findings: [string, string][] } {
    const { roots, findings } = readRoots({ ...settings, roots: entries }, 'sources.yml', first);
    return {
        roots: roots.map((one) => [one.key, one.hub === true]),
        findings: findings.map((one) => [one.key, one.message])
    };
}

/** A folder under the scratch directory of a case, made here. */
function folder(base: string, ...parts: string[]): string {
    const full = join(base, ...parts);
    mkdirSync(full, { recursive: true });
    return full;
}

describe('a hub root', () => {
    it('is read as a hub when it is true and nothing about it is wrong', () => {
        const base = scratchDir('oculus-hub-roots-');
        const first = folder(base, 'hub');
        const lab = folder(base, 'lab');
        const out = read([{ key: 'lab', dir: lab, hub: true }], first);
        expect(out).toEqual({ roots: [['lab', true]], findings: [] });
    });

    it('is a plain root with a finding naming the root when hub is a string or a number', () => {
        const base = scratchDir('oculus-hub-roots-');
        const first = folder(base, 'hub');
        const out = read(
            [
                { key: 'a', dir: folder(base, 'a'), hub: 'yes' },
                { key: 'b', dir: folder(base, 'b'), hub: 1 }
            ],
            first
        );
        expect(out.roots).toEqual([
            ['a', false],
            ['b', false]
        ]);
        expect(out.findings.map(([key]) => key)).toEqual(['a', 'b']);
        for (const [, message] of out.findings) expect(message).toContain('not true or false');
    });

    it('is a plain root with a finding when it is, lies inside or holds the first hub', () => {
        const base = scratchDir('oculus-hub-roots-');
        const parent = folder(base, 'parent');
        const first = folder(parent, 'hub');
        const out = read(
            [
                { key: 'same', dir: first, hub: true },
                { key: 'inner', dir: folder(first, 'projects'), hub: true },
                { key: 'outer', dir: parent, hub: true }
            ],
            first
        );
        expect(out.roots.map(([, hub]) => hub)).toEqual([false, false, false]);
        expect(out.findings.map(([key]) => key)).toEqual(['same', 'inner', 'outer']);
        for (const [, message] of out.findings) expect(message).toContain('first hub');
    });

    it('is a plain root with a finding when its key is reserved or holds a colon', () => {
        const base = scratchDir('oculus-hub-roots-');
        const first = folder(base, 'hub');
        const keys = ['side', 'root', 'hub', 'engine', 'a:b'];
        const out = read(
            keys.map((key) => ({ key, dir: folder(base, key.replace(':', '-')), hub: true })),
            first
        );
        expect(out.roots.map(([key, hub]) => [key, hub])).toEqual(keys.map((key) => [key, false]));
        expect(out.findings.map(([key]) => key)).toEqual(keys);
        for (const [, message] of out.findings) expect(message).toContain('cannot be keyed');
    });

    it('is a plain root with a finding when an earlier hub root has its directory or holds it', () => {
        const base = scratchDir('oculus-hub-roots-');
        const first = folder(base, 'hub');
        const lab = folder(base, 'lab');
        const link = join(base, 'lab2');
        symlinkSync(lab, link);
        const inner = folder(lab, 'inner');
        const out = read(
            [
                { key: 'lab', dir: lab, hub: true },
                { key: 'lab2', dir: link, hub: true },
                { key: 'inner', dir: inner, hub: true }
            ],
            first
        );
        expect(out.roots).toEqual([
            ['lab', true],
            ['lab2', false],
            ['inner', false]
        ]);
        expect(out.findings.map(([key]) => key)).toEqual(['lab2', 'inner']);
        expect(out.findings[0][1]).toContain('same directory');
        expect(out.findings[1][1]).toContain('inside or holds');
    });

    it('is not built when its directory is not on this machine, and the finding is the missing directory', () => {
        const base = scratchDir('oculus-hub-roots-');
        const first = folder(base, 'hub');
        const gone = join(base, 'nowhere', 'x');
        const out = read([{ key: 'lab', dir: gone, hub: true }], first);
        expect(out.roots).toEqual([['lab', false]]);
        expect(out.findings).toHaveLength(1);
        expect(out.findings[0][0]).toBe('lab');
        expect(out.findings[0][1]).toContain('no directory at');
    });
});
