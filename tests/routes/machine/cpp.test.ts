// Layer 2, route tests. GET and POST /api/cpp (server/machine/lsp/adapters/clangd/cpp-write.ts),
// the form of a repository's `.oculus/cpp.yml` that the compile database list opens. The handlers
// are called with a scratch repository as the one served root and a writer with a change log of
// its own; a write is read back as History lists it and taken back by the undo of the Files view,
// and the file is read again by the reader clangd is started from (cpp-file.ts).
//
// What this does NOT cover: the palette rows that open the form, and the restart of clangd when
// the configuration in force is written, which the relay does on the choice the rows send.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { parse } from 'yaml';
import { it } from '../../fixtures/scratch.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import {
    handleCppGet,
    handleCppPost,
    type CppRouteOptions
} from '../../../src/lib/server/machine/lsp/adapters/clangd/cpp-write.ts';
import { readCppFile } from '../../../src/lib/server/machine/lsp/adapters/clangd/cpp-file.ts';
import { pagePost } from '../../fixtures/doubles.ts';
import {
    enterHome,
    leaveHome,
    plantRepo
} from '../../server/machine/runs/commands/commands-fixture.ts';
import { WriteLog } from '../write-log.ts';

const TOKEN = 'the write token of this test';
const HOST = 'http://127.0.0.1:8791';

/** A file with a comment, a configuration that reads and one with two findings. */
const FILE =
    '# the builds of this repository\nconfigurations:\n    - name: debug-out\n      compile_commands: out\n    - name: broken # mended below\n      compile_commands: nowhere\n      compiler: cc\n';

let repo = '';
const log = new WriteLog('repo', () => repo);

beforeEach(() => {
    enterHome();
    log.start('oculus-cpp-writes-');
    repo = plantRepo({ 'out/compile_commands.json': '[]\n', '.oculus/cpp.yml': FILE }, []);
    mkdirSync(join(repo, 'build', 'debug'), { recursive: true });
    writeFileSync(join(repo, 'build', 'debug', 'compile_commands.json'), '[]\n');
});

afterEach(() => {
    leaveHome();
});

function mine(): CppRouteOptions {
    return {
        rootsFor: () => [repo],
        configFor: () => loadConfig(engineDir()).config,
        files: () => log.writer()
    };
}

const cppFile = (): string => join(repo, '.oculus', 'cpp.yml');

async function post(body: unknown): Promise<{ status: number; body: unknown }> {
    const response = await handleCppPost(pagePost(`${HOST}/api/cpp`, body, TOKEN), TOKEN, mine());
    return { status: response.status, body: await response.json() };
}

/** The entry at `at` as the form was filled from it. */
function entryAt(at: number): unknown {
    const read = parse(readFileSync(cppFile(), 'utf8')) as { configurations: unknown[] };
    return read.configurations[at];
}

describe('the form of .oculus/cpp.yml', () => {
    it('answers the fields cpp-schema.yml gives a configuration and every entry, one that does not read included', async () => {
        const response = handleCppGet(
            new Request(`${HOST}/api/cpp?repo=${encodeURIComponent(repo)}`),
            mine()
        );
        const form = (await response.json()) as {
            fields: { field: string; type: string }[];
            entries: unknown[];
        };
        expect([
            response.status,
            form.fields.map((one) => [one.field, one.type]),
            form.entries
        ]).toEqual([
            200,
            [
                ['name', 'text'],
                ['compile_commands', 'text'],
                ['fallback_flags', 'tags']
            ],
            [
                { name: 'debug-out', compile_commands: 'out' },
                { name: 'broken', compile_commands: 'nowhere', compiler: 'cc' }
            ]
        ]);
    });

    it('writes a mended configuration in its place with the comments kept, its findings gone, listed and undone', async () => {
        const before = readCppFile(repo, ['build/debug']).findings.map((one) => one.field);
        const mended = {
            name: 'mended',
            compile_commands: 'out',
            fallback_flags: ['-Iinclude'],
            compiler: null
        };
        const answered = await post({ repo, at: 1, was: entryAt(1), changes: mended });
        const text = readFileSync(cppFile(), 'utf8');
        const after = readCppFile(repo, ['build/debug']);
        const listed = log.listed().map((one) => one.field);
        await log.undoNewest();
        expect(before).toEqual([
            'configurations[1].compiler',
            'configurations[1].compile_commands'
        ]);
        expect([answered.status, answered.body, listed]).toEqual([
            200,
            { line: 5 },
            ['edit-configuration']
        ]);
        expect([after.findings, after.configurations.map((one) => one.name)]).toEqual([
            [],
            ['debug-out', 'mended']
        ]);
        expect([text.includes('# the builds'), text.includes('# mended below')]).toEqual([
            true,
            true
        ]);
        expect(readFileSync(cppFile(), 'utf8')).toBe(FILE);
    });

    it('adds a configuration at the end and deletes one, each listed under its own word', async () => {
        const added = await post({
            repo,
            at: null,
            changes: { name: 'flags-only', fallback_flags: ['-std=c++20'] }
        });
        const deleted = await post({ repo, at: 0, was: entryAt(0), changes: null });
        const read = parse(readFileSync(cppFile(), 'utf8')) as {
            configurations: { name: string }[];
        };
        expect([added.status, deleted.status]).toEqual([200, 200]);
        expect(read.configurations.map((one) => one.name)).toEqual(['broken', 'flags-only']);
        expect(log.listed().map((one) => one.field)).toEqual([
            'delete-configuration',
            'add-configuration'
        ]);
    });

    it('refuses a fault the reader would find, a name another entry or a found database holds, and an entry changed since it was read', async () => {
        const fault = await post({
            repo,
            at: 0,
            was: entryAt(0),
            changes: { compile_commands: 'nowhere' }
        });
        const repeated = await post({ repo, at: null, changes: { name: 'debug-out' } });
        const found = await post({ repo, at: null, changes: { name: 'build/debug' } });
        const unnamed = await post({ repo, at: null, changes: { compile_commands: 'out' } });
        const stale = await post({
            repo,
            at: 0,
            was: { name: 'debug-out', compile_commands: 'elsewhere' },
            changes: { name: 'renamed' }
        });
        expect([fault, repeated, found, unnamed, stale].map((one) => one.status)).toEqual([
            400, 400, 400, 400, 400
        ]);
        expect((fault.body as { error: string }).error).toContain(
            'compile_commands must be a folder of the repository that exists'
        );
        expect([readFileSync(cppFile(), 'utf8'), log.listed()]).toEqual([FILE, []]);
    });

    it('refuses a POST without the token and one naming a folder outside the workspace, writing nothing (G1, G2)', async () => {
        const body = { repo, at: 0, was: entryAt(0), changes: { name: 'renamed' } };
        const untokened = await handleCppPost(pagePost(`${HOST}/api/cpp`, body, ''), TOKEN, mine());
        const outside = plantRepo({ '.oculus/cpp.yml': FILE }, []);
        const elsewhere = await post({ ...body, repo: outside });
        expect([untokened.status, elsewhere.status]).toEqual([403, 400]);
        expect([readFileSync(cppFile(), 'utf8'), log.listed()]).toEqual([FILE, []]);
        expect(readFileSync(join(outside, '.oculus', 'cpp.yml'), 'utf8')).toBe(FILE);
    });
});
