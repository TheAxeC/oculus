// Layer 2, server test. What the Markdown entry gives its server and shows the page, G2 and G3: the
// handlers of the requests the Markdown server makes of its client (adapters/markdown/requests.ts)
// refuse the machine's `local.yml`, every file under the hub's `secrets` folder or `~/.oculus`, and
// every path outside the server's root or through a link out of it; the lists they answer hold
// none of them; the entry's `refuses` is true for a Markdown file under `secrets`; a change on disk
// of a file under `secrets` or `node_modules` is not told to the server; and the entry's
// diagnostics hook drops a mark whose path lies outside the root or in `secrets`. No server
// process runs: each handler is called as the relay calls it, over a scratch hub, a scratch engine
// config folder and a scratch home folder that `os.homedir` answers through `HOME`.
//
// What this does NOT cover: that the letter case `SECRETS` is refused by the disk's own folding
// (on a case-sensitive disk that path names no file, so the read is refused for being absent), and
// the answers of the real server, which the relay's wire tests do not start.

import { mkdirSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterAll, beforeAll, describe, expect } from 'vitest';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';
import { markdownDiagnostics } from '../../../../../src/lib/server/machine/lsp/adapters/markdown/diagnostics.ts';
import { markdownRequests } from '../../../../../src/lib/server/machine/lsp/adapters/markdown/requests.ts';
import {
    createServers,
    type DiagnosticView,
    type ServerAsk
} from '../../../../../src/lib/server/machine/lsp/servers.ts';
import { servedRoots } from '../../../../../src/lib/server/machine/lsp/uris.ts';
import { entryFiles } from '../../../../../src/lib/server/machine/lsp/held/watch.ts';
import { TEXT } from '../../../text.ts';
import { shippedLatex } from '../lsp-fixture.ts';

/** The `HOME` the run had, which `os.homedir` answers first, put back after the file. */
const realHome = process.env.HOME;

type World = {
    /** Every served root: `hub`, `engine` and `home`. */
    roots: ReturnType<typeof servedRoots>;
    /** The hub's root, the engine's config root and the home folder's root. */
    hub: string;
    engine: string;
    home: string;
    /** `outside.md`, beside the hub folder. */
    outside: string;
};

let planted: World;

afterAll(() => {
    if (realHome === undefined) delete process.env.HOME;
    else process.env.HOME = realHome;
});

beforeAll(() => {
    const base = realpathSync(scratchDir('oculus-md-requests-'));
    const hub = join(base, 'hub');
    const engine = join(base, 'engine');
    const home = join(base, 'home');
    process.env.HOME = home;
    const put = (path: string, text: string): void => {
        mkdirSync(join(path, '..'), { recursive: true });
        writeFileSync(path, text);
    };
    put(join(hub, 'README.md'), '# R\n');
    put(join(hub, 'docs', 'DATA.md'), '# D\n');
    put(join(hub, 'secrets', 'key.md'), '# key\n');
    put(join(engine, 'local.yml'), 'a: 1\n');
    put(join(engine, 'other.md'), '# o\n');
    put(join(home, '.oculus', 'state.md'), '# s\n');
    put(join(home, 'visible.md'), '# v\n');
    put(join(base, 'outside.md'), '# out\n');
    symlinkSync(join(base, 'outside.md'), join(hub, 'leak.md'));
    planted = {
        roots: servedRoots([
            { key: 'hub', dir: hub },
            { key: 'engine', dir: engine },
            { key: 'home', dir: home }
        ]),
        hub: realpathSync(hub),
        engine: realpathSync(engine),
        home: realpathSync(home),
        outside: join(realpathSync(base), 'outside.md')
    };
});

/** What a handler is given: the root of the server and every served root. */
function askOf(key: 'hub' | 'engine' | 'home'): ServerAsk {
    const root = planted.roots.find((one) => one.key === key);
    if (root === undefined) throw new Error('the root is not planted');
    return {
        root,
        roots: planted.roots,
        schemas: {} as ServerAsk['schemas'],
        follow: () => {
            throw new Error('a path outside the rules was followed');
        },
        unfollow: () => undefined
    };
}

