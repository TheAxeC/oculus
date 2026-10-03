// Layer 4, test. The ssh runner and the poller against a stub `ssh` this file writes into its own
// temporary directory and puts first on PATH: the runner spawns `ssh` by name, so every case here
// exercises the real spawn, the real budget and the real kill path without a connection existing.
//
// Five cases: the connect options the poll uses, a command that never returns, a command that
// ignores the polite signal, and the two stderr lines a dead multiplexed master and a route that
// has gone answer with.
//
// A kill case holds the runner to ending a child within the grace after the budget, and every other
// term of that bound is measured in the same run rather than assumed, because a loaded machine
// charges for each of them. The fork and the exec that get a stub as far as recording its pid cost
// more than a fixed 250 ms budget on a loaded machine, and a child killed before it recorded
// anything is a child the case can never watch; a probe of the same stub measures that cost, the
// budget is read from it, and an attempt that still found no child gives the next one twice as
// long. The signal, the death and the reap cost again, which the same probe measures by ending it
// politely. A callback that is already due is run late, which the runner's escalation and the look
// that sees the result both pay, so the worst lateness a timer of a known step suffered over the
// wait is added twice.
//
// Those measured terms are also what the bound cannot see past: an escalation later than the grace
// by less than their sum passes. How much that is belongs to the machine, not to this file. Against
// a grace of 2000 ms they sum to 43 to 61 ms at a load average of 17, reach 190 ms at a load
// average of 26, and reach 555 to 768 ms at load averages of 37 to 98, where the escalation itself
// runs 173 to 214 ms late. So a bound further from the grace than CEILING_MS is never passed: past
// it a run cannot tell a kill on time from one a tenth of the grace late, which is the regression
// these cases are here for. Such a run is spoiled by the machine rather than evidence about the
// runner, so the measurement is taken again, and a case where every attempt came out that dear is
// red about the machine, which is worth more than a green that could not have caught the
// regression.
//
// The file can also go red for a machine of its own: the probe spends up to WATCH_MS waiting for a
// pid and up to WATCH_MS again on the reap, and the budget that follows starts at twice what the
// probe cost, so a slow enough machine runs a case past its timeout. That is a slow machine rather
// than a slow runner, and it reads as a red of this file either way.
// @module-tag slow: its cases spawn stub ssh and wait for real kills, so npm test leaves it out.
import { spawn } from 'node:child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect } from 'vitest';
import type { HpcPayload } from '../../../../src/lib/data/model/index.ts';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import { watchHpc } from '../../../../src/lib/server/machine/hpc/poll.ts';
import { KILL_GRACE_MS, run } from '../../../../src/lib/server/machine/hpc/ssh.ts';
import { it, scratchDir } from '../../../fixtures/scratch.ts';

const PATH_BEFORE = process.env.PATH ?? '';
const options = { host: 'fixture', days: 3, pollMin: 20, quotaMin: 60, prewarm: false };

/** How often a case looks for the kill, and the step the slack meter times itself against. */
const STEP_MS = 20;

/** The shortest budget a kill case gives a stub, whatever the probe measured. */
const BUDGET_FLOOR_MS = 250;

/** How many budgets a kill case spends looking for a child before it gives up on the machine. */
const ATTEMPTS = 4;

/** How long a look for the kill keeps looking, past any bound a case holds, so a kill that never
 * comes is red about the kill rather than about the clock. */
const WATCH_MS = KILL_GRACE_MS * 4;

/** How far from the grace a bound may sit and a green still be worth having: a tenth of the grace,
 * which is what an escalation slower than the constant shows up as. */
const CEILING_MS = KILL_GRACE_MS / 10;

/** A directory of this case's own, which is the only place a case writes. */
const made: string[] = [];
function caseDir(): string {
    const dir = scratchDir('oculus-ssh-');
    made.push(dir);
    return dir;
}

/** Write an executable stub of the given body into the case's own directory. */
function stubFile(dir: string, name: string, body: string[]): string {
    const file = join(dir, name);
    writeFileSync(file, ['#!/bin/sh', ...body, ''].join('\n'), { mode: 0o755 });
    return file;
}

/** Put a stub `ssh` of the given body in front of the machine's on PATH. */
function stubSsh(dir: string, body: string[]): void {
    stubFile(dir, 'ssh', body);
    process.env.PATH = `${dir}:${PATH_BEFORE}`;
}

