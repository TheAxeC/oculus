<script lang="ts">
    // Layer 3, view partial of views/Focus.svelte. The tasks section: the open work that carries no
    // date, in the same two columns as the command center above it and with the same buttons.
    //
    // It counts nothing. The lines are state/ticker.ts's `tasks` list, already in the order the
    // three groups are drawn in; the rows, their buttons and what a button writes are
    // views/focus/rows.ts, which the command center draws its own rows with. A group with no line
    // draws nothing, and a section with no group at all draws nothing either.

    import Glyph from '$lib/ui/Glyph.svelte';
    import Ticker from '$lib/ui/Ticker.svelte';
    import type { TickerRow } from '$lib/ui/ticker-rows';
    import type { Ticker as FocusTicker, TickerItem } from '$lib/state/ticker';
    import { t } from '$lib/state/text';
    import { act, openLine, rowMaker } from './rows';

    type Props = {
        /** The board's one ticker, walked once by the view that holds both sections. */
        week: FocusTicker | null;
        /** The moment every countdown on the board is measured from. */
        now: number;
        /** Open one project as its own tab; the board owns what a tab is called. */
        onproject: (id: string) => void;
        /** What a write answered, for the one outcome line the board holds. */
        onsaid: (said: string) => void;
    };

    let { week, now, onproject, onsaid }: Props = $props();

    /** The rows of each group, in the order the section draws them. */
    type Groups = { followups: TickerRow[]; subtasks: TickerRow[]; tasks: TickerRow[] };

    /**
     * Which of the three groups one line belongs to: a subtask carries the key of its own line, and
     * a follow-up says so in its kind, which is what a scheme's note has instead of a target.
     */
    function groupOf(line: TickerItem): keyof Groups {
        if (line.target?.subtask !== undefined) return 'subtasks';
        if (line.kind === 'followup') return 'followups';
        return 'tasks';
    }

    /** The three groups of rows, and the line each row came from, by the row's own id. */
    const view = $derived.by(() => {
        const { index, row } = rowMaker('t');
        const groups: Groups = { followups: [], subtasks: [], tasks: [] };
        for (const line of week?.tasks ?? []) groups[groupOf(line)].push(row(line, ''));
        return { index, ...groups };
    });

    const anything = $derived(view.followups.length + view.subtasks.length + view.tasks.length > 0);

    function pick(id: string): void {
        const line = view.index[id];
        if (line !== undefined) openLine(line, onproject);
    }

    /** One button on one line, and the one sentence the board says about what it wrote. */
    async function run(id: string, action: string): Promise<void> {
        const said = await act(view.index[id], action, now);
        if (said !== null) onsaid(said);
    }
</script>

{#snippet group(label: string, glyph: string, rows: TickerRow[])}
    {#if rows.length > 0}
        <div class="grp">
            <p class="lbl">
                {#if glyph !== ''}
                    <Glyph name={glyph} />
                {/if}
                {label}
            </p>
            <Ticker {rows} onpick={pick} onaction={run} />
        </div>
    {/if}
{/snippet}

{#if anything}
    <section class="tasks">
        <div class="head">
            <b><Glyph name={t('focus.tasks.heading_glyph')} />{t('focus.tasks.heading')}</b>
        </div>
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
    </section>
{/if}

<style>
    .tasks {
        padding: 10px 12px;
        border: 1px solid var(--line);
        border-left: 3px solid var(--c-teal);
        border-radius: 8px;
        background: var(--chip);
        columns: 2 22em;
        column-gap: 26px;
    }

    :global(body.wall) .tasks {
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
</style>
