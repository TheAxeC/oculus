<script lang="ts">
    // Layer 3, view partial. The mark at the right end of a Live HPC group's heading whose rows are
    // older than the queue (Capacity.svelte, Recent.svelte): the time they came from, or that no
    // poll has read them since the server started, in the failure tone. Nothing is drawn while the
    // rows are the queue's.
    import { staleWords } from '$lib/state/system/machine/hpc/hpc';

    let {
        stale
    }: {
        /**
         * The time the rows came from when they are older than the queue, null when no poll has
         * read them since the server started, and undefined when they are the queue's.
         */
        stale?: string | null;
    } = $props();
</script>

{#if stale !== undefined}
    <span class="stale">{staleWords(stale)}</span>
{/if}

<style>
    .stale {
        color: var(--c-red-d-txt);
    }
</style>
