<script lang="ts">
    // Layer 3, view partial of views/Focus.svelte. The command center: the urgency ticker, in two
    // columns under one heading, with the buttons each line can be acted on by.
    //
    // It counts nothing. The groups are state/ticker.ts's ticker and state/feeds.ts's attention and
    // refresh lines; what is here is the markup, the words, the writes and the opening controls. A
    // line says what it is and what it can be written to (`kind` and `target`), and this file turns
    // the first into a sentence through the text catalog and the second into buttons through
    // state/writes.svelte.ts. Lead and attention lines open their views; refresh lines ask the
    // shell for the Update tray through the ui store.
    //
    // The right of the heading row holds the live HPC pill: the running and pending counts
    // from state/hpc.svelte.ts, drawn only while the cluster answers and the queue is not empty,
    // and a click on it opens the Live HPC view.

    import type { TickerAction, TickerRow } from '$lib/ui/Ticker.svelte';
    import {
        CATEGORIES,
        daysTone,
        ticker,
        type TickerItem,
        type TickerTarget
    } from '$lib/state/ticker';
    import { attention, refresh } from '$lib/state/feeds';
    import { configMap } from '$lib/state/selectors.svelte';
    import { portfolio } from '$lib/state/entities.svelte';
    import { openView } from '$lib/state/layout.svelte';
    import { instanceState, requestUpdateTray, setInstanceState } from '$lib/state/ui.svelte';
    import { t } from '$lib/state/text';
    import {
        writeEntry,
        writeManifest,
        writeSubtask,
        type WriteAnswer
    } from '$lib/state/writes.svelte';
    import CommandCenterView from './CommandCenterView.svelte';

    type Props = {
        /** The moment every countdown on the board is measured from. */
        now: number;
        /** Open one project as its own tab; the board owns what a tab is called. */
        onproject: (id: string) => void;
        /** What a write answered, for the one outcome line the board holds. */
        onsaid: (said: string) => void;
    };

    let { now, onproject, onsaid }: Props = $props();

    const config = $derived(configMap());
    const snapshot = $derived(portfolio());
    const week = $derived(snapshot === null ? null : ticker(snapshot, config, now));
    const needs = $derived(snapshot === null ? [] : attention(snapshot, config, now));
    const nudges = $derived(snapshot === null ? [] : refresh(snapshot, config, now));

    /** The threshold the venue-load line quotes, the `venue_conc_warn` of behavior.yml. */
    const warnAt = $derived(
        typeof config.venue_conc_warn === 'number' ? config.venue_conc_warn : 4
    );

    /** An ISO date a snooze button pushes an item out to. */
    function snoozeDate(days: number): string {
        return new Date(now + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    }

    /** The three snooze buttons, the same on every line that can be snoozed. */
    function snoozeActions(): TickerAction[] {
        return [
            {
                id: 'snooze:7',
                label: t('project.action.snooze_1w'),
                title: t('project.action.snooze_tip', t('project.action.snooze_1w'))
            },
            {
                id: 'snooze:30',
                label: t('project.action.snooze_1mo'),
                title: t('project.action.snooze_tip', t('project.action.snooze_1mo'))
            },
            {
                id: 'snooze:hide',
                label: t('project.action.snooze_hide'),
                title: t('project.action.snooze_tip', t('project.action.snooze_hide'))
            }
        ];
    }

    function unsnooze(): TickerAction {
        return {
            id: 'unsnooze',
            label: t('project.action.unsnooze'),
            title: t('project.action.unsnooze')
        };
    }

    /**
     * The buttons one line carries, from its target alone. A subtask is ticked, snoozed and
     * deleted; a project, an entry or a scheme is snoozed; an entry also gets the lifecycle
     * statuses of its own collection, minus the one it is in; a follow-up is cleared. A lead opens
     * the Leads view but carries no write, and neither does a conference call, since the venue
     * registry's schema has no status field to write.
     */
    function actionsFor(line: TickerItem): TickerAction[] | undefined {
        const target = line.target;
        if (target === undefined) return undefined;
        const remove = {
            id: 'del',
            label: t('project.action.del'),
            title: t('project.action.delete_subtask')
        };
        if (target.subtask !== undefined) {
            if (line.snoozed) return [unsnooze(), remove];
            const done = {
                id: 'done',
                label: t('project.action.done'),
                title: t('project.action.mark_done')
            };
            return [done, ...snoozeActions(), remove];
        }
        if (line.snoozed) return [unsnooze()];
        if (target.kind === 'followup') {
            return [
                {
                    id: 'done',
                    label: t('project.action.done'),
                    title: t('project.action.mark_done')
                }
            ];
        }
        if (target.kind === 'lead' || target.kind === 'venue') return undefined;
        const statuses: TickerAction[] = [];
        for (const status of target.statuses ?? []) {
            if (status.toLowerCase() === (line.status ?? '').toLowerCase()) continue;
            statuses.push({
                id: `status:${status}`,
                label: status,
                title: t('project.action.set_status', status)
            });
        }
        return [...statuses, ...snoozeActions()];
    }

    /** Whether a line names something the board can open, which decides if its name is a button. */
    function opens(line: TickerItem): boolean {
        return line.id !== undefined || line.entry !== undefined || line.target?.kind === 'lead';
    }

    /** The word a collection's own dates are named by. The keys are literal so keys.test.ts sees them. */
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

    function dateTail(line: TickerItem): string {
        if (line.days === null) return '';
        return line.days < 0
            ? t('focus.command.days_ago', -line.days)
            : t('focus.command.in_days', line.days);
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

    /**
     * Everything the strip draws, and the line each row came from. The rows are numbered rather
     * than named by what they point at, because two lines of one group can name the same project
     * (two subtasks of it) and a button has to reach the one it sits on.
     */
    const view = $derived.by(() => {
        const index: Record<string, TickerItem> = {};
        let at = 0;
        const row = (line: TickerItem, tail: string): TickerRow => {
            const id = `r${at++}`;
            index[id] = line;
            const name = line.venue === undefined ? line.label : `${line.label} ${line.venue}`;
            return {
                id,
                glyph: line.glyph,
                label: name,
                tail,
                tone: daysTone(line.days),
                actions: actionsFor(line),
                plain: !opens(line)
            };
        };
        const byKind = (lines: TickerItem[]): { kind: string; rows: TickerRow[] }[] => {
            const groups: { kind: string; rows: TickerRow[] }[] = [];
            for (const line of lines) {
                const held = groups.at(-1);
                if (held === undefined || held.kind !== line.kind) {
                    groups.push({ kind: line.kind, rows: [row(line, dateTail(line))] });
                } else {
                    held.rows.push(row(line, dateTail(line)));
                }
            }
            return groups;
        };
        const all = week?.subtasks ?? [];
        const categories = CATEGORIES.map((category) => ({
            category,
            rows: (week?.deadlines ?? [])
                .filter((line) => line.kind === category)
                .map((line) => row(line, deadlineTail(line)))
        })).filter((one) => one.rows.length > 0);
        return {
            index,
            overdue: (week?.overdue ?? []).map((line) => row(line, overdueTail(line))),
            categories,
            subtaskDated: byKind(all.filter((line) => line.days !== null)),
            subtaskOpen: byKind(all.filter((line) => line.days === null)),
            followups: (week?.followups ?? []).map((line) => row(line, '')),
            snoozed: (week?.snoozed ?? []).map((line) => row(line, ''))
        };
    });

    /** The "needs attention" rows: a count, its words, and the view each line opens. */
    const attentionView = $derived.by(() => {
        const index: Record<string, (typeof needs)[number]> = {};
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

    /** The "refresh live data" rows: what is stale, how stale, and the command that refreshes it. */
    const refreshView = $derived.by(() => {
        const index: Record<string, (typeof nudges)[number]> = {};
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
        const id = openView(view, 'main');
        const current = instanceState(id);
        const held =
            typeof current === 'object' && current !== null && !Array.isArray(current)
                ? current
                : {};
        setInstanceState(id, {
            ...held,
            reveal: item,
            ...(expiredOpen ? { expiredOpen: true } : {}),
            search: ''
        });
    }

    /** A ticker line opens what it names: a project's tab, or the collection file's own tab. */
    function pick(id: string): void {
        const line = view.index[id];
        if (line === undefined) return;
        if (line.target?.kind === 'lead') reveal('leads', line.target.id, true);
        else if (line.id !== undefined) onproject(line.id);
        else if (line.entry !== undefined) openView(line.entry, 'main');
    }

    /** Open the view named by one attention line, revealing the exact venue when it names one. */
    function pickAttention(id: string): void {
        const line = attentionView.index[id];
        if (line?.kind === 'inbox') openView('inbox', 'main');
        else if (line?.kind === 'linkedin') openView('linkedin', 'main');
        else if (line?.kind === 'venue' && line.id !== undefined) {
            reveal('venues', line.id);
        }
    }

    /** Open the shell-owned Update tray for a nudge that still belongs to the rendered rows. */
    function pickRefresh(id: string): void {
        if (refreshView.index[id] !== undefined) requestUpdateTray();
    }

    /** What one snooze button writes: an ISO date a week or a month out, or the hidden flag. */
    function snoozeValue(action: string): string {
        if (action === 'snooze:7') return snoozeDate(7);
        if (action === 'snooze:30') return snoozeDate(30);
        return 'true';
    }

    /** The fields one button sets on the project, entry or scheme its line names. */
    function fieldsFor(action: string): Record<string, unknown> {
        if (action === 'unsnooze') return { snooze: '' };
        if (action === 'done') return { followup: '' };
        if (action.startsWith('status:')) return { status: action.slice('status:'.length) };
        return { snooze: snoozeValue(action) };
    }

    /** One button, written through the write path and nothing else. */
    async function run(target: TickerTarget, action: string): Promise<WriteAnswer | null> {
        if (target.subtask !== undefined) {
            const host =
                target.collection === undefined
                    ? { id: target.id }
                    : { id: target.id, collection: target.collection };
            if (action === 'done') return writeSubtask(host, target.subtask, 'done');
            if (action === 'del') return writeSubtask(host, target.subtask, 'delete');
            if (action === 'unsnooze') return writeSubtask(host, target.subtask, 'snooze', '');
            return writeSubtask(host, target.subtask, 'snooze', snoozeValue(action));
        }
        const fields = fieldsFor(action);
        if (target.kind === 'manifest') return writeManifest(target.id, fields);
        if (target.kind === 'followup') {
            if (target.collection === undefined) return writeManifest(target.id, fields);
            return writeEntry(target.collection, target.id, fields);
        }
        if (target.kind === 'funding') return writeEntry('funding', target.id, fields);
        if (target.kind === 'entry' && target.collection !== undefined) {
            return writeEntry(target.collection, target.id, fields);
        }
        return null;
    }

    async function act(id: string, action: string): Promise<void> {
        const target = view.index[id]?.target;
        if (target === undefined) return;
        const answer = await run(target, action);
        if (answer === null) return;
        // A write refused whole answers ok with nothing changed and the refusals filled, which the
        // line reports as not saved rather than as saved over an untouched file.
        const refused = answer.refused.map((one) => one.reason).join(', ');
        if (!answer.ok) onsaid(t('editor.failed', answer.error ?? ''));
        else if (answer.changed.length === 0 && refused !== '') onsaid(t('editor.failed', refused));
        else onsaid(t('editor.saved', answer.changed.join(', ')));
    }
</script>

<CommandCenterView
    {week}
    {view}
    attentionRows={attentionView.rows}
    refreshRows={refreshView.rows}
    {onproject}
    onpick={pick}
    onaction={act}
    onattention={pickAttention}
    onrefresh={pickRefresh}
/>
