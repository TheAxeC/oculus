<script lang="ts">
    // Layer 3, partial of views/sessions/session-detail/SessionDetail.svelte. The mark of a file
    // that other live sessions hold open, with their titles in its tooltip. The Changes section
    // draws it on the rows of the files the session touched and on the rows of the repository's
    // changes, so the words and the colour are written once. It draws nothing for a file no other
    // session holds.

    import { t } from '$lib/state/shared/words/text';

    /** The titles of the other sessions holding the file open. */
    let { also }: { also: string[] } = $props();
</script>

{#if also.length > 0}
    <span class="mark" title={t('sessions.ch_shared_tip', also.join(', '))}
        >{t('sessions.ch_shared')}</span
    >
{/if}

<style>
    .mark {
        flex: 0 0 auto;
        font-size: var(--fs-xs);
        color: var(--c-amber-txt, var(--muted));
    }
</style>
