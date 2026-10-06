// Layer 2, client state. Where an arrangement is written and read back: the keys a browser holds it
// under, what the store needs of a Storage, and the one place a read or a write is attempted and a
// refusal swallowed.
//
// The storage is attached at the load rather than at the build, so nothing is written before the
// saved arrangement has been read and a store nobody has loaded touches no localStorage. A browser
// whose storage is full or refused still runs; it forgets the arrangement at the next load and
// nothing else, since what the shell renders is the arrangement in memory.
//
// Every browser tab of one server writes the same key, so each one also listens for the browser's
// `storage` event, which is fired in the other tabs when one of them writes: the store is told when
// the arrangement was saved elsewhere and reads it (layout/saved/load.ts, `takeSaved`).
//
// In the desktop app the windows of one server share one page storage and also share a turn: a
// save is first put to the host together with the envelope the page last read or wrote, and the
// host admits it only when that is the envelope it admitted last, otherwise it answers with the
// one it holds. A refused save writes nothing and leaves that envelope to be taken (`refusal`),
// after which the operation that asked is run again on it. A save the host did not answer is
// refused with no envelope: it writes nothing and is not run again.

import type { SaveAnswer } from '../../../shared/stores/desktop.ts';
import { followKey } from '../../../shared/stores/storage-events.ts';
import { tabsOf } from '../instance.ts';
import { hostsOf, type Pages } from '../model.ts';
import { serialiseFloatless, serialiseLayout } from './saved.ts';

/** The key the arrangement is saved under. The envelope inside it carries the version. */
export const LAYOUT_KEY = 'oculus.layout.v1';

/**
 * The key the workbench a named arrangement replaced was kept under, by the rail control pages
 * retired. Nothing writes it any more: loadLayout reads it once, so the arrangement that control
 * replaced becomes a page of its own, and then writes it empty. It holds a whole serialised
 * workbench, or the empty string: the store never removes a key, so a Storage it is handed needs
 * only get and set.
 */
export const PREVIOUS_KEY = 'oculus.layout.previous';

/**
 * The key a value under LAYOUT_KEY that parseLayout cannot read is copied under when the default
 * arrangement is about to be written over it, so what the reader had saved can be recovered by
 * hand. A later unreadable value replaces the copy.
 */
export const UNREAD_KEY = 'oculus.layout.unread';

/**
 * The key the record of layout writes is kept under: a JSON list of the last `WRITES_KEPT` entries,
 * newest last, each a `LayoutWrite`. One browser tab's writes and another's are interleaved in it,
 * told apart by `tab`.
 */
const WRITES_KEY = 'oculus.layout.writes.v1';

/** How many entries the record of layout writes keeps. */
const WRITES_KEPT = 500;

/**
 * The key a browser tab's id is kept under in `sessionStorage`, which lives and dies with the
 * browser tab and survives its reloads.
 */
const TAB_KEY = 'oculus.layout.tab';

/**
 * One write of the saved layout: `at` the time in milliseconds, `tab` the id of the browser tab
 * that wrote it, `call` the name of the layout store operation that asked for it, `page` the id of
 * the page on screen, and `tabs` every tab then in the arrangement as `<tab id>:<view id>`, so a
 * tab that disappears between two entries, and the browser tab that wrote the entry it
 * disappeared in, can be read off the list. A write equal to the newest entry in all but its time
 * (a sash dragged, a scroll) is counted on that entry: `n` the writes it stands for, `last` the
 * time of the latest, so a drag does not push the older entries out of the list.
 */
type LayoutWrite = {
    at: number;
    tab: string;
    call: string;
    page: string;
    tabs: string[];
    n?: number;
    last?: number;
};

/** Whether two entries are one write repeated: the same browser tab, call, page and tabs. */
function repeated(one: LayoutWrite, other: LayoutWrite): boolean {
    return (
        one.tab === other.tab &&
        one.call === other.call &&
        one.page === other.page &&
        one.tabs.join(' ') === other.tabs.join(' ')
    );
}

