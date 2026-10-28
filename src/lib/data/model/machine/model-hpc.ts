// Layer 1, data. The shapes the `hpc` channel carries and Submit answers, declared once here and
// re-exported by data/model/index.ts: one payload per cluster of `slurm.resource`, in its order,
// each read by its own watcher on its own connection (server/machine/hpc/clusters/), and the plan
// Submit shows before it runs. A failure told apart by a row of `connections.failures` is
// declared here too, since a cluster's poll and a repository's fetch both carry one.

/**
 * A failed connection told apart by the first row of `connections.failures` whose `match` a line
 * of ssh's or git's error output holds: the words naming the failure and the words of its fix.
 */
export type ToldFailure = { kind: string; fix: string };

/**
 * A failed poll is `unreachable` (ssh did not connect), `slurm_down` (ssh connected and Slurm did
 * not answer) or `error` (anything else).
 */
type HpcStatus = 'starting' | 'ok' | 'unreachable' | 'slurm_down' | 'error';
export type HpcJob = {
    id: string;
    name: string;
    partition: string;
    state: string;
    time: string;
    limit: string;
    nodes: string;
    cpus: string;
    gpus: string;
    mem: string;
    priority: string;
    start: string;
    reason: string;
};
export type HpcRecent = {
    id: string;
    name: string;
    state: string;
    exit: string;
    elapsed: string;
    end: string;
    memPct: number | null;
    memUsed: string;
    memReq: string;
    cpuPct: number | null;
};
export type HpcPartition = {
    partition: string;
    avail: string;
    nodes: number;
    state: string;
    gres: string;
};
export type HpcQuotaItem = { name: string; used: string; limit: string; pct: number };

/**
 * What `ssh -G` says the connection of a cluster resolves to, read with the options the poll
 * connects with and no connection opened: the `hostname`, `user`, `port` and `identityfile` lines,
 * each as ssh printed it (`identityfile` every file ssh would offer). `error` is the first line ssh
 * wrote when it could not resolve the connection.
 */
export type ClusterResolution =
    { hostname: string; user: string; port: string; identityfile: string[] } | { error: string };

/** One cluster of `slurm.resource` as its watcher last read it. */
export type HpcPayload = {
    /** The key of the cluster entry of the resources registry. */
    resource: string;
    /** The cluster entry's name, its key when it has none. */
    name: string;
    status: HpcStatus;
    hint?: string;
    /** The failure the hint is, told apart by a row of `connections.failures`, when one matched. */
    failure?: ToldFailure;
    jobs: HpcJob[];
    running: number;
    pending: number;
    total: number;
    recent: HpcRecent[];
    sinfo: HpcPartition[];
    quota: HpcQuotaItem[];
    updated: string;
    /**
     * When the cluster last answered for the queue, so a failed poll can say how old the queue
     * under it is. A payload whose `lastOk` equals `updated` has this poll's queue.
     */
    lastOk?: string;
    /**
     * Present on a failed poll whose Recent or Capacity table is older than its queue, which is a
     * poll whose `squeue` answered and whose `sacct` or `sinfo` did not, and every later failed
     * poll while a table kept so is still older than the queue. It names each such table with the
     * time (ISO) of the poll its rows came from, or `null` when no poll has answered for that table
     * since the server started (its rows then empty). A payload of a good poll, of `starting`, and
     * of a failed poll whose tables are as old as its queue carries none.
     */
    stale?: { recent?: string | null; sinfo?: string | null };
    pollMin: number;
    /** Minutes between attempts while the cluster is not answering. */
    retryMin: number;
    /** The host ssh connects to, empty when the cluster has none (`hint` says why). */
    host: string;
    /** The connection's resolution, absent until `ssh -G` has answered for it. */
    resolution?: ClusterResolution;
};

/**
 * The `hpc` channel's message: every cluster of `slurm.resource`, in its order, and the empty list
 * when the hub names none, with the sentence that says so as `hint`.
 */
export type HpcMessage = { clusters: HpcPayload[]; hint?: string };

/**
 * Whether a payload's queue is this poll's: a good poll, or a failed one in which the cluster
 * answered for the queue (`lastOk` equal to `updated`). The server reads Recover's section and the
 * page reads the queue as live by it.
 */
export function queueIsCurrent(
    payload: Pick<HpcPayload, 'status' | 'lastOk' | 'updated'>
): boolean {
    return payload.status === 'ok' || payload.lastOk === payload.updated;
}

/**
 * One row of this machine's `clusters:` as Settings' This machine section lists it: the cluster's
 * key, the user name and the key file the row gives (the empty text for one it leaves out, the key
 * file with `~/` resolved), and the hub whose `.oculus/local.yml` holds it.
 */
export type ClusterRow = { resource: string; user: string; keyFile: string; hub: string };

/**
 * One cluster of `slurm.resource` as Account setup's cluster section draws its steps: its key and
 * name, the sentence for why it has no usable host (empty when it has one), the host, this
 * machine's row of it (`user` and `keyFile` empty when the row leaves them out or there is none),
 * the key file `clusters.key_file` gives for it (`suggested`, `~/` resolved, empty when the hub
 * gives none or one Make key refuses), the sentence naming `clusters.key_file` when the path it
 * gives is one Make key refuses (`keyRefused`, else empty), the one line of the `.pub` file beside
 * the key file the steps start from, the row's or else the suggested one (`publicKey`, empty when
 * there is no such file), the cluster entry's `access` text, and what `ssh -G` says the connection
 * resolves to (null with no host).
 */
export type ClusterSetupCluster = {
    resource: string;
    name: string;
    missing: string;
    host: string;
    user: string;
    keyFile: string;
    suggested: string;
    keyRefused: string;
    publicKey: string;
    access: string;
    resolution: ClusterResolution | null;
};

/**
 * What Account setup's cluster section and Settings' This machine section read from
 * `POST /api/clusters` (`read`): every cluster of `slurm.resource` in its order, the sentence of a
 * hub that names none (`hint`, empty when it names one), the sentence saying which of
 * `clusters.key_type` and `clusters.key_file` Make key lacks and where it is set (`keyMissing`,
 * empty when neither is missing), and the rows of this machine's `clusters:`.
 */
export type ClusterSetup = {
    clusters: ClusterSetupCluster[];
    hint: string;
    keyMissing: string;
    rows: ClusterRow[];
};

/** What Submit will do with a job script, computed by the server and confirmed by the reader. */
export type SubmitPlan = {
    root: string;
    path: string;
    project: string;
    /** The key of the cluster of `slurm.resource` the plan runs on. */
    resource: string;
    host: string;
    source: string; // the absolute local code folder, ending in '/'
    target: string; // '<host>:<cluster folder>/'
    files: number;
    bytes: number;
    digest: string; // sha256 of the sorted paths joined by NUL, hex
    rsync: string[]; // the rsync arguments as run, without the program name
    remote: string; // the one remote command, `cd <folder> && sbatch --parsable <script>`
    /** Whether the script or a file it sources names the scratch folder, and what was unread. */
    scratch: { named: boolean; unread: string[] };
};
