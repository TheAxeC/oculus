<script lang="ts">
    // Layer 3, shared view partial, drawn by views/boards/collection/Collection.svelte and at the
    // top of the set's page (views/boards/listing/Listing.svelte). The Funding collection's one
    // card of its own, drawn as the record card (views/shared/card/record/RecordCard.svelte): the
    // projects no scheme of the file covers, as the project strip at its foot, each opening its
    // project tab, which the collection draws after its cards, or above its list, while its bar
    // keeps it: no Status slice picked, or the No funding slice among those picked, and, while a
    // group of the bar's Projects section has a pick, a project of the card the picks leave. The
    // collection hands it the projects the picks leave, which its strip and its count are of. Its
    // title opens the set's page (`ontitle`), and on that page, which lists every unfunded project,
    // the card is drawn with no strip. The card has no action, so no menu of its own.

    import Tag from '$lib/ui/controls/Tag.svelte';
    import RecordCard from '$lib/views/shared/card/record/RecordCard.svelte';
    import { NO_FUNDING, type Project } from '$lib/state/boards/collection';
    import { t } from '$lib/state/shared/words/text';

    type Props = {
        /** The projects no scheme covers that the picks of the bar's Projects section leave. */
        unfunded: Project[];
        /** Whether keyboard navigation has selected this card. */
        cursor: boolean;
        /** Open the set's page; none draws the title as words. */
        ontitle?: () => void;
        /** Whether the foot draws the project strip. */
        listed?: boolean;
    };

    let { unfunded, cursor, ontitle, listed = true }: Props = $props();
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
        {ontitle}
        {meta}
        {text}
        projects={listed ? unfunded : undefined}
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
