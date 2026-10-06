// Layer 2, route tests. What the /api/file route serves: one file under one of the configured
// roots. The route itself is a single line handing the request to lib/server/files/files.ts with
// the roots of config/sources.yml, which is what this calls: serveFile takes the roots to look in,
// a root's key and a path.
//
// Every root here is synthetic, under the system temporary directory, and every path written is
// asserted to be inside it first. What this does NOT cover: the browser painting the document in
// its iframe, and the roots read from the machine's own config/sources.yml, which
// tests/checks/config/config.test.ts reads.

import { mkdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
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

describe('answers a file of an apps folder as plain text with nosniff', () => {
    /** A root holding an app's page, an ordinary page, a sibling folder and a link to the apps. */
    function world(): { roots: Root[]; folders: string[] } {
        const dir = folder({
            '.oculus/apps/notes/index.html': PAGE,
            '.oculus/apps-old/index.html': PAGE,
            'docs/manual.html': PAGE
        });
        symlinkSync(join(dir, '.oculus', 'apps'), join(dir, 'alias'));
        return {
            roots: [{ key: 'hub', dir }],
            folders: [realpathSync(join(dir, '.oculus', 'apps'))]
        };
    }

    it.each([
        [
            'a page of an app',
            '.oculus/apps/notes/index.html',
            'text/plain; charset=utf-8',
            'nosniff'
        ],
        [
            'a page of an app reached through a link to the apps folder',
            'alias/notes/index.html',
            'text/plain; charset=utf-8',
            'nosniff'
        ],
        ['a page outside every apps folder', 'docs/manual.html', 'text/html; charset=utf-8', null],
        [
            'a page of a folder named like the apps folder',
            '.oculus/apps-old/index.html',
            'text/html; charset=utf-8',
            null
        ]
    ])('%s, with the type %s', async (_row, path, type, sniff) => {
        const { roots, folders } = world();
        const response = serveFile(roots, 'hub', path, folders);
        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe(type);
        expect(response.headers.get('x-content-type-options')).toBe(sniff);
        expect(await response.text()).not.toBe('');
    });
});
