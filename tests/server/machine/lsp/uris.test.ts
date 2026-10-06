// Layer 4, server test. The two forms of a document's address (server/machine/lsp/uris.ts): which
// page URIs resolve to a file of a served root and which are refused before anything reaches a
// language server, and which addresses of a message are refused or dropped on the way to a server
// and to the page. One table, a row for each input that gives a different outcome.

import { mkdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect } from 'vitest';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import {
    resolvePageUri,
    servedRoots,
    toPage,
    toServer,
    type Mapper
} from '../../../../src/lib/server/machine/lsp/uris.ts';

/** What a row is run over: the served roots and the real paths of three files. */
type World = {
    roots: ReturnType<typeof servedRoots>;
    mapper: Mapper;
    /** `repo/src/app.py`. */
    app: string;
    /** A file outside every served root. */
    outside: string;
    /** `a.py` of the root `a/../b`. */
    keyed: string;
};

/**
 * A served root `repo` holding `src/app.py`, a root `inner` of its own inside it, a name written
 * decomposed on disk, a name with a space and a hash, a link out, a root whose key holds a slash,
 * and a root whose key is the first part of that key.
 */
function planted(): World {
    const base = realpathSync(scratchDir('oculus-uris-'));
    const repo = join(base, 'repo');
    mkdirSync(join(repo, 'src', 'sub'), { recursive: true });
    writeFileSync(join(repo, 'src', 'app.py'), 'x = 1\n');
    writeFileSync(join(repo, 'src', 'sub', 'inner.py'), 'y = 2\n');
    writeFileSync(join(repo, 'src', 'caf\u00e9.py'), 'z = 3\n');
    writeFileSync(join(repo, 'src', 'a b#c.py'), 'w = 4\n');
    const outside = join(base, 'outside.py');
    writeFileSync(outside, 'secret = 1\n');
    symlinkSync(outside, join(repo, 'src', 'leak.py'));
    symlinkSync(base, join(repo, 'src', 'up'));
    const keyedDir = join(base, 'keyed');
    mkdirSync(keyedDir);
    writeFileSync(join(keyedDir, 'a.py'), 'v = 5\n');
    const otherDir = join(base, 'other');
    mkdirSync(otherDir);
    const roots = servedRoots([
        { key: 'repo', dir: repo },
        { key: 'inner', dir: join(repo, 'src', 'sub') },
        { key: 'a/../b', dir: keyedDir },
        { key: 'a', dir: otherDir }
    ]);
    return {
        roots,
        mapper: { roots, opened: () => undefined, alias: (root) => root.key },
        app: join(roots[0].real, 'src', 'app.py'),
        outside,
        keyed: join(roots[2].real, 'a.py')
    };
}

/** The file and root key a page URI resolves to, or null when it is refused. */
function resolved(uri: unknown, world: World): [string, string, string] | null {
    const found = resolvePageUri(uri, world.roots);
    return found === null ? null : [found.real, found.root.key, found.pageRoot];
}

type Row = { name: string; got: (world: World) => unknown; want: (world: World) => unknown };

/** A page URI that is refused. */
const refuses = (name: string, uri: unknown): Row => ({
    name: `is refused for ${name}`,
    got: (world) => resolved(uri, world),
    want: () => null
});

const ROWS: Row[] = [
    refuses('an empty root key', 'oculus-file:////src/app.py'),
    refuses('a root key the server does not serve', 'oculus-file:///other/src/app.py'),
    refuses('an absolute path as a file URI', 'file:///etc/passwd'),
    refuses('a path with a dot dot part', 'oculus-file:///repo/src/../../outside.py'),
    refuses(
        'a path with an encoded slash and dot dot',
        'oculus-file:///repo/src%2F..%2F..%2Foutside.py'
    ),
    refuses('a path with an encoded dot dot part', 'oculus-file:///repo/%2E%2E/outside.py'),
    refuses('a path with a doubled slash', 'oculus-file:///repo/src//app.py'),
    refuses('a path holding a backslash', 'oculus-file:///repo/src%5Capp.py'),
    refuses('a path holding a NUL', 'oculus-file:///repo/src%00app.py'),
    refuses('a root alone', 'oculus-file:///repo'),
    refuses('a file that does not exist', 'oculus-file:///repo/src/missing.py'),
    refuses('a link to a file outside the root', 'oculus-file:///repo/src/leak.py'),
    refuses('a link through a folder outside the root', 'oculus-file:///repo/src/up/outside.py'),
    refuses('a text that is not a URI at all', 'not a uri'),
    refuses('a value that is not text', 42),
    refuses('no value', undefined),
    refuses(
        'a root key written once where it holds a slash, as a part of the path',
        'oculus-file:///a/b/../a.py'
    ),
    {
        name: 'resolves to the real file of the root it names',
        got: (world) => resolved('oculus-file:///repo/src/app.py', world),
        want: (world) => [world.app, 'repo', 'repo']
    },
    {
        name: 'belongs to the innermost served root whatever key the tab used',
        got: (world) => resolved('oculus-file:///repo/src/sub/inner.py', world),
        want: (world) => [join(world.roots[1].real, 'inner.py'), 'inner', 'repo']
    },
    {
        name: 'resolves a name written decomposed to the file written composed on disk',
        got: (world) => resolved('oculus-file:///repo/src/cafe%CC%81.py', world)?.[1],
        want: () => 'repo'
    },
    {
        name: 'is written with every part percent-encoded and resolves back to the file',
        got: (world) => {
            const real = join(world.roots[0].real, 'src', 'a b#c.py');
            const written = toPage(pathToFileURL(real).href, world.mapper)?.value;
            return [written, resolved(written, world)?.[0] === real];
        },
        want: () => ['oculus-file:///repo/src/a%20b%23c.py', true]
    },
    {
        name: 'is written with a root key that holds a slash percent-encoded twice and resolves to the root of that key',
        got: (world) => {
            const written = toPage(pathToFileURL(world.keyed).href, world.mapper)?.value;
            return [written, resolved(written, world)];
        },
        want: (world) => ['oculus-file:///a%252F..%252Fb/a.py', [world.keyed, 'a/../b', 'a/../b']]
    },
    {
        name: 'refuses the whole message to a server when one address does not resolve',
        got: (world) => [
            toServer({ changes: { 'oculus-file:///repo/src/../x.py': [] } }, world.roots),
            toServer({ textDocument: { uri: 'file:///etc/passwd' } }, world.roots)
        ],
        want: () => [null, null]
    },
    {
        name: 'drops a location outside every served root from an answer',
        got: (world) => [
            toPage(
                [
                    { uri: pathToFileURL(world.outside).href },
                    { uri: pathToFileURL(world.app).href }
                ],
                world.mapper
            )?.value,
            toPage({ uri: pathToFileURL(world.outside).href }, world.mapper),
            toPage(pathToFileURL(world.outside).href, world.mapper)
        ],
        want: () => [[{ uri: 'oculus-file:///repo/src/app.py' }], null, null]
    }
];

describe('a document address', () => {
    it.each(ROWS)('$name', ({ got, want }) => {
        const world = planted();
        expect(got(world)).toEqual(want(world));
    });
});
