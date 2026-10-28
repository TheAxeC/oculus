// Layer 2, server. The Recover watcher, which publishes the `recover` channel: each run it has
// read, with its target, state, bytes, rate and last log lines, and each cluster's login node
// sessions for that cluster's Login node section of Live HPC. The page polls nothing; the Recover
// view and the Login node sections draw these pushes.
//
// On this Mac it reads every EVERY_MS, while a run it follows goes, each such dataset's run (the
// process its pid file names, or the check or unpack inside the server), the bytes its folder holds
// of each file of the kept listing, and its log. A run is followed from the answered POST that
// starts it, and at server start when a pid file names a live process; the end of a run this
// server started is pushed when it ends (its process's exit, the end of its check or unpack), and
// that of any other at the next reading.
//
// On each cluster of `slurm.resource` it reads what each Live HPC poll of that cluster answered of
// Recover's section (batch.ts): the sessions on the socket with their folders' bytes, and for each
// dataset it follows there the bytes, the log, and whether its session or its job (by the id kept
// here for that cluster, against the poll's queue) still runs. A dataset is followed on a cluster
// from a press on it there, from a session that cluster's poll lists, and at server start when a
// job record of that cluster is kept; a press asks that cluster's Live HPC watcher for a poll at
// once. While a run on a cluster is followed, that cluster's section is also read alone every
// CLUSTER_MS, with the queue, so a download reads live between Live HPC's polls.

import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
    MAC_TARGET as MAC,
    type HpcJob,
    type RecoverLive,
    type RecoverLiveRun,
    type RecoverRun,
    type RecoverSession
} from '../../../../../data/model/index.ts';
import type { Hub } from '../../../../core/channels.ts';
import type { HpcSection } from '../../../hpc/poll.ts';
import { clusterPlace, jobFolder, jobsRoot, readJob, sessionName } from '../cluster.ts';
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

/** How often a cluster's section is read alone while a run on that cluster is followed. */
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
    /** Ask the Live HPC watcher of the cluster `resource` for a poll now. */
    pollCluster: (resource: string) => void;
    /** Ask the Live HPC watcher of the cluster `resource` to read Recover's section alone now. */
    readCluster: (resource: string) => void;
    /** This Mac's process reading and starting, replaced in a test. */
    local?: Partial<Pick<LocalDeps, 'processOf' | 'startDetached' | 'signal' | 'startUnpack'>>;
};

export type RecoverWatcher = {
    /** This Mac's deps: the runs inside the server, and the end of a run told to the watcher. */
    local: LocalDeps;
    /**
     * A press on a dataset was answered: follow its run where it runs (`mac`, or the key of a
     * cluster) and push.
     */
    changed: (hub: string, key: string, where: string) => void;
    /** The channel's version, which a GET answers with. */
    version: () => number;
    /** Recover's section of the Live HPC batch of the cluster `resource`. */
    section: (resource: string) => HpcSection;
    close: () => void;
};

/** The reading of a run, besides its state. */
type Reading = Pick<RecoverLiveRun, 'bytes' | 'size' | 'rate' | 'growing' | 'log'>;

/** What is followed on one cluster, and its last reading. */
type ClusterFollow = {
    /** The datasets followed there, by `<hub>/<key>`. */
    followed: Set<string>;
    /** The bytes of each session's folder at the last reading of the section, and its time. */
    sessionBytes: Map<string, number>;
    at: number;
    timer: ReturnType<typeof setInterval> | null;
};

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

