<script lang="ts">
    // Layer 3, partial of views/sources/files/Files.svelte. The tree and the section head that
    // clangd's AST and Memory Usage sections share: the tree the rows are keyed in, the head that
    // opens and closes the section, and the head's controls, a Close that empties the section and,
    // where the section can ask the server again, a Refresh before it. The caller draws the rows.

    import type { Snippet } from 'svelte';
    import Section from '../Section.svelte';
    import TreeView from '$lib/ui/tree/TreeView.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import type { KeyRow, TreeNav } from '$lib/ui/tree/tree-keys';

    type Props = {
        /** The section's name, already translated. */
        label: string;
        /** The rows as the keyboard reads them, the head first. */
        keyRows: KeyRow[];
        /** How many rows the section holds, drawn on its head. */
        count: number;
        open: boolean;
        /** The head opens or closes. */
        ontoggle: () => void;
        /** A key asked for a row of the tree to open or close. */
        onrow?: (id: string) => void;
        /**
         * The head's Refresh: its words and what it does, for a section the server can answer
         * again.
         */
        refresh?: { label: string; run: () => void };
        /** The head's Close: its words, its tooltip and what it does. */
        close: { label: string; title: string; run: () => void };
        /** The rows, each an `li` with role none around a row of level 2. */
        rows: Snippet<[TreeNav]>;
    };

    let { label, keyRows, count, open, ontoggle, onrow, refresh, close, rows }: Props = $props();
</script>

<TreeView
    {label}
    rows={keyRows}
    ontoggle={(id: string) => (id === 'head' ? ontoggle() : onrow?.(id))}
>
    {#snippet children(nav: TreeNav)}
        <Section {label} {nav} {count} {open} {ontoggle} {more}>
            {@render rows(nav)}
        </Section>
    {/snippet}
</TreeView>

{#snippet more(reach: number)}
    {#if refresh !== undefined}
        <ToolButton
            label={refresh.label}
            glyph="refresh"
            compact
            tabindex={reach}
            onclick={refresh.run}
        />
    {/if}
    <ToolButton
        label={close.label}
        title={close.title}
        glyph="dismiss"
        compact
        tabindex={reach}
        onclick={close.run}
    />
{/snippet}
