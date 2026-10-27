<script lang="ts">
    // Layer 3, view partial of views/boards/focus/Focus.svelte. The lanes, grouped by the clusters
    // of `focus_clusters` in their order (state/boards/focus.ts `clusters`), and the cards on them:
    // a `columns` cluster draws its lanes side by side under its heading, the words and glyph its
    // row names (its key when it names no words) in the muted text colour with the count of the
    // cards on its lanes, its lanes muted when its row says so; a `full_width` cluster draws each
    // of its lanes as a section of its own headed by the lane's label in the lane's colour, the
    // cluster's glyph and the lane's count. Each is the group every grouping of a view is drawn as
    // (ui/controls/heads/GroupHead.svelte) and folds by its control; the fold is the Focus tab's,
    // under the key `groupFold` gives the cluster or the lane, so a reload and a move of the tab
    // keep it. Folded, a group's lanes are hidden until found and stay mounted, so the browser's
    // find-in-page searches their cards, and a match inside them unfolds the group. A lane naming
    // no cluster of the list is drawn in none. A card is lanes/LaneCard.svelte, drawn from what
    // this module works out for it: its status marks, its facts (state/boards/focus.ts
    // `laneFacts`), its deadline, the people it waits on or that it is blocked, and its move menu.
    // The projects on each lane are the ones the Focus filter keeps, which the board hands it with
    // how many each lane hides. Which lane a card sits on, which marks it draws there and what a
    // move writes are state/boards/focus.ts's projectLane, laneMarks and hubMoveOnto, so a drop and
    // the menu write the same fields. The board's lanes are the lanes of every hub of the
    // workspace; a card sits on, and moves to, the lane of its own hub's lanes with the same key,
    // read under its own hub's words.
    //
    // The drag is the card's own HTML5 events. state/workbench/drag.svelte.ts is the shell's pane
    // drag and a view has no business in it. The move menu stays beside the drag because it
    // provides the keyboard path.

    import type { Snippet } from 'svelte';
    import { answerWords } from '$lib/views/shared/forms/answer-words';
    import GroupHead from '$lib/ui/controls/heads/GroupHead.svelte';
    import type { WriteAnswer } from '$lib/state/client/writes.svelte';
    import { waitedOn } from '$lib/state/boards/waiting';
    import Empty from '$lib/ui/frame/Empty.svelte';
    import LaneCard from './LaneCard.svelte';
    import LaneHead from './LaneHead.svelte';
    import type { MenuItem } from '$lib/ui/menu/menu-items';
    import { DEADLINE_SOON, daysUntil } from '$lib/state/boards/board';
    import {
        clusters,
        focusLabel,
        groupFold,
        laneFacts,
        laneMarks,
        isBlocked,
        lanes,
        lanesIn,
        hubMovable,
        hubMoveOnto,
        pausesCountdown,
        projectLane,
        type FoldKey,
        type Id,
        type Lane,
        type Project,
        type Venue
    } from '$lib/state/boards/focus';
    import { t } from '$lib/state/shared/words/text';
    import { vocabOf } from '$lib/state/shared/words/tones';
    import { rootOf } from '$lib/state/shared/page/hubs';
    import { useState } from '$lib/state/client/use';

    const client = useState();
    const {
        selectors: { configMap },
        writes: { writeManifest }
    } = client;

    type Props = {
        now: number;
        /** The card id the instance's keyboard cursor holds, or null when it holds none. */
        cursor: string | null;
        /** The projects on each lane that the Focus filter keeps, by lane key. */
        items: Record<string, Project[]>;
        /** How many cards the Focus filter hides from each lane, by lane key. */
        hidden: Record<string, number>;
        /**
         * What a card is read against: the names of the people, every project of the portfolio and
         * every venue, which name what it waits on and its venue, and the user's ids, which give
         * its role.
         */
        known: {
            names: Record<Id, string>;
            projects: Record<Id, Project>;
            venues: Record<Id, Venue>;
            self: ReadonlySet<Id>;
        };
        onproject: (id: Id) => void;
        onsaid: (said: string) => void;
        /** Whether a fold of the Focus tab is open, and the press that turns it over. */
        isOpen: (key: FoldKey) => boolean;
        ontoggle: (key: FoldKey) => void;
    };

    let { now, cursor, items, hidden, known, onproject, onsaid, isOpen, ontoggle }: Props =
        $props();

    /** What a group's heading draws: its words, its glyph and hue where it has them, its count. */
    type GroupWords = { label: string; glyph?: string; tone?: string; count: number };

    const config = $derived(configMap());
    const board = $derived(lanes(vocabOf()));
    /** The clusters the lanes are drawn in, in drawing order, from the same words as the lanes. */
    const shown = $derived(clusters(vocabOf()));

    /** The lane a card is being dragged over, so it can light up; null while nothing is dragged. */
    let over = $state<string | null>(null);

    /** The project being dragged. */
    let dragging: { project: Project } | null = null;

    /** The words of the project's own hub. */
    function wordsAt(project: Project): Record<string, unknown> {
        return vocabOf(rootOf(project));
    }

    /** The deadline badge of a card: how overdue it is, how long is left, or the date itself. */
    function deadline(project: Project): { label: string; tone?: string } | null {
        const date = project.deadline;
        if (date === undefined || date === '') return null;
        const days = daysUntil(date, now);
        if (days === null || pausesCountdown(project, wordsAt(project))) return { label: date };
        if (days < 0) return { label: t('project.card.overdue', -days), tone: 'red' };
        if (days <= DEADLINE_SOON)
            return { label: t('project.card.due_days', days), tone: 'amber' };
        return { label: date };
    }

    /**
     * What a card says it is waiting on: the people and projects it names, each once
     * (waiting.ts `waitedOn`), else that it is blocked.
     */
    function waitLine(project: Project): string {
        const waited = waitedOn(project.waitingOn, known.names, known.projects);
        if (waited.length > 0) {
            return `${t('focus.wait_people')} ${waited.map((one) => one.label).join(', ')}`;
        }
        if (isBlocked(project, wordsAt(project))) return t('focus.wait_blocked');
        return '';
    }

    /**
     * The menu a card carries: every lane the card may move to (`hubMovable`), each by its key,
     * with the lane it sits on marked.
     */
    function menuFor(project: Project): MenuItem[] {
        const held = projectLane(project, vocabOf)?.key ?? '';
        return board
            .filter((lane) => hubMovable(project, lane, vocabOf))
            .map((lane) => ({ id: lane.key, label: lane.label, active: lane.key === held }));
    }

    /** Say what one write answered, on the board's one outcome line. */
    function said(answer: WriteAnswer): void {
        onsaid(answerWords(answer));
    }

    /** Picking a lane of the menu, named by its key, moves the card onto it (`move`). */
    async function choose(project: Project, key: string): Promise<void> {
        const lane = board.find((one) => one.key === key);
        if (lane !== undefined) await move(project, lane);
    }

    /**
     * Move a card onto a lane: the fields state/boards/focus.ts's hubMoveOnto gives, the stage or
     * the chips that put the card on that lane, in one manifest write, and nothing when it gives
     * none.
     */
    async function move(project: Project, lane: Lane): Promise<void> {
        const fields = hubMoveOnto(project, lane, vocabOf);
        if (fields === null) return;
        said(await writeManifest(project.id, fields));
    }

    function started(project: Project, event: DragEvent): void {
        dragging = { project };
        if (event.dataTransfer === null) return;
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', project.id);
    }

    function ended(): void {
        dragging = null;
        over = null;
    }

    /**
     * A lane that may not take the dragged project (`hubMovable`), a chip lane for a project at a
     * `terminal` stage among them, leaves the event alone, so the browser refuses the drop and the
     * lane does not light.
     */
    function draggedOver(lane: Lane, event: DragEvent): void {
        if (dragging === null || !hubMovable(dragging.project, lane, vocabOf)) return;
        event.preventDefault();
        if (event.dataTransfer !== null) event.dataTransfer.dropEffect = 'move';
        over = lane.key;
    }

    /** Dropping a card on a lane moves it there (`move`), and onto its own lane writes nothing. */
    async function dropped(lane: Lane, event: DragEvent): Promise<void> {
        if (dragging === null || !hubMovable(dragging.project, lane, vocabOf)) return;
        event.preventDefault();
        const held = dragging;
        ended();
        await move(held.project, lane);
    }
