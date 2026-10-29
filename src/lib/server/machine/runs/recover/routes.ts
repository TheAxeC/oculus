// Layer 2, server. The /api/recover endpoint. A route module may export only its verbs, so all the
// request does is here and src/routes/api/(machine)/recover/+server.ts joins them, as the deposit
// and Live HPC routes do.
//
// A GET answers one dataset on one target (`hub`, `key`, `target` = `mac` or the key of a cluster
// of `slurm.resource`, whose connection the cluster side runs on; another key is refused): its
// folder, the access of its credentialed services, the plan of its files, its run and its log, and
// the `recover` channel's version, so the view knows which pushed run readings are newer. The view
// asks it when it opens, after a press and on its refresh control; between those it draws the
// channel the Recover watcher publishes (live/watch.ts), and the access login requests run in the
// GET and in the POST of a Fetch, never on a push. A GET is a read and carries no token; it reaches
// this module past the origin guard of src/hooks.server.ts. The file list of a dataset is kept in
// `<key>.list.json` for the recipe it was read for, and read again with `fresh=1`.
//
// A POST runs `fetch` (every file a Fetch takes, or one `file`), `verify`, `unpack` or `stop`,
// behind the write token, and tells the watcher, which follows the run from then on. A run that
// cannot start answers `refused` with the reason, which the view words from its catalog; nothing
// is written back to the registry.

import { json } from '@sveltejs/kit';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import {
    MAC_TARGET as MAC,
    statedKind,
    type Dataset,
    type RecoverSource,
    type RecoverState
} from '../../../../data/model/index.ts';
import type { DownloadAccount } from '../../../../data/sources/config.ts';
import type { ReaderRow } from '../../../../data/sources/config/settings/rows/grammar.ts';
import { gatedBody } from '../../../core/auth.ts';
import { listRow } from '../../../core/reader/listing.ts';
import { accessGranted, accessOf } from './access.ts';
import {
    clusterDisk,
    clusterLog,
    clusterPlace,
    clusterState,
    startClusterFetch,
    startClusterJob,
    stopCluster,
    type ClusterDeps
} from './cluster.ts';
import {
    isRefusal,
    placed,
    readKept,
    rowOf,
    safeName,
    senderOf,
    type Fetcher,
    type ListDeps,
    type Refusal,
    type RemoteFile
} from './files.ts';
import {
    diskOf,
    freeOf,
    localPlace,
    localState,
    recoverFiles,
    startLocalFetch,
    startLocalUnpack,
    startLocalVerify,
    stopLocal,
    type LocalDeps,
    type RunState
} from './local.ts';
import { logTail } from './live/log.ts';
import type { RecoverWatcher } from './live/watch.ts';
import { readChecks } from './verify.ts';
import {
    fetchItems,
    planOf,
    unpackList,
    verifyList,
    validName,
    type PlanRow,
    type PlanTotals
} from './plan.ts';

/** What the endpoint is handed; the route passes the real value of each. */
export type RecoverTarget = {
    token: string;
    /** The names of the workspace's hubs, the primary first. */
    hubs: () => string[];
    /** The dataset a hub's key names in the latest portfolio, or null. */
    dataset: (hub: string, key: string) => Dataset | null;
    /** The `downloads` rows of the primary hub's `local.yml`. */
    downloads: () => DownloadAccount[];
    /** The rows of `recover.sources` of a hub's `.oculus/config.yml`, which read its datasets. */
    rows: (hub: string) => ReaderRow[];
    /** The User-Agent every request to a source carries. */
    agent: string;
    fetch: Fetcher;
    local: LocalDeps;
    /**
     * The runs on the cluster `resource`, or the sentence for why there are none: `unlisted` for a
     * key `slurm.resource` does not list, else a cluster with no usable host.
     */
    cluster: (resource: string) => ClusterDeps | { missing: string; unlisted?: true };
    /** The Recover watcher (live/watch.ts): told of each press, and its channel's version. */
    live: Pick<RecoverWatcher, 'changed' | 'version'>;
};

/** Nothing of an answer of this route is cached. */
const NO_STORE = { 'cache-control': 'no-store' };

/** Whether a request's target can name this Mac or a cluster; its listing is checked later. */
function targetWord(where: unknown): where is string {
    return typeof where === 'string' && (where === MAC || validName(where));
}

/** The refusal of a cluster with no runs: a key not listed, or a cluster with no usable host. */
function noCluster(found: { missing: string; unlisted?: true }): Response {
    return found.unlisted === true
        ? refused('target', 400, { hint: found.missing })
        : refused('host', 200, { hint: found.missing });
}

/** What the view is told of one dataset on one target. */
type RecoverAnswer = RecoverState;

/** A refusal of a request, answered with its reason. */
function refused(reason: string, status = 200, extra: Record<string, unknown> = {}): Response {
    return json({ refused: reason, ...extra }, { status, headers: NO_STORE });
}

