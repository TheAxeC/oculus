// Layer 2, server tests. G146: a pane's agent is read from the process table, and a terminal's kind
// and a steer follow it, and a tmux session oculus did not start is never ended, renamed, resized
// or marked. The list is read from fixed `list-sessions` text and fixed tables, the route from the
// tmux double of terminal-fixture.ts, the timer from a fake clock, and the cases only tmux can
// answer from a private tmux server: which pane a control client's output came from, what an attach
// does to a session's environment, and what a pane's foreground runs.
//
// What this does NOT cover: the grid drawn at a pane's size, which is seen at the look.

import { spawnSync } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import { Terminals } from '../../../../src/lib/server/machine/pty/channel.ts';
import { tmuxDriver } from '../../../../src/lib/server/machine/pty/panes/driver.ts';
import { terminalsOf } from '../../../../src/lib/server/machine/pty/panes/listing.ts';
import { handleTerminal } from '../../../../src/lib/server/machine/pty/routes.ts';
import { readTty } from '../../../../src/lib/server/machine/processes/ps.ts';
import type { Entry, TtyProcess } from '../../../../src/lib/server/machine/processes/table.ts';
import type { Terminal } from '../../../../src/lib/data/model/index.ts';
import { engineDir } from '../../../../src/lib/data/sources/config.ts';
import { it, test } from '../../../fixtures/scratch.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { privateTmux, tmuxOptions } from './tmux-server.ts';
import {
    BASE_CHAT_CONFIG,
    SERVER,
    TOKEN,
    request,
    tmux,
    worldOf
} from '../../../routes/sessions/terminal-fixture.ts';

test.afterAll(() => {
    SERVER.close();
});

const SERVER_PID = 900;

type Driver = NonNullable<NonNullable<ConstructorParameters<typeof Terminals>[1]>['driver']>;

/** One line of `list-sessions`, whose active pane has the pid `pid`. */
function session(name: string, pid: number, command = 'zsh'): string {
    const empty = ['', '', '', '', '', '', '', '', ''];
    return [name, '1757500000', '0', command, pid, '/w', ...empty, SERVER_PID].join('\t');
}

/** One line of the pane rows the list carries behind its sessions. */
function pane(id: string, name: string, pid: number, cols = 120): string {
    return [
        id,
        'pane',
        pid,
        cols,
        '40',
        '$3',
        '1757500000',
        '0',
        'zsh',
        name,
        '/w',
        SERVER_PID
    ].join('\t');
}

/** One process of a table. */
function run(pid: number, ppid: number, command: string): Entry {
    return {
        pid,
        ppid,
        user: 'a',
        started: '2026-11-01T00:00:00.000Z',
        cpu: 0,
        memory: 0,
        command
    };
}

/** One process of a pane's tty. */
function row(pgid: number, tpgid: number, command: string): TtyProcess {
    return { pgid, tpgid, command };
}

const CLAUDE = '/Users/x/.local/bin/claude --resume 3f2504e0-4f89-11d3-9a0c-0305e82c3301';

/** The list of one terminal named `name` over a table. */
function listed(name: string, table: Entry[], command = 'zsh'): Terminal[] {
    return terminalsOf(session(name, 100, command), table);
}

