<script lang="ts">
    // Layer 3, view partial under views/shared/. The head a registry-line view draws above its
    // cards: the view's intro, the form adding an entry while it is open, and the line the last
    // write said. The control that opens the form is the view's header icon (AddButton.svelte).
    //
    // The Pillars, Domains, Data and Venues views draw it the same way, so it lives here once.
    // Whether the form is open and what was last said belong to the view, which a card of it also
    // writes, so the view binds the line and hands in whether the form is open with the callback
    // that closes it.

    import type { Snippet } from 'svelte';
    import EntryForm from '$lib/views/shared/forms/EntryForm.svelte';
    import type { SchemaField } from '$lib/state/boards/collection';

    type Props = {
        /** The collection key, which is what the add form's write names its file by. */
        collection: string;
        /** The collection file's own schema; the add form is drawn only for a file with one. */
        schema: SchemaField[] | undefined;
        /**
         * The view's own intro. The view draws it, so its words are the view's own catalog line,
         * which a trusted Intro may carry.
         */
        intro: Snippet;
        /** Whether the add form is open. */
        adding: boolean;
        /** The line the last write said, empty for none; the add form's writes set it. */
        said?: string;
        /** Close the add form. */
        onclose: () => void;
        /** Whether the said line keeps the gap above it that the Pillars view's notes carry. */
        spaced?: boolean;
    };

    let {
        collection,
        schema,
        intro,
        adding,
        said = $bindable(''),
        onclose,
        spaced = false
    }: Props = $props();
</script>

{@render intro()}
{#if adding && schema !== undefined}
    <EntryForm
        {collection}
        {schema}
        entry={null}
        {onclose}
        onsaid={(words: string) => (said = words)}
    />
{/if}
{#if said !== ''}
    <p class="said" class:spaced>{said}</p>
{/if}

<style>
    .said {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-md);
    }

    .said.spaced {
        margin: 6px 0 0;
    }
</style>
