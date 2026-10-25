<script lang="ts">
    // Layer 3, shared view. The blocks of manifest fields and related documents the project page's
    // card draws under its closed card, in two columns: on the left STATUS, LATEST, NEXT (the whole
    // next action), RESULTS, OUTCOME and IDEAS / AVENUES; on the right REPRODUCED, DISSEMINATED IN,
    // FILES, then whatever the card puts after them (its subtasks and follow-up blocks). A pane too
    // narrow for two columns of readable width sets the right column under the left. Every prose
    // field is drawn through CodeText, so a backticked word is code and a web address in the other
    // words is a link.

    import type { Snippet } from 'svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import CodeText from '$lib/ui/display/text/CodeText.svelte';
    import type { BoardItem } from '$lib/state/boards/board';
    import { t } from '$lib/state/shared/words/text';
    import { goto } from '../card';
    import CardDocs from '../CardDocs.svelte';
    import { useState } from '$lib/state/client/use';

    const client = useState();

    const {
        selectors: { disseminatedFor }
    } = client;

    type Props = {
        /** The joined board item whose details are shown. */
        item: BoardItem;
        /** Show a refused or failed open in the owning board. */
        onsaid: (said: string) => void;
        /** Whether the project's documents are listed; a view that draws them itself says no. */
        documents: boolean;
        /** What the right column holds after FILES. */
        children?: Snippet;
    };
    let { item, onsaid, documents, children }: Props = $props();
    const shows = $derived(disseminatedFor(item.id));
</script>

{#snippet field(name: string, value: string)}
    <div class="field">
        <span class="label">{name}</span>
        <p class="value"><CodeText text={value} linked /></p>
    </div>
{/snippet}

{#snippet listField(name: string, values: string[])}
    <div class="field">
        <span class="label">{name}</span>
        <ul class="value">
            {#each values as value, at (`${at}:${value}`)}
                <li><CodeText text={value} linked /></li>
            {/each}
        </ul>
    </div>
{/snippet}

<div class="more">
    <div class="column">
        {#if item.project.statusLine}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render field(t('project.card.status'), item.project.statusLine)}
        {/if}
        {#if item.project.latest}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render field(t('project.card.latest'), item.project.latest)}
        {/if}
        {#if item.project.next}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render field(t('project.card.next'), item.project.next)}
        {/if}
        {#if item.project.results.length > 0}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render listField(t('project.card.results'), item.project.results)}
        {/if}
        {#if item.project.outcome}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render field(t('project.card.outcome'), item.project.outcome)}
        {/if}
        {#if item.project.ideas.length > 0}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render listField(t('project.card.ideas'), item.project.ideas)}
        {/if}
    </div>
    <div class="column">
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
                        <span class="crosslink">
                            <ToolButton
                                plain
                                label={entry.title}
                                title={t('project.card.open_in', entry.collection)}
                                onclick={() => goto(client, entry.collection, entry.title)}
                            >
                                <Tag label={entry.title} />
                            </ToolButton>
                        </span>
                    {/each}
                </div>
            </div>
        {/if}
        <CardDocs {item} {onsaid} {documents} />
        {#if children !== undefined}
            {@render children()}
        {/if}
    </div>
</div>

<style>
    /* Two columns while each can be at least 320 px wide, one under the other in a narrower pane;
       the left column comes first in the page, so it stays on top when they stack. */
    .more {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(320px, 100%), 1fr));
        column-gap: 20px;
        align-items: start;
        margin-top: 10px;
        padding-top: 8px;
        border-top: 1px solid var(--line);
    }

    .column {
        min-width: 0;
    }

    .field {
        margin-top: 6px;
    }

    .field .value {
        margin: 2px 0 0;
        font-size: var(--fs-md);
    }

    .label {
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--accent-txt, var(--accent));
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

    /* The box a cross-link's plain button sits in, which draws its look: no frame until the
       pointer is over it, then the chip surface. */
    .crosslink {
        display: inline-flex;
        align-items: center;
        min-width: 0;
        max-width: 100%;
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
        text-align: left;
    }

    .crosslink:hover {
        background: var(--chip);
    }
</style>
