<script lang="ts">
    // Layer 3, view partial of views/boards/collection/Collection.svelte. The filters a
    // collection's schema asks for with `filter: true`, in the bar beside the search: a field of
    // words as chips of its values with their counts, pressed to keep only the entries that hold
    // one of the pressed values, and a field of whole numbers as a range, from and to. A field of
    // more than FILTER_CHIPS_MOST values, such as the authors of a list of papers, is one
    // MultiSelect with a search instead, labelled with the field and the number picked, so the bar
    // stays a few lines high. What is pressed and typed is the tab's instance state, which the
    // view holds and writes; this draws it and says what changed.

    import Chip from '$lib/ui/controls/Chip.svelte';
    import MultiSelect from '$lib/ui/forms/choice/MultiSelect.svelte';
    import NumberInput from '$lib/ui/forms/NumberInput.svelte';
    import {
        changedPicks,
        FILTER_CHIPS_MOST,
        type Bounds,
        type FieldFilter
    } from '$lib/state/boards/collection';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        filters: FieldFilter[];
        picked: Record<string, string[]>;
        range: Record<string, Bounds>;
        /** Press or release one value of a chip filter. */
        onpick: (field: string, value: string) => void;
        /** The bounds of a range filter as typed. */
        onrange: (field: string, bounds: Bounds) => void;
    };

    let { filters, picked, range, onpick, onrange }: Props = $props();

    /** The bounds of a range filter, none typed when the tab holds none. */
    const boundsOf = (field: string): Bounds => range[field] ?? { from: '', to: '' };

    /** The values of a chip filter the tab holds pressed. */
    const pickedOf = (field: string): string[] => picked[field] ?? [];

    /** Press or release each value the list control changed. */
    function repick(field: string, next: string[]): void {
        for (const value of changedPicks(pickedOf(field), next)) onpick(field, value);
    }
</script>

{#each filters as filter (filter.field)}
    {#if filter.kind === 'chips' && filter.chips.length > FILTER_CHIPS_MOST}
        {@const named = t('collection.filter_picked', filter.label, pickedOf(filter.field).length)}
        <span class="label">{named}</span>
        <span class="many">
            <MultiSelect
                values={pickedOf(filter.field)}
                label={named}
                choices={filter.chips.map((chip) => ({
                    id: chip.value,
                    label: `${chip.label} ${chip.count}`
                }))}
                onchange={(next: string[]) => repick(filter.field, next)}
                search={t('collection.search', filter.label)}
                remove={t('editor.remove')}
                removeGlyph={t('editor.remove_glyph')}
                none={t('editor.no_choices')}
            />
        </span>
    {:else if filter.kind === 'chips'}
        <span class="label">{filter.label}</span>
        {#each filter.chips as chip (chip.value)}
            <Chip
                label={`${chip.label} ${chip.count}`}
                pressed={(picked[filter.field] ?? []).includes(chip.value)}
                onclick={() => onpick(filter.field, chip.value)}
            />
        {/each}
    {:else}
        <span class="label">{filter.label}</span>
        <span class="bound">
            <NumberInput
                value={boundsOf(filter.field).from}
                label={t('collection.range_from', filter.label)}
                placeholder={String(filter.least)}
                oninput={(from: string) =>
                    onrange(filter.field, { ...boundsOf(filter.field), from })}
            />
        </span>
        <span class="bound">
            <NumberInput
                value={boundsOf(filter.field).to}
                label={t('collection.range_to', filter.label)}
                placeholder={String(filter.most)}
                oninput={(to: string) => onrange(filter.field, { ...boundsOf(filter.field), to })}
            />
        </span>
    {/if}
{/each}

<style>
    .label {
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    .bound {
        width: 6em;
    }

    /* The list of a field of many values takes a line of the bar of its own when it needs one. */
    .many {
        flex: 1 1 20em;
        min-width: 12em;
    }
</style>