describe('an agent in a pane', () => {
    const shell = run(100, 1, '-zsh');
    it.each<[string, string, Entry[], Terminal['kind'], number | null]>([
        [
            'a shell with claude as its child',
            'a1b2c3-shell',
            [shell, run(101, 100, CLAUDE)],
            'claude',
            101
        ],
        ['a shell whose child went', 'a1b2c3-shell', [shell], 'shell', null],
        [
            'a shell running codex under node',
            'a1b2c3-shell',
            [shell, run(101, 100, 'node /opt/x/codex')],
            'codex',
            101
        ],
        [
            'a shell running codex under bun',
            'a1b2c3-shell',
            [shell, run(101, 100, 'bun /opt/x/codex')],
            'codex',
            101
        ],
        [
            'vim on a file named so',
            'a1b2c3-shell',
            [shell, run(101, 100, 'vim claude.txt')],
            'shell',
            null
        ],
        ['man', 'a1b2c3-shell', [shell, run(101, 100, 'man claude')], 'shell', null],
        ['grep', 'a1b2c3-shell', [shell, run(101, 100, 'grep claude notes.txt')], 'shell', null],
        ['ripgrep', 'a1b2c3-shell', [shell, run(101, 100, 'rg claude src')], 'shell', null],
        ['less', 'a1b2c3-shell', [shell, run(101, 100, 'less codex')], 'shell', null],
        [
            'a shell sourcing a file',
            'a1b2c3-shell',
            [shell, run(101, 100, '/bin/zsh -c source ~/.claude/s.sh')],
            'shell',
            null
        ],
        [
            'a claude under claude',
            'a1b2c3-shell',
            [shell, run(101, 100, 'claude'), run(102, 101, 'claude')],
            'claude',
            101
        ],
        [
            'a grandchild',
            'a1b2c3-shell',
            [shell, run(101, 100, 'sh'), run(102, 101, 'claude')],
            'claude',
            102
        ],
        [
            'a process that is its own parent',
            'a1b2c3-shell',
            [run(100, 100, '-zsh')],
            'shell',
            null
        ],
        ['an app terminal keeps its kind', 'a1b2c3-app', [run(100, 1, 'claude')], 'app', 100]
    ])('reads %s', (_case, id, table, kind, pid) => {
        const [read] = listed(`oculus-${id}`, table);
        expect(read.kind).toBe(kind);
        expect(read.agent?.pid ?? null).toBe(pid);
    });

    it('names claude in a pane tmux reports by its version', () => {
        const [read] = listed('oculus-a1b2c3-claude', [run(100, 1, 'claude')], '2.1.316');
        expect(read.kind).toBe('claude');
        expect(read.agent).toEqual({ tool: 'claude', pid: 100 });
    });

    it('lists a pane of a session oculus did not start while it runs an agent, by the pane', () => {
        const text = [
            session('work', 200),
            session('oculus-usage-1', 300),
            session('oculus-work', 400),
            session('oculus-idle', 500),
            session('oculus-h1p1-claude', 600),
            pane('%7', 'work', 200),
            pane('%8', 'work', 210),
            pane('%9', 'work', 220),
            pane('%10', 'oculus-usage-1', 300),
            pane('%11', 'oculus-work', 400),
            pane('%12', 'oculus-idle', 500),
            pane('%13', 'oculus-h1p1-claude', 600)
        ].join('\n');
        const read = terminalsOf(text, [
            run(200, 1, 'zsh'),
            run(201, 200, 'claude'),
            run(210, 1, 'codex'),
            run(220, 1, 'zsh'),
            run(300, 1, 'claude'),
            run(400, 1, 'claude'),
            run(500, 1, 'zsh'),
            run(600, 1, 'zsh')
        ]);
        expect(read.map((one) => [one.id, one.foreign === true, one.byHand?.session])).toEqual([
            ['idle', true, undefined],
            ['h1p1-claude', true, undefined],
            [`h${SERVER_PID}p7-claude`, false, '$3'],
            [`h${SERVER_PID}p8-codex`, false, '$3'],
            [`h${SERVER_PID}p11-claude`, false, '$3']
        ]);
        expect(read[2].byHand).toEqual({ session: '$3', cols: 120, rows: 40 });
        expect(read[2].agent).toEqual({ tool: 'claude', pid: 201 });
    });

    it('keeps one row when a session is named as a by-hand id another pane has', () => {
        const name = `oculus-h${SERVER_PID}p7-claude`;
        const text = [session(name, 600), session('work', 200), pane('%7', 'work', 200)];
        const read = terminalsOf(text.join('\n'), [run(200, 1, 'claude'), run(600, 1, 'zsh')]);
        expect(read.map((one) => one.foreign === true)).toEqual([false]);
    });

    const SHARED = `h${SERVER_PID}p0-claude`;
    it.each<[string, [string, string], string]>([
        ['two sessions', ['work', 'view2'], SHARED],
        ['two sessions named under the prefix', ['oculus-work', 'oculus-view2'], SHARED],
        ['an oculus session and another', ['oculus-a1b2c3-shell', 'view2'], 'a1b2c3-shell']
    ])('lists a pane held by %s once', (_case, [first, second], id) => {
        const text = [
            session(first, 200),
            session(second, 200),
            pane('%0', first, 200),
            pane('%0', second, 200)
        ];
        const read = terminalsOf(text.join('\n'), [run(200, 1, 'claude')]);
        expect(read.map((one) => one.id)).toEqual([id]);
    });
});

