// Layer 2, route tests. POST /api/commands: the approval of the chain a run asks for, and the
// writes of the form into the repository's `.oculus/commands.yml`. The handlers are called with a
// scratch repository as the one served root, a scratch home as `HOME`, a write chain and a change
// log in the scratch home, and oculus's own folder for the templates page. A run is started
// through `runCommand` with a tmux double that runs nothing.
//
// What this does NOT cover: the origin rule, which hooks.server.ts applies to every request under
// /api/ ahead of a route seeing it (tests/server/root/hooks-server.test.ts).

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { afterEach, beforeEach, describe, expect } from 'vitest';
import { it } from '../../fixtures/scratch.ts';
import {
    handleCommandsPost,
    type CommandsOptions
} from '../../../src/lib/server/machine/runs/commands/routes.ts';
import { listCommands } from '../../../src/lib/server/machine/runs/commands/list.ts';
import { runCommand } from '../../../src/lib/server/machine/runs/commands/run.ts';
import {
    chainText,
    defaultApprovalsPath,
    isApproved
} from '../../../src/lib/server/machine/approvals/approvals.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import { fileText } from '../../../src/lib/data/sources/documents/templates.ts';
import type { ChangeLog } from '../../../src/lib/server/core/changes.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import { pagePost } from '../../fixtures/doubles.ts';
import { TEXT } from '../../server/text.ts';
import {
    enterHome,
    leaveHome,
    plant,
    plantRepo,
    taskTmux
} from '../../server/machine/runs/commands/commands-fixture.ts';

const TOKEN = 'the write token of this test';
const HOST = 'http://127.0.0.1:8791';
const SIZE = { cols: 80, rows: 24 };

let home = '';
let repo = '';
let log: ChangeLog;

beforeEach(() => {
    home = enterHome();
    repo = plantRepo({}, ['sub']);
    log = { file: join(home, '.oculus', 'changes.jsonl'), keep: 100, writes: fsWrites() };
});

afterEach(() => {
    leaveHome();
});

function mine(): CommandsOptions {
    return {
        rootsFor: () => [repo],
        approvalsFor: () => defaultApprovalsPath(),
        configFor: () => loadConfig(engineDir()).config,
        engineFor: () => engineDir(),
        writes: log.writes,
        changes: log
    };
}

function post(body: unknown, token = TOKEN): Request {
    return pagePost(`${HOST}/api/commands`, body, token);
}

/** POST a body as the form does, with the write token, and answer the status and the body. */
async function send(body: Record<string, unknown>): Promise<{ status: number; error?: string }> {
    const response = await handleCommandsPost(post({ repo, ...body }), TOKEN, mine());
    const read = (await response.json()) as { error?: string };
    return { status: response.status, ...read };
}

/** The repository's `.oculus/commands.yml`. */
function file(): string {
    return join(repo, '.oculus', 'commands.yml');
}

/** Write the repository's commands file by hand. */
function plantCommands(text: string): void {
    plant(repo, '.oculus/commands.yml', text);
}

/** What a press of the file command of that name answers: a terminal, a question or a refusal. */
function press(name: string) {
    return runCommand(repo, name, 'file', {}, SIZE, {
        run: taskTmux(repo).run,
        rootsFor: () => [repo],
        approvalsFor: () => defaultApprovalsPath()
    });
}

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
});

