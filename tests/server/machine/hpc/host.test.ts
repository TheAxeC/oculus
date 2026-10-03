// Layer 2, server tests. The host the Live HPC poller and the HPC route connect to: the machine's
// own `hpc_host` when it names one, else the ssh alias of the cluster entry `slurm.resource` names,
// and otherwise no host and the sentence for why. The resolver is pure, so each case hands it the
// registry as the snapshot holds it.

import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildPortfolio, portfolioConfigFrom } from '../../../../src/lib/data/index.ts';
import type { Resource } from '../../../../src/lib/data/model/index.ts';
import { engineDir, loadConfig, slurmSettings } from '../../../../src/lib/data/sources/config.ts';
import { Hub } from '../../../../src/lib/server/core/channels.ts';
import {
    hostWordsOf,
    hpcRouteHost,
    hpcSettingsOf,
    type HostWords
} from '../../../../src/lib/server/machine/hpc/host.ts';

const WORDS: HostWords = {
    notRead: 'the resources registry is not read yet',
    unknown: '{0} names no resource',
    notCluster: '{0} is not a cluster',
    noHost: 'the cluster {0} has no host',
    badHost: 'the host of the cluster {0} is not a usable ssh alias'
};

function resource(id: string, over: Partial<Resource> = {}): Resource {
    return { id, name: id, kind: 'cluster', links: [], order: 0, ...over };
}

/** The registry a case reads, built per call so no case shares one with another. */
const resources = (): Record<string, Resource> => ({
    utwente: resource('utwente', { host: 'utwente' }),
    'this-mac': resource('this-mac', { kind: 'machine', host: 'laptop' }),
    bare: resource('bare'),
    storage: resource('storage', { kind: 'storage' })
});

/** The host and sentence the poller is handed for the key, a machine host and a registry. */
function settle(
    key: string,
    hpcHost: string | undefined,
    registry: Record<string, Resource> | null
): { host: string; missing?: string } {
    const slurm = { resource: key, days: 3, pollMin: 20, quotaMin: 60, prewarm: true };
    const { host, missing } = hpcSettingsOf(slurm, hpcHost, registry, WORDS);
    return missing === undefined ? { host } : { host, missing };
}

function resolve(resource: string, over: { hpcHost?: string; resources?: null } = {}) {
    return settle(resource, over.hpcHost, 'resources' in over ? null : resources());
}

describe('the host of hpcSettingsOf', () => {
    it('gives the host of the cluster the key names', () => {
        expect(resolve('utwente')).toEqual({ host: 'utwente' });
    });

    it('prefers the machine host, whether or not the key resolves', () => {
        expect(resolve('utwente', { hpcHost: 'other' })).toEqual({ host: 'other' });
        expect(resolve('nowhere', { hpcHost: 'other' })).toEqual({ host: 'other' });
        expect(resolve('this-mac', { hpcHost: 'other' })).toEqual({ host: 'other' });
        expect(resolve('utwente', { hpcHost: 'other', resources: null })).toEqual({
            host: 'other'
        });
    });

    it('says the registry is not read when there is no snapshot', () => {
        expect(resolve('utwente', { resources: null })).toEqual({
            host: '',
            missing: 'the resources registry is not read yet'
        });
    });

    it('says the key names no resource', () => {
        expect(resolve('nowhere')).toEqual({ host: '', missing: 'nowhere names no resource' });
        expect(resolve('')).toEqual({ host: '', missing: ' names no resource' });
    });

    it('does not read a key off the prototype of the map', () => {
        for (const key of ['__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
            expect(resolve(key).host, key).toBe('');
            expect(resolve(key).missing, key).toBe(`${key} names no resource`);
        }
    });

    it('says an entry that is not a cluster is not one, even with a host', () => {
        expect(resolve('this-mac')).toEqual({ host: '', missing: 'this-mac is not a cluster' });
        expect(resolve('storage')).toEqual({ host: '', missing: 'storage is not a cluster' });
    });

    it('says a cluster with no host has none', () => {
        expect(resolve('bare')).toEqual({ host: '', missing: 'the cluster bare has no host' });
    });

    it('refuses a host ssh would read as an option, a second word or a control character', () => {
        const bad = [
            '-oProxyCommand=touch /tmp/x',
            '-J jump',
            'two words',
            'tab\there',
            'new\nline',
            'nul\u0000byte',
            'del\u007fchar',
            'semi;colon',
            'back`tick',
            '$(sub)',
            ''
        ];
        for (const host of bad) {
            const found = settle('c', undefined, { c: resource('c', { host }) });
            expect(found.host, JSON.stringify(host)).toBe('');
            expect(found.missing, JSON.stringify(host)).toBe(
                host === ''
                    ? 'the cluster c has no host'
                    : 'the host of the cluster c is not a usable ssh alias'
            );
        }
    });

    it('accepts an ssh alias of letters, digits and . _ @ -', () => {
        for (const host of [
            'utwente',
            'hpc-head1.utwente.nl',
            'user@login_2',
            '9lives',
            '_x',
            'a-b'
        ]) {
            const found = settle('c', undefined, { c: resource('c', { host }) });
            expect(found, host).toEqual({ host });
        }
    });
});

describe('hostWordsOf', () => {
    const catalog = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
        text: {
            hpc: {
                host_not_read: 'a',
                host_unknown: 'b {0}',
                host_not_cluster: 'c {0}',
                host_none: 'd {0}',
                host_unusable: 'e {0}'
            },
            ...over
        }
    });

    it('reads the five sentences from the text catalog', () => {
        expect(hostWordsOf(catalog())).toEqual({
            notRead: 'a',
            unknown: 'b {0}',
            notCluster: 'c {0}',
            noHost: 'd {0}',
            badHost: 'e {0}'
        });
    });

    it('throws naming the key when a sentence is missing', () => {
        const broken = { text: { hpc: { host_not_read: 'a' } } };
        expect(() => hostWordsOf(broken)).toThrow('hpc.host_unknown');
    });
});

