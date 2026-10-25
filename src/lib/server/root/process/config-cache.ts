// Layer 2, server. The parse of the engine's config folder, of the hub's settings file and of the
// open workspace file's `settings:`, kept by the server context between requests. Reading and
// parsing every config file costs about 75 ms and holds the one event loop the socket's upgrade
// waits on, and a page that boots makes several requests at once, so a request takes the parse the
// previous request made while the folder and the files are as they were: the stamp of the folder
// (the path, size, inode and times of every entry) and of each file (its size, inode and times) is
// the same, and so are the hub and the workspace file the parse was made for. Adding, removing or
// writing a file of the folder, or writing, adding or removing either file, moves the stamp, so the
// next request parses again. The settings file is `<hub>/.oculus/config.yml`, the hub is the open
// workspace's primary at each request, and the workspace file is the one open at each request; a
// file that is not there is stamped as absent, so making it moves the stamp.
//
// The display language the workspace's `locale` names is read from the apps' `localizations`, so
// the stamp also holds what the apps' display languages are made of (`language`): an app approved,
// enabled, changed or removed, or a file of a language's folder written, moves it.
//
// The settings of every other hub of the workspace (the engine's folder parsed under that hub's own
// `.oculus/config.yml`, with the words of the primary's parse as its text catalog, so its findings
// and records are worded in the workspace's language) are kept the same way, one parse per hub
// folder under the stamp of the engine's folder, that hub's settings file and the primary's. A
// write target, a file operation, a document, a deck, a terminal action and a rebuild each read the
// settings of every other hub, and a parse of the whole folder per hub at each of them would hold
// the event loop as the primary's would, so each of them takes the parse kept here. A parse is kept
// only for a hub of the workspace open at the call, and every read first drops the parses of the
// hubs that left the workspace, so a folder outside it is parsed at each read. Its findings are not
// said here: the rebuild reports them with the build of that hub.
//
// The vocabulary of the hubs of the workspace (their domains and theme words, read from each hub's
// registry files) is kept the same way: its stamp adds the settings file of every other hub and the
// registry files the last read took the vocabulary from, so a request reads it again only when one
// of those files or the engine's folder changed. It reads each other hub's settings through the
// kept parse of that hub.
//
// A stamp that cannot be made (an entry that cannot be read, such as a dangling link) says
// nothing about whether the folder changed, so a parse made under it is returned and not kept,
// and the next request parses again. A finding of the primary's parse is said once, by the first
// request that takes the parse. The server's own readers of the settings (the relay, the debugger,
// the apps, the schedules, the git watch, the rebuild's hook) take the same kept parse and say no
// finding, so a parse one of them makes is said by the next request, as when that request had
// made it.

import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { isMap } from '../../../data/helpers/guards.ts';
import { HUB_FILE } from '../../../data/helpers/hub-names.ts';
import type { HubRoot, HubSettings } from '../../../data/index.ts';
import type { Finding, HubVocabs } from '../../../data/model/index.ts';
import { configDir, type loadConfig } from '../../../data/sources/config.ts';

/** What one parse of the config folder gives. */
type LoadedConfig = ReturnType<typeof loadConfig>;

/**
 * The parse of the config, made again when a file of the folder or the hub's settings file changed.
 */
