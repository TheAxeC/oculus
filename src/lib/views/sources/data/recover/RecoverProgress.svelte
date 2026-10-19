<script lang="ts">
    // Layer 3, Recover view partial. How far the dataset is: the run that goes (a fetch, a check or
    // an unpack, with the cluster job's id), the bytes on the target against the bytes the sources
    // list, the rate they grow at and the time left at that rate, the files a check or an unpack
    // has done of its count, and the checksum results so far: how many files are verified and how
    // many differ.
    import Meter from '$lib/ui/display/meters/Meter.svelte';
    import { t } from '$lib/state/shared/words/text';
    import {
        secondsLeft,
        sizeWords,
        timeWords,
        type Rates,
        type RecoverRow,
        type RecoverRun
    } from '$lib/state/system/machine/recover-words';

    /**
     * `bytes` is the folder's bytes the server's last reading of a run pushed, or null with none:
     * on the cluster it is the one figure of the folder, where the rows hold the answer's bytes.
     */
    type Props = { rows: RecoverRow[]; run: RecoverRun | null; rates: Rates; bytes: number | null };

    let { rows, run, rates, bytes }: Props = $props();

    const sized = $derived(rows.filter((row) => row.size !== null));
    const listed = $derived(sized.reduce((sum, row) => sum + (row.size ?? 0), 0));
    const held = $derived(
        bytes === null
            ? sized.reduce((sum, row) => sum + Math.min(row.have, row.size ?? row.have), 0)
            : Math.min(bytes, listed)
    );
    const left = $derived(secondsLeft(listed - held, rates.total));
    const verified = $derived(rows.filter((row) => row.state === 'verified').length);
    const different = $derived(rows.filter((row) => row.state === 'different').length);

    /** What the run does, in words. */
    function runWords(one: RecoverRun): string {
        const what =
            one.action === 'fetch'
                ? t('recover.run_fetch')
                : one.action === 'verify'
                  ? t('recover.run_verify')
                  : t('recover.run_unpack');
        const counted =
            one.done === undefined || one.total === undefined
                ? what
                : t('recover.run_count', what, one.done, one.total);
        return one.job === undefined ? counted : t('recover.run_job', counted, one.job);
    }
</script>

<section class="progress" aria-label={t('recover.progress')}>
    <p class="line">{run === null ? t('recover.run_none') : runWords(run)}</p>
    {#if listed > 0}
        <Meter
            value={held / listed}
            label={t('recover.progress')}
            text={t('recover.of', sizeWords(held), sizeWords(listed))}
        />
    {/if}
    {#if rates.total > 0}
        <p class="line">
            {left === null
                ? t('recover.rate', sizeWords(rates.total))
                : t('recover.rate_left', sizeWords(rates.total), timeWords(left))}
        </p>
    {/if}
    <p class="line">
        {rows.length === 1
            ? t('recover.checked_one', verified, different)
            : t('recover.checked', verified, different, rows.length)}
    </p>
</section>

<style>
    .progress {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .line {
        color: var(--muted-txt);
        font-size: var(--fs-md);
        margin: 0;
    }
</style>
