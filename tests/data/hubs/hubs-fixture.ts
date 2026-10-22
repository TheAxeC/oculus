// Layer 4, test helper. Two hubs under the system temporary directory and the portfolio the watcher
// publishes for them, which is the entry point the server builds several hubs through.
//
// Both hubs are copies of tests/fixtures/hubs/demo/, so every id of one is also an id of the other.
// The hubs are the folders of an unsaved workspace, the first of them its primary, and the
// watcher's first build is read from its channels and the watcher is closed after it, so nothing
// here waits on the disk.

import { cpSync } from 'node:fs';
import { join } from 'node:path';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { AuditPayload, FeedsPayload, Snapshot } from '../../../src/lib/data/model/index.ts';
import { Hub } from '../../../src/lib/server/core/channels.ts';
import type { Workspace } from '../../../src/lib/server/files/workspace/follow.ts';
import { watchPortfolio, type WatchOptions } from '../../../src/lib/server/root/watch/portfolio.ts';
import { scratchDir } from '../../fixtures/scratch.ts';
import { workspaceWith, type FolderSpec } from '../../fixtures/hubs/workspace.ts';

/** The demo hub the copies are made from. */
const DEMO = join(engineDir(), 'tests', 'fixtures', 'hubs', 'demo');

/** Two copies of the demo hub, the first hub's and the second's, and the folder holding both. */
type Copies = { base: string; hub: string; lab: string };

export function copies(): Copies {
    const base = scratchDir('oculus-hubs-');
    const hub = join(base, 'hub');
    const lab = join(base, 'lab');
    cpSync(DEMO, hub, { recursive: true });
    cpSync(DEMO, lab, { recursive: true });
    return { base, hub, lab };
}

/** What the watcher published for a hub on its first build. */
export type Published = { snapshot: Snapshot; audit: AuditPayload; feeds: FeedsPayload };

/** The channels of the watcher's first build over a workspace, with the build options given;
 * the watcher is closed after the build. */
export function watchedOnce(workspace: Workspace, options: WatchOptions = {}): Hub {
    const channels = new Hub();
    const watcher = watchPortfolio(
        channels,
        {
            engine: engineDir(),
            icons: { set: {} },
            host: { name: 'test', address: '127.0.0.1' },
            open: () => workspace.open(),
            settings: (dir) => loadConfig(engineDir(), { hub: dir }),
            problems: () => []
        },
        { debounce: 20, ...options }
    );
    watcher.close();
    return channels;
}

/** The first build of the watcher over a workspace listing the given folders, the first primary. */
export function published(folders: readonly FolderSpec[], primary?: string): Published {
    const channels = watchedOnce(workspaceWith(folders, primary));
    return {
        snapshot: channels.latest('portfolio')?.payload as Snapshot,
        audit: channels.latest('audit')?.payload as AuditPayload,
        feeds: channels.latest('feeds')?.payload as FeedsPayload
    };
}
