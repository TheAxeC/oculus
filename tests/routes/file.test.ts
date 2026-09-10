// What the /api/file route serves: one file under one of the configured roots. The route itself is a
// single line handing the request to lib/server/files.ts with the roots of config/sources.yml, which
// is what this calls: serveFile takes a Request, the roots to look in, a root's key and a path.
//
// Every root here is synthetic, under the system temporary directory, and every path written is
// asserted to be inside it first. What this does NOT cover: the browser painting the document in its
// iframe, and roots() reading the machine's own config/sources.yml, which is exercised by the curl in
// the package's verification and by tests/config.test.ts.

import { mkdirSync, mkdtempSync, symlinkSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect, it } from 'vitest';
import { expandHome, readRoots, serveFile, typeOf } from '../../src/lib/server/files.ts';
import type { Root } from '../../src/lib/server/files.ts';

const HOST = '127.0.0.1:8791';

const PAGE = '<!doctype html><title>manual</title><link rel=stylesheet href=css/manual.css>\n';

const SHEET = 'body { margin: 0; }\n';

/** A directory under the temporary directory, with a file written at each of the paths named. */
function folder(files: Record<string, string>): string {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-file-'));
    expect(resolve(dir).startsWith(resolve(tmpdir()) + sep)).toBe(true);
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

/** A request as the page makes it, with whatever headers a case wants instead. */
function request(headers: Record<string, string> = {}): Request {
    return new Request(`http://${HOST}/api/file/docs/docs/user/manual.html`, {
        headers: {
            host: HOST,
            origin: `http://${HOST}`,
            'sec-fetch-site': 'same-origin',
            ...headers
        }
    });
}

describe('the type a name is served as', () => {
    it('names the type of every extension a manual is made of, text with its charset', () => {
        expect(typeOf('manual.html')).toBe('text/html; charset=utf-8');
        expect(typeOf('MANUAL.HTML')).toBe('text/html; charset=utf-8');
        expect(typeOf('a/b/manual.css')).toBe('text/css; charset=utf-8');
        expect(typeOf('search.js')).toBe('text/javascript; charset=utf-8');
        expect(typeOf('notes.md')).toBe('text/markdown; charset=utf-8');
        expect(typeOf('logo.svg')).toBe('image/svg+xml');
        expect(typeOf('body.woff2')).toBe('font/woff2');
    });

    it('falls back to bytes for anything else, an extension-less name included', () => {
        expect(typeOf('archive.tar.gz')).toBe('application/octet-stream');
        expect(typeOf('LICENSE')).toBe('application/octet-stream');
    });
});

describe('serving a file under a root', () => {
    it('serves an html file with its type and a private cache header', async () => {
        const answer = serveFile(request(), manual(), 'docs', 'docs/user/manual.html');
        expect(answer.status).toBe(200);
        expect(answer.headers.get('content-type')).toBe('text/html; charset=utf-8');
        expect(answer.headers.get('cache-control')).toBe('private, max-age=60');
        expect(await answer.text()).toBe(PAGE);
    });

    it('serves the stylesheet the page asks for beside it', async () => {
        const answer = serveFile(request(), manual(), 'docs', 'docs/user/css/manual.css');
        expect(answer.status).toBe(200);
        expect(answer.headers.get('content-type')).toBe('text/css; charset=utf-8');
        expect(await answer.text()).toBe(SHEET);
    });

    it('has nothing for a file that is not there', () => {
        expect(serveFile(request(), manual(), 'docs', 'docs/user/nothing.html').status).toBe(404);
    });

    it('has nothing for a directory, and nothing for the root itself', () => {
        expect(serveFile(request(), manual(), 'docs', 'docs/user').status).toBe(404);
        expect(serveFile(request(), manual(), 'docs', '').status).toBe(404);
    });

    it('has nothing for a path that climbs out of the root', () => {
        const roots = manual();
        expect(serveFile(request(), roots, 'docs', '../../etc/passwd').status).toBe(404);
        expect(serveFile(request(), roots, 'docs', 'docs/../../..').status).toBe(404);
        expect(serveFile(request(), roots, 'docs', '/etc/passwd').status).toBe(404);
    });

    it('has nothing for a symbolic link pointing out of the root', () => {
        const outside = folder({ 'secret.html': 'not yours\n' });
        const dir = folder({ 'docs/user/manual.html': PAGE });
        const link = join(dir, 'docs', 'user', 'escape.html');
        expect(resolve(link).startsWith(resolve(dir) + sep)).toBe(true);
        symlinkSync(join(outside, 'secret.html'), link);
        const roots: Root[] = [{ key: 'docs', dir }];

        expect(serveFile(request(), roots, 'docs', 'docs/user/escape.html').status).toBe(404);
        expect(serveFile(request(), roots, 'docs', 'docs/user/manual.html').status).toBe(200);
    });

    it('has nothing for a root nobody configured, and none for a root that is not there', () => {
        expect(serveFile(request(), manual(), 'elsewhere', 'docs/user/manual.html').status).toBe(
            404
        );
        const gone: Root[] = [{ key: 'docs', dir: join(folder({}), 'moved-away') }];
        expect(serveFile(request(), gone, 'docs', 'docs/user/manual.html').status).toBe(404);
    });

    it('refuses a request from another origin before it looks at anything', () => {
        const foreign = request({
            origin: 'http://elsewhere.example',
            'sec-fetch-site': 'cross-site'
        });
        expect(serveFile(foreign, manual(), 'docs', 'docs/user/manual.html').status).toBe(403);
    });
});

describe('the roots of the configuration', () => {
    const FILE = '/engine/config/sources.yml';

    it('reads a list of key and dir, and reports a dir that is not on this machine', () => {
        const dir = folder({});
        const { roots, findings } = readRoots(
            {
                roots: [
                    { key: 'here', dir },
                    { key: 'gone', dir: join(dir, 'moved-away') }
                ]
            },
            FILE
        );
        expect(roots).toEqual([
            { key: 'here', dir },
            { key: 'gone', dir: join(dir, 'moved-away') }
        ]);
        expect(findings).toEqual([
            {
                file: FILE,
                key: 'gone',
                message: `no directory at ${join(dir, 'moved-away')}; this root serves nothing`
            }
        ]);
    });

    it('reports an entry that is not a pair of strings and a key two entries share', () => {
        const dir = folder({});
        const { roots, findings } = readRoots(
            {
                roots: [
                    'a string',
                    { key: 'here' },
                    { dir },
                    { key: 'here', dir },
                    { key: 'here', dir }
                ]
            },
            FILE
        );
        expect(roots).toEqual([{ key: 'here', dir }]);
        expect(findings.map((one) => one.message)).toEqual([
            'a root is not a map of key and dir',
            'the root names no dir',
            'a root has no key',
            'two roots carry this key'
        ]);
    });

    it('puts the home directory in place of a leading tilde, and refuses a relative dir', () => {
        const { roots, findings } = readRoots(
            {
                roots: [
                    { key: 'home', dir: '~' },
                    { key: 'under', dir: '~/oculus-no-such-dir' },
                    { key: 'near', dir: 'docs/user' }
                ]
            },
            FILE
        );
        expect(roots.map((one) => one.dir)).toEqual([
            homedir(),
            join(homedir(), 'oculus-no-such-dir')
        ]);
        expect(findings.map((one) => `${one.key}: ${one.message}`)).toEqual([
            `under: no directory at ${join(homedir(), 'oculus-no-such-dir')}; this root serves nothing`,
            'near: the dir docs/user is relative; a root is absolute or starts with ~/'
        ]);
        expect(expandHome('/already/absolute')).toBe('/already/absolute');
    });

    it('has nothing to say about a config with no roots, and reports one that is not a list', () => {
        expect(readRoots({}, FILE)).toEqual({ roots: [], findings: [] });
        expect(readRoots({ roots: 'cathedra' }, FILE).findings).toEqual([
            { file: FILE, key: 'roots', message: 'roots is not a list' }
        ]);
    });
});