describe('an agent in a pane, the actions on a by-hand terminal', () => {
    const ID = 'h900p3-claude';
    const CLAUDE_FIRST = [row(50, 60, '-zsh'), row(60, 60, CLAUDE)];

    /** The route with the recording tmux; `foreground` answers for what the pane's tty runs. */
    async function post(
        body: Record<string, unknown>,
        foreground: () => Promise<TtyProcess[]>,
        server = SERVER_PID
    ) {
        const driver = tmux();
        const response = await handleTerminal(request({ id: ID, ...body }), TOKEN, {
            ...worldOf(),
            engine: engineDir(),
            configFor: () => BASE_CHAT_CONFIG,
            foreground,
            run: (args, options) =>
                args[0] === 'display-message'
                    ? driver.run(args, options).then(() => `${String(server)}\t/dev/ttys003\n`)
                    : driver.run(args, options)
        });
        return {
            status: response.status,
            word: ((await response.json()) as { error?: string }).error,
            calls: driver.calls
        };
    }

    it.each([
        ['stop', { action: 'stop' }],
        ['rename', { action: 'rename', title: 'x' }],
        ['restyle', { action: 'restyle', color: 'red' }],
        ['clear', { action: 'clear' }],
        ['resize', { action: 'resize', cols: 80, rows: 24 }],
        ['a task restart', { action: 'restart', confirmed: true }],
        ['a task rerun', { action: 'rerun' }]
    ])('refuses %s with not-ours and calls no tmux', async (_case, body) => {
        const { status, word, calls } = await post(body, () => Promise.resolve(CLAUDE_FIRST));
        expect([status, word, calls]).toEqual([400, 'not-ours', []]);
    });

    it('sends a steer and an interrupt to the pane', async () => {
        const answer = () => Promise.resolve(CLAUDE_FIRST);
        const steer = await post({ action: 'steer', text: 'hi' }, answer);
        expect(steer.status).toBe(200);
        expect(steer.calls.slice(1).map((one) => one.slice(0, 3))).toEqual([
            ['send-keys', '-t', '%3'],
            ['send-keys', '-t', '%3']
        ]);
        const interrupt = await post({ action: 'interrupt' }, answer);
        expect(interrupt.calls.at(-1)).toEqual(['send-keys', '-t', '%3', '--', 'Escape']);
    });

    it.each<[string, string, () => Promise<TtyProcess[]>]>([
        ['a by-hand pane at zsh', ID, () => Promise.resolve([row(50, 50, '-zsh')])],
        [
            'a by-hand pane at bash under a zsh login',
            ID,
            () => Promise.resolve([row(50, 60, '-zsh'), row(60, 60, 'bash')])
        ],
        [
            'a by-hand pane with claude suspended',
            ID,
            () => Promise.resolve([row(50, 50, '-zsh'), row(60, 50, CLAUDE)])
        ],
        ['a shell terminal at zsh', 'a1b2c3-shell', () => Promise.resolve([row(50, 50, 'zsh')])],
        [
            'a shell terminal at bash under a zsh login',
            'a1b2c3-shell',
            () => Promise.resolve([row(50, 60, '-zsh'), row(60, 60, 'bash')])
        ],
        [
            'a shell terminal with claude suspended',
            'a1b2c3-shell',
            () => Promise.resolve([row(50, 50, '-zsh'), row(60, 50, CLAUDE)])
        ],
        ['a pane whose read fails', ID, () => Promise.reject(new Error('ps'))]
    ])('refuses a steer into %s and types nothing', async (_case, id, foreground) => {
        const { status, word, calls } = await post({ action: 'steer', id, text: 'x' }, foreground);
        expect([status, word]).toEqual([400, 'no-agent']);
        expect(calls.filter((one) => one[0] === 'send-keys')).toEqual([]);
    });

    it('refuses an interrupt of a by-hand pane whose agent is suspended and sends nothing', async () => {
        const suspended = () => Promise.resolve([row(50, 50, '-zsh'), row(60, 50, CLAUDE)]);
        const { status, word, calls } = await post({ action: 'interrupt' }, suspended);
        expect([status, word]).toEqual([400, 'no-agent']);
        expect(calls.filter((one) => one[0] === 'send-keys')).toEqual([]);
    });

    it('sends an interrupt to a by-hand pane whose read fails', async () => {
        const { status, calls } = await post({ action: 'interrupt' }, () =>
            Promise.reject(new Error('ps'))
        );
        expect(status).toBe(200);
        expect(calls.at(-1)).toEqual(['send-keys', '-t', '%3', '--', 'Escape']);
    });

    it('refuses a steer into a shell terminal whose pane has no tty', async () => {
        const driver = tmux();
        const response = await handleTerminal(
            request({ id: 'a1b2c3-shell', action: 'steer', text: 'x' }),
            TOKEN,
            {
                ...worldOf(),
                engine: engineDir(),
                configFor: () => BASE_CHAT_CONFIG,
                run: (args, options) =>
                    args[0] === 'display-message'
                        ? Promise.resolve(`${String(SERVER_PID)}\t\n`)
                        : driver.run(args, options)
            }
        );
        expect(response.status).toBe(400);
        expect(driver.calls.filter((one) => one[0] === 'send-keys')).toEqual([]);
    });

    it('refuses a saved by-hand id on a later tmux server and types nothing', async () => {
        const answer = () => Promise.resolve(CLAUDE_FIRST);
        const steer = await post({ action: 'steer', text: 'x' }, answer, 901);
        const interrupt = await post({ action: 'interrupt' }, answer, 901);
        expect([steer.word, interrupt.word]).toEqual(['terminal-ended', 'terminal-ended']);
        expect(steer.calls.concat(interrupt.calls).some((one) => one[0] === 'send-keys')).toBe(
            false
        );
    });

    it('types into a shell terminal whose foreground runs claude', async () => {
        const { status, calls } = await post(
            { action: 'steer', id: 'a1b2c3-shell', text: 'hi' },
            () => Promise.resolve(CLAUDE_FIRST)
        );
        expect(status).toBe(200);
        expect(calls.filter((one) => one[0] === 'send-keys')).toHaveLength(2);
    });
});

