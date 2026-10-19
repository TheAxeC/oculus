// Layer 2, server. The Recover watcher, which publishes the `recover` channel: each run it has
// read, with its target, state, bytes, rate and last log lines, and the login node's sessions for
// Live HPC's Login node section. The page polls nothing; the Recover view and the Login node
// section draw these pushes.
//
// On this Mac it reads every EVERY_MS, while a run it follows goes, each such dataset's run (the
// process its pid file names, or the check or unpack inside the server), the bytes its folder holds
// of each file of the kept listing, and its log. A run is followed from the answered POST that
// starts it, and at server start when a pid file names a live process; the end of a run this
// server started is pushed when it ends (its process's exit, the end of its check or unpack), and
// that of any other at the next reading.
//
// On the cluster it reads what each Live HPC poll answered of Recover's section (batch.ts): the
// sessions on the socket with their folders' bytes, and for each dataset it follows the bytes, the
// log, and whether its session or its job (by the id kept here, against the poll's queue) still
// runs. A dataset is followed on the cluster from a press on it, from a session the poll lists, and
// at server start when a job record is kept; a press asks Live HPC for a poll at once. While a run
// on the cluster is followed, the section is also read alone every CLUSTER_MS, with the queue, so
// a download reads live between Live HPC's polls.

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import type {
    HpcJob,
    RecoverLive,
    RecoverLiveRun,
    RecoverRun,
    RecoverSession
} from '../../../../../data/model/index.ts';
import type { Hub } from '../../../../core/channels.ts';
import type { HpcSection } from '../../../hpc/poll.ts';
import { clusterPlace, readJob, sessionName } from '../cluster.ts';
import { readKept, type RemoteFile } from '../files.ts';
import {
    diskOf,
    localDeps,
    localPlace,
    localState,
    recoverFiles,
    type LocalDeps,
    type LocalRuns
} from '../local.ts';
import { validName } from '../plan.ts';
import { readSection, sectionCommand, sessionOwner } from './batch.ts';
import { logTail } from './log.ts';

/** How often the runs followed on this Mac are read while one goes. */
const EVERY_MS = 3000;

/** How often Recover's section is read alone while a run on the cluster is followed. */
const CLUSTER_MS = 60000;

/** A dataset Recover runs: its hub, its key and its `path:`. */
type RecoverPlace = { hub: string; key: string; path: string | undefined };

/** What the watcher is handed; the context passes the real value of each. */
export type RecoverWatchOptions = {
    home: string;
    /** The datasets Recover runs, from the latest portfolio. */
    places: () => RecoverPlace[];
    /** The names of the workspace's hubs. */
    hubs: () => string[];
    /** Ask Live HPC for a poll now. */
    pollCluster: () => void;
    /** Ask Live HPC to read Recover's section alone now, with the queue. */
    readCluster: () => void;
    /** This Mac's process reading and starting, replaced in a test. */
    local?: Partial<Pick<LocalDeps, 'processOf' | 'startDetached' | 'signal' | 'startUnpack'>>;
};

export type RecoverWatcher = {
    /** This Mac's deps: the runs inside the server, and the end of a run told to the watcher. */
    local: LocalDeps;
    /** A press on a dataset was answered: follow its run there and push. */
    changed: (hub: string, key: string, where: 'mac' | 'cluster') => void;
    /** The channel's version, which a GET answers with. */
    version: () => number;
    /** Recover's section of the Live HPC batch. */
    section: HpcSection;
    close: () => void;
};

/** The reading of a run, besides its state. */
type Reading = Pick<RecoverLiveRun, 'bytes' | 'size' | 'rate' | 'growing' | 'log'>;

/** The files of the listing kept for a dataset on this Mac, or null when none is kept. */
function keptFiles(home: string, hub: string, key: string): RemoteFile[] | null {
    return readKept(recoverFiles(home, hub, key).list)?.files ?? null;
}

/** The bytes a listing names, or null with no listing. */
function sizeOf(files: RemoteFile[] | null): number | null {
    return files === null ? null : files.reduce((sum, one) => sum + (one.size ?? 0), 0);
}

/** Bytes per second between two readings, or null when there is no reading before. */
function rateOf(now: number, before: number | undefined, seconds: number): number | null {
    return before === undefined || seconds <= 0 ? null : Math.max(0, (now - before) / seconds);
}

