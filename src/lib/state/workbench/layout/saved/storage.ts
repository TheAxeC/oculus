// Layer 2, client state. Where an arrangement is written and read back: the keys a browser holds it
// under, what the store needs of a Storage, and the one place a read or a write is attempted and a
// refusal swallowed.
//
// An arrangement belongs to a workspace: the keys carry the identity of the open workspace, which
// is the real path of its file or `unsaved` (layoutKey). No key is read or written until the
// workspace answer has named the identity (`select`), so a page never reads the arrangement of a
// workspace it has not yet learned it is in.
//
// The storage is attached at the load rather than at the build, so nothing is written before the
// saved arrangement has been read and a store nobody has loaded touches no localStorage. A browser
// whose storage is full or refused still runs; it forgets the arrangement at the next load and
// nothing else, since what the shell renders is the arrangement in memory.
//
// Every browser tab of one server writes the same keys, so each one also listens for the browser's
// `storage` event, which is fired in the other tabs when one of them writes: the store is told when
// the arrangement of the workspace it has open was saved elsewhere and reads it (layout/saved/
// load.ts, `takeSaved`).
//
// In the desktop app the windows of one server share one page storage and also share a turn: a save
// is first put to the host together with the key, the envelope to write and the envelope the page
// last read or wrote under that key, and the host admits it only when that is the envelope it
// admitted last for the key, otherwise it answers with the one it holds. A refused save writes
// nothing and leaves that envelope to be taken (`refusal`), after which the operation that asked is
// run again on it. A save the host did not answer is refused with no envelope: it writes nothing
// and is not run again.

import type { SaveAnswer } from '../../../shared/stores/desktop.ts';
import { tabsOf } from '../instance.ts';
import { hostsOf, type Pages } from '../model.ts';
import { serialiseLayout } from './saved.ts';

/** The identity of the workspace that has no file. */
export const UNSAVED = 'unsaved';

/** The start of the key an arrangement is saved under; the identity follows. */
export const LAYOUT_PREFIX = 'oculus.layout.workspace:';

/** The start of the key a copy of an unreadable arrangement is kept under; the identity follows. */
const UNREAD_PREFIX = 'oculus.layout.unread:';

/**
 * The start of the key the record of layout writes is kept under: a JSON list of the last
 * `WRITES_KEPT` entries, newest last, each a `LayoutWrite`. One browser tab's writes and another's
 * are interleaved in it, told apart by `tab`.
 */
const WRITES_PREFIX = 'oculus.layout.writes.v1:';

/**
 * The key the arrangement of one workspace is saved under. The envelope inside it carries the
 * version.
 */
function layoutKey(identity: string): string {
    return `${LAYOUT_PREFIX}${identity}`;
}

/**
 * The key a value under layoutKey that parseLayout cannot read is copied under when the default
 * arrangement is about to be written over it, so what the reader had saved can be recovered by
 * hand. A later unreadable value replaces the copy.
 */
function unreadKey(identity: string): string {
    return `${UNREAD_PREFIX}${identity}`;
}

/** The key of the record of layout writes of one workspace. */
function writesKey(identity: string): string {
    return `${WRITES_PREFIX}${identity}`;
}

/** How many entries the record of layout writes keeps. */
const WRITES_KEPT = 500;

/**
 * The key a browser tab's id is kept under in `sessionStorage`, which lives and dies with the
 * browser tab and survives its reloads.
 */
const TAB_KEY = 'oculus.layout.tab';

/**
 * The id of this browser tab or app window, made on first use and kept in its session storage for
 * its life, so a reload keeps it, or null when the session storage cannot be used. The record of
 * layout writes names a write by it, and a float's address names the main page that opened the
 * float's window by it (`owner`).
 */
export function browserTabId(): string | null {
    try {
        const held = sessionStorage.getItem(TAB_KEY);
        if (held !== null && held !== '') return held;
        const made = Math.random().toString(36).slice(2, 8);
        sessionStorage.setItem(TAB_KEY, made);
        return made;
    } catch {
        return null;
    }
}

/** The name of the lock a main page holds for as long as it lives. */
function pageLock(id: string): string {
    return `oculus-page:${id}`;
}

/**
 * Whether the main page with this id is open: it holds its lock, in a browser tab and in an app
 * window alike, since every window of one session shares the locks of its origin. A page that
 * cannot ask is taken to be open, so a jump is sent and not refused for a missing API.
 */
export async function pageOpen(id: string): Promise<boolean> {
    if (typeof navigator === 'undefined' || !('locks' in navigator)) return true;
    const { held } = await navigator.locks.query();
    return held?.some((one) => one.name === pageLock(id)) ?? true;
}

