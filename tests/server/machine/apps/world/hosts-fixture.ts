// Layer 4, test helper. The hosts and the secrets of the apps over doubles: a keyring that keeps
// its entries in memory, a store that holds nothing, and a runner that is never started unless a
// case hands in its own `spawn`.
//
// Nothing here starts a process or reads the machine's keyring.

import { terminalsDouble } from './terminals-double.ts';
import { engineDir, loadConfig } from '../../../../../src/lib/data/sources/config.ts';
import { appsSettings, textCatalog } from '../../../../../src/lib/data/sources/config.ts';
import type { Hub } from '../../../../../src/lib/server/core/channels.ts';
import {
    AppHosts,
    type HostsOptions
} from '../../../../../src/lib/server/machine/apps/host/manager.ts';
import { diskFs } from '../../../../../src/lib/server/machine/apps/reach/open.ts';
import { noApps } from '../../../../../src/lib/server/machine/apps/read/held.ts';
import {
    createSecrets,
    type AppSecrets,
    type Keyring
} from '../../../../../src/lib/server/machine/apps/secrets/secrets.ts';

const { config } = loadConfig(engineDir());

/** A keyring that keeps its entries in memory, by service and account. */
export function memoryKeyring(): Keyring & { entries: Map<string, Uint8Array> } {
    const entries = new Map<string, Uint8Array>();
    const at = (service: string, account: string): string => `${service}\u0000${account}`;
    return {
        entries,
        get: (service, account) => Promise.resolve(entries.get(at(service, account))),
        set: (service, account, value) => {
            entries.set(at(service, account), value);
            return Promise.resolve();
        },
        remove: (service, account) => Promise.resolve(entries.delete(at(service, account))),
        accounts: (service) =>
            Promise.resolve(
                [...entries.keys()]
                    .filter((key) => key.startsWith(`${service}\u0000`))
                    .map((key) => key.slice(service.length + 1))
            )
    };
}

/** The secrets over a keyring, the in-memory one when none is given. */
export function secretsOf(keyring: Keyring = memoryKeyring()): AppSecrets {
    return createSecrets({ keyring, unavailable: () => 'the keyring is not available' });
}

/** The hosts over doubles; any option can be replaced. */
export function hostsFixture(
    hub: Hub,
    over: Partial<HostsOptions> = {}
): { hosts: AppHosts; secrets: AppSecrets } {
    const secrets = over.secrets ?? secretsOf();
    const hosts = new AppHosts({
        hub,
        apps: { held: noApps },
        settings: () => appsSettings(config),
        roots: () => [],
        languages: () => new Map(),
        approved: () => new Set(),
        store: { get: () => ({}), update: () => Promise.resolve({ ok: true }) },
        secrets,
        text: () => textCatalog(config),
        tools: {
            context: () => ({
                roots: [],
                configDir: '/fixture/config',
                closedPaths: [],
                privateReal: [],
                fs: diskFs
            }),
            maxBytes: () => 1024 * 1024,
            scanEntries: () => 1000,
            languages: () => new Map(),
            ops: () => Promise.resolve({ ok: false, error: 'outside' }),
            terminals: terminalsDouble()
        },
        values: () => ({}),
        node: process.execPath,
        runner: '/fixture/host-runner.mjs',
        jsonrpc: '/fixture/vscode-jsonrpc/node.js',
        ...over
    });
    return { hosts, secrets };
}
