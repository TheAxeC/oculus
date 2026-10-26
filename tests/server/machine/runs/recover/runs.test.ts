// Layer 4, server test. Whose a Recover run is (G115). On this Mac a fetch is found again after a
// restart by its pid file only while a process with that pid has the start time and the command
// the file records, and Stop signals only such a process; a run inside the server is its own
// dataset's. One row starts a real detached fetch, its curl a stand-in that waits, and finds and
// stops it from a server that has just started, the Recover watcher of each server pushing the
// run with its bytes and the first one pushing its end. On the cluster a fetch is the session of
// its hub and key on the socket `oculus-recover`, and a check or an unpack is the job whose id
// this Mac keeps; Stop names only the dataset's own session or job. The cluster's pushes are read
// from Live HPC's batch, whose section a row runs by `sh` over a scratch home, and between Live
// HPC's polls from the section read alone once a minute while a run on the cluster is followed.

import { existsSync, mkdirSync, readFileSync, watch, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, vi } from 'vitest';
import type { RecoverLive, RecoverLiveRun } from '../../../../../src/lib/data/model/index.ts';
import type { HpcPayload } from '../../../../../src/lib/data/model/index.ts';
import { Hub } from '../../../../../src/lib/server/core/channels.ts';
import {
    SEC_CONNECTED,
    SEC_RC,
    SEC_RECOVER,
    SEC_SACCT,
    SEC_SACCT_RC,
    SEC_SINFO
} from '../../../../../src/lib/server/machine/hpc/parse.ts';
import { watchHpc } from '../../../../../src/lib/server/machine/hpc/poll.ts';
import {
    clusterPlace,
    clusterState,
    stopCluster
} from '../../../../../src/lib/server/machine/runs/recover/cluster.ts';
import {
    localDeps,
    localPlace,
    localState,
    recoverFiles,
    startLocalFetch,
    startLocalVerify,
    stopLocal,
    type LocalDeps,
    type LocalRuns
} from '../../../../../src/lib/server/machine/runs/recover/local.ts';
import {
    watchRecover,
    type RecoverWatcher
} from '../../../../../src/lib/server/machine/runs/recover/live/watch.ts';
import type { PlanRow } from '../../../../../src/lib/server/machine/runs/recover/plan.ts';
import { it, scratchDir } from '../../../../fixtures/scratch.ts';
import { loginNode, shell, standIns, type Stand } from './harness.ts';

/** A process as the deps read it: its start time and its command line. */
type ProcessInfo = { start: string; command: string };

const LIVE: ProcessInfo = { start: 'Mon Oct 19 10:00:00 2026', command: 'sh /h/mitdb.fetch.sh' };

/** A missing file of the plan. */
const MISSING: PlanRow = {
    name: 'a.dat',
    size: 10,
    checksum: null,
    url: 'https://example.org/a.dat',
    source: 0,
    state: 'missing',
    have: 0
};

/**
 * This Mac's deps over a scratch home, with the process reading and the signal replaced, and the
 * end of a run inside the server as a promise.
 */
function macDeps(processOf: LocalDeps['processOf'], runs: LocalRuns = new Map()) {
    const signal = vi.fn();
    let told = (): void => undefined;
    const ended = new Promise<void>((resolve) => (told = resolve));
    const deps: LocalDeps = {
        ...localDeps(scratchDir('oculus-recover-home-'), runs, () => told()),
        processOf,
        signal,
        startDetached: vi.fn(() => 1)
    };
    return { deps, signal, ended };
}

/**
 * Resolves once a stand-in has recorded a call of the program: each change in the stand-ins'
 * folder, where the record is written, is the signal to read the record again.
 */
function called(stand: Stand, program: string): Promise<void> {
    return new Promise((resolve) => {
        const seen = (): boolean => stand.calls().some((one) => one.program === program);
        const watcher = watch(stand.bin, () => {
            if (!seen()) return;
            watcher.close();
            resolve();
        });
        if (!seen()) return;
        watcher.close();
        resolve();
    });
}

/** Resolves with the first `recover` push whose run of mitdb on this Mac the test takes. */
function pushed(channels: Hub, wanted: (run: RecoverLiveRun) => boolean): Promise<RecoverLiveRun> {
    return new Promise((resolve) => {
        channels.subscribe(
            {
                send: (text) => {
                    const message = JSON.parse(text) as { channel: string; payload: RecoverLive };
                    const run = message.payload.runs.find(
                        (one) => one.key === 'mitdb' && one.target === 'mac'
                    );
                    if (message.channel === 'recover' && run !== undefined && wanted(run)) {
                        resolve(run);
                    }
                    return Promise.resolve();
                },
                close: () => undefined
            },
            ['recover']
        );
    });
}

