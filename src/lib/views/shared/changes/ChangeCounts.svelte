<script lang="ts">
    // Layer 3, shared view partial. The line counts of one changed path: the lines added and
    // deleted in their two hues, or the word for a binary file. The session views' Changes panel
    // and the Repositories view's change rows both draw them, so the counts read the same in both.

    import type { GitEntry } from '$lib/state/client/selectors.svelte';
    import { t } from '$lib/state/shared/words/text';

    type Props = { entry: GitEntry };

    let { entry }: Props = $props();
</script>

{#if entry.added === null && entry.deleted === null}
    <span class="bin">{t('sessions.ch_binary')}</span>
{:else}
    {#if entry.added}
        <span class="add">{t('sessions.ch_added', entry.added)}</span>
    {/if}
    {#if entry.deleted}
        <span class="del">{t('sessions.ch_deleted', entry.deleted)}</span>
    {/if}
{/if}

<style>
    .bin {
        flex: 0 0 auto;
        color: var(--muted-txt, var(--muted));
        font-size: var(--fs-xs);
    }
    .add,
    .del {
        flex: 0 0 auto;
        font-family: var(--font-num);
        font-size: var(--fs-xs);
    }
    .add {
        color: var(--c-green-txt, var(--muted));
    }
    .del {
        color: var(--c-red-txt, var(--muted));
    }
</style>
