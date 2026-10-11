<script module lang="ts">
    import { anyNumberShape } from '$lib/data/shapes/shapes';

    /** The venue-load threshold of the configuration: any number, and 4 for anything else. */
    const warnAtShape = anyNumberShape.catch(4);
</script>

<script lang="ts">
    // Layer 3, view partial of views/boards/focus/Focus.svelte. The command center: the urgency
    // ticker, in two columns under one heading, with the buttons each line can be acted on by.
    //
    // It counts nothing. The groups are the ticker the board hands it and state/feeds/feeds.ts's
    // attention and refresh lines; what is here is the markup, the words, the writes and the
    // opening controls. A line says what it is and what it can be written to (`kind` and `target`),
    // and this file turns the first into a sentence through the text catalog; the second becomes
    // buttons, and what one writes, in views/boards/focus/rows.ts, which the tasks section draws
    // its rows with too. Lead and attention lines open their views; refresh lines ask the shell for
    // the Update tray through the ui store.
    //
    // The right of the heading row holds the live HPC pill: the running and pending counts from
    // state/system/machine/hpc/hpc.svelte.ts, drawn only while the cluster answers and the queue is
    // not empty, and a click on it opens the Live HPC view.

    import type { TickerRow } from '$lib/ui/display/ticker/ticker-rows';
    import {
        CATEGORIES,
        deadlinesByCategory,
        runsByKind,
        type TickerItem
    } from '$lib/state/boards/ticker';
    import { attention, refresh } from '$lib/state/feeds/feeds';
    import { t } from '$lib/state/shared/words/text';
    import { instanceMap } from '$lib/state/workbench/layout';
    import { act, dateTail, fileBlock, openLine, rowMaker, type SectionProps } from './rows';
    import CommandCenterView from './CommandCenterView.svelte';
    import { useState } from '$lib/state/client/use';

    const client = useState();

    const {
        selectors: { configMap },
        entities: { portfolio },
        inbox: { actionable, state: inboxState },
        layout: { openView },
        ui: { instanceState, requestUpdateTray, setInstanceState }
    } = client;

    let { week, now, open, ontoggle, onproject, onsaid }: SectionProps = $props();

    const config = $derived(configMap());
    const snapshot = $derived(portfolio());
    const needs = $derived(snapshot === null ? [] : attention(snapshot, config, now, actionable()));
    const nudges = $derived(
        snapshot === null ? [] : refresh(snapshot, config, now, inboxState()?.notesRun ?? null)
    );

    /** The threshold the venue-load line quotes, the `venue_conc_warn` of behavior.yml. */
    const warnAt = $derived(warnAtShape.parse(config.venue_conc_warn));

    /**
     * The word a collection's own dates are named by. The keys are literal so keys.test.ts sees
     * them.
     */
    function word(kind: string): string {
        if (kind === 'event') return t('focus.command.word_event');
        if (kind === 'teaching') return t('focus.command.word_teaching');
        if (kind === 'task') return t('focus.command.word_task');
        if (kind === 'position') return t('focus.command.word_application');
        return t('focus.command.word_collaboration');
    }

    /** The same for an overdue line, where teaching uses the word commitment. */
    function overdueWord(kind: string): string {
        return kind === 'teaching' ? t('focus.command.word_commitment') : word(kind);
    }

    function overdueTail(line: TickerItem): string {
        const days = -(line.days ?? 0);
        if (line.kind === 'paper') return t('focus.command.overdue_deadline', days);
        if (line.kind === 'funding') return t('focus.command.overdue_funding', days);
        return t('focus.command.overdue_generic', overdueWord(line.kind), days);
    }

    function deadlineTail(line: TickerItem): string {
        const days = line.days ?? 0;
        if (line.kind === 'paper') return t('focus.command.submission_deadline', days);
        if (line.kind === 'funding') return t('focus.command.funding_deadline', days);
        if (line.kind === 'position') return t('focus.command.position_deadline', days);
        if (line.kind === 'conference') {
            if (line.days !== null) return t('focus.command.conference_call', days);
            return t('focus.command.conference_call_approx', monthWords(line.months ?? 0));
        }
        return t('focus.command.generic_in', word(line.kind), days);
    }

    function monthWords(months: number): string {
        if (months === 0) return t('focus.command.this_month');
        if (months === 1) return t('focus.command.next_month');
        return t('focus.command.in_months', months);
    }

    /** The glyph one attention line is drawn with. */
    function attentionGlyph(kind: string): string {
        if (kind === 'inbox') return t('focus.command.inbox_glyph');
        if (kind === 'linkedin') return t('focus.command.linkedin_glyph');
        return t('focus.warn_glyph');
    }

    /** The glyph one refresh nudge is drawn with. */
    function refreshGlyph(feed: string): string {
        if (feed === 'inbox') return t('focus.command.inbox_glyph');
        if (feed === 'scout') return t('focus.command.scout_glyph');
        return t('focus.command.litwatch_glyph');
    }

    /** Everything the strip draws, and the line each row came from, by the row's own id. */
    const view = $derived.by(() => {
        const { index, row, kept } = rowMaker('r', fileBlock(client));
        const byKind = (lines: TickerItem[]): { kind: string; rows: TickerRow[] }[] =>
            runsByKind(lines).map((run) => ({
                kind: run.kind,
                rows: run.lines.map((line) => row(line, dateTail(line)))
            }));
        const categories = deadlinesByCategory(week?.deadlines ?? [], CATEGORIES).map((one) => ({
            category: one.category,
            rows: one.lines.map((line) => row(line, deadlineTail(line)))
        }));
        return {
            index,
            kept,
            overdue: (week?.overdue ?? []).map((line) => row(line, overdueTail(line))),
            categories,
            subtaskDated: byKind(week?.subtasks ?? []),
            followups: (week?.followups ?? []).map((line) => row(line, '')),
            snoozed: (week?.snoozed ?? []).map((line) => row(line, ''))
        };
    });

    /** The "needs attention" rows: a count, its words, and the view each line opens. */
    const attentionView = $derived.by(() => {
        const index: Record<string, (typeof needs)[number] | undefined> = {};
        const rows = needs.map((one, at): TickerRow => {
            const id =
                one.kind === 'venue' ? `attention:venue:${one.id ?? at}` : `attention:${one.kind}`;
            index[id] = one;
            if (one.kind === 'inbox') {
                return {
                    id,
                    glyph: attentionGlyph(one.kind),
                    label: String(one.count),
                    tail: t('focus.command.emails')
                };
            }
            if (one.kind === 'linkedin') {
                return {
                    id,
                    glyph: attentionGlyph(one.kind),
                    label: `${one.count} ${t('focus.command.days')}`,
                    tail: t('focus.command.since_linkedin'),
                    tone: 'red'
                };
            }
            return {
                id,
                glyph: attentionGlyph(one.kind),
                label: t('focus.command.venue_count', one.label ?? '', one.count),
                tail: t('focus.command.venue_load_tail', warnAt),
                tone: 'amber'
            };
        });
        return { index, rows };
    });

    /**
     * The "refresh live data" rows: what is stale, how stale, and the command that refreshes it.
     */
    const refreshView = $derived.by(() => {
        const index: Record<string, (typeof nudges)[number] | undefined> = {};
        const rows = nudges.map((one, at): TickerRow => {
            const id = `refresh:${one.feed}:${at}`;
            index[id] = one;
            const label =
                one.feed === 'inbox'
                    ? t('focus.command.refresh_inbox_plain', one.days ?? 0)
                    : one.feed === 'scout'
                      ? t('focus.command.refresh_scout_plain', one.days ?? 0)
                      : t(
                            'focus.command.refresh_litwatch_plain',
                            one.days === null
                                ? t('focus.command.never_run')
                                : t('focus.command.last_refreshed', one.days)
                        );
            return { id, glyph: refreshGlyph(one.feed), label };
        });
        return { index, rows };
    });

    /** Put transient reveal state on the instance that was activated, never in layout identity. */
    function reveal(view: 'leads' | 'venues', item: string, expiredOpen = false): void {
        const id = openView(view);
        setInstanceState(id, {
            ...instanceMap(instanceState(id)),
            reveal: item,
            ...(expiredOpen ? { expiredOpen: true } : {}),
            search: ''
        });
    }

    /** A ticker line opens what it names: a lead's view, a project's tab, or the file's own tab. */
    function pick(id: string): void {
        const line = view.index[id];
        if (line === undefined) return;
        if (line.target?.kind === 'lead') reveal('leads', line.target.id, true);
        else openLine(client.layout, line, onproject);
    }

    /** Open the view named by one attention line, revealing the exact venue when it names one. */
    function pickAttention(id: string): void {
        const line = attentionView.index[id];
        if (line?.kind === 'inbox') openView('inbox');
        else if (line?.kind === 'linkedin') openView('linkedin');
        else if (line?.kind === 'venue' && line.id !== undefined) {
            reveal('venues', line.id);
        }
    }

    /** Open the shell-owned Update tray for a nudge that still belongs to the rendered rows. */
    function pickRefresh(id: string): void {
        if (refreshView.index[id] !== undefined) requestUpdateTray();
    }

    /** One button on one line, and the one sentence the board says about what it wrote. */
    async function run(id: string, action: string): Promise<void> {
        const said = await act(client, view.index[id], action, now);
        if (said !== null) onsaid(said);
    }
</script>

<CommandCenterView
    {week}
    {view}
    {open}
    {ontoggle}
    attentionRows={attentionView.rows}
    refreshRows={refreshView.rows}
    {onproject}
    onpick={pick}
    onaction={run}
    onattention={pickAttention}
    onrefresh={pickRefresh}
/>
