// Layer 4, server test. Synthetic account files and a recorded tmux runner exercise refresh,
// recovery, cadence, live filtering and route authorization without starting processes.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UsageAccountConfig, UsagePayload } from '../../../../src/lib/data/model/index.ts';
import {
    paneReason,
    USAGE_POLL_MS,
    USAGE_RENEW_WAIT_MS,
    USAGE_WAIT_MS,
    hasPrompt,
    usageSessionName,
    usageStartArgs,
    watchUsageRefresh,
    type UsageRefreshOptions,
    type UsageRefreshWatcher
} from '../../../../src/lib/server/machine/usage/refresh.ts';
import {
    handleUsageRefresh,
    type UsageRefreshTarget
} from '../../../../src/lib/server/machine/usage/routes.ts';
import {
    claudeAccountFile,
    usageAccounts
} from '../../../../src/lib/server/machine/usage/accounts.ts';
import { watchUsage } from '../../../../src/lib/server/machine/usage/watch.ts';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import { contextFixture } from '../../root/context-fixture.ts';
import { noop } from '../../../fixtures/doubles.ts';
import { scratchDir, sweepScratch } from '../../../fixtures/scratch.ts';

afterAll(sweepScratch);

const NOW = Date.parse('2026-09-13T12:00:00Z');
const BIN = '/opt/Claude Code/claude';
const MODEL = 'haiku';
const NAME = 'oculus-usage-university';
let root: string;
let account: UsageAccountConfig;
let at: number;
const watchers: UsageRefreshWatcher[] = [];

function write(path: string, value: unknown): void {
    expect(resolve(path).startsWith(resolve(root) + sep)).toBe(true);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(value));
}

function fetched(timestamp: number): void {
    write(claudeAccountFile(account.dir), { cachedUsageUtilization: { fetchedAtMs: timestamp } });
}

beforeEach(() => {
    root = scratchDir('oculus-refresh-');
    expect(resolve(root).startsWith(resolve(tmpdir()) + sep)).toBe(true);
    vi.stubEnv('HOME', root);
    vi.stubEnv('CLAUDE_CONFIG_DIR', join(root, '.claude'));
    account = { tool: 'claude', dir: join(root, 'a', '.claude'), label: 'University' };
    at = NOW;
    fetched(NOW - 1);
});

afterEach(() => {
    for (const watcher of watchers.splice(0)) watcher.close();
    vi.useRealTimers();
    vi.unstubAllEnvs();
    rmSync(root, { recursive: true, force: true });
});

/**
 * A tmux with named sessions, a screen, and an account file that moves when Enter follows /usage.
 */
function tmux(present = false) {
    const sessions = new Set<string>(present ? [NAME] : []);
    const stub = {
        calls: [] as string[][],
        /** Whether the single-account session exists; `sessions` holds every name. */
        get present(): boolean {
            return sessions.has(NAME);
        },
        set present(value: boolean) {
            if (value) sessions.add(NAME);
            else sessions.delete(NAME);
        },
        sessions,
        startsFail: false,
        updates: true,
        screen: '> ',
        /** The screen once /usage has been typed; undefined leaves `screen` as it is. */
        afterKeys: undefined as string | undefined,
        run: (args: string[]): Promise<string> => {
            stub.calls.push(args);
            if (args[0] === 'new-session') {
                if (stub.startsFail) throw new Error('start failed');
                sessions.add(args[3]);
                stub.screen = '> ';
            }
            if (args[0] === 'kill-session') {
                if (!sessions.has(args[2])) throw new Error("can't find session");
                sessions.delete(args[2]);
            }
            if (args[0] === 'capture-pane') return Promise.resolve(stub.screen);
            if (
                args[0] === 'send-keys' &&
                args.at(-1) === '/usage' &&
                stub.afterKeys !== undefined
            ) {
                stub.screen = stub.afterKeys;
            }
            if (args[0] === 'send-keys' && args.at(-1) === 'Enter' && stub.updates) fetched(at + 1);
            return Promise.resolve('');
        }
    };
    return stub;
}

