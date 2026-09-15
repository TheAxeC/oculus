// Layer 4, test. The ssh runner and the poller against a stub `ssh` this file writes into its own
// temporary directory and puts first on PATH: the runner spawns `ssh` by name, so every case here
// exercises the real spawn, the real budget and the real kill path without a connection existing.
//
// Five cases: the connect options the poll uses, a command that never returns, a command that
// ignores the polite signal, and the two stderr lines a dead multiplexed master and a route that
// has gone answer with.
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import type { HpcPayload } from '../../../src/lib/data/model.ts';
import { Hub } from '../../../src/lib/server/channels.ts';
import { watchHpc } from '../../../src/lib/server/hpc/poll.ts';
import { KILL_GRACE_MS, run } from '../../../src/lib/server/hpc/ssh.ts';

const PATH_BEFORE = process.env.PATH ?? '';
const options = { host: 'fixture', days: 3, pollMin: 20, quotaMin: 60, prewarm: false };

/** A directory of this case's own, which is the only place a case writes. */
const made: string[] = [];
function caseDir(): string {
    const dir = mkdtempSync(join(tmpdir(), 'oculus-ssh-'));
    made.push(dir);
    return dir;
}

/** Put a stub `ssh` of the given body in front of the machine's on PATH. */
function stubSsh(dir: string, body: string[]): void {
    const file = join(dir, 'ssh');
    writeFileSync(file, ['#!/bin/sh', ...body, ''].join('\n'), { mode: 0o755 });
    process.env.PATH = `${dir}:${PATH_BEFORE}`;
}

/** Whether a pid still exists; a child Node has reaped answers false. */
function alive(pid: number): boolean {
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
}

/** True once the stub has recorded its pid and that pid is gone. */
function gone(pidFile: string): boolean {
    if (!existsSync(pidFile)) return false;
    const pid = Number(readFileSync(pidFile, 'utf8').trim());
    return Number.isFinite(pid) && pid > 0 && !alive(pid);
}

/** The payload the hub currently holds on the hpc channel. */
function held(hub: Hub): HpcPayload {
    return hub.latest('hpc')?.payload as HpcPayload;
}

afterEach(() => {
    process.env.PATH = PATH_BEFORE;
    for (const dir of made.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('the ssh runner under a stub cluster', () => {
    it('connects without the user shared master', async () => {
        const dir = caseDir();
        const argv = join(dir, 'argv');
        stubSsh(dir, [`printf '%s\\n' "$@" > ${JSON.stringify(argv)}`]);
        await run('fixture', 'squeue', 5000);
        const given = readFileSync(argv, 'utf8').split('\n');
        expect(given).toContain('ControlMaster=no');
        expect(given).toContain('ControlPath=none');
        expect(given).toContain('ConnectTimeout=8');
        expect(given).toContain('BatchMode=yes');
        expect(given[given.length - 2]).toBe('squeue');
    }, 20000);

    it('rejects a command that never returns at the budget and leaves no child behind', async () => {
        const dir = caseDir();
        const pidFile = join(dir, 'pid');
        stubSsh(dir, [`echo $$ > ${JSON.stringify(pidFile)}`, 'exec sleep 20']);
        await expect(run('fixture', 'squeue', 250)).rejects.toThrow('timeout');
        await expect
            // A child that honours the signal is gone at once; the bound leaves room for a loaded machine
            // to reap it and still fails on a child that lived past the grace.
            .poll(() => gone(pidFile), { timeout: KILL_GRACE_MS + 3000, interval: 100 })
            .toBe(true);
    }, 20000);

    it('rejects a command that ignores SIGTERM at the budget and ends it within the grace', async () => {
        const dir = caseDir();
        const pidFile = join(dir, 'pid');
        stubSsh(dir, ["trap '' TERM", `echo $$ > ${JSON.stringify(pidFile)}`, 'exec sleep 20']);
        await expect(run('fixture', 'squeue', 250)).rejects.toThrow('timeout');
        // The grace itself, plus a second for the signal and the reap, and not a round number that
        // would still pass if the escalation were slower than the constant says.
        await expect
            .poll(() => gone(pidFile), { timeout: KILL_GRACE_MS + 1000, interval: 100 })
            .toBe(true);
    }, 20000);

    it('publishes unreachable with a dead master line as the hint', async () => {
        const dir = caseDir();
        stubSsh(dir, [
            'echo "mux_client_request_session: read from master failed" >&2',
            'exit 255'
        ]);
        const hub = new Hub();
        const watcher = watchHpc(hub, options);
        await watcher.refresh();
        watcher.close();
        expect(held(hub).status).toBe('unreachable');
        expect(held(hub).hint).toBe('mux_client_request_session: read from master failed');
    }, 20000);

    it('publishes unreachable with a timed out connect line as the hint', async () => {
        const dir = caseDir();
        stubSsh(dir, [
            'echo "ssh: connect to host fixture port 22: Operation timed out" >&2',
            'exit 255'
        ]);
        const hub = new Hub();
        const watcher = watchHpc(hub, options);
        await watcher.refresh();
        watcher.close();
        expect(held(hub).status).toBe('unreachable');
        expect(held(hub).hint).toBe('ssh: connect to host fixture port 22: Operation timed out');
    }, 20000);
});
