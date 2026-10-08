// Layer 2, client state. What a source tab knows of its file on disk: one `source:<root>/<path>`
// channel per file that some open tab holds, the hash it carries each time the file changes
// (server/files/fs/open-files.ts), and what each tab does with a hash that is not the one it read.
//
// A tab that read the file or wrote it holds `base`, the hash of those bytes. A message with that
// hash moves nothing. A message with another hash reads a tab with no unsaved text again, and marks
// a tab with unsaved text `changed` with its text kept. A null hash marks every tab over the file
// `gone`. Several tabs over one file share one channel; the channel is subscribed when the first of
// them has loaded its draft and dropped, with a message to the server, when the last of them closes
// or is pointed at another file. A tab whose own save is in flight holds the messages it hears
// until the answer lands and compares the newest with the hash the answer carries, so the tab's own
// write is never taken for another program's.
//
// A tab whose file is renamed or moved is followed at its new place: the draft names the new
// file, the old channel is dropped and the new one followed, with the text and the unsaved mark
// kept.
//
// A cut read of a file over the read limit has no hash of its own to compare, since the server's
// message for such a file is the hash of its stat signature. The first message a tab holding one
// hears after its load is taken as the state the read was made at and reads nothing; a later
// message that differs from the last one it heard reads the file again, once per message and not
// once per repeat of it.

import { untrack } from 'svelte';
import { z } from 'zod';
import { sourceChannel } from '../../../data/helpers/files/address.ts';
import { readAs } from '../../../data/shapes/shapes.ts';
import type { Message } from '../../../data/model/index.ts';
import type { SocketStore } from '../../shared/stores/shapes.ts';
import { diskFileOf, type SourceDraft } from './draft.ts';

/** What the disk module asks of the source store that made it. */
export type DiskHost = {
    draft: (id: string) => SourceDraft;
    update: (id: string, changes: Partial<SourceDraft>) => void;
    /** Read the file again for a tab with no unsaved text. */
    reread: (id: string) => Promise<void>;
    /** The `file` of a tab's draft, or null when the tab has no record. */
    fileOf: (id: string) => string | null;
};

/** The channel's payload: the hash of the file, or null when nothing readable is there. */
const payloadShape = z.object({ hash: z.string().nullable() });

/** One subscribed channel: the tabs that hold its file and the newest message it carried. */
type Channel = { ids: Set<string>; last: string | null | undefined; stop: () => void };

export type DiskStore = {
    /**
     * Follow the file of a tab whose draft has loaded. Calling it again for the same file only
     * compares the channel's newest message with what the tab read.
     */
    track: (id: string, root: string, path: string) => void;
    /** Hold the channel's messages for a tab until `end`. */
    begin: (id: string) => void;
    /** Compare the newest message held since `begin` with the tab's base. */
    end: (id: string) => void;
    /** Whether an open tab over this file holds it as gone from the disk. */
    gone: (root: string, path: string) => boolean;
    /**
     * The newest hash the file's channel carried while a tab held it: undefined before the first
     * message, null once the file is gone. It moves whenever the file does, which is what a view
     * of the file as the disk holds it reads again by.
     */
    hash: (root: string, path: string) => string | null | undefined;
};