/** Write a pid file of a hub's dataset. */
function pidFile(
    home: string,
    hub: string,
    record: { pid: number; start: string; command: string }
) {
    const files = recoverFiles(home, hub, 'mitdb');
    mkdirSync(files.dir, { recursive: true });
    writeFileSync(files.pid, JSON.stringify(record));
}

type PidRow = {
    name: string;
    hub: string;
    record: { pid: number; start: string; command: string };
    now: ProcessInfo | null;
    running: boolean;
};

const PIDS: PidRow[] = [
    {
        name: 'a process with the pid, start and command of the file',
        hub: 'research-hub',
        record: { pid: 4242, ...LIVE },
        now: LIVE,
        running: true
    },
    {
        name: 'no process with the pid',
        hub: 'research-hub',
        record: { pid: 4242, ...LIVE },
        now: null,
        running: false
    },
    {
        name: 'the pid now of a process with another start time',
        hub: 'research-hub',
        record: { pid: 4242, ...LIVE },
        now: { ...LIVE, start: 'Mon Oct 19 11:00:00 2026' },
        running: false
    },
    {
        name: 'the pid now of a process with another command',
        hub: 'research-hub',
        record: { pid: 4242, ...LIVE },
        now: { ...LIVE, command: 'vim notes.md' },
        running: false
    },
    {
        name: 'a file that recorded no start time',
        hub: 'research-hub',
        record: { pid: 4242, start: '', command: '' },
        now: { start: '', command: '' },
        running: false
    },
    {
        name: 'the live fetch of mitdb in another hub',
        hub: 'other-hub',
        record: { pid: 4242, ...LIVE },
        now: LIVE,
        running: false
    }
];

