// Layer 2, server test. The watch the portfolio watcher keeps on one file of its own, the career
// file (server/root/watch/portfolio.ts, `watchFile`), against a real folder under the system
// temporary directory: a write through server/core/json.ts renames a new file over the old one,
// and every such write, not only the first, has to reach the watcher.

import { rmSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import { writeTextAtomic } from '../../../../src/lib/server/core/json.ts';
import { watchFile } from '../../../../src/lib/server/root/watch/portfolio.ts';
import type { FSWatcher } from 'node:fs';
import { until } from './probe.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

const open: FSWatcher[] = [];
const made: string[] = [];

afterEach(() => {
    while (open.length > 0) open.pop()?.close();
    for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('the watch on one file', () => {
    it('sees two atomic writes in a row, each rename over the file', async () => {
        const dir = scratchDir('oculus-file-watch-');
        made.push(dir);
        const file = join(dir, 'career.yml');
        expect(resolve(file).startsWith(resolve(dir) + sep)).toBe(true);
        writeTextAtomic(file, 'title: one\n');
        let seen = 0;
        open.push(watchFile(file, () => (seen += 1)));
        writeTextAtomic(file, 'title: two\n');
        await until(() => seen > 0, 2000);
        const first = seen;
        writeTextAtomic(file, 'title: three\n');
        await until(() => seen > first, 2000);
        expect(seen).toBeGreaterThan(first);
    });
});
