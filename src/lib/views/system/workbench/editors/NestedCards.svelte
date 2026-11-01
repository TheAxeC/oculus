<script lang="ts">
    // Layer 3, view partial. A family field of a card, with the field's name above its cards
    // (Cards.svelte): a nested list of records, a map from a key to a value, or a field that holds
    // one record. A list or a map is drawn under the disclosure line a row's editor uses
    // (Fold.svelte), kept per row and path, so past five entries it starts folded and draws
    // nothing, at every depth. A field of one record holds one card, so a fold of its own says
    // nothing, and the lists and maps inside it fold.
    //
    // A search that draws entries of this list unfolds it. A list it draws nothing of has its kept
    // fold: a press on the line of a list with no match draws the whole list, and on the line of a
    // list whose matches all fall past the cap shows no entry, since that list is filtered, and the
    // line under the row counts those matches.

    import type { ComponentProps } from 'svelte';
    import type { Edit, Step } from '$lib/state/system/config/editors/draft';
    import {
        cardsOf,
        familyForm,
        pairValueSpec,
        type FieldSpec,
        type FieldValue
    } from '$lib/state/system/config/editors/fields';
    import type { Lists } from '$lib/state/system/config/editors/sources';
    import { stepsKey } from '$lib/state/system/config/view/fold';
    import type { Drawn } from '$lib/state/system/config/view/matches';
    import Cards from './Cards.svelte';
    import Fold from './Fold.svelte';

    type Props = {
        /** The field's name. */
        name: string;
        spec: FieldSpec;
        /** What the card holds at the field. */
        held: FieldValue | undefined;
        /** The steps down to the field's list, the last one the card and this field. */
        path: Step[];
        /** The words that name the nested list in the label of a control. */
        scope: string;
        lists: Lists;
        /** The instance the cards are drawn in, whose state keeps the fold. */
        instance: string;
        /** The file and key of the setting the cards belong to. */
        base: string;
        /** The row's id, which keeps the fold. */
        row: string;
        /** What the standing search draws of the row. */
        search: Drawn | null;
        /** How many Discards the draft has had. */
        discards: number;
        onedit: (edit: Edit) => void;
    };

    let {
        name,
        spec,
        held,
        path,
        scope,
        lists,
        instance,
        base,
        row,
        search,
        discards,
        onedit
    }: Props = $props();

    const cards = $derived(cardsOf(held));
    const single = $derived(familyForm(spec) === 'record');
    const pairs = $derived(familyForm(spec) === 'pairs');

    /** The specs of the cards: a map's key and value, else the field's fields. */
    const specs = $derived.by(() => {
        const fields = spec.fields ?? {};
        return pairs ? { key: fields.key, value: pairValueSpec(spec) } : fields;
    });

    /** What the cards are drawn from, under a fold or not. */
    const entries = $derived<ComponentProps<typeof Cards>>({
        cards,
        fields: Object.keys(specs),
        specs,
        form: pairs ? 'pairs' : 'nested',
        single,
        sparse: spec.sparse === true,
        lists,
        instance,
        base,
        row,
        path,
        scope,
        search,
        discards,
        onedit
    });
</script>

<div class="nested" data-field={name}>
    {#if single}
        <span class="word">{name}</span>
        <Cards {...entries} />
    {:else}
        <Fold
            id={instance}
            {row}
            part={path}
            title={name}
            count={cards.length}
            searched={(search?.lists.get(stepsKey(path))?.length ?? 0) > 0}
        >
            <Cards {...entries} />
        </Fold>
    {/if}
</div>

<style>
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
</style>
