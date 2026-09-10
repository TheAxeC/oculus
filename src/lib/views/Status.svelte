<script lang="ts">
    // Layer 3, view. What the page knows: whether the socket is up, which snapshot it is holding,
    // and how many of each entity that snapshot carries. It is the smallest real view there is and
    // it is the one that says whether the data layer underneath is alive.

    import { portfolio } from '$lib/state/entities.svelte';
    import { status } from '$lib/state/socket.svelte';
    import { t } from '$lib/state/text';
    import type { ViewProps } from './registry';

    let { instance }: ViewProps = $props();

    const snapshot = $derived(portfolio());

    function socketLabel(): string {
        const state = status();
        if (state === 'connecting') return t('app.socket_connecting');
        if (state === 'open') return t('app.socket_open');
        return t('app.socket_closed');
    }

    function count(kind: keyof NonNullable<typeof snapshot>['entities']): number {
        return snapshot === null ? 0 : Object.keys(snapshot.entities[kind]).length;
    }
</script>

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
            <li>{t('app.programs', count('programs'))}</li>
            <li>{t('app.domains', count('domains'))}</li>
            <li>{t('app.funding', count('funding'))}</li>
            <li>{t('app.collections', count('collections'))}</li>
        </ul>
    {/if}
</div>

<style>
    .view {
        height: 100%;
        overflow: auto;
        padding: 12px 16px;
        box-sizing: border-box;
        color: var(--ink-txt, var(--ink));
        font-size: var(--fs-lg);
    }

    .socket {
        color: var(--muted-txt, var(--muted));
    }

    ul {
        margin: 0;
        padding-left: 18px;
    }
</style>
