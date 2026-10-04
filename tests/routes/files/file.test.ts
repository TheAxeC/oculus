// Layer 2, route tests. What the /api/file route serves: one file under one of the configured
// roots. The route itself is a single line handing the request to lib/server/files/files.ts with
// the roots of config/sources.yml, which is what this calls: serveFile takes the roots to look in,
// a root's key and a path.
//
// Every root here is synthetic, under the system temporary directory, and every path written is
// asserted to be inside it first. What this does NOT cover: the browser painting the document in
// its iframe, and the roots read from the machine's own config/sources.yml, which
// tests/checks/config/config.test.ts reads.

import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, sep } from 'node:path';
import { describe, expect, vi } from 'vitest';
import {
    ENGINE_ROOT,
    HUB_ROOT,
    expandHome,
    readRoots,
    configuredRootsOf,
    rootsFrom,
    serveFile,
    typeOf,
    withFixed
} from '../../../src/lib/server/files/files.ts';
import { loadConfig, loadLocalOrDefaults } from '../../../src/lib/data/sources/config.ts';
import { ENGINE_ROOT as CLIENT_ENGINE_ROOT } from '../../../src/lib/state/sources/fs.ts';
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

describe('the type a name is served as', () => {
    it.each([
        ['a.html', 'text/html; charset=utf-8'],
        ['MANUAL.HTML', 'text/html; charset=utf-8'],
        ['a/b/manual.css', 'text/css; charset=utf-8'],
        ['a.js', 'text/javascript; charset=utf-8'],
        ['module.mjs', 'text/javascript; charset=utf-8'],
        ['a.png', 'image/png'],
        ['a.jpg', 'image/jpeg'],
        ['a.jpeg', 'image/jpeg'],
        ['a.gif', 'image/gif'],
        ['a.svg', 'image/svg+xml'],
        ['a.webp', 'image/webp'],
        ['photo.avif', 'image/avif'],
        ['favicon.ico', 'image/vnd.microsoft.icon'],
        ['a.woff', 'font/woff'],
        ['a.woff2', 'font/woff2'],
        ['a.json', 'application/json; charset=utf-8'],
        ['a.txt', 'text/plain; charset=utf-8'],
        ['a.md', 'text/markdown; charset=utf-8'],
        ['rows.csv', 'text/csv; charset=utf-8'],
        ['a.pdf', 'application/pdf'],
        ['engine.wasm', 'application/wasm'],
        ['archive.tar.gz', 'application/gzip'],
        ['main.ts', 'application/octet-stream'],
        ['main.mts', 'application/octet-stream'],
        ['main.cts', 'application/octet-stream'],
        ['.png', 'application/octet-stream'],
        ['LICENSE', 'application/octet-stream'],
        ['thing.nosuchext', 'application/octet-stream']
    ])('names %s as %s', (name, type) => {
        expect(typeOf(name)).toBe(type);
    });
});

describe('serving a file under a root', () => {
    it('serves an html file with its type and a private cache header', async () => {
        const answer = serveFile(manual(), 'docs', 'docs/user/manual.html');
        expect(answer.status).toBe(200);
        expect(answer.headers.get('content-type')).toBe('text/html; charset=utf-8');
        expect(answer.headers.get('cache-control')).toBe('private, max-age=60');
        expect(await answer.text()).toBe(PAGE);
    });

    /** A root holding the manual and a link beside it that leads out of the root. */
    function linked(): Root[] {
        const outside = folder({ 'secret.html': 'not yours\n' });
        const dir = folder({ 'docs/user/manual.html': PAGE });
        const link = join(dir, 'docs', 'user', 'escape.html');
        expect(resolve(link).startsWith(resolve(dir) + sep)).toBe(true);
        symlinkSync(join(outside, 'secret.html'), link);
        return [{ key: 'docs', dir }];
    }

    it.each([
        ['a file that is not there', manual, 'docs', 'docs/user/nothing.html'],
        ['a directory', manual, 'docs', 'docs/user'],
        ['the root itself', manual, 'docs', ''],
        ['a path that climbs out of the root', manual, 'docs', '../../etc/passwd'],
        ['a path that climbs after descending', manual, 'docs', 'docs/../../..'],
        ['an absolute path', manual, 'docs', '/etc/passwd'],
        ['a symbolic link pointing out of the root', linked, 'docs', 'docs/user/escape.html'],
        ['a root nobody configured', manual, 'elsewhere', 'docs/user/manual.html'],
        [
            'a root that is not there',
            (): Root[] => [{ key: 'docs', dir: join(folder({}), 'moved-away') }],
            'docs',
            'docs/user/manual.html'
        ]
    ])('has nothing for %s', (_row, roots, key, path) => {
        expect(serveFile(roots(), key, path).status).toBe(404);
    });

    it('serves the file beside a link that leads out of the root', () => {
        expect(serveFile(linked(), 'docs', 'docs/user/manual.html').status).toBe(200);
    });
});