/**
 * Hold a Web Lock named for the id of this main page for as long as the page lives, and answer the
 * call that lets it go. A browser copies the session storage of a tab that is duplicated, so the
 * copy starts with the id of the original; the copy finds the lock taken, forgets the id and
 * reloads under a new one, which keeps every main page's id its own (a float's `owner` names one
 * page only). The lock is also what a float asks to know that its owner page is still open.
 */
export function holdBrowserTabId(id: string): () => void {
    if (typeof navigator === 'undefined' || !('locks' in navigator)) return () => undefined;
    let release: () => void = () => undefined;
    const held = new Promise<void>((resolve) => {
        release = resolve;
    });
    void navigator.locks.request(pageLock(id), { ifAvailable: true }, (lock) => {
        if (lock !== null) return held;
        try {
            sessionStorage.removeItem(TAB_KEY);
        } catch {
            // A session storage that cannot be used holds no id to forget.
        }
        window.location.reload();
    });
    return release;
}

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

/** The host's turn for a save: the key, the envelope to write and the one it was made from. */
export type SaveTurn = (key: string, next: string, from: string | null) => SaveAnswer;

/** The arrangement's persistence: attached once by a load, then read and written by workspace. */
export type LayoutStorage = {
    /** Name where the arrangement is read from and saved to. Nothing is saved before this. */
    attach: (storage: Storable) => void;
    /**
     * Name the workspace the arrangement belongs to. Until it is called nothing is read and nothing
     * is written, and a read answers null.
     */
    select: (identity: string) => void;
    /** The identity `select` named, or null before it was called. */
    identity: () => string | null;
    /** The arrangement saved for the selected workspace, or null when none or it cannot be read. */
    readSaved: () => string | null;
    /** Keep a value `readSaved` answered and parseLayout could not read, for the selected one. */
    rememberUnread: (raw: string) => void;
    /**
     * Write a set of pages under the selected workspace's key, which is what every change to them
     * ends in. `call` names the layout store operation asking, and the write is then added to the
     * record of the selected workspace.
     */
    write: (next: Pages, call?: string) => void;
    /**
     * Write a set of pages under another workspace's key: the pages a workspace is left with, or
     * the pages Save As carries to the new file. The record of writes is added to as for `write`.
     */
    writeFor: (identity: string, next: Pages, call?: string) => void;
    /**
     * The envelope the host held when it refused the last save of the selected workspace, once: the
     * save wrote nothing and the caller takes this envelope and asks again. Null when no save was
     * refused since the last call.
     */
    refusal: () => string | null;
    /**
     * Call `changed` whenever another browser tab saved the arrangement of the selected workspace,
     * as `source` (the window) reports it; answers how to stop. The browser fires the event in
     * every tab but the writer's, so a save made here never calls it, and a write to any other key,
     * the arrangement of another workspace among them, is not heard. The same source is also heard
     * for the record of layout writes, which an entry of this tab is put back in when another tab's
     * write left it out.
     */
    follow: (source: EventTarget, changed: () => void) => () => void;
};

