<script lang="ts">
    // Layer 3, view partial of views/boards/focus/Focus.svelte. The band above the lanes: the
    // durable work that is not a project. Three columns, the grants stacked by the stage their
    // status names, the job applications still out for an answer, and this year's teaching.
    //
    // Every card opens its collection tab and sets that tab's transient reveal id, so the exact
    // entry scrolls into view and flashes after the view opens. A card of an entry of a hub but the
    // primary carries the hub's chip after its title, as the Command center's rows do. A web
    // address written in a card's note is a link (ui/display/text/LinkedText.svelte).

    import LaneHead from './lanes/LaneHead.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import LinkedText from '$lib/ui/display/text/LinkedText.svelte';
    import Tag from '$lib/ui/controls/Tag.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import RootChip from '$lib/views/shared/card/RootChip.svelte';
    import { daysUntil, firstSentence } from '$lib/state/boards/board';
    import {
        bandHasCards,
        collectionLanes,
        stageItemCount,
        type BandItem
    } from '$lib/state/boards/focus-lanes';
    import { daysTone } from '$lib/state/boards/ticker';
    import { namedTone, toneOf, vocabOf } from '$lib/state/shared/words/tones';
    import { t } from '$lib/state/shared/words/text';
    import { instanceMap, recordField } from '$lib/state/workbench/layout';
    import { useState } from '$lib/state/client/use';

    const {
        selectors: { configMap },
        entities: { portfolio },
        layout: { openView },
        ui: { instanceState, setInstanceState }
    } = useState();

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
            : collectionLanes(snapshot, config, vocabOf)
    );

    /**
     * The three columns' hues as the palette holds them: a tone `focus_lane_tones` names that no
     * stylesheet defines, or none at all, is drawn in the unknown tone, so neither the column nor
     * its header resolves to no colour.
     */
    const tones = $derived({
        funding: namedTone(cards.tones.funding),
        jobs: namedTone(cards.tones.jobs),
        teaching: namedTone(cards.tones.teaching)
    });

    const anything = $derived(bandHasCards(cards));

    /** A card's countdown, and nothing for one with no date. */
    function remaining(item: BandItem): number | null {
        return daysUntil(item.deadline ?? '', now);
    }

    /** Open the collection and ask it to reveal the exact entry this card names. */
    function reveal(item: BandItem): void {
        const instance = openView(item.entry);
        setInstanceState(instance, {
            ...instanceMap(instanceState(instance)),
            reveal: recordField(item.id),
            search: ''
        });
    }
</script>

{#snippet entry(item: BandItem, glyph: string)}
    {@const days = remaining(item)}
    <div class="entry">
        <div class="entry-h">
            <span class="entry-name">
                <ToolButton plain cut label={item.title} {glyph} onclick={() => reveal(item)} />
            </span>
            <RootChip record={item} />
            {#if days !== null}
                <span class="badge">
                    <Tag
                        label={days < 0 ? t('focus.days_ago', -days) : t('focus.in_days', days)}
                        glyph={t('project.card.deadline_glyph')}
                        tone={daysTone(days)}
                    />
                </span>
            {/if}
        </div>
        {#if item.note !== undefined}
            <p class="note"><LinkedText text={firstSentence(item.note, NOTE)} /></p>
        {/if}
    </div>
{/snippet}

{#snippet column(label: string, glyph: string, sub: string, tone: string, rows: BandItem[])}
    {#if rows.length > 0}
        <div class="lane" style={`--tone: var(--c-${tone})`} data-surface>
            <LaneHead {label} {glyph} count={rows.length} {tone} />
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
        <summary>
            <Surface inline>{t('focus.cards_group')}</Surface>
        </summary>
        <div class="lanes">
            {#if cards.funding.length > 0}
                <div class="lane" style={`--tone: var(--c-${tones.funding})`} data-surface>
                    <LaneHead
                        label={t('focus.funding_lane')}
                        glyph={t('focus.funding_glyph')}
                        count={stageItemCount(cards.funding)}
                        tone={tones.funding}
                    />
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
                tones.jobs,
                cards.applications
            )}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render column(
                t('focus.teaching_lane'),
                t('focus.teaching_glyph'),
                t('focus.teaching_sub'),
                tones.teaching,
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

    /* The columns fill the pane's width in as many as it holds, and one in a pane narrower than a
       column. */
    .lanes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(290px, 100%), 1fr));
        gap: 8px;
        margin-top: 4px;
    }

    .lane {
        display: flex;
        flex-direction: column;
        min-width: 0;
        padding: 4px 8px;
        border: 1px solid var(--line);
        border-top: 3px solid var(--tone, var(--line));
        border-radius: var(--input-radius);
        background: var(--panel);
    }

    /* Over a wallpaper a column is the one translucent layer under its entries, so it carries
       `data-surface`; drawn inside a surface already (a free float's fill) it paints nothing. */
    :global(body.wall) .lane {
        background: var(--panel-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.wall [data-surface]) .lane {
        background: transparent;
        backdrop-filter: none;
    }

    .lane-sub {
        margin: 2px 0 4px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .lane-body {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .stage {
        margin: 0 0 2px;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--muted-txt, var(--muted));
    }

    .stage-block {
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding-left: 6px;
        border-left: 3px solid var(--stage, var(--line));
    }

    .entry {
        min-width: 0;
        padding: 0 6px;
        border: 1px solid var(--line);
        border-radius: var(--input-radius);
        background: var(--chip);
    }

    /* Inside a lane that is already translucent, so the entry keeps its border and paints
       nothing. */
    :global(body.wall) .entry {
        background: transparent;
    }

    /* The first line of an entry is one row of the tree's height. */
    /* The name, then the hub's chip beside it, then the deadline at the right end. */
    .entry-h {
        display: flex;
        align-items: center;
        gap: 6px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    /* The entry's name is a plain button: the words of the row, with the focus ring the button
       draws and an underline under the pointer. */
    .entry-name {
        display: flex;
        min-width: 0;
        font-size: var(--fs-md);
        font-weight: 600;
        color: var(--ink-txt, var(--ink));
    }

    .entry-name:hover,
    .entry-name:focus-within {
        color: var(--accent-txt, var(--accent));
        text-decoration: underline;
    }

    .badge {
        flex: 0 0 auto;
        margin-left: auto;
    }

    .note {
        margin: 0;
        font-size: var(--fs-sm);
        line-height: calc(18px * var(--text-scale, 1));
        color: var(--muted-txt, var(--muted));
        overflow-wrap: anywhere;
    }
</style>