export function createDisk(
    socket: Pick<SocketStore, 'subscribe' | 'unsubscribe' | 'listen'>,
    host: DiskHost
): DiskStore {
    const channels = new Map<string, Channel>();
    /** The newest hash of each channel held, read through `hash`. */
    const latest: Record<string, string | null> = $state({});
    /** Counts the tabs followed, which is what the effect below re-reads the tabs' files for. */
    const followed = $state({ count: 0 });
    /** The channel and file of each tracked tab. */
    const places = new Map<string, { name: string; file: string }>();
    /** The tabs whose save is out, with the newest message heard meanwhile. */
    const saving = new Map<string, { held: string | null | undefined }>();
    /** The newest message each cut read heard, which a message that differs reads again for. */
    const readFor = new Map<string, string>();

    /** What a message for a channel does to one tab. */
    function hear(id: string, hash: string | null): void {
        const held = saving.get(id);
        if (held !== undefined) {
            held.held = hash;
            return;
        }
        const draft = host.draft(id);
        if (!draft.loaded) return;
        if (hash === null) {
            if (draft.disk !== 'gone' || draft.conflict)
                host.update(id, { disk: 'gone', conflict: false });
            return;
        }
        if (hash === draft.base) {
            if (draft.disk !== 'same' || draft.conflict)
                host.update(id, { disk: 'same', conflict: false });
            return;
        }
        if (draft.truncated) {
            const known = readFor.get(id);
            // The first message after the load is the state the read was taken at.
            if (known === undefined || known === hash) {
                readFor.set(id, hash);
                return;
            }
            readFor.set(id, hash);
        }
        if (draft.text === draft.saved) void host.reread(id);
        else if (draft.disk !== 'changed') host.update(id, { disk: 'changed' });
    }

    function message(name: string, heard: Message): void {
        const channel = channels.get(name);
        const payload = readAs(payloadShape, heard.payload);
        if (channel === undefined || payload === null) return;
        channel.last = payload.hash;
        latest[name] = payload.hash;
        for (const id of [...channel.ids]) hear(id, payload.hash);
    }

    /** Take a tab off its channel, and drop the channel when no tab holds it. */
    function leave(id: string): void {
        const place = places.get(id);
        if (place === undefined) return;
        places.delete(id);
        saving.delete(id);
        readFor.delete(id);
        const channel = channels.get(place.name);
        if (channel === undefined) return;
        channel.ids.delete(id);
        if (channel.ids.size > 0) return;
        channel.stop();
        channels.delete(place.name);
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- the record is keyed by channel name
        delete latest[place.name];
        socket.unsubscribe([place.name]);
    }

    function track(id: string, root: string, path: string): void {
        const name = sourceChannel(root, path);
        const file = `${root}/${path}`;
        if (places.get(id)?.name !== name) leave(id);
        places.set(id, { name, file });
        followed.count += 1;
        let channel = channels.get(name);
        if (channel === undefined) {
            channel = { ids: new Set(), last: undefined, stop: () => undefined };
            channels.set(name, channel);
            channel.stop = socket.listen(name, (heard) => message(name, heard));
            socket.subscribe([name]);
        }
        channel.ids.add(id);
        if (channel.last !== undefined) hear(id, channel.last);
    }

    function begin(id: string): void {
        saving.set(id, { held: undefined });
    }

    function end(id: string): void {
        const held = saving.get(id);
        saving.delete(id);
        if (held?.held !== undefined) hear(id, held.held);
    }

    function gone(root: string, path: string): boolean {
        const file = `${root}/${path}`;
        // The tabs followed change as tabs load and close, which a reader of this answer tracks.
        if (followed.count < 0) return false;
        for (const [id, place] of places) {
            if (place.file === file && host.draft(id).disk === 'gone') return true;
        }
        return false;
    }

    // A tab that is closed, or pointed at another file, leaves its channel. A loaded tab whose
    // draft now names another file on disk (the file was renamed or moved under it) follows the
    // file at its new place; a tab pointed at a file to be read follows it when the read lands.
    $effect.root(() => {
        $effect(() => {
            if (followed.count < 0) return;
            for (const [id, place] of [...places]) {
                const now = host.fileOf(id);
                if (now === place.file) continue;
                untrack(() => {
                    leave(id);
                    const moved = now === null ? null : diskFileOf(now);
                    if (moved !== null && host.draft(id).loaded) track(id, moved.root, moved.path);
                });
            }
        });
    });

    return { track, begin, end, gone, hash: (root, path) => latest[sourceChannel(root, path)] };
}