</script>

{#snippet lane(one: Lane, held: Project[], grid: boolean)}
    <div
        class="lane"
        class:lit={over === one.key}
        style={`--tone: var(--c-${one.tone})`}
        data-surface
    >
        <LaneHead
            label={one.label}
            glyph={one.icon}
            count={held.length}
            tone={one.tone}
            hidden={hidden[one.key] ?? 0}
        />
        <p class="lane-sub">{one.sub}</p>
        <div
            class="lane-body"
            class:grid
            role="list"
            ondragover={(event) => draggedOver(one, event)}
            ondragleave={() => (over = over === one.key ? null : over)}
            ondrop={(event) => dropped(one, event)}
        >
            {#each held as project (project.id)}
                <LaneCard
                    {project}
                    marks={laneMarks(project, one)}
                    facts={laneFacts(project, wordsAt(project), known.self, known.venues)}
                    label={focusLabel(project, config.focus_label_mode)}
                    current={cursor === project.id}
                    due={deadline(project)}
                    wait={waitLine(project)}
                    items={menuFor(project)}
                    onpick={(id: string) => void choose(project, id)}
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

{#snippet group(fold: FoldKey, head: GroupWords, muted: boolean, one: boolean, body: Snippet)}
    <GroupHead
        label={head.label}
        glyph={head.glyph}
        tone={head.tone}
        open={isOpen(fold)}
        ontoggle={() => ontoggle(fold)}
        count={head.count}
    >
        <div class="lanes" class:one class:muted>
            {@render body()}
        </div>
    </GroupHead>
{/snippet}

{#each shown as cluster (cluster.key)}
    {@const inCluster = lanesIn(board, cluster.key)}
    {@const glyph = cluster.glyph === '' ? undefined : t(cluster.glyph)}
    {#if cluster.layout === 'columns'}
        {#if inCluster.length > 0}
            {@const label = cluster.label === '' ? cluster.key : t(cluster.label)}
            {@const count = inCluster.reduce((sum, one) => sum + (items[one.key] ?? []).length, 0)}
            {#snippet columns()}
                {#each inCluster as one (one.key)}
                    <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                    {@render lane(one, items[one.key] ?? [], false)}
                {/each}
            {/snippet}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render group(
                groupFold('cluster', cluster.key),
                { label, glyph, count },
                cluster.muted,
                false,
                columns
            )}
        {/if}
    {:else}
        {#each inCluster as one (one.key)}
            {@const held = items[one.key] ?? []}
            {#snippet wide()}
                <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
                {@render lane(one, held, true)}
            {/snippet}
            <!-- eslint-disable-next-line @typescript-eslint/no-confusing-void-expression -- a render tag has no statement position -->
            {@render group(
                groupFold('lane', one.key),
                { label: one.label, glyph, tone: one.tone, count: held.length },
                cluster.muted,
                true,
                wide
            )}
        {/each}
    {/if}
{/each}

<style>
    /* The lanes fill the pane's width in as many columns as it holds, and one column in a pane
       narrower than a lane. */
    .lanes {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(290px, 100%), 1fr));
        gap: 8px;
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
    .lanes.muted .lane-sub,
    .lanes.muted .lane-body {
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