/** What the listing of a hub's dataset is given: its fetch, `downloads` and the hub's rows. */
function depsOf(target: RecoverTarget, hub: string): ListDeps {
    return {
        fetch: target.fetch,
        downloads: target.downloads(),
        rows: target.rows(hub),
        agent: target.agent
    };
}

/** How a file of an unpacking source unpacks: its strip, and its folder when the source has one. */
function unpackOf(source: RecoverSource): NonNullable<RemoteFile['unpack']> {
    const strip = source.strip ?? 0;
    return source.folder === undefined ? { strip } : { strip, folder: source.folder };
}

/**
 * Every file of a dataset's sources, in the sources' order, each named below the dataset's folder,
 * or the first refusal. Each source is read by the row of the hub's `recover.sources` its kind
 * names (server/core/reader/listing.ts), its fields filling the row's holes; a kind no row names
 * is refused `row` before any request, and a stated kind lists nothing. A name that is absolute or
 * climbs out of its folder, from the source or from the entry's `into`, and a name two files would
 * share, are refused before anything is fetched. The sources are the snapshot's parse
 * (data/snapshot/normalise-parts/retrieval.ts); no registry text is parsed here.
 */
async function listFiles(
    retrieval: RecoverSource[],
    deps: ListDeps
): Promise<RemoteFile[] | Refusal> {
    const files: RemoteFile[] = [];
    const names = new Set<string>();
    const setup = { sender: senderOf(deps), downloads: deps.downloads, links: [] };
    for (const [index, source] of retrieval.entries()) {
        if (statedKind(source.kind)) continue;
        const row = rowOf(deps.rows, source.kind);
        if (row === undefined) return { refused: 'row', source: source.kind };
        const named = { source: source.kind, label: row.name };
        if (source.into !== undefined && !safeName(source.into)) {
            return { refused: 'name', ...named, name: source.into };
        }
        const answer = await listRow(row, (field) => source[field], setup);
        if (isRefusal(answer)) return answer;
        for (const one of answer) {
            const name = placed(one.name, source.into);
            if (!safeName(one.name) || names.has(name)) {
                return { refused: 'name', ...named, name: one.name };
            }
            names.add(name);
            files.push({
                ...one,
                name,
                source: index,
                ...(source.unpack === true ? { unpack: unpackOf(source) } : {})
            });
        }
    }
    return files;
}

/** The files of the dataset, from the kept listing of its recipe unless `fresh`, else read. */
async function filesOf(
    target: RecoverTarget,
    hub: string,
    key: string,
    entry: Dataset,
    fresh: boolean
): Promise<RemoteFile[] | Refusal> {
    const file = recoverFiles(target.local.home, hub, key).list;
    const recipe = JSON.stringify(entry.retrieval);
    // No listing kept, one that does not read, or one of another recipe: the sources are asked.
    const kept = fresh ? null : readKept(file);
    if (kept !== null && kept.recipe === recipe) return kept.files;
    const files = await listFiles(entry.retrieval, depsOf(target, hub));
    if (!isRefusal(files)) {
        mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
        writeFileSync(file, `${JSON.stringify({ recipe, files })}\n`, { mode: 0o600 });
    }
    return files;
}

/** The request's dataset: a known hub, a usable key and an entry Recover runs; else a refusal. */
function asked(target: RecoverTarget, hub: string, key: string): { entry: Dataset } | Response {
    if (!validName(hub) || !validName(key) || !target.hubs().includes(hub)) {
        return refused('dataset', 400);
    }
    const entry = target.dataset(hub, key);
    if (entry === null) return refused('dataset', 404);
    const unread = entry.unread?.[0];
    if (unread !== undefined) return refused('row', 400, { hint: unread });
    if (!entry.recover) return refused('kind', 400);
    return { entry };
}

/** The plan of the files against the target's disk, the target's run and log. */
async function onTarget(
    target: RecoverTarget,
    where: string,
    hub: string,
    key: string,
    entry: Dataset,
    files: RemoteFile[] | null
): Promise<
    | {
          folder: string;
          plan: { rows: PlanRow[]; totals: PlanTotals } | null;
          run: RunState | null;
          log: string[];
      }
    | Response
> {
    if (where === MAC) {
        const place = localPlace(target.local.home, hub, key, entry.path);
        if (place === null) return refused('place', 400);
        const plan =
            files === null
                ? null
                : planOf(
                      files,
                      diskOf(
                          place.folder,
                          files.map((one) => one.name)
                      ),
                      readChecksOf(target, hub, key),
                      freeOf(place.folder)
                  );
        return {
            folder: entry.path ?? '',
            plan,
            run: localState(place, target.local),
            log: logTail(recoverFiles(target.local.home, hub, key).log)
        };
    }
    const deps = target.cluster(where);
    if ('missing' in deps) return noCluster(deps);
    const place = clusterPlace(hub, key, entry.path);
    if (place === null) return refused('place', 400);
    const disk = await clusterDisk(place, deps);
    if (disk === null) return refused('unreachable', 200);
    return {
        folder: place.folder,
        plan: files === null ? null : planOf(files, disk.disk, disk.checks, disk.free),
        run: await clusterState(place, deps),
        log: await clusterLog(place, deps)
    };
}

