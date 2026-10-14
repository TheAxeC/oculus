// Layer 2, server. The parse of the engine's config folder and of the hub's settings file, kept by
// the server context between requests. Reading and parsing every config file costs about 75 ms and
// holds the one event loop the socket's upgrade waits on, and a page that boots makes several
// requests at once, so a request takes the parse the previous request made while the folder and
// the file are as they were: the stamp of the folder (the path, size, inode and times of every
// entry) and of the file (its size, inode and times) is the same, and so is the hub the parse was
// made for. Adding, removing or writing a file of the folder, or writing the settings file, moves
// the stamp, so the next request parses again. The settings file is `<hub>/.oculus/config.yml` and
// the hub is the open workspace's primary at each request; a hub without the file is stamped as
// absent, so making the file moves the stamp.
//
// The vocabulary of the hubs of the workspace (their domains and theme words, read from each hub's
// registry files) is kept the same way: its stamp adds the settings file of every other hub and the
// registry files the last read took the vocabulary from, so a request reads it again only when one
// of those files or the engine's folder changed.
//
// A stamp that cannot be made (an entry that cannot be read, such as a dangling link) says
// nothing about whether the folder changed, so a parse made under it is returned and not kept,
// and the next request parses again. A finding of a parse is said when the parse is made.

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { HUB_FILE } from '../../../data/helpers/hub-names.ts';
import type { HubRoot } from '../../../data/index.ts';
import type { Finding, HubVocabs } from '../../../data/model/index.ts';
import { configDir, type loadConfig } from '../../../data/sources/config.ts';

/** What one parse of the config folder gives. */
type LoadedConfig = ReturnType<typeof loadConfig>;

/**
 * The parse of the config, made again when a file of the folder or the hub's settings file changed.
 */
export type ConfigCache = {
    read: () => LoadedConfig;
    /** The vocabulary of every hub of the workspace, for the records of that hub alone. */
    vocab: () => HubVocabs;
};

/** The stamp of a folder that could not be listed or stat'ed, which is never kept. */
const UNREADABLE = 'unreadable';

/** The stamp of a folder or file that is not there, which a later write of it moves. */
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

/** The size, inode and times of one file, ABSENT for a file that is not there. */
function fileStamp(file: string): string {
    try {
        const info = statSync(file);
        return `${info.ino}:${info.size}:${info.mtimeMs}:${info.ctimeMs}`;
    } catch (error) {
        return (error as NodeJS.ErrnoException).code === 'ENOENT' ? ABSENT : UNREADABLE;
    }
}

/** The stamps of a list of files, one line each. */
function filesStamp(files: readonly string[]): string {
    return files.map(fileStamp).join('\n');
}

/** What the engine's folder and the hub's settings file hold, and which hub the file is of. */
function configStamp(engine: string, hub: string | null): string {
    const engineStamp = folderStamp(configDir(engine));
    const fileOfHub = hub === null ? ABSENT : fileStamp(join(hub, HUB_FILE));
    if (engineStamp === UNREADABLE || fileOfHub === UNREADABLE) return UNREADABLE;
    return `${engineStamp}\n--hub ${hub ?? ''}\n${fileOfHub}`;
}

/** What the cache needs of the server: where the folders are, how to parse, where findings go. */
export type ConfigCacheDeps = {
    engine: string;
    /** The primary hub's folder, read at each request; null while the workspace has no primary. */
    hub: () => string | null;
    load: () => LoadedConfig;
    report: (findings: Finding[]) => void;
    /** The name of the primary hub, and the hubs of the workspace other than it. */
    primary: () => string | null;
    others: () => HubRoot[];
    /**
     * The vocabulary of the hubs, read by the primary's config and each other hub's settings from
     * the hubs' registry files, and the files it was read from.
     */
    vocabs: (primary: LoadedConfig, others: HubRoot[]) => { vocabs: HubVocabs; files: string[] };
};

/**
 * A cache over one engine's config folder and the hub's settings file, empty until the first read.
 */
export function createConfigCache(deps: ConfigCacheDeps): ConfigCache {
    let held: { stamp: string; read: LoadedConfig } | undefined;
    let heldVocab: { stamp: string; files: string[]; read: string; vocab: HubVocabs } | undefined;
    const read = (): LoadedConfig => {
        const stamp = configStamp(deps.engine, deps.hub());
        if (stamp !== UNREADABLE && held?.stamp === stamp) return held.read;
        const parsed = deps.load();
        deps.report(parsed.findings);
        held = stamp === UNREADABLE ? undefined : { stamp, read: parsed };
        return parsed;
    };
    return {
        read,
        vocab() {
            const others = deps.others();
            const stamps = [
                configStamp(deps.engine, deps.hub()),
                ...others.map((one) => fileStamp(join(one.dir, HUB_FILE)))
            ];
            const readable = !stamps.includes(UNREADABLE);
            const names = others.map((one) => one.key).join('\n');
            const stamp = `${deps.primary() ?? ''}\n${names}\n${stamps.join('\n')}`;
            if (
                readable &&
                heldVocab?.stamp === stamp &&
                filesStamp(heldVocab.files) === heldVocab.read
            ) {
                return heldVocab.vocab;
            }
            const made = deps.vocabs(read(), others);
            const files = filesStamp(made.files);
            const kept = readable && !files.split('\n').includes(UNREADABLE);
            heldVocab = kept
                ? { stamp, files: made.files, read: files, vocab: made.vocabs }
                : undefined;
            return made.vocabs;
        }
    };
}
