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
    },
    {
        name: 'gives a location outside every served root the library address the mapper has for it, and drops one it has none for',
        got: (world) => [
            toPage(
                [
                    { uri: pathToFileURL(world.outside).href },
                    { uri: pathToFileURL(join(world.outside, '..', 'other.py')).href },
                    { oldUri: pathToFileURL(world.outside).href },
                    {
                        targetUri: pathToFileURL(world.outside).href,
                        targetSelectionRange: { start: { line: 3, character: 4 } }
                    }
                ],
                lending(world)
            )?.value,
            toPage(pathToFileURL(world.outside).href, lending(world))?.value
        ],
        want: () => [
            [
                { uri: LIBRARY },
                { oldUri: LIBRARY },
                { targetUri: LIBRARY, targetSelectionRange: { start: { line: 3, character: 4 } } }
            ],
            LIBRARY
        ]
    },
    {
        name: 'drops a command whose arguments name a file the mapper has no address for, and keeps one whose arguments it can turn',
        got: (world) => {
            const outside = pathToFileURL(world.outside).href;
            const other = pathToFileURL(join(world.outside, '..', 'other.py')).href;
            const commands = [
                { title: 'a', command: { command: 'x', arguments: [other] } },
                { title: 'b', command: { command: 'x', arguments: [outside, null, 3] } }
            ];
            return [toPage(commands, world.mapper)?.value, toPage(commands, lending(world))?.value];
        },
        want: () => [[], [{ title: 'b', command: { command: 'x', arguments: [LIBRARY, null, 3] } }]]
    },
    {
        name: 'drops a workspace edit whose changes name a file the mapper has no address for, and turns the keys of one it can',
        got: (world) => {
            const outside = pathToFileURL(world.outside).href;
            const app = pathToFileURL(world.app).href;
            const edit = { edit: { changes: { [app]: [], [outside]: [] } } };
            return [toPage(edit, world.mapper), toPage(edit, lending(world))?.value];
        },
        want: () => [
            null,
            { edit: { changes: { 'oculus-file:///repo/src/app.py': [], [LIBRARY]: [] } } }
        ]
    },
    {
        name: 'drops a workspace edit whose documentChanges name a file the mapper has no address for, and turns the entries of one it can',
        got: (world) => {
            const outside = pathToFileURL(world.outside).href;
            const app = pathToFileURL(world.app).href;
            const entry = (uri: string) => ({
                textDocument: { uri, version: null },
                edits: [{ range: { start: { line: 0, character: 0 } }, newText: 'x' }]
            });
            const edit = { edit: { documentChanges: [entry(app), entry(outside)] } };
            return [toPage(edit, world.mapper), toPage(edit, lending(world))?.value];
        },
        want: () => [
            null,
            {
                edit: {
                    documentChanges: [
                        expect.objectContaining({
                            textDocument: { uri: 'oculus-file:///repo/src/app.py', version: null }
                        }),
                        expect.objectContaining({ textDocument: { uri: LIBRARY, version: null } })
                    ]
                }
            }
        ]
    },
    {
        name: 'gives a document link to the page with no machine path in any field, takes its note back as the file address, and gives the target of its resolve with its #L fragment',
        got: (world) => {
            const spelled = (real: string, uri: string): Record<string, unknown> => ({
                $mid: 1,
                external: uri,
                fsPath: real,
                path: real,
                scheme: 'file'
            });
            const link = {
                range: { start: { line: 2, character: 7 }, end: { line: 2, character: 19 } },
                data: {
                    kind: 1,
                    href: { kind: 1, path: spelled(world.app, pathToFileURL(world.app).href) },
                    source: { resource: spelled(world.app, pathToFileURL(world.app).href) }
                }
            };
            const shown = toPage([link], world.mapper)?.value;
            const [back] = shown as { data: unknown }[];
            const returned = toServer(back, world.roots)?.value as Record<string, unknown>;
            const resolve = toPage(
                { ...link, target: `${pathToFileURL(world.app).href}#L5,1` },
                world.mapper
            );
            const machine = world.roots[0].real;
            return [
                JSON.stringify(shown).includes(machine),
                returned.data,
                resolve?.value,
                JSON.stringify(resolve).includes(machine)
            ];
        },
        want: (world) => [
            false,
            {
                kind: 1,
                href: {
                    kind: 1,
                    path: {
                        $mid: 1,
                        external: pathToFileURL(world.app).href,
                        fsPath: world.app,
                        path: world.app,
                        scheme: 'file'
                    }
                },
                source: {
                    resource: {
                        $mid: 1,
                        external: pathToFileURL(world.app).href,
                        fsPath: world.app,
                        path: world.app,
                        scheme: 'file'
                    }
                }
            },
            expect.objectContaining({ target: 'oculus-file:///repo/src/app.py#L5,1' }) as unknown,
            false
        ]
    },
    {
        name: 'turns a library address of a message to a server into the file address its resolver gives, and refuses the message when it gives none',
        got: (world) => {
            const real = pathToFileURL(world.outside).href;
            const message = { textDocument: { uri: LIBRARY }, arguments: [LIBRARY] };
            return [
                toServer(message, world.roots, (address) => (address === LIBRARY ? real : null))
                    ?.value,
                toServer(message, world.roots, () => null),
                toServer(message, world.roots)
            ];
        },
        want: (world) => [
            {
                textDocument: { uri: pathToFileURL(world.outside).href },
                arguments: [pathToFileURL(world.outside).href]
            },
            null,
            null
        ]
    }
];

/** The library address the mapper below gives the file outside every root. */
const LIBRARY = 'oculus-lib:///0b9f6e0e-3c6e-4c0e-9f3a-2f6a4d1c7e11/outside.py';

/** The world's mapper, with an address for the one file outside every served root. */
function lending(world: World): Mapper {
    return {
        ...world.mapper,
        library: (real) => (real === world.outside ? LIBRARY : null)
    };
}

describe('a document address', () => {
    it.each(ROWS)('$name', ({ got, want }) => {
        const world = planted();
        expect(got(world)).toEqual(want(world));
    });
});