describe('a Recover run on this Mac', () => {
    it.each(PIDS)('after a restart, a pid file naming $name', (one) => {
        const { deps, signal } = macDeps((pid) => (pid === 4242 ? one.now : null));
        pidFile(deps.home, one.hub, one.record);
        const place = localPlace(deps.home, 'research-hub', 'mitdb', '~/data/mitdb');
        if (place === null) throw new Error('the place is refused');
        expect(localState(place, deps)).toEqual(one.running ? { action: 'fetch' } : null);
        expect(stopLocal(place, deps)).toBe(one.running);
        expect(signal.mock.calls).toEqual(one.running ? [[4242]] : []);
        expect(startLocalFetch(place, [{ row: MISSING, resume: false }], [], deps)).toBe(
            one.running ? 'running' : null
        );
    });

    it("holds a check inside the server as its own dataset's, and Stop ends only that one", async () => {
        const runs: LocalRuns = new Map();
        const other = { action: 'unpack' as const, done: 0, total: 2, stop: vi.fn() };
        runs.set('research-hub/other', other);
        const { deps, signal, ended } = macDeps(() => null, runs);
        const place = localPlace(deps.home, 'research-hub', 'mitdb', '~/data/mitdb');
        if (place === null) throw new Error('the place is refused');
        mkdirSync(place.folder, { recursive: true });
        writeFileSync(`${place.folder}/a.dat`, '0123456789');
        const rows: PlanRow[] = [
            {
                ...MISSING,
                checksum: { kind: 'sha256', value: 'a'.repeat(64) },
                state: 'present',
                have: 10
            }
        ];
        expect(startLocalVerify(place, rows, deps)).toBeNull();
        expect(localState(place, deps)).toEqual({ action: 'verify', done: 0, total: 10 });
        expect(startLocalVerify(place, rows, deps)).toBe('running');
        expect(stopLocal(place, deps)).toBe(true);
        await ended;
        expect(runs.has('research-hub/mitdb')).toBe(false);
        expect(other.stop).not.toHaveBeenCalled();
        expect(runs.get('research-hub/other')).toBe(other);
        expect(signal).not.toHaveBeenCalled();
    });

    // The first server starts the fetch and is told of its end by the exit of the process it
    // started; the restarted one finds it by its pid file. Each wait is on a signal: the stand-in
    // curl's record written, and the first server's push of the run's end.
    it(
        'finds a real detached fetch again from a server that has just started, and stops it, pushing its bytes and its end',
        { tags: ['slow'], timeout: 30000 },
        async () => {
            const stand = standIns(['curl'], {}, { curl: 30 });
            vi.stubEnv('PATH', `${stand.bin}:${process.env.PATH ?? ''}`);
            const home = scratchDir('oculus-recover-home-');
            const place = localPlace(home, 'research-hub', 'mitdb', '~/data/mitdb');
            if (place === null) throw new Error('the place is refused');
            const files = recoverFiles(home, 'research-hub', 'mitdb');
            mkdirSync(files.dir, { recursive: true });
            writeFileSync(files.list, JSON.stringify({ recipe: '', files: [MISSING] }));
            mkdirSync(place.folder, { recursive: true });
            writeFileSync(join(place.folder, 'a.dat'), '0123');
            const options = {
                home,
                places: () => [{ hub: 'research-hub', key: 'mitdb', path: '~/data/mitdb' }],
                hubs: () => ['research-hub'],
                pollCluster: () => undefined,
                readCluster: () => undefined
            };
            const channels = new Hub();
            const first = watchRecover(channels, options);
            const later = new Hub();
            let second: RecoverWatcher | null = null;
            let pid = 0;
            try {
                const started = called(stand, 'curl');
                expect(
                    startLocalFetch(place, [{ row: MISSING, resume: false }], [], first.local)
                ).toBeNull();
                first.changed('research-hub', 'mitdb', 'mac');
                await started;
                const running = await pushed(channels, (one) => one.state === 'running');
                expect(running).toMatchObject({
                    run: { action: 'fetch' },
                    bytes: 4,
                    size: 10,
                    rate: null
                });
                const record = JSON.parse(readFileSync(files.pid, 'utf8')) as {
                    pid: number;
                    start: string;
                    command: string;
                };
                pid = record.pid;
                expect(record.start).not.toBe('');

                second = watchRecover(later, options);
                expect(await pushed(later, (one) => one.state === 'running')).toMatchObject({
                    run: { action: 'fetch' },
                    bytes: 4
                });
                const ended = pushed(channels, (one) => one.state === 'ended');
                expect(stopLocal(place, second.local)).toBe(true);
                const end = await ended;
                expect(end).toMatchObject({ run: null, bytes: 4, size: 10 });
                // The shell's own line of the signal may land before or after Stop's line.
                expect(end.log.filter((line) => line.endsWith(' fetch: stopped'))).toHaveLength(1);
                expect(localState(place, second.local)).toBeNull();
                expect(stopLocal(place, second.local)).toBe(false);
                expect(existsSync(files.script)).toBe(false);
            } finally {
                vi.unstubAllEnvs();
                first.close();
                second?.close();
                if (pid > 0 && first.local.processOf(pid) !== null) process.kill(-pid, 'SIGKILL');
            }
        }
    );
});

type ClusterRow = {
    name: string;
    hub: string;
    sessions: string;
    job: string | null;
    queue: string;
    state: unknown;
    stopped: boolean;
    stop: string[][];
};

const CLUSTER: ClusterRow[] = [
    {
        name: 'its session on the socket: a fetch, Stop ends that session by its exact name',
        hub: 'research-hub',
        sessions: 'research-hub-mitdb',
        job: null,
        queue: '',
        state: { action: 'fetch' },
        stopped: true,
        stop: [['tmux', '-L', 'oculus-recover', 'kill-session', '-t', '=research-hub-mitdb']]
    },
    {
        name: 'the session of mitdb in another hub: no run, Stop names nothing',
        hub: 'other-hub',
        sessions: 'research-hub-mitdb',
        job: null,
        queue: '',
        state: null,
        stopped: false,
        stop: []
    },
    {
        name: 'a session whose name only starts with its own: no run',
        hub: 'research-hub',
        sessions: 'research-hub-mitdb2',
        job: null,
        queue: '',
        state: null,
        stopped: false,
        stop: []
    },
    {
        name: 'its job still in the queue: a check, Stop cancels that job',
        hub: 'research-hub',
        sessions: '',
        job: '4567',
        queue: 'RUNNING',
        state: { action: 'verify', job: '4567' },
        stopped: true,
        stop: [['scancel', '4567']]
    },
    {
        name: 'its job no longer in the queue: no run',
        hub: 'research-hub',
        sessions: '',
        job: '4567',
        queue: '',
        state: null,
        stopped: false,
        stop: []
    }
];

