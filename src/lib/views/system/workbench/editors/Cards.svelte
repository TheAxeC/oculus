<script lang="ts">
    // Layer 3, view partial. The entries of one list of an editor, as the form of the draft draws
    // them: one text field per item for a list, a key field and a value field per entry for a key/
    // value table, and a card with a field per catalog field for a record. Each entry has Move up,
    // Move down and Remove, and the list ends with Add. A field a record holds that the catalog
    // does not name is drawn as read-only text after the card's fields, since it is sent back
    // unchanged.
    //
    // The partial holds nothing: every keystroke and press goes out as an edit (state/system/
    // config/editors/draft.ts), and the entries come in as they are. A roll-up draws one of these
    // per key, with `group` naming the key's place.

    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { Card, Draft, Edit } from '$lib/state/system/config/editors/draft';
    import { flowText } from '$lib/state/system/config/editors/flow';

    type Props = {
        cards: Card[];
        fields: string[];
        form: Draft['form'];
        /** The place of the key of a roll-up these entries are under. */
        group?: number;
        onedit: (edit: Edit) => void;
    };

    let { cards, fields, form, group, onedit }: Props = $props();

    /** The edits that address one entry of a list. */
    type Aimed = Extract<Edit, { do: 'add' | 'remove' | 'move' | 'set' }>;

    /** An edit addressed to this list's entries: with the group's place when it has one. */
    function aimed(edit: Aimed): Edit {
        return group === undefined ? edit : { ...edit, group };
    }

    const inline = $derived(form === 'items' || form === 'pairs');
</script>

<div class="cards" data-cards={form}>
    {#each cards as card, at (at)}
        <div class="card" class:inline data-card={at}>
            <div class="fields">
                {#each fields as name (name)}
                    <span class="field">
                        {#if !inline}
                            <span class="word" aria-hidden="true">{name}</span>
                        {/if}
                        <TextInput
                            value={card.fields[name] ?? ''}
                            label={t('settings.editor_field', at + 1, name)}
                            oninput={(text: string) =>
                                onedit(aimed({ do: 'set', index: at, field: name, text }))}
                        />
                    </span>
                {/each}
            </div>
            <span class="controls">
                <ToolButton
                    label={t('settings.editor_up', at + 1)}
                    glyph="collapse"
                    compact
                    disabled={at === 0}
                    onclick={() => onedit(aimed({ do: 'move', index: at, by: -1 }))}
                />
                <ToolButton
                    label={t('settings.editor_down', at + 1)}
                    glyph="expand"
                    compact
                    disabled={at === cards.length - 1}
                    onclick={() => onedit(aimed({ do: 'move', index: at, by: 1 }))}
                />
                <ToolButton
                    label={t('settings.editor_remove', at + 1)}
                    glyph="trash"
                    compact
                    onclick={() => onedit(aimed({ do: 'remove', index: at }))}
                />
            </span>
            {#if Object.keys(card.kept).length > 0}
                <p class="kept">
                    {t('settings.editor_kept')}
                    {#each Object.entries(card.kept) as [name, held] (name)}
                        <code>{name}</code> <code>{flowText(held)}</code>
                    {/each}
                </p>
            {/if}
        </div>
    {/each}
    <ToolButton
        label={t('settings.editor_add')}
        glyph="add"
        onclick={() => onedit(aimed({ do: 'add' }))}
    />
</div>

<style>
    .cards {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 6px;
        min-width: 0;
    }

    .card {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 6px;
        width: 100%;
        max-width: 720px;
        padding: 6px 0;
    }

    .card:not(.inline) {
        padding: 6px 8px;
        border: 1px solid var(--line);
        border-radius: var(--radius-sm);
    }

    .fields {
        display: flex;
        flex: 1 1 320px;
        flex-wrap: wrap;
        gap: 6px;
        min-width: 0;
    }

    .card.inline .fields {
        flex-wrap: nowrap;
    }

    .card:not(.inline) .fields {
        flex-direction: column;
    }

    .field {
        display: flex;
        align-items: center;
        gap: 6px;
        flex: 1 1 160px;
        min-width: 0;
    }

    .card:not(.inline) .field {
        flex: 0 0 auto;
    }

    .word {
        flex: 0 0 72px;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    .controls {
        display: inline-flex;
        gap: 2px;
    }

    .kept {
        flex: 1 0 100%;
        margin: 0;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    code {
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
        background: var(--chip);
        border-radius: var(--radius-sm);
        padding: 0 3px;
    }

    /* Over a wallpaper a code piece paints nothing under it, as the manual's inline code does. */
    :global(body.wall) code {
        background: transparent;
    }
</style>
