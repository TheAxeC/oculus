<script lang="ts">
    // Layer 3, shared view. One labelled part of a record's page: its small label, the uppercase
    // words in the accent colour the project page's fields are headed by, over what the part holds,
    // with the controls a part has beside the label (a folder's Files and Workbench). A field of a
    // card's two columns (RecordDetails.svelte beside this file) and a block of a page (the project
    // page's LaTeX, documents and sessions, an entry's folder, a student's supervision folder) are
    // each drawn under it, so every label of a record's page is one rule and none folds.

    import type { Snippet } from 'svelte';
    import type { HTMLAttributes } from 'svelte/elements';

    type Props = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'style' | 'children'> & {
        /** The words of the label. */
        label: string;
        /** The controls drawn beside the label; none draws the label alone. */
        actions?: Snippet;
        /** What the part holds, under the label. */
        children: Snippet;
    };

    let { label, actions, children, ...attributes }: Props = $props();
</script>

<div {...attributes} class="field">
    <div class="head">
        <span class="label">{label}</span>
        {@render actions?.()}
    </div>
    {@render children()}
</div>

<style>
    .field {
        min-width: 0;
        margin-top: 6px;
    }

    .head {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    .label {
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }
</style>
