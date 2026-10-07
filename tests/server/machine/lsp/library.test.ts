// Layer 4, server test. The library files of the language server relay (server/machine/lsp/
// library/): which file outside every served root a server's answer may name to a page, what the
// page's `read` of one answers, and what a message about a library address does on its way to a
// server. The relay runs over stub servers; the files are real ones in a scratch folder outside
// the served root. One table, a row for each outcome.

import { mkdirSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, vi } from 'vitest';
import { TEXT_LIMIT } from '../../../../src/lib/data/file-ops.ts';
import type { LibraryRules } from '../../../../src/lib/server/machine/lsp/library/rules.ts';
import type { Relay } from '../../../../src/lib/server/machine/lsp/relay.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import {
    frame,
    makeRelay,
    open,
    pageFile,
    plantRoot,
    recordingSink,
    stubSpawn,
    type Stub
} from './lsp-fixture.ts';

const PYTHON = 'lsp:python';
const CPP = 'lsp:cpp';
const C = 'lsp:c';
const RANGE = { start: { line: 0, character: 0 }, end: { line: 0, character: 1 } };
/** The rules of a machine that closes `secrets` and withholds nothing else. */
const OPEN: LibraryRules = { closed: ['secrets'], withheld: [] };
const LIBRARY_ADDRESS = /^oculus-lib:\/\/\/[0-9a-f-]{36}\/[^/]+$/;

/** What a row runs over: a relay on stub servers, a page, and the files outside its roots. */
type Scene = {
    relay: Relay;
    page: ReturnType<typeof recordingSink>;
    children: Stub[];
    /** The servers started, as the relay asked for them, in the order they were. */
    calls: { cwd: string }[];
    /** The real path of the served root `repo`, and of `other`. */
    repo: string;
    other: string;
    /** A folder outside every served root. */
    outside: string;
    roots: { key: string; dir: string }[];
    /** The request ids the page used. */
    ids: number;
};

/** The `sys.prefix` and `sys.base_prefix` the interpreter of a scene answers. */
type Interpreter = { prefix: string; basePrefix: string };

/** What a scene is made with, each given the folder outside the roots, which it is made first. */
type Making = {
    /** The rules a file is judged by; the rules of `OPEN` by default. */
    rules?: (outside: string) => LibraryRules;
    /** The interpreter pyright runs with; none by default. */
    interpreter?: (outside: string) => Interpreter;
};

/** A relay over a root `repo` and a root `other`, with a folder outside both. */
function sceneOf(making: Making = {}): Scene {
    const repo = plantRoot(['a.py', 'x.c', 'y.cpp']);
    const other = plantRoot(['a.py']);
    const outside = realpathSync(scratchDir('oculus-lsp-library-'));
    const rules = making.rules?.(outside) ?? OPEN;
    const interpreter = making.interpreter?.(outside);
    const spawned = stubSpawn();
    const roots = [
        { key: 'repo', dir: repo },
        { key: 'other', dir: other }
    ];
    const relay = makeRelay({
        roots: () => roots,
        spawn: spawned.spawn,
        library: () => rules,
        run: (command) =>
            Promise.resolve(
                command === 'python3' && interpreter !== undefined
                    ? `${JSON.stringify(['/usr/bin/python3', [3, 13, 4], interpreter.prefix, interpreter.basePrefix])}\n`
                    : null
            )
    });
    return {
        relay,
        page: recordingSink(),
        children: spawned.children,
        calls: spawned.calls,
        repo,
        other,
        outside,
        roots,
        ids: 100
    };
}

/** A file of the folder outside the roots, written with its folders. */
function planted(scene: Scene, path: string, body: string | Buffer = 'def f(): ...\n'): string {
    const full = join(scene.outside, path);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body);
    return full;
}

