<script lang="ts">
    // Layer 3, view partial of views/boards/focus/Focus.svelte. The lanes: three clusters of three,
    // the cards on them, and the ideas backlog under them. A card is lanes/LaneCard.svelte, drawn
    // from what this module works out for it: its deadline, what it waits on, its flames and its
    // move menu.
    //
    // The drag is the card's own HTML5 events. state/workbench/drag.svelte.ts is the shell's pane
    // drag and a view has no business in it. The move menu stays beside the drag because it
    // provides the keyboard path.

    import { personNames } from '$lib/state/boards/person';
    import { waitingLabel } from '$lib/state/boards/waiting';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import Surface from '$lib/ui/frame/Surface.svelte';
    import Glyph from '$lib/ui/display/Glyph.svelte';
    import LaneCard from './LaneCard.svelte';
    import LaneHead from './LaneHead.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import { DEADLINE_SOON, daysUntil } from '$lib/state/boards/board';
    import {
        backlog,
        CLUSTERS,
        flamesOf,
        focusLabel,
        holdingTone,
        laneItems,
        isBlocked,
        lanes,
        lanesIn,
        movable,
        nextPriority,
        pausesCountdown,
        portfolioProjects,
        priorities,
        type Id,
        type Lane,
        type Project,
        type Venue
    } from '$lib/state/boards/focus';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        selectors: { configMap },
        entities: { portfolio },
        writes: { writeManifest }
    } = client;

    type Props = {
        now: number;
        /** The card id the instance's keyboard cursor holds, or null when it holds none. */
        cursor: string | null;
        onproject: (id: Id) => void;
        onsaid: (said: string) => void;
    };

    let { now, cursor, onproject, onsaid }: Props = $props();

    const config = $derived(configMap());
    const snapshot = $derived(portfolio());
    const projects = $derived(portfolioProjects(snapshot));
    const board = $derived(lanes(config));
    const items = $derived(laneItems(projects, board));
    const ideas = $derived(backlog(projects, board, config));
    const levels = $derived(priorities(config));

    /** The lane a card is being dragged over, so it can light up; null while nothing is dragged. */
    let over = $state<string | null>(null);

    /** The project being dragged, and the lane it came from. */
    let dragging: { project: Project; from: string } | null = null;

    /** The deadline badge of a card: how overdue it is, how long is left, or the date itself. */
    function deadline(project: Project): { label: string; tone?: string } | null {
        const date = project.deadline;
        if (date === undefined || date === '') return null;
        const days = daysUntil(date, now);
        if (days === null || pausesCountdown(project, config)) return { label: date };
        if (days < 0) return { label: t('project.card.overdue', -days), tone: 'red' };
        if (days <= DEADLINE_SOON)
            return { label: t('project.card.due_days', days), tone: 'amber' };
        return { label: date };
    }

    /**
     * What a card says it is waiting on: the people it names, else the venue, else that it is
     * blocked.
     */
    function waitLine(project: Project): string {
        const names = personNames(snapshot);
        if (project.waitingOn.length > 0) {
            const held = snapshot?.entities.projects ?? {};
            const who = project.waitingOn.map((key) => waitingLabel(key, names, held)).join(', ');
            return `${t('focus.wait_people')} ${who}`;
        }
        if (pausesCountdown(project, config)) {
            const venue: Venue | undefined =
                project.venueId === undefined
                    ? undefined
                    : snapshot?.entities.venues[project.venueId];
            const name = venue === undefined ? '' : (venue.short ?? venue.name);
            return `${t('focus.wait_review')} ${name === '' ? t('focus.venue_unset') : name}`;
        }
        if (isBlocked(project, config)) return t('focus.wait_blocked');
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

    /** Write the next priority of the cycle, which state/boards/focus.ts's nextPriority gives. */
    async function cyclePriority(project: Project): Promise<void> {
        said(await writeManifest(project.id, { priority: nextPriority(levels, project.priority) }));
    }

    /**
     * How many flames a card draws: none means one, faint, so the badge can be clicked to set one.
     */
    function flames(project: Project): number {
        return Math.max(flamesOf(project, config), 1);
    }

    function started(project: Project, event: DragEvent): void {
        dragging = { project, from: project.focus ?? '' };
        if (event.dataTransfer === null) return;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', project.id);
    }

    function ended(): void {
        dragging = null;
        over = null;
    }

    /**
     * A lane that may not take the dragged project, the Ideas lane for a project outside the live
     * tiers, leaves the event alone, so the browser refuses the drop and the lane does not light.
     */
    function draggedOver(lane: string, event: DragEvent): void {
        if (dragging === null || !movable(dragging.project, lane, config)) return;
        event.preventDefault();
        if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'move';
        over = lane;
    }

    /** Dropping a card on a lane writes its `focus:`, which is what puts it on that lane. */
    async function dropped(lane: string, event: DragEvent): Promise<void> {
        if (dragging === null || !movable(dragging.project, lane, config)) return;
        event.preventDefault();
        const held = dragging;
        ended();
        if (lane === held.from) return;
        said(await writeManifest(held.project.id, { focus: lane }));
    }
</script>

{#snippet lane(one: Lane, held: Project[], grid: boolean)}
    <div
        class="lane"
        class:lit={over === one.key}
        style={`--tone: var(--c-${one.tone})`}
        data-surface
    >
        <LaneHead label={one.label} count={held.length} tone={one.tone} />
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
                <LaneCard
                    {project}
                    label={focusLabel(project, config.focus_label_mode)}
                    current={cursor === project.id}
                    due={deadline(project)}
                    wait={waitLine(project)}
                    flames={flames(project)}
                    unset={flamesOf(project, config) === 0}
                    items={menuFor(project)}
                    onpick={(id: string) => void choose(project, id)}
                    oncycle={() => void cyclePriority(project)}
                    onopen={() => onproject(project.id)}
                    ondragstart={(event: DragEvent) => started(project, event)}
                    ondragend={ended}
                />
            {:else}
                <Empty message={t('focus.none')} glyph={t('focus.empty_glyph')} />
            {/each}
        </div>
    </div>
{/snippet}

{#each CLUSTERS as cluster (cluster)}
    {@const inCluster = lanesIn(board, cluster)}
    {#if inCluster.length > 0}
        <details class="cluster" class:muted={cluster !== 'now'} open>
            <summary>
                <Surface inline>
                    {#if cluster === 'now'}
                        <Glyph name={t('focus.now_glyph')} />{t('focus.cluster_now')}
                    {:else if cluster === 'parked'}
                        {t('focus.cluster_parked')}
                    {:else}
                        <Glyph name={t('focus.ideas_glyph')} />{t('focus.cluster_incubate')}
                    {/if}
                </Surface>
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
    <summary>
        <Surface inline>
            <Glyph name={t('focus.ideas_glyph')} />{t('focus.ideas')}
        </Surface>
    </summary>
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

    /* The lanes fill the pane's width in as many columns as it holds, and one column in a pane
       narrower than a lane. */
    .lanes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(290px, 100%), 1fr));
        gap: 8px;
        margin-top: 4px;
    }

    .lanes.one {
        grid-template-columns: minmax(0, 1fr);
    }

    .lane {
        display: flex;
        flex-direction: column;
        min-width: 0;
        padding: 4px 8px;
        border: 1px solid var(--line);
        border-top: 3px solid var(--tone, var(--line));
        border-radius: var(--input-radius);
        background: var(--panel);
    }

    /* Over a wallpaper a lane is the one translucent layer under its cards, so it carries
       `data-surface` and an empty lane's message paints nothing of its own; drawn inside a surface
       already (a free float's fill) the lane paints nothing. */
    :global(body.wall) .lane {
        background: var(--panel-on-wall);
        backdrop-filter: blur(var(--wall-blur));
    }

    :global(body.wall [data-surface]) .lane {
        background: transparent;
        backdrop-filter: none;
    }

    .lane.lit {
        box-shadow: inset 0 0 0 2px var(--tone, var(--line));
    }

    /* A lane of a muted cluster fades its body and its sub-line; its header keeps full opacity,
       since the header pair is measured opaque. */
    .cluster.muted .lane-sub,
    .cluster.muted .lane-body {
        opacity: 0.9;
    }

    .lane-sub {
        margin: 2px 0 4px;
        font-size: var(--fs-sm);
        color: var(--muted-txt, var(--muted));
    }

    .lane-body {
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 0;
        min-height: calc(var(--tree-row) * var(--text-scale, 1));
    }

    .lane-body.grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
        align-items: start;
    }
</style>