describe('Add Command... over the repository commands file', () => {
    it('makes the file from its template with the entry, a file command that runs without a question', async () => {
        expect(await send({ action: 'save', command: { name: 'build', run: 'make' } })).toEqual({
            status: 200,
            ok: true
        });
        const template = fileText(
            readFileSync(join(engineDir(), 'docs/templates.md'), 'utf8'),
            'commands.yml'
        );
        const text = readFileSync(file(), 'utf8');
        expect(template).not.toBeNull();
        expect(text.startsWith(template ?? '')).toBe(true);
        expect(parse(text)).toEqual({ commands: [{ name: 'build', run: 'make' }] });
        const listed = listCommands(repo).commands.map((one) => [one.name, one.source]);
        expect(listed).toEqual([['build', 'file']]);
        expect(await press('build')).toMatchObject({ terminal: { name: 'build' } });
    });

    it('adds the entry after the last one, with the comment and the first entry bytes unchanged', async () => {
        const before =
            '# The commands of this repository.\ncommands:\n  - name: build   # the default\n    run: make\n';
        plantCommands(before);
        await send({ action: 'save', command: { name: 'test', run: 'make test', cwd: 'sub' } });
        const text = readFileSync(file(), 'utf8');
        expect(text).toBe(`${before}  - name: test\n    run: make test\n    cwd: sub\n`);
    });

    it('approves the chain it shows, the commands it depends on first', async () => {
        plantCommands('commands:\n  - name: build\n    run: make\n');
        await send({
            action: 'save',
            command: { name: 'ship', run: 'deploy', cwd: 'sub', depends_on: ['build'] }
        });
        const lines = [
            { folder: '.', run: 'make' },
            { folder: 'sub', run: 'deploy' }
        ];
        expect(isApproved(defaultApprovalsPath(), chainText(repo, lines))).toBe(true);
        expect(await press('ship')).toMatchObject({ terminal: { name: 'ship' } });
    });

    it('refuses a name the file holds, leaving the file as it was', async () => {
        const before = 'commands:\n  - { name: build, run: make }\n';
        plantCommands(before);
        expect(await send({ action: 'save', command: { name: 'build', run: 'make all' } })).toEqual(
            {
                status: 400,
                error: TEXT['server.commands.held_file'].replace('{0}', 'build')
            }
        );
        expect(readFileSync(file(), 'utf8')).toBe(before);
    });

    it.each([
        {
            title: 'a file that is not YAML',
            text: 'commands:\n  - name: build\n    name: make\n    run: make\n',
            reason: 'is not YAML, at line 3'
        },
        {
            title: 'a commands that is not a list',
            text: 'commands: build\n',
            reason: 'must be a list of commands'
        },
        {
            title: 'a top that is not a map',
            text: '- build\n',
            reason: 'must be a map with a commands list'
        }
    ])('refuses a save over $title with its reason, leaving the file', async ({ text, reason }) => {
        plantCommands(text);
        const answer = await send({ action: 'save', command: { name: 'test', run: 'make test' } });
        expect(answer.status).toBe(409);
        expect(answer.error).toContain(reason);
        expect(readFileSync(file(), 'utf8')).toBe(text);
    });

    it('asks for approval on the next press once the entry run is changed by hand', async () => {
        await send({ action: 'save', command: { name: 'build', run: 'make' } });
        expect(await press('build')).toMatchObject({ terminal: { name: 'build' } });
        writeFileSync(file(), readFileSync(file(), 'utf8').replace('run: make', 'run: make clean'));
        expect(await press('build')).toEqual({ approve: [{ folder: '.', run: 'make clean' }] });
    });
});

describe('Edit and Delete of an entry of the repository commands file', () => {
    const BOTH =
        'commands:\n  - name: build\n    run: make   # the whole tree\n    problemMatcher: $tsc\n  - name: test\n    run: make test\n';

    it('rewrites only the edited entry: its run changes and problemMatcher stays', async () => {
        plantCommands(BOTH);
        const answer = await send({
            action: 'edit',
            was: 'build',
            command: { name: 'build', run: 'make all' }
        });
        expect(answer.status).toBe(200);
        expect(readFileSync(file(), 'utf8')).toBe(BOTH.replace('run: make ', 'run: make all '));
    });

    it('keeps the place of an entry whose name is changed', async () => {
        plantCommands(BOTH);
        await send({ action: 'edit', was: 'build', command: { name: 'compile', run: 'make' } });
        const names = (
            parse(readFileSync(file(), 'utf8')) as { commands: { name: string }[] }
        ).commands.map((one) => one.name);
        expect(names).toEqual(['compile', 'test']);
    });

    it('removes only its entry on Delete', async () => {
        plantCommands(BOTH);
        expect((await send({ action: 'remove', name: 'build' })).status).toBe(200);
        expect(readFileSync(file(), 'utf8')).toBe(
            'commands:\n  - name: test\n    run: make test\n'
        );
    });

    it.each([
        {
            title: 'an edit',
            body: { action: 'edit', was: 'dev', command: { name: 'dev', run: 'npm run dev' } }
        },
        { title: 'a delete', body: { action: 'remove', name: 'dev' } }
    ])('refuses $title of a typed entry, leaving the file', async ({ body }) => {
        const before = 'commands:\n  - { name: dev, type: npm, script: dev }\n';
        plantCommands(before);
        const answer = await send(body);
        expect(answer.status).toBe(404);
        expect(readFileSync(file(), 'utf8')).toBe(before);
    });

    it('writes no file for a Delete in a repository that has none', async () => {
        expect((await send({ action: 'remove', name: 'build' })).status).toBe(404);
        expect(existsSync(file())).toBe(false);
    });
});