/** The browser tab and call of an entry, which its times are counted under. */
function sourceOf(entry: LayoutWrite): string {
    return `${entry.tab}|${entry.call}`;
}

/** What the store needs of a Storage, so a test can hand it a plain object. */
export type Storable = Pick<Storage, 'getItem' | 'setItem'>;

/** The host's turn for a save: the envelope to write and the one it was made from. */
export type SaveTurn = (next: string, from: string | null) => SaveAnswer;

/** The arrangement's persistence: attached once by a load, then read and written by key. */
export type LayoutStorage = {
    /** Name where the arrangement is read from and saved to. Nothing is saved before this. */
    attach: (storage: Storable) => void;
    /** One key of the attached storage, or null when there is none or it refused to be read. */
    read: (key: string) => string | null;
    /** Write one string under a key, or do nothing when there is nowhere to write yet. */
    remember: (key: string, value: string) => void;
    /**
     * Write a set of pages under LAYOUT_KEY, which is what every change to them ends in. A layout
     * read from an envelope written before floats is written in that envelope's form while it holds
     * no float, so the shipped floats are still to be taken in at the next load. `call` names the
     * layout store operation asking, and the write is then added to the record under WRITES_KEY.
     */
    write: (next: Pages, floatless?: boolean, call?: string) => void;
    /**
     * The envelope the host held when it refused the last save, once: the save wrote nothing and
     * the caller takes this envelope and asks again. Null when no save was refused since the last
     * call.
     */
    refusal: () => string | null;
    /**
     * Call `changed` whenever another browser tab saved the arrangement, as `source` (the window)
     * reports it; answers how to stop. The browser fires the event in every tab but the writer's,
     * so a save made here never calls it, and a write to any other key is not heard. The same
     * source is also heard for the record of layout writes, which an entry of this tab is put back
     * in when another tab's write left it out.
     */
    follow: (source: EventTarget, changed: () => void) => () => void;
};

