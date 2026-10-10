// Layer 4, test helper. Two hubs under the system temporary directory and the portfolio the watcher
// publishes for them, which is the entry point the server builds several hubs through.
//
// Both hubs are copies of demo/, so every id of one is also an id of the other. A hub root is named
// in the first hub's `.oculus/config/sources.yml`, and the watcher's first build is read from its
// channels and the watcher is closed after it, so nothing here waits on the disk.

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { stringify } from 'yaml';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { AuditPayload, FeedsPayload, Snapshot } from '../../../src/lib/data/model/index.ts';
import { Hub } from '../../../src/lib/server/core/channels.ts';
import { browserRoots } from '../../../src/lib/server/files/roots.ts';
import { watchPortfolio } from '../../../src/lib/server/root/watch/portfolio.ts';
import { scratchDir } from '../../fixtures/scratch.ts';

/** Two copies of the demo hub, the first hub's and the second's, and the folder holding both. */
export type Copies = { base: string; hub: string; lab: string };

export function copies(): Copies {
    const base = scratchDir('oculus-hubs-');
    const hub = join(base, 'hub');
    const lab = join(base, 'lab');
    cpSync(join(engineDir(), 'demo'), hub, { recursive: true });
    cpSync(join(engineDir(), 'demo'), lab, { recursive: true });
    return { base, hub, lab };
}

/** Name the entries as the `roots:` of the first hub's layer of sources.yml. */
export function nameRoots(hub: string, roots: unknown[]): void {
    const dir = join(hub, '.oculus', 'config');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'sources.yml'), stringify({ roots }));
}

/** What the watcher published for a hub on its first build. */
export type Published = { snapshot: Snapshot; audit: AuditPayload; feeds: FeedsPayload };

/** The first build of the watcher over `hub`, whose workspaces file is beside `base`. */
export function published(base: string, hub: string): Published {
    const channels = new Hub();
    const engine = engineDir();
    const watcher = watchPortfolio(
        channels,
        {
            hub,
            engine,
            icons: { set: {} },
            host: { name: 'test', address: '127.0.0.1' },
            roots: () =>
                browserRoots({
                    config: loadConfig(engine, { hub }).config,
                    engine,
                    local: { hub, workspaces: join(base, 'workspaces.json') }
                }),
            workspacesFile: join(base, 'workspaces.json')
        },
        { debounce: 20 }
    );
    try {
        return {
            snapshot: channels.latest('portfolio')?.payload as Snapshot,
            audit: channels.latest('audit')?.payload as AuditPayload,
            feeds: channels.latest('feeds')?.payload as FeedsPayload
        };
    } finally {
        watcher.close();
    }
}
