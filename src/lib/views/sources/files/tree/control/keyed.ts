// Layer 3, view partial of tree/Tree.svelte. What a key of the Files keymap does on the row holding
// the focus: the plan acts/keys.ts's keyPlan makes for the key and the row, carried out over the
// tree's calls. A plan that is a menu item runs the menu's pick; Cmd+Z and Shift+Cmd+Z take the
// newest file operation of the change log back, or the newest undo.

import type { ClientState } from '$lib/state/client/context';
import type { FsRoot, RowRef, TreeRow } from '$lib/state/sources/fs';
import {
    actable,
    rowAt,
    selectEvery,
    selectExtended
} from '$lib/state/sources/explorer/acts/selection';
import { keyPlan, type FilesAction } from '$lib/state/sources/explorer/acts/keys';
import { undoPlan } from '$lib/state/sources/explorer/acts/undo';
import { undoSaid } from '$lib/views/shared/writes/undo-said';
import { pickOfKey } from '../menu/row-menu';
import type { Asking } from './asking.svelte';
import type { Picks } from './picks.svelte';
import type { ViewAccess } from './view-access';

export type KeyedDeps = {
    client: ClientState;
    view: ViewAccess;
    asking: Pick<Asking, 'ask'>;
    picks: Pick<Picks, 'acted' | 'run' | 'say' | 'clear'>;
    rowOf: (id: string) => TreeRow | undefined;
    drawn: () => TreeRow[];
    roots: () => FsRoot[] | undefined;
    onopen: (row: TreeRow, preview: boolean) => void;
    ontoggle: (row: TreeRow) => void;
    onup: (to: RowRef) => void;
};

/** The key handler of the tree: true when the key was the tree's, false to leave it to the page. */
export function createKeyed(
    deps: KeyedDeps
): (action: string, id: string, event: KeyboardEvent) => boolean {
    const { client, view, picks } = deps;
    const { explorer } = client;

    /** The row the keys act on: the segment the cursor is on within the row, else the row. */
    function cursorOf(row: TreeRow): TreeRow {
        const selected = view.now().selected;
        return (selected === null ? null : rowAt([row], selected)) ?? row;
    }

    /** Give the focus back to the row a key was pressed on once the tab it opened has settled. */
    function keepFocus(event: KeyboardEvent): void {
        const row = event.target;
        setTimeout(() => {
            if (row instanceof HTMLElement && row.isConnected) row.focus({ preventScroll: true });
        }, 0);
    }

    /**
     * Take the newest file operation of the change log back, or the newest undo. The undo of a
     * delete asks first; a refusal of the endpoint's check is said above the rows.
     */
    async function undone(redo: boolean): Promise<void> {
        picks.clear();
        const plan = undoPlan(await client.changes.latest());
        const record = redo ? plan.redo : plan.undo;
        if (record === null) return;
        const deleting = !redo && (record.field === 'trash' || record.field === 'delete');
        if (deleting && !(await deps.asking.ask({ kind: 'undo-delete' }))) return;
        const answer = await explorer.undoFile(record, deps.roots() ?? []);
        client.changes.reload();
        const said = undoSaid(answer, record.field);
        if (!said.undone) picks.say(said.said);
    }

    return function keyed(action: string, id: string, event: KeyboardEvent): boolean {
        const cutting = explorer.clipboard()?.mode === 'cut';
        const found = deps.rowOf(id);
        if (found === undefined) {
            return (
                keyPlan(action as FilesAction, {
                    root: true,
                    kind: 'dir',
                    acting: 1,
                    actable: 0,
                    cutting
                }) !== 'pass'
            );
        }
        const row = cursorOf(found);
        const group = picks.acted(row);
        const plan = keyPlan(action as FilesAction, {
            root: row.depth === 0,
            kind: row.kind,
            acting: group.length,
            actable: group.filter(actable).length,
            cutting
        });
        const pick = pickOfKey(plan);
        if (pick !== null) picks.run(row, pick);
        else if (plan === 'pass') return false;
        else if (plan === 'open-preview') deps.onopen(row, true);
        else if (plan === 'toggle') {
            if (row.up === true) deps.onup({ root: row.root, path: row.path });
            else deps.ontoggle(found);
        } else if (plan === 'open-background') {
            deps.onopen(row, false);
            keepFocus(event);
        } else if (plan === 'cancel-cut') explorer.clearClipboard();
        else if (plan === 'undo') void undone(false);
        else if (plan === 'redo') void undone(true);
        else if (plan === 'select-all') view.select(selectEvery(view.picked(), deps.drawn()));
        else if (plan === 'extend-up') {
            view.select(selectExtended(view.picked(), deps.drawn(), -1));
        } else if (plan === 'extend-down') {
            view.select(selectExtended(view.picked(), deps.drawn(), 1));
        }
        return true;
    };
}
