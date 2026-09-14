<script lang="ts">
    // Layer 3, shared view. Expanded manifest fields and related documents live here because the
    // expanded card section changes independently of its collapsed frame.

    import Chip from '$lib/ui/Chip.svelte';
    import type { BoardItem } from '$lib/state/board';
    import { disseminatedFor } from '$lib/state/selectors.svelte';
    import { t } from '$lib/state/text';
    import { goto } from './card';
    import CardDocs from './CardDocs.svelte';
    import Subtasks from './Subtasks.svelte';

    type Props = {
        /** The joined board item whose details are shown. */
        item: BoardItem;
        /** Show subtask write outcomes in the owning board. */
        onsaid: (said: string) => void;
    };
    let { item, onsaid }: Props = $props();
    const shows = $derived(disseminatedFor(item.id));
</script>

{#snippet field(name: string, value: string)}
    <div class="field">
        <span class="label">{name}</span>
        <p class="value">{value}</p>
    </div>
{/snippet}

{#snippet listField(name: string, values: string[])}
    <div class="field">
        <span class="label">{name}</span>
        <ul class="value">
            {#each values as value, at (`${at}:${value}`)}
                <li>{value}</li>
            {/each}
        </ul>
    </div>
{/snippet}

<div class="more">
    {#if item.project.statusLine}
        <p class="statusline">{item.project.statusLine}</p>
    {/if}
    {#if item.project.latest}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render field(t('project.card.latest'), item.project.latest)}
    {/if}
    {#if item.project.results.length > 0}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render listField(t('project.card.results'), item.project.results)}
    {/if}
    {#if item.project.outcome}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render field(t('project.card.outcome'), item.project.outcome)}
    {/if}
    {#if item.project.next}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render field(t('project.card.next'), item.project.next)}
    {/if}
    {#if item.project.ideas.length > 0}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render listField(t('project.card.ideas'), item.project.ideas)}
    {/if}
    {#if item.project.reproduced}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render field(
            t('project.card.reproduced'),
            [item.project.reproduced.date, item.project.reproduced.note]
                .filter((part) => part !== undefined && part !== '')
                .join(' | ')
        )}
    {/if}
    {#if shows.length > 0}
        <div class="field">
            <span class="label">{t('project.card.disseminated_in')}</span>
            <div class="tags">
                {#each shows as entry (`${entry.collection}:${entry.id}`)}
                    <button
                        type="button"
                        class="tag"
                        title={t('project.card.open_in', entry.collection)}
                        onclick={() => goto(entry.collection, entry.title)}
                    >
                        <Chip label={entry.title} />
                    </button>
                {/each}
            </div>
        </div>
    {/if}
    <CardDocs {item} />
    <Subtasks target={{ id: item.id }} subtasks={item.project.subtasks} {onsaid} />
</div>

<style>
    .more {
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px solid var(--line);
    }

    .field {
        margin-top: 6px;
    }

    .field .value {
        margin: 2px 0 0;
        font-size: var(--fs-md);
    }

    .label {
        font-size: var(--fs-xxs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
    }

    .statusline {
        margin: 0 0 6px;
        font-size: var(--fs-sm);
    }

    ul.value {
        padding-left: 18px;
    }

    .tags {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
    }

    .tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-width: 0;
        max-width: 100%;
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
        background: none;
        color: inherit;
        font: inherit;
        padding: 0;
        cursor: pointer;
        text-align: left;
    }

    .tag:hover {
        background: var(--chip);
    }
</style>
