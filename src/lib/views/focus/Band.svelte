<script lang="ts">
    // Layer 3, view partial of views/Focus.svelte. The band under the lanes: the durable work that
    // is not a project. Three columns, the grants stacked by the stage their status names, the job
    // applications still out for an answer, and this year's teaching.
    //
    // Every card opens its collection tab and sets that tab's transient reveal id, so the exact
    // entry scrolls into view and flashes after the view opens.

    import Chip from '$lib/ui/Chip.svelte';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { daysUntil, firstSentence } from '$lib/state/board';
    import { daysTone } from '$lib/state/ticker';
    import { collectionLanes, type BandItem } from '$lib/state/focus-lanes';
    import { toneOf } from '$lib/state/tones';
    import { configMap } from '$lib/state/selectors.svelte';
    import { portfolio } from '$lib/state/entities.svelte';
    import { openView } from '$lib/state/layout.svelte';
    import { instanceState, setInstanceState } from '$lib/state/ui.svelte';
    import { t } from '$lib/state/text';

    type Props = { now: number };

    let { now }: Props = $props();

    /** How much of a card's note the band shows. */
    const NOTE = 110;

    const config = $derived(configMap());
    const snapshot = $derived(portfolio());
    const cards = $derived(
        snapshot === null
            ? {
                  funding: [],
                  applications: [],
                  education: [],
                  tones: { funding: '', jobs: '', teaching: '' }
              }
            : collectionLanes(snapshot, config)
    );

    const anything = $derived(
        cards.funding.length + cards.applications.length + cards.education.length > 0
    );

    /** A card's countdown, and nothing for one with no date. */
    function remaining(item: BandItem): number | null {
        return daysUntil(item.deadline ?? '', now);
    }

    /** Open the collection and ask it to reveal the exact entry this card names. */
    function reveal(item: BandItem): void {
        const instance = openView(item.entry, 'main');
        const current = instanceState(instance);
        const held =
            typeof current === 'object' && current !== null && !Array.isArray(current)
                ? current
                : {};
        setInstanceState(instance, { ...held, reveal: item.id, search: '' });
    }
</script>

{#snippet entry(item: BandItem, glyph: string)}
    {@const days = remaining(item)}
    <div class="entry">
        <div class="entry-h">
            <span class="entry-name">
                <ToolButton label={item.title} {glyph} onclick={() => reveal(item)} />
            </span>
            {#if days !== null}
                <span class="badge">
                    <Chip
                        label={days < 0 ? t('focus.days_ago', -days) : t('focus.in_days', days)}
                        tone={daysTone(days)}
                        glyph={t('project.card.deadline_glyph')}
                    />
                </span>
            {/if}
        </div>
        {#if item.note !== undefined}
            <p class="note">{firstSentence(item.note, NOTE)}</p>
        {/if}
    </div>
{/snippet}

{#snippet column(label: string, glyph: string, sub: string, tone: string, rows: BandItem[])}
    {#if rows.length > 0}
        <div class="lane" style={`--tone: var(--c-${tone})`}>
            <div class="lane-h">
                <span class="lane-name">{label}</span>
                <span class="count">{rows.length}</span>
            </div>
            <p class="lane-sub">{sub}</p>
            <div class="lane-body">
                {#each rows as item, at (`${at}:${item.title}`)}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render entry(item, glyph)}
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
                <div class="lane" style={`--tone: var(--c-${cards.tones.funding})`}>
                    <div class="lane-h">
                        <span class="lane-name">
                            {t('focus.funding_lane')}
                        </span>
                        <span class="count">
                            {cards.funding.reduce((n, stage) => n + stage.items.length, 0)}
                        </span>
                    </div>
                    <p class="lane-sub">{t('focus.funding_sub')}</p>
                    <div class="lane-body">
                        {#each cards.funding as stage (stage.label)}
                            <div
                                class="stage-block"
                                style={`--stage: var(--c-${toneOf(stage.color)})`}
                            >
                                <p class="stage">{stage.label}</p>
                                {#each stage.items as item, at (`${at}:${item.title}`)}
                                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                                    {@render entry(item, t('focus.funding_glyph'))}
                                {/each}
                            </div>
                        {/each}
                    </div>
                </div>
            {/if}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render column(
                t('focus.jobs_lane'),
                t('focus.jobs_glyph'),
                t('focus.jobs_sub'),
                cards.tones.jobs,
                cards.applications
            )}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render column(
                t('focus.teaching_lane'),
                t('focus.teaching_glyph'),
                t('focus.teaching_sub'),
                cards.tones.teaching,
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
        border-top: 3px solid var(--tone, var(--line));
        border-radius: 8px;
        background: var(--panel);
    }

    :global(body.wall) .lane {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
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
        font-size: var(--fs-md);
        font-weight: 700;
    }

    .count {
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }

    .lane-sub {
        margin: 2px 0 6px;
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }

    .lane-body {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    .stage {
        margin: 0 0 4px;
        font-size: var(--fs-3xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--muted-txt, var(--muted));
    }

    .stage-block {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding-left: 6px;
        border-left: 3px solid var(--stage, var(--line));
    }

    .entry {
        min-width: 0;
        padding: 4px 6px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--chip);
    }

    /* Inside a lane that is already translucent, so the entry keeps its border and paints nothing. */
    :global(body.wall) .entry {
        background: transparent;
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
        font-size: var(--fs-md);
        color: var(--ink-txt, var(--ink));
    }

    .entry-name :global(.tool) {
        border: 0;
        background: none;
        padding: 0;
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-md);
    }

    .badge {
        flex: 0 0 auto;
    }

    .note {
        margin: 2px 0 0;
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }
</style>