const HANDLERS = markdownRequests(() => ['md', 'yml']);

/** Call a handler as the relay does: what it resolves to, or the text it was refused with. */
async function call(
    method: string,
    params: unknown,
    key: 'hub' | 'engine' | 'home' = 'hub'
): Promise<unknown> {
    try {
        return await HANDLERS[method](params, askOf(key));
    } catch (error) {
        return `refused: ${(error as Error).message.slice(0, 40)}`;
    }
}

const REFUSED: unknown = expect.stringMatching(/^refused: /);

describe('the Markdown server may not be given the machine or the outside', () => {
    describe('readFile', () => {
        it.each([
            ['a file under secrets', () => join(planted.hub, 'secrets', 'key.md'), 'hub'],
            ['a file under SECRETS', () => join(planted.hub, 'SECRETS', 'key.md'), 'hub'],
            ['a file under ~/.oculus', () => join(planted.home, '.oculus', 'state.md'), 'home'],
            ['the engine root local.yml', () => join(planted.engine, 'local.yml'), 'engine'],
            ['a file beside the root', () => planted.outside, 'hub'],
            ['a link out of the root', () => join(planted.hub, 'leak.md'), 'hub']
        ] as const)('is refused for %s', async (_name, real, key) => {
            expect(
                await call('markdown/fs/readFile', { uri: pathToFileURL(real()).href }, key)
            ).toEqual(REFUSED);
        });

        it('answers the bytes of a file of the root', async () => {
            const bytes = await call('markdown/fs/readFile', {
                uri: pathToFileURL(join(planted.hub, 'README.md')).href
            });
            expect(Buffer.from(bytes as number[]).toString()).toBe('# R\n');
        });

        it('is refused for an address that is not a file address', async () => {
            expect(await call('markdown/fs/readFile', { uri: 'https://x.org/a.md' })).toEqual(
                REFUSED
            );
        });
    });

    describe('stat', () => {
        it.each([
            ['a file under secrets', () => join(planted.hub, 'secrets', 'key.md')],
            ['the secrets folder', () => join(planted.hub, 'secrets')],
            ['a file beside the root', () => planted.outside],
            ['a link out of the root', () => join(planted.hub, 'leak.md')],
            ['the folder above the root', () => join(planted.hub, '..')]
        ])('answers nothing for %s', async (_name, real) => {
            expect(await call('markdown/fs/stat', { uri: pathToFileURL(real()).href })).toBeNull();
        });

        it('answers the kind of a file of the root', async () => {
            expect(
                await call('markdown/fs/stat', {
                    uri: pathToFileURL(join(planted.hub, 'docs')).href
                })
            ).toEqual({ isDirectory: true });
        });
    });

    describe('readDirectory', () => {
        it('is refused for the folder above the root and for secrets', async () => {
            expect(
                await call('markdown/fs/readDirectory', {
                    uri: pathToFileURL(join(planted.hub, '..')).href
                })
            ).toEqual(REFUSED);
            expect(
                await call('markdown/fs/readDirectory', {
                    uri: pathToFileURL(join(planted.hub, 'secrets')).href
                })
            ).toEqual(REFUSED);
        });

        it('lists neither secrets nor the link out of the root', async () => {
            const listed = (await call('markdown/fs/readDirectory', {
                uri: pathToFileURL(planted.hub).href
            })) as [string, unknown][];
            expect(listed.map(([name]) => name).sort()).toEqual(['README.md', 'docs']);
        });

        it('lists no ~/.oculus in the home folder', async () => {
            const listed = (await call(
                'markdown/fs/readDirectory',
                { uri: pathToFileURL(planted.home).href },
                'home'
            )) as [string, unknown][];
            expect(listed.map(([name]) => name)).toEqual(['visible.md']);
        });
    });

    describe('findMarkdownFilesInWorkspace', () => {
        it('lists the files of the root and none under secrets or beside it', async () => {
            const found = (await call('markdown/findMarkdownFilesInWorkspace', {})) as string[];
            expect(found.sort()).toEqual(
                [join(planted.hub, 'README.md'), join(planted.hub, 'docs', 'DATA.md')].map(
                    (real) => pathToFileURL(real).href
                )
            );
        });

        it('lists no local.yml of the engine root when yml is an extension, and no ~/.oculus file', async () => {
            const engine = (await call(
                'markdown/findMarkdownFilesInWorkspace',
                {},
                'engine'
            )) as string[];
            expect(engine.map((one) => one.slice(one.lastIndexOf('/') + 1))).toEqual(['other.md']);
            const home = (await call(
                'markdown/findMarkdownFilesInWorkspace',
                {},
                'home'
            )) as string[];
            expect(home.map((one) => one.slice(one.lastIndexOf('/') + 1))).toEqual(['visible.md']);
        });
    });

    describe('watchers', () => {
        it.each([
            ['a file under secrets', () => join(planted.hub, 'secrets', 'key.md')],
            ['a file beside the root', () => planted.outside]
        ])('are not made for %s', async (_name, real) => {
            expect(
                await call('markdown/fs/watcher/create', {
                    id: 'w1',
                    uri: pathToFileURL(real()).href,
                    watchParentDirs: true
                })
            ).toBeNull();
        });
    });

    describe('the entry', () => {
        const entry = createServers({
            oculus: '/oculus',
            node: '/node',
            exists: () => true,
            latex: () => shippedLatex()
        }).forLanguage('markdown');

        it.each([
            [
                'refuses a Markdown file under secrets',
                () => join(planted.hub, 'secrets', 'key.md'),
                true
            ],
            [
                'refuses a Markdown file under SECRETS',
                () => join(planted.hub, 'SECRETS', 'key.md'),
                true
            ],
            [
                'refuses a Markdown file under ~/.oculus',
                () => join(planted.home, '.oculus', 'state.md'),
                true
            ],
            [
                'does not refuse a Markdown file of the hub',
                () => join(planted.hub, 'README.md'),
                false
            ]
        ])('%s', (_name, real, refused) => {
            expect(entry?.refuses?.(real(), planted.roots)).toBe(refused);
        });

        it.each([
            ['a Markdown file of the hub', join('docs', 'DATA.md'), true],
            ['a Markdown file under secrets', join('secrets', 'key.md'), false],
            ['a Markdown file under node_modules', join('node_modules', 'p', 'README.md'), false],
            ['a file that is not Markdown', join('docs', 'data.csv'), false]
        ])('tells the server a change on disk of %s: %s', (_name, relative, told) => {
            const match = entryFiles(
                entry?.fileEvents?.() ?? [],
                (path) => entry?.refuses?.(join(planted.hub, path), planted.roots) ?? false
            );
            expect(match(relative)).toBe(told);
        });
    });

    describe('the diagnostics hook', () => {
        const mark = (path: string): Record<string, unknown> => ({
            range: { start: { line: 2, character: 7 }, end: { line: 2, character: 19 } },
            severity: 2,
            code: 'link.no-such-file',
            message: `File does not exist at path: ${path}`,
            data: { fsPath: path }
        });

        it('drops a mark whose path lies outside the root or under secrets, and words the others from the root', () => {
            const root = planted.roots[0];
            const view: DiagnosticView = {
                real: join(planted.hub, 'README.md'),
                text: '# R\n',
                root,
                roots: planted.roots,
                catalog: TEXT
            };
            const shown = markdownDiagnostics(
                {
                    uri: 'file:///x',
                    diagnostics: [
                        mark(join(planted.hub, 'docs', 'missing.md')),
                        mark(planted.outside),
                        mark(join(planted.hub, '..', 'gone.md')),
                        mark(join(planted.hub, 'secrets', 'missing.md')),
                        mark(join(planted.home, '.oculus', 'missing.md'))
                    ]
                },
                view
            );
            expect(shown.diagnostics).toEqual([
                expect.objectContaining({ message: 'File does not exist at path: docs/missing.md' })
            ]);
            expect(JSON.stringify(shown)).not.toContain(planted.hub);
        });
    });
});
