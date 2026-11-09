<script lang="ts">
    // Layer 3, view partial. The inline list of items of a `list` or `parked` field, drawn by
    // FieldControl.svelte: one box per item, a number box when the spec's items are numbers and a
    // text box otherwise, each with its Up, Down and Remove, and an Add under them. The caller of a
    // list whose spec sets `empty` tells a key its record lacks from a list held empty: while there
    // is no item it passes the words that say which (`note`), drawn above the Add, and for a list
    // held empty what takes the key out (`onclear`), a Clear beside those words. A press of Clear
    // removes the button that holds the focus, so the focus goes to the Add first. It holds
    // nothing: every change hands on the whole new list of items (`onpick`).

    import NumberInput from '$lib/ui/forms/NumberInput.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The items as they stand. */
        items: string[];
        /** Whether the items are numbers, drawn in number boxes. */
        numbers: boolean;
        /** The field's accessible name, already translated, which each item's names carry. */
        label: string;
        /** The new list of items after a keystroke, a move, a removal or an Add. */
        onpick: (items: string[]) => void;
        /** The words drawn above the Add while there is no item; none draws no words. */
        note?: string;
        /** What the Clear beside the note does; none draws no Clear. */
        onclear?: () => void;
    };

    let { items, numbers, label, onpick, note, onclear }: Props = $props();

    let box: HTMLDivElement | undefined = $state();

    /** Clear: the focus goes to the Add, the last thing of the list, then the key goes out. */
    function clear(): void {
        box?.querySelector<HTMLElement>(':scope > :last-child button')?.focus();
        onclear?.();
    }

    function setItem(at: number, next: string): void {
        onpick(items.map((one, place) => (place === at ? next : one)));
    }

    function moveItem(at: number, by: number): void {
        const next = [...items];
        const [taken] = next.splice(at, 1);
        next.splice(at + by, 0, taken);
        onpick(next);
    }
</script>

<div class="items" bind:this={box}>
    {#each items as item, at (at)}
        <div class="item">
            {#if numbers}
                <NumberInput
                    value={item}
                    label={t('settings.editor_item', at + 1, label)}
                    oninput={(next: string) => setItem(at, next)}
                />
            {:else}
                <TextInput
                    value={item}
                    label={t('settings.editor_item', at + 1, label)}
                    oninput={(next: string) => setItem(at, next)}
                />
            {/if}
            <ToolButton
                label={t('settings.editor_item_up', at + 1, label)}
                glyph="collapse"
                compact
                disabled={at === 0}
                onclick={() => moveItem(at, -1)}
            />
            <ToolButton
                label={t('settings.editor_item_down', at + 1, label)}
                glyph="expand"
                compact
                disabled={at === items.length - 1}
                onclick={() => moveItem(at, 1)}
            />
            <ToolButton
                label={t('settings.editor_item_remove', at + 1, label)}
                glyph="trash"
                compact
                onclick={() => onpick(items.filter((_, place) => place !== at))}
            />
        </div>
    {:else}
        {#if note !== undefined}
            <div class="empty">
                <span class="note">{note}</span>
                {#if onclear !== undefined}
                    <ToolButton label={t('settings.list_clear', label)} onclick={clear}>
                        {t('settings.list_clear_word')}
                    </ToolButton>
                {/if}
            </div>
        {/if}
    {/each}
    <ToolButton
        label={t('settings.editor_add')}
        glyph="add"
        onclick={() => onpick([...items, ''])}
    />
</div>

<style>
    .items {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        min-width: 0;
    }

    .item {
        display: flex;
        align-items: center;
        gap: 2px;
    }

    .empty {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .note {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }
</style>
