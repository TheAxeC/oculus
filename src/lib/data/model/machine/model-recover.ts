// Layer 1, data. The shapes GET /api/recover answers (server/machine/runs/recover/routes.ts) and
// the Recover view's store reads (state/system/machine/recover.svelte.ts), declared once here and
// re-exported by data/model/index.ts, with the one target word that names this Mac, which the
// routes, the store and the reader of `clusters:` share. A dataset's sources, `RecoverSource`,
// belong to the dataset registry's entity and are declared in data/model/model-entities.ts. No
// shape names a service: a source's service is the `downloads` row its row of `recover.sources`
// signs in with.

/**
 * The Recover target of this Mac; every other target is the key of a cluster of `slurm.resource`,
 * so no cluster may be named by it.
 */
export const MAC_TARGET = 'mac';

/** The checksum a source publishes for a file. */
export type RecoverChecksum = { kind: 'sha256' | 'md5' | 'sha1'; value: string };

/**
 * How a download carries the secret of its `downloads` row: as a user and a password (`basic`), or
 * in a header with its prefix (such as `Bearer `), as the row's `auth` entry says.
 */
export type RecoverCredential = { basic: true } | { header: string; prefix?: string };

/** One file as a source lists it, named below the dataset's folder. */
export type RecoverFile = {
    name: string;
    /** Bytes, or null when the source states no size. */
    size: number | null;
    checksum: RecoverChecksum | null;
    url: string;
    /** The position of its source in the entry's `retrieval` list. */
    source: number;
    /** The `downloads` row its download signs in with, and how it carries the secret. */
    service?: string;
    credential?: RecoverCredential;
    /**
     * Set when its source unpacks: the folder inside the archive whose contents alone are placed,
     * when the source names one, and how many leading folders each path below it loses.
     */
    unpack?: { strip: number; folder?: string };
    throttle?: string;
};

/** What a file of the plan is on the target. */
export type RecoverFileState = 'verified' | 'present' | 'partial' | 'different' | 'missing';

/** One row of a plan: the file, its state and the bytes the target holds of it. */
export type RecoverRow = RecoverFile & { state: RecoverFileState; have: number };

/** A plan's totals: files, their bytes, the bytes a Fetch needs, and the free space. */
export type RecoverTotals = {
    files: number;
    bytes: number;
    /** Bytes a Fetch of every missing, partial and different file still needs, where known. */
    missing: number;
    /** Files of those whose size the source does not state. */
    unsized: number;
    /** Bytes free on the target's disk, or null when it could not be read. */
    free: number | null;
};

/**
 * The access of one service a dataset's sources need: `service` the `downloads` row its row's
 * `auth` entry names, `name` the name of the `recover.sources` row, `basic` whether the secret is
 * sent with a user, and `help` the entry's sentence of where the secret is made.
 */
export type RecoverAccess = {
    service: string;
    name: string;
    basic: boolean;
    help?: string;
    /** `ok` with a row the service accepts, `missing` without one, `unreachable` with no answer. */
    state: 'ok' | 'missing' | 'unreachable';
    /** Whether the primary hub's `local.yml` holds a row of the service. */
    row: boolean;
    status?: number;
};

/**
 * Why a source gives no file list: `access` (401 or 403), `status` (another answer that is no
 * success), `answer` (a body that is not the kind's answer), `name` (a file name that is absolute,
 * climbs out or is given twice), `missing` (a file the entry names that the source does not hold),
 * `network` (no answer), `row` (no row of the hub's `recover.sources` reads the kind).
 */
export type RecoverRefusal = {
    refused: 'access' | 'status' | 'answer' | 'name' | 'missing' | 'network' | 'row';
    /** The kind of the source, or for a row with no address of its own the host it asked. */
    source: string;
    /** The `name` of the row that read the source, which the line names it by. */
    label?: string;
    status?: number;
    name?: string;
};

/** A dataset's run: what it does and, where it is counted, how far it is. */
export type RecoverRun = {
    action: 'fetch' | 'verify' | 'unpack';
    done?: number;
    total?: number;
    /** The cluster's job id of a check or an unpack. */
    job?: string;
};

/** One dataset on one target, as the Recover view is told it. */
export type RecoverState = {
    /** `mac` for this Mac, else the key of a cluster of `slurm.resource`. */
    target: string;
    /** The dataset's folder as `path:` names it. */
    folder: string;
    access: RecoverAccess[];
    /** Whether every service the sources need accepts its row, so Fetch may start. */
    granted: boolean;
    plan: { rows: RecoverRow[]; totals: RecoverTotals } | null;
    refusal: RecoverRefusal | null;
    run: RecoverRun | null;
    log: string[];
    /** The `recover` channel's version when this was answered: a run row pushed later is newer. */
    live: number;
};

/**
 * One of oculus's sessions on a cluster's socket `oculus-recover`, as Live HPC lists it: the
 * bytes of its dataset's folder, the bytes the kept listing names, and the bytes per second
 * between the last two Live HPC answers.
 */
export type RecoverSession = {
    hub: string;
    key: string;
    done: number;
    total: number | null;
    rate: number | null;
};

/** One dataset's run as the `recover` channel pushes it. */
export type RecoverLiveRun = {
    hub: string;
    key: string;
    /** `mac` for this Mac, else the key of the cluster it runs on. */
    target: string;
    /** `running` while the run goes, `ended` from the push after it stopped. */
    state: 'running' | 'ended';
    /** What the run does; null once it has ended. */
    run: RecoverRun | null;
    /** The bytes the folder holds: of the listed files on this Mac, in all on a cluster. */
    bytes: number;
    /** The bytes the kept listing names, or null when none is kept. */
    size: number | null;
    /** Bytes per second between the last two readings, or null after the first. */
    rate: number | null;
    /** On this Mac, the listed files whose bytes changed since the reading before, with rates. */
    growing: { name: string; have: number; rate: number }[];
    log: string[];
    /** The channel's version of the push that last read this run. */
    version: number;
};

/** The payload of the `recover` channel. */
export type RecoverLive = {
    runs: RecoverLiveRun[];
    /**
     * Each cluster's login node sessions as the last Live HPC answer of that cluster read them, by
     * the cluster's key; a cluster is absent before its first answer.
     */
    sessions: Record<string, RecoverSession[]>;
};
