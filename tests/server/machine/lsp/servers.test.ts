// Layer 4, server test. How the language servers and the interpreter probe are started: each
// command is an argument array and the root's path is one argument (or one working folder) whatever
// characters it holds, and nothing passes through a shell.

import { existsSync, mkdirSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect } from 'vitest';
import { it, scratchDir } from '../../../fixtures/scratch.ts';
import { interpretersFor } from '../../../../src/lib/server/machine/lsp/pyright/interpreter.ts';
import { createServers, ownFolder } from '../../../../src/lib/server/machine/lsp/servers.ts';
import { makeRelay, open, pageFile, settle, stubSpawn } from './lsp-fixture.ts';

/** A folder name every shell would treat as more than one word, or as code. */
const AWKWARD = `my repo; touch pwned $(id) \`id\` 'q' "d" & | > <`;

function awkwardRoot(files: string[]): string {
    const dir = join(realpathSync(scratchDir('oculus-argv-')), AWKWARD);
    for (const file of files) {
        mkdirSync(join(dir, file, '..'), { recursive: true });
        writeFileSync(join(dir, file), 'x = 1\n');
    }
    return dir;
}

type Row = { name: string; steps: () => Promise<void> | void };

const ROWS: Row[] = [
    {
        name: 'starts each server and the interpreter probe with an argument array, the root path one argument whatever it holds',
        steps: async () => {
            const dir = awkwardRoot(['a.py', 'x.c', '.venv/bin/python']);
            const spawned = stubSpawn();
            const probes: { command: string; args: string[] }[] = [];
            const relay = makeRelay({
                roots: () => [{ key: 'repo', dir }],
                spawn: spawned.spawn,
                run: (command, args) => {
                    probes.push({ command, args });
                    return Promise.resolve(null);
                },
                exists: (path) => path === join(dir, '.venv', 'bin', 'python')
            });
            const page = { send: () => Promise.resolve(), close: () => undefined };
            open(relay, page, 'lsp:python', pageFile('repo', 'a.py'), 'python');
            open(relay, page, 'lsp:c', pageFile('repo', 'x.c'), 'c');
            // The venv's own interpreter is asked only once approved, so the one probe made is the
            // PATH's, by name; a typed or approved path is a single program argument as well.
            for (let turn = 0; turn < 30 && spawned.calls.length < 2; turn += 1) await settle();
            expect(spawned.calls.map((call) => call.command).sort()).toEqual(['/node', 'clangd']);
            for (const call of spawned.calls) {
                expect(Array.isArray(call.args)).toBe(true);
                expect(call.cwd).toBe(dir);
                expect(call.args.some((one) => one.includes(AWKWARD))).toBe(false);
            }
            expect(probes.every((one) => Array.isArray(one.args))).toBe(true);
            await relay.close();
        }
    },
    {
        name: "finds pyright under oculus's own folder, whatever folder the engine is",
        steps: () => {
            expect(
                existsSync(join(ownFolder(), 'node_modules', 'pyright', 'langserver.index.js'))
            ).toBe(true);
            expect(existsSync(join(ownFolder(), 'src', 'server.ts'))).toBe(true);
        }
    },
    {
        name: 'gives pyright its script and clangd its database folder as single arguments',
        steps: () => {
            const servers = createServers({
                oculus: '/oculus dir',
                node: '/a node',
                exists: () => true
            });
            const setup = {
                root: AWKWARD,
                interpreter: null,
                interpreterPrefixes: [],
                databaseFolder: `/lsp/${AWKWARD}/build`,
                fallbackFlags: []
            };
            expect(servers.forId('pyright').launch(setup)).toEqual({
                command: '/a node',
                args: ['/oculus dir/node_modules/pyright/langserver.index.js', '--stdio'],
                cwd: AWKWARD,
                program: 'pyright'
            });
            expect(servers.forId('clangd').launch(setup)?.args).toEqual([
                '--header-insertion=never',
                '--background-index',
                `--compile-commands-dir=/lsp/${AWKWARD}/build`
            ]);
        }
    },
    {
        name: 'runs the probe of an interpreter as a program and an argument array, its path one command',
        steps: async () => {
            const dir = awkwardRoot(['.venv/bin/python']);
            const python = join(dir, '.venv', 'bin', 'python');
            const asked: { command: string; args: string[] }[] = [];
            const found = await interpretersFor({
                root: dir,
                approved: () => true,
                exists: (path) => path === python,
                run: (command, args) => {
                    asked.push({ command, args });
                    return Promise.resolve(
                        JSON.stringify([command, [3, 13, 4], dir + '/.venv', '/usr']) + '\n'
                    );
                }
            });
            expect(asked[0].command).toBe(python);
            expect(asked[0].args).toHaveLength(2);
            expect(asked[0].args[0]).toBe('-c');
            expect(asked[0].args.some((one) => one.includes(dir))).toBe(false);
            expect(found.list.map((one) => one.path)).toContain(python);
        }
    }
];

describe('starting a server', () => {
    it.each(ROWS)('$name', async ({ steps }) => {
        await steps();
    });
});