describe('an agent in a pane, the timer of the table', () => {
    const LIST = `${session('oculus-a1b2c3-shell', 100)}\n`;

    /** A driver that answers the list `list` gives, with a live control client or none. */
    function live(
        list: () => string | Promise<string> = () => LIST,
        client = true,
        attached: Driver['attached'] = noop
    ): { driver: ConstructorParameters<typeof Terminals>[1]; reads: () => number } {
        let reads = 0;
        return {
            reads: () => reads,
            driver: {
                driver: {
                    run: async (args) => {
                        if (args[0] === 'list-sessions') reads += 1;
                        return list();
                    },
                    read: () => Promise.resolve(''),
                    onOutput: noop,
                    onChange: noop,
                    attached,
                    live: () => client,
                    serverRuns: () => Promise.resolve(true),
                    close: noop
                }
            }
        };
    }

    const SINK = { send: () => Promise.resolve(), close: noop };

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('holds the first publish until the first read settles', async () => {
        let answer: (table: Entry[]) => void = noop;
        const first = new Promise<Entry[]>((resolve) => (answer = resolve));
        const held = new Terminals(new Hub(), { ...live().driver, table: () => first });
        await vi.advanceTimersByTimeAsync(0);
        expect(held.list()).toBeNull();
        answer([run(100, 1, 'zsh')]);
        await vi.advanceTimersByTimeAsync(0);
        expect(held.list()?.map((one) => one.id)).toEqual(['a1b2c3-shell']);
        held.close();
    });

    it('keeps the last agent through a failed read, and throws nothing', async () => {
        const tables = [[run(100, 1, 'claude')]];
        const held = new Terminals(new Hub(), {
            ...live().driver,
            table: () => {
                const table = tables.shift();
                return table === undefined
                    ? Promise.reject(new Error('ps'))
                    : Promise.resolve(table);
            }
        });
        await vi.advanceTimersByTimeAsync(0);
        held.subscribed(SINK, ['sessions']);
        await vi.advanceTimersByTimeAsync(5000);
        held.refresh();
        await vi.advanceTimersByTimeAsync(0);
        expect(held.list()?.[0].agent).toEqual({ tool: 'claude', pid: 100 });
        held.close();
    });

    it('publishes nothing for the same table and once for a new agent', async () => {
        let table = [run(100, 1, 'zsh')];
        const world = live();
        const held = new Terminals(new Hub(), {
            ...world.driver,
            table: () => Promise.resolve(table)
        });
        await vi.advanceTimersByTimeAsync(0);
        held.subscribed(SINK, ['sessions']);
        await vi.advanceTimersByTimeAsync(0);
        const told = vi.fn();
        held.onChange(told);
        const reads = world.reads();
        await vi.advanceTimersByTimeAsync(5000);
        expect([told.mock.calls.length, world.reads()]).toEqual([0, reads + 1]);
        table = [run(100, 1, 'zsh'), run(101, 100, 'claude')];
        await vi.advanceTimersByTimeAsync(5000);
        expect([told.mock.calls.length, world.reads()]).toEqual([1, reads + 3]);
        expect(held.list()?.[0].kind).toBe('claude');
        held.close();
    });

    const WORK = session('work', 200);
    const PANE = `${WORK}\n${pane('%7', 'work', 200)}`;
    const PANE_LISTS: [string, string, string][] = [
        ['a pane missing from the last list', WORK, PANE],
        ['a tmux session missing from it', WORK, `${WORK}\n${session('oculus-d4d4d4-shell', 300)}`],
        ['a pane resized', PANE, `${WORK}\n${pane('%7', 'work', 200, 90)}`]
    ];

    it.each(
        [true, false].flatMap((client) =>
            PANE_LISTS.map(([name, before, after]) => ({ name, before, after, client }))
        )
    )('publishes $name once, a control client: $client', async ({ before, after, client }) => {
        let text = before;
        const held = new Terminals(new Hub(), {
            ...live(() => text, client).driver,
            table: () => Promise.resolve([run(200, 1, 'claude'), run(300, 1, 'zsh')])
        });
        await vi.advanceTimersByTimeAsync(0);
        held.subscribed(SINK, ['sessions']);
        await vi.advanceTimersByTimeAsync(0);
        const told = vi.fn();
        held.onChange(told);
        await vi.advanceTimersByTimeAsync(5000);
        expect(told).not.toHaveBeenCalled();
        text = after;
        await vi.advanceTimersByTimeAsync(10000);
        expect(told).toHaveBeenCalledOnce();
        held.close();
    });

    it('hands the driver the session a by-hand pane moved to', async () => {
        const moved = (name: string, number: string): string =>
            `${session(name, 200)}\n${pane('%7', name, 200).replace('$3', number)}`;
        let text = moved('view2', '$1');
        const seen: (string | undefined)[] = [];
        const id = `h${String(SERVER_PID)}p7-claude`;
        const world = live(
            () => text,
            true,
            (_ids, sessions) => {
                seen.push(sessions.get(id));
            }
        );
        const held = new Terminals(new Hub(), {
            ...world.driver,
            table: () => Promise.resolve([run(200, 1, 'claude')])
        });
        await vi.advanceTimersByTimeAsync(0);
        held.subscribed(SINK, ['sessions']);
        await vi.advanceTimersByTimeAsync(5000);
        text = moved('work', '$0');
        await vi.advanceTimersByTimeAsync(10000);
        expect(seen.at(-1)).toBe('$0');
        held.close();
    });

    it('starts no second list while the tick has one out', async () => {
        let hang = false;
        const world = live(() => (hang ? new Promise<string>(noop) : LIST));
        const held = new Terminals(new Hub(), {
            ...world.driver,
            table: () => Promise.resolve([run(100, 1, 'zsh')])
        });
        await vi.advanceTimersByTimeAsync(0);
        const reads = world.reads();
        hang = true;
        held.subscribed(SINK, ['sessions']);
        await vi.advanceTimersByTimeAsync(20000);
        expect(world.reads()).toBe(reads + 1);
        held.close();
    });

    it('starts no second read while one is out, and none with no page', async () => {
        let reads = 0;
        const held = new Terminals(new Hub(), {
            ...live().driver,
            table: () => {
                reads += 1;
                return reads === 1 ? Promise.resolve([]) : new Promise<Entry[]>(noop);
            }
        });
        await vi.advanceTimersByTimeAsync(20000);
        expect(reads).toBe(1);
        held.subscribed(SINK, ['sessions']);
        await vi.advanceTimersByTimeAsync(20000);
        expect(reads).toBe(2);
        held.close();
    });
});

