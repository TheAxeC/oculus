<script lang="ts">
    // Layer 3, shared view. One session in four sections built as the sections under the Files tree
    // are (SessionSection.svelte): Details, what the session is in three groups of one-line rows,
    // with the controls that rename, pin and resume it on its head (details/DetailsSection.svelte);
    // Changes, the files it touched and the repository it works in, each a group row of the tree
    // (changes/ChangesSection.svelte); Timeline, the turns it took and what happened in each
    // (TimelineTurns.svelte); and Agents, the subagents it dispatched (AgentRows.svelte). The
    // Sessions tab of the Explorer and a Session tab both draw it, each for the session it shows.
    //
    // The tab that draws it keeps which sections are closed and the order they are drawn in with
    // its own state (session-sections.ts), so a reload, a switch of tab and a pick of another
    // session keep them, and keeps the folds of the sections' group rows in its view state the same
    // way. Each head is dragged among the others, and moved by Alt+Up and Alt+Down, with the drag
    // the Files view moves its section heads with
    // (views/shared/explorer/sections/list-drag.svelte.ts). The Sessions tab hands in `fields`, the
    // title field it keeps open, so Details' field and the list's are one at a time, and `divided`,
    // since its divider stands right above the sections, so the first section in the order draws
    // no line across its head's top edge; a Session tab hands neither.

    import { createListDrag } from '$lib/views/shared/explorer/sections/list-drag.svelte';
    import type { GroupedSession } from '$lib/state/client/selectors.svelte';
    import { newestFirst, timelineTurns } from '$lib/state/sessions/folds';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import AgentRows from './AgentRows.svelte';
    import ChangesSection from './changes/ChangesSection.svelte';
    import DetailsSection from './details/DetailsSection.svelte';
    import SessionSection from './SessionSection.svelte';
    import TimelineTurns from './TimelineTurns.svelte';
    import type { TitleFields } from './title-field';
    import {
        rowKey,
        sectionIsOpen,
        sectionOrder,
        sectionToggled,
        sectionsOrdered,
        type SectionId
    } from './session-sections';

    const {
        layout: { instanceLayoutState, restateInstance }
    } = useState();

    type Props = {
        /** The tab that keeps the sections' state. */
        owner: string;
        /** The session the sections show. */
        record: GroupedSession;
        /** The title field the tab keeps open, for a tab that also draws the list's. */
        fields?: TitleFields;
        /** Whether the tab draws a line right above the sections. */
        divided?: boolean;
    };

    let { owner, record, fields, divided = false }: Props = $props();

    const saved = $derived(instanceLayoutState(owner));
    const order = $derived(sectionOrder(saved));
    const turns = $derived(timelineTurns(record.timeline));
    /** Newest first by the moment each started, an agent with no stamp last. */
    const agents = $derived(newestFirst(record.agents));

    /** The drags and the Alt+Up and Alt+Down steps of the section heads over each other. */
    const sectionDrag = createListDrag({
        type: 'application/x-oculus-session-section',
        order: () => order,
        drawn: () => order,
        write: (next: string[]) => restateInstance(owner, sectionsOrdered(saved, next))
    });
    const move = (id: SectionId) => ({
        drag: sectionDrag.row(id),
        step: (direction: 'up' | 'down') => sectionDrag.step(id, direction)
    });

    function toggle(id: SectionId): void {
        restateInstance(owner, sectionToggled(saved, id));
    }

    /** Whether a section stands right under the tab's line, and so draws none of its own. */
    function underLine(id: SectionId): boolean {
        return divided && order[0] === id;
    }
</script>

<div class="sections">
    {#each order as id (id)}
        {#if id === 'details'}
            <DetailsSection
                {record}
                {fields}
                open={sectionIsOpen(saved, id)}
                ontoggle={() => toggle(id)}
                move={move(id)}
                noTopLine={underLine(id)}
            />
        {:else if id === 'changes'}
            <ChangesSection
                {owner}
                {record}
                open={sectionIsOpen(saved, id)}
                ontoggle={() => toggle(id)}
                move={move(id)}
                noTopLine={underLine(id)}
            />
        {:else if id === 'timeline'}
            <SessionSection
                {id}
                label={t('sessions.section_timeline')}
                count={turns.length}
                rows={[]}
                open={sectionIsOpen(saved, id)}
                ontoggle={() => toggle(id)}
                move={move(id)}
                noTopLine={underLine(id)}
            >
                {#snippet body()}
                    <li role="none">
                        <TimelineTurns {record} place={order.indexOf(id)} />
                    </li>
                {/snippet}
            </SessionSection>
        {:else if id === 'agents'}
            <SessionSection
                {id}
                label={t('sessions.section_agents')}
                count={agents.length}
                rows={agents.map((agent) => ({ id: rowKey('agent', agent.id), parent: 'head' }))}
                open={sectionIsOpen(saved, id)}
                ontoggle={() => toggle(id)}
                move={move(id)}
                noTopLine={underLine(id)}
            >
                {#snippet body(nav)}
                    <AgentRows {agents} session={record} {nav} />
                {/snippet}
            </SessionSection>
        {/if}
    {/each}
</div>

<style>
    /* The sections' words are the size of a sidebar's, `--fs-sm`, the boxes to type in among them.
       Each section's head stands at the tree's own heading size, `--tree-heading-font`, and a
       section's own sizes (a group row, a row, a line of the commit box) stand as each section
       sets them. */
    .sections {
        display: flex;
        flex-direction: column;
        min-width: 0;
        font-size: var(--fs-sm);
    }

    .sections :global(.oculus-field) {
        font-size: var(--fs-sm);
    }

    /* The terminal shape: one face for all the sections, so the columns of each line up. */
    :global(body.rice:where(:not(.rice-sans))) .sections {
        font-family: var(--font-mono);
    }
</style>
