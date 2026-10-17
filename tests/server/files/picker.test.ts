// Layer 4, server test. POST /api/folders/pick with a runner standing in for the folder panel
// (server/files/fs/picker.ts): a missing token, the end of a panel when its connection or its
// server closes, the answer of a cancel and of any other failure, the desktop app's sheet, which
// the state's `ask` stands in for, and the panel program of Linux and of a platform with none. No
// test opens a panel: the runner and the `ask` are always the test's own, and each wait is on a
// turn of the event loop.

import { EventEmitter } from 'node:events';
import { homedir, tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { TOKEN_HEADER } from '../../../src/lib/server/core/auth.ts';
import {
    closePicker,
    handlePick,
    pickerState,
    type PickConnection,
    type PickerState,
    type PickRunner
} from '../../../src/lib/server/files/fs/picker.ts';

const TOKEN = 'a-picker-token';

/** One post of the route's body to the handler, with the token unless the case drops it. */
async function pick(
    runner: PickRunner,
    over: {
        state?: ReturnType<typeof pickerState>;
        platform?: NodeJS.Platform;
        token?: boolean;
        connection?: PickConnection;
        body?: unknown;
    } = {}
) {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (over.token !== false) headers[TOKEN_HEADER] = TOKEN;
    const request = new Request('http://localhost/api/folders/pick', {
        method: 'POST',
        headers,
        body: JSON.stringify(over.body ?? {})
    });
    const response = await handlePick(request, TOKEN, over.state ?? pickerState(), {
        platform: over.platform ?? 'darwin',
        run: runner,
        connection: over.connection
    });
    return {
        status: response.status,
        headers: response.headers,
        body: (await response.json()) as unknown
    };
}

const printing =
    (out: string, code = 0, err = ''): PickRunner =>
    () =>
        Promise.resolve({ code, out, err });

/**
 * A panel the reader never answers: it runs until its signal aborts, then exits as killed, and with
 * a signal aborted already it never runs, as execFile does.
 */
function waiting() {
    const panel = { started: false, ended: false };
    const runner: PickRunner = (_argv, signal) =>
        new Promise((resolve) => {
            const kill = (): void => {
                panel.ended = true;
                resolve({ code: null, out: '', err: '' });
            };
            if (signal.aborted) {
                kill();
                return;
            }
            panel.started = true;
            signal.addEventListener('abort', kill);
        });
    return { panel, runner };
}

/** Whether `answer` settles before the event loop's next turn. */
function settledNow(answer: Promise<unknown>): Promise<string> {
    return Promise.race([
        answer.then(() => 'answered'),
        new Promise<string>((resolve) => setImmediate(() => resolve('still open')))
    ]);
}

/** Let the handler read the body and start the runner. */
const started = () => new Promise((resolve) => setImmediate(resolve));

/** The connection a request came on, which a case closes by emitting `close`. */
function connectionOf(destroyed = false) {
    return Object.assign(new EventEmitter(), { destroyed });
}

describe('the folder panel route', () => {
    it('refuses a request without the token with a 403, before it runs anything', async () => {
        const answer = await pick(printing('/a\n'), { token: false });
        expect(answer.status).toBe(403);
        expect(answer.headers.get('cache-control')).toBe('no-store');
    });

    it('ends the panel when the connection the request came on closes, and a new press opens one', async () => {
        const state = pickerState();
        const connection = connectionOf();
        const { panel, runner } = waiting();
        const answer = pick(runner, { state, connection });
        await started();
        expect(panel.started).toBe(true);
        connection.emit('close');
        expect(await settledNow(answer)).toBe('answered');
        expect(panel.ended).toBe(true);
        expect(connection.listenerCount('close')).toBe(0);
        const again = await pick(printing('/a\n'), { state });
        expect(again).toMatchObject({ status: 200, body: { ok: true, paths: ['/a'] } });
    });

    it('never opens the panel when the connection closed before it would open', async () => {
        const connection = connectionOf(true);
        const { panel, runner } = waiting();
        const answer = pick(runner, { connection });
        await started();
        expect(await settledNow(answer)).toBe('answered');
        expect(panel).toEqual({ started: false, ended: true });
        expect(connection.listenerCount('close')).toBe(0);
    });

    it('ends the open panel when its server closes', async () => {
        const state = pickerState();
        const { panel, runner } = waiting();
        const answer = pick(runner, { state });
        await started();
        closePicker(state);
        expect(await settledNow(answer)).toBe('answered');
        expect(panel.ended).toBe(true);
    });

    it('opens the panel at the folder asked for, for one folder when one is asked for', async () => {
        const scripts: string[] = [];
        const runner: PickRunner = (argv) => {
            scripts.push(argv[argv.length - 1]);
            return Promise.resolve({ code: 0, out: '/chosen\n', err: '' });
        };
        const answer = await pick(runner, { body: { start: tmpdir(), single: true } });
        expect(answer).toMatchObject({ status: 200, body: { ok: true, paths: ['/chosen'] } });
        await pick(runner);
        expect(scripts[0]).toContain(`fileURLWithPath(${JSON.stringify(tmpdir())})`);
        expect(scripts[0]).toContain('allowsMultipleSelection = false');
        expect(scripts[1]).toContain('fileURLWithPath($.NSHomeDirectory())');
        expect(scripts[1]).toContain('allowsMultipleSelection = true');
        // Drawn above every window and taking the keyboard, before the modal run.
        for (const script of scripts) {
            const lines = script.split('\n');
            const run = lines.findIndex((line) => line.includes('panel.runModal'));
            const before = lines.slice(0, run);
            expect(before).toContain('panel.level = 8;');
            expect(before).toContain('panel.makeKeyAndOrderFront(null);');
            expect(before).toContain('$.NSApplication.sharedApplication.setActivationPolicy(1);');
        }
    });

    it('hands the desktop sheet the options of the request, and drops a start that is no folder of this machine', async () => {
        const asked: unknown[] = [];
        const state: PickerState = {
            ...pickerState(),
            ask: (options) => {
                asked.push(options);
                return Promise.resolve(['/sheet']);
            }
        };
        await pick(printing(''), { state, body: { start: tmpdir(), single: true } });
        await pick(printing(''), { state, body: { start: '/no/such/folder', single: 'yes' } });
        expect(asked).toEqual([{ start: tmpdir(), single: true }, {}]);
    });

    it('answers a panel the reader cancelled, which osascript reports as error -128, as no folders', async () => {
        const answer = await pick(
            printing('', 1, 'execution error: Error: User canceled. (-128)\n')
        );
        expect(answer).toMatchObject({ status: 200, body: { ok: true, paths: [] } });
    });

    it('answers any other non-zero exit as failed', async () => {
        const answer = await pick(
            printing('', 1, 'execution error: Error: Not allowed. (-1743)\n')
        );
        expect(answer).toMatchObject({ status: 500, body: { error: 'failed' } });
    });

    it('stops waiting on the desktop sheet when the connection closes, and a new press asks again', async () => {
        const sheets: ((chosen: string[] | null) => void)[] = [];
        const state: PickerState = {
            ...pickerState(),
            ask: () =>
                new Promise<string[] | null>((resolve) => {
                    sheets.push(resolve);
                })
        };
        const connection = connectionOf();
        const answer = pick(printing(''), { state, connection });
        await started();
        expect(sheets).toHaveLength(1);
        connection.emit('close');
        expect(await settledNow(answer)).toBe('answered');
        expect(state.panel).toBeNull();
        expect(await answer).toMatchObject({ status: 500, body: { error: 'failed' } });

        const again = pick(printing(''), { state });
        await started();
        expect(sheets).toHaveLength(2);
        sheets[0](['/old']);
        sheets[1](['/new']);
        expect(await again).toMatchObject({ status: 200, body: { ok: true, paths: ['/new'] } });
    });
});

describe('the folder panel on Linux', () => {
    it('runs zenity for folders at the folder asked for, several unless one is asked for, and answers the chosen folders', async () => {
        const runs: (readonly string[])[] = [];
        const runner: PickRunner = (argv) => {
            runs.push(argv);
            return Promise.resolve({ code: 0, out: '/home/a/one\n/home/a/two\n', err: '' });
        };
        const several = await pick(runner, { platform: 'linux', body: { start: tmpdir() } });
        const one = await pick(runner, { platform: 'linux', body: { single: true } });
        expect(several).toMatchObject({
            status: 200,
            body: { ok: true, paths: ['/home/a/one', '/home/a/two'] }
        });
        expect(one).toMatchObject({ status: 200, body: { ok: true } });
        expect(runs[0]).toEqual([
            'zenity',
            '--file-selection',
            '--directory',
            `--filename=${tmpdir()}/`,
            '--multiple',
            '--separator=\n'
        ]);
        expect(runs[1]).toEqual([
            'zenity',
            '--file-selection',
            '--directory',
            `--filename=${homedir()}/`
        ]);
    });

    it('answers that no folder panel is installed when zenity is missing', async () => {
        const missing: PickRunner = () =>
            Promise.resolve({ code: 1, out: '', err: '', missing: true });
        const answer = await pick(missing, { platform: 'linux' });
        expect(answer).toMatchObject({ status: 400, body: { error: 'no-picker' } });
    });

    it('answers a panel the reader cancelled, which zenity reports as exit 1 with nothing printed, as no folders', async () => {
        const answer = await pick(printing('', 1), { platform: 'linux' });
        expect(answer).toMatchObject({ status: 200, body: { ok: true, paths: [] } });
    });

    it('answers unsupported on a platform with no panel program and no parent to ask', async () => {
        const answer = await pick(printing('/a\n'), { platform: 'win32' });
        expect(answer).toMatchObject({ status: 400, body: { error: 'unsupported' } });
    });
});
