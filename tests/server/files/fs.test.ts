// What lib/server/files/fs.ts answers: the entries of one directory under a root.
//
// Every root here is synthetic, under the system temporary directory, and every path written is
// asserted to be inside it first. Nothing reads or writes ~/.oculus.
//
// What this does NOT cover: the route wrapper around these calls, which is
// tests/routes/files/fs.test.ts.

import { mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { listDir } from '../../../src/lib/server/files/fs.ts';
import type { Root } from '../../../src/lib/server/files/files.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

/** A directory under the temporary directory, with a file written at each of the paths named. */
function folder(files: Record<string, string> = {}, dirs: string[] = []): string {
    const dir = scratchDir('oculus-fs-');
    for (const name of dirs) {
        const full = join(dir, name);
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(full, { recursive: true });
    }
    for (const [name, body] of Object.entries(files)) {
        const full = join(dir, name);
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(join(full, '..'), { recursive: true });
        writeFileSync(full, body);
    }
    // The real path: a root stores what realpath gave, and on this platform the temporary
    // directory is reached through a link.
    return realpathSync(dir);
}

function entriesOf(list: Root[], key: string, path: string): string[] {
    const found = listDir(list, key, path);
    return 'entries' in found ? found.entries.map((entry) => entry.name) : [`error:${found.error}`];
}

describe('one directory under a root', () => {
    it('refuses a path that leaves the root, a root nothing names, and a file', () => {
        const dir = folder({ 'a.txt': 'a\n' });
        const list: Root[] = [{ key: 'one', dir }];

        expect(entriesOf(list, 'one', '../..')).toEqual(['error:outside']);
        expect(entriesOf(list, 'other', '')).toEqual(['error:outside']);
        expect(entriesOf(list, 'one', 'a.txt')).toEqual(['error:missing']);
        expect(entriesOf(list, 'one', 'nowhere')).toEqual(['error:missing']);
    });
});
