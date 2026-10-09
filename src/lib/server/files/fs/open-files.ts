// Layer 2, server. The open files: the `source:<root>/<path>` channels, one per file a page holds
// in a source tab, and what they publish, the SHA-256 of the file's bytes each time the file
// changes on disk. A tab compares the hash with the one it read the file by and so learns, within
// a second, that another program wrote, replaced, moved or deleted its file
// (state/sessions/source/disk.svelte.ts).
//
// The socket (server/root/socket.ts) hands this module the `source:` names of a subscribe message
// and of an unsubscribe message, as it hands the terminals the `pty:` names, and the names of a
// closed socket go with `remove`. The channels stay among the hub's plain channels: `hub.publish`
// delivers to each sink and a sink that subscribes later is handed the newest message. This module
// decides which names are polled.
//
// A name is `source:`, a root key, a slash and a path. It is resolved with `resolveRootPath` over
// the browser roots (the source route's list), and a name that does not resolve inside a root, or
// has an empty root key or an empty path, is never polled and never published; the socket leaves
// it out of the hub subscription. A name that resolves is polled with `pollFile`, a stat each tick
// of the path the name spells, on the server's clock: a darwin fs.watch can miss a write that
// lands while it registers (core/file-poll.ts). The name is resolved again at every tick, against
// the roots as the configuration and the saved workspaces last left them, because a link may now
// point out of every root or a root key may be gone from sources.yml or name another folder; such
// a name has no path to stat, publishes null at the tick it stops resolving and reads nothing,
// and is followed again when it resolves. Otherwise the file is read and hashed. A file over
// the read limit is not read, and its message is `stat:` and the hash of its inode, size, mtime
// and ctime. A message that repeats the one before it is not published again.
//
// A poll lives while some socket holds its channel. When the last sink drops a name, by an
// unsubscribe message or by closing, the poll closes and the hub forgets the channel's message, so
// the next page to hold the name is handed a hash read after it subscribed. The number of polls is
// bounded: at most PER_SOCKET names per socket and PER_SERVER polls over the server; a name past
// either bound is refused to the socket and not polled.

import { readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { TEXT_LIMIT } from '../../../data/file-ops.ts';
import { SOURCE_PREFIX, parseSourceChannel } from '../../../data/helpers/files/address.ts';
import type { OpenFileMessage } from '../../../data/model/index.ts';
import type { Hub, Sink } from '../../core/channels.ts';
import { hashOf } from '../../core/file-bytes.ts';
import { POLL, pollFile, systemClock, type Clock, type FilePoll } from '../../core/file-poll.ts';
import { realPath } from '../../core/paths.ts';
import { resolveRootPath, type Root } from '../files.ts';

/** The most names one socket may hold. */
const PER_SOCKET = 200;

/** The most files polled over the whole server. */
const PER_SERVER = 1000;

/** The files open in source tabs: one poll per name, published on the name's channel. */
export type OpenFiles = {
    /**
     * Take the `source:` names among a subscribe message's channels. Answers the names that are not
     * held for this sink, which the socket leaves out of the hub subscription.
     */
    subscribed(sink: Sink, channels: string[]): string[];
    /** Drop the `source:` names among these channels from the sink. */
    unsubscribed(sink: Sink, channels: string[]): void;
    /** Drop every name the sink holds, because its socket closed. */
    remove(sink: Sink): void;
    /** Close every poll and forget every sink. */
    close(): void;
};

export type OpenFilesOptions = {
    hub: Hub;
    /** The roots the names are resolved against; read again after the configuration moved. */
    roots: () => Root[];
    /**
     * The saved workspaces file, whose change adds or drops roots. A function names the file at
     * each tick, so a poll follows the file when the hub it lies in changes.
     */
    workspacesFile?: string | (() => string);
    clock?: Clock;
    every?: number;
    /** Read the bytes of a file to hash them; the file system's read unless a test gives one. */
    read?: (path: string) => Buffer;
};

/** One polled name: its poll, the sinks that hold it and the newest hash it published. */
type Entry = { poll: FilePoll; sinks: Set<Sink>; last: string | null | undefined };

/**
 * Where a name is polled: the path inside its root that the name spells, whether a file is there
 * or not, and null for a name outside every root. The spelled path is stat'ed, so a file replaced
 * by a link, a link set to another file and a file made where none was each move the signature.
 */
function polledPath(roots: Root[], name: { root: string; path: string }): string | null {
    const found = resolveRootPath(roots, name.root, name.path);
    if ('error' in found && found.error === 'outside') return null;
    const root = roots.find((one) => one.key === name.root);
    const dir = root === undefined ? null : realPath(root.dir);
    return dir === null ? null : resolve(dir, name.path);
}

/** What the channel says of the file now: its hash, a stat hash, or null when nothing is there. */
function hashNow(
    roots: Root[],
    name: { root: string; path: string },
    read: (path: string) => Buffer
): string | null {
    const found = resolveRootPath(roots, name.root, name.path);
    if ('error' in found) return null;
    try {
        const info = statSync(found.path);
        if (!info.isFile()) return null;
        if (info.size > TEXT_LIMIT) {
            const signature = `${info.ino}:${info.size}:${info.mtimeMs}:${info.ctimeMs}`;
            return `stat:${hashOf(Buffer.from(signature))}`;
        }
        return hashOf(read(found.path));
    } catch {
        return null;
    }
}

export function createOpenFiles(options: OpenFilesOptions): OpenFiles {
    const { hub } = options;
    const clock = options.clock ?? systemClock;
    const every = options.every ?? POLL;
    const read = options.read ?? ((path: string): Buffer => readFileSync(path));
    const polls = new Map<string, Entry>();
    const held = new Map<Sink, Set<string>>();

    // The roots are read when a name first needs them and again after the configuration or the
    // saved workspaces moved, since reading them parses the configuration and every tick of every
    // poll resolves its name against them.
    let served: Root[] | null = null;
    const roots = (): Root[] => (served ??= options.roots());
    const moved: Sink = {
        send: () => {
            served = null;
            return Promise.resolve();
        },
        close: () => undefined
    };
    hub.subscribe(moved, ['config'], false);
    const workspaces: FilePoll | null =
        options.workspacesFile === undefined
            ? null
            : pollFile(options.workspacesFile, { clock, every }, () => {
                  served = null;
                  workspaces?.reading();
              });

    /** Publish what the file says now, unless it is what the channel said last. */
    function tell(channel: string, entry: Entry): void {
        const name = parseSourceChannel(channel);
        entry.poll.reading();
        const hash = name === null ? null : hashNow(roots(), name, read);
        if (hash === entry.last) return;
        entry.last = hash;
        const message: OpenFileMessage = { hash };
        hub.publish(channel, message);
    }

    function start(channel: string, name: { root: string; path: string }, sink: Sink): void {
        const entry: Entry = {
            poll: pollFile(
                () => polledPath(roots(), name),
                { clock, every },
                () => tell(channel, entry)
            ),
            sinks: new Set([sink]),
            last: undefined
        };
        polls.set(channel, entry);
    }

    function leave(sink: Sink, channel: string): void {
        const entry = polls.get(channel);
        if (entry === undefined) return;
        entry.sinks.delete(sink);
        if (entry.sinks.size > 0) return;
        entry.poll.close();
        polls.delete(channel);
        hub.forget(channel);
    }

    return {
        subscribed(sink, channels) {
            const refused: string[] = [];
            const names = channels.filter((channel) => channel.startsWith(SOURCE_PREFIX));
            if (names.length === 0) return refused;
            let places: Root[] | null = null;
            const mine = held.get(sink) ?? new Set<string>();
            for (const channel of names) {
                if (mine.has(channel)) continue;
                const polled = polls.get(channel);
                if (mine.size >= PER_SOCKET || (polled === undefined && polls.size >= PER_SERVER)) {
                    refused.push(channel);
                    continue;
                }
                if (polled !== undefined) {
                    polled.sinks.add(sink);
                    mine.add(channel);
                    continue;
                }
                const name = parseSourceChannel(channel);
                places ??= roots();
                if (name === null || polledPath(places, name) === null) {
                    refused.push(channel);
                    continue;
                }
                start(channel, name, sink);
                mine.add(channel);
            }
            if (mine.size > 0) held.set(sink, mine);
            return refused;
        },
        unsubscribed(sink, channels) {
            const mine = held.get(sink);
            if (mine === undefined) return;
            for (const channel of channels) {
                if (!mine.delete(channel)) continue;
                leave(sink, channel);
            }
            if (mine.size === 0) held.delete(sink);
        },
        remove(sink) {
            for (const channel of held.get(sink) ?? []) leave(sink, channel);
            held.delete(sink);
        },
        close() {
            for (const entry of polls.values()) entry.poll.close();
            polls.clear();
            held.clear();
            workspaces?.close();
            hub.remove(moved);
        }
    };
}
