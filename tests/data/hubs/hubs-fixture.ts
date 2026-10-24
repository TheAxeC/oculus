// Layer 4, test helper. Hubs under the system temporary directory and the portfolio the watcher
// publishes for them, which is the entry point the server builds several hubs through.
//
// The hubs are copies of tests/fixtures/hubs/demo/, so every key of one is also a key of the
// others. The hubs are the folders of an unsaved workspace, the one named as primary its primary,
// and the watcher's first build is read from its channels and the watcher is closed after it, so
// nothing here waits on the disk.

import { cpSync } from 'node:fs';
import { join } from 'node:path';
import { portfolioConfigFrom } from '../../../src/lib/data/index.ts';
import { engineDir, loadConfig } from '../../../src/lib/data/sources/config.ts';
import type { AuditPayload, FeedsPayload, Snapshot } from '../../../src/lib/data/model/index.ts';
import type { ReferenceIndex } from '../../../src/lib/data/snapshot/references/model.ts';
import type { SchemaSet } from '../../../src/lib/data/snapshot/schema/set.ts';
import { Hub } from '../../../src/lib/server/core/channels.ts';
import { fsWrites } from '../../../src/lib/server/core/json.ts';
import type { PrimaryTarget } from '../../../src/lib/server/edit/writes.ts';
import { careerRules } from '../../../src/lib/server/edit/writes/subtasks.ts';
import type { Workspace } from '../../../src/lib/server/files/workspace/follow.ts';
import {
    watchPortfolio,
    type WatchOptions
} from '../../../src/lib/server/root/watch/portfolio/portfolio.ts';
import { scratchDir } from '../../fixtures/scratch.ts';
import { workspaceWith, type FolderSpec } from '../../fixtures/hubs/workspace.ts';

/** The demo hub the copies are made from. */
const DEMO = join(engineDir(), 'tests', 'fixtures', 'hubs', 'demo');

/** Two copies of the demo hub, the first hub's and the second's, and the folder holding both. */
type Copies = { base: string; hub: string; lab: string };

export function copies(): Copies {
    const base = scratchDir('oculus-hubs-');
    return { base, hub: copyHub(base, 'hub'), lab: copyHub(base, 'lab') };
}

/** One more copy of the demo hub in the folder `base`, under the name `name`, for a third hub. */
export function copyHub(base: string, name: string): string {
    const dir = join(base, name);
    cpSync(DEMO, dir, { recursive: true });
    return dir;
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

/** What the watcher's first build handed the language server relay: the schemas and the index. */
export type Indexed = { schemas: SchemaSet; references: ReferenceIndex };

/** The schemas and the reference index of the watcher's first build over these folders. */
export function indexedOnce(folders: readonly FolderSpec[], primary?: string): Indexed {
    const held: Indexed[] = [];
    watchedOnce(workspaceWith(folders, primary), {
        schemas: (schemas, references) => held.push({ schemas, references })
    });
    const first = held.at(0);
    if (first === undefined) throw new Error('the first build handed over no schemas');
    return first;
}

/**
 * A write target over hubs of the demo's shape, each read with its own settings: the hub named
 * `primary` is the target's own and every other is one of its `hubs`, and the change log lies in
 * the folder `base`.
 */
export function hubsTarget(
    base: string,
    folders: readonly FolderSpec[],
    primary: string
): PrimaryTarget {
    const configOf = (dir: string) =>
        portfolioConfigFrom(loadConfig(engineDir(), { hub: dir }).config);
    const own = folders.find((one) => one.name === primary);
    if (own === undefined) throw new Error(`no folder is named ${primary}`);
    return {
        hub: own.dir,
        primary,
        config: configOf(own.dir),
        engine: engineDir(),
        engineConfig: () => loadConfig(engineDir()).config,
        career: careerRules(loadConfig(engineDir(), { hub: own.dir }).config),
        projects: () => [],
        glyphs: [],
        hubs: folders
            .filter((one) => one.name !== primary)
            .map((one) => ({ key: one.name, hub: one.dir, config: configOf(one.dir) })),
        changes: { file: join(base, 'changes.jsonl'), keep: 500, writes: fsWrites() }
    };
}