/** The check rows this Mac keeps for a dataset. */
function readChecksOf(target: RecoverTarget, hub: string, key: string) {
    return readChecks(recoverFiles(target.local.home, hub, key).checks);
}

/** GET /api/recover: one dataset on one target. */
export async function handleRecoverState(
    request: Request,
    target: RecoverTarget
): Promise<Response> {
    const params = new URL(request.url).searchParams;
    const where = params.get('target');
    const hub = params.get('hub') ?? '';
    const key = params.get('key') ?? '';
    if (!targetWord(where)) return refused('target', 400);
    const live = target.live.version();
    const found = asked(target, hub, key);
    if (found instanceof Response) return found;
    const access = await accessOf(found.entry.retrieval, depsOf(target, hub));
    const files = await filesOf(target, hub, key, found.entry, params.get('fresh') === '1');
    const listed = isRefusal(files) ? null : files;
    const state = await onTarget(target, where, hub, key, found.entry, listed);
    if (state instanceof Response) return state;
    const answer: RecoverAnswer = {
        target: where,
        ...state,
        access,
        granted: accessGranted(access),
        refusal: isRefusal(files) ? files : null,
        live
    };
    return json(answer, { headers: NO_STORE });
}

/** POST /api/recover: fetch, verify, unpack or stop one dataset on one target. */
export async function handleRecover(request: Request, target: RecoverTarget): Promise<Response> {
    const body = await gatedBody(request, target.token);
    if (body instanceof Response) return body;
    const { action, hub, key, file } = body;
    const where = body.target;
    if (
        (action !== 'fetch' && action !== 'verify' && action !== 'unpack' && action !== 'stop') ||
        !targetWord(where) ||
        typeof hub !== 'string' ||
        typeof key !== 'string' ||
        (file !== undefined && typeof file !== 'string')
    ) {
        return refused('request', 400);
    }
    const found = asked(target, hub, key);
    if (found instanceof Response) return found;
    const { entry } = found;
    const cluster = where === MAC ? null : target.cluster(where);
    if (cluster !== null && 'missing' in cluster) return noCluster(cluster);
    if (action === 'stop') {
        const stopped = await stopOn(target, cluster, hub, key, entry);
        if (stopped) target.live.changed(hub, key, where);
        return json({ stopped });
    }
    if (action === 'fetch') {
        const access = await accessOf(entry.retrieval, depsOf(target, hub));
        if (!accessGranted(access)) return refused('access');
    }
    const files = await filesOf(target, hub, key, entry, false);
    if (isRefusal(files)) return refused('listing', 200, { refusal: files });
    const state = await onTarget(target, where, hub, key, entry, files);
    if (state instanceof Response) return state;
    const rows = state.plan?.rows ?? [];
    const reason = await startOn(target, cluster, action, hub, key, entry, rows, file);
    if (reason !== null) return refused(reason);
    target.live.changed(hub, key, where);
    return json({ started: action }, { headers: NO_STORE });
}

/**
 * Start a run on its target, this Mac (`deps` null) or the cluster of `deps`; the reason it did
 * not start, or null.
 */
async function startOn(
    target: RecoverTarget,
    deps: ClusterDeps | null,
    action: 'fetch' | 'verify' | 'unpack',
    hub: string,
    key: string,
    entry: Dataset,
    rows: PlanRow[],
    file: string | undefined
): Promise<string | null> {
    if (deps === null) {
        const place = localPlace(target.local.home, hub, key, entry.path);
        if (place === null) return 'place';
        if (action === 'fetch') {
            return startLocalFetch(place, fetchItems(rows, file), target.downloads(), target.local);
        }
        return action === 'verify'
            ? startLocalVerify(place, verifyList(rows), target.local)
            : startLocalUnpack(place, unpackList(rows), target.local);
    }
    const place = clusterPlace(hub, key, entry.path);
    if (place === null) return 'place';
    if (action === 'fetch') {
        return startClusterFetch(place, fetchItems(rows, file), target.downloads(), deps);
    }
    return startClusterJob(
        action,
        place,
        action === 'verify' ? verifyList(rows) : unpackList(rows),
        deps
    );
}

/**
 * Stop the dataset's run on its target, this Mac (`deps` null) or the cluster of `deps`; whether
 * one was stopped.
 */
async function stopOn(
    target: RecoverTarget,
    deps: ClusterDeps | null,
    hub: string,
    key: string,
    entry: Dataset
): Promise<boolean> {
    if (deps === null) {
        const place = localPlace(target.local.home, hub, key, entry.path);
        return place !== null && stopLocal(place, target.local);
    }
    const place = clusterPlace(hub, key, entry.path);
    return place !== null && stopCluster(place, deps);
}