/** The body of a stub that records its pid and then outlives any budget a case gives it. */
function recordsPid(pidFile: string, ignoresTerm: boolean): string[] {
    const lines = [`echo $$ > ${JSON.stringify(pidFile)}`, 'exec sleep 20'];
    return ignoresTerm ? ["trap '' TERM", ...lines] : lines;
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

/** A running measurement of the machine: the worst lateness so far, and the way to stop it. */
type Meter = { worst: () => number; stop: () => void };

/**
 * A timer of a known step, rescheduled until it is stopped, that keeps the worst it ran late by.
 *
 * What it measures is what the machine costs a callback that is already due, which is a term every
 * bound over a kill needs and the one a number written into the case would be guessing at.
 */
function slackMeter(stepMs: number): Meter {
    let worst = 0;
    let due = performance.now() + stepMs;
    const tick = (): void => {
        const late = performance.now() - due;
        if (late > worst) worst = late;
        due = performance.now() + stepMs;
        timer = setTimeout(tick, stepMs);
    };
    let timer: ReturnType<typeof setTimeout> | null = setTimeout(tick, stepMs);
    return {
        worst: () => worst,
        stop: () => {
            if (timer !== null) clearTimeout(timer);
            timer = null;
        }
    };
}

/**
 * What a look for the kill answers: whether it came, when it was seen, and the lateness measured.
 */
type Kill = { seen: boolean; afterMs: number; slackMs: number };

/** What this machine charges a case, measured by a probe of the case's own stub. */
type Cost = { execMs: number; reapMs: number; slackMs: number };

/** Waits for a stub to record its pid, and answers whether it did so inside the ceiling. */
async function pidUp(pidFile: string): Promise<boolean> {
    const from = performance.now();
    while (!existsSync(pidFile) && performance.now() - from < WATCH_MS) {
        await new Promise<void>((go) => {
            setTimeout(go, STEP_MS);
        });
    }
    return existsSync(pidFile);
}

/**
 * Looks for the stub's pid to go, timing from the moment the caller took, and measures the machine
 * over the same wait. It gives up at the ceiling and answers what it saw, so a case says whether
 * the kill came and how long it took rather than a runner timing out over it.
 */
async function killSeen(pidFile: string, from: number): Promise<Kill> {
    const meter = slackMeter(STEP_MS);
    try {
        let seen = gone(pidFile);
        while (!seen && performance.now() - from < WATCH_MS) {
            await new Promise<void>((go) => {
                setTimeout(go, STEP_MS);
            });
            seen = gone(pidFile);
        }
        return { seen, afterMs: performance.now() - from, slackMs: meter.worst() };
    } finally {
        meter.stop();
    }
}

/**
 * Spawns a stub of the shape the kill cases run and measures the two costs they cannot assume: how
 * long this machine takes to get it as far as recording its pid, and how long a polite signal to it
 * takes to show as gone. It refuses a probe that outlived the signal, since a cost measured on a
 * child that never went would be the ceiling rather than the machine, and would widen every bound
 * read from it.
 */
async function machineCost(dir: string): Promise<Cost> {
    const pidFile = join(dir, 'probe-pid');
    rmSync(pidFile, { force: true });
    const probe = stubFile(dir, 'probe', recordsPid(pidFile, false));
    const meter = slackMeter(STEP_MS);
    const spawned = performance.now();
    const child = spawn(probe);
    const up = await pidUp(pidFile);
    const execMs = performance.now() - spawned;
    const signalled = performance.now();
    child.kill('SIGTERM');
    const seen = await killSeen(pidFile, signalled);
    meter.stop();
    if (!up) throw new Error('the probe never recorded its pid, so it measured nothing');
    if (!seen.seen) throw new Error('the probe outlived the polite signal, so it measured nothing');
    return { execMs, reapMs: seen.afterMs, slackMs: Math.max(meter.worst(), seen.slackMs) };
}

/**
 * Runs the stub under a budget the probe's measurement sets, and answers what became of the child.
 *
 * The budget is twice what the probe took, since one sample of a cost that varies is a floor rather
 * than a bound, and an attempt whose child never recorded its pid says the machine wanted more than
 * it was given, so the next attempt doubles again. A budget too short costs an attempt and proves
 * nothing either way; what the caller is handed comes from an attempt whose child was there.
 */
async function killAfterBudget(
    dir: string,
    body: (pidFile: string) => string[],
    cost: Cost
): Promise<Kill> {
    let budget = Math.max(BUDGET_FLOOR_MS, Math.ceil(cost.execMs * 2));
    for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
        const pidFile = join(dir, `pid-${attempt}`);
        stubSsh(dir, body(pidFile));
        await expect(run('fixture', 'squeue', budget)).rejects.toThrow('timeout');
        const from = performance.now();
        if (existsSync(pidFile)) return killSeen(pidFile, from);
        budget *= 2;
    }
    throw new Error(`no child of ${ATTEMPTS} attempts recorded its pid before its budget ran out`);
}

