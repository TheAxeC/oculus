<script lang="ts">
    // Layer 3, primitive. One row of a form: the label over the control, the help under it, and a
    // note for what the view has to say about this one field. It knows nothing about what the
    // control is: the caller renders that as a snippet, so the same row holds a text box, a date or
    // a list of chips.

    import type { Snippet } from 'svelte';

    type Props = {
        /** The field's words, already translated by the view. */
        label: string;
        /** The line under the control, from the schema. */
        help?: string;
        /** A remark of the view's own, drawn beside the help. */
        note?: string;
        /** Draw the row as one the viewer has changed and not yet saved. */
        dirty?: boolean;
        /** The control. */
        children: Snippet;
    };

    let { label, help, note, dirty = false, children }: Props = $props();
</script>

<div class="field" class:dirty>
    <span class="name">{label}</span>
    <div class="control">{@render children()}</div>
    {#if help !== undefined && help !== ''}
        <p class="help">{help}</p>
    {/if}
    {#if note !== undefined && note !== ''}
        <p class="note">{note}</p>
    {/if}
</div>

<style>
    .field {
        display: block;
        padding: 6px 0 6px 8px;
        border-left: 2px solid transparent;
    }

    /* The one mark a changed row carries: the accent along its edge, so a form with three edits in
       it says which three without moving anything. */
    .field.dirty {
        border-left-color: var(--accent);
    }

    .name {
        display: block;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted-txt, var(--muted));
    }

    .control {
        margin-top: 3px;
    }

    .help,
    .note {
        margin: 3px 0 0;
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }

    .note {
        color: var(--accent-txt, var(--accent));
    }

    :global(body.rice) .name {
        text-transform: none;
        letter-spacing: 0.06em;
    }
</style>
