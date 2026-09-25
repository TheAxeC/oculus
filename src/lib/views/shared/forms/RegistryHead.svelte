<script lang="ts">
    // Layer 3, view partial under views/shared/. The head a registry-line view draws above its
    // cards: the view's intro with the control that opens the form adding an entry, that form while
    // it is open, and the line the last write said.
    //
    // The Pillars and the Domains views draw it the same way, so it lives here once. Whether the
    // form is open and what was last said belong to the view, which a card of it also writes, so
    // both are handed in with the callbacks that change them.

    import type { Snippet } from 'svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import EntryForm from '$lib/views/shared/forms/EntryForm.svelte';
    import type { SchemaField } from '$lib/state/boards/collection';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The collection key, which is what the add form's write names its file by. */
        collection: string;
        /** The collection file's own schema; no add control is drawn for a file with none. */
        schema: SchemaField[] | undefined;
        /**
         * The view's own intro, handed the add control to draw among its actions. The view draws
         * it, so its words are the view's own catalog line, which a trusted Intro may carry.
         */
        intro: Snippet<[Snippet]>;
        /** Whether the add form is open. */
        adding: boolean;
        /** The line the last write said, empty for none. */
        said: string;
        /** Open or close the add form. */
        ontoggle: () => void;
        /** Close the add form. */
        onclose: () => void;
        /** Say one line about a write. */
        onsaid: (words: string) => void;
        /** Whether the said line keeps the gap above it that the Pillars view's notes carry. */
        spaced?: boolean;
    };

    let {
        collection,
        schema,
        intro,
        adding,
        said,
        ontoggle,
        onclose,
        onsaid,
        spaced = false
    }: Props = $props();
</script>

{#snippet actions()}
    {#if schema !== undefined}
        <ToolButton
            label={t('collection.add')}
            title={t('collection.add_tip')}
            active={adding}
            onclick={ontoggle}
        />
    {/if}
{/snippet}

{@render intro(actions)}
{#if adding && schema !== undefined}
    <EntryForm {collection} {schema} entry={null} {onclose} {onsaid} />
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
