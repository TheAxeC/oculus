<script lang="ts">
    // Layer 3, view partial of views/Focus.svelte. The lanes: three clusters of three, the cards on
    // them, and the ideas backlog under them.
    //
    // A card is its own markup rather than ui/Card.svelte: it is a drag handle with a click-to-cycle
    // badge at its leading edge, which is a different thing from the card a board of projects draws.
    //
    // The drag is the card's own HTML5 events. state/drag.svelte.ts is the shell's pane drag and a
    // view has no business in it. The move menu stays beside the drag because it provides the
    // keyboard path.
    //
    // It carries `data-card` and `data-cursor` all the same, which is what the workbench's keyboard
    // cursor moves over, so a lane card is reachable by key like every card the primitive draws.

    import Tag from '$lib/ui/Tag.svelte';
    import { waitingLabel } from '$lib/state/waiting';
    import Empty from '$lib/ui/Empty.svelte';
    import Glyph from '$lib/ui/Glyph.svelte';
    import Menu from '$lib/ui/Menu.svelte';
    import type { MenuItem } from '$lib/ui/menu-items';
    import ToolButton from '$lib/ui/ToolButton.svelte';
    import { DEADLINE_SOON, daysUntil, firstSentence } from '$lib/state/board';
    import {
        CLUSTERS,
        backlog,
        flamesOf,
        holdingTone,
        labelOf,
        laneItems,
        lanes,
        priorities,
        unplaced,
        type Id,
        type Lane,
        type Project,
        type Venue
    } from '$lib/state/focus';
    import { t } from '$lib/state/text';
    import { chipGlyphName, chipLabel, statusMarkTone } from '$lib/state/tones';
    import { useState } from '$lib/state/use';

    const {
        selectors: { collectionOf, configMap },
        entities: { portfolio },
        writes: { writeManifest },
        layout: { openView }
    } = useState();

    type Props = {
        now: number;
        /** The card id the instance's keyboard cursor holds, or null when it holds none. */
        cursor: string | null;
        onproject: (id: Id) => void;
        onsaid: (said: string) => void;
    };

    let { now, cursor, onproject, onsaid }: Props = $props();

    /** How much of `next` a card shows. */
    const CARD_NEXT = 130;

    /** How many status chips a card carries; the rest are on the project's own tab. */
    const CARD_CHIPS = 2;

    const config = $derived(configMap());
    const snapshot = $derived(portfolio());
    const projects = $derived(Object.values(snapshot?.entities.projects ?? {}));
    const board = $derived(lanes(config));
    const items = $derived(laneItems(projects, board));
    const ideas = $derived(backlog(projects, board));
    const missing = $derived(unplaced(projects));
    const levels = $derived(priorities(config));

    /** The lane a card is being dragged over, so it can light up; null while nothing is dragged. */
    let over = $state<string | null>(null);

    /** The project being dragged, and the lane it came from. */
    let dragging: { id: Id; from: string } | null = null;

    /** The collaborations file's own names, by the key a manifest waits on them with. */
    function collaboratorNames(): Record<Id, string> {
        const names: Record<Id, string> = {};
        for (const entry of collectionOf('collaborations')?.entries ?? []) {
            names[entry.id] = entry.title;
        }
        return names;
    }

    /** The deadline badge of a card: how overdue it is, how long is left, or the date itself. */
    function deadline(project: Project): { label: string; tone?: string } | null {
        const date = project.deadline;
        if (date === undefined || date === '') return null;
        const days = daysUntil(date, now);
        if (days === null || project.chips.includes('submitted')) return { label: date };
        if (days < 0) return { label: t('project.card.overdue', -days), tone: 'red' };
        if (days <= DEADLINE_SOON)
            return { label: t('project.card.due_days', days), tone: 'amber' };
        return { label: date };
    }

    /** What a card says it is waiting on: the people it names, else the venue, else that it is blocked. */
    function waitLine(project: Project): string {
        const names = collaboratorNames();
        if (project.waitingOn.length > 0) {
            const held = snapshot?.entities.projects ?? {};
            const who = project.waitingOn.map((key) => waitingLabel(key, names, held)).join(', ');
            return `${t('focus.wait_people')} ${who}`;
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

    /** Say what one write answered, on the board's one outcome line. */
    function said(answer: { ok: boolean; changed: string[]; error?: string }): void {
        onsaid(
            answer.ok
                ? t('editor.saved', answer.changed.join(', '))
                : t('editor.failed', answer.error ?? '')
        );
    }

    /** Picking a lane writes `focus:`; picking a priority writes `priority:`. */
    async function choose(project: Project, choice: string): Promise<void> {
        const field = choice.startsWith('lane:') ? 'focus' : 'priority';
        said(await writeManifest(project.id, { [field]: choice.slice(choice.indexOf(':') + 1) }));
    }

    /**
     * The next priority in the cycle: unset, then every level of `priority_levels` in order, then
     * unset again. The cycle is the config's list, so a level added there joins the cycle.
     */
    function nextPriority(project: Project): string {
        // Fewest flames first, so one click on an unset card asks for the least rather than the
        // most, and the order of the config's list (most first, for the menu) is not the cycle's.
        const climbing = [...levels].sort((a, b) => a.flames - b.flames);
        const cycle = ['', ...climbing.map((level) => level.key)];
        const at = cycle.indexOf(project.priority ?? '');
        return cycle[(at < 0 ? 0 : at + 1) % cycle.length];
    }

    async function cyclePriority(project: Project): Promise<void> {
        said(await writeManifest(project.id, { priority: nextPriority(project) }));
    }

    /** An unplaced ghost has no project tab; its README is the only title-like destination. */
    function openMissing(project: Project): void {
        if (project.ghost) {
            if (project.docs.some((doc) => doc.name === 'README.md' && doc.present)) {
                openView('document', {
                    root: 'hub',
                    path: `${project.folder}/README.md`,
                    label: 'README.md'
                });
            }
            return;
        }
        onproject(project.id);
    }

    /** How many flames a card draws: none means one, faint, so the badge can be clicked to set one. */
    function flames(project: Project): number {
        return Math.max(flamesOf(project, config), 1);
    }

    function started(project: Project, event: DragEvent): void {
        dragging = { id: project.id, from: project.focus ?? '' };
        if (event.dataTransfer === null) return;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', project.id);
    }

    function ended(): void {
        dragging = null;
        over = null;
    }

    function draggedOver(lane: string, event: DragEvent): void {
        if (dragging === null) return;
        event.preventDefault();
        if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'move';
        over = lane;
    }

    /** Dropping a card on a lane writes its `focus:`, which is what puts it on that lane. */
    async function dropped(lane: string, event: DragEvent): Promise<void> {
        if (dragging === null) return;
        event.preventDefault();
        const held = dragging;
        ended();
        if (lane === held.from) return;
        said(await writeManifest(held.id, { focus: lane }));
    }
</script>

{#snippet card(project: Project)}
    {@const due = deadline(project)}
    {@const wait = waitLine(project)}
    <div
        class="card"
        role="listitem"
        data-card={project.id}
        data-cursor={cursor === project.id || undefined}
        draggable={!project.ghost}
        title={project.title}
        ondragstart={(event) => started(project, event)}
        ondragend={ended}
    >
        <div class="card-h">
            {#if project.ghost}
                <span class="chipicon" title={t('project.card.ghost_badge_tip')}>
                    <Glyph name={t('board.warn_glyph')} />
                </span>
            {:else}
                <button
                    type="button"
                    class="flames"
                    class:unset={flamesOf(project, config) === 0}
                    title={project.priority ?? t('focus.set_priority')}
                    onclick={() => cyclePriority(project)}
                >
                    {#each { length: flames(project) } as _, at (at)}
                        <Glyph name={t('focus.fire_glyph')} />
                    {/each}
                </button>
            {/if}
            {#each project.chips.slice(0, CARD_CHIPS) as chip (chip)}
                {@const icon = chipGlyphName(chip)}
                <span
                    class="chipicon"
                    title={chipLabel(chip)}
                    style={`--mark: var(--c-${statusMarkTone(chip)}-txt)`}
                >
                    {#if icon !== ''}
                        <Glyph name={icon} />
                    {/if}
                </span>
            {/each}
            <button type="button" class="name" onclick={() => openMissing(project)}>
                {labelOf(project)}
            </button>
            {#if due}
                <span class="due">
                    <Tag
                        label={due.label}
                        glyph={t('project.card.deadline_glyph')}
                        tone={due.tone}
                    />
                </span>
            {/if}
            {#if !project.ghost}
                <Menu
                    label={t('focus.move_to')}
                    items={menuFor(project)}
                    placement="down"
                    onpick={(id: string) => choose(project, id)}
                />
            {/if}
        </div>
        {#if wait !== ''}
            <p class="wait">{wait}</p>
        {/if}
        {#if project.next}
            <p class="next">{firstSentence(project.next, CARD_NEXT)}</p>
        {/if}
    </div>
{/snippet}

{#snippet lane(one: Lane, held: Project[], grid: boolean)}
    <div class="lane" class:lit={over === one.key} style={`--tone: var(--c-${one.tone})`}>
        <div class="lane-h">
            <span class="lane-name">{one.label}</span>
            <span class="count">{held.length}</span>
        </div>
        <p class="lane-sub">{one.sub}</p>
        <div
            class="lane-body"
            class:grid
            role="list"
            ondragover={(event) => draggedOver(one.key, event)}
            ondragleave={() => (over = over === one.key ? null : over)}
            ondrop={(event) => dropped(one.key, event)}
        >
            {#each held as project (project.id)}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render card(project)}
            {:else}
                <Empty message={t('focus.none')} glyph={t('focus.empty_glyph')} />
            {/each}
        </div>
    </div>
{/snippet}

{#each CLUSTERS as cluster (cluster)}
    {@const inCluster = board.filter((one) => one.cluster === cluster)}
    {#if inCluster.length > 0}
        <details class="cluster" class:muted={cluster !== 'now'} open>
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
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render lane(one, items[one.key] ?? [], false)}
                {/each}
            </div>
        </details>
    {/if}
{/each}

<details class="cluster muted" open>
    <summary><Glyph name={t('focus.ideas_glyph')} />{t('focus.ideas')}</summary>
    <div class="lanes one">
        <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
        {@render lane(
            {
                key: 'holding',
                label: t('focus.ideas'),
                sub: t('focus.idea_backlog'),
                tone: holdingTone(config),
                cluster: 'incubate'
            },
            ideas,
            true
        )}
    </div>
</details>

{#if missing.length > 0}
    <p class="hint">
        <span class="hint-link">
            <ToolButton
                label={t('focus.hint_count', missing.length)}
                title={t('focus.hint_link')}
                onclick={() => openMissing(missing[0])}
            />
        </span>
        <!-- eslint-disable-next-line svelte/no-at-html-tags -- a catalog line, which oculus wrote -->
        {@html t('focus.hint_tail')}
    </p>
{/if}

<style>
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

    .hint {
        margin: 6px 0 0;
        font-size: var(--fs-md);
        color: var(--muted-txt, var(--muted));
    }

    .hint-link :global(.tool) {
        padding: 0;
        border: 0;
        background: none;
        font: inherit;
        font-weight: 600;
        color: var(--accent-txt, var(--accent));
        cursor: pointer;
    }

    .lanes {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
        margin-top: 8px;
    }

    .lanes.one {
        grid-template-columns: 1fr;
    }

    @media (max-width: 900px) {
        .lanes {
            grid-template-columns: 1fr;
        }
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

    :global(body.wall) .lane {
        background: color-mix(in srgb, var(--panel) var(--wall-panel), transparent);
        backdrop-filter: blur(var(--wall-blur));
    }

    .lane.lit {
        box-shadow: inset 0 0 0 2px var(--tone, var(--line));
    }

    .cluster.muted .lane {
        opacity: 0.9;
    }

    .lane-h {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 6px;
    }

    .lane-name {
        font-size: var(--fs-md);
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
        min-height: 26px;
    }

    .lane-body.grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        align-items: start;
    }

    @media (max-width: 700px) {
        .lane-body.grid {
            grid-template-columns: 1fr;
        }
    }

    .card {
        min-width: 0;
        padding: 6px 8px;
        border: 1px solid var(--line);
        border-left: 3px solid var(--tone, var(--line));
        border-radius: 6px;
        background: var(--bg);
        cursor: grab;
    }

    .card-h {
        display: flex;
        align-items: baseline;
        flex-wrap: wrap;
        gap: 5px;
    }

    .flames,
    .name {
        padding: 0;
        border: 0;
        background: none;
        font: inherit;
        cursor: pointer;
    }

    .flames {
        display: inline-flex;
        flex: 0 0 auto;
        font-size: var(--fs-xxs);
        line-height: 1;
    }

    .flames.unset {
        opacity: 0.22;
    }

    .flames.unset:hover,
    .flames.unset:focus-visible {
        opacity: 0.6;
    }

    /* A status mark is a line icon, so each one is drawn in the hue of the status it stands for
       and a lane's row still reads at a glance; a mark given no hue keeps the card's ink. */
    .chipicon {
        flex: 0 0 auto;
        color: var(--mark, inherit);
        font-size: var(--fs-xs);
        line-height: 1;
    }

    .name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: var(--fs-md);
        font-weight: 650;
        color: var(--ink-txt, var(--ink));
    }

    .name:hover,
    .name:focus-visible {
        color: var(--accent-txt, var(--accent));
        text-decoration: underline;
    }

    .due {
        margin-left: auto;
    }

    .wait,
    .next {
        margin: 2px 0 0;
        font-size: var(--fs-xs);
        color: var(--muted-txt, var(--muted));
    }
</style>
