// Layer 2, server test. The atomic writers of server/core/json.ts: what a write that throws leaves
// behind: the old content and the folder as it was, with no temporary file beside them.
//
// Every file is under a scratch directory of the case's own, asserted inside it before the write.
// What this does NOT cover: the fsync, which no file system call made afterwards can observe.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { writeTextAtomic } from '../../../src/lib/server/core/json.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

/** A path under a scratch directory of this case's own, and that directory. */
function place(name: string): { dir: string; path: string } {
    const dir = scratchDir('oculus-json-');
    const path = join(dir, name);
    expect(resolve(path).startsWith(resolve(dir) + sep)).toBe(true);
    return { dir, path };
}

describe('the folder an atomic write lands in', () => {
    it('is left as it was, the old content with it, by a write under a file', () => {
        const { dir, path } = place('plain.txt');
        writeFileSync(path, 'old');
        const before = readdirSync(dir).sort();
        expect(() => writeTextAtomic(join(path, 'child.txt'), 'new')).toThrow();
        expect(readFileSync(path, 'utf8')).toBe('old');
        expect(readdirSync(dir).sort()).toEqual(before);
    });
});
