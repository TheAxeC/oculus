<script lang="ts">
    // Layer 3, view. The landing board: a ticker of everything with a date, the strip of what is out
    // for an answer, the lanes each manifest's `focus:` puts it on, the ideas backlog, and the band
    // of durable work that is not a project.
    //
    // It counts nothing itself. The lanes, the ticker, the strip and the band are the pure functions
    // of state/focus.ts, and what is left here is the markup and the words. The words are keys, the
    // colours are tones and the glyphs are names, so the board is re-worded, re-coloured and
    // re-iconed in config alone.
    //
    // There is no drag. state/drag.svelte.ts is the shell's pane drag and a view has no business in
    // it; a card is moved between lanes from its own menu, which is the keyboard path as well.
    //
    // The card snippets are copied from Projects.svelte rather than shared: the boundary table
    // forbids a view importing another view, `ui/` is domain-blind and `state/` holds no markup, so
    // there is nowhere the two could share them without widening a rule.

    import Card from '$lib/ui/Card.svelte';
    import Chip from '$lib/ui/Chip.svelte';
    import Empty from '$lib/ui/Empty.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import Menu, { type MenuItem } from '$lib/ui/Menu.svelte';
    import Pane from '$lib/ui/Pane.svelte';
    import Ticker, { type TickerRow } from '$lib/ui/Ticker.svelte';
    import { DEADLINE_SOON, daysUntil, firstSentence } from '$lib/state/board';
    import {
        CATEGORIES,
        CLUSTERS,
        backlog,
        band,
        daysTone,
        flamesOf,
        holdingTone,
        labelOf,
        laneItems,
        lanes,
        priorities,
        ticker,
        unplaced,
        waiting,
        type BandItem,
        type Id,
        type Lane,
        type Project,
        type TickerItem,
        type Venue
    } from '$lib/state/focus';
    import { configMap } from '$lib/state/selectors.svelte';
    import { portfolio } from '$lib/state/entities.svelte';
    import { openView } from '$lib/state/layout.svelte';
    import { t } from '$lib/state/text';
    import { chipGlyph, chipLabel, statusTone } from '$lib/state/tones';
    import { writeManifest } from '$lib/state/writes.svelte';
    import type { ViewProps } from './registry';

    let { instance }: ViewProps = $props();

    /** How much of `next` a card shows. */
    const CARD_NEXT = 130;

    /**
     * Today, for every countdown on the board. It is read when the board is opened and not again,
     * so a page left open across midnight counts the day it was opened on until it is reloaded.
     */
    const now = Date.now();

    const config = $derived(configMap());
    const snapshot = $derived(portfolio());
    const projects = $derived(Object.values(snapshot?.entities.projects ?? {}));
    const board = $derived(lanes(config));
    const items = $derived(laneItems(projects, board));
    const ideas = $derived(backlog(projects, board));
    const missing = $derived(unplaced(projects));
    const levels = $derived(priorities(config));
    const strip = $derived(waiting(projects, snapshot?.entities.venues ?? {}, collaboratorNames()));
    const week = $derived(snapshot === null ? null : ticker(snapshot, config, now));
    const cards = $derived(
        snapshot === null
            ? { funding: [], applications: [], education: [] }
            : band(snapshot, config, now)
    );

    /** What the last lane or priority write answered, by project id. */
    let outcome = $state<Record<Id, string>>({});

    /** The collaborations file's own names, by the key a manifest waits on them with. */
    function collaboratorNames(): Record<Id, string> {
        const names: Record<Id, string> = {};
        for (const entry of snapshot?.entities.collections.collaborations?.entries ?? []) {
            names[entry.id] = entry.title;
        }
        return names;
    }

    /** Open one project as its own tab, the same tab a click on a board card opens. */
    function openProject(id: Id): void {
        const project = snapshot?.entities.projects[id];
        openView('project', 'main', { id, label: project === undefined ? id : labelOf(project) });
    }

    /** A ticker line opens what it names: a project's tab, or the collection file's own tab. */
    function pick(id: string): void {
        const [kind, key] = [id.slice(0, id.indexOf(':')), id.slice(id.indexOf(':') + 1)];
        if (kind === 'p') openProject(key);
        else if (kind === 'c') openView(key, 'main');
    }

    /** The id a ticker row is picked by: a project, a collection, or nothing to pick. */
    function rowId(line: TickerItem): string {
        if (line.id !== undefined) return `p:${line.id}`;
        if (line.entry !== undefined) return `c:${line.entry}`;
        return '';
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

    /** What an overdue line says after its name. */
    function overdueTail(line: TickerItem): string {
        const days = -(line.days ?? 0);
        if (line.kind === 'paper') return t('cc.overdue_deadline', days);
        if (line.kind === 'funding') return t('cc.overdue_funding', days);
        return t('cc.overdue_generic', overdueWord(line.kind), days);
    }

    /** What a coming date says after its name. */
    function deadlineTail(line: TickerItem): string {
        const days = line.days ?? 0;
        if (line.kind === 'paper') return t('cc.submission_deadline', days);
        if (line.kind === 'funding') return t('cc.funding_deadline', days);
        if (line.kind === 'conference') {
            if (line.days !== null) return t('cc.conference_call', days);
            return t('cc.conference_call_approx', monthWords(line.months ?? 0));
        }
        return t('cc.generic_in', word(line.kind), days);
    }

    /** How a month-only conference call is dated: this month, the next, or how many away. */
    function monthWords(months: number): string {
        if (months === 0) return t('cc.this_month');
        if (months === 1) return t('cc.next_month');
        return t('cc.in_months', months);
    }

    /** A dated line's countdown, and nothing for a line that carries no date. */
    function dateTail(line: TickerItem): string {
        if (line.days === null) return '';
        return line.days < 0 ? t('cc.days_ago', -line.days) : t('cc.in_days', line.days);
    }

    /** One ticker row, with the tail its group words it by. */
    function row(line: TickerItem, tail: string): TickerRow {
        const name = line.venue === undefined ? line.label : `${line.label} ${line.venue}`;
        return { id: rowId(line), glyph: line.glyph, label: name, tail, tone: daysTone(line.days) };
    }

    /** The lines of one deadline category, in the order the ticker holds them. */
    function inCategory(category: string): TickerRow[] {
        return (week?.deadlines ?? [])
            .filter((line) => line.kind === category)
            .map((line) => row(line, deadlineTail(line)));
    }

    /** The categories that actually have a line, so an empty group draws no header. */
    const shownCategories = $derived(
        CATEGORIES.filter((category) => inCategory(category).length > 0)
    );

    /** A category's heading. The keys are literal so tests/keys.test.ts can see every one of them. */
    function categoryLabel(category: string): string {
        if (category === 'paper') return t('cc.dlcat_paper');
        if (category === 'funding') return t('cc.dlcat_funding');
        if (category === 'event') return t('cc.dlcat_event_label');
        if (category === 'teaching') return t('cc.dlcat_teaching');
        if (category === 'collab') return t('cc.dlcat_collab');
        if (category === 'task') return t('cc.dlcat_task');
        return t('cc.dlcat_conference');
    }

    /** The subtask lines that carry a date, and the ones that do not, each grouped by their kind. */
    const subtaskKinds = $derived.by(() => {
        const dated = (week?.subtasks ?? []).filter((line) => line.days !== null);
        const open = (week?.subtasks ?? []).filter((line) => line.days === null);
        return { dated: byKind(dated), open: byKind(open) };
    });

    /** Lines grouped by the `kind:` of the entry that holds them, in the order the ticker sorted them. */
    function byKind(lines: TickerItem[]): { kind: string; rows: TickerRow[] }[] {
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
    }

    /** Whether the ticker has anything at all to say. */
    const hasTicker = $derived(
        week !== null &&
            week.overdue.length +
                week.deadlines.length +
                week.followups.length +
                week.subtasks.length +
                week.venueLoad.length +
                week.snoozed.length >
                0
    );

    /** The deadline badge of a card: how overdue it is, how long is left, or the date itself. */
    function deadline(project: Project): { label: string; tone?: string } | null {
        const date = project.deadline;
        if (date === undefined || date === '') return null;
        const days = daysUntil(date, now);
        if (days === null || project.chips.includes('submitted')) return { label: date };
        if (days < 0) return { label: t('cards.overdue', -days), tone: 'red' };
        if (days <= DEADLINE_SOON) return { label: t('cards.due_days', days), tone: 'amber' };
        return { label: date };
    }

    /** What a card says it is waiting on: the people it names, else the venue, else that it is blocked. */
    function waitLine(project: Project): string {
        const names = collaboratorNames();
        if (project.waitingOn.length > 0) {
            return `${t('focus.wait_people')} ${project.waitingOn.map((key) => names[key] ?? key).join(', ')}`;
        }
        if (project.chips.includes('submitted')) {
            const venue: Venue | undefined =
                project.venueId === undefined
                    ? undefined
                    : snapshot?.entities.venues[project.venueId];
            const name = venue === undefined ? '' : (venue.short ?? venue.name);
            return `${t('focus.wait_review')} ${name === '' ? t('focus.venue_unset') : name}`;
        }
        if (project.chips.includes('blocked')) return t('focus.wait_blocked');
        return '';
    }

    /** The menu a card carries: every lane, then every priority, with the one in force marked. */
    function menuFor(project: Project): MenuItem[] {
        const held = project.focus ?? '';
        return [
            ...board.map((lane) => ({
                id: `lane:${lane.key}`,
                label: lane.label,
                active: lane.key === held
            })),
            ...levels.map((level) => ({
                id: `prio:${level.key}`,
                label: level.label,
                active: level.key === project.priority
            })),
            { id: 'prio:', label: t('focus.priority_none'), active: project.priority === undefined }
        ];
    }

    /** Picking a lane writes `focus:`; picking a priority writes `priority:`. Both say what happened. */
    async function choose(project: Project, choice: string): Promise<void> {
        const field = choice.startsWith('lane:') ? 'focus' : 'priority';
        const value = choice.slice(choice.indexOf(':') + 1);
        const answer = await writeManifest(project.id, { [field]: value });
        outcome = {
            ...outcome,
            [project.id]: answer.ok
                ? t('editor.saved', answer.changed.join(', '))
                : t('editor.failed', answer.error ?? '')
        };
    }

    /** The band cards of one column, sorted and dated by state/focus.ts. */
    function bandTail(item: BandItem): string {
        if (item.days === null) return '';
        return item.days < 0 ? t('focus.days_ago', -item.days) : t('focus.in_days', item.days);
    }
</script>

{#snippet group(label: string, glyph: string, rows: TickerRow[])}
    {#if rows.length > 0}
        <details class="grp" open>
            <summary><Glyph name={glyph} />{label}</summary>
            <Ticker {rows} onpick={pick} />
        </details>
    {/if}
{/snippet}

{#snippet kindGroups(label: string, glyph: string, groups: { kind: string; rows: TickerRow[] }[])}
    {#if groups.length > 0}
        <details class="grp" open>
            <summary><Glyph name={glyph} />{label}</summary>
            {#each groups as one (one.kind)}
                <p class="sub">{one.kind === '' ? t('cc.kind_other') : one.kind}</p>
                <Ticker rows={one.rows} onpick={pick} />
            {/each}
        </details>
    {/if}
{/snippet}

{#snippet cardFor(project: Project)}
    {@const due = deadline(project)}
    {@const wait = waitLine(project)}
    {@const said = outcome[project.id]}
    <div class="slot" title={project.title}>
        <Card
            title={labelOf(project)}
            level={4}
            ontitle={() => openProject(project.id)}
            pinned={project.pin === true}
        >
            {#snippet meta()}
                {#if flamesOf(project, config) > 0}
                    <span class="flames" title={project.priority}>
                        {#each { length: flamesOf(project, config) } as _, at (at)}
                            <Glyph name={t('focus.fire_glyph')} />
                        {/each}
                    </span>
                {/if}
                {#each project.chips as chip (chip)}
                    <Chip label={chipLabel(chip)} icon={chipGlyph(chip)} tone={statusTone(chip)} />
                {/each}
                {#if due}
                    <Chip label={due.label} tone={due.tone} glyph={t('cards.deadline_glyph')} />
                {/if}
                <Menu
                    label={t('focus.move_to')}
                    items={menuFor(project)}
                    placement="down"
                    onpick={(id) => choose(project, id)}
                />
            {/snippet}

            {#if wait !== ''}
                <p class="wait">{wait}</p>
            {/if}
            {#if project.next}
                <p class="next">{firstSentence(project.next, CARD_NEXT)}</p>
            {/if}
            {#if said !== undefined}
                <p class="said">{said}</p>
            {/if}
        </Card>
    </div>
{/snippet}

{#snippet lane(one: Lane, held: Project[])}
    <div class="lane" style={`--tone: var(--c-${one.tone})`}>
        <div class="lane-h">
            <span class="lane-name">{one.label}</span>
            <span class="count">{held.length}</span>
        </div>
        <p class="lane-sub">{one.sub}</p>
        <div class="lane-body">
            {#each held as project (project.id)}
                {@render cardFor(project)}
            {:else}
                <Empty message={t('focus.none')} glyph={t('focus.empty_glyph')} />
            {/each}
        </div>
    </div>
{/snippet}

{#snippet column(label: string, glyph: string, sub: string, rows: BandItem[])}
    {#if rows.length > 0}
        <div class="lane">
            <div class="lane-h">
                <span class="lane-name"><Glyph name={glyph} />{label}</span>
                <span class="count">{rows.length}</span>
            </div>
            <p class="lane-sub">{sub}</p>
            <div class="lane-body">
                {#each rows as entry, at (`${at}:${entry.title}`)}
                    {@const key = entry.entry}
                    {#if key === undefined}
                        <span class="entry plain">
                            <span class="entry-name">{entry.title}</span>
                            <span class="entry-tail">{bandTail(entry)}</span>
                        </span>
                    {:else}
                        <button type="button" class="entry" onclick={() => openView(key, 'main')}>
                            <span class="entry-name">{entry.title}</span>
                            <span class="entry-tail">{bandTail(entry)}</span>
                        </button>
                    {/if}
                {/each}
            </div>
        </div>
    {/if}
{/snippet}

<Pane title={t('focus.working_now')}>
    <div class="focus" data-instance={instance.id}>
        <p class="lede">
            {t('focus.working_now_plain', projects.filter((one) => one.focus).length)}
            {#if missing.length > 0}
                <button type="button" class="hint" onclick={() => openProject(missing[0].id)}>
                    {t('focus.hint_count', missing.length)}
                </button>
                {t('focus.hint_plain')}
            {/if}
        </p>

        {#if week !== null && hasTicker}
            <section class="week">
                {@render group(
                    t('cc.grp_overdue_label'),
                    t('cc.grp_overdue_glyph'),
                    week.overdue.map((line) => row(line, overdueTail(line)))
                )}
                {@render group(
                    t('cc.grp_attention_label'),
                    t('cc.grp_attention_glyph'),
                    week.venueLoad.map((one) => ({
                        id: '',
                        glyph: t('focus.warn_glyph'),
                        label: t('cc.venue_count', one.label, one.count),
                        tail: t('cc.venue_load_tail', one.count),
                        tone: 'amber'
                    }))
                )}
                {#if shownCategories.length > 0}
                    <details class="grp" open>
                        <summary>
                            <Glyph name={t('cc.grp_deadlines_glyph')} />{t(
                                'cc.grp_deadlines_label'
                            )}
                        </summary>
                        {#each shownCategories as category (category)}
                            <p class="sub">{categoryLabel(category)}</p>
                            <Ticker rows={inCategory(category)} onpick={pick} />
                        {/each}
                    </details>
                {/if}
                {@render kindGroups(
                    t('cc.grp_subtask_dl_label'),
                    t('cc.grp_subtask_glyph'),
                    subtaskKinds.dated
                )}
                {@render kindGroups(
                    t('cc.grp_open_subtasks_label'),
                    t('cc.grp_subtask_glyph'),
                    subtaskKinds.open
                )}
                {@render group(
                    t('cc.grp_followups_label'),
                    t('cc.grp_followups_glyph'),
                    week.followups.map((line) => row(line, ''))
                )}
                {@render group(
                    t('cc.snoozed', week.snoozed.length),
                    t('cc.snoozed_glyph'),
                    week.snoozed.map((line) => row(line, ''))
                )}
            </section>
        {/if}

        {#if strip.people.length + strip.venues.length + strip.blocked > 0}
            <section class="waitroll">
                <span class="wait-head">
                    <Glyph name={t('focus.wait_glyph')} />{t('focus.awaiting_response')}
                </span>
                {#if strip.people.length > 0}
                    <span class="seg">
                        <span class="seg-lbl">{t('focus.wait_people')}</span>
                        {#each strip.people as one (one.label)}
                            <Chip label={t('cc.venue_count', one.label, one.count)} />
                        {/each}
                    </span>
                {/if}
                {#if strip.venues.length > 0}
                    <span class="seg">
                        <span class="seg-lbl">{t('focus.wait_review')}</span>
                        {#each strip.venues as one (one.label)}
                            <Chip
                                label={t(
                                    'cc.venue_count',
                                    one.label === '' ? t('focus.venue_unset') : one.label,
                                    one.count
                                )}
                                tone="violet"
                            />
                        {/each}
                    </span>
                {/if}
                {#if strip.blocked > 0}
                    <span class="seg">
                        <span class="seg-lbl">{t('focus.wait_blocked')}</span>
                        <Chip label={String(strip.blocked)} tone="red" />
                    </span>
                {/if}
            </section>
        {/if}

        {#if board.length === 0 || projects.length === 0}
            <Empty message={t('focus.none')} glyph={t('focus.empty_glyph')} />
        {/if}

        {#each CLUSTERS as cluster (cluster)}
            {@const inCluster = board.filter((one) => one.cluster === cluster)}
            {#if inCluster.length > 0}
                <details class="cluster" open>
                    <summary>
                        {#if cluster === 'now'}
                            <Glyph name={t('focus.now_glyph')} />{t('focus.cluster_now')}
                        {:else if cluster === 'parked'}
                            {t('focus.cluster_parked')}
                        {:else}
                            <Glyph name={t('focus.ideas_glyph')} />{t('focus.cluster_incubate')}
                        {/if}
                    </summary>
                    <div class="lanes">
                        {#each inCluster as one (one.key)}
                            {@render lane(one, items[one.key] ?? [])}
                        {/each}
                    </div>
                </details>
            {/if}
        {/each}

        <details class="cluster" open>
            <summary><Glyph name={t('focus.ideas_glyph')} />{t('focus.ideas')}</summary>
            <div class="lanes">
                {@render lane(
                    {
                        key: 'holding',
                        label: t('focus.ideas'),
                        sub: t('focus.idea_backlog'),
                        tone: holdingTone(config),
                        cluster: 'incubate'
                    },
                    ideas
                )}
            </div>
        </details>

        {#if cards.funding.length + cards.applications.length + cards.education.length > 0}
            <details class="cluster" open>
                <summary>{t('focus.cards_group')}</summary>
                <div class="lanes">
                    {#each cards.funding as stage (stage.label)}
                        {@render column(
                            stage.label,
                            t('focus.funding_glyph'),
                            t('focus.funding_sub'),
                            stage.items
                        )}
                    {/each}
                    {@render column(
                        t('focus.jobs_label'),
                        t('focus.jobs_glyph'),
                        t('focus.jobs_sub'),
                        cards.applications
                    )}
                    {@render column(
                        t('focus.teaching_label'),
                        t('focus.teaching_glyph'),
                        t('focus.teaching_sub'),
                        cards.education
                    )}
                </div>
            </details>
        {/if}
    </div>
</Pane>

<style>
    .focus {
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-width: 0;
    }

    .lede {
        margin: 0;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .hint {
        padding: 0;
        border: 0;
        background: none;
        font: inherit;
        font-weight: 600;
        color: var(--accent-txt, var(--accent));
        cursor: pointer;
    }

    .week {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 10px 12px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--chip);
    }

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

    .grp > :global(*) {
        margin-top: 4px;
    }

    .sub {
        margin: 6px 0 2px;
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }

    .waitroll {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border: 1px solid var(--line);
        border-radius: 8px;
    }

    .wait-head,
    .seg-lbl {
        font-size: var(--fs-xs);
        font-weight: 700;
        color: var(--muted-txt, var(--muted));
    }

    .seg {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px;
    }

    .lanes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 10px;
        margin-top: 8px;
    }

    .lane {
        display: flex;
        flex-direction: column;
        min-width: 0;
        padding: 8px;
        border: 1px solid var(--line);
        border-top: 3px solid var(--tone, var(--line));
        border-radius: 8px;
        background: var(--panel);
    }

    .lane-h {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 6px;
    }

    .lane-name {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: var(--fs-sm);
        font-weight: 700;
    }

    .count {
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }

    .lane-sub {
        margin: 2px 0 6px;
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }

    .lane-body {
        display: flex;
        flex-direction: column;
        gap: 6px;
        min-width: 0;
    }

    .slot {
        min-width: 0;
    }

    .flames {
        display: inline-flex;
    }

    .wait,
    .next,
    .said {
        margin: 2px 0 0;
        font-size: var(--fs-sm);
    }

    .wait {
        color: var(--muted-txt, var(--muted));
    }

    .said {
        font-size: var(--fs-xs);
        color: var(--accent-txt, var(--accent));
    }

    .entry {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 6px;
        width: 100%;
        padding: 4px 6px;
        border: 1px solid var(--line);
        border-radius: 6px;
        background: var(--chip);
        font: inherit;
        font-size: var(--fs-sm);
        text-align: left;
        color: var(--ink-txt, var(--ink));
        cursor: pointer;
    }

    .entry-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .entry-tail {
        flex: 0 0 auto;
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }
</style>
