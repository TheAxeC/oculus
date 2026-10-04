// Layer 2, route tests. GET and POST /api/commands: the listing of a repository's commands, the
// approval of the chain a run asks for, and the saves and removes of the form, with the names and
// lines a save refuses and the write that is read back. The handlers are called with a scratch
// repository as the one served root, a scratch home, a write chain and a change log in the scratch
// home.
//
// What this does NOT cover: the origin rule, which hooks.server.ts applies to every request under
// /api/ before a route sees it (tests/server/root/hooks-server.test.ts), and the page's store
// (tests/state/sessions/terminal/commands.test.ts).
//
// A case that takes 100 ms or more in a run of its own is tagged slow; the others run in npm test.

import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import { it } from '../../fixtures/scratch.ts';
import {
    handleCommandsGet,
    handleCommandsPost,
    type CommandsOptions
} from '../../../src/lib/server/machine/commands/routes.ts';
import {
    chainText,
    defaultApprovalsPath,
    isApproved
} from '../../../src/lib/server/machine/approvals/approvals.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { readChanges, type ChangeLog } from '../../../src/lib/server/core/changes.ts';
import { fsWrites, writeTextAtomic } from '../../../src/lib/server/core/json.ts';
import { pagePost } from '../../fixtures/doubles.ts';
import {
    commandsYml,
    enterHome,
    leaveHome,
    plant,
    plantRepo
} from '../../server/machine/commands/commands-fixture.ts';

const started = vi.hoisted(() => ({ calls: [] as string[] }));

vi.mock('../../../src/lib/server/core/json.ts', async (original) => {
    const real = await original<typeof import('../../../src/lib/server/core/json.ts')>();
    return { ...real, writeTextAtomic: vi.fn(real.writeTextAtomic) };
});

vi.mock('node:child_process', async (original) => {
    const real = await original<typeof import('node:child_process')>();
    const record =
        <F extends (...args: never[]) => unknown>(name: string, run: F) =>
        (...args: Parameters<F>): ReturnType<F> => {
            started.calls.push(name);
            return run(...args) as ReturnType<F>;
        };
    return {
        ...real,
        spawn: record('spawn', real.spawn),
        spawnSync: record('spawnSync', real.spawnSync),
        execFile: record('execFile', real.execFile),
        execFileSync: record('execFileSync', real.execFileSync),
        exec: record('exec', real.exec),
        fork: record('fork', real.fork)
    };
});

const TOKEN = 'the write token of this test';
const HOST = 'http://127.0.0.1:8791';

let home = '';
let repo = '';
let log: ChangeLog;

beforeEach(() => {
    home = enterHome();
    repo = plantRepo({}, ['sub']);
    plant(repo, '.oculus/commands.yml', commandsYml('  - { name: build, run: make }\n'));
    log = { file: join(home, '.oculus', 'changes.jsonl'), keep: 100, writes: fsWrites() };
    started.calls.length = 0;
});

afterEach(() => {
    leaveHome();
});

function mine(): CommandsOptions {
    return {
        rootsFor: () => [repo],
        approvalsFor: () => defaultApprovalsPath(),
        configFor: () => loadConfig(engineDir()).config,
        writes: log.writes,
        changes: log
    };
}

function get(query: string): Request {
    return new Request(`${HOST}/api/commands${query}`, {
        headers: { 'sec-fetch-site': 'same-origin' }
    });
}

function post(body: unknown, token = TOKEN): Request {
    return pagePost(`${HOST}/api/commands`, body, token);
}

const answer = async (response: Response) => (await response.json()) as Record<string, unknown>;

describe('GET /api/commands', () => {
    it('lists the commands and the findings of a repository', async () => {
        plant(repo, 'package.json', '{ nope');
        const response = handleCommandsGet(get(`?repo=${encodeURIComponent(repo)}`), mine());
        expect(response.status).toBe(200);
        const body = await answer(response);
        expect((body.commands as { name: string }[]).map((one) => one.name)).toEqual(['build']);
        expect((body.findings as { file: string }[]).map((one) => one.file)).toEqual([
            join(repo, 'package.json')
        ]);
    });

    it('answers 400 for a repository that is relative, missing, or under no served root', async () => {
        const outside = plantRepo({});
        plant(outside, '.oculus/commands.yml', commandsYml('  - { name: secret, run: x }\n'));
        for (const query of [
            '',
            `?repo=${encodeURIComponent('relative/path')}`,
            `?repo=${encodeURIComponent(join(repo, 'nowhere'))}`,
            `?repo=${encodeURIComponent(outside)}`,
            `?repo=${encodeURIComponent(repo)}&repo=${encodeURIComponent(outside)}`
        ]) {
            const response = handleCommandsGet(get(query), mine());
            expect(response.status, query).toBe(400);
            const body = await answer(response);
            expect(JSON.stringify(body)).not.toContain('secret');
            expect(body.commands).toBeUndefined();
        }
    });

    it('says a relative repository must be absolute', async () => {
        const response = handleCommandsGet(
            get(`?repo=${encodeURIComponent('relative/path')}`),
            mine()
        );
        expect(await answer(response)).toEqual({ error: 'repo must be an absolute path' });
    });

    it('answers 400 for a folder under a served root that is no repository', () => {
        const response = handleCommandsGet(
            get(`?repo=${encodeURIComponent(join(repo, 'sub'))}`),
            mine()
        );
        expect(response.status).toBe(400);
    });

    it('starts no process for a listing', () => {
        handleCommandsGet(get(`?repo=${encodeURIComponent(repo)}`), mine());
        expect(started.calls).toEqual([]);
    });
});