function watcher(stub: ReturnType<typeof tmux>, options: Partial<UsageRefreshOptions> = {}) {
    const result = watchUsageRefresh({
        accounts: [account],
        hub: root,
        claudeBin: BIN,
        model: MODEL,
        refreshMin: 10,
        run: stub.run,
        now: () => at,
        pause: (ms) => {
            at += ms;
            return Promise.resolve();
        },
        ...options
    });
    watchers.push(result);
    return result;
}

const kill = ['kill-session', '-t', NAME];
const capture = ['capture-pane', '-p', '-t', NAME];

describe('one-shot Claude usage refresher', () => {
    it('starts the default folder with the variable unset, so its home-folder account file is read', () => {
        const home = { tool: 'claude', dir: join(root, '.claude'), label: 'Home' } as const;
        mkdirSync(home.dir, { recursive: true });
        expect(usageStartArgs(home, root, BIN, MODEL).at(-1)).toBe(
            "'env' '-u' 'CLAUDE_CONFIG_DIR' '/opt/Claude Code/claude' '--model' 'haiku' '--name' 'oculus-usage-home'"
        );
    });

    it('starts a session, types /usage at the prompt, reads a newer account file and kills the session', async () => {
        const stub = tmux();
        stub.afterKeys = 'No sheet words anywhere';
        const refresh = watcher(stub);
        await refresh.ready;
        expect(usageSessionName(account)).toBe(NAME);
        expect(usageStartArgs(account, root, BIN, MODEL)).toEqual([
            'new-session',
            '-d',
            '-s',
            NAME,
            '-c',
            root,
            '-x',
            '80',
            '-y',
            '24',
            '--',
            "'env' 'CLAUDE_CONFIG_DIR=" +
                account.dir +
                "' '/opt/Claude Code/claude' '--model' 'haiku' '--name' 'oculus-usage-university'"
        ]);
        expect(stub.calls).toEqual([
            kill,
            usageStartArgs(account, root, BIN, MODEL),
            capture,
            ['send-keys', '-t', NAME, '-l', '--', '/usage'],
            ['send-keys', '-t', NAME, '--', 'Enter'],
            kill
        ]);
        expect(refresh.state(account)).toEqual({
            state: 'running',
            since: new Date(NOW).toISOString(),
            reason: '',
            lastRefresh: new Date(NOW).toISOString(),
            renewed: true
        });
        expect(stub.present).toBe(false);
    });

    it('kills a session of its name left behind before starting its own', async () => {
        const stub = tmux(true);
        const refresh = watcher(stub);
        await refresh.ready;
        expect(stub.calls.slice(0, 2)).toEqual([kill, usageStartArgs(account, root, BIN, MODEL)]);
        expect(refresh.state(account).state).toBe('running');
        expect(stub.present).toBe(false);
    });

    it('uses distinct labels for accounts whose directories share a basename', () => {
        const second = { ...account, dir: join(root, 'b', '.claude'), label: 'Work / Lab' };
        expect(usageSessionName(account)).toBe(NAME);
        expect(usageSessionName(second)).toBe('oculus-usage-work-lab');
    });

    it('polls the account file and the screen until the file moves past the keys timestamp', async () => {
        const stub = tmux();
        stub.updates = false;
        fetched(NOW);
        const pauses: number[] = [];
        const refresh = watcher(stub, {
            pause: (ms) => {
                at += ms;
                pauses.push(ms);
                if (pauses.length === 2) fetched(at);
                return Promise.resolve();
            }
        });
        await refresh.ready;
        expect(pauses).toEqual([USAGE_POLL_MS, USAGE_POLL_MS]);
        expect(refresh.state(account)).toMatchObject({ state: 'running', renewed: true });
        // One capture for the prompt wait before the keys, then one per poll for the sheet words.
        expect(stub.calls.filter((args) => args[0] === 'capture-pane')).toEqual([
            capture,
            capture,
            capture
        ]);
        expect(stub.calls.at(-1)).toEqual(kill);
    });

    it('types /usage only once the prompt shows, and gives up after 30 seconds without one', async () => {
        const stub = tmux();
        const screens = ['', 'Loading', '> '];
        stub.screen = '';
        const original = stub.run;
        stub.run = async (args: string[]) => {
            if (args[0] === 'capture-pane' && screens.length > 1)
                stub.screen = screens.shift() ?? '> ';
            else if (args[0] === 'capture-pane') stub.screen = '> ';
            return original(args);
        };
        const refresh = watcher(stub, { run: stub.run });
        await refresh.ready;
        const first = stub.calls.findIndex((args) => args[0] === 'send-keys');
        const captures = stub.calls.slice(0, first).filter((args) => args[0] === 'capture-pane');
        expect(captures.length).toBeGreaterThanOrEqual(2);
        expect(refresh.state(account).state).toBe('running');

        const silent = tmux();
        const quiet = silent.run;
        silent.run = async (args: string[]) =>
            args[0] === 'capture-pane' ? (silent.calls.push(args), 'Loading') : quiet(args);
        const stuck = watcher(silent, { run: silent.run });
        await stuck.ready;
        expect(at).toBeGreaterThan(NOW);
        expect(stuck.state(account)).toMatchObject({ state: 'down', reason: 'prompt_missing' });
        expect(silent.calls.some((args) => args[0] === 'send-keys')).toBe(false);
        expect(silent.present).toBe(false);
    });

    it('succeeds on the usage sheet alone and says the figures were not renewed', async () => {
        const stub = tmux();
        stub.updates = false;
        stub.afterKeys = 'Settings  Status  Usage\nCurrent week (Fable)\n12% used';
        const refresh = watcher(stub);
        await refresh.ready;
        expect(at - NOW).toBe(USAGE_RENEW_WAIT_MS);
        expect(refresh.state(account)).toMatchObject({
            state: 'running',
            lastRefresh: new Date(at).toISOString(),
            renewed: false
        });
        expect(stub.calls.slice(-2)).toEqual([capture, kill]);
    });

    it('counts a file that moves shortly after the sheet as renewed', async () => {
        const stub = tmux();
        stub.updates = false;
        stub.afterKeys = 'Current week (Fable)\n12% used';
        let pauses = 0;
        const refresh = watcher(stub, {
            pause: (ms) => {
                at += ms;
                pauses += 1;
                if (pauses === 2) fetched(at);
                return Promise.resolve();
            }
        });
        await refresh.ready;
        expect(pauses).toBe(2);
        expect(refresh.state(account)).toMatchObject({ state: 'running', renewed: true });
    });

    it('starts one session per Claude account per tick, none for a Codex account, and leaves none', async () => {
        const stub = tmux();
        stub.afterKeys = 'Current week (Fable)\n1% used';
        const work = { tool: 'claude', dir: join(root, 'b', '.claude'), label: 'Work' } as const;
        const codex = { tool: 'codex', dir: join(root, '.codex'), label: 'Codex' } as const;
        write(claudeAccountFile(work.dir), { cachedUsageUtilization: { fetchedAtMs: NOW - 1 } });
        const refresh = watcher(stub, { accounts: [account, work, codex] });
        await refresh.ready;
        expect(
            stub.calls.filter((args) => args[0] === 'new-session').map((args) => args[3])
        ).toEqual([NAME, 'oculus-usage-work']);
        expect([...stub.sessions]).toEqual([]);
        expect(refresh.state(work).state).toBe('running');
        expect(refresh.state(codex)).toMatchObject({ state: 'down', reason: 'start_failed' });
    });

    it('publishes every state change through onChange', async () => {
        const stub = tmux();
        const seen: string[] = [];
        const refresh: UsageRefreshWatcher = watcher(stub, {
            onChange: () => seen.push(refresh.state(account).state)
        });
        await refresh.ready;
        expect(seen).toEqual(['refreshing', 'running']);
    });

    it.each([
        ['Please log in to continue', 'login_required'],
        ['Usage limit reached until 3pm', 'usage_limit']
    ])('recovers from %s on the next scheduled tick', async (screen, reason) => {
        vi.useFakeTimers();
        const stub = tmux();
        stub.updates = false;
        stub.afterKeys = screen;
        const refresh = watcher(stub);
        await refresh.ready;
        expect(refresh.state(account)).toMatchObject({ state: 'down', reason });
        expect(stub.present).toBe(false);
        stub.afterKeys = 'Current week (Fable)\n1% used';
        at += 600_000;
        await vi.advanceTimersByTimeAsync(600_000);
        expect(refresh.state(account).state).toBe('running');
        expect(stub.calls.filter((args) => args[0] === 'new-session')).toHaveLength(2);
    });

    it('caps an unchanged file at 15 seconds when neither the sheet nor a newer file appears', async () => {
        const stub = tmux();
        stub.updates = false;
        stub.afterKeys = '> ';
        const refresh = watcher(stub);
        await refresh.ready;
        expect(at - NOW).toBe(15_000);
        expect(USAGE_WAIT_MS).toBe(15_000);
        expect(refresh.state(account)).toMatchObject({
            state: 'down',
            reason: 'refresh_failed',
            lastRefresh: ''
        });
        expect(stub.calls.slice(-2)).toEqual([capture, kill]);
        expect(stub.present).toBe(false);
    });

    it('reads the prompt among the last lines, under the footer', () => {
        // The prompt sits above Claude Code's footer, within the last lines; a message anywhere on
        // the screen still names the reason before the prompt does.
        expect(
            hasPrompt('\u276f\u00a0Try something\n\u2500\u2500\n  Haiku 4.5\n  manual mode on\n')
        ).toBe(true);
        expect(hasPrompt('>\nNo internet connection\n\n')).toBe(true);
        expect(paneReason('>\nNo internet connection\n\n')).toBe('offline');
        expect(hasPrompt('No internet connection\n\u276f \n\n')).toBe(true);
        expect(hasPrompt('')).toBe(false);
    });

    it.each([
        ['Log in to Claude Code', 'login_required'],
        ['Usage limit reached', 'usage_limit'],
        ['>\nNo internet connection', 'offline'],
        ['Claude Code is not at its prompt', 'prompt_missing']
    ])(
        'diagnoses %s after the timeout and refreshes afresh on the next request',
        async (screen, reason) => {
            const stub = tmux();
            stub.afterKeys = screen;
            stub.updates = false;
            const refresh = watcher(stub);
            await refresh.ready;
            expect(refresh.state(account)).toMatchObject({ state: 'down', reason });
            expect(stub.calls.at(-1)).toEqual(kill);
            expect(stub.calls.filter((args) => args[0] === 'new-session')).toHaveLength(1);
            stub.updates = true;
            stub.afterKeys = undefined;
            await refresh.refresh(account.label);
            expect(stub.calls.filter((args) => args[0] === 'new-session')).toHaveLength(2);
            expect(refresh.state(account).state).toBe('running');
        }
    );

    it('preserves down since through failed scheduled and manual attempts', async () => {
        vi.useFakeTimers();
        const stub = tmux();
        stub.startsFail = true;
        const refresh = watcher(stub);
        await refresh.ready;
        const since = refresh.state(account).since;
        at += 600_000;
        await vi.advanceTimersByTimeAsync(600_000);
        expect(refresh.state(account)).toMatchObject({
            state: 'down',
            reason: 'start_failed',
            since
        });
        at += 1000;
        await refresh.refresh(account.label);
        expect(refresh.state(account).since).toBe(since);
        expect(stub.calls.filter((args) => args[0] === 'new-session')).toHaveLength(3);
        stub.startsFail = false;
        await refresh.refresh(account.label);
        expect(refresh.state(account).state).toBe('running');
        stub.startsFail = true;
        at += 1000;
        await refresh.refresh(account.label);
        expect(refresh.state(account).since).toBe(new Date(at).toISOString());
        expect(refresh.state(account).since).not.toBe(since);
    });

    it('runs once per configured cadence and leaves nothing resident, on close as well', async () => {
        vi.useFakeTimers();
        const stub = tmux();
        const refresh = watcher(stub, { refreshMin: 2 });
        await refresh.ready;
        expect(stub.present).toBe(false);
        await vi.advanceTimersByTimeAsync(120_000 - 1);
        expect(stub.calls.filter((args) => args.includes('/usage'))).toHaveLength(1);
        await vi.advanceTimersByTimeAsync(1);
        expect(stub.calls.filter((args) => args.includes('/usage'))).toHaveLength(2);
        refresh.close();
        await vi.advanceTimersByTimeAsync(120_000);
        expect(stub.calls.filter((args) => args.includes('/usage'))).toHaveLength(2);
        expect(stub.present).toBe(false);
    });

    it('serializes simultaneous refreshes, one session at a time', async () => {
        const stub = tmux();
        const refresh = watcher(stub);
        await Promise.all([refresh.ready, refresh.refresh(account.label)]);
        expect(stub.calls.filter((args) => args[0] === 'new-session')).toHaveLength(2);
        expect(stub.calls.filter((args) => args.includes('/usage'))).toHaveLength(2);
        expect(stub.present).toBe(false);
    });

    it('omits hidden status-line sessions from live usage while retaining normal sessions', () => {
        const status = join(root, 'status');
        write(join(status, '.claude', 'hidden.json'), { session_id: 'hidden', session_name: NAME });
        write(join(status, '.claude', 'normal.json'), {
            session_id: 'normal',
            session_name: 'Research'
        });
        const [result] = usageAccounts([account], {}, status, Date.now());
        expect(result.live.map((session) => session.sessionId)).toEqual(['normal']);
    });

    it('publishes the refresher state through watchUsage', async () => {
        const stub = tmux();
        const refresh = watcher(stub);
        await refresh.ready;
        const hub = new Hub();
        const usage = watchUsage(hub, {
            accounts: [account],
            tiers: {},
            usageRoot: join(root, 'status'),
            now: () => at,
            watchFolder: () => ({ close: noop }),
            refresherFor: refresh.state
        });
        try {
            await usage.refresh();
            const payload = hub.latest('usage')?.payload as UsagePayload;
            expect(payload.accounts[0].refresher).toEqual(refresh.state(account));
            stub.startsFail = true;
            await refresh.refresh(account.label);
            await usage.refresh();
            expect(
                (hub.latest('usage')?.payload as UsagePayload).accounts[0].refresher
            ).toMatchObject({ state: 'down', reason: 'start_failed' });
        } finally {
            usage.close();
        }
    });
});

