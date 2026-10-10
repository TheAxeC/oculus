<script lang="ts">
    // Layer 3, focus view partial. Command-center groups and their actions live here because visual
    // grouping changes independently of ticker calculation and writes.

    import Glyph from '$lib/ui/display/Glyph.svelte';
    import Ticker from '$lib/ui/display/ticker/Ticker.svelte';
    import type { TickerRow } from '$lib/ui/display/ticker/ticker-rows';
    import RootChip from '$lib/views/shared/card/RootChip.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { hasCommandRows, type Ticker as FocusTicker } from '$lib/state/boards/ticker';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import { categoryLabel, runHeading } from './rows';

    const {
        layout: { openView },
        hpc: { pillText }
    } = useState();

    type RowGroup = { kind: string; side: boolean; rows: TickerRow[] };
    type ViewRows = {
        overdue: TickerRow[];
        categories: { category: string; rows: TickerRow[] }[];
        subtaskDated: RowGroup[];
        followups: TickerRow[];
        snoozed: TickerRow[];
        /** The button each row keeps drawn while its others wait for the pointer. */
        kept: (row: TickerRow) => string | undefined;
    };
    type Props = {
        week: FocusTicker | null;
        view: ViewRows;
        /** Whether the section is open, and the control on its heading that folds it. */
        open: boolean;
        ontoggle: () => void;
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
        open,
        ontoggle,
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
        hasCommandRows(
            {
                overdue: view.overdue,
                categories: view.categories,
                subtaskDated: view.subtaskDated,
                followups: view.followups,
                snoozed: view.snoozed,
                attention: attentionRows,
                refresh: refreshRows
            },
            week
        )
    );

    /** The singular or plural manifest noun for the behind-project line. */
    function manifestWord(count: number): string {
        return count === 1 ? t('focus.command.manifest') : t('focus.command.manifests');
    }
</script>

{#snippet marked(text: string)}
    <RootChip record={{ root: text }} />
{/snippet}

{#snippet group(label: string, glyph: string, rows: TickerRow[])}
    {#if rows.length > 0}
        <div class="grp">
            <p class="lbl"><Glyph name={glyph} />{label}</p>
            <Ticker {rows} {onpick} {onaction} reveal kept={view.kept} {marked} />
        </div>
    {/if}
{/snippet}

{#snippet kindGroups(label: string, glyph: string, groups: RowGroup[])}
    {#if groups.length > 0}
        <div class="grp">
            <p class="lbl"><Glyph name={glyph} />{label}</p>
            {#each groups as one (`${one.side}:${one.kind}`)}
                <p class="sub">{runHeading(one)}</p>
                <Ticker rows={one.rows} {onpick} {onaction} reveal kept={view.kept} {marked} />
            {/each}
        </div>
    {/if}
{/snippet}

{#if anything}
    <section class="week">
        <div class="head">
            <ToolButton
                bare
                label={open
                    ? t('focus.fold', t('focus.command.command_center'))
                    : t('focus.unfold', t('focus.command.command_center'))}
                glyph={open ? t('project.card.collapse_glyph') : t('project.card.expand_glyph')}
                expanded={open}
                onclick={ontoggle}
            />
            <b
                ><Glyph name={t('focus.command.command_center_glyph')} />{t(
                    'focus.command.command_center'
                )}</b
            >
            {#if pillText()}
                <span class="pill"
                    ><ToolButton
                        label={pillText()}
                        glyph="hpc"
                        onclick={() => openView('hpc')}
                    /></span
                >
            {/if}
        </div>
        {#if open}
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
                                <span class="link">
                                    <ToolButton
                                        plain
                                        label={project.label}
                                        title={t('project.card.stale_behind', project.days)}
                                        onclick={() => onproject(project.id)}
                                    />
                                </span>
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
                        <Ticker
                            rows={one.rows}
                            {onpick}
                            {onaction}
                            reveal
                            kept={view.kept}
                            {marked}
                        />
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
                    ><Ticker
                        rows={view.snoozed}
                        {onpick}
                        {onaction}
                        reveal
                        kept={view.kept}
                        {marked}
                    />
                </details>
            {/if}
        {/if}
    </section>
{/if}

<style>
    .week {
        padding: 4px 8px;
        border: 1px solid var(--line);
        border-left: 3px solid var(--c-red);
        border-radius: var(--input-radius);
        background: var(--chip);
        columns: 2 22em;
        column-gap: 16px;
    }

    :global(body.wall) .week {
        background: var(--chip-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }
    .head {
        display: flex;
        column-span: all;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
    }
    .head > b {
        display: flex;
        align-items: center;
        gap: 6px;
        flex: 0 0 auto;
        margin-right: auto;
        font-size: var(--fs-md);
        font-weight: 600;
    }
    .pill {
        flex: 0 0 auto;
    }
    .grp {
        margin-top: 4px;
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
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }
    .behind {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 5px;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
        font-size: var(--fs-md);
    }

    /* A project behind its documents opens from its name, drawn as a link: the accent colour, an
       underline under the pointer and with the focus. */
    .link {
        color: var(--accent-txt, var(--accent));
    }
    .link:hover,
    .link:focus-within {
        text-decoration: underline;
    }
</style>