/** Open a file of a root on its channel and wait until its server holds it; the server. */
async function started(
    scene: Scene,
    channel: string,
    root: string,
    file: string,
    sink = scene.page.sink
): Promise<Stub> {
    const language = channel === PYTHON ? 'python' : channel === C ? 'c' : 'cpp';
    const dir = scene.roots.find((one) => one.key === root)?.dir;
    open(scene.relay, sink, channel, pageFile(root, file), language);
    return vi.waitFor(() => {
        const child = scene.children[scene.calls.findIndex((call) => call.cwd === dir)];
        expect(child.received).toContain('textDocument/didOpen');
        return child;
    });
}

/** What the stub was sent under a method, in order. */
const sentUnder = (child: Stub, method: string): Stub['messages'] =>
    child.messages.filter((message) => message.method === method);

/**
 * Ask a stub server something about a document and have it answer with the given result; the
 * result the page is given.
 */
async function asked(
    scene: Scene,
    child: Stub,
    channel: string,
    method: string,
    params: object,
    result: unknown
): Promise<unknown> {
    const id = (scene.ids += 1);
    const before = sentUnder(child, method).length;
    scene.relay.inbound(scene.page.sink, frame(channel, { jsonrpc: '2.0', id, method, params }));
    await vi.waitFor(() => expect(sentUnder(child, method).length).toBeGreaterThan(before));
    const sent = sentUnder(child, method).at(-1);
    child.say({ jsonrpc: '2.0', id: sent?.id, result });
    await vi.waitFor(() =>
        expect(scene.page.frames.some((one) => one.payload.id === id)).toBe(true)
    );
    return scene.page.frames.find((one) => one.payload.id === id)?.payload.result;
}

/** The `uri` of each location of an answer to a go to definition, in the page's form. */
async function named(
    scene: Scene,
    child: Stub,
    channel: string,
    uri: string,
    files: string[]
): Promise<string[]> {
    const locations = files.map((file) => ({ uri: pathToFileURL(file).href, range: RANGE }));
    const result = await asked(
        scene,
        child,
        channel,
        'textDocument/definition',
        { textDocument: { uri }, position: RANGE.start },
        locations
    );
    return (result as { uri: string }[]).map((one) => one.uri);
}

/** A page's `read`, and the `file` answer it gets. */
async function read(
    scene: Scene,
    message: object,
    channel = PYTHON,
    sink = scene.page
): Promise<Record<string, unknown>> {
    const seen = sink.frames.length;
    scene.relay.inbound(sink.sink, frame(channel, { oculus: 'read', ...message }));
    return vi.waitFor(() => {
        const answer = sink.frames.slice(seen).find((one) => one.payload.oculus === 'file');
        expect(answer).toBeDefined();
        return answer?.payload ?? {};
    });
}

/** A file named by a server of the scene's repo and read through the address it was given. */
async function libraryFile(scene: Scene, file: string): Promise<{ child: Stub; address: string }> {
    const child = await started(scene, PYTHON, 'repo', 'a.py');
    const [address] = await named(scene, child, PYTHON, pageFile('repo', 'a.py'), [file]);
    expect(address).toMatch(LIBRARY_ADDRESS);
    return { child, address };
}

type Row = { name: string; steps: () => Promise<void> };

/** An interpreter in a virtual environment `.venv` of a version manager's `.pyenv/3.13`. */
const IN_VENV: Making = {
    interpreter: (outside) => ({
        prefix: join(outside, '.venv'),
        basePrefix: join(outside, '.pyenv', '3.13')
    })
};

/** An interpreter whose two prefixes are the folder given, in a machine whose home is `home`. */
const PREFIX_AT = (prefix: (outside: string) => string): Making => ({
    rules: (outside) => ({ closed: ['secrets'], withheld: [], home: join(outside, 'home') }),
    interpreter: (outside) => ({ prefix: prefix(outside), basePrefix: prefix(outside) })
});