/** The entries of a folder, or none when it cannot be read. */
function entries(dir: string): string[] {
    try {
        return readdirSync(dir);
    } catch {
        return [];
    }
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
    /** The datasets followed on this Mac, by `<hub>/<key>`. */
    const mac = new Set<string>();
    /** What is followed on each cluster, by its key. */
    const clusters = new Map<string, ClusterFollow>();
    /** The bytes of each listed file at the last reading on this Mac, and its time, by dataset. */
    const read = new Map<string, { at: number; have: Map<string, number> }>();
    /** Each cluster's sessions at the last reading of its section. */
    const sessions: Record<string, RecoverSession[]> = {};
    let timer: ReturnType<typeof setInterval> | null = null;
    let closed = false;

    const placeOf = (id: string): RecoverPlace | undefined =>
        options.places().find((one) => `${one.hub}/${one.key}` === id);

    /** What is followed on the cluster `resource`, made empty on first use. */
    function followOf(resource: string): ClusterFollow {
        let one = clusters.get(resource);
        if (one === undefined) {
            one = { followed: new Set(), sessionBytes: new Map(), at: 0, timer: null };
            clusters.set(resource, one);
        }
        return one;
    }

    /** Keep a run's reading; answers whether it still runs. An end is kept only after a run. */
    function put(target: string, id: string, run: RecoverRun | null, reading: Reading) {
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
        const prior = rows.get(`${MAC}:${id}`);
        read.set(id, { at: now, have });
        return put(MAC, id, run, {
            bytes,
            size: sizeOf(listed),
            rate: prior?.state === 'running' ? rateOf(bytes, prior.bytes, seconds) : null,
            growing,
            log: logTail(recoverFiles(options.home, hub, key).log)
        });
    }

    function publish(): void {
        const payload: RecoverLive = { runs: [...rows.values()], sessions: { ...sessions } };
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

    /** A cluster's timer runs while a run on it is followed, and stops with the last. */
    function armCluster(resource: string): void {
        const one = followOf(resource);
        if (one.followed.size === 0 || closed) {
            if (one.timer !== null) clearInterval(one.timer);
            one.timer = null;
            return;
        }
        if (one.timer !== null) return;
        one.timer = setInterval(() => options.readCluster(resource), CLUSTER_MS);
        one.timer.unref();
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

    /** Read what one Live HPC poll of the cluster answered of the section, with its queue. */
    function take(resource: string, text: string, jobs: HpcJob[]): void {
        if (closed) return;
        const follow = followOf(resource);
        const now = Date.now();
        const answer = readSection(text);
        const seconds = follow.at === 0 ? 0 : (now - follow.at) / 1000;
        follow.at = now;
        const hubs = options.hubs();
        sessions[resource] = answer.sessions.map((one) => {
            const owner = sessionOwner(one.name, hubs);
            const id = `${owner.hub}/${owner.key}`;
            if (owner.hub === '' || !validName(owner.key) || placeOf(id) === undefined) {
                return { ...owner, done: 0, total: null, rate: null };
            }
            follow.followed.add(id);
            const done = one.bytes ?? 0;
            return {
                ...owner,
                done,
                total: sizeOf(keptFiles(options.home, owner.hub, owner.key)),
                rate: rateOf(done, follow.sessionBytes.get(one.name), seconds)
            };
        });
        follow.sessionBytes = new Map(answer.sessions.map((one) => [one.name, one.bytes ?? 0]));
        const listed = new Set(answer.sessions.map((one) => one.name));
        for (const id of [...follow.followed]) {
            const { hub, key } = parts(id);
            const job = readJob(options.home, { hub, key, folder: '' }, resource);
            const queued = job !== null && jobs.some((one) => one.id === job.id) ? job : null;
            const run: RecoverRun | null = listed.has(sessionName(hub, key))
                ? { action: 'fetch' }
                : queued === null
                  ? null
                  : { action: queued.action, job: queued.id };
            const prior = rows.get(`${resource}:${id}`);
            const section = answer.runs.get(id);
            const bytes =
                section?.bytes ??
                follow.sessionBytes.get(sessionName(hub, key)) ??
                prior?.bytes ??
                0;
            const going = put(resource, id, run, {
                bytes,
                size: sizeOf(keptFiles(options.home, hub, key)),
                rate: prior?.state === 'running' ? rateOf(bytes, prior.bytes, seconds) : null,
                growing: [],
                log: section?.log ?? prior?.log ?? []
            });
            if (!going) follow.followed.delete(id);
        }
        publish();
        armCluster(resource);
    }

    /** The section's commands for the cluster's next poll: every session, its followed runs. */
    function command(resource: string): string {
        const followed = clusters.get(resource)?.followed ?? new Set<string>();
        const places = options
            .places()
            .flatMap((one) => clusterPlace(one.hub, one.key, one.path) ?? []);
        const mine = places.filter((one) => followed.has(`${one.hub}/${one.key}`));
        return sectionCommand(places, mine, options.home, resource);
    }

    /** At server start: a fetch whose pid file names a live process, and every job record kept. */
    function resume(): void {
        const root = join(options.home, '.oculus', 'recover');
        for (const hub of entries(root).filter(validName)) {
            for (const name of entries(join(root, hub))) {
                const pid = /^(.+)\.pid$/.exec(name)?.[1];
                if (pid !== undefined && validName(pid)) {
                    const place = { hub, key: pid, folder: '' };
                    if (localState(place, local) !== null) mac.add(`${hub}/${pid}`);
                }
            }
            for (const resource of entries(jobsRoot(options.home, hub)).filter(validName)) {
                for (const name of entries(jobFolder(options.home, hub, resource))) {
                    const job = /^(.+)\.job\.json$/.exec(name)?.[1];
                    if (job !== undefined && validName(job)) {
                        followOf(resource).followed.add(`${hub}/${job}`);
                    }
                }
            }
        }
    }

    resume();
    for (const resource of clusters.keys()) armCluster(resource);
    if (mac.size > 0) {
        tick();
    } else {
        publish();
    }

    return {
        local,
        changed(hub, key, where): void {
            if (closed) return;
            if (where === MAC) {
                mac.add(`${hub}/${key}`);
                tick();
                return;
            }
            followOf(where).followed.add(`${hub}/${key}`);
            armCluster(where);
            options.pollCluster(where);
        },
        version: () => channels.version('recover'),
        section: (resource) => ({
            command: () => command(resource),
            take: (text, jobs) => take(resource, text, jobs)
        }),
        close(): void {
            closed = true;
            arm();
            for (const resource of clusters.keys()) armCluster(resource);
            for (const one of runs.values()) one.stop();
        }
    };
}