describe('the two fixed roots', () => {
    it('serves the hub and the engine config folder in front of the configured roots', () => {
        const found = withFixed([{ key: 'docs', dir: '/elsewhere' }], '/the/hub', '/the/engine');
        expect(found).toEqual([
            { key: 'hub', dir: '/the/hub' },
            { key: 'engine', dir: join('/the/engine', 'config') },
            { key: 'docs', dir: '/elsewhere' }
        ]);
    });

    it('yields to a root the config names hub or engine itself', () => {
        const own = [
            { key: 'hub', dir: '/their/own' },
            { key: ENGINE_ROOT, dir: '/their/config' }
        ];
        expect(withFixed(own, '/the/hub', '/the/engine')).toEqual(own);
    });

    it('reserves both keys against a root a saved workspace added', () => {
        const added = [
            { key: ENGINE_ROOT, dir: '/somewhere/else' },
            { key: 'notes', dir: '/notes' }
        ];
        const found = rootsFrom([], '/the/hub', '/the/engine', added);
        expect(found).toEqual([
            { key: 'hub', dir: '/the/hub' },
            { key: ENGINE_ROOT, dir: join('/the/engine', 'config') },
            { key: 'notes', dir: '/notes' }
        ]);
    });

    it('is the same key on the client, which cannot import the server module', () => {
        expect(CLIENT_ENGINE_ROOT).toBe(ENGINE_ROOT);
    });

    it('serves a file of the engine config folder, the machine own one too, and refuses one above it', () => {
        const engine = folder({
            'config/layout.yml': 'nav_groups: {}\n',
            'config/local.yml': 'hub: /elsewhere\n',
            'local.yml': 'hub: /above\n'
        });
        const list = withFixed([], '/the/hub', engine);
        expect(serveFile(list, ENGINE_ROOT, 'layout.yml').status).toBe(200);
        expect(serveFile(list, ENGINE_ROOT, 'local.yml').status).toBe(200);
        expect(serveFile(list, ENGINE_ROOT, '../local.yml').status).toBe(404);
    });
});

// The roots are built on a request, so a machine file that does not read must not take the request
// with it: the source save that would put the file back is one of those requests.
describe('the roots over a machine file that does not read', () => {
    it('answers the default hub and says once what is wrong, rather than throwing', () => {
        const engine = folder({ 'config/local.yml': 'port: eight\n' });
        const printed = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const built = (): Root[] =>
            rootsFrom(
                configuredRootsOf(loadConfig(engine).config, engine),
                loadLocalOrDefaults(engine).hub,
                engine
            );
        try {
            const list = built();
            const hub = list.find((one) => one.key === HUB_ROOT);
            expect(hub?.dir).toBe(resolve(engine, '..', '..'));
            expect(list.some((one) => one.key === ENGINE_ROOT)).toBe(true);
            expect(printed).toHaveBeenCalledTimes(1);
            expect(String(printed.mock.calls[0][0])).toContain('port must be an integer');
            // The second call over the same file says nothing more and answers the same.
            expect(built().find((one) => one.key === HUB_ROOT)?.dir).toBe(hub?.dir);
            expect(printed).toHaveBeenCalledTimes(1);
        } finally {
            printed.mockRestore();
        }
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

    it('has nothing to say about a config with no roots', () => {
        expect(readRoots({}, FILE)).toEqual({ roots: [], findings: [] });
    });

    it.each([
        ['text', 'cathedra'],
        ['a map', {}]
    ])('reports roots that are %s as not a list, and keeps no root', (_row, value) => {
        expect(readRoots({ roots: value }, FILE)).toStrictEqual({
            roots: [],
            findings: [{ file: FILE, key: 'roots', message: 'roots is not a list' }]
        });
    });
});

describe('the roots of the configuration with entries of the wrong shape', () => {
    const FILE = '/engine/config/sources.yml';

    it('words each entry by the first part of it that fails, in the order of the list', () => {
        const gone = join(folder({}), 'moved-away');
        const { roots, findings } = readRoots(
            {
                roots: [
                    { key: '', dir: 'd' },
                    { key: 'k', dir: 3 },
                    3,
                    [],
                    { key: 'rel', dir: 'rel' },
                    { key: 'dup', dir: gone },
                    { key: 'dup', dir: '/elsewhere' },
                    { dir: '/x' },
                    { key: 4, dir: '/x' },
                    null
                ]
            },
            FILE
        );
        expect(roots).toStrictEqual([{ key: 'dup', dir: gone }]);
        expect(findings.map((one) => [one.key, one.message])).toStrictEqual([
            ['roots', 'a root has no key'],
            ['k', 'the root names no dir'],
            ['roots', 'a root is not a map of key and dir'],
            ['roots', 'a root is not a map of key and dir'],
            ['rel', 'the dir rel is relative; a root is absolute or starts with ~/'],
            ['dup', `no directory at ${gone}; this root serves nothing`],
            ['dup', 'two roots carry this key'],
            ['roots', 'a root has no key'],
            ['roots', 'a root has no key'],
            ['roots', 'a root is not a map of key and dir']
        ]);
    });
});
