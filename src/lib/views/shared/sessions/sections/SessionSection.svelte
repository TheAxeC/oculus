<script lang="ts">
    // Layer 3, partial of SessionSections.svelte beside it. One section of a session, built as the
    // sections under the Files tree are: its own tree (ui/tree/TreeView.svelte), so it is one stop
    // of the focus order, its head drawn by the sections' shared head
    // (views/shared/explorer/sections/Section.svelte) with the name, the count and the caller's
    // controls (`more`), and the caller's body under the head while the section is open. A section
    // that is closed unmounts its body, which is what stops a timer or a request the body started.
    //
    // The body holds the section's tree rows, each an `li` with role none around a row whose id is
    // among `rows`, and whatever else the section shows (a field, a commit box) as an `li` of its
    // own, which the keys of the tree pass over. `rows` are the rows under the head as the keyboard
    // reads them, each naming the row it sits under (the head is `head`), so a group row of the
    // body opens and closes by Right and Left, which the tree hands to `onfold`; the head itself
    // opens and closes the section. Alt+Up and Alt+Down on the head move the section, as the drag
    // of the head does, when the caller hands in `move`, and the caller's own keys (`keymap`,
    // `onkey`) answer on the rows of the body. The section right under the Sessions tab's divider
    // draws no line across its head's top edge (`noTopLine`).

    import type { Snippet } from 'svelte';
    import Section from '$lib/views/shared/explorer/sections/Section.svelte';
    import {
        headKeys,
        type SectionMove
    } from '$lib/views/shared/explorer/sections/list-drag.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { Chord, KeyRow, TreeNav } from '$lib/ui/tree/tree-keys';
    import { MOVE_KEYMAP } from '$lib/state/sources/explorer/acts/keys';
    import type { SectionId } from './session-sections';

    type Props = {
        id: SectionId;
        /** The section's name, already translated. */
        label: string;
        /** How many rows the section counts, drawn on its head; omitted, the head draws none. */
        count?: number;
        /** The rows the body draws as tree rows, in order, under the head or under each other. */
        rows: KeyRow[];
        open: boolean;
        ontoggle: () => void;
        /** A key asked for a row of the body to open or close. */
        onfold?: (id: string) => void;
        /** What lets the head be dragged and moved by Alt+Up and Alt+Down. */
        move?: SectionMove;
        /** The head's controls, handed the tabindex they take. */
        more?: Snippet<[number]>;
        /** The body's own keys, answered by `onkey` on the row they are pressed on. */
        keymap?: readonly Chord[];
        onkey?: (action: string, id: string, event: KeyboardEvent) => boolean;
        /** Leave out the line across the head's top edge, for the section right under a divider. */
        noTopLine?: boolean;
        body: Snippet<[TreeNav]>;
    };

    let {
        id,
        label,
        count,
        rows,
        open,
        ontoggle,
        onfold,
        move,
        more,
        keymap = [],
        onkey,
        noTopLine = false,
        body
    }: Props = $props();

    const keyRows = $derived([{ id: 'head', parent: null, open }, ...(open ? rows : [])]);
    const keys = $derived([...MOVE_KEYMAP, ...keymap]);
    const moved = $derived(headKeys(move));

    function toggled(row: string): void {
        if (row === 'head') ontoggle();
        else onfold?.(row);
    }

    function keyed(action: string, row: string, event: KeyboardEvent): boolean {
        return moved(action, row, event) || (onkey?.(action, row, event) ?? false);
    }
</script>

<div class="session-section" data-section={id}>
    <TreeView {label} rows={keyRows} ontoggle={toggled} keymap={keys} onkey={keyed}>
        {#snippet children(nav: TreeNav)}
            <Section {label} {nav} {count} {open} {ontoggle} {more} drag={move?.drag} {noTopLine}>
                {@render body(nav)}
            </Section>
        {/snippet}
    </TreeView>
</div>
