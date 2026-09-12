<script lang="ts">
    // Layer 3, view partial of views/Focus.svelte. The band under the lanes: the durable work that
    // is not a project. Three columns, the grants stacked by the stage their status names, the job
    // applications still out for an answer, and this year's teaching.
    //
    // A card opens its collection's own tab. A grant has none: the schemes are a registry entity,
    // so no collection view is registered over funding/funding.yml until O24, and a grant card is
    // read rather than clicked.

    import Chip from '$lib/ui/Chip.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import { firstSentence } from '$lib/state/board';
    import { band, daysTone, type BandItem } from '$lib/state/focus';
    import { configMap } from '$lib/state/selectors.svelte';
    import { portfolio } from '$lib/state/entities.svelte';
    import { openView } from '$lib/state/layout.svelte';
    import { t } from '$lib/state/text';

    type Props = { now: number };

    let { now }: Props = $props();

    /** How much of a card's note the band shows. */
    const NOTE = 110;

    const config = $derived(configMap());
    const snapshot = $derived(portfolio());
    const cards = $derived(
        snapshot === null
            ? { funding: [], applications: [], education: [] }
            : band(snapshot, config, now)
    );

    const anything = $derived(
        cards.funding.length + cards.applications.length + cards.education.length > 0
    );

    /** A card's countdown, and nothing for one with no date. */
    function tail(item: BandItem): string {
        if (item.days === null) return '';
        return item.days < 0 ? t('focus.days_ago', -item.days) : t('focus.in_days', item.days);
    }
</script>

{#snippet entry(item: BandItem)}
    {@const date = tail(item)}
    <div class="entry">
        <div class="entry-h">
            {#if item.entry === undefined}
                <span class="entry-name">{item.title}</span>
            {:else}
                {@const key = item.entry}
                <button type="button" class="entry-name link" onclick={() => openView(key, 'main')}>
                    {item.title}
                </button>
            {/if}
            {#if date !== ''}
                <span class="badge">
                    <Chip
                        label={date}
                        tone={daysTone(item.days)}
                        glyph={t('cards.deadline_glyph')}
                    />
                </span>
            {/if}
        </div>
        {#if item.note !== undefined}
            <p class="note">{firstSentence(item.note, NOTE)}</p>
        {/if}
    </div>
{/snippet}

{#snippet column(label: string, glyph: string, sub: string, rows: BandItem[])}
    {#if rows.length > 0}
        <div class="lane">
            <div class="lane-h">
                <span class="lane-name"><Glyph name={glyph} />{label}</span>
                <span class="count">{rows.length}</span>
            </div>
            <p class="lane-sub">{sub}</p>
            <div class="lane-body">
                {#each rows as item, at (`${at}:${item.title}`)}
                    {@render entry(item)}
                {/each}
            </div>
        </div>
    {/if}
{/snippet}

{#if anything}
    <details class="cluster" open>
        <summary>{t('focus.cards_group')}</summary>
        <div class="lanes">
            {#if cards.funding.length > 0}
                <div class="lane">
                    <div class="lane-h">
                        <span class="lane-name">
                            <Glyph name={t('focus.funding_glyph')} />{t('focus.funding_label')}
                        </span>
                        <span class="count">
                            {cards.funding.reduce((n, stage) => n + stage.items.length, 0)}
                        </span>
                    </div>
                    <p class="lane-sub">{t('focus.funding_sub')}</p>
                    <div class="lane-body">
                        {#each cards.funding as stage (stage.label)}
                            <p class="stage" style={`--tone: var(--c-${stage.tone}-txt)`}>
                                {stage.label}
                            </p>
                            {#each stage.items as item, at (`${at}:${item.title}`)}
                                {@render entry(item)}
                            {/each}
                        {/each}
                    </div>
                </div>
            {/if}
            {@render column(
                t('focus.jobs_label'),
                t('focus.jobs_glyph'),
                t('focus.jobs_sub'),
                cards.applications
            )}
            {@render column(
                t('focus.teaching_label'),
                t('focus.teaching_glyph'),
                t('focus.teaching_sub'),
                cards.education
            )}
        </div>
    </details>
{/if}

<style>
    summary {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--accent-txt, var(--accent));
        cursor: pointer;
    }

    .lanes {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-top: 8px;
    }

    @media (max-width: 900px) {
        .lanes {
            grid-template-columns: 1fr;
        }
    }

    .lane {
        display: flex;
        flex-direction: column;
        min-width: 0;
        padding: 8px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
    }

    .lane-h {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 6px;
    }

    .lane-name {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: var(--fs-sm);
        font-weight: 700;
    }

    .count {
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }

    .lane-sub {
        margin: 2px 0 6px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .lane-body {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    .stage {
        margin: 6px 0 0;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--tone, var(--muted));
    }

    .entry {
        min-width: 0;
        padding: 4px 6px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--chip);
    }

    .entry-h {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 6px;
    }

    .entry-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--fs-sm);
        color: var(--ink-txt, var(--ink));
    }

    button.link {
        padding: 0;
        border: 0;
        background: none;
        font: inherit;
        font-size: var(--fs-sm);
        text-align: left;
        cursor: pointer;
    }

    button.link:hover,
    button.link:focus-visible {
        color: var(--accent-txt, var(--accent));
        text-decoration: underline;
    }

    .badge {
        flex: 0 0 auto;
    }

    .note {
        margin: 2px 0 0;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }
</style>