export type ConfigCache = {
    read: () => LoadedConfig;
    /**
     * The same parse for a reader of the server's own (the relay, the debugger, the apps, the
     * schedules, the git watch, the rebuild's hook), which says no finding: a parse it makes is
     * kept and its findings are said by the next `read`.
     */
    quiet: () => LoadedConfig;
    /**
     * The parse of the engine's folder under the settings file of the hub at a folder, a hub of the
     * workspace other than the primary, made again when a file of the folder or that settings file
     * changed.
     */
    hub: HubSettings;
    /**
     * The parse of the engine's folder alone, under no hub's settings, which the writes that read
     * the engine's own lists (the Lit Watch buckets, the Literature path) take; made again when a
     * file of the folder changed. Its findings are not said here: the primary's parse says them.
     */
    defaults: () => LoadedConfig;
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

/**
 * What the engine's folder, the hub's settings file and the open workspace file hold, which hub and
 * which workspace file they are, and what the apps' display languages are made of.
 */
function configStamp(
    engine: string,
    hub: string | null,
    workspace: string | null = null,
    language = ''
): string {
    const engineStamp = folderStamp(configDir(engine));
    const fileOfHub = hub === null ? ABSENT : fileStamp(join(hub, HUB_FILE));
    const fileOfWorkspace = workspace === null ? ABSENT : fileStamp(workspace);
    const stamps = [engineStamp, fileOfHub, fileOfWorkspace];
    if (stamps.includes(UNREADABLE)) return UNREADABLE;
    return `${engineStamp}\n--hub ${hub ?? ''}\n${fileOfHub}\n--workspace ${workspace ?? ''}\n${fileOfWorkspace}\n--language\n${language}`;
}

/** What the cache needs of the server: where the folders are, how to parse, where findings go. */
export type ConfigCacheDeps = {
    engine: string;
    /** The primary hub's folder, read at each request; null while the workspace has no primary. */
    hub: () => string | null;
    /** The open workspace file, read at each request; null while the workspace is unsaved. */
    workspace: () => string | null;
    load: () => LoadedConfig;
    /**
     * Parse the engine's folder under the settings file of the hub at `dir`, or under no hub's
     * settings for `null`; `words`, when given, is the text catalog the parse is worded in.
     */
    loadHub: (dir: string | null, words?: Readonly<Record<string, unknown>>) => LoadedConfig;
    /** What the apps' display languages are made of now; none when absent. */
    language?: () => string;
    report: (findings: Finding[]) => void;
    /**
     * The name of the primary hub, the hubs of the workspace other than it, and the names of the
     * workspace's folders in its order.
     */
    primary: () => string | null;
    others: () => HubRoot[];
    folders: () => string[];
    /**
     * The vocabulary of the hubs, read by the primary's config and each other hub's settings, as
     * `settings` gives them, from the hubs' registry files, with oculus's own words from `own`, the
     * parse under no hub's settings; and the files it was read from.
     */
    vocabs: (
        primary: LoadedConfig,
        others: HubRoot[],
        settings: HubSettings,
        own: LoadedConfig
    ) => { vocabs: HubVocabs; files: string[] };
};

/**
 * A cache over one engine's config folder and the hub's settings file, empty until the first read.
 */
export function createConfigCache(deps: ConfigCacheDeps): ConfigCache {
    let held: { stamp: string; read: LoadedConfig; said: boolean } | undefined;
    let heldVocab: { stamp: string; files: string[]; read: string; vocab: HubVocabs } | undefined;
    const heldHubs = new Map<string, { stamp: string; read: LoadedConfig }>();
    let heldDefaults: { stamp: string; read: LoadedConfig } | undefined;
    const primaryStamp = (): string =>
        configStamp(deps.engine, deps.hub(), deps.workspace(), deps.language?.() ?? '');
    const take = (say: boolean): LoadedConfig => {
        const stamp = primaryStamp();
        if (stamp !== UNREADABLE && held?.stamp === stamp) {
            if (say && !held.said) {
                deps.report(held.read.findings);
                held.said = true;
            }
            return held.read;
        }
        const parsed = deps.load();
        if (say) deps.report(parsed.findings);
        held = stamp === UNREADABLE ? undefined : { stamp, read: parsed, said: say };
        return parsed;
    };
    const read = (): LoadedConfig => take(true);
    const hub = (dir: string): LoadedConfig => {
        const open = new Set(deps.others().map((one) => one.dir));
        for (const one of heldHubs.keys()) if (!open.has(one)) heldHubs.delete(one);
        const own = configStamp(deps.engine, dir);
        const primary = primaryStamp();
        const unreadable = own === UNREADABLE || primary === UNREADABLE;
        const stamp = unreadable ? UNREADABLE : `${own}\n--primary\n${primary}`;
        const kept = heldHubs.get(dir);
        if (stamp !== UNREADABLE && kept?.stamp === stamp) return kept.read;
        const words = take(false).config.text;
        const parsed = deps.loadHub(dir, isMap(words) ? words : undefined);
        if (stamp !== UNREADABLE && open.has(dir)) heldHubs.set(dir, { stamp, read: parsed });
        else heldHubs.delete(dir);
        return parsed;
    };
    const defaults = (): LoadedConfig => {
        const stamp = configStamp(deps.engine, null);
        if (stamp !== UNREADABLE && heldDefaults?.stamp === stamp) return heldDefaults.read;
        const parsed = deps.loadHub(null);
        heldDefaults = stamp === UNREADABLE ? undefined : { stamp, read: parsed };
        return parsed;
    };
    return {
        read,
        quiet: () => take(false),
        hub,
        defaults,
        vocab() {
            const others = deps.others();
            const stamps = [
                primaryStamp(),
                ...others.map((one) => fileStamp(join(one.dir, HUB_FILE)))
            ];
            const readable = !stamps.includes(UNREADABLE);
            const names = [...others.map((one) => one.key), '--folders', ...deps.folders()];
            const stamp = `${deps.primary() ?? ''}\n${names.join('\n')}\n${stamps.join('\n')}`;
            if (
                readable &&
                heldVocab?.stamp === stamp &&
                filesStamp(heldVocab.files) === heldVocab.read
            ) {
                return heldVocab.vocab;
            }
            const made = deps.vocabs(read(), others, hub, defaults());
            const files = filesStamp(made.files);
            const kept = readable && !files.split('\n').includes(UNREADABLE);
            heldVocab = kept
                ? { stamp, files: made.files, read: files, vocab: made.vocabs }
                : undefined;
            return made.vocabs;
        }
    };
}
