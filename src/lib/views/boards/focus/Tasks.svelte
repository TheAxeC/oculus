<script lang="ts">
    // Layer 3, view partial of views/boards/focus/Focus.svelte. The tasks section: the open work
    // that carries no date, in the same two columns as the command center above it and with the
    // same buttons.
    //
    // It counts nothing. The lines are state/boards/ticker.ts's `tasks` list, already in the order
    // the three groups are drawn in; the rows, their buttons and what a button writes are
    // views/boards/focus/rows.ts, which the command center draws its own rows with. A group with no
    // line draws nothing, and a section with no group at all draws nothing either.

    import RootChip from '$lib/views/shared/card/RootChip.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Ticker from '$lib/ui/display/ticker/Ticker.svelte';
    import type { TickerRow } from '$lib/ui/display/ticker/ticker-rows';
    import { hasTasks, taskGroups, type TickerItem } from '$lib/state/boards/ticker';
    import { t } from '$lib/state/shared/words/text';
    import { act, fileBlock, openLine, rowMaker, type SectionProps } from './rows';
    import { useState } from '$lib/state/client/use';

    const client = useState();

    let { week, now, open, ontoggle, onproject, onsaid }: SectionProps = $props();

    /** The lines of each group, which state/boards/ticker.ts sorts into them. */
    const lines = $derived(taskGroups(week?.tasks ?? []));

    /** The three groups of rows, and the line each row came from, by the row's own id. */
    const view = $derived.by(() => {
        const { index, row, kept } = rowMaker('t', fileBlock(client));
        const rows = (group: TickerItem[]): TickerRow[] => group.map((line) => row(line, ''));
        return {
            index,
            kept,
            followups: rows(lines.followups),
            subtasks: rows(lines.subtasks),
            tasks: rows(lines.tasks)
        };
    });

    const anything = $derived(hasTasks(lines));

    function pick(id: string): void {
        const line = view.index[id];
        if (line !== undefined) {
            openLine(client.layout, line, onproject);
        }
    }

    /** One button on one line, and the one sentence the board says about what it wrote. */
    async function run(id: string, action: string): Promise<void> {
        const said = await act(client, view.index[id], action, now);
        if (said !== null) onsaid(said);
    }
</script>

{#snippet marked(text: string)}
    <RootChip record={{ root: text }} />
{/snippet}

{#snippet group(label: string, glyph: string, rows: TickerRow[])}
    {#if rows.length > 0}
        <div class="grp">
            <p class="lbl">
                {#if glyph !== ''}
                    <Glyph name={glyph} />
                {/if}
                {label}
            </p>
            <Ticker {rows} onpick={pick} onaction={run} reveal kept={view.kept} {marked} />
        </div>
    {/if}
{/snippet}

{#if anything}
    <section class="tasks" data-surface>
        <div class="head">
            <ToolButton
                bare
                label={open
                    ? t('focus.fold', t('focus.tasks.heading'))
                    : t('focus.unfold', t('focus.tasks.heading'))}
                glyph={open ? t('project.card.collapse_glyph') : t('project.card.expand_glyph')}
                expanded={open}
                onclick={ontoggle}
            />
            <b><Glyph name={t('focus.tasks.heading_glyph')} />{t('focus.tasks.heading')}</b>
        </div>
        {#if open}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render group(
                t('focus.tasks.grp_followups_label'),
                t('focus.command.grp_followups_glyph'),
                view.followups
            )}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render group(
                t('focus.tasks.grp_subtasks_label'),
                t('focus.command.grp_subtask_glyph'),
                view.subtasks
            )}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render group(t('focus.tasks.grp_tasks_label'), '', view.tasks)}
        {/if}
    </section>
{/if}

<style>
    .tasks {
        padding: 4px 8px;
        border: 1px solid var(--line);
        border-left: 3px solid var(--c-teal);
        border-radius: var(--input-radius);
        background: var(--chip);
        columns: 2 22em;
        column-gap: 16px;
    }

    /* Over a wallpaper the section is the one translucent layer under its rows, so it carries
       `data-surface`; drawn inside a surface already (a free float's fill) it paints nothing. */
    :global(body.wall) .tasks {
        background: var(--chip-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.wall [data-surface]) .tasks {
        background: transparent;
        backdrop-filter: none;
    }
    .head {
        display: flex;
        column-span: all;
        align-items: center;
        gap: 4px;
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
</style>
