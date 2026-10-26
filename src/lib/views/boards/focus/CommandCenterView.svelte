<script lang="ts">
    // Layer 3, focus view partial. Command-center groups and their actions live here because visual
    // grouping changes independently of ticker calculation and writes. The groups and the box they
    // stand in, with its red left edge, are drawn by ui/display/ticker/TickerGroup.svelte, which
    // the career banner draws with too, so their look is written there once; this file keeps the
    // look of its own content, the Needs attention group's lines of projects behind their documents
    // and of projects no lane shows. The heading row ends with how many rows the Focus filter
    // hides, when it hides any, and the live HPC pill.

    import Glyph from '$lib/ui/display/Glyph.svelte';
    import TickerGroup, { box } from '$lib/ui/display/ticker/TickerGroup.svelte';
    import type { TickerRow } from '$lib/ui/display/ticker/ticker-rows';
    import RootChip from '$lib/views/shared/card/RootChip.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import { hasCommandRows, type Ticker as FocusTicker } from '$lib/state/boards/ticker';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import FoldHead from '../../shared/card/heads/FoldHead.svelte';
    import { runHeading } from './rows';

    const {
        layout: { openView },
        hpc: { pillText }
    } = useState();

    type RowGroup = { kind: string; rows: TickerRow[] };
    type ViewRows = {
        overdue: TickerRow[];
        /** Each deadline category's rows, under the heading its word names. */
        categories: { category: string; label: string; rows: TickerRow[] }[];
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
        /** How many rows the Focus filter hides, said on the heading row when any. */
        hidden: number;
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
        hidden,
        attentionRows,
        refreshRows,
        onproject,
        onpick,
        onaction,
        onattention,
        onrefresh
    }: Props = $props();

    /**
     * Whether the command center has at least one row or behind-project group to show, or rows the
     * Focus filter hides, which its heading row then says.
     */
    const anything = $derived(
        hidden > 0 ||
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
     * behind their docs or the row of the projects no lane shows.
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

{#snippet end()}
    {#if hidden > 0}
        <span class="hidden">{t('focus.hidden', hidden)}</span>
    {/if}
    {#if pillText() !== ''}
        <ToolButton label={pillText()} glyph="hpc" onclick={() => openView('hpc')} />
    {/if}
{/snippet}

{#snippet group(label: string, glyph: string, rows: TickerRow[])}
    {#if rows.length > 0}
        <TickerGroup
            {label}
            {glyph}
            runs={[{ key: label, rows }]}
            {onpick}
            {onaction}
            reveal
            kept={view.kept}
            {marked}
        />
    {/if}
{/snippet}

{#snippet kindGroups(label: string, glyph: string, groups: RowGroup[])}
    {#if groups.length > 0}
        <TickerGroup
            {label}
            {glyph}
            runs={groups.map((one) => ({ key: one.kind, note: runHeading(one), rows: one.rows }))}
            {onpick}
            {onaction}
            reveal
            kept={view.kept}
            {marked}
        />
    {/if}
{/snippet}

{#snippet behind()}
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
{/snippet}

{#snippet content()}
    <FoldHead
        glyph={t('focus.command.command_center_glyph')}
        title={t('focus.command.command_center')}
        name={t('focus.command.command_center')}
        {open}
        {ontoggle}
        end={pillText() === '' && hidden === 0 ? undefined : end}
    />
    {#if open}
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render group(
            t('focus.command.grp_overdue_label'),
            t('focus.command.grp_overdue_glyph'),
            view.overdue
        )}
        {#if needsAttention}
            <TickerGroup
                label={t('focus.command.grp_attention_label')}
                glyph={t('focus.command.grp_attention_glyph')}
                runs={attentionRows.length > 0 ? [{ key: 'attention', rows: attentionRows }] : []}
                onpick={onattention}
                after={behind}
            />
        {/if}
        {#if view.categories.length > 0}
            <!-- The group may run on into the second column, a category at a time. -->
            <TickerGroup
                label={t('focus.command.grp_deadlines_label')}
                glyph={t('focus.command.grp_deadlines_glyph')}
                runs={view.categories.map((one) => ({
                    key: one.category,
                    note: one.label,
                    rows: one.rows
                }))}
                split
                {onpick}
                {onaction}
                reveal
                kept={view.kept}
                {marked}
            />
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
            <TickerGroup
                label={t('focus.command.grp_refresh_label')}
                glyph={t('focus.command.refresh_glyph')}
                runs={[{ key: 'refresh', rows: refreshRows }]}
                onpick={onrefresh}
            />
        {/if}
        {#if view.snoozed.length > 0}
            <TickerGroup
                label={t('focus.command.snoozed', view.snoozed.length)}
                glyph={t('focus.command.snoozed_glyph')}
                runs={[{ key: 'snoozed', rows: view.snoozed }]}
                folded
                {onpick}
                {onaction}
                reveal
                kept={view.kept}
                {marked}
            />
        {/if}
    {/if}
{/snippet}

{#if anything}
    <!-- eslint-disable-next-line @typescript-eslint/no-unsafe-call -- svelte-check types the snippet TickerGroup.svelte's module script exports; the lint's parser does not read it -->
    {@render box('red', content)}
{/if}

<style>
    /* A needs-attention line is one sentence that wraps as text: the glyph and the count at its
       start, kept on one line together, the projects at its end, each piece kept in its place on a
       narrow pane. It is a row of the Command Center, so it takes a ticker row's height, size and
       line (`Ticker.svelte`), and the project links inherit them. */
    /* How many rows the Focus filter hides, at the end of the heading row in the heading's small
       muted words. */
    .hidden {
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }

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
