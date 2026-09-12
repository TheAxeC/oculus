<script lang="ts">
    // Layer 3, view partial of views/Focus.svelte. The command center: the urgency ticker, in two
    // columns under one heading, with the buttons each line can be acted on by.
    //
    // It counts nothing. The groups are state/focus.ts's ticker and state/feeds.ts's attention and
    // refresh lines; what is here is the markup, the words, the writes and the opening controls. A
    // line says what it is and what it can be written to (`kind` and `target`), and this file turns
    // the first into a sentence through config/text.yml and the second into buttons through
    // state/writes.svelte.ts. Lead and attention lines open their views; refresh lines ask the
    // shell for the Update tray through the ui store.
    //
    // The right of the heading row holds the live HPC pill (O26): the running and pending counts
    // from state/hpc.svelte.ts, drawn only while the cluster answers and the queue is not empty,
    // and a click on it opens the Live HPC view.

    import Glyph from '$lib/ui/Glyph.svelte';
    import Ticker, { type TickerAction, type TickerRow } from '$lib/ui/Ticker.svelte';
    import {
        CATEGORIES,
        daysTone,
        ticker,
        type TickerItem,
        type TickerTarget
    } from '$lib/state/focus';
    import { attention, refresh } from '$lib/state/feeds';
    import { configMap } from '$lib/state/selectors.svelte';
    import { portfolio } from '$lib/state/entities.svelte';
    import { openView } from '$lib/state/layout.svelte';
    import { instanceState, requestUpdateTray, setInstanceState } from '$lib/state/ui.svelte';
    import { t } from '$lib/state/text';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { pillText } from '$lib/state/hpc.svelte';
    import {
        writeEntry,
        writeManifest,
        writeSubtask,
        type WriteAnswer
    } from '$lib/state/writes.svelte';

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

    /** The singular or plural manifest noun, with literal catalog keys for the static audit. */
    function manifestWord(count: number): string {
        if (count === 1) return t('cc.manifest');
        return t('cc.manifests');
    }

    /** An ISO date a snooze button pushes an item out to. */
    function snoozeDate(days: number): string {
        return new Date(now + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    }

    /** The three snooze buttons, the same on every line that can be snoozed. */
    function snoozeActions(): TickerAction[] {
        return [
            {
                id: 'snooze:7',
                label: t('actions.snooze_1w'),
                title: t('actions.snooze_tip', t('actions.snooze_1w'))
            },
            {
                id: 'snooze:30',
                label: t('actions.snooze_1mo'),
                title: t('actions.snooze_tip', t('actions.snooze_1mo'))
            },
            {
                id: 'snooze:hide',
                label: t('actions.snooze_hide'),
                title: t('actions.snooze_tip', t('actions.snooze_hide'))
            }
        ];
    }

    function unsnooze(): TickerAction {
        return { id: 'unsnooze', label: t('actions.unsnooze'), title: t('actions.unsnooze') };
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
        const remove = { id: 'del', label: t('actions.del'), title: t('actions.delete_subtask') };
        if (target.subtask !== undefined) {
            if (line.snoozed) return [unsnooze(), remove];
            const done = { id: 'done', label: t('actions.done'), title: t('actions.mark_done') };
            return [done, ...snoozeActions(), remove];
        }
        if (line.snoozed) return [unsnooze()];
        if (target.kind === 'followup') {
            return [{ id: 'done', label: t('actions.done'), title: t('actions.mark_done') }];
        }
        if (target.kind === 'lead' || target.kind === 'venue') return undefined;
        const statuses: TickerAction[] = [];
        for (const status of target.statuses ?? []) {
            if (status.toLowerCase() === (line.status ?? '').toLowerCase()) continue;
            statuses.push({
                id: `status:${status}`,
                label: status,
                title: t('actions.set_status', status)
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
        if (kind === 'event') return t('cc.word_event');
        if (kind === 'teaching') return t('cc.word_teaching');
        if (kind === 'task') return t('cc.word_task');
        if (kind === 'position') return t('cc.word_application');
        return t('cc.word_collaboration');
    }

    /** The same, for an overdue line, where the cockpit's word for a commitment is not "teaching". */
    function overdueWord(kind: string): string {
        return kind === 'teaching' ? t('cc.word_commitment') : word(kind);
    }

    function overdueTail(line: TickerItem): string {
        const days = -(line.days ?? 0);
        if (line.kind === 'paper') return t('cc.overdue_deadline', days);
        if (line.kind === 'funding') return t('cc.overdue_funding', days);
        return t('cc.overdue_generic', overdueWord(line.kind), days);
    }

    function deadlineTail(line: TickerItem): string {
        const days = line.days ?? 0;
        if (line.kind === 'paper') return t('cc.submission_deadline', days);
        if (line.kind === 'funding') return t('cc.funding_deadline', days);
        if (line.kind === 'position') return t('cc.position_deadline', days);
        if (line.kind === 'conference') {
            if (line.days !== null) return t('cc.conference_call', days);
            return t('cc.conference_call_approx', monthWords(line.months ?? 0));
        }
        return t('cc.generic_in', word(line.kind), days);
    }

    function monthWords(months: number): string {
        if (months === 0) return t('cc.this_month');
        if (months === 1) return t('cc.next_month');
        return t('cc.in_months', months);
    }

    function dateTail(line: TickerItem): string {
        if (line.days === null) return '';
        return line.days < 0 ? t('cc.days_ago', -line.days) : t('cc.in_days', line.days);
    }

    /** A category's heading. The keys are literal so tests/keys.test.ts can see every one of them. */
    function categoryLabel(category: string): string {
        if (category === 'paper') return t('cc.dlcat_paper');
        if (category === 'funding') return t('cc.dlcat_funding');
        if (category === 'event') return t('cc.dlcat_event_label');
        if (category === 'teaching') return t('cc.dlcat_teaching');
        if (category === 'position') return t('cc.dlcat_position');
        if (category === 'collab') return t('cc.dlcat_collab');
        if (category === 'task') return t('cc.dlcat_task');
        return t('cc.dlcat_conference');
    }

    /** The glyph one attention line is drawn with. */
    function attentionGlyph(kind: string): string {
        if (kind === 'inbox') return t('cc.inbox_glyph');
        if (kind === 'linkedin') return t('cc.linkedin_glyph');
        return t('focus.warn_glyph');
    }

    /** The glyph one refresh nudge is drawn with. */
    function refreshGlyph(feed: string): string {
        if (feed === 'inbox') return t('cc.inbox_glyph');
        if (feed === 'scout') return t('cc.scout_glyph');
        return t('cc.litwatch_glyph');
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
                    tail: t('cc.emails')
                };
            }
            if (one.kind === 'linkedin') {
                return {
                    id,
                    glyph: attentionGlyph(one.kind),
                    label: `${one.count} ${t('cc.days')}`,
                    tail: t('cc.since_linkedin'),
                    tone: 'red'
                };
            }
            return {
                id,
                glyph: attentionGlyph(one.kind),
                label: t('cc.venue_count', one.label ?? '', one.count),
                tail: t('cc.venue_load_tail', warnAt),
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
                    ? t('cc.refresh_inbox_plain', one.days ?? 0)
                    : one.feed === 'scout'
                      ? t('cc.refresh_scout_plain', one.days ?? 0)
                      : t(
                            'cc.refresh_litwatch_plain',
                            one.days === null ? t('cc.never_run') : t('cc.last_refreshed', one.days)
                        );
            return { id, glyph: refreshGlyph(one.feed), label };
        });
        return { index, rows };
    });

    /** Whether the strip has anything at all to say. */
    const anything = $derived(
        view.overdue.length +
            view.categories.length +
            view.subtaskDated.length +
            view.subtaskOpen.length +
            view.followups.length +
            view.snoozed.length +
            attentionView.rows.length +
            (week?.behind === null || week?.behind === undefined ? 0 : 1) +
            refreshView.rows.length >
            0
    );

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

