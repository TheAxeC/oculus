<script module lang="ts">
    // Layer 3, view registration. Status opens the system group.
    import type { ViewRegistration } from './registry';
    export const registration: ViewRegistration = {
        id: 'status',
        label: 'views.status',
        glyph: 'views.status_glyph',
        group: 'system',
        order: 0
    };
</script>

<script lang="ts">
    // Layer 3, view. What the page knows: whether the socket is up, which snapshot it is holding,
    // and how many of each entity that snapshot carries. It is the smallest real view there is and
    // it is the one that says whether the data layer underneath is alive.

    import Pane from '$lib/ui/Pane.svelte';
    import { t } from '$lib/state/text';
    import Hooks from './status/Hooks.svelte';
    import type { ViewProps } from './registry';
    import { useState } from '$lib/state/use';

    const {
        entities: { git, portfolio, sessions },
        socket: { status }
    } = useState();

    let { instance }: ViewProps = $props();

    const snapshot = $derived(portfolio());
    // The two live channels are counted so the screen shows that both are arriving.
    const records = $derived(sessions()?.records ?? []);
    const live = $derived(records.filter((record) => record.live).length);
    const workspaces = $derived(Object.keys(git() ?? {}).length);

    function socketLabel(): string {
        const state = status();
        if (state === 'connecting') return t('app.socket_connecting');
        if (state === 'open') return t('app.socket_open');
        return t('app.socket_closed');
    }

    /**
     * The entity kinds the snapshot keys by id. `feeds` and `career` are summaries of one file
     * each rather than maps of entities, so they are not counted.
     */
    type Counted =
        'projects' | 'venues' | 'datasets' | 'pillars' | 'domains' | 'funding' | 'collections';

    function count(kind: Counted): number {
        return snapshot === null ? 0 : Object.keys(snapshot.entities[kind]).length;
    }

    /**
     * The page's own origin, which is the server that printed it: the hooks block posts back there.
     * The page renders in the browser alone (routes/+layout.ts sets ssr = false), so the empty
     * answer belongs to a render with no location and Hooks draws nothing for it.
     */
    function servedOrigin(): string {
        return typeof location === 'undefined' ? '' : location.origin;
    }
</script>

<!-- The box every view has; this one draws its lines straight into it, so it asks for the tint. -->
<Pane title={t('views.status')} tinted>
    <div class="view" data-instance={instance.id}>
        <p class="socket">{t('app.socket', socketLabel())}</p>
        {#if snapshot === null}
            <p>{t('app.waiting')}</p>
        {:else}
            <p>{t('app.version', snapshot.version)}</p>
            <ul>
                <li>{t('app.projects', count('projects'))}</li>
                <li>{t('app.venues', count('venues'))}</li>
                <li>{t('app.datasets', count('datasets'))}</li>
                <li>{t('app.pillars', count('pillars'))}</li>
                <li>{t('app.domains', count('domains'))}</li>
                <li>{t('app.funding', count('funding'))}</li>
                <li>{t('app.collections', count('collections'))}</li>
            </ul>
        {/if}
        <p>{t('app.sessions', records.length, live)}</p>
        <p>{t('app.git', workspaces)}</p>
        <Hooks origin={servedOrigin()} />
    </div>
</Pane>

<style>
    .view {
        height: 100%;
        overflow: auto;
        padding: 12px 16px;
        box-sizing: border-box;
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-md);
    }

    .socket {
        color: var(--muted-txt, var(--muted));
    }

    ul {
        margin: 0;
        padding-left: 18px;
    }
</style>
