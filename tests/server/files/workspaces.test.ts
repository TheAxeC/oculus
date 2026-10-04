// What lib/server/files/fs.ts does to the workspaces file on a write: a file that is missing is
// written, and a file that is there and does not read is refused and left byte for byte as it was,
// in the sentence the saved commands file refuses a write in.
//
// Every file here is under the system temporary directory and every path written is asserted to be
// inside it first. Nothing reads or writes ~/.oculus.

import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { handleFsWrite, ignoredCache } from '../../../src/lib/server/files/fs.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

const TOKEN = 'a-write-token';

/** A fresh directory under the temporary directory, asserted to be inside it. */
function fresh(): string {
    const dir = scratchDir('oculus-workspaces-');
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    return dir;
}

/** One save-workspace write over the workspaces file `file` in `dir`, with no root of its own. */
async function save(
    dir: string,
    file: string
): Promise<{ status: number; body: Record<string, unknown> }> {
    const host = '127.0.0.1:8791';
    const request = new Request(`http://${host}/api/fs`, {
        method: 'POST',
        headers: {
            host,
            origin: `http://${host}`,
            'content-type': 'application/json',
            'x-oculus-token': TOKEN
        },
        body: JSON.stringify({ action: 'save-workspace', name: 'second' })
    });
    const response = await handleFsWrite(request, TOKEN, {
        file,
        bookmarks: join(dir, 'bookmarks.yml'),
        notes: join(dir, 'notes'),
        fixed: [],
        writes: fsWrites(),
        ignored: ignoredCache()
    });
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

describe('a write over the workspaces file', () => {
    it('writes a missing file and refuses one that does not read, leaving it as is', async () => {
        const home = fresh();
        const missing = join(home, 'workspaces.json');
        const written = await save(home, missing);
        expect(written.status).toBe(200);
        expect(JSON.parse(readFileSync(missing, 'utf8'))).toMatchObject({ current: 'second' });

        const cases: [string | null, string][] = [
            ['{"current": ', 'is not JSON'],
            ['["a", "list"]', 'is not the shape'],
            [null, 'cannot be read']
        ];
        for (const [body, reason] of cases) {
            const dir = fresh();
            const file = join(dir, 'workspaces.json');
            if (body === null) mkdirSync(file);
            else writeFileSync(file, body);
            const refused = await save(dir, file);
            expect(refused.status).toBe(400);
            expect(refused.body).toEqual({ error: `${basename(file)} ${reason}: ${file}` });
            if (body === null) expect(statSync(file).isDirectory()).toBe(true);
            else expect(readFileSync(file, 'utf8')).toBe(body);
        }
    });
});
