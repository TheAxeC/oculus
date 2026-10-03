// Layer 4, client-state test. Where the diagnostics of a task terminal come from and which folder
// their paths are read from: the output of a task that ended in a terminal no pane shows, asked of
// the server once from the terminal's captured pane; and the output of a chain, whose commands
// each print a marker (the run's token and their name) before they run, read command by command
// from the chain and the token the terminal's mark carries.
//
// `fetch` is a stub that records each request and answers from the case. What this does NOT cover:
// a mounted grid, which needs a DOM (the cases call `subscribePty` and `note` as the grid does),
// and the capture of a real pane, which tests/server/machine/pty/task.test.ts runs.

import { describe, expect, it, vi } from 'vitest';
import { json, settle } from '../../../fixtures/client.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import type { CommandsAnswer, TerminalJob } from '../../../../src/lib/data/model/index.ts';
import {
    REPO,
    captured,
    freshCase,
    listTasks,
    serveInto,
    servedRoots,
    task
} from './commands-fixture.ts';

setCatalog(textCatalog(loadConfig(engineDir()).config));

const ID = 'a1b2c3-shell';
const FAILED = 'src/a.c:3: error: boom\r\n';

const state = freshCase();

const captures = () => state.asked.filter((call) => call.body?.action === 'capture');

/** A fetch that answers a capture with `output` and records every request. */
function serveCapture(output: string): void {
    serveInto(state.asked, (call) =>
        call.body?.action === 'capture' ? captured(output) : json({})
    );
}

/** A pane that reads the terminal, as the grid does; the call returned lets go of it. */
function reading(id = ID): () => void {
    return state.client.terminals.subscribePty(
        id,
        () => ({ cols: 80, rows: 24 }),
        () => undefined
    );
}

/** A fetch that holds every request until the case lets it go. */
function held(): ((answer: Response) => void)[] {
    const gates: ((answer: Response) => void)[] = [];
    vi.stubGlobal('fetch', (url: string, init?: RequestInit) => {
        const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as never) : null;
        state.asked.push({ url, method: init?.method ?? 'GET', body });
        return new Promise<Response>((land) => gates.push(land));
    });
    return gates;
}

