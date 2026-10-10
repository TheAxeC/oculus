// Layer 2, server. The parse of the engine's config folder and of the hub's layer, kept by the
// server context between requests. Reading and parsing every config file costs about 75 ms and
// holds the one event loop the socket's upgrade waits on, and a page that boots makes several
// requests at once, so a request takes the parse the previous request made while both folders are
// as they were: the stamp of each folder, the path, size, inode and times of every entry, is the
// same, and so is the hub the parse was made for. Adding, removing or writing a file of either
// folder moves the stamp, at any depth, so the next request parses again. The hub's layer is
// `<hub>/.oculus/config/` and the hub is read from `local.hub` at each request; a hub without the
// folder is stamped as absent, so making the folder moves the stamp.
//
// A stamp that cannot be made (an entry that cannot be read, such as a dangling link) says
// nothing about whether the folder changed, so a parse made under it is returned and not kept,
// and the next request parses again. A finding of a parse is said when the parse is made.

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { HUB_LAYER } from '../../../data/helpers/hub-names.ts';
import type { Finding } from '../../../data/model/index.ts';
import { configDir, type loadConfig } from '../../../data/sources/config.ts';

/** What one parse of the config folder gives. */
type LoadedConfig = ReturnType<typeof loadConfig>;

/** The parse of the config, made again when a file of either folder or the hub changed. */
export type ConfigCache = {
    read: () => LoadedConfig;
};

/** The stamp of a folder that could not be listed or stat'ed, which is never kept. */
const UNREADABLE = 'unreadable';

/** The stamp of a folder that is not there, which a later write of the folder moves. */
const ABSENT = 'absent';

/** What a folder holds: every entry's path, size and times, which any write moves. */
function folderStamp(dir: string): string {
    try {
        if (statSync(dir, { throwIfNoEntry: false }) === undefined) return ABSENT;
        return readdirSync(dir, { recursive: true })
            .map((name) => {
                const info = statSync(join(dir, String(name)));
                const held = info.isFile()
                    ? `${info.ino}:${info.size}:${info.mtimeMs}:${info.ctimeMs}`
                    : 'folder';
                return `${String(name)}:${held}`;
            })
            .sort()
            .join('\n');
    } catch {
        return UNREADABLE;
    }
}

/** What the engine's folder and the hub's layer hold, and which hub the layer is of. */
function configStamp(engine: string, hub: string): string {
    const engineStamp = folderStamp(configDir(engine));
    const layerStamp = hub === '' ? ABSENT : folderStamp(join(hub, HUB_LAYER));
    if (engineStamp === UNREADABLE || layerStamp === UNREADABLE) return UNREADABLE;
    return `${engineStamp}\n--hub ${hub}\n${layerStamp}`;
}

/** What the cache needs of the server: where the folders are, how to parse, where findings go. */
export type ConfigCacheDeps = {
    engine: string;
    /** The hub folder, read at each request. */
    hub: () => string;
    load: () => LoadedConfig;
    report: (findings: Finding[]) => void;
};

/** A cache over one engine's config folder and the hub's layer, empty until the first read. */
export function createConfigCache(deps: ConfigCacheDeps): ConfigCache {
    let held: { stamp: string; read: LoadedConfig } | undefined;
    return {
        read() {
            const stamp = configStamp(deps.engine, deps.hub());
            if (stamp !== UNREADABLE && held?.stamp === stamp) return held.read;
            const read = deps.load();
            deps.report(read.findings);
            held = stamp === UNREADABLE ? undefined : { stamp, read };
            return read;
        }
    };
}