describe('a Recover run on the cluster', () => {
    it.each(CLUSTER)('$name', { tags: ['slow'] }, async (one) => {
        const answers: Record<string, string> = {};
        if (one.sessions !== '') answers.tmux = one.sessions;
        if (one.queue !== '') answers.squeue = one.queue;
        const stand = standIns(['tmux', 'squeue', 'scancel'], answers);
        const node = loginNode(stand);
        if (one.job !== null) {
            const files = recoverFiles(node.deps.home, one.hub, 'mitdb');
            mkdirSync(files.dir, { recursive: true });
            writeFileSync(
                `${files.dir}/mitdb.job.json`,
                JSON.stringify({ id: one.job, action: 'verify' })
            );
        }
        const place = clusterPlace(one.hub, 'mitdb', '~/data/mitdb');
        if (place === null) throw new Error('the place is refused');
        expect(await clusterState(place, node.deps)).toEqual(one.state);
        const before = stand.calls().length;
        expect(await stopCluster(place, node.deps)).toBe(one.stopped);
        const stops = stand
            .calls()
            .slice(before)
            .filter((call) => call.args.includes('kill-session') || call.program === 'scancel')
            .map((call) => [call.program, ...call.args]);
        expect(stops).toEqual(one.stop);
    });

    // Three Live HPC polls, each running Recover's section by `sh` over the login node's scratch
    // home: the first lists the session, which the watcher follows from then on, the second reads
    // its folder's bytes and its log, and the third finds no session and pushes the end.
    it(
        "pushes a fetch on the login node with its folder's bytes and log, and its end",
        { tags: ['slow'] },
        () => {
            const options = {
                home: scratchDir('oculus-recover-mac-'),
                places: () => [{ hub: 'research-hub', key: 'mitdb', path: '~/data/mitdb' }],
                hubs: () => ['research-hub'],
                pollCluster: () => undefined,
                readCluster: () => undefined
            };
            const channels = new Hub();
            const watcher = watchRecover(channels, options);
            const going = standIns(['tmux', 'du'], { tmux: 'research-hub-mitdb', du: '4096\t/x' });
            const node = loginNode(going);
            mkdirSync(join(node.remoteHome, 'data', 'mitdb'), { recursive: true });
            writeFileSync(
                join(node.remoteHome, 'data', 'mitdb', 'recover.log'),
                '2026-10-19T10:00:00Z fetch: 1 files\n'
            );
            const poll = (stand: Stand): RecoverLive => {
                watcher.section.take(
                    shell(watcher.section.command(), stand, node.remoteHome).stdout,
                    []
                );
                return channels.latest('recover')?.payload as RecoverLive;
            };
            try {
                const first = poll(going);
                expect(first.sessions).toEqual([
                    { hub: 'research-hub', key: 'mitdb', done: 4096, total: null, rate: null }
                ]);
                expect(first.runs).toMatchObject([
                    { target: 'cluster', state: 'running', run: { action: 'fetch' }, bytes: 4096 }
                ]);
                expect(poll(going).runs).toMatchObject([
                    {
                        state: 'running',
                        bytes: 4096,
                        log: ['2026-10-19T10:00:00Z fetch: 1 files']
                    }
                ]);
                const ended = poll(standIns(['tmux', 'du']));
                expect(ended.sessions).toEqual([]);
                expect(ended.runs).toMatchObject([
                    { state: 'ended', run: null, log: ['2026-10-19T10:00:00Z fetch: 1 files'] }
                ]);
            } finally {
                watcher.close();
            }
        }
    );

    it('reads the section alone once a minute while a run on the cluster is followed, and stops at its end', () => {
        vi.useFakeTimers();
        const readCluster = vi.fn();
        const channels = new Hub();
        const watcher = watchRecover(channels, {
            home: scratchDir('oculus-recover-mac-'),
            places: () => [{ hub: 'research-hub', key: 'mitdb', path: '~/data/mitdb' }],
            hubs: () => ['research-hub'],
            pollCluster: () => undefined,
            readCluster
        });
        try {
            vi.advanceTimersByTime(120000);
            expect(readCluster).not.toHaveBeenCalled();
            watcher.changed('research-hub', 'mitdb', 'cluster');
            vi.advanceTimersByTime(120000);
            expect(readCluster).toHaveBeenCalledTimes(2);
            // An answer that lists no session and no job of the dataset ends what was followed.
            watcher.section.take('', []);
            vi.advanceTimersByTime(120000);
            expect(readCluster).toHaveBeenCalledTimes(2);
        } finally {
            watcher.close();
            vi.useRealTimers();
        }
    });

    it("runs Recover's section alone with the queue while Live HPC's last poll was answered, and nothing otherwise", async () => {
        const batch = { stdout: `${SEC_RC}0\n${SEC_SACCT}\n${SEC_SINFO}\n`, stderr: '', code: 0 };
        const job =
            '123|research-hub-mitdb-verify|main|RUNNING|0:10|1:00:00|1|1|N/A|4G|100|N/A|node1';
        const alone = `${job}\n${SEC_RC}0\n${SEC_RECOVER}\n@@oculus:session research-hub-mitdb\n`;
        // ssh connected and `squeue` answered, and `sacct` exited 1: the queue is this poll's.
        const partial = {
            stdout: `${SEC_CONNECTED}\n${job}\n${SEC_RC}0\n${SEC_SACCT}\n${SEC_SACCT_RC}1\n${SEC_SINFO}\n`,
            stderr: '',
            code: 0
        };
        // ssh connected and `squeue` exited 1: the status is `slurm_down`, as in the partial
        // answer, and the queue is not this poll's, so Slurm is not asked again.
        const squeueFailed = {
            stdout: `${SEC_CONNECTED}\n${SEC_RC}1\n${SEC_SACCT}\n${SEC_SACCT_RC}1\n${SEC_SINFO}\n`,
            stderr: '',
            code: 0
        };
        const unreachable = { stdout: '', stderr: 'no route', code: 255 };
        // The polls take the answers in order, the watcher's own first poll the first, and the last
        // answer repeats; recover() reads the payload of the last poll. The clock moves a minute
        // before each refresh, so a later poll's `updated` is never an earlier poll's `lastOk`.
        const ask = async (...answers: { stdout: string; stderr: string; code: number }[]) => {
            const calls: string[] = [];
            let polls = 0;
            const take = vi.fn();
            const hub = new Hub();
            vi.useFakeTimers({ toFake: ['Date'] });
            const watcher = watchHpc(hub, {
                host: 'cluster',
                days: 1,
                pollMin: 20,
                quotaMin: 60,
                prewarm: false,
                words: { sshExited: 'ssh exited {0}', slurmLate: 'late', overrun: 'overrun' },
                recover: { command: () => 'echo section', take },
                runner: (_host, command) => {
                    calls.push(command);
                    if (command.startsWith('quota')) {
                        return Promise.resolve({ stdout: '', stderr: '', code: 1 });
                    }
                    if (command.includes(SEC_SACCT))
                        return Promise.resolve(answers[Math.min(polls++, answers.length - 1)]);
                    return Promise.resolve({ stdout: alone, stderr: '', code: 0 });
                }
            });
            try {
                for (const _answer of answers) {
                    vi.setSystemTime(Date.now() + 60000);
                    await watcher.refresh();
                }
                take.mockClear();
                const before = calls.length;
                await watcher.recover();
                const status = (hub.latest('hpc')?.payload as HpcPayload).status;
                return { status, sent: calls.slice(before), take: take.mock.calls };
            } finally {
                watcher.close();
                vi.useRealTimers();
            }
        };

        // After a good poll, a poll whose `squeue` exited 1 keeps that poll's queue: `lastOk` is
        // the earlier poll's and `updated` this one's, so the queue is not this poll's either.
        for (const [answers, status] of [
            [[squeueFailed], 'slurm_down'],
            [[unreachable], 'unreachable'],
            [[batch, squeueFailed], 'slurm_down']
        ] as const) {
            const read = await ask(...answers);
            expect(read.status).toBe(status);
            expect(read.sent).toEqual([]);
            expect(read.take).toEqual([]);
        }

        for (const [answer, status] of [
            [batch, 'ok'],
            [partial, 'slurm_down']
        ] as const) {
            const read = await ask(answer);
            expect(read.status).toBe(status);
            expect(read.sent).toHaveLength(1);
            expect(read.sent[0]).toContain('squeue --me');
            expect(read.sent[0]).toContain('echo section');
            expect(read.sent[0]).not.toContain('sacct');
            expect(read.take).toHaveLength(1);
            expect(read.take[0][0]).toBe('@@oculus:session research-hub-mitdb\n');
            expect(read.take[0][1]).toMatchObject([{ id: '123', state: 'RUNNING' }]);
        }
    });
});