export function createStorage(turn?: SaveTurn): LayoutStorage {
    /** Where the arrangement is read and saved, once a load has named it. */
    let backing: Storable | null = null;

    /** The workspace the arrangement belongs to, once the workspace answer has named it. */
    let selected: string | null = null;

    /** The envelope this page last read or wrote under each key, which a save is made from. */
    const known = new Map<string, string | null>();

    /** The envelope the host answered the last refused save of the selected workspace with. */
    let refused: string | null = null;

    /** The entries this tab added to the records, the newest `WRITES_KEPT` of them. */
    const own: { key: string; entry: LayoutWrite }[] = [];

    function attach(storage: Storable): void {
        backing = storage;
    }

    function select(identity: string): void {
        selected = identity;
        refused = null;
    }

    /** One key of the attached storage, or null when there is none or it refused to be read. */
    function get(key: string): string | null {
        if (backing === null) return null;
        try {
            return backing.getItem(key);
        } catch {
            // A browser with storage refused still runs; it just forgets the arrangement.
            return null;
        }
    }

    function readSaved(): string | null {
        if (selected === null) return null;
        const key = layoutKey(selected);
        const raw = get(key);
        known.set(key, raw);
        return raw;
    }

    function rememberUnread(raw: string): void {
        if (backing === null || selected === null) return;
        try {
            backing.setItem(unreadKey(selected), raw);
        } catch {
            // A full or refused storage forgets the arrangement at the next load and nothing else.
        }
    }

    /**
     * The envelope this page last read or wrote under a key, read from the storage on first use.
     */
    function knownFor(key: string): string | null {
        if (!known.has(key)) known.set(key, get(key));
        return known.get(key) ?? null;
    }

    function writeFor(identity: string, next: Pages, call = ''): void {
        if (backing === null) return;
        const key = layoutKey(identity);
        try {
            const text = serialiseLayout(next);
            if (turn !== undefined) {
                const answer = turn(key, text, knownFor(key));
                if (!answer.admitted) {
                    // A save the host did not answer writes nothing and has no envelope to take.
                    if (answer.held !== null) {
                        if (identity === selected) refused = answer.held;
                        known.set(key, answer.held);
                    }
                    return;
                }
            }
            known.set(key, text);
            backing.setItem(key, text);
        } catch {
            // A full or refused storage loses the arrangement at the next load and nothing else:
            // the arrangement in memory is what the shell renders and it is already current.
        }
        record(identity, next, call);
    }

    function write(next: Pages, call = ''): void {
        if (selected !== null) writeFor(selected, next, call);
    }

    /**
     * Add one entry to the record of layout writes of a workspace, dropping the oldest past
     * WRITES_KEPT, or count the write on the newest entry when it repeats it. It reads and writes
     * nothing but the record's key and TAB_KEY, and a refusal of either is swallowed: the layout
     * write it follows has already happened and is never held up by the record.
     *
     * Two windows of the app share the key, and each adds its entry by reading the list and writing
     * it back, so a window that reads before the other's write has reached it writes the list
     * without that entry. The window that lost the entry hears the other's write as a `storage`
     * event (`putBack`) and adds the entry back in the place its time gives it.
     */
    function record(identity: string, next: Pages, call: string): void {
        if (backing === null) return;
        try {
            const entry: LayoutWrite = {
                at: Date.now(),
                tab: browserTabId() ?? 'no-session-storage',
                call,
                page: next.current,
                tabs: hostsOf(next).flatMap((host) =>
                    tabsOf(host.workbench.root).map((tab) => `${tab.id}:${tab.view}`)
                )
            };
            const key = writesKey(identity);
            append(key, entry);
            if (turn !== undefined) {
                own.push({ key, entry });
                if (own.length > WRITES_KEPT) own.shift();
            }
        } catch {
            // A full or refused storage, or a record that does not parse, loses the record only.
        }
    }

    /** The list under a record's key, empty when there is none or it is not a list. */
    function listed(key: string): LayoutWrite[] {
        const held: unknown = JSON.parse(backing?.getItem(key) ?? '[]');
        return Array.isArray(held) ? (held as LayoutWrite[]) : [];
    }

    /** Write the list with this entry in it, counted on the newest entry when it repeats it. */
    function append(key: string, entry: LayoutWrite): void {
        const kept = listed(key);
        const newest = kept.at(-1);
        const list =
            newest !== undefined && repeated(newest, entry)
                ? [...kept.slice(0, -1), { ...newest, n: (newest.n ?? 1) + 1, last: entry.at }]
                : [...kept, entry];
        const ordered = list.sort((one, other) => one.at - other.at);
        backing?.setItem(key, JSON.stringify(ordered.slice(-WRITES_KEPT)));
    }

    /**
     * Add this tab's entries again that a record does not hold, alone or counted on another entry,
     * when another tab's write has left them out. An entry older than the list's oldest is one the
     * cap dropped, and is left out.
     */
    function putBack(key: string): void {
        try {
            const kept = listed(key);
            const oldest = kept[0]?.at ?? 0;
            // An entry counted on another stands for every write from its time to its `last`.
            const spans = new Map<string, [number, number][]>();
            for (const one of kept) {
                const source = sourceOf(one);
                const held = spans.get(source) ?? [];
                held.push([one.at, one.last ?? one.at]);
                spans.set(source, held);
            }
            for (const { key: where, entry } of own) {
                if (where !== key) continue;
                const held = spans
                    .get(sourceOf(entry))
                    ?.some(([from, to]) => from <= entry.at && entry.at <= to);
                if (held !== true && (kept.length < WRITES_KEPT || entry.at >= oldest)) {
                    append(key, entry);
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
        const heard = (event: Event): void => {
            const key = (event as StorageEvent).key;
            if (selected === null || key === null) return;
            if (key === layoutKey(selected)) changed();
            else if (key === writesKey(selected)) putBack(key);
        };
        source.addEventListener('storage', heard);
        return () => source.removeEventListener('storage', heard);
    }

    return {
        attach,
        select,
        identity: () => selected,
        readSaved,
        rememberUnread,
        write,
        writeFor,
        refusal,
        follow
    };
}