describe('POST /api/commands', () => {
    it('refuses a request without the write token', async () => {
        const response = await handleCommandsPost(
            post({ action: 'approve', repo, chain: [{ folder: '.', run: 'a' }] }, 'wrong'),
            TOKEN,
            mine()
        );
        expect(response.status).toBe(403);
        expect(
            isApproved(defaultApprovalsPath(), chainText(repo, [{ folder: '.', run: 'a' }]))
        ).toBe(false);
    });

    it('refuses a body that is no action, and an action of the wrong shape, with 400', async () => {
        for (const body of [
            [],
            { action: 'nonsense', repo },
            { action: 'approve', repo },
            { action: 'approve', repo, chain: [5] },
            { action: 'approve', repo, chain: [] },
            { action: 'approve', repo, chain: [{ folder: '.' }] },
            { action: 'save', repo, command: { name: '', run: 'x' } },
            { action: 'save', repo, command: { name: 'a', run: 5 } },
            { action: 'save', repo, command: { name: 'a', run: 'x', cwd: '../up' } },
            { action: 'save', repo, command: { name: 'a', run: 'x', default: 'deploy' } },
            { action: 'remove', repo },
            { action: 'save', repo: 'relative', command: { name: 'a', run: 'x' } },
            { action: 'save', repo: join(repo, 'nowhere'), command: { name: 'a', run: 'x' } }
        ]) {
            const response = await handleCommandsPost(post(body), TOKEN, mine());
            expect(response.status, JSON.stringify(body)).toBe(400);
        }
        expect(statSync(home).isDirectory()).toBe(true);
        expect(() => readFileSync(join(home, '.oculus', 'commands.json'))).toThrow();
    });

    it('approves the chain it is given as one entry, once however often, and starts no process', async () => {
        const chain = [
            { folder: '.', run: 'make' },
            { folder: 'sub', run: 'make test' }
        ];
        for (let again = 0; again < 2; again += 1) {
            const response = await handleCommandsPost(
                post({ action: 'approve', repo, chain }),
                TOKEN,
                mine()
            );
            expect(response.status).toBe(200);
        }
        expect(isApproved(defaultApprovalsPath(), chainText(repo, chain))).toBe(true);
        expect(isApproved(defaultApprovalsPath(), chainText(repo, chain.slice(1)))).toBe(false);
        expect(
            Object.keys(
                (
                    JSON.parse(readFileSync(defaultApprovalsPath(), 'utf8')) as {
                        approved: object;
                    }
                ).approved
            )
        ).toHaveLength(1);
        expect(started.calls).toEqual([]);
    });

    it('answers the reason when the approvals file cannot be written over', async () => {
        plant(home, '.oculus/approvals.json', 'not json');
        const response = await handleCommandsPost(
            post({ action: 'approve', repo, chain: [{ folder: '.', run: 'a' }] }),
            TOKEN,
            mine()
        );
        expect(response.status).toBe(409);
        expect(((await answer(response)).error as string).includes('is not JSON')).toBe(true);
        expect(readFileSync(defaultApprovalsPath(), 'utf8')).toBe('not json');
    });

    it('saves a command for the repository, private, and logs the change', async () => {
        const response = await handleCommandsPost(
            post({
                action: 'save',
                repo,
                command: { name: 'lint', run: 'npm run lint', cwd: 'sub', depends_on: ['build'] }
            }),
            TOKEN,
            mine()
        );
        expect(response.status).toBe(200);
        const file = join(home, '.oculus', 'commands.json');
        expect(statSync(file).mode & 0o777).toBe(0o600);
        expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({
            [repo]: [{ name: 'lint', run: 'npm run lint', cwd: 'sub', depends_on: ['build'] }]
        });
        const rows = readChanges(log);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toMatchObject({ kind: 'commands', undo: 'none', field: 'lint' });
        // The saved command is listed with an absolute folder.
        const listed = await answer(
            handleCommandsGet(get(`?repo=${encodeURIComponent(repo)}`), mine())
        );
        expect(
            (listed.commands as { name: string; cwd: string; source: string }[]).at(-1)
        ).toMatchObject({
            name: 'lint',
            cwd: join(repo, 'sub'),
            source: 'saved'
        });
    });

    it(
        'replaces a saved command of the same name and removes one',
        { tags: ['slow'] },
        async () => {
            const save = (run: string) =>
                handleCommandsPost(
                    post({ action: 'save', repo, command: { name: 'lint', run } }),
                    TOKEN,
                    mine()
                );
            await save('one');
            await save('two');
            const file = join(home, '.oculus', 'commands.json');
            expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({
                [repo]: [{ name: 'lint', run: 'two' }]
            });
            const removed = await handleCommandsPost(
                post({ action: 'remove', repo, name: 'lint' }),
                TOKEN,
                mine()
            );
            expect(removed.status).toBe(200);
            expect(JSON.parse(readFileSync(file, 'utf8'))).toEqual({});
            const missing = await handleCommandsPost(
                post({ action: 'remove', repo, name: 'lint' }),
                TOKEN,
                mine()
            );
            expect(missing.status).toBe(404);
        }
    );

    it('removes one command and leaves the rest of the repository and the other repositories', async () => {
        const file = join(home, '.oculus', 'commands.json');
        const other = '/elsewhere/repo';
        plant(
            home,
            '.oculus/commands.json',
            JSON.stringify({
                [other]: [{ name: 'x', run: 'make x' }],
                [repo]: [
                    { name: 'a', run: 'make a' },
                    { name: 'b', run: 'make b' }
                ]
            })
        );
        const removed = await handleCommandsPost(
            post({ action: 'remove', repo, name: 'a' }),
            TOKEN,
            mine()
        );
        expect(removed.status).toBe(200);
        const after = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
        expect(after).toEqual({
            [other]: [{ name: 'x', run: 'make x' }],
            [repo]: [{ name: 'b', run: 'make b' }]
        });
        expect(Object.keys(after)).toEqual([other, repo]);
    });

    it(
        'keeps every save of requests in flight together, in the order they came',
        { tags: ['slow'] },
        async () => {
            const sent = ['a', 'b', 'c', 'd'].map((name) =>
                handleCommandsPost(
                    post({ action: 'save', repo, command: { name, run: name } }),
                    TOKEN,
                    mine()
                )
            );
            expect((await Promise.all(sent)).map((one) => one.status)).toEqual([
                200, 200, 200, 200
            ]);
            const file = join(home, '.oculus', 'commands.json');
            expect(
                (JSON.parse(readFileSync(file, 'utf8')) as Record<string, { name: string }[]>)[
                    repo
                ].map((one) => one.name)
            ).toEqual(['a', 'b', 'c', 'd']);
        }
    );

    it.each([
        [
            'the repository file already holds',
            (): void => undefined,
            { name: 'build', run: 'make other' },
            'build is already a command in .oculus/commands.yml of this repository, so it cannot be saved under that name'
        ],
        [
            'a command found in the repository holds',
            (): void => plant(repo, 'package.json', JSON.stringify({ scripts: { dev: 'vite' } })),
            { name: 'npm: dev', run: 'vite' },
            'npm: dev is already a command found in this repository, so it cannot be saved under that name'
        ]
    ])('refuses a saved name that %s, writing nothing', async (_row, setup, command, error) => {
        setup();
        const response = await handleCommandsPost(
            post({ action: 'save', repo, command }),
            TOKEN,
            mine()
        );
        expect(response.status).toBe(400);
        expect((await answer(response)).error).toBe(error);
        expect(() => readFileSync(join(home, '.oculus', 'commands.json'))).toThrow();
        expect(readChanges(log)).toEqual([]);
    });

    it(
        'saves a line that writes a placeholder inside quotes, after a backslash or in a comment',
        { tags: ['slow'] },
        async () => {
            for (const run of [
                'echo "${selectedText}"',
                "echo '${file}'",
                'echo \\${selectedText}',
                'make # ${selectedText}'
            ]) {
                const response = await handleCommandsPost(
                    post({ action: 'save', repo, command: { name: 'say', run } }),
                    TOKEN,
                    mine()
                );
                expect(response.status, run).toBe(200);
            }
        }
    );

    it('refuses a save whose read-back is not what was written, answering the reason', async () => {
        const actual = await vi.importActual<typeof import('../../../src/lib/server/core/json.ts')>(
            '../../../src/lib/server/core/json.ts'
        );
        vi.mocked(writeTextAtomic).mockImplementationOnce((path, content, mode) =>
            actual.writeTextAtomic(path, `${content}\n`, mode)
        );
        const response = await handleCommandsPost(
            post({ action: 'save', repo, command: { name: 'lint', run: 'x' } }),
            TOKEN,
            mine()
        );
        expect(response.status).toBe(409);
        expect((await answer(response)).error).toContain(
            'commands.json cannot be written: what was read back is not what was written'
        );
    });

    it('refuses to write over a commands.json that is not the shape, leaving it', async () => {
        plant(home, '.oculus/commands.json', '["not", "a map"]');
        const response = await handleCommandsPost(
            post({ action: 'save', repo, command: { name: 'a', run: 'x' } }),
            TOKEN,
            mine()
        );
        expect(response.status).toBe(409);
        expect(readFileSync(join(home, '.oculus', 'commands.json'), 'utf8')).toBe(
            '["not", "a map"]'
        );
    });
});
