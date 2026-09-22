<script lang="ts">
    // Layer 3, primitive. The tree an explorer's rows are drawn in: one stop of the browser's focus
    // order, moved along the rows with the arrow keys by ui/tree/tree-keys.ts's rowMove(). The
    // caller hands the rows as the keyboard reads them and draws them with the `nav` this passes to
    // its snippet, which is what gives each row its place in the focus order and its key handler.
    //
    // The row at the stop is the caller's when it says so (a view that keeps its selection in its
    // instance state), and otherwise the last row the focus was on, held here. A key that moves the
    // stop puts the focus on the row it moved to once the tree has drawn it; that is the one thing
    // done to the page rather than to state, since a focus is the browser's.

    import { tick, type Snippet } from 'svelte';
    import { rowMove, stopOf, type KeyRow, type TreeNav } from './tree-keys.ts';

    type Props = {
        /** The tree's accessible name, already translated. */
        label: string;
        rows: KeyRow[];
        /** The row the caller keeps at the stop; omitted, the tree holds its own. */
        current?: string;
        /** The focus moved to a row by a key. */
        onfocusrow?: (id: string) => void;
        /** A key asked for a row to open or close. */
        ontoggle?: (id: string) => void;
        children: Snippet<[TreeNav]>;
    };

    let { label, rows, current, onfocusrow, ontoggle, children }: Props = $props();

    let box: HTMLDivElement | undefined = $state();
    /** The last row the focus was on, for a tree whose caller keeps no stop of its own. */
    let held = $state('');

    const stop = $derived(stopOf(rows, current ?? held));

    /** Put the focus on one row once the tree has drawn the move that asked for it. */
    async function focusRow(id: string): Promise<void> {
        await tick();
        for (const node of box?.querySelectorAll<HTMLElement>('[data-row-id]') ?? []) {
            if (node.dataset.rowId === id) node.focus();
        }
    }

    const nav: TreeNav = {
        tabindex: (id: string) => (id === stop ? 0 : -1),
        onkeydown: (id: string) => (event: KeyboardEvent) => {
            const move = rowMove(rows, id, event.key);
            if (move === null) return;
            event.preventDefault();
            held = move.id;
            if (move.kind === 'toggle') {
                ontoggle?.(move.id);
                return;
            }
            onfocusrow?.(move.id);
            void focusRow(move.id);
        }
    };

    /**
     * A row a pointer or a Tab put the focus on becomes the stop, so the next Tab leaves from it.
     */
    function entered(event: FocusEvent): void {
        const target = event.target;
        if (target instanceof HTMLElement && target.dataset.rowId !== undefined) {
            held = target.dataset.rowId;
        }
    }
</script>

<div class="tree" role="tree" aria-label={label} bind:this={box} onfocusin={entered}>
    {@render children(nav)}
</div>

<style>
    .tree {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }
</style>
