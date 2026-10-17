<script lang="ts">
    // Layer 3, view partial. The entries of one list of an editor, as the form of the draft draws
    // them: one box per item for a list, a key and a value per entry for a key/value table, a card
    // with a control per catalog field for a record (FieldControl.svelte), and for a field that is
    // a nested list of records the same cards again inside the card. Each entry has Move up, Move
    // down and Remove, and the list ends with Add. A list that names its items (`slots`) draws one
    // box per name with no Add, Remove or Move; a parked list draws its items with Remove alone; a
    // multi is one card holding its picker.
    //
    // A value a record holds that its control cannot show is drawn after the card's fields as the
    // file has it, with the sentence that the control cannot show it, and so is a field the catalog
    // does not name; both are sent back unchanged. The text of a field of a draft saved in flow
    // text that did not read as YAML is drawn too, and Save names it.
    //
    // The partial holds nothing: every keystroke and press goes out as an edit (state/system/
    // config/editors/draft.ts), and the entries come in as they are. A roll-up draws one of these
    // per key, with `group` naming the key's place, and a nested list draws one with `path` naming
    // the cards above it.
    //
    // Every card has a card id that is its own within the pane, which holds many lists: the file
    // and key of the setting (`base`), the roll-up group, and the steps down through the nested
    // lists to the card's place. The keyboard's cursor names one of them (the instance's card
    // cursor), the card it names draws `data-cursor`, and Enter on it moves the focus to the first
    // control inside the card's field area, marked `data-card-focus`, without changing a value.
    //
    // Add puts the focus on the first control of the entry it adds once the entry is drawn, as VS
    // Code's Add Item opens its box focused, so what is typed next goes into the new entry.

    import { tick } from 'svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { focusFirstQuietly } from '$lib/ui/frame/quiet-focus';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import type { Draft, Edit, Step } from '$lib/state/system/config/editors/draft';
    import {
        cardsOf,
        controlOf,
        fromText,
        textOf,
        type Card,
        type FieldSpec,
        type FieldValue
    } from '$lib/state/system/config/editors/fields';
    import { flowText } from '$lib/state/system/config/editors/flow';
    import type { Lists } from '$lib/state/system/config/editors/sources';
    import FieldControl from './FieldControl.svelte';
    import Cards from './Cards.svelte';

    type Props = {
        cards: Card[];
        fields: string[];
        specs: Record<string, FieldSpec>;
        form: Draft['form'] | 'nested';
        lists: Lists;
        /** The instance the cards are drawn in, whose card cursor marks one of them. */
        instance: string;
        /** The file and key of the setting the cards belong to: the start of every card id. */
        base: string;
        /** The place of the key of a roll-up these entries are under. */
        group?: number;
        /** The cards above a nested list: each one's place in its list and the field holding it. */
        path?: Step[];
        /** The words that name the nested list in the label of a control. */
        scope?: string;
        /** The row's title, which names the boxes of a list of items and a multi. */
        title?: string;
        /** The names of the fixed items of a list. */
        slots?: string[];
        /** A list whose items can only be removed. */
        removeOnly?: boolean;
        onedit: (edit: Edit) => void;
    };

    let {
        cards,
        fields,
        specs,
        form,
        lists,
        instance,
        base,
        group,
        path = [],
        scope = '',
        title = '',
        slots,
        removeOnly = false,
        onedit
    }: Props = $props();

    const {
        layout: { instanceLayoutState }
    } = useState();

    /** The card the instance's keyboard cursor is on, null for none. */
    const cursor = $derived(cardCursor(instanceLayoutState(instance)));

    let box: HTMLDivElement | undefined = $state();
    /** The place of the entry an Add asked for, until its first control has taken the focus. */
    let added: number | null = $state(null);

    $effect(() => {
        const at = added;
        const root = box;
        if (at === null || root === undefined || cards.length <= at) return;
        added = null;
        void tick().then(() => {
            const all = root.querySelectorAll<HTMLElement>(':scope > .card > [data-card-focus]');
            const fields = Array.from(all).at(at);
            if (fields !== undefined) focusFirstQuietly(fields);
        });
    });

    /** Add an entry at the end of the list, whose first control then takes the focus. */
    function add(): void {
        added = cards.length;
        onedit(aimed({ do: 'add' }));
    }

    /** The id of the card at a place of this list, unique in the pane. */
    function idOf(at: number): string {
        const steps = [...path, { index: at, field: '' }]
            .map((step) => `${step.index}.${step.field}`)
            .join('/');
        return `${base}|${group === undefined ? '' : String(group)}|${steps}`;
    }

    /** The edits that address one entry of a list. */
    type Aimed = Extract<Edit, { do: 'add' | 'remove' | 'move' | 'set' }>;

    /** An edit addressed to this list's entries: with the group's place and the cards above. */
    function aimed(edit: Aimed): Edit {
        const where = group === undefined ? { path } : { group, path };
        return { ...edit, ...where };
    }

    const inline = $derived(form === 'items' || form === 'pairs');
    const fixed = $derived(slots !== undefined || form === 'multi');
    /**
     * Whether a field draws its name before its control: in a card, and in a list of named slots.
     */
    const worded = $derived(!inline || slots !== undefined);
    const movable = $derived(!fixed && !removeOnly);

    /** The name of a field in a control's label, with the nested list it is in. */
    function nameOf(name: string, at: number): string {
        if (form === 'items' && slots !== undefined) return slots[at] ?? name;
        return `${scope}${name}`;
    }

    /** The accessible name of the control of a field of an entry. */
    function labelOf(name: string, at: number): string {
        if (slots !== undefined) return nameOf(name, at);
        if (form === 'multi') return title;
        if (form === 'items') return t('settings.editor_item', at + 1, title);
        return t('settings.editor_field', at + 1, nameOf(name, at));
    }

    /** The spec of a field, or nothing for a name the catalog does not give. */
    function specOf(name: string): FieldSpec | undefined {
        return Object.hasOwn(specs, name) ? specs[name] : undefined;
    }

    /** The fields of a card its controls draw: not those it keeps as the file has them. */
    function drawnOf(card: Card): string[] {
        return fields.filter((name) => !Object.hasOwn(card.kept, name));
    }

    /** The catalog fields of a card the card kept because their control cannot show them. */
    function stuckOf(card: Card): [string, unknown][] {
        return Object.entries(card.kept).filter(([name]) => specOf(name) !== undefined);
    }

    /** The fields of a card the catalog does not name. */
    function unnamedOf(card: Card): [string, unknown][] {
        return Object.entries(card.kept).filter(([name]) => specOf(name) === undefined);
    }