describe('a task that ends in a terminal no pane shows', () => {
    it('asks the server once for the captured output and holds its diagnostics', async () => {
        serveCapture(`${FAILED}done\n`);
        listTasks(state.client, [task({ pid: 7 })], 1);
        await settle();
        expect(captures()).toEqual([]);
        listTasks(state.client, [task({ pid: 7, exit: 1 })], 2);
        await settle();
        expect(captures().map((call) => call.body)).toEqual([{ action: 'capture', id: ID }]);
        expect(state.asked[0].url).toBe('/api/terminal');
        expect(state.client.commands.commandDiagnostics()).toEqual([
            {
                root: REPO,
                file: 'src/a.c',
                line: 3,
                severity: 'error',
                message: 'boom',
                source: 'command:build'
            }
        ]);
    });

    it('reads a last line that has no line break', async () => {
        serveCapture('src/a.c:3: error: last');
        listTasks(state.client, [task({ exit: 2 })]);
        await settle();
        expect(state.client.commands.commandDiagnostics().map((one) => one.message)).toEqual([
            'last'
        ]);
    });

    it('asks once however many lists name the ended run', async () => {
        serveCapture(FAILED);
        for (const version of [1, 2, 3]) listTasks(state.client, [task({ exit: 1 })], version);
        await settle();
        expect(captures()).toHaveLength(1);
    });

    it('asks again for the run a Rerun began, and for no other terminal', async () => {
        serveCapture(FAILED);
        listTasks(
            state.client,
            [task({ pid: 7, exit: 1 }), task({ id: 'd4e5f6-shell', pid: 9 })],
            1
        );
        await settle();
        expect(captures()).toHaveLength(1);
        serveInto(state.asked, (call) =>
            call.body?.action === 'rerun'
                ? json({ ok: true, id: ID })
                : captured('other.c:1: error: second\n')
        );
        await state.client.commands.rerun(ID);
        expect(state.client.commands.commandDiagnostics()).toEqual([]);
        listTasks(state.client, [task({ pid: 7, exit: 1 })], 2);
        await settle();
        expect(captures()).toHaveLength(1);
        listTasks(state.client, [task({ pid: 8, exit: 1 })], 3);
        await settle();
        expect(captures()).toHaveLength(2);
        expect(state.client.commands.commandDiagnostics().map((one) => one.message)).toEqual([
            'second'
        ]);
    });

    it('does not ask for a terminal a pane still reads when it ends, and keeps what it read', async () => {
        serveCapture('other.c:1: error: from the capture\n');
        listTasks(state.client, [task({ pid: 7 })], 1);
        reading();
        state.client.commands.note(ID, FAILED, true);
        listTasks(state.client, [task({ pid: 7, exit: 1 })], 2);
        await settle();
        expect(captures()).toEqual([]);
        expect(state.client.commands.commandDiagnostics().map((one) => one.message)).toEqual([
            'boom'
        ]);
    });

    it('asks once for a terminal whose pane let go before it ended, and reads what came after', async () => {
        serveCapture(`${FAILED}later.c:9: error: printed after\n`);
        listTasks(state.client, [task({ pid: 7 })], 1);
        const off = reading();
        state.client.commands.note(ID, 'partial.c:1: error: before\n', true);
        off();
        listTasks(state.client, [task({ pid: 7, exit: 1 })], 2);
        await settle();
        expect(captures().map((call) => call.body)).toEqual([{ action: 'capture', id: ID }]);
        expect(state.client.commands.commandDiagnostics().map((one) => one.message)).toEqual([
            'boom',
            'printed after'
        ]);
    });

    it('asks for a terminal one of two panes still reads only when both let go', async () => {
        serveCapture(FAILED);
        listTasks(state.client, [task({ pid: 7 })], 1);
        const first = reading();
        const second = reading();
        first();
        listTasks(state.client, [task({ pid: 7, exit: 1 })], 2);
        await settle();
        expect(captures()).toEqual([]);
        second();
        listTasks(state.client, [task({ pid: 8, exit: 1 })], 3);
        await settle();
        expect(captures()).toHaveLength(1);
    });

    it('does not ask for a terminal that is no task or still runs', async () => {
        serveCapture(FAILED);
        listTasks(state.client, [
            task({ task: false, job: null, exit: null }),
            task({ id: 'd4e5f6-shell' })
        ]);
        await settle();
        expect(captures()).toEqual([]);
    });

    it('holds nothing when the terminal left the list while the capture was out', async () => {
        const gates = held();
        listTasks(state.client, [task({ exit: 1 })], 1);
        await settle();
        expect(gates).toHaveLength(1);
        listTasks(state.client, [], 2);
        gates[0](captured(FAILED));
        await settle();
        expect(state.client.commands.commandDiagnostics()).toEqual([]);
    });

    it('holds nothing of a capture whose line was started again while it was out', async () => {
        const gates = held();
        listTasks(state.client, [task({ exit: 1 })], 1);
        await settle();
        const rerun = state.client.commands.rerun(ID);
        gates[1](json({ ok: true, id: ID }));
        await rerun;
        gates[0](captured(FAILED));
        await settle();
        expect(state.client.commands.commandDiagnostics()).toEqual([]);
        listTasks(state.client, [task({ pid: 2, exit: 1 })], 2);
        await settle();
        expect(captures()).toHaveLength(2);
        gates[2](captured('other.c:1: error: second\n'));
        await settle();
        expect(state.client.commands.commandDiagnostics().map((one) => one.message)).toEqual([
            'second'
        ]);
    });

    it('does not replace the output a pane fed while the capture was out', async () => {
        const gates = held();
        listTasks(state.client, [task({ exit: 1 })], 1);
        await settle();
        reading();
        state.client.commands.note(ID, 'pane.c:2: error: from the pane\r\n', true);
        gates[0](captured(FAILED));
        await settle();
        expect(state.client.commands.commandDiagnostics().map((one) => one.message)).toEqual([
            'from the pane'
        ]);
    });

    it('holds none when the server refused the capture or could not be reached', async () => {
        serveInto(state.asked, () => json({ error: 'not listed' }, 400));
        listTasks(state.client, [task({ exit: 1 })], 1);
        await settle();
        expect(state.client.commands.commandDiagnostics()).toEqual([]);
        vi.stubGlobal('fetch', () => Promise.reject(new Error('down')));
        listTasks(state.client, [task({ id: 'd4e5f6-shell', exit: 1 })], 2);
        await settle();
        expect(state.client.commands.commandDiagnostics()).toEqual([]);
    });
});

const SUB = `${REPO}/sub`;

/** The mark of `test`, which runs in `sub` after `build`, which runs in the repository. */
const TEST_JOB: TerminalJob = {
    repo: REPO,
    name: 'test',
    source: 'file',
    token: 'k1',
    chain: [
        { name: 'build', cwd: REPO },
        { name: 'test', cwd: SUB }
    ]
};

