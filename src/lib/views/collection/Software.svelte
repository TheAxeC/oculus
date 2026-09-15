<script lang="ts">
    // Layer 3, view partial of views/Collection.svelte. The Code view's second section: the software
    // projects of the portfolio, listed beside the paper deposits the registry file holds.
    //
    // A software project is filed under its own scan tier and sits on no board, so this list is where
    // it is reached from; its name opens its own tab, exactly as a coverage row does, and so does each
    // of the papers its `related:` names, which is the same link the paper's own card draws back.
    //
    // The rows are softwareRows() of state/collection.ts; what is left here is the markup and the
    // words. The status word is the card's own codeLabel(), so one deposit state reads the same on a
    // project card and in this list.

    import Tag from '$lib/ui/Tag.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { codeLabel } from '$lib/views/shared/card';
    import { softwareRows, type Project } from '$lib/state/collection';
    import { t } from '$lib/state/text';
    import { useState } from '$lib/state/use';

    const {
        layout: { openView }
    } = useState();

    type Props = {
        projects: Project[];
    };

    let { projects }: Props = $props();

    const rows = $derived(softwareRows(projects));
</script>

<div class="software" data-software="1">
    <span class="label">{t('collection.software')}</span>
    {#if rows.length === 0}
        <span class="none">{t('collection.software_none')}</span>
    {/if}
    {#each rows as row (row.id)}
        <div class="row" data-software-row={row.id}>
            <ToolButton
                label={row.label}
                title={row.label}
                onclick={() => openView('project', { id: row.id, label: row.label })}
            />
            <Tag label={codeLabel(row.code, t)} glyph={t('collection.software_glyph')} />
            {#if row.papers.length > 0}
                <span class="papers">
                    <span class="kind">{t('collection.software_papers')}</span>
                    {#each row.papers as paper (paper.id)}
                        <ToolButton
                            label={paper.label}
                            title={paper.label}
                            onclick={() =>
                                openView('project', { id: paper.id, label: paper.label })}
                        />
                    {/each}
                </span>
            {/if}
        </div>
    {/each}
</div>

<style>
    .software,
    .row,
    .papers {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
    }

    .software {
        margin-bottom: 10px;
    }

    .row {
        flex-basis: 100%;
        min-width: 0;
    }

    .label {
        font-size: var(--fs-xxs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    .kind {
        font-size: var(--fs-xxs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted-txt, var(--muted));
    }

    .none {
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }
</style>
