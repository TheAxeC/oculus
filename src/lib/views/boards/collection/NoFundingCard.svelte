<script lang="ts">
    // Layer 3, view partial of views/boards/collection/Collection.svelte. The Funding collection's
    // one card of its own, drawn as the record card (views/shared/card/record/RecordCard.svelte):
    // the projects no scheme of the file covers, as the project strip at its foot, each opening its
    // project tab, which the collection draws after its cards, or above its list, while its bar
    // keeps it: no Status slice picked, or the No funding slice among those picked. The card has no
    // action, so no menu of its own.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import RecordCard from '$lib/views/shared/card/record/RecordCard.svelte';
    import { NO_FUNDING, type Project } from '$lib/state/boards/collection';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The projects no scheme covers. */
        unfunded: Project[];
        /** Whether keyboard navigation has selected this card. */
        cursor: boolean;
    };

    let { unfunded, cursor }: Props = $props();
</script>

{#snippet meta()}
    <Tag label={String(unfunded.length)} />
{/snippet}

{#snippet text()}
    <p class="sub">{t('collection.no_funding_sub')}</p>
{/snippet}

<div class="slot" data-entry={NO_FUNDING} role="listitem">
    <RecordCard
        id={NO_FUNDING}
        {cursor}
        title={t('collection.no_funding')}
        {meta}
        {text}
        projects={unfunded}
    />
</div>

<style>
    /* The card fills its cell of the collection's grid, as an entry's card does. */
    .slot {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    .sub {
        margin: 0;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }
</style>
