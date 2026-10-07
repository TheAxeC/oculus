<script lang="ts">
    // Layer 3, partial of views/sources/files/sections/. One section under the file browser's
    // trees: a head that opens and closes it and carries the controls that act on it (the one that
    // adds a note or a bookmark, Save All and Close All of the open editors), the drag and Alt+Up
    // and Alt+Down step that move it among the sections when the caller hands them in, and the
    // section's own rows under it. The sections share the head and differ in their rows, so the
    // head is drawn here once.
    //
    // `showActions` draws the head's control at full strength whether or not the pointer is over
    // the head, for a control a reader looks for before the pointer is there; without it the
    // control is shown the way every row's controls are, under the pointer or the focus.

    import type { Snippet } from 'svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import TreeSection from '$lib/ui/tree/TreeSection.svelte';
    import type { ItemDrag } from '$lib/ui/tree/item-props';
    import type { TreeNav } from '$lib/ui/tree/tree-keys';

    type Props = {
        /** The section's name, already translated. */
        label: string;
        nav: TreeNav;
        /** How many rows the section holds, drawn on its head. */
        count: number;
        open: boolean;
        ontoggle: () => void;
        /** The head's adding control: its words, its tooltip and its glyph, already translated. */
        add?: { label: string; title: string; glyph: string };
        /** Whether what the control opens is open, for a control that opens a form. */
        adding?: boolean;
        onadd?: () => void;
        /** Further controls of the head, drawn after the adding control. */
        more?: Snippet<[number]>;
        showActions?: boolean;
        /** What lets the head be dragged over the other sections' heads. */
        drag?: ItemDrag;
        /** The rows, each an `li` with role none around a row of level 2. */
        children: Snippet;
    };

    let {
        label,
        nav,
        count,
        open,
        ontoggle,
        add,
        adding,
        onadd,
        more,
        showActions = false,
        drag,
        children
    }: Props = $props();
</script>

<TreeSection {label} id="head" {nav} {count} {open} {ontoggle} {showActions} {drag}>
    {#snippet actions(reach: number)}
        {#if add !== undefined}
            <ToolButton
                label={add.label}
                title={add.title}
                glyph={add.glyph}
                compact
                tabindex={reach}
                expanded={adding}
                onclick={() => onadd?.()}
            />
        {/if}
        {@render more?.(reach)}
    {/snippet}
    {@render children()}
</TreeSection>