/** A row that a file of the outside folder is named, or dropped, in an answer. */
function naming(name: string, path: string, making: Making, want: 'address' | 'dropped'): Row {
    return {
        name,
        steps: async () => {
            const scene = sceneOf(making);
            const file = planted(scene, path);
            const child = await started(scene, PYTHON, 'repo', 'a.py');
            const got = await named(scene, child, PYTHON, pageFile('repo', 'a.py'), [file]);
            if (want === 'dropped') expect(got).toEqual([]);
            else {
                expect(got).toHaveLength(1);
                expect(got[0]).toMatch(LIBRARY_ADDRESS);
                expect(got[0]).not.toContain(scene.outside);
            }
        }
    };
}

/** A row that a read answers a refusal code, whatever happened to the file. */
function refused(
    name: string,
    code: string,
    prepare: (scene: Scene, file: string) => void | Promise<void>,
    body: string | Buffer = 'def f(): ...\n'
): Row {
    return {
        name,
        steps: async () => {
            const scene = sceneOf();
            const file = planted(scene, 'lib/os.py', body);
            const { address } = await libraryFile(scene, file);
            await prepare(scene, file);
            const answer = await read(scene, { root: 'repo', uri: address });
            expect(answer).toEqual({ oculus: 'file', root: 'repo', uri: address, code });
        }
    };
}

