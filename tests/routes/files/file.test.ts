// Layer 2, route tests. What the /api/file route serves: one file under one of the configured
// roots. The route itself is a single line handing the request to lib/server/files/files.ts with
// the roots of config/sources.yml, which is what this calls: serveFile takes the roots to look in,
// a root's key and a path.
//
// Every root here is synthetic, under the system temporary directory, and every path written is
// asserted to be inside it first. What this does NOT cover: the browser painting the document in
// its iframe, and the roots read from the machine's own config/sources.yml, which
// tests/checks/config/config.test.ts reads.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve, sep } from 'node:path';
import { describe, expect } from 'vitest';
import { serveFile } from '../../../src/lib/server/files/files.ts';
import type { Root } from '../../../src/lib/server/files/files.ts';
import { it, scratchDir } from '../../fixtures/scratch.ts';

const PAGE = '<!doctype html><title>manual</title><link rel=stylesheet href=css/manual.css>\n';

const SHEET = 'body { margin: 0; }\n';

/** A directory under the temporary directory, with a file written at each of the paths named. */
function folder(files: Record<string, string>): string {
    const dir = scratchDir('oculus-file-');
    for (const [name, body] of Object.entries(files)) {
        const full = join(dir, name);
        expect(resolve(full).startsWith(resolve(dir) + sep)).toBe(true);
        mkdirSync(join(full, '..'), { recursive: true });
        writeFileSync(full, body);
    }
    return dir;
}

/** One root holding a manual and its stylesheet, under `docs/user`. */
function manual(): Root[] {
    return [
        {
            key: 'docs',
            dir: folder({
                'docs/user/manual.html': PAGE,
                'docs/user/css/manual.css': SHEET
            })
        }
    ];
}

describe('serving a file under a root', () => {
    it.each([['a path that climbs out of the root', manual, 'docs', '../../etc/passwd']])(
        'has nothing for %s',
        (_row, roots, key, path) => {
            expect(serveFile(roots(), key, path).status).toBe(404);
        }
    );
});
