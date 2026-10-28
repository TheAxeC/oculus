// Layer 2, server. The connection of each cluster the Live HPC view polls: for every key of the
// hub's `slurm.resource`, in its order, the cluster entry of that key in the resources registry
// gives the name and the host, and this machine's row of `clusters:` in local.yml gives the user
// name and the key file. A key that names no cluster entry, an entry that is no cluster, a cluster
// with no host and a host ssh would read as an option or a second word each give the empty host
// and the sentence that says why, keyed by the resource; a hub whose `slurm.resource` names no
// cluster has no connection, and the sentence that says so is the `hpc` channel's hint. The
// resolver is pure, so the watchers, the config push, the portfolio rebuild and the routes all
// give one answer for one input.

import { bareId, holdersOf, resolvedId } from '../../../../data/helpers/hub-names.ts';
import type { Id, Resource, Snapshot } from '../../../../data/model/index.ts';
import {
    failureRows,
    failuresFor,
    slurmSettings,
    textCatalog,
    type ClusterAccount,
    type FailureRow,
    type SlurmSettings
} from '../../../../data/sources/config.ts';
import type { Hub } from '../../../core/channels.ts';
import type { HpcSettings, PollWords } from '../poll.ts';
import type { Connection } from '../ssh.ts';

/**
 * The sentences of the Live HPC settings: those for having no host, each taking the resource key as
 * `{0}` except the first two, and in `poll` the sentences a failed poll's hint is made of.
 */
export type HostWords = {
    notRead: string;
    noCluster: string;
    unknown: string;
    notCluster: string;
    noHost: string;
    badHost: string;
    /** A key an action names that `slurm.resource` does not list, as `{0}`. */
    notListed: string;
    poll: PollWords;
};

/**
 * A host ssh connects to: an ssh alias, a DNS name or an address (IPv4, or IPv6 with its colons),
 * letters, digits and `. _ : -`, not starting with `-` or `.`. It is handed to ssh as an argument
 * with no `--` before it, so a leading `-`, a space or a control character would be read as an
 * option or a second word; an `@` is refused, since the user name is this machine's row's.
 */
const HOST = /^[A-Za-z0-9_][A-Za-z0-9._:-]*$/;

/**
 * One cluster of `slurm.resource`: its key, its name (the entry's, else its key), and the
 * connection ssh makes to it, or the empty host and the sentence for why there is none (`missing`).
 */
export type ClusterConnection = Connection & { resource: string; name: string; missing?: string };

/** A sentence with the key put where it says `{0}`. */
function said(sentence: string, key: string): string {
    return sentence.replace('{0}', () => key);
}

/** The connection of one key, with this machine's row for it when there is one. */
function connectionOf(
    resource: string,
    entries: Record<Id, Resource> | null,
    accounts: readonly ClusterAccount[],
    words: HostWords
): ClusterConnection {
    const none = (missing: string, name = resource): ClusterConnection => ({
        resource,
        name,
        host: '',
        missing
    });
    if (entries === null) return none(words.notRead);
    const entry = Object.hasOwn(entries, resource) ? entries[resource] : undefined;
    if (entry === undefined) return none(said(words.unknown, resource));
    const name = entry.name === '' ? resource : entry.name;
    if (entry.kind !== 'cluster') return none(said(words.notCluster, resource), name);
    if (entry.host === undefined || entry.host === '') {
        return none(said(words.noHost, resource), name);
    }
    if (!HOST.test(entry.host)) return none(said(words.badHost, resource), name);
    const account = accounts.find((one) => one.resource === resource);
    return {
        resource,
        name,
        host: entry.host,
        ...(account?.user === undefined ? {} : { user: account.user }),
        ...(account?.keyFile === undefined ? {} : { keyFile: account.keyFile })
    };
}

/**
 * The connection of every key of `resources` (`slurm.resource`), in its order, against the
 * resources of the latest snapshot (null while there is none) and this machine's `clusters:` rows.
 */
export function clusterConnections(input: {
    resources: readonly string[];
    entries: Record<Id, Resource> | null;
    accounts: readonly ClusterAccount[];
    words: HostWords;
}): ClusterConnection[] {
    return input.resources.map((resource) =>
        connectionOf(resource, input.entries, input.accounts, input.words)
    );
}

/**
 * The resources of the latest portfolio snapshot the hub holds, by the key `slurm.resource` names
 * them by, or null while there is none. The setting is the primary hub's, so a key resolves in the
 * primary first, then in the one other hub that holds it (`resolvedId`); a key two other hubs hold
 * names none.
 */
export function latestResources(hub: Hub, primary: string | null): Record<Id, Resource> | null {
    const message = hub.latest('portfolio');
    if (message === undefined) return null;
    const resources = (message.payload as Snapshot).entities.resources;
    const holders = holdersOf(Object.values(resources));
    const out: Record<Id, Resource> = {};
    for (const one of Object.values(resources)) {
        const key = bareId(one);
        const id = resolvedId(holders, primary ?? '', key);
        if (id !== null && Object.hasOwn(resources, id)) out[key] = resources[id];
    }
    return out;
}