{#snippet group(label: string, glyph: string, rows: TickerRow[])}
    {#if rows.length > 0}
        <div class="grp">
            <p class="lbl"><Glyph name={glyph} />{label}</p>
            <Ticker {rows} onpick={pick} onaction={act} />
        </div>
    {/if}
{/snippet}

{#snippet kindGroups(label: string, glyph: string, groups: { kind: string; rows: TickerRow[] }[])}
    {#if groups.length > 0}
        <div class="grp">
            <p class="lbl"><Glyph name={glyph} />{label}</p>
            {#each groups as one (one.kind)}
                <p class="sub">{one.kind === '' ? t('cc.kind_other') : one.kind}</p>
                <Ticker rows={one.rows} onpick={pick} onaction={act} />
            {/each}
        </div>
    {/if}
{/snippet}

{#if anything}
    <section class="week">
        <div class="head">
            <b><Glyph name={t('cc.command_center_glyph')} />{t('cc.command_center')}</b>
            {#if pillText()}
                <span class="pill">
                    <ToolButton label={pillText()} onclick={() => openView('hpc', 'main')} />
                </span>
            {/if}
        </div>

        {@render group(t('cc.grp_overdue_label'), t('cc.grp_overdue_glyph'), view.overdue)}
        {#if attentionView.rows.length > 0 || week?.behind}
            <div class="grp">
                <p class="lbl">
                    <Glyph name={t('cc.grp_attention_glyph')} />{t('cc.grp_attention_label')}
                </p>
                {#if attentionView.rows.length > 0}
                    <Ticker rows={attentionView.rows} onpick={pickAttention} />
                {/if}
                {#if week?.behind}
                    <div class="behind">
                        <Glyph name={t('board.stale_glyph')} />
                        <b>
                            {week.behind.count}
                            {manifestWord(week.behind.count)}
                        </b>
                        <span>{t('cc.behind_refresh')}</span>
                        {#each week.behind.projects as project (project.id)}
                            <ToolButton
                                label={project.label}
                                title={t('cards.stale_behind', project.days)}
                                onclick={() => onproject(project.id)}
                            />
                        {/each}
                        {#if week.behind.more > 0}
                            <span>{t('cc.more', week.behind.more)}</span>
                        {/if}
                    </div>
                {/if}
            </div>
        {/if}

        {#if view.categories.length > 0}
            <div class="grp">
                <p class="lbl">
                    <Glyph name={t('cc.grp_deadlines_glyph')} />{t('cc.grp_deadlines_label')}
                </p>
                {#each view.categories as one (one.category)}
                    <p class="sub">{categoryLabel(one.category)}</p>
                    <Ticker rows={one.rows} onpick={pick} onaction={act} />
                {/each}
            </div>
        {/if}

        {@render kindGroups(
            t('cc.grp_subtask_dl_label'),
            t('cc.grp_subtask_glyph'),
            view.subtaskDated
        )}
        {@render kindGroups(
            t('cc.grp_open_subtasks_label'),
            t('cc.grp_subtask_glyph'),
            view.subtaskOpen
        )}
        {@render group(t('cc.grp_followups_label'), t('cc.grp_followups_glyph'), view.followups)}
        {#if refreshView.rows.length > 0}
            <div class="grp">
                <p class="lbl">
                    <Glyph name={t('cc.refresh_glyph')} />{t('cc.grp_refresh_label')}
                </p>
                <Ticker rows={refreshView.rows} onpick={pickRefresh} />
            </div>
        {/if}

        {#if view.snoozed.length > 0}
            <details class="grp">
                <summary class="lbl">
                    <Glyph name={t('cc.snoozed_glyph')} />{t('cc.snoozed', view.snoozed.length)}
                </summary>
                <Ticker rows={view.snoozed} onpick={pick} onaction={act} />
            </details>
        {/if}
    </section>
{/if}

<style>
    /* Two columns while a column can still hold a line of text, one when it cannot. A group is kept
       whole so its label can never sit at the foot of one column with its lines at the head of the
       other, which is what `break-inside: avoid` is for. */
    .week {
        padding: 10px 12px;
        border: 1px solid var(--line);
        border-left: 3px solid var(--c-red);
        border-radius: 8px;
        background: var(--chip);
        columns: 2 22em;
        column-gap: 26px;
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

    /* The live HPC pill docks here; it is O26's and the slot stays empty until then. */
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
