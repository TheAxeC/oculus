<script lang="ts">
    // Layer 3, view partial. The entries of one list of an editor, as the form of the draft draws
    // them: one box per item for a list, a key and a value per entry for a key/value table, a card
    // with a control per catalog field for a record (FieldControl.svelte), and for a family field
    // the same cards again inside the card: a card per record of a nested list, a key and a value
    // per key of a map, and one card for a field that holds one record (`single`), which offers Add
    // only while it holds none and no Move. Each entry has Move up, Move down and Remove, and the
    // list ends with Add; a value merged in oculus's place (`ordered` false) has no Move, since the
    // merge keeps oculus's order. A list that names its items (`slots`) draws one box per name with
    // no Add, Remove or Move; a parked list draws its items with Remove alone; a multi is one card
    // holding its picker.
    //
    // A value a record holds that its control cannot show is drawn after the card's fields as the
    // file has it, with the sentence that the control cannot show it, and so is a field the catalog
    // does not name; both are sent back unchanged. The text of a field of a draft saved in flow
    // text that did not read as YAML is drawn too, and Save names it.
    //
    // The partial holds nothing: every keystroke and press goes out as an edit (state/system/
    // config/editors/draft.ts), and the entries come in as they are. A nested list draws one of
    // these with `path` naming the cards above it, under a fold of its own (NestedCards.svelte).
    //
    // Every card has a card id that is its own within the pane, which holds many lists: the file
    // and key of the setting (`base`) and the steps down through the nested lists to the card's
    // place. The keyboard's cursor names one of them (the instance's card cursor), the card it
    // names draws `data-cursor`, and Enter on it moves the focus to the first control inside the
    // card's field area, marked `data-card-focus`, without changing a value.
    //
    // Add puts the focus on the first control of the entry it adds once the entry is drawn, as VS
    // Code's Add Item opens its box focused, so what is typed next goes into the new entry. The
    // entry is found by its card id, which holds under a filter too.
    //
    // A list draws its first PAGE entries and a Show more line for the next PAGE, so a catalog of
    // thousands of entries (the interface words, the Unicode math symbols) unfolds without drawing
    // every card at once; Add draws through to the entry it adds.
    //
    // While a search filters this list (`search`, state/system/config/view/matches.ts) the list
    // draws the entries it picked alone, with no Show more, and none at all when its matches all
    // fall past the cap. Each entry keeps its real place in every use (its card id, its `{#each}`
    // key, its edits, a slot's name, its labels, the Add field of a sparse card), so an edit lands
    // on the entry the reader acted on, and a Move goes past the next entry drawn.
    //
    // A family marked `sparse` (`sparse`) draws each card with the fields its record holds and an
    // Add field menu of the others; a field picked there is held with an empty value
    // (state/system/config/editors/fields.ts). A text field that takes a record draws the record's
    // card while it holds one, and its box otherwise.

    import { tick } from 'svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import { focusFirstQuietly } from '$lib/ui/frame/quiet-focus';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { cardCursor } from '$lib/state/workbench/layout/instance';
    import type { Draft, Edit, Step } from '$lib/state/system/config/editors/draft';
    import {
        addableFields,
        addedValue,
        drawsCards,
        fromText,
        shownFields,
        textOf,
        type Card,
        type FieldSpec,
        type FieldValue
    } from '$lib/state/system/config/editors/fields';
    import { flowText } from '$lib/state/system/config/editors/flow';
    import type { Lists } from '$lib/state/system/config/editors/sources';
    import { stepsKey } from '$lib/state/system/config/view/fold';
    import { moveBy, type Drawn } from '$lib/state/system/config/view/matches';
    import FieldControl from './FieldControl.svelte';
    import NestedCards from './NestedCards.svelte';

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
        /** The row's id, which keeps the folds of the nested lists. */
        row: string;
        /** What the standing search draws of the row, or null while it filters nothing. */
        search: Drawn | null;
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
        /** A field that holds one record: Add only while it holds none, and no Move. */
        single?: boolean;
        /**
         * Whether the entries can be moved: false for a value merged in oculus's place, which
         * keeps oculus's order.
         */
        ordered?: boolean;
        /** A family drawn with the fields each card holds and an Add field menu of the others. */
        sparse?: boolean;
        /** How many Discards the draft has had, which a control's Add person compares. */
        discards?: number;
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
        row,
        search,
        path = [],
        scope = '',
        title = '',
        slots,
        removeOnly = false,
        single = false,
        ordered = true,
        sparse = false,
        discards = 0,
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

    /** How many entries a list draws at first, and how many more each Show more draws. */
    const PAGE = 100;
    /** How many entries are drawn now. */
    let shown = $state(PAGE);
    /** The places a search draws of this list, or undefined for a list it does not filter. */
    const places = $derived(search?.lists.get(stepsKey(path)));
    /** The entries drawn, each with its real place in the list. */
    const drawn = $derived<[Card, number][]>(
        places === undefined
            ? cards.slice(0, shown).map((card, at) => [card, at])
            : places.filter((at) => at < cards.length).map((at) => [cards[at], at])
    );
    /** How many entries a press of Show more draws. */
    const next = $derived(places === undefined ? Math.min(PAGE, cards.length - shown) : 0);

    $effect(() => {
        const at = added;
        const root = box;
        if (at === null || root === undefined || !drawn.some(([, place]) => place === at)) return;
        added = null;
        void tick().then(() => {
            const id = CSS.escape(idOf(at));
            const fields = root.querySelector<HTMLElement>(
                `:scope > [data-card="${id}"] > [data-card-focus]`
            );
            if (fields !== null) focusFirstQuietly(fields);
        });
    });

    /** Add an entry at the end of the list, whose first control then takes the focus. */
    function add(): void {
        added = cards.length;
        shown = Math.max(shown, cards.length + 1);
        onedit(aimed({ do: 'add' }));
    }

    /** The id of the card at a place of this list, unique in the pane. */
    function idOf(at: number): string {
        return `${base}|${stepsKey([...path, { index: at, field: '' }])}`;
    }

    /** The `by` of a Move of an entry up or down the entries drawn, 0 when it cannot go there. */
    function byOf(at: number, step: -1 | 1): number {
        if (places !== undefined) return moveBy(places, at, step);
        return at + step >= 0 && at + step < cards.length ? step : 0;
    }

    /** An edit addressed to this list's entries: with the cards above it. */
    function aimed(edit: Edit): Edit {
        return { ...edit, path };
    }

    const inline = $derived(form === 'items' || form === 'pairs');
    const fixed = $derived(slots !== undefined || form === 'multi');
    /**
     * Whether a field draws its name before its control: in a card, and in a list of named slots.
     */
    const worded = $derived(!inline || slots !== undefined);
    const movable = $derived(!fixed && !removeOnly && ordered && !single);
    /** Whether the list ends with Add: a field of one record only while it holds none. */
    const adds = $derived(!fixed && !removeOnly && (!single || cards.length === 0));

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
        return shownFields(card, fields, sparse);
    }

    /** Hold a field picked from a card's Add field menu, with the empty value its control takes. */
    function addField(at: number, name: string): void {
        const spec = specOf(name);
        if (spec === undefined || name === '') return;
        onedit(aimed({ do: 'set', index: at, field: name, value: addedValue(spec) }));
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
    {#each drawn as [card, at] (at)}
        <div
            class="card"
            class:inline
            data-card={idOf(at)}
            data-cursor={idOf(at) === cursor || undefined}
        >
            <div class="fields" data-card-focus>
                {#each drawnOf(card) as name (name)}
                    {@const spec = specOf(name)}
                    {#if spec !== undefined && drawsCards(spec, card.fields[name])}
                        <NestedCards
                            {name}
                            {spec}
                            held={card.fields[name]}
                            path={[...path, { index: at, field: name }]}
                            scope={`${scope}${name} ${at + 1}, `}
                            {lists}
                            {instance}
                            {base}
                            {row}
                            {search}
                            {discards}
                            {onedit}
                        />
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
                                {discards}
                            />
                        </span>
                    {/if}
                {/each}
                {#if sparse && addableFields(card, fields).length > 0}
                    <span class="add-field">
                        <Select
                            value=""
                            label={t('settings.editor_add_field', at + 1)}
                            empty={t('settings.editor_add_field_none')}
                            choices={addableFields(card, fields).map((one) => ({
                                id: one,
                                label: one
                            }))}
                            onchange={(picked: string) => addField(at, picked)}
                        />
                    </span>
                {/if}
            </div>
            {#if !fixed || removeOnly}
                <span class="controls">
                    {#if movable}
                        <ToolButton
                            label={t('settings.editor_up', at + 1)}
                            glyph="collapse"
                            compact
                            disabled={byOf(at, -1) === 0}
                            onclick={() =>
                                onedit(aimed({ do: 'move', index: at, by: byOf(at, -1) }))}
                        />
                        <ToolButton
                            label={t('settings.editor_down', at + 1)}
                            glyph="expand"
                            compact
                            disabled={byOf(at, 1) === 0}
                            onclick={() =>
                                onedit(aimed({ do: 'move', index: at, by: byOf(at, 1) }))}
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
    {#if next > 0}
        <ToolButton
            label={t('settings.editor_more', next, cards.length)}
            glyph="expand"
            onclick={() => (shown += PAGE)}
        />
    {/if}
    {#if adds}
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

    .add-field {
        width: 220px;
        max-width: 100%;
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
