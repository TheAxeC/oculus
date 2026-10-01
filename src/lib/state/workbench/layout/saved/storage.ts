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
// the arrangement was saved elsewhere and reads it (layout.svelte.ts, `takeSaved`).

import { followKey } from '../../../shared/stores/storage-events.ts';
import type { Pages } from '../model.ts';
import { serialiseLayout } from './saved.ts';

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

/** What the store needs of a Storage, so a test can hand it a plain object. */
export type Storable = Pick<Storage, 'getItem' | 'setItem'>;

/** The arrangement's persistence: attached once by a load, then read and written by key. */
export type LayoutStorage = {
    /** Name where the arrangement is read from and saved to. Nothing is saved before this. */
    attach: (storage: Storable) => void;
    /** One key of the attached storage, or null when there is none or it refused to be read. */
    read: (key: string) => string | null;
    /** Write one string under a key, or do nothing when there is nowhere to write yet. */
    remember: (key: string, value: string) => void;
    /** Write a set of pages under LAYOUT_KEY, which is what every change to them ends in. */
    write: (next: Pages) => void;
    /**
     * Call `changed` whenever another browser tab saved the arrangement, as `source` (the window)
     * reports it; answers how to stop. The browser fires the event in every tab but the writer's,
     * so a save made here never calls it, and a write to any other key is not heard.
     */
    follow: (source: EventTarget, changed: () => void) => () => void;
};

export function createStorage(): LayoutStorage {
    /** Where the arrangement is read and saved, once a load has named it. */
    let backing: Storable | null = null;

    function attach(storage: Storable): void {
        backing = storage;
    }

    function read(key: string): string | null {
        if (backing === null) return null;
        try {
            return backing.getItem(key);
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

    function write(next: Pages): void {
        if (backing === null) return;
        try {
            backing.setItem(LAYOUT_KEY, serialiseLayout(next));
        } catch {
            // A full or refused storage loses the arrangement at the next load and nothing else:
            // the arrangement in memory is what the shell renders and it is already current.
        }
    }

    function follow(source: EventTarget, changed: () => void): () => void {
        return followKey(source, LAYOUT_KEY, changed);
    }

    return { attach, read, remember, write, follow };
}
