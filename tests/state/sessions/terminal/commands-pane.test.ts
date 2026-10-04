// Layer 2, client-state tests. The diagnostics of a task that ran in a real pane on a private tmux
// server: the list the server gives, the pane's text the capture action returns, and the commands
// store reading both, from the start of the line to a diagnostic with the folder of the command
// that printed it.
//
// The tmux calls all carry `-S <socket>` into a directory made for this file, so the machine's own
// tmux server is never listed, started or killed. The case waits on events, never on a clock: the
// pane's line signals a tmux channel once it printed, the end of the line is tmux's `pane-died`
// hook, and the capture is the promise the `fetch` stub answered with. `fetch` is a stub that
// answers `/api/terminal` with the server's own capture action. What this does NOT cover: a
// mounted grid, which needs a DOM; the cases call `subscribePty` and `note` as the grid does.
//
// The server modules and the tmux fixture (whose load runs `tmux -V`) are imported inside the
// `beforeAll`, so a run that leaves slow tests out loads this file without starting a process.
// @module-tag slow: starts a private tmux server and runs a shell task in a real pane.

import { execFile, spawnSync } from 'node:child_process';
import { rmSync, writeFileSync } from 'node:fs';
import { promisify } from 'node:util';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import type * as Sessions from '../../../../src/lib/server/machine/pty/sessions.ts';
import type * as Run from '../../../../src/lib/server/machine/commands/run.ts';
import { engineDir, loadConfig, textCatalog } from '../../../../src/lib/data/sources/config.ts';
import { setCatalog } from '../../../../src/lib/state/shared/words/text.ts';
import { it, scratchDir, test } from '../../../fixtures/scratch.ts';
import { settle } from '../../../fixtures/client.ts';
import { freshCase, listTasks } from './commands-fixture.ts';

vi.setConfig({ testTimeout: 30000 });

let CONFIG: ReturnType<typeof loadConfig>['config'];
let TMUX = false;
let sessions: typeof Sessions;
let captureTask: typeof Run.captureTask;

/** The scratch directory and socket of the private server, empty until the hook makes them. */
const server = { dir: '', socket: '', available: false };
const options = {
    get socket(): string {
        return server.socket;
    }
};

let ended: () => Promise<void> = () => Promise.resolve();

test.beforeAll(async () => {
    CONFIG = loadConfig(engineDir()).config;
    setCatalog(textCatalog(CONFIG));
    sessions = await import('../../../../src/lib/server/machine/pty/sessions.ts');
    ({ captureTask } = await import('../../../../src/lib/server/machine/commands/run.ts'));
    const fixture = await import('../../../server/machine/pty/tmux-fixture.ts');
    TMUX = fixture.TMUX;
    if (!TMUX) return;
    server.dir = scratchDir('oculus-pane-');
    server.socket = join(server.dir, 'server.sock');
    server.available = true;
    ended = await fixture.watchEnds(server);
});

// Every tmux call carries this file's own socket; an unset socket means no server started.
test.afterAll(() => {
    if (server.socket === '') return;
    spawnSync('tmux', ['-S', server.socket, 'kill-server'], { encoding: 'utf8' });
    rmSync(server.dir, { recursive: true, force: true });
});

const state = freshCase();

/**
 * Answer each request to `/api/terminal` with the server's own capture action, and hold each
 * answer, so a case can wait for the captures asked so far.
 */
function serveCaptures(): { count: () => number; answered: () => Promise<unknown> } {
    const answers: Promise<Response>[] = [];
    vi.stubGlobal('fetch', async (_url: string, init?: RequestInit) => {
        const body = JSON.parse(typeof init?.body === 'string' ? init.body : '{}') as Record<
            string,
            unknown
        >;
        if (body.action !== 'capture') return new Response('{}');
        const answer = captureTask(body, { ...options, configFor: () => CONFIG });
        answers.push(answer);
        return answer;
    });
    return { count: () => answers.length, answered: () => Promise.all(answers) };
}

/** Wait until the pane's line signals the tmux channel `name`, which tmux holds until asked. */
async function signalled(name: string): Promise<void> {
    await promisify(execFile)('tmux', ['-S', server.socket, 'wait-for', name]);
}

describe('a task in a real pane, read by the commands store', () => {
    it('reads the diagnostics printed after the grid let go, each from the folder of its command', async ({
        skip
    }) => {
        if (!TMUX) skip('tmux is not on the PATH');
        const { listTerminals, paneOutput, startTerminal, stopTerminal } = sessions;
        const id = 'ffffff-shell';
        const gate = join(server.dir, 'gate');
        const line =
            `printf '%s\\n' 'k1 build'; printf 'src/a.c:3: error: boom\\n'; ` +
            `tmux -S '${server.socket}' wait-for -S printed; ` +
            `until [ -e '${gate}' ]; do sleep 0.1; done; ` +
            `printf '%s\\n' 'k1 test'; printf 'src/b.c:4: error: bad\\n'; false`;
        await startTerminal(
            { id, kind: 'shell', cwd: server.dir, cols: 80, rows: 24, name: 'test' },
            {
                ...options,
                command: line,
                task: {
                    repo: server.dir,
                    name: 'test',
                    source: 'file',
                    token: 'k1',
                    chain: [
                        { name: 'build', cwd: server.dir },
                        { name: 'test', cwd: `${server.dir}/sub` }
                    ]
                }
            }
        );
        const asked = serveCaptures();
        const entry = async () => (await listTerminals(options)).find((one) => one.id === id);
        const listing = async () => {
            const found = await entry();
            if (found === undefined) throw new Error('the terminal is not listed');
            return found;
        };
        await signalled('printed');
        expect(await paneOutput(id, options)).toContain('error: boom');
        listTasks(state.client, [await listing()], 1);
        await settle();
        expect(asked.count()).toBe(0);

        // The grid reads the pane, then lets go of it before the line ends.
        const off = state.client.terminals.subscribePty(
            id,
            () => ({ cols: 80, rows: 24 }),
            () => undefined
        );
        state.client.commands.note(id, await paneOutput(id, options), true);
        off();

        writeFileSync(gate, '');
        while ((await entry())?.exit !== 1) await ended();
        listTasks(state.client, [await listing()], 2);
        await asked.answered();
        await settle();
        expect(
            state.client.commands
                .commandDiagnostics()
                .map((one) => [one.file, one.line, one.message])
        ).toEqual([
            ['src/a.c', 3, 'boom'],
            ['sub/src/b.c', 4, 'bad']
        ]);
        expect(asked.count()).toBe(1);
        await stopTerminal(id, options);
    });
});