</script>

<div class="cards" data-cards={form} bind:this={box}>
    {#each cards as card, at (at)}
        <div
            class="card"
            class:inline
            data-card={idOf(at)}
            data-cursor={idOf(at) === cursor || undefined}
        >
            <div class="fields" data-card-focus>
                {#each drawnOf(card) as name (name)}
                    {@const spec = specOf(name)}
                    {#if spec !== undefined && controlOf(spec) === 'records'}
                        <div class="nested" data-field={name}>
                            <span class="word">{name}</span>
                            <Cards
                                cards={cardsOf(card.fields[name])}
                                fields={Object.keys(spec.fields ?? {})}
                                specs={spec.fields ?? {}}
                                form="nested"
                                {lists}
                                {instance}
                                {base}
                                {group}
                                path={[...path, { index: at, field: name }]}
                                scope={`${scope}${name} ${at + 1}, `}
                                {onedit}
                            />
                        </div>
                    {:else if spec !== undefined && removeOnly}
                        <code>{textOf(card.fields[name])}</code>
                    {:else if spec !== undefined}
                        <span class="field">
                            {#if worded}
                                <span class="word" aria-hidden="true">{nameOf(name, at)}</span>
                            {/if}
                            <FieldControl
                                {spec}
                                value={card.fields[name]}
                                label={labelOf(name, at)}
                                named={worded}
                                {lists}
                                record={card.fields}
                                optional={form !== 'items' && form !== 'multi' && name !== 'key'}
                                ontext={(text: string) =>
                                    onedit(
                                        aimed({
                                            do: 'set',
                                            index: at,
                                            field: name,
                                            value: fromText(spec, text)
                                        })
                                    )}
                                onpick={(value: FieldValue | undefined) =>
                                    onedit(aimed({ do: 'set', index: at, field: name, value }))}
                            />
                        </span>
                    {/if}
                {/each}
            </div>
            {#if movable || removeOnly}
                <span class="controls">
                    {#if movable}
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
                    {/if}
                    <ToolButton
                        label={t('settings.editor_remove', at + 1)}
                        glyph="trash"
                        compact
                        onclick={() => onedit(aimed({ do: 'remove', index: at }))}
                    />
                </span>
            {/if}
            {#if stuckOf(card).length > 0}
                <p class="kept">
                    {t('settings.editor_stuck')}
                    {#each stuckOf(card) as [name, held] (name)}
                        <code>{name}</code> <code>{flowText(held)}</code>
                    {/each}
                </p>
            {/if}
            {#if unnamedOf(card).length > 0}
                <p class="kept">
                    {t('settings.editor_kept')}
                    {#each unnamedOf(card) as [name, held] (name)}
                        <code>{name}</code> <code>{flowText(held)}</code>
                    {/each}
                </p>
            {/if}
            {#if Object.keys(card.unread ?? {}).length > 0}
                <p class="kept">
                    {t('settings.editor_unread')}
                    {#each Object.entries(card.unread ?? {}) as [name, text] (name)}
                        <code>{name}</code> <code>{text}</code>
                    {/each}
                </p>
            {/if}
        </div>
    {/each}
    {#if !fixed && !removeOnly}
        <ToolButton label={t('settings.editor_add')} glyph="add" onclick={add} />
    {/if}
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
        box-sizing: border-box;
        width: 100%;
        max-width: 720px;
        padding: 6px 0;
    }

    /* The card the keyboard's cursor is on: the accent outline a card under the cursor draws. */
    .card[data-cursor] {
        outline: 1px solid var(--accent);
        outline-offset: -1px;
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

    /* A name wider than the card's column of names, or a control that does not fit beside it, puts
       the control under the name, so the row stays inside the card. */
    .field {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        flex: 1 1 160px;
        min-width: 0;
    }

    .card:not(.inline) .field {
        flex: 0 0 auto;
    }

    .nested {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
    }

    .word {
        flex: 0 1 auto;
        min-width: 72px;
        max-width: 100%;
        overflow-wrap: anywhere;
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

    /* Over a wallpaper a code piece paints nothing under it, as the manual's inline code does,
       and is outlined in the line colour instead, so it is told from the words beside it. */
    :global(body.wall) code {
        background: transparent;
        outline: 1px solid var(--line);
        outline-offset: -1px;
    }
</style>