export function createStorage(turn?: SaveTurn): LayoutStorage {
    /** Where the arrangement is read and saved, once a load has named it. */
    let backing: Storable | null = null;

    /** The envelope this page last read or wrote under LAYOUT_KEY, which a save is made from. */
    let known: string | null = null;

    /** The envelope the host answered the last refused save with. */
    let refused: string | null = null;

    /** The entries this tab added to the record, the newest `WRITES_KEPT` of them. */
    const own: LayoutWrite[] = [];

    function attach(storage: Storable): void {
        backing = storage;
    }

    function read(key: string): string | null {
        if (backing === null) return null;
        try {
            const raw = backing.getItem(key);
            if (key === LAYOUT_KEY) known = raw;
            return raw;
        } catch {
            // A browser with storage refused still runs; it just forgets the arrangement.
            return null;
        }
    }

    function remember(key: string, value: string): void {
        if (backing === null) return;
        try {
            backing.setItem(key, value);
        } catch {
            // A full or refused storage forgets the arrangement at the next load and nothing else.
        }
    }

    function write(next: Pages, floatless = false, call = ''): void {
        if (backing === null) return;
        try {
            const held = floatless && next.floats.length === 0;
            const text = held ? serialiseFloatless(next) : serialiseLayout(next);
            if (turn !== undefined) {
                const answer = turn(text, known);
                if (!answer.admitted) {
                    // A save the host did not answer writes nothing and has no envelope to take.
                    if (answer.held !== null) {
                        refused = answer.held;
                        known = answer.held;
                    }
                    return;
                }
            }
            known = text;
            backing.setItem(LAYOUT_KEY, text);
        } catch {
            // A full or refused storage loses the arrangement at the next load and nothing else:
            // the arrangement in memory is what the shell renders and it is already current.
        }
        record(next, call);
    }

    /** The id of this browser tab, made on first use and kept for the tab's life. */
    function tabId(): string {
        try {
            const held = sessionStorage.getItem(TAB_KEY);
            if (held !== null && held !== '') return held;
            const made = Math.random().toString(36).slice(2, 8);
            sessionStorage.setItem(TAB_KEY, made);
            return made;
        } catch {
            return 'no-session-storage';
        }
    }

    /**
     * Add one entry to the record of layout writes, dropping the oldest past WRITES_KEPT, or count
     * the write on the newest entry when it repeats it. It reads and writes nothing but WRITES_KEY
     * and TAB_KEY, and a refusal of either is swallowed: the layout write it follows has already
     * happened and is never held up by the record.
     *
     * Two windows of the app share the key, and each adds its entry by reading the list and writing
     * it back, so a window that reads before the other's write has reached it writes the list
     * without that entry. The window that lost the entry hears the other's write as a `storage`
     * event (`putBack`) and adds the entry back in the place its time gives it.
     */
    function record(next: Pages, call: string): void {
        if (backing === null) return;
        try {
            const entry: LayoutWrite = {
                at: Date.now(),
                tab: tabId(),
                call,
                page: next.current,
                tabs: hostsOf(next).flatMap((host) =>
                    tabsOf(host.workbench.root).map((tab) => `${tab.id}:${tab.view}`)
                )
            };
            append(entry);
            if (turn !== undefined) {
                own.push(entry);
                if (own.length > WRITES_KEPT) own.shift();
            }
        } catch {
            // A full or refused storage, or a record that does not parse, loses the record only.
        }
    }

    /** The list under WRITES_KEY, empty when there is none or it is not a list. */
    function listed(): LayoutWrite[] {
        const held: unknown = JSON.parse(backing?.getItem(WRITES_KEY) ?? '[]');
        return Array.isArray(held) ? (held as LayoutWrite[]) : [];
    }

    /** Write the list with this entry in it, counted on the newest entry when it repeats it. */
    function append(entry: LayoutWrite): void {
        const kept = listed();
        const newest = kept.at(-1);
        const list =
            newest !== undefined && repeated(newest, entry)
                ? [...kept.slice(0, -1), { ...newest, n: (newest.n ?? 1) + 1, last: entry.at }]
                : [...kept, entry];
        const ordered = list.sort((one, other) => one.at - other.at);
        backing?.setItem(WRITES_KEY, JSON.stringify(ordered.slice(-WRITES_KEPT)));
    }

    /**
     * Add this tab's entries again that the list does not hold, alone or counted on another entry,
     * when another tab's write has left them out. An entry older than the list's oldest is one the
     * cap dropped, and is left out.
     */
    function putBack(): void {
        try {
            const kept = listed();
            const oldest = kept[0]?.at ?? 0;
            // An entry counted on another stands for every write from its time to its `last`.
            const spans = new Map<string, [number, number][]>();
            for (const one of kept) {
                const key = sourceOf(one);
                const held = spans.get(key) ?? [];
                held.push([one.at, one.last ?? one.at]);
                spans.set(key, held);
            }
            for (const entry of own) {
                const held = spans
                    .get(sourceOf(entry))
                    ?.some(([from, to]) => from <= entry.at && entry.at <= to);
                if (held !== true && (kept.length < WRITES_KEPT || entry.at >= oldest)) {
                    append(entry);
                }
            }
        } catch {
            // The record is lost with the storage that held it.
        }
    }

    function refusal(): string | null {
        const held = refused;
        refused = null;
        return held;
    }

    function follow(source: EventTarget, changed: () => void): () => void {
        const stopLayout = followKey(source, LAYOUT_KEY, changed);
        const stopRecord = followKey(source, WRITES_KEY, putBack);
        return () => {
            stopLayout();
            stopRecord();
        };
    }

    return { attach, read, remember, write, refusal, follow };
}
