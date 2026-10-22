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
    import FoldHead from './FoldHead.svelte';
    import { categoryLabel, runHeading } from './rows';

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

    /**
     * Whether the Needs attention group shows: it has an attention line, the row of manifests
     * behind their docs or the row of active projects on no lane.
     */
    const needsAttention = $derived(
        attentionRows.length > 0 ||
            (week?.behind ?? null) !== null ||
            (week?.unplaced ?? null) !== null
    );

    /** The singular or plural manifest noun for the behind-project line. */
    function manifestWord(count: number): string {
        return count === 1 ? t('focus.command.manifest') : t('focus.command.manifests');
    }
</script>

{#snippet links(projects: { id: string; label: string; days?: number }[], more: number)}
    {#each projects as project (project.id)}
        <span class="link">
            <ToolButton
                plain
                label={project.label}
                title={project.days === undefined
                    ? undefined
                    : t('project.card.stale_behind', project.days)}
                onclick={() => onproject(project.id)}
            />
        </span>
    {/each}
    {#if more > 0}
        <span class="more">{t('focus.command.more', more)}</span>
    {/if}
{/snippet}

{#snippet marked(text: string)}
    <RootChip record={{ root: text }} />
{/snippet}

{#snippet pill()}
    <ToolButton label={pillText()} glyph="hpc" onclick={() => openView('hpc')} />
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
            {#each groups as one (one.kind)}
                <p class="sub">{runHeading(one)}</p>
                <Ticker rows={one.rows} {onpick} {onaction} reveal kept={view.kept} {marked} />
            {/each}
        </div>
    {/if}
{/snippet}

{#if anything}
    <section class="week" data-surface>
        <FoldHead
            glyph={t('focus.command.command_center_glyph')}
            title={t('focus.command.command_center')}
            name={t('focus.command.command_center')}
            {open}
            {ontoggle}
            end={pillText() === '' ? undefined : pill}
        />
        {#if open}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render group(
                t('focus.command.grp_overdue_label'),
                t('focus.command.grp_overdue_glyph'),
                view.overdue
            )}
            {#if needsAttention}
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
                            <span class="lead"
                                ><Glyph name={t('board.stale_glyph')} />
                                <b>{week.behind.count} {manifestWord(week.behind.count)}</b></span
                            >
                            {t('focus.command.behind_refresh')}
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render links(week.behind.projects, week.behind.more)}
                        </div>
                    {/if}
                    {#if week?.unplaced}
                        <div class="behind">
                            <span class="lead"
                                ><Glyph name={t('focus.command.unplaced_glyph')} />
                                <b>{week.unplaced.count}</b></span
                            >
                            <span>
                                {#if week.unplaced.count === 1}
                                    <!-- eslint-disable-next-line svelte/no-at-html-tags -- a catalog line, which oculus wrote -->
                                    {@html t('focus.command.unplaced_one')}
                                {:else}
                                    <!-- eslint-disable-next-line svelte/no-at-html-tags -- a catalog line, which oculus wrote -->
                                    {@html t('focus.command.unplaced_many')}
                                {/if}
                            </span>
                            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                            {@render links(week.unplaced.projects, week.unplaced.more)}
                        </div>
                    {/if}
                </div>
            {/if}
            {#if view.categories.length > 0}
                <!-- The group may run on into the second column, a category at a time: each
                     category is one block that does not break, and the group's heading is inside
                     the first, so it never stands alone at a column's foot. -->
                <div class="grp split">
                    {#each view.categories as one, at (one.category)}
                        <div class="category">
                            {#if at === 0}
                                <p class="lbl">
                                    <Glyph name={t('focus.command.grp_deadlines_glyph')} />{t(
                                        'focus.command.grp_deadlines_label'
                                    )}
                                </p>
                            {/if}
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
                        </div>
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

    /* Over a wallpaper the section is the one translucent layer under its rows, so it carries
       `data-surface`; drawn inside a surface already (a free float's fill) it paints nothing. */
    :global(body.wall) .week {
        background: var(--chip-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.wall [data-surface]) .week {
        background: transparent;
        backdrop-filter: none;
    }
    .grp {
        margin-top: 4px;
        break-inside: avoid;
    }
    .grp.split {
        break-inside: auto;
    }
    .category {
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
    /* A needs-attention line is one sentence that wraps as text: the glyph and the count at its
       start, kept on one line together, the projects at its end, each piece kept in its place on a
       narrow pane. It is a row of the Command Center, so it takes a ticker row's height, size and
       line (`Ticker.svelte`), and the project links inherit them. */
    .behind {
        min-height: calc(18px * var(--text-scale, 1));
        font-size: var(--fs-xs);
        line-height: calc(14px * var(--text-scale, 1));
    }
    .lead {
        white-space: nowrap;
    }
    .behind > .link,
    .behind > .more {
        margin-left: 5px;
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
