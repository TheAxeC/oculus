// The hub migration behind the manifest key `program:` becoming `pillar:`.
//
// The fixture is a hub in a temporary directory whose manifests carry what the real ones carry: a
// comment above the key, a comment after its value, a key order that is not alphabetical, a block
// list and a nested map. What each case checks is the bytes: one line differs and no other, and a
// second run over the same folder writes nothing at all.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { RENAMED_FIELDS } from '../../../src/lib/data/snapshot/validate.ts';
import {
    manifestsUnder,
    migrateHub,
    rootsOf,
    theRename
} from '../../../bin/migrations/rename-program-to-pillar.ts';
import { it, scratchDir, test } from '../../fixtures/scratch.ts';

// The fixture hub, under the system temporary directory; nothing outside it is read or written.
// It is made and planted before the file's first case, so a run that skips every case makes none.
let root = '';

/**
 * Write one manifest under the fixture hub, asserting the path stays inside it before any write.
 */
function manifest(where: string, text: string): string {
    const dir = resolve(root, 'projects', where);
    expect(dir.startsWith(root + sep)).toBe(true);
    mkdirSync(dir, { recursive: true });
    const file = join(dir, 'project.yml');
    writeFileSync(file, text);
    return file;
}

const WITH_KEY = [
    'id: alpha',
    'type: manuscript',
    '# the method tags, one per line of work',
    'program: [tensor, sciml]   # two of them',
    'title: "A title"',
    'results:',
    '  - "one"',
    '  - "two"',
    'status:',
    '  chips: [submitted]',
    '  line: "the line"',
    ''
].join('\n');

const WITHOUT_KEY = ['id: beta', 'type: idea', 'title: "No tags"', ''].join('\n');

let alpha = '';
let beta = '';
let nested = '';

test.beforeAll(() => {
    root = scratchDir('oculus-pillar-');
    alpha = manifest('active/alpha', WITH_KEY);
    beta = manifest('ideas/beta', WITHOUT_KEY);
    nested = manifest('archive/published/2026/gamma', WITH_KEY);
});

const { from, to } = theRename();

describe('the rename the script carries', () => {
    it('is the one the reader reports a manifest under the old key for', () => {
        expect(RENAMED_FIELDS).toEqual({ program: 'pillar' });
        expect({ from, to }).toEqual({ from: 'program', to: 'pillar' });
    });
});

describe('the manifest scan', () => {
    it('finds every project.yml at any depth under projects/', () => {
        expect(manifestsUnder(join(root, 'projects'))).toEqual([alpha, nested, beta].sort());
    });
});

describe('the migration over a fixture hub', () => {
    let first: ReturnType<typeof migrateHub>;
    test.beforeAll(() => {
        first = migrateHub(root, from, to);
    });

    it('writes the manifests that carried the old key and no others', () => {
        expect(first.written.sort()).toEqual([alpha, nested].sort());
        expect(first.unchanged).toEqual([beta]);
        expect(first.refused).toEqual([]);
    });

    it('changes the key line alone, keeping the comments, the order and the block list', () => {
        const after = readFileSync(alpha, 'utf8').split('\n');
        const before = WITH_KEY.split('\n');
        const moved = before
            .map((line, at) => (line === after[at] ? -1 : at))
            .filter((at) => at >= 0);
        expect(moved).toEqual([3]);
        expect(after[3]).toBe('pillar: [tensor, sciml]   # two of them');
    });

    it('leaves a manifest that never had the key byte for byte as it was', () => {
        expect(readFileSync(beta, 'utf8')).toBe(WITHOUT_KEY);
    });

    it('writes nothing on a second run, so the script is idempotent', () => {
        const text = readFileSync(alpha, 'utf8');
        const again = migrateHub(root, from, to);
        expect(again.written).toEqual([]);
        expect(again.unchanged.sort()).toEqual([alpha, beta, nested].sort());
        expect(again.refused).toEqual([]);
        expect(readFileSync(alpha, 'utf8')).toBe(text);
    });
});

describe('the command line', () => {
    it('is every root it names, null for none and for a flag, and a word after -- as a root', () => {
        expect(rootsOf(['/a', '/b'])).toEqual(['/a', '/b']);
        expect(rootsOf([])).toBeNull();
        expect(rootsOf(['--dry-run', '/a'])).toBeNull();
        expect(rootsOf(['-x'])).toBeNull();
        expect(rootsOf(['--', '--odd-folder'])).toEqual(['--odd-folder']);
    });
});
