// Layer 2, server. The host the Live HPC poller connects to. The machine's own `hpc_host` of
// local.yml wins when it names one; otherwise it is the ssh alias of the cluster entry that
// `slurm.resource` of behavior.yml names in registries/resources.yml; otherwise there is no host
// and a sentence says why. The resolver is pure, so the poller, the config push, the portfolio
// rebuild and the route all give one answer for one input.

import type { Id, Resource, Snapshot } from '../../../data/model/index.ts';
import { slurmSettings, textCatalog, type SlurmSettings } from '../../../data/sources/config.ts';
import type { Hub } from '../../core/channels.ts';
import type { HpcSettings } from './poll.ts';

/** The sentences for having no host. Each takes the resource key as `{0}`, except the first. */
export type HostWords = {
    notRead: string;
    unknown: string;
    notCluster: string;
    noHost: string;
    badHost: string;
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
}): { host: string; missing?: string } {
    const { hpcHost, resource, resources, words } = input;
    if (hpcHost !== undefined) return { host: hpcHost };
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
 * The settings the poller is handed: the cadences of `slurm:` and the host resolved from the
 * machine's `hpc_host`, the resources of the latest portfolio snapshot (null while there is none)
 * and the sentences for having no host.
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
        ...cadences
    };
}

/** The resources of the latest portfolio snapshot the hub holds, or null while there is none. */
export function latestResources(hub: Hub): Record<Id, Resource> | null {
    const message = hub.latest('portfolio');
    return message === undefined ? null : (message.payload as Snapshot).entities.resources;
}

/**
 * The host a cancel or a log runs against: the machine's own `hpc_host` as it stands, else the host
 * the poller resolves from the latest portfolio snapshot. `config` is read only without a machine
 * host, so a `slurm:` block that does not read does not stop a machine that names its host.
 */
export function hpcRouteHost(input: {
    hpcHost: string | undefined;
    hub: Hub;
    config: () => Record<string, unknown>;
}): { host: string; missing?: string } {
    if (input.hpcHost !== undefined) return { host: input.hpcHost };
    const config = input.config();
    return hpcHostOf({
        resource: slurmSettings(config).resource,
        resources: latestResources(input.hub),
        words: hostWordsOf(config)
    });
}

/** The five sentences out of a merged configuration's text catalog; a throw names a bad key. */
export function hostWordsOf(config: Record<string, unknown>): HostWords {
    const word = (sentence: unknown, key: string): string => {
        if (typeof sentence !== 'string') throw new Error(`text catalog: ${key} must be a string`);
        return sentence;
    };
    return {
        notRead: word(textCatalog(config)['hpc.host_not_read'], 'hpc.host_not_read'),
        unknown: word(textCatalog(config)['hpc.host_unknown'], 'hpc.host_unknown'),
        notCluster: word(textCatalog(config)['hpc.host_not_cluster'], 'hpc.host_not_cluster'),
        noHost: word(textCatalog(config)['hpc.host_none'], 'hpc.host_none'),
        badHost: word(textCatalog(config)['hpc.host_unusable'], 'hpc.host_unusable')
    };
}
