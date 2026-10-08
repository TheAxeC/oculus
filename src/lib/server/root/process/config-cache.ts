// Layer 2, server. The parse of the engine's config folder, kept by the server context between
// requests. Reading and parsing every config file costs about 75 ms and holds the one event loop
// the socket's upgrade waits on, and a page that boots makes several requests at once, so a
// request takes the parse a request before it made while the folder is as it was: the stamp of
// the folder, the path, size, inode and times of every entry, is the same. Adding, removing or
// writing a file moves the stamp, at any depth, so the next request parses again.
//
// A stamp that cannot be made (an entry that cannot be read, such as a dangling link) says
// nothing about whether the folder changed, so a parse made under it is returned and not kept,
// and the next request parses again. A finding of a parse is said when the parse is made.

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Finding } from '../../../data/model/index.ts';
import { configDir, type loadConfig } from '../../../data/sources/config.ts';

/** What one parse of the config folder gives. */
type LoadedConfig = ReturnType<typeof loadConfig>;

/** The parse of the config folder, made again when a file of the folder changed. */
export type ConfigCache = {
    read: () => LoadedConfig;
};

/** The stamp of a folder that could not be listed or stat'ed, which is never kept. */
const UNREADABLE = 'unreadable';

/** What the config folder holds now: every entry's path, size and times, which any write moves. */
function configStamp(engine: string): string {
    const dir = configDir(engine);
    try {
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

/** What the cache needs of the server: where the folder is, how to parse it, where findings go. */
export type ConfigCacheDeps = {
    engine: string;
    load: () => LoadedConfig;
    report: (findings: Finding[]) => void;
};

/** A cache over one engine's config folder, empty until the first read. */
export function createConfigCache(deps: ConfigCacheDeps): ConfigCache {
    let held: { stamp: string; read: LoadedConfig } | undefined;
    return {
        read() {
            const stamp = configStamp(deps.engine);
            if (stamp !== UNREADABLE && held?.stamp === stamp) return held.read;
            const read = deps.load();
            deps.report(read.findings);
            held = stamp === UNREADABLE ? undefined : { stamp, read };
            return read;
        }
    };
}
