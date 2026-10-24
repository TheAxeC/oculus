<script lang="ts">
    // Layer 3, view partial of views/boards/collection/Collection.svelte. The Funding collection's
    // one card of its own: the projects no scheme of the file covers, each opening its project tab,
    // which the collection draws after the entries while its No funding chip is pressed.

    import Card from '$lib/ui/frame/Card.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { NO_FUNDING, type Project } from '$lib/state/boards/collection';
    import { recordState } from '$lib/state/shared/page/records';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const {
        layout: { openView }
    } = useState();

    type Props = {
        /** The projects no scheme covers. */
        unfunded: Project[];
        /** Whether keyboard navigation has selected this card. */
        cursor: boolean;
    };

    let { unfunded, cursor }: Props = $props();
</script>

<div class="slot" data-entry={NO_FUNDING} role="listitem">
    <Card id={NO_FUNDING} {cursor} title={t('collection.no_funding')}>
        {#snippet meta()}
            <Tag label={String(unfunded.length)} />
        {/snippet}
        <p class="sub">{t('collection.no_funding_sub')}</p>
        <div class="row">
            {#each unfunded as project (project.id)}
                <ToolButton
                    small
                    label={project.short ?? project.title}
                    onclick={() =>
                        openView(
                            'project',
                            recordState(project.id, project.short ?? project.title)
                        )}
                />
            {/each}
        </div>
    </Card>
</div>

<style>
    /* The card fills its cell of the collection's grid, as an entry's card does: a grid of one
       cell stretches its one child both ways, so the card needs no rule of its own here. */
    .slot {
        display: grid;
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .sub {
        margin: 0 0 6px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }
</style>