describe('an agent in a pane, the output of one pane', { tags: ['slow'] }, () => {
    const server = privateTmux('agent-pane');
    const options = tmuxOptions(server);
    const tmuxAt = (...args: string[]) =>
        spawnSync('tmux', ['-S', options.socket, ...args], { encoding: 'utf8' }).stdout.trim();

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('forwards the output of its pane and of no other pane of the session', async () => {
        tmuxAt('new-session', '-d', '-s', 'work', '-x', '80', '-y', '24', 'cat');
        tmuxAt('split-window', '-t', 'work', 'cat');
        const [mine, other] = tmuxAt('list-panes', '-t', 'work', '-F', '#{pane_id}').split('\n');
        const id = `h${tmuxAt('display-message', '-p', '#{pid}')}p${mine.slice(1)}-claude`;
        const driver = tmuxDriver(options);
        let seen = '';
        const reached = Promise.withResolvers<null>();
        driver.onOutput((from, bytes) => {
            if (from === id) seen += bytes.toString('utf8');
            if (seen.includes('mine')) reached.resolve(null);
        });
        driver.attached([id], new Map([[id, '$0']]));
        await driver.read(id, ['display-message', '-p', '-t', mine, '#{pane_id}'], noop);
        tmuxAt('send-keys', '-t', other, '-l', 'theirs');
        tmuxAt('send-keys', '-t', mine, '-l', 'mine');
        await reached.promise;
        driver.close();
        expect(seen).toContain('mine');
        expect(seen).not.toContain('theirs');
    });

    it('forwards a pane through the session it moved to', async () => {
        tmuxAt('new-session', '-d', '-s', 'first', 'cat');
        tmuxAt('new-session', '-d', '-t', 'first', '-s', 'second');
        const target = tmuxAt('list-panes', '-t', 'first', '-F', '#{pane_id}');
        const named = (name: string) =>
            tmuxAt('display-message', '-p', '-t', name, '#{session_id}');
        const [first, second] = [named('first'), named('second')];
        const id = `h${tmuxAt('display-message', '-p', '#{pid}')}p${target.slice(1)}-claude`;
        const driver = tmuxDriver(options);
        let seen = '';
        driver.onOutput((_id, bytes) => {
            seen += bytes.toString();
        });
        const read = ['display-message', '-p', '-t', target, '#{pane_id}'];
        driver.attached([id], new Map([[id, first]]));
        await driver.read(id, read, noop);
        tmuxAt('kill-session', '-t', 'first');
        driver.attached([id], new Map([[id, second]]));
        await driver.read(id, read, noop);
        tmuxAt('send-keys', '-t', target, 'moved', 'Enter');
        await vi.waitFor(() => expect(seen).toContain('moved'));
        driver.close();
    });

    it('leaves the environment of the session as it stood before the attach', async () => {
        tmuxAt('new-session', '-d', '-s', 'kept', 'cat');
        tmuxAt('set-option', '-g', 'update-environment', 'OCULUS_ATTACH_MARK');
        vi.stubEnv('OCULUS_ATTACH_MARK', 'one');
        const before = tmuxAt('show-environment', '-t', 'kept');
        const target = tmuxAt('list-panes', '-t', 'kept', '-F', '#{pane_id}');
        const session = tmuxAt('display-message', '-p', '-t', 'kept', '#{session_id}');
        const id = `h${tmuxAt('display-message', '-p', '#{pid}')}p${target.slice(1)}-claude`;
        const driver = tmuxDriver(options);
        driver.attached([id], new Map([[id, session]]));
        await driver.read(id, ['display-message', '-p', '-t', target, '#{pane_id}'], noop);
        const after = tmuxAt('show-environment', '-t', 'kept');
        driver.close();
        expect(after).toBe(before);
    });

    it('reads what the foreground of a real pane runs', async () => {
        tmuxAt('new-session', '-d', '-s', 'front', 'cat');
        const tty = tmuxAt('display-message', '-p', '-t', 'front', '#{pane_tty}');
        const rows = await readTty(tty);
        expect(rows.map((one) => [one.pgid === one.tpgid, one.command])).toEqual([[true, 'cat']]);
    });
});
