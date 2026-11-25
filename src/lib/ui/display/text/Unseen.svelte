<script lang="ts">
    // Layer 3, primitive. Words a screen reader reads and the page draws nowhere: a field's label
    // that names its trigger (ui/forms/choice/select/FieldSelect.svelte), a fact as it is read out
    // (views/academic/present/parts/project/Facts.svelte) and the state of a filter value a list
    // draws only to the eye (views/shared/forms/bar/PickMenu.svelte). It is one inline span, held
    // out of sight by a one-pixel clipped box rather than `display: none`, which would hide it from
    // the screen reader too; `id` names it for an `aria-labelledby` that reads it.

    import type { Snippet } from 'svelte';

    type Props = {
        /** The id an `aria-labelledby` names the words by. */
        id?: string;
        /** The words read. */
        children: Snippet;
    };

    let { id, children }: Props = $props();
</script>

<span class="unseen" {id}>{@render children()}</span>

<style>
    .unseen {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
        white-space: nowrap;
    }
</style>
