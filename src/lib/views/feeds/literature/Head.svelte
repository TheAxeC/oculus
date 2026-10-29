<script lang="ts">
    // Layer 3, view partial of views/feeds/literature/Literature.svelte. The part of the view above
    // the list: one toggle per source the server lists (the rows of `literature.sources` of the
    // primary hub, in their order, each by its name) with the state of its latest answer beside it,
    // and the filters and the sort. A source whose required `downloads` row the machine does not
    // hold is a toggle that cannot be pressed, and its tooltip names the row and says where its
    // secret is made. Nothing here sends a request: a toggle and the filters change the form, the
    // view's Search asks.

    import Checkbox from '$lib/ui/forms/Checkbox.svelte';
    import NumberInput from '$lib/ui/forms/NumberInput.svelte';
    import Segment from '$lib/ui/controls/segment/Segment.svelte';
    import Select from '$lib/ui/forms/choice/Select.svelte';
    import TextInput from '$lib/ui/forms/TextInput.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { keyTip, sortWords, stateWords, typeWords } from './words';
    import {
        DOC_TYPES,
        SORTS,
        sourceOn,
        type DocType,
        type LiteratureForm,
        type LiteratureSort,
        type LiteratureSource,
        type SourceInfo
    } from '$lib/state/feeds/literature/form';
    import type { SourceRun } from '$lib/state/feeds/literature/run.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        form: LiteratureForm;
        /** The sources the server lists, in its order. */
        sources: SourceInfo[];
        runs: Partial<Record<LiteratureSource, SourceRun>>;
        timeoutS: number | null;
        onchange: (changes: Partial<LiteratureForm>) => void;
        ontoggle: (source: LiteratureSource, on: boolean) => void;
    };

    let { form, sources, runs, timeoutS, onchange, ontoggle }: Props = $props();

    const types = $derived(DOC_TYPES.map((type) => ({ id: type, label: typeWords(type) })));
    const sorts = $derived(SORTS.map((sort) => ({ id: sort, label: sortWords(sort) })));
</script>

<div class="head">
    <div class="sources" role="group" aria-label={t('literature.sources')}>
        {#each sources as source (source.id)}
            {@const on = sourceOn(form, source)}
            <span class="source">
                <ToolButton
                    label={source.name}
                    pressed={on}
                    active={on}
                    disabled={!source.available}
                    title={keyTip(source)}
                    onclick={() => ontoggle(source.id, !on)}
                />
                {#if on}
                    <span class="state">{stateWords(runs[source.id], timeoutS)}</span>
                {/if}
            </span>
        {/each}
    </div>

    <div class="filters" role="group" aria-label={t('literature.filters')}>
        <span class="year">
            <NumberInput
                value={form.from}
                label={t('literature.from')}
                placeholder={t('literature.from')}
                oninput={(from: string) => onchange({ from })}
            />
        </span>
        <span class="year">
            <NumberInput
                value={form.to}
                label={t('literature.to')}
                placeholder={t('literature.to')}
                oninput={(to: string) => onchange({ to })}
            />
        </span>
        <Select
            value={form.type}
            label={t('literature.type')}
            choices={types}
            onchange={(type: string) => onchange({ type: type as DocType })}
        />
        <Checkbox
            checked={form.oa}
            label={t('literature.oa')}
            onchange={(oa: boolean) => onchange({ oa })}
        />
        <span class="name">
            <TextInput
                value={form.venue}
                label={t('literature.venue')}
                placeholder={t('literature.venue')}
                oninput={(venue: string) => onchange({ venue })}
            />
        </span>
        <span class="name">
            <TextInput
                value={form.author}
                label={t('literature.author')}
                placeholder={t('literature.author')}
                oninput={(author: string) => onchange({ author })}
            />
        </span>
        <span class="year">
            <NumberInput
                value={form.minCites}
                label={t('literature.min_cites')}
                placeholder={t('literature.min_cites')}
                oninput={(minCites: string) => onchange({ minCites })}
            />
        </span>
        <Segment
            items={sorts}
            value={form.sort}
            label={t('literature.sort')}
            onchange={(sort: string) => onchange({ sort: sort as LiteratureSort })}
        />
    </div>
</div>

<style>
    .head {
        display: grid;
        gap: 8px;
        min-width: 0;
    }

    .sources,
    .filters {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px 10px;
        min-width: 0;
    }

    .source {
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    .state {
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-sm);
    }

    /* The boxes take the width of the span round them. */
    .year {
        width: 11ch;
    }

    .name {
        width: 18ch;
    }
</style>
