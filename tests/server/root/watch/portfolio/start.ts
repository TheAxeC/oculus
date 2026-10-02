// Layer 4, test helper. What the portfolio watcher's cases share: the messages of one channel, the
// wait for a quiet point, and a started watcher over a fresh hub and engine whose close every case
// leaves to stopWatchers.

import { join } from 'node:path';
import { Hub } from '../../../../../src/lib/server/core/channels.ts';
import type { Root } from '../../../../../src/lib/server/files/files.ts';
import type { IconMemory } from '../../../../../src/lib/data/sources/config.ts';
import { watchPortfolio } from '../../../../../src/lib/server/root/watch/portfolio.ts';
import type { WatchOptions, Watcher } from '../../../../../src/lib/server/root/watch/portfolio.ts';
import type { Message } from '../../../../../src/lib/data/model/index.ts';
import { HOST, buildEngine, buildHub, recording, sleep } from '../probe.ts';

/** The watchers a case started and has not closed. */
export const watchers: Watcher[] = [];

/** Close every watcher a case started. */
export function stopWatchers(): void {
    while (watchers.length > 0) watchers.pop()?.close();
}

/** The messages of one channel, newest last. */
export function on(got: Message[], channel: string): Message[] {
    return got.filter((message) => message.channel === channel);
}

/**
 * Wait until the messages stop arriving. The first fs.watch of a process on darwin can deliver an
 * event for a write that happened shortly before the watch was opened, which is the fixture's own
 * writes here; the watcher then rebuilds once more with the same result. Measured with three
 * watchers in one process: the first saw the extra rebuild, the second and third did not. So a test
 * that counts rebuilds counts them from a quiet point, never from the start.
 */
export async function quiet(got: Message[], ms = 100): Promise<number> {
    let held = -1;
    while (held !== got.length) {
        held = got.length;
        await sleep(ms);
    }
    return held;
}

/** What a case may hand the watcher beyond the hub and the engine: the roots and their file. */
type Rooted = { roots?: () => Root[]; workspacesFile?: string };

/** A started watcher over a fresh hub and engine, subscribed before the starting publications. */
export function start(
    prepare?: (hub: string, engine: string) => void,
    icons: IconMemory = { set: {} },
    options: WatchOptions = { debounce: 20 },
    rooted: Rooted = {}
): { hub: string; engine: string; got: Message[]; icons: IconMemory; channels: Hub } {
    const hub = buildHub();
    const engine = buildEngine();
    prepare?.(hub, engine);
    const channels = new Hub();
    const client = recording();
    channels.subscribe(client.sink, ['portfolio', 'config', 'feeds', 'audit']);
    const paths = {
        hub,
        engine,
        icons,
        host: HOST,
        roots: rooted.roots ?? ((): Root[] => []),
        workspacesFile: rooted.workspacesFile ?? join(engine, 'workspaces.json')
    };
    watchers.push(watchPortfolio(channels, paths, options));
    return { hub, engine, got: client.got, icons, channels };
}