function request(body: unknown, token = 'write-token', origin = 'http://127.0.0.1:8791'): Request {
    return new Request('http://127.0.0.1:8791/api/usage/refresh', {
        method: 'POST',
        headers: {
            host: '127.0.0.1:8791',
            origin,
            'content-type': 'application/json',
            'x-oculus-token': token
        },
        body: JSON.stringify(body)
    });
}

describe('usage refresh route', () => {
    it('refreshes exactly the requested account behind the write token', async () => {
        const labels: string[] = [];
        const server = contextFixture({ token: 'write-token' });
        const target: UsageRefreshTarget = {
            token: server.token,
            refresh: (label) => {
                labels.push(label);
                return Promise.resolve(label === 'University');
            }
        };
        const response = await handleUsageRefresh(request({ account: 'University' }), target);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ status: 'ok' });
        expect(labels).toEqual(['University']);
        expect(
            (await handleUsageRefresh(request({ account: 'University' }, 'bad'), target)).status
        ).toBe(403);
        expect(labels).toEqual(['University']);
        expect((await handleUsageRefresh(request({ account: 'Missing' }), target)).status).toBe(
            404
        );
    });

    it('rejects a cross-origin request before dispatch even with the correct token', async () => {
        const refresh = vi.fn(() => Promise.resolve(true));
        const server = contextFixture({ token: 'write-token' });
        const response = await handleUsageRefresh(
            request({ account: 'University' }, 'write-token', 'https://example.com'),
            { token: server.token, refresh }
        );
        expect(response.status).toBe(403);
        expect(refresh).not.toHaveBeenCalled();
    });
});

describe('paneReason', () => {
    it('names the message on the screen even when a prompt follows it', () => {
        expect(paneReason('Usage limit reached\n> ')).toBe('usage_limit');
        expect(paneReason('Please log in\n> ')).toBe('login_required');
        expect(paneReason('> ')).toBe('refresh_failed');
        expect(paneReason('')).toBe('prompt_missing');
    });
});
