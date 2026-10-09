<script lang="ts">
    // Layer 3, partial of views/sessions/session-detail/SessionDetail.svelte. One section of the
    // Session view, built as the sections under the Files tree are: its own tree
    // (ui/tree/TreeView.svelte), so it is one stop of the focus order, its head drawn by the
    // sections' shared head (views/shared/explorer/sections/Section.svelte) with the name and the
    // count, and the caller's body under the head while the section is open. A section that is
    // closed unmounts its body, which is what stops a timer or a request the body started.
    //
    // The body holds the section's tree rows, each an `li` with role none around a row of level 2
    // whose id is among `rows`, and whatever else the section shows (a form, a commit box) as an
    // `li` of its own, which the keys of the tree pass over. Alt+Up and Alt+Down on the head move
    // the section, as the drag of the head does, when the caller hands in `move`.

    import type { Snippet } from 'svelte';
    import Section from '$lib/views/shared/explorer/sections/Section.svelte';
    import {
        headKeys,
        type SectionMove
    } from '$lib/views/shared/explorer/sections/list-drag.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';
    import { MOVE_KEYMAP } from '$lib/state/sources/explorer/acts/keys';
    import type { SectionId } from './session-sections';

    type Props = {
        id: SectionId;
        /** The section's name, already translated. */
        label: string;
        /** How many rows the section counts, drawn on its head; omitted, the head draws none. */
        count?: number;
        /** The ids of the rows the body draws as tree rows, in order. */
        rows: string[];
        open: boolean;
        ontoggle: () => void;
        /** What lets the head be dragged and moved by Alt+Up and Alt+Down. */
        move?: SectionMove;
        body: Snippet<[TreeNav]>;
    };

    let { id, label, count, rows, open, ontoggle, move, body }: Props = $props();

    const keyRows = $derived([
        { id: 'head', parent: null, open },
        ...(open ? rows.map((row) => ({ id: row, parent: 'head' })) : [])
    ]);
</script>

<div class="session-section" data-section={id}>
    <TreeView {label} rows={keyRows} {ontoggle} keymap={MOVE_KEYMAP} onkey={headKeys(move)}>
        {#snippet children(nav: TreeNav)}
            <Section {label} {nav} {count} {open} {ontoggle} drag={move?.drag}>
                {@render body(nav)}
            </Section>
        {/snippet}
    </TreeView>
</div>