/** A dataset's hub and key from its `<hub>/<key>`. */
function parts(id: string): { hub: string; key: string } {
    const at = id.indexOf('/');
    return { hub: id.slice(0, at), key: id.slice(at + 1) };
}

export function watchRecover(channels: Hub, options: RecoverWatchOptions): RecoverWatcher {
    const runs: LocalRuns = new Map();
    const local: LocalDeps = {
        ...localDeps(options.home, runs, (hub, key) => {
            if (mac.has(`${hub}/${key}`)) tick();
        }),
        ...options.local
    };
    /** Every run read so far, by `<target>:<hub>/<key>`; an ended one keeps its last reading. */
    const rows = new Map<string, RecoverLiveRun>();
    /** The datasets followed on each machine, by `<hub>/<key>`. */
    const mac = new Set<string>();
    const cluster = new Set<string>();
    /** The bytes of each listed file at the last reading on this Mac, and its time, by dataset. */
    const read = new Map<string, { at: number; have: Map<string, number> }>();
    /** The bytes of each session's folder at the last reading of the section, and its time. */
    let sessionBytes = new Map<string, number>();
    let clusterAt = 0;
    let sessions: RecoverSession[] | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let clusterTimer: ReturnType<typeof setInterval> | null = null;
    let closed = false;

    const placeOf = (id: string): RecoverPlace | undefined =>
        options.places().find((one) => `${one.hub}/${one.key}` === id);

    /** Keep a run's reading; answers whether it still runs. An end is kept only after a run. */
    function put(target: 'mac' | 'cluster', id: string, run: RecoverRun | null, reading: Reading) {
        const before = rows.get(`${target}:${id}`);
        if (run === null && before?.state !== 'running') return false;
        rows.set(`${target}:${id}`, {
            ...parts(id),
            target,
            state: run === null ? 'ended' : 'running',
            run,
            ...reading,
            version: channels.nextVersion('recover')
        });
        return run !== null;
    }

    /** Read one dataset followed on this Mac; answers whether its run still goes. */
    function readMac(id: string, now: number): boolean {
        const { hub, key } = parts(id);
        const folder = localPlace(options.home, hub, key, placeOf(id)?.path)?.folder ?? null;
        const run = localState({ hub, key, folder: folder ?? '' }, local);
        const listed = keptFiles(options.home, hub, key);
        const names = (listed ?? []).map((one) => one.name);
        const disk = folder === null ? diskOf('', []) : diskOf(folder, names);
        const have = new Map(names.map((name) => [name, disk.get(name)?.size ?? 0]));
        const bytes = (listed ?? []).reduce(
            (sum, one) => sum + Math.min(have.get(one.name) ?? 0, one.size ?? Infinity),
            0
        );
        const before = read.get(id);
        const seconds = before === undefined ? 0 : (now - before.at) / 1000;
        const growing = names.flatMap((name) => {
            const was = before?.have.get(name);
            const rate = rateOf(have.get(name) ?? 0, was, seconds);
            return rate === null || was === have.get(name)
                ? []
                : [{ name, have: have.get(name) ?? 0, rate }];
        });
        const prior = rows.get(`mac:${id}`);
        read.set(id, { at: now, have });
        return put('mac', id, run, {
            bytes,
            size: sizeOf(listed),
            rate: prior?.state === 'running' ? rateOf(bytes, prior.bytes, seconds) : null,
            growing,
            log: logTail(recoverFiles(options.home, hub, key).log)
        });
    }

    function publish(): void {
        const payload: RecoverLive = { runs: [...rows.values()], sessions };
        channels.publish('recover', payload);
    }

    /** The timer runs while a run on this Mac is followed, and stops with the last. */
    function arm(): void {
        if (mac.size === 0 || closed) {
            if (timer !== null) clearInterval(timer);
            timer = null;
            return;
        }
        if (timer !== null) return;
        timer = setInterval(tick, EVERY_MS);
        timer.unref();
    }

    /** The cluster's timer runs while a run on the cluster is followed, and stops with the last. */
    function armCluster(): void {
        if (cluster.size === 0 || closed) {
            if (clusterTimer !== null) clearInterval(clusterTimer);
            clusterTimer = null;
            return;
        }
        if (clusterTimer !== null) return;
        clusterTimer = setInterval(options.readCluster, CLUSTER_MS);
        clusterTimer.unref();
    }

    function tick(): void {
        if (closed) return;
        const now = Date.now();
        for (const id of [...mac]) {
            if (!readMac(id, now)) {
                mac.delete(id);
                read.delete(id);
            }
        }
        publish();
        arm();
    }

    /** Read what one Live HPC poll answered of the section, with the poll's queue. */
    function take(text: string, jobs: HpcJob[]): void {
        if (closed) return;
        const now = Date.now();
        const answer = readSection(text);
        const seconds = clusterAt === 0 ? 0 : (now - clusterAt) / 1000;
        clusterAt = now;
        const hubs = options.hubs();
        sessions = answer.sessions.map((one) => {
            const owner = sessionOwner(one.name, hubs);
            const id = `${owner.hub}/${owner.key}`;
            if (owner.hub === '' || !validName(owner.key) || placeOf(id) === undefined) {
                return { ...owner, done: 0, total: null, rate: null };
            }
            cluster.add(id);
            const done = one.bytes ?? 0;
            return {
                ...owner,
                done,
                total: sizeOf(keptFiles(options.home, owner.hub, owner.key)),
                rate: rateOf(done, sessionBytes.get(one.name), seconds)
            };
        });
        sessionBytes = new Map(answer.sessions.map((one) => [one.name, one.bytes ?? 0]));
        const listed = new Set(answer.sessions.map((one) => one.name));
        for (const id of [...cluster]) {
            const { hub, key } = parts(id);
            const job = readJob(options.home, { hub, key, folder: '' });
            const queued = job !== null && jobs.some((one) => one.id === job.id) ? job : null;
            const run: RecoverRun | null = listed.has(sessionName(hub, key))
                ? { action: 'fetch' }
                : queued === null
                  ? null
                  : { action: queued.action, job: queued.id };
            const prior = rows.get(`cluster:${id}`);
            const section = answer.runs.get(id);
            const bytes =
                section?.bytes ?? sessionBytes.get(sessionName(hub, key)) ?? prior?.bytes ?? 0;
            const going = put('cluster', id, run, {
                bytes,
                size: sizeOf(keptFiles(options.home, hub, key)),
                rate: prior?.state === 'running' ? rateOf(bytes, prior.bytes, seconds) : null,
                growing: [],
                log: section?.log ?? prior?.log ?? []
            });
            if (!going) cluster.delete(id);
        }
        publish();
        armCluster();
    }

    /** The section's commands for the next poll: every dataset's session, the followed runs. */
    function command(): string {
        const places = options
            .places()
            .flatMap((one) => clusterPlace(one.hub, one.key, one.path) ?? []);
        const followed = places.filter((one) => cluster.has(`${one.hub}/${one.key}`));
        return sectionCommand(places, followed, options.home);
    }

    /** At server start: a fetch whose pid file names a live process, and every job record kept. */
    function resume(): void {
        const root = join(options.home, '.oculus', 'recover');
        const entries = (dir: string): string[] => {
            try {
                return readdirSync(dir);
            } catch {
                return [];
            }
        };
        for (const hub of entries(root).filter(validName)) {
            for (const name of entries(join(root, hub))) {
                const pid = /^(.+)\.pid$/.exec(name)?.[1];
                if (pid !== undefined && validName(pid)) {
                    const place = { hub, key: pid, folder: '' };
                    if (localState(place, local) !== null) mac.add(`${hub}/${pid}`);
                }
                const job = /^(.+)\.job\.json$/.exec(name)?.[1];
                if (job !== undefined && validName(job)) cluster.add(`${hub}/${job}`);
            }
        }
    }

    resume();
    armCluster();
    if (mac.size > 0) {
        tick();
    } else {
        publish();
    }

    return {
        local,
        changed(hub, key, where): void {
            if (closed) return;
            if (where === 'mac') {
                mac.add(`${hub}/${key}`);
                tick();
                return;
            }
            cluster.add(`${hub}/${key}`);
            armCluster();
            options.pollCluster();
        },
        version: () => channels.version('recover'),
        section: { command, take },
        close(): void {
            closed = true;
            arm();
            armCluster();
            for (const one of runs.values()) one.stop();
        }
    };
}