describe('the diagnostics of a chain', () => {
    const OUTPUT =
        'k1 build\r\nsrc/a.c:3: error: from build\r\nk1 test\r\nsrc/b.c:4: error: from test\r\n';

    function ranTest(job: TerminalJob = TEST_JOB): void {
        listTasks(state.client, [task({ name: 'test', job })]);
    }

    const files = () => state.client.commands.commandDiagnostics().map((one) => one.file);

    it('reads the path an error names from the folder of the command that printed it', () => {
        ranTest();
        state.client.commands.note(ID, OUTPUT, false);
        expect(
            state.client.commands.commandDiagnostics().map((one) => [one.file, one.message])
        ).toEqual([
            ['src/a.c', 'from build'],
            ['sub/src/b.c', 'from test']
        ]);
    });

    it('reads the folders from the mark when the repository list was never read', () => {
        ranTest();
        state.client.commands.note(ID, OUTPUT, false);
        expect(files()).toEqual(['src/a.c', 'sub/src/b.c']);
    });

    it('reads the folders from the mark when the list now holds the commands elsewhere', () => {
        const moved: CommandsAnswer = {
            commands: [
                { name: 'build', run: 'make', cwd: `${REPO}/x`, depends_on: [], source: 'file' },
                { name: 'test', run: 'make', cwd: `${REPO}/y`, depends_on: [], source: 'file' }
            ],
            findings: []
        };
        state.client.commands.seed(REPO, moved);
        ranTest();
        state.client.commands.note(ID, OUTPUT, false);
        expect(files()).toEqual(['src/a.c', 'sub/src/b.c']);
    });

    it('follows the commands across chunks and across a line split in two', () => {
        ranTest();
        for (const chunk of ['k1 bui', 'ld\r\nsrc/a.c:3: er', 'ror: from build\r\nk1 test\r\n']) {
            state.client.commands.note(ID, chunk, false);
        }
        state.client.commands.note(ID, 'src/b.c:4: error: from test\r\n', false);
        expect(files()).toEqual(['src/a.c', 'sub/src/b.c']);
    });

    it('moves to the next command only on a line that ends in its marker', () => {
        ranTest();
        const lines = [
            'building build',
            'build',
            'k1 build failed',
            'src/a.c:3: error: before the marker',
            'k1 build',
            'src/b.c:4: error: from build',
            'test',
            'k2 test',
            'src/c.c:5: error: still build',
            'the last output with no line breakk1 test',
            'src/d.c:6: error: from test'
        ];
        state.client.commands.note(ID, `${lines.join('\r\n')}\r\n`, false);
        expect(files()).toEqual(['sub/src/a.c', 'src/b.c', 'src/c.c', 'sub/src/d.c']);
    });

    it('does not move on when a command prints the name of the next one', () => {
        ranTest();
        const lines = ['k1 build', 'test', 'src/a.c:3: error: from build', 'k1 test'];
        state.client.commands.note(ID, `${lines.join('\r\n')}\r\n`, false);
        expect(files()).toEqual(['src/a.c']);
    });

    it('reads a mark with no token by the bare names', () => {
        const { token: _token, ...bare } = TEST_JOB;
        ranTest(bare);
        const lines = ['build', 'src/a.c:3: error: x', 'test', 'src/b.c:4: error: y'];
        state.client.commands.note(ID, `${lines.join('\r\n')}\r\n`, false);
        expect(files()).toEqual(['src/a.c', 'sub/src/b.c']);
    });

    it('starts again from the first command when the scrollback replaces the output', () => {
        ranTest();
        state.client.commands.note(ID, OUTPUT, false);
        state.client.commands.note(ID, OUTPUT, true);
        expect(files()).toEqual(['src/a.c', 'sub/src/b.c']);
    });

    it('reads output printed before the first command name from the folder of the command pressed', () => {
        ranTest();
        state.client.commands.note(ID, 'k1 test\r\nsrc/c.c:1: error: early\r\nk1 build\r\n', false);
        expect(files()).toEqual(['sub/src/c.c']);
    });

    it('reads a plain command from its own folder', () => {
        ranTest({
            repo: REPO,
            name: 'build',
            source: 'file',
            token: 'k1',
            chain: [{ name: 'build', cwd: SUB }]
        });
        state.client.commands.note(ID, 'k1 build\r\nsrc/a.c:3: error: x\r\n', false);
        expect(files()).toEqual(['sub/src/a.c']);
    });

    it('reads a mark that names no chain from the repository', () => {
        ranTest({ repo: REPO, name: 'build', source: 'file' });
        state.client.commands.note(ID, 'build\r\nsrc/a.c:3: error: x\r\n', false);
        expect(files()).toEqual(['src/a.c']);
    });
});

describe('the file an error line names, in a chain', () => {
    it('tries the folder of the command pressed, then those of the commands it ran first', async () => {
        vi.stubGlobal('window', {});
        serveInto(state.asked, (call) => {
            if (call.url === '/api/fs') return servedRoots();
            return call.url.includes('%2Fsub%2Fsrc%2Fa.c')
                ? json({ error: 'missing' }, 404)
                : json({});
        });
        state.client.fs.workspaces();
        await settle();
        listTasks(state.client, [task({ name: 'test', job: TEST_JOB })]);
        expect(await state.client.commands.errorFile(ID, 'src/a.c')).toEqual({
            repo: REPO,
            path: 'src/a.c'
        });
    });
});
