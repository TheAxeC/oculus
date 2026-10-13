// Layer 2, client state. What a write the server took says about a record until the portfolio the
// page holds catches up with it. A save is answered at once and the watcher's rebuilt snapshot
// follows a moment later; in between, a form that compared its edits with the snapshot would show
// the old value beside "nothing changed". A settled write holds the values the server took, by
// field, and a reader asks for the snapshot's values with them put over.
//
// A held value gives way the moment the snapshot's value for its field is no longer the one the
// write was made over: whether that is the write itself or another writer's value, the snapshot is
// the newer word. A snapshot that still shows the old value keeps the held one, and so does a
// snapshot built before the write; the value is dropped anyway once two builds have come after the
// write, so a field that went back to its old value by another hand is not held for ever.
//
// A write that gave an entry a new key is kept under the key the entry had, with the key it has,
// so a page opened for the old key finds the entry and follows to the new one. An entry that was
// added is held with its fields until the snapshot holds it.
//
// The store is memory only and belongs to one client; a reload reads the server's files.

import { SvelteMap } from 'svelte/reactivity';

/** How many builds after a write a held value is kept when the snapshot never changes. */
const BUILDS_KEPT = 2;

/** One value the server took: the value, what the snapshot showed for the field, and when. */
type Held = { value: unknown; from: string; at: number; seq: number };

/** The values taken for one record, and whether the record was added or got a new key. */
type Group = {
    held: Record<string, Held>;
    created: boolean;
    /** The key the record has now, when the write changed it. */
    to: string | undefined;
};

/** What the snapshot showed for a field, as a text two readings of it can be compared by. */
function shown(value: unknown): string {
    return value === undefined ? '' : JSON.stringify(value);
}

/** The settled writes of one client. */
export type SettledStore = {
    /** The number a write is stamped with when it is sent, so the newest of two answers wins. */
    begin: () => number;
    /**
     * Hold the `saved` values of the record `key`, over the `raw` values the snapshot has for it
     * (null when it has none), sent as write number `seq`. `to` is the record's key now when the
     * write changed it, and `created` says the write added the record.
     */
    record: (
        key: string,
        saved: Record<string, unknown>,
        raw: Record<string, unknown> | null,
        seq: number,
        options?: { created?: boolean; to?: string }
    ) => void;
    /** The `raw` values with every value still held put over them. */
    overlay: (key: string, raw: Record<string, unknown>) => Record<string, unknown>;
    /** Whether the record `key` was added and the snapshot has not shown it yet. */
    pending: (key: string) => boolean;
    /** The key a record under `prefix` had before a write gave it the key `now`, if one did. */
    renamedFrom: (prefix: string, now: string) => string | undefined;
};

/** Settled writes; `versionOf` gives the version of the snapshot a record's key is read in. */
export function createSettled(versionOf: (key: string) => number): SettledStore {
    const groups = new SvelteMap<string, Group>();
    let sequence = 0;

    function begin(): number {
        sequence += 1;
        return sequence;
    }

    /** Whether a value is still the one to show: the snapshot has not moved on from what it was. */
    function holds(
        key: string,
        one: Held,
        raw: Record<string, unknown> | null,
        field: string
    ): boolean {
        return versionOf(key) < one.at + BUILDS_KEPT && shown(raw?.[field]) === one.from;
    }

    /** Whether any value of a group can still be shown. */
    function alive(key: string, group: Group): boolean {
        return Object.values(group.held).some((one) => versionOf(key) < one.at + BUILDS_KEPT);
    }

    function record(
        key: string,
        saved: Record<string, unknown>,
        raw: Record<string, unknown> | null,
        seq: number,
        options: { created?: boolean; to?: string } = {}
    ): void {
        const at = versionOf(key);
        for (const [name, group] of groups) if (!alive(name, group)) groups.delete(name);
        const before = groups.get(key);
        const held: Record<string, Held> = { ...before?.held };
        for (const [field, value] of Object.entries(saved)) {
            if (Object.hasOwn(held, field) && held[field].seq > seq) continue;
            held[field] = { value, from: shown(raw?.[field]), at, seq };
        }
        groups.set(key, {
            held,
            created: options.created === true || before?.created === true,
            to: options.to ?? before?.to
        });
    }

    function overlay(key: string, raw: Record<string, unknown>): Record<string, unknown> {
        const group = groups.get(key);
        if (group === undefined) return raw;
        let out = raw;
        for (const [field, one] of Object.entries(group.held)) {
            if (holds(key, one, raw, field)) out = { ...out, [field]: one.value };
        }
        return out;
    }

    function pending(key: string): boolean {
        const group = groups.get(key);
        return group !== undefined && group.created && alive(key, group);
    }

    function renamedFrom(prefix: string, now: string): string | undefined {
        for (const [name, group] of groups) {
            if (name.startsWith(prefix) && group.to === now && alive(name, group)) {
                return name.slice(prefix.length);
            }
        }
        return undefined;
    }

    return { begin, record, overlay, pending, renamedFrom };
}