/** What the clusters are read from as they stand: the hub, the primary, the config, the rows. */
export type ClusterSources = {
    hub: Hub;
    primary: string | null;
    config: () => Record<string, unknown>;
    accounts: () => readonly ClusterAccount[];
};

/**
 * Every cluster of `slurm.resource` with its connection as the sources stand now, and the
 * sentence for a hub that names none, for a route's action and the watchers' set alike.
 */
export function connectionsNow(sources: ClusterSources): ClusterConnection[] {
    const config = sources.config();
    return clusterConnections({
        resources: slurmSettings(config).resources,
        entries: latestResources(sources.hub, sources.primary),
        accounts: sources.accounts(),
        words: hostWordsOf(config)
    });
}

/**
 * Every cluster of `slurm.resource` by its key and name, with the id of the registry entry its key
 * resolves to (null while there is none), which Submit matches a project's `compute:` against.
 */
export function clusterChoices(
    sources: ClusterSources
): { resource: string; name: string; id: Id | null }[] {
    const entries = latestResources(sources.hub, sources.primary);
    return connectionsNow(sources).map(({ resource, name }) => ({
        resource,
        name,
        id: entries !== null && Object.hasOwn(entries, resource) ? entries[resource].id : null
    }));
}

/**
 * The settings each cluster's watcher is handed: its connection, the cadences of `slurm:`, the
 * sentences of a failed poll's hint and the rows of the hub's `connections.failures` whose `for`
 * holds `cluster`, the only ones its ssh poll tries.
 */
export function clusterSettingsOf(
    slurm: SlurmSettings,
    connections: readonly ClusterConnection[],
    words: PollWords,
    failures: readonly FailureRow[]
): HpcSettings[] {
    const { days, pollMin, quotaMin, prewarm } = slurm;
    const cadences = { days, pollMin, quotaMin, prewarm };
    const told = failuresFor(failures, 'cluster');
    return connections.map((connection) => ({
        ...connection,
        ...cadences,
        words,
        failures: told
    }));
}

/**
 * The settings of every cluster of a merged configuration as the sources stand now, and the
 * sentence for a hub that names none, which the context starts the watchers with.
 */
export function clustersOf(sources: ClusterSources): { clusters: HpcSettings[]; hint: string } {
    const config = sources.config();
    const words = hostWordsOf(config);
    return {
        clusters: clusterSettingsOf(
            slurmSettings(config),
            connectionsNow(sources),
            words.poll,
            failureRows(config)
        ),
        hint: words.noCluster
    };
}

/** The sentences out of a merged configuration's text catalog; a throw names a bad key. */
export function hostWordsOf(config: Record<string, unknown>): HostWords {
    const word = (sentence: unknown, key: string): string => {
        if (typeof sentence !== 'string') throw new Error(`text catalog: ${key} must be a string`);
        return sentence;
    };
    return {
        poll: {
            sshExited: word(textCatalog(config)['hpc.hint_ssh_exited'], 'hpc.hint_ssh_exited'),
            slurmLate: word(textCatalog(config)['hpc.hint_slurm_late'], 'hpc.hint_slurm_late'),
            overrun: word(textCatalog(config)['hpc.hint_overrun'], 'hpc.hint_overrun')
        },
        notRead: word(textCatalog(config)['hpc.host_not_read'], 'hpc.host_not_read'),
        noCluster: word(textCatalog(config)['hpc.host_no_cluster'], 'hpc.host_no_cluster'),
        unknown: word(textCatalog(config)['hpc.host_unknown'], 'hpc.host_unknown'),
        notCluster: word(textCatalog(config)['hpc.host_not_cluster'], 'hpc.host_not_cluster'),
        noHost: word(textCatalog(config)['hpc.host_none'], 'hpc.host_none'),
        badHost: word(textCatalog(config)['hpc.host_unusable'], 'hpc.host_unusable'),
        notListed: word(textCatalog(config)['hpc.host_not_listed'], 'hpc.host_not_listed')
    };
}

/**
 * The connection of the cluster an action names, or the sentence for why there is none:
 * `unlisted` for a key `slurm.resource` does not list, else a cluster with no usable host.
 */
export type ConnectionFound =
    { connection: ClusterConnection } | { missing: string; unlisted?: true };

/**
 * The connection of the cluster an action names, by its key: the cluster of `slurm.resource` of
 * that key as the sources stand now, or the sentence that the key is not one of them, or the
 * sentence for why the cluster has no host.
 */
export function connectionFor(sources: ClusterSources, resource: string): ConnectionFound {
    const found = connectionsNow(sources).find((one) => one.resource === resource);
    if (found === undefined) {
        const words = hostWordsOf(sources.config());
        return { missing: said(words.notListed, resource), unlisted: true };
    }
    if (found.host === '') return { missing: found.missing ?? '' };
    return { connection: found };
}