describe('hpcRouteHost', () => {
    const config = (resource: string): Record<string, unknown> => ({
        slurm: { resource, days: 3, poll_min: 20, quota_min: 60, prewarm: true },
        text: {
            hpc: {
                host_not_read: WORDS.notRead,
                host_unknown: WORDS.unknown,
                host_not_cluster: WORDS.notCluster,
                host_none: WORDS.noHost,
                host_unusable: WORDS.badHost
            }
        }
    });
    const snapshot = (resources: Record<string, Resource>) => ({ entities: { resources } });

    it('gives the machine host and does not read the configuration', () => {
        const hub = new Hub();
        hub.publish('portfolio', snapshot(resources()));
        const read = (): Record<string, unknown> => {
            throw new Error('the configuration was read');
        };
        expect(hpcRouteHost({ hpcHost: 'other', hub, config: read })).toEqual({ host: 'other' });
    });

    it('gives the host of the cluster slurm.resource names in the latest snapshot', () => {
        const hub = new Hub();
        hub.publish('portfolio', snapshot(resources()));
        const route = () =>
            hpcRouteHost({ hpcHost: undefined, hub, config: () => config('utwente') });
        expect(route()).toEqual({ host: 'utwente' });
        hub.publish('portfolio', snapshot({ utwente: resource('utwente', { host: 'utwente2' }) }));
        expect(route()).toEqual({ host: 'utwente2' });
    });

    it('gives the not-read sentence while no snapshot was published', () => {
        const found = hpcRouteHost({
            hpcHost: undefined,
            hub: new Hub(),
            config: () => config('utwente')
        });
        expect(found).toEqual({ host: '', missing: 'the resources registry is not read yet' });
    });

    it('throws naming slurm.resource when the block does not read and no machine host is set', () => {
        const hub = new Hub();
        const config = (): Record<string, unknown> => ({ slurm: {} });
        expect(() => hpcRouteHost({ hpcHost: undefined, hub, config })).toThrow('slurm.resource');
    });
});

describe('the shipped configuration over the demo hub', () => {
    const engine = engineDir();
    const { config } = loadConfig(engine);
    const demo = buildPortfolio(join(engine, 'demo'), portfolioConfigFrom(config, engine));

    it('resolves slurm.resource to the host of the demo cluster', () => {
        const settings = hpcSettingsOf(
            slurmSettings(config),
            undefined,
            demo.entities.resources,
            hostWordsOf(config)
        );
        expect(settings.host).toBe('utwente');
        expect(settings.missing).toBeUndefined();
    });
});
