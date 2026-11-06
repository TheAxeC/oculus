// Layer 3, view support of the sessions list. The marks a row menu sets, pinned to the top and
// archived, are writes to ~/.oculus/sessions.json and are drawn at once, before the write lands. A
// mark drawn ahead is held while its write is in flight and then until the sessions channel gives
// its row the same mark, and a write that does not land drops it: from then on the row's mark is
// the channel's, so a change made from another place is drawn and the list's archived rows are the
// ones the channel names.

import type { GroupedSession } from '$lib/state/client/selectors.svelte';
import { isTop } from '$lib/state/sessions/folds';
import { createWaiting } from '$lib/state/shared/stores/waiting.svelte';

type Mark = 'hidden' | 'top';

/** What the marks read of the list and how they write one. */
type MarkDeps = {
    /** Every row the channel holds. */
    rows: () => GroupedSession[];
    write: (id: string, marks: { hidden: boolean } | { top: boolean }) => Promise<{ ok: boolean }>;
};

/** The marks of a list's rows, the ones drawn ahead included. */
export type SessionMarks = {
    archived: (row: GroupedSession) => boolean;
    top: (row: GroupedSession) => boolean;
    /** Flip one mark at once and write it; false for a write that did not land. */
    set: (row: GroupedSession, field: Mark, next: boolean) => Promise<boolean>;
};

/** The marks of one list, read during its component's initialisation, since it holds an effect. */
export function createSessionMarks(deps: MarkDeps): SessionMarks {
    /** The marks drawn ahead of their writes, by session id. */
    let archivedNow: Record<string, boolean> = $state({});
    let topNow: Record<string, boolean> = $state({});
    /** The writes of a mark in flight, by `<field>:<session id>`, counted. */
    const writing = createWaiting();

    // A mark drawn ahead goes once the channel's row carries it and no write of it is in flight.
    $effect(() => {
        const rows = deps.rows();
        const archivedHeld = uncarried(archivedNow, rows, (row) => row.hidden, 'hidden');
        if (archivedHeld !== null) archivedNow = archivedHeld;
        const topHeld = uncarried(topNow, rows, isTop, 'top');
        if (topHeld !== null) topNow = topHeld;
    });

    /**
     * The marks of `drawn` that no row of the channel carries yet or whose write is in flight, or
     * null when none goes, so an unchanged map is not written.
     */
    function uncarried(
        drawn: Record<string, boolean>,
        rows: GroupedSession[],
        mark: (row: GroupedSession) => boolean,
        field: Mark
    ): Record<string, boolean> | null {
        const carried = new Set(
            rows
                .filter(
                    (row) =>
                        drawn[row.id] === mark(row) && writing.count(`${field}:${row.id}`) === 0
                )
                .map((row) => row.id)
        );
        if (carried.size === 0) return null;
        return Object.fromEntries(Object.entries(drawn).filter(([id]) => !carried.has(id)));
    }

    /** Stop drawing one row's mark ahead, so the row draws the channel's mark again. */
    function forget(field: Mark, id: string): void {
        const without = (drawn: Record<string, boolean>) =>
            Object.fromEntries(Object.entries(drawn).filter(([one]) => one !== id));
        if (field === 'hidden') archivedNow = without(archivedNow);
        else topNow = without(topNow);
    }

    return {
        archived: (row) => archivedNow[row.id] ?? row.hidden,
        top: (row) => topNow[row.id] ?? isTop(row),
        set: async (row, field, next) => {
            const key = `${field}:${row.id}`;
            if (field === 'hidden') archivedNow = { ...archivedNow, [row.id]: next };
            else topNow = { ...topNow, [row.id]: next };
            writing.hold(key, 1);
            try {
                const write = field === 'hidden' ? { hidden: next } : { top: next };
                const answer = await deps.write(row.id, write);
                if (answer.ok) return true;
                if (writing.count(key) === 1) forget(field, row.id);
                return false;
            } finally {
                writing.hold(key, -1);
            }
        }
    };
}
