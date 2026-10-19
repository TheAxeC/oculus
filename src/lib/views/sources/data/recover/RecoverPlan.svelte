<script lang="ts">
    // Layer 3, Recover view partial. The plan: one row per file the dataset's sources list, with
    // its size, its checksum, its state on the target, the bytes the target holds of it with the
    // rate they grow at, and a Fetch of that one file while it is missing, partial or different.
    // The totals above the rows are the files, their bytes, the bytes a Fetch still needs and the
    // free space of the target's disk.
    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Meter from '$lib/ui/display/meters/Meter.svelte';
    import Table from '$lib/ui/display/table/Table.svelte';
    import { type Column, cellText } from '$lib/ui/display/table/table-rows';
    import { t } from '$lib/state/shared/words/text';
    import {
        sizeWords,
        stateLook,
        type Rates,
        type RecoverFileState,
        type RecoverRow,
        type RecoverTotals
    } from '$lib/state/system/machine/recover-words';

    type Props = {
        rows: RecoverRow[];
        totals: RecoverTotals;
        rates: Rates;
        /** Why a Fetch cannot start now, or the empty text when it can. */
        why: string;
        onfetch: (name: string) => void;
    };

    let { rows, totals, rates, why, onfetch }: Props = $props();

    const columns: Column[] = [
        { key: 'name', label: t('recover.col_name') },
        { key: 'size', label: t('recover.col_size'), numeric: true },
        { key: 'checksum', label: t('recover.col_checksum') },
        { key: 'state', label: t('recover.col_state') },
        { key: 'have', label: t('recover.col_have') },
        { key: 'actions', label: t('recover.col_actions') }
    ];

    const tableRows = $derived(
        rows.map((row) => ({
            name: row.name,
            size: row.size === null ? t('recover.size_unknown') : sizeWords(row.size),
            checksum:
                row.checksum === null
                    ? t('recover.checksum_none')
                    : `${row.checksum.kind} ${row.checksum.value.slice(0, 12)}`,
            full: row.checksum?.value ?? '',
            state: row.state,
            have: row.have,
            total: row.size,
            actions: row.state === 'missing' || row.state === 'partial' || row.state === 'different'
        }))
    );

    /** Whether no source of the plan states the size of its file, so its bytes are not known. */
    const sizesUnknown = $derived(rows.length > 0 && rows.every((row) => row.size === null));

    /** The bytes held of a file, against its size where the source states one. */
    function haveWords(have: number, total: number | null, rate: number | undefined): string {
        const held =
            total === null ? sizeWords(have) : t('recover.of', sizeWords(have), sizeWords(total));
        return rate === undefined ? held : t('recover.at_rate', held, sizeWords(rate));
    }
</script>

{#snippet cell(row: Record<string, unknown>, column: Column)}
    {@const name = cellText(row.name)}
    {#if column.key === 'state'}
        {@const look = stateLook(cellText(row.state) as RecoverFileState)}
        <Tag label={look.words} tone={look.tone} />
    {:else if column.key === 'checksum'}
        <span class="sum" title={cellText(row.full)}>{cellText(row.checksum)}</span>
    {:else if column.key === 'have'}
        {@const have = typeof row.have === 'number' ? row.have : 0}
        {@const total = typeof row.total === 'number' ? row.total : null}
        {@const words = haveWords(have, total, rates.files.get(name))}
        {#if total !== null && total > 0 && have < total}
            <Meter value={have / total} label={t('recover.have_label', name)} text={words} />
        {:else}
            {words}
        {/if}
    {:else if column.key === 'actions'}
        {#if row.actions === true}
            <span class="reveal">
                <ToolButton
                    small
                    label={t('recover.fetch_one')}
                    title={why === '' ? t('recover.fetch_one_title', name) : why}
                    disabled={why !== ''}
                    onclick={() => onfetch(name)}
                />
            </span>
        {/if}
    {:else}
        {cellText(row[column.key])}
    {/if}
{/snippet}

<section class="plan" aria-label={t('recover.plan')}>
    <p class="totals">
        {sizesUnknown
            ? totals.files === 1
                ? t('recover.totals_unsized_one')
                : t('recover.totals_unsized', totals.files)
            : totals.files === 1
              ? t('recover.totals_one', sizeWords(totals.bytes))
              : t('recover.totals', totals.files, sizeWords(totals.bytes))}
        {totals.unsized === 0
            ? t('recover.missing', sizeWords(totals.missing))
            : totals.missing === 0
              ? totals.unsized === 1
                  ? t('recover.unsized_only_one')
                  : t('recover.unsized_only', totals.unsized)
              : totals.unsized === 1
                ? t('recover.missing_unsized_one', sizeWords(totals.missing))
                : t('recover.missing_unsized', sizeWords(totals.missing), totals.unsized)}
        {totals.free === null
            ? t('recover.free_unknown')
            : totals.missing > totals.free
              ? t('recover.free_short', sizeWords(totals.free))
              : t('recover.free', sizeWords(totals.free))}
    </p>
    <div class="scroll">
        <Table {columns} rows={tableRows} rowKey="name" {cell} sortable />
    </div>
</section>

<style>
    .plan {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    .totals {
        color: var(--muted-txt);
        font-size: var(--fs-md);
        margin: 0;
    }

    .sum {
        font-family: var(--font-mono);
        font-size: var(--fs-sm);
    }

    /* A table wider than the pane scrolls inside its own box. */
    .scroll {
        min-width: 0;
        overflow-x: auto;
    }

    /* A row's control is drawn while the pointer is over the row or the focus is inside it, and
       always where nothing hovers. It stays in the layout and in the tab order while clear. */
    .scroll :global(tr) {
        --row-reveal: 0;
    }

    .scroll :global(tr:hover),
    .scroll :global(tr:focus-within) {
        --row-reveal: 1;
    }

    @media (hover: none) {
        .scroll :global(tr) {
            --row-reveal: 1;
        }
    }

    .reveal {
        display: inline-flex;
        opacity: var(--row-reveal);
        transition: opacity 120ms ease-out;
    }
</style>
