<script lang="ts">
    // Layer 3, shared view. One session in four sections built as the sections under the Files tree
    // are (SessionSection.svelte): Details, what the session is and the controls that pin, rename
    // and resume it (DetailsBody.svelte); Changes, the files it touched and the repository it works
    // in (ChangesTouched.svelte, ChangesRepository.svelte); Timeline, the turns it took and what
    // happened in each (TimelineTurns.svelte); and Agents, the subagents it dispatched
    // (AgentRows.svelte). The Sessions tab of the Explorer and a Session tab both draw it, each for
    // the session it shows.
    //
    // The tab that draws it keeps which sections are closed and the order they are drawn in with
    // its own state (session-sections.ts), so a reload, a switch of tab and a pick of another
    // session keep them. Each head is dragged among the others, and moved by Alt+Up and Alt+Down,
    // with the drag the Files view moves its section heads with
    // (views/shared/explorer/sections/list-drag.svelte.ts).

    import { createListDrag } from '$lib/views/shared/explorer/sections/list-drag.svelte';
    import type { GroupedSession } from '$lib/state/client/selectors.svelte';
    import { newestFirst, timelineTurns } from '$lib/state/sessions/folds';
    import { t } from '$lib/state/shared/words/text';
    import { useState } from '$lib/state/client/use';
    import AgentRows from './AgentRows.svelte';
    import ChangesRepository from './ChangesRepository.svelte';
    import ChangesTouched from './ChangesTouched.svelte';
    import DetailsBody from './DetailsBody.svelte';
    import SessionSection from './SessionSection.svelte';
    import TimelineTurns from './TimelineTurns.svelte';
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

    /** `owner` is the tab that keeps the sections' state; `record` the session they show. */
    let { owner, record }: { owner: string; record: GroupedSession } = $props();

    const saved = $derived(instanceLayoutState(owner));
    const order = $derived(sectionOrder(saved));
    const files = $derived(record.files);
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
</script>

<div class="sections">
    {#each order as id (id)}
        {#if id === 'details'}
            <SessionSection
                {id}
                label={t('sessions.section_details')}
                rows={[]}
                open={sectionIsOpen(saved, id)}
                ontoggle={() => toggle(id)}
                move={move(id)}
            >
                {#snippet body()}
                    <DetailsBody {record} />
                {/snippet}
            </SessionSection>
        {:else if id === 'changes'}
            <SessionSection
                {id}
                label={t('sessions.section_changes')}
                count={files.length}
                rows={files.map((file) => rowKey('file', file.path))}
                open={sectionIsOpen(saved, id)}
                ontoggle={() => toggle(id)}
                move={move(id)}
            >
                {#snippet body(nav)}
                    <ChangesTouched
                        recordId={record.id}
                        {files}
                        workspace={record.workspace}
                        {nav}
                    />
                    <li role="none">
                        <ChangesRepository {record} />
                    </li>
                {/snippet}
            </SessionSection>
        {:else if id === 'timeline'}
            <SessionSection
                {id}
                label={t('sessions.section_timeline')}
                count={turns.length}
                rows={[]}
                open={sectionIsOpen(saved, id)}
                ontoggle={() => toggle(id)}
                move={move(id)}
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
                rows={agents.map((agent) => rowKey('agent', agent.id))}
                open={sectionIsOpen(saved, id)}
                ontoggle={() => toggle(id)}
                move={move(id)}
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
       section's own sizes (a label, a sub-heading, a row) stand as each section sets them. */
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
