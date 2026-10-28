// Layer 2, server. The `hpc` channel over every cluster of `slurm.resource`: one watcher per
// cluster (poll.ts), each on its own connection, handing its cluster's payload to this aggregator,
// which publishes `{ clusters: [...] }` in `slurm.resource`'s order each time one cluster's payload
// changes, and the empty list with the sentence for a hub that names no cluster as `hint`. A new
// list of clusters starts a watcher for a cluster it adds, hands the settings to the watcher of a
// cluster it keeps (which starts over when the connection changed) and stops the watcher of a
// cluster it drops; a payload a stopped watcher hands over afterwards, from a poll that was in
// flight, is dropped here, so a cluster that is gone never comes back on the channel. Each
// cluster's resolution (`ssh -G`, resolution.ts) is read when its watcher starts and again when its
// connection changes, and rides on its payload; an answer for a connection superseded meanwhile is
// dropped. Nothing here is global: the server context makes one per server and closes it.

import type { ClusterResolution, HpcMessage, HpcPayload } from '../../../../data/model/index.ts';
import type { Hub } from '../../../core/channels.ts';
import { connectionOf, type ClusterOut, type HpcSettings, type HpcWatcher } from '../poll.ts';
import type { Connection } from '../ssh.ts';

/** Start the watcher of one cluster, handing its payloads to `out`. */
export type ClusterStart = (settings: HpcSettings, out: ClusterOut) => HpcWatcher;

/** Read what a connection resolves to; null for one with no host. */
export type ClusterResolve = (connection: Connection) => Promise<ClusterResolution | null>;

/** The watchers of the clusters of `slurm.resource`, as the server context holds them. */
export type HpcClusters = {
    /** The watcher of the cluster `resource`, while `slurm.resource` names it. */
    watcher: (resource: string) => HpcWatcher | undefined;
    /** The keys of the clusters watched, in `slurm.resource`'s order. */
    resources: () => string[];
    /** Poll every cluster now; resolves when every poll has. */
    refresh: () => Promise<void>;
    /** Take the clusters as they now stand, in order, and the sentence for having none. */
    set: (clusters: readonly HpcSettings[], hint: string) => void;
    close: () => void;
};

/** One cluster as the aggregator holds it. */
type Held = {
    /** Null only while the watcher is being started and hands its first payload. */
    watcher: HpcWatcher | null;
    settings: HpcSettings;
    payload: HpcPayload | undefined;
    resolution: ClusterResolution | undefined;
    /** Counts the reads of the resolution, so an answer for an older connection is dropped. */
    reads: number;
    stopped: boolean;
};

/** Whether two settings name one connection. */
function sameConnection(one: HpcSettings, two: HpcSettings): boolean {
    return one.host === two.host && one.user === two.user && one.keyFile === two.keyFile;
}

/**
 * Watch the clusters, in their order, with `start` making each cluster's watcher and `resolve`
 * reading its resolution, `hint` the sentence for a hub that names none.
 */
export function watchClusters(
    hub: Hub,
    deps: { start: ClusterStart; resolve: ClusterResolve },
    clusters: readonly HpcSettings[],
    hint: string
): HpcClusters {
    const held = new Map<string, Held>();
    let order: string[] = [];
    let none = hint;
    let closed = false;

    const publish = (): void => {
        if (closed) return;
        const shown = order.flatMap((resource) => {
            const one = held.get(resource);
            if (one?.payload === undefined) return [];
            return [
                one.resolution === undefined
                    ? one.payload
                    : { ...one.payload, resolution: one.resolution }
            ];
        });
        const message: HpcMessage =
            order.length === 0
                ? { clusters: [], ...(none === '' ? {} : { hint: none }) }
                : { clusters: shown };
        hub.publish('hpc', message);
    };

    /** Read the resolution of a cluster's connection, keeping it only while it is asked. */
    const resolveOf = (one: Held): void => {
        one.reads += 1;
        const read = one.reads;
        const connection = connectionOf(one.settings);
        void deps
            .resolve(connection)
            .then((resolution) => {
                if (one.stopped || closed || read !== one.reads) return;
                one.resolution = resolution ?? undefined;
                publish();
            })
            .catch(() => undefined);
    };

    const startOne = (settings: HpcSettings): Held => {
        const one: Held = {
            settings,
            payload: undefined,
            resolution: undefined,
            reads: 0,
            stopped: false,
            watcher: null
        };
        const out: ClusterOut = {
            publish: (payload) => {
                if (one.stopped || closed) return;
                one.payload = payload;
                publish();
            },
            latest: () => one.payload
        };
        held.set(settings.resource, one);
        one.watcher = deps.start(settings, out);
        resolveOf(one);
        return one;
    };

    const stopOne = (one: Held): void => {
        one.stopped = true;
        one.watcher?.close();
    };

    const set = (next: readonly HpcSettings[], sentence: string): void => {
        if (closed) return;
        none = sentence;
        const wanted = new Set(next.map((one) => one.resource));
        for (const [resource, one] of held) {
            if (wanted.has(resource)) continue;
            stopOne(one);
            held.delete(resource);
        }
        order = next.map((one) => one.resource);
        for (const settings of next) {
            const one = held.get(settings.resource);
            if (one === undefined) {
                startOne(settings);
                continue;
            }
            const moved = !sameConnection(one.settings, settings);
            one.settings = settings;
            one.watcher?.set(settings);
            if (moved) {
                one.resolution = undefined;
                resolveOf(one);
            }
        }
        publish();
    };

    order = clusters.map((one) => one.resource);
    for (const settings of clusters) startOne(settings);
    publish();

    return {
        watcher: (resource) => held.get(resource)?.watcher ?? undefined,
        resources: () => [...order],
        refresh: async () => {
            await Promise.all(
                [...held.values()].flatMap((one) =>
                    one.watcher === null ? [] : [one.watcher.refresh()]
                )
            );
        },
        set,
        close: () => {
            closed = true;
            for (const one of held.values()) stopOne(one);
            held.clear();
        }
    };
}
