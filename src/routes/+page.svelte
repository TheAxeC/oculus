<script lang="ts">
    // The bare page of migration step 2: it opens the socket, subscribes to the two channels this
    // step carries, and shows enough of the snapshot to see it arrive and see the version tick when
    // a manifest is edited. The shell replaces it in O8 and none of this markup survives.
    import { onMount } from 'svelte';
    import { portfolio } from '$lib/state/entities.svelte';
    import { connect, disconnect, status } from '$lib/state/socket.svelte';
    import { t } from '$lib/state/text';

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

    onMount(() => {
        connect(['portfolio', 'config']);
        return () => disconnect();
    });
</script>

<h1>{t('app.title')}</h1>
<p>{t('app.socket', socketLabel())}</p>

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
