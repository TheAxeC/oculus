<script module lang="ts">
    // Layer 3, view registration. The Session view is the tab a pinned session opens: it stands in
    // no arrangement, and closes the Explorer's group, so the catalogue lists it last and a press
    // there opens it as a document (state/client/context.ts `registerOpened`).
    import type { ViewRegistration } from '$lib/state/workbench/navigation/registry';
    export const registration: ViewRegistration = {
        id: 'session-detail',
        label: 'sessions.detail_title',
        glyph: 'sessions.detail_glyph',
        group: 'explorer',
        order: 11,
        opened: true
    };
</script>

<script lang="ts">
    // Layer 3, view. One session in a tab of its own, drawn in the sections the Sessions tab draws
    // (views/shared/sessions/sections/SessionSections.svelte). One picker in the bar picks the
    // session they show. With no session the view asks for one and draws no section. The pane's
    // toolbar opens the Transcript of the session, which is a view of its own.

    import PickSession from '$lib/views/shared/sessions/PickSession.svelte';
    import SessionPicker from '$lib/views/shared/sessions/SessionPicker.svelte';
    import SessionSections from '$lib/views/shared/sessions/sections/SessionSections.svelte';
    import Pane from '$lib/ui/frame/Pane.svelte';
    import ToolButton from '$lib/ui/controls/ToolButton.svelte';
    import Toolbar from '$lib/ui/frame/toolbar/Toolbar.svelte';
    import { pinnedSession } from '$lib/state/workbench/selection.svelte';
    import { t } from '$lib/state/shared/words/text';
    import type { ViewProps } from '$lib/state/workbench/navigation/registry';
    import { useState } from '$lib/state/client/use';

    const {
        layout: { instanceLayoutState },
        selectors: { sessionFor },
        terminals: { openSession }
    } = useState();

    let { instance }: ViewProps = $props();

    const record = $derived(sessionFor(instance.id));
    const panePin = $derived(pinnedSession(instanceLayoutState(instance.id)));

    /** Open the turns of the session on screen, for a session the pane still holds. */
    function openTranscript(): void {
        if (record === null) return;
        openSession({ session: record.id, label: record.title });
    }
</script>

{#snippet tools()}
    <Toolbar label={t('sessions.detail_title')} overflow>
        <ToolButton
            bare
            label={t('sessions.view_transcript')}
            glyph={t('sessions.transcript_glyph')}
            onclick={openTranscript}
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
    large
    toolbar={panePin !== null && record !== null ? tools : undefined}
    {bar}
    tinted
>
    <div class="session" data-instance={instance.id}>
        {#if record === null}
            <PickSession message={t('sessions.detail_empty')} glyph={t('sessions.empty_glyph')} />
        {:else}
            <SessionSections owner={instance.id} {record} />
        {/if}
    </div>
</Pane>

<style>
    /* The pane's title stands one step above the sections' words, `--fs-md`. */
    .session {
        min-width: 0;
        font-size: var(--fs-sm);
    }
</style>