const ROWS: Row[] = [
    naming(
        'names a file outside every root with an address that holds no path of the machine',
        'lib/os.py',
        {},
        'address'
    ),
    naming('drops a file under a folder that starts with a dot', '.cache/os.py', {}, 'dropped'),
    naming(
        'drops a file under a folder closed_paths names, wherever it lies',
        'deep/secrets/key.py',
        {},
        'dropped'
    ),
    naming(
        'drops every file when closed_paths is missing or is no list',
        'lib/os.py',
        { rules: () => ({ closed: null, withheld: [] }) },
        'dropped'
    ),
    naming(
        'drops a file under the engine config folder',
        'engine/config/local.yml',
        { rules: (outside) => ({ closed: [], withheld: [join(outside, 'engine', 'config')] }) },
        'dropped'
    ),
    naming(
        'drops a file under the machine folder of oculus',
        'home/.oculus/changes.jsonl',
        { rules: (outside) => ({ closed: [], withheld: [join(outside, 'home', '.oculus')] }) },
        'dropped'
    ),
    naming(
        'drops a file under the secrets folder of the hub',
        'hub/secrets/key.py',
        { rules: (outside) => ({ closed: [], withheld: [join(outside, 'hub', 'secrets')] }) },
        'dropped'
    ),
    {
        name: 'gives an address under the root, and no token, to a file under config or secrets inside a served root',
        steps: async () => {
            const scene = sceneOf();
            const child = await started(scene, PYTHON, 'repo', 'a.py');
            const inside = ['config/local.yml', 'secrets/key.py'].map((path) => {
                const full = join(scene.repo, path);
                mkdirSync(join(full, '..'), { recursive: true });
                writeFileSync(full, 'k: 1\n');
                return full;
            });
            const got = await named(scene, child, PYTHON, pageFile('repo', 'a.py'), inside);
            expect(got).toEqual([
                'oculus-file:///repo/config/local.yml',
                'oculus-file:///repo/secrets/key.py'
            ]);
        }
    },
    {
        name: 'names a file under the prefix of the interpreter of pyright although its path holds a dot segment',
        steps: async () => {
            const scene = sceneOf(IN_VENV);
            const file = planted(scene, '.venv/lib/python3.13/site-packages/pkg/mod.py');
            const child = await started(scene, PYTHON, 'repo', 'a.py');
            const [address] = await named(scene, child, PYTHON, pageFile('repo', 'a.py'), [file]);
            expect(address).toMatch(LIBRARY_ADDRESS);
        }
    },
    {
        name: 'names a file under the base prefix of the interpreter of pyright although its path holds a dot segment',
        steps: async () => {
            const scene = sceneOf(IN_VENV);
            const file = planted(scene, '.pyenv/3.13/lib/os.py');
            const child = await started(scene, PYTHON, 'repo', 'a.py');
            const [address] = await named(scene, child, PYTHON, pageFile('repo', 'a.py'), [file]);
            expect(address).toMatch(LIBRARY_ADDRESS);
        }
    },
    {
        name: 'drops a file with a dot segment that is under neither prefix of the interpreter',
        steps: async () => {
            const scene = sceneOf(IN_VENV);
            const file = planted(scene, '.other/lib/mod.py');
            const child = await started(scene, PYTHON, 'repo', 'a.py');
            expect(await named(scene, child, PYTHON, pageFile('repo', 'a.py'), [file])).toEqual([]);
        }
    },
    {
        name: 'drops a file under the interpreter prefix that closed_paths names',
        steps: async () => {
            const scene = sceneOf(IN_VENV);
            const file = planted(scene, '.venv/lib/secrets/mod.py');
            const child = await started(scene, PYTHON, 'repo', 'a.py');
            expect(await named(scene, child, PYTHON, pageFile('repo', 'a.py'), [file])).toEqual([]);
        }
    },
    naming(
        'drops a file under ~/.ssh when the prefix of the interpreter is the home folder',
        'home/.ssh/config',
        PREFIX_AT((outside) => join(outside, 'home')),
        'dropped'
    ),
    naming(
        'drops a file under ~/.ssh when the prefix of the interpreter holds the home folder',
        'home/.ssh/config',
        PREFIX_AT((outside) => outside),
        'dropped'
    ),
    naming(
        'drops a file under ~/.ssh when the prefix of the interpreter is the filesystem root',
        'home/.ssh/config',
        PREFIX_AT(() => '/'),
        'dropped'
    ),
    naming(
        'names a file under a prefix of the interpreter inside the home folder',
        'home/.pyenv/3.13/lib/os.py',
        PREFIX_AT((outside) => join(outside, 'home', '.pyenv', '3.13')),
        'address'
    ),
    {
        name: 'gives clangd no exception for a dot segment, whatever the interpreter prefix',
        steps: async () => {
            const scene = sceneOf(IN_VENV);
            const file = planted(scene, '.venv/include/vector');
            const child = await started(scene, CPP, 'repo', 'y.cpp');
            expect(await named(scene, child, CPP, pageFile('repo', 'y.cpp'), [file])).toEqual([]);
        }
    },
    {
        name: 'gives the same address to a file named twice, and another to the file a second server names',
        steps: async () => {
            const scene = sceneOf();
            const file = planted(scene, 'lib/os.py');
            const first = await started(scene, PYTHON, 'repo', 'a.py');
            const second = await started(scene, PYTHON, 'other', 'a.py');
            const here = pageFile('repo', 'a.py');
            const [one] = await named(scene, first, PYTHON, here, [file]);
            const [again] = await named(scene, first, PYTHON, here, [file]);
            scene.relay.inbound(
                scene.page.sink,
                frame(PYTHON, {
                    jsonrpc: '2.0',
                    method: 'textDocument/didOpen',
                    params: {
                        textDocument: { uri: one, languageId: 'python', version: 1, text: '' }
                    }
                })
            );
            await vi.waitFor(() =>
                expect(sentUnder(first, 'textDocument/didOpen')).toHaveLength(2)
            );
            const [there] = await named(scene, second, PYTHON, pageFile('other', 'a.py'), [file]);
            expect(again).toBe(one);
            expect(there).toMatch(LIBRARY_ADDRESS);
            expect(there).not.toBe(one);
        }
    },
    {
        name: 'reads the text of a file a server named to the page, by the real path stored with the token',
        steps: async () => {
            const scene = sceneOf();
            const file = planted(scene, 'lib/os.py', 'import sys\n');
            const { address } = await libraryFile(scene, file);
            expect(await read(scene, { root: 'repo', uri: address })).toEqual({
                oculus: 'file',
                root: 'repo',
                uri: address,
                text: 'import sys\n'
            });
        }
    },
    {
        name: 'refuses a token no answer gave the page',
        steps: async () => {
            const scene = sceneOf();
            await started(scene, PYTHON, 'repo', 'a.py');
            const uri = 'oculus-lib:///0b9f6e0e-3c6e-4c0e-9f3a-2f6a4d1c7e11/os.py';
            expect(await read(scene, { root: 'repo', uri })).toEqual({
                oculus: 'file',
                root: 'repo',
                uri,
                code: 'unknown'
            });
        }
    },
    {
        name: 'refuses a token another page was given',
        steps: async () => {
            const scene = sceneOf();
            const file = planted(scene, 'lib/os.py');
            const { address } = await libraryFile(scene, file);
            const other = recordingSink();
            await started(scene, PYTHON, 'repo', 'a.py', other.sink);
            const answer = await read(scene, { root: 'repo', uri: address }, PYTHON, other);
            expect(answer.code).toBe('unknown');
            expect(answer).not.toHaveProperty('text');
        }
    },
    {
        name: 'refuses a read whose root is not the root of the token',
        steps: async () => {
            const scene = sceneOf();
            const file = planted(scene, 'lib/os.py');
            const { address } = await libraryFile(scene, file);
            const answer = await read(scene, { root: 'other', uri: address });
            expect(answer.code).toBe('unknown');
        }
    },
    {
        name: 'refuses a read sent on the channel of another language than the token was made on',
        steps: async () => {
            const scene = sceneOf();
            const file = planted(scene, 'include/vector', '// header\n');
            const child = await started(scene, CPP, 'repo', 'y.cpp');
            const [address] = await named(scene, child, CPP, pageFile('repo', 'y.cpp'), [file]);
            expect(await read(scene, { root: 'repo', uri: address }, C)).toMatchObject({
                code: 'unknown'
            });
            expect(await read(scene, { root: 'repo', uri: address }, CPP)).toMatchObject({
                text: '// header\n'
            });
        }
    },
    {
        name: 'answers not_served for a token whose root is no longer served',
        steps: async () => {
            const scene = sceneOf();
            const file = planted(scene, 'lib/os.py');
            const { address } = await libraryFile(scene, file);
            scene.roots.splice(0, 1);
            scene.relay.reconcile();
            expect((await read(scene, { root: 'repo', uri: address })).code).toBe('not_served');
        }
    },
    refused('answers not_file for a file removed since the answer', 'not_file', (_scene, file) =>
        rmSync(file)
    ),
    refused('answers not_file for a path that is a folder now', 'not_file', (_scene, file) => {
        rmSync(file);
        mkdirSync(file);
    }),
    refused(
        'answers moved for a path whose folder is a link to another folder now',
        'moved',
        (scene, file) => {
            const folder = join(file, '..');
            const elsewhere = join(scene.outside, 'elsewhere');
            mkdirSync(elsewhere);
            writeFileSync(join(elsewhere, 'os.py'), 'other = 1\n');
            renameSync(folder, `${folder}-old`);
            symlinkSync(elsewhere, folder);
        }
    ),
    {
        name: 'reads the file a path through a link resolved to when the token was minted, whatever the link points at since',
        steps: async () => {
            const scene = sceneOf();
            const first = join(scene.outside, 'v1');
            const second = join(scene.outside, 'v2');
            mkdirSync(first);
            mkdirSync(second);
            writeFileSync(join(first, 'os.py'), 'first = 1\n');
            writeFileSync(join(second, 'os.py'), 'second = 2\n');
            const link = join(scene.outside, 'current');
            symlinkSync(first, link);
            const { address } = await libraryFile(scene, join(link, 'os.py'));
            rmSync(link);
            symlinkSync(second, link);
            const answer = await read(scene, { root: 'repo', uri: address });
            expect(answer).toEqual({
                oculus: 'file',
                root: 'repo',
                uri: address,
                text: 'first = 1\n'
            });
        }
    },
    refused(
        'answers binary for a file that is not text',
        'binary',
        () => undefined,
        Buffer.from([0x89, 0x50, 0x00, 0x00, 0x01, 0x02, 0x00])
    ),
    refused(
        'answers too_large for a file over the limit of a source tab',
        'too_large',
        () => undefined,
        Buffer.alloc(TEXT_LIMIT + 1, 'a')
    ),
    {
        name: 'drops from a notification the file no answer named to the page, and gives the address of one it holds',
        steps: async () => {
            const scene = sceneOf();
            const held = planted(scene, 'lib/os.py');
            const unnamed = planted(scene, 'lib/sys.py');
            const { child, address } = await libraryFile(scene, held);
            scene.relay.inbound(
                scene.page.sink,
                frame(PYTHON, {
                    jsonrpc: '2.0',
                    method: 'textDocument/didOpen',
                    params: {
                        textDocument: { uri: address, languageId: 'python', version: 1, text: '' }
                    }
                })
            );
            await vi.waitFor(() =>
                expect(sentUnder(child, 'textDocument/didOpen')).toHaveLength(2)
            );
            child.say({
                jsonrpc: '2.0',
                method: 'textDocument/publishDiagnostics',
                params: {
                    uri: pathToFileURL(held).href,
                    diagnostics: [
                        {
                            range: RANGE,
                            message: 'm',
                            relatedInformation: [
                                {
                                    location: { uri: pathToFileURL(unnamed).href, range: RANGE },
                                    message: 'r'
                                }
                            ]
                        }
                    ]
                }
            });
            await vi.waitFor(() =>
                expect(
                    scene.page.frames.some(
                        (one) => one.payload.method === 'textDocument/publishDiagnostics'
                    )
                ).toBe(true)
            );
            const sent = scene.page.frames.find(
                (one) => one.payload.method === 'textDocument/publishDiagnostics'
            )?.payload.params as { uri: string; diagnostics: { relatedInformation: unknown[] }[] };
            expect(sent.uri).toBe(address);
            expect(sent.diagnostics[0].relatedInformation).toEqual([]);
            expect(JSON.stringify(scene.page.frames)).not.toContain(scene.outside);
        }
    },
    {
        name: 'gives an address to a file named in the arguments of a command and in the changes of an edit of an answer',
        steps: async () => {
            const scene = sceneOf();
            const file = planted(scene, 'lib/sys.py');
            const real = pathToFileURL(file).href;
            const child = await started(scene, PYTHON, 'repo', 'a.py');
            const result = (await asked(
                scene,
                child,
                PYTHON,
                'textDocument/codeAction',
                {
                    textDocument: { uri: pageFile('repo', 'a.py') },
                    range: RANGE,
                    context: { diagnostics: [] }
                },
                [
                    { title: 'run', command: { title: 'run', command: 'x', arguments: [real] } },
                    { title: 'edit', edit: { changes: { [real]: [] } } }
                ]
            )) as { command?: { arguments: string[] }; edit?: { changes: object } }[];
            const address = result[0].command?.arguments[0];
            expect(address).toMatch(LIBRARY_ADDRESS);
            expect(Object.keys(result[1].edit?.changes ?? {})).toEqual([address]);
            expect(JSON.stringify(scene.page.frames)).not.toContain('file://');
        }
    },
    {
        name: 'drops an edit a server asks the page to apply that names a file the page was given no address for',
        steps: async () => {
            const scene = sceneOf();
            const unnamed = pathToFileURL(planted(scene, 'lib/sys.py')).href;
            const child = await started(scene, PYTHON, 'repo', 'a.py');
            child.say({
                jsonrpc: '2.0',
                id: 'edit-1',
                method: 'workspace/applyEdit',
                params: { edit: { changes: { [unnamed]: [] } } }
            });
            await vi.waitFor(() =>
                expect(child.messages.some((one) => one.id === 'edit-1' && !one.method)).toBe(true)
            );
            expect(
                child.messages.find((one) => one.id === 'edit-1' && !one.method)?.result
            ).toMatchObject({
                applied: false
            });
            expect(JSON.stringify(scene.page.frames)).not.toContain('applyEdit');
            expect(JSON.stringify(scene.page.frames)).not.toContain('file://');
        }
    },
    {
        name: 'passes an edit a server asks the page to apply that names a file the page holds an address for, under that address',
        steps: async () => {
            const scene = sceneOf();
            const file = planted(scene, 'lib/os.py');
            const { child, address } = await libraryFile(scene, file);
            child.say({
                jsonrpc: '2.0',
                id: 'edit-2',
                method: 'workspace/applyEdit',
                params: { edit: { changes: { [pathToFileURL(file).href]: [] } } }
            });
            await vi.waitFor(() =>
                expect(
                    scene.page.frames.some((one) => one.payload.method === 'workspace/applyEdit')
                ).toBe(true)
            );
            const sent = scene.page.frames.find(
                (one) => one.payload.method === 'workspace/applyEdit'
            )?.payload.params as { edit: { changes: object } };
            expect(Object.keys(sent.edit.changes)).toEqual([address]);
        }
    },
    {
        name: 'gives the server the real address of a library file the page opened and asks about',
        steps: async () => {
            const scene = sceneOf();
            const file = planted(scene, 'lib/os.py');
            const { child, address } = await libraryFile(scene, file);
            const real = pathToFileURL(file).href;
            scene.relay.inbound(
                scene.page.sink,
                frame(PYTHON, {
                    jsonrpc: '2.0',
                    method: 'textDocument/didOpen',
                    params: {
                        textDocument: { uri: address, languageId: 'python', version: 1, text: 'x' }
                    }
                })
            );
            await vi.waitFor(() =>
                expect(sentUnder(child, 'textDocument/didOpen')).toHaveLength(2)
            );
            await asked(
                scene,
                child,
                PYTHON,
                'textDocument/hover',
                { textDocument: { uri: address }, position: RANGE.start },
                null
            );
            expect(sentUnder(child, 'textDocument/didOpen')[1].params).toMatchObject({
                textDocument: { uri: real }
            });
            expect(sentUnder(child, 'textDocument/hover')[0].params).toMatchObject({
                textDocument: { uri: real }
            });
        }
    },
    {
        name: 'refuses a message whole that names a library address the page was not given, and opens no such document',
        steps: async () => {
            const scene = sceneOf();
            const child = await started(scene, PYTHON, 'repo', 'a.py');
            const forged = 'oculus-lib:///0b9f6e0e-3c6e-4c0e-9f3a-2f6a4d1c7e11/os.py';
            scene.relay.inbound(
                scene.page.sink,
                frame(PYTHON, {
                    jsonrpc: '2.0',
                    method: 'textDocument/didOpen',
                    params: {
                        textDocument: { uri: forged, languageId: 'python', version: 1, text: '' }
                    }
                })
            );
            scene.relay.inbound(
                scene.page.sink,
                frame(PYTHON, {
                    jsonrpc: '2.0',
                    id: 9,
                    method: 'workspace/executeCommand',
                    params: {
                        command: 'x',
                        arguments: [pageFile('repo', 'a.py'), forged]
                    }
                })
            );
            await vi.waitFor(() =>
                expect(scene.page.frames.some((one) => one.payload.id === 9)).toBe(true)
            );
            expect(scene.page.frames.find((one) => one.payload.id === 9)?.payload.error).toEqual({
                code: -32602,
                message: 'an address is refused'
            });
            expect(sentUnder(child, 'workspace/executeCommand')).toEqual([]);
            expect(sentUnder(child, 'textDocument/didOpen')).toHaveLength(1);
        }
    }
];

describe('a library file', () => {
    it.each(ROWS)('$name', async ({ steps }) => {
        await steps();
    });
});
