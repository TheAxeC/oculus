// Layer 2, server. The host the Live HPC poller connects to. The machine's own `hpc_host` of
// local.yml wins when it names one; otherwise it is the ssh alias of the cluster entry that
// `slurm.resource` of behavior.yml names in the resources registry; otherwise there is no host
// and a sentence says why. A hub that sets no `slurm.resource` has no cluster, and the sentence
// says that the hub's settings name none; that is the one case marked `unconfigured`, which is not
// a failure: every other reason for having no host is a cluster that cannot be reached. The
// resolver is pure, so the poller, the config push, the portfolio rebuild and the route all give
// one answer for one input.

import { bareId, holdersOf, resolvedId } from '../../../data/helpers/hub-names.ts';
import type { Id, Resource, Snapshot } from '../../../data/model/index.ts';
import { slurmSettings, textCatalog, type SlurmSettings } from '../../../data/sources/config.ts';
import type { Hub } from '../../core/channels.ts';
import type { HpcSettings, PollWords } from './poll.ts';

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
    poll: PollWords;
};

/**
 * An ssh alias: letters, digits and `. _ @ -`, not starting with `-`. The host is handed to ssh as
 * an argument with no `--` before it, so a leading `-`, a space or a control character would be
 * read as an option or a second word.
 */
const ALIAS = /^[A-Za-z0-9_][A-Za-z0-9._@-]*$/;

/** A sentence with the key put where it says `{0}`. */
function said(sentence: string, key: string): string {
    return sentence.replace('{0}', () => key);
}

/** The host to poll, or the empty host and the sentence that says why there is none. */
function hpcHostOf(input: {
    hpcHost?: string;
    resource: string;
    resources: Record<Id, Resource> | null;
    words: HostWords;
}): { host: string; missing?: string; unconfigured?: true } {
    const { hpcHost, resource, resources, words } = input;
    if (hpcHost !== undefined) return { host: hpcHost };
    if (resource === '') return { host: '', missing: words.noCluster, unconfigured: true };
    if (resources === null) return { host: '', missing: words.notRead };
    const entry = Object.hasOwn(resources, resource) ? resources[resource] : undefined;
    if (entry === undefined) return { host: '', missing: said(words.unknown, resource) };
    if (entry.kind !== 'cluster') return { host: '', missing: said(words.notCluster, resource) };
    if (entry.host === undefined || entry.host === '') {
        return { host: '', missing: said(words.noHost, resource) };
    }
    if (!ALIAS.test(entry.host)) return { host: '', missing: said(words.badHost, resource) };
    return { host: entry.host };
}

/**
 * The settings the poller is handed: the cadences of `slurm:`, the host resolved from the machine's
 * `hpc_host`, the resources of the latest portfolio snapshot (null while there is none) and the
 * sentences for having no host, and the sentences of a failed poll's hint.
 */
export function hpcSettingsOf(
    slurm: SlurmSettings,
    hpcHost: string | undefined,
    resources: Record<Id, Resource> | null,
    words: HostWords
): HpcSettings {
    const { resource, ...cadences } = slurm;
    return {
        ...hpcHostOf({
            ...(hpcHost === undefined ? {} : { hpcHost }),
            resource,
            resources,
            words
        }),
        ...cadences,
        words: words.poll
    };
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

/**
 * The host a cancel or a log runs against: the machine's own `hpc_host` as it stands, else the host
 * the poller resolves from the latest portfolio snapshot. `config` is read only without a machine
 * host, so a `slurm:` block that does not read does not stop a machine that names its host.
 */
export function hpcRouteHost(input: {
    hpcHost: string | undefined;
    hub: Hub;
    primary: string | null;
    config: () => Record<string, unknown>;
}): { host: string; missing?: string; unconfigured?: true } {
    if (input.hpcHost !== undefined) return { host: input.hpcHost };
    const config = input.config();
    return hpcHostOf({
        resource: slurmSettings(config).resource,
        resources: latestResources(input.hub, input.primary),
        words: hostWordsOf(config)
    });
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
        badHost: word(textCatalog(config)['hpc.host_unusable'], 'hpc.host_unusable')
    };
}
