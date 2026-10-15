<script module lang="ts">
    // Layer 3, view registration. The Session view opens the right pane of the Sessions page and
    // follows Timeline in its group.
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'session-detail',
        label: 'sessions.detail_title',
        glyph: 'sessions.detail_glyph',
        group: 'sessions',
        order: 4
    };
</script>

<script lang="ts">
    // Layer 3, view. One session in a tab of its own, in three sections built as the sections under
    // the Files tree are (SessionSection.svelte): Details, what the session is and the controls
    // that pin, rename and resume it (DetailsBody.svelte); Changes, the files it touched and the
    // repository it works in (ChangesTouched.svelte, ChangesRepository.svelte); and Agents, the
    // subagents it dispatched (AgentRows.svelte). One picker in the bar picks the session all
    // three show. With no session the view asks for one and draws no section.
    //
    // The tab keeps which sections are closed and the order they are drawn in with its own state
    // (session-sections.ts), so a reload, a switch of tab and a pick of another session keep them.
    // Each head is dragged among the others, and moved by Alt+Up and Alt+Down, with the drag the
    // Files view moves its section heads with (views/shared/explorer/sections/list-drag.svelte.ts).
    // The pane's toolbar opens the Transcript and the Timeline of the session, which are views of
    // their own.

    import PickSession from '$lib/views/shared/sessions/PickSession.svelte';
    import SessionPicker from '$lib/views/shared/sessions/SessionPicker.svelte';
    import { createListDrag } from '$lib/views/shared/explorer/sections/list-drag.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import { pinnedSession } from '$lib/state/workbench/selection.svelte';
    import { newestFirst } from '$lib/state/sessions/folds';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';
    import AgentRows from './AgentRows.svelte';
    import ChangesRepository from './ChangesRepository.svelte';
    import ChangesTouched from './ChangesTouched.svelte';
    import DetailsBody from './DetailsBody.svelte';
    import SessionSection from './SessionSection.svelte';
    import {
        rowKey,
        sectionIsOpen,
        sectionOrder,
        sectionToggled,
        sectionsOrdered,
        type SectionId
    } from './session-sections';

    const {
        layout: { instanceLayoutState, openView, restateInstance },
        selectors: { sessionFor }
    } = useState();

    let { instance }: ViewProps = $props();

    const record = $derived(sessionFor(instance.id));
    const saved = $derived(instanceLayoutState(instance.id));
    const panePin = $derived(pinnedSession(saved));
    const order = $derived(sectionOrder(saved));
    const files = $derived(record?.files ?? []);
    /** Newest first by the moment each started, an agent with no stamp last. */
    const agents = $derived(newestFirst(record?.agents ?? []));

    /** The drags and the Alt+Up and Alt+Down steps of the section heads over each other. */
    const sectionDrag = createListDrag({
        type: 'application/x-oculus-session-section',
        order: () => order,
        drawn: () => order,
        write: (next: string[]) => restateInstance(instance.id, sectionsOrdered(saved, next))
    });
    const move = (id: SectionId) => ({
        drag: sectionDrag.row(id),
        step: (direction: 'up' | 'down') => sectionDrag.step(id, direction)
    });

    function toggle(id: SectionId): void {
        restateInstance(instance.id, sectionToggled(saved, id));
    }

    /** Open one pinned area of the session on screen, for a session the pane still holds. */
    function pin(area: string): void {
        if (record === null) return;
        openView(area, { session: record.id, label: record.title });
    }
</script>

{#snippet tools()}
    <Toolbar label={t('sessions.detail_title')} overflow>
        <ToolButton
            bare
            label={t('sessions.view_transcript')}
            glyph={t('sessions.transcript_glyph')}
            onclick={() => pin('transcript')}
        />
        <ToolButton
            bare
            label={t('sessions.view_timeline')}
            glyph={t('sessions.timeline_glyph')}
            onclick={() => pin('timeline')}
        />
    </Toolbar>
{/snippet}

{#snippet bar()}
    <Toolbar label={t('sessions.detail_bar')}>
        <SessionPicker instance={instance.id} />
    </Toolbar>
{/snippet}

<Pane
    title={t('sessions.detail_title')}
    toolbar={panePin !== null && record !== null ? tools : undefined}
    {bar}
    tinted
>
    <div class="session" data-instance={instance.id}>
        {#if record === null}
            <PickSession message={t('sessions.detail_empty')} glyph={t('sessions.empty_glyph')} />
        {:else}
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
                {:else}
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
        {/if}
    </div>
</Pane>

<style>
    .session {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }

    /* The terminal shape: one face for the whole view, so the columns of every section line up. */
    :global(body.rice) .session {
        font-family: var(--font-mono);
    }
</style>
