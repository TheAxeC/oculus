<script lang="ts">
    // Layer 3, focus view partial. Command-center groups and their actions live here because visual
    // grouping changes independently of ticker calculation and writes.

    import Glyph from '$lib/ui/Glyph.svelte';
    import Ticker from '$lib/ui/Ticker.svelte';
    import type { TickerRow } from '$lib/ui/ticker-rows';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import type { Ticker as FocusTicker } from '$lib/state/ticker';
    import { t } from '$lib/state/text';
    import { useState } from '$lib/state/use';

    const {
        layout: { openView },
        hpc: { pillText }
    } = useState();

    type RowGroup = { kind: string; rows: TickerRow[] };
    type ViewRows = {
        overdue: TickerRow[];
        categories: { category: string; rows: TickerRow[] }[];
        subtaskDated: RowGroup[];
        followups: TickerRow[];
        snoozed: TickerRow[];
    };
    type Props = {
        week: FocusTicker | null;
        view: ViewRows;
        attentionRows: TickerRow[];
        refreshRows: TickerRow[];
        onproject: (id: string) => void;
        onpick: (id: string) => void;
        onaction: (id: string, action: string) => void | Promise<void>;
        onattention: (id: string) => void;
        onrefresh: (id: string) => void;
    };

    let {
        week,
        view,
        attentionRows,
        refreshRows,
        onproject,
        onpick,
        onaction,
        onattention,
        onrefresh
    }: Props = $props();

    /** Whether the command center has at least one row or behind-project group to show. */
    const anything = $derived(
        view.overdue.length +
            view.categories.length +
            view.subtaskDated.length +
            view.followups.length +
            view.snoozed.length +
            attentionRows.length +
            (week?.behind === null || week?.behind === undefined ? 0 : 1) +
            refreshRows.length >
            0
    );

    /** The singular or plural manifest noun for the behind-project line. */
    function manifestWord(count: number): string {
        return count === 1 ? t('focus.command.manifest') : t('focus.command.manifests');
    }

    /** A deadline category's heading from the text catalog. */
    function categoryLabel(category: string): string {
        if (category === 'paper') return t('focus.command.dlcat_paper');
        if (category === 'funding') return t('focus.command.dlcat_funding');
        if (category === 'event') return t('focus.command.dlcat_event_label');
        if (category === 'teaching') return t('focus.command.dlcat_teaching');
        if (category === 'position') return t('focus.command.dlcat_position');
        if (category === 'collab') return t('focus.command.dlcat_collab');
        if (category === 'task') return t('focus.command.dlcat_task');
        return t('focus.command.dlcat_conference');
    }
</script>

{#snippet group(label: string, glyph: string, rows: TickerRow[])}
    {#if rows.length > 0}
        <div class="grp">
            <p class="lbl"><Glyph name={glyph} />{label}</p>
            <Ticker {rows} {onpick} {onaction} />
        </div>
    {/if}
{/snippet}

{#snippet kindGroups(label: string, glyph: string, groups: RowGroup[])}
    {#if groups.length > 0}
        <div class="grp">
            <p class="lbl"><Glyph name={glyph} />{label}</p>
            {#each groups as one (one.kind)}
                <p class="sub">{one.kind === '' ? t('focus.command.kind_other') : one.kind}</p>
                <Ticker rows={one.rows} {onpick} {onaction} />
            {/each}
        </div>
    {/if}
{/snippet}

{#if anything}
    <section class="week">
        <div class="head">
            <b
                ><Glyph name={t('focus.command.command_center_glyph')} />{t(
                    'focus.command.command_center'
                )}</b
            >
            {#if pillText()}
                <span class="pill"
                    ><ToolButton label={pillText()} onclick={() => openView('hpc', 'main')} /></span
                >
            {/if}
        </div>
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render group(
            t('focus.command.grp_overdue_label'),
            t('focus.command.grp_overdue_glyph'),
            view.overdue
        )}
        {#if attentionRows.length > 0 || week?.behind}
            <div class="grp">
                <p class="lbl">
                    <Glyph name={t('focus.command.grp_attention_glyph')} />{t(
                        'focus.command.grp_attention_label'
                    )}
                </p>
                {#if attentionRows.length > 0}
                    <Ticker rows={attentionRows} onpick={onattention} />
                {/if}
                {#if week?.behind}
                    <div class="behind">
                        <Glyph name={t('board.stale_glyph')} />
                        <b>{week.behind.count} {manifestWord(week.behind.count)}</b><span
                            >{t('focus.command.behind_refresh')}</span
                        >
                        {#each week.behind.projects as project (project.id)}
                            <ToolButton
                                label={project.label}
                                title={t('project.card.stale_behind', project.days)}
                                onclick={() => onproject(project.id)}
                            />
                        {/each}
                        {#if week.behind.more > 0}
                            <span>{t('focus.command.more', week.behind.more)}</span>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}
        {#if view.categories.length > 0}
            <div class="grp">
                <p class="lbl">
                    <Glyph name={t('focus.command.grp_deadlines_glyph')} />{t(
                        'focus.command.grp_deadlines_label'
                    )}
                </p>
                {#each view.categories as one (one.category)}
                    <p class="sub">
                        {categoryLabel(one.category)}
                    </p>
                    <Ticker rows={one.rows} {onpick} {onaction} />
                {/each}
            </div>
        {/if}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render kindGroups(
            t('focus.command.grp_subtask_dl_label'),
            t('focus.command.grp_subtask_glyph'),
            view.subtaskDated
        )}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render group(
            t('focus.command.grp_followups_label'),
            t('focus.command.grp_followups_glyph'),
            view.followups
        )}
        {#if refreshRows.length > 0}
            <div class="grp">
                <p class="lbl">
                    <Glyph name={t('focus.command.refresh_glyph')} />{t(
                        'focus.command.grp_refresh_label'
                    )}
                </p>
                <Ticker rows={refreshRows} onpick={onrefresh} />
            </div>
        {/if}
        {#if view.snoozed.length > 0}
            <details class="grp">
                <summary class="lbl"
                    ><Glyph name={t('focus.command.snoozed_glyph')} />{t(
                        'focus.command.snoozed',
                        view.snoozed.length
                    )}</summary
                ><Ticker rows={view.snoozed} {onpick} {onaction} />
            </details>
        {/if}
    </section>
{/if}

<style>
    .week {
        padding: 10px 12px;
        border: 1px solid var(--line);
        border-left: 3px solid var(--c-red);
        border-radius: 8px;
        background: var(--chip);
        columns: 2 22em;
        column-gap: 26px;
    }

    :global(body.wall) .week {
        background: color-mix(in srgb, var(--chip) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }
    .head {
        display: flex;
        column-span: all;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    }
    .head > b {
        display: flex;
        align-items: center;
        gap: 6px;
        flex: 0 0 auto;
        margin-right: auto;
        font-size: var(--fs-sm);
    }
    .pill {
        flex: 0 0 auto;
    }
    .grp {
        margin-top: 9px;
        break-inside: avoid;
    }
    .lbl {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0 0 2px;
        font-size: var(--fs-xs);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--accent-txt, var(--accent));
    }
    summary.lbl {
        cursor: pointer;
    }
    .sub {
        margin: 6px 0 2px;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }
    .behind {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 5px;
        margin-top: 3px;
        font-size: var(--fs-md);
    }
    .behind :global(.tool) {
        border: 0;
        background: none;
        padding: 0;
        color: var(--accent-txt, var(--accent));
    }
</style>