/**
 * The longest the kill may take after the rejection: the grace the runner promises, the step
 * between two looks, what a signal and a reap cost this machine, and the lateness it charged twice,
 * once to the runner's escalation and once to the look that saw the result of it.
 */
function killBound(cost: Cost, kill: Kill): number {
    return KILL_GRACE_MS + STEP_MS + cost.reapMs + 2 * Math.max(cost.slackMs, kill.slackMs);
}

/** A kill measured under a bound worth a green: the measurement, its cost, and the bound it met. */
type Proven = { kill: Kill; cost: Cost; bound: number };

/**
 * The kill, held to a bound near enough to the grace to be worth a green, measured again where the
 * machine charged more for it than that.
 *
 * Every term of the bound but the grace grows with the load, and past the ceiling a bound cannot
 * tell a kill on time from one a tenth of the grace late. An attempt the machine spoiled that way
 * says nothing about the runner, so it is taken again with the cost measured afresh; where every
 * attempt is spoiled the case is red and says the machine was too loaded, rather than green on a
 * bound that would have missed the regression it is here for.
 */
async function provenKill(dir: string, body: (pidFile: string) => string[]): Promise<Proven> {
    let over = 0;
    for (let attempt = 1; attempt <= ATTEMPTS; attempt += 1) {
        const cost = await machineCost(dir);
        const kill = await killAfterBudget(dir, body, cost);
        const bound = killBound(cost, kill);
        over = bound - KILL_GRACE_MS;
        if (over <= CEILING_MS) return { kill, cost, bound };
    }
    throw new Error(`too loaded to prove the kill: ${Math.round(over)}ms over the grace`);
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

    // This child honours the polite signal, so it is gone at the budget and the escalation never
    // runs: what holds here is that the runner ends the child and leaves nothing behind. The bound
    // is an outer limit the run clears by most of the grace, and the case below is the one that
    // proves the escalation.
    it('rejects a command that never returns at the budget and leaves no child behind', async () => {
        const dir = caseDir();
        const cost = await machineCost(dir);
        const kill = await killAfterBudget(dir, (pidFile) => recordsPid(pidFile, false), cost);
        expect(kill.seen).toBe(true);
        expect(kill.afterMs).toBeLessThanOrEqual(killBound(cost, kill));
    }, 30000);

    // The case the escalation is proven in: this child ignores the polite signal, so nothing but
    // the escalation ends it, and the bound it is held to is the one a green is worth something at.
    it('rejects a command that ignores SIGTERM at the budget and ends it within the grace', async () => {
        const dir = caseDir();
        const proven = await provenKill(dir, (pidFile) => recordsPid(pidFile, true));
        expect(proven.kill.seen).toBe(true);
        expect(proven.kill.afterMs).toBeLessThanOrEqual(proven.bound);
    }, 60000);

    it.each([
        ['a dead master line', 'mux_client_request_session: read from master failed'],
        ['a timed out connect line', 'ssh: connect to host fixture port 22: Operation timed out']
    ])(
        'publishes unreachable with %s as the hint',
        async (_name, line) => {
            const dir = caseDir();
            stubSsh(dir, [`echo "${line}" >&2`, 'exit 255']);
            const hub = new Hub();
            const watcher = watchHpc(hub, options);
            await watcher.refresh();
            watcher.close();
            expect(held(hub).status).toBe('unreachable');
            expect(held(hub).hint).toBe(line);
        },
        20000
    );
});
